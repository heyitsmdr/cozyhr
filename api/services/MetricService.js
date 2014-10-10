var net = require('net');
var util = require('util');
var socket;
var isConnected = false;

var REPORT_INTERVAL = 10 * 1000; // 10 Seconds

function writeRaw(metric) {
  checkConnectionToGraphite(function() {
    sails.log.info(util.format("[metrics] %s.%s %s\n", (process.env.NODE_ENV || 'development') + '.' + (process.env.DYNO || 'local.0'), metric, Math.floor(Date.now() / 1000)));
    socket.write(util.format("%s.%s %s\n", (process.env.NODE_ENV || 'development') + '.' + (process.env.DYNO || 'local.0'), metric, Math.floor(Date.now() / 1000)));
  });
};

function checkConnectionToGraphite(callback) {
  if(isConnected) {
    return callback();
  }

  socket = net.createConnection(2003, "graphite.cozyhr.com");

  socket.on('connect', function() {
    sails.log.info('Metrics: Connected');
    isConnected = true;
    callback();
  });

  socket.on('timeout', function() {
    isConnected = false;
  });

  socket.on('close', function() {
    isConnected = false;
  });
};

module.exports = {
  writeRawMetric: function(metric) {
    writeRaw(metric);
  }
};