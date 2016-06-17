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

function humanizeVendorName(name) {
    // console.log(name);
    return name;
}

// Quick and dirty deep copy of an object
function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

var transactions = [];
getTransactions()
    .then(function (res) {
        transactions = _.concat(transactions, res.transactions);
        var totalCount = res.totalCount;
        var page = res.page;
        var pagesLeft = _.ceil((totalCount - transactions.length) / transactions.length);
        // console.log('pagesLeft: ' + pagesLeft);
        var promises = [];
        for(var i = page + 1; i <= page + pagesLeft; i++) {
            promises.push(getTransactions(i));
        }
        return Promise.all(promises);
    }).then(function(things) {
        _.each(things, function(res) {
            transactions = _.concat(transactions, res.transactions);
        });
        console.log('# of transactions is ' + transactions.length);

        var totalBalance = calculateTotalBalance(transactions);  // Crunch the numbers
        console.log('total balance is ' + totalBalance);

        humanizedTransactions = _.map(transactions, function(t) {
            var t2 = deepCopy(t);
            t2.HumanizedCompany = humanizeVendorName(t2.Company);
            return t2;
        });
        // console.log(humanizedTransactions);

    }).catch(function (err) {
        console.log(err);
    });
