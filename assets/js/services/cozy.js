Cozy.factory('$cozy', function($sails) {
  return {
    get: function(a, b, c) {
      console.log('%c[ GET ]%c ' + a, 'color:#fff;background-color:#000', 'color:#000');
      if(typeof b !== 'undefined' && typeof b !== 'function') {
        console.log(b);
      }

      return $sails.get(a, b, c);
    },

    post: function(a, b, c) {
      console.log('%c[ POST ]%c ' + a, 'color:#fff;background-color:#000', 'color:#000');
      if(typeof b !== 'undefined' && typeof b !== 'function') {
        console.log(b);
      }

      return $sails.post(a, b, c);
    },

    on: function(a, b) {
      console.log('%c[ BOUND ]%c ' + a, 'color:#fff;background-color:#000', 'color:#000');

      $sails.on(a, function(c) {
        console.log('%c[ EVENT ]%c ' + a, 'color:#fff;background-color:#000', 'color:#000');
        console.log(c);

        b(c);
      });
    },

    confirm: function(opt) {
      swal({
        title: opt.title || 'Are you sure?',
        text: opt.text || 'This will be deleted.',
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DD6B55',
        confirmButtonText: opt.confirm || 'Yes, delete it!',
        closeOnConfirm: false
      }, function() {

        opt.confirmed(function(confirmedOpt) {
          swal({
            title: confirmedOpt.title || 'Deleted!',
            text: confirmedOpt.text || 'The item has been deleted!',
            closeOnConfirm: false
          }, function() {
            swal({title:"", timer:1});

            if(typeof confirmedOpt.confirmed === 'function') {
              confirmedOpt.confirmed();
            }
          });
        });

      });
    },

    notify: function(content, options) {
      if(options === undefined) {
        options = {};
      }

      return new jBox('Notice', {
        content: content,
        autoClose: 5000,
        animation: {open: 'flip', close: 'flip'},
        color: (options.color || 'black'),
        audio: ((options.sound===true) ? '/sounds/bling2' : '')
      });
    }

  };
});