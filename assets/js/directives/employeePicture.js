Cozy.directive('employeepicture', function($location) {
  return {
    restrict: 'E',
    scope: {
      employeeData: '=employee',
      showTooltip: '=tooltip'
    },
    template: '<div class="picture" ng-class="{tt: showTooltip}" ng-click="go()" title="{{tooltipData}}" style="background-image:url(\'{{employeeData.picture}}\')"></div>',
    link: function(scope, element, attrs) {

      scope.tooltipData = ((scope.showTooltip) ? 'Tooltip..' : '');

      scope.go = function() {
        $location.path('/employee/' + scope.employeeData.id);
      }
    }
  };
});