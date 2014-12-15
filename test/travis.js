var childproc = require('child_process');

var sails = childproc.spawn('node', ['app.js']);

sails.on('close', function() {
  console.log('Failed');
  process.exit(1);
});

sails.stdout.on('data', function(data) {
  console.log('> ' + data.toString('utf8'));

  if(data.toString('utf8').indexOf('Server lifted') > -1) {
    console.log('Success');
    process.exit(0);
  }
});