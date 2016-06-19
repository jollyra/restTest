var assert = require('chai').assert;
var restTest = require('../restTest');

describe('restTest', function() {
  describe('#getRestOfPageNums()', function () {
    it('should return multiple pages if there are more than 1', function () {
        var totalCount = 38;
        var firstPage = 1;
        var maxCountPerPage = 10;
        var pages = restTest.getRestOfPageNums(totalCount, firstPage, maxCountPerPage);
        assert.isArray(pages);
        assert.equal(pages.length, 3);
        assert.equal(pages[0], 2);
        assert.equal(pages[2], 4);
    });
    it('should return no pages if there is only one', function () {
        var totalCount = 10;
        var firstPage = 1;
        var maxCountPerPage = 10;
        var pages = restTest.getRestOfPageNums(totalCount, firstPage, maxCountPerPage);
        assert.isArray(pages);
        assert.equal(pages.length, 0);
    });
    it('should handle pagination starting from page 0', function () {
        var totalCount = 11;
        var firstPage = 0;
        var maxCountPerPage = 10;
        var pages = restTest.getRestOfPageNums(totalCount, firstPage, maxCountPerPage);
        assert.isArray(pages);
        assert.equal(pages.length, 1);
        assert.equal(pages[0], 1);
    });
  });
});
