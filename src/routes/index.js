var express = require('express');
var router = express.Router();
var config = require("../config");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'zbxPromExporter' , config:res.locals.config,zbxcon:res.locals.zbxcon});
});

module.exports = router;
