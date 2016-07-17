(function() {


  var HH = this.HH = {};


  HH.typesMap = {
    "string": "text",
    "number": "numeric",
    "boolean": "checkbox",
    "array": "text",
    "object": "text",
    "date": "date"
  };


  HH.servProps = ["_id", "updatedAt", "_updated_at", "createdAt", "_created_at"];


  HH.updateIdArr = function(data, colHeaders) {
    var idArr = [];
    for (var i = 0; i < data.length; i++) {
      var item = data[i];
      for (var j = 0; j < colHeaders.length; j++) {
        var col = colHeaders[j];
        if(col == "_id") {
          idArr.push(item[j]);
        }
      }             
    }
    return idArr;
  };


  HH.getHeaders = function(arr) {

    var props = {};

    var o = {
      columns: [],
      colHeaders: [],
      idArr: []
    };

    for (var i = 0; i < arr.length; i++) {
      var row = arr[i];
      o.idArr.push(row._id);
      for (var key in row) {
        var jsType = typeof row[key];
        props[key] = jsType;
      }
    }

    for (var prop in props) {
      var field = {
        data: prop,
        jsType: props[prop]
      };
      field.type = HH.typesMap[field.jsType];
      if (prop == "_id") field.readOnly = true;
      o.columns.push(field);
      o.colHeaders.push(prop);
    }
    return o;
  };


  HH.setDataType = function(data, type) {

  };


  HH.workChanges = function(changes, arr, columns) {
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
      var fieldType = columns.filter(function (a) {
        if(a.data == field) return a;
      })[0].jsType;
      console.log(fieldType);
      var setId = (field === "_id");
      if (setId) continue;

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


  HH.convArrArrToArrObj = function(hotData, minSpareRows, colHeaders) {
    var arr = [];

    for (var i = 0; i < hotData.length - minSpareRows; i++) {
      var row = hotData[i];
      var o = {};
      var allRowsEmpty = true;
      for (var j = 0; j < row.length; j++) {
        var cell = row[j];
        var prop = colHeaders[j];
        var type = columns[j].jsType;

        if ((typeof cell === "undefined") || (cell === null)) continue;
        allRowsEmpty = false;

        switch (type) {
          case "Number":
            var parseIntRes = parseInt(cell, 10);
            if (isNaN(parseIntRes)) cell = undefined;
            else cell = parseIntRes;
            break;

          case "Boolean":
            cell = Boolean(cell);
            break;

          case "Array":
            try {
              cell = JSON.parse(cell);
            } catch (e) {
              cell = cell.split(/,|;|\t/);
            }
            break;

          case "Object":
            try {
              cell = JSON.parse(cell);
            } catch (e) {
              console.log(e);
            }
            break;

          case "Date":
            if (cell) {
              try {
                cell = new Date(cell);
              } catch (e) {
                console.log(e);
              }
            }
            break;
        }

        o[prop] = cell;
      }
      if (!allRowsEmpty) arr.push(o);
    }
    return arr;
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