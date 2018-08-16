
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
    map_dialog_anchor: "#frapple-location-anchor",
    map_dialog_container: '<div id="frapple-location-anchor"> </div>',
    max_year: {{ max_year }},
    min_year: {{ min_year }},
    season: "{{ season_description }}",
    server_url: "{{ server_url }}",
    stage_labels: {{ stage_labels }},
    stage_pending: [ ],
    staged_dates: [ ],
    staged_risk: {T50:[],},
    supported_listeners: ['datesAvailable', 'mintAvailable', 'riskAvailable'],
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
        var index = this.supported_listeners.indexOf(event_type);
        if (index >= 0) { this._listeners_[event_type] = function_to_call; }
    },

    adjustTimeZone: function(date_value) { return new Date(date_value.toISOString().split('T')[0]+'T12:00:00-04:30'); },
    allDataAvailable: function() { this.wait_widget.allItemsAvailable() },

    cacheStagedDates: function() {
        if (this.dates.num_stages > 1) {
            var day, first, i, last, stage;
            var actual_days = this.dates._days_;
            var num_days = actual_days.length;
            var stage_array = this.dates._stages_;
            var staged_dates = [ ];
            for (i=0; i < stage_array.length; i++) {
                stage = stage_array[i];
                first = actual_days.indexOf(stage[0]);
                last = actual_days.indexOf(stage[1]);
                for (day=first; day<=last; day++) { staged_dates.push(actual_days[day]) }
                // also need first day of next stage to make charts look right
            this.staged_dates = staged_dates;
            }
        } else { this.staged_dates = this.dates._days_; }
        if ('datesAvailable' in this._listeners_) { this._listeners_.datesAvailable('datesAvailable'); }
    },

    cacheStagedRisk: function(risk_level) {
        if (this.dates.num_stages > 1) {
            var day, first, i, last, stage;
            var actual_days = this.dates._days_;
            var actual_temps = this.data._data_[risk_level];
            var num_days = actual_days.length;
            var stage_array = this.dates._stages_;
            var staged_temps = [ ];
            for (i=0; i < stage_array.length; i++) {
                stage = stage_array[i];
                first = actual_days.indexOf(stage[0]);
                last = actual_days.indexOf(stage[1]);
                for (day=first; day<last; day++) { staged_temps.push(actual_temps[day]) }
                //if (i+1 < stage_array.length) { staged_temps.push(actual_temps[last-1]); }
                staged_temps.push(actual_temps[last-1]);
            this.staged_risk[risk_level] = staged_temps;
            }
        } else { this.staged_risk[risk_level] = this.data._data_[risk_level]; }
        if ('riskAvailable' in this._listeners_) { this._listeners_.riskAvailable('riskAvailable'); }
    },

    dataAvailable: function(data_type) {
        this.wait_widget.available(data_type);

        if (data_type == 'stages' || data_type == 'days') {
            index = this.stage_pending.indexOf(data_type);
            if (index > -1) {
                this.stage_pending.splice(index,1);
                if (this.stage_pending.length == 0) { this.cacheStagedDates(); }
            }
        } else if (data_type == 'risk') { this.cacheStagedRisk('T50');
        } else if (data_type == 'mint') { if ('mintAvailable' in this._listeners_) { this._listeners_.mintAvailable('mintAvailable'); } }
    },

    dateToDateObj: function(date_value) {
        if (jQuery.type(date_value) === 'string') { return new Date(date_value+'T12:00:00-04:30'); 
        } else if (jQuery.isArray(date_value)) {
            if (date_value.length == 3) { return this.adjustTimeZone(new Date(date_value[0], date_value[1]-1, date_value[2]));
            } else if (date_value.length == 2) { return this.dayToDateObj(date_value); }
        } else { return this.adjustTimeZone(date_value); }
    },

    displayReady: function() {
        if (this.data.risk.length > 0) { this.display("addSeries", "risk"); }
        if (this.data.mint.length > 0) { this.display("addSeries", "mint"); }
    },

    forecast: function(data_type, view) {
        var fcast_view = this.dates.forecastView(view);
        if (typeof fcast_view !== 'undefined') { return this.genDataPairs(data_type, fcast_view.start, fcast_view.end); } else { return; }
    },

    fullview: function(data_type, view) {
        var _view; if (typeof view !== 'undefined') { _view = view; } else { _view = this.dates.view; }
        if (jQuery.type(data_type) === 'string') { return this.genDataPairs(data_type, _view.start, _view.end);
        } else if (jQuery.isArray(data_type)) { return this.genDataRange(data_type[0], data_type[1], _view.start, _view.end);
        } else { return; }
    },

    genDataPairs: function(data_type, start, end) {
        var raw_data, raw_dates;
        if (data_type in this.staged_risk) { raw_data = this.staged_risk[data_type]; raw_dates = this.staged_dates;
        } else { raw_data = this.data[data_type]; raw_dates = this.dates.days; }
        var data, dates, end_index, start_index;
        if (jQuery.type(start) === 'string') {
            end_index = raw_dates.indexOf(this.dateToDateObj(end).getTime());
            start_index = raw_dates.indexOf(this.dateToDateObj(start).getTime());
        } else {
            end_index = raw_dates.indexOf(end.getTime());
            start_index = raw_dates.indexOf(start.getTime());
        }

        var pairs = [ ];
        for (var i=start_index; i <= end_index; i++) { pairs.push([ raw_dates[i], raw_data[i] ]); }
        return pairs;
    },

    genDataRange: function(max_array, min_array, start_index, end_index) {
        var index;
        var days = this.dates.days;
        var data = [];
        for (index=start_index; index <= end_index; index++) { 
            data.push([ days[index], min_array[index], max_array[index] ]);
        }
        return data;
    },

    isavailable: function(data_type) { return (this.available.indexOf(data_type) > -1); },
    logObjectAttrs: function(obj) { if (typeof obj === 'object') { jQuery.each(obj, function(key, value) { console.log("    ATTRIBUTE " + key + " = " + value); }); } },

    observed: function(data_type, view) {
        var _view = this.dates.observedView(view);
        if (jQuery.type(data_type) === 'string') { return this.genDataPairs(data_type, _view.start, _view.end);
        } else if (jQuery.isArray(data_type)) { return this.genDataRange(data_type[0], data_type[1], _view.start, -view.end);
        } else { return; }
    },

    startWaitWidget: function() {
        // required : arguments[0] == list of data types to wait for
        // optonal  : arguments[1] == true/false auto stop when all data types are available
        if (arguments.length == 1) { this.wait_widget.start(arguments[0]);
        } else if (arguments.length == 2) { this.wait_widget.start(arguments[0], arguments[1]); }
    },
    stopWaitWidget: function() { this.wait_widget.stop(); },

    uploadAllData: function(requested_loc) {
        var loc_obj = requested_loc;
        if (jQuery.type(loc_obj) === 'undefined') { loc_obj = this.locations.state; 
        } else { this.locations.update(loc_obj, false); }
        this.dates.uploadSeasonDates();
        this.dates.uploadStageDates(loc_obj);
        this.data.uploadFreezeRiskData(loc_obj);
    },

    uploadLocationData: function(loc_obj) {
        var loc_obj = loc_obj;
        if (jQuery.type(loc_obj) === 'undefined') { loc_obj = this.locations.state; }
        this.dates.uploadStageDates(loc_obj);
        this.data.uploadFreezeRiskData(loc_obj);
    },

    varietyName: function(key) { return this.varieties[key]; },
    waitFor: function(data_type) {
        if (data_type == 'stages' || data_type == 'days') {
            index = this.stage_pending.indexOf(data_type);
            if (index < 0) { this.stage_pending.push(data_type); }
        }
        this.wait_widget.waitFor(data_type);
    },
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function ToolDataManager(tool) {
    var _data_, _listeners_, tool;
    this._data_ = { "T10":[], "T50":[], "T90":[], "mint":[], }
    this._listeners_ = { }
    this.tool = tool;

    var error_callbacks, upload_callbacks;
    this.error_callbacks = { mint: function(jq_xhr, status_text, error_thrown) {}, risk: function(jq_xhr, status_text, error_thrown) {} };
    this.upload_callbacks = { mint: function(uploaded_obj, status_text, jq_xhr) {}, risk: function(uploaded_obj, status_text, jq_xhr) {} };
 
    // immutable properties
    Object.defineProperty(this, "available_types", {
        configurable:false, enumerable:true, 
        get:function() { var available = [ ];
            if (this._data_.T10.length > 0) { available.push("T10"); }
            if (this._data_.T50.length > 0) { available.push("T50"); }
            if (this._data_.T90.length > 0) { available.push("T90"); }
            if (this._data_.mint.length > 0) { available.push("mint"); }
            return available;
        },
    });
    Object.defineProperty(this, "data_arrays", { configurable:false, enumerable:false, writable:false, value: ["T10", "T50", "T90", "mint"] });
    Object.defineProperty(this, "data_types", { configurable:false, enumerable:false, writable:false, value: ["risk", "mint"] });
    Object.defineProperty(this, "risk", { configurable:false, enumerable:true,
                                          get:function() { return { T10:this._data_.T10, T50:this._data_.T50, T90:this._data_.T90 } },
                                          set:function(risk_obj) {
                                              this._data_.T10 = risk_obj.T10;
                                              this._data_.T50 = risk_obj.T50;
                                              this._data_.T90 = risk_obj.T90;
                                              if ("riskChanged" in this._listeners_) { this._listeners_.riskChanged("riskChanged",risk_obj); }
                                          }
    });
    Object.defineProperty(this, "T10", { configurable:false, enumerable:true, get:function() { return this._data_.T10; } });
    Object.defineProperty(this, "T50", { configurable:false, enumerable:true, get:function() { return this._data_.T50; } });
    Object.defineProperty(this, "T90", { configurable:false, enumerable:true, get:function() { return this._data_.T90; } });
    Object.defineProperty(this, "mint", { configurable:false, enumerable:true,
                                          get:function() { return this._data_.mint },
                                          set:function(mint_array) {
                                              this._data_.mint = jQuery.extend([], mint_array);
                                              if ("mintChanged" in this._listeners_) { this._listeners_.mintChanged('mintChanged',mint_array); }
                                          }
    });
    Object.defineProperty(this, "supported_listeners", { configurable:false, enumerable:false, writable:false,
                                value: ["mintChanged", "mintRequested", "riskChanged", "riskRequested"] });
}

