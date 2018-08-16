function loadCsfTool() {
    console.log('EXECUTING : FRAPPLE.loadCsfTool')
    CSFAPP_SERVER = window.location.href;
    //console.log('CSFAPP_SERVER : ' + CSFAPP_SERVER)
    var meta = document.querySelector('meta[name="toolname"]');
    CSFTOOL_NAME = meta && meta.getAttribute("content");
    //console.log('CSFTOOL_NAME : ' + CSFTOOL_NAME)
    meta = document.querySelector('meta[name="toolserver"]');
    CSFTOOL_SERVER = meta && meta.getAttribute("content");
    //console.log('CSFTOOL_SERVER : ' + CSFTOOL_SERVER)
    CSFTOOL_URL = CSFTOOL_SERVER + '/' + CSFTOOL_NAME;
    //console.log('CSFTOOL_URL : ' + CSFTOOL_URL)

    script = document.createElement('script');
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", CSFTOOL_URL + "/js/load-dependencies.js");
    window.document.body.appendChild(script);
    console.log("load-dependencies.js added to body");

    script = document.createElement('script');
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", CSFTOOL_URL + "/js/toolinit.js");
    window.document.body.appendChild(script);
    console.log("toolinit.js added to body");
}

