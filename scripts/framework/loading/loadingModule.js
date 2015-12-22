'use strict';
angular
    .module('lgi.infra.web.loading', [])
    .config(
    [
        '$httpProvider',
        function($httpProvider) {
            $httpProvider.interceptors.push('loadingInterceptor');
        }
    ]);
$.addScript('scripts/framework/loading/loadingInterceptor.js');
$.addScript('scripts/framework/loading/loadingProvider.js');