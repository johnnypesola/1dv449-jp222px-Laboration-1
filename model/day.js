
var Day = function (name, value){

    var that = this;

    this.swedishDayNames = {
        Friday: "Fredag",
        Saturday: "Lördag",
        Sunday: "Söndag"
    };

    this.swedishDayNamesWebSafe = {
        Friday: "fre",
        Saturday: "lor",
        Sunday: "son"
    };

    this.timeSpansArray = [];
    this.name = name || "Someday";
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

    this.getSwedishDayNameWebSafe = function(){

        var englishDayName = false;

        // Loop through swe day names
        for (var property in that.swedishDayNames) {

            // If its the right one.
            if(that.swedishDayNames[property] == that.name){

                // We have the english day name
                englishDayName = property;
                break;
            }
        }

        if(!englishDayName) {
            return false;
        }

        return that.swedishDayNamesWebSafe[englishDayName];
    }
};

module.exports = Day;