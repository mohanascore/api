'use strict';

/**
 * Tree Controller.
 * Render files/folder.
 */
mainApp.controller('ContextController', ['$scope', '$rootScope', 'gdisk', '$mdDialog', '$mdToast', '$document',
        function($scope, $rootScope, gdisk, $mdDialog, $mdToast, $document) {

            this.name = 'TreeController';

            $scope.contextMenu = function($event, item){

                var parent = $($event.target).closest('.mdl-grid');
                var cmenu = $(parent).find('md-menu-content');

                $scope.closeContext();

                var selected = gdisk.selected();

                if(!item.folder){
                    if(selected['id'] != item['id']) gdisk.folder.select(item);
                }else{
                    if(selected['id'] != item['id']) gdisk.file.select(item);
                }

                $(cmenu).css('display','block');
                $(cmenu).css('position','absolute');
                $(cmenu).css('z-index','100000');
                $(cmenu).css('outline','none');

                var top = $($event)[0]['layerY'] + $(parent).parent().scrollTop();

                if( top+$(cmenu).height()+50 >= $(parent).parent()[0].scrollHeight ){
                    top=top-$(cmenu).height();

                    if($($event)[0]['layerY'] + $(parent).parent().scrollTop() < $(cmenu).height()){
                        top = 0;
                        if($(cmenu).height() > $(parent).parent()[0].scrollHeight ){
                            $(cmenu).css('height','100%');
                        }
                    }
                }

                $(cmenu).css( 'left', angular.element($event)[0]['layerX']+'px');
                $(cmenu).css( 'top', top);

                $event.stopPropagation();
                return false;
            };

            /**
             * Close all opened context menu
             */
            $scope.closeContext = function(){
                // hide previous open context
                $('.tablerow').find('md-menu-content').css('display','none');
            };

            $rootScope.$on('closeContext', function(){
                $('.tablerow').find('md-menu-content').css('display','none');
            });

        }]
);
