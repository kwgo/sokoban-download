//Rx Ad Hoc Management Controller
'use strict';
angular.module('app')
    .controller('rxAdHocManagementController',
    [
        '$rootScope', '$scope', '$modal', '$q', '$timeout', '$filter', '$location', '$window', '$sce', 'locationService', 'appSettingsFactory', 'rxHelperFactory', 'parameterService', 'mdService', 'permissionsHelperFactory',
        'authService', 'appSettingConstants', 'rxManagementService', 'entrepriseServices', 'advisorService', 'utlString', 'utlObject', 'patientHelperFactory', 'rxNavigationPathConstants', 
        function ($rootScope, $scope, $modal,  $q, $timeout, $filter, $location, $window, $sce, locationService, appSettingsFactory, rxHelperFactory, parameterService, mdService, permissionsHelperFactory,
            authService, appSettingConstants, rxManagementService, entrepriseServices, advisorService, utlString, utlObject, patientHelperFactory, rxNavigationPathConstants ) {

            $scope.model = {
                patient: $scope.$parent.model.patient // Get the patient from the root controller's model.patient
            };
            var isSaveFromLogoutEvent = false;
            $scope.administrationStatusList = [];
            $scope.isLoadingBody = true;
            $scope.isEpisodeFound = false;
            var searchModalInstance = null;
            var isDisplayMxSearchDialog = true; 
            //Embedded refresh callback
            $scope.$on('refreshCallback', function (event, args) {
                if (searchModalInstance) {
                    searchModalInstance.dismiss('cancel');
                    searchModalInstance = null;
                    isDisplayMxSearchDialog = false;
                    sessionStorage.setItem(appSettingConstants.displayMxSearchAtLoadKey, JSON.stringify(isDisplayMxSearchDialog));
                } 
                $timeout(function () {
                    $scope.$broadcast('triggerDirtyCheck', args);
                },250);

            });
            // Needs to be executed when the patient changes in the parent scope
            $scope.$on('patientChanged', function (event, args) { 
                $timeout(function () {
                    $scope.$broadcast('triggerDirtyCheck', args);
                });
            });

            $scope.$on('patientChangedAfterFormCheck', function (event, args) {
                if (angular.isDefined(args) && $scope.model.patient != args.val ) {
                        $scope.model.patient = args.val;  
                }
                initialize();
                $scope.editRxAdhocForm.$setPristine();
            });

            $scope.$on('logoutEvent', function () {
                if (pageChanged()) {
                    isSaveFromLogoutEvent = true;
                    $scope.$broadcast('triggerDirtyCheck'); 
                }
                else appSettingsFactory.logoutAndRedirectToDefault();
            });

            //doLaunchRxVigilance
            $scope.doLaunchRxVigilanceAdvisorProfessional = function () {
                rxHelperFactory.doLaunchRxVigilanceAdvisorProfessional($scope.model.parameter.advisorProfessionalCalculationIndexUrl);
            }

            $scope.doLaunchRxVigilanceAdvisorMonographs = function () {
                rxHelperFactory.doLaunchRxVigilanceAdvisorMonographs($scope.model.parameter.advisorMonographUrl,$scope.model.rx.mx.monographNumber);
            }

            //Analyse Mx with patient
            $scope.doAnalyseMx = function () {
                 advisorService.analyseAddition($scope.model.patient, $scope.model.rx.mx)
                    .then(function (data) {
                            //rx Vigilance result
                            var analysisResult = new Lgi.Emr.Mar.Dto.Advisor.AnalysisResult();
                            analysisResult.alerts = data.Result;
                            analysisResult.errors = data.Errors;
                            $scope.model.analyseResults.alerts = Enumerable.From(analysisResult.alerts).Select(function (i) {
                                i.text = $sce.trustAsHtml($filter('replacestr')(i.text, '.', '.<br />'));
                                return angular.extend(i, { severityDescription: getSeverityValue(i.severity) });
                            }).ToArray();
                            $scope.model.analyseResults.errors = Enumerable.From(analysisResult.errors).Select(function (i) {
                                i.errorMessage = $sce.trustAsHtml($filter('replacestr')(i.errorMessage, '.', '.<br />'));
                                return i ;
                            }).ToArray();

                            //display results and/or erros 
                            if (($scope.model.analyseResults.alerts.length + $scope.model.analyseResults.errors.length) > 0) $scope.displayMxComponentsPopup();
                        },
                        function(errors) {
                            appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), errors, $scope.cultureManager.resources.translate('CLOSE'));
                        });
            };
            // Open mx components popup
            $scope.displayMxComponentsPopup = function () {
                var scope = $rootScope.$new();
                scope.tableHeight = ($scope.model.analyseResults.alerts.length > 0 && $scope.model.analyseResults.errors.length > 0) ? '140px' : '280px';
                scope.analyseResults = $scope.model.analyseResults;
                scope.onClose = function () {
                    modalInstance.dismiss('close');
                }
                 var modalInstance = $modal.open({
                    templateUrl: locationService.shared.views + "mx/mx-analyse-result.html",
                    scope: scope,
                    windowClass: 'mx-analyse-modal-window',
                    backdrop: 'static',
                    keyboard: false
                });
            };
            //Search for Mx popup window
            $scope.doSearchMx = function () {
                searchModalInstance = $modal.open({
                    templateUrl: locationService.shared.views + "mx/mx-search.html",
                    controller: 'mxSearchManagementController',
                    windowClass: 'mx-search-modal-window',
                    backdrop : 'static',
                    keyboard :false
                });
                searchModalInstance.result
                    .then(function (mx) {
                        $scope.model.rx.mx = new Lgi.Emr.Mar.Dto.mxDto(mx);
                        $scope.model.rx.areAdministrationsMustBeSigned = areAdministrationsMustBeSigned();
                        $scope.doAnalyseMx();
                        $scope.editRxAdhocForm.$setDirty();
                        searchModalInstance = null;
                    }, function() {
                        //case of new adhoc with no selected mx, assume user is there be mistake go back to list
                        if ($scope.model.rx.mx.pharmacyDescription == '') $scope.pageManager.redirectToParent();
                });
            };
            $scope.onDoubleCheckDose = function () {
                if ($scope.model.rx.id) {
                    if ($scope.editRxAdhocForm.$valid) {
                        var scope = $rootScope.$new();
                        scope.model = {};
                        scope.model.rx = angular.copy($scope.model.rx);
                        var modalInstance = $modal.open({
                            templateUrl: locationService.shared.views + "rx/rx-double-check-dose.html",
                            scope: scope,
                            controller: 'rxDoubleCheckDoseController',
                            windowClass: 'modal-window-medium',
                            backdrop: 'static',
                            keyboard: false
                        });
                        modalInstance.result.then(function (rx) {
                            $scope.model.rx = rx;
                            initRxControlFields();
                            initList().then(function () {
                                $scope.model.rxBackup = angular.copy($scope.model.rx);
                                setMetaWorkflowsIds();
                            });
                            $scope.editRxAdhocForm.$setPristine();
                        });
                    } else {
                        appSettingsFactory.triggerValidations($scope.editRxAdhocForm);
                    }
                } else {
                    appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('ERROR_SAVE_ADHOC_RX_FIRST'), $scope.cultureManager.resources.translate('CLOSE'));
                }
            }
            // Dosage Type code (radio Btn)
            $scope.$watch('model.rx.dosageTypeCode', function(newValue, oldValue) {
                if (angular.isDefined(oldValue) && oldValue != '' && angular.isDefined(newValue) && newValue != '') {
                    $scope.model.rx.dosageTypeId = appSettingsFactory.getDataLookupInstanceByCode($scope.model.rx.dosageTypeCode, $scope.model.dosageTypeList).id;
                    //force the update of Frequency
                    onChangeFrequencyTemplateType($scope.model.rx.frequencyTemplateType);
                }
            }, true);
            // Schedule frequecy date templatetype (radio Btn)
            $scope.$watch('model.rx.frequencyTemplateType', function(newValue, oldValue) {
                if (angular.isDefined(oldValue) && oldValue != '' && angular.isDefined(newValue) && newValue != '') {

                    onChangeFrequencyTemplateType($scope.model.rx.frequencyTemplateType);
                }
            }, true);

            var toggleWatch = function (watchExpr, listener, objEquality) {
                var watchFn;
                return function() {
                    if (watchFn) {
                        watchFn();
                        watchFn = undefined;
                    } else {
                        watchFn = $scope.$watch(watchExpr, listener, objEquality);
                    }
                }
            }

            var modelRxHandle = toggleWatch('model.rx', function (newItem, oldItem) {
                if ($scope.isLoadingBody)
                    return;
                if (!angular.isDefined(newItem) || !angular.isDefined(oldItem))
                    return;
                // both objects are identical
                if (oldItem === newItem || $scope.isSaving) 
                    return;

                // both objects are not signed
                if (!(angular.isDefined(oldItem.signature) && oldItem.signature !== null &&
                      angular.isDefined(oldItem.signature.userName) && oldItem.signature.userName != "" &&
                      angular.isDefined(newItem.signature) && newItem.signature !== null && angular.isDefined(newItem.signature.userName) && newItem.signature.userName != ""))
                    return;
                // update is in progress
                if (angular.isDefined($scope.updateInProgress) && $scope.updateInProgress == true) {
                    return;
                }
                if (newItem.metaWorkflowsIds.toString() == oldItem.metaWorkflowsIds.toString() &&
                        newItem.nursingDirectives == oldItem.nursingDirectives &&
                        newItem.instructions == oldItem.instructions &&
                        newItem.areAdministrationsMustBeSigned == oldItem.areAdministrationsMustBeSigned &&
                        newItem.adhocReasonId == oldItem.adhocReasonId &&
                        JSON.stringify(newItem.prescription.md) == JSON.stringify(oldItem.prescription.md) && //utlObject.areObjectEquals(newItem.prescription.md, oldItem.prescription.md) &&
                        newItem.prescription.prescriber == oldItem.prescription.prescriber &&
                        newItem.dosageMustBeDoubleVerified == oldItem.dosageMustBeDoubleVerified &&
                        newItem.dosageVerification1User == oldItem.dosageVerification1User &&
                        newItem.dosageVerification1ResultId == oldItem.dosageVerification1ResultId &&
                        newItem.dosageVerification1Timestamp == oldItem.dosageVerification1Timestamp &&
                        newItem.dosageVerification2User == oldItem.dosageVerification2User &&
                        newItem.dosageVerification2ResultId == oldItem.dosageVerification2ResultId &&
                        newItem.dosageVerification2Timestamp == oldItem.dosageVerification2Timestamp &&
                        ($scope.currentStatus.code != appSettingsFactory.rxStatusKey.ceased || newItem.rxStatusId == oldItem.rxStatusId) 
                ) {
                    var onCloseFunction = function () {
                        var deferred = $q.defer();
                        deferred.promise
                                .then(function(response) {
                                    $scope.model.rx = oldItem;
                                    return true;
                                })
                                .then(function (response) {
                                $timeout(function () { $scope.updateInProgress = false; }, 0, false);
                                });
                        deferred.resolve(true);
                    };

                    var onActionFunction = function () {
                        // Cancel double check (signature)
                        rxManagementService.cancelSignature($scope.model.rx)
                            .then(
                                function(rxUpdated) {
                                    if (rxUpdated != null && rxUpdated.Result != null) {
                                        $scope.model.rx = new Lgi.Emr.Mar.Dto.rxDto(rxUpdated.Result);
                                        initRxControlFields();
                                        initList().then(function() {
                                            $scope.model.rxBackup = angular.copy($scope.model.rx);
                                            setMetaWorkflowsIds();
                                        });
                                    }
                                    if (rxUpdated != null && rxUpdated.HasErrors) {
                                        appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), rxUpdated.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                                    }
                                },
                                function(scError) {
                                    appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), scError.data.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                                }
                            ).finally(function () {
                                $timeout(function () { $scope.updateInProgress = false; }, 0, false);
                            });
                    };
                    
                    $scope.updateInProgress = true;
                    appSettingsFactory.displayConfirmation($scope.cultureManager.resources.translate('ADHOC_PAGETITLE'), $scope.cultureManager.resources.translate('CONFIRM_CHANGES_SIGNED_ADHOC_RX'), $scope.cultureManager.resources.translate('YES'), $scope.cultureManager.resources.translate('NO'), null, onActionFunction, onCloseFunction);
                }

            }, true );

            // Click on history button
            $scope.onViewHistory = function(id) {
                $scope.wndHistory.title($scope.cultureManager.resources.translate('RX_AD_HOC_HISTORY_TITLE'));
                $rootScope.historyService.setParams(id, 'RxAdHoc');
                $scope.historyWndVisible = true;
                //$scope.wndHistory.center().open();  -> to center in screen instead of using k-position
                $scope.wndHistory.center().open();
                $scope.wndHistory.refresh();
            };

            //2 different kinds of submit (pass submitButtonId to known which button was clicked)
            $scope.onSubmit = function() {
                var deferred = $q.defer();
                switch ($scope.submitButtonId) {
                    case 'saveButton':
                        $scope.save().then(function () {
                            modelRxHandle();
                            deferred.resolve();

                        });
                    break;
                    case 'saveAndAdministerButton':
                        $scope.saveAndAdminister().then(function() {
                            deferred.resolve();
                        });
                    break;
                    case 'startProcessingButton':
                        $scope.startProcessing().then(function () {
                            $scope.pageManager.redirectToParent();
                            deferred.resolve();
                        });
                        break;
                default:
                    // case of back button or logout, Yes to save if form valid
                    if ($scope.editRxAdhocForm.$valid) {
                        switch ($scope.pageManager.currentPage.Key) {
                            case $scope.manageNavigation:
                                $scope.save().then(function () {
                                  modelRxHandle();
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
                    } else { //form is invalid, trigger validation
                        appSettingsFactory.triggerValidations($scope.editRxAdhocForm);
                        deferred.reject();
                    }
                    break;
                }

                return deferred.promise;
            };
            $scope.resetData = function() {
                $scope.model.rx = angular.copy($scope.model.rxBackup);
                $scope.editRxAdhocForm.$setPristine();
                if (isSaveFromLogoutEvent) appSettingsFactory.logoutAndRedirectToDefault();
            };
            $scope.save = function () {
                modelRxHandle();
                var deferred = $q.defer();
                setRxObject($scope.model.rx); //prepare obj for saving
                //Check if new or modification
                if ($scope.model.rx.id) {
                    rxHelperFactory.saveRx($scope.model.rx)
                        .then(
                            function(result) {
                                if (angular.isDefined(result)) {
                                    $scope.model.rx = new Lgi.Emr.Mar.Dto.rxDto(result);
                                    initRxControlFields();
                                    $scope.model.rxBackup = angular.copy($scope.model.rx);
                                    setMetaWorkflowsIds();
                                    deferred.resolve($scope.model.rx);
                                    $timeout(function() {
                                        appSettingsFactory.displayPopover('top', '', $scope.cultureManager.resources.translate('ITEM_ADHOC_SAVED'), '#saveButton', 3000);
                                    },250);
                                    $scope.editRxAdhocForm.$setPristine();
                                    sessionStorage.setItem(appSettingConstants.selectedRxKey, $scope.model.rx.id);
                                }
                            },
                            function(errors) {
                                deferred.reject(errors);
                                appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), errors, $scope.cultureManager.resources.translate('CLOSE'));
                            }
                        );
                } else {
                    rxHelperFactory.createRx($scope.model.rx)
                        .then(
                            function(result) {
                                if (angular.isDefined(result)) {
                                    // reload the result, we need the id
                                    $scope.model.rx = new Lgi.Emr.Mar.Dto.rxDto(result);;
                                    initRxControlFields();
                                    $scope.model.rxBackup = angular.copy($scope.model.rx);
                                    setMetaWorkflowsIds();
                                    deferred.resolve($scope.model.rx);
                                    appSettingsFactory.displayPopover('top', '', $scope.cultureManager.resources.translate('ITEM_ADHOC_SAVED'), '#saveButton', 3000);
                                    $scope.editRxAdhocForm.$setPristine();
                                    sessionStorage.setItem(appSettingConstants.selectedRxKey, $scope.model.rx.id);
                                }
                            },
                            function(errors) {
                                deferred.reject(errors);
                                appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), errors, $scope.cultureManager.resources.translate('CLOSE'));
                            }
                        );
                }
                return deferred.promise;
            };

            $scope.saveAndAdminister = function() {
                var deferred = $scope.save().then(function (result) {
                        // go to administration
                        var id = $scope.model.rx.id;
                        sessionStorage.setItem(appSettingConstants.selectedRxKey, id);
                        $scope.pageManager.redirect('rx/adhoc/administration');
                    },
                    function (errors) {

                        //do nothing
                    });
                return deferred;
            };
            $scope.cancel = function() {
                //go back  dirty directive will trap if modification and display modal if needed
                if ((!$scope.model.rx.id)) {
                    $scope.editRxAdhocForm.$setPristine(); //to avoid save dialog
                    $scope.pageManager.redirectToParent();
                } else {

                    if (pageChanged()) {
                        var onCloseFunction = function () {
                            // Do nothing if cancel  
                        };
                        var onActionFunction = function () {
                            // Restore the changed to bkp item
                            $scope.resetData();
                            setMetaWorkflowsIds();
                            $scope.model.rx.doubleCheckDoseStatus = rxHelperFactory.setDoubleCheckDoseStatus($scope.model.rx);
                        };
                        appSettingsFactory.displayConfirmation($scope.cultureManager.resources.translate('CANCEL_CHANGES'), $scope.cultureManager.resources.translate('CONFIRM_CANCEL_CHANGES'), $scope.cultureManager.resources.translate('YES'), $scope.cultureManager.resources.translate('NO'), null, onActionFunction, onCloseFunction);
                    }
                }
                
            };
            // Click on Start
            $scope.startProcessing = function () {
                if (!$scope.model.rx.isProcessed) {
                    //reset wath handle
                    modelRxHandle();
                    //SAVE STUFF FOR CURRENT ITEM 
                    setRxObject($scope.model.rx); //prepare obj for saving
                    var items = [];
                    items.push($scope.model.rx);
                    return startProcessing(items);
                } else return null;
            };

            //trigger modification to update validation (combo dispenseAmount, amountUnit)
            $scope.onDoseAmountChange = function () {
                $scope.editRxAdhocForm.amountunit.$setViewValue($scope.model.rx.schedule.dose.receivedAmountUnitId);
            };
            $scope.isDoseAmountInvalid = function() {
                if (angular.isDefined($scope.model.rx)) {
                    return (($scope.model.rx.schedule.dose.receivedGiveAmountMin != null && $scope.model.rx.schedule.dose.receivedGiveAmountMin != '') &&
                            ($scope.model.rx.schedule.dose.receivedAmountUnitId == null || $scope.model.rx.schedule.dose.receivedAmountUnitId == 0));

                } else {
                    return true;
                }
            };
            $scope.isTimestampsNotSpecified = function(timestamps) {
                if (angular.isArray(timestamps)) {
                    if (Enumerable.From(timestamps).Where(function (i) { return i != undefined && i != null && i != ''; }).Any())
                        return false;
                    return (($scope.model.rx.frequencyTemplateType != appSettingsFactory.rxScheduleTemplateTypeKey.listoftimestamps) || ($scope.model.rx.dosageTypeCode == appSettingsFactory.dosageTypeKey.continuous)) ? true : false;
                } else {
                    return false;
                }
            };
            $scope.onMdPrescriberChange = function (e) {
                $scope.editRxAdhocForm.otherPrescriber.$setViewValue(angular.copy($scope.model.rx.prescription.prescriber));
                $scope.editRxAdhocForm.otherPrescriber.$render();
                $scope.editRxAdhocForm.$setDirty();
                $scope.model.rx.prescription.prescriber = '';
                //clear applied filters
                var filters = e.sender.dataSource.filter();
                if (filters) {
                    e.sender.dataSource.filter({});
                }
            };
            $scope.onOtherPrescriberChange = function () {
                $scope.model.rx.prescription.md = null;
                $scope.editRxAdhocForm.$setDirty();
            };
            $scope.getCurrentUser = function () {
                $scope.model.rx.prescription.prescriber = authService.model.identity.user.firstName + ' ' + authService.model.identity.user.lastName + ((authService.model.identity.user.titleCode != '') ? ' , ' + authService.model.identity.user.titleCode : '');
                $scope.editRxAdhocForm.otherPrescriber.$setViewValue(angular.copy($scope.model.rx.prescription.prescriber));
                $scope.editRxAdhocForm.otherPrescriber.$render();
                $scope.onOtherPrescriberChange();
            };
            //Trigger a change on input with validation to make sure validation is updated
            $scope.onTimestampsConditionnalValidationChange = function() {
                $scope.editRxAdhocForm.timestamps0.$setViewValue($scope.model.rx.schedule.frequencyData.timestamps[0]);
                $scope.editRxAdhocForm.timestamps0.$render();
            }
            // Click on List Administrations
            $scope.canListAdministrations = function() {
                if (angular.isDefined($scope.model.rx) && $scope.model.rx.id) {
                    return Enumerable.From($scope.model.rx.administrations).Where(function (i) { return i.realizationDateTime != null; }).Count() > 0;
                } else {
                    return false;                    
                }
            };
            // Click on administrations list
            $scope.rxAdministrationList = function() {
                $scope.pageManager.redirect('rx/administration', [
                    { key: 'admlist', value: true }
                ]);
            };

            $scope.isAdministrationStatusPrepared = function (item) {
                return rxHelperFactory.isAdministrationStatusPrepared(item, $scope.administrationStatusList);
            };

            // Click on Extra Dose btn
            $scope.addExtraDose = function () {

                if ($scope.isAdministrationStatusPrepared($scope.model.rx)) {
                    appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('ADMINISTRATION_STATUS_PREPARED'), $scope.cultureManager.resources.translate('CLOSE'));
                    return;
                }

                $scope.pageManager.redirect('rx/administration', [
                    { key: 'extradose', value: true }
                ]);
            };

            //Use to enable/disable ExtraDose Btn
            $scope.canAddExtraDose = function() {
                if (angular.isDefined($scope.model.rx) && $scope.model.rx.id && $scope.currentStatus != null && $scope.currentDosageType != null) {
                    var isGracePeriodReached = $scope.isGracePeriodReached;
                    return rxHelperFactory.isExtraDosePossible($scope.model.rx, $scope.currentStatus.code, $scope.model.rx.dosageTypeCode, isGracePeriodReached);
                } else {
                    return false;
                }
            };

            $scope.isGracePeriodReached = function () {
                if (angular.isDefined($scope.model.rx) && ((angular.isDefined($scope.model.rx.realEndTimestamp) && $scope.model.rx.realEndTimestamp != null)
                    || (angular.isDefined($scope.model.rx.cessationTimestamp) && $scope.model.rx.cessationTimestamp != null))) {
                    var dateTimestamp = ($scope.model.rx.realEndTimestamp != null) ? $scope.model.rx.realEndTimestamp : $scope.model.rx.cessationTimestamp;
                    return rxHelperFactory.isInDisgrace(dateTimestamp, $scope.model.parameter.gracePeriodForInactivePrescription);
                } else {
                    return false; 
                } 
            };

            $scope.canBeSigned = function() {
                if (angular.isDefined($scope.model.rx) && angular.isDefined($scope.model.rx.mustBeSigned)) {
                    return $scope.model.rx.mustBeSigned && $scope.model.rx.id != 0
                        && (!angular.isDefined($scope.model.rx.signature) || $scope.model.rx.signature == null || $scope.model.rx.signature.userName == '');
                } else {
                    return false;
                }
            };

            // Sign the ad hoc Rx
            $scope.sign = function() {
                
                if ($scope.model.rx.createdBy !== null && $scope.model.rx.createdBy != authService.model.identity.user.id) {

                    // validate security permission
                    if ($scope.grant.notAllowedSignAdHocPrescription) {
                        appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('NOT_AUTHORIZED_TO_DOUBLESIGN_ADHOC'), $scope.cultureManager.resources.translate('CLOSE'));
                        return;
                    };

                    //SIGN_CONFIRM
                    var onCloseFunction = function() {
                        // Do nothing if cancel  
                    };
                    var onActionSignFunction = function () {
                        modelRxHandle();
                        $scope.model.rx.signature = new Lgi.Emr.Mar.Dto.signatureDto();
                        $scope.model.rx.signature.userId = authService.model.identity.user.userId;
                        $scope.model.rx.signature.userName = authService.model.identity.user.userName;
                        setRxObject($scope.model.rx); //prepare obj for saving

                        //Sign administration
                        rxManagementService.doubleCheck($scope.model.rx)
                            .then(
                                function(rxUpdated) {
                                    if (rxUpdated != null) {
                                        $scope.model.rx = new Lgi.Emr.Mar.Dto.rxDto(rxUpdated.Result);
                                        initRxControlFields();
                                        initList().then(function() {
                                            $scope.model.rxBackup = angular.copy($scope.model.rx);
                                            setMetaWorkflowsIds();
                                        });
                                    }
                                    if (rxUpdated != null && rxUpdated.HasErrors) {
                                        appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), rxUpdated.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                                    }
                                    modelRxHandle();
                                    $scope.editRxAdhocForm.$setPristine();
                                },
                                function(scError) {
                                    appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), scError.data.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                                }
                            );
                    };

                    appSettingsFactory.displayConfirmation($scope.cultureManager.resources.translate('SIGNATURE'), $scope.cultureManager.resources.translate('CONFIRM_SIGNATURE'), $scope.cultureManager.resources.translate('YES'), $scope.cultureManager.resources.translate('NO'), null, onActionSignFunction, onCloseFunction);

                } else {
                    var scope = $rootScope.$new();
                    scope.service = rxManagementService;
                    setRxObject($scope.model.rx); //prepare obj for saving
                    scope.model = angular.copy($scope.model.rx);
                    scope.MAR_DA_Sign = $scope.permission.marRolesList.MAR_DA_SignAdHocPrescription;
                    scope.messageAuthorization = $scope.cultureManager.resources.translate('NOT_AUTHORIZED_TO_DOUBLESIGN_ADHOC');
                    scope.signatureType = "PRESCRIPTION";

                    var modalInstance = $modal.open({
                        templateUrl: locationService.shared.views + "signature/signature.html",
                        controller: 'signatureController',
                        windowClass: 'modal-window-small',
                        scope: scope,
                        backdrop: 'static',
                        keyboard: false
                    });
                    modalInstance.result.then(function(rxUpdated) {
                        if (rxUpdated != null ) {
                            $scope.model.rx = new Lgi.Emr.Mar.Dto.rxDto(rxUpdated.Result);
                            initRxControlFields();
                            initList().then(function () {
                                $scope.model.rxBackup = angular.copy($scope.model.rx);
                                setMetaWorkflowsIds();
                            });
                        }
                        if (rxUpdated != null && rxUpdated.HasErrors) {
                            appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), rxUpdated.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                        }
                        $scope.editRxAdhocForm.$setPristine();
                    });
                }
            };

            // Gets the cessation reason
            $scope.cessationReason = function() {
                return appSettingsFactory.getDataLookupInstanceById($scope.model.rx.cessationReasonId, $scope.model.cessationReasonList);
            };
            // Rx can be ceased?
            $scope.canBeCeased = function() {
                if (angular.isDefined($scope.model.rx)) {
                    if ($scope.currentStatus != null && $scope.currentStatus.code != appSettingsFactory.rxStatusKey.completed && $scope.currentStatus.code != appSettingsFactory.rxStatusKey.cancelled
                            && $scope.currentStatus.code != appSettingsFactory.rxStatusKey.ceased && $scope.currentStatus.code != appSettingsFactory.rxStatusKey.newRx && $scope.model.rx.id != 0
                    ) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            };

            // Cease ad hoc RX
            $scope.cease = function() {
                if (!canBeCeased($scope.currentStatus)) {
                    appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('CANNOT_BE_CEASED') + status.shortDescription, $scope.cultureManager.resources.translate('CLOSE'));
                    return;
                }
                ceaseWindow("CEASE");
            };
            $scope.normalized = function (str) {
                if (angular.isString(str)) {
                    return utlString.normalize(str);
                } else {
                    return str;
                }
            }
            // form description
            $scope.getFormDescription = function (id) {
                return appSettingsFactory.getDataLookupShortDescriptionById(id, $scope.model.formList);
            };
            //Frequency Type Change
            $scope.onFrequencyTypeChange = function(value) {
                switch (value) {
                    case 'DoseOnly':
                        $scope.model.rx.schedule.frequencyData = new Lgi.Emr.Mar.Dto.frequencyDataDoseOnly();
                        $scope.model.rx.schedule.frequencyData.numberOfDoses = 1;
                        break;
                    case 'PRN':
                        $scope.model.rx.schedule.frequencyData = null;
                        break;
                    case 'ListOfTimestamps':
                        $scope.model.rx.schedule.frequencyData = new Lgi.Emr.Mar.Dto.frequencyDataListOfTimestamps();
                        break;
                    default:
                        break;
                }
            }

            // Verify if this rx can be ceased
            function canBeCeased(status) {
                if (status.code == appSettingsFactory.rxStatusKey.completed || status.code == appSettingsFactory.rxStatusKey.ceased
                    || status.code == appSettingsFactory.rxStatusKey.cancelled || status.code == appSettingsFactory.rxStatusKey.newRx) {
                    return false;
                } else {
                    return true;
                }
            }
            // Cease window
            function ceaseWindow(mode) {
                //Cease window
                var scope = $rootScope.$new();
                scope.ids = [];
                scope.ids.push($scope.model.rx.id);
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
                modalInstance.result.then(function(itemCeased) {
                    if (itemCeased != null && itemCeased.Result.length > 0) {
                        $scope.model.rx = Enumerable.From(itemCeased.Result).First();
                        initList().then(function () {
                            $scope.currentDosageType = currentDosageType();// Status of the current dosagetype
                            $scope.currentStatus = currentStatus();// Status of the current RX
                            //extendMdObj($scope.model.rx.prescription.md);
                            $scope.model.rxBackup = angular.copy($scope.model.rx);
                        });
                    }
                    if (itemCeased != null && itemCeased.HasErrors) {
                        appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), itemCeased.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                    }
                });
            }

            $scope.onChangeFlowsheet = function (e) {
                //check if we have a delete, verify if is allowed
                if (isFlowSheetDeleteEvt()) {
                    //we should have a array of one element only in diff
                    var deletedtemId = Enumerable.From($scope.model.oldMetaWorkflowsIds).Except(Enumerable.From($scope.model.rx.metaWorkflowsIds)).FirstOrDefault();
                    if (deletedtemId) {
                        if (rxHelperFactory.isFlowSheetDeleteDisabled(deletedtemId, $scope.model.rx.metaWorkflows)) {
                            //can not delete item go back to previous value
                            $scope.model.rx.metaWorkflowsIds = angular.copy($scope.model.oldMetaWorkflowsIds);
                            setCloseIconFlowsheet(e);
                        } else {
                            $scope.editRxAdhocForm.$setDirty();
                        }
                    }
                } else {
                    $scope.editRxAdhocForm.$setDirty();
                }
                $scope.model.oldMetaWorkflowsIds = angular.copy($scope.model.rx.metaWorkflowsIds); 
            }

            function isFlowSheetDeleteEvt() {
                return ($scope.model.rx.metaWorkflowsIds.length <= $scope.model.oldMetaWorkflowsIds.length);
            }

            function setCloseIconFlowsheet(e) {
                //wait for the drawing
                $timeout(function () {
                    angular.forEach(e.sender._dataItems, function (item) {
                        if (rxHelperFactory.isFlowSheetDeleteDisabled(item.id, $scope.model.rx.metaWorkflows)) {
                            $("#kendo-multi-select ul li" + ":contains(" + item.shortDescription + ")").find("span.k-delete").removeClass("k-delete").addClass("empty-kendo-icon");
                        }
                    });
                }, 250, false);
            }

            function onDataBound(e) {
                setCloseIconFlowsheet(e);
                $scope.model.oldMetaWorkflowsIds = angular.copy($scope.model.rx.metaWorkflowsIds);
            }
            // Class Therapeutic is double sign
            $scope.isClassTherapeuticDoubleSign = function(rx, mxClassList) {
                var bReturn = false;
                if ((rx.areAdministrationsMustBeSigned && rx.id) || (rx.id == 0))  {
                    angular.forEach(rx.mx.mxClassIds, function (id) {
                        var mxClass = appSettingsFactory.getDataLookupInstanceById(id, mxClassList);
                        if (angular.isDefined(mxClass) && mxClass !== null && mxClass.isDoubleSignature === true) {
                            bReturn = true;
                        }
                    });
                }
                return bReturn;
            };
            $scope.isAdministrationStatusPrepared = function (item) {
                return rxHelperFactory.isAdministrationStatusPrepared(item, $scope.model.administrationStatusList);
            };

            // Initialize content
            initialize();

            // Initialize content
            function initialize() {
                loadPermissions();

                $scope.submitButtonId = '';
                $scope.model.analyseResults = {};
                $scope.model.parameter = {};
                $scope.model.flowSheetsSelectedShortDescription = "";
                $scope.model.rx = new Lgi.Emr.Mar.Dto.rxDto(); //will  be override in loadRx
                $scope.model.rx.doubleCheckDoseStatus = '';
                $scope.model.rx.dosageTypeCode = '';
                $scope.model.rx.frequencyTemplateType = '';
                $scope.model.rx.isAdministrationRealized = false;
                $scope.model.rx.metaWorkflowsIds = [];
                $scope.model.oldMetaWorkflowsIds = [];
                $scope.manageNavigation = rxNavigationPathConstants.adhocNavigationPath;
                $scope.startProcessingNavigation = rxNavigationPathConstants.startAdHocProcessingNavigationPath;

                //Check if we are creating or modifying
                var rxAdhocId = sessionStorage.getItem(appSettingConstants.selectedRxKey);
                loadRessources().then(function() {
                    loadRx(rxAdhocId).then(function(rx) {
                        $scope.model.rx = rx;
                        initParameter().then(function() {
                            initList().then(function () {
                                $scope.currentDosageType = currentDosageType();// Status of the current dosagetype
                                $scope.currentStatus = currentStatus();// Status of the current RX
                                loadMds().then(function () {
                                //check if NEW or modification
                                    if (rxAdhocId) {
                                        $scope.model.rxBackup = angular.copy($scope.model.rx);
                                    } else {
                                        $scope.model.rx.schedule.frequencyData.numberOfDoses = 1; //for some reason Number od doses is reser after md load
                                        $scope.model.rx.prescription.md = null; 
                                        $scope.model.rxBackup = angular.copy($scope.model.rx);

                                        isDisplayMxSearchDialog = angular.fromJson(sessionStorage.getItem(appSettingConstants.displayMxSearchAtLoadKey));
                                        if (!angular.isDefined(isDisplayMxSearchDialog)) isDisplayMxSearchDialog = true;
                                        if (isDisplayMxSearchDialog) {
                                             $scope.doSearchMx();
                                        }
                                    }
                                    $timeout(function () {
                                        $scope.$emit('UpdateRefreshButton', { val: !(rxAdhocId == null || rxAdhocId == 0) });
                                        $scope.$emit('UpdatePrintButton', { val: !(rxAdhocId == null || rxAdhocId == 0) });
                                    }, 250);

                                    setMetaWorkflowsIds();
                                    $scope.isLoadingBody = false;
                                    $scope.isNewRxCreation = ($scope.model.rx.id == 0);
                                    //put a delay before starting watch
                                    $timeout(function () {
                                        modelRxHandle();
                                    }, 500);


                                });
                            });
                        });
                    });
                });
            }

            function loadRessources() {
                var deferred = $q.defer();
                $scope.cultureManager.resources.shared.load('rx-adhoc').then(function () {
                    $scope.numericTextBoxOptions = {
                        format: "#",
                        decimals: 0,
                        step: 1,
                        min: 1,
                        max: 6,
                        upArrowText: $scope.cultureManager.resources.translate('INCREASE_VALUE'),
                        downArrowText: $scope.cultureManager.resources.translate('DECREASE_VALUE')
                    }
                    deferred.resolve();
                });
                return deferred.promise;
            }

            //make sure all lists are loaded before assinging values 
            function initList() {
                var deferred = $q.defer();
                //make sure all lists are loaded before assinging values 
                var lookups = [
                    [appSettingsFactory.dataLookups.amountUnit, "amountUnitList"],
                    [appSettingsFactory.dataLookups.dosageType, "dosageTypeList"],
                    [appSettingsFactory.dataLookups.workflow, "flowSheetList"],
                    [appSettingsFactory.dataLookups.nonAdminReason, "reasonList"],
                    [appSettingsFactory.dataLookups.route, "routeList"],
                    [appSettingsFactory.dataLookups.rxSource, "rxSourceList"],
                    [appSettingsFactory.dataLookups.rxStatus, "rxStatusList"],
                    [appSettingsFactory.dataLookups.schedulePriority, "schedulePriorityList"],
                    [appSettingsFactory.dataLookups.strengthUnit, "strengthUnitList"],
                    [appSettingsFactory.dataLookups.adhocReason, "reasonList"],
                    [appSettingsFactory.dataLookups.cessationReason, "cessationReasonList"],
                    [appSettingsFactory.dataLookups.form, "formList"],
                    [appSettingsFactory.dataLookups.mxClass, "mxClassList"],
                    [appSettingsFactory.dataLookups.administrationStatus, "administrationStatusList"]
                ];
                // get lookup content, fetch to service if it is not in the session.
                entrepriseServices
                    .lookup
                    .setMany(lookups, $scope.model)
                    .then(function () {
                        //extend routeList with special property for the OrderBy (normalize shortDescription)
                        $scope.model.routeList = Enumerable.From($scope.model.routeList).Select(function (item) {
                            return angular.extend(item, { normalizedShortDescription: normalizedName(item.shortDescription) });
                        }).Where(function (item) {
                            return item.isActive == true && angular.isDefined(item.shortDescription);
                        }).OrderByDescending("$.isInTopLevelGroup")
                          .ThenBy("$.normalizedShortDescription").ToArray();
                        // find first break, and insert separator
                        var route = Enumerable.From($scope.model.routeList).Where(function(item) { return item.isInTopLevelGroup == false ; }).FirstOrDefault();
                        var index = $scope.model.routeList.indexOf(route);
                        var routeSeparator = { isInTopLevelGroup: false, code: '', shortDescription: Array(16).join("\u2014"), isActive: true, id: 0, normalizedShortDescription: '' }
                        $scope.model.routeList.splice(index, 0, routeSeparator);
                        //diacritical sort on shortDescription
                        $scope.model.amountUnitList = Enumerable.From($scope.model.amountUnitList).Where(function (i) { return i.isActive == true && angular.isDefined(i.shortDescription); })
                           .OrderBy(function (i) { return utlString.normalize(i.shortDescription); }).ToArray();
                        //diacritical sort on shortDescription
                        $scope.model.reasonList = Enumerable.From($scope.model.reasonList).Where(function (i) { return i.isActive == true && angular.isDefined(i.shortDescription); })
                           .OrderBy(function (i) { return utlString.normalize(i.shortDescription); }).ToArray();
                        //only active for flowSheetList
                        $scope.model.flowSheetList = Enumerable.From($scope.model.flowSheetList).Where(function (i) { return i.isActive == true; })
                           .OrderBy(function (i) { return utlString.normalize(i.shortDescription); }).ToArray();
                        initRxControlFields();
                        deferred.resolve();
                });
                return deferred.promise;
            }

            //load mds
            function loadMds() {
                var deferred = $q.defer();
                mdService.get().then(function (result) {
                    $scope.mdDropDownItemTemplate = "<span>{{ dataItem.lastName }}, {{ dataItem.firstName }}</span>";
                    $scope.model.mdList = Enumerable.From(result).Select(function (i) {
                        return new Lgi.Emr.Mar.Dto.mdDto(i);
                    }).OrderBy(function (i) { return utlString.normalize(i.fullName ); }).ToArray();
                    deferred.resolve();
                });
                return deferred.promise;
            }

            // Gets the selected visit
            function getVisit() {
                var patient = JSON.parse(sessionStorage.getItem(appSettingConstants.selectedPatientEntityKey));
                var visitId = sessionStorage.getItem(appSettingConstants.selectedVisitKey);
                var visitPatient = Enumerable.From(patient.episodes).Where(function (i) { return i.visit.visitID == visitId;}).FirstOrDefault().visit;

                if (patient.MRNs.length > 0)
                    visitPatient.mrn = angular.copy(patient.MRNs[0]);

                // CurrentVisit, Adhoc RX will belong to this visit.
                var visit = angular.copy(visitPatient);
                visit.applicationId = visitPatient.applicationIDSource;
                visit.installationId = visitPatient.installationIDSource;
                visit.careUnitCode = visitPatient.careUnit;

                return visit;
            }

            function initRxControlFields() {
                //New entity, init those properties
                if (!$scope.model.rx.id) {
                    $scope.model.rx.currentVisit = getVisit();
                    $scope.model.rx.dosageTypeId = appSettingsFactory.getDataLookupInstanceByCode(appSettingsFactory.dosageTypeKey.quantified, $scope.model.dosageTypeList).id; // QUANT
                    $scope.model.rx.rxSourceId = appSettingsFactory.getDataLookupInstanceByCode(appSettingsFactory.rxGroupsKey.adHoc, $scope.model.rxSourceList).id; // ADHOC
                    $scope.model.rx.rxStatusId = appSettingsFactory.getDataLookupInstanceByCode(appSettingsFactory.rxStatusKey.consulted, $scope.model.rxStatusList).id; // consulted                 
                    $scope.model.rx.schedule.schedulePriorityId = appSettingsFactory.getDataLookupInstanceByCode(appSettingsFactory.rxSchedulePriorityKey.regular, $scope.model.schedulePriorityList).id; // R
                    $scope.model.rx.schedule.frequencyData = new Lgi.Emr.Mar.Dto.frequencyDataDoseOnly();
                    $scope.model.rx.schedule.frequencyData.numberOfDoses = 1; //set number of dose to 1 in case of new rx
                    $scope.model.rx.mustBeSigned = $scope.model.parameter.doubleSignatureAdhocPrescriptions;
                    $scope.model.rx.maximumAdministrationCount = $scope.model.parameter.maxFutureAdministrations;
                } else {
                    //in case of old rx
                    if (!$scope.model.rx.maximumAdministrationCount) $scope.model.rx.maximumAdministrationCount = $scope.model.parameter.maxFutureAdministrations;
                }
                $scope.numericTextBoxOptions.max = $scope.model.rx.maximumAdministrationCount;
                $scope.model.rx.dosageTypeCode = appSettingsFactory.getDataLookupCodeById($scope.model.rx.dosageTypeId, $scope.model.dosageTypeList);
                $scope.model.rx.frequencyTemplateType = ($scope.model.rx.schedule.frequencyData != null) ? $scope.model.rx.schedule.frequencyData.templateType : 'PRN'; //if frequencyData is null set to PRN
                $scope.model.rx.isAdministrationRealized = rxHelperFactory.isAdministrationRealized($scope.model.rx);

                //pad timestamps array to n elements
                if ($scope.model.rx.schedule.frequencyData != null && angular.isDefined($scope.model.rx.schedule.frequencyData.timestamps)) {
                    //set  arrays
                    setArraySize($scope.model.rx.schedule.frequencyData.timestamps, $scope.model.rx.maximumAdministrationCount - $scope.model.rx.schedule.frequencyData.timestamps.length, null);
               }

                if ($scope.model.rx.schedule.schedulePriorityId == appSettingsFactory.getDataLookupInstanceByCode(appSettingsFactory.rxSchedulePriorityKey.prn, $scope.model.schedulePriorityList).id) $scope.model.rx.schedule.frequencyData = null; // special case clean up frequency data in case of PRN

                //set flowsheet multi select
                $scope.model.selectFlowsheetOptions = {
                    placeholder: $scope.cultureManager.resources.translate("SELECT_ITEMS"),
                    dataTextField: "shortDescription",
                    dataValueField: "id",
                    valuePrimitive: true,
                    autoBind: true,
                    dataSource: $scope.model.flowSheetList,
                    dataBound: onDataBound,
                    enable: !($scope.grant.notAllowedUAdHocPrescription || $scope.isGracePeriodReached())
                };
                $scope.model.rx.doubleCheckDoseStatus = rxHelperFactory.setDoubleCheckDoseStatus($scope.model.rx);
            }

            function initParameter() {
                var deferred = $q.defer();
                //parameter needed to set datetimepicker options, seems that options support only min OR max
                loadParameter().then(function(result) {
                    $scope.model.parameter = new Lgi.Emr.Mar.Dto.parameterDto(result);

                    //check if string is a valid url
                    $scope.isAdvisorProfAvailable = appSettingConstants.regexUrl.test(($scope.model.parameter.advisorProfessionalCalculationIndexUrl != null) ? $scope.model.parameter.advisorProfessionalCalculationIndexUrl:'');
                    $scope.isAdvisorMonographsAvailable = appSettingConstants.regexUrl.test(($scope.model.parameter.advisorMonographUrl != null) ? $scope.model.parameter.advisorMonographUrl.replace("{0}", 'monographNumber') : '');

                    if (!$scope.model.rx.id) {
                        //set to a clean date without milliseconds
                        $scope.model.rx.schedule.startTimestamp = appSettingsFactory.localDateTime(new Date());
                    }
                    var minDate = new Date($scope.model.rx.schedule.startTimestamp);
                    var maxDate = new Date(minDate);
                    maxDate = new Date(maxDate.setTime(maxDate.getTime() + ($scope.model.parameter.adhocPrescriptionsMaxDuration * 60 * 60 * 1000)));
                    if (!$scope.model.rx.id) { //only for new
                        $scope.model.rx.areAdministrationsMustBeSigned = $scope.model.parameter.doubleSignatureAdminAdhocPrescriptions;
                        $scope.model.rx.schedule.stopTimestamp = angular.copy(maxDate);
                    } 
                    //add 1 minute to max end date
                    maxDate.setMinutes(maxDate.getMinutes() + 1);

                    //set date picker option, add a minute to maxdate to avoid conflict with StopTimestamps
                    $scope.dateTimePickerOptions = angular.extend(angular.copy(appSettingsFactory.dateTimePickerOptions), {
                        min:  minDate,
                        max:  maxDate,
                        footer: $filter('translate')('POPUP_DATE_TODAY')
                    });
                    deferred.resolve();
                });
                return deferred.promise;
            }
            
            function newRx() {
                var rx = new Lgi.Emr.Mar.Dto.rxDto();
                rx.schedule.frequencyData = new Lgi.Emr.Mar.Dto.frequencyDataDoseOnly();
                rx.schedule.frequencyData.numberOfDoses = 1; //set number of dose to 1 in case of new rx
                return rx;
            }

            //load RX or create new one 
            function loadRx(id) {
                var deferred = $q.defer();
                if (id) {
                    rxManagementService.getRXS(id)
                        .then(
                            function(scResult) {
                                if (scResult.Result.length > 0) {
                                    deferred.resolve(new Lgi.Emr.Mar.Dto.rxDto(scResult.Result[0]));
                                }
                            },
                            function(scError) {
                                appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), scError.data.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                            }
                        );

                } else {
                    //create new one if no id
                    deferred.resolve(newRx());

                }
                return deferred.promise;
            }

            function setRxObject(rx) {
                if (rx.schedule.dose.amountUnitId == 0) rx.schedule.dose.amountUnitId = null;
                if (!rx.id) rx.schedule.startTimestamp = setDate(rx.schedule.startTimestamp);
                rx.schedule.stopTimestamp = setDate(rx.schedule.stopTimestamp);
                if (rx.schedule.dose.receivedGiveAmountMin != '') rx.schedule.dose.receivedGiveAmountMin = $filter('floatformat')(rx.schedule.dose.receivedGiveAmountMin);
                //set md to null in case of fullName empty
                if (rx.prescription.md != null && rx.prescription.md.fullName == '') rx.prescription.md = null;
                //Posology expression
                if (rx.dosageTypeCode == appSettingsFactory.dosageTypeKey.quantified) {
                    rx.posologyExpression = (rx.schedule.dose.receivedGiveAmountMin != null) ? (rx.schedule.dose.receivedGiveAmountMin + ' ' + appSettingsFactory.getDataLookupShortDescriptionById(rx.schedule.dose.receivedAmountUnitId, $scope.model.amountUnitList)) : '';
                } else {
                    rx.posologyExpression = rx.adhocManualDose;
                }

                // add For x Dose(s) or For Prn to posology Expression
                if (rx.schedule.frequencyData != null) {
                    if (rx.frequencyTemplateType == appSettingsFactory.rxScheduleTemplateTypeKey.doseonly && rx.schedule.frequencyData.numberOfDoses) {
                        var forDose = $filter('translate')('FOR_DOSES');
                        forDose = forDose.replace('^?', rx.schedule.frequencyData.numberOfDoses.toString());
                        rx.posologyExpression += ' ' + forDose + ((rx.schedule.frequencyData.numberOfDoses > 1) ? 's' : '');
                    } else if (rx.frequencyTemplateType == appSettingsFactory.rxSchedulePriorityKey.prn) {
                        rx.posologyExpression += ' ' + $filter('translate')('PRN');
                    }
                }

                //clean-up date (convert string to date)
                if (angular.isDefined(rx.schedule.frequencyData) && rx.schedule.frequencyData != null && angular.isDefined(rx.schedule.frequencyData.timestamps) ) {
                    for (var i = 0; i < rx.schedule.frequencyData.timestamps.length; i++) {
                            rx.schedule.frequencyData.timestamps[i] = setDate(rx.schedule.frequencyData.timestamps[i]);
                    }
                    //set stopTimestamp to highest date of timestamps
                    var newStopTimestampDate = Enumerable.From(rx.schedule.frequencyData.timestamps).OrderByDescending(function(i) { return i; }).FirstOrDefault();
                    if (newStopTimestampDate != null) rx.schedule.stopTimestamp = newStopTimestampDate;
                }
                //save back metaWorkflows
                $scope.model.rx.metaWorkflows = Enumerable.From($scope.model.rx.metaWorkflowsIds).Select(function (item) { return new Lgi.Emr.Mar.Dto.workflowMetaInfoDto({id:item, isInUse:true}); }).ToArray();
            }

            function loadParameter() {
                var deffered = $q.defer();
                parameterService.get().then(function(scResult) {
                    deffered.resolve(scResult);
                });
                return deffered.promise;
            }

            function currentDosageType() {
                return (angular.isDefined($scope.model.rx) && $scope.model.rx != null && angular.isDefined($scope.model.dosageTypeList) && $scope.model.dosageTypeList.length > 0) ? appSettingsFactory.getDataLookupInstanceById($scope.model.rx.dosageTypeId, $scope.model.dosageTypeList) : null;
            }

            function currentStatus() {
                return (angular.isDefined($scope.model.rx) && $scope.model.rx != null && angular.isDefined($scope.model.rxStatusList) && $scope.model.rxStatusList.length > 0) ? appSettingsFactory.getDataLookupInstanceById($scope.model.rx.rxStatusId, $scope.model.rxStatusList) : null;
            }

            function setArraySize(array, n, deFaultValue) {
                //add n element to array with default value
                for (var i = 0; i < n; i++) {
                    array.push(deFaultValue);
                }
            }

            function setDate(strDate) {
                if (angular.isString(strDate)) {
                    return appSettingsFactory.stringToDate(strDate);
                } else {
                    return strDate;
                }
            }
            //utility for sorting diacritical
            function normalizedName (str) {
                if (angular.isString(str)) {
                    return utlString.normalize(str);
                } else {
                    return str;
                }
            };
            function getSeverityValue(value) {
                switch(value) {
                    case 1:
                        return $filter('translate')('SEVERITY_SEVERE');
                    case 2:
                        return $filter('translate')('SEVERITY_SERIOUS');
                    case 3:
                        return $filter('translate')('SEVERITY_MODERATE');
                    case 4:
                        return $filter('translate')('SEVERITY_INFORMATION');
                    default:
                        //nothing
                        return '';
                }
            };
            function onChangeFrequencyTemplateType(frequencyTemplateType) {
                switch (frequencyTemplateType) {
                    case appSettingsFactory.rxScheduleTemplateTypeKey.doseonly:
                        $scope.model.rx.schedule.frequencyData = new Lgi.Emr.Mar.Dto.frequencyDataDoseOnly();
                        $scope.model.rx.schedule.frequencyData.numberOfDoses = 1;
                        $scope.model.rx.schedule.schedulePriorityId = appSettingsFactory.getDataLookupInstanceByCode(appSettingsFactory.rxSchedulePriorityKey.regular, $scope.model.schedulePriorityList).id; // R
                        break;
                    case appSettingsFactory.rxScheduleTemplateTypeKey.listoftimestamps:
                        $scope.model.rx.schedule.frequencyData = new Lgi.Emr.Mar.Dto.frequencyDataListOfTimestamps();
                        $scope.model.rx.timestampsUTC = [];
                        setArraySize($scope.model.rx.schedule.frequencyData.timestamps, $scope.model.rx.maximumAdministrationCount - $scope.model.rx.schedule.frequencyData.timestamps.length, null);
             
                        $scope.model.rx.schedule.schedulePriorityId = appSettingsFactory.getDataLookupInstanceByCode(appSettingsFactory.rxSchedulePriorityKey.regular, $scope.model.schedulePriorityList).id; // R
                        break;
                    case 'PRN': //Special case PRN
                        $scope.model.rx.schedule.frequencyData = null;
                        $scope.model.rx.schedule.schedulePriorityId = appSettingsFactory.getDataLookupInstanceByCode(appSettingsFactory.rxSchedulePriorityKey.prn, $scope.model.schedulePriorityList).id; // PRN
                        break;
                    default:
                        $scope.model.rx.schedule.frequencyData = null;
                        $scope.model.rx.schedule.schedulePriorityId = appSettingsFactory.getDataLookupInstanceByCode(appSettingsFactory.rxSchedulePriorityKey.regular, $scope.model.schedulePriorityList).id;  // CONTINUE
                        break;
                }
            };
           
            function loadPermissions() {
                $scope.grant = {
                    notAllowedSignAdHocPrescription: changeNotAllowed($scope.permission.marRolesList.MAR_DA_SignAdHocPrescription),
                    notAllowedUStopAdHocPrescription: changeNotAllowed($scope.permission.marRolesList.MAR_DA_UStopAdHocPrescription),
                    notAllowedAdHocPrescriptionAddDose: changeNotAllowed($scope.permission.marRolesList.MAR_DA_AdHocPrescriptionAddDose),
                    notAllowedUAdHocPrescription: changeNotAllowed($scope.permission.marRolesList.MAR_DA_UAdHocPrescription),
                    notAllowedPrescriptionHistory: changeNotAllowed($scope.permission.marRolesList.MAR_DA_PrescriptionHistory),
                    notAllowedUFrequency: changeNotAllowed($scope.permission.marRolesList.MAR_DA_UFrequency),
                    notAllowedUAssociatedData: changeNotAllowed($scope.permission.marRolesList.MAR_DA_UAssociatedData),
                    notAllowedUNursingDirectives: changeNotAllowed($scope.permission.marRolesList.MAR_DA_UNursingDirectives),
                    notAllowedUDoubleSignature: changeNotAllowed($scope.permission.marRolesList.MAR_DA_UDoubleSignature),
                    notAllowedUNote: changeNotAllowed($scope.permission.marRolesList.MAR_DA_UNote),
                    notAllowedUDoseDblChk: changeNotAllowed($scope.permission.marRolesList.MAR_DA_UDoseDblChk),
                    notAllowedUIndicatorDoseDblChk: changeNotAllowed($scope.permission.marRolesList.MAR_DA_UIndicatorDoseDblChk)
                }
            }
            // generic permission checker,  pass : Ex: $scope.permission.marRolesList.MAR_DA_UFrequency
            function changeNotAllowed (role) {
                return permissionsHelperFactory.isNotAllowed(role, $scope.permission.securityContext.mar);
            };

            function areAdministrationsMustBeSigned() {
                var isClassTherapeuticDoubleSign = $scope.isClassTherapeuticDoubleSign($scope.model.rx, $scope.model.mxClassList);
                return (isClassTherapeuticDoubleSign) ? isClassTherapeuticDoubleSign : $scope.model.parameter.doubleSignatureAdminAdhocPrescriptions;

            }

            // startProcessing item
            function startProcessing(items) {
                var deferred = $q.defer();
                if ($scope.editRxAdhocForm.$valid) {
                    rxManagementService.startProcessing(items)
                        .then(
                            function (scResult) {
                                //nothing to refresh
                                $scope.editRxAdhocForm.$setPristine();
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
            var pageChanged = function()  {
                return $scope.editRxAdhocForm.$dirty;
            };

            function setMetaWorkflowsIds() {
                $scope.model.rx.metaWorkflowsIds = Enumerable.From($scope.model.rx.metaWorkflows).Select(function (item) { return item.id; }).ToArray();
                $scope.model.oldMetaWorkflowsIds = angular.copy(Enumerable.From($scope.model.rx.metaWorkflows).Select(function (i) { return i.id; }).ToArray());
            }


        }
    ]);

