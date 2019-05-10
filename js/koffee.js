// koffee 0.29.0

/*
000   000   0000000   00000000  00000000  00000000  00000000  
000  000   000   000  000       000       000       000       
0000000    000   000  000000    000000    0000000   0000000   
000  000   000   000  000       000       000       000       
000   000   0000000   000       000       00000000  00000000
 */
var FILE_EXTENSIONS, Lexer, SourceMap, base64encode, compile, count, formatSourcePosition, fs, getSourceMap, hasFeature, helpers, injectFeature, injectMeta, isCoffee, lexer, nameWhitespaceCharacter, parser, path, pkg, sourceMaps, sources, stringify, throwSyntaxError, updateSyntaxError, vm, withPrettyErrors,
    hasProp = {}.hasOwnProperty;

fs = require('fs');

vm = require('vm');

path = require('path');

Lexer = require('./lexer').Lexer;

parser = require('./parser').parser;

helpers = require('./helpers');

SourceMap = require('./sourcemap');

pkg = require('../package.json');

exports.VERSION = pkg.version;

exports.FILE_EXTENSIONS = FILE_EXTENSIONS = ['.coffee', '.koffee'];

exports.helpers = helpers;

injectFeature = helpers.injectFeature, injectMeta = helpers.injectMeta, updateSyntaxError = helpers.updateSyntaxError, nameWhitespaceCharacter = helpers.nameWhitespaceCharacter, throwSyntaxError = helpers.throwSyntaxError, isCoffee = helpers.isCoffee, count = helpers.count, hasFeature = helpers.hasFeature, stringify = helpers.stringify;

base64encode = function(src) {
    if (typeof Buffer === 'function') {
        return Buffer.from(src).toString('base64');
    } else if (typeof btoa === 'function') {
        return btoa(encodeURIComponent(src).replace(/%([0-9A-F]{2})/g, function(match, p1) {
            return String.fromCharCode('0x' + p1);
        }));
    } else {
        throw new Error('Unable to base64 encode inline sourcemap.');
    }
};

withPrettyErrors = function(fn) {
    return function(code, options) {
        var err;
        if (options == null) {
            options = {};
        }
        try {
            return fn.call(this, code, options);
        } catch (error) {
            err = error;
            if (typeof code !== 'string') {
                throw new Error(err.toString());
            } else {
                throw updateSyntaxError(err, code, options.filename);
            }
        }
    };
};

sources = {};

sourceMaps = {};

exports.compile = compile = withPrettyErrors(function(code, options) {
    var currentColumn, currentLine, encoded, extend, filename, fragment, fragments, generateSourceMap, header, i, j, js, len, len1, map, merge, newLines, ref, ref1, sourceMapDataURI, sourceURL, token, tokens, v3SourceMap;
    merge = helpers.merge, extend = helpers.extend;
    options = injectFeature(options);
    options = injectMeta(options);
    generateSourceMap = options.sourceMap || options.inlineMap || (options.filename == null);
    filename = options.filename || '<anonymous>';
    sources[filename] = code;
    if (generateSourceMap) {
        map = new SourceMap;
    }
    tokens = lexer.tokenize(code, options);
    options.referencedVars = (function() {
        var i, len, results;
        results = [];
        for (i = 0, len = tokens.length; i < len; i++) {
            token = tokens[i];
            if (token[0] === 'IDENTIFIER') {
                results.push(token[1]);
            }
        }
        return results;
    })();
    if (!options.bare) {
        for (i = 0, len = tokens.length; i < len; i++) {
            token = tokens[i];
            if ((ref = token[0]) === 'IMPORT' || ref === 'EXPORT') {
                options.bare = true;
                break;
            }
        }
    }
    fragments = parser.parse(tokens).compileToFragments(options);
    currentLine = 0;
    if (hasFeature(options, 'header')) {
        currentLine += 1;
    }
    currentColumn = 0;
    js = "";
    for (j = 0, len1 = fragments.length; j < len1; j++) {
        fragment = fragments[j];
        if (generateSourceMap) {
            if (fragment.locationData && !/^[;\s]*$/.test(fragment.code)) {
                map.add([fragment.locationData.first_line, fragment.locationData.first_column], [currentLine, currentColumn], {
                    noReplace: true
                });
            }
            if (fragment.code == null) {
                console.log('generateSourceMap', stringify(fragment));
            }
            newLines = count(fragment.code, "\n");
            currentLine += newLines;
            if (newLines) {
                currentColumn = fragment.code.length - (fragment.code.lastIndexOf("\n") + 1);
            } else {
                currentColumn += fragment.code.length;
            }
        }
        js += fragment.code;
    }
    if (hasFeature(options, 'header')) {
        header = "koffee " + this.VERSION;
        js = "// " + header + "\n" + js;
    }
    if (generateSourceMap) {
        v3SourceMap = map.generate(options, code);
        sourceMaps[filename] = map;
    }
    if (options.inlineMap) {
        encoded = base64encode(JSON.stringify(v3SourceMap));
        sourceMapDataURI = "//# sourceMappingURL=data:application/json;base64," + encoded;
        sourceURL = "//# sourceURL=" + ((ref1 = options.filename) != null ? ref1 : 'koffee');
        js = js + "\n" + sourceMapDataURI + "\n" + sourceURL;
    }
    if (options.sourceMap) {
        return {
            js: js,
            sourceMap: map,
            v3SourceMap: JSON.stringify(v3SourceMap, null, 2)
        };
    } else {
        return js;
    }
});

exports.tokens = withPrettyErrors(function(code, options) {
    return lexer.tokenize(code, options);
});

exports.nodes = withPrettyErrors(function(source, options) {
    if (typeof source === 'string') {
        return parser.parse(lexer.tokenize(source, options));
    } else {
        return parser.parse(source);
    }
});

exports.run = function(code, options) {
    var answer, dir, mainModule, ref;
    if (options == null) {
        options = {};
    }
    options = injectFeature(options);
    options = injectMeta(options);
    mainModule = require.main;
    mainModule.filename = process.argv[1] = options.filename ? fs.realpathSync(options.filename) : '<anonymous>';
    mainModule.moduleCache && (mainModule.moduleCache = {});
    dir = options.filename != null ? path.dirname(fs.realpathSync(options.filename)) : fs.realpathSync('.');
    mainModule.paths = require('module')._nodeModulePaths(dir);
    if (!isCoffee(mainModule.filename) || require.extensions) {
        answer = compile(code, options);
        code = (ref = answer.js) != null ? ref : answer;
    }
    return mainModule._compile(code, mainModule.filename);
};

exports["eval"] = function(code, options) {
    var Module, _module, _require, createContext, i, isContext, js, k, len, o, r, ref, ref1, ref2, sandbox, v;
    if (options == null) {
        options = {};
    }
    if (!(code = code.trim())) {
        return;
    }
    createContext = vm.createContext;
    isContext = (ref = vm.isContext) != null ? ref : function(ctx) {
        return options.sandbox instanceof createContext().constructor;
    };
    if (createContext) {
        if (options.sandbox != null) {
            if (isContext(options.sandbox)) {
                sandbox = options.sandbox;
            } else {
                sandbox = createContext();
                ref1 = options.sandbox;
                for (k in ref1) {
                    if (!hasProp.call(ref1, k)) continue;
                    v = ref1[k];
                    sandbox[k] = v;
                }
            }
            sandbox.global = sandbox.root = sandbox.GLOBAL = sandbox;
        } else {
            sandbox = global;
        }
        sandbox.__filename = options.filename || 'eval';
        sandbox.__dirname = path.dirname(sandbox.__filename);
        if (!(sandbox !== global || sandbox.module || sandbox.require)) {
            Module = require('module');
            sandbox.module = _module = new Module(options.modulename || 'eval');
            sandbox.require = _require = function(path) {
                return Module._load(path, _module, true);
            };
            _module.filename = sandbox.__filename;
            ref2 = Object.getOwnPropertyNames(require);
            for (i = 0, len = ref2.length; i < len; i++) {
                r = ref2[i];
                if (r !== 'paths' && r !== 'arguments' && r !== 'caller') {
                    _require[r] = require[r];
                }
            }
            _require.paths = _module.paths = Module._nodeModulePaths(process.cwd());
            _require.resolve = function(request) {
                return Module._resolveFilename(request, _module);
            };
        }
    }
    o = {};
    for (k in options) {
        if (!hasProp.call(options, k)) continue;
        v = options[k];
        o[k] = v;
    }
    o.bare = true;
    js = compile(code, o);
    if (sandbox === global) {
        return vm.runInThisContext(js);
    } else {
        return vm.runInContext(js, sandbox);
    }
};

