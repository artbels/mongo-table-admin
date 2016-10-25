;(function () {
  var Router = this.Router = {}

  Router.getDb = function () {
    var connections = JSON.parse(localStorage.connections || '[{"str":"mongodb://localhost:27017/test", "title":"localhost"}]')
    var rePattern = /^\/(?:(.+?)(?:\/))?(?:(.+?)(?:\/))?(?:(.+?)(?:\/))?(?:(.+?)(?:\/))?$/
    var m = location.pathname.match(rePattern)

    var o = {}

    if (m[1] && (m[1] !== 'create')) {
      o.title = m[1]
      o.connStr = connections.filter(function (a) {
        if (a.title === m[1]) return a
      })[0].str

      var hostPortDb = o.connStr
        .replace('mongodb:\/\/', '')

      var dbName = hostPortDb.match(/\/(.+)$/)

      if (dbName) {
        var reDbName = new RegExp('\/' + dbName[1] + '$')
        o.connPathDbName = dbName[1]
        o.connStr = o.connStr.replace(reDbName, '')
      }
    } else {
      o.view = 'create'
    }

    if (m[2]) o.urlDbName = m[2]

    if (m[3]) {
      if (m[3] !== 'create') {
        o.collection = m[3]
      } else {
        o.view = 'create'
      }
    }
    if (m[4]) o.view = m[4]

    return o
  }

  Router.showSwal = function () {
    var o = Router.getDb()

    if (o.urlDbName) {
      Router.collections()
    } else if (o.connStr) {
      Router.databases()
    } else {
      Router.enterDbPath(o)
    }
  }

  Router.enterDbPath = function (o) {
    o = o || Router.getDb()
    var html = "Please enter mongo url<div id='swal-div' align='center'></div>"

    var connections = JSON.parse(localStorage.connections || '[{"str":"mongodb://localhost:27017/test", "title":"localhost"}]')

    if (connections.length > 1) {
      html += '<a href="/localhost/test/" style = "font-size:80%;">ex. mongodb://localhost:27017/test</a>'
    }

    swal({
      // title: "Mongo URL",
      html: html,
      allowOutsideClick: o.view ? true : false,
      allowEscapeKey: o.view ? true : false,
      width: 700,
      onOpen: function () {
        var swalDivNode = document.querySelector('#swal-div')

        UI.input({
          parent: swalDivNode,
          id: 'db-path',
          placeholder: 'mongodb://localhost:27017/test',
          value: connections[0].str,
          style: {
            fontSize: '80%',
            textAlign: 'center',
            width: '100%'
          }
        })
      }
    }).then(function () {
      var connStr = document.querySelector('#db-path').value.trim()

      if (!/^mongodb:\/\//.test(connStr)) {
        connStr = 'mongodb://' + connStr
      }

      var hostPortDb = connStr
        .replace('mongodb:\/\/', '')
        .replace(/^.+?@/, '')

      var title = hostPortDb
        .replace(/\/.+$/, '')
        .replace(/:\d+$/, '')
        .replace(/[^\w\d-_]/, '')

      var dbName = hostPortDb.match(/\/(.+)$/)

      connections = connections.filter(function (a) {
        if (a.str !== connStr) return a
      })

      connections.unshift({str: connStr, title: title})

      localStorage.connections = JSON.stringify(connections)

      location.pathname = '/' + title + '/' + (dbName ? dbName[1] + '/' : '')
    }).catch(function () {})
  }

  Router.chooseCollection = function (list) {
    spinner.spin(document.body)

    var o = Router.getDb()

    var i = 0
    var l = list.length
    var collArr = []

    ;(function next () {
      var name = list[i].name

      var params = Query.getParams()
      params.collection = name

      T.post('/mongo/collectionstats/', params).then(function (r) {
        var sizeStr
        var sizeKb = r.size / 1024

        if (sizeKb > 100000) sizeStr = (sizeKb / 1024 / 1024).toFixed(1) + 'GB'
        else if (sizeKb > 100) sizeStr = (sizeKb / 1024).toFixed(1) + 'MB'
        else sizeStr = (sizeKb).toFixed(1) + 'KB'

        var collObj = {
          collection: name,
          documents: r.count,
          size: sizeStr,
          table: "<a href='" + '/' + o.title + '/' + o.urlDbName + '/' + name + '/table/' + "'>" + 'table' + '</a>',
          pivot: "<a href='" + '/' + o.title + '/' + o.urlDbName + '/' + name + '/pivot/' + "'>" + 'pivot' + '</a>',
          x: '<a href=\'#\' onclick=\'Router.dropCollection("' + name + '")\'>x</a>'
        }

        collArr.push(collObj)

        i++

        if (i < l) {
          next()
        } else {
          swal({
            title: 'Choose collection',
            html: "<div id='swal-div' align='center'></div>",
            showConfirmButton: false,
            width: 700,
            onOpen: function () {
              var swalDivNode = document.querySelector('#swal-div')

              UI.table(collArr, {
                parent: swalDivNode,
                hideHead: true
              })
            }
          }).catch(function () {})
          spinner.stop()
        }
      })
    })()
  }

  Router.chooseDb = function (list) {
    var o = Router.getDb()

    swal({
      title: 'Choose Database',
      html: "<div id='swal-div' align='center'></div>",
      showConfirmButton: false,
      allowOutsideClick: o.view ? true : false,
      allowEscapeKey: o.view ? true : false,
      onOpen: function () {
        var swalDivNode = document.querySelector('#swal-div')

        var i = 0
        var l = list.databases.length

        ;(function next () {
          var dbName = list.databases[i].name
          var size = list.databases[i].sizeOnDisk / 1024 / 1024
          var sizeStr

          if (size > 100) sizeStr = (size / 1024).toFixed(2) + 'GB'
          else sizeStr = (size).toFixed(2) + 'MB'

          UI.button({
            parent: swalDivNode,
            innerHTML: dbName + ', ' + sizeStr,
            id: dbName,
            style: {
              marginRight: '10px'
            }
          }, function (r) {
            location.pathname = '/' + o.title + '/' + r + '/'
          })

          i++

          if (i < l) next()
        })()

        UI.br(swalDivNode)

        UI.button({
          parent: swalDivNode,
          id: 'change-db-path',
          className: 'btn btn-primary',
          innerHTML: 'Change DB Path'
        }, function () {
          Router.enterDbPath()
        })
      }
    }).catch(function () {})
  }

  Router.changeView = function (newView) {
    var o = Router.getDb()
    location.href = '/' + o.title + '/' + o.urlDbName + '/' + o.collection + '/' + newView + '/'
  }

  Router.collections = function (o) {
    o = o || Router.getDb()
    if (!o.connStr) return Router.enterDbPath()

    T.post('/mongo/listcollections/', {
      db: o.connStr + '/' + o.urlDbName
    }).then(function (list) {
      if (!list.length) {
        location.pathname = location.pathname + 'create'
      } else Router.chooseCollection(list)
    })
  }

  Router.databases = function (o) {
    o = o || Router.getDb()
    if (!o.connStr) return Router.enterDbPath()

    T.post('/mongo/listdatabases/', {
      db: o.connStr
    }).then(function (list) {
      if (!list.databases) Router.enterDbPath()
      else Router.chooseDb(list)
    })
  }

  Router.dropCollection = function (params) {
    if (typeof params == 'string') {
      var o = Router.getDb()
      params = {
        db: o.connStr + '/' + o.urlDbName,
        collection: params
      }
    }

    swal({
      title: 'Drop collection?',
      type: 'warning',
      showCancelButton: true
    }).then(function () {
      T.post('/mongo/dropcollection/', params).then(function () {
        location.href = '/' + o.title + '/' + o.urlDbName + '/'
      })
    }).catch(function () {})
  }
})()
