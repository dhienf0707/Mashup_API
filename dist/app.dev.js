"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var morngan = require('morgan');

var helmet = require('helmet');

var reload = require('reload');

var express = require('express');

var http = require('http');

var https = require('https');

var fs = require('fs');

var indexRouter = require('./routes/index');

var search = require('./routes/search');

var categories = require('./routes/categories');

var responseTime = require('response-time');

var axios = require('axios');

require('dotenv').config(); // HTTPS server


var privateKey = fs.readFileSync('./sslcert/domain-key.txt', 'utf8');
var certificate = fs.readFileSync('./sslcert/domain-crt.txt', 'utf8');
var credentials = {
  key: privateKey,
  cert: certificate
}; // app settings

var app = express();
app.set('view engine', 'pug');
app.set('views', './views');
app.use(responseTime());
app.use(helmet());
app.use(morngan('tiny'));
app.use(express.json()); // parse json req

app.use(express.urlencoded({
  extended: true
})); // url endcode key:value

app.use(express["static"](__dirname + '/public')); // static files
// return google map api response to frontend

app.get('/maps/api', function _callee(req, res) {
  var query, apiKey, response;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          query = req.query; // Pass any query parameters

          apiKey = process.env.GOOGLE_MAPS_API_KEY; // Load the API key from an environment variable

          _context.prev = 2;
          _context.next = 5;
          return regeneratorRuntime.awrap(axios.get('https://maps.googleapis.com/maps/api/js', {
            params: _objectSpread({}, query, {
              key: apiKey
            }),
            responseType: 'text' // Ensure it's treated as plain text

          }));

        case 5:
          response = _context.sent;
          // Set correct headers for JavaScript
          res.set('Content-Type', 'application/javascript');
          res.send(response.data);
          _context.next = 14;
          break;

        case 10:
          _context.prev = 10;
          _context.t0 = _context["catch"](2);
          console.error(_context.t0);
          res.status(500).send('Failed to fetch Google Maps API');

        case 14:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[2, 10]]);
});
app.use('/', indexRouter);
app.use('/search', search);
app.use('/categories', categories); // PORT

var httpPort = 3000;
var httpsPort = 3443; // create sever

var httpServer = http.createServer(app);
httpServer.listen(httpPort);
var httpsServer = https.createServer(credentials, app);
httpsServer.listen(httpsPort);
reload(app);