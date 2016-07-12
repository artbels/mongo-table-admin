var MongoClient = require('mongodb').MongoClient;

var MH = module.exports = {};

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
