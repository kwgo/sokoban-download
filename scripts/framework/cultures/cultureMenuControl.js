'use strict';

angular
    .module('lgi.infra.web.cultures')
    .directive('cultureMenu',
    [
        '$compile', 'locationService', 'pagManager', 'cultureManager', 'storageService',
        function ($compile, locationService, pageManager, cultureManager, storageService) {
            function link(scope, element, attrs) {
                scope.model = {
                    isReady: true,
                    supportedCount: 0,
                    pageManager: pageManager,
                    cultureManager: cultureManager,
                    pages: []
                }
                scope.reloadPage = function() {
                    var page = pageManager.pages.Where(function (p) {
                        return p.Culture == cultureManager.nextCulture.Culture.Code &&
                                p.PageId == pageManager.currentPage.PageId;
                    }).FirstOrDefault();
                    if (page != null) {
                        storageService.session.set('forcedCulture', true);
                        pageManager.reloadPage(page.Url);
                    }
                };
                scope.model.supportedCount = cultureManager.supportedCultures.Count();
                if (scope.model.supportedCount > 1) {
                    var children = element.children();
                    $.each(children, function (i) {
                        $(children[i]).insertAfter(element);
                    }); 
                }
                element.remove();

                if (scope.model.supportedCount > 2) {
                    scope.model.pages = pageManager.pages.Where(function (p) {
                        return p.Culture != cultureManager.currentCulture.Culture.Code &&
                            p.PageId == pageManager.currentPage.PageId;
                        }).ToArray();
                }
            };

            return {
                replace: true,
                restrict: 'A',
                scope: {},
                templateUrl: function (element, attrs) {
                    if (angular.isDefined(attrs.culMenuTemplateUrl)) {
                        return attrs.culMenuTemplateUrl;
                    }
                    return locationService.framework.root + "cultures/views/culture-menu.html";
                },
                link: link
            };
        }
    ]);