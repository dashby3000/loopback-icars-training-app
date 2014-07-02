/**
 * Run `node import.js` to import the test data into the db.
 */

var app = require("../app");
var loopback = require('loopback');
var db = require('../util/dataSourceSelector');
var async = require('async');
var events = require('events');
var emitter = new events.EventEmitter();
module.exports = emitter;

var carsData = require('./cars.json');
var customersData = require('./customers.json');
var inventoryData = require('./inventory.json');
var locationsData = require('./locations.json');

var InventoryModel = app.models.Inventory;
var LocationModel = app.models.Location;
var CustomerModel = app.models.Customer;
var CarModel = app.models.Car;

var ids = {};

function importData(Model, data, cb) {
    console.log('Importing data for ' + Model.modelName);

    Model.destroyAll(function(err) {
        if (err) {
            cb(err);
            return;
        }
        async.each(data, function(d, callback) {
            if (ids[Model.modelName] === undefined) {
                ids[Model.modelName] = 1;
            }
            d.id = ids[Model.modelName]++;
            Model.create(d, callback);
        }, cb);
    });
}

async.series(
    [
        function(cb) {
            db.autoupdate(cb);
        },

        importData.bind(null, LocationModel, locationsData),
        importData.bind(null, CarModel, carsData),
        importData.bind(null, InventoryModel, inventoryData),
        importData.bind(null, CustomerModel, customersData)
    ], function(err, results) {
        if (err) {
            console.error(err);
            emitter.emit('error', err);
        } else {
            emitter.emit('done');
        }
    });