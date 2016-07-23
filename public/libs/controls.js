(function() {

  var Controls = this.Controls = {};

  Controls.buildQuery = function(controlNode, params) {
    UI.button({
      innerHTML: "Build query",
      id: "build-query",
      className: "",
      parent: controlNode,

    }, function() {
      Swals.buildQuery(controlNode, params);
    });
  };


  Controls.resetQuery = function(controlNode, params) {
    if (localStorage["query" + params.db + params.collection] != "{}") {
      UI.button({
        innerHTML: "Reset query",
        id: "reset-query",
        className: "",
        style: {
          textDecoration: "underline"
        },
        parent: controlNode,
      }, function() {
        localStorage["query" + params.db + params.collection] = "{}";
        location.reload();
      });
    }
  };


  Controls.cancelSwal = function(swalNode) {
    UI.button({
      innerHTML: "Cancel",
      id: "cancel",
      className: "btn btn-secondary",
      parent: swalNode,

    }, function() {
      swal.close();
    });
  };

  Controls.dropCollection = function(swalNode) {
    UI.button({
      innerHTML: "Drop collection",
      id: "drop-collection",
      className: "",
      parent: swalNode,

    }, function() {
      Swals.dropCollection(params);
    });
  };



  Controls.otherActions = function(controlNode, params, columns, hot, collection) {
    var otherFunctions = {
      "Add field": function() {
        Swals.addField(columns, hot);
      },
      "Rename field": function() {
        Swals.renameField(params, hot);
      },
      "Delete field": function() {
        Swals.deleteField(params, hot);
      },
      "Drop collection": function() {
        Swals.dropCollection(params);
      }, 
      "Export dataset": function() {
        var hotData = hot.getData();
        var colHeaders = hot.getColHeader();
        var minSpareRows = 1;
        var arr = HH.convArrArrToArrObj(hotData, minSpareRows, colHeaders, columns);
        var fileName = collection || "renameMe";
        var data = "data:application/json," + encodeURIComponent(JSON.stringify(arr));

        var a = document.createElement("a");
        a.href = data;
        a.download = fileName + ".json";
        a.click();
      }
    };

    UI.select(Object.keys(otherFunctions), {
      parent: controlNode,
      firstRowText: "Other actions",
      style: {
        margin: "10px"
      }
    }, function(r) {
      otherFunctions[r]();
    });
  };

  Controls.changeView = function(newView) {
    var pathname = location.pathname;
    var pathArr = pathname.split(/\//);
    var view = pathArr[3];
    var newPath = window.location.href.replace(view, newView);

    window.location.href = newPath;
  };


  Controls.getCollectionFromUrl = function() {
    var pathname = location.pathname;
    var pathArr = pathname.split(/\//);
    var o = {
      db: localStorage["input#db-path"],
      collection: pathArr[2],
      view: pathArr[3]
    };
    return o;
  };


  Controls.collections = function() {
    var dbPath = localStorage["input#db-path"];
    $.post("/mongo/listcollections", {
      db: dbPath
    }, function(list) {

      Swals.chooseCollection(list, dbPath);
    });
  };

  Controls.dbs = function() {
    var dbPath = localStorage["input#db-path"];
    $.post("/mongo/listdatabases", {
      db: dbPath
    }, function(list) {

      if (!list.databases) return Swals.dbPath();

      Swals.chooseDb(list);
    });
  };

})();