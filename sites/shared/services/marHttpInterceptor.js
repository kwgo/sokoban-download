'use strict';
angular.module('app')
    .factory('marHttpErrorInterceptor', ['$q', '$injector', '$log', function ($q, $injector, $log) {
        return {
        	responseError: function responseError(httpResponse) {
        	    if (httpResponse.status === 500 || (angular.isDefined(httpResponse.data) && httpResponse.data.HasErrors)) {
        	        $log.info("eMAR BACK-END ERROR " + httpResponse.status + "(" + httpResponse.statusText + "):");
        	        $log.info(httpResponse);
        	    }	        
		        return $q.reject(httpResponse);
        	}
        };
    }])
    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.interceptors.push('marHttpErrorInterceptor');
    }]);
