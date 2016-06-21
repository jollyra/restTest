var assert = require('chai').assert;
var restTest = require('../restTest');

describe('restTest', function() {
  describe('#calculateBalance()', function () {
    it('should sum multiple transactions', function () {
        var transactions = [{
            Amount: "-10.10",
        }, {
            Amount: "-8.12",
        }, {
            Amount: "0.21",
        }];
        assert.equal(restTest.calculateBalance(transactions), -18.01);
    });
    it('should handle summing 0 transactions', function () {
        var transactions = [];
        assert.equal(restTest.calculateBalance(transactions), 0);
    });
    it('should throw if transaction amounts are invalid floats', function () {
        var transactions = [{
            Amount: "aaa",
        }];
        var fn = function() {
            restTest.calculateBalance(transactions);
        }
        assert.throws(fn, /Undefined symbol/);
    });
  });

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

  describe('#compareTransactions()', function () {
    it('should return true if transactions are equal', function () {
        var transactions = [{
            Date: "2013-12-22",
            Ledger: "Phone & Internet Expense",
            Amount: "-110.71",
            Company: "SHAW CABLESYSTEMS CALGARY AB"
        }, {
            Date: "2013-12-22",
            Ledger: "Phone & Internet Expense",
            Amount: "-110.71",
            Company: "SHAW CABLESYSTEMS CALGARY AB"
        }];
        assert.equal(restTest.compareTransactions(transactions[0], transactions[1]), true);
    });
    it('should return false if transactions are almost equal', function () {
        var transactions = [{
            Ledger: "Phone & Internet Expense",
            Amount: "-110.71",
        }, {
            Date: "2013-12-22",
            Ledger: "Phone & Internet Expense",
            Amount: "-110.71",
            Company: "SHAW CABLESYSTEMS CALGARY AB"
        }];
        assert.equal(restTest.compareTransactions(transactions[0], transactions[1]), false);
    });
  });

  describe('#filterByDate()', function () {
    it('should filter out transactions that aren\'t in it the date range', function () {
        var transactions = [{
            Date: "2013-12-23",
        }, {
            Date: "2013-12-22",
        }, {
            Date: "2013-12-21",
        }, {
            Date: "2013-12-19",
        }];
        var startDate = "2013-12-21";
        var endDate = "2013-12-23";
        var filteredTransactions = restTest.filterByDate(transactions, endDate, startDate);
        assert.isArray(filteredTransactions);
        assert.equal(filteredTransactions.length, 3);
    });
    it('should not need to specify start date', function () {
        var transactions = [{
            Date: "2013-12-23",
        }, {
            Date: "2013-12-22",
        }, {
            Date: "2013-12-21",
        }, {
            Date: "2013-12-19",
        }];
        var endDate = "2013-12-22";
        var filteredTransactions = restTest.filterByDate(transactions, endDate);
        assert.isArray(filteredTransactions);
        assert.equal(filteredTransactions.length, 3);
    });
    it('should throw if date isn\'t a string', function () {
        var transactions = [{
            Date: "2013-12-19",
        }];
        var endDate = new Date("2013-12-22");
        var fn = function() {
            restTest.filterByDate(transactions, endDate);
        }
        assert.throws(fn, TypeError);
    });
  });
});
