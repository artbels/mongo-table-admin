var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var mongoRoutes = require('./routes/mongo');
var auth = require('basic-auth');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));


if (process.env.MTA_IPS) {
  app.use(function(req, res, next) {
    var ipArr = process.env.MTA_IPS.split(/, ?/);
    var ip = req.headers["x-real-ip"] || req.ips.pop() || req.ip;

    if (ipArr.indexOf(ip) != -1) return next();
    else res.status(401).send("ip " + ip + ' not in whitelist');
  });
}

app.use('/mongo', mongoRoutes);

app.get('/', function(req, res) {
  res.render("pages/index");
});

app.get('/create', function(req, res) {
  res.render("pages/create");
});

app.get('/:db/:collection/table', function(req, res) {
  res.render("pages/table");
});

app.get('/:db/:collection/pivot', function(req, res) {
  res.render("pages/pivot");
});


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