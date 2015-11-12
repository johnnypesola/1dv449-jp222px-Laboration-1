
// Module dependencies
var request = require('request');
var cheerio = require('cheerio');
var robots = require('robots');

// Model dependencies
var Person = require('../model/person.js');
var Day = require('../model/day.js');
var Movie = require('../model/movie.js');
var TimeSpan = require('../model/timespan.js');
var Dinner = require('../model/dinner.js');
var DayEvent = require('../model/dayevent.js');

var ScrapeService = function(baseUrl, res){

    // Init Variables
    var scraperAgentName = "scraperbot";

    var calendarString = "Kalendrar";
    var cinemaString = "Stadens biograf!";
    var dinnerString = "Zekes restaurang!";

    var personObjArray = [];
    var numberOfPersons = 0;

    var movieObjArray = [];
    var eventsArray = [];

    var dinnerObj;

    var dinnerBookingTargetUrl;

    // Create robots.txt parser
    var robotsParser = new robots.RobotsParser();
    var robotsTxtFile = fixUrl(baseUrl + "/robots.txt");

    // Public methods
    this.runScraper = function(callback){

        // Scrape the base url
        scrapeLinks(baseUrl, function(linksArray){

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

    // Private methods

    function checkForGetError(error, response){

        // Check if there was an error.
        if (error || response.statusCode != 200) {

            res.render('scrape_error', { message: "ERROR: Got code '" + response.statusCode + "' fetching '" + url + "'"});

            return true;
        }

        return false;
    }

    function fetchPage(url, callback){

        // Prepare som options for request.js
        var requestOptions = {
            url: url,
            headers: {
                'User-Agent': scraperAgentName
            }
        };

        // Get robots.txt
        robotsParser.setUrl(robotsTxtFile, function(robotsParser, success) {
            if (success) {

                // If its ok to fetch the target link according to robots.txt
                robotsParser.canFetch('*', '/' + stripBaseUrl(url), function (access) {
                    if (access) {

                        // Get the page specified in options
                        request(requestOptions, function(error, response, html) {

                            // In case there were no errors
                            if (!checkForGetError(error, response)) {

                                // Execute callback
                                callback(html);
                            }
                        });
                    }
                    else {
                        res.render('scrape_error', { message: "ERROR: robots.txt on host server prevents access to '" + url + "'"});
                    }
                });
            }
            else {
                res.render('scrape_error', { message: "ERROR: Occurred fetching robots.txt'"});
            }
        });
    }

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
        url = (fixUrl(baseUrl + "/" + url));

        // Fetch the url
        fetchPage(url, function(html){

            // Get jquery functionality with cheerio
            $ = cheerio.load(html);

            // Get values from radiobuttons
            $('div p input[type=radio]').each(function(index){
                var value = $(this).val();

                availableDaysRawDataArray.push(value);
            });

            // Get URL for dinner bookings
            dinnerBookingTargetUrl = (fixUrl(baseUrl + "/" + $('form').attr('action')));

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
        url = fixUrl(baseUrl + url);

        scrapeLinks(url , function(linksArray) {

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

        url = (fixUrl(url));
        callback = callback || function(){};

        // Fetch the url
        fetchPage(url, function(html){

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

        url = (fixUrl(baseUrl + url));
        callback = callback || function(){};

        // Fetch the url
        fetchPage(url, function(html){

            // Get jquery functionality with cheerio
            $ = cheerio.load(html);

            // Get movie (ajax) values
            $("select[name='movie'] option:not(:disabled)").each(function(index){

                var movieName = $(this).text();
                var movieValue = $(this).val();

                movieObjArray.push(
                    new Movie(movieName, movieValue)
                )
            });

            // Get day and create new Day to movie.daysArray
            $("select[name='day'] option:not(:disabled)").each(function(index){

                var dayName = $(this).text();
                var dayValue = $(this).val();

                movieObjArray.forEach(function(movie, index, array){

                    movie.daysArray.push(new Day(dayName, dayValue));
                });
            });

            // Get movies for days status (if movies are free or fully booked for specific days).
            getMovieDaysStatus(fixUrl(url + "/check"), callback);
        });
    }

    function getMovieDaysStatus(url, callBack){

        callBack = callBack || function(){};

        var queryString;
        var requestCount = 0;
        var maxRequests = 0;

        // Pretend this is some complicated async factory
        movieObjArray.forEach(function(movie, index, array){

            movie.daysArray.forEach(function(day, index, array){

                queryString = {
                    movie: movie.value,
                    day: day.value
                };

                // Get day status
                request.get({url:url, qs:queryString, json: true}, function (error, response, jsonData) {

                    // In case there were no errors
                    if(!checkForGetError(error, response)){

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

    function fixUrl(urlString){
        return urlString.replace(/([^:]\/)\/+/g, "$1");
    }

    function stripBaseUrl(urlString){

        return urlString.replace(baseUrl, "");
    }

    function scrapeLinks(url, callback){

        var $, linksArray;

        callback = callback || function(){};

        // Fetch the url
        fetchPage(url, function(html){

            // Get jquery functionality with cheerio
            $ = cheerio.load(html);

            // Define an array that should contain parsed links
            linksArray = [];

            // Loop trough links in page
            $('a').each(function(index) {

                // Create object of link and store in array
                linksArray.push(
                    {
                        title : $(this).text(),
                        href : $(this).attr('href')
                    }
                )
            });

            callback(linksArray);
        });
    }
};

module.exports = ScrapeService;