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

_signin.prototype.initRegister = function() {
  $(document).ready(function() {
    // doRegister
    var doRegister = function(e) {
      // Validation
      if(!CozyHR.validateText('#email', {empty:false})) { return; }
      if(!CozyHR.validateText('#subdomain', {empty:false})) { return; }
      if(!CozyHR.validateText('#nameFirst', {empty:false})) { return; }
      if(!CozyHR.validateText('#nameLast', {empty:false})) { return; }
      if(!CozyHR.validateText('#passwordOne', {empty:false})) { return; }
      if(!CozyHR.validateText('#passwordTwo', {empty:false,sameAs:'#passwordOne'}, 'The two passwords do not match.')) { return; }

      $.post('/auth/createCompany');
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