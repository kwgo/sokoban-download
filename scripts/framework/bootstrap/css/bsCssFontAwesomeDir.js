'use strict';

angular
    .module('lgi.infra.web.bootstrap.css')
    .directive('bsFaicon', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("fa fa", "bsFaicon");
    }]);