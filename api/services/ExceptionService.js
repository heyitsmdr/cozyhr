module.exports = {
  socket: function(socket, exceptionName) {
    var traceStack = new Error(exceptionName).stack;

    socket.emit('exception', {
      stack: traceStack,
      timestamp: Date.now()
    });

    sails.log.error('SocketException', traceStack);
  }
};