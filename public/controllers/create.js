var HOT;
var controlsNode = document.querySelector("#controls");
var tableNode = document.querySelector("#table");
var resultsNode = document.querySelector("#results");

var typesMap = {
  "String": "text",
  "Number": "numeric",
  "Boolean": "checkbox",
  "Array": "text",
  "Object": "text",
  "Date": "date"
};

var minSpareCols = 0;
var minSpareRows = 1;
var startRows = 20;
var startCols = 10;

var columns = [];

for (var i = 0; i < startCols; i++) {
  columns.push({
    type: 'text',
    jsType: "String"
  });
}



HOT = new Handsontable(tableNode, {
  startRows: startRows,
  startCols: startCols,
  minSpareCols: minSpareCols,
  minSpareRows: minSpareRows,
  columns: columns,
  rowHeaders: true,
  colHeaders: true,
  contextMenu: true,
  afterGetColHeader: afterGetColHeader
});


UI.button({
  parent: controlsNode,
  id: "set-first-row-headers",
  innerHTML: "Set first row as headers"
}, setHeadersFirstRow);


UI.button({
  parent: resultsNode,
  id: "save-data",
  innerHTML: "Save data"
}, function() {
  var hotData = HOT.getData();
  var colHeaders = HOT.getColHeader();
  var arr = convArrOfArrToArrOfObj(hotData, minSpareRows, colHeaders);
  saveDataMongo(arr);

});

// UI.button({
//   parent: resultsNode,
//   innerHTML: "Save schema",
//   id: "save-schema",
// }, function() {
//   var colHeaders = HOT.getColHeader();
//   console.log(buildParseSchema(columns, colHeaders));

// });


/**
 * Functions
 */


function saveDataMongo(arr) {
  swal({
    // title: "Mongo URL",
    html: "Please enter mongo url<div id='swal-div'> </div>",
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    onOpen: function() {
      var swalDiv = document.querySelector("#swal-div");

      UI.input({
        parent: swalDiv,
        id: "db-path",
        placeholder: 'mongodb://localhost:27017/test',
        style: {
          fontSize: '100%',
          textAlign: "center"
        }
      });


      UI.input({
        parent: swalDiv,
        id: "collection",
        placeholder: 'collection',
        style: {
          fontSize: '100%',
          textAlign: "center"
        }
      });

      UI.button({
        parent: swalDiv,
        id: "save-arr",
        innerHTML: 'Save',
        style: {
          fontSize: '120%',
          // textAlign: "center"
        }
      }, function() {
        var params = {
          db: document.querySelector("#db-path").value,
          collection: document.querySelector("#collection").value,
          data: JSON.stringify(arr)
        };
        $.post("/insert", params, function(r) {
          console.log(r);
          if (r && r.result && r.result.ok && (r.result.ok == 1)) {
            swal("everything saved!");
          }
        });
      });
    }
  });
}

function setHeadersFirstRow() {
  var colHeaders = HOT.getColHeader();
  var hotData = HOT.getData();
  var firstRow = hotData[0];
  var data = hotData.splice(1);

  for (var i = 0; i < firstRow.length; i++) {
    var name = firstRow[i];
    if (name) {
      colHeaders[i] = name;
    } else {
      colLeft = firstRow.length - i;
      // colHeaders.splice(i, colLeft);
      columns.splice(i, colLeft);
      break;
    }
  }

  HOT.updateSettings({
    'colHeaders': colHeaders,
    'columns': columns,
    'data': data,
  });
}


function afterGetColHeader(col, TH) {
  if (col == -1) return;

  var instance = this,
    menu = buildMenu(columns[col].type),
    button = buildButton();

  addButtonMenuEvent(button, menu);

  Handsontable.Dom.addEvent(menu, 'click', function(event) {
    if (event.target.nodeName == 'LI') {
      setColumnType(col, event.target.data.colType, instance);
    }
  });
  if (TH.firstChild.lastChild.nodeName === 'BUTTON') {
    TH.firstChild.removeChild(TH.firstChild.lastChild);
  }
  TH.firstChild.appendChild(button);
  TH.style['white-space'] = 'normal';
}


