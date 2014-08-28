
var assert = require("assert"),
    mods = require("./lib/metaphorjs.class.amd.js"),
    Class = mods.Class,
    Namespace = mods.Namespace;

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

    });

});