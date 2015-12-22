'use strict';
angular
    .module('lgi.infra.web.entrepriseServices', [
        'lgi.infra.web.entrepriseServices.administration.ldap'
    ])
    .config(function ($injector) {
        try {
            var t = $injector.get('$systemParameters');
        } catch (e) {
            angular.module('lgi.infra.web.framework').constant('$systemParameters', {
                "defaultSkinName": "The Asphalt World",
                "envIdentification": "Development",
                "codeCulture": "en",
                "sessionExpirationDelay": 20,
                "isMultipleProfile": true,
                "defaultCriteriaPageSize": 100,
                "isDateFormat": true,
                "dateFormat": "MM/dd/yyyy",
                "dateFormatSeparator": "/",
                "envIdentificationSL": "Scheduling Development (EN)",
                "codeCultureSL": "fr",
                "isUserLayoutActive": true,
                "isReportServiceActive": true,
                "reportServiceUrl": "http://wdevsia4/ReportServer_livrable/ReportService2010.asmx",
                "reportServiceUrlSL": "http://wdevsia4/ReportServer_livrable/ReportService2010.asmx",
                "reportServiceFolder": "/Centre de rapports SIA",
                "reportServiceFolderSL": "/Centre de rapports SIA",
                "isActivateUserOnCreation": true,
                "shortTimePattern": "HH:mm",
                "longTimePattern": "HH:mm:ss"
            });
        }
    });
$.addScript('scripts/framework/entrepriseServices/entrepriseServicesProvider.js');
$.addScript('scripts/framework/entrepriseServices/administration/ldap/ldapModule.js');
