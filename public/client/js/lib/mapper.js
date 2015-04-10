
var L = require('leaflet/dist/leaflet');
var $ = require('jquery');
var _ = require('lodash');
var helpers = require('./helpers');
require('../../../../public/components/leaflet-utfgrid/dist/leaflet.utfgrid');
require('../../../../public/components/leaflet-loading/src/Control.Loading');
var leafletImage = require('leaflet-image/leaflet-image');
var idbapi = require('./idbapi');
require('../../../../public/components/blobjs/Blob');
require('../../../../public/components/canvasblob/canvas-toBlob.js');
var FileSaver = require('../../../../public/components/filesaver/FileSaver.min');
//elid: string name of element id;
//options: object map of settings
/*
*Map object
*initialize with new IDBMap(elid=String of element to bind to,options={} to overide defaults)
*titleOutLink (optional)[string or function that returns string] html for adding extra info to popup boxes.
* if its a function then its passed the data used to render popup content on init and every paging click.
*titleOutClick (optional) [Function] for setting event binders on titleOutLink [its run after titleOutLink is rendered] 
***/
module.exports = IDBMap =  function(elid, options, titleOutLink, titleOutClick){
    var self=this;
    /*
    * Basic Options
    ****/
    var base = L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
        attribution: 'Map data © OpenStreetMap',
        minZoom: 0,
        reuseTiles: true
    });

    this.defaults = {
        center: [0,0],
        zoom: 2,
        layers: [base],
        scrollWheelZoom: true,
        boxZoom: true,
        zoomControl: true,
        worldCopyJump: true,
        loadingControl: true
    };

    if(typeof options == 'object'){
        _.merge(this.defaults,options);
    }
    /*
    * Map Controls
    ****/
    var resizeFunction = function(){
        var width = $(window).width(), height = $(window).height();
        $('#'+elid).css('width', (width-53)+'px').css('height', (height-53)+'px');
        $('#'+elid).css('width', (width-53)+'px').css('height', (height-53)+'px');
        self.map.invalidateSize();
    }
    var formatNum = function (val){
        if(isNaN(val)){
            return val;
        }else{
            return val.toString().replace(/,/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
    }
    var MaximizeButton =  L.Control.extend({
        options: {
            position:"topright"
        },
        expanded: false,
        _div: L.DomUtil.create('a', 'map-button'),
        expandFunc: function(map,control){
            return function (e) {
                var cont = '#'+elid;
                if(!control.expanded){
                    L.DomEvent.stopPropagation(e);
                    var width = $(window).width(), height = $(window).height();
                    var contwidth = $(cont).width(), contheight = $(cont).height();
                    var pos = $(cont).position();
                    $(cont).css('position', 'fixed')
                    .css('top',pos.top+'px')
                    .css('left',pos.left+'px')
                    .css('width',contwidth+'px')
                    .css('height',contheight+'px')
                    .css('z-index','550');
                    $(cont).animate({width: (width-53), height: (height-53), margin: 25, left:0,top:0},{
                        duration: 200,
                        complete: function(){
                            $('#mapper-modal').show();
                            map.invalidateSize();
                        },
                        progress: function(){
                            map.invalidateSize();
                        }
                    });
                    L.DomEvent.addListener(window, 'resize', resizeFunction);
                    $('#map-maximize-button.maximize-button').removeClass('maximize-button').addClass('minimize-button');
                    control.expanded=true;                 
                }else{
                    L.DomEvent.stopPropagation(e);
                    L.DomEvent.removeListener(window, 'resize', resizeFunction);
                    $('#mapper-modal').hide();
                    $(cont).removeAttr('style');
                    map.invalidateSize();
                    //map.zoomOut();
                    $('#map-maximize-button.minimize-button').removeClass('minimize-button').addClass('maximize-button');
                    control.expanded=false;                   
                }
            }
        },
        onAdd: function(map){
            this.map = map;
            this._div.innerHTML = '<div title="maximize map" id="map-maximize-button" class="map-button-icon maximize-button"></div>';
            this.expandClick = this.expandFunc(map,this);
            L.DomEvent.addListener(this._div, 'click', this.expandClick);
            return this._div;
        },
        onRemove: function(map){
            L.DomEvent.removeListener(this._div, 'click', this.expandClick);
        }
    });

    var ImageButton = L.Control.extend({
        options: {
            position:"topright"
        },
        _div: L.DomUtil.create('a', 'image-button'),
        imageClick: function(map,control){
            return function(e){
                e.preventDefault();
                e.stopPropagation();
                $('#map-image-button').removeClass('camera-icon').addClass('spinner');
                var legend = _.cloneDeep(map.legend);
                if(isNaN(legend.order[0])){
                    legend.order.push('other');
                    legend.colors['other']=legend.default;                
                }
                leafletImage(map,function(err,canvas){
                    //build white box
                    var context = canvas.getContext('2d'),width=canvas.width,height=canvas.height;

                    context.beginPath();
                    context.rect(15, height-(legend.order.length*15)-35, 100, (legend.order.length*15)+30);
                    context.shadowOffsetX=0;
                    context.shadowOffsetY=1;
                    context.shadowBlur=7;
                    context.shadowColor='rgba(0, 0, 0, 0.65)';
                    context.fillStyle = 'white';
                    context.fill();
                    //reset shadowing
                    context.shadowOffsetX=0;
                    context.shadowOffsetY=0;
                    context.shadowBlur=0;
                    context.shadowColor='rgba(0, 0, 0, 0)';
                    //add title
                    context.beginPath();
                    var title;
                    if(isNaN(legend.order[0])){
                        title='Top '+(legend.order.length-1)+' Taxa';
                    }else{
                        title='Record Density';
                    }
                    context.font = 'normal 10px Arial';
                    context.strokeText(title,25,height-(legend.order.length*15)-20);
                    legend.order.reverse().forEach(function(item,index,arr){
                        context.beginPath();
                        var h=height-(15*(index+1))-10;
                        context.rect(20, h, 20, 15);
                        context.fillStyle = legend.colors[item].fill;
                        context.fill();
                        context.font = 'normal 10px Arial';
                        context.strokeText(formatNum(item),44,h+11,65);
                    });
                    canvas.toBlob(function(blob){
                        FileSaver.saveAs(blob, "iDigBio_Map"+Date.now()+".png");
                        $('#map-image-button').removeClass('spinner').addClass('camera-icon');
                    }); 
                });
            }
        },
        onAdd: function(map){
            this._div.innerHTML = '<div title="download map image" id="map-image-button" class="map-button-icon camera-icon"></div>';
            L.DomEvent.addListener(this._div, 'click', this.imageClick(map,this));
            return this._div;
        },
        onRemove: function(map){
            return this._div
        }
    });

    var legendPanel = L.Control.extend({
        options: {
            position: "bottomleft"
        },
        _div: L.DomUtil.create('div','map-legend'),
        onAdd: function(map){
            var colors,control=this,header,def='',time=self.currentQueryTime;
           
            idbapi.mapping(map.mapCode+'/style/'+map.getZoom(),function(resp){
                if(time >= self.currentQueryTime){
                    //control response
                    map.legend=resp;
                    if(resp.order.length===0){
                        header='<span class="legend-header">No Map Points Available</span>';
                    }else if(isNaN(resp.order[0])){
                        header='<span class="legend-header">Top '+resp.order.length+' Taxa</span>';
                        def='<div class="legend-item">other<span class="legend-swatch" style="background-color:'+resp.default.fill+'"></span></div>'
                    }else{
                        header='<span class="legend-header">Record Density</span>';
                    }
                    colors=_.map(resp.order,function(val){
                        var swatch = '<div class="legend-item">';
                        swatch+=formatNum(val);
                        swatch+='<span class="legend-swatch" style="background-color:'+resp.colors[val.toString()].fill+'"></span></div>';
                        return swatch;
                    });
                    control._div.innerHTML='<div class="wrapper">'+header+colors.join('')+def+'</div>';
                }

            });
            return this._div;
        },
        onRemove: function(map){
            this._div.innerHTML=''
            return this._div;
        }
    });


    //init map
    this.map = L.map(elid,this.defaults);
    this.map.addControl(new MaximizeButton());
    //add mapper modal for maximize view
    $('body').append('<div id="mapper-modal"></div>');
    this.map.addControl(new ImageButton());
    this.map.addControl(new L.control.scale({
        position:'bottomright'
    }));

    /*
    * used to call Map API points endpoint with click detected by UTF8grid layer. 
    ****/

    var mapClick = function(e){
        var lat, lon, zoom,coords='';
        var popup = L.popup();
        if(_.has(e.data,'lat')&&_.has(e.data,'lon')){
            lat=e.data.lat;
            lon=e.data.lon;
        }else{
            lat=e.latlng.lat;
            lon=e.latlng.lng;
        }
        var nextPoints=false,prevPoints=false;
        var navClick=function(e){
            var load=e.target.attributes['data-load'].value;
            if(load==='next' && typeof nextPoints === 'function'){
                nextPoints();
            }else if(load==='prev' && typeof prevPoints === 'function'){
                prevPoints();
            }else if(load==='first' && typeof prevPoints === 'function'){
                prevPoints(true);
            }else if(load==='last' && typeof nextPoints === 'function'){
                nextPoints(true);
            }
        }
        var makeContent = function(data,offset){
            var items=[],nextstyle='',prevstyle='';
            data.items.forEach(function(item,ind){
                var index = item.indexTerms;
                
                var title = helpers.filterFirst(
                    [index.scientificname,index.catalognumber,index.uuid]
                )
               
                items.push(
                    '<tr class="map-popup-item"><td>'+helpers.formatNum(ind+offset+1)+'</td><td><a target="'+item.uuid+'" href="/portal/records/'+item.uuid+'">'+
                helpers.filter([title,index.institutioncode,index.eventdate]).join(', ').replace('-','&#8209;')+'</a></td></tr>'
                )
            })
            if(data.itemCount <= offset+data.items.length){
                nextstyle='disable';
            }
            if(offset==0){
                prevstyle='disable';
            }
            var table='<div class="map-item-count clearfix"><span class="map-count-title">'+helpers.formatNum(data.itemCount)+' Record'+(data.itemCount>1?'s</span>':'</span>')+'<span class="map-title-outlink">'+coords+'</span></div>'+
            '<div class="map-item-nav clearfix"><span class="nav-left '+prevstyle+'" data-load="first">&lt;&lt;</span><span class="nav-left '+prevstyle+'" data-load="prev">&lt;</span>'+
            '<span class="map-count-legend">'+helpers.formatNum(offset+1)+'-'+helpers.formatNum(offset+data.items.length)+'</span>'+
            '<span class="nav-right '+nextstyle+'" data-load="last">&gt;&gt;</span><span class="nav-right '+nextstyle+'" data-load="next">&gt;</span></div>'+
            '<div class="map-popup-wrapper">'+
            '<table class="map-items">'+items.join('')+'</table></div>';
            return table;
        }
        var getPoints = function(offset,callback){
            $.getJSON(mapapi + self.map.mapCode + "/points?lat=" + lat + "&lon=" + lon + "&zoom=" + self.map.getZoom()+"&offset="+offset, function(data){
                if(data.itemCount > data.items.length+offset){
                    nextPoints = function(last){
                        var off=offset+100;
                        if(last){
                            if(data.itemCount % 100 === 0){
                                off=data.itemCount-100;
                            }else{
                                off=Math.floor(data.itemCount / 100)*100;
                            }        
                        }
                        getPoints(off,function(d){
                            $('.nav-left, .nav-right').off('click',navClick);
                            popup.setContent(makeContent(d,off));
                            $('.nav-left, .nav-right').on('click',navClick);
                        });
                    }
                }else{
                    nextPoints=false;
                }
                if(offset>=100){
                    prevPoints = function(first){
                        var off=offset-100;
                        if(first){
                            off=0;
                        }
                        getPoints(off,function(d){
                            $('.nav-left, .nav-right').off('click',navClick);
                            popup.setContent(makeContent(d,off));
                            $('.nav-left, .nav-right').on('click',navClick);
                        });
                    }
                }else{
                    prevPoints=false;
                }
                callback(data);
                if(_.isFunction(titleOutClick)){
                    titleOutClick();
                }
            });
        }        
        getPoints(0, function(data){
            var cont;
            if(data.itemCount>0){
                //setCoords is a init param for map
                if(_.isFunction(titleOutLink)){
                    coords=titleOutLink(data);
                }else if(_.isString(titleOutLink)){
                    coords=titleOutLink;
                }
                $('.nav-left, .nav-right').off('click',navClick);
                popup.setLatLng(e.latlng).setContent(makeContent(data,0)).openOn(self.map);
                $('.nav-left, .nav-right').on('click',navClick);
            }
        });
    }

    /*
    * iDBLayer and UTF8Grid interactions control and rendering with events
    ****/
    var idblayer,utf8grid;
    var idbloading = function(){
        self.map.fire('dataloading');
    }
    var idbload = function(){
        self.map.fire('dataload');
    }
    var makeIdblayer = function(tilePath){
        idblayer = L.tileLayer(tilePath,{minZoom: 0});
        idblayer.on('loading',idbloading);
        idblayer.on('load',idbload)
        return idblayer;
    }
    var removeIdblayer = function(){
        if(typeof idblayer == 'object'){
            idblayer.off('loading',idbloading);
            idblayer.off('load',idbload);
        }
        return idblayer;
    }
    var makeUtflayer = function(path){
        utf8grid = L.utfGrid(path,{
            useJsonP: false
        })
        utf8grid.on('click',mapClick);
        return utf8grid;
    }
    var removeUtflayer = function(){
        if(typeof utf8grid == 'object'){
            utf8grid.off('click',mapClick);
        }
        return utf8grid;
    }

    /*
    *Instance Methods
    **/
    this.currentQueryTime = 0;
    var idbquery,legend;
    var mapapi = idbapi.host+"mapping/";
    
    this.query = function(query){
        idbquery=query;
        _query();
        this.map.closePopup();
        //this.map.fitWorld();
        if(_.has(query,'geopoint')){
            if(query.geopoint.type=='geo_distance'){
                this.map.setView([query.geopoint.lat,query.geopoint.lon]);
            }else if(query.geopoint.type=='geo_bounding_box'){
                var g=query.geopoint;
                this.map.fitBounds([[g.top_left.lat,g.top_left.lon],[g.bottom_right.lat,g.bottom_right.lon]]);
            }
        }else{
            this.map.setView([0,0],2);
        }
        
    }

    var _query = _.debounce(function(){
        var query = {rq: idbquery, type: 'auto', threshold: 100000, style: {fill: '#f33',stroke: 'rgb(229,245,249,.8)'}};
        var q = JSON.stringify(query), d = new Date;
        var time = d.getTime();
        self.currentQueryTime=time;

        $.ajax(mapapi,{
            data: q,
            success: function(resp){
                //console.log(resp.shortCode)
                //make sure last query run is the last one that renders
                //as responses can be out of order
                //mapCode = resp.shortCode;
                self.map.mapCode = resp.shortCode;
                self.map.resp=resp;
                if(time>=self.currentQueryTime){
                    if(typeof legend == 'object'){
                        //self.map.removeControl(legend);
                        legend.removeFrom(self.map)
                    }
                    legend = new legendPanel();
                    self.map.addControl(legend);
                    if(typeof idblayer == 'object'){
                        self.map.removeLayer(removeIdblayer());
                    }
                    self.map.addLayer(makeIdblayer(resp.tiles));
                    if(typeof utf8grid == 'object'){
                        self.map.removeLayer(removeUtflayer());
                    }
                    self.map.addLayer(makeUtflayer(resp.utf8grid));
                }
            },
            dataType: 'json',
            contentType: 'application/json',
            type: 'POST',
            crossDomain: true
        })
    }, 100,{'leading': false, 'trailing': true});
    
    /*
    * Map Events Actions
    ***/

    this.map.on('zoomend',function(e){
        if(typeof legend == 'object'){
            self.map.removeControl(legend);
            if(typeof self.map.mapCode != 'undefined'){
                self.map.addControl(legend)
            }
        }
        if(typeof idblayer == 'object'){
            self.map.removeLayer(removeIdblayer());
            if(typeof self.map.resp != 'undefined'){
                self.map.addLayer(makeIdblayer(self.map.resp.tiles))
            }
        }
    })

}