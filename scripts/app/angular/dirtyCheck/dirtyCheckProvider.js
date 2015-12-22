'use strict';
angular
	.module('lgi.emr.mar.web.dirtyCheck')
	.directive('dirtyCheck', ['$location', 'popupService', 
		function ($location, popupService) {
		    return {
		        restrict: 'A',
		        priority: -10,
				link: function ($scope, $element, $attrs) {
					var currentElementIsForm = $element.context.nodeName.toLowerCase() == "form";

					var check = function (form, event, destination, args) {
						var dirty = form.hasClass("ng-dirty");

					    if (dirty) {
					        if (event.stopImmediatePropagation) {
					            event.stopImmediatePropagation();
					        }
					        event.preventDefault();

					        var saveMethod = function() {
					            var saveMethodName = form.attr("dirty-check-save");
					            $scope[saveMethodName]()
					                .then(function() {
					                    if (angular.isDefined(destination)) continu();
					                    else if (angular.isDefined(args)) $scope.$emit('patientChangedAfterFormCheck', args);
					                });
					        };

					        var resetMethod = function() {
					            var resetMethodName = form.attr("dirty-check-reset");
					            if (resetMethodName) {
					                $scope[resetMethodName]();
					            }
					            if (angular.isDefined(destination)) continu();
					            else if (angular.isDefined(args)) $scope.$emit('patientChangedAfterFormCheck', args);
					        };

					        var continu = function() {
					            $element.removeClass("ng-dirty"); //prevent to infinit loop
					            if (currentElementIsForm) {
					                var baseLen = $location.absUrl().length - $location.url().length;
					                var destinationPath = destination.substring(baseLen);
					                $location.url(destinationPath);
					            } else {
					                setTimeout(function() { $element.trigger("click"); }, 0); //setTimeout prevent the "apply already in progress" error
					            }
					        };

					        var popupTitle = form.attr("dirty-check-title");
					        var popupContent = form.attr("dirty-check-content");
					        popupService.confirm({
					            title: popupTitle,
					            content: popupContent,
					            actionBtnText: $scope.cultureManager.resources.translate('YES'),
					            closeBtnText: $scope.cultureManager.resources.translate('NO'),
					            cancelBtnText: $scope.cultureManager.resources.translate('CANCEL'),
					            onAction: saveMethod,
					            onClose: resetMethod,
					            modal: true
					        });
					    } 
					};

					if (currentElementIsForm) {
					    $scope.$on("triggerDirtyCheck", function (event, args) {
					        $("form[dirty-check]").each(function () {
					            var form = angular.element(this);
					            var dirty = form.hasClass("ng-dirty");
					            if (dirty) {
					                check(form, event, '', args);
					            } else {
					                $scope.$emit('patientChangedAfterFormCheck', args);
					                event.preventDefault();
					            }
					        });
					    });
					}
                    ////manage F5 and ctrl+R, those keys will reload the page (use keydown for ie)
					$element.bind("keydown", function (event) {
					    if ((event.which === 116 )|| (event.which === 82 && event.ctrlKey)) {
					        $("form[dirty-check]").each(function () {
					            var form = angular.element(this);
					            check(form, event);
					        });
					    }
					});

					if (currentElementIsForm) {
						$scope.$on('$locationChangeStart', function (event, destination) {
							check($element, event, destination);
						});

					} else {
						$element.bind('click', function (event) {
							$("form[dirty-check]").each(function() {
								var form = angular.element(this);
								check(form, event);
							});
						});
					}
				}
			};
		}
	]);
