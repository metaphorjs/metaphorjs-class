(function(){
"use strict";

var MetaphorJs = {
    lib: {},
    cmp: {},
    view: {}
};

function isFunction(value) {
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

    return function varType(val) {

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
            return 8;
        }

        return num;
    };

}();


function isString(value) {
    return typeof value == "string" || value === ""+value;
    //return typeof value == "string" || varType(value) === 0;
};


function isObject(value) {
    if (value === null || typeof value != "object") {
        return false;
    }
    var vt = varType(value);
    return vt > 2 || vt == -1;
};
var strUndef = "undefined";




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
        if (typeof global != strUndef) {
            root    = global;
        }
        else {
            root    = window;
        }
    }

    var normalize   = function(ns) {
        if (ns && rootName && ns.indexOf(rootName) !== 0) {
            return rootName + "." + ns;
        }
        return ns;
    };

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
    self.normalize  = normalize;
};

Namespace.prototype.register = null;
Namespace.prototype.exists = null;
Namespace.prototype.get = null;
Namespace.prototype.add = null;
Namespace.prototype.remove = null;
Namespace.prototype.normalize = null;





var slice = Array.prototype.slice;/**
 * @param {Function} fn
 * @param {Object} context
 * @param {[]} args
 * @param {number} timeout
 */
function async(fn, context, args, timeout) {
    setTimeout(function(){
        fn.apply(context, args || []);
    }, timeout || 0);
};


