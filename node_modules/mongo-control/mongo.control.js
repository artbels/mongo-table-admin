var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var reJsStrData = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z/i;
var reMongoId = /^[0-9a-f]{24}$/;

var MH = module.exports = {};

MH.count = function(params) {
  return new Promise(function(res, err) {
    if (!params.db || !params.collection) return err("!params.db || !params.collection");

    if (params.query && (typeof params.query == "string")) {
      try {
        params.query = JSON.parse(params.query);
      } catch (e) {
        params.query = {};
        err(e);
      }
    }

    MongoClient.connect(params.db, function(e, db) {
      if (e) return err(e);

      db.collection(params.collection).count(params.query, function(e, r) {
        if (e) return err(e);

        res(r);
        db.close();
      });
    });
  });
};


MH.find = function(params) {
  return new Promise(function(res, err) {
    if (!params.db || !params.collection) return err("!params.db || !params.collection");

    if (params.query && (typeof params.query == "string")) {
      try {
        params.query = JSON.parse(params.query);
      } catch (e) {
        params.query = {};
        err(e);
      }
    }

    if(params.limit) params.limit = parseInt(params.limit, 10);
    else params.limit = 0;

    MongoClient.connect(params.db, function(e, db) {
      if (e) return err(e);

      db.collection(params.collection).find(params.query).limit(params.limit).toArray(function(e, docs) {
        if (e) return err(e);

        res(docs);
        db.close();
      });
    });
  });
};


MH.insert = function(params) {
  return new Promise(function(res, err) {

    if (!params.db || !params.collection || !params.data || !params.data.length) return err("!params.db || !params.collection || !params.data");

    if (typeof params.data == "string") {
      try {
        params.data = JSON.parse(params.data);

        for (var i = 0; i < params.data.length; i++) {
          var row = params.data[i];
          for (var key in row) {
            var item = row[key];
            if (reJsStrData.test(item)) params.data[i][key] = new Date(item);
          }
        }

      } catch (e) {
        err(e);
      }
    }

    MongoClient.connect(params.db, function(e, db) {
      if (e) return err(e);

      db.collection(params.collection).insert(params.data, function(e, r) {
        if (e) return err(e);

        res(r);
        db.close();
      });
    });
  });
};


MH.updateById = function(params) {

  return new Promise(function(res, err) {
    if (!params.db || !params.collection || !params.id || !params.update) return err("!params.db || !params.collection || !params.id || !params.update");

    var objId;

    if (reMongoId.test(params.id)) {
      try {
        objId = new ObjectID(params.id);
      } catch (idErr) {
        console.warn(idErr);
      }
    }

    try {
      params.update = JSON.parse(params.update);
      for (var key in params.update) {
        var item = params.update[key];
        if (reJsStrData.test(item)) params.update[key] = new Date(item);
      }
    } catch (e) {
      return err(e);
    }

    var updObj = {
      "$set": params.update
    };

    MongoClient.connect(params.db, function(e, db) {
      if (e) return err(e);

      db.collection(params.collection).updateOne({
        _id: objId || params.id
      }, updObj, function(e, r) {
        if (e) return err(e);

        if (Object.keys(r).length || !objId) {
          res(r);
          db.close();

        } else {
          db.collection(params.collection).updateOne({
            _id: params.id
          }, updObj, function(e, r) {
            if (e) return err(e);

            res(r);
            db.close();
          });
        }
      });
    });
  });
};


MH.removeById = function(params) {
  return new Promise(function(res, err) {
    if (!params.db || !params.collection || !params.id) return err("!params.db || !params.collection || !params.id");

    var objId;

    if (reMongoId.test(params.id)) {
      try {
        objId = new ObjectID(params.id);
      } catch (idErr) {
        console.warn(idErr);
      }
    }

    try {
      params.update = JSON.parse(params.update);
      for (var key in params.update) {
        var item = params.update[key];
        if (reJsStrData.test(item)) params.update[key] = new Date(item);
      }
    } catch (e) {
      return err(e);
    }

    MongoClient.connect(params.db, function(e, db) {
      if (e) return err(e);

      db.collection(params.collection).remove({
        _id: objId || params.id
      }, function(e, r) {
        if (e) return err(e);

        if (Object.keys(r).length || !objId) {
          res(r);
          db.close();

        } else {
          db.collection(params.collection).remove({
            _id: params.id
          }, function(e, r) {
            if (e) return err(e);

            res(r);
            db.close();
          });
        }
      });
    });
  });
};


