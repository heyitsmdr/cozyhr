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
  }

};
