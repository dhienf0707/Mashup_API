// define global googleMap IIFE variable for initialising and keep track of the map
var googleMap = (function(){
	var myLatLng = {lat: -35.473469, lng: 149.012375},
		map,
        marker,
        infoWindow;

    function setCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                map.setCenter(pos);
            }, function() {
                handleLocationError(true, infoWindow, map.getCenter());
            });
        } else {
            // Browser doesn't support Geolocation
            handleLocationError(false, infoWindow, map.getCenter());
        }
    }
    
	function initMap() {
        infoWindow = new google.maps.InfoWindow;
		map = new google.maps.Map(document.getElementById('map'), {
			center: myLatLng,
			zoom: 5
		});
    }

    function addMarkers(locations) {
        for (let i = 0; i < locations.length; i++) {
            let marker = new google.maps.Marker({
                position: locations[i].coords,
                map: map,
            });
        }
    }

    function handleLocationError(browserHasGeolocation, infoWindow, pos) {
        infoWindow.setPosition(pos);
        infoWindow.setContent(browserHasGeolocation ?
                                'Error: The Geolocation service failed.' :
                                'Error: Your browser doesn\'t support geolocation.');
        infoWindow.open(map);
    }
	return {
        init: initMap,
        setCurrentLocation: setCurrentLocation
	};
})();