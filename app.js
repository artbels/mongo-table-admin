var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var MH = require('./mongo.helpers');


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

app.get('/create/', function(req, res) {
  res.render("create");
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

app.post('/listcollections', function(req, res) {
  MH.listcollections(req.body).then(function (r) {
    res.json(r);
  }).catch(function (e) {
    res.json(e);
  });
});

app.post('/update', function(req, res) {
  var databaseUri = req.body.db;
  var collection = req.body.collection;
  var query = req.body.query ? JSON.parse(req.body.query) : {};
  var update = req.body.update ? JSON.parse(req.body.update) : {};
console.log(query);
console.log(update);
  MongoClient.connect(databaseUri, function(e, db) {
    if (e) return res.json(e);

    db.collection(collection).updateOne(query, update, function(e, r) {
      if (e) return res.json(e);

      res.json(r);
      db.close();
    });
  });
});


app.post('/updatebyid', function(req, res) {
  var databaseUri = req.body.db;
  var collection = req.body.collection;
  var objId = new ObjectID(req.body.id);
  var update = req.body.update ? JSON.parse(req.body.update) : {};

  MongoClient.connect(databaseUri, function(e, db) {
    if (e) return res.json(e);

    db.collection(collection).updateOne({_id: objId}, update, function(e, r) {
      if (e) return res.json(e);

      res.json(r);
      db.close();
    });
  });
});


app.post('/insert', function(req, res) {
  var databaseUri = req.body.db;
  var collection = req.body.collection;
  if (!req.body.data) return res.json("no data");

  try {
    var dataArr = JSON.parse(req.body.data);

    MongoClient.connect(databaseUri, function(e, db) {
      if (e) return res.json(e);

      db.collection(collection).insert(dataArr, function(e, r) {
        if (e) return res.json(e);

        res.json(r);
        db.close();
      });
    });

  } catch (e) {
    res.json(e);
  }
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