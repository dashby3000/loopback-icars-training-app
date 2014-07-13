var events = require('events');
var agent = require('strong-agent');
var app = require('../app');

var emitter = new events.EventEmitter();
module.exports = emitter;

var start;

var avgResponseStats = {
    segments: ["tiers.http.average"],
    checkInCount: 0,
    seriesData: [],
    when: null
}

var cpuStats = {
    segments: ["cpu.total", "cpu.user", "cpu.system"],
    checkInCount: 0,
    seriesData: [],
    when: null
}

var heapStats = {
    segments: ["gc.heap.used", "heap.total", "heap.used"],
    checkInCount: 0,
    seriesData: [0],
    when: null
}

var concurrencyStats = {
    segments: ["http.connections"],
    checkInCount: 0,
    seriesData: [],
    when: null
}

var eventLoopStats = {
    segments: ["loop.count", "loop.minimum", "loop.maximum", "loop.average"],
    checkInCount: 0,
    seriesData: [],
    when: null
}

var messageStats = {
    segments: ["messages.in.count", "messages.out.count"],
    checkInCount: 0,
    seriesData: [],
    when: null
}

agent.use(function(name, value) {
    var now = new Date();

    //console.log("Metric Reported: '%s' = '%d'", name, value);

    if (containsKey(avgResponseStats.segments, name)) {
        correlateAgentData(now, avgResponseStats, "avgResponseStats", name, value);
    } else if (containsKey(cpuStats.segments, name)) {
        correlateAgentData(now, cpuStats, "cpuStats", name, value);
    } else if (containsKey(heapStats.segments, name)) {
        correlateAgentData(now, heapStats, "heapStats", name, value);
    } else if (containsKey(concurrencyStats.segments, name)) {
        correlateAgentData(now, concurrencyStats, "concurrencyStats", name, value);
    } else if (containsKey(eventLoopStats.segments, name)) {
        correlateAgentData(now, eventLoopStats, "eventLoopStats", name, value);
    } else if (containsKey(messageStats.segments, name)) {
        correlateAgentData(now, messageStats, "messageStats", name, value);
    } else {
        console.log("Unexpected Stat Reported: '%s' = '%d'", name, value);
    }
});

start = process.hrtime();
setInterval(tick, 2 * 1000);

module.exports = function init (server) {

    app.io = require('socket.io')(server);

    app.io.stats = app.io.of('/stats-' + process.pid).on('connection', function(socket) {
        app.io.stats.emit('welcome', {message: 'Hello from http://localhost/stats-' + process.pid});
    });
}

function correlateAgentData(now, obj, segment, name, value) {

    var i = obj.segments.indexOf(name);

    obj.seriesData[i] = value;

    if (name !== "gc.heap.used") {
        obj.checkInCount++;
    }

    if (obj.when === null) {
        obj.when = now;
    }

    //console.log('"%s" @ { "%s" : "%d" }', now, name, value);
    //console.log(JSON.stringify(obj));

    if ((obj.checkInCount === obj.segments.length) || ((segment === "heapStats") && (obj.checkInCount === (obj.segments.length - 1)))) {
        var data = {
        	worker: process.pid,
            segment: segment,
            time: obj.when,
        }

        for (var i = 0; i < obj.segments.length; i++) {
            data[obj.segments[i]] = obj.seriesData[i];
        }

        console.log("EMITTING: '%s' = ", segment, JSON.stringify(data));

        app.io.stats.emit(segment, data);
        emitter.emit(segment, data);

        if (segment === "heapStats") {
            obj.seriesData = [0];
        } else {
            obj.seriesData = [];
        }

        obj.checkInCount = 0;
        obj.when = null;
    }
}

function containsKey(list, needle) {
    for (i in list) {
        if ((list[i] == needle) || (i === needle)) return true;
    }

    return false;
}

function tick() {
    var t = process.hrtime(start);

    app.io.stats.emit("tick", (60 - (t[0] % 60)));
}