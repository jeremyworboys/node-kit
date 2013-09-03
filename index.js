module.exports = (process.env.TEST_COV) ? require('./lib-cov/node-kit') : require('./lib/node-kit');
