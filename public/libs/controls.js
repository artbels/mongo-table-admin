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
      "Run function on each": function() {
        Controls.updateEach();
      },
      "Import JSON": function() {
        Controls.importJson();
      },
      "Export JSON": function() {
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
      document.querySelector("select#other-actionsSelect > option").selected = true;
    });
  };


  Controls.importJson = function() {
    swal({
      title: "Import JSON",
      html: "<div id='swal-div'></div>",
      showConfirmButton: false,
      showCancelButton: true,
      onOpen: function() {
        var swalNode = document.querySelector("#swal-div");

        UI.fileReader({
          parent: swalNode,
          json: true
        }, function(r) {
          if (typeof r != "object")
            return swal({
              title: "File is not json",
              timer: 800,
              type: "warning"
            }).done();

          Swals.saveDataMongo(r);
        });
      }
    }).done();
  };


  Controls.updateEach = function() {

    var params = {
      height: "450px",
      parent: document.querySelector("#update-each-body"),
      id: "ace-code",
      width: "100%",
      marginTop: "0px",
      marginBottom: "0px",
      code: localStorage['aceEditace-codeValue'] || "//do something with doc\nreturn doc;"
    };

    Controls.ace(params);

    $("#update-each").modal();

    UI.button({
      parent: "#update-each-footer",
      id: "run",
      innerHTML: "Run"
    }, function() {

      var eachParams = Controls.getCollectionFromUrl();
      eachParams.func = params.instance.getValue();

      if (!eachParams.func) return swal({
        title: "no code provided",
        timer: 800,
        type: "error"
      }).done();

      T.post("/mongo/each", eachParams).then(function(r) {
        if (r == "completed") {
          swal({
            title: "all done!",
            timer: 800,
            type: "success"
          }).then(function() {
            location.reload();
          }).catch(function() {
            location.reload();
          });

          $("#update-each").modal('hide');

        } else
          swal({
            html: r,
            type: "error"
          }).done();
      });
    });
  };


  Controls.openVisualQuery = function() {

    var params = Controls.getCollectionFromUrl();

    T.post("/mongo/keys", params).then(function(fields) {

      if (!fields || !fields.length) return;

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

      if (list.length)
        Swals.chooseCollection(list);
      else
        Controls.dbs();
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

  Controls.ace = function(params) {

    params = params || {};

    if (typeof params == "string") params = {
      code: params,
    };

    params.parent = params.parent || document.querySelector("#ui") || document.body;
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
    aceDiv.onkeyup = function(e) {
      var currVal = params.instance.getValue();
      localStorage['aceEdit' + params.id + 'Value'] = currVal;
      if (e.altKey && e.ctrlKey && (e.which == 70)) {

        if (params.mode == "ace/mode/json") {
          var json;
          try {
            json = JSON.parse(currVal);
          } catch (err) {}

          if (!json) return;
          var beautifyJson = JSON.stringify(json, null, 2);
          localStorage['aceEdit' + params.id + 'Value'] = beautifyJson;
          params.instance.setValue(beautifyJson);
        } else if (params.mode == "ace/mode/javascript") {
          var js = js_beautify(currVal, {
            indent_size: 2,
            max_preserve_newlines: 1
          });
          localStorage['aceEdit' + params.id + 'Value'] = js;
          params.instance.setValue(js);
        }
      }
    };

    params.parent.appendChild(aceDiv);
    params.mode = params.mode || "ace/mode/javascript";

    params.instance = ace.edit(params.id);
    params.instance.$blockScrolling = Infinity;
    params.instance.setTheme("ace/theme/solarized_light");
    params.instance.getSession().setMode(params.mode);
    params.instance.getSession().setUseWrapMode(true);
    params.instance.setValue(params.code || localStorage['aceEdit' + params.id + 'Value'] || '');
    params.instance.gotoLine(1);
  };

})();