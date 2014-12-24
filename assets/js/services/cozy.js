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
    }
  };
});