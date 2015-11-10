


var Day = function (name, value){

    this.timeSpansArray = [];
    this.name = name || "Some day";
    this.value = value || "";
    var that = this;


    // Public methods
    this.GetNonConflictingTimes = function(otherDayObj){

        var nonConflictingTimeSpansArray = [];

        // Get conflicting time spans
        this.timeSpansArray.forEach(function(timeSpansObj){

            nonConflictingTimeSpansArray.push(otherDayObj.timeSpansArray.filter(timeSpansObj.DoesNotConflictWithTimeSpan));
        });

        return nonConflictingTimeSpansArray;
    };

    this.GetTimesAfter = function(){

    }
};

module.exports = Day;