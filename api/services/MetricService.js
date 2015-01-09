var net = require('net');
var util = require('util');
var socket = false;
var isConnected = false;

var REPORT_INTERVAL = 10 * 1000; // 10 Seconds
var QUEUE = [];

var log = ((typeof sails !== 'undefined') ? sails.log : console);

function checkConnectionToGraphite(callback) {
  if(isConnected) {
    return callback();
  }

  socket = net.createConnection(2003, "graphite.cozyhr.com");

  socket.on('connect', function() {
    log.info('[MetricService]', 'Connection to Graphite established.');
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

function graphiteReporter() {
  if(QUEUE.length === 0) {
    return;
  }

  checkConnectionToGraphite(function() {
    QUEUE.forEach(function(queueMetric) {
      var _reportedMetric = util.format("%s.%s %s\n", (process.env.NODE_ENV || 'development') + '.' + (process.env.DYNO || 'web.0'), queueMetric.metric + ' ' + queueMetric.value, Math.floor(Date.now() / 1000));

      if(typeof sails !== 'undefined' && sails.config.consoleFiltering.metrics) {
        log.verbose('[MetricService]', 'Sending metric:', _reportedMetric.replace("\n", ""));
      } else {
        // When worker users this service
        log.info('[MetricService]', 'Sending metric:', _reportedMetric.replace("\n", ""));
      }

      socket.write(_reportedMetric);

      queueMetric.value = 0;
    });
  });
};

if(typeof sails === 'undefined' || sails.config.metricsEnabled !== false) {
  setInterval(graphiteReporter, REPORT_INTERVAL);
} else {
  log.info('[MetricService]', 'The metric service has been disabled by your config.');
}

module.exports = {
  increment: function(metric) {
    for(var i = 0; i < QUEUE.length; i++) {
      if(QUEUE[i].metric === metric) {
        QUEUE[i].value++;
        return;
      }
    }

    QUEUE.push({ metric: metric, value: 1 });
  },

  set: function(metric, value) {
    for(var i = 0; i < QUEUE.length; i++) {
      if(QUEUE[i].metric === metric) {
        QUEUE[i].value = value;
        return;
      }
    }

    QUEUE.push({ metric: metric, value: value });
  }
};