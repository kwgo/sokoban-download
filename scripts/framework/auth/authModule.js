'use strict';
angular
    .module('lgi.infra.web.auth', [])
    .config(
    [
        '$httpProvider',
        function ($httpProvider) {
           $httpProvider.interceptors.push('authInterceptor');
        }
    ]);
$.addScript('scripts/framework/auth/authProvider.js');
$.addScript('scripts/framework/auth/authInterceptor.js');
$.addScript('scripts/framework/auth/authLoginPopupDir.js');
$.addScript('scripts/framework/auth/authPermissionDir.js');
$.addScript('scripts/framework/auth/controllers/loginController.js');