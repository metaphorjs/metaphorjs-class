require("metaphorjs-namespace/src/lib/Namespace.js");

var isFunction  = require("metaphorjs-shared/src/func/isFunction.js"),
    isString    = require("metaphorjs-shared/src/func/isString.js"),
    isArray     = require("metaphorjs-shared/src/func/isArray.js"),
    toArray     = require("metaphorjs-shared/src/func/toArray.js"),
    extend      = require("metaphorjs-shared/src/func/extend.js"),
    emptyFn     = require("metaphorjs-shared/src/func/emptyFn.js"),
    instantiate = require("metaphorjs-shared/src/func/instantiate.js"),
    intercept   = require("metaphorjs-shared/src/func/intercept.js"),
    MetaphorJs = require("metaphorjs-shared/src/MetaphorJs.js");

module.exports = function(){


    var proto   = "prototype",
        constr  = "$constructor",

        $constr = function $constr() {
            var self = this;
            if (self.$super && self.$super !== emptyFn) {
                self.$super.apply(self, arguments);
            }
        },

        collectMixinEvents = function(events, pConstr) {
            var pp;
            while (pConstr) {
                pp = pConstr[proto];
                if (pp.$mixinEvents) {
                    events = events.concat(pp.$mixinEvents);
                }
                pConstr = pConstr.$parent;
            }
            return events;
        },

        wrapPrototypeMethod = function wrapPrototypeMethod(parent, k, fn) {

            var $super = parent[proto][k] ||
                        (k === constr ? parent : emptyFn) ||
                        emptyFn;

            return function() {
                var ret,
                    self    = this,
                    prev    = self.$super;

                if (self.$destroyed) {
                    self.$super = null;
                    return null;
                }

                self.$super     = $super;
                ret             = fn.apply(self, arguments);
                self.$super     = prev;

                return ret;
            };
        },

        preparePrototype = function preparePrototype(prototype, cls, parent, onlyWrap, mixEvents) {
            var k, ck, pk, pp = parent[proto],
                i, l, name;

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

            prototype.$plugins      = null;
            prototype.$pluginMap    = null;

            if (mixEvents) {
                for (i = 0, l = mixEvents.length; i < l; i++) {
                    name = mixEvents[i];
                    if (pp[name]) {
                        if (typeof pp[name] === 'function') {
                            throw new Error("Cannot override method " + 
                                            name + 
                                            " with mixin event");
                        }
                        prototype[name] = pp[name].slice();
                    }
                    else {
                        prototype[name] = [];
                    }
                }
            }
        },
        
        mixinToPrototype = function(prototype, mixin, events) {
            
            var k;

            for (k in mixin) {
                if (mixin.hasOwnProperty(k)) {
                    if (events.indexOf(k) !== -1) {
                        prototype[k].push(mixin[k]);
                    }
                    else if (!prototype[k]) {
                        prototype[k] = mixin[k];
                    }
                }
            }
        };


    /**
     * Instantiate class system with namespace.
     * @group api
     * @function
     * @param {MetaphorJs.lib.Namespace} ns {
     *  Provide your own namespace or a new private ns will be 
     *  constructed automatically. 
     *  @optional
     * }
     * @returns {object} Returns cls() function/object. 
     */
    var classManagerFactory = function(ns) {

        if (!ns) {
            ns = new MetaphorJs.lib.Namespace;
        }

        var createConstructor = function(className) {

            return function() {

                var self    = this,
                    before  = [],
                    after   = [],
                    args    = arguments,
                    newArgs,
                    i, l,
                    plugins, plugin,
                    pmap,
                    plCls;

                if (!self) {
                    throw new Error("Must instantiate via new: " + className);
                }

                self.$plugins   = [];

                newArgs = self[constr].apply(self, arguments);

                if (newArgs && isArray(newArgs)) {
                    args = newArgs;
                }

                plugins = self.$plugins;
                pmap    = self.$pluginMap = {};

                if (self.$beforeInit) 
                    for (i = -1, l = self.$beforeInit.length; ++i < l;
                         before.push([self.$beforeInit[i], self])) {}

                if (self.$afterInit)
                    for (i = -1, l = self.$afterInit.length; ++i < l;
                         after.push([self.$afterInit[i], self])) {}

                if (plugins && plugins.length) {

                    for (i = 0, l = plugins.length; i < l; i++) {

                        plugin = plugins[i];

                        if (isString(plugin)) {
                            plCls = plugin;
                            plugin = ns ? ns.get(plugin, true) : null;
                            if (!plugin) {
                                throw plCls + " not found";
                            }
                        }
 
                        plugin = new plugin(self, args);
                        pmap[plugin.$class] = plugin;

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
         * All classes defined with <code>cls</code> extend this class.
         * Basically,<code>cls({});</code> is the same as 
         * <code>BaseClass.$extend({})</code>.
         * @group api
         * @class MetaphorJs.cls.BaseClass
         */
        var BaseClass = function() {

        };

        extend(BaseClass.prototype, {

            /**
             * Class name
             * @property {string} 
             */
            $class: null,
            $extends: null,

            /**
             * List of plugin names or constructors before class 
             * is initialised, list of plugin instances after initialisation
             * @property {array} 
             */
            $plugins: null,
            $pluginMap: null,
            $mixins: null,
            $mixinEvents: ["$beforeInit", "$afterInit",
                            "$beforeDestroy", "$afterDestroy"],

            $destroyed: false,
            $destroying: false,

            $constructor: emptyFn,
            $init: emptyFn,
            $beforeInit: [],
            $afterInit: [],
            $beforeDestroy: [],
            $afterDestroy: [],

            /**
             * Call mixins for a specified mixin event
             * @param {string} eventName 
             */
            $callMixins: function(eventName) {
                var self = this,
                    fns = self[eventName],
                    i, l,
                    args = toArray(arguments);

                args.shift();

                for (i = 0, l = fns.length; i < l; i++) {
                    fns[i].apply(self, args);
                }
            },

            /**
             * Get this instance's class name
             * @method
             * @returns {string}
             */
            $getClass: function() {
                return this.$class;
            },

            /**
             * Is this object instance of <code>cls</code>
             * @param {string} cls
             * @returns {boolean}
             */
            $is: function(cls) {
                return isInstanceOf(this, cls);
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
             * @param {string} when optional, when to call interceptor 
             *                         before | after | instead; default "before"
             * @param {bool} replaceValue optional, return interceptor's return value 
             *                  or original method's; default false
             * @returns {function} original method
             */
            $intercept: function(method, fn, newContext, when, replaceValue) {
                var self = this,
                    orig = self[method];
                self[method] = intercept(orig || emptyFn, fn, newContext || self, 
                                            self, when, replaceValue);
                return orig || emptyFn;
            },

            /**
             * Implement new methods or properties on instance
             * @method
             * @param {object} methods
             */
            $implement: function(methods) {
                var $self = this.constructor;
                if ($self && $self.$parent) {
                    preparePrototype(this, methods, $self.$parent, true);
                }
            },

            /**
             * Does this instance have a plugin
             * @method
             * @param cls
             * @returns {boolean}
             */
            $hasPlugin: function(cls) {
                return cls ? !!this.$pluginMap[cls] : false;
            },

            /**
             * Get plugin instance
             * @method
             * @param {string} cls Plugin class name
             * @returns {object|null}
             */
            $getPlugin: function(cls) {
                return cls ? this.$pluginMap[cls] || null : null;
            },

            /**
             * Get a bound to this object function
             * @method
             * @param {function} fn
             * @returns {Function}
             */
            $bind: function(fn) {
                var self = this;
                return function() {
                    if (!self.$isDestroyed()) {
                        return fn.apply(self, arguments);
                    }
                };
            },

            /**
             * Is this object destroyed
             * @method
             * @return {boolean}
             */
            $isDestroyed: function() {
                return self.$destroying || self.$destroyed;
            },

            /**
             * Destroy this instance. Also destroys plugins and
             * calls all beforeDestroy and afterDestroy handlers.
             * Also calls onDestroy.<br>
             * Safe to call multiple times.
             * @method
             */
            $destroy: function() {

                var self    = this,
                    before  = self.$beforeDestroy,
                    after   = self.$afterDestroy,
                    plugins = self.$plugins,
                    i, l, res;

                if (self.$destroying || self.$destroyed) {
                    return;
                }

                self.$destroying = true;

                for (i = -1, l = before.length; ++i < l;
                     before[i].apply(self, arguments)){}

                for (i = 0, l = plugins.length; i < l; i++) {
                    if (plugins[i].$beforeHostDestroy) {
                        plugins[i].$beforeHostDestroy.call(plugins[i], arguments);
                    }
                }

                res = self.onDestroy.apply(self, arguments);

                for (i = -1, l = after.length; ++i < l;
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

                self.$destroying = false;
                self.$destroyed = true;
            },

            /**
             * Overridable method. Put your destructor here
             * @method
             */
            onDestroy: function(){}
        });

        BaseClass.$self = BaseClass;

        /**
         * Create an instance of current class. Same as <code>cls.factory(name)</code>
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
         * Create new class extending current one
         * @static
         * @method
         * @param {object} definition
         * @param {object} statics
         * @returns {function}
         */
        BaseClass.$extend = function(definition, statics) {
            return defineClass(definition, statics, this);
        };

        /**
         * Destroy class (not the instance)
         * @method
         * @static
         */
        BaseClass.$destroy = function() {
            var self = this,
                k;

            for (k in self) {
                self[k] = null;
            }
        };
        /**
         * @end-class
         */


        /**
         * Constructed class system. Also this is a function, same as 
         * <code>cls.define</code>
         * @group api
         * @object cls
         */

        /**
         * @property {function} define {
         *  @param {object} definition {
         *      @type {string} $class optional class name
         *      @type {string} $extends optional parent class
         *      @type {array} $mixins optional list of mixins
         *      @type {function} $constructor optional low-level constructor
         *      @type {function} $init optional constructor
         *      @type {function} onDestroy your own destroy function
         *  }
         *  @param {object} statics any statis properties or methods
         * }
         * @code var Name = cls({$class: "Name"});
         */
        var defineClass = function defineClass(definition, statics, $extends) {

            definition          = definition || {};
            
            var name            = definition.$class,
                parentClass     = $extends || definition.$extends,
                mixins          = definition.$mixins,
                mixEvents       = definition.$mixinEvents || [],
                alias           = definition.$alias,
                pConstructor,
                allMixEvents,
                i, l, k, prototype, c, mixin;

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

            definition.$class   = name;
            definition.$extends = parentClass;
            delete definition.$mixins;
            delete definition.$mixinEvents;

            allMixEvents        = collectMixinEvents(mixEvents, pConstructor);
            prototype           = Object.create(pConstructor[proto]);
            definition[constr]  = definition[constr] || $constr;

            preparePrototype(prototype, definition, pConstructor, false, allMixEvents);

            if (mixins) {
                for (i = 0, l = mixins.length; i < l; i++) {
                    mixin = mixins[i];
                    if (isString(mixin)) {
                        if (!ns) {
                            throw new Error("Mixin " + mixin + " not found");
                        }
                        mixin = ns.get(mixin, true);
                    }
                    mixinToPrototype(prototype, mixin, allMixEvents);
                }
            }

            c = createConstructor(name);
            prototype.constructor = c;
            prototype.$self = c;
            prototype.$mixinEvents = mixEvents;
            c[proto] = prototype;

            for (k in BaseClass) {
                if (k !== proto && BaseClass.hasOwnProperty(k)) {
                    c[k] = BaseClass[k];
                }
            }

            for (k in pConstructor) {
                if (k !== proto && pConstructor.hasOwnProperty(k)) {
                    c[k] = pConstructor[k];
                }
            }

            if (statics) {
                for (k in statics) {
                    if (k !== proto && statics.hasOwnProperty(k)) {
                        c[k] = statics[k];
                    }
                }
            }

            c.$parent   = pConstructor;
            c.$self     = c;

            if (ns) {
                if (name) {
                    ns.register(name, c);
                }
                if (alias) {
                    ns.register(alias, c);
                }
            }

            return c;
        };




        /**
         * Instantiate class. Pass constructor parameters after "name"
         * @property {function} factory {
         * @code cls.factory("My.Class.Name", arg1, arg2, ...);
         * @param {string} name Full name of the class
         * @returns {object} class instance
         * }
         */
        var factory = function(name) {

            var cls     = ns ? ns.get(name) : null,
                args    = toArray(arguments).slice(1);

            if (!cls) {
                throw name + " not found";
            }

            return cls.$instantiate.apply(cls, args);
        };



        /**
         * Is given object instance of class
         * @property {function} isInstanceOf {
         * @code cls.instanceOf(myObj, "My.Class");
         * @code cls.instanceOf(myObj, My.Class);
         * @param {object} cmp
         * @param {string|object} name
         * @returns {boolean}
         * }
         */
        var isInstanceOf = function(cmp, name) {
            var _cls    = isString(name) && ns ? ns.get(name) : name;
            return _cls ? cmp instanceof _cls : false;
        };



        /**
         * Is one class subclass of another class
         * @property {function} isSubclassOf {
         * @code cls.isSubclassOf("My.Subclass", "My.Class");
         * @code cls.isSubclassOf(myObj, "My.Class");
         * @code cls.isSubclassOf("My.Subclass", My.Class);
         * @code cls.isSubclassOf(myObj, My.Class);
         * @param {string|object} childClass
         * @param {string|object} parentClass
         * @return {boolean}
         * }
         */
        var isSubclassOf = function(childClass, parentClass) {

            var p   = childClass,
                g   = ns ? ns.get : function(){};

            if (!isString(parentClass)) {
                parentClass  = parentClass.prototype.$class;
            }

            if (isString(childClass)) {
                p   = g(childClass);
            }

            while (p && p.prototype) {

                if (p.prototype.$class === parentClass) {
                    return true;
                }

                p = p.$parent;
            }

            return false;
        };


        /**
         * Reference to the managerFactory
         * @property {function} classManagerFactory
         */
        defineClass.classManagerFactory = classManagerFactory;
        defineClass.factory = factory;
        defineClass.isSubclassOf = isSubclassOf;
        defineClass.isInstanceOf = isInstanceOf;
        defineClass.define = defineClass;

        /**
         * @property {function} Namespace Namespace constructor
         */
        defineClass.Namespace = MetaphorJs.lib.Namespace;

        /**
         * @property {class} BaseClass
         */
        defineClass.BaseClass = BaseClass;

        /**
         * @property {object} ns Namespace instance
         */
        defineClass.ns = ns;

        /**
         * @property {function} $destroy Destroy class system and namespace
         */
        defineClass.$destroy = function() {
            BaseClass.$destroy();
            BaseClass = null;
            if (ns) {
                ns.$destroy();
                ns = null;
            }
        };

        return defineClass;
    };

    return classManagerFactory;
}();
