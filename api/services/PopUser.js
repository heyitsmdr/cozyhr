function UserPopulated(search, callback) {
  User.findOne(search).populate('company').populate('role').exec(function(e, user) {
    if(!e && user) {
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

    callback( e, user );
  });
};

function UserPopulatedPromise(search) {
  return User.findOne(search)
  .populate('company')
  .populate('role')
  .then(function(user) {
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

    return user;
  });
};

function UsersPopulated(search, opt, callback) {
  var _U = User.find();
  _U.where(search);

  if(opt.sort) {
    _U.sort(opt.sort)
  }

  _U.populate('company').populate('role').exec(function(e, users) {
    if(!e && users) {
      users.forEach(function(user) {
        // Set up special functions
        user.genPicture = function(smallPicture) {
          return {
            name: this.fullName(),
            picture: this.picture,
            small: smallPicture,
            position: this.role.jobTitle
          };
        };
      });
    }

    callback( e, users );
  });
};

function UsersPopulatedPromise(search, opt) {
  var _U = User.find();
  _U.where(search);

  if(opt.sort) {
    _U.sort(opt.sort)
  }

  _U.populate('company').populate('role').then(function(users) {
    if(users) {
      users.forEach(function(user) {
        // Set up special functions
        user.genPicture = function(smallPicture) {
          return {
            name: this.fullName(),
            picture: this.picture,
            small: smallPicture,
            position: this.role.jobTitle
          };
        };
      });
    }

    return users;
  });

  return _U;
};

module.exports = {
  one: UserPopulated,
  onePromise: UserPopulatedPromise,
  many: UsersPopulated,
  manyPromise: UsersPopulatedPromise
}