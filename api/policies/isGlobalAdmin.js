module.exports = function(req, res, next) {

  // Check if user is an admin
  if (req.session.globalAdmin) {
    return next();
  }

  // If not, forbid route
  return res.forbidden('You are not permitted to perform this action.');
};
