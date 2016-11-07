var controlsNode = document.querySelector('#controls'),
  tableNode = document.querySelector('#table'),
  resultsNode = document.querySelector('#results')

var papaConfig = {
  delimiter: '', // auto-detect
  newline: '', // auto-detect
  header: true,
  dynamicTyping: true,
  preview: 0,
  encoding: '',
  worker: false,
  comments: false,
  complete: function (r) {
    workJson(r.data)
  },
  error: undefined,
  download: false,
  skipEmptyLines: true,
  chunk: undefined,
  fastMode: undefined,
  beforeFirstChunk: undefined
}

var hot,
  columns = [],
  colHeaders = [],
  minSpareCols = 0,
  minSpareRows = 1,
  startRows = 20,
  startCols = 20

for (var i = 0; i < startCols; i++) {
  columns.push({
    type: 'text',
    jsType: 'string'
  })
  colHeaders.push(i + 1)
}

hot = new Handsontable(tableNode, {
  startRows: startRows,
  startCols: startCols,
  minSpareCols: minSpareCols,
  minSpareRows: minSpareRows,
  manualColumnResize: true,
  columns: columns,
  colHeaders: colHeaders,
  rowHeaders: true,
  contextMenu: true,
  afterGetColHeader: afterGetColHeader
})

UI.button({
  parent: controlsNode,
  id: 'set-first-row-headers',
  className: '',
  innerHTML: 'Set first row as headers',
  style: {
    margin: '0px',
    marginRight: '15px',
    marginBottom: '5px'
  }
}, setHeadersFirstRow)

UI.fileReader({
  parent: controlsNode,
  id: 'load'
}, loadFile); // todo: think how to start spinner. If do onchange, it changes default onchange

UI.button({
  parent: resultsNode,
  id: 'save-data',
  className: '',
  innerHTML: 'Save data'
}, function () {
  var hotData = hot.getData()
  var colHeaders = hot.getColHeader()
  var arr = HH.convArrArrToArrObj(hotData, columns, minSpareRows, colHeaders)
  Blocks.saveDataMongo(arr)
})

/**
 * Functions
 */

function setHeadersFirstRow () {
  var colHeaders = []
  var hotData = hot.getData()
  var firstRow = hotData[0]
  var data = hotData.splice(1)
  var newColumns = []
  var deleteCols = []
  var colWidths = []
  console.log(data)

  for (var i in firstRow) {
    var name = firstRow[i]
    if (name) {
      colHeaders.push(name)
      newColumns.push(columns[i])
    } else deleteCols.push(i)
  }

  for (var j = 0; j < data.length; j++) {
    for (var c = deleteCols.length - 1; c >= 0; c--) {
      var delCol = deleteCols[c]
      data[j].splice(delCol, 1)
    }
  }

  hot.updateSettings({
    'colWidths': undefined
  })

  hot.updateSettings({
    'columns': newColumns,
    'colHeaders': colHeaders,
    'data': data
  })

  columns = newColumns

  for (var cw = 0; cw < colHeaders.length; cw++) {
    var width = hot.getColWidth(cw)
    colWidths.push(width + 30)
  }

  hot.updateSettings({
    'colWidths': colWidths
  })
}

function afterGetColHeader (col, TH) {
  // console.log(col, TH)
  if (col == -1) return

  var instance = this,
    menu = buildMenu(columns[col].type),
    button = buildButton()

  addButtonMenuEvent(button, menu)

  Handsontable.Dom.addEvent(menu, 'click', function (event) {
    if (event.target.nodeName == 'LI') {
      setColumnType(col, event.target.data.colType, instance)
    }
  })
  if (TH.firstChild.lastChild.nodeName === 'BUTTON') {
    TH.firstChild.removeChild(TH.firstChild.lastChild)
  }
  TH.firstChild.appendChild(button)
  TH.style['white-space'] = 'normal'
}

function addButtonMenuEvent (button, menu) {
  Handsontable.Dom.addEvent(button, 'click', function (event) {
    var changeTypeMenu, position, removeMenu

    document.body.appendChild(menu)

    event.preventDefault()
    event.stopImmediatePropagation()

    changeTypeMenu = document.querySelectorAll('.changeTypeMenu')

    for (var i = 0, len = changeTypeMenu.length; i < len; i++) {
      changeTypeMenu[i].style.display = 'none'
    }
    menu.style.display = 'block'
    position = button.getBoundingClientRect()

    menu.style.top = (position.top + (window.scrollY || window.pageYOffset)) + 2 + 'px'
    menu.style.left = (position.left) + 'px'

    removeMenu = function (event) {
      if (event.target.nodeName == 'LI' && event.target.parentNode.className.indexOf('changeTypeMenu') !== -1) {
        if (menu.parentNode) {
          menu.parentNode.removeChild(menu)
        }
      }
    }
    Handsontable.Dom.removeEvent(document, 'click', removeMenu)
    Handsontable.Dom.addEvent(document, 'click', removeMenu)
  })
}

