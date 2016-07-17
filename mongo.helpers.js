var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;

var MH = module.exports = {};

MH.find = function(params) {
  return new Promise(function(res, err) {
    if (!params.db || !params.collection) return err("!params.db || !params.collection");

    if (params.query) {
      try {
        params.query = JSON.parse(params.query);
      } catch (e) {
        params.query = {};
        err(e);
      }
    } else params.query = {};

    MongoClient.connect(params.db, function(e, db) {
      if (e) return err(e);

      db.collection(params.collection).find(params.query).toArray(function(e, docs) {
        if (e) return err(e);

        res(docs);
        db.close();
      });
    });
  });
};


MH.insert = function(params) {
  return new Promise(function(res, err) {

    if (!params.db || !params.collection || !params.data) return err("!params.db || !params.collection || !params.data");

    try {
      params.data = JSON.parse(params.data);
    } catch (e) {
      err(e);
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

    params.id = new ObjectID(params.id);

    try {
        params.update = JSON.parse(params.update);
      } catch (e) {
        return err(e);
      }

    MongoClient.connect(params.db, function(e, db) {
      if (e) return err(e);

      db.collection(params.collection).updateOne({
        _id: params.id
      }, params.update, function(e, r) {
        if (e) return err(e);

        res(r);
        db.close();
      });
    });
  });
};


MH.removeById = function(params) {
  return new Promise(function(res, err) {
    if (!params.db || !params.collection || !params.id) return err("!params.db || !params.collection || !params.id");

    params.id = new ObjectID(params.id);

    MongoClient.connect(params.db, function(e, db) {
      if (e) return err(e);

      db.collection(params.collection).remove({
        _id: params.id
      }, function(e, r) {
        if (e) return err(e);

        res(r);
        db.close();
      });
    });
  });
};


MH.listcollections = function(params) {
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


MH.stats = function(params) {
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