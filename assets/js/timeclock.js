var _timeclock = CozyHR.pageHelpers.timeclock = function() { };

_timeclock.prototype.templates = [];

_timeclock.prototype.init = function() {
	$(document).ready(function(){
		$('#selOffice').chosen({
			placeholder_text_single: 'Choose an Office'
		});
		var getPositionsAtOffice = function(officeId) {
			io.socket.get('/timeclock/getClockablePositions', {
				officeId: officeId
			}, function(res) {
				if(res.positions) {
					$('#sectionClockablePositions').html( Mustache.render(CozyHR.templates['clockPositionsFillin'], {
						positions: res.positions
					}) );
				}
			});
			localStorage['lastOffice'] = officeId;
		};
		$('#selOffice').on('change', function(evt, params) {
			getPositionsAtOffice(params.selected);
		});
		$('#selOffice').val( localStorage['lastOffice'] || $('#selOffice option:first').val() ).trigger('chosen:updated');
		getPositionsAtOffice(localStorage['lastOffice'] || $('#selOffice option:first').val());

		// Load Mustache Template
		CozyHR.loadPageTemplates();

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
				//console.log(data);

				return JSON.parse(data);
			},
			onClick: function(date, value) {
				if(!value)
					return;

				var _jbox = new jBox('Modal', {
					width: 400,
					height: 'auto',
					minHeight: 50,
					title: '<strong>Timeclock Data:</strong> ' + date.toLocaleString(),
					animation: {open: 'flip', close: 'flip'},
					ajax: {
						url: "/timeclock/getDailyTimeclockData",
						data: 'ts=' + date.getTime(),
						spinner: true,
						setContent: false,
						success: function(resp) {
							_jbox.setContent( Mustache.render(CozyHR.templates['timeclockPopup'], {
								clocks: [
									{ position: "Email", location: "NYC", time_in: "12:00 PM", time_out: "2:00 PM" },
									{ position: "Live Chat", location: "NYC", time_in: "3:00 PM", time_out: "5:00 PM" }
								]
							}) );
						}
					}
				}).open();
			}
		});
	}.bind(this));
};