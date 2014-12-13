var _timeclock = CozyHR.pageHelpers.timeclock = function() { };

_timeclock.prototype.templates = [];

_timeclock.prototype.init = function() {
	$(document).ready(function(){
		// Bind listeners
		io.socket.on('clockUpdate', this.onClockUpdate.bind(this));

		$('#selOffice').chosen({
			placeholder_text_single: 'Choose an Office'
		});

		var getPositionsAtOffice = function(officeId) {
			if(!officeId) {
				$('#sectionClockablePositions').html( Mustache.render(CozyHR.templates['clockPositionsFillin'], {
					positions: []
				}) );
				return;
			}

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

		io.socket.get('/timeclock/getClocks');
	}.bind(this));

	this.clockedInTimeUpdate();
	setInterval(this.clockedInTimeUpdate.bind(this), 1000);

	return this;
};

_timeclock.prototype.clockIn = _.debounce(function(positionId) {
	io.socket.post('/timeclock/clockIn', { positionId: positionId }, function(result) {
		if(result.success) {
			$('#sectionClockedIn #clockPosition').html(result.positionName);
			$('#sectionClockedIn #clockOffice').html(result.officeName);
			$('#sectionClockedIn #clockInTime').data("clockedin", Date.now());
			$('#sectionClockedIn').fadeIn();
			$('#sectionClockedInSpacing').fadeIn();
		} else {
			CozyHR.notify(result.error, {color: 'red', sound: true});
		}
	});
}, CozyHR.globals.DEFAULT_DEBOUNCE_TIMEOUT, true);

_timeclock.prototype.deleteClock = _.debounce(function() {
	io.socket.post('/timeclock/deleteClock', function(result) {
		if(result.success) {
			$('#sectionClockedIn').fadeOut();
			$('#sectionClockedInSpacing').fadeOut();
		} else {
			CozyHR.notify(result.error, {color: 'red', sound: true});
		}
	});
}, CozyHR.globals.DEFAULT_DEBOUNCE_TIMEOUT, true);

_timeclock.prototype.clockOut = _.debounce(function() {
	io.socket.post('/timeclock/clockOut', function(result) {
		if(result.success) {
			$('#sectionClockedIn').fadeOut();
			$('#sectionClockedInSpacing').fadeOut();
			io.socket.get('/timeclock/getClocks');
		} else {
			CozyHR.notify(result.error, {color: 'red', sound: true});
		}
	});
}, CozyHR.globals.DEFAULT_DEBOUNCE_TIMEOUT, true);

_timeclock.prototype.onClockUpdate = function(data) {
	if(data.clocks.length == 0) {
		$('#clocks').html(Mustache.render(CozyHR.templates['noClockedTime']));
	} else {
		var fancyDateOptions = {
			now: '%ss',
			withinHour: '%mm, %ss',
			withinDay: '%hh, %mm, %ss',
			yesterday: '1d, %hh, %mm, %ss',
			withinMonth: '%dd, %hh, %mm, %ss'
		};

		var clockData = [];
		data.clocks.forEach(function(cdat) {
			var dClockedIn = moment(cdat.createdAt);
			var dClockedOut = moment(cdat.clockout);

			clockData.push({
				positionName: cdat.position.name,
				locationName: cdat.office.name,
				clockIn: dClockedIn.format('MMM D, YYYY @ h:mma'),
				clockOut: dClockedOut.format('MMM D, YYYY @ h:mma'),
				dayName: this.getDayRange(dClockedIn.day(), dClockedOut.day()),
				totalTime: fancyDate(new Date(cdat.createdAt), new Date(cdat.clockout), true, fancyDateOptions)
			});
		}.bind(this));

		$('#clocks').html(Mustache.render(CozyHR.templates['clockEntries'], { clocks: clockData }));
	}
};

_timeclock.prototype.getDayRange = function(clockInDay, clockOutDay) {
	var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

	if(clockInDay === clockOutDay) {
		return "<span class='day'>" + days[clockOutDay] + "</span>";
	} else {
		return "<span class='day'>" + days[clockInDay] + "</span>" + " - " + "<span class='day'>" + days[clockOutDay] + "</span>";
	}
};

_timeclock.prototype.clockedInTimeUpdate = function() {
	if($('#sectionClockedIn').is(':visible')) {
		var clockedInAt = $('#clockInTime').data('clockedin');

		var fancyDateOptions = {
			now: 'For %ss',
			withinHour: 'For %mm, %ss',
			withinDay: 'For %hh, %mm, %ss',
			yesterday: 'For 1d, %hh, %mm',
			withinMonth: 'For %dd, %hh, %mm'
		};

		$('#clockInTime').html(fancyDate(new Date(clockedInAt), new Date(), true, fancyDateOptions));
	}
};