var DASHBOARD_UTILS = function() { DASHBOARD_UTILS.instance = this; };

DASHBOARD_UTILS.instance = null;

DASHBOARD_UTILS.prototype.init = function() {
	$(document).ready(function(){
		// Set up listeners
		io.socket.on('feedUpdate', this.onFeedUpdate.bind(this));
		io.socket.on('newFeedComment', this.onNewFeedComment.bind(this));
		io.socket.on('destroyFeedComment', this.onDestroyFeedComment.bind(this));
		io.socket.on('workersUpdate', this.onWorkersUpdate.bind(this));

		// Set up bindings
		$(document).on('mouseover', 'div.specificComment', this.onCommentMouseOver.bind(this));
		$(document).on('mouseout', 'div.specificComment', this.onCommentMouseOut.bind(this));

		// Set up timers
		setInterval(this.updateTimestamps, 60000);

		// Get news feed items
		io.socket.post('/main/getFeed', { start: 0 });

		// Get employees working now
		io.socket.post('/main/getWorkingNow');
	}.bind(DASHBOARD_UTILS.instance));
};

DASHBOARD_UTILS.prototype.updateTimestamps = function() {
	$('.specificComment').each(function(index, comment){
		var creationDate = new Date($(comment).data('timestamp'));
		var nowDate = new Date();

		var _fancyDate = fancyDate(creationDate, nowDate, true);

		$(comment).find('.commentTime').html(_fancyDate);
	});
};

DASHBOARD_UTILS.prototype.onNewFeedComment = function(res) {
	var _commentItem = [];
	_commentItem.push('<div id="cid-' + res.commentId + '" data-timestamp="%TIMESTAMP%" class="specificComment" style="display:none;">');
	_commentItem.push('    %PICTURE%<div class="commentText">%COMMENT%</div><span class="commentTime">Just now</span><span class="commentLinks">%LINKS%</span>');
	_commentItem.push('</div>');

	if(!$('#fid-' + res.feedId + ' .comments'))
		return;

	$('#fid-' + res.feedId + ' .comments').append(
		_commentItem
			.join('\n')
			.replace('%COMMENT%', res.content)
			.replace('%NAME%', res.authorName)
			.replace('%TIMESTAMP%', res.timestamp)
			.replace('%PICTURE%', generatePictureDiv(res.picture))
			.replace('%LINKS%', ((res.authorId==APP.USERID)?' - <a href="#" onclick="DASHBOARD_UTILS.instance.doDeleteComment(this)">Delete</a>':''))
	);

	$('#cid-' + res.commentId).fadeIn(400);
};

DASHBOARD_UTILS.prototype.onFeedUpdate = function(res) {
	var html = [], commenthtml = [], _feedItem = [], _commentItem = [];
	_feedItem.push('<div id="fid-%FEEDID%" class="feeditem">');
	_feedItem.push('	%PICTURE%');
	_feedItem.push('	<div class="action">%CONTENT%</div>');
	_feedItem.push('	<div class="date">%DATE%</div>');
	_feedItem.push('	<div class="comments">%COMMENTS%</div>');
	_feedItem.push('	<div class="comment"><div class="picture small" style="background-image:url(%YOURPICTURE%)"></div><input type="text" data-feedid="%FEEDID%" placeholder="Write a comment.." onkeyup="DASHBOARD_UTILS.instance.doWriteComment(event, this)"></div>');
	_feedItem.push('</div>');
	_commentItem.push('<div id="cid-%COMMENTID%" data-timestamp="%TIMESTAMP%" class="specificComment">');
	_commentItem.push('    %PICTURE%<div class="commentText">%COMMENT%</div><span class="commentTime">now</span><span class="commentLinks">%LINKS%</span>');
	_commentItem.push('</div>');

	res.forEach(function(feedItem) {
		commenthtml = [];
		// Generate comments
		feedItem.comments.forEach(function(comment){
			commenthtml.push( _commentItem
				.join('\n')
				.replace('%COMMENTID%', comment.id)
				.replace('%COMMENT%', comment.content)
				.replace('%NAME%', comment.authorName)
				.replace('%TIMESTAMP%', comment.createdAt)
				.replace('%PICTURE%', generatePictureDiv(comment.picture))
				.replace('%LINKS%', ((comment.userId==APP.USERID)?' - <a href="#" onclick="DASHBOARD_UTILS.instance.doDeleteComment(this)">Delete</a>':''))
			);
		});
		// Assemble html
		html.push( _feedItem
			.join('\n')
			.replace('%NAME%', feedItem.authorName)
			.replace('%CONTENT%', feedItem.content)
			.replace('%DATE%', new Date(feedItem.date).toLocaleString())
			.replace(/\%FEEDID\%/g, feedItem.feedid)
			.replace('%PICTURE%', generatePictureDiv(feedItem.picture))
			.replace('%YOURPICTURE%', feedItem.mePicture)
			.replace('%COMMENTS%', commenthtml.join('\n'))
		);
	});

	$('#subSectionCompanyFeedEntries').fadeOut(200, function(){
		$('#subSectionCompanyFeedEntries').html( html.join('\n') );
		$('#subSectionCompanyFeedEntries').fadeIn(200);

		this.updateTimestamps();
	}.bind(this));
};

DASHBOARD_UTILS.prototype.onDestroyFeedComment = function(res) {
	$('#cid-' + res.commentId).fadeOut(400);
};

DASHBOARD_UTILS.prototype.doWriteComment = function(evt, elem) {
	var charCode = (typeof evt.which === "number") ? evt.which : evt.keyCode;
	if(charCode == 13 && $(elem).val().length > 1) {
		// Disable the comment box
		$(elem).prop('disabled', true);
		$(elem).addClass('disabled');
		// Send away
		io.socket.post('/main/writeComment', {
			feedid: $(elem).data('feedid'),
			comment: $(elem).val()
		}, function(res) {
			// Enable the comment box
			$(this).prop('disabled', false);
			$(this).removeClass('disabled');
			$(this).val('');
			// Check if unsuccesful
			if(!res.success) {
				alert('Error writing comment. See console for details.');
				handleValidationError(res.error);
			}
		}.bind(elem));
	}
};

DASHBOARD_UTILS.prototype.doDeleteComment = function(elem) {
	var commentId;

	try {
		commentId = $(elem).parent().parent().attr('id').split('-')[1] || null;

		if(commentId) {
			io.socket.post('/main/removeComment', {
				commentId: commentId
			});
		}
	} catch(ex) {
		console.log('Error deleting comment.')
	} finally {
		return false;
	}
};

DASHBOARD_UTILS.prototype.onCommentMouseOver = function(evt) {
	$(evt.currentTarget).find('.commentLinks').show();
};

DASHBOARD_UTILS.prototype.onCommentMouseOut = function(evt) {
	$(evt.currentTarget).find('.commentLinks').hide();
};

DASHBOARD_UTILS.prototype.onWorkersUpdate = function(res) {
	var _html = "";

	res.forEach(function(worker) {
		_html += generatePictureDiv(worker.picture, 'large-margin');
		_html += generatePictureDiv(worker.picture, 'large-margin');
		_html += generatePictureDiv(worker.picture, 'large-margin');
		_html += generatePictureDiv(worker.picture, 'large-margin');
	});

	$('#subSectionWorkers').html( _html );
};