//Rx Cease Controller
'use strict';
angular.module('app')
    .controller('rxCeaseController', 
    [
         '$scope', '$modalInstance', 'entrepriseServices', 'appSettingsFactory', 'rxManagementService', 'parameterService', 'appSettingConstants',
         function ($scope, $modalInstance, entrepriseServices, appSettingsFactory, rxManagementService, parameterService, appSettingConstants) {

             // set the form
             $scope.init = function (scope) {
                 // Set UI Model
                 $scope.model = scope;

                 //Initialize
                 initialize();
             };

             function initialize() {
                 $scope.cultureManager.resources.shared.load('rx-cease');
                 $scope.modelCease = {};
                 $scope.modelCease.noteCease = "";
                 $scope.cessationReasonList = [];
                 $scope.parameter = {};
                 $scope.inputMaxLength = appSettingConstants.inputMaxLength;
                 loadCessationReasonList();
                 loadParameter();
                 console.log("ids to cease: " + $scope.ids);
             }

             $scope.reasonMadatory = function () {
                 return ($scope.parameter.cessationReactivationReasonMandatory && $scope.mode == "REACTIVATION") || ($scope.parameter.cessationReasonMandatory && $scope.mode == "CEASE");
             };

             $scope.onClose = function () {
                 $modalInstance.dismiss('cancel');
             };

             $scope.onSubmit = function () {
                 if (($scope.model.ceaseForm.$valid)) {
                     if ($scope.reasonMadatory()
                         && ((!angular.isDefined($scope.modelCease.reasonCeaseSelected) || !angular.isDefined($scope.modelCease.reasonCeaseSelected.id)))) {
                         appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('REASON_MANDATORY'), $scope.cultureManager.resources.translate('CLOSE'));
                         return;
                     }

                     var reasonId = null;
                     if (angular.isDefined($scope.modelCease.reasonCeaseSelected) && $scope.modelCease.reasonCeaseSelected !== null)
                         reasonId = $scope.modelCease.reasonCeaseSelected.id;

                     rxManagementService.cease($scope.ids.toString(), reasonId, $scope.modelCease.noteCease, $scope.mode, $scope.excludeMarkInError)
                        .then(
                            function (itemsCeased) {
                                //if (scResult.Result > 0) {
                                //    $scope.currentItem = scResult.Result[0];
                                //}
                                $modalInstance.close(itemsCeased);
                            },
                            function (scError) {
                                console.log("CONTROLLER: " + JSON.stringify(scError.data.Errors));
                                appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), scError.data.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                            }
                        );
                 } else {
                     if (angular.isDefined($scope.model.ceaseForm.$error) && angular.isDefined($scope.model.ceaseForm.$error.required)) {
                         angular.forEach($scope.model.ceaseForm.$error.required, function (field) {
                            field.$setViewValue(field.$viewValue);
                         });
                     }
                 }
             };

             // Get cessation Reason list
             function loadCessationReasonList() {
                 if ($scope.mode == "REACTIVATION") {
                     entrepriseServices
                         .lookup
                         .set(appSettingsFactory.dataLookups.reactivationReason, "cessationReasonList", $scope);
                 } else {
                     entrepriseServices
                         .lookup
                         .set(appSettingsFactory.dataLookups.cessationReason, "cessationReasonList", $scope);
                 }

             }
            

             // Load parameters
             function loadParameter() {
                 parameterService.get().then(function (scResult) {
                     $scope.parameter = scResult;
                 });
             }
         }
    ]);