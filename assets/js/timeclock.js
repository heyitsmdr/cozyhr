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
	}.bind(this));
};