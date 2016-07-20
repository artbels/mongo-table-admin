var servProps = ["_id", "updatedAt", "_updated_at", "createdAt", "_created_at"];
var minSpareRows = 1;

var columns = [];
var colHeaders = [];
var hot;

var typesMap = {
  "String": "text",
  "Number": "numeric",
  "Boolean": "checkbox",
  "Array": "text",
  "Object": "text",
  "Date": "date"
};

swal({
  // title: "Mongo URL",
  html: "Please enter mongo url<div id='swal-div'> </div>",
  allowOutsideClick: false,
  allowEscapeKey: false,
  showConfirmButton: false,
  onOpen: function() {
    var swalDiv = document.querySelector("#swal-div");

    UI.input({
      parent: swalDiv,
      id: "db-path",
      placeholder: 'mongodb://localhost:27017/test',
      style: {
        fontSize: '100%',
        textAlign: "center"
      }
    });


    UI.input({
      parent: swalDiv,
      id: "collection",
      placeholder: 'collection',
      style: {
        fontSize: '100%',
        textAlign: "center"
      }
    });


    UI.button({
      parent: swalDiv,
      id: "table",
      innerHTML: 'Editable table',
      style: {
        fontSize: '120%',
        // textAlign: "center"
      }
    }, function() {
      formFindMongo("table");
    });


    UI.button({
      parent: swalDiv,
      id: "pivot",
      innerHTML: 'Pivot',
      style: {
        fontSize: '120%',
        // textAlign: "center"
      }
    }, function() {
      formFindMongo("pivot");
    });
  }
});

function formFindMongo(type) {

  swal.close();

  var dbPathDiv = document.querySelector("#db-path");

  var collectionDiv = document.querySelector("#collection");

  if (dbPathDiv && collectionDiv) {

    var params = {
      db: dbPathDiv.value,
      collection: collectionDiv.value,
      type: type
    };

    getDataMongo(params);
  }
}


function getDataMongo(params) {
  $.post("/mongo/mongo/find", params, function(arr) {

    console.log(arr);

    UI.button({
      innerHTML: "Build query",
      id: "build-query",
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
      parent: document.querySelector("#control"),
    }, function() {
      localStorage.queryCode = "{}";
      params.query = JSON.stringify(query);
      getDataMongo(params);
    });

    UI.button({
      innerHTML: "Add column",
      id: "add-column",
      parent: document.querySelector("#control"),
    }, function() {
      swal({
        title: "Add column",
        html: "<div id='swal-div'></div>",
        onOpen: function(r) {
          var swalNode = document.querySelector("#swal-div");

          UI.input({
            placeholder: "Field name",
            id: "field-name",
            parent: swalNode
          });

          UI.select(Object.keys(typesMap), {
            placeholder: "Field type",
            id: "field-type",
            parent: swalNode
          }, function(jsType) {
          });
        }
      }).then(function() {
        var col = {
          data: document.querySelector("#field-name").value,
          jsType: document.querySelector("#field-typeSelect").value
        };

        col.type = typesMap[col.jsType];
        if (col.jsType == "Date") col.dateFormat = 'DD-MMM-YYYY';
        if (!col.data || !col.jsType) return;

        columns.push(col);
        colHeaders.push(col.data);

        hot.updateSettings({
          colHeaders: colHeaders,
          columns: columns
        });
      });
    });


    if (params.type !== "table") {
      printPivot(arr);
    } else {
      printTable(arr, params);
    }
  });
}

function printTable(arr, params) {

  var container = document.getElementById('output');
  var ex = document.querySelector(".ht_master.handsontable");
  if (ex) {
    container.removeChild(ex);
  }

  arr = normalizeArrayOfObjects(arr);


  for (var key in arr[0]) {
    // if(servProps.indexOf(key) != -1) continue;
    var field = {
      data: key,
      jsType: typeof arr[0][key]
    };
    field.type = typesMap[field.jsType];
    columns.push(field);
    colHeaders.push(key);
    if (key == "_id") field.readOnly = true;

  }

  hot = new Handsontable(container, {
    data: arr,
    colHeaders: colHeaders,
    columns: columns,
    minSpareRows: minSpareRows,
    rowHeaders: true,
    autoColSize: true,
    contextMenu: false, //TODO: add row and remove row callbacks
    comments: ['remove_row'],
    afterChange: afterChange,

    // afterRemoveRow: afterRemoveRow
  });

  function afterChange(changes, src) {
    console.log(changes, src);

    if (!changes || !changes.length) return;

    var arr = convArrOfArrToArrOfObj(hot.getData(), minSpareRows, colHeaders);

    var chObj = convChangesObjArr(changes, arr);

    var len = changes.length;
    var i = 0;
    next();

    function next() {
      var change = changes[i];
      var rowNum = change[0];
      var field = change[1];
      var oldValue = change[2];
      var newValue = change[3];
      var changed = (oldValue != newValue);
      var docId = arr[rowNum]._id;

      if (changed) {
        if (!docId) {
          console.log("new", docId, field, newValue);
          var o = {};
          o[field] = newValue;
          var saveParams = {
            db: localStorage["input#db-path"],
            collection: localStorage["input#collection"],
            data: JSON.stringify([o])
          };
          $.post("/mongo/insert", saveParams, function(r) {
              console.log(r);
              cb();
            if (r && r.result && r.result.ok && (r.result.ok == 1)) {
              console.log("everything saved!");
            }
          });
        } else {

          console.log(docId, field, newValue);
          params.id = docId;
          var update = {};
          update[field] = newValue;
          params.update = JSON.stringify({
            "$set": update
          });
          $.post("/mongo/updatebyid", params, function(obj) {
            console.log(obj);
            cb();
          });
        }
      }
    }

    function cb() {
      i++;
      if (i < len) next();
      else {
        console.log("all saved");
      }
    }
  }

  function afterRemoveRow(rowNum, numRows) {
    var rowCount = this.countRows();

    console.log(rowNum, numRows, rowCount);
  }
}

