'use strict';

angular
    .module('lgi.infra.web.bootstrap.css')
    // default, primary, success, info, warning, danger, confirmation
    .directive('bsBtn', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("btn btn", "bsBtn");
    }])
    // lg, sm, xs
    .directive('bsBtnSize', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("btn", "bsBtnSize");
    }])
    // lg, sm, xs
    .directive('bsBtnGroup', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective('btn-group');
    }])
    .directive('bsBtnBlock', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("btn-block");
    }]);