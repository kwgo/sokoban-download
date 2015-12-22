'use strict';
angular
    .module('lgi.infra.web.locations')
    .provider('locationService',
    [
        '$currentLocation',
        function ($currentLocation) {
            var local = this;

            local.name = $currentLocation.name;
            local.api = "api/";


            local.shared = {};
            local.shared.root = "sites/shared/";
            local.shared.resources = local.shared.root + "i18n/";
            local.shared.views = local.shared.root + "views/";
            local.shared.css = local.shared.root + "css/";
            local.shared.directives = local.shared.root + "directives/";
            local.shared.images = local.shared.root + "img/";
            local.shared.models = local.shared.root + "models/";
            local.shared.services = local.shared.root + "services/";
            local.shared.controllers = local.shared.root + "controllers/";

            local.current = {};


            if ($currentLocation.rootPath == "/") {
                local.current.path = "/";
                local.root = "";
            } else {
                local.current.path = "/" + local.name + "/";
                local.root = $currentLocation.rootPath.substring(0, $currentLocation.rootPath.length - 1);
            }

            local.current.root = "sites/" + local.name + "/";
            local.current.resources = local.current.root + "i18n/";
            local.current.views = local.current.root + "views/";
            local.current.css = local.current.root + "css/";
            local.current.images = local.current.root + "img/";
            local.current.models = local.current.root + "models/";
            local.current.services = local.current.root + "services/";
            local.current.controllers = local.current.root + "controllers/";

            local.framework = {};
            local.framework.scripts = "scripts/";
            local.framework.root = local.framework.scripts + "framework/";

            local.framework.views = local.framework.root + "views/";
            local.framework.viewUrls = {
                history: local.framework.views + "history.html"
            }


            this.$get = [
                function () {
                    return local;
                }
            ];
        }
    ]);