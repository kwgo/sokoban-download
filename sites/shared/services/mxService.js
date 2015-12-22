'use strict';

angular
    .module('app')
    .service('mxService', ['$http', '$log', '$q', 'locationService', 'appSettingsFactory', function ($http, $log, $q, locationService, appSettingsFactory) {

    return {
        get: function (criteria) {
            var urlsvc = locationService.api + 'mxservice.svc/json/mx' + appSettingsFactory.serializeUrlParameter(criteria);
            var deferred = $q.defer();
            $http(
                {
                    method: 'GET',
                    url: urlsvc
                })
                .success(function (responseData, status) {
                    if (responseData.HasErrors == false) {
                      // $log.log("Response mxservice.svc: " + JSON.stringify(responseData));
                    } else {
                       //$log.log("Errors mxservice.svc: " + JSON.stringify(responseData));
                    }
                })
                .error(function (responseData, status) {
                  // $log.log("Response mxservice.svc: " + JSON.stringify(responseData));
                })
                .then(function (responseData) {
                  // $log.log("Response mxservice.svc: " + JSON.stringify(responseData));
                    deferred.resolve(responseData.data.Result);
                });
            return deferred.promise;
        }
    }
}]);      


