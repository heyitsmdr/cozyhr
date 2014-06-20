// RabbitMQ
var amqpConnection = require('amqp').createConnection({ url: "amqp://lu00GelV:-KdaPhbsdrAk70Af8seGdTb5hDglCcWU@furry-willow-20.bigwig.lshift.net:11142/R4MZ5zE8NSMd", clientProperties: { product: 'web-01' } });
var exchangeName = 'greenleaf-' + (process.env.NODE_ENV || 'development');
var exchange;

amqpConnection.on('ready', function() {
  sails.log.info('RabbitMQ: Connected and ready.');
  exchange = amqpConnection.exchange( exchangeName );
  exchange.on('open', function() {
    sails.log.info('RabbitMQ: Exchange opened (' + exchange.name + ')');
  });
});

module.exports = {

  sendEmail: function(opt) {
    // Send off to RabbitMQ so a worker can handle this
    exchange.publish('send_email', opt);
  }

};