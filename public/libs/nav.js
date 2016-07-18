(function() {

  var Nav = this.Nav = {};


  Nav.collections = function() {
    var dbPath = localStorage["input#db-path"];
    $.post("/listcollections", {
      db: dbPath
    }, function(list) {

      swal({
        title: "Choose collection",
        html: "<div id='swal-div'></div>",
        showConfirmButton: false,
        onOpen: function() {

          var swalDivNode = document.querySelector("#swal-div");
          var i = 0;
          var l = list.length;

          (function next() {
            var href = list[i].name;
            var db = dbPath.match(/\/(\w+?)\/?$/)[1];

            UI.span({
              parent: swalDivNode,
              innerHTML: href + " ",
              id: "span" + href
            });

            UI.link({
              parent: swalDivNode,
              href: "/" + db + "/" + href + "/table",
              innerHTML: "table",
              id: href + "table"
            });

            UI.span({
              parent: swalDivNode,
              innerHTML: " | ",
              id: "slash" + href
            });

            UI.link({
              parent: swalDivNode,
              href: "/" + db + "/" + href + "/pivot",
              innerHTML: "pivot",
              id: href + "pivot"
            });

            i++;

            if (i < l) {

              UI.br({
                parent: swalDivNode,
                id: "comma" + href
              });

              next();
            }
          })();
        }
      });
    });
  };


  Nav.dbPath = function() {
    swal({
      // title: "Mongo URL",
      html: "Please enter mongo url<div id='swal-div' align='center'> </div>",
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
    }).then(function () {
      Nav.collections();
    });
  };


  Nav.dbs = function() {
    var dbPath = localStorage["input#db-path"];
    $.post("/listdatabases", {
      db: dbPath
    }, function(list) {

      if(!list.databases) return Nav.dbPath();

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

            UI.button({
              parent: swalDivNode,
              innerHTML: dbName,
              id: dbName,
              style: {marginRight: "10px"}
            }, function (r) {
              localStorage["input#db-path"] = localStorage["input#db-path"].replace(/(?:\/)(\w+?)\/?$/, "/"+r);
              Nav.collections();
            });

            i++;

            if (i < l) next();
            
          })();

          UI.br(swalDivNode);

          UI.button({
            parent: swalDivNode,
            id: "change-db-path",
            innerHTML: 'Change DB Path',
          }, function () {
            Nav.dbPath();
          });
        }
      });
    });
  };

  Nav.getCollectionFromUrl = function() {
    var pathname = location.pathname;
    var pathArr = pathname.split(/\//);
    var o = {
      db: localStorage["input#db-path"],
      collection: pathArr[2],
      view: pathArr[3]
    };
    return o;
  };


  Nav.changeView = function(newView) {
    var pathname = location.pathname;
    var pathArr = pathname.split(/\//);
    var view = pathArr[3];
    var newPath = window.location.href.replace(view, newView);

    return newPath;
  };


})();