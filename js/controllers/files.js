'use strict';

/**
 * Files Controller.
 * Render files/folder.
 */
mainApp.controller('FilesController', ['GoogleApp', '$scope', '$rootScope', 'gdisk', 'GAPI', '$mdDialog', '$mdToast',
        function(GoogleApp, $scope,$rootScope, gdisk, GAPI, $mdDialog, $mdToast) {

            this.name = 'FilesController';

            /**
             * On new folder created
             */
            $rootScope.$on('folder_created', function(event, data){
                var toast = $mdToast.simple()
                    .content('Folder '+data.name+' created.')
                    .position('bottom right');

                $mdToast.show(toast);
                $scope.stopLoadingAnimation();
            });

            /**
             * On file copied
             */
            $rootScope.$on('file_copied', function(event, data){
                var toast = $mdToast.simple()
                    .content('Fil '+data.name+' kopieras.')
                    .position('bottom right');

                $mdToast.show(toast);
                $scope.stopLoadingAnimation();
            });

            /**
             * On folder deleted
             */
            $rootScope.$on('item_deleted', function(event, data){
                var toast = $mdToast.simple()
                    .content(data.name+' utgår.')
                    .position('bottom right');
                $mdToast.show(toast);
                $scope.stopLoadingAnimation();
            });

            /**
             * Refresh list
             */
            $rootScope.$on('update_folders_files_list', function(event, folderId){
                $rootScope.folders = gdisk.folder.childs($rootScope.folder.fid); // set loaded folders
                $rootScope.files = gdisk.file.childs($rootScope.folder.fid); // set loaded files
                // tree
                var tr = gdisk.folder.roots();
                if(!angular.equals($rootScope.tree, tr)){
                    $rootScope.tree = tr;
                }else{
                    $rootScope.tree.length++;
                }
                $scope.stopLoadingAnimation();
            });

            /**
             * permission updated
             */
            $rootScope.$on('permission_updated', function(){
                var toast = $mdToast.simple()
                    .content('Tillåtelse uppdateras.')
                    .position('bottom right');

                $mdToast.show(toast);
                $scope.stopLoadingAnimation();
            });

            /**
             * On untrashed
             */
            $rootScope.$on('restored', function(){
                var toast = $mdToast.simple()
                    .content('återställa framgång.')
                    .position('bottom right');

                $mdToast.show(toast);
                $scope.stopLoadingAnimation();
            });

            /**
             * On delete from trash
             */
            $rootScope.$on('deleted', function(){
                var toast = $mdToast.simple()
                    .content('radera framgång.')
                    .position('bottom right');

                $mdToast.show(toast);
                $scope.stopLoadingAnimation();
            });

            /**
             * When api loaded
             */
            $rootScope.$on('api_loaded', function(){

                $rootScope.folders = gdisk.folder.childs($scope.folder.fid);
                $rootScope.files = gdisk.file.childs($scope.folder.fid);
                $rootScope.breadcrumbs = gdisk.folder.path($scope.folder.fid);

                // tree
                var tr = gdisk.folder.roots();
                if(!angular.equals($rootScope.tree, tr)){
                    $rootScope.tree = tr;
                }else{
                    $rootScope.tree.length++;
                }

                $rootScope.stopLoadingAnimation();
            });

            /**
             * When account info loaded
             */
            $rootScope.$on('account_info_loaded', function(event, data){

                if($rootScope.folder.fid == 'root'){
                    $rootScope.folder.fid = gdisk.accountinfo.data['rootFolderId'];
                }

                $rootScope.quotaTotal = gdisk.accountinfo.data['total'];
                $rootScope.quotaUsed = gdisk.accountinfo.data['used'];

                gdisk.loadTree();
            });

            /**
             * When tree loaded
             */
            $rootScope.$on('tree_loaded', function(event, data){
                gdisk.load($rootScope.folder.fid);
            });

            if($scope.folder.fid == 'trash') $scope.order = '-_updateDate';
            else $scope.order = 'name';

            var onAuth = function (response) {
                if(response.error) window.location = '/#/login';
                else{
                    /**
                     * Load files from api and render
                     */
                    GAPI.init().then(function(){
                        $scope.startLoadingAnimation();
                        if(!gdisk.accountinfo.data){
                            gdisk.app.load();
                            gdisk.accountinfo.load();
                        }
                        else{
                            gdisk.load($rootScope.folder.fid);
                        }
                    });
                }
            };

            gapi.load('auth2', function() {
                gapi.auth.authorize({
                        client_id: GoogleApp.clientId,
                        scope: GoogleApp.scopes,
                        "immediate": true
                    }, onAuth
                );
            });

            $scope.sortName = function(){

                if($scope.order.indexOf("-") > -1){
                    $scope.order = "name";
                }else{
                    $scope.order = "-name";
                }

            };
            $scope.sortUpdated = function(){
                if($scope.order.indexOf("-") > -1){
                    $scope.order = "_updateDate";
                }else{
                    $scope.order = "-_updateDate";
                }
            };

        }]
);

