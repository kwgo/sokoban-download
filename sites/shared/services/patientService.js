'use strict';

angular
    .module('app')
    .service('patientService',
        [
            '$http', '$q', '$filter', 'authService', 'locationService', 'appSettingConstants',
            function ($http, $q, $filter, authService, locationService, appSettingConstants) {
                var patientService = this;

                patientService.get = function (pid) {
                    var urlsvc = locationService.api + 'patientservice.svc/json/patient/' + pid + '/details';
                    var deferred = $q.defer();              

                    $http(
                        {
                            method: 'GET',
                            url: urlsvc
                        })
                        .success(function (responseData, status) {
                            if (responseData.HasErrors == false) {
                                deferred.resolve(angular.copy(responseData.Result));
                            }
                            else {
                                //console.log("Errors patientservice.svc: " + JSON.stringify(responseData));
                                deferred.reject();
                            }
                        })
                        .error(function (responseData, status) {
                            //console.log("Status patientservice.svc: " + status);
                            //console.log("Response patientservice.svc: " + JSON.stringify(responseData));
                            deferred.reject();
                        });

                    return deferred.promise;
                };
            }
        ]
 );