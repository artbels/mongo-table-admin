var params = Nav.getCollectionFromUrl(); //todo: create clone of params on requests?
var controlNode = document.querySelector("#control");

var statusNode;
var hot, columns, colHeaders, idArr, minSpareRows = 1; //todo: group in one object?

getDataMongo(params);

function getDataMongo(params) {

  $.post("/find", params, function(arr) {

    if (arr.length >= 1000) {
      var limit = prompt("There are " + arr.length + " rows found. How much to load?", 1000);
      if (limit) arr = arr.slice(0, Number(limit));
    }

    UI.button({
      innerHTML: "Build query",
      id: "build-query",
      className: "",
      parent: controlNode,

    }, function() {
      var queryNode;
      swal({
        title: "Valid JSON please",
        showCancelButton: false,
        showConfirmButton: false,
        html: "<textarea  id='query' cols='60' rows='12' style='font-family: monospace; font-size: 12px'></textarea><div id='swal-div'></div>",
        onOpen: function() {
          queryNode = document.querySelector("#query");
          queryNode.value = localStorage.queryCode || "{}";
          var swalNode = document.querySelector("#swal-div");

          UI.button({
            innerHTML: "Find",
            id: "find",
            className: "btn btn-primary",
            parent: swalNode,

          }, function() {
            var query = {};
            try {
              query = JSON.parse(queryNode.value);
              localStorage.queryCode = JSON.stringify(query);
              params.query = JSON.stringify(query);
              getDataMongo(params);
            } catch (e) {
              console.warn(e);
            }
            swal.close();
          });

          UI.button({
            innerHTML: "Remove",
            id: "remove",
            className: "btn btn-danger",
            parent: swalNode,

          }, function() {
            
            var query = {};
            try {
              query = JSON.parse(queryNode.value);
              localStorage.queryCode = JSON.stringify(query);
              params.query = JSON.stringify(query);

              $.post("/remove", params, function(r) {
                if (r && r.ok && (r.ok == 1)) {
                  location.reload();

                } else statusNode.innerHTML = JSON.stringify(r);
              });
              
            } catch (e) {
              console.warn(e);
            }
            swal.close();
          });
        }

      }).then(function() {}).catch(function() {});
    });


    UI.button({
      innerHTML: "Reset query",
      id: "reset-query",
      className: "",
      parent: controlNode,
    }, function() {
      localStorage.queryCode = "{}";
      params.query = "{}";
      getDataMongo(params);
    });


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


    UI.button({
      innerHTML: "Rename field",
      id: "rename-field",
      className: "",
      parent: controlNode,
    }, function() {
      swal({
        title: "Rename field",
        html: "<div id='swal-div' align='center'></div>",
        showCancelButton: true,
        onOpen: function(r) {
          var swalNode = document.querySelector("#swal-div");

          var noIdColHeaders = colHeaders.filter(function(r) {
            if (r != "_id") return r;
          });

          UI.select(noIdColHeaders, {
            id: "field-to-rename",
            parent: swalNode
          }, function(jsType) {});

          // document.querySelector("#field-to-renameSelect").value = noIdColHeaders.pop();

          UI.br({
            id: "field-to-rename-br",
            parent: swalNode
          });

          UI.input({
            placeholder: "New name",
            id: "new-name",
            value: "",
            className: "",
            parent: swalNode,
            style: {
              width: "180px",
              textAlign: "center"
            }
          });
        }
      }).then(function() {
        params.old = document.querySelector("#field-to-renameSelect").value;
        params.new = document.querySelector("#new-name").value;

        if (!params.old || !params.new) {
          return swal({
            type: "warning",
            title: "no new or old"
          });
        }

        $.post("/rename", params, function(r) {
          if (r && r.ok && (r.ok == 1)) {
            getDataMongo(params);
          } else statusNode.innerHTML = JSON.stringify(r);
        });
      }).catch(function() {});
    });


    UI.button({
      innerHTML: "Delete field",
      id: "delete-field",
      className: "",
      parent: controlNode,
    }, function() {
      swal({
        title: "Delete field",
        showCancelButton: true,
        html: "<div id='swal-div' align='center'></div>",
        onOpen: function(r) {
          var swalNode = document.querySelector("#swal-div");

          var noIdColHeaders = colHeaders.filter(function(r) {
            if (r != "_id") return r;
          });

          UI.select(noIdColHeaders, {
            id: "field-to-delete",
            parent: swalNode
          }, function(jsType) {});

          // document.querySelector("#field-to-deleteSelect").value = noIdColHeaders.pop();

        }
      }).then(function() {
        params.field = document.querySelector("#field-to-deleteSelect").value;

        if (!params.field) {
          return swal({
            type: "warning",
            title: "no field to delete"
          });
        }

        $.post("/unsetfield", params, function(r) {
          if (r && r.ok && (r.ok == 1)) {
            location.reload();
          } else statusNode.innerHTML = JSON.stringify(r);
        });
      }).catch(function() {});
    });


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

    updateStatusDelayed("Autosaving changes");

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
    contextMenu: ['remove_row'], //TODO: add row and remove row callbacks
    comments: false,
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

        $.post("/insert", params, function(r) {
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

        $.post("/updatebyid", params, function(r) {
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

      $.post("/removebyid", params, function(r) {
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