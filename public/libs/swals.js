(function() {

  var Swals = this.Swals = {};

  Swals.tooMuchRows = function(controlNode, params, num) {
    swal({
      title: num + " rows found",
      showConfirmButton: false,
      html: "<p>What do you want to do?</p><div id='swal-div'></div>",
      onOpen: function() {

        var swalNode = document.querySelector("#swal-div");

        UI.button({
          innerHTML: "Load 100",
          id: "load-100",
          className: "btn btn-primary",
          parent: swalNode,

        }, function() {
          params.limit = 100;
          getDataMongo(params);
          swal.close();
        });

        UI.button({
          innerHTML: "Set query",
          id: "set-query",
          className: "btn btn-success",
          parent: swalNode,

        }, function() {
          Swals.buildQuery(controlNode, params);
        });

        UI.button({
          innerHTML: "Load all",
          id: "load-all",
          className: "btn btn-secondary",
          parent: swalNode,

        }, function() {
          spinner.spin(document.querySelector("#table-container"));
          swal.close();
          getDataMongo(params);
        });
      }
    }).catch(function() {});
  };


  Swals.buildQuery = function(controlNode, params) {

    var queryNode;
    var html = "<textarea  id='query' cols='45' rows='9' style='font-family: monospace; font-size: 16px'></textarea>";
    html += '<br><a id="add-projection" href="#" style="font-size: 80%;">edit projection</a><br>';
    html += "<textarea  id='projection' cols='45' rows='3' style='font-family: monospace; font-size: 16px' hidden>{}</textarea>";
    html += "<div id='swal-div'></div>";
    swal({
      title: "Valid JSON please",
      showCancelButton: false,
      showConfirmButton: false,
      html: html,
      onOpen: function() {
        queryNode = document.querySelector("#query");
        queryNode.value = localStorage["query" + params.db + params.collection];
        var swalNode = document.querySelector("#swal-div");

        var addProjNode = document.querySelector("#add-projection");
        var projNode = document.querySelector("#projection");
        projNode.value = localStorage["projection" + params.db + params.collection];

        addProjNode.onclick = function() {
          if (addProjNode.innerHTML == "edit projection") {
            addProjNode.innerHTML = "hide projection";
            projNode.hidden = false;
          } else {
            addProjNode.innerHTML = "edit projection";
            projNode.hidden = true;
          }
        };


        UI.button({
          innerHTML: "Find matching",
          id: "find",
          className: "btn btn-primary",
          parent: swalNode,

        }, function() {
          var query = {},
            projection = {};
          try {
            query = JSON.parse(queryNode.value);
            localStorage["query" + params.db + params.collection] = JSON.stringify(query);
            params.query = JSON.stringify(query);

            projection = JSON.parse(projNode.value);
            localStorage["projection" + params.db + params.collection] = JSON.stringify(projection);
            params.projection = JSON.stringify(projection);

            location.reload();
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
            localStorage["query" + params.db + params.collection] = "{}";
            params.query = JSON.stringify(query);

            $.post("/mongo/remove", params, function(r) {
              if (r && r.ok && (r.ok == 1)) {
                location.reload();

              } else statusNode.innerHTML = JSON.stringify(r);
            });

          } catch (e) {
            console.warn(e);
          }
          swal.close();
        });

        Controls.cancelSwal(swalNode);
      }

    }).then(function() {}).catch(function() {});
  };


  Swals.dropCollection = function(params) {

    if(typeof params == "string") {
      params = {
        db: localStorage["input#db-path"],
        collection: params
      };
    }

    swal({
      title: "Drop collection?",
      type: "warning",
      showCancelButton: true
    }).then(function() {
      $.post("/mongo/dropcollection", params, function(r) {
        if (r) window.location.href = "/";
      });
    }).catch(function() {});
  };


  Swals.renameField = function(params, hot) {
    swal({
      title: "Rename field",
      html: "<div id='swal-div' align='center'></div>",
      showCancelButton: true,
      onOpen: function(r) {
        var swalNode = document.querySelector("#swal-div");

        var noIdColHeaders = hot.getColHeader().filter(function(r) {
          if (r != "_id") return r;
        });

        UI.select(noIdColHeaders, {
          id: "field-to-rename",
          parent: swalNode
        }, function(jsType) {});

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

      $.post("/mongo/rename", params, function(r) {
        if (r && r.ok && (r.ok == 1)) {
          location.reload();
        } else alert(JSON.stringify(r));
      });
    }).catch(function() {});
  };


  Swals.addField = function(columns, hot) {
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
          if (hot.getColHeader().indexOf(fieldName) != -1) {
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
  };


  Swals.getDistinct = function(params, hot) {
    swal({
      title: "Get distinct values",
      showCancelButton: true,
      html: "<div id='swal-div' align='center'></div>",
      onOpen: function() {
        var swalNode = document.querySelector("#swal-div");

        var noIdColHeaders = hot.getColHeader().filter(function(r) {
          if (r != "_id") return r;
        });

        UI.select(noIdColHeaders, {
          id: "field-to-distinct",
          parent: swalNode
        }, function(jsType) {});

      }
    }).then(function() {
      params.field = document.querySelector("#field-to-distinctSelect").value;

      if (!params.field) {
        return swal({
          type: "warning",
          title: "no field to distinct"
        });
      }

      $.post("/mongo/distinct", params, function(arr) {

        if (arr.length > 100) {
          console.log(JSON.stringify(arr));

          return swal({
            title: "More than 100",
            timer: 500,
            type: "warning"
          }).done();
        }

        swal({
          title: "Distinct values",
          html: JSON.stringify(arr),
          type: "success"
        }).done();

      });
    }).catch(function() {});
  };


  Swals.deleteField = function(params, hot) {
    swal({
      title: "Delete field",
      showCancelButton: true,
      html: "<div id='swal-div' align='center'></div>",
      onOpen: function() {
        var swalNode = document.querySelector("#swal-div");

        var noIdColHeaders = hot.getColHeader().filter(function(r) {
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

      $.post("/mongo/unsetfield", params, function(r) {
        if (r && r.ok && (r.ok == 1)) {
          location.reload();
        } else statusNode.innerHTML = JSON.stringify(r);
      });
    }).catch(function() {});
  };


  Swals.chooseCollection = function(list) {
    swal({
      title: "Choose collection",
      html: "<div id='swal-div' align='center'></div>",
      showConfirmButton: false,
      width: 700,
      onOpen: function() {

        var swalDivNode = document.querySelector("#swal-div");
        var dbPath = localStorage["input#db-path"];
        var i = 0;
        var l = list.length;
        var collArr = [];

        (function next() {
          var name = list[i].name;
          var currDbName = dbPath.split(/\//).pop();

          $.post("/mongo/collectionstats", {
            db: dbPath,
            collection: name
          }, function(r) {

            var sizeStr;
            var sizeKb = r.size / 1024;

            if (sizeKb > 100000) sizeStr = (sizeKb / 1024 / 1024).toFixed(1) + "GB";
            else if (sizeKb > 100) sizeStr = (sizeKb / 1024).toFixed(1) + "MB";
            else sizeStr = (sizeKb).toFixed(1) + "KB";

            var collObj = {
              collection: name,
              documents: r.count,
              size: sizeStr,
              table: "<a href='/" + currDbName + "/" + name + "/table" + "'>" + "table" + "</a>",
              pivot: "<a href='/" + currDbName + "/" + name + "/pivot" + "'>" + "pivot" + "</a>",
              x: "<a href='#' onclick='Swals.dropCollection(\"" + name + "\")'>x</a>",
            };

            collArr.push(collObj);

            i++;

            if (i < l) {
              next();
            } else {
              UI.table(collArr, {
                parent: swalDivNode,
                hideHead: true
              });
            }
          });
        })();
      }
    }).catch(function() {});
  };


  Swals.dbPath = function() {
    var html = "Please enter mongo url<div id='swal-div' align='center'></div>";
    html += '<a href="#" style = "font-size:80%;" onclick="document.querySelector(\'#db-path\').value = \'mongodb://localhost:27017/test\';">ex. mongodb://localhost:27017/test</a>';

    swal({
      // title: "Mongo URL",
      html: html,
      allowOutsideClick: false,
      allowEscapeKey: false,
      onOpen: function() {
        var swalDivNode = document.querySelector("#swal-div");

        UI.input({
          parent: swalDivNode,
          id: "db-path",
          placeholder: 'mongodb://localhost:27017/test',
          style: {
            fontSize: '100%',
            textAlign: "center",
            width: "420px"
          }
        });
      }
    }).then(function() {
      localStorage["input#db-path"] = document.querySelector('#db-path').value;
      Controls.collections();
    }).catch(function() {});
  };


  Swals.chooseDb = function(list) {
    swal({
      title: "Choose Database",
      html: "<div id='swal-div' align='center'></div>",
      showConfirmButton: false,
      onOpen: function() {

        var swalDivNode = document.querySelector("#swal-div");

        var i = 0;
        var l = list.databases.length;

        (function next() {
          var dbName = list.databases[i].name;
          var size = list.databases[i].sizeOnDisk / 1024 / 1024;
          var sizeStr;

          if (size > 100) sizeStr = (size / 1024).toFixed(2) + "GB";
          else sizeStr = (size).toFixed(2) + "MB";

          UI.button({
            parent: swalDivNode,
            innerHTML: dbName + ", " + sizeStr,
            id: dbName,
            style: {
              marginRight: "10px"
            }
          }, function(r) {
            var reUrl = /^mongodb\:\/\/([\w\d\-\_]+)(\:\d+)?(\/.*)?$/;

            var currPath = localStorage["input#db-path"];
            var currDbName = currPath.match(reUrl)[3];
            var urlWithoutDb = currPath.replace(currDbName, "").replace(/\/$/,'');
 
            localStorage["input#db-path"] = urlWithoutDb + "/" + r;
            Controls.collections();
          });

          i++;

          if (i < l) next();

        })();

        UI.br(swalDivNode);

        UI.button({
          parent: swalDivNode,
          id: "change-db-path",
          className: "btn btn-primary",
          innerHTML: 'Change DB Path',
        }, function() {
          Swals.dbPath();
        });
      }
    }).catch(function() {});
  };

})();