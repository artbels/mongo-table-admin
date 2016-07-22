var params = Nav.getCollectionFromUrl(); //todo: create clone of params on requests?
localStorage["query" + params.db + params.collection] = localStorage["query" + params.db + params.collection] || "{}";
params.query = localStorage["query" + params.db + params.collection];
var controlNode = document.querySelector("#control");

var spinner = new Spinner({
  length: 25,
  width: 15,
  radius: 30,
  scale: 1.5,
  color: "#606060",
});

var statusNode;
var hot, columns, colHeaders, idArr, minSpareRows = 1; //todo: group in one object?

countDataMongo(params);

function countDataMongo(params) {
  $.post("/mongo/count", params, function(num) {

    if (num < 1000) getDataMongo(params);
    else {
      Swals.tooMuchRows(controlNode, params, num);
    }
  });
}

function getDataMongo(params) {

  $.post("/mongo/find", params, function(arr) {
    if ((typeof spinner != "undefined") && spinner) spinner.stop();

    Buttons.buildQuery(controlNode, params);

    Buttons.resetQuery(controlNode, params);


    UI.button({
      innerHTML: "Add field",
      id: "add-column",
      className: "",
      parent: controlNode,
    }, function() {
      swal({
        title: "Add column",
        html: "<div id='swal-div' align='center'></div>",
        showCancelButton: true,
        onOpen: function(r) {
          var swalNode = document.querySelector("#swal-div");

          UI.input({
            placeholder: "Field name",
            id: "field-name",
            className: "",
            parent: swalNode,
            value: "",
            style: {
              width: "180px",
              textAlign: "center"
            }
          });

          document.querySelector("#field-name").onkeyup = checkFieldExist;
          document.querySelector("#field-name").onchange = checkFieldExist;

          function checkFieldExist() {
            var fieldName = document.querySelector("#field-name").value;
            if (colHeaders.indexOf(fieldName) != -1) {
              swal.showValidationError(fieldName + " is already exists");
              swal.disableButtons();
            } else {
              swal.resetValidationError();
              swal.enableButtons();
            }
          }

          UI.br({
            id: "add-column-span",
            parent: swalNode
          });

          UI.select(Object.keys(HH.typesMap), {
            placeholder: "Field type",
            id: "field-type",
            parent: swalNode
          }, function(jsType) {});

          document.querySelector("#field-typeSelect").value = "string";
        }
      }).then(function() {
        var propNode = document.querySelector("#field-name");
        var jsTypeNode = document.querySelector("#field-typeSelect");

        if (!propNode || !propNode.value) {
          return swal({
            type: "warning",
            title: "no field name"
          });
        }

        if (colHeaders.indexOf(propNode.value) != -1) {
          return swal({
            type: "warning",
            title: propNode.value + " already exists"
          });
        }

        var col = HH.setColType(propNode.value, jsTypeNode.value || "string");

        columns.push(col);
        colHeaders.push(col.data);

        hot.updateSettings({
          colHeaders: colHeaders,
          columns: columns
        });
      }).catch(function() {});
    });



    Buttons.renameField(controlNode, params);

    Buttons.deleteField(controlNode, params);


    UI.span({
      innerHTML: arr.length + " rows found",
      id: "status-span",
      parent: controlNode,
      style: {
        color: "#808080",
        fontSize: "90%"
      }
    });

    statusNode = document.querySelector("#status-span");

    updateStatusDelayed("Autosaving changes", 5000);

    printTable(arr, params);
  });
}


function printTable(arr, params) {

  var container = document.getElementById('output');

  var ex = document.querySelector(".ht_master.handsontable");
  if (ex) {
    container.removeChild(ex);
  }

  var props = HH.buildSchema(arr);

  columns = props.columns;
  colHeaders = props.colHeaders;
  idArr = props.idArr;

  arr = HH.stringifyArrObj(arr);

  hot = new Handsontable(container, {
    data: arr,
    columns: columns,
    colHeaders: colHeaders,
    rowHeaders: false,
    minSpareRows: minSpareRows,
    manualColumnResize: true,
    manualColumnMove: true,
    autoColSize: true,
    contextMenu: ['remove_row'],
    comments: false,
    columnSorting: true,
    afterChange: afterChange,
    afterRemoveRow: afterRemoveRow
  });

  function afterChange(changes, src) {

    if (src == "loadData") return;
    if (!changes || !changes.length) return;

    var data = hot.getData();
    colHeaders = hot.getColHeader();
    idArr = HH.updateIdArr(data, colHeaders);

    var chObj = HH.workChanges(changes, arr, columns);

    if (chObj.newArr.length) {
      var n = 0;
      var nl = chObj.newArr.length;

      (function next() {
        var newRowNum = Number(chObj.newArr[n]);
        var newObj = chObj.new[newRowNum];
        params.data = JSON.stringify([newObj]);

        $.post("/mongo/insert", params, function(r) {
          if (r && r.result && r.result.ok && (r.result.ok == 1)) {

            var newId = r.insertedIds[0];
            hot.setDataAtRowProp(newRowNum, "_id", newId);
            statusNode.innerHTML = newId + " added";

          } else statusNode.innerHTML = JSON.stringify(r);
          n++;
          if (n < nl) next();
          else {
            updateStatusDelayed("Everything saved", 300);
            updateStatusDelayed("Autosaving changes", 3300);
          }
        });
      })();
    }


    if (chObj.updArr.length) {
      var u = 0;
      var ul = chObj.updArr.length;

      (function next() {
        var rowNum = chObj.updArr[u];
        var update = chObj.upd[rowNum];

        params.id = idArr[rowNum];
        params.update = JSON.stringify(update);

        $.post("/mongo/updatebyid", params, function(r) {
          if (r && r.ok && (r.ok == 1)) {
            statusNode.innerHTML = params.id + " updated";

          } else statusNode.innerHTML = JSON.stringify(r);
          u++;
          if (u < ul) next();
          else {
            updateStatusDelayed("Everything saved", 300);
            updateStatusDelayed("Autosaving changes", 3300);
          }
        });
      })();
    }
  }

  function afterRemoveRow(rowNum, numRows) {
    var i = rowNum;
    var l = numRows + rowNum;

    (function next() {
      params.id = idArr[rowNum];

      $.post("/mongo/removebyid", params, function(r) {
        if (r && r.ok && (r.ok == 1)) {
          statusNode.innerHTML = params.id + " deleted";

        } else statusNode.innerHTML = JSON.stringify(r);
        rowNum++;
        numRows--;

        if (numRows > 0) next();
        else {
          updateStatusDelayed("Autosaving changes", 3300);
        }
      });
    })();
  }
}

function updateStatusDelayed(text, delay) {
  if (!text) return;
  delay = delay || 3000;

  setTimeout(function() {
    statusNode.innerHTML = text;
  }, delay);
}