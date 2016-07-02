var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/bower_components', express.static(path.join(__dirname, 'bower_components')));

app.get('/', function(req, res) {
  res.render("index");
});

app.post('/find', function(req, res) {
  var databaseUri = req.body.db;
  var collection = req.body.collection;
  var query = req.body.query ? JSON.parse(req.body.query) : {};

  MongoClient.connect(databaseUri, function(e, db) {
    if (e) return res.json(e);

    db.collection(collection).find(query).toArray(function(e, docs) {
      if (e) return res.json(e);

      res.json(docs);
      db.close();
    });
  });
});

app.post('/update', function(req, res) {
  var databaseUri = req.body.db;
  var collection = req.body.collection;
  var query = req.body.query ? JSON.parse(req.body.query) : {};
  var update = req.body.update ? JSON.parse(req.body.update) : {};

  MongoClient.connect(databaseUri, function(e, db) {
    if (e) return res.json(e);

    db.collection(collection).updateOne(query, update, function(e, r) {
      if (e) return res.json(e);

      res.json(r);
      db.close();
    });
  });
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