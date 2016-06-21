var rp = require('request-promise');
var _ = require('lodash');
var math = require('mathjs');


function calculateBalance(transactions) {
    var total =  _.reduce(transactions, function(sum, transaction) {
        var amount = math.eval(transaction.Amount);
        if(!isFinite(amount)) {
            throw new TypeError('transaction amount must be a valid number\n' + JSON.stringify(transaction, null, ' '));
        }
        return math.add(sum, amount);
    }, 0);
    return total;
}

}

var humanizingRules = [
    function removeCreditCard(str) { return str.replace(/x{4,}\d+\s?/, ''); },  // e.g. 'xxxxxxxx6414'
    function removeLocationNumber(str) { return str.replace(/#[a-z]?\d+\s?/, ''); },  // e.g. '#x7618'
    function removeWhiteSpace(str) { return str.trim(); },
    // etc...
];

function humanizeVendorName(name, rules) {
    return _.reduce(rules, function(str, rule) {
        return rule(str);
    }, name);
}

function compareTransactions(t1, t2) {
    var isEqual = t1.Ledger === t2.Ledger && t1.Amount === t2.Amount &&
        t1.Company === t2.Company && t1.Date === t2.Date;
    if(isEqual) {
        console.log('found duplicate transaction: ', JSON.stringify(t1));
    }
    return isEqual;
}

function removeDuplicates(transactions) {
    return _.uniqWith(transactions, compareTransactions);
}

function getTransactionsByCategory(transactions) {
    return _.groupBy(transactions, function (transaction) {
        return transaction.Ledger;
    });
}

function calculateCategoryTotals(categories) {
    var totals = {};
    _.forEach(categories, function(transactions, category) {
        totals[category] = calculateBalance(transactions);
    });
    return totals;
}

function filterByDate(transactions, endDate, startDate) {
    if(startDate) {
        if(typeof startDate !== 'string') {
            throw new TypeError('startDate must be of type string');
        }
        startDate = new Date(startDate);
    }
    if(endDate) {
        if(typeof endDate !== 'string') {
            throw new TypeError('endDate must be of type string');
        }
        endDate = new Date(endDate);
    }
    return _.filter(transactions, function(transaction) {
        var d = new Date(transaction.Date);
        var inRange = true;
        if (startDate) {
            inRange = inRange && (startDate <= d);
        }
        if (endDate) {
            inRange = inRange && (d <= endDate);
        }
        return inRange;
    });
}

// Demo for running total for each day that occurs in the list of transactions
function calculateDailyRunningTotal(transactions) {
    var dates = _.uniq(_.map(transactions, 'Date'));
    var runningTotals = {};
    _.forEach(dates, function(date) {
        runningTotals[date] = calculateBalance(filterByDate(transactions, date));
    });
    return runningTotals;
}

function demo(transactions) {
    console.log('\nSummary of transactions');
    console.log('=======================');
    console.log('downloaded %d transactions', transactions.length);

    var totalBalance = calculateBalance(transactions);
    console.log('total balance is $%d', totalBalance);

    _.forEach(transactions, function(transaction) {
        transaction.HumanizedCompany = humanizeVendorName(transaction.Company, humanizingRules);
    });

    console.log('\ncompany name improvements');
    console.log('--------------------------');
    _.forEach(transactions, function(transaction) {
        console.log('original name:  %s', transaction.Company);
        console.log('humanized name: %s', transaction.HumanizedCompany);
    });
    console.log('\n');

    var dedupedTransactions = removeDuplicates(transactions);
    console.log('removed %d duplicate transactions', transactions.length - dedupedTransactions.length);

    var categorized = getTransactionsByCategory(transactions);
    console.log('\ntransactions listed by category');
    console.log('-------------------------------');
    console.log(categorized);
    console.log('\n');

    var catagoryTotals = calculateCategoryTotals(categorized);
    console.log('\ntotal expenses by category');
    console.log('--------------------------');
    console.log(catagoryTotals);
    console.log('\n');

    var runningTotals = calculateDailyRunningTotal(transactions);
    console.log('\nrunning total for each day represented in the transaction list');
    console.log('--------------------------------------------------------------');
    console.log(runningTotals);
    console.log('\n');
}

function getTransactions(page) {
    page = page || 1;  // This paginated API starts at page 1
    var options = {
        uri: 'http://resttest.bench.co/transactions/' + page + '.json',
        json: true
    };
    return rp(options);
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

module.exports = {
    // Exported for unit testing
    calculateBalance: calculateBalance,
    getRestOfPageNums: getRestOfPageNums,
    compareTransactions: compareTransactions,
    filterByDate: filterByDate,
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
        _.forEach(pages, function(res) {
            transactions = _.concat(transactions, res.transactions);
        });
        demo(transactions);
    }).catch(function (err) {
        console.log(err);
    });
