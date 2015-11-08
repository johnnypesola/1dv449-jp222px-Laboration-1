/**
 * Created by jopes on 2015-11-04.
 */

var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var q = require('q');
var querystring =  require('querystring');
var router = express.Router();

// Require model dependencies
var Person = require('../model/person.js');
var Day = require('../model/day.js');
var Movie = require('../model/movie.js');
var TimeSpan = require('../model/timespan.js');
var Calendar = require('../model/calendar.js');

// Variables
var calendarString = "Kalendrar";
var cinemaString = "Stadens biograf!";
var dinnerString = "Zekes restaurang!";

var personObjArray = [];
var numberOfPersons = 0;

var movieObjArray = [];

var baseUrl;



// Handle url to scrape. Sent with POST form
router.post('/', function(req, res, next){

    // GET url from post
    baseUrl = req.body.urlToScrape;

    // Scrape the base url
    scrapeLinks(baseUrl, function(linksArray){

        // No links found
        if(!(linksArray instanceof Array)) {
            res.render('scrape_error', { message: "ERROR: Could not find any links in the scraped page. Please try again." });
            return;
        }

        // Scrape array of links found on startpage
        scrapeArrayOfStartPageLinks(linksArray);
    });
});

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
            scrapeArrayOfStartPageLinks(linksArray);
        });
    }
    else {
        callback();
    }
}

function scrapeDinner(url, callback){

    url = (fixUrl(baseUrl + "/" + url));

    // Fetch the url
    request(url, function(error, response, html) {

        var $;
        var availableDaysRawDataArray = [];

        // Get jquery functionality with cheerio
        $ = cheerio.load(html);

        $('div p input[type=radio]').each(function(index){
            var value = $(this).val();

            availableDaysRawDataArray.push(value);
        });

        parseDinnerDaysRawData(availableDaysRawDataArray);
    })
}

function parseDinnerDaysRawData(rawDataArray){

    var rawDayName, startHour, endHour;

    var calendar = new Calendar();

    rawDataArray.forEach(function(data){

        rawDayName = data.substr(0,3);
        startHour = data.substr(3,2) + ":00";
        endHour = data.substr(5,2) + ":00";

        // Parse day names
        if(rawDayName == "fre") {
            calendar.friday.dinnerAvailableTimesArray.push(
                new TimeSpan(startHour, endHour)
            );
        }
        else if(rawDayName == "lor") {
            calendar.saturday.dinnerAvailableTimesArray.push(
                new TimeSpan(startHour, endHour)
            );
        }
        else if(rawDayName == "son") {
            calendar.sunday.dinnerAvailableTimesArray.push(
                new TimeSpan(startHour, endHour)
            );
        }
    });

    console.log(calendar.sunday);
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

    url = (fixUrl(url));
    callback = callback || function(){};

    // Fetch the url
    request(url, function(error, response, html){

        // Check that there were no errors
        if(!error){

            var $, name, person, fridayElemIndex, saturdayElemIndex, sundayElemIndex, tdElements;

            // Get jquery functionality with cheerio
            $ = cheerio.load(html);

            // Get name
            name = $('h2').text();

            // Create person
            person = new Person(name);

            // Get free days
            fridayElemIndex =  $("th:contains('Friday')").index();
            saturdayElemIndex =  $("th:contains('Saturday')").index();
            sundayElemIndex =  $("th:contains('Sunday')").index();

            // Get table cells
            tdElements = $("td");

            person.freeOnfriday = (tdElements.eq(fridayElemIndex).text().toLowerCase() == "ok");
            person.freeOnSaturday = (tdElements.eq(saturdayElemIndex).text().toLowerCase() == "ok");
            person.freeOnSunday = (tdElements.eq(sundayElemIndex).text().toLowerCase() == "ok");

            // Store person
            personObjArray.push(person);

            // Execute callback
            callback();
        }
    })
}

function scrapeCinema(url, callback){

    url = (fixUrl(baseUrl + url));
    callback = callback || function(){};

    // Fetch the url
    request(url, function(error, response, html){

        // Check that there were no errors
        if(!error){

            var $;

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
        }
    })
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

                // Add new TimeSpan object to day object.
                jsonData.forEach(function(dataObj){

                    day.moviePlayTimesArray.push(
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

function scrapeLinks(url, callback){

    callback = callback || function(){};

    // Fetch the url
    request(url, function(error, response, html){

        var $, linksArray;

        // Check that there were no errors
        if(!error){

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
        }
    })
}


module.exports = router;