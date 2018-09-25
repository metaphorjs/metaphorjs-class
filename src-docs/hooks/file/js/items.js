
var globalCache = require("metaphorjs-documentor/src/var/globalCache.js");

module.exports = globalCache.add("file.js.items", 
    globalCache.get("file.js.items").concat([
    {
        name: "object",
        stackable: true,
        children: ["property"],
        displayName: "Object",
        groupName: "Objects",
        transform: {
            "var": "property",
            "type": "property"
        }
    },

    {
        name: "api",
        displayName: "API",
        groupName: "API"
    }
]));

