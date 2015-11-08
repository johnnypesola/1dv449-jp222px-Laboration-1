
var MoviePlayTime = function (startTime, fullyBooked){

    this.startTime = startTime || "00:00";
    this.fullyBooked = (fullyBooked === 1 || fullyBooked === true) || false;
};

module.exports = MoviePlayTime;