// you can also extend your own classes:
var PrototypedClass = function() {
    // this will become $constructor
};
PrototypedClass.prototype.someMethod = function(){};

cls({
    $class: "SomeClass",
    $extends: PrototypedClass,
    $constructor: function() {
        this.$super(); // call PrototypedClass constructor
    }
});