ToolDataManager.prototype.addListener = function(event_type, function_to_call) {
    var index = this.supported_listeners.indexOf(event_type);
    if (index >= 0) { this._listeners_[event_type] = function_to_call; }
}

ToolDataManager.prototype.dataAt = function(data_type, index) { return this._data_[data_type][index]; }
ToolDataManager.prototype.dataLength = function(data_type) { return this._data_[data_type].length; }

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

ToolDataManager.prototype.uploadFreezeRiskData = function (loc_obj) {
    var url = this.tool.tool_url + '/risk';
    var query = {location:{key:loc_obj.id, address:loc_obj.address, coords:[loc_obj.lat,loc_obj.lng]}, variety:loc_obj.variety, season:this.tool.dates.season};
    query = JSON.stringify(query);
    var options = { url:url, type:'post', dataType:'json', crossDomain:true, data:query,
                    error:this.error_callbacks.risk, success:this.upload_callbacks.risk,
                    beforeSend: function(xhr) { FRAPPLE.addCorsHeader(xhr); /*FRAPPLE.waitFor("risk");*/ },
    }
    if ("mintRequested" in this._listeners_) { this._listeners_.mintRequested("mintRequested",loc_obj); }
    if ("riskRequested" in this._listeners_) { this._listeners_.riskRequested("riskRequested",loc_obj); }
    jQuery.ajax(options);
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

function ToolDatesManager(tool) {
    var _dates_, _days_, _listeners_;
    this._dates_ = { days_in_view:{{ days_in_view }}, doi: null, fcast_start:null, fcast_end:null, last_obs:null, last_valid:null,
                     season:null, season_end:null, season_spread:null, season_start:null, view_end:null, view_start:null };
    this._days_ = [ ];
    this._listeners_ = { };
    this._stages_ = [ ];

    var default_doi, season_end_day, season_is_clipped, season_start_day, tool;
    this.default_doi = {{ default_doi }};
    this.ms_per_day = 24*3600*1000;
    this.season_end_day = null;
    this.season_is_clipped = false;
    this.season_start_day = null;
    this.tool = tool;

    var error_callbacks, upload_callbacks;
    this.error_callbacks = { season: function(jq_xhr, status_text, error_thrown) {}, stage: function(jq_xhr, status_text, error_thrown) {} };
    this.upload_callbacks = { season: function(uploaded_obj, status_text, jq_xhr) {}, stage: function(uploaded_obj, status_text, jq_xhr) {} };

    // protected  properties
    Object.defineProperty(this, "days", {
        configurable:false, enumerable:true,
        get:function() { return this._days_; },
        set:function(days_array) {
                var date_mgr = this;
                this._days_ = days_array.map(function(day) { return date_mgr.dateToTime(day); });
                if ("seasonDaysChanged" in this._listeners_) { this._listeners_.seasonDaysChanged("seasonDaysChanged",jQuery.extend([],this._days_)); }
            }
    });

    Object.defineProperty(this, "days_in_season", { configurable:false, enumerable:false, get:function() { return this._days_.length; } });

    Object.defineProperty(this, "days_in_view", {
        configurable:false, enumerable:false,
        get:function() { return this._days_.days_in_view; },
        set:function(num_days) { this._days_.days_in_view = Number(num_days); this._updateView_(); },
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
                if (fcast_start <= this.season_end) { this._dates_["fcast_start"] = fcast_start;
                } else { this._dates_["fcast_start"] = null; }
            } else { this._dates_.fcast_start = null; }
        }
    });

    Object.defineProperty(this, "last_obs", {
        configurable:false, enumerable:true,
        get:function() { return this._dates_["last_obs"]; },
        set:function(new_date) {
            var last_obs = this.dateToDateObj(new_date);
            if (last_obs < this.season_end) { this._dates_.last_obs = last_obs; } else { this._dates_.last_obs = this.season_end; }
        }
    });

    Object.defineProperty(this, "last_valid", {
        configurable:false, enumerable:false,
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
        }
    });

    Object.defineProperty(this, "num_stages", { configurable:false, enumerable:false, get:function() { return this._stages_.length; } });

    Object.defineProperty(this, "season", { 
        configurable:false, enumerable:false,
        get:function() { return this._dates_["season"]; },
        set:function(year) {
            var prev_year = this._dates_['season'];
            var new_year = Number(year);
            if (new_year != prev_year) {
                this._dates_.season = new_year;
                this._dates_.season_end = this.dayToDateObj(this.season_end_day);
                this._dates_.season_start = this.dayToDateObj(this.season_start_day);
                this._dates_.season_spread = (new_year-1).toString() + "-" + new_year.toString();
                if (prev_year != null && "seasonChanged" in this._listeners_) { this._listeners_.seasonChanged("seasonChanged",[this._dates_.season_start,this._dates_.season_end]); }
            }
        }
    });

    Object.defineProperty(this, "season_end", { configurable:false, enumerable:false, get:function() { return this._dates_.season_end; } });
    Object.defineProperty(this, "season_spread", { configurable:false, enumerable:false, get:function() { return this._dates_.season_spread; } });
    Object.defineProperty(this, "season_start", { configurable:false, enumerable:false, get:function() { return this._dates_.season_start; } });

    Object.defineProperty(this, "stages", {
        configurable:false, enumerable:true,
        get:function() { return this._stages_; },
        set:function(stage_array) {
                var date_mgr = this
                this._stages_ = stage_array.map(function(stage) { return [date_mgr.dateToTime(stage[0]), date_mgr.dateToTime(stage[1])]; });
                if ("stagesChanged" in this._listeners_) { this._listeners_.stagesChanged("stagesChanged",jQuery.extend([], this._stages_)); }
            }
    });

    //immmutable properties
    Object.defineProperty(this, "supported_listeners", { configurable:false, enumerable:false, writable:false,
        value: ["datesChanged", "seasonChanged", "seasonDaysChanged", "seasonRequested", "stagesChanged", "stagesRequested", "viewChanged"]
    });
    Object.defineProperty(this, "view_end", { configurable:false, enumerable:false, get:function() { return this._dates_.view_end; } });
    Object.defineProperty(this, "view_start", { configurable:false, enumerable:false, get:function() { return this._dates_.view_start; } });
}

