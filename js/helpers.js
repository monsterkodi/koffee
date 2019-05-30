// koffee 0.56.0

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
    var c, codeLine, colNum, colm, column, compiled, e, end, file, fileLine, first_column, first_line, i, j, last_column, last_line, len1, line, lineIndex, lineNum, lines, mapped, markLine, match, message, ref1, ref2, ref3, ref4, ref5, ref6, ref7, sep, sourceMap, start;
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
            ref1 = err.location, first_line = ref1.first_line, first_column = ref1.first_column, last_line = ref1.last_line, last_column = ref1.last_column;
        } else {
            first_line = first_column = 0;
            try {
                if (err.stack != null) {
                    compiled = require('./koffee').compile(code, {
                        bare: options != null ? options.bare : void 0,
                        feature: {
                            header: options != null ? (ref2 = options.feature) != null ? ref2.header : void 0 : void 0
                        },
                        filename: filename,
                        sourceFiles: [filename],
                        sourceMap: true
                    });
                    sourceMap = compiled.sourceMap;
                    if (sourceMap) {
                        lines = err.stack.split('\n');
                        for (lineIndex = i = 0, ref3 = lines.length; 0 <= ref3 ? i < ref3 : i > ref3; lineIndex = 0 <= ref3 ? ++i : --i) {
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
                                            ref4 = sourceMap.lines[lineNum - 1].columns;
                                            for (j = 0, len1 = ref4.length; j < len1; j++) {
                                                column = ref4[j];
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
                        console.log('[33m[93mhelpers[33m[2m.[22m[2mcoffee[22m[39m[2m[34m:[39m[22m[94m229[39m', '[1m[97mno source map![39m[22m', '');
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
        if ((options != null ? (ref5 = options.feature) != null ? ref5.color : void 0 : void 0) !== false) {
            colorette.options.enabled = true;
            codeLine = codeLine.slice(0, start) + red(codeLine.slice(start, end)) + codeLine.slice(end);
            markLine = red(markLine);
            message = yellowBright(message);
            sep = dim(blue(':'));
            line = blue("" + err.line);
            colm = dim(blue("" + err.column));
            file = path.parse((ref6 = err.filename) != null ? ref6 : '');
            file = yellow(dim(file.dir + '/') + file.name + dim(file.ext));
            fileLine = "" + file + sep + line + sep + colm;
        } else {
            fileLine = ((ref7 = err.filename) != null ? ref7 : '?') + ":" + err.line + ":" + err.column;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztBQU9QLE1BQUEsR0FBUyxTQUFBO0FBQ0wsUUFBQTtJQUFBLFNBQUEsR0FBWSxPQUFBLENBQVEsV0FBUjtJQUNaLFVBQUEsR0FBYyxDQUNWLEtBRFUsRUFDQSxNQURBLEVBRVYsS0FGVSxFQUVBLFdBRkEsRUFHVixNQUhVLEVBR0EsWUFIQSxFQUlWLFFBSlUsRUFJQSxjQUpBLEVBS1YsT0FMVSxFQUtBLGFBTEEsRUFNVixPQU5VLEVBTUEsYUFOQSxFQU9WLE1BUFUsRUFPQSxZQVBBLEVBUVYsTUFSVSxFQVFBLFlBUkEsRUFTVixTQVRVLEVBU0EsZUFUQTtBQVdkLFNBQUEsOENBQUE7O1FBQ0ksTUFBTyxDQUFBLElBQUEsQ0FBUCxHQUFlLFNBQVUsQ0FBQSxJQUFBO0FBRDdCO1dBRUEsTUFBTSxDQUFDLFNBQVAsR0FBbUI7QUFmZDs7QUFpQlQsTUFBQSxHQUFTLFNBQUMsTUFBRCxFQUFTLE9BQVQsRUFBa0IsS0FBbEI7V0FDTCxPQUFBLEtBQVcsTUFBTSxDQUFDLE1BQVAsQ0FBYyxLQUFkLEVBQXFCLE9BQU8sQ0FBQyxNQUE3QjtBQUROOztBQUtULElBQUEsR0FBTyxTQUFDLE1BQUQsRUFBUyxPQUFULEVBQWtCLElBQWxCO0FBQ0gsUUFBQTtJQUFBLEdBQUEsR0FBTSxPQUFPLENBQUM7V0FDZCxPQUFBLEtBQVcsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsTUFBUCxHQUFnQixHQUFoQixHQUFzQixDQUFDLElBQUEsSUFBUSxDQUFULENBQXBDLEVBQWlELEdBQWpEO0FBRlI7O0FBTVAsTUFBQSxHQUFTLFNBQUMsR0FBRCxFQUFNLENBQU47QUFHTCxRQUFBO0lBQUEsR0FBQSxHQUFNO0FBQ04sV0FBTSxDQUFBLEdBQUksQ0FBVjtRQUNJLElB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QUMsU0FBTCxDQUFlLENBQWYsRUFBa0I7UUFBQSxRQUFBLEVBQVUsSUFBVjtRQUFnQixNQUFBLEVBQVEsSUFBeEI7S0FBbEI7QUFGUTs7QUFPWixRQUFBLEdBQVcsU0FBQTtJQUNQLE1BQUEsQ0FBTyxNQUFQLEVBQWUsT0FBQSxDQUFRLFFBQVIsQ0FBZjtJQUNBLE1BQU0sQ0FBQyxNQUFQLEdBQWdCLE9BQUEsQ0FBUSxVQUFSO0lBQ2hCLE1BQU0sQ0FBQyxDQUFQLEdBQVcsT0FBQSxDQUFRLFlBQVI7SUFDWCxNQUFBLENBQU8sTUFBUCxFQUFlLE1BQU0sQ0FBQyxPQUF0QjtJQUNBLElBQUcsQ0FBSSxNQUFNLENBQUMsSUFBZDtlQUF3QixNQUFNLENBQUMsSUFBUCxHQUFjLFNBQUMsQ0FBRCxFQUFHLENBQUg7WUFBTyxPQUFBLENBQUUsR0FBRixDQUFNLENBQU47bUJBQVMsQ0FBQSxDQUFBO1FBQWhCLEVBQXRDOztBQUxPOztBQU9YLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0lBQ2IsUUFBQSxNQURhO0lBRWIsUUFBQSxNQUZhO0lBR2IsTUFBQSxJQUhhO0lBSWIsUUFBQSxNQUphO0lBS2IsS0FBQSxHQUxhO0lBTWIsU0FBQSxPQU5hO0lBT2IsT0FBQSxLQVBhO0lBUWIsT0FBQSxLQVJhO0lBU2IsUUFBQSxNQVRhO0lBVWIsU0FBQSxPQVZhO0lBV2IsS0FBQSxHQVhhO0lBWWIsTUFBQSxJQVphO0lBYWIsbUJBQUEsaUJBYmE7SUFjYixzQkFBQSxvQkFkYTtJQWViLGNBQUEsWUFmYTtJQWdCYixVQUFBLFFBaEJhO0lBaUJiLGtCQUFBLGdCQWpCYTtJQWtCYixtQkFBQSxpQkFsQmE7SUFtQmIsSUFBQSxFQW5CYTtJQW9CYixLQUFBLEdBcEJhO0lBcUJiLFNBQUEsT0FyQmE7SUFzQmIsTUFBQSxJQXRCYTtJQXVCYixXQUFBLFNBdkJhO0lBd0JiLFVBQUEsUUF4QmEiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIFxuMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4wMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICBcbjAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4jIyNcblxucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5cbiMgRnVuY3Rpb25zIHRoYXQgd2UnZCBsaWtlIHRvIHNoYXJlIGFtb25nIHRoZSBMZXhlciwgUmV3cml0ZXIsIGFuZCBOb2Rlcy4gXG4jIE1lcmdlIG9iamVjdHMsIGZsYXR0ZW4gYXJyYXlzLCBjb3VudCBjaGFyYWN0ZXJzLCB0aGF0IHNvcnQgb2YgdGhpbmcuXG5cbiMgUGVlayBhdCB0aGUgYmVnaW5uaW5nIG9mIGEgZ2l2ZW4gc3RyaW5nIHRvIHNlZSBpZiBpdCBtYXRjaGVzIGEgc2VxdWVuY2UuXG5cbmNvbG9ycyA9IC0+XG4gICAgY29sb3JldHRlID0gcmVxdWlyZSAnY29sb3JldHRlJ1xuICAgIGNvbG9ybmFtZXMgPSAgW1xuICAgICAgICAnZGltJyAgICAgJ2JvbGQnXG4gICAgICAgICdyZWQnICAgICAncmVkQnJpZ2h0J1xuICAgICAgICAnZ3JheScgICAgJ2dyYXlCcmlnaHQnXG4gICAgICAgICd5ZWxsb3cnICAneWVsbG93QnJpZ2h0J1xuICAgICAgICAnZ3JlZW4nICAgJ2dyZWVuQnJpZ2h0J1xuICAgICAgICAnd2hpdGUnICAgJ3doaXRlQnJpZ2h0J1xuICAgICAgICAnYmx1ZScgICAgJ2JsdWVCcmlnaHQnXG4gICAgICAgICdjeWFuJyAgICAnY3lhbkJyaWdodCdcbiAgICAgICAgJ21hZ2VudGEnICdtYWdlbnRhQnJpZ2h0J1xuICAgIF0gXG4gICAgZm9yIG5hbWUgaW4gY29sb3JuYW1lc1xuICAgICAgICBnbG9iYWxbbmFtZV0gPSBjb2xvcmV0dGVbbmFtZV1cbiAgICBnbG9iYWwuY29sb3JldHRlID0gY29sb3JldHRlXG5cbnN0YXJ0cyA9IChzdHJpbmcsIGxpdGVyYWwsIHN0YXJ0KSAtPlxuICAgIGxpdGVyYWwgaXMgc3RyaW5nLnN1YnN0ciBzdGFydCwgbGl0ZXJhbC5sZW5ndGhcblxuIyBQZWVrIGF0IHRoZSBlbmQgb2YgYSBnaXZlbiBzdHJpbmcgdG8gc2VlIGlmIGl0IG1hdGNoZXMgYSBzZXF1ZW5jZS5cblxuZW5kcyA9IChzdHJpbmcsIGxpdGVyYWwsIGJhY2spIC0+XG4gICAgbGVuID0gbGl0ZXJhbC5sZW5ndGhcbiAgICBsaXRlcmFsIGlzIHN0cmluZy5zdWJzdHIgc3RyaW5nLmxlbmd0aCAtIGxlbiAtIChiYWNrIG9yIDApLCBsZW5cblxuIyBSZXBlYXQgYSBzdHJpbmcgYG5gIHRpbWVzLlxuXG5yZXBlYXQgPSAoc3RyLCBuKSAtPlxuICAgIFxuICAgICMgVXNlIGNsZXZlciBhbGdvcml0aG0gdG8gaGF2ZSBPKGxvZyhuKSkgc3RyaW5nIGNvbmNhdGVuYXRpb24gb3BlcmF0aW9ucy5cbiAgICByZXMgPSAnJ1xuICAgIHdoaWxlIG4gPiAwXG4gICAgICAgIHJlcyArPSBzdHIgaWYgbiAmIDFcbiAgICAgICAgbiA+Pj49IDFcbiAgICAgICAgc3RyICs9IHN0clxuICAgIHJlc1xuXG5wYWQgPSAoc3RyLCBsZW5ndGg9MjQpIC0+ICMgc3RyIHBhZGRlZCB3aXRoIHNwYWNlcyB0byBsZW5ndGhcbiAgICBcbiAgICBzcGFjZXMgPSBsZW5ndGggLSBzdHIubGVuZ3RoXG4gICAgc3BhY2VzID0gaWYgc3BhY2VzID4gMCB0aGVuIEFycmF5KHNwYWNlcyArIDEpLmpvaW4oJyAnKSBlbHNlICcnXG4gICAgXCIje3N0cn0je3NwYWNlc31cIlxuICAgIFxuIyBUcmltIG91dCBhbGwgZmFsc3kgdmFsdWVzIGZyb20gYW4gYXJyYXkuXG5cbmNvbXBhY3QgPSAoYXJyYXkpIC0+XG4gICAgaXRlbSBmb3IgaXRlbSBpbiBhcnJheSB3aGVuIGl0ZW1cblxuIyBDb3VudCB0aGUgbnVtYmVyIG9mIG9jY3VycmVuY2VzIG9mIGEgc3RyaW5nIGluIGEgc3RyaW5nLlxuXG5jb3VudCA9IChzLCBzdWJzdHIpIC0+XG4gICAgbnVtID0gcG9zID0gMFxuICAgIHJldHVybiAxLzAgdW5sZXNzIHN1YnN0ci5sZW5ndGhcbiAgICBudW0rKyB3aGlsZSBwb3MgPSAxICsgcy5pbmRleE9mIHN1YnN0ciwgcG9zXG4gICAgbnVtXG5cbiMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuIyAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMDAgICAgIDAwMDAwICAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICBcbiMgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDAgIFxuIyAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG5cbiMgRXh0ZW5kIGEgc291cmNlIG9iamVjdCB3aXRoIHRoZSBwcm9wZXJ0aWVzIG9mIGFub3RoZXIgb2JqZWN0IChzaGFsbG93IGNvcHkpLlxuXG5leHRlbmQgPSAob2JqZWN0LCBwcm9wZXJ0aWVzKSAtPlxuICAgIGZvciBrZXksIHZhbCBvZiBwcm9wZXJ0aWVzXG4gICAgICAgIG9iamVjdFtrZXldID0gdmFsXG4gICAgb2JqZWN0XG5cbiMgTWVyZ2Ugb2JqZWN0cywgcmV0dXJuaW5nIGEgZnJlc2ggY29weSB3aXRoIGF0dHJpYnV0ZXMgZnJvbSBib3RoIHNpZGVzLlxuIyBVc2VkIGV2ZXJ5IHRpbWUgYEJhc2UjY29tcGlsZWAgaXMgY2FsbGVkLCB0byBhbGxvdyBwcm9wZXJ0aWVzIGluIHRoZVxuIyBvcHRpb25zIGhhc2ggdG8gcHJvcGFnYXRlIGRvd24gdGhlIHRyZWUgd2l0aG91dCBwb2xsdXRpbmcgb3RoZXIgYnJhbmNoZXMuXG5cbm1lcmdlID0gKG9wdGlvbnMsIG92ZXJyaWRlcykgLT4gZXh0ZW5kIChleHRlbmQge30sIG9wdGlvbnMpLCBvdmVycmlkZXNcblxuIyBSZXR1cm4gYSBmbGF0dGVuZWQgdmVyc2lvbiBvZiBhbiBhcnJheS5cbiMgSGFuZHkgZm9yIGdldHRpbmcgYSBsaXN0IG9mIGBjaGlsZHJlbmAgZnJvbSB0aGUgbm9kZXMuXG4gICAgXG5mbGF0dGVuID0gKGFycmF5KSAtPlxuICAgIGZsYXR0ZW5lZCA9IFtdXG4gICAgZm9yIGVsZW1lbnQgaW4gYXJyYXlcbiAgICAgICAgaWYgJ1tvYmplY3QgQXJyYXldJyBpcyBPYmplY3Q6OnRvU3RyaW5nLmNhbGwgZWxlbWVudFxuICAgICAgICAgICAgZmxhdHRlbmVkID0gZmxhdHRlbmVkLmNvbmNhdCBmbGF0dGVuIGVsZW1lbnRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZmxhdHRlbmVkLnB1c2ggZWxlbWVudFxuICAgIGZsYXR0ZW5lZFxuXG4jIERlbGV0ZSBhIGtleSBmcm9tIGFuIG9iamVjdCwgcmV0dXJuaW5nIHRoZSB2YWx1ZS4gVXNlZnVsIHdoZW4gYSBub2RlIGlzXG4jIGxvb2tpbmcgZm9yIGEgcGFydGljdWxhciBtZXRob2QgaW4gYW4gb3B0aW9ucyBoYXNoLlxuICAgIFxuZGVsID0gKG9iaiwga2V5KSAtPlxuICAgIHZhbCA9ICBvYmpba2V5XVxuICAgIGRlbGV0ZSBvYmpba2V5XVxuICAgIHZhbFxuXG4jIFR5cGljYWwgQXJyYXk6OnNvbWVcblxuc29tZSA9IEFycmF5Ojpzb21lID8gKGZuKSAtPlxuICAgIHJldHVybiB0cnVlIGZvciBlIGluIHRoaXMgd2hlbiBmbiBlXG4gICAgZmFsc2VcblxuIyBNZXJnZSB0d28gamlzb24tc3R5bGUgbG9jYXRpb24gZGF0YSBvYmplY3RzIHRvZ2V0aGVyLlxuIyBJZiBgbGFzdGAgaXMgbm90IHByb3ZpZGVkLCB0aGlzIHdpbGwgc2ltcGx5IHJldHVybiBgZmlyc3RgLlxuXG5idWlsZExvY2F0aW9uRGF0YSA9IChmaXJzdCwgbGFzdCkgLT5cbiAgICBpZiBub3QgbGFzdFxuICAgICAgICBmaXJzdFxuICAgIGVsc2VcbiAgICAgICAgZmlyc3RfbGluZTogZmlyc3QuZmlyc3RfbGluZVxuICAgICAgICBmaXJzdF9jb2x1bW46IGZpcnN0LmZpcnN0X2NvbHVtblxuICAgICAgICBsYXN0X2xpbmU6IGxhc3QubGFzdF9saW5lXG4gICAgICAgIGxhc3RfY29sdW1uOiBsYXN0Lmxhc3RfY29sdW1uXG5cbiMgVGhpcyByZXR1cm5zIGEgZnVuY3Rpb24gd2hpY2ggdGFrZXMgYW4gb2JqZWN0IGFzIGEgcGFyYW1ldGVyLCBhbmQgaWYgdGhhdFxuIyBvYmplY3QgaXMgYW4gQVNUIG5vZGUsIHVwZGF0ZXMgdGhhdCBvYmplY3QncyBsb2NhdGlvbkRhdGEuXG4jIFRoZSBvYmplY3QgaXMgcmV0dXJuZWQgZWl0aGVyIHdheS5cblxuYWRkTG9jYXRpb25EYXRhRm4gPSAoZmlyc3QsIGxhc3QpIC0+XG4gICAgKG9iaikgLT5cbiAgICAgICAgaWYgKCh0eXBlb2Ygb2JqKSBpcyAnb2JqZWN0JykgYW5kICghIW9ialsndXBkYXRlTG9jYXRpb25EYXRhSWZNaXNzaW5nJ10pXG4gICAgICAgICAgICBvYmoudXBkYXRlTG9jYXRpb25EYXRhSWZNaXNzaW5nIGJ1aWxkTG9jYXRpb25EYXRhKGZpcnN0LCBsYXN0KVxuXG4gICAgICAgIHJldHVybiBvYmpcblxuIyBDb252ZXJ0IGppc29uIGxvY2F0aW9uIGRhdGEgdG8gYSBzdHJpbmcuXG4jIGBvYmpgIGNhbiBiZSBhIHRva2VuLCBvciBhIGxvY2F0aW9uRGF0YS5cblxubG9jYXRpb25EYXRhVG9TdHJpbmcgPSAob2JqKSAtPlxuICAgIGlmIChcIjJcIiBvZiBvYmopIGFuZCAoXCJmaXJzdF9saW5lXCIgb2Ygb2JqWzJdKSB0aGVuIGxvY2F0aW9uRGF0YSA9IG9ialsyXVxuICAgIGVsc2UgaWYgXCJmaXJzdF9saW5lXCIgb2Ygb2JqIHRoZW4gbG9jYXRpb25EYXRhID0gb2JqXG5cbiAgICBpZiBsb2NhdGlvbkRhdGFcbiAgICAgICAgXCIje2xvY2F0aW9uRGF0YS5maXJzdF9saW5lICsgMX06I3tsb2NhdGlvbkRhdGEuZmlyc3RfY29sdW1uICsgMX0tXCIgK1xuICAgICAgICBcIiN7bG9jYXRpb25EYXRhLmxhc3RfbGluZSArIDF9OiN7bG9jYXRpb25EYXRhLmxhc3RfY29sdW1uICsgMX1cIlxuICAgIGVsc2VcbiAgICAgICAgXCJObyBsb2NhdGlvbiBkYXRhXCJcblxuIyBBIGAuY29mZmVlLm1kYCBjb21wYXRpYmxlIHZlcnNpb24gb2YgYGJhc2VuYW1lYCwgdGhhdCByZXR1cm5zIHRoZSBmaWxlIHNhbnMtZXh0ZW5zaW9uLlxuXG5iYXNlRmlsZU5hbWUgPSAoZmlsZSwgc3RyaXBFeHQgPSBubywgdXNlV2luUGF0aFNlcCA9IG5vKSAtPlxuICAgIHBhdGhTZXAgPSBpZiB1c2VXaW5QYXRoU2VwIHRoZW4gL1xcXFx8XFwvLyBlbHNlIC9cXC8vXG4gICAgcGFydHMgPSBmaWxlLnNwbGl0KHBhdGhTZXApXG4gICAgZmlsZSA9IHBhcnRzW3BhcnRzLmxlbmd0aCAtIDFdXG4gICAgcmV0dXJuIGZpbGUgdW5sZXNzIHN0cmlwRXh0IGFuZCBmaWxlLmluZGV4T2YoJy4nKSA+PSAwXG4gICAgcGFydHMgPSBmaWxlLnNwbGl0KCcuJylcbiAgICBwYXJ0cy5wb3AoKVxuICAgIHBhcnRzLnBvcCgpIGlmIC9eW2NrXW9mZmVlJC8udGVzdChwYXJ0c1twYXJ0cy5sZW5ndGgtMV0pIGFuZCBwYXJ0cy5sZW5ndGggPiAxXG4gICAgcGFydHMuam9pbignLicpXG5cbiMgRGV0ZXJtaW5lIGlmIGEgZmlsZW5hbWUgcmVwcmVzZW50cyBhIGtvZmZlZSBmaWxlLlxuXG5pc0NvZmZlZSA9IChmaWxlKSAtPiAvXFwuW2NrXW9mZmVlJC8udGVzdCBmaWxlXG5cbiMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiMgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwMCAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcblxudGhyb3dTeW50YXhFcnJvciA9IChtb2R1bGU6LG1lc3NhZ2U6LGxvY2F0aW9uOikgLT5cbiAgICBcbiAgICBlcnIgPSBuZXcgU3ludGF4RXJyb3IgbWVzc2FnZVxuICAgIGVyci5sb2NhdGlvbiA9IGxvY2F0aW9uXG4gICAgdGhyb3cgZXJyXG5cbnVwZGF0ZVN5bnRheEVycm9yID0gKGVyciwgY29kZSwgZmlsZW5hbWUsIG9wdGlvbnMpIC0+ICMgVXBkYXRlIGEgY29tcGlsZXIgU3ludGF4RXJyb3Igd2l0aCBzb3VyY2UgY29kZSBpbmZvcm1hdGlvblxuICAgIFxuICAgIGVyci5jb2RlICAgICA/PSBjb2RlXG4gICAgZXJyLmZpbGVuYW1lID89IGZpbGVuYW1lXG4gICAgICAgICAgICBcbiAgICByZXR1cm4gZXJyIGlmIGVyci5tYXJrTGluZVxuICAgIFxuICAgIGlmIGVyci5jb2RlXG5cbiAgICAgICAgaWYgZXJyLmxvY2F0aW9uXG4gICAgICAgICAgICB7Zmlyc3RfbGluZSwgZmlyc3RfY29sdW1uLCBsYXN0X2xpbmUsIGxhc3RfY29sdW1ufSA9IGVyci5sb2NhdGlvblxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBmaXJzdF9saW5lID0gZmlyc3RfY29sdW1uID0gMFxuICAgICAgICAgICAgdHJ5XG4gICAgICAgICAgICAgICAgaWYgZXJyLnN0YWNrP1xuICAgICAgICAgICAgICAgICAgICBjb21waWxlZCA9IHJlcXVpcmUoJy4va29mZmVlJykuY29tcGlsZShjb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYmFyZTogICAgICAgICAgICBvcHRpb25zPy5iYXJlXG4gICAgICAgICAgICAgICAgICAgICAgICBmZWF0dXJlOiBoZWFkZXI6IG9wdGlvbnM/LmZlYXR1cmU/LmhlYWRlclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZW5hbWU6ICAgICAgICBmaWxlbmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlRmlsZXM6ICAgICBbZmlsZW5hbWVdXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VNYXA6ICAgICAgIHRydWVcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgc291cmNlTWFwID0gY29tcGlsZWQuc291cmNlTWFwXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgc291cmNlTWFwXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVzID0gZXJyLnN0YWNrLnNwbGl0ICdcXG4nXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciBsaW5lSW5kZXggaW4gWzAuLi5saW5lcy5sZW5ndGhdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZSA9IGxpbmVzW2xpbmVJbmRleF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBtYXRjaCA9IC86KFswLTldKyk6PyhbMC05XSspP1spXT8kLy5leGVjIGxpbmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZSA9IGxpbmVzW2xpbmVJbmRleF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZU51bSA9IHBhcnNlSW50IG1hdGNoWzFdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbE51bSAgPSBwYXJzZUludCBtYXRjaFsyXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAxIDw9IGxpbmVOdW0gPCBzb3VyY2VNYXAubGluZXMubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjID0gY29sTnVtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBOdW1iZXIuaXNOYU4oYykgdGhlbiBjID0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgc291cmNlTWFwLmxpbmVzW2xpbmVOdW0tMV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBtYXBwZWQgPSBzb3VyY2VNYXAubGluZXNbbGluZU51bS0xXS5zb3VyY2VMb2NhdGlvbihjLTEpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtmaXJzdF9saW5lLCBmaXJzdF9jb2x1bW5dID0gbWFwcGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgY29sdW1uIGluIHNvdXJjZU1hcC5saW5lc1tsaW5lTnVtLTFdLmNvbHVtbnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIGNvbHVtblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0X2xpbmUgPSBjb2x1bW4uc291cmNlTGluZS0xXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAg4pa4ZGJnICdubyBzb3VyY2UgbWFwISdcbiAgICAgICAgICAgIGNhdGNoIGVcbiAgICAgICAgICAgICAgICBsb2cgJ3VwZGF0ZVN5bnRheEVycm9yIC0tIGJ1dCBjYW50IGZpZ3VyZSBvdXQgc291cmNlIGxvY2F0aW9uJywgZVxuICAgICAgICAgICAgICAgIHJldHVybiBlcnJcbiAgICAgICAgICAgIFxuICAgICAgICBsYXN0X2xpbmUgPz0gZmlyc3RfbGluZVxuICAgICAgICBsYXN0X2NvbHVtbiA/PSBmaXJzdF9jb2x1bW5cbiAgICBcbiAgICAgICAgY29kZUxpbmUgPSBlcnIuY29kZS5zcGxpdCgnXFxuJylbZmlyc3RfbGluZV1cbiAgICAgICAgc3RhcnQgICAgPSBmaXJzdF9jb2x1bW4gICAgICAgIFxuICAgICAgICBlbmQgICAgICA9IGlmIGZpcnN0X2xpbmUgaXMgbGFzdF9saW5lIHRoZW4gbGFzdF9jb2x1bW4gKyAxIGVsc2UgY29kZUxpbmUubGVuZ3RoICMgU2hvdyBvbmx5IHRoZSBmaXJzdCBsaW5lIG9uIG11bHRpLWxpbmUgZXJyb3JzLlxuICAgICAgICBtYXJrTGluZSA9IGNvZGVMaW5lWy4uLnN0YXJ0XS5yZXBsYWNlKC9bXlxcc10vZywgJyAnKSArIHJlcGVhdCgn4payJywgZW5kIC0gc3RhcnQpXG4gICAgXG4gICAgICAgIG1lc3NhZ2UgID0gZXJyLm1lc3NhZ2VcbiAgICAgICAgXG4gICAgICAgIGVyci5saW5lICAgPSBmaXJzdF9saW5lKzFcbiAgICAgICAgZXJyLmNvbHVtbiA9IGZpcnN0X2NvbHVtbisxXG4gICAgICAgIFxuICAgICAgICBpZiBvcHRpb25zPy5mZWF0dXJlPy5jb2xvciAhPSBmYWxzZVxuICAgICAgICAgICAgY29sb3JldHRlLm9wdGlvbnMuZW5hYmxlZCA9IHRydWVcbiAgICAgICAgICAgIGNvZGVMaW5lID0gY29kZUxpbmVbLi4uc3RhcnRdICsgcmVkKGNvZGVMaW5lW3N0YXJ0Li4uZW5kXSkgKyBjb2RlTGluZVtlbmQuLl1cbiAgICAgICAgICAgIG1hcmtMaW5lID0gcmVkIG1hcmtMaW5lXG4gICAgICAgICAgICBtZXNzYWdlICA9IHllbGxvd0JyaWdodCBtZXNzYWdlIFxuICAgICAgICAgICAgc2VwID0gZGltIGJsdWUgJzonXG4gICAgICAgICAgICBsaW5lID0gYmx1ZSBcIiN7ZXJyLmxpbmV9XCJcbiAgICAgICAgICAgIGNvbG0gPSBkaW0gYmx1ZSBcIiN7ZXJyLmNvbHVtbn1cIlxuICAgICAgICAgICAgZmlsZSA9IHBhdGgucGFyc2UgZXJyLmZpbGVuYW1lID8gJydcbiAgICAgICAgICAgIGZpbGUgPSB5ZWxsb3cgZGltKGZpbGUuZGlyICsgJy8nKSArIGZpbGUubmFtZSArIGRpbSBmaWxlLmV4dFxuICAgICAgICAgICAgZmlsZUxpbmUgPSBcIiN7ZmlsZX0je3NlcH0je2xpbmV9I3tzZXB9I3tjb2xtfVwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGZpbGVMaW5lID0gXCIje2Vyci5maWxlbmFtZSA/ICc/J306I3tlcnIubGluZX06I3tlcnIuY29sdW1ufVwiXG4gICAgICAgICAgIFxuICAgICAgICBlcnIuZmlsZUxpbmUgPSBmaWxlTGluZVxuICAgICAgICBlcnIuY29kZUxpbmUgPSBjb2RlTGluZVxuICAgICAgICBlcnIubWFya0xpbmUgPSBtYXJrTGluZSArICcgJyArIG1lc3NhZ2VcbiAgICAgICAgXG4gICAgICAgIGVyci5tZXNzYWdlID0gXCJcIlwiXG4gICAgICAgICAgICAje2Vyci5maWxlTGluZX1cbiAgICAgICAgICAgICN7ZXJyLmNvZGVMaW5lfVxuICAgICAgICAgICAgI3tlcnIubWFya0xpbmV9XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgZXJyLnN0YWNrID0gZXJyLm1lc3NhZ2VcbiAgICBlcnJcblxuIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICBcbiMgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4jICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuIyAgICAwMDAgICAgIDAwMCAgICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbiMgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG5cbmVnYWwgPSAoYSwgYikgLT5cbiAgaWYgYSBpcyBiXG4gICAgYSAhPSAwIG9yIDEvYSBpcyAxL2JcbiAgZWxzZVxuICAgIGEgIT0gYSBhbmQgYiAhPSBiXG4gICAgXG5hcnJheUVnYWwgPSAoYSwgYikgLT5cbiAgaWYgZWdhbCBhLCBiIHRoZW4geWVzXG4gIGVsc2UgaWYgYSBpbnN0YW5jZW9mIEFycmF5IGFuZCBiIGluc3RhbmNlb2YgQXJyYXlcbiAgICByZXR1cm4gbm8gaWYgYS5sZW5ndGggIT0gYi5sZW5ndGhcbiAgICByZXR1cm4gbm8gZm9yIGVsLCBpZHggaW4gYSB3aGVuIG5vdCBhcnJheUVnYWwgZWwsIGJbaWR4XVxuICAgIHllc1xuXG5lcSAgICAgID0gKGEsIGIsIG1zZykgLT4gb2sgZWdhbChhLCBiKSwgbXNnIG9yIFwiXFx4MUJbMDs5MG1cXG4gPDw8IGV4cGVjdGVkID4+PlxcblxceDFCWzA7OTNtI3thfVxceDFCWzA7OTBtPDw8IHRvIGVxdWFsID4+PlxcblxceDFCWzA7OTNtI3tifVxceDFCWzA7OTBtPDw8IGV4cGVjdGVkID4+PlxcblwiXG5hcnJheUVxID0gKGEsIGIsIG1zZykgLT4gb2sgYXJyYXlFZ2FsKGEsYiksIG1zZyBvciBcIlxceDFCWzA7OTBtXFxuID4+PlxcblxceDFCWzA7OTNtI3thfVxceDFCWzA7OTBtPDw8IHRvIGRlZXAgZXF1YWwgPj4+XFxuXFx4MUJbMDs5M20je2J9XFx4MUJbMDs5MG08PDwgZXhwZWN0ZWQgPj4+XFxuXCJcbmNlcSAgICAgPSAoYSxiKSAtPiBcbiAgICByZWcgPSBuZXcgUmVnRXhwICdbXFxcXHUwMDFCXFxcXHUwMDlCXVtbXFxcXF0oKSM7P10qKD86KD86KD86W2EtekEtWlxcXFxkXSooPzo7Wy1hLXpBLVpcXFxcZFxcXFwvIyYuOj0/JUB+X10qKSopP1xcXFx1MDAwNyl8KD86KD86XFxcXGR7MSw0fSg/OjtcXFxcZHswLDR9KSopP1tcXFxcZEEtUFItVFpjZi1udHFyeT0+PH5dKSknLCAnZydcbiAgICBlcSBhLnJlcGxhY2UocmVnLCAnJyksIGIucmVwbGFjZShyZWcsICcnKVxuXG50b0pTID0gKHN0cikgLT5cbiAgS29mZmVlLmNvbXBpbGUgc3RyLCBiYXJlOiB5ZXNcbiAgLnJlcGxhY2UgL15cXHMrfFxccyskL2csICcnICMgVHJpbSBsZWFkaW5nL3RyYWlsaW5nIHdoaXRlc3BhY2Vcblxuc3RyaW5naWZ5ID0gKG8pIC0+XG4gICAgbm9vbiA9IHJlcXVpcmUgJ25vb24nXG4gICAgbm9vbi5zdHJpbmdpZnkgbywgY2lyY3VsYXI6IHRydWUsIGNvbG9yczogdHJ1ZVxuICAgIFxuIyBJbml0aWFsaXplIGdsb2JhbCB2YXJpYWJsZXMgdXNlZCBpbiB0ZXN0IHNjcmlwdHMgXG4jIFN1cHBvcnRzIHJ1bm5pbmcgc2luZ2xlIHRlc3QgdmlhIGBrb2ZmZWUgdGVzdC8uLmBcblxuaW5pdFRlc3QgPSAtPlxuICAgIGV4dGVuZCBnbG9iYWwsIHJlcXVpcmUgJ2Fzc2VydCcgXG4gICAgZ2xvYmFsLktvZmZlZSA9IHJlcXVpcmUgJy4va29mZmVlJ1xuICAgIGdsb2JhbC5fID0gcmVxdWlyZSAndW5kZXJzY29yZSdcbiAgICBleHRlbmQgZ2xvYmFsLCBtb2R1bGUuZXhwb3J0c1xuICAgIGlmIG5vdCBnbG9iYWwudGVzdCB0aGVuIGdsb2JhbC50ZXN0ID0gKG4sZikgLT4gbG9nIG47IGYoKVxuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNvbG9yc1xuICAgIHN0YXJ0c1xuICAgIGVuZHNcbiAgICByZXBlYXRcbiAgICBwYWRcbiAgICBjb21wYWN0XG4gICAgY291bnRcbiAgICBtZXJnZVxuICAgIGV4dGVuZFxuICAgIGZsYXR0ZW5cbiAgICBkZWxcbiAgICBzb21lXG4gICAgYWRkTG9jYXRpb25EYXRhRm5cbiAgICBsb2NhdGlvbkRhdGFUb1N0cmluZ1xuICAgIGJhc2VGaWxlTmFtZVxuICAgIGlzQ29mZmVlXG4gICAgdGhyb3dTeW50YXhFcnJvclxuICAgIHVwZGF0ZVN5bnRheEVycm9yXG4gICAgZXFcbiAgICBjZXFcbiAgICBhcnJheUVxXG4gICAgdG9KU1xuICAgIHN0cmluZ2lmeVxuICAgIGluaXRUZXN0XG59XG4gICAgIl19
//# sourceURL=../coffee/helpers.coffee