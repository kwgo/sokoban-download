'use strict';

angular
    .module('lgi.emr.mar.web.controls')
    .directive('ctlNumbersOnly',
    [ '$filter',
        function ($filter) {
            return {
                restrict: 'A',
                require: '?ngModel',
                scope: {
                    allowDecimal: '@',
                    numberOfDecimals: '@',
                    min: '@',
                    max: '@'
                },

                link: function (scope, element, attrs, ngModelCtrl) {
                    //var separator = $locale.NUMBER_FORMATS.DECIMAL_SEP;
                    if (!ngModelCtrl) return;

                    // Add pattern [0-9]* to bring numeric keyboard on tablet.
                    var input = element.find('input');
                    if (input != null && angular.isDefined(input.context)){
                        input.context.pattern = "[0-9]*";
                    }

                    ngModelCtrl.$parsers.unshift(function (inputValue) {
                        var decimalFound = false;

                        if (!angular.isDefined(inputValue) || inputValue == null || !angular.isDefined(inputValue.split)) return null;

                        var digits = inputValue.split('').filter(function (s, i) {
                            var bReturn = (!isNaN(s) && s != ' ');
                            if (!bReturn && attrs.allowDecimal && attrs.allowDecimal == "true") {
                                if ((s == '.' || s == ',') && decimalFound == false) {
                                    decimalFound = true;
                                    bReturn = true;
                                }
                            }

                            return bReturn;

                        }).join('');

                        digits = digits.replace(",", ".");

                        if (decimalFound && angular.isDefined(attrs.numberOfDecimals)) {
                            var decimals = (digits + "").split(".")[1];
                            if (attrs.numberOfDecimals < decimals.length) {
                                digits = digits.substring(0, digits.length - 1);
                            }
                        }

                        $(element).on('blur focus', function (e) {
                            var mininvalid = (attrs.min && !isNaN(attrs.min) && parseFloat(ngModelCtrl.$viewValue) < parseFloat(attrs.min));
                            var maxinvalid = (attrs.max && !isNaN(attrs.max) && parseFloat(ngModelCtrl.$viewValue) > parseFloat(attrs.max));

                            ngModelCtrl.$setValidity("min", !mininvalid);
                            ngModelCtrl.$setValidity("max", !maxinvalid);
                            ngModelCtrl.$render();
                            return;
                        });

                        ngModelCtrl.$viewValue = digits;
                        ngModelCtrl.$render();

                        return digits;
                    });
                }
            };
        }
    ]);