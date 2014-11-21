var crypto = require('crypto');
var util = require('util');

module.exports = {
  generateGravatarURL: function(email) {
    var emailHash = crypto.createHash('md5').update(email).digest('hex');

    return util.format('http://www.gravatar.com/avatar/%s.png?d=http%3A%2F%2Fstatic.cozyhr.com%2Fimages%2Fdefault-user.png', emailHash);
  }
};