var loggly = require('loggly');

var client = loggly.createClient({
  token: "cb6a9bee-1a72-485a-ac54-602ddaff650b",
  subdomain: "cozyhr",
  tags: ["NodeJS"],
  json:true
});

module.exports = client;