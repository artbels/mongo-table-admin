(function() {


  var HH = this.HH = {};

  HH.reJsStrData = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z/i;


  HH.typesMap = {
    "string": "text",
    "number": "numeric",
    "boolean": "checkbox",
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
        if (col == "_id") {
          idArr.push(item[j]);
        }
      }
    }
    return idArr;
  };


  HH.setColType = function(prop, jsType) {

    var col = {
      data: prop,
      jsType: jsType
    };

    col.type = HH.typesMap[col.jsType];
    if (prop == "_id") col.readOnly = true;
    if (col.jsType == "date") col.dateFormat = 'DD-MMM-YYYY';
    return col;
  };


  HH.buildSchema = function(arr) {

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
        var val = row[key];
        var jsType = typeof val;
        if(jsType == "string") {
          if(HH.reJsStrData.test(val)) jsType = "date";
        }
        if (!props[key]) props[key] = jsType;
      }
    }

    for (var prop in props) {
      var col = HH.setColType(prop, props[prop]);
      o.columns.push(col);
      o.colHeaders.push(prop);
    }
    return o;
  };


  HH.setDataType = function(data, type) {

    switch (type) {
      case "number":
        var parseIntRes = parseInt(data, 10);
        if (isNaN(parseIntRes)) data = undefined;
        else data = parseIntRes;
        break;

      case "boolean":
        data = Boolean(data);
        break;

      case "array":
        try {
          data = JSON.parse(data);
        } catch (e) {
          data = data.split(/,|;|\t/);
        }
        break;

      case "object":
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.log(e);
        }
        break;

      case "date":
        if (data) {
          try {
            data = new Date(data);
          } catch (e) {
            console.log(e);
          }
        }
        break;
    }
    return data;
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

      var rowNum = Number(change[0]);
      var field = change[1];
      var fieldType;
      for (var t = 0; t < columns.length; t++) {
        var col = columns[t];
        if (col.data == field) fieldType = col.jsType;
      }
      var setId = (field === "_id");
      if (setId) continue;

      var docId = arr[rowNum]._id;

      if (docId) {
        o.upd[rowNum] = o.upd[rowNum] || {};
        o.upd[rowNum][field] = HH.setDataType(newValue, fieldType);
      } else {
        o.new[rowNum] = o.new[rowNum] || {};
        o.new[rowNum][field] = HH.setDataType(newValue, fieldType);
      }
    }

    o.newArr = Object.keys(o.new);
    o.updArr = Object.keys(o.upd);

    return o;
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


  HH.stringifyArrObj = function(arr) {

    if ((!arr) && (typeof(arr[0]) != "object")) {
      return;
    }

    for (var i = 0; i < arr.length; i++) {
      var row = arr[i];
      for (var key in row) {
        var cell = row[key];
        var type = typeof cell;
        var isDate = HH.reJsStrData.test(cell);
        
        if (type == "object") arr[i][key] = JSON.stringify(cell);
        else if(isDate) arr[i][key] = moment(new Date(cell)).format('DD-MMM-YYYY');

      }
    }
    return arr;
  };

})();