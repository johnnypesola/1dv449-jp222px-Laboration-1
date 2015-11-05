var Person = function (name){

    this.name = name || "Some person";

    this.freeOnfriday = false;
    this.freeOnSaturday = false;
    this.freeOnSunday = false;
};

module.exports = Person;