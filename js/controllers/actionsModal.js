'use strict';

/**
 * Actions Controller for modal window.
 * Realize actions for modal windows.
 */
mainApp.controller('ActionsModalController', ['$scope', '$filter', '$rootScope', 'gdisk', '$mdDialog', '$mdToast', 'Drive', '$sce',
    function($scope, $filter, $rootScope, gdisk, $mdDialog, $mdToast, Drive, $sce) {

        var originatorEv;

        /**
         * Close modal window
         */
        $scope.close = function(){
            $mdDialog.cancel();
        };

        /**
         * Show folder/file link in popup
         * @param ev
         */
        $scope.link = {
            'open': function($event){
                if($rootScope.selected){
                    originatorEv = $event;
                    $mdDialog.show(
                        {
                            controller: 'ActionsModalController',
                            templateUrl: '/js/views/dialogs/link.html',
                            parent: angular.element(document.body),
                            targetEvent: originatorEv,
                            clickOutsideToClose:true,
                            fullscreen: false
                        }
                    );
                    originatorEv = null;
                }
                $rootScope.$broadcast('closeContext');
                $event.stopPropagation();
            }
        };

        /**
         * show rename item modal
         * @param ev
         */
        $scope.rename = {
            'open':function($event){
                if($rootScope.selected){
                    originatorEv = $event;
                    $mdDialog.show(
                        {
                            controller: 'ActionsModalController',
                            templateUrl: '/js/views/dialogs/rename.html',
                            parent: angular.element(document.body),
                            targetEvent: originatorEv,
                            clickOutsideToClose:true,
                            fullscreen: false
                        }
                    );
                    originatorEv = null;
                }
                $rootScope.$broadcast('closeContext');
                $event.stopPropagation();
            },
            'confirm':function(){

                $mdDialog.cancel(); // close modal
                $rootScope.startLoadingAnimation();

                if($rootScope){
                    if($rootScope.selected['parent']){
                        gdisk.folder.rename($rootScope.selected);
                    }
                    if($rootScope.selected['folder']){
                        gdisk.file.rename($rootScope.selected);
                    }
                }
            }
        };

        /**
         * Show move modal
         */
        $scope.move = {
            'open':function(folder,$event){

                $rootScope.folderToMoveTo = false;
                $rootScope.folderToMove = folder;

                $rootScope.folders = gdisk.folder.childs(folder.id);

                $rootScope.oldParent = (folder.parent || folder.parent == 0) ? folder.parent : folder.folder;

                $mdDialog.show(
                    {
                        controller: 'ActionsController',
                        templateUrl: '/js/views/dialogs/move.html',
                        parent: angular.element(document.body),
                        targetEvent: originatorEv,
                        clickOutsideToClose:true,
                        fullscreen: false
                    }
                );

                originatorEv = null;

                $event.stopPropagation();
                $rootScope.$broadcast('closeContext');
            },
            'confirm':function(){
                $mdDialog.cancel(); // close modal
                Drive.insertParents($rootScope.folderToMove.id,{'id':$rootScope.folderToMoveTo});
            },
            'copy':function(file){
                $scope.startLoadingAnimation();
                gdisk.file.copy(file);
            }
        };

        /**
         * Access managment
         * @type {{}}
         */
        $scope.permissions = {
            'open':function($event){
                if($rootScope.selected){

                    originatorEv = $event;
                    $mdDialog.show(
                        {
                            controller: 'ActionsModalController',
                            templateUrl: '/js/views/dialogs/rights.html',
                            parent: angular.element(document.body),
                            targetEvent: originatorEv,
                            clickOutsideToClose:true,
                            fullscreen: false
                        }
                    );

                    gdisk.permissions.load($rootScope.selected['id']);
                    originatorEv = null;
                    $rootScope._toInvite = [];

                    gdisk.permissions.list = [];
                    gdisk.permissions.invites = [];
                    gdisk.permissions.removes = [];

                }
                $rootScope.$broadcast('closeContext');
                $event.stopPropagation();
            },
            'confirm':function($event){

                if($rootScope.selected['parent'] || $rootScope.selected['folder'] ){
                    $rootScope.startLoadingAnimation();
                    $mdDialog.cancel();
                    gdisk.permissions.list = $rootScope.selected.permissions;
                    gdisk.permissions.file = $rootScope.selected['id'];
                    gdisk.permissions.update();
                }

                $event.stopPropagation();
            },
            'invite':function($chip){
                gdisk.permissions.invites.push($chip);
                return $chip;
            },
            'remove_invite':function($chip,$index){
                var c = gdisk.permissions.invites.indexOf($chip);
                delete gdisk.permissions.invites[c];
                gdisk.permissions.invites.length--;
            },
            'remove':function(permission){
                permission['deleted'] = true;
                gdisk.permissions.removes.push(permission);
            },
            'share':function(){
                gdisk.permissions.share = $rootScope.selected.is_permission_by_link;
            }
        };

        /**
         * New folder from context menu
         * @type {{open: Function, confirm: Function}}
         */
        $scope.create = {

            'folder': false,

            'open' : function(){

                $rootScope.parentForCreate = $rootScope.selected;

                $mdDialog.show(
                    {
                        controller: 'ActionsModalController',
                        templateUrl: '/js/views/dialogs/newfolder.html',
                        parent: angular.element(document.body),
                        targetEvent: originatorEv,
                        clickOutsideToClose:true,
                        fullscreen: false
                    }
                );
            },

            'confirm':function(){
                $mdDialog.cancel(); // close modal
                $rootScope.loaded = false;
                gdisk.folder.create($rootScope.newfoldername, $rootScope.parentForCreate.id);
            }
        };

        $scope.upload = {

            /**
             * Modal window for upload file
             */
            'open' : function(){
                $mdDialog.show(
                    {
                        controller: 'ActionsModalController',
                        templateUrl: '/js/views/dialogs/upload.html',
                        parent: angular.element(document.body),
                        targetEvent: originatorEv,
                        clickOutsideToClose:true,
                        fullscreen: false
                    }
                );
                $rootScope.uploaded = true;
                originatorEv = null;
            },

            'upload' : function($event){

                var f = document.getElementById('file').files[0];
                $rootScope.uploaded = false;
                gdisk.file.upload(f,$rootScope.folder.fid);

            }

        };

        /**
         * File info
         * @param $event
         * @param folder
         */
        $scope.info = function($event,folder){

            $mdDialog.show(
                {
                    controller: 'ActionsModalController',
                    templateUrl: '/js/views/dialogs/info.html',
                    parent: angular.element(document.body),
                    targetEvent: originatorEv,
                    clickOutsideToClose:true,
                    fullscreen: false
                }
            );

            $rootScope.uploaded = true;
            originatorEv = null;

            $rootScope.$broadcast('closeContext');
            $event.stopPropagation();
        };

        /**
         * Show file versions
         * @param $event
         * @param file
         */
        $scope.versions = function($event,file){

            $rootScope.revisions = [];
            gdisk.file.revisions($rootScope.selected.id);

            $mdDialog.show(
                {
                    controller: 'ActionsModalController',
                    templateUrl: '/js/views/dialogs/versions.html',
                    parent: angular.element(document.body),
                    targetEvent: originatorEv,
                    clickOutsideToClose:true,
                    fullscreen: false
                }
            );

            $rootScope.uploaded = true;
            originatorEv = null;

            $rootScope.$broadcast('closeContext');
            $event.stopPropagation();
        };

        $scope.preview = function($event,file){

            var fileUrl = 'https://docs.google.com/viewer?srcid='+file.id+'&pid=explorer&efh=false&a=v&chrome=false&embedded=true';
            $rootScope.previewLink = $sce.trustAsResourceUrl(fileUrl);

            $mdDialog.show(
                {
                    controller: 'ActionsModalController',
                    templateUrl: '/js/views/dialogs/preview.html',
                    parent: angular.element(document.body),
                    targetEvent: originatorEv,
                    clickOutsideToClose:true,
                    fullscreen: false
                }
            );

            originatorEv = null;

            $rootScope.$broadcast('closeContext');
            $event.stopPropagation();

        };

        $scope.openwith = {
            'open' : function($event,file){

                $mdDialog.show(
                    {
                        controller: 'ActionsModalController',
                        templateUrl: '/js/views/dialogs/openwith.html',
                        parent: angular.element(document.body),
                        targetEvent: originatorEv,
                        clickOutsideToClose:true,
                        fullscreen: false
                    }
                );

                originatorEv = null;

                $rootScope.selected['apps'] = [];

                var fileNameArr = $rootScope.selected['name'].split('.');
                var fileExt = fileNameArr.length > 1 ? fileNameArr[fileNameArr.length-1] : '';

               if(gdisk.file.mimeTypes[fileExt]) $rootScope.selected['mimetype'] = gdisk.file.mimeTypes[fileExt];

                angular.forEach($rootScope.apps, function(value,key){
                    var i = value['primaryMimeTypes'].indexOf($rootScope.selected['mimetype']);
                    if(i>-1){
                        value.openUrlTemplate = value.openUrlTemplate.replace("\{ids\}", file.id);
                        if($rootScope.selected['apps'].indexOf(value) == -1) $rootScope.selected['apps'].push(value);
                    }
                });

                $rootScope.$broadcast('closeContext');
                $event.stopPropagation();
            }
        };

        /**
         * When permissions loaded
         */
        $rootScope.$on('permission_loaded', function(event, data){

            $rootScope['selected']['permissions'] = data['items'];
            gdisk.permissions.list = data['items'];

            var res = $filter('filter')(data['items'], {'type':"anyone"});
            $rootScope['selected']['permission_by_link'] = {};
            if(res){
                if(res.length>0){
                    $rootScope['selected']['permission_by_link'] = res[0];
                }
                $rootScope['selected']['permission_by_link']['on'] = res.length>0?true:false;
            }

            res = $filter('filter')(data['items'], {'type':"user"});
            $rootScope['selected']['permission_by_users'] = {};
            if(res){
                if(res.length>0){
                    $rootScope['selected']['permission_by_users'] = res;
                }
                $rootScope['selected']['permission_by_users']['on'] = res.length>0?true:false;
            }

        });

        $rootScope.$watch('is_permission_by_link',function(){
            if($rootScope.is_permission_by_link){
                console.log('access by link');
            }
        });

        $rootScope.$on('file_uploaded', function(event, data){

            $mdDialog.cancel();
            $rootScope.uploaded = true;

            var toast = $mdToast.simple()
                .content('Fil laddas upp.')
                .position('bottom right');
            $mdToast.show(toast);

        });

        $rootScope.$on('revisions_loaded', function(event, data){

            $rootScope.revisions = data.items;

        });

    }]);


