'use strict';

angular
    .module('lgi.infra.web.bootstrap.css')
    .directive('bsGlyphicon', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("glyphicon glyphicon", "bsGlyphicon");
    }]);