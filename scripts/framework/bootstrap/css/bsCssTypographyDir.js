'use strict';

angular
    .module('lgi.infra.web.bootstrap.css')
    .directive('bsLead', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("lead");
    }])
    .directive('bsInitialism', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("initialism");
    }])
    // reverse
    .directive('bsBlockquote', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("blockquote", "bsBlockquote");
    }])
    // unstyled, inline
    .directive('bsList', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("list", "bsList");
    }])
    // horizontal
    .directive('bsDl', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("dl", "bsDl");
    }]);