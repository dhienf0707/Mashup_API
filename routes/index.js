const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('index', { title: "my title", message: "me message"});
});

module.exports = router;