'use strict';

angular
    .module('app')
    .service('visitService',
        [
            '$http', '$q', 'locationService',
            function ($http, $q, locationService) {               
                var visitService = this;
                var urlsvc = locationService.api + 'visitservice.svc/json/';

                visitService.get = function (id) {
                    var deferred = $q.defer();
                    var start = new Date().getTime();
                    $http(
                        {
                            method: 'GET',
                            url: urlsvc + 'visit/' + id
                        })
                        .success(function (responseData, status) {
                            if (responseData.HasErrors == false) {
                                //console.log("Response VisitService.svc - GET : " + JSON.stringify(responseData));
                                deferred.resolve(angular.copy(responseData.Result));
                              //  console.log('Time taken for request visit id ' + id + ': ' + (new Date().getTime() - start) + 'ms');
                            }
                            else {
                               // console.log("Errors VisitService.svc - GET: " + JSON.stringify(responseData));
                                deferred.reject();
                            }
                        })
                        .error(function (responseData, status) {
                            //console.log("Status VisitService.svc - GET: " + status);
                           // console.log("Response VisitService.svc - GET: " + JSON.stringify(responseData));
                            deferred.reject();
                        });

                    return deferred.promise;
                };

                visitService.getVisits = function (ids) {
                    var deferred = $q.defer();
                    $http.post(urlsvc + 'visits', JSON.stringify(ids), { headers: { 'Content-Type': 'application/json' } })
                        .success(function(responseData) {
                            if (responseData.HasErrors == false) {
                                //console.log("Response VisitService.svc - GET : " + JSON.stringify(responseData));
                                deferred.resolve(angular.copy(responseData.Result));
                               // console.log('Time taken for request visit ids ' + ids + ': ' + (new Date().getTime() - start) + 'ms');
                            } else {
                               // console.log("Errors VisitService.svc - GET: " + JSON.stringify(responseData));
                                deferred.reject();
                            }
                        })
                        .error(function(responseData, status) {
                            //console.log("Status VisitService.svc - GET: " + status);
                            //console.log("Response VisitService.svc - GET: " + JSON.stringify(responseData));

                            deferred.reject();
                        });

                    return deferred.promise;
                };

                visitService.save = function (item) {
                    var start = new Date().getTime();
                    var deferred = $q.defer();
                   // console.log("Response VisitService.svc - save : " + JSON.stringify(item));
                    $http.post(urlsvc + "save", JSON.stringify(item), { headers: { 'Content-Type': 'application/json' } })
                        .success(function(responseData, status) {
                            if (responseData.HasErrors == false) {
                               // console.log("Response VisitService.svc - save : " + JSON.stringify(responseData));
                                deferred.resolve(angular.copy(responseData));
                            } else {
                               // console.log("Errors VisitService.svc - save : " + JSON.stringify(responseData));
                                deferred.reject();
                            }
                           // console.log('Time taken to save visit id ' + item.id + ': ' + (new Date().getTime() - start) + 'ms');
                        })
                        .error(function(responseData, status) {
                            deferred.resolve(angular.copy(responseData));
                        });

                    return deferred.promise;
                };
            }
        ]
    );