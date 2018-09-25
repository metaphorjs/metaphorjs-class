var cls = require("metaphorjs-class");

// re-initialise in global namespace
var globalNs = new cls.Namespace(window);
var globalCls = cls.classManagerFactory(globalNs);
globalCls({
    $class: "My.Global.Class",
    $init: function() {
        console.log("instance created");
    }
});
new My.Global.Class(); // implied window.My.Global.Class

// In private namespace you don't have access to
// namespace root
cls({
    $class: "My.Private.Class"
});
var instance = cls.factory("My.Private.Class");

// But you can register your own public space
// (make sure to register needed space before using it)
var public = {};
cls.ns.register("public", public);
cls({
    $class: "public.Class"
});

var anotherInstance = new public.Class();

