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
      "Distinct values": function() {
        Swals.getDistinct(params, hot);
      },
      "Delete field": function() {
        Swals.deleteField(params, hot);
      },
      "Drop collection": function() {
        Swals.dropCollection(params);
      }, 
      "Visual query": function() {
        Controls.openVisualQuery();
      }, 
      "Export dataset": function() {
        var hotData = hot.getData();
        var colHeaders = hot.getColHeader();
        var minSpareRows = 1;
        var arr = HH.convArrArrToArrObj(hotData, minSpareRows, colHeaders, columns);
        var fileName = collection || "renameMe";
        download(JSON.stringify(arr), fileName + ".json", "application/json");
      }
    };

    UI.select(Object.keys(otherFunctions), {
      parent: controlNode,
      id: "other-actions",
      firstRowText: "Other actions",
      style: {
        margin: "10px"
      }
    }, function(r) {
      otherFunctions[r]();
    });
  };

  Controls.openVisualQuery = function() {

    var params = Controls.getCollectionFromUrl();

    $.post("/mongo/keys", params, function(fields) {

      if(!fields || !fields.length) return;

      var conditions = {
        "exists": {
          "$exists": true
        },
        "not exist": {
          "$exists": false
        },
        "equals": {
          "$eq": "value"
        },
        "not equal": {
          "$ne": "value"
        },
        "regex": {
          "$regex": "value"
        },
        "less than": {
          "$lt": "value"
        },
        "greater than": {
          "$gt": "value"
        },
        "less/equal": {
          "$lte": "value"
        },
        "greater/equal": {
          "$gte": "value"
        },
        "is true": {
          "$eq": true
        },
        "is false": {
          "$eq": false
        },
      };

      var clonedFields = JSON.parse(JSON.stringify(fields));
      var row = 1;

      swal({
        title: "Query",
        html: "<div id='swal-div'></div>",
        onOpen: function() {
          addRow(clonedFields, row);
        }
      }).then(function() {

        var query = {};

        var divNodes = document.querySelectorAll(".cond-div");
        for (var i = 0; i < divNodes.length; i++) {
          var divNode = divNodes[i];
          var field = divNode.querySelector("select.field > option:checked").value;
          if (/select/g.test(field)) continue;

          var condNode = divNode.querySelector("select.cond > option:checked");
          if (!condNode) continue;
          var cond = conditions[condNode.value];
          var mongoCond = Object.keys(cond)[0];
          var value = cond[mongoCond];

          if (value == "value") {
            var valueNode = divNode.querySelector("input.value");
            if (!valueNode) continue;
            var clonedCond = JSON.parse(JSON.stringify(cond));
            var mongoClonedCond = Object.keys(clonedCond)[0];
            clonedCond[mongoClonedCond] = valueNode.value;
            query[field] = clonedCond;
          } else query[field] = cond;
        }

        localStorage["query" + params.db + params.collection] = JSON.stringify(query);
        location.reload();


      }).catch(function() {});

      function addRow(clonedFields, row) {
        var parent = document.querySelector("#swal-div");

        UI.div({
          id: "row" + row,
          parent: parent,
          className: "cond-div"

        });
        var divNode = document.querySelector("#" + "row" + row);
        var currRow = JSON.parse(JSON.stringify(row));

        UI.select(clonedFields, {
          id: "field" + currRow,
          parent: divNode,
          className: "field"
        }, function(field) {
          row++;
          var elemPos = clonedFields.indexOf(field);
          clonedFields.splice(elemPos, 1);

          if (clonedFields.length) addRow(clonedFields, row);

          UI.select(Object.keys(conditions), {
            id: "cond" + currRow,
            parent: divNode,
            className: "cond"
          }, function(condition) {
            var mongoCond = Object.keys(conditions[condition])[0];
            var value = conditions[condition][mongoCond];

            if (value == "value") {
              UI.input({
                value: "",
                id: "value" + currRow,
                parent: divNode,
                className: "value",
                style: {
                  width: "150px"
                }
              });
            }
          });
        });
      }

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

      Swals.chooseCollection(list);
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