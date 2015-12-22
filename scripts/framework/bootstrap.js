function Bootstrap() {
    var bs = this;
    bs.options = {
        appName: "app",
        services: [],
        constants: [],
        onSuccess: [],
        onError: [],
    };
    bs.isInitialized = false;
    bs.isInitialing = false;
    var _services = [];

    bs.setOptions = function (options) {
        angular.extend(bs.options, options);
        _services = [];
        Enumerable.From(bs.options.services).ForEach(function (s) {
            var service = {
                _service: s,
                url: s.path,
                isInitialized: false,
                isError: false,
                loadData: function () {
                    var _this = this;
                    $.ajax({ url: _this.url, crossDomain: true })
                        .success(function (data) {
                            angular.module(_this._service.module).constant(_this._service.constant, data[_this._service.name]);
                            service.isInitialized = true;
                        })
                        .error(function () {
                            service.isError = true;
                        });
                }
            };
            _services.push(service);
        });
        bs.services = Enumerable.From(_services);
    }
    

    var watcherId = null;
    var stopWatcher = function () {
        if (watcherId != null) {
            clearInterval(watcherId);
            watcherId = null;
        }
    };
    var watcher = function (onSuccess, onError) {
        var w = this;
        w.onSuccess = onSuccess;
        w.onError = onError;

        if (watcherId != null) return;

        bs.isInitialing = true;

        watcherId = setInterval(function () {
            if (bs.services.All(function (s) { return s.isError || s.isInitialized; })) {
                stopWatcher();
                bs.isInitialing = false;
                bs.isInitialized = true;

                if (bs.services.All(function (s) { return s.isInitialized; })) {
                    w.onSuccess();
                } else {
                    w.onError();
                }
            }
        }, 100);
    };

    this.init = function () {
        watcher(function () {
            Enumerable.From(bs.options.constants).ForEach(function(c) {
                angular.module(c.module).constant(c.name, c.value);
            });
            var injector = angular.bootstrap($('#' + bs.options.appName), [bs.options.appName]);

            for (var i = 0; i < bs.options.onSuccess.length; i++) {
                bs.options.onSuccess[i](injector);
            }
        }, function() {
            for (var i = 0; i < bs.options.onError.length; i++) {
                bs.options.onError[i]();
            }
        });
        bs.services.ForEach(function (s) { s.loadData(); });
    };
}

(function (w) {
    w.Bootstrap = new Bootstrap();
})(window);
