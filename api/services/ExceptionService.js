var ExceptionServiceObject = function(req, res) {
  this.req = req;
  this.res = res;
};

ExceptionServiceObject.prototype.wrap = function(func) {
  return function() {
    var arrayList = [];
    var funcArguments = arguments;
    Object.keys(arguments).forEach(function(key) {
      arrayList.push(funcArguments[key]);
    });

    try {
      func.apply(this, arrayList);
    } catch(ex) {
      return this.res.serverError(ex);
    }
  }.bind(this);
};

module.exports = {
  require: function(req, res, checks) {
    // Socket
    if(checks.socket === true) {
      if(!req.isSocket) {
        throw new Error('Expected Socket, got ' + req.isSocket);
      }
    }
    // POST
    if(checks.POST === true) {
      if(req.method !== 'POST') {
        throw new Error('Expected POST, got ' + req.method);
      }
    }
    // GET
    if(checks.GET === true) {
      if(req.method !== 'GET') {
        throw new Error('Expected GET, got ' + req.method);
      }
    }

    // Return some utils
    return new ExceptionServiceObject(req, res);
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

    _error.fatal = ((opt && opt.fatal)?true:false);

    return _error;
  },

};