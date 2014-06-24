$(document).ready(function(){
	// Set up regular tooltips
	$(document).on('mouseover', '.tt', function(event) {
		$(this).qtip({
			overwrite: false,
			show: {
				event: event.type,
				ready: true
			},
			style: 'qtip-green'
		});
	});
	// Set up person tooltips
	$(document).on('mouseover', 'div.person', function(event) {
		$(this).qtip({
			overwrite: false,
			show: {
				event: event.type,
				ready: true
			},
			style: 'qtip-green'
		});
	});
});

function generatePictureDiv(opt, extraClassOptions) {
	var lines = [];
	lines.push("<span class=\"name\">" + opt.name + "</span>");
	lines.push("<span class=\"position\">" + opt.position + "</span>");
	return "<div title='<div class=\"tooltip\">" + lines.join('<br>') + "</div>' class='person picture " + ((opt.small)?'small':'') + " " + extraClassOptions + "' style='background-image:url(" + opt.picture + ")'></div>";
};

function fancyDate(a, b, fancyReturn) {
	var _MS_PER_DAY = 1000 * 60 * 60 * 24;
	var _MS_PER_HOUR = 1000 * 60 * 60;
	var _MS_PER_MINUTE = 1000 * 60;

	// Discard the time and time-zone information.
	var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate(), a.getHours(), a.getMinutes(), a.getSeconds());
	var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate(), b.getHours(), b.getMinutes(), b.getSeconds());

	var ret = {};

	ret.days = Math.floor((utc2 - utc1) / _MS_PER_DAY);
	ret.hours = Math.floor((utc2 - utc1) / _MS_PER_HOUR) - (ret.days * 24);
	ret.minutes = Math.floor((utc2 - utc1) / _MS_PER_MINUTE) - (ret.days * 24) - (ret.hours * 60);

	if(!fancyReturn)
		return ret;

	if(ret.days == 0 && ret.hours == 0 && ret.minutes == 0) {
		return 'Just now';
	}
	else if(ret.days == 0 && ret.hours == 0 && ret.minutes >= 1) {
		return ret.minutes + 'm ago';
	}
	else if(ret.days == 0 && ret.hours >= 1) {
		return ret.hours + 'h ago';
	}
	else if(ret.days == 1) {
		return 'Yesterday';
	}
	else {
		return ret.days + 'd ago';
	}
};

function handleValidationError(ve) {
	ve.ValidationError.content.forEach(function(err) {
		var e = new Error('ValidationError: ' + err.message);
		console.log(e.stack);
	});
};

function createNotification(content, alertType) {
	var n = noty({
		text: content,
		layout: 'topRight',
		type: alertType || 'alert',
		maxVisible: 5,
		timeout: 3000
	});
};