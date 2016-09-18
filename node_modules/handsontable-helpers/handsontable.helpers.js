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
    "number": "numeric",
    "boolean": "checkbox",
    "object": "text",
    "date": "date"
  };


  HH.add = function(obj, objArr, params) {

    if (obj.constructor != Object) throw Error("obj.constructor != Object");
    if (objArr.constructor != Array) throw Error("objArr.constructor != Array");
    if (typeof params == 'undefined') throw Error("params are required");

    objArr.push(obj);

    if (typeof params.instance == "undefined") {
      HH.draw(objArr, params);

    } else params.instance.render();
  };


  HH.draw = function(objArr, params) {

    if (typeof params == "string") params = {
      parent: document.querySelector(params)
    };

    if ((typeof params == "undefined") && (objArr.constructor == Object)) {
      params = objArr;
      objArr = undefined;
    }

    params = params || {};

    if (typeof params.instance != "undefined") params.instance.destroy();

    params.parent = params.parent || document.querySelector("#ht") || document.body;

    if (typeof params.contextMenu === "undefined") params.contextMenu = false;
    else params.contextMenu = params.contextMenu;

    params.columns = params.columns ||
      (objArr && HH.getColumns(objArr, params.cols));

    params.colHeaders = params.colHeaders ||
      (params.columns && params.columns.map(function(a) {
        return a.data;
      }));

    if (params.readOnly && params.columns)
      params.columns = params.columns.map(function(a) {
        a.readOnly = true;
        return a;
      });

    params.instance = new Handsontable(params.parent, {
      data: objArr,
      columns: params.columns,
      colHeaders: params.colHeaders,
      rowHeaders: params.rowHeaders,
      manualColumnResize: true,
      columnSorting: true,
      startRows: params.startRows,
      startCols: params.startCols,
      minSpareCols: params.minSpareCols,
      minSpareRows: params.minSpareRows,
      contextMenu: params.contextMenu,
      afterChange: params.afterChange,
      afterRemoveRow: params.afterRemoveRow,
      afterSelection: params.afterSelection,
      afterGetColHeader: params.afterGetColHeader,
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
    else if (col.jsType == "number") col.format = '0.[0000000000]';
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
        if (isNaN(data)) data = undefined;
        else data = Number(data);
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
      if (!change) continue;

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


  HH.convArrArrToArrObj = function(hotData, minSpareRows, columns) {
    var arr = [];

    var colHeaders = columns.map(function(a) {
      return a.data;
    });

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
            if (isNaN(cell)) cell = undefined;
            else cell = Number(cell);
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


  HH.convArrObjArrArr = function(arr) {
    var uniqColumns = {};
    var finArr = [];

    for (var i = 0; i < arr.length; i++) {
      for (var key in arr[i]) {
        uniqColumns[key] = true;
      }
    }

    var columns = Object.keys(uniqColumns);
    finArr.push(columns);

    for (var j = 0; j < arr.length; j++) {
      var row = arr[j];
      var rowArr = [];
      for (var col in uniqColumns) {
        var cell = row[col];
        rowArr.push(cell);
      }
      finArr.push(rowArr);
    }
    return finArr;
  };


  HH.setHeadersFirstRow = function(hot) {

    var
      colHeaders = [],
      columns = [],
      hotData = hot.getData(),
      firstRow = hotData[0],
      data = hotData.splice(1),
      deleteCols = [];

    for (var i in firstRow) {
      var name = firstRow[i];
      if (name) {
        colHeaders.push(name);
        columns.push({
          type: 'text'
        });
      } else deleteCols.push(i);
    }

    for (var j = 0; j < data.length; j++) {
      for (var c = deleteCols.length - 1; c >= 0; c--) {
        var delCol = deleteCols[c];
        data[j].splice(delCol, 1);
      }
    }

    hot.updateSettings({
      'colWidths': undefined,
      'columns': columns,
      'colHeaders': colHeaders,
      'data': data,
    });
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