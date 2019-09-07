var mixin = {
    $beforeInit: function() {
        // will be called before host class initialized
        // receives the same arguments as the constructor
        // this = class instance
    },
    $afterInit: function() {
        // will be called after host class initialized
        // receives the same arguments as the constructor
        // this = class instance
    },
    $beforeDestroy: function() {
        // before class's destroy() method
        // receives the same arguments
        // this = class instance
    },
    $afterDestroy: function() {
        // after class's destroy() method
        // receives the same arguments
        // this = class instance
    },
    mixinFunc: function() {
    }
};

var ClassWithMixins = cls({
    $mixins: [mixin]
});

var instance = new ClassWithMixins;
instance.mixinFunc();

// you can also use namespace registry
cls.ns.add("mixin.myFirstMixin", {
    $beforeInit: function() {},
    $afterInit: function() {},
    mixinFunc: function() {}
});

cls({
    $mixins: ["mixin.myFirstMixin"]
});