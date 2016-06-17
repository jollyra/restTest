var rp = require('request-promise'),
    _ = require('lodash');

rp('http://resttest.bench.co/transactions/1.json')
    .then(function (res) {
        console.log(res);
    }).catch(function (err) {
        console.log(err);
    });
