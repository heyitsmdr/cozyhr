Cozy.controller('TimeclockController', function($scope, $rootScope, $cozy, $offices) {
  $rootScope.subsection = 'Timeclock';
  $rootScope.pageId = $rootScope.PAGES.TIMECLOCK;

  $('#selOffice').chosen({
    width: '200px',
    placeholder_text_single: 'Choose an Office'
  });

  $offices.sync().then(function() {
    $scope.offices = $offices.bindableGetOffices();
  });

  $scope.$watch('offices', function() {
    $scope.$evalAsync(function() {
      $('#selOffice').val( localStorage.lastOffice || $('#selOffice option:first').val() ).trigger('chosen:updated');

      $scope.selectedOfficeChanged($('#selOffice').val());
    });
  });

  $scope.selectedOfficeChanged = function(officeId) {
    $offices.getOfficeById(officeId).then(function(_office) {
      $scope.positions = _office.positions;

      localStorage.lastOffice = officeId;
    });
  };

  $('#selOffice').on('change', function(evt, params) {
    $scope.selectedOfficeChanged(params.selected);
  });
});