
;(function(jQuery) {

var adjustTimeZone = function(date_value) {
    console.log("UI.adjustTimeZone : " + date_value);
    return new Date(date_value.toISOString().split('T')[0]+'T12:00:00-04:30');
}

var dateToDateObject = function(date_value) {
    if (date_value instanceof Date) { return adjustTimeZone(date_value);
    } else if (Array.isArray(date_value)) { return adjustTimeZone(new Date(date_value[0], date_value[1]-1, date_value[2]));
    } else { return new Date(date_value+'T12:00:00-04:30'); }
}

var logObjectAttrs = function(obj) {
    jQuery.each(obj, function(key, value) { console.log("    ATTRIBUTE " + key + " = " + value); });
}

var ChartTypeInterface = {
    callback: null,
    chart_labels: null,
    chart_types: null,
    initialized: false,
    selected: "trend",
    toggle_button: null, // id of toggle button element

    bind: function (callback) { this.callback = callback; },
    execCallback: function(chart_type) { if (this.callback) { this.callback("chartChangeRequest", chart_type); } },

    init: function(toggle_button) {
        var init_chart = this.selected;
        var next_chart;
        this.toggle_button = toggle_button; // id of toggle button element
        if (init_chart == "trend" ) { next_chart = "season"; } else { next_chart = "trend"; }
        jQuery(toggle_button).addClass(init_chart);
        jQuery(toggle_button).button({ label: this.chart_labels[next_chart] });
        jQuery(toggle_button).click( function() { ChartTypeInterface.toggle(); } );
        this.initialized = true;
        return this;
    },

    install: function(ui_manager) { this.ui_manager = ui_manager; return this; },

    select: function(chart_type) {
        if (chart_type == "trend") {
            if (jQuery(this.toggle_button).hasClass("season")) {
                jQuery(this.toggle_button).removeClass("season");
                jQuery(this.toggle_button).addClass("trend");
                jQuery(this.toggle_button).button({ label: this.chart_labels["season"] });
            }
            this.selected = "trend";
            if (this.initialized) { this.execCallback("trend"); }
        } else if (chart_type == "season") {
            if (jQuery(this.toggle_button).hasClass("trend")) { 
                jQuery(this.toggle_button).removeClass("trend");
                jQuery(this.toggle_button).addClass("season");
                jQuery(this.toggle_button).button({ label: this.chart_labels["trend"] });
            }
            this.selected = "season";
            if (this.initialized) { this.execCallback("season"); }
        }
    },

    toggle: function() {
        console.log("UI :: toggle chart type");
        if (jQuery(this.toggle_button).hasClass("trend")) {
            jQuery(this.toggle_button).removeClass("trend");
            jQuery(this.toggle_button).addClass("season");
            jQuery(this.toggle_button).button({ label: this.chart_labels["trend"] });
            this.selected = "season";
            this.execCallback("season");
        } else if (jQuery(this.toggle_button).hasClass("season")) {
            jQuery(this.toggle_button).removeClass("season");
            jQuery(this.toggle_button).addClass("trend");
            jQuery(this.toggle_button).button({ label: this.chart_labels["season"] });
            this.selected = "trend";
            this.execCallback("trend");
        }
    },
}

var DateInterface = {
    anchor: null, // id of element where Datepicker will be displayed
    button_url: null,
    callbacks: { },
    current_year: null,
    datepicker: '#ui-datepicker-div', // id of element tha Datepicker creates for itself
    datepicker_input: null, // id of input element used to communicate with jQuery Datepicker
    date_format: "yy-mm-dd",
    initialized: false,
    max_date: null,
    min_date: null,
    selected: null,
    show_months: true,
    show_years: false,
    year_range: null,

    bind: function (ev, callback) { this.callbacks[ev] = callback; },
    callback: function (ev) { return this.callbacks[ev]; },

    dateRange: function() {
        if (arguments.length == 0) {
            return { min_date: this.min_date, max_date: this.max_date };
        } else if (arguments.length == 2) {
            this.min_date = dateToDateObject(arguments[0]);
            console.log("MIN DATE SET : " + this.min_date);
            this.max_date = dateToDateObject(arguments[1]);
            console.log("MAX DATE SET : " + this.max_date);
        }
    },

    execCallback: function(ev, data) {
        if (this.initialized) { if (ev in this.callbacks) { var result = this.callbacks[ev](ev, data); } }
    },

    init: function(anchor, datepicker_input) {
        // id of input element used to communicate with jQuery Datepicker
        this.datepicker_input = datepicker_input;
        // id of element where Datepicker's selected date will be displayed
        this.anchor = anchor;
        console.log("DATEPICKER.init :: creating a datepicker instance");
        var options = {
            autoclose: true,
            beforeShow: function() {
                console.log("DATEPICKER.beforeShow :: datepicker.hide()");
                jQuery(DateInterface.datepicker).hide();
                console.log('DATEPICKER.beforeShow :: "#frapple-date-selector" append(datepicker)');
                jQuery(DateInterface.anchor).append(jQuery(DateInterface.datepicker));
            },
			buttonImage: this.button_url,
			buttonImageOnly: true,
			buttonText: this.button_label,
            changeMonth: this.month_menu,
            changeYear: this.year_menu,
            dateFormat: this.date_format,
			gotoCurrent: true,
            onChangeMonthYear: function(year, month, datepicker) {
                console.log("datepicker.onChangeMonthYear : " + DateInterface.selected.getFullYear() + " : " + year);
            },
            onSelect: function(date_text, datepicker) {
                console.log("EVENT :: ui.datepicker is changing date of interest to " + date_text);
                DateInterface.selected = dateToDateObject(date_text);
                DateInterface.execCallback('dateChanged', date_text);
                jQuery("#ui-datepicker-div").hide();
            },
            showAnim: "clip",
            showButtonPanel: false,
			showOn: "button",
            showOtherMonths: true,
		}
        if (this.max_date != null && this.min_date != null) { 
            options['maxDate'] = this.max_date;
            options['minDate'] = this.min_date;
        }
        if (this.year_range != null) { 
            console.log("ADDING YEAR RANGE TO OPTIONS : " + this.year_range);
            options.changeYear = true;
            options['yearRange'] = this.year_range;
        }

        jQuery(this.datepicker_input).datepicker(options);
        this.initialized = true;
        console.log("DATEPICKER.init :: hiding the datepicker instance");
        jQuery(this.datepicker).hide();
        jQuery(this.datepicker_input).change(function () {
            console.log("datepicker.change :: " + this.value);
            DateInterface.execCallback("dateChanged", this.value);
        });
        jQuery("#ui-datepicker-div .ui-datepicker-header .ui-datepicker-title .ui-datepicker-year").change(
               function () { console.log("#ui-datepicker-year.change :: " + this.value);
                             //DateInterface.execCallback("yearChanged", this.value);
        });

        this.initialized = true;
        console.log("DATEPICKER :: ON INITIALIZE : SELECTED : " + this.selected);
        if (this.selected != null) { this.select(this.selected);
        } else { this.select(new Date().toISOString().split('T')[0]) }

        return this;
    },

    install: function(ui_manager) { this.ui_manager = ui_manager; return this; },

    select: function(new_date) {
        if (new_date) { this.selected = dateToDateObject(new_date); }
        console.log("EVENT : UI.initialized : " + this.initialized);
        console.log("EVENT : UI.date.select : " + this.selected);
        if (this.initialized) { jQuery(this.datepicker_input).datepicker("setDate", this.selected ); }
    },

    yearRange: function() {
        if (arguments.length == 0) {
            return { min_year: this.min_year, max_year: this.max_year };
        } else if (arguments.length == 1) {
            var min_year = arguments[0];
            console.log("MIN YEAR SET : " + min_year);
            var max_year = arguments[1];
            console.log("MAX YEAR SET : " + max_year);
            this.year_range = min_year.toString() + ":" + max_year.toString();
            console.log("YEAR RANGE SET : " + this.year_range);
            this.max_year = max_year;
            this.min_year = min_year;
        }
    },
}

var LocationInterface = {
    address_anchor: null, // id of element where address_text element will be appended
    address_text: '<span class="frapple-current-address">{{ address }}</span>',
    callbacks: { },
    change_button: null, // element id of location change button
    initialized: false,
    lat_text: null, // if of text element where latitude will be displayed
    lng_text: null, // id of text element where longitude will be displayed
    selected: null,
    ui_manager: null,

    bind: function (key, callback) { this.callbacks[key] = callback; },
    callback: function(ev) { return this.callbacks[ev]; },
    default: function(loc_obj) { this.select(loc_obj, false); },

    execCallback: function(ev, loc_arg) {
        if (this.initialized) {
            var callback = this.callbacks[ev];
            if (jQuery.type(callback) !== 'undefined') {
                var loc_obj = loc_arg;
                if (jQuery.type(loc_obj) === 'undefined') { loc_obj = this.selected; }
                console.log('EXEC CALLBACK :: LocationInterface.' + ev);
                logObjectAttrs(loc_obj);
                callback(ev, loc_obj);
                return true;
            } else { return false; }
        }
    },

    init: function(change_button, addr_anchor, lat_text_elem, lng_text_elem) {
        console.log("LOCATION INTERFACE :: init :");
        this.address_anchor = addr_anchor;
        this.lat_text = lat_text_elem;
        this.lng_text = lng_text_elem;
        this.change_button = change_button;

        if (this.selected) { this.update(this.selected); }
        jQuery(change_button).button( { label: "Change Location", } );
        jQuery(change_button).click(function() {
               console.log("EVENT :: Change Location button was clicked");
               LocationInterface.execCallback("locationChangeRequest");
        });
        this.initialized = true;
        return this;
    },

    install: function(ui_manager) { this.ui_manager = ui_manager; return this; },

    locationsAreDifferent: function(loc_obj_1, loc_obj_2) {
        return ( (loc_obj_1.address != loc_obj_2.address) ||
                 (loc_obj_1.lat != loc_obj_2.lat) ||
                 (loc_obj_1.lng != loc_obj_2.lng) );
    },

    select: function(loc_obj, exec_callback) {
        console.log("LOCATION INTERFACE :: set location : " + loc_obj.address);
        logObjectAttrs(loc_obj);
        selected = jQuery.extend({}, loc_obj);
        var changed = false;
        if (this.selected == null || this.locationsAreDifferent(selected,this.selected)) {
            if (this.initialized) { this.update(selected); }
            this.ui_manager.locationChanged(loc_obj);
            if (selected && exec_callback !== false) {
                console.log("EVENT :: LOCATION INTERFACE : location changed to " + selected.address);
                this.execCallback("locationChanged", jQuery.extend({}, selected));
            }
            this.selected = selected;
        } else if (selected.key != this.selected.key) { // location key was changed but not location data
            this.selected.key = selected.key;
        }
    },

    setDefault: function(loc_obj) {
        logObjectAttrs(loc_obj);
        this.default_location = jQuery.extend({}, loc_obj);
    },

    update: function(loc_obj) {
        var address = null;
        var index = loc_obj.address.indexOf(", USA");
        if (index > 0) { address = loc_obj.address.replace(", USA","");
        } else { address = loc_obj.address; }
        var parts = address.split(", ");
        if (parts.length > 1) {
            address = this.address_text.replace("{{ address }}", parts[0]) + '</br>' + 
                      this.address_text.replace("{{ address }}", parts.slice(1).join(", "));
        } else { address = this.address_text.replace("{{ address }}", address); }
        console.log("LOCATION INTERFACE :: updating address :");
        console.log(address);

        console.log("      adding address to : " + this.address_anchor);
        jQuery(this.address_anchor).empty().append(address);
        jQuery(this.lat_text).empty().append(loc_obj.lat.toFixed(6));
        jQuery(this.lng_text).empty().append(loc_obj.lng.toFixed(6));
    },
}

var varietyChangeRequest = function() {
    //var selected = document.querySelector('input[name="select-apple-variety"]:checked').value;
    var selected = jQuery(VarietyInterface.input_checked).val();
    console.log("VARIETY :: CHANGE REQESTED : " + selected);
    VarietyInterface.execCallback(selected);
}

var VarietyInterface = {
    anchor: null,
    callback: null,
    initialized: false,
    input_checked: null,
    input_selector: null,
    selected: null,
    varieties: null,

    bind: function (callback) { this.callback = callback; },

    default: function() {
        if (arguments.length == 0) { return this.default_variety;
        } else if (arguments.length == 1) {
            var variety = arguments[0];
            if (variety != this.default_variety) { this.default_variety = variety; }
        }
    },

    execCallback: function(variety) { if (this.initialized && this.callback) { this.callback("varietyChanged", variety); } },

    init: function(variety_anchor, variety_inputs) {
        console.log("VARIETY INTERFACE :: initializing");
        console.log("        variety = " + this.selected);
        this.anchor = variety_anchor;
        this.input_checked = 'input[name="' + variety_inputs + '"]:checked';
        console.log('        checked : ' + this.input_checked);
        this.input_selector = 'input[name="' + variety_inputs + '"][value="{{ variety }}"]';
        console.log('        selector : ' + this.input_selector);
        jQuery.each(document.getElementsByName(variety_inputs),
               function () { 
                   console.log("ASSIGNING CLICK EVENT LISTENER TO :: " + this.value);
                   this.addEventListener("click", varietyChangeRequest); });
        if (this.selected) { this.toggle(this.selected); }
        this.initialized = true;
        return this;
    },

    install: function(ui_manager) { this.ui_manager = ui_manager; return this; },

    select: function(variety, exec_callback) {
        console.log('\n\nVARIETY INTERFACE :: already selected "' + this.selected + '" : trying to select "' + variety + '"');
        console.log("       exec_callback : " + exec_callback + " : exec_callback !== false : " + (exec_callback !== false));
        if (this.initialized) {
            // variety == selected when called by "click" event listener, toggle not necessary
            if (this.selected) {
                if (variety != this.selected) {
                    this.toggle(variety);
                    if (exec_callback !== false) { this.execCallback(variety); }
                }
            } else {
                console.log('        setting input selector for ' + variety);
                jQuery(this.input_selector.replace('{{ variety }}',variety)).prop("checked", true);
                console.log('        selector set for ' +  jQuery(this.input_checked).val());
                this.selected = variety;
            }
        } else { this.selected = variety; }
        console.log("       selected = " + this.selected + " (" + variety +")\n\n");
    },

    setVarieties: function(varieties) { this.varieties = jQuery.extend({}, varieties); },

    toggle: function(variety) {
        var selected = jQuery(this.input_checked).val();
        console.log("       variety : " + variety);
        console.log("      selected : " + selected);
        if (selected != variety) {
            console.log("             unchecking selected variety"); 
            jQuery(this.input_selector.replace('{{ variety }}',selected)).prop("checked", false);
            console.log("             now selected : " +  jQuery(this.input_checked).val());
        }
        console.log('                 attempting to check "' + this.selected + '"'); 
        jQuery(this.input_selector.replace('{{ variety }}',variety)).prop("checked", true);
        this.selected = jQuery(this.input_checked).val();
        console.log("             now selected : " + this.selected);
    },

    variety: function() { return jQuery(this.input_checked).val(); },
}

var InterfaceManager = {
    anchor_element: null,
    dom: ['<div id="frapple-location">',
          '<span class="csftool-em">Current Location :</span>',
          '<div id="frapple-location-address"> </div>',
          '<span class="csftool-em">Latitude : </span><span id="frapple-current-lat"> </span>',
          '<br/><span class="csftool-em">Longitude : </span><span id="frapple-current-lng"> </span>',
          '<button id="frapple-change-location"></button>',
          '</div>',
          '<div id="frapple-date">',
          '<span class="csftool-em">Date of Interest:</span>',
          '<div id="frapple-date-selector">',
          '<input type="text" id="frapple-datepicker">',
          '</div>',
          '</div>',
          '<div id="frapple-varieties">',
          '<span class="csftool-em">Apple Variety</span>',
          '<form id="variety-selector">',
          '<input type="radio" name="select-apple-variety" id="empire" value="empire"></input>&nbsp;Empire<br/>',
          '<input type="radio" name="select-apple-variety" id="mac_geneva" value="mac_geneva"></input>&nbsp;MacIntosh (Geneva)<br/>',
          '<input type="radio" name="select-apple-variety" id="red_delicious" value="red_delicious"></input>&nbsp;Red Delicious',
          '</form>',
          '</div>',
          '<div id="frapple-chart-button">',
          '<div id="frapple-toggle-display">',
          '<button id="frapple-toggle-button"></button>',
          '</div>',
          '</div>',
          '</div>'].join(''),
    
    address_anchor: "#frapple-location-address",
    chart_selector: "#frapple-toggle-button",
    chart_ui: null,
    date_ui: null,
    date_ui_anchor: "#frapple-date-selector",
    datepicker_input: "#frapple-datepicker",
    lat_element: "#frapple-current-lat",
    location_button: "#frapple-change-location",
    location_ui: null,
    lng_element: "#frapple-current-lng",
    variety_inputs: "select-apple-variety",
    variety_ui: null,
    variety_ui_anchor: "#variety-selector",

    initInterfaces: function() {
        VarietyInterface.init(this.variety_ui_anchor, this.variety_inputs);
        ChartTypeInterface.init(this.chart_selector);
        DateInterface.init(this.date_ui_anchor, this.datepicker_input);
        LocationInterface.init(this.location_button, this.address_anchor, this.lat_element, this.lng_element);
    },

    installHtml: function(dom_element) {
        dom_element.innerHTML = this.dom;
        this.anchor_element = dom_element.id;
        this.variety_ui = VarietyInterface.install(this);
        this.chart_ui = ChartTypeInterface.install(this);
        this.date_ui = DateInterface.install(this);
        this.location_ui = LocationInterface.install(this);
        return this;
    },

    locationChanged: function(loc_obj) {
        if ("doi" in loc_obj) { this.date_ui.select(loc_obj.doi); }
        if ("variety" in loc_obj) { this.variety_ui.select(loc_obj.variety, false); }
    },
}

var AppleFrostUIProxy = {
  chart_ui: null,
  date_ui: null,
  location_ui: null,
  ui_manager: null,
  variety_ui: null,

  init: function(dom_element, options) {
    this.ui_manager = InterfaceManager.installHtml(dom_element);
    this.variety_ui = this.ui_manager.variety_ui;
    this.chart_ui = this.ui_manager.chart_ui;
    this.date_ui = this.ui_manager.date_ui;
    this.location_ui = this.ui_manager.location_ui;
    var self = this;
    if (options) { jQuery.each(options, function(i,option) { self.option.apply(self, option); }); }
    this.ui_manager.initInterfaces();
    return this;
  },

  option: function() {
    var num_args = arguments.length
    var subset = arguments[0];

    if (num_args == 1) {
      switch(subset) {
        case "chart": return this.chart_ui.selected; break;
        case "date": return this.date_ui.selected; break;
        case "location": return jQuery.extend({}, this.location_ui.current_location); break;
        case "variety": return this.variety_ui.selected; break;
        case "varieties": return this.variety_ui.varieties; break;
      }

    } else if (num_args == 2) {
      //console.log("UI :: OPTION :: trying to set  :: " + subset + " : " + arguments[1]);
      switch(subset) {
        case "callback": {
          switch(arguments[1]) {
          case "chartChangeRequest": return this.chart_ui.callback; break;
          case "dateChanged": return this.date_ui.callback('dateChanged'); break;
          case "locationChanged": return this.location_ui.callback("locationChanged"); break;
          case "locationChangeRequest": return this.location_ui.callback("locationChangeRequest"); break;
          case "varietyChangeRequest": return this.variety_ui.callback; break;
          case "yearChanged": return this.date_ui.callback('yearChanged'); break;
          }
        } break;
        case "chart": {
          switch(arguments[1]) {
            case "hide_selector": this.chart_ui.hideChartSelector(); break;
            case "selected": return this.chart_ui.selected; break;
            case "show_selector": this.chart_ui.showChartSelector(); break;
            case "toggle": this.chart_ui.toggle(); break;
            case "types": return jQuery.extend({}, this.chart_ui.chart_types); break;
            default: this.chart_ui.select(arguments[1]); break;
          }
        } break;
        case "date": {
          switch(arguments[1]) {
            case "range": return { min_date: this.date_ui.min_date, max_date: this.date_ui.max_date }; break;
            case "initial": return InterfaceManager.initial_date; break;
            case "years": this.date_ui.year_range; break;
            default: this.date_ui.select(arguments[1]); break;
          }
        } break;
        case "location": this.location_ui.select(arguments[1]); break; 
        case "variety": { var arg = arguments[1]; 
          switch(arguments[1]) {
            case "selected": return this.variety_ui.selected; break;
            case "checked": return this.variety_ui.checked(); break;
            default: this.variety_ui.select(arguments[1]); break;
          }
        } break;
        case "varieties": this.variety_ui.setVarieties(arguments[1]); break;
        case "variety": { this.variety_ui.select(arguments[1]); } break;
      }

    } else if (num_args == 3) {
      //console.log("UI :: OPTION :: trying to set  :: " + subset + " : " + arguments[1] + " : " + arguments[2]);
      switch(subset) {
        case "bind": {
          switch(arguments[1]) {
            case "chartChangeRequest": this.chart_ui.bind(arguments[2]); break;
            case "dateChanged": this.date_ui.bind('dateChanged', arguments[2]); break;
            case "locationChanged": this.location_ui.bind("locationChanged", arguments[2]); break;
            case "locationChangeRequest": this.location_ui.bind("locationChangeRequest", arguments[2]); break;
            case "varietyChanged": this.variety_ui.bind(arguments[2]); break;
            case "yearChanged": this.date_ui.bind('yearChanged', arguments[2]); break;
          }
        } break;
        case "chart": {
          switch(arguments[1]) {
            case "default": this.chart_ui.select(arguments[2], false); break;
            case "labels": this.chart_ui.chart_labels = jQuery.extend({}, arguments[2]); break;
            case "types": this.chart_ui.chart_types = jQuery.extend([], arguments[2]); break;
          }
        } break;
        case "date": {
          switch(arguments[1]) {
            case "button": this.date_ui.button_url = arguments[2]; break;
            case "range": this.date_ui.dateRange.apply(this.date_ui,arguments[2]); break;
            case "select": this.date_ui.select(arguments[2]); break;
            case "years": this.date_ui.yearRange.apply(this.date_ui,arguments[2]); break;
          }
        } break;
        case "location": { if(arguments[1] == "default") { this.location_ui.select(arguments[2], false); } } break;
        case "select": {
          switch(arguments[1]) {
            case "chart": this.chart_ui.select(arguments[2]); break;
            case "date": this.date_ui.select(arguments[2]); break;
            case "variety": this.variety_ui.select(arguments[2]);
          }
        } break;
      }

    } else if (num_args == 4) {
      //console.log("UI :: OPTION :: trying to set  :: " + subset + " : " + arguments[1] + " : " + arguments[2] + " : " + arguments[3]);
      if (subset == "date") {
        var arg_1 = arguments[1];
        if (arg_1 == "range") { this.date_ui.dateRange(arguments[2],arguments[3]);
        } else if (arg_1 == "years") { this.date_ui.yearRange(arguments[2],arguments[3]); }
      } else if (subset == "select" && arguments[1] == "variety" ) { this.variety_ui.select(arguments[2], arguments[3]); }
    }
  },
}

jQuery.fn.AppleFrostUserInterface = function(options) {
    var dom_element = this.get(0);
    var proxy = AppleFrostUIProxy.init(dom_element, options);
    console.log("EVENT :: AppleFrostUserInterface plugin ready");
    return proxy;
}

})(jQuery);

