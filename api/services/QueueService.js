// RabbitMQ
var amqpConnection = require('amqp').createConnection({ url: "amqp://lu00GelV:-KdaPhbsdrAk70Af8seGdTb5hDglCcWU@furry-willow-20.bigwig.lshift.net:11142/R4MZ5zE8NSMd", clientProperties: { product: process.env.DYNO || 'web.0' } });
var exchangeName = 'cozyhr-' + (process.env.NODE_ENV || 'development');
var exchange;
var queueReady = false;

amqpConnection.on('ready', function() {
  sails.log.info('[QueueService]', 'Connection to RabbitMQ established.');
  exchange = amqpConnection.exchange( exchangeName );
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
      return sails.log.info('[QueueService]', 'Ignoring QueueService.sendEmail() due to no connection.');
    }

    // Send off to RabbitMQ so a worker (aux server) can handle this
    MetricService.increment('rabbitmq.requests');
    exchange.publish('send_email', opt);

    sails.log.verbose('[QueueService]', 'Pushing to queue: send_email', opt);
  }

};