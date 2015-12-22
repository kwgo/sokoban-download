'use strict';
angular
    .module('app')
    .controller('rxManageController',
    [
        '$scope', '$filter', '$location', 'locationService', 'patientHelperFactory', 'patientService', 'visitService', 'appSettingConstants',
        function ($scope, $filter, $location, locationService, patientHelperFactory, patientService, visitService, appSettingConstants) {
            $scope.patientTemplateUrl = locationService.shared.views + "patient/patient.html";
            $scope.rxManagementTemplateUrl = locationService.shared.views + "rx/rx-management.html";

            $scope.isLoadingPatientHeader = true;
            $scope.isLoadingBody = true;
            $scope.isEpisodeFound = false;
            $scope.isFormDirty = true;
            patientHelperFactory.isRefreshEnabled = true;
            $scope.model = {
                patient: {}
            };

            // Fetch the patient from either the session storage or from the patient service
            patientHelperFactory.initializeMainController($scope, null);
        }
    ]
);