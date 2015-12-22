/*
   rxHelperFactory is used to:
   Common code for rxListController and rxManagementController
*/

'use strict';

angular
    .module('app')
    .constant('rxNavigationPathConstants', {
        validateNavigationPath: 'rx/validate',
        manageNavigationPath: 'rx/management',
        startProcessingNavigationPath: 'rx/startProcessing',
        startAdHocProcessingNavigationPath: 'rx/startAdHocProcessing',
        adhocNavigationPath: 'rx/adhoc',
        administrationNavigationPath: 'rx/administration'
    })
    .factory('rxHelperFactory', function ($q, $window, appSettingsFactory, entrepriseServices, rxManagementService) {
    return {
        //GetRxTypeCode
        getRxType: function(rx, dosageTypeList, rxSchedulePriorityList) {
            var dosagetypeCode = appSettingsFactory.getDataLookupCodeById(rx.dosageTypeId, dosageTypeList);
            var rxSchedulePriorityCode = appSettingsFactory.getDataLookupCodeById(rx.schedule.schedulePriorityId, rxSchedulePriorityList);
            //Stat always the first
            if (rxSchedulePriorityCode == appSettingsFactory.rxSchedulePriorityKey.stat) {
                return appSettingsFactory.rxGroupsKey.stat;
            }
            //Case of NoSchedule first
            if (rx.isDoseOnly &&
                rxSchedulePriorityCode != appSettingsFactory.rxSchedulePriorityKey.prn) {
                return appSettingsFactory.rxGroupsKey.noSchelule;
            } else if (dosagetypeCode == appSettingsFactory.dosageTypeKey.continuous) {
                return appSettingsFactory.rxGroupsKey.continuous;
            } else if (rxSchedulePriorityCode == appSettingsFactory.rxSchedulePriorityKey.prn) {
                return appSettingsFactory.rxGroupsKey.prn;
            } else if (rxSchedulePriorityCode == appSettingsFactory.rxSchedulePriorityKey.regular) {
                return appSettingsFactory.rxGroupsKey.schedule;
            } else {
                return '';
            }
        },
        setRxType: function(rx, dosageTypeList, rxSchedulePriorityList) {
            switch (rx.rxTypeCode) {
            case "SCHL":
                rx.schedule.schedulePriorityId = appSettingsFactory.getDataLookupInstanceByCode('R', rxSchedulePriorityList).id;
                break;
            case "STAT":
                rx.schedule.schedulePriorityId = appSettingsFactory.getDataLookupInstanceByCode('STAT', rxSchedulePriorityList).id;
                break;
            case "PRN":
                rx.schedule.schedulePriorityId = appSettingsFactory.getDataLookupInstanceByCode('PRN', rxSchedulePriorityList).id;
                break;
            case "CONT":
                rx.dosageTypeId = appSettingsFactory.getDataLookupInstanceByCode('CONT', dosageTypeList).id;
                break;
            case "NOSCHL":
                rx.schedule.frequencyData.TemplateType = "DoseOnly";
                break;
            default:
            }
        },
        getRxNextPlannedDateTime: function(administrations) {
            if (angular.isArray(administrations) && administrations.length > 0) {
                var nextActivityList = Enumerable.From(administrations)
                    .Where(function(x) { return x.realizationDateTime == null; })
                    .OrderByDescending("$.plannedDateTime");
                return (nextActivityList.Count() > 0) ? nextActivityList.First().plannedDateTime : null;
            } else {
                return null;
            }
        },
        getMxClassCode: function(mxClassIds, mxClassList) {
            //IF NONE return zzzzzzzzzzzzzzzzz to have those at the end
            return (angular.isArray(mxClassIds) && mxClassIds.length > 0) ? appSettingsFactory.getDataLookupCodeById(mxClassIds[0], mxClassList) : 'zzzzzzzzzzzzzzzzz';
        },
        createRx: function(rx) {
            var deferred = $q.defer();
            rxManagementService.create(rx)
                .then(
                    function(scResult) {
                        if (angular.isDefined(scResult.Result))
                            deferred.resolve(scResult.Result);
                    },
                    function(scError) {
                        deferred.reject(scError.data.Errors);
                    }
                );
            return deferred.promise;
        },
        saveRx: function(rx) {
            var deferred = $q.defer();
            rxManagementService.save(rx)
                .then(
                    function(scResult) {
                        if (angular.isDefined(scResult.Result))
                            deferred.resolve(scResult.Result);
                    },
                    function(scError) {
                        deferred.reject(scError.data.Errors);
                    }
                );
            return deferred.promise;
        },
        saveDoubleCheckDose: function(rx) {
            var deferred = $q.defer();
            rxManagementService.doubleCheckDose(rx)
                .then(
                    function (scResult) {
                        if (angular.isDefined(scResult.Result))
                            deferred.resolve(scResult.Result);
                    },
                    function (scError) {
                        deferred.reject(scError.data.Errors);
                    }
                );
            return deferred.promise;
        },
        cancelDoubleCheckDose: function(id) {
            var deferred = $q.defer();
            rxManagementService.cancelDoubleCheckDose(id)
                .then(
                    function (scResult) {
                        if (angular.isDefined(scResult.Result))
                            deferred.resolve(scResult.Result);
                    },
                    function (scError) {
                        deferred.reject(scError.data.Errors);
                    }
                );
            return deferred.promise;
        },
        // Is rx Adhoc
        isAdhoc: function(rxSourceId, sourceList) {
            var sourceCode = appSettingsFactory.getDataLookupCodeById(rxSourceId, sourceList);
            return (sourceCode == appSettingsFactory.rxGroupsKey.adHoc);
        },
        //suspended by pharm
        isRxSuspendedByPharmaAdministrable: function(rx, rxStatusCode, administrationStatusList) {
            return this.isAdministrationPrepared(rx) || this.isAdministrationStatusPrepared(rx, administrationStatusList) || rx.isDue || rx.isLate;
        },
        //ceased by pharm
        isRxCeasedByPharmaAdministrable: function(rx, rxStatusCode, administrationStatusList) {
            return (rxStatusCode == appSettingsFactory.rxStatusKey.ceased && !rx.isMarCessation) ||
                    this.isAdministrationPrepared(rx) || this.isAdministrationStatusPrepared(rx, administrationStatusList);
        },
        isAdministrable: function (rx, rxStatusCode, administrationStatusList, gracePeriodForInactivePrescription, dosageTypeList, frequencyTemplateList) {
            var dateTimestamp = (rx.realEndTimestamp != null) ? rx.realEndTimestamp : rx.cessationTimestamp;
            var isRxNonPlannableAdministrableInGracePeriod = this.isRxNonPlannableAdministrableInGracePeriod(rx, dateTimestamp, gracePeriodForInactivePrescription, dosageTypeList, frequencyTemplateList);
            var isNumberOfDosesCompleted = this.isNumberOfDosesCompleted(rx, frequencyTemplateList);
            return (!rx.isGroup
                && !rx.isRxContinueLastAdministrationCompleted // Last administration (of a continue rx) is completed 
                && (rxStatusCode != appSettingsFactory.rxStatusKey.cancelled)
                && (rxStatusCode != appSettingsFactory.rxStatusKey.completed || isRxNonPlannableAdministrableInGracePeriod)
                && (rxStatusCode != appSettingsFactory.rxStatusKey.ceased || this.isRxCeasedByPharmaAdministrable(rx, rxStatusCode, administrationStatusList))
                && (rxStatusCode != appSettingsFactory.rxStatusKey.suspended || this.isRxSuspendedByPharmaAdministrable(rx, rxStatusCode, administrationStatusList))
                && (rx.groupName != appSettingsFactory.rxGroupsKey.suspend )
                && (rx.groupName != appSettingsFactory.rxGroupsKey.terminate || isRxNonPlannableAdministrableInGracePeriod)
                && (rx.groupName != appSettingsFactory.rxGroupsKey.inactives || isRxNonPlannableAdministrableInGracePeriod)
                && isNumberOfDosesCompleted);
        },
        //return true if we have at least one administration completed
        isAdministrationRealized: function(rx) {
            return (angular.isDefined(rx) && rx != null) ? (rx.realizedAdministrationsCount != 0) : false;
        },
        isExtraDosePossible: function (rx, statusCode, dosageType, isGracePeriodReached) {
            return ((!rx.isInactive || (rx.isInactive && !isGracePeriodReached))
                    && statusCode != appSettingsFactory.rxStatusKey.cancelled
                    && statusCode != appSettingsFactory.rxStatusKey.suspended
                    && dosageType != appSettingsFactory.dosageTypeKey.continuous
            );
        },
        isPRNwithoutSchedule: function (item) {
            return (item.rxTypeCode == appSettingsFactory.rxSchedulePriorityKey.prn && !item.schedule.isUnknownFrequencyTemplate);
        },
        isRxNonPlannableAdministrableInGracePeriod: function (rx, endDate, gracePeriodForInactivePrescription, dosageTypeList, frequencyTemplateList) {
            //PRN, CONTINUOUS OR DOSE ONLY
            if (!rx.isGroup) {
                var isPRN = this.isPRN(rx);
                var isContinuous = this.isContinuous(rx, dosageTypeList);
                var isDoseOnly = this.isDoseOnly(rx, frequencyTemplateList);
                return (endDate != null && angular.isDefined(gracePeriodForInactivePrescription) && gracePeriodForInactivePrescription != null) ? ((isPRN || isContinuous || isDoseOnly) && !this.isInDisgrace(endDate, gracePeriodForInactivePrescription)) : false;
            }
            return false;
        },
        // Unknown Template
        unknownTemplate: function(item, dosageTypeList) {
            var isContinuous = appSettingsFactory.getDataLookupCodeById(item.dosageTypeId, dosageTypeList) == appSettingsFactory.dosageTypeKey.continuous;
            var isPRNwithoutSchedule = this.isPRNwithoutSchedule(item);// 
            if (isContinuous || isPRNwithoutSchedule ||
            (item.schedule.frequencyTemplateId != null) || (item.schedule.isManualTemplateEntry)) {
                return false;
            } else {
                return true;
            }
        },
        // Unknown Time
        unknownTime: function (item, frequencyTemplateList, rxSchedulePriorityList) {
            //case of PRN no time specified
            var rxSchedulePriorityCode  = undefined;
            if (item.schedule != null)
                 rxSchedulePriorityCode = appSettingsFactory.getDataLookupCodeById(item.schedule.schedulePriorityId, rxSchedulePriorityList);
            if (rxSchedulePriorityCode != undefined && rxSchedulePriorityCode == appSettingsFactory.rxSchedulePriorityKey.prn) return false;

            if (item.schedule != null && (item.schedule.frequencyData != null || item.schedule.frequencyTemplateId != null)) {
                var frequencyTemplate = (item.schedule.frequencyTemplateId != null) ? Enumerable.From(frequencyTemplateList).Where(function (i) { return i.id == item.schedule.frequencyTemplateId; }).FirstOrDefault() : null;
                var timesPerDay;
                if (frequencyTemplate != null) {
                    timesPerDay = frequencyTemplate.Data.timesPerDay || 0;
                } else {
                    timesPerDay = item.schedule.frequencyData.timesPerDay || 0;
                }
                if (rxSchedulePriorityCode == appSettingsFactory.rxSchedulePriorityKey.regular && timesPerDay != 0) {
                    var administrationTimesList = (item.schedule.emarAdministrationTimes.length != 0) ? item.schedule.emarAdministrationTimes : item.schedule.pharmacyAdministrationTimes;
                    var nbrAdmTimeFilled = Enumerable.From(administrationTimesList).Count(function(i) { return i.time != null; });
                    if (timesPerDay != nbrAdmTimeFilled && item.schedule.isManualTemplateEntry) {
                        return true;
                    }
                }
                if (angular.isDefined(item.schedule.frequencyTemplateId) && item.schedule.frequencyTemplateId != null &&
                    frequencyTemplateList.length != 0) {
                    var freq = Enumerable.From(frequencyTemplateList).Where(function (i) { return i.id == item.schedule.frequencyTemplateId; });
                    timesPerDay = freq.FirstOrDefault().Data.timesPerDay || 0;
                    nbrAdmTimeFilled = Enumerable.From(administrationTimesList).Count(function (i) { return i.time != null; });
                    if (freq.Any() && timesPerDay != nbrAdmTimeFilled) {
                        return true;
                    }
                }
            }
            return false;
        },
        isInDisgrace: function (dateTimeStamp, gracePeriodForInactivePrescription) {
            var bReturn = false;
            var utcnow = new Date();
            var graceLimit = angular.copy(dateTimeStamp);
            graceLimit.setUTCHours(dateTimeStamp.getUTCHours() + gracePeriodForInactivePrescription);

            if (gracePeriodForInactivePrescription != 0) {
                  if (utcnow >= graceLimit) bReturn = true;
               } else  {
                  bReturn = true;
               }
            return bReturn;
        },
        isFlowSheetDeleteDisabled: function(id, metaWorkflows) {
            var bReturn = false;
            var obj = Enumerable.From(metaWorkflows).Where(function(i) { return i.id == id; }).FirstOrDefault();
            if (obj != null) bReturn = obj.isInUse;
            return bReturn;
        },
        isAdministrationStatusPrepared: function(item, administrationStatusList) {
            var bReturn = false;
            if (angular.isDefined(item) && item != null) {
                var nextAdministration = Enumerable.From(item.administrations).Where(function(i) { return i.realizationDateTime == null; }).FirstOrDefault();
                if (nextAdministration != null) bReturn = appSettingsFactory.getDataLookupCodeById(nextAdministration.administrationStatusId, administrationStatusList) == "PREPARED";
            }
            return bReturn;
        },
        isAdministrationPrepared: function (item) {
            // Select the list of selected administrations that have not been prepared yet (PREPARE => isAlreadyPrepared = false) or 
            // that have already been prepared (CANCEL PREPARATION => isAlreadyPrepared = true).
            var isPrepared = (Enumerable.From(item.administrations)
                .Where(function (i) {
                    return i.realizationDateTime == null // this condition makes sure that we're using the latest administration
                        && i.isPreparationValidated == true;
                })
                .Any());
            return isPrepared;
        },
        doLaunchRxVigilanceAdvisorProfessional: function(url) {
            if (url != null) $window.open(url, '_blank');
        },
        doLaunchRxVigilanceAdvisorMonographs: function(url, monographNumber) {
            if (url != null && monographNumber != null && monographNumber != '') {
                url = url.replace("{0}", monographNumber);
                $window.open(url, '_blank');
            }
        },
        getDoubleCheckDoseObject: function(rx) {
            var containerObject = new Object();
            containerObject.signature1 = new Object();
            containerObject.signature2 = new Object();
            containerObject.signature1.user = new Lgi.Emr.Mar.Dto.userDto();
            containerObject.signature2.user = new Lgi.Emr.Mar.Dto.userDto();
            containerObject.signature1.user = rx.dosageVerification1User;
            containerObject.signature1.dosageVerificationId = rx.dosageVerification1ResultId;
            containerObject.signature1.verificationDateTime = rx.dosageVerification1Timestamp;
            containerObject.signature2.user = rx.dosageVerification2User;
            containerObject.signature2.dosageVerificationId = rx.dosageVerification2ResultId;
            containerObject.signature2.verificationDateTime = rx.dosageVerification2Timestamp;
            return containerObject;
        },
        setDoubleCheckDoseObject: function(rx, containerObject) {
            rx.dosageVerification1User = (containerObject.signature1.user.username != '')? containerObject.signature1.user:null;
            rx.dosageVerification1ResultId = containerObject.signature1.dosageVerificationId;
            rx.dosageVerification1Timestamp = containerObject.signature1.verificationDateTime;
            rx.dosageVerification2User = (containerObject.signature2.user.username != '') ? containerObject.signature2.user : null;
            rx.dosageVerification2ResultId = containerObject.signature2.dosageVerificationId;
            rx.dosageVerification2Timestamp = containerObject.signature2.verificationDateTime;
        },
        setDoubleCheckDoseStatus: function (rx) {
            if (rx.dosageVerification1Timestamp != null && rx.dosageVerification2Timestamp != null) {
                return appSettingsFactory.doubleCheckDoseStatus.both;
            } else if ((rx.dosageVerification1Timestamp != null && rx.dosageVerification2Timestamp == null) || (rx.dosageVerification1Timestamp == null && rx.dosageVerification2Timestamp != null)) {
                return appSettingsFactory.doubleCheckDoseStatus.one;
            } else {
                return appSettingsFactory.doubleCheckDoseStatus.none;
            }  
        },
        isDoseOnly: function (rx, frequencyTemplateList) {
            var frequencyTemplate = this.getFrequencyData(rx, frequencyTemplateList);
            if (frequencyTemplate != null) return frequencyTemplate.templateType == appSettingsFactory.rxScheduleTemplateTypeKey.doseonly;
            else return false;
        },
        isNumberOfDosesCompleted: function (rx, frequencyTemplateList) {
            var frequencyTemplate = this.getFrequencyData(rx, frequencyTemplateList);
            if (frequencyTemplate != null)
                return !((frequencyTemplate.templateType == appSettingsFactory.rxScheduleTemplateTypeKey.doseonly) &&
                (frequencyTemplate.numberOfDoses <= (rx.realizedAdministrationsCount - rx.extraDoseAdministrationsCount)));
            else return true;
        },
        isPRN: function(rx) {
            return rx.rxTypeCode == appSettingsFactory.rxGroupsKey.prn;
        },
        isContinuous : function (rx, dosageTypeList)  {
            return appSettingsFactory.getDataLookupCodeById(rx.dosageTypeId, dosageTypeList) == appSettingsFactory.dosageTypeKey.continuous;
        },
        getFrequencyData: function (rx, frequencyTemplateList) {
            if (!rx.isGroup) {
                var frequencyTemplate = (rx.schedule.frequencyTemplateId != null) ? Enumerable.From(frequencyTemplateList).Where(function (i) { return i.id == rx.schedule.frequencyTemplateId; }).FirstOrDefault() : null;
                if (frequencyTemplate != null) {
                     return frequencyTemplate.Data;
                } else {
                    return rx.schedule.frequencyData;
                }
            }
            return null;
        }
    };
});
