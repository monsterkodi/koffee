// generated by koffee 0.7.0

/*
000   000  00000000  000      00000000   00000000  00000000    0000000  
000   000  000       000      000   000  000       000   000  000       
000000000  0000000   000      00000000   0000000   0000000    0000000   
000   000  000       000      000        000       000   000       000  
000   000  00000000  0000000  000        00000000  000   000  0000000
 */

(function() {
    var arrayEgal, buildLocationData, egal, extend, features, flatten, ref, repeat, syntaxErrorToString;

    features = require('./features');

    exports.injectFeature = features.injectFeature;

    exports.starts = function(string, literal, start) {
        return literal === string.substr(start, literal.length);
    };

    exports.ends = function(string, literal, back) {
        var len;
        len = literal.length;
        return literal === string.substr(string.length - len - (back || 0), len);
    };

    exports.repeat = repeat = function(str, n) {
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

    exports.pad = function(str, length) {
        var spaces;
        if (length == null) {
            length = 24;
        }
        spaces = length - str.length;
        spaces = spaces > 0 ? Array(spaces + 1).join(' ') : '';
        return "" + str + spaces;
    };

    exports.compact = function(array) {
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

    exports.count = function(string, substr) {
        var num, pos;
        num = pos = 0;
        if (!substr.length) {
            return 1 / 0;
        }
        while (pos = 1 + string.indexOf(substr, pos)) {
            num++;
        }
        return num;
    };

    exports.merge = function(options, overrides) {
        return extend(extend({}, options), overrides);
    };

    exports.extend = extend = function(object, properties) {
        var key, val;
        for (key in properties) {
            val = properties[key];
            object[key] = val;
        }
        return object;
    };

    exports.flatten = flatten = function(array) {
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

    exports.del = function(obj, key) {
        var val;
        val = obj[key];
        delete obj[key];
        return val;
    };

    exports.some = (ref = Array.prototype.some) != null ? ref : function(fn) {
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

    exports.addLocationDataFn = function(first, last) {
        return function(obj) {
            if (((typeof obj) === 'object') && (!!obj['updateLocationDataIfMissing'])) {
                obj.updateLocationDataIfMissing(buildLocationData(first, last));
            }
            return obj;
        };
    };

    exports.locationDataToString = function(obj) {
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

    exports.baseFileName = function(file, stripExt, useWinPathSep) {
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

    exports.isCoffee = function(file) {
        return /\.[ck]offee$/.test(file);
    };

    exports.throwSyntaxError = function(message, location) {
        var error;
        error = new SyntaxError(message);
        error.location = location;
        error.toString = syntaxErrorToString;
        error.stack = error.toString();
        throw error;
    };

    exports.updateSyntaxError = function(error, code, filename) {
        if (error.toString === syntaxErrorToString) {
            error.code || (error.code = code);
            error.filename || (error.filename = filename);
            error.stack = error.toString();
        }
        return error;
    };

    syntaxErrorToString = function() {
        var codeLine, colorize, colorsEnabled, end, filename, first_column, first_line, last_column, last_line, marker, ref1, ref2, ref3, ref4, start;
        if (!(this.code && this.location)) {
            return Error.prototype.toString.call(this);
        }
        ref1 = this.location, first_line = ref1.first_line, first_column = ref1.first_column, last_line = ref1.last_line, last_column = ref1.last_column;
        if (last_line == null) {
            last_line = first_line;
        }
        if (last_column == null) {
            last_column = first_column;
        }
        filename = this.filename || '[stdin]';
        codeLine = this.code.split('\n')[first_line];
        start = first_column;
        end = first_line === last_line ? last_column + 1 : codeLine.length;
        marker = codeLine.slice(0, start).replace(/[^\s]/g, ' ') + repeat('^', end - start);
        if (typeof process !== "undefined" && process !== null) {
            colorsEnabled = ((ref2 = process.stdout) != null ? ref2.isTTY : void 0) && !((ref3 = process.env) != null ? ref3.NODE_DISABLE_COLORS : void 0);
        }
        if ((ref4 = this.colorful) != null ? ref4 : colorsEnabled) {
            colorize = function(str) {
                return "\x1B[1;31m" + str + "\x1B[0m";
            };
            codeLine = codeLine.slice(0, start) + colorize(codeLine.slice(start, end)) + codeLine.slice(end);
            marker = colorize(marker);
        }
        return filename + ":" + (first_line + 1) + ":" + (first_column + 1) + ": error: " + this.message + "\n" + codeLine + "\n" + marker;
    };

    exports.nameWhitespaceCharacter = function(string) {
        switch (string) {
            case ' ':
                return 'space';
            case '\n':
                return 'newline';
            case '\r':
                return 'carriage return';
            case '\t':
                return 'tab';
            default:
                return string;
        }
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

    exports.eq = function(a, b, msg) {
        return ok(egal(a, b), msg || ("\x1B[0;90m\n <<< expected >>>\n\x1B[0;93m" + a + "\x1B[0;90m<<< to equal >>>\n\x1B[0;93m" + b + "\x1B[0;90m<<< expected >>>\n"));
    };

    exports.arrayEq = function(a, b, msg) {
        return ok(arrayEgal(a, b), msg || ("\x1B[0;90m\n >>>\n\x1B[0;93m" + a + "\x1B[0;90m<<< to deep equal >>>\n\x1B[0;93m" + b + "\x1B[0;90m<<< expected >>>\n"));
    };

    exports.toJS = function(str) {
        return Koffee.compile(str, {
            bare: true
        }).replace(/^\s+|\s+$/g, '');
    };

    exports.stringify = function(o) {
        var noon;
        noon = require('noon');
        return noon.stringify(o, {
            circular: true,
            colors: true
        });
    };

    exports.initTest = function() {
        extend(global, require('assert'));
        global.Koffee = require('./koffee');
        global._ = require('underscore');
        extend(global, exports);
        if (!global.log) {
            global.log = console.log;
        }
        if (!global.test) {
            return global.test = function(n, f) {
                log(n);
                return f();
            };
        }
    };

}).call(this);
