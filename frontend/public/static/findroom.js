var title_lut = {
    "rooms_lat":"latitude",
    "rooms_lon":"longitude",
    "rooms_seats":"number of seats",
    "rooms_fullname":"building full name",
    "rooms_shortname":"building short name",
    "rooms_number":"door number",
    "rooms_name":"name of room",
    "rooms_address":"address",
    "rooms_type":"type of room",
    "rooms_furniture":"furniture contained",
    "rooms_href":"info link"
};

function formatQuery(number_seats){
    return {
        "WHERE": {
          "GT": {
            "rooms_seats": number_seats
          }
        },
        "OPTIONS": {
          "COLUMNS": [
            "rooms_lat",
            "rooms_lon",
            "rooms_seats",
            "rooms_fullname",
            "rooms_shortname",
            "rooms_number",
            "rooms_name",
            "rooms_address",
            "rooms_type",
            "rooms_furniture",
            "rooms_href"
          ],
          "ORDER": "rooms_seats"
        }
      }
}

function resolveResultFindroom(data, status, xhr){
    $("#returned-form").empty();
    let result = data['result'];
    // jQuery.noConflict();
    if(result.length === 0){
        $("#query-error-message").text("Cannot find a suitable room.");
        $("#popup-window").modal('show');
        return;
    }
    let table_header = Object.keys(result[0]);
    let th = $("<tr>")
    for(title of table_header){
        th.append(
            $("<th>").text(title_lut[title])
        )
    }
    let tbody = $("<tbody>");
    for (row of result.reverse()){
        let tr = $("<tr>");
        for (col of table_header){
            if (col === "rooms_href"){
                tr.append(
                    $("<td>").append($("<a>", {text: "Link", href: row[col]}))
                );
            }else{
                tr.append(
                    $("<td>").text(row[col])
                );
            }

        }
        tbody.append(tr)
    }
    $("#returned-form").append(th);
    $("#returned-form").append(tbody);
    return;

}

function rejectErrorFindroom(data, status, xhr){
    $("#returned-form").empty();
    data = data.responseJSON;
    $("#query-error-message").text(data['error']);
    $("#popup-window").modal('show');
}

function onSubmitForm(event){
    event.preventDefault();
    let seats_number = parseInt($("#size_input").val());
    let backend_template = formatQuery(seats_number);
    $.ajax({
        type: "POST",
        url: "/query",
        contentType: "application/json",
        data: JSON.stringify(backend_template),
        success: resolveResultFindroom,
        error: rejectErrorFindroom
    })
}

$(document).ready(
    function(){
        $("#query-form").on("submit", onSubmitForm);
    }
)
