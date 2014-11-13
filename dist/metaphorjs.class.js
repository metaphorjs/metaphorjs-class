(function(){
"use strict";





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
     * 'string': 0,
     * 'number': 1,
     * 'boolean': 2,
     * 'object': 3,
     * 'function': 4,
     * 'array': 5,
     * 'null': 6,
     * 'undefined': 7,
     * 'NaN': 8,
     * 'regexp': 9,
     * 'date': 10,
     * unknown: -1
     * @param {*} value
     * @returns {number}
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



/**
 * @param {*} value
 * @returns {boolean}
 */
function isArray(value) {
    return typeof value == "object" && varType(value) === 5;
};

var strUndef = "undefined";



function isObject(value) {
    if (value === null || typeof value != "object") {
        return false;
    }
    var vt = varType(value);
    return vt > 2 || vt == -1;
};



var Cache = function(){

    var globalCache;

    /**
     * @class Cache
     * @param {bool} cacheRewritable
     * @constructor
     */
    var Cache = function(cacheRewritable) {

        var storage = {},

            finders = [];

        if (arguments.length == 0) {
            cacheRewritable = true;
        }

        return {

            /**
             * @param {function} fn
             * @param {object} context
             * @param {bool} prepend
             */
            addFinder: function(fn, context, prepend) {
                finders[prepend? "unshift" : "push"]({fn: fn, context: context});
            },

            /**
             * @method
             * @param {string} name
             * @param {*} value
             * @param {bool} rewritable
             * @returns {*} value
             */
            add: function(name, value, rewritable) {

                if (storage[name] && storage[name].rewritable === false) {
                    return storage[name];
                }

                storage[name] = {
                    rewritable: typeof rewritable != strUndef ? rewritable : cacheRewritable,
                    value: value
                };

                return value;
            },

            /**
             * @method
             * @param {string} name
             * @returns {*}
             */
            get: function(name) {

                if (!storage[name]) {
                    if (finders.length) {

                        var i, l, res,
                            self = this;

                        for (i = 0, l = finders.length; i < l; i++) {

                            res = finders[i].fn.call(finders[i].context, name, self);

                            if (res !== undf) {
                                return self.add(name, res, true);
                            }
                        }
                    }

                    return undf;
                }

                return storage[name].value;
            },

            /**
             * @method
             * @param {string} name
             * @returns {*}
             */
            remove: function(name) {
                var rec = storage[name];
                if (rec && rec.rewritable === true) {
                    delete storage[name];
                }
                return rec ? rec.value : undf;
            },

            /**
             * @method
             * @param {string} name
             * @returns {boolean}
             */
            exists: function(name) {
                return !!storage[name];
            },

            /**
             * @param {function} fn
             * @param {object} context
             */
            eachEntry: function(fn, context) {
                var k;
                for (k in storage) {
                    fn.call(context, storage[k].value, k);
                }
            },

            /**
             * @method
             */
            destroy: function() {

                var self = this;

                if (self === globalCache) {
                    globalCache = null;
                }

                storage = null;
                cacheRewritable = null;

                self.add = null;
                self.get = null;
                self.destroy = null;
                self.exists = null;
                self.remove = null;
            }
        };
    };

    /**
     * @method
     * @static
     * @returns {Cache}
     */
    Cache.global = function() {

        if (!globalCache) {
            globalCache = new Cache(true);
        }

        return globalCache;
    };

    return Cache;

}();





/**
 * @class Namespace
 * @code ../examples/main.js
 */
var Namespace = function(){


    /**
     * @param {Object} root optional; usually window or global
     * @param {String} rootName optional. If you want custom object to be root and
     * this object itself is the first level of namespace
     * @param {Cache} cache optional
     * @constructor
     */
    var Namespace   = function(root, rootName, cache) {

        cache       = cache || new Cache(false);
        var self    = this,
            rootL   = rootName ? rootName.length : null;

        if (!root) {
            if (typeof global != strUndef) {
                root    = global;
            }
            else {
                root    = window;
            }
        }

        var normalize   = function(ns) {
            if (ns && rootName && ns.substr(0, rootL) != rootName) {
                return rootName + "." + ns;
            }
            return ns;
        };

        var parseNs     = function(ns) {

            ns = normalize(ns);

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

                    if (rootName && i == 0 && name == rootName) {
                        current = root;
                        continue;
                    }

                    if (current[name] === undf) {
                        current[name]   = {};
                    }

                    current = current[name];
                }
            }

            return [current, last, ns];
        };

        /**
         * Get namespace/cache object
         * @method
         * @param {string} ns
         * @param {bool} cacheOnly
         * @returns {*}
         */
        var get       = function(ns, cacheOnly) {

            ns = normalize(ns);

            if (cache.exists(ns)) {
                return cache.get(ns);
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

                if (rootName && i == 0 && name == rootName) {
                    current = root;
                    continue;
                }

                if (current[name] === undf) {
                    return undf;
                }

                current = current[name];
            }

            if (current) {
                cache.add(ns, current);
            }

            return current;
        };

        /**
         * Register item
         * @method
         * @param {string} ns
         * @param {*} value
         */
        var register    = function(ns, value) {

            var parse   = parseNs(ns),
                parent  = parse[0],
                name    = parse[1];

            if (isObject(parent) && parent[name] === undf) {

                parent[name]        = value;
                cache.add(parse[2], value);
            }

            return value;
        };

        /**
         * Item exists
         * @method
         * @param {string} ns
         * @returns boolean
         */
        var exists      = function(ns) {
            return get(ns, true) !== undf;
        };

        /**
         * Add item only to the cache
         * @function add
         * @param {string} ns
         * @param {*} value
         */
        var add = function(ns, value) {

            ns = normalize(ns);
            cache.add(ns, value);
            return value;
        };

        /**
         * Remove item from cache
         * @method
         * @param {string} ns
         */
        var remove = function(ns) {
            ns = normalize(ns);
            cache.remove(ns);
        };

        /**
         * Make alias in the cache
         * @method
         * @param {string} from
         * @param {string} to
         */
        var makeAlias = function(from, to) {

            from = normalize(from);
            to = normalize(to);

            var value = cache.get(from);

            if (value !== undf) {
                cache.add(to, value);
            }
        };

        /**
         * Destroy namespace and all classes in it
         * @method
         */
        var destroy     = function() {

            var self = this,
                k;

            if (self === globalNs) {
                globalNs = null;
            }

            cache.eachEntry(function(entry){
                if (entry && entry.$destroy) {
                    entry.$destroy();
                }
            });

            cache.destroy();
            cache = null;

            for (k in self) {
                self[k] = null;
            }
        };

        self.register   = register;
        self.exists     = exists;
        self.get        = get;
        self.add        = add;
        self.remove     = remove;
        self.normalize  = normalize;
        self.makeAlias  = makeAlias;
        self.destroy    = destroy;
    };

    Namespace.prototype.register = null;
    Namespace.prototype.exists = null;
    Namespace.prototype.get = null;
    Namespace.prototype.add = null;
    Namespace.prototype.remove = null;
    Namespace.prototype.normalize = null;
    Namespace.prototype.makeAlias = null;
    Namespace.prototype.destroy = null;

    var globalNs;

    /**
     * Get global namespace
     * @method
     * @static
     * @returns {Namespace}
     */
    Namespace.global = function() {
        if (!globalNs) {
            globalNs = new Namespace;
        }
        return globalNs;
    };

    return Namespace;

}();



