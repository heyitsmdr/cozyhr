var raven, sentryClient;

if(process.env.NODE_ENV == 'production') {
  raven = require('raven');
  sentryClient = new raven.Client('https://235af824c3e14027aaa09097339110c5:fa4dec0c6f624d71bf5c20fa52f96d66@app.getsentry.com/33157');
  sentryClient.patchGlobal();
  sails.log.info('Reporting exceptions to Sentry.');
} else {
  sentryClient = false;
}

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
    if(sentryClient && (typeof data.fatal === 'undefined' || data.fatal === true))
      sentryClient.captureError(data, {tags: {dyno: process.env.DYNO || 'local.1' }});

    if(typeof data.fatal === 'undefined' || data.fatal === true) {
      MetricService.increment('socket.exceptions');
      req.socket.emit('exception', {
        stack: ((process.env.NODE_ENV!=='production') ? data.stack : 'It looks like something didn\'t go to plan. That\'s a shame.\n\nIf this is happening multiple times, please contact us with the following error code:\n\nGENERATED_CODE_HERE'),
        timestamp: Date.now()
      });
    } else {
      // NOTE: Non-fatal socket exceptions are not sent to metrics, since these are usually UI-based error messages.
      res.json({ success: false, error: data.message });

      return false;
    }

    return true;
  },

  http: function(req, res, data, generatedCode) {
    if(sentryClient && (typeof data.fatal === 'undefined' || data.fatal === true))
      sentryClient.captureError(data, {tags: {dyno: process.env.DYNO || 'local.1' }});

    MetricService.increment('http.exceptions');

    return true;
  },

  error: function(errorMessage, opt) {
    var _error = new Error(errorMessage);

    _error.fatal = ((opt && typeof opt.fatal !== 'undefined')?opt.fatal:true);

    return _error;
  },

};