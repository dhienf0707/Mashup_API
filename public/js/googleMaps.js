// define global googleMap IIFE variable for initialising and keep track of the map
var googleMap = (function(){
	var myLatLng = {lat: -35.473469, lng: 149.012375},
        map,
        geocoder,
        markers = [],
        infoWindow,
        bounds,
        delay = 1,
        nextAddress = 0,
        addresses;

    function initMap() {
        infoWindow = new google.maps.InfoWindow;
        geocoder = new google.maps.Geocoder();
        bounds = new google.maps.LatLngBounds();
        map = new google.maps.Map(document.getElementById('map'), {
            center: myLatLng,
            zoom: 5
        });
    }

    function codeAddress(search, next) {
        geocoder.geocode({
            componentRestrictions: {
                country: `${search.countryCode}`,
                postalCode: `${search.postalCode}`
          }
        }, function(results, status) {
            if (status == 'OK') {
                if (nextAddress == 1) {
                    // console.log(markers);
                    map.setCenter(results[0].geometry.location);
                }
                addMarker(results[0].geometry.location);
            } else {
                if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                    nextAddress--;
                    delay++;
                } else {
                    console.log(status);
                }
            }
            next();
        });
        
    }

    // set addresses
    function setAddresses(addressesLst) {
        addresses = addressesLst;
        nextAddress = 0;
        markers = [];
        bounds = new google.maps.LatLngBounds();
        clearMarkers();
    }

    // create a sleep functinon for asynchronously set markers on the map
    const sleep = interval => new Promise(resolve => setTimeout(resolve, interval));

    const productMap = async params => {
        await sleep(delay);
        
        if (nextAddress < addresses.length) {
            codeAddress(addresses[nextAddress], productMap);
            nextAddress++;
        } else {
            map.fitBounds(bounds);
        }
    };

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
    
    function addMarkers(locations) {
        for (var i = 0; i < locations.length; i++) {
           addMarkers(location);
        }
    }

    function addMarker(location) {
        var marker = new google.maps.Marker({
            position: location,
            map: map,
        });
        markers.push(marker);
        bounds.extend(marker.position);
    }

    function clearMarkers() {
        markers.forEach(marker => {
            marker.setMap(null);
        });
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
        setCurrentLocation: setCurrentLocation,
        productMap: productMap,
        setAddresses: setAddresses,
        clearMarkers: clearMarkers,
	};
})();