var cs = new MetaphorJs.Class;

// define(methodsAndProperties, statics)
var myPersonContructor = cs.define({

    $class: "My.Person", // optional namespace path

    firstName: null,
    lastName: null,

    // generally, you probably will use $constructor
    // only when defining some base classes
    $constructor: function(firstName, lastName){
        // call parent $constructor()
        this.$super();
    },

    $init: function(firstName, lastName) {
        this.firstName = firstName;
        this.lastName = lastName;

        // call parent $init()
        this.$super();
    },

    getName: function() {
        return this.firstName + " " + this.lastName;
    },

    destroy: function() {
        // do some cleanup
        // (all properties will be nullified automatically)
    }
});

// you can instantiate class via
new myPersonContructor(firstName, lastName);
// also, depending on the namespace used to initialize class system
// you can instantiate class via
new window.My.Person(firstName, lastName);
// it may be global.My.Person, or yourPrivateNs.My.Person
// or
myPersonConstructor.$instantiate(firstName, lastName);
// or
window.My.Person.$instantiate(firstName, lastName);
// or
cs.factory("My.Person", firstName, lastName);

// you can also define classes by extending the BaseClass

cs.BaseClass.$extend({
    //...
});