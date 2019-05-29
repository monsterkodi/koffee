// koffee 0.52.0

/*
000   000  00000000  000      00000000   00000000  00000000    0000000  
000   000  000       000      000   000  000       000   000  000       
000000000  0000000   000      00000000   0000000   0000000    0000000   
000   000  000       000      000        000       000   000       000  
000   000  00000000  0000000  000        00000000  000   000  0000000
 */
var addLocationDataFn, arrayEgal, arrayEq, baseFileName, buildLocationData, ceq, colors, compact, count, del, egal, ends, eq, extend, flatten, initTest, isCoffee, locationDataToString, merge, pad, path, ref, repeat, some, starts, stringify, throwSyntaxError, toJS, updateSyntaxError;

path = require('path');

colors = function() {
    var colorette, colornames, i, len1, name;
    colorette = require('colorette');
    colornames = ['dim', 'bold', 'red', 'redBright', 'gray', 'grayBright', 'yellow', 'yellowBright', 'green', 'greenBright', 'white', 'whiteBright', 'blue', 'blueBright', 'cyan', 'cyanBright', 'magenta', 'magentaBright'];
    for (i = 0, len1 = colornames.length; i < len1; i++) {
        name = colornames[i];
        global[name] = colorette[name];
    }
    return global.colorette = colorette;
};

starts = function(string, literal, start) {
    return literal === string.substr(start, literal.length);
};

ends = function(string, literal, back) {
    var len;
    len = literal.length;
    return literal === string.substr(string.length - len - (back || 0), len);
};

repeat = function(str, n) {
    var res;
    res = '';
    while (n > 0) {
        if (n & 1) {
            res += str;
        }
        n >>>= 1;
        str += str;
    }
    return res;
};

pad = function(str, length) {
    var spaces;
    if (length == null) {
        length = 24;
    }
    spaces = length - str.length;
    spaces = spaces > 0 ? Array(spaces + 1).join(' ') : '';
    return "" + str + spaces;
};

compact = function(array) {
    var i, item, len1, results;
    results = [];
    for (i = 0, len1 = array.length; i < len1; i++) {
        item = array[i];
        if (item) {
            results.push(item);
        }
    }
    return results;
};

count = function(s, substr) {
    var num, pos;
    num = pos = 0;
    if (!substr.length) {
        return 1 / 0;
    }
    while (pos = 1 + s.indexOf(substr, pos)) {
        num++;
    }
    return num;
};

extend = function(object, properties) {
    var key, val;
    for (key in properties) {
        val = properties[key];
        object[key] = val;
    }
    return object;
};

merge = function(options, overrides) {
    return extend(extend({}, options), overrides);
};

flatten = function(array) {
    var element, flattened, i, len1;
    flattened = [];
    for (i = 0, len1 = array.length; i < len1; i++) {
        element = array[i];
        if ('[object Array]' === Object.prototype.toString.call(element)) {
            flattened = flattened.concat(flatten(element));
        } else {
            flattened.push(element);
        }
    }
    return flattened;
};

del = function(obj, key) {
    var val;
    val = obj[key];
    delete obj[key];
    return val;
};

some = (ref = Array.prototype.some) != null ? ref : function(fn) {
    var e, i, len1, ref1;
    ref1 = this;
    for (i = 0, len1 = ref1.length; i < len1; i++) {
        e = ref1[i];
        if (fn(e)) {
            return true;
        }
    }
    return false;
};

buildLocationData = function(first, last) {
    if (!last) {
        return first;
    } else {
        return {
            first_line: first.first_line,
            first_column: first.first_column,
            last_line: last.last_line,
            last_column: last.last_column
        };
    }
};

addLocationDataFn = function(first, last) {
    return function(obj) {
        if (((typeof obj) === 'object') && (!!obj['updateLocationDataIfMissing'])) {
            obj.updateLocationDataIfMissing(buildLocationData(first, last));
        }
        return obj;
    };
};

locationDataToString = function(obj) {
    var locationData;
    if (("2" in obj) && ("first_line" in obj[2])) {
        locationData = obj[2];
    } else if ("first_line" in obj) {
        locationData = obj;
    }
    if (locationData) {
        return ((locationData.first_line + 1) + ":" + (locationData.first_column + 1) + "-") + ((locationData.last_line + 1) + ":" + (locationData.last_column + 1));
    } else {
        return "No location data";
    }
};

baseFileName = function(file, stripExt, useWinPathSep) {
    var parts, pathSep;
    if (stripExt == null) {
        stripExt = false;
    }
    if (useWinPathSep == null) {
        useWinPathSep = false;
    }
    pathSep = useWinPathSep ? /\\|\// : /\//;
    parts = file.split(pathSep);
    file = parts[parts.length - 1];
    if (!(stripExt && file.indexOf('.') >= 0)) {
        return file;
    }
    parts = file.split('.');
    parts.pop();
    if (/^[ck]offee$/.test(parts[parts.length - 1]) && parts.length > 1) {
        parts.pop();
    }
    return parts.join('.');
};

isCoffee = function(file) {
    return /\.[ck]offee$/.test(file);
};

