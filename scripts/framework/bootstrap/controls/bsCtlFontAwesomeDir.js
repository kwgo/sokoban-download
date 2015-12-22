'use strict';

angular
    .module('lgi.infra.web.bootstrap.controls')
    .directive('faicon', ['bsCssHelper', function (bsCssHelper) {
        return {
            restrict: 'E',
            template: '<span bs-faicon="{{type}}" ng-transclude></span>',
            replace: true,
            transclude: true,
            scope: {
                type: '@'
            }
        };
    }]);
