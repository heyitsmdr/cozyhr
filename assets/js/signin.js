var _signin = CozyHR.pageHelpers.signin = function() { };

_signin.prototype.init = function() {
  this.attemptLogin = _.debounce(function() {
    // NOTE: We're using jQuery here instead of sockets to preserve the host name
    $.post('/auth/attemptLogin', { email: $('#email').val(), password: $('#password').val() }, function(d) {
      if(d.success) {
        $('#signinWrapper').fadeOut(function() {
          document.location = "/dash";
        });
      } else {
        $('.press-enter').fadeOut(100, function() {
          $('.press-enter').removeClass('alert').addClass('alert').html(d.error).fadeIn(150);
        });
      }
    });
  }, 500, true);

  $(document).ready(function(){
    // Drop-down-fade-in logo
    $('#logo').hide().toggle('drop', { direction: 'up' });

    // Fade in content
    $('#pageSignin').fadeIn();

    if($('.authSignin').length > 0) {
      var doSignin = function(e) {
        if(e.which == 13) {
          e.preventDefault();

          if($('#email').val().length == 0) {
            $('#email').effect('pulsate', 100);
            return;
          } else if($('#password').val().length == 0) {
            $('#password').effect('pulsate', 100);
            return;
          }

          this.attemptLogin();
        }
      }.bind(this);
      $('#email').keyup(doSignin);
      $('#password').keyup(doSignin);

      $('#email').focus();
    } else if($('.authOrgRegister').length > 0) {
      var doRegister = function(e) {
        if(e.which == 13) {
          e.preventDefault();

          if($('#nameFirst').val().length == 0) {
            $('#nameFirst').effect('pulsate', 100);
            return;
          } else if($('#nameLast').val().length == 0) {
            $('#nameLast').effect('pulsate', 100);
            return;
          } else if($('#passwordOne').val().length == 0) {
            $('#passwordOne').effect('pulsate', 100);
            return;
          } else if($('#passwordTwo').val().length == 0) {
            $('#passwordTwo').effect('pulsate', 100);
            return;
          } else if($('#passwordOne').val() != $('#passwordTwo').val()) {
            $('#passwordTwo').effect('pulsate', 100);
            return;
          }

          $.post('/auth/createUser', { key: $('#inviteKey').val(), fn: $('#nameFirst').val(), ln: $('#nameLast').val(), password: $('#passwordOne').val() }, function(d) {
            if(d.success) {
              $('#signinWrapper').fadeOut(function() {
                alert("Your account has been created! You will now be redirected to the login screen.");
                document.location = "/auth/signin";
              });
            } else {
              alert(d.error);
            }
          });
        }
      };

      $('#nameFirst').keyup(doRegister);
      $('#nameLast').keyup(doRegister);
      $('#passwordOne').keyup(doRegister);
      $('#passwordTwo').keyup(doRegister);

      $('#nameFirst').focus();
    }
  }.bind(this));

  return this;
};

_signin.prototype.initRegister = function() {
  $(document).ready(function() {
    // doRegister
    var doRegister = function(e) {
      // Validation
      if(!CozyHR.validateText('#companyName', { notEmpty: true })) { return; }
      if(!CozyHR.validateText('#email', { notEmpty: true, isEmail: true }, 'The email is not formatted correctly.')) { return; }
      if(!CozyHR.validateText('#subdomain', { notEmpty: true })) { return; }
      if(!CozyHR.validateText('#nameFirst', { notEmpty: true })) { return; }
      if(!CozyHR.validateText('#nameLast', { notEmpty: true })) { return; }
      if(!CozyHR.validateText('#passwordOne', { notEmpty: true })) { return; }
      if(!CozyHR.validateText('#passwordTwo', { notEmpty: true, sameAs: '#passwordOne' }, 'The two passwords do not match.')) { return; }

      $('.press-enter').html('<i class="fa fa-spinner fa-spin"></i>');

      $.post('/auth/createCompany', {
        companyName: $('#companyName').val(),
        email: $('#email').val(),
        subdomain: $('#subdomain').val(),
        nameFirst: $('#nameFirst').val(),
        nameLast: $('#nameLast').val(),
        password: $('#passwordTwo').val()
      }, function(res) {
        $('.press-enter').html('Press enter to start enjoying the benefits of CozyHR.');

        if(res.success) {
          alert("Your company has been created! You will now be redirected to the login screen.");
          if(CozyHR.env === 'development') {
            document.location = "http://" + res.subdomain.replace('.cozyhr.com', '.dev.cozyhr.com') + "/auth/signin";
          } else {
            document.location = "http://" + res.subdomain + "/auth/signin";
          }
        } else {
          CozyHR.notify(res.error, {color: 'red', sound: true});
        }
      });
    };

    // Bind
    CozyHR.bindText('#email', doRegister);
    CozyHR.bindText('#subdomain', doRegister);
    CozyHR.bindText('#nameFirst', doRegister);
    CozyHR.bindText('#nameLast', doRegister);
    CozyHR.bindText('#passwordOne', doRegister);
    CozyHR.bindText('#passwordTwo', doRegister);
  });
};