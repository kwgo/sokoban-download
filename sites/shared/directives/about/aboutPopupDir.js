'use strict';

angular
    .module('app')
    .directive('aboutPopup',
    [
        'authService', '$sce', 'popupService', 'cultureManager', 'pagManager', 'locationService', 'versionService', '$rootScope', '$modal',
        function (authService, $sce, popupService, cultureManager, pageManager, locationService, versionService, $rootScope, $modal) {

            function link(scope, element, attrs) {
                $rootScope.cultureManager.resources.load('sites/shared/directives/about/i18n/about');
                scope.version = {};

                // Get version info
                versionService.version()
                    .then(
                        // Success
                        function (result) {
                            scope.version = result;
                        },
                        // Error
                        function (error) {
                            console.log("Version service: ERROR!");
                        }
                    );
                

                // Open mx components popup
                scope.showAboutPopup = function () {
                    var subScope = $rootScope.$new();
                    subScope.version = scope.version;
                    subScope.onClose = function () {
                        modalInstance.dismiss('close');
                    }
                    var modalInstance = $modal.open({
                        templateUrl: locationService.shared.directives + "about/views/about-page.html",
                        controller: 'aboutController',
                        scope: subScope,
                        backdrop: 'static',
                        keyboard: false
                    });
                };
            }

            return {
                replace: true,
                restrict: 'A',
                link: link,
                scope: {},
                templateUrl: function (element, attrs) {
                    return locationService.shared.directives + "about/views/about-popup.html";
                }
            }
        }
    ]);