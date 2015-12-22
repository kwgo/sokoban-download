'use strict';
angular
    .module('lgi.infra.web.locations', [])
    .run(
    [
        '$rootScope', 'locationService',
        function ($rootScope, locationService) {
            $rootScope.locationService = locationService;
        }
    ]);
$.addScript('scripts/framework/locations/locSvc.js');