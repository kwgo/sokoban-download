'use strict';

angular
    .module('lgi.infra.web.utils')
    .service('utlLogger',
    [
        '$log',
        function ($log) {
            this.log = function (payload) {
                $log.log(payload);
            };

            this.info = function (payload) {
                $log.info(payload);
            };

            this.warn = function (payload) {
                $log.warn(payload);
            };

            this.error = function (payload) {
                $log.error(payload);
            };
        }
    ]);