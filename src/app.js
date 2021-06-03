var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var configRouter = require('./routes/config');
var apiRouter = require('./routes/api');


var config = require("./config");
config.version="0.2"

const zbxapi = require('./lib/zbxApi');
const zabbixpromExporter = require('./lib/zbxPromExporter');
var zbxcli = new zbxapi(config.zbx.url,config.zbx.user,config.zbx.password)
zbxcli.connect( function(response){
  console.log(response)
})


var applis = {  "status":1,"RootPath":__dirname}

const gethosts = (param) => { 
  return new Promise((resolve, reject) => {
    zbxcli.hosts(param,(data) => {
        resolve(data.result)
      })
  })
}

const getitems = (param) => { 
  return new Promise((resolve, reject) => {
    zbxcli.items(param,(data) => {
        resolve(data.result) 
      })
  })
}

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set("zbxcon",zbxcli);
app.set("config",config);
app.set("applis",applis);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Ajout des acces aux librairie additionnel npm
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist'));
app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist'))


app.use(function(req, res, next) {
  res.locals.zbxcon = app.get('zbxcon');
  res.locals.applis = app.get('applis')
  res.locals.config = app.get('config')
  
  next();
});
app.get('/reconnect', function(req, res) {
  zbxcli = new zbxapi(config.zbx.url,config.zbx.user,config.zbx.password)
  zbxcli.connect( function(response){
    console.log(response)
    app.set("zbxcon",zbxcli);
    res.locals.zbxcon = app.get('zbxcon');
    res.locals.applis = app.get('applis')
    res.locals.config = app.get('config')
    res.redirect('/')
  })
})

app.use('/', indexRouter);
app.use('/config', configRouter);
app.use('/api', apiRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
