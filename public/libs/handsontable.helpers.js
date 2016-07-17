(function() {


  var HH = this.HH = {};


  HH.typesMap = {
    "String": "text",
    "Number": "numeric",
    "Boolean": "checkbox",
    "Array": "text",
    "Object": "text",
    "Date": "date"
  };


  HH.servProps = ["_id", "updatedAt", "_updated_at", "createdAt", "_created_at"];


  HH.getColHeaders = function(arr) {

    var props = {};

    var o = {
      columns: [],
      colHeaders: []
    };

    for (var i = 0; i < arr.length; i++) {
      var row = arr[i];
      for (var key in row) {
        var jsType = typeof row[key];
        props[key] = jsType;
      }
    }
  };


  HH.workChanges = function(changes, arr) {
    if (!changes) return;

    var o = {
      new: {},
      upd: {}
    };

    for (var i = 0; i < changes.length; i++) {
      var change = changes[i];

      var oldValue = change[2];
      var newValue = change[3];
      var changed = (oldValue != newValue);
      if (!changed) continue;

      var rowNum = change[0];
      var field = change[1];
      var docId = arr[rowNum]._id;

      if (docId) {
        o.upd[rowNum] = o.upd[rowNum] || {};
        o.upd[rowNum][field] = newValue;
      } else {
        o.new[rowNum] = o.new[rowNum] || {};
        o.new[rowNum][field] = newValue;
      }
    }

    return o;
  };


  HH.convJsTypeToHHType = function(jsType) {

  };


  HH.buildParseSchema = function(columns, colHeaders) {
    var schemeObj = {};

    for (var i = 0; i < columns.length; i++) {
      var item = columns[i];
      schemeObj[colHeaders[i]] = {
        type: item.jsType
      };
    }
    return schemeObj;
  };
  
})();