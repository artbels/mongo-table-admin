var params = Nav.getCollectionFromUrl();

getDataMongo(params);

function getDataMongo(params) {

  $.post("/mongo/find", params, function(arr) {

    if(arr.length >= 1000) {
      var limit = prompt("There are " + arr.length + " rows found. How much to load?", 1000); 
      if(limit) arr = arr.slice(0, Number(limit));
    }

    UI.button({
      innerHTML: "Build query",
      id: "build-query",
      className: "",
      parent: document.querySelector("#control"),

    }, function() {
      var queryNode;
      swal({
        title: "Valid JSON please",
        html: "<textarea  id='query' cols='60' rows='12' style='font-family: monospace; font-size: 12px'></textarea><div id='swal-div'></div>",
        onOpen: function() {
          queryNode = document.querySelector("#query");
          queryNode.value = localStorage.queryCode || "{}";
        }

      }).then(function() {
        queryNode = document.querySelector("#query");
        var query = {};
        try {
          query = JSON.parse(queryNode.value);
          localStorage.queryCode = JSON.stringify(query);
          params.query = JSON.stringify(query);
          getDataMongo(params);
        } catch (e) {
          console.warn(e);
        }
      });
    });

    UI.button({
      innerHTML: "Reset query",
      id: "reset-query",
      className: "",
      parent: document.querySelector("#control"),
    }, function() {
      localStorage.queryCode = "{}";
      params.query = "{}";
      getDataMongo(params);
    });

    printPivot(arr);
  });

}


function printPivot(arr) {

  var servProps = ["_id", "updatedAt", "_updated_at", "createdAt", "_created_at"];

  arr = normalizeArrayOfObjects(arr);

  var rows = [];

  for (var key in arr[0]) {
    if(servProps.indexOf(key) == -1) {
      rows.push(key);
    }

    if(rows.length == 3) break; 

  }

  var renderers = $.extend(
    $.pivotUtilities.renderers,
    $.pivotUtilities.c3_renderers,
    $.pivotUtilities.d3_renderers,
    $.pivotUtilities.export_renderers);

  $("#output").pivotUI(arr, {
    renderers: renderers,
    rows: rows,
    // cols: cols,
    // vals: ["value"],
    // rendererName: "Table",
    //rendererName: "Stacked Bar Chart",
    // aggregatorName: "Сумма целых",
  }, true, "ru");
}


function normalizeArrayOfObjects(arr, params) {
  if ((!arr) && (typeof(arr[0]) != "object")) {
    return;
  }

  params = params || {};
  params.showColumns = params.showColumns || [];
  params.hideColumns = params.hideColumns || [];

  var columns = [];
  var cell = "";
  var res = [];

  for (var i = 0; i < arr.length; i++) { //собираем все ключи со всех объектов, а не только с первого
    for (var key in arr[i]) {
      var showCols = (params.showColumns.length > 0) ? (params.showColumns.indexOf(key) > -1) : true;

      if ((columns.indexOf(key) == -1) && showCols && (params.hideColumns.indexOf(key) == -1)) columns.push(key);
    }
  }

  for (var n = 0; n < arr.length; n++) { //собираем данные полей, чистим
    var oneObj = arr[n];
    res[n] = {};
    for (var l = 0; l < columns.length; l++) {

      cell = oneObj[columns[l]];

      if(cell === null) cell = "null";
      else if(cell === undefined) cell = "undefined";
      else if (typeof cell == "object") cell = JSON.stringify(cell);
      else if (typeof cell == "boolean") cell = JSON.stringify(cell);

      res[n][columns[l]] = cell;
    }
  }
  return res;
}