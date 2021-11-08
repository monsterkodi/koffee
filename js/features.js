// koffee 1.18.0

/*
00000000  00000000   0000000   000000000  000   000  00000000   00000000   0000000  
000       000       000   000     000     000   000  000   000  000       000       
000000    0000000   000000000     000     000   000  0000000    0000000   0000000   
000       000       000   000     000     000   000  000   000  000            000  
000       00000000  000   000     000      0000000   000   000  00000000  0000000
 */

(function() {
    var FEATURES, hasFeature, helpers, injectFeature, logFeatures;

    helpers = require('./helpers');

    helpers.colors();

    FEATURES = [
        {
            flag: 'color',
            key: 'color',
            desc: 'output with ansi colors',
            enabled: true
        }, {
            flag: 'config-parameters',
            key: 'config_parameters',
            desc: 'enable config parameters',
            enabled: true
        }, {
            flag: 'console-shortcut',
            key: 'console_shortcut',
            desc: 'replace log with console.log',
            enabled: true
        }, {
            flag: 'constructor-shortcut',
            key: 'constructor_shortcut',
            desc: 'replace @: with constructor:',
            enabled: true
        }, {
            flag: 'header',
            key: 'header',
            desc: 'prefix with koffee version header',
            enabled: false
        }, {
            flag: 'negative-index',
            key: 'negative_index',
            desc: 'replace a[-1] with a[-1..-1]',
            enabled: true
        }, {
            flag: 'optional-commata',
            key: 'optional_commata',
            desc: 'insert commata when possible',
            enabled: true
        }, {
            flag: 'rewrite',
            key: 'rewrite',
            desc: 'rewrite tokens',
            enabled: true
        }, {
            flag: 'meta',
            key: 'meta',
            desc: 'meta',
            enabled: true
        }
    ];

    hasFeature = function(options, feature) {
        var ref;
        return (options != null ? (ref = options.feature) != null ? ref[feature] : void 0 : void 0) !== false;
    };

    injectFeature = function(options) {
        var extend, feature, merge, o, ref, ref1;
        ref = require('./helpers'), extend = ref.extend, merge = ref.merge;
        if (options != null) {
            options;
        } else {
            options = {};
        }
        feature = {};
        FEATURES.map(function(f) {
            return feature[f.key] = f.enabled;
        });
        o = extend({}, options);
        o.feature = extend(feature, (ref1 = options.feature) != null ? ref1 : {});
        return o;
    };

    logFeatures = function() {
        var logMetas;
        console.log("\n" + (gray('Features:')) + "\n\n" + (FEATURES.map(function(f) {
            return "    " + (helpers.pad(f.flag)) + (gray(f.desc));
        }).join('\n')) + "\n");
        logMetas = require('./meta').logMetas;
        return logMetas();
    };

    module.exports = {
        FEATURES: FEATURES,
        injectFeature: injectFeature,
        logFeatures: logFeatures,
        hasFeature: hasFeature
    };

}).call(this);
