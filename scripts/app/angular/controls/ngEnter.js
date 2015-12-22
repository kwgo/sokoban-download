'use strict';

angular
    .module('lgi.emr.mar.web.controls')
    .directive('ngEnter',  function () {
        return function (scope, element, attrs) {
            element.bind('keydown keypress', function (event) {
                if (event.which === 13) {
                    scope.$apply(function () {
                        scope.$eval(attrs.ngEnter || attrs.ngClick, { $event: event });
                    });
                    event.preventDefault();
                }
            });
        };
    });