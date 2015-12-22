/*
    Patient list controller
*/

'use strict';
angular.module('app')
    .controller('patientListController',
    [
        '$scope', '$http', 'locationService', 'patientListService', 'authService', 'appSettingConstants', 'appSettingsFactory', 'entrepriseServices', 'storageService', '$q', 'utlString',  
        function ($scope, $http, locationService, patientListService, authService, appSettingConstants, appSettingsFactory, entrepriseServices, storageService, $q, utlString ) {

            $scope.$on('logoutEvent', function () {
                appSettingsFactory.logoutAndRedirectToDefault();
            });

            $scope.defaultSortList = {
                orderByField: 'COL' + padNumber(0, 2, '0'), //set default sort column on RM-BED COL00
                reverseSort: false
            };

            $scope.model = {
                rosters: [],
                selectedRoster: {},
                rosterHeader: [],
                rosterRows: [],
                defaultRosterId: authService.model.identity.user.defaultRosterDID,
                sortList: angular.copy($scope.defaultSortList)
            };

            initialize();
            // Initialize content
            function initialize() {
                //reset tooglegroups to default
                sessionStorage.removeItem(appSettingConstants.toggleGroups);
                //Check for saved sortlistparameter
                var sortList = JSON.parse(sessionStorage.getItem(appSettingConstants.patientsSortParameterKey));
                if (sortList != null) $scope.model.sortList = sortList;
                // Remove the keys in the above array from the session storage
                var sessionStorageKeys = [
                    appSettingConstants.selectedPatientEntityKey,
                   // appSettingConstants.selectedPatientKey,
                    //appSettingConstants.selectedEncounterKey,
                    //appSettingConstants.selectedVisitKey,
                    appSettingConstants.selectedRxKey,
                    appSettingConstants.filtersInactiveRxKey
                ];
                storageService.session.removeAll(sessionStorageKeys);

                $q.all({
                    resources: $scope.cultureManager.resources.shared.load("patients"),
                    lookups: entrepriseServices.lookup.getMany([appSettingsFactory.dataLookups.visitAdministrationPriority]),
                    rosters: patientListService.getRosterList()
                })
                .then(function (response) {
                    var defaultIndication = $scope.cultureManager.resources.translate('DEFAULT_PATIENT_LIST');

                    entrepriseServices.lookup.set(appSettingsFactory.dataLookups.visitAdministrationPriority, "visitAdministrationPriorityList", $scope);

                    $scope.model.rosters = response.rosters;

                    if (angular.isDefined($scope.model.rosters) && $scope.model.rosters != null) {
                        if (($scope.model.rosters.length > 0)) {
                            // Add "Default" to the current user's default list
                            $scope.model.rosters = Enumerable.From($scope.model.rosters)
                                .Select(function(i) {
                                    if (i.rosterId == $scope.model.defaultRosterId) {
                                        i.name = i.name + defaultIndication;
                                    }
                                    return i;
                                })
                                .ToArray();

                            var selectedRoster = sessionStorage.getItem(appSettingConstants.selectedRosterKey);
                            // If the episode is undefined (initial load)
                            if (angular.isUndefined(selectedRoster) || selectedRoster == null || selectedRoster == "undefined") {
                                // Select the default roster
                                $scope.model.selectedRoster = Enumerable.From($scope.model.rosters)
                                    .Where(function(i) {
                                        return i.rosterId == $scope.model.defaultRosterId;
                                    })
                                    .Select(function(i) {
                                        return i;
                                    })
                                    .FirstOrDefault(); // First

                                // If a default roster could not be found, use the first one in the dropdown
                                if (angular.isUndefined($scope.model.selectedRoster)) {
                                    // Select the first list in the dropdown
                                    $scope.model.selectedRoster = Enumerable.From($scope.model.rosters)
                                        .Select(function(i) {
                                            return i;
                                        })
                                        .FirstOrDefault(); // First                                
                                }

                                // Set the roster in session storage to the selected roster (first roster in the dropdown)
                                sessionStorage.setItem(appSettingConstants.selectedRosterKey, $scope.model.selectedRoster.rosterId);
                            }
                            // If the roster has been defined in session storage (happens when a roster is selected in the dropdown)
                            else {
                                // Get the selected roster
                                $scope.model.selectedRoster = Enumerable.From($scope.model.rosters)
                                    .Where(function(i) {
                                        return i.rosterId == selectedRoster;
                                    })
                                    .Select(function(i) {
                                        return i;
                                    })
                                    .FirstOrDefault(); // Selected
                            }
                        }
                    }

                    loadRoster();

                }, function(err) {
                    var x = "";
                });
            }

            function loadRoster() {
                if (angular.isDefined($scope.model.selectedRoster.rosterId)) {
                    patientListService.getRoster($scope.model.selectedRoster.rosterId)
                        .then(
                            // Success
                            function(result) {
                                var data = result;
                                var rows = Enumerable.From(data);
                                var emptyHeaderRow = Enumerable.From(rows.Where(function (row) { return row.isHeader; }).First().cells).Select(function (row) { return row.value == null; }).ToArray();
                                var headerRow = Enumerable.From(rows.Where(function (row) { return row.isHeader; }).First().cells).Select(function (row) { return row.value; });
                                var dataRow = rows.Where(function (row) { return !row.isHeader; });

                                //Create Header Object
                                $scope.model.rosterHeader = headerRow.Where(function (item, index) {
                                    return !emptyHeaderRow[index];
                                }).Select(function(value, index) {
                                    return { colId: 'COL' + padNumber(index, 2, '0'), value: value }; 
                                }).ToObject("$.colId", "$.value");
                              
                                var columns = Enumerable.From(rows.Where(function (row) { return row.isHeader; }).First().cells).Select(function (row, index) { return { value: row.value, index: index }; }).ToObject("$.value", "$.index");

                                //Create the data collection
                                $scope.model.rosterRows = dataRow.Select(function (item) {
                                    var cells =  Enumerable.Range(0, headerRow.Count()).Where(function (i, index) {
                                        return !emptyHeaderRow[index];
                                    }).Zip(Enumerable.From(item.cells).Where(function (i, index) {
                                        return !emptyHeaderRow[index];
                                    }), function (outer, inner, index) {
                                        return { colId: 'COL' + padNumber(index, 2, '0'), value: index != columns.Status - 1 ? inner.value : appSettingsFactory.getDataLookupShortDescriptionById(inner.value, $scope.visitAdministrationPriorityList) };
                                    }).ToObject("$.colId", "$.value");
                                    return angular.extend(cells, {state: item.state,
                                                                    pid: item.pid,
                                                           encounterSID: item.encounterSID,
                                                                visitId: item.visitId,
                                          visitAdministrationPriorityId: item.visitAdministrationPriorityId
                                    });
                                }).ToArray();

                                $scope.isLoading = false;
                            },
                            function(error) {
                                $scope.isLoading = false;
                            }
                        );
                }
            };

            $scope.selectedRosterChanged = function () {
                sessionStorage.setItem(appSettingConstants.selectedRosterKey, $scope.model.selectedRoster.rosterId);
                $scope.model.sortList = angular.copy($scope.defaultSortList); //got back to default sort
                loadRoster();
            };

            $scope.displayPatient = function (pid, encounterSid, visitId) {
                sessionStorage.setItem(appSettingConstants.selectedPatientKey, pid);
                sessionStorage.setItem(appSettingConstants.selectedEncounterKey, encounterSid);
                sessionStorage.setItem(appSettingConstants.selectedVisitKey, visitId);
                sessionStorage.setItem(appSettingConstants.patientsSortParameterKey, JSON.stringify($scope.model.sortList));
                sessionStorage.removeItem(appSettingConstants.selectedPatientEntityKey);
                $scope.pageManager.redirect('rx');
            }

            $scope.onColumnHeaderClick = function (column) {
                $scope.model.sortList.orderByField = column;
                $scope.model.sortList.reverseSort = !$scope.model.sortList.reverseSort;
            };

            $scope.normalizeOrderBy = function (item) {
               return utlString.normalize(item[$scope.model.sortList.orderByField]);
            };
            $scope.normalize = function (value) {
                return utlString.normalize(value);
            };
            $scope.normalizeSearch = function (item) {
                if (!$scope.model.sortList.query)
                    return true;
                var searchValue = utlString.normalize($scope.model.sortList.query);
                var isFound = false;
                angular.forEach(item, function (value, key) {
                    if (value && key.indexOf('COL') === 0) {
                        var itemValue = utlString.normalize(value);
                        if (itemValue.indexOf(searchValue) > -1) isFound =  true;
                    }
                });
                return isFound;
            };
            function padNumber(number, length, car) {  
                var str = '' + number;
                while (str.length < length) {
                    str = car + str;
                }
                return str;
            }

        }
    ]
);