'use strict';

angular
    .module('lgi.emr.mar.web.bootstrap.css')
    .directive('bsLgiicon', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("lgi lgi", "bsLgiicon");
    }]);