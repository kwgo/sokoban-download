'use strict';

angular
    .module('lgi.infra.web.controls')
    .directive('ctlAutoFocus', function ($timeout) {
        return {
            restrict: 'AC',
            link: function (scope, element) {
                $timeout(function () {
                    element[0].focus();
                }, 250);
            }
        };
    });