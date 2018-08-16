function loadCsfTool() {
    CSFAPP_SERVER = window.location.href;
    var meta = document.querySelector('meta[name="toolname"]');
    CSFTOOL_NAME = meta && meta.getAttribute("content");
    meta = document.querySelector('meta[name="toolserver"]');
    CSFTOOL_SERVER = meta && meta.getAttribute("content");
    CSFTOOL_URL = CSFTOOL_SERVER + '/' + CSFTOOL_NAME;

    script = document.createElement('script');
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", CSFTOOL_URL + "/js/load-dependencies.js");
    window.document.body.appendChild(script);

    script = document.createElement('script');
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", CSFTOOL_URL + "/js/toolinit.js");
    window.document.body.appendChild(script);
}

