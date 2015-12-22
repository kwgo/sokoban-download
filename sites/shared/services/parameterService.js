

'use strict';

angular
    .module('app')
    .service('parameterService',
        [
            '$http', '$q', 'locationService', 'appSettingConstants',
            function ($http, $q, locationService, appSettingConstants) {
                var parameterService = this;
                var sourceName = appSettingConstants.parameterKey;
                parameterService.get = function () {
                    var urlsvc = locationService.api + 'parameterservice.svc/json/parameter';
                    var deferred = $q.defer();
                    var dataCache = sessionStorage.getItem(sourceName);
                    if (dataCache != null) {
                        deferred.resolve(JSON.parse(dataCache));
                    } 
                    else {
                        $http.get(urlsvc)
                         .success(function (responseData) {
                            var parameter = responseData.Result;
                            sessionStorage.setItem(sourceName, JSON.stringify(parameter));
                            deferred.resolve(parameter);
                         });
                    }
                    return deferred.promise;
                };
            }
        ]
 );