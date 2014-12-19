var _ = require('lodash');

module.exports = {
	/**
   * @via     Socket
   * @method  GET
   */
	syncFeed: function(req, res) {
		var es = ExceptionService.require(req, res, { socket: true, GET: true });

		var filter = req.param('filter');
		var feedItems = [];
		var feedQueryParams = { company: req.session.userinfo.company.id };

		if(filter.toLowerCase() !== 'all') {
			feedQueryParams.office = [filter, null];
		}

		CompanyFeed.find(feedQueryParams)
		.limit(10)
		.skip(req.param('start'))
		.sort({ createdAt: 'desc' })
		.populate('office')
		.populate('comments')
		.then(function(feeds){
			var feedUsers = PopUser.manyPromise({ id: _.uniq(_.pluck(feeds, 'user')) }, {});

			var commentUsersArray = [];
			_.forEach(feeds, function(_feed) {
				_.forEach(_feed.comments, function(_comment) {
					commentUsersArray.push(_comment.user);
				});
			});

			var commentUsers = PopUser.manyPromise({ id: _.uniq(commentUsersArray) }, {});

			return [feeds, feedUsers, commentUsers];
		}).spread(function(feeds, feedUsers, commentUsers) {
			var feedUsers = _.indexBy(feedUsers, 'id');
			var commentUsers = _.indexBy(commentUsers, 'id');

			feeds.forEach(function(_feed) {
				_feed.userObj = feedUsers[_feed.user];

				_feed.comments.forEach(function(_comment) {
					_comment.userObj = commentUsers[_comment.user];

					_comment.authorName = _comment.userObj.fullName();
					_comment.picture = _comment.userObj.genPicture(true);
				});

				feedItems.push({
					authorName: _feed.userObj.fullName(),
					content: '<strong>' + _feed.userObj.fullName() + '</strong> ' + _feed.content,
					date: _feed.createdAt,
					feedid: _feed.id,
					comments: _feed.comments || [],
					picture: _feed.userObj.genPicture(false),
					mePicture: _feed.userObj.picture,
					officeName: ((_feed.office) ? _feed.office.name : 'Global')
				});

				res.json(feedItems);
			});
		}).catch(es.wrap(function(err) {
			throw ExceptionService.error(err);
		}));

	},

	/**
   * @via     Socket
   * @method  GET
   */
	getWorkingNow: function(req, res) {
		var es = ExceptionService.require(req, res, { socket: true, GET: true });

		workingNow = [];

		Clock.find({ company: req.session.userinfo.company.id, working: true}).populate('position').populate('office').exec(es.wrap(function(e, clocksWorking) {
			if(e) {
				throw ExceptionService.error('Could not get working clocks.');
			}

			async.each(clocksWorking, es.wrap(function(clockWorking, doneCallback) {
				PopUser.one(clockWorking.user, es.wrap(function(e, usr) {
					workingNow.push({
						picture: usr.genPicture(false),
						clockedPosition: clockWorking.position.name,
						clockedLocation: clockWorking.office.name,
						fullName: usr.fullName()
					});
					doneCallback();
				}));
			}), es.wrap(function(e) {
				if(e) {
					throw ExceptionService.error('Could not get working clocks.');
				}

				req.socket.emit('workersUpdate', workingNow);
			}));
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

			CompanyFeedComment.create({
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

		CompanyFeedComment.findOne(req.param('commentId')).exec(es.wrap(function(err, comment) {
			if(err)
				throw ExceptionService.error('Could not find comment.');

			if(comment) {
				var feedId = comment.feed;
				// Check if we're allowed to delete this
				if(comment.user == req.session.userinfo.id) {
					// Ok, let's delete.
					CompanyFeedComment.destroy({ id: comment.id }, es.wrap(function(err) {
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
