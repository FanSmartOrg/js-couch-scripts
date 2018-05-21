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
