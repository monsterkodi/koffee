// koffee 0.43.0

/*
000   000   0000000   00000000  00000000  00000000  00000000  
000  000   000   000  000       000       000       000       
0000000    000   000  000000    000000    0000000   0000000   
000  000   000   000  000       000       000       000       
000   000   0000000   000       000       00000000  00000000
 */
var FILE_EXTENSIONS, Lexer, SourceMap, base64encode, compile, count, evaluate, formatSourcePosition, fs, getSourceMap, hasFeature, helpers, injectFeature, injectMeta, isCoffee, lexer, nodes, parser, path, pkg, ref, run, sourceMaps, sources, stringify, throwSyntaxError, tokens, updateSyntaxError, vm,
    hasProp = {}.hasOwnProperty;

fs = require('fs');

vm = require('vm');

path = require('path');

Lexer = require('./lexer').Lexer;

parser = require('./parser').parser;

helpers = require('./helpers');

SourceMap = require('./sourcemap');

pkg = require('../package.json');

injectMeta = require('./meta').injectMeta;

ref = require('./features'), injectFeature = ref.injectFeature, hasFeature = ref.hasFeature;

updateSyntaxError = helpers.updateSyntaxError, throwSyntaxError = helpers.throwSyntaxError, isCoffee = helpers.isCoffee, count = helpers.count, stringify = helpers.stringify;

FILE_EXTENSIONS = ['.coffee', '.koffee'];

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

lexer = new Lexer;

sources = {};

sourceMaps = {};

