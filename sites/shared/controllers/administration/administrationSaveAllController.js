//Administration Save All Controller
'use strict';
angular.module('app')
    .controller('administrationSaveAllController',
    [
        '$filter', '$modalInstance', '$scope',
        'appSettingConstants', 'appSettingsFactory', 'entrepriseServices', 'parameterService', 'rxManagementService', 'utlString',
        function ($filter, $modalInstance, $scope,
                     appSettingConstants, appSettingsFactory, entrepriseServices, parameterService, rxManagementService, utlString) {

            //Initialize
            initialize();

            function initialize() {
                entrepriseServices
                    .lookup
                    .setMany([
                        [appSettingsFactory.dataLookups.administrationReason, "administrationReasonList"],
                        [appSettingsFactory.dataLookups.nonAdministrationReason, "nonAdministrationReasonList"],
                        [appSettingsFactory.dataLookups.administrationStatus, "administrationStatusList"]
                    ], $scope);
                $scope.cultureManager.resources.shared.load('administrationSaveAll');
                 
                var now = new Date();
                $scope.dateTimePickerOptions = angular.copy(appSettingsFactory.dateTimePickerOptions);
                $scope.dateTimePickerOptions.max = now;

                $scope.modelAdministrationSaveAll = {
                    timestamp: now,
                    statusAdministrationSelected: undefined,
                    reasonAdministrationSelected: undefined,
                    reasonPrecision: undefined
                };

                // $scope.administrationReasonList = [];
                // $scope.nonAdministrationReasonList = [];
                // $scope.administrationStatusList = [];
                $scope.inputMaxLength = appSettingConstants.inputMaxLength;
            }

             $scope.$watch('statusAdministrationSelected', function () {
                 if ($scope.administrationStatusList != []) {
                     $scope.modelAdministrationSaveAll.statusAdministrationSelected = appSettingsFactory.getDataLookupInstanceByCode('COMPLETE', $scope.administrationStatusList);
                 }
             });

             $scope.onClose = function () {
                 $modalInstance.dismiss('cancel');
             };

             $scope.getAdministrationStatuses = function () {
                 // Continuous wouldn't be processed in save all.
                 var res = [];
                 var targetCodes = ['COMPLETE', 'NOTGIVEN', 'PARTIAL'];
                 angular.forEach($scope.administrationStatusList, function (status) {
                     angular.forEach(targetCodes, function (code) {
                         if (code == status.code)
                             res.push(status);
                     });
                 });
                 return res;
             }

             $scope.onSubmit = function () {
                 var item = {};
                 typeof $scope.modelAdministrationSaveAll.timestamp === 'string' ? item.timestamp = $scope.modelAdministrationSaveAll.timestamp : item.timestamp = $filter('datetime')($scope.modelAdministrationSaveAll.timestamp);

                 if (utlString.isBlank(item.timestamp) && utlString.isNotBlank($scope.modelAdministrationSaveAll.timestampModel)) {
                     appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('INVALID_DATE'), $scope.cultureManager.resources.translate('CLOSE'));
                     return;
                 }

                 item.rxIds = $scope.ids;
                 item.status = $scope.modelAdministrationSaveAll.statusAdministrationSelected;
                 item.reason = $scope.modelAdministrationSaveAll.reasonAdministrationSelected;
                 item.reasonPrecision = $scope.modelAdministrationSaveAll.reasonPrecision;

                 $modalInstance.close(item);
             };

             $scope.onOpenCal = function (e) {
                 e.sender.setOptions(angular.extend(e.sender.options, { max: new Date() }));
             };
         }
    ]);