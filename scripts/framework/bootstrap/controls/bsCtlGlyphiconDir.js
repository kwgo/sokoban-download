'use strict';

angular
    .module('lgi.infra.web.bootstrap.controls')
    .directive('glyphicon', ['bsCssHelper', function (bsCssHelper) {
    return {
        restrict: 'E',
        template: '<span bs-glyphicon="{{type}}" ng-transclude></span>',
        replace: true,
        transclude: true,
        scope: {
            type: '@'
        }
    };
}]);