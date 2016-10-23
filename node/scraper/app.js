var express = require('express');
var request = require('request');
var rp = require('request-promise');
var cheerio = require('cheerio');
var app = express();
var path = require('path');
app.use(express.static(path.join(__dirname, 'public')));


app.get('/scrape', function (req, res) {

    var id = req.query.id;
    var url = "http://ecode360.com/" + id;

    requestArticle(url, res);

});

function requestArticle(url, res){
    rp(url).then(function (htmlString) {


        var $ = cheerio.load(htmlString);


        var article = {};

        article.url = url;
        article.paras = [];


        // bar title is generic, it can lead to a list or it can have content below it.
        // the way to differentiate is to check if the next node has content
        $('.barTitle').each(function (i, elem) {
            var current = $(this);

            var next = current.next("div.content");
            var title_number = current.find(".titleNumber").text().trim();
            var title_title = current.find(".titleTitle").text().trim();

            if (next.length > 0) {
                // leaf node
                // console.log("has content");
                // var text = $(next.get(0)).html();

                // copy it in
                //console.log(space_string + " " + title_number + " " + title_title);
                //console.log(space_string + text);

                var para = {};
                article.paras.push(para);

                para.paragraph = title_number;
                para.title = title_title;
                para.content = [];


                extractContent(next, $, para.content);

            } else {
                // bar node
                // bar node can be a link to a leaf node on the same page
                // check to make sure the URL does not contain an pound sign
                var link = current.find('.titleLink').get(0);
                var href = $(link).attr("href");


                if (href.indexOf("#") > -1) {
                    // ignore
                    // link to another part of the page
                } else {
                    // link to another page
                }
            }
        });

        // var JSONString = JSON.stringify(article);
        res.send(article);

    }).catch(function (err) {

        res.send("ERROR " + err);

    });
}

function extractContent(next, $, content) {


    next.children().each(function (i, elem) {

        var current_div = $(this);
        var css_class = current_div.attr("class");

        var para = {};


        if (css_class.indexOf("para") > -1) {

            para.text = current_div.text();
            content.push(para);

        } else if (css_class.indexOf("level") > -1) {

            para.content = [];

            current_div.children().each(function (i, elem) {

                var current = $(this);
                var title_number = current.children(".litem_number").text();

                var sub_para = {};
                para.content.push(sub_para);

                sub_para.number = title_number;
                sub_para.content = [];

                var next = current.children("div.content");
                extractContent(next, $, sub_para.content);

            });

            content.push(para);

        } else if (css_class.indexOf("footnotes") > -1) {

            var footnote = current_div.text().trim();
            if(footnote.length > 0) {

                para.footnote = current_div.text();
                content.push(para);
            }
        }
    });
};


exports = module.exports = app;