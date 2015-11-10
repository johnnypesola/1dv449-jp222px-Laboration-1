
var Day = require('./day.js');

var Dinner = function(){

    this.daysArray = [];
    var that = this;

    // Private methods
    var GetDay = function(dayName){

        var returnValue;

        if(that.daysArray.length > 0) {
            that.daysArray.forEach(function(day){

                if(day.name === dayName){

                    returnValue = day;
                }
            });
        }
        return returnValue || false;
    };

    // Public methods
    this.AddTimeToDay = function(dayName, timeSpanObj){

        var existingDay, newDay;

        existingDay = GetDay(dayName);

        // If day already exists
        if(existingDay){

            // Add time span to existing day object
            existingDay.timeSpansArray.push(timeSpanObj);

        } else {
            // Create new day object
            newDay = new Day(dayName);

            // Add time span obj
            newDay.timeSpansArray.push(timeSpanObj);

            // Add new day
            that.daysArray.push(newDay);
        }
    }
};

module.exports = Dinner;