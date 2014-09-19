
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
                    this.supr();
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

            cs.define(
                function(){
                    parentConstrCalled++;
                },
                {
                $class: "ParentClass",
                $init: function() {
                    parentInitCalled++;
                }
            });

            cs.define(
                function(){
                    childConstrCalled++;
                    this.supr();
                },
                {
                $class: "ChildClass",
                $extends: "ParentClass",
                $init: function() {
                    childInitCalled++;
                    this.supr();
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
                    return this.supr();
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
                    this.supr();
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

            var PluginHost = cs.define(
                function(){
                    this.$plugins = [PluginClass];
                },
                {
                    $class: "PluginHost"
                });

            var inst = new PluginHost;

            assert.equal(1, beforeHostCalled);
            assert.equal(1, afterHostCalled);
        });

    });

});