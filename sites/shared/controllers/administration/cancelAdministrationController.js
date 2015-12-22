//Cancel administration Controller
'use strict';
angular.module('app')
    .controller('cancelAdministrationController', 
    [
         '$scope', '$modalInstance', 'entrepriseServices', 'appSettingsFactory', 'administrationService', 'appSettingConstants',
         function ($scope, $modalInstance, entrepriseServices, appSettingsFactory, administrationService, appSettingConstants) {

             //Initialize
             initialize();
             function initialize() {
                 $scope.cultureManager.resources.shared.load('administration-cancel');
                 $scope.model = {};
                 $scope.model.reasonCancelSelected = undefined;
                 $scope.cancellationReasonList = [];
                 $scope.inputMaxLength = appSettingConstants.inputMaxLength;
                 loadCancelReasonList();
             }

             // set the form
             $scope.setFormScope = function (scope) {
                $scope.model = scope;
             };

             // Click on close
             $scope.onClose = function () {
                 $modalInstance.dismiss('cancel');
             };

             // Click on OK
             $scope.onSubmit = function () {
                 if (($scope.model.cancelAdministrationForm.$valid)) {

                     // Cancel flowsheets
                     angular.forEach($scope.administration.workflowInstances, function (workflow) {
                         if (!workflow.isCancelled) {
                             workflow.isCancelled = true;
                             workflow.cancellationReasonId = $scope.model.reasonCancelSelected.id;
                         }
                     });

                     // Cancel preparation
                     if ($scope.isPreparation) {

                         $scope.administration.preparationCancellationReasonId = $scope.model.reasonCancelSelected.id;
                         $scope.administration.preparationCancellationNote = $scope.model.noteCancel;
                         administrationService.cancelDoubleCheckPreparation($scope.administration)
                             .then(
                                 function (itemsCanceled) {
                                     $modalInstance.close(itemsCanceled);
                                 },
                                 function (scError) {
                                     console.log("CONTROLLER: " + JSON.stringify(scError.data.Errors));
                                     appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), scError.data.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                                 }
                             );
                     } else {
                         // Cancel administration
                         $scope.administration.cancellationReasonId = $scope.model.reasonCancelSelected.id;
                         $scope.administration.cancellationNote = $scope.model.noteCancel;
                         administrationService.cancelAdministration($scope.administration)
                             .then(
                                 function(itemsCanceled) {
                                     $modalInstance.close(itemsCanceled);
                                 },
                                 function(scError) {
                                     console.log("CONTROLLER: " + JSON.stringify(scError.data.Errors));
                                     appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), scError.data.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                                 }
                             );
                     }
                 } else {
                     $scope.model.cancelAdministrationForm.reasonCancellation.$setViewValue($scope.model.cancelAdministrationForm.reasonCancellation.$viewValue);
                 }
             };

             // Get Cancel Reason list
             function loadCancelReasonList()
             {
                entrepriseServices
                    .lookup
                    .set(appSettingsFactory.dataLookups.cancellationReason, "cancellationReasonList", $scope);
             }

         }
    ]);