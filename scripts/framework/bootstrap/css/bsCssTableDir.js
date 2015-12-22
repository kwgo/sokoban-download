'use strict';

angular
    .module('lgi.infra.web.bootstrap.css')
    // empty, striped, bordered, hover, condensed, responsive
    .directive('bsTable', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("table table", "bsTable");
    }])
    .directive('bsTableResponsive', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("table-responsive");
    }]);