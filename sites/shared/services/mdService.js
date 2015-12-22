'use strict';

angular
    .module('app')
    .service('mdService', ['$http', '$log', '$q', 'locationService', 'appSettingConstants', function ($http, $log, $q, locationService, appSettingConstants) {
    return {
            get : function () {
            var urlsvc = locationService.api + 'mdservice.svc/json/mds';
            var sourceName = appSettingConstants.mdsKey;
            var deferred = $q.defer();
            var dataCache = sessionStorage.getItem(sourceName);
            if (dataCache != null) {
                deferred.resolve(JSON.parse(dataCache));
            } else {
                $http(
                {
                    method: 'GET',
                    url: urlsvc
                })
                .success(function(responseData, status) {
                    if (responseData.HasErrors == false) {

                    } else {

                    }
                })
                .error(function(responseData, status) {

                })
                .then(function (responseData) {
                    var mds = responseData.data.Result;
                    sessionStorage.setItem(sourceName, JSON.stringify(mds));
                    deferred.resolve(mds);
                });
            }
            return deferred.promise;
            },
            getByLicenceNumber :  function(licenceNumber) {
                var urlsvc = locationService.api + 'mdservice.svc/json/md/' + licenceNumber;
                var deferred = $q.defer();
                $http(
                    {
                        method: 'GET',
                        url: urlsvc
                    })
                    .success(function(responseData, status) {
                        if (responseData.HasErrors == false) {

                        } else {

                        }
                    })
                    .error(function(responseData, status) {

                    })
                    .then(function (responseData) {

                        deferred.resolve(responseData.data.Result);
                    });
                return deferred.promise;
            }
       };
}]);
