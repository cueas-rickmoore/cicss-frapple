
;jQuery(document).ready( function () {
    console.log("EVENT :: document is ready");

    FRAPPLE.wait_widget.widget_anchor = '#csftool-display';
    FRAPPLE.wait_widget.createDialog({ center_on: "#csftool-display", });
    FRAPPLE.wait_widget.bind("allItemsAvailable", function(items) {
        FRAPPLE.display("view", FRAPPLE.dates.view(FRAPPLE.display('chart_type')));
        FRAPPLE.display("draw");
        FRAPPLE.wait_widget.stop(true);
    });

    console.log("TOOLINIT :: creating user interface");
    var options = [
          [ 'varieties', FRAPPLE.varieties ],
          [ 'chart', 'default', FRAPPLE.default_chart ],
          [ 'chart', 'labels', FRAPPLE.button_labels ],
          [ 'chart', 'types', FRAPPLE.chart_types ],
          [ 'date', 'select', FRAPPLE.locations.doi ],
          [ 'date', 'button', FRAPPLE.csf_common_url+"/icons/calendar-24x24.png"],
          [ 'date', 'range', FRAPPLE.dates.season_start, FRAPPLE.dates.season_end ],
          [ 'date', 'years', FRAPPLE.min_year, FRAPPLE.max_year ],
          ];
    console.log('\n\nINITIALIZING USER INTERFACE');
    FRAPPLE.ui = jQuery(FRAPPLE.ui_anchor).AppleFrostUserInterface(options);
    FRAPPLE.ui.option('location', 'default',  FRAPPLE.locations.state);

    console.log('\n\nINITIALIZING DISPLAY');
    console.log("TOOLINIT :: creating display");
    options = [ [ 'chart_type', FRAPPLE.ui.option("chart") ],
                [ 'default', "trend" ],
                [ 'height', 450 ],
                [ 'labels', FRAPPLE.chart_labels ],
                [ 'location', FRAPPLE.locations.state ],
                [ 'season', FRAPPLE.dates.season_spread ],
                [ 'stages', FRAPPLE.stage_labels ],
                [ 'varieties', FRAPPLE.varieties ],
                [ 'view', FRAPPLE.dates.view(FRAPPLE.ui.option("chart")) ],
                [ 'width', 700 ],
              ];
    var result = jQuery(FRAPPLE.display_anchor).AppleFrostChart(FRAPPLE, options);
    FRAPPLE.chart_controller = result[0];
    FRAPPLE.display = result[1];
    FRAPPLE.display("bind", "drawing_complete", function(ev, drawn) { FRAPPLE.wait_widget.stop(true); });
    FRAPPLE.displayReady();
    console.log("TOOLINIT :: DISPLAY :: drawn : " + FRAPPLE.display("drawn"));
    FRAPPLE.display("bind", "series_drawn", function(ev, info) { console.log("EVENT :: SERIES DRAWN : " + info); });
    FRAPPLE.display("newChart");
    if (FRAPPLE.wait_widget.isavailable("mint") && FRAPPLE.wait_widget.isavailable("risk")) { FRAPPLE.display("draw"); }

    console.log("TOOLINIT :: intializing data change callbacks that need display");

    FRAPPLE.addListener("mintAvailable", function(ev) {
        console.log("CALLBACK :: data.mintAvailable executed");
        console.log("         wants to send 'addSeries mint' to DISPLAY");
    });

    FRAPPLE.addListener("riskAvailable", function(ev) {
        console.log("CALLBACK :: riskAvailable executed");
        console.log("         wants to send 'addSeries risk' to DISPLAY");
    });

    FRAPPLE.dates.addListener("seasonChanged", function(ev, year) {
        console.log("CALLBACK :: seasonChanged executed");
        FRAPPLE.uploadAllData();
    });

    FRAPPLE.dates.addListener("viewChanged", function(ev, view_obj) {
        console.log("CALLBACK :: dates.viewChanged : " + view_obj);
        if (FRAPPLE.display('chart_type') == "trend") {
            FRAPPLE.display('view', view_obj);
            FRAPPLE.display('draw');
        }
    });

    FRAPPLE.locations.addListener("doiChanged", function(ev, doi) {
        console.log("CALLBACK :: locations.doiChanged executed");
        FRAPPLE.dates.doi = doi;
    });

    FRAPPLE.locations.addListener("locationChanged", function(ev, changed) {
        var loc_obj = changed[1];
        console.log("CALLBACK :: locations.locationChanged executed");
        console.log("   tell DISPLAY about new location");
        FRAPPLE.logObjectAttrs(loc_obj);
        FRAPPLE.uploadLocationData();
    });

    FRAPPLE.locations.addListener("varietyChanged", function(ev, variety) {
        console.log("CALLBACK :: locations.varietyChanged executed");
        console.log("         wants to send 'variety' to DISPLAY");
        FRAPPLE.display("variety", variety);
        FRAPPLE.display("remove");
        FRAPPLE.uploadLocationData();
    });

    console.log("TOOLINIT :: initializing user interface callbacks");
    var ui = FRAPPLE.ui;
    console.log("FRAPPLE.ui");

    ui.option("bind", "chartChangeRequest", function(ev, chart_type) {
        console.log("CALLBACK :: ui.chartChangeRequest executed : " + chart_type);
        FRAPPLE.display("view", FRAPPLE.dates.view(chart_type));
        FRAPPLE.display("chart_type", chart_type);
        FRAPPLE.display("redraw");
    });
    console.log('ui.option("bind", "chartChangeRequest", function(ev, chart_type)');

    ui.option("bind", "dateChanged", function(ev, doi) {
        console.log("CALLBACK :: ui.dateChanged executed : " + doi);
        FRAPPLE.dates.doi = doi;
        FRAPPLE.locations.doi = doi;
    });
    console.log('ui.option("bind", "dateChanged", function(ev, doi)');

    ui.option("bind", "locationChanged", function(ev, loc_obj) {
        console.log("CALLBACK :: ui.locationChanged executed :");
        FRAPPLE.logObjectAttrs(loc_obj);
        if (jQuery.type(loc_obj.address) === 'undefined') {
            console.log("BAD LOCATION :: " + loc_obj.lat + " , " + loc_obj.lng);
        } else {
            FRAPPLE.display("location", loc_obj);
            FRAPPLE.display("reset");
            FRAPPLE.locations.update(loc_obj, true);
        }
    });
    console.log('ui.option("bind", "locationChanged", function(ev, loc_obj)');

    ui.option("bind", "locationChangeRequest", function(ev, loc_obj) {
        console.log("\n\n");
        console.log("CALLBACK :: ui.locationChangeRequest received : " + loc_obj.address);
        FRAPPLE.map_dialog("open", loc_obj.id);
    });
    console.log('ui.option("bind", "locationChangeRequest", function(ev, loc_obj)');

    ui.option("bind", "varietyChanged", function(ev, variety) {
        console.log("CALLBACK :: ui.varietyChanged executed : " + variety);
        FRAPPLE.locations.variety = variety;
    });
    console.log('ui.option("bind", "varietyChanged", function(ev, variety)');

    // draw any data that is wating on the chart to be fully functional
    // ??????????

    // create the map dialog last because the PHP site takes it's time
    // loading the Google Maps scripts
    if (typeof NO_MAP_DAILOG === 'undefined') {
        var options = { width:600, height:500, google:google, default:FRAPPLE.locations.state };
        console.log("\n\n\n\n\n==============\nTOOLINIT :: creating map dialog");
        jQuery("#csftool-input").append(FRAPPLE.map_dialog_container);
        jQuery(FRAPPLE.map_dialog_anchor).CsfToolLocationDialog(options);
        var map_dialog = jQuery(FRAPPLE.map_dialog_anchor).CsfToolLocationDialog();
        console.log("MAP DIALOG :: initialized");
        FRAPPLE.map_dialog = map_dialog;
        console.log("MAP DIALOG :: toolint trying to add locations : " + Object.keys(FRAPPLE.locations.locations));
        map_dialog("locations", FRAPPLE.locations.locations);

        map_dialog("bind", "close", function(ev, context) { 
            console.log("EVENT :: LocationDialog closed");
            jQuery.each(context, function(key, value) { console.log("    ATTRIBUTE " + key + " = " + value); });
            if (context.selected_location != context.initial_location) {
                console.log("    location changed from " + context.initial_location.address + " to " + context.selected_location.address);
                FRAPPLE.ui.option("location", context.selected_location);
            }
            console.log("EVENT :: END LocationDialog closed EVENT");
        });
        //map_dialog("bounds", [37.20, -82.70, 47.60, -66.90]); 
    }

});

