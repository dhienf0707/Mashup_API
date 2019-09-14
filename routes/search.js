const express = require('express');
const router = express.Router();
const eBayAPI = require('./eBayAPI');

router.get('/full', (req, res) => {
    const query = req.query;
    const url = createUrl(query['query'], query['limit'], query['price']);
    eBayAPI.getItems(url, query['country'])
        .then((items) => {
            res.render('search', {items});
            // res.send(items);
        })
        .catch(err => console.log(err))
})

router.get('/submit', (req, res) => {
    const query = req.query;
    const url = createUrl(query['query'], query['limit'], query['price'], query['category']);
    eBayAPI.getItems(url, query['country'])
        .then((items) => {
            // res.render('search', {items})
            res.send(items);
        })
        .catch(err => console.log(err))
})

function createUrl(query, limit, priceRange, category) {
    return `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${query}&limit=${limit}&filter=${priceRange}&category_ids=${category}`;
}
module.exports = router;