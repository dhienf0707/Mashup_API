const axios = require('axios');
const qs = require('querystring');

let eBayAPI = (function () {
    // eBay request new access token (each token only have 2 hours expire period)
    const clientId = 'DucHienN-CAB432-PRD-ddfed633a-26e8f424';
    const clientSecret = 'PRD-dfed633a1263-09d8-44ad-82c1-a30e';
    const base64Credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const eBayTokenAPI = {
        url: 'https://api.ebay.com/identity/v1/oauth2/token',
        requestHeaders: {
            Content_Type: 'application/x-www-form-urlencoded',
            Authorization: `Basic ${base64Credentials}`
        },
        requestBody: {
            grant_type: 'refresh_token',
            refresh_token: 'v^1.1#i^1#p^3#f^0#r^1#I^3#t^Ul4xMF8zOjA1Q0MyQ0E5NzM0QkVCRDM2NzUyODA1MzVENkNGQkQwXzNfMSNFXjI2MA==',
            scope: 'https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.marketing.readonly https://api.ebay.com/oauth/api_scope/sell.marketing https://api.ebay.com/oauth/api_scope/sell.inventory.readonly https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.account.readonly https://api.ebay.com/oauth/api_scope/sell.account https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly https://api.ebay.com/oauth/api_scope/sell.fulfillment https://api.ebay.com/oauth/api_scope/sell.analytics.readonly https://api.ebay.com/oauth/api_scope/sell.finances'
        }
    }

    
    function getItems(url, country = 'AU') {
        return axios.post(eBayTokenAPI.url, qs.stringify(eBayTokenAPI.requestBody), {
                headers: eBayTokenAPI.requestHeaders
            })
            .then(tokenRes => {
                const eBayGetAPI = {
                    url: url,
                    requestHeaders: {
                        'Content-Type': 'application/json',
                        'X-EBAY-C-MARKETPLACE-ID': `EBAY_${country}`,
                        'Authorization': `Bearer ${tokenRes.data.access_token}`
                    }
                }
                // axios.get(eBayGetAPI.url, {headers: eBayGetAPI.requestHeaders})
                //     .then(resultRes => Promise.all([tokenRes, resultRes]))
                const result = axios.get(eBayGetAPI.url, {headers: eBayGetAPI.requestHeaders});
                return Promise.all([result]);
            })
            .then(([result]) => result.data.itemSummaries)
    }
    return {
        getItems: getItems
    }
})(); 

module.exports = eBayAPI;