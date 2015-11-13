var DayEvent = function(dayName, movieName, movieTimeSpan, dinnerTimeSpan, targetUrl){

    this.dayName = dayName;
    this.movieName = movieName;
    this.movieTimeSpan = movieTimeSpan;
    this.dinnerTimeSpan = dinnerTimeSpan;
    this.targetUrl = targetUrl;
};

module.exports = DayEvent;

