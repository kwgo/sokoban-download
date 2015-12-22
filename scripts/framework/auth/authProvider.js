'use strict';
angular
    .module('lgi.infra.web.auth')
    .provider('authService',
    [
        'locationServiceProvider',
        function authServiceProvider() {
            var provider = {
                authentication: {
                    // url for the login page view page
                    template: "",
                    // controller for the login page
                    controller: "",
                    // resource file for the logging page
                    i18n: "",
                    // show or hide remember checkbox
                    remember: true,
                    // default domain
                    defaultDomain: "SYSTEM"
                },
                keepAlive: {
                    // enable or not keepAlive
                    enabled: false,
                    // keepAlive interval
                    interval: 10000,
                },
                autoLogout: {
                    // enable or not the auto logout
                    enabled: false,
                    // inactive time required to show the auto log out
                    interval: 5000,
                    // countdown before the auto logout log out the user.
                    countdown: 30,
                    // template for the auto logout pop-up
                    templateUrl: 'sites/shared/views/autologout.html'
                }
            };

            this.setAuthentication = function(options) {
                angular.extend(provider.authentication, options);
            };
            this.setKeepAlive = function (options) {
                angular.extend(provider.keepAlive, options);
            };
            this.setAutoLogout = function (options) {
                angular.extend(provider.autoLogout, options);
            };

            // Set default values
            this.setAuthentication({
                controller: "loginController",
                template: "scripts/framework/auth/views/login-page.html",
                i18n: "scripts/framework/auth/i18n/login"
            });
            
            this.$get = [
                'utlLogger', '$window', '$http', '$q', '$route', '$timeout', 'popupService', '$rootScope', 'entrepriseServices', 'storageService',
                function (utlLogger, $window, $http, $q, $route, $timeout, popupService, $rootScope, entrepriseServices, storageService) {
                    var storageKey = 'infra-identity';
                   
                    $.idleTimer({ timeout: provider.autoLogout.interval });
                    if (provider.autoLogout.enabled) {
                        $.idleTimer('pause');
                    }

                    var service = {
                        model: {
                            // current user, authenticatedDto
                            identity: {
                                access_token: null,
                                user: null, // UserBaseDto + specific authentication provider Dto
                                remember: false,
                                accessRoles: [] // AccessRoleDto
                            },
                            // indicate if the user is authenticated
                            authenticated: false,
                            redirectToCulture: false
                        },
                        // expose if the login page should persist or not the user.
                        remember: provider.authentication.remember,
                        // expose the provider authentication
                        authentication: provider.authentication,
                        // get the last user activity
                        getLastActivity: function () {
                            return $.idleTimer('getLastActiveTime');
                        },
                        // broadcast event to the root scope.
                        events: {
                            loginSuccess: "AUTH_PROVIDER_LOGIN_SUCCESS",
                            loginFailed: "AUTH_PROVIDER_LOGIN_FAILED",
                            logoutSuccess: "AUTH_PROVIDER_LOGOUT_SUCCESS",
                            logoutFailed: "AUTH_PROVIDER_LOGOUT_FAILED",
                            keepAliveSuccess: "AUTH_PROVIDER_KEEPALIVE_SUCCESS",
                            keepAliveFailed: "AUTH_PROVIDER_KEEPALIVE_FAILED",
                            unauthorized: "AUTH_PROVIDER_UNAUTHORIZED"
                        }
                    };
                    var local = {
                        keepAliveTimeout: null,
                        originalModel: angular.copy(service.model)
                    };
                    var resetModel = function() {
                        var model = angular.copy(local.originalModel);
                        service.model.identity = model.identity;
                        service.model.authenticated = false;
                    };

                    local.broadcast = function(eventName) {
                        $rootScope.$broadcast(eventName);
                    };

                    //#region Services
                    service.login = function (authenticateDto) {
                        var deferred = $q.defer();
                       
                        local.removeStorage();
                        local.stopKeepAlive();
                        local.stopIdleTimer();
                        
                        entrepriseServices
                            .authentication
                            .login(authenticateDto)
                            .then(function (authenticatedDto) {
                                service.model.identity = authenticatedDto;
                                service.model.authenticated = true;
                                local.setStorage();
                                local.startKeepAlive();
                                local.startIdleTimer();
                                local.broadcast(service.events.loginSuccess);
                                deferred.resolve(service.model);
                            }, function (errors) {
                                resetModel();
                                local.broadcast(service.events.loginFailed);
                                deferred.reject(errors);
                            });

                        return deferred.promise;
                    };
                    service.logout = function () {
                        var deferred = $q.defer();

                        local.removeStorage();
                        local.stopKeepAlive();
                        local.stopIdleTimer();

                        if (service.model.authenticated) {
                            entrepriseServices
                                .authentication
                                .logout()
                                .then(function (loggedOut) {
                                    resetModel();
                                    local.broadcast(service.events.logoutSuccess);
                                    deferred.resolve(loggedOut);
                                }, function (errors) {
                                    resetModel();
                                    local.broadcast(service.events.logoutFailed);
                                    deferred.reject(errors);
                                });
                        } else {
                            resetModel();
                            deferred.resolve(true);
                        }
                        return deferred.promise;
                    };
                    service.keepAlive = function () {
                        var deferred = $q.defer();
                        if (service.model.authenticated) {
                            local.stopKeepAlive();
                            entrepriseServices
                                .authentication
                                .keepAlive()
                                .then(function (access_token) {
                                    service.model.identity.access_token = access_token;
                                    local.setStorage();
                                    local.startKeepAlive();
                                    local.broadcast(service.events.keepAliveSuccess);
                                    deferred.resolve();
                                }, function () {
                                    resetModel();
                                    local.removeStorage();
                                    local.broadcast(service.events.keepAliveFailed);
                                    deferred.reject();
                                });
                        }
                        return deferred.promise;
                    };
                    service.getDomains = function() {
                        var deferred = $q.defer();
                        entrepriseServices
                            .authentication
                            .domains()
                            .then(function (data) {
                                deferred.resolve(data);
                            },
                            function (err, status) {
                                deferred.reject();
                            });
                        return deferred.promise;
                    };
                    //#endregion

                    //#region Storage
                    local.setStorage = function () {
                        if (service.model.authenticated) {
                            if (service.model.identity.remember) {
                                storageService.local.set(storageKey, service.model.identity);
                            } else {
                                storageService.session.set(storageKey, service.model.identity);
                            }
                        }
                    }
                    local.removeStorage = function () {
                        storageService.local.remove(storageKey);
                        storageService.session.remove(storageKey);
                    }
                    //#endregion

                    //#region KeepAlive
                    local.stopKeepAlive = function () {
                        if (local.keepAliveTimeout != null) {
                            utlLogger.log('stopKeepAlive');
                            $timeout.cancel(local.keepAliveTimeout);
                            local.keepAliveTimeout = null;
                        }
                    }
                    local.startKeepAlive = function () {
                        if (provider.keepAlive.enabled) {
                            local.stopKeepAlive();
                            if (service.model.authenticated) {
                                utlLogger.log('startKeepAlive');
                                local.keepAliveTimeout = $timeout(local.keepAlive, provider.keepAlive.interval);
                            }
                        }
                    };
                    local.keepAlive = function() {
                        utlLogger.log('KeepAlive');
                        service
                            .keepAlive()
                            .then(function () {
                            
                            }, function() {
                                $timeout(function() {
                                $rootScope.pageManager.redirectToDefault($rootScope.cultureManager.currentCulture.Culture.Code);
                                }, 500);   
                            });
                    };
                    //#endregion
                    
                    $(window).on('beforeunload', function () {
                        if (service.model.authenticated) {
                            if (!service.model.identity.remember) {
                                //service.logout();
                            }
                        }
                    });

                    service.setModel = function (options) {
                        angular.extend(service.model, options);

                    };

                    //#region IdleTimer
                    local.stopIdleTimer = function () {
                        if (provider.autoLogout.enabled) {
                            utlLogger.log('stopIdleTimer');
                            $.idleTimer("pause");
                        }
                    };
                    local.startIdleTimer = function () {
                        if (provider.autoLogout.enabled) {
                            if (service.model.authenticated && !service.model.identity.remember) {
                                utlLogger.log('startIdleTimer');
                                $.idleTimer("reset");
                            }
                        }
                    };

                    $(document).on("idle.idleTimer", function (event, elem, obj) {
                        if (provider.autoLogout.enabled) {
                            local.stopKeepAlive();
                            local.stopIdleTimer();
                            
                            popupService.popup({ size: 'sm', modal: true, title: 'Auto log out', yesBtnText: 'Yes', closeBtnText: 'No' }, {
                                templateUrl: provider.autoLogout.templateUrl,
                                controller: function ($scope, $modalInstance, opts, $interval) {
                                    $scope.opts = opts;
                                    $scope.onClose = function () {
                                        stopTimer();
                                        service.logout().then(redirectToDefault, redirectToDefault);
                                        $modalInstance.dismiss('close');
                                    }
                                    $scope.onYes = function () {
                                        stopTimer();
                                        service.keepAlive();
                                        $modalInstance.dismiss('close');
                                    }
                                    $scope.remainingTime = provider.autoLogout.countdown;
                                    var timer = $interval(function () {
                                        $scope.remainingTime--;
                                        if ($scope.remainingTime == 0) {
                                            stopTimer();
                                            service.logout().then(redirectToDefault, redirectToDefault);
                                            $modalInstance.dismiss('close');
                                        }
                                    }, 1000);
                                    function stopTimer() {
                                        if (timer != null) {
                                            $interval.cancel(timer);
                                            timer = null;
                                        }
                                    }
                                }
                            });
                        }
                    });


                    var redirectToDefault = function () {
                        $rootScope.pageManager.redirectToDefault($rootScope.cultureManager.currentCulture.Culture.Code);
                    }
                    //#endregion

                    local.authenticate = function () {
                        var identity = storageService.local.get(storageKey);
                        if (identity == null) {
                            identity = storageService.session.get(storageKey);
                        }
                        if (identity != null) {
                            service.model.identity = identity;
                            service.model.authenticated = true;
                            service.model.redirectToCulture = true;
                            local.startKeepAlive();
                            local.startIdleTimer();
                        }
                    };
                    local.authenticate();

                    return service;
                }
            ];
        }
    ])