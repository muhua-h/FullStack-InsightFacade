title_lut ={
    "sections_avg": "average grade",
    "sections_pass": "number of passed students",
    "sections_fail": "number of failed students",
    "sections_audit": "number of students who audited",
    "sections_year": "year",
    "sections_dept": "department",
    "sections_id": "course code",
    "sections_instructor": "instructor",
    "sections_title": "course title",
    "sections_uuid": "uuid of the section"
}

function formatQuery(year, dept, section_id, selected_cols) {
    return {
        "WHERE": {
            "AND": [
                {
                    "EQ": {
                        "sections_year": year
                    }
                },
                {
                    "IS": {
                        "sections_dept": dept
                    }
                },
                {
                    "IS": {
                        "sections_id": section_id
                    }
                }
            ]

        },
        "OPTIONS": {
            "COLUMNS": selected_cols
        }
    }
}

function resolveResultFindcourse(data, status, xhr) {
    $("#returned-form").empty();
    let result = data['result'];
    // jQuery.noConflict();
    if (result.length === 0) {
        $("#query-error-message").text("The requested course is not offered in the requested year.");
        $("#popup-window").modal('show');
        return;
    }
    let table_header = Object.keys(result[0]);
    let th = $("<tr>")
    for (title of table_header) {
        th.append(
            $("<th>").text(title_lut[title])
        )
    }
    let tbody = $("<tbody>");
    for (row of result.reverse()) {
        let tr = $("<tr>");
        for (col of table_header) {
            tr.append(
                $("<td>").text(row[col])
            );
        }
        tbody.append(tr)
    }
    $("#returned-form").append(th);
    $("#returned-form").append(tbody);
    return;

}

function rejectErrorFindcourse(data, status, xhr) {
    $("#returned-form").empty();
    data = data.responseJSON;
    $("#query-error-message").text(data['error']);
    $("#popup-window").modal('show');
}

function onSubmitForm(event) {
    event.preventDefault();
    let dept = $("#input-dept").val();
    let course_id = $("#input-course-nr").val();
    let year = parseInt($("#input-year").val());
    let selected_cols = [];
    for (check_item of $(".form-check>input")) {
        if (check_item['checked']) {
            selected_cols.push(check_item['id']);
        }
    }
    console.log(selected_cols);
    let backend_template = formatQuery(year, dept, course_id, selected_cols);
    $.ajax({
        type: "POST",
        url: "/query",
        contentType: "application/json",
        data: JSON.stringify(backend_template),
        success: resolveResultFindcourse,
        error: rejectErrorFindcourse
    })

}

$(document).ready(
    function () {
        $("#query-form").on("submit", onSubmitForm);
    }
)
