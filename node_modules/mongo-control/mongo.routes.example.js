var express = require('express');
var bodyParser = require('body-parser');
var MH = require('../mongo.helpers');

var router = express.Router();

router.use(bodyParser.urlencoded({extended: false}));
router.use(bodyParser.json());

var i = 0;
var helperNames = Object.keys(MH);
var l = helperNames.length;

(function iter() {
  var funcName = helperNames[i];
  var func = MH[funcName];
  var route = "/" + funcName.toLowerCase();

  router.post(route, function(req, res) {

    func(req.body).then(function(r) {
      res.json(r);
    }).catch(function(e) {
      res.json(e);
    });
  });

  i++;
  if (i < l) iter();
})();

module.exports = router;