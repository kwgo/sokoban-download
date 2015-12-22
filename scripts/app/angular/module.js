'use strict';
angular.module('lgi.emr.mar.web', [
    'lgi.emr.mar.web.bootstrap',
    'lgi.emr.mar.web.collection',
    'lgi.emr.mar.web.controls',
    'lgi.emr.mar.web.decimalformat',
    'lgi.emr.mar.web.dirtyCheck',
    'lgi.emr.mar.web.httpheader',
    'modelOptions'
]).config(function ($routeProvider, $provide) {
    /**
    * overwrite angular's directive ngSwitchWhen
    * can handle ng-switch-when="value1 || value2 || value3"
    */
    $provide.decorator('ngSwitchWhenDirective', function ($delegate) {
        $delegate[0].compile = function (element, attrs, transclude) {
            return function (scope, element, attr, ctrl) {
                var subCases = [attrs.ngSwitchWhen];
                if (attrs.ngSwitchWhen && attrs.ngSwitchWhen.length > 0 && attrs.ngSwitchWhen.indexOf('||') != -1) {
                    subCases = attrs.ngSwitchWhen.split('||');
                }
                var i = 0;
                var casee;
                var len = subCases.length;
                while (i < len) {
                    casee = $.trim(subCases[i++]);
                    ctrl.cases['!' + casee] = (ctrl.cases['!' + casee] || []);
                    ctrl.cases['!' + casee].push({ transclude: transclude, element: element });
                }
            }
        }
        return $delegate;
    });
});
$.addScript('scripts/app/angular/bootstrap/module.js');
$.addScript('scripts/app/angular/collection/module.js');
$.addScript('scripts/app/angular/controls/module.js');
$.addScript('scripts/app/angular/decimalFormat/module.js');
$.addScript('scripts/app/angular/dirtyCheck/module.js');
$.addScript('scripts/app/angular/httpHeader/module.js');