var rp = require('request-promise'),
    _ = require('lodash');


function getTransactions(page) {
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

function main() {
    var transactions = [];
    getTransactions(1)
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
            var totalBalance = calculateTotalBalance(transactions);  // Crunch the numbers
            console.log('total balance is ' + totalBalance);
            console.log('# of transactions is ' + transactions.length);
        }).catch(function (err) {
            console.log(err);
        });
}

main();
