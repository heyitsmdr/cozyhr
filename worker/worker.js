// RabbitMQ
var amqpConnection = require('amqp').createConnection({ url: "amqp://lu00GelV:-KdaPhbsdrAk70Af8seGdTb5hDglCcWU@furry-willow-20.bigwig.lshift.net:11142/R4MZ5zE8NSMd", clientProperties: { product: process.env.DYNO || 'worker.0' } });
var exchangeName = 'cozyhr-' + (process.env.NODE_ENV || 'development');
var exchange;

// Queues (qs)
var qs = [
  {
    name: 'EmailQueue',
    module: require('./queues/EmailQueue'),
    queueName: 'queue-email',
    map: [{ route: 'send_email', action: 'sendEmail' }]
  }
];

amqpConnection.on('ready', function() {
  console.log('RabbitMQ: Connected and ready.');

  exchange = amqpConnection.exchange( exchangeName );

  exchange.on('open', function() {
    console.log('RabbitMQ: Exchange opened (' + exchange.name + ')');
    // Set up Queues
    qs.forEach(function(queue) {
      // Load the instance
      queue.instance = new queue.module();
      // Create the queue and bind to the exchange
      amqpConnection.queue(queue.queueName, { autoDelete: false }, function(_q) {
        queue.instance._queue = _q;
        // Bind based on mappings
        queue.map.forEach(function(mapping) {
          _q.bind(exchange.name, mapping.route);
        });
        // Set up consumer
        _q.subscribe({ ack: true, prefetchCount: 5 }, function(message, headers, deliveryInfo, ack) {
          for(var x = 0; x < queue.map.length; x++) {
            if(queue.map[x].route == deliveryInfo.routingKey) {
              try {
                eval('queue.instance.' + queue.map[x].action)(message);
                ack.acknowledge();
              } catch(ex) {
                console.log(ex);
              }
              break;
            }
          };
        });
        // Output
        _q.on('queueBindOk', function() {
          console.log('RabbitMQ[' + queue.name + ']: Now consuming messages in ' + queue.queueName + '');
        });
      });
    });
  });
});

process.on('SIGINT', function() {
  amqpConnection.disconnect();
  console.log('RabbitMQ: Closing connection');
  process.exit();
});