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
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

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

app.post('/find', function(req, res) {
  MH.find(req.body).then(function (r) {
    res.json(r);
  }).catch(function (e) {
    res.json(e);
  });
});

app.post('/count', function(req, res) {
  MH.count(req.body).then(function (r) {
    res.json(r);
  }).catch(function (e) {
    res.json(e);
  });
});

app.post('/updatebyid', function(req, res) {
  MH.updateById(req.body).then(function (r) {
    res.json(r);
  }).catch(function (e) {
    res.json(e);
  });
});


app.post('/removebyid', function(req, res) {
  MH.removeById(req.body).then(function (r) {
    res.json(r);
  }).catch(function (e) {
    res.json(e);
  });
});


app.post('/remove', function(req, res) {
  MH.remove(req.body).then(function (r) {
    res.json(r);
  }).catch(function (e) {
    res.json(e);
  });
});


app.post('/rename', function(req, res) {
  MH.rename(req.body).then(function (r) {
    res.json(r);
  }).catch(function (e) {
    res.json(e);
  });
});


app.post('/unsetfield', function(req, res) {
  MH.unsetField(req.body).then(function (r) {
    res.json(r);
  }).catch(function (e) {
    res.json(e);
  });
});


app.post('/insert', function(req, res) {
  MH.insert(req.body).then(function (r) {
    res.json(r);
  }).catch(function (e) {
    res.json(e);
  });
});

app.post('/listcollections', function(req, res) {
  MH.listcollections(req.body).then(function (r) {
    res.json(r);
  }).catch(function (e) {
    res.json(e);
  });
});

app.post('/stats', function(req, res) {
  MH.stats(req.body).then(function (r) {
    res.json(r);
  }).catch(function (e) {
    res.json(e);
  });
});

app.post('/listdatabases', function(req, res) {
  MH.listDatabases(req.body).then(function (r) {
    res.json(r);
  }).catch(function (e) {
    res.json(e);
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