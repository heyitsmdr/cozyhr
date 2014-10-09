var net = require('net');
var util = require('util');
var socket;
var isConnected = false;

var REPORT_INTERVAL = 10 * 1000; // 10 Seconds
var GRAPHITE_API_KEY = "fe67ecd0-c4ca-4c6d-962f-a0eced6bfc4a";

function writeRaw(metric) {
  checkConnectionToGraphite(function() {
    console.log(util.format("%s.%s\n", GRAPHITE_API_KEY, metric));
    socket.write(util.format("%s.%s\n", GRAPHITE_API_KEY, metric));
  });
};

function checkConnectionToGraphite(callback) {
  if(isConnected) {
    return callback();
  }

  socket = net.createConnection(2003, "carbon.hostedgraphite.com");

  socket.on('connect', function() {
    console.log('Connected to Hosted Graphite');
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