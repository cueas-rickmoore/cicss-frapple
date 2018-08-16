
;(function(jQuery) {

console.log("loading AppleFrostChart plugin");

var tooltipFormatter = function() {
    var i, item;
    var header = '<span style="font-size:14px;font-weight:bold;text-align:center">' + Highcharts.dateFormat('%b %d, %Y', this.x) + '</span>';
    var stage = null;
    var tips = "";
    for (i=0; i<this.points.length; i++) {
        item = this.points[i];
        if (item.series.type == "line") {
            tips += '<br/><span style="color:'+item.color+';font-size:12px;font-weight:bold">' +  item.series.name + ' : ' + item.y + '</span>';
            if (item.series.name.indexOf("10") > -1) {
                if (item.y < 0) { stage = '<br/><span style="color:#000000;font-size:12px;font-weight:bold">Stage : Dormant</span>'; 
                } else { 
                    stage = '<br/><span style="color:#000000;font-size:12px;font-weight:bold">Stage : ' + ChartController.stage_labels[item.y]; + '</span>';
                }
            }
        }
    }
    return header + stage + tips;
}

var ChartController = {
    area_threshold: -999.0,
    callbacks: { },
    chart: null,
    chart_anchor: "#csftool-display-chart",
    chart_labels: { },
    chart_type: null,
    chart_config: { chart:{type:"area"}, plotOptions:{series:{states:{hover:{enabled:true, halo:false}}}},
        credits: { text:"Powered by NRCC", href:"http://www.nrcc.cornell.edu/", color:"#000000" },
        title: { text: 'Potential for Freeze Damage' },
        subtitle: { text: 'location address', style:{"font-size":"14px", color:"#000000"} },
        xAxis: { type:'datetime', crosshair:{ width:1, color:"#ff0000", snap:true }, labels:{ style:{color:"#000000"} },
                 dateTimeLabelFormats:{ millisecond:'%H:%M:%S.%L', second:'%H:%M:%S', minute:'%H:%M', hour:'%H:%M', day:'%d %b', week:'%d %b', month:'%b<br/>%Y', year:'%Y' },
                 crosshair: { width:1, color:"#ff0000", snap:true, zIndex:10 },
                },
        yAxis: { title:{ text:'Temperature', style:{"font-size":"14px", color:"#000000"}}, gridZIndex:4, labels:{style:{color:"#000000"}},
                 },
        tooltip: { useHtml:true, shared:true, borderColor:"#000000", borderWidth:2, borderRadius:8, shadow:false, backgroundColor:"#ffffff",
                   style:{width:165,}, xDateFormat:"%b %d, %Y", positioner:function(){return {x:80, y:60}}, formatter:tooltipFormatter },
        legend: { floating:true, backgroundColor:"#ffffff", borderRadius:5, borderWidth:1, align:'left', verticalAlign:'top', x:70, y:50, width:165, zIndex:20 },
        series: [ ],
    },

    components: { // pointInterval is always 1 day in milliseconds
        "t10temp" : { name: "10% Damage Temp", zIndex:1, showInLegend:false,
                      type:"line", lineWidth:0, color:"#008b8b",
                      marker: { enabled:false, states:{hover:{enabled:false}} }
        },
        "t50area" : { name: '50% Damage Potential', zIndex:10,
                      type:"area", lineWidth:0, color:"#ffa500", 
                      marker: { enabled:false, states:{hover:{enabled:false}} }
        },
        "t50temp" : { name: "50% Damage Temp", zIndex:12,
                      type:"line", lineWidth:3, color:"#ffa500",
                      marker: { enabled:false, states:{hover:{enabled:false}} }
                       //marker: { enabled:true, fillColor: "#ffa500", lineWidth:1, lineColor:"#ffa500", radius:3, symbol:"circle" }
        },
        "t90temp" : { name: "90% Damage Temp", zIndex:1, showInLegend:false,
                      type:"line", lineWidth:0, color:"#ff0000",
                      marker: { enabled:false, states:{hover:{enabled:false}} }
        },
        // need dummy fill for "safe" mint values
        "mintarea" : { name: 'No Damage Potential', zIndex:3, showInLegend:false,
                       type:"area", lineWidth:0, color:"#ffffff", fillOpacity:1.0,
                       marker: { enabled:false, states:{hover:{enabled:false}} }
        },
        "mintemp" : { name: "Min Temperature", zIndex:15,
                      type:"line", lineWidth:2, color:"#0000ff",
                      marker: { enabled:true, fillColor: "#0000ff", lineWidth:1, lineColor:"#0000ff", radius:3, symbol:"circle" }
        },
        "mintfcast" : { name: "Min Temp Forecast", zIndex:14,
                        type:"line", lineWidth:0, color:"#4b0082",
                        marker: { enabled:true, fillColor: "#4b0082", lineWidth:1, lineColor:"#4b0082", radius:3, symbol:"circle" }
        },
    },

    data: { },
    default_chart: null,
    display_anchor: null,
    dom: '<div id="csftool-display-chart"></div>',
    drawn: [ ],
    event_types: [ "drawingComplete", "seriesDrawn"],
    initialized: false,
    location: null,
    required: ["mint","risk"],
    season: null,
    stage_labels: { },
    tool: null,
    variety: null,
    varieties: null,
    view: null,

    // FUNCTIONS
    highchartsIsAvailable: function() { return (typeof Highcharts !== "undefined"); },

    addSeries: function(data_type, data) {
        console.log("DISPLAY :: ADD SERIES : " + data_type);
        if (data && data.length > 1) {
            if (this.chart == null || typeof this.chart === 'undefined') { this.newChart(); }
            //this.setExtremes(data);
            var series = jQuery.extend(true, { id:data_type, data:data}, this.components[data_type]);
            if (data_type == "t50area" || data_type == "mintarea") { series["threshold"] = this.area_threshold; }
            this.validChart();
            if (this.drawn.indexOf(data_type) > -1) { this.remove(data_type); }
            console.log("    adding " + data_type + " series to chart");
            this.chart.addSeries(series, true);
            if (this.drawn.indexOf(data_type) < 0) { this.drawn.push(data_type); }
            this.execCallback("series_drawn", data_type);
        }
        this.complete();
    },

    allDrawn: function() {
        var all_drawn = true; var i; var self = this;
        jQuery.each(this.required, function(i, data_type) { if (self.drawn.indexOf(data_type) < 0) { all_drawn = false; } } );
        return all_drawn;
    },

    bind: function(event_type, callback) {
        console.log("DISPLAY :: BIND : " + event_type);
        console.log("      callback : " + callback)
        if (this.event_types.indexOf(event_type) > 0) { this.callbacks[event_type] = callback; }
    },

    clear: function() {
        while( this.chart.series.length > 0 ) { this.chart.series[0].remove(false); }; 
        this.drawn = [ ];
        //this.resetExtremes();
    },

    chartHeight: function(height) { this.chart_config.chart["height"] = height; },
    chartLabel: function(key, label) { this.chart_labels[key] = label; },
    chartLabels: function(labels) { this.chart_labels = jQuery.extend(this.chart_labels , labels); },
    chartType: function(chart_type) { this.chart_type = chart_type; },
    chartWidth: function(width) { this.chart_config.chart["width"] = width; },

    complete: function(reset) {
        console.log("DISPLAY :: complete : " + this.drawn);
        if (this.allDrawn()) { this.execCallback("drawing_complete"); }
    },

    dataExtremes: function(data_array) {
        var i, value;
        var max = -999.; var min = 999.;
        for (i = 0; i < data_array.length; i++) {
            value = data_array[i][1];
            if (value > max) { max = value; }
            if (value < min) { min = value; }
        }
        return [min, max];
    },

    draw: function() {
        console.log("\n\n\n\nDISPLAY :: DRAW ALL SERIES : " + this.chart_type);
        this.tool.logObjectAttrs(this.view);
        this.addSeries("mintemp", this.tool.observed("mint", this.view));
        //this.addSeries("mintfcast", this.tool.forecast("mint", this.view));
        this.addSeries("t10temp", this.tool.fullview("T10", this.view));
        this.addSeries("t50temp", this.tool.fullview("T50", this.view));
        this.addSeries("t90temp", this.tool.fullview("T90", this.view));
    },

    drawChartLabel: function() {
        console.log('\n\nSETTING CHART LABEL FOR : ' + this.chart_type);
        var label = this.chart_labels[this.chart_type]; 
        console.log('    raw label : ' + label);
        var index = label.indexOf('||date||')
        console.log("    index of '||datr||' : " + index);
        if (index >= 0) { label = label.replace('||date||', this.view.doi_str); 
        } else {
            index = label.indexOf('||season||')
            console.log("    index of '||season||' : " + index);
            if (index >= 0) { label = label.replace('||season||', this.season);
            } else {
                if (this.view.last_valid < this.view.season_end) {
                    label = this.chart_labels.season_end; 
                    index = label.indexOf('||season_end||');
                    console.log("    index of '||season_end||' : " + index);
                    if (index >= 0) { label = label.replace('||season_end||', this.view.season_end_str); }
                }
            }
        }
        console.log('\n\n');
        if (label) { this.chart.renderer.text(label, 325, 85).css({ color:"#000000", fontSize:"16px"}).add(); }
    },

    execCallback: function(event_type, info) {
        var callback = this.callbacks[event_type];
        if (callback) {
            if (info) { callback(event_type, [info,jQuery.extend([],this.drawn)]);
            } else { callback(event_type, jQuery.extend([],this.drawn)); }
        }
    },

    init: function(dom_element) {
        this.display_anchor = "#" + dom_element.id;
        jQuery(this.display_anchor).append(this.dom);
        console.log("DISPLAY :: dom initialized : " + jQuery(this.display_anchor).html());
        console.log("DISPLAY :: tool : " + this.tool);
        console.log("DISPLAY :: highcharts available " + this.highchartsIsAvailable());
        console.log("DISPLAY :: initializing Highcharts");
        Highcharts.setOptions({ global: { useUTC: false } });
        this.initialized = true;
        if (this.chart_type == null) {
            console.log("DISPLAY :: INIT : using default chart type : " + this.default_chart);
            this.chart_type = this.default_chart;
        }
    },

    locationChange: function(loc_obj) {
        console.log("DISPLAY :: set location :");
        this.tool.logObjectAttrs(loc_obj);

        if (this.location == null || loc_obj.address != this.location) {
            console.log("DISPLAY :: EVENT :: locationChanged : " + loc_obj.address);
            this.location = loc_obj.address;
        }
        if ("variety" in loc_obj) { this.varietyChange(loc_obj.variety) }
    },

    newChart: function() {
        console.log("DISPLAY :: newChart : chart type = " + this.chart_type);

        if (this.chart != null) {
            console.log("DISPLAY :: newChart : replace exsting chart");
            this.chart.destroy(); this.chart = null; 
        }
        var config = jQuery.extend(true, { }, this.chart_config);
        config.series = [ ];
        config.title.text = this.title();
        console.log("DISPLAY :: newChart : title : " + config.title.text);
        config.subtitle.text = this.subtitle();
        console.log("DISPLAY :: newChart : subtitle : " + config.subtitle.text);
        jQuery(this.chart_anchor).highcharts("Chart", config);
        this.chart = jQuery(this.chart_anchor).highcharts();
        this.drawChartLabel();

        this.drawn = [ ];
        this.x_axis_range = null;
        this.y_axis_range = null;
        console.log("DISPLAY :: newChart : READY FOR ACTION");
    },

    redraw: function() { this.newChart(); this.draw(); },
    refresh: function() { this.clear(); this.draw(); },
    remove: function(series_key) {
        console.log("DISPLAY :: remove series : " + (typeof series_key !== 'undefined'));
        console.log("           chart : " + this.chart);
        if (this.chart != null) {
            if (typeof series_key !== 'undefined') {
                console.log("DISPLAY :: looking for series : " + series_key);
                var i;
                var name = this.components[series_key].name;
                console.log("    searching for :: " + name); 
                var num_series = this.chart.series.length;
                for(i = 0; i < num_series; i++) {
                    console.log("    series " + i + " :: name = " + this.chart.series[i].name);
                    if (this.chart.series[i].name == name) {
                        console.log("    " + series_key + " is being removed");
                        this.chart.series[i].remove(); break; 
                    }
                }
                console.log("    chart :: " + this.chart);
            } else {
                console.log("DISPLAY :: destroying chart");
                this.chart.destroy(); this.chart = null;
            }
        }
    },

    resetExtremes: function() { this.yaxis_max = -999.0; this.yaxis_min = 999.0; },

    setOption: function(key, value) {
        console.log("DISPLAY :: SET OPTION : '" + key + "' = " + value);
        switch(key) {
            case "chart":
            case "chart_type": this.chartType(value); break;
            case "default": this.default_chart = value; break;
            case "height": this.chartHeight(value); break;
            case "labels": this.chartLabels(value); break;
            case "location": this.locationChange(value); break;
            case "remove": this.remove(value); break;
            case "season": this.season = value; break;
            case "stages": this.stageLabels(value); break;
            case "variety": this.varietyChange(value); break;
            case "varieties": this.varieties = value; break;
            case "view": this.setView(value); break;
            case "width": this.chartWidth(value); break;
        }
    },

    setOptions: function(options) {
        jQuery.each(options, function (i) {
            var option = options[i];
            for (var key in option) { ChartController.setOption(key, option[key]); }
        });
    },

    setView: function(view_obj) {
        console.log("DISPLAY :: setView : " + view_obj.doi);
        this.tool.logObjectAttrs(view_obj)
        this.view = jQuery.extend({}, view_obj);
        this.view['doi_str'] = this.view.doi.toISOString().split("T")[0];
        if (typeof this.view.season_end === 'string') { this.view['season_end_str'] = this.view.season_end;
        } else { this.view['season_end_str'] = this.view.season_end.toISOString().split("T")[0]; }
    },

    stageLabels: function(labels) { this.stage_labels = jQuery.extend(this.stage_labels , labels); },
    subtitle: function() { return "@ " + this.location; },
    title: function() { return this.varieties[this.variety] + " Freeze Damage Potential"; },
    validChart: function() { if (this.chart === null) { this.newChart(); } },

    varietyChange: function(variety) {
        console.log("DISPLAY :: varietyChange : " + variety);
        if (this.variety == null) { this.variety = variety;
        } else if (variety != this.variety) {
            this.variety = variety;
        }
    },
}

var jQueryDisplayProxy = function() {
    if (arguments.length == 1) {
        switch(arguments[0]) {
            case "chart": // return currently displayed chart type
            case "chart_type":
                return ChartController.chart_type;
                break;
            case "chart_anchor": return ChartController.chart_anchor; break;
            case "display_anchor": return ChartController.display_anchor; break;
            case "draw": ChartController.draw(); break;
            case "drawn": return ChartController.drawn; break;
            case "location": return ChartController.location; break;
            case "newChart": ChartController.newChart(); break;
            case "redraw": ChartController.redraw(); break;
            case "refresh": ChartController.refresh(); break;
            case "remove": ChartController.remove(); break;
            case "reset": ChartController.newChart(); break;
            case "season": return ChartController.season; break;
            case "start_date": return ChartController.start_date; break;
            case "variety": return ChartController.variety; break;
            case "view": return ChartController.view; break;
        } // end of single argument switch

    } else if (arguments.length == 2) {
        var arg_0 = arguments[0];
        var arg_1 = arguments[1];
        switch(arg_0) {
            case "options": ChartController.setOptions(arg_1); break;
            default: ChartController.setOption(arg_0, arg_1); break;
        } // end of 2 argument switch

    } else if (arguments[0] == "option") { ChartController.setOption(arguments[1], arguments[2]);
    } else if (arguments[0] == "bind") { ChartController.bind(arguments[1], arguments[2]); }
    return undefined;
}

jQuery.fn.AppleFrostChart = function(tool, options) {
    var dom_element = this.get(0);
    console.log("DISPLAY :: INITIALIZING PLUGIN : ");
    ChartController.tool = tool;
    if (jQuery.type(options) !== 'undefined') { 
        jQuery.each(options, function(i,option) { jQueryDisplayProxy.apply(jQueryDisplayProxy, option); });
    }
    ChartController.init(dom_element);
    console.log("DISPLAY :: EVENT :: AppleFrostChart plugin ready");
    return [ ChartController, jQueryDisplayProxy ];
}

})(jQuery);

