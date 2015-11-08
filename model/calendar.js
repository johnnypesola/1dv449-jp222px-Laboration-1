
var Day = require('./day.js');

var Calendar = function(){

    this.friday = new Day("Friday");
    this.saturday = new Day("Saturday");
    this.sunday = new Day("Sunday");
};

module.exports = Calendar;