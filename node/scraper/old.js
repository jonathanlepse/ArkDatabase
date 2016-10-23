/**
 * Created by emilchoski on 10/13/16.
 */
var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'ross',
    password: 'ross12',
    database: 'arkdatasql'
});

connection.connect();


var arkdata = {};


function mysql_real_escape_string(str) {
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\" + char; // prepends a backslash to backslash, percent,
                                    // and double/single quotes
        }
    });
}

/************************************************************************/
/*                        MUNICIPALITY TABLE                            */
/************************************************************************/

arkdata.Municipality = function ($node) {
    var buff = [];
    var around_para = $node.text().split("(");
    var name = around_para[0];
    var name_components = name.split(",");
    var name_clean = name_components[0].replace(/\*/g, "");
    name_clean = name_clean.replace(/(\r\n|\n|\r)/gm, "");
    buff.push(name_clean);
    if (name_components.length > 1) {
        var second_component_clean = name_components[1].replace(/\*/g, "");
        second_component_clean = second_component_clean.replace(/(\r\n|\n|\r)/gm, "");
        buff.push(second_component_clean);
        buff.push();
    }

    this.name = buff.join();
    buff = [];

    var url = $node.find("a").attr("href");
    this.url = url;
    this.id = null;
    this.county_id = null;
    this.updated_on = null;
    this.sections_count = 0;
    this.sections_with_text_count = 0;
};

arkdata.Municipality.prototype.guid = function () {
    var comps = this.url.split("/");
    return comps[comps.length - 1];
};

arkdata.Municipality.prototype.save = function () {
    if (!this.url) {

        console.log("CAN'T SAVE WITHOUT URL");
        return;
    }

    var that = this;
    connection.query("SELECT * FROM municipalities WHERE url LIKE '" + this.url + "'", function (err, rows) {

        if (rows.length == 1) {
            var row = rows[0];
            console.log("MUNICIPALITY FOUND, UPDATING");
            //console.log(row);
            //console.log(that.name + ", " + that.url + ", " + that.county_id);
            connection.query("UPDATE municipalities SET name = '" + that.name + "', url = '" + that.url +
                "', county_id = '" + that.county_id + "' WHERE id = " + row.id, function (err, rows) {
                // console.log(rows);
                that.id = row.id;



                var query = "SELECT municipality_id, COUNT(*) FROM sections WHERE municipality_id = " + that.id;
                //console.log(query);
                connection.query(query, function (err, rows) {
                    that.sections_count = rows[0]["COUNT(*)"];
                    //console.log(that.sections_count);
                });

                var query_2 = "SELECT municipality_id, COUNT(*) FROM sections WHERE municipality_id = " + that.id + " AND (body IS NOT NULL) AND (CHAR_LENGTH(body) > 0)";
                //console.log(query);
                connection.query(query_2, function (err, rows) {
                    that.sections_with_text_count = rows[0]["COUNT(*)"];
                    //console.log(that.sections_with_text_count);
                });


                if (err) {
                    console.log(err);
                } else {
                    console.log("ID " + that.id);
                }
            });


        } else if (rows.length == 0) {
            console.log("MUNICIPALITY NOT FOUND, CREATING NEW");
            var query_str = "INSERT INTO municipalities (name, url, county_id) VALUES ('" + that.name + "','" + that.url + "'," + that.county_id + ")";
            // console.log(query_str);
            connection.query(query_str, function (err, rows) {
                // console.log(rows.insertId);
                that.id = rows.insertId;

                if (err) {
                    console.log(err);
                } else {
                    console.log("NEW ID " + that.id);
                }
            });


        } else {
            console.log("ERROR");
        }
    });
};

function make_municipality_row(obj) {
    var buff = [];
    buff.push("<tr>");
    buff.push("<td>");
    buff.push(obj.name);
    buff.push("</td>");
    buff.push("<td>");
    buff.push(obj.id);
    buff.push("</td>");
    buff.push("<td>");
    buff.push("<a href='" + obj.url + "' target='_blank'>" + obj.url + "</a>");
    buff.push("</td>");
    buff.push("<td style='width: 100px; text-align: center;'>");
    // console.log();
    buff.push("<a href=\"scrape?id=" + obj.guid() + "&db_id=" + obj.id + "\">Update</a>");
    buff.push("</td>");
    buff.push("<td>");
    buff.push("</td>");
    buff.push("<td>");
    buff.push(obj.sections_count);
    buff.push("</td>");
    buff.push("<td>");
    buff.push(obj.sections_with_text_count);
    buff.push("</td>");
    buff.push("</tr>");
    return buff.join("");
}


/************************************************************************/
/*                           SECTION TABLE                              */
/************************************************************************/

arkdata.Section = function (para, title, text, url, parent, municipality_id) {
    this.para = para;
    this.title = title;
    this.text = text;
    this.url = url;
    this.parent = parent;
    this.municipality_id = municipality_id;
    this.chidren = [];
    this.saved = false;

    // console.log("INSTATIATING: " + this.full_section_number());
};

