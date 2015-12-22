'use strict';

angular
    .module('lgi.infra.web.entrepriseServices')
    .provider('entrepriseServices',
    [
        'locationServiceProvider',
        function entrepriseServicesProvider(locationServiceProvider) {
            var provider = {
                authentication: {
                    loginUrl: "",
                    logoutUrl: "",
                    keepAliveUrl: "",
                    domainsUrl: ""
                },
                lookup: {
                    getManyUrl: ""
                }
            };

            this.setAuthentication = function (options) {
                angular.extend(provider.authentication, options);
            };
            this.setLookup = function (options) {
                angular.extend(provider.lookup, options);
            };

            // Set default values
            var authenticationUrl = locationServiceProvider.api + "authenticationservice.svc/json/";
            this.setAuthentication({
                loginUrl: authenticationUrl + "login",
                logoutUrl: authenticationUrl + "logout",
                domainsUrl: authenticationUrl + "domains",
                keepAliveUrl: authenticationUrl + "keepAlive"
            });

            var lookupUrl = locationServiceProvider.api + 'lookupdataservice.svc/json/';
            this.setLookup({
                // getmany url
                getManyUrl: lookupUrl + "getmany"
            });

            this.$get = [
                'utlLogger', '$http', '$q', 'storageService', 'cultureManager',
                function (utlLogger, $http, $q, storageService, cultureManager) {
                    var service = {
                        authentication: {},
                        authorization: {},
                        lookup: {}
                    };

                    //#region Authentication
                    service.authentication.login = function (authenticateDto) {
                        var deferred = $q.defer();
                        $http({
                            method: 'POST',
                            url: provider.authentication.loginUrl,
                            data: authenticateDto
                        })
                        .success(function (serviceResponse) {
                            if (!serviceResponse.HasErrors) {
                                utlLogger.log(serviceResponse);
                                deferred.resolve(angular.copy(serviceResponse.Result));
                            } else {
                                utlLogger.error(serviceResponse);
                                deferred.reject(angular.copy(serviceResponse.Errors));
                            }
                        })
                        .error(function (err, status) {
                            utlLogger.error(err);
                            deferred.reject(angular.copy(err));
                        });

                        return deferred.promise;
                    };
                    service.authentication.logout = function () {
                        var deferred = $q.defer();
                        $http({
                            method: 'GET',
                            url: provider.authentication.logoutUrl
                        })
                        .success(function (serviceResponse) {
                            if (!serviceResponse.HasErrors) {
                                utlLogger.log(serviceResponse);
                                deferred.resolve(angular.copy(serviceResponse.Result));
                            } else {
                                utlLogger.error(serviceResponse);
                                deferred.reject(angular.copy(serviceResponse.Errors));
                            }
                        })
                        .error(function (err, status) {
                            var errors = [];
                            var error = {
                                errorCode: status,
                                errorMessage: err,
                            }
                            errors.push(error);
                            utlLogger.error(errors);
                            deferred.reject(angular.copy(errors));
                        });
                        return deferred.promise;
                    };
                    service.authentication.keepAlive = function () {
                        var deferred = $q.defer();
                        $http({
                            method: 'GET',
                            url: provider.authentication.keepAliveUrl
                        })
                        .success(function (serviceResponse) {
                            if (!serviceResponse.HasErrors) {
                                utlLogger.log(serviceResponse);
                                deferred.resolve(angular.copy(serviceResponse.Result));
                            } else {
                                utlLogger.error(serviceResponse);
                                deferred.reject(angular.copy(serviceResponse.Errors));
                            }
                        })
                        .error(function (err, status) {
                            var errors = [];
                            var error = {
                                errorCode: status,
                                errorMessage: err,
                            }
                            errors.push(error);
                            utlLogger.error(errors);
                            deferred.reject(angular.copy(errors));
                        });
                        return deferred.promise;
                    };
                    service.authentication.domains = function () {
                        var deferred = $q.defer();
                        $http({
                            method: 'GET',
                            url: provider.authentication.domainsUrl,
                            data: ''
                        })
                        .success(function (serviceResponse) {
                            if (!serviceResponse.HasErrors) {
                                utlLogger.log(serviceResponse);
                                deferred.resolve(angular.copy(serviceResponse.Result));
                            } else {
                                utlLogger.error(serviceResponse);
                                deferred.reject(angular.copy(serviceResponse.Errors));
                            }
                        })
                        .error(function (err, status) {
                            var errors = [];
                            var error = {
                                errorCode: status,
                                errorMessage: err,
                            }
                            errors.push(error);
                            utlLogger.error(errors);
                            deferred.reject(angular.copy(errors));
                        });
                        return deferred.promise;
                    };
                    //#endregion

                    //#region Lookup
                    if (storageService.session.get('lookups') == null) {
                       var cultures = {};
                        cultureManager.supportedCultures.ForEach(function (culture) {
                            cultures[culture.Culture.Code] = [];
                        });
                        storageService.session.set('lookups', cultures);
                    }
                    var getLookups = function (lookupCodes) {
                        var queryLookupCodes = Enumerable.From(lookupCodes);
                        var queryLookups = Enumerable.From(storageService.session.get('lookups')[cultureManager.currentCulture.Culture.Code]);
                        return queryLookups.Where(function (l) { return queryLookupCodes.Contains(l.code); }).ToArray();
                    };
                    service.lookup.getMany = function (lookupCodes) {
                        var queryLookups = Enumerable.From(storageService.session.get('lookups')[cultureManager.currentCulture.Culture.Code]);
                        var queryLookupCodes = Enumerable.From(lookupCodes);
                        var notCachedLookupCodes = queryLookupCodes.Where(function (lc) {
                            return queryLookups.All(function (l) {
                                return l.code != lc;
                            });
                        }).ToArray();

                        var deferred = $q.defer();

                        if (notCachedLookupCodes.length > 0) {
                            var param = Enumerable.From(notCachedLookupCodes).Select(function (lookupCode) { return { code: lookupCode }; }).ToArray();
                            $http
                                .post(provider.lookup.getManyUrl, param)
                                .success(function (data) {
                                    var result = data.Result;
                                    var sessionLookups = storageService.session.get('lookups');
                                    Enumerable.From(result).ForEach(function (lookup) {
                                        sessionLookups[cultureManager.currentCulture.Culture.Code].push(lookup);
                                    });
                                    storageService.session.set('lookups', sessionLookups);
                                    deferred.resolve(getLookups(lookupCodes));
                                })
                                .error(function () {
                                    deferred.reject([]);
                                });
                        } else {
                            deferred.resolve(getLookups(lookupCodes));
                        }

                        return deferred.promise;
                    };
                    service.lookup.get = function (lookupCode, fromSession) {
                        if (!fromSession) {
                            var deferred = $q.defer();
                            service
                                .lookup
                                .getMany([lookupCode])
                                .then(function(data) {
                                    if (data.length > 0) {
                                        deferred.resolve(data[0].content);
                                    } else {
                                        deferred.reject();
                                    }
                                }, function(data) {
                                    deferred.reject();
                                });
                            return deferred.promise;
                        } else {
                            return getLookups([lookupCode])[0].content;
                        }

                    };
                    service.lookup.setMany = function (lookups, scope) {
                        var queryLookups = Enumerable.From(lookups);
                        var deferred = $q.defer();
                        service
                            .lookup
                            .getMany(queryLookups.Select(function (l) { return l[0]; }).ToArray())
                            .then(function (data) {
                                var result = [];
                                var queryData = Enumerable.From(data);
                                queryData.ForEach(function (d) {
                                    var lookup = queryLookups.Where(function (l) {
                                        return l[0] == d.code;
                                    }).First();
                                    scope[lookup[1]] = d.content;
                                    result.push({
                                        lookupCode: lookup[0],
                                        property: lookup[1],
                                        scope: scope,
                                        value: scope[lookup[1]]
                                    });
                                });
                                deferred.resolve(result);
                            }, function (err) {
                                deferred.reject();
                            });
                        return deferred.promise;
                    };
                    service.lookup.set = function (lookupCode, property, scope) {
                        var deferred = $q.defer();
                        service
                                .lookup
                                .getMany([lookupCode])
                                .then(function (data) {
                                    if (data.length > 0) {
                                        scope[property] = data[0].content;
                                        deferred.resolve({
                                            lookupCode: lookupCode,
                                            property: property,
                                            scope: scope,
                                            value: scope[property]
                                        });
                                    } else {
                                        deferred.reject();
                                    }
                                }, function (data) {
                                    deferred.reject();
                                });
                        return deferred.promise;
                    };
                    //#endregion

                    return service;
                }
            ];
        }
    ])