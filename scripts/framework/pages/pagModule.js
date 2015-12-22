'use strict';
angular
    .module('lgi.infra.web.pages', ['ngRoute'])
    .config(
    [
        '$locationProvider', '$routeProvider', 'locationServiceProvider', '$translateProvider',
        function ($locationProvider, $routeProvider, locationService, $translateProvider) {
            $locationProvider.html5Mode(true);
            $routeProvider.when(locationService.current.path + ":culture/:page*", { reloadOnSearch: true, caseInsensitiveMatch: true});
            $routeProvider.when(locationService.current.path + ":culture", { reloadOnSearch: false, caseInsensitiveMatch: true});
            $routeProvider.when(locationService.current.path, { reloadOnSearch: false, caseInsensitiveMatch: true });
            if (locationService.root != "") {
                $routeProvider.otherwise(locationService.current.path, { reloadOnSearch: false, caseInsensitiveMatch: true });
            }
        }
    ])
    .run(
    [
        '$rootScope', 'pagManager', '$modalStack',
        function ($rootScope, pagManager, $modalStack) {
            $rootScope.pageManager = pagManager;
            $rootScope.$on("$routeChangeStart", function (event, next, current) {
                $modalStack.dismissAll();
            });
        }
    ]);
$.addScript('scripts/framework/pages/pagManagerSvc.js');