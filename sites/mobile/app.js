'use strict';

angular
    .module('app', ['lgi.infra.web.framework', 'lgi.emr.mar.web'])
    .run(
    [
        '$rootScope', 'authService', 'appSettingConstants', 'permissionsHelperFactory', 'appSettingsFactory', 'storageService', 'cultureManager', 'historyService',
        function ($rootScope, authService, appSettingConstants, permissionsHelperFactory, appSettingsFactory, storageService, cultureManager, historyService) {
            $rootScope.$on(authService.events.loginSuccess, function() {
                cleanSessionStorage();
            });
            $rootScope.$on(authService.events.logoutSuccess, function () {
                cleanSessionStorage();
            });

            function cleanSessionStorage() {
                // List of session storage keys that need to be removed
                var sessionStorageKeys = [
                    { key: appSettingConstants.selectedPatientEntityKey },
                    { key: appSettingConstants.selectedPatientKey },
                    { key: appSettingConstants.selectedEncounterKey },
                    { key: appSettingConstants.selectedVisitKey },
                    { key: appSettingConstants.selectedRxKey },
                    { key: appSettingConstants.selectedAdminKey },
                    { key: appSettingConstants.selectedRosterKey },
                    { key: appSettingConstants.selectedFrequencyTemplateKey },
                    { key: appSettingConstants.selectedNextAdministrationKey },
                    { key: appSettingConstants.filtersInactiveRxKey },
                    { key: appSettingConstants.toggleGroups },
                    { key: appSettingConstants.patientsSortParameterKey },
                    { key: appSettingConstants.parameterKey },
                    { key: appSettingConstants.mdsKey },
                    { key: appSettingConstants.displayMxSearchAtLoadKey }
                ];

                // Remove the keys in the above array from the session storage
                angular.forEach(sessionStorageKeys, function (item) {
                    if (sessionStorage.getItem(item.key) !== null) {
                        sessionStorage.removeItem(item.key);
                    }
                });
                //reset lookups with empty collection
                var cultures = {};
                cultureManager.supportedCultures.ForEach(function (culture) {
                    cultures[culture.Culture.Code] = [];
                });
                sessionStorage.setItem(appSettingConstants.lookupsKey, JSON.stringify(cultures));
            }

            // Load roles list
            $rootScope.permission = permissionsHelperFactory.permission();
            
            // Sets our application-specific row filter to the history service.
            historyService.setRowFilter(appSettingsFactory.historyRowFilter);
        }
    ]);