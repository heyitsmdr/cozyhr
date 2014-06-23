module.exports = {

	home: function(req, res) {
		User.findOne(req.session.userinfo.id).done(function(e, usr) {
			res.view({
				selectedPage: 'dash',
				picture: usr.generatePicture(false, req)
			});
		});
	},

	sessionvars: function(req, res) {
		res.send( req.session );
	},

	getFeed: function(req, res) {
		if(!req.isSocket)
			return;

		feedItems = [];

		CompanyFeed.find({companyId: req.session.userinfo.companyId}).limit(10).sort('createdAt DESC').done(function(err, feeds){
			// Iterate through the feeds at this company
			async.each(feeds, function(feed, callback){
				// Let's gather the comments (if any)
				CompanyFeedComments.find({ feedId: feed.id }).limit(15).done(function(err, feedComments){
					// Iterate through the feedComments to get the authorName
					async.each(feedComments, function(comment, cb) {
						UserSpecial.one(comment.userId, function(commentAuthor) {
							comment.authorName = commentAuthor.fullName();
							comment.picture = commentAuthor.genPicture(true);

							cb();
						});
					}, function(err) {
						UserSpecial.one(feed.userId, function(author){
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
				req.socket.emit('feedUpdate', feedItems);
			});
		});

		// Subscribe to comments for this company
		req.listen('dash-cid-' + req.session.userinfo.companyId);
	},

	getWorkingNow: function(req, res) {
		if(!req.isSocket)
			return;

		workingNow = [];

		User.findOne(req.session.userinfo.id).done(function(e, usr) {
			workingNow.push({
				picture: usr.generatePicture(false, req)
			});

			workingNow.push({
				picture: usr.generatePicture(false, req)
			});

			req.socket.emit('workersUpdate', workingNow);
		});
	},

	writeComment: function(req, res) {
		if(!req.isSocket)
			return;

		UserSpecial.one(req.session.userinfo.id, function(usr) {

			CompanyFeedComments.create({
				feedId: req.param('feedid'),
				userId: req.session.userinfo.id,
				content: req.param('comment')
			}).done(function(err, newComment){
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
							authorId: newComment.userId,
							picture: usr.genPicture(true)
					});
					// Send to everyone listening within this company
					req.socket
						.broadcast.to('dash-cid-' + req.session.userinfo.companyId)
							.emit('newFeedComment', {
								feedId: req.param('feedid'),
								commentId: newComment.id,
								content: newComment.content,
								timestamp: newComment.createdAt,
								authorName: req.session.userinfo.fullName,
								authorId: newComment.userId,
								picture: usr.genPicture(true)
					});
					res.json({ success: true });
				}
			});

		});
	},

	removeComment: function(req, res) {
		if(!req.isSocket)
			return;

		CompanyFeedComments.findOne(req.param('commentId')).done(function(err, comment) {
			if(!err && comment) {
				// Check if we're allowed to delete this
				if(comment.userId == req.session.userinfo.id) {
					// Ok, let's delete.
					CompanyFeedComments.destroy({ id: comment.id }, function(err) {
						// Send to you
						req.socket.emit('destroyFeedComment', { commentId: req.param('commentId') });
						// Send to everyone listening within this company
						req.socket.broadcast.to('dash-cid-' + req.session.userinfo.companyId).emit('destroyFeedComment', { commentId: req.param('commentId') });
					});
				} else {
					res.json({ success: false, reason: 'user mismatch' });
				}
			} else if(!err & !comment) {
				res.json({ success: false, reason: 'comment not found' });
			} else(err) {
				res.json({ success: false, reason: 'database error', error: err })
			}
		});
	},

};
