const express = require('express');
const router = express.Router();

locations = [
    {
        coords: {lat: 42.4778, lng: -70.9495}
    },
    {
        coords: {lat: 42.8584, lng: -70.9300}
    },
    {
        coords: {lat: 42.7762, lng: -71.0773}
    }
];
router.get('/', (req, res) => {
    res.render('index')
    
    // document.addEventListener("DOMContentLoaded", function() {
    //     let mapElement = document.getElementById('map');
        
    //     Map.loadGoogleMapsApi().then(function(googleMaps) {
    //       Map.createMap(googleMaps, mapElement);
    //     });
    //});
});

module.exports = router;