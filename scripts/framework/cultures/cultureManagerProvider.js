'use strict';

angular
    .module('lgi.infra.web.cultures')
    .provider('cultureManager',
    [
        function () {

            this.$get = [
                '$q', '$rootScope', '$locale', '$location', 'utlLogger', '$translate', '$cultures', 'locationService', '$translatePartialLoader', 'tmhDynamicLocale', '$systemParameters', '$timeout',
                function ($q, $rootScope, $locale, $location, utlLogger, $translate, $cultures, locationService, $translatePartialLoader, tmhDynamicLocale, $systemParameters, $timeout) {
                    var cm = this;
                    cm.CHANGED_EVENTNAME = "cultureManager:Changed";

                    cm.isSupportedCulture = function (code) {
                        return cm.supportedCultures.Select(function (c) { return c.Culture.Code; }).Contains(code);
                    };
                    cm.getCultureFromPath = function () {
                        var path = $location.path();
                        path = path.substring(1, path.length);

                        var index = path.indexOf("/");
                        if (index != -1) {
                            path = path.substring(0, index);

                            if (cm.isSupportedCulture(path)) {
                                return cm.supportedCultures.First(function (c) { return c.Culture.Code == path; });
                            }
                        }

                        return null;
                    };
                    cm.getCultureOrNeutral = function (code) {
                        var culture = cm.supportedCultures.Where(function (c) { return c.Culture.Code == code; }).FirstOrDefault();
                        if (angular.isUndefined(culture) && code.length == 5) {
                            culture = cm.supportedCultures.Where(function (c) { return c.Culture.Code == code.substring(0, 2); }).FirstOrDefault();
                        }
                        if (angular.isUndefined(culture)) {
                            utlLogger.warn(code + " don't exist.");
                        }
                        return culture;
                    };
                    cm.getCultureNeutral = function (code) {
                        var culture = null;
                        if (code.length == 2) {
                            culture = cm.supportedCultures.Where(function (c) { return c.Culture.Code == code; }).FirstOrDefault();
                        } else if (code.length == 5) {
                            culture = cm.supportedCultures.Where(function (c) { return c.Culture.Code == code.substring(0, 2); }).FirstOrDefault();
                        }
                        if (angular.isUndefined(culture)) {
                            utlLogger.warn(code + " don't exist.");
                        }
                        return culture;
                    };
                    cm.changeCulture = function (culture) {
                        if (angular.isDefined(culture)) {
                            cm.currentCulture = culture;
                            cm.nextCulture = cm.supportedCultures.First(function (c) { return c != cm.currentCulture; });
                            $translate.use(cm.currentCulture.Culture.Code);
                            //$translate.refresh(cm.currentCulture.Culture.Code);
                            //$translate.refresh();
                            if (kendo) {
                                kendo.culture(cm.currentCulture.Culture.Code);
                            }
                            tmhDynamicLocale.set(cm.currentCulture.Culture.Code);
                            $rootScope.$broadcast(cm.CHANGED_EVENTNAME);
                        }
                    };

                    //#region Resources
                    var deferredCollection = [];
                    
                    var _timeout = null;
                    var useOnce = false;
                    $rootScope.$on('$viewContentLoaded', function () {
                        if (!useOnce) {
                            $translate.use(cm.currentCulture.Culture.Code);
                            useOnce = true;
                        }
                        updateResources();
                    });
                    
                    var updateResources = function() {
                        if (_timeout == null) {
                            _timeout = $timeout(function() {
                             
                                $translate.refresh().then(function () {
                                    for (var name in deferredCollection) {
                                        getDeferred(name).resolve();
                                    }
                                }, function() {
                                    for (var name in deferredCollection) {
                                        getDeferred(name).resolve();
                                    }
                                });
                                _timeout = null;
                            }, 1000);
                        } else {
                            $timeout.cancel(_timeout);
                            _timeout = null;
                            updateResources();
                        }
                    }

                    var getDeferred = function (resourceName) {
                        if (deferredCollection[resourceName] == null) {
                            deferredCollection[resourceName] = $q.defer();
                        }
                        return deferredCollection[resourceName];
                    };

                    cm.resources = {
                        shared: {
                            load: function (resourceName) {
                                var name = locationService.shared.resources + resourceName;
                                var deferred = getDeferred(name);
                                $translatePartialLoader.addPart(name);
                                $translate.refresh();
                                return deferred.promise;
                            }
                        },
                        current: {
                            load: function (resourceName) {
                                var name = locationService.current.resources + resourceName;
                                var deferred = getDeferred(name);
                                $translatePartialLoader.addPart(name);
                                $translate.refresh();
                                return deferred.promise;
                            }
                        },
                        load: function (url) {
                            var deferred = getDeferred(url);
                            $translatePartialLoader.addPart(url);
                            $translate.refresh();
                            return deferred.promise;
                        },
                        translate: function (key) {
                            return $translate.instant(key);
                        }
                    };
                    //#endregion

                    cm.supportedCultures = Enumerable.From($cultures);
                    cm.defaultCulture = cm.getCultureOrNeutral($systemParameters.codeCulture);
                    if (angular.isUndefined(cm.defaultCulture)) {
                        cm.defaultCulture = cm.supportedCultures.First(function (c) { return c.IsDefault; });
                    }
                    cm.currentCulture = cm.getCultureFromPath();
                    if (cm.currentCulture == null) {
                        cm.currentCulture = cm.defaultCulture;
                    }
                    cm.nextCulture = cm.supportedCultures.Where(function (c) { return c.Culture.Code.substring(0, 2) != cm.currentCulture.Culture.Code.substring(0, 2); }).First();
                    //cm.changeCulture(cm.currentCulture);
                   
                    //cm.resources.shared.load('default');
                    return cm;
                }
            ];
        }
    ]);

