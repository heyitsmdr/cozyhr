$(document).ready(function(){
	$(document).on('mousedown touchstart', '#clockInOutBox', onClockInOutMouseDown);
	$(document).on('mouseup touchend', '#clockInOutBox', onClockInOutMouseUp);
});

fillClockInOutTimer = null;

function onClockInOutMouseDown(evt) {
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

function onClockInOutMouseUp(evt) {
	var elem = evt.currentTarget;

	$(elem).find('.fillBox').hide();

	$(elem).find('p').html('Click and hold to click in or out.');

	clearInterval(fillClockInOutTimer);
	fillClockInOutTimer = null;
};