function error(e) {

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

function emptyFn(){};


var instantiate = function(fn, args) {

    var Temp = function(){},
        inst, ret;

    Temp.prototype  = fn.prototype;
    inst            = new Temp;
    ret             = fn.apply(inst, args);

    // If an object has been returned then return it otherwise
    // return the original instance.
    // (consistent with behaviour of the new operator)
    return isObject(ret) || ret === false ? ret : inst;

};


/*!
 * inspired by and based on klass
 */


var Class = function(){


    var proto   = "prototype",

        constr  = "$construct",

        $constr = function $constr() {
            var self = this;
            if (self.supr && self.supr !== emptyFn) {
                self.supr.apply(self, arguments);
            }
        },

        wrapPrototypeMethod = function wrapPrototypeMethod(parent, k, fn) {

            var supr = parent[proto][k] || (k == constr ? parent : emptyFn) || emptyFn;

            return function() {
                var ret,
                    self    = this,
                    prev    = self.supr;

                self.supr   = supr;
                ret         = fn.apply(self, arguments);
                self.supr   = prev;

                return ret;
            };
        },

        preparePrototype = function preparePrototype(prototype, cls, parent) {
            for (var k in cls) {
                if (cls.hasOwnProperty(k)) {

                    prototype[k] = isFunction(cls[k]) &&
                                   (isFunction(parent[proto][k]) || !parent[proto][k]) ?
                                   wrapPrototypeMethod(parent, k, cls[k]) :
                                   cls[k];


                }
            }
        },


        createConstructor = function() {

            return function() {

                var self    = this,
                    cls     = self ? self.$self : null;

                if (!self) {
                    throw "Must instantiate via new";
                }

                self[constr].apply(self, arguments);

                if (self.initialize) {
                    self.initialize.apply(self, arguments);
                }
            };
        };




    var Class = function(ns){

        if (!ns) {
            ns = new Namespace;
        }



        var BaseClass = function() {

        };

        BaseClass.prototype = {

            $class: null,
            $extends: null,

            $construct: function(){},

            $getClass: function() {
                return this.$class;
            },

            $getParentClass: function() {
                return this.$extends;
            },

            $override: function() {},

            destroy: function() {

                var self = this,
                    i;

                for (i in self) {
                    if (self.hasOwnProperty(i)) {
                        self[i] = null;
                    }
                }
            }
        };

        BaseClass.$self = BaseClass;

        BaseClass.$instantiate = function() {

            var cls = this,
                args = arguments,
                cnt = args.length;

            // lets make it ugly, but without creating temprorary classes and leaks.
            // and fallback to normal instantiation.

            switch (cnt) {
                case 0:
                    return new cls;
                case 1:
                    return new cls(args[0]);
                case 2:
                    return new cls(args[0], args[1]);
                case 3:
                    return new cls(args[0], args[1], args[2]);
                case 4:
                    return new cls(args[0], args[1], args[2], args[3]);
                default:
                    return instantiate(cls, args);
            }
        };


        BaseClass.$extend = function(constructor, definition, statics) {
            return define(constructor, definition, statics, this);
        };


        /**
         * @namespace MetaphorJs
         */



        /**
         * Define class
         * @function MetaphorJs.define
         * @param {function} constructor
         * @param {object} definition (optional)
         * @param {object} statics (optional)
         * @return function New class constructor
         * @alias MetaphorJs.d
         */

        /**
         * Define class
         * @function MetaphorJs.define
         * @param {object} definition
         * @param {object} statics (optional)
         * @return function New class constructor
         * @alias MetaphorJs.d
         */

        /**
         * Define class
         * @function MetaphorJs.define
         * @param {function} constructor
         * @param {object} definition (optional)
         * @param {object} statics (optional)
         * @return function New class constructor
         * @alias MetaphorJs.d
         */
        var define = function(constructor, definition, statics, $extends) {

            // if third parameter is not a function (definition instead of constructor)
            if (!isFunction(constructor)) {
                statics         = definition;
                definition      = constructor;
                constructor     = null;
            }

            definition          = definition || {};
            var name            = definition.$class,
                parentClass     = $extends || definition.$extends,
                pConstructor,
                k, noop, prototype, c;

            pConstructor = parentClass && isString(parentClass) ? ns.get(parentClass) : BaseClass;

            if (parentClass) {
                if (isString(parentClass)) {
                    pConstructor = ns.get(parentClass);
                }
                else {
                    pConstructor = parentClass;
                    parentClass = pConstructor.$class || "";
                }
            }
            else {
                pConstructor = BaseClass;
                parentClass = "";
            }

            if (parentClass && !pConstructor) {
                throw new Error(parentClass + " not found");
            }

            if (name) {
                name = ns.normalize(name);
            }

            definition.$class   = name;
            definition.$extends = parentClass;


            noop                = function(){};
            noop[proto]         = pConstructor[proto];
            prototype           = new noop;
            noop                = null;
            definition[constr]  = constructor || $constr;

            preparePrototype(prototype, definition, pConstructor);

            c = createConstructor();
            prototype.constructor = c;
            c[proto] = prototype;

            for (k in BaseClass) {
                if (k != proto && BaseClass.hasOwnProperty(k)) {
                    c[k] = BaseClass[k];
                }
            }

            for (k in pConstructor) {
                if (k != proto && pConstructor.hasOwnProperty(k)) {
                    c[k] = pConstructor[k];
                }
            }

            if (statics) {
                for (k in statics) {
                    if (k != proto && statics.hasOwnProperty(k)) {
                        c[k] = statics[k];
                    }
                }
            }

            c.$parent   = pConstructor;
            c.$self     = c;

            if (name) {
                ns.register(name, c);
            }

            return c;
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

            return cls.$instantiate.apply(cls, args);
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
         * @param {string|object} childClass
         * @param {string|object} parentClass
         * @return bool
         * @alias MetaphorJs.iss
         */
        var isSubclassOf = function(childClass, parentClass) {

            var p   = childClass,
                g   = ns.get;

            if (!isString(parentClass)) {
                parentClass  = parentClass.prototype.$class;
            }
            else {
                parentClass = ns.normalize(parentClass);
            }
            if (isString(childClass)) {
                p   = g(ns.normalize(childClass));
            }

            while (p && p.prototype) {

                if (p.prototype.$class == parentClass) {
                    return true;
                }

                p = p.$parent;
            }

            return false;
        };

        var self    = this;

        self.factory = instantiate;
        self.isSubclassOf = isSubclassOf;
        self.isInstanceOf = isInstanceOf;
        self.define = define;
        self.BaseClass = BaseClass;

    };

    Class.prototype = {

        factory: null,
        isSubclassOf: null,
        isInstanceOf: null,
        define: null
    };

    return Class;

}();

MetaphorJs.lib['Namespace'] = Namespace;
MetaphorJs.lib['Class'] = Class;

typeof global != "undefined" ? (global['MetaphorJs'] = MetaphorJs) : (window['MetaphorJs'] = MetaphorJs);

}());