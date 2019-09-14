$( document ).ready(function() {
    // imit material select
    $('.mdb-select').materialSelect();

    // categories update handler
    $('#country').change(e => updateCategories());

    function updateCategories() {
        const country = $('#country').val();
        $.ajax({
            type: "GET",
            url: `/categories/submit?country=${country}`,
            success: function(result) {
                $('#categories').empty();
                $('#categories').append(
                    `<option value="" disabled selected>Choose your category</option>`
                );
                $.each(result, function(i, category) {
                    // update categories
                    $('#categories').append(
                        `<option value="${category.category.categoryId}">${category.category.categoryName}</option>`
                    )
                });
            },
            error: function(err) {
                console.log(`ERROR: ${err}`);
            }
        });
    }
    updateCategories(); // initialise category at first run (country: AU)

    // Search event handler
    $("#searchBtn").click((e) => {
        e.preventDefault();
        ajaxGet();
    });

    // get result and update layout
    function ajaxGet() {
        // query
        const query = $("#queryTxt").val();
        if (query === "") return alert("Keyword undefined");
        const limit = $("#limitTxt").val(); // limit
        const country = $('#country').val(); // country
        const category = $('#categories').val();

        // price
        const minPrice = $('#minPrice').val();
        const maxPrice = $('#maxPrice').val();
        if (parseInt(minPrice) > parseInt(maxPrice)) return alert('Invalid price range');
        
        $.ajax({
            type: "GET",
            url: `/search/submit?country=${country}&query=${query}&limit=${limit}&price=price:[${minPrice}..${maxPrice}],priceCurrency:AUD&category=${category}`,
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
                console.log(`ERROR: ${err}`);
            }
        });
    }    
})