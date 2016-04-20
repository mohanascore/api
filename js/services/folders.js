'use strict';

mainApp.service('gdisk', ['Drive', '$rootScope', '$filter', function(Drive, $rootScope, $filter){

    Date.prototype.yyyymmdd = function() {
        var yyyy = this.getFullYear().toString();
        var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
        var dd  = this.getDate().toString();
        return (dd[1]?dd:"0"+dd[0])+'.'+(mm[1]?mm:"0"+mm[0])+'.'+yyyy; // padding
    };

    /**
     * Link to scope
     */
    var mObj = this;

    // dummy folders
    var folders = false;
        //[
        /*{'id':'1','parent':'0','name':'Root','owner':'me','size':'','updateDate':'10.10.15', 'collapsed':true},*/
    //];

    // dummy files
    var files = [
        /*{'id':'1', 'folder':'1', 'name':'testFile.txt','owner':'me','size':'100K','updateDate':'10.10.15', 'isfile':true},*/
    ];

    // tree
    this.tree = [];

    /**
     * Folder functional
     * @type {{roots: Function, create: Function, _create: Function, select: Function, delete: Function, find: Function, childs: Function, path: Function}}
     */
    this.folder = {

        /**
         * Return roots folders
         */
        'roots' : function(){
            var roots = [];

            for(var i in folders) {
                if(folders[i]['id'] == mObj.accountinfo.data['rootFolderId']) roots.push(folders[i]);
            }
            roots = $filter('orderBy')(roots, 'name');
            return roots;
        },

        /**
         * create new folder
         * @param $name
         * @param $parent
         */
        'create' : function(name,parent){
            parent = parent ? parent : 0;
            var f = {
                'title': name,
                'mimeType':'application/vnd.google-apps.folder'
            };
            if(parent){ f['parents'] = [ {'id' : parent} ]; }
            Drive.insertFiles(f).then(function(resp){
                resp.parents[0]['id'] = parent;
                mObj.folder._create(resp);
            });
        },

        /**
         * Create folder localy
         * @param folder
         */
        '_create' : function(folder){
            var folder = {
                'id': folder.id,
                'parent':folder.parents[0]['id'],
                'name':folder.title,
                'owner': folder['ownerNames'].join(', '),
                'size':'-',
                'updateDate': (new Date(folder['modifiedDate'])).yyyymmdd(),
                'collapsed':true,
                'iconLink' : folder['iconLink']
            };
            folders.push(folder);
            $rootScope.$broadcast('folder_created', folder);
            $rootScope.$broadcast('update_folders_files_list', folder.parent);
            $rootScope.$broadcast('update_tree');
        },

        /**
         * Set folder as selected
         * @param folder
         */
        'select':function(folder){
            if(folder['id'] && folder['parent']){
                angular.forEach(files, function(value, key){ value['selected'] = false; }); // drop selection for all
                angular.forEach(folders, function(value, key){ // drop selection for all
                    if(value['id']==folder['id']){
                        folders[key]['selected']=folders[key]['selected']?false:true;
                        $rootScope.selected = folders[key]['selected'] ? folders[key] : false;
                    }
                    else folders[key]['selected'] = false;
                });
            }else{
                console.log('Invalid folder for select.');
            }
        },

        /**
         * Delete folder
         * @param folder
         */
        'delete' : function(folder){
            if(folder['id'] && folder['parent']){

                Drive.trashFile(folder['id']).then(function(){
                    angular.forEach(folders, function(value, key){
                        if(value['id']==folder['id']){
                            delete folders[key];
                            $rootScope.$broadcast('item_deleted', folder);
                            $rootScope.$broadcast('update_folders_files_list', folder.parent);
                            return true;
                        }
                    });
                });

            }else{
                console.log('Invalid folder for select.');
            }
        },

        /**
         * Find folder by id
         * @param folderId
         * @returns {*}
         */
        'find' : function(folderId){
            var res = $filter('filter')(folders, {'id':folderId});
            if(res && res.length > 0) return res[0];
            else return false;
        },

        /**
         * Return subfolders
         * @param parentId
         * @returns {*}
         */
        'childs' : function(parentId){
            var res = $filter('filter')(folders, {'parent':parentId});
            res = $filter('orderBy')(res, 'name');
            if(res && res.length > 0) return res;
            else return false;
        },

        /**
         * Breadcrumbs for given folder
         * @param folder
         * @returns {*}
         */
        'path':function(folderId) {

            folderId = folderId || 'root';

            if(folderId == 'root'){
                return [{'id':'0','parent':'root','name':'Min enhet','owner':'me','size':'','updateDate':'', 'collapsed':true}]
            }
            if(folderId == 'trash'){
                return [{'id':'0','parent':'root','name':'Trash','owner':'me','size':'','updateDate':'', 'collapsed':true}]
            }
            else{
                var folder = mObj.folder.find(folderId);
                var _b = [];
                _b.push(folder);
                if(folder.parent != mObj.accountinfo.data['rootFolderId'] && folder.parent != 'trash'){

                    while(folder.parent != mObj.accountinfo.data['rootFolderId']) {
                        folder = mObj.folder.find(folder.parent);
                        if(folder) _b.push(folder);
                        else return _b;
                    }
                }

                _b.push({'id': mObj.accountinfo.data['rootFolderId'], 'parent':false, 'name':'Min enhent','collapsed':false});

                return _b.reverse();
            }
        },

        /**
         * Rename folder
         * @param folder
         */
        'rename':function(folder){
            Drive.updateFiles(folder.id, {title:folder.name}).then(function(res){
                var folder = mObj.folder.find(res.id);
                folder['name'] = res['title'];
                $rootScope.$broadcast('update_folders_files_list', folder.parent);
            });
        },

        /**
         * Expand folder in tree
         * @param folderId
         * @returns {boolean}
         */
        'expand':function(folderId){
            folderId = folderId || false;
            if(folderId) {
                for(var _f in folders) {
                    if(folders[_f]['id'] == folderId){
                        folders[_f]['collapsed'] = false;
                    }
                }
                return false;
            }
            return false;
        },

        /**
         * Collapse folder in tree
         * @param folderId
         * @returns {boolean}
         */
        'collapse':function(folderId){
            folderId = folderId || false;

            if(folderId) {
                for(var _f in folders) {
                    if(folders[_f]['id'] == folderId){
                        folders[_f]['collapsed'] = false;
                    }
                }
                return false;
            }
            return false;
        },

        'setpermissions':function(folderId, permisssions){

            angular.forEach(permisssions, function(value,key){

                var len = permisssions.length;

                Drive.patchPermissions(folderId, value['id'], value).then(function(res){
                    if(key+1 == len){
                        $rootScope.$broadcast('permission_updated');
                    }
                });

            });

        },

        'untrash':function(folder){
            var request = gapi.client.request({
                'path': '/drive/v2/files/' + folder.id + '/untrash',
                'method': 'POST'
            });
            var callback = function(file) {
                var newParent = file['parents'][0]['id'];
                var localFolder = mObj.folder.find(file['id']);
                localFolder['parent'] = newParent;
                $rootScope.$broadcast('update_folders_files_list');
                $rootScope.$broadcast('restored');
            };
            request.execute(callback);
        },

        'deleteFromTrash':function(folder){

            var request = gapi.client.request({
                'path': '/drive/v2/files/' + folder.id,
                'method': 'DELETE'
            });
            var callback = function(f) {

                for(var i=0;i<folders.length;i++){
                    if(folders[i] && folders[i]['id'] == folder['id']) delete folders[i];
                }

                $rootScope.$broadcast('update_folders_files_list');
                $rootScope.$broadcast('deleted');
            };

            request.execute(callback);
        }

    };

    /**
     * File functional
     * @type {{find: Function, childs: Function, select: Function, delete: Function}}
     */
    this.file = {

        'find':function(fileId){
            var res = $filter('filter')(files, {'id':fileId});
            if(res && res.length > 0) return res[0];
            else return false;
        },

        /**
         * Return files in folder
         * @param parentId
         * @returns {*}
         */
        'childs' : function(parentId){
            var res = $filter('filter')(files, {'folder':parentId});
            if(res && res.length > 0) return res;
            else return false;
        },

        /**
         * Select file in list
         * @param file
         */
        'select':function(file){
            if(file['id'] && file['folder']){
                angular.forEach(folders, function(value, key){ folders[key]['selected'] = false; }); // drop selection for all
                angular.forEach(files, function(value, key){ // drop selection for all
                    if(value['id']==file['id']){
                        files[key]['selected']=files[key]['selected']?false:true;
                        $rootScope.selected = files[key]['selected']?files[key]:false;
                    }
                    else files[key]['selected'] = false;
                });
            }else{
                console.log('Invalid file for select.');
            }
        },

        /**
         * Delete file
         * @param file
         */
        'delete' : function(file){
            if(file['id'] && file['folder']){

                Drive.trashFile(file['id']).then(function(){
                    angular.forEach(files, function(value, key){
                        if(value['id']==file['id']){
                            var folder = value['folder'];
                            delete files[key];
                            $rootScope.$broadcast('item_deleted', folder);
                            $rootScope.$broadcast('update_folders_files_list', folder);
                            return true;
                        }
                    });
                });

            }else{
                console.log('Invalid file for select.');
            }
        },

        /**
         * Rename file
         * @param folder
         */
        'rename':function(file){
            Drive.updateFiles(file.id, {title:file.name}).then(function(res){
                var file = mObj.file.find(res.id);
                file['name'] = res['title'];
                $rootScope.$broadcast('update_folders_files_list', file.folder);
            });
        },

        /**
         * Upload new file
         */
        'upload':function(file,parent){

             var r = new FileReader();

             r.onloadend = function(e){

                 var params = {
                     'title': file.name,
                     'mimeType': file.type,
                     'uploadType':'multipart'
                 };

                 var boundary = '-------314159265358979323846';
                 var delimiter = "\r\n--" + boundary + "\r\n";
                 var close_delim = "\r\n--" + boundary + "--";

                 var base64Data = btoa(e.target.result);
                 var multipartRequestBody =
                     delimiter +
                     'Content-Type: application/json\r\n\r\n' +
                     JSON.stringify(params) +
                     delimiter +
                     'Content-Type: ' + file.type + '\r\n' +
                     'Content-Transfer-Encoding: base64\r\n' +
                     '\r\n' +
                     base64Data +
                     close_delim;

                 var request = gapi.client.request({
                     'path': '/upload/drive/v2/files/',
                     'method': 'POST',
                     'params': {'uploadType': 'multipart'},
                     'headers': {
                         'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                     },
                     'body': multipartRequestBody});
                 if (!callback) {
                     var callback = function(file) {

                         // Move file
                         Drive.insertParents(file.id,{'id': parent}).then(function(){
                             Drive.deleteParents(file.id, file.parents[0]['id']);
                         });

                         /**
                          * PUSH FILE LOCALY
                          */
                         var item = {};

                         var fileSize = file['fileSize'];

                         if(file['fileSize']){

                             if(fileSize > 1 && fileSize < 1000){ fileSize += 'B'; }
                             if(fileSize > 1000 && fileSize < 1000000){ fileSize=fileSize/1000; fileSize = parseFloat(fileSize).toFixed(2); fileSize += 'Kb'; }
                             if(fileSize > 1000000){fileSize=fileSize/1000000; fileSize = parseFloat(fileSize).toFixed(2); fileSize += 'Mb'; }

                         }else{
                             fileSize = '-';
                         }

                         item['id'] = file.id;
                         item['name'] = file['title'];
                         item['owner'] = file['ownerNames'].join(', ');
                         item['updateDate'] = (new Date(file['modifiedDate'])).yyyymmdd();
                         item['_updateDate'] = (new Date(file['modifiedDate'])).getTime();
                         item['collapsed'] = true;
                         item['folder'] = parent ;
                         item['isfile'] = true;
                         item['size'] = fileSize;
                         item['iconLink'] = file['iconLink'];
                         item['selected'] = false;
                         item['link'] = file['alternateLink'];
                         item['version'] = file['version'];

                         if(file['webContentLink']){
                             item['downloadlink'] = file.webContentLink;
                         }
                         if(file['exportLinks']){
                             angular.forEach(file.exportLinks, function(l,key){ item['downloadlink'] = l; });
                         }

                         if(file['explicitlyTrashed']) item.folder = 'trash';
                         if(!mObj.file.find(item['id']))files.push(item);
                         console.log(file['parents'], mObj.file.find(item['id']));

                         $rootScope.$broadcast('file_uploaded', parent);
                         $rootScope.$broadcast('update_folders_files_list', parent);

                     };
                 }
                 request.execute(callback);

             };
             r.readAsBinaryString(file);

        },

        /**
         * Copy file
         * @param fileId
         */
        'copy':function(file){

            var request = gapi.client.request(
                {
                    'path': '/drive/v2/files/'+file.id+'/copy',
                    'method': 'POST',
                    'params': {}
                }
            );

            request.execute(function(resp) {

                var file = mObj.file._create(resp);

                if(!mObj.file.find(file['id'])){
                    console.log("Add!",file);
                    files.push(file);
                }

                $rootScope.$broadcast('file_copied', file);
                $rootScope.$broadcast('update_folders_files_list', file.folder);
            });

        },

        /**
         * Return file in needed format from api response
         * @param apiitem
         */
        '_create' : function(apiitem){

            var item = {};

            var fileSize = apiitem['fileSize'];

            if(apiitem['fileSize']){

                if(fileSize > 1 && fileSize < 1000){ fileSize += 'B'; }
                if(fileSize > 1000 && fileSize < 1000000){ fileSize=fileSize/1000; fileSize = parseFloat(fileSize).toFixed(2); fileSize += 'Kb'; }
                if(fileSize > 1000000){fileSize=fileSize/1000000; fileSize = parseFloat(fileSize).toFixed(2); fileSize += 'Mb'; }

            }else{
                fileSize = '-';
            }

            item['id'] = apiitem.id;
            item['name'] = apiitem['title'];
            item['owner'] = apiitem['ownerNames'].join(', ');
            item['updateDate'] = (new Date(apiitem['modifiedDate'])).yyyymmdd();
            item['_updateDate'] = (new Date(apiitem['modifiedDate'])).getTime();
            item['collapsed'] = true;
            item['folder'] = apiitem.parents[0]['isRoot'] ? 'root' : apiitem.parents[0]['id'];
            item['isfile'] = true;
            item['size'] = fileSize;
            item['iconLink'] = apiitem['iconLink'];
            item['selected'] = false;
            item['link'] = apiitem['alternateLink'];
            item['version'] = apiitem['version'];

            if(apiitem['webContentLink']){
                item['downloadlink'] = apiitem.webContentLink;
            }
            if(apiitem['exportLinks']){
                angular.forEach(apiitem.exportLinks, function(l,key){ item['downloadlink'] = l; });
            }

            if(apiitem['explicitlyTrashed']) item.folder = 'trash';

            return item;
        },

        /**
         * Load file revisions
         * @param fileId
         */
        'revisions' : function(fileId){
            Drive.listRevisions(fileId).then(function(resp){

                angular.forEach(resp.items, function(value,key){
                    value.modifiedDate = (new Date(value.modifiedDate)).yyyymmdd();
                });

                console.log(resp);

                $rootScope.$broadcast('revisions_loaded',resp);
            });
        },

        /**
         * Untrash file
         * @param file
         */
        'untrash':function(file){
            var request = gapi.client.request({
                'path': '/drive/v2/files/' + file.id + '/untrash',
                'method': 'POST'
            });
            var callback = function(file) {
                var newParent = file['parents'][0]['id'];
                var localFile = mObj.file.find(file['id']);
                localFile['folder'] = newParent;
                $rootScope.$broadcast('update_folders_files_list');
                $rootScope.$broadcast('restored');
            };
            request.execute(callback);
        },

        /**
         * Delete file forever
         * @param file
         */
        'deleteFromTrash':function(file){

            var request = gapi.client.request({
                'path': '/drive/v2/files/' + file.id,
                'method': 'DELETE'
            });
            var callback = function(f) {

                for(var i=0;i<files.length;i++){
                    if(files[i] && files[i]['id'] == file['id']) delete files[i];
                }

                $rootScope.$broadcast('update_folders_files_list');
                $rootScope.$broadcast('deleted');
            };

            request.execute(callback);
        },

        'mimeTypes' : {
            'csv':'application/vnd.google-apps.spreadsheet',
            'xls':'application/vnd.google-apps.spreadsheet',
            'xlsx':'application/vnd.google-apps.spreadsheet',
            'jpg':'application/vnd.google-apps.document',
            'jpeg':'application/vnd.google-apps.document',
            'JPG':'application/vnd.google-apps.document',
            'JPEG':'application/vnd.google-apps.document',
            'png':'application/vnd.google-apps.document',
            'PNG':'application/vnd.google-apps.document',
            'doc':'application/vnd.google-apps.document',
            'docs':'application/vnd.google-apps.document',
            'txt':'application/vnd.google-apps.document',
            'pdf':'application/vnd.google-apps.document'
        }


    };

    /**
     * Account info
     * @type {{load: Function, data: {}}}
     */
    this.accountinfo = {
        /**
         * Load quota info
         */
        'load':function(){
            Drive.about().then(function(e){

                var quotaBytesTotal = parseInt(e.quotaBytesTotal);
                var quotaBytesUsed = parseInt(e.quotaBytesUsed);

                // display in Mb
                if(quotaBytesTotal >1000000 && quotaBytesTotal < 1000000000){
                    quotaBytesTotal = quotaBytesTotal/1000000;
                    quotaBytesTotal = quotaBytesTotal.toFixed(2)+' Mb';
                }

                // display in Gb
                if(quotaBytesTotal >1000000000 && quotaBytesTotal < 1000000000000){
                    quotaBytesTotal = quotaBytesTotal/1000000000;
                    quotaBytesTotal = quotaBytesTotal.toFixed(2)+' Gb';
                }

                // display in Tb
                if(quotaBytesTotal >1000000000000 && quotaBytesTotal < 1000000000000000){
                    quotaBytesTotal = quotaBytesTotal/1000000000000;
                    quotaBytesTotal = quotaBytesTotal.toFixed(2)+' Tb';
                }

                // display in Kb
                if(quotaBytesUsed >1000 && quotaBytesUsed < 1000000){
                    quotaBytesUsed = quotaBytesUsed/1000;
                    quotaBytesUsed = quotaBytesUsed.toFixed(2)+' Kb';
                }

                // display in Mb
                if(quotaBytesUsed >1000000 && quotaBytesUsed < 1000000000){
                    quotaBytesUsed = quotaBytesUsed/1000000;
                    quotaBytesUsed = quotaBytesUsed.toFixed(2)+' Mb';
                }

                // display in Gb
                if(quotaBytesUsed >1000000000 && quotaBytesUsed < 1000000000000){
                    quotaBytesUsed = quotaBytesUsed/1000000000;
                    quotaBytesUsed = quotaBytesUsed.toFixed(2)+' Gb';
                }

                // display in Tb
                if(quotaBytesUsed >1000000000000 && quotaBytesUsed < 1000000000000000){
                    quotaBytesUsed = quotaBytesUsed/1000000000000;
                    quotaBytesUsed = quotaBytesUsed.toFixed(2)+' Tb';
                }

                mObj.accountinfo.data = {};
                mObj.accountinfo.data['total'] = quotaBytesTotal;
                mObj.accountinfo.data['used'] = quotaBytesUsed;
                mObj.accountinfo.data['rootFolderId'] = e.rootFolderId;

                $rootScope.$broadcast('account_info_loaded');

            });
        },

        /**
         * Quota info
         */
        'data':false
    };

    /**
     * Load permissions for file/folder
     * @type {{load: Function}}
     */
    this.permissions = {
        'load':function(id){
            Drive.listPermissions(id).then(function(resp){ $rootScope.$broadcast('permission_loaded', resp); });
        },
        'list':[],
        'invites':[],
        'removes':[],
        'file':'',
        'shared':'',
        'update':function(){

            var file = mObj.permissions.file;
            var len = mObj.permissions.list.length;
            var share = false;

            // update existed permissions
            angular.forEach(mObj.permissions.list, function(value,key){

                if(value['type']!="anyone") {

                    /*if(value['role']=='commenter'){
                     delete value['role'];
                     value['additionalRoles'] = ['commenter'];
                     }*/

                    /*Drive.patchPermissions(file, value['id'], value).then(function(res){
                     if(key+1 == len){
                     $rootScope.$broadcast('permission_updated');
                     }
                     });*/
                }
            });

            // send invites
            /*if(mObj.permissions.invites.length > 0){
                Drive.insertPermissions(file,{
                    'role':'reader',
                    'type':'user',
                    'value':mObj.permissions.invites
                });
            }

            // remove permissions
            angular.forEach(mObj.permissions.removes, function(value,key){
                Drive.deletePermissions(file,value['id']);
            });*/

            // add share by link if not
            if(!share && mObj.permissions.share){ // create permission by link

                if($rootScope.selected.permission_by_link.role == 'commenter'){
                    Drive.insertPermissions(file,{
                        'value':'anyoneWithLink',
                        'type':'anyone',
                        'role' :'reader',
                        'additionalRoles':['commenter']
                    });
                }else{
                    Drive.insertPermissions(file,{
                        'role':$rootScope.selected.permission_by_link.role,
                        'value':'anyoneWithLink',
                        'type':'anyone'
                    });
                }


            }
            // remove share by link
            if(share && !mObj.permissions.share){
                Drive.deletePermissions(file,share['id']);
            }

        }
    };

    /**
     * Return selected Folder/File
     */
    this.selected = function(){
        var res = false;
        angular.forEach(folders, function(value,key){
            if(value['selected']) res = folders[key];
        });
        angular.forEach(files, function(value,key){
            if(value['selected']) res = files[key];
        });
        return res;
    };

    /**
     * Drop selection
     */
    this.dropSelect = function(){
        angular.forEach(folders, function(value,key){
            folders[key]['selected'] = false;
        });
        angular.forEach(files, function(value,key){
            files[key]['selected'] = false;
        });
    };

    /**
     * Load files list from api
     * @returns {*}
     */
    this.load = function(folderId){

        folderId = folderId ? folderId : mObj.accountinfo.data['rootFolderId'];

        var params = {
            'maxResults':5000,
            'spaces':'drive'
        };

        if(folderId != 'trash'){
            params['q'] = "'"+folderId+"' in parents and trashed = false";
        }else{
            params['q'] = "trashed = true";
        }

        Drive.listFiles(params).then(function(resp){
            var data = resp.items;

            //folders = [{'id':'root', 'parent':false, 'name':'Min enhent','collapsed':false}];
            for(var i in data) {

                var item = {};

                var fileSize = data[i]['fileSize'];

                if(data[i]['fileSize']){

                    if(fileSize > 1 && fileSize < 1000){ fileSize += 'B'; }
                    if(fileSize > 1000 && fileSize < 1000000){ fileSize=fileSize/1000; fileSize = parseFloat(fileSize).toFixed(2); fileSize += 'Kb'; }
                    if(fileSize > 1000000){fileSize=fileSize/1000000; fileSize = parseFloat(fileSize).toFixed(2); fileSize += 'Mb'; }

                }else{
                    fileSize = '-';
                }

                if(data[i]['mimeType']=='application/vnd.google-apps.folder'){

                    if(data[i]['parents'][0]){
                        item['id'] = data[i]['id'];
                        item['name'] = data[i]['title'];
                        item['owner'] = data[i]['ownerNames'].join(', ');
                        item['updateDate'] = (new Date(data[i]['modifiedDate'])).yyyymmdd();
                        item['_updateDate'] = (new Date(data[i]['modifiedDate'])).getTime();
                        item['collapsed'] = true;
                        item['parent'] = data[i]['parents'][0]['id'] ;
                        item['iconLink'] = data[i]['iconLink'];
                        item['selected'] = false;
                        item['size'] = fileSize;
                        item['link'] = data[i]['alternateLink'];
                        item['version'] = data[i]['version'];
                        item['mimetype'] = data[i]['mimeType'];
                    }
                    if(data[i]['explicitlyTrashed']) item.parent = 'trash';
                    if(!mObj.folder.find(item['id'])) folders.push(item);

                }else{

                    if(data[i]['parents'][0] && data[i]['id']){
                        item['id'] = data[i]['id'];
                        item['name'] = data[i]['title'];
                        item['owner'] = data[i]['ownerNames'].join(', ');
                        item['updateDate'] = (new Date(data[i]['modifiedDate'])).yyyymmdd();
                        item['_updateDate'] = (new Date(data[i]['modifiedDate'])).getTime();
                        item['collapsed'] = true;
                        item['folder'] = data[i]['parents'][0]['id'] ;
                        item['isfile'] = true;
                        item['size'] = fileSize;
                        item['iconLink'] = data[i]['iconLink'];
                        item['selected'] = false;
                        item['link'] = data[i]['alternateLink'];
                        item['version'] = data[i]['version'];
                        item['mimetype'] = data[i]['mimeType'];
                        item['fileExtension'] = data[i]['fileExtension'];

                        if(data[i]['webContentLink']){
                            item['downloadlink'] = data[i].webContentLink;
                        }
                        if(data[i]['exportLinks']){
                            angular.forEach(data[i].exportLinks, function(l,key){ item['downloadlink'] = l; });
                        }
                        if(data[i]['thumbnailLink']){
                            item['thumbnailLink'] = data[i]['thumbnailLink'];
                        }
                        if(data[i]['downloadUrl']){
                            item['downloadUrl'] = data[i]['downloadUrl'];
                        }
                        if(data[i]['embedLink']){
                            item['embedLink'] = data[i]['embedLink'];
                        }
                    }
                    if(data[i]['explicitlyTrashed']) item.folder = 'trash';
                    if(!mObj.file.find(item['id']))files.push(item);
                }
            }

            $rootScope.$broadcast('api_loaded');
        });
    };

    /**
     * Load folders tree
     */
    this.loadTree = function(){

        if(!folders){

            folders = [];

            Drive.listFiles({'maxResults':5000, 'spaces':'drive', 'q':"mimeType = 'application/vnd.google-apps.folder'"}).then(function(resp){
                
                folders.push({'id': mObj.accountinfo.data['rootFolderId'], 'parent':false, 'name':'Min enhent','collapsed':false});

                var data = resp.items;

                for(var i in data) {

                    var item = {};

                    var fileSize = data[i]['fileSize'];

                    if(data[i]['fileSize']){

                        if(fileSize > 1 && fileSize < 1000){ fileSize += 'B'; }
                        if(fileSize > 1000 && fileSize < 1000000){ fileSize=fileSize/1000; fileSize = parseFloat(fileSize).toFixed(2); fileSize += 'Kb'; }
                        if(fileSize > 1000000){fileSize=fileSize/1000000; fileSize = parseFloat(fileSize).toFixed(2); fileSize += 'Mb'; }

                    }else{
                        fileSize = '-';
                    }

                    if(data[i]['parents'][0]){
                        item['id'] = data[i]['id'];
                        item['name'] = data[i]['title'];
                        item['owner'] = data[i]['ownerNames'].join(', ');
                        item['updateDate'] = (new Date(data[i]['modifiedDate'])).yyyymmdd();
                        item['_updateDate'] = (new Date(data[i]['modifiedDate'])).getTime();
                        item['collapsed'] = true;
                        item['parent'] = data[i]['parents'][0]['id'] ;
                        item['iconLink'] = data[i]['iconLink'];
                        item['selected'] = false;
                        item['size'] = fileSize;
                        item['link'] = data[i]['alternateLink'];
                        item['version'] = data[i]['version'];

                        if(data[i]['explicitlyTrashed']) item.parent = 'trash';
                        if(!mObj.folder.find(item['id'])) folders.push(item);

                    }

                }
                $rootScope.$broadcast('tree_loaded');
            });
        }
    };

    /**
     * Move folder/file
     * @param id
     * @param oldparent
     * @param newparent
     */
    this.move = function(id, oldparent, newparent){
        Drive.insertParents(id,{'id': newparent}).then(function(){
            Drive.deleteParents(id, oldparent);

            var f = mObj.folder.find(id);
            if(f){
                f['parent'] = newparent;
            }else{
                f = mObj.file.find(id);
                if(f) f['folder'] = newparent;
            }

            $rootScope.$broadcast('moved');
            $rootScope.$broadcast('update_folders_files_list', oldparent );
        });
    };

    this.app = {
        'load' : function(){
            var request = gapi.client.request({
                'path': '/drive/v2/apps',
                'method': 'GET'
            });
            var callback = function(resp) {
                mObj.app.list = resp.items;
                $rootScope.apps = resp.items;
            };
            request.execute(callback);
        },
        'list':false,
        'getByType':function(){

        }
    }

}]);