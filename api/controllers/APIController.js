module.exports = {

  info: function(req, res) {
    res.send('no_info');
  },

  /**
   * @via     Socket
   * @method  GET
   */
  syncOffices: function(req, res) {
    var es = ExceptionService.require(req, res, { socket: true, GET: true });

    Office
      .find({ company: req.session.userinfo.company.id })
      .then(function(companyOffices) {
        res.json(companyOffices);
      })
      .catch(es.wrap(function(err) {
        throw ExceptionService.error(err);
      }));
  },

  /**
   * @via     Socket
   * @method  GET
   */
  syncWorkers: function(req, res) {
    var es = ExceptionService.require(req, res, { socket: true, GET: true });

    // throw ExceptionService.error('Could not get working clocks.');

    Clock
      .find({ company: req.session.userinfo.company.id, working: true})
      .populate('position')
      .populate('office')
      .populate('user')
      .then(function(workers) {
        var response = [];

        workers.forEach(function(_worker) {
          response.push({
            workerPicture: _worker.user.picture,
            workerJob: '',
            workerName: _worker.user.fullName(),
            clockedPosition: _worker.position.name,
            clockedLocation: _worker.office.name
          });
        });

        res.json(response);
      })
      .catch(es.wrap(function() {
        throw ExceptionService.error('Could not get working clocks.');
      }));
  }

};