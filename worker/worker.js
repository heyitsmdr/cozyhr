// RabbitMQ
var amqpConnection = require('amqp').createConnection({
  host: 'rabbitmq.int.cozyhr.com',
  port: 5672,
  login: 'cozy',
  password: '#CF3fxEH9!',
  vhost: '/',
  clientProperties: { product: process.env.DYNO || 'worker.0' }
});
var env = (process.env.NODE_ENV || 'development');
var MetricService = require('../api/services/MetricService.js');

// Queues (qs)
var qs = [
  {
    name: 'EmailQueue',
    module: require('./queues/EmailQueue'),
    queueName: env.substr(0, 3) + '-queue-email',
    map: [{ route: 'send_email', action: 'sendEmail' }],
    instance: null
  }
];

amqpConnection.on('ready', function() {
  console.log('Connection established to AMQP server.');

  // Set up Queues
  qs.forEach(function(queue) {
    // Check instance
    if(queue.instance !== null) {
      console.log('[' + queue.name + '] Now consuming messages in ' + queue.queueName + '');
      return;
    }

    // Load the instance
    queue.instance = new queue.module();
    // Create the queue and bind to the exchange
    amqpConnection.queue(queue.queueName, { durable: true, autoDelete: false }, function(_q) {
      queue.instance._queue = _q;

      // Set up consumer
      _q.subscribe({ ack: true, prefetchCount: 1 }, function(message, headers, deliveryInfo) {
        for(var x = 0; x < queue.map.length; x++) {
          if(queue.map[x].route === deliveryInfo.routingKey) {
            try {
              queue.instance[queue.map[x].action](message, function() {
                MetricService.increment('rabbitmq.completed_requests');
                _q.shift(); // acknowledge
              });
            } catch(ex) {
              console.log(ex);
              MetricService.increment('rabbitmq.failed_requests');
              _q.shift(true, false); // reject, and don't add back to queue
            }
            break;
          }
        }
      });

      // Log
      console.log('[' + queue.name + '] Now consuming messages in ' + queue.queueName + '');
    });
  });

});

process.on('SIGINT', function() {
  amqpConnection.disconnect();
  console.log('Closing connection to AMQP server.');
  process.exit();
});