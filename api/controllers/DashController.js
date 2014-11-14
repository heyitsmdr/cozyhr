module.exports = {

	/**
	 * @via     HTTP
	 * @method  GET
	 */
	home: function(req, res) {
		var es = ExceptionService.require(req, res, { GET: true });

		User.findOne(req.session.userinfo.id).exec(es.wrap(function(e, usr) {
			if(e)
				throw ExceptionService.error('Could not find the user.');

			Office.find({company: usr.company}).exec(es.wrap(function(e, offices) {
				if(e)
					throw ExceptionService.error('Could not get the offices for the company.')

				res.view('main/dash', {
					selectedPage: 'dash',
					picture: usr.generatePicture(false, req),
					offices: offices,
					mustacheTemplates: ['feedItem', 'feedItemComment']
				});
			}));
		}));
	},

	/**
   * @via     HTTP
   * @method  GET
   */
	sessionvars: function(req, res) {
		ExceptionService.require(req, res, { GET: true });

		res.send( req.session );
	},

  /**
   * @via     Socket
   * @method  GET
   */
	getFeed: function(req, res) {
		var es = ExceptionService.require(req, res, { socket: true, GET: true });

		var filter = req.param('filter');

		feedItems = [];

		var feedQueryParams = { company: req.session.userinfo.company.id };

		if(filter.toLowerCase() !== 'all') {
			feedQueryParams.office = [filter, null];
		}

		CompanyFeed.find(feedQueryParams).limit(10).skip(req.param('start')).sort({ createdAt: 'desc' }).populate('office').exec(es.wrap(function(err, feeds){
			if(err)
				throw ExceptionService.error('Could not get the company feed.');

			// Iterate through the feeds at this company
			async.each(feeds, es.wrap(function(feed, callback){
				// Let's gather the comments (if any)
				CompanyFeedComments.find({ feed: feed.id }).exec(es.wrap(function(err, feedComments){
					if(err)
						throw ExceptionService.error('Could not get feed comments.');

					// Iterate through the feedComments to get the authorName
					async.each(feedComments, es.wrap(function(comment, cb) {
						PopUser.one(comment.user, es.wrap(function(e, commentAuthor) {
							if(e)
								throw ExceptionService.error('Could not find comment author.');

							comment.authorName = commentAuthor.fullName();
							comment.picture = commentAuthor.genPicture(true);

							cb();
						}));
					}), es.wrap(function(err) {
						if(err)
							throw ExceptionService.error('Could not properly get feed comments.');

						PopUser.one(feed.user, es.wrap(function(e, author){
							if(e)
								throw ExceptionService.error('Could not find feed author.');

							feedItems.push({
								authorName: author.fullName(),
								content: '<strong>' + author.fullName() + '</strong> ' + feed.content,
								date: feed.createdAt,
								feedid: feed.id,
								comments: feedComments,
								picture: author.genPicture(false),
								mePicture: req.session.userinfo.picture,
								officeName: ((feed.office) ? feed.office.name : 'Global')
							});

							callback();
						}));
					}));
				}));
			}), es.wrap(function(err){
				if(err)
					throw ExceptionService.error('Could not properly get feed.');

				req.socket.emit('feedUpdate', feedItems);
			}));
		}));

		// Subscribe to comments for this company
		req.socket.join('dash-cid-' + req.session.userinfo.company.id);
	},

	/**
   * @via     Socket
   * @method  GET
   */
	getWorkingNow: function(req, res) {
		var es = ExceptionService.require(req, res, { socket: true, GET: true });

		workingNow = [];

		PopUser.one(req.session.userinfo.id, es.wrap(function(e, usr) {
			if(e)
				throw ExceptionService.error('Could not get user.');

			workingNow.push({
				picture: usr.genPicture(false)
			});

			workingNow.push({
				picture: usr.genPicture(false)
			});

			req.socket.emit('workersUpdate', workingNow);
		}));
	},

	/**
   * @via     Socket
   * @method  POST
   */
	writeComment: function(req, res) {
		var es = ExceptionService.require(req, res, { socket: true, POST: true });

		PopUser.one(req.session.userinfo.id, es.wrap(function(e, usr) {
			if(e)
				throw ExceptionService.error('Could not find user.');

			CompanyFeedComments.create({
				feed: req.param('feedid'),
				user: req.session.userinfo.id,
				content: req.param('comment')
			}).exec(es.wrap(function(err, newComment){
				if(err)
					throw ExceptionService.error('Could not create new comment.');

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
			}));

		}));
	},

	/**
   * @via     Socket
   * @method  POST
   */
	removeComment: function(req, res) {
		var es = ExceptionService.require(req, res, { socket: true, POST: true });

		CompanyFeedComments.findOne(req.param('commentId')).exec(es.wrap(function(err, comment) {
			if(err)
				throw ExceptionService.error('Could not find comment.');

			if(comment) {
				var feedId = comment.feed;
				// Check if we're allowed to delete this
				if(comment.user == req.session.userinfo.id) {
					// Ok, let's delete.
					CompanyFeedComments.destroy({ id: comment.id }, es.wrap(function(err) {
						if(err)
							throw ExceptionService.error('Could not delete comment.');

						// Send to you
						req.socket.emit('destroyFeedComment', { feedId: feedId, commentId: req.param('commentId') });
						// Send to everyone listening within this company
						req.socket.broadcast.to('dash-cid-' + req.session.userinfo.company.id).emit('destroyFeedComment', { feedId: feedId, commentId: req.param('commentId') });
					}));
				} else {
					throw ExceptionService.error('Tried to delete a comment with no ownership.');
				}
			} else {
				throw ExceptionService.error('Comment not found.');
			}
		}));
	},

};
