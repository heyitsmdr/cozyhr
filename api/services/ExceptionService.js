module.exports = {
  socket: function(socket, exceptionName) {
    var traceStack = new Error('SocketException [' + exceptionName + ']');

    sails.log.warn(traceStack);

    MetricService.increment('socket.exceptions');

    socket.emit('exception', {
      stack: traceStack.stack,
      timestamp: Date.now()
    });

    return traceStack;
  }
};