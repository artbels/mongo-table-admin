;(function () {
  var Blocks = this.Blocks = {}

  Blocks.ace = function (params) {
    params = params || {}

    if (typeof params == 'string') params = {
        code: params
    }

    params.onkeyup = params.onkeyup || function () {}

    params.parent = params.parent || document.querySelector('#ui') || document.body
    params.id = params.id || 'jsScript'
    params.width = params.width || '750px'
    params.height = params.height || '150px'
    params.fontSize = params.fontSize || '14px'
    params.marginTop = params.marginTop || '10px'
    params.marginBottom = params.marginBottom || '10px'

    var exAceDiv = document.querySelector('#' + params.id)
    if (exAceDiv) params.parent.removeChild(exAceDiv)

    var aceDiv = document.createElement('div')
    aceDiv.id = params.id
    aceDiv.style.width = params.width
    aceDiv.style.height = params.height
    aceDiv.style.fontSize = params.fontSize
    aceDiv.style.marginTop = params.marginTop
    aceDiv.style.marginBottom = params.marginBottom
    aceDiv.onkeyup = function (e) {
      var currVal = params.instance.getValue()
      if (params.onkeyup.toString() !== 'function () {}') {
        params.onkeyup(currVal)
      } else {
        localStorage['aceEdit' + params.id + 'Value'] = currVal
      }

      if (e.altKey && e.ctrlKey && (e.which == 70)) {
        if (params.mode == 'ace/mode/json') {
          var json
          try {
            json = JSON.parse(currVal)
          } catch (err) {}

          if (!json) return
          var beautifyJson = JSON.stringify(json, null, 2)

          if (params.onkeyup) {
            params.onkeyup(beautifyJson)
          } else {
            localStorage['aceEdit' + params.id + 'Value'] = beautifyJson
          }
          params.instance.setValue(beautifyJson)
        } else if (params.mode == 'ace/mode/javascript') {
          var js = js_beautify(currVal, {
            indent_size: 2,
            max_preserve_newlines: 1
          })
          if (params.onkeyup) {
            params.onkeyup(js)
          } else {
            localStorage['aceEdit' + params.id + 'Value'] = js
          }
          params.instance.setValue(js)
        }
      }
    }

    params.parent.appendChild(aceDiv)
    params.mode = params.mode || 'ace/mode/javascript'

    params.instance = ace.edit(params.id)
    params.instance.$blockScrolling = Infinity
    params.instance.setTheme('ace/theme/solarized_light')
    params.instance.getSession().setMode(params.mode)
    params.instance.getSession().setUseWrapMode(true)
    params.instance.setValue(params.code || localStorage['aceEdit' + params.id + 'Value'] || '')
    params.instance.gotoLine(1)
  }

  Blocks.tooMuchRows = function (num, cb) {
    swal({
      title: num + ' rows found',
      showConfirmButton: false,
      html: "<p>What do you want to do?</p><div id='swal-div'></div>",
      onOpen: function () {
        var swalNode = document.querySelector('#swal-div')

        UI.button({
          innerHTML: 'Load 100',
          id: 'load-100',
          className: 'btn btn-primary',
          parent: swalNode

        }, function () {
          cb(100)
          swal.close()
        })

        UI.button({
          innerHTML: 'Set query',
          id: 'set-query',
          className: 'btn btn-success',
          parent: swalNode

        }, function () {
          swal.close()
          Query.show()
        })

        UI.button({
          innerHTML: 'Load all',
          id: 'load-all',
          className: 'btn btn-secondary',
          parent: swalNode

        }, function () {
          cb(0)
          swal.close()
        })
      }
    }).catch(function () {})
  }

  Blocks.saveDataMongo = function (arr) {
    var dbObj = Router.getDb()

    var html = 'Enter database and collection name'
    html += "<div align='center' id='swal-div'></div>"

    if (!arr || !arr.length) return swal({
        title: 'nothing to save!',
        timer: 800,
        type: 'warning'
      }).done()

    swal({
      // title: "Mongo URL",
      html: html,
      allowEscapeKey: false,
      confirmButtonText: 'Save',
      showCancelButton: true,
      onOpen: function () {
        var swalDiv = document.querySelector('#swal-div')

        UI.input({
          parent: swalDiv,
          id: 'database',
          placeholder: 'database',
          value: dbObj.urlDbName || dbObj.connPathDbName || '',
          style: {
            fontSize: '120%',
            textAlign: 'center'
          }
        })

        UI.br(1)

        UI.input({
          parent: swalDiv,
          id: 'collection',
          placeholder: 'collection',
          value: dbObj.collection || '',
          style: {
            fontSize: '120%',
            textAlign: 'center'
          }
        })

        document.querySelector('#database').onkeyup = checkValid
        document.querySelector('#database').onchange = checkValid
        document.querySelector('#collection').onkeyup = checkValid
        document.querySelector('#collection').onchange = checkValid

        function checkValid (e) {
          var dbName = e.target.value
          if (/^[^a-z]/.test(dbName)) {
            swal.showValidationError(' please start name with latin letter')
            swal.disableButtons()
          } else {
            swal.resetValidationError()
            swal.enableButtons()
          }
        }
      },
      preConfirm: function () {
        var collection = document.querySelector('#collection').value
        var dbName = document.querySelector('#database').value

        return new Promise(function (resolve) {
          if (dbName && collection) {
            resolve({dbName, collection})
          } else {
            swal.showValidationError('Please set database and collection name')
          }
        })
      }
    }).then(function (params) {
      saveArrMongoChunks(arr, params)
    }).catch(function () {})

    function saveArrMongoChunks (arr, params) {
      params.db = dbObj.connStr + '/' + params.dbName

      spinner.spin(document.body)

      setTimeout(function () {
        var chunkSize = 500
        var chunks = Math.ceil(arr.length / chunkSize)
        var currChunk = 0

        ;(function workChunk () {
          var start = currChunk * chunkSize
          var currArr = arr.slice(start, chunkSize * (currChunk + 1))

          params.data = JSON.stringify(currArr)

          $.post('/mongo/insert/', params, function (r) {
            if (r && r.result && r.result.ok && (r.result.ok == 1)) {
              currChunk++
              if (currChunk < chunks) workChunk()
              else {
                swal({
                  type: 'success',
                  title: 'everything saved!',
                  confirmButtonText: 'Go to collection',
                  showCancelButton: true,
                  cancelButtonText: 'Create another collection'
                }).then(function () {
                  var o = Router.getDb()
                  location.pathname = '/' + o.title + '/' + o.urlDbName + '/' + params.collection + '/table/'
                }).catch(function () {
                  location.pathname = '/' + o.title + '/' + o.urlDbName + '/create/'
                })
                spinner.stop()
              }
            }
          })
        })()
      }, 10)
    }
  }
})()
