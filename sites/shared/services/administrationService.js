'use strict';

angular
    .module('app')
    .service('administrationService',
        ['$http', '$q', 'locationService', 

            function ($http, $q, locationService) {
                var url = locationService.api + 'administrationservice.svc/json/';

                return {
                    prepare: function (ids) {
                        var urlprepare = url + 'rxs/markAsPrepared';
                        var deferred = $q.defer();
                        $http.post(urlprepare, JSON.stringify(ids), { headers: { 'Content-Type': 'application/json' } })
                            .success(function(responseData) {
                                deferred.resolve(responseData);
                            })
                            .error(function (responseData, status) {
                                return responseData;
                            });

                        return deferred.promise;
                    },

                    cancelPreparation: function (ids) {
                        //alert(JSON.stringify(ids));
                        var deferred = $q.defer();
                        $http.post(url + "cancelPreparation", JSON.stringify(ids), { headers: { 'Content-Type': 'application/json' } })
                            .success(function (responseData) {
                                deferred.resolve(responseData);
                            })
                            .error(function (responseData, status) {
                                return responseData;
                            });

                        return deferred.promise;
                    },

                    getById: function (id) {
                        var deferred = $q.defer();
                        $http.get(url + 'administration/' + id, { headers: { 'Content-Type': 'application/json' } })
                            .success(function (responseData) {
                                deferred.resolve(responseData);
                            })
                            .error(function (responseData) {
                                return responseData;
                            });

                        return deferred.promise;
                    },

                    prepareDoubleCheck: function (administrationInstanceDto) {
                        var deferred = $q.defer();
                        deferred.promise =
                            $http.post(url + 'prepareDoubleCheck', JSON.stringify(administrationInstanceDto), { headers: { 'Content-Type': 'application/json' } })
                                .success(function (responseData) {
                                    deferred.resolve(responseData);
                                })
                                .error(function (responseData) {
                                    console.log('Prepare for verify error reponse' + JSON.stringify(administrationInstanceDto));
                                    deferred.reject(responseData);
                                });

                        return deferred.promise;
                    },

                    realize: function (administrationInstanceDto) {
                        var deferred = $q.defer();
                        deferred.promise =
                            $http.post(url + 'realize', JSON.stringify(administrationInstanceDto), { headers: { 'Content-Type': 'application/json' } })
                                .success(function (responseData) {
                                    deferred.resolve(responseData);
                                })
                                .error(function (responseData) {
                                     console.log('Realize error reponse' +JSON.stringify(administrationInstanceDto));
                                    deferred.reject(responseData);
                                });

                        return deferred.promise;
                    },

                    getByRxIds: function (rxIds, extraDose) {
                        var deferred = $q.defer();
                        $http.post(url + 'rxs/nextAdministrations/' + extraDose, JSON.stringify(rxIds.join()), { headers: { 'Content-Type': 'application/json' } })
                            .success(function (responseData) {
                                deferred.resolve(responseData);
                            })
                            .error(function (responseData) {
                                return responseData;
                            });

                        return deferred.promise;
                    },

                    getByRxId: function (rxId, extraDose) {
                        var deferred = $q.defer();
                        $http.get(url + 'rx/' + rxId + '/nextAdministration/' + extraDose, { headers: { 'Content-Type': 'application/json' } })
                            .success(function (responseData) {
                                deferred.resolve(responseData);
                            })
                            .error(function (responseData) {
                                return responseData;
                            });

                        return deferred.promise;
                    },

                    // double checked (signature)
                    doubleCheck: function (administrationSignatureDto) {
                        var deferred = $q.defer();
                        deferred.promise =
                            $http.post(url + 'doublecheck', JSON.stringify(administrationSignatureDto), { headers: { 'Content-Type': 'application/json' } })
                                .success(function (responseData) {
                                    deferred.resolve(responseData);
                                })
                                .error(function (responseData) {
                                    //console.log('doublecheck error reponse' + JSON.stringify(administrationSignatureDto));
                                    deferred.reject(responseData);
                                });

                        return deferred.promise;
                    },

                    // Cancel double checked (signature)
                    cancelDoubleCheck: function (administration) {
                        var deferred = $q.defer();
                        deferred.promise =
                            $http.post(url + 'canceldoublecheck', JSON.stringify(administration), { headers: { 'Content-Type': 'application/json' } })
                                .success(function (responseData) {
                                    deferred.resolve(responseData);
                                })
                                .error(function (responseData) {
                                    //console.log('canceldoublecheck error reponse' + JSON.stringify(administration));
                                    deferred.reject(responseData);
                                });

                        return deferred.promise;
                    },

                    update: function (administrationInstanceDto) {
                        var deferred = $q.defer();
                        deferred.promise =
                            $http.put(url + 'update', JSON.stringify(administrationInstanceDto), { headers: { 'Content-Type': 'application/json' } })
                                .success(function (responseData) {
                                    deferred.resolve(responseData);
                                })
                                .error(function (responseData) {
                                    console.log('Update error reponse' + JSON.stringify(administrationInstanceDto));
                                    deferred.reject(responseData);
                                });

                        return deferred.promise;
                    },

                    addExtraDose: function (administration) {
                        var deferred = $q.defer();
                        deferred.promise =
                            $http.post(url + 'addextradose', JSON.stringify(administration), { headers: { 'Content-Type': 'application/json' } })
                                .success(function (responseData) {
                                    deferred.resolve(responseData);
                                })
                                .error(function (responseData) {
                                    console.log('Addextradose error reponse' + JSON.stringify(administration));
                                    deferred.reject(responseData);
                                });

                        return deferred.promise;
                    },

                    cancelAdministration: function (administration) {
                        var deferred = $q.defer();
                        deferred.promise =
                            $http.post(url + 'canceladministration', JSON.stringify(administration), { headers: { 'Content-Type': 'application/json' } })
                                .success(function (responseData) {
                                    deferred.resolve(responseData);
                                })
                                .error(function (responseData) {
                                    console.log('cancelAdministration error reponse' + JSON.stringify(administration));
                                    deferred.reject(responseData);
                                });

                        return deferred.promise;
                    },

                    cancelDoubleCheckPreparation: function (administration) {
                        var deferred = $q.defer();
                        deferred.promise =
                            $http.post(url + 'cancelDoubleCheckPreparation', JSON.stringify(administration), { headers: { 'Content-Type': 'application/json' } })
                                .success(function (responseData) {
                                    deferred.resolve(responseData);
                                })
                                .error(function (responseData) {
                                    console.log('cancelDoubleCheckPreparation error reponse' + JSON.stringify(administration));
                                    deferred.reject(responseData);
                                });

                        return deferred.promise;
                    }
                };
            }
]);


