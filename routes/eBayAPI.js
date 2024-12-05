const axios = require('axios');
const { get } = require('express/lib/response');
const qs = require('querystring');
require('dotenv').config();

const eBayAPI = (function () {
    // eBay request new access token (each token only have 2 hours expire period)
    const clientId = process.env.CLIENTID;
    const clientSecret = process.env.CLIENTSECRET;
    const base64Credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    function getToken() {
        const eBayTokenAPI = {
            url: 'https://api.ebay.com/identity/v1/oauth2/token',
            requestHeaders: {
                Content_Type: 'application/x-www-form-urlencoded',
                Authorization: `Basic ${base64Credentials}`
            },
            requestBody: {
                grant_type: 'refresh_token',
                refresh_token: process.env.REFRESH_TOKEN,
                scope: 'https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.marketing.readonly https://api.ebay.com/oauth/api_scope/sell.marketing https://api.ebay.com/oauth/api_scope/sell.inventory.readonly https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.account.readonly https://api.ebay.com/oauth/api_scope/sell.account https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly https://api.ebay.com/oauth/api_scope/sell.fulfillment https://api.ebay.com/oauth/api_scope/sell.analytics.readonly https://api.ebay.com/oauth/api_scope/sell.finances'
            }
        }
        return axios.post(eBayTokenAPI.url, qs.stringify(eBayTokenAPI.requestBody), {
            headers: eBayTokenAPI.requestHeaders
        })
            .then(tokenRes => tokenRes)
    }

    function getItems(url, country = 'AU') {
        return getToken()
            .then(tokenRes => {
                const eBayGetItems = {
                    url: url,
                    requestHeaders: {
                        'Content-Type': 'application/json',
                        'X-EBAY-C-MARKETPLACE-ID': `EBAY_${country}`,
                        'Authorization': `Bearer ${tokenRes.data.access_token}`
                    }
                }
                const result = axios.get(eBayGetItems.url, { headers: eBayGetItems.requestHeaders });
                return result;
            })
            .then((result) => result.data.itemSummaries)
    }

    function getItem(url) {
        return getToken()
            .then(tokenRes => {
                const eBayGetItems = {
                    url: url,
                    requestHeaders: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${tokenRes.data.access_token}`
                    }
                }
                const result = axios.get(eBayGetItems.url, { headers: eBayGetItems.requestHeaders });
                return result;
            })
            .then((result) => result.data.itemLocation)
    }

    function getCategories(country = 'AU') {
        return getToken()
            .then(tokenRes => {
                const eBayDefaultTree = {
                    url: `https://api.ebay.com/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=EBAY_${country}`,
                    requestHeaders: {
                        'Authorization': `Bearer ${tokenRes.data.access_token}`
                    }
                }
                const defaultTree = axios.get(eBayDefaultTree.url, { headers: eBayDefaultTree.requestHeaders });
                return Promise.all([tokenRes, defaultTree]);
            })
            .then(([tokenRes, defaultTree]) => {
                const eBayCompleteTree = {
                    url: `https://api.ebay.com/commerce/taxonomy/v1/category_tree/${defaultTree.data.categoryTreeId}`,
                    requestHeaders: {
                        'Authorization': `Bearer ${tokenRes.data.access_token}`,
                        'Accept-Encoding': 'application/gzip'
                    }
                }
                const result = axios.get(eBayCompleteTree.url, { headers: eBayCompleteTree.requestHeaders });
                return result;
            })
            .then((result) => result.data.rootCategoryNode.childCategoryTreeNodes)
    }

    return {
        getCategories: getCategories,
        getItems: getItems,
        getItem: getItem
    }
})();

module.exports = eBayAPI;