var params = Controls.getCollectionFromUrl(); //todo: create clone of params on requests?

localStorage["query" + params.db + params.collection] = localStorage["query" + params.db + params.collection] || "{}";
localStorage["projection" + params.db + params.collection] = localStorage["projection" + params.db + params.collection] || "{}";

params.query = localStorage["query" + params.db + params.collection];
params.projection = localStorage["projection" + params.db + params.collection];

UI.appendModal({
  title: "Update each",
  id: "update-each"
});

UI.appendModal({
  title: "Query",
  id: "query"
});

var controlNode = document.querySelector("#control");

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

    printTable(arr, params);

    Controls.buildQuery(controlNode, params);

    Controls.resetQuery(controlNode, params);

    Controls.otherActions(controlNode, params, columns, hot, params.collection);

    UI.span({
      innerHTML: (arr.length - 1) + " rows found",
      id: "status-span",
      parent: controlNode,
      style: {
        color: "#808080",
        fontSize: "90%"
      }
    });

    statusNode = document.querySelector("#status-span");

    updateStatusDelayed("Autosaving changes", 5000);
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

    spinner.spin(document.body);

    if (!window.onbeforeunload) window.onbeforeunload = function() {
      return "Saving changes in process. If you exit now you would lose your changes.";
    };

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
            spinner.stop();
            window.onbeforeunload = null;
            updateStatusDelayed("Everything saved", 300);
            updateStatusDelayed("Autosaving changes", 3300);
          }
        });
      })();
    } else {
      window.onbeforeunload = null;
      spinner.stop();
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
            spinner.stop();
            window.onbeforeunload = null;
            updateStatusDelayed("Everything saved", 300);
            updateStatusDelayed("Autosaving changes", 3300);
          }
        });
      })();
    } else {
      window.onbeforeunload = null;
      spinner.stop();
    }
  }

  function afterRemoveRow(rowNum, numRows) {
    var i = rowNum;
    var l = numRows + rowNum;

    spinner.spin(document.body);

    if (!window.onbeforeunload) window.onbeforeunload = function() {
      return "Saving changes in process. If you exit now you would lose your changes.";
    };

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
          spinner.stop();
          window.onbeforeunload = null;
          updateStatusDelayed("Autosaving changes");
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