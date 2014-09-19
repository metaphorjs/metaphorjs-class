
var isFunction  = require("../../metaphorjs/src/func/isFunction.js"),
    isString    = require("../../metaphorjs/src/func/isString.js"),
    isObject    = require("../../metaphorjs/src/func/isObject.js"),
    Namespace   = require("../../metaphorjs-namespace/src/metaphorjs.namespace.js"),
    slice       = require("../../metaphorjs/src/func/array/slice.js"),
    error       = require("../../metaphorjs/src/func/error.js"),
    extend      = require("../../metaphorjs/src/func/extend.js"),
    undf        = require("../../metaphorjs/src/var/undf.js"),
    emptyFn     = require("../../metaphorjs/src/func/emptyFn.js"),
    instantiate = require("../../metaphorjs/src/func/instantiate.js");

/*!
 * inspired by and based on klass
 */


module.exports = function(){


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

            prototype.$plugins = null;

            if (pp.$beforeInit) {
                prototype.$beforeInit = pp.$beforeInit.slice();
                prototype.$afterInit = pp.$afterInit.slice();
            }
            else {
                prototype.$beforeInit = [];
                prototype.$afterInit = [];
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
                    i, l, before = [], after = [], plugins, plugin,
                    pluginInsts = [],
                    args    = slice.call(arguments);

                if (!self) {
                    throw "Must instantiate via new";
                }

                self[constr].apply(self, arguments);

                plugins = self.$plugins;
                self.$plugins = null;


                for (i = -1, l = self.$beforeInit.length; ++i < l;
                     before.push([self.$beforeInit[i], self])) {}

                for (i = -1, l = self.$afterInit.length; ++i < l;
                     after.push([self.$afterInit[i], self])) {}

                if (plugins) {
                    for (i = 0, l = plugins.length; i < l; i++) {
                        plugin = plugins[i];
                        if (isString(plugin)) {
                            plugin = ns.get(plugin, true);
                        }
                        pluginInsts[i] = plugin = new plugin(self, args);
                        if (plugin.$beforeHostInit) {
                            before.push([plugin.$beforeHostInit, plugin]);
                        }
                        if (plugin.$afterHostInit) {
                            after.push([plugin.$afterHostInit, plugin]);
                        }
                        plugin = null;
                    }
                }
                plugins = null;

                for (i = -1, l = before.length; ++i < l;
                     before[i][0].apply(before[i][1], arguments)){}

                if (self.$init) {
                    self.$init.apply(self, arguments);
                }

                for (i = -1, l = after.length; ++i < l;
                     after[i][0].apply(after[i][1], arguments)){}

                self.$plugins = pluginInsts;
            };
        };


        var BaseClass = function() {

        };

        extend(BaseClass.prototype, {

            $class: null,
            $extends: null,
            $plugins: null,
            $mixins: null,

            $construct: emptyFn,
            $init: emptyFn,
            $beforeInit: [],
            $afterInit: [],

            $getClass: function() {
                return this.$class;
            },

            $getParentClass: function() {
                return this.$extends;
            },

            destroy: function() {

                var self = this,
                    i;

                for (i in self) {
                    if (self.hasOwnProperty(i)) {
                        self[i] = null;
                    }
                }
            }
        });

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
                mixins          = definition.$mixins,
                pConstructor,
                i, l, k, noop, prototype, c, mixin;

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
            definition.$mixins  = null;


            noop                = function(){};
            noop[proto]         = pConstructor[proto];
            prototype           = new noop;
            noop                = null;
            definition[constr]  = constructor || $constr;

            preparePrototype(prototype, definition, pConstructor);
            
            if (mixins) {
                for (i = 0, l = mixins.length; i < l; i++) {
                    mixin = mixins[i];
                    if (isString(mixin)) {
                        mixin = ns.get(mixin, true);
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
