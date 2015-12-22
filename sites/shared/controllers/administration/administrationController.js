'use strict';
angular
    .module('app')
    .filter('appendStr', function () {
        return function (value, str) {
            var out = value;
            if (angular.isDefined(value) && value !== null /*&& angular.isString(value) && value.length > 0*/) {
                if (angular.isDefined(str) && str !== null /*&& angular.isString(str) && str.length > 0*/)
                    out += str;
            }
            return out;
        }
    })
    .filter('prependStr', function () {
        return function (value, str) {
            var out = value;
            if (angular.isDefined(value) && value !== null /*&& angular.isString(value) && value.length > 0*/) {
                if (angular.isDefined(str) && str !== null /*&& angular.isString(str) && str.length > 0*/)
                    out = (str + out);
            }
            return out;
        }
    })
    .directive('ctlElastic', [
    '$timeout',
    function($timeout) {
        return {
            restrict: 'A',
            link: function($scope, element) {
                var resize = function () {
                    var textField = element[0];
                    element[0].rows = 1;
                    if (textField.clientHeight < textField.scrollHeight) {
                        element[0].rows++;
                    } 
                };
                element.on("keyup change blur focus", resize);
                $timeout(resize, 0);
            }
        };
    }
    ])
    .controller('administrationController',
    [
        '$filter', '$location', '$log', '$modal', '$q', '$rootScope', '$scope', '$timeout', '$window',
        'administrationService', 'administrationValidator', 'appSettingConstants', 'appSettingsFactory', 'authService', 'entrepriseServices', 'locationService', 'observationFactory',
        'parameterService', 'patientService', 'permissionsHelperFactory', 'rxHelperFactory', 'rxManagementService', 'utlString', 'workflowFactory', 'workflowService',
        function ($filter, $location, $log, $modal, $q, $rootScope, $scope, $timeout, $window,
            administrationService, administrationValidator, appSettingConstants, appSettingsFactory, authService, entrepriseServices, locationService, observationFactory,
            parameterService, patientService, permissionsHelperFactory, rxHelperFactory, rxManagementService, StringUtils, workflowFactory, workflowService) {

            var isSaveFromLogoutEvent = false;
            $scope.isLoadingBody = true;

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
                    $scope.administrationPageForm.$setPristine();
                }
            });
            $scope.$on('logoutEvent', function () {
                if ($scope.helpers.utils.isPageChange()) {
                    isSaveFromLogoutEvent = true;
                    $scope.$broadcast('triggerDirtyCheck');
                }
                else appSettingsFactory.logoutAndRedirectToDefault();
            });

            $scope.onSave = function () {
                var deferred = $q.defer();
                $scope.helpers.eventHandlers.onSave($scope.model.selectedAdministration, $scope.model.selectedRx, false, true).then(function(validate) {
                    if (validate.success === true) {
                        if ($scope.helpers.uiState.workflows.showFlowsheets() && angular.isDefined($scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm']))
                            $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$setPristine();
                        $scope.administrationPageForm.$setPristine();
                        deferred.resolve();
                        //check if save origin is logout event
                        if (isSaveFromLogoutEvent) appSettingsFactory.logoutAndRedirectToDefault();
                    }
                    else {
                        deferred.reject();
                        //check if save origin is logout event
                        if (isSaveFromLogoutEvent) appSettingsFactory.logoutAndRedirectToDefault();
                    }
                });
               
                return deferred.promise;
            };

            $scope.resetData = function () {
                var target = Enumerable.From($scope.model.administrations).Where(function (i) { return i.id == $scope.model.selectedAdministration.id; }).First();;
                var index = $scope.model.administrations.indexOf(target);
                if (index > -1) {
                    $scope.model.administrations[index] = $scope.model.selectedAdministration = angular.copy($scope.model.selectedAdministrationBkp);
                }

                // we have to do the same thing for rx
                if (angular.isDefined($scope.model.rxs) && $scope.model.rxs.length > 0) {
                    var targets = Enumerable.From($scope.model.rxs[0].administrations).Where(function(i) { return i.id == $scope.model.selectedAdministration.id; });
                    if (targets.Any())
                    {
                        target = targets.First();
                        index = $scope.model.rxs[0].administrations.indexOf(target);
                        if (index > -1) {
                            $scope.model.rxs[0].administrations[index] = angular.copy($scope.model.selectedAdministrationBkp);
                        }
                    }
                }

                $scope.helpers.eventHandlers.onSelectAdministration($scope.model.selectedAdministration);
                if ($scope.helpers.uiState.workflows.showFlowsheets() && angular.isDefined($scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm']))
                    $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$setPristine();
                $scope.administrationPageForm.$setPristine();
                if (isSaveFromLogoutEvent) appSettingsFactory.logoutAndRedirectToDefault();
            };

            $scope.helpers = {
                data: {
                    triggerClickCount: 0,
                    isRxIncomplete: function(rx) {
                        if (angular.isDefined(rx.isIncomplete) && rx.isIncomplete == true)
                            return true;
                        return false;
                    },
                    mealPercOptions: {
                        dataTextField: 'text',
                        dataValueField: 'value',
                        dataSource: {
                            data: [
                                { value: "0", text: "0" },
                                { value: "0-49", text: "0-49" },
                                { value: "50-100", text: "50-100" }
                            ]
                        }
                    },
                    yesNo: [
                        { code: 'YES', value: true },
                        { code: 'NO', value: false }
                    ],
                    now: function() {
                        return new Date();
                    },
                    applicationSites: function() {
                        if (angular.isUndefined($scope.model.applicationSites)) {
                            var dataArr = [];
                            angular.forEach(appSettingsFactory.getApplicationLocations(), function(applicationLocation) {
                                dataArr.push({
                                    value: applicationLocation.token,
                                    text: $scope.cultureManager.resources.translate(applicationLocation.token)
                                })
                            });
                            $scope.model.applicationSites = {
                                dataTextField: 'text',
                                dataValueField: 'value',
                                dataSource: {
                                    data: dataArr
                                }
                            };
                        }

                        return $scope.model.applicationSites;
                    },
                    bolusValues: appSettingsFactory.getBolusValues(),
                    dateTimeFormat: appSettingConstants.datetimePickerFormat,
                    getAdministrationPlannedDatetime: function (rx) {
                        if (angular.isUndefined(rx))
                            return '';
                        var administration = $scope.helpers.utils.getAssociatedAdministration(rx);
                           
                        var res = '';
                        if (angular.isDefined(administration) && angular.isDefined(administration.plannedDateTime)) {
                            res = $filter('shorttimeutc')(administration.plannedDateTime, 'HH:mm');
                        }
                        return res;
                    },
                    getCurrentAdministrationStatus: function() {
                        return ($scope.model.selectedAdministration.administrationStatusId !== null
                            ? appSettingsFactory.getDataLookupInstanceById($scope.model.selectedAdministration.administrationStatusId, $scope.model.administrationStatusList)
                            : null);
                    },
                    getCurrentAdministrationStatusFronBkp: function () {

                        return (angular.isDefined($scope.model.selectedAdministrationBkp) && $scope.model.selectedAdministrationBkp.administrationStatusId !== null
                            ? appSettingsFactory.getDataLookupInstanceById($scope.model.selectedAdministrationBkp.administrationStatusId, $scope.model.administrationStatusList)
                            : null);
                    },
                    getAdministrationStatuses: function() {
                        var res = [];
                        var targetCodes = [];
                        // If current rx status is created, add the status to top of list
                        var administrationStatus = $scope.helpers.data.getCurrentAdministrationStatus();
                        if (administrationStatus == null)
                            administrationStatus = $scope.helpers.data.getCurrentAdministrationStatusFronBkp();
                        if (!$scope.states.prepare) {

                            if (!$scope.states.toSignOnly || (administrationStatus != null && administrationStatus.code !== 'PREPARED')) {
                                targetCodes = ['COMPLETE', 'NOTGIVEN', 'PARTIAL'];
                                if ($scope.helpers.uiState.detail.isContinuousDosageType())
                                    if ($scope.helpers.utils.administrationIsStatusPreparedByAdministration($scope.model.selectedAdministration))
                                        targetCodes = ['PROGRESS'];
                                    else
                                        targetCodes = ['COMPLETE', 'PAUSED', 'PROGRESS'];

                                if (administrationStatus == null || 'CREATED' === administrationStatus.code)
                                    targetCodes.unshift('CREATED');
                            }

                            if (administrationStatus != null && administrationStatus.code === 'PREPARED')
                                targetCodes.unshift('PREPARED');
                        } else {
                            
                            if (administrationStatus == null || 'CREATED' === administrationStatus.code)
                                targetCodes.unshift('CREATED');

                            targetCodes.unshift('PREPARED');
                        }
                        angular.forEach($scope.model.administrationStatusList, function(status) {
                            angular.forEach(targetCodes, function(code) {
                                if (code == status.code)
                                    res.push(status);
                            });
                        });
                        return res;
                    },
                    getMxDesc: function() {
                        if (angular.isDefined($scope.model.selectedRx) && angular.isDefined($scope.model.selectedRx.mx))
                            return $scope.model.selectedRx.mx.description;
                        return '';
                    },
                    getMxFreq: function(obj) {
                        var res = '';
                        if (angular.isDefined(obj) && obj !== null && angular.isDefined(obj.administeredDose) && obj.administeredDose !== null
                            && angular.isDefined(obj.administeredDose.prescribedDose) && obj.administeredDose.prescribedDose !== null) {
                            if (angular.isDefined(obj.administeredDose.prescribedDose.giveDoseMin) && obj.administeredDose.prescribedDose.giveDoseMin !== null) {
                                res += obj.administeredDose.prescribedDose.giveDoseMin + ' ';
                                res += $scope.helpers.utils.getDataLookupShortDesc(obj.administeredDose.prescribedDose.strengthUnitId, $scope.model.strengthUnitList);
                            }
                            if (angular.isDefined(obj.administeredDose.prescribedDose.giveAmountMin) && obj.administeredDose.prescribedDose.giveAmountMin !== null) {
                                res += ' (';
                                res += obj.administeredDose.prescribedDose.giveAmountMin;
                                res += ' ';
                                res += $scope.helpers.utils.getDataLookupShortDesc(obj.administeredDose.prescribedDose.amountUnitId, $scope.model.amountUnitList);
                                res += ')';
                            }
                        }
                        return res;
                    },
                    getRouteDesc: function() {
                        var res = '';
                        if (angular.isDefined($scope.model.selectedRx)) {
                            res += $scope.helpers.utils.getDataLookupShortDesc($scope.model.selectedRx.routeId, $scope.model.routeList);
                        }
                        return res;
                    },
                    getStrengthUnitList: function () {
                        if (angular.isUndefined($scope.model.selectedAdministration.administeredDose) || $scope.model.selectedAdministration.administeredDose === null)
                            return null;
                        return Enumerable.From($scope.model.strengthUnitList).Where(function (i) { return i.id == $scope.model.selectedAdministration.administeredDose.strengthUnitId || i.isAvailableForInput; }).ToArray();
                    },
                    getAmountUnitList: function () {
                        if (angular.isUndefined($scope.model.selectedAdministration.administeredDose) || $scope.model.selectedAdministration.administeredDose === null)
                            return null;
                        return Enumerable.From($scope.model.amountUnitList).Where(function (i) { return i.id == $scope.model.selectedAdministration.administeredDose.amountUnitId || i.isAvailableForInput; }).ToArray();
                    },
                    administrationsCount: function() {
                        if (angular.isDefined($scope.model) && angular.isDefined($scope.model.rxOriginal) && angular.isDefined($scope.model.rxOriginal.administrations)) {
                            if ($scope.states.toSignOnly)
                                return $scope.model.rxOriginal.administrationsToSign;
                            else
                                return $scope.model.rxOriginal.administrationsCount;
                        } else
                            return 0;
                    },
                    workflows: {
                        getTabLabel: function(workflowCode) {
                            var res = workflowFactory.getWorkflowDesc(workflowCode);
                            var count = $scope.helpers.data.workflows.workflowCount(workflowCode);
                            if (count > 0)
                                res += (' (' + count + ')');
                            return res;
                        },
                        workflowCount: function(workflowCode) {
                            var count = 0;
                            angular.forEach($scope.model.selectedAdministration.workflowObjects, function(obj) {
                                if (obj.code === workflowCode) {
                                    angular.forEach(obj.workflows, function(workflowInstance) {
                                        if (workflowInstance.isSaved())
                                            count++;
                                    });
                                }
                            });
                            return count;
                        },
                        workflowIndex: function() {
                            var res = 0;
                            if ($scope.helpers.data.workflows.workflowCount($scope.model.currentWorkflow.code) > 0)
                                res = $scope.model.currentWorkflowInstanceIndex + 1;
                            return res;
                        },
                        getHistoricWorkflows: function(workflow) {
                            var res;
                            if (workflowFactory.workflows.ANTICOAG === workflow)
                                res = $scope.model.historicWorkflows.anticoag;
                            else if (workflowFactory.workflows.DIABETES === workflow)
                                res = $scope.model.historicWorkflows.diabetes;
                            else if (workflowFactory.workflows.PAIN === workflow)
                                res = $scope.model.historicWorkflows.pain;
                            else if (workflowFactory.workflows.VITALS === workflow)
                                res = $scope.model.historicWorkflows.vitals;
                            else
                                throw new Error('Invalid workflow [' + workflow + ']');
                            return res;
                        },
                        getAxaAdvReacListDesc: function() {
                            var res = [];
                            if (angular.isUndefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex])
                                || angular.isUndefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].axaAdvReac)
                                || angular.isUndefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].axaAdvReac.list)
                                || $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].axaAdvReac.list.length == 0)
                                return res;
                            angular.forEach($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].axaAdvReac.list, function(axaAdvReac) {
                                angular.forEach($scope.model.axaAdvReacList, function(listObj) {
                                    if (listObj.code === axaAdvReac.data) {
                                        res.push(listObj);
                                    }
                                });
                            });
                            return res;
                        },
                        getGlyAdvReacListDesc: function() {
                            var res = [];
                            if (angular.isUndefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex])
                                || angular.isUndefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].glyAdvReac)
                                || angular.isUndefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].glyAdvReac.list)
                                || $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].glyAdvReac.list.length == 0)
                                return res;
                            angular.forEach($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].glyAdvReac.list, function(glyAdvReac) {
                                angular.forEach($scope.model.glyAdvReacList, function(listObj) {
                                    if (listObj.code === glyAdvReac.data) {
                                        res.push(listObj);
                                    }
                                });
                            });
                            return res;
                        },
                        getRDesc: function() {
                            var res = [];
                            if (angular.isUndefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex])
                                || angular.isUndefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].rr.rDesc)
                                || angular.isUndefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].rr.rDesc.list)
                                || $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].rr.rDesc.list.length == 0)
                                return res;
                            angular.forEach($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].rr.rDesc.list, function(rDesc) {
                                angular.forEach(observationFactory.rDescriptions, function(listObj) {
                                    if (listObj === rDesc || listObj === rDesc.data) {
                                        res.push(listObj);
                                    }
                                });
                            });
                            return res;
                        },
                        isCurrentWorkflowCancelled: function() {
                            return angular.isDefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex])
                                && $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].isCancelled == true;
                        },
                        getCurrentWorkflowCancellationReason: function() {
                            if (angular.isDefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex])
                                && $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].isCancelled == true) {

                                return $scope.helpers.utils.getDataLookupShortDesc($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].cancellationReasonId, $scope.model.cancellationReasonList);
                            }
                            return "";
                        }
                    },
                    numberOfPages: function() {
                        var mod = parseInt(($scope.helpers.data.administrationsCount() % 8), 10);
                        var res = parseInt(($scope.helpers.data.administrationsCount() / 8), 10);
                        if (mod > 0)
                            res += 1;
                        return res;
                    },
                    getDoseLabel: function(administration) {
                        var admCopy = angular.copy(administration);
                        var res = '';
                        if (angular.isDefined(admCopy.administeredDose.dispensedDose) && admCopy.administeredDose.dispensedDose !== null) {
                            res += admCopy.administeredDose.dispensedDose;
                            res += ' ';
                            res += $scope.helpers.utils.getDataLookupShortDesc(admCopy.administeredDose.strengthUnitId, $scope.model.strengthUnitList);
                        }

                        if (angular.isDefined(admCopy.administeredDose.dispensedAmount) && admCopy.administeredDose.dispensedAmount !== null) {
                            var toAppend = '';
                            if (res != '') {
                                res += ' (';
                                toAppend += ')';
                            }

                            res += admCopy.administeredDose.dispensedAmount;
                            res += ' ';
                            res += $scope.helpers.utils.getDataLookupShortDesc(admCopy.administeredDose.amountUnitId, $scope.model.amountUnitList);
                            res += toAppend;
                        }
                        return res;
                    }
                },
                eventHandlers: {
                    workflows: {
                        onToggleFlowsheetMode: function(newState) {
                            $scope.model.currentWorkflowInstanceIndex = 0;
                            $scope.states.workflowListMode = newState;
                            if (!$scope.states.workflowListMode) {
                                if ($scope.model.currentWorkflows.length > 0) {
                                    $scope.model.pristineWorkflow = angular.copy($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex]);
                                }
                            }
                        },
                        onImportWorkflowInstance: function () {
                            var scope = $rootScope.$new();
                            scope.pid = sessionStorage.getItem(appSettingConstants.selectedPatientKey);
                            scope.mode = "IMPORT";
                            scope.currentWorkflow = $scope.model.currentWorkflow;
                            scope.canSave = true;
                            
                            scope.axaAdvReacList = $scope.model.axaAdvReacList;
                            scope.glyAdvReacList = $scope.model.glyAdvReacList;

                           var modalInstance = $modal.open({
                                templateUrl: locationService.shared.views + "administration/workflowImport.html",
                                controller: 'workflowImportController',
                                windowClass: 'workflow-import-modal-window',
                                scope: scope,
                                backdrop: 'static',
                                keyboard: false
                            });

                           var onConfirm = function (result) {

                               // Update observations of the current workflow
                               var currentFlow = $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex];
                               currentFlow.observations = result;
                               currentFlow.startDateTime = currentFlow.dateTime;
                               currentFlow.fromWorkflowInstance(currentFlow);

                               $scope.administrationPageForm.$setDirty();
                               $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$setDirty();

                               $timeout(function () {
                                       var flowsheetForm = $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'];
                                       angular.forEach(flowsheetForm.$error.max, function (error) {
                                           var inputs = document.getElementsByName(error.$name);
                                           if (angular.isDefined(inputs[0])) {
                                               var input = inputs[0];
                                            
                                               var mininvalid = (input.min && !isNaN(input.min) && parseFloat(error.$viewValue) < parseFloat(input.min));
                                               var maxinvalid = (input.max && !isNaN(input.max) && parseFloat(error.$viewValue) > parseFloat(input.max));

                                               error.$setValidity("min", !mininvalid);
                                               error.$setValidity("max", !maxinvalid);
                                               error.$render();
                                           }
                                       });
                                   }, 100, false
                                );
                            };
                            modalInstance.result.then(function(result) {
                                if (angular.isDefined(result) && result !== null)
                                    onConfirm(result);
                            });
  
                        },
                        onEditWorkflowInstance: function () {
                            var scope = $rootScope.$new();
                            scope.pid = sessionStorage.getItem(appSettingConstants.selectedPatientKey);
                            scope.mode = "EDIT";
                            scope.currentWorkflow = $scope.model.currentWorkflow;
                            scope.canSave = !$scope.helpers.uiState.workflows.isCancelWorkflowInstanceDisabled();

                            scope.axaAdvReacList = $scope.model.axaAdvReacList;
                            scope.glyAdvReacList = $scope.model.glyAdvReacList;
                            scope.rDescList = $scope.helpers.utils.observationFactory.rDescriptionsList;

                            var currentFlow = $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex];
                            currentFlow.startDateTime = currentFlow.dateTime;
                            scope.currentWorkflowInstance = currentFlow.toWorkflowInstance();
                            //scope.currentWorkflowInstance = currentFlow;
                            var modalInstance = $modal.open({
                                templateUrl: locationService.shared.views + "administration/workflowImport.html",
                                controller: 'workflowImportController',
                                windowClass: 'workflow-import-modal-window',
                                scope: scope,
                                backdrop: 'static',
                                keyboard: false
                            });

                            var onConfirm = function (result) {

                                // Update observations of the current workflow
                                var currentWFlow = $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex];
                                currentWFlow.observations = result;
                                currentWFlow.startDateTime = currentWFlow.dateTime;

                                var newWorkflow = workflowFactory.newWorkflowInstance($scope.model.currentWorkflow);
                                newWorkflow.fromWorkflowInstance(currentWFlow);
                                $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex] = newWorkflow;
                                $scope.administrationPageForm.$setDirty();
                                $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$setDirty();

                                //$scope.helpers.eventHandlers.workflows.onSaveWorkflowInstance();
                                $scope.helpers.uiState.actionButtons.updateKendoInputs();
                            };
                            modalInstance.result.then(function(result) {
                                if (angular.isDefined(result) && result !== null)
                                    onConfirm(result);
                            });
  
                        },
                        onWorkflowTabClick: function(workflow) {
                            $scope.model.currentWorkflow = workflow;
                            $scope.model.currentWorkflowInstanceIndex = 0;
                            var target = $scope.helpers.utils.getWorkflowObjects(workflow);
                            if (angular.isDefined(target) && angular.isDefined(target.workflows)) {
                                $scope.model.currentWorkflows = target.workflows;
                                $scope.model.currentWorkflowItem = angular.copy(target.workflows[0]);
                            }

                            // if there are no historic flowsheets, or if in completed administrations list mode, force switch to detail mode
                            if ($scope.states.listMode) {
                                if (angular.isDefined($scope.model.currentWorkflows) && $scope.model.currentWorkflows.length > 0)
                                    $scope.helpers.eventHandlers.workflows.onToggleFlowsheetMode(false);
                                else
                                    $scope.helpers.eventHandlers.workflows.onToggleFlowsheetMode(true);
                            } else {
                                var historicWorkflows = $scope.helpers.data.workflows.getHistoricWorkflows(workflow);
                                if ((angular.isDefined(historicWorkflows) && historicWorkflows.length == 0) || (angular.isDefined($scope.model.currentWorkflows) && $scope.model.currentWorkflows.length > 0))
                                    $scope.helpers.eventHandlers.workflows.onToggleFlowsheetMode(false);
                                else
                                    $scope.helpers.eventHandlers.workflows.onToggleFlowsheetMode(true);
                            }
                        },
                        onPreviousWorkflowInstance: function() {
                            $scope.model.currentWorkflowInstanceIndex--;
                            if ($scope.model.currentWorkflowInstanceIndex < 0)
                                $scope.model.currentWorkflowInstanceIndex = 0;
                            $scope.model.pristineWorkflow = angular.copy($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex]);
                            $scope.model.currentWorkflowItem = angular.copy($scope.model.pristineWorkflow);
                        },
                        onNextWorkflowInstance: function() {
                            $scope.model.currentWorkflowInstanceIndex++;
                            if ($scope.model.currentWorkflowInstanceIndex > ($scope.model.currentWorkflows.length - 1))
                                $scope.model.currentWorkflowInstanceIndex = ($scope.model.currentWorkflows.length - 1);
                            $scope.model.pristineWorkflow = angular.copy($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex]);
                            $scope.model.currentWorkflowItem = angular.copy($scope.model.pristineWorkflow);
                        },
                        onNewWorkflowInstance: function() {
                            // get pointer to target workflow collection corresponding to currently selected workflow tab
                            var target = $scope.helpers.utils.getWorkflowObjects($scope.model.currentWorkflow);
                            if (angular.isDefined(target)) {
                                // instanciate a new workflow instance
                                var aWorkflow = workflowFactory.newWorkflowInstance($scope.model.currentWorkflow);
                                // add new instance to target workflow collection
                                target.workflows.unshift(aWorkflow);
                                // navigate to first item in collection
                                $scope.model.currentWorkflowInstanceIndex = 0;

                                $scope.model.currentWorkflowItem = angular.copy(aWorkflow);

                                $timeout(function() {
                                    // make form saveable
                                    if (angular.isDefined($scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'])) {
                                        $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$pristine = false;
                                        // $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$setDirty();
                                    }

                                }, 0, false);

                            }

                            // in all cases, clicking "new workflow" button clears the pristine workflow copy
                            $scope.model.pristineWorkflow = undefined;

                            // force detail mode
                            $scope.states.workflowListMode = false;
                        },
                        onRemoveWorkflowInstance: function() {

                            var target = $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex];
                            if (angular.isDefined(target.id)) {
                                var modalInstance = $modal.open({
                                    templateUrl: locationService.shared.views + "administration/workflowCancellation.html",
                                    controller: 'workflowCancellationController',
                                    windowClass: 'modal-window-small',
                                    backdrop: 'static',
                                    keyboard: false
                                });

                                var onConfirm = function(reasonId) {
                                    $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].isCancelled = true;
                                    $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].cancellationReasonId = reasonId;
                                    
                                    $scope.administrationPageForm.$setDirty();
                                };
                                modalInstance.result.then(function(result) {
                                    if (angular.isDefined(result) && result !== null && angular.isDefined(result.reasonId) && result.reasonId !== null)
                                        onConfirm(result.reasonId);
                                });
                            } else {
                                appSettingsFactory.displayConfirmation(
                                    $scope.cultureManager.resources.translate('CONFIRMATION'),
                                    $scope.cultureManager.resources.translate('CONFIRM_DELETE_WORKFLOW'),
                                    $scope.cultureManager.resources.translate('YES'),
                                    $scope.cultureManager.resources.translate('NO'),
                                    undefined,
                                    function() {
                                        $scope.model.currentWorkflows.splice($scope.model.currentWorkflowInstanceIndex, 1);
                                        $scope.model.currentWorkflowInstanceIndex = 0;

                                        $scope.administrationPageForm.$setDirty();

                                        // if there is at least one remaining newly created workflow, keep pristine copy
                                        if (angular.isDefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex]))
                                            $scope.model.pristineWorkflow = angular.copy($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex]);
                                        else
                                        // ... otherwise return to list mode
                                            $scope.helpers.eventHandlers.workflows.onToggleFlowsheetMode(true);

                                        // reset to pristine 
                                        $scope.helpers.eventHandlers.workflows.resetFlowsheet();
                                    },
                                    undefined);
                            }
                        },
                        isSaveWorkFlowValid: function () {
                            if (!(($scope.helpers.uiState.workflows.isWorkflowFormDisabled()
                                || ($scope.helpers.uiState.workflows.isCancelWorkflowInstanceDisabled() && $scope.helpers.uiState.workflows.isRemoveWorkflowInstanceDisabled())
                                || $scope.helpers.utils.isGracePeriodReached())
                                || ($scope.helpers.utils.changeNotAllowed($scope.permission.marRolesList.MAR_DA_UFlowsheet) && !$scope.helpers.uiState.workflows.isNewWorkflowInstanceDisabled())
                                || !$scope.model.selectedRx.isProcessed
                                || $scope.helpers.utils.isAdministrationCancelled()))
                            {
                                if (angular.isDefined($scope.model.currentWorkflowInstanceIndex) && angular.isDefined($scope.model.currentWorkflows) && $scope.model.currentWorkflows.length > 0 &&
                                    !$scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].isComplete()) {
                                    angular.forEach($scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$error.required, function (error) {
                                        if (angular.isDefined(error.$setViewValue)) {
                                            error.$setViewValue(error.$viewValue);
                                            error.$render();
                                        }
                                    });
                                    appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('FLOWSHEET_INVALID'), $scope.cultureManager.resources.translate('CLOSE'));
                                    return false;
                                }
                            }
                            return true;
                        },
                        isCurrentWorkflowDirty: function () {
                            if (angular.isDefined($scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm']) &&
                                angular.isDefined($scope.model.currentWorkflow))
                                return $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$dirty;
                            else
                                return false;
                        },
                        onSaveWorkflowInstance: function () {

                            // Validation in workflowFactory
                            if (!$scope.helpers.eventHandlers.workflows.isSaveWorkFlowValid())
                                return;

                            // The date must be inferior to now
                            var now = new Date();
                            var nowFormatted = $filter('date')(now, appSettingsFactory.dateTimePickerOptions.format);

                            // Convert date workflow
                            var dateTime = $filter('date')($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].dateTime, appSettingsFactory.dateTimePickerOptions.format);

                            if (dateTime > nowFormatted) {
                                appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('DATE_FLOWSHEET_GREATER_THAN_NOW'), $scope.cultureManager.resources.translate('CLOSE'));
                                return;
                            }

                            // mark workflow instance as saved
                            $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].save();
                            // keep pristine copy
                            $scope.model.pristineWorkflow = angular.copy($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex]);
                            // mark form as pristine
                            $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$setPristine();
                        },
                        onCancelWorkflowInstance: function() {
                            // TODO: get user confirmation ?

                            // in the case we have a pristine workflow copy (edit mode), restore it
                            if (angular.isDefined($scope.model.pristineWorkflow)) {
                                $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex] = angular.copy($scope.model.pristineWorkflow);
                            }
                            // otherwise we are in create mode - cancel current workflow creation
                            else {
                                $scope.model.currentWorkflows.splice($scope.model.currentWorkflowInstanceIndex, 1);

                                // ... and keep pristine workflow copy of next instance in array, if any
                                if (angular.isDefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex])) {
                                    $scope.model.pristineWorkflow = angular.copy($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex]);
                                } else {
                                    // ... otherwise return to list mode 
                                    var listHistWork = $scope.helpers.data.workflows.getHistoricWorkflows($scope.model.currentWorkflow);
                                    if (($scope.model.currentWorkflows.length == 0 && listHistWork.length != 0) || $scope.states.listMode) {
                                        $scope.helpers.eventHandlers.workflows.onToggleFlowsheetMode(true);
                                    }
                                }
                            }
                            $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$setPristine();
                        },
                        resetFlowsheet: function() {
                            // TODO :find a better way to do this
                            if (angular.isDefined($scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'])) {
                                setTimeout(function () {
                                    $scope.$apply(function () {
                                        $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$setPristine();

                                        // reset all errors
                                        for (var att in $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$error) {
                                            if (att == "max" || att == "min") {
                                                delete $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$error[att];
                                            }
                                        }
                                        if (angular.isUndefined($scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$error.length) || $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$error.length == 0) {
                                            $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$valid = true;
                                            $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$invalid = false;
                                        }


                                        for (var att in $scope.administrationPageForm.$error) {
                                            if (att == "max" || att == "min") {
                                                delete $scope.administrationPageForm.$error[att];
                                            }
                                        }

                                        if (angular.isUndefined($scope.administrationPageForm.$error.length) || $scope.administrationPageForm.$error.length == 0) {
                                            $scope.administrationPageForm.$valid = true;
                                            $scope.administrationPageForm.$invalid = false;
                                        }
                                    });
                                }, 100);
                            }
                        },
                        onDiastolicChange: function () {
                            var flowsheetForm = $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'];
                            flowsheetForm.systolic.$setViewValue(flowsheetForm.systolic.$viewValue);
                        },
                        onSiteChange: function () {
                            var flowsheetForm = $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'];
                            flowsheetForm.tempValue.$setViewValue(flowsheetForm.tempValue.$viewValue);
                        },
                        onPainScaleChange: function() {
                            $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].pain.intensity = undefined;
                        },
                        onSedationScaleChange: function() {
                            $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].sedation.level = undefined;
                            var flowsheetForm = $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'];
                            flowsheetForm.sedationLevel.$setViewValue(flowsheetForm.sedationLevel.$viewValue);
                        },
                        onSelectUnselectAxaAdvReaction: function(selAxaAdvReac) {
                            $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].axaAdvReac.list = [];
                            angular.forEach(selAxaAdvReac, function(axaAdvReac) {
                                $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].axaAdvReac.list.push({ data: axaAdvReac });
                            });
                            $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$setDirty();
                        },
                        onSelectUnselectGlyAdvReaction: function(selGlyAdvReac) {
                            $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].glyAdvReac.list = [];
                            angular.forEach(selGlyAdvReac, function(glyAdvReac) {
                                $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].glyAdvReac.list.push({ data: glyAdvReac });
                            });
                            $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$setDirty();
                        },
                        onSelectUnselectRDesc: function(selRDesc) {
                            $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].rr.rDesc.list = [];
                            angular.forEach(selRDesc, function(rdesc) {
                                $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].rr.rDesc.list.push({ data: rdesc });
                            });
                            $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$setDirty();
                        },
                        changeAxaAdvReacOptions: function(e) {
                            $scope.helpers.eventHandlers.workflows.onSelectUnselectAxaAdvReaction(e.sender._values);
                        },
                        changeGlyAdvReacOptions: function(e) {
                            $scope.helpers.eventHandlers.workflows.onSelectUnselectGlyAdvReaction(e.sender._values);
                        },
                        changeRDescOptions: function(e) {
                            $scope.helpers.eventHandlers.workflows.onSelectUnselectRDesc(e.sender._values);
                            ////// Get reference to the validator
                            ////var validator = $("#rrDesc").kendoValidator().data("kendoValidator");

                            ////// Bind validation to blur
                            ////$("input", e.sender.wrapper).on("blur", function () {
                            ////    validator.validate();
                            ////});
                            //var wrapper = e.sender._innerWrapper;
                            ////xxx.className = 'has-error ' + xxx.className;
                            
                            //if (e.sender._values.length > 0)
                            //{
                            //    //e.sender._innerWrapper.addClass('ng-valid ng-valid-required has-error').removeClass('ng-invalid ng-invalid-required');
                            //    //wrapper.style.backgroundColor = '';
                            //    //wrapper.style.borderColor = '';
                            //    wrapper.addClass('ng-valid ng-valid-required has-error');
                            //}
                            //else
                            //{
                            //    //e.sender._innerWrapper.addClass('ng-invalid ng-invalid-required').removeClass('ng-valid ng-valid-required has-error');
                            //    //wrapper.style.backgroundColor = '#f6ebeb';
                            //    //wrapper.style.borderColor = '#b94a48';
                            //    wrapper.addClass('ng-invalid ng-invalid-required');
                            //}
                        },
                        clearGlycemya: function () {
                            $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].glucose.value = undefined;
                            $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].glucose.$setViewValue("");
                            $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].glucose.$setPristine();
                            $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].glucose.$valid = true;
                            $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].glucose.$invalid = true;
                            $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].glucose.$render();
                            document.getElementById("glucose").focus();
                        },
                        clearHighLow: function () {
                            if ($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].glucose.value != '')
                                $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].glucose.highLow = '';
                        }
                    },
                    onReverseDisplay: function() { $scope.states.fullDisplay = !$scope.states.fullDisplay; },
                    onDispensedDoseChange: function() {
                        $scope.administrationPageForm.dispensedAmount.$setViewValue($scope.administrationPageForm.dispensedAmount.$viewValue);
                    },
                    onDispensedAmountChange: function() {
                        $scope.administrationPageForm.dispensedDose.$setViewValue($scope.administrationPageForm.dispensedDose.$viewValue);
                    },
                    onDispensedAmountBlur: function() {
                        if (angular.isDefined($scope.administrationPageForm.dispensedAmount) &&
                            $scope.administrationPageForm.dispensedAmount.$viewValue != "" &&
                            $scope.administrationPageForm.amountUnit.$viewValue != "") {
                            $scope.administrationPageForm.amountUnit.$setViewValue($scope.administrationPageForm.amountUnit.$viewValue);
                        } else {
                            $scope.administrationPageForm.amountUnit.$render();
                        }

                    },
                    onDispensedDoseBlur: function() {
                        if (angular.isDefined($scope.administrationPageForm.dispensedDose) &&
                            $scope.administrationPageForm.dispensedDose.$viewValue != "" &&
                            $scope.administrationPageForm.strengthUnit.$viewValue != "") {
                            $scope.administrationPageForm.strengthUnit.$setViewValue($scope.administrationPageForm.strengthUnit.$viewValue);
                        } else {
                            $scope.administrationPageForm.strengthUnit.$render();
                        }

                    },
                    onAdministrationStatusChange: function() {
                        var rxStatus = $scope.helpers.data.getCurrentAdministrationStatus();
                        if (rxStatus !== null) {
                            var adm = $scope.model.selectedAdministration;
                            adm.reasonPrecisions = undefined;
                            if ('NOTGIVEN' === rxStatus.code) {
                                adm.administeredDose.dispensedDose = undefined;
                                adm.administeredDose.dispensedAmount = undefined;
                                adm.administrationReasonId = undefined;
                                adm.administeredDose.strengthUnitId = undefined;
                                adm.administeredDose.amountUnitId = undefined;
                                $scope.administrationPageForm.nonAdministrationReason.$setViewValue($scope.administrationPageForm.nonAdministrationReason.$viewValue);
                                if (angular.isDefined($scope.administrationPageForm.dispensedDose)) {
                                    $scope.administrationPageForm.dispensedDose.$setViewValue("");
                                }
                                if (angular.isDefined($scope.administrationPageForm.dispensedAmount)) {
                                    $scope.administrationPageForm.dispensedAmount.$setViewValue("");
                                }

                            } else if ('PARTIAL' === rxStatus.code) {
                                if (angular.isDefined($scope.administrationPageForm.dispensedDose)) {
                                    if (adm.administeredDose.dispensedDose == $scope.model.defaultDoseValues.dispensedDose) {
                                        adm.administeredDose.dispensedDose = undefined;
                                        $scope.administrationPageForm.dispensedDose.$setViewValue("");
                                    }
                                }
                                if (angular.isDefined($scope.administrationPageForm.dispensedAmount)) {
                                    if (adm.administeredDose.dispensedAmount == $scope.model.defaultDoseValues.dispensedAmount) {
                                        adm.administeredDose.dispensedAmount = undefined;
                                        $scope.administrationPageForm.dispensedAmount.$setViewValue("");
                                    }
                                }
                                $scope.administrationPageForm.partialAdministrationReason.$setViewValue($scope.administrationPageForm.partialAdministrationReason.$viewValue);
                                adm.nonAdministrationReasonId = undefined;

                            } else if ('COMPLETE' === rxStatus.code) {
                                $scope.administrationPageForm.partialAdministrationReason.$setViewValue($scope.administrationPageForm.partialAdministrationReason.$viewValue);
                                if ($scope.helpers.uiState.detail.isContinuousDosageType()) {
                                    adm.administrationReasonId = undefined;
                                    adm.nonAdministrationReasonId = undefined;
                                    $scope.continousAdmValuesCopy = {
                                        isBolus: adm.administeredDose.isBolus,
                                        infusionSiteId: adm.infusionSiteId,
                                        administeredVolume: adm.administeredDose.administeredVolume,
                                        volumeUnitId: adm.administeredDose.volumeUnitId,
                                        isBagReplacement: adm.isBagReplacement,
                                        rate: adm.administeredDose.rate,
                                        rateUnitId: adm.administeredDose.rateUnitId
                                    };
                                    if (angular.isDefined($scope.administrationPageForm.isBolus)) {
                                        adm.administeredDose.isBolus = false;
                                        $scope.administrationPageForm.isBolus.$render();
                                    }
                                    if (angular.isDefined($scope.administrationPageForm.infusionSite)) {
                                        adm.infusionSiteId = undefined;
                                        $scope.administrationPageForm.infusionSite.$render();
                                    }
                                    if (angular.isDefined($scope.administrationPageForm.administeredVolume)) {
                                        adm.administeredDose.administeredVolume = undefined;
                                        $scope.administrationPageForm.administeredVolume.$render();
                                    }
                                    if (angular.isDefined($scope.administrationPageForm.volumeUnitId)) {
                                        adm.administeredDose.volumeUnitId = undefined;
                                        $scope.administrationPageForm.volumeUnitId.$render();
                                    }
                                    if (angular.isDefined($scope.administrationPageForm.isBagReplacement)) {
                                        adm.isBagReplacement = false;
                                        $scope.administrationPageForm.isBagReplacement.$render();
                                    }
                                    if (angular.isDefined($scope.administrationPageForm.rate)) {
                                        adm.administeredDose.rate = undefined;
                                        $scope.administrationPageForm.rate.$render();
                                    }
                                    if (angular.isDefined($scope.administrationPageForm.rateUnitId)) {
                                        adm.administeredDose.rateUnitId = undefined;
                                        $scope.administrationPageForm.rateUnitId.$render();
                                    }
                                } else {
                                    if (angular.isUndefined(adm.administeredDose.dispensedDose) || adm.administeredDose.dispensedDose == null) {
                                        adm.administeredDose.dispensedDose = $scope.model.defaultDoseValues.dispensedDose;
                                        adm.administeredDose.strengthUnitId = $scope.model.defaultDoseValues.strengthUnitId;
                                    }
                                    if (angular.isUndefined(adm.administeredDose.dispensedAmount) || adm.administeredDose.dispensedAmount == null) {
                                        adm.administeredDose.dispensedAmount = $scope.model.defaultDoseValues.dispensedAmount;
                                        adm.administeredDose.amountUnitId = $scope.model.defaultDoseValues.amountUnitId;
                                    }
                                    if ((angular.isUndefined(adm.administeredDose.dispensedAmount) || adm.administeredDose.dispensedAmount == null) &&
                                    (angular.isUndefined(adm.administeredDose.dispensedDose) || adm.administeredDose.dispensedDose == null)) {
                                        if (angular.isDefined($scope.administrationPageForm.dispensedDose))
                                            $scope.administrationPageForm.dispensedDose.$setViewValue($scope.administrationPageForm.dispensedDose.$viewValue);

                                        if (angular.isDefined($scope.administrationPageForm.dispensedAmount))
                                            $scope.administrationPageForm.dispensedAmount.$setViewValue($scope.administrationPageForm.dispensedAmount.$viewValue);
                                    }
                                    if (angular.isDefined($scope.continousAdmValuesCopy)) {

                                        adm.administeredDose.isBolus = $scope.continousAdmValuesCopy.isBolus;
                                        $scope.administrationPageForm.isBolus.$render();

                                        adm.infusionSiteId = $scope.continousAdmValuesCopy.infusionSiteId;
                                        $scope.administrationPageForm.infusionSite.$render();
                                        adm.administeredDose.administeredVolume = $scope.continousAdmValuesCopy.administeredVolume;
                                        $scope.administrationPageForm.administeredVolume.$render();
                                        adm.administeredDose.volumeUnitId = $scope.continousAdmValuesCopy.volumeUnitId;
                                        $scope.administrationPageForm.volumeUnitId.$render();
                                        adm.isBagReplacement = $scope.continousAdmValuesCopy.isBagReplacement;
                                        $scope.administrationPageForm.isBagReplacement.$render();
                                        adm.administeredDose.rate = $scope.continousAdmValuesCopy.rate;
                                        $scope.administrationPageForm.rate.$render();
                                        adm.administeredDose.rateUnitId = $scope.continousAdmValuesCopy.rateUnitId;
                                        $scope.administrationPageForm.rateUnitId.$render();

                                        $scope.continousAdmValuesCopy = undefined;
                                    }
                                    adm.administrationReasonId = undefined;
                                    adm.nonAdministrationReasonId = undefined;
                                }
                            } else if ('PAUSED' === rxStatus.code) {

                                $scope.continousAdmValuesCopy = {
                                    isBolus: adm.administeredDose.isBolus,
                                    infusionSiteId: adm.infusionSiteId,
                                    administeredVolume: adm.administeredDose.administeredVolume,
                                    volumeUnitId: adm.administeredDose.volumeUnitId,
                                    isBagReplacement: adm.isBagReplacement,
                                    rate: adm.administeredDose.rate,
                                    rateUnitId: adm.administeredDose.rateUnitId
                                };

                                if (angular.isDefined($scope.administrationPageForm.isBolus)) {
                                    adm.administeredDose.isBolus = false;
                                    $scope.administrationPageForm.isBolus.$render();
                                }
                                if (angular.isDefined($scope.administrationPageForm.infusionSite)) {
                                    adm.infusionSiteId = undefined;
                                    $scope.administrationPageForm.infusionSite.$render();
                                }
                                if (angular.isDefined($scope.administrationPageForm.administeredVolume)) {
                                    adm.administeredDose.administeredVolume = undefined;
                                    $scope.administrationPageForm.administeredVolume.$render();
                                }
                                if (angular.isDefined($scope.administrationPageForm.volumeUnitId)) {
                                    adm.administeredDose.volumeUnitId = undefined;
                                    $scope.administrationPageForm.volumeUnitId.$render();
                                }
                                if (angular.isDefined($scope.administrationPageForm.isBagReplacement)) {
                                    adm.isBagReplacement = false;
                                    $scope.administrationPageForm.isBagReplacement.$render();
                                }
                                if (angular.isDefined($scope.administrationPageForm.rate)) {
                                    adm.administeredDose.rate = undefined;
                                    $scope.administrationPageForm.rate.$render();
                                }
                                if (angular.isDefined($scope.administrationPageForm.rateUnitId)) {
                                    adm.administeredDose.rateUnitId = undefined;
                                    $scope.administrationPageForm.rateUnitId.$render();
                                }
                                adm.administrationReasonId = undefined;
                                adm.nonAdministrationReasonId = undefined;
                                $scope.administrationPageForm.partialAdministrationReason.$render();

                            } else if ('PROGRESS' === rxStatus.code) {
                                if (angular.isDefined($scope.continousAdmValuesCopy)) {

                                    adm.administeredDose.isBolus = $scope.continousAdmValuesCopy.isBolus;
                                    $scope.administrationPageForm.isBolus.$render();

                                    adm.infusionSiteId = $scope.continousAdmValuesCopy.infusionSiteId;
                                    $scope.administrationPageForm.infusionSite.$render();
                                    adm.administeredDose.administeredVolume = $scope.continousAdmValuesCopy.administeredVolume;
                                    $scope.administrationPageForm.administeredVolume.$render();
                                    adm.administeredDose.volumeUnitId = $scope.continousAdmValuesCopy.volumeUnitId;
                                    $scope.administrationPageForm.volumeUnitId.$render();
                                    adm.isBagReplacement = $scope.continousAdmValuesCopy.isBagReplacement;
                                    $scope.administrationPageForm.isBagReplacement.$render();
                                    adm.administeredDose.rate = $scope.continousAdmValuesCopy.rate;
                                    $scope.administrationPageForm.rate.$render();
                                    adm.administeredDose.rateUnitId = $scope.continousAdmValuesCopy.rateUnitId;
                                    $scope.administrationPageForm.rateUnitId.$render();

                                    $scope.continousAdmValuesCopy = undefined;
                                }
                            } else {
                                // error?
                            }
                        }
                    },
                    onSelectRx: function(rx) {
                        if (angular.isUndefined(rx))
                            return;
                        
                        $scope.model.selectedRx = rx;
                        if (angular.isUndefined($scope.model.selectedRx.rxStatus)) {
                            $scope.model.selectedRx.rxStatus = appSettingsFactory.getDataLookupInstanceById($scope.model.selectedRx.rxStatusId, $scope.model.statusList);
                            $scope.model.selectedRx.cessationReason = $scope.model.selectedRx.cessationReasonId != null ? appSettingsFactory.getDataLookupInstanceById($scope.model.selectedRx.cessationReasonId, $scope.model.cessationReasonList) : {};
                            $scope.model.selectedRx.suspensionReason = $scope.model.selectedRx.suspension != null ? appSettingsFactory.getDataLookupInstanceById($scope.model.selectedRx.suspension.suspensionReasonId, $scope.model.suspensionReasonList) : {};
                        }
                        var adm = $scope.helpers.utils.getAssociatedAdministration($scope.model.selectedRx);
                        $scope.helpers.eventHandlers.onSelectAdministration(adm);

                    },
                    onSelectAdministration: function(administration) {
                        if (angular.isUndefined(administration))
                            return;

                        var target = undefined;
                        angular.forEach($scope.model.administrations, function(adm) {
                            if (angular.isDefined(target))
                                return;
                            if (adm.id == administration.id && adm.parentRxId === administration.parentRxId)
                                target = adm;
                        });
                        
                        $scope.model.selectedAdministration = target;
                        
                        if ($scope.states.prepare) {
                            if (angular.isUndefined($scope.model.selectedAdministration.prepareDoubleCheckDateTime) || $scope.model.selectedAdministration.prepareDoubleCheckDateTime === null)
                                $scope.model.selectedAdministration.prepareDoubleCheckDateTime = new Date();
                            //if (angular.isDefined($scope.model.administrationStatusList))
                            //    $scope.model.selectedAdministration.administrationStatusId = appSettingsFactory.getDataLookupInstanceByCode('PREPARED', $scope.model.administrationStatusList).id;
                        } else {
                           $scope.model.selectedAdministration.realizationDateTimeUTC = $scope.model.selectedAdministration.realizationDateTime;
                        }

                        $scope.model.selectedAdministration.workflowObjects = undefined;
                        if ($scope.states.extraDose) {
                            $scope.model.selectedAdministration.id = 0;
                            $scope.model.selectedAdministration.signature = null;
                            $scope.model.selectedAdministration.verifiedBy = null;
                            $scope.model.selectedAdministration.verificationDateTime = null;
                            $scope.model.selectedAdministration.PreparedBy = null;
                            $scope.model.selectedAdministration.PrepareDoubleCheckDateTime = null;
                            $scope.model.selectedAdministration.preparationCancellationReasonId = null;
                            $scope.model.selectedAdministration.preparationCancellationNote = null;
                            $scope.model.selectedAdministration.schedule = null;
                            $scope.model.selectedAdministration.cancellationReasonId = null;
                            $scope.model.selectedAdministration.cancellationNote = null;
                            $scope.model.selectedAdministration.isPreparationValidated = false;
                            $scope.model.selectedAdministration.isBagReplacement = false;
                            $scope.model.selectedAdministration.isRemoval = false;
                            $scope.model.selectedAdministration.isBatchAdministrationAllowed = false;
                            $scope.model.selectedAdministration.isAdditionalDose = true;
                            $scope.model.selectedAdministration.isSuspended = false;
                            $scope.model.selectedAdministration.expirationDateTime = null;
                            $scope.helpers.utils.initWorkflowObjects($scope.model.selectedAdministration);
                            $scope.model.selectedAdministration.administrationStatusId = $scope.model.selectedAdministration.administrationStatusIdOriginal = appSettingsFactory.getDataLookupInstanceByCode('CREATED', $scope.model.administrationStatusList).id;
                            if (angular.isDefined($scope.model.selectedAdministration.administeredDose) && $scope.model.selectedAdministration.administeredDose != null)
                                $scope.model.selectedAdministration.administeredDose.version = 0;
                        } else {
                            $scope.helpers.utils.initWorkflowObjects($scope.model.selectedAdministration);
                            $scope.helpers.utils.setupWorkflowObjects($scope.model.selectedAdministration);
                        }

                        $scope.model.selectedAdministrationBkp = angular.copy($scope.model.selectedAdministration);
                        $scope.helpers.utils.computeAdministrationTimeNote();
                        
                        var availableWorkflow = $scope.helpers.utils.getFirstAvailableWorkflow();
                        if (angular.isDefined(availableWorkflow)) {
                            $scope.helpers.eventHandlers.workflows.onWorkflowTabClick(availableWorkflow);
                            $scope.helpers.uiState.workflows.tabs[availableWorkflow.index].active = true;
                        }

                        if (angular.isDefined(target.administeredDose) && target.administeredDose != null) {
                            $scope.model.defaultDoseValues = {
                                dispensedAmount: target.administeredDose.dispensedAmount,
                                amountUnitId: target.administeredDose.amountUnitId,
                                dispensedDose: target.administeredDose.dispensedDose,
                                strengthUnitId: target.administeredDose.strengthUnitId,
                                rate: target.administeredDose.rate,
                                rateUnitId: target.administeredDose.rateUnitId,
                                administeredVolume: target.administeredDose.administeredVolume,
                                volumeUnitId: target.administeredDose.volumeUnitId,
                                isBolus: target.administeredDose.isBolus,

                                infusionSiteId: target.infusionSiteId,
                                isBagReplacement: target.isBagReplacement
                            };
                        }
                    },
                    onSave: function(administration, rx, saveAll, quit) {

                        var deferred = $q.defer();

                        // Validation in workflowFactory
                        if (!$scope.helpers.eventHandlers.workflows.isSaveWorkFlowValid())
                            return deferred.promise;;

                        var isPrepared = $scope.helpers.utils.administrationIsStatusPreparedByAdministration(administration);
                        var status = $scope.helpers.utils.getAdministrationStatus(administration.administrationStatusId, $scope.model.administrationStatusList);
                        // Validate status
                        if ((angular.isUndefined(administration.administrationStatusId)) ||
                            (status.code == 'CREATED' || (status.code == 'PREPARED' && (!$scope.states.prepare && !$scope.states.toSignOnly)))) {
                            $scope.administrationPageForm.administrationStatus.$setValidity('required', false);
                        }
                        
                        // TODO : review and complete validator before activating
                        var validate = administrationValidator.validateUpdate(rx, administration, $scope.states.prepare, $scope.states.toSignOnly, isPrepared, $scope.model.administrationStatusList);
                        //var validate = { success: true };

                        if (validate.success && $scope.administrationPageForm.$valid) {

                            // compute associated workflow instances fro local workflow objects
                            var toSave = angular.copy(administration);
                            //toSave.workflowInstances = [];
                            angular.forEach(toSave.workflowObjects, function(workflowInstanceArr) {
                                angular.forEach(workflowInstanceArr.workflows, function(aWorkflowObject) {
                                    var workflowInstance = aWorkflowObject.toWorkflowInstance();
                                    if (angular.isDefined(workflowInstance)) {
                                        //New 
                                        if ((angular.isUndefined(workflowInstance.id) || workflowInstance.id == 0)) {
                                            toSave.workflowInstances.push(workflowInstance);
                                        }
                                        //Deleted
                                        if (workflowInstance.isCancelled) {
                                            var itemDeleted = Enumerable.From(toSave.workflowInstances).Where(function(i) { return i.id == workflowInstance.id; }).First();
                                            if (angular.isDefined(itemDeleted) && !itemDeleted.isCancelled) {
                                                var index = toSave.workflowInstances.indexOf(itemDeleted);
                                                if (index > -1) {
                                                    toSave.workflowInstances[index].isCancelled = true;
                                                    toSave.workflowInstances[index].cancellationReasonId = workflowInstance.cancellationReasonId;
                                                }
                                            }
                                        }
                                    }
                                });
                            });
                            toSave.workflowObjects = undefined; // no need to send this over the wire

                            // update realized date time
                            if (!$scope.states.prepare && (!$scope.states.toSignOnly || !isPrepared)) {
                                if (angular.isDate(toSave.realizationDateTimeUTC)) {
                                    toSave.realizationDateTime = toSave.realizationDateTimeUTC;
                                } else {
                                    toSave.realizationDateTime = moment(toSave.realizationDateTimeUTC).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
                                }
                            } else {
                                toSave.realizationDateTime = null;
                            }


                            if ($scope.states.extraDose) {
                                toSave.id = 0;
                                toSave.version = 0;
                                administrationService
                                    .addExtraDose(toSave)
                                    .then(function(response) {
                                            // Remove the item from the working list
                                            var itemValidated = Enumerable.From($scope.model.rxs).Where(function(i) { return i.id == administration.parentRxId; }).First();
                                            if (angular.isDefined(itemValidated)) {
                                                var index = $scope.model.rxs.indexOf(itemValidated);
                                                if (index > -1) {

                                                    if (itemValidated.id == $scope.model.selectedAdministration.parentRxId) {
                                                        $scope.administrationPageForm.$setPristine();
                                                    }

                                                    $scope.model.rxs.splice(index, 1);

                                                    if ($scope.model.rxs.length <= 0) {
                                                        $window.history.back();
                                                    } else {
                                                        $scope.helpers.eventHandlers.onSelectRx($scope.model.rxs[0]);
                                                    }
                                                }
                                            }
                                            deferred.resolve(validate);
                                        },
                                        function(response) {
                                            appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), response.data.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                                            deferred.reject(validate);
                                        })
                                    .catch(function(response) {
                                        $log.log('realize catch', response);
                                        deferred.reject(validate);
                                    })
                                    .finally(function() {
                                        $log.log('realize finally');
                                    });
                            } else if ($scope.states.prepare || 
                                       ($scope.states.toSignOnly && isPrepared)) {
                                administrationService
                                    .prepareDoubleCheck(toSave)
                                    .then(
                                        function(administrationUpdated) {

                                            $scope.helpers.utils.updateSelectedAdministration(administrationUpdated.data.Result, false);
                                            $scope.administrationPageForm.$setPristine();

                                            deferred.resolve(validate);
                                        },
                                        function(response) {
                                            appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), response.data.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                                            deferred.reject(validate);
                                        }
                                    )
                                    .catch(function(response) {
                                        // appSettingsFactory.err
                                        deferred.reject(validate);
                                    })
                                    .finally(function() {
                                        // $log.log('update finally');
                                    });
                            } else if ( $scope.states.listMode || Enumerable.From($scope.signedAdministrations).Where(function(i) { return i.id == toSave.id; }).Any()) {
                                administrationService
                                    .update(toSave)
                                    .then(
                                        function(administrationUpdated) {

                                            $scope.helpers.utils.updateSelectedAdministration(administrationUpdated.data.Result, !$scope.states.prepare);
                                            $scope.administrationPageForm.$setPristine();

                                            // Not in list mode we have to remove it from the list
                                            if (!$scope.states.listMode) {
                                                var itemValidated = Enumerable.From($scope.model.rxs).Where(function(i) { return i.id == administrationUpdated.data.Result.parentRxId; }).First();
                                                if (angular.isDefined(itemValidated)) {
                                                    var index = $scope.model.rxs.indexOf(itemValidated);
                                                    if (index > -1) {
                                                        $scope.model.rxs.splice(index, 1);
                                                        if ($scope.model.rxs.length <= 0) {
                                                            $scope.pageManager.redirectToParent();
                                                        } else {
                                                            $scope.helpers.eventHandlers.onSelectRx($scope.model.rxs[0]);
                                                        }
                                                    }
                                                }
                                            }
                                            deferred.resolve(validate);
                                        },
                                        function(response) {
                                            appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), response.data.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                                            deferred.reject(validate);
                                        }
                                    )
                                    .catch(function(response) {
                                        // appSettingsFactory.err
                                        deferred.reject(validate);
                                    })
                                    .finally(function() {
                                        // $log.log('update finally');
                                    });
                            } else {
                                administrationService
                                    .realize(toSave)
                                    .then(function(response) {
                                            // Remove the item from the working list
                                        $scope.helpers.eventHandlers.removeRxFromList(toSave, saveAll);
                                            deferred.resolve(validate);
                                        },
                                        function(response) {
                                            appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), response.data.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                                            deferred.reject(validate);
                                        })
                                    .catch(function(response) {
                                        $log.log('realize catch', response);
                                        deferred.reject(validate);
                                    })
                                    .finally(function() {
                                        $log.log('realize finally');
                                    });
                            }
                            if (quit)
                                return deferred.promise;
                            else
                                return validate;
                        } else {
                            if (!saveAll) {
                                var errors = validate.errors;
                                if (errors.length == 0) {
                                    errors = $scope.cultureManager.resources.translate('MANDATORY_FIELDS');
                                }
                                appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), errors, $scope.cultureManager.resources.translate('CLOSE'));
                            }

                            if ($scope.administrationPageForm.$invalid && angular.isDefined($scope.administrationPageForm.$error && angular.isDefined($scope.administrationPageForm.$error.required))) {
                                angular.forEach($scope.administrationPageForm.$error.required, function (error) {
                                    if (angular.isDefined(error.$setViewValue)) {
                                        error.$setViewValue("");
                                    }
                                });
                                validate.success = false;
                                validate.errors.push({ errorCode: '', errorMessage: $scope.cultureManager.resources.translate('MANDATORY_FIELDS') + ' ' + rx.mx.description });
                            }                           
                           
                        }
                        if (quit) {
                            deferred.reject(validate);
                            return deferred.promise;
                        }
                        else
                            return validate;
                    },
                    onSaveAll: function() {
                        //Save all window
                        onClose(null);
                        var modalInstance = $modal.open({
                            templateUrl: locationService.shared.views + "administration/administrationSaveAll.html",
                            controller: 'administrationSaveAllController',
                            windowClass: 'modal-window-administration-save-all',
                            backdrop: 'static',
                            keyboard: false
                        });
                        modalInstance.result.then(function(administrationSaveAll) {
                            if (administrationSaveAll !== null) {
                                if ($scope.administrationPageForm.$invalid) {
                                    angular.forEach($scope.administrationPageForm.$error.required, function(error) {
                                        if (angular.isDefined(error.$setViewValue)) {
                                            error.$setViewValue(error.$viewValue);
                                            error.$render();
                                        }
                                    });
                                    appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('MANDATORY_FIELDS'), $scope.cultureManager.resources.translate('CLOSE'));
                                    return;
                                }
                                //Save all
                                var errors = [];
                                var msgDisplayed = false;
                                angular.forEach($scope.model.rxs, function(rx) {
                                    $timeout(function() {
                                        if ($scope.administrationPageForm.$valid) {

                                            $scope.helpers.eventHandlers.onSelectRx(rx);
                                            $scope.$apply();
                                            if (!$scope.helpers.data.isRxIncomplete(rx) ) {
                                                //Continous RX will not be processed on save all
                                                var rxTypeCode = rxHelperFactory.getRxType(rx, $scope.model.dosageTypeList, $scope.model.rxSchedulePriorityList);

                                                if (rxTypeCode != appSettingsFactory.rxGroupsKey.continuous) {

                                                    var nextAdministration = $scope.helpers.utils.getAssociatedAdministration($scope.model.selectedRx);
                                                    nextAdministration.administrationStatusId = administrationSaveAll.status.id;

                                                    if (administrationSaveAll.status.code == "NOTGIVEN") {
                                                        nextAdministration.nonAdministrationReasonId = administrationSaveAll.reason.id;
                                                        nextAdministration.reasonPrecisions = administrationSaveAll.reasonPrecision;
                                                    } else if (administrationSaveAll.status.code == "PARTIAL") {
                                                        nextAdministration.administrationReasonId = administrationSaveAll.reason.id;
                                                        nextAdministration.reasonPrecisions = administrationSaveAll.reasonPrecision;
                                                    }

                                                    if (StringUtils.isNotBlank(administrationSaveAll.timestamp)) {
                                                        nextAdministration.realizationDateTimeUTC = administrationSaveAll.timestamp;
                                                    } else {
                                                        var now = new Date();
                                                        if (nextAdministration.plannedDateTime > now || rxTypeCode == appSettingsFactory.rxGroupsKey.stat || rxTypeCode == appSettingsFactory.rxGroupsKey.prn || $scope.states.extraDose) {
                                                            nextAdministration.realizationDateTimeUTC = now;
                                                        } else {
                                                            nextAdministration.realizationDateTimeUTC = nextAdministration.plannedDateTime;
                                                        }
                                                    }
                                                    $scope.$apply();
                                                    //
                                                    // Individual save operations occur here!!!
                                                    //
                                                    if ($scope.administrationPageForm.$valid) {
                                                        var validate = $scope.helpers.eventHandlers.onSave(nextAdministration, $scope.model.selectedRx, true, false);

                                                        if (!validate.success && validate.errors.length > 0) {
                                                            errors = errors.concat(validate.errors);
                                                            appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), errors, $scope.cultureManager.resources.translate('CLOSE'));
                                                            $timeout.cancel();
                                                            return;
                                                        }
                                                    }
                                                }
                                            }
                                        } else {
                                            $timeout(function() {
                                                if (!msgDisplayed)
                                                    appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('MANDATORY_FIELDS'), $scope.cultureManager.resources.translate('CLOSE'));
                                                msgDisplayed = true;
                                                angular.forEach($scope.administrationPageForm.$error.required, function(error) {
                                                    error.$setViewValue(error.$viewValue);
                                                });
                                                $timeout.cancel();
                                            }, 0, true);
                                            return;
                                        }
                                    }, 0, true);
                                });
                            }
                        });
                    },
                    onCancel: function( /*doPrompt*/) {
                        //
                        // IMPORTANT: 
                        // If a given administration is already signed, changes should be detected and the user should then be prompted to cancel the double check (signature).
                        // The CANCEL action in this context should only be used to revert any (local) changes that have been made to a given administration,
                        // signed and/or realized.
                        // 
                        // So IN ALL CASES, the CANCEL action only reverts the local changes to the initial administation state
                        //
                        var cancelConfirmation = function() {
                            var target = undefined;
                            angular.forEach($scope.model.administrations, function(administration) {
                                if (target != null)
                                    return;
                                if (administration.id == $scope.model.selectedAdministration.id)
                                    target = administration;
                            });
                            var index = $scope.model.administrations.indexOf(target);
                            if (index > -1) {
                                $scope.model.administrations[index] = $scope.model.selectedAdministration = $scope.model.selectedAdministrationBkp;
                            }
                            $scope.administrationPageForm.$setPristine();
                            $scope.helpers.eventHandlers.onSelectAdministration($scope.model.selectedAdministration);
                            if ($scope.helpers.uiState.workflows.showFlowsheets() && angular.isDefined($scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm']))
                                $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$setPristine();
                        };

                        appSettingsFactory.displayConfirmation(
                            $scope.cultureManager.resources.translate('CONFIRMATION'),
                            $scope.cultureManager.resources.translate('CONFIRM_CANCEL_CHANGES'),
                            $scope.cultureManager.resources.translate('YES'),
                            $scope.cultureManager.resources.translate('NO'),
                            null,
                            cancelConfirmation,
                            null);
                    },
                    onSign: function() {

                        // Data must be entered before applying double check (signature)
                        if ($scope.helpers.uiState.isDataIncomplete($scope.model.selectedAdministration)) {
                            appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('COMPLETE_DATA_ENTRY'), $scope.cultureManager.resources.translate('CLOSE'));
                            return;
                        }

                        // Validation in workflowFactory
                        if (!$scope.helpers.eventHandlers.workflows.isSaveWorkFlowValid())
                            return;

                        //
                        // TODO : review and complete validator before activating
                        //
                        //var validate = administrationValidator.validateAdministration($scope.model.selectedRx, $scope.model.selectedAdministration);
                        var isPrepared = $scope.helpers.utils.administrationIsStatusPreparedByAdministration($scope.model.selectedAdministration);
                        var validate = administrationValidator.validateUpdate($scope.model.selectedRx, $scope.model.selectedAdministration, $scope.states.prepare, $scope.states.toSignOnly, isPrepared, $scope.model.administrationStatusList);

                        //var validate = { success: true };
                        if (validate.success) {
                            //if the administration is realized and the current user is not the the realized user, just confirm the double sign

                            if ($scope.model.currentWorkflows.length > 0 && $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].isDraft())
                                $timeout(function () { $scope.helpers.eventHandlers.workflows.onSaveWorkflowInstance(); }, 0, false);

                            if ((angular.isDate($scope.model.selectedAdministration.realizationDateTime)
                                    && ($scope.model.selectedAdministration.administrationUser !== null)
                                    && ($scope.model.selectedAdministration.administrationUser.username != authService.model.identity.user.userName))
                                || (angular.isDate($scope.model.selectedAdministration.prepareDoubleCheckDateTime)
                                    && ($scope.model.selectedAdministration.preparedBy !== null)
                                    && ($scope.model.selectedAdministration.preparedBy.username != authService.model.identity.user.userName))) {

                                // validate security permission
                                if (permissionsHelperFactory.isNotAllowed(permissionsHelperFactory.marRolesList.MAR_DA_SignAdministration, permissionsHelperFactory.securityContext.mar)) {
                                    appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('NOT_AUTHORIZED_TO_DOUBLESIGN'), $scope.cultureManager.resources.translate('CLOSE'));
                                    return;
                                };

                                //SIGN_CONFIRM
                                appSettingsFactory.displayConfirmation(
                                    $scope.cultureManager.resources.translate('SIGNATURE'),
                                    $scope.cultureManager.resources.translate('CONFIRM_SIGNATURE'),
                                    $scope.cultureManager.resources.translate('YES'),
                                    $scope.cultureManager.resources.translate('NO'),
                                    null,
                                    $scope.helpers.eventHandlers.onActionSignFunction,
                                    null);
                            } else {
                                var scope = $rootScope.$new();

                                angular.forEach($scope.model.selectedAdministration.workflowObjects, function(workflowInstanceArr) {
                                    angular.forEach(workflowInstanceArr.workflows, function(aWorkflowObject) {
                                        var workflowInstance = aWorkflowObject.toWorkflowInstance();
                                        if (angular.isDefined(workflowInstance))
                                            $scope.model.selectedAdministration.workflowInstances.push(workflowInstance);
                                    })
                                });

                                angular.forEach($scope.model.deletedWorkflows, function(aWorkflowObject) {
                                    var workflowInstance = aWorkflowObject.toWorkflowInstance();
                                    if (angular.isDefined(workflowInstance)) {
                                        $scope.model.selectedAdministration.workflowInstances.push(workflowInstance);
                                    }
                                });

                                scope.model = angular.copy($scope.model.selectedAdministration);

                                // update realized date time
                                if (!$scope.states.prepare) {
                                   
                                    //if (angular.isDate(scope.model.realizationDateTimeUTC)) {
                                    //    scope.model.realizationDateTime = $filter('datetime')(scope.model.realizationDateTimeUTC);
                                    //} else {
                                    //    if (scope.model.realizationDateTimeUTC !== null)
                                    //        scope.model.realizationDateTime = moment(scope.model.realizationDateTimeUTC).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
                                    //}
                                }

                                scope.service = administrationService;
                                scope.MAR_DA_Sign = permissionsHelperFactory.marRolesList.MAR_DA_SignAdministration;
                                scope.messageAuthorization = $scope.cultureManager.resources.translate('NOT_AUTHORIZED_TO_DOUBLESIGN');
                                scope.signatureType = "ADMINISTRATION";

                                var modalInstance = $modal.open({
                                    templateUrl: locationService.shared.views + "signature/signature.html",
                                    controller: 'signatureController',
                                    windowClass: 'modal-window-small',
                                    scope: scope,
                                    backdrop: 'static',
                                    keyboard: false
                                });
                                modalInstance.result.then(function(administrationUpdated) {
                                    if (administrationUpdated !== null && administrationUpdated.data !== null && administrationUpdated.data.HasErrors) {
                                        appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), administrationUpdated.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                                    } else {
                                        var admStatus = appSettingsFactory.getDataLookupInstanceById($scope.model.selectedAdministrationBkp.administrationStatusId, $scope.model.administrationStatusList);
                                        if ((admStatus.code == "CREATED" || admStatus.code == "PREPARED") && (!$scope.states.prepare && !$scope.states.toSignOnly && !$scope.states.extraDose)
                                            && !$scope.helpers.utils.isAdministrationStatusPrepared()) {
                                            $scope.helpers.eventHandlers.removeRxFromList(administrationUpdated.data.Result, false);
                                        } else {
                                            $scope.helpers.utils.updateSelectedAdministration(administrationUpdated.data.Result, !$scope.states.prepare);
                                            $scope.signedAdministrations.push({ id: administrationUpdated.data.Result.id });
                                            $scope.administrationPageForm.$setPristine(); // to force update
                                        }
                                    }
                                });

                            }
                        } else {
                            appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), validate.errors, $scope.cultureManager.resources.translate('CLOSE'));
                        }
                    },
                    onActionSignFunction: function() {
                        var tempAdmin = angular.copy($scope.model.selectedAdministration);
                        $scope.model.selectedAdministration.signature = {
                            userName: authService.model.identity.user.userName
                        };

                        angular.forEach($scope.model.selectedAdministration.workflowObjects, function(workflowInstanceArr) {
                            angular.forEach(workflowInstanceArr.workflows, function(aWorkflowObject) {
                                var workflowInstance = aWorkflowObject.toWorkflowInstance();
                                if (angular.isDefined(workflowInstance)) {
                                    //New 
                                    if ((angular.isUndefined(workflowInstance.id) || workflowInstance.id == 0)) {
                                        $scope.model.selectedAdministration.workflowInstances.push(workflowInstance);
                                    }
                                    //Deleted
                                    if (workflowInstance.isCancelled) {
                                        var itemDeleted = Enumerable.From($scope.model.selectedAdministration.workflowInstances).Where(function(i) { return i.id == workflowInstance.id; }).First();
                                        if (angular.isDefined(itemDeleted) && !itemDeleted.isCancelled) {
                                            var index = $scope.model.selectedAdministration.workflowInstances.indexOf(itemDeleted);
                                            if (index > -1) {
                                                $scope.model.selectedAdministration.workflowInstances[index].isCancelled = true;
                                                $scope.model.selectedAdministration.workflowInstances[index].cancellationReasonId = workflowInstance.cancellationReasonId;
                                            }
                                        }
                                    }
                                }
                                //var workflowInstance = aWorkflowObject.toWorkflowInstance();
                                //if (angular.isDefined(workflowInstance))
                                //    $scope.model.selectedAdministration.workflowInstances.push(workflowInstance);
                            });
                        });

                        //angular.forEach($scope.model.deletedWorkflows, function(aWorkflowObject) {
                        //    var workflowInstance = aWorkflowObject.toWorkflowInstance();
                        //    if (angular.isDefined(workflowInstance)) {
                        //        $scope.model.selectedAdministration.workflowInstances.push(workflowInstance);
                        //    }
                        //});
                        $scope.model.selectedAdministration.workflowObjects = undefined; // no need to send this over the wire
                        // update realized date time
                        if (!$scope.states.prepare) {
                            if (angular.isDate($scope.model.selectedAdministration.realizationDateTimeUTC)) {
                                $scope.model.selectedAdministration.realizationDateTime = $filter('datetime')($scope.model.selectedAdministration.realizationDateTimeUTC);
                            } else {
                                $scope.model.selectedAdministration.realizationDateTime = moment($scope.model.selectedAdministration.realizationDateTimeUTC).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
                            }
                        }

                        //Sign administration
                        administrationService.doubleCheck($scope.model.selectedAdministration)
                            .then(
                                function(administrationUpdated) {
                                    if (administrationUpdated !== null && administrationUpdated.data !== null && administrationUpdated.data.HasErrors) {
                                        appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), administrationUpdated.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                                    } else {
                                        var admStatus = appSettingsFactory.getDataLookupInstanceById($scope.model.selectedAdministrationBkp.administrationStatusId, $scope.model.administrationStatusList);
                                        if ((admStatus.code == "CREATED" || admStatus.code == "PREPARED") && (!$scope.states.prepare && !$scope.states.toSignOnly && !$scope.states.extraDose)
                                            && !$scope.helpers.utils.isAdministrationStatusPrepared()) {
                                            $scope.helpers.eventHandlers.removeRxFromList($scope.model.selectedAdministration, false);
                                        } else {
                                            $scope.helpers.utils.updateSelectedAdministration(administrationUpdated.data.Result, !$scope.states.prepare);
                                            $scope.signedAdministrations.push({ id: administrationUpdated.data.Result.id });
                                            $scope.administrationPageForm.$setPristine(); // to force update
                                        }
                                    }
                                },
                                function(scError) {
                                    $scope.helpers.utils.updateSelectedAdministration(tempAdmin, !$scope.states.prepare);
                                    appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), scError.data.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                                }
                            );
                    },
                    onActionCancelSignFunction: function() {
                        //Cancel double check (signature) administration
                        administrationService.cancelDoubleCheck($scope.model.selectedAdministrationBkp)
                            .then(
                                function(administrationUpdated) {
                                    if (administrationUpdated !== null && administrationUpdated.data !== null && administrationUpdated.data.HasErrors) {
                                        appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), administrationUpdated.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                                    } else {
                                        $scope.helpers.utils.updateSelectedAdministration(administrationUpdated.data.Result, !$scope.states.prepare);
                                        $scope.administrationPageForm.$setPristine(); // to force update
                                    }
                                },
                                function(scError) {
                                    appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), scError.data.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                                }
                            );
                    },
                    previousAdministrations: function() {
                        //Load administrations in rxOriginal, the previous administrations are already loaded
                        if ($scope.states.pageListAdministration > 1) {
                            $scope.states.pageListAdministration -= 1;
                            $scope.model.rxOriginal.administrations = angular.copy(Enumerable.From($scope.model.selectedRx.administrations).Where(function(i) { return i.realizationDateTime !== null; }).ToArray().slice((($scope.states.pageListAdministration * 8) - 8), ($scope.states.pageListAdministration * 8)));
                            $scope.model.administrations = angular.copy($scope.model.rxOriginal.administrations);
                            var newFirstElem = Enumerable.From($scope.model.rxOriginal.administrations).Where(function(i) { return i.realizationDateTime !== null; }).First();
                            var firstElemDisplayed = Enumerable.From($scope.model.selectedRx.administrations).Where(function(i) { return i.id == newFirstElem.id; }).First();
                            $scope.helpers.eventHandlers.onSelectAdministration(firstElemDisplayed);
                        }
                    },
                    nextAdministrations: function() {
                        //If the administrations are already loaded then we don't call the back end to fetch the next administrations
                        if ($scope.model.selectedRx.administrations.length >= (($scope.states.pageListAdministration * 8) + 1)) {
                            $scope.states.pageListAdministration += 1;
                            $scope.model.rxOriginal.administrations = angular.copy(Enumerable.From($scope.model.selectedRx.administrations).Where(function(i) { return i.realizationDateTime !== null; }).ToArray().slice((($scope.states.pageListAdministration * 8) - 8), ($scope.states.pageListAdministration * 8)));
                            $scope.model.administrations = angular.copy($scope.model.rxOriginal.administrations);
                            var newFirstElem = Enumerable.From($scope.model.rxOriginal.administrations).Where(function(i) { return i.realizationDateTime !== null; }).First();
                            var firstElemDisplayed = Enumerable.From($scope.model.selectedRx.administrations).Where(function(i) { return i.id == newFirstElem.id; }).First();
                            $scope.helpers.eventHandlers.onSelectAdministration(firstElemDisplayed);
                        } else {
                            //Call the back end to load the next administrations $filter('date')($scope.model.rxOriginal.administrations[$scope.model.rxOriginal.administrations.length - 1].realizationDateTime, 'yyyyMMddHHmmss')
                            var rxIds = $scope.model.rxOriginal.id.toString().split(",");
                            $q.all({
                                rxs: rxManagementService.getRXS(rxIds, $scope.states.toSignOnly, $scope.states.listMode, $scope.states.pageListAdministration + 1 , false),
                                })
                                .then(function(response) {
                                    if (response.rxs.HasErrors) {
                                        // TODO: warn, alert?
                                    } else if (Enumerable.From(response.rxs.Result[0].administrations).Where(function(i) { return i.realizationDateTime !== null; }).ToArray().length) {
                                        var administrations = response.rxs.Result[0].administrations;
                                        $scope.helpers.utils.setupWorkflowObjects(administrations);
                                        angular.forEach(administrations, function(administration) {
                                            $scope.helpers.utils.extendAdministration(administration, true);
                                            $scope.helpers.utils.initWorkflowObjects(administration);
                                            $scope.helpers.utils.setupWorkflowObjects(administration);

                                            $scope.model.selectedRx.administrations.push(administration);
                                        });
                                        $scope.model.rxOriginal.administrations = angular.copy(administrations);
                                        $scope.model.administrations = angular.copy($scope.model.rxOriginal.administrations);
                                        var newFirstElem = $scope.model.rxOriginal.administrations[0];
                                        var firstElemDisplayed = Enumerable.From($scope.model.selectedRx.administrations).Where(function(i) { return i.id == newFirstElem.id; }).First();
                                        $scope.helpers.eventHandlers.onSelectAdministration(firstElemDisplayed);
                                        $scope.states.pageListAdministration += 1;
                                    }
                                })
                                .catch(function(response) {
                                    $log.error(response);
                                })
                                .finally(function() {
                                    // 
                                });
                        }
                    },
                    onViewHistory: function (idAdministration) {//function(idRx, idAdministration)
                        $scope.wndHistory.title($scope.cultureManager.resources.translate('ADM_HISTORY_TITLE'));
                        $rootScope.historyService.setParams(idAdministration, 'AdministrationInstance' );
                        //$rootScope.historyService.setParams(idRx, 'AdministrationInstance', idAdministration);

                        $scope.historyWndVisible = true;
                        $scope.wndHistory.center().open();
                        $scope.wndHistory.refresh();
                    },
                    removeRxFromList: function (administration, saveAll) {
                        // Remove the item from the working list

                        if (Enumerable.From($scope.model.rxs).Any(function (i) { return i.id == administration.parentRxId; })) {
                            var itemValidated = Enumerable.From($scope.model.rxs).Where(function (i) { return i.id == administration.parentRxId; }).First();
                           if (angular.isDefined(itemValidated)) {
                               var index = $scope.model.rxs.indexOf(itemValidated);
                               if (index > -1) {
                                   if (itemValidated.id == administration.parentRxId && !saveAll) {
                                       $scope.administrationPageForm.$setPristine();
                                   }
                                   $scope.model.rxs.splice(index, 1);
                                   if ($scope.model.rxs.length <= 0)
                                       $scope.pageManager.redirectToParent();
                                   else {
                                       if (!saveAll)
                                           $scope.helpers.eventHandlers.onSelectRx($scope.model.rxs[0]);
                                   }
                                }
                           }
                        }
                    },
                    onCancelCurrent: function () {

                        var onCloseConfirmDeleteFlowSheets = function () {
                            return;
                        };

                        var onActionConfirmDeleteFlowSheets = function () {
                            var scope = $rootScope.$new();
                            scope.administration = $scope.model.selectedAdministration;
                            scope.isPreparation = $scope.helpers.utils.administrationIsStatusPrepared($scope.model.selectedRx);

                            var modalInstance = $modal.open({
                                templateUrl: locationService.shared.views + "administration/administrationCancel.html",
                                controller: 'cancelAdministrationController',
                                windowClass: 'modal-window-small',
                                scope: scope,
                                backdrop: 'static',
                                keyboard: false
                            });
                            modalInstance.result.then(function (administrationUpdated) {
                                if (administrationUpdated !== null && administrationUpdated.data !== null && administrationUpdated.data.HasErrors) {
                                    appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), administrationUpdated.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                                } else {
                                    $scope.helpers.utils.updateSelectedAdministration(administrationUpdated.data.Result, !$scope.states.prepare);
                                }
                            });
                        };

                        var onDeleteAdministration = function () {
                            var flowsheets = Enumerable.From($scope.model.selectedAdministration.workflowInstances)
                                .Where(function (i) { return !i.isCancelled; });

                            if (flowsheets.Any()) {
                                // Modified administration is signed - prompt for user confirmation
                                appSettingsFactory.displayConfirmation(
                                    $scope.cultureManager.resources.translate('PAGE_TITLE'),
                                    $scope.cultureManager.resources.translate('CONFIRM_CANCEL_FLOWSHEETS'),
                                    $scope.cultureManager.resources.translate('YES'),
                                    $scope.cultureManager.resources.translate('NO'),
                                    null,
                                    onActionConfirmDeleteFlowSheets,
                                    onCloseConfirmDeleteFlowSheets);
                            } else {
                                onActionConfirmDeleteFlowSheets();
                            }
                        };

                        if (angular.isDefined($scope.model.selectedAdministration) && $scope.model.selectedAdministration.verifiedBy != null) {
                            var onCloseFunction = function() {
                                return;
                            };

                            var onActionFunction = function() {
                                $scope.updateInProgress = true;

                                // Cancel double check (signature)
                                administrationService.cancelDoubleCheck($scope.model.selectedAdministration)
                                    .then(
                                        function(administrationUpdated) {
                                            if (administrationUpdated !== null && administrationUpdated.data !== null && administrationUpdated.data.HasErrors) {
                                                appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), administrationUpdated.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                                            } else {
                                                $scope.helpers.utils.updateSelectedAdministration(administrationUpdated.data.Result, !$scope.states.prepare);
                                                $scope.administrationPageForm.$setPristine();
                                                onDeleteAdministration();
                                            }
                                        },
                                        function(scError) {
                                            appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), scError.data.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                                        }
                                    )
                                    .finally(function() {
                                        $timeout(function() { $scope.updateInProgress = false; }, 0, false);
                                    });
                            };

                            // Modified administration is signed - prompt for user confirmation
                            appSettingsFactory.displayConfirmation(
                                $scope.cultureManager.resources.translate('PAGE_TITLE'),
                                $scope.cultureManager.resources.translate('CONFIRM_CHANGES_SIGNED_ADMINISTRATION'),
                                $scope.cultureManager.resources.translate('YES'),
                                $scope.cultureManager.resources.translate('NO'),
                                null,
                                onActionFunction,
                                onCloseFunction);
                        } else {
                            onDeleteAdministration();
                        }


                    },
                    redirect: function () {
                        var page = 'rx';
                        if ($scope.states.extraDose === true || ($location.search().admlist === true && $scope.states.toSignOnly !== true))
                            if ($scope.helpers.utils.isRxAdHoc($scope.model.selectedRx))
                                page = 'rx/adhoc';
                            else
                                page = 'rx/management';
                        $scope.pageManager.redirect(page);
                    }

                },
                uiState: {
                    computeInsulinTypeClass: function() {
                        var res = "";
                        var currentWorkflow = $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex];
                        if (angular.isDefined(currentWorkflow)) {
                            if (angular.isDefined(currentWorkflow.insType)) {
                                res = (currentWorkflow.insType.basal == true || currentWorkflow.insType.prandial == true || currentWorkflow.insType.corrective == true)
                                    ? ""
                                    : "invalid";
                            }
                        }
                        return res;
                    },
                    showToggleFlowsheetModeButton: function() {
                        return $scope.states.listMode === false;
                    },
                    isSignBtnDisabled: function () {
                        //!$scope.model.selectedRx.areAdministrationsMustBeSigned
                        if (!$scope.model.selectedAdministration.mustBeSigned || $scope.model.selectedAdministration.verifiedBy !== null || $scope.helpers.utils.isAdministrationStatusNotGiven()
                            || $scope.helpers.utils.isAdministrationStatusCreated() || ($scope.helpers.utils.isAdministrationStatusPrepared() && !$scope.states.prepare && !$scope.states.toSignOnly)
                            || (($scope.helpers.utils.isAdministrationStatusPaused() || $scope.helpers.utils.isAdministrationStatusComplete()) && $scope.helpers.uiState.detail.isContinuousDosageType())
                            || $scope.helpers.uiState.isDataIncomplete($scope.model.selectedAdministration)
                            || !$scope.administrationPageForm.$valid)
                            return true;
                        else 
                            return false;
                    },
                    isSignBtnShow: function () {
                        return $scope.model.selectedAdministration.mustBeSigned;
                        //return $scope.model.selectedRx.areAdministrationsMustBeSigned;
                    },
                    isCancelLastBtnShow: function() {
                        if (angular.isDefined($scope.model.selectedAdministration) && angular.isDefined($scope.model.selectedRx)) {
                            var administrations = Enumerable.From($scope.model.selectedRx.administrations)
                                .Where(function(i) { return i.realizationDateTime !== null && i.cancellationReasonId == null; })
                                .OrderByDescending("$.realizationDateTime").ThenByDescending("$.id");
                            var adms = administrations.ToArray();
                            if (administrations.Any()) {
                                return administrations.First().id == $scope.model.selectedAdministration.id && $scope.model.selectedAdministration.cancellationReasonId == null
                                        && !$scope.helpers.utils.administrationIsStatusPreparedByAdministration(administrations.First());
                            } else {
                                return false;
                            }
                        } else {
                            return false;
                        }
                    },
                    actionButtons: {
                        canSave: function() {
                            var res = false;
                            if (!$scope.administrationPageForm.$dirty)
                                res = true;
                            if (!$scope.administrationPageForm.$valid)
                                res = true;

                            var admStatus = $scope.helpers.data.getCurrentAdministrationStatus();
                            if (admStatus !== null) {
                                if ('CREATED' === admStatus.code)
                                    res = true;
                                if ('PARTIAL' === admStatus.code && (angular.isUndefined($scope.model.selectedAdministration.administrationReasonId) || $scope.model.selectedAdministration.administrationReasonId === null))
                                    res = true;
                                if ('NOTGIVEN' === admStatus.code && (angular.isUndefined($scope.model.selectedAdministration.nonAdministrationReasonId) || $scope.model.selectedAdministration.nonAdministrationReasonId === null))
                                    res = true;
                            }

                            if (res === false && angular.isDefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex])) {
                                if ($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].isComplete() == false)
                                    res = true;
                            }

                            return res;
                        },
                        isSaveAllButtonDisabled: function() {
                            return $scope.administrationPageForm.$dirty || $scope.model.rxs.length <= 1;
                            // return !$scope.administrationPageForm.$valid;
                        },
                        isSaveButtonDisabled: function() {
                            return !$scope.administrationPageForm.$dirty;
                        },
                        isCancelButtonDisabled: function() {
                            return !$scope.administrationPageForm.$dirty;
                        },
                        isNextAdministrationDisabled: function() {
                            return $scope.states.pageListAdministration >= $scope.helpers.data.numberOfPages();
                        },
                        updateKendoInputs: function() {
                            switch ($scope.model.currentWorkflow) {
                                case workflowFactory.workflows.ANTICOAG:
                                    if ($scope.model.currentWorkflows.length > 0)
                                        $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].axaAdvReac.selectedAxaAdvReacCodes = Enumerable.From($scope.helpers.data.workflows.getAxaAdvReacListDesc()).Select(function (i) { return i.code; }).ToArray();
                                    break;
                                case workflowFactory.workflows.DIABETES:
                                    if ($scope.model.currentWorkflows.length > 0)
                                        $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].glyAdvReac.selectedGlyAdvReacCodes = Enumerable.From($scope.helpers.data.workflows.getGlyAdvReacListDesc()).Select(function (i) { return i.code; }).ToArray();
                                    break;
                                case workflowFactory.workflows.PAIN:
                                    if ($scope.model.currentWorkflows.length > 0)
                                        $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].rr.rDesc.selectedRDescCodes = Enumerable.From($scope.helpers.data.workflows.getRDesc()).Select(function (i) { return i; }).ToArray();
                                    break;
                                case workflowFactory.workflows.VITALS:
                                    if ($scope.model.currentWorkflows.length > 0)
                                        $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].rr.rDesc.selectedRDescCodes = Enumerable.From($scope.helpers.data.workflows.getRDesc()).Select(function (i) { return i; }).ToArray();
                                    break;
                                default:
                            }
                            $scope.helpers.utils.setKendoMultiOptions();
                        }
                    },
                    isDataIncomplete: function(nextAdministration) {
                        if (nextAdministration !== null && nextAdministration.administrationStatusId !== null) {
                            var statusAdministration = appSettingsFactory.getDataLookupInstanceById(nextAdministration.administrationStatusId, $scope.model.administrationStatusList);
                            if ($scope.helpers.uiState.detail.isContinuousDosageType() && statusAdministration.code == "COMPLETE")
                                return false;
                            else
                                return ((nextAdministration.administeredDose !== null)
                                        && ((nextAdministration.administeredDose.dispensedDose == null) || (nextAdministration.administeredDose.dispensedDose == 0))
                                        && ((nextAdministration.administeredDose.dispensedAmount == null) || (nextAdministration.administeredDose.dispensedAmount == 0))
                                        && ((nextAdministration.administeredDose.administeredVolume == null) || (nextAdministration.administeredDose.administeredVolume == 0))
                                        && (statusAdministration !== null && statusAdministration.code != "NOTGIVEN")
                                        && ($scope.model.selectedRx.dosageTypeId !== $scope.model.dosageTypes.unquantified.id)
                                        && (!$scope.helpers.utils.isPatch($scope.model.selectedRx.mx.formId)))
                                    || (statusAdministration !== null && (statusAdministration.code == "CREATED"));
                        } else {
                            return true;
                        }
                    },
                    isStatusDisabled: function() {
                        // For a continous the status can be updated for the last realized administration only
                        return (($scope.states.listMode) &&
                        ($scope.helpers.uiState.detail.isContinuousDosageType() &&
                        (Enumerable.From($scope.model.selectedRx.administrations).Where(function(i) {
                            return i.realizationDateTime > $scope.model.selectedAdministration.realizationDateTime;
                        }).Count() > 0)));
                    },
                    detail: {
                        isQuantifiedDosageType: function() { return angular.isDefined($scope.model.selectedRx.dosageTypeId) && $scope.model.selectedRx.dosageTypeId !== null && $scope.model.selectedRx.dosageTypeId === $scope.model.dosageTypes.quantified.id; },
                        isUnquantifiedDosageType: function() { return angular.isDefined($scope.model.selectedRx.dosageTypeId) && $scope.model.selectedRx.dosageTypeId !== null && $scope.model.selectedRx.dosageTypeId === $scope.model.dosageTypes.unquantified.id; },
                        isContinuousDosageType: function() { return angular.isDefined($scope.model.selectedRx.dosageTypeId) && $scope.model.selectedRx.dosageTypeId !== null && $scope.model.selectedRx.dosageTypeId === $scope.model.dosageTypes.continuous.id; },

                        showFormula: function() { return $scope.helpers.uiState.detail.isQuantifiedDosageType() && !$scope.helpers.uiState.detail.showToRemove(); },
                        showContinuous: function() { return $scope.helpers.uiState.detail.isContinuousDosageType(); },
                        showSite: function() { return (($scope.helpers.uiState.detail.isQuantifiedDosageType() || $scope.helpers.uiState.detail.isUnquantifiedDosageType()) && $scope.helpers.utils.isRouteInjectable($scope.model.selectedAdministration.routeId)); },
                        showInfusionSite: function() { return $scope.helpers.uiState.detail.isContinuousDosageType(); },
                        showVolume: function() { return $scope.helpers.uiState.detail.isContinuousDosageType(); },
                        showRate: function() { return $scope.helpers.uiState.detail.isContinuousDosageType(); },
                        showApplicationSite: function() { return angular.isDefined($scope.model.selectedRx.mx) && $scope.helpers.utils.isPatch($scope.model.selectedRx.mx.formId) /* && !$scope.helpers.uiState.detail.showToRemove() */; },
                        showDuration: function() { return (($scope.helpers.uiState.detail.isQuantifiedDosageType() || $scope.helpers.uiState.detail.isUnquantifiedDosageType()) && $scope.helpers.utils.isRouteInjectable($scope.model.selectedAdministration.routeId)); },
                        showBagReplacement: function() { return $scope.helpers.uiState.detail.isContinuousDosageType(); },
                        showToRemove: function() {
                            return $scope.model.selectedAdministration.isRemoval || false;
                        },
                        showToRemoveLeft: function (rx) {
                            var administration = $scope.helpers.utils.getAssociatedAdministration(rx);
                            return angular.isDefined(administration) && angular.isDefined(administration.isRemoval) ? administration.isRemoval : false;
                        }
                    },
                    status: {
                        isAdministrationReasonDisabled: function() {
                            var status = appSettingsFactory.getDataLookupInstanceById($scope.model.selectedAdministration.administrationStatusId, $scope.model.administrationStatusList);
                            return angular.isUndefined(status) || status === null || (status.code !== 'PARTIAL' && status.code !== 'PAUSED');
                        },
                        isNonAdministrationReasonDisabled: function() {
                            var status = appSettingsFactory.getDataLookupInstanceById($scope.model.selectedAdministration.administrationStatusId, $scope.model.administrationStatusList);
                            return angular.isUndefined(status) || status === null || status.code !== 'NOTGIVEN';
                        },
                        isAdministrationReasonPrecisionsDisabled: function() {
                            var status = appSettingsFactory.getDataLookupInstanceById($scope.model.selectedAdministration.administrationStatusId, $scope.model.administrationStatusList);
                            return angular.isUndefined(status) || status === null || (status.code !== 'NOTGIVEN' && status.code !== 'PARTIAL' && status.code !== 'PAUSED');
                        }
                    },
                    workflows: {
                        showFlowsheets: function() {
                            return angular.isDefined($scope.model.selectedRx.metaWorkflows) && $scope.model.selectedRx.metaWorkflows !== null && $scope.model.selectedRx.metaWorkflows.length > 0;
                        },
                        isDetailModeButtonDisabled: function() {
                            var res = true;
                            angular.forEach($scope.model.currentWorkflows, function(aWorkflow) {
                                if (aWorkflow.isSaved())
                                    res = false;
                            });
                            return res;
                        },
                        isListModeButtonDisabled: function() {
                            var allSaved = true;
                            angular.forEach($scope.model.currentWorkflows, function(aWorkflow) {
                                if (aWorkflow.isDraft())
                                    allSaved = false;
                            });
                            var historicWorkflows = $scope.helpers.data.workflows.getHistoricWorkflows($scope.model.currentWorkflow);
                            // list button should be disabled if either of the following is true: 
                            // - no historic workflows are available
                            // - not all current workflows are saved (currently editing a workflow === form is dirty)
                            return (angular.isDefined(historicWorkflows) && historicWorkflows.length == 0)
                                || (allSaved == false)
                                || (angular.isDefined($scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm']) && $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$dirty);
                        },
                        isPreviousWorkflowInstanceDisabled: function() {
                            if ($scope.states.workflowListMode === true)
                                return false;
                            return $scope.model.currentWorkflowInstanceIndex <= 0
                                || $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].isDraft()
                                || (angular.isDefined($scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm']) && $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$dirty);
                        },
                        isNextWorkflowInstanceDisabled: function() {
                            if ($scope.states.workflowListMode === true)
                                return false;
                            var disabled = $scope.model.currentWorkflowInstanceIndex >= $scope.model.currentWorkflows.length - 1
                                || $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].isDraft()
                                || (angular.isDefined($scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm']) && $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$dirty);

                            return disabled;
                        },
                        isNewWorkflowInstanceDisabled: function() {
                            if (angular.isUndefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex])) {
                                return false;
                            }
                            if ($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].isDraft()
                                || (angular.isDefined($scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm']) && $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$dirty))
                                return true;
                            return false;
                        },
                        isRemoveWorkflowInstanceDisabled: function() {
                            if ($scope.states.workflowListMode === true)
                                return false;
                            if (angular.isUndefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex])
                                || $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].isDraft()
                                || (angular.isDefined($scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm']) && $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$dirty))
                                return true;
                            return false;
                        },
                        isSaveWorkflowInstanceDisabled: function() {
                            if ($scope.states.workflowListMode === true)
                                return false;
                            var workflow = $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex];
                            if ((angular.isUndefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex])
                                //|| !$scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].isComplete()
                                || (angular.isDefined($scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm']) && $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$pristine)
                                || (angular.isDefined($scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm']) && !$scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$valid))
                                || (angular.isDefined($scope.model.currentWorkflows) &&
                                    angular.isDefined($scope.model.currentWorkflowInstanceIndex) &&
                                    angular.isDefined(workflow.rr) &&
                                    (angular.isDefined(workflow.rr.rDesc) && (angular.isUndefined(workflow.rr.rDesc.selectedRDescCodes) || workflow.rr.rDesc.selectedRDescCodes.length <= 0))))
                                return true;
                            return false;
                        },
                        isImportWorkflowInstanceDisabled: function() {
                            if ($scope.states.workflowListMode === true)
                                return false;
                            if (angular.isUndefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex])
                                || (angular.isDefined($scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm']) && $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$pristine))
                                return true;
                            return false;
                        },
                        isCancelWorkflowInstanceDisabled: function() {
                            if ($scope.states.workflowListMode === true)
                                return false;
                            if (angular.isUndefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex])
                                || ($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].isSaved() &&
                                (angular.isDefined($scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm']) && $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$pristine)))
                                return true;
                            return false;
                        },
                        isAxaAdvReactionSelected: function(axaAdvReaction) {
                            var res = false;
                            if (angular.isDefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex])
                                && angular.isDefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].axaAdvReac)
                                && angular.isDefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].axaAdvReac.list)
                                && angular.isDefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].axaAdvReac.list.length > 0)) {

                                angular.forEach($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].axaAdvReac.list, function(axaAdvReac) {
                                    if (axaAdvReac.data === axaAdvReaction.code)
                                        res = true;
                                });
                            }
                            return res;
                        },
                        isGlyAdvReactionSelected: function(glyAdvReaction) {
                            var res = false;
                            if (angular.isDefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex])
                                && angular.isDefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].glyAdvReac)
                                && angular.isDefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].glyAdvReac.list)
                                && angular.isDefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].glyAdvReac.list.length > 0)) {

                                angular.forEach($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].glyAdvReac.list, function(glyAdvReac) {
                                    if (glyAdvReac.data === glyAdvReaction.code)
                                        res = true;
                                });
                            }
                            return res;
                        },
                        isRDescSelected: function(selRDesc) {
                            var res = false;
                            if (angular.isDefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex])
                                && angular.isDefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].rr.rDesc)
                                && angular.isDefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].rr.rDesc.list))
                                angular.forEach($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].rr.rDesc.list, function(rDesc) {
                                    if (rDesc.data === selRDesc)
                                        res = true;
                                });
                            return res;
                        },
                        isWorkflowAvailable: function(workflow) {
                            var res = false;
                            angular.forEach($scope.model.selectedRx.metaWorkflows, function (aWorkflow) {
                                if (workflow.id === aWorkflow.id)
                                    res = true;
                            });
                            return res;
                        },
                        // determine if a given tab should appear disabled
                        isTabDisabled: function(workflow) {
                            if (angular.isUndefined($scope.model.currentWorkflow)
                                || angular.isUndefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex])
                                || angular.isUndefined($scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm']))
                                return false;
                            if (workflow.code != $scope.model.currentWorkflow.code)
                                return ($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].isDraft()
                                    || $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].$dirty);
                            return false;
                        },
                        breatheingDesconError: function () {
                            if ($scope.model.currentWorkflows.length > 0)
                                return $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].rr.rDesc.list != undefined && $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].rr.rDesc.list.length <= 0;
                            else
                                return false;
                        },
                        tabs: [
                            { active: true },
                            { active: false },
                            { active: false },
                            { active: false },
                        ],
                        isWorkflowFormDisabled: function() {
                            return angular.isUndefined($scope.model.currentWorkflows) || $scope.model.currentWorkflows.length <= 0;
                        },
                        oxygenMinMaxFocus: function () {
                            var oxygenUnit = $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].oxygen.unit;
                            var min = 0.05,
                                max = 15,
                                oxygenDecimals = 2,
                                oxygenaAllowDecimals = true;
                            if (oxygenUnit == "%") {
                                min = 21;
                                max = 100;
                                oxygenDecimals = 0;
                                oxygenaAllowDecimals = false;
                            }
                            $scope.oxygenMin = min;
                            $scope.oxygenMax = max;
                            $scope.oxygenDecimals = oxygenDecimals;
                            $scope.oxygenaAllowDecimals = oxygenaAllowDecimals;
                        },
                        oxygenMinMaxClick: function() {
                            $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].oxygen.amount = undefined;
                            $scope.helpers.uiState.workflows.oxygenMinMaxFocus();
                            $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].oxygenAmount.$setViewValue($scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].oxygenAmount.$viewValue);
                            $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].oxygenAmount.$modelValue = $scope.administrationPageForm[$scope.model.currentWorkflow.code + 'FlowsheetForm'].oxygenAmount.$viewValue;
                        },
                        showAnticoagulantFlowsheet: function () {
                            return $scope.states.workflowListMode == false
                                && $scope.model.currentWorkflow == workflowFactory.workflows.ANTICOAG;
                        },
                        showDiabetesFlowsheet: function () {
                            return $scope.states.workflowListMode == false
                                && $scope.model.currentWorkflow == workflowFactory.workflows.DIABETES;
                        },
                        showPainFlowsheet: function () {
                            return $scope.states.workflowListMode == false
                                && $scope.model.currentWorkflow == workflowFactory.workflows.PAIN;
                        },
                        showVitalsFlowsheet: function () {
                            return $scope.states.workflowListMode == false
                                && $scope.model.currentWorkflow == workflowFactory.workflows.VITALS;
                        }
                    }
                },
                utils: {
                    stringUtils: StringUtils,
                    appSettingsFactory: appSettingsFactory,
                    observationFactory: observationFactory,
                    workflowFactory: workflowFactory,
                    stripDec: function ($event) {
                        if ($event.target.valueAsNumber % 1 == 0)
                            $event.target.valueAsNumber = parseInt($event.target.valueAsNumber);
                    },
                    //doLaunchRxVigilance
                    doLaunchRxVigilanceAdvisorProfessional: function () {
                        rxHelperFactory.doLaunchRxVigilanceAdvisorProfessional($scope.model.parameters.advisorProfessionalCalculationIndexUrl);
                    },
                    isAdministrationStatusCreated: function () {
                        var res = false;
                        var currentStatus = $scope.helpers.data.getCurrentAdministrationStatus();
                        if (currentStatus === null || currentStatus.code === 'CREATED')
                            res = true;
                        return res;
                    },
                    isAdministrationStatusPrepared: function () {
                        var res = false;
                        var currentStatus = $scope.helpers.data.getCurrentAdministrationStatus();
                        if (currentStatus !== null && currentStatus.code === 'PREPARED')
                            res = true;
                        return res;
                    },
                    isAdministrationStatusNotGiven: function () {
                        var res = false;
                        var currentStatus = $scope.helpers.data.getCurrentAdministrationStatus();
                        if (currentStatus !== null && currentStatus.code === 'NOTGIVEN')
                            res = true;
                        return res;
                    },
                    isAdministrationStatusComplete: function () {
                        var res = false;
                        var currentStatus = $scope.helpers.data.getCurrentAdministrationStatus();
                        if (currentStatus !== null && currentStatus.code === 'COMPLETE')
                            res = true;
                        return res;
                    },
                    isAdministrationStatusPartial: function () {
                        var res = false;
                        var currentStatus = $scope.helpers.data.getCurrentAdministrationStatus();
                        if (currentStatus !== null && currentStatus.code === 'PARTIAL')
                            res = true;
                        return res;
                    },
                    isAdministrationStatusPaused: function () {
                        var res = false;
                        var currentStatus = $scope.helpers.data.getCurrentAdministrationStatus();
                        if (currentStatus !== null && currentStatus.code === 'PAUSED')
                            res = true;
                        return res;
                    },
                    isVolumeSpecified: function () {
                        if (angular.isDefined($scope.model.selectedAdministration) && angular.isDefined($scope.model.selectedAdministration.administeredDose))
                        return angular.isDefined($scope.model.selectedAdministration.administeredDose.administeredVolume) && $scope.model.selectedAdministration.administeredDose.administeredVolume != null;
                    },
                    isRateSpecified: function () {
                        if (angular.isDefined($scope.model.selectedAdministration) && angular.isDefined($scope.model.selectedAdministration.administeredDose))
                            return angular.isDefined($scope.model.selectedAdministration.administeredDose.rate) && $scope.model.selectedAdministration.administeredDose.rate != null;
                    },
                    isAmountEmpty: function () {
                        return angular.isUndefined($scope.administrationPageForm.dispensedAmount.$viewValue)
                            || $scope.administrationPageForm.dispensedAmount.$viewValue === "";
                    },
                    isDoseEmpty: function () {
                        return angular.isUndefined($scope.administrationPageForm.dispensedDose.$viewValue)
                    },
                    isApplicationLocationMandatory: function () {
                        return $scope.model.parameters.patchApplicationSiteMandatory && (($scope.model.selectedAdministration.isRemoval || false) === false);
                    },
                    isApplicationLocationEmpty: function () {
                        return angular.isUndefined($scope.model.selectedAdministration.applicationSite) || $scope.model.selectedAdministration.applicationSite == null || $scope.model.selectedAdministration.applicationSite == "";
                    },
                    isDurationRequired: function () {
                        return angular.isDefined($scope.model.selectedAdministration.durationUnitId) && $scope.model.selectedAdministration.durationUnitId != null && $scope.model.selectedAdministration.durationUnitId != '';
                    },
                    isDurationUnitRequired: function () {
                        return angular.isDefined($scope.model.selectedAdministration.duration) && $scope.model.selectedAdministration.duration != null && $scope.model.selectedAdministration.duration != '';
                    },
                    isRouteInjectable: function (routeId) {
                        var result = false;
                        angular.forEach($scope.model.injectableRouteList, function (injectableRoute) {
                            if (injectableRoute.id === routeId)
                                result = true;
                        });
                        return result;
                    },
                    isPatch: function (formId) {
                        //F183	7d-patch
                        //F182	72h-patch
                        //F181	24h-patch
                        //F180	2/week-patch
                        //F179	16h-patch
                        //F178	Patch
                        var formCode = undefined;
                        angular.forEach($scope.model.formList, function (formObj) {
                            if (formObj.id == formId)
                                formCode = formObj.code;
                        });
                        var res = false;
                        if (angular.isDefined(formCode)) {
                            angular.forEach(['F183', 'F182', 'F181', 'F180', 'F179', 'F178'], function (aCode) {
                                if (aCode == formCode)
                                    res = true;
                            });
                        }
                        return res;
                    },
                    getDataLookupShortDesc: function (id, list) {
                        return appSettingsFactory.getDataLookupShortDescriptionById(id, list);
                    },
                    getDataLookupInstance: function (id, list) {
                        return appSettingsFactory.getDataLookupInstanceById(id, list);
                    },
                    getAdministrationStatus: function (id, list) {
                        return $scope.helpers.utils.getDataLookupInstance(id, list);
                    },
                    administrationIsPrepared: function(rx) {
                        return rxHelperFactory.isAdministrationPrepared(rx);
                    },
                    administrationIsStatusPrepared: function (rx) {
                       var bool = false;
                       if (angular.isDefined(rx) && rx != null && angular.isDefined(rx.id)) {
                           var nextAdministration = $scope.helpers.utils.getAssociatedAdministration(rx);
                           if (nextAdministration != null && angular.isDefined(nextAdministration.administrationStatusIdOriginal))
                               bool = $scope.helpers.utils.getAdministrationStatus(nextAdministration.administrationStatusIdOriginal, $scope.model.administrationStatusList).code == "PREPARED";
                        }
                        return bool;
                    },
                    administrationIsStatusPreparedByAdministration: function (administration) {
                        var status;
                        if (angular.isDefined(administration.administrationStatusIdOriginal))
                            status = administration.administrationStatusIdOriginal;
                        else if (angular.isDefined(administration.administrationStatusId))
                            status = administration.administrationStatusId;
                        else
                            return false;

                        return $scope.helpers.utils.getAdministrationStatus(status, $scope.model.administrationStatusList).code == "PREPARED";
                        
                    },
                    administrationHasWorkflows: function (rx) {
                        var bool = false;
                        if (angular.isDefined(rx) && rx != null && angular.isDefined(rx.id)) {
                            var nextAdministration = $scope.helpers.utils.getAssociatedAdministration(rx);
                            if (nextAdministration != null && angular.isDefined(nextAdministration.administrationStatusIdOriginal))
                                bool = nextAdministration.workflowInstances.length > 0;
                        }
                        return bool;
                    },
                    administrationNotSigned: function (rx, nextAdministration) {
                        var bool = false;
                        if (rx != null || nextAdministration != null) {

                            if (nextAdministration == null)
                                nextAdministration = $scope.helpers.utils.getAssociatedAdministration(rx);
    
                            if (rx == null)
                                rx = $scope.model.selectedRx;

                            if (nextAdministration != null) {
                                var administrationStatus = $scope.helpers.utils.getAdministrationStatus(nextAdministration.administrationStatusId, $scope.model.administrationStatusList);
                                if (administrationStatus != null)

                                    bool = nextAdministration.mustBeSigned && !nextAdministration.verifiedBy && !nextAdministration.isRemoval && !nextAdministration.cancellationReasonId &&
                                        administrationStatus.code != "CREATED" && administrationStatus.code != "NOTGIVEN" &&
                                        !((administrationStatus.code == "PAUSED" || administrationStatus.code == "COMPLETE") && rx.dosageTypeId === $scope.model.dosageTypes.continuous.id);
                            }
                    }
                        return bool;
                    },
                    computeAdministrationTimeNote: function() {
                        $scope.model.administrationTimeNote = '';
                        if (angular.isDefined($scope.model.selectedAdministration.plannedDateTime)
                                && $scope.model.selectedAdministration.plannedDateTime !== null
                                && angular.isDefined($scope.model.selectedAdministration.schedule)
                                && $scope.model.selectedAdministration.schedule !== null
                                && angular.isDefined($scope.model.selectedAdministration.schedule.emarAdministrationTimes)
                                && $scope.model.selectedAdministration.schedule.emarAdministrationTimes !== null) {
                            var admTime = new Number($filter('date')($scope.model.selectedAdministration.plannedDateTime, 'HHmm')) + 0;
                            angular.forEach($scope.model.selectedAdministration.schedule.emarAdministrationTimes, function (obj) {
                                if (obj.time == admTime)
                                    $scope.model.administrationTimeNote = StringUtils.isNotBlank(obj.description) ? obj.description : '';
                            });                    
                        }
                    },
                    getParentRx: function(administration) {
                        var rx = undefined;
                        angular.forEach($scope.model.rxs, function (anRx) {
                            if (anRx.id === administration.parentRxId)
                                rx = anRx;
                        });
                        if (angular.isUndefined(rx))
                            throw new Error('Could not resolve parent rx for given administration id [' + administration.id + ']');
                        return rx;
                    },
                    setParentRxIncomplete: function (administration) {
                        var parentRx = $scope.helpers.utils.getParentRx(administration);
                        if (((administration.administeredDose === null || angular.isUndefined(administration.administeredDose.dispensedDose) || administration.administeredDose.dispensedDose === null)
                                && (administration.administeredDose === null || angular.isUndefined(administration.administeredDose.dispensedAmount) || administration.administeredDose.dispensedAmount === null)
                                && (angular.isDefined(parentRx.dosageTypeId) && parentRx.dosageTypeId !== null && parentRx.dosageTypeId === $scope.model.dosageTypes.quantified.id)
                                && !administration.isRemoval)
                            || ((angular.isDefined(parentRx.dosageTypeId) && parentRx.dosageTypeId !== null && parentRx.dosageTypeId === $scope.model.dosageTypes.continuous.id)
                                && ((angular.isUndefined(administration.administeredDose === null || administration.administeredDose.administeredVolume) || administration.administeredDose.administeredVolume === null)
                                && (angular.isUndefined(administration.administeredDose === null || administration.administeredDose.rate) || administration.administeredDose.rate === null)
                                && !administration.isRemoval
                                && ($scope.states.prepare || $scope.states.toSignOnly)
                                || (!$scope.states.listMode && !$scope.states.prepare && !$scope.states.toSignOnly)))
                            ) {
                            parentRx.isIncomplete = true;
                        } else {
                            parentRx.isIncomplete = false;
                        }
                    },
                    setMustBeSignIndicator: function(administration) {
                        var parentRx = $scope.helpers.utils.getParentRx(administration);
                        var status = $scope.helpers.utils.getAdministrationStatus(administration.administrationStatusId, $scope.model.administrationStatusList).code;
                        if ( status == "CREATED" || status == "PREPARED" )
                            administration.mustBeSigned = parentRx.areAdministrationsMustBeSigned;
                    },
                    getAssociatedAdministration: function (rx) {
                        var administration = undefined;
                        angular.forEach($scope.model.administrations, function (anAdministration) {
                            if (anAdministration.parentRxId === rx.id)
                                administration = anAdministration;
                        });
                        //if (angular.isUndefined(administration))
                            //throw new Error('Could not resolve administration for given rx id [' + rx.id + ']');
                        return administration;
                    },
                    getWorkflowObjects: function (workflowObj) {
                        var res = undefined;
                        angular.forEach($scope.model.selectedAdministration.workflowObjects, function (obj) {
                            if (workflowObj.code === obj.code)
                                res = obj;
                        });
                        return res;
                    },
                    isAdministrationIncomplete: function(rx) {
                        var nextAdministration = $scope.helpers.utils.getAssociatedAdministration(rx);
                        var rxTypeCode = rxHelperFactory.getRxType(rx, $scope.model.dosageTypeList, $scope.model.rxSchedulePriorityList);
                        return ((rxTypeCode == appSettingsFactory.rxGroupsKey.continuous) || ($scope.helpers.uiState.isDataIncomplete(nextAdministration)));
                    },
                    isRxAdHoc: function (rx) {
                        var sourceCode = appSettingsFactory.getDataLookupCodeById(rx.rxSourceId, $scope.model.sourceList);
                        var isadhoc = (sourceCode == appSettingsFactory.rxGroupsKey.adHoc);
                        return isadhoc;
                    },
                    isPainIntensityMultiChoice: function () {
                        if (angular.isUndefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex])
                                || angular.isUndefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].pain)
                                || angular.isUndefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].pain.scale))
                            return false;
                        return angular.isDefined(observationFactory.painScaleValues($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].pain.scale));
                    },
                    getPainIntensityMin: function () {
                        if (angular.isUndefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex]) || angular.isUndefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].pain))
                            return 0;
                        var rules = observationFactory.painScaleRules($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].pain.scale);
                        return angular.isDefined(rules) ? rules.min : 0;
                    },
                    getPainIntensityMax: function () {
                        if (angular.isUndefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex]) || angular.isUndefined($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].pain))
                            return 60;
                        var rules = observationFactory.painScaleRules($scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex].pain.scale);
                        return angular.isDefined(rules) ? rules.max : 60;
                    },
                    filterAdministration: function (administration) {
                        if (angular.isUndefined(administration) || administration === null)
                            return false;
                        if ($scope.states.toSignOnly) {
                            return (administration.realizationDateTime !== null || administration.prepareDoubleCheckDateTime !== null);
                        } else {
                            return (administration.realizationDateTime !== null);
                        }
                    },
                    dateTimePickerOptions: function (includeMax) {
                        var opts = angular.copy(appSettingsFactory.dateTimePickerOptions);
                        opts.footer = $filter('translate')('POPUP_DATE_TODAY');
                        return opts;
                    },
                    getFirstAvailableWorkflow: function () {
                        var res = undefined;
                        angular.forEach(workflowFactory.workflows, function (aWorkflow) {
                            if (angular.isDefined(res))
                                return;

                            if ($scope.helpers.uiState.workflows.isWorkflowAvailable(aWorkflow))
                                res = aWorkflow;
                        });
                        return res;
                    },
                    extendAdministration: function (administration, updateRealizationDate) {
                        // If no planned datetime, set to current datetime
                        if ($scope.states.listMode === false) { // not in mode list because they are already realized

                            if (angular.isUndefined(administration.administrationStatusIdOriginal))
                                administration.administrationStatusIdOriginal = angular.copy(administration.administrationStatusId);

                            if (angular.isUndefined(administration.prepareDoubleCheckDateTimeOriginal))
                                administration.prepareDoubleCheckDateTimeOriginal = angular.copy(administration.prepareDoubleCheckDateTime);

                            if ($scope.states.prepare) {
                                if (angular.isUndefined(administration.prepareDoubleCheckDateTime) || administration.prepareDoubleCheckDateTime == null) {
                                    administration.prepareDoubleCheckDateTime = new Date();
                                }
                            } else {
                                if (updateRealizationDate) {
                                    var now = new Date();
                                    // New administration
                                    administration.realizationDateTime = appSettingsFactory.convertDateToUtc(now);
                                    administration.realizationDateTime.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                                    
                                    // For Prn, continue, dose only etc >> unplanned rx
                                    if (angular.isUndefined(administration.plannedDateTime) || administration.plannedDateTime == null || $scope.states.extraDose) {
                                        administration.plannedDateTime = administration.realizationDateTime;
                                    }
                                }    
                            }

                            if (administration.isRemoval) {
                                administration.administeredDose.dispensedAmount = undefined;
                                administration.administeredDose.amountUnitId = undefined;
                                administration.administeredDose.dispensedDose = undefined;
                                administration.administeredDose.strengthUnitId = undefined;
                                administration.administeredDose.rate = undefined;
                                administration.administeredDose.rateUnitId = undefined;
                                administration.administeredDose.administeredVolume = undefined;
                                administration.administeredDose.volumeUnitId = undefined;
                            }

                            if (angular.isDefined(administration.administeredDose) && administration.administeredDose != null) {
                                $scope.model.defaultDoseValues = {
                                    dispensedAmount: administration.administeredDose.dispensedAmount,
                                    amountUnitId: administration.administeredDose.amountUnitId,
                                    dispensedDose: administration.administeredDose.dispensedDose,
                                    strengthUnitId: administration.administeredDose.strengthUnitId,
                                    rate: administration.administeredDose.rate,
                                    rateUnitId: administration.administeredDose.rateUnitId,
                                    administeredVolume: administration.administeredDose.administeredVolume,
                                    volumeUnitId: administration.administeredDose.volumeUnitId
                                };
                            }

                            if ($scope.helpers.uiState.detail.showDuration()) {
                                if (administration.duration != null && (angular.isUndefined(administration.durationUnitId) || administration.durationUnitId == null))
                                    administration.durationUnitId = $scope.model.defaultTimeUnit.id;
                            }
                        }
                    },
                    getSelectedAdministration: function (administration) {
                        var targetAdministration;
                        var admins = Enumerable.From($scope.model.administrations).Where(function (i) { return i.id == administration.id; });
                        if (admins.Any())
                            targetAdministration = admins.First();
                        else
                            targetAdministration = Enumerable.From($scope.model.administrations).Where(function (i) { return i.parentRxId == administration.parentRxId; }).First();

                        var targetAdmIndex = $scope.model.administrations.indexOf(targetAdministration);
                    },
                    updateSelectedAdministration: function (administration, updateRealizationDate) {
                        $scope.helpers.utils.setParentRxIncomplete(administration);
                        $scope.helpers.utils.extendAdministration(administration, updateRealizationDate);
                        $scope.helpers.utils.initWorkflowObjects(administration);
                        $scope.helpers.utils.setupWorkflowObjects(administration);
                        $scope.model.deletedWorkflows = [];

                        var targetAdministration;
                        var admins = Enumerable.From($scope.model.administrations).Where(function (i) { return i.id == administration.id; });
                        if (admins.Any())
                            targetAdministration = admins.First();
                        else
                            targetAdministration = Enumerable.From($scope.model.administrations).Where(function (i) { return i.parentRxId == administration.parentRxId; }).First();

                        var targetAdmIndex = $scope.model.administrations.indexOf(targetAdministration);
                        if (targetAdmIndex > -1) {
                            $scope.model.administrations[targetAdmIndex] = administration;
                            $scope.helpers.eventHandlers.onSelectAdministration(administration);
                        }

                        // Update currently selected RX
                        var administrations = Enumerable.From($scope.model.selectedRx.administrations).Where(function (i) { return i.id == $scope.model.selectedAdministration.id; });
                        if (administrations.Any()) {
                            var itemUpdated = administrations.First();
                            var index = $scope.model.selectedRx.administrations.indexOf(itemUpdated);
                            if (index > -1) {
                                $scope.model.selectedRx.administrations[index] = $scope.model.selectedAdministration;

                                //We need to put verifiedBy and verificationDateTime to null, to always display the administration in the left block
                                if (angular.isDefined($scope.model.rxOriginal)) {
                                    var adminstrationLeftMenu = angular.copy($scope.model.selectedAdministration);
                                    $scope.model.rxOriginal.administrations[index - (($scope.states.pageListAdministration - 1) * 8)] = adminstrationLeftMenu;
                                }
                            }
                        } else {
                            $scope.model.selectedRx.administrations.push(administration);
                        }
                    },
                    initWorkflowObjects: function (administration) {
                        if (angular.isUndefined(administration.workflowObjects) || administration.workflowObjects.length == 0) {
                            administration.workflowObjects = [
                                { code: workflowFactory.workflows.ANTICOAG.code, workflows: [] },
                                { code: workflowFactory.workflows.DIABETES.code, workflows: [] },
                                { code: workflowFactory.workflows.PAIN.code, workflows: [] },
                                { code: workflowFactory.workflows.VITALS.code, workflows: [] }
                            ];
                        }
                    },
                    setupWorkflowObjects: function (administration) {
                        // Transform existing workflow instances to local workflow objects
                        angular.forEach(administration.workflowInstances, function (workflowInstance) {

                            // Spot current workflow
                            $scope.model.currentWorkflow = workflowFactory.getWorkflowForId(workflowInstance.workflowId);

                            // Locate local workflow object collection
                            var target = undefined;
                            angular.forEach(administration.workflowObjects, function (workflowObj) {
                                if (angular.isDefined(target))
                                    return;
                                if (workflowObj.code === $scope.model.currentWorkflow.code)
                                    target = workflowObj;
                            });

                            // Double check that target collection is found
                            if (angular.isDefined(target)) {
                                // Create new local workflow object
                                var newWorkflowObj = workflowFactory.newWorkflowInstance($scope.model.currentWorkflow);
                                // Initialize from existing workflow instance object
                                newWorkflowObj.fromWorkflowInstance(workflowInstance);
                                // Mark as saved - this is a logical saved sstate
                                newWorkflowObj.save();
                                // Add it to target collection
                                // target.workflows.unshift(newWorkflowObj);
                                target.workflows.push(newWorkflowObj);
                            }
                        });
                    },
                    setKendoMultiOptions: function () {
                        $scope.model.selectAxaAdvReacOptions = {
                            placeholder: $scope.cultureManager.resources.translate("SELECT_ITEMS"),
                            dataTextField: "shortDescription",
                            dataValueField: "code",
                            valuePrimitive: true,
                            autoBind: true,
                            dataSource: $scope.model.axaAdvReacList,
                            enable: !(($scope.helpers.uiState.workflows.isWorkflowFormDisabled()
                            || ($scope.helpers.uiState.workflows.isCancelWorkflowInstanceDisabled() && $scope.helpers.uiState.workflows.isRemoveWorkflowInstanceDisabled())
                            || $scope.helpers.utils.isGracePeriodReached())
                            || ($scope.helpers.utils.changeNotAllowed($scope.permission.marRolesList.MAR_DA_UFlowsheet) && !$scope.helpers.uiState.workflows.isNewWorkflowInstanceDisabled())
                            || !$scope.model.selectedRx.isProcessed
                            || $scope.helpers.utils.isAdministrationCancelled())
                        };

                        $scope.model.selectGlyAdvReacOptions = {
                            placeholder: $scope.cultureManager.resources.translate("SELECT_ITEMS"),
                            dataTextField: "shortDescription",
                            dataValueField: "code",
                            valuePrimitive: true,
                            autoBind: true,
                            dataSource: $scope.model.glyAdvReacList,
                            enable: !(($scope.helpers.uiState.workflows.isWorkflowFormDisabled()
                            || ($scope.helpers.uiState.workflows.isCancelWorkflowInstanceDisabled() && $scope.helpers.uiState.workflows.isRemoveWorkflowInstanceDisabled())
                            || $scope.helpers.utils.isGracePeriodReached())
                            || ($scope.helpers.utils.changeNotAllowed($scope.permission.marRolesList.MAR_DA_UFlowsheet) && !$scope.helpers.uiState.workflows.isNewWorkflowInstanceDisabled())
                            || !$scope.model.selectedRx.isProcessed
                            || $scope.helpers.utils.isAdministrationCancelled())
                        };

                        $scope.helpers.utils.observationFactory.rDescriptionsList = [];
                        angular.forEach($scope.helpers.utils.observationFactory.rDescriptions, function (desc) {
                            var obj = {};
                            obj.shortDescription = $scope.cultureManager.resources.translate(desc);
                            obj.code = desc;

                            $scope.helpers.utils.observationFactory.rDescriptionsList.push(obj);
                        });
                        $scope.model.selectRDescOptions = {
                            placeholder: $scope.cultureManager.resources.translate("SELECT_ITEMS"),
                            dataTextField: "shortDescription",
                            dataValueField: "code",
                            valuePrimitive: true,
                            autoBind: true,
                            dataSource: $scope.helpers.utils.observationFactory.rDescriptionsList,
                            enable: !(($scope.helpers.uiState.workflows.isWorkflowFormDisabled())
                                || ($scope.helpers.uiState.workflows.isCancelWorkflowInstanceDisabled() && $scope.helpers.uiState.workflows.isRemoveWorkflowInstanceDisabled())
                                || $scope.helpers.utils.isGracePeriodReached()
                                || ($scope.helpers.utils.changeNotAllowed($scope.permission.marRolesList.MAR_DA_UFlowsheet) && !$scope.helpers.uiState.workflows.isNewWorkflowInstanceDisabled())
                                || !$scope.model.selectedRx.isProcessed
                                || $scope.helpers.utils.isAdministrationCancelled())
                        };
                    },
                    isInsulinTypeSelected: function () {
                        var res = false;
                        var currentWorkflow = $scope.model.currentWorkflows[$scope.model.currentWorkflowInstanceIndex];
                        if (angular.isDefined(currentWorkflow)) {
                            if (angular.isDefined(currentWorkflow.insType)) {
                                res = (currentWorkflow.insType.basal == true || currentWorkflow.insType.prandial == true || currentWorkflow.insType.corrective == true)
                                    ? true
                                    : false;
                            }
                        }
                        return !res;
                    },
                    canUpdate: function () {
                        var updatePermission = angular.isDefined($scope.model.selectedRx) && $scope.model.selectedRx.isProcessed
                            && permissionsHelperFactory.isAllowed($scope.permission.marRolesList.MAR_DA_UAdministration, $scope.permission.securityContext.mar)
                            && angular.isDefined($scope.model.selectedAdministration) && !$scope.model.selectedAdministration.cancellationReasonId;
                        if (updatePermission == false) {
                            return false;
                        } else {
                            return true;
                        }
                    },

                    changeNotAllowed : function(role) { 
                      return permissionsHelperFactory.isNotAllowed(role, $scope.permission.securityContext.mar); 
                    },

                    isGracePeriodReached: function () {
                        var isPrepared = rxHelperFactory.isAdministrationStatusPrepared($scope.model.selectedRx, $scope.model.administrationStatusList);

                        if (((angular.isDefined($scope.model.selectedRx) && !isPrepared && angular.isDefined($scope.model.selectedRx.realEndTimestamp) && $scope.model.selectedRx.realEndTimestamp != null)
                            || (angular.isDefined($scope.model.selectedRx.cessationTimestamp) && $scope.model.selectedRx.cessationTimestamp != null)) 
                            && !$scope.helpers.utils.isToDocument())
                           {

                            var dateTimestamp = ($scope.model.selectedRx.realEndTimestamp != null) ? $scope.model.selectedRx.realEndTimestamp : $scope.model.selectedRx.cessationTimestamp;
                            return rxHelperFactory.isInDisgrace(dateTimestamp, $scope.model.parameters.gracePeriodForInactivePrescription);
                        } else {
                            return false;
                        }
                    },
                    isToDocument: function () {
                        //checked with original administration status
                        var administrationStatus = appSettingsFactory.getDataLookupInstanceById($scope.model.selectedAdministration.administrationStatusIdOriginal, $scope.model.administrationStatusList);
                        return  (administrationStatus != null) ? (administrationStatus.code == "CREATED" || administrationStatus.code == "PREPARED" ) : false;
                    },
                    isAdministrationCancelled: function () {
                        if (angular.isDefined($scope.model.selectedAdministration) && $scope.model.selectedAdministration.cancellationReasonId) {
                            return true;
                        }
                        return false; 
                    },

                    displayRealizationDateTime: function () {
                        if (angular.isDefined($scope.model.selectedAdministration)) {
                            return !$scope.states.prepare && (!$scope.states.toSignOnly || $scope.model.selectedAdministration.realizationDateTime != null);
                        } else {
                            return false; 
                        }
                    },
                    isPageChange: function() {
                        return $scope.administrationPageForm.$dirty;
                    }
                },

                watches: {
                    selectedAdministrationWatcher: function (newAdministration, oldAdministration, scope) {
                        // both objects are identical
                        if (oldAdministration === newAdministration) 
                            return;
                        // both objects are not signed
                        if (!(newAdministration.verifiedBy !== null && oldAdministration.verifiedBy !== null && newAdministration.verificationDateTime.toString() == oldAdministration.verificationDateTime.toString()))
                            return;
                        // update is in progress
                        if (angular.isDefined($scope.updateInProgress) && $scope.updateInProgress == true) {
                            return;
                        }

                        var o = oldAdministration, n = newAdministration;

                        // Realization date
                        var newRealizationDate, oldRealizationDate;
                        if (angular.isDate(n.realizationDateTimeUTC))
                            newRealizationDate = $filter('datetimeutc')(n.realizationDateTimeUTC);
                        else
                            newRealizationDate = n.realizationDateTimeUTC;

                        if (angular.isDate(o.realizationDateTimeUTC))
                            oldRealizationDate = $filter('datetimeutc')(o.realizationDateTimeUTC);
                        else
                            oldRealizationDate = o.realizationDateTimeUTC;

                        // Preparation date
                        var newPreparationDate, oldPreparationDate;
                        if (angular.isDate(n.prepareDoubleCheckDateTime))
                            newPreparationDate = $filter('datetimeutc')(n.prepareDoubleCheckDateTime);
                        else
                            newPreparationDate = n.prepareDoubleCheckDateTime;

                        if (angular.isDate(o.prepareDoubleCheckDateTime))
                            oldPreparationDate = $filter('datetimeutc')(o.prepareDoubleCheckDateTime);
                        else
                            oldPreparationDate = o.prepareDoubleCheckDateTime;
                        
                        var originStatus = $scope.helpers.utils.getAdministrationStatus(o.administrationStatusIdOriginal, $scope.model.administrationStatusList);
                        if (o.administeredDose.administeredVolume != n.administeredDose.administeredVolume
                            || o.administeredDose.amountUnitId != n.administeredDose.amountUnitId
                            || o.administeredDose.dispensedAmount != n.administeredDose.dispensedAmount
                            || o.administeredDose.dispensedDose != n.administeredDose.dispensedDose
                            || o.administeredDose.isBolus != n.administeredDose.isBolus
                            || o.administeredDose.prescribedDose != n.administeredDose.prescribedDose
                            || o.administeredDose.rate != n.administeredDose.rate
                            || o.administeredDose.strengthUnitId != n.administeredDose.strengthUnitId
                            || o.administeredDose.volumeUnitId != n.administeredDose.volumeUnitId
                            || o.administeredDose.rateUnitId != n.administeredDose.rateUnitId
                            || o.administrationReasonId != n.administrationReasonId
                            || (o.administrationStatusId != n.administrationStatusId && (originStatus == null || originStatus.code != "PREPARED"))
                            || o.applicationSite != n.applicationSite
                            || o.duration != n.duration
                            || o.durationUnitId != n.durationUnitId
                            || o.infusionSiteId != n.infusionSiteId
                            || o.isBagReplacement != n.isBagReplacement
                            || o.nonAdministrationReasonId != n.nonAdministrationReasonId
                            || !angular.equals(oldRealizationDate, newRealizationDate)
                            || !angular.equals(oldPreparationDate, newPreparationDate)
                            || o.routeId != n.routeId
                            || o.siteId != n.siteId) {

                            var onCloseFunction = function () {
                                $scope.updateInProgress = true;

                                var deferred = $q.defer();
                                deferred.promise
                                    .then(function (response) {
                                        var target = undefined;
                                        angular.forEach($scope.model.administrations, function (administration) {
                                            if (angular.isDefined(target))
                                                return;

                                            if (administration.id == oldAdministration.id)
                                                target = administration;
                                        });

                                        if (angular.isUndefined(target))
                                            throw new Error("No administration instance found [id = " + oldAdministration.id + "]");

                                        var index = $scope.model.administrations.indexOf(target);
                                        if (index >= 0)
                                            $scope.model.administrations[index] = $scope.model.selectedAdministration = $scope.model.selectedAdministrationBkp;

                                        scope.helpers.eventHandlers.onSelectAdministration($scope.model.selectedAdministration);
                                        $scope.administrationPageForm.$setPristine();
                                        return true;
                                    })
                                    .then(function (response) {
                                        $timeout(function () { $scope.updateInProgress = false; }, 0, false);
                                    });

                                deferred.resolve(true);
                            };

                            var onActionFunction = function () {
                                $scope.updateInProgress = true;
                                
                                // Cancel double check (signature)
                                administrationService.cancelDoubleCheck(newAdministration)
                                    .then(
                                        function (administrationUpdated) {
                                            if (administrationUpdated !== null && administrationUpdated.data !== null && administrationUpdated.data.HasErrors) {
                                                appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), administrationUpdated.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                                            } else {
                                                $scope.helpers.utils.updateSelectedAdministration(administrationUpdated.data.Result, !$scope.states.prepare);
                                                $scope.administrationPageForm.$setPristine();
                                            }
                                        },
                                        function (scError) {
                                            appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), scError.data.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                                        }
                                    )
                                    .finally(function () {
                                        $timeout(function () { $scope.updateInProgress = false; }, 0, false);
                                    });
                            };

                            $timeout(function () {
                                if ($scope.administrationPageForm.$valid) {
                                    appSettingsFactory.displayConfirmation(
                                        $scope.cultureManager.resources.translate('PAGE_TITLE'),
                                        $scope.cultureManager.resources.translate('CONFIRM_CHANGES_SIGNED_ADMINISTRATION'),
                                        $scope.cultureManager.resources.translate('YES'),
                                        $scope.cultureManager.resources.translate('NO'),
                                        null,
                                        onActionFunction,
                                        onCloseFunction);
                                }
                            }, 0, false);
                        }
                    },
                    realizationDateTimeUTCWatcher: function(newValue, oldValue) {
                        if (angular.isUndefined(newValue) && angular.isUndefined(oldValue))
                            return;

                        if (oldValue != newValue) {
                            $scope.administrationPageForm.$dirty = true;
                            $scope.administrationPageForm.$pristine = false;
                        }

                    },
                    currentWorkflowWatcher: function (newValue, oldValue) {
                        $scope.helpers.uiState.actionButtons.updateKendoInputs();
                    }
                }
            };

            $scope.states = {
                listMode: false,
                fullDisplay: false,
                toSignOnly: false,
                pageListAdministration: 1,
                specificAdministration: false,
                workflowListMode: true,
                extraDose: false,
                isAdvisorProfAvailable: false,
                prepare: false
            };

            $scope.model = {
                // the list of selected RXs
                rxs: [],
                // the correspinding list of administrations
                administrations: [],
                // the currently selected RX
                selectedRx: {},
                // the currently selected administration - in sync with selectedRx
                selectedAdministration: {},
                // a computed administration time note
                administrationTimeNote: '',
                // the list of workflows, in sync with selected workflow tab
                currentWorkflows: [],
                // the selected workflow index, used to navigate in currentWorkflows list above
                currentWorkflowInstanceIndex: 0,
                // The list of historic workflows
                historicWorkflows: {
                    anticoag: [],
                    diabetes: [],
                    pain: [],
                    vitals: []
                },
                deletedWorkflows: [],
                // the selected visit
                selectedVisit: '',

                // Computed list of application sites
                applicationSites: undefined,
                // THe default time unit for injectable administration
                defaultTimeUnit: undefined,
                // A copy of the current administration's dose values
                defaultDoseValues: {},
                // A (utility) copy of the available dosage types
                dosageTypes: {
                    quantified: undefined,
                    unquantified: undefined,
                    continuous: undefined
                },
                // patient loaded in the header
                patient: $scope.$parent.model.patient // Get the patient from the root controller's model.patient
            };

            initialize();

            // Initialization code should go in this function
            function initialize() {
                $scope.cultureManager.resources.shared.load("administration");
                $scope.submitButtonId = '';
                $scope.signedAdministrations = [];
                
                // Get provided RX ids
                var rx = $location.search().rxid
                            ? $location.search().rxid // map to current RX
                            : sessionStorage.getItem(appSettingConstants.selectedRxKey); // Not found in url get it from sessionStorage
                if (angular.isUndefined(rx) || rx === null || rx === "") {
                    $scope.pageManager.redirectToParent();
                    return;
                }

                var rxIds = rx.toString().split(",");
                $scope.states.fullDisplay = (rxIds.length == 1);                

                // See if a specific administration instance is requested. If so, it will be prioritized
                var targetAdministrationId = sessionStorage.getItem(appSettingConstants.selectedAdminKey);

                // Left panel is administration?
                $scope.states.listMode = $location.search().admlist || targetAdministrationId != null || false; // prevent undefined 

                // Administrations to sign only?
                $scope.states.toSignOnly = $location.search().toSign || false; // prevent undefined 

                // extra dose
                $scope.states.extraDose = $location.search().extradose || false; // prevent undefined 

                // The current selectedVisit
                $scope.model.selectedVisit = sessionStorage.getItem(appSettingConstants.selectedVisitKey);

                // Administrations to prepare?
                $scope.states.prepare = $location.search().prepare || false; // prevent undefined 

                var lookupCodes = [
                  appSettingsFactory.dataLookups.axaAdvReac,
                  appSettingsFactory.dataLookups.amountUnit,
                  appSettingsFactory.dataLookups.administrationReason,
                  appSettingsFactory.dataLookups.administrationStatus,
                  appSettingsFactory.dataLookups.dosageType,
                  appSettingsFactory.dataLookups.form,
                  appSettingsFactory.dataLookups.glyAdvReac,
                  appSettingsFactory.dataLookups.infusionSite,
                  appSettingsFactory.dataLookups.nonAdministrationReason,
                  appSettingsFactory.dataLookups.observationType,
                  appSettingsFactory.dataLookups.route,
                  appSettingsFactory.dataLookups.injectableRoute,
                  appSettingsFactory.dataLookups.schedulePriority,
                  appSettingsFactory.dataLookups.site,
                  appSettingsFactory.dataLookups.rxSource,
                  appSettingsFactory.dataLookups.strengthUnit,
                  appSettingsFactory.dataLookups.timeUnit,
                  appSettingsFactory.dataLookups.workflowType,
                  appSettingsFactory.dataLookups.cancellationReason,
                  appSettingsFactory.dataLookups.rxStatus,
                  appSettingsFactory.dataLookups.suspensionReason,
                  appSettingsFactory.dataLookups.cessationReason
                ];

                $q.all({
                    lookups: entrepriseServices.lookup.getMany(lookupCodes),
                    parameters: parameterService.get()
                })
                    .then(function (response) {
                        if (response.parameters.HasErrors || response.lookups.HasErrors) {
                            // TODO: warn, alert?
                        }

                        // A custom orderBy function which sorts by short description, correctly handling special characters 
                        // and upper/lower case strings. This will be applied to all lookup data sets (see below).
                        var orderByShortDescription = function(result) {
                            result.scope[result.property] =
                                Enumerable
                                .From(result.value)
                                .Where(function(i) { return i.isActive == true && angular.isDefined(i.shortDescription); })
                                .OrderBy(function(i) { return StringUtils.normalize(i.shortDescription); })
                                .ToArray();
                        };

                        var orderByShortDescriptionIncludeInactive = function (result) {
                            result.scope[result.property] =
                                Enumerable
                                .From(result.value)
                                .Where(function (i) { return angular.isDefined(i.shortDescription); })
                                .OrderBy(function (i) { return StringUtils.normalize(i.shortDescription); })
                                .ToArray();
                        };

                        // Lookup data
                        entrepriseServices.lookup.set(appSettingsFactory.dataLookups.administrationReason, "administrationReasonList", $scope.model);
                        entrepriseServices.lookup.set(appSettingsFactory.dataLookups.administrationStatus, "administrationStatusList", $scope.model);
                        entrepriseServices.lookup.set(appSettingsFactory.dataLookups.axaAdvReac, "axaAdvReacList", $scope.model);
                        entrepriseServices.lookup.set(appSettingsFactory.dataLookups.dosageType, "dosageTypeList", $scope.model);
                        entrepriseServices.lookup.set(appSettingsFactory.dataLookups.schedulePriority, "rxSchedulePriorityList", $scope.model);
                        entrepriseServices.lookup.set(appSettingsFactory.dataLookups.glyAdvReac, "glyAdvReacList", $scope.model);
                        entrepriseServices
                            .lookup
                            .set(appSettingsFactory.dataLookups.amountUnit, "amountUnitList", $scope.model)
                            .then(orderByShortDescription);
                        entrepriseServices
                            .lookup
                            .set(appSettingsFactory.dataLookups.form, "formList", $scope.model)
                            .then(orderByShortDescription);
                        entrepriseServices
                            .lookup
                            .set(appSettingsFactory.dataLookups.route, "routeList", $scope.model)
                            .then(orderByShortDescription);
                        entrepriseServices
                            .lookup
                            .set(appSettingsFactory.dataLookups.site, "siteList", $scope.model)
                            .then(orderByShortDescription);
                        entrepriseServices
                            .lookup
                            .set(appSettingsFactory.dataLookups.rxSource, "sourceList", $scope.model)
                            .then(orderByShortDescription);
                        entrepriseServices
                            .lookup
                            .set(appSettingsFactory.dataLookups.strengthUnit, "strengthUnitList", $scope.model)
                            .then(orderByShortDescription);
                        entrepriseServices
                            .lookup
                            .set(appSettingsFactory.dataLookups.timeUnit, "timeUnitList", $scope.model)
                            .then(orderByShortDescription);
                        entrepriseServices
                            .lookup
                            .set(appSettingsFactory.dataLookups.infusionSite, "infusionSiteList", $scope.model)
                            .then(orderByShortDescription);
                        entrepriseServices
                            .lookup
                            .set(appSettingsFactory.dataLookups.injectableRoute, "injectableRouteList", $scope.model)
                            .then(orderByShortDescription);
                        entrepriseServices
                            .lookup
                            .set(appSettingsFactory.dataLookups.nonAdministrationReason, "nonAdministrationReasonList", $scope.model)
                            .then(orderByShortDescription);
                        entrepriseServices
                            .lookup
                            .set(appSettingsFactory.dataLookups.volumeUnit, "volumeUnitList", $scope.model)
                            .then(orderByShortDescription);
                        entrepriseServices
                            .lookup
                            .set(appSettingsFactory.dataLookups.rateUnit, "rateUnitList", $scope.model)
                            .then(orderByShortDescription);
                        entrepriseServices
                            .lookup
                            .set(appSettingsFactory.dataLookups.cancellationReason, "cancellationReasonList", $scope.model)
                            .then(orderByShortDescriptionIncludeInactive);
                        entrepriseServices
                            .lookup
                            .set(appSettingsFactory.dataLookups.rxStatus, "statusList", $scope.model)
                            .then(orderByShortDescription);
                        entrepriseServices
                            .lookup
                            .set(appSettingsFactory.dataLookups.suspensionReason, "suspensionReasonList", $scope.model)
                            .then(orderByShortDescription);
                        entrepriseServices
                            .lookup
                            .set(appSettingsFactory.dataLookups.cessationReason, "cessationReasonList", $scope.model)
                            .then(orderByShortDescription);

                        $scope.model.parameters = response.parameters;
                        $scope.states.isAdvisorProfAvailable = appSettingConstants.regexUrl.test(($scope.model.parameters.advisorProfessionalCalculationIndexUrl != null) ? $scope.model.parameters.advisorProfessionalCalculationIndexUrl : '');

                        return $q.all({
                            administrations: administrationService.getByRxIds(rxIds, $scope.states.extraDose),
                            rxs: rxManagementService.getRXS(rxIds, $scope.states.toSignOnly, $scope.states.listMode, $scope.states.pageListAdministration, false)
                        });
                    })
                    .then(function (response) {
                        if (response.rxs.HasErrors || response.administrations.HasErrors) {
                            // TODO: warn, alert?
                        }

                        angular.forEach($scope.model.timeUnitList, function (timeUnit) {
                            if (timeUnit.code === "MIN")
                                $scope.model.defaultTimeUnit = timeUnit;
                        });

                        angular.forEach($scope.model.dosageTypeList, function (dosageType) {
                            if (dosageType.code == 'QUANT')
                                $scope.model.dosageTypes.quantified = dosageType;
                            if (dosageType.code == 'UNQUANT')
                                $scope.model.dosageTypes.unquantified = dosageType;
                            if (dosageType.code == 'CONT')
                                $scope.model.dosageTypes.continuous = dosageType;
                        });

                        if (!observationFactory.isInitialized()) {
                            observationFactory.initialize(entrepriseServices.lookup.get(appSettingsFactory.dataLookups.observationType, true));
                        }
                        if (!workflowFactory.isInitialized()) {
                            workflowFactory.initialize(entrepriseServices.lookup.get(appSettingsFactory.dataLookups.workflowType, true), $scope.model.axaAdvReacList, $scope.model.glyAdvReacList);
                        }

                        // Selected RXs
                        $scope.model.rxs = [];
                        if (response.rxs.Result.length > 0) {
                            angular.forEach(response.rxs.Result, function (rx) {
                                $scope.model.rxs.push(rx);
                            });
                        }

                        // Manage administrations, which may be:
                        // - next planned administrations for contextual RXs
                        // - an already realized administration
                        var administrations = $scope.states.listMode
                            ? $scope.model.rxs[0].administrations // map to current RX's realized administrations
                            : response.administrations.Result; // map to next scheduled administrations, for selected RXs

                        // Ensure we have a collection
                        if (!angular.isArray(administrations))
                            administrations = [administrations]; // convert to array if single object

                        $scope.model.administrations = [];
                        if (administrations.length > 0) {
                            angular.forEach(administrations, function (administration) {
                                // This adds a few attributes to administration objects
                                $scope.helpers.utils.extendAdministration(administration, true);

                                // Initialize workflow objects for given administration object
                                $scope.helpers.utils.initWorkflowObjects(administration);

                                $scope.helpers.utils.setParentRxIncomplete(administration);
                                //Update administration.mustBeSign with rx.areAdministrationsMustbeSign in case of change (realize).
                                $scope.helpers.utils.setMustBeSignIndicator(administration);
                                // Model assignation
                                $scope.model.administrations.push(administration);
                            });

                            $scope.helpers.utils.setKendoMultiOptions();
                        }

                        // If in realize mode, get last 2 historic workflow instances for selected visit id
                        if ($scope.states.listMode === false) {
                            return $q.all({
                                anticoagWorkflowInstances: workflowService.getLatestByVisitId($scope.model.selectedVisit, workflowFactory.workflows.ANTICOAG.id, 2),
                                diabetesWorkflowInstances: workflowService.getLatestByVisitId($scope.model.selectedVisit, workflowFactory.workflows.DIABETES.id, 2),
                                painWorkflowInstances: workflowService.getLatestByVisitId($scope.model.selectedVisit, workflowFactory.workflows.PAIN.id), // Get all historic pain flowsheets - needed for the last pain scale value, if any
                                vitalsWorkflowInstances: workflowService.getLatestByVisitId($scope.model.selectedVisit, workflowFactory.workflows.VITALS.id, 2),
                            });
                        }
                        else {
                            // Just so we have access to the last pain scale value, if any... no matter which mode (list/realize)
                            return $q.all({
                                painWorkflowInstances: workflowService.getLatestByVisitId($scope.model.selectedVisit, workflowFactory.workflows.PAIN.id),
                            });
                        }
                        
                    })
                    .then(function (response) {
                        // Historic workflows are only displayed in list mode
                        if ($scope.states.listMode === false) {
                            if (response.anticoagWorkflowInstances.HasErrors || response.diabetesWorkflowInstances.HasErrors || response.painWorkflowInstances.HasErrors || response.vitalsWorkflowInstances.HasErrors) {
                                // TODO : show error?
                            }
                            $scope.model.historicWorkflows.anticoag = [];
                            angular.forEach(response.anticoagWorkflowInstances.Result, function (anticoag) {
                                var anticoagWorkflow = workflowFactory.newWorkflowInstance(workflowFactory.workflows.ANTICOAG);
                                anticoagWorkflow.fromWorkflowInstance(anticoag);
                                $scope.model.historicWorkflows.anticoag.push(anticoagWorkflow);
                            });
                            $scope.model.historicWorkflows.diabetes = [];
                            angular.forEach(response.diabetesWorkflowInstances.Result, function (diabetes) {
                                var diabetesWorkflow = workflowFactory.newWorkflowInstance(workflowFactory.workflows.DIABETES);
                                diabetesWorkflow.fromWorkflowInstance(diabetes);
                                $scope.model.historicWorkflows.diabetes.push(diabetesWorkflow);
                            });
                            $scope.model.historicWorkflows.pain = [];
                            angular.forEach(response.painWorkflowInstances.Result, function (pain) {
                                var painWorkflow = workflowFactory.newWorkflowInstance(workflowFactory.workflows.PAIN);
                                painWorkflow.fromWorkflowInstance(pain);
                                $scope.model.historicWorkflows.pain.push(painWorkflow);

                                if (angular.isUndefined($scope.model.lastPainScaleValue)) 
                                    $scope.model.lastPainScaleValue = painWorkflow.pain.scale;
                            });
                            $scope.model.historicWorkflows.vitals = [];
                            angular.forEach(response.vitalsWorkflowInstances.Result, function (vitals) {
                                var vitalsWorkflow = workflowFactory.newWorkflowInstance(workflowFactory.workflows.VITALS);
                                vitalsWorkflow.fromWorkflowInstance(vitals);
                                $scope.model.historicWorkflows.vitals.push(vitalsWorkflow);
                            });
                        }
                        else {
                            angular.forEach(response.painWorkflowInstances.Result, function (pain) {
                                var painWorkflow = workflowFactory.newWorkflowInstance(workflowFactory.workflows.PAIN);
                                painWorkflow.fromWorkflowInstance(pain);
                                if (angular.isDefined($scope.model.lastPainScaleValue))
                                    return;

                                $scope.model.lastPainScaleValue = painWorkflow.pain.scale;
                            });
                        }

                        return true;
                    })
                    .then(function (response) {
                        if (response === true) {
                            if ($scope.states.listMode) {
                                // Force selection to first administration in list
                                $scope.model.selectedRx = $scope.model.rxs[0];
                                if (angular.isUndefined($scope.model.selectedRx.rxStatus)) {
                                    $scope.model.selectedRx.rxStatus = appSettingsFactory.getDataLookupInstanceById($scope.model.selectedRx.rxStatusId, $scope.model.statusList);
                                    $scope.model.selectedRx.cessationReason = $scope.model.selectedRx.cessationReasonId != null ? appSettingsFactory.getDataLookupInstanceById($scope.model.selectedRx.cessationReasonId, $scope.model.cessationReasonList) : {};
                                    $scope.model.selectedRx.suspensionReason = $scope.model.selectedRx.suspension != null ? appSettingsFactory.getDataLookupInstanceById($scope.model.selectedRx.suspension.suspensionReasonId, $scope.model.suspensionReasonList) : {};
                                }

                                angular.forEach($scope.model.selectedRx.administrations, function (administration) {
                                    $scope.helpers.utils.extendAdministration(administration, true);
                                    $scope.helpers.utils.initWorkflowObjects(administration);
                                    $scope.helpers.utils.setupWorkflowObjects(administration);
                                });

                                $scope.model.selectedRx.administrations = Enumerable.From($scope.model.selectedRx.administrations)
                                                                                        .Select(function (i) { return i; })
                                                                                        .OrderByDescending("$.realizationDateTime").ThenByDescending("$.id").ToArray();
                                $scope.model.rxOriginal = angular.copy($scope.model.selectedRx);
                                //set targetAdministration 
                                var targetAdministration = Enumerable.From($scope.model.selectedRx.administrations)
                                                                                        .Select(function (i) { return i; })
                                                                                        .OrderByDescending("$.realizationDateTime").ThenByDescending("$.id").FirstOrDefault();
                                $scope.states.fullDisplay = (Enumerable.From($scope.model.selectedRx.administrations).Where(function (i) { return (i.realizationDateTime !== null || i.prepareDoubleCheckDateTime !== null); }).Count() <= 1);
                                if ($scope.states.toSignOnly) {
                                    $scope.helpers.eventHandlers.onSelectAdministration(Enumerable.From($scope.model.selectedRx.administrations).Where(function (i) { return (i.realizationDateTime !== null || i.prepareDoubleCheckDateTime !== null) && i.verificationDateTime == null; }).First());
                                }
                                else {
                                    if (targetAdministrationId !== null && Enumerable.From($scope.model.selectedRx.administrations).Count(function(i) { return i.id == parseInt(targetAdministrationId, 10) ; })) {
                                        if (Enumerable.From($scope.model.selectedRx.administrations).Any(function(i) { return (angular.isDefined(targetAdministrationId) ? i.id == parseInt(targetAdministrationId, 10) : (i.realizationDateTime !== null || i.prepareDoubleCheckDateTime !== null)); }))
                                            $scope.helpers.eventHandlers.onSelectAdministration(Enumerable.From($scope.model.selectedRx.administrations).Where(function(i) { return (angular.isDefined(targetAdministrationId) ? i.id == parseInt(targetAdministrationId, 10) : (i.realizationDateTime !== null || i.prepareDoubleCheckDateTime !== null)); }).First());
                                    }
                                    else
                                    {
                                        $scope.helpers.eventHandlers.onSelectAdministration(Enumerable.From($scope.model.selectedRx.administrations).Where(function (i) { return i.realizationDateTime !== null; }).First());
                                    }
                                }

                            }
                            else {

                                // Force selection to first RX in list
                                $scope.helpers.eventHandlers.onSelectRx($scope.model.rxs[0]);
                            }

                            //
                            // Setup $scope watches
                            //
                            $scope.$watch('model.selectedAdministration', $scope.helpers.watches.selectedAdministrationWatcher, true);
                            $scope.$watch('model.currentWorkflowItem', $scope.helpers.watches.currentWorkflowWatcher, true);

                        }
                    })
                    .catch(function (response) {
                        $log.error(response);
                        $scope.isLoadingBody = false;
                    })
                    .finally(function () {
                        // 
                        $scope.isLoadingBody = false;
                    });

                
            };
            
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

                // Remove rx from the loaded rx list
                var index = $scope.model.rxs.indexOf(data);
                if (index > -1) {
                    $scope.model.rxs.splice(index, 1);
                }

                // Reset the current RX or quit
                if ($scope.model.rxs.length <= 0) {
                    $scope.pageManager.redirectToParent();
                } else {
                    //Select item
                    if (index >= $scope.model.rxs.length) {
                        index -= 1;
                    }
                    $scope.helpers.eventHandlers.onSelectRx($scope.model.rxs[index]);
                }
                onClose(null);
            };
            $scope.onDragMove = function (data, evt) {
                if (!$scope.deleteVisible){
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

            // Trying to navigate to another route
            $rootScope.$on('$locationChangeStart', routeChange);
            function routeChange(event, newUrl) {
                try {
                    destroy();
                } catch (error) {
                    //$log.log(error);
                }
            }

            // Check if the current item has at least one MxComponents
            $scope.hasMxComponents = function () {
                if ($scope.model.selectedRx.mx != null) {
                    return $scope.model.selectedRx.mxComposites.length > 0;
                }

                return false;
            };

            // Open mx components popup
            $scope.displayMxComponentsPopup = function () {
                var scope = $rootScope.$new();
                scope.rx = $scope.model.selectedRx;
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
            
        }
    ]);