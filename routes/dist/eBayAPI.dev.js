"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var axios = require('axios');

var _require = require('express/lib/response'),
    get = _require.get;

var qs = require('querystring');

require('dotenv').config();

var eBayAPI = function () {
  // eBay request new access token (each token only have 2 hours expire period)
  var clientId = process.env.CLIENTID;
  var clientSecret = process.env.CLIENTSECRET;
  var base64Credentials = Buffer.from("".concat(clientId, ":").concat(clientSecret)).toString('base64');

  function getToken() {
    var eBayTokenAPI = {
      url: 'https://api.ebay.com/identity/v1/oauth2/token',
      requestHeaders: {
        Content_Type: 'application/x-www-form-urlencoded',
        Authorization: "Basic ".concat(base64Credentials)
      },
      requestBody: {
        grant_type: 'refresh_token',
        refresh_token: process.env.REFRESH_TOKEN,
        scope: 'https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.marketing.readonly https://api.ebay.com/oauth/api_scope/sell.marketing https://api.ebay.com/oauth/api_scope/sell.inventory.readonly https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.account.readonly https://api.ebay.com/oauth/api_scope/sell.account https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly https://api.ebay.com/oauth/api_scope/sell.fulfillment https://api.ebay.com/oauth/api_scope/sell.analytics.readonly https://api.ebay.com/oauth/api_scope/sell.finances'
      }
    };
    return axios.post(eBayTokenAPI.url, qs.stringify(eBayTokenAPI.requestBody), {
      headers: eBayTokenAPI.requestHeaders
    }).then(function (tokenRes) {
      return tokenRes;
    });
  }

  function getItems(url) {
    var country = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'AU';
    return getToken().then(function (tokenRes) {
      var eBayGetItems = {
        url: url,
        requestHeaders: {
          'Content-Type': 'application/json',
          'X-EBAY-C-MARKETPLACE-ID': "EBAY_".concat(country),
          'Authorization': "Bearer ".concat(tokenRes.data.access_token)
        }
      };
      var result = axios.get(eBayGetItems.url, {
        headers: eBayGetItems.requestHeaders
      });
      return result;
    }).then(function (result) {
      return result.data.itemSummaries;
    });
  }

  function getItem(url) {
    return getToken().then(function (tokenRes) {
      var eBayGetItems = {
        url: url,
        requestHeaders: {
          'Content-Type': 'application/json',
          'Authorization': "Bearer ".concat(tokenRes.data.access_token)
        }
      };
      var result = axios.get(eBayGetItems.url, {
        headers: eBayGetItems.requestHeaders
      });
      return result;
    }).then(function (result) {
      return result.data.itemLocation;
    });
  }

  function getCategories() {
    var country = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'AU';
    return getToken().then(function (tokenRes) {
      var eBayDefaultTree = {
        url: "https://api.ebay.com/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=EBAY_".concat(country),
        requestHeaders: {
          'Authorization': "Bearer ".concat(tokenRes.data.access_token)
        }
      };
      var defaultTree = axios.get(eBayDefaultTree.url, {
        headers: eBayDefaultTree.requestHeaders
      });
      return Promise.all([tokenRes, defaultTree]);
    }).then(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
          tokenRes = _ref2[0],
          defaultTree = _ref2[1];

      var eBayCompleteTree = {
        url: "https://api.ebay.com/commerce/taxonomy/v1/category_tree/".concat(defaultTree.data.categoryTreeId),
        requestHeaders: {
          'Authorization': "Bearer ".concat(tokenRes.data.access_token),
          'Accept-Encoding': 'application/gzip'
        }
      };
      var result = axios.get(eBayCompleteTree.url, {
        headers: eBayCompleteTree.requestHeaders
      });
      return result;
    }).then(function (result) {
      return result.data.rootCategoryNode.childCategoryTreeNodes;
    });
  }

  return {
    getCategories: getCategories,
    getItems: getItems,
    getItem: getItem
  };
}();

module.exports = eBayAPI;