exports.register = function() {
    return require('./register');
};

exports._compileFile = function(filename, sourceMap, inlineMap) {
    var answer, err, raw, stripped;
    if (sourceMap == null) {
        sourceMap = false;
    }
    if (inlineMap == null) {
        inlineMap = false;
    }
    raw = fs.readFileSync(filename, 'utf8');
    stripped = raw.charCodeAt(0) === 0xFEFF ? raw.substring(1) : raw;
    try {
        answer = compile(stripped, {
            filename: filename,
            sourceMap: sourceMap,
            inlineMap: inlineMap,
            sourceFiles: [filename]
        });
    } catch (error) {
        err = error;
        throw updateSyntaxError(err, stripped, filename);
    }
    return answer;
};

lexer = new Lexer;

parser.lexer = {
    lex: function() {
        var ref, tag, token;
        token = parser.tokens[this.pos++];
        if (token) {
            tag = token[0], this.yytext = token[1], this.yylloc = token[2];
            parser.errorToken = token.origin || token;
            if (((ref = this.yylloc) != null ? ref.first_line : void 0) == null) {
                console.error('DAFUK', token);
            }
            this.yylineno = this.yylloc.first_line;
        } else {
            tag = '';
        }
        return tag;
    },
    setInput: function(tokens) {
        parser.tokens = tokens;
        return this.pos = 0;
    },
    upcomingInput: function() {
        return "";
    }
};

parser.yy = require('./nodes');

parser.yy.parseError = function(message, arg) {
    var errorLoc, errorTag, errorText, errorToken, token, tokens;
    token = arg.token;
    errorToken = parser.errorToken, tokens = parser.tokens;
    errorTag = errorToken[0], errorText = errorToken[1], errorLoc = errorToken[2];
    errorText = (function() {
        switch (false) {
            case errorToken !== tokens[tokens.length - 1]:
                return 'end of input';
            case errorTag !== 'INDENT' && errorTag !== 'OUTDENT':
                return 'indentation';
            case errorTag !== 'IDENTIFIER' && errorTag !== 'NUMBER' && errorTag !== 'INFINITY' && errorTag !== 'STRING' && errorTag !== 'STRING_START' && errorTag !== 'REGEX' && errorTag !== 'REGEX_START':
                return errorTag.replace(/_START$/, '').toLowerCase();
            default:
                return nameWhitespaceCharacter(errorText);
        }
    })();
    return throwSyntaxError("unexpected " + errorText, errorLoc);
};

getSourceMap = function(filename) {
    var answer;
    if (sourceMaps[filename] != null) {
        return sourceMaps[filename];
    } else if (sourceMaps['<anonymous>'] != null) {
        return sourceMaps['<anonymous>'];
    } else if (sources[filename] != null) {
        answer = compile(sources[filename], {
            filename: filename,
            sourceMap: true
        });
        return answer.sourceMap;
    } else {
        return null;
    }
};

Error.prepareStackTrace = function(err, stack) {
    var frame, frames, getSourceMapping;
    getSourceMapping = function(filename, line, column) {
        var answer, sourceMap;
        sourceMap = getSourceMap(filename);
        if (sourceMap != null) {
            answer = sourceMap.sourceLocation([line - 1, column - 1]);
        }
        if (answer != null) {
            return [answer[0] + 1, answer[1] + 1];
        } else {
            return null;
        }
    };
    frames = (function() {
        var i, len, results;
        results = [];
        for (i = 0, len = stack.length; i < len; i++) {
            frame = stack[i];
            if (frame.getFunction() === exports.run) {
                break;
            }
            results.push("        at " + (formatSourcePosition(frame, getSourceMapping)));
        }
        return results;
    })();
    return (err.toString()) + "\n" + (frames.join('\n')) + "\n";
};

