var TIMECLOCK_UTILS = function() { TIMECLOCK_UTILS.instance = this; };

TIMECLOCK_UTILS.instance = null;

TIMECLOCK_UTILS.prototype.init = function() {
	$(document).ready(function(){
		this.demo();
	}.bind(TIMECLOCK_UTILS.instance));
};

TIMECLOCK_UTILS.prototype.demo = function() {
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