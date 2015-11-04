/**
 * Created by jopes on 2015-11-04.
 */

var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var router = express.Router();


// Setup exception object.


// Handle url to scrape. Sent with POST form
router.post('/', function(req, res, next){

    var url, link;

    // GET url from post
    url = req.body.urlToScrape;

    // Scrape the base url
    scrapeLinks(url, function(linksArray){

        // No links found
        if(!(linksArray instanceof Array))
        {
            res.render('scrape_error', { message: "ERROR: Could not find any links in the scraped page. Please try again." });
            return;
        }

        // Loop through links
        for(link in linksArray){
            scrapeLinks(link.href)
        }

    });

    //res.render('movies_scraped', { title: 'Scraping...' + url });
});

function scrapeCalendar(url, callback){

    scrapeLinks()
}

function scrapeLinks(url, callback){

    // Fetch the url
    request(url, function(error, response, html){

        // Check that there were no errors
        if(!error){

            // Get jquery functionality with cheerio
            var $ = cheerio.load(html);

            // Define an array that should contain parsed links
            var linksArray = [];

            // Loop trough links in page
            $('a').each(function(index) {

                console.log($(this).text());

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