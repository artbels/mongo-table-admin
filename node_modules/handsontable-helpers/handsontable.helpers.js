/**
 * Handsontable helper functions
 * artbels @ 2016 
 * 
 */


(function() {

  var HH = this.HH = {};

  HH.reJsStrData = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z/i;


  HH.typesMap = {
    "string": "text",
    "number": "text", //handsontable numeric is only integers
    "boolean": "checkbox",
    "object": "text",
    "date": "date"
  };


  HH.draw = function(objArr, params) {

    if (typeof params == "string") params = {
      parent: document.querySelector(params)
    };

    if (typeof hot != "undefined") hot.destroy();

    params = params || {};

    objArr = objArr || [];

    params.parent = params.parent || document.querySelector("#ht") || document.body;
    if (typeof params.contextMenu === "undefined") params.contextMenu = true;
    else params.contextMenu = params.contextMenu;

    params.columns = params.columns || HH.getColumns(objArr, params.cols);

    if (params.readOnly) columns = columns.map(function(a) {
      a.readOnly = true;
      return a;
    });

    hot = new Handsontable(params.parent, {
      data: objArr,
      columns: params.columns,
      colHeaders: params.columns.map(function(a) {
        return a.data;
      }),
      manualColumnResize: true,
      columnSorting: true,
      startRows: params.startRows,
      startCols: params.startCols,
      minSpareRows: params.minSpareRows,
      contextMenu: params.contextMenu,
      afterChange: params.afterChange,
      afterRemoveRow: params.afterRemoveRow,
      colWidths: params.colWidths
    });
  };


  HH.setColType = function(prop, jsType) {

    var col = {
      data: prop,
      jsType: jsType
    };

    col.type = HH.typesMap[col.jsType];
    if (["id", "_id", "objectId"].indexOf(prop) != -1) col.readOnly = true;
    if (col.jsType == "date") col.dateFormat = 'DD-MMM-YYYY';
    return col;
  };


  HH.getColumns = function(objArr, cols) {
    var props = {};
    var columns = [];
    var col;

    for (var i = 0; i < objArr.length; i++) {
      var row = objArr[i];
      for (var key in row) {
        var val = row[key];
        var jsType = typeof val;
        if (jsType == "string") {
          if (HH.reJsStrData.test(val)) jsType = "date";
        }
        if (!props[key]) props[key] = jsType;
      }
    }

    if (cols) {
      for (var j = 0; j < cols.length; j++) {
        var colName = cols[j];
        if (props[colName]) {
          col = HH.setColType(colName, props[colName]);
          columns.push(col);
        }
      }
    } else {
      for (var prop in props) {
        col = HH.setColType(prop, props[prop]);
        columns.push(col);
      }
    }

    return columns;
  };


  HH.updateIdArr = function(data, colHeaders) {
    var idArr = [];
    for (var i = 0; i < data.length; i++) {
      var item = data[i];
      for (var j = 0; j < colHeaders.length; j++) {
        var col = colHeaders[j];
        if (col == "_id") {
          idArr.push(item[j]);
          break;
        }
      }
    }
    return idArr;
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


  HH.afterChange = function(changes, src) {

    if (src == "loadData") return;
    if (!changes || !changes.length) return;

    var changesArr = [];

    for (var i = 0; i < changes.length; i++) {
      var change = changes[i];

      var o = {
        oldValue: change[2],
        newValue: change[3]
      };
      var changed = (o.oldValue != o.newValue);

      if (!changed) continue;

      o.rowNum = Number(change[0]);
      o.field = change[1];
      changesArr.push(o);
    }

    return changesArr;
  };


  HH.afterRemoveRow = function(rowNum, numRows, idArr, func) {
    return new Promise(function(res, err) {

      (function next() {
        func(rowNum, function() {
          rowNum++;
          numRows--;

          if (numRows > 0) next();
          else res();
        });
      })();
    });
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


  HH.stringifyArrObj = function(arr) {

    if ((!arr) && (typeof(arr[0]) != "object")) return;

    for (var i = 0; i < arr.length; i++) {
      var row = arr[i];
      for (var key in row) {
        var cell = row[key];
        var type = typeof cell;
        var isDate = HH.reJsStrData.test(cell);

        if (type == "object") arr[i][key] = JSON.stringify(cell);
        else if (isDate) arr[i][key] = moment(new Date(cell)).format('DD-MMM-YYYY');
      }
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