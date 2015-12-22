'use strict';
angular
    .module('lgi.infra.web.cultures')
    .factory('cultureInterceptor',
    [
        '$q', '$injector',
        function ($q, $injector) {
            var request = function (config) {
                var cultureManager = $injector.get("cultureManager");
                config.headers = config.headers || {};

                // angular js remove content-type if no data.
                if (angular.isUndefined(config.data)) {
                    config.data = "";
                }

                config.headers["X-INFRA-LANGUAGE"] = cultureManager.currentCulture.Culture.Code;
                
                return config || $q.when(config);
            };

            return {
                request: request
            };
        }
    ]);