function saveNew(o) {
  var i = 0;
  var l = Object.keys(o).length;

}

function convChangesObjArr(changes, arr) {
  if(!changes) return;

  var o = {
    new: {},
    upd: {}
  };

  for (var i = 0; i < changes.length; i++) {
    var change = changes[i];

    var oldValue = change[2];
    var newValue = change[3];
    var changed = (oldValue != newValue);
    if(!changed) continue;

    var rowNum = change[0];
    var field = change[1];
    var docId = arr[rowNum]._id;

    if(docId) {
      o.upd[rowNum] = o.upd[rowNum] || {};
      o.upd[rowNum][field] = newValue;
    } else {
      o.new[rowNum] = o.new[rowNum] || {};
      o.new[rowNum][field] = newValue;
    }
  }

  return o;
}


function printPivot(arr) {

  arr = normalizeArrayOfObjects(arr);

  var renderers = $.extend(
    $.pivotUtilities.renderers,
    $.pivotUtilities.c3_renderers,
    $.pivotUtilities.d3_renderers,
    $.pivotUtilities.export_renderers);

  $("#output").pivotUI(arr, {
    renderers: renderers,
    // rows: rows,
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
      cell = ((cell && (cell !== null)) ? cell : "");
      if (typeof cell == "object") cell = JSON.stringify(cell);
      res[n][columns[l]] = cell;
    }
  }
  return res;
}


function drawAce(params) {

  params = params || {};

  if (typeof params == "string") params = {
    code: params,
  };

  params.parent = params.parent || document.body;
  params.id = params.id || "jsScript";
  params.width = params.width || "750px";
  params.height = params.height || "150px";
  params.fontSize = params.fontSize || "14px";
  params.marginTop = params.marginTop || "10px";
  params.marginBottom = params.marginBottom || "10px";

  var exAceDiv = document.querySelector("#" + params.id);
  if (exAceDiv) params.parent.removeChild(exAceDiv);

  var aceDiv = document.createElement("div");
  aceDiv.id = params.id;
  aceDiv.style.width = params.width;
  aceDiv.style.height = params.height;
  aceDiv.style.fontSize = params.fontSize;
  aceDiv.style.marginTop = params.marginTop;
  aceDiv.style.marginBottom = params.marginBottom;

  params.parent.appendChild(aceDiv);

  aceEditor = ace.edit(params.id);
  aceEditor.$blockScrolling = Infinity;
  aceEditor.setTheme("ace/theme/solarized_light");
  aceEditor.getSession().setMode("ace/mode/json");
  aceEditor.getSession().setUseWrapMode(true);
  aceEditor.setValue(params.code || '');
  aceEditor.gotoLine(2);

  aceEditor.on("blur", params.onblur);
}

function convArrOfArrToArrOfObj(hotData, minSpareRows, colHeaders) {
  var arr = [];

  for (var i = 0; i < hotData.length - minSpareRows; i++) {
    var row = hotData[i];
    var o = {};
    var allRowsEmpty = true;
    for (var j = 0; j < row.length; j++) {
      var cell = row[j];
      var prop = colHeaders[j];
      var type = columns[j].jsType;

      if ((typeof cell === "undefined") || (cell === null)) continue;
      allRowsEmpty = false;

      switch (type) {
        case "Number":
          var parseIntRes = parseInt(cell, 10);
          if (isNaN(parseIntRes)) cell = undefined;
          else cell = parseIntRes;
          break;

        case "Boolean":
          cell = Boolean(cell);
          break;

        case "Array":
          try {
            cell = JSON.parse(cell);
          } catch (e) {
            cell = cell.split(/,|;|\t/);
          }
          break;

        case "Object":
          try {
            cell = JSON.parse(cell);
          } catch (e) {
            console.log(e);
          }
          break;

        case "Date":
          if (cell) {
            try {
              cell = new Date(cell);
            } catch (e) {
              console.log(e);
            }
          }
          break;
      }

      o[prop] = cell;
    }
    if (!allRowsEmpty) arr.push(o);
  }
  return arr;
}