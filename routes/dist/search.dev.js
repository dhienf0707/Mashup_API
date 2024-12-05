"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncIterator(iterable) { var method; if (typeof Symbol !== "undefined") { if (Symbol.asyncIterator) { method = iterable[Symbol.asyncIterator]; if (method != null) return method.call(iterable); } if (Symbol.iterator) { method = iterable[Symbol.iterator]; if (method != null) return method.call(iterable); } } throw new TypeError("Object is not async iterable"); }

var express = require('express');

var router = express.Router();

var eBayAPI = require('./eBayAPI');

var redis = require('redis');

var _require = require('@azure/storage-blob'),
    BlobServiceClient = _require.BlobServiceClient;

require('dotenv').config(); // create and connect redis client to local instance.


var redisHostName = process.env.REDISCACHEHOSTNAME;
var redisCacheKey = process.env.REDISCACHEKEY;
var client = redis.createClient(6380, redisHostName, {
  auth_pass: redisCacheKey,
  tls: {
    servername: redisHostName
  }
}); // Print redis errors to the console

client.on('error', function (err) {
  console.log("Error " + err);
}); // Set up azure blobs
// Azure connectstring

CONNECT_STR = process.env.CONNECT_STR;
console.log(CONNECT_STR); // Create the BlobServiceClient object which will be used to create a container client

var blobServiceClient = BlobServiceClient.fromConnectionString(CONNECT_STR); // Create a unique name for the container

var containerName = 'ebayitemscontainer';
console.log('\nCreating container...');
console.log('\t', containerName); // Get a reference to a container

var containerClient = blobServiceClient.getContainerClient(containerName); // Create the container

containerClient.create().then(function (result) {
  return console.log("Container \"".concat(containerName, "\" successfully created at ").concat(result.date));
})["catch"](function (err) {
  return console.log(err.details);
});
router.get('/full', function (req, res) {
  var query = req.query;
  var url = createUrl(query);
  console.log(url);
  console.log(query.GPS);
  if (query.GPS === '') query.GPS = false;
  eBayAPI.getItems(url, query.country).then(function (items) {
    res.render('search', {
      items: items,
      GPS: query.GPS
    }); // res.send(items);
  })["catch"](function (err) {
    return console.log(err);
  });
});
router.post('/location', function (req, res) {
  var itemId = req.body.itemId;
  var url = "https://api.ebay.com/buy/browse/v1/item/".concat(itemId);
  key = "eBay - ".concat(itemId);
  var blockBlobClient = containerClient.getBlockBlobClient(key); // get block blob client

  client.get(key, function _callee(err, result) {
    return regeneratorRuntime.async(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (result) {
              resultJSON = JSON.parse(result);
              res.status(200).json(resultJSON);
            } else {
              // key not exist in redis
              blockBlobClient.download() // try to fetch from Azure blob
              .then(function (AzureResponse) {
                return streamToString(AzureResponse.readableStreamBody);
              }).then(function (data) {
                return res.send(JSON.parse(data));
              })["catch"](function (err) {
                // if blob not exist serve from eBay API and store in both redis cache and azure blob
                if (err.details.errorCode === 'BlobNotFound') {
                  eBayAPI.getItem(url).then(function (location) {
                    // save response in Redis store
                    client.setex(key, 3600, JSON.stringify(_objectSpread({
                      source: 'Redis Cache'
                    }, location))); // save response in Azure blob

                    var blobData = JSON.stringify(_objectSpread({
                      source: 'Azure blob'
                    }, location));
                    blockBlobClient.upload(blobData, blobData.length); // send JSON response back to client

                    res.status(200).json(_objectSpread({
                      source: 'eBay API'
                    }, location));
                  })["catch"](function (err) {
                    return res.send(err.message);
                  });
                } else {
                  res.send(err.details.errorCode);
                }
              });
            }

          case 1:
          case "end":
            return _context.stop();
        }
      }
    });
  });
});
router.post('/submit', function (req, res) {
  var query = req.body;
  var url = createUrl(query); // build eBay url and remove any whitespace in query

  key = "eBay - ".concat(query.query, " - ").concat(query.limit, " - ").concat(query.minPrice, " - ").concat(query.maxPrice, " - ").concat(query.category_id, " - ").concat(query.GPS);
  var blockBlobClient = containerClient.getBlockBlobClient(key); // get block blob client

  console.log(key);
  console.log(url); // try fetching results from Redis first

  client.get(key, function _callee2(err, result) {
    return regeneratorRuntime.async(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            if (result) {
              resultJSON = JSON.parse(result);
              res.status(200).json(resultJSON);
            } else {
              // key not exist in redis
              // try { // try to fetch from Azure blob
              //     // Download the blob
              //     const downloadBlockBlobResponse = await blockBlobClient.download();
              //     // Convert the response body into a string (or Buffer)
              //     const downloaded = await streamToBuffer(downloadBlockBlobResponse.readableStreamBody);
              //     // convert the downloaded buffer to string
              //     const data = downloaded.toString()
              //     // send the response back in json format
              //     res.send(JSON.parse(data))
              // } catch (err) {
              //     console.log("ERRRORRRRRRR")
              //     console.log(err)
              //     // if blob not exist serve from eBay API and store in both redis cache and azure blob
              //     if (err.details.errorCode === 'BlobNotFound') {
              //         eBayAPI.getItems(url, query.country)
              //             .then(items => {
              //                 // save response in Redis store
              //                 client.setex(key, 3600, JSON.stringify({ source: 'Redis Cache', ...items }));
              //                 // save response in Azure blob
              //                 const blobData = JSON.stringify({ source: 'Azure blob', ...items });
              //                 blockBlobClient.upload(blobData, blobData.length);
              //                 // send JSON response back to client
              //                 res.status(200).json({ source: 'eBay API', ...items, });
              //             })
              //             .catch(err => res.send(err.message))
              //     }
              //     else {
              //         res.send(err.details.errorCode);
              //     }
              // }
              blockBlobClient.download() // try to fetch from Azure blob
              .then(function (AzureResponse) {
                return streamToString(AzureResponse.readableStreamBody);
              }).then(function (data) {
                return res.send(JSON.parse(data));
              })["catch"](function (err) {
                // if blob not exist serve from eBay API and store in both redis cache and azure blob
                if (err.details.errorCode === 'BlobNotFound') {
                  eBayAPI.getItems(url, query.country).then(function (items) {
                    // save response in Redis store
                    client.setex(key, 3600, JSON.stringify(_objectSpread({
                      source: 'Redis Cache'
                    }, items))); // save response in Azure blob

                    var blobData = JSON.stringify(_objectSpread({
                      source: 'Azure blob'
                    }, items));
                    blockBlobClient.upload(blobData, blobData.length); // send JSON response back to client

                    res.status(200).json(_objectSpread({
                      source: 'eBay API'
                    }, items));
                  })["catch"](function (err) {
                    return res.send(err.message);
                  });
                } else {
                  res.send(err.details.errorCode);
                }
              });
            }

          case 1:
          case "end":
            return _context2.stop();
        }
      }
    });
  });
});

