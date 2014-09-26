
var assert = require("assert"),
    Class = require("../src/metaphorjs.class.js"),
    Namespace = require("../../metaphorjs-namespace/src/metaphorjs.namespace.js");

describe("Class", function(){

    describe("definition", function(){

        var local   = {},
            ns = new Namespace(local, "local"),
            cs = new Class(ns);

        it("should define class", function(){

            var initCalled = 0;

            cs.define({
                $class: "My.Class",
                $init: function() {
                    initCalled++;
                    this.$super();
                },
                method: function(){
                    return 1;
                }
            });

            assert.notEqual(undefined, local.My.Class);

            var inst = new local.My.Class;

            assert.equal(1, inst.method());
            assert.equal(1, initCalled);
        });

        it("should create instance via factory", function(){

            var inst = cs.factory("My.Class");

            assert.equal(true, !!inst);
            assert.equal(true, cs.isInstanceOf(inst, local.My.Class));
            assert.equal(true, cs.isInstanceOf(inst, "local.My.Class"));
            assert.equal(true, cs.isInstanceOf(inst, "My.Class"));
            assert.equal(true, inst instanceof local.My.Class);
        });

        it("should extend classes", function(){

            var parentConstrCalled = 0,
                childConstrCalled = 0,
                parentInitCalled = 0,
                childInitCalled = 0;

            cs.define({
                $class: "ParentClass",
                $constructor: function(){
                    parentConstrCalled++;
                },
                $init: function() {
                    parentInitCalled++;
                }
            });

            cs.define({
                $class: "ChildClass",
                $extends: "ParentClass",
                $constructor: function(){
                    childConstrCalled++;
                    this.$super();
                },
                $init: function() {
                    childInitCalled++;
                    this.$super();
                }
            });

            var inst = cs.factory("ChildClass");

            assert.equal(true, cs.isInstanceOf(inst, local.ChildClass));
            assert.equal(true, cs.isInstanceOf(inst, "local.ChildClass"));
            assert.equal(true, cs.isInstanceOf(inst, "ParentClass"));

            assert.equal(true, cs.isSubclassOf(local.ChildClass, local.ParentClass));
            assert.equal(true, cs.isSubclassOf("local.ChildClass", "local.ParentClass"));
            assert.equal(true, cs.isSubclassOf("ChildClass", "ParentClass"));

            assert.equal(true, inst instanceof local.ChildClass);
            assert.equal(true, inst instanceof local.ParentClass);

            assert.equal(1, parentConstrCalled);
            assert.equal(1, childConstrCalled);
            assert.equal(1, parentInitCalled);
            assert.equal(1, childInitCalled);
        });

        it("should extend native classes", function(){

            var SomeNativeClass = function() {

            };

            SomeNativeClass.prototype = {
                someFunc: function() {}
            };

            cs.define({
                $class: "My.ThrirdClass",
                $extends: SomeNativeClass
            });

            var inst = cs.factory("My.ThrirdClass");

            assert.equal(true, inst instanceof local.My.ThrirdClass);
            assert.equal(true, inst instanceof SomeNativeClass);
        });

        it("should extend classes via $extend", function(){

            var Cls1 = cs.BaseClass.$extend({
                someMethod: function() {
                    return 1;
                }
            });

            var Cls2 = Cls1.$extend({
                someMethod: function() {
                    return this.$super();
                }
            });

            var inst = new Cls2;

            assert.equal(1, inst.someMethod());

        });

        it("should mixin classes", function(){

            var parentAfterInitCalled = 0,
                parentBeforeInitCalled = 0,
                beforeIsBefore = false,
                afterIsAfter = false,
                ch1BeforeCalled = 0,
                ch1AfterCalled = 0,
                ch2BeforeCalled = 0,
                ch2AfterCalled = 0;

            var parentMixin1 = {
                $beforeInit: function() {
                    parentBeforeInitCalled++;
                },
                $afterInit: function() {
                    parentAfterInitCalled++;
                },
                parentMixinMethod: function() {
                    return 1;
                }
            };

            var childMixin1 = {
                $beforeInit: function() {
                    ch1BeforeCalled++;
                },
                $afterInit: function() {
                    ch1AfterCalled++;
                },
                childMixin1Method: function() {
                    return 1;
                }
            };

            var childMixin2 = {
                $beforeInit: function() {
                    ch2BeforeCalled++;
                },
                $afterInit: function() {
                    ch2AfterCalled++;
                },
                childMixin2Method: function() {
                    return 1;
                }
            };

            cs.define({
                $class: "ParentClass1",
                $mixins: [parentMixin1],
                $init: function(){
                    beforeIsBefore = parentBeforeInitCalled == 1;
                    afterIsAfter = parentAfterInitCalled == 0;
                }
            });

            cs.define({
                $class: "ChildClass1",
                $extends: "ParentClass1",
                $mixins: [childMixin1, childMixin2],
                $init: function() {
                    this.$super();
                }
            });

            var inst = new local.ChildClass1;

            assert.equal(true, beforeIsBefore);
            assert.equal(true, afterIsAfter);
            assert.equal(1, parentBeforeInitCalled);
            assert.equal(1, parentAfterInitCalled);
            assert.equal(1, ch1BeforeCalled);
            assert.equal(1, ch1AfterCalled);
            assert.equal(1, ch2BeforeCalled);
            assert.equal(1, ch2AfterCalled);
            assert.equal(1, inst.parentMixinMethod());
            assert.equal(1, inst.childMixin1Method());
            assert.equal(1, inst.childMixin2Method());
        });


        it("should initialize plugins", function(){

            var beforeHostCalled = 0,
                afterHostCalled = 0;

            var PluginClass = cs.define({
                $class: "PluginClass",
                $beforeHostInit: function() {
                    beforeHostCalled++;
                },
                $afterHostInit: function() {
                    afterHostCalled++;
                }
            });

            var PluginHost = cs.define({
                    $class: "PluginHost",
                    $constructor: function(){
                        this.$plugins = [PluginClass];
                    }
                });

            var inst = new PluginHost;

            assert.equal(1, beforeHostCalled);
            assert.equal(1, afterHostCalled);
        });

        it("should override methods", function(){

            var parentCalled = 0;

            var OverridableParent = cs.define({
                method: function() {
                    parentCalled++;
                    return 1;
                }
            });

            var overridenCalled = 0;

            var OverridableChild = OverridableParent.$extend({
                method: function() {
                    overridenCalled++;
                    return 2;
                }
            });

            var newMethodCalled = 0;

            OverridableChild.$override({
                method: function() {
                    newMethodCalled++;
                    return this.$super();
                }
            });

            var inst = new OverridableChild;
            inst.method();

            assert.equal(1, parentCalled);
            assert.equal(1, newMethodCalled);
            assert.equal(0, overridenCalled);
        });


        it("should intercept methods", function(){

            var InterceptedClass = cs.define({
                method: function() {
                    return 1;
                }
            });

            var inst = new InterceptedClass;

            var interceptorCalled = 0;

            inst.$intercept("method", function(){
                interceptorCalled++;
            });

            var res = inst.method();

            assert.equal(1, res);
            assert.equal(1, interceptorCalled);
        });

        it("should implement methods", function(){

            var parentMethodCalled = 0;

            var ParentClass = cs.define({
                method: function() {
                    parentMethodCalled++;
                    return 1;
                }
            });

            var ImplementableClass = ParentClass.$extend({});

            var inst = new ImplementableClass;

            var implementedCalled = 0;

            inst.$implement({
                method: function() {
                    implementedCalled++;
                    this.$super();
                    return 2;
                }
            });

            var anotherChildCalled = 0;

            var AnotherChild = ImplementableClass.$extend({
                method: function() {
                    anotherChildCalled++;
                    return this.$super();
                }
            });

            inst.method();

            var another = new AnotherChild;

            var res = another.method();

            assert.equal(1, implementedCalled);
            assert.equal(2, parentMethodCalled);
            assert.equal(1, anotherChildCalled);
            assert.equal(1, res);
        });


    });

});