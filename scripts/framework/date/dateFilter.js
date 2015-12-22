'use strict';

angular
    .module('lgi.infra.web.date')
    .filter('datetimeutc', [
        'dateService', function (dateService) { // Displays the date time in UTC formatted like YYYY-MM-DD HH:MM 
        	return function (date) {
        		return dateService.getDisplayDateTimeUtc(date);
        	};
        }
    ])
    .filter('datetimenotimezone', [
    'dateService', function (dateService) { // Displays the date time in UTC formatted like YYYY-MM-DD HH:MM 
        return function (date) {
            return dateService.getDisplayDateTimeNoTimeZone(date);
        };
    }
    ])
    .filter('dateutc', [
        'dateService', function (dateService) { // Displays the date  in UTC formatted like YYYY-MM-DD 
        	return function (date) {
        		return dateService.getDisplayDateUtc(date);
        	};
        }
    ])
    .filter('datenotimezone', [
    'dateService', function (dateService) { // Displays the date  in UTC formatted like YYYY-MM-DD 
        return function (date) {
            return dateService.getDisplayDateNoTimeZone(date);
        };
    }
    ])
	.filter('dateonly', [
        'dateService', function (dateService) { // Displays the date  in UTC formatted like YYYY-MM-DD 
        	return function (date) {
		        return dateService.getDisplayDate(date);
        	};
        }
	])
    .filter('datemonthutc', [
        'dateService', function (dateService) { // Displays the date month in UTC formatted like MMN DD 
        	return function (date) {
        		return dateService.getDisplayDateMonth(date);
        		//if (angular.isDefined(date) && angular.isDate(date)) {

        		//	return  (cultureManager.currentCulture.Culture.Code == 'en') ?
        		//        $locale.DATETIME_FORMATS.SHORTMONTH[date.getUTCMonth()] + ' ' + date.getUTCDate() :
        		//        date.getUTCDate() + ' ' + $locale.DATETIME_FORMATS.SHORTMONTH[date.getUTCMonth()];
        		//} else {
        		//    return "";
        		//}

        	};
        }
    ])
    .filter('shorttimeutc', [
        'dateService', function (dateService) { // Displays the date  in UTC formatted like HH:MM
        	return function (data) {
        		return dateService.getDisplayShortTimeUtc(data);
        	};
        }
    ])
	.filter('longtime', [
        'dateService', function (dateService) { // Displays the date  in UTC formatted like HH:MM
        	return function (data) {
        		return dateService.getDisplayLongTime(data);
        	};
        	}
     ])
	.filter('longtimeutc', [
        'dateService', function(dateService) { // Displays the date  in UTC formatted like HH:MM
			return function(data) {
				return dateService.getDisplayLongTimeUtc(data);
			};
		}
	])
    .filter('hourutc', [
        'dateService', function (dateService) { // Displays the date  in UTC formatted like H h MM
        	return function (data) {
        		return dateService.getDisplayShortTimeUtc(data);
        		//if (angular.isDefined(data) && data != null) {
        		//    if (angular.isDate(data)) { //extract time from date, we may receive a numeric or a date-time
        		//        var time = (data.getUTCHours() * 100) + data.getUTCMinutes();
        		//        data = time;
        		//    }
        		//    var hours = Math.floor(data / 100);
        		//    var minutes = (data % 100);
        		//    return (minutes != 0) ? hours.toString() + 'h' + utlString.padDigits(minutes, 2) : hours.toString() + 'h'; //ex: return 8h30  or 8h  
        		//} else {
        		//    return "";
        		//}
        	};
        }
    ])
    .filter('hour', [
        'dateService', function (dateService) { // Displays the date  in UTC formatted like H h MM
        	return function (data) {
        		return dateService.getDisplayShortTime(data);
        		//if (angular.isDefined(data) && data != null) {
        		//    if (angular.isDate(data)) { //extract time from date, we may receive a numeric or a date-time
        		//        var time = (data.getHours() * 100) + data.getMinutes();
        		//        data = time;
        		//    }
        		//    var hours = Math.floor(data / 100);
        		//    var minutes = (data % 100);
        		//    return (minutes != 0) ? hours.toString() + 'h' + utlString.padDigits(minutes, 2) : hours.toString() + 'h'; //ex: return 8h30  or 8h  
        		//} else {
        		//    return "";
        		//}
        	};
        }
    ])
    .filter('datetime', [
        'dateService', function (dateService) { // Displays the date time formatted like YYYY-MM-DD HH:MM 
        	return function (date) {
        		return dateService.getDisplayDateTime(date);
        		//if (angular.isDefined(date) && angular.isDate(date)) {
        		//    return utlString.padDigits(date.getFullYear(), 4) + '-' +
        		//        utlString.padDigits(date.getMonth() + 1, 2) + '-' + // +1 in month because months are zero based
        		//        utlString.padDigits(date.getDate(), 2) + ' ' +
        		//        utlString.padDigits(date.getHours(), 2) + ':' +
        		//        utlString.padDigits(date.getMinutes(), 2);
        		//} else {
        		//    return "";
        		//}
        	};
        }
    ])
	.filter('hour_h', [
		'dateService', function (dateService) {
			return function (data) {
				return dateService.getDisplayTimeWithHSeperator(data);
			};
		}
	])
	.filter('hourutc_h', [
		'dateService', function (dateService) {
			return function (data) {
				return dateService.getDisplayTimeUtcWithHSeperator(data);
			};
		}
	])
	.filter('datetime_h', [
		'dateService', function (dateService) {
			return function (data) {
				return dateService.getDisplayDateTimeWithHSeparator(data);
			};
		}
	])
	.filter('datetimeutc_h', [
		'dateService', function (dateService) {
			return function (data) {
				return dateService.getDisplayDateTimeUtcWithHSeparator(data);
			};
		}
	]);


