// define global googleMap IIFE variable for initialising and keep track of the map
var googleMap = (function(){
	var myLatLng = {lat: -35.473469, lng: 149.012375},
        map,
        geocoder,
        markers = new Promise((resolve, reject)=> {}),
        delay = 0;

    const initMap = async () => {
        geocoder = new google.maps.Geocoder();
        map = new google.maps.Map(document.getElementById('map'), {
            center: myLatLng,
            zoom: 5
        });
    }

    const geocoderRequest = async(postalCode, region, latlng) => {
        const deferred = $.Deferred();
        if (postalCode){

        }
        geocoder.geocode({
            componentRestrictions: {
                postalCode: postalCode
            },
            region: region,
            location: latlng
        }, function(results, status) {
            if (status == 'OK') {
                deferred.resolve(results[0]);
            } else {
                deferred.reject(status);
            }
        })
        return deferred.promise();
    }

    // create a sleep functinon for asynchronously set markers on the map
    const sleep = interval => new Promise(resolve => setTimeout(resolve, interval));

    const itemsMarkers = async (items) => {
        bounds = new google.maps.LatLngBounds();
        markers.then(markers => {if (markers) clearMarkers(markers);})
        let promises = [];
        for (var i = 0; i < items.length; i++) {
            await sleep(delay);
            await geocoderRequest(items[i].itemLocation.postalCode, items[i].itemLocation.country, new google.maps.LatLng())
                .then(async result => {
                    const marker = addItemMarker(items[i], result.geometry.location);
                    if (i === 0) {
                        map.setCenter(result.geometry.location);
                        map.setZoom(5);
                    }
                    promises.push(Promise.resolve(marker));
                })
                .catch(status => {
                    if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                        delay++;
                        i--;
                    } else {
                        console.log(status);
                    }
                })
        }
        markers = Promise.all(promises)
            .then(markers => {
                markers.forEach(marker => {
                    bounds.extend(marker.position);
                });
                map.fitBounds(bounds);
                return markers;
            })
    }

    const addItemMarker = async (item, location) => {
        var content = 
        `<div id="iw-container">
            <a href= "${item.itemWebUrl}" target="_blank">
                <div class="iw-title">${item.title}</div>
            </a>
            <div class="iw-content">
                <div class="iw-subTitle">Price: ${item.price.value} ${item.price.currency}</div>
                <img src="${item.image.imageUrl}" alt="${item.title}" height="115" width="82">
                <p>Condition: ${item.condition}</p>
                <div class="iw-subTitle">Seller</div>
                <p>Name: ${item.seller.username}<br>Feedback percentage: ${item.seller.feedbackPercentage}<br>Feedback score: ${item.seller.feedbackScore}<br>
            </div>
            <div class="iw-bottom-gradient"></div>
        </div>`;
        return addMarker(content, location);
    }

    const addMarker = async (content, location) => {
        var marker = new google.maps.Marker({
            position: location,
            map: map
        });

        var infoWindow = new google.maps.InfoWindow({
            content: content,
            maxWidth: 350
        });

        // marker on click event
        marker.addListener('click', function() {
            infoWindow.open(map, marker);
        });

        map.addListener('click', function() {
            infoWindow.close();
        });

<<<<<<< HEAD
        // markers.push(marker);
        // bounds.extend(marker.position);
        return marker;
    }

    const getAddress = async (latlng) => {
        var deferred = $.Deferred();
        geocoder.geocode({'location': latlng}, function(results, status) {
            if (status === 'OK') {
                if (results[0]) {
                    const country = results[0].address_components.find(function (component) {
                        return component.types[0] == "country";
                    });

                    const political = results[0].address_components.find(function (component) {
                        return component.types[0] == "administrative_area_level_1";
                    });

                    if (political && country) {
                        deferred.resolve(([country.short_name, political.short_name]));
                    } else {
                        deferred.reject("cannot find specific country and postal code");
                    }
                } else {
                  deferred.reject('location not found');
                }
            } else {
               deferred.reject(status);
            }
        })
        return deferred.promise();
    }

    

    const getCurrentLocation = async () => {
        var deferred = $.Deferred();
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                map.setCenter(pos);
                map.setZoom(5);
                deferred.resolve(pos);
            }, function() {
                deferred.reject('The Geolocation service failed.');
            }, {enableHighAccuracy: true});
        } else {
            deferred.reject('Your browser doesn\'t support geolocation.')
        }
        return deferred.promise();
=======
        markers.push(marker);
        bounds.extend(marker.position);
>>>>>>> add gps checkbox (no function yet)
    }

    const getItemsGPS = async (country, political, items) => {
        bounds = new google.maps.LatLngBounds();
        markers.then(markers => {if (markers) clearMarkers(markers);})
        let promises = [];
        for (var i = 0; i < items.length; i++) {
            await sleep(delay);
            await googleMap.geocoderRequest(items[i].itemLocation.postalCode, items[i].itemLocation.country, new google.maps.LatLng())
                .then(async result => {
                    const itemCountry = result.address_components.find(function (component) {
                        return component.types[0] == "country";
                    });

                    const itemPolitical = result.address_components.find(function (component) {
                        return component.types[0] == "administrative_area_level_1";
                    });
                    if (itemCountry.short_name === country && itemPolitical.short_name === political) {
                        const marker = addItemMarker(items[i], result.geometry.location);
                        promises.push(Promise.resolve(marker));
                        await dom.displayItems(items[i]);
                    };
                })
                .catch(status => {
                    if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                        delay++;
                        i--;
                    } else {
                        console.log(status);
                    }
                })
        }
        markers = Promise.all(promises)
            .then(markers => {
                markers.forEach(marker => {
                    bounds.extend(marker.position);
                });
                map.fitBounds(bounds);
                return markers;
            })
    }


    const clearMarkers = async (markers) => {
        markers.forEach(marker => {
            marker.setMap(null);
        });
    }

	return {
        init: initMap,
        geocoderRequest: geocoderRequest,
        getCurrentLocation: getCurrentLocation,
        getAddress: getAddress,
        addItemMarker: addItemMarker,
        itemsMarkers: itemsMarkers,
        getItemsGPS: getItemsGPS
	};
})();