MH.dropCollection = function(params) {
  return new Promise(function(res, err) {
    if (!params.db || !params.collection) return err("!params.db || !params.collection");

    MongoClient.connect(params.db, function(e, db) {
      if (e) return err(e);

      db.collection(params.collection).drop(function(e, r) {
        if (e) return err(e);

        res(r);
        db.close();
      });
    });
  });
};


MH.distinct = function(params) {
  return new Promise(function(res, err) {
    if (!params.db || !params.collection || !params.field) return err("!params.db || !params.collection || !params.field");

    MongoClient.connect(params.db, function(e, db) {
      if (e) return err(e);

      db.collection(params.collection).distinct(params.field, function(e, r) {
        if (e) return err(e);

        res(r);
        db.close();
      });
    });
  });
};


MH.remove = function(params) {
  return new Promise(function(res, err) {
    if (!params.db || !params.collection) return err("!params.db || !params.collection");

    if (params.query && (typeof params.query == "string")) {
      try {
        params.query = JSON.parse(params.query);
      } catch (e) {
        params.query = {};
        err(e);
      }
    }

    MongoClient.connect(params.db, function(e, db) {
      if (e) return err(e);

      db.collection(params.collection).remove(params.query, function(e, r) {
        if (e) return err(e);

        res(r);
        db.close();
      });
    });
  });
};


MH.rename = function(params) {
  return new Promise(function(res, err) {
    if (!params.db || !params.collection || !params.old || !params.new) return err("!params.db || !params.collection || !params.old || !params.new");

    if (params.query) {
      if (typeof params.query == "string") {
        try {
          params.query = JSON.parse(params.query);
        } catch (e) {
          params.query = {};
          err(e);
        }
      }
    } else params.query = {};

    MongoClient.connect(params.db, function(e, db) {
      if (e) return err(e);

      var renameObj = {};
      renameObj[params.old] = params.new;

      db.collection(params.collection).updateMany(params.query, {
        "$rename": renameObj
      }, function(e, r) {
        if (e) return err(e);

        res(r);
        db.close();
      });
    });
  });
};


MH.unsetField = function(params) {
  return new Promise(function(res, err) {
    if (!params.db || !params.collection || !params.field) return err("!params.db || !params.collection || !params.field");

    if (params.query) {
      if(typeof params.query == "string") {
        try {
          params.query = JSON.parse(params.query);
        } catch (e) {
          params.query = {};
          err(e);
        }
      }
    } else params.query = {};

    MongoClient.connect(params.db, function(e, db) {
      if (e) return err(e);

      var unsetObj = {};
      unsetObj[params.field] = "";

      db.collection(params.collection).updateMany(params.query, {
        "$unset": unsetObj
      }, function(e, r) {
        if (e) return err(e);

        res(r);
        db.close();
      });
    });
  });
};


MH.listCollections = function(params) {
  return new Promise(function(res, err) {
    MongoClient.connect(params.db, function(e, db) {
      if (e) return err(e);

      db.listCollections().toArray(function(e, docs) {
        if (e) return err(e);

        res(docs);
        db.close();
      });
    });
  });
};


MH.dbStats = function(params) {
  return new Promise(function(res, err) {
    MongoClient.connect(params.db, function(e, db) {
      if (e) return err(e);

      db.stats(function(e, stats) {
        if (e) return err(e);

        res(stats);
        db.close();
      });
    });
  });
};


MH.collectionStats = function(params) {
  return new Promise(function(res, err) {
    MongoClient.connect(params.db, function(e, db) {
      if (e) return err(e);

      db.collection(params.collection).stats(function(e, stats) {
        if (e) return err(e);

        res(stats);
        db.close();
      });
    });
  });
};


MH.listDatabases = function(params) {
  return new Promise(function(res, err) {
    MongoClient.connect(params.db, function(e, db) {
      if (e) return err(e);

      var adminDb = db.admin();

      adminDb.listDatabases(function(e, dbs) {
        if (e) return err(e);

        res(dbs);
        db.close();
      });
    });
  });
};