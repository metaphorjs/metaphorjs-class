// initialization cycle:
// 1. $constructor (call parent constructor with this.$super())
// 2. mixin's $beforeInit (mixins are not classes, they don't have $super(); '$beforeInit's
//    are called in order mixins are specified)
// 3. plugin's $beforeHostInit (plugins are classes, they have their own $super())
// 4. $init (call parent $init with this.$super())
// 5. mixin's $afterInit
// 6. plugin's $afterHostInit

// destroy cycle (call instance.$destroy())
// 1. mixin's $beforeDestroy method
// 2. plugin's $beforeHostDestroy method
// 3. instance's destroy() method
// 4. mixin's $afterDestroy method
// 5. plugin's $destroy method
// the $destroy method will nullify all instance properties and methods.
// if you want to prevent this, return false from your destroy() method.

var cs = new MetaphorJs.Class;

// define(methodsAndProperties, statics)
cs.define({
    $class: "My.Person",
    firstName: null,
    lastName: null,

    $constructor: function(firstName, lastName){
        // if you want to use plugins, this function must set them up
        // (probably take them from config)
        // you can't define plugins in class's definition; this is "run-time" only.

        //this.$plugins = [...];

        // call parent constructor
        this.$super();
    },

    // the class itself can't have $beforeInit and $afterInit methods
    // they come from mixins
    $init: function(firstName, lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.$super();
    },
    getName: function() {
        return this.firstName + " " + this.lastName;
    }
});
// define() returns newly created classes,
// so you can create anonimous classes by omitting $class: "...".

var mixin = {
    $beforeInit: function() {
        // will be called before host class initialized
    },
    $afterInit: function() {
        // will be called after host class initialized
    },
    mixinFunc: function() {
    }
};

cs.define({
    $class: "My.ExtendedPerson",
    $extends: "My.Person",
    $mixins: [mixin], // or ["MixinName"] where it was added to namespace as mixin.MixinName
    age: null,
    $init: function(firstName, lastName, age) {
        this.$super(firstName, lastName);
        this.age = age;
    },
    getAge: function() {
        return this.age;
    }
});

cs.define({
    $class: "PluginClass",
    $init: function(hostObject, hostObjectArguments) {
        // plugin's $init and $constructor receive host object
        // as the first parameter, and
        // host's arguments as the second.
    },
    // called after $beforeInit and before $init
    $beforeHostInit: function() {
        // this function receives
        // the same parameters as host's constructor
    },
    // called after $afterInit
    $afterHostInit: function() {
        // this function receives
        // the same parameters as host's constructor
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
    plugins: [PluginClass]
});

// you can use $extend shortcut to avoid calling "define()"
// and there is a cs.BaseClass.$extend you can start with.
var ClassWithoutName = My.ExtendedPerson.$extend({
    getAge: function() {
        return this.$super() * 10;
    }
});

// you can also extend your own classes:
var PrototypedClass = function() {
    // this will become $constructor
};
PrototypedClass.prototype.someMethod = function(){};

cs.define({
    $class: "SomeClass",
    $extends: PrototypedClass,
    $constructor: function() {
        this.$super(); // call PrototypedClass constructor
    }
});

// instantiate with variable number of arguments:
var person = My.ExtendedPerson.$instantiate(["John", "Smith", 30]);
var second = cs.factory("My.ExtendedPerson", "John", "Smith", 30);
var another = new My.ExtendedPerson("Jane", "Smith", 29);
