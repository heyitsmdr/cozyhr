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

  socket: function(req, res, exceptionName) {
    var traceStack = new Error('SocketException [' + exceptionName + ']');

    sails.log.warn(traceStack);

    MetricService.increment('socket.exceptions');

    // Make sure this is really a socket
    if(req.isSocket) {
      req.socket.emit('exception', {
        stack: traceStack.stack,
        timestamp: Date.now()
      });
    } else {
      res.serverError(traceStack);
    }

    return traceStack;
  }
};