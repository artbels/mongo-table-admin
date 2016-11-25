var MongoClient = require('mongodb').MongoClient
var ObjectID = require('mongodb').ObjectID

var reJsStrData = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z/i
var reMongoId = /^[0-9a-f]{24}$/

var MC = module.exports = {}

MC.createIndex = function (params) {
  return new Promise(function (res, err) {
    if (!params.db || !params.collection || !params.index) return err('!params.db || !params.collection || !params.index')

    if (typeof params.index === 'string') {
      try {
        params.index = JSON.parse(params.index)
      } catch (e) {
        err(e)
      }
    }

    if (typeof params.options === 'string') {
      try {
        params.options = JSON.parse(params.options)
      } catch (e) {
        err(e)
      }
    }

    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      db.collection(params.collection).createIndex(params.index, params.options, function (e, r) {
        if (e) return err(e)

        res(r)
        db.close()
      })
    })
  })
}

MC.ensureIndex = function (params) {
  return new Promise(function (res, err) {
    if (!params.db || !params.collection || !params.index) return err('!params.db || !params.collection || !params.index')

    if (typeof params.index == 'string') {
      try {
        params.index = JSON.parse(params.index)
      } catch (e) {
        err(e)
      }
    }

    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      db.collection(params.collection).ensureIndex(params.index, function (e, r) {
        if (e) return err(e)

        res(r)
        db.close()
      })
    })
  })
}

MC.dropIndexes = function (params) {
  return new Promise(function (res, err) {
    if (!params.db || !params.collection) return err('!params.db || !params.collection')

    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      db.collection(params.collection).dropIndexes(function (e, r) {
        if (e) return err(e)

        res(r)
        db.close()
      })
    })
  })
}

MC.dropIndex = function (params) {
  return new Promise(function (res, err) {
    if (!params.db || !params.collection || !params.index) return err('!params.db || !params.collection  || !params.index')

    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      db.collection(params.collection).dropIndex(params.index, function (e, r) {
        if (e) return err(e)

        res(r)
        db.close()
      })
    })
  })
}

MC.indexInfo = function (params) {
  return new Promise(function (res, err) {
    if (!params.db || !params.collection) return err('!params.db || !params.collection')

    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      db.collection(params.collection).indexInformation(function (e, r) {
        if (e) return err(e)

        res(r)
        db.close()
      })
    })
  })
}

MC.group = function (params) {
  return new Promise(function (res, err) {
    if (!params.db || !params.collection || !params.fields) return err('!params.db || !params.collection || !params.fields')

    var agrQuery = []

    if (params.query) {
      if (typeof params.query == 'string') {
        try {
          params.query = JSON.parse(params.query)
        } catch (e) {
          err(e)
        }
      }
      agrQuery.push({
        $match: params.query
      })
    }

    if (typeof params.fields == 'string')
      params.fields = JSON.parse(params.fields)

    var groupObj = {
      $group: {
        _id: {}
      }
    }

    params.fields.forEach(function (a) {
      groupObj.$group._id[a] = '$' + a
    })

    agrQuery.push(groupObj)

    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      db.collection(params.collection).aggregate(agrQuery, function (e, docs) {
        if (e) return err(e)

        docs = docs.map(function (a) {
          return a._id
        })

        res(docs)
        db.close()
      })
    })
  })
}

MC.dupes = function (params) {
  return new Promise(function (res, err) {
    if (!params.db || !params.collection || !params.field) return err('!params.db || !params.collection || !params.field')

    if (params.query) {
      if (typeof params.query == 'string') {
        try {
          params.query = JSON.parse(params.query)
        } catch (e) {
          params.query = {}
          err(e)
        }
      }
    } else params.query = {}

    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      var projection = {
        _id: 0
      }

      projection[params.field] = 1

      var cursor = db.collection(params.collection).find(params.query, projection)

      var uniq = {}
      var nonUniq = {}

      cursor.each(function (e, doc) {
        if (e) return err(e)

        if (!doc) {
          res(Object.keys(nonUniq))
          return db.close()
        }

        if (params.field) {
          if (uniq[doc[params.field]]) nonUniq[doc[params.field]] = true
          else uniq[doc[params.field]] = true
        }
      })
    })
  })
}

