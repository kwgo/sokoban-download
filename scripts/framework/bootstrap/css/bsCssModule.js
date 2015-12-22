'use strict';
angular
    .module('lgi.infra.web.bootstrap.css', [])
    .factory('bsCssHelper', function () {
        return {
            getClassDirective: function (className, directiveName) {
                return {
                    restrict: 'AC',
                    link: function (scope, element, attrs) {
                        var classes = [];
                        if (angular.isDefined(directiveName)) {
                            var value = attrs[directiveName];
                            if (angular.isDefined(value) && value != "") {
                                var values = value.split(" ");
                                angular.forEach(values, function(v) {
                                    classes.push(className + "-" + v);
                                });
                            } else {
                                classes.push(className);
                            }
                        } else {
                            classes.push(className);
                        }
                        angular.forEach(classes, function(c) {
                            if (!element.hasClass(c)) {
                                element.addClass(c);
                            }
                        });
                    }
                };
            },
            getAttributeDirective: function (attr, value) {
                return {
                    restrict: 'A',
                    link: function (scope, element, attrs) {
                        element.attr(attr, value);
                    }
                };
            }
        };
    });
$.addScript('scripts/framework/bootstrap/css/bsCssButtonDir.js');
$.addScript('scripts/framework/bootstrap/css/bsCssContainerDir.js');
$.addScript('scripts/framework/bootstrap/css/bsCssFontAwesomeDir.js');
$.addScript('scripts/framework/bootstrap/css/bsCssFormDir.js');
$.addScript('scripts/framework/bootstrap/css/bsCssGlyphiconDir.js');
$.addScript('scripts/framework/bootstrap/css/bsCssGridDir.js');
$.addScript('scripts/framework/bootstrap/css/bsCssHelperDir.js');
$.addScript('scripts/framework/bootstrap/css/bsCssImageDir.js');
$.addScript('scripts/framework/bootstrap/css/bsCssPopupDir.js');
$.addScript('scripts/framework/bootstrap/css/bsCssResponsiveDir.js');
$.addScript('scripts/framework/bootstrap/css/bsCssTableDir.js');
$.addScript('scripts/framework/bootstrap/css/bsCssTypographyDir.js');