module.exports = {

	index: function(req, res) {
		res.view({
			selectedPage: 'timeclock'
		});
	},

  getTimeclockData: function(req, res) {
    res.send(JSON.stringify({"1410794885": 6}));
  },

  getDailyTimeclockData: function(req, res) {
    res.send('hey');
  }

};