formatSourcePosition = function(frame, getSourceMapping) {
    var as, column, fileLocation, filename, functionName, isConstructor, isMethodCall, line, methodName, source, tp, typeName;
    filename = void 0;
    fileLocation = '';
    if (frame.isNative()) {
        fileLocation = "native";
    } else {
        if (frame.isEval()) {
            filename = frame.getScriptNameOrSourceURL();
            if (!filename) {
                fileLocation = (frame.getEvalOrigin()) + ", ";
            }
        } else {
            filename = frame.getFileName();
        }
        filename || (filename = "<anonymous>");
        line = frame.getLineNumber();
        column = frame.getColumnNumber();
        source = getSourceMapping(filename, line, column);
        fileLocation = source ? filename + ":" + source[0] + ":" + source[1] : filename + ":" + line + ":" + column;
    }
    functionName = frame.getFunctionName();
    isConstructor = frame.isConstructor();
    isMethodCall = !(frame.isToplevel() || isConstructor);
    if (isMethodCall) {
        methodName = frame.getMethodName();
        typeName = frame.getTypeName();
        if (functionName) {
            tp = as = '';
            if (typeName && functionName.indexOf(typeName)) {
                tp = typeName + ".";
            }
            if (methodName && functionName.indexOf("." + methodName) !== functionName.length - methodName.length - 1) {
                as = " [as " + methodName + "]";
            }
            return "" + tp + functionName + as + " (" + fileLocation + ")";
        } else {
            return typeName + "." + (methodName || '<anonymous>') + " (" + fileLocation + ")";
        }
    } else if (isConstructor) {
        return "new " + (functionName || '<anonymous>') + " (" + fileLocation + ")";
    } else if (functionName) {
        return functionName + " (" + fileLocation + ")";
    } else {
        return fileLocation;
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia29mZmVlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSwrU0FBQTtJQUFBOztBQVVBLEVBQUEsR0FBWSxPQUFBLENBQVEsSUFBUjs7QUFDWixFQUFBLEdBQVksT0FBQSxDQUFRLElBQVI7O0FBQ1osSUFBQSxHQUFZLE9BQUEsQ0FBUSxNQUFSOztBQUNYLFFBQVcsT0FBQSxDQUFRLFNBQVI7O0FBQ1gsU0FBVyxPQUFBLENBQVEsVUFBUjs7QUFDWixPQUFBLEdBQVksT0FBQSxDQUFRLFdBQVI7O0FBQ1osU0FBQSxHQUFZLE9BQUEsQ0FBUSxhQUFSOztBQUNaLEdBQUEsR0FBWSxPQUFBLENBQVEsaUJBQVI7O0FBRVosT0FBTyxDQUFDLE9BQVIsR0FBa0IsR0FBRyxDQUFDOztBQUN0QixPQUFPLENBQUMsZUFBUixHQUEwQixlQUFBLEdBQWtCLENBQUMsU0FBRCxFQUFXLFNBQVg7O0FBRTVDLE9BQU8sQ0FBQyxPQUFSLEdBQWtCOztBQUVoQixxQ0FBRixFQUFpQiwrQkFBakIsRUFBNkIsNkNBQTdCLEVBQWdELHlEQUFoRCxFQUF5RSwyQ0FBekUsRUFBMkYsMkJBQTNGLEVBQXFHLHFCQUFyRyxFQUE0RywrQkFBNUcsRUFBd0g7O0FBRXhILFlBQUEsR0FBZSxTQUFDLEdBQUQ7SUFFWCxJQUFHLE9BQU8sTUFBUCxLQUFpQixVQUFwQjtlQUNJLE1BQU0sQ0FBQyxJQUFQLENBQVksR0FBWixDQUFnQixDQUFDLFFBQWpCLENBQTBCLFFBQTFCLEVBREo7S0FBQSxNQUVLLElBQUcsT0FBTyxJQUFQLEtBQWUsVUFBbEI7ZUFLRCxJQUFBLENBQUssa0JBQUEsQ0FBbUIsR0FBbkIsQ0FBdUIsQ0FBQyxPQUF4QixDQUFnQyxpQkFBaEMsRUFBbUQsU0FBQyxLQUFELEVBQVEsRUFBUjttQkFDcEQsTUFBTSxDQUFDLFlBQVAsQ0FBb0IsSUFBQSxHQUFPLEVBQTNCO1FBRG9ELENBQW5ELENB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QUEsR0FBRyxFQUFILEdBQVEsWUFBUixHQUF1QixFQUF2QixHQUEwQixJQUExQixHQUE4QixZQUE5QixHQUEyQyxJQVAvQztTQUFBLE1BQUE7bUJBU08sUUFBRCxHQUFVLEdBQVYsR0FBWSxDQUFDLFVBQUEsSUFBYyxhQUFmLENBQVosR0FBeUMsSUFBekMsR0FBNkMsWUFBN0MsR0FBMEQsSUFUaEU7U0FKSjtLQUFBLE1BY0ssSUFBRyxhQUFIO2VBQ0QsTUFBQSxHQUFNLENBQUMsWUFBQSxJQUFnQixhQUFqQixDQUFOLEdBQXFDLElBQXJDLEdBQXlDLFlBQXpDLEdBQXNELElBRHJEO0tBQUEsTUFFQSxJQUFHLFlBQUg7ZUFDRSxZQUFELEdBQWMsSUFBZCxHQUFrQixZQUFsQixHQUErQixJQURoQztLQUFBLE1BQUE7ZUFHRCxhQUhDOztBQS9DYyIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICBcbjAwMCAgMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgXG4wMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwICAgIDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuMDAwICAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICBcbjAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMDAwMDAwICAwMDAwMDAwMCAgXG4jIyNcblxuIyBUaGlzIG1vZHVsZSBjb250YWlucyB0aGUgbWFpbiBlbnRyeSBmdW5jdGlvbnMgZm9yIHRva2VuaXppbmcsIHBhcnNpbmcsIGFuZCBjb21waWxpbmcga29mZmVlIGludG8gSmF2YVNjcmlwdC5cblxuZnMgICAgICAgID0gcmVxdWlyZSAnZnMnXG52bSAgICAgICAgPSByZXF1aXJlICd2bSdcbnBhdGggICAgICA9IHJlcXVpcmUgJ3BhdGgnXG57TGV4ZXJ9ICAgPSByZXF1aXJlICcuL2xleGVyJ1xue3BhcnNlcn0gID0gcmVxdWlyZSAnLi9wYXJzZXInXG5oZWxwZXJzICAgPSByZXF1aXJlICcuL2hlbHBlcnMnXG5Tb3VyY2VNYXAgPSByZXF1aXJlICcuL3NvdXJjZW1hcCdcbnBrZyAgICAgICA9IHJlcXVpcmUgJy4uL3BhY2thZ2UuanNvbidcblxuZXhwb3J0cy5WRVJTSU9OID0gcGtnLnZlcnNpb25cbmV4cG9ydHMuRklMRV9FWFRFTlNJT05TID0gRklMRV9FWFRFTlNJT05TID0gWycuY29mZmVlJyAnLmtvZmZlZSddXG5cbmV4cG9ydHMuaGVscGVycyA9IGhlbHBlcnNcblxueyBpbmplY3RGZWF0dXJlLCBpbmplY3RNZXRhLCB1cGRhdGVTeW50YXhFcnJvciwgbmFtZVdoaXRlc3BhY2VDaGFyYWN0ZXIsIHRocm93U3ludGF4RXJyb3IsIGlzQ29mZmVlLCBjb3VudCwgaGFzRmVhdHVyZSwgc3RyaW5naWZ5IH0gPSBoZWxwZXJzXG5cbmJhc2U2NGVuY29kZSA9IChzcmMpIC0+XG4gICAgXG4gICAgaWYgdHlwZW9mIEJ1ZmZlciBpcyAnZnVuY3Rpb24nXG4gICAgICAgIEJ1ZmZlci5mcm9tKHNyYykudG9TdHJpbmcoJ2Jhc2U2NCcpXG4gICAgZWxzZSBpZiB0eXBlb2YgYnRvYSBpcyAnZnVuY3Rpb24nXG4gICAgICAgICMgVGhlIGNvbnRlbnRzIG9mIGEgYDxzY3JpcHQ+YCBibG9jayBhcmUgZW5jb2RlZCB2aWEgVVRGLTE2LCBzbyBpZiBhbnkgZXh0ZW5kZWRcbiAgICAgICAgIyBjaGFyYWN0ZXJzIGFyZSB1c2VkIGluIHRoZSBibG9jaywgYnRvYSB3aWxsIGZhaWwgYXMgaXQgbWF4ZXMgb3V0IGF0IFVURi04LlxuICAgICAgICAjIFNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvV2luZG93QmFzZTY0L0Jhc2U2NF9lbmNvZGluZ19hbmRfZGVjb2RpbmcjVGhlX1VuaWNvZGVfUHJvYmxlbVxuICAgICAgICAjIGZvciB0aGUgZ29yeSBkZXRhaWxzLCBhbmQgZm9yIHRoZSBzb2x1dGlvbiBpbXBsZW1lbnRlZCBoZXJlLlxuICAgICAgICBidG9hIGVuY29kZVVSSUNvbXBvbmVudChzcmMpLnJlcGxhY2UgLyUoWzAtOUEtRl17Mn0pL2csIChtYXRjaCwgcDEpIC0+XG4gICAgICAgICAgICBTdHJpbmcuZnJvbUNoYXJDb2RlICcweCcgKyBwMVxuICAgIGVsc2VcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gYmFzZTY0IGVuY29kZSBpbmxpbmUgc291cmNlbWFwLicpXG5cbiMgV3JhcHBlciB0byBhZGQgc291cmNlIGZpbGUgaW5mb3JtYXRpb24gdG8gU3ludGF4RXJyb3JzIHRocm93biBieSB0aGUgbGV4ZXIvcGFyc2VyL2NvbXBpbGVyLlxuXG53aXRoUHJldHR5RXJyb3JzID0gKGZuKSAtPlxuICAgIFxuICAgIChjb2RlLCBvcHRpb25zID0ge30pIC0+IFxuICAgICAgICB0cnlcbiAgICAgICAgICAgIGZuLmNhbGwgQCwgY29kZSwgb3B0aW9uc1xuICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgIGlmIHR5cGVvZiBjb2RlICE9ICdzdHJpbmcnICMgU3VwcG9ydCBgS29mZmVlLm5vZGVzKHRva2VucylgLlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciBlcnIudG9TdHJpbmcoKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHRocm93IHVwZGF0ZVN5bnRheEVycm9yIGVyciwgY29kZSwgb3B0aW9ucy5maWxlbmFtZVxuXG4jIEZvciBlYWNoIGNvbXBpbGVkIGZpbGUsIHNhdmUgaXRzIHNvdXJjZSBpbiBtZW1vcnkgaW4gY2FzZSB3ZSBuZWVkIHRvXG4jIHJlY29tcGlsZSBpdCBsYXRlci4gV2UgbWlnaHQgbmVlZCB0byByZWNvbXBpbGUgaWYgdGhlIGZpcnN0IGNvbXBpbGF0aW9uXG4jIGRpZG7igJl0IGNyZWF0ZSBhIHNvdXJjZSBtYXAgKGZhc3RlcikgYnV0IHNvbWV0aGluZyB3ZW50IHdyb25nIGFuZCB3ZSBuZWVkXG4jIGEgc3RhY2sgdHJhY2UuIEFzc3VtaW5nIHRoYXQgbW9zdCBvZiB0aGUgdGltZSwgY29kZSBpc27igJl0IHRocm93aW5nXG4jIGV4Y2VwdGlvbnMsIGl04oCZcyBwcm9iYWJseSBtb3JlIGVmZmljaWVudCB0byBjb21waWxlIHR3aWNlIG9ubHkgd2hlbiB3ZVxuIyBuZWVkIGEgc3RhY2sgdHJhY2UsIHJhdGhlciB0aGFuIGFsd2F5cyBnZW5lcmF0aW5nIGEgc291cmNlIG1hcCBldmVuIHdoZW5cbiMgaXTigJlzIG5vdCBsaWtlbHkgdG8gYmUgdXNlZC4gU2F2ZSBpbiBmb3JtIG9mIGBmaWxlbmFtZWA6IGAoc291cmNlKWBcblxuc291cmNlcyA9IHt9XG5cbiMgQWxzbyBzYXZlIHNvdXJjZSBtYXBzIGlmIGdlbmVyYXRlZCwgaW4gZm9ybSBvZiBgZmlsZW5hbWVgOiBgKHNvdXJjZSBtYXApYC5cblxuc291cmNlTWFwcyA9IHt9XG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG5cbiMgQ29tcGlsZSBrb2ZmZWUgdG8gSmF2YVNjcmlwdCwgdXNpbmcgdGhlIEppc29uIGNvbXBpbGVyLlxuI1xuIyBJZiBgb3B0aW9ucy5zb3VyY2VNYXBgIGlzIHNwZWNpZmllZCwgdGhlbiBgb3B0aW9ucy5maWxlbmFtZWAgbXVzdCBhbHNvIGJlIHNwZWNpZmllZC4gXG4jIEFsbCBvcHRpb25zIHRoYXQgY2FuIGJlIHBhc3NlZCB0byBgU291cmNlTWFwI2dlbmVyYXRlYCBtYXkgYWxzbyBiZSBwYXNzZWQgaGVyZS5cbiNcbiMgVGhpcyByZXR1cm5zIGEgamF2YXNjcmlwdCBzdHJpbmcsIHVubGVzcyBgb3B0aW9ucy5zb3VyY2VNYXBgIGlzIHBhc3NlZCwgaW4gd2hpY2ggY2FzZSBpdCByZXR1cm5zIGEgYHtqcywgdjNTb3VyY2VNYXAsIHNvdXJjZU1hcH1gIG9iamVjdFxuXG5leHBvcnRzLmNvbXBpbGUgPSBjb21waWxlID0gd2l0aFByZXR0eUVycm9ycyAoY29kZSwgb3B0aW9ucykgLT5cbiAgICBcbiAgICB7IG1lcmdlLCBleHRlbmQgfSA9IGhlbHBlcnNcbiAgICBcbiAgICBvcHRpb25zID0gaW5qZWN0RmVhdHVyZSBvcHRpb25zXG4gICAgb3B0aW9ucyA9IGluamVjdE1ldGEgICAgb3B0aW9uc1xuICAgICAgICBcbiAgICAjIEFsd2F5cyBnZW5lcmF0ZSBhIHNvdXJjZSBtYXAgaWYgbm8gZmlsZW5hbWUgaXMgcGFzc2VkIGluLCBzaW5jZSB3aXRob3V0IGFcbiAgICAjIGEgZmlsZW5hbWUgd2UgaGF2ZSBubyB3YXkgdG8gcmV0cmlldmUgdGhpcyBzb3VyY2UgbGF0ZXIgaW4gdGhlIGV2ZW50IHRoYXRcbiAgICAjIHdlIG5lZWQgdG8gcmVjb21waWxlIGl0IHRvIGdldCBhIHNvdXJjZSBtYXAgZm9yIGBwcmVwYXJlU3RhY2tUcmFjZWAuXG4gICAgICAgIFxuICAgIGdlbmVyYXRlU291cmNlTWFwID0gb3B0aW9ucy5zb3VyY2VNYXAgb3Igb3B0aW9ucy5pbmxpbmVNYXAgb3Igbm90IG9wdGlvbnMuZmlsZW5hbWU/XG4gICAgZmlsZW5hbWUgPSBvcHRpb25zLmZpbGVuYW1lIG9yICc8YW5vbnltb3VzPidcblxuICAgIHNvdXJjZXNbZmlsZW5hbWVdID0gY29kZVxuICAgIG1hcCA9IG5ldyBTb3VyY2VNYXAgaWYgZ2VuZXJhdGVTb3VyY2VNYXBcblxuICAgIHRva2VucyA9IGxleGVyLnRva2VuaXplIGNvZGUsIG9wdGlvbnNcblxuICAgICMgUGFzcyBhIGxpc3Qgb2YgcmVmZXJlbmNlZCB2YXJpYWJsZXMsIHNvIHRoYXQgZ2VuZXJhdGVkIHZhcmlhYmxlcyB3b24ndCBnZXQgdGhlIHNhbWUgbmFtZS5cbiAgICBcbiAgICBvcHRpb25zLnJlZmVyZW5jZWRWYXJzID0gKCB0b2tlblsxXSBmb3IgdG9rZW4gaW4gdG9rZW5zIHdoZW4gdG9rZW5bMF0gaXMgJ0lERU5USUZJRVInIClcblxuICAgICMgQ2hlY2sgZm9yIGltcG9ydCBvciBleHBvcnQ7IGlmIGZvdW5kLCBmb3JjZSBiYXJlIG1vZGUuXG4gICAgICAgIFxuICAgIGlmIG5vdCBvcHRpb25zLmJhcmVcbiAgICAgICAgZm9yIHRva2VuIGluIHRva2Vuc1xuICAgICAgICAgICAgaWYgdG9rZW5bMF0gaW4gWydJTVBPUlQnICdFWFBPUlQnXVxuICAgICAgICAgICAgICAgIG9wdGlvbnMuYmFyZSA9IHllc1xuICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICBmcmFnbWVudHMgPSBwYXJzZXIucGFyc2UodG9rZW5zKS5jb21waWxlVG9GcmFnbWVudHMgb3B0aW9uc1xuXG4gICAgY3VycmVudExpbmUgPSAwXG4gICAgY3VycmVudExpbmUgKz0gMSBpZiBoYXNGZWF0dXJlIG9wdGlvbnMsICdoZWFkZXInXG4gICAgY3VycmVudENvbHVtbiA9IDBcbiAgICBqcyA9IFwiXCJcbiAgICBcbiAgICAjIGxvZyAnZnJhZ21lbnRzJywgc3RyaW5naWZ5IGZyYWdtZW50c1xuICAgIFxuICAgIGZvciBmcmFnbWVudCBpbiBmcmFnbWVudHNcbiAgICAgICAgIyBVcGRhdGUgdGhlIHNvdXJjZW1hcCB3aXRoIGRhdGEgZnJvbSBlYWNoIGZyYWdtZW50LlxuICAgICAgICBpZiBnZW5lcmF0ZVNvdXJjZU1hcFxuICAgICAgICAgICAgIyBEbyBub3QgaW5jbHVkZSBlbXB0eSwgd2hpdGVzcGFjZSwgb3Igc2VtaWNvbG9uLW9ubHkgZnJhZ21lbnRzLlxuICAgICAgICAgICAgaWYgZnJhZ21lbnQubG9jYXRpb25EYXRhIGFuZCBub3QgL15bO1xcc10qJC8udGVzdCBmcmFnbWVudC5jb2RlXG4gICAgICAgICAgICAgICAgbWFwLmFkZChcbiAgICAgICAgICAgICAgICAgICAgW2ZyYWdtZW50LmxvY2F0aW9uRGF0YS5maXJzdF9saW5lLCBmcmFnbWVudC5sb2NhdGlvbkRhdGEuZmlyc3RfY29sdW1uXVxuICAgICAgICAgICAgICAgICAgICBbY3VycmVudExpbmUsIGN1cnJlbnRDb2x1bW5dXG4gICAgICAgICAgICAgICAgICAgIHtub1JlcGxhY2U6IHRydWV9KVxuICAgICAgICAgICAgaWYgbm90IGZyYWdtZW50LmNvZGU/XG4gICAgICAgICAgICAgICAgbG9nICdnZW5lcmF0ZVNvdXJjZU1hcCcsIHN0cmluZ2lmeSBmcmFnbWVudFxuICAgICAgICAgICAgbmV3TGluZXMgPSBjb3VudCBmcmFnbWVudC5jb2RlLCBcIlxcblwiXG4gICAgICAgICAgICBjdXJyZW50TGluZSArPSBuZXdMaW5lc1xuICAgICAgICAgICAgaWYgbmV3TGluZXNcbiAgICAgICAgICAgICAgICBjdXJyZW50Q29sdW1uID0gZnJhZ21lbnQuY29kZS5sZW5ndGggLSAoZnJhZ21lbnQuY29kZS5sYXN0SW5kZXhPZihcIlxcblwiKSArIDEpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgY3VycmVudENvbHVtbiArPSBmcmFnbWVudC5jb2RlLmxlbmd0aFxuXG4gICAgICAgICMgQ29weSB0aGUgY29kZSBmcm9tIGVhY2ggZnJhZ21lbnQgaW50byB0aGUgZmluYWwgSmF2YVNjcmlwdC5cbiAgICAgICAganMgKz0gZnJhZ21lbnQuY29kZVxuXG4gICAgaWYgaGFzRmVhdHVyZSBvcHRpb25zLCAnaGVhZGVyJ1xuICAgICAgICBoZWFkZXIgPSBcImtvZmZlZSAje0BWRVJTSU9OfVwiXG4gICAgICAgIGpzID0gXCIvLyAje2hlYWRlcn1cXG4je2pzfVwiXG5cbiAgICBpZiBnZW5lcmF0ZVNvdXJjZU1hcFxuICAgICAgICB2M1NvdXJjZU1hcCA9IG1hcC5nZW5lcmF0ZShvcHRpb25zLCBjb2RlKVxuICAgICAgICBzb3VyY2VNYXBzW2ZpbGVuYW1lXSA9IG1hcFxuXG4gICAgaWYgb3B0aW9ucy5pbmxpbmVNYXBcbiAgICAgICAgZW5jb2RlZCA9IGJhc2U2NGVuY29kZSBKU09OLnN0cmluZ2lmeSB2M1NvdXJjZU1hcFxuICAgICAgICBzb3VyY2VNYXBEYXRhVVJJID0gXCIvLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LCN7ZW5jb2RlZH1cIlxuICAgICAgICBzb3VyY2VVUkwgPSBcIi8vIyBzb3VyY2VVUkw9I3tvcHRpb25zLmZpbGVuYW1lID8gJ2tvZmZlZSd9XCJcbiAgICAgICAganMgPSBcIiN7anN9XFxuI3tzb3VyY2VNYXBEYXRhVVJJfVxcbiN7c291cmNlVVJMfVwiXG5cbiAgICBpZiBvcHRpb25zLnNvdXJjZU1hcFxuICAgICAgICB7XG4gICAgICAgICAgICBqc1xuICAgICAgICAgICAgc291cmNlTWFwOiBtYXBcbiAgICAgICAgICAgIHYzU291cmNlTWFwOiBKU09OLnN0cmluZ2lmeSB2M1NvdXJjZU1hcCwgbnVsbCwgMlxuICAgICAgICB9XG4gICAgZWxzZVxuICAgICAgICBqc1xuICAgICAgICBcbiMgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMDAwMDAgICBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgICAwMDAgIFxuIyAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG5cbiMgVG9rZW5pemUgYSBzdHJpbmcgb2Yga29mZmVlIGNvZGUsIGFuZCByZXR1cm4gdGhlIGFycmF5IG9mIHRva2Vucy5cblxuZXhwb3J0cy50b2tlbnMgPSB3aXRoUHJldHR5RXJyb3JzIChjb2RlLCBvcHRpb25zKSAtPiBsZXhlci50b2tlbml6ZSBjb2RlLCBvcHRpb25zXG5cbiMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiMgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICBcblxuIyBQYXJzZSBhIHN0cmluZyBvZiBLb2ZmZWUgY29kZSBvciBhbiBhcnJheSBvZiBsZXhlZCB0b2tlbnMsIGFuZCByZXR1cm4gdGhlIEFTVC4gXG4jIFlvdSBjYW4gdGhlbiBjb21waWxlIGl0IGJ5IGNhbGxpbmcgYC5jb21waWxlKClgIG9uIHRoZSByb290LCBvciB0cmF2ZXJzZSBpdCBieSB1c2luZyBgLnRyYXZlcnNlQ2hpbGRyZW4oKWAgd2l0aCBhIGNhbGxiYWNrLlxuXG5leHBvcnRzLm5vZGVzID0gd2l0aFByZXR0eUVycm9ycyAoc291cmNlLCBvcHRpb25zKSAtPlxuICAgIFxuICAgIGlmIHR5cGVvZiBzb3VyY2UgaXMgJ3N0cmluZydcbiAgICAgICAgcGFyc2VyLnBhcnNlIGxleGVyLnRva2VuaXplIHNvdXJjZSwgb3B0aW9uc1xuICAgIGVsc2VcbiAgICAgICAgcGFyc2VyLnBhcnNlIHNvdXJjZVxuXG4jIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiMgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcblxuIyBDb21waWxlIGFuZCBleGVjdXRlIGEgc3RyaW5nIG9mIGtvZmZlZSwgY29ycmVjdGx5IHNldHRpbmcgYF9fZmlsZW5hbWVgLCBgX19kaXJuYW1lYCwgYW5kIHJlbGF0aXZlIGByZXF1aXJlKClgLlxuXG5leHBvcnRzLnJ1biA9IChjb2RlLCBvcHRpb25zPXt9KSAtPlxuICAgIFxuICAgIG9wdGlvbnMgPSBpbmplY3RGZWF0dXJlIG9wdGlvbnNcbiAgICBvcHRpb25zID0gaW5qZWN0TWV0YSAgICBvcHRpb25zXG4gICAgXG4gICAgbWFpbk1vZHVsZSA9IHJlcXVpcmUubWFpblxuXG4gICAgIyBTZXQgdGhlIGZpbGVuYW1lXG4gICAgXG4gICAgbWFpbk1vZHVsZS5maWxlbmFtZSA9IHByb2Nlc3MuYXJndlsxXSA9XG4gICAgICAgIGlmIG9wdGlvbnMuZmlsZW5hbWUgdGhlbiBmcy5yZWFscGF0aFN5bmMob3B0aW9ucy5maWxlbmFtZSkgZWxzZSAnPGFub255bW91cz4nXG5cbiAgICBtYWluTW9kdWxlLm1vZHVsZUNhY2hlIGFuZD0ge30gIyBDbGVhciB0aGUgbW9kdWxlIGNhY2hlLlxuXG4gICAgIyBBc3NpZ24gcGF0aHMgZm9yIG5vZGVfbW9kdWxlcyBsb2FkaW5nXG4gICAgICAgIFxuICAgIGRpciA9IGlmIG9wdGlvbnMuZmlsZW5hbWU/XG4gICAgICAgIHBhdGguZGlybmFtZSBmcy5yZWFscGF0aFN5bmMgb3B0aW9ucy5maWxlbmFtZVxuICAgIGVsc2VcbiAgICAgICAgZnMucmVhbHBhdGhTeW5jICcuJ1xuICAgIG1haW5Nb2R1bGUucGF0aHMgPSByZXF1aXJlKCdtb2R1bGUnKS5fbm9kZU1vZHVsZVBhdGhzIGRpclxuXG4gICAgIyBDb21waWxlXG4gICAgXG4gICAgaWYgbm90IGlzQ29mZmVlKG1haW5Nb2R1bGUuZmlsZW5hbWUpIG9yIHJlcXVpcmUuZXh0ZW5zaW9uc1xuICAgICAgICBhbnN3ZXIgPSBjb21waWxlIGNvZGUsIG9wdGlvbnNcbiAgICAgICAgY29kZSA9IGFuc3dlci5qcyA/IGFuc3dlclxuXG4gICAgIyBsb2cgJ0tvZmZlZS5ydW4gbWFpbk1vZHVsZS5fY29tcGlsZScsIG1haW5Nb2R1bGUuZmlsZW5hbWUsIG9wdGlvbnMgaWYgb3B0aW9ucy5EZWJ1Z1xuICAgICAgICBcbiAgICBtYWluTW9kdWxlLl9jb21waWxlIGNvZGUsIG1haW5Nb2R1bGUuZmlsZW5hbWVcblxuIyAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIFxuIyAwMDAwMDAwICAgIDAwMCAwMDAgICAwMDAwMDAwMDAgIDAwMCAgICAgIFxuIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgIFxuIyAwMDAwMDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgIFxuXG4jIENvbXBpbGUgYW5kIGV2YWx1YXRlIGEgc3RyaW5nIGluIGEgTm9kZS5qcy1saWtlIGVudmlyb25tZW50LiBUaGUgUkVQTCB1c2VzIHRoaXMgdG8gcnVuIHRoZSBpbnB1dC5cblxuZXhwb3J0cy5ldmFsID0gKGNvZGUsIG9wdGlvbnM9e30pIC0+XG4gICAgXG4gICAgcmV0dXJuIHVubGVzcyBjb2RlID0gY29kZS50cmltKClcbiAgICBcbiAgICAjIGNyZWF0ZUNvbnRleHQgPSB2bS5TY3JpcHQuY3JlYXRlQ29udGV4dCA/IHZtLmNyZWF0ZUNvbnRleHRcbiAgICBjcmVhdGVDb250ZXh0ID0gdm0uY3JlYXRlQ29udGV4dFxuXG4gICAgaXNDb250ZXh0ID0gdm0uaXNDb250ZXh0ID8gKGN0eCkgLT5cbiAgICAgICAgb3B0aW9ucy5zYW5kYm94IGluc3RhbmNlb2YgY3JlYXRlQ29udGV4dCgpLmNvbnN0cnVjdG9yXG5cbiAgICBpZiBjcmVhdGVDb250ZXh0XG4gICAgICAgIGlmIG9wdGlvbnMuc2FuZGJveD9cbiAgICAgICAgICAgIGlmIGlzQ29udGV4dCBvcHRpb25zLnNhbmRib3hcbiAgICAgICAgICAgICAgICBzYW5kYm94ID0gb3B0aW9ucy5zYW5kYm94XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgc2FuZGJveCA9IGNyZWF0ZUNvbnRleHQoKVxuICAgICAgICAgICAgICAgIHNhbmRib3hba10gPSB2IGZvciBvd24gaywgdiBvZiBvcHRpb25zLnNhbmRib3hcbiAgICAgICAgICAgIHNhbmRib3guZ2xvYmFsID0gc2FuZGJveC5yb290ID0gc2FuZGJveC5HTE9CQUwgPSBzYW5kYm94XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNhbmRib3ggPSBnbG9iYWxcbiAgICAgICAgc2FuZGJveC5fX2ZpbGVuYW1lID0gb3B0aW9ucy5maWxlbmFtZSB8fCAnZXZhbCdcbiAgICAgICAgc2FuZGJveC5fX2Rpcm5hbWUgID0gcGF0aC5kaXJuYW1lIHNhbmRib3guX19maWxlbmFtZVxuICAgICAgICAjIGRlZmluZSBtb2R1bGUvcmVxdWlyZSBvbmx5IGlmIHRoZXkgY2hvc2Ugbm90IHRvIHNwZWNpZnkgdGhlaXIgb3duXG4gICAgICAgIHVubGVzcyBzYW5kYm94ICE9IGdsb2JhbCBvciBzYW5kYm94Lm1vZHVsZSBvciBzYW5kYm94LnJlcXVpcmVcbiAgICAgICAgICAgIE1vZHVsZSA9IHJlcXVpcmUgJ21vZHVsZSdcbiAgICAgICAgICAgIHNhbmRib3gubW9kdWxlICA9IF9tb2R1bGUgID0gbmV3IE1vZHVsZShvcHRpb25zLm1vZHVsZW5hbWUgfHwgJ2V2YWwnKVxuICAgICAgICAgICAgc2FuZGJveC5yZXF1aXJlID0gX3JlcXVpcmUgPSAocGF0aCkgLT4gIE1vZHVsZS5fbG9hZCBwYXRoLCBfbW9kdWxlLCB0cnVlXG4gICAgICAgICAgICBfbW9kdWxlLmZpbGVuYW1lID0gc2FuZGJveC5fX2ZpbGVuYW1lXG4gICAgICAgICAgICBmb3IgciBpbiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyByZXF1aXJlIHdoZW4gciBub3QgaW4gWydwYXRocycgJ2FyZ3VtZW50cycgJ2NhbGxlciddXG4gICAgICAgICAgICAgICAgX3JlcXVpcmVbcl0gPSByZXF1aXJlW3JdXG4gICAgICAgICAgICAjIHVzZSB0aGUgc2FtZSBoYWNrIG5vZGUgY3VycmVudGx5IHVzZXMgZm9yIHRoZWlyIG93biBSRVBMXG4gICAgICAgICAgICBfcmVxdWlyZS5wYXRocyA9IF9tb2R1bGUucGF0aHMgPSBNb2R1bGUuX25vZGVNb2R1bGVQYXRocyBwcm9jZXNzLmN3ZCgpXG4gICAgICAgICAgICBfcmVxdWlyZS5yZXNvbHZlID0gKHJlcXVlc3QpIC0+IE1vZHVsZS5fcmVzb2x2ZUZpbGVuYW1lIHJlcXVlc3QsIF9tb2R1bGVcbiAgICBvID0ge31cbiAgICBvW2tdID0gdiBmb3Igb3duIGssIHYgb2Ygb3B0aW9uc1xuICAgIG8uYmFyZSA9IHllcyAjIGVuc3VyZSByZXR1cm4gdmFsdWVcbiAgICBqcyA9IGNvbXBpbGUgY29kZSwgb1xuICAgIGlmIHNhbmRib3ggaXMgZ2xvYmFsXG4gICAgICAgIHZtLnJ1bkluVGhpc0NvbnRleHQganNcbiAgICBlbHNlXG4gICAgICAgIHZtLnJ1bkluQ29udGV4dCBqcywgc2FuZGJveFxuXG4jIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuXG5leHBvcnRzLnJlZ2lzdGVyID0gLT4gcmVxdWlyZSAnLi9yZWdpc3RlcidcblxuZXhwb3J0cy5fY29tcGlsZUZpbGUgPSAoZmlsZW5hbWUsIHNvdXJjZU1hcCA9IG5vLCBpbmxpbmVNYXAgPSBubykgLT5cbiAgICBcbiAgICByYXcgPSBmcy5yZWFkRmlsZVN5bmMgZmlsZW5hbWUsICd1dGY4J1xuICAgICMgU3RyaXAgdGhlIFVuaWNvZGUgYnl0ZSBvcmRlciBtYXJrLCBpZiB0aGlzIGZpbGUgYmVnaW5zIHdpdGggb25lLlxuICAgIHN0cmlwcGVkID0gaWYgcmF3LmNoYXJDb2RlQXQoMCkgaXMgMHhGRUZGIHRoZW4gcmF3LnN1YnN0cmluZyAxIGVsc2UgcmF3XG5cbiAgICB0cnlcbiAgICAgICAgYW5zd2VyID0gY29tcGlsZSBzdHJpcHBlZCwge1xuICAgICAgICAgICAgZmlsZW5hbWUsIHNvdXJjZU1hcCwgaW5saW5lTWFwXG4gICAgICAgICAgICBzb3VyY2VGaWxlczogW2ZpbGVuYW1lXVxuICAgICAgICB9XG4gICAgY2F0Y2ggZXJyXG4gICAgICAgICMgQXMgdGhlIGZpbGVuYW1lIGFuZCBjb2RlIG9mIGEgZHluYW1pY2FsbHkgbG9hZGVkIGZpbGUgd2lsbCBiZSBkaWZmZXJlbnRcbiAgICAgICAgIyBmcm9tIHRoZSBvcmlnaW5hbCBmaWxlIGNvbXBpbGVkIHdpdGggS29mZmVlLnJ1biwgYWRkIHRoYXRcbiAgICAgICAgIyBpbmZvcm1hdGlvbiB0byBlcnJvciBzbyBpdCBjYW4gYmUgcHJldHR5LXByaW50ZWQgbGF0ZXIuXG4gICAgICAgIHRocm93IHVwZGF0ZVN5bnRheEVycm9yIGVyciwgc3RyaXBwZWQsIGZpbGVuYW1lXG5cbiAgICBhbnN3ZXJcblxuIyAwMDAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiMgMDAwICAgICAgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgICAgIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuIyAwMDAgICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG5cbmxleGVyID0gbmV3IExleGVyICMgSW5zdGFudGlhdGUgYSBMZXhlciBmb3Igb3VyIHVzZSBoZXJlLlxuXG4jIFRoZSByZWFsIExleGVyIHByb2R1Y2VzIGEgZ2VuZXJpYyBzdHJlYW0gb2YgdG9rZW5zLiBUaGlzIG9iamVjdCBwcm92aWRlcyBhXG4jIHRoaW4gd3JhcHBlciBhcm91bmQgaXQsIGNvbXBhdGlibGUgd2l0aCB0aGUgSmlzb24gQVBJLiBXZSBjYW4gdGhlbiBwYXNzIGl0XG4jIGRpcmVjdGx5IGFzIGEgXCJKaXNvbiBsZXhlclwiLlxuXG5wYXJzZXIubGV4ZXIgPVxuICAgIFxuICAgIGxleDogLT5cbiAgICAgICAgdG9rZW4gPSBwYXJzZXIudG9rZW5zW0Bwb3MrK11cbiAgICAgICAgaWYgdG9rZW5cbiAgICAgICAgICAgIFt0YWcsIEB5eXRleHQsIEB5eWxsb2NdID0gdG9rZW5cbiAgICAgICAgICAgIHBhcnNlci5lcnJvclRva2VuID0gdG9rZW4ub3JpZ2luIG9yIHRva2VuXG4gICAgICAgICAgICBlcnJvciAnREFGVUsnLCB0b2tlbiBpZiBub3QgQHl5bGxvYz8uZmlyc3RfbGluZT9cbiAgICAgICAgICAgIEB5eWxpbmVubyA9IEB5eWxsb2MuZmlyc3RfbGluZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0YWcgPSAnJ1xuICAgICAgICB0YWdcbiAgICBzZXRJbnB1dDogKHRva2VucykgLT5cbiAgICAgICAgcGFyc2VyLnRva2VucyA9IHRva2Vuc1xuICAgICAgICBAcG9zID0gMFxuICAgIHVwY29taW5nSW5wdXQ6IC0+XG4gICAgICAgIFwiXCJcbiAgICAgICAgXG5wYXJzZXIueXkgPSByZXF1aXJlICcuL25vZGVzJyAjIE1ha2UgYWxsIHRoZSBBU1Qgbm9kZXMgdmlzaWJsZSB0byB0aGUgcGFyc2VyLlxuXG5wYXJzZXIueXkucGFyc2VFcnJvciA9IChtZXNzYWdlLCB7dG9rZW59KSAtPiAjIE92ZXJyaWRlIEppc29uJ3MgZGVmYXVsdCBlcnJvciBoYW5kbGluZyBmdW5jdGlvbi5cbiAgICBcbiAgICAjIERpc3JlZ2FyZCBKaXNvbidzIG1lc3NhZ2UsIGl0IGNvbnRhaW5zIHJlZHVuZGFudCBsaW5lIG51bWJlciBpbmZvcm1hdGlvbi5cbiAgICAjIERpc3JlZ2FyZCB0aGUgdG9rZW4sIHdlIHRha2UgaXRzIHZhbHVlIGRpcmVjdGx5IGZyb20gdGhlIGxleGVyIGluIGNhc2VcbiAgICAjIHRoZSBlcnJvciBpcyBjYXVzZWQgYnkgYSBnZW5lcmF0ZWQgdG9rZW4gd2hpY2ggbWlnaHQgcmVmZXIgdG8gaXRzIG9yaWdpbi5cbiAgICBcbiAgICB7ZXJyb3JUb2tlbiwgdG9rZW5zfSA9IHBhcnNlclxuICAgIFtlcnJvclRhZywgZXJyb3JUZXh0LCBlcnJvckxvY10gPSBlcnJvclRva2VuXG5cbiAgICBlcnJvclRleHQgPSBzd2l0Y2hcbiAgICAgICAgd2hlbiBlcnJvclRva2VuIGlzIHRva2Vuc1t0b2tlbnMubGVuZ3RoIC0gMV1cbiAgICAgICAgICAgICdlbmQgb2YgaW5wdXQnXG4gICAgICAgIHdoZW4gZXJyb3JUYWcgaW4gWydJTkRFTlQnICdPVVRERU5UJ11cbiAgICAgICAgICAgICdpbmRlbnRhdGlvbidcbiAgICAgICAgd2hlbiBlcnJvclRhZyBpbiBbJ0lERU5USUZJRVInICdOVU1CRVInICdJTkZJTklUWScgJ1NUUklORycgJ1NUUklOR19TVEFSVCcgJ1JFR0VYJyAnUkVHRVhfU1RBUlQnXVxuICAgICAgICAgICAgZXJyb3JUYWcucmVwbGFjZSgvX1NUQVJUJC8sICcnKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIG5hbWVXaGl0ZXNwYWNlQ2hhcmFjdGVyIGVycm9yVGV4dFxuXG4gICAgIyBUaGUgc2Vjb25kIGFyZ3VtZW50IGhhcyBhIGBsb2NgIHByb3BlcnR5LCB3aGljaCBzaG91bGQgaGF2ZSB0aGUgbG9jYXRpb24gZGF0YSBmb3IgdGhpcyB0b2tlbi4gXG4gICAgIyBVbmZvcnR1bmF0ZWx5LCBKaXNvbiBzZWVtcyB0byBzZW5kIGFuIG91dGRhdGVkIGBsb2NgIChmcm9tIHRoZSBwcmV2aW91cyB0b2tlbiksIFxuICAgICMgc28gd2UgdGFrZSB0aGUgbG9jYXRpb24gaW5mb3JtYXRpb24gZGlyZWN0bHkgZnJvbSB0aGUgbGV4ZXIuXG4gICAgXG4gICAgdGhyb3dTeW50YXhFcnJvciBcInVuZXhwZWN0ZWQgI3tlcnJvclRleHR9XCIsIGVycm9yTG9jXG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4jIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuXG5nZXRTb3VyY2VNYXAgPSAoZmlsZW5hbWUpIC0+XG4gICAgIFxuICAgICMgS29mZmVlIGNvbXBpbGVkIGluIGEgYnJvd3NlciBtYXkgZ2V0IGNvbXBpbGVkIHdpdGggYG9wdGlvbnMuZmlsZW5hbWVgIG9mIGA8YW5vbnltb3VzPmAsIFxuICAgICMgYnV0IHRoZSBicm93c2VyIG1heSByZXF1ZXN0IHRoZSBzdGFjayB0cmFjZSB3aXRoIHRoZSBmaWxlbmFtZSBvZiB0aGUgc2NyaXB0IGZpbGUuXG4gICAgXG4gICAgaWYgc291cmNlTWFwc1tmaWxlbmFtZV0/XG4gICAgICAgIHNvdXJjZU1hcHNbZmlsZW5hbWVdXG4gICAgZWxzZSBpZiBzb3VyY2VNYXBzWyc8YW5vbnltb3VzPiddP1xuICAgICAgICBzb3VyY2VNYXBzWyc8YW5vbnltb3VzPiddXG4gICAgZWxzZSBpZiBzb3VyY2VzW2ZpbGVuYW1lXT9cbiAgICAgICAgYW5zd2VyID0gY29tcGlsZSBzb3VyY2VzW2ZpbGVuYW1lXSxcbiAgICAgICAgICAgIGZpbGVuYW1lOiBmaWxlbmFtZVxuICAgICAgICAgICAgc291cmNlTWFwOiB5ZXNcbiAgICAgICAgYW5zd2VyLnNvdXJjZU1hcFxuICAgIGVsc2VcbiAgICAgICAgbnVsbFxuXG4jICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgXG4jICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuXG4jIEJhc2VkIG9uIFttaWNoYWVsZmljYXJyYS9Lb2ZmZWVSZWR1eF0oaHR0cDovL2dvby5nbC9aVHgxcClcbiMgTm9kZUpTIC8gVjggaGF2ZSBubyBzdXBwb3J0IGZvciB0cmFuc2Zvcm1pbmcgcG9zaXRpb25zIGluIHN0YWNrIHRyYWNlcyB1c2luZ1xuIyBzb3VyY2VNYXAsIHNvIHdlIG11c3QgbW9ua2V5LXBhdGNoIEVycm9yIHRvIGRpc3BsYXkgS29mZmVlIHNvdXJjZSBwb3NpdGlvbnMuXG5cbkVycm9yLnByZXBhcmVTdGFja1RyYWNlID0gKGVyciwgc3RhY2spIC0+XG4gICAgXG4gICAgZ2V0U291cmNlTWFwcGluZyA9IChmaWxlbmFtZSwgbGluZSwgY29sdW1uKSAtPlxuICAgICAgICBzb3VyY2VNYXAgPSBnZXRTb3VyY2VNYXAgZmlsZW5hbWVcbiAgICAgICAgYW5zd2VyID0gc291cmNlTWFwLnNvdXJjZUxvY2F0aW9uIFtsaW5lIC0gMSwgY29sdW1uIC0gMV0gaWYgc291cmNlTWFwP1xuICAgICAgICBpZiBhbnN3ZXI/IHRoZW4gW2Fuc3dlclswXSArIDEsIGFuc3dlclsxXSArIDFdIGVsc2UgbnVsbFxuXG4gICAgZnJhbWVzID0gZm9yIGZyYW1lIGluIHN0YWNrXG4gICAgICAgIGJyZWFrIGlmIGZyYW1lLmdldEZ1bmN0aW9uKCkgaXMgZXhwb3J0cy5ydW5cbiAgICAgICAgXCIgICAgICAgIGF0ICN7Zm9ybWF0U291cmNlUG9zaXRpb24gZnJhbWUsIGdldFNvdXJjZU1hcHBpbmd9XCJcblxuICAgIFwiI3tlcnIudG9TdHJpbmcoKX1cXG4je2ZyYW1lcy5qb2luICdcXG4nfVxcblwiXG4gICAgXG4jIEJhc2VkIG9uIGh0dHA6Ly92OC5nb29nbGVjb2RlLmNvbS9zdm4vYnJhbmNoZXMvYmxlZWRpbmdfZWRnZS9zcmMvbWVzc2FnZXMuanNcbiMgTW9kaWZpZWQgdG8gaGFuZGxlIHNvdXJjZU1hcFxuXG5mb3JtYXRTb3VyY2VQb3NpdGlvbiA9IChmcmFtZSwgZ2V0U291cmNlTWFwcGluZykgLT5cbiAgICBcbiAgICBmaWxlbmFtZSA9IHVuZGVmaW5lZFxuICAgIGZpbGVMb2NhdGlvbiA9ICcnXG5cbiAgICBpZiBmcmFtZS5pc05hdGl2ZSgpXG4gICAgICAgIGZpbGVMb2NhdGlvbiA9IFwibmF0aXZlXCJcbiAgICBlbHNlXG4gICAgICAgIGlmIGZyYW1lLmlzRXZhbCgpXG4gICAgICAgICAgICBmaWxlbmFtZSA9IGZyYW1lLmdldFNjcmlwdE5hbWVPclNvdXJjZVVSTCgpXG4gICAgICAgICAgICBmaWxlTG9jYXRpb24gPSBcIiN7ZnJhbWUuZ2V0RXZhbE9yaWdpbigpfSwgXCIgdW5sZXNzIGZpbGVuYW1lXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGZpbGVuYW1lID0gZnJhbWUuZ2V0RmlsZU5hbWUoKVxuXG4gICAgICAgIGZpbGVuYW1lIG9yPSBcIjxhbm9ueW1vdXM+XCJcblxuICAgICAgICBsaW5lID0gZnJhbWUuZ2V0TGluZU51bWJlcigpXG4gICAgICAgIGNvbHVtbiA9IGZyYW1lLmdldENvbHVtbk51bWJlcigpXG5cbiAgICAgICAgIyBDaGVjayBmb3IgYSBzb3VyY2VNYXAgcG9zaXRpb25cbiAgICAgICAgc291cmNlID0gZ2V0U291cmNlTWFwcGluZyBmaWxlbmFtZSwgbGluZSwgY29sdW1uXG4gICAgICAgIGZpbGVMb2NhdGlvbiA9XG4gICAgICAgICAgICBpZiBzb3VyY2VcbiAgICAgICAgICAgICAgICBcIiN7ZmlsZW5hbWV9OiN7c291cmNlWzBdfToje3NvdXJjZVsxXX1cIlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIFwiI3tmaWxlbmFtZX06I3tsaW5lfToje2NvbHVtbn1cIlxuXG4gICAgZnVuY3Rpb25OYW1lID0gZnJhbWUuZ2V0RnVuY3Rpb25OYW1lKClcbiAgICBpc0NvbnN0cnVjdG9yID0gZnJhbWUuaXNDb25zdHJ1Y3RvcigpXG4gICAgaXNNZXRob2RDYWxsID0gbm90IChmcmFtZS5pc1RvcGxldmVsKCkgb3IgaXNDb25zdHJ1Y3RvcilcblxuICAgIGlmIGlzTWV0aG9kQ2FsbFxuICAgICAgICBtZXRob2ROYW1lID0gZnJhbWUuZ2V0TWV0aG9kTmFtZSgpXG4gICAgICAgIHR5cGVOYW1lID0gZnJhbWUuZ2V0VHlwZU5hbWUoKVxuXG4gICAgICAgIGlmIGZ1bmN0aW9uTmFtZVxuICAgICAgICAgICAgdHAgPSBhcyA9ICcnXG4gICAgICAgICAgICBpZiB0eXBlTmFtZSBhbmQgZnVuY3Rpb25OYW1lLmluZGV4T2YgdHlwZU5hbWVcbiAgICAgICAgICAgICAgICB0cCA9IFwiI3t0eXBlTmFtZX0uXCJcbiAgICAgICAgICAgIGlmIG1ldGhvZE5hbWUgYW5kIGZ1bmN0aW9uTmFtZS5pbmRleE9mKFwiLiN7bWV0aG9kTmFtZX1cIikgIT0gZnVuY3Rpb25OYW1lLmxlbmd0aCAtIG1ldGhvZE5hbWUubGVuZ3RoIC0gMVxuICAgICAgICAgICAgICAgIGFzID0gXCIgW2FzICN7bWV0aG9kTmFtZX1dXCJcblxuICAgICAgICAgICAgXCIje3RwfSN7ZnVuY3Rpb25OYW1lfSN7YXN9ICgje2ZpbGVMb2NhdGlvbn0pXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgXCIje3R5cGVOYW1lfS4je21ldGhvZE5hbWUgb3IgJzxhbm9ueW1vdXM+J30gKCN7ZmlsZUxvY2F0aW9ufSlcIlxuICAgIGVsc2UgaWYgaXNDb25zdHJ1Y3RvclxuICAgICAgICBcIm5ldyAje2Z1bmN0aW9uTmFtZSBvciAnPGFub255bW91cz4nfSAoI3tmaWxlTG9jYXRpb259KVwiXG4gICAgZWxzZSBpZiBmdW5jdGlvbk5hbWVcbiAgICAgICAgXCIje2Z1bmN0aW9uTmFtZX0gKCN7ZmlsZUxvY2F0aW9ufSlcIlxuICAgIGVsc2VcbiAgICAgICAgZmlsZUxvY2F0aW9uXG4gICAgXG4gICAgIl19
//# sourceURL=../coffee/koffee.coffee