/**
 * Controller for
 * Realize actions for modal windows.
 */
mainApp.controller('FolderModalController', ['$scope', '$rootScope', 'gdisk', '$mdDialog',
    function($scope, $rootScope, gdisk, $mdDialog) {

        var originatorEv;

        $scope.controller = 'FolderModalController';

        $scope.name = "";

        /**
         * open new modal window
         * @param $event
         */
        $scope.open = function($event) {

            $mdDialog.show(
                {
                    controller: $scope.controller,
                    templateUrl: '/js/views/dialogs/skapa.html',
                    parent: angular.element(document.body),
                    targetEvent: originatorEv,
                    clickOutsideToClose:true,
                    fullscreen: false
                }
            );

            originatorEv = null;

            $event.stopPropagation();
        };

        /**
         * Confirm creating new folder
         * @param $event
         */
        $scope.confirm = function(){
            $mdDialog.cancel(); // close modal
            $rootScope.loaded = false;
            gdisk.folder.create($scope.name, $rootScope.folder.fid);
        };

    }]);

mainApp.controller('movetreeController', ['$scope', '$rootScope', 'gdisk', '$mdDialog',
    function($scope, $rootScope, gdisk, $mdDialog) {

        $scope.curFolder = 'root';
        $scope.folders = $scope.folders = gdisk.folder.childs(gdisk.accountinfo.data['rootFolderId']);
        $scope.folder = {'id': gdisk.accountinfo.data['rootFolderId'], 'name':'My disk', 'parent':false};
        $scope.targetFolder = '';

        angular.forEach($scope.folders,function(value,key){
            $scope.folders[key]['childs'] = gdisk.folder.childs(value['id']);
        });

        $scope.select = function(id,$event){
            var tr = angular.element($event.target);

            angular.element(tr).parent().parent().parent().find('span')
                .css('font-weight','normal').css('text-decoration','none'); // drop all selection

            angular.element(tr).css('font-weight','bold').css('text-decoration','underline'); // set selected
            $scope.targetFolder = id;
        };

        $scope.goto = function(id){
            $scope.folders = gdisk.folder.childs(id);
            $scope.folder = gdisk.folder.find(id) ? gdisk.folder.find(id) : {'id':'root','name':'My disk', 'parent':false};

        };

        $scope.move = function(){

            console.log($rootScope.selected);

            if($rootScope.selected.parent)
                gdisk.move($rootScope.selected['id'],$rootScope.selected.parent,$scope.targetFolder);
            if($rootScope.selected.folder)
                gdisk.move($rootScope.selected['id'],$rootScope.selected.folder,$scope.targetFolder);
        };

        $rootScope.$on('moved', function(){
            $mdDialog.cancel();
        });

    }]);
