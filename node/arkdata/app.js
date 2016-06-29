var express = require('express');
var request = require('request');
var rp = require('request-promise');
var cheerio = require('cheerio');
var app = express();
var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'ross',
    password : 'ross12',
    database : 'arkdatasql'
});

connection.connect();




var arkdata = {};
arkdata.Municipality = function($node){
    var buff = [];
    var around_para = $node.text().split("(");
    var name = around_para[0];
    var name_components = name.split(",");
    var name_clean = name_components[0].replace("**", "");
    buff.push(name_clean);
    if(name_components.length > 1) {
        var second_component_clean = name_components[1].replace("**", "");
        buff.push("," + second_component_clean);
        buff.push();
    }

    this.name = buff.join();
    buff = [];

    var url = $node.find("a").attr("href");
    this.url = url;
    this.county_id = null;
};

arkdata.Municipality.prototype.save = function(){
    if(!this.url){

        console.log("CAN'T SAVE WITHOUT URL");
        return;
    }

    var that = this;
    connection.query("SELECT * FROM municipalities WHERE url LIKE '" + this.url + "'", function(err, rows) {

        if(rows.length == 1) {

            console.log("MUNICIPALITY FOUND, UPDATING");


            var row = rows[0];
        } else if (rows.length == 0){
            console.log("MUNICIPALITY NOT FOUND, CREATING NEW");
            var query_str = "INSERT INTO municipalities (name, url, county_id) VALUES ('" + that.name + "','" + that.url + "'," + that.county_id + ")";
            console.log(query_str);
            connection.query(query_str, function(err, rows) {
                if(err){
                    console.log(err);
                }
            });



        } else {
            console.log("ERROR");
        }
    });
};


function make_municipality_row(obj){
    var buff = [];
    buff.push("<tr>");
    buff.push("<td>");
    buff.push(obj.name);
    buff.push("</td>");
    buff.push("<td>");
    buff.push(obj.url);
    buff.push("</td>");
    buff.push("</tr>");
    return buff.join("");
}

app.get('/scrapeNY', function (req, res) {

    rp("http://www.generalcode.com/ecode360/NY").then(function (htmlString) {
        var $ = cheerio.load(htmlString);


        var Nassau_nodes = [];
        var Suffolk_nodes = [];
        $('#content li').each(function (i, elem) {

            var link = $(this).find("a").get(0);
            var href = $(link).attr("href");

            var text  = $(this).text();
            text += "   " + href;

            if(text.indexOf("(Nassau") > -1){
                Nassau_nodes.push($(this));
            }

            if(text.indexOf("(Suffolk") > -1){
                Suffolk_nodes.push($(this));
            }
        });

        var buff = [];
        buff.push("<h2>Nassau (" + Nassau_nodes.length + ")</h2>");
        buff.push("<table>");
        for(var i = 0; i < Nassau_nodes.length; i++){
            var $curr = Nassau_nodes[i];
            var obj = new arkdata.Municipality($curr);
            obj.county_id = 1;
            obj.save();
            buff.push(make_municipality_row(obj));
        }
        buff.push("</table>");

        buff.push("<h2>Suffolk (" + Suffolk_nodes.length + ")</h2>");
        buff.push("<table>");
        for(var i = 0; i < Suffolk_nodes.length; i++){
            var $curr = Suffolk_nodes[i];
            var obj = new arkdata.Municipality($curr);
            obj.county_id = 2;
            obj.save();
            buff.push(make_municipality_row(obj));
        }
        buff.push("</table>");

        var str = buff.join("");

        res.send(str);
    });



});

app.get('/index', function (req, res) {
    query = connection.query("SELECT * FROM municipalities;");
    query.on('error', function(err) {
            console.log( err );

        }).on('result', function( data ) {
            res.send(data);
        });
});

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