var slice = Array.prototype.slice;



function isPlainObject(value) {
    // IE < 9 returns [object Object] from toString(htmlElement)
    return typeof value == "object" &&
           varType(value) === 3 &&
            !value.nodeType &&
            value.constructor === Object;

};

function isBool(value) {
    return value === true || value === false;
};




var extend = function(){

    /**
     * @param {Object} dst
     * @param {Object} src
     * @param {Object} src2 ... srcN
     * @param {boolean} override = false
     * @param {boolean} deep = false
     * @returns {object}
     */
    var extend = function extend() {


        var override    = false,
            deep        = false,
            args        = slice.call(arguments),
            dst         = args.shift(),
            src,
            k,
            value;

        if (isBool(args[args.length - 1])) {
            override    = args.pop();
        }
        if (isBool(args[args.length - 1])) {
            deep        = override;
            override    = args.pop();
        }

        while (args.length) {
            if (src = args.shift()) {
                for (k in src) {

                    if (src.hasOwnProperty(k) && (value = src[k]) !== undf) {

                        if (deep) {
                            if (dst[k] && isPlainObject(dst[k]) && isPlainObject(value)) {
                                extend(dst[k], value, override, deep);
                            }
                            else {
                                if (override === true || dst[k] == undf) { // == checks for null and undefined
                                    if (isPlainObject(value)) {
                                        dst[k] = {};
                                        extend(dst[k], value, override, true);
                                    }
                                    else {
                                        dst[k] = value;
                                    }
                                }
                            }
                        }
                        else {
                            if (override === true || dst[k] == undf) {
                                dst[k] = value;
                            }
                        }
                    }
                }
            }
        }

        return dst;
    };

    return extend;
}();


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