MC.groupCount = function (params) {
  return new Promise(function (res, err) {
    if (!params.db || !params.collection || !params.field) return err('!params.db || !params.collection || !params.field')

    if (params.query) {
      if (typeof params.query == 'string') {
        try {
          params.query = JSON.parse(params.query)
        } catch (e) {
          params.query = {}
          err(e)
        }
      }
    } else params.query = {}

    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      var projection = {
        _id: 0
      }

      projection[params.field] = 1

      var cursor = db.collection(params.collection).find(params.query, projection)

      var uniq = {}

      cursor.each(function (e, doc) {
        if (e) return err(e)

        if (!doc) {
          res(uniq)
          return db.close()
        }

        if (doc[params.field] === undefined) doc[params.field] = 'undefined'
        if (doc[params.field] === null) doc[params.field] = 'null'

        if (uniq[doc[params.field]]) uniq[doc[params.field]]++
        else uniq[doc[params.field]] = 1
      })
    })
  })
}

MC.each = function (params) {
  return new Promise(function (res, err) {
    if (!params.db || !params.collection || !params.func) return err('!params.db || !params.collection || !params.func')

    if (params.query) {
      if (typeof params.query == 'string') {
        try {
          params.query = JSON.parse(params.query)
        } catch (e) {
          params.query = {}
          err(e)
        }
      }
    } else params.query = {}

    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      var cursor = db.collection(params.collection).find(params.query)

      var workLine = new Function('doc', params.func)

      var errors = {}

      cursor.each(function (e, doc) {
        if (e) return err(e)

        if (!doc) {
          res(errors)
          return db.close()
        }

        try {
          doc = workLine(doc)
          db.collection(params.collection).save(doc, function (e) {
            err(e)
          })
        } catch (error) {
          if (error) {
            if (errors[error.toString()]) errors[error.toString()]++
            else errors[error.toString()] = 1
          }
        }
      })
    })
  })
}

MC.keys = function (params) {
  return new Promise(function (res, err) {
    if (!params.db || !params.collection) return err('!params.db || !params.collection')

    if (params.query) {
      if (typeof params.query == 'string') {
        try {
          params.query = JSON.parse(params.query)
        } catch (e) {
          params.query = {}
          err(e)
        }
      }
    } else params.query = {}

    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      var uniqKeys = {}

      db.collection(params.collection).find(params.query).each(function (e, doc) {
        if (e) return err(e)

        if (doc) {
          for (var key in doc) {
            uniqKeys[key] = true
          }
        } else {
          res(Object.keys(uniqKeys))
          db.close()
        }
      })
    })
  })
}

MC.schema = function (params) {
  return new Promise(function (res, err) {
    if (!params.db || !params.collection) return err('!params.db || !params.collection')

    if (params.query) {
      if (typeof params.query == 'string') {
        try {
          params.query = JSON.parse(params.query)
        } catch (e) {
          params.query = {}
          err(e)
        }
      }
    } else params.query = {}

    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      var uniqKeys = {}

      db.collection(params.collection).find(params.query).each(function (e, doc) {
        if (e) return err(e)

        if (doc) {
          for (var key in doc) {
            uniqKeys[key] = getType(doc[key])
          }
        } else {
          res(uniqKeys)
          db.close()
        }
      })
    })
  })

  function getType (val) {
    var type = typeof val
    if (type === 'object') {
      if (val !== null) {
        var objConstr = val
          .constructor
          .toString()
          .split(' ')[1]
          .split('(')[0]
          .toLowerCase()
        return objConstr
      } else return 'null'
    } else return typeof val
  }
}

MC.count = function (params) {
  return new Promise(function (res, err) {
    if (!params.db || !params.collection) return err('!params.db || !params.collection')

    if (params.query) {
      if (typeof params.query == 'string') {
        try {
          params.query = JSON.parse(params.query)
        } catch (e) {
          params.query = {}
          err(e)
        }
      }
    } else params.query = {}

    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      db.collection(params.collection).count(params.query, function (e, r) {
        if (e) return err(e)

        res(r)
        db.close()
      })
    })
  })
}

MC.find = function (params) {
  return new Promise(function (res, err) {
    if (!params.db || !params.collection) return err('!params.db || !params.collection')

    if (params.query) {
      if (typeof params.query == 'string') {
        try {
          params.query = JSON.parse(params.query)
        } catch (e) {
          params.query = {}
          err(e)
        }
      }
    } else params.query = {}

    if (params.projection) {
      if (typeof params.projection == 'string') {
        try {
          params.projection = JSON.parse(params.projection)
        } catch (e) {
          params.projection = {}
          err(e)
        }
      }
    } else params.projection = {}

    if (params.limit) params.limit = parseInt(params.limit, 10)
    else params.limit = 0

    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      db.collection(params.collection).find(params.query, params.projection).limit(params.limit).toArray(function (e, docs) {
        if (e) return err(e)

        res(docs)
        db.close()
      })
    })
  })
}

