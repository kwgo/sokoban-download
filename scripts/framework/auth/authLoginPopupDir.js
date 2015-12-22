'use strict';

angular
    .module('lgi.infra.web.auth')
    .directive('authLoginPopup',
    [
        'authService', '$sce', 'popupService', 'cultureManager', 'pagManager', 'locationService', '$route', '$rootScope',
        function (authService, $sce, popupService, cultureManager, pageManager, locationService, $route, $rootScope) {
            var local = {
                scope: {},
                element: {},
                attrs: {}
            };
                      
            function link(scope, element, attrs) {
                local.scope = scope;
                local.element = element;
                local.attrs = attrs;

                var children = Enumerable.From(element.children()).ToArray().reverse();
                $.each(children, function (i) {
                    $(children[i]).insertAfter(element);
                });
                element.remove();
                
                // set scope model to the service model because the is ready might happend before the observer is registered.
                scope.model = authService.model;
                
                scope.logout = function() {
                    $rootScope.$broadcast('logoutEvent');
                }
                scope.login = function() {
                    pageManager.requestLogin();
                };

                var redirectToDefault = function () {
                    pageManager.redirectToDefault(cultureManager.currentCulture.Culture.Code);
                }
            }

            return {
                replace: true,
                restrict: 'A',
                scope: {},
                templateUrl: function(element, attrs) {
                    if (angular.isDefined(attrs.authLoginTemplateUrl)) {
                        return attrs.authLoginTemplateUrl;
                    }
                    return locationService.framework.root + "auth/views/login-popup.html";
                },
                link: link
            }
        }
    ]);