$(document).ready(function(){
	// Set up regular tooltips
	$(document).on('mouseover', '.tt', function(event) {
		$(this).qtip({
			overwrite: false,
			show: {
				event: event.type,
				ready: true
			},
			position: {target: 'mouse'},
			style: 'qtip-dark'
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
			style: 'qtip-dark'
		});
	});
  // Disable right click
  $(document).bind('contextmenu', function(e) {
    e.preventDefault();
  });
  // Set up socket exceptions
  io.socket.on('exception', function(exceptionData) {
  	CozyHR.exception(exceptionData.stack);
  });
});

// Underscore mixins
_.mixin({
  clearArray: function(array) {
    while (array.length > 0) {
      array.pop();
    }
  }
});

// jQuery mixins
$.fn.enterKey = function (fnc) {
	return this.each(function () {
    $(this).keypress(function (ev) {
      var keycode = (ev.keyCode ? ev.keyCode : ev.which);
      if (keycode == '13') {
        fnc.call(this, ev);
      }
    })
	})
};
$.fn.txtSubmit = function(btn, fnc) {
	return this.each(function() {
		$(this).enterKey(function(ev) {
			fnc.call(this, 'btn');
		});
		$(btn).on('click', function() {
			fnc.call(this, 'txt');
		});
	});
};

// Create the CozyHR namespace
CozyHR = { };
CozyHR.pageHelpers = {};
CozyHR.pageHelper = { queueStatements: [] };
CozyHR.notifications = [];
CozyHR.templates = [];
CozyHR.globals = {
	DEFAULT_DEBOUNCE_TIMEOUT: 500
};

CozyHR.pageHelper.init = function(pageHelper) {
	if(CozyHR.pageHelper.instance)
		return console.error('Page helper attempted to be initialized twice.');

	CozyHR.pageHelper.instance = new pageHelper().init();

	console.log('Page helper initialized.');

	// Anything in the eval queue?
	if(CozyHR.pageHelper.queueStatements.length >= 1) {
		console.log('Evaluating page helper queue.');
		CozyHR.pageHelper.queueStatements.forEach(function(eStatement) {
			eval(eStatement);
		});
		_.clearArray( CozyHR.pageHelper.queueStatements );
	}
};

CozyHR.pageHelper.queue = function(evalStatement) {
	if(CozyHR.pageHelper.instance) {
		eval(evalStatement);
	} else {
		CozyHR.pageHelper.queueStatements.push( evalStatement );
	}
};

// Create a notification
CozyHR.notify = function(content, options) {
	if(options === undefined)
		options = {};

	CozyHR.notifications.push(
		new jBox('Notice', {
		  content: content,
		  autoClose: 5000,
			animation: {open: 'flip', close: 'flip'},
			color: (options.color || 'black'),
			audio: ((options.sound===true)?'/sounds/boop3':'')
		})
	);

	return CozyHR.notifications[CozyHR.notifications.length - 1]; // Return jBox instance
};

// Load page-specific Mustache template(s)
CozyHR.loadPageTemplates = function() {
	$('script[type=x-tmpl-mustache]').each(function(index, elem) {
		var _html = $(elem).html().trim();
		Mustache.parse($(elem).html()); // Speeds up future renders
		this.templates[elem.id] = _html;
		console.log('Loaded Mustache Template: ' + elem.id);
	}.bind(this));
};

// Show an exception
CozyHR.exception = function(stackTrace, title) {
	if(typeof title === 'undefined') { title = "Socket Exception"; }

	$('body').append("<div id='exceptionOverlay'><div class='head'>" + title + "</div><div class='stack'></div><a href='#' onclick='document.location.reload()'><div class='refresh input-btn-gray'>Reload Page</div></a></div>");

	$('#exceptionOverlay .stack').html(stackTrace);
};

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
		if(ret.days > 30 && Math.floor(ret.days / 30) < 12) {
			return Math.floor(ret.days / 30) + ' months ago';
		} else if(ret.days > 30 && Math.floor(ret.days / 30) >= 12) {
			return Math.floor( Math.floor(ret.days / 30) / 12 ) + ' years ago';
		} else {
			return ret.days + 'd ago';
		}
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