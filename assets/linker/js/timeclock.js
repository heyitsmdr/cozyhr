var TIMECLOCK_UTILS = function() { TIMECLOCK_UTILS.instance = this; };

TIMECLOCK_UTILS.instance = null;

TIMECLOCK_UTILS.prototype.init = function() {
	$(document).ready(function(){
		this.initializeDays();
	}.bind(TIMECLOCK_UTILS.instance));
};

TIMECLOCK_UTILS.prototype.initializeDays = function() {
	var now = new Date();
	var _htmlToAppend = "";
	var _html = [];
	_html.push("<div class='row'>");
	_html.push("	<div class='12u'>");
	_html.push("		<div class='dayData'>");
	_html.push("			<div class='label'>%DAY%</div>");
	_html.push("		</div>");
	_html.push("	</div>");
	_html.push("</div>");

	for(var x = 0; x <= 6; x++) {
		var _day = new Date(now.getTime() - ((24 * 60 * 60 * 1000) * x) );

		$('#timeclockDays').append(
			_html
				.join('\n')
				.replace('%DAY%', ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][(_day.getDay())])
		);
	}
};