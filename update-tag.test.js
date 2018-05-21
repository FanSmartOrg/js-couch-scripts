const UpdateTag = require('./update-tag');

describe('Test replacing single tag logic', () => {
  it('should return undefined if tag exists', () => {
    const tagList1 = ['all', 'cate1:tag1'];
    expect(UpdateTag.getNewTagSingleSelection(tagList1, 'cate1:tag1')).toBeUndefined();
  });

  it('should add tag if no tag with same category exists', () => {
    const tagList1 = ['all'];
    const tagListNew1 = ['all', 'cate1:tag1'];
    const tagListNew2 = ['all', 'cate1:tag1', 'cate2:tag1'];
    expect(UpdateTag.getNewTagSingleSelection(tagList1, 'cate1:tag1')).toEqual(tagListNew1);
    expect(UpdateTag.getNewTagSingleSelection(tagListNew1, 'cate2:tag1')).toEqual(tagListNew2);
  });

  it('should replace a tag if a tag with same category exists', () => {
    const tagList1 = ['all', 'cate1:tag1'];
    const tagListNew1 = ['all', 'cate1:tag2'];
    expect(UpdateTag.getNewTagSingleSelection(tagList1, 'cate1:tag2')).toEqual(tagListNew1);
  });
});

describe('Test replacing multi tag logic', () => {
  it('should return undefined if tag exists', () => {
    const tagList1 = ['all', 'cate1:tag1'];
    expect(UpdateTag.getNewTagMultiSelection(tagList1, 'cate1:tag1')).toBeUndefined();
  });

  it('should add tag if no tag with same category exists', () => {
    const tagList1 = ['all'];
    const tagListNew1 = ['all', 'cate1:tag1'];
    const tagListNew2 = ['all', 'cate1:tag1', 'cate2:tag1'];
    expect(UpdateTag.getNewTagMultiSelection(tagList1, 'cate1:tag1')).toEqual(tagListNew1);
    expect(UpdateTag.getNewTagMultiSelection(tagListNew1, 'cate2:tag1')).toEqual(tagListNew2);
  });

  it('should add tag if a tag with same category exists', () => {
    const tagList1 = ['all', 'cate1:tag1'];
    const tagListNew1 = ['all', 'cate1:tag1', 'cate1:tag2'];
    expect(UpdateTag.getNewTagMultiSelection(tagList1, 'cate1:tag2')).toEqual(tagListNew1);
  });
});

describe('Test process assign category', () => {
  const mockDb = {
    root: { _id: 'root', path: [], tags: ['all', 'Cate1:Tag1'] },
    p1: { _id: 'p1', path: ['root'], tags: ['all', 'Cate1:Tag1'] },
    p2: { _id: 'p2', path: ['root'], tags: ['all'] },
    c11: { _id: 'c11', path: ['root', 'p1'], tags: ['all', 'Cate1:Tag1'] },
    c12: { _id: 'c12', path: ['root', 'p1'], tags: ['all'] },
    c21: { _id: 'c21', path: ['root', 'p2'], tags: ['all'] },
    c22: { _id: 'c22', path: ['root', 'p2'], tags: ['all'] },
  };

  let updateCallParams = [];

  const mockCouch = {
    update: jest.fn((dbName, doc) => {
      updateCallParams.push(doc);
      return Promise.resolve({ status: 201 });
    }),
    get: jest.fn((dbName, nodeId) => {
      // console.log(dbName, nodeId);
      if (mockDb[nodeId]) {
        return Promise.resolve({ data: mockDb[nodeId] });
      }

      return Promise.reject(new Error('Node not found'));
    }),
  };

  beforeEach(() => {
    updateCallParams = [];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle normal assign tag behavior', (done) => {
    const listOfNodes = [
      { id: 'c11', tag: 'Cate1:Tag1' },
      { id: 'c12', tag: 'Cate1:Tag2' },
      { id: 'c21', tag: 'Cate1:Tag1' },
      { id: 'c22', tag: 'Cate1:Tag1' },
    ];

    const dbName = 'db_name';
    const updateInstance = new UpdateTag(mockCouch, dbName);

    updateInstance.process(listOfNodes);

    setTimeout(() => {
      expect(mockCouch.update).toHaveBeenCalledTimes(6);
      expect(updateCallParams.sort((a, b) => a._id > b._id)).toEqual([  // eslint-disable-line
        { _id: 'c12', path: ['root', 'p1'], tags: ['all', 'Cate1:Tag2'] },
        { _id: 'c21', path: ['root', 'p2'], tags: ['all', 'Cate1:Tag1'] },
        { _id: 'c22', path: ['root', 'p2'], tags: ['all', 'Cate1:Tag1'] },
        { _id: 'p1', path: ['root'], tags: ['all', 'Cate1:Tag1', 'Cate1:Tag2'] },
        { _id: 'p2', path: ['root'], tags: ['all', 'Cate1:Tag1'] },
        { _id: 'root', path: [], tags: ['all', 'Cate1:Tag1', 'Cate1:Tag2'] },
      ]);

      done();
    }, 1000);
  });

  it('should make sure parent level assigned correctly', (done) => {
    const listOfNodes = [
      { id: 'c11', tag: 'Cate1:Tag2' },
    ];

    const dbName = 'db_name';
    const updateInstance = new UpdateTag(mockCouch, dbName);

    updateInstance.process(listOfNodes);

    setTimeout(() => {
      expect(mockCouch.update).toHaveBeenCalledTimes(3);
      expect(updateCallParams.sort((a, b) => a._id > b._id)).toEqual([  // eslint-disable-line
        { _id: 'c11', path: ['root', 'p1'], tags: ['all', 'Cate1:Tag2'] },
        { _id: 'p1', path: ['root'], tags: ['all', 'Cate1:Tag2'] },
        { _id: 'root', path: [], tags: ['all', 'Cate1:Tag2'] },
      ]);

      done();
    }, 300);
  });
});
