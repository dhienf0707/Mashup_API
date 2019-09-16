const express = require('express');
const router = express.Router();
const eBayAPI = require('./eBayAPI');

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
    const query = req.body;
    const url = createUrl(query);
    console.log(url);
    eBayAPI.getItems(url, query.country)
        .then((items) => {
            // res.render('search', {items})
            res.send(items);
        })
        .catch(err => console.log(err))
});

function createUrl(query) {
    ['query', 'limit', 'minPrice', 'maxPrice', 'category_id', 'GPS'].forEach(element => {
        if (query[element] === undefined) query[element] = '';
    });
    return `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${query.query}&limit=${query.limit}&filter=price:[${query.minPrice}..${query.maxPrice}],priceCurrency:AUD&category_ids=${query.category_id}`;
}

module.exports = router;