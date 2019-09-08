const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('index');
    
    // document.addEventListener("DOMContentLoaded", function() {
    //     let mapElement = document.getElementById('map');
        
    //     Map.loadGoogleMapsApi().then(function(googleMaps) {
    //       Map.createMap(googleMaps, mapElement);
    //     });
    //});
});

module.exports = router;