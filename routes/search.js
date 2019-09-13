const express = require('express');
const router = express.Router();
const eBayAPI = require('./eBayAPI');

router.get('/full', (req, res) => {
    const query = req.query;
    const country = query.country;
    const url = createUrl(query['query'], query['limit'], query['price']);
    console.log(url);
    eBayAPI.getItems(url, country)
        .then((items) => {
            res.render('search', {items});
            // res.send(items);
        })
        .catch(err => console.log(err))
})

// router.post('/submit', (req, res) => {
//     const query = req.body.query;
//     const limit = req.body.limit;
//     res.redirect(`full?query=${query}&limit=${limit}`);
// })

router.get('/submit', (req, res) => {
    const query = req.query;
    const country = query.country;
    const url = createUrl(query['query'], query['limit'], query['price']);
    // console.log(url);
    eBayAPI.getItems(url, country)
        .then((items) => {
            // res.render('search', {items})
            res.send(items);
        })
        .catch(err => console.log(err))
})

function createUrl(query, limit, priceRange) {
    return `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${query}&limit=${limit}&filter=${priceRange}`;
}
module.exports = router;