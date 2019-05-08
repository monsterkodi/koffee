// generated by koffee 0.25.0

/*
00000000  00000000   0000000   000000000  000   000  00000000   00000000   0000000  
000       000       000   000     000     000   000  000   000  000       000       
000000    0000000   000000000     000     000   000  0000000    0000000   0000000   
000       000       000   000     000     000   000  000   000  000            000  
000       00000000  000   000     000      0000000   000   000  00000000  0000000
 */
var FEATURES, hasFeature, injectFeature, logFeatures;

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
    var defaultFeatures, extend, feature, ref;
    if (options != null) {
        options;
    } else {
        options = {};
    }
    defaultFeatures = {};
    FEATURES.map(function(f) {
        return defaultFeatures[f.key] = f.enabled;
    });
    extend = require('./helpers').extend;
    feature = extend(defaultFeatures, (ref = options.feature) != null ? ref : {});
    options = extend({
        feature: feature
    }, options);
    return options;
};

logFeatures = function() {
    var gray, logMetas, pad;
    pad = require('./helpers').pad;
    gray = require('colorette').gray;
    console.log("\n" + (gray('Features:')) + "\n\n" + (FEATURES.map(function(f) {
        return "    " + (pad(f.flag)) + (gray(f.desc));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmVhdHVyZXMuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQVFBLFFBQUEsR0FBVztJQUNQO1FBQUUsSUFBQSxFQUFNLE9BQVI7UUFBZ0MsR0FBQSxFQUFLLE9BQXJDO1FBQTZELElBQUEsRUFBTSx5QkFBbkU7UUFBdUcsT0FBQSxFQUFTLElBQWhIO0tBRE8sRUFFUDtRQUFFLElBQUEsRUFBTSxtQkFBUjtRQUFnQyxHQUFBLEVBQUssbUJBQXJDO1FBQTZELElBQUEsRUFBTSwwQkFBbkU7UUFBdUcsT0FBQSxFQUFTLElBQWhIO0tBRk8sRUFHUDtRQUFFLElBQUEsRUFBTSxrQkFBUjtRQUFnQyxHQUFBLEVBQUssa0JBQXJDO1FBQTZELElBQUEsRUFBTSw4QkFBbkU7UUFBdUcsT0FBQSxFQUFTLElBQWhIO0tBSE8sRUFJUDtRQUFFLElBQUEsRUFBTSxzQkFBUjtRQUFnQyxHQUFBLEVBQUssc0JBQXJDO1FBQTZELElBQUEsRUFBTSw4QkFBbkU7UUFBdUcsT0FBQSxFQUFTLElBQWhIO0tBSk8sRUFLUDtRQUFFLElBQUEsRUFBTSxRQUFSO1FBQWdDLEdBQUEsRUFBSyxRQUFyQztRQUE2RCxJQUFBLEVBQU0sbUNBQW5FO1FBQXVHLE9BQUEsRUFBUyxLQUFoSDtLQUxPLEVBTVA7UUFBRSxJQUFBLEVBQU0sZ0JBQVI7UUFBZ0MsR0FBQSxFQUFLLGdCQUFyQztRQUE2RCxJQUFBLEVBQU0sOEJBQW5FO1FBQXVHLE9BQUEsRUFBUyxJQUFoSDtLQU5PLEVBT1A7UUFBRSxJQUFBLEVBQU0sa0JBQVI7UUFBZ0MsR0FBQSxFQUFLLGtCQUFyQztRQUE2RCxJQUFBLEVBQU0sOEJBQW5FO1FBQXVHLE9BQUEsRUFBUyxJQUFoSDtLQVBPLEVBUVA7UUFBRSxJQUFBLEVBQU0sU0FBUjtRQUFnQyxHQUFBLEVBQUssU0FBckM7UUFBNkQsSUFBQSxFQUFNLGdCQUFuRTtRQUF1RyxPQUFBLEVBQVMsSUFBaEg7S0FSTyxFQVNQO1FBQUUsSUFBQSxFQUFNLE1BQVI7UUFBZ0MsR0FBQSxFQUFLLE1BQXJDO1FBQTZELElBQUEsRUFBTSxNQUFuRTtRQUF1RyxPQUFBLEVBQVMsSUFBaEg7S0FUTzs7O0FBWVgsVUFBQSxHQUFhLFNBQUMsT0FBRCxFQUFVLE9BQVY7QUFBc0IsUUFBQTttRUFBa0IsQ0FBQSxPQUFBLG9CQUFsQixLQUE4QjtBQUFwRDs7QUFFYixhQUFBLEdBQWdCLFNBQUMsT0FBRDtBQUVaLFFBQUE7O1FBQUE7O1FBQUEsVUFBVzs7SUFFWCxlQUFBLEdBQWtCO0lBQ2xCLFFBQVEsQ0FBQyxHQUFULENBQWEsU0FBQyxDQUFEO2VBQU8sZUFBZ0IsQ0FBQSxDQUFDLENBQUMsR0FBRixDQUFoQixHQUF5QixDQUFDLENBQUM7SUFBbEMsQ0FBYjtJQUVFLFNBQVcsT0FBQSxDQUFRLFdBQVI7SUFFYixPQUFBLEdBQVUsTUFBQSxDQUFPLGVBQVAsMENBQTBDLEVBQTFDO0lBRVYsT0FBQSxHQUFVLE1BQUEsQ0FBTztRQUFFLE9BQUEsRUFBUyxPQUFYO0tBQVAsRUFBNkIsT0FBN0I7V0FDVjtBQVpZOztBQWNoQixXQUFBLEdBQWMsU0FBQTtBQUVWLFFBQUE7SUFBRSxNQUFRLE9BQUEsQ0FBUSxXQUFSO0lBQ1IsT0FBUyxPQUFBLENBQVEsV0FBUjtJQUFtQixPQUFBLENBQzlCLEdBRDhCLENBQzFCLElBQUEsR0FBSSxDQUFDLElBQUEsQ0FBSyxXQUFMLENBQUQsQ0FBSixHQUFzQixNQUF0QixHQUEyQixDQUFFLFFBQVEsQ0FBQyxHQUFULENBQWEsU0FBQyxDQUFEO2VBQU8sTUFBQSxHQUFNLENBQUMsR0FBQSxDQUFJLENBQUMsQ0FBQyxJQUFOLENBQUQsQ0FBTixHQUFtQixDQUFDLElBQUEsQ0FBSyxDQUFDLENBQUMsSUFBUCxDQUFEO0lBQTFCLENBQWIsQ0FBc0QsQ0FBQyxJQUF2RCxDQUE0RCxJQUE1RCxDQUFGLENBQTNCLEdBQWdHLElBRHRFO0lBRzVCLFdBQWEsT0FBQSxDQUFRLFFBQVI7V0FDZixRQUFBLENBQUE7QUFQVTs7QUFTZCxNQUFNLENBQUMsT0FBUCxHQUFpQjtJQUFFLFVBQUEsUUFBRjtJQUFZLGVBQUEsYUFBWjtJQUEyQixhQUFBLFdBQTNCO0lBQXdDLFlBQUEsVUFBeEMiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4wMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbjAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgIFxuMDAwICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgXG4jIyNcblxuRkVBVFVSRVMgPSBbXG4gICAgeyBmbGFnOiAnY29sb3InICAgICAgICAgICAgICAgICBrZXk6ICdjb2xvcicgICAgICAgICAgICAgICAgIGRlc2M6ICdvdXRwdXQgd2l0aCBhbnNpIGNvbG9ycycgICAgICAgICAgIGVuYWJsZWQ6IHRydWUgIH1cbiAgICB7IGZsYWc6ICdjb25maWctcGFyYW1ldGVycycgICAgIGtleTogJ2NvbmZpZ19wYXJhbWV0ZXJzJyAgICAgZGVzYzogJ2VuYWJsZSBjb25maWcgcGFyYW1ldGVycycgICAgICAgICAgZW5hYmxlZDogdHJ1ZSAgfVxuICAgIHsgZmxhZzogJ2NvbnNvbGUtc2hvcnRjdXQnICAgICAga2V5OiAnY29uc29sZV9zaG9ydGN1dCcgICAgICBkZXNjOiAncmVwbGFjZSBsb2cgd2l0aCBjb25zb2xlLmxvZycgICAgICBlbmFibGVkOiB0cnVlICB9XG4gICAgeyBmbGFnOiAnY29uc3RydWN0b3Itc2hvcnRjdXQnICBrZXk6ICdjb25zdHJ1Y3Rvcl9zaG9ydGN1dCcgIGRlc2M6ICdyZXBsYWNlIEA6IHdpdGggY29uc3RydWN0b3I6JyAgICAgIGVuYWJsZWQ6IHRydWUgIH1cbiAgICB7IGZsYWc6ICdoZWFkZXInICAgICAgICAgICAgICAgIGtleTogJ2hlYWRlcicgICAgICAgICAgICAgICAgZGVzYzogJ3ByZWZpeCB3aXRoIGtvZmZlZSB2ZXJzaW9uIGhlYWRlcicgZW5hYmxlZDogZmFsc2UgfVxuICAgIHsgZmxhZzogJ25lZ2F0aXZlLWluZGV4JyAgICAgICAga2V5OiAnbmVnYXRpdmVfaW5kZXgnICAgICAgICBkZXNjOiAncmVwbGFjZSBhWy0xXSB3aXRoIGFbLTEuLi0xXScgICAgICBlbmFibGVkOiB0cnVlICB9XG4gICAgeyBmbGFnOiAnb3B0aW9uYWwtY29tbWF0YScgICAgICBrZXk6ICdvcHRpb25hbF9jb21tYXRhJyAgICAgIGRlc2M6ICdpbnNlcnQgY29tbWF0YSB3aGVuIHBvc3NpYmxlJyAgICAgIGVuYWJsZWQ6IHRydWUgIH1cbiAgICB7IGZsYWc6ICdyZXdyaXRlJyAgICAgICAgICAgICAgIGtleTogJ3Jld3JpdGUnICAgICAgICAgICAgICAgZGVzYzogJ3Jld3JpdGUgdG9rZW5zJyAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZSAgfVxuICAgIHsgZmxhZzogJ21ldGEnICAgICAgICAgICAgICAgICAga2V5OiAnbWV0YScgICAgICAgICAgICAgICAgICBkZXNjOiAnbWV0YScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiB0cnVlICB9XG5dXG5cbmhhc0ZlYXR1cmUgPSAob3B0aW9ucywgZmVhdHVyZSkgLT4gb3B0aW9ucz8uZmVhdHVyZT9bZmVhdHVyZV0gIT0gZmFsc2VcblxuaW5qZWN0RmVhdHVyZSA9IChvcHRpb25zKSAtPiAjIG1ha2Ugc3VyZSB0aGF0IG9wdGlvbnMgaGFzIGEgZmVhdHVyZSBzZXRcbiAgICBcbiAgICBvcHRpb25zID89IHt9XG4gICAgXG4gICAgZGVmYXVsdEZlYXR1cmVzID0ge31cbiAgICBGRUFUVVJFUy5tYXAgKGYpIC0+IGRlZmF1bHRGZWF0dXJlc1tmLmtleV0gPSBmLmVuYWJsZWRcbiAgICBcbiAgICB7IGV4dGVuZCB9ID0gcmVxdWlyZSAnLi9oZWxwZXJzJ1xuICAgIFxuICAgIGZlYXR1cmUgPSBleHRlbmQgZGVmYXVsdEZlYXR1cmVzLCBvcHRpb25zLmZlYXR1cmUgPyB7fVxuICAgIFxuICAgIG9wdGlvbnMgPSBleHRlbmQgeyBmZWF0dXJlOiBmZWF0dXJlIH0sIG9wdGlvbnNcbiAgICBvcHRpb25zXG5cbmxvZ0ZlYXR1cmVzID0gLT5cbiAgICBcbiAgICB7IHBhZCB9ID0gcmVxdWlyZSAnLi9oZWxwZXJzJ1xuICAgIHsgZ3JheSB9ID0gcmVxdWlyZSAnY29sb3JldHRlJ1xuICAgIGxvZyBcIlxcbiN7Z3JheSAnRmVhdHVyZXM6J31cXG5cXG4jeyBGRUFUVVJFUy5tYXAoKGYpIC0+IFwiICAgICN7cGFkIGYuZmxhZ30je2dyYXkgZi5kZXNjfVwiKS5qb2luKCdcXG4nKSB9XFxuXCJcbiAgICBcbiAgICB7IGxvZ01ldGFzIH0gPSByZXF1aXJlICcuL21ldGEnXG4gICAgbG9nTWV0YXMoKVxuICAgIFxubW9kdWxlLmV4cG9ydHMgPSB7IEZFQVRVUkVTLCBpbmplY3RGZWF0dXJlLCBsb2dGZWF0dXJlcywgaGFzRmVhdHVyZSB9XG4iXX0=
//# sourceURL=../coffee/features.coffee