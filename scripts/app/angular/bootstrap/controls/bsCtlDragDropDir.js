'use strict';

angular
    .module('lgi.emr.mar.web.bootstrap.controls')
    .directive('bsDrag', [
        '$rootScope', '$parse', function ($rootScope, $parse) {
            return {
                restrict: 'AE',
                link: function (scope, element, attrs) {
                    scope.value = attrs.bsDrag;
                    //  return;
                    var offset, centerAnchor = false, mx, my, tx, ty, mrx, mry, txStart, tyStart;
                    var hasTouch = ('ontouchstart' in document.documentElement);
                    var pressEvents = 'touchstart mousedown';
                    var moveEvents = 'touchmove mousemove';
                    var releaseEvents = 'touchend mouseup';

                    var $document = $(document);
                    var $window = $(window);
                    var data = null;

                    var dragEnabled = false;

                    var pressTimer = null;

                    var onDragSuccessCallback = $parse(attrs.bsDragSuccess) || null;
                    var onDragMoveCallback = $parse(attrs.bsDragMove) || null;
                    var onDragReleaseCallback = $parse(attrs.bsDragRelease) || null;

                    var initialize = function () {
                        element.attr('draggable', 'false'); // prevent native drag
                        toggleListeners(true);
                    };

                    var toggleListeners = function (enable) {
                        // remove listeners

                        if (!enable) return;
                        // add listeners.

                        scope.$on('$destroy', onDestroy);
                        scope.$watch(attrs.bsDrag, onEnableChange);
                        scope.$watch(attrs.bsCenterAnchor, onCenterAnchor);
                        scope.$watch(attrs.bsDragData, onDragDataChange);
                        element.on(pressEvents, onpress);
                        if (!hasTouch) {
                            element.on('mousedown', function () { return false; }); // prevent native drag
                        }
                    };
                    var onDestroy = function (enable) {
                        toggleListeners(false);
                    };
                    var onDragDataChange = function (newVal, oldVal) {
                        data = newVal;
                    };
                    var onEnableChange = function (newVal, oldVal) {
                        dragEnabled = (newVal);
                    };
                    var onCenterAnchor = function (newVal, oldVal) {
                        if (angular.isDefined(newVal))
                            centerAnchor = (newVal || 'true');
                    }
                    /*
                    * When the element is clicked start the drag behaviour
                    * On touch devices as a small delay so as not to prevent native window scrolling
                    */
                    var onpress = function (evt) {
                        if (!dragEnabled) return;


                        if (hasTouch) {
                            cancelPress();
                            pressTimer = setTimeout(function () {
                                cancelPress();
                                onlongpress(evt);
                            }, 100);
                            $document.on(moveEvents, cancelPress);
                            $document.on(releaseEvents, cancelPress);
                        } else {
                            onlongpress(evt);
                        }

                    }
                    var cancelPress = function () {
                        clearTimeout(pressTimer);
                        $document.off(moveEvents, cancelPress);
                        $document.off(releaseEvents, cancelPress);
                    }
                    var onlongpress = function (evt) {
                        if (!dragEnabled) return;
                        evt.preventDefault();
                        offset = element.offset();
                        element.centerX = (element.width() / 2);
                        element.centerY = (element.height() / 2);
                        element.addClass('dragging');
                        mx = (evt.pageX || evt.originalEvent.touches[0].pageX);
                        my = (evt.pageY || evt.originalEvent.touches[0].pageY);
                        mrx = mx - offset.left;
                        mry = my - offset.top;

                        if (centerAnchor) {
                            tx = mx - element.centerX - $window.scrollLeft();
                            ty = my - element.centerY - $window.scrollTop();
                        } else {
                            tx = offset.left - $window.scrollLeft();
                            ty = offset.top - $window.scrollTop();
                        }

                        if (centerAnchor) {
                            txStart = mx - element.centerX - $window.scrollLeft();
                            tyStart = my - element.centerY - $window.scrollTop();
                        } else {
                            txStart = mx - mrx - $window.scrollLeft();
                            tyStart = my - mry - $window.scrollTop();
                        }

                        //moveElement(tx, ty);
                        $document.on(moveEvents, onmove);
                        $document.on(releaseEvents, onrelease);
                        $rootScope.$broadcast('draggable:start', { x: mx, y: my, tx: tx, ty: ty, event: evt, element: element, data: data });
                    }
                    var onmove = function (evt) {
                        if (!dragEnabled) return;
                        evt.preventDefault();

                        mx = (evt.pageX || evt.originalEvent.touches[0].pageX);
                        my = (evt.pageY || evt.originalEvent.touches[0].pageY);

                        if (centerAnchor) {
                            tx = mx - element.centerX - $window.scrollLeft();
                            ty = my - element.centerY - $window.scrollTop();
                        } else {
                            tx = mx - mrx - $window.scrollLeft();
                            ty = my - mry - $window.scrollTop();
                        }
                        //console.log("txStart " + txStart);
                        //console.log("tx " + tx);
                        //console.log("tyStart " + tyStart);
                        //console.log("ty " + ty);
                        //console.log(tx - txStart);
                        //console.log(ty - tyStart);
                        if ((tx != txStart) || (ty != tyStart)) {
                            moveElement(tx, ty);
                            //console.log("MOVING");

                            $rootScope.$broadcast('draggable:move', { x: mx, y: my, tx: tx, ty: ty, event: evt, element: element, data: data });

                            if (!onDragMoveCallback) return;

                            scope.$apply(function () {
                                onDragMoveCallback(scope, { $data: data, $event: evt });
                            });
                        }
                    }
                    var onrelease = function (evt) {
                        if (!dragEnabled) return;
                        evt.preventDefault();
                        $rootScope.$broadcast('draggable:end', { x: mx, y: my, tx: tx, ty: ty, event: evt, element: element, data: data, callback: onDragComplete });
                        element.removeClass('dragging');
                        reset();
                        $document.off(moveEvents, onmove);
                        $document.off(releaseEvents, onrelease);
                        if (!onDragReleaseCallback) return;

                        scope.$apply(function () {
                            onDragReleaseCallback(scope, { $data: data, $event: evt });
                        });

                    }
                    var onDragComplete = function (evt) {
                        if (!onDragSuccessCallback) return;

                        scope.$apply(function () {
                            onDragSuccessCallback(scope, { $data: data, $event: evt });
                        });
                    }
                    var reset = function () {
                        element.css({ left: '', top: '', position: '', 'z-index': '', margin: '' });
                    }
                    var moveElement = function (x, y) {
                        element.css({ left: x, top: y, position: 'fixed', 'z-index': 99999, margin: '0' });
                    }
                    initialize();
                }
            }
        }
    ])
    .directive('bsDrop', [
        '$parse', '$timeout', function ($parse, $timeout) {
            return {
                restrict: 'A',
                link: function (scope, element, attrs) {
                    scope.value = attrs.bsDrop;

                    var dropEnabled = false;

                    var onDropCallback = $parse(attrs.bsDropSuccess);
                    var initialize = function () {
                        toggleListeners(true);
                    };


                    var toggleListeners = function (enable) {
                        // remove listeners

                        if (!enable) return;
                        // add listeners.
                        attrs.$observe("bsDrop", onEnableChange);
                        scope.$on('$destroy', onDestroy);
                        scope.$on('draggable:start', onDragStart);
                        scope.$on('draggable:move', onDragMove);
                        scope.$on('draggable:end', onDragEnd);
                    };
                    var onDestroy = function (enable) {
                        toggleListeners(false);
                    };
                    var onEnableChange = function (newVal, oldVal) {
                        dropEnabled = scope.$eval(newVal);
                    }
                    var onDragStart = function (evt, obj) {
                        if (!dropEnabled) return;
                        isTouching(obj.x, obj.y, obj.element);
                    }
                    var onDragMove = function (evt, obj) {
                        if (!dropEnabled) return;
                        isTouching(obj.x, obj.y, obj.element);
                    }
                    var onDragEnd = function (evt, obj) {
                        if (!dropEnabled) return;

                        if (isTouching(obj.x, obj.y, obj.element)) {

                            // call the bsDraggable bsDragSuccess element callback
                            if (obj.callback) {
                                obj.callback(obj);
                            }

                            $timeout(function () {
                                onDropCallback(scope, { $data: obj.data, $event: obj });
                            });


                        }
                        updateDragStyles(false, obj.element);
                    }
                    var isTouching = function (mouseX, mouseY, dragElement) {
                        var touching = hitTest(mouseX, mouseY);
                        updateDragStyles(touching, dragElement);
                        return touching;
                    }
                    var updateDragStyles = function (touching, dragElement) {
                        if (touching) {
                            element.addClass('drag-enter');
                            dragElement.addClass('drag-over');
                        } else {
                            element.removeClass('drag-enter');
                            dragElement.removeClass('drag-over');
                        }
                    }
                    var hitTest = function (x, y) {
                        var bounds = element.offset();
                        bounds.right = bounds.left + element.outerWidth();
                        bounds.bottom = bounds.top + element.outerHeight();
                        return x >= bounds.left
                            && x <= bounds.right
                            && y <= bounds.bottom
                            && y >= bounds.top;
                    }

                    initialize();
                }
            }
        }
    ]);
