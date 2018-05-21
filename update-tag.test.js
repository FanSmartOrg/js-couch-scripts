import getNewTagSingleSelection from './update-tag';

describe('Test replacing single tag logic', () => {
  it('should return undefined if tag exists', () => {
    const tagList1 = ['all', 'cate1:tag1'];
    expect(getNewTagSingleSelection(tagList1, 'cate1:tag1')).toBeUndefined();
  });

  it('should add tag if no tag with same category exists', () => {
    const tagList1 = ['all'];
    const tagListNew1 = ['all', 'cate1:tag1'];
    const tagListNew2 = ['all', 'cate1:tag1', 'cate2:tag1'];
    expect(getNewTagSingleSelection(tagList1, 'cate1:tag1')).toEqual(tagListNew1);
    expect(getNewTagSingleSelection(tagListNew1, 'cate2:tag1')).toEqual(tagListNew2);
  });

  it('should replace a tag if a tag with same category exists', () => {
    const tagList1 = ['all', 'cate1:tag1'];
    const tagListNew1 = ['all', 'cate1:tag2'];
    expect(getNewTagSingleSelection(tagList1, 'cate1:tag2')).toEqual(tagListNew1);
  });
});
