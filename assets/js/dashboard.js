var _dashboard = CozyHR.pageHelpers.dashboard = function() { };

_dashboard.prototype.init = function() {
	$(document).ready(function(){
		// Set up listeners
		io.socket.on('feedUpdate', this.onFeedUpdate.bind(this));
		io.socket.on('newFeedComment', this.onNewFeedComment.bind(this));
		io.socket.on('destroyFeedComment', this.onDestroyFeedComment.bind(this));
		io.socket.on('workersUpdate', this.onWorkersUpdate.bind(this));

		// Set up bindings
		$(document).on('mouseover', 'div.specificComment', this.onCommentMouseOver.bind(this));
		$(document).on('mouseout', 'div.specificComment', this.onCommentMouseOut.bind(this));
		$(document).on('keyup', 'input.writeComment', function(evt) {
			var charCode = (typeof evt.which === "number") ? evt.which : evt.keyCode;
			if(charCode == 13 && $(evt.currentTarget).val().length > 1) {
				this.doWriteComment(evt.currentTarget);
			}
		}.bind(this));

		// Set up timers
		setInterval(this.updateTimestamps, 60000);

		// Pre-load sounds
		CozyHR.registerSound({ src: '/sounds/bling1.mp3', id: 'comment'});

		// Chosen-ify
		$('#feedFilter').chosen({
			placeholder_text_single: 'Select a filter'
		});

		$('#feedFilter').on('change', function(evt, params) {
			localStorage['lastDashFeedFilter'] = params.selected;

			$('#subSectionCompanyFeedEntries').html("");
			$('#ajax-loading').show();

			io.socket.get('/dash/getFeed', { start: 0, filter: params.selected });
		});

		$('#feedFilter').val( localStorage['lastDashFeedFilter'] || $('#feedFilter option:first').val() ).trigger('chosen:updated');

		// Get news feed items
		io.socket.get('/dash/getFeed', { start: 0, filter: (localStorage['lastDashFeedFilter'] || 'all') });

		// Get employees working now
		io.socket.get('/dash/getWorkingNow');
	}.bind(this));

	return this;
};

_dashboard.prototype.updateTimestamps = function() {
	$('.specificComment').each(function(index, comment){
		var creationDate = new Date($(comment).data('timestamp'));
		var nowDate = new Date();

		var _fancyDate = fancyDate(creationDate, nowDate, true);

		$(comment).find('.commentTime').html(_fancyDate);
	});
};

_dashboard.prototype.onFeedUpdate = function(res) {
	var feedData = [];

	// Sort by date
	var sortedResponse = CozyHR.sortAssocArray(res, 'date', { sortType: 'date' });

	// Generate the data to pass to mustache for rendering
	sortedResponse.forEach(function(feedItem) {
		feedData.push({
			contentHtml: feedItem.content,
			feedId: feedItem.feedid,
			date: new Date(feedItem.date).toLocaleString(),
			officeName: feedItem.officeName,
			pictureHtml: generatePictureDiv(feedItem.picture),
			pictureUrl: feedItem.mePicture,
			commentsHtml: (function() {
				var commentsHtml = '';

				feedItem.comments.forEach(function(feedItemComment) {
					commentsHtml += Mustache.render(CozyHR.templates['feedItemComment'], {
						commentId: feedItemComment.id,
						contentHtml: feedItemComment.content,
						name: feedItemComment.authorName,
						timestamp: feedItemComment.createdAt,
						pictureHtml: generatePictureDiv(feedItemComment.picture),
						isAuthor: ((feedItemComment.user==CozyHR.userId)?true:false)
					});
				});

				return commentsHtml;
			})(),
			showMoreComments: ((feedItem.comments.length > 5)?true:false),
			commentsHidden: ((feedItem.comments.length > 5)?feedItem.comments.length - 5:0)
		});
	});

	var html = Mustache.render(CozyHR.templates['feedItem'], {
		feedData: feedData
	});

	$('#subSectionCompanyFeedEntries').fadeOut(100, function(){
		// Set the HTML
		$('#subSectionCompanyFeedEntries').html(html);

		// Show the latest five comments for each feed item
		sortedResponse.forEach(function(feedItem) {
			$('#fid-' + feedItem.feedid + ' .specificComment').each(function(i, elem) {
				if(i >= (feedItem.comments.length - 5)) {
					$(elem).show();
				}
			});
		});

		$('#subSectionCompanyFeedEntries').fadeIn(100);

		$('#ajax-loading').hide();

		this.updateTimestamps();
	}.bind(this));
};

