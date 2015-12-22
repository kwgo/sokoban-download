'use strict';

angular
    .module('lgi.infra.web.bootstrap.css')
    // group, inline, horizontal, control
    .directive('bsForm', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("form", "bsForm");
    }])
    // block
    .directive('bsHelp', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("help-block", "bsHelp");
    }])
    // empty, inline
    .directive('bsCheckbox', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("checkbox", "bsCheckbox");
    }])
    // empty, inline
    .directive('bsRadio', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("radio", "bsRadio");
    }])
    // label
    .directive('bsControl', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("control", "bsControl");
    }])
    .directive('bsMultiple', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getAttributeDirective("multiple", "");
    }])
    // warning, error, success, confirmation
    .directive('bsHas', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("has", "bsHas");
    }])
    // lg, sm
    .directive('bsInput', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("input", "bsInput");
    }]);
