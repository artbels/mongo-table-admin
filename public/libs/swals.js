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
    });
  };


  Swals.buildQuery = function(controlNode, params) {

    var queryNode;
    swal({
      title: "Valid JSON please",
      showCancelButton: false,
      showConfirmButton: false,
      html: "<textarea  id='query' cols='60' rows='12' style='font-family: monospace; font-size: 12px'></textarea><div id='swal-div'></div>",
      onOpen: function() {
        queryNode = document.querySelector("#query");
        queryNode.value = localStorage["query" + params.db + params.collection];
        var swalNode = document.querySelector("#swal-div");

        UI.button({
          innerHTML: "Find matching",
          id: "find",
          className: "btn btn-primary",
          parent: swalNode,

        }, function() {
          var query = {};
          try {
            query = JSON.parse(queryNode.value);
            localStorage["query" + params.db + params.collection] = JSON.stringify(query);
            params.query = JSON.stringify(query);
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
            localStorage["query" + params.db + params.collection] = JSON.stringify(query);
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

        Buttons.cancelSwal(swalNode);
      }

    }).then(function() {}).catch(function() {});
  };

})();