function streamToString(readableStream) {
  return new Promise(function (resolve, reject) {
    var chunks = [];
    readableStream.on("data", function (data) {
      chunks.push(data.toString());
    });
    readableStream.on("end", function () {
      resolve(chunks.join(""));
    });
    readableStream.on("error", reject);
  });
} // Helper function to convert stream to buffer


function streamToBuffer(readableStream) {
  var chunks, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _value, chunk;

  return regeneratorRuntime.async(function streamToBuffer$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          chunks = [];
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _context3.prev = 3;
          _iterator = _asyncIterator(readableStream);

        case 5:
          _context3.next = 7;
          return regeneratorRuntime.awrap(_iterator.next());

        case 7:
          _step = _context3.sent;
          _iteratorNormalCompletion = _step.done;
          _context3.next = 11;
          return regeneratorRuntime.awrap(_step.value);

        case 11:
          _value = _context3.sent;

          if (_iteratorNormalCompletion) {
            _context3.next = 18;
            break;
          }

          chunk = _value;
          chunks.push(chunk);

        case 15:
          _iteratorNormalCompletion = true;
          _context3.next = 5;
          break;

        case 18:
          _context3.next = 24;
          break;

        case 20:
          _context3.prev = 20;
          _context3.t0 = _context3["catch"](3);
          _didIteratorError = true;
          _iteratorError = _context3.t0;

        case 24:
          _context3.prev = 24;
          _context3.prev = 25;

          if (!(!_iteratorNormalCompletion && _iterator["return"] != null)) {
            _context3.next = 29;
            break;
          }

          _context3.next = 29;
          return regeneratorRuntime.awrap(_iterator["return"]());

        case 29:
          _context3.prev = 29;

          if (!_didIteratorError) {
            _context3.next = 32;
            break;
          }

          throw _iteratorError;

        case 32:
          return _context3.finish(29);

        case 33:
          return _context3.finish(24);

        case 34:
          return _context3.abrupt("return", Buffer.concat(chunks));

        case 35:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[3, 20, 24, 34], [25,, 29, 33]]);
}

function createUrl(query) {
  ['query', 'limit', 'minPrice', 'maxPrice', 'category_id', 'GPS'].forEach(function (element) {
    if (query[element] === undefined) query[element] = '';
    query[element] = query[element].trim();
  });
  return "https://api.ebay.com/buy/browse/v1/item_summary/search?q=".concat(query.query, "&limit=").concat(query.limit, "&filter=price:[").concat(query.minPrice, "..").concat(query.maxPrice, "],priceCurrency:AUD&category_ids=").concat(query.category_id);
}

module.exports = router;