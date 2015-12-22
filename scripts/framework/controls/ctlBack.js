'use strict';

angular
    .module('lgi.infra.web.controls')
    .directive('ctlBack',
    [
        '$window',
        function ($window) {
            return {
                restrict: 'A',
                link: function (scope, element, attrs) {
                    element.on('click', function () {
                        $window.history.back();
                    });
                }
            };
        }
    ]);