function UserPopulated(search, callback, res) {
  User.findOne(search).populate('company').populate('role').exec(function(e, user) {
    ExceptionService.checkMongoError(e);

    if(user) {
      // Set up special functions
      user.genPicture = function(smallPicture) {
        return {
          id: this.id,
          name: this.fullName(),
          picture: this.picture,
          small: smallPicture,
          position: this.role.jobTitle
        };
      };
    }

    try {
      callback( e, user );
    } catch(ex) {
      if(typeof res !== 'undefined') {
        res.serverError(ex);
      }
    }
  });
};

function UsersPopulated(search, opt, callback, res) {
  var _U = User.find();
  _U.where(search);

  if(opt.sort) {
    _U.sort(opt.sort)
  }

  _U.populate('company').populate('role').exec(function(e, users) {
    ExceptionService.checkMongoError(e);

    users.forEach(function(user) {
      // Set up special functions
      user.genPicture = function(smallPicture) {
        return {
          name: this.fullName(),
          picture: this.picture,
          small: smallPicture,
          position: this.models.permission.jobTitle
        };
      };
    });

    try {
      callback( e, users );
    } catch(ex) {
      if(typeof res !== 'undefined') {
        res.serverError(ex);
      }
    }
  });
};

module.exports = {
  one: UserPopulated,
  many: UsersPopulated
}