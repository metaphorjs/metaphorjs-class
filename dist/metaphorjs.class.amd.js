define("metaphorjs-class", ['metaphorjs-namespace'], function(Namespace) {

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



function isObject(value) {
    if (value === null || typeof value != "object") {
        return false;
    }
    var vt = varType(value);
    return vt > 2 || vt == -1;
};



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



function(){


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
             * @returns {null}
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
                        plugins[i].$beforeHostDestroy();
                    }
                }

                res = self.destroy();

                for (i = -1, l = before.length; ++i < l;
                     after[i].apply(self, arguments)){}

                for (i = 0, l = plugins.length; i < l; i++) {
                    plugins[i].$destroy();
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

            /**
             * Implement your destroy actions here
             * @method
             */
            destroy: function(){}
        });

        BaseClass.$self = BaseClass;

        /**
         * Create an instance of current class.
         * @method
         * @static
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
         * Override class methods
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
         * @method
         * @param {object} definition
         * @param {object} statics
         * @param {string|function} $extends
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
         * @type {function} BaseClass reference to the BaseClass class
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


return Class;
});

