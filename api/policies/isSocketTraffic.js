module.exports = function(req, res, next) {
  if(req.isSocket) {
    MetricService.increment('socket.inbound');
  }

  return next();
};