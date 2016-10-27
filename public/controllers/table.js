var HotConfig = {
  minSpareRows: 1,
  contextMenu: ['remove_row'],
  manualColumnMove: true,
  manualColumnResize: true,
  beforeRemoveRow: beforeRemoveRow,
  beforeChange: beforeChange,
  rowHeaders: true,
  autoColSize: true,
}

document.addEventListener("DOMContentLoaded", function () {
  Query.load()
})

var params = Query.getParams()
if(Query.getLimit()) params.limit = Query.getLimit()
if(Query.getProjection()) params.projection = JSON.stringify(Query.getProjection())
if(Query.getQuery()) params.query = JSON.stringify(Query.getQuery())

/** 
 * Functions
 */

countDataMongo(params)

function countDataMongo (params) {
  T.post('/mongo/count/', params).then(function (num) {

    if(!num && (JSON.stringify(Query.getLimit()) === '{}')) {
      var o = Router.getDb()
      location.pathname = '/' + o.title + '/' + o.urlDbName + '/'
    } else if (num === 0 ) {
      swal({title: "0 documents found", type: "info"}).done()
    } else if (num < 1000) {
      spinner.spin(document.body)
      getDataMongo(params)
    } else {
      Blocks.tooMuchRows(num, function (limit) {        
        params.limit = limit
        Query.setLimit(limit)
        getDataMongo(params)
      })
    }
  })
}

function getDataMongo (params) {
  spinner.spin(document.body)

  T.post('/mongo/find/', params).then(function (arr) {
    spinner.stop()

    HotConfig.columns = HH.getColumns(arr)
    var data = HH.stringifyArrObj(arr)

    HH.draw(data, HotConfig)

    if(Query.getLimit()) {
      updateStatusDelayed((arr.length - 1) + ' loaded due to limit', 0)
    } else updateStatusDelayed((arr.length - 1) + ' rows found', 0)
    updateStatusDelayed('Autosaving changes', 5000)
  })
}

function beforeRemoveRow (rowNum, numRows) {
  var end = rowNum + numRows

  var currData = HotConfig.instance.getData()
  var idCol = HotConfig.instance.getColHeader().indexOf('_id')

  var idArr = currData.slice(rowNum, end).map(function(a) {
    return a[idCol]
  })

  blockExit()

  T.iter(idArr, function (a, cb) {
    params.id = a

    T.post('/mongo/removebyid/', params).then(function (r) {
      if (r && r.ok && (r.ok == 1)) {
        updateStatusDelayed(params.id + ' deleted', 0)
        cb()
      } else {
        releaseExit()
        swal({html: JSON.stringify(r), type: 'error'}).done()
      }
    })
  }, {
    concurrency: 20,
    cb: function () {
      releaseExit()
      updateStatusDelayed('Everything deleted', 300)
      updateStatusDelayed('Autosaving changes', 3300)
    }
  })
}

function beforeChange (changes, src) {
  changes = changes.filter(function (a) {
    if (a[1] !== '_id') return a
  })
  if (!changes.length) return

  var changesObj = HH.groupChanges(changes, src, HotConfig.columns)
  if (!changesObj) return

  var rows = Object.keys(changesObj)
  if (!rows.length) return

  blockExit()

  T.iter(rows, function (a, cb) {
    var row = changesObj[a]

    var idCol = HotConfig.instance.getColHeader().indexOf('_id')
    var doc = HotConfig.instance.getDataAtRow(a)

    if (doc && doc[idCol]) {
      params.id = doc[idCol]
      params.update = JSON.stringify(row)

      T.post('/mongo/updatebyid/', params).then(function (r) {
        if (r && r.ok && (r.nModified === 1)) {
          updateStatusDelayed(params.id + ' updated', 0)
          cb()
        } else {
          releaseExit()
          swal({html: JSON.stringify(r), type: 'error'}).done()
        }
      })
    } else {
      params.data = JSON.stringify([row])

      T.post('/mongo/insert/', params).then(function (r) {
        if (r && r.result && r.result.ok && (r.result.ok == 1)) {
          var newId = r.insertedIds[0]
          HotConfig.instance.setDataAtRowProp(a, '_id', newId)
          updateStatusDelayed(newId + ' added', 0)
          cb()
        } else {
          releaseExit()
          swal({html: JSON.stringify(r), type: 'error'}).done()
        }
      })
    }
  }, {
    concurrency: 20,
    cb: function () {
      releaseExit()
      updateStatusDelayed('Everything saved', 300)
      updateStatusDelayed('Autosaving changes', 3300)
    }
  })
}

function updateStatusDelayed (text, delay) {
  var statusNode = document.querySelector('#status-span')

  if (!text) return
  if(delay === undefined) delay = 3000

  setTimeout(function () {
    statusNode.innerHTML = text
  }, delay)
}

function blockExit () {
  spinner.spin(document.body)
  if (!window.onbeforeunload) window.onbeforeunload = function () {
      return 'Saving changes in process. If you exit now you would lose your changes.'
  }
}

function releaseExit () {
  spinner.stop()
  window.onbeforeunload = null
}
