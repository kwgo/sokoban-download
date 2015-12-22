'use strict';
angular
    .module('lgi.emr.mar.web.httpheader', [])
    .config(
    [
        '$httpProvider',
        function ($httpProvider) {
            $httpProvider.interceptors.push('httpHeaderInterceptor');
            if (!$httpProvider.defaults.headers.get) {
                $httpProvider.defaults.headers.common = {};
            }
            $httpProvider.defaults.headers.common["Cache-Control"] = "no-cache";
            $httpProvider.defaults.headers.common.Pragma = "no-cache";
        }
    ]);
$.addScript('scripts/app/angular/httpHeader/httpHeaderInterceptor.js');