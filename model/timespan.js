
var TimeSpan = function (startTime, endTime, fullyBooked){

    // Private methods
    var parseHours = function(timeString){
        return Number(timeString.substr(0,2));
    };

    var parseMinutes = function(timeString){
        return Number(timeString.substr(3,2));
    };

    // Init values
    this.startTime = startTime || "00:00";
    this.endTime = endTime || ((parseHours(startTime)+2)+":"+this.startTime.substr(3,2)); // TODO: account for passing 23:59

    this.startHour = parseHours(this.startTime);
    this.startMinute = parseMinutes(this.startTime);

    this.endHour = parseHours(this.endTime);
    this.endMinute = parseMinutes(this.endTime);

    this.militaryStartTime = (this.startHour * 100) + this.startMinute;
    this.militaryEndTime = (this.endHour * 100) + this.endMinute;

    this.fullyBooked = (fullyBooked === 1 || fullyBooked === true) || false;

    var that = this;

    // Public methods
    this.DoesNotConflictWithTimeSpan = function(otherTimeSpanObj){
        return !(that.DoesConflictWithTimeSpan(otherTimeSpanObj));
    };

    this.DoesConflictWithTimeSpan = function(otherTimeSpanObj){

        // Conflict check
        return (
            that.militaryStartTime < otherTimeSpanObj.militaryStartTime &&
            that.militaryEndTime > otherTimeSpanObj.militaryStartTime ||

            that.militaryStartTime > otherTimeSpanObj.militaryStartTime &&
            that.militaryStartTime < otherTimeSpanObj.militaryEndTime ||

            that.militaryStartTime > otherTimeSpanObj.militaryStartTime &&
            that.militaryEndTime < otherTimeSpanObj.militaryEndTime
        );
    };

    this.IsAfterTimeSpan = function(otherTimeSpanObj){
        return that.militaryStartTime >= otherTimeSpanObj.militaryEndTime;
    }
};

module.exports = TimeSpan;