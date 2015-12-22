'use strict';
angular
    .module('lgi.infra.web.auditing', [])
    .run(
    [
        '$rootScope', 'historyService',
        function ($rootScope, historyService) {
            $rootScope.historyService = historyService;
        }
    ]);
$.addScript('scripts/framework/auditing/historyProvider.js');
$.addScript('scripts/framework/auditing/controllers/historyController.js');