'use strict';
angular
    .module('app')
    .controller('rxAdministrationController',
    [
        '$scope', '$location', 'locationService', 'patientHelperFactory', 
        function ($scope, $location, locationService, patientHelperFactory) {
            $scope.patientTemplateUrl = locationService.shared.views + "patient/patient.html";
            $scope.rxAdministrationTemplateUrl = locationService.shared.views + "administration/administration.html";

            $scope.isLoadingPatientHeader = true;
            $scope.isLoadingBody = true;
            $scope.isEpisodeFound = false;
            patientHelperFactory.isRefreshEnabled = true;
            $scope.model = {
                patient: {}
            };

            // Fetch the patient from either the session storage or from the patient service
            patientHelperFactory.initializeMainController($scope, null);
        }
    ]);