var intercept = function(origFn, interceptor, context, origContext, when, replaceValue) {

    when = when || "before";

    return function() {

        var intrRes,
            origRes;

        if (when == "instead") {
            return interceptor.apply(context || origContext, arguments);
        }
        else if (when == "before") {
            intrRes = interceptor.apply(context || origContext, arguments);
            origRes = intrRes !== false ? origFn.apply(origContext || context, arguments) : null;
        }
        else {
            origRes = origFn.apply(origContext || context, arguments);
            intrRes = interceptor.apply(context || origContext, arguments);
        }

        return replaceValue ? intrRes : origRes;
    };
};



var Class = function(){


    var proto   = "prototype",

        constr  = "$constructor",

        $constr = function $constr() {
            var self = this;
            if (self.$super && self.$super !== emptyFn) {
                self.$super.apply(self, arguments);
            }
        },

        wrapPrototypeMethod = function wrapPrototypeMethod(parent, k, fn) {

            var $super = parent[proto][k] || (k == constr ? parent : emptyFn) || emptyFn;

            return function() {
                var ret,
                    self    = this,
                    prev    = self.$super;

                self.$super     = $super;
                ret             = fn.apply(self, arguments);
                self.$super     = prev;

                return ret;
            };
        },

        preparePrototype = function preparePrototype(prototype, cls, parent, onlyWrap) {
            var k, ck, pk, pp = parent[proto];

            for (k in cls) {
                if (cls.hasOwnProperty(k)) {
                    
                    pk = pp[k];
                    ck = cls[k];

                    prototype[k] = isFunction(ck) && (!pk || isFunction(pk)) ?
                                    wrapPrototypeMethod(parent, k, ck) :
                                    ck;
                }
            }

            if (onlyWrap) {
                return;
            }

            prototype.$plugins = null;

            if (pp.$beforeInit) {
                prototype.$beforeInit = pp.$beforeInit.slice();
                prototype.$afterInit = pp.$afterInit.slice();
                prototype.$beforeDestroy = pp.$beforeDestroy.slice();
                prototype.$afterDestroy = pp.$afterDestroy.slice();
            }
            else {
                prototype.$beforeInit = [];
                prototype.$afterInit = [];
                prototype.$beforeDestroy = [];
                prototype.$afterDestroy = [];
            }
        },
        
        mixinToPrototype = function(prototype, mixin) {
            
            var k;
            for (k in mixin) {
                if (mixin.hasOwnProperty(k)) {
                    if (k == "$beforeInit") {
                        prototype.$beforeInit.push(mixin[k]);
                    }
                    else if (k == "$afterInit") {
                        prototype.$afterInit.push(mixin[k]);
                    }
                    else if (k == "$beforeDestroy") {
                        prototype.$beforeDestroy.push(mixin[k]);
                    }
                    else if (k == "$afterDestroy") {
                        prototype.$afterDestroy.push(mixin[k]);
                    }
                    else if (!prototype[k]) {
                        prototype[k] = mixin[k];
                    }
                }
            }
        };


    var Class = function(ns){

        if (!ns) {
            ns = new Namespace;
        }

        var createConstructor = function() {

            return function() {

                var self    = this,
                    before  = [],
                    after   = [],
                    args    = arguments,
                    newArgs,
                    i, l,
                    plugins, plugin,
                    plCls;

                if (!self) {
                    throw "Must instantiate via new";
                }

                self.$plugins = [];

                newArgs = self[constr].apply(self, arguments);

                if (newArgs && isArray(newArgs)) {
                    args = newArgs;
                }

                plugins = self.$plugins;

                for (i = -1, l = self.$beforeInit.length; ++i < l;
                     before.push([self.$beforeInit[i], self])) {}

                for (i = -1, l = self.$afterInit.length; ++i < l;
                     after.push([self.$afterInit[i], self])) {}

                if (plugins && plugins.length) {

                    for (i = 0, l = plugins.length; i < l; i++) {

                        plugin = plugins[i];

                        if (isString(plugin)) {
                            plCls = plugin;
                            plugin = ns.get("plugin." + plugin, true);
                            if (!plugin) {
                                throw plCls + " not found";
                            }
                        }

                        plugin = new plugin(self, args);

                        if (plugin.$beforeHostInit) {
                            before.push([plugin.$beforeHostInit, plugin]);
                        }
                        if (plugin.$afterHostInit) {
                            after.push([plugin.$afterHostInit, plugin]);
                        }

                        plugins[i] = plugin;
                    }
                }

                for (i = -1, l = before.length; ++i < l;
                     before[i][0].apply(before[i][1], args)){}

                if (self.$init) {
                    self.$init.apply(self, args);
                }

                for (i = -1, l = after.length; ++i < l;
                     after[i][0].apply(after[i][1], args)){}

            };
        };


        /**
         * @class BaseClass
         * @description All classes defined with MetaphorJs.Class extend this class.
         * You can access it via <code>cs.BaseClass</code>. Basically,
         * <code>cs.define({});</code> is the same as <code>cs.BaseClass.$extend({})</code>.
         * @constructor
         */
        var BaseClass = function() {

        };

        extend(BaseClass.prototype, {

            $class: null,
            $extends: null,
            $plugins: null,
            $mixins: null,

            $destroyed: false,

            $constructor: emptyFn,
            $init: emptyFn,
            $beforeInit: [],
            $afterInit: [],
            $beforeDestroy: [],
            $afterDestroy: [],

            /**
             * Get class name
             * @method
             * @returns {string}
             */
            $getClass: function() {
                return this.$class;
            },

            /**
             * Get parent class name
             * @method
             * @returns {string | null}
             */
            $getParentClass: function() {
                return this.$extends;
            },

            /**
             * Intercept method
             * @method
             * @param {string} method Intercepted method name
             * @param {function} fn function to call before or after intercepted method
             * @param {object} newContext optional interceptor's "this" object
             * @param {string} when optional, when to call interceptor before | after | instead; default "before"
             * @param {bool} replaceValue optional, return interceptor's return value or original method's; default false
             */
            $intercept: function(method, fn, newContext, when, replaceValue) {
                var self = this;
                self[method] = intercept(self[method], fn, newContext || self, self, when, replaceValue);
            },

            /**
             * Implement new methods or properties on instance
             * @param {object} methods
             */
            $implement: function(methods) {
                var $self = this.constructor;
                if ($self && $self.$parent) {
                    preparePrototype(this, methods, $self.$parent);
                }
            },

            /**
             * Destroy instance
             * @method
             */
            $destroy: function() {

                var self    = this,
                    before  = self.$beforeDestroy,
                    after   = self.$afterDestroy,
                    plugins = self.$plugins,
                    i, l, res;

                if (self.$destroyed) {
                    return;
                }

                self.$destroyed = true;

                for (i = -1, l = before.length; ++i < l;
                     before[i].apply(self, arguments)){}

                for (i = 0, l = plugins.length; i < l; i++) {
                    if (plugins[i].$beforeHostDestroy) {
                        plugins[i].$beforeHostDestroy.call(plugins[i], arguments);
                    }
                }

                res = self.destroy.apply(self, arguments);

                for (i = -1, l = before.length; ++i < l;
                     after[i].apply(self, arguments)){}

                for (i = 0, l = plugins.length; i < l; i++) {
                    plugins[i].$destroy.apply(plugins[i], arguments);
                }

                if (res !== false) {
                    for (i in self) {
                        if (self.hasOwnProperty(i)) {
                            self[i] = null;
                        }
                    }
                }

                self.$destroyed = true;
            },

            destroy: function(){}
        });

        BaseClass.$self = BaseClass;

        /**
         * Create an instance of current class. Same as cs.factory(name)
         * @method
         * @static
         * @code var myObj = My.Class.$instantiate(arg1, arg2, ...);
         * @returns {object} class instance
         */
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

        /**
         * Override class methods (on prototype level, not on instance level)
         * @method
         * @static
         * @param {object} methods
         */
        BaseClass.$override = function(methods) {
            var $self = this.$self,
                $parent = this.$parent;

            if ($self && $parent) {
                preparePrototype($self.prototype, methods, $parent);
            }
        };

        /**
         * Create new class based on current one
         * @param {object} definition
         * @param {object} statics
         * @returns {function}
         */
        BaseClass.$extend = function(definition, statics) {
            return define(definition, statics, this);
        };

        /**
         * Destroy class
         * @method
         */
        BaseClass.$destroy = function() {
            var self = this,
                k;

            for (k in self) {
                self[k] = null;
            }
        };

        /**
         * @class Class
         */

        /**
         * @method Class
         * @constructor
         * @param {Namespace} ns optional namespace. See metaphorjs-namespace repository
         */

        /**
         * @method
         * @param {object} definition {
         *  @type {string} $class optional
         *  @type {string} $extends optional
         *  @type {array} $mixins optional
         *  @type {function} $constructor optional
         *  @type {function} $init optional
         *  @type {function} $beforeInit if this is a mixin
         *  @type {function} $afterInit if this is a mixin
         *  @type {function} $beforeHostInit if this is a plugin
         *  @type {function} $afterHostInit if this is a plugin
         *  @type {function} $beforeDestroy if this is a mixin
         *  @type {function} $afterDestroy if this is a mixin
         *  @type {function} $beforeHostDestroy if this is a plugin
         *  @type {function} destroy your own destroy function
         * }
         * @param {object} statics any statis properties or methods
         * @param {string|function} $extends this is a private parameter; use definition.$extends
         * @code var cls = cs.define({$class: "Name"});
         */
        var define = function(definition, statics, $extends) {

            definition          = definition || {};
            
            var name            = definition.$class,
                parentClass     = $extends || definition.$extends,
                mixins          = definition.$mixins,
                pConstructor,
                i, l, k, noop, prototype, c, mixin;

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
                throw parentClass + " not found";
            }

            if (name) {
                name = ns.normalize(name);
            }

            definition.$class   = name;
            definition.$extends = parentClass;
            definition.$mixins  = null;


            noop                = function(){};
            noop[proto]         = pConstructor[proto];
            prototype           = new noop;
            noop                = null;
            definition[constr]  = definition[constr] || $constr;

            preparePrototype(prototype, definition, pConstructor);

            if (mixins) {
                for (i = 0, l = mixins.length; i < l; i++) {
                    mixin = mixins[i];
                    if (isString(mixin)) {
                        mixin = ns.get("mixin." + mixin, true);
                    }
                    mixinToPrototype(prototype, mixin);
                }
            }

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
         * Instantiate class. Pass constructor parameters after "name"
         * @method
         * @code cs.factory("My.Class.Name", arg1, arg2, ...);
         * @param {string} name Full name of the class
         * @returns {object} class instance
         */
        var factory = function(name) {

            var cls     = ns.get(name),
                args    = slice.call(arguments, 1);

            if (!cls) {
                throw name + " not found";
            }

            return cls.$instantiate.apply(cls, args);
        };



        /**
         * Is cmp instance of cls
         * @method
         * @code cs.instanceOf(myObj, "My.Class");
         * @code cs.instanceOf(myObj, My.Class);
         * @param {object} cmp
         * @param {string|object} cls
         * @returns {boolean}
         */
        var isInstanceOf = function(cmp, cls) {
            var _cls    = isString(cls) ? ns.get(cls) : cls;
            return _cls ? cmp instanceof _cls : false;
        };



        /**
         * Is one class subclass of another class
         * @method
         * @code cs.isSubclassOf("My.Subclass", "My.Class");
         * @code cs.isSubclassOf(myObj, "My.Class");
         * @code cs.isSubclassOf("My.Subclass", My.Class);
         * @code cs.isSubclassOf(myObj, My.Class);
         * @param {string|object} childClass
         * @param {string|object} parentClass
         * @return {bool}
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

        self.factory = factory;
        self.isSubclassOf = isSubclassOf;
        self.isInstanceOf = isInstanceOf;
        self.define = define;

        self.destroy = function(){

            if (self === globalCs) {
                globalCs = null;
            }

            BaseClass.$destroy();
            BaseClass = null;

            ns.destroy();
            ns = null;

            Class = null;

        };

        /**
         * @type {BaseClass} BaseClass reference to the BaseClass class
         */
        self.BaseClass = BaseClass;

    };

    Class.prototype = {

        factory: null,
        isSubclassOf: null,
        isInstanceOf: null,
        define: null,
        destroy: null
    };

    var globalCs;

    /**
     * Get default global class manager
     * @method
     * @static
     * @returns {Class}
     */
    Class.global = function() {
        if (!globalCs) {
            globalCs = new Class(Namespace.global());
        }
        return globalCs;
    };

    return Class;

}();

MetaphorJs['Namespace'] = Namespace;
MetaphorJs['Class'] = Class;
typeof global != "undefined" ? (global['MetaphorJs'] = MetaphorJs) : (window['MetaphorJs'] = MetaphorJs);

}());