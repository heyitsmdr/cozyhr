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
					_comment.authorId = commentUsers[_comment.user].id;
					_comment.authorName = commentUsers[_comment.user].fullName();
					_comment.authorPicture = commentUsers[_comment.user].picture;
					_comment.authorJob = commentUsers[_comment.user].role.jobTitle;
				});

				feedItems.push({
					authorName: _feed.userObj.fullName(),
					authorJobTitle: _feed.userObj.role.jobTitle,
					authorPicture: _feed.userObj.picture,
					authorId: _feed.userObj.id,
					content: '<strong>' + _feed.userObj.fullName() + '</strong> ' + _feed.content,
					date: _feed.createdAt,
					feedid: _feed.id,
					comments: _feed.comments || [],
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

		// TODO: Check if feedid exists belongs to your company

		User.findOne(req.session.userinfo.id)
			.then(function() {

				CompanyFeedComment.create({
					feed: req.param('feedid'),
					user: req.session.userinfo.id,
					content: req.param('comment')
				}).exec(es.wrap(function(err, newComment){
					if(err) {
						throw ExceptionService.error(err);
					}

					newComment.authorId = req.session.userinfo.id;
					newComment.authorJob = req.session.userinfo.role.jobTitle;
					newComment.authorName = req.session.userinfo.fullName;
					newComment.authorPicture = req.session.userinfo.picture;

					// Update everyone
					sails.io.sockets.in('cid-'+req.session.userinfo.company.id).emit('addedComment', {
						feedId: req.param('feedid'),
						comment: newComment
					});

					res.json({ success: true });
				}));
			})
			.catch(es.wrap(function() {
				throw ExceptionService.error('Could not find user.');
			}));
	},

	/**
   * @via     Socket
   * @method  POST
   */
	removeComment: function(req, res) {
		var es = ExceptionService.require(req, res, { socket: true, POST: true });

		CompanyFeedComment.findOne(req.param('commentId')).exec(es.wrap(function(err, comment) {
			if(err) {
				throw ExceptionService.error('Could not find comment.');
			}

			if(comment) {
				var feedId = comment.feed;
				// Check if we're allowed to delete this
				if(comment.user === req.session.userinfo.id) {
					// Ok, let's delete.
					CompanyFeedComment.destroy({ id: comment.id }, es.wrap(function(err) {
						if(err) {
							throw ExceptionService.error('Could not delete comment.');
						}

						// Update everyone
						sails.io.sockets.in('cid-'+req.session.userinfo.company.id).emit('removedComment', { commentId: req.param('commentId') });

						res.json({ success: true });
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
