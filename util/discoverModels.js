/**
 * Run `node import.js` to import the test data into the db.
 */
var loopback = require('loopback');
var fs = require('fs');
var path = require('path');

var modelsDir = path.join(__dirname, '..', 'models-discovered');
var dataSourceConfig = require('../datasources.json')[process.env.DB || 'db'];

var db = loopback.createDataSource(dataSourceConfig);

// Tables we want to auto-discover
var include = [
    'PRODUCT',
    'INVENTORY',
    'LOCATION',
    'CUSTOMER'
];

// Check to see if the models-discovered directory exists
// If not then create it
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir); 
}

// Begin the Discovery Process
db.discoverModelDefinitions(function(err, models) {
    if (err) {
        console.log(err);
    } else {
        models.forEach(function(def) {
            if (~include.indexOf(def.name)) {
                console.log('Discovering Starting for Table: ', def.name);

                db.discoverSchema(def.name, function(err, schema) {
                    console.log('Writing JSON for Table: ', def.name);

                    fs.writeFileSync(
                        path.join(modelsDir, schema.name.toLowerCase() + '.json'),
                        JSON.stringify(schema, null, 2)
                    );

                    console.log('Discovery Complete for Table: ', def.name);
                });
            }
        });
    }
});