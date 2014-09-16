module.exports = {

	index: function(req, res) {
    Office.find({ company: req.session.userinfo.company.id }, function(e, offices) {
      res.view({
        selectedPage: 'timeclock',
        offices: offices
      });
    })
	},

  getTimeclockData: function(req, res) {
    res.send(JSON.stringify({"1410794885": 6}));
  },

  getDailyTimeclockData: function(req, res) {
    res.send('hey');
  },

  getClockablePositions: function(req, res) {
    if(req.method == 'GET') {
      var officeId = req.param('officeId');

      if(!officeId) {
        return res.serverError(new Error('InvalidParameterException'));
      }

      Office.findOne(officeId).exec(function(e, office){
        if(e || !office) {
          return res.serverError(new Error('ParameterNotFoundInDatabaseException'));
        }

        // same company?
        if(office.company != req.session.userinfo.company.id) {
          return res.serverError(new Error('ParameterCompanyMismatchException'));
        }

        // Get all the positions for the company's location
        Position.find({ office: officeId }, function(e, positions) {
          res.json({"positions": positions});
        });
      });
    } else {
      return res.json({'error':'Invalid request type. Expected GET.'});
    }
  }

};
