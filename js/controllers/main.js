'use strict';

/**
 * Main Controller.
 * Make main route
 */
mainApp.controller('MainController', ['$scope', '$rootScope', '$http', '$routeParams', '$filter',
    function($scope, $rootScope, $http, $routeParams) {

        this.name = 'MainController';

        // folder
        this.folder = {};
        if($routeParams['folder']){
            $rootScope.folder = {'fid': $routeParams['folder']};
        }else{
            $rootScope.folder = {'fid': 'root'};
        }

        $rootScope.folders = []; // current folders

        $rootScope.files = [];

        $rootScope.isFolder = ($rootScope.folder.fid !== '' && $rootScope.folder.fid != 'trash' && $rootScope.folder.fid != 'root');

        $rootScope.isRoot = $rootScope.folder.fid === 'root';

        $rootScope.isTrash = $rootScope.folder.fid === 'trash';

        $rootScope.selectedItem = {};

        $rootScope.folderPermissionsList = [
            {'value':'writer', 'title':'författare'},
            {'value':'reader', 'title':'läsare'}
        ];

        $rootScope.filePermissionsList = [
            {'value':'writer', 'title':'författare'},
            {'value':'reader', 'title':'läsare'},
            {'value':'commenter', 'title':'kommentar'}
        ];

        /**
         * Show loading animation
         */
        $rootScope.startLoadingAnimation = function(){
            $rootScope.loaded = false;
        };

        /**
         * Hide loading animation
         */
        $rootScope.stopLoadingAnimation = function(){
            $rootScope.loaded = true;
        };

        // set content height
        var content = $(".tablerow");
        if(content){
            var h = $(window).height() - 105;
            $(content).height(h+'px');
        }

        $(window).resize(function(){
            if(content){
                var h = $(window).height() - 105;
                $(content).height(h+'px');
            }
        });

    }]
);
