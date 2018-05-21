
class UpdateTag {
  constructor(couch, dbName) {
    this.couch = couch;
    this.dbName = dbName;
  }

  static getNewTagList(filteredList, existingTags, newTag) {
    if (existingTags.length > 0) {
      if (!existingTags.find(tag => tag !== newTag)) {
        return undefined;
      }
    }

    filteredList.push(newTag);
    return filteredList;
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

    return UpdateTag.getNewTagList(newTagList, existingTags, tagToUpdate);
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

    return UpdateTag.getNewTagList(newTagList, existingTags, tagToUpdate);
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

  applyNewTagsToDoc(nodeDoc, newTags) {
    const newData = JSON.parse(JSON.stringify(nodeDoc));
    if (newTags) {
      newData.tags = newTags;
      this.updateDoc(newData);
    }
  }

  updateTag(nodeDoc, tag) {
    const newTags = UpdateTag.getNewTagSingleSelection(nodeDoc.tags, tag);
    this.applyNewTagsToDoc(nodeDoc, newTags);
  }

  updateParentTag(nodeDoc, tag) {
    const newTags = UpdateTag.getNewTagMultiSelection(nodeDoc.tags, tag);
    this.applyNewTagsToDoc(nodeDoc, newTags);
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
              // Optimize for tree.
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
