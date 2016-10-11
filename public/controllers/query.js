UI.button({innerHTML: 'Query', className: ''}, function () {
  showModal()
})

UI.appendModal({
  title: 'Create indexes',
  id: 'create-indexes'
})

var controlNode = document.querySelector('#ui')

var statusNode

var hhParams = {
  minSpareRows: 1,
  contextMenu: ['remove_row'],
  beforeRemoveRow: beforeRemoveRow,
  beforeChange: beforeChange
}

var data

/** 
 * Query
 */

function beforeRemoveRow (rowNum, numRows) {
  var end = rowNum + numRows
  var idArr = data.slice(rowNum, end).map(function(a) {
    return a._id
  })

  blockExit()

  T.iter(idArr, function (a, cb) {
    params.id = a

    $.post('/mongo/removebyid', params, function (r) {
      if (r && r.ok && (r.ok == 1)) {
        statusNode.innerHTML = params.id + ' deleted'
        cb()
      } else {
        releaseExit()
        swal({html: JSON.stringify(r), type: 'error'}).done()
        statusNode.innerHTML = JSON.stringify(r)
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

  var changesObj = groupChanges(changes, src)

  var rows = Object.keys(changesObj)
  if (!rows.length) return

  blockExit()

  T.iter(rows, function (a, cb) {
    var row = changesObj[a]
    var doc = data[a]

    if (doc && doc._id) {
      params.id = doc._id
      params.update = JSON.stringify(row)

      $.post('/mongo/updatebyid', params, function (r) {
        if (r && r.ok && (r.ok == 1)) {
          statusNode.innerHTML = params.id + ' updated'
          cb()
        } else {
          releaseExit()
          swal({html: JSON.stringify(r), type: 'error'}).done()
          statusNode.innerHTML = JSON.stringify(r)
        }
      })
    } else {
      params.data = JSON.stringify([row])

      $.post('/mongo/insert', params, function (r) {
        if (r && r.result && r.result.ok && (r.result.ok == 1)) {
          var newId = r.insertedIds[0]
          hhParams.instance.setDataAtRowProp(a, '_id', newId)
          statusNode.innerHTML = newId + ' added'
          cb()
        } else {
          releaseExit()
          swal({html: JSON.stringify(r), type: 'error'}).done()
          statusNode.innerHTML = JSON.stringify(r)
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

/**
 * query
 */

var isVisualQueryLoaded = false

var params = Controls.getCollectionFromUrl()

var dbCol = params.db + '_' + params.collection
var qPath = 'query' + '_' + dbCol
var pPath = 'projection' + '_' + dbCol
var lPath = 'limit' + '_' + dbCol
var sPath = 'schema' + '_' + dbCol

localStorage[qPath] = localStorage[qPath] || '{}'
localStorage[pPath] = localStorage[pPath] || '{}'
localStorage[lPath] = localStorage[lPath] || ''
localStorage[sPath] = localStorage[sPath] || '{}'

params.query = localStorage[qPath]
params.projection = localStorage[pPath]
params.limit = localStorage[lPath]

UI.appendModal({
  title: 'Query',
  id: 'query-modal'
})

UI.appendModal({
  title: 'Run function on each',
  id: 'update-each'
})

var tabs = ['JSON query', 'Visual query', 'Limit', 'Projection']

addTabs(tabs)
createDivs(tabs)

UI.div({
  parent: '#query-modal-body',
  id: 'status-div',
  attributes: {
    style: 'margin-left: 10px;'
  }
})

UI.span({
  id: 'status',
  parent: '#status-div',
  innerHTML: "Hint: hit 'count' to test query"
})

var queryBuilderDiv = 'visual-query-container'

UI.div({
  parent: 'div#visual-query-div',
  id: queryBuilderDiv
})

var jsonParams = {
  parent: document.querySelector('#json-query-div'),
  id: 'json-query-ace',
  code: localStorage[qPath],
  width: '100%',
  height: '240px',
  marginTop: '10px',
  onkeyup: function (r) {
    if (!r) {
      localStorage[qPath] = '{}'
      return
    }
    try {
      if (JSON.parse(r)) localStorage[qPath] = r
    } catch(e) {}
  }
}

var projParams = {
  parent: document.querySelector('#projection-div'),
  id: 'projection-ace',
  code: localStorage[pPath],
  width: '100%',
  height: '120px',
  marginTop: '10px',
  onkeyup: function (r) {
    if (!r) {
      localStorage[pPath] = '{}'
      return
    }
    try {
      if (JSON.parse(r)) localStorage[pPath] = r
    } catch(e) {}
  }
}

/**
 * Process data
 */

countDataMongo(params)

function countDataMongo (params) {
  $.post('/mongo/count', params, function (num) {
    if (num < 1000) {
      spinner.spin(document.body)
      getDataMongo(params)
    }else {
      Swals.tooMuchRows(controlNode, params, num)
    }
  })
}

function getDataMongo (params) {
  $.post('/mongo/find', params, function (arr) {
    spinner.stop()

    data = HH.stringifyArrObj(arr)

    HH.draw(data, hhParams)

    Controls.resetQuery(controlNode, params)

    Controls.manageIndexes(controlNode, params)

    Controls.otherActions(controlNode, params, hhParams.columns, hhParams.instance, params.collection)

    UI.span({
      innerHTML: (arr.length - 1) + ' rows found',
      id: 'status-span',
      parent: controlNode,
      style: {
        color: '#808080',
        fontSize: '90%'
      }
    })

    statusNode = document.querySelector('#status-span')

    updateStatusDelayed('Autosaving changes', 5000)
  })
}


/**
 * Query Functions
 */

function showModal () {
  buildModal()

  $('#query-modal').modal('show')
}

function buildModal () {
  Controls.ace(jsonParams)
  Controls.ace(projParams)

  UI.input({
    type: 'number',
    id: 'limit-input',
    parent: 'div#limit-div',
    placeholder: 'limit',
    className: 'form-control input-lg',
    value: localStorage[lPath],
    style: {
      width: '150px',
      marginTop: '15px',
      marginLeft: '10px'
    }
  })

  document.querySelector('#limit-input').onkeyup = function () {
    localStorage[lPath] = document.querySelector('#limit-input').value
  }

  UI.button({innerHTML: 'Load matching', parent: '#query-modal-footer', className: 'btn btn-primary'}, function () {
    if (!checkValidJson()) return
    checkSaveQB()
    location.reload()
  })

  UI.button({innerHTML: 'Count', parent: '#query-modal-footer'}, function () {
    checkSaveQB()
    if (!checkValidJson()) return
    params.query = localStorage[qPath]
    $.post('/mongo/count', params, function (num) {
      log('Found ' + num + ' document(s)')
    })
  })

  UI.button({innerHTML: 'Reset', parent: '#query-modal-footer'}, function () {
    localStorage[qPath] = ''
    location.reload()
  })

  UI.button({innerHTML: 'Delete', parent: '#query-modal-footer', className: 'btn btn-danger'}, function () {
    swal({
      type: 'warning',
      html: "Are you sure? Delete operation can't be reverted.",
      showCancelButton: true,
      confirmButtonText: 'Yes, do it'
    }).then(function () {
      params.query = localStorage[qPath]

      $.post('/mongo/remove', params, function (r) {
        if (r && r.ok && (r.ok == 1)) {
          location.reload()
        } else statusNode.innerHTML = JSON.stringify(r)
      })
    }).catch(function () {})
  })

  UI.button({innerHTML: 'Cancel', parent: '#query-modal-footer'}, function () {
    $('#query-modal').modal('hide')
  })
}

function updateSchema () {
  spinner.spin(document.body)
  T.post('/mongo/schema', params).then(function (schema) {
    spinner.stop()

    if (!schema || !Object.keys(schema).length) return swal({title: 'Empty collection', type: 'warning'}).done()

    var filters = convSchema2Fields(schema)

    localStorage[sPath] = JSON.stringify(filters, null, 2)
    $('div#' + queryBuilderDiv).queryBuilder('setFilters', true, filters)
  })
}

function getKeys (cb) {
  if (localStorage[sPath] && (localStorage[sPath] != '{}')) {
    cb(JSON.parse(localStorage[sPath]))
  } else {
    spinner.spin(document.body)

    T.post('/mongo/schema', params).then(function (schema) {
      spinner.stop()

      if (!schema || !Object.keys(schema).length) return cb([])

      var filters = convSchema2Fields(schema)

      localStorage[sPath] = JSON.stringify(filters, null, 2)
      cb(filters)
    })
  }
}

function convSchema2Fields (schema) {
  var fields = []

  for (var prop in schema) {
    var val = schema[prop]
    var o = {
      id: prop
    }
    var bqType = convType(val)
    if (bqType) o.type = bqType
    fields.push(o)
  }

  fields.sort(function (a, b) {
    if (a.id > b.id) return 1
    return - 1
  })

  return fields

  function convType (type) {
    switch (type) {
      case 'string':
        return 'string'

      case 'number':
        return 'double'

      case 'boolean':
        return 'boolean'
    }
  }
}

function checkSaveQB () {
  if (document.querySelector('#visual-query-li').className === 'active') {
    var qb = JSON.stringify($('div#' + queryBuilderDiv).queryBuilder('getMongo'), null, 2)
    localStorage[qPath] = qb
  }
}

function createDivs (tabs) {
  for (var i = 0; i < tabs.length; i++) {
    var item = tabs[i]
    var divParams = {
      id: Translit(item) + '-div',
      parent: '#query-modal-body'
    }
    if (i === 0) divParams.className = 'tab-active'
    if (i !== 0) divParams.attributes = {hidden: true}

    UI.div(divParams)
  }
}

function addTabs (tabs) {
  var ul = document.createElement('ul')
  ul.className = 'nav nav-tabs'
  ul.role = 'tablist'
  ul.style.textAlign = 'center'
  document.querySelector('#query-modal-body').appendChild(ul)

  tabs.forEach(function (item, i) {
    var li = document.createElement('li')
    li.id = Translit(item) + '-li'
    if (li.id === 'schema-li') li.style.display = 'none'
    if (i === 0) li.className = 'active'
    ul.appendChild(li)

    var a = document.createElement('a')
    a.href = '#'
    a.id = Translit(item)
    a.innerHTML = item
    li.appendChild(a)
    a.onclick = function () {
      onTabClick(this)
    }
  })
}

function onTabClick (thisNode) {
  log('')

  if (document.querySelector('li.active').id === 'json-query-li') {
    if (!checkValidJson()) return
  }

  if (thisNode.id === 'json-query') {
    if (document.querySelector('li.active').id === 'visual-query-li') {
      var qb = JSON.stringify($('div#' + queryBuilderDiv).queryBuilder('getMongo'), null, 2)
      localStorage[qPath] = qb
      jsonParams.instance.setValue(qb)
      switchTabs(thisNode)
    } else switchTabs(thisNode)
  } else if (thisNode.id === 'visual-query') {
    getKeys(function (filters) {
      if (!isVisualQueryLoaded) {
        updateSchemaHint()
        try {
          $('div#' + queryBuilderDiv).queryBuilder({
            filters: filters
          })
          isVisualQueryLoaded = true
          setVisualQuery(function () {
            switchTabs(thisNode)
          })
        } catch(e) {
          swal({title: "Can't start query builder", type: 'warning', html: JSON.stringify(e, null, 2)}).done()
        }
      } else {
        setVisualQuery(function () {
          switchTabs(thisNode)
        })
      }
    })
  } else {
    switchTabs(thisNode)
  }
}

function checkValidJson () {
  var code = jsonParams.instance.getValue()
  try {
    JSON.parse(code)
    return true
  } catch(e) {
    swal({title: 'JSON is not valid', type: 'warning', html: JSON.stringify(e, null, 2)}).done()
  }
}

function setVisualQuery (cb) {
  if (document.querySelector('li.active').id === 'json-query-li') {
    if (localStorage[qPath] !== '{}') {
      var json
      try {
        json = JSON.parse(localStorage[qPath])
      } catch(e) {}

      if (json) {
        if (!json.$and && !json.$or) {
          json = {
            $and: [json]
          }
        }

        try {
          $('div#' + queryBuilderDiv).queryBuilder('setRulesFromMongo', json)
          return cb()
        } catch(e) {
          swal({title: "Can't set visual query", type: 'warning', html: JSON.stringify(e, null, 2)}).done()
        }
      }
    }
  }
  cb()
}

function switchTabs (thisNode) {
  document.querySelector('li.active').className = ''
  thisNode.parentNode.className = 'active'
  var id = thisNode.id

  var activeDiv = document.querySelector('div.tab-active')
  activeDiv.className = ''
  activeDiv.hidden = true

  var currDiv = document.querySelector('div#' + id + '-div')
  currDiv.className = 'tab-active'
  currDiv.hidden = false
}

function log (text) {
  var statusNode = document.querySelector('#status')
  statusNode.innerHTML = text
}

function updateSchemaHint () {
  log('Hint: if schema in cache is outdated, you can ')
  UI.link({
    href: '#',
    attributes: {
      onclick: 'updateSchema()'
    },
    parent: document.querySelector('#status'),
    innerHTML: 'update it'
  })
}

/** 
 * Page functions
 */

function updateStatusDelayed (text, delay) {
  if (!text) return
  delay = delay || 3000

  setTimeout(function () {
    statusNode.innerHTML = text
  }, delay)
}

function groupChanges (changes, src) {
  var rowGroups = {}

  if (['external', 'loadData'].indexOf(src) != -1) return rowGroups
  if (!changes || !changes.length) return rowGroups

  for (var i = 0; i < changes.length; i++) {
    var change = changes[i]
    if (!change) continue

    if (change[3] === change[2]) continue

    if (!rowGroups[Number(change[0])]) {
      rowGroups[Number(change[0])] = {}
    }

    rowGroups[Number(change[0])][change[1]] = change[3]
  }
  return rowGroups
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