_dashboard.prototype.onNewFeedComment = function(res) {
	if(!$('#fid-' + res.feedId + ' .comments'))
		return;

	$('#fid-' + res.feedId + ' .comments').append(
		Mustache.render(CozyHR.templates['feedItemComment'], {
			commentId: res.commentId,
			contentHtml: res.content,
			name: res.authorName,
			timestamp: res.timestamp,
			pictureHtml: generatePictureDiv(res.picture),
			isAuthor: ((res.authorId==CozyHR.userId)?true:false),
			extraStyling: "display:none"
		})
	);

	$('#cid-' + res.commentId).fadeIn(200, function() {
		$('input[data-feedid="' + res.feedId + '"]').focus();
	});

	CozyHR.playSound('comment');
};

_dashboard.prototype.loadMoreComments = function(feedId) {
	var currentlyHidden	= $('#fid-' + feedId + ' .specificComment:hidden').length;

	$('#fid-' + feedId + ' .specificComment:hidden').each(function(i, elem) {
		if(i >= (currentlyHidden - 5)) {
			$(elem).fadeIn(400);
		}
	});

	// Hide "show more"?
	if($('#fid-' + feedId + ' .specificComment:hidden').length === 0) {
		$('#fid-' + feedId + ' .manyComments').hide();
	} else {
		// Adjust comments hidden number
		$('#fid-' + feedId + ' .manyComments .commentsHidden').html($('#fid-' + feedId + ' .specificComment:hidden').length);
	}
};

_dashboard.prototype.onDestroyFeedComment = function(res) {
	if(!$('#cid-' + res.commentId))
		return;

	// Hidden? If so, re-adjust number
	if($('#cid-' + res.commentId).is(':hidden')) {
		$('#fid-' + res.feedId + ' .manyComments .commentsHidden').html($('#fid-' + res.feedId + ' .specificComment:hidden').length - 1);
	}

	$('#cid-' + res.commentId).fadeOut(400);
};

_dashboard.prototype.doWriteComment = _.debounce(function(elem) {
	// Disable the comment box
	$(elem).prop('disabled', true);
	$(elem).addClass('disabled');
	// Send away
	io.socket.post('/dash/writeComment', {
		feedid: $(elem).data('feedid'),
		comment: $(elem).val()
	}, function(res) {
		// Enable the comment box
		$(this).prop('disabled', false);
		$(this).removeClass('disabled');
		$(this).val('');
		// Check if unsuccesful
		if(!res.success) {
			console.log(res.error);
		}
	}.bind(elem));
}, CozyHR.globals.DEFAULT_DEBOUNCE_TIMEOUT, true);

_dashboard.prototype.doDeleteComment = function(elem, commentId) {
	var commentId;

	if(commentId) {
		io.socket.post('/dash/removeComment', {
			commentId: commentId
		});
	}
};

_dashboard.prototype.onCommentMouseOver = function(evt) {
	$(evt.currentTarget).find('.commentLinks').show();
};

_dashboard.prototype.onCommentMouseOut = function(evt) {
	$(evt.currentTarget).find('.commentLinks').hide();
};

_dashboard.prototype.onWorkersUpdate = function(res) {
	res.forEach(function(worker) {
		worker.pictureHtml = generatePictureDiv(worker.picture, 'large-margin');
	});

	$('#subSectionWorkers').html(Mustache.render(CozyHR.templates['workingNow'], {
		workers: res
	}));
};