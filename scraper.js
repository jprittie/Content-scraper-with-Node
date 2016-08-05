// This is the callback hell version of this project
// But I plan to re-do it with promises

"use strict";


// Require modules
var cheerio = require("cheerio");
var Promise = require("promise");
//It was not happy when I promisified request!
var request = require("request");
//var request = Promise.promisify(require("request"));
//Promise.promisifyAll(request);
// var fs = Promise.promisifyAll(require("fs"));
var converter = require("json-2-csv");
var fs = require("fs");

// Initialize variables
var url = "http://shirts4mike.com"
var newUrlArray = [];
var productPages = [];
var shirtsData = [];



// If data folder doesn't exist, create it




// First scrape, which is scrape of home page
request(url, function(error, response, body) {

    var $ = cheerio.load(body);

        // Find any links that contain the substring "shirt"
        $("a[href*='shirt']").each(function(){
            // Get the href of those links, and add that to the home page url
            var link = $(this);
            var href = link.attr("href");
            var newUrl = url + "/" + href;
          //  console.log(href + "==>" + newUrl);

            // Eliminate duplicate links, then add urls to an array
            if (newUrlArray.indexOf(newUrl) == -1) {
                newUrlArray.push(newUrl);
            }
        });

    // console.log(newUrlArray);

    // return newUrlArray;



// This function will scrape again on any urls that aren't product pages
// First, it checks whether the links we already have are product pages
// If they are, it adds them to the productPages array
  for (var i=0; i<newUrlArray.length; i++) {

      if (newUrlArray[i].indexOf("?id=") > 0) {
        productPages.push(newUrlArray[i]);
      }
 // If the link is not a product page, it scrapes again
     else {

          request(newUrlArray[i], function(error, response, body) {
            var $ = cheerio.load(body);

            // Find any links that start with "shirt.php?id=", as those are product pages
            $("a[href*='shirt.php?id=']").each(function(){
              // Get the href of those links, and add that to the home page url
              var link = $(this);
              var href = link.attr("href");
              var newUrl = url + "/" + href;
          //    console.log(href + "==>" + newUrl);

              // Eliminate duplicate links, then add urls to an array
              if (productPages.indexOf(newUrl) == -1) {
                  productPages.push(newUrl);
              }

            }); // ends each
        //  console.log("This is the productPages array" + "\n" + productPages);
        //  return productPages;



           for (var j=0; j<productPages.length; j++) {

                //  console.log(productPages[j])

                    request(productPages[j], function(error, response, body) {
                      var $ = cheerio.load(body);
                      var price = $(".shirt-details h1 .price").text();
                      // var shirtUrl = window.location.href;
                      var shirtUrl = response.request.uri.href;
                      var title = $(".shirt-details h1").text().slice(4);
                  //    var title = $(".price").next().text();
                  //    var title = $(".shirt-picture img").attr("alt");

                      var imageUrl = "http://www.shirts4mike.com/" + $(".shirt-picture img").attr("src");

                      var shirtDetails = {
                          "price" : price,
                          "title" : title,

                          "url" : shirtUrl,
                          "imageUrl" : imageUrl
                      }
                      shirtsData.push(shirtDetails);
                    //  console.dir(shirtDetails);


                      if (shirtsData.length == productPages.length){
                        console.dir(shirtsData);

                        if (!fs.existsSync("./data")){
                          fs.mkdirSync("./data");
                        }

                        converter.json2csv(shirtsData, function(err, csv){
                          if (err) throw err;
                          console.log(csv);

                            fs.writeFile( "./data" + "/" + ".csv", csv, function(err) {
                              if (err) throw err;

                            }); // ends writeFile
                        }); // ends converter



                      }
                     
                    }); // ends third scrape request



              } // ends for


          });  // ends secondScrape request

      } // ends else

  } // ends for

}); // ends firsScrape request






function displayScrapeError(error){
  console.log("Welcome to displayScrapeError");
  // console.error(error.message);
}
