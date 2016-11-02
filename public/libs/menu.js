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

    Query.getSchema().then(function(schema) {
      var tableArr = []

      for (var prop in schema) {
        if (prop !== '_id') tableArr.push({
          field: prop,
          type: schema[prop]
        })
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
  }

  func.getSchema = func.browseSchema

  func.addField = function () {
    swal({
      title: 'Add column(s)',
      html: "<div id='swal-div' align='center'></div>",
      showCancelButton: true,
      onOpen: function () {
        var swalNode = document.querySelector('#swal-div')
        addRow(swalNode, 0)
      }
    }).then(function () {
      var divNodes = document.querySelectorAll('.add-field-div')
      for (var i = 0; i < divNodes.length; i++) {
        var divNode = divNodes[i]

        var fieldName = divNode.querySelector('input.field-name').value
        if (!fieldName) continue
        var fieldType = divNode.querySelector('select.field-type > option:checked').value
        if (/select/g.test(fieldType)) continue

        var newSchema = {}        
        newSchema[fieldName] = fieldType
        Query.enrichSchema(newSchema)

        var col = HH.setColType(fieldName, fieldType || 'string')

        HotConfig.columns.push(col)
        HotConfig.colHeaders.push(col.data)
      }

      HotConfig.instance.updateSettings({
        colHeaders: HotConfig.colHeaders,
        columns: HotConfig.columns
      })
    }).catch(function () {})

    function addRow (swalNode, row) {
      UI.div({
        id: 'row' + row,
        parent: swalNode,
        className: 'add-field-div'
      })
      var divNode = document.querySelector('#' + 'row' + row)
      var currRow = JSON.parse(JSON.stringify(row))

      UI.input({
        placeholder: 'Field name',
        className: 'field-name',
        parent: divNode,
        id: 'field-name' + row,
        value: '',
        style: {
          width: '180px',
          textAlign: 'center'
        }
      })

      UI.select(Object.keys(HH.typesMap), {
        placeholder: 'Field type',
        className: 'field-type',
        id: 'field-type' + row,
        parent: divNode
      }, function () {
        row++
        addRow(swalNode, row)
      })

      document.querySelector('#field-name' + currRow).onkeyup = checkFieldExist
      document.querySelector('#field-name' + currRow).onchange = checkFieldExist
    }

    function checkFieldExist (e) {
      var fieldName = e.target.value

      if(/^\d/.test(fieldName)) {
        swal.showValidationError("please don't start field name with numbers")
        return swal.disableButtons()
      } 

      var schema = Query.getSchemaLs()
      var fields = Object.keys(schema)
      var allFields = fields.concat(getNames(e.target.id))

      if (allFields.indexOf(fieldName) != -1) {
        swal.showValidationError(fieldName + ' is already exists')
        return swal.disableButtons()
      }

      swal.resetValidationError()
      swal.enableButtons()      
    }

    function getNames (exclude) {
      var divNodes = document.querySelectorAll('.add-field-div')
      var fieldArr = []
      for (var i = 0; i < divNodes.length; i++) {
        var divNode = divNodes[i]
        var fieldNode = divNode.querySelector('input.field-name')
        if (fieldNode.id !== exclude) fieldArr.push(fieldNode.value)
      }
      return fieldArr
    }
  }

  func.renameField = function () {
    var params = Query.getParams()

    var schema = Query.getSchemaLs()
    var fields = Object.keys(schema).filter(function(a) {
      if(a !== '_id') return a
    })

    swal({
      title: 'Rename field',
      html: "<div id='swal-div' align='center'></div>",
      showCancelButton: true,
      onOpen: function () {
        var swalNode = document.querySelector('#swal-div')

        UI.select(fields, {
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

        document.querySelector('#new-name').onkeyup = checkFieldExist
        document.querySelector('#new-name').onchange = checkFieldExist

        function checkFieldExist (e) {
          var fieldName = e.target.value
          var schema = Query.getSchemaLs()
          var fields = Object.keys(schema)

          if (fields.indexOf(fieldName) !== -1) {
            swal.showValidationError(fieldName + ' is already exists')
            swal.disableButtons()
          } else {
            swal.resetValidationError()
            swal.enableButtons()
          }
        }
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

      schema[params.new] = schema[params.old]
      delete schema[params.old]
      Query.setSchema(schema)

      T.post('/mongo/rename/', params).then(function (r) {
        if (r && r.ok && (r.ok == 1)) {
          location.reload()
        } else alert(JSON.stringify(r))
      })
    }).catch(function () {})
  }

  func.deleteField = function () {
    var params = Query.getParams()

    var schema = Query.getSchemaLs()

    var tableArr = []
    for (var prop in schema) {
      if (prop !== '_id') tableArr.push({
          field: prop,
          type: schema[prop]
        })
    }

    swal({
      title: 'Delete fields',
      showCancelButton: true,
      html: "<div id='swal-div' align='center'></div>",
      onOpen: function () {
        var swalNode = document.querySelector('#swal-div')

        UI.table(tableArr, {
          id: 'fields-to-delete',
          parent: swalNode,
          selectable: true
        })
      }
    }).then(function () {
      var fields = UI.getTableSel('fields-to-delete')

      var remArr = []

      fields.forEach(function (i) {
        remArr.push(tableArr[i].field)
        delete schema[tableArr[i].field]
      })      

      if (!remArr.length) {
        return swal({
          type: 'warning',
          title: 'no fields to delete'
        })
      }

      Query.setSchema(schema)

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

    var schema = Query.getSchemaLs()
    var fields = Object.keys(schema).filter(function(a) {
      if(a !== '_id') return a
    })

    swal({
      title: 'Get distinct values',
      showCancelButton: true,
      html: "<div id='swal-div' align='center'></div>",
      onOpen: function () {
        var swalNode = document.querySelector('#swal-div')

        UI.select(fields, {
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
    var params = Query.getParams()

    var schema = Query.getSchemaLs()
    var fields = Object.keys(schema).filter(function(a) {
      if(a !== '_id') return a
    })

    swal({
      title: 'Find dupe values values',
      showCancelButton: true,
      html: "<div id='swal-div' align='center'></div>",
      onOpen: function () {
        var swalNode = document.querySelector('#swal-div')

        UI.select(fields, {
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
    var params = Query.getParams()

    var schema = Query.getSchemaLs()
    var fields = Object.keys(schema).filter(function(a) {
      if(a !== '_id') return a
    })

    swal({
      title: 'Count grouped values',
      showCancelButton: true,
      html: "<div id='swal-div' align='center'></div>",
      onOpen: function () {
        var swalNode = document.querySelector('#swal-div')

        UI.select(fields, {
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

    Query.getSchema().then(function (r) {
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
})()