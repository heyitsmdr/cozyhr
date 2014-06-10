var TIMECLOCK_UTILS = function() { TIMECLOCK_UTILS.instance = this; };

TIMECLOCK_UTILS.instance = null;

TIMECLOCK_UTILS.prototype.init = function() {
	$(document).ready(function(){
		$(document).on('mousedown touchstart', '#clockInOutBox', this.onClockInOutMouseDown.bind(this));
		$(document).on('mouseup touchend', '#clockInOutBox', this.onClockInOutMouseUp.bind(this));
	}.bind(TIMECLOCK_UTILS.instance));
};

fillClockInOutTimer = null;

TIMECLOCK_UTILS.prototype.onClockInOutMouseDown = function(evt) {
	var elem = evt.currentTarget;

	$(elem).find('.fillBox').css('top', '200px');
	$(elem).find('.fillBox').show();

	$(elem).find('p').html('Keep holding..');

	fillClockInOutTimer = setInterval(function() {
		var currentSize = $(elem).find('.fillBox').css('top').split('px')[0]

		currentSize -= 5;

		if(currentSize <= 0) {
			clearInterval(fillClockInOutTimer);
			fillClockInOutTimer = null;
			// Clock in or out!
		}

		$(elem).find('.fillBox').css('top', currentSize + 'px');
	}, 50);
};

TIMECLOCK_UTILS.prototype.onClockInOutMouseUp = function(evt) {
	var elem = evt.currentTarget;

	$(elem).find('.fillBox').hide();

	$(elem).find('p').html('Click and hold to click in or out.');

	clearInterval(fillClockInOutTimer);
	fillClockInOutTimer = null;
};