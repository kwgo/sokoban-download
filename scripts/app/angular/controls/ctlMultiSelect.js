'use strict';

angular
    .module('lgi.emr.mar.web.controls')
    .directive('ctlMultiSelect',
    [
        function () {
            return {
                replace: false,
                restrict: 'AE',
                transclude: false,
                scope: false,
                template: function(element, attrs) {
                    return '<div multi-select input-model="' + attrs.inputModel + '" ' +
                        'default-label="' + attrs.defaultLabel + '" ' +
                        'button-label="' + attrs.buttonLabel + '" ' +
                        'item-label="' + attrs.itemLabel + '" ' +
                        'tick-property="' + attrs.tickProperty + '" ' +
                        'output-model="' + attrs.outputModel + '" ' + 
                        'helper-elements="' + attrs.helperElements + '" ' +
                        'on-open="' + attrs.onOpen + '"></div>';
                },
                link: function (scope, element, attrs) {
                    scope.setButtonSelectAllLabel(attrs.buttonSelectAllLabel);
                    scope.setButtonSelectNoneLabel(attrs.buttonSelectNoneLabel);
                }
            };
        }
    ]);