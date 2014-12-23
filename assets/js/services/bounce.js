Cozy.factory('$bounce', function() {
  return function(func) {
    return _.debounce(func, 500, true);
  };
});