'use strict';
angular
    .module('lgi.infra.web.notifications')
    .provider('notificationService',
    [
        function notificationServiceProvider() {
	        var provider = {
	            httpErrors: [],
                debug: false,
		        displayOptions: {
			        allowHideAfter: 0,
			        width: 400,
			        appendTo: null,
			        autoHideAfter: 0,
			        hideOnClick: true,
			        stacking: 'default',
			        position: {
				        top: 20,
				        left: null,
				        bottom: null,
				        right: 30
			        }
		        },
		        templates: [
				        { type: "error",		remoteTemplate: "scripts/framework/notifications/views/error.html" },
				        { type: "info",			remoteTemplate: "scripts/framework/notifications/views/info.html" },
				        { type: "success",		remoteTemplate: "scripts/framework/notifications/views/success.html" },
				        { type: "warning",		remoteTemplate: "scripts/framework/notifications/views/warning.html" },
				        { type: "exception",	remoteTemplate: "scripts/framework/notifications/views/exception.html" }
		        ]
        	};

            this.setDebug = function(enabled) {
                provider.debug = enabled;
            };
	        this.setHttpError = function (httpCode, method) {
		        provider.httpErrors.push({ error: httpCode, method: method });
	        };

	        this.setAutoHideAfter = function (millisecond) {
	            provider.displayOptions.autoHideAfter = millisecond;
            };

	        this.setPosition = function(position) {
	        	provider.displayOptions.position = position;
	        };

	        this.setTemplate = function (data) {
				var template = Enumerable.From(provider.templates).FirstOrDefault(null, "$.type == '" + data.type + "'");
				if (!template) {
	        		template = { type: data.type };
	        		provider.templates.push(template);
		        }

	        	template.template = data.template;
	        	template.remoteTemplate = data.remoteTemplate;
	        };

	        this.setWidth = function (width) {
	        	provider.displayOptions.width = width;
	        };

	        this.setHeight = function (height) {
	        	provider.displayOptions.height = height;
	        };

	        this.setHideOnClick = function (hideOnClick) {
	        	provider.displayOptions.hideOnClick = hideOnClick;
	        };
	        


	        this.$get = ['$q', '$injector', '$http', '$templateCache', 'locationService', 'cultureManager',
                function ($q, $injector, $http, $templateCache, locationService, cultureManager) {
	                var service = {
		                notificatinoWidget: null,
		                widgetOption: null
					};

                	var enumarableTemplate = Enumerable.From(provider.templates);

	                var createNotificationWidget = function() {
	                	if (service.notificatinoWidget == null) {
	                		service.notificatinoWidget = $("<div></div>").kendoNotification().data("kendoNotification");
	                		service.widgetOption = angular.copy(provider.displayOptions);
	                		service.widgetOption.templates = [];
	                		service.notificatinoWidget.setOptions(service.widgetOption);
		                }
	                };

	                var createNotification = function (type) {
	                	var deferred = $q.defer();
	                	createNotificationWidget();

		                var templateAlreadyloaded = Enumerable.From(service.notificatinoWidget.templates).Any("$.type == '" + type + "'");
		                if (templateAlreadyloaded) {
			                deferred.resolve();
		                } else {
			                var templateData = enumarableTemplate.FirstOrDefault(null, "$.type == '" + type + "'");
			                if (!templateData) {
			                	deferred.reject("Undefined template type : " + type);
			                } else if (!templateData.template && !templateData.remoteTemplate) {
			                	deferred.reject("template or remoteTemplate is required");
			                } else if (templateData.template) {
			                	service.widgetOption.templates.push(templateData);
			                	service.notificatinoWidget.setOptions(service.widgetOption);
			                	deferred.resolve();
			                } else {
				                $http.get(templateData.remoteTemplate, { cache: $templateCache })
					                .success(function(data) {
						                try {
							                templateData.template = data;
							                service.widgetOption.templates.push(templateData);
							                service.notificatinoWidget.setOptions(service.widgetOption);
							                deferred.resolve();
						                } catch (e) {
							                deferred.reject(e.stack);
						                }
					                }).error(function () {
						                deferred.reject("error getting template at " + templateData.remoteTemplate);
					                });
			                }
		                }
		                return deferred.promise;
	                };

                	
	                service.hasDefinedHttpError = function (errorCode) {
	                	return Enumerable.From(provider.httpErrors).Any("$.error == " + errorCode);
	                };

                	service.executeHttpError = function (errorCode, httpResponse) {
	                	var fn = Enumerable.From(provider.httpErrors).Single("$.error == " + errorCode).method;
	                	$injector.invoke(fn, null, { httpResponse: httpResponse });
	                };

                	service.exception = function (exception) {
		                try {
			                createNotification("exception")
				                .then(function () {
				                    try {
                                        if (provider.debug) {
                                            service.notificatinoWidget.show({ title: cultureManager.resources.translate('NOTIFICATIONEXCEPTIONTITLE'), message: exception }, "exception");
                                        } else {
                                            service.notificatinoWidget.show({
                                                title: cultureManager.resources.translate('NOTIFICATIONEXCEPTIONTITLE'),
                                                message: cultureManager.resources.translate('NOTIFICATIONEXCEPTIONMESSAGE')
                                            }, "exception");   
                                        }
					                } catch (e) {
					                	console.log(e.stack);
					                }
				                },
					                function (error) {
						                console.log(error);
					                }
				                );
		                } catch (e) {
		                	console.log(e.stack);
		                }
	                };

                	var showNotification = function (type, data) {
                		createNotification(type)
							.then(function () {
								service.notificatinoWidget.show(data, type);
							},
					            function (error) { console.log(error); }
				            );
	                };

	                service.info = function (data) {
		                showNotification("info", data);
	                };

	                service.success = function (data) {
	                	showNotification("success", data);
	                };

	                service.warning = function (data) {
	                	showNotification("warning", data);
	                };

	                service.error = function (data) {
	                	showNotification("error", data);
	                };

	                service.hide = function () {
	                    if (service.notificatinoWidget != null) {
	                        service.notificatinoWidget.hide();
	                    }
                    };

	                service.errorFetchingExceptionRemoteTemplate = function(httpResponse) {
	                	var templateData = enumarableTemplate.FirstOrDefault(null, "$.type == 'exception'");
		                return httpResponse.status == 404 && httpResponse.config.url.indexOf(templateData.remoteTemplate) >= 0;
	                };

	                return service;
                }
            ];
        }
    ]);


