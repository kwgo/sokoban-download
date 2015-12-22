'use strict';
angular
    .module('lgi.infra.web.date')
    .provider('dateService',
    [ 
        function dateServiceProvider() {
	        var provider = {
        	};

	        this.$get = ["$filter", "$systemParameters", '$locale', "cultureManager",
                function ($filter, $systemParameters, $locale, cultureManager) {
	                var service = {
		                
	                };

                	/******************* This section of code is a copy form angular.js source code  which validate and convert a string to date******************/
	                var int = function(str) {
	                	return parseInt(str, 10);
	                }

	                var R_ISO8601_STR = /^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(Z|([+-])(\d\d):?(\d\d))?)?$/;
                	// 1        2       3         4          5          6          7          8  9     10      11
	                var jsonStringToDate = function (string) {
	                	var match;
	                	if (match = string.match(R_ISO8601_STR)) {
	                		var date = new Date(0),
								tzHour = 0,
								tzMin = 0,
								dateSetter = match[8] ? date.setUTCFullYear : date.setFullYear,
								timeSetter = match[8] ? date.setUTCHours : date.setHours;

	                		if (match[9]) {
	                			tzHour = int(match[9] + match[10]);
	                			tzMin = int(match[9] + match[11]);
	                		}
	                		dateSetter.call(date, int(match[1]), int(match[2]) - 1, int(match[3]));
	                		var h = int(match[4] || 0) - tzHour;
	                		var m = int(match[5] || 0) - tzMin;
	                		var s = int(match[6] || 0);
	                		var ms = Math.round(parseFloat('0.' + (match[7] || 0)) * 1000);
	                		timeSetter.call(date, h, m, s, ms);
	                		return date;
	                	}
	                	return string;
	                }
                	/******************end of copy form angular.js source code******************/

	                var tryParseDate = function(value) {

	                	var valueIsDate = false;
		                var dateValue = null;
		                if (angular.isDefined(value) && angular.isDate(value)) {
		                	valueIsDate = true;
		                	dateValue = value;
		                }
		                else if (angular.isDefined(value) && angular.isString(value) && angular.isDate(dateValue = jsonStringToDate(value))) {
		                	valueIsDate = true;
		                }

		                return {
		                	isDate: valueIsDate,
		                	Date: dateValue
		                };
	                
	                };


	                var tryConvertToUtcDate = function (date) {
	                	var dateValue = tryParseDate(date);
	                	if (dateValue.isDate) {
			                var d = dateValue.Date;
			                //in angular 1.3.3 instead of calculating the utcDate we can just use : $filter('date')(utcDate, "yyyy/MM/dd", 'UTC'). In angular 1.2.X, the ", 'UTC'" parameter do not work
			                var utcDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
			                return utcDate;
	                	}
	                	else {
	                		return date;
		                }
	                };

	                var convertDotNetFormatToAngularFormat = function (format) {
	                	return format.replace("tt", "a");
	                };

	                var getDateFromInt = function(date) {
	                	var hours = Math.floor(date / 100);
	                	var minutes = (date % 100);
	                	var d = new Date(1900, 1, 1, hours, minutes, 0, 0);;
		                return d;
	                };

	                var convertDateToString = function (date, format) {
	                	var dateValue = tryParseDate(date);
	                	if (dateValue.isDate) {
                            var newFormat;
		                    if (format.indexOf("/") != -1 && $systemParameters.dateFormatSeparator != "/") {
		                        var re = new RegExp('/', 'g');
		                        newFormat = format.replace(re, $systemParameters.dateFormatSeparator);
		                    } else {
		                        newFormat = format;
		                    }
		                    return $filter('date')(dateValue.Date, newFormat);
	                	} else {
	                		return "";
	                	}
	                };

	                var convertDateOrtimeToString = function (date, format) {
	                	if (angular.isDefined(date)) {
	                		var angularDatetimeFormat = convertDotNetFormatToAngularFormat(format);
	                		var d = (angular.isDate(date) ? date : getDateFromInt(date));
	                		return $filter('date')(d, angularDatetimeFormat);
	                	} else {
	                		return "";
	                	}
	                };

	                service.getDisplayDate = function(date) {
		                return convertDateToString(date, $systemParameters.dateFormat);
	                };

	                service.getDisplayDateUtc = function (date) {
	                	return convertDateToString(date, $systemParameters.dateFormat);
	                };

	                service.getDisplayDateNoTimeZone = function (date) {
	                    return convertDateToString(tryConvertToUtcDate(date), $systemParameters.dateFormat);
	                };

	                service.getDisplayDateTime = function (date) {
	                	var fullFormat = $systemParameters.dateFormat + " " + convertDotNetFormatToAngularFormat($systemParameters.shortTimePattern);
	                	return convertDateToString(date, fullFormat);

	                };

	                service.getDisplayDateTimeUtc = function (date) {
	                	var fullFormat = $systemParameters.dateFormat + " " + convertDotNetFormatToAngularFormat($systemParameters.shortTimePattern);
	                	return convertDateToString(date, fullFormat);
	                };

	                service.getDisplayDateTimeNoTimeZone = function (date) {
	                    var fullFormat = $systemParameters.dateFormat + " " + convertDotNetFormatToAngularFormat($systemParameters.shortTimePattern);
	                    return convertDateToString(tryConvertToUtcDate(date), fullFormat);
	                };
	                
	                service.getDisplayShortTime = function (date) {
	                	return convertDateOrtimeToString(date, $systemParameters.shortTimePattern);
	                };

	                service.getDisplayShortTimeUtc = function (date) {
	                	return convertDateOrtimeToString(date, $systemParameters.shortTimePattern);
	                };

	                service.getDisplayLongTime = function (date) {
	                	return convertDateOrtimeToString(date, $systemParameters.longTimePattern);
	                };

	                service.getDisplayLongTimeUtc = function (date) {
	                	return convertDateOrtimeToString(date, $systemParameters.longTimePattern);
	                };



	                service.getDisplayDateTimeWithHSeparator = function (date) {
	                	var fullFormat = $systemParameters.dateFormat + " HH'h'mm";
	                	return convertDateToString(date, fullFormat);

	                };

	                service.getDisplayDateTimeUtcWithHSeparator = function (date) {
	                	var fullFormat = $systemParameters.dateFormat + " HH'h'mm";
	                	return convertDateToString(tryConvertToUtcDate(date), fullFormat);
	                };

	                service.getDisplayTimeWithHSeperator = function (date) {
	                	return convertDateOrtimeToString(date, "HH'h'mm");
	                };

	                service.getDisplayTimeUtcWithHSeperator = function (date) {
	                	return convertDateOrtimeToString(date, "HH'h'mm");
	                };


                    service.getDisplayDateMonth = function (date) {
                    	var dateValue = tryParseDate(date);
                    	if (dateValue.isDate) {
                            var d = dateValue.Date;
                    		return (cultureManager.currentCulture.Culture.Code == 'en') ?
                    			$locale.DATETIME_FORMATS.SHORTMONTH[d.getMonth()] + ' ' + d.getDate() :
                    			d.getDate() + ' ' + $locale.DATETIME_FORMATS.SHORTMONTH[d.getMonth()];
                    	} else {
                    		return "";
                    	}
                    };

	                //service.getDisplayDateMonth = function (date) {
	                //	var dateValue = tryParseDate(date);
	                //	if (dateValue.isDate) {
			        //        var d = dateValue.Date;
	                //		return (cultureManager.currentCulture.Culture.Code == 'en') ?
					//			$locale.DATETIME_FORMATS.SHORTMONTH[d.getUTCMonth()] + ' ' + d.getUTCDate() :
					//			d.getUTCDate() + ' ' + $locale.DATETIME_FORMATS.SHORTMONTH[d.getUTCMonth()];
	                //	} else {
	                //		return "";
	                //	}
	                //};

	                return service;
                }
            ];
        }
    ]);
