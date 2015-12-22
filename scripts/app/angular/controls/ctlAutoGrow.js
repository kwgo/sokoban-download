'use strict';

angular
    .module('lgi.emr.mar.web.controls')
    .directive('ctlAutoGrow',
    [
        '$timeout', '$compile',
        function ($timeout, $compile) {

            return  {
                restrict: 'A',
                scope: {
                    triggerRender: '@'
                },
                link: function (scope, element, attrs) {
                    var minHeight = element[0].offsetHeight,
                      paddingLeft = element.css('paddingLeft'),
                      paddingRight = element.css('paddingRight');

                    var $shadow = angular.element('<div></div>').css({
                      position: 'absolute',
                      top: -10000,
                      left: -10000,
                      width: element[0].offsetWidth - parseInt(paddingLeft || 0) - parseInt(paddingRight || 0),
                      fontSize: element.css('fontSize'),
                      fontFamily: element.css('fontFamily'),
                      lineHeight: element.css('lineHeight'),
                      resize:     'none'
                    });

                    var content = angular.element($shadow);
                    content.insertAfter(element);
                    $compile(content)(scope);//angular.element(document.body).append($shadow);
                    // wait for content to load into table
                    scope.$watch(function () { return element.is(':visible'); },
                        function (newValue, oldValue) {
                            if (newValue === true) {
                                update();
                            }
                    });
                    var update = function () {
                    $timeout(function () {
                      var times = function(string, number) {
                        for (var i = 0, r = ''; i < number; i++) {
                          r += string;
                        }
                        return r;
                      }
                        
                      var val = element.val().replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/&/g, '&amp;')
                        .replace(/\n$/, '<br/>&nbsp;')
                        .replace(/\n/g, '<br/>')
                        .replace(/\s{2,}/g, function(space) { return times('&nbsp;', space.length - 1) + ' '; });
                      $shadow.html(val);
                      $shadow.css('width', element[0].offsetWidth - parseInt(paddingLeft || 0) - parseInt(paddingRight || 0));
                      var limit = attrs.textareaMaxHeight;
                        if (limit != undefined) {
                            element.css('height', Math.max(Math.min($shadow[0].offsetHeight + 6, limit), minHeight) + 'px');
                        } else {
                            element.css('height', Math.max($shadow[0].offsetHeight + 6, minHeight) + 'px');
                        }
                    }, 1000, false);
                }
                // check for resize
                scope.$watch("triggerRender", function (newValue, oldValue) {
                    if (newValue != oldValue) {
                        update();
                    }
                });
                scope.$on('$destroy', function () {
                    $shadow.remove();
                });

                element.bind('keyup keydown keypress change paste', update);
            }
         };
    }]);
