'use strict';

angular
    .module('lgi.infra.web.bootstrap.css')
    .directive('bsClearfix', ['bsCssHelper', function (bsCssHelper) {
         return bsCssHelper.getClassDirective("clearfix");
    }])
    // muted, primary, success, info, warning, danger, confirmation
    .directive('bsText', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("text", "bsText");
    }])
    // primary, success, info, warning, danger, confirmation
    .directive('bsBg', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("bg", "bsBg");
    }])
    .directive('bsClose', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("close");
    }])
    .directive('bsCaret', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("caret");
    }])
    // left, right
    .directive('bsPull', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("pull", "bsPull");
    }])
    // block
    .directive('bsCenter', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("center", "bsCenter");
    }])
    .directive('bsShow', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("show");
    }])
    .directive('bsHidden', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("hidden");
    }])
    .directive('bsInvisible', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("invisible");
    }])
    .directive('bsSrOnly', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("sr-only");
    }])
    .directive('bsActive', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("active");
    }])
    .directive('bsDisabled', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("disabled");
    }])
    .directive('bsElementDisabled', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getAttributeDirective("disabled", "disabled");
    }])
    .directive('bsSuccess', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("success");
    }])
    .directive('bsWarning', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("warning");
    }])
    .directive('bsDanger', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("danger");
    }])
    .directive('bsDanger', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("confirmation");
    }])
    .directive('bsInfo', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("info");
    }])
    .directive('bsRole', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("role", "bsRole");
    }])
    // scrollable
    .directive('bsPre', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("pre", 'bsPre');
    }])
    .directive('bsPage', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("page", 'bsPage');
    }]);