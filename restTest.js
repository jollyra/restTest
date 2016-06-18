var rp = require('request-promise');
var _ = require('lodash');


function getTransactions(page) {
    page = page || 1;  // This paginated API starts at page 1
    var options = {
        uri: 'http://resttest.bench.co/transactions/' + page + '.json',
        json: true
    };
    return rp(options);
}

function calculateTotalBalance(transactions) {
    return _.reduce(transactions, function(sum, transaction) {
        return sum + parseFloat(transaction.Amount);
    }, 0);
}

var humanizingRules = [
    function removeCreditCard(str) { return str.replace(/x{4,}\d+\s?/, ''); },  // e.g. 'xxxxxxxx6414'
    function removeLocationNumber(str) { return str.replace(/#[a-z]?\d+\s?/, ''); },  // e.g. '#x7618'
    function removeWhiteSpace(str) { return str.trim(); }
];

function humanizeVendorName(name, rules) {
    rules = rules || [];
    _.each(rules, function(rule) {
        name = rule(name);
    });
    return name;
}

// Quick and dirty deep copy of an object
function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function getRestOfPageNums(totalCount, firstPage, maxCountPerPage) {
    var pagesLeft = _.ceil((totalCount - maxCountPerPage) / maxCountPerPage);
    var secondPage = firstPage + 1;
    var lastPage = firstPage + pagesLeft;
    var restOfPageNums = [];
    for(var i = secondPage; i <= lastPage; i++) {
        restOfPageNums.push(i);
    }
    return restOfPageNums;
}

function compareTransactions(t1, t2) {
    var isEqual = t1.Ledger === t2.Ledger && t1.Amount === t2.Amount &&
        t1.Company === t2.Company && t1.Date === t2.Date;
    if(isEqual) {
        console.log('found duplicate transaction: ', t1);
    }
    return isEqual;
}

function removeDuplicates(transactions) {
    return _.uniqWith(transactions, compareTransactions);
}

var transactions = [];
getTransactions()
    .then(function (res) {
        transactions = _.concat(transactions, res.transactions);
        var promises = _.map(getRestOfPageNums(res.totalCount, res.page, res.transactions.length), function (pageNum) {
            return getTransactions(pageNum);
        });
        return Promise.all(promises);
    }).then(function(pages) {
        _.each(pages, function(res) {
            transactions = _.concat(transactions, res.transactions);
        });
        console.log('downloaded %d transactions', transactions.length);

        var totalBalance = calculateTotalBalance(transactions);  // Crunch the numbers
        console.log('total balance is $%d', totalBalance);

        _.each(transactions, function(transaction) {
            transaction.HumanizedCompany = humanizeVendorName(transaction.Company, humanizingRules);
        });
        // console.log(transactions);

        var dedupedTransactions = removeDuplicates(transactions);
        console.log('removed %d duplicate transactions', transactions.length - dedupedTransactions.length);

    }).catch(function (err) {
        console.log(err);
    });
