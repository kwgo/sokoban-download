'use strict';
angular
    .module('app')
    .controller('rxManagementController',
    [
        '$rootScope', '$scope', '$location', '$filter', '$timeout', '$templateCache', '$q', 'rxManagementService', 'frequencyTemplateService', 'popupService',
        'appSettingsFactory', 'appSettingConstants', '$modal', 'locationService', '$window', 'parameterService', 'rxNavigationPathConstants', 'rxHelperFactory', 'utlString', 'dateService', 'entrepriseServices',
        'permissionsHelperFactory', 
        function ($rootScope, $scope, $location, $filter, $timeout, $templateCache, $q, rxManagementService, frequencyTemplateService, popupService,
            appSettingsFactory, appSettingConstants, $modal, locationService, $window, parameterService, rxNavigationPathConstants, rxHelperFactory, utlString, dateService, entrepriseServices,
            permissionsHelperFactory) {

            var isSaveFromLogoutEvent = false;
            // Initialize the RX list model
            $scope.model = {
                list: [],
                patient: $scope.$parent.model.patient // Get the patient from the root controller's model.patient
            };

            //Embedded refresh callback
            $scope.$on('refreshCallback', function (event, args) {
                $timeout(function () {
                    $scope.$broadcast('triggerDirtyCheck', args);
                });
            });

            // Needs to be executed when the patient changes in the parent scope
            $scope.$on('patientChanged', function (event, args) {
                $timeout(function () {
                    $scope.$broadcast('triggerDirtyCheck', args);
                });  
            });

            $scope.$on('patientChangedAfterFormCheck', function (event, args) {
                if ($scope.model.patient != args.val) {
                    $scope.model.patient = args.val;
                    initialize();
                    $scope.editRxForm.$setPristine();
                }
            });

            $scope.$on('logoutEvent', function () {
                if (pageChanged()) {
                    isSaveFromLogoutEvent = true;
                    $scope.$broadcast('triggerDirtyCheck');
                }
                else appSettingsFactory.logoutAndRedirectToDefault();
            });

            $scope.$watch('selectedIndex', function () {
                    selectItem();
            });
            //DOUBLE CHECK DOSE 
            $scope.onDoubleCheckDose = function () {
                var scope = $rootScope.$new();
                scope.model = {};
                scope.model.rx = angular.copy($scope.currentItem);
                setScheduleObject(scope.model.rx);
                var modalInstance = $modal.open({
                    templateUrl: locationService.shared.views + "rx/rx-double-check-dose.html",
                    scope: scope,
                    controller: 'rxDoubleCheckDoseController',
                    windowClass: 'modal-window-medium',
                    backdrop: 'static',
                    keyboard: false
                });
                modalInstance.result.then(function (rx) {
                    $scope.currentItem = rx;
                    addExtraFields($scope.currentItem);
                    $scope.currentItemBkp = angular.copy($scope.currentItem);
                    $scope.itemsToManage[$scope.selectedIndex] = $scope.currentItem;
                    $scope.editRxForm.$setPristine();
                });
            }
            //doLaunchRxVigilance
            $scope.doLaunchRxVigilanceAdvisorProfessional = function () {
                rxHelperFactory.doLaunchRxVigilanceAdvisorProfessional($scope.parameter.advisorProfessionalCalculationIndexUrl);
            }
            $scope.doLaunchRxVigilanceAdvisorMonographs = function () {
                rxHelperFactory.doLaunchRxVigilanceAdvisorMonographs($scope.parameter.advisorMonographUrl, $scope.currentItem.mx.monographNumber);
            }
            // Clicked on an rx in the list
            $scope.manage = function ($index) {
                changeIndex($index);
            };

            $scope.frequencyDescriptionDisabled = function () {
                if ($scope.isAdministrationRealized || $scope.changeFrequencyNotAllowed()) {
                    return true;
                }

                return false;
            }

            if ($scope.cultureManager.currentCulture.Culture.Code == $scope.cultureManager.defaultCulture.Culture.Code) {
                $scope.frequencyDescriptionFilters = {
                    logic: "or",    
                    filters: [
                        { field: "code", operator: "contains" },
                        { field: "description", operator: "contains" }
                    ]
                };
            } else {
                $scope.frequencyDescriptionFilters = {
                    logic: "or",
                    filters: [
                        { field: "code", operator: "contains" },
                        { field: "descriptionsl", operator: "contains" }
                    ]
                };
            }

            $scope.isFormDirty = function() {
                return $scope.editRxForm.$dirty;
            };
            // Changed the frequency
            $scope.changeFrequencyType = function (value) {
                //set default values
                switch (value) {
                    case appSettingsFactory.rxScheduleTemplateTypeKey.days:
                        $scope.currentItem.frequencySelected.Data = new Lgi.Emr.Mar.Dto.frequencyDataDays();
                        $scope.currentItem.frequencySelected.Data.timesPerDay = 1;
                        $scope.currentItem.frequencySelected.Data.isEveryDay = true;
                        $scope.currentItem.frequencySelected.Data.dayPatternStep = 0;
                        $scope.currentItem.frequencySelected.Data.dayPatternFrequency = 0;
                        break;
                    case appSettingsFactory.rxScheduleTemplateTypeKey.hours:
                        $scope.currentItem.frequencySelected.Data = new Lgi.Emr.Mar.Dto.frequencyDataHours();
                        $scope.currentItem.frequencySelected.Data.hourFrequency = null;
                        emptyAdministrationTimes();
                        break;
                    case appSettingsFactory.rxScheduleTemplateTypeKey.minutes:
                        $scope.currentItem.frequencySelected.Data = new Lgi.Emr.Mar.Dto.frequencyDataMinutes();
                        $scope.currentItem.frequencySelected.Data.minuteFrequency = null;
                        emptyAdministrationTimes();
                        break;
                    case appSettingsFactory.rxScheduleTemplateTypeKey.weeks:
                        $scope.currentItem.frequencySelected.Data = new Lgi.Emr.Mar.Dto.frequencyDataWeeks();
                        $scope.currentItem.frequencySelected.Data.timesPerDay = 1;
                        $scope.currentItem.frequencySelected.Data.weekFrequency = 1;
                        $scope.currentItem.frequencySelected.Data.daysOfWeek = [];
                        break;
                    case appSettingsFactory.rxScheduleTemplateTypeKey.intervals:
                        $scope.currentItem.frequencySelected.Data = new Lgi.Emr.Mar.Dto.frequencyDataInterval();
                        $scope.currentItem.frequencySelected.Data.timesPerDay = 1;
                        $scope.currentItem.frequencySelected.Data.monthFrequency = 1;
                        $scope.currentItem.frequencySelected.Data.dayIntervalFrom = null;
                        $scope.currentItem.frequencySelected.Data.dayIntervalTo = null;
                        break;
                    case appSettingsFactory.rxScheduleTemplateTypeKey.listdaysofmonth:
                        $scope.currentItem.frequencySelected.Data = new Lgi.Emr.Mar.Dto.frequencyDataListDaysOfMonth();
                        $scope.currentItem.frequencySelected.Data.timesPerDay = 1;
                        $scope.currentItem.frequencySelected.Data.monthFrequency = 1;
                        $scope.currentItem.frequencySelected.Data.daysOfMonth = [];
                        break;
                    case appSettingsFactory.rxScheduleTemplateTypeKey.doseonly:
                        $scope.currentItem.frequencySelected.Data = new Lgi.Emr.Mar.Dto.frequencyDataDoseOnly();
                        emptyAdministrationTimes();
                        $scope.currentItem.frequencySelected.Data.numberOfDoses = 1;
                        break;
                    default:
                        break;
                }

            };
            $scope.popoverContentAdministrationTimes = function (item) {
                if (item.timestring != '' && (item.timestring != null)) {
                    var strToDisplay = $filter('shorttimeutc')(item.time);
                    //var strToDisplay = item.timestring;
                    strToDisplay += (item.description != null) && (item.description != '') ? ' - ' + item.description : '';
                    strToDisplay += (item.isToRemove == true) ? ' - ' + $filter('translate')('TO_REMOVE') : '';
                    return strToDisplay;
                } else {
                    return '';
                }
            };
            // Hide show the left bar
            $scope.reverseDisplay = function () {
                $scope.fullDisplay = !$scope.fullDisplay;
            };

            $scope.getAdministrationTimes = function (schedule) {
                var strReturn = '';
                var separator = ' - ';
                if (schedule != null) {
                    var administrationTimesList = Enumerable.From(schedule.pharmacyAdministrationTimes).OrderBy("$.time");
                    if (administrationTimesList.Count() > 0) {
                        administrationTimesList.ForEach(function (item) {
                            //strReturn += $filter('hourutc')(item.time) + separator;
                            strReturn += dateService.getDisplayTimeUtcWithHSeperator(item.time) + separator;
                        });
                        strReturn = strReturn.substring(0, strReturn.length - separator.length); //trim last separator
                    }
                }
                return strReturn;
            }

            $scope.setSubmitButtonId = function(value) {
                $scope.submitButtonId = value;
            };
            // Items all are validated?
            $scope.itemsValidated = function () {
                return !(Enumerable.From($scope.itemsToManage).Where(function (i) { return i.validated == false; }).ToArray().length > 1);
            };
            // Items all are started?
            $scope.itemsStarted = function () {
                return !(Enumerable.From($scope.itemsToManage).Where(function (i) { return i.isProcessed == false; }).ToArray().length > 1);
            };

            // show instruction filled icon
            $scope.instructionsFilled = function () {
                return (Enumerable.From($scope.currentItem.administrationTimes).Where(function (i) { return i.isToRemove || utlString.isNotBlank(i.description); }).ToArray().length > 0);
            };

            // Class Therapeutic description
            $scope.getClassTherapeuticDescription = function (id) {
                return appSettingsFactory.getDataLookupShortDescriptionById(id, $scope.mxClassList);
            };

            // Class Therapeutic code
            $scope.getClassTherapeuticCode = function (id) {
                return appSettingsFactory.getDataLookupCodeById(id, $scope.mxClassList);
            };

            // Class Therapeutic is double sign
            $scope.isClassTherapeuticDoubleSign = function () {
                var bool = false;
                if (angular.isDefined($scope.currentItem) && angular.isDefined($scope.currentItem.mx) && $scope.currentItem.areAdministrationsMustBeSigned) {
                    angular.forEach($scope.currentItem.mx.mxClassIds, function(id) {
                        var mxClass = appSettingsFactory.getDataLookupInstanceById(id, $scope.mxClassList);
                        if (angular.isDefined(mxClass) && mxClass !== null && mxClass.isDoubleSignature === true) {
                            bool = true;
                        }
                    });
                }
                return bool;
            };

            // route description
            $scope.getRouteDescription = function (id) {
                return appSettingsFactory.getDataLookupShortDescriptionById(id, $scope.routeList);
            };

            $scope.isAdministrationStatusPrepared = function (item) {
                return rxHelperFactory.isAdministrationStatusPrepared(item, $scope.administrationStatusList);
            };

            // Click on validate
            $scope.validate = function () {
                if (!$scope.currentItem.validated) {
                    //SAVE STUFF FOR CURRENT ITEM 
                    setScheduleObject($scope.currentItem);
                    var items = [];
                    items.push($scope.currentItem);
                    return validate(items);
                }
            };
            // Click on validateAll
            $scope.validateAll = function () {
                //SAVE STUFF FOR CURRENT ITEM 
                setScheduleObject($scope.currentItem);
                //Cleanup EmarTimes if unknown times

                var itemsList = angular.copy(Enumerable.From($scope.itemsToManage).Where(function (i) { return i.validated == false; }).ToArray());
                //Cleanup EmarAdministrationTimes if unknown times
                dropEmptyAdministrationTimes(itemsList);
                if (itemsList.length > 0) {
                    return validate(itemsList);
                }
            };
            // Click on Start
            $scope.startProcessing = function () {
                if (!$scope.currentItem.isProcessed) {
                    //SAVE STUFF FOR CURRENT ITEM 
                    setScheduleObject($scope.currentItem);
                    var items = [];
                    items.push($scope.currentItem);
                    return startProcessing(items);
                }
            };
            // Click on StartAll
            $scope.startProcessingAll = function () {
                //SAVE STUFF FOR CURRENT ITEM 
                setScheduleObject($scope.currentItem);
                var itemsList = Enumerable.From($scope.itemsToManage).Where(function (i) { return i.isProcessed == false; }).ToArray();
                if (itemsList.length > 0) {
                    return startProcessing(itemsList);
                }
            };

            // Click on cancel
            $scope.cancel = function () {
                if (pageChanged()) {
                    var onCloseFunction = function () {
                        // Do nothing if cancel  
                    };
                    var onActionFunction = function () {
                        // Restore the changed to bkp item
                        $scope.resetData();
                        $scope.currentItem.doubleCheckDoseStatus = rxHelperFactory.setDoubleCheckDoseStatus($scope.currentItem);
                    };

                    appSettingsFactory.displayConfirmation($scope.cultureManager.resources.translate('CANCEL_CHANGES'), $scope.cultureManager.resources.translate('CONFIRM_CANCEL_CHANGES'), $scope.cultureManager.resources.translate('YES'), $scope.cultureManager.resources.translate('NO'), null, onActionFunction, onCloseFunction);
                }
            };
            //3 different kinds of submit (pass submitButtonId to known which button was clicked)
            $scope.onSubmit = function () {
                var deferred = $q.defer();
                switch ($scope.submitButtonId) {
                    case 'saveButton':
                        $scope.save().then(function() {
                            deferred.resolve();
                        });
                        break;
                    case 'validateButton':
                        $scope.validate().then(function () {
                            deferred.resolve();
                        });
                        break;
                    case 'startProcessingButton':
                        $scope.startProcessing().then(function () {
                            deferred.resolve();
                        });
                        break;
                    case 'startProcessingAllButton':
                        $scope.startProcessingAll().then(function () {
                            deferred.resolve();
                        });
                        break;
                    default: // case of back button, Yes to save , validate or Start Processing
                        if ($scope.editRxForm.$valid) {
                            switch ($scope.pageManager.currentPage.Key) {
                                case $scope.manageNavigation:
                                    $scope.save().then(function () {
                                        deferred.resolve();
                                        //check if save origin is logout event
                                        if (isSaveFromLogoutEvent) appSettingsFactory.logoutAndRedirectToDefault();
                                    });
                                    break;
                                case $scope.validateNavigation:
                                    $scope.validate().then(function () {
                                        deferred.resolve();
                                        //check if save origin is logout event
                                        if (isSaveFromLogoutEvent) appSettingsFactory.logoutAndRedirectToDefault();
                                    });
                                    break;
                                case $scope.startProcessingNavigation:
                                    $scope.startProcessing().then(function () {
                                        deferred.resolve();
                                        //check if save origin is logout event
                                        if (isSaveFromLogoutEvent) appSettingsFactory.logoutAndRedirectToDefault();
                                    });
                                    break;
                                default:
                                    break;
                            } 
                        } else { //form is invalid trigger validation
                            appSettingsFactory.triggerValidations($scope.editRxForm);
                            deferred.reject();
                        }
                        break;
                }
                return deferred.promise;
            };
            // Click on save
            $scope.save = function () {
            	var deferred = $q.defer();
                var currentIndex = $scope.selectedIndex;
                //SAVE VIEW STUFF HERE 
                setScheduleObject($scope.currentItem);
                rxManagementService.save($scope.currentItem)
                    .then(
                        function (scResult) {
                            if (angular.isDefined(scResult.Result)) {                              
                                appSettingsFactory.displayPopover('top', '', $scope.cultureManager.resources.translate('ITEM_SAVED'), '#saveButton', 3000);
                                addExtraFields(scResult.Result); 
                                if (scResult.Result.id == $scope.currentItemBkp.id) {
                                    $scope.currentItemBkp = angular.copy($scope.currentItem);
                                }
                                $scope.currentItem = new Lgi.Emr.Mar.Dto.rxDto(scResult.Result);
                                $scope.itemsToManage[currentIndex] = $scope.currentItem;

                                $scope.editRxForm.$setPristine();
                            }
                            deferred.resolve();
                        },
                        function (scError) {
                            appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), scError.data.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                            deferred.reject();
                        }
                    );

                return deferred.promise;
            };

            $scope.cease = function () {
                // Prescription prepared, stat, late or due: do not allow ceasing
                if ($scope.currentItem.isLate || $scope.currentItem.isDue || $scope.currentItem.rxTypeCode == appSettingsFactory.rxSchedulePriorityKey.stat || $scope.isAdministrationStatusPrepared($scope.currentItem)) {
                    appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('COMPLETE_ADMINISTRATION'), $scope.cultureManager.resources.translate('CLOSE'));
                    return;
                }

                var status = appSettingsFactory.getDataLookupInstanceById($scope.currentItem.rxStatusId, $scope.rxStatusList);
                if (!canBeCeased(status)) {
                    appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('CANNOT_BE_CEASED') + status.shortDescription, $scope.cultureManager.resources.translate('CLOSE'));
                    return;
                }

                ceaseWindow("CEASE");
            };

            // Click on reactivate
            $scope.reactivateCeased = function () {
                var status = appSettingsFactory.getDataLookupInstanceById($scope.currentItem.rxStatusId, $scope.rxStatusList);
                if (status.code != appSettingsFactory.rxStatusKey.ceased) {
                    appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('CANNOT_CANCEL_CEASING') + status.shortDescription, $scope.cultureManager.resources.translate('CLOSE'));
                    return;
                }

                ceaseWindow("REACTIVATION");
            };
            // Click on suspend
            $scope.suspend = function () {
                // Prescription prepared, stat, late or due: do not allow suspend
                if ($scope.currentItem.isLate || $scope.currentItem.isDue || $scope.currentItem.rxTypeCode == appSettingsFactory.rxSchedulePriorityKey.stat || $scope.isAdministrationStatusPrepared($scope.currentItem)) {
                    appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('COMPLETE_ADMINISTRATION_SUSPENSION'), $scope.cultureManager.resources.translate('CLOSE'));
                    return;
                }
                var status = appSettingsFactory.getDataLookupInstanceById($scope.currentItem.rxStatusId, $scope.rxStatusList);
                if (!canBeSuspended(status)) {
                    appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('CANNOT_BE_SUSPENDED') + status.shortDescription, $scope.cultureManager.resources.translate('CLOSE'));
                    return;
                }

                suspendWindow("SUSPENSION");
            };
            // Click on unsuspend
            $scope.unsuspend = function () {
                var status = appSettingsFactory.getDataLookupInstanceById($scope.currentItem.rxStatusId, $scope.rxStatusList);
                if (status.code != appSettingsFactory.rxStatusKey.suspended) {
                    appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('CANNOT_CANCEL_SUSPENSION') + status.shortDescription, $scope.cultureManager.resources.translate('CLOSE'));
                    return;
                }
                suspendWindow("END_SUSPENSION");
            };
            // Click on administer
            $scope.addExtraDose = function () {

                if ($scope.isAdministrationStatusPrepared($scope.currentItem)) {
                    appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('ADMINISTRATION_STATUS_PREPARED') , $scope.cultureManager.resources.translate('CLOSE'));
                    return;
                }

                $scope.pageManager.redirect(rxNavigationPathConstants.administrationNavigationPath, [
                    { key: 'extradose', value: true }, { key: 'rxid', value: $scope.currentItem.id }
                ]);
            };
            // Click on administer
            $scope.rxAdministrationList = function () {
                $scope.pageManager.redirect(rxNavigationPathConstants.administrationNavigationPath, [
                    { key: 'admlist', value: true }, { key: 'rxid', value: $scope.currentItem.id }
                ]);
            };

            // Click on history button
            $scope.onViewHistory = function (id) {
                $scope.wndHistory.title($scope.cultureManager.resources.translate('RX_HISTORY_TITLE'));
                $rootScope.historyService.setParams(id, 'Rx'); // Replace 'Rx' with 'Administration' when already to audit 'Administration'
                //$rootScope.historyService.setParams(20036, 'Rx');  // *** DEBUG *** id hardcoded
                //$rootScope.historyService.setParams(732904, 'Patient');  // *** DEBUG *** id hardcoded
                $scope.historyWndVisible = true;
                //$scope.wndHistory.center().open();  -> to center in screen instead of using k-position
                $scope.wndHistory.center().open();
                $scope.wndHistory.refresh();
            };

            // Click on hours comment
            $scope.instructionsShow = function () {
                $('#instructionsModal').modal({
                    keyboard: false,
                    backdrop: 'static',
                    show: true
                });
            };

            // Update hours comment
            $scope.instructionsUpdate = function () {
                $scope.currentItem.schedule.emarAdministrationTimes = angular.copy($scope.currentItem.administrationTimes);
                $scope.currentItem.administrationTimesBkp = angular.copy($scope.currentItem.administrationTimes);
                $scope.editRxForm.$setDirty();
                $('#instructionsModal').modal('hide');
            };

            // Show Ok on instruction window
            $scope.instructionsOkShow = function () {
                return (($scope.pageManager.currentPage.Key == $scope.validateNavigation && permissionsHelperFactory.isAllowed($scope.permission.marRolesList.MAR_DA_UValidateAll, $scope.permission.securityContext.mar))
                    || ($scope.pageManager.currentPage.Key == $scope.startProcessingNavigation && permissionsHelperFactory.isAllowed($scope.permission.marRolesList.MAR_DA_RxProcessStart, $scope.permission.securityContext.mar))
                    || ($scope.pageManager.currentPage.Key == $scope.manageNavigation && permissionsHelperFactory.isAllowed($scope.permission.marRolesList.MAR_DA_UPrescription, $scope.permission.securityContext.mar)));
            };

            // toggle selection for a given day of a week
            $scope.toggleSelectionDaysOfWeek = function (dayNumber) {
                var idx = $scope.currentItem.frequencySelected.Data.daysOfWeek.indexOf(dayNumber);
                // is currently selected
                if (idx > -1) {
                    $scope.currentItem.frequencySelected.Data.daysOfWeek.splice(idx, 1);
                }
                    // is newly selected
                else {
                    $scope.currentItem.frequencySelected.Data.daysOfWeek.push(dayNumber);
                }
                //set to dirty, checkbox dont seems to work
                $scope.editRxForm.$setDirty();
            };

            $scope.canBeSuspended = function () {
                if (angular.isDefined($scope.currentItem) && angular.isDefined($scope.rxStatusList) && $scope.rxStatusList.length > 0) {
                    var statusItem = appSettingsFactory.getDataLookupInstanceById($scope.currentItem.rxStatusId, $scope.rxStatusList);
                    if (statusItem.code != appSettingsFactory.rxStatusKey.completed &&
                        statusItem.code != appSettingsFactory.rxStatusKey.cancelled &&
                        statusItem.code != appSettingsFactory.rxStatusKey.ceased &&
                        !$scope.isAdministrationStatusPrepared($scope.currentItem)
                    ) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            };
            $scope.canAddExtraDose = function () {
                if (angular.isDefined($scope.currentItem) && angular.isDefined($scope.rxStatusList) && angular.isDefined($scope.dosageTypeList) && $scope.rxStatusList.length > 0 && $scope.dosageTypeList.length > 0) {
                    var statusItem = appSettingsFactory.getDataLookupInstanceById($scope.currentItem.rxStatusId, $scope.rxStatusList);
                    var dosageTypeItem = appSettingsFactory.getDataLookupInstanceById($scope.currentItem.dosageTypeId, $scope.dosageTypeList);
                    var isGracePeriodReached = $scope.isGracePeriodReached();
                    if ((!$scope.currentItem.isInactive || (angular.isDefined($scope.canBeCeasedcurrentItem) && $scope.canBeCeasedcurrentItem.isInactive && !isGracePeriodReached))
                            && statusItem.code != appSettingsFactory.rxStatusKey.cancelled
                            && statusItem.code != appSettingsFactory.rxStatusKey.suspended
                            && dosageTypeItem.code != appSettingsFactory.dosageTypeKey.continuous
                    ) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            };
            $scope.canEndSuspension = function () {
                if (angular.isDefined($scope.currentItem) && angular.isDefined($scope.rxStatusList) && $scope.rxStatusList.length > 0) {
                    var statusItem = appSettingsFactory.getDataLookupInstanceById($scope.currentItem.rxStatusId, $scope.rxStatusList);
                    if (statusItem.code == appSettingsFactory.rxStatusKey.suspended) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            };
            $scope.canBeCeased = function () {
                if (angular.isDefined($scope.currentItem) && angular.isDefined($scope.rxStatusList) && $scope.rxStatusList.length > 0) {
                    var statusItem = appSettingsFactory.getDataLookupInstanceById($scope.currentItem.rxStatusId, $scope.rxStatusList);

                    if (statusItem.code != appSettingsFactory.rxStatusKey.completed &&
                        statusItem.code != appSettingsFactory.rxStatusKey.cancelled &&
                        statusItem.code != appSettingsFactory.rxStatusKey.ceased &&
                        !$scope.isAdministrationStatusPrepared($scope.currentItem)
                    ) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            };
            $scope.canBeReactivated = function () {
                if (angular.isDefined($scope.currentItem) && angular.isDefined($scope.rxStatusList) && $scope.rxStatusList.length > 0) {
                    var statusItem = appSettingsFactory.getDataLookupInstanceById($scope.currentItem.rxStatusId, $scope.rxStatusList);
                    if (statusItem.code == appSettingsFactory.rxStatusKey.ceased) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            };
            
            // generic permission checker,  pass : Ex: $scope.permission.marRolesList.MAR_DA_UFrequency
            $scope.changeNotAllowed = function(role) {
                return permissionsHelperFactory.isNotAllowed(role, $scope.permission.securityContext.mar);
            };

            $scope.isGracePeriodReached = function() {
                    if (angular.isDefined($scope.currentItem) && ((angular.isDefined($scope.currentItem.realEndTimestamp) && $scope.currentItem.realEndTimestamp != null)
                       || (angular.isDefined($scope.currentItem.cessationTimestamp) && $scope.currentItem.cessationTimestamp != null))) {
                        var dateTimestamp = ($scope.currentItem.realEndTimestamp != null) ? $scope.currentItem.realEndTimestamp : $scope.currentItem.cessationTimestamp;
                    return rxHelperFactory.isInDisgrace(dateTimestamp, $scope.parameter.gracePeriodForInactivePrescription);
                } else {
                    return false;
                }
            };

            $scope.canListAdministrations = function () {
                if (angular.isDefined($scope.currentItem)) {
                    return Enumerable.From($scope.currentItem.administrations).Where(function (i) { return i.realizationDateTime != null; }).Count() > 0;
                } else {
                    return false;
                }
            };
            // updateadministrationsTimes
            $scope.updateAdministrationTimes = function (item) {
                if (angular.isDefined(item.timestring) && item.timestring.substring(0, 2) >= "00" && item.timestring.substring(0, 2) <= "23" && item.timestring.substring(3, 5) == "__") {
                    var time = item.timestring;
                    setTimeout(function () {
                        item.timestring = time.substring(0, 2) + ":" + "00";
                        $scope.updateAdministrationTimes(item);
                    }, 1);
                    return;
                };
                if (angular.isDefined($scope.currentItem.administrationTimes) && angular.isDefined(item)) {
                    var index = $scope.currentItem.administrationTimes.indexOf(item);
                    //custom validation in case of time (we are using a kendo widget with a mask (ng-pattern does not work)
                    var isValidTime = formatTime($scope.currentItem.administrationTimes[index].timestring);
                    if (isValidTime) {
                        if (Enumerable.From($scope.currentItem.administrationTimes).Where(function (i) { return i.tempId != item.tempId && i.time == item.timestring.replace(':', ''); }).Any()) {
                            appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('DUPLICATED_HOUR'), $scope.cultureManager.resources.translate('CLOSE'));
                            setTimeout(function () {
                                item.timestring = item.time = "";
                            }, 100);
                        }else{
                            if ((isAdministrationsTimeLate($scope.currentItem, $scope.currentItem.administrationTimes[index]) || isAdministrationsTimeDue($scope.currentItem, $scope.currentItem.administrationTimes[index]))) {
                                //can't modified when Due or Late
                                var statut = (isAdministrationsTimeLate($scope.currentItem, $scope.currentItem.administrationTimes[index])) ? $filter('translate')(appSettingsFactory.rxGroupsKey.late) : $filter('translate')(appSettingsFactory.rxGroupsKey.due);
                                $scope.currentItem.administrationTimes = angular.copy($scope.currentItem.administrationTimesBkp);
                                administrationTimeWarning($scope.currentItem.administrationTimes[index].time, statut);
                            } else {
                                if (!isAdminitrationTimeExceedRxStopTime($scope.currentItem, $scope.currentItem.administrationTimes[index])) {
                                    applyAdministrationTimesChanges(item);
                                } else {
                                    //confirm modification on time greater that the end of the rx
                                    administrationTimesConfirm(applyAdministrationTimesChanges, item);
                                }
                            }
                        }
                    } else { //mot a valid time -> refuse and go back to original value in this case time
                        setTimeout(function () {
                            item.timestring = item.time = "";
                        }, 100);

                    }
                }
                
            };
            // frequency modification, update administrationsTimes number of items (only for regular)
            $scope.onChangeTimesPerDay = function () {
                if (($scope.currentItem != null) && ($scope.currentItem.frequencySelected != null) && ($scope.currentItem.frequencySelected.Data.timesPerDay != null) && ($scope.currentItem.rxTypeCode == appSettingsFactory.rxSchedulePriorityKey.regular)) {
                    if ($scope.currentItem.frequencySelected.Data.timesPerDay < $scope.currentItem.administrationTimes.length) {
                        $scope.currentItem.administrationTimes.length = $scope.currentItem.frequencySelected.Data.timesPerDay;
                        //always save modifications to emaradministrationsTimes
                        $scope.currentItem.schedule.emarAdministrationTimes = angular.copy($scope.currentItem.administrationTimes);
                    } else {

                        var count = ($scope.currentItem.administrationTimes.length) ? Enumerable.From($scope.currentItem.administrationTimes).OrderByDescending("$.tempId").FirstOrDefault().tempId : 0; //SET TO GREATEST TEMPID
                        var n = $scope.currentItem.frequencySelected.Data.timesPerDay - $scope.currentItem.administrationTimes.length;
                        for (var i = 0; i < n; i++) {
                            //var item = new Lgi.Madm.Dto.AdministrationTimeDto();
                            //FOR TEST ONLY new Lgi.Madm.Dto.AdministrationTimeDto() returns error
                            var item = new Object();
                            item.time = null;
                            item.description = "";
                            item.isAdministration = true;
                            item.version = 1;
                            item.id = 0;
                            //FOR TEST ONLY
                            count++;
                            angular.extend(item, { datetime: extendSchedule(item, new Date()), isToRemove: !item.isAdministration, tempId: count++, timestring: (item.time != null) ? utlString.padDigits(item.time, 4) : null }); // extendSchedule(item, new Date())
                            $scope.currentItem.administrationTimes.push(item);
                        }
                        //always save modifications to emaradministrationsTimes
                        if (n != 0) {
                             $scope.currentItem.schedule.emarAdministrationTimes = angular.copy($scope.currentItem.administrationTimes);
                             $scope.currentItem.unknownTime = !isAllAdmTimeFilled($scope.currentItem.administrationTimes);
                        }
                    } 
                } else if (($scope.currentItem != null) && ($scope.currentItem.frequencySelected != null)) {
                    $scope.currentItem.administrationTimes = [];
                    $scope.currentItem.schedule.emarAdministrationTimes = [];
                    $scope.currentItem.unknownTime = false;
                }
            };
            $scope.validateFrequency = function() {
                return $scope.currentItem.frequencySelected == null;
            };
            $scope.onChangeFrequency = function (e) {
                //do a manuel seach in case user did not select with a tab or enter
                if ($scope.currentItem.frequencySelected == null) {
                    var searchValue = utlString.normalize(e.sender._selectedValue);
                    var arrFrequency = Enumerable.From($scope.frequencyTemplateList).Where(function (i) { return ((i.code.indexOf(searchValue) > -1) || (utlString.normalize(i.description).indexOf(searchValue) > -1)); }).ToArray();
                    $scope.currentItem.frequencySelected = arrFrequency[0];
                    $scope.onChangeTimesPerDay();
                }
                if ($scope.currentItem.frequencySelected != null) {
                    if (angular.isDefined($scope.currentItem.frequencySelected.Data) && angular.isDefined($scope.currentItem.frequencySelected.Data.daysOfMonth) && $scope.currentItem.frequencySelected.Data.daysOfMonth != '')
                        $scope.currentItem.frequencySelected.Data.daysOfMonth = $scope.currentItem.frequencySelected.Data.daysOfMonth.join(',');
                    $scope.editRxForm.$setDirty();
                    $scope.currentItem.unknownTemplate = false;
                    $scope.onChangeTimesPerDay();
                } else {
                    $scope.currentItem.frequencySelectedValidation = null;
                    $scope.currentItem.frequencySelected = null;
                    var combobox = $("#frequencyDescription").data("kendoComboBox");
                    combobox.select(-1);
                    combobox.value(null);
                    $scope.editRxForm.$setDirty();
                    $scope.currentItem.unknownTemplate = true;
                }
                //clear applied filters
                    var filters = e.sender.dataSource.filter();
                    if (filters) {
                        e.sender.dataSource.filter({});
                    }
            };

            $scope.onChangeToRemove = function (item) {
                var index = $scope.currentItem.administrationTimes.indexOf(item);
                if (index > -1) {
                    $scope.currentItem.administrationTimes[index].isAdministration = !item.isToRemove;
                }
            };
            //Reset to Null if zero
            $scope.onChangeNumberOfDoses = function () {
                if ($scope.currentItem.frequencySelected.Data.numberOfDoses == 0) $scope.currentItem.frequencySelected.Data.numberOfDoses = null;
            };
            $scope.getNumericTextBoxMessage = function (ressource, min, max) {
                var message = $scope.cultureManager.resources.translate(ressource);
                message = message.replace("^1", min.toString());
                message = message.replace("^2", max.toString());
                return message;
            }
            $scope.isDisplayFrequencyItem = function () {
                return function (frequency) {
                    return frequency.isActive && frequency.id >= 0;
                };
            };
            $scope.isDaysOfWeekEmpty = function () {
                return $scope.currentItem.frequencySelected.Data.daysOfWeek.length == 0;
            };
            $scope.onEveryDayChange = function() {
                if ($scope.currentItem.frequencySelected.Data.isEveryDay) {
                    $scope.currentItem.frequencySelected.Data.dayPatternStep = null;
                    $scope.currentItem.frequencySelected.Data.dayPatternFrequency = null;
                }
                $scope.onDayPatternChange();
            };
            $scope.isDayPatternInvalid = function () {
                var bReturn = ($scope.currentItem.frequencySelected.Data.isEveryDay == false) ? 
                                  (!$scope.currentItem.frequencySelected.Data.dayPatternStep ||
                                   !$scope.currentItem.frequencySelected.Data.dayPatternFrequency ||
                                    $scope.currentItem.frequencySelected.Data.dayPatternStep >= $scope.currentItem.frequencySelected.Data.dayPatternFrequency) :
                                  false ;
                return bReturn;
            };
            $scope.onDayPatternChange = function () {
                var isInvalid = $scope.isDayPatternInvalid();
                $scope.editRxForm.dayPatternStep.$setValidity('required', !isInvalid);
                $scope.editRxForm.dayPatternFrequency.$setValidity('required', !isInvalid);
                $scope.editRxForm.dayPatternStep.$render();
                $scope.editRxForm.dayPatternFrequency.$render();
            };
            $scope.isDayIntervalInvalid = function () {
                var bReturn = !$scope.currentItem.frequencySelected.Data.dayIntervalFrom ||
                              !$scope.currentItem.frequencySelected.Data.dayIntervalTo ||
                              ($scope.currentItem.frequencySelected.Data.dayIntervalFrom >= $scope.currentItem.frequencySelected.Data.dayIntervalTo);
                return bReturn;
            };
            $scope.onDayIntervalChange = function () {
                var isInvalid = $scope.isDayIntervalInvalid();
                $scope.editRxForm.dayIntervalFrom.$setValidity('required', !isInvalid);
                $scope.editRxForm.dayIntervalTo.$setValidity('required', !isInvalid);
                $scope.editRxForm.dayIntervalFrom.$render();
                $scope.editRxForm.dayIntervalTo.$render();
            };
            // Is frequency change  Not Allowed?
            $scope.changeFrequencyNotAllowed = function () {
                return permissionsHelperFactory.isNotAllowed($scope.permission.marRolesList.MAR_DA_UFrequency, $scope.permission.securityContext.mar);
            };
            // Is flowsheets Not Allowed?
            $scope.changeAssociatedDataNotAllowed = function () {
                return permissionsHelperFactory.isNotAllowed($scope.permission.marRolesList.MAR_DA_UAssociatedData, $scope.permission.securityContext.mar);
            };
            $scope.onChangeDaysOfMonth = function () {
                if ($scope.editRxForm.daysOfMonth.$valid) 
                $scope.currentItem.frequencySelected.Data.daysOfMonth = Enumerable.From($scope.currentItem.frequencySelected.Data.daysOfMonth.split(','))
                                                                                  .Distinct()
                                                                                  .OrderBy(function (i) { return parseInt(i); })
                                                                                  .ToArray().join(',');
            };
            // Unknown Template
            function unknownTemplate(item) {
                return rxHelperFactory.unknownTemplate(item, $scope.dosageTypeList);
            };
            // Unknown Time
            function unknownTime(item) {
                return rxHelperFactory.unknownTime(item, $scope.frequencyTemplateList, $scope.rxSchedulePriorityList);
            };
            $scope.onChangeFlowsheet = function (e) {
                //check if we have a delete, verify if is allowed
                if (isFlowSheetDeleteEvt()) {
                    //we should have a array of one element only in diff
                    var deletedtemId = Enumerable.From($scope.currentItem.oldMetaWorkflowsIds).Except(Enumerable.From($scope.currentItem.metaWorkflowsIds)).FirstOrDefault();
                    if (deletedtemId) {
                        if (rxHelperFactory.isFlowSheetDeleteDisabled(deletedtemId, $scope.currentItem.metaWorkflows)) {
                            //can not delete item go back to previous value
                            $scope.currentItem.metaWorkflowsIds = angular.copy($scope.currentItem.oldMetaWorkflowsIds);
                            setCloseIconFlowsheet(e);
                        } else {
                            $scope.editRxForm.$setDirty();
                        }
                    }
                } else {
                    $scope.editRxForm.$setDirty();
                }
                $scope.currentItem.oldMetaWorkflowsIds = angular.copy($scope.currentItem.metaWorkflowsIds);
            }
            function isFlowSheetDeleteEvt() {
                return ($scope.currentItem.metaWorkflowsIds.length <= $scope.currentItem.oldMetaWorkflowsIds.length);
            }

            function setCloseIconFlowsheet(e) {
                //wait for the drawing
                $timeout(function () {
                    var  items = e.sender._dataItems;
                    angular.forEach(items, function (item) {
                        if (rxHelperFactory.isFlowSheetDeleteDisabled(item.id, $scope.currentItem.metaWorkflows)) {
                            $("#kendo-multi-select ul li" + ":contains(" + item.shortDescription + ")").find("span.k-delete").removeClass("k-delete").addClass("empty-kendo-icon");
                        }
                    });
                }, 250, false);
            }

            function onDataBound(e) {
                setCloseIconFlowsheet(e);
                $scope.currentItem.oldMetaWorkflowsIds = angular.copy($scope.currentItem.metaWorkflowsIds);
            }

            initialize();
            // Initialize content
            function initialize() {
                $scope.isLoadingBody = true;
                // Initialize variables:  
                $scope.dateTimePickerOptions = angular.copy(appSettingsFactory.dateTimePickerOptions);
                $scope.timePickerOptions = angular.copy(appSettingsFactory.timePickerOptions);
                $scope.timesPerDayOptions = {};
                $scope.numericTextBoxOptions = {};
                $scope.dayIntervalNumericOptions = {};
                $scope.dayPatternNumericOptions = {};
                $scope.submitButtonId = '';
                $scope.frequencyData = [];
                $scope.frequencyDataBkp = [];
                $scope.currentItem = {}; 
                $scope.currentItemBkp = {}; 
                $scope.instructiontItem = {};
                $scope.itemsToManage = [];
                $scope.selectedIndex = {};                
                $scope.dosageTypeList = [];
                $scope.rxSchedulePriorityList = [];
                $scope.rxStatusList = [];
                $scope.flowSheetList = [];
                $scope.mxClassList = [];
                $scope.cessationReasonList = [];
                $scope.suspensionReasonList = [];
                $scope.routeList = [];
                $scope.administrationStatusList = [];
                $scope.fullDisplay = true;
                $scope.isAdministrationRealized = false;
                $scope.parameter = {};
                // var onRouteChangeOff;
                $scope.validateNavigation = rxNavigationPathConstants.validateNavigationPath; 
                $scope.manageNavigation = rxNavigationPathConstants.manageNavigationPath;
                $scope.startProcessingNavigation = rxNavigationPathConstants.startProcessingNavigationPath;

                var rx = sessionStorage.getItem(appSettingConstants.selectedRxKey);

                if (angular.isUndefined(rx) || rx === "") {
                    $scope.pageManager.redirectToParent();
                }

                //make sure localisation file is loaded, needed by frequecy and parameter
                $scope.cultureManager.resources.shared.load("rx-management").then(function () {
                    //load parameters
                    loadParameter();
                    //initList
                    initList().then(function () {
                        //load frequencies
                        loadFrequencies().then(function () {
                            //loadAllRxs, need frequency
                            loadRxs().then(function() {
                                //set flowsheet multi select
                                //only active for flowSheetList
                                $scope.flowSheetList = Enumerable.From($scope.flowSheetList).Where(function (i) { return i.isActive == true; })
                                   .OrderBy(function (i) { return utlString.normalize(i.shortDescription); }).ToArray();
                                $scope.model.selectFlowsheetOptions = {
                                    placeholder: $scope.cultureManager.resources.translate("SELECT_ITEMS"),
                                    dataTextField: "shortDescription",
                                    dataValueField: "id",
                                    valuePrimitive: true,
                                    autoBind: true,
                                    dataSource: $scope.flowSheetList,
                                    dataBound: onDataBound,
                                    enable: !($scope.changeAssociatedDataNotAllowed() || $scope.isGracePeriodReached())
                                };
                            });
                        });
                    });
                });
                //Route change event
                // onRouteChangeOff = $rootScope.$on('$locationChangeStart', routeChange);

                $scope.isLoadingBody = false;
            }
            //make sure all lists are loaded before assinging values 
            function initList() {
                var deferred = $q.defer();
                var lookups = [
                 [appSettingsFactory.dataLookups.amountUnit, "amountUnitList"],
                 [appSettingsFactory.dataLookups.rxStatus, "rxStatusList"],
                 [appSettingsFactory.dataLookups.dosageType, "dosageTypeList"],
                 [appSettingsFactory.dataLookups.schedulePriority, "rxSchedulePriorityList"],
                 [appSettingsFactory.dataLookups.workflow, "flowSheetList"],
                 [appSettingsFactory.dataLookups.mxClass, "mxClassList"],
                 [appSettingsFactory.dataLookups.cessationReason, "cessationReasonList"],
                 [appSettingsFactory.dataLookups.suspensionReason, "suspensionReasonList"],
                 [appSettingsFactory.dataLookups.route, "routeList"],
                 [appSettingsFactory.dataLookups.administrationStatus, "administrationStatusList"]
                 
                ];
                entrepriseServices
                    .lookup
                    .setMany(lookups, $scope)    
                    .then(function() {
                        deferred.resolve();
                });
                return deferred.promise;
            }

            // validate item
            function validate(items) {
                var deferred = $q.defer();
                if ($scope.editRxForm.$valid) {
                    rxManagementService.validate(items)
                        .then(
                            function (scResult) {
                                scResult.Result.forEach(function (item) {
                                    // Remove the item from the working list
                                    var itemValidated = Enumerable.From($scope.itemsToManage).Where(function (i) { return i.id == item.id; }).First();
                                    if (angular.isDefined(itemValidated)) {
                                        itemValidated.validated = true; // We put it to true, in case of an error, it woun't be validated again
                                        var index = $scope.itemsToManage.indexOf(itemValidated);
                                        if (index > -1) {
                                            $scope.itemsToManage.splice(index, 1);
                                        }
                                        if (itemValidated.id == $scope.currentItem.id) {
                                            $scope.editRxForm.$setPristine();
                                        }
                                    }
                                    // Leave the page if all items are validated
                                    if ($scope.itemsToManage.length <= 0) {
                                        $scope.pageManager.redirectToParent();
                                    } else {
                                        //Select first item
                                        $scope.selectedIndex = 0;
                                        selectItem();
                                        appSettingsFactory.displayPopover('top', '', $scope.cultureManager.resources.translate('ITEM_VERIFIED'), '#validateButton', 3000);
                                    }
                                });
                                deferred.resolve();
                            },
                            function (scError) {
                                deferred.reject(scError);
                                if (angular.isDefined(scError.data.Errors))
                                    appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), scError.data.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                            }
                        );
                } else {
                    appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), "Please, correct the errors!", $scope.cultureManager.resources.translate('CLOSE'));
                }
                return deferred.promise;
            }

            // startProcessing item
            function startProcessing(items) {
                var deferred = $q.defer();
                if ($scope.editRxForm.$valid) {
                    rxManagementService.startProcessing(items)
                        .then(
                            function (scResult) {
                               //console.log(JSON.stringify(scResult.Result)) ;
                                scResult.Result.forEach(function (item) {
                                    // Remove the item from the working list
                                    var itemProcessed = Enumerable.From($scope.itemsToManage).Where(function (i) { return i.id == item.id; }).FirstOrDefault();
                                    if (angular.isDefined(itemProcessed)) {
                                        itemProcessed.isProcessed = true; // We put it to true, in case of an error, it woun't be validated again
                                        var index = $scope.itemsToManage.indexOf(itemProcessed);
                                        if (index > -1) {
                                            $scope.itemsToManage.splice(index, 1);
                                        }
                                        if (itemProcessed.id == $scope.currentItem.id) {
                                            $scope.editRxForm.$setPristine();
                                        }
                                    }
                                    // Leave the page if all items are validated
                                    if ($scope.itemsToManage.length <= 0) {
                                        $scope.pageManager.redirectToParent();
                                    } else {
                                        //Select first item
                                        $scope.selectedIndex = 0;
                                        selectItem();
                                        appSettingsFactory.displayPopover('top', '', $scope.cultureManager.resources.translate('ITEM_TREATED'), '#validateButton', 3000);
                                    }
                                });
                                deferred.resolve();
                            },
                            function (scError) {
                                deferred.reject(scError);
                                if (angular.isDefined(scError.data.Errors))
                                    appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), scError.data.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                            }
                        );
                } else {
                    appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), "Please, correct the errors!", $scope.cultureManager.resources.translate('CLOSE'));
                }
                return deferred.promise;
            }

            // No changes in the page
            var pageChanged = function () {
                return $scope.editRxForm.$dirty;
            };

            function FrequencyData(type, timesPerDay) {
                this.templateType = type;
                this.isEveryDay = true;
                this.timesPerDay = timesPerDay;
                this.dayIntervalFrom = 0;
                this.dayIntervalTo = 0;
                this.monthFrequency = 0;
                this.numberOfDoses = null;
                this.daysOfMonth = [];
                this.dayPatternFrequency = 0;
                this.dayPatternStep = 0;
                this.daysOfWeek = [];
            }
            function Frequency(id, code, description, isManualEntry, timesPerDay) {
                this.id = id;
                this.code = code;
                this.shortDescription = description;
                this.shortDescriptionsl = description;
                this.description = description;
                this.descriptionsl = description;
                this.isActive = true;
                this.isManualEntry = isManualEntry;
                this.Data = new FrequencyData("Days", timesPerDay);
            }

            // Get Frequency template list
            function loadFrequencies() {
                //need to defer frequency loading, frequency are needed by Rxs
                var deferred = $q.defer();
                var manualDescription = $rootScope.cultureManager.resources.translate('MANUAL_ENTRY');
                frequencyTemplateService.getTemplateList()
                    .then(
                        function (scResult) {
                            var filteredFrequencyTemplateList = Enumerable.From(scResult)
                                .Where(function (i) { return i.isActive && i.id >= 0; })
                                .OrderBy(function (i) { return i.code; })
                                .ToArray();
                            $scope.frequencyTemplateList = $filter('orderBy')(filteredFrequencyTemplateList, 'code');
                            angular.forEach($scope.frequencyTemplateList, function (template) {
                                //Reset to Null if zero
                                if (angular.isDefined(template.Data) && (angular.isDefined(template.Data.numberOfDoses) && template.Data.numberOfDoses == 0)) {
                                    template.Data.numberOfDoses = null;
                                }
                                return angular.extend(angular.copy(template), { timesPerDayOptions: { format: "#", min: 1, max: $scope.parameter.maxFrequencyTimesPerDay, step: 1 } });
                            });
                            var manualEntry = new Frequency(0, manualDescription, manualDescription, true, 1);
                            $scope.frequencyTemplateList.unshift(manualEntry);

                            //use description or descriptionsl depending on default culture code
                            if ($scope.cultureManager.currentCulture.Culture.Code == $scope.cultureManager.defaultCulture.Culture.Code) {
                                $scope.frequencyTemplateDropDownDisplayedValueTemplate = "{{ dataItem.description }}";
                                $scope.frequencyTemplateDropDownItemTemplate = "<label class='rx-management-frequency-label'><b>{{ dataItem.code }}</b></label><span>{{ dataItem.description }}</span>";
                                $scope.frequencyTemplateDescriptionColumn = 'description';
                            } else {
                                $scope.frequencyTemplateDropDownDisplayedValueTemplate = "{{ dataItem.descriptionsl }}";
                                $scope.frequencyTemplateDropDownItemTemplate = "<label class='rx-management-frequency-label'><b>{{ dataItem.code }}</b></label><span>{{ dataItem.descriptionsl }}</span>";
                                $scope.frequencyTemplateDescriptionColumn = 'descriptionsl';
                            }
                            //$scope.frequencyTemplateDropDownDisplayedValueTemplate = "{{ dataItem.description }}";
                            //$scope.frequencyTemplateDropDownItemTemplate = "<label class='rx-management-frequency-label'><b>{{ dataItem.code }}</b></label><span>{{ dataItem.description }}</span>";
                            return deferred.resolve();
                        },
                        function (scError) {
                            appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), scError.data.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                            return deferred.reject();
                        }
                    );
                return deferred.promise;
            }

            function loadRxs() {
                // get Rxs
                var rx = sessionStorage.getItem(appSettingConstants.selectedRxKey);
                if (rx != null) {
                    var ids = rx.toString().split(",");
                    $scope.fullDisplay = (ids.length == 1);

                    var deferred = $q.defer();
                    // Get the RXs
                    rxManagementService.getRXS(ids)
                        .then(
                            function (scResult) {
                                if (scResult.Result.length > 0) {
                                    $scope.itemsToManage = [];
                                    var whereClause = '';
                                    if ($scope.pageManager.currentPage.Key == $scope.validateNavigation || $scope.pageManager.currentPage.Key == $scope.startProcessingNavigation) {
                                        whereClause = "i.rxStatusId == RxNew.id"; // In validation Mode, only new rx will be displayed
                                    } else {
                                        whereClause = "i.rxStatusId != RxNew.id"; // In th other mode, the new Rx must not be displayed
                                    }
                                    $scope.itemsToManage = Enumerable.From(scResult.Result)
                                        .Where(function (i) { return whereClause; })
                                        .OrderBy(function (i) { return rxHelperFactory.getRxNextPlannedDateTime(i.administrations); }) //default OrderBy
                                        .ThenBy(function (i) { return rxHelperFactory.getMxClassCode(i.mx.mxClassIds, $scope.mxClassList); })
                                        .ThenBy("$.mx.pharmacyDescription")
                                        .ThenBy("$.startTimestamp")
                                        .ThenBy("$.pharmacyId")
                                        .Select(function (i) { return new Lgi.Emr.Mar.Dto.rxDto(i); })
                                        .ToArray();
                                    // Add extra properties for UI management
                                    if ($scope.itemsToManage.length > 0) {
                                        angular.forEach($scope.itemsToManage, function (item) {
                                            addExtraFields(item);
                                        });
                                        // Select first item
                                        $scope.selectedIndex = 0;
                                    }
                                }
                                deferred.resolve();
                            },
                            function (scError) {
                                console.log("CONTROLLER: " + JSON.stringify(scError.data.Errors));
                                appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), scError.data.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                                deferred.resolve();
                            }
                        );
                    return deferred.promise;
                }
            }

            function loadParameter() {
                var upArrowText = $scope.cultureManager.resources.translate('INCREASE_VALUE');
                var downArrowText = $scope.cultureManager.resources.translate('DECREASE_VALUE');
                parameterService.get().then(function (scResult) {
                    $scope.parameter = scResult;
                    $scope.timesPerDayOptions = {
                        format: "#",
                        decimals: 0,
                        min: 1,
                        max: ($scope.parameter.maxFrequencyTimesPerDay) ? $scope.parameter.maxFrequencyTimesPerDay : 24,
                        step: 1,
                        upArrowText: upArrowText,
                        downArrowText: downArrowText
                    }
                    $scope.numericTextBoxOptions = {
                        format: "#",
                        decimals: 0,
                        step: 1,
                        upArrowText: upArrowText,
                        downArrowText: downArrowText
                    }
                    $scope.dayPatternNumericOptions = {
                        format: "#",
                        decimals: 0,
                        step: 1,
                        upArrowText: upArrowText,
                        downArrowText: downArrowText,
                        min: 1,
                        max: 99
                    }
                    $scope.dayIntervalNumericOptions = {
                        format: "#",
                        decimals: 0,
                        step: 1,
                        upArrowText: upArrowText,
                        downArrowText: downArrowText,
                        min: 1,
                        max: 31
                    }
                    //check if string is a valid url
                    $scope.isAdvisorProfAvailable = appSettingConstants.regexUrl.test(($scope.parameter.advisorProfessionalCalculationIndexUrl != null) ? $scope.parameter.advisorProfessionalCalculationIndexUrl : '');
                    $scope.isAdvisorMonographsAvailable = appSettingConstants.regexUrl.test(($scope.parameter.advisorMonographUrl != null) ? $scope.parameter.advisorMonographUrl.replace("{0}", 'monographNumber') : '');
                });
            }

            // Select first item in the working list
            function selectItem() {
                if (angular.isDefined($scope.selectedIndex)) {
                    $scope.currentItem = $scope.itemsToManage[$scope.selectedIndex];
                    $scope.currentItemBkp = angular.copy($scope.currentItem);
                    $scope.frequencyDataBkp = angular.copy($scope.frequencyData);
                    $scope.fullDisplay = ($scope.itemsToManage.length == 1);
                    //check if access is there
                    $scope.isAdministrationRealized = rxHelperFactory.isAdministrationRealized($scope.currentItem);
                    $scope.onChangeTimesPerDay(); //in case of unsync between administrationsTimes and timesPerDay
                    //Force the redraw of kendo multi select (metaWorkflowsIds is already set in addExtraFields)
                    if (angular.isDefined($scope.currentItem)) $scope.currentItem.metaWorkflowsIds = Enumerable.From($scope.currentItem.metaWorkflows).Select(function (i) { return i.id; }).ToArray();
                    if (angular.isDefined($scope.currentItem)) $scope.currentItem.oldMetaWorkflowsIds = Enumerable.From($scope.currentItem.metaWorkflows).Select(function (i) { return i.id; }).ToArray();
                }
            }

            // Verify if this rx can be ceased
            function canBeCeased(status) {
                if (status.code == appSettingsFactory.rxStatusKey.completed || status.code == appSettingsFactory.rxStatusKey.ceased
                    || status.code == appSettingsFactory.rxStatusKey.cancelled) {
                    return false;
                } else {
                    return true;
                }
            }

            // Verify if this rx can be suspended
            function canBeSuspended(status) {
                if (status.code == appSettingsFactory.rxStatusKey.completed || status.code == appSettingsFactory.rxStatusKey.cancelled
                    || status.code == appSettingsFactory.rxStatusKey.ceased) {
                    return false;
                } else {
                    return true;
                }
            }
            // Add Extra Fields
            function addExtraFields(item) {
                try {
                    //frequency from template or manual entry
                    var frequency = (item.schedule.frequencyTemplateId != null)
                        ? angular.copy(Enumerable.From($scope.frequencyTemplateList).Where(function (i) { return i.id == item.schedule.frequencyTemplateId; }).FirstOrDefault())
                        : angular.copy(Enumerable.From($scope.frequencyTemplateList).Where(function (i) { return i.id == 0; }).FirstOrDefault());

                    var administrationTimes = loadAdminitrationTimes(item);
                    //special treatment in case of manual entry
                    if (frequency.id == 0) {
                        frequency.Data = item.schedule.frequencyData;
                    }

                    angular.extend(item, {
                        validated: false,
                        rxTypeCode: appSettingsFactory.getDataLookupCodeById(item.schedule.schedulePriorityId, $scope.rxSchedulePriorityList),
                        rxDosageTypeCode: appSettingsFactory.getDataLookupCodeById(item.dosageTypeId, $scope.dosageTypeList),
                        isContinuous: appSettingsFactory.getDataLookupCodeById(item.dosageTypeId, $scope.dosageTypeList) == appSettingsFactory.dosageTypeKey.continuous,
                        rxStatus: appSettingsFactory.getDataLookupInstanceById(item.rxStatusId, $scope.rxStatusList),
                        cessationReason: (item.cessationReasonId != null) ? appSettingsFactory.getDataLookupInstanceById(item.cessationReasonId, $scope.cessationReasonList) : {},
                        suspensionReason: (item.suspension != null && item.suspension.suspensionReasonId != null) ? appSettingsFactory.getDataLookupInstanceById(item.suspension.suspensionReasonId, $scope.suspensionReasonList) : {},
                        frequencySelected: null,
                        unknownTemplate: unknownTemplate(item),
                        unknownTime: unknownTime(item),
                        isPRNwithoutSchedule: false,
                        administrationTimes: administrationTimes,
                        administrationTimesBkp: angular.copy(administrationTimes),
                        metaWorkflowsIds: Enumerable.From(item.metaWorkflows).Select(function (i) { return i.id; }).ToArray(),
                        oldMetaWorkflowsIds: angular.copy(Enumerable.From(item.metaWorkflows).Select(function (i) { return i.id; }).ToArray()),
                        daysOfWeek: null,
                        doubleCheckDoseStatus: rxHelperFactory.setDoubleCheckDoseStatus(item)
                    });

                    //frequency from template or manual entry or none in case of a continuous or a prn with not frequency
                    //set frequency from template we have an id
                    if (item.isContinuous) {
                        //Nothing
                    } else if (item.rxTypeCode == appSettingsFactory.rxSchedulePriorityKey.prn && !item.schedule.isUnknownFrequencyTemplate && item.schedule.frequencyData == null) {
                        item.isPRNwithoutSchedule = true;
                        item.unknownTime = false; //no unkown Time in case of PRN with no schedule
                    } else if (item.schedule.frequencyTemplateId) { //set frequency from template we have an id
                        item.frequencySelected = frequency;
                    } else if (item.schedule.isManualTemplateEntry) {
                        //load manual entry
                        item.frequencySelected = frequency;
                        item.daysOfWeek = setDaysOfWeek(item.schedule.frequencyData);
                    } else {
                        //load unKnown entry
                        item.frequencySelected = angular.copy(Enumerable.From($scope.frequencyTemplateList).Where(function (i) { return i.id == -1; }).FirstOrDefault());
                        item.unknownTemplate = true;
                    }
                

                }
                catch (err) {
                    console.log(err.message);
                }
            }
            // confirm time schedule greater than end of rx
            function administrationTimesConfirm(callBack, item) {
                var onCloseFunction = function () {
                    //refuse, go back to previous value
                    item.timestring = item.time;
                    $scope.currentItem.frequencySelected.administrationTimes = angular.copy($scope.currentItem.frequencySelected.administrationTimesBkp);
                };
                var onActionFunction = function () {
                    callBack(item);
                };
                appSettingsFactory.displayConfirmation($scope.cultureManager.resources.translate('PRESCRIPTION'), $scope.cultureManager.resources.translate('END_OF_RX_CONFIRM'), $scope.cultureManager.resources.translate('YES'), $scope.cultureManager.resources.translate('NO'), null, onActionFunction, onCloseFunction);
            }
            // warning change administrations time
            function administrationTimeWarning(hour, status) {
                var contentText = $scope.cultureManager.resources.translate('ADMINITRATIONTIMES_WARNING');
                contentText = contentText.replace("^1", $filter('hour')(hour));
                contentText = contentText.replace("^2", status);

                appSettingsFactory.displayError($scope.cultureManager.resources.translate('PRESCRIPTION'), contentText, $scope.cultureManager.resources.translate('OK'));
            }

            $scope.resetData = function () {
                $scope.currentItem = angular.copy($scope.currentItemBkp);
                $scope.onChangeTimesPerDay();//trigger times per day to update administration times
                $scope.itemsToManage[$scope.selectedIndex] = $scope.currentItem;
                $scope.editRxForm.$setPristine();
                if (isSaveFromLogoutEvent) appSettingsFactory.logoutAndRedirectToDefault();
            };

            // Cease window
            function ceaseWindow(mode) {
                //Cease window
                var scope = $rootScope.$new();
                scope.ids = [];
                scope.ids.push($scope.currentItem.id);
                scope.mode = mode;
                scope.excludeMarkInError = false;
                var modalInstance = $modal.open({
                    templateUrl: locationService.shared.views + "rx/rx-cease.html",
                    controller: 'rxCeaseController',
                    windowClass: 'rx-cease-modal-window',
                    scope: scope,
                    backdrop: 'static',
                    keyboard: false
                });
                modalInstance.result.then(function (itemCeased) {
                    if (itemCeased != null && itemCeased.Result.length > 0) {
                        $scope.currentItem = Enumerable.From(itemCeased.Result).First();
                        addExtraFields($scope.currentItem);
                        $scope.currentItemBkp = angular.copy($scope.currentItem);
                        $scope.itemsToManage[$scope.selectedIndex] = $scope.currentItem;
                    }
                    if (itemCeased != null && itemCeased.HasErrors) {
                        appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), itemCeased.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                    }
                });
            }

            // Suspend window
            function suspendWindow(mode) {
                //Suspend window
                var scope = $rootScope.$new();
                scope.ids = [];
                scope.ids.push($scope.currentItem.id);
                scope.mode = mode;
                scope.excludeMarkInError = false;
                var modalInstance = $modal.open({
                    templateUrl: locationService.shared.views + "rx/rx-suspension.html",
                    controller: 'rxSuspensionController',
                    windowClass: 'modal-window-suspension',
                    scope: scope,
                    backdrop: 'static',
                    keyboard: false
                });
                modalInstance.result.then(function (itemSuspended) {
                    if (itemSuspended != null && itemSuspended.Result.length > 0) {
                        $scope.currentItem = Enumerable.From(itemSuspended.Result).First();
                        addExtraFields($scope.currentItem);
                        $scope.currentItemBkp = angular.copy($scope.currentItem);
                        $scope.itemsToManage[$scope.selectedIndex] = $scope.currentItem;
                    }
                    if (itemSuspended != null && itemSuspended.HasErrors) {
                        appSettingsFactory.backEndError($scope.cultureManager.resources.translate('ERROR'), itemSuspended.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                    }
                });
            }

            // Change Index
            function changeIndex(index) {
                $scope.selectedIndex = index;
            }
            function loadAdminitrationTimes(item) {
                if (item != null) {
                    //load emar else pharmacy if emar empty
                    var adminitrationTimesList = (item.schedule != null && item.schedule.emarAdministrationTimes.length != 0)
                        ? Enumerable.From(item.schedule.emarAdministrationTimes).OrderBy("$.time") : Enumerable.From(angular.copy(item.schedule.pharmacyAdministrationTimes)).OrderBy("$.time");
                    //extend item datetime for kendo ui
                    var count = 0;
                    adminitrationTimesList = adminitrationTimesList.Select(function (i) {
                        return angular.extend(i, { datetime: extendSchedule(i, new Date()), isToRemove: !i.isAdministration, tempId: count++, timestring: utlString.padDigits(i.time, 4) });
                    });
                    //if pharmacy was loaded reset id to 0, will be save as emar if modified
                    if (item.schedule != null && item.schedule.emarAdministrationTimes.length == 0) {
                        adminitrationTimesList.ForEach(function (i) {
                            i.id = 0;
                        });
                    }
                    //retrun a copy
                    return (adminitrationTimesList.Count() > 0) ? angular.copy(adminitrationTimesList.ToArray()) : [];
                } else {
                    return [];
                }
            }

            // convert time in schedule to a datetime (needed by kendo ui) uses local time
            function extendSchedule(item, date) {
                date.setHours(Math.floor(item.time / 100));
                date.setMinutes((item.time % 100));
                return new Date(date.getUTCFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), 0);
            };
            function getNextAdministrations() {
                return Enumerable.From($scope.currentItem.administrations).Where(function (i) { return i.realizationDateTime == null; }).FirstOrDefault();
            };
            ////check is a rx is late
            function isAdministrationsTimeLate(currentItem, administrationsTimesItem) {
                var administrationTime = administrationsTimesItem.time;
                var nextAdministration = getNextAdministrations();
                var nextplannedAdministrationDate = (nextAdministration != null) ? nextAdministration.plannedDateTime : null;
                if (nextplannedAdministrationDate != null) {
                    var nextplannedAdministrationTime = setTime(nextplannedAdministrationDate, true);
                    return (currentItem.isLate) && (administrationTime == nextplannedAdministrationTime);
                } else {
                    return false;
                }
            }

            function isAdministrationsTimeDue(currentItem, administrationsTimesItem) {
                var administrationTime = administrationsTimesItem.time;
                var nextAdministration = getNextAdministrations();
                var nextplannedAdministrationDate = (nextAdministration != null) ? nextAdministration.plannedDateTime : null;
                if (nextplannedAdministrationDate != null) {
                    var nextplannedAdministrationTime = setTime(nextplannedAdministrationDate, true);
                    return (currentItem.isDue) && (administrationTime == nextplannedAdministrationTime);
                } else {
                    return false;
                }
            };

            function isAdminitrationTimeExceedRxStopTime(currentItem, administrationsTimesItem) {
                return (currentItem.schedule.stopTimestamp <= administrationsTimesItem.datetime);
            }

            function applyAdministrationTimesChanges(item) {
                //update time and datetime from datetime
                var index = $scope.currentItem.administrationTimes.indexOf(item);
                $scope.currentItem.administrationTimes[index].timestring = item.timestring;
                $scope.currentItem.administrationTimes[index].time = parseInt(item.timestring.replace(':', ''));
                $scope.currentItem.administrationTimes[index].datetime = extendSchedule(item, new Date());
                //always save modifications to emaradministrationsTimes
                $scope.currentItem.schedule.emarAdministrationTimes = angular.copy($scope.currentItem.administrationTimes);
                $scope.currentItem.administrationTimesBkp = angular.copy($scope.currentItem.administrationTimes);
                $scope.currentItem.unknownTime = !isAllAdmTimeFilled($scope.currentItem.administrationTimes);
                $scope.editRxForm.$setDirty(); 
            }

            function setTime(date, isUtc) {
                if (isUtc) {
                    return (angular.isDate(date)) ? ((date.getUTCHours() * 100) + date.getUTCMinutes()) : item;
                } else {
                    return (angular.isDate(date)) ? ((date.getHours() * 100) + date.getMinutes()) : item;
                }
            }

            //called when we want to save the form info back to model
            function setScheduleObject(currentItem) {
                if (currentItem != null) {
                    if ($scope.currentItem.frequencySelected != null && $scope.currentItem.frequencySelected.Data != null && angular.isDefined($scope.currentItem.frequencySelected.Data.daysOfMonth) && angular.isString($scope.currentItem.frequencySelected.Data.daysOfMonth )) {
                        $scope.currentItem.frequencySelected.Data.daysOfMonth = JSON.parse("[" + $scope.currentItem.frequencySelected.Data.daysOfMonth + "]");
                    }
                    //set nbr of doses (not nullable in DB)
                    if ($scope.currentItem.frequencySelected != null) {
                        $scope.currentItem.frequencySelected.Data.numberOfDoses = ($scope.currentItem.frequencySelected.Data.numberOfDoses != null) ? $scope.currentItem.frequencySelected.Data.numberOfDoses : 0; 
                    }
                   
                     //case of manual entry save custom freequency data
                    if ($scope.currentItem.frequencySelected != null) {
                        if (angular.isDefined($scope.currentItem.frequencySelected.isManualEntry) && currentItem.frequencySelected.isManualEntry == true) {
                            currentItem.schedule.frequencyData = angular.copy($scope.currentItem.frequencySelected.Data);
                            currentItem.schedule.frequencyTemplateId = null;
                            currentItem.schedule.isManualTemplateEntry = true;
                        } else {
                            currentItem.schedule.frequencyTemplateId = $scope.currentItem.frequencySelected.id;
                            currentItem.schedule.frequencyData = null;
                            currentItem.schedule.isManualTemplateEntry = false;
                        }
                    }
                    //save back metaWorkflows
                    currentItem.metaWorkflows = Enumerable.From(currentItem.metaWorkflowsIds).Select(function (item) { return new Lgi.Emr.Mar.Dto.workflowMetaInfoDto({ id: item, isInUse: true }); }).ToArray();

                }
            }
            function formatTime(time) {
                var result = false, timepart;
                var regex = /^\s*([01]?\d|2[0-3]):?([0-5]\d)\s*$/;
                if (angular.isDefined(time) && (timepart = time.match(regex))) {
                    result = (timepart[1].length == 2 ? "" : "0") + timepart[1] + ":" + timepart[2];
                }
                return result;
            }

            //reset administrations times to empty
            function emptyAdministrationTimes() {
                if (($scope.currentItem != null) && angular.isDefined($scope.currentItem.administrationTimes)) {
                    $scope.currentItem.administrationTimes = [];
                    //always save modifications to emaradministrationsTimes
                    $scope.currentItem.schedule.emarAdministrationTimes = [];
                }
            }

            function isAllAdmTimeFilled(administrationTimes) {
                return  administrationTimes.length == Enumerable.From(administrationTimes).Count(function (i) { return i.time != null; });
            }

            function dropEmptyAdministrationTimes(items) {
                angular.forEach(items, function (item) {
                    if (item.unknownTime) 
                        item.schedule.emarAdministrationTimes = [];                
                });
            }

            $scope.deleteVisible = false;
            $scope.onDragSuccess = function (data, evt) {
            };
            $scope.onDragRelease = function (data, evt) {
                data.moving = false;
            };
            $scope.onDropComplete = function (data, evt) {

                // Remove rxId from the session storage
                var rx = sessionStorage.getItem(appSettingConstants.selectedRxKey);
                if (angular.isDefined(rx) && rx !== null && rx !== "") {
                    var rxIds = rx.toString().split(",");
                    var indexSession = rxIds.indexOf(data.id.toString());
                    if (indexSession > -1) {
                        rxIds.splice(indexSession, 1).toString();
                        sessionStorage.setItem(appSettingConstants.selectedRxKey, rxIds.toString());
                    }
                }

                // Remove from list items
                var index = $scope.itemsToManage.indexOf(data);
                if (index > -1) {
                    $scope.itemsToManage.splice(index, 1);
                }

                // Reset the current RX or quit
                if ($scope.itemsToManage.length <= 0) {
                    $scope.pageManager.redirectToParent();
                } else {
                    //Select item
                    if (index >= $scope.itemsToManage.length) {
                        index -= 1;
                    }
                    $scope.selectedIndex = index;
                    selectItem();
                }
                onClose(null);
            };
            $scope.onDragMove = function (data, evt) {
                if (!$scope.deleteVisible) {
                    var removeWindow = $("#removeWindowId").kendoWindow({
                        title: $scope.cultureManager.resources.translate('REMOVE'),
                        height: 170,
                        width: 250,
                        draggable: false,
                        position: {
                            top: 400,
                            left: 250
                        },
                        close: onClose,
                        visible: false,
                        resizable: false
                    }).data("kendoWindow");
                    $scope.deleteVisible = true;
                    setTimeout(function () {
                        removeWindow.open();
                    }, 100);
                    data.moving = true;
                }
                data.moving = true;
            };
            function onClose(e) {
                var removeWindow = $("#removeWindowId").data("kendoWindow");
                setTimeout(function () {
                    $scope.deleteVisible = false;
                    if (angular.isDefined(removeWindow) && removeWindow !== null
                            && angular.isDefined(removeWindow.close) && removeWindow.close !== null)
                        removeWindow.close();
                }, 100);
            }

            function destroy() {
                var removeWindow = $("#removeWindowId").data("kendoWindow");
                setTimeout(function () {
                    $scope.deleteVisible = false;
                    if (angular.isDefined(removeWindow) && removeWindow !== null
                            && angular.isDefined(removeWindow.close) && removeWindow.close !== null)
                        removeWindow.destroy();
                }, 100);
            }

            function setDaysOfWeek(frequencyData) {
                var days = {};
                if (angular.isDefined(frequencyData.daysOfWeek)){
                    for (var i = 0; i < frequencyData.daysOfWeek.length; i++)
                        days[frequencyData.daysOfWeek[i]] = true;
                }
                return days;
            } 

            // Trying to navigate to another route
            $rootScope.$on('$locationChangeStart', routeChange);
            function routeChange(event, newUrl) {
                try {
                    destroy();
                } catch (error) {
                    //console.log(error);
                }
            }

            // Check if the current item has at least one MxComponents
            $scope.hasMxComponents = function () {
                if ($scope.currentItem != null) {
                    return $scope.currentItem.mxComposites.length > 0;
                }

                return false;
            };

            // Open mx components popup
            $scope.displayMxComponentsPopup = function () {
                var scope = $rootScope.$new();
                scope.rx = $scope.currentItem;
                scope.onClose = function () {
                    modalInstance.dismiss('close');
                }
                var modalInstance = $modal.open({
                    templateUrl: locationService.shared.views + "mx/mx-composition.html",
                    controller: 'mxCompositionController',
                    scope: scope,
                    backdrop: 'static',
                    keyboard: false
                });                
            };

            //UTILITY FORMAT JSON
            $scope.formatJSON = function(item) {
                return JSON.stringify(item, null, 3);
            };
        }
    ])
    .filter('replacestr', function () {
        return function (value, toReplaceStr, replaceStr) {
            return value.replace(toReplaceStr, replaceStr.toString());
        };
    });
