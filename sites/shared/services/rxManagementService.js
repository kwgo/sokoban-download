'use strict';

angular
    .module('app')
    .service('rxManagementService',
        [
            '$http', 'locationService',
            function ($http, locationService) {
                var RxService = this;
                var urlsvc = locationService.api + 'rxservice.svc/json/';
                // RxService.getRXS = function (id, toSignOnly, administrationList, olderThan, includePlanned)
                RxService.getRXS = function (id, toSignOnly, administrationList, blockToTake, includePlanned) {
                    var httpMethod = 'GET';
                    var dataPost = '';
                    var isCollection = false;
                    var url = urlsvc + 'rx/' + id[0] + '/administrations';
                    if (toSignOnly) {
                        url += '/tobesigned';
                    }
                    else if (administrationList) {
                        url += '/realized?blockToTake=' + blockToTake;
                    }
                    else {
                        url = urlsvc + 'rxs';
                        httpMethod = 'POST';
                        dataPost = Array.isArray(id) ? JSON.stringify(id.join()) : JSON.stringify(id);
                        isCollection = true;
                    }

                    return $http( 
                        {
                            method: httpMethod,
                            url: url,
                            data: dataPost
                        })
                        .success(function (responseData, status) {
                            if (responseData.HasErrors == false) {
                                //console.log("Response RxService.svc - GET : " + JSON.stringify(responseData));
                            }
                            else {
                               // console.log("Errors RxService.svc - GET: " + JSON.stringify(responseData));
                            }
                        })
                        .error(function (responseData, status) {
                           // console.log("Status RxService.svc - GET: " + status);
                           // console.log("Response RxService.svc - GET: " + JSON.stringify(responseData));
                            return responseData;
                        })
                        .then(function (responseData) {
                           // console.log('Time taken to get RX id(s) ' + id + ': ' + (new Date().getTime() - start) + 'ms');

                            // Transform single Rx response into a one item collection to suite controler 
                            // expectations since backend always returns one item on /administrations route...
                            if (!isCollection) {
                                responseData.data.Result = [responseData.data.Result];
                            }

                            return responseData.data;
                        });
                };
                //saving a New Rx
                RxService.create = function (item) {
                    var start = new Date().getTime();
                    // console.log("Response RxService.svc - save : " + JSON.stringify(item));
                    return $http.post(urlsvc + "rx", JSON.stringify(item), { headers: { 'Content-Type': 'application/json' } }).
                        success(function (responseData, status) {
                            if (responseData.HasErrors == false) {
                                //console.log("Response RxService.svc - save : " + JSON.stringify(responseData));
                            }
                            else {
                               // console.log("Errors RxService.svc - save : " + JSON.stringify(responseData));
                            }
                        }).
                        error(function (responseData, status) {
                           // console.log("Status RxService.svc - save : " + status);
                            // console.log("Response RxService.svc - save : " + JSON.stringify(responseData));
                        }).
                        then(function (responseData) {
                            // console.log(JSON.stringify(responseData.data));
                          //  console.log('Time taken to save RX id(s) ' + item.id + ': ' + (new Date().getTime() - start) + 'ms');
                            return responseData.data;
                        });
                };
                RxService.save = function (item) {
                    var start = new Date().getTime();


                    //console.log("Response RxService.svc - save : " + JSON.useDateParser(item));
                    return $http.put(urlsvc + "rx/" + item.id, JSON.stringify(item), { headers: { 'Content-Type': 'application/json' } }).
                        success(function (responseData, status) {
                            if (responseData.HasErrors == false) {
                                //console.log("Response RxService.svc - save : " + JSON.stringify(responseData));
                            }
                            else {
                             //  console.log("Errors RxService.svc - save : " + JSON.stringify(responseData));
                            }
                        }).
                        error(function (responseData, status) {
                           // console.log("Status RxService.svc - save : " + status );
                           // console.log("Response RxService.svc - save : " + JSON.stringify(responseData));
                        }).
                        then(function (responseData) {
                           // console.log(JSON.stringify(responseData.data));
                           // console.log('Time taken to save RX id(s) ' + item.id + ': ' + (new Date().getTime() - start) + 'ms');
                            return responseData.data;
                        });
                };

                RxService.validate = function (items) {
                    return $http.put(urlsvc + "rxs/validate", JSON.stringify(items), { headers: { 'Content-Type': 'application/json' } }).
                        success(function (responseData, status) {
                            if (responseData.HasErrors == false) {
                                //console.log("Response RxService.svc - validate : " + JSON.stringify(responseData));
                            }
                            else {
                              //  console.log("Errors RxService.svc - validate : " + JSON.stringify(responseData));
                            }
                        }).
                        error(function (responseData, status) {
                          //  console.log("Status RxService.svc - validate : " + status);
                          //  console.log("Response RxService.svc - validate : " + JSON.stringify(responseData));
                        }).
                        then(function (responseData) {
                            //console.log(responseData);
                            return responseData.data;
                        });
                };

                // mode = cease or reactivation 
                RxService.cease = function (ids, reason, note, mode, excludeMarkInError) {
                    var item =
                    {
                        rxIds: Array.isArray(ids) ? ids : ids.split(","),
                        rxCeaseDto:
                        {
                            "reasonId": reason,
                            "note": note
                        },
                        isExcludeMarkInError: excludeMarkInError
                    };
                    var subUrl = "rxs";

                    if (mode == "REACTIVATION") { // The we should cancel the ceasing
                        subUrl += "/cancelcessation";
                    }
                    else {
                        subUrl += "/cease";
                    }

                    
                    return $http.put(urlsvc + subUrl, JSON.stringify(item), { headers: { 'Content-Type': 'application/json' } }).
                        success(function (responseData, status) {
                            if (responseData.HasErrors == false) {
                                //console.log("Response RxService.svc - cease : " + JSON.stringify(responseData));
                            }
                            else {
                               // console.log("Errors RxService.svc - cease : " + JSON.stringify(responseData));
                            }
                        }).
                        error(function (responseData, status) {
                           // console.log("Status RxService.svc - cease : " + status);
                          //  console.log("Response RxService.svc - cease : " + JSON.stringify(responseData));
                        }).
                        then(function (responseData) {
                            //console.log(JSON.stringify(responseData));
                            return responseData.data;
                        });
                };

                // mode = suspend or reactivation 
                RxService.suspend = function (ids, reason, note, startTimestamp, stopTimestamp, mode, excludeMarkInError) {

                    var suspension =
                     {
                         rxIds: Array.isArray(ids) ? ids : ids.split(","),
                         suspensionDto:
                         {
                             "isMarSuspension": true,
                             "startTimestamp": startTimestamp,
                             "stopTimestamp": stopTimestamp
                         },
                         isExcludeMarkInError: excludeMarkInError
                     };
                    var subUrl = "rxs";

                    if (mode == "END_SUSPENSION") {
                        suspension.suspensionDto.endSuspensionReasonId = reason;
                        suspension.suspensionDto.endSuspensionNote = note;
                        subUrl += "/endsuspension";
                    }
                    else {
                        suspension.suspensionDto.suspensionReasonId = reason;
                        suspension.suspensionDto.suspensionNote = note;
                        subUrl += "/suspend";
                    }
                    
                    //console.log(JSON.stringify(item));
                    return $http.put(urlsvc + subUrl, JSON.stringify(suspension), { headers: { 'Content-Type': 'application/json' } }).
                        success(function (responseData, status) {
                            if (responseData.HasErrors == false) {
                                //console.log("Response RxService.svc - suspend : " + JSON.stringify(responseData));
                            }
                            else {
                               // console.log("Errors RxService.svc - suspend : " + JSON.stringify(responseData));
                            }
                        }).
                        error(function (responseData, status) {
                         //   console.log("Status RxService.svc - suspend : " + status);
                          //  console.log("Response RxService.svc - suspend : " + JSON.stringify(responseData));
                        }).
                        then(function (responseData) {
                            //console.log(JSON.stringify(responseData));
                            return responseData.data;
                        });
                };

                // DoubleCheck Rx (for adhoc only) : signature
                RxService.doubleCheck = function (item) {
                    return $http.put(urlsvc + "rx/sign", JSON.stringify(item), { headers: { 'Content-Type': 'application/json' } }).
                        success(function (responseData, status) {
                            if (responseData.HasErrors == false) {
                                //console.log("Response RxService.svc - save : " + JSON.stringify(responseData));
                            }
                            else {
                                console.log("Errors RxManagementService.svc - sign : " + JSON.stringify(responseData));
                            }
                        }).
                        error(function (responseData, status) {
                         //   console.log("Status RxManagementService.svc - sign : " + status);
                            // console.log("Response RxService.svc - save : " + JSON.stringify(responseData));
                        }).
                        then(function (responseData) {
                            // console.log(JSON.stringify(responseData.data));
                           // console.log('Time taken to sign RX id(s) ' + item.id + ': ' + (new Date().getTime() - start) + 'ms');
                            return responseData.data;
                        });
                };

                // Cancel double check (signature) Rx (for adhoc only)
                RxService.cancelSignature = function (item) {
                    var id = item.id;
                    var start = new Date().getTime();
                    return $http.put(urlsvc + "rx/" + id + "/cancelsignature", null, { headers: { 'Content-Type': 'application/json' } }).
                        success(function (responseData, status) {
                            if (responseData.HasErrors == false) {
                                //console.log("Response RxService.svc - save : " + JSON.stringify(responseData));
                            }
                            else {
                              //  console.log("Errors RxManagementService.svc - cancel signature : " + JSON.stringify(responseData));
                            }
                        }).
                        error(function (responseData, status) {
                           // console.log("Status RxManagementService.svc - cancel signature : " + status);
                            // console.log("Response RxService.svc - save : " + JSON.stringify(responseData));
                        }).
                        then(function (responseData) {
                            // console.log(JSON.stringify(responseData.data));
                          //  console.log('Time taken to cancel signature RX id(s) ' + item.id + ': ' + (new Date().getTime() - start) + 'ms');
                            return responseData.data;
                        });
                };

                RxService.startProcessing = function (items) {
                    return $http.put(urlsvc + "rxs/startprocessing", JSON.stringify(items), { headers: { 'Content-Type': 'application/json' } }).
                        success(function (responseData, status) {
                            if (responseData.HasErrors == false) {

                            }
                            else {

                            }
                        }).
                        error(function (responseData, status) {

                        }).
                        then(function (responseData) {
                            return responseData.data;
                        });
                };

                RxService.stopProcessing = function (items) {
                    return $http.put(urlsvc + "rxs/stopprocessing", JSON.stringify(items), { headers: { 'Content-Type': 'application/json' } }).
                       success(function (responseData, status) {
                           if (responseData.HasErrors == false) {
                           }
                           else {

                           }
                       }).
                       error(function (responseData, status) {

                       }).
                       then(function (responseData) {

                           return responseData.data;
                    });
                };

                RxService.doubleCheckDose = function(item) {
                    return $http.put(urlsvc + "rx/doubleverifydosage", JSON.stringify(item), { headers: { 'Content-Type': 'application/json' } }).
                        success(function (responseData, status) {
                            if (responseData.HasErrors == false) {
                            }
                            else {

                            }
                        }).
                        error(function (responseData, status) {

                        }).
                        then(function (responseData) {

                            return responseData.data;
                        });
                };

                RxService.cancelDoubleCheckDose = function (rxId) {
                    return $http.put(urlsvc + "rx/canceldoubledosage", rxId, { headers: { 'Content-Type': 'application/json' } }).
                        success(function (responseData, status) {
                            if (responseData.HasErrors == false) {
                            }
                            else {

                            }
                        }).
                        error(function (responseData, status) {

                        }).
                        then(function (responseData) {

                            return responseData.data;
                        });
                };
            }
        ]
    );