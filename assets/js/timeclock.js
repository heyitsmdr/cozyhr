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

	return this;
};

_timeclock.prototype.clockIn = function(positionId) {
	console.log(positionId);
};

_timeclock.prototype.onClockUpdate = function(data) {
	if(data.clocks.length == 0) {
		$('#clockNoticeContainer').html(Mustache.render(CozyHR.templates['noClockedTime']));
	}
};