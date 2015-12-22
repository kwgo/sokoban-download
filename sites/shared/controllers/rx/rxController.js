'use strict';
angular
    .module('app')
    .controller('rxController',
    [
        '$scope', '$location', 'locationService', 'patientHelperFactory', 'appSettingConstants',
        function ($scope, $location, locationService, patientHelperFactory, appSettingConstants) {
            $scope.patientTemplateUrl = locationService.shared.views + "patient/patient.html";
            $scope.rxListTemplateUrl = locationService.shared.views + "rx/rx-list.html";

            $scope.isLoadingPatientHeader = true;
            $scope.isLoadingBody = true;
            $scope.isEpisodeFound = false;
            patientHelperFactory.isRefreshEnabled = true;
            $scope.model = {
                patient: {}
            };
           
            var pid;
            var encounterSid = null;
            // Embedded mode:
            // Get the patient ID from the url's query string
            // Note: The parameter in the URL can only be used in the embedded version
            if ($location.path().indexOf('/embedded/') >= 0) {
                pid = $location.search().pid;
                encounterSid = $location.search().encounterSid;
                sessionStorage.setItem(appSettingConstants.selectedEncounterKey, encounterSid);
            }
            // Mobile mode:
            // Get the patient ID from the session storage
            else {
                pid = sessionStorage.getItem(appSettingConstants.selectedPatientKey);
            }

            $scope.model.pid = pid;
            patientHelperFactory.initializeMainController($scope, $scope.model.pid, encounterSid);
        }
    ]);