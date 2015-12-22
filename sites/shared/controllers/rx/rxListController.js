
'use strict';
angular
    .module('app')
    .controller('rxListController',
    [
        '$rootScope', '$scope', '$anchorScroll', '$http', '$modal', '$filter', '$location', '$window', '$q', 'rxManagementService', 'administrationService', 'locationService', 'rxService',
        'popupService', 'appSettingsFactory', 'parameterService', 'visitService', 'appSettingConstants', 'rxNavigationPathConstants', 'rxHelperFactory', 'dateService', 'entrepriseServices',
        'frequencyTemplateService', 'permissionsHelperFactory', 
        function($rootScope, $scope, $anchorScroll, $http, $modal, $filter, $location, $window, $q, rxManagementService, administrationService, locationService, rxService,
            popupService, appSettingsFactory, parameterService, visitService, appSettingConstants, rxNavigationPathConstants, rxHelperFactory, dateService, entrepriseServices,
            frequencyTemplateService, permissionsHelperFactory ) {
            // Initialize the RX list model
            $scope.model = {
                rxList: [],
                patient: $scope.$parent.model.patient // Get the patient from the root controller's model.patient
            };
            var rxListConstants = {
                processedKey: 'processed',
                notProcessedKey: 'notProcessed',
            };
            $scope.application = 'APPLICATION_A';
            $scope.filters = { dateInactive: null };
            $scope.routeList = [];
            $scope.dosageTypeList = [];
            $scope.rxSchedulePriorityList = [];
            $scope.rxStatusList = [];
            $scope.rxSourceList = [];
            $scope.mxClassList = [];
            $scope.administrationStatusList = [];
            $scope.cessationReasonList = [];
            $scope.suspensionReasonList = [];
            $scope.strengthUnitList = [];
            $scope.amountUnitList = []; 
            $scope.volumeUnitList = [];
            $scope.timeUnitList = [];
            $scope.formList = [];
            $scope.siteList = [];
            $scope.parameter = {};
            $scope.frequencyTemplateList = [];
            $scope.isLoadingBody = true;
            $scope.isEpisodeFound = false;
            //$scope.rateUnitList = [];

            $scope.processedItemCount = 0;
            $scope.notProcessedItemCount = 0;
            $scope.collapsedKey = {
                processed: rxListConstants.processedKey,
                notProcessed: rxListConstants.notProcessedKey
            };
            $scope.collapsed = {
                processed: false,
                notProcessed: false
            };
            //collapse groups var
            $scope.groupCollapsed = {
                processed: [],
                notProcessed: []
            };
            loadGroupsCollapsed();
            $scope.rxGroups = Enumerable.From(angular.copy($scope.groupCollapsed.processed));
            $scope.rxGroupsNotprocessed = Enumerable.From(angular.copy($scope.groupCollapsed.notProcessed));

            $scope.applicationSites = appSettingsFactory.getApplicationLocations();
            loadPermissions();
            $scope.model.patient = angular.extend($scope.model.patient, { isVisitNoteEnabled: isVisitNoteEnabled($scope.model.patient) });
            // Needs to be executed when the patient changes in the parent scope
            $scope.$on('patientChanged', function(event, args) {
                if ($scope.model.patient != args.val) {
                    $scope.model.patient = args.val;
                    $scope.model.patient = angular.extend($scope.model.patient, { isVisitNoteEnabled: isVisitNoteEnabled($scope.model.patient) });

                    rxService.emptyRxsActive();

                    // Initialize the page (load the episode if it can be found)
                    initialize();
                }
            });
            $scope.$on('$locationChangeStart', function (event, next) {
                if (next == 'start-processing') {
                    sessionStorage.removeItem(appSettingConstants.toggleGroups); //reset groups toggle(we want to go back to default values)
                } else {
                    storeGroupsCollapsed();
                }
            });
            $scope.$watch('isEpisodeFound', function() {
                $rootScope.$broadcast('isEpisodeFound', { "value": $scope.isEpisodeFound });
            });
            $scope.$on('logoutEvent', function () {
                appSettingsFactory.logoutAndRedirectToDefault();
            });

            var localScope = $scope;
            var local = this;

            local.inactiveGroup = appSettingsFactory.getRxGroupByKey(appSettingsFactory.rxGroupsKey.inactives);
            local.prescriptions = Enumerable.Empty();
            local.rxInactive = Enumerable.Empty();
            local.rxInactiveNotProcessed = Enumerable.Empty();
            //in allgroups we have groups for processed and groups for unprocessed
            local.allGroups = Enumerable.From($scope.rxGroups.ToArray().concat($scope.rxGroupsNotprocessed.ToArray()));
            //assign collapse attr. from storage or new one
            assignCollapseStateToAllGroups();

            local.list = function() {
                return Enumerable.From($scope.model.rxList);
            };

            local.groups = function() {
                return local.list().Where(function(i) { return i.isGroup; });
            };
            local.group = function(groupIndex, processed) {
                return local.groups().Where(function(i) { return i.groupIndex == groupIndex && i.isGroupProcessed == processed; }).FirstOrDefault();
            };

            local.groupItems = function(groupIndex, processed) {
                return local.list().Where(function(i) { return !i.isGroup && i.groupIndex == groupIndex && i.isGroupProcessed == processed; });
            };

            $scope.dataBind = function() {
                local.allGroups
                    .Where(function(group) { return group.prescriptions.length > 0 || (group.key == appSettingsFactory.rxGroupsKey.inactives && localScope.filters.dateInactive != null); }) //show inactive group if dateinactive even if result is zero
                    .ForEach(function(group) {
                        var groupModel = buildGroupToModel(group);
                        $scope.itemDataBound(groupModel, groupModel.isGroupProcessed);
                        if ($filter('filter')($scope.model.rxList, { groupIndex: group.groupId, isGroupProcessed: group.isProcessed }).length == 0) { //$scope.model.rxList
                            $scope.model.rxList.push(groupModel);
                        } else {
                            //update count for groups of model.rxList, case of inactives
                            if (group.key == appSettingsFactory.rxGroupsKey.inactives) {
                                var items = $filter('filter')($scope.model.rxList, { groupIndex: group.groupId, isGroupProcessed: group.isProcessed });
                                items[0].count = group.prescriptions.length;
                            }
                        }
                        var count = 0;
                        Enumerable.From(group.prescriptions).ForEach(function(rx) {
                            var p = buildItemToModel(rx, group, count);
                            var timeFilter = new Date();
                            timeFilter.setHours(timeFilter.getHours() + parseInt($scope.nextAdministrationSelected.value));

                            // Add next administration filter on regular RX
                            if (($scope.nextAdministrationSelected.value == 0)
                                    || (rx.groupName != appSettingsFactory.rxGroupsKey.schedule)
                                    || (angular.isUndefined(rx.nextAdministration))
                                    || (rx.isProcessed && rx.nextAdministration != null && rx.nextAdministration.plannedDateTime != null && new Date(rx.nextAdministration.plannedDateTime) <= timeFilter)
                            ) {
                                $scope.itemDataBound(p, group.isGroupProcessed);
                                if ($filter('filter')($scope.model.rxList, { id: p.id }).length == 0) {
                                    $scope.model.rxList.push(p);
                                    count++;
                                }
                            }
                        });
                        // Update item count of groups
                        if (groupModel.key != appSettingsFactory.rxGroupsKey.inactives) {
                            groupModel.count = count;
                        }
                    });
                // Remove group regular if it has 0 items
                $scope.model.rxList = Enumerable.From($scope.model.rxList).Where(function(i) {
                    return (!i.isGroup) || (i.groupName != appSettingsFactory.rxGroupsKey.schedule) || (i.isGroup && i.count != 0 && i.groupName == appSettingsFactory.rxGroupsKey.schedule);
                }).ToArray();
                //set collapse of headers according to subgroups
                $scope.setCollapsedState(rxListConstants.processedKey);
                $scope.setCollapsedState(rxListConstants.notProcessedKey);
                //set variable for sections display
                $scope.processedItemCount = processedItemCount(true);
                $scope.notProcessedItemCount = processedItemCount(false); 
            }; // END $scope.dataBind

            $scope.rebind = function(key, processed) {
                local.list().Where(function (i) { return i.isGroupProcessed == (key == rxListConstants.processedKey); }).ForEach(function (item) { $scope.itemDataBound(item, processed); });
                //set variable for sections display
                $scope.processedItemCount = processedItemCount(true); 
                $scope.notProcessedItemCount = processedItemCount(false); 
            };
            $scope.itemDataBound = function(item, processed) {
                var group = local.group(item.groupIndex, processed);
                if (angular.isDefined(group)) {
                    if (item.isGroup) {
                        if (item.groupIndex == local.inactiveGroup.groupId) {
                            item.visible = $scope.showInactive;
                        }
                    } else {
                        item.visible = !group.collapsed;
                        if (item.groupIndex == local.inactiveGroup.groupId) {
                            item.visible = $scope.showInactive && !group.collapsed;
                        }
                    }
                }
            };
            $scope.toggleGroup = function(group) {
                var key = (group.isGroupProcessed) ? $scope.collapsedKey.processed : $scope.collapsedKey.notProcessed;
                group.collapsed = !group.collapsed;
                $scope.rebind(key, group.isGroupProcessed);
                $scope.setCollapsedState(key);
                storeGroupsCollapsed();
            };
            $scope.setCollapsedState = function(key) {
                $scope.collapsed[key] = local.groups().Where(function(i) { return i.isGroupProcessed == (key == rxListConstants.processedKey); }).All(function(g) { return g.collapsed; });
            };
            $scope.toggleAllGroup = function(key) {
                $scope.collapsed[key] = !$scope.collapsed[key];
                //set the toggle for groups
                local.groups().Where(function(i) { return i.isGroupProcessed == (key == rxListConstants.processedKey); }).ForEach(function(g) {
                    g.collapsed = $scope.collapsed[key];
                });
                $scope.rebind(key, (key == rxListConstants.processedKey));
                storeGroupsCollapsed();
            };
            $scope.toggleInactive = function() {
                $scope.showInactive = !$scope.showInactive;
                var group = local.groupItems(local.inactiveGroup.groupId, true);
                var key = (group.isGroupProcessed) ? $scope.collapsedKey.processed : $scope.collapsedKey.notProcessed;
                $scope.rebind(key, group.isGroupProcessed);
                group = local.groupItems(local.inactiveGroup.groupId, false);
                key = (group.isGroupProcessed) ? $scope.collapsedKey.processed : $scope.collapsedKey.notProcessed;
                $scope.rebind(key, group.isGroupProcessed);
            };
            $scope.selectItem = function(item) {
                if (item.selectable) {
                    item.selected = !item.selected;
                    $scope.setSelectedGroupState(local.group(item.groupIndex, item.isGroupProcessed));
                }
            };
            $scope.selectGroupItems = function(item) {
                if (item.selectable) {
                    item.selected = !item.selected;
                    local.groupItems(item.groupIndex, item.isGroupProcessed).ForEach(function(i) { i.selected = item.selected; });
                    $scope.setSelectedGroupState(item);
                }
               
            };

            $scope.setSelectedGroupState = function(item) {
                var items = local.groupItems(item.groupIndex, item.isGroupProcessed);
                item.selected = items.Any(function(i) { return i.selected; });
                item.selectedCount = items.Count(function(i) { return i.selected; });
            }

            // Validate button
            $scope.validateButtonDisabled = function() {
                var selectedNewItemsCount = Enumerable.From($scope.model.rxList).
                    Where(function(i) {
                        return !i.isGroup && i.selected && i.isProcessed && $scope.getRxStatusCode(i.rxStatusId) == appSettingsFactory.rxStatusKey.newRx;
                    }).Count();
                if (selectedNewItemsCount > 0) {
                    return false; // validate button disabled = false
                } else {
                    return true; // validate button disabled = true
                }
            }
            $scope.validateSelectedRx = function () {
                sessionStorage.removeItem(appSettingConstants.selectedAdminKey);
                var selectedItems = Enumerable.From($scope.model.rxList).
                    Where(function(i) {
                        return !i.isGroup && i.selected && i.isProcessed && $scope.getRxStatusCode(i.rxStatusId) == appSettingsFactory.rxStatusKey.newRx;
                    }).
                    Select(function(i) { return i.id; }).ToArray();
                if (selectedItems.length > 0) {
                    var ids = selectedItems.join(',');
                    sessionStorage.setItem(appSettingConstants.selectedRxKey, ids);
                    $scope.pageManager.redirect(rxNavigationPathConstants.validateNavigationPath);
                }
            };

            $scope.showProcessedGroupMenuDivider = function () {
                if (angular.isDefined($scope.grant)) {
                    if (($scope.grant.isAllowedUStopPrescription || $scope.grant.isAllowedUReactivatePrescription || $scope.grant.isAllowedUSuspendPrescription || $scope.grant.isAllowedURemoveSuspPrescription || $scope.grant.isAllowedUCreateAdHocPrescription) &&
                    ($scope.grant.isAllowedRxProcessStart || $scope.grant.isAllowedRxProcessStop)) {
                        return true;
                    }
                }
                return false;
            };

            $scope.showRightMenuDivider = function () {
                if (angular.isDefined($scope.grant)) {
                if ( ($scope.grant.isAllowedUStopPrescription || $scope.grant.isAllowedUReactivatePrescription || $scope.grant.isAllowedUSuspendPrescription || $scope.grant.isAllowedURemoveSuspPrescription) && $scope.grant.isAllowedUCreateAdHocPrescription) {
                    return true;
                }
                }
                return false;
            };

            // Manage button
            $scope.manageButtonDisabled = function() {
                var selectedItemsCount = Enumerable.From($scope.model.rxList).
                    Where(function(i) {
                        return !i.isGroup && i.selected && i.isProcessed &&
                                $scope.getRxStatusCode(i.rxStatusId) != appSettingsFactory.rxStatusKey.newRx &&
                                i.groupName != appSettingsFactory.rxGroupsKey.adHoc &&
                                !rxHelperFactory.isAdhoc(i.rxSourceId, $scope.rxSourceList);
                    }).Count();
                if (selectedItemsCount > 0) {
                    return false; // manage button disabled = false
                } else {
                    return true; // manage button disabled = true
                }
            }
            $scope.manageSelectedRx = function () {
                sessionStorage.removeItem(appSettingConstants.selectedAdminKey);
                var selectedItems = Enumerable.From($scope.model.rxList).Where(function(i) {
                    return !i.isGroup && i.selected && i.isProcessed &&
                           $scope.getRxStatusCode(i.rxStatusId) != appSettingsFactory.rxStatusKey.newRx &&
                           i.groupName != appSettingsFactory.rxGroupsKey.adHoc &&
                           !rxHelperFactory.isAdhoc(i.rxSourceId, $scope.rxSourceList);
                    }).
                    Select(function(i) { return i.id; }).ToArray();
                if (selectedItems.length > 0) {
                    var ids = selectedItems.join(',');
                    sessionStorage.setItem(appSettingConstants.selectedRxKey, ids);
                    $scope.pageManager.redirect(rxNavigationPathConstants.manageNavigationPath);
                }
            };

            // Cease
            $scope.ceaseButtonDisabled = function () {
                var selectedItems = Enumerable.From($scope.model.rxList).Where(function(i) {
                    return !i.isGroup && i.selected && i.isProcessed &&
                        //i.groupName != appSettingsFactory.rxGroupsKey.stat && !i.isLate && !i.isDue &&
                        appSettingsFactory.getDataLookupInstanceById(i.rxStatusId, $scope.rxStatusList).code != appSettingsFactory.rxStatusKey.ceased &&
                        appSettingsFactory.getDataLookupInstanceById(i.rxStatusId, $scope.rxStatusList).code != appSettingsFactory.rxStatusKey.completed &&
                        appSettingsFactory.getDataLookupInstanceById(i.rxStatusId, $scope.rxStatusList).code != appSettingsFactory.rxStatusKey.cancelled &&
                        !isAdministrationStatusPrepared(i);
                }).Select(function(i) { return i.id; }).ToArray();
                if (selectedItems.length > 0) {
                    return false; // cease button disabled = false
                } else {
                    return true; // cease button disabled = true
                }
            };
            $scope.cease = function() {
                var selectedItems = Enumerable.From($scope.model.rxList).Where(function(i) {
                    return !i.isGroup && i.selected && i.isProcessed &&
                        i.groupName != appSettingsFactory.rxGroupsKey.stat && !i.isLate && !i.isDue &&
                        appSettingsFactory.getDataLookupInstanceById(i.rxStatusId, $scope.rxStatusList).code != appSettingsFactory.rxStatusKey.ceased &&
                        appSettingsFactory.getDataLookupInstanceById(i.rxStatusId, $scope.rxStatusList).code != appSettingsFactory.rxStatusKey.completed &&
                        appSettingsFactory.getDataLookupInstanceById(i.rxStatusId, $scope.rxStatusList).code != appSettingsFactory.rxStatusKey.cancelled &&
                        !isAdministrationStatusPrepared(i);
                }).Select(function(i) { return i.id; }).ToArray();
                if (selectedItems.length > 0) {
                    var ids = selectedItems.join(',');
                    //Cease window
                    var scope = $rootScope.$new();
                    scope.ids = [];
                    scope.ids.push(ids);
                    scope.mode = "CEASE";
                    scope.excludeMarkInError = true;
                    var modalInstance = $modal.open({
                        templateUrl: locationService.shared.views + "rx/rx-cease.html",
                        controller: 'rxCeaseController',
                        windowClass: 'rx-cease-modal-window',
                        scope: scope,
                        backdrop: 'static',
                        keyboard: false
                    });
                    modalInstance.result.then(function(itemsCeased) {
                        if (itemsCeased != null && itemsCeased.Result.length > 0) {
                            updateListItems(itemsCeased.Result);
                        }
                        if (itemsCeased != null && itemsCeased.HasErrors) {
                            appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), itemsCeased.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                        }
                    });
                } else {
                    appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('COMPLETE_ADMINISTRATIONS'), $scope.cultureManager.resources.translate('CLOSE'));
                };
            };

            //Update List items
            function updateListItems(items) {
                angular.forEach(items, function(item) {
                    var itemModel = Enumerable.From($scope.model.rxList).Where(function (i) {
                        return !i.isGroup && i.selected && i.id == item.id;
                    }).Select(function(i) { return i; }).First();

                    if (itemModel != null) {
                        $scope.selectItem(itemModel);
                        var newItem = new Lgi.Emr.Mar.Dto.rxDto(angular.extend(item, { groupIndex: rxSetGroup(item), unknownTemplate: unknownTemplate(item), unknownTime: unknownTime(item.schedule) }));
                        if (newItem.groupIndex != itemModel.groupIndex) {
                            
                            // Remove the old from the list
                            $scope.model.rxList = Enumerable.From($scope.model.rxList).Where(function(i) {
                                return i.id != newItem.id;
                            }).ToArray();

                            // Update length old group
                            var itemGroupOld = Enumerable.From($scope.model.rxList).Where(function(i) {
                                return i.isGroup && i.groupIndex == itemModel.groupIndex;
                            }).Select(function(i) { return i; }).First();
                            itemGroupOld.count -= 1;
                            if (itemGroupOld.count <= 0) {
                                $scope.model.rxList = Enumerable.From($scope.model.rxList).Where(function(i) {
                                    return (i.isGroup && i.groupIndex != itemModel.groupIndex) || (!i.isGroup);
                                }).ToArray();
                            }

                            // Remove item from local.allGroups
                            var oldItemGroup = Enumerable.From(local.allGroups).Where(function(i) {
                                return i.groupId == itemModel.groupIndex;
                            }).Select(function(i) { return i; }).First();
                            oldItemGroup.prescriptions = Enumerable.From(oldItemGroup.prescriptions).Where(function(i) {
                                return i.id != newItem.id;
                            }).ToArray();

                            // Insert the new item in the right group
                            // If the group is not in the model, then insert the group first.
                            var newItemGroup = Enumerable.From(local.allGroups).Where(function(i) {
                                return i.groupId == newItem.groupIndex;
                            }).Select(function(i) { return i; }).First();

                            // Check if the new group is in the model
                            var newItemGroupFromModel = Enumerable.From($scope.model.rxList).Where(function(i) {
                                return i.isGroup && i.groupIndex == newItem.groupIndex;
                            }).Select(function(i) { return i; }).ToArray();
                            var itemGroup;
                            if (newItemGroupFromModel.length == 0) {
                                var newGroup = buildGroupToModel(newItemGroup);
                                $scope.itemDataBound(newGroup);
                                if ($filter('filter')($scope.model.rxList, { groupIndex: newItemGroup.groupId }).length == 0) {

                                    var groups = Enumerable.From($scope.model.rxList).Where(function(i) {
                                        return i.isGroup && i.groupIndex > newItem.groupIndex;
                                    }).Select(function(i) { return i; }).ToArray();
                                    if (groups.length > 0) {
                                        var index = $scope.model.rxList.indexOf(groups[0]);
                                        $scope.model.rxList.splice(index, 0, newGroup);
                                    } else {
                                        $scope.model.rxList.push(newGroup);
                                    }
                                }
                                itemGroup = newGroup;
                            } else {
                                itemGroup = Enumerable.From(newItemGroupFromModel).Select(function(i) { return i; }).First();
                            }
                            // Insert the new item in the model.
                            var indexOfGroup = $scope.model.rxList.indexOf(itemGroup);
                            itemGroup.count += 1;
                            newItem = buildItemToModel(newItem, newItemGroup, itemGroup.count - 1);
                            $scope.itemDataBound(newItem);
                            if ($filter('filter')($scope.model.rxList, { id: newItem.id }).length == 0) {
                                $scope.model.rxList.splice(indexOfGroup + itemGroup.count, 0, newItem);
                            }

                        } else {
                            
                            itemModel.rxStatusId = newItem.rxStatusId;
                            itemModel.cessationTimestamp = newItem.cessationTimestamp;
                            itemModel.cessationReasonId = newItem.cessationReasonId;
                            itemModel.cessationReasonDescription = getCessationReasonDescription(newItem.cessationReasonId);
                            itemModel.suspension = newItem.suspension;
                            itemModel.suspensionReasonDescription = ((newItem.suspension != null) ? getSuspensionReasonDescription(newItem.suspension.suspensionReasonId) : "");
                            addExtraFields(itemModel);
                            if (Enumerable.From(newItem.administrations).Count(function (i) { return i.realizationDateTime == null; }) > 0) 
                            {
                                var nextAdministration = getNextAdministrations(newItem).FirstOrDefault();
                                if (nextAdministration != null) itemModel.nextAdministration = addFieldsToNextAdministration(nextAdministration);
                            } else
                            {
                                itemModel.nextAdministration = null;
                            }

                        }
                    } 
                });
            }

            // Reactivate
            $scope.reactivateButtonDisabled = function() {
                var selectedItems = Enumerable.From($scope.model.rxList).Where(function(i) {
                    return !i.isGroup && i.selected && i.isProcessed &&
                        !rxHelperFactory.isAdhoc(i.rxSourceId, $scope.rxSourceList) &&
                        appSettingsFactory.getDataLookupInstanceById(i.rxStatusId, $scope.rxStatusList).code == appSettingsFactory.rxStatusKey.ceased;
                }).Select(function(i) { return i.id; }).ToArray();

                if (selectedItems.length > 0) {
                    return false; // cease button disabled = false
                } else {
                    return true; // cease button disabled = true
                }
            };
            $scope.reactivateCeased = function () {
                var selectedItems = Enumerable.From($scope.model.rxList).Where(function(i) {
                    return !i.isGroup && i.selected && i.isProcessed &&
                        appSettingsFactory.getDataLookupInstanceById(i.rxStatusId, $scope.rxStatusList).code == appSettingsFactory.rxStatusKey.ceased;
                }).Select(function(i) { return i.id; }).ToArray();

                if (selectedItems.length > 0) {
                    var ids = selectedItems.join(',');
                    //Cease window
                    var scope = $rootScope.$new();
                    scope.ids = [];
                    scope.ids.push(ids);
                    scope.mode = "REACTIVATION";
                    scope.excludeMarkInError = true;
                    var modalInstance = $modal.open({
                        templateUrl: locationService.shared.views + "rx/rx-cease.html",
                        controller: 'rxCeaseController',
                        windowClass: 'rx-cease-modal-window',
                        scope: scope,
                        backdrop: 'static',
                        keyboard: false
                    });
                    modalInstance.result.then(function(itemsCeased) {
                        if (itemsCeased != null && itemsCeased.Result.length > 0) {
                            updateListItems(itemsCeased.Result);
                        }
                        if (itemsCeased != null && itemsCeased.HasErrors) {
                            appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), itemsCeased.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                        }
                    });
                }
            };

            // Suspend
            $scope.suspendButtonDisabled = function() {
                var list = [];
                var listSelected = Enumerable.From($scope.model.rxList).Where(function(i) {
                    return !i.isGroup && i.selected && i.isProcessed && !isAdministrationStatusPrepared(i);
                }).Select(function(i) { return i; }).ToArray();
                angular.forEach(listSelected, function(item) {
                    if (canBeSuspended(item)) {
                        list.push(item);
                    }
                });
                if (list.length > 0) {
                    return false; // Suspend button disabled = false
                } else {
                    return true; // No one can be suspended: button disabled = true    
                }
            };

            // Verify if this rx can be suspended
            function canBeSuspended(item) {
                // Can't suspend adhoc rx
                if (rxHelperFactory.isAdhoc(item.rxSourceId, $scope.rxSourceList) &&
                    !item.isProcessed &&
                    !isAdministrationStatusPrepared(item)) {
                    return false;
                } else {
                    var statusItem = appSettingsFactory.getDataLookupInstanceById(item.rxStatusId, $scope.rxStatusList);

                    if (statusItem.code != appSettingsFactory.rxStatusKey.completed && statusItem.code != appSettingsFactory.rxStatusKey.cancelled
                            && statusItem.code != appSettingsFactory.rxStatusKey.ceased
                        //&& !item.isLate && !item.isDue && typeCode.code != appSettingsFactory.rxGroupsKey.stat
                    ) {
                        return true;
                    } else {
                        return false;
                    }
                }
            }

            // Suspend window
            function suspendWindow(mode, ids) {
                //Suspend et stop suspension window
                var scope = $rootScope.$new();
                scope.ids = [];
                scope.ids.push(ids);
                scope.mode = mode;
                scope.excludeMarkInError = true;
                var modalInstance = $modal.open({
                    templateUrl: locationService.shared.views + "rx/rx-suspension.html",
                    controller: 'rxSuspensionController',
                    windowClass: 'modal-window-suspension',
                    scope: scope,
                    backdrop: 'static',
                    keyboard: false
                });
                modalInstance.result.then(function(itemSuspended) {
                    if (itemSuspended != null && itemSuspended.Result.length > 0) {
                        updateListItems(itemSuspended.Result);
                    }
                    if (itemSuspended != null && itemSuspended.HasErrors) {
                        appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), itemSuspended.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                    }
                });
            }

            // Click on suspend
            $scope.suspend = function() {
                //Suspend window
                var selectedItems = Enumerable.From($scope.model.rxList).Where(function(i) {
                    return !i.isGroup && i.selected && i.isProcessed &&
                        i.groupName != appSettingsFactory.rxGroupsKey.stat && !i.isLate && !i.isDue &&
                        appSettingsFactory.getDataLookupInstanceById(i.rxStatusId, $scope.rxStatusList).code != appSettingsFactory.rxStatusKey.completed &&
                        appSettingsFactory.getDataLookupInstanceById(i.rxStatusId, $scope.rxStatusList).code != appSettingsFactory.rxStatusKey.cancelled &&
                        !isAdministrationStatusPrepared(i);
                }).Select(function(i) { return i.id; }).ToArray();

                if (selectedItems.length > 0) {
                    var ids = selectedItems.join(',');
                    suspendWindow("SUSPENSION", ids);
                } else {
                    appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('COMPLETE_ADMINISTRATIONS_SUSPENSION'), $scope.cultureManager.resources.translate('CLOSE'));
                }
            };
            // Stop Suspension
            $scope.stopSuspensionButtonDisabled = function() {
                var list = Enumerable.From($scope.model.rxList).Where(function(i) {
                    return !i.isGroup && i.selected && i.isProcessed &&
                        appSettingsFactory.getDataLookupInstanceById(i.rxStatusId, $scope.rxStatusList).code == appSettingsFactory.rxStatusKey.suspended;
                }).Select(function(i) { return i; }).ToArray();
                if (list.length > 0) {
                    return false; // Button disabled = true
                } else {
                    return true; // No one can be suspended: button disabled = true
                }

            };
            // Click on unsuspend
            $scope.stopSuspension = function() {
                //Suspend window
                var selectedItems = Enumerable.From($scope.model.rxList).Where(function(i) {
                    return !i.isGroup && i.selected && i.isProcessed;
                }).Select(function(i) { return i.id; }).ToArray();

                if (selectedItems.length > 0) {
                    var ids = selectedItems.join(',');
                    suspendWindow("END_SUSPENSION", ids);
                }
            };

            function isStartProcessedItem(item, statusCode) {
                return !item.isGroup && item.selected && !item.isProcessed &&
                       !(item.groupName == appSettingsFactory.rxGroupsKey.terminate) &&
                       !(item.groupName == appSettingsFactory.rxGroupsKey.inactives) &&
                       !(item.groupName == appSettingsFactory.rxGroupsKey.adHoc && statusCode == appSettingsFactory.rxStatusKey.completed);
            };
            // startTreatment btn (rx isProcessed is false)
            $scope.startProcessedButtonDisabled = function () {
                return !local.list().Where(function (i) {
                    var statusCode = $scope.getRxStatusCode(i.rxStatusId);
                    return isStartProcessedItem(i, statusCode);
                }).Any();
            }
            // Click on startTreatment (similar to a verification)
            $scope.startProcessed = function () {
                var selectedItems = local.list().Where(function (i) {
                    return !i.isGroup && i.selected && !i.isProcessed &&
                           !(i.groupName == appSettingsFactory.rxGroupsKey.terminate) &&
                           !(i.groupName == appSettingsFactory.rxGroupsKey.inactives) &&
                           !(i.groupName == appSettingsFactory.rxGroupsKey.adHoc);
                }).Select(function(i) { return i.id; }).ToArray();
                if (selectedItems.length > 0) {
                    var ids = selectedItems.join(',');
                    sessionStorage.setItem(appSettingConstants.selectedRxKey, ids);
                    $scope.pageManager.redirect(rxNavigationPathConstants.startProcessingNavigationPath);
                } else {
                    //try adhoc
                    selectedItems = local.list().Where(function (i) {
                        var statusCode = $scope.getRxStatusCode(i.rxStatusId);
                        return isStartProcessedItem(i, statusCode);
                    }).Select(function (i) { return i.id; }).ToArray();
                    if (selectedItems.length > 0) {
                        var id = selectedItems[0];
                        sessionStorage.setItem(appSettingConstants.selectedRxKey, id);
                        $scope.pageManager.redirect(rxNavigationPathConstants.startAdHocProcessingNavigationPath);
                    }
                }
            }

            function isStopProcessedItem(item, statusCode) {
                return !item.isGroup && item.selected && item.isProcessed && !item.isLate && !item.isDue &&
                       !(item.groupName == appSettingsFactory.rxGroupsKey.stat) &&
                       !(item.groupName == appSettingsFactory.rxGroupsKey.terminate) &&
                       !(item.groupName == appSettingsFactory.rxGroupsKey.inactives) &&
                       !((item.groupName == appSettingsFactory.rxGroupsKey.adHoc && (statusCode == appSettingsFactory.rxStatusKey.completed || statusCode == appSettingsFactory.rxStatusKey.ceased))) &&
                       !isPreparationValidated(item) &&
                       !isLastAdministrationInProgressOrPaused(item) &&
                       !isAdministrationStatusPrepared(item) &&
                       (item.administrationsToSign == 0);
            };
            // stopTreatment btn (rx isProcessed is true)
            $scope.stopProcessedButtonDisabled = function () {
                return !local.list().Where(function (i) {
                    var statusCode = $scope.getRxStatusCode(i.rxStatusId);
                    return isStopProcessedItem(i, statusCode);
                }).Any();
            }
            // Click on stopTreatment
            $scope.stopProcessed = function () {
                sessionStorage.removeItem(appSettingConstants.selectedAdminKey);
                var totalSelectedItems = local.list().Count(function (i) { return !i.isGroup && i.selected; });
                var selectedItems = local.list().Where(function (i) {
                    var statusCode = $scope.getRxStatusCode(i.rxStatusId);
                    return isStopProcessedItem(i, statusCode);
                }).Select(function(i) { return i; }).ToArray();
                if (selectedItems.length > 0) {
                    stopProcessed(selectedItems).then(
                        function (result) {
                            //display msg first
                            var msgInfo = $scope.cultureManager.resources.translate('INFO_RX_STOP_PROCESSED');
                            msgInfo = replaceString(replaceString(msgInfo, '^?', selectedItems.length.toString()),'^?', totalSelectedItems.toString());
                            appSettingsFactory.displayInfo($scope.cultureManager.resources.translate('INFO'), msgInfo, $scope.cultureManager.resources.translate('CLOSE'));
                           // rebuilt list
                            $scope.scResult = result;
                            $scope.model.rxList = [];
                            local.allGroups = Enumerable.From(Enumerable.From(angular.copy($scope.groupCollapsed.processed)).ToArray().concat(Enumerable.From(angular.copy($scope.groupCollapsed.notProcessed)).ToArray()));
                            buildModelList($scope.scResult);
                        },
                        // Error
                        function(error) {   
                        }
                    );
                }
            }

            $scope.addAdHocRx = function() {
                // For later, request to get the patient Id, needed for new Rx
                sessionStorage.removeItem(appSettingConstants.selectedRxKey);
                sessionStorage.removeItem(appSettingConstants.selectedAdminKey);
                //                    
                var isDisplayMxSearchDialog = true;
                sessionStorage.setItem(appSettingConstants.displayMxSearchAtLoadKey,JSON.stringify( isDisplayMxSearchDialog));
                $scope.pageManager.redirect(rxNavigationPathConstants.adhocNavigationPath);
            };

            $scope.onAdministerSelectedRXs = function () {
                sessionStorage.removeItem(appSettingConstants.selectedAdminKey);
                var administrables = getAdministrables();
                if (administrables.length > 0) {
                    var ids = administrables.join();
                    sessionStorage.setItem(appSettingConstants.selectedRxKey, ids);
                    $scope.pageManager.redirect(rxNavigationPathConstants.administrationNavigationPath);
                }
            };

            $scope.administerButtonDisabled = function() {
                return getAdministrables().length <= 0;
            };

            $scope.onPrepareSelectedRXs = function () {
                sessionStorage.removeItem(appSettingConstants.selectedAdminKey);
                var listToPrepare = getListToPrepare();
                if (listToPrepare.length > 0) {
                    var ids = listToPrepare.join();
                    sessionStorage.setItem(appSettingConstants.selectedRxKey, ids);
                    $scope.pageManager.redirect(rxNavigationPathConstants.administrationNavigationPath, [
                        { key: 'prepare', value: true }
                    ]);
                }
            };

            $scope.prepareSelectedAdministrationsButtonDisabled = function() {
                var listToPrepare = getListToPrepare();
                return listToPrepare.length > 0;
            };

            // List RX to Administer
            var getAdministrables = function() {
                // Fetch items that either:
                // - are selected in the list
                // - are prepared
                var administrables = Enumerable.From($scope.model.rxList)
                    .Where(function(i) {
                        var rxStatusCode = undefined;
                        if (angular.isDefined(i.rxStatusId) && i.rxStatusId != null) {
                            var res = appSettingsFactory.getDataLookupInstanceById(i.rxStatusId, $scope.rxStatusList);
                            if (angular.isDefined(res) && res !== null)
                                rxStatusCode = res.code;
                        }
                        return rxHelperFactory.isAdministrable(i, rxStatusCode, $scope.administrationStatusList, $scope.parameter.gracePeriodForInactivePrescription, $scope.dosageTypeList, $scope.frequencyTemplateList) && !i.unknownTemplate && !i.unknownTime && i.isProcessed &&
                        (i.selected || rxHelperFactory.isAdministrationPrepared(i) || isAdministrationStatusPrepared(i)); // is selected
                    })
                    .Select(function(i) {
                        return i.id;
                    })
                    .ToArray();
                $scope.administrables = administrables;
                return administrables;
            };

            // List RX to Prepare
            var getListToPrepare = function() {
                var list = Enumerable.From($scope.model.rxList)
                    .Where(function(i) {
                        var rxStatusCode = undefined;
                        if (angular.isDefined(i.rxStatusId) && i.rxStatusId != null)
                            rxStatusCode = appSettingsFactory.getDataLookupInstanceById(i.rxStatusId, $scope.rxStatusList).code;
                
                        return rxHelperFactory.isAdministrable(i, rxStatusCode, $scope.administrationStatusList, $scope.parameter.gracePeriodForInactivePrescription, $scope.dosageTypeList, $scope.frequencyTemplateList) && !i.unknownTemplate && !i.unknownTime
                               && !i.isGroup && i.selected && i.isProcessed && (i.areAdministrationsMustBeSigned || isAdministrationStatusPrepared(i)) && !isAdministrationPrepared(i)
                               && (Enumerable.From(i.administrations)
                                    .Where(function(j) {
                                        return j.realizationDateTime == null // latest administration
                                            && j.isRemoval == false; // Must not be removal
                                })
                                .Any() ||
                                Enumerable.From(i.administrations)
                                .Where(function(j) {
                                    return j.realizationDateTime == null;
                                })
                                .Count() == 0);
                    })
                    .Select(function(i) {
                        return i.id;
                    })
                    .ToArray();

                return list;
            };

            // Prepare Administration button
            $scope.prepareAdministrationButtonDisabled = function() {
                var administrables = Enumerable.From($scope.model.rxList)
                    .Where(function(i) {
                        var rxStatusCode = undefined;
                        if (angular.isDefined(i.rxStatusId) && i.rxStatusId != null)
                            rxStatusCode = appSettingsFactory.getDataLookupInstanceById(i.rxStatusId, $scope.rxStatusList).code;
                        return !i.isGroup && i.selected && i.isProcessed && !isAdministrationStatusPrepared(i) &&
                               ((rxStatusCode != appSettingsFactory.rxStatusKey.cancelled)
                                    && (rxStatusCode != appSettingsFactory.rxStatusKey.completed)
                                    && (rxStatusCode != appSettingsFactory.rxStatusKey.suspended)
                                    && (i.groupName != appSettingsFactory.rxGroupsKey.suspend)
                                    && (i.groupName != appSettingsFactory.rxGroupsKey.terminate)
                                    && (i.groupName != appSettingsFactory.rxGroupsKey.inactives)
                                    && (!rxHelperFactory.isAdhoc(i.rxSourceId, $scope.rxSourceList))
                            )
                            && (Enumerable.From(i.administrations)
                                .Where(function(j) {
                                    return j.realizationDateTime == null // latest administration
                                        && j.isPreparationValidated == false; // is not prepared
                                })
                                .Any() ||
                                Enumerable.From(i.administrations)
                                .Where(function(j) {
                                    return j.realizationDateTime == null;
                                })
                                .Count() == 0);
                    })
                    .Select(function(i) {
                        return i.id;
                    })
                    .ToArray();

                return administrables.length <= 0;
            };
            $scope.prepareSelectedAdministrations = function () {
                var selectedItems = Enumerable.From($scope.model.rxList)
                    .Where(function(i) {
                        var rxStatusCode = undefined;
                        if (angular.isDefined(i.rxStatusId) && i.rxStatusId != null)
                            rxStatusCode = appSettingsFactory.getDataLookupInstanceById(i.rxStatusId, $scope.rxStatusList).code;
                        return !i.isGroup && i.selected && i.isProcessed && !isAdministrationStatusPrepared(i) &&
                               ((rxStatusCode != appSettingsFactory.rxStatusKey.cancelled)
                                    && (rxStatusCode != appSettingsFactory.rxStatusKey.completed)
                                    && (i.groupName != appSettingsFactory.rxGroupsKey.suspend)
                                    && (i.groupName != appSettingsFactory.rxGroupsKey.terminate)
                                    && (i.groupName != appSettingsFactory.rxGroupsKey.inactives)
                                    && (!rxHelperFactory.isAdhoc(i.rxSourceId, $scope.rxSourceList))
                            )
                            && (Enumerable.From(i.administrations)
                                .Where(function(j) {
                                    return j.realizationDateTime == null // latest administration
                                        && j.isPreparationValidated == false; // is not prepared
                                })
                                .Any() ||
                                Enumerable.From(i.administrations)
                                .Where(function(j) {
                                    return j.realizationDateTime == null;
                                })
                                .Count() == 0);
                    })
                    .Select(function(i) {
                        return i.id;
                    })
                    .ToArray();
                if (selectedItems.length > 0) {
                    // Concatenate the selectem items's ids inside a comma-separated string
                    //var ids = selectedItems.join(',');
                    var ids = selectedItems.join();

                    // Prepare the selected administrations
                    administrationService.prepare(ids)
                        .then(function (scResult) {
                            //console.log(scResult.Result);
                            manageAdministrations(scResult.Result, "prepare");
                        },
                            // Error
                        function (scResult) {
                            if (scResult.HasErrors) {
                                // If some of the selected administrations could not be prepared, display a popup warning the user about this
                                appSettingsFactory.displayWarning($scope.cultureManager.resources.translate('WARNING'), scResult.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                            }
                        });
                }
            };

            // Cancel Administration Preparation button
            $scope.cancelAdministrationPreparationButtonDisabled = function() {
                var selectedItems = getSelectedAdministrations("cancelPreparation");

                if (selectedItems.length > 0) {
                    return false; // cancel administration preparation button disabled = false
                } else {
                    return true; // cancel administration preparation button disabled = true
                }
            };
            $scope.cancelSelectedAdministrationsPreparation = function () {
                var selectedItems = getSelectedAdministrations("cancelPreparation");

                if (selectedItems.length > 0) {
                    // Concatenate the selectem items's ids inside a comma-separated string
                    var ids = selectedItems.join(',');

                    // Cancel the preparatopm of the selected administrations
                    administrationService.cancelPreparation(ids)
                        .then(function(scResult) {
                            manageAdministrations(scResult.Result, "cancelPreparation");
                        },
                         // Error
                        function (scResult) {
                            if (scResult.HasErrors) {
                                // If the preparation of some of the selected administrations could not be cancelled, display a popup warning the user about this
                                appSettingsFactory.displayWarning($scope.cultureManager.resources.translate('WARNING'), scResult.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                            }
                        });
                }
            };

            $scope.administrationIsPrepared = function (item) {
                return isAdministrationPrepared(item);
            };

            $scope.isAdministrationStatusPrepared = function (item) {
                return isAdministrationStatusPrepared(item);
            };

            $scope.administrationHasWorkflows = function (item) {
                var bReturn = false;
                if (item != null) {
                    var nextAdministration = getNextAdministrations(item).FirstOrDefault();
                    if (nextAdministration != null)
                        bReturn = nextAdministration.workflowInstances.length > 0;
                }
                return bReturn;
            };

            $scope.onClickRx = function(item) {
                if ($scope.grant.isAllowedRConsultPrescription) {
                    sessionStorage.removeItem(appSettingConstants.selectedAdminKey);
                    var index = $scope.model.rxList.indexOf(item);
                    if (!$scope.model.rxList[index].isGroup && $scope.getRxSourceCode(item.rxSourceId) != appSettingsFactory.rxSourceKey.adhoc) {
                        sessionStorage.setItem(appSettingConstants.selectedRxKey, item.id);
                        var id = $scope.model.rxList[index].id;
                        var rx = $scope.model.rxList[index];

                        //check if treatment has started
                        if (!item.isGroup && !item.isProcessed) {
                            $scope.pageManager.redirect(rxNavigationPathConstants.startProcessingNavigationPath);
                        } else {
                            // Check if rx/management or rx/validate case of new RX
                            if (!item.isGroup && $scope.getRxStatusCode(item.rxStatusId) == appSettingsFactory.rxStatusKey.newRx) {
                                $scope.pageManager.redirect(rxNavigationPathConstants.validateNavigationPath);
                            } else {
                                $scope.pageManager.redirect(rxNavigationPathConstants.manageNavigationPath);
                            }
                        }
                    } else { //we have an ad hoc
                            id = $scope.model.rxList[index].id;
                            sessionStorage.setItem(appSettingConstants.selectedRxKey, id);
                        if (!item.isGroup && !item.isProcessed) {
                            $scope.pageManager.redirect(rxNavigationPathConstants.startAdHocProcessingNavigationPath);
                        } else {
                            $scope.pageManager.redirect(rxNavigationPathConstants.adhocNavigationPath);
                        }
                    }
                }
            };
            $scope.isAdministrationRealized = function(rx) {
                return rxHelperFactory.isAdministrationRealized(rx);
            };
            $scope.onClickAdministration = function(item, which) {
                if ($scope.grant.isAllowedUAdministerSelectedDrug) {
                    var index = $scope.model.rxList.indexOf(item);
                    var id = null;
                    var administrationId = null;
                    switch (which) {
                    case 'nextAdministration':
                        //Always go to administration even if administration is not planned
                        if (!$scope.model.rxList[index].isGroup && item.isProcessed) {
                            id = $scope.model.rxList[index].id;
                            //check if we have a regular
                            var rxSchedulePriorityCode = appSettingsFactory.getDataLookupCodeById(item.schedule.schedulePriorityId, $scope.rxSchedulePriorityList);
                            var isRegular = (rxSchedulePriorityCode == appSettingsFactory.rxSchedulePriorityKey.regular);
                            //special case for number of dose
                            var rxStatusCode = appSettingsFactory.getDataLookupInstanceById($scope.model.rxList[index].rxStatusId, $scope.rxStatusList).code;
                            //can we do an administration? check is frequecy is completed first
                            if (isRegular && (item.unknownTemplate || item.unknownTime)) {
                                id = 0;
                                appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('FREQUENCY_INCOMPLETE'), $scope.cultureManager.resources.translate('CLOSE'));
                            } else if (!rxHelperFactory.isAdministrable($scope.model.rxList[index], rxStatusCode, $scope.administrationStatusList, $scope.parameter.gracePeriodForInactivePrescription, $scope.dosageTypeList, $scope.frequencyTemplateList)) {
                                id = 0;
                                appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('NO_NEW_ADMINISTRATION'), $scope.cultureManager.resources.translate('CLOSE'));
                            }
                        }
                        break;
                    case 'firstPreviousAdministration':
                        if (!$scope.model.rxList[index].isGroup && $scope.model.rxList[index].firstPreviousAdministration != null) {
                            id = $scope.model.rxList[index].id;
                            administrationId = $scope.model.rxList[index].firstPreviousAdministration.id;
                        }
                        break;
                    case 'secondPreviousAdministration':
                        if (!$scope.model.rxList[index].isGroup && $scope.model.rxList[index].secondPreviousAdministration != null) {
                            id = $scope.model.rxList[index].id;
                            administrationId = $scope.model.rxList[index].secondPreviousAdministration.id;
                        }
                        break;
                    default:
                    }
                    if (id) {
                        sessionStorage.setItem(appSettingConstants.selectedRxKey, id);
                        if (administrationId) {
                            sessionStorage.setItem(appSettingConstants.selectedAdminKey, administrationId);
                        } else {
                            sessionStorage.removeItem(appSettingConstants.selectedAdminKey); 
                        }
                        $scope.pageManager.redirect(rxNavigationPathConstants.administrationNavigationPath);
                    }
                }
            };

            function getSelectedAdministrations(action) {
                // Select the list of selected administrations that have not been prepared yet (PREPARE => isAlreadyPrepared = false) or 
                // that have already been prepared (CANCEL PREPARATION => isAlreadyPrepared = true).
                var selectedItems = Enumerable.From($scope.model.rxList)
                    .Where(function(i) {
                        return !i.isGroup && // this condition makes sure that groups are ignored
                            i.selected && i.isProcessed && // this condition makes sure that only selected items are included
                            (Enumerable.From(i.administrations)
                                .Where(function(j) {
                                    return j.realizationDateTime == null // this condition makes sure that we're using the latest administration
                                        && j.isPreparationValidated == (action == "cancelPreparation" ? true : false);
                                })
                                .Any());
                    })
                    .Select(function(i) {
                        // Select only the id of the administration
                        return Enumerable.From(i.administrations)
                            .Where(function(j) {
                                return j.realizationDateTime == null // this makes sure that we're using the latest administration
                                    && j.isPreparationValidated == (action == "cancelPreparation" ? true : false);
                            })
                            .FirstOrDefault()
                            .id;
                    })
                    .ToArray();

                return selectedItems;
            };

            function manageAdministrations(items, action) {
                // Change the administration's status 
                // if prepare == true, set isPreparationValidated to true
                // if prepare == false, set isPreparationValidated to false
                var itemsToUpdate = [];
                angular.forEach(items, function(item) {
                    try {
                        var rx = Enumerable.From($scope.model.rxList)
                            .Where(function(i) {
                                return !i.isGroup && i.id == item.parentRxId;
                            }).FirstOrDefault();

                        if (angular.isDefined(rx) && rx != null) {
                        
                            var administration = Enumerable.From(rx.administrations)
                                .Where(function(j) {
                                    return j.id == item.id && // get the current administration
                                        j.realizationDateTime == null; // this makes sure that we're using the latest administration
                                }).FirstOrDefault();

                            //inexistant item then we add it
                            if (!angular.isDefined(administration) || administration == null) {
                                rx.administrations.push(item);
                            } else {
                                //administration = item;
                                var index = rx.administrations.indexOf(administration);
                                rx.administrations[index] = item;
                            }
                            rx.nextAdministration = item;
                            rx.isPreparationValidated = (action == "cancelPreparation" ? false : true);

                            itemsToUpdate.push(angular.copy(rx));
                        }

                        //console.log("The prescription's administration was updated successfully. (" + (prepare ? "Prepare administration" : "Cancel administration preparation") + ")");
                    } catch (error) {
                        //console.log("An error occurred: Could not update the prescription's administration. (" + (prepare ? "Prepare administration" : "Cancel administration preparation") + ")");
                    }
                });

                updateListItems(itemsToUpdate);
                itemsToUpdate = [];
                // Unselect all selected prescription groups after update
                var groups = Enumerable.From($scope.model.rxList)
                    .Where(function(i) { return i.isGroup && i.selected && i.isProcessed; })
                    .Select(function(i) { return i; })
                    .ToArray();
                angular.forEach(groups, function(value) {
                    try {
                        $scope.selectGroupItems(value);
                        //console.log("The prescription group was updated successfully. (" + (prepare ? "Prepare administration" : "Cancel administration preparation") + ")");
                    } catch (error) {
                        //console.log("An error occurred: Could not update the prescription group. (" + (prepare ? "Prepare administration" : "Cancel administration preparation") + ")");
                    }
                });

                // Unselect all selected prescriptions after update
                try {
                    Enumerable.From($scope.model.rxList)
                        .Where(function(i) { return !i.isGroup && i.selected && i.isProcessed; })
                        .Select(function(i) {
                            i.selected = false;
                            return i;
                        })
                        .ToArray();

                    //console.log("The prescription was successfully unselected. (" + (prepare ? "Prepare administration" : "Cancel administration preparation") + ")");
                } catch (err) {
                    //console.log("An error occurred: The prescription could not be unselected. (" + (prepare ? "Prepare administration" : "Cancel administration preparation") + ")");
                }
            }

            //notification from popup ctrl
            $scope.$on('loadRxInactive', function(event, data) {
                if (data[0] !== null) {
                    localScope.filters.dateInactive = appSettingsFactory.convertDateToUtc(new Date(data[0]));
                    removeRxInactiveFromModel(); //remove any rxInactive for new result
                    if (angular.isDate(localScope.filters.dateInactive)) {
                        loadRxInactive($scope.application, $scope.model.patient.selectedEpisode.visit.visitID, localScope.filters.dateInactive).then(function() {
                            $scope.showInactive = true;
                            $scope.collapsed[rxListConstants.processedKey] = false;
                            $scope.collapsed[rxListConstants.notProcessedKey] = false;
                            $scope.dataBind();
                            $scope.toggleAllGroup(rxListConstants.processedKey);
                            $scope.toggleAllGroup(rxListConstants.notProcessedKey);
                            $scope.toggleGroup(local.group(local.inactiveGroup.groupId, true));
                            $scope.toggleGroup(local.group(local.inactiveGroup.groupId, false));
                        });
                        sessionStorage.setItem(appSettingConstants.filtersInactiveRxKey, JSON.stringify({ dateInactive: localScope.filters.dateInactive }));
                    }
                } else {
                    localScope.filters.dateInactive = null;
                    removeRxInactive();
                    sessionStorage.removeItem(appSettingConstants.filtersInactiveRxKey);
                }
            });

            //notification from popup ctrl
            $scope.$on('removeRxInactive', function(event, data) {
                localScope.filters.dateInactive = null;
                removeRxInactive();
                sessionStorage.removeItem(appSettingConstants.filtersInactiveRxKey);
            });

            $scope.doSearchInactive = function() {
                popupService.popup(
                {
                    size: 'lg',
                    modal: true
                },
                {
                    templateUrl: locationService.shared.views + "rx/rx-filters-inactive.html",
                    controller:
                    [
                        "$scope", "$modalInstance",
                        function(popupScope, $modalInstance) {
                            popupScope.model = {
                                dateInactiveSince: null,
                                dateInactiveSinceString: '',
                                datePickerOptions: {
                                    format: appSettingConstants.datePickerFormat,
                                    max: appSettingsFactory.convertDateToUtc(new Date()), // max today
                                    footer: $filter('translate')('POPUP_TODAY') //+ " - #=kendo.toString(data, 'd') #" //POPUP_TODAY
                                }
                            };

                            if (angular.isDate(localScope.filters.dateInactive)) {
                                popupScope.model.dateInactiveSince = $filter('date')(localScope.filters.dateInactive, 'yyyy-MM-dd');
                                //popupScope.model.dateInactiveSinceString = $filter('dateutc')(popupScope.model.dateInactiveSince);
                            }

                            popupScope.onDateInactiveChange = function() {
                                //check k-ng-model first (date object)
                                if (popupScope.model.dateInactiveSince > appSettingsFactory.convertDateToUtc(new Date())) {
                                    popupScope.model.dateInactiveSince = appSettingsFactory.convertDateToUtc(new Date());
                                    popupScope.model.dateInactiveSinceString = $filter('dateutc')(popupScope.model.dateInactiveSince);
                                }

                                //check ng-model second (string object)
                                if ((popupScope.model.dateInactiveSince == null) && (popupScope.model.dateInactiveSinceString != '')) {
                                    var tempDate = new Date(popupScope.model.dateInactiveSinceString);
                                    if ((angular.isDate(tempDate)) && (tempDate > appSettingsFactory.convertDateToUtc(new Date()))) {
                                        popupScope.model.dateInactiveSince = appSettingsFactory.convertDateToUtc(new Date());
                                        popupScope.model.dateInactiveSinceString = $filter('dateutc')(popupScope.model.dateInactiveSince);
                                    } else if (isNaN(tempDate.getTime())) { //not a valid date (case of litterals)
                                        popupScope.model.dateInactiveSince = appSettingsFactory.convertDateToUtc(new Date());
                                        popupScope.model.dateInactiveSinceString = $filter('dateutc')(popupScope.model.dateInactiveSince);
                                    }
                                }
                            };

                            popupScope.open = function($event) {
                                $event.preventDefault();
                                $event.stopPropagation();
                            };

                            popupScope.clear = function() {
                                popupScope.model.dateInactiveSince = null;
                                popupScope.model.dateInactiveSinceString = '';
                            };

                            popupScope.onSubmit = function() {
                                $modalInstance.close(popupScope.model.dateInactiveSince);
                                if (angular.isDefined(popupScope.model.dateInactiveSince) && popupScope.model.dateInactiveSince != '') {
                                    $scope.$emit('loadRxInactive', [popupScope.model.dateInactiveSince]);
                                } else {
                                    $scope.$emit('removeRxInactive', []);
                                }
                            };

                            popupScope.onClose = function() {
                                $modalInstance.dismiss('close');
                            };
                        }
                    ]
                });
            };

            $scope.doShowNote = function() {
                popupService.popup(
                {
                    size: 'lg',
                    modal: true
                },
                {
                    templateUrl: locationService.shared.views + "visit/visit-note.html",
                    controller:
                    [
                        "$scope", "$modalInstance",
                        function(popupScope, $modalInstance) {
                            // Initialize the popup model
                            popupScope.model = {
                                note: null,
                                textAreaMaxLength: appSettingConstants.textAreaMaxLength
                            };

                            // Set the note's value in the popup's model
                            popupScope.model.note = $scope.model.patient.currentVisit.administrationNote;

                            popupScope.open = function($event) {
                                $event.preventDefault();
                                $event.stopPropagation();
                            };

                            popupScope.clear = function() {
                                // Empty the note field
                                popupScope.model.note = null;
                            };

                            popupScope.onSubmit = function() {
                                // Close the popup
                                $modalInstance.close(popupScope.model.note);
                                var visit = angular.copy($scope.model.patient.currentVisit);
                                visit.administrationNote = popupScope.model.note;
                                // Save the current visit (i.e. save the note)
                                visitService.save(visit)
                                    .then(
                                        function(scResult) {
                                            // Update the current visit's note with the popup note field's new value
                                            if (scResult != null) {
                                                if (scResult.HasErrors) {
                                                    appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), scResult.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                                                } else {
                                                    $scope.model.patient.currentVisit = scResult.Result;
                                                }
                                            }
                                        }
                                    );
                            };

                            popupScope.onClose = function() {
                                $modalInstance.dismiss('close');
                            };

                            popupScope.onViewHistory = function() {
                                $scope.wndHistory.title($scope.cultureManager.resources.translate('VISIT_HISTORY_TITLE'));
                                $rootScope.historyService.setParams($scope.model.patient.currentVisit.id, 'Visit');
                                $scope.historyWndVisible = true;
                                $scope.wndHistory.center().open();
                                $scope.wndHistory.refresh();
                            };
                        }
                    ]
                });
            };

            $scope.getAdministrationTimes = function(schedule) {
                var strReturn = '';
                var separator = ' - ';
                if (schedule != null) {
                    var administrationTimesList = (schedule.emarAdministrationTimes.length != 0) ? Enumerable.From(schedule.emarAdministrationTimes).OrderBy("$.time") : Enumerable.From(schedule.pharmacyAdministrationTimes).OrderBy("$.time");
                    if (administrationTimesList.Count() > 0) {
                        administrationTimesList.ForEach(function(item) {
                            // strReturn += $filter('hourutc')(item.time) + separator;
                            strReturn += dateService.getDisplayTimeUtcWithHSeperator(item.time) + separator;
                        });
                        strReturn = strReturn.substring(0, strReturn.length - separator.length); //trim last separator
                    }
                }
                return strReturn;
            }
            $scope.getGroupeName = function(item) {
                return $filter('translate')(item.groupName);
            };

            $scope.getAmountUnitDescription = function(id) {
                return getAmountUnitDescription(id);
            };
            $scope.getRouteDescription = function(id) {
                return appSettingsFactory.getDataLookupShortDescriptionById(id, $scope.routeList);
            };
            // form description
            $scope.getFormDescription = function(id) {
                return appSettingsFactory.getDataLookupShortDescriptionById(id, $scope.formList);
            };
            // Dosage Type Code
            $scope.getDosageTypeCode = function(id) {
                return getDosageTypeCode(id);
            };
            // Dosage Type description
            $scope.getDosageTypeDescription = function(id) {
                return appSettingsFactory.getDataLookupShortDescriptionById(id, $scope.dosageTypeList);
            };
            // schedule priority description
            $scope.getSchedulePriorityDescription = function(id) {
                return getSchedulePriorityDescription(id);
            };
            // Rx Status description
            $scope.getRxStatusDescription = function(id) {
                return appSettingsFactory.getDataLookupShortDescriptionById(id, $scope.rxStatusList);
            };
            // Rx Status Code
            $scope.getRxStatusCode = function(id) {
                return appSettingsFactory.getDataLookupCodeById(id, $scope.rxStatusList);
            };
            // Rx Source Code
            $scope.getRxSourceCode = function(id) {
                return appSettingsFactory.getDataLookupCodeById(id, $scope.rxSourceList);
            };
            // mx Class Code
            $scope.getMxClassCode = function(id) {
                return appSettingsFactory.getDataLookupCodeById(id, $scope.mxClassList);
            };

            $scope.getAdministrationStatusDescription = function(id) {
                return getAdministrationStatusDescription(id);
            };
            $scope.getAdministrationStatusCode = function (id) {
                return getAdministrationStatusCode(id); 
            };
            $scope.getSiteListDescription = function(id) {
                return appSettingsFactory.getDataLookupShortDescriptionById(id, $scope.siteList);
            };
            $scope.getFormListDescription = function(id) {
                return appSettingsFactory.getDataLookupShortDescriptionById(id, $scope.formList);
            };
            $scope.getRateUnitListDescription = function(id) {
                return appSettingsFactory.getDataLookupShortDescriptionById(id, $scope.rateUnitList);
            };

            // Select another episode
            $scope.changeVisit = function () {

                if (sessionStorage.getItem(appSettingConstants.selectedVisitKey) != $scope.model.patient.selectedEpisode.visit.visitID)
                    rxService.emptyRxsActive();

                //save current episode then refresh
                sessionStorage.setItem(appSettingConstants.selectedVisitKey, $scope.model.patient.selectedEpisode.visit.visitID);
                $scope.model.rxList = [];
                
                local.allGroups = Enumerable.From(Enumerable.From(angular.copy($scope.groupCollapsed.processed)).ToArray().concat(Enumerable.From(angular.copy($scope.groupCollapsed.notProcessed)).ToArray()));
                // Fetch the list of visits that exist in the MADM database

                $scope.isEpisodeFound = false;
                if($scope.model.patient.currentVisit != null)
                    $scope.isLoadingBody = true;

                $q.all({
                    visit: visitService.get($scope.model.patient.selectedEpisode.visit.visitID),
                    frequency: frequencyTemplateService.getTemplateList(),
                    rxs: rxService.getActive($scope.application, $scope.model.patient.selectedEpisode.visit.visitID, true)
                })
                .then(function(response) {
                    if (!response.frequency.HasErrors) {
                        $scope.frequencyTemplateList = $filter('orderBy')(response.frequency, 'code');
                    }
                    if (response.rxs.HasErrors) {
                        $scope.showInactive = false;
                        appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), response.rxs.data.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                        $scope.isEpisodeFound = false;                        
                    } else {
                        if (response.visit.visitId != null) {
                            // Get the current visit
                            $scope.model.patient.currentVisit = response.visit;
                            $scope.model.patient = angular.extend($scope.model.patient, { isVisitNoteEnabled: isVisitNoteEnabled($scope.model.patient) });
                        } else {
                            // Set the current visit to null
                            $scope.model.patient.currentVisit = null;
                            $scope.model.patient = angular.extend($scope.model.patient, { isVisitNoteEnabled: isVisitNoteEnabled($scope.model.patient) });
                        }
                        $scope.scResult = response.rxs;
                        if (response.rxs.Result.length > 0) {
                            buildModelList(response.rxs);
                        }
                        //Update inactive
                        if (angular.isDate(localScope.filters.dateInactive)) {
                            loadRxInactive($scope.application, $scope.model.patient.selectedEpisode.visit.visitID, localScope.filters.dateInactive).then(function () {
                                assignCollapseStateToAllGroups();
                                $scope.dataBind();
                            });
                        }
                        $scope.isEpisodeFound = $scope.model.patient.currentVisit != null && $scope.model.rxList.length > 0;
                    }
                    $scope.isLoadingBody = false;
                })
                .catch(function (response) {
                    $scope.model.patient.currentVisit = null;
                    $scope.isLoadingBody = false;

                    if (angular.isDefined(response.data) && angular.isDefined(response.data.HasErrors) && response.data.HasErrors)
                        appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), response.data.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                    
                })
                .finally(function () {
                    
                });
            };

            // Filter next administration only for RX regular
            $scope.changeNextAdministrationFilter = function(nextAdministrationSelected) {
                $scope.nextAdministrationSelected = nextAdministrationSelected;
                sessionStorage.setItem(appSettingConstants.selectedNextAdministrationKey, nextAdministrationSelected.index);
                //Use filter for next administrations
                if (angular.isDefined($scope.scResult)) {
                    //save toggle collapse groups
                    storeGroupsCollapsed();
                    assignCollapseStateToAllGroups();
                    $scope.model.rxList = [];
                    local.allGroups.prescriptions = Enumerable.Empty();
                    buildModelList($scope.scResult);
                }
            };

            $scope.onAdministerClickedRx = function(item) {
                if (item.administrationsToSign > 0) {
                    sessionStorage.setItem(appSettingConstants.selectedRxKey, item.id);
                    $scope.pageManager.redirect(rxNavigationPathConstants.administrationNavigationPath, [
                        { key: 'admlist', value: true },
                        { key: 'toSign', value: true }
                    ]);
                }
            };

            $scope.getAmountUnitDescription = function(id) {
                return getAmountUnitListDescription(id, $scope.amountUnitList);
            };
            $scope.getStrengthUnitDescription = function(id) {
                return getStrengthUnitListDescription(id, $scope.strengthUnitList);
            };

            $scope.getRxNextPlannedDateTime = function(rx) {
                return rxHelperFactory.getRxNextPlannedDateTime(rx.administrations);
            };
            


            function isVisitNoteEnabled(patient) {
                return (angular.isDefined(patient) &&
                    angular.isDefined(patient.currentVisit) &&
                    (patient.currentVisit != null) &&
                    $scope.grant.isAllowedRNote);
            }

            // Unknown Template
            function unknownTemplate(item) {
                return rxHelperFactory.unknownTemplate(item, $scope.dosageTypeList);
            };
            $scope.getRxMxClassCode = function (rx){
                return rxHelperFactory.getMxClassCode(rx.mx.mxClassIds, $scope.mxClassList);
            }
            
            // Unknown Time
            function unknownTime(rx) {
                return rxHelperFactory.unknownTime(rx, $scope.frequencyTemplateList, $scope.rxSchedulePriorityList);
            };

            function buildModelList(scResult) {
                var start = new Date().getTime();
                scResult.Result.forEach(function(rx) {
                    angular.extend(rx, { groupIndex: rxSetGroup(rx), unknownTemplate: unknownTemplate(rx), unknownTime: unknownTime(rx) });
                });

                local.prescriptions = Enumerable.From(scResult.Result).Select(function(rx) {
                        //extend rx with groupid for later
                        return new Lgi.Emr.Mar.Dto.rxDto(rx);
                    }).OrderBy(function(rx) { return rxHelperFactory.getRxNextPlannedDateTime(rx.administrations); }) //default OrderBy
                    .ThenBy(function (rx) { return rxHelperFactory.getMxClassCode(rx.mx.mxClassIds, $scope.mxClassList); })
                    .ThenBy("$.mx.pharmacyDescription")
                    .ThenBy("$.startTimestamp")
                    .ThenBy("$.pharmacyId");
                $scope.prescriptions = local.prescriptions.ToArray();

                var groupdIds = local.prescriptions.Distinct(function (x) { return x.groupIndex; }).Select(function (a) { return a.groupIndex; }).ToArray();

               // var start = new Date().getTime();
                local.prescriptions.ForEach(function (rx) {
                    var group = Enumerable.From(local.allGroups).Where(function(i) { return i.groupId == rx.groupIndex && i.isProcessed == rx.isProcessed; });
                    if (group.Any()) {
                        group.First().prescriptions.push(rx);
                    }
                });
                //console.log('Time taken to process local prescription to group prescription ' + (new Date().getTime() - start) + 'ms');

                local.allGroups.Where(function(i) {
                    if (groupdIds.indexOf(i.groupId) > -1) {
                        return true;
                    } else {
                        return false;
                    }
                }).ForEach(function(group) {
                    //check for suspend and terminate, need a special orderby for those
                    switch (group.key) {
                    case appSettingsFactory.rxGroupsKey.suspend:
                        group.prescriptions = Enumerable.From(group.prescriptions).Select()
                            .OrderByDescending("$.suspensionStartTimestamp")
                            .ThenBy("$.mx.pharmacyDescription")
                            .ThenBy("$.pharmacyId").ToArray();
                        break;
                    case appSettingsFactory.rxGroupsKey.terminate:
                        group.prescriptions = Enumerable.From(group.prescriptions).Select()
                            .OrderByDescending("$.stopTimestamp")
                            .ThenBy("$.mx.pharmacyDescription")
                            .ThenBy("$.pharmacyId").ToArray();
                        break;
                    default:
                        break;
                    }
                });
                console.log('Prepare for Data Bind ' + (new Date().getTime() - start) + 'ms');
                start = new Date().getTime();
                $scope.dataBind();
                console.log('Data Bind ' + (new Date().getTime() - start) + 'ms');
            }

            initialize();

            // Initialize content
            function initialize() {
                $scope.cultureManager.resources.shared.load('rx-list');
               

                if ($scope.grant.isAllowedMarDaR) {
                    var lookups = [
                        [appSettingsFactory.dataLookups.rxSource, "rxSourceList"],
                        [appSettingsFactory.dataLookups.rxStatus, "rxStatusList"],
                        [appSettingsFactory.dataLookups.route, "routeList"],
                        [appSettingsFactory.dataLookups.dosageType, "dosageTypeList"],
                        [appSettingsFactory.dataLookups.schedulePriority, "rxSchedulePriorityList"],
                        [appSettingsFactory.dataLookups.administrationStatus, "administrationStatusList"],
                        [appSettingsFactory.dataLookups.cessationReason, "cessationReasonList"],
                        [appSettingsFactory.dataLookups.suspensionReason, "suspensionReasonList"],
                        [appSettingsFactory.dataLookups.strengthUnit, "strengthUnitList"],
                        [appSettingsFactory.dataLookups.amountUnit, "amountUnitList"],
                        [appSettingsFactory.dataLookups.site, "siteList"],
                        [appSettingsFactory.dataLookups.volumeUnit, "volumeUnitList"],
                        [appSettingsFactory.dataLookups.timeUnit, "timeUnitList"],
                        [appSettingsFactory.dataLookups.form, "formList"],
                        [appSettingsFactory.dataLookups.mxClass, "mxClassList"],
                        [appSettingsFactory.dataLookups.rateUnit, "rateUnitList"]
                    ];
                    entrepriseServices.lookup.setMany(lookups, $scope);
                    loadParameter().then(function() {
                         $scope.administrationFilters = appSettingsFactory.getAdministrationFilters();
                         var nextAdm = sessionStorage.getItem(appSettingConstants.selectedNextAdministrationKey);
                         if (nextAdm == null)
                             nextAdm = $scope.parameter.nextAdmDefaultFilter; // as set in parameters
                         $scope.nextAdministrationSelected = Enumerable.From($scope.administrationFilters).Where("$.index == '" + parseInt(nextAdm) + "'").First();
                    });

                    //load at the end of Initialize (we need rxStatusList to proceed)
                    var filters = JSON.parse(sessionStorage.getItem(appSettingConstants.filtersInactiveRxKey), JSON.dateParser);
                    $scope.showInactive = false;
                    if (filters !== null) {
                        localScope.filters.dateInactive = filters.dateInactive;
                        $scope.showInactive = true;
                    }

                    // If the patient entity has already been set in the parent scope (rxController)
                    if ((!angular.equals({}, $scope.$parent.model.patient)) && ($scope.$parent.model.patient != null)) {
                        if ($scope.model.patient.selectedEpisode != null) {
                            // Load the selected episode
                            $scope.changeVisit();
                        } else {
                            // Hide loader
                            $scope.isLoadingBody = false;
                        }
                    }
                }
            }

            function rxSetGroup(rx) {
                //limit to display adHoc in adHoc even if terminated

                var utcnow = appSettingsFactory.reduceTimeZoneOffset(appSettingsFactory.convertDateToUtc(new Date()));
                var adHocLimit = appSettingsFactory.convertDateToUtc(angular.copy((rx.realEndTimestamp != null) ? rx.realEndTimestamp : rx.schedule.stopTimestamp));
                adHocLimit.setUTCHours(rx.schedule.stopTimestamp.getUTCHours() + $scope.parameter.completedAdhocDurationDisplay);

                var completedLimit = appSettingsFactory.convertDateToUtc(angular.copy((rx.realEndTimestamp != null) ? rx.realEndTimestamp : rx.schedule.stopTimestamp));
                completedLimit.setUTCMinutes(completedLimit.getUTCMinutes() + $scope.parameter.completedPrescriptionCount);
                //common to 
                addExtraFields(rx);
                //special Status
                var isNew = rx.statusCode == appSettingsFactory.rxStatusKey.newRx;
                var isCompleted = (rx.statusCode == appSettingsFactory.rxStatusKey.completed);
                //special Groups
                var isAdHoc = (rx.sourceCode == appSettingsFactory.rxGroupsKey.adHoc);
                var isStat = (rx.rxTypeCode == appSettingsFactory.rxGroupsKey.stat);
                var isRegular = (rx.rxTypeCode == appSettingsFactory.rxGroupsKey.schedule);

                var nextAdministrationIsPrepared = $scope.administrationIsPrepared(rx);
                var nextAdministrationStatusPrepared = isAdministrationStatusPrepared(rx);
                var isRxRemainsInGroup = (nextAdministrationIsPrepared || nextAdministrationStatusPrepared || rx.administrationsToSign != 0);
                //STAT, AND STAT suspended or ceased by pharma
                if (isStat && !isAdHoc && !isCompleted
                    || (isStat && !isAdHoc && isRxRemainsInGroup)
                    || (isStat && !isAdHoc && isCompleted && isRxRemainsInGroup)
                    
                ) {
                    return local.allGroups.Where(function(group) { return group.key == appSettingsFactory.rxGroupsKey.stat && group.isProcessed == rx.isProcessed; }).First().groupId;
                }
                if ((isAdHoc || isRegular
                            || (rx.statusCode == appSettingsFactory.rxStatusKey.suspended && (rx.suspension === null || !rx.suspension.isMarSuspension) && nextAdministrationIsPrepared && nextAdministrationStatusPrepared)
                            || (rx.statusCode == appSettingsFactory.rxStatusKey.ceased && !rx.isMarCessation && nextAdministrationIsPrepared && nextAdministrationStatusPrepared))
                        && (rx.isLate)
                ) {
                    return local.allGroups.Where(function(group) {
                        return group.key == appSettingsFactory.rxGroupsKey.late && (group.isProcessed == rx.isProcessed);
                    }).First().groupId;
                }
                if ((isAdHoc || isRegular
                            || (rx.statusCode == appSettingsFactory.rxStatusKey.suspended && (rx.suspension === null || !rx.suspension.isMarSuspension) && nextAdministrationIsPrepared && nextAdministrationStatusPrepared)
                            || (rx.statusCode == appSettingsFactory.rxStatusKey.ceased && !rx.isMarCessation && nextAdministrationIsPrepared))
                        && (rx.isDue)
                ) {
                    return local.allGroups.Where(function(group) { return group.key == appSettingsFactory.rxGroupsKey.due && (group.isProcessed == rx.isProcessed); }).First().groupId;
                }
                // check for rx Source if group.key  is Ad Hoc
                if (isAdHoc || (isAdHoc && isCompleted && adHocLimit >= utcnow)) {
                    return local.allGroups.Where(function(group) { return group.key == appSettingsFactory.rxGroupsKey.adHoc && (group.isProcessed == rx.isProcessed); }).First().groupId;
                }
                //test for suspended, terminated, canceled first 
                if (rx.statusCode == appSettingsFactory.rxStatusKey.suspended && (!nextAdministrationIsPrepared || rx.suspension.isMarSuspension) && (!nextAdministrationStatusPrepared || rx.suspension.isMarSuspension) && (rx.administrationsToSign == 0)) {
                    return local.allGroups.Where(function(group) { return group.key == appSettingsFactory.rxGroupsKey.suspend && (group.isProcessed == rx.isProcessed); }).First().groupId;
                }

                if ((rx.statusCode == appSettingsFactory.rxStatusKey.completed && completedLimit >= utcnow && ((!nextAdministrationIsPrepared || rx.isMarCessation) && !nextAdministrationStatusPrepared && rx.administrationsToSign == 0))
                    || (rx.statusCode == appSettingsFactory.rxStatusKey.ceased && (!nextAdministrationIsPrepared || rx.isMarCessation) && (!nextAdministrationStatusPrepared) && (rx.administrationsToSign == 0))
                    || (rx.statusCode == appSettingsFactory.rxStatusKey.cancelled)) {
                    return local.allGroups.Where(function(group) { return group.key == appSettingsFactory.rxGroupsKey.terminate && (group.isProcessed == rx.isProcessed); }).First().groupId;
                }
                // check for rx Status if group.key  is NW
                if (isNew && !isStat && !isAdHoc) {
                    return local.allGroups.Where(function(group) { return group.key == appSettingsFactory.rxGroupsKey.newRx && (group.isProcessed == rx.isProcessed); }).First().groupId;
                }
                if (rx.rxTypeCode == appSettingsFactory.rxGroupsKey.continuous && !isNew && !isAdHoc && !isCompleted ||
                   (rx.rxTypeCode == appSettingsFactory.rxGroupsKey.continuous && !isNew && !isAdHoc && isCompleted && isRxRemainsInGroup)) {
                    return local.allGroups.Where(function(group) { return group.key == appSettingsFactory.rxGroupsKey.continuous && (group.isProcessed == rx.isProcessed); }).First().groupId;
                }
                if (rx.rxTypeCode == appSettingsFactory.rxGroupsKey.schedule && !isAdHoc && !isCompleted ||
                   (rx.rxTypeCode == appSettingsFactory.rxGroupsKey.schedule && !isAdHoc && isCompleted && isRxRemainsInGroup)) {
                  
                    return local.allGroups.Where(function(group) { return group.key == appSettingsFactory.rxGroupsKey.schedule && (group.isProcessed == rx.isProcessed); }).First().groupId;
                }
                if (rx.rxTypeCode == appSettingsFactory.rxGroupsKey.prn && !isNew && !isAdHoc && !isCompleted  ||
                   (rx.rxTypeCode == appSettingsFactory.rxGroupsKey.prn && !isAdHoc && isCompleted && isRxRemainsInGroup)) {
                    return local.allGroups.Where(function(group) { return group.key == appSettingsFactory.rxGroupsKey.prn && (group.isProcessed == rx.isProcessed); }).First().groupId;
                }
                if (rx.rxTypeCode == appSettingsFactory.rxGroupsKey.noSchelule && !isAdHoc && !isCompleted ||
                   (rx.rxTypeCode == appSettingsFactory.rxGroupsKey.noSchelule && !isAdHoc && isCompleted && isRxRemainsInGroup)) {

                    return local.allGroups.Where(function(group) { return group.key == appSettingsFactory.rxGroupsKey.noSchelule && (group.isProcessed == rx.isProcessed); }).First().groupId;
                }

                console.warn("WARNING!!! Couldn't find a group for RX " + rx.id);
                return local.allGroups.Where(function(group) { return group.key == appSettingsFactory.rxGroupsKey.noSchelule && (group.isProcessed == rx.isProcessed); }).First().groupId; // couldn't find a group we add it to a not scheduled.
            }

            function removeRxInactiveFromModel() {
                //delete rxinactive items
                for (var i = $scope.model.rxList.length - 1; i > 0; i--) {
                    if ($scope.model.rxList[i].groupIndex == local.inactiveGroup.groupId) {
                        $scope.model.rxList.splice(i, 1);
                    }
                }
            }

            function removeRxInactive() {
                removeRxInactiveFromModel();
                $scope.showInactive = true;
                $scope.toggleInactive();
                //reset collapsed to initial state
                local.groups().Where(function(item) { return item.isGroupProcessed; }).ForEach(function(item) {
                    item.collapsed = Enumerable.From($scope.groupCollapsed.processed).Where(function(group) { return group.groupId == item.groupIndex; }).FirstOrDefault().collapsed;
                });
                local.groups().Where(function(item) { return !item.isGroupProcessed; }).ForEach(function(item) {
                    item.collapsed = Enumerable.From($scope.groupCollapsed.notProcessed).Where(function(group) { return group.groupId == item.groupIndex; }).FirstOrDefault().collapsed;
                });
                $scope.rebind(rxListConstants.processedKey, true);
                $scope.rebind(rxListConstants.notProcessedKey, false);
            }
            
            function loadRxInactive(applicationSourceId, visitId, dateInactive) {
                var deferred = $q.defer();
                rxService.getInactive(applicationSourceId, visitId, $filter('date')(dateInactive, 'yyyyMMdd000000'), true)
                    .then(
                        function(scResult) {
                            if (scResult.Result.length >= 0) {
                                //all prescriptions from result
                                local.rxInactive = Enumerable.From(scResult.Result).Where(function(rx) { return (rx.isProcessed === true); }).Select(function(rx) {
                                        addExtraFields(rx);
                                        return new Lgi.Emr.Mar.Dto.rxDto(rx);
                                    }).OrderByDescending("$.stopTimestamp")
                                    .ThenBy("$.mx.pharmacyDescription")
                                    .ThenBy("$.pharmacyId");

                                local.rxInactiveNotProcessed = Enumerable.From(scResult.Result).Where(function(rx) { return (rx.isProcessed === false); }).Select(function(rx) {
                                        addExtraFields(rx);
                                        return new Lgi.Emr.Mar.Dto.rxDto(rx);
                                    }).OrderByDescending("$.stopTimestamp")
                                    .ThenBy("$.mx.pharmacyDescription")
                                    .ThenBy("$.pharmacyId");

                                 //prepare allgroups for colllaspe
                                local.allGroups.ForEach(function(group) { group.collapsed = true; });
                                //prepare inactive
                                local.allGroups
                                    .Where(function(group) { return group.groupId == local.inactiveGroup.groupId; })
                                    .ForEach(function(group) {
                                        group.key = appSettingsFactory.rxGroupsKey.inactives;
                                        group.collapsed = false;
                                        group.prescriptions.length = 0;
                                        if (group.isProcessed) {
                                            local.rxInactive.ForEach(function(rx) {
                                                group.prescriptions.push(rx);
                                            });
                                        }
                                        if (!group.isProcessed) {
                                            local.rxInactiveNotProcessed.Where(function(i) { return i.isProcessed == false; }).ForEach(function(rx) {
                                                group.prescriptions.push(rx);
                                            });
                                        }
                                    });


                              //  $scope.allGroups = scResult.Result;
                                return deferred.resolve();
                            }
                        },
                        function(scError) {
                            $scope.showInactive = false;
                            appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), scError.data.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                            deferred.reject();
                        }
                    );
                return deferred.promise;
            }

            function getAmountUnitListDescription(id) {
                return appSettingsFactory.getDataLookupShortDescriptionById(id, $scope.amountUnitList);
            }

            function getStrengthUnitListDescription(id) {
                return appSettingsFactory.getDataLookupShortDescriptionById(id, $scope.strengthUnitList);
            };

            function getVolumeUnitListDescription(id) {
                return appSettingsFactory.getDataLookupShortDescriptionById(id, $scope.volumeUnitList);
            };

            function getTimeUnitListDescription(id) {
                return appSettingsFactory.getDataLookupShortDescriptionById(id, $scope.timeUnitList);
            };

            function loadParameter() {
                var deferred = $q.defer();
                parameterService.get().then(function(scResult) {
                    $scope.parameter = scResult;
                    return deferred.resolve();
                });
                return deferred.promise;
            }

            function getDoseAmount(item) {
                var strReturn = '';
                if (item != null && item.schedule != null && item.schedule.dose != null) {
                    var dose = item.schedule.dose;
                    //display Dose
                    var isDoseMin = dose.giveDoseMin != null && dose.giveDoseMin != 0;
                    var isDoseMax = dose.giveDoseMax != null && dose.giveDoseMax != 0;
                    //case of Min and Max equal
                    if (isDoseMin && isDoseMax && dose.giveDoseMin == dose.giveDoseMax) {
                        strReturn = dose.giveDoseMin.toString() + ' ' + getStrengthUnitListDescription(dose.strengthUnitId);
                    }
                    //case of Min and Max not equal
                    else if (isDoseMin && isDoseMax && dose.giveDoseMin != dose.giveDoseMax) {
                        strReturn = '';
                    }
                    //case of Min or Max 
                    else if (isDoseMin || isDoseMax) {
                        strReturn = (isDoseMin) ?
                            dose.giveDoseMin.toString() + ' ' + getStrengthUnitListDescription(dose.strengthUnitId) :
                            dose.giveDoseMax.toString() + ' ' + getStrengthUnitListDescription(dose.strengthUnitId);
                    } else { //None
                        strReturn = '';
                    }
                    //display Amount
                    var isAmountMin = dose.giveAmountMin != null && dose.giveAmountMin != 0;
                    var isAmountMax = dose.giveAmountMax != null && dose.giveAmountMax != 0;
                    //case of Min and Max equal
                    if (isAmountMin && isAmountMax && dose.giveAmountMin == dose.giveAmountMax) {
                        strReturn += ' (' + dose.giveAmountMax.toString() + ' ' + getAmountUnitListDescription(dose.amountUnitId) + ')';
                    }
                    //case of Min and Max not equal
                    else if (isAmountMin && isAmountMax && dose.giveAmountMin != dose.giveAmountMax) {
                        strReturn += '';
                    }
                    //case of Min or Max 
                    else if (isAmountMin || isAmountMax) {
                        strReturn += (isAmountMin) ? ' (' + dose.giveAmountMin.toString() + ' ' + getAmountUnitListDescription(dose.amountUnitId) + ')' :
                            ' (' + dose.giveAmountMax.toString() + ' ' + getAmountUnitListDescription(dose.amountUnitId) + ')';
                    } else { //None
                        strReturn += '';
                    }
                    //here we reset strReturn it is either a giveDose Amount  or a rate Volume
                    if (dose.rate != null && dose.rate != 0) {
                        strReturn = dose.rate.toString() + ' ' + getTimeUnitListDescription(dose.rateUnitId);
                    }
                    if (dose.volume != null && dose.volume != 0) {
                        strReturn += ' (' + dose.volume.toString() + ' ' + getVolumeUnitListDescription(dose.volumeUnitId) + ')';
                    }
                }
                return strReturn;
            };

            function getAdministeredDoseAmount(item) {
                var strReturn = '';
                if (item != null && item.administeredDose != null) {
                    var dose = item.administeredDose;
                    if (dose.dispensedDose != null && dose.dispensedDose != 0) {
                        strReturn = dose.dispensedDose.toString() + ' ' + getStrengthUnitListDescription(dose.strengthUnitId);
                    }
                    if (dose.dispensedAmount != null && dose.dispensedAmount != 0) {
                        strReturn += ' (' + dose.dispensedAmount.toString() + ' ' + getAmountUnitListDescription(dose.amountUnitId) + ')';
                    }
                    //here we reset strReturn it is either a giveDove or a rate
                    if (dose.rate != null && dose.rate != 0) {
                        strReturn = dose.rate.toString() + ' ' + getTimeUnitListDescription(dose.rateUnitId);
                    }
                    if (dose.administeredVolume != null && dose.administeredVolume != 0) {
                        strReturn = dose.administeredVolume.toString() + ' ' + getVolumeUnitListDescription(dose.volumeUnitId);
                    }
                }
                return strReturn;
            };

            function getInstruction(item) {
                var strReturn = '';
                if (item != null && item.schedule != null) {
                    //load emar else pharmacy if emar empty
                    var adminitrationTimesList = (item.schedule.emarAdministrationTimes.length != 0)
                        ? Enumerable.From(item.schedule.emarAdministrationTimes) : Enumerable.From(item.schedule.pharmacyAdministrationTimes);
                    var plannedTime = (item.plannedDateTime.getUTCHours() * 100) + item.plannedDateTime.getUTCMinutes();
                    var instructions = adminitrationTimesList.Where(function(i) { return i.time == plannedTime && !i.isAdministration; }).Select(function(i) { return i.description; }).ToArray();
                    strReturn = (instructions.length != 0) ? instructions[0] : '';
                }
                return strReturn;
            };

            function getNextAdministrations(rx) {
                return Enumerable.From(rx.administrations).Where(function(i) { return i.realizationDateTime == null; });
            }

            function getRealizedAdministrations(rx) {
                return Enumerable.From(rx.administrations).Where(function(i) { return i.realizationDateTime != null && i.cancellationReasonId == null; }).OrderByDescending("$.realizationDateTime");
            }

            function getApplicationSiteToken(applicationSite) {
                if (applicationSite != "" && applicationSite != null) {
                    var application = Enumerable.From($scope.applicationSites).Where(function(i) { return i.token == applicationSite; });
                    if (application.Any()) {
                        return $scope.cultureManager.resources.translate(application.First().token);
                    }
                    return applicationSite;
                }
                return "";
            }

            // Build Item To the Model
            function buildItemToModel(rx, group, count) {
                //load up to 3 administrations
                var pharmacy = rx.pharmacyId;
                var administrationList = getNextAdministrations(rx);
                var nextAdministration = (rx.administrations.length >= 1) ? administrationList.FirstOrDefault() : null;
                administrationList = getRealizedAdministrations(rx);
                var firstPreviousAdministration = (administrationList.Count() >= 1) ? administrationList.FirstOrDefault() : null;
                var secondPreviousAdministration = (administrationList.Count() >= 2) ? administrationList.Skip(1).FirstOrDefault() : null;

                if (nextAdministration != null && nextAdministration.schedule != null && $scope.getDosageTypeCode(rx.dosageTypeId) == appSettingsFactory.dosageTypeKey.quantified) {
                    nextAdministration = addFieldsToNextAdministration(nextAdministration);
                } else {
                    angular.extend(rx, { doseAmount: getDoseAmount(rx) });
                    if (nextAdministration != null) angular.extend(nextAdministration, { isToday: isToday(nextAdministration.plannedDateTime) });
                }

                if (firstPreviousAdministration != null) {
                    firstPreviousAdministration = angular.extend(angular.copy(firstPreviousAdministration), {
                        instruction: getInstruction(firstPreviousAdministration),
                        doseAmount: getAdministeredDoseAmount(firstPreviousAdministration),
                        applicationSiteToken: getApplicationSiteToken(firstPreviousAdministration.applicationSite),
                        statusCode: getAdministrationStatusCode(firstPreviousAdministration.administrationStatusId),
                        administrationStatusDescription: getAdministrationStatusDescription(firstPreviousAdministration.administrationStatusId)
                    });
                }
                if (secondPreviousAdministration != null) {
                    secondPreviousAdministration = angular.extend(angular.copy(secondPreviousAdministration), {
                        instruction: getInstruction(secondPreviousAdministration),
                        doseAmount: getAdministeredDoseAmount(secondPreviousAdministration),
                        applicationSiteToken: getApplicationSiteToken(secondPreviousAdministration.applicationSite),
                        statusCode: getAdministrationStatusCode(secondPreviousAdministration.administrationStatusId),
                        administrationStatusDescription: getAdministrationStatusDescription(secondPreviousAdministration.administrationStatusId)
                    });
                }

                var item = angular.extend(rx, {
                    template: "rx.html",
                    visible: !group.collapsed,
                    groupIndex: group.groupId,
                    groupName: group.key,
                    isGroup: false,
                    odd: (count % 2) == 1,
                    selected: false,
                    selectable: group.selectable,
                    nextAdministration: nextAdministration,
                    firstPreviousAdministration: firstPreviousAdministration,
                    secondPreviousAdministration: secondPreviousAdministration,
                    isGroupProcessed: group.isProcessed,
                    doubleCheckDoseStatus: rxHelperFactory.setDoubleCheckDoseStatus(rx),
                    dosageTypeCode: $scope.getDosageTypeCode(rx.dosageTypeId),
                    schedulePriorityDescription: ((rx.schedule != null) ? getSchedulePriorityDescription(rx.schedule.schedulePriorityId) : ""),
                    amountUnitDescription: ((rx.schedule != null && rx.schedule.dose != null) ? getAmountUnitDescription(rx.schedule.dose.amountUnitId) : ""),
                    cessationReasonDescription: getCessationReasonDescription(rx.cessationReasonId),
                    suspensionReasonDescription: ((rx.suspension != null) ? getSuspensionReasonDescription(rx.suspension.suspensionReasonId) : "")

                });
                return item;
            }

            // Build group To the Model
            function buildGroupToModel(group) {
                return {
                    groupIndex: group.groupId,
                    isGroup: true,
                    groupName: group.key,
                    count: group.prescriptions.length,
                    template: "group.html",
                    visible: true,
                    collapsed: group.collapsed,
                    odd: false,
                    selectable: group.selectable,
                    hasSelectedItems: false,
                    selected: false,
                    selectedCount: 0,
                    isGroupProcessed: group.isProcessed
                };
            }

            function loadPermissions() {
                //load permissions
                $scope.grant = {
                    isAllowedMarDaR: isAllowed($scope.permission.marRolesList.MAR_DA_R),
                    isAllowedRValidatePrescription: isAllowed($scope.permission.marRolesList.MAR_DA_RValidatePrescription),
                    isAllowedRConsultPrescription: isAllowed($scope.permission.marRolesList.MAR_DA_RConsultPrescription),
                    isAllowedUStopPrescription: isAllowed($scope.permission.marRolesList.MAR_DA_UStopPrescription),
                    isAllowedUReactivatePrescription: isAllowed($scope.permission.marRolesList.MAR_DA_UReactivatePrescription),
                    isAllowedUSuspendPrescription: isAllowed($scope.permission.marRolesList.MAR_DA_USuspendPrescription),
                    isAllowedURemoveSuspPrescription: isAllowed($scope.permission.marRolesList.MAR_DA_URemoveSuspPrescription),
                    isAllowedUCreateAdHocPrescription: isAllowed($scope.permission.marRolesList.MAR_DA_UCreateAdHocPrescription),
                    isAllowedUAdministerSelectedDrug: isAllowed($scope.permission.marRolesList.MAR_DA_UAdministerSelectedDrug),
                    isAllowedRNote: isAllowed($scope.permission.marRolesList.MAR_DA_RNote),
                    isAllowedRxProcessStart: isAllowed($scope.permission.marRolesList.MAR_DA_RxProcessStart),
                    isAllowedRxProcessStop: isAllowed($scope.permission.marRolesList.MAR_DA_RxProcessStop)
                }
            }

            // generic permission checker,  pass : Ex: $scope.permission.marRolesList.MAR_DA_UFrequency
            function isAllowed(role) {
                return permissionsHelperFactory.isAllowed(role, $scope.permission.securityContext.mar);
            };

            function assignCollapseStateToAllGroups() {
                //assign collapse attr to allGroups
                local.allGroups.Where(function(item) { return item.isProcessed; }).ForEach(function(item) {
                    item.collapsed = Enumerable.From($scope.groupCollapsed.processed).Where(function(group) { return group.groupId == item.groupId; }).FirstOrDefault().collapsed;
                });
                local.allGroups.Where(function(item) { return !item.isProcessed; }).ForEach(function(item) {
                    item.collapsed = Enumerable.From($scope.groupCollapsed.notProcessed).Where(function(group) { return group.groupId == item.groupId; }).FirstOrDefault().collapsed;
                });
            }

            function assignCollapseStateFromRxList() {
                var groupItem = null;
                angular.forEach($scope.groupCollapsed.processed, function(item) {
                    groupItem = local.list().Where(function(group) { return ((group.isGroup == true) && (group.groupIndex == item.groupId) && (group.isGroupProcessed == item.isProcessed)); }).FirstOrDefault();
                    if (groupItem != null) item.collapsed = groupItem.collapsed;
                });
                angular.forEach($scope.groupCollapsed.notProcessed, function(item) {
                    groupItem = local.list().Where(function(group) { return ((group.isGroup == true) && (group.groupIndex == item.groupId) && (group.isGroupProcessed == item.isProcessed)); }).FirstOrDefault();
                    if (groupItem != null) item.collapsed = groupItem.collapsed;
                });

            }

            function loadGroupsCollapsed() {
                var toggleGroups = angular.fromJson(sessionStorage.getItem(appSettingConstants.toggleGroups));
                if (angular.isDefined(toggleGroups) && toggleGroups != null) {
                    $scope.groupCollapsed.processed = angular.copy(toggleGroups.processed);
                    $scope.groupCollapsed.notProcessed = angular.copy(toggleGroups.notProcessed);
                } else {
                    $scope.groupCollapsed.processed = angular.copy(appSettingsFactory.getRxGroups());
                    $scope.groupCollapsed.notProcessed = angular.copy(appSettingsFactory.getRxGroups());
                    angular.forEach($scope.groupCollapsed.notProcessed, function(item) { item.isProcessed = false; });
                }
            };

            function storeGroupsCollapsed() {
                assignCollapseStateFromRxList();
                sessionStorage.setItem(appSettingConstants.toggleGroups, JSON.stringify($scope.groupCollapsed));
            }

            function addExtraFields(item) {
                //DO isDoseOnly First (use by rxTypeCode)
                angular.extend(item, {
                    isDoseOnly: rxHelperFactory.isDoseOnly(item, $scope.frequencyTemplateList)
                });
                angular.extend(item, {
                    statusCode: appSettingsFactory.getDataLookupCodeById(item.rxStatusId, $scope.rxStatusList),
                    sourceCode: appSettingsFactory.getDataLookupCodeById(item.rxSourceId, $scope.rxSourceList),
                    rxTypeCode: rxHelperFactory.getRxType(item, $scope.dosageTypeList, $scope.rxSchedulePriorityList)
                });
            }
            function isPreparationValidated(item) {
                if ((angular.isDefined(item.nextAdministration) && item.nextAdministration != null)) {
                    return item.nextAdministration.isPreparationValidated;
                } else {
                    return false;
                }
            }
            function isLastAdministrationInProgressOrPaused(item) {
                if ((angular.isDefined(item.firstPreviousAdministration) && item.firstPreviousAdministration != null)) {
                    var code = appSettingsFactory.getDataLookupCodeById(item.firstPreviousAdministration.administrationStatusId, $scope.administrationStatusList);
                    return ((code == 'PAUSED') || (code == 'PROGRESS'));
                } else {
                    return false;
                } 
            }
            function isAdministrationStatusPrepared(item) {
                return rxHelperFactory.isAdministrationStatusPrepared(item, $scope.administrationStatusList);
            }
            function isAdministrationPrepared(item) {
                return rxHelperFactory.isAdministrationPrepared(item);
            }

            function stopProcessed(items) {
                var deferred = $q.defer();
                rxManagementService.stopProcessing(items)
                    .then(
                        function (scResult) {
                            var originalResult = angular.copy($scope.scResult);
                            scResult.Result.forEach(function (item) {
                                // Update List with item that have isProcessed set to false
                                if (item.isProcessed == false) {
                                    //Search for item in $scope.scResult (original copy of last getActive)
                                    var position = Enumerable.From(originalResult.Result).Select(function(i, index) {
                                         return {id: i.id, position: index};
                                    }).Where(function(i) {
                                         return i.id == item.id;
                                    }).FirstOrDefault().position;
                                    originalResult.Result[position] = angular.copy(item);
                                }
                            });
                            deferred.resolve(originalResult);
                        },
                        function (scError) {
                            if (angular.isDefined(scError.data.Errors))
                                appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), scError.data.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                        }
                    );
                return deferred.promise;
            }

            function replaceString(value, toReplaceStr, replaceStr) {
                    return value.replace(toReplaceStr, replaceStr.toString());
            };

            function processedItemCount(isProcessed) {
                return local.list().Count(function (i) { return i.isGroupProcessed == isProcessed; });
            };
            function getAdministrationStatusCode (id) {
                return appSettingsFactory.getDataLookupCodeById(id, $scope.administrationStatusList);
            };
            function isToday (date) {
                if (angular.isDate(date)) {
                    var testDate = angular.copy(date);
                    var today = new Date();
                    return (testDate.setHours(0, 0, 0, 0) == today.setHours(0, 0, 0, 0));
                } else {
                    return false;
                }
            };
            function getDosageTypeCode(id) {
                return appSettingsFactory.getDataLookupCodeById(id, $scope.dosageTypeList);
            };
            function getSchedulePriorityDescription (id) {
                return appSettingsFactory.getDataLookupShortDescriptionById(id, $scope.rxSchedulePriorityList);
            };
            function getAdministrationStatusDescription (id) {
                return appSettingsFactory.getDataLookupShortDescriptionById(id, $scope.administrationStatusList);
            };
            function getAmountUnitDescription(id) {
                return appSettingsFactory.getDataLookupShortDescriptionById(id, $scope.amountUnitList);
            };
            function getCessationReasonDescription (id) {
                return (id != 0 && id != null) ? appSettingsFactory.getDataLookupShortDescriptionById(id, $scope.cessationReasonList) : null;
            };
            function getSuspensionReasonDescription (id) {
                return (id != 0 && id != null) ? appSettingsFactory.getDataLookupShortDescriptionById(id, $scope.suspensionReasonList) : null;
            };
            function addFieldsToNextAdministration(administration) {
                return angular.extend(angular.copy(administration), {
                    instruction: getInstruction(administration),
                    doseAmount: getDoseAmount(administration),
                    isToday: isToday(administration.plannedDateTime),
                    administrationStatusDescription: getAdministrationStatusDescription(administration.administrationStatusId)
                });
            };

            ////UTILITY FORMAT JSON
            //$scope.formatJSON = function(item) {
            //    return JSON.stringify(item, null, 3);
            //};
   
        }
    ]);