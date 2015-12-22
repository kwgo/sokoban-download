/*
    appSettingsFactory is used to:
       Return general data not saved in the DB
       Define general functions
*/

'use strict';

angular
    .module('app')
    .constant('appSettingConstants', {
        selectedPatientEntityKey: 'SELECTED_PATIENT',
        selectedPatientKey: 'SELECTED_PATIENT_ID',
        selectedEncounterKey: 'SELECTED_ENCOUNTER_SID',
        selectedVisitKey: 'SELECTED_VISIT_ID',
        selectedRosterKey: 'SELECTED_ROSTER_ID',
        selectedRxKey: 'SELECTED_RX_ID',
        selectedAdminKey: 'SELECTED_ADMIN_ID',
        selectedFrequencyTemplateKey: 'SELECTED_FREQUENCY_TEMPLATE_ID',
        selectedNextAdministrationKey: 'SELECTED_NEXT_ADMINISTRATION',
        filtersInactiveRxKey: 'FILTERS_INACTIVE_RX',
        parameterKey: 'PARAMETER',
        mdsKey: 'MDS',
        lookupsKey: 'lookups',
        toggleGroups: 'TOGGLE_GROUPS',
        patientsSortParameterKey: 'PATIENT_SORT_PARAMETER',
        displayMxSearchAtLoadKey: 'DISPLAY_MX_SEARCH_AT_LOAD',
        datePickerFormat: 'yyyy-MM-dd',
        datetimePickerFormat: 'yyyy-MM-dd HH:mm',
        timeFormat: 'HH:mm',
        inputMaxLength: 240,
        textAreaMaxLength: 1000,
        regexUrl: /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/,
        regexDaysOfMonth: /(^([1-9]|[1-2][0-9]|3[0-1])(?:,([1-9]|[1-2][0-9]|3[0-1]))*$)/
        
    })
    .factory('appSettingsFactory', function ($http, $q, $filter, cultureManager, popupService, appSettingConstants, utlString, authService, pagManager, $timeout) {
        var factory = {};

        //List of administrations filter
        factory.getAdministrationFilters = function () {
            if (cultureManager.currentCulture.Culture.Code == "fr-CA") {
                return [
                    { index: 0, value: "0", label: "Toutes" },
                    { index: 1, value: "2", label: "2 prochaines heures" },
                    { index: 2, value: "4", label: "4 prochaines heures" },
                    { index: 3, value: "8", label: "8 prochaines heures" },
                    { index: 4, value: "12", label: "12 prochaines heures" },
                    { index: 5, value: "24", label: "24 prochaines heures" }
                ];
            } else {
                return [
                    { index: 0, value: "0", label: "All" },
                    { index: 1, value: "2", label: "Next 2 hours" },
                    { index: 2, value: "4", label: "Next 4 hours" },
                    { index: 3, value: "8", label: "Next 8 hours" },
                    { index: 4, value: "12", label: "Next 12 hours" },
                    { index: 5, value: "24", label: "Next 24 hours" }
                ];
            }
        };

        // Application locations - this may need to be ported to a lookup
        //MAKE SURE TO UPDATE APPLICATIONSITES CLASS IN REPORT PROJET (BOTH LIST MUST BE IN SYNC)
        factory.getApplicationLocations = function () {
            return [
                {token: 'ABDOMEN', code: "Abdomen"},
                {token: 'RIGHT_ARM', code: "Bras droit"},
                {token: 'LEFT_ARM', code: "Bras gauche" },
                {token: 'RIGHT_THIGH', code: "Cuisse droite"},
                {token: 'LEFT_THIGH', code: "Cuisse gauche"},
                {token: 'BACK', code: "Dos"},
                {token: 'RIGHT_BUTTOCK', code: "Fesse droite"},
                {token: 'LEFT_BUTTOCK', code: "Fesse gauche"},
                {token: 'RIGHT_SIDE', code: "Flanc droit"},
                {token: 'LEFT_SIDE', code: "Flanc gauche"},
                {token: 'RIGHT_SCAPULA', code: "Omoplate droite"},
                {token: 'LEFT_SCAPULA', code: "Omoplate gauche"},
                {token: 'THORAX', code: "Thorax"}
            ];
        };

        factory.getBolusValues = function () {
            return [
                {token: 'BOLUS', code: true},
                {token: 'CONTINUOUS', code: false}
            ];
        };

        //Rx groups
        factory.getRxGroups = function () {
            return [
                { groupId: 1, key: this.rxGroupsKey.stat, selectable: true, collapsed: false, isProcessed: true,
                    prescriptions: [] },
                {
                    groupId: 2, key: this.rxGroupsKey.late, selectable: true, collapsed: false, isProcessed: true,
                    prescriptions: [] },
                {
                    groupId: 3, key: this.rxGroupsKey.due, selectable: true, collapsed: false, isProcessed: true,
                    prescriptions: [] },
                {
                    groupId: 4, key: this.rxGroupsKey.newRx, selectable: true, collapsed: false, isProcessed: true,
                    prescriptions: [] },
                {
                    groupId: 5, key: this.rxGroupsKey.schedule, selectable: true, collapsed: false, isProcessed: true,
                    prescriptions: [] },
                {
                    groupId: 6, key: this.rxGroupsKey.continuous, selectable: true, collapsed: true, isProcessed: true,
                    prescriptions: [] },
                {
                    groupId: 7, key: this.rxGroupsKey.prn, selectable: true, collapsed: true, isProcessed: true,
                    prescriptions: [] },
                {
                    groupId: 8, key: this.rxGroupsKey.noSchelule, selectable: true, collapsed: true, isProcessed: true,
                    prescriptions: [] },
                {
                    groupId: 9, key: this.rxGroupsKey.adHoc, selectable: true, collapsed: true, isProcessed: true,
                    prescriptions: [] },
                {
                    groupId: 10, key: this.rxGroupsKey.suspend, selectable: true, collapsed: true, isProcessed: true,
                    prescriptions: [] },
                {
                    groupId: 11, key: this.rxGroupsKey.terminate, selectable: true, collapsed: true, isProcessed: true,
                    prescriptions: [] },
                {
                    groupId: 12, key: this.rxGroupsKey.inactives, selectable: true, collapsed: true, isProcessed: true,
                    prescriptions: [] }
            ];
        };

        factory.getRxGroupByKey = function (key) {
            if (angular.isDefined(key)) {
                return Enumerable.From(this.getRxGroups()).Where(function (i) { return i.key == key; }).FirstOrDefault();
            } else {
                return "";
            }
        };

        //Display error
        factory.displayError = function (title, content, closeBtnText) {
            popupService.error({
                title: title,
                content: formatPopupContent(content),
                closeBtnText: closeBtnText,
                modal: true
            });
        };

        //Display info
        factory.displayInfo = function (title, content, closeBtnText) {
            popupService.info({
                title: title,
                content: content, //formatPopupContent(content) ?
                closeBtnText: closeBtnText,
                modal: true
            });
        };

        //Display warning
        factory.displayWarning = function (title, content, closeBtnText) {
            popupService.warn({
                title: title,
                content: formatPopupContent(content),
                closeBtnText: closeBtnText,
                modal: true
            });
        };

        //Display confirmation
        factory.displayConfirmation = function (title, content, actionBtnText, closeBtnText, cancelBtnText, onActionFunction, onCloseFunction) {
            popupService.confirm({
                title: title,
                content: formatPopupContent(content),
                actionBtnText: actionBtnText,
                closeBtnText: closeBtnText,
                cancelBtnText: cancelBtnText,
                onAction: onActionFunction,
                onClose: onCloseFunction,
                modal: true
            });
        };

        factory.createDate = function (stringValue) {
            return $filter('date')(new Date(stringValue.replace(/-/g, "/")), 'yyyyMMddHHmmss');
        };

        function formatPopupContent(unformattedPopupContent) {
            if (angular.isUndefined(unformattedPopupContent) || unformattedPopupContent == null)
                return utlString.empty();

            var formattedPopupContent = "";
            var errors = [];

            if (angular.isArray(unformattedPopupContent)) {
                errors = unformattedPopupContent;
            }
            else {
                if (unformattedPopupContent.length > 0) {
                    errors = [{ errorCode: "", errorMessage: unformattedPopupContent }];
                }
            }

            formattedPopupContent += '<ul class="popup-body-single-line">';
            angular.forEach(errors, function (error) {
                formattedPopupContent += '<li>' + error.errorMessage + '</li>';
            });
            formattedPopupContent += '</ul>';

            return formattedPopupContent;
        }

        //Displays a Popover
        // Parameters:
        // placement = top, bottom, left or right
        // title leave empty ("") no need to display it
        // message to display
        // component is the id of the component where to display the popover, for example if the id="saveButton" component must equal '#saveButton'
        // delay delay to destroy the popover
        factory.displayPopover = function (placement, title, message, component, delay, container) {
            var timeoutHandle = 0;
            var options = {
                placement: placement,
                title: title,
                content: message,
                html: true
            }
            //optionnal parameters
            if (angular.isDefined(container)) {
                options = angular.extend(angular.copy(options), { container: container });
            }
            //set popover options and display
            $(component).popover(options);
            $(component).popover('show');
            // if there is a delay then hide it and destroy it
            if (delay != null && delay != 0) {
                timeoutHandle = window.setTimeout(function () {
                    $(component).popover('destroy');
                }, delay);
            }
            return timeoutHandle;
        };

        //Displays a tooltip
        // Parameters:
        // placement = top, bottom, left or right
        // title leave empty ("") no need to display it
        // message to display
        // component is the id of the component where to display the popover, for example if the id="saveButton" component must equal '#saveButton'
        // delay delay to destroy the popover
        factory.displayTooltip = function (placement, message, component, delay) {
            $(component).tooltip({
                placement: placement,
                title: message
            });
            $(component).tooltip('show');
            // if there is a delay then hide it and destroy it
            if (delay != null && delay != 0) {
                window.setTimeout(function () {
                    $(component).tooltip('destroy');
                }, delay);
            }
        };

        //Get code of a datalookup table
        factory.getDataLookupCodeById = function(id, list) {
            if (angular.isDefined(id) && angular.isDefined(list) && list.length > 0 && id) {
                var lookup = Enumerable.From(list).Where(function (i) { return i.id == id; });
                if (lookup.Any()) {
                    return lookup.FirstOrDefault().code;
                }
            }
            return "";
        };

        //Get short description of a datalookup table
        factory.getDataLookupShortDescriptionById = function(id, list) {
            if (angular.isDefined(id) && angular.isDefined(list) && list.length > 0 && id) {
                var lookup = Enumerable.From(list).Where(function (i) { return i.id == id; });
                if (lookup.Any()){
                    return lookup.FirstOrDefault().shortDescription;
                }
            }
            return "";
        };

        //Get instance of a datalookup table by Id
        factory.getDataLookupInstanceById = function(id, list) {
            if (angular.isDefined(id) && angular.isDefined(list) && list.length > 0 && id) {
                var lookup = Enumerable.From(list).Where(function (i) { return i.id == id; });
                if (lookup.Any()) {
                    return lookup.FirstOrDefault();
                }
            }
            return null;
        };

        //Get instance of a datalookup table  by code
        factory.getDataLookupInstanceByCode = function (code, list) {
            if (angular.isDefined(code) && angular.isDefined(list) && list.length > 0 ) {
                var lookup = Enumerable.From(list).Where(function (i) { return i.code == code; });
                if (lookup.Any()) {
                    return lookup.FirstOrDefault();
                }
            }
            return null;
        };

        //Datalookup table list
        factory.dataLookups = {            
            adhocReason: "ADHOC_REASON",
            //administrationClass: "ADMINISTRATION_REASON",
            administrationReason: "ADMINISTRATION_REASON",
            administrationStatus: "ADMINISTRATION_STATUS",
            amountUnit: "AMOUNT_UNIT",
            axaAdvReac: 'AXAADVREAC',
            cancellationReason: "CANCELLATION_REASON",
            cessationReason: "CESSATION_REASON",
            dosageType: "DOSAGE_TYPE",
            endSuspensionReason: "END_SUSPENSION_REASON",
            form: "FORM",
            glyAdvReac: 'GLYADVREAC',
            infusionSite: "INFUSION_SITE",
            injectableRoute: "ROUTE_INJ",
            mxClass: "MX_CLASS",
            mxCompositeType: "MX_COMPOSITE_TYPE",
            nonAdministrationReason: "NON_ADMIN_REASON",
            nonAdminReason: "NON_ADMIN_REASON",
            observationType: 'OBSERVATION_TYPE',
            rateUnit: "RATE_UNIT",
            reactivationReason: "REACTIVATION_REASON",
            route: "ROUTE",
            rxSource: "RX_SOURCE",
            rxStatus: "RX_STATUS",
            rxType: "RX_TYPE",
            schedulePriority: "SCHEDULE_PRIORITY",
            site: "SITE",
            strengthUnit: "STRENGTH_UNIT",
            suspensionReason: "SUSPENSION_REASON",
            visitAdministrationPriority: "VISIT_ADM_PRIORITY",
            timeUnit: "TIME_UNIT",
            volumeUnit: "VOLUME_UNIT",
            workflow: "WORKFLOW",
            workflowType: 'WORKFLOW',
            dosageVerification: 'DOSAGE_VERIFICATION'
        };

        //rx Group Key
        factory.rxGroupsKey =  {
            stat: "STAT",
            late: "LATE",
            due: "DUE",
            newRx: "NEW",
            schedule: "SCHL",
            continuous: "CONT",
            prn: "PRN",
            noSchelule: "NOSCHL",
            adHoc: "ADHOC",
            suspend: "SUSPEND",
            terminate: "TERMINATE",
            inactives: "INACTIVES"
        };

        //rx Status Key
        factory.rxStatusKey = {
            newRx: "NW",
            consulted: "CS",
            ceased: "DC",
            cancelled: "CA",
            suspended: "HD",
            completed: "CP",
            reactivated: "RL" 
        };
        //rx dosage type Key
        factory.dosageTypeKey = {
            quantified: "QUANT",
            continuous: "CONT",
            unquantified: "UNQUANT"
        };

        //rx dosage type Key
        factory.rxSchedulePriorityKey = {
            stat: "STAT",
            prn: "PRN",
            regular: "R"
        };
        //rx schedule template type
        factory.rxScheduleTemplateTypeKey = {
            days: "Days",
            hours: "Hours",
            minutes: "Minutes",
            weeks: "Weeks",
            intervals: "Intervals",
            listdaysofmonth: "ListDaysOfMonth",
            doseonly: "DoseOnly",
            listoftimestamps: "ListOfTimestamps"
        };
        //rx schedule template type
        factory.rxAdHocDoseType = {
            withdose: "withdose",
            withoutdose: "withoutdose",
            continue: "continue"
        };

        factory.rxAdHocAdministrationType = {
            dose: "dose",
            prn: "prn",
            planned: "planned"
        };
        factory.rxSourceKey = {
            pharmacy: "PHARM",
            adhoc: "ADHOC"
        };

        factory.severityKey = {
            Severe : 1,
            Serious : 2,
            Moderate : 3,
            Information : 4
        };

        factory.doubleCheckDoseStatus = {
            none: 'none',
            one: 'one',
            both: 'both'
        };

         //Date Time Picker Options
        factory.dateTimePickerOptions = {
            format: appSettingConstants.datetimePickerFormat,
            timeFormat: appSettingConstants.timeFormat
        };

        //Time Picker Options
        factory.timePickerOptions = {
            format: appSettingConstants.timeFormat,
            interval: 15
            // mask: '00:00'
        };

        //Gets the UTC Date
        factory.convertDateToUtc = function (date) {
            if (angular.isDate(date)) {
                // return new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
                //nowUtc = Mon Jan 02 2012 16:30:00 GMT-0600 (CST)
                return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
            } else {
                return this.convertDateToUtc(new Date(date));
            }
        };

        //Reduce time zone offset 
        factory.reduceTimeZoneOffset = function(date) {
            if (angular.isDate(date)) {
                var offset = date.getTimezoneOffset();
                date.setMinutes(date.getMinutes() - offset);
                return new Date(date.toString());
            } else {
                return this.reduceTimeZoneOffset(new Date(date));
            }
        };
        //get a clean date without milliseconds
        factory.localDateTime = function (date) {
            if (angular.isDate(date)) {
                return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes());
            } else {
                return this.localDateTime(new Date(date));
            }
        };
        factory.stringToDate = function (stringDate) {
            return new Date(stringDate.replace(/-/g, "/"));
        };
        

        //force the rendering of every fields in error
        factory.triggerValidations = function (form) {
            var error = form.$error;
            angular.forEach(error.required, function (field) {
                if (field.$invalid) {
                    field.$setViewValue(field.$viewValue);
                    field.$render();
                }
            });   
        };

        factory.serializeUrlParameter = function (obj) {
            return '?' + Object.keys(obj).reduce(function (array, key) { if (obj[key]) array.push(key + '=' + encodeURIComponent(obj[key])); return array; }, []).join('&');
        };
        
        // Function used to filter out some history rows.
        factory.historyRowFilter = function (row, metaItem) {
            // Special case: we want to filter out rows where boolean fields go from null to false.
            return metaItem.DisplayType !== "checkbox" || row.OldValue != null || row.NewValue != "0";
        };
        //utility
        factory.logoutAndRedirectToDefault = function () {
            var redirectToDefault = function () {
                $timeout(function () {
                    pagManager.redirectToDefault(cultureManager.currentCulture.Culture.Code);
                },1000);                
            }
            authService.logout().then(redirectToDefault());
        };

        return factory;
    });