var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var nodemailer = require('nodemailer');
var CronJob = require('cron').CronJob;
var fs = require('fs');
var app = express();


app.get('/scrape', function (req, res) {

    var $, scraped_data, url;
    url = "http://ecode360.com/" + req.query.id;


    request(url, function (error, response, html) {
        if (!error) {

            $ = cheerio.load(html);


            var text = [];
            text.push("<table>");

            $('.chapterTitle').each(function (i, elem) {

                var $this_node = $(this);
                var chapter_title = $this_node.find(".titleNumber").text();
                var title_title = $this_node.find(".titleTitle").text();
                var data_guid = $(this).attr("data-guid");


                text.push("<tr>");

                text.push("<td>");
                text.push(chapter_title);
                text.push("</td>");

                text.push("<td>");
                text.push(title_title);
                text.push("</td>");

                text.push("<td>");
                text.push("<a href='http://ecode360.com/" + data_guid + "'>" + data_guid + "</a>");
                text.push("</td>");

                text.push("</tr>");
            });
            text.push("</table>");
            var txtStr = text.join("");

            res.send(txtStr);
        }
    });
});

app.get('/scrapeChapter', function (req, res) {

    var $, scraped_data, url;
    url = "http://ecode360.com/" + req.query.id;


    request(url, function (error, response, html) {
        if (!error) {

            $ = cheerio.load(html);


            var text = [];
            text.push("<table>");

            $('.sectionTitle').each(function (i, elem) {

                var $this_node = $(this);
                var chapter_title = $this_node.find(".titleNumber").text();
                var title_title = $this_node.find(".titleTitle").text();
                var data_guid = $(this).attr("data-guid");


                text.push("<tr>");

                text.push("<td>");
                text.push(chapter_title);
                text.push("</td>");

                text.push("<td>");
                text.push(title_title);
                text.push("</td>");

                text.push("<td>");
                text.push("<a href='http://ecode360.com/" + data_guid + "'>" + data_guid + "</a>");
                text.push("</td>");

                text.push("</tr>");
            });
            text.push("</table>");
            var txtStr = text.join("");

            res.send(txtStr);
        }
    });
});

app.get('/scrapeArticle', function (req, res) {

    var $, scraped_data, url;
    url = "http://ecode360.com/" + req.query.id;


    request(url, function (error, response, html) {
        if (!error) {

            $ = cheerio.load(html);


            var text = [];
            text.push("<table>");

            $('.sectionTitle').each(function (i, elem) {

                var $this_node = $(this);
                var chapter_title = $this_node.find(".titleNumber").text();
                var title_title = $this_node.find(".titleTitle").text();

                var id = $(this).attr("id");
                var data_guid = $(this).attr("data-guid");
                if(id != data_guid){
                    console.log("skipping line " + id + " " + data_guid);
                    return;
                }

                var $content_node = $this_node.next(".section_content");
                var content_text = $content_node.html();


                text.push("<tr>");

                text.push("<td>");
                text.push(chapter_title);
                text.push("</td>");

                text.push("<td>");
                text.push(title_title);
                text.push("</td>");

                text.push("<td>");
                text.push("<a href='http://ecode360.com/" + data_guid + "'>" + data_guid + "</a>");
                text.push("</td>");

                text.push("</tr>");
                text.push("<tr>");

                text.push("<td colspan='3' style='background-color: #d9d9d9'>");
                text.push(content_text);
                text.push("</td>");

                text.push("</tr>");
            });
            text.push("</table>");
            var txtStr = text.join("");

            res.send(txtStr);
        }
    });
});

exports = module.exports = app;