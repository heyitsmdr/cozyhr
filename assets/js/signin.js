var SIGNIN_UTILS = function() { SIGNIN_UTILS.instance = this; };

SIGNIN_UTILS.instance = null;

SIGNIN_UTILS.prototype.init = function() {
  $(document).ready(function(){
    var doSignin = function(e) {
      if(e.which == 13) {
        e.preventDefault();
        
        if($('#email').val().length == 0 || $('#password').val().length == 0) {
          return;
        }
        
        $.post('/auth/do_signin', { email: $('#email').val(), password: $('#password').val() }, function(d) {
          if(d.success) {
            $('#signinWrapper').fadeOut(function() {
              document.location = "/dash";
            });
          } else {
            alert(d.error);
          }
        });
      }
    };
    $('#email').keyup(doSignin);
    $('#password').keyup(doSignin);

    $('#email').focus();
  }.bind(SIGNIN_UTILS.instance));
};