MC.insert = function (params) {
  return new Promise(function (res, err) {
    if (!params.db || !params.collection || !params.data) return err('!params.db || !params.collection || !params.data')

    if (typeof params.data == 'string') {
      try {
        params.data = JSON.parse(params.data)

        for (var i = 0; i < params.data.length; i++) {
          var row = params.data[i]
          for (var key in row) {
            var item = row[key]
            if (reJsStrData.test(item)) params.data[i][key] = new Date(item)
          }
        }
      } catch (e) {
        err(e)
      }
    }

    if (!params.data.length) return err('nothing to save, empty array')

    params.keepGoing = params.keepGoing || false

    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      db.collection(params.collection).insert(params.data, {
        keepGoing: params.keepGoing
      }, function (e, r) {
        if (e) return err(e)

        res(r)
        db.close()
      })
    })
  })
}

MC.update = function (params) {
  return new Promise(function (res, err) {
    if (!params.db || !params.collection || !params.query || !params.update) return err('!params.db || !params.collection || !params.query || !params.update')

    if (params.query) {
      if (typeof params.query == 'string') {
        try {
          params.query = JSON.parse(params.query)
        } catch (e) {
          params.query = {}
          err(e)
        }
      }
    } else params.query = {}

    if (typeof params.update == 'string') {
      try {
        params.update = JSON.parse(params.update)
      } catch (e) {
        return err(e)
      }
    }

    for (var key in params.update) {
      var item = params.update[key]
      if (reJsStrData.test(item)) params.update[key] = new Date(item)
    }

    var updObj = {
      '$set': params.update
    }

    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      db.collection(params.collection).updateMany(params.query, updObj, function (e, r) {
        if (e) return err(e)

        res(r)
        db.close()
      })
    })
  })
}

MC.updateById = function (params) {
  return new Promise(function (res, err) {
    if (!params.db || !params.collection || !params.id || !params.update) return err('!params.db || !params.collection || !params.id || !params.update')

    var objId

    if (reMongoId.test(params.id)) {
      try {
        objId = new ObjectID(params.id)
      } catch (idErr) {
        console.warn(idErr)
      }
    }

    if (typeof params.update == 'string') {
      try {
        params.update = JSON.parse(params.update)
      } catch (e) {
        return err(e)
      }
    }

    for (var key in params.update) {
      var item = params.update[key]
      if (reJsStrData.test(item)) params.update[key] = new Date(item)
    }

    var updObj = {
      '$set': params.update
    }

    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      db.collection(params.collection).updateOne({
        _id: objId || params.id
      }, updObj, function (e, r) {
        if (e) return err(e)

        if (r.result.nModified || !objId) {
          res(r)
          db.close()
        } else {
          db.collection(params.collection).updateOne({
            _id: params.id
          }, updObj, function (e, r) {
            if (e) return err(e)

            res(r)
            db.close()
          })
        }
      })
    })
  })
}

MC.getById = function (params) {
  return new Promise(function (res, err) {
    if (!params.db || !params.collection || !params.id) return err('!params.db || !params.collection || !params.id')

    var objId

    if (reMongoId.test(params.id)) {
      try {
        objId = new ObjectID(params.id)
      } catch (idErr) {
        console.warn(idErr)
      }
    }

    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      db.collection(params.collection).findOne({
        _id: objId || params.id
      }, function (e, r) {
        if (e) return err(e)

        if (r || !objId) {
          res(r)
          db.close()
        } else {
          db.collection(params.collection).findOne({
            _id: params.id
          }, function (e, r) {
            if (e) return err(e)

            res(r)
            db.close()
          })
        }
      })
    })
  })
}

MC.removeById = function (params) {
  return new Promise(function (res, err) {
    if (!params.db || !params.collection || !params.id) return err('!params.db || !params.collection || !params.id')

    var objId

    if (reMongoId.test(params.id)) {
      try {
        objId = new ObjectID(params.id)
      } catch (idErr) {
        console.warn(idErr)
      }
    }

    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      db.collection(params.collection).remove({
        _id: objId || params.id
      }, function (e, r) {
        if (e) return err(e)

        if ((r.n === 1) || !objId) {
          res(r)
          db.close()
        } else {
          db.collection(params.collection).remove({
            _id: params.id
          }, function (e, r) {
            if (e) return err(e)

            res(r)
            db.close()
          })
        }
      })
    })
  })
}

MC.dropCollection = function (params) {
  return new Promise(function (res, err) {
    if (!params.db || !params.collection) return err('!params.db || !params.collection')

    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      db.collection(params.collection).drop(function (e, r) {
        if (e) return err(e)

        res(r)
        db.close()
      })
    })
  })
}

MC.distinct = function (params) {
  return new Promise(function (res, err) {
    if (!params.db || !params.collection || !params.field) return err('!params.db || !params.collection || !params.field')

    if (params.query) {
      if (typeof params.query == 'string') {
        try {
          params.query = JSON.parse(params.query)
        } catch (e) {
          params.query = {}
          err(e)
        }
      }
    } else params.query = {}

    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      db.collection(params.collection).distinct(params.field, params.query, function (e, r) {
        if (e) return err(e)

        res(r)
        db.close()
      })
    })
  })
}

MC.remove = function (params) {
  return new Promise(function (res, err) {
    if (!params.db || !params.collection || !params.query) return err('!params.db || !params.collection || !params.query')

    if (typeof params.query == 'string') {
      try {
        params.query = JSON.parse(params.query)
      } catch (e) {
        params.query = {}
        err(e)
      }
    }

    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      db.collection(params.collection).remove(params.query, function (e, r) {
        if (e) return err(e)

        res(r)
        db.close()
      })
    })
  })
}

MC.rename = function (params) {
  return new Promise(function (res, err) {
    if (!params.db || !params.collection || !params.old || !params.new) return err('!params.db || !params.collection || !params.old || !params.new')

    if (params.query) {
      if (typeof params.query == 'string') {
        try {
          params.query = JSON.parse(params.query)
        } catch (e) {
          params.query = {}
          err(e)
        }
      }
    } else params.query = {}

    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      var renameObj = {}
      renameObj[params.old] = params.new

      db.collection(params.collection).updateMany(params.query, {
        '$rename': renameObj
      }, function (e, r) {
        if (e) return err(e)

        res(r)
        db.close()
      })
    })
  })
}

MC.unsetField = function (params) {
  return new Promise(function (res, err) {
    if (!params.db || !params.collection || (!params.field && !params.fields)) return err('!params.db || !params.collection || !params.field(s)')

    if (params.query) {
      if (typeof params.query == 'string') {
        try {
          params.query = JSON.parse(params.query)
        } catch (e) {
          params.query = {}
          err(e)
        }
      }
    } else params.query = {}

    if (params.id) {
      if (reMongoId.test(params.id)) {
        try {
          params.query._id = new ObjectID(params.id)
        } catch (idErr) {
          console.warn(idErr)
        }
      } else params.query._id = params.id
    }

    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      var unsetObj = {}

      if (params.fields) {
        if (typeof params.fields == 'string')
          params.fields = JSON.parse(params.fields)

        params.fields.forEach(function (a) {
          unsetObj[a] = ''
        })
      } else unsetObj[params.field] = ''

      db.collection(params.collection).updateMany(params.query, {
        '$unset': unsetObj
      }, function (e, r) {
        if (e) return err(e)

        res(r)
        db.close()
      })
    })
  })
}

MC.listCollections = function (params) {
  return new Promise(function (res, err) {
    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      db.listCollections().toArray(function (e, docs) {
        if (e) return err(e)

        res(docs)
        db.close()
      })
    })
  })
}

MC.dbStats = function (params) {
  return new Promise(function (res, err) {
    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      db.stats(function (e, stats) {
        if (e) return err(e)

        res(stats)
        db.close()
      })
    })
  })
}

MC.collectionStats = function (params) {
  return new Promise(function (res, err) {
    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      db.collection(params.collection).stats(function (e, stats) {
        if (e) return err(e)

        res(stats)
        db.close()
      })
    })
  })
}

MC.listDatabases = function (params) {
  return new Promise(function (res, err) {
    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      var adminDb = db.admin()

      adminDb.listDatabases(function (e, dbs) {
        if (e) return err(e)

        res(dbs)
        db.close()
      })
    })
  })
}
