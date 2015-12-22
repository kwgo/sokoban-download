'use strict';
angular.module('app')
    .controller('rxAdHocController',
    [
         '$scope', '$location', 'locationService', 'patientHelperFactory', '$timeout', 'appSettingConstants',
         function ($scope, $location, locationService, patientHelperFactory, $timeout, appSettingConstants) {
            $scope.patientTemplateUrl = locationService.shared.views + "patient/patient.html";
            $scope.rxAdHocTemplateUrl = locationService.shared.views + "rx/rx-adhoc.html";
            $scope.flowSheetTemplateUrl = locationService.shared.views + "flowsheet.html";

            $scope.isLoadingPatientHeader = true;
            $scope.isLoadingBody = true;
            $scope.isEpisodeFound = false;

            $scope.model = {
                patient: {}
            };

            var pid = sessionStorage.getItem(appSettingConstants.selectedPatientKey);
            var encounterSid = sessionStorage.getItem(appSettingConstants.selectedEncounterKey);;
             // Fetch the patient from either the session storage or from the patient service
            patientHelperFactory.initializeMainController($scope, pid, encounterSid);

             //send to child scope
            $scope.$on('UpdateRefreshButton', function (event, args) {
                $timeout(function () {
                    $scope.$broadcast('UpdateRefreshButton', args);
                },250);
                
            });
             //send to child scope
            $scope.$on('UpdatePrintButton', function (event, args) {
                $timeout(function () {
                    $scope.$broadcast('UpdatePrintButton', args);
                }, 250);

            });
        }
    ]
);
