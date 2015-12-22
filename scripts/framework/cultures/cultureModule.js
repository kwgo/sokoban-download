'use strict';
angular
    .module('lgi.infra.web.cultures', ['pascalprecht.translate', 'tmh.dynamicLocale'])
    .config(
    [
        '$locationProvider', '$translateProvider', 'tmhDynamicLocaleProvider', 'locationServiceProvider', '$httpProvider', 
        function ($locationProvider, $translateProvider, tmhDynamicLocaleProvider, locationServiceProvider, $httpProvider) {
            $httpProvider.interceptors.push('cultureInterceptor');
            $translateProvider.useSanitizeValueStrategy(null);
            $translateProvider.usePostCompiling(true);
            $translateProvider.useLoader('$translatePartialLoader', {
                urlTemplate: '{part}-{lang}.json'
            });
       
            tmhDynamicLocaleProvider.localeLocationPattern('scripts/libs/angular/i18n/angular-locale_{{locale}}.js'); 

            /*
             Uncomment if we want to suppport fallback language
             Must consider that the fallback content will always be loaded 
             */
            // var cultures = Enumerable.From($cultures);
            // $translateProvider.fallbackLanguage(cultures.Where(function (c) { return c.Code.length == 2; }).Select(function (c) { return c.Code; }).ToArray());
        }
    ])
    .run(
    [
        '$rootScope', 'cultureManager', 'storageService',
        function ($rootScope, cultureManager, storageService) {
            $rootScope.cultureManager = cultureManager;
            $rootScope.cultureManager.resources.shared.load('default');
            if (storageService.session.get('forcedCulture') == null) {
                storageService.session.set('forcedCulture', false);
            }
        }
    ]);
$.addScript('scripts/framework/cultures/cultureManagerProvider.js');
$.addScript('scripts/framework/cultures/cultureInterceptor.js');
$.addScript('scripts/framework/cultures/cultureMenuControl.js');