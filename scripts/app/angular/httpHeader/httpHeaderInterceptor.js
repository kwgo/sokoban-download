'use strict';
//Factory to inject the X_CALLERID header field to all request
angular
    .module('lgi.emr.mar.web.httpheader')
    .factory('httpHeaderInterceptor', ['$q', function ($q) {

        var headerInterceptor = {
            request: function (config) {
                config.headers = config.headers || {};
                config.headers['X-CALLERID'] = 'EMAR';
                config.headers['CorrelationId'] = generateGUID();
                return config || $q.when(config);
            }
        };

        var generateGUID = function () {
            var d = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
            return uuid;
        };

        return headerInterceptor;
    }]);
