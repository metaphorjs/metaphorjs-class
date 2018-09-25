

// you can save class into your own var
var PersonClass = cls({

    // Or you can save it to namespace (or both)
    $class: "My.Person", 

    firstName: null,
    lastName: null,

    // Normally, you don't use this constructor
    $constructor: function(firstName, lastName){
        
        // Use this constructor to define plugins.
        // They will initialise before $init()
        // this.$plugins.push(SomePlugin);
        // this.$plugins.push("Another.Plugin");

        this.$super(arguments);
    },

    // Your standard constructor
    $init: function(firstName, lastName) {
        this.firstName = firstName;
        this.lastName = lastName;

        // call parent $init()
        this.$super(arguments);
    },

    getName: function() {
        return this.firstName + " " + this.lastName;
    },

    onDestroy: function() {
        // do some cleanup
        // (all properties will be nullified automatically)
    }
});

// you can also define classes via
cls.define({});
// cls === cls.define


// you can instantiate class via
new PersonClass(firstName, lastName);

// If you used global namespace to initialise class system
// you can just do this:
new My.Person(firstName, lastName);

// or
PersonClass.$instantiate(firstName, lastName);
// or
window.My.Person.$instantiate(firstName, lastName);
// or
cls.factory("My.Person", firstName, lastName);

// you can also define classes by extending the BaseClass

cls.BaseClass.$extend({
    //...
});

var Alter = PersonClass.$extend({
    $class: "My.Alter",

    // override method
    getName: function() {
        return this.lastName + " " + this.firstName;

        // this.$super() calls parent
    }
});

// Another way
cls({
    $class: "My.Alter2",
    $extends: "My.Person"
});