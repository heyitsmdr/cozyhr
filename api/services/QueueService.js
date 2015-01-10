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
var serverIsShuttingDown = false;
var closeTimeout = null;

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

amqpConnection.on('close', function() {
  sails.log.info('[QueueService]', 'The connection to RabbitMQ is being closed.');

  queueReady = false;

  if(serverIsShuttingDown) {
    if(closeTimeout) {
      clearTimeout(closeTimeout);
    }

    amqpConnection = null;
    process.exit();
  }
});

process.on('SIGINT', function() {
  serverIsShuttingDown = true;

  amqpConnection.disconnect();

  // Allow 5 seconds for the connection to close, then forcefully close the app
  closeTimeout = setInterval(function() {
    process.exit();
  }, 5000);
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