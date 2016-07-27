var express = require('express');
var bodyParser = require('body-parser');
var MC = require('../mongo.helpers');

var databaseUri = 'mongodb://localhost:27017/coverage'; //don't forget to change when copy-paste

var router = express.Router();

router.use(bodyParser.urlencoded({extended: false}));
router.use(bodyParser.json());

var i = 0;
var helperNames = Object.keys(MC);
var l = helperNames.length;

(function iter() {
  var funcName = helperNames[i];
  var func = MC[funcName];
  var route = "/" + funcName.toLowerCase();

  router.post(route, function(req, res) {

    var params = req.body || {};
    params.db = databaseUri;

    func(params).then(function(r) {
      res.json(r);
    }).catch(function(e) {
      res.json(e);
    });
  });

  i++;
  if (i < l) iter();
})();

module.exports = router;