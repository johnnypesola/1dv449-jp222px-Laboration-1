
// Module dependencies
var request = require('request');
var cheerio = require('cheerio');

// Model dependencies
var Person = require('../model/person.js');
var Day = require('../model/day.js');
var Movie = require('../model/movie.js');
var TimeSpan = require('../model/timespan.js');
var Dinner = require('../model/dinner.js');
var DayEvent = require('../model/day_event.js');
var Scraper = require('../model/scraper.js');

var ScrapeEventsService = function(baseUrl, res){

    // Init Variables
    var calendarString = "Kalendrar";
    var cinemaString = "Stadens biograf!";
    var dinnerString = "Zekes restaurang!";

    var personObjArray = [];
    var numberOfPersons = 0;

    var movieObjArray = [];
    var eventsArray = [];

    var dinnerObj;

    var dinnerBookingTargetUrl;

    // Create Scraper
    var scraperObj = new Scraper(baseUrl, res);

    // Public methods
    this.runScraper = function(callback){

        // Scrape the base url
        scraperObj.scrapeLinks(baseUrl, function(linksArray){

            // No links found
            if(!(linksArray instanceof Array)) {
                res.render('scrape_error', { message: "ERROR: Could not find any links in the scraped page. Please try again." });
                return;
            }

            // Scrape array of links found on startpage
            scrapeArrayOfStartPageLinks(linksArray, function(){

                // Get events
                eventsArray = getEventsFromScrapedData();

                // Run callback
                callback(eventsArray)
            });
        });
    };

    function scrapeArrayOfStartPageLinks(linksArray, callback){

        var functionToRun;
        callback = callback || function(){};

        if(linksArray instanceof Array && linksArray.length > 0){

            // Scrape one link one at a time to prevent exceeding 5 simultaneous GET requests.

            // Pick the first link and remove it from array
            var currentLink = linksArray.shift();

            if(currentLink.title === calendarString) {
                functionToRun = scrapeCalendar;
            }
            else if(currentLink.title === cinemaString) {
                functionToRun = scrapeCinema;
            }
            else if(currentLink.title === dinnerString) {
                functionToRun = scrapeDinner;
            }
            else {
                res.render('scrape_error', { message: "ERROR: Not all necessary links could be found in the scraped page. Please try again." });
                return;
            }

            // Run function
            functionToRun(currentLink.href, function(){

                // When function is complete, run next function by running this function again.
                scrapeArrayOfStartPageLinks(linksArray, callback);
            });
        }
        else {

            callback();
        }
    }

    function getEventsFromScrapedData(){

        var prelEventsArray = [],
            eventsArray = [],
            daysThatWorkForPersonsArray;

        // Loop for each movie
        movieObjArray.forEach(function(movie){

            // Loop for each movie play day
            movie.daysArray.forEach(function(movieDay){

                // Loop for each dinner day
                dinnerObj.daysArray.forEach(function(dinnerDay){

                    // Check that the days match.
                    if(movieDay.name == dinnerDay.name){

                        // Loop each dinner day time span
                        dinnerDay.timeSpansArray.forEach(function(dinnerDayTimeSpan){

                            // Loop each movie day time span
                            movieDay.timeSpansArray.forEach(function(movieDayTimeSpan){

                                // Check if dinner time span is after movie timespan
                                if(dinnerDayTimeSpan.IsAfterTimeSpan(movieDayTimeSpan)){

                                    // Add new event to preliminary events array
                                    prelEventsArray.push(
                                        new DayEvent(
                                            dinnerDay.name,
                                            movie.name,
                                            movieDayTimeSpan,
                                            dinnerDayTimeSpan,
                                            dinnerBookingTargetUrl
                                        )
                                    );
                                }
                            });
                        });
                    }
                });
            })
        });

        daysThatWorkForPersonsArray = getDaysThatWorkForPersons();

        prelEventsArray.forEach(function(eventObj){

            if(doesDayWorkForPersons(eventObj, daysThatWorkForPersonsArray)) {

                eventsArray.push(eventObj);
            }
        });

        return eventsArray;
    }

    function doesDayWorkForPersons(eventObj, daysThatWorkForPersonsArray){

        return daysThatWorkForPersonsArray.some(function(personDayObj){
            return personDayObj.HasDayName(eventObj.dayName);
        });
    }

    function getDaysThatWorkForPersons(){

        var tempPersonObjArray = personObjArray;

        // Pick the first person and remove from array
        var firstPerson = tempPersonObjArray.shift();

        // Get free days for all persons.
        return firstPerson.GetMutualFreeDays(tempPersonObjArray);
    }

    function scrapeDinner(url, callback){

        var $, availableDaysRawDataArray = [];

        callback = callback || function(){};
        url = (scraperObj.fixUrl(baseUrl + "/" + url));

        // Fetch the url
        scraperObj.fetchPage(url, function(html){

            // Get jquery functionality with cheerio
            $ = cheerio.load(html);

            // Get values from radiobuttons
            $('div p input[type=radio]').each(function(){
                var value = $(this).val();

                availableDaysRawDataArray.push(value);
            });

            // Get URL for dinner bookings
            dinnerBookingTargetUrl = (scraperObj.fixUrl(baseUrl + "/" + $('form').attr('action')));

            parseDinnerDaysRawData(availableDaysRawDataArray);

            // Execute callback
            callback();
        });
    }

    function parseDinnerDaysRawData(rawDataArray){

        var rawDayName, startHour, endHour, dayName, dayObj;

        dinnerObj = new Dinner();

        rawDataArray.forEach(function(data){

            rawDayName = data.substr(0,3);
            startHour = data.substr(3,2) + ":00";
            endHour = data.substr(5,2) + ":00";

            // Create Day object
            dayObj = new Day();

            // Parse day names
            dayName = (rawDayName === "fre" ? dayObj.swedishDayNames.Friday :
                        (rawDayName === "lor" ? dayObj.swedishDayNames.Saturday :
                            (rawDayName === "son" ? dayObj.swedishDayNames.Sunday : "")));

            // Add time span to day
            dinnerObj.AddTimeToDay(dayName, new TimeSpan(startHour, endHour));
        });
    }

    function scrapeCalendar(url, callback){

        var currentLink;

        callback = callback || function(){};
        url = scraperObj.fixUrl(baseUrl + url);

        scraperObj.scrapeLinks(url , function(linksArray) {

            // No links found
            if(!(linksArray instanceof Array)) {
                res.render('scrape_error', { message: "ERROR: Could not find any links in the scraped calendar page. Please try again." });
                return;
            }

            // Set number of persons
            numberOfPersons = linksArray.length;

            // Loop through links
            for(var key in linksArray){

                currentLink =  linksArray[key];

                // Scrape person
                scrapePerson(url + "/" + currentLink.href, function(){

                    // If all persons are scraped, execute callback
                    if(isPersonsScrapeDone()) {
                        callback();
                    }
                });
            }
        });
    }

    function scrapePerson(url, callback){

        var $, name, person, fridayElemIndex, saturdayElemIndex, sundayElemIndex, tdElements;

        url = (scraperObj.fixUrl(url));
        callback = callback || function(){};

        // Fetch the url
        scraperObj.fetchPage(url, function(html){

            // Get jquery functionality with cheerio
            $ = cheerio.load(html);

            // Get name
            name = $('h2').text();

            // Create person
            person = new Person(name);

            // Get free days indexes
            fridayElemIndex =  $("th:contains('Friday')").index();
            saturdayElemIndex =  $("th:contains('Saturday')").index();
            sundayElemIndex =  $("th:contains('Sunday')").index();

            // Get table cells with th indexes
            tdElements = $("td");

            person.freeOnFriday = (tdElements.eq(fridayElemIndex).text().toLowerCase() == "ok");
            person.freeOnSaturday = (tdElements.eq(saturdayElemIndex).text().toLowerCase() == "ok");
            person.freeOnSunday = (tdElements.eq(sundayElemIndex).text().toLowerCase() == "ok");

            // Store person
            personObjArray.push(person);

            // Execute callback
            callback();
        })
    }

    function scrapeCinema(url, callback){

        var $;

        url = (scraperObj.fixUrl(baseUrl + url));
        callback = callback || function(){};

        // Fetch the url
        scraperObj.fetchPage(url, function(html){

            // Get jquery functionality with cheerio
            $ = cheerio.load(html);

            // Get movie (ajax) values
            $("select[name='movie'] option:not(:disabled)").each(function(){

                var movieName = $(this).text();
                var movieValue = $(this).val();

                movieObjArray.push(
                    new Movie(movieName, movieValue)
                )
            });

            // Get day and create new Day to movie.daysArray
            $("select[name='day'] option:not(:disabled)").each(function(){

                var dayName = $(this).text();
                var dayValue = $(this).val();

                movieObjArray.forEach(function(movie){

                    movie.daysArray.push(new Day(dayName, dayValue));
                });
            });

            // Get movies for days status (if movies are free or fully booked for specific days).
            getMovieDaysStatus(scraperObj.fixUrl(url + "/check"), callback);
        });
    }

    function getMovieDaysStatus(url, callBack){

        callBack = callBack || function(){};

        var queryString;
        var requestCount = 0;
        var maxRequests = 0;

        // Pretend this is some complicated async factory
        movieObjArray.forEach(function(movie){

            movie.daysArray.forEach(function(day){

                queryString = {
                    movie: movie.value,
                    day: day.value
                };

                // Get day status
                request.get({url:url, qs:queryString, json: true}, function (error, response, jsonData) {

                    // In case there were no errors
                    if(!scraperObj.checkForGetError(error, response)){

                        // Add new TimeSpan object to day object.
                        jsonData.forEach(function(dataObj){

                            day.timeSpansArray.push(
                                new TimeSpan(dataObj.time, null, dataObj.status)
                            );
                        });

                        requestCount++;

                        // Set max requests if needed
                        if(!maxRequests){
                            maxRequests = jsonData.length * movie.daysArray.length;
                        }

                        // Execute callback if its the last request
                        if(requestCount === maxRequests){

                            callBack();
                        }
                    }
                })
            });
        });
    }

    function isPersonsScrapeDone(){

        return personObjArray.length === numberOfPersons;
    }
};

module.exports = ScrapeEventsService;