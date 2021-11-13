// koffee 1.19.0

/*
000   000  00000000  000      00000000   00000000  00000000    0000000  
000   000  000       000      000   000  000       000   000  000       
000000000  0000000   000      00000000   0000000   0000000    0000000   
000   000  000       000      000        000       000   000       000  
000   000  00000000  0000000  000        00000000  000   000  0000000
 */
var addLocationDataFn, arrayEgal, arrayEq, baseFileName, buildLocationData, ceq, colors, compact, count, del, egal, ends, eq, extend, flatten, initTest, isCoffee, locationDataToString, merge, pad, path, repeat, some, starts, stringify, throwSyntaxError, toJS, updateSyntaxError;

path = require('path');

colors = function(enabled) {
    var colorette, colornames, i, len1, name, results;
    if (enabled == null) {
        enabled = true;
    }
    colorette = require('colorette');
    colornames = ['dim', 'bold', 'red', 'redBright', 'gray', 'grayBright', 'yellow', 'yellowBright', 'green', 'greenBright', 'white', 'whiteBright', 'blue', 'blueBright', 'cyan', 'cyanBright', 'magenta', 'magentaBright'];
    colors = colorette.createColors({
        useColor: enabled
    });
    results = [];
    for (i = 0, len1 = colornames.length; i < len1; i++) {
        name = colornames[i];
        results.push(global[name] = colors[name]);
    }
    return results;
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

flatten = function(arry) {
    var elem, flattened, i, len1;
    flattened = [];
    for (i = 0, len1 = arry.length; i < len1; i++) {
        elem = arry[i];
        if (typeof elem === 'object' && elem.constructor.name === 'Array') {
            flattened = flattened.concat(flatten(elem));
        } else {
            flattened.push(elem);
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

some = Array.prototype.some;

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
    var err, location, message, module, ref, ref1, ref2;
    module = (ref = arg.module) != null ? ref : null, message = (ref1 = arg.message) != null ? ref1 : null, location = (ref2 = arg.location) != null ? ref2 : null;
    err = new SyntaxError(message);
    err.location = location;
    throw err;
};

updateSyntaxError = function(err, code, filename, options) {
    var c, codeLine, colNum, colm, column, compiled, e, end, file, fileLine, first_column, first_line, i, j, last_column, last_line, len1, line, lineIndex, lineNum, lines, mapped, markLine, match, message, ref, ref1, ref2, ref3, ref4, ref5, ref6, sep, sourceMap, start;
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
    if (err.code) {
        if (err.location) {
            ref = err.location, first_line = ref.first_line, first_column = ref.first_column, last_line = ref.last_line, last_column = ref.last_column;
        } else {
            first_line = first_column = 0;
            try {
                if (err.stack != null) {
                    compiled = require('./koffee').compile(code, {
                        bare: options != null ? options.bare : void 0,
                        feature: {
                            header: options != null ? (ref1 = options.feature) != null ? ref1.header : void 0 : void 0
                        },
                        filename: filename,
                        sourceFiles: [filename],
                        sourceMap: true
                    });
                    sourceMap = compiled.sourceMap;
                    if (sourceMap) {
                        lines = err.stack.split('\n');
                        for (lineIndex = i = 0, ref2 = lines.length; 0 <= ref2 ? i < ref2 : i > ref2; lineIndex = 0 <= ref2 ? ++i : --i) {
                            line = lines[lineIndex];
                            if (match = /:([0-9]+):?([0-9]+)?[)]?$/.exec(line)) {
                                line = lines[lineIndex];
                                lineNum = parseInt(match[1]);
                                colNum = parseInt(match[2]);
                                if ((1 <= lineNum && lineNum < sourceMap.lines.length)) {
                                    c = colNum;
                                    if (Number.isNaN(c)) {
                                        c = 1;
                                    }
                                    if (sourceMap.lines[lineNum - 1]) {
                                        if (mapped = sourceMap.lines[lineNum - 1].sourceLocation(c - 1)) {
                                            first_line = mapped[0], first_column = mapped[1];
                                        } else {
                                            ref3 = sourceMap.lines[lineNum - 1].columns;
                                            for (j = 0, len1 = ref3.length; j < len1; j++) {
                                                column = ref3[j];
                                                if (column) {
                                                    first_line = column.sourceLine - 1;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        klog('[33m[93mhelpers[33m[2m.[22m[2mcoffee[22m[39m[2m[34m:[39m[22m[94m225[39m', '[1m[97mno source map![39m[22m', '');
                    }
                }
            } catch (error) {
                e = error;
                console.log('updateSyntaxError -- but cant figure out source location', e);
                return err;
            }
        }
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
        if ((options != null ? (ref4 = options.feature) != null ? ref4.color : void 0 : void 0) !== false) {
            codeLine = codeLine.slice(0, start) + red(codeLine.slice(start, end)) + codeLine.slice(end);
            markLine = red(markLine);
            message = yellowBright(message);
            sep = dim(blue(':'));
            line = blue("" + err.line);
            colm = dim(blue("" + err.column));
            file = path.parse((ref5 = err.filename) != null ? ref5 : '');
            file = yellow(dim(file.dir + '/') + file.name + dim(file.ext));
            fileLine = "" + file + sep + line + sep + colm;
        } else {
            fileLine = ((ref6 = err.filename) != null ? ref6 : '?') + ":" + err.line + ":" + err.column;
        }
        err.fileLine = fileLine;
        err.codeLine = codeLine;
        err.markLine = markLine + ' ' + message;
        err.message = err.fileLine + "\n" + err.codeLine + "\n" + err.markLine;
        err.stack = err.message;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIuLi9jb2ZmZWUiLCJzb3VyY2VzIjpbImhlbHBlcnMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQVFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7QUFPUCxNQUFBLEdBQVMsU0FBQyxPQUFEO0FBQ0wsUUFBQTs7UUFETSxVQUFROztJQUNkLFNBQUEsR0FBWSxPQUFBLENBQVEsV0FBUjtJQUNaLFVBQUEsR0FBYyxDQUNWLEtBRFUsRUFDQSxNQURBLEVBRVYsS0FGVSxFQUVBLFdBRkEsRUFHVixNQUhVLEVBR0EsWUFIQSxFQUlWLFFBSlUsRUFJQSxjQUpBLEVBS1YsT0FMVSxFQUtBLGFBTEEsRUFNVixPQU5VLEVBTUEsYUFOQSxFQU9WLE1BUFUsRUFPQSxZQVBBLEVBUVYsTUFSVSxFQVFBLFlBUkEsRUFTVixTQVRVLEVBU0EsZUFUQTtJQVdkLE1BQUEsR0FBUyxTQUFTLENBQUMsWUFBVixDQUF1QjtRQUFBLFFBQUEsRUFBUyxPQUFUO0tBQXZCO0FBQ1Q7U0FBQSw4Q0FBQTs7cUJBQ0ksTUFBTyxDQUFBLElBQUEsQ0FBUCxHQUFlLE1BQU8sQ0FBQSxJQUFBO0FBRDFCOztBQWRLOztBQWtCVCxNQUFBLEdBQVMsU0FBQyxNQUFELEVBQVMsT0FBVCxFQUFrQixLQUFsQjtXQUNMLE9BQUEsS0FBVyxNQUFNLENBQUMsTUFBUCxDQUFjLEtBQWQsRUFBcUIsT0FBTyxDQUFDLE1BQTdCO0FBRE47O0FBS1QsSUFBQSxHQUFPLFNBQUMsTUFBRCxFQUFTLE9BQVQsRUFBa0IsSUFBbEI7QUFDSCxRQUFBO0lBQUEsR0FBQSxHQUFNLE9BQU8sQ0FBQztXQUNkLE9BQUEsS0FBVyxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxNQUFQLEdBQWdCLEdBQWhCLEdBQXNCLENBQUMsSUFBQSxJQUFRLENBQVQsQ0FBcEMsRUFBaUQsR0FBakQ7QUFGUjs7QUFNUCxNQUFBLEdBQVMs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QVUsSUFBVjtRQUFnQixNQUFBLEVBQVEsSUFBeEI7S0FBbEI7QUFGUTs7QUFPWixRQUFBLEdBQVcsU0FBQTtJQUNQLE1BQUEsQ0FBTyxNQUFQLEVBQWUsT0FBQSxDQUFRLFFBQVIsQ0FBZjtJQUNBLE1BQU0sQ0FBQyxNQUFQLEdBQWdCLE9BQUEsQ0FBUSxVQUFSO0lBQ2hCLE1BQU0sQ0FBQyxDQUFQLEdBQVcsT0FBQSxDQUFRLFlBQVI7SUFDWCxNQUFBLENBQU8sTUFBUCxFQUFlLE1BQU0sQ0FBQyxPQUF0QjtJQUNBLElBQUcsQ0FBSSxNQUFNLENBQUMsSUFBZDtlQUF3QixNQUFNLENBQUMsSUFBUCxHQUFjLFNBQUMsQ0FBRCxFQUFHLENBQUg7WUFBTyxPQUFBLENBQUUsR0FBRixDQUFNLENBQU47bUJBQVMsQ0FBQSxDQUFBO1FBQWhCLEVBQXRDOztBQUxPOztBQU9YLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0lBQ2IsUUFBQSxNQURhO0lBRWIsUUFBQSxNQUZhO0lBR2IsTUFBQSxJQUhhO0lBSWIsUUFBQSxNQUphO0lBS2IsS0FBQSxHQUxhO0lBTWIsU0FBQSxPQU5hO0lBT2IsT0FBQSxLQVBhO0lBUWIsT0FBQSxLQVJhO0lBU2IsUUFBQSxNQVRhO0lBVWIsU0FBQSxPQVZhO0lBV2IsS0FBQSxHQVhhO0lBWWIsTUFBQSxJQVphO0lBYWIsbUJBQUEsaUJBYmE7SUFjYixzQkFBQSxvQkFkYTtJQWViLGNBQUEsWUFmYTtJQWdCYixVQUFBLFFBaEJhO0lBaUJiLGtCQUFBLGdCQWpCYTtJQWtCYixtQkFBQSxpQkFsQmE7SUFtQmIsSUFBQSxFQW5CYTtJQW9CYixLQUFBLEdBcEJhO0lBcUJiLFNBQUEsT0FyQmE7SUFzQmIsTUFBQSxJQXRCYTtJQXVCYixXQUFBLFNBdkJhO0lBd0JiLFVBQUEsUUF4QmEiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIFxuMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4wMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICBcbjAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4jIyNcblxucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5cbiMgRnVuY3Rpb25zIHRoYXQgd2UnZCBsaWtlIHRvIHNoYXJlIGFtb25nIHRoZSBMZXhlciwgUmV3cml0ZXIsIGFuZCBOb2Rlcy4gXG4jIE1lcmdlIG9iamVjdHMsIGZsYXR0ZW4gYXJyYXlzLCBjb3VudCBjaGFyYWN0ZXJzLCB0aGF0IHNvcnQgb2YgdGhpbmcuXG5cbiMgUGVlayBhdCB0aGUgYmVnaW5uaW5nIG9mIGEgZ2l2ZW4gc3RyaW5nIHRvIHNlZSBpZiBpdCBtYXRjaGVzIGEgc2VxdWVuY2UuXG5cbmNvbG9ycyA9IChlbmFibGVkPXRydWUpIC0+XG4gICAgY29sb3JldHRlID0gcmVxdWlyZSAnY29sb3JldHRlJ1xuICAgIGNvbG9ybmFtZXMgPSAgW1xuICAgICAgICAnZGltJyAgICAgJ2JvbGQnXG4gICAgICAgICdyZWQnICAgICAncmVkQnJpZ2h0J1xuICAgICAgICAnZ3JheScgICAgJ2dyYXlCcmlnaHQnXG4gICAgICAgICd5ZWxsb3cnICAneWVsbG93QnJpZ2h0J1xuICAgICAgICAnZ3JlZW4nICAgJ2dyZWVuQnJpZ2h0J1xuICAgICAgICAnd2hpdGUnICAgJ3doaXRlQnJpZ2h0J1xuICAgICAgICAnYmx1ZScgICAgJ2JsdWVCcmlnaHQnXG4gICAgICAgICdjeWFuJyAgICAnY3lhbkJyaWdodCdcbiAgICAgICAgJ21hZ2VudGEnICdtYWdlbnRhQnJpZ2h0J1xuICAgIF1cbiAgICBjb2xvcnMgPSBjb2xvcmV0dGUuY3JlYXRlQ29sb3JzIHVzZUNvbG9yOmVuYWJsZWQgXG4gICAgZm9yIG5hbWUgaW4gY29sb3JuYW1lc1xuICAgICAgICBnbG9iYWxbbmFtZV0gPSBjb2xvcnNbbmFtZV1cbiAgICAjZ2xvYmFsLmNvbG9yZXR0ZSA9IGNvbG9yZXR0ZVxuXG5zdGFydHMgPSAoc3RyaW5nLCBsaXRlcmFsLCBzdGFydCkgLT5cbiAgICBsaXRlcmFsIGlzIHN0cmluZy5zdWJzdHIgc3RhcnQsIGxpdGVyYWwubGVuZ3RoXG5cbiMgUGVlayBhdCB0aGUgZW5kIG9mIGEgZ2l2ZW4gc3RyaW5nIHRvIHNlZSBpZiBpdCBtYXRjaGVzIGEgc2VxdWVuY2UuXG5cbmVuZHMgPSAoc3RyaW5nLCBsaXRlcmFsLCBiYWNrKSAtPlxuICAgIGxlbiA9IGxpdGVyYWwubGVuZ3RoXG4gICAgbGl0ZXJhbCBpcyBzdHJpbmcuc3Vic3RyIHN0cmluZy5sZW5ndGggLSBsZW4gLSAoYmFjayBvciAwKSwgbGVuXG5cbiMgUmVwZWF0IGEgc3RyaW5nIG4gdGltZXMuXG5cbnJlcGVhdCA9IChzdHIsIG4pIC0+XG4gICAgXG4gICAgIyBVc2UgY2xldmVyIGFsZ29yaXRobSB0byBoYXZlIE8obG9nKG4pKSBzdHJpbmcgY29uY2F0ZW5hdGlvbiBvcGVyYXRpb25zLlxuICAgIHJlcyA9ICcnXG4gICAgd2hpbGUgbiA+IDBcbiAgICAgICAgcmVzICs9IHN0ciBpZiBuICYgMVxuICAgICAgICBuID4+Pj0gMVxuICAgICAgICBzdHIgKz0gc3RyXG4gICAgcmVzXG5cbnBhZCA9IChzdHIsIGxlbmd0aD0yNCkgLT4gIyBzdHIgcGFkZGVkIHdpdGggc3BhY2VzIHRvIGxlbmd0aFxuICAgIFxuICAgIHNwYWNlcyA9IGxlbmd0aCAtIHN0ci5sZW5ndGhcbiAgICBzcGFjZXMgPSBpZiBzcGFjZXMgPiAwIHRoZW4gQXJyYXkoc3BhY2VzICsgMSkuam9pbignICcpIGVsc2UgJydcbiAgICBcIiN7c3RyfSN7c3BhY2VzfVwiXG4gICAgXG4jIFRyaW0gb3V0IGFsbCBmYWxzeSB2YWx1ZXMgZnJvbSBhbiBhcnJheS5cblxuY29tcGFjdCA9IChhcnJheSkgLT5cbiAgICBpdGVtIGZvciBpdGVtIGluIGFycmF5IHdoZW4gaXRlbVxuXG4jIENvdW50IHRoZSBudW1iZXIgb2Ygb2NjdXJyZW5jZXMgb2YgYSBzdHJpbmcgaW4gYSBzdHJpbmcuXG5cbmNvdW50ID0gKHMsIHN1YnN0cikgLT5cbiAgICBudW0gPSBwb3MgPSAwXG4gICAgcmV0dXJuIDEvMCB1bmxlc3Mgc3Vic3RyLmxlbmd0aFxuICAgIG51bSsrIHdoaWxlIHBvcyA9IDEgKyBzLmluZGV4T2Ygc3Vic3RyLCBwb3NcbiAgICBudW1cblxuIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4jIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICBcbiMgMDAwMDAwMCAgICAgMDAwMDAgICAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIFxuIyAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcblxuIyBFeHRlbmQgYSBzb3VyY2Ugb2JqZWN0IHdpdGggdGhlIHByb3BlcnRpZXMgb2YgYW5vdGhlciBvYmplY3QgKHNoYWxsb3cgY29weSkuXG5cbmV4dGVuZCA9IChvYmplY3QsIHByb3BlcnRpZXMpIC0+XG4gICAgZm9yIGtleSwgdmFsIG9mIHByb3BlcnRpZXNcbiAgICAgICAgb2JqZWN0W2tleV0gPSB2YWxcbiAgICBvYmplY3RcblxuIyBNZXJnZSBvYmplY3RzLCByZXR1cm5pbmcgYSBmcmVzaCBjb3B5IHdpdGggYXR0cmlidXRlcyBmcm9tIGJvdGggc2lkZXMuXG4jIFVzZWQgZXZlcnkgdGltZSBgQmFzZSNjb21waWxlYCBpcyBjYWxsZWQsIHRvIGFsbG93IHByb3BlcnRpZXMgaW4gdGhlXG4jIG9wdGlvbnMgaGFzaCB0byBwcm9wYWdhdGUgZG93biB0aGUgdHJlZSB3aXRob3V0IHBvbGx1dGluZyBvdGhlciBicmFuY2hlcy5cblxubWVyZ2UgPSAob3B0aW9ucywgb3ZlcnJpZGVzKSAtPiBleHRlbmQgKGV4dGVuZCB7fSwgb3B0aW9ucyksIG92ZXJyaWRlc1xuXG4jIGZsYXR0ZW4gPSAoYXJyeSkgLT4gYXJyeS5mbGF0KClcblxuZmxhdHRlbiA9IChhcnJ5KSAtPlxuICAgIGZsYXR0ZW5lZCA9IFtdXG4gICAgZm9yIGVsZW0gaW4gYXJyeVxuICAgICAgICBpZiB0eXBlb2YoZWxlbSkgPT0gJ29iamVjdCcgYW5kIGVsZW0uY29uc3RydWN0b3IubmFtZSA9PSAnQXJyYXknXG4gICAgICAgICAgICBmbGF0dGVuZWQgPSBmbGF0dGVuZWQuY29uY2F0IGZsYXR0ZW4gZWxlbVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBmbGF0dGVuZWQucHVzaCBlbGVtXG4gICAgZmxhdHRlbmVkXG5cbiMgRGVsZXRlIGEga2V5IGZyb20gYW4gb2JqZWN0LCByZXR1cm5pbmcgdGhlIHZhbHVlLiBVc2VmdWwgd2hlbiBhIG5vZGUgaXNcbiMgbG9va2luZyBmb3IgYSBwYXJ0aWN1bGFyIG1ldGhvZCBpbiBhbiBvcHRpb25zIGhhc2guXG4gICAgXG5kZWwgPSAob2JqLCBrZXkpIC0+XG4gICAgdmFsID0gIG9ialtrZXldXG4gICAgZGVsZXRlIG9ialtrZXldXG4gICAgdmFsXG5cbnNvbWUgPSBBcnJheS5wcm90b3R5cGUuc29tZVxuXG4jIE1lcmdlIHR3byBqaXNvbi1zdHlsZSBsb2NhdGlvbiBkYXRhIG9iamVjdHMgdG9nZXRoZXIuXG4jIElmIGBsYXN0YCBpcyBub3QgcHJvdmlkZWQsIHRoaXMgd2lsbCBzaW1wbHkgcmV0dXJuIGBmaXJzdGAuXG5cbmJ1aWxkTG9jYXRpb25EYXRhID0gKGZpcnN0LCBsYXN0KSAtPlxuICAgIGlmIG5vdCBsYXN0XG4gICAgICAgIGZpcnN0XG4gICAgZWxzZVxuICAgICAgICBmaXJzdF9saW5lOiBmaXJzdC5maXJzdF9saW5lXG4gICAgICAgIGZpcnN0X2NvbHVtbjogZmlyc3QuZmlyc3RfY29sdW1uXG4gICAgICAgIGxhc3RfbGluZTogbGFzdC5sYXN0X2xpbmVcbiAgICAgICAgbGFzdF9jb2x1bW46IGxhc3QubGFzdF9jb2x1bW5cblxuIyBUaGlzIHJldHVybnMgYSBmdW5jdGlvbiB3aGljaCB0YWtlcyBhbiBvYmplY3QgYXMgYSBwYXJhbWV0ZXIsIGFuZCBpZiB0aGF0XG4jIG9iamVjdCBpcyBhbiBBU1Qgbm9kZSwgdXBkYXRlcyB0aGF0IG9iamVjdCdzIGxvY2F0aW9uRGF0YS5cbiMgVGhlIG9iamVjdCBpcyByZXR1cm5lZCBlaXRoZXIgd2F5LlxuXG5hZGRMb2NhdGlvbkRhdGFGbiA9IChmaXJzdCwgbGFzdCkgLT5cbiAgICAob2JqKSAtPlxuICAgICAgICBpZiAoKHR5cGVvZiBvYmopIGlzICdvYmplY3QnKSBhbmQgKCEhb2JqWyd1cGRhdGVMb2NhdGlvbkRhdGFJZk1pc3NpbmcnXSlcbiAgICAgICAgICAgIG9iai51cGRhdGVMb2NhdGlvbkRhdGFJZk1pc3NpbmcgYnVpbGRMb2NhdGlvbkRhdGEoZmlyc3QsIGxhc3QpXG5cbiAgICAgICAgcmV0dXJuIG9ialxuXG4jIENvbnZlcnQgamlzb24gbG9jYXRpb24gZGF0YSB0byBhIHN0cmluZy5cbiMgYG9iamAgY2FuIGJlIGEgdG9rZW4sIG9yIGEgbG9jYXRpb25EYXRhLlxuXG5sb2NhdGlvbkRhdGFUb1N0cmluZyA9IChvYmopIC0+XG4gICAgaWYgKFwiMlwiIG9mIG9iaikgYW5kIChcImZpcnN0X2xpbmVcIiBvZiBvYmpbMl0pIHRoZW4gbG9jYXRpb25EYXRhID0gb2JqWzJdXG4gICAgZWxzZSBpZiBcImZpcnN0X2xpbmVcIiBvZiBvYmogdGhlbiBsb2NhdGlvbkRhdGEgPSBvYmpcblxuICAgIGlmIGxvY2F0aW9uRGF0YVxuICAgICAgICBcIiN7bG9jYXRpb25EYXRhLmZpcnN0X2xpbmUgKyAxfToje2xvY2F0aW9uRGF0YS5maXJzdF9jb2x1bW4gKyAxfS1cIiArXG4gICAgICAgIFwiI3tsb2NhdGlvbkRhdGEubGFzdF9saW5lICsgMX06I3tsb2NhdGlvbkRhdGEubGFzdF9jb2x1bW4gKyAxfVwiXG4gICAgZWxzZVxuICAgICAgICBcIk5vIGxvY2F0aW9uIGRhdGFcIlxuXG4jIEEgYC5jb2ZmZWUubWRgIGNvbXBhdGlibGUgdmVyc2lvbiBvZiBgYmFzZW5hbWVgLCB0aGF0IHJldHVybnMgdGhlIGZpbGUgc2Fucy1leHRlbnNpb24uXG5cbmJhc2VGaWxlTmFtZSA9IChmaWxlLCBzdHJpcEV4dCA9IG5vLCB1c2VXaW5QYXRoU2VwID0gbm8pIC0+XG4gICAgcGF0aFNlcCA9IGlmIHVzZVdpblBhdGhTZXAgdGhlbiAvXFxcXHxcXC8vIGVsc2UgL1xcLy9cbiAgICBwYXJ0cyA9IGZpbGUuc3BsaXQocGF0aFNlcClcbiAgICBmaWxlID0gcGFydHNbcGFydHMubGVuZ3RoIC0gMV1cbiAgICByZXR1cm4gZmlsZSB1bmxlc3Mgc3RyaXBFeHQgYW5kIGZpbGUuaW5kZXhPZignLicpID49IDBcbiAgICBwYXJ0cyA9IGZpbGUuc3BsaXQoJy4nKVxuICAgIHBhcnRzLnBvcCgpXG4gICAgcGFydHMucG9wKCkgaWYgL15bY2tdb2ZmZWUkLy50ZXN0KHBhcnRzW3BhcnRzLmxlbmd0aC0xXSkgYW5kIHBhcnRzLmxlbmd0aCA+IDFcbiAgICBwYXJ0cy5qb2luKCcuJylcblxuIyBEZXRlcm1pbmUgaWYgYSBmaWxlbmFtZSByZXByZXNlbnRzIGEga29mZmVlIGZpbGUuXG5cbmlzQ29mZmVlID0gKGZpbGUpIC0+IC9cXC5bY2tdb2ZmZWUkLy50ZXN0IGZpbGVcblxuIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAgIDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuXG50aHJvd1N5bnRheEVycm9yID0gKG1vZHVsZTosbWVzc2FnZTosbG9jYXRpb246KSAtPlxuICAgIFxuICAgIGVyciA9IG5ldyBTeW50YXhFcnJvciBtZXNzYWdlXG4gICAgZXJyLmxvY2F0aW9uID0gbG9jYXRpb25cbiAgICB0aHJvdyBlcnJcblxudXBkYXRlU3ludGF4RXJyb3IgPSAoZXJyLCBjb2RlLCBmaWxlbmFtZSwgb3B0aW9ucykgLT4gIyBVcGRhdGUgYSBjb21waWxlciBTeW50YXhFcnJvciB3aXRoIHNvdXJjZSBjb2RlIGluZm9ybWF0aW9uXG4gICAgXG4gICAgZXJyLmNvZGUgICAgID89IGNvZGVcbiAgICBlcnIuZmlsZW5hbWUgPz0gZmlsZW5hbWVcbiAgICAgICAgICAgIFxuICAgIHJldHVybiBlcnIgaWYgZXJyLm1hcmtMaW5lXG4gICAgXG4gICAgaWYgZXJyLmNvZGVcblxuICAgICAgICBpZiBlcnIubG9jYXRpb25cbiAgICAgICAgICAgIHtmaXJzdF9saW5lLCBmaXJzdF9jb2x1bW4sIGxhc3RfbGluZSwgbGFzdF9jb2x1bW59ID0gZXJyLmxvY2F0aW9uXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGZpcnN0X2xpbmUgPSBmaXJzdF9jb2x1bW4gPSAwXG4gICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAgICBpZiBlcnIuc3RhY2s/XG4gICAgICAgICAgICAgICAgICAgIGNvbXBpbGVkID0gcmVxdWlyZSgnLi9rb2ZmZWUnKS5jb21waWxlKGNvZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBiYXJlOiAgICAgICAgICAgIG9wdGlvbnM/LmJhcmVcbiAgICAgICAgICAgICAgICAgICAgICAgIGZlYXR1cmU6IGhlYWRlcjogb3B0aW9ucz8uZmVhdHVyZT8uaGVhZGVyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlbmFtZTogICAgICAgIGZpbGVuYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VGaWxlczogICAgIFtmaWxlbmFtZV1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZU1hcDogICAgICAgdHJ1ZVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBzb3VyY2VNYXAgPSBjb21waWxlZC5zb3VyY2VNYXBcblxuICAgICAgICAgICAgICAgICAgICBpZiBzb3VyY2VNYXBcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgbGluZXMgPSBlcnIuc3RhY2suc3BsaXQgJ1xcbidcblxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIGxpbmVJbmRleCBpbiBbMC4uLmxpbmVzLmxlbmd0aF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lID0gbGluZXNbbGluZUluZGV4XVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIG1hdGNoID0gLzooWzAtOV0rKTo/KFswLTldKyk/WyldPyQvLmV4ZWMgbGluZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lID0gbGluZXNbbGluZUluZGV4XVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lTnVtID0gcGFyc2VJbnQgbWF0Y2hbMV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sTnVtICA9IHBhcnNlSW50IG1hdGNoWzJdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIDEgPD0gbGluZU51bSA8IHNvdXJjZU1hcC5saW5lcy5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGMgPSBjb2xOdW1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIE51bWJlci5pc05hTihjKSB0aGVuIGMgPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBzb3VyY2VNYXAubGluZXNbbGluZU51bS0xXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIG1hcHBlZCA9IHNvdXJjZU1hcC5saW5lc1tsaW5lTnVtLTFdLnNvdXJjZUxvY2F0aW9uKGMtMSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW2ZpcnN0X2xpbmUsIGZpcnN0X2NvbHVtbl0gPSBtYXBwZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciBjb2x1bW4gaW4gc291cmNlTWFwLmxpbmVzW2xpbmVOdW0tMV0uY29sdW1uc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgY29sdW1uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3RfbGluZSA9IGNvbHVtbi5zb3VyY2VMaW5lLTFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICDilrhkYmcgJ25vIHNvdXJjZSBtYXAhJ1xuICAgICAgICAgICAgY2F0Y2ggZVxuICAgICAgICAgICAgICAgIGxvZyAndXBkYXRlU3ludGF4RXJyb3IgLS0gYnV0IGNhbnQgZmlndXJlIG91dCBzb3VyY2UgbG9jYXRpb24nLCBlXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVyclxuICAgICAgICAgICAgXG4gICAgICAgIGxhc3RfbGluZSA/PSBmaXJzdF9saW5lXG4gICAgICAgIGxhc3RfY29sdW1uID89IGZpcnN0X2NvbHVtblxuICAgIFxuICAgICAgICBjb2RlTGluZSA9IGVyci5jb2RlLnNwbGl0KCdcXG4nKVtmaXJzdF9saW5lXVxuICAgICAgICBzdGFydCAgICA9IGZpcnN0X2NvbHVtbiAgICAgICAgXG4gICAgICAgIGVuZCAgICAgID0gaWYgZmlyc3RfbGluZSBpcyBsYXN0X2xpbmUgdGhlbiBsYXN0X2NvbHVtbiArIDEgZWxzZSBjb2RlTGluZS5sZW5ndGggIyBTaG93IG9ubHkgdGhlIGZpcnN0IGxpbmUgb24gbXVsdGktbGluZSBlcnJvcnMuXG4gICAgICAgIG1hcmtMaW5lID0gY29kZUxpbmVbLi4uc3RhcnRdLnJlcGxhY2UoL1teXFxzXS9nLCAnICcpICsgcmVwZWF0KCfilrInLCBlbmQgLSBzdGFydClcbiAgICBcbiAgICAgICAgbWVzc2FnZSAgPSBlcnIubWVzc2FnZVxuICAgICAgICBcbiAgICAgICAgZXJyLmxpbmUgICA9IGZpcnN0X2xpbmUrMVxuICAgICAgICBlcnIuY29sdW1uID0gZmlyc3RfY29sdW1uKzFcbiAgICAgICAgXG4gICAgICAgIGlmIG9wdGlvbnM/LmZlYXR1cmU/LmNvbG9yICE9IGZhbHNlXG4gICAgICAgICAgICBjb2RlTGluZSA9IGNvZGVMaW5lWy4uLnN0YXJ0XSArIHJlZChjb2RlTGluZVtzdGFydC4uLmVuZF0pICsgY29kZUxpbmVbZW5kLi5dXG4gICAgICAgICAgICBtYXJrTGluZSA9IHJlZCBtYXJrTGluZVxuICAgICAgICAgICAgbWVzc2FnZSAgPSB5ZWxsb3dCcmlnaHQgbWVzc2FnZSBcbiAgICAgICAgICAgIHNlcCA9IGRpbSBibHVlICc6J1xuICAgICAgICAgICAgbGluZSA9IGJsdWUgXCIje2Vyci5saW5lfVwiXG4gICAgICAgICAgICBjb2xtID0gZGltIGJsdWUgXCIje2Vyci5jb2x1bW59XCJcbiAgICAgICAgICAgIGZpbGUgPSBwYXRoLnBhcnNlIGVyci5maWxlbmFtZSA/ICcnXG4gICAgICAgICAgICBmaWxlID0geWVsbG93IGRpbShmaWxlLmRpciArICcvJykgKyBmaWxlLm5hbWUgKyBkaW0gZmlsZS5leHRcbiAgICAgICAgICAgIGZpbGVMaW5lID0gXCIje2ZpbGV9I3tzZXB9I3tsaW5lfSN7c2VwfSN7Y29sbX1cIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBmaWxlTGluZSA9IFwiI3tlcnIuZmlsZW5hbWUgPyAnPyd9OiN7ZXJyLmxpbmV9OiN7ZXJyLmNvbHVtbn1cIlxuICAgICAgICAgICBcbiAgICAgICAgZXJyLmZpbGVMaW5lID0gZmlsZUxpbmVcbiAgICAgICAgZXJyLmNvZGVMaW5lID0gY29kZUxpbmVcbiAgICAgICAgZXJyLm1hcmtMaW5lID0gbWFya0xpbmUgKyAnICcgKyBtZXNzYWdlXG4gICAgICAgIFxuICAgICAgICBlcnIubWVzc2FnZSA9IFwiXCJcIlxuICAgICAgICAgICAgI3tlcnIuZmlsZUxpbmV9XG4gICAgICAgICAgICAje2Vyci5jb2RlTGluZX1cbiAgICAgICAgICAgICN7ZXJyLm1hcmtMaW5lfVxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgIGVyci5zdGFjayA9IGVyci5tZXNzYWdlXG4gICAgZXJyXG5cbiMgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4jICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuIyAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICBcbiMgICAgMDAwICAgICAwMDAgICAgICAgICAgICAwMDAgICAgIDAwMCAgICAgXG4jICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuXG5lZ2FsID0gKGEsIGIpIC0+XG4gIGlmIGEgaXMgYlxuICAgIGEgIT0gMCBvciAxL2EgaXMgMS9iXG4gIGVsc2VcbiAgICBhICE9IGEgYW5kIGIgIT0gYlxuICAgIFxuYXJyYXlFZ2FsID0gKGEsIGIpIC0+XG4gIGlmIGVnYWwgYSwgYiB0aGVuIHllc1xuICBlbHNlIGlmIGEgaW5zdGFuY2VvZiBBcnJheSBhbmQgYiBpbnN0YW5jZW9mIEFycmF5XG4gICAgcmV0dXJuIG5vIGlmIGEubGVuZ3RoICE9IGIubGVuZ3RoXG4gICAgcmV0dXJuIG5vIGZvciBlbCwgaWR4IGluIGEgd2hlbiBub3QgYXJyYXlFZ2FsIGVsLCBiW2lkeF1cbiAgICB5ZXNcblxuZXEgICAgICA9IChhLCBiLCBtc2cpIC0+IG9rIGVnYWwoYSwgYiksIG1zZyBvciBcIlxceDFCWzA7OTBtXFxuIDw8PCBleHBlY3RlZCA+Pj5cXG5cXHgxQlswOzkzbSN7YX1cXHgxQlswOzkwbTw8PCB0byBlcXVhbCA+Pj5cXG5cXHgxQlswOzkzbSN7Yn1cXHgxQlswOzkwbTw8PCBleHBlY3RlZCA+Pj5cXG5cIlxuYXJyYXlFcSA9IChhLCBiLCBtc2cpIC0+IG9rIGFycmF5RWdhbChhLGIpLCBtc2cgb3IgXCJcXHgxQlswOzkwbVxcbiA+Pj5cXG5cXHgxQlswOzkzbSN7YX1cXHgxQlswOzkwbTw8PCB0byBkZWVwIGVxdWFsID4+PlxcblxceDFCWzA7OTNtI3tifVxceDFCWzA7OTBtPDw8IGV4cGVjdGVkID4+PlxcblwiXG5jZXEgICAgID0gKGEsYikgLT4gXG4gICAgcmVnID0gbmV3IFJlZ0V4cCAnW1xcXFx1MDAxQlxcXFx1MDA5Ql1bW1xcXFxdKCkjOz9dKig/Oig/Oig/OlthLXpBLVpcXFxcZF0qKD86O1stYS16QS1aXFxcXGRcXFxcLyMmLjo9PyVAfl9dKikqKT9cXFxcdTAwMDcpfCg/Oig/OlxcXFxkezEsNH0oPzo7XFxcXGR7MCw0fSkqKT9bXFxcXGRBLVBSLVRaY2YtbnRxcnk9Pjx+XSkpJywgJ2cnXG4gICAgZXEgYS5yZXBsYWNlKHJlZywgJycpLCBiLnJlcGxhY2UocmVnLCAnJylcblxudG9KUyA9IChzdHIpIC0+XG4gIEtvZmZlZS5jb21waWxlIHN0ciwgYmFyZTogeWVzXG4gIC5yZXBsYWNlIC9eXFxzK3xcXHMrJC9nLCAnJyAjIFRyaW0gbGVhZGluZy90cmFpbGluZyB3aGl0ZXNwYWNlXG5cbnN0cmluZ2lmeSA9IChvKSAtPlxuICAgIG5vb24gPSByZXF1aXJlICdub29uJ1xuICAgIG5vb24uc3RyaW5naWZ5IG8sIGNpcmN1bGFyOiB0cnVlLCBjb2xvcnM6IHRydWVcbiAgICBcbiMgSW5pdGlhbGl6ZSBnbG9iYWwgdmFyaWFibGVzIHVzZWQgaW4gdGVzdCBzY3JpcHRzIFxuIyBTdXBwb3J0cyBydW5uaW5nIHNpbmdsZSB0ZXN0IHZpYSBga29mZmVlIHRlc3QvLi5gXG5cbmluaXRUZXN0ID0gLT5cbiAgICBleHRlbmQgZ2xvYmFsLCByZXF1aXJlICdhc3NlcnQnIFxuICAgIGdsb2JhbC5Lb2ZmZWUgPSByZXF1aXJlICcuL2tvZmZlZSdcbiAgICBnbG9iYWwuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUnXG4gICAgZXh0ZW5kIGdsb2JhbCwgbW9kdWxlLmV4cG9ydHNcbiAgICBpZiBub3QgZ2xvYmFsLnRlc3QgdGhlbiBnbG9iYWwudGVzdCA9IChuLGYpIC0+IGxvZyBuOyBmKClcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjb2xvcnNcbiAgICBzdGFydHNcbiAgICBlbmRzXG4gICAgcmVwZWF0XG4gICAgcGFkXG4gICAgY29tcGFjdFxuICAgIGNvdW50XG4gICAgbWVyZ2VcbiAgICBleHRlbmRcbiAgICBmbGF0dGVuXG4gICAgZGVsXG4gICAgc29tZVxuICAgIGFkZExvY2F0aW9uRGF0YUZuXG4gICAgbG9jYXRpb25EYXRhVG9TdHJpbmdcbiAgICBiYXNlRmlsZU5hbWVcbiAgICBpc0NvZmZlZVxuICAgIHRocm93U3ludGF4RXJyb3JcbiAgICB1cGRhdGVTeW50YXhFcnJvclxuICAgIGVxXG4gICAgY2VxXG4gICAgYXJyYXlFcVxuICAgIHRvSlNcbiAgICBzdHJpbmdpZnlcbiAgICBpbml0VGVzdFxufVxuICAgIFxuIl19
//# sourceURL=../coffee/helpers.coffee