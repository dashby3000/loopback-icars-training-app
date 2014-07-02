var app = require("../app");
var util = require('util');

var DB = (process.env.DB = process.env.DB || 'db');

var dataSource = module.exports = app.dataSources[DB];

if (dataSource == undefined) {
	dataSource = module.exports = app.dataSources.db;
   	console.log("dataSourceSelector.js could not load the specificed connector - Using Memory Connector");
} else {
   	console.log(util.format('dataSourceSelector.js has loaded the "%s" connector.', DB));
}

/*
if (DB === 'db') {
  process.nextTick(function () {
    // import data
    require('../test-data/import');
  });
}
*/