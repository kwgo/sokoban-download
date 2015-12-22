'use strict';

//
// An AngularJS service to display popup views.
// 
// This service provides basic implementations (info, warning, error, confirm and login). The service 
// MUST be configured using the setViewPaths method, typically in an AngularJS config() block.
//
// Custom views may be used through the modal() method.
//
// TODO: This service has to be localized in the proper fashion. The default labels are currently english only.
//
angular
    .module('lgi.infra.web.popup')
    .provider('popupService',
    [
        'locationServiceProvider',
        function (locationServiceProvider) {
       
            // The default view paths
            var viewPaths = {
                info: undefined,
                warn: undefined,
                error: undefined,
                confirm: undefined,
                login: undefined,
                frame: undefined
            };

            // This service need to be configured (typically in an 
            // AngularJS config() block), using this method
            this.setViewPaths = function (obj) {
                viewPaths = angular.extend(viewPaths, obj);
            };

            this.setViewPaths({
                info: locationServiceProvider.framework.root + 'popup/views/info.html',
                warn: locationServiceProvider.framework.root + 'popup/views/warning.html',
                error: locationServiceProvider.framework.root + 'popup/views/error.html',
                confirm: locationServiceProvider.framework.root + 'popup/views/confirm.html',
                login: locationServiceProvider.framework.root + 'popup/views/login.html',
                frame: locationServiceProvider.framework.root + 'popup/views/frame.html',
            });

            // The service definition
            function Popup($q, $modal, viewPathsCfg) {
                var _self = this;

                // The $modal invokation
                var showPopup = function (cfg) {
                    return $modal.open(cfg).result;
                };

                this.popup = function (cfg, popupConfig) {
                    var popupOpts = angular.extend({
                        title: '',
                        content: '',
                        closeBtnText: 'Close',
                        modal: undefined,
                        size: undefined
                    },
                       cfg
                   );
                    var popupCfg = {
                        templateUrl: viewPathsCfg.info,
                        controller: function ($scope, $modalInstance, opts) {
                            $scope.opts = opts;
                            $scope.onClose = function () {
                                $modalInstance.dismiss('close');
                            }
                        },
                        resolve: {
                            opts: function () {
                                return popupOpts;
                            }
                        },
                        backdrop: angular.isDefined(cfg.modal) && angular.equals(cfg.modal, true) ? 'static' : 'true',
                        size: angular.isDefined(cfg.size) && (angular.equals(cfg.size, 'sm') || angular.equals(cfg.size, 'lg')) ? cfg.size : undefined
                    };
                    if (angular.isDefined(popupConfig)) {
                        angular.extend(popupCfg, popupConfig);
                    }
                    return showPopup(popupCfg);
                };

                this.frame = function (cfg) {
                    var popupOpts = angular.extend({
                        title: 'Log In',
                        url: '',
                        closeBtnText: 'Close'
                    },
                        cfg
                    );
                    var popupCfg = {
                        templateUrl: viewPathsCfg.frame,
                        controller: function ($scope, $modalInstance, $sce, opts) {
                            $scope.opts = opts;
                            $scope.opts.url = $sce.trustAsResourceUrl($scope.opts.url);
                            $scope.onClose = function () {
                                if (opts.onClose) {
                                    opts.onClose();
                                }
                                $modalInstance.close('close');
                                
                            }
                            $scope.callback = function (obj) {
                                if (opts.onCallback) {
                                    opts.onCallback();
                                }
                                $modalInstance.close(obj);
                            };
                            window.popup = {};
                            window.popup.callback = $scope.callback;
                        },
                        resolve: {
                            opts: function () {
                                return popupOpts;
                            }
                        },
                        backdrop: angular.isDefined(cfg.modal) && angular.equals(cfg.modal, true) ? 'static' : 'true',
                        size: angular.isDefined(cfg.size) && (angular.equals(cfg.size, 'sm') || angular.equals(cfg.size, 'lg')) ? cfg.size : undefined
                    };
                    return showPopup(popupCfg);
                };


                // Displays an information popup containing a title, a message and a single
                // close button. This method returns a promise. The cfg parameters have
                // the following attributes:
                //
                // - title: the popup's title (defaults to 'Information')
                // - content: the popup's content (defaults to an empty text)
                // - closeBtnText: the popup's close button text (defaults to 'Close')
                // - modal: a flag indicating if popup should be modal (defaults to false)
                // - size: the size of the modal instance ('sm' => small, 'lg' => large, '' (empty/undefined) => medium)
                //
                this.info = function (cfg) {
                    var popupOpts = angular.extend({
                            title: 'Information',
                            content: '',
                            closeBtnText: 'Close'
                        },
                        cfg
                    );
                    var popupCfg = {
                        templateUrl: viewPathsCfg.info,
                        controller: function ($scope, $modalInstance, opts) {
                            $scope.opts = opts;
                            $scope.onClose = function () {
                                $modalInstance.dismiss('close');
                            }
                        },
                        resolve: {
                            opts: function () {
                                return popupOpts;
                            }
                        },
                        backdrop: angular.isDefined(cfg.modal) && angular.equals(cfg.modal, true) ? 'static' : 'true',
                        size: angular.isDefined(cfg.size) && (angular.equals(cfg.size, 'sm') || angular.equals(cfg.size, 'lg')) ? cfg.size : undefined
                    };
                    return showPopup(popupCfg);
                };

                // Displays an warning popup containing a title, a message and a single
                // close button. This method returns a promise. The cfg parameters have
                // the following attributes:
                //
                // - title: the popup's title (defaults to 'Warning')
                // - content: the popup's content (defaults to an empty text)
                // - closeBtnText: the popup's close button text (defaults to 'Close')
                // - modal: a flag indicating if popup should be modal (defaults to false)
                // - size: the size of the modal instance ('sm' => small, 'lg' => large, '' (empty/undefined) => medium)
                //
                this.warn = function (cfg) {
                    var popupOpts = angular.extend({
                            title: 'Warning',
                            content: '',
                            closeBtnText: 'Close',
                            modal: undefined,
                            size: undefined
                        },
                        cfg
                    );
                    var popupCfg = {
                        templateUrl: viewPathsCfg.warn,
                        controller: function ($scope, $modalInstance, opts) {
                            $scope.opts = opts;
                            $scope.onClose = function () {
                                $modalInstance.dismiss('close');
                            }
                        },
                        resolve: {
                            opts: function () {
                                return popupOpts;
                            }
                        },
                        backdrop: angular.isDefined(cfg.modal) && angular.equals(cfg.modal, true) ? 'static' : 'true',
                        size: angular.isDefined(cfg.size) && (angular.equals(cfg.size, 'sm') || angular.equals(cfg.size, 'lg')) ? cfg.size : undefined
                    };
                    return showPopup(popupCfg);
                };

                // Displays an error popup containing a title, a message and a single
                // close button. This method returns a promise. The cfg parameters have
                // the following attributes:
                //
                // - title: the popup's title (defaults to 'Error')
                // - content: the popup's content (defaults to an empty text)
                // - closeBtnText: the popup's close button text (defaults to 'Close')
                // - modal: a flag indicating if popup should be modal (defaults to false)
                // - size: the size of the modal instance ('sm' => small, 'lg' => large, '' (empty/undefined) => medium)
                //
                this.error = function (cfg) {
                    var popupOpts = angular.extend({
                            title: 'Error',
                            content: '',
                            closeBtnText: 'Close'
                        },
                        cfg
                    );
                    var popupCfg = {
                        templateUrl: viewPathsCfg.error,
                        controller: function ($scope, $modalInstance, opts) {
                            $scope.opts = opts;
                            $scope.onClose = function () {
                                $modalInstance.dismiss('close');
                            }
                        },
                        resolve: {
                            opts: function () {
                                return popupOpts;
                            }
                        },
                        backdrop: angular.isDefined(cfg.modal) && angular.equals(cfg.modal, true) ? 'static' : 'true',
                        size: angular.isDefined(cfg.size) && (angular.equals(cfg.size, 'sm') || angular.equals(cfg.size, 'lg')) ? cfg.size : undefined
                    };
                    return showPopup(popupCfg);
                };

                // Displays an error popup containing a title, a message and a pair of Yes/No 
                // buttons. This method returns a promise. The cfg parameters have the following 
                // attributes:
                //
                // - title: the popup's title (defaults to 'Confirmation')
                // - content: the popup's content (defaults to an empty text)
                // - actionBtnText: the popup's 'Yes' button text (defaults to 'Yes')
                // - closeBtnText: the popup's 'No' button text (defaults to 'No')
                // - modal: a flag indicating if popup should be modal (defaults to false)
                // - size: the size of the modal instance ('sm' => small, 'lg' => large, '' (empty/undefined) => medium)
                //            
                this.confirm = function (cfg) {
                    var popupOpts = angular.extend({
                            title: 'Confirmation',
                            content: '',
                            actionBtnText: 'Yes',
                            actionBtnShow: true,
                            closeBtnText: 'No',
                            closeBtnShow: true,
                            cancelBtnText: null,
                            cancelBtnShow: true
                        },
                        cfg
                    );
                    var popupCfg = {
                        templateUrl: viewPathsCfg.confirm,
                        controller: function ($scope, $modalInstance, opts) {
                            $scope.opts = opts;
                            $scope.onAction = function () {
                                if (angular.isFunction(opts.onAction)) {
                                    $q.when(opts.onAction()).then(function() {
                                        $modalInstance.close(true);
                                    });
                                } else {
                                    $modalInstance.close(true);
                                }
                            };
                            $scope.onClose = function() {
                                if (opts.onClose) {
                                    opts.onClose();
                                }
                                $modalInstance.close(false);
                            };
                            $scope.onCancel = function () {
                                if (opts.onCancel) {
                                    opts.onCancel();
                                }
                                $modalInstance.close(false);
                            };
                        },
                        resolve: {
                            opts: function () {
                                return popupOpts;
                            }
                        },
                        backdrop: angular.isDefined(cfg.modal) && angular.equals(cfg.modal, true) ? 'static' : 'true',
                        size: angular.isDefined(cfg.size) && (angular.equals(cfg.size, 'sm') || angular.equals(cfg.size, 'lg')) ? cfg.size : undefined,
                        keyboard: false
                    };
                    return showPopup(popupCfg);
                };

                // Displays a login popup containing a username input field, a password 
                // input field and a pair of Login/Cancel buttons. This method returns 
                // a promise. The login popup allows presetting a user in context.
                //
                // The cfg parameters have the following attributes:
                //
                // - title: the popup's title (defaults to 'Confirmation')
                // - usernameText: the popup's username field label (defaults to 'Username')
                // - passwordText: the popup's password field label (defaults to 'Password')
                // - notYouText: the label used to allow user change in the case a user is prepopulated in modal login
                // - actionBtnText: the popup's login button text (defaults to 'Login')
                // - closeBtnText: the popup's cancel button text (defaults to 'Cancel')
                // - modal: a flag indicating if popup should be modal (defaults to false)
                // - size: the size of the modal instance ('sm' => small, 'lg' => large, '' (empty/undefined) => medium)
                //   
                this.login = function (cfg) {
                    var popupOpts = angular.extend({
                            title: 'Login',
                            usernameText: 'Username',
                            passwordText: 'Password',
                            actionBtnText: 'Login',
                            closeBtnText: 'Cancel',
                            notYouText: 'not you?',
                            user: undefined
                        },
                        cfg
                    );
                    var popupCfg = {
                        templateUrl: viewPathsCfg.login,
                        controller: function ($scope, $modalInstance, opts) {
                            $scope.opts = opts;
                            $scope.showNotYou = angular.isDefined($scope.opts.user) && angular.isDefined($scope.opts.user.username);
                            $scope.user = angular.extend({ username: '', password: '' }, $scope.opts.user);
                            $scope.onAction = function () {
                                $modalInstance.close($scope.user);
                            };
                            $scope.onClose = function () {
                                $modalInstance.dismiss('cancel');
                            }
                            $scope.showNotYouLink = function () {
                                return $scope.showNotYou;
                            };
                            $scope.onNotYou = function () {
                                $scope.user = {
                                    username: undefined,
                                    password: undefined
                                };
                                $scope.showNotYou = false;
                            };
                        },
                        resolve: {
                            opts: function () {
                                return popupOpts;
                            }
                        },
                        backdrop: angular.isDefined(cfg.modal) && angular.equals(cfg.modal, true) ? 'static' : 'true',
                        size: angular.isDefined(cfg.size) && (angular.equals(cfg.size, 'sm') || angular.equals(cfg.size, 'lg')) ? cfg.size : undefined
                    };
                    return showPopup(popupCfg);
                };
                
                return {
                    info: _self.info,
                    warn: _self.warn,
                    error: _self.error,
                    confirm: _self.confirm,
                    login: _self.login,
                    modal: _self.modal,
                    frame: _self.frame,
                    popup: _self.popup
                }
            };

            this.$get = [
                '$q',
                // This service depends on angular-ui's $modal service
                '$modal',
                // Service creation
                function ($q, $modal) {
                    return new Popup($q, $modal, viewPaths);
                }
            ];
        }
    ]);