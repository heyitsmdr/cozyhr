/*
   Email Service
   - Handled by app in development
   - Handled by worker queue in production
 */

var kue = require('kue'),
    jobs = kue.createQueue({
      prefix: 'q',
      redis: {
        port: 10677,
        host: 'koi.redistogo.com',
        auth: '5952fbe237e40957ca1d7b7c91edc90f'
      }
    });

var sendgrid  = require('sendgrid')('app26186884@heroku.com', 'euktdwll');

var EmailServiceOperations = {
  send: function(opt) {
    sendgrid.send({
      to: opt.to,
      from: 'info@greenleaf.com',
      subject: opt.subject,
      text: opt.text
    }, function(err, json) {

    });
  }
};

module.exports.sendEmail = function(options) {
  if(sails.config.environment == 'development') {
    EmailServiceOperations.send(options);
  } else {
    // add to worker job queue in redis (using kue)
  }
};