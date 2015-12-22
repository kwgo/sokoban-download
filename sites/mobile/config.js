'use strict';

angular
    .module('lgi.infra.web.auth')
    .config(
    [
        'authServiceProvider', 'locationServiceProvider', '$systemParameters',
        function (authServiceProvider, locationServiceProvider, $systemParameters) {
            authServiceProvider.setAuthentication({
                remember: false,
                controller: 'madmLoginController'
            });
            authServiceProvider.setKeepAlive({
                enabled: true,
                interval: 60000 * 2
            });
            authServiceProvider.setAutoLogout({
                enabled: true,
                interval: 60000 * $systemParameters.sessionExpirationDelay,
                countdown: 30,
                templateUrl: locationServiceProvider.shared.views + 'autologout.html'
            });
        }
    ]);