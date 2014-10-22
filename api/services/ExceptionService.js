module.exports = {
  require: function(request, checks) {
    // Socket
    if(checks.socket === true) {
      if(!request.isSocket) {
        throw new Error('Expected Socket, got ' + request.isSocket);
      }
    }
    // POST
    if(checks.POST === true) {
      if(request.method !== 'POST') {
        throw new Error('Expected POST, got ' + request.method);
      }
    }
    // GET
    if(checks.GET === true) {
      if(request.method !== 'GET') {
        throw new Error('Expected GET, got ' + request.method);
      }
    }
  },

  checkMongoError: function(mongoError) {
    if(mongoError) {
      throw new Error('Mongo Error: ' + mongoError);
    }
  };

  socket: function(req, res, data) {
    MetricService.increment('socket.exceptions');

    req.socket.emit('exception', {
      stack: data,
      timestamp: Date.now()
    });
  },

  http: function(req, res, data) {
    MetricService.increment('http.exceptions');
  }
};