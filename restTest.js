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

var transactions = [];
getTransactions()
    .then(function (res) {
        transactions = _.concat(transactions, res.transactions);
        var promises = _.map(getRestOfPageNums(res.totalCount, res.page, res.transactions.length), function (pageNum) {
            return getTransactions(pageNum);
        });
        return Promise.all(promises);
    }).then(function(things) {
        _.each(things, function(res) {
            transactions = _.concat(transactions, res.transactions);
        });
        console.log('# of transactions is ' + transactions.length);

        var totalBalance = calculateTotalBalance(transactions);  // Crunch the numbers
        console.log('total balance is ' + totalBalance);

        _.each(transactions, function(transaction) {
            transaction.HumanizedCompany = humanizeVendorName(transaction.Company, humanizingRules);
        });
        console.log(transactions);

    }).catch(function (err) {
        console.log(err);
    });
