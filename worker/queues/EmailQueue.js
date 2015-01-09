var sendgrid = require('sendgrid')('app26186884@heroku.com', 'euktdwll');
var sleep = require('sleep');
var emailTemplates = require('swig-email-templates');

function EmailQueue() {

}

EmailQueue.prototype.sendEmail = function(opt, done) {
  emailTemplates({ root: __dirname + "/../email-templaates" }, function(err, render) {
    opt.templateVars.subject = opt.subject;
    render(opt.template+'.html', opt.templateVars, function(err, html, text) {
      if(err) {
        throw new Error('Error rendering template: ' + opt.template + '.html');
      }
      sendgrid.send({
        to: opt.to,
        from: 'info@cozyhr.com',
        subject: opt.subject,
        text: text,
        html: html
      }, function(err, json) {
        if(err) {
          throw new Error(err);
        } else {
          console.log(json);
          done();
        }
      });
    });
  });
};

module.exports = EmailQueue;