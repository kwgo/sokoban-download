/*
   patientHelperFactory
   Common code for rxController and administrationController
*/

'use strict';

angular
    .module('app')
    .factory('patientHelperFactory', function ($q, $filter, $location, cultureManager, locationService, patientService, visitService, appSettingConstants, appSettingsFactory) {
        var factory = {};

        var scope = null;
        var rootScope = null;

        factory.initializeMainController = function (mainControllerScope, pid, encounterSid, _rootScope) {
            var patientId = null;
            var visitId = null;
            scope = mainControllerScope;
            rootScope = _rootScope;

            // Initialize scope variables to watch
            initializeScopeVariablesToWatch();            

            // Use the patient id in the query string if it exists
            if (pid != undefined && pid != "" && pid != null) {
                if (sessionStorage.getItem(appSettingConstants.selectedPatientKey) != pid) {
                    sessionStorage.setItem(appSettingConstants.selectedPatientKey, pid);
                    sessionStorage.removeItem(appSettingConstants.selectedPatientEntityKey);
                    sessionStorage.removeItem(appSettingConstants.selectedEncounterKey);
                    sessionStorage.removeItem(appSettingConstants.selectedVisitKey);
                    sessionStorage.removeItem(appSettingConstants.filtersInactiveRxKey);
                    // Groups collapse session key are composed 
                    sessionStorage.removeItem(appSettingConstants.toggleGroups);
                }

                patientId = pid;
            }
            // Or use the patient id in the session storage if it exists
            else if (sessionStorage.getItem(appSettingConstants.selectedPatientKey) != null && sessionStorage.getItem(appSettingConstants.selectedPatientKey) != "") {
                patientId = sessionStorage.getItem(appSettingConstants.selectedPatientKey);
            }

            // Try to get the patient from the session storage
            var patient = JSON.parse(sessionStorage.getItem(appSettingConstants.selectedPatientEntityKey));
            // If the patient exists in the session storage, use it
            if (angular.isDefined(patient) && patient != null && patient != "undefined") {
                scope.model.patient = patient;
                scope.isEpisodeFound = scope.model.patient.selectedEpisode != null;
                scope.isLoadingPatientHeader = false;

                // Embedded mode:
                // Use the encounterSid in the session storage if it exists to determine the corresponding visit id
                var visitTemp = sessionStorage.getItem(appSettingConstants.selectedVisitKey);
                if ($location.path().indexOf('/embedded/') >= 0 && angular.isDefined(encounterSid) && encounterSid != null && (angular.isUndefined(visitTemp) || visitTemp == null || visitTemp == '')) {
                    sessionStorage.setItem(appSettingConstants.selectedEncounterKey, encounterSid);
                    visitId = factory.getVisitFromEncounter(scope.model.patient.episodes, encounterSid);
                    sessionStorage.setItem(appSettingConstants.selectedVisitKey, visitId);
                    scope.model.patient.selectedEpisode = getSelectedEpisode(visitId);
                }
            }
            // Otherwise, get the patient from the patient service
            else {
                // Redirect to the patient list page if the patientId is null
                if (patientId == null) {
                    if (scope.pageManager.lastPageUrl.indexOf("mobile") >= 0) {
                        // Redirect to patient list page after login
                        scope.pageManager.redirect('patients');
                    }
                }
                // If the patientId is not null, get it from the patient service
                else {
                    // Fetch the patient from the patient service
                    factory.getPatient(patientId)
                        .then(
                            // Success
                            function(result) {
                                scope.model.patient = result;
                                scope.isEpisodeFound = scope.model.patient.selectedEpisode != null;

                                // Embedded mode:
                                // Use the encounterSid in the session storage if it exists to determine the corresponding visit id
                                if ($location.path().indexOf('/embedded/') >= 0) {
                                    //var encounterSid = sessionStorage.getItem(appSettingConstants.selectedEncounterKey);
                                    if (encounterSid != undefined && encounterSid != "" && encounterSid != null) {
                                        if (sessionStorage.getItem(appSettingConstants.selectedVisitKey) != encounterSid) {

                                            // Get the encounter's visitId
                                            visitId = factory.getVisitFromEncounter(scope.model.patient.episodes, encounterSid);

                                            // Update the visitId in the session storage
                                            sessionStorage.setItem(appSettingConstants.selectedVisitKey, visitId);

                                            // Update the encounter SID in the session storage
                                            sessionStorage.setItem(appSettingConstants.selectedEncounterKey, encounterSid);
                                        }
                                    }
                                }
                                // Mobile mode:
                                // Get the visit from the session storage
                                else {
                                    visitId = sessionStorage.getItem(appSettingConstants.selectedVisitKey);
                                }

                                // Get the selected episode
                                scope.model.patient.selectedEpisode = getSelectedEpisode(visitId);

                                // Format the visit description so that it appears in the required format in the episode dropdown
                                scope.model.patient.episodes = Enumerable.From(scope.model.patient.episodes)
                                        .Select(function(i) {
                                            var visitDescriptionFormatted = i.visit.visitID;

                                            if (i.facilityDescription != null && i.facilityDescription != null) {
                                                visitDescriptionFormatted = visitDescriptionFormatted + ' (' + i.facilityDescription + ' - ' + i.localizationDescription + ')';
                                            }

                                            if (i.visit.visitEndDtm != null) {
                                                visitDescriptionFormatted = visitDescriptionFormatted + ', ' + $filter('datetimeutc')(i.visit.visitEndDtm);
                                            }

                                            i.visitDescription = visitDescriptionFormatted;
                                            return i;
                                        })
                                        .ToArray();

                                scope.isLoadingPatientHeader = false;
                            },
                            // Error
                            function(error) {
                                scope.isLoadingPatientHeader = false;
                            }
                        );
                }
            }
        }

        // Format the patient's data
        factory.getPatient = function (patientId) {
            var deferred = $q.defer();
            var patient = null;

            // Fetch the patient from the patient service if need be
            if (patientId != null) {
                $q.all({
                        resources: cultureManager.resources.shared.load("patient"),
                        patient: patientService.get(patientId)
                    })
                    .then(function(response) {
                        // Format the patient (date, MDROs, allergies, etc.)
                        patient = formatPatient(response.patient);

                        // Set the last refresh date to the current datetime
                        patient.lastRefreshDate = new Date();

                        deferred.resolve(angular.copy(patient));

                    }, function(error) {
                        deferred.reject();
                    });

              
            }
            else {
                deferred.resolve(angular.copy(patient));
            }

            return deferred.promise;
        }

        factory.getVisitFromEncounter = function(episodeList, encounterSid) {
            var visitId = null;
            if (encounterSid != undefined && encounterSid != "" && encounterSid != null) {
                // Get the encounter's visitId
                visitId = Enumerable.From(episodeList)
                    .Where(function(i) { return i.encounterSID == encounterSid; })
                    .Select(function(i) { return i.visit.visitID; })
                    .FirstOrDefault();
            }

            return visitId;
        }

        function getSelectedEpisode(visitId) {
            var episode;
            // Select the first episode in the dropdown
            if (angular.isDefined(visitId) && visitId != null && visitId != "") {
                episode = Enumerable.From(scope.model.patient.episodes)
                    .Where(function(i) { return i.visit.visitID == visitId; })
                    .Select(function(i) { return i; })
                    .FirstOrDefault();
            }
            // Select the first episode in the dropdown
            else {
                episode = Enumerable.From(scope.model.patient.episodes)
                    .Select(function(i) { return i; })
                    .FirstOrDefault();
            }

            return episode;
        }

        factory.getSelectedEpisodeFromVisit = function (visitId) {
            var episode;
            // Select the first episode in the dropdown
            if (angular.isDefined(visitId) && visitId != null && visitId != "") {
                episode = Enumerable.From(scope.model.patient.episodes)
                    .Where(function (i) { return i.visit.visitID == visitId; })
                    .Select(function (i) { return i; })
                    .FirstOrDefault();
            }
                // Select the first episode in the dropdown
            else {
                episode = Enumerable.From(scope.model.patient.episodes)
                    .Select(function (i) { return i; })
                    .FirstOrDefault();
            }

            return episode;
        }

    function initializeScopeVariablesToWatch() {
        if (scope != null) {
            //unregister previous handle
            if (angular.isDefined(scope.isLoadingPatientHeaderHandle)) scope.isLoadingPatientHeaderHandle();
            if (angular.isDefined(scope.isLoadingBodyHandle)) scope.isLoadingBodyHandle();
            if (angular.isDefined(scope.modelPatientHandle)) scope.modelPatientHandle();
            if (angular.isDefined(scope.modelPatientSelectedEpisodeHandle)) scope.modelPatientSelectedEpisodeHandle();
                // Child body controllers/pages:
                // - rxListController -> rx-list.html
                // - administrationController -> administration.html
                // - rxManagementController -> rx-management.html
                // - rxAdhocManagementController -> rx-adhoc.html

                // Scope watch on the variable "isLoadingPatientHeader", which is used to determine if the header html page is loading.
                // While it is loading, it his hidden and it is diplayed when loading is done.
                scope.isLoadingPatientHeaderHandle = scope.$watch('isLoadingPatientHeader', function (newVal, oldVal) {
                    if (newVal != oldVal) {
                        scope.$broadcast('isLoadingPatientHeaderChanged', { "val": newVal });
                    }
                });

                // Scope watch on the variable "isLoadingBody", which is used to determine if the body html page is loading.
                // While it is loading, it his hidden and it is diplayed when loading is done.
                scope.isLoadingBodyHandle = scope.$watch('isLoadingBody', function (newVal, oldVal) {
                    if (newVal != oldVal) {
                        scope.$broadcast('isLoadingBodyChanged', { "val": newVal });
                    }
                });

                // Scope watch on the variable "model.patient", which is used to determine if changes have been made to the patient
                scope.modelPatientHandle = scope.$watch('model.patient', function (newVal, oldVal) {
                    if (newVal != oldVal) {
                        if (!angular.isUndefined(newVal) && newVal != null && newVal != "undefined") {
                            sessionStorage.setItem(appSettingConstants.selectedPatientEntityKey, JSON.stringify(newVal));
                        }
                        console.log('called from patient helper');
                        if (rootScope != null){
                            rootScope.$broadcast('patientChanged', { "val": newVal });
                        }else{
                            scope.$broadcast('patientChanged', { "val": newVal });
                        }

                    }
                });

                // Scope watch on the variable "model.patient.selectedEpisode", which is used to determine if changes have been made to the selected epîsode
                scope.modelPatientSelectedEpisodeHandle = scope.$watch('model.patient.selectedEpisode', function (newVal, oldVal) {
                    if (newVal != oldVal) {
                        if (angular.isDefined(newVal) && newVal != null && newVal != "undefined") {
                            sessionStorage.setItem(appSettingConstants.selectedVisitKey, newVal.visit.visitID);
                            sessionStorage.setItem(appSettingConstants.selectedPatientEntityKey, JSON.stringify(scope.model.patient));
                        }
                        scope.$broadcast('selectedEpisodeChanged', { "val": newVal });
                    }
                });
            }
        }

        // Format the patient's data
        function formatPatient(patient) {
            // A temp patient is used because the patientChanged event is called
            // when the patient changes inside the rxController, so we need to 
            // make sure that all of the required manipulations have been done
            // on the patient data that was returned by the patient service.
            // Only then do we set the patient to the tempPatient.
            var tempPatient = patient;
            tempPatient.selectedEpisode = null; // Initialize the selected episode to null
            tempPatient.currentVisit = null; // Initialize the current visit to null

            // Format the MDROs for display
            if (tempPatient.MDROs == null) {
                tempPatient.mdroCount = "0";
            }
            else {
                tempPatient.isShowMdroList = tempPatient.MDROs.length > 0;
                tempPatient.mdroCount = tempPatient.MDROs.length > 0 ? tempPatient.MDROs.length : cultureManager.resources.translate('MDROS_NONE');
            }

            // Format the allergies for display
            if (tempPatient.allergyInfo.noKnownAllergy) {
                tempPatient.allergyCount = cultureManager.resources.translate('ALLERGIES_NONE');
            }

            if (tempPatient.allergyInfo.unableToObtain) {
                tempPatient.allergyCount = "0";
            }

            if (tempPatient.allergyInfo.allergies == null) {
                tempPatient.allergyCount = "0";
            }
            else if (!tempPatient.allergyInfo.noKnownAllergy && !tempPatient.allergyInfo.unableToObtain) {
                tempPatient.isShowAllergyList = tempPatient.allergyInfo.allergies.length > 0;

                tempPatient.allergyCount = tempPatient.allergyInfo.allergies.length;
            }

            // Format the weight for display
            if (tempPatient.weight != null &&
                tempPatient.weight != "" &&
                tempPatient.weightUpdateDtm != null &&
                tempPatient.weightUpdateDtm != "") {

                tempPatient.isWeightMeasurementAvailable = true;
            }
            else {
                tempPatient.isWeightMeasurementAvailable = false;
            }

            // Format the height for display
            if (tempPatient.height != null &&
                tempPatient.height != "" &&
                tempPatient.heightUpdateDtm != null &&
                tempPatient.heightUpdateDtm != "") {

                tempPatient.isHeightMeasurementAvailable = true;
            }
            else {                
                tempPatient.isHeightMeasurementAvailable = false;
            }

            // Format the problems for problems
            if (tempPatient.problems == null) {
                tempPatient.problemsCount = 0;
            }
            else {
                tempPatient.isShowProblemsList = tempPatient.problems.length > 0;
                tempPatient.problemsCount = tempPatient.problems.length > 0 ? tempPatient.problems.length : cultureManager.resources.translate('PROBLEMS_NONE');
            }

            return patient;
        }

        return factory;
    });