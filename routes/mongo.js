var express = require('express')
var bodyParser = require('body-parser')
var MC = require('mongo-control')

var router = express.Router()

router.use(bodyParser.urlencoded({extended: false}))
router.use(bodyParser.json())

// define the home page route
router.get('/', function (req, res) {
  res.send('mongo root page')
})

var i = 0
var helperNames = Object.keys(MC)
var l = helperNames.length

;(function iter () {
  var funcName = helperNames[i]
  var func = MC[funcName]
  var route = '/' + funcName.toLowerCase()

  router.post(route, function (req, res) {
    func(req.body).then(function (r) {
      res.json(r)
    }).catch(function (e) {
      res.json(e)
    })
  })

  i++
  if (i < l) iter()
})()

module.exports = router
