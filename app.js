var express = require('express')
var path = require('path')
var logger = require('morgan')
var bodyParser = require('body-parser')
var mongoRoutes = require('./routes/mongo')

var app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(logger('dev'))

app.use(bodyParser.json({limit: '5mb'}))
app.use(bodyParser.urlencoded({ extended: false,  limit: '5mb'}))

app.use(express.static(path.join(__dirname, 'public')))
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')))

if (process.env.MTA_IPS) {
  app.use(function (req, res, next) {
    var ipArr = process.env.MTA_IPS.split(/, ?/)
    var ip = req.headers['x-real-ip'] || req.ips.pop() || req.ip

    if (ipArr.indexOf(ip) != -1) return next()
    else res.status(401).send('ip ' + ip + ' not in whitelist')
  })
}

app.use(function (req, res, next) {
  if (req.url.substr(-1) !== '/')
    res.redirect(301, req.url + '/')
  else
    next()
})

app.use('/mongo', mongoRoutes)

app.get('/', function (req, res) {
  res.render('index')
})

app.get('/:conn/', function (req, res) {
  res.render('index')
})

app.get('/:conn/:db/', function (req, res) {
  res.render('index')
})

app.get('/:conn/:db/create/', function (req, res) {
  res.render('create')
})

app.get('/:conn/:db/:collection/', function (req, res) {
  res.redirect(req.path + '/table')
})

app.get('/:conn/:db/:collection/table/', function (req, res) {
  res.render('table')
})

app.get('/:conn/:db/:collection/pivot/', function (req, res) {
  res.render('pivot')
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res) {
    res.status(err.status || 500)
    res.render('error', {
      message: err.message,
      error: err
    })
  })
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res) {
  res.status(err.status || 500)
  res.render('error', {
    message: err.message,
    error: {}
  })
})

module.exports = app
