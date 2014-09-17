
var assert = require("assert"),
    Class = require("../src/metaphorjs.class.js"),
    Namespace = require("../../metaphorjs-namespace/src/metaphorjs.namespace.js");

describe("Class", function(){

    describe("definition", function(){

        var local   = {},
            ns = new Namespace(local, "local"),
            cs = new Class(ns);

        it("should define class", function(){

            cs.define("My.Class", {
                method: function(){
                    return 1;
                }
            });

            assert.notEqual(undefined, local.My.Class);

            var inst = new local.My.Class;

            assert.equal(1, inst.method());
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

            cs.define("My.SecondClass", "My.Class", {});

            var inst = cs.factory("My.SecondClass");

            assert.equal(true, cs.isInstanceOf(inst, local.My.SecondClass));
            assert.equal(true, cs.isInstanceOf(inst, "local.My.SecondClass"));
            assert.equal(true, cs.isInstanceOf(inst, "My.SecondClass"));

            assert.equal(true, cs.isSubclassOf(local.My.SecondClass, local.My.Class));
            assert.equal(true, cs.isSubclassOf("local.My.SecondClass", "local.My.Class"));
            assert.equal(true, cs.isSubclassOf("My.SecondClass", "My.Class"));

            assert.equal(true, inst instanceof local.My.SecondClass);
            assert.equal(true, inst instanceof local.My.Class);
        });

        it("should extend native classes", function(){

            var SomeNativeClass = function() {

            };

            SomeNativeClass.prototype = {
                someFunc: function() {}
            };

            cs.define("My.ThrirdClass", SomeNativeClass, {});

            var inst = cs.factory("My.ThrirdClass");

            assert.equal(true, inst instanceof local.My.ThrirdClass);
            assert.equal(true, inst instanceof SomeNativeClass);
        });


    });

});