'use strict';

angular
    .module('lgi.emr.mar.web.decimalformat')
    .filter('floatformat', function () {
        return function (value) {
            if (angular.isDefined(value) && value !== null) {
                value = value.toString().replace(',', '.');
                if (value.length > 0 && value.charAt(0) == '.') value = '0' + value;
                if (value % 1 === 0) {
                    value = parseInt(value);
                } else {
                    value = parseFloat(value);
                }
                return value;
            }
            return value;
        };
    });

