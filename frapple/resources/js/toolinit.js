
;jQuery(document).ready( function () {
    FRAPPLE.wait_widget.widget_anchor = '#csftool-display';
    FRAPPLE.wait_widget.createDialog({ center_on: "#csftool-display", });
    FRAPPLE.wait_widget.bind("allItemsAvailable", function(items) {
        FRAPPLE.display("view", FRAPPLE.dates.view(FRAPPLE.display('chart_type')));
        FRAPPLE.display("draw");
        FRAPPLE.wait_widget.stop(true);
    });

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
    FRAPPLE.ui = jQuery(FRAPPLE.ui_anchor).AppleFrostUserInterface(options);
    FRAPPLE.ui.option('location', 'default',  FRAPPLE.locations.state);

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
    FRAPPLE.display("newChart");
    if (FRAPPLE.wait_widget.isavailable("mint") && FRAPPLE.wait_widget.isavailable("risk")) { FRAPPLE.display("draw"); }

    FRAPPLE.dates.addListener("seasonChanged", function(ev, year) { FRAPPLE.uploadAllData(); });
    FRAPPLE.dates.addListener("viewChanged", function(ev, view_obj) {
        if (FRAPPLE.display('chart_type') == "trend") {
            FRAPPLE.display('view', view_obj);
            FRAPPLE.display('draw');
        }
    });

    FRAPPLE.locations.addListener("doiChanged", function(ev, doi) { FRAPPLE.dates.doi = doi; });
    FRAPPLE.locations.addListener("locationChanged", function(ev, changed) {
        var loc_obj = changed[1];
        FRAPPLE.logObjectAttrs(loc_obj);
        FRAPPLE.uploadLocationData();
    });
    FRAPPLE.locations.addListener("varietyChanged", function(ev, variety) {
        FRAPPLE.display("variety", variety);
        FRAPPLE.display("remove");
        FRAPPLE.uploadLocationData();
    });

    var ui = FRAPPLE.ui;
    ui.option("bind", "chartChangeRequest", function(ev, chart_type) {
        FRAPPLE.display("view", FRAPPLE.dates.view(chart_type));
        FRAPPLE.display("chart_type", chart_type);
        FRAPPLE.display("redraw");
    });
    ui.option("bind", "dateChanged", function(ev, doi) {
        FRAPPLE.dates.doi = doi;
        FRAPPLE.locations.doi = doi;
    });
    ui.option("bind", "locationChanged", function(ev, loc_obj) {
        if (jQuery.type(loc_obj.address) === 'undefined') {
            console.log("BAD LOCATION :: " + loc_obj.lat + " , " + loc_obj.lng);
        } else {
            FRAPPLE.display("location", loc_obj);
            FRAPPLE.display("reset");
            FRAPPLE.locations.update(loc_obj, true);
        }
    });
    ui.option("bind", "locationChangeRequest", function(ev, loc_obj) { FRAPPLE.map_dialog("open", loc_obj.id); });
    ui.option("bind", "varietyChanged", function(ev, variety) { FRAPPLE.locations.variety = variety; });

    // create the map dialog last because the PHP site takes it's time
    // loading the Google Maps scripts
    if (typeof NO_MAP_DAILOG === 'undefined') {
        var options = { width:600, height:500, google:google, default:FRAPPLE.locations.state };
        jQuery("#csftool-input").append(FRAPPLE.map_dialog_container);
        jQuery(FRAPPLE.map_dialog_anchor).CsfToolLocationDialog(options);
        var map_dialog = jQuery(FRAPPLE.map_dialog_anchor).CsfToolLocationDialog();
        FRAPPLE.map_dialog = map_dialog;
        map_dialog("locations", FRAPPLE.locations.locations);
        map_dialog("bind", "close", function(ev, context) { if (context.selected_location != context.initial_location) { FRAPPLE.ui.option("location", context.selected_location); } });
    }

});

