;(function () {
  var func = {}

  document.addEventListener('DOMContentLoaded', function () {
    UI.appendModal({
      title: 'Create indexes',
      id: 'create-indexes'
    })

    UI.appendModal({
      title: 'Run function on each',
      id: 'update-each'
    })
  })

  this.Menu = function (e) {
    if (!func[e.id]) throw Error('function ' + e.id + ' is not defined')
    func[e.id]()
  }

  func.chooseCollection = function () {
    Router.collections()
  }

  func.chooseDatabase = function () {
    Router.databases()
  }

  func.setJsonQuery = function () {
    Query.show('json-query')
  }

  func.setQuery = func.setJsonQuery

  func.setVisualQuery = function () {
    Query.show('visual-query')
  }

  func.setProjection = function () {
    Query.show('projection')
  }

  func.setLimit = function () {
    Query.show('limit')
  }

  func.resetQuery = function () {
    Query.reset()
  }

  func.browseSchema = function () {
    var params = Query.getParams()

    T.post('/mongo/schema/', params).then(function (obj) {
      var tableArr = []

      for (var prop in obj) {
        var val = obj[prop]
        tableArr.push({value: prop, count: val})
      }

      swal({
        title: 'Collection schema:',
        html: "<div id='swal-div' align='center'></div>",
        onOpen: function () {
          UI.table(tableArr, {
            hideHead: true,
            parent: document.querySelector('#swal-div')
          })
        }
      }).done()
    })
  }

  func.refreshSchema = function () {
    Query.updateSchema()
    func.browseSchema()
  }

  func.getSchema = func.browseSchema

  func.addField = function () {
    swal({
      title: 'Add column',
      html: "<div id='swal-div' align='center'></div>",
      showCancelButton: true,
      onOpen: function () {
        var swalNode = document.querySelector('#swal-div')

        UI.input({
          placeholder: 'Field name',
          id: 'field-name',
          className: '',
          parent: swalNode,
          value: '',
          style: {
            width: '180px',
            textAlign: 'center'
          }
        })

        document.querySelector('#field-name').onkeyup = checkFieldExist
        document.querySelector('#field-name').onchange = checkFieldExist

        function checkFieldExist () {
          var fieldName = document.querySelector('#field-name').value
          if (HotConfig.instance.getColHeader().indexOf(fieldName) != -1) {
            swal.showValidationError(fieldName + ' is already exists')
            swal.disableButtons()
          } else {
            swal.resetValidationError()
            swal.enableButtons()
          }
        }

        UI.br({
          id: 'add-column-span',
          parent: swalNode
        })

        UI.select(Object.keys(HH.typesMap), {
          placeholder: 'Field type',
          id: 'field-type',
          parent: swalNode
        }, function () {})

        document.querySelector('#field-typeSelect').value = 'string'
      }
    }).then(function () {
      var propNode = document.querySelector('#field-name')
      var jsTypeNode = document.querySelector('#field-typeSelect')

      if (!propNode || !propNode.value) {
        return swal({
          type: 'warning',
          title: 'no field name'
        })
      }

      if (HotConfig.colHeaders.indexOf(propNode.value) != -1) {
        return swal({
          type: 'warning',
          title: propNode.value + ' already exists'
        })
      }

      var col = HH.setColType(propNode.value, jsTypeNode.value || 'string')

      HotConfig.columns.push(col)
      HotConfig.colHeaders.push(col.data)

      HotConfig.instance.updateSettings({
        colHeaders: HotConfig.colHeaders,
        columns: HotConfig.columns
      })
    }).catch(function () {})
  }

  func.renameField = function () {
    var o = Router.getDb()
    var params = Query.getParams()

    var noIdColHeaders = []

    if (o.view === 'table') {
      noIdColHeaders = HotConfig.instance.getColHeader().filter(function (r) {
        if (r != '_id') return r
      })
    } else {
      var props = {}
      for (var i = 0; i < data.length; i++) {
        var row = data[i]
        for (var key in row) {
          props[key] = true
        }
      }
      noIdColHeaders = Object.keys(props)
    }

    swal({
      title: 'Rename field',
      html: "<div id='swal-div' align='center'></div>",
      showCancelButton: true,
      onOpen: function () {
        var swalNode = document.querySelector('#swal-div')

        UI.select(noIdColHeaders, {
          id: 'field-to-rename',
          parent: swalNode
        }, function () {})

        UI.br({
          id: 'field-to-rename-br',
          parent: swalNode
        })

        UI.input({
          placeholder: 'New name',
          id: 'new-name',
          value: '',
          className: '',
          parent: swalNode,
          style: {
            width: '180px',
            textAlign: 'center'
          }
        })
      }
    }).then(function () {
      params.old = document.querySelector('#field-to-renameSelect').value
      params.new = document.querySelector('#new-name').value

      if (!params.old || !params.new) {
        return swal({
          type: 'warning',
          title: 'no new or old'
        })
      }

      T.post('/mongo/rename/', params).then(function (r) {
        if (r && r.ok && (r.ok == 1)) {
          location.reload()
        } else alert(JSON.stringify(r))
      })
    }).catch(function () {})
  }

  func.deleteField = function () {
    var params = Query.getParams()

    var noIdColHeaders = []

    Query.getSchema().forEach(function (a) {
      if (a.id !== '_id') {
        noIdColHeaders.push({field: a.id})
      }
    })

    swal({
      title: 'Delete fields',
      showCancelButton: true,
      html: "<div id='swal-div' align='center'></div>",
      onOpen: function () {
        var swalNode = document.querySelector('#swal-div')

        UI.table(noIdColHeaders, {
          id: 'fields-to-delete',
          parent: swalNode,
          selectable: true
        })
      }
    }).then(function () {
      var fields = UI.getTableSel('fields-to-delete')

      var remArr = []

      fields.forEach(function (i) {
        remArr.push(noIdColHeaders[i].field)
      })

      if (!remArr.length) {
        return swal({
          type: 'warning',
          title: 'no fields to delete'
        })
      }

      params.fields = JSON.stringify(remArr)

      T.post('/mongo/unsetfield/', params).then(function (r) {
        if (r && r.ok && (r.ok == 1)) {
          location.reload()
        } else swal({html: JSON.stringify(r), type: 'warning'}).done()
      })
    }).catch(function () {})
  }

  func.getDistinct = function () {
    var params = Query.getParams()

    var noIdColHeaders = []

    Query.getSchema().forEach(function (a) {
      if (a.id !== '_id') {
        noIdColHeaders.push(a.id)
      }
    })

    swal({
      title: 'Get distinct values',
      showCancelButton: true,
      html: "<div id='swal-div' align='center'></div>",
      onOpen: function () {
        var swalNode = document.querySelector('#swal-div')

        UI.select(noIdColHeaders, {
          id: 'field-to-distinct',
          parent: swalNode
        }, function () {})
      }
    }).then(function () {
      params.field = document.querySelector('#field-to-distinctSelect').value

      if (!params.field) {
        return swal({
          type: 'warning',
          title: 'no field to distinct'
        })
      }

      T.post('/mongo/distinct/', params).then(function (arr) {
        if (arr.length > 200) {
          console.log(JSON.stringify(arr))

          return swal({
            title: 'More than 200',
            timer: 500,
            type: 'warning'
          }).done()
        }

        swal({
          title: 'Distinct values:',
          html: arr.join(', '),
          type: 'success'
        }).done()
      })
    }).catch(function () {})
  }

  func.findDupes = function () {
    var o = Router.getDb()
    var params = Query.getParams()

    var noIdColHeaders = []

    if (o.view === 'table') {
      noIdColHeaders = HotConfig.instance.getColHeader().filter(function (r) {
        if (r != '_id') return r
      })
    } else {
      var props = {}
      for (var i = 0; i < data.length; i++) {
        var row = data[i]
        for (var key in row) {
          props[key] = true
        }
      }
      noIdColHeaders = Object.keys(props)
    }

    swal({
      title: 'Find dupe values values',
      showCancelButton: true,
      html: "<div id='swal-div' align='center'></div>",
      onOpen: function () {
        var swalNode = document.querySelector('#swal-div')

        UI.select(noIdColHeaders, {
          id: 'field',
          parent: swalNode
        }, function () {})
      }
    }).then(function () {
      params.field = document.querySelector('#fieldSelect').value

      if (!params.field) {
        return swal({
          type: 'warning',
          title: 'no field to find dupes'
        })
      }

      T.post('/mongo/dupes/', params).then(function (arr) {
        if (arr.length > 200) {
          console.log(JSON.stringify(arr))

          return swal({
            title: 'More than 200',
            timer: 500,
            type: 'warning'
          }).done()
        }

        swal({
          title: 'Dupe values:',
          html: arr.join(', '),
          type: 'success'
        }).done()
      })
    }).catch(function () {})
  }

  func.groupCount = function () {
    var o = Router.getDb()
    var params = Query.getParams()

    var noIdColHeaders = []

    if (o.view === 'table') {
      noIdColHeaders = HotConfig.instance.getColHeader().filter(function (r) {
        if (r != '_id') return r
      })
    } else {
      var props = {}
      for (var i = 0; i < data.length; i++) {
        var row = data[i]
        for (var key in row) {
          props[key] = true
        }
      }
      noIdColHeaders = Object.keys(props)
    }

    swal({
      title: 'Count grouped values',
      showCancelButton: true,
      html: "<div id='swal-div' align='center'></div>",
      onOpen: function () {
        var swalNode = document.querySelector('#swal-div')

        UI.select(noIdColHeaders, {
          id: 'field',
          parent: swalNode
        }, function () {})
      }
    }).then(function () {
      params.field = document.querySelector('#fieldSelect').value

      if (!params.field) {
        return swal({
          type: 'warning',
          title: 'no field to group'
        })
      }

      T.post('/mongo/groupcount/', params).then(function (obj) {
        if (Object.keys(obj).length > 200) {
          console.log(JSON.stringify(obj))

          return swal({
            title: 'More than 200',
            timer: 500,
            type: 'warning'
          }).done()
        }

        var tableArr = []

        for (var prop in obj) {
          var val = obj[prop]
          tableArr.push({value: prop, count: val})
        }

        tableArr.sort(function (a, b) {
          return b.count - a.count
        })

        swal({
          title: 'Grouped count:',
          html: "<div id='swal-div' align='center'></div>",
          onOpen: function () {
            UI.table(tableArr, {
              hideHead: true,
              parent: document.querySelector('#swal-div')
            })
          }
        }).done()
      })
    }).catch(function () {})
  }

  func.createIndex = function () {
    document.querySelector('#create-indexes-body').align = 'center'

    document.querySelector('#create-indexes-footer').align = 'center'

    Blocks.getSchema(Query.getParams(), function (r) {
      var tableArr = []
      var tableParams = {
        id: 'create-indexes-table',
        parent: '#create-indexes-body'
      }

      for (var prop in r) {
        if (prop === '_id') continue
        tableArr.push({
          field: prop,
          type: r[prop],
          indexType: '',
          unique: '',
          sparce: ''
        })
      }

      UI.table(tableArr, tableParams)

      tableArr.forEach(function (a, i) {
        var fieldType = r[a.field]

        var indexTypes = ['1', '-1']

        if (fieldType === 'string') {
          indexTypes.push('text')
        }

        if (fieldType === 'object') {
          indexTypes.push('2dsphere')
          indexTypes.push('2d')
        }

        UI.select(indexTypes, {
          id: 'index-type-' + i,
          firstRowText: '...',
          parent: document.querySelector('table#create-indexes-table > tbody > tr:nth-child(' + (i + 1) + ') > td:nth-child(3)')
        }, function () {})

        UI.checkbox({
          id: 'unique-' + i,
          parent: document.querySelector('table#create-indexes-table > tbody > tr:nth-child(' + (i + 1) + ') > td:nth-child(4)')
        })

        UI.checkbox({
          id: 'sparce-' + i,
          parent: document.querySelector('table#create-indexes-table > tbody > tr:nth-child(' + (i + 1) + ') > td:nth-child(5)')
        })
      })

      UI.button({
        id: 'create-indexes-button',
        parent: '#create-indexes-footer',
        innerHTML: 'Create indexes',
        className: 'btn btn-primary'
      }, function () {
        var rowNodes = document.querySelectorAll('table#create-indexes-table > tbody > tr')

        var indexesToCreate = []

        for (var i = 0; i < rowNodes.length; i++) {
          var o = {
            indexType: rowNodes[i].querySelector('td:nth-child(3) > select > option:checked').innerHTML
          }
          if (o.indexType === '...') continue

          if (['-1', '1'].indexOf(o.indexType) !== -1) o.indexType = Number(o.indexType)

          o.field = rowNodes[i].querySelector('td:nth-child(1)').innerHTML

          o.options = {
            unique: rowNodes[i].querySelector('td:nth-child(4) > input').checked,
            sparse: rowNodes[i].querySelector('td:nth-child(5) > input').checked
          }

          indexesToCreate.push(o)
        }

        if (indexesToCreate.length) {
          createIndexesMongo(indexesToCreate, Query.getParams())
        } else swal({title: 'nothing to create', type: 'warning'}).done()
      })

      UI.button({
        id: 'cancel-button',
        parent: '#create-indexes-footer',
        innerHTML: 'Cancel'
      }, function () {
        $('#create-indexes').modal('hide')
      })

      $('#create-indexes').modal()
    })

    function createIndexesMongo (indexesToCreate, params) {
      T.iter(indexesToCreate, function (a, cb) {
        params.index = {}
        params.index[a.field] = a.indexType
        params.options = JSON.stringify(a.options)

        T.post('/mongo/createindex/', params).then(function (r) {
          if (typeof r !== 'string') {
            swal({html: JSON.stringify(r, null, '2'), type: 'warning'}).done()
            console.log(r)
          } else cb(r)
        })
      }, {
        concurrency: 1,
        cb: function () {
          $('#create-indexes').modal('hide')
          swal({title: 'Index(es) created', type: 'success'}).done()
        }
      })
    }
  }

  func.browseIndex = function () {
    T.post('/mongo/indexinfo/', Query.getParams()).then(function (r) {
      var tableArr = []

      for (var prop in r) {
        if (prop === '_id_') continue
        var val = r[prop]
        tableArr.push({
          name: prop,
          index: JSON.stringify(val, null, 2)
        })
      }

      if (!tableArr.length) return swal({title: 'No indexes found', html: 'except mandatory "_id_"', type: 'info'}).done()

      swal({
        title: 'Indexes list',
        html: '<div id="sd" align="center"></div>',
        confirmButtonText: 'Delete selected',
        showCancelButton: true,
        onOpen: function () {
          UI.table(tableArr, {
            parent: '#sd',
            id: 'indexes',
            selectable: true
          })
        }
      }).then(function () {
        var selNodes = UI.getTableSel('indexes')

        T.iter(selNodes, function (i, cb) {
          var item = tableArr[i]

          params.index = item.name

          T.post('/mongo/dropindex/', params).then(function (r) {
            // console.log(r)
            cb(r)
          })
        }, {
          concurrency: 1,
          cb: function () {
            swal({title: 'Selected indexes were dropped', type: 'success'}).done()
          }
        })
      }).catch(function () {})
    })
  }

  func.deleteIndex = func.browseIndex

  func.getIndex = func.browseIndex

  func.runFunction = function () {
    var params = {
      height: '450px',
      parent: document.querySelector('#update-each-body'),
      id: 'update-each-ace',
      width: '100%',
      marginTop: '0px',
      marginBottom: '0px'
    }

    params.code = localStorage['aceEdit' + params.id + 'Value'] || '//do something with doc\nreturn doc;'

    Blocks.ace(params)

    $('#update-each').modal()

    UI.button({
      parent: '#update-each-footer',
      id: 'run',
      innerHTML: 'Run'
    }, function () {
      var eachParams = Query.getParams()
      eachParams.query = JSON.stringify(Query.getQuery())
      eachParams.func = params.instance.getValue()

      if (!eachParams.func) return swal({
          title: 'no code provided',
          timer: 800,
          type: 'error'
        }).done()

      T.post('/mongo/each/', eachParams).then(function (r) {
        console.log(r)
        if (r === null || (r && !Object.keys(r).length)) {
          swal({
            title: 'all done!',
            type: 'success',
            showCancelButton: true,
            confirmButtonText: 'Reload page'
          }).then(function () {
            location.reload()
          }).catch(function () {})
          $('#update-each').modal('hide')
        } else
          swal({
            html: JSON.stringify(r),
            type: 'error'
          }).done()
      })
    })
  }

  func.dropCollection = function () {
    var o = Router.getDb()
    swal({
      title: 'Drop collection?',
      type: 'warning',
      showCancelButton: true
    }).then(function () {
      T.post('/mongo/dropcollection/', Query.getParams()).then(function () {
        location.pathname = '/' + o.title + '/' + o.urlDbName + '/'
      })
    }).catch(function () {})
  }

  func.importJson = function () {
    swal({
      title: 'Import JSON',
      html: "<div id='swal-div'></div>",
      showConfirmButton: false,
      showCancelButton: true,
      onOpen: function () {
        var swalNode = document.querySelector('#swal-div')

        UI.fileReader({
          parent: swalNode,
          json: true
        }, function (r) {
          if (typeof r != 'object')
            return swal({
              title: 'File is not json',
              timer: 800,
              type: 'warning'
            }).done()

          Blocks.saveDataMongo(r)
        })
      }
    }).done()
  }

  func.exportJson = function () {
    var o = Router.getDb()

    var arr

    if (o.view === 'table') {
      var hotData = HotConfig.instance.getData()
      arr = HH.convArrArrToArrObj(hotData, HotConfig.columns, HotConfig.minSpareRows)
    } else arr = data

    var fileName = o.collection || 'renameMe'
    download(JSON.stringify(arr), fileName + '.json', 'application/json')
  }

  /**
   * Refactor
   */

  function openVisualQuery () {
    var params = Controls.getCollectionFromUrl()

    T.post('/mongo/keys/', params).then(function (fields) {
      if (!fields || !fields.length) return

      var conditions = {
        'exists': {
          '$exists': true
        },
        'not exist': {
          '$exists': false
        },
        'equals': {
          '$eq': 'value'
        },
        'not equal': {
          '$ne': 'value'
        },
        'regex': {
          '$regex': 'value'
        },
        'less than': {
          '$lt': 'value'
        },
        'greater than': {
          '$gt': 'value'
        },
        'less/equal': {
          '$lte': 'value'
        },
        'greater/equal': {
          '$gte': 'value'
        },
        'is true': {
          '$eq': true
        },
        'is false': {
          '$eq': false
        },
        'is null': {
          '$eq': null
        }
      }

      var clonedFields = JSON.parse(JSON.stringify(fields))
      var row = 1

      swal({
        title: 'Query',
        html: "<div id='swal-div'></div>",
        onOpen: function () {
          addRow(clonedFields, row)
        }
      }).then(function () {
        var query = {}

        var divNodes = document.querySelectorAll('.cond-div')
        for (var i = 0; i < divNodes.length; i++) {
          var divNode = divNodes[i]
          var field = divNode.querySelector('select.field > option:checked').value
          if (/select/g.test(field)) continue

          var condNode = divNode.querySelector('select.cond > option:checked')
          if (!condNode) continue
          var cond = conditions[condNode.value]
          var mongoCond = Object.keys(cond)[0]
          var value = cond[mongoCond]

          if (value == 'value') {
            var valueNode = divNode.querySelector('input.value')
            if (!valueNode) continue
            var clonedCond = JSON.parse(JSON.stringify(cond))
            var mongoClonedCond = Object.keys(clonedCond)[0]
            clonedCond[mongoClonedCond] = valueNode.value
            query[field] = clonedCond
          } else query[field] = cond
        }

        localStorage['query' + params.db + params.collection] = JSON.stringify(query)
        location.reload()
      }).catch(function () {})

      function addRow (clonedFields, row) {
        var parent = document.querySelector('#swal-div')

        UI.div({
          id: 'row' + row,
          parent: parent,
          className: 'cond-div'

        })
        var divNode = document.querySelector('#' + 'row' + row)
        var currRow = JSON.parse(JSON.stringify(row))

        UI.select(clonedFields, {
          id: 'field' + currRow,
          parent: divNode,
          className: 'field'
        }, function (field) {
          row++
          var elemPos = clonedFields.indexOf(field)
          clonedFields.splice(elemPos, 1)

          if (clonedFields.length) addRow(clonedFields, row)

          UI.select(Object.keys(conditions), {
            id: 'cond' + currRow,
            parent: divNode,
            className: 'cond'
          }, function (condition) {
            var mongoCond = Object.keys(conditions[condition])[0]
            var value = conditions[condition][mongoCond]

            if (value == 'value') {
              UI.input({
                value: '',
                id: 'value' + currRow,
                parent: divNode,
                className: 'value',
                style: {
                  width: '150px'
                }
              })
            }
          })
        })
      }
    })
  }
})()
