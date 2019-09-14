const express = require('express');
const router = express.Router();
const eBayAPI = require('./eBayAPI');

router.get('/submit', (req, res) => {
    const query = req.query;
    eBayAPI.getCategories(query['country'])
        .then(result => res.send(result))
        .catch(err => console.log(err))
})

module.exports = router;
