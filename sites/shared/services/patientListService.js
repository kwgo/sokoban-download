'use strict';

angular
    .module('app')
    .service('patientListService',
        [
            '$http', '$q', 'authService', 'locationService',
            function ($http, $q, authService, locationService) {
                var patientListService = this;

                patientListService.getRosterList = function () {
                    var url = locationService.api + 'rosterservice.svc/json/roster';
                    var deferred = $q.defer();
                    var start = new Date().getTime();

                    $http({
                        method: 'GET',
                        url: url
                    })
                    .success(function (responseData, status) {
                        if (responseData.HasErrors == false) {
                            //console.log("Response patientlistservice.svc: " + JSON.stringify(responseData));
                            console.log('Time taken for request roster list : ' + (new Date().getTime() - start) + 'ms');
                            deferred.resolve(angular.copy(responseData.Result));
                        }
                        else {
                            //console.log("Errors patientlistservice.svc: " + JSON.stringify(responseData));
                            deferred.reject();
                        }

                    })
                    .error(function (responseData, status) {
                        //console.log("Status patientlistservice.svc: " + status);
                        //console.log("Response patientlistservice.svc: " + JSON.stringify(responseData));

                        deferred.reject();

                    });

                    return deferred.promise;
                };

                patientListService.getRoster = function (rosterId) {
                    var url = locationService.api + "rosterservice.svc/json/roster/" + rosterId + "/content";
                    var deferred = $q.defer();

                    $http({
                        method: 'GET',
                        url: url
                    })
                    .success(function (responseData, status) {
                        if (responseData.HasErrors == false) {
                            //console.log("Response patientlistservice.svc: " + JSON.stringify(responseData));
                            deferred.resolve(angular.copy(responseData.Result));
                        }
                        else {
                            //console.log("Errors patientlistservice.svc: " + JSON.stringify(responseData));
                            deferred.reject();
                        }

                    })
                    .error(function (responseData, status) {
                        //console.log("Status patientlistservice.svc: " + status);
                        //console.log("Response patientlistservice.svc: " + JSON.stringify(responseData));

                        deferred.reject();
                    });

                    return deferred.promise;
                };
            }
        ]
 );