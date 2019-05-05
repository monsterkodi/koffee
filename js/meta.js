// generated by koffee 0.16.0

/*
00     00  00000000  000000000   0000000   
000   000  000          000     000   000  
000000000  0000000      000     000000000  
000 0 000  000          000     000   000  
000   000  00000000     000     000   000
 */
var META, assertMeta, codeMeta, debugMeta, injectMeta, logMetas, parseMeta, profileMeta, randMeta, testMeta, tokenMeta;

randMeta = function() {
    return {
        code: 'Math.random() < 0.5',
        reduce: false
    };
};

codeMeta = function() {};

testMeta = function() {};

tokenMeta = function() {};

parseMeta = function() {};

debugMeta = function() {};

assertMeta = function() {};

profileMeta = function() {};

META = [
    {
        key: 'token',
        desc: 'tokenized expression',
        meta: tokenMeta
    }, {
        key: 'parse',
        desc: 'parsed    expression',
        meta: parseMeta
    }, {
        key: 'code',
        desc: 'compiled  expression',
        meta: codeMeta
    }, {
        key: 'test',
        desc: 'test',
        meta: testMeta
    }, {
        key: 'assert',
        desc: 'assert',
        meta: assertMeta
    }, {
        key: 'profile',
        desc: 'profile',
        meta: profileMeta
    }, {
        key: 'dbg',
        desc: 'debug',
        meta: debugMeta
    }, {
        key: 'rand',
        desc: 'rand',
        meta: randMeta
    }
];

injectMeta = function(options) {
    var defaultMeta, extend, meta, ref;
    if (options != null) {
        options;
    } else {
        options = {};
    }
    extend = require('./helpers').extend;
    defaultMeta = {};
    META.map(function(m) {
        return defaultMeta[m.key] = m.meta;
    });
    meta = extend(defaultMeta, (ref = options.meta) != null ? ref : {});
    options = extend({
        meta: meta
    }, options);
    return options;
};

logMetas = function() {
    var pad;
    pad = require('./helpers').pad;
    return console.log("\nMetas:\n\n" + (META.map(function(f) {
        return "    " + (pad(f.key)) + f.desc;
    }).join('\n')) + "\n");
};

