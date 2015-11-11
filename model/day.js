
var Day = function (name, value){

    var that = this;

    this.swedishDayNames = {
        Friday: "Fredag",
        Saturday: "Lördag",
        Sunday: "Söndag"
    };

    this.timeSpansArray = [];
    this.name = name || "Some day";
    this.value = value || "";

    // Public methods
    this.GetNonConflictingTimes = function(otherDayObj){

        var nonConflictingTimeSpansArray = [];

        // Get conflicting time spans
        this.timeSpansArray.forEach(function(timeSpansObj){

            nonConflictingTimeSpansArray.push(otherDayObj.timeSpansArray.filter(timeSpansObj.DoesNotConflictWithTimeSpan));
        });

        return nonConflictingTimeSpansArray;
    };

    this.HasDayName = function(otherDayName){
        return (otherDayName === that.name || otherDayName === that.swedishDayNames[that.name]);
    };
};

module.exports = Day;