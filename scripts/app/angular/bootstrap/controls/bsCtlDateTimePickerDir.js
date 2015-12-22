/*
Directive example:

With override the language
<div bs-date-time-picker bs-language="{{cultureManager.currentCulture.Culture.Code}}"
    ng-model="model.stopTimestamp">
</div>

Without override the language
<div bs-date-time-picker ng-model="model.stopTimestamp">
</div>

*/

'use strict';

angular.module('lgi.infra.web.bootstrap.controls', [])
    .directive('bsDateTimePicker', [
        'cultureManager', '$timeout', '$filter',
        function (cultureManager, $timeout, $filter) {
            return {
                require: 'ngModel',
                restrict: 'AE',
                scope: {
                    date: '=ngModel',
                    bsErrMessage: '@',
                    bsFormat: '@',
                    bsKeepOpen: '@',
                    bsLanguage: '@',
                    bsMaxDate: '@',
                    bsMinDate: '@',
                    ngDisabled: '@',
                    ngRequired: '@',
                    bsTabindex: '@',
                    ngChange: '&'
                },
                template:
                    '<div class="input-group date">' +
                    '    <input type="text" class="form-control" ng-model="date" ng-disabled="{{ngDisabled}}" ng-required="{{ngRequired}}" default-err-message="{{bsErrMessage}}"  ' +
                        'ng-blur="blur()" tabindex="{{bsTabindex}}"/>' +
                    '    <span class="input-group-addon">' +
                    '        <span class="fa fa-calendar"></span>' +
                    '    </span>' +
                    '</div>',
                link: function ($scope, $elem, $attrs, $modelCtrl) {
                    // Override the language
                    var language = angular.copy(cultureManager.currentCulture.Culture.Code.toLowerCase());
                    if (angular.isDefined($scope.bsLanguage) && $scope.bsLanguage != "")
                        language = $scope.bsLanguage;

                    var format = (angular.isDefined($scope.bsFormat) && $scope.bsFormat != "") ? $scope.bsFormat : 'yyyy-MM-dd HH:mm';
                    $scope.date = $filter('date')($scope.date, format);

                    var elem = $elem.find('div');
                    elem.datetimepicker({
                        useCurrent: false,
                        format: (angular.isDefined($scope.bsFormat) && $scope.bsFormat != "") ? moment().toMomentFormatString($scope.bsFormat) : 'YYYY-MM-DD HH:mm', // Assuming bsFormat is an angularjs format string
                        icons: {
                            time: "fa fa-lg fa-clock-o",
                            date: "fa fa-lg fa-calendar",
                            up: "fa fa-lg fa-arrow-up",
                            down: "fa fa-lg fa-arrow-down",
                            previous: 'fa fa-lg fa-chevron-left',
                            next: 'fa fa-lg fa-chevron-right',
                            today: 'fa fa-lg fa-crosshairs',
                            clear: 'fa fa-lg fa-trash-o',
                        },
                        keepOpen: angular.isDefined($scope.bsKeepOpen),
                        locale: language,
                        maxDate: (angular.isDefined($scope.bsMaxDate) && $scope.bsMaxDate != "") ? new moment($scope.bsMaxDate) : false,
                        minDate: (angular.isDefined($scope.bsMinDate) && $scope.bsMinDate != "") ? new moment($scope.bsMinDate) : false,
                        showClear: angular.isDefined($attrs.bsShowClear),
                        showTodayButton: angular.isDefined($attrs.bsShowToday),
                        showClose: true,
                        keepInvalid: false,
                        widgetPositioning: {
                            horizontal: 'left',
                            vertical: 'auto'
                        }
                    });

                    elem.data('DateTimePicker').date($scope.date);

                    if (angular.isDefined($attrs.bsMaxDateNow)) {
                        $(elem).on('dp.show', function (e) {
                            elem.data('DateTimePicker').maxDate(new moment().add(1, 'minutes'));
                        });
                    }

                    $(elem).on('dp.show', function (e) {
                        var currentDate = moment($modelCtrl.$viewValue);
                        if (angular.isDefined(currentDate._d) && angular.isDate(currentDate._d))
                            elem.data('DateTimePicker').date(currentDate);
                    });
                    
                    $(elem).on('dp.hide', function (e) {
                        var currentDate = elem.data('DateTimePicker').date();
                        if (angular.isUndefined(currentDate) || currentDate === null) {
                            $modelCtrl.$setViewValue(null);
                            var parentForm = elem.inheritedData('$formController');
                            var found = false, set = false;
                            if (parentForm != null && angular.isDefined(parentForm) && parentForm.$invalid && angular.isDefined(parentForm.$error && angular.isDefined(parentForm.$error.required))) {
                                angular.forEach(parentForm.$error.required, function (error) {
                                    if (!set){
                                        if (angular.isDefined(error.$setViewValue) && found) {
                                            error.$setViewValue("");
                                            set = true;
                                        }
                                        if ($modelCtrl.$name == error.$name) {
                                            error.$setViewValue("");
                                            found = true;
                                        }
                                    }
                                });
                            }
                        }
                    });
                    
                    if (angular.isDefined($attrs.bsMinDateNow)) {
                        $(elem).on('dp.show', function (e) {
                            elem.data('DateTimePicker').minDate(new moment());
                        });
                    }

                    var updating = false;
                    $(elem).on('dp.change', function (e) {
                        onDateChange(e.date);
                    });

                    function onDateChange(date) {
                        if (updating == true)
                            return;

                        var dateFormatted;
                        var picker = elem.data('DateTimePicker');

                        if (angular.isDate(picker.minDate) && picker.minDate > date || angular.isDate(picker.maxDate) && picker.maxDate > date) {
                            dateFormatted = $filter('date')($scope.backupDate, format);
                        } else {
                            if (date != null)
                                dateFormatted = $filter('date')(date._d, format);
                        }

                        elem.data('DateTimePicker').date(dateFormatted);
                        $modelCtrl.$setViewValue(dateFormatted);
                        if ($modelCtrl.$invalid) {
                            var dateTimePicker = elem.data('DateTimePicker');
                            dateTimePicker.date($modelCtrl.$viewValue);
                        }

                        $scope.$apply();
                    }

                    $scope.$watch(
                        function () {
                            return $scope.date;
                        },
                        function (newValue, oldValue) {
                            updating = true;
                            var newVal = null;
                            if (angular.isDate(newValue)) {
                                newVal = $filter('date')(newValue, format);
                            };
                            if (angular.isDefined(newVal) && newVal != null) {
                                if (newVal.length >= format.length) {
                                    var dateFormatted = $filter('date')(newVal, format);
                                    var oldFormatted = $filter('date')(oldValue, format);
                                    if ((typeof newVal == 'string') && dateFormatted != oldFormatted) {
                                        elem.data('DateTimePicker').date(newVal);
                                    } else {
                                        if (angular.isDate(newValue))
                                            elem.data('DateTimePicker').date(newValue);
                                    }
                                }
                            }
                            $scope.backupDate = angular.copy(elem.data('DateTimePicker').date());
                            updating = false;
                        }
                    );

                    $scope.blur = function () {
                        if ($scope.date == null)
                            return;

                        var picker = elem.data('DateTimePicker');
                        var date = picker.date();
                        
                        if (date != null && angular.isDefined(date) && angular.isDefined(date._d)) {
                            var dateFormatted;
                            if (angular.isDate(picker.minDate) && picker.minDate > date || angular.isDate(picker.maxDate) && picker.maxDate < date) {
                                dateFormatted = $filter('date')($scope.backupDate, format);
                            } else {
                                dateFormatted = $filter('date')(date._d, format);
                            }
                            $modelCtrl.$setViewValue(dateFormatted);
                        } else {
                            $modelCtrl.$setViewValue('');
                        }
                    };

                    $attrs.$observe('ngDisabled', function (disabled) {
                        updating = true;
                        var date = undefined;
                        switch (disabled) {
                            case 'true': {
                                elem.data('DateTimePicker').disable();
                                date = $scope.dateValue;
                                break;
                            }
                            case 'false': {
                                elem.data('DateTimePicker').enable();
                                date = $scope.dateValue;
                                break;
                            }
                            default: {
                                break;
                            }
                        }
                        if (angular.isDefined(date)) {
                            $timeout(function () {
                                elem.data('DateTimePicker').date(date);
                            }, 0, false);
                        }
                        updating = false;
                    });

                }
            };
        }
    ])
    .directive('bsDateTimePicker2', [
        function () {
            return {
                link: function ($scope, $elem, $attrs) {
                    $elem.datetimepicker({
                        showClear: true,
                        showTodayButton: true,
                    });
                }
            }
        }
    ]);
