
var loadAppleFrostToolDependencies = function() {
    console.log("FRAPPLE : creating WAIT WIDGET in body");
    FRAPPLE.wait_widget = jQuery().CsfToolWaitWidget();
    console.log("FRAPPLE : sending data upload requests");
    FRAPPLE.uploadAllData();
}
loadAppleFrostToolDependencies();

