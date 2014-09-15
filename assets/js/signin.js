var _signin = CozyHR.pageHelpers.signin = function() { };

_signin.prototype.init = function() {
  this.attemptLogin = _.debounce(function() {
    $.post('/auth/do_signin', { email: $('#email').val(), password: $('#password').val() }, function(d) {
      if(d.success) {
        $('#signinWrapper').fadeOut(function() {
          document.location = "/dash";
        });
      } else {
        $('.press-enter').fadeOut(function() {
          $('.press-enter').removeClass('alert').addClass('alert').html(d.error).fadeIn();
        });
      }
    });
  }, 500, true);

  $(document).ready(function(){
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

          $.post('/auth/do_org_register', { key: $('#inviteKey').val(), fn: $('#nameFirst').val(), ln: $('#nameLast').val(), password: $('#passwordOne').val() }, function(d) {
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