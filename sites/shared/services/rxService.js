'use strict';

angular
    .module('app')
    .service('rxService',
        [
            '$http', 'locationService', '$filter',
            function ($http, locationService, $filter) {

                var rxService = this;
                var rxsActive;

                rxService.emptyRxsActive = function() {
                    rxsActive = null;
                };
                rxService.getActive = function (applicationSourceId, visitId, excludeMarkInError) {

                  
                    var updatedRxSince = "";
                    var updatedAdministrationSince = new Date(2000);

                    if (rxsActive != null && rxsActive != undefined) {
                        var listRx = Enumerable.From(rxsActive.Result).OrderByDescending(function(i) {
                            return i.modifiedOn;
                        });
                        if (listRx.Any())
                            updatedRxSince = listRx.First().modifiedOn;

                        angular.forEach(rxsActive.Result, function (rx) {
                            var admins = Enumerable.From(rx.administrations).Where(function (i) { return i.modifiedOn > updatedAdministrationSince; }).OrderBy(function (i) {
                                return i.modifiedOn;
                            });
                            if (admins.Any()){
                                updatedAdministrationSince = admins.First().modifiedOn;
                            }
                        });
                    }

                    var start = new Date().getTime();
                    //add validation for parameters
                    var urlsvc;
                    if (updatedRxSince != "")
                        urlsvc = locationService.api + 'rxservice.svc/json/rxs/visitSince/' + visitId + '/' + $filter('date')(new Date(updatedRxSince), 'yyyyMMddHHmmss')
                                  + '/' + $filter('date')(new Date(updatedAdministrationSince), 'yyyyMMddHHmmss') ;
                    else
                        urlsvc = locationService.api + 'rxservice.svc/json/rxs/visit/' + visitId ;

                    if (angular.isDefined(excludeMarkInError)) urlsvc = urlsvc + '/' + excludeMarkInError.toString();

                    return $http(
                        {
                            method: 'GET',
                            url: urlsvc
                        })
                        .success(function (responseData, status) {
                            if (responseData.HasErrors == false) {
                                //console.log("Response rxservice.svc: " + JSON.stringify(responseData));
                            }
                            else {
                             //   console.log("Errors rxservice.svc: " + JSON.stringify(responseData));
                            }
                            console.log('Time taken for request RX visitId ' + visitId + ': ' + (new Date().getTime() - start) + 'ms');
                        })
                        .error(function (responseData, status) {
                            //  console.log("Status rxservice.svc: " + status);
                         //  console.log("Response rxservice.svc: " + JSON.stringify(responseData));
                        })
                        .then(function (responseData) {
                            //rxService.status = "ENDED";
                           // console.log("Response rxservice.svc: " + JSON.stringify(responseData));
                          //  console.log('Time taken for request active rx, visitId = ' + visitId + ': ' + (new Date().getTime() - start) + 'ms');
                            if (responseData.data != null && responseData.data != undefined) {
                                if (rxsActive == null || rxsActive == undefined)
                                    rxsActive = responseData.data;
                                else {
                                    angular.forEach(responseData.data.Result, function (rx) {
                                        var targets = Enumerable.From(rxsActive.Result).Where(function (i) { return i.id == rx.id; });
                                        if (targets.Any()) {
                                            var index = rxsActive.Result.indexOf(targets.First());
                                            if (index > -1) {
                                                rxsActive.Result[index] = rx;
                                            }
                                        } else {
                                            rxsActive.Result.unshift(rx);
                                        }
                                    });
                                }
                            }

                        return rxsActive;
                    });
                };

                rxService.getInactive = function (applicationSourceId, visitId, dateInactive, excludeMarkInError) {
                    var start = new Date().getTime();
                    var urlsvc = '';
                    //add validation for parameters

                    if (angular.isDefined(excludeMarkInError)) urlsvc = locationService.api + 'rxservice.svc/json/rxs/visit/' + visitId + '/' + excludeMarkInError.toString() + '/?inactiveSince=' + dateInactive;
                    else urlsvc = locationService.api + 'rxservice.svc/json/rxs/visit/' + visitId + '?inactiveSince=' + dateInactive;

                    return $http(
                        {
                            method: 'GET',
                            url: urlsvc
                        })
                        .success(function (responseData, status) {
                            if (responseData.HasErrors == false) {
                                //console.log("Response rxservice.svc: " + JSON.stringify(responseData));
                            }
                            else {
                              //  console.log("Errors rxservice.svc: " + JSON.stringify(responseData));
                            }
                        })
                        .error(function (responseData, status) {
                            //  console.log("Status rxservice.svc: " + status);
                            // console.log("Response rxservice.svc: " + JSON.stringify(responseData));
                        })
                        .then(function (responseData) {
                            //rxService.status = "ENDED";
                            //console.log('Time taken for request inactive RX(s) since ' + dateInactive + ': ' + (new Date().getTime() - start) + 'ms');
                            return responseData.data;
                        });
                };

                rxService.launchRxStatusUpdateJob = function() {
                    var start = new Date().getTime();
                    //add validation for parameters
                    var urlsvc = locationService.api + 'rxservice.svc/json/rxs/jobupdatestatus';

                    return $http(
                        {
                            method: 'GET',
                            url: urlsvc
                        })
                        .success(function (responseData, status) {
                            if (responseData.HasErrors == false) {
                                //console.log("Response rxservice.svc: " + JSON.stringify(responseData));
                            }
                            else {
                             //   console.log("Errors rxservice.svc: " + JSON.stringify(responseData));
                            }
                        })
                        .error(function (responseData, status) {
                            //  console.log("Status rxservice.svc: " + status);
                            // console.log("Response rxservice.svc: " + JSON.stringify(responseData));
                        })
                        .then(function (responseData) {
                            //rxService.status = "ENDED";
                         //   console.log('Time taken for request rx status update job: ' + (new Date().getTime() - start) + 'ms');
                            return responseData.data;
                        });
                };
            }
        ]
 );