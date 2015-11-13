
// Require dependencies
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var querystring =  require('querystring');
var router = express.Router();

var ScrapeService = require('../model/scrape_events_service.js');
var Day = require('../model/day.js');


// Handle url to scrape. Sent with POST form
router.post('/', function(req, res, next){

    var dataStr,
        scraper,
        dayObj,
        dinnerTimeStr,
        targetUrl;

    // Format postdata
    dayObj = new Day(req.body.dayName);
    targetUrl = req.body.targetUrl;

    // Build strings
    dinnerTimeStr = req.body.dinnerStartTime.substr(0,2) + req.body.dinnerEndTime.substr(0,2);

    dataStr = dayObj.getSwedishDayNameWebSafe() + dinnerTimeStr;

    // Prepare post data
    var postData = {
        group1: dataStr,
        username: "zeke",
        password: "coys",
        submit: "login"
    };

    // Do POST
    request.post(targetUrl, {form: postData}, function(error, response, html){

        // Check if it was successful
        if(html.indexOf("OK!") > -1){
            res.render('booking_result', {title: "Bokning genomfördes", message: "Bokningen genomfördes med ett lyckat resultat" });
        }
        else {
            res.render('booking_result', {title: "Bokning kunde inte genomföras", message: "Ett okänt fel uppstod när bokningen skulle genomföras." });
        }
    });
});




module.exports = router;