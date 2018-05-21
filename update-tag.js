
class UpdateTag {
  constructor(couch, dbName) {
    this.couch = couch;
    this.dbName = dbName;
  }

  static getNewTagSingleSelection(tagList, tagToUpdate) {
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
  }

  static getNewTagMultiSelection(tagList, tagToUpdate) {
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
  }

  updateDoc(docWithOldRev) {
    // console.log(docWithOldRev);
    this.couch.update(this.dbName, docWithOldRev).then(({ status }) => {
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
  }

  getNode(nodeId, callback) {
    this.couch.get(this.dbName, nodeId).then(({ data }) => {
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
  }

  updateTag(nodeDoc, tag) {
    const newData = JSON.parse(JSON.stringify(nodeDoc));
    const newTags = UpdateTag.getNewTagSingleSelection(newData.tags, tag);

    if (newTags) {
      newData.tags = newTags;
      this.updateDoc(newData);
    }
  }

  updateParentTag(nodeDoc, tag) {
    const newData = JSON.parse(JSON.stringify(nodeDoc));
    const newTags = UpdateTag.getNewTagMultiSelection(newData.tags, tag);

    if (newTags) {
      newData.tags = newTags;
      this.updateDoc(newData);
    }
  }

  process(listOfNodes) {
    const pidSet = new Set();

    listOfNodes.forEach((node) => {
      setTimeout(() => {
        this.getNode(node.id, (nodeDoc) => {
          this.updateTag(nodeDoc, node.tag);

          // Need to go through path here.
          if (nodeDoc.path && nodeDoc.path.length) {
            nodeDoc.path.forEach((pid) => {
              if (!pidSet.has(pid + node.tag)) {
                pidSet.add(pid + node.tag);
                this.getNode(pid, (parentNodeDoc) => {
                  this.updateParentTag(parentNodeDoc, node.tag);
                });
              }
            });
          }
        });
      }, 200);
    });
  }
}

module.exports = UpdateTag;
