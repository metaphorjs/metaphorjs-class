
module.exports = function(classes, item, cfg) {

    var classOrder = ["Class", "BaseClass", "Cache"];

    classes.sort(function(a, b){

        var aInx = classOrder.indexOf(a.name),
            bInx = classOrder.indexOf(b.name);

        if (aInx == bInx) {
            return 0;
        }
        if (aInx < 0) {
            return 1;
        }
        if (bInx < 0) {
            return -1;
        }
        return aInx < bInx ? -1 : 1;
    });
};