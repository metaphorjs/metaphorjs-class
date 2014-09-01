define("metaphorjs-class", ['metaphorjs-namespace'], function(Namespace) {

var isFunction = function(value) {
    return typeof value === 'function';
};
var isString = function(value) {
    return typeof value == "string";
};
var isObject = function(value) {
    return value != null && typeof value === 'object';
};

var slice = Array.prototype.slice;


/*!
 * inspired by and based on klass
 */

var Class = function(ns){

    if (!ns) {
        ns = new Namespace;
    }


    /**
     * @namespace MetaphorJs
     */

    var proto   = "prototype",

        create  = function(cls, constructor) {
            return extend(function(){}, cls, constructor);
        },

        wrap    = function(parent, k, fn) {

            return function() {
                var ret     = undefined,
                    prev    = this.supr;

                this.supr   = parent[proto][k] || function(){};

                try {
                    ret     = fn.apply(this, arguments);
                }
                catch(thrownError) {}

                this.supr   = prev;
                return ret;
            };
        },

        process = function(what, o, parent) {
            for (var k in o) {
                if (o.hasOwnProperty(k)) {
                    what[k] = isFunction(o[k]) && parent[proto] && isFunction(parent[proto][k]) ?
                              wrap(parent, k, o[k]) :
                              o[k];
                }
            }
        },

        extend  = function(parent, cls, constructorFn) {

            var noop        = function(){};
            noop[proto]     = parent[proto];
            var prototype   = new noop;

            var fn          = function() {
                var self = this;
                if (constructorFn) {
                    constructorFn.apply(self, arguments);
                }
                if (self.initialize) {
                    self.initialize.apply(self, arguments);
                }
            };

            process(prototype, cls, parent);
            fn[proto]   = prototype;
            fn[proto].constructor = fn;
            fn[proto].getClass = function() {
                return this.__proto__.constructor.__class;
            };
            fn[proto].getParentClass = function() {
                return this.__proto__.constructor.__parentClass;
            };
            fn.__instantiate = function(fn) {

                return function() {
                    var Temp = function(){},
                        inst, ret;

                    Temp.prototype  = fn.prototype;
                    inst            = new Temp;
                    ret             = fn.prototype.constructor.apply(inst, arguments);

                    // If an object has been returned then return it otherwise
                    // return the original instance.
                    // (consistent with behaviour of the new operator)
                    return isObject(ret) ? ret : inst;
                };
            }(fn);

            return fn;
        };


    /**
     * Define class
     * @function MetaphorJs.define
     * @param {string} name
     * @param {function} constructor
     * @param {object} definition (optional)
     * @param {object} statics (optional)
     * @param {bool} cacheOnly (optional)
     * @return function New class constructor
     * @alias MetaphorJs.d
     */

    /**
     * Define class
     * @function MetaphorJs.define
     * @param {function} constructor
     * @param {object} definition (optional)
     * @param {object} statics (optional)
     * @param {bool} cacheOnly (optional)
     * @return function New class constructor
     * @alias MetaphorJs.d
     */

    /**
     * Define class
     * @function MetaphorJs.define
     * @param {string} name
     * @param {object} definition
     * @param {object} statics (optional)
     * @param {bool} cacheOnly (optional)
     * @return function New class constructor
     * @alias MetaphorJs.d
     */

    /**
     * Define class
     * @function MetaphorJs.define
     * @param {object} definition
     * @param {object} statics (optional)
     * @param {bool} cacheOnly (optional)
     * @return function New class constructor
     * @alias MetaphorJs.d
     */

    /**
     * Define class
     * @function MetaphorJs.define
     * @param {string} name
     * @param {string} parentClass
     * @param {function} constructor
     * @param {object} definition (optional)
     * @param {object} statics (optional)
     * @param {bool} cacheOnly (optional)
     * @return function New class constructor
     * @alias MetaphorJs.d
     */
    var define = function(name, parentClass, constructor, definition, statics, cacheOnly) {

        if (name === null) {
            name = "";
        }

        // constructor as first argument
        if (isFunction(name)) {

            statics         = constructor;

            if (isString(parentClass)) {
                statics     = definition;
                definition  = constructor;
            }
            else {
                definition      = parentClass;
                constructor     = name;
                parentClass     = null;
            }

            name              = null;
        }

        // definition as first argument
        else if (!isString(name)) {
            statics         = parentClass;
            definition      = name;
            parentClass     = null;
            constructor     = null;
            name            = null;
        }

        // if object is second parameter (leads to next check)
        if (!isString(parentClass) && !isFunction(parentClass)) {
            statics         = definition;
            definition      = constructor;
            constructor     = parentClass;
            parentClass     = null;
        }

        // if third parameter is not a function (definition instead of constructor)
        if (!isFunction(constructor)) {
            statics         = definition;
            definition      = constructor;
            constructor     = null;
        }

        definition          = definition || {};
        var pConstructor    = parentClass && isString(parentClass) ?
                                ns.get(parentClass) :
                                parentClass;

        if (parentClass && !pConstructor) {
            throw new Error(parentClass + " not found");
        }

        var c   = pConstructor ? extend(pConstructor, definition, constructor) : create(definition, constructor);

        c.__isMetaphorClass = true;
        c.__parent          = pConstructor;
        c.__parentClass     = pConstructor ? pConstructor.__class : null;
        c.__class           = name;

        if (statics) {
            for (var k in statics) {
                if (statics.hasOwnProperty(k)) {
                    c[k] = statics[k];
                }
            }
        }

        if (name) {
            if (!cacheOnly) {
                ns.register(name, c);
            }
            else {
                ns.add(name, c);
            }
        }

        if (statics && statics.alias) {
            ns.add(statics.alias, c);
        }

        return c;
    };



    /**
     * @function MetaphorJs.defineCache
     * Same as define() but this one only puts object to cache without registering namespace
     */
    var defineCache = function(name, parentClass, constructor, definition, statics) {
        return define(name, parentClass, constructor, definition, statics, true);
    };



    /**
     * Instantiate class
     * @function MetaphorJs.create
     * @param {string} name Full name of the class
     */
    var instantiate = function(name) {

        var cls     = ns.get(name),
            args    = slice.call(arguments, 1);

        if (!cls) {
            throw new Error(name + " not found");
        }

        return cls.__instantiate.apply(this, args);
    };



    /**
     * Is cmp instance of cls
     * @function MetaphorJs.is
     * @param {object} cmp
     * @param {string|object} cls
     * @returns boolean
     */
    var isInstanceOf = function(cmp, cls) {
        var _cls    = isString(cls) ? ns.get(cls) : cls;
        return _cls ? cmp instanceof _cls : false;
    };



    /**
     * Is one class subclass of another class
     * @function MetaphorJs.isSubclass
     * @param {object} child
     * @param {string|object} parent
     * @return bool
     * @alias MetaphorJs.iss
     */
    var isSubclassOf = function(child, parent) {

        var p   = child,
            g   = ns.get;

        if (!isString(parent)) {
            parent  = parent.getClass ? parent.getClass() : parent.prototype.constructor.__class;
        }
        if (isString(child)) {
            p   = g(child);
        }

        while (p) {
            if (p.prototype.constructor.__class == parent) {
                return true;
            }
            if (p) {
                p = p.getParentClass ? g(p.getParentClass()) : p.__parent;
            }
        }

        return false;
    };

    var self    = this;

    self.factory = instantiate;
    self.isSubclassOf = isSubclassOf;
    self.isInstanceOf = isInstanceOf;
    self.define = define;
    self.defineCache = defineCache;

};

Class.prototype = {

    factory: null,
    isSubclassOf: null,
    isInstanceOf: null,
    define: null,
    defineCache: null

};



return Class;
});
