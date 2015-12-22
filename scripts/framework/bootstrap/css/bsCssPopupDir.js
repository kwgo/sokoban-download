'use strict';

angular
    .module('lgi.infra.web.bootstrap.css')
    .directive('bsPopup', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("modal", "bsPopup");
    }])