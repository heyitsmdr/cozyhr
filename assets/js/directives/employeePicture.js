Cozy.directive('employeepicture', function($location) {
  return {
    restrict: 'E',
    scope: {
      id: '=id',
      picture: '=picture',
      tooltip: '=tooltip',
      name: '=name',
      job: '=job',
      small: '=small'
    },
    template: '<div class="picture" ng-class="{tt: tooltip, small: small}" ng-click="go()" title="{{tooltipData}}" style="background-image:url(\'{{picture}}\')"></div>',
    link: function(scope) {

      scope.tooltipData = ((scope.tooltip) ? '<div class="tooltip"><span class="name">' + scope.name + '</span><br><span class="position">' + scope.job + "</span></div>": '');

      scope.go = function() {
        $location.path('/employee/' + scope.id);
      };
    }
  };
});