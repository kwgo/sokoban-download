'use strict';

angular
    .module('lgi.infra.web.bootstrap.css')
    // responsive, rounded, circle, thumbnail
    .directive('bsImg', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("img", "bsImg");
    }]);