var Day = require('./day.js');

var Person = function (name){

    var that = this;

    this.name = name || "Some person";

    this.freeOnFriday = false;
    this.freeOnSaturday = false;
    this.freeOnSunday = false;

    // Public methods
    this.GetMutualFreeDays = function(otherPersonArray){

        var doesFridayWork = true,
            doesSaturdayWork = true,
            doesSundayWork = true,
            returnDaysArray = [];

        otherPersonArray.push(that);

        var allPersonsArray = otherPersonArray;

        allPersonsArray.forEach(function(person){
            doesFridayWork = (!person.freeOnFriday ? false : doesFridayWork);
            doesSaturdayWork = (!person.freeOnSaturday ? false : doesSaturdayWork);
            doesSundayWork = (!person.freeOnSunday ? false : doesSundayWork);
        });

        if(doesFridayWork){
            returnDaysArray.push(
                new Day("Friday")
            );
        }
        if(doesSaturdayWork){
            returnDaysArray.push(
                new Day("Saturday")
            );
        }
        if(doesSundayWork){
            returnDaysArray.push(
                new Day("Sunday")
            );
        }

        return returnDaysArray;
    }
};

module.exports = Person;