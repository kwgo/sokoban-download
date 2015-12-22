'use strict';

angular
    .module('app')
    .service('versionService',
        [
            '$http', '$q', 'locationService',
            function ($http, $q, locationService) {
                var versionService = this;
                var urlsvc = locationService.api + 'versionservice.svc/json/';

                versionService.version = function () {
                    var deferred = $q.defer();
                    var start = new Date().getTime();
                    $http(
                        {
                            method: 'GET',
                            url: urlsvc + 'version'
                        })
                        .success(function (responseData, status) {
                            if (responseData.HasErrors == false) {
                                //console.log("Response VersionService.svc - GET : " + JSON.stringify(responseData));
                                deferred.resolve(angular.copy(responseData.Result));
                                //console.log('Time taken for request version : ' + (new Date().getTime() - start) + 'ms');
                            }
                            else {
                                console.log("Errors VersionService.svc - GET: " + JSON.stringify(responseData));
                                deferred.reject();
                            }
                        })
                        .error(function (responseData, status) {
                            console.log("Status VersionService.svc - GET: " + status);
                            console.log("Response VersionService.svc - GET: " + JSON.stringify(responseData));
                            deferred.reject();
                        });

                    return deferred.promise;
                };
            }
        ]
    );