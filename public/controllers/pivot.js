document.addEventListener("DOMContentLoaded", function () {
  Query.load()
  var addFieldNote = document.querySelector("#addField")
  addFieldNote.parentNode.removeChild(addFieldNote)
})

var params = Query.getParams()
if(Query.getLimit()) params.limit = Query.getLimit()
if(Query.getProjection()) params.projection = JSON.stringify(Query.getProjection())
if(Query.getQuery()) params.query = JSON.stringify(Query.getQuery())

var data

countDataMongo(params)

function countDataMongo (params) {
  T.post('/mongo/count/', params).then(function (num) {
    if (num < 1000) {
      spinner.spin(document.body)
      getDataMongo(params)
    } else {
      Blocks.tooMuchRows(num, function (limit) {
        if(limit) params.limit = limit
        getDataMongo(params)
      })
    }
  })
}

function getDataMongo (params) {
  spinner.spin(document.body)

  T.post('/mongo/find/', params).then(function (arr) {
    data = arr

    printPivot(arr)
    spinner.stop()
  })
}

function printPivot (arr) {
  // var servProps = ['_id', 'updatedAt', '_updated_at', 'createdAt', '_created_at']

  arr = normalizeArrayOfObjects(arr)

  // var rows = []

  // for (var key in arr[0]) {
  //   if (servProps.indexOf(key) == -1) {
  //     rows.push(key)
  //   }

  //   if (rows.length == 3) break

  // }

  var renderers = $.extend(
    $.pivotUtilities.renderers,
    $.pivotUtilities.c3_renderers,
    $.pivotUtilities.d3_renderers,
    $.pivotUtilities.export_renderers)

  $('#output').pivotUI(arr, {
    renderers: renderers,
  // rows: rows,
  // cols: cols,
  // vals: ["value"],
  // rendererName: "Table",
  // rendererName: "Stacked Bar Chart",
  // aggregatorName: "Сумма целых",
  }, true, 'ru')
}

function normalizeArrayOfObjects (arr, params) {
  if ((!arr) && (typeof (arr[0]) != 'object')) {
    return
  }

  params = params || {}
  params.showColumns = params.showColumns || []
  params.hideColumns = params.hideColumns || []

  var columns = []
  var cell = ''
  var res = []

  for (var i = 0; i < arr.length; i++) { // собираем все ключи со всех объектов, а не только с первого
    for (var key in arr[i]) {
      var showCols = (params.showColumns.length > 0) ? (params.showColumns.indexOf(key) > -1) : true

      if ((columns.indexOf(key) == -1) && showCols && (params.hideColumns.indexOf(key) == -1)) columns.push(key)
    }
  }

  for (var n = 0; n < arr.length; n++) { // собираем данные полей, чистим
    var oneObj = arr[n]
    res[n] = {}
    for (var l = 0; l < columns.length; l++) {
      cell = oneObj[columns[l]]

      if (cell === null) cell = 'null'
      else if (cell === undefined) cell = 'undefined'
      else if (typeof cell == 'object') cell = JSON.stringify(cell)
      else if (typeof cell == 'boolean') cell = JSON.stringify(cell)

      res[n][columns[l]] = cell
    }
  }
  return res
}
