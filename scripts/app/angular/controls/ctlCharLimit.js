'use strict';

angular
    .module('lgi.emr.mar.web.controls')
    .directive('ctlCharLimit',
    [
        '$window',
        function ($window) {

            function isTextSelected(input) {
                var startPos = input.selectionStart;
                var endPos = input.selectionEnd;
                var doc = document.selection;

                if (doc && doc.createRange().text.length != 0) {
                    return true;
                } else if (!doc && input.value.substring(startPos, endPos).length != 0) {
                    return true;
                }
                return false;
            }

            return {
                require: 'ngModel',
                restrict: 'A',
                link: function ($scope, $element, $attributes, $ctrl) {
                    var limit = $attributes.ctlCharLimit;

                    $element.bind('keyup', function (event) {
                        var element = $element.parent().parent();

                        element.toggleClass('warning', limit - $element.val().length <= 10);
                        element.toggleClass('error', $element.val().length > limit);
                    });

                    $element.bind({
                        paste: function (event) {
                            var pastedValue = event.originalEvent.clipboardData.getData('Text');
                            var selectionStart = $element.context.selectionStart;
                            var selectionEnd = $element.context.selectionEnd;
                            var newStr = '';
                            if (($element.val().length + pastedValue.length >= limit)) {
                                    event.preventDefault();
                                    newStr = $element.val().substring(0, selectionStart) + pastedValue + $element.val().substring(selectionEnd, $element.val().length);
                                    $ctrl.$setViewValue(newStr.substring(0, limit));
                                    $ctrl.$render();
                            }
                        },
                        keypress: function(event) {
                            // Once the limit has been met or exceeded, prevent all keypresses from working
                           if (($element.val().length >= limit) && !isTextSelected($element.context)) {
                                // Except backspace
                                if (event.keyCode != 8) {
                                    event.preventDefault();
                                }
                            }
                        }
                    });
                }
            };
        }
    ]);