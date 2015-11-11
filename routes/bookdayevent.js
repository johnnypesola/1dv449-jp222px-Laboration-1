
// Require dependencies
var express = require('express');
var router = express.Router();

var ScrapeService = require('../model/scrapeservice.js');


// Handle url to scrape. Sent with POST form
router.post('/', function(req, res, next){

    var baseUrl,
        scraper;

    var postData = {
        group1: "", //fre1416
        username: "zeke",
        password: "coys",
        submit: "login"
    };

    // GET url from post
    console.log(req.body);
    //baseUrl = req.body;

    res.render('booking_result', {title: "Bokning genomfördes", message: "Bokningen genomfördes med ett lyckat resultat" });

    // Create scrape service
    //scraper = new ScrapeService(baseUrl);

    // Start scraping
    /*
    scraper.runScraper(function(eventsArray){

        // Render events from scraper
        res.render('events', {events: eventsArray });
    });
    */
});




module.exports = router;