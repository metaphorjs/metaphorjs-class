cs.define({

    $class: "My.ExtendedPerson",
    $extends: "My.Person",

    age: null,

    $init: function(firstName, lastName, age) {
        this.$super(firstName, lastName);
        this.age = age;
    },

    getAge: function() {
        return this.age;
    }
});

// or

myPersonContructor.$extend({
    $class: "My.ExtendedPerson"
    // ...
});

// or

window.My.Person.$extend({
    // ...
});

// or

cs.define({
    // ...
    $extends: myPersonContructor
    // ...
});