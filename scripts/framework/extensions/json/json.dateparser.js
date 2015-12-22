(function(undefined) {
	if (this.JSON && !this.JSON.dateParser) {
		JSON.useDateParser = function (format) {
			var lFormat = moment.ISO_8601;
			if (typeof format != "undefined") {
			    lFormat = format;
			}
			if (!JSON._parseSaved) {
				JSON._parseSaved = JSON.parse;
				JSON.parse = JSON.parseWithDate;
			    JSON.dateFormat = lFormat;
			}
		};
	    JSON.resetParser = function() {
	    	if (JSON._parseSaved) {
	    		JSON.parse = JSON._parseSaved;
	    		JSON._parseSaved = null;
	    	}
	    };
	    JSON.dateParser = function (key, value) {
	    	if (typeof value === 'string') {
	    		var d = moment(value, JSON.dateFormat, true);
	    		if (d.isValid()) {
	    		    return d.toDate();
	    		}
	    	}
	        return value;
	    };
	    JSON.parseWithDate = function(json) {
	    	var parse = JSON._parseSaved ? JSON._parseSaved : JSON.parse;
	        try {
	            var res = parse(json, JSON.dateParser);
	            return res;
	        } catch (e) {
	        	throw new Error("JSON content could not be parsed");
	        } 
	    };
	}

    // Override JSON stringify for dates so that it returns "localized" ISO-8601 strings
	Date.prototype.toJSON = function () {
	    return moment(this).format('YYYY-MM-DDTHH:mm:ss.SSS');
	};
})();