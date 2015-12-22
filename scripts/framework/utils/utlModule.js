'use strict';
angular
    .module('lgi.infra.web.utils', [])
    .run(
    [
        '$templateCache',
        function ($templateCache) {
           // $templateCache.removeAll();
        }
    ]);
$.addScript('scripts/framework/utils/utlHttpSvc.js');
$.addScript('scripts/framework/utils/utlLoggerSvc.js');
$.addScript('scripts/framework/utils/utlStringSvc.js');
$.addScript('scripts/framework/utils/utlObjectSvc.js');