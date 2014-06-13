var kue = require('kue'),
    jobs = kue.createQueue({
      prefix: 'q',
      redis: {
        port: 10677,
        host: 'koi.redistogo.com',
        auth: '5952fbe237e40957ca1d7b7c91edc90f'
      }
    });

jobs.process('email', 10, function(job, done) {
  done();
});