module.exports = {
  socket: function(socket, exceptionName) {
    var traceStack = new Error('SocketException: ' + exceptionName);

    socket.emit('exception', {
      stack: traceStack.stack,
      timestamp: Date.now()
    });

    return traceStack;
  }
};