ToolDatesManager.prototype.addListener = function(event_type, function_to_call) {
    var index = this.supported_listeners.indexOf(event_type);
    if (index >= 0) { this._listeners_[event_type] = function_to_call; }
}

ToolDatesManager.prototype.adjustTimeZone = function(date_value) {
    return new Date(date_value.toISOString().split('T')[0]+'T12:00:00-04:30'); }

ToolDatesManager.prototype.dataView = function() { return { doi:this._dates_.doi, end:this.last_valid, start:this.season_start }; }

ToolDatesManager.prototype.dateToDateObj = function(date_value) {
    if (jQuery.type(date_value) === 'string') { return new Date(date_value+'T12:00:00-04:30'); 
    } else if (jQuery.isArray(date_value)) {
        if (date_value.length == 3) { return this.adjustTimeZone(new Date(date_value[0], date_value[1]-1, date_value[2]));
        } else if (date_value.length == 2) { return this.dayToDateObj(date_value); }
    } else { return this.adjustTimeZone(date_value); }
}
ToolDatesManager.prototype.dateToString = function(date_value) { if (jQuery.type(date_value) === 'string') { return date_value } else { return this.dateToDateObj(date_value).toISOString().split("T")[0]; } }
ToolDatesManager.prototype.dateToTime = function(date_value) { if (date_value instanceof Date) { return date_value.getTime(); } else { return new Date(date_value+'T12:00:00-04:30').getTime(); } }
ToolDatesManager.prototype.dayToDateObj = function(day) {
    if (day[0] >= this._dates_.season_start_day[0]) { return this.adjustTimeZone(new Date(this._dates_.season-1,day[0]-1,day[1]));
    } else { return this.adjustTimeZone(new Date(this._dates_.season,day[0]-1,day[1])); }
}

