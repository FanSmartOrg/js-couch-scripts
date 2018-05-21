const NodeCouchDb = require('node-couchdb');
const fs = require('fs');

export const getNewTagSingleSelection = (tagList, tagToUpdate) => {
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

export const getNewTagMultiSelection = (tagList, tagToUpdate) => {
  const existingTags = [];
  const newTagList = tagList.filter((tag) => {
    if (tag === tagToUpdate) {
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

  const updateTag = (nodeDoc, tag) => {
    const newData = JSON.parse(JSON.stringify(nodeDoc));
    const newTags = getNewTagSingleSelection(newData.tags, tag);

    if (newTags) {
      newData.tags = newTags;
      updateDoc(newData);
    }
  };

  const updateParentTag = (nodeDoc, tag) => {
    const newData = JSON.parse(JSON.stringify(nodeDoc));
    const newTags = getNewTagMultiSelection(newData.tags, tag);

    if (newTags) {
      newData.tags = newTags;
      updateDoc(newData);
    }
  };

  const pidSet = new Set();
  const listOfNodes = JSON.parse(fs.readFileSync('./tags-input.json', 'utf8'));
  listOfNodes.forEach((node) => {
    setTimeout(() => {
      getNode(node.id, (nodeDoc) => {
        updateTag(nodeDoc, node.tag);

        // Need to go through path here.
        if (nodeDoc.path && nodeDoc.path.length) {
          nodeDoc.path.forEach((pid) => {
            if (!pidSet.has(pid)) {
              pidSet.add(pid);
              getNode(node.id, (parentNodeDoc) => {
                updateParentTag(parentNodeDoc, node.tag);
              });
            }
          });
        }
      });
    }, 200);
  });
})();
