/**
 * Created by jopes on 2015-11-04.
 */

var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var router = express.Router();

// Require model dependencies
var Person = require('../model/person.js');

// Variables
var calendarString = "Kalendrar";
var cinemaString = "Stadens biograf!";
var dinnerString = "Zekes restaurang!!";
var personsArray = [];

var baseUrl;



// Handle url to scrape. Sent with POST form
router.post('/', function(req, res, next){

    var currentLink;

    // GET url from post
    baseUrl = req.body.urlToScrape;

    // Scrape the base url
    scrapeLinks(baseUrl, function(linksArray){

        // No links found
        if(!(linksArray instanceof Array)) {
            res.render('scrape_error', { message: "ERROR: Could not find any links in the scraped page. Please try again." });
            return;
        }

        // Loop through links
        for(var key in linksArray){

            currentLink =  linksArray[key];

            // Try to find calendar
            if(currentLink.title === calendarString){

                scrapeCalendar(currentLink.href);
            }

            // Try to find cinema
            if(currentLink.title === cinemaString){

                //scrapeCinema(linksArray[key].href);
            }

            // Try to find dinner
            if(currentLink.title === dinnerString){

                //scrapeDinner(linksArray[key].href);
            }
        }
    });

    //res.render('movies_scraped', { title: 'Scraping...' + url });
});

function scrapeCalendar(url, callback){

    var currentLink;
    url = fixUrl(baseUrl + url);

    scrapeLinks(url , function(linksArray) {

        // No links found
        if(!(linksArray instanceof Array)) {
            res.render('scrape_error', { message: "ERROR: Could not find any links in the scraped calendar page. Please try again." });
            return;
        }


        // Loop through links
        for(var key in linksArray){

            currentLink =  linksArray[key];

            scrapePerson(url + "/" + currentLink.href);
        }
    });
}

function fixUrl(urlString){
    return urlString.replace(/([^:]\/)\/+/g, "$1");
}

function scrapePerson(url, callback){

    url = (fixUrl(url));

    // Fetch the url
    request(url, function(error, response, html){

        // Check that there were no errors
        if(!error){

            var $, linksArray, name, person, fridayElemIndex, saturdayElemIndex, sundayElemIndex, tdElements;

            // Get jquery functionality with cheerio
            $ = cheerio.load(html);

            // Define an array that should contain parsed links
            linksArray = [];

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
            personsArray.push(person);

            //callback(linksArray);
        }
    })
}

function scrapeLinks(url, callback){

    console.log(url);

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