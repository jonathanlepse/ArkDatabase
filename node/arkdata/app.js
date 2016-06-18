var express    = require('express');
var request    = require('request');
var cheerio    = require('cheerio');
var nodemailer = require('nodemailer');
var CronJob    = require('cron').CronJob;
var fs         = require('fs');
var app        = express();

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
  service: 'YOUR_SERVICE',
  auth: {
    user: 'YOUR_EMAIL_ACCOUNT',
    pass: 'YOUR_PASSWORD'
  }
});

app.get('/scrape', function(req, res){

  var $, scraped_data, url;
  url = "http://ecode360.com/10414303";

  request(url, function(error, response, html) {

    if(!error) {

      $ = cheerio.load(html);




      $('#toc .titleTitle').each(function(i, elem) {
        console.log($(this).text());
      });



      console.log(scraped_data);

      return;

      // Send an email
      var mailOptions = {
        from: 'YOUR_SENDER',
        to: 'YOUR_RECIPIENT',
        subject: 'YOUR_SUBJECT',
        text: 'YOUR_MESSAGE' + scraped_data
      };

      // send mail with defined transport object
      transporter.sendMail(mailOptions, function(error, info){
        if(error) {
          return console.log(error);
        }
        console.log('Message sent: ' + info.response);
      });
    }
  });
});

/*

// How frequently should the job run
new CronJob('0 0 * * *', function(){
  request.get('YOUR_HOST/scrape')
}, null, true, "America/Los_Angeles");

app.listen('8081')
console.log('Listening on port 8081');

*/

exports = module.exports = app;









return;
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
