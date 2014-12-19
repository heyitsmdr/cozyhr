Cozy.filter('humanDate', function() {
  return function(val, formatType) {
    switch(formatType) {
      case 1:
        return moment(val).format('MMM Do, YYYY @ h:mma');
        break;
    }
  };
});