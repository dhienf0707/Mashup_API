var dom = {};
$(document).ready(function () {

    // imit material select
    $('.mdb-select').materialSelect();

    // categories update handler
    $('#country').change(e => updateCategories());

    const updateCategories = () => {
        const country = $('#country').val();
        $.ajax({
            type: "POST",
            url: `/categories/submit`,
            data: { country: country },
            success: function (result) {
                $('#categories').empty();
                $('#categories').append(
                    `<option value="" disabled selected>Choose your category</option>`
                );
                $.each(result, function (i, category) {
                    // update categories
                    $('#categories').append(
                        `<option value="${category.category.categoryId}">${category.category.categoryName}</option>`
                    )
                });
            },
            error: function (err) {
                console.log(`ERROR: ${err}`);
            }
        });
    }
    updateCategories(); // initialise category at first run (country: AU)

    // Search event handler
    $("#searchBtn").click((e) => {
        e.preventDefault();
        updateResults();
    });

    dom.displayItems = (item) => {
        $('#resultLst').append(
            `<a href="${item.itemWebUrl}" class="list-group-item list-group-item-action" target="_blank">
                <div class="d-flex w-100 justify-content-between">
                    <p>${item.title}</p>
                    <small>${item.price.value} ${item.price.currency}</small>
                </div>
            </a>`
        );
    }
    // get result and update layout
    const updateResults = () => {
        if ($("#queryTxt").val() === '') return alert('Keyword is required');
        if (parseInt($('#minPrice').val()) > parseInt($('#maxPrice').val())) return alert('Invalid price range');
        const data = {
            query: $("#queryTxt").val(),
            limit: $("#limitTxt").val(),
            minPrice: $('#minPrice').val(),
            maxPrice: $('#maxPrice').val(),
            category_id: $('#categories').val(),
            country: $('#country').val()
        }

        $.ajax({
            type: "POST",
            url: '/search/submit',
            data: data,
            success: function (results) {
                $('#resultLst').empty();
                // showing the results in the result list
                if ($('#searchByGPS').prop('checked') === false) {
                    $.each(results, function (i, item) {
                        if (i !== "source") {
                            dom.displayItems(item);
                        }
                    });
                    googleMap.itemsMarkers(results);
                }
                else {
                    googleMap.filterItemsGPS(results);
                }
            },
            error: function (err) {
                console.log(err);
            }
        });
    }
})