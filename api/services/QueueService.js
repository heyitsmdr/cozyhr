// RabbitMQ
var amqpConnection = require('amqp').createConnection({
  host: 'rabbitmq.int.cozyhr.com',
  port: 5672,
  login: 'cozy',
  password: '#CF3fxEH9!',
  vhost: '/',
  clientProperties: { product: process.env.DYNO || 'web.0' }
});
var exchangeName = 'cozyhr-' + (process.env.NODE_ENV || 'development');
var exchange = null;
var queueReady = false;

amqpConnection.on('ready', function() {
  sails.log.info('[QueueService]', 'Connection to RabbitMQ established.');

  if(exchange !== null) {
    return;
  }

  exchange = amqpConnection.exchange(exchangeName, { durable: true, autoDelete: false });
  exchange.on('open', function() {
    queueReady = true;
    sails.log.info('[QueueService]', 'Exchange opened:', exchange.name);
  });
});

process.on('SIGINT', function() {
  amqpConnection.disconnect();
  queueReady = false;
  sails.log.info('[QueueService]', 'The connection to RabbitMQ is being closed.');
  process.exit();
});

module.exports = {

  sendEmail: function(opt) {
    if(!queueReady) {
      // TODO: This should queue locally and publish when a connection can be made
      return sails.log.info('[QueueService]', 'Ignoring QueueService.sendEmail() due to no connection.');
    }

    // Log this in metrics
    MetricService.increment('rabbitmq.sent_requests');

    // Send off to RabbitMQ so a worker (aux server) can handle this
    exchange.publish('send_email', opt);

    sails.log.verbose('[QueueService]', 'Pushing to queue: send_email', opt);
  }

};