ToolDatesManager.prototype.diffInDays = function(date_1, date_2) { return Math.ceil(Math.abs(date_2.getTime() - date_1.getTime()) / this.ms_per_day); }

ToolDatesManager.prototype.forecastView = function(view) {
    if (typeof this._dates_.fcast_start !== 'undefined' && this._dates_.fcast_start != null) {
        var fcast_end = this._dates_.fcast_end;
        var fcast_start = this._dates_.fcast_start;

        var _view = view;
        if (typeof view === 'undefined') { _view = this.view; }
        if (fcast_start <= _view.end) {
            if (fcast_end <= _view.end) {
                return { doi:_view.doi, end:this._dates_.fcast_end, start:fcast_start };
            } else { return { doi:_view.doi, end:_view.end, start:fcast_start }; }
        }
    }
    return;
}

ToolDatesManager.prototype.futureDate = function(from_date, days_in_future) {
    if (typeof days_in_future !== 'undefined') {
        return new Date(from_date.getTime() + days_in_future*this.ms_per_day);
    } else { return new Date(from_date.getTime() + this.ms_per_day); }
}

ToolDatesManager.prototype.indexOf = function(date_) {
    if (date_ instanceof Date) { return this._days_.indexOf(date_.getTime());
    } else if (jQuery.type(date_) === 'string') {
        var the_date = this._dates_[date_];
        if (the_date !== null) { return this._days_.indexOf(the_date.getTime()); }
    } else { return -1; }
}

ToolDatesManager.prototype.init = function(season, season_start_day, season_end_day, default_doi, doi) {
    this._dates_.season_start_day = season_start_day;
    this._dates_.season_end_day = season_end_day;
    this._dates_.season = season;
    this._dates_.season_end = this.dayToDateObj(season_end_day);
    this._dates_.season_start = this.dayToDateObj(season_start_day);
    this._dates_.season_spread = (season-1).toString() + "-" + season.toString();
    if (jQuery.type(default_doi) === 'string') { this._dates_.default_doi = this.dateToDateObj(default_doi);
    } else  if (jQuery.isArray(default_doi)) { this._dates_.default_doi = this.dayToDateObj(default_doi); }
    if (jQuery.type(doi) === 'string') { this._dates_.doi = this.dateToDateObj(doi);
    } else if (jQuery.isArray(doi)) { this._dates_.doi = this.dayToDateObj(doi); }
    this._updateView_();
}