module.exports = {
    META: META,
    injectMeta: injectMeta,
    logMetas: logMetas
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsUUFBQSxHQUFjLFNBQUE7V0FBRztRQUFBLElBQUEsRUFBSyxxQkFBTDtRQUEyQixNQUFBLEVBQU8sS0FBbEM7O0FBQUg7O0FBQ2QsUUFBQSxHQUFjLFNBQUEsR0FBQTs7QUFDZCxRQUFBLEdBQWMsU0FBQSxHQUFBOztBQUNkLFNBQUEsR0FBYyxTQUFBLEdBQUE7O0FBQ2QsU0FBQSxHQUFjLFNBQUEsR0FBQTs7QUFDZCxTQUFBLEdBQWMsU0FBQSxHQUFBOztBQUNkLFVBQUEsR0FBYyxTQUFBLEdBQUE7O0FBQ2QsV0FBQSxHQUFjLFNBQUEsR0FBQTs7QUFFZCxJQUFBLEdBQU87SUFDSDtRQUFFLEdBQUEsRUFBSyxPQUFQO1FBQWlCLElBQUEsRUFBTSxzQkFBdkI7UUFBOEMsSUFBQSxFQUFLLFNBQW5EO0tBREcsRUFFSDtRQUFFLEdBQUEsRUFBSyxPQUFQO1FBQWlCLElBQUEsRUFBTSxzQkFBdkI7UUFBOEMsSUFBQSxFQUFLLFNBQW5EO0tBRkcsRUFHSDtRQUFFLEdBQUEsRUFBSyxNQUFQO1FBQWlCLElBQUEsRUFBTSxzQkFBdkI7UUFBOEMsSUFBQSxFQUFLLFFBQW5EO0tBSEcsRUFJSDtRQUFFLEdBQUEsRUFBSyxNQUFQO1FBQWlCLElBQUEsRUFBTSxNQUF2QjtRQUE4QyxJQUFBLEVBQUssUUFBbkQ7S0FKRyxFQUtIO1FBQUUsR0FBQSxFQUFLLFFBQVA7UUFBaUIsSUFBQSxFQUFNLFFBQXZCO1FBQThDLElBQUEsRUFBSyxVQUFuRDtLQUxHLEVBTUg7UUFBRSxHQUFBLEVBQUssU0FBUDtRQUFpQixJQUFBLEVBQU0sU0FBdkI7UUFBOEMsSUFBQSxFQUFLLFdBQW5EO0tBTkcsRUFPSDtRQUFFLEdBQUEsRUFBSyxLQUFQO1FBQWlCLElBQUEsRUFBTSxPQUF2QjtRQUE4QyxJQUFBLEVBQUssU0FBbkQ7S0FQRyxFQVFIO1FBQUUsR0FBQSxFQUFLLE1BQVA7UUFBaUIsSUFBQSxFQUFNLE1BQXZCO1FBQThDLElBQUEsRUFBSyxRQUFuRDtLQVJHOzs7QUFXUCxVQUFBLEdBQWEsU0FBQyxPQUFEO0FBRVQsUUFBQTs7UUFBQTs7UUFBQSxVQUFXOztJQUVULFNBQVcsT0FBQSxDQUFRLFdBQVI7SUFFYixXQUFBLEdBQWM7SUFDZCxJQUFJLENBQUMsR0FBTCxDQUFTLFNBQUMsQ0FBRDtlQUFPLFdBQVksQ0FBQSxDQUFDLENBQUMsR0FBRixDQUFaLEdBQXFCLENBQUMsQ0FBQztJQUE5QixDQUFUO0lBRUEsSUFBQSxHQUFVLE1BQUEsQ0FBTyxXQUFQLHVDQUFtQyxFQUFuQztJQUNWLE9BQUEsR0FBVSxNQUFBLENBQU87UUFBRSxJQUFBLEVBQU0sSUFBUjtLQUFQLEVBQXVCLE9BQXZCO1dBQ1Y7QUFYUzs7QUFhYixRQUFBLEdBQVcsU0FBQTtBQUVQLFFBQUE7SUFBRSxNQUFRLE9BQUEsQ0FBUSxXQUFSO1dBQW1CLE9BQUEsQ0FDN0IsR0FENkIsQ0FDekIsY0FBQSxHQUFjLENBQUUsSUFBSSxDQUFDLEdBQUwsQ0FBUyxTQUFDLENBQUQ7ZUFBTyxNQUFBLEdBQU0sQ0FBQyxHQUFBLENBQUksQ0FBQyxDQUFDLEdBQU4sQ0FBRCxDQUFOLEdBQW1CLENBQUMsQ0FBQztJQUE1QixDQUFULENBQTRDLENBQUMsSUFBN0MsQ0FBa0QsSUFBbEQsQ0FBRixDQUFkLEdBQXlFLElBRGhEO0FBRnRCOztBQUtYLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0lBQUUsTUFBQSxJQUFGO0lBQVEsWUFBQSxVQUFSO0lBQW9CLFVBQUEsUUFBcEIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwICAgICAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICBcbjAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICBcbjAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICBcbjAwMCAwIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICBcbjAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICBcbiMjI1xuXG5yYW5kTWV0YSAgICA9IC0+IGNvZGU6J01hdGgucmFuZG9tKCkgPCAwLjUnIHJlZHVjZTpmYWxzZVxuY29kZU1ldGEgICAgPSAtPiBcbnRlc3RNZXRhICAgID0gLT4gXG50b2tlbk1ldGEgICA9IC0+IFxucGFyc2VNZXRhICAgPSAtPiBcbmRlYnVnTWV0YSAgID0gLT4gXG5hc3NlcnRNZXRhICA9IC0+IFxucHJvZmlsZU1ldGEgPSAtPiBcblxuTUVUQSA9IFtcbiAgICB7IGtleTogJ3Rva2VuJyAgIGRlc2M6ICd0b2tlbml6ZWQgZXhwcmVzc2lvbicgbWV0YTp0b2tlbk1ldGEgICB9XG4gICAgeyBrZXk6ICdwYXJzZScgICBkZXNjOiAncGFyc2VkICAgIGV4cHJlc3Npb24nIG1ldGE6cGFyc2VNZXRhICAgfVxuICAgIHsga2V5OiAnY29kZScgICAgZGVzYzogJ2NvbXBpbGVkICBleHByZXNzaW9uJyBtZXRhOmNvZGVNZXRhICAgIH1cbiAgICB7IGtleTogJ3Rlc3QnICAgIGRlc2M6ICd0ZXN0JyAgICAgICAgICAgICAgICAgbWV0YTp0ZXN0TWV0YSAgICB9XG4gICAgeyBrZXk6ICdhc3NlcnQnICBkZXNjOiAnYXNzZXJ0JyAgICAgICAgICAgICAgIG1ldGE6YXNzZXJ0TWV0YSAgfVxuICAgIHsga2V5OiAncHJvZmlsZScgZGVzYzogJ3Byb2ZpbGUnICAgICAgICAgICAgICBtZXRhOnByb2ZpbGVNZXRhIH1cbiAgICB7IGtleTogJ2RiZycgICAgIGRlc2M6ICdkZWJ1ZycgICAgICAgICAgICAgICAgbWV0YTpkZWJ1Z01ldGEgICB9XG4gICAgeyBrZXk6ICdyYW5kJyAgICBkZXNjOiAncmFuZCcgICAgICAgICAgICAgICAgIG1ldGE6cmFuZE1ldGEgICAgfVxuXVxuXG5pbmplY3RNZXRhID0gKG9wdGlvbnMpIC0+ICMgbWFrZSBzdXJlIHRoYXQgb3B0aW9ucyBoYXMgYSBtZXRhIHNldFxuICAgIFxuICAgIG9wdGlvbnMgPz0ge31cbiAgICBcbiAgICB7IGV4dGVuZCB9ID0gcmVxdWlyZSAnLi9oZWxwZXJzJ1xuICAgIFxuICAgIGRlZmF1bHRNZXRhID0ge31cbiAgICBNRVRBLm1hcCAobSkgLT4gZGVmYXVsdE1ldGFbbS5rZXldID0gbS5tZXRhXG4gICAgXG4gICAgbWV0YSAgICA9IGV4dGVuZCBkZWZhdWx0TWV0YSwgb3B0aW9ucy5tZXRhID8ge31cbiAgICBvcHRpb25zID0gZXh0ZW5kIHsgbWV0YTogbWV0YSB9LCBvcHRpb25zXG4gICAgb3B0aW9uc1xuXG5sb2dNZXRhcyA9IC0+XG4gICAgXG4gICAgeyBwYWQgfSA9IHJlcXVpcmUgJy4vaGVscGVycydcbiAgICBsb2cgXCJcXG5NZXRhczpcXG5cXG4jeyBNRVRBLm1hcCgoZikgLT4gXCIgICAgI3twYWQgZi5rZXl9I3tmLmRlc2N9XCIpLmpvaW4oJ1xcbicpIH1cXG5cIlxuICAgIFxubW9kdWxlLmV4cG9ydHMgPSB7IE1FVEEsIGluamVjdE1ldGEsIGxvZ01ldGFzIH1cbiJdfQ==
//# sourceURL=../coffee/meta.coffee