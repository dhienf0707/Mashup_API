const express = require('express');
const router = express.Router();
const eBayAPI = require('./eBayAPI');
const redis = require('redis');

// create and connect redis client to local instance.
const redisHostName = process.env.REDISCACHEHOSTNAME || 'ebay-cache.redis.cache.windows.net';
const redisCacheKey = process.env.REDISCACHEKEY || 'AYf7EQmyZqgDZ84WyV6+O3tJ7+Gp20Jcgmtqi3LJ6n8=';
const client = redis.createClient(6380, redisHostName, {auth_pass: redisCacheKey, tls: {servername: redisHostName}});

// Print redis errors to the console
client.on('error', (err) => {
    console.log("Error " + err);
});

router.get('/full', (req, res) => {
    const query = req.query;
    const url = createUrl(query);
    console.log(url);
    console.log(query.GPS);
    if (query.GPS === '') query.GPS = false;
    eBayAPI.getItems(url, query.country)
        .then((items) => {
            res.render('search', {items: items, GPS: query.GPS});
            // res.send(items);
        })
        .catch(err => console.log(err))
});

router.post('/submit', (req, res) => {
    let query = req.body;
    const url = createUrl(query); // build eBay url and remove any whitespace in query
    redisKey = `eBay: ${query.query} / ${query.limit} / ${query.minPrice} / ${query.maxPrice} / ${query.category_id} / ${query.GPS}`;
    console.log(redisKey);
    console.log(url);

    // try fetching results from Redis first
    return client.get(redisKey, (err, result) => {
        if (result) {
            resultJSON = JSON.parse(result);
            return res.status(200).json(resultJSON);
        } else { // key not exist in redis
            return eBayAPI.getItems(url, query.country)
                .then((items) => {
                    // res.render('search', {items})
                    // Save the Wikipedia API response in Redis store
                    client.setex(redisKey, 3600, JSON.stringify({ source: 'Redis Cache', ...items }));
                    // Send JSON response to client
                    res.status(200).json({ source: 'eBay API', ...items, });
                })
                .catch(err => res.json(err)) 
        }
    });
});

function createUrl(query) {
    ['query', 'limit', 'minPrice', 'maxPrice', 'category_id', 'GPS'].forEach(element => {
        if (query[element] === undefined) query[element] = '';
        query[element] = (query[element]).trim();
    });
    return `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${query.query}&limit=${query.limit}&filter=price:[${query.minPrice}..${query.maxPrice}],priceCurrency:AUD&category_ids=${query.category_id}`;
}

module.exports = router;