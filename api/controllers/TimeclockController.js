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
        mustacheTemplates: ['clockPositionsFillin', 'noClockedTime']
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

    req.socket.emit('clockUpdate', { clocks: [] });
  }
};
