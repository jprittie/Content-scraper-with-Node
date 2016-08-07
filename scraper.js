// This is the callback hell version of this project
// But I plan to re-do it with promises

"use strict";

// Require modules
var request = require("request");
var fs = require("fs");
/* I used cheerio as my scraping package because:
- it has jQuery syntax, so there's not much of a learning curve
- it has 80 contributors, so it is actively maintained
- it is supposed to be 8x faster than the jsdom package (well, that's what the cheerio folks say)
- most examples of web scrapers that I can find use cheerio, so it seems to be a developer favourite
*/
var cheerio = require("cheerio");
/* I chose json-2-csv as my csv package because:
- it seemed very easy to implement
- it automatically generates column headings based on JSON keys
- it seems to be updated on a regular basis
- it has had 10,000 downloads in the last month, so it seems to be one of the more popular csv conversion packages
*/
var converter = require("json-2-csv");

// Initialize variables
var url = "http://shirts4mike.com";
var newcsvname = "./data/" + scraperDate() + ".csv";
var newUrlArray = [];
var productPages = [];
var shirtsData = [];

// First scrape, which is scrape of home page
request(url, function(error, response, body) {
  if (error) {
    console.log("The site could not be scraped.");
    // BUT DON'T NEED DISPLAYERROR AS WELL?
    displayError(error);
  } else {
    var $ = cheerio.load(body);

    // Find any links that contain the substring "shirt"
    $("a[href*='shirt']").each(function() {
      // Get the href of those links, and add that to the home page url
      var link = $(this);
      var href = link.attr("href");
      var newUrl = url + "/" + href;

      // Eliminate duplicate links, then add urls to an array
      if (newUrlArray.indexOf(newUrl) === -1) {
        newUrlArray.push(newUrl);
      }
    });

// Second scrape, which targets any urls that aren't product pages
    for (var i = 0; i < newUrlArray.length; i++) {
      // If link is a product page, add it to the productPages array
      if (newUrlArray[i].indexOf("?id=") > 0) {
        productPages.push(newUrlArray[i]);
      } else {
      // If link is not a product page, scrape on that link
        request(newUrlArray[i], function(error, response, body) {
          if (error) {
            displayError(error);
          } else {
            var $ = cheerio.load(body);
            console.log("Today's scrape has started.");
            // Find any links that contan "shirt.php?id=", as those are product pages
            $("a[href*='shirt.php?id=']").each(function() {
              // Get the href of those links, and add that to the home page url
              var link = $(this);
              var href = link.attr("href");
              var newUrl = url + "/" + href;

              // Eliminate duplicate links, then add urls to an array
              if (productPages.indexOf(newUrl) === -1) {
                productPages.push(newUrl);
              }
            }); // ends each
            // Third and final scrape, which will target all product pages
            for (var j = 0; j < productPages.length; j++) {
              request(productPages[j], function(error, response, body) {
                if (error) {
                  displayError(error);
                } else {
                  var $ = cheerio.load(body);
                  var price = $(".shirt-details h1 .price").text();
                  var shirtUrl = response.request.uri.href;
                  var title = $(".shirt-details h1").text().slice(4);
                  var imageUrl = "http://www.shirts4mike.com/" + $(".shirt-picture img").attr("src");
                  var time = new Date().toLocaleString();

                  var shirtDetails = {
                    Title: title,
                    Price: price,
                    ImageUrl: imageUrl,
                    Url: shirtUrl,
                    Time: time
                  };
                  shirtsData.push(shirtDetails);

                  // When all links are scraped, write to file
                  if (shirtsData.length === productPages.length) {
                    // Create data folder if it doesn't exist
                    if (!fs.existsSync("./data")) {
                      fs.mkdirSync("./data");
                    }
                    // Use json-2-csv module to convert JSON
                    converter.json2csv(shirtsData, function(error, csv) {
                      if (error) {
                        displayError(error);
                      } else {
                        console.log("Writing to csv file.");
                        fs.writeFile(newcsvname, csv, function(error) {
                          if (error) {
                            displayError(error);
                          }
                        }); // ends writeFile
                      } // ends converter else
                    }); // ends converter
                  } // ends if shirtsData.length etc.
                } // ends third scrape else
              }); // ends third scrape request
            } // ends for
          } // ends second scrape else
        });  // ends second scrape request
      } // ends else
    } // ends for
  } // ends first scrape else
}); // ends first scrape request

/** Gets today's date and formats it for csv file name
* @return {string} date
*/
function scraperDate() {
  var d = new Date();
  var year = d.getFullYear();
  var month = (d.getMonth() + 1);
  var day = d.getDate();
  if (month.length < 2) {
    month = "0" + month;
  }
  if (day.length < 2) {
    day = "0" + day;
  }

  return [year, month, day].join('-');
} // ends scraperDate

/** Displays errors in console and logs them to scraper-error.log
* @param {object} error - any errors thrown by callbacks
*/
function displayError(error) {
  console.log(error.message);
  var errorTime = new Date().toLocaleString();
  var errorLog = error.message + " " + errorTime;

  // Writes to error log
  fs.appendFile('scraper-error.log', errorLog, function(error) {
    if (error) throw error;
  }); // ends appendFile
}
