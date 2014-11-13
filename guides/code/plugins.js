cs.define({
    $class: "PluginClass",
    $constructor: function(hostObject, hostObjectArguments) {
    },
    $init: function(hostObject, hostObjectArguments) {
    },
    // called after mixin's $beforeInit and before host's $init
    $beforeHostInit: function() {
        // this function receives
        // the same parameters as host's constructor
        // this = plugin
    },
    // called after mixin's $afterInit
    $afterHostInit: function() {
        // this function receives
        // the same parameters as host's constructor
        // this = plugin
    },
    $beforeHostDestroy: function() {
        // before host's destroy()
        // the same arguments as host's destroy()
        // this = plugin
    }
    // and yes, plugins can have their own plugins :)
});

cs.define({
    $class: "PluginHost",
    $constructor: function(cfg) {
        this.$plugins = cfg.plugins;
    }
});

var host = new PluginHost({
    plugins: [PluginClass] // or ["PluginClass"]
});