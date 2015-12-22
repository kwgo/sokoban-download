'use strict';

angular
    .module('app')
    .service('administrationValidator', [
        '$filter', 'appSettingsFactory', 'cultureManager',
        function ($filter, appSettingsFactory, cultureManager) {
            var _this = this;

            _this.validateUpdate = function (rx, administration, prepare, toSignOnly, isPrepared, administrationStatusList) {
                var errors = [];
                var success = true;
                var items = Enumerable.From(rx.administrations).Where(function (i) { return i.id == administration.id; });
                var item;
                var index;
                var now = new Date();
                var nowFormatted = $filter('date')(now, appSettingsFactory.dateTimePickerOptions.format);
                if (!prepare && (!toSignOnly || !isPrepared)) {
                    if (angular.isUndefined(administration.realizationDateTimeUTC) || administration.realizationDateTimeUTC === null || administration.realizationDateTimeUTC === "") {
                        success = false;
                        errors.push({ errorCode: '', errorMessage: cultureManager.resources.translate('DATE_REALIZATION_INVALID') });
                        return {
                            success: success,
                            errors: errors
                        };
                    }

                    if (angular.isDate(administration.realizationDateTimeUTC))
                        administration.realizationDateTime = angular.copy(administration.realizationDateTimeUTC);
                    else
                        administration.realizationDateTime = stringToDate(angular.copy(administration.realizationDateTimeUTC));
                    new Date(angular.copy(administration.realizationDateTimeUTC));

                    if (administration.prepareDoubleCheckDateTime !== null && administration.prepareDoubleCheckDateTime !== "" && administration.realizationDateTime < administration.prepareDoubleCheckDateTime) {
                        success = false;
                        errors.push({ errorCode: '', errorMessage: cultureManager.resources.translate('DATE_REALIZATION_INFERIOR_PREPARATION') });
                        return {
                            success: success,
                            errors: errors
                        };
                    }

                    if (items.Any()) {
                        item = items.First();
                    } else {
                        if (Enumerable.From(rx.administrations).Any())
                            item = Enumerable.From(rx.administrations).First();
                    }

                    
                        index = rx.administrations.indexOf(item);

                        //The date must not be less than the older administration 
                        if ((index > -1 && index < rx.administrations.length - 1) || administration.id == undefined || administration.id == 0) {

                            var previousRealizations = Enumerable.From(rx.administrations).Where(function (i) { return (i.id < administration.id || administration.id == undefined || administration.id == 0) && i.realizationDateTime !== null && !i.isAdditionalDose && i.cancellationReasonId == null; });
                            if (previousRealizations.Any()) {
                                var previousRealization = previousRealizations.First();
                                var previous = moment(angular.copy(previousRealization.realizationDateTime.setSeconds(0)));
                                var current = moment(angular.copy(administration.realizationDateTime.setSeconds(0)));
                                if (previous._d >= current._d) {
                                    success = false;
                                    errors.push({ errorCode: '', errorMessage: cultureManager.resources.translate('DATE_INFERIOR_TO_PREVIOUS') });
                                }
                            }
                        }

                        if (index > 0) {

                            //The date must not be superior to the following administration
                            var followingRealizations = Enumerable.From(rx.administrations).Where(function (i) { return i.id > administration.id && i.realizationDateTime !== null && !i.isAdditionalDose && i.cancellationReasonId == null; });
                            if (followingRealizations.Any()) {
                                var followingRealization = followingRealizations.Last();
                                if (followingRealization.realizationDateTime < administration.realizationDateTime) {
                                    success = false;
                                    errors.push({ errorCode: '', errorMessage: cultureManager.resources.translate('DATE_SUPERIOR_TO_FOLLOWING_ADMINISTRATION') });
                                }
                            }
                        }
                    

                    // L'heure d'administration ne peut être supérieure à la date et heure du moment.
                    if (administration.realizationDateTimeUTC > nowFormatted) {
                        success = false;
                        errors.push({ errorCode: '', errorMessage: cultureManager.resources.translate('DATE_GREATER_THAN_NOW') });
                    }
                } else {

                    // L'heure de preparation ne peut être supérieure à la date et heure du moment.
                    if ((administration.prepareDoubleCheckDateTime > now && (angular.isDate(administration.prepareDoubleCheckDateTime))) ||
                        (administration.prepareDoubleCheckDateTime > nowFormatted && (!angular.isDate(administration.prepareDoubleCheckDateTime)))) {
                        success = false;
                        errors.push({ errorCode: '', errorMessage: cultureManager.resources.translate('PREPARATION_DATE_GREATER_THAN_NOW') });
                    }
                }

                if (angular.isUndefined(administration.routeId) || administration.routeId === null) {
                    success = false;
                    errors.push({ errorCode: '', errorMessage: cultureManager.resources.translate('ADMINISTRATION_ROUTE_IS_MANDATORY') });
                }

                var status = appSettingsFactory.getDataLookupInstanceById(administration.administrationStatusId, administrationStatusList);
                if (status != null) {
                    if (status.code === 'COMPLETE') {
                    }
                    else if (status.code === 'PARTIAL') {
                    }
                    else if (status.code === 'NOTGIVEN') {
                    }
                    else if (status.code === 'PREPARED') {
                        if (!prepare && (!toSignOnly || !isPrepared)) {
                            //success = false;
                            //errors.push({ errorCode: '', errorMessage: cultureManager.resources.translate('STATUS_INVALID') });
                        }
                    }
                }

                return {
                    success: success,
                    errors: errors
                };
            };

            _this.validateRealization = function (administration) {

            };

            return {
                validateUpdate: _this.validateUpdate,
                validateRealization: _this.validateRealization
            };

            function stringToDate(s) {
                s = s.split(/[-: ]/);
                return new Date(s[0], s[1] - 1, s[2], s[3], s[4], 0);
            }
        }
    ]);