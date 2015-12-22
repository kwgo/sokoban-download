'use strict';

angular
    .module('lgi.emr.mar.web.bootstrap.controls')
    .directive('lgiicon', ['bsCssHelper', function (bsCssHelper) {
        return {
            restrict: 'E',
            template: '<span bs-lgiicon="{{type}}" ng-transclude></span>',
            replace: true,
            transclude: true,
            scope: {
                type: '@'
            }
        };
    }]);
