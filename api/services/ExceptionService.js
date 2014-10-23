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

  socket: function(req, res, data) {
    MetricService.increment('socket.exceptions');

    if(!data.fatal) {
      req.socket.emit('exception', {
        stack: data.stack,
        timestamp: Date.now()
      });
    } else {
      res.json({ success: false, error: data.message });
    }
  },

  http: function(req, res, data) {
    MetricService.increment('http.exceptions');
  },

  error: function(errorMessage, opt) {
    var _error = new Error(errorMessage);

    _error.fatal = ((opt.fatal)?true:false);

    return _error;
  },

  wrap: function(res, func) {
    return function() {
      var arrayList = [];
      Object.keys(arguments).forEach(function(key) {
        arrayList.push(arguments[key]);
      });

      try {
        func.apply(this, arrayList);
      } catch(ex) {
        return res.serverError(ex);
      }
    }.bind(this)
  }
};