ToolDatesManager.prototype.observedView = function(view) {
    var _view = view; if (typeof view === 'undefined') { _view = this.view; }
    if (typeof this._dates_.fcast_start !== 'undefined' && this._dates_.fcast_start != null) {
        var fcast_start = this._dates_.fcast_start;
        if (fcast_start <= _view.end && fcast_start >= _view.start) {
            return { doi:this.doi, end:this.pastDate(fcast_start), start:_view.start };
        }
    }
    return _view;
}

ToolDatesManager.prototype.pastDate = function(from_date, days_in_past) {
    if (typeof days_in_past !== 'undefined') { 
        return new Date(from_date.getTime() - days_in_past*this.ms_per_day);
    } else { return new Date(from_date.getTime() - this.ms_per_day); }
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
    } else { if (end > 0) { return this._days_.slice(0, end); } else { return; }  }
}

ToolDatesManager.prototype.update = function(dates_obj) {
    var changed = [];
    FRAPPLE.logObjectAttrs(dates_obj);
    if (typeof dates_obj.last_obs !== 'undefined') {
        var last_obs = this.dateToDateObj(dates_obj.last_obs);
        if (last_obs != this._dates_.last_obs) { this._dates_.last_obs = last_obs; changed.push("last_obs"); }
    }
    if (typeof dates_obj.fcast_start !== 'undefined') {
        var fcast_start = this.dateToDateObj(dates_obj.fcast_start);
        if (fcast_start != this._dates_.fcast_start) { this._dates_.fcast_start = fcast_start; changed.push("fcast_start"); }
    } else { this._dates_.fcast_start = null; changed.push("fcast_start"); }

    if (typeof dates_obj.fcast_end !== 'undefined') {
        var fcast_end = this.dateToDateObj(dates_obj.fcast_end);
        if (fcast_end != this._dates_.fcast_end) { this._dates_.fcast_end = fcast_end; changed.push("fcast_end"); }
    } else { this._dates_.fcast_end = null; changed.push("fcast_end");}

    if (typeof dates_obj.last_valid !== 'undefined') {
        var last_valid = this.dateToDateObj(dates_obj.last_valid);
        if (last_valid != this._dates_.last_valid) { this._dates_.last_valid = last_valid; changed.push("last_valid"); }
    }

    if (typeof dates_obj.season !== 'undefined' && dates_obj.season != this.season) { this._dates_.season = dates_obj.season; changed.push("season"); }
    if (typeof dates_obj.season_start !== 'undefined' && dates_obj.season_start != this.season_start) { this._dates_.season_start = dates_obj.season_start; changed.push("season_start"); }
    if (typeof dates_obj.season_end !== 'undefined' && dates_obj.season_end != this.season_end) { this._dates_.season_end = dates_obj.season_end; changed.push("season_end"); }
    if (changed.length > 0) { this._updateView_(); if ("datesChanged" in this._listeners_) { this._listeners_.datesChanged("datesChanged",changed); } }
}

ToolDatesManager.prototype.uploadSeasonDates = function() {
    var url = this.tool.tool_url + '/season';
    var query = JSON.stringify(this.view('data'));
    var options = { url:url, type:'post', dataType:'json', crossDomain:true, data:query,
        error: this.error_callbacks.season, success: this.upload_callbacks.season,
        beforeSend: function(xhr) { FRAPPLE.addCorsHeader(xhr); /*FRAPPLE.waitFor("season");*/ },
    }
    if ("seasonRequested" in this._listeners_) { this._listeners_.seasonRequested("seasonRequested",this.season); }
    jQuery.ajax(options);
}

ToolDatesManager.prototype.uploadStageDates = function(loc_obj) {
    var url = this.tool.tool_url + '/stage';
    var query = {location:{key:loc_obj.id, address:loc_obj.address, coords:[loc_obj.lat,loc_obj.lng]}, variety:loc_obj.variety, season:this.tool.dates.season};
    query = JSON.stringify(query);
    var options = { url:url, type:'post', dataType:'json', crossDomain:true, data:query,
                    error: this.error_callbacks.stage, success: this.upload_callbacks.stage,
                    beforeSend: function(xhr) { FRAPPLE.addCorsHeader(xhr); /*FRAPPLE.waitFor("stages");*/ }
    }
    if ("stagesRequested" in this._listeners_) { this._listeners_.stagesRequested("stagesRequested",loc_obj); }
    jQuery.ajax(options);
}

