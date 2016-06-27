var express = require('express');
var request = require('request');
var rp = require('request-promise');
var cheerio = require('cheerio');
var app = express();
var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : '127.0.0.1',
    user     : 'ross',
    password : 'ross11',
    database : 'arkdatasql',
    port: 3306
});

connection.connect();



app.get('/scrape', function (req, res) {

    //
    var options = {
        guid: req.query.id,
        url: "http://ecode360.com/",
        child_nodes: [],
        content: null,
        level: 0
    };

    // request_data_for_chapter_at_index(options);

    return;
});


/*

 var context = {
 guid:           id of the article
 url:            base url - ecode
 child_nodes:    child codes
 content:        content if leaf
 };

 */

function request_data_for_chapter_at_index(options) {

    var url = options.url + options.guid;
    rp(url).then(function (htmlString) {
        var $ = cheerio.load(htmlString);

        // bar title is generic, it can lead to a list or it can have content below it.
        // the way to differentiate is to check if the next node has content
        $('.barTitle').each(function (i, elem) {
            var current = $(this);
            var next = current.next("div.content");
            var title_number = current.find(".titleNumber").text();
            var title_title = current.find(".titleTitle").text();

            var space_string = "";
            for (var i = 0; i < options.level; i++) {
                space_string += "   ";
            }

            if (next.length > 0) {
                // leaf node
                // console.log("has content");
                var text = $(next.get(0)).html();

                // copy it in
                console.log(space_string + " " + title_number + " " + title_title);
                console.log(space_string + text);

            } else {
                // bar node
                // bar node can be a link to a leaf node on the same page
                // check to make sure the URL does not contain an pound sign
                var link = current.find('.titleLink').get(0);
                var href = $(link).attr("href");


                if (href.indexOf("#") > -1) {
                    // ignore

                } else {



                    // follow
                    // create context object
                    console.log(space_string + " " + title_number + " " + title_title);
                    var new_options = {
                        guid: href,
                        url: options.url,
                        child_nodes: [],
                        content: null,
                        level: options.level + 1
                    };

                    request_data_for_chapter_at_index(new_options);
                }
            }
        });
    });
}


exports = module.exports = app;