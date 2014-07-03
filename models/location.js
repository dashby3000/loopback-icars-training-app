/**
 * Module Dependencies
 */

var app = require("../app");
var loopback = require('loopback');

var GeoPoint = loopback.GeoPoint;

var geoRest = app.dataSources.geoRest;

/**
 * location Model
 */
var RentalLocation = app.models.Location;

/**
 * inventory Model
 */
var Inventory = app.models.Inventory;

/**
 * Each location has inventory.
 */

RentalLocation.hasMany(Inventory);

/**
 * Find nearby locations.
 */

RentalLocation.nearby = function(here, page, max, fn) {
    if (typeof page === 'function') {
        fn = page;
        page = 0;
        max = 0;
    }

    if (typeof max === 'function') {
        fn = max;
        max = 0;
    }

    var limit = 10;
    page = page || 0;
    max = Number(max || 100000);

    RentalLocation.find({
        // find locations near the provided GeoPoint
        where: {
            geo: {
                near: here,
                maxDistance: max
            }
        },
        // paging
        skip: limit * page,
        limit: limit
    }, fn);
};

/**
 * Expose nearby as a remote method.
 */

loopback.remoteMethod(
    RentalLocation.nearby, {
        description: 'Find nearby locations around the geo point',
        accepts: [{
            arg: 'here',
            type: 'GeoPoint',
            required: true,
            description: 'geo location (lat & lng)'
        }, {
            arg: 'page',
            type: 'Number',
            description: 'number of pages (page size=10)'
        }, {
            arg: 'max',
            type: 'Number',
            description: 'max distance in miles'
        }],
        returns: {
            arg: 'locations',
            root: true
        }
    }
);

/**
 * Build the geo data when saving using the google maps api.
 */
RentalLocation.beforeSave = function(next, loc) {
    // geo code the address
    if (!loc.geo) {
        geoRest.geocode(loc.street, loc.city, loc.state, function(err, result, res) {
            if (result && result[0]) {
                loc.geo = result[0].lng + ',' + result[0].lat;
                next();
            } else {
                next(new Error('could not find location'));
            }
        });
    } else {
        next();
    }
};