arkdata.Section.prototype.full_section_number = function () {
    var p = this;
    var buff = [];
    buff.push(p.para);
    while (p.parent) {
        p = p.parent;
        buff.push(p.para);
    }
    buff.reverse();
    var str = buff.join("--");
    return str;
};

arkdata.Section.prototype.save = function () {


    var queryString = "" +
        "SELECT * FROM sections " +
        "WHERE (((url LIKE '" + this.url + "') OR ((para LIKE '" + this.full_section_number() + "') AND (LENGTH(para)" +
        " >" +
        " 0))) AND municipality_id = " + this.municipality_id + ")";

    var that = this;
    connection.query(queryString, function (err, rows) {
        if (err) {
            throw err;
        } else if (rows.length == 0) {
            console.log("0 Section Found - CREATE");

            var query_str;
            if (that.url) {
                query_str = "INSERT INTO sections (municipality_id, para, title, url) VALUES ('" +
                    that.municipality_id + "','" +
                    that.full_section_number() + "','" +
                    mysql_real_escape_string(that.title) + "','" +
                    that.url + "')";
            } else if (that.text) {
                query_str = "INSERT INTO sections (municipality_id, para, title, body) VALUES ('" +
                    that.municipality_id + "','" +
                    that.full_section_number() + "','" +
                    mysql_real_escape_string(that.title) + "','" +
                    mysql_real_escape_string(that.text) + "')";
            } else {
                console.log("ERROR");
            }

            // console.log(query_str);
            connection.query(query_str, function (err, rows) {
                if (err) {
                    console.log(err);


                }

                request_count_saved++;
                log_counts();
            });


        } else if (rows.length == 1) {
            // console.log("1 Section Found - UPDATE");
            var row = rows[0];
            var query_str;

            if (that.url) {
                query_str = "UPDATE sections " +
                    "SET para = '" + that.full_section_number() + "'," +
                    "para = '" + that.full_section_number() + "'," +
                    "title = '" + mysql_real_escape_string(that.title) + "'," +
                    "url = '" + that.url + "' " +
                    "WHERE id = " + row.id;
            } else {
                query_str = "UPDATE sections " +
                    "SET para = '" + that.full_section_number() + "'," +
                    "para = '" + that.full_section_number() + "'," +
                    "title = '" + mysql_real_escape_string(that.title) + "'," +
                    "body = '" + mysql_real_escape_string(that.text) + "' " +
                    "WHERE id = " + row.id;
            }

            // console.log(query_str);
            connection.query(query_str, function (err, rows) {
                if (err) {
                    console.log(err);


                }

                request_count_saved++;
                log_counts();
            });

        } else {
            console.log("------------------ TOO MANY SECTIONS FOUND-----------------------");
            console.log("------------------ TOO MANY SECTIONS FOUND-----------------------");
            console.log("------------------ TOO MANY SECTIONS FOUND-----------------------");
        }


    });


};

/************************************************************************/
/*                          SCRAPING FUNCTIONS                          */
/************************************************************************/

var Nassau_nodes = [];
var Suffolk_nodes = [];
var Nassau_objects = [];
var Suffolk_objects = [];

app.get('/scrapeNY', function (req, res) {
    Nassau_nodes = [];
    Suffolk_nodes = [];
    Nassau_objects = [];
    Suffolk_objects = [];


    rp("http://www.generalcode.com/ecode360/NY").then(function (htmlString) {
        var $ = cheerio.load(htmlString);

        $('#content li').each(function (i, elem) {

            var link = $(this).find("a").get(0);
            var href = $(link).attr("href");

            var text = $(this).text();
            text += "   " + href;

            if (text.indexOf("(Nassau") > -1) {
                Nassau_nodes.push($(this));
            }

            if (text.indexOf("(Suffolk") > -1) {
                Suffolk_nodes.push($(this));
            }
        });

        for (var i = 0; i < Nassau_nodes.length; i++) {
            var $curr = Nassau_nodes[i];
            var obj = new arkdata.Municipality($curr);
            obj.county_id = 1;
            obj.save();
            Nassau_objects.push(obj);
        }

        for (var i = 0; i < Suffolk_nodes.length; i++) {
            var $curr = Suffolk_nodes[i];
            var obj = new arkdata.Municipality($curr);
            obj.county_id = 2;
            obj.save();
            Suffolk_objects.push(obj);
        }

        setTimeout(render, 500);
    });

    function render() {
        var buff = [];

        buff.push("<!DOCTYPE html>");
        buff.push("<html>");
        buff.push("<head>");
        buff.push("<link rel=\"stylesheet\" href=\"/stylesheets/style.css\">");
        buff.push("<head>");
        buff.push("<link href='https://fonts.googleapis.com/css?family=Roboto:400,300,100,500,700' rel='stylesheet'" +
            " type='text/css'>");
        buff.push("</head>");
        buff.push("<body>");
        buff.push("<h1>Ark data</h1>");
        buff.push("<h2>Nassau (" + Nassau_objects.length + ")</h2>");
        buff.push("<table class='datatable'>");

        buff.push(generate_table_header());

        for (var i = 0; i < Nassau_objects.length; i++) {
            var obj = Nassau_objects[i];
            buff.push(make_municipality_row(obj));
        }
        buff.push("</table>");

        buff.push("<h2>Suffolk (" + Suffolk_objects.length + ")</h2>");
        buff.push("<table class='datatable'>");

        buff.push(generate_table_header());

        for (var i = 0; i < Suffolk_objects.length; i++) {
            var obj = Suffolk_objects[i];
            buff.push(make_municipality_row(obj));
        }

        buff.push("</table>");
        buff.push("</body>");
        buff.push("</html>");

        var str = buff.join("");

        res.send(str);
    }
});

