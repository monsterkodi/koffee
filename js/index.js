// koffee 1.18.0
(function() {
    var key, ref, val;

    ref = require('./koffee');
    for (key in ref) {
        val = ref[key];
        exports[key] = val;
    }

}).call(this);
