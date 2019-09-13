// define global googleMap IIFE variable for initialising and keep track of the map
var googleMap = (function(){
	var myLatLng = {lat: -35.473469, lng: 149.012375},
        map,
        geocoder,
        markers = [],
        bounds,
        delay = 0,
        nextItem = 0,
        items;

    function initMap() {
        geocoder = new google.maps.Geocoder();
        bounds = new google.maps.LatLngBounds();
        map = new google.maps.Map(document.getElementById('map'), {
            center: myLatLng,
            zoom: 5
        });
    }

    function codeAddress(item, next) {
        geocoder.geocode({
            componentRestrictions: {
                country: `${item.itemLocation.country}`,
                postalCode: `${item.itemLocation.postalCode}`
          }
        }, function(results, status) {
            if (status == 'OK') {
                if (nextItem == 1) {
                    map.setCenter(results[0].geometry.location);
                }
                addMarker(item, results[0].geometry.location);
            } else {
                if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                    nextItem--;
                    delay++;
                } else {
                    console.log(status);
                }
            }
            next();
        });
        
    }

    // set addresses
    function setItems(itemLst) {
        items = itemLst;
        nextItem = 0;
        clearMarkers();
        markers = [];
        bounds = new google.maps.LatLngBounds();
    }

    // create a sleep functinon for asynchronously set markers on the map
    const sleep = interval => new Promise(resolve => setTimeout(resolve, interval));

    const productMap = async params => {
        await sleep(delay);
        
        if (nextItem < items.length) {
            codeAddress(items[nextItem], productMap);
            nextItem++;
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
                var infoWindow = new google.maps.InfoWindow();
                handleLocationError(true, infoWindow, map.getCenter());
            });
        } else {
            // Browser doesn't support Geolocation
            var infoWindow = new google.maps.InfoWindow();
            handleLocationError(false, infoWindow, map.getCenter());
        }
    }
    
    function addMarkers(locations) {
        for (var i = 0; i < locations.length; i++) {
           addMarkers(location);
        }
    }

    function addMarker(item, location) {
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
        var marker = new google.maps.Marker({
            position: location,
            map: map,
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

        infoWindow.addListener('domready', function() {
            // Reference to the DIV that wraps the bottom of infowindow
            var iwOuter = $('.gm-style-iw.gm-style-iw-c');
        
            /* Since this div is in a position prior to .gm-div style-iw.
             * We use jQuery and create a iwBackground variable,
             * and took advantage of the existing reference .gm-style-iw for the previous div with .prev().
            */
            var iwBackground = iwOuter.prev();
        
            // Removes background shadow DIV
            iwBackground.children(':nth-child(2)').css({'display' : 'none'});
        
            // Removes white background DIV
            iwBackground.children(':nth-child(4)').css({'display' : 'none'});
        
            // Moves the infowindow 115px to the right.
            iwOuter.parent().parent().css({left: '115px'});
        
            // Moves the shadow of the arrow 76px to the left margin.
            iwBackground.children(':nth-child(1)').attr('style', function(i,s){ return s + 'left: 76px !important;'});
        
            // Moves the arrow 76px to the left margin.
            iwBackground.children(':nth-child(3)').attr('style', function(i,s){ return s + 'left: 76px !important;'});
        
            // Changes the desired tail shadow color.
            iwBackground.children(':nth-child(3)').find('div').children().css({'box-shadow': 'rgba(72, 181, 233, 0.6) 0px 1px 6px', 'z-index' : '1'});
        
            // Reference to the div that groups the close button elements.
            var iwCloseBtn = iwOuter.next();
        
            // Apply the desired effect to the close button
            iwCloseBtn.css({opacity: '1', right: '38px', top: '3px', border: '7px solid #48b5e9', 'border-radius': '13px', 'box-shadow': '0 0 5px #3990B9'});
        
            // If the content of infowindow not exceed the set maximum height, then the gradient is removed.
            if($('.iw-content').height() < 140){
              $('.iw-bottom-gradient').css({display: 'none'});
            }
        
            // The API automatically applies 0.7 opacity to the button after the mouseout event. This function reverses this event to the desired value.
            iwCloseBtn.mouseout(function(){
              $(this).css({opacity: '1'});
            });
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
        setItems: setItems,
        clearMarkers: clearMarkers,
	};
})();