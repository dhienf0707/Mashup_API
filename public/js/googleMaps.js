// define global googleMap IIFE variable for initialising and keep track of the map
var googleMap = (function(){
    var map,
    geocoder,
    markers = [],
    delay = 0;

    // create a sleep functinon for asynchronously set markers on the map
    const sleep = interval => new Promise(resolve => setTimeout(resolve, interval));
    
    // initialize google map
    const initMap = () => {
        geocoder = new google.maps.Geocoder();
        map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: -35.473469, lng: 149.012375},
            zoom: 5
        });
    }

    // get eBay item location based on postal code and country
    const itemLocation = (postalCode, country) => {
        return $.Deferred(function(deferred) {
            geocoder.geocode({
                componentRestrictions: {
                    postalCode: postalCode
                },
                region: country
            }, function(results, status) {
                if (status == 'OK') {
                    deferred.resolve(results[0]);
                } else {
                    deferred.reject(status);
                }
            })
        }).promise();
    }


    // Iterate through each items, add markers and infowindow on the map
    // return a promise container all markers
    function* itemsMarkers(items) {
        bounds = new google.maps.LatLngBounds()
        yield Promise.all(markers)
            .then(markers => {
                if (markers) {
                    clearMarkers(markers);
                }
            })
        for (var i = 0; i < items.length; i++) {
            yield sleep(delay);
            yield result = itemLocation(items[i].itemLocation.postalCode, items[i].itemLocation.country)
                .then(result => {
                    const marker = addItemMarker(items[i], result.geometry.location);
                    if (i === 0) {
                        map.setCenter(result.geometry.location);
                        map.setZoom(3);
                    }
                    markers.push(Promise.resolve(marker));
                }, status => {
                    if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                        delay++;
                        i--;
                    } else {
                        console.log(status);
                    }
                })
        }
        yield Promise.all(markers)
            .then(markers => {
                markers.forEach(marker => {
                    bounds.extend(marker.position);
                });
                map.fitBounds(bounds);
            })
            .catch(err => console.log(err))
    }

    function makeSingle(generator) {
        let globalNonce;
        return async function(...args) {
          const localNonce = globalNonce = new Object();
      
          const iter = generator(...args);
          let resumeValue;
          for (;;) {
            const n = iter.next(resumeValue);
            if (n.done) {
              return n.value;  // final return value of passed generator
            }
      
            // whatever the generator yielded, _now_ run await on it
            resumeValue = await n.value;
            if (localNonce !== globalNonce) {
              return;  // a new call was made
            }
            // next loop, we give resumeValue back to the generator
          }
        };
      }

    itemsMarkers = makeSingle(itemsMarkers);
    // add item marker on the map and infowindow with product info content
    // return the marker
    const addItemMarker = (item, location) => {
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

    // add marker and event listeners
    // return marker
    const addMarker = (content, location) => {
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
        
        return marker;
    }

    // get address based on latitude and longitude
    // return promise container country name and political name
    const getAddress = (latlng) => {
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
                        deferred.reject("cannot find specific country and political");
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

    // get current location
    // return promise containing latitude and longitude info
    const getCurrentLocation = () => {
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
    }

    function* filterItemsGPS(items) {
        bounds = new google.maps.LatLngBounds();
        yield Promise.all(markers)
            .then(markers => {
                if (markers) {
                    clearMarkers(markers)
                }
            })
        const latlng = yield getCurrentLocation();
        const [country, political] = yield getAddress(latlng);
        for (var i = 0; i < items.length; i++) {
            yield sleep(delay);
            yield itemLocation(items[i].itemLocation.postalCode, items[i].itemLocation.country)
                .then(result => {
                    const itemCountry = result.address_components.find(function (component) {
                        return component.types[0] == "country";
                    });

                    const itemPolitical = result.address_components.find(function (component) {
                        return component.types[0] == "administrative_area_level_1";
                    });
                    if (itemCountry.short_name === country && itemPolitical.short_name === political) {
                        const marker = addItemMarker(items[i], result.geometry.location);
                        markers.push(Promise.resolve(marker));
                        dom.displayItems(items[i]);
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

        yield Promise.all(markers)
            .then(markers => {
                markers.forEach(marker => {
                    bounds.extend(marker.position);
                });
                map.fitBounds(bounds);
            })
            .catch(err => console.log(err))
    }
    
    filterItemsGPS = makeSingle(filterItemsGPS);
    // clear markers
    const clearMarkers = (markers) => {
        markers.forEach(marker => {
            marker.setMap(null);
        });
    }

	return {
        init: initMap,
        getCurrentLocation: getCurrentLocation,
        getAddress: getAddress,
        addItemMarker: addItemMarker,
        itemsMarkers: itemsMarkers,
        makeSingle: makeSingle,
        filterItemsGPS: filterItemsGPS
	};
})();