//exception handler
angular.module("lgi.infra.web.notifications").config(function ($provide) {
	$provide.decorator("$exceptionHandler", ['$delegate', '$injector', function ($delegate, $injector) {
		return function (exception, cause) {
		    var notificationService = $injector.get("notificationService");
		    if (exception.stack) {
		        notificationService.exception(exception.stack);
		    } else {
		        notificationService.exception(exception);
		    }
			$delegate(exception, cause);
		};
	}]);
});


//http handler
angular.module('lgi.infra.web.notifications')
    .factory('errorHttpInterceptor', ['$q', '$injector', function ($q, $injector) {
        return {
        	responseError: function responseError(httpResponse) {
		        var notificationService = $injector.get("notificationService");
        		if (notificationService.errorFetchingExceptionRemoteTemplate(httpResponse)) {
        			console.log("Cannot find the remote notification exception template. Remote Exeption http response is :");
			        console.log(httpResponse);
		        } else {
		        	if (notificationService.hasDefinedHttpError(httpResponse.status)) {
		        		notificationService.executeHttpError(httpResponse.status, httpResponse);
		        	} else {
		        	    if (httpResponse.status === 500) {
		        	        notificationService.exception(httpResponse.statusText + "(" + httpResponse.status + ") : " + httpResponse.config.method + ":" + httpResponse.config.url);
			            }
		        	}
		        }
		        
		        return $q.reject(httpResponse);
            }
        };
    }])
    .config(['$httpProvider', function ($httpProvider) {
    	$httpProvider.interceptors.push('errorHttpInterceptor');
    }]);