'use strict';
angular
    .module('lgi.infra.web.entrepriseServices.administration.ldap')
    .provider('ldapService',
    [
        function () {

            this.$get = [
                '$http', '$q',
                function ($http, $q) {
                    var service = {
                        model: {
                            servers: [],
                            selectedServer: {},
                            selectedServerInfo: {},
                            isServerSelected: false
                        }
                    };
                    var originalModel = angular.copy(service.model);

                    var selectedDeferred = $q.defer();

                    //#region REST API
                    service.servers = function () {
                        var deferred = $q.defer();
                        $http
                            .get('api/ldapserverservice.svc/json/ldapserversummaries')
                            .success(function (data) {
                                if (!data.HasErrors) {
                                    service.model.servers = data.Result;
                                    deferred.resolve(service.servers);
                                } else {
                                    deferred.reject(data.Errors);
                                }
                            })
                            .error(function () {
                                deferred.reject([]);
                            });
                        return deferred.promise;
                    };
                    service.server = function(serverId) {
                        var deferred = $q.defer();
                        $http
                            .get('api/ldapserverservice.svc/json/ldapserver/' + serverId)
                            .success(function(data) {
                                if (!data.HasErrors) {
                                    service.model.selectedServerInfo = data.Result;
                                    deferred.resolve(service.model.selectedServerInfo);
                                } else {
                                    deferred.reject(data.Errors);
                                }
                            })
                            .error(function() {
                                deferred.reject([]);
                            });
                        return deferred.promise;
                    };
                    service.branches = function (serverId, credential) {
                        var deferred = $q.defer();
                        $http
                            .post('api/ldapserverservice.svc/json/loadldapserverbranches/' + serverId, JSON.stringify(credential))
                            .success(function(data) {
                                if (!data.HasErrors) {
                                    deferred.resolve(data.Result);
                                } else {
                                    deferred.reject(data.Errors);
                                }
                            })
                            .error(function() {
                                deferred.reject([]);
                            });
                        return deferred.promise;
                    };
                    service.branchObjects = function (serverId, path, credential) {
                        var deferred = $q.defer();
                        $http
                            .post('api/ldapserverservice.svc/json/loadldapserverobjects/' + serverId + "/" + path, JSON.stringify(credential))
                            .success(function (data) {
                                if (!data.HasErrors) {
                                    deferred.resolve(data.Result);
                                } else {
                                    deferred.reject(data.Errors);
                                }
                            })
                            .error(function () {
                                deferred.reject([]);
                            });
                        return deferred.promise;
                    };
                    //#endregion
                    
                    service.selectServer = function(server) {
                        service.model.selectedServer = server;
                        service.model.isServerSelected = true;
                        selectedDeferred.notify(server);
                    };
                    service.serverSelected = function(callback) {
                        selectedDeferred.promise.then(null, null, callback);
                    }

                    return service;
                }
            ];
        }
    ]);