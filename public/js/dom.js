$( document ).ready(function() {
    // imit material select
    $('.mdb-select').materialSelect();

    // get request
    $("#searchBtn").click(function(e) {
        e.preventDefault();
        ajaxGet();
    });

    // get result and update layout
    function ajaxGet() {
        const query = $("#queryTxt").val();
        const limit = $("#limitTxt").val();
        const country = $('#country').val();
        const minPrice = $('#minPrice').val() === undefined ? '' : $('#minPrice').val();
        const maxPrice = $('#maxPrice').val() === undefined ? '' : $('#maxPrice').val();
        if (parseInt(minPrice) > parseInt(maxPrice)) return alert('Invalid price range');
        $.ajax({
            type: "GET",
            url: `/search/submit?country=${country}&query=${query}&limit=${limit}&price=price:[${minPrice}..${maxPrice}],priceCurrency:AUD`,
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
                })
                googleMap.setItems(result);
                googleMap.productMap();
            },
            error: function(err) {
                $('#resultLst').html("<strong>Error</string>");
                console.log(`ERROR: ${err}`);
            }
        });
    }    
})