
module.exports = function(doc) {

    doc.addContent({
        id: "intro",
        type: "guide",
        file: "src-docs/guides/intro.html",
        name: "Class system"
    });

    doc.addContent({
        id: "lifecycle",
        type: "guide",
        file: "src-docs/guides/lifecycle.html",
        name: "Class lifecycle"
    });

    doc.addContent({
        id: "define",
        type: "guide",
        file: "src-docs/guides/define.html",
        name: "Define class"
    });

    doc.addContent({
        id: "mixins",
        type: "guide",
        file: "src-docs/guides/mixins.html",
        name: "Mixins"
    });

    doc.addContent({
        id: "plugins",
        type: "guide",
        file: "src-docs/guides/plugins.html",
        name: "Plugins"
    });

    doc.addContent({
        id: "misc",
        type: "guide",
        file: "src-docs/guides/misc.html",
        name: "Misc"
    });
};