compile = function(code, options) {
    var currentColumn, currentLine, encoded, extend, filename, fragment, fragments, generateSourceMap, header, i, j, js, len, len1, map, merge, newLines, ref1, ref2, sourceMapDataURI, sourceURL, token, tokens, v3SourceMap;
    merge = helpers.merge, extend = helpers.extend;
    options = injectFeature(options);
    options = injectMeta(options);
    generateSourceMap = options.sourceMap || options.inlineMap || (options.filename == null);
    filename = options.filename || '';
    sources[filename != null ? filename : '?'] = code;
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
            if ((ref1 = token[0]) === 'IMPORT' || ref1 === 'EXPORT') {
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
        sourceMaps[filename != null ? filename : '?'] = map;
    }
    if (options.inlineMap) {
        encoded = base64encode(JSON.stringify(v3SourceMap));
        sourceMapDataURI = "//# sourceMappingURL=data:application/json;base64," + encoded;
        sourceURL = "//# sourceURL=" + ((ref2 = options.filename) != null ? ref2 : 'koffee');
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
};

nodes = function(code, options) {
    if (typeof code === 'string') {
        return parser.parse(lexer.tokenize(code, options));
    } else {
        return parser.parse(code);
    }
};

tokens = function(code, options) {
    var err, ref1, ref2;
    try {
        return lexer.tokenize(code, options);
    } catch (error) {
        err = error;
        if (err instanceof SyntaxError) {
            updateSyntaxError(err, code, (ref1 = (ref2 = options.source) != null ? ref2 : options.filename) != null ? ref1 : '', options);
        }
        throw err;
    }
};

run = function(code, options) {
    var answer, dir, err, mainModule, ref1;
    if (options == null) {
        options = {};
    }
    options = injectFeature(options);
    options = injectMeta(options);
    mainModule = require.main;
    mainModule.filename = process.argv[1] = options.filename ? fs.realpathSync(options.filename) : '';
    mainModule.moduleCache && (mainModule.moduleCache = {});
    dir = options.filename != null ? path.dirname(fs.realpathSync(options.filename)) : fs.realpathSync('.');
    mainModule.paths = require('module')._nodeModulePaths(dir);
    if (!isCoffee(mainModule.filename) || require.extensions) {
        try {
            answer = compile(code, options);
        } catch (error) {
            err = error;
            updateSyntaxError(err, code, mainModule.filename, options);
            throw err;
        }
        code = (ref1 = answer.js) != null ? ref1 : answer;
    }
    return mainModule._compile(code, mainModule.filename);
};

evaluate = function(code, options) {
    var Module, _module, _require, createContext, i, isContext, js, k, len, o, r, ref1, ref2, ref3, sandbox, v;
    if (options == null) {
        options = {};
    }
    if (!(code = code.trim())) {
        return;
    }
    createContext = vm.createContext;
    isContext = (ref1 = vm.isContext) != null ? ref1 : function(ctx) {
        return options.sandbox instanceof createContext().constructor;
    };
    if (createContext) {
        if (options.sandbox != null) {
            if (isContext(options.sandbox)) {
                sandbox = options.sandbox;
            } else {
                sandbox = createContext();
                ref2 = options.sandbox;
                for (k in ref2) {
                    if (!hasProp.call(ref2, k)) continue;
                    v = ref2[k];
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
            ref3 = Object.getOwnPropertyNames(require);
            for (i = 0, len = ref3.length; i < len; i++) {
                r = ref3[i];
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

parser.lexer = {
    lex: function() {
        var ref1, tag, token;
        token = parser.tokens[this.pos++];
        if (token) {
            tag = token[0], this.yytext = token[1], this.yylloc = token[2];
            parser.errorToken = token.origin || token;
            if (!(((ref1 = this.yylloc) != null ? ref1.first_line : void 0) != null)) {
                console.log('[33m[93mkoffee[33m[2m.[22m[2mcoffee[22m[39m[2m[34m:[39m[22m[94m295[39m', '[1m[97m@yylloc?.first_line?[39m[22m');

            };
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
    var errorLoc, errorTag, errorText, errorToken, token;
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
                switch (errorText) {
                    case ' ':
                        return 'space';
                    case '\n':
                        return 'newline';
                    case '\r':
                        return 'carriage return';
                    case '\t':
                        return 'tab';
                    default:
                        return errorText;
                }
        }
    })();
    return throwSyntaxError({
        module: 'koffee',
        message: "unexpected " + errorText,
        location: errorLoc
    });
};

getSourceMap = function(filename) {
    var answer;
    if (sourceMaps[filename] != null) {
        return sourceMaps[filename];
    } else if (sourceMaps['?'] != null) {
        return sourceMaps['?'];
    } else if (sources[filename != null ? filename : '?'] != null) {
        answer = compile(sources[filename != null ? filename : '?'], {
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
        filename || (filename = '');
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

module.exports = {
    FILE_EXTENSIONS: FILE_EXTENSIONS,
    VERSION: pkg.version,
    run: run,
    "eval": evaluate,
    nodes: nodes,
    helpers: helpers,
    compile: compile,
    tokens: tokens,
    register: function() {
        return require('./register');
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia29mZmVlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx1U0FBQTtJQUFBOztBQVVBLEVBQUEsR0FBWSxPQUFBLENBQVEsSUFBUjs7QUFDWixFQUFBLEdBQVksT0FBQSxDQUFRLElBQVI7O0FBQ1osSUFBQSxHQUFZLE9BQUEsQ0FBUSxNQUFSOztBQUNYLFFBQVcsT0FBQSxDQUFRLFNBQVI7O0FBQ1gsU0FBVyxPQUFBLENBQVEsVUFBUjs7QUFDWixPQUFBLEdBQVksT0FBQSxDQUFRLFdBQVI7O0FBQ1osU0FBQSxHQUFZLE9BQUEsQ0FBUSxhQUFSOztBQUNaLEdBQUEsR0FBWSxPQUFBLENBQVEsaUJBQVI7O0FBRVYsYUFBZSxPQUFBLENBQVEsUUFBUjs7QUFDakIsTUFBZ0MsT0FBQSxDQUFRLFlBQVIsQ0FBaEMsRUFBRSxpQ0FBRixFQUFpQjs7QUFDZiw2Q0FBRixFQUFxQiwyQ0FBckIsRUFBdUMsMkJBQXZDLEVBQWlELHFCQUFqRCxFQUF3RDs7QUFFeEQsZUFBQSxHQUFrQixDQUFDLFNBQUQsRUFBVyxTQUFYOztBQUVsQixZQUFBLEdBQWUsU0FBQyxHQUFEO0lBRVgsSUFBRyxPQUFPLE1BQVAsS0FBaUIsVUFBcEI7ZUFDSSxNQUFNLENBQUMsSUFBUCxDQUFZLEdBQVosQ0FBZ0IsQ0FBQyxRQUFqQixDQUEwQixRQUExQixFQURKO0tBQUEsTUFFSyxJQUFHLE9BQU8sSUFBUCxLQUFlLFVBQWxCO2VBS0QsSUFBQSxDQUFLLGtCQUFBLENBQW1CLEdBQW5CLENBQXVCLENBQUMsT0FBeEIsQ0FBZ0MsaUJBQWhDLEVBQW1ELFNBQUMsS0FBRCxFQUFRLEVBQVI7bUJBQ3BELE1BQU0sQ0FBQyxZQUFQLENBQW9CLElBQUEsR0FBTyxFQUEzQjtRQURvRCxDQUFuRCxDQUFMLEVBTEM7S0FBQSxNQUFBO0FBUUQsY0FBTSxJQUFJLEtBQUosQ0FBVSwyQ0FBVixFQVJMOztBQUpNOztB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MCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgXG4wMDAgIDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIFxuMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMCAgICAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbjAwMCAgMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgXG4wMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuIyMjXG5cbiMgVGhpcyBtb2R1bGUgY29udGFpbnMgdGhlIG1haW4gZW50cnkgZnVuY3Rpb25zIGZvciB0b2tlbml6aW5nLCBwYXJzaW5nLCBhbmQgY29tcGlsaW5nIGtvZmZlZSBpbnRvIEphdmFTY3JpcHQuXG5cbmZzICAgICAgICA9IHJlcXVpcmUgJ2ZzJ1xudm0gICAgICAgID0gcmVxdWlyZSAndm0nXG5wYXRoICAgICAgPSByZXF1aXJlICdwYXRoJ1xue0xleGVyfSAgID0gcmVxdWlyZSAnLi9sZXhlcidcbntwYXJzZXJ9ICA9IHJlcXVpcmUgJy4vcGFyc2VyJ1xuaGVscGVycyAgID0gcmVxdWlyZSAnLi9oZWxwZXJzJ1xuU291cmNlTWFwID0gcmVxdWlyZSAnLi9zb3VyY2VtYXAnXG5wa2cgICAgICAgPSByZXF1aXJlICcuLi9wYWNrYWdlLmpzb24nXG5cbnsgaW5qZWN0TWV0YSB9ID0gcmVxdWlyZSAnLi9tZXRhJ1xueyBpbmplY3RGZWF0dXJlLCBoYXNGZWF0dXJlIH0gPSByZXF1aXJlICcuL2ZlYXR1cmVzJ1xueyB1cGRhdGVTeW50YXhFcnJvciwgdGhyb3dTeW50YXhFcnJvciwgaXNDb2ZmZWUsIGNvdW50LCBzdHJpbmdpZnkgfSA9IGhlbHBlcnNcblxuRklMRV9FWFRFTlNJT05TID0gWycuY29mZmVlJyAnLmtvZmZlZSddXG5cbmJhc2U2NGVuY29kZSA9IChzcmMpIC0+XG4gICAgXG4gICAgaWYgdHlwZW9mIEJ1ZmZlciBpcyAnZnVuY3Rpb24nXG4gICAgICAgIEJ1ZmZlci5mcm9tKHNyYykudG9TdHJpbmcoJ2Jhc2U2NCcpXG4gICAgZWxzZSBpZiB0eXBlb2YgYnRvYSBpcyAnZnVuY3Rpb24nXG4gICAgICAgICMgVGhlIGNvbnRlbnRzIG9mIGEgYDxzY3JpcHQ+YCBibG9jayBhcmUgZW5jb2RlZCB2aWEgVVRGLTE2LCBzbyBpZiBhbnkgZXh0ZW5kZWRcbiAgICAgICAgIyBjaGFyYWN0ZXJzIGFyZSB1c2VkIGluIHRoZSBibG9jaywgYnRvYSB3aWxsIGZhaWwgYXMgaXQgbWF4ZXMgb3V0IGF0IFVURi04LlxuICAgICAgICAjIFNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvV2luZG93QmFzZTY0L0Jhc2U2NF9lbmNvZGluZ19hbmRfZGVjb2RpbmcjVGhlX1VuaWNvZGVfUHJvYmxlbVxuICAgICAgICAjIGZvciB0aGUgZ29yeSBkZXRhaWxzLCBhbmQgZm9yIHRoZSBzb2x1dGlvbiBpbXBsZW1lbnRlZCBoZXJlLlxuICAgICAgICBidG9hIGVuY29kZVVSSUNvbXBvbmVudChzcmMpLnJlcGxhY2UgLyUoWzAtOUEtRl17Mn0pL2csIChtYXRjaCwgcDEpIC0+XG4gICAgICAgICAgICBTdHJpbmcuZnJvbUNoYXJDb2RlICcweCcgKyBwMVxuICAgIGVsc2VcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gYmFzZTY0IGVuY29kZSBpbmxpbmUgc291cmNlbWFwLicpXG5cbmxleGVyID0gbmV3IExleGVyICMgSW5zdGFudGlhdGUgYSBMZXhlciBmb3Igb3VyIHVzZSBoZXJlLlxuICAgICAgICAgICAgXG4jIEZvciBlYWNoIGNvbXBpbGVkIGZpbGUsIHNhdmUgaXRzIHNvdXJjZSBpbiBtZW1vcnkgaW4gY2FzZSB3ZSBuZWVkIHRvXG4jIHJlY29tcGlsZSBpdCBsYXRlci4gV2UgbWlnaHQgbmVlZCB0byByZWNvbXBpbGUgaWYgdGhlIGZpcnN0IGNvbXBpbGF0aW9uXG4jIGRpZG7igJl0IGNyZWF0ZSBhIHNvdXJjZSBtYXAgKGZhc3RlcikgYnV0IHNvbWV0aGluZyB3ZW50IHdyb25nIGFuZCB3ZSBuZWVkXG4jIGEgc3RhY2sgdHJhY2UuIEFzc3VtaW5nIHRoYXQgbW9zdCBvZiB0aGUgdGltZSwgY29kZSBpc27igJl0IHRocm93aW5nXG4jIGV4Y2VwdGlvbnMsIGl04oCZcyBwcm9iYWJseSBtb3JlIGVmZmljaWVudCB0byBjb21waWxlIHR3aWNlIG9ubHkgd2hlbiB3ZVxuIyBuZWVkIGEgc3RhY2sgdHJhY2UsIHJhdGhlciB0aGFuIGFsd2F5cyBnZW5lcmF0aW5nIGEgc291cmNlIG1hcCBldmVuIHdoZW5cbiMgaXTigJlzIG5vdCBsaWtlbHkgdG8gYmUgdXNlZC4gU2F2ZSBpbiBmb3JtIG9mIGBmaWxlbmFtZWA6IGAoc291cmNlKWBcblxuc291cmNlcyA9IHt9XG5cbiMgQWxzbyBzYXZlIHNvdXJjZSBtYXBzIGlmIGdlbmVyYXRlZCwgaW4gZm9ybSBvZiBgZmlsZW5hbWVgOiBgKHNvdXJjZSBtYXApYC5cblxuc291cmNlTWFwcyA9IHt9XG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG5cbiMgQ29tcGlsZSBrb2ZmZWUgdG8gSmF2YVNjcmlwdCwgdXNpbmcgdGhlIEppc29uIGNvbXBpbGVyLlxuI1xuIyBJZiBgb3B0aW9ucy5zb3VyY2VNYXBgIGlzIHNwZWNpZmllZCwgdGhlbiBgb3B0aW9ucy5maWxlbmFtZWAgbXVzdCBhbHNvIGJlIHNwZWNpZmllZC4gXG4jIEFsbCBvcHRpb25zIHRoYXQgY2FuIGJlIHBhc3NlZCB0byBgU291cmNlTWFwI2dlbmVyYXRlYCBtYXkgYWxzbyBiZSBwYXNzZWQgaGVyZS5cbiNcbiMgVGhpcyByZXR1cm5zIGEgamF2YXNjcmlwdCBzdHJpbmcsIHVubGVzcyBgb3B0aW9ucy5zb3VyY2VNYXBgIGlzIHBhc3NlZCwgaW4gd2hpY2ggY2FzZSBpdCByZXR1cm5zIGEgYHtqcywgdjNTb3VyY2VNYXAsIHNvdXJjZU1hcH1gIG9iamVjdFxuXG5jb21waWxlID0gKGNvZGUsIG9wdGlvbnMpIC0+XG4gICAgXG4gICAgeyBtZXJnZSwgZXh0ZW5kIH0gPSBoZWxwZXJzXG4gICAgXG4gICAgb3B0aW9ucyA9IGluamVjdEZlYXR1cmUgb3B0aW9uc1xuICAgIG9wdGlvbnMgPSBpbmplY3RNZXRhICAgIG9wdGlvbnNcbiAgICAgICAgXG4gICAgIyBBbHdheXMgZ2VuZXJhdGUgYSBzb3VyY2UgbWFwIGlmIG5vIGZpbGVuYW1lIGlzIHBhc3NlZCBpbiwgc2luY2Ugd2l0aG91dCBhXG4gICAgIyBhIGZpbGVuYW1lIHdlIGhhdmUgbm8gd2F5IHRvIHJldHJpZXZlIHRoaXMgc291cmNlIGxhdGVyIGluIHRoZSBldmVudCB0aGF0XG4gICAgIyB3ZSBuZWVkIHRvIHJlY29tcGlsZSBpdCB0byBnZXQgYSBzb3VyY2UgbWFwIGZvciBgcHJlcGFyZVN0YWNrVHJhY2VgLlxuICAgICAgICBcbiAgICBnZW5lcmF0ZVNvdXJjZU1hcCA9IG9wdGlvbnMuc291cmNlTWFwIG9yIG9wdGlvbnMuaW5saW5lTWFwIG9yIG5vdCBvcHRpb25zLmZpbGVuYW1lP1xuICAgIGZpbGVuYW1lID0gb3B0aW9ucy5maWxlbmFtZSBvciAnJ1xuXG4gICAgc291cmNlc1tmaWxlbmFtZSA/ICc/J10gPSBjb2RlXG4gICAgbWFwID0gbmV3IFNvdXJjZU1hcCBpZiBnZW5lcmF0ZVNvdXJjZU1hcFxuXG4gICAgdG9rZW5zID0gbGV4ZXIudG9rZW5pemUgY29kZSwgb3B0aW9uc1xuXG4gICAgIyBQYXNzIGEgbGlzdCBvZiByZWZlcmVuY2VkIHZhcmlhYmxlcywgc28gdGhhdCBnZW5lcmF0ZWQgdmFyaWFibGVzIHdvbid0IGdldCB0aGUgc2FtZSBuYW1lLlxuICAgIFxuICAgIG9wdGlvbnMucmVmZXJlbmNlZFZhcnMgPSAoIHRva2VuWzFdIGZvciB0b2tlbiBpbiB0b2tlbnMgd2hlbiB0b2tlblswXSBpcyAnSURFTlRJRklFUicgKVxuXG4gICAgIyBDaGVjayBmb3IgaW1wb3J0IG9yIGV4cG9ydDsgaWYgZm91bmQsIGZvcmNlIGJhcmUgbW9kZS5cbiAgICAgICAgXG4gICAgaWYgbm90IG9wdGlvbnMuYmFyZVxuICAgICAgICBmb3IgdG9rZW4gaW4gdG9rZW5zXG4gICAgICAgICAgICBpZiB0b2tlblswXSBpbiBbJ0lNUE9SVCcgJ0VYUE9SVCddXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5iYXJlID0geWVzXG4gICAgICAgICAgICAgICAgYnJlYWtcblxuICAgIGZyYWdtZW50cyA9IHBhcnNlci5wYXJzZSh0b2tlbnMpLmNvbXBpbGVUb0ZyYWdtZW50cyBvcHRpb25zXG5cbiAgICBjdXJyZW50TGluZSA9IDBcbiAgICBjdXJyZW50TGluZSArPSAxIGlmIGhhc0ZlYXR1cmUgb3B0aW9ucywgJ2hlYWRlcidcbiAgICBjdXJyZW50Q29sdW1uID0gMFxuICAgIGpzID0gXCJcIlxuICAgIFxuICAgICMgbG9nICdmcmFnbWVudHMnLCBzdHJpbmdpZnkgZnJhZ21lbnRzXG4gICAgXG4gICAgZm9yIGZyYWdtZW50IGluIGZyYWdtZW50c1xuICAgICAgICAjIFVwZGF0ZSB0aGUgc291cmNlbWFwIHdpdGggZGF0YSBmcm9tIGVhY2ggZnJhZ21lbnQuXG4gICAgICAgIGlmIGdlbmVyYXRlU291cmNlTWFwXG4gICAgICAgICAgICAjIERvIG5vdCBpbmNsdWRlIGVtcHR5LCB3aGl0ZXNwYWNlLCBvciBzZW1pY29sb24tb25seSBmcmFnbWVudHMuXG4gICAgICAgICAgICBpZiBmcmFnbWVudC5sb2NhdGlvbkRhdGEgYW5kIG5vdCAvXls7XFxzXSokLy50ZXN0IGZyYWdtZW50LmNvZGVcbiAgICAgICAgICAgICAgICBtYXAuYWRkKFxuICAgICAgICAgICAgICAgICAgICBbZnJhZ21lbnQubG9jYXRpb25EYXRhLmZpcnN0X2xpbmUsIGZyYWdtZW50LmxvY2F0aW9uRGF0YS5maXJzdF9jb2x1bW5dXG4gICAgICAgICAgICAgICAgICAgIFtjdXJyZW50TGluZSwgY3VycmVudENvbHVtbl1cbiAgICAgICAgICAgICAgICAgICAge25vUmVwbGFjZTogdHJ1ZX0pXG4gICAgICAgICAgICBpZiBub3QgZnJhZ21lbnQuY29kZT9cbiAgICAgICAgICAgICAgICBsb2cgJ2dlbmVyYXRlU291cmNlTWFwJywgc3RyaW5naWZ5IGZyYWdtZW50XG4gICAgICAgICAgICBuZXdMaW5lcyA9IGNvdW50IGZyYWdtZW50LmNvZGUsIFwiXFxuXCJcbiAgICAgICAgICAgIGN1cnJlbnRMaW5lICs9IG5ld0xpbmVzXG4gICAgICAgICAgICBpZiBuZXdMaW5lc1xuICAgICAgICAgICAgICAgIGN1cnJlbnRDb2x1bW4gPSBmcmFnbWVudC5jb2RlLmxlbmd0aCAtIChmcmFnbWVudC5jb2RlLmxhc3RJbmRleE9mKFwiXFxuXCIpICsgMSlcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBjdXJyZW50Q29sdW1uICs9IGZyYWdtZW50LmNvZGUubGVuZ3RoXG5cbiAgICAgICAgIyBDb3B5IHRoZSBjb2RlIGZyb20gZWFjaCBmcmFnbWVudCBpbnRvIHRoZSBmaW5hbCBKYXZhU2NyaXB0LlxuICAgICAgICBqcyArPSBmcmFnbWVudC5jb2RlXG5cbiAgICBpZiBoYXNGZWF0dXJlIG9wdGlvbnMsICdoZWFkZXInXG4gICAgICAgIGhlYWRlciA9IFwia29mZmVlICN7QFZFUlNJT059XCJcbiAgICAgICAganMgPSBcIi8vICN7aGVhZGVyfVxcbiN7anN9XCJcblxuICAgIGlmIGdlbmVyYXRlU291cmNlTWFwXG4gICAgICAgIHYzU291cmNlTWFwID0gbWFwLmdlbmVyYXRlKG9wdGlvbnMsIGNvZGUpXG4gICAgICAgIHNvdXJjZU1hcHNbZmlsZW5hbWUgPyAnPyddID0gbWFwXG5cbiAgICBpZiBvcHRpb25zLmlubGluZU1hcFxuICAgICAgICBlbmNvZGVkID0gYmFzZTY0ZW5jb2RlIEpTT04uc3RyaW5naWZ5IHYzU291cmNlTWFwXG4gICAgICAgIHNvdXJjZU1hcERhdGFVUkkgPSBcIi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsI3tlbmNvZGVkfVwiXG4gICAgICAgIHNvdXJjZVVSTCA9IFwiLy8jIHNvdXJjZVVSTD0je29wdGlvbnMuZmlsZW5hbWUgPyAna29mZmVlJ31cIlxuICAgICAgICBqcyA9IFwiI3tqc31cXG4je3NvdXJjZU1hcERhdGFVUkl9XFxuI3tzb3VyY2VVUkx9XCJcblxuICAgIGlmIG9wdGlvbnMuc291cmNlTWFwXG4gICAgICAgIHtcbiAgICAgICAgICAgIGpzXG4gICAgICAgICAgICBzb3VyY2VNYXA6IG1hcFxuICAgICAgICAgICAgdjNTb3VyY2VNYXA6IEpTT04uc3RyaW5naWZ5IHYzU291cmNlTWFwLCBudWxsLCAyXG4gICAgICAgIH1cbiAgICBlbHNlXG4gICAgICAgIGpzXG4gICAgICAgICAgICAgICAgXG4jIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4jIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4jIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4jIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwICAgXG5cbiMgUGFyc2UgYSBzdHJpbmcgb2YgS29mZmVlIGNvZGUgb3IgYW4gYXJyYXkgb2YgbGV4ZWQgdG9rZW5zLCBhbmQgcmV0dXJuIHRoZSBBU1QuIFxuIyBZb3UgY2FuIHRoZW4gY29tcGlsZSBpdCBieSBjYWxsaW5nIGAuY29tcGlsZSgpYCBvbiB0aGUgcm9vdCwgb3IgdHJhdmVyc2UgaXQgYnkgdXNpbmcgYC50cmF2ZXJzZUNoaWxkcmVuKClgIHdpdGggYSBjYWxsYmFjay5cblxubm9kZXMgPSAoY29kZSwgb3B0aW9ucykgLT5cbiAgICBcbiAgICBpZiB0eXBlb2YgY29kZSBpcyAnc3RyaW5nJ1xuICAgICAgICBwYXJzZXIucGFyc2UgbGV4ZXIudG9rZW5pemUgY29kZSwgb3B0aW9uc1xuICAgIGVsc2VcbiAgICAgICAgcGFyc2VyLnBhcnNlIGNvZGVcbiAgICBcbiMgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMDAwMDAgICBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgICAwMDAgIFxuIyAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG5cbnRva2VucyA9IChjb2RlLCBvcHRpb25zKSAtPlxuICAgIFxuICAgIHRyeVxuICAgICAgICBsZXhlci50b2tlbml6ZSBjb2RlLCBvcHRpb25zXG4gICAgY2F0Y2ggZXJyXG4gICAgICAgIGlmIGVyciBpbnN0YW5jZW9mIFN5bnRheEVycm9yXG4gICAgICAgICAgICB1cGRhdGVTeW50YXhFcnJvciBlcnIsIGNvZGUsIG9wdGlvbnMuc291cmNlID8gb3B0aW9ucy5maWxlbmFtZSA/ICcnLCBvcHRpb25zXG4gICAgICAgIHRocm93IGVyclxuICAgICAgICBcbiMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4jIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuXG4jIENvbXBpbGUgYW5kIGV4ZWN1dGUgYSBzdHJpbmcgb2Yga29mZmVlXG5cbnJ1biA9IChjb2RlLCBvcHRpb25zPXt9KSAtPlxuICAgIFxuICAgIG9wdGlvbnMgPSBpbmplY3RGZWF0dXJlIG9wdGlvbnNcbiAgICBvcHRpb25zID0gaW5qZWN0TWV0YSAgICBvcHRpb25zXG4gICAgXG4gICAgbWFpbk1vZHVsZSA9IHJlcXVpcmUubWFpblxuXG4gICAgIyBTZXQgdGhlIGZpbGVuYW1lXG4gICAgXG4gICAgbWFpbk1vZHVsZS5maWxlbmFtZSA9IHByb2Nlc3MuYXJndlsxXSA9XG4gICAgICAgIGlmIG9wdGlvbnMuZmlsZW5hbWUgdGhlbiBmcy5yZWFscGF0aFN5bmMob3B0aW9ucy5maWxlbmFtZSkgZWxzZSAnJ1xuXG4gICAgbWFpbk1vZHVsZS5tb2R1bGVDYWNoZSBhbmQ9IHt9ICMgQ2xlYXIgdGhlIG1vZHVsZSBjYWNoZS5cblxuICAgICMgQXNzaWduIHBhdGhzIGZvciBub2RlX21vZHVsZXMgbG9hZGluZ1xuICAgICAgICBcbiAgICBkaXIgPSBpZiBvcHRpb25zLmZpbGVuYW1lP1xuICAgICAgICBwYXRoLmRpcm5hbWUgZnMucmVhbHBhdGhTeW5jIG9wdGlvbnMuZmlsZW5hbWVcbiAgICBlbHNlXG4gICAgICAgIGZzLnJlYWxwYXRoU3luYyAnLidcbiAgICAgICAgXG4gICAgbWFpbk1vZHVsZS5wYXRocyA9IHJlcXVpcmUoJ21vZHVsZScpLl9ub2RlTW9kdWxlUGF0aHMgZGlyXG5cbiAgICBpZiBub3QgaXNDb2ZmZWUobWFpbk1vZHVsZS5maWxlbmFtZSkgb3IgcmVxdWlyZS5leHRlbnNpb25zXG4gICAgICAgIHRyeVxuICAgICAgICAgICAgYW5zd2VyID0gY29tcGlsZSBjb2RlLCBvcHRpb25zXG4gICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgIyBsb2cgJ2tvZmZlZS5ydW4gY29tcGlsZSBlcnJvcicsIG9wdGlvbnMuZmlsZW5hbWUsIG1haW5Nb2R1bGUuZmlsZW5hbWUsIGVyclxuICAgICAgICAgICAgdXBkYXRlU3ludGF4RXJyb3IgZXJyLCBjb2RlLCBtYWluTW9kdWxlLmZpbGVuYW1lLCBvcHRpb25zXG4gICAgICAgICAgICB0aHJvdyBlcnJcbiAgICAgICAgXG4gICAgICAgIGNvZGUgPSBhbnN3ZXIuanMgPyBhbnN3ZXJcblxuICAgICMgbG9nICdLb2ZmZWUucnVuIG1haW5Nb2R1bGUuX2NvbXBpbGUnLCBtYWluTW9kdWxlLmZpbGVuYW1lLCBvcHRpb25zIGlmIG9wdGlvbnMuRGVidWdcbiAgICAgICAgXG4gICAgbWFpbk1vZHVsZS5fY29tcGlsZSBjb2RlLCBtYWluTW9kdWxlLmZpbGVuYW1lXG5cbiMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuIyAwMDAwMDAwICAgIDAwMCAwMDAgICAwMDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuXG4jIENvbXBpbGUgYW5kIGV2YWx1YXRlIGEgc3RyaW5nIGluIGEgTm9kZS5qcy1saWtlIGVudmlyb25tZW50LiBUaGUgUkVQTCB1c2VzIHRoaXMgdG8gcnVuIHRoZSBpbnB1dC5cblxuZXZhbHVhdGUgPSAoY29kZSwgb3B0aW9ucz17fSkgLT4gIyBleHBvcnRlZCBhcyBldmFsXG4gICAgXG4gICAgcmV0dXJuIHVubGVzcyBjb2RlID0gY29kZS50cmltKClcbiAgICBcbiAgICBjcmVhdGVDb250ZXh0ID0gdm0uY3JlYXRlQ29udGV4dFxuXG4gICAgaXNDb250ZXh0ID0gdm0uaXNDb250ZXh0ID8gKGN0eCkgLT5cbiAgICAgICAgb3B0aW9ucy5zYW5kYm94IGluc3RhbmNlb2YgY3JlYXRlQ29udGV4dCgpLmNvbnN0cnVjdG9yXG5cbiAgICBpZiBjcmVhdGVDb250ZXh0XG4gICAgICAgIGlmIG9wdGlvbnMuc2FuZGJveD9cbiAgICAgICAgICAgIGlmIGlzQ29udGV4dCBvcHRpb25zLnNhbmRib3hcbiAgICAgICAgICAgICAgICBzYW5kYm94ID0gb3B0aW9ucy5zYW5kYm94XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgc2FuZGJveCA9IGNyZWF0ZUNvbnRleHQoKVxuICAgICAgICAgICAgICAgIHNhbmRib3hba10gPSB2IGZvciBvd24gaywgdiBvZiBvcHRpb25zLnNhbmRib3hcbiAgICAgICAgICAgIHNhbmRib3guZ2xvYmFsID0gc2FuZGJveC5yb290ID0gc2FuZGJveC5HTE9CQUwgPSBzYW5kYm94XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNhbmRib3ggPSBnbG9iYWxcbiAgICAgICAgc2FuZGJveC5fX2ZpbGVuYW1lID0gb3B0aW9ucy5maWxlbmFtZSB8fCAnZXZhbCdcbiAgICAgICAgc2FuZGJveC5fX2Rpcm5hbWUgID0gcGF0aC5kaXJuYW1lIHNhbmRib3guX19maWxlbmFtZVxuICAgICAgICAjIGRlZmluZSBtb2R1bGUvcmVxdWlyZSBvbmx5IGlmIHRoZXkgY2hvc2Ugbm90IHRvIHNwZWNpZnkgdGhlaXIgb3duXG4gICAgICAgIHVubGVzcyBzYW5kYm94ICE9IGdsb2JhbCBvciBzYW5kYm94Lm1vZHVsZSBvciBzYW5kYm94LnJlcXVpcmVcbiAgICAgICAgICAgIE1vZHVsZSA9IHJlcXVpcmUgJ21vZHVsZSdcbiAgICAgICAgICAgIHNhbmRib3gubW9kdWxlICA9IF9tb2R1bGUgID0gbmV3IE1vZHVsZShvcHRpb25zLm1vZHVsZW5hbWUgfHwgJ2V2YWwnKVxuICAgICAgICAgICAgc2FuZGJveC5yZXF1aXJlID0gX3JlcXVpcmUgPSAocGF0aCkgLT4gIE1vZHVsZS5fbG9hZCBwYXRoLCBfbW9kdWxlLCB0cnVlXG4gICAgICAgICAgICBfbW9kdWxlLmZpbGVuYW1lID0gc2FuZGJveC5fX2ZpbGVuYW1lXG4gICAgICAgICAgICBmb3IgciBpbiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyByZXF1aXJlIHdoZW4gciBub3QgaW4gWydwYXRocycgJ2FyZ3VtZW50cycgJ2NhbGxlciddXG4gICAgICAgICAgICAgICAgX3JlcXVpcmVbcl0gPSByZXF1aXJlW3JdXG4gICAgICAgICAgICAjIHVzZSB0aGUgc2FtZSBoYWNrIG5vZGUgY3VycmVudGx5IHVzZXMgZm9yIHRoZWlyIG93biBSRVBMXG4gICAgICAgICAgICBfcmVxdWlyZS5wYXRocyA9IF9tb2R1bGUucGF0aHMgPSBNb2R1bGUuX25vZGVNb2R1bGVQYXRocyBwcm9jZXNzLmN3ZCgpXG4gICAgICAgICAgICBfcmVxdWlyZS5yZXNvbHZlID0gKHJlcXVlc3QpIC0+IE1vZHVsZS5fcmVzb2x2ZUZpbGVuYW1lIHJlcXVlc3QsIF9tb2R1bGVcbiAgICBvID0ge31cbiAgICBvW2tdID0gdiBmb3Igb3duIGssIHYgb2Ygb3B0aW9uc1xuICAgIG8uYmFyZSA9IHllcyAjIGVuc3VyZSByZXR1cm4gdmFsdWVcbiAgICBqcyA9IGNvbXBpbGUgY29kZSwgb1xuICAgIGlmIHNhbmRib3ggaXMgZ2xvYmFsXG4gICAgICAgIHZtLnJ1bkluVGhpc0NvbnRleHQganNcbiAgICBlbHNlXG4gICAgICAgIHZtLnJ1bkluQ29udGV4dCBqcywgc2FuZGJveFxuXG4jIDAwMCAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuIyAwMDAgICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwICAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4jIDAwMCAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuIyAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcblxuIyBUaGUgcmVhbCBMZXhlciBwcm9kdWNlcyBhIGdlbmVyaWMgc3RyZWFtIG9mIHRva2Vucy4gXG4jIFRoaXMgb2JqZWN0IHByb3ZpZGVzIGEgdGhpbiB3cmFwcGVyIGFyb3VuZCBpdCwgY29tcGF0aWJsZSB3aXRoIHRoZSBKaXNvbiBBUEkuIFxuIyBXZSBjYW4gdGhlbiBwYXNzIGl0IGRpcmVjdGx5IGFzIGEgXCJKaXNvbiBsZXhlclwiLlxuXG5wYXJzZXIubGV4ZXIgPVxuICAgIFxuICAgIGxleDogLT5cbiAgICAgICAgdG9rZW4gPSBwYXJzZXIudG9rZW5zW0Bwb3MrK11cbiAgICAgICAgaWYgdG9rZW5cbiAgICAgICAgICAgIFt0YWcsIEB5eXRleHQsIEB5eWxsb2NdID0gdG9rZW5cbiAgICAgICAgICAgIHBhcnNlci5lcnJvclRva2VuID0gdG9rZW4ub3JpZ2luIG9yIHRva2VuXG4gICAgICAgICAgICDilrhhc3NlcnQgXCJAeXlsbG9jPy5maXJzdF9saW5lP1wiIEB5eWxsb2M/LmZpcnN0X2xpbmU/XG4gICAgICAgICAgICBAeXlsaW5lbm8gPSBAeXlsbG9jLmZpcnN0X2xpbmVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdGFnID0gJydcbiAgICAgICAgdGFnXG4gICAgICAgIFxuICAgIHNldElucHV0OiAodG9rZW5zKSAtPlxuICAgICAgICBwYXJzZXIudG9rZW5zID0gdG9rZW5zXG4gICAgICAgIEBwb3MgPSAwXG4gICAgICAgIFxuICAgIHVwY29taW5nSW5wdXQ6IC0+IFwiXCJcbiAgICAgICAgXG5wYXJzZXIueXkgPSByZXF1aXJlICcuL25vZGVzJyAjIE1ha2UgYWxsIHRoZSBBU1Qgbm9kZXMgdmlzaWJsZSB0byB0aGUgcGFyc2VyLlxuXG5wYXJzZXIueXkucGFyc2VFcnJvciA9IChtZXNzYWdlLCB7dG9rZW59KSAtPiAjIE92ZXJyaWRlIEppc29uJ3MgZGVmYXVsdCBlcnJvciBoYW5kbGluZyBmdW5jdGlvbi5cbiAgICBcbiAgICAjIERpc3JlZ2FyZCBKaXNvbidzIG1lc3NhZ2UsIGl0IGNvbnRhaW5zIHJlZHVuZGFudCBsaW5lIG51bWJlciBpbmZvcm1hdGlvbi5cbiAgICAjIERpc3JlZ2FyZCB0aGUgdG9rZW4sIHdlIHRha2UgaXRzIHZhbHVlIGRpcmVjdGx5IGZyb20gdGhlIGxleGVyIGluIGNhc2VcbiAgICAjIHRoZSBlcnJvciBpcyBjYXVzZWQgYnkgYSBnZW5lcmF0ZWQgdG9rZW4gd2hpY2ggbWlnaHQgcmVmZXIgdG8gaXRzIG9yaWdpbi5cbiAgICBcbiAgICB7ZXJyb3JUb2tlbiwgdG9rZW5zfSA9IHBhcnNlclxuICAgIFtlcnJvclRhZywgZXJyb3JUZXh0LCBlcnJvckxvY10gPSBlcnJvclRva2VuXG5cbiAgICBlcnJvclRleHQgPSBzd2l0Y2hcbiAgICAgICAgd2hlbiBlcnJvclRva2VuIGlzIHRva2Vuc1t0b2tlbnMubGVuZ3RoIC0gMV1cbiAgICAgICAgICAgICdlbmQgb2YgaW5wdXQnXG4gICAgICAgIHdoZW4gZXJyb3JUYWcgaW4gWydJTkRFTlQnICdPVVRERU5UJ11cbiAgICAgICAgICAgICdpbmRlbnRhdGlvbidcbiAgICAgICAgd2hlbiBlcnJvclRhZyBpbiBbJ0lERU5USUZJRVInICdOVU1CRVInICdJTkZJTklUWScgJ1NUUklORycgJ1NUUklOR19TVEFSVCcgJ1JFR0VYJyAnUkVHRVhfU1RBUlQnXVxuICAgICAgICAgICAgZXJyb3JUYWcucmVwbGFjZSgvX1NUQVJUJC8sICcnKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHN3aXRjaCBlcnJvclRleHQgIyBuYW1lIHdoaXRlc3BhY2UgY2hhcmFjdGVyXG4gICAgICAgICAgICAgICAgd2hlbiAnICcgIHRoZW4gJ3NwYWNlJ1xuICAgICAgICAgICAgICAgIHdoZW4gJ1xcbicgdGhlbiAnbmV3bGluZSdcbiAgICAgICAgICAgICAgICB3aGVuICdcXHInIHRoZW4gJ2NhcnJpYWdlIHJldHVybidcbiAgICAgICAgICAgICAgICB3aGVuICdcXHQnIHRoZW4gJ3RhYidcbiAgICAgICAgICAgICAgICBlbHNlIGVycm9yVGV4dFxuICAgICAgICAgICAgXG4gICAgIyBUaGUgc2Vjb25kIGFyZ3VtZW50IGhhcyBhIGBsb2NgIHByb3BlcnR5LCB3aGljaCBzaG91bGQgaGF2ZSB0aGUgbG9jYXRpb24gZGF0YSBmb3IgdGhpcyB0b2tlbi4gXG4gICAgIyBVbmZvcnR1bmF0ZWx5LCBKaXNvbiBzZWVtcyB0byBzZW5kIGFuIG91dGRhdGVkIGBsb2NgIChmcm9tIHRoZSBwcmV2aW91cyB0b2tlbiksIFxuICAgICMgc28gd2UgdGFrZSB0aGUgbG9jYXRpb24gaW5mb3JtYXRpb24gZGlyZWN0bHkgZnJvbSB0aGUgbGV4ZXIuXG4gICAgXG4gICAgdGhyb3dTeW50YXhFcnJvciBtb2R1bGU6J2tvZmZlZScsIG1lc3NhZ2U6XCJ1bmV4cGVjdGVkICN7ZXJyb3JUZXh0fVwiLCBsb2NhdGlvbjplcnJvckxvY1xuXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4jICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcblxuZ2V0U291cmNlTWFwID0gKGZpbGVuYW1lKSAtPlxuICAgICBcbiAgICAjIEtvZmZlZSBjb21waWxlZCBpbiBhIGJyb3dzZXIgbWF5IGdldCBjb21waWxlZCB3aXRoIGBvcHRpb25zLmZpbGVuYW1lYCBvZiBgPGFub255bW91cz5gLCBcbiAgICAjIGJ1dCB0aGUgYnJvd3NlciBtYXkgcmVxdWVzdCB0aGUgc3RhY2sgdHJhY2Ugd2l0aCB0aGUgZmlsZW5hbWUgb2YgdGhlIHNjcmlwdCBmaWxlLlxuICAgIFxuICAgIGlmIHNvdXJjZU1hcHNbZmlsZW5hbWVdP1xuICAgICAgICBzb3VyY2VNYXBzW2ZpbGVuYW1lXVxuICAgIGVsc2UgaWYgc291cmNlTWFwc1snPyddP1xuICAgICAgICBzb3VyY2VNYXBzWyc/J11cbiAgICBlbHNlIGlmIHNvdXJjZXNbZmlsZW5hbWUgPyAnPyddP1xuICAgICAgICBhbnN3ZXIgPSBjb21waWxlIHNvdXJjZXNbZmlsZW5hbWUgPyAnPyddLFxuICAgICAgICAgICAgZmlsZW5hbWU6IGZpbGVuYW1lXG4gICAgICAgICAgICBzb3VyY2VNYXA6IHllc1xuICAgICAgICBhbnN3ZXIuc291cmNlTWFwXG4gICAgZWxzZVxuICAgICAgICBudWxsXG5cbiMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgICAgMDAwICAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICBcbiMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG5cbiMgQmFzZWQgb24gW21pY2hhZWxmaWNhcnJhL0tvZmZlZVJlZHV4XShodHRwOi8vZ29vLmdsL1pUeDFwKVxuIyBOb2RlSlMgLyBWOCBoYXZlIG5vIHN1cHBvcnQgZm9yIHRyYW5zZm9ybWluZyBwb3NpdGlvbnMgaW4gc3RhY2sgdHJhY2VzIHVzaW5nXG4jIHNvdXJjZU1hcCwgc28gd2UgbXVzdCBtb25rZXktcGF0Y2ggRXJyb3IgdG8gZGlzcGxheSBLb2ZmZWUgc291cmNlIHBvc2l0aW9ucy5cblxuRXJyb3IucHJlcGFyZVN0YWNrVHJhY2UgPSAoZXJyLCBzdGFjaykgLT5cbiAgICAgXG4gICAgZ2V0U291cmNlTWFwcGluZyA9IChmaWxlbmFtZSwgbGluZSwgY29sdW1uKSAtPlxuICAgICAgICBzb3VyY2VNYXAgPSBnZXRTb3VyY2VNYXAgZmlsZW5hbWVcbiAgICAgICAgYW5zd2VyID0gc291cmNlTWFwLnNvdXJjZUxvY2F0aW9uIFtsaW5lIC0gMSwgY29sdW1uIC0gMV0gaWYgc291cmNlTWFwP1xuICAgICAgICBpZiBhbnN3ZXI/IHRoZW4gW2Fuc3dlclswXSArIDEsIGFuc3dlclsxXSArIDFdIGVsc2UgbnVsbFxuXG4gICAgZnJhbWVzID0gZm9yIGZyYW1lIGluIHN0YWNrXG4gICAgICAgIGJyZWFrIGlmIGZyYW1lLmdldEZ1bmN0aW9uKCkgaXMgZXhwb3J0cy5ydW5cbiAgICAgICAgXCIgICAgICAgIGF0ICN7Zm9ybWF0U291cmNlUG9zaXRpb24gZnJhbWUsIGdldFNvdXJjZU1hcHBpbmd9XCJcblxuICAgIFwiI3tlcnIudG9TdHJpbmcoKX1cXG4je2ZyYW1lcy5qb2luICdcXG4nfVxcblwiXG4gICAgXG4jIEJhc2VkIG9uIGh0dHA6Ly92OC5nb29nbGVjb2RlLmNvbS9zdm4vYnJhbmNoZXMvYmxlZWRpbmdfZWRnZS9zcmMvbWVzc2FnZXMuanNcbiMgTW9kaWZpZWQgdG8gaGFuZGxlIHNvdXJjZU1hcFxuXG5mb3JtYXRTb3VyY2VQb3NpdGlvbiA9IChmcmFtZSwgZ2V0U291cmNlTWFwcGluZykgLT5cbiAgICAgXG4gICAgZmlsZW5hbWUgPSB1bmRlZmluZWRcbiAgICBmaWxlTG9jYXRpb24gPSAnJ1xuXG4gICAgaWYgZnJhbWUuaXNOYXRpdmUoKVxuICAgICAgICBmaWxlTG9jYXRpb24gPSBcIm5hdGl2ZVwiXG4gICAgZWxzZVxuICAgICAgICBpZiBmcmFtZS5pc0V2YWwoKVxuICAgICAgICAgICAgZmlsZW5hbWUgPSBmcmFtZS5nZXRTY3JpcHROYW1lT3JTb3VyY2VVUkwoKVxuICAgICAgICAgICAgZmlsZUxvY2F0aW9uID0gXCIje2ZyYW1lLmdldEV2YWxPcmlnaW4oKX0sIFwiIHVubGVzcyBmaWxlbmFtZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBmaWxlbmFtZSA9IGZyYW1lLmdldEZpbGVOYW1lKClcblxuICAgICAgICBmaWxlbmFtZSBvcj0gJydcblxuICAgICAgICBsaW5lICAgPSBmcmFtZS5nZXRMaW5lTnVtYmVyKClcbiAgICAgICAgY29sdW1uID0gZnJhbWUuZ2V0Q29sdW1uTnVtYmVyKClcblxuICAgICAgICAjIENoZWNrIGZvciBhIHNvdXJjZU1hcCBwb3NpdGlvblxuICAgICAgICBzb3VyY2UgPSBnZXRTb3VyY2VNYXBwaW5nIGZpbGVuYW1lLCBsaW5lLCBjb2x1bW5cbiAgICAgICAgZmlsZUxvY2F0aW9uID1cbiAgICAgICAgICAgIGlmIHNvdXJjZVxuICAgICAgICAgICAgICAgIFwiI3tmaWxlbmFtZX06I3tzb3VyY2VbMF19OiN7c291cmNlWzFdfVwiXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgXCIje2ZpbGVuYW1lfToje2xpbmV9OiN7Y29sdW1ufVwiXG5cbiAgICBmdW5jdGlvbk5hbWUgPSBmcmFtZS5nZXRGdW5jdGlvbk5hbWUoKVxuICAgIGlzQ29uc3RydWN0b3IgPSBmcmFtZS5pc0NvbnN0cnVjdG9yKClcbiAgICBpc01ldGhvZENhbGwgPSBub3QgKGZyYW1lLmlzVG9wbGV2ZWwoKSBvciBpc0NvbnN0cnVjdG9yKVxuXG4gICAgaWYgaXNNZXRob2RDYWxsXG4gICAgICAgIG1ldGhvZE5hbWUgPSBmcmFtZS5nZXRNZXRob2ROYW1lKClcbiAgICAgICAgdHlwZU5hbWUgPSBmcmFtZS5nZXRUeXBlTmFtZSgpXG5cbiAgICAgICAgaWYgZnVuY3Rpb25OYW1lXG4gICAgICAgICAgICB0cCA9IGFzID0gJydcbiAgICAgICAgICAgIGlmIHR5cGVOYW1lIGFuZCBmdW5jdGlvbk5hbWUuaW5kZXhPZiB0eXBlTmFtZVxuICAgICAgICAgICAgICAgIHRwID0gXCIje3R5cGVOYW1lfS5cIlxuICAgICAgICAgICAgaWYgbWV0aG9kTmFtZSBhbmQgZnVuY3Rpb25OYW1lLmluZGV4T2YoXCIuI3ttZXRob2ROYW1lfVwiKSAhPSBmdW5jdGlvbk5hbWUubGVuZ3RoIC0gbWV0aG9kTmFtZS5sZW5ndGggLSAxXG4gICAgICAgICAgICAgICAgYXMgPSBcIiBbYXMgI3ttZXRob2ROYW1lfV1cIlxuXG4gICAgICAgICAgICBcIiN7dHB9I3tmdW5jdGlvbk5hbWV9I3thc30gKCN7ZmlsZUxvY2F0aW9ufSlcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBcIiN7dHlwZU5hbWV9LiN7bWV0aG9kTmFtZSBvciAnPGFub255bW91cz4nfSAoI3tmaWxlTG9jYXRpb259KVwiXG4gICAgZWxzZSBpZiBpc0NvbnN0cnVjdG9yXG4gICAgICAgIFwibmV3ICN7ZnVuY3Rpb25OYW1lIG9yICc8YW5vbnltb3VzPid9ICgje2ZpbGVMb2NhdGlvbn0pXCJcbiAgICBlbHNlIGlmIGZ1bmN0aW9uTmFtZVxuICAgICAgICBcIiN7ZnVuY3Rpb25OYW1lfSAoI3tmaWxlTG9jYXRpb259KVwiXG4gICAgZWxzZVxuICAgICAgICBmaWxlTG9jYXRpb25cbiAgICBcbm1vZHVsZS5leHBvcnRzID0gXG4gICAgXG4gICAgRklMRV9FWFRFTlNJT05TOiBGSUxFX0VYVEVOU0lPTlNcbiAgICBWRVJTSU9OOiAgICAgICAgIHBrZy52ZXJzaW9uXG4gICAgcnVuOiAgICAgICAgICAgICBydW5cbiAgICBldmFsOiAgICAgICAgICAgIGV2YWx1YXRlXG4gICAgbm9kZXM6ICAgICAgICAgICBub2Rlc1xuICAgIGhlbHBlcnM6ICAgICAgICAgaGVscGVyc1xuICAgIGNvbXBpbGU6ICAgICAgICAgY29tcGlsZVxuICAgIHRva2VuczogICAgICAgICAgdG9rZW5zXG4gICAgcmVnaXN0ZXI6ICAgICAgICAtPiByZXF1aXJlICcuL3JlZ2lzdGVyJ1xuICAgIFxuICAgICJdfQ==
//# sourceURL=../coffee/koffee.coffee