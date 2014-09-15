function UserPopulated(search, callback) {
  User.findOne(search).populate('company').populate('role').exec(function(e, user) {
    if(!e && user) {
      // Set up special functions
      user.genPicture = function(smallPicture) {
        return {
          name: this.fullName(),
          picture: this.picture,
          small: smallPicture,
          position: this.models.permission.jobTitle
        };
      };
    }

    callback( e, user );
  });
};

function UsersPopulated(search, opt, callback) {
  var _U = User.find();
  _U.where(search);

  if(opt.sort) {
    _U.sort(opt.sort)
  }

  _U.populate('company').populate('role').exec(function(e, users) {

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

    callback( e, users );
  });
};

module.exports = {
  one: UserPopulated,
  many: UsersPopulated
}