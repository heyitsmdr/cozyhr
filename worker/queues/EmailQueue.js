var sendgrid = require('sendgrid')('app26186884@heroku.com', 'euktdwll');
var sleep = require('sleep');
var emailTemplates = require('swig-email-templates');

function EmailQueue() {
  this._queue; // RabbitMQ-Queue
};

EmailQueue.prototype.sendEmail = function(opt) {
  emailTemplates({ root: __dirname + "/../email-templates" }, function(err, render) {
    opt.templateVars.subject = opt.subject;
    render(opt.template+'.html', opt.templateVars, function(err, html, text) {
      if(err) {
        console.log('Error rendering template: ' + opt.template + '.html');
        return;
      }
      sendgrid.send({
        to: opt.to,
        from: 'info@cozyhr.com',
        subject: opt.subject,
        text: text,
        html: html
      }, function(err, json) {
        if(err)
          console.log(err);
        else
          console.log(json);
      });
    });
  });
};

module.exports = EmailQueue;