// koffee 0.38.0

/*
000   000  00000000  000      00000000   00000000  00000000    0000000  
000   000  000       000      000   000  000       000   000  000       
000000000  0000000   000      00000000   0000000   0000000    0000000   
000   000  000       000      000        000       000   000       000  
000   000  00000000  0000000  000        00000000  000   000  0000000
 */

(function() {
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
                codeLine = codeLine.slice(0, start) + red(codeLine.slice(start, end)) + codeLine.slice(end);
                markLine = red(markLine);
                message = yellowBright(message);
                sep = dim(blue(':'));
                line = blue("" + err.line);
                colm = dim(blue("" + err.column));
                file = path.parse((ref3 = err.filename) != null ? ref3 : '');
                file = yellow(file.name) + dim(yellow(file.ext));
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

}).call(this);
