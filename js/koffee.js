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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia29mZmVlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSwrU0FBQTtJQUFBOztBQVVBLEVBQUEsR0FBWSxPQUFBLENBQVEsSUFBUjs7QUFDWixFQUFBLEdBQVksT0FBQSxDQUFRLElBQVI7O0FBQ1osSUFBQSxHQUFZLE9BQUEsQ0FBUSxNQUFSOztBQUNYLFFBQVcsT0FBQSxDQUFRLFNBQVI7O0FBQ1gsU0FBVyxPQUFBLENBQVEsVUFBUjs7QUFDWixPQUFBLEdBQVksT0FBQSxDQUFRLFdBQVI7O0FBQ1osU0FBQSxHQUFZLE9BQUEsQ0FBUSxhQUFSOztBQUNaLEdBQUEsR0FBWSxPQUFBLENBQVEsaUJBQVI7O0FBRVosT0FBTyxDQUFDLE9BQVIsR0FBa0IsR0FBRyxDQUFDOztBQUN0QixPQUFPLENBQUMsZUFBUixHQUEwQixlQUFBLEdBQWtCLENBQUMsU0FBRCxFQUFXLFNBQVg7O0FBRTVDLE9BQU8sQ0FBQyxPQUFSLEdBQWtCOztBQUVoQixxQ0FBRixFQUFpQiwrQkFBakIsRUFBNkIsNkNBQTdCLEVBQWdELHlEQUFoRCxFQUF5RSwyQ0FBekUsRUFBMkYsMkJBQTNGLEVBQXFHLHFCQUFyRyxFQUE0RywrQkFBNUcsRUFBd0g7O0FBRXhILFlBQUEsR0FBZSxTQUFDLEdBQUQ7SUFFWCxJQUFHLE9BQU8sTUFBUCxLQUFpQixVQUFwQjtlQUNJLE1BQU0sQ0FBQyxJQUFQLENBQVksR0FBWixDQUFnQixDQUFDLFFBQWpCLENBQTBCLFFBQTFCLEVBREo7S0FBQSxNQUVLLElBQUcsT0FBTyxJQUFQLEtBQWUsVUFBbEI7ZUFLRCxJQUFBLENBQUssa0JBQUEsQ0FBbUIsR0FBbkIsQ0FBdUIsQ0FBQyxPQUF4QixDQUFnQyxpQkFBaEMsRUFBbUQsU0FBQyxLQUFELEVBQVEsRUFBUjttQkFDcEQsTUFBTSxDQUFDLFlBQVAsQ0FBb0IsSUFBQSxHQUFPLEVBQTNCO1FBRG9ELENBQW5ELENB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QUEsR0FBRyxFQUFILEdBQVEsWUFBUixHQUF1QixFQUF2QixHQUEwQixJQUExQixHQUE4QixZQUE5QixHQUEyQyxJQVAvQztTQUFBLE1BQUE7bUJBU08sUUFBRCxHQUFVLEdBQVYsR0FBWSxDQUFDLFVBQUEsSUFBYyxhQUFmLENBQVosR0FBeUMsSUFBekMsR0FBNkMsWUFBN0MsR0FBMEQsSUFUaEU7U0FKSjtLQUFBLE1BY0ssSUFBRyxhQUFIO2VBQ0QsTUFBQSxHQUFNLENBQUMsWUFBQSxJQUFnQixhQUFqQixDQUFOLEdBQXFDLElBQXJDLEdBQXlDLFlBQXpDLEdBQXNELElBRHJEO0tBQUEsTUFFQSxJQUFHLFlBQUg7ZUFDRSxZQUFELEdBQWMsSUFBZCxHQUFrQixZQUFsQixHQUErQixJQURoQztLQUFBLE1BQUE7ZUFHRCxhQUhDOztBQS9DYyIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICBcbjAwMCAgMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgXG4wMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwICAgIDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuMDAwICAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICBcbjAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMDAwMDAwICAwMDAwMDAwMCAgXG4jIyNcblxuIyBUaGlzIG1vZHVsZSBjb250YWlucyB0aGUgbWFpbiBlbnRyeSBmdW5jdGlvbnMgZm9yIHRva2VuaXppbmcsIHBhcnNpbmcsIGFuZCBjb21waWxpbmcga29mZmVlIGludG8gSmF2YVNjcmlwdC5cblxuZnMgICAgICAgID0gcmVxdWlyZSAnZnMnXG52bSAgICAgICAgPSByZXF1aXJlICd2bSdcbnBhdGggICAgICA9IHJlcXVpcmUgJ3BhdGgnXG57TGV4ZXJ9ICAgPSByZXF1aXJlICcuL2xleGVyJ1xue3BhcnNlcn0gID0gcmVxdWlyZSAnLi9wYXJzZXInXG5oZWxwZXJzICAgPSByZXF1aXJlICcuL2hlbHBlcnMnXG5Tb3VyY2VNYXAgPSByZXF1aXJlICcuL3NvdXJjZW1hcCdcbnBrZyAgICAgICA9IHJlcXVpcmUgJy4uL3BhY2thZ2UuanNvbidcblxuZXhwb3J0cy5WRVJTSU9OID0gcGtnLnZlcnNpb25cbmV4cG9ydHMuRklMRV9FWFRFTlNJT05TID0gRklMRV9FWFRFTlNJT05TID0gWycuY29mZmVlJyAnLmtvZmZlZSddXG5cbmV4cG9ydHMuaGVscGVycyA9IGhlbHBlcnNcblxueyBpbmplY3RGZWF0dXJlLCBpbmplY3RNZXRhLCB1cGRhdGVTeW50YXhFcnJvciwgbmFtZVdoaXRlc3BhY2VDaGFyYWN0ZXIsIHRocm93U3ludGF4RXJyb3IsIGlzQ29mZmVlLCBjb3VudCwgaGFzRmVhdHVyZSwgc3RyaW5naWZ5IH0gPSBoZWxwZXJzXG5cbmJhc2U2NGVuY29kZSA9IChzcmMpIC0+XG4gICAgXG4gICAgaWYgdHlwZW9mIEJ1ZmZlciBpcyAnZnVuY3Rpb24nXG4gICAgICAgIEJ1ZmZlci5mcm9tKHNyYykudG9TdHJpbmcoJ2Jhc2U2NCcpXG4gICAgZWxzZSBpZiB0eXBlb2YgYnRvYSBpcyAnZnVuY3Rpb24nXG4gICAgICAgICMgVGhlIGNvbnRlbnRzIG9mIGEgYDxzY3JpcHQ+YCBibG9jayBhcmUgZW5jb2RlZCB2aWEgVVRGLTE2LCBzbyBpZiBhbnkgZXh0ZW5kZWRcbiAgICAgICAgIyBjaGFyYWN0ZXJzIGFyZSB1c2VkIGluIHRoZSBibG9jaywgYnRvYSB3aWxsIGZhaWwgYXMgaXQgbWF4ZXMgb3V0IGF0IFVURi04LlxuICAgICAgICAjIFNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvV2luZG93QmFzZTY0L0Jhc2U2NF9lbmNvZGluZ19hbmRfZGVjb2RpbmcjVGhlX1VuaWNvZGVfUHJvYmxlbVxuICAgICAgICAjIGZvciB0aGUgZ29yeSBkZXRhaWxzLCBhbmQgZm9yIHRoZSBzb2x1dGlvbiBpbXBsZW1lbnRlZCBoZXJlLlxuICAgICAgICBidG9hIGVuY29kZVVSSUNvbXBvbmVudChzcmMpLnJlcGxhY2UgLyUoWzAtOUEtRl17Mn0pL2csIChtYXRjaCwgcDEpIC0+XG4gICAgICAgICAgICBTdHJpbmcuZnJvbUNoYXJDb2RlICcweCcgKyBwMVxuICAgIGVsc2VcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gYmFzZTY0IGVuY29kZSBpbmxpbmUgc291cmNlbWFwLicpXG5cbiMgV3JhcHBlciB0byBhZGQgc291cmNlIGZpbGUgaW5mb3JtYXRpb24gdG8gU3ludGF4RXJyb3JzIHRocm93biBieSB0aGUgbGV4ZXIvcGFyc2VyL2NvbXBpbGVyLlxuXG53aXRoUHJldHR5RXJyb3JzID0gKGZuKSAtPlxuICAgIFxuICAgIChjb2RlLCBvcHRpb25zID0ge30pIC0+IFxuICAgICAgICB0cnlcbiAgICAgICAgICAgIGZuLmNhbGwgQCwgY29kZSwgb3B0aW9uc1xuICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgIGlmIHR5cGVvZiBjb2RlICE9ICdzdHJpbmcnICMgU3VwcG9ydCBgS29mZmVlLm5vZGVzKHRva2VucylgLlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciBlcnIudG9TdHJpbmcoKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHRocm93IHVwZGF0ZVN5bnRheEVycm9yIGVyciwgY29kZSwgb3B0aW9ucy5maWxlbmFtZVxuXG4jIEZvciBlYWNoIGNvbXBpbGVkIGZpbGUsIHNhdmUgaXRzIHNvdXJjZSBpbiBtZW1vcnkgaW4gY2FzZSB3ZSBuZWVkIHRvXG4jIHJlY29tcGlsZSBpdCBsYXRlci4gV2UgbWlnaHQgbmVlZCB0byByZWNvbXBpbGUgaWYgdGhlIGZpcnN0IGNvbXBpbGF0aW9uXG4jIGRpZG7igJl0IGNyZWF0ZSBhIHNvdXJjZSBtYXAgKGZhc3RlcikgYnV0IHNvbWV0aGluZyB3ZW50IHdyb25nIGFuZCB3ZSBuZWVkXG4jIGEgc3RhY2sgdHJhY2UuIEFzc3VtaW5nIHRoYXQgbW9zdCBvZiB0aGUgdGltZSwgY29kZSBpc27igJl0IHRocm93aW5nXG4jIGV4Y2VwdGlvbnMsIGl04oCZcyBwcm9iYWJseSBtb3JlIGVmZmljaWVudCB0byBjb21waWxlIHR3aWNlIG9ubHkgd2hlbiB3ZVxuIyBuZWVkIGEgc3RhY2sgdHJhY2UsIHJhdGhlciB0aGFuIGFsd2F5cyBnZW5lcmF0aW5nIGEgc291cmNlIG1hcCBldmVuIHdoZW5cbiMgaXTigJlzIG5vdCBsaWtlbHkgdG8gYmUgdXNlZC4gU2F2ZSBpbiBmb3JtIG9mIGBmaWxlbmFtZWA6IGAoc291cmNlKWBcblxuc291cmNlcyA9IHt9XG5cbiMgQWxzbyBzYXZlIHNvdXJjZSBtYXBzIGlmIGdlbmVyYXRlZCwgaW4gZm9ybSBvZiBgZmlsZW5hbWVgOiBgKHNvdXJjZSBtYXApYC5cblxuc291cmNlTWFwcyA9IHt9XG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG5cbiMgQ29tcGlsZSBrb2ZmZWUgdG8gSmF2YVNjcmlwdCwgdXNpbmcgdGhlIEppc29uIGNvbXBpbGVyLlxuI1xuIyBJZiBgb3B0aW9ucy5zb3VyY2VNYXBgIGlzIHNwZWNpZmllZCwgdGhlbiBgb3B0aW9ucy5maWxlbmFtZWAgbXVzdCBhbHNvIGJlIHNwZWNpZmllZC4gXG4jIEFsbCBvcHRpb25zIHRoYXQgY2FuIGJlIHBhc3NlZCB0byBgU291cmNlTWFwI2dlbmVyYXRlYCBtYXkgYWxzbyBiZSBwYXNzZWQgaGVyZS5cbiNcbiMgVGhpcyByZXR1cm5zIGEgamF2YXNjcmlwdCBzdHJpbmcsIHVubGVzcyBgb3B0aW9ucy5zb3VyY2VNYXBgIGlzIHBhc3NlZCwgaW4gd2hpY2ggY2FzZSBpdCByZXR1cm5zIGEgYHtqcywgdjNTb3VyY2VNYXAsIHNvdXJjZU1hcH1gIG9iamVjdFxuXG5leHBvcnRzLmNvbXBpbGUgPSBjb21waWxlID0gd2l0aFByZXR0eUVycm9ycyAoY29kZSwgb3B0aW9ucykgLT5cbiAgICBcbiAgICB7IG1lcmdlLCBleHRlbmQgfSA9IGhlbHBlcnNcbiAgICBcbiAgICBvcHRpb25zID0gaW5qZWN0RmVhdHVyZSBvcHRpb25zXG4gICAgb3B0aW9ucyA9IGluamVjdE1ldGEgICAgb3B0aW9uc1xuICAgICAgICBcbiAgICAjIEFsd2F5cyBnZW5lcmF0ZSBhIHNvdXJjZSBtYXAgaWYgbm8gZmlsZW5hbWUgaXMgcGFzc2VkIGluLCBzaW5jZSB3aXRob3V0IGFcbiAgICAjIGEgZmlsZW5hbWUgd2UgaGF2ZSBubyB3YXkgdG8gcmV0cmlldmUgdGhpcyBzb3VyY2UgbGF0ZXIgaW4gdGhlIGV2ZW50IHRoYXRcbiAgICAjIHdlIG5lZWQgdG8gcmVjb21waWxlIGl0IHRvIGdldCBhIHNvdXJjZSBtYXAgZm9yIGBwcmVwYXJlU3RhY2tUcmFjZWAuXG4gICAgICAgIFxuICAgIGdlbmVyYXRlU291cmNlTWFwID0gb3B0aW9ucy5zb3VyY2VNYXAgb3Igb3B0aW9ucy5pbmxpbmVNYXAgb3Igbm90IG9wdGlvbnMuZmlsZW5hbWU/XG4gICAgZmlsZW5hbWUgPSBvcHRpb25zLmZpbGVuYW1lIG9yICc8YW5vbnltb3VzPidcblxuICAgIHNvdXJjZXNbZmlsZW5hbWVdID0gY29kZVxuICAgIG1hcCA9IG5ldyBTb3VyY2VNYXAgaWYgZ2VuZXJhdGVTb3VyY2VNYXBcblxuICAgIHRva2VucyA9IGxleGVyLnRva2VuaXplIGNvZGUsIG9wdGlvbnNcblxuICAgICMgUGFzcyBhIGxpc3Qgb2YgcmVmZXJlbmNlZCB2YXJpYWJsZXMsIHNvIHRoYXQgZ2VuZXJhdGVkIHZhcmlhYmxlcyB3b24ndCBnZXQgdGhlIHNhbWUgbmFtZS5cbiAgICBcbiAgICBvcHRpb25zLnJlZmVyZW5jZWRWYXJzID0gKCB0b2tlblsxXSBmb3IgdG9rZW4gaW4gdG9rZW5zIHdoZW4gdG9rZW5bMF0gaXMgJ0lERU5USUZJRVInIClcblxuICAgICMgQ2hlY2sgZm9yIGltcG9ydCBvciBleHBvcnQ7IGlmIGZvdW5kLCBmb3JjZSBiYXJlIG1vZGUuXG4gICAgICAgIFxuICAgIGlmIG5vdCBvcHRpb25zLmJhcmVcbiAgICAgICAgZm9yIHRva2VuIGluIHRva2Vuc1xuICAgICAgICAgICAgaWYgdG9rZW5bMF0gaW4gWydJTVBPUlQnICdFWFBPUlQnXVxuICAgICAgICAgICAgICAgIG9wdGlvbnMuYmFyZSA9IHllc1xuICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICBmcmFnbWVudHMgPSBwYXJzZXIucGFyc2UodG9rZW5zKS5jb21waWxlVG9GcmFnbWVudHMgb3B0aW9uc1xuXG4gICAgY3VycmVudExpbmUgPSAwXG4gICAgY3VycmVudExpbmUgKz0gMSBpZiBoYXNGZWF0dXJlIG9wdGlvbnMsICdoZWFkZXInXG4gICAgY3VycmVudENvbHVtbiA9IDBcbiAgICBqcyA9IFwiXCJcbiAgICBcbiAgICAjIGxvZyAnZnJhZ21lbnRzJywgc3RyaW5naWZ5IGZyYWdtZW50c1xuICAgIFxuICAgIGZvciBmcmFnbWVudCBpbiBmcmFnbWVudHNcbiAgICAgICAgIyBVcGRhdGUgdGhlIHNvdXJjZW1hcCB3aXRoIGRhdGEgZnJvbSBlYWNoIGZyYWdtZW50LlxuICAgICAgICBpZiBnZW5lcmF0ZVNvdXJjZU1hcFxuICAgICAgICAgICAgIyBEbyBub3QgaW5jbHVkZSBlbXB0eSwgd2hpdGVzcGFjZSwgb3Igc2VtaWNvbG9uLW9ubHkgZnJhZ21lbnRzLlxuICAgICAgICAgICAgaWYgZnJhZ21lbnQubG9jYXRpb25EYXRhIGFuZCBub3QgL15bO1xcc10qJC8udGVzdCBmcmFnbWVudC5jb2RlXG4gICAgICAgICAgICAgICAgbWFwLmFkZChcbiAgICAgICAgICAgICAgICAgICAgW2ZyYWdtZW50LmxvY2F0aW9uRGF0YS5maXJzdF9saW5lLCBmcmFnbWVudC5sb2NhdGlvbkRhdGEuZmlyc3RfY29sdW1uXVxuICAgICAgICAgICAgICAgICAgICBbY3VycmVudExpbmUsIGN1cnJlbnRDb2x1bW5dXG4gICAgICAgICAgICAgICAgICAgIHtub1JlcGxhY2U6IHRydWV9KVxuICAgICAgICAgICAgaWYgbm90IGZyYWdtZW50LmNvZGU/XG4gICAgICAgICAgICAgICAgbG9nICdnZW5lcmF0ZVNvdXJjZU1hcCcsIHN0cmluZ2lmeSBmcmFnbWVudFxuICAgICAgICAgICAgbmV3TGluZXMgPSBjb3VudCBmcmFnbWVudC5jb2RlLCBcIlxcblwiXG4gICAgICAgICAgICBjdXJyZW50TGluZSArPSBuZXdMaW5lc1xuICAgICAgICAgICAgaWYgbmV3TGluZXNcbiAgICAgICAgICAgICAgICBjdXJyZW50Q29sdW1uID0gZnJhZ21lbnQuY29kZS5sZW5ndGggLSAoZnJhZ21lbnQuY29kZS5sYXN0SW5kZXhPZihcIlxcblwiKSArIDEpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgY3VycmVudENvbHVtbiArPSBmcmFnbWVudC5jb2RlLmxlbmd0aFxuXG4gICAgICAgICMgQ29weSB0aGUgY29kZSBmcm9tIGVhY2ggZnJhZ21lbnQgaW50byB0aGUgZmluYWwgSmF2YVNjcmlwdC5cbiAgICAgICAganMgKz0gZnJhZ21lbnQuY29kZVxuXG4gICAgaWYgaGFzRmVhdHVyZSBvcHRpb25zLCAnaGVhZGVyJ1xuICAgICAgICBoZWFkZXIgPSBcImtvZmZlZSAje0BWRVJTSU9OfVwiXG4gICAgICAgIGpzID0gXCIvLyAje2hlYWRlcn1cXG4je2pzfVwiXG5cbiAgICBpZiBnZW5lcmF0ZVNvdXJjZU1hcFxuICAgICAgICB2M1NvdXJjZU1hcCA9IG1hcC5nZW5lcmF0ZShvcHRpb25zLCBjb2RlKVxuICAgICAgICBzb3VyY2VNYXBzW2ZpbGVuYW1lXSA9IG1hcFxuXG4gICAgaWYgb3B0aW9ucy5pbmxpbmVNYXBcbiAgICAgICAgZW5jb2RlZCA9IGJhc2U2NGVuY29kZSBKU09OLnN0cmluZ2lmeSB2M1NvdXJjZU1hcFxuICAgICAgICBzb3VyY2VNYXBEYXRhVVJJID0gXCIvLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LCN7ZW5jb2RlZH1cIlxuICAgICAgICBzb3VyY2VVUkwgPSBcIi8vIyBzb3VyY2VVUkw9I3tvcHRpb25zLmZpbGVuYW1lID8gJ2tvZmZlZSd9XCJcbiAgICAgICAganMgPSBcIiN7anN9XFxuI3tzb3VyY2VNYXBEYXRhVVJJfVxcbiN7c291cmNlVVJMfVwiXG5cbiAgICBpZiBvcHRpb25zLnNvdXJjZU1hcFxuICAgICAgICB7XG4gICAgICAgICAgICBqc1xuICAgICAgICAgICAgc291cmNlTWFwOiBtYXBcbiAgICAgICAgICAgIHYzU291cmNlTWFwOiBKU09OLnN0cmluZ2lmeSB2M1NvdXJjZU1hcCwgbnVsbCwgMlxuICAgICAgICB9XG4gICAgZWxzZVxuICAgICAgICBqc1xuICAgICAgICBcbiMgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMDAwMDAgICBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgICAwMDAgIFxuIyAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG5cbiMgVG9rZW5pemUgYSBzdHJpbmcgb2Yga29mZmVlIGNvZGUsIGFuZCByZXR1cm4gdGhlIGFycmF5IG9mIHRva2Vucy5cblxuZXhwb3J0cy50b2tlbnMgPSB3aXRoUHJldHR5RXJyb3JzIChjb2RlLCBvcHRpb25zKSAtPiBsZXhlci50b2tlbml6ZSBjb2RlLCBvcHRpb25zXG5cbiMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiMgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICBcblxuIyBQYXJzZSBhIHN0cmluZyBvZiBLb2ZmZWUgY29kZSBvciBhbiBhcnJheSBvZiBsZXhlZCB0b2tlbnMsIGFuZCByZXR1cm4gdGhlIEFTVC4gXG4jIFlvdSBjYW4gdGhlbiBjb21waWxlIGl0IGJ5IGNhbGxpbmcgYC5jb21waWxlKClgIG9uIHRoZSByb290LCBvciB0cmF2ZXJzZSBpdCBieSB1c2luZyBgLnRyYXZlcnNlQ2hpbGRyZW4oKWAgd2l0aCBhIGNhbGxiYWNrLlxuXG5leHBvcnRzLm5vZGVzID0gd2l0aFByZXR0eUVycm9ycyAoc291cmNlLCBvcHRpb25zKSAtPlxuICAgIFxuICAgIGlmIHR5cGVvZiBzb3VyY2UgaXMgJ3N0cmluZydcbiAgICAgICAgcGFyc2VyLnBhcnNlIGxleGVyLnRva2VuaXplIHNvdXJjZSwgb3B0aW9uc1xuICAgIGVsc2VcbiAgICAgICAgcGFyc2VyLnBhcnNlIHNvdXJjZVxuXG4jIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiMgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcblxuIyBDb21waWxlIGFuZCBleGVjdXRlIGEgc3RyaW5nIG9mIGtvZmZlZSwgY29ycmVjdGx5IHNldHRpbmcgYF9fZmlsZW5hbWVgLCBgX19kaXJuYW1lYCwgYW5kIHJlbGF0aXZlIGByZXF1aXJlKClgLlxuXG5leHBvcnRzLnJ1biA9IChjb2RlLCBvcHRpb25zID0ge30pIC0+XG4gICAgXG4gICAgb3B0aW9ucyA9IGluamVjdEZlYXR1cmUgb3B0aW9uc1xuICAgIG9wdGlvbnMgPSBpbmplY3RNZXRhICAgIG9wdGlvbnNcbiAgICBcbiAgICBtYWluTW9kdWxlID0gcmVxdWlyZS5tYWluXG5cbiAgICAjIFNldCB0aGUgZmlsZW5hbWVcbiAgICBcbiAgICBtYWluTW9kdWxlLmZpbGVuYW1lID0gcHJvY2Vzcy5hcmd2WzFdID1cbiAgICAgICAgaWYgb3B0aW9ucy5maWxlbmFtZSB0aGVuIGZzLnJlYWxwYXRoU3luYyhvcHRpb25zLmZpbGVuYW1lKSBlbHNlICc8YW5vbnltb3VzPidcblxuICAgIG1haW5Nb2R1bGUubW9kdWxlQ2FjaGUgYW5kPSB7fSAjIENsZWFyIHRoZSBtb2R1bGUgY2FjaGUuXG5cbiAgICAjIEFzc2lnbiBwYXRocyBmb3Igbm9kZV9tb2R1bGVzIGxvYWRpbmdcbiAgICAgICAgXG4gICAgZGlyID0gaWYgb3B0aW9ucy5maWxlbmFtZT9cbiAgICAgICAgcGF0aC5kaXJuYW1lIGZzLnJlYWxwYXRoU3luYyBvcHRpb25zLmZpbGVuYW1lXG4gICAgZWxzZVxuICAgICAgICBmcy5yZWFscGF0aFN5bmMgJy4nXG4gICAgbWFpbk1vZHVsZS5wYXRocyA9IHJlcXVpcmUoJ21vZHVsZScpLl9ub2RlTW9kdWxlUGF0aHMgZGlyXG5cbiAgICAjIENvbXBpbGVcbiAgICBcbiAgICBpZiBub3QgaXNDb2ZmZWUobWFpbk1vZHVsZS5maWxlbmFtZSkgb3IgcmVxdWlyZS5leHRlbnNpb25zXG4gICAgICAgIGFuc3dlciA9IGNvbXBpbGUgY29kZSwgb3B0aW9uc1xuICAgICAgICBjb2RlID0gYW5zd2VyLmpzID8gYW5zd2VyXG5cbiAgICAjIGxvZyAnS29mZmVlLnJ1biBtYWluTW9kdWxlLl9jb21waWxlJywgbWFpbk1vZHVsZS5maWxlbmFtZSwgb3B0aW9ucyBpZiBvcHRpb25zLkRlYnVnXG4gICAgICAgIFxuICAgIG1haW5Nb2R1bGUuX2NvbXBpbGUgY29kZSwgbWFpbk1vZHVsZS5maWxlbmFtZVxuXG4jIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgXG4jIDAwMDAwMDAgICAgMDAwIDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgICAgXG4jIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgXG4jIDAwMDAwMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgXG5cbiMgQ29tcGlsZSBhbmQgZXZhbHVhdGUgYSBzdHJpbmcgaW4gYSBOb2RlLmpzLWxpa2UgZW52aXJvbm1lbnQuIFRoZSBSRVBMIHVzZXMgdGhpcyB0byBydW4gdGhlIGlucHV0LlxuXG5leHBvcnRzLmV2YWwgPSAoY29kZSwgb3B0aW9ucz17fSkgLT5cbiAgICBcbiAgICByZXR1cm4gdW5sZXNzIGNvZGUgPSBjb2RlLnRyaW0oKVxuICAgIFxuICAgICMgY3JlYXRlQ29udGV4dCA9IHZtLlNjcmlwdC5jcmVhdGVDb250ZXh0ID8gdm0uY3JlYXRlQ29udGV4dFxuICAgIGNyZWF0ZUNvbnRleHQgPSB2bS5jcmVhdGVDb250ZXh0XG5cbiAgICBpc0NvbnRleHQgPSB2bS5pc0NvbnRleHQgPyAoY3R4KSAtPlxuICAgICAgICBvcHRpb25zLnNhbmRib3ggaW5zdGFuY2VvZiBjcmVhdGVDb250ZXh0KCkuY29uc3RydWN0b3JcblxuICAgIGlmIGNyZWF0ZUNvbnRleHRcbiAgICAgICAgaWYgb3B0aW9ucy5zYW5kYm94P1xuICAgICAgICAgICAgaWYgaXNDb250ZXh0IG9wdGlvbnMuc2FuZGJveFxuICAgICAgICAgICAgICAgIHNhbmRib3ggPSBvcHRpb25zLnNhbmRib3hcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBzYW5kYm94ID0gY3JlYXRlQ29udGV4dCgpXG4gICAgICAgICAgICAgICAgc2FuZGJveFtrXSA9IHYgZm9yIG93biBrLCB2IG9mIG9wdGlvbnMuc2FuZGJveFxuICAgICAgICAgICAgc2FuZGJveC5nbG9iYWwgPSBzYW5kYm94LnJvb3QgPSBzYW5kYm94LkdMT0JBTCA9IHNhbmRib3hcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgc2FuZGJveCA9IGdsb2JhbFxuICAgICAgICBzYW5kYm94Ll9fZmlsZW5hbWUgPSBvcHRpb25zLmZpbGVuYW1lIHx8ICdldmFsJ1xuICAgICAgICBzYW5kYm94Ll9fZGlybmFtZSAgPSBwYXRoLmRpcm5hbWUgc2FuZGJveC5fX2ZpbGVuYW1lXG4gICAgICAgICMgZGVmaW5lIG1vZHVsZS9yZXF1aXJlIG9ubHkgaWYgdGhleSBjaG9zZSBub3QgdG8gc3BlY2lmeSB0aGVpciBvd25cbiAgICAgICAgdW5sZXNzIHNhbmRib3ggIT0gZ2xvYmFsIG9yIHNhbmRib3gubW9kdWxlIG9yIHNhbmRib3gucmVxdWlyZVxuICAgICAgICAgICAgTW9kdWxlID0gcmVxdWlyZSAnbW9kdWxlJ1xuICAgICAgICAgICAgc2FuZGJveC5tb2R1bGUgID0gX21vZHVsZSAgPSBuZXcgTW9kdWxlKG9wdGlvbnMubW9kdWxlbmFtZSB8fCAnZXZhbCcpXG4gICAgICAgICAgICBzYW5kYm94LnJlcXVpcmUgPSBfcmVxdWlyZSA9IChwYXRoKSAtPiAgTW9kdWxlLl9sb2FkIHBhdGgsIF9tb2R1bGUsIHRydWVcbiAgICAgICAgICAgIF9tb2R1bGUuZmlsZW5hbWUgPSBzYW5kYm94Ll9fZmlsZW5hbWVcbiAgICAgICAgICAgIGZvciByIGluIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzIHJlcXVpcmUgd2hlbiByIG5vdCBpbiBbJ3BhdGhzJyAnYXJndW1lbnRzJyAnY2FsbGVyJ11cbiAgICAgICAgICAgICAgICBfcmVxdWlyZVtyXSA9IHJlcXVpcmVbcl1cbiAgICAgICAgICAgICMgdXNlIHRoZSBzYW1lIGhhY2sgbm9kZSBjdXJyZW50bHkgdXNlcyBmb3IgdGhlaXIgb3duIFJFUExcbiAgICAgICAgICAgIF9yZXF1aXJlLnBhdGhzID0gX21vZHVsZS5wYXRocyA9IE1vZHVsZS5fbm9kZU1vZHVsZVBhdGhzIHByb2Nlc3MuY3dkKClcbiAgICAgICAgICAgIF9yZXF1aXJlLnJlc29sdmUgPSAocmVxdWVzdCkgLT4gTW9kdWxlLl9yZXNvbHZlRmlsZW5hbWUgcmVxdWVzdCwgX21vZHVsZVxuICAgIG8gPSB7fVxuICAgIG9ba10gPSB2IGZvciBvd24gaywgdiBvZiBvcHRpb25zXG4gICAgby5iYXJlID0geWVzICMgZW5zdXJlIHJldHVybiB2YWx1ZVxuICAgIGpzID0gY29tcGlsZSBjb2RlLCBvXG4gICAgaWYgc2FuZGJveCBpcyBnbG9iYWxcbiAgICAgICAgdm0ucnVuSW5UaGlzQ29udGV4dCBqc1xuICAgIGVsc2VcbiAgICAgICAgdm0ucnVuSW5Db250ZXh0IGpzLCBzYW5kYm94XG5cbiMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG5cbmV4cG9ydHMucmVnaXN0ZXIgPSAtPiByZXF1aXJlICcuL3JlZ2lzdGVyJ1xuXG5leHBvcnRzLl9jb21waWxlRmlsZSA9IChmaWxlbmFtZSwgc291cmNlTWFwID0gbm8sIGlubGluZU1hcCA9IG5vKSAtPlxuICAgIFxuICAgIHJhdyA9IGZzLnJlYWRGaWxlU3luYyBmaWxlbmFtZSwgJ3V0ZjgnXG4gICAgIyBTdHJpcCB0aGUgVW5pY29kZSBieXRlIG9yZGVyIG1hcmssIGlmIHRoaXMgZmlsZSBiZWdpbnMgd2l0aCBvbmUuXG4gICAgc3RyaXBwZWQgPSBpZiByYXcuY2hhckNvZGVBdCgwKSBpcyAweEZFRkYgdGhlbiByYXcuc3Vic3RyaW5nIDEgZWxzZSByYXdcblxuICAgIHRyeVxuICAgICAgICBhbnN3ZXIgPSBjb21waWxlIHN0cmlwcGVkLCB7XG4gICAgICAgICAgICBmaWxlbmFtZSwgc291cmNlTWFwLCBpbmxpbmVNYXBcbiAgICAgICAgICAgIHNvdXJjZUZpbGVzOiBbZmlsZW5hbWVdXG4gICAgICAgIH1cbiAgICBjYXRjaCBlcnJcbiAgICAgICAgIyBBcyB0aGUgZmlsZW5hbWUgYW5kIGNvZGUgb2YgYSBkeW5hbWljYWxseSBsb2FkZWQgZmlsZSB3aWxsIGJlIGRpZmZlcmVudFxuICAgICAgICAjIGZyb20gdGhlIG9yaWdpbmFsIGZpbGUgY29tcGlsZWQgd2l0aCBLb2ZmZWUucnVuLCBhZGQgdGhhdFxuICAgICAgICAjIGluZm9ybWF0aW9uIHRvIGVycm9yIHNvIGl0IGNhbiBiZSBwcmV0dHktcHJpbnRlZCBsYXRlci5cbiAgICAgICAgdGhyb3cgdXBkYXRlU3ludGF4RXJyb3IgZXJyLCBzdHJpcHBlZCwgZmlsZW5hbWVcblxuICAgIGFuc3dlclxuXG4jIDAwMCAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuIyAwMDAgICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwICAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4jIDAwMCAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuIyAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcblxubGV4ZXIgPSBuZXcgTGV4ZXIgIyBJbnN0YW50aWF0ZSBhIExleGVyIGZvciBvdXIgdXNlIGhlcmUuXG5cbiMgVGhlIHJlYWwgTGV4ZXIgcHJvZHVjZXMgYSBnZW5lcmljIHN0cmVhbSBvZiB0b2tlbnMuIFRoaXMgb2JqZWN0IHByb3ZpZGVzIGFcbiMgdGhpbiB3cmFwcGVyIGFyb3VuZCBpdCwgY29tcGF0aWJsZSB3aXRoIHRoZSBKaXNvbiBBUEkuIFdlIGNhbiB0aGVuIHBhc3MgaXRcbiMgZGlyZWN0bHkgYXMgYSBcIkppc29uIGxleGVyXCIuXG5cbnBhcnNlci5sZXhlciA9XG4gICAgXG4gICAgbGV4OiAtPlxuICAgICAgICB0b2tlbiA9IHBhcnNlci50b2tlbnNbQHBvcysrXVxuICAgICAgICBpZiB0b2tlblxuICAgICAgICAgICAgW3RhZywgQHl5dGV4dCwgQHl5bGxvY10gPSB0b2tlblxuICAgICAgICAgICAgcGFyc2VyLmVycm9yVG9rZW4gPSB0b2tlbi5vcmlnaW4gb3IgdG9rZW5cbiAgICAgICAgICAgIGVycm9yICdEQUZVSycsIHRva2VuIGlmIG5vdCBAeXlsbG9jPy5maXJzdF9saW5lP1xuICAgICAgICAgICAgQHl5bGluZW5vID0gQHl5bGxvYy5maXJzdF9saW5lXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHRhZyA9ICcnXG4gICAgICAgIHRhZ1xuICAgIHNldElucHV0OiAodG9rZW5zKSAtPlxuICAgICAgICBwYXJzZXIudG9rZW5zID0gdG9rZW5zXG4gICAgICAgIEBwb3MgPSAwXG4gICAgdXBjb21pbmdJbnB1dDogLT5cbiAgICAgICAgXCJcIlxuICAgICAgICBcbnBhcnNlci55eSA9IHJlcXVpcmUgJy4vbm9kZXMnICMgTWFrZSBhbGwgdGhlIEFTVCBub2RlcyB2aXNpYmxlIHRvIHRoZSBwYXJzZXIuXG5cbnBhcnNlci55eS5wYXJzZUVycm9yID0gKG1lc3NhZ2UsIHt0b2tlbn0pIC0+ICMgT3ZlcnJpZGUgSmlzb24ncyBkZWZhdWx0IGVycm9yIGhhbmRsaW5nIGZ1bmN0aW9uLlxuICAgIFxuICAgICMgRGlzcmVnYXJkIEppc29uJ3MgbWVzc2FnZSwgaXQgY29udGFpbnMgcmVkdW5kYW50IGxpbmUgbnVtYmVyIGluZm9ybWF0aW9uLlxuICAgICMgRGlzcmVnYXJkIHRoZSB0b2tlbiwgd2UgdGFrZSBpdHMgdmFsdWUgZGlyZWN0bHkgZnJvbSB0aGUgbGV4ZXIgaW4gY2FzZVxuICAgICMgdGhlIGVycm9yIGlzIGNhdXNlZCBieSBhIGdlbmVyYXRlZCB0b2tlbiB3aGljaCBtaWdodCByZWZlciB0byBpdHMgb3JpZ2luLlxuICAgIFxuICAgIHtlcnJvclRva2VuLCB0b2tlbnN9ID0gcGFyc2VyXG4gICAgW2Vycm9yVGFnLCBlcnJvclRleHQsIGVycm9yTG9jXSA9IGVycm9yVG9rZW5cblxuICAgIGVycm9yVGV4dCA9IHN3aXRjaFxuICAgICAgICB3aGVuIGVycm9yVG9rZW4gaXMgdG9rZW5zW3Rva2Vucy5sZW5ndGggLSAxXVxuICAgICAgICAgICAgJ2VuZCBvZiBpbnB1dCdcbiAgICAgICAgd2hlbiBlcnJvclRhZyBpbiBbJ0lOREVOVCcgJ09VVERFTlQnXVxuICAgICAgICAgICAgJ2luZGVudGF0aW9uJ1xuICAgICAgICB3aGVuIGVycm9yVGFnIGluIFsnSURFTlRJRklFUicgJ05VTUJFUicgJ0lORklOSVRZJyAnU1RSSU5HJyAnU1RSSU5HX1NUQVJUJyAnUkVHRVgnICdSRUdFWF9TVEFSVCddXG4gICAgICAgICAgICBlcnJvclRhZy5yZXBsYWNlKC9fU1RBUlQkLywgJycpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbmFtZVdoaXRlc3BhY2VDaGFyYWN0ZXIgZXJyb3JUZXh0XG5cbiAgICAjIFRoZSBzZWNvbmQgYXJndW1lbnQgaGFzIGEgYGxvY2AgcHJvcGVydHksIHdoaWNoIHNob3VsZCBoYXZlIHRoZSBsb2NhdGlvbiBkYXRhIGZvciB0aGlzIHRva2VuLiBcbiAgICAjIFVuZm9ydHVuYXRlbHksIEppc29uIHNlZW1zIHRvIHNlbmQgYW4gb3V0ZGF0ZWQgYGxvY2AgKGZyb20gdGhlIHByZXZpb3VzIHRva2VuKSwgXG4gICAgIyBzbyB3ZSB0YWtlIHRoZSBsb2NhdGlvbiBpbmZvcm1hdGlvbiBkaXJlY3RseSBmcm9tIHRoZSBsZXhlci5cbiAgICBcbiAgICB0aHJvd1N5bnRheEVycm9yIFwidW5leHBlY3RlZCAje2Vycm9yVGV4dH1cIiwgZXJyb3JMb2NcblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiMgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG5cbmdldFNvdXJjZU1hcCA9IChmaWxlbmFtZSkgLT5cbiAgICAgXG4gICAgIyBLb2ZmZWUgY29tcGlsZWQgaW4gYSBicm93c2VyIG1heSBnZXQgY29tcGlsZWQgd2l0aCBgb3B0aW9ucy5maWxlbmFtZWAgb2YgYDxhbm9ueW1vdXM+YCwgXG4gICAgIyBidXQgdGhlIGJyb3dzZXIgbWF5IHJlcXVlc3QgdGhlIHN0YWNrIHRyYWNlIHdpdGggdGhlIGZpbGVuYW1lIG9mIHRoZSBzY3JpcHQgZmlsZS5cbiAgICBcbiAgICBpZiBzb3VyY2VNYXBzW2ZpbGVuYW1lXT9cbiAgICAgICAgc291cmNlTWFwc1tmaWxlbmFtZV1cbiAgICBlbHNlIGlmIHNvdXJjZU1hcHNbJzxhbm9ueW1vdXM+J10/XG4gICAgICAgIHNvdXJjZU1hcHNbJzxhbm9ueW1vdXM+J11cbiAgICBlbHNlIGlmIHNvdXJjZXNbZmlsZW5hbWVdP1xuICAgICAgICBhbnN3ZXIgPSBjb21waWxlIHNvdXJjZXNbZmlsZW5hbWVdLFxuICAgICAgICAgICAgZmlsZW5hbWU6IGZpbGVuYW1lXG4gICAgICAgICAgICBzb3VyY2VNYXA6IHllc1xuICAgICAgICBhbnN3ZXIuc291cmNlTWFwXG4gICAgZWxzZVxuICAgICAgICBudWxsXG5cbiMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgICAgMDAwICAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICBcbiMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG5cbiMgQmFzZWQgb24gW21pY2hhZWxmaWNhcnJhL0tvZmZlZVJlZHV4XShodHRwOi8vZ29vLmdsL1pUeDFwKVxuIyBOb2RlSlMgLyBWOCBoYXZlIG5vIHN1cHBvcnQgZm9yIHRyYW5zZm9ybWluZyBwb3NpdGlvbnMgaW4gc3RhY2sgdHJhY2VzIHVzaW5nXG4jIHNvdXJjZU1hcCwgc28gd2UgbXVzdCBtb25rZXktcGF0Y2ggRXJyb3IgdG8gZGlzcGxheSBLb2ZmZWUgc291cmNlIHBvc2l0aW9ucy5cblxuRXJyb3IucHJlcGFyZVN0YWNrVHJhY2UgPSAoZXJyLCBzdGFjaykgLT5cbiAgICBcbiAgICBnZXRTb3VyY2VNYXBwaW5nID0gKGZpbGVuYW1lLCBsaW5lLCBjb2x1bW4pIC0+XG4gICAgICAgIHNvdXJjZU1hcCA9IGdldFNvdXJjZU1hcCBmaWxlbmFtZVxuICAgICAgICBhbnN3ZXIgPSBzb3VyY2VNYXAuc291cmNlTG9jYXRpb24gW2xpbmUgLSAxLCBjb2x1bW4gLSAxXSBpZiBzb3VyY2VNYXA/XG4gICAgICAgIGlmIGFuc3dlcj8gdGhlbiBbYW5zd2VyWzBdICsgMSwgYW5zd2VyWzFdICsgMV0gZWxzZSBudWxsXG5cbiAgICBmcmFtZXMgPSBmb3IgZnJhbWUgaW4gc3RhY2tcbiAgICAgICAgYnJlYWsgaWYgZnJhbWUuZ2V0RnVuY3Rpb24oKSBpcyBleHBvcnRzLnJ1blxuICAgICAgICBcIiAgICAgICAgYXQgI3tmb3JtYXRTb3VyY2VQb3NpdGlvbiBmcmFtZSwgZ2V0U291cmNlTWFwcGluZ31cIlxuXG4gICAgXCIje2Vyci50b1N0cmluZygpfVxcbiN7ZnJhbWVzLmpvaW4gJ1xcbid9XFxuXCJcbiAgICBcbiMgQmFzZWQgb24gaHR0cDovL3Y4Lmdvb2dsZWNvZGUuY29tL3N2bi9icmFuY2hlcy9ibGVlZGluZ19lZGdlL3NyYy9tZXNzYWdlcy5qc1xuIyBNb2RpZmllZCB0byBoYW5kbGUgc291cmNlTWFwXG5cbmZvcm1hdFNvdXJjZVBvc2l0aW9uID0gKGZyYW1lLCBnZXRTb3VyY2VNYXBwaW5nKSAtPlxuICAgIFxuICAgIGZpbGVuYW1lID0gdW5kZWZpbmVkXG4gICAgZmlsZUxvY2F0aW9uID0gJydcblxuICAgIGlmIGZyYW1lLmlzTmF0aXZlKClcbiAgICAgICAgZmlsZUxvY2F0aW9uID0gXCJuYXRpdmVcIlxuICAgIGVsc2VcbiAgICAgICAgaWYgZnJhbWUuaXNFdmFsKClcbiAgICAgICAgICAgIGZpbGVuYW1lID0gZnJhbWUuZ2V0U2NyaXB0TmFtZU9yU291cmNlVVJMKClcbiAgICAgICAgICAgIGZpbGVMb2NhdGlvbiA9IFwiI3tmcmFtZS5nZXRFdmFsT3JpZ2luKCl9LCBcIiB1bmxlc3MgZmlsZW5hbWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZmlsZW5hbWUgPSBmcmFtZS5nZXRGaWxlTmFtZSgpXG5cbiAgICAgICAgZmlsZW5hbWUgb3I9IFwiPGFub255bW91cz5cIlxuXG4gICAgICAgIGxpbmUgPSBmcmFtZS5nZXRMaW5lTnVtYmVyKClcbiAgICAgICAgY29sdW1uID0gZnJhbWUuZ2V0Q29sdW1uTnVtYmVyKClcblxuICAgICAgICAjIENoZWNrIGZvciBhIHNvdXJjZU1hcCBwb3NpdGlvblxuICAgICAgICBzb3VyY2UgPSBnZXRTb3VyY2VNYXBwaW5nIGZpbGVuYW1lLCBsaW5lLCBjb2x1bW5cbiAgICAgICAgZmlsZUxvY2F0aW9uID1cbiAgICAgICAgICAgIGlmIHNvdXJjZVxuICAgICAgICAgICAgICAgIFwiI3tmaWxlbmFtZX06I3tzb3VyY2VbMF19OiN7c291cmNlWzFdfVwiXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgXCIje2ZpbGVuYW1lfToje2xpbmV9OiN7Y29sdW1ufVwiXG5cbiAgICBmdW5jdGlvbk5hbWUgPSBmcmFtZS5nZXRGdW5jdGlvbk5hbWUoKVxuICAgIGlzQ29uc3RydWN0b3IgPSBmcmFtZS5pc0NvbnN0cnVjdG9yKClcbiAgICBpc01ldGhvZENhbGwgPSBub3QgKGZyYW1lLmlzVG9wbGV2ZWwoKSBvciBpc0NvbnN0cnVjdG9yKVxuXG4gICAgaWYgaXNNZXRob2RDYWxsXG4gICAgICAgIG1ldGhvZE5hbWUgPSBmcmFtZS5nZXRNZXRob2ROYW1lKClcbiAgICAgICAgdHlwZU5hbWUgPSBmcmFtZS5nZXRUeXBlTmFtZSgpXG5cbiAgICAgICAgaWYgZnVuY3Rpb25OYW1lXG4gICAgICAgICAgICB0cCA9IGFzID0gJydcbiAgICAgICAgICAgIGlmIHR5cGVOYW1lIGFuZCBmdW5jdGlvbk5hbWUuaW5kZXhPZiB0eXBlTmFtZVxuICAgICAgICAgICAgICAgIHRwID0gXCIje3R5cGVOYW1lfS5cIlxuICAgICAgICAgICAgaWYgbWV0aG9kTmFtZSBhbmQgZnVuY3Rpb25OYW1lLmluZGV4T2YoXCIuI3ttZXRob2ROYW1lfVwiKSAhPSBmdW5jdGlvbk5hbWUubGVuZ3RoIC0gbWV0aG9kTmFtZS5sZW5ndGggLSAxXG4gICAgICAgICAgICAgICAgYXMgPSBcIiBbYXMgI3ttZXRob2ROYW1lfV1cIlxuXG4gICAgICAgICAgICBcIiN7dHB9I3tmdW5jdGlvbk5hbWV9I3thc30gKCN7ZmlsZUxvY2F0aW9ufSlcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBcIiN7dHlwZU5hbWV9LiN7bWV0aG9kTmFtZSBvciAnPGFub255bW91cz4nfSAoI3tmaWxlTG9jYXRpb259KVwiXG4gICAgZWxzZSBpZiBpc0NvbnN0cnVjdG9yXG4gICAgICAgIFwibmV3ICN7ZnVuY3Rpb25OYW1lIG9yICc8YW5vbnltb3VzPid9ICgje2ZpbGVMb2NhdGlvbn0pXCJcbiAgICBlbHNlIGlmIGZ1bmN0aW9uTmFtZVxuICAgICAgICBcIiN7ZnVuY3Rpb25OYW1lfSAoI3tmaWxlTG9jYXRpb259KVwiXG4gICAgZWxzZVxuICAgICAgICBmaWxlTG9jYXRpb25cbiAgICBcbiAgICAiXX0=
//# sourceURL=../coffee/koffee.coffee