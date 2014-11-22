$(document).ready(function(){
	// Set up tooltips
	$(document).on('mouseover', '.tt', function(event) {
		if(!$(this).data('tt-init')) {
			$(this).jBox('Tooltip');
			$(this).data('tt-init', true);
			$(this).mouseover();
		}
	});
  // Disable right click
  $(document).bind('contextmenu', function(e) {
    e.preventDefault();
  });
  // Set up socket exceptions
  io.socket.on('exception', function(exceptionData) {
  	CozyHR.exception(exceptionData.stack);
  });
  // Load any necessary Mustache templates (passed in by the controller)
  CozyHR.loadPageTemplates();
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
			audio: ((options.sound===true)?'/sounds/bling2':'')
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
	if(typeof title === 'undefined') { title = "Something Went Wrong"; }

	$('body').append("<div id='exceptionOverlay'><div class='head'>" + title + "</div><div class='stack'></div><a href='#' onclick='document.location.reload()'><div class='refresh input-btn-gray'>Reload Page</div></a></div>");

	$('#exceptionOverlay .stack').html(stackTrace);
};

CozyHR.playSound = function(sound) {
	createjs.Sound.play(sound);
};

CozyHR.registerSound = function(opt) {
	createjs.Sound.registerSound(opt);
};

CozyHR.sortAssocArray = function(arr, sortBy, opt) {
	return arr.sort(function(first, second) {
		if(opt.sortType && opt.sortType == 'date')
			return (new Date(second[sortBy]).getTime()) - (new Date(first[sortBy]).getTime());
		else
			return second[sortBy] - first[sortBy];
	});
};

CozyHR.bindClick = function(selector, func) {
	$(selector).on('click', _.debounce(func, CozyHR.globals.DEFAULT_DEBOUNCE_TIMEOUT, true));
	if(CozyHR.env !== 'production')
		console.log('Bound click event with debounce to', selector);
};

CozyHR.bindTextClick = function(textSelector, buttonSelector, func) {
	var debounceFunc = _.debounce(func, CozyHR.globals.DEFAULT_DEBOUNCE_TIMEOUT, true);

	// Bind to enter press
	$(textSelector).enterKey(debounceFunc);

	// Bind to button click
	$(buttonSelector).on('click', debounceFunc);

	if(CozyHR.env !== 'production')
		console.log('Bound text and click event with debounce to', textSelector, buttonSelector);
};

CozyHR.bindGlobalClick = function(selector, func) {
	$(document).on('click', selector, _.debounce(func, CozyHR.globals.DEFAULT_DEBOUNCE_TIMEOUT, true));
	if(CozyHR.env !== 'production')
		console.log('Bound global click event with debounce to', selector);
};

CozyHR.bindText = function(selector, func) {
	var debounceFunc = _.debounce(func, CozyHR.globals.DEFAULT_DEBOUNCE_TIMEOUT, true);

	// Bind to enter press
	$(selector).enterKey(debounceFunc);

	if(CozyHR.env !== 'production')
		console.log('Bound text event with debounce to', selector);
};

CozyHR.validateText = function(selector, validationOptions, notificationMessage) {
	var showNotification = function() {
		if(notificationMessage) {
			CozyHR.notify(notificationMessage, { color: 'red' });
		}
	};

	// Empty?
	if(validationOptions.notEmpty) {
		if($(selector).val().length == 0) {
			showNotification();
			$(selector).effect('pulsate', 100);
			$(selector).focus();
			return false;
		}
	}

	// Same As
	if(validationOptions.sameAs) {
		if($(selector).val() != $(validationOptions.sameAs).val()) {
			showNotification();
			$(selector).effect('pulsate', 100);
			$(selector).focus();
			return false;
		}
	}

	// Email
	if(validationOptions.isEmail) {
		if($(selector).val().indexOf('@') == -1 || $(selector).val().indexOf('.') == -1) {
			showNotification();
			$(selector).effect('pulsate', 100);
			$(selector).focus();
			return false;
		}
	}

	return true;
};

function generatePictureDiv(opt, extraClassOptions) {
	var lines = [];
	lines.push("<span class=\"name\">" + opt.name + "</span>");
	lines.push("<span class=\"position\">" + opt.position + "</span>");
	return "<a href='/admin/employee/" + opt.id + "'><div title='<div class=\"tooltip\">" + lines.join('<br>') + "</div>' class='tt person picture " + ((opt.small)?'small':'') + " " + ((extraClassOptions)?extraClassOptions:'') + "' style='background-image:url(" + opt.picture + ")'></div></a>";
};

function fancyDate(a, b, fancyReturn, opt) {
	var _MS_PER_DAY = 1000 * 60 * 60 * 24;
	var _MS_PER_HOUR = 1000 * 60 * 60;
	var _MS_PER_MINUTE = 1000 * 60;
	var _MS_PER_SECOND = 1000;

	// Discard the time and time-zone information.
	var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate(), a.getHours(), a.getMinutes(), a.getSeconds());
	var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate(), b.getHours(), b.getMinutes(), b.getSeconds());

	var ret = {};

	ret.days = Math.floor((utc2 - utc1) / _MS_PER_DAY);
	ret.hours = Math.floor((utc2 - utc1) / _MS_PER_HOUR) - (ret.days * 24);
	ret.minutes = Math.floor((utc2 - utc1) / _MS_PER_MINUTE) - (ret.days * 1440) - (ret.hours * 60);
	ret.seconds = Math.floor((utc2 - utc1) / _MS_PER_SECOND) - (ret.days * 86400) - (ret.hours * 3600) - (ret.minutes * 60);

	if(!opt) { opt = {}; }

	var options = {
		now: ((opt.now) ? opt.now : 'Just now'),
		withinHour: ((opt.withinHour) ? opt.withinHour : '%mm ago'),
		withinDay: ((opt.withinDay) ? opt.withinDay : '%hh ago'),
		yesterday: ((opt.yesterday) ? opt.yesterday : 'Yesterday'),
		withinMonth: ((opt.withinMonth) ? opt.withinMonth : '%dd ago')
	};

	if(!fancyReturn)
		return ret;

	if(ret.days == 0 && ret.hours == 0 && ret.minutes == 0) {
		return options.now.replace('%s', ret.seconds);
	}
	else if(ret.days == 0 && ret.hours == 0 && ret.minutes >= 1) {
		return options.withinHour.replace('%s', ret.seconds).replace('%m', ret.minutes);
	}
	else if(ret.days == 0 && ret.hours >= 1) {
		return options.withinDay.replace('%s', ret.seconds).replace('%m', ret.minutes).replace('%h', ret.hours);
	}
	else if(ret.days == 1) {
		return options.yesterday.replace('%s', ret.seconds).replace('%m', ret.minutes).replace('%h', ret.hours);
	}
	else {
		if(ret.days > 30 && Math.floor(ret.days / 30) < 12) {
			return Math.floor(ret.days / 30) + ' months ago';
		} else if(ret.days > 30 && Math.floor(ret.days / 30) >= 12) {
			return Math.floor( Math.floor(ret.days / 30) / 12 ) + ' years ago';
		} else {
			return options.withinMonth.replace('%s', ret.seconds).replace('%m', ret.minutes).replace('%h', ret.hours).replace('%d', ret.days);
		}
	}
};

function handleValidationError(ve) {
	ve.ValidationError.content.forEach(function(err) {
		var e = new Error('ValidationError: ' + err.message);
		console.log(e.stack);
	});
};