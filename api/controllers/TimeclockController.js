module.exports = {

  /**
   * @via     HTTP
   * @method  GET
   */
	index: function(req, res) {
    var es = ExceptionService.require(req, res, { GET: true });

    Office.find({ company: req.session.userinfo.company.id }).exec(es.wrap(function(e, offices) {
      res.view({
        selectedPage: 'timeclock',
        offices: offices,
        mustacheTemplates: ['clockPositionsFillin', 'noClockedTime', 'clockEntries']
      });
    }));
	},

  /**
   * @via     Socket
   * @method  GET
   */
  getClockablePositions: function(req, res) {
    var es = ExceptionService.require(req, res, { socket: true, GET: true });

    var officeId = req.param('officeId');

    if(!officeId) {
      throw ExceptionService.error('No office id specified.');
    }

    Office.findOne(officeId).exec(es.wrap(function(e, office){
      if(e || !office) {
        throw ExceptionService.error('Could not find office.');
      }

      // same company?
      if(office.company != req.session.userinfo.company.id) {
        throw ExceptionService.error('Office does not belong to this company.');
      }

      // Get all the positions for the company's location
      Position.find({ office: officeId }).exec(es.wrap(function(e, positions) {
        res.json({"positions": positions});
      }));
    }));
  },

  /**
   * @via     Socket
   * @method  GET
   */
  getClocks: function(req, res) {
    ExceptionService.require(req, res, { socket: true, GET: true });

    // TODO: positionName, locationName, clockIn, clockOut, totalTime

    req.socket.emit('clockUpdate', { clocks: [] });
  },

  clockIn: function(req, res) {
    var es = ExceptionService.require(req, res, { socket: true, POST: true });

    var positionId = req.param('positionId');

    if(!positionId) {
      throw ExceptionService.error('No position id specified.');
    }

    Clock.find({ user: req.session.userinfo.id, working: true }).exec(es.wrap(function(e, clockedInPositions) {
      if(e) {
        throw ExceptionService.error('Could not check if you were clocked in.');
      }

      if(clockedInPositions.length >= 1) {
        throw ExceptionService.error('You are already clocked in to another position.', { fatal: false });
      }

      Position.findOne(positionId).exec(es.wrap(function(e, foundPosition) {
        if(e || !foundPosition) {
          throw ExceptionService.error('Could not find position.');
        }

        // same company?
        if(foundPosition.company != req.session.userinfo.company.id) {
          throw ExceptionService.error('Position does not belong to this company.');
        }

        // okay, you can work.
        Clock.create({ user: req.session.userinfo.id, company: req.session.userinfo.company.id, position: foundPosition.id, working: true }).exec(es.wrap(function(e, createdClock) {
          if(e || !createdClock) {
            throw ExceptionService.error('Could not create the clock in.');
          }

          res.json({ success: true });
        }));
      }));
    }));
  }
};
