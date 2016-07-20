var HOT;
var controlsNode = document.querySelector("#controls");
var tableNode = document.querySelector("#table");
var resultsNode = document.querySelector("#results");

var spinner = new Spinner({
  length: 40,
  width: 25,
  radius: 65,
  scale: 1.5,
  color: "#606060",
});

var papaConfig = {
  delimiter: "", // auto-detect
  newline: "", // auto-detect
  header: true,
  dynamicTyping: true,
  preview: 0,
  encoding: "",
  worker: false,
  comments: false,
  complete: function(r) {
    workJson(r.data);
  },
  error: undefined,
  download: false,
  skipEmptyLines: true,
  chunk: undefined,
  fastMode: undefined,
  beforeFirstChunk: undefined
};

var minSpareCols = 0;
var minSpareRows = 1;
var startRows = 20;
var startCols = 10;

var columns = [];

for (var i = 0; i < startCols; i++) {
  columns.push({
    type: 'text',
    jsType: "string"
  });
}

HOT = new Handsontable(tableNode, {
  startRows: startRows,
  startCols: startCols,
  minSpareCols: minSpareCols,
  minSpareRows: minSpareRows,
  manualColumnResize: true,
  columns: columns,
  rowHeaders: true,
  colHeaders: true,
  contextMenu: true,
  afterGetColHeader: afterGetColHeader
});


UI.button({
  parent: controlsNode,
  id: "set-first-row-headers",
  className: "",
  innerHTML: "Set first row as headers",
  style: {
    margin: "0px",
    marginRight: "15px",
    marginBottom: "5px"
  }
}, setHeadersFirstRow);


UI.fileReader({
  parent: controlsNode,
  id: "load",
}, loadFile); //todo: think how to start spinner. If do onchange, it changes deafult onchange


UI.button({
  parent: resultsNode,
  id: "save-data",
  className: "",
  innerHTML: "Save data"
}, function() {
  var hotData = HOT.getData();
  var colHeaders = HOT.getColHeader();
  var arr = HH.convArrArrToArrObj(hotData, minSpareRows, colHeaders, columns);
  saveDataMongo(arr);
});



/**
 * Functions
 */


function saveDataMongo(arr) {
  swal({
    // title: "Mongo URL",
    html: "Please enter mongo url<div id='swal-div'> </div>",
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

        var chunkSize = 100;
        var chunks = Math.ceil(arr.length / chunkSize);
        var currChunk = 0;

        (function workChunk() {
          var start = currChunk * chunkSize;
          var currArr = arr.slice(start, chunkSize * (currChunk + 1));

          var params = {
            db: document.querySelector("#db-path").value,
            collection: document.querySelector("#collection").value,
            data: JSON.stringify(currArr)
          };
          $.post("/mongo/insert", params, function(r) {
            if (r && r.result && r.result.ok && (r.result.ok == 1)) {

              currChunk++;
              if (currChunk < chunks) workChunk();
              else {
                swal("everything saved!");
              }
            }
          });
        })();
      });
    }
  });
}


function setHeadersFirstRow() {
  var colHeaders = [];
  var hotData = HOT.getData();
  var firstRow = hotData[0];
  var data = hotData.splice(1);
  var newColumns = [];
  var deleteCols = [];

  for (var i in firstRow) {
    var name = firstRow[i];
    if (name) {
      colHeaders.push(name);
      newColumns.push(columns[i]);

    } else deleteCols.push(i);
  }


  for (var j = 0; j < data.length; j++) {
    for (var c = 0; c < deleteCols.length; c++) {
      var delCol = deleteCols[c];
      data[j].splice(delCol, 1);
    }
  }

  HOT.updateSettings({
    'colWidths': undefined
  });

  HOT.updateSettings({
    'columns': newColumns,
    'colHeaders': colHeaders,
    'data': data,
  });

  var colWidths = [];

  for (var cw = 0; cw < colHeaders.length; cw++) {
    var width = HOT.getColWidth(cw);
    colWidths.push(width + 10);
  }

  HOT.updateSettings({
    'colWidths': colWidths
  });
}


function afterGetColHeader(col, TH) {
  // console.log(col, TH);
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
    types = Object.keys(HH.typesMap),
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

  columns[i].type = HH.typesMap[type];
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
      // console.log('data of ' + name, hot.getData());
    }
  });
}


function loadFile(str, file) {

  var fileType = file.name.split(".").pop();

  if (fileType == "zip") {
    var zipCont = convZipStr(str);
    fileType = zipCont.name.split(".").pop();
    str = zipCont.text;
  }

  if (fileType == "csv") {
    return Papa.parse(str, papaConfig);
  } else if (['xls', 'xlsx'].indexOf(fileType) != -1) {
    var workbook = XLSX.read(str, {
      type: 'binary'
    });
    var workbookJson = to_json(workbook);
    var sheetNames = Object.keys(workbookJson);

    if (sheetNames.length == 1) return workJson(workbookJson[sheetNames[0]]);
    else {

      var html = '<div id="worksheet-select"></div>';
      swal({
        title: "Choose Worksheet",
        html: html,
        showConfirmButton: false,
        onOpen: function() {
          var swalDivSel = "#worksheet-select";

          UI.select(sheetNames, {
            parent: document.querySelector(swalDivSel)
          }, function(sheet) {
            swal.closeModal();
            return workJson(workbookJson[sheet]);
          });
        }

      });
    }
  } else if (fileType == "json") {

    try {
      json = JSON.parse(str);
      workJson(json);
    } catch (e) {
      swal(JSON.stringify(e));
    }

  } else swal("file is not a json, csv, xls, xlsx or those zipped").then(function() {
    location.reload();
  });
}

function workJson(json) {

  if (json.results) json = json.results; //imports from hosted parse

  if (json.constructor == Object) {
    json = [json];
  }

  var currData = HOT.getData();

  var schema = HH.buildSchema(json);
  // columns = schema.columns;
  json = HH.stringifyArrObj(json);
  var arrArr = HH.convArrObjArrArr(json);

  HOT.updateSettings({
    // 'columns': columns,
    'colHeaders': schema.colHeaders,
    'data': arrArr,
  });

  var colWidths = [];

  for (var c = 0; c < schema.colHeaders.length; c++) {
    var width = HOT.getColWidth(c);
    colWidths.push(width + 10);
  }

  HOT.updateSettings({
    'colWidths': colWidths
  });
}

function convZipStr(buff) {
  var new_zip = new JSZip();
  new_zip.load(buff);
  var fileArr = Object.keys(new_zip.files);
  var str = new_zip.file(fileArr[0]).asText();
  var o = {
    text: str,
    name: fileArr[0]
  };
  return o;
}

function to_json(workbook) {
  var result = {};
  workbook.SheetNames.forEach(function(sheetName) {
    var roa = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName], {
      header: "A"
    });
    if (roa.length > 0) {
      result[sheetName] = roa;
    }
  });
  return result;
}