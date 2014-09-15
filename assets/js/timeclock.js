var _timeclock = CozyHR.pageHelpers.timeclock = function() { };

_timeclock.prototype.init = function() {
	$(document).ready(function(){
		$('#selOffice').chosen();

		// Timeclock Heatmap
		var now = new Date();
		this.tcHeatMap = new CalHeatMap();
		this.tcHeatMap.init({
			itemSelector: '#timeclockHeatmap',
			domain: 'month',
			subDomain: 'day',
			start: new Date(now.setMonth(1, 1)),
			range: 11,
			rowLimit: 7,
			cellSize: 13,
			tooltip: true,
			highlight: "now",
			legend: [1, 3, 5, 7, 9, 11, 13],
			legendColors: { min: "#eee", max: "#59C8F7", empty: "#eee", base: "#eee" },
			itemName: ["hour", "hours"],
			data: "/timeclock/getTimeclockData",
			dataType: "txt",
			afterLoadData: function(data) {
				console.log(data);

				return JSON.parse(data);
			},
			onClick: function(date, value) {
				if(!value)
					return;

				new jBox('Modal', {
					width: 400,
					height: 300,
					attach: $('#timeclockDay'),
					title: '<strong>Timeclock Data:</strong> ' + date.toLocaleString(),
					animation: {open: 'flip', close: 'flip'},
					ajax: {
						url: "/timeclock/getDailyTimeclockData",
						data: 'ts=' + date.getTime(),
						spinner: true,
						setContent: true
					}
				}).open();
			}
		});
	}.bind(this));
};