function generate_table_header(){
    var buff = [];

    buff.push("<tr>");

    buff.push("<th>");
    buff.push("Municipality Name");
    buff.push("</th>");

    buff.push("<th>");
    buff.push("Row ID");
    buff.push("</th>");

    buff.push("<th>");
    buff.push("source webpage url");
    buff.push("</th>");

    buff.push("<th>");
    buff.push("Begin Update");
    buff.push("</th>");

    buff.push("<th>");
    buff.push("Update Date");
    buff.push("</th>");

    buff.push("<th>");
    buff.push("All sections");
    buff.push("</th>");

    buff.push("<th>");
    buff.push("Content sections");
    buff.push("</th>");

    buff.push("</tr>");

    var str = buff.join("");

    return str;
}

app.get('/index', function (req, res) {
    query = connection.query("SELECT * FROM municipalities;");
    query.on('error', function (err) {
        console.log(err);

    }).on('result', function (data) {
        res.send(data);
    });
});

var scrape_pending = false;

app.get('/scrape', function (req, res) {
    if (scrape_pending) {
        //console.log("CAN'T SCRAPE, ALREADY IN PROGRESS");
        //return;
    }

    scrape_pending = true;

    console.log("---------------------------------------------------------------");
    console.log("---------------------------------------------------------------");
    console.log("---------------------------------------------------------------");
    console.log("Scraping Data for Muni: " + req.query.id + " " + req.query.db_id);

    // return;
    //
    var options = {
        guid: req.query.id,
        db_id: req.query.db_id,
        url: "http://ecode360.com/",
        child_nodes: [],
        content: null,
        level: 0,
        parent: null
    };

    request_data_for_chapter_at_index(options);

    res.send("Scraping Data for Muni: " + req.query.id + " " + req.query.db_id);
});





/*

 var context = {
 guid:           id of the article
 url:            base url - ecode
 child_nodes:    child codes
 content:        content if leaf
 };

 */


var request_count = 0;
var request_count_finished = 0;
var request_count_created = 0;
var request_count_saved = 0;
var request_errors = 0;

function log_counts() {



    if(request_count_saved == request_count_created){
        console.log("DOWNLOAD COMPLETE, ERRORS: " + request_errors);
    }


    /*
     console.log(
     "request_count   " + request_count +
     "  request_count_finished  " + request_count_finished +
     "  request_count_created " + request_count_created +
     "  request_count_saved " + request_count_saved);
     */
}

function request_data_for_chapter_at_index(options) {

    var url = options.url + options.guid;

    request_count++;

    rp(url).then(function (htmlString) {
        request_count_finished++;
        log_counts();

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
                var text = $(next.get(0)).text();

                // copy it in
                //console.log(space_string + " " + title_number + " " + title_title);
                //console.log(space_string + text);

                // function(para, title, text, parent){
                var opt = new arkdata.Section(
                    title_number,
                    title_title,
                    text,
                    null,
                    options.parent,
                    options.db_id);
                request_count_created++;

                options.child_nodes.push(opt);
                opt.save();


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
                    // console.log(space_string + " " + title_number + " " + title_title);
                    // function(para, title, text, parent){
                    var opt = new arkdata.Section(
                        title_number,
                        title_title,
                        null,
                        href,
                        options.parent,
                        options.db_id);
                    request_count_created++;

                    options.child_nodes.push(opt);
                    opt.save();

                    var new_options = {
                        guid: href,
                        db_id: options.db_id,
                        url: options.url,
                        child_nodes: [],
                        content: null,
                        level: options.level + 1,
                        parent: opt

                    };

                    request_data_for_chapter_at_index(new_options);
                }
            }
        });
    }).catch(function (err) {
        request_count_finished++;
        request_errors++;
        log_counts();

        console.log("ERROR!!!!  " + url);
    });
}