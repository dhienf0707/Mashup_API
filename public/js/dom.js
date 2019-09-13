$( document ).ready(function() {
    // imit material select
    $('.mdb-select').materialSelect();

    // get request
    $("#searchBtn").click(function(e) {
        e.preventDefault();
        ajaxGet();
    });

    // get key by value function
    function getKeyByValue(object, value) {
        return Object.keys(object).find(key => object[key] === value);
    }

    const currency = {
        'AUD': 'AU',
        'CAD': 'CA',
        'EUR': 'DE',
        'EUR': 'ES',
        'EUR': 'FR',
        'GBP': 'GB',
        'HKD': 'HK',
        'EUR': 'IT',
        'USD': 'US'
    }
    // get result and update layout
    function ajaxGet() {
        const query = $("#queryTxt").val();
        const limit = $("#limitTxt").val();
        const country = $('#country').val();
        const minPrice = $('#minPrice').val() === undefined ? '' : $('#minPrice').val();
        const maxPrice = $('#maxPrice').val() === undefined ? '' : $('#maxPrice').val();
        const priceCurrency = getKeyByValue(currency, country);
        var items = [];
        $.ajax({
            type: "GET",
            url: `/search/submit?country=${country}&query=${query}&limit=${limit}&price=price:[${minPrice}..${maxPrice}],priceCurrency:${priceCurrency}`,
            success: function(result) {
                $('#resultLst').empty();
                $.each(result, function(i, item) {
                    // showing the results in the result list
                    $('#resultLst').append(
                        `<a href="${item.itemWebUrl}" class="list-group-item list-group-item-action" target="_blank">
                            <div class="d-flex w-100 justify-content-between">
                                <p>${item.title}</p>
                                <small>${item.price.value} ${item.price.currency}</small>
                            </div>
                        </a>`
                    );
                    // store items
                    items.push({
                        title: item.title,
                        price: `${item.price.value} ${item.price.currency}`,
                        condition: item.condition,
                        image: item.image.imageUrl,
                        url: item.itemWebUrl,
                        seller: item.seller,
                        countryCode: item.itemLocation.country,
                        postalCode: item.itemLocation.postalCode
                    });
                })
                googleMap.setItems(items);
                googleMap.productMap();
            },
            error: function(err) {
                $('#resultLst').html("<strong>Error</string>");
                console.log(`ERROR: ${err}`);
            }
        });
    }    
})