function buildMenu (activeCellType) {
  var menu = document.createElement('UL'),
    types = Object.keys(HH.typesMap),
    item

  menu.className = 'changeTypeMenu'

  for (var i = 0, len = types.length; i < len; i++) {
    item = document.createElement('LI')
    if ('innerText' in item) {
      item.innerText = types[i]
    } else {
      item.textContent = types[i]
    }

    item.data = {
      'colType': types[i]
    }

    if (activeCellType == types[i]) {
      item.className = 'active'
    }
    menu.appendChild(item)
  }

  return menu
}

function buildButton () {
  var button = document.createElement('BUTTON')

  button.innerHTML = '\u25BC'
  button.className = 'changeType'

  return button
}

function setColumnType (i, type, instance) {
  // var colHeaders = hot.getColHeader()

  columns[i].type = HH.typesMap[type]
  columns[i].jsType = type
  // columns[i].data = colHeaders[i]
  if (type == 'date') columns[i].dateFormat = 'DD-MMM-YYYY'
  if (type == 'number') columns[i].format = '0.[0000000000]'

  var hotData = hot.getData()

  spinner.spin(document.body)

  T.iter(hotData, function (jtem, cb, p) {
    var cell = jtem[i]
    if ((cell === null) || (cell === '')) return cb()

    switch (type) {
      case 'number':
        var formattedNumeral = Number(cell)
        hot.setDataAtCell(p.index, i, formattedNumeral)
        break

      case 'date':
        var formattedDate = moment(new Date(cell)).format('DD-MMM-YYYY')
        hot.setDataAtCell(p.index, i, formattedDate)
        break

      case 'boolean':
        hot.setDataAtCell(p.index, i, getBool(cell))
        break
    }
    cb()
  }, {
    concurrency: 100,
    cb: function () {
      spinner.stop()
    }
  })

  function getBool (val) {
    var num = +val
    return !isNaN(num) ? !!num : !!String(val).toLowerCase().replace(!!0, '')
  }

  instance.updateSettings({
    columns: columns
  })
  instance.validateCells(function () {
    instance.render()
  })
}

function loadFile (str, file) {
  var fileType = file.name.split('.').pop()

  if (fileType == 'zip') {
    var zipCont = convZipStr(str)
    fileType = zipCont.name.split('.').pop()
    str = zipCont.text
  }

  if (fileType == 'csv') {
    return Papa.parse(str, papaConfig)
  } else if (['xls', 'xlsx'].indexOf(fileType) != -1) {
    var workbook = XLSX.read(str, {
      type: 'binary'
    })
    var workbookJson = conv2Json(workbook)
    var sheetNames = Object.keys(workbookJson)

    if (sheetNames.length == 1) return workJson(workbookJson[sheetNames[0]])
    else {
      var html = '<div id="worksheet-select"></div>'
      swal({
        title: 'Choose Worksheet',
        html: html,
        showConfirmButton: false,
        onOpen: function () {
          var swalDivSel = '#worksheet-select'

          UI.select(sheetNames, {
            parent: document.querySelector(swalDivSel)
          }, function (sheet) {
            swal.closeModal()
            return workJson(workbookJson[sheet])
          })
        }

      }).catch(function () {})
    }
  } else if (fileType == 'json') {
    try {
      json = JSON.parse(str)
      workJson(json)
    } catch (e) {
      console.log(e)
      swal(e.toString())
    }
  } else swal('file is not a json, csv, xls, xlsx or those zipped').then(function () {
      location.reload()
    })
}

function workJson (json) {
  if (json.results) json = json.results // imports from hosted parse

  if (json.constructor == Object) {
    json = [json]
  }

  var schema = buildSchema(json)
  // console.log(schema)
  json = HH.stringifyArrObj(json)
  var arrArr = HH.convArrObjArrArr(json)

  // console.log(arrArr)

  // hot.updateSettings({
  //   'columns': schema.columns,
  // })

  hot.updateSettings({
    'colHeaders': schema.colHeaders,
    'data': arrArr
  })
}

function buildSchema (arr) {
  var props = {}

  var o = {
    columns: [],
    colHeaders: []
  }

  for (var i = 0; i < arr.length; i++) {
    var row = arr[i]
    for (var key in row) {
      var val = row[key]
      var jsType = typeof val
      if (jsType == 'string') {
        if (HH.reJsStrData.test(val)) jsType = 'date'
      }
      if (!props[key]) props[key] = jsType
    }
  }

  for (var prop in props) {
    var col = HH.setColType(prop, props[prop])
    o.columns.push(col)
    o.colHeaders.push(prop)
  }
  return o
}

function convZipStr (buff) {
  var new_zip = new JSZip()
  new_zip.load(buff)
  var fileArr = Object.keys(new_zip.files)
  var str = new_zip.file(fileArr[0]).asText()
  var o = {
    text: str,
    name: fileArr[0]
  }
  return o
}

function conv2Json (workbook) {
  var result = {}
  workbook.SheetNames.forEach(function (sheetName) {
    var roa = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName], {
      header: 'A'
    })
    if (roa.length > 0) {
      result[sheetName] = roa
    }
  })
  return result
}
