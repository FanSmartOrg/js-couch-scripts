const NodeCouchDb = require('node-couchdb');
const fs = require('fs');

const getNewTagSingleSelection = (tagList, tagToUpdate) => {
  const [tk] = tagToUpdate.split(':');
  const existingTags = [];
  const newTagList = tagList.filter((tag) => {
    const [k] = tag.split(':');
    if (k === tk) {
      existingTags.push(tag);
      return false;
    }

    return true;
  });

  if (existingTags.length > 0) {
    if (!existingTags.find(tag => tag !== tagToUpdate)) {
      return undefined;
    }
  }

  newTagList.push(tagToUpdate);
  return newTagList;
};

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

  const updateDoc = (docWithOldRev) => {
    // console.log(docWithOldRev);
    couch.update(DB_NAME, docWithOldRev).then(({ status }) => {
      // data is json response
      // headers is an object with all response headers
      // status is statusCode number
      // console.log('Data:', data, '\n\nHeader:', headers, '\n\nStatus:', status);
      console.log(docWithOldRev._id, status); // eslint-disable-line
    }, (err) => {
      // either request error occured
      // ...or err.code=EDOCMISSING if document is missing
      // ...or err.code=EUNKNOWN if statusCode is unexpected
      console.error(err);
    });
  };

  const getNode = (nodeId, callback) => {
    couch.get(DB_NAME, nodeId).then(({ data }) => {
      // data is json response
      // headers is an object with all response headers
      // status is statusCode number
      // console.log('Data:', data, '\n\nHeader:', headers, '\n\nStatus:', status);
      callback(data);
    }, (err) => {
      // either request error occured
      // ...or err.code=EDOCMISSING if document is missing
      // ...or err.code=EUNKNOWN if statusCode is unexpected
      console.error(err);
    });
  };

  const listOfNodes = JSON.parse(fs.readFileSync('./tags-input.json', 'utf8'));
  listOfNodes.forEach((node) => {
    getNode(node.id, (data) => {
      const newData = JSON.parse(JSON.stringify(data));
      const newTags = getNewTagSingleSelection(newData.tags, node.tag);

      if (newTags) {
        newData.tags = newTags;
        updateDoc(newData);
      }
    });
  });
})();

export default getNewTagSingleSelection;