function addButtonMenuEvent(button, menu) {
  Handsontable.Dom.addEvent(button, 'click', function(event) {
    var changeTypeMenu, position, removeMenu;

    document.body.appendChild(menu);

    event.preventDefault();
    event.stopImmediatePropagation();

    changeTypeMenu = document.querySelectorAll('.changeTypeMenu');

    for (var i = 0, len = changeTypeMenu.length; i < len; i++) {
      changeTypeMenu[i].style.display = 'none';
    }
    menu.style.display = 'block';
    position = button.getBoundingClientRect();

    menu.style.top = (position.top + (window.scrollY || window.pageYOffset)) + 2 + 'px';
    menu.style.left = (position.left) + 'px';

    removeMenu = function(event) {
      if (event.target.nodeName == 'LI' && event.target.parentNode.className.indexOf('changeTypeMenu') !== -1) {
        if (menu.parentNode) {
          menu.parentNode.removeChild(menu);
        }
      }
    };
    Handsontable.Dom.removeEvent(document, 'click', removeMenu);
    Handsontable.Dom.addEvent(document, 'click', removeMenu);
  });
}


function buildMenu(activeCellType) {
  var
    menu = document.createElement('UL'),
    types = Object.keys(typesMap),
    item;

  menu.className = 'changeTypeMenu';

  for (var i = 0, len = types.length; i < len; i++) {
    item = document.createElement('LI');
    if ('innerText' in item) {
      item.innerText = types[i];
    } else {
      item.textContent = types[i];
    }

    item.data = {
      'colType': types[i]
    };

    if (activeCellType == types[i]) {
      item.className = 'active';
    }
    menu.appendChild(item);
  }

  return menu;
}


function buildButton() {
  var button = document.createElement('BUTTON');

  button.innerHTML = '\u25BC';
  button.className = 'changeType';

  return button;
}


function setColumnType(i, type, instance) {

  var colHeaders = HOT.getColHeader();

  columns[i].type = typesMap[type];
  columns[i].jsType = type;
  // columns[i].data = colHeaders[i];
  if (type == "Date") columns[i].dateFormat = 'DD-MMM-YYYY';


  var hotData = HOT.getData();

  for (var j = 0; j < hotData.length; j++) {
    var jtem = hotData[j];
    var cell = jtem[i];
    if ((cell === null) || (cell === "")) continue;
    switch (type) {
      case "Number":
        HOT.setDataAtCell(j, i, parseInt(cell, 10));
        break;

      case "Date":
        var formattedDate = moment(new Date(cell)).format('DD-MMM-YYYY');
        HOT.setDataAtCell(j, i, formattedDate);
        break;

      case "Boolean":
        HOT.setDataAtCell(j, i, getBool(cell));
        break;
    }
  }

  function getBool(val) {
    var num = +val;
    return !isNaN(num) ? !!num : !!String(val).toLowerCase().replace(!!0, '');
  }

  instance.updateSettings({
    columns: columns
  });
  instance.validateCells(function() {
    instance.render();
  });
}


function bindDumpButton() {
  if (typeof Handsontable === "undefined") {
    return;
  }

  Handsontable.Dom.addEvent(document.body, 'click', function(e) {

    var element = e.target || e.srcElement;

    if (element.nodeName == "BUTTON" && element.name == 'dump') {
      var name = element.getAttribute('data-dump');
      var instance = element.getAttribute('data-instance');
      var hot = window[instance];
      console.log('data of ' + name, hot.getData());
    }
  });
}


function convArrOfArrToArrOfObj(hotData, minSpareRows, colHeaders) {
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
}


function buildParseSchema(columns, colHeaders) {
  var schemeObj = {};

  for (var i = 0; i < columns.length; i++) {
    var item = columns[i];
    schemeObj[colHeaders[i]] = {
      type: item.jsType
    };
  }
  return schemeObj;
}