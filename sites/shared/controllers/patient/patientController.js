/*
    Patient controller
*/

'use strict';
angular.module('app')
    .controller('patientController',
    [
        '$rootScope', '$scope', '$window', '$filter', '$modal', 'authService', 'cultureManager', 'popupService', 'locationService', 'appSettingConstants', 'patientHelperFactory',
        function ($rootScope, $scope, $window, $filter, $modal, authService, cultureManagerm, popupService, locationService, appSettingConstants, patientHelperFactory) {
            $scope.isLoadingPatientHeader = true;
            $scope.cultureManager.resources.shared.load("patient");
            //init value with patient helper
            $scope.isRefreshEnabled = true;
            $scope.isPrintEnabled = true;
            $scope.model = {
                patient: {}
            };

            $scope.$on('isLoadingPatientHeaderChanged', function(event, args) {
                $scope.isLoadingPatientHeader = args.val;
            });

            $scope.isEpisodeFound = false;
            $scope.$on('isEpisodeFound', function (event, args) {
                $scope.isEpisodeFound = args.value;            
            });
            $scope.$on('patientChanged', function (event, args) {
                if ($scope.model.patient != args.val)
                {
                    $scope.model.patient = args.val;
                }
            });

            $scope.$on('UpdateRefreshButton', function (event, args) {
                $scope.isRefreshEnabled = args.val;
            });

            $scope.$on('UpdatePrintButton', function (event, args) {
                $scope.isPrintEnabled = args.val;
            });
            //logout event
            $scope.$on(authService.events.logoutSuccess, function (event, args) {
                closeReportWindow();
            });
            //autologout session expired, keepAliveFailed
            $scope.$on(authService.events.keepAliveFailed, function (event, args) {
                closeReportWindow();
            });
            //browser is about to close tab or reload page
            $window.addEventListener("beforeunload", function (event) {
                closeReportWindow();
            });

            // Show patient details popup
            $scope.showPatientDetails = function() {            
                popupService.popup(
                {
                    size: 'sm',
                    modal: true,
                    title: $scope.cultureManager.resources.translate('PATIENT_DETAILS_TITLE'),
                    closeBtnText: $scope.cultureManager.resources.translate('OK')
                },
                {
                    templateUrl: locationService.shared.views + "patient/patient-details.html",
                    controller: [
                        "$scope", "$modalInstance",
                        function (popupScope, $modalInstance) {
                            popupScope.model = $scope.model;
                            popupScope.onClose = function () {
                                $modalInstance.dismiss('close');
                            };
                        }
                    ]
                });
            };

            $scope.refresh = function () {
                sessionStorage.removeItem(appSettingConstants.selectedPatientEntityKey);
                // Fetch the patient from either the session storage or from the patient service
                $scope.isLoadingPatientHeader = true;
                $scope.isLoadingBody = true;
                patientHelperFactory.initializeMainController($scope, null, null, $rootScope);
                initialize();
            };


            $scope.displayReportFilter = function () {
                var scope = $rootScope.$new();
                scope.patient = $scope.model.patient;
                var modalInstance = $modal.open({
                    templateUrl: locationService.shared.views + "report/report-filter.html",
                    controller: 'reportController',
                    windowClass: 'report-modal-window',
                    scope: scope,
                    backdrop: 'static',
                    keyboard: false
                });

                modalInstance.result
                .then(function (winref) {
                    $scope.reportWinRef = winref;
                }, function () {
                    //NOTHING
                });
            };

            // Get the patient's age
            $scope.getAgeByBirthDate = function(birthDate) {
                var birthDateObject = moment(birthDate);
                var currentDateObject = moment(Date.now());
                var numberOfDaysSinceBirth = currentDateObject.diff(birthDateObject, "days");
                var numberOfWeeksSinceBirth = currentDateObject.diff(birthDateObject, "weeks");
                var numberOfMonthsSinceBirth = currentDateObject.diff(birthDateObject, "months");
                var numberOfYearsSinceBirth = currentDateObject.diff(birthDateObject, "years");

                if (numberOfWeeksSinceBirth < 2) {
                    return numberOfDaysSinceBirth + " " + getAgeSuffix('DAY_OLD', 'DAYS_OLD', numberOfDaysSinceBirth);
                } else if (numberOfMonthsSinceBirth < 2) {
                    return numberOfWeeksSinceBirth + " " + getAgeSuffix('WEEK_OLD', 'WEEKS_OLD', numberOfWeeksSinceBirth);
                } else if (numberOfYearsSinceBirth < 2) {
                    return numberOfMonthsSinceBirth + " " + getAgeSuffix('MONTH_OLD', 'MONTHS_OLD', numberOfMonthsSinceBirth);
                }

                return numberOfYearsSinceBirth + " " + getAgeSuffix('YEAR_OLD', 'YEARS_OLD', numberOfYearsSinceBirth);
            };

            // return to patient list
            $scope.goToPatientList = function () {
                sessionStorage.removeItem(appSettingConstants.toggleGroups);
                $scope.pageManager.redirect('patients');
            };

            // Get the singular or plural age suffix (year/years, month/months, week/weeks, day/days)
            function getAgeSuffix(translationKeySingular, translationKeyPlural, number) {
                return number < 2 ?
                    $scope.cultureManager.resources.translate(translationKeySingular) :
                    $scope.cultureManager.resources.translate(translationKeyPlural);
            }

            initialize();

            function initialize() {
                var patient = JSON.parse(sessionStorage.getItem(appSettingConstants.selectedPatientEntityKey));
                if (angular.isDefined(patient) && patient != null && patient != "undefined") {
                    $scope.model.patient = patient;
                    $scope.isEpisodeFound = $scope.model.patient.selectedEpisode != null;
                    $scope.isLoadingPatientHeader = false;
                }
            }

            function closeReportWindow() {
                if ($scope.reportWinRef != null) $scope.reportWinRef.close();
            }
        }
    ]
);