'use strict';

angular
    .module('lgi.infra.web.bootstrap.css')
    .directive('bsRow', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("row");
    }])
    .directive('bsCol', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("col", "bsCol");
    }])
    // 1 to 12
    .directive('bsColXs', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("col-xs", "bsColXs");
    }])
    .directive('bsColXsOs', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("col-xs-offset", "bsColXsOs");
    }])
    .directive('bsColXsPush', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("col-xs-push", "bsColXsPush");
    }])
    .directive('bsColXsPull', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("col-xs-pull", "bsColXsPull");
    }])
    .directive('bsColSm', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("col-sm", "bsColSm");
    }])
    .directive('bsColSmOs', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("col-sm-offset", "bsColSmOs");
    }])
    .directive('bsColSmPush', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("col-sm-push", "bsColSmPush");
    }])
    .directive('bsColSmPull', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("col-sm-pull", "bsColSmPull");
    }])
    .directive('bsColMd', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("col-md", "bsColMd");
    }])
    .directive('bsColMdOs', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("col-md-offset", "bsColMdOs");
    }])
    .directive('bsColMdPush', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("col-md-push", "bsColMdPush");
    }])
    .directive('bsColMdPull', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("col-md-pull", "bsColMdPull");
    }])
    .directive('bsColLg', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("col-lg", "bsColLg");
    }])
    .directive('bsColLgOs', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("col-lg-offset", "bsColLgOs");
    }])
    .directive('bsColLgPush', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("col-lg-push", "bsColLgPush");
    }])
    .directive('bsColLgPull', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("col-lg-pull", "bsColLgPull");
    }]);