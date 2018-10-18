const Datastore = require('nedb');

class DbWrapper {
  constructor() {
    const databaseFileName = process.env.NEDB_FILENAME ? process.env.NEDB_FILENAME : "users.db";

    this.db = new Datastore({
      filename: databaseFileName,
      autoload: true
    });
    this.db.ensureIndex({
      fieldName: 'uuid',
      unique: true
    }, function (err) {});
  };
  findOne(query) {
    return new Promise((resolve) => {
      this.db.findOne(query, (err, data) => {
        if (err) {
          console.error(err);
          return resolve(null);
        }
        console.log(data);
        return resolve(data);
      });
    });
  }
  findOrInsert(query, updateQuery) {
    return new Promise((resolve, reject) => {
      this.db.findOne(query, (err, doc) => {
        if (err) {
          return reject(err);
        }
        if (doc === null) {
          this.db.update(query, updateQuery, {
            upsert: true,
            returnUpdatedDocs: true
          }, function (err, numReplaced, data) {
            if (err) {
              return reject(err);
            }
            return resolve({
              num: numReplaced,
              data: data
            });
          });
        } else {
          return resolve({
            num: 0,
            data: doc
          });
        }
      });
    });
  };
  delete(query) {
    return new Promise((resolve, reject) => {
      this.db.remove(query, {}, (err, numRemoved) => {
        if (err) {
          console.error(err);
          return reject(err);
        }
        return resolve(numRemoved);
      });
    });
  };
}

module.exports = DbWrapper;