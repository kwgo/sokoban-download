//Rx Suspension Controller
'use strict';
angular.module('app')
    .controller('rxSuspensionController',
    [
         '$scope', '$modalInstance', 'entrepriseServices', 'appSettingsFactory', 'rxManagementService', '$filter', 'utlString', 'parameterService', 'appSettingConstants',
         function ($scope, $modalInstance, entrepriseServices, appSettingsFactory, rxManagementService, $filter, utlString, parameterService, appSettingConstants) {

             // set the form
             $scope.init = function (scope) {
                 // Set UI Model
                 $scope.model = scope;

                 //Initialize
                 initialize();
             };

             function initialize() {
                 $scope.cultureManager.resources.shared.load('rx-suspension');
                 $scope.dateTimePickerOptions = appSettingsFactory.dateTimePickerOptions;
                 $scope.modelSuspension = {};
                 $scope.modelSuspension.noteSuspension = "";
                 $scope.modelSuspension.startTimestamp = $filter('date')(new Date(), appSettingsFactory.dateTimePickerOptions.format);
                 $scope.modelSuspension.stopTimestamp = "";
                 $scope.suspensionReasonList = [];
                 $scope.parameter = {};
                 $scope.inputMaxLength = appSettingConstants.inputMaxLength;
                 $scope.openWindowTime = angular.copy($scope.modelSuspension.startTimestamp);

                 loadSuspensionReasonList();
                 loadParameter();
             }

             $scope.nowPlusMinute = function () {
                 //add 1 minute to now date
                 var now = appSettingsFactory.localDateTime(new Date());
                 return now.setMinutes(now.getMinutes() + 1);
             };
             $scope.onClose = function () {
                 $modalInstance.dismiss('cancel');
             };

             $scope.reasonMadatory = function () {
                 return ($scope.parameter.stopSuspensionReasonMandatory && $scope.mode == "END_SUSPENSION") || ($scope.parameter.suspensionReasonMandatory && $scope.mode == "SUSPENSION");
             };

             $scope.onSubmit = function () {
                 if (($scope.model.suspensionForm.$valid)) {
                     if ((!angular.isDefined($scope.modelSuspension.startTimestamp) || $scope.modelSuspension.startTimestamp == "" || $scope.modelSuspension.startTimestamp == null) && $scope.mode == "SUSPENSION") {
                         appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('DATE_START_MANDATORY'), $scope.cultureManager.resources.translate('CLOSE'));
                         return;
                     };

                     if ($scope.openWindowTime != $scope.modelSuspension.startTimestamp) {
                         var dateBegin = angular.copy(new Date($scope.modelSuspension.startTimestamp));
                         // 1 minute is added because there is no second in startTimestamp 
                         dateBegin.setMinutes(dateBegin.getMinutes() + 1);
                         if (dateBegin < new Date() && $scope.mode == "SUSPENSION") {
                             appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('DATE_START_INFERIOR_TO_NOW'), $scope.cultureManager.resources.translate('CLOSE'));
                             return;
                         };
                     }
                     if (utlString.isNotEmpty($scope.modelSuspension.stopTimestamp) && $scope.mode == "SUSPENSION") {
                         var stopTimestamp = angular.copy(new Date($scope.modelSuspension.stopTimestamp));
                         stopTimestamp.setMinutes(stopTimestamp.getMinutes() + 1);
                         dateBegin = angular.copy(new Date($scope.modelSuspension.startTimestamp));
                         if (stopTimestamp < dateBegin) {
                             appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('DATE_END_INFERIOR_TO_DATE_START'), $scope.cultureManager.resources.translate('CLOSE'));
                             return;
                         };
                     };

                     if ($scope.reasonMadatory()
                         && (!angular.isDefined($scope.modelSuspension.reasonSuspensionSelected) || !angular.isDefined($scope.modelSuspension.reasonSuspensionSelected.id))) {
                         appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('REASON_MANDATORY'), $scope.cultureManager.resources.translate('CLOSE'));
                         return;
                     };

                     var item = {};
                     item.rxIds = $scope.ids;
                     if ($scope.mode == "END_SUSPENSION") {
                         item.startTimestamp = "";
                         item.stopTimestamp = "";
                     } else {
                         if (angular.isDate($scope.modelSuspension.startTimestamp)) {
                             item.startTimestamp = $scope.modelSuspension.startTimestamp;
                         } else {
                             item.startTimestamp = moment($scope.modelSuspension.startTimestamp).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
                         };
                         if (utlString.isEmpty($scope.modelSuspension.stopTimestamp) || angular.isDate($scope.modelSuspension.stopTimestamp)) {
                             item.stopTimestamp = $scope.modelSuspension.stopTimestamp;
                         } else {
                             item.stopTimestamp = moment($scope.modelSuspension.stopTimestamp).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
                         };
                     }

                     item.reasonId = null;
                     if (angular.isDefined($scope.modelSuspension.reasonSuspensionSelected) && $scope.modelSuspension.reasonSuspensionSelected !== null)
                         item.reasonId = $scope.modelSuspension.reasonSuspensionSelected.id;

                     item.note = $scope.modelSuspension.noteSuspension;

                     rxManagementService.suspend($scope.ids.toString(), item.reasonId, item.note, item.startTimestamp, item.stopTimestamp, $scope.mode, $scope.excludeMarkInError)
                        .then(
                            function (itemsSuspended) {
                                $modalInstance.close(itemsSuspended);
                            },
                            function (scError) {
                                console.log("CONTROLLER: " + JSON.stringify(scError));
                                appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), scError.data.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                            }
                        );

                 } else {
                     if (angular.isDefined($scope.model.suspensionForm.$error) && angular.isDefined($scope.model.suspensionForm.$error.required)) {
                         angular.forEach($scope.model.suspensionForm.$error.required, function (field) {
                             field.$setViewValue(field.$viewValue);
                         });
                     }
                 }
             };

             // Get Suspension Reason list
             function loadSuspensionReasonList() {
                 if ($scope.mode == "END_SUSPENSION") {
                     entrepriseServices
                         .lookup
                         .set(appSettingsFactory.dataLookups.endSuspensionReason, "suspensionReasonList", $scope);
                 } else {
                     entrepriseServices
                         .lookup
                         .set(appSettingsFactory.dataLookups.suspensionReason, "suspensionReasonList", $scope);
                 }
             };
             
             // Load parameters
             function loadParameter() {
                 parameterService.get().then(function (scResult) {
                     $scope.parameter = scResult;
                 });
             }
         }
    ]);