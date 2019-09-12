$( document ).ready(function() {
    // imit material select
    $('.mdb-select').materialSelect();

    // get country
    var country = $( "#country option:selected" ).val();
    // when country changed
    $('#country').change(function() {
        country = $(this).val();
    })

    // get request
    $("#searchBtn").click(function(e) {
        e.preventDefault();
        ajaxGet();
    });
    
    // get result and update layout
    function ajaxGet() {
        const query = $("#queryTxt").val();
        const limit = $("#limitTxt").val();
        var addresses = [];
        $.ajax({
            type: "GET",
            url: `/search/submit?country=${country}&query=${query}&limit=${limit}`,
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
                    // store addresses
                    addresses.push({
                        countryCode: `${item.itemLocation.country}`,
                        postalCode: `${item.itemLocation.postalCode}`
                    });
                })
                googleMap.setAddresses(addresses);
                googleMap.productMap();
            },
            error: function(err) {
                $('#resultLst').html("<strong>Error</string>");
                console.log(`ERROR: ${err}`);
            }
        });
    }
})