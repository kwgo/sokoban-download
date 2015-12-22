'use strict';

angular
    .module('lgi.infra.web.utils')
    .service('utlString',
    [
        function () {

            var _this = this;

            /*
             * Returns true if given object is undefined/null/empty,
             * otherwise returns false
             */
            this.isNull = function (obj) {
                return angular.isUndefined(obj);
            };

            /* Returns true if given object is not undefined/null/empty,
             * otherwise returns false
             */
            this.isNotNull = function (obj) {
                return !_this.isNull(obj);
            };

            /*
             * Returns true if any of the following conditions is true:
             * 
             *  - str is null/undefined
             *  - str is not a string
             *  - str length <= 0
             *  - str contains only whitespace
             */
            this.isBlank = function (str) {
                if (angular.isUndefined(str)) {
                    return true;
                }

                if (!angular.isString(str)) {
                    return true;
                }

                if (_this.trim(str).length < 1) {
                    return true;
                }

                return false;
            };

            this.isNotBlank = function (str) {
                return !_this.isBlank(str);
            };

            this.isEmpty = function (str) {
                if (str == "")
                    return true;
                else
                    return false;
            };
            this.isNotEmpty = function (str) {
                return !_this.isEmpty(str);
            };

            /*
             * Returns a trimmed version of str - removes leading/trailing whitespace
             */
            this.trim = function (str) {
                if (str.trim)
                    return str.trim();
                else
                    return str.replace(/(^\s*)|(\s*$)/g, "");
            };

            /*
             * Attempt to parse the given parameter to a boolean, returning true or false.
             * 
             * Any of the following wil return true (case insensitive) : "true", "yes", "1".
             * 
             * Anything else will return false, including null and undefined.
             */
            this.parseBoolean = function (toParse) {
                if (angular.isUndefined(toParse)) {
                    return false;
                }
                var val = toParse.toLowerCase().trim();

                if (val == "true" || val == "yes" || val == "1") {
                    return true;
                }
                return false;
            };

            /*
             * Returns a Date object constructed from [pDate] parameter. [pDate]
             * must be of the following format :
             *
             * 	yyMMdd[hh[mm[ss]]]
             *
             */
            this.toDate = function (pDate) {
                var input = pDate;
                var minLen = 8;
                var y = 0, mo = 0, d = 0, h = 0, mi = 0, s = 0;
                if (input.length < minLen) {
                    throw new Error('Minimal parameter length is [' + minLen + '], got [' + input.length + ']');
                }

                y = input.substring(0, 4);
                mo = input.substring(4, 6);
                d = input.substring(6, 8);

                if (input.length > 8)
                    h = input.substring(8, 10);
                if (input.length > 10)
                    mi = input.substring(10, 12);
                if (input.length > 12)
                    s = input.substring(12);

                return new Date(y, --mo, d, h, mi, s);
            };

            /*
             * Formats the given [xml] parameter and returns
             * it with proper line returns and identation.
             */
            this.formatXml = function (xml) {
                var reg = /(>)(<)(\/*)/g;
                var wsexp = / *(.*) +\n/g;
                var contexp = /(<.+>)(.+\n)/g;
                xml = xml.replace(reg, '$1\n$2$3').replace(wsexp, '$1\n').replace(contexp, '$1\n$2');
                var pad = 0;
                var formatted = '';
                var lines = xml.split('\n');
                var indent = 0;
                var lastType = 'other';
                // 4 types of tags - single, closing, opening, other (text, doctype, comment) - 4*4 = 16 transitions
                var transitions = {
                    'single->single': 0,
                    'single->closing': -1,
                    'single->opening': 0,
                    'single->other': 0,
                    'closing->single': 0,
                    'closing->closing': -1,
                    'closing->opening': 0,
                    'closing->other': 0,
                    'opening->single': 1,
                    'opening->closing': 0,
                    'opening->opening': 1,
                    'opening->other': 1,
                    'other->single': 0,
                    'other->closing': -1,
                    'other->opening': 0,
                    'other->other': 0
                };

                for (var i = 0; i < lines.length; i++) {
                    var ln = lines[i];
                    var single = Boolean(ln.match(/<.+\/>/)); // is this line a single tag? ex. <br />
                    var closing = Boolean(ln.match(/<\/.+>/)); // is this a closing tag? ex. </a>
                    var opening = Boolean(ln.match(/<[^!].*>/)); // is this even a tag (that's not <!something>)
                    var type = single ? 'single' : closing ? 'closing' : opening ? 'opening' : 'other';
                    var fromTo = lastType + '->' + type;
                    lastType = type;
                    var padding = '';

                    indent += transitions[fromTo];
                    for (var j = 0; j < indent; j++) {
                        padding += '    ';
                    }

                    formatted += padding + ln + '\n';
                }

                return formatted;
            };

            this.padDigits = function(number, digits) {
                return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
            };

            this.empty = function () {
                return '';
            };
            //normalize a string for sorting (replace accent)
            this.normalize = function (str) {
                var diacritics = [
                    /[\300-\306]/g, /[\340-\346]/g,  // A, a
                    /[\310-\313]/g, /[\350-\353]/g,  // E, e
                    /[\314-\317]/g, /[\354-\357]/g,  // I, i
                    /[\322-\330]/g, /[\362-\370]/g,  // O, o
                    /[\331-\334]/g, /[\371-\374]/g,  // U, u
                    /[\321]/g, /[\361]/g, // N, n
                    /[\307]/g, /[\347]/g // C, c
                ];

                var chars = ['A', 'a', 'E', 'e', 'I', 'i', 'O', 'o', 'U', 'u', 'N', 'n', 'C', 'c'];

                if (str != null ) {
                    for (var i = 0; i < diacritics.length; i++) {
                        str = str.replace(diacritics[i], chars[i]);
                    }
                    return str.toUpperCase();

                } else {
                    return str;
                }


            };

        }]);