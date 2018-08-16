
console.log("LOADING FRAPPLE TOOL SCRIPT");
FRAPPLE = {
    _listeners_: { },
    button_labels: {{ button_labels }},
    chart_labels: {{ chart_labels }},
    chart_types: {{ chart_types }},
    csf_common_url: "{{ csftool_url }}",
    data: null,
    dates: null,
    default_chart: "{{ default_chart }}",
    display: null,
    display_anchor: "#csftool-display",
    location: null,
    map_dialog_anchor: "#csftool-map-dialog-anchor",
    map_dialog_container: '<div id="csftool-map-dialog-anchor"> </div>',
    max_year: {{ max_year }},
    min_year: {{ min_year }},
    season: "{{ season_description }}",
    server_url: "{{ server_url }}",
    supported_listeners: ["allDataRequested", "onStopWaitWidget"],
    tool_url: "{{ tool_url }}",
    toolname: "{{ toolname }}",
    ui: null,
    ui_anchor: "#csftool-input",
    varieties: {{ varieties_js }},
    wait_widget: null,

    addCorsHeader: function(xhr) {
        xhr.setRequestHeader('Content-Type', 'text/plain');
        xhr.setRequestHeader('Access-Control-Request-Method', 'GET');
        xhr.setRequestHeader('Access-Control-Request-Headers', 'X-Requested-With');
        xhr.withCredentials = true;
    },

    addListener: function(event_type, function_to_call) {
        if (event_type.substring(0,6) != "load.") {
            var index = this.supported_listeners.indexOf(event_type);
            if (index >= 0) { this._listeners_[event_type] = function_to_call; }
        } else{ this.wait_widget.addListener(event_type.split('.')[1], function_to_call); }
    },

    adjustTimeZone: function(date_value) { return new Date(date_value.toISOString().split('T')[0]+'T12:00:00-04:30'); },

    dataAvailable: function(data_type) { this.data.available(data_type); },
    dataChanged: function(data_type) {
        console.log('EVENT :: ' + data_type + ' CHANGED : WAIT WIDGET NOTIFIED : waiting = ' + (this.wait_widget.state() == "wait"));
        if (this.wait_widget.state() == "wait") { this.wait_widget.dataReady(data_type); }
    },
    dataReady: function(data_type) { this.wait_widget.available(data_type); },

    dateChanged: function(new_date) {
        var doi = this.dateToDateObj(new_date);
        this.locations.doi = doi;
        this.dates.doi = doi;
    },

    dateToDateObj: function(date_value) {
        if (jQuery.type(date_value) === 'string') { return new Date(date_value+'T12:00:00-04:30'); 
        } else if (jQuery.isArray(date_value)) {
            if (date_value.length == 3) { return this.adjustTimeZone(new Date(date_value[0], date_value[1]-1, date_value[2]));
            } else if (date_value.length == 2) { return this.dayToDateObj(date_value); }
        } else { return this.adjustTimeZone(date_value); }
    },

    displayReady: function() {
        console.log("FRAPPLE :: DISPLAY READY : adding series to : " + jQuery.type(this.display));
        var t50risk = 0;
        console.log("             hardtemp available : " + (this.data.hardtemp.length > 0));
        if (this.data.hardtemp.length > 0) { this.display("addSeries", "hardiness"); t50risk += 1; }
        console.log("             mint available : " + (this.data.mint.length > 0));
        if (this.data.mint.length > 0) { this.display("addSeries", "mint"); t50risk += 1; }
        if (t50risk == 2) { this.display("addSeries", "t50risk"); }
    },

    forecast: function(view, data_type) {
        console.log("REQUEST :: FORECAST : " + data_type + " : dates : " + view.start + " , " + view.end);
        var fcast_view = this.dates.forecastView(view);
        console.log("           FORECAST VIEW : " + view.start + " , " + view.end);
        if (fcast_view) { return this.genDataPairs(data_type, fcast_view.start, fcast_view.end); } else { return; }
    },

    genDataPairs: function(data_type, start, end) {
        var end_index = this.dates.indexOf(end) + 1;
        var start_index = this.dates.indexOf(start);
        console.log("REQUEST :: gen data pairs : " + data_type + " : " + start + " : " + end);
        var slice = this.data.slice(data_type, start_index, end_index);
        console.log("     DATA SLICE :"); console.log(slice);
        var days = this.dates.slice(start_index, end_index);
        var pairs = [ ];
        for (var i=0; i < slice.length; i++) { pairs.push([ days[i], slice[i] ]); }
        return pairs;
    },

    genDataRange: function(data_type_1, data_type_2, start_date, end_date) {
        console.log("REQUEST :: gen data range : " + data_type_1 + " : " + data_type_2 + " : "+ start_date + " : " + end_date);
        var end_index = this.dates.indexOf(end_date) + 1;
        var start_index = this.dates.indexOf(start_date);
        console.log("      " + start_index + ":" + end_index);
        var days = this.dates.slice(start_index, end_index);
        console.log("days : " + days);
        var array_1 = this.data.slice(data_type_1, start_index, end_index);
        console.log(data_type_1 + " : " + array_1);
        var array_2 = this.data.slice(data_type_2, start_index, end_index);
        console.log(data_type_2 + " : " + array_2);

        var day, indx;
        var data = [];
        var intercept = [];
        var prev_day = days[0]
        var prev_1 = array_1[0];
        var prev_2 = array_2[0];
        var risk = 0;
        var value_1, value_2;

        // just in case we are already at risk on the first day
        if (prev_2 >= prev_1) { data.push([ prev_day, prev_1, prev_1 ]);
        } else { data.push([ prev_day, prev_1, prev_2 ]); risk = 1; }

        for (indx=1; indx < days.length; indx++) {
            day = days[indx]; value_1 = array_1[indx]; value_2 = array_2[indx];
            if (risk == 0) { // no risk yet
                if (value_2 < value_1) {
                    // begin new risk event ... add point where lines cross
                    intercept = this.intercept([ [prev_day, prev_2], [day, value_2] ],
                                               [ [prev_day, prev_1], [day, value_1] ]);
                    if (intercept) { data.push(intercept); }
                    data.push([ day, value_1, value_2 ]);
                    risk == 1;
                }
                data.push([ day, value_1, value_1 ]); 

            } else { // already at risk
                if (value_2 > value_1) {
                    intercept = this.intercep([ [prev_day, prev_2], [day, value_2] ],
                                                [ [prev_day, prev_1], [day, value_1] ]);
                    if (intercept) { data.push(intercept); }
                    data.push([ day, value_1, value_1 ]); // end of risk
                    risk = 0;
                } else { // push the current day
                    data.push([ day, value_1, value_2 ]); 
                    risk += 1;
                }
            }
            prev_day = day;
            prev_1 = value_1;
            prev_2 = value_2;
        }
        console.log("generated data range :"); console.log(data);
        return data;
    },

    intercept: function(line_1, line_2) {
        console.log("INTERCEPT CALCULATOR :: " + line_1 + " :: " + line_2);
        var l1p1_x = line_1[0][0], l1p1_y = line_1[0][1];
        console.log("            l1p1 = " + l1p1_x + " , " + l1p1_y);
        var l1p2_x = line_1[1][0], l1p2_y = line_1[1][1];
        console.log("            l1p2 = " + l1p2_x + " , " + l1p2_y);
        var l2p1_x = line_2[0][0], l2p1_y = line_2[0][1];
        console.log("            l2p1 = " + l2p1_x + " , " + l2p1_y);
        var l2p2_x = line_2[1][0], l2p2_y = line_2[1][1];
        console.log("            l2p2 = " + l2p2_x + " , " + l2p2_y);

        var denom = ((l2p2_y - l2p1_y) * (l1p2_x - l1p1_x)) -
                    ((l2p2_x - l2p1_x) * (l1p2_y - l1p1_y));
        console.log("     denominator = " + denom);
        var u_a = ( ((l2p2_x - l2p1_x) * (l1p1_y - l2p1_y)) - 
                    ((l2p2_y - l2p1_y) * (l1p1_x - l2p1_x))
                  ) / denom;
        console.log("             u_a = " + u_a);
        var u_b = ( ((l1p2_x - l1p1_x) * (l1p1_y - l2p1_y)) -
                    ((l1p2_y - l1p1_y) * (l1p1_x - l2p1_x))
                  ) / denom;
        console.log("             u_b = " + u_b);

        var x = l1p1_x + (u_a * (l1p2_x - l1p1_x));
        console.log("               x = " + x);
        var y = l1p1_y + (u_a * (l1p2_y - l1p1_y));
        console.log("               y = " + y);

        return [x, y, y];
    },

    load_is_complete: function() { return this.wait_widget.allItemsAvailable(); },

    logObjectAttrs: function(obj) { jQuery.each(obj, function(key, value) { console.log("    ATTRIBUTE " + key + " = " + value); }); },
    logObjectHtml: function(container) { if (jQuery.type(container) === 'string') { var element = document.getElementById(container); } },

    observed: function(view, data_type) {
        console.log("REQUEST :: OBSERVED : " + data_type + " : dates : " + view.start + " , " + view.end);
        if (jQuery.type(data_type) === 'string') { return this.genDataPairs(data_type, view.start, view.end);
        } else if (jQuery.isArray(data_type)) { return this.genDataRange(data_type[0], data_type[1], view.start, view.end);
        } else { return; }
    },

    startWaitWidget: function() {
        // required : arguments[0] == list of data types to wiat for
        // optonal  : arguments[1] == true/false auto stop when all data types are available
        if (arguments.length == 1) { this.wait_widget.start(arguments[0]);
        } else if (arguments.length == 2) { this.wait_widget.start(arguments[0], arguments[1]); }
    },

    stopWaitWidget: function() { this.wait_widget.stop(); },

    uploadAllData: function(requested_loc) {
        var loc_obj = requested_loc;
        if (jQuery.type(loc_obj) === 'undefined') { loc_obj = this.locations.state; 
        } else { this.locations.update(loc_obj, false); }
        this.dates.uploadDaysInSeason()
        this.data.uploadFreeze Damage PotentialData(loc_obj);
        this.data.uploadTempextData(loc_obj);
    },

    uploadSeasonData: function(loc_obj) {
        var loc_obj = loc_obj;
        if (jQuery.type(loc_obj) === 'undefined') { loc_obj = this.locations.state; }
        this.data.uploadFreeze Damage PotentialData(loc_obj);
        this.data.uploadTempextData(loc_obj);
    },

    varietyName: function(key) { return this.varieties[key]; },
    waitFor: function(data_type) { this.wait_widget.waitFor(data_type); },
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function ToolDataManager(tool) {
    var _data_, _listeners_;
    this._data_ = { "hardtemp":[], "mint":[], }
    this._listeners_ = { }

    var callback_pending, error_callbacks, tool, upload_callbacks, upload_pending, wait_widget;
    this.callback_pending = [ ];
    this.error_callbacks = { tempexts: null, hardtemp: null };
    this.tool = tool;
    this.upload_callbacks = { tempexts: null, hardtemp: null };
    this.upload_pending = [ ];
 
    Object.defineProperty(this, "available_types", {
        configurable:false, enumerable:true, 
        get:function() { var available = [ ];
            if (this._data_.hardtemp.length > 0) { available.push("hardtemp"); }
            if (this._data_.mint.length > 0) { available.push("mint"); }
            return available;
        },
    });

    Object.defineProperty(this, "mint", { 
        configurable:false, enumerable:true,
        get:function() { return this._data_.mint },
        set:function(mint) {
                this._data_.mint = mint;
                this.tool.dataChanged("mint"); 
                if ("tempextChanged" in this._listeners_) { this._listeners_.tempextChanged("tempextChanged");
                } else { if (!("mint" in this.callback_pending)) { this.callback_pending.push("mint"); } }
            }
    });

    Object.defineProperty(this, "hardtemp", {
        configurable:false, enumerable:true, 
        get:function() { return this._data_.hardtemp; },
        set:function(data) { this._data_.hardtemp = data;
                this.tool.dataChanged("hardtemp");
                if ("hardinessChanged" in this._listeners_) {
                    console.log("EVENT :: hardinessChanged : executing callback");
                    this._listeners_.hardinessChanged("hardinessChanged");
                } else { if (!("hardtemp" in this.callback_pending)) { this.callback_pending.push("hardtemp"); } }
            }
    });

    // immutable properties
    Object.defineProperty(this, "callback_map", { configurable:false, enumerable:false, writable:false, value: { hardtemp: "hardinessChanged", tempexts: "tempextChanged", } });
    Object.defineProperty(this, "data_arrays", { configurable:false, enumerable:false, writable:false, value: ["hardtemp", "mint"] });
    Object.defineProperty(this, "data_types", { configurable:false, enumerable:false, writable:false, value: ["hardtemp", "mint"] });
    Object.defineProperty(this, "supported_listeners", { configurable:false, enumerable:false, writable:false, value: ["hardinessChanged", "allDataRequested", "tempextChanged"] });
}

ToolDataManager.prototype.addListener = function(event_type, function_to_call) {
    var index = this.supported_listeners.indexOf(event_type);
    if (index >= 0) { this._listeners_[event_type] = function_to_call; }
}

ToolDataManager.prototype.dataAt = function(data_type, index) { return this._data_[data_type][index]; }
ToolDataManager.prototype.dataLength = function(data_type) { return this._data_[data_type].length; }

ToolDataManager.prototype.executePendingCallbacks = function() {
    console.log("EXEC :: PENDING CALLBACKS :: ToolDataManager : " + this.callback_pending);
    if (this.callback_pending.length > 0) {
        var keys = this.callback_pending;
        for (var i in keys) {
            var callback = this._listeners_[this.callback_map[keys[i]]];
            if (jQuery.type(callback) !== 'undefined') { callback(this); }
        }
    }
}

ToolDataManager.prototype.slice = function(data_type, start_index, end_index) {
    if (start_index > 0) {
        if (end_index > 0) {
            return this._data_[data_type].slice(start_index, end_index);
        } else { return this._data_[data_type].slice(start_index); }
    } else {
        if (end_index > 0) { 
           return this._data_[data_type].slice(0, end_index);
        } else { return; }  
    }
}

ToolDataManager.prototype.updateHardtemp = function(info_obj) {
    console.log("DATA MANAGER :: UPDATE HARDTEMP :");
    this.tool.logObjectAttrs(info_obj);
    if ("data" in info_obj) { this.hardtemp = info_obj.data; }
}
ToolDataManager.prototype.updateTempexts = function(info_obj) { if ("data" in info_obj) { this.mint = info_obj.data.mint; } }

ToolDataManager.prototype.uploadFreeze Damage PotentialData = function (loc_obj) {
    var url = this.tool.tool_url + '/hardtemp';
    console.log("DATA UPLOAD REQUEST :: /hardtemp @ " + loc_obj.address);
    var query = {location:{key:loc_obj.key, address:loc_obj.address, coords:[loc_obj.lat,loc_obj.lng]}, variety:loc_obj.variety, season:this.tool.dates.season};
    query = JSON.stringify(query);
    console.log("QUERY = " + query);
    var options = { url:url, type:'post', dataType:'json', crossDomain:true, data:query,
                    error:this.error_callbacks.hardtemp, success:this.upload_callbacks.hardtemp,
                    beforeSend: function(xhr) { FRAPPLE.addCorsHeader(xhr); FRAPPLE.waitFor("hardtemp"); },
    }
    jQuery.ajax(options);
}

ToolDataManager.prototype.uploadTempextData = function(loc_obj) {
    var url = this.tool.tool_url + '/tempexts';
    console.log("DATA UPLOAD REQUEST :: /tempexts @ " + loc_obj.address);
    var query = {location:{key:loc_obj.key, address:loc_obj.address, coords:[loc_obj.lat,loc_obj.lng]}, variety:loc_obj.variety, season:this.tool.dates.season};
    query = JSON.stringify(query);
    console.log("QUERY = " + query);
    var options = { url:url, type:'post', dataType:'json', crossDomain:true, data:query,
                    error: this.error_callbacks.tempexts, success: this.upload_callbacks.tempexts,
                    beforeSend: function(xhr) { FRAPPLE.addCorsHeader(xhr); FRAPPLE.waitFor("tempexts"); }
    }
    jQuery.ajax(options);
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

function ToolDatesManager(tool) {
    var _dates_, _days_, _listeners_;
    this._dates_ = { days_in_view:{{ days_in_view }}, doi: null, fcast_start:null, fcast_end:null, last_obs:null, last_valid:null,
                     season:null, season_end:null, season_spread:null, season_start:null, view_end:null, view_start:null };
    this._days_ = [ ];
    this._listeners_ = { };

    var default_doi, error_callback, season_end_day, season_is_clipped, season_start_day, tool, upload_callback;
    this.default_doi = {{ default_doi }};
    this.error_callback = null;
    this.ms_per_day = 24*3600*1000;
    this.season_end_day = null;
    this.season_is_clipped = false;
    this.season_start_day = null;
    this.tool = tool;
    this.upload_callback = null;

    // protected  properties
    Object.defineProperty(this, "days", {
        configurable:false, enumerable:true,
        get:function() { return this._days_; },
        set:function(days_array) {
                this._days_ = days_array.map(function(day) { return FRAPPLE.dates.dateToTime(day); });
                this.tool.dataChanged("days");
                if ("onDaysChanged" in this._listeners_) { 
                    console.log("EVENT :: DAYS CHANGED : executing callback");
                    this._listeners_.onDaysChanged("onDaysChanged", this._days_);
                }
            }
    });

    Object.defineProperty(this, "days_in_season", { configurable:false, enumerable:false, get:function() { return this._days_.length; } });

    Object.defineProperty(this, "days_in_view", {
        configurable:false, enumerable:false,
        get:function() { return this._days_.days_in_view; },
        set:function(num_days) {
            this._days_.days_in_view = Number(num_days);
            this._updateView_();
        }
    });

    Object.defineProperty(this, "doi", {
        configurable:false, enumerable:false,
        get:function() { var doi = this._dates_.doi; if (doi) { return doi; } else { return this.default_doi; } },
        set:function(new_date) {
            var doi = this.dateToDateObj(new_date);
            if (doi != this._dates_.doi) { this._dates_.doi = doi; this._updateView_(); }
        }
    });

    Object.defineProperty(this, "fcast_end", {
        configurable:false, enumerable:true,
        get:function() { if (this._dates_.fcast_end instanceof Date) { return this._dates_.fcast_end; } else { return null } },
        set:function(new_date) {
            if (jQuery.type(new_date) === 'string' || new_date instanceof Date) {
                var fcast_end = this.dateToDateObj(new_date);
                if (fcast_end <= this.season_end) { this._dates_.fcast_end = fcast_end; } else { this._dates_.fcast_end = null; }
            } else { this._dates_.fcast_end = null; }
        }
    });

    Object.defineProperty(this, "fcast_start", {
        configurable:false, enumerable:true,
        get:function() { if (this._dates_.fcast_start instanceof Date) { return this._dates_.fcast_start; } else { return null } },
        set:function(new_date) {
            if (jQuery.type(new_date) === 'string' || new_date instanceof Date) {
                var fcast_start = this.dateToDateObj(new_date);
                if (fcast_start <= this.season_end) { this._dates_["fcast_start"] = fcast_start; } else { this._dates_["fcast_start"] = null; }
            } else { this._dates_.fcast_start = null; }
        }
    });

    Object.defineProperty(this, "last_obs", {
        configurable:false, enumerable:true,
        get:function() { return this._dates_["last_obs"]; },
        set:function(new_date) {
            var last_obs = this.dateToDateObj(new_date);
            if (last_obs < this.season_end) { this._dates_["last_obs"] = last_obs; } else { this._dates_["last_obs"] = this.season_end; }
        }
    });

    Object.defineProperty(this, "last_valid", {
        configurable:false, enumerable:true,
        get:function() {
            if (this._dates_.last_valid instanceof Date) { return this._dates_.last_valid; }
            if (this._dates_.fcast_end instanceof Date) { return this._dates_.fcast_end; }
            if (this._dates_.last_obs instanceof Date) { return this._dates_.last_obs; }
            return this.season_end;
        },
        set:function(new_date) {
            var last_valid = this.dateToDateObj(new_date);
            if (last_valid < this.season_end) { this._dates_.last_valid = last_valid;
            } else { this._dates_.last_valid = this.season_end; }
        },
    });

    Object.defineProperty(this, "season", { 
        configurable:false, enumerable:false,
        get:function() { return this._dates_["season"]; },
        set:function(year) {
            prev_year = this._dates_['season'];
            new_year = Number(year);
            if (new_year != prev_year) {
                this._dates_.season = new_year;
                this._dates_.season_end = this.dayToDateObj(this.season_end_day);
                this._dates_.season_start = this.dayToDateObj(this.season_start_day);
                this._dates_.season_spread = (new_year-1).toString() + "-" + new_year.toString();
                if (prev_year != null && "seasonChanged" in this._listeners_) { this._listeners_.seasonChanged("seasonChanged", new_year); }
            }
        }
    });

    Object.defineProperty(this, "season_end", { configurable:false, enumerable:false, get:function() { return this._dates_.season_end; } });
    Object.defineProperty(this, "season_spread", { configurable:false, enumerable:false, get:function() { return this._dates_.season_spread; } });
    Object.defineProperty(this, "season_start", { configurable:false, enumerable:false, get:function() { return this._dates_.season_start; } });
    Object.defineProperty(this, "season_view", { configurable:false, enumerable:false, get:function() { return this.seasonView(); } });

    //immmutable properties
    Object.defineProperty(this, "supported_listeners", { configurable:false, enumerable:false, writable:false,
        value: [ "datesChanged", "onDaysChanged", "onResetTrend", "seasonChanged", "seasonHasEnded", "viewChanged"]
    });

    Object.defineProperty(this, "view", { configurable:false, enumerable:false, get:function() { return { doi:this._dates_.doi, end:this._dates_.view_end, start:this._dates_.view_start } } });
    Object.defineProperty(this, "view_end", { configurable:false, enumerable:false, get:function() { return this._dates_.view_end; } });
    Object.defineProperty(this, "view_start", { configurable:false, enumerable:false, get:function() { return this._dates_.view_start; } });
}

ToolDatesManager.prototype.addListener = function(event_type, function_to_call) {
    var index = this.supported_listeners.indexOf(event_type);
    if (index >= 0) { this._listeners_[event_type] = function_to_call; }
}

ToolDatesManager.prototype.adjustTimeZone = function(date_value) { return new Date(date_value.toISOString().split('T')[0]+'T12:00:00-04:30'); }

ToolDatesManager.prototype.dateToDateObj = function(date_value) {
    if (jQuery.type(date_value) === 'string') { return new Date(date_value+'T12:00:00-04:30'); 
    } else if (jQuery.isArray(date_value)) {
        if (date_value.length == 3) { return this.adjustTimeZone(new Date(date_value[0], date_value[1]-1, date_value[2]));
        } else if (date_value.length == 2) { return this.dayToDateObj(date_value); }
    } else { return this.adjustTimeZone(date_value); }
}
ToolDatesManager.prototype.dateToString = function(date_value) { return this.dateToDateObj(date_value).toISOString().split("T")[0]; }
ToolDatesManager.prototype.dateToTime = function(date_value) { if (date_value instanceof Date) { return date_value.getTime(); } else { return new Date(date_value+'T12:00:00-04:30').getTime(); } }

ToolDatesManager.prototype.dayToDateObj = function(day) {
    if (day[0] >= this.season_start_day[0]) { return this.adjustTimeZone(new Date(this.season-1,day[0],day[1]));
    } else { return this.adjustTimeZone(new Date(this.season,day[0],day[1])); }
}

ToolDatesManager.prototype.diffInDays = function(date_1, date_2) { return Math.ceil(Math.abs(date_2.getTime() - date_1.getTime()) / this.ms_per_day); }
ToolDatesManager.prototype.forecastView = function(view) {
    if (this.fcast_end) {
        if (jQuery.type(view) !== 'undefined' && this.fcast_end > view.end) { return; } // forecast is outside the actual view window
        return { doi:this.doi, end:this.fcast_end, start:this.fcast_start };
    }
    return;
}
ToolDatesManager.prototype.futureDate = function(from_date, days) { return new Date(from_date.getTime() + days*this.ms_per_day); }

ToolDatesManager.prototype.indexOf = function(date_) {
    if (date_ instanceof Date) { return this._days_.indexOf(date_.getTime());
    } else if (jQuery.type(date_) === 'string') {
        var the_date = this._dates_[date_];
        if (the_date !== null) { return this._days_.indexOf(the_date.getTime()); }
    }
    return;
}

ToolDatesManager.prototype.init = function(season, season_start_day, season_end_day, default_doi, doi) {
    this.season_start_day = season_start_day;
    this.season_end_day = season_end_day;
    this.season = season;
    if (jQuery.type(default_doi) === 'string') { this.default_doi = this.dateToDateObj(default_doi);
    } else  if (jQuery.isArray(default_doi)) { this.default_doi = this.dayToDateObj(default_doi); }
    if (jQuery.type(doi) === 'string') { this._dates_.doi = this.dateToDateObj(doi);
    } else if (jQuery.isArray(doi)) { this.doi = this.dayToDateObj(doi); }
    this._updateView_();
}

ToolDatesManager.prototype.pastDate = function(from_date, days) {
    var past_date = new Date( from_date.getTime() - days*this.ms_per_day);
    return past_date;
}

ToolDatesManager.prototype.seasonView = function() {
    var view_end = this.season_end;
    // make sure view's season_end <= last valid date
    if (this._dates_.last_valid) { if (view_end > this._dates_.last_valid) { view_end = this._dates_.last_valid; } }
    return { start:this.season_start, end:view_end, doi:this._dates_.doi };
}

ToolDatesManager.prototype.slice = function(start, end) {
    if (jQuery.type(start) == 'number') { return this.sliceByIndex(start, end);
    } else if (start instanceof Date) {
        var end_index = this.indexOf(end);
        var start_index = this.indexOf(start_date);
        return this.sliceByIndex(start_index, end_index);
    }
    return;
}

ToolDatesManager.prototype.sliceByIndex = function(start, end) {
    if (start > 0) { if (end > 0) { return this._days_.slice(start, end); } else { return this._days_.slice(start); }
    } else { if (end_index > 0) { return this._days_.slice(0, end_index); } else { return; }  }
}

ToolDatesManager.prototype.update = function(dates_obj) {
    var changed = [];
    if ("fcast_start" in dates_obj) { this.fcast_start = dates_obj["fcast_start"]; changed.push("fcast_start"); } else { this.fcast_start = null; }
    if ("fcast_end" in dates_obj) { this.fcast_end = dates_obj["fcast_end"]; changed.push("fcast_end"); } else { this.fcast_end = null; }
    if ("last_obs" in dates_obj) { this.last_obs = dates_obj["last_obs"]; changed.push("last_obs"); }
    if ("last_valid" in dates_obj) { this.last_valid = dates_obj["last_valid"]; changed.push("last_valid"); }
    if (changed.length > 0) { this._updateView_(); if ("datesChanged" in this._listeners_) { this._listeners_.onUpdate("datesChanged", changed); } }
}

ToolDatesManager.prototype.uploadDaysInSeason = function() {
    var url = this.tool.tool_url + '/daysInSeason';
    var query = JSON.stringify(this.season_view);
    var options = { url:url, type:'post', dataType:'json', crossDomain:true, data:query,
        error: this.error_callback, success: this.upload_callback,
        beforeSend: function(xhr) { FRAPPLE.addCorsHeader(xhr); FRAPPLE.waitFor("days"); },
    }
    jQuery.ajax(options);
}

ToolDatesManager.prototype.viewIndexes = function(view) { return { doi: this.indexOf(view.doi), end: this.indexOf(view.end), start: this.indexOf(view.start) }; }

ToolDatesManager.prototype._updateView_ = function() {
    var doi = this._dates_.doi;
    var view_end = this.futureDate(doi, (this._dates_.days_in_view / 2));
    if (this._dates_.last_valid) { // make sure view_end <= last valid date
        if (view_end > this._dates_.last_valid) { view_end = this._dates_.last_valid; }
    } else { // last_valid not set, make sure view_end <= season end date
        if (view_end > this._dates_.season_end) { view_end = this._dates_.season_end; }
    }
    this._dates_.view_end = view_end;
    // set view span from view end date backward
    var view_start = this.pastDate(view_end, this._dates_.days_in_view-1);
    //!TODO : make sure view_start >= season_start
    if (view_start < this._dates_.season_start) { view_start = this._dates_.season_start; }
    this._dates_.view_start = view_start;
    if ("viewChanged" in this._listeners_) { this._listeners_.viewChanged("viewChanged", this.view); }
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function ToolLocationsManager(tool) {
    var _listeners_, _locations_, _state_;
    this._listeners_ = { };
    this._locations_ = { };
    this._state_ = { address:null, doi:null, key:null, lat:null, lng:null, variety:null };

    var tool;
    this.tool = tool;

    // protected properties
    Object.defineProperty(ToolLocationsManager.prototype, "coords", { configurable:false, enumerable:false,
        get:function() { return [ this._state_.lat, this._state_.lng ]; },
        set:function(coords) {
                var changed=false;
                var lat, lng;
                if (jQuery.isArray(coords)) { lat = coords[0]; lng = coords[1]; } else { lat = coords.lat; lng = coords.lng; }
                if (lat != this._state_.lat) { this._state_.lat = lat; changed = true; }
                if (lng != this._state_.lng) { this._state_.lng = lng; changed = true; }
                if ( (changed == true) && ("locationChanged" in this._listeners_) ) { this._listeners_.locationChanged("locationChanged", { "lat":lat,"lng":lng }); }
        },
    });

    Object.defineProperty(ToolLocationsManager.prototype, "address", { configurable:false, enumerable:false,
        get:function() { return this._state_['address']; },
        set:function(value) { this._state_['address'] = value; },
    });

    Object.defineProperty(ToolLocationsManager.prototype, "doi", { configurable:false, enumerable:false,
        get:function() { return this._state_.doi; },
        set:function(new_date) { var doi = this.tool.dateToDateObj(new_date); if (doi != this._state_.doi) { this._state_.doi = doi; } },
    });

    Object.defineProperty(ToolLocationsManager.prototype, "key", { configurable:false, enumerable:false,
        get:function() { return this._state_.key; },
        set:function(key) { this._state_.key = key; },
    });

    Object.defineProperty(ToolLocationsManager.prototype, "lat", { configurable:false, enumerable:false, get:function() { return this._state_.lat; }, });
    Object.defineProperty(ToolLocationsManager.prototype, "lng", { configurable:false, enumerable:false, get:function() { return this._state_.lng; }, });
    Object.defineProperty(ToolLocationsManager.prototype, "locations", { configurable:false, enumerable:false, get:function() { return this._locations_; }, });
    Object.defineProperty(ToolLocationsManager.prototype, "state", { configurable:false, enumerable:false, get:function() { return jQuery.extend({}, this._state_); }, });
    Object.defineProperty(ToolLocationsManager.prototype, "query", { configurable:false, enumerable:false,
        get:function() {
            var wrap = function(str) { return '"' + str + '"' };
            return { doi:wrap(this._state_.doi), location: { address:wrap(this._state_.address), lat:this._state_.lat, lng:this._state_.lng, key:wrap(this._state_.key) }, variety:wrap(this._state_.variety) } },
    });

    Object.defineProperty(ToolLocationsManager.prototype, "variety", {
        configurable:false, enumerable:true, 
        get:function() { return this._state_.variety; },
        set:function(variety) { 
            if (variety != this._state_.variety) {
                this._state_.variety = variety;
                if ("varietyChanged" in this._listeners_) { this._listeners_.varietyChanged("varietyChanged", variety); }
            }
        },
    });

    // immutable properties
    Object.defineProperty(ToolLocationsManager.prototype, "supported_listeners", { configurable:false, enumerable:false, writable:false, value: ["locationChanged","onUpdate","varietyChanged"] });
}

// functions
ToolLocationsManager.prototype.addListener = function(event_type, function_to_call) {
    var index = this.supported_listeners.indexOf(event_type);
    if (index >= 0) { this._listeners_[event_type] = function_to_call; }
}

ToolLocationsManager.prototype.addLocation = function(new_key, new_loc) {
    console.log("LOCATIONS MANAGER :: ADD LOCATION : " + new_key);
    var loc_obj = jQuery.extend({}, new_loc);
    loc_obj.key = new_key;
    if (!('doi' in loc_obj) || loc_obj.doi == null) { loc_obj.doi = this.doi; }
    if (!('variety' in loc_obj) || loc_obj.variety == null) { loc_obj.variety = this.variety; }
    var validated = this.validate(loc_obj);
    if (validated[0]) { this._locations_[new_key] = validated[1]; }
}

ToolLocationsManager.prototype.addLocations = function(locations) { var self = this; jQuery.each(locations, function(key, loc_obj) { self.addLocation(key, loc_obj); }); }

ToolLocationsManager.prototype.areDifferent = function(loc_obj_1, loc_obj_1) {
    return ( (loc_obj_1.address != loc_obj_2.address) ||
             (loc_obj_1.key != loc_obj_2.key) ||
             (loc_obj_1.lat != loc_obj_2.lat) ||
             (loc_obj_1.lng != loc_obj_2.lng) );
}

ToolLocationsManager.prototype.init = function(default_location, locations, default_doi, default_variety) {
    var loc_obj;
    var validated = [false, {}];

    if (default_doi) { this._state_.doi = this.tool.dateToDateObj(default_doi); }
    if (default_variety) { this._state_.variety = default_variety; }

    if (jQuery.type(default_location) === 'object') {
        validated = this.validate(default_location);
    } else if (jQuery.type(default_locaton) === 'string') {
        loc_obj = locations[default_locaton];
        if (!('doi' in loc_obj) || loc_obj.doi == null) { loc_obj.doi = this._state_.doi; }
        if (!('key' in loc_obj)) { loc_obj.key = default_location; }
        if (!('variety' in loc_obj) || loc_obj.variety == null) { loc_obj.variety = this._state_.variety; }
        validated =  this.validate(loc_obj);
    }
    if (validated[0]) { // gotta have a default !!!
        loc_obj = validated[1];
        this._locations_[loc_obj.key] = loc_obj;
        this._state_ = loc_obj; 
        if (validated.key in locations) { delete locations[validated.key]; }
        this.addLocations(locations);
    }
    console.log("FRAPPLE :: initial location : " + this._state_.key);
    console.log("           address : " + this._state_.address);
    console.log("           variety : " + this._state_.variety);
    console.log("               doi : " + this._state_.doi);
}

ToolLocationsManager.prototype.update = function(new_loc, fire_event) {
    var changed = [];
    console.log("EVENT :: LOCATION UPDATE :");
    this.tool.logObjectAttrs(new_loc);

    if (!('doi' in new_loc) || new_loc.doi == null) { new_loc.doi = this._state_.doi }
    if (!('variety' in new_loc) || new_loc.variety == null) { new_loc.variety = this._state_.variety }
    var result = this.validate(new_loc);
    if (result[0]) { // new location is valid
        var loc_obj = result[1];
        if (loc_obj.key != this._state_.key) { this._state_.key = loc_obj.key; changed.push('key'); }
        if (loc_obj.address != this._state_.address) { this._state_.address = loc_obj.address; changed.push("address");}
        if (loc_obj.doi != this._state_.doi) { this._state_.doi = loc_obj.doi; changed.push("doi"); }
        if (loc_obj.lat != this._state_.lat) { this._state_.lat = loc_obj.lat; changed.push("lat"); }
        if (loc_obj.lng != this._state_.lng) { this._state_.lng = loc_obj.lng; changed.push("lng"); }
        if (loc_obj.variety != this._state_.variety) { this._state_.variety = loc_obj.variety; changed.push("variety"); }
    }
    if (fire_event !== false && changed && "locationChanged" in this._listeners_) {
        console.log("EVENT :: LOCATION ; executing locationChanged callback");
        this._listeners_.locationChanged("locationChanged", changed);
    }
}

ToolLocationsManager.prototype.updateDOI = function(new_date) {
    var doi = this.tool.dateToDateObj(new_date);
    this._state_.doi = doi; this._locations_[this._state_.key].doi = doi;
}

ToolLocationsManager.prototype.validate = function(new_loc) {
    var loc_obj = { key:null, address:null, doi:null, lat:null, lng:null, variety:null }
    var valid = true;
    if ("key" in new_loc && jQuery.type(new_loc.key) === 'string') { loc_obj.key = new_loc.key; } else { valid = false; }
    if ("address" in new_loc && jQuery.type(new_loc.address) === 'string') { loc_obj.address = new_loc.address; } else { valid = false; }
    if ("coords" in new_loc) {
        if (Array.isArray(new_loc.coords) && new_loc.coords.length == 2) {
            if (jQuery.type(new_loc.coords[0]) === 'number') { loc_obj.lat = new_loc.coords[0]; loc_obj.lng = new_loc.coords[1]; } else { valid = false; }
        } else { valid = false; }
    } else {
        if ("lat" in new_loc && jQuery.type(new_loc.lat) === 'number') { loc_obj.lat = new_loc.lat } else { valid = false; }
        if ("lng" in new_loc && jQuery.type(new_loc.lng) === 'number') { loc_obj.lng = new_loc.lng } else { valid = false; }
    }
    if ("doi" in new_loc && new_loc.doi instanceof Date) { loc_obj.doi = new_loc.doi; } else { valid = false; }
    if ("variety" in new_loc && jQuery.type(new_loc.variety) === 'string') { loc_obj.variety = new_loc.variety; } else { valid = false; }
    return [valid, loc_obj]
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// set state globals
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

function initializeToolManager() {
    console.log("initializing Apple Freeze Damage Potential Tool : state");
    jQuery.ajaxPrefilter(function(options, original_request, jqXHR) {
        jqXHR.original_request = original_request;
    });

    console.log("FRAPPLE :: initializing ToolDatesManager");
    FRAPPLE.dates = new ToolDatesManager(FRAPPLE);
    FRAPPLE.dates.init({{ season }}, {{ season_start_day }}, {{ season_end_day }}, '{{ default_doi }}', '{{ doi }}');
    FRAPPLE.dates.error_callback = function(jq_xhr, status_text, error_thrown) {
        console.log('BUMMER : request for Dates : Error Thrown : ' + error_thrown);
        console.log('  request : ' + jq_xhr.original_request.uri);
        console.log('  status : ' + status_text);
        console.log('  jqXHR : ' + jq_xhr.readyState, + ' : ' + jq_xhr.status + ' : ' + jq_xhr.statusText);
        console.log('  response text : ' + jq_xhr.responseText);
        console.log('  response xml : ' + jq_xhr.responseXML);
        console.log('  headers : ' + jq_xhr.getAllResponseHeaders());
    }
    FRAPPLE.dates.upload_callback = function(uploaded_obj, status_text, jq_xhr) {
        console.log('EVENT :: DAYS : upload complete : dates.upload_callback');
        FRAPPLE.dates.days = uploaded_obj.days;
        FRAPPLE.dataReady('days');
    }

    console.log("FRAPPLE :: initializing ToolLocationsManager");
    var default_location = { address:"{{ loc_address }}", doi:null, key:"{{ loc_key }}",
                             lat:{{ loc_lat }}, lng:{{ loc_lng }}, variety: "{{ default_variety }}" };
    var doi = FRAPPLE.dates.dateToDateObj("{{ doi }}");
    default_location['doi'] = doi;
    var locations = {{ locations_js }};
    FRAPPLE.locations = new ToolLocationsManager(FRAPPLE);
    FRAPPLE.locations.init(default_location, locations, doi, "{{ default_variety }}");

    console.log("FRAPPLE :: initializing ToolDataManager");
    FRAPPLE.data = new ToolDataManager(FRAPPLE);
    FRAPPLE.data.error_callbacks.tempexts = function(jq_xhr, status_text, error_thrown) {
        console.log('BUMMER : request for Temp Extremes : Error Thrown : ' + error_thrown);
        jQuery.each(jq_xhr.original_request, function(key, value) { console.log("    " + key + " : " + value); });
        console.log('  request : ' + jq_xhr.original_request.uri);
        console.log('  status : ' + status_text);
        console.log('  jqXHR : ' + jq_xhr.readyState, + ' : ' + jq_xhr.status + ' : ' + jq_xhr.statusText);
        console.log('  response text : ' + jq_xhr.responseText);
        console.log('  response xml : ' + jq_xhr.responseXML);
        console.log('  headers : ' + jq_xhr.getAllResponseHeaders());
    }
    FRAPPLE.data.error_callbacks.hardtemp = function(jq_xhr, status_text, error_thrown) {
        console.log('BUMMER : requset for Freeze Damage Potential Temp : Error Thrown : ' + error_thrown);
        console.log('  request : ' + jq_xhr.original_request.uri);
        console.log('  status : ' + status_text);
        console.log('  jqXHR : ' + jq_xhr.readyState, + ' : ' + jq_xhr.status + ' : ' + jq_xhr.statusText);
        console.log('  response text : ' + jq_xhr.responseText);
        console.log('  response xml : ' + jq_xhr.responseXML);
        console.log('  headers : ' + jq_xhr.getAllResponseHeaders());
    }
    FRAPPLE.data.upload_callbacks.hardtemp = function(uploaded_obj, status_text, jq_xhr) {
        console.log("HARDINESS data upload complete :: dates :");
        FRAPPLE.logObjectAttrs(uploaded_obj.hardtemp.dates);
        FRAPPLE.dates.update(uploaded_obj.hardtemp.dates);

        console.log("HARDINESS data upload complete :: location :");
        FRAPPLE.logObjectAttrs(uploaded_obj.hardtemp.location);
        FRAPPLE.locations.update(uploaded_obj.hardtemp.location, false);
        if (jQuery.type(uploaded_obj.hardtemp.location.variety) === 'undefined' &&
            jQuery.type(uploaded_obj.hardtemp.variety) !== 'undefined') { FRAPPLE.locations.variety = uploaded_obj.hardtemp.variety; }
        FRAPPLE.data.updateHardtemp(uploaded_obj.hardtemp);
        FRAPPLE.dataReady('hardtemp');
    }
    FRAPPLE.data.upload_callbacks.tempexts = function(uploaded_obj, status_text, jq_xhr) {
        console.log("TEMPEXTS data upload complete");
        FRAPPLE.data.updateTempexts(uploaded_obj.tempexts);
        FRAPPLE.dataReady('tempexts');
    }

    console.log("FRAPPLE FULLY INITIALIZED :: variety = " + FRAPPLE.locations.variety);
}
initializeToolManager();

