const NodeCouchDb = require('node-couchdb');
const fs = require('fs');

const UpdateTag = require('./update-tag');

(() => {
  if (process.argv.length < 5) {
    console.warn('Please call with username password dbname.');
    return;
  }

  const DB_NAME = process.argv[4];

  // node-couchdb instance talking to external service
  const couch = new NodeCouchDb({
    host: 'localhost',
    protocol: 'http',
    port: 5984,
    auth: {
      user: process.argv[2],
      pass: process.argv[3],
    },
  });

  const couchInstance = new UpdateTag(couch, DB_NAME);
  const listOfNodes = JSON.parse(fs.readFileSync('./tags-input.json', 'utf8'));

  couchInstance.process(listOfNodes);
})();
