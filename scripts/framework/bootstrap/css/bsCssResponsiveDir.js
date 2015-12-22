'use strict';

angular
    .module('lgi.infra.web.bootstrap.css')
    // xs, sm, md, lg
    .directive('bsVisible', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("visible", "bsVisible");
    }])
    // xs, sm, md, lg
    .directive('bsHidden', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("hidden", "bsHidden");
    }]);