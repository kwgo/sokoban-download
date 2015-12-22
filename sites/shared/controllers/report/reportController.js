//Report Controller
'use strict';
angular.module('app')
    .controller('reportController',
    [
         '$scope', '$modalInstance', '$filter', '$window', '$timeout', 'locationService', 'appSettingsFactory', 'authService', 'entrepriseServices', 'cultureManager', 'appSettingConstants', 'patientHelperFactory',
         function ($scope, $modalInstance, $filter, $window, $timeout, locationService, appSettingsFactory, authService, entrepriseServices, cultureManager, appSettingConstants, patientHelperFactory) {
             


             $scope.changeSelection = function (type) {
                 $scope.selectedReport = type;
             };

             $scope.onClose = function () {
                 $modalInstance.dismiss('cancel');
             };

             // set the form
             $scope.init = function (scope) {
                 // Set UI Model
                 $scope.model = scope;

                 //Initialize
                 initialize();
             };

             $scope.onSubmit = function () {
                 if (($scope.model.reportForm.$valid)) {

                     var startdate = appSettingsFactory.createDate($scope.model.startTimestamp);
                     var stopdate = appSettingsFactory.createDate($scope.model.stopTimestamp);

                     if (startdate > stopdate) {
                         appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('DATE_START_INFERIOR_DATE_STOP'), $scope.cultureManager.resources.translate('CLOSE'));
                         return;
                     };

                     var user = authService.model.identity.user.lastName + ', ' + authService.model.identity.user.firstName;
                     var currentVisitId = sessionStorage.getItem(appSettingConstants.selectedVisitKey);
                     var currentSid = patientHelperFactory.getSelectedEpisodeFromVisit(currentVisitId);

                     var url = locationService.root + '/report/index' +
                         '/' + $scope.selectedReport +
                         '/' + convertToHex($scope.patient.patientID) +
                         '/' + convertToHex(authService.model.identity.user.token) +
                         '/' + convertToHex(currentSid.encounterSID) +
                         '/' + startdate +
                         '/' + stopdate +
                         '/' + convertToHex(user) +
                         '/' + cultureManager.currentCulture.Culture.Code +
                         '/' + convertToHex(authService.model.identity.user.userName);
                     if ($scope.selectedReport == 'flowsheets') {
                         url += '/' + convertToHex($scope.model.flowSheetCode);
                     }
                         var winRef = $window.open(url, "report_window");
                         $modalInstance.close(winRef);

                 } else {
                     if (angular.isDefined($scope.model.reportForm.$error) && angular.isDefined($scope.model.reportForm.$error.required)){
                         angular.forEach($scope.model.reportForm.$error.required, function (field) {
                             field.$setViewValue(field.$viewValue);
                         });
                     }
                 }
             };

             function convertToHex(str) {
                 var result = '';
                 for (var i = 0; i < str.length; i++) {
                     result += str.charCodeAt(i).toString(16);
                 }
                 return result;
             }

             function initialize() {

                 var lookups = [
                                    [appSettingsFactory.dataLookups.workflow, "flowSheetList"]
                               ];
                 entrepriseServices.lookup.setMany(lookups, $scope);

                 $scope.selectedReport = "prescriptions";
                 $scope.cultureManager.resources.shared.load('report-filter');

                 var now = new Date();
                 
                 $scope.model.stopTimestamp = $filter('date')(now.setMinutes(now.getMinutes() + 1), appSettingsFactory.dateTimePickerOptions.format);
                 $scope.model.startTimestamp = $filter('date')(now.setHours(0, 0, 0, 0), appSettingsFactory.dateTimePickerOptions.format);
                 $scope.model.flowSheetId = "";
             }
         }
    ]);