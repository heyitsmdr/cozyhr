module.exports = {

  /**
   * @via     HTTP
   * @method  GET
   */
	index: function(req, res) {
    var es = ExceptionService.require(req, res, { GET: true });

    Office.find({ company: req.session.userinfo.company.id }).exec(es.wrap(function(e, offices) {
      if(e) {
        throw ExceptionService.error('Error fetching offices.');
      }

      // clocked in?
      Clock.find({ user: req.session.userinfo.id, working: true }).populate('position').populate('office').exec(es.wrap(function(e, clockedInPosition) {
        if(e) {
          throw ExceptionService.error('Error fetching clocked positions.');
        }

        if(clockedInPosition.length > 0) {
          clockedInPosition[0].createdAtTS = new Date(clockedInPosition[0].createdAt).getTime();
        }

        res.view('timeclock/base', {
          selectedPage: 'timeclock',
          offices: offices,
          clock: clockedInPosition,
          mustacheTemplates: ['clockPositionsFillin', 'noClockedTime', 'clockEntries']
        });
      }));
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
    var es = ExceptionService.require(req, res, { socket: true, GET: true });

    Clock.find({ user: req.session.userinfo.id, working: false }).populate('office').populate('position').sort({ clockout: 'desc' }).exec(es.wrap(function(e, userClocks) {
      if(e) {
        throw ExceptionService.error('Could not get clocks.');
      }

      req.socket.emit('clockUpdate', { clocks: userClocks });
    }));
  },

  /**
   * @via     Socket
   * @method  POST
   */
  clockIn: function(req, res) {
    var es = ExceptionService.require(req, res, { socket: true, POST: true });

    var positionId = req.param('positionId');

    if(!positionId) {
      throw ExceptionService.error('No position id specified.');
    }

    Clock.find({ user: req.session.userinfo.id, working: true }).populate('office').populate('position').exec(es.wrap(function(e, clockedInPositions) {
      if(e) {
        throw ExceptionService.error('Could not check if you were clocked in.');
      }

      if(clockedInPositions.length >= 1) {
        throw ExceptionService.error('You are already clocked in to ' + clockedInPositions[0].position.name + ' @ ' + clockedInPositions[0].office.name + '.', { fatal: false });
      }

      Position.findOne(positionId).populate('office').exec(es.wrap(function(e, foundPosition) {
        if(e || !foundPosition) {
          throw ExceptionService.error('Could not find position.');
        }

        // same company?
        if(foundPosition.company != req.session.userinfo.company.id) {
          throw ExceptionService.error('Position does not belong to this company.');
        }

        // okay, you can work.
        Clock.create({ user: req.session.userinfo.id, company: req.session.userinfo.company.id, position: foundPosition.id, office: foundPosition.office, working: true }).exec(es.wrap(function(e, createdClock) {
          if(e || !createdClock) {
            throw ExceptionService.error('Could not create the clock in.');
          }

          res.json({ success: true, positionName: foundPosition.name, officeName: foundPosition.office.name });
        }));
      }));
    }));
  },

  /**
   * @via     Socket
   * @method  POST
   */
  deleteClock: function(req, res) {
    var es = ExceptionService.require(req, res, { socket: true, POST: true });

    Clock.find({ user: req.session.userinfo.id, working: true }).exec(es.wrap(function(e, clockedInPositions) {
      if(e) {
        throw ExceptionService.error('Could not check if you were clocked in.');
      }

      if(clockedInPositions.length == 0) {
        throw ExceptionService.error('You are not clocked in.', { fatal: false });
      }

      Clock.destroy({ id: clockedInPositions[0].id }).exec(es.wrap(function(e) {
        if(e) {
          throw ExceptionService.error('Could not delete clock.');
        }

        res.json({ success: true });
      }));
    }));
  },

  /**
   * @via     Socket
   * @method  POST
   */
  clockOut: function(req, res) {
    var es = ExceptionService.require(req, res, { socket: true, POST: true });

    Clock.find({ user: req.session.userinfo.id, working: true }).exec(es.wrap(function(e, clockedInPositions) {
      if(e) {
        throw ExceptionService.error('Could not check if you were clocked in.');
      }

      if(clockedInPositions.length == 0) {
        throw ExceptionService.error('You are not clocked in.', { fatal: false });
      }

      Clock.update({ id: clockedInPositions[0].id }, { working: false, clockout: new Date() }).exec(es.wrap(function(e, updatedClock) {
        if(e) {
          throw ExceptionService.error('Could not clock out.');
        }

        res.json({ success: true });
      }));
    }));
  }
};
