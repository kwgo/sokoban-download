(function (j) {

    j.addScript = function (url) {
        document.write('<script type="text/javascript" src="' + url + '"></' + 'script>');
    };

})(jQuery);

/* THIRD PARTY TOOLS */
$.addScript('scripts/libs/bootstrap/js/bootstrap.min.js');
$.addScript('scripts/libs/linqjs/linq.js');
$.addScript('scripts/libs/jquery-xdomainrequest/jquery.xdomainrequest.min.js');
$.addScript('scripts/libs/jquery-idletimer/idle-timer.min.js');
$.addScript('scripts/libs/jquery-moment/moment-with-locales.min.js');
$.addScript('scripts/libs/jquery-moment/fr-ca.js');
$.addScript('scripts/libs/jquery-moment/en-ca.js');

/* ANGULAR */
$.addScript('scripts/libs/angular/angular.js');
$.addScript('scripts/libs/angular/angular-resource.js');
$.addScript('scripts/libs/angular/angular-route.js');
$.addScript('scripts/libs/angular/angular-sanitize.js');
$.addScript('scripts/libs/angular/angular-touch.js');

/* ANGULAR THIRD PARTY */
$.addScript('scripts/libs/angular-translate/angular-translate.js');
$.addScript('scripts/libs/angular-translate/angular-translate-loader-partial.min.js');
$.addScript('scripts/libs/angular-ui/ui-bootstrap-tpls-0.10.0.min.js');
$.addScript('scripts/libs/angular-dynamic-locale/angular-dynamic-locale.js');
$.addScript('scripts/libs/angular-auto-validate/jcs-auto-validate.js');

/* KENDOUI */
$.addScript('scripts/libs/kendoui/2014.3.1119/js/kendo.all.min.js');
$.addScript('scripts/libs/kendoui/2014.3.1119/js/cultures/kendo.culture.fr.min.js');
$.addScript('scripts/libs/kendoui/2014.3.1119/js/cultures/kendo.culture.fr-CA.min.js');
$.addScript('scripts/libs/kendoui/2014.3.1119/js/cultures/kendo.culture.en.min.js');
$.addScript('scripts/libs/kendoui/2014.3.1119/js/cultures/kendo.culture.en-CA.min.js');