throwSyntaxError = function(arg) {
    var err, location, message, module, ref1, ref2, ref3;
    module = (ref1 = arg.module) != null ? ref1 : null, message = (ref2 = arg.message) != null ? ref2 : null, location = (ref3 = arg.location) != null ? ref3 : null;
    err = new SyntaxError(message);
    err.location = location;
    throw err;
};

updateSyntaxError = function(err, code, filename, options) {
    var codeLine, colm, end, file, fileLine, first_column, first_line, last_column, last_line, line, markLine, message, ref1, ref2, ref3, ref4, sep, start;
    if (err.code != null) {
        err.code;
    } else {
        err.code = code;
    }
    if (err.filename != null) {
        err.filename;
    } else {
        err.filename = filename;
    }
    if (err.markLine) {
        return err;
    }
    if (err.code && err.location) {
        ref1 = err.location, first_line = ref1.first_line, first_column = ref1.first_column, last_line = ref1.last_line, last_column = ref1.last_column;
        if (last_line != null) {
            last_line;
        } else {
            last_line = first_line;
        }
        if (last_column != null) {
            last_column;
        } else {
            last_column = first_column;
        }
        codeLine = err.code.split('\n')[first_line];
        start = first_column;
        end = first_line === last_line ? last_column + 1 : codeLine.length;
        markLine = codeLine.slice(0, start).replace(/[^\s]/g, ' ') + repeat('▲', end - start);
        message = err.message;
        err.line = first_line + 1;
        err.column = first_column + 1;
        if ((options != null ? (ref2 = options.feature) != null ? ref2.color : void 0 : void 0) !== false) {
            colorette.options.enabled = true;
            codeLine = codeLine.slice(0, start) + red(codeLine.slice(start, end)) + codeLine.slice(end);
            markLine = red(markLine);
            message = yellowBright(message);
            sep = dim(blue(':'));
            line = blue("" + err.line);
            colm = dim(blue("" + err.column));
            file = path.parse((ref3 = err.filename) != null ? ref3 : '');
            file = yellow(dim(file.dir + '/') + file.name + dim(file.ext));
            fileLine = "" + file + sep + line + sep + colm;
        } else {
            fileLine = ((ref4 = err.filename) != null ? ref4 : '?') + ":" + err.line + ":" + err.column;
        }
        err.fileLine = fileLine;
        err.codeLine = codeLine;
        err.markLine = markLine + ' ' + message;
        err.message = err.fileLine + "\n" + err.codeLine + "\n" + err.markLine;
    } else {
        err.message = Error.prototype.toString.call(err);
    }
    return err;
};

egal = function(a, b) {
    if (a === b) {
        return a !== 0 || 1 / a === 1 / b;
    } else {
        return a !== a && b !== b;
    }
};

arrayEgal = function(a, b) {
    var el, i, idx, len1;
    if (egal(a, b)) {
        return true;
    } else if (a instanceof Array && b instanceof Array) {
        if (a.length !== b.length) {
            return false;
        }
        for (idx = i = 0, len1 = a.length; i < len1; idx = ++i) {
            el = a[idx];
            if (!arrayEgal(el, b[idx])) {
                return false;
            }
        }
        return true;
    }
};

eq = function(a, b, msg) {
    return ok(egal(a, b), msg || ("\x1B[0;90m\n <<< expected >>>\n\x1B[0;93m" + a + "\x1B[0;90m<<< to equal >>>\n\x1B[0;93m" + b + "\x1B[0;90m<<< expected >>>\n"));
};

arrayEq = function(a, b, msg) {
    return ok(arrayEgal(a, b), msg || ("\x1B[0;90m\n >>>\n\x1B[0;93m" + a + "\x1B[0;90m<<< to deep equal >>>\n\x1B[0;93m" + b + "\x1B[0;90m<<< expected >>>\n"));
};

ceq = function(a, b) {
    var reg;
    reg = new RegExp('[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))', 'g');
    return eq(a.replace(reg, ''), b.replace(reg, ''));
};

toJS = function(str) {
    return Koffee.compile(str, {
        bare: true
    }).replace(/^\s+|\s+$/g, '');
};

stringify = function(o) {
    var noon;
    noon = require('noon');
    return noon.stringify(o, {
        circular: true,
        colors: true
    });
};

initTest = function() {
    extend(global, require('assert'));
    global.Koffee = require('./koffee');
    global._ = require('underscore');
    extend(global, module.exports);
    if (!global.test) {
        return global.test = function(n, f) {
            console.log(n);
            return f();
        };
    }
};

module.exports = {
    colors: colors,
    starts: starts,
    ends: ends,
    repeat: repeat,
    pad: pad,
    compact: compact,
    count: count,
    merge: merge,
    extend: extend,
    flatten: flatten,
    del: del,
    some: some,
    addLocationDataFn: addLocationDataFn,
    locationDataToString: locationDataToString,
    baseFileName: baseFileName,
    isCoffee: isCoffee,
    throwSyntaxError: throwSyntaxError,
    updateSyntaxError: updateSyntaxError,
    eq: eq,
    ceq: ceq,
    arrayEq: arrayEq,
    toJS: toJS,
    stringify: stringify,
    initTest: initTest
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztBQU9QLE1BQUEsR0FBUyxTQUFBO0FBQ0wsUUFBQTtJQUFBLFNBQUEsR0FBWSxPQUFBLENBQVEsV0FBUjtJQUNaLFVBQUEsR0FBYyxDQUNWLEtBRFUsRUFDQSxNQURBLEVBRVYsS0FGVSxFQUVBLFdBRkEsRUFHVixNQUhVLEVBR0EsWUFIQSxFQUlWLFFBSlUsRUFJQSxjQUpBLEVBS1YsT0FMVSxFQUtBLGFBTEEsRUFNVixPQU5VLEVBTUEsYUFOQSxFQU9WLE1BUFUsRUFPQSxZQVBBLEVBUVYsTUFSVSxFQVFBLFlBUkEsRUFTVixTQVRVLEVBU0EsZUFUQTtBQVdkLFNBQUEsOENBQUE7O1FBQ0ksTUFBTyxDQUFBLElBQUEsQ0FBUCxHQUFlLFNBQVUsQ0FBQSxJQUFBO0FBRDdCO1dBRUEsTUFBTSxDQUFDLFNBQVAsR0FBbUI7QUFmZDs7QUFpQlQsTUFBQSxHQUFTLFNBQUMsTUFBRCxFQUFTLE9BQVQsRUFBa0IsS0FBbEI7V0FDTCxPQUFBLEtBQVcsTUFBTSxDQUFDLE1BQVAsQ0FBYyxLQUFkLEVBQXFCLE9BQU8sQ0FBQyxNQUE3QjtBQUROOztBQUtULElBQUEsR0FBTyxTQUFDLE1BQUQsRUFBUyxPQUFULEVBQWtCLElBQWxCO0FBQ0gsUUFBQTtJQUFBLEdBQUEsR0FBTSxPQUFPLENBQUM7V0FDZCxPQUFBLEtBQVcsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsTUFBUCxHQUFnQixHQUFoQixHQUFzQixDQUFDLElBQUEsSUFBUSxDQUFULENBQXBDLEVBQWlELEdBQWpEO0FBRlI7O0FBTVAsTUFBQSxHQUFTLFNBQUMsR0FBRCxFQUFNLENBQU47QUFHTCxRQUFBO0lBQUEsR0FBQSxHQUFNO0FBQ04sV0FBTSxDQUFBLEdBQUksQ0FBVjtRQUNJLElB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LE1BQU0sQ0FBQyxJQUFkO2VBQXdCLE1BQU0sQ0FBQyxJQUFQLEdBQWMsU0FBQyxDQUFELEVBQUcsQ0FBSDtZQUFPLE9BQUEsQ0FBRSxHQUFGLENBQU0sQ0FBTjttQkFBUyxDQUFBLENBQUE7UUFBaEIsRUFBdEM7O0FBTE87O0FBT1gsTUFBTSxDQUFDLE9BQVAsR0FBaUI7SUFDYixRQUFBLE1BRGE7SUFFYixRQUFBLE1BRmE7SUFHYixNQUFBLElBSGE7SUFJYixRQUFBLE1BSmE7SUFLYixLQUFBLEdBTGE7SUFNYixTQUFBLE9BTmE7SUFPYixPQUFBLEtBUGE7SUFRYixPQUFBLEtBUmE7SUFTYixRQUFBLE1BVGE7SUFVYixTQUFBLE9BVmE7SUFXYixLQUFBLEdBWGE7SUFZYixNQUFBLElBWmE7SUFhYixtQkFBQSxpQkFiYTtJQWNiLHNCQUFBLG9CQWRhO0lBZWIsY0FBQSxZQWZhO0lBZ0JiLFVBQUEsUUFoQmE7SUFpQmIsa0JBQUEsZ0JBakJhO0lBa0JiLG1CQUFBLGlCQWxCYTtJQW1CYixJQUFBLEVBbkJhO0lBb0JiLEtBQUEsR0FwQmE7SUFxQmIsU0FBQSxPQXJCYTtJQXNCYixNQUFBLElBdEJhO0lBdUJiLFdBQUEsU0F2QmE7SUF3QmIsVUFBQSxRQXhCYSIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgXG4wMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbjAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIFxuMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgXG4wMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiMjI1xuXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcblxuIyBGdW5jdGlvbnMgdGhhdCB3ZSdkIGxpa2UgdG8gc2hhcmUgYW1vbmcgdGhlIExleGVyLCBSZXdyaXRlciwgYW5kIE5vZGVzLiBcbiMgTWVyZ2Ugb2JqZWN0cywgZmxhdHRlbiBhcnJheXMsIGNvdW50IGNoYXJhY3RlcnMsIHRoYXQgc29ydCBvZiB0aGluZy5cblxuIyBQZWVrIGF0IHRoZSBiZWdpbm5pbmcgb2YgYSBnaXZlbiBzdHJpbmcgdG8gc2VlIGlmIGl0IG1hdGNoZXMgYSBzZXF1ZW5jZS5cblxuY29sb3JzID0gLT5cbiAgICBjb2xvcmV0dGUgPSByZXF1aXJlICdjb2xvcmV0dGUnXG4gICAgY29sb3JuYW1lcyA9ICBbXG4gICAgICAgICdkaW0nICAgICAnYm9sZCdcbiAgICAgICAgJ3JlZCcgICAgICdyZWRCcmlnaHQnXG4gICAgICAgICdncmF5JyAgICAnZ3JheUJyaWdodCdcbiAgICAgICAgJ3llbGxvdycgICd5ZWxsb3dCcmlnaHQnXG4gICAgICAgICdncmVlbicgICAnZ3JlZW5CcmlnaHQnXG4gICAgICAgICd3aGl0ZScgICAnd2hpdGVCcmlnaHQnXG4gICAgICAgICdibHVlJyAgICAnYmx1ZUJyaWdodCdcbiAgICAgICAgJ2N5YW4nICAgICdjeWFuQnJpZ2h0J1xuICAgICAgICAnbWFnZW50YScgJ21hZ2VudGFCcmlnaHQnXG4gICAgXSBcbiAgICBmb3IgbmFtZSBpbiBjb2xvcm5hbWVzXG4gICAgICAgIGdsb2JhbFtuYW1lXSA9IGNvbG9yZXR0ZVtuYW1lXVxuICAgIGdsb2JhbC5jb2xvcmV0dGUgPSBjb2xvcmV0dGVcblxuc3RhcnRzID0gKHN0cmluZywgbGl0ZXJhbCwgc3RhcnQpIC0+XG4gICAgbGl0ZXJhbCBpcyBzdHJpbmcuc3Vic3RyIHN0YXJ0LCBsaXRlcmFsLmxlbmd0aFxuXG4jIFBlZWsgYXQgdGhlIGVuZCBvZiBhIGdpdmVuIHN0cmluZyB0byBzZWUgaWYgaXQgbWF0Y2hlcyBhIHNlcXVlbmNlLlxuXG5lbmRzID0gKHN0cmluZywgbGl0ZXJhbCwgYmFjaykgLT5cbiAgICBsZW4gPSBsaXRlcmFsLmxlbmd0aFxuICAgIGxpdGVyYWwgaXMgc3RyaW5nLnN1YnN0ciBzdHJpbmcubGVuZ3RoIC0gbGVuIC0gKGJhY2sgb3IgMCksIGxlblxuXG4jIFJlcGVhdCBhIHN0cmluZyBgbmAgdGltZXMuXG5cbnJlcGVhdCA9IChzdHIsIG4pIC0+XG4gICAgXG4gICAgIyBVc2UgY2xldmVyIGFsZ29yaXRobSB0byBoYXZlIE8obG9nKG4pKSBzdHJpbmcgY29uY2F0ZW5hdGlvbiBvcGVyYXRpb25zLlxuICAgIHJlcyA9ICcnXG4gICAgd2hpbGUgbiA+IDBcbiAgICAgICAgcmVzICs9IHN0ciBpZiBuICYgMVxuICAgICAgICBuID4+Pj0gMVxuICAgICAgICBzdHIgKz0gc3RyXG4gICAgcmVzXG5cbnBhZCA9IChzdHIsIGxlbmd0aD0yNCkgLT4gIyBzdHIgcGFkZGVkIHdpdGggc3BhY2VzIHRvIGxlbmd0aFxuICAgIFxuICAgIHNwYWNlcyA9IGxlbmd0aCAtIHN0ci5sZW5ndGhcbiAgICBzcGFjZXMgPSBpZiBzcGFjZXMgPiAwIHRoZW4gQXJyYXkoc3BhY2VzICsgMSkuam9pbignICcpIGVsc2UgJydcbiAgICBcIiN7c3RyfSN7c3BhY2VzfVwiXG4gICAgXG4jIFRyaW0gb3V0IGFsbCBmYWxzeSB2YWx1ZXMgZnJvbSBhbiBhcnJheS5cblxuY29tcGFjdCA9IChhcnJheSkgLT5cbiAgICBpdGVtIGZvciBpdGVtIGluIGFycmF5IHdoZW4gaXRlbVxuXG4jIENvdW50IHRoZSBudW1iZXIgb2Ygb2NjdXJyZW5jZXMgb2YgYSBzdHJpbmcgaW4gYSBzdHJpbmcuXG5cbmNvdW50ID0gKHMsIHN1YnN0cikgLT5cbiAgICBudW0gPSBwb3MgPSAwXG4gICAgcmV0dXJuIDEvMCB1bmxlc3Mgc3Vic3RyLmxlbmd0aFxuICAgIG51bSsrIHdoaWxlIHBvcyA9IDEgKyBzLmluZGV4T2Ygc3Vic3RyLCBwb3NcbiAgICBudW1cblxuIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4jIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICBcbiMgMDAwMDAwMCAgICAgMDAwMDAgICAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIFxuIyAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcblxuIyBFeHRlbmQgYSBzb3VyY2Ugb2JqZWN0IHdpdGggdGhlIHByb3BlcnRpZXMgb2YgYW5vdGhlciBvYmplY3QgKHNoYWxsb3cgY29weSkuXG5cbmV4dGVuZCA9IChvYmplY3QsIHByb3BlcnRpZXMpIC0+XG4gICAgZm9yIGtleSwgdmFsIG9mIHByb3BlcnRpZXNcbiAgICAgICAgb2JqZWN0W2tleV0gPSB2YWxcbiAgICBvYmplY3RcblxuIyBNZXJnZSBvYmplY3RzLCByZXR1cm5pbmcgYSBmcmVzaCBjb3B5IHdpdGggYXR0cmlidXRlcyBmcm9tIGJvdGggc2lkZXMuXG4jIFVzZWQgZXZlcnkgdGltZSBgQmFzZSNjb21waWxlYCBpcyBjYWxsZWQsIHRvIGFsbG93IHByb3BlcnRpZXMgaW4gdGhlXG4jIG9wdGlvbnMgaGFzaCB0byBwcm9wYWdhdGUgZG93biB0aGUgdHJlZSB3aXRob3V0IHBvbGx1dGluZyBvdGhlciBicmFuY2hlcy5cblxubWVyZ2UgPSAob3B0aW9ucywgb3ZlcnJpZGVzKSAtPiBleHRlbmQgKGV4dGVuZCB7fSwgb3B0aW9ucyksIG92ZXJyaWRlc1xuXG4jIFJldHVybiBhIGZsYXR0ZW5lZCB2ZXJzaW9uIG9mIGFuIGFycmF5LlxuIyBIYW5keSBmb3IgZ2V0dGluZyBhIGxpc3Qgb2YgYGNoaWxkcmVuYCBmcm9tIHRoZSBub2Rlcy5cbiAgICBcbmZsYXR0ZW4gPSAoYXJyYXkpIC0+XG4gICAgZmxhdHRlbmVkID0gW11cbiAgICBmb3IgZWxlbWVudCBpbiBhcnJheVxuICAgICAgICBpZiAnW29iamVjdCBBcnJheV0nIGlzIE9iamVjdDo6dG9TdHJpbmcuY2FsbCBlbGVtZW50XG4gICAgICAgICAgICBmbGF0dGVuZWQgPSBmbGF0dGVuZWQuY29uY2F0IGZsYXR0ZW4gZWxlbWVudFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBmbGF0dGVuZWQucHVzaCBlbGVtZW50XG4gICAgZmxhdHRlbmVkXG5cbiMgRGVsZXRlIGEga2V5IGZyb20gYW4gb2JqZWN0LCByZXR1cm5pbmcgdGhlIHZhbHVlLiBVc2VmdWwgd2hlbiBhIG5vZGUgaXNcbiMgbG9va2luZyBmb3IgYSBwYXJ0aWN1bGFyIG1ldGhvZCBpbiBhbiBvcHRpb25zIGhhc2guXG4gICAgXG5kZWwgPSAob2JqLCBrZXkpIC0+XG4gICAgdmFsID0gIG9ialtrZXldXG4gICAgZGVsZXRlIG9ialtrZXldXG4gICAgdmFsXG5cbiMgVHlwaWNhbCBBcnJheTo6c29tZVxuXG5zb21lID0gQXJyYXk6OnNvbWUgPyAoZm4pIC0+XG4gICAgcmV0dXJuIHRydWUgZm9yIGUgaW4gdGhpcyB3aGVuIGZuIGVcbiAgICBmYWxzZVxuXG4jIE1lcmdlIHR3byBqaXNvbi1zdHlsZSBsb2NhdGlvbiBkYXRhIG9iamVjdHMgdG9nZXRoZXIuXG4jIElmIGBsYXN0YCBpcyBub3QgcHJvdmlkZWQsIHRoaXMgd2lsbCBzaW1wbHkgcmV0dXJuIGBmaXJzdGAuXG5cbmJ1aWxkTG9jYXRpb25EYXRhID0gKGZpcnN0LCBsYXN0KSAtPlxuICAgIGlmIG5vdCBsYXN0XG4gICAgICAgIGZpcnN0XG4gICAgZWxzZVxuICAgICAgICBmaXJzdF9saW5lOiBmaXJzdC5maXJzdF9saW5lXG4gICAgICAgIGZpcnN0X2NvbHVtbjogZmlyc3QuZmlyc3RfY29sdW1uXG4gICAgICAgIGxhc3RfbGluZTogbGFzdC5sYXN0X2xpbmVcbiAgICAgICAgbGFzdF9jb2x1bW46IGxhc3QubGFzdF9jb2x1bW5cblxuIyBUaGlzIHJldHVybnMgYSBmdW5jdGlvbiB3aGljaCB0YWtlcyBhbiBvYmplY3QgYXMgYSBwYXJhbWV0ZXIsIGFuZCBpZiB0aGF0XG4jIG9iamVjdCBpcyBhbiBBU1Qgbm9kZSwgdXBkYXRlcyB0aGF0IG9iamVjdCdzIGxvY2F0aW9uRGF0YS5cbiMgVGhlIG9iamVjdCBpcyByZXR1cm5lZCBlaXRoZXIgd2F5LlxuXG5hZGRMb2NhdGlvbkRhdGFGbiA9IChmaXJzdCwgbGFzdCkgLT5cbiAgICAob2JqKSAtPlxuICAgICAgICBpZiAoKHR5cGVvZiBvYmopIGlzICdvYmplY3QnKSBhbmQgKCEhb2JqWyd1cGRhdGVMb2NhdGlvbkRhdGFJZk1pc3NpbmcnXSlcbiAgICAgICAgICAgIG9iai51cGRhdGVMb2NhdGlvbkRhdGFJZk1pc3NpbmcgYnVpbGRMb2NhdGlvbkRhdGEoZmlyc3QsIGxhc3QpXG5cbiAgICAgICAgcmV0dXJuIG9ialxuXG4jIENvbnZlcnQgamlzb24gbG9jYXRpb24gZGF0YSB0byBhIHN0cmluZy5cbiMgYG9iamAgY2FuIGJlIGEgdG9rZW4sIG9yIGEgbG9jYXRpb25EYXRhLlxuXG5sb2NhdGlvbkRhdGFUb1N0cmluZyA9IChvYmopIC0+XG4gICAgaWYgKFwiMlwiIG9mIG9iaikgYW5kIChcImZpcnN0X2xpbmVcIiBvZiBvYmpbMl0pIHRoZW4gbG9jYXRpb25EYXRhID0gb2JqWzJdXG4gICAgZWxzZSBpZiBcImZpcnN0X2xpbmVcIiBvZiBvYmogdGhlbiBsb2NhdGlvbkRhdGEgPSBvYmpcblxuICAgIGlmIGxvY2F0aW9uRGF0YVxuICAgICAgICBcIiN7bG9jYXRpb25EYXRhLmZpcnN0X2xpbmUgKyAxfToje2xvY2F0aW9uRGF0YS5maXJzdF9jb2x1bW4gKyAxfS1cIiArXG4gICAgICAgIFwiI3tsb2NhdGlvbkRhdGEubGFzdF9saW5lICsgMX06I3tsb2NhdGlvbkRhdGEubGFzdF9jb2x1bW4gKyAxfVwiXG4gICAgZWxzZVxuICAgICAgICBcIk5vIGxvY2F0aW9uIGRhdGFcIlxuXG4jIEEgYC5jb2ZmZWUubWRgIGNvbXBhdGlibGUgdmVyc2lvbiBvZiBgYmFzZW5hbWVgLCB0aGF0IHJldHVybnMgdGhlIGZpbGUgc2Fucy1leHRlbnNpb24uXG5cbmJhc2VGaWxlTmFtZSA9IChmaWxlLCBzdHJpcEV4dCA9IG5vLCB1c2VXaW5QYXRoU2VwID0gbm8pIC0+XG4gICAgcGF0aFNlcCA9IGlmIHVzZVdpblBhdGhTZXAgdGhlbiAvXFxcXHxcXC8vIGVsc2UgL1xcLy9cbiAgICBwYXJ0cyA9IGZpbGUuc3BsaXQocGF0aFNlcClcbiAgICBmaWxlID0gcGFydHNbcGFydHMubGVuZ3RoIC0gMV1cbiAgICByZXR1cm4gZmlsZSB1bmxlc3Mgc3RyaXBFeHQgYW5kIGZpbGUuaW5kZXhPZignLicpID49IDBcbiAgICBwYXJ0cyA9IGZpbGUuc3BsaXQoJy4nKVxuICAgIHBhcnRzLnBvcCgpXG4gICAgcGFydHMucG9wKCkgaWYgL15bY2tdb2ZmZWUkLy50ZXN0KHBhcnRzW3BhcnRzLmxlbmd0aC0xXSkgYW5kIHBhcnRzLmxlbmd0aCA+IDFcbiAgICBwYXJ0cy5qb2luKCcuJylcblxuIyBEZXRlcm1pbmUgaWYgYSBmaWxlbmFtZSByZXByZXNlbnRzIGEga29mZmVlIGZpbGUuXG5cbmlzQ29mZmVlID0gKGZpbGUpIC0+IC9cXC5bY2tdb2ZmZWUkLy50ZXN0IGZpbGVcblxuIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAgIDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuXG50aHJvd1N5bnRheEVycm9yID0gKG1vZHVsZTosbWVzc2FnZTosbG9jYXRpb246KSAtPlxuICAgIFxuICAgIGVyciA9IG5ldyBTeW50YXhFcnJvciBtZXNzYWdlXG4gICAgZXJyLmxvY2F0aW9uID0gbG9jYXRpb25cbiAgICB0aHJvdyBlcnJcblxudXBkYXRlU3ludGF4RXJyb3IgPSAoZXJyLCBjb2RlLCBmaWxlbmFtZSwgb3B0aW9ucykgLT4gIyBVcGRhdGUgYSBjb21waWxlciBTeW50YXhFcnJvciB3aXRoIHNvdXJjZSBjb2RlIGluZm9ybWF0aW9uXG4gICAgXG4gICAgZXJyLmNvZGUgICAgID89IGNvZGVcbiAgICBlcnIuZmlsZW5hbWUgPz0gZmlsZW5hbWVcbiAgICAgICAgXG4gICAgcmV0dXJuIGVyciBpZiBlcnIubWFya0xpbmVcbiAgICBcbiAgICBpZiBlcnIuY29kZSBhbmQgZXJyLmxvY2F0aW9uICAgICAgICBcblxuICAgICAgICB7Zmlyc3RfbGluZSwgZmlyc3RfY29sdW1uLCBsYXN0X2xpbmUsIGxhc3RfY29sdW1ufSA9IGVyci5sb2NhdGlvblxuICAgICAgICBsYXN0X2xpbmUgPz0gZmlyc3RfbGluZVxuICAgICAgICBsYXN0X2NvbHVtbiA/PSBmaXJzdF9jb2x1bW5cbiAgICBcbiAgICAgICAgY29kZUxpbmUgPSBlcnIuY29kZS5zcGxpdCgnXFxuJylbZmlyc3RfbGluZV1cbiAgICAgICAgc3RhcnQgICAgPSBmaXJzdF9jb2x1bW4gICAgICAgIFxuICAgICAgICBlbmQgICAgICA9IGlmIGZpcnN0X2xpbmUgaXMgbGFzdF9saW5lIHRoZW4gbGFzdF9jb2x1bW4gKyAxIGVsc2UgY29kZUxpbmUubGVuZ3RoICMgU2hvdyBvbmx5IHRoZSBmaXJzdCBsaW5lIG9uIG11bHRpLWxpbmUgZXJyb3JzLlxuICAgICAgICBtYXJrTGluZSA9IGNvZGVMaW5lWy4uLnN0YXJ0XS5yZXBsYWNlKC9bXlxcc10vZywgJyAnKSArIHJlcGVhdCgn4payJywgZW5kIC0gc3RhcnQpXG4gICAgXG4gICAgICAgIG1lc3NhZ2UgID0gZXJyLm1lc3NhZ2VcbiAgICAgICAgXG4gICAgICAgIGVyci5saW5lICAgPSBmaXJzdF9saW5lKzFcbiAgICAgICAgZXJyLmNvbHVtbiA9IGZpcnN0X2NvbHVtbisxXG4gICAgICAgIFxuICAgICAgICBpZiBvcHRpb25zPy5mZWF0dXJlPy5jb2xvciAhPSBmYWxzZVxuICAgICAgICAgICAgY29sb3JldHRlLm9wdGlvbnMuZW5hYmxlZCA9IHRydWVcbiAgICAgICAgICAgIGNvZGVMaW5lID0gY29kZUxpbmVbLi4uc3RhcnRdICsgcmVkKGNvZGVMaW5lW3N0YXJ0Li4uZW5kXSkgKyBjb2RlTGluZVtlbmQuLl1cbiAgICAgICAgICAgIG1hcmtMaW5lID0gcmVkIG1hcmtMaW5lXG4gICAgICAgICAgICBtZXNzYWdlICA9IHllbGxvd0JyaWdodCBtZXNzYWdlIFxuICAgICAgICAgICAgc2VwID0gZGltIGJsdWUgJzonXG4gICAgICAgICAgICBsaW5lID0gYmx1ZSBcIiN7ZXJyLmxpbmV9XCJcbiAgICAgICAgICAgIGNvbG0gPSBkaW0gYmx1ZSBcIiN7ZXJyLmNvbHVtbn1cIlxuICAgICAgICAgICAgZmlsZSA9IHBhdGgucGFyc2UgZXJyLmZpbGVuYW1lID8gJydcbiAgICAgICAgICAgIGZpbGUgPSB5ZWxsb3cgZGltKGZpbGUuZGlyICsgJy8nKSArIGZpbGUubmFtZSArIGRpbSBmaWxlLmV4dFxuICAgICAgICAgICAgZmlsZUxpbmUgPSBcIiN7ZmlsZX0je3NlcH0je2xpbmV9I3tzZXB9I3tjb2xtfVwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGZpbGVMaW5lID0gXCIje2Vyci5maWxlbmFtZSA/ICc/J306I3tlcnIubGluZX06I3tlcnIuY29sdW1ufVwiXG4gICAgICAgICAgIFxuICAgICAgICBlcnIuZmlsZUxpbmUgPSBmaWxlTGluZVxuICAgICAgICBlcnIuY29kZUxpbmUgPSBjb2RlTGluZVxuICAgICAgICBlcnIubWFya0xpbmUgPSBtYXJrTGluZSArICcgJyArIG1lc3NhZ2VcbiAgICAgICAgXG4gICAgICAgIGVyci5tZXNzYWdlID0gXCJcIlwiXG4gICAgICAgICAgICAje2Vyci5maWxlTGluZX1cbiAgICAgICAgICAgICN7ZXJyLmNvZGVMaW5lfVxuICAgICAgICAgICAgI3tlcnIubWFya0xpbmV9XG4gICAgICAgICAgICBcIlwiXCJcbiAgICBlbHNlXG4gICAgICAgIGVyci5tZXNzYWdlID0gRXJyb3I6OnRvU3RyaW5nLmNhbGwgZXJyIFxuICAgICAgICBcbiAgICBlcnJcblxuIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICBcbiMgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4jICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuIyAgICAwMDAgICAgIDAwMCAgICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbiMgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG5cbmVnYWwgPSAoYSwgYikgLT5cbiAgaWYgYSBpcyBiXG4gICAgYSAhPSAwIG9yIDEvYSBpcyAxL2JcbiAgZWxzZVxuICAgIGEgIT0gYSBhbmQgYiAhPSBiXG4gICAgXG5hcnJheUVnYWwgPSAoYSwgYikgLT5cbiAgaWYgZWdhbCBhLCBiIHRoZW4geWVzXG4gIGVsc2UgaWYgYSBpbnN0YW5jZW9mIEFycmF5IGFuZCBiIGluc3RhbmNlb2YgQXJyYXlcbiAgICByZXR1cm4gbm8gaWYgYS5sZW5ndGggIT0gYi5sZW5ndGhcbiAgICByZXR1cm4gbm8gZm9yIGVsLCBpZHggaW4gYSB3aGVuIG5vdCBhcnJheUVnYWwgZWwsIGJbaWR4XVxuICAgIHllc1xuXG5lcSAgICAgID0gKGEsIGIsIG1zZykgLT4gb2sgZWdhbChhLCBiKSwgbXNnIG9yIFwiXFx4MUJbMDs5MG1cXG4gPDw8IGV4cGVjdGVkID4+PlxcblxceDFCWzA7OTNtI3thfVxceDFCWzA7OTBtPDw8IHRvIGVxdWFsID4+PlxcblxceDFCWzA7OTNtI3tifVxceDFCWzA7OTBtPDw8IGV4cGVjdGVkID4+PlxcblwiXG5hcnJheUVxID0gKGEsIGIsIG1zZykgLT4gb2sgYXJyYXlFZ2FsKGEsYiksIG1zZyBvciBcIlxceDFCWzA7OTBtXFxuID4+PlxcblxceDFCWzA7OTNtI3thfVxceDFCWzA7OTBtPDw8IHRvIGRlZXAgZXF1YWwgPj4+XFxuXFx4MUJbMDs5M20je2J9XFx4MUJbMDs5MG08PDwgZXhwZWN0ZWQgPj4+XFxuXCJcbmNlcSAgICAgPSAoYSxiKSAtPiBcbiAgICByZWcgPSBuZXcgUmVnRXhwICdbXFxcXHUwMDFCXFxcXHUwMDlCXVtbXFxcXF0oKSM7P10qKD86KD86KD86W2EtekEtWlxcXFxkXSooPzo7Wy1hLXpBLVpcXFxcZFxcXFwvIyYuOj0/JUB+X10qKSopP1xcXFx1MDAwNyl8KD86KD86XFxcXGR7MSw0fSg/OjtcXFxcZHswLDR9KSopP1tcXFxcZEEtUFItVFpjZi1udHFyeT0+PH5dKSknLCAnZydcbiAgICBlcSBhLnJlcGxhY2UocmVnLCAnJyksIGIucmVwbGFjZShyZWcsICcnKVxuXG50b0pTID0gKHN0cikgLT5cbiAgS29mZmVlLmNvbXBpbGUgc3RyLCBiYXJlOiB5ZXNcbiAgLnJlcGxhY2UgL15cXHMrfFxccyskL2csICcnICMgVHJpbSBsZWFkaW5nL3RyYWlsaW5nIHdoaXRlc3BhY2Vcblxuc3RyaW5naWZ5ID0gKG8pIC0+XG4gICAgbm9vbiA9IHJlcXVpcmUgJ25vb24nXG4gICAgbm9vbi5zdHJpbmdpZnkgbywgY2lyY3VsYXI6IHRydWUsIGNvbG9yczogdHJ1ZVxuICAgIFxuIyBJbml0aWFsaXplIGdsb2JhbCB2YXJpYWJsZXMgdXNlZCBpbiB0ZXN0IHNjcmlwdHMgXG4jIFN1cHBvcnRzIHJ1bm5pbmcgc2luZ2xlIHRlc3QgdmlhIGBrb2ZmZWUgdGVzdC8uLmBcblxuaW5pdFRlc3QgPSAtPlxuICAgIGV4dGVuZCBnbG9iYWwsIHJlcXVpcmUgJ2Fzc2VydCcgXG4gICAgZ2xvYmFsLktvZmZlZSA9IHJlcXVpcmUgJy4va29mZmVlJ1xuICAgIGdsb2JhbC5fID0gcmVxdWlyZSAndW5kZXJzY29yZSdcbiAgICBleHRlbmQgZ2xvYmFsLCBtb2R1bGUuZXhwb3J0c1xuICAgIGlmIG5vdCBnbG9iYWwudGVzdCB0aGVuIGdsb2JhbC50ZXN0ID0gKG4sZikgLT4gbG9nIG47IGYoKVxuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNvbG9yc1xuICAgIHN0YXJ0c1xuICAgIGVuZHNcbiAgICByZXBlYXRcbiAgICBwYWRcbiAgICBjb21wYWN0XG4gICAgY291bnRcbiAgICBtZXJnZVxuICAgIGV4dGVuZFxuICAgIGZsYXR0ZW5cbiAgICBkZWxcbiAgICBzb21lXG4gICAgYWRkTG9jYXRpb25EYXRhRm5cbiAgICBsb2NhdGlvbkRhdGFUb1N0cmluZ1xuICAgIGJhc2VGaWxlTmFtZVxuICAgIGlzQ29mZmVlXG4gICAgdGhyb3dTeW50YXhFcnJvclxuICAgIHVwZGF0ZVN5bnRheEVycm9yXG4gICAgZXFcbiAgICBjZXFcbiAgICBhcnJheUVxXG4gICAgdG9KU1xuICAgIHN0cmluZ2lmeVxuICAgIGluaXRUZXN0XG59XG4gICAgIl19
//# sourceURL=../coffee/helpers.coffee