'use strict';
angular
    .module('lgi.infra.web.auth')
    .factory('authInterceptor',
    [
        '$q', '$injector',
        function ($q, $injector) {

            var redirectToDefault = function() {
                var pageManager = $injector.get("pagManager");
                var cultureManager = $injector.get("cultureManager");
                pageManager.redirectToDefault(cultureManager.currentCulture.Culture.Code);
            };

            var request = function (config) {
                var authService = $injector.get("authService");
                config.headers = config.headers || {};

                // angular js remove content-type if no data.
                if (angular.isUndefined(config.data)) {
                    config.data = "";
                }

                config.headers["Content-Type"] = 'application/json';

                if (authService.model.authenticated) {
                    config.headers.Authorization = 'Bearer ' + authService.model.identity.access_token;
                }
                return config || $q.when(config);
            };

            var responseError = function (response) {
                if (response.status === 401) {
                    var authService = $injector.get('authService');
                    var $rootScope = $injector.get("$rootScope");
                    var $http = $injector.get("$http");
                    
                    var statusText = response.statusText.toLowerCase();
                    if (statusText === "auth_session_expired") {
                        if (authService.model.authenticated) {
                            var deferred = $q.defer();

                            // Check if we can refresh the session
                            authService.keepAlive().then(deferred.resolve, deferred.reject);
                            
                            return deferred.promise.then(function () {
                                return $http(response.config);
                            }, function() {
                                redirectToDefault();
                            });
                        } else {
                            redirectToDefault();
                        }
                    } else if (statusText == "auth_unauthorized" || statusText == "unauthorized") {
                        var deferred = $q.defer();
                        if (authService.model.authenticated) {
                            authService
                                .logout()
                                .then(function () {
                                    deferred.resolve(response);
                                    $rootScope.$broadcast(authService.events.unauthorized);
                                    redirectToDefault();
                                }, function () {
                                    deferred.reject(response);
                                    $rootScope.$broadcast(authService.events.unauthorized);
                                });

                        } else {
                            deferred.reject(response);
                            $rootScope.$broadcast(authService.events.unauthorized);
                            redirectToDefault();
                        }
                    }
                }
                return $q.reject(response);
            }

            return {
                request: request,
                responseError: responseError
            };
        }
    ]);