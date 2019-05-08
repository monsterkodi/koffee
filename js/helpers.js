// generated by koffee 0.25.0

/*
000   000  00000000  000      00000000   00000000  00000000    0000000  
000   000  000       000      000   000  000       000   000  000       
000000000  0000000   000      00000000   0000000   0000000    0000000   
000   000  000       000      000        000       000   000       000  
000   000  00000000  0000000  000        00000000  000   000  0000000
 */
var arrayEgal, buildLocationData, egal, extend, features, flatten, meta, ref, repeat, syntaxErrorToString;

features = require('./features');

meta = require('./meta');

exports.injectFeature = features.injectFeature;

exports.hasFeature = features.hasFeature;

exports.injectMeta = meta.injectMeta;

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

exports.count = function(s, substr) {
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
    if (!global.test) {
        return global.test = function(n, f) {
            console.log(n);
            return f();
        };
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBYUEsUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztBQUNYLElBQUEsR0FBVyxPQUFBLENBQVEsUUFBUjs7QUFFWCxPQUFPLENBQUMsYUFBUixHQUF3QixRQUFRLENBQUM7O0FBQ2pDLE9BQU8sQ0FBQyxVQUFSLEdBQXdCLFFBQVEsQ0FBQzs7QUFDakMsT0FBTyxDQUFDLFVBQVIsR0FBd0IsSUFBSSxDQUFDOztBQUU3QixPQUFPLENBQUMsTUFBUixHQUFpQixTQUFDLE1BQUQsRUFBUyxPQUFULEVBQWtCLEtBQWxCO1dBQ2IsT0FBQSxLQUFXLE1BQU0sQ0FBQyxNQUFQLENBQWMsS0FBZCxFQUFxQixPQUFPLENBQUMsTUFBN0I7QUFERTs7QUFLakIsT0FBTyxDQUFDLElBQVIsR0FBZSxTQUFDLE1BQUQsRUFBUyxPQUFULEVBQWtCLElBQWxCO0FBQ1gsUUFBQTtJQUFBLEdBQUEsR0FBTSxPQUFPLENBQUM7V0FDZCxPQUFBLEtBQVcsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsTUFBUCxHQUFnQixHQUFoQixHQUFzQixDQUFDLElBQUEsSUFBUSxDQUFULENBQXBDLEVBQWlELEdBQWpEO0FBRkE7O0FBTWYsT0FBTyxDQUFDLE1BQVIsR0FBaUIsTUFBQSxHQUFTLFNBQUMsR0FBRCxFQUFNLENBQU47QUFHdEIsUUFBQTtJQUFBLEdBQUEsR0FBTTtBQUNOLFdBQU0sQ0FBQSxHQUFJLENBQVY7UUFDSSxJQUFjLENBQUEsR0FBSSxDQUFsQjtZQUFBLEdBQUEsSUFBTyxJQUFQOztRQUNBLENBQUEsTUFBTztRQUNQLEdBQUEsSUFBTztJQUhYO1dBSUE7QUFSc0I7O0FBVTFCLE9BQU8sQ0FBQyxHQUFSLEdBQWMsU0FBQyxHQUFELEVBQU0sTUFBTjtBQUVWLFFBQUE7O1FBRmdCLFNBQU87O0lBRXZCLE1BQUEs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TSxDQUFDLE9BQVAsQ0FBZSxHQUFmLEVBQW9CO1FBQUEsSUFBQSxFQUFNLElBQU47S0FBcEIsQ0FDQSxDQUFDLE9BREQsQ0FDUyxZQURULEVBQ3VCLEVBRHZCO0FBRGE7O0FBSWYsT0FBTyxDQUFDLFNBQVIsR0FBb0IsU0FBQyxDQUFEO0FBQ2hCLFFBQUE7SUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7V0FDUCxJQUFJLENBQUMsU0FBTCxDQUFlLENBQWYsRUFBa0I7UUFBQSxRQUFBLEVBQVUsSUFBVjtRQUFnQixNQUFBLEVBQVEsSUFBeEI7S0FBbEI7QUFGZ0I7O0FBT3BCLE9BQU8sQ0FBQyxRQUFSLEdBQW1CLFNBQUE7SUFDZixNQUFBLENBQU8sTUFBUCxFQUFlLE9BQUEsQ0FBUSxRQUFSLENBQWY7SUFDQSxNQUFNLENBQUMsTUFBUCxHQUFnQixPQUFBLENBQVEsVUFBUjtJQUNoQixNQUFNLENBQUMsQ0FBUCxHQUFXLE9BQUEsQ0FBUSxZQUFSO0lBQ1gsTUFBQSxDQUFPLE1BQVAsRUFBZSxPQUFmO0lBQ0EsSUFBRyxDQUFJLE1BQU0sQ0FBQyxJQUFkO2VBQXdCLE1BQU0sQ0FBQyxJQUFQLEdBQWMsU0FBQyxDQUFELEVBQUcsQ0FBSDtZQUFPLE9BQUEsQ0FBRSxHQUFGLENBQU0sQ0FBTjttQkFBUyxDQUFBLENBQUE7UUFBaEIsRUFBdEM7O0FBTGUiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIFxuMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4wMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICBcbjAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4jIyNcblxuIyBGdW5jdGlvbnMgdGhhdCB3ZSdkIGxpa2UgdG8gc2hhcmUgYW1vbmcgdGhlIExleGVyLCBSZXdyaXRlciwgYW5kIE5vZGVzLiBcbiMgTWVyZ2Ugb2JqZWN0cywgZmxhdHRlbiBhcnJheXMsIGNvdW50IGNoYXJhY3RlcnMsIHRoYXQgc29ydCBvZiB0aGluZy5cblxuIyBQZWVrIGF0IHRoZSBiZWdpbm5pbmcgb2YgYSBnaXZlbiBzdHJpbmcgdG8gc2VlIGlmIGl0IG1hdGNoZXMgYSBzZXF1ZW5jZS5cblxuZmVhdHVyZXMgPSByZXF1aXJlICcuL2ZlYXR1cmVzJ1xubWV0YSAgICAgPSByZXF1aXJlICcuL21ldGEnXG5cbmV4cG9ydHMuaW5qZWN0RmVhdHVyZSA9IGZlYXR1cmVzLmluamVjdEZlYXR1cmVcbmV4cG9ydHMuaGFzRmVhdHVyZSAgICA9IGZlYXR1cmVzLmhhc0ZlYXR1cmVcbmV4cG9ydHMuaW5qZWN0TWV0YSAgICA9IG1ldGEuaW5qZWN0TWV0YVxuXG5leHBvcnRzLnN0YXJ0cyA9IChzdHJpbmcsIGxpdGVyYWwsIHN0YXJ0KSAtPlxuICAgIGxpdGVyYWwgaXMgc3RyaW5nLnN1YnN0ciBzdGFydCwgbGl0ZXJhbC5sZW5ndGhcblxuIyBQZWVrIGF0IHRoZSBlbmQgb2YgYSBnaXZlbiBzdHJpbmcgdG8gc2VlIGlmIGl0IG1hdGNoZXMgYSBzZXF1ZW5jZS5cblxuZXhwb3J0cy5lbmRzID0gKHN0cmluZywgbGl0ZXJhbCwgYmFjaykgLT5cbiAgICBsZW4gPSBsaXRlcmFsLmxlbmd0aFxuICAgIGxpdGVyYWwgaXMgc3RyaW5nLnN1YnN0ciBzdHJpbmcubGVuZ3RoIC0gbGVuIC0gKGJhY2sgb3IgMCksIGxlblxuXG4jIFJlcGVhdCBhIHN0cmluZyBgbmAgdGltZXMuXG5cbmV4cG9ydHMucmVwZWF0ID0gcmVwZWF0ID0gKHN0ciwgbikgLT5cbiAgICBcbiAgICAjIFVzZSBjbGV2ZXIgYWxnb3JpdGhtIHRvIGhhdmUgTyhsb2cobikpIHN0cmluZyBjb25jYXRlbmF0aW9uIG9wZXJhdGlvbnMuXG4gICAgcmVzID0gJydcbiAgICB3aGlsZSBuID4gMFxuICAgICAgICByZXMgKz0gc3RyIGlmIG4gJiAxXG4gICAgICAgIG4gPj4+PSAxXG4gICAgICAgIHN0ciArPSBzdHJcbiAgICByZXNcblxuZXhwb3J0cy5wYWQgPSAoc3RyLCBsZW5ndGg9MjQpIC0+ICMgc3RyIHBhZGRlZCB3aXRoIHNwYWNlcyB0byBsZW5ndGhcbiAgICBcbiAgICBzcGFjZXMgPSBsZW5ndGggLSBzdHIubGVuZ3RoXG4gICAgc3BhY2VzID0gaWYgc3BhY2VzID4gMCB0aGVuIEFycmF5KHNwYWNlcyArIDEpLmpvaW4oJyAnKSBlbHNlICcnXG4gICAgXCIje3N0cn0je3NwYWNlc31cIlxuICAgIFxuIyBUcmltIG91dCBhbGwgZmFsc3kgdmFsdWVzIGZyb20gYW4gYXJyYXkuXG5cbmV4cG9ydHMuY29tcGFjdCA9IChhcnJheSkgLT5cbiAgICBpdGVtIGZvciBpdGVtIGluIGFycmF5IHdoZW4gaXRlbVxuXG4jIENvdW50IHRoZSBudW1iZXIgb2Ygb2NjdXJyZW5jZXMgb2YgYSBzdHJpbmcgaW4gYSBzdHJpbmcuXG5cbmV4cG9ydHMuY291bnQgPSAocywgc3Vic3RyKSAtPlxuICAgIG51bSA9IHBvcyA9IDBcbiAgICByZXR1cm4gMS8wIHVubGVzcyBzdWJzdHIubGVuZ3RoXG4gICAgbnVtKysgd2hpbGUgcG9zID0gMSArIHMuaW5kZXhPZiBzdWJzdHIsIHBvc1xuICAgIG51bVxuXG4jIE1lcmdlIG9iamVjdHMsIHJldHVybmluZyBhIGZyZXNoIGNvcHkgd2l0aCBhdHRyaWJ1dGVzIGZyb20gYm90aCBzaWRlcy5cbiMgVXNlZCBldmVyeSB0aW1lIGBCYXNlI2NvbXBpbGVgIGlzIGNhbGxlZCwgdG8gYWxsb3cgcHJvcGVydGllcyBpbiB0aGVcbiMgb3B0aW9ucyBoYXNoIHRvIHByb3BhZ2F0ZSBkb3duIHRoZSB0cmVlIHdpdGhvdXQgcG9sbHV0aW5nIG90aGVyIGJyYW5jaGVzLlxuXG5leHBvcnRzLm1lcmdlID0gKG9wdGlvbnMsIG92ZXJyaWRlcykgLT5cbiAgICBleHRlbmQgKGV4dGVuZCB7fSwgb3B0aW9ucyksIG92ZXJyaWRlc1xuXG4jIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiMgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAwMDAgIFxuIyAwMDAwMDAwICAgICAwMDAwMCAgICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICBcbiMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuXG4jIEV4dGVuZCBhIHNvdXJjZSBvYmplY3Qgd2l0aCB0aGUgcHJvcGVydGllcyBvZiBhbm90aGVyIG9iamVjdCAoc2hhbGxvdyBjb3B5KS5cblxuZXhwb3J0cy5leHRlbmQgPSBleHRlbmQgPSAob2JqZWN0LCBwcm9wZXJ0aWVzKSAtPlxuICAgIGZvciBrZXksIHZhbCBvZiBwcm9wZXJ0aWVzXG4gICAgICAgIG9iamVjdFtrZXldID0gdmFsXG4gICAgb2JqZWN0XG5cbiMgUmV0dXJuIGEgZmxhdHRlbmVkIHZlcnNpb24gb2YgYW4gYXJyYXkuXG4jIEhhbmR5IGZvciBnZXR0aW5nIGEgbGlzdCBvZiBgY2hpbGRyZW5gIGZyb20gdGhlIG5vZGVzLlxuICAgIFxuZXhwb3J0cy5mbGF0dGVuID0gZmxhdHRlbiA9IChhcnJheSkgLT5cbiAgICBmbGF0dGVuZWQgPSBbXVxuICAgIGZvciBlbGVtZW50IGluIGFycmF5XG4gICAgICAgIGlmICdbb2JqZWN0IEFycmF5XScgaXMgT2JqZWN0Ojp0b1N0cmluZy5jYWxsIGVsZW1lbnRcbiAgICAgICAgICAgIGZsYXR0ZW5lZCA9IGZsYXR0ZW5lZC5jb25jYXQgZmxhdHRlbiBlbGVtZW50XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGZsYXR0ZW5lZC5wdXNoIGVsZW1lbnRcbiAgICBmbGF0dGVuZWRcblxuIyBEZWxldGUgYSBrZXkgZnJvbSBhbiBvYmplY3QsIHJldHVybmluZyB0aGUgdmFsdWUuIFVzZWZ1bCB3aGVuIGEgbm9kZSBpc1xuIyBsb29raW5nIGZvciBhIHBhcnRpY3VsYXIgbWV0aG9kIGluIGFuIG9wdGlvbnMgaGFzaC5cbiAgICBcbmV4cG9ydHMuZGVsID0gKG9iaiwga2V5KSAtPlxuICAgIHZhbCA9ICBvYmpba2V5XVxuICAgIGRlbGV0ZSBvYmpba2V5XVxuICAgIHZhbFxuXG4jIFR5cGljYWwgQXJyYXk6OnNvbWVcblxuZXhwb3J0cy5zb21lID0gQXJyYXk6OnNvbWUgPyAoZm4pIC0+XG4gICAgcmV0dXJuIHRydWUgZm9yIGUgaW4gdGhpcyB3aGVuIGZuIGVcbiAgICBmYWxzZVxuXG4jIE1lcmdlIHR3byBqaXNvbi1zdHlsZSBsb2NhdGlvbiBkYXRhIG9iamVjdHMgdG9nZXRoZXIuXG4jIElmIGBsYXN0YCBpcyBub3QgcHJvdmlkZWQsIHRoaXMgd2lsbCBzaW1wbHkgcmV0dXJuIGBmaXJzdGAuXG5cbmJ1aWxkTG9jYXRpb25EYXRhID0gKGZpcnN0LCBsYXN0KSAtPlxuICAgIGlmIG5vdCBsYXN0XG4gICAgICAgIGZpcnN0XG4gICAgZWxzZVxuICAgICAgICBmaXJzdF9saW5lOiBmaXJzdC5maXJzdF9saW5lXG4gICAgICAgIGZpcnN0X2NvbHVtbjogZmlyc3QuZmlyc3RfY29sdW1uXG4gICAgICAgIGxhc3RfbGluZTogbGFzdC5sYXN0X2xpbmVcbiAgICAgICAgbGFzdF9jb2x1bW46IGxhc3QubGFzdF9jb2x1bW5cblxuIyBUaGlzIHJldHVybnMgYSBmdW5jdGlvbiB3aGljaCB0YWtlcyBhbiBvYmplY3QgYXMgYSBwYXJhbWV0ZXIsIGFuZCBpZiB0aGF0XG4jIG9iamVjdCBpcyBhbiBBU1Qgbm9kZSwgdXBkYXRlcyB0aGF0IG9iamVjdCdzIGxvY2F0aW9uRGF0YS5cbiMgVGhlIG9iamVjdCBpcyByZXR1cm5lZCBlaXRoZXIgd2F5LlxuXG5leHBvcnRzLmFkZExvY2F0aW9uRGF0YUZuID0gKGZpcnN0LCBsYXN0KSAtPlxuICAgIChvYmopIC0+XG4gICAgICAgIGlmICgodHlwZW9mIG9iaikgaXMgJ29iamVjdCcpIGFuZCAoISFvYmpbJ3VwZGF0ZUxvY2F0aW9uRGF0YUlmTWlzc2luZyddKVxuICAgICAgICAgICAgb2JqLnVwZGF0ZUxvY2F0aW9uRGF0YUlmTWlzc2luZyBidWlsZExvY2F0aW9uRGF0YShmaXJzdCwgbGFzdClcblxuICAgICAgICByZXR1cm4gb2JqXG5cbiMgQ29udmVydCBqaXNvbiBsb2NhdGlvbiBkYXRhIHRvIGEgc3RyaW5nLlxuIyBgb2JqYCBjYW4gYmUgYSB0b2tlbiwgb3IgYSBsb2NhdGlvbkRhdGEuXG5cbmV4cG9ydHMubG9jYXRpb25EYXRhVG9TdHJpbmcgPSAob2JqKSAtPlxuICAgIGlmIChcIjJcIiBvZiBvYmopIGFuZCAoXCJmaXJzdF9saW5lXCIgb2Ygb2JqWzJdKSB0aGVuIGxvY2F0aW9uRGF0YSA9IG9ialsyXVxuICAgIGVsc2UgaWYgXCJmaXJzdF9saW5lXCIgb2Ygb2JqIHRoZW4gbG9jYXRpb25EYXRhID0gb2JqXG5cbiAgICBpZiBsb2NhdGlvbkRhdGFcbiAgICAgICAgXCIje2xvY2F0aW9uRGF0YS5maXJzdF9saW5lICsgMX06I3tsb2NhdGlvbkRhdGEuZmlyc3RfY29sdW1uICsgMX0tXCIgK1xuICAgICAgICBcIiN7bG9jYXRpb25EYXRhLmxhc3RfbGluZSArIDF9OiN7bG9jYXRpb25EYXRhLmxhc3RfY29sdW1uICsgMX1cIlxuICAgIGVsc2VcbiAgICAgICAgXCJObyBsb2NhdGlvbiBkYXRhXCJcblxuIyBBIGAuY29mZmVlLm1kYCBjb21wYXRpYmxlIHZlcnNpb24gb2YgYGJhc2VuYW1lYCwgdGhhdCByZXR1cm5zIHRoZSBmaWxlIHNhbnMtZXh0ZW5zaW9uLlxuXG5leHBvcnRzLmJhc2VGaWxlTmFtZSA9IChmaWxlLCBzdHJpcEV4dCA9IG5vLCB1c2VXaW5QYXRoU2VwID0gbm8pIC0+XG4gICAgcGF0aFNlcCA9IGlmIHVzZVdpblBhdGhTZXAgdGhlbiAvXFxcXHxcXC8vIGVsc2UgL1xcLy9cbiAgICBwYXJ0cyA9IGZpbGUuc3BsaXQocGF0aFNlcClcbiAgICBmaWxlID0gcGFydHNbcGFydHMubGVuZ3RoIC0gMV1cbiAgICByZXR1cm4gZmlsZSB1bmxlc3Mgc3RyaXBFeHQgYW5kIGZpbGUuaW5kZXhPZignLicpID49IDBcbiAgICBwYXJ0cyA9IGZpbGUuc3BsaXQoJy4nKVxuICAgIHBhcnRzLnBvcCgpXG4gICAgcGFydHMucG9wKCkgaWYgL15bY2tdb2ZmZWUkLy50ZXN0KHBhcnRzW3BhcnRzLmxlbmd0aC0xXSkgYW5kIHBhcnRzLmxlbmd0aCA+IDFcbiAgICBwYXJ0cy5qb2luKCcuJylcblxuIyAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgXG4jIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICBcbiMgMDAwICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwICAgIDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgXG4jIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwMDAwMDAgIDAwMDAwMDAwICBcblxuIyBEZXRlcm1pbmUgaWYgYSBmaWxlbmFtZSByZXByZXNlbnRzIGEga29mZmVlIGZpbGUuXG5cbmV4cG9ydHMuaXNDb2ZmZWUgPSAoZmlsZSkgLT4gL1xcLltja11vZmZlZSQvLnRlc3QgZmlsZVxuXG4jIFRocm93cyBhIFN5bnRheEVycm9yIGZyb20gYSBnaXZlbiBsb2NhdGlvbi5cbiMgVGhlIGVycm9yJ3MgYHRvU3RyaW5nYCB3aWxsIHJldHVybiBhbiBlcnJvciBtZXNzYWdlIGZvbGxvd2luZyB0aGUgXCJzdGFuZGFyZFwiXG4jIGZvcm1hdCBgPGZpbGVuYW1lPjo8bGluZT46PGNvbD46IDxtZXNzYWdlPmAgcGx1cyB0aGUgbGluZSB3aXRoIHRoZSBlcnJvciBhbmQgYVxuIyBtYXJrZXIgc2hvd2luZyB3aGVyZSB0aGUgZXJyb3IgaXMuXG5cbmV4cG9ydHMudGhyb3dTeW50YXhFcnJvciA9IChtZXNzYWdlLCBsb2NhdGlvbikgLT5cbiAgICBlcnJvciA9IG5ldyBTeW50YXhFcnJvciBtZXNzYWdlXG4gICAgZXJyb3IubG9jYXRpb24gPSBsb2NhdGlvblxuICAgIGVycm9yLnRvU3RyaW5nID0gc3ludGF4RXJyb3JUb1N0cmluZ1xuXG4gICAgIyBJbnN0ZWFkIG9mIHNob3dpbmcgdGhlIGNvbXBpbGVyJ3Mgc3RhY2t0cmFjZSwgc2hvdyBvdXIgY3VzdG9tIGVycm9yIG1lc3NhZ2UuXG4gICAgIyBUaGlzIGlzIHVzZWZ1bCB3aGVuIHRoZSBlcnJvciBidWJibGVzIHVwIGluIE5vZGUuanMgYXBwbGljYXRpb25zIHRoYXQgY29tcGlsZSBLb2ZmZWUuXG4gICAgZXJyb3Iuc3RhY2sgPSBlcnJvci50b1N0cmluZygpXG5cbiAgICB0aHJvdyBlcnJvclxuXG4jIFVwZGF0ZSBhIGNvbXBpbGVyIFN5bnRheEVycm9yIHdpdGggc291cmNlIGNvZGUgaW5mb3JtYXRpb24gaWYgaXQgZGlkbid0IGhhdmUgaXQgYWxyZWFkeS5cblxuZXhwb3J0cy51cGRhdGVTeW50YXhFcnJvciA9IChlcnJvciwgY29kZSwgZmlsZW5hbWUpIC0+XG4gICAgIyBBdm9pZCBzY3Jld2luZyB1cCB0aGUgYHN0YWNrYCBwcm9wZXJ0eSBvZiBvdGhlciBlcnJvcnMgKGkuZS4gcG9zc2libGUgYnVncykuXG4gICAgaWYgZXJyb3IudG9TdHJpbmcgaXMgc3ludGF4RXJyb3JUb1N0cmluZ1xuICAgICAgICBlcnJvci5jb2RlIG9yPSBjb2RlXG4gICAgICAgIGVycm9yLmZpbGVuYW1lIG9yPSBmaWxlbmFtZVxuICAgICAgICBlcnJvci5zdGFjayA9IGVycm9yLnRvU3RyaW5nKClcbiAgICBlcnJvclxuXG5zeW50YXhFcnJvclRvU3RyaW5nID0gLT5cbiAgICBcbiAgICByZXR1cm4gRXJyb3I6OnRvU3RyaW5nLmNhbGwgQCB1bmxlc3MgQGNvZGUgYW5kIEBsb2NhdGlvblxuXG4gICAge2ZpcnN0X2xpbmUsIGZpcnN0X2NvbHVtbiwgbGFzdF9saW5lLCBsYXN0X2NvbHVtbn0gPSBAbG9jYXRpb25cbiAgICBsYXN0X2xpbmUgPz0gZmlyc3RfbGluZVxuICAgIGxhc3RfY29sdW1uID89IGZpcnN0X2NvbHVtblxuXG4gICAgZmlsZW5hbWUgPSBAZmlsZW5hbWUgb3IgJ1tzdGRpbl0nXG4gICAgY29kZUxpbmUgPSBAY29kZS5zcGxpdCgnXFxuJylbZmlyc3RfbGluZV1cbiAgICBzdGFydCAgICA9IGZpcnN0X2NvbHVtblxuICAgICMgU2hvdyBvbmx5IHRoZSBmaXJzdCBsaW5lIG9uIG11bHRpLWxpbmUgZXJyb3JzLlxuICAgIGVuZCAgICAgID0gaWYgZmlyc3RfbGluZSBpcyBsYXN0X2xpbmUgdGhlbiBsYXN0X2NvbHVtbiArIDEgZWxzZSBjb2RlTGluZS5sZW5ndGhcbiAgICBtYXJrZXIgICA9IGNvZGVMaW5lWy4uLnN0YXJ0XS5yZXBsYWNlKC9bXlxcc10vZywgJyAnKSArIHJlcGVhdCgnXicsIGVuZCAtIHN0YXJ0KVxuXG4gICAgIyBDaGVjayB0byBzZWUgaWYgd2UncmUgcnVubmluZyBvbiBhIGNvbG9yLWVuYWJsZWQgVFRZLlxuICAgIGlmIHByb2Nlc3M/XG4gICAgICAgIGNvbG9yc0VuYWJsZWQgPSBwcm9jZXNzLnN0ZG91dD8uaXNUVFkgYW5kIG5vdCBwcm9jZXNzLmVudj8uTk9ERV9ESVNBQkxFX0NPTE9SU1xuXG4gICAgaWYgQGNvbG9yZnVsID8gY29sb3JzRW5hYmxlZFxuICAgICAgICBjb2xvcml6ZSA9IChzdHIpIC0+IFwiXFx4MUJbMTszMW0je3N0cn1cXHgxQlswbVwiXG4gICAgICAgIGNvZGVMaW5lID0gY29kZUxpbmVbLi4uc3RhcnRdICsgY29sb3JpemUoY29kZUxpbmVbc3RhcnQuLi5lbmRdKSArIGNvZGVMaW5lW2VuZC4uXVxuICAgICAgICBtYXJrZXIgICA9IGNvbG9yaXplIG1hcmtlclxuXG4gICAgXCJcIlwiXG4gICAgICAgICN7ZmlsZW5hbWV9OiN7Zmlyc3RfbGluZSArIDF9OiN7Zmlyc3RfY29sdW1uICsgMX06IGVycm9yOiAje0BtZXNzYWdlfVxuICAgICAgICAje2NvZGVMaW5lfVxuICAgICAgICAje21hcmtlcn1cbiAgICBcIlwiXCJcblxuZXhwb3J0cy5uYW1lV2hpdGVzcGFjZUNoYXJhY3RlciA9IChzdHJpbmcpIC0+XG4gICAgXG4gICAgc3dpdGNoIHN0cmluZ1xuICAgICAgICB3aGVuICcgJyB0aGVuICdzcGFjZSdcbiAgICAgICAgd2hlbiAnXFxuJyB0aGVuICduZXdsaW5lJ1xuICAgICAgICB3aGVuICdcXHInIHRoZW4gJ2NhcnJpYWdlIHJldHVybidcbiAgICAgICAgd2hlbiAnXFx0JyB0aGVuICd0YWInXG4gICAgICAgIGVsc2Ugc3RyaW5nXG5cbiMgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4jICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuIyAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICBcbiMgICAgMDAwICAgICAwMDAgICAgICAgICAgICAwMDAgICAgIDAwMCAgICAgXG4jICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuXG5lZ2FsID0gKGEsIGIpIC0+XG4gIGlmIGEgaXMgYlxuICAgIGEgIT0gMCBvciAxL2EgaXMgMS9iXG4gIGVsc2VcbiAgICBhICE9IGEgYW5kIGIgIT0gYlxuICAgIFxuIyBBIHJlY3Vyc2l2ZSBmdW5jdGlvbmFsIGVxdWl2YWxlbmNlIGhlbHBlcjsgdXNlcyBlZ2FsIGZvciB0ZXN0aW5nIGVxdWl2YWxlbmNlLlxuICAgIFxuYXJyYXlFZ2FsID0gKGEsIGIpIC0+XG4gIGlmIGVnYWwgYSwgYiB0aGVuIHllc1xuICBlbHNlIGlmIGEgaW5zdGFuY2VvZiBBcnJheSBhbmQgYiBpbnN0YW5jZW9mIEFycmF5XG4gICAgcmV0dXJuIG5vIHVubGVzcyBhLmxlbmd0aCBpcyBiLmxlbmd0aFxuICAgIHJldHVybiBubyBmb3IgZWwsIGlkeCBpbiBhIHdoZW4gbm90IGFycmF5RWdhbCBlbCwgYltpZHhdXG4gICAgeWVzXG5cbmV4cG9ydHMuZXEgICAgICA9IChhLCBiLCBtc2cpIC0+IG9rIGVnYWwoYSwgYiksIG1zZyBvciBcIlxceDFCWzA7OTBtXFxuIDw8PCBleHBlY3RlZCA+Pj5cXG5cXHgxQlswOzkzbSN7YX1cXHgxQlswOzkwbTw8PCB0byBlcXVhbCA+Pj5cXG5cXHgxQlswOzkzbSN7Yn1cXHgxQlswOzkwbTw8PCBleHBlY3RlZCA+Pj5cXG5cIlxuZXhwb3J0cy5hcnJheUVxID0gKGEsIGIsIG1zZykgLT4gb2sgYXJyYXlFZ2FsKGEsYiksIG1zZyBvciBcIlxceDFCWzA7OTBtXFxuID4+PlxcblxceDFCWzA7OTNtI3thfVxceDFCWzA7OTBtPDw8IHRvIGRlZXAgZXF1YWwgPj4+XFxuXFx4MUJbMDs5M20je2J9XFx4MUJbMDs5MG08PDwgZXhwZWN0ZWQgPj4+XFxuXCJcblxuZXhwb3J0cy50b0pTID0gKHN0cikgLT5cbiAgS29mZmVlLmNvbXBpbGUgc3RyLCBiYXJlOiB5ZXNcbiAgLnJlcGxhY2UgL15cXHMrfFxccyskL2csICcnICMgVHJpbSBsZWFkaW5nL3RyYWlsaW5nIHdoaXRlc3BhY2VcblxuZXhwb3J0cy5zdHJpbmdpZnkgPSAobykgLT5cbiAgICBub29uID0gcmVxdWlyZSAnbm9vbidcbiAgICBub29uLnN0cmluZ2lmeSBvLCBjaXJjdWxhcjogdHJ1ZSwgY29sb3JzOiB0cnVlXG4gICAgXG4jIEluaXRpYWxpemUgZ2xvYmFsIHZhcmlhYmxlcyB1c2VkIGluIHRlc3Qgc2NyaXB0cyBcbiMgU3VwcG9ydHMgcnVubmluZyBzaW5nbGUgdGVzdCB2aWEgYGtvZmZlZSB0ZXN0Ly4uYFxuICAgIFxuZXhwb3J0cy5pbml0VGVzdCA9IC0+XG4gICAgZXh0ZW5kIGdsb2JhbCwgcmVxdWlyZSAnYXNzZXJ0JyBcbiAgICBnbG9iYWwuS29mZmVlID0gcmVxdWlyZSAnLi9rb2ZmZWUnXG4gICAgZ2xvYmFsLl8gPSByZXF1aXJlICd1bmRlcnNjb3JlJ1xuICAgIGV4dGVuZCBnbG9iYWwsIGV4cG9ydHNcbiAgICBpZiBub3QgZ2xvYmFsLnRlc3QgdGhlbiBnbG9iYWwudGVzdCA9IChuLGYpIC0+IGxvZyBuOyBmKClcbiAgICAiXX0=
//# sourceURL=../coffee/helpers.coffee