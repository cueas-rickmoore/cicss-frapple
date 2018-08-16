var loadAppleFrostToolStyles = function() {
    var csftool_url, frapple_url;
    var tool_server = jQuery('meta[name="toolserver"]').attr("content");
    if (typeof tool_server === 'undefined') {
        tool_server = jQuery('meta[name="toolserver"]').attr("value");
    }
    var index = tool_server.indexOf("frapple");
    if (index > 0) {
        csftool_url = tool_server.replace("frapple","csftool");
        frapple_url = tool_server;
    } else {
        csftool_url = tool_server + "/csftool";
        frapple_url = tool_server + "/frapple";
    }

    var dependency;
    var element = jQuery("head");
    dependency = document.createElement('link');
    dependency.setAttribute("rel","stylesheet");
    dependency.setAttribute("type","text/css");
    dependency.setAttribute("href", csftool_url + "/style/csftool.css");
    element.append(dependency);

    dependency = document.createElement('link');
    dependency.setAttribute("rel","stylesheet");
    dependency.setAttribute("type","text/css");
    dependency.setAttribute("href", csftool_url + "/style/csftool-spinner.css");
    element.append(dependency);

    dependency = document.createElement('link');
    dependency.setAttribute("rel","stylesheet");
    dependency.setAttribute("type","text/css");
    dependency.setAttribute("href", csftool_url + "/style/csftool-jquery-ui.css");
    element.append(dependency);

    dependency = document.createElement('link');
    dependency.setAttribute("rel","stylesheet");
    dependency.setAttribute("type","text/css");
    dependency.setAttribute("href", csftool_url + "/style/location-dialog-2.0.css");
    element.append(dependency);

    dependency = document.createElement('link');
    dependency.setAttribute("rel","stylesheet");
    dependency.setAttribute("type","text/css");
    dependency.setAttribute("href", frapple_url + "/style/frapple.css");
    element.append(dependency);
}
loadAppleFrostToolStyles();

