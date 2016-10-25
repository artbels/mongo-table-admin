;(function () {
  var Query = this.Query = {}

  Query.getParams = function () {
    var o = Router.getDb()
    var params = {
      db: o.connStr + '/' + o.urlDbName || o.connPathDbName
    }
    if (o.collection)  params.collection = o.collection
    return JSON.parse(JSON.stringify(params))
  }

  function pth() {
    var o = Router.getDb()
    return o.title + '/' + o.urlDbName + '/' + o.collection + '/'
  }

  Query.setQuery = function (query) {
    if (typeof query === 'object') query = JSON.stringify(query, null, 2)
    localStorage[pth() + 'query'] = query
  }

  Query.setProjection = function (projection) {
    if (typeof projection === 'object') projection = JSON.stringify(projection, null, 2)
    localStorage[pth() + 'projection'] = projection
  }

  Query.setLimit = function (limit) {
    localStorage[pth() + 'limit'] = limit
  }

  Query.setSchema = function (schema) {
    if (typeof schema === 'object') schema = JSON.stringify(schema, null, 2)
    localStorage[pth() + 'schema'] = schema
  }

  Query.getQuery = function () {
    return JSON.parse(localStorage[pth() + 'query'] || '{}')
  }

  Query.getProjection = function () {
    return JSON.parse(localStorage[pth() + 'projection'] || '{}')
  }

  Query.getLimit = function () {
    return parseInt(localStorage[pth() + 'limit'] || '')
  }

  Query.getSchema = function (cb) {
    cb = cb || function () {}
    cb(JSON.parse(localStorage[pth() + 'schema'] || '{}'))
    return JSON.parse(localStorage[pth() + 'schema'] || '{}')
  }

  Query.reset = function () {
    Query.setQuery({})
    location.reload()
  }

  Query.show = function (tab) {
    $('#query-modal').modal('show')
    document.querySelector("#" + tab).click()
  }

  var isVisualQueryLoaded = false
  var tabs = ['JSON query', 'Visual query', 'Limit', 'Projection']

  var jsonParams, projParams
  var queryBuilderDiv = 'visual-query-container'

  Query.load = function () {
    UI.appendModal({
      title: 'Query',
      id: 'query-modal'
    })

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

    UI.div({
      parent: 'div#visual-query-div',
      id: queryBuilderDiv
    })

    jsonParams = {
      parent: document.querySelector('#json-query-div'),
      id: 'json-query-ace',
      code: JSON.stringify(Query.getQuery()),
      width: '100%',
      height: '240px',
      marginTop: '10px',
      onkeyup: function (r) {
        if (!r) return Query.setQuery({})

        try {
          if (JSON.parse(r)) Query.setQuery(r)
        } catch(e) {}
      }
    }

    projParams = {
      parent: document.querySelector('#projection-div'),
      id: 'projection-ace',
      code: JSON.stringify(Query.getProjection()),
      width: '100%',
      height: '120px',
      marginTop: '10px',
      onkeyup: function (r) {
        console.log(r)
        if (!r) return Query.setProjection({})

        try {
          if (JSON.parse(r)) Query.setProjection(r)
        } catch(e) {}
      }
    }

    T.post('/mongo/schema/', Query.getParams()).then(function (schema) {
      spinner.stop()

      var filters = convSchema2Fields(schema)

      buildModal(filters)
    })
  }

  /**
   * Query Functions
   */

  function buildModal () {
    Blocks.ace(jsonParams)
    Blocks.ace(projParams)

    UI.input({
      type: 'number',
      id: 'limit-input',
      parent: 'div#limit-div',
      placeholder: 'set limit',
      className: 'form-control input-lg',
      value: Query.getLimit(),
      style: {
        width: '150px',
        marginTop: '15px',
        marginLeft: '10px'
      }
    })

    document.querySelector('#limit-input').onkeyup = function () {
      Query.setLimit(document.querySelector('#limit-input').value)
    }

    UI.button({innerHTML: 'Load matching', parent: '#query-modal-footer', className: 'btn btn-primary'}, function () {
      if (!checkValidJson()) return
      checkSaveQB()
      location.reload()
    })

    UI.button({innerHTML: 'Count', parent: '#query-modal-footer'}, function () {
      checkSaveQB()
      if (!checkValidJson()) return

      var params = Query.getParams()

      params.query = JSON.stringify(Query.getQuery())
      T.post('/mongo/count/', params).then(function (num) {
        log('Found ' + num + ' document(s)')
      })
    })

    UI.button({innerHTML: 'Reset', parent: '#query-modal-footer'}, function () {
      Query.reset()
    })

    UI.button({innerHTML: 'Delete', parent: '#query-modal-footer', className: 'btn btn-danger'}, function () {
      swal({
        type: 'warning',
        html: "Are you sure? Delete operation can't be reverted.",
        showCancelButton: true,
        confirmButtonText: 'Yes, do it'
      }).then(function () {
        params.query = JSON.stringify(Query.getQuery())

        $.post('/mongo/remove/', params, function (r) {
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

  Query.updateSchema = function  () {
    spinner.spin(document.body)
    T.post('/mongo/schema/', params).then(function (schema) {
      spinner.stop()

      if (!schema || !Object.keys(schema).length) return swal({title: 'Empty collection', type: 'warning'}).done()

      var filters = convSchema2Fields(schema)

      Query.setSchema(filters)
      if(isVisualQueryLoaded) {
        $('div#' + queryBuilderDiv).queryBuilder('setFilters', true, filters)
      }
    })
  }

  function getKeys (cb) {
    if (Query.getSchema() && (JSON.stringify(Query.getSchema()) != '{}')) {
      cb(Query.getSchema())
    } else {
      spinner.spin(document.body)

      T.post('/mongo/schema/', params).then(function (schema) {
        spinner.stop()

        if (!schema || !Object.keys(schema).length) return cb([])

        var filters = convSchema2Fields(schema)

        Query.setSchema(filters)
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
      Query.setQuery($('div#' + queryBuilderDiv).queryBuilder('getMongo'))
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
        var qb = $('div#' + queryBuilderDiv).queryBuilder('getMongo')
        Query.setQuery(qb)
        jsonParams.instance.setValue(JSON.stringify(qb, null, 2))
        switchTabs(thisNode)
      } else switchTabs(thisNode)
    } else if (thisNode.id === 'visual-query') {
      getKeys(function (filters) {
        console.log(filters)
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
            console.log(e)
            swal({title: "Can't start query builder", type: 'warning', html: e.toString()}).done()
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
      swal({title: 'JSON is not valid', type: 'warning', html: e.toString()}).done()
    }
  }

  function setVisualQuery (cb) {
    if (document.querySelector('li.active').id === 'json-query-li') {
      if (JSON.stringify(Query.getQuery()) !== '{}') {
        var json
        try {
          json = Query.getQuery()
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
        onclick: 'Query.updateSchema()'
      },
      parent: document.querySelector('#status'),
      innerHTML: 'update it'
    })
  }
})()