ToolDatesManager.prototype.view = function(view_type) {
    // view types are 'season', 'trend', 'data'
    var doi = this._dates_.doi
    var season_end = this._dates_.season_end;
    var season_start = this._dates_.season_start;
    var view = { doi:doi, end:season_end, start:season_start };
    if (view_type == 'season') {
        view = { doi:doi, end:this._dates_.last_valid, season_end:season_end, season_start:season_start, start:season_start };
    } else if (view_type == 'trend') { 
        view = { doi:doi, end:this._dates_.view_end, season_end:season_end, season_start:season_start, start:this._dates_.view_start };
    }
    this.tool.logObjectAttrs(view);
    return view;
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
    if ("viewChanged" in this._listeners_) { this._listeners_.viewChanged("viewChanged",this.view('trend')); }
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function ToolLocationsManager(tool) {
    var _listeners_, _locations_, _state_;
    this._listeners_ = { };
    this._locations_ = { };
    this._state_ = { address:null, doi:null, id:null, lat:null, lng:null, variety:null };

    var tool;1

    this.tool = tool;

    // protected properties
    Object.defineProperty(ToolLocationsManager.prototype, "doi", { configurable:false, enumerable:false,
        get:function() { return this._state_.doi; },
        set:function(new_date) {
            var doi = this.dateToDateObj(new_date);
            if (doi != this._state_.doi) {
                this._state_.doi = doi; this._locations_[this._state_.id].doi = doi;
                if ("doiChanged" in this._listeners_) { this._listeners_.doiChanged("doiChanged",doi); }
            }
        }
    });

    Object.defineProperty(ToolLocationsManager.prototype, "id", { configurable:false, enumerable:false,
        get:function() { return this._state_.id; },
        set:function(id) { this._state_.id = id; }
    });

    Object.defineProperty(ToolLocationsManager.prototype, "variety", { configurable:false, enumerable:true, 
        get:function() { return this._state_.variety; },
        set:function(variety) { 
            if (variety != this._state_.variety) { this._state_.variety = variety;
                if ("varietyChanged" in this._listeners_) { this._listeners_.varietyChanged("varietyChanged",variety); }
            }
        }
    });

    // immutable properties
    Object.defineProperty(ToolLocationsManager.prototype, "coords", { configurable:false, enumerable:false, get:function() { return [ this._state_.lat, this._state_.lng ]; } });
    Object.defineProperty(ToolLocationsManager.prototype, "address", { configurable:false, enumerable:false, get:function() { return this._state_['address']; } });
    Object.defineProperty(ToolLocationsManager.prototype, "lat", { configurable:false, enumerable:false, get:function() { return this._state_.lat; }, });
    Object.defineProperty(ToolLocationsManager.prototype, "lng", { configurable:false, enumerable:false, get:function() { return this._state_.lng; }, });
    Object.defineProperty(ToolLocationsManager.prototype, "locations", { configurable:false, enumerable:false, get:function() { return this._locations_; }, });
    Object.defineProperty(ToolLocationsManager.prototype, "state", { configurable:false, enumerable:false, get:function() { return jQuery.extend({}, this._state_); }, });
    Object.defineProperty(ToolLocationsManager.prototype, "query", { configurable:false, enumerable:false,
        get:function() { var wrap = function(str) { return '"' + str + '"' };
            return { doi:wrap(this._state_.doi), location: { address:wrap(this._state_.address), lat:this._state_.lat, lng:this._state_.lng, id:wrap(this._state_.id) }, variety:wrap(this._state_.variety) } },
    });
    Object.defineProperty(ToolLocationsManager.prototype, "supported_listeners", { configurable:false, enumerable:false, writable:false, value: ["doiChanged", "locationChanged", "varietyChanged"] });
}

// functions
ToolLocationsManager.prototype.addListener = function(event_type, function_to_call) {
    var index = this.supported_listeners.indexOf(event_type);
    if (index >= 0) { this._listeners_[event_type] = function_to_call; }
}

ToolLocationsManager.prototype.addLocation = function(new_id, new_loc) {
    var loc_obj = jQuery.extend({}, new_loc);
    loc_obj.id = new_id;
    if (!('doi' in loc_obj) || loc_obj.doi == null) { loc_obj.doi = this.doi; }
    if (!('variety' in loc_obj) || loc_obj.variety == null) { loc_obj.variety = this.variety; }
    var validated = this.validate(loc_obj);
    var invalid = validated[0];
    if (invalid.length == 0) { loc_obj = validated[1]; this._locations_[loc_obj.id] = loc_obj; }
}

ToolLocationsManager.prototype.addLocations = function(locations) { var self = this; jQuery.each(locations, function(id, loc_obj) { self.addLocation(id, loc_obj); }); }

ToolLocationsManager.prototype.areDifferent = function(loc_obj_1, loc_obj_1) {
    return ( (loc_obj_1.address != loc_obj_2.address) ||
             (loc_obj_1.id != loc_obj_2.id) ||
             (loc_obj_1.lat != loc_obj_2.lat) ||
             (loc_obj_1.lng != loc_obj_2.lng) );
}

ToolLocationsManager.prototype.dateToDateObj = function(date_value) {
    if (jQuery.type(date_value) === 'string') { return new Date(date_value+'T12:00:00-04:30'); 
    } else if (jQuery.isArray(date_value)) {
        if (date_value.length == 3) { return this.adjustTimeZone(new Date(date_value[0], date_value[1]-1, date_value[2]));
        } else if (date_value.length == 2) { return this.dayToDateObj(date_value); }
    } else { return this.adjustTimeZone(date_value); }
}

ToolLocationsManager.prototype.init = function(locations, default_location, default_doi, default_variety) {
    var loc_obj;
    var validated = [[], {}];

    if (default_doi) { this._state_.doi = this.tool.dateToDateObj(default_doi); }
    if (default_variety) { this._state_.variety = default_variety; }
    this.addLocations(locations);

    if (jQuery.type(default_location) === 'object') {
        validated = this.validate(default_location);
    } else if (jQuery.type(default_locaton) === 'string') {
        loc_obj = locations[default_locaton];
        if (!('doi' in loc_obj) || loc_obj.doi == null) { loc_obj.doi = this._state_.doi; }
        if (!('id' in loc_obj)) { loc_obj.id = default_location; }
        if (!('variety' in loc_obj) || loc_obj.variety == null) { loc_obj.variety = this._state_.variety; }
        validated =  this.validate(loc_obj);
    }
    if (validated[0].length == 0) { // gotta have a default !!!
        loc_obj = validated[1];
        this._locations_[loc_obj.id] = loc_obj;
        this._state_ = loc_obj; 
        if (loc_obj.id in locations) { delete locations[loc_obj.id]; }

    }
}

ToolLocationsManager.prototype.mergeLocations = function(locations) {
    var new_loc;
    var empty_loc = { address:null, doi:null, id:null, lat:null, lng:null, variety:null };
    var self = this;
    jQuery.each(locations, function(id, loc_obj) {
        if (!(self._locations_.hasOwnProperty(id))) {
           new_loc = jQuery.extend({}, empty_loc, loc_obj)
           if (new_loc.doi == null) { new_loc.doi = self._state_.doi; }
           if (new_loc.variety == null) { new_loc.variety = self._state_.variety; }
           self._locations_[id] = new_loc;
        }
    });
}

ToolLocationsManager.prototype.update = function(new_loc, fire_event) {
    var changed = [];
    this.tool.logObjectAttrs(new_loc);

    if (!('doi' in new_loc) || new_loc.doi == null) { new_loc.doi = this._state_.doi }
    if (!('variety' in new_loc) || new_loc.variety == null) { new_loc.variety = this._state_.variety }
    var result = this.validate(new_loc);
    if (result[0]) { // new location is valid
        var loc_obj = result[1];
        if (loc_obj.id != this._state_.id) { this._state_.id = loc_obj.id; changed.push('id'); }
        if (loc_obj.address != this._state_.address) { this._state_.address = loc_obj.address; changed.push("address");}
        if (loc_obj.doi != this._state_.doi) { this._state_.doi = loc_obj.doi; changed.push("doi"); }
        if (loc_obj.lat != this._state_.lat) { this._state_.lat = loc_obj.lat; changed.push("lat"); }
        if (loc_obj.lng != this._state_.lng) { this._state_.lng = loc_obj.lng; changed.push("lng"); }
        if (loc_obj.variety != this._state_.variety) { this._state_.variety = loc_obj.variety; changed.push("variety"); }
    }
    if (fire_event !== false && changed && "locationChanged" in this._listeners_) { this._listeners_.locationChanged("locationChanged",[changed,this.state]); }
}

ToolLocationsManager.prototype.validate = function(new_loc) {
    var loc_obj = { id:null, address:null, doi:null, lat:null, lng:null, variety:null }
    var invalid = [ ];
    if ("key" in new_loc && jQuery.type(new_loc.key) === 'string') { loc_obj.id = new_loc.key;
    } else if ("id" in new_loc && jQuery.type(new_loc.id) === 'string') { loc_obj.id = new_loc.id; 
    } else { invalid.push("id"); }
    if ("address" in new_loc && jQuery.type(new_loc.address) === 'string') { loc_obj.address = new_loc.address; } else { invalid.push("address"); }
    if ("coords" in new_loc) {
        if (Array.isArray(new_loc.coords) && new_loc.coords.length == 2) {
            if (jQuery.type(new_loc.coords[0]) === 'number') { loc_obj.lat = new_loc.coords[0]; loc_obj.lng = new_loc.coords[1]; } else { invalid.push("lat"); invalid.push("lng"); }
        } else { valid = false; }
    } else {
        if ("lat" in new_loc && jQuery.type(new_loc.lat) === 'number') { loc_obj.lat = new_loc.lat; } else { invalid.push("lat"); }
        if ("lng" in new_loc && jQuery.type(new_loc.lng) === 'number') { loc_obj.lng = new_loc.lng;
        } else if ("lon" in new_loc && jQuery.type(new_loc.lon) === 'number') { loc_obj.lng = new_loc.lon;
        } else { invalid.push("lng"); }
    }
    if ("doi" in new_loc && new_loc.doi instanceof Date) { loc_obj.doi = new_loc.doi; } else {  invalid.push("doi"); }
    if ("variety" in new_loc && jQuery.type(new_loc.variety) === 'string') { loc_obj.variety = new_loc.variety; } else { invalid.push("variety"); }
    return [invalid, loc_obj]
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// set state globals
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

var initializeToolManager = function() {
    jQuery.ajaxPrefilter(function(options, original_request, jqXHR) {
        jqXHR.original_request = original_request;
    });

    FRAPPLE.wait_widget = jQuery().CsfToolWaitWidget();

    FRAPPLE.dates = new ToolDatesManager(FRAPPLE);
    FRAPPLE.dates.init({{ season }}, {{ season_start_day }}, {{ season_end_day }}, '{{ default_doi }}', '{{ doi }}');
    FRAPPLE.dates.addListener('seasonRequested', function(ev,season_obj) { FRAPPLE.waitFor('days'); });
    FRAPPLE.dates.addListener('seasonDaysChanged', function(ev,season_obj) { FRAPPLE.dataAvailable('days'); });
    FRAPPLE.dates.addListener('stagesRequested', function(ev,loc_obj) { FRAPPLE.waitFor('stages'); });
    FRAPPLE.dates.addListener('stagesChanged', function(ev,stage_array) { FRAPPLE.dataAvailable('stages'); });

    FRAPPLE.dates.error_callbacks.season = function(jq_xhr, status_text, error_thrown) {
        console.log('BUMMER : request for Season Dates : Error Thrown : ' + error_thrown);
        console.log('  request : ' + jq_xhr.original_request.uri);
        console.log('  status : ' + status_text);
        console.log('  jqXHR : ' + jq_xhr.readyState, + ' : ' + jq_xhr.status + ' : ' + jq_xhr.statusText);
        console.log('  response text : ' + jq_xhr.responseText);
        console.log('  response xml : ' + jq_xhr.responseXML);
        console.log('  headers : ' + jq_xhr.getAllResponseHeaders());
    }
    FRAPPLE.dates.upload_callbacks.season = function(uploaded_obj, status_text, jq_xhr) {
        FRAPPLE.dates.days = uploaded_obj.season.dates;
        FRAPPLE.dates.update(uploaded_obj.season);
    }

    FRAPPLE.dates.error_callbacks.stage = function(jq_xhr, status_text, error_thrown) {
        console.log('BUMMER : request for Stage data : Error Thrown : ' + error_thrown);
        jQuery.each(jq_xhr.original_request, function(key, value) { console.log("    " + key + " : " + value); });
        console.log('  request : ' + jq_xhr.original_request.uri);
        console.log('  status : ' + status_text);
        console.log('  jqXHR : ' + jq_xhr.readyState, + ' : ' + jq_xhr.status + ' : ' + jq_xhr.statusText);
        console.log('  response text : ' + jq_xhr.responseText);
        console.log('  response xml : ' + jq_xhr.responseXML);
        console.log('  headers : ' + jq_xhr.getAllResponseHeaders());
    }
    FRAPPLE.dates.upload_callbacks.stage = function(uploaded_obj, status_text, jq_xhr) {
        FRAPPLE.dates.update(uploaded_obj.stage.dates);
        FRAPPLE.dates.stages = uploaded_obj.stage.data;
    }

    var default_location = { address:"{{ loc_address }}", doi:null, key:"{{ loc_key }}",
                             lat:{{ loc_lat }}, lng:{{ loc_lng }}, variety: "{{ default_variety }}" };
    var doi = FRAPPLE.dates.dateToDateObj("{{ doi }}");
    default_location['doi'] = doi;
    var locations = {{ locations_js }};
    FRAPPLE.locations = new ToolLocationsManager(FRAPPLE);
    FRAPPLE.locations.init(locations, default_location, doi, "{{ default_variety }}");

    FRAPPLE.data = new ToolDataManager(FRAPPLE);
    FRAPPLE.data.addListener('mintRequested', function(ev,loc_obj) { FRAPPLE.waitFor('mint'); });
    FRAPPLE.data.addListener('mintChanged', function(ev,mint_array) { FRAPPLE.dataAvailable('mint'); });
    FRAPPLE.data.addListener('riskRequested', function(ev,loc_obj) { FRAPPLE.waitFor('risk'); });
    FRAPPLE.data.addListener('riskChanged', function(ev,risk_obj) { FRAPPLE.dataAvailable('risk'); });

    FRAPPLE.data.error_callbacks.risk = function(jq_xhr, status_text, error_thrown) {
        console.log('BUMMER : requset for Freeze Risk Potential : Error Thrown : ' + error_thrown);
        console.log('  request : ' + jq_xhr.original_request.uri);
        console.log('  status : ' + status_text);
        console.log('  jqXHR : ' + jq_xhr.readyState, + ' : ' + jq_xhr.status + ' : ' + jq_xhr.statusText);
        console.log('  response text : ' + jq_xhr.responseText);
        console.log('  response xml : ' + jq_xhr.responseXML);
        console.log('  headers : ' + jq_xhr.getAllResponseHeaders());
    }

    FRAPPLE.data.upload_callbacks.risk = function(uploaded_obj, status_text, jq_xhr) {
        var loc_obj = uploaded_obj.risk.location;
        if (jQuery.type(loc_obj.variety) === 'undefined' && jQuery.type(uploaded_obj.risk.variety) !== 'undefined') { loc_obj["variety"] = uploaded_obj.risk.variety; }
        FRAPPLE.locations.update(loc_obj, false);
        FRAPPLE.data.risk = uploaded_obj.risk.data;
        FRAPPLE.data.mint = uploaded_obj.risk.data.mint;
    }
}
initializeToolManager();

