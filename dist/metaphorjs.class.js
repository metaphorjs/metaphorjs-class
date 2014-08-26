(function(){
"use strict"

window.MetaphorJs = {
    lib: {}
};


var slice = Array.prototype.slice;
var isFunction = function(value) {
    return typeof value === 'function';
};(function(){

    "use strict";

    /**
     * @namespace MetaphorJs
     */

    var root        = typeof window != "undefined" ? window : global,
        cache       = {};

    var parseNs     = function(ns) {

        var tmp     = ns.split("."),
            i,
            last    = tmp.pop(),
            parent  = tmp.join("."),
            len     = tmp.length,
            name,
            current = root;

        if (cache[parent]) {
            return [cache[parent], last];
        }

        for (i = 0; i < len; i++) {

            name    = tmp[i];

            if (!current[name]) {
                current[name]   = {};
            }

            current = current[name];
        }

        return [current, last];
    };

    /**
     * Get namespace/cache object
     * @function MetaphorJs.ns.get
     * @param {string} ns
     * @param {bool} cacheOnly
     * @returns {object} constructor
     */
    var get       = function(ns, cacheOnly) {

        if (cache[ns] || cacheOnly) {
            return cache[ns];
        }

        var tmp     = ns.split("."),
            i,
            len     = tmp.length,
            name,
            current = root;

        for (i = 0; i < len; i++) {

            name    = tmp[i];

            if (!current[name]) {
                return null;
            }

            current = current[name];
        }

        if (current) {
            cache[ns] = current;
        }

        return current;
    };

    /**
     * Register class constructor
     * @function MetaphorJs.ns.register
     * @param {string} ns
     * @param {*} fn
     */
    var register    = function(ns, fn) {

        var parse   = parseNs(ns),
            parent  = parse[0],
            name    = parse[1];

        parent[name]    = fn;
        cache[ns]       = fn;

        return fn;
    };

    /**
     * Class exists
     * @function MetaphorJs.ns.exists
     * @param {string} ns
     * @returns boolean
     */
    var exists      = function(ns) {
        return cache[ns] ? true : false;
    };

    /**
     * Add constructor to cache
     * @function MetaphorJs.ns.add
     * @param {string} ns
     * @param {function} c
     */
    var add = function(ns, c) {
        cache[ns] = c;
        return c;
    };

    MetaphorJs.ns = {
        register:   register,
        exists:     exists,
        get:        get,
        add:        add,
        /**
         * Remove constructor from cache
         * @function MetaphorJs.ns.remove
         * @param {string} ns
         */
        remove:     function(ns) {
            delete cache[ns];
        }
    };


}());



/*!
 * inspired by and based on klass
 */

(function(){

    "use strict";

    var namespace   = namespace || MetaphorJs.ns;

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

            var fn          = constructorFn || function() {
                var self = this;
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
                    return typeof ret == "object" ? ret : inst;
                };
            }(fn);

            return fn;
        };


    /**
     * Define class
     * @function MetaphorJs.define
     * @param {string} ns
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
     * @param {string} ns
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
     * @param {string} ns
     * @param {string} parentClass
     * @param {function} constructor
     * @param {object} definition (optional)
     * @param {object} statics (optional)
     * @param {bool} cacheOnly (optional)
     * @return function New class constructor
     * @alias MetaphorJs.d
     */
    var define = function(ns, parentClass, constructor, definition, statics, cacheOnly) {

        if (ns === null) {
            ns = "";
        }

        // constructor as first argument
        if (typeof ns == "function") {

            statics         = constructor;

            if (typeof parentClass == "string") {
                statics     = definition;
                definition  = constructor;
            }
            else {
                definition      = parentClass;
                constructor     = ns;
                parentClass     = null;
            }

            ns              = null;
        }
        // definition as first argument
        else if (typeof ns != "string") {
            statics         = parentClass;
            definition      = ns;
            parentClass     = null;
            constructor     = null;
            ns              = null;
        }

        if (typeof parentClass != "string" && typeof parentClass != "function") {
            statics         = definition;
            definition      = constructor;
            constructor     = parentClass;
            parentClass     = null;
        }

        if (typeof constructor != "function") {
            statics         = definition;
            definition      = constructor;
            constructor     = null;
        }

        definition          = definition || {};
        var pConstructor    = parentClass && typeof parentClass == "string" ?
                              namespace.get(parentClass) :
                              parentClass;

        if (parentClass && !pConstructor) {
            throw new Error(parentClass + " not found");
        }

        var c   = pConstructor ? extend(pConstructor, definition, constructor) : create(definition, constructor);

        c.__isMetaphorClass = true;
        c.__parent          = pConstructor;
        c.__parentClass     = pConstructor ? pConstructor.__class : null;
        c.__class           = ns;

        if (statics) {
            for (var k in statics) {
                if (statics.hasOwnProperty(k)) {
                    c[k] = statics[k];
                }
            }
        }

        if (ns) {
            if (!cacheOnly) {
                namespace.register(ns, c);
            }
            else {
                namespace.add(ns, c);
            }
        }

        if (statics && statics.alias) {
            namespace.add(statics.alias, c);
        }

        return c;
    };



    /**
     * @function MetaphorJs.defineCache
     * Same as define() but this one only puts object to cache without registering namespace
     */
    var defineCache = function(ns, parentClass, constructor, definition, statics) {
        return define(ns, parentClass, constructor, definition, statics, true);
    };



    /**
     * Instantiate class
     * @function MetaphorJs.create
     * @param {string} ns Full name of the class
     */
    var instantiate = function(ns) {

        var cls     = namespace.get(ns),
            args    = slice.call(arguments, 1);

        if (!cls) {
            throw new Error(ns + " not found");
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
        var _cls    = typeof cls == "string" ? namespace.get(cls) : cls;
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
            g   = namespace.get;

        if (typeof parent != "string") {
            parent  = parent.getClass ? parent.getClass() : parent.prototype.constructor.__class;
        }
        if (typeof child == "string") {
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

    MetaphorJs.define = define;
    MetaphorJs.defineCache = defineCache;
    MetaphorJs.factory = instantiate;
    MetaphorJs.isInstanceOf = isInstanceOf;
    MetaphorJs.isSubclassOf = isSubclassOf;

}());
}());