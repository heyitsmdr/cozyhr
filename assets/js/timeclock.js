var _timeclock = CozyHR.pageHelpers.timeclock = function() { };

_timeclock.prototype.init = function() {
	$(document).ready(function(){
		$('#selOffice').chosen();

		this.demo();
	}.bind(this));
};

_timeclock.prototype.demo = function() {
	$('.barshift').each(function(i, elem) {
		var barWidth = $(elem).width();
		var barStart = parseInt($(elem).data('start'));
		var barEnd = parseInt($(elem).data('end'));

		$(elem).css({
			backgroundColor: $(elem).data('color'),
			marginLeft: barStart,
			width: (barEnd - barStart) + 'px',
			height: '34px',
			position: 'absolute'
		});
	});
};