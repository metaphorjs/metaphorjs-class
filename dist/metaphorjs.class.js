(function(){
"use strict";

var MetaphorJs = {
    lib: {},
    cmp: {},
    view: {}
};

var isFunction = function(value) {
    return typeof value == 'function';
};
var toString = Object.prototype.toString;
var undf = undefined;



var varType = function(){

    var types = {
        '[object String]': 0,
        '[object Number]': 1,
        '[object Boolean]': 2,
        '[object Object]': 3,
        '[object Function]': 4,
        '[object Array]': 5,
        '[object RegExp]': 9,
        '[object Date]': 10
    };


    /**
        'string': 0,
        'number': 1,
        'boolean': 2,
        'object': 3,
        'function': 4,
        'array': 5,
        'null': 6,
        'undefined': 7,
        'NaN': 8,
        'regexp': 9,
        'date': 10
    */

    return function(val) {

        if (!val) {
            if (val === null) {
                return 6;
            }
            if (val === undf) {
                return 7;
            }
        }

        var num = types[toString.call(val)];

        if (num === undf) {
            return -1;
        }

        if (num == 1 && isNaN(val)) {
            num = 8;
        }

        return num;
    };

}();


var isString = function(value) {
    return varType(value) === 0;
};


var isObject = function(value) {
    return value !== null && typeof value == "object" && varType(value) > 2;
};




/**
 * @param {Object} root optional; usually window or global
 * @param {String} rootName optional. If you want custom object to be root and
 * this object itself if the first level of namespace:<br>
 * <pre><code class="language-javascript">
 * var ns = MetaphorJs.lib.Namespace(window);
 * ns.register("My.Test", something); // -> window.My.Test
 * var privateNs = {};
 * var ns = new MetaphorJs.lib.Namespace(privateNs, "privateNs");
 * ns.register("privateNs.Test", something); // -> privateNs.Test
 * </code></pre>
 * @constructor
 */
var Namespace   = function(root, rootName) {

    var cache   = {},
        self    = this;

    if (!root) {
        if (global) {
            root    = global;
        }
        else {
            root    = window;
        }
    }

    var parseNs     = function(ns) {

        var tmp     = ns.split("."),
            i,
            last    = tmp.pop(),
            parent  = tmp.join("."),
            len     = tmp.length,
            name,
            current = root;

        if (cache[parent]) {
            return [cache[parent], last, ns];
        }

        if (len > 0) {
            for (i = 0; i < len; i++) {

                name    = tmp[i];

                if (rootName && i == 0) {
                    if (name == rootName) {
                        current = root;
                        continue;
                    }
                    else {
                        ns = rootName + "." + ns;
                    }
                }

                if (current[name] === undf) {
                    current[name]   = {};
                }

                current = current[name];
            }
        }
        else {
            if (rootName) {
                ns = rootName + "." + ns;
            }
        }

        return [current, last, ns];
    };

    /**
     * Get namespace/cache object
     * @function MetaphorJs.ns.get
     * @param {string} ns
     * @param {bool} cacheOnly
     * @returns {object} constructor
     */
    var get       = function(ns, cacheOnly) {

        if (cache[ns] !== undf) {
            return cache[ns];
        }

        if (rootName && cache[rootName + "." + ns] !== undf) {
            return cache[rootName + "." + ns];
        }

        if (cacheOnly) {
            return undf;
        }

        var tmp     = ns.split("."),
            i,
            len     = tmp.length,
            name,
            current = root;

        for (i = 0; i < len; i++) {

            name    = tmp[i];

            if (rootName && i == 0) {
                if (name == rootName) {
                    current = root;
                    continue;
                }
            }

            if (current[name] === undf) {
                return undf;
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
     * @param {*} value
     */
    var register    = function(ns, value) {

        var parse   = parseNs(ns),
            parent  = parse[0],
            name    = parse[1];

        if (isObject(parent) && parent[name] === undf) {

            parent[name]        = value;
            cache[parse[2]]     = value;
        }

        return value;
    };

    /**
     * Class exists
     * @function MetaphorJs.ns.exists
     * @param {string} ns
     * @returns boolean
     */
    var exists      = function(ns) {
        return cache[ns] !== undf;
    };

    /**
     * Add constructor to cache
     * @function MetaphorJs.ns.add
     * @param {string} ns
     * @param {*} value
     */
    var add = function(ns, value) {
        if (rootName && ns.indexOf(rootName) !== 0) {
            ns = rootName + "." + ns;
        }
        if (cache[ns] === undf) {
            cache[ns] = value;
        }
        return value;
    };

    var remove = function(ns) {
        delete cache[ns];
    };

    self.register   = register;
    self.exists     = exists;
    self.get        = get;
    self.add        = add;
    self.remove     = remove;
};

Namespace.prototype = {
    register: null,
    exists: null,
    get: null,
    add: null,
    remove: null
};





var slice = Array.prototype.slice;/**
 * @param {Function} fn
 * @param {Object} context
 * @param {[]} args
 */
var async = function(fn, context, args) {
    setTimeout(function(){
        fn.apply(context, args || []);
    }, 0);
};
var strUndef = "undefined";


var error = function(e) {

    var stack = e.stack || (new Error).stack;

    if (typeof console != strUndef && console.log) {
        async(function(){
            console.log(e);
            if (stack) {
                console.log(stack);
            }
        });
    }
    else {
        throw e;
    }
};

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
                var ret,
                    prev    = this.supr;

                this.supr   = parent[proto][k] || function(){};

                //try {
                    ret     = fn.apply(this, arguments);
                //}
                //catch(thrownError) {
                //    error(thrownError);
                //}

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
            prototype.constructor = fn;
            fn[proto] = prototype;
            //fn[proto].constructor = fn;
            fn[proto].getClass = function() {
                return fn.__class;
            };
            fn[proto].getParentClass = function() {
                return fn.__parentClass;
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



MetaphorJs.lib['Namespace'] = Namespace;
MetaphorJs.lib['Class'] = Class;

typeof global != "undefined" ? (global['MetaphorJs'] = MetaphorJs) : (window['MetaphorJs'] = MetaphorJs);

}());