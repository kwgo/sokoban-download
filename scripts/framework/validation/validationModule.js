'use strict';

angular
    .module('lgi.infra.web.validation', ['jcs-autoValidate'])
    .factory('validationMessageResolverFactory', ['$q', '$rootScope', 'defaultErrorMessageResolver',
    function ($q, $rootScope, defaultErrorMessageResolver) {
        /**
        * @ngdoc function
        * @name defaultErrorMessageResolver#resolve
        * @methodOf defaultErrorMessageResolver
        *
        * @description
        * Resolves a validate error type into a user validation error message
        *
        * @param {String} errorType - The type of validation error that has occurred.
        * @param {Element} el - The input element that is the source of the validation error.
        * @returns {Promise} A promise that is resolved when the validation message has been produced.
        */
        var resolve = function (errorType, el) {
            var defer = $q.defer();

            if (el.attr(errorType + '-err-message')) {
                defer.resolve(el.attr(errorType + '-err-message'));
            } else if (el.attr('default-err-message')) {
                defer.resolve(el.attr('default-err-message'));
            } else {
                defer.resolve(defaultErrorMessageResolver.resolve(errorType, el));
            }

            return defer.promise;
        };

        return {
            setI18nFileRootPath: function (path) {
                defaultErrorMessageResolver.setI18nFileRootPath(path);
            },
            setCulture: function (culture) {
                defaultErrorMessageResolver.setCulture(culture);
            },
            resolve: resolve
        };
    }
    ])
    .factory('validationFactory',
    [
        function () {
            // initialize bootstrap tooltip
            $('[data-toggle="tooltip"]').tooltip();

            // get the form group element
            var getFormGroup = function (jElement) {
                return jElement.parents(".form-group:first");
            };
            // remove error class
            var removeValidationData = function (jElement) {
                jElement.removeClass('has-error');
            };
            // check if it is a kendo control
            var hasKendoAttribute = function (jElement) {
                var elementHtml = $("<div />").append(jElement.clone()).html();
                return elementHtml.indexOf("kendo-") >= 0;
            };
            // reset validation, remove tooltip and handlers
            var resetValidation = function (element, callback) {
                var jElement = $(element);
                var group = getFormGroup(jElement);

                removeValidationData(jElement);
                removeValidationData(group);

                jElement.removeAttr("data-error-message");
                destroyTooltip(jElement);

                if (angular.isDefined(callback)) {
                    callback(jElement);
                }
            };
            // get the element to set the tooltip. if kendo control use the .k-widget parent to set the tooltip 
            // instead of the current element so the tooltip will display correctly
            var getElement = function (jElement) {
                var obj = {
                    parent: null,
                    element: jElement,
                    tooltipElement: function () {
                        return this.parent ? this.parent : this.element;
                    }
                };
                if (hasKendoAttribute(jElement)) {
                    var parent = jElement.parents(".k-widget:first");
                    if (parent.length > 0) {
                        obj.parent = parent;
                    }
                }
                return obj;
            };

            var showTooltip = function (jElement) {
                var el = getElement(jElement).tooltipElement();
                if (!el.data('bs.tooltip').tip().is(':visible')) {
                    el.tooltip('show');
                }
            };
            var hideTooltip = function (jElement) {
                var el = getElement(jElement).tooltipElement();
                if (el.data('bs.tooltip').tip().is(':visible')) {
                    el.tooltip('hide');
                }
            };
            var destroyTooltip = function (jElement) {
                var el = getElement(jElement).tooltipElement();
                el.off('focusin', showTooltipElementHandler);
                el.off('focusout', hideTooltipElementHandler);
                el.tooltip('destroy');

                jElement.off('focusin', showTooltipHandler);
                jElement.off('focusout', hideTooltipHandler);

                var kendoData = getKendoData(jElement);
                if (kendoData) {
                    kendoData.unbind('open', openKendoPopupHandler);
                    kendoData.unbind('close', closeKendoPopupHandler);
                }
            };
            // generic function to retreive the kendoControl.data() object
            var getKendoData = function (jElement) {
                var keys = Object.keys(jElement.data());
                for (var i = 0; i < keys.length; i++) {
                    if (keys[i].indexOf('kendo') == 0) {
                        return jElement.data(keys[i]);
                    }
                }
                return null;
            };
            function openKendoPopupHandler(e) {
                e.sender.element.focus();
                showTooltip(e.sender.element);
            };
            function closeKendoPopupHandler(e) {
                setTimeout(function () {
                    var el = getElement(e.sender.element);
                    if (el.tooltipElement().find('.k-state-focused').length == 0) {
                        hideTooltip(e.sender.element);
                    }
                }, 12);
            };
            function showTooltipHandler(e) {
                showTooltip($(this));
            };
            function hideTooltipHandler(e) {
                hideTooltip($(this));
            };
            var showTooltipElementHandler = function (e) {
                showTooltip(e.data.jElement);
            };
            var hideTooltipElementHandler = function (e) {
                if (e.data.kendoData) {
                    if (e.data.kendoData._getPopup) {
                        if (!e.data.kendoData._getPopup().visible()) {
                            hideTooltip(e.data.jElement);
                        }
                    }
                }
            };
            return {
                invalid: function (element, errorMsg, callback) {
                    var jElement = $(element);
                    var kendoControl = getElement(jElement);
                    var tooltipElement = kendoControl.tooltipElement();
                    var tooltipMinWidth = 175;
                    var tooltipMaxWidth = 200;
                    var options = {
                        title: errorMsg,
                        placement: function (tooltip, ele) {
                            var viewportWidth = $(window).width();
                            var eleWidth = $(ele).width();
                            var leftOffset = $(ele).offset().left;
                            var rightOffset = viewportWidth - ($(ele).offset().left + eleWidth);

                            // Calculate tooltip width before it shows
                            // title is by tooltip moved to data-original-title
                            var title = $(element).attr('data-original-title');

                            // create dummy, a div with the same features as the tooltïp
                            var dummy = $('<div class="tooltip">' + title + '</div>').appendTo('body');
                            var currentTipWidth = $(dummy).width();
                            dummy.remove();

                            if (currentTipWidth < tooltipMinWidth) {
                                currentTipWidth = tooltipMinWidth;
                            }
                            if (currentTipWidth > tooltipMaxWidth) {
                                currentTipWidth = tooltipMaxWidth;
                            }
                            currentTipWidth += 20; // Padding Offset

                            // Position tooltip
                            // tooltip position for "fréquence ordonnance" + manual entry/weekly
                            if (tooltipElement.closest("form").length > 0 && tooltipElement.closest("form").attr("name") === "editRxForm" && tooltipElement.attr("name") === "weekdays" && tooltipElement.attr("type") === "checkbox") {
                                return "top";
                            }
                            if (rightOffset > currentTipWidth) {
                                return "right";
                            } else if (leftOffset > currentTipWidth) {
                                return "left";
                            }
                            return "top";
                        },
                        trigger: "manual",
                        viewport: { "selector": "body", "padding": 0 },
                        animation: false,
                        container: "body"
                    };

                    tooltipElement.tooltip(options);
                    tooltipElement.attr('data-original-title', errorMsg);
                    // force update text
                    var tip = tooltipElement.data('bs.tooltip').tip();
                    tip.find('.tooltip-inner').text(errorMsg);
                    tip.find('.tooltip-inner').css('min-width', tooltipMinWidth + 'px');                    
                    tip.css('z-index', 999999);// IWEB-146 - Tooltip underneath other windows
                    if (tip.is(":visible")) {
                        tooltipElement.tooltip('hide').tooltip('show');
                    }

                    var kendoData = getKendoData(jElement);
                    if (kendoData) {
                        kendoData.setOptions({
                            open: openKendoPopupHandler,
                            close: closeKendoPopupHandler
                        });
                    }

                    var data = {
                        jElement: jElement,
                        kendoData: kendoData
                    }
                    tooltipElement.on('focusin', data, showTooltipElementHandler);
                    tooltipElement.on('focusout', data, hideTooltipElementHandler);
                    jElement.on('focusin', showTooltipHandler);
                    jElement.on('focusout', hideTooltipHandler);

                    if (tooltipElement.is(":focus") || tooltipElement.find(':focus').length > 0) {
                        tooltipElement.tooltip('show');
                    }

                    getFormGroup(jElement).addClass('has-error');
                },
                reset: function (element, callback) {
                    resetValidation(element, callback);
                },
                default: function (element, callback) {
                    resetValidation(element, callback);
                }
            };
        }
    ])
	.directive('validFile', function () {
	    return {
	        require: 'ngModel',
	        link: function (scope, el, attrs, ngModel) {
	            el.bind('change', function () {
	                scope.$apply(function () {
	                    ngModel.$setViewValue(el.val());
	                    ngModel.$render();
	                });
	            });
	        }
	    }
	})
    .run(
    [
        'validator', 'defaultValidationModifier', 'validationMessageResolverFactory', 'bootstrap3ElementModifier', 'cultureManager', '$rootScope',
        function (validator, defaultValidationModifier, validationMessageResolverFactory, bootstrap3ElementModifier, cultureManager, $rootScope) {
            validator.setValidElementStyling(false);
            validator.setInvalidElementStyling(true);
            bootstrap3ElementModifier.enableValidationStateIcons(false);
            validator.registerDomModifier(defaultValidationModifier.key, defaultValidationModifier);
            validator.setDefaultElementModifier(defaultValidationModifier.key);
            validationMessageResolverFactory.setI18nFileRootPath('scripts/libs/angular-auto-validate/i18n');
            validator.setErrorMessageResolver(validationMessageResolverFactory.resolve);

            $rootScope.$on(cultureManager.CHANGED_EVENTNAME, function () {
                validationMessageResolverFactory.setCulture(cultureManager.currentCulture.Culture.Code);
            });
        }
    ]);
$(function () {
    $(window).resize(function () {
        var tooltip = $('.tooltip');
        tooltip.tooltip('show');
    });
});
$.addScript('scripts/framework/validation/defaultValidationModifier.js');