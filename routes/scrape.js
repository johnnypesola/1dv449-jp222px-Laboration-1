
// Require dependencies
var express = require('express');
var router = express.Router();

var ScrapeService = require('../model/scrapeservice.js');


// Handle url to scrape. Sent with POST form
router.post('/', function(req, res, next){

    var baseUrl,
        scraper;

    // GET url from post
    baseUrl = req.body.urlToScrape;

    // Create scrape service
    scraper = new ScrapeService(baseUrl);

    // Start scraping
    scraper.runScraper(function(eventsArray){

        // Render events from scraper
        res.render('events', {events: eventsArray });
    });
});


module.exports = router;