module.exports = {

	home: function(req, res) {
		User.findOne(req.session.userinfo.id).exec(function(e, usr) {
			res.view('main/dash', {
				selectedPage: 'dash',
				picture: usr.generatePicture(false, req),
				mustacheTemplates: ['feedItem', 'feedItemComment']
			});
		});
	},

	sessionvars: function(req, res) {
		res.send( req.session );
	},

	/* Request Type: Socket.GET */
	getFeed: function(req, res) {
		ExceptionService.require(req, { socket: true, GET: true });

		feedItems = [];

		CompanyFeed.find({company: req.session.userinfo.company.id}).limit(10).skip(req.param('start')).sort('createdAt DESC').exec(function(err, feeds){
			// Iterate through the feeds at this company
			async.each(feeds, function(feed, callback){
				// Let's gather the comments (if any)
				CompanyFeedComments.find({ feed: feed.id }).exec(function(err, feedComments){
					// Iterate through the feedComments to get the authorName
					async.each(feedComments, function(comment, cb) {
						PopUser.one(comment.user, function(e, commentAuthor) {
							comment.authorName = commentAuthor.fullName();
							comment.picture = commentAuthor.genPicture(true);

							cb();
						});
					}, function(err) {
						if(err)
							throw new Error('Could not properly get feed comments.');

						PopUser.one(feed.user, function(e, author){
							feedItems.push({
								authorName: author.fullName(),
								content: '<strong>' + author.fullName() + '</strong> ' + feed.content,
								date: feed.createdAt,
								feedid: feed.id,
								comments: feedComments,
								picture: author.genPicture(false),
								mePicture: req.session.userinfo.picture
							});

							callback();
						});
					});
				});
			}, function(err){
				if(err)
					throw new Error('Could not properly get feed.');

				req.socket.emit('feedUpdate', feedItems);
			});
		});

		// Subscribe to comments for this company
		req.socket.join('dash-cid-' + req.session.userinfo.company.id);
	},

	/* Request Type: Socket.GET */
	getWorkingNow: function(req, res) {
		ExceptionService.require(req, { socket: true, GET: true });

		workingNow = [];

		PopUser.one(req.session.userinfo.id, function(e, usr) {
			workingNow.push({
				picture: usr.genPicture(false)
			});

			workingNow.push({
				picture: usr.genPicture(false)
			});

			req.socket.emit('workersUpdate', workingNow);
		});
	},

	/* Request Type: Socket.POST */
	writeComment: function(req, res) {
		ExceptionService.require(req, { socket: true, POST: true });

		PopUser.one(req.session.userinfo.id, function(e, usr) {

			CompanyFeedComments.create({
				feed: req.param('feedid'),
				user: req.session.userinfo.id,
				content: req.param('comment')
			}).exec(function(err, newComment){
				if(err) {
					res.json({ success: false, error: err });
				} else {
					// Send to you
					req.socket
						.emit('newFeedComment', {
							feedId: req.param('feedid'),
							commentId: newComment.id,
							content: newComment.content,
							timestamp: newComment.createdAt,
							authorName: req.session.userinfo.fullName,
							authorId: newComment.user,
							picture: usr.genPicture(true)
					});
					// Send to everyone listening within this company
					req.socket
						.broadcast.to('dash-cid-' + req.session.userinfo.company.id)
							.emit('newFeedComment', {
								feedId: req.param('feedid'),
								commentId: newComment.id,
								content: newComment.content,
								timestamp: newComment.createdAt,
								authorName: req.session.userinfo.fullName,
								authorId: newComment.user,
								picture: usr.genPicture(true)
					});
					res.json({ success: true });
				}
			});

		});
	},

	/* Request Type: Socket.POST */
	removeComment: function(req, res) {
		ExceptionService.require(req, { socket: true, POST: true });

		CompanyFeedComments.findOne(req.param('commentId')).exec(function(err, comment) {
			if(!err && comment) {
				var feedId = comment.feed;
				// Check if we're allowed to delete this
				if(comment.user == req.session.userinfo.id) {
					// Ok, let's delete.
					CompanyFeedComments.destroy({ id: comment.id }, function(err) {
						// Send to you
						req.socket.emit('destroyFeedComment', { feedId: feedId, commentId: req.param('commentId') });
						// Send to everyone listening within this company
						req.socket.broadcast.to('dash-cid-' + req.session.userinfo.company.id).emit('destroyFeedComment', { feedId: feedId, commentId: req.param('commentId') });
					});
				} else {
					throw new Error('Tried to delete a comment with no ownership.');
				}
			} else if(!err && !comment) {
				throw new Error('Comment not found.');
			} else {
				throw new Error('Database error.');
			}
		});
	},

};
