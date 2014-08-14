function UserPopulated(search, callback) {
  User.findOne(search).populate('company').populate('role').exec(function(e, user) {
    // Set up special functions
    user.genPicture = function(smallPicture) {
      return {
        name: this.fullName(),
        picture: this.picture,
        small: smallPicture,
        position: this.models.permission.jobTitle
      };
    };

    callback( e, user );
  });
};

function UserSpecial(uid, callback) {
  User.findOne(uid).exec(function(error, usr) {
    usr.models = [];

    // Get permissions
    Permission.findOne(usr.permissionId).exec(function(e, permission) {
      usr.models.permission = permission;

      // Get company
      Company.findOne(usr.companyId).exec(function(e, company) {
        usr.models.company = company;

        // Set up special functions
        usr.genPicture = function(smallPicture) {
          return {
            name: this.fullName(),
            picture: this.picture,
            small: smallPicture,
            position: this.models.permission.jobTitle
          };
        };

        callback(usr);
      });
    })
  });
};

function UsersSpecial(search, opt, callback) {
  var _usrs = [];

  var _U = User.find();
  _U.where(search);

  if(opt.sort) {
    _U.sort(opt.sort)
  }

  _U.exec(function(error, usrs) {

    async.each(usrs, function(usr, asyncCallback) {
      usr.models = [];

      // Get permissions
      Permission.findOne(usr.permissionId).exec(function(e, permission) {
        usr.models.permission = permission;

        // Get company
        Company.findOne(usr.companyId).exec(function(e, company) {
          usr.models.company = company;

          // Set up special functions
          usr.genPicture = function(smallPicture) {
            return {
              name: this.fullName(),
              picture: this.picture,
              small: smallPicture,
              position: this.models.permission.jobTitle
            };
          };

          _usrs.push(usr);
          asyncCallback();
        });
      });
    }, function() {
      callback(_usrs);
    });

  });
};


module.exports = {
  one: UserSpecial,
  many: UsersSpecial
}