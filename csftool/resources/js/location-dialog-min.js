!function(a){var b=function(a){var b=/^[0-9a-zA-Z_]+$/;return b.test(a)},c={changed:!1,default_location:{address:"Cornell University, Ithaca, NY",lat:42.45,lng:-76.48,id:"default"},hidden_location_attrs:["infowindow","marker"],initialized:!1,initial_location:null,locations:{},selected_location:null,baseLocation:function(b){var b=b;if("string"==typeof b&&(b="initial"==b?this.locations[this.initial_location]:"selected"==b?this.locations[this.selected_location]:this.locations[b]),b){var c={},d=this.hidden_location_attrs;return a.each(b,function(a,b){d.indexOf(a)<0&&(c[a]=b)}),c}},deleteLocation:function(a){var a=this.locations[a.id];if("undefined"!=typeof a){var b;a.marker.setMap(null),b=a.infowindow,delete b,a.infowindow=null,b=a.marker,delete b,a.marker=null,b=a,delete this.locations[a.id],delete b,this.changed=!0}},getLocation:function(a){var a=a;return"string"==typeof a?"initial"==a?this.locations[this.initial_location]:"selected"==a?this.locations[this.selected_location]:this.locations[a]:"undefined"!=typeof a?this.locations[a.id]:null!=this.selected_location?this.locations[this.selected_location]:this.locations.default},initializeDialogs:function(b){var c=d;return a(b).html(c.dialog_html),c.container=b,h.initializeDialog(c.map_anchor),e.initializeDialog(c.editor_anchor),this.initialized=!0,this},locationExists:function(a){return"undefined"!=typeof this.locations[a.id]},publicContext:function(){return{initial_location:this.baseLocation("initial"),all_locations:this.publicLocations(),selected_location:this.baseLocation("selected")}},publicLocation:function(a){return this.baseLocation(this.getLocation(a))},publicLocations:function(){var b={};return a.each(this.locations,function(a,c){b[a]={address:c.address,id:c.id,lat:c.lat,lng:c.lng}}),b},saveLocation:function(b,c){this.locations[b.id]=a.extend({},b),"undefined"==typeof c?this.changed=!1:this.changed=c},selectLocation:function(a){"string"==typeof a?this.selected_location=a:this.selected_location=a.id,this.changed=!0}},d={center_loc_on:"#csftool-map-dialog-map",center_map_on:"#csftool-content",container:null,dialog_html:['<div id="csftool-location-dialogs">','<div id="csftool-map-dialog-anchor">',"</div> <!-- end of csftool-map-dialog-anchor -->",'<div id="csftool-location-editor-anchor">',"</div> <!-- close csftool-location-editor-anchor -->","</div> <!-- end of csftool-location-dialogs -->"].join(""),editor_anchor:"#csftool-location-editor-anchor",editor_content:"#csftool-location-editor-content",editor_default_id:"Enter unique id",editor_dialog_html:['<div id="csftool-location-editor-content">','<p class="invalid-location-id">ID must contain only alpha-numeric characters and underscores</p>','<label class="dialog-label">ID :</label>','<input type="text" id="csftool-location-id" class="dialog-text location-id" placeholder="${editor-default-id}">','<div id="csftool-location-place"><label class="dialog-label">Place :</label>','<input type="text" id="csftool-location-address" class="dialog-text location-address"> </div>','<div id="csftool-location-coords">','<span class="dialog-label dialog-coord">Lat : </span>','<span id="csftool-location-lat" class="dialog-text dialog-coord"> </span>','<span class="dialog-label dialog-coord">, Long : </span>','<span id="csftool-location-lng" class="dialog-text dialog-coord"> </span>',"</div> <!--close csftool-location-coords -->","</div> <!-- close csftool-location-editor-content -->"].join(""),editor_dom:{id:"#csftool-location-id",address:"#csftool-location-address",lat:"#csftool-location-lat",lng:"#csftool-location-lng"},infoaddress:'</br><span class="loc-address">${address_component}</span>',infobubble:['<div class="locationInfobubble">','<span class="loc-id">${loc_obj_id}</span>',"${loc_obj_address}",'</br><span class="loc-coords">${loc_obj_lat} , ${loc_obj_lng}</span>',"</div>"].join(""),map_anchor:"#csftool-map-dialog-anchor",map_content:"#csftool-map-dialog-content",map_dialog_html:['<div id="csftool-map-dialog-content">','<div id="csftool-map-dialog-map" class="map-container"> </div>',"</div> <!-- end of csftool-map-dialog-content -->"].join(""),map_element:"csftool-map-dialog-map"},e={callbacks:{},container:null,editor_location:null,initialized:!1,isopen:!1,supported_events:["cancel","close","delete","save","select"],clear:function(){var b=d.editor_dom,c=this.editor_location;this.editor_location=null,delete c,a(b.id).val(""),a(b.address).val(""),a(b.lat).text(""),a(b.lng).text("")},close:function(){a(this.container).dialog("close"),this.clear(),this.isopen=!1},execCallback:function(b,c){if(b in this.callbacks)if("undefined"!=typeof c)this.callbacks[b](b,c);else{var e=d.editor_dom,f={id:a(e.id).val(),address:a(e.address).val(),lat:a(e.lat).val(),lng:a(e.lng).val()};this.callbacks[b](b,f)}},changes:function(){var b=this.getLocation(),c=this.getLocationBeforeEdit(),d=!1,e=a.extend({},c);return b.address!=c.address&&(e.address=b.address,d=!0),b.lat!=c.lat&&(e.lat=b.lat,d=!0),b.lng!=c.lng&&(e.lng=b.lng,d=!0),b.id!=c.id&&(e.id=b.id,d=!0),[d,e]},getLocation:function(){var b=d.editor_dom,c={address:a(b.address).val(),lat:this.editor_location.lat,lng:this.editor_location.lng,id:a(b.id).val()};return c},getLocationBeforeEdit:function(){d.editor_dom;return{address:this.editor_location.address,lat:this.editor_location.lat,lng:this.editor_location.lng,id:this.editor_location.id}},initializeDialog:function(b){var c=d;this.container=c.editor_content;var e=c.editor_dialog_html.replace("${editor-default-id}",c.editor_default_id);a(b).html(e);var g=a.extend({},f);return a(this.container).dialog(g),this.initialized=!0,this},open:function(b){return this.setLocation(b),a("p.invalid-location-id").hide(),a(this.container).dialog("open"),this.isopen=!0,!1},setLocation:function(b){var c=d.editor_dom,b=b;"undefined"!=typeof b.id?a(c.id).val(b.id):a(c.id).val(""),"undefined"!=typeof b.address?a(c.address).val(b.address):a(c.address).val(""),"undefined"!=typeof b.lat?a(c.lat).text(b.lat.toFixed(6)):a(c.lat).text(""),"undefined"!=typeof b.lng?a(c.lng).text(b.lng.toFixed(6)):a(c.lng).text(""),this.editor_location=a.extend({},b)}},f={appendTo:d.editor_anchor,autoOpen:!1,buttons:{Cancel:{class:"csftool-loc-dialog-cancel",text:"Cancel",click:function(){e.close()}},Delete:{class:"csftool-loc-dialog-delete",text:"Delete",click:function(){var a=e.getLocation();b(a.id)?c.deleteLocation(a):delete a,e.close()}},Save:{class:"csftool-loc-dialog-save",text:"Save",click:function(){var c=e.getLocation();b(c.id)?(e.close(),m.saveLocation(c),e.execCallback("save",c)):a("p.invalid-location-id").show()}},Select:{class:"csftool-loc-dialog-select",text:"Select",click:function(){var d=e.changes(),f=d[1];b(f.id)?(d[0]?m.addLocation(f):c.locationExists(f)||m.addLocation(f),c.selectLocation(f),e.execCallback("select",f),e.close()):a("p.invalid-location-id").show()}}},close:function(a,b){e.execCallback("close")},draggable:!0,minHeight:50,minWidth:450,modal:!0,position:{my:"center center",at:"center center",of:d.center_loc_on},title:"Confirm/Edit Location Information"},g=function(){var a=h.map_bounds;if(null!=a){var b=null,c=null,d=h.map,e=d.getBounds(),f=e.getCenter(),g=a.getNorthEast(),i=a.getSouthWest(),j=e.getNorthEast(),k=e.getSouthWest();k.lng()<i.lng()?c=i.lng()+(k.lng()-j.lng())/2:j.lng()>g.lng()&&(c=g.lng()-(k.lng()-j.lng())/2),k.lat()<i.lat()?b=i.lat()+(j.lat()-k.lat())/2:j.lat()>g.lat()&&(b=g.lat()-(j.lat()-k.lat())/2),null!=b?null!=c?d.setCenter(new google.maps.LatLng(b,c)):d.setCenter(new google.maps.LatLng(b,f.lng())):null!=c&&d.setCenter(new google.maps.LatLng(f.lat(),c))}},h={callbacks:{},changed:!1,container:null,current_marker:null,default_center:{lat:43.2,lng:-74.17},geocoder:null,google:null,height:null,icons:{},initialized:!1,isopen:!1,map:null,map_bounds:null,map_center:null,root_element:null,supported_events:["close"],width:null,zoom:null,afterClose:function(){this.isopen=!1,this.execCloseCallback()},beforeClose:function(){e.isopen&&e.close()},centerMap:function(a){var b;b="undefined"!=typeof a?this.locAsLatLng(a):this.locAsLatLng(),this.map.panTo(b)},close:function(){this.beforeClose(),a(this.container).dialog("close"),this.afterClose()},execCloseCallback:function(a){if("close"in this.callbacks){var b=c.publicContext();b.changed=c.changed,this.callbacks.close("close",b)}},initializeDialog:function(b){var c=d;a(b).html(c.map_dialog_html),this.root_element=b;var e=a.extend({},i);return this.height&&(e.minHeight=this.height),this.width&&(e.minWidth=this.width),this.container=c.map_content,a(this.container).dialog(e),this.zoom=j.zoom,this.initialized=!0,this},initializeGoogle:function(a){this.google=a,j.mapTypeControlOptions={style:this.google.maps.MapTypeControlStyle.DROPDOWN_MENU,position:this.google.maps.ControlPosition.TOP_RIGHT},j.mapTypeId=this.google.maps.MapTypeId.ROADMAP,j.zoomControlOptions={style:this.google.maps.ZoomControlStyle.SMALL,position:this.google.maps.ControlPosition.TOP_LEFT},this.map_center=new this.google.maps.LatLng(this.default_center)},initializeMap:function(b){var e,f=a.extend({},j);this.height&&(f.minHeight=this.height),this.width&&(f.minWidth=this.width),f.zoom=this.zoom;var i=c;e=b?"string"==typeof b?i.getLocation(b):i.locationExists(b)?i.getLocation(b):m.createLocation(b):void 0,"undefined"==typeof e&&(e=i.locationExists("default")?i.getLocation("default"):m.createDefaultLocation()),i.initial_location=e.id,i.selected_location=e.id,f.center=this.map_center,this.map=new this.google.maps.Map(document.getElementById(d.map_element),f);var k=this;a.each(i.locations,function(a,b){k.mappableLocation(b)}),this.google.maps.event.clearListeners(this.map,"url_changed"),this.google.maps.event.addListener(this.map,"click",function(a){m.createLocation(a.latLng)}),null!=this.map_bounds?(this.google.maps.event.addListener(this.map,"dragstart",function(){h.google.maps.event.addListener(h.map,"center_changed",g)}),this.google.maps.event.addListener(this.map,"dragend",function(){h.google.maps.event.clearListeners(h.map,"center_changed")})):this.google.maps.event.addListener(this.map,"dragend",function(){h.map_center=h.map.getBounds().getCenter()}),this.google.maps.event.addListener(this.map,"zoom_changed",function(){h.map_center=h.map.getBounds().getCenter(),h.zoom=h.map.getZoom()}),null==this.geocoder&&(this.geocoder=new this.google.maps.Geocoder)},locAsLatLng:function(a){var b,d=c;return b="undefined"!=typeof a?a:null==d.selected_location?d.default_location:d.selected_location,new this.google.maps.LatLng(b.lat,b.lng)},mappableLocation:function(a){null==a.marker?m.createMarker(a):a.marker.setMap(h.map),null==a.infowindow&&m.createInfoWindow(a)},open:function(b){return this.isopen&&this.close(),1!=this.initialized&&this.initializeDialog(this.root_element),a(this.container).dialog("open"),this.initializeMap(b),this.isopen=!0,c.changed=!1,!1},removeCallback:function(a){a in this.callbacks&&delete this.callbacks[a]},setBounds:function(a,b,c,d){var e=new this.google.maps.LatLng(a,b),f=new this.google.maps.LatLng(c,d);this.map_bounds=new this.google.maps.LatLngBounds(e,f)},setCallback:function(a,b){var c=this.supported_events.indexOf(a);c>=0&&(this.callbacks[a]=b)},setDimension:function(a,b){"height"==a?this.height=b:"width"==a&&(this.width=b)}},i={appendTo:d.map_anchor,autoOpen:!1,beforeClose:function(a,b){h.beforeClose()},buttons:{Done:{class:"csftool-map-dialog-close",text:"Done",click:function(){h.close()}}},close:function(a,b){h.afterClose()},draggable:!0,minHeight:400,minWidth:400,modal:!0,position:{my:"center center",at:"center center",of:d.center_map_on},resizable:!1,title:"Location Map Dialog"},j={backgroundColor:"white",center:null,disableDefaultUI:!0,disableDoubleClickZoom:!0,draggable:!0,enableAutocomplete:!1,mapTypeControl:!0,mapTypeControlOptions:null,mapTypeId:null,maxZoom:18,minZoom:6,scaleControl:!1,scrollwheel:!0,streetViewControl:!1,zoom:6,zoomControl:!0,zoomControlOptions:null},k={id:null,address:null,infowindow:null,lat:null,lng:null,marker:null},l={clickable:!0,draggable:!1,icon:null,map:null,position:null,title:"New Marker"},m={addLocation:function(b){var b=a.extend({},k,b);return b=this.createMarker(b),b=this.createInfoWindow(b),c.saveLocation(b),b},addLocations:function(b){a.each(b,function(b,d){c.locations[b]=a.extend({},k,d)})},createDefaultLocation:function(){return this.createLocation(c.default_location)},createInfoWindow:function(a){var b,c;"undefined"!=typeof a.infowindow&&(c=a.infowindow,delete c,a.infowindow=null),b=function(a){var b=d.infobubble;b=b.replace("${loc_obj_id}",a.id),b=b.replace("${loc_obj_lat}",a.lat.toFixed(5)),b=b.replace("${loc_obj_lng}",a.lng.toFixed(5));var c=a.address.indexOf(", USA");c>0&&(a.address=a.address.replace(", USA",""));var e=a.address.split(", ");if(e.length>1){var f;return f=d.infoaddress.replace("${address_component}",e[0]),f+=d.infoaddress.replace("${address_component}",e.slice(1).join(", ")),b.replace("${loc_obj_address}",f)}return b.replace("${loc_obj_address}",a.address)}(a),c=new h.google.maps.InfoWindow({content:b}),a.infowindow=c;var e=a.marker;return e.addListener("mouseover",function(){c.open(h.map,e)}),e.addListener("mouseout",function(){c.close()}),a},createLocation:function(b){var d=a.extend({},k);if(!(b instanceof h.google.maps.LatLng)){var g=a.extend(d,b);return g=this.createMarker(g),g=this.createInfoWindow(g),c.saveLocation(g,!0),g}d.lat=b.lat(),d.lng=b.lng();var f=function(a){var a=a;return function(b,c){c===h.google.maps.GeocoderStatus.OK&&b.length>0?a.address=b[0].formatted_address:a.address="Unable to decode lat/lng to physical address.",e.open(a)}}(d);h.geocoder.geocode({latLng:b},f)},createMarker:function(b){var d,f,c=h;return f=a.extend({},l),f.map=c.map,f.position=c.locAsLatLng(b),f.title=b.id,d=new c.google.maps.Marker(f),d.addListener("click",function(){e.open(b)}),b.marker=d,b}},n=function(){if(1==arguments.length){var b=arguments[0];switch(b){case"close":h.close();break;case"context":return c.publicContext();case"locations":return c.publicLocations();case"open":h.open();break;case"selected":return c.baseLocation("selected")}}else if(2==arguments.length){var d=arguments[0],e=arguments[1];switch(d){case"bind":var f=e;a.each(f,function(a,b){h.setCallback(a,b)});break;case"bounds":h.setBounds(e[0],e[1],e[2],e[3]);break;case"default":c.default_location=e;break;case"height":case"width":h.setDimension(d,e);break;case"google":h.initializeGoogle(e);break;case"location":if("string"==typeof e)return c.getLocation(e);c.selectLocation(e);break;case"locations":return m.addLocations(e);case"open":h.open(e);break;case"title":h.setTitle(e)}}else if(3==arguments.length){if("bind"==arguments[0])h.setCallback(arguments[1],arguments[2]);else if("bounds"==arguments[0]){var g=arguments[1],i=arguments[2];h.setBounds(g[0],g[1],i[0],i[1])}}else 5==arguments.length&&"bounds"==arguments[0]&&h.setBounds(arguments[1],arguments[2],arguments[3],arguments[4])};a.fn.CsfToolLocationDialog=function(b){if("undefined"==typeof b){var d=this.get(0);return c.initializeDialogs(d),n}a.each(b,function(a,b){n(a,b)})}}(jQuery);