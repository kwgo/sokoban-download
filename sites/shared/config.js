'use strict';

angular
    .module('app')
    .config(
    [
        'notificationServiceProvider', 'popupServiceProvider', '$httpProvider',
        function (notificationServiceProvider, popupServiceProvider, $httpProvider) {
            if (window.location.href.indexOf("madm2") != -1) {
                notificationServiceProvider.setDebug(false);
            } else {
                notificationServiceProvider.setDebug(true);
            }
            notificationServiceProvider.setAutoHideAfter(10000);

            // Configure popup templates
            popupServiceProvider.setViewPaths({
                info: 'sites/shared/views/popup/info.html',
                warn: 'sites/shared/views/popup/warning.html',
                error: 'sites/shared/views/popup/error.html',
                confirm: 'sites/shared/views/popup/confirm.html',
                frame: 'sites/shared/views/popup/frame.html',
            });

            // Uncomment to disable default notification (Red bootstrap Well)
            $httpProvider.interceptors.splice($httpProvider.interceptors.indexOf('errorHttpInterceptor'), 1);
        }
    ])
    .run(
    [
        '$rootScope', 'authService', 'notificationService',
        function ($rootScope, authService, notificationService) {
            $rootScope.$on(authService.events.keepAliveFailed, function() {
                notificationService.info({
                    title: $rootScope.cultureManager.resources.translate('SESSIONEXPIREDTITLE'),
                    message: $rootScope.cultureManager.resources.translate('SESSIONEXPIREDMESSAGE')
                });
            });
            $rootScope.$on(authService.events.unauthorized, function () {
                notificationService.info({
                    title: $rootScope.cultureManager.resources.translate('UNAUTHORIZEDTITLE'),
                    message: $rootScope.cultureManager.resources.translate('UNAUTHORIZEDMESSAGE')
                });
            });
        }
    ]);