'use strict';

angular
    .module('lgi.infra.web.pages')
    .service('pagManager',
    ['$location', '$route', '$rootScope', 'cultureManager', 'utlLogger', '$pages', 'locationService', 'authService', 'storageService',
    function ($location, $route, $rootScope, cultureManager, utlLogger, $pages, locationService, authService, storageService) {
        var pm = this;
        pm.PAGECHANGED_EVENTNAME = "pageManager:PageChanged";
        pm.pages = Enumerable.From($pages);
        pm.currentPage = {};
        
    	//only for testing purpose
        //pm.pages.source[4].AccessRoles[0].Permissions.push("MAR_DA_AdHocPrescriptionAddDose");
        //pm.pages.source[4].AccessRoles[0].Permissions.push("impossiblepermissionstohave");
        //pm.pages.source[4].AccessRoles.push({ SecurityContext: "Lgi.Infrastructure.SettingsManager.Permissions", Permissions: ["AnnouncementCreation"] });

        pm.fallbackPage = function (code) {
            var page = pm.pages.Where(function (p) { return p.IsFallback && p.Culture == code; }).FirstOrDefault();
            if (angular.isUndefined(page)) {
                var culture = cultureManager.getCultureNeutral(code);
                if (angular.isDefined(culture)) {
                    page = pm.pages.Where(function (p) { return p.IsFallback && p.Culture == culture.Culture.Code; }).FirstOrDefault();
                }
            }

            if (angular.isUndefined(page)) {
                utlLogger.warn("No fallback page found.");
                // redirect to not found system page ??
            }

            return page;
        };
        pm.defaultPage = function (code) {
            var page = pm.pages.Where(function (p) { return p.IsDefault && p.Culture == code; }).FirstOrDefault();
            if (angular.isUndefined(page)) {
                var culture = cultureManager.getCultureNeutral(code);
                if (angular.isDefined(culture)) {
                    page = pm.pages.Where(function (p) { return p.IsDefault && p.Culture == culture.Culture.Code; }).FirstOrDefault();
                }
            }

            if (angular.isUndefined(page)) {
                utlLogger.warn("No default page found.");
                // redirect to default system page ??
            }

            return page;
        };
        pm.getPageByCultureAndName = function (culture, page) {
            return pm.pages.Where(function (p) { return p.Url == culture + "/" + page; }).FirstOrDefault();
        };
        pm.findPageByName = function (pageName) {
            return pm.pages.Where(function(p) {
                 return p.Url.substring(p.Culture.length + 2, p.Url.length) == pageName;
            }).FirstOrDefault();
        };
        pm.redirectToFallback = function (culture) {
            var page = pm.fallbackPage(culture);
            var path = locationService.current.path + page.Url;
            var url = $location.url();
            $location.url(locationService.current.path + page.Url).replace();
            if (path.toLowerCase() === url.toLowerCase()) {
                $route.reload();
            }
        };
        pm.reloadFallback = function (culture) {
            var page = pm.fallbackPage(culture);
            window.location.href = locationService.current.path + page.Url;
        };
        pm.redirectToDefault = function (culture) {
            var page = pm.defaultPage(culture);
            var path = locationService.current.path + page.Url;
            var url = $location.url();
            $location.url(locationService.current.path + page.Url).replace();
            if (path.toLowerCase() === url.toLowerCase()) {
                $route.reload();
            }
        };
        pm.redirectToPage = function (page) {
            $location.path(locationService.current.path + page.Url);
        };
        pm.redirectToCulture = function(code) {
            var page = pm.pages.Where(function (p) { return p.PageId == pm.currentPage.PageId && p.Culture == code; }).First();
            pm.reloadPage(page.Url);
        };
        pm.reloadPage = function (url) {
            window.location.href = locationService.root + locationService.current.path + url + window.location.search + window.location.hash;
        };
        pm.redirectToParent = function() {
            var page = pm.pages.Where(function (p) { return p.PageId == pm.currentPage.ParentId && p.Culture == pm.currentPage.Culture; }).FirstOrDefault();
            if (page != null) {
                $location.url($location.path());
                $location.path(locationService.current.path + page.Url);
            }
        };
        pm.redirect = function (key, params) {
            var page = pm.pages.Where(function (p) { return p.Key == key && p.Culture == pm.currentPage.Culture; }).First();
            $location.path(locationService.current.path + page.Url);
            $location.url($location.path());
            if (angular.isDefined(params)) {
                Enumerable.From(params).ForEach(function(p) {
                    $location.search(p.key, p.value);
                });
            }
        };

        pm.isRequestingLogin = false;
        pm.requestLogin = function () {
            pm.isRequestingLogin = true;
            $route.reload();
        };


		

        var userHasPageAuthorization = function (page, userModel) {
        	var validateOnePermission = function (page, userModel) {
        		for (var i = 0; i < page.AccessRoles.length; i++) {
        			var pageAccessRole = page.AccessRoles[i];
        			for (var j = 0; j < userModel.identity.accessRoles.length; j++) {
        				var userAccessRole = userModel.identity.accessRoles[j];
						if (pageAccessRole.SecurityContext == userAccessRole.securityContext) {
        					for (var k = 0; k < pageAccessRole.Permissions.length; k++) {
        						if (userAccessRole.permissions.indexOf(pageAccessRole.Permissions[k]) >= 0) {
        							return true;
        						}
        					}
        				}
        			}
        		}

        		//no matching permission
        		return false;
        	};

        	var getUserAccessRole = function (securityContextName, accessRoles) {
		        for (var i = 0; i < accessRoles.length; i++) {
		        	if (accessRoles[i].securityContext == securityContextName) {
				        return accessRoles[i];
			        }
		        }

        		//nothing found
		        return null;
	        };

	        var validateAllPermissions = function (page, userModel) {
		        var valideAccessRoleCount = 0;
		        for (var i = 0; i < page.AccessRoles.length; i++) {
		        	var pageAccessRole = page.AccessRoles[i];

			        var userAccessRole = getUserAccessRole(pageAccessRole.SecurityContext, userModel.identity.accessRoles);
			        if (userAccessRole == null) {
				        return false;
			        } else {
			        	var queryPagePermissions = Enumerable.From(pageAccessRole.Permissions);
			        	var accessRoleIsValid = queryPagePermissions.All(function (pp) {
					        return userAccessRole.permissions.indexOf(pp) >= 0;
			        	});
			        	if (accessRoleIsValid) {
					        valideAccessRoleCount++;
				        }
			        }
		        }

		        return valideAccessRoleCount == page.AccessRoles.length;
	        };


	        if (!page.AccessRoles || page.AccessRoles.length == 0) {
        		return true; //page does not required any security authorisation
        	}

	        if (page.RequireAllPermissions) {
	        	return validateAllPermissions(page, userModel);
	        } else {
		        return validateOnePermission(page, userModel);
	        }

        };

	    $rootScope.$on("$routeChangeStart", function (event, next, current) {
	    	var page;

			//remove a permissions only for text purpose
            //if (authService.model.identity.accessRoles.length) {
            //	authService.model.identity.accessRoles[1].permissions[0] = "";
	    	//}
            
            // redirect to default page
            if (!angular.isDefined(next.params.culture) && !angular.isDefined(next.params.page)) {
                pm.redirectToDefault(cultureManager.defaultCulture.Culture.Code);
                return;
            }

            if (angular.isDefined(next.params.culture) && !angular.isDefined(next.params.page)) {

                // is it a supported language - redirect to default page
                if (cultureManager.isSupportedCulture(next.params.culture)) {
                    pm.redirectToDefault(next.params.culture);
                    return;
                }

                // is a page - redirect to page with default culture
                page = pm.findPageByName(next.params.culture);
                if (angular.isDefined(page)) {
                    pm.redirectToPage(page);
                    return;
                }

                // nothing found redirect to fallback
                pm.redirectToFallback(cultureManager.defaultCulture.Culture.Code);
                return;
            }

            if (angular.isDefined(next.params.culture) && angular.isDefined(next.params.page)) {
            	page = pm.getPageByCultureAndName(next.params.culture, next.params.page);
                if (angular.isDefined(page)) {
                    pm.currentPage = page;

                    if (authService.model.authenticated) {
                        if (authService.model.redirectToCulture && !storageService.session.get('forcedCulture')) {
                            if (next.params.culture != authService.model.identity.user.language) {
                                authService.model.redirectToCulture = false;
                                pm.redirectToCulture(authService.model.identity.user.language);
                                return;
                            }
                        }
                    }
                    
                    cultureManager.changeCulture(cultureManager.getCultureOrNeutral(next.params.culture));
	                if (pm.isRequestingLogin || (page.Authenticate && !authService.model.authenticated) || !userHasPageAuthorization(page, authService.model)) {
		                next.templateUrl = authService.authentication.template;
		                next.controller = authService.authentication.controller;
		                pm.isRequestingLogin = false;
		                return;
	                }

	                if (page.UseSiteRoot) {
                        next.templateUrl = locationService.current.views + page.TemplateUrl;
                    } else {
                        next.templateUrl = page.TemplateUrl;
                    }
                    
                    next.controller = page.Controller;
                   
                    if (!page.IsLogin) {
                        pm.lastPageUrl = $location.url();
                    }

                    utlLogger.log(page.TemplateUrl);

                    $rootScope.$broadcast(pm.PAGECHANGED_EVENTNAME);
                    return;
                } else if (next.params.culture.length == 5) {
                    page = pm.getPageByCultureAndName(next.params.culture.substring(0, 2), next.params.page);
                    if (angular.isDefined(page)) {
                        pm.redirectToPage(page);
                        return;
                    }
                }

                if (cultureManager.isSupportedCulture(next.params.culture)) {
                    pm.redirectToFallback(next.params.culture);
                    return;
                } else {
                    // is a page - redirect to page with default culture
                    page = pm.findPageByName(next.params.culture + "/" + next.params.page);
                    if (angular.isDefined(page)) {
                        pm.redirectToPage(page);
                        return;
                    }
                }

                pm.redirectToFallback(cultureManager.defaultCulture.Culture.Code);
            }
        });
    }]);

