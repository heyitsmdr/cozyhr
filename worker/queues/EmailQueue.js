var sendgrid = require('sendgrid')('app26186884@heroku.com', 'euktdwll');
var sleep = require('sleep');

function EmailQueue() {
  this._queue; // RabbitMQ-Queue
};

EmailQueue.prototype.subscribe = function() {
  this._queue.subscribe(function(message, headers, deliveryInfo, messageObject) {
    console.log(message);
  });
};

EmailQueue.prototype.sendEmail = function(opt) {
  console.log(opt);
  return;
  sendgrid.send({
      to: opt.to,
      from: 'info@greenleaf.com',
      subject: opt.subject,
      text: opt.text
    }, function(err, json) {

    });
};

module.exports = EmailQueue;