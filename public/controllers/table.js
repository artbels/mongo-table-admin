var params = Nav.getCollectionFromUrl();

var statusNode;
var hot, columns, colHeaders, idArr, minSpareRows = 1;

getDataMongo(params);

function getDataMongo(params) {

  $.post("/find", params, function(arr) {
    console.log(arr);

    if (arr.length >= 1000) {
      var limit = prompt("There are " + arr.length + " rows found. How much to load?", 1000);
      if (limit) arr = arr.slice(0, Number(limit));
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


    UI.button({
      innerHTML: "Add field",
      id: "add-column",
      className: "",
      parent: document.querySelector("#control"),
    }, function() {
      swal({
        title: "Add column",
        html: "<div id='swal-div' align='center'></div>",
        onOpen: function(r) {
          var swalNode = document.querySelector("#swal-div");

          UI.input({
            placeholder: "Field name",
            id: "field-name",
            className: "",
            parent: swalNode,
            style: {
              width: "180px",
              textAlign: "center"
            }
          });

          UI.br({
            parent: swalNode,
          });

          UI.select(Object.keys(HH.typesMap), {
            placeholder: "Field type",
            id: "field-type",
            parent: swalNode
          }, function(jsType) {});
        }
      }).then(function() {
        var col = {
          data: document.querySelector("#field-name").value,
          jsType: document.querySelector("#field-typeSelect").value
        };

        col.type = HH.typesMap[col.jsType];
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


    UI.span({
      innerHTML: arr.length + " rows found",
      id: "status-span",
      parent: document.querySelector("#control"),
    });

    statusNode = document.querySelector("#status-span");

    printTable(arr, params);
  });
}


function printTable(arr, params) {

  var container = document.getElementById('output');

  var ex = document.querySelector(".ht_master.handsontable");
  if (ex) {
    container.removeChild(ex);
  }

  var props = HH.getHeaders(arr);
  columns = props.columns;
  console.log(columns);
  colHeaders = props.colHeaders;
  idArr = props.idArr;

  hot = new Handsontable(container, {
    data: arr,
    columns: columns,
    colHeaders: colHeaders,
    rowHeaders: false,
    minSpareRows: minSpareRows,
    manualColumnResize: true,
    autoColSize: true,
    contextMenu: ['remove_row', 'remove_col'], //TODO: add row and remove row callbacks
    comments: false,
    afterChange: afterChange,
    afterRemoveRow: afterRemoveRow
  });

  function afterChange(changes, src) {

    if(src == "loadData") return;
    if (!changes || !changes.length) return;

    console.log(changes, src);

    var data = hot.getData();
    colHeaders = hot.getColHeader();
    idArr = HH.updateIdArr(data, colHeaders);

    var chObj = HH.workChanges(changes, arr, columns);
    console.log(chObj);

    var newArr = Object.keys(chObj.new);
    var updArr = Object.keys(chObj.upd);

    if (newArr.length) {
      var j = 0;
      var l = newArr.length;
      (function next() {
        var n = chObj.new[newArr[j]];
        params.data = JSON.stringify([n]);
        $.post("/insert", params, function(r) {
          if (r && r.result && r.result.ok && (r.result.ok == 1)) {

            var newId = r.insertedIds[0];

            var rowNum = newArr[j];
            data[rowNum][0] = newId;
            hot.setDataAtRowProp(rowNum, "_id", newId);

            statusNode.innerHTML = newId + " added";
          } else statusNode.innerHTML = JSON.stringify(r);
          j++;
          if (j < l) {
            next();
          }
        });

      })();
    }


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
      var setId = (field === "_id");
      var docId = idArr[rowNum];

      if (changed && !setId) {
        if (!docId) {
          // // console.log("new", docId, field, newValue);
          // var o = {};
          // o[field] = newValue;

          // params.data = JSON.stringify([o]);

          // $.post("/insert", params, function(r) {
          //   // console.log(r);
          //   if (r && r.result && r.result.ok && (r.result.ok == 1)) {
          //     var newId = r.insertedIds[0];
          //     var hotData = hot.getData();
          //     hotData[rowNum][0] = newId;
          //     hot.setDataAtRowProp(rowNum, "_id", newId);

          //     statusNode.innerHTML = newId + " added";
          //   }

          //   cb();
          // });
        } else {

          params.id = docId;
          var update = {};
          update[field] = newValue;
          params.update = JSON.stringify({
            "$set": update
          });
          $.post("/updatebyid", params, function(r) {
            if (r && r.ok && (r.ok == 1)) {
              statusNode.innerHTML = docId + " updated";
            }
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
    var i = rowNum;
    var l = numRows + rowNum;
    (function next() {

      params.id = idArr[rowNum];
      $.post("/removebyid", params, function(r) {
        if (r && r.ok && (r.ok == 1)) {
          statusNode.innerHTML = params.id + " deleted";
        } else statusNode.innerHTML = JSON.stringify(r);
        rowNum++;
        numRows--;
        if (numRows > 0) {
          next();
        }
      });
    })();
  }
}