'use strict';

angular
    .module('lgi.infra.web.auth')
    .directive('authorization',
    [
        'authService',
        function(authService) {
            function link(scope, element, attrs) {
                var authorizationInit = false;
                var securityContextInit = false;
                var permissionsInit = false;
                var requireAllInit = false;
                var authenticatedInit = false;
                var displayModeInit = false;

                scope.model = authService.model;
                //element.hide();
                var applyDisplay = function(displayMode, state) {
                    if (displayMode == 'visibility') {
                        if (state) {
                            element.show();
                        } else {
                            element.hide();
                        }
                    } else if (displayMode == 'disable') {
                        if (state) {
                            element.removeAttr('disabled');
                            element.find('*').removeAttr('disabled');
                            element.removeClass('disabled');
                        } else {
                            element.attr('disabled', 'disabled');
                            element.find('*').attr('disabled', 'disabled');
                            element.addClass('disabled');
                        }
                    }
                };

                var displayElement = function() {
                    if (!authorizationInit || !securityContextInit || !permissionsInit || !requireAllInit || !authenticatedInit || !displayModeInit) {
                        return;
                    }

                    var authorization = scope.authorization();
                    var securityContext = scope.securityContext();
                    var permissions = scope.permissions();
                    var requireAll = scope.requireAll();
                    var authenticated = scope.authenticated();
                    var displayMode = scope.displayMode();

                    if (!authorization) {
                        authorization = 'allow';
                    }
                    authorization = authorization.toLowerCase();

                    if (!requireAll) {
                        requireAll = false;
                    }
                    if (!authenticated) {
                        authenticated = false;
                    }
                    if (!displayMode) {
                        displayMode = 'visibility';
                    }

                    // only check if user is authenticated
                    if (authenticated && authorization == "allow") {
                        if (scope.model.authenticated) {
                            applyDisplay(displayMode, true);
                        } else {
                            applyDisplay(displayMode, false);
                        }
                        return;
                    }

                    // validate permissions
                    if (!securityContext || !permissions) {
                        return;
                    }

                    securityContext = securityContext.toLowerCase();
                    permissions = Enumerable.From(permissions).Select(function(p) { return p.toLowerCase(); })
                    if (!scope.model.authenticated) {
                        applyDisplay(displayMode, false);
                    } else {
                        var accessRoles = Enumerable.From(scope.model.identity.accessRoles);
                        var accessRole = accessRoles.Where(function(ar) { return ar.securityContext.toLowerCase() == securityContext; }).FirstOrDefault();
                        if (accessRole != null) {
                            var accessRolePermissions = Enumerable.From(accessRole.permissions).Select(function(p) { return p.toLowerCase(); });

                            var state = false;
                            if (requireAll) {
                                state = permissions.All(function(p) { return accessRolePermissions.Contains(p); });
                            } else {
                                state = permissions.Any(function(p) { return accessRolePermissions.Contains(p); });
                            }

                            if (state) {
                                if (authorization == "allow") {
                                    applyDisplay(displayMode, true);
                                } else {
                                    applyDisplay(displayMode, false);
                                }
                            } else {
                                if (authorization == "allow") {
                                    applyDisplay(displayMode, false);
                                } else {
                                    applyDisplay(displayMode, true);
                                }
                            }
                        } else {
                            if (authorization == "allow") {
                                applyDisplay(displayMode, false);
                            } else {
                                applyDisplay(displayMode, true);
                            }
                        }
                    }
                };
                scope.$watch('authorization()', function(newValue, oldValue) {
                    authorizationInit = true;
                    displayElement();
                });
                scope.$watch('securityContext()', function(newValue, oldValue) {
                    securityContextInit = true;
                    displayElement();
                });
                scope.$watch('requiredAll()', function(newValue, oldValue) {
                    requireAllInit = true;
                    displayElement();
                });
                scope.$watch('authenticated()', function(newValue, oldValue) {
                    authenticatedInit = true;
                    displayElement();
                });
                scope.$watch('displayMode()', function (newValue, oldValue) {
                    displayModeInit = true;
                    displayElement();
                });
                scope.$watchCollection("permissions()", function(newValue, oldValue) {
                    permissionsInit = true;
                    displayElement();
                });
                scope.$watch('model.authenticated', function(newValue, oldValue) {
                    displayElement();
                });
            }

            return {
                restrict: 'A',
                scope: {
                    authorization: "&",
                    securityContext: "&securitycontext",
                    permissions: "&",
                    requireAll: "&permissionsAll",
                    authenticated: "&",
                    displayMode: "&"
                },
                link: link
            }
        }
    ]);