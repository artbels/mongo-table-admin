var MongoClient = require('mongodb').MongoClient
var ObjectID = require('mongodb').ObjectID

var reJsStrData = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z/i
var reMongoId = /^[0-9a-f]{24}$/

var MC = module.exports = {}

MC.incrId = function (params) {
  return new Promise(function (res, err) {
    if (!params.db || !params.collection) return err('!params.db || !params.collection')

    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      db.collection(params.collection).find().sort({_id: -1}).limit(1).toArray(function (e, r) {
        if (e) return err(e)

        if (!r && !r.length && !r[0]._id) return err(r)

        if (typeof r[0]._id !== 'number') return err('id is not a number')

        r[0]._id ++

        res(r[0]._id)
        db.close()
      })
    })
  })
}

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

    if (typeof params.index === 'string') {
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
      if (typeof params.query === 'string') {
        try {
          params.query = JSON.parse(params.query)
          for (var prop in params.query) {      
            var val = params.query[prop]
            if(val && val.oid) {
              params.query[prop] = new ObjectID(val.oid)
            }
          }
        } catch (e) {
          err(e)
        }
      }
      agrQuery.push({
        $match: params.query
      })
    }

    if (typeof params.fields === 'string') {
      params.fields = JSON.parse(params.fields)
    }

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
      if (typeof params.query === 'string') {
        try {
          params.query = JSON.parse(params.query)
        } catch (e) {
          params.query = {}
          err(e)
        }
      }
    } else params.query = {}

    for (var prop in params.query) {      
      var val = params.query[prop]
      if(val && val.oid) {
        params.query[prop] = new ObjectID(val.oid)
      }
    }

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
      if (typeof params.query === 'string') {
        try {
          params.query = JSON.parse(params.query)
        } catch (e) {
          params.query = {}
          err(e)
        }
      }
    } else params.query = {}

    for (var prop in params.query) {      
      var val = params.query[prop]
      if(val && val.oid) {
        params.query[prop] = new ObjectID(val.oid)
      }
    }

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
      if (typeof params.query === 'string') {
        try {
          params.query = JSON.parse(params.query)
        } catch (e) {
          params.query = {}
          err(e)
        }
      }
    } else params.query = {}

    for (var prop in params.query) {      
      var val = params.query[prop]
      if(val && val.oid) {
        params.query[prop] = new ObjectID(val.oid)
      }
    }

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
      if (typeof params.query === 'string') {
        try {
          params.query = JSON.parse(params.query)
        } catch (e) {
          params.query = {}
          err(e)
        }
      }
    } else params.query = {}

    for (var prop in params.query) {      
      var val = params.query[prop]
      if(val && val.oid) {
        params.query[prop] = new ObjectID(val.oid)
      }
    }

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
      if (typeof params.query === 'string') {
        try {
          params.query = JSON.parse(params.query)
        } catch (e) {
          params.query = {}
          err(e)
        }
      }
    } else params.query = {}

    for (var prop in params.query) {      
      var val = params.query[prop]
      if(val && val.oid) {
        params.query[prop] = new ObjectID(val.oid)
      }
    }

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
      if (typeof params.query === 'string') {
        try {
          params.query = JSON.parse(params.query)
        } catch (e) {
          params.query = {}
          err(e)
        }
      }
    } else params.query = {}

    for (var prop in params.query) {      
      var val = params.query[prop]
      if(val && val.oid) {
        params.query[prop] = new ObjectID(val.oid)
      }
    }

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
      if (typeof params.query === 'string') {
        try {
          params.query = JSON.parse(params.query)
        } catch (e) {
          params.query = {}
          err(e)
        }
      }
    } else params.query = {}

    for (var prop in params.query) {      
      var val = params.query[prop]
      if(val && val.oid) {
        params.query[prop] = new ObjectID(val.oid)
      }
    }

    var query
    if(params.query.$and) {
      query = params.query
    } else {
      query = {
        $and: [params.query]
      }
    }

    if(params.next) {
      var nextObj = {$or: []}
      if(reMongoId.test(params.next)) {
        nextObj.$or.push({_id: {$gt: new ObjectID(params.next)}})
      } else if(typeof params.next === 'number') {
        nextObj.$or.push({_id: {$gt: params.next}})
      }

      if(nextObj) {
        query.$and.push(nextObj)
        params.limit = 1
      }   

    } else if(params.prev) {
      var prevObj = {$or: []}
      if(reMongoId.test(params.prev)) {
        prevObj.$or.push({_id: {$lt: new ObjectID(params.prev)}})
      } else if(typeof params.prev === 'number') {
        prevObj.$or.push({_id: {$lt: params.prev}})
      }

      if(prevObj) {
        query.$and.push(prevObj)
        params.limit = 1
        params.sortBy = {_id: -1}
      }      
    }

    if (params.projection) {
      if (typeof params.projection === 'string') {
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

      db.collection(params.collection).find(query, params.projection).sort(params.sortBy).limit(params.limit).toArray(function (e, docs) {
        if (e) return err(e)

        res(docs)
        db.close()
      })
    })
  })
}

MC.lookup = function (params) {
  return new Promise(function (res, err) {
    if (!params.db || !params.collection || !params.foreignCollection) return err('!params.db || !params.collection || !params.foreignCollection')

    var pipeline = [{$lookup: {
          from: params.foreignCollection,
          localField: params.localField || params.foreignCollection,
          foreignField: params.foreignField || '_id',
          as: params.foreignCollection
        }}]

    if (params.query) {
      if (typeof params.query === 'string') {
        try {
          params.query = JSON.parse(params.query)
          pipeline.push({$match: params.query})
        } catch (e) {
          params.query = {}
          err(e)
        }
      }
    } else params.query = {}

    for (var prop in params.query) {      
      var val = params.query[prop]
      if(val && val.oid) {
        params.query[prop] = new ObjectID(val.oid)
      }
    }

    if (params.projection) {
      if (typeof params.projection === 'string') {
        try {
          params.projection = JSON.parse(params.projection)
          pipeline.push({$project: params.projection})
        } catch (e) {
          err(e)
        }
      }
    }

    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      db.collection(params.collection).aggregate(pipeline, function (e, docs) {
        if (e) return err(e)

        res(docs)
        db.close()
      })
    })
  })
}

MC.aggregate = function (params) {
  return new Promise(function (res, err) {
    if (!params.db || !params.collection || !params.pipeline) return err('!params.db || !params.collection || !params.pipeline')

    if (typeof params.pipeline === 'string') {
      try {
        params.pipeline = JSON.parse(params.pipeline)
      } catch (e) {
        err(e)
      }
    }

    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      db.collection(params.collection).aggregate(params.pipeline, function (e, docs) {
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

    if (typeof params.data === 'string') {
      try {
        params.data = JSON.parse(params.data)

        for (var i = 0; i < params.data.length; i++) {
          var row = params.data[i]
          for (var key in row) {
            var item = row[key]
            if (reJsStrData.test(item)) params.data[i][key] = new Date(item)
            else if(item.oid) params.data[i][key] = new ObjectID(item.oid)
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
      if (typeof params.query === 'string') {
        try {
          params.query = JSON.parse(params.query)
        } catch (e) {
          params.query = {}
          err(e)
        }
      }
    } else params.query = {}

    for (var prop in params.query) {      
      var val = params.query[prop]
      if(val && val.oid) {
        params.query[prop] = new ObjectID(val.oid)
      }
    }

    if (typeof params.update === 'string') {
      try {
        params.update = JSON.parse(params.update)
      } catch (e) {
        return err(e)
      }
    }

    for (var key in params.update) {
      var item = params.update[key]
      if(item.oid) {
        params.update[key] = new ObjectID(item.oid)
      } else if (reJsStrData.test(item)) params.update[key] = new Date(item)
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
    var unset = {}

    if (reMongoId.test(params.id)) {
      try {
        objId = new ObjectID(params.id)
      } catch (idErr) {
        console.warn(idErr)
      }
    }

    if (typeof params.update === 'string') {
      try {
        params.update = JSON.parse(params.update)
      } catch (e) {
        return err(e)
      }
    }

    for (var key in params.update) {
      var item = params.update[key]
      if (reJsStrData.test(item)) params.update[key] = new Date(item)
      else if(item.oid) params.update[key] = new ObjectID(item.oid)
      else if (item === '') {
        unset[key] = ''
        delete params.update[key]
      }
    }

    var updObj = {}
    if (Object.keys(params.update).length) updObj.$set = params.update
    if (Object.keys(unset).length) updObj.$unset = unset

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

MC.aggregateById = function (params) {
  return new Promise(function (res, err) {
    if (!params.db || !params.collection || !params.id) return err('!params.db || !params.collection || !params.id')

    params.pipeline = params.pipeline || []

    var query = {$or: [{_id: params.id}]}

    if (reMongoId.test(params.id)) {
      try {
        query.$or.push({_id: new ObjectID(params.id)})
      } catch (idErr) {
        console.warn(idErr)
      }
    }

    if (typeof params.pipeline === 'string') {
      try {
        params.pipeline = JSON.parse(params.pipeline)
      } catch (e) {
        err(e)
      }
    }

    params.pipeline.unshift({$match: query})

    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      db.collection(params.collection).aggregate(params.pipeline, function (e, docs) {
        if (e) return err(e)

        res(docs)
        db.close()
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
      if (typeof params.query === 'string') {
        try {
          params.query = JSON.parse(params.query)
        } catch (e) {
          params.query = {}
          err(e)
        }
      }
    } else params.query = {}

    for (var prop in params.query) {      
      var val = params.query[prop]
      if(val && val.oid) {
        params.query[prop] = new ObjectID(val.oid)
      }
    }

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

    if (typeof params.query === 'string') {
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
      if (typeof params.query === 'string') {
        try {
          params.query = JSON.parse(params.query)
        } catch (e) {
          params.query = {}
          err(e)
        }
      }
    } else params.query = {}

    for (var prop in params.query) {      
      var val = params.query[prop]
      if(val && val.oid) {
        params.query[prop] = new ObjectID(val.oid)
      }
    }

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

    var objId

    if (params.query) {
      if (typeof params.query === 'string') {
        try {
          params.query = JSON.parse(params.query)
        } catch (e) {
          params.query = {}
          err(e)
        }
      }
    } else params.query = {}

    for (var prop in params.query) {      
      var val = params.query[prop]
      if(val && val.oid) {
        params.query[prop] = new ObjectID(val.oid)
      }
    }

    if (params.id) {
      if (reMongoId.test(params.id)) {
        try {
          objId = new ObjectID(params.id)
          params.query._id = objId
        } catch (idErr) {
          console.warn(idErr)
        }
      } else params.query._id = params.id
    }

    MongoClient.connect(params.db, function (e, db) {
      if (e) return err(e)

      var unsetObj = {}

      if (params.fields) {
        if (typeof params.fields === 'string') {
          params.fields = JSON.parse(params.fields)
        }

        params.fields.forEach(function (a) {
          unsetObj[a] = ''
        })
      } else unsetObj[params.field] = ''

      db.collection(params.collection).updateMany(params.query, {
        '$unset': unsetObj
      }, function (e, r) {
        if (e) return err(e)

        if (r.result.nModified || !objId) {
          res(r)
          db.close()
        } else {
          params.query._id = params.id
          db.collection(params.collection).updateMany(params.query, {
            '$unset': unsetObj
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
