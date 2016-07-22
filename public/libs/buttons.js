(function() {

  var Buttons = this.Buttons = {};

  Buttons.buildQuery = function(controlNode, params) {
    UI.button({
      innerHTML: "Build query",
      id: "build-query",
      className: "",
      parent: controlNode,

    }, function() {
      Swals.buildQuery(controlNode, params);
    });
  };


  Buttons.resetQuery = function(controlNode, params) {
    if (localStorage["query" + params.db + params.collection] != "{}") {
      UI.button({
        innerHTML: "Reset query",
        id: "reset-query",
        className: "",
        parent: controlNode,
      }, function() {
        localStorage["query" + params.db + params.collection] = "{}";
        location.reload();
      });
    }
  };

  Buttons.renameField = function(controlNode, params) {
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

        $.post("/mongo/rename", params, function(r) {
          if (r && r.ok && (r.ok == 1)) {
            location.reload();
          } else alert(JSON.stringify(r));
        });
      }).catch(function() {});
    });
  };


  Buttons.deleteField = function(controlNode, params) {
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
        onOpen: function() {
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

        $.post("/mongo/unsetfield", params, function(r) {
          if (r && r.ok && (r.ok == 1)) {
            location.reload();
          } else statusNode.innerHTML = JSON.stringify(r);
        });
      }).catch(function() {});
    });
  };


   Buttons.cancelSwal = function(swalNode) {
    UI.button({
          innerHTML: "Cancel",
          id: "cancel",
          className: "btn btn-secondary",
          parent: swalNode,

        }, function() {
          swal.close();
        });
   };


})();