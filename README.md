#MetaphorJs.Class

```js
// require class system and namespace
var cls = require("metaphorjs-class");

cls({
    $class: "My.Class",
    someProperty: null,
    someMethod: function(){}
});

var MyAnother = cls({
    $class: "My.Another",
    $extends: "My.Class",
    someMethod: function(){
        this.$super(); // call parent someMethod()
    }
});

var instance1 = cls.factory("My.Class");
var instance2 = new MyAnother();

// Your own private namespace
var localNs = {},
    ns = new cls.Namespace(localNs),
    cls = cls.classManagerFactory(ns);

cls({
    $class: "My.Class"
}); // localNs.My.Class

var i1 = new localNs.My.Class;
var i2 = cls.factory("My.Class");
var constr = ns.get("My.Class");
var i3 = new constr;

```