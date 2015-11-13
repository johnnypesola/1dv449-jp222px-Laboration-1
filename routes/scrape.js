
// Require dependencies
var express = require('express');
var router = express.Router();

var ScrapeEventsService = require('../model/scrape_events_service.js');


// Handle url to scrape. Sent with POST form
router.post('/', function(req, res, next){

    var baseUrl,
        scraper,
        robotsParser;

    // GET url from post
    baseUrl = req.body.urlToScrape;

    // Create scrape service
    scraper = new ScrapeEventsService(baseUrl, res);

    // Start scraping
    scraper.runScraper(function(eventsArray){

        // Render events from scraper
        res.render('events', {events: eventsArray });
    });
});

module.exports = router;