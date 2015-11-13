
// Module dependencies
var request = require('request');
var cheerio = require('cheerio');
var robots = require('robots');

var Scraper = function(baseUrl, res){

    // Init Variables
    var that = this;
    var scraperAgentName = "scraperbot";

    // Create robots.txt parser
    var robotsParser = new robots.RobotsParser();

    // Public methods
    this.checkForGetError = function(error, response){

        // Check if there was an error.
        if (error || response.statusCode != 200) {

            res.render('scrape_error', { message: "ERROR: Got code '" + response.statusCode + "' fetching '" + url + "'"});

            return true;
        }

        return false;
    };

    this.fetchPage = function(url, callback){

        var robotsTxtFile = that.fixUrl(baseUrl + "/robots.txt");

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
                robotsParser.canFetch('*', '/' + that.stripBaseUrl(url), function (access) {
                    if (access) {

                        // Get the page specified in options
                        request(requestOptions, function(error, response, html) {

                            // In case there were no errors
                            if (!that.checkForGetError(error, response)) {

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
    };


    this.fixUrl = function(urlString){
        return urlString.replace(/([^:]\/)\/+/g, "$1");
    };

    this.stripBaseUrl = function(urlString){

        return urlString.replace(baseUrl, "");
    };

    this.scrapeLinks = function(url, callback){

        var $, linksArray;

        callback = callback || function(){};

        // Fetch the url
        that.fetchPage(url, function(html){

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
    };
};

module.exports = Scraper;