#MetaphorJs.lib.Class

```js
// require class system and namespace
var Class = require("metaphorjs-class"),
    Namespace = require("metaphorjs-namespace");

// global classes
var cs = new Class;

cs.define("My.Class", {
    someProperty: null,
    someMethod: function(){}
});

cs.define("My.Another", "My.Class", {

    someMethod: function(){
        this.supr(); // call parent someMethod()
    }

});

var instance1 = new My.Class;
var instance2 = cs.factory("My.Class");

// private namespace

var localNs = {},
    ns = new Namespace(localNs, "localNs"),
    cs = new Class(ns);

cs.define("My.Class", {}); // localNs.My.Class

var i1 = new localNs.My.Class;
var i2 = cs.factory("My.Class");
var constr = ns.get("My.Class");
var i3 = new constr;



```