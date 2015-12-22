'use strict';

angular
    .module('lgi.infra.web.bootstrap.css')
    // empty, fluid
    .directive('bsContainer', ['bsCssHelper', function (bsCssHelper) {
        return bsCssHelper.getClassDirective("container", "bsContainer");
     }]);