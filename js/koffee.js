// koffee 0.30.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia29mZmVlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx1U0FBQTtJQUFBOztBQVVBLEVBQUEsR0FBWSxPQUFBLENBQVEsSUFBUjs7QUFDWixFQUFBLEdBQVksT0FBQSxDQUFRLElBQVI7O0FBQ1osSUFBQSxHQUFZLE9BQUEsQ0FBUSxNQUFSOztBQUNYLFFBQVcsT0FBQSxDQUFRLFNBQVI7O0FBQ1gsU0FBVyxPQUFBLENBQVEsVUFBUjs7QUFDWixPQUFBLEdBQVksT0FBQSxDQUFRLFdBQVI7O0FBQ1osU0FBQSxHQUFZLE9BQUEsQ0FBUSxhQUFSOztBQUNaLEdBQUEsR0FBWSxPQUFBLENBQVEsaUJBQVI7O0FBRVYsYUFBZSxPQUFBLENBQVEsUUFBUjs7QUFDakIsTUFBZ0MsT0FBQSxDQUFRLFlBQVIsQ0FBaEMsRUFBRSxpQ0FBRixFQUFpQjs7QUFDZiw2Q0FBRixFQUFxQiwyQ0FBckIsRUFBdUMsMkJBQXZDLEVBQWlELHFCQUFqRCxFQUF3RDs7QUFFeEQsZUFBQSxHQUFrQixDQUFDLFNBQUQsRUFBVyxTQUFYOztBQUVsQixZQUFBLEdBQWUsU0FBQyxHQUFEO0lBRVgsSUFBRyxPQUFPLE1BQVAsS0FBaUIsVUFBcEI7ZUFDSSxNQUFNLENBQUMsSUFBUCxDQUFZLEdBQVosQ0FBZ0IsQ0FBQyxRQUFqQixDQUEwQixRQUExQixFQURKO0tBQUEsTUFFSyxJQUFHLE9BQU8sSUFBUCxLQUFlLFVBQWxCO2VBS0QsSUFBQSxDQUFLLGtCQUFBLENBQW1CLEdBQW5CLENBQXVCLENBQUMsT0FBeEIsQ0FBZ0MsaUJBQWhDLEVBQW1ELFNBQUMsS0FBRCxFQUFRLEVBQVI7bUJBQ3BELE1BQU0sQ0FBQyxZQUFQLENBQW9CLElBQUEsR0FBTyxFQUEzQjtRQURvRCxDQUFuRCxDQUFMLEVBTEM7S0FBQSxNQUFBO0FBUUQsY0FBTSxJQUFJLEtBQUosQ0FBVSwyQ0FBVixFQVJMOztBQUpNOztB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MDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuMDAwICAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICBcbjAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAgICAgMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4wMDAgIDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIFxuMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwMDAwMDAgIDAwMDAwMDAwICBcbiMjI1xuXG4jIFRoaXMgbW9kdWxlIGNvbnRhaW5zIHRoZSBtYWluIGVudHJ5IGZ1bmN0aW9ucyBmb3IgdG9rZW5pemluZywgcGFyc2luZywgYW5kIGNvbXBpbGluZyBrb2ZmZWUgaW50byBKYXZhU2NyaXB0LlxuXG5mcyAgICAgICAgPSByZXF1aXJlICdmcydcbnZtICAgICAgICA9IHJlcXVpcmUgJ3ZtJ1xucGF0aCAgICAgID0gcmVxdWlyZSAncGF0aCdcbntMZXhlcn0gICA9IHJlcXVpcmUgJy4vbGV4ZXInXG57cGFyc2VyfSAgPSByZXF1aXJlICcuL3BhcnNlcidcbmhlbHBlcnMgICA9IHJlcXVpcmUgJy4vaGVscGVycydcblNvdXJjZU1hcCA9IHJlcXVpcmUgJy4vc291cmNlbWFwJ1xucGtnICAgICAgID0gcmVxdWlyZSAnLi4vcGFja2FnZS5qc29uJ1xuXG57IGluamVjdE1ldGEgfSA9IHJlcXVpcmUgJy4vbWV0YSdcbnsgaW5qZWN0RmVhdHVyZSwgaGFzRmVhdHVyZSB9ID0gcmVxdWlyZSAnLi9mZWF0dXJlcydcbnsgdXBkYXRlU3ludGF4RXJyb3IsIHRocm93U3ludGF4RXJyb3IsIGlzQ29mZmVlLCBjb3VudCwgc3RyaW5naWZ5IH0gPSBoZWxwZXJzXG5cbkZJTEVfRVhURU5TSU9OUyA9IFsnLmNvZmZlZScgJy5rb2ZmZWUnXVxuXG5iYXNlNjRlbmNvZGUgPSAoc3JjKSAtPlxuICAgIFxuICAgIGlmIHR5cGVvZiBCdWZmZXIgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICBCdWZmZXIuZnJvbShzcmMpLnRvU3RyaW5nKCdiYXNlNjQnKVxuICAgIGVsc2UgaWYgdHlwZW9mIGJ0b2EgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICAjIFRoZSBjb250ZW50cyBvZiBhIGA8c2NyaXB0PmAgYmxvY2sgYXJlIGVuY29kZWQgdmlhIFVURi0xNiwgc28gaWYgYW55IGV4dGVuZGVkXG4gICAgICAgICMgY2hhcmFjdGVycyBhcmUgdXNlZCBpbiB0aGUgYmxvY2ssIGJ0b2Egd2lsbCBmYWlsIGFzIGl0IG1heGVzIG91dCBhdCBVVEYtOC5cbiAgICAgICAgIyBTZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1dpbmRvd0Jhc2U2NC9CYXNlNjRfZW5jb2RpbmdfYW5kX2RlY29kaW5nI1RoZV9Vbmljb2RlX1Byb2JsZW1cbiAgICAgICAgIyBmb3IgdGhlIGdvcnkgZGV0YWlscywgYW5kIGZvciB0aGUgc29sdXRpb24gaW1wbGVtZW50ZWQgaGVyZS5cbiAgICAgICAgYnRvYSBlbmNvZGVVUklDb21wb25lbnQoc3JjKS5yZXBsYWNlIC8lKFswLTlBLUZdezJ9KS9nLCAobWF0Y2gsIHAxKSAtPlxuICAgICAgICAgICAgU3RyaW5nLmZyb21DaGFyQ29kZSAnMHgnICsgcDFcbiAgICBlbHNlXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIGJhc2U2NCBlbmNvZGUgaW5saW5lIHNvdXJjZW1hcC4nKVxuXG5sZXhlciA9IG5ldyBMZXhlciAjIEluc3RhbnRpYXRlIGEgTGV4ZXIgZm9yIG91ciB1c2UgaGVyZS5cbiAgICAgICAgICAgIFxuIyBGb3IgZWFjaCBjb21waWxlZCBmaWxlLCBzYXZlIGl0cyBzb3VyY2UgaW4gbWVtb3J5IGluIGNhc2Ugd2UgbmVlZCB0b1xuIyByZWNvbXBpbGUgaXQgbGF0ZXIuIFdlIG1pZ2h0IG5lZWQgdG8gcmVjb21waWxlIGlmIHRoZSBmaXJzdCBjb21waWxhdGlvblxuIyBkaWRu4oCZdCBjcmVhdGUgYSBzb3VyY2UgbWFwIChmYXN0ZXIpIGJ1dCBzb21ldGhpbmcgd2VudCB3cm9uZyBhbmQgd2UgbmVlZFxuIyBhIHN0YWNrIHRyYWNlLiBBc3N1bWluZyB0aGF0IG1vc3Qgb2YgdGhlIHRpbWUsIGNvZGUgaXNu4oCZdCB0aHJvd2luZ1xuIyBleGNlcHRpb25zLCBpdOKAmXMgcHJvYmFibHkgbW9yZSBlZmZpY2llbnQgdG8gY29tcGlsZSB0d2ljZSBvbmx5IHdoZW4gd2VcbiMgbmVlZCBhIHN0YWNrIHRyYWNlLCByYXRoZXIgdGhhbiBhbHdheXMgZ2VuZXJhdGluZyBhIHNvdXJjZSBtYXAgZXZlbiB3aGVuXG4jIGl04oCZcyBub3QgbGlrZWx5IHRvIGJlIHVzZWQuIFNhdmUgaW4gZm9ybSBvZiBgZmlsZW5hbWVgOiBgKHNvdXJjZSlgXG5cbnNvdXJjZXMgPSB7fVxuXG4jIEFsc28gc2F2ZSBzb3VyY2UgbWFwcyBpZiBnZW5lcmF0ZWQsIGluIGZvcm0gb2YgYGZpbGVuYW1lYDogYChzb3VyY2UgbWFwKWAuXG5cbnNvdXJjZU1hcHMgPSB7fVxuXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuXG4jIENvbXBpbGUga29mZmVlIHRvIEphdmFTY3JpcHQsIHVzaW5nIHRoZSBKaXNvbiBjb21waWxlci5cbiNcbiMgSWYgYG9wdGlvbnMuc291cmNlTWFwYCBpcyBzcGVjaWZpZWQsIHRoZW4gYG9wdGlvbnMuZmlsZW5hbWVgIG11c3QgYWxzbyBiZSBzcGVjaWZpZWQuIFxuIyBBbGwgb3B0aW9ucyB0aGF0IGNhbiBiZSBwYXNzZWQgdG8gYFNvdXJjZU1hcCNnZW5lcmF0ZWAgbWF5IGFsc28gYmUgcGFzc2VkIGhlcmUuXG4jXG4jIFRoaXMgcmV0dXJucyBhIGphdmFzY3JpcHQgc3RyaW5nLCB1bmxlc3MgYG9wdGlvbnMuc291cmNlTWFwYCBpcyBwYXNzZWQsIGluIHdoaWNoIGNhc2UgaXQgcmV0dXJucyBhIGB7anMsIHYzU291cmNlTWFwLCBzb3VyY2VNYXB9YCBvYmplY3RcblxuY29tcGlsZSA9IChjb2RlLCBvcHRpb25zKSAtPlxuICAgIFxuICAgIHsgbWVyZ2UsIGV4dGVuZCB9ID0gaGVscGVyc1xuICAgIFxuICAgIG9wdGlvbnMgPSBpbmplY3RGZWF0dXJlIG9wdGlvbnNcbiAgICBvcHRpb25zID0gaW5qZWN0TWV0YSAgICBvcHRpb25zXG4gICAgICAgIFxuICAgICMgQWx3YXlzIGdlbmVyYXRlIGEgc291cmNlIG1hcCBpZiBubyBmaWxlbmFtZSBpcyBwYXNzZWQgaW4sIHNpbmNlIHdpdGhvdXQgYVxuICAgICMgYSBmaWxlbmFtZSB3ZSBoYXZlIG5vIHdheSB0byByZXRyaWV2ZSB0aGlzIHNvdXJjZSBsYXRlciBpbiB0aGUgZXZlbnQgdGhhdFxuICAgICMgd2UgbmVlZCB0byByZWNvbXBpbGUgaXQgdG8gZ2V0IGEgc291cmNlIG1hcCBmb3IgYHByZXBhcmVTdGFja1RyYWNlYC5cbiAgICAgICAgXG4gICAgZ2VuZXJhdGVTb3VyY2VNYXAgPSBvcHRpb25zLnNvdXJjZU1hcCBvciBvcHRpb25zLmlubGluZU1hcCBvciBub3Qgb3B0aW9ucy5maWxlbmFtZT9cbiAgICBmaWxlbmFtZSA9IG9wdGlvbnMuZmlsZW5hbWUgb3IgJydcblxuICAgIHNvdXJjZXNbZmlsZW5hbWUgPyAnPyddID0gY29kZVxuICAgIG1hcCA9IG5ldyBTb3VyY2VNYXAgaWYgZ2VuZXJhdGVTb3VyY2VNYXBcblxuICAgIHRva2VucyA9IGxleGVyLnRva2VuaXplIGNvZGUsIG9wdGlvbnNcblxuICAgICMgUGFzcyBhIGxpc3Qgb2YgcmVmZXJlbmNlZCB2YXJpYWJsZXMsIHNvIHRoYXQgZ2VuZXJhdGVkIHZhcmlhYmxlcyB3b24ndCBnZXQgdGhlIHNhbWUgbmFtZS5cbiAgICBcbiAgICBvcHRpb25zLnJlZmVyZW5jZWRWYXJzID0gKCB0b2tlblsxXSBmb3IgdG9rZW4gaW4gdG9rZW5zIHdoZW4gdG9rZW5bMF0gaXMgJ0lERU5USUZJRVInIClcblxuICAgICMgQ2hlY2sgZm9yIGltcG9ydCBvciBleHBvcnQ7IGlmIGZvdW5kLCBmb3JjZSBiYXJlIG1vZGUuXG4gICAgICAgIFxuICAgIGlmIG5vdCBvcHRpb25zLmJhcmVcbiAgICAgICAgZm9yIHRva2VuIGluIHRva2Vuc1xuICAgICAgICAgICAgaWYgdG9rZW5bMF0gaW4gWydJTVBPUlQnICdFWFBPUlQnXVxuICAgICAgICAgICAgICAgIG9wdGlvbnMuYmFyZSA9IHllc1xuICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICBmcmFnbWVudHMgPSBwYXJzZXIucGFyc2UodG9rZW5zKS5jb21waWxlVG9GcmFnbWVudHMgb3B0aW9uc1xuXG4gICAgY3VycmVudExpbmUgPSAwXG4gICAgY3VycmVudExpbmUgKz0gMSBpZiBoYXNGZWF0dXJlIG9wdGlvbnMsICdoZWFkZXInXG4gICAgY3VycmVudENvbHVtbiA9IDBcbiAgICBqcyA9IFwiXCJcbiAgICBcbiAgICAjIGxvZyAnZnJhZ21lbnRzJywgc3RyaW5naWZ5IGZyYWdtZW50c1xuICAgIFxuICAgIGZvciBmcmFnbWVudCBpbiBmcmFnbWVudHNcbiAgICAgICAgIyBVcGRhdGUgdGhlIHNvdXJjZW1hcCB3aXRoIGRhdGEgZnJvbSBlYWNoIGZyYWdtZW50LlxuICAgICAgICBpZiBnZW5lcmF0ZVNvdXJjZU1hcFxuICAgICAgICAgICAgIyBEbyBub3QgaW5jbHVkZSBlbXB0eSwgd2hpdGVzcGFjZSwgb3Igc2VtaWNvbG9uLW9ubHkgZnJhZ21lbnRzLlxuICAgICAgICAgICAgaWYgZnJhZ21lbnQubG9jYXRpb25EYXRhIGFuZCBub3QgL15bO1xcc10qJC8udGVzdCBmcmFnbWVudC5jb2RlXG4gICAgICAgICAgICAgICAgbWFwLmFkZChcbiAgICAgICAgICAgICAgICAgICAgW2ZyYWdtZW50LmxvY2F0aW9uRGF0YS5maXJzdF9saW5lLCBmcmFnbWVudC5sb2NhdGlvbkRhdGEuZmlyc3RfY29sdW1uXVxuICAgICAgICAgICAgICAgICAgICBbY3VycmVudExpbmUsIGN1cnJlbnRDb2x1bW5dXG4gICAgICAgICAgICAgICAgICAgIHtub1JlcGxhY2U6IHRydWV9KVxuICAgICAgICAgICAgaWYgbm90IGZyYWdtZW50LmNvZGU/XG4gICAgICAgICAgICAgICAgbG9nICdnZW5lcmF0ZVNvdXJjZU1hcCcsIHN0cmluZ2lmeSBmcmFnbWVudFxuICAgICAgICAgICAgbmV3TGluZXMgPSBjb3VudCBmcmFnbWVudC5jb2RlLCBcIlxcblwiXG4gICAgICAgICAgICBjdXJyZW50TGluZSArPSBuZXdMaW5lc1xuICAgICAgICAgICAgaWYgbmV3TGluZXNcbiAgICAgICAgICAgICAgICBjdXJyZW50Q29sdW1uID0gZnJhZ21lbnQuY29kZS5sZW5ndGggLSAoZnJhZ21lbnQuY29kZS5sYXN0SW5kZXhPZihcIlxcblwiKSArIDEpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgY3VycmVudENvbHVtbiArPSBmcmFnbWVudC5jb2RlLmxlbmd0aFxuXG4gICAgICAgICMgQ29weSB0aGUgY29kZSBmcm9tIGVhY2ggZnJhZ21lbnQgaW50byB0aGUgZmluYWwgSmF2YVNjcmlwdC5cbiAgICAgICAganMgKz0gZnJhZ21lbnQuY29kZVxuXG4gICAgaWYgaGFzRmVhdHVyZSBvcHRpb25zLCAnaGVhZGVyJ1xuICAgICAgICBoZWFkZXIgPSBcImtvZmZlZSAje0BWRVJTSU9OfVwiXG4gICAgICAgIGpzID0gXCIvLyAje2hlYWRlcn1cXG4je2pzfVwiXG5cbiAgICBpZiBnZW5lcmF0ZVNvdXJjZU1hcFxuICAgICAgICB2M1NvdXJjZU1hcCA9IG1hcC5nZW5lcmF0ZShvcHRpb25zLCBjb2RlKVxuICAgICAgICBzb3VyY2VNYXBzW2ZpbGVuYW1lID8gJz8nXSA9IG1hcFxuXG4gICAgaWYgb3B0aW9ucy5pbmxpbmVNYXBcbiAgICAgICAgZW5jb2RlZCA9IGJhc2U2NGVuY29kZSBKU09OLnN0cmluZ2lmeSB2M1NvdXJjZU1hcFxuICAgICAgICBzb3VyY2VNYXBEYXRhVVJJID0gXCIvLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LCN7ZW5jb2RlZH1cIlxuICAgICAgICBzb3VyY2VVUkwgPSBcIi8vIyBzb3VyY2VVUkw9I3tvcHRpb25zLmZpbGVuYW1lID8gJ2tvZmZlZSd9XCJcbiAgICAgICAganMgPSBcIiN7anN9XFxuI3tzb3VyY2VNYXBEYXRhVVJJfVxcbiN7c291cmNlVVJMfVwiXG5cbiAgICBpZiBvcHRpb25zLnNvdXJjZU1hcFxuICAgICAgICB7XG4gICAgICAgICAgICBqc1xuICAgICAgICAgICAgc291cmNlTWFwOiBtYXBcbiAgICAgICAgICAgIHYzU291cmNlTWFwOiBKU09OLnN0cmluZ2lmeSB2M1NvdXJjZU1hcCwgbnVsbCwgMlxuICAgICAgICB9XG4gICAgZWxzZVxuICAgICAgICBqc1xuICAgICAgICAgICAgICAgIFxuIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgIFxuIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuXG4jIFBhcnNlIGEgc3RyaW5nIG9mIEtvZmZlZSBjb2RlIG9yIGFuIGFycmF5IG9mIGxleGVkIHRva2VucywgYW5kIHJldHVybiB0aGUgQVNULiBcbiMgWW91IGNhbiB0aGVuIGNvbXBpbGUgaXQgYnkgY2FsbGluZyBgLmNvbXBpbGUoKWAgb24gdGhlIHJvb3QsIG9yIHRyYXZlcnNlIGl0IGJ5IHVzaW5nIGAudHJhdmVyc2VDaGlsZHJlbigpYCB3aXRoIGEgY2FsbGJhY2suXG5cbm5vZGVzID0gKGNvZGUsIG9wdGlvbnMpIC0+XG4gICAgXG4gICAgaWYgdHlwZW9mIGNvZGUgaXMgJ3N0cmluZydcbiAgICAgICAgcGFyc2VyLnBhcnNlIGxleGVyLnRva2VuaXplIGNvZGUsIG9wdGlvbnNcbiAgICBlbHNlXG4gICAgICAgIHBhcnNlci5wYXJzZSBjb2RlXG4gICAgXG4jIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgICAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAwMDAwICAgXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgICAgMDAwICBcbiMgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuXG50b2tlbnMgPSAoY29kZSwgb3B0aW9ucykgLT5cbiAgICBcbiAgICB0cnlcbiAgICAgICAgbGV4ZXIudG9rZW5pemUgY29kZSwgb3B0aW9uc1xuICAgIGNhdGNoIGVyclxuICAgICAgICBpZiBlcnIgaW5zdGFuY2VvZiBTeW50YXhFcnJvclxuICAgICAgICAgICAgdXBkYXRlU3ludGF4RXJyb3IgZXJyLCBjb2RlLCBvcHRpb25zLnNvdXJjZSA/IG9wdGlvbnMuZmlsZW5hbWUgPyAnJywgb3B0aW9uc1xuICAgICAgICB0aHJvdyBlcnJcbiAgICAgICAgXG4jIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiMgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcblxuIyBDb21waWxlIGFuZCBleGVjdXRlIGEgc3RyaW5nIG9mIGtvZmZlZVxuXG5ydW4gPSAoY29kZSwgb3B0aW9ucz17fSkgLT5cbiAgICBcbiAgICBvcHRpb25zID0gaW5qZWN0RmVhdHVyZSBvcHRpb25zXG4gICAgb3B0aW9ucyA9IGluamVjdE1ldGEgICAgb3B0aW9uc1xuICAgIFxuICAgIG1haW5Nb2R1bGUgPSByZXF1aXJlLm1haW5cblxuICAgICMgU2V0IHRoZSBmaWxlbmFtZVxuICAgIFxuICAgIG1haW5Nb2R1bGUuZmlsZW5hbWUgPSBwcm9jZXNzLmFyZ3ZbMV0gPVxuICAgICAgICBpZiBvcHRpb25zLmZpbGVuYW1lIHRoZW4gZnMucmVhbHBhdGhTeW5jKG9wdGlvbnMuZmlsZW5hbWUpIGVsc2UgJydcblxuICAgIG1haW5Nb2R1bGUubW9kdWxlQ2FjaGUgYW5kPSB7fSAjIENsZWFyIHRoZSBtb2R1bGUgY2FjaGUuXG5cbiAgICAjIEFzc2lnbiBwYXRocyBmb3Igbm9kZV9tb2R1bGVzIGxvYWRpbmdcbiAgICAgICAgXG4gICAgZGlyID0gaWYgb3B0aW9ucy5maWxlbmFtZT9cbiAgICAgICAgcGF0aC5kaXJuYW1lIGZzLnJlYWxwYXRoU3luYyBvcHRpb25zLmZpbGVuYW1lXG4gICAgZWxzZVxuICAgICAgICBmcy5yZWFscGF0aFN5bmMgJy4nXG4gICAgICAgIFxuICAgIG1haW5Nb2R1bGUucGF0aHMgPSByZXF1aXJlKCdtb2R1bGUnKS5fbm9kZU1vZHVsZVBhdGhzIGRpclxuXG4gICAgaWYgbm90IGlzQ29mZmVlKG1haW5Nb2R1bGUuZmlsZW5hbWUpIG9yIHJlcXVpcmUuZXh0ZW5zaW9uc1xuICAgICAgICB0cnlcbiAgICAgICAgICAgIGFuc3dlciA9IGNvbXBpbGUgY29kZSwgb3B0aW9uc1xuICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgICMgbG9nICdrb2ZmZWUucnVuIGNvbXBpbGUgZXJyb3InLCBvcHRpb25zLmZpbGVuYW1lLCBtYWluTW9kdWxlLmZpbGVuYW1lLCBlcnJcbiAgICAgICAgICAgIHVwZGF0ZVN5bnRheEVycm9yIGVyciwgY29kZSwgbWFpbk1vZHVsZS5maWxlbmFtZSwgb3B0aW9uc1xuICAgICAgICAgICAgdGhyb3cgZXJyXG4gICAgICAgIFxuICAgICAgICBjb2RlID0gYW5zd2VyLmpzID8gYW5zd2VyXG5cbiAgICAjIGxvZyAnS29mZmVlLnJ1biBtYWluTW9kdWxlLl9jb21waWxlJywgbWFpbk1vZHVsZS5maWxlbmFtZSwgb3B0aW9ucyBpZiBvcHRpb25zLkRlYnVnXG4gICAgICAgIFxuICAgIG1haW5Nb2R1bGUuX2NvbXBpbGUgY29kZSwgbWFpbk1vZHVsZS5maWxlbmFtZVxuXG4jIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgXG4jIDAwMDAwMDAgICAgMDAwIDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgICAgXG4jIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgXG4jIDAwMDAwMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgXG5cbiMgQ29tcGlsZSBhbmQgZXZhbHVhdGUgYSBzdHJpbmcgaW4gYSBOb2RlLmpzLWxpa2UgZW52aXJvbm1lbnQuIFRoZSBSRVBMIHVzZXMgdGhpcyB0byBydW4gdGhlIGlucHV0LlxuXG5ldmFsdWF0ZSA9IChjb2RlLCBvcHRpb25zPXt9KSAtPlxuICAgIFxuICAgIHJldHVybiB1bmxlc3MgY29kZSA9IGNvZGUudHJpbSgpXG4gICAgXG4gICAgY3JlYXRlQ29udGV4dCA9IHZtLmNyZWF0ZUNvbnRleHRcblxuICAgIGlzQ29udGV4dCA9IHZtLmlzQ29udGV4dCA/IChjdHgpIC0+XG4gICAgICAgIG9wdGlvbnMuc2FuZGJveCBpbnN0YW5jZW9mIGNyZWF0ZUNvbnRleHQoKS5jb25zdHJ1Y3RvclxuXG4gICAgaWYgY3JlYXRlQ29udGV4dFxuICAgICAgICBpZiBvcHRpb25zLnNhbmRib3g/XG4gICAgICAgICAgICBpZiBpc0NvbnRleHQgb3B0aW9ucy5zYW5kYm94XG4gICAgICAgICAgICAgICAgc2FuZGJveCA9IG9wdGlvbnMuc2FuZGJveFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHNhbmRib3ggPSBjcmVhdGVDb250ZXh0KClcbiAgICAgICAgICAgICAgICBzYW5kYm94W2tdID0gdiBmb3Igb3duIGssIHYgb2Ygb3B0aW9ucy5zYW5kYm94XG4gICAgICAgICAgICBzYW5kYm94Lmdsb2JhbCA9IHNhbmRib3gucm9vdCA9IHNhbmRib3guR0xPQkFMID0gc2FuZGJveFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzYW5kYm94ID0gZ2xvYmFsXG4gICAgICAgIHNhbmRib3guX19maWxlbmFtZSA9IG9wdGlvbnMuZmlsZW5hbWUgfHwgJ2V2YWwnXG4gICAgICAgIHNhbmRib3guX19kaXJuYW1lICA9IHBhdGguZGlybmFtZSBzYW5kYm94Ll9fZmlsZW5hbWVcbiAgICAgICAgIyBkZWZpbmUgbW9kdWxlL3JlcXVpcmUgb25seSBpZiB0aGV5IGNob3NlIG5vdCB0byBzcGVjaWZ5IHRoZWlyIG93blxuICAgICAgICB1bmxlc3Mgc2FuZGJveCAhPSBnbG9iYWwgb3Igc2FuZGJveC5tb2R1bGUgb3Igc2FuZGJveC5yZXF1aXJlXG4gICAgICAgICAgICBNb2R1bGUgPSByZXF1aXJlICdtb2R1bGUnXG4gICAgICAgICAgICBzYW5kYm94Lm1vZHVsZSAgPSBfbW9kdWxlICA9IG5ldyBNb2R1bGUob3B0aW9ucy5tb2R1bGVuYW1lIHx8ICdldmFsJylcbiAgICAgICAgICAgIHNhbmRib3gucmVxdWlyZSA9IF9yZXF1aXJlID0gKHBhdGgpIC0+ICBNb2R1bGUuX2xvYWQgcGF0aCwgX21vZHVsZSwgdHJ1ZVxuICAgICAgICAgICAgX21vZHVsZS5maWxlbmFtZSA9IHNhbmRib3guX19maWxlbmFtZVxuICAgICAgICAgICAgZm9yIHIgaW4gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMgcmVxdWlyZSB3aGVuIHIgbm90IGluIFsncGF0aHMnICdhcmd1bWVudHMnICdjYWxsZXInXVxuICAgICAgICAgICAgICAgIF9yZXF1aXJlW3JdID0gcmVxdWlyZVtyXVxuICAgICAgICAgICAgIyB1c2UgdGhlIHNhbWUgaGFjayBub2RlIGN1cnJlbnRseSB1c2VzIGZvciB0aGVpciBvd24gUkVQTFxuICAgICAgICAgICAgX3JlcXVpcmUucGF0aHMgPSBfbW9kdWxlLnBhdGhzID0gTW9kdWxlLl9ub2RlTW9kdWxlUGF0aHMgcHJvY2Vzcy5jd2QoKVxuICAgICAgICAgICAgX3JlcXVpcmUucmVzb2x2ZSA9IChyZXF1ZXN0KSAtPiBNb2R1bGUuX3Jlc29sdmVGaWxlbmFtZSByZXF1ZXN0LCBfbW9kdWxlXG4gICAgbyA9IHt9XG4gICAgb1trXSA9IHYgZm9yIG93biBrLCB2IG9mIG9wdGlvbnNcbiAgICBvLmJhcmUgPSB5ZXMgIyBlbnN1cmUgcmV0dXJuIHZhbHVlXG4gICAganMgPSBjb21waWxlIGNvZGUsIG9cbiAgICBpZiBzYW5kYm94IGlzIGdsb2JhbFxuICAgICAgICB2bS5ydW5JblRoaXNDb250ZXh0IGpzXG4gICAgZWxzZVxuICAgICAgICB2bS5ydW5JbkNvbnRleHQganMsIHNhbmRib3hcblxuIyAwMDAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiMgMDAwICAgICAgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgICAgIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuIyAwMDAgICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG5cbiMgVGhlIHJlYWwgTGV4ZXIgcHJvZHVjZXMgYSBnZW5lcmljIHN0cmVhbSBvZiB0b2tlbnMuIFxuIyBUaGlzIG9iamVjdCBwcm92aWRlcyBhIHRoaW4gd3JhcHBlciBhcm91bmQgaXQsIGNvbXBhdGlibGUgd2l0aCB0aGUgSmlzb24gQVBJLiBcbiMgV2UgY2FuIHRoZW4gcGFzcyBpdCBkaXJlY3RseSBhcyBhIFwiSmlzb24gbGV4ZXJcIi5cblxucGFyc2VyLmxleGVyID1cbiAgICBcbiAgICBsZXg6IC0+XG4gICAgICAgIHRva2VuID0gcGFyc2VyLnRva2Vuc1tAcG9zKytdXG4gICAgICAgIGlmIHRva2VuXG4gICAgICAgICAgICBbdGFnLCBAeXl0ZXh0LCBAeXlsbG9jXSA9IHRva2VuXG4gICAgICAgICAgICBwYXJzZXIuZXJyb3JUb2tlbiA9IHRva2VuLm9yaWdpbiBvciB0b2tlblxuICAgICAgICAgICAg4pa4YXNzZXJ0IFwiQHl5bGxvYz8uZmlyc3RfbGluZT9cIiBAeXlsbG9jPy5maXJzdF9saW5lP1xuICAgICAgICAgICAgQHl5bGluZW5vID0gQHl5bGxvYy5maXJzdF9saW5lXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHRhZyA9ICcnXG4gICAgICAgIHRhZ1xuICAgICAgICBcbiAgICBzZXRJbnB1dDogKHRva2VucykgLT5cbiAgICAgICAgcGFyc2VyLnRva2VucyA9IHRva2Vuc1xuICAgICAgICBAcG9zID0gMFxuICAgICAgICBcbiAgICB1cGNvbWluZ0lucHV0OiAtPiBcIlwiXG4gICAgICAgIFxucGFyc2VyLnl5ID0gcmVxdWlyZSAnLi9ub2RlcycgIyBNYWtlIGFsbCB0aGUgQVNUIG5vZGVzIHZpc2libGUgdG8gdGhlIHBhcnNlci5cblxucGFyc2VyLnl5LnBhcnNlRXJyb3IgPSAobWVzc2FnZSwge3Rva2VufSkgLT4gIyBPdmVycmlkZSBKaXNvbidzIGRlZmF1bHQgZXJyb3IgaGFuZGxpbmcgZnVuY3Rpb24uXG4gICAgXG4gICAgIyBEaXNyZWdhcmQgSmlzb24ncyBtZXNzYWdlLCBpdCBjb250YWlucyByZWR1bmRhbnQgbGluZSBudW1iZXIgaW5mb3JtYXRpb24uXG4gICAgIyBEaXNyZWdhcmQgdGhlIHRva2VuLCB3ZSB0YWtlIGl0cyB2YWx1ZSBkaXJlY3RseSBmcm9tIHRoZSBsZXhlciBpbiBjYXNlXG4gICAgIyB0aGUgZXJyb3IgaXMgY2F1c2VkIGJ5IGEgZ2VuZXJhdGVkIHRva2VuIHdoaWNoIG1pZ2h0IHJlZmVyIHRvIGl0cyBvcmlnaW4uXG4gICAgXG4gICAge2Vycm9yVG9rZW4sIHRva2Vuc30gPSBwYXJzZXJcbiAgICBbZXJyb3JUYWcsIGVycm9yVGV4dCwgZXJyb3JMb2NdID0gZXJyb3JUb2tlblxuXG4gICAgZXJyb3JUZXh0ID0gc3dpdGNoXG4gICAgICAgIHdoZW4gZXJyb3JUb2tlbiBpcyB0b2tlbnNbdG9rZW5zLmxlbmd0aCAtIDFdXG4gICAgICAgICAgICAnZW5kIG9mIGlucHV0J1xuICAgICAgICB3aGVuIGVycm9yVGFnIGluIFsnSU5ERU5UJyAnT1VUREVOVCddXG4gICAgICAgICAgICAnaW5kZW50YXRpb24nXG4gICAgICAgIHdoZW4gZXJyb3JUYWcgaW4gWydJREVOVElGSUVSJyAnTlVNQkVSJyAnSU5GSU5JVFknICdTVFJJTkcnICdTVFJJTkdfU1RBUlQnICdSRUdFWCcgJ1JFR0VYX1NUQVJUJ11cbiAgICAgICAgICAgIGVycm9yVGFnLnJlcGxhY2UoL19TVEFSVCQvLCAnJykudG9Mb3dlckNhc2UoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzd2l0Y2ggZXJyb3JUZXh0ICMgbmFtZVdoaXRlc3BhY2VDaGFyYWN0ZXJcbiAgICAgICAgICAgICAgICB3aGVuICcgJyB0aGVuICdzcGFjZSdcbiAgICAgICAgICAgICAgICB3aGVuICdcXG4nIHRoZW4gJ25ld2xpbmUnXG4gICAgICAgICAgICAgICAgd2hlbiAnXFxyJyB0aGVuICdjYXJyaWFnZSByZXR1cm4nXG4gICAgICAgICAgICAgICAgd2hlbiAnXFx0JyB0aGVuICd0YWInXG4gICAgICAgICAgICAgICAgZWxzZSBlcnJvclRleHRcbiAgICAgICAgICAgIFxuICAgICMgVGhlIHNlY29uZCBhcmd1bWVudCBoYXMgYSBgbG9jYCBwcm9wZXJ0eSwgd2hpY2ggc2hvdWxkIGhhdmUgdGhlIGxvY2F0aW9uIGRhdGEgZm9yIHRoaXMgdG9rZW4uIFxuICAgICMgVW5mb3J0dW5hdGVseSwgSmlzb24gc2VlbXMgdG8gc2VuZCBhbiBvdXRkYXRlZCBgbG9jYCAoZnJvbSB0aGUgcHJldmlvdXMgdG9rZW4pLCBcbiAgICAjIHNvIHdlIHRha2UgdGhlIGxvY2F0aW9uIGluZm9ybWF0aW9uIGRpcmVjdGx5IGZyb20gdGhlIGxleGVyLlxuICAgIFxuICAgIHRocm93U3ludGF4RXJyb3IgbW9kdWxlOidrb2ZmZWUnLCBtZXNzYWdlOlwidW5leHBlY3RlZCAje2Vycm9yVGV4dH1cIiwgbG9jYXRpb246ZXJyb3JMb2NcblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiMgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG5cbmdldFNvdXJjZU1hcCA9IChmaWxlbmFtZSkgLT5cbiAgICAgXG4gICAgIyBLb2ZmZWUgY29tcGlsZWQgaW4gYSBicm93c2VyIG1heSBnZXQgY29tcGlsZWQgd2l0aCBgb3B0aW9ucy5maWxlbmFtZWAgb2YgYDxhbm9ueW1vdXM+YCwgXG4gICAgIyBidXQgdGhlIGJyb3dzZXIgbWF5IHJlcXVlc3QgdGhlIHN0YWNrIHRyYWNlIHdpdGggdGhlIGZpbGVuYW1lIG9mIHRoZSBzY3JpcHQgZmlsZS5cbiAgICBcbiAgICBpZiBzb3VyY2VNYXBzW2ZpbGVuYW1lXT9cbiAgICAgICAgc291cmNlTWFwc1tmaWxlbmFtZV1cbiAgICBlbHNlIGlmIHNvdXJjZU1hcHNbJz8nXT9cbiAgICAgICAgc291cmNlTWFwc1snPyddXG4gICAgZWxzZSBpZiBzb3VyY2VzW2ZpbGVuYW1lID8gJz8nXT9cbiAgICAgICAgYW5zd2VyID0gY29tcGlsZSBzb3VyY2VzW2ZpbGVuYW1lID8gJz8nXSxcbiAgICAgICAgICAgIGZpbGVuYW1lOiBmaWxlbmFtZVxuICAgICAgICAgICAgc291cmNlTWFwOiB5ZXNcbiAgICAgICAgYW5zd2VyLnNvdXJjZU1hcFxuICAgIGVsc2VcbiAgICAgICAgbnVsbFxuXG4jICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgXG4jICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuXG4jIEJhc2VkIG9uIFttaWNoYWVsZmljYXJyYS9Lb2ZmZWVSZWR1eF0oaHR0cDovL2dvby5nbC9aVHgxcClcbiMgTm9kZUpTIC8gVjggaGF2ZSBubyBzdXBwb3J0IGZvciB0cmFuc2Zvcm1pbmcgcG9zaXRpb25zIGluIHN0YWNrIHRyYWNlcyB1c2luZ1xuIyBzb3VyY2VNYXAsIHNvIHdlIG11c3QgbW9ua2V5LXBhdGNoIEVycm9yIHRvIGRpc3BsYXkgS29mZmVlIHNvdXJjZSBwb3NpdGlvbnMuXG5cbkVycm9yLnByZXBhcmVTdGFja1RyYWNlID0gKGVyciwgc3RhY2spIC0+XG4gICAgIFxuICAgIGdldFNvdXJjZU1hcHBpbmcgPSAoZmlsZW5hbWUsIGxpbmUsIGNvbHVtbikgLT5cbiAgICAgICAgc291cmNlTWFwID0gZ2V0U291cmNlTWFwIGZpbGVuYW1lXG4gICAgICAgIGFuc3dlciA9IHNvdXJjZU1hcC5zb3VyY2VMb2NhdGlvbiBbbGluZSAtIDEsIGNvbHVtbiAtIDFdIGlmIHNvdXJjZU1hcD9cbiAgICAgICAgaWYgYW5zd2VyPyB0aGVuIFthbnN3ZXJbMF0gKyAxLCBhbnN3ZXJbMV0gKyAxXSBlbHNlIG51bGxcblxuICAgIGZyYW1lcyA9IGZvciBmcmFtZSBpbiBzdGFja1xuICAgICAgICBicmVhayBpZiBmcmFtZS5nZXRGdW5jdGlvbigpIGlzIGV4cG9ydHMucnVuXG4gICAgICAgIFwiICAgICAgICBhdCAje2Zvcm1hdFNvdXJjZVBvc2l0aW9uIGZyYW1lLCBnZXRTb3VyY2VNYXBwaW5nfVwiXG5cbiAgICBcIiN7ZXJyLnRvU3RyaW5nKCl9XFxuI3tmcmFtZXMuam9pbiAnXFxuJ31cXG5cIlxuICAgIFxuIyBCYXNlZCBvbiBodHRwOi8vdjguZ29vZ2xlY29kZS5jb20vc3ZuL2JyYW5jaGVzL2JsZWVkaW5nX2VkZ2Uvc3JjL21lc3NhZ2VzLmpzXG4jIE1vZGlmaWVkIHRvIGhhbmRsZSBzb3VyY2VNYXBcblxuZm9ybWF0U291cmNlUG9zaXRpb24gPSAoZnJhbWUsIGdldFNvdXJjZU1hcHBpbmcpIC0+XG4gICAgIFxuICAgIGZpbGVuYW1lID0gdW5kZWZpbmVkXG4gICAgZmlsZUxvY2F0aW9uID0gJydcblxuICAgIGlmIGZyYW1lLmlzTmF0aXZlKClcbiAgICAgICAgZmlsZUxvY2F0aW9uID0gXCJuYXRpdmVcIlxuICAgIGVsc2VcbiAgICAgICAgaWYgZnJhbWUuaXNFdmFsKClcbiAgICAgICAgICAgIGZpbGVuYW1lID0gZnJhbWUuZ2V0U2NyaXB0TmFtZU9yU291cmNlVVJMKClcbiAgICAgICAgICAgIGZpbGVMb2NhdGlvbiA9IFwiI3tmcmFtZS5nZXRFdmFsT3JpZ2luKCl9LCBcIiB1bmxlc3MgZmlsZW5hbWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZmlsZW5hbWUgPSBmcmFtZS5nZXRGaWxlTmFtZSgpXG5cbiAgICAgICAgZmlsZW5hbWUgb3I9ICcnXG5cbiAgICAgICAgbGluZSAgID0gZnJhbWUuZ2V0TGluZU51bWJlcigpXG4gICAgICAgIGNvbHVtbiA9IGZyYW1lLmdldENvbHVtbk51bWJlcigpXG5cbiAgICAgICAgIyBDaGVjayBmb3IgYSBzb3VyY2VNYXAgcG9zaXRpb25cbiAgICAgICAgc291cmNlID0gZ2V0U291cmNlTWFwcGluZyBmaWxlbmFtZSwgbGluZSwgY29sdW1uXG4gICAgICAgIGZpbGVMb2NhdGlvbiA9XG4gICAgICAgICAgICBpZiBzb3VyY2VcbiAgICAgICAgICAgICAgICBcIiN7ZmlsZW5hbWV9OiN7c291cmNlWzBdfToje3NvdXJjZVsxXX1cIlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIFwiI3tmaWxlbmFtZX06I3tsaW5lfToje2NvbHVtbn1cIlxuXG4gICAgZnVuY3Rpb25OYW1lID0gZnJhbWUuZ2V0RnVuY3Rpb25OYW1lKClcbiAgICBpc0NvbnN0cnVjdG9yID0gZnJhbWUuaXNDb25zdHJ1Y3RvcigpXG4gICAgaXNNZXRob2RDYWxsID0gbm90IChmcmFtZS5pc1RvcGxldmVsKCkgb3IgaXNDb25zdHJ1Y3RvcilcblxuICAgIGlmIGlzTWV0aG9kQ2FsbFxuICAgICAgICBtZXRob2ROYW1lID0gZnJhbWUuZ2V0TWV0aG9kTmFtZSgpXG4gICAgICAgIHR5cGVOYW1lID0gZnJhbWUuZ2V0VHlwZU5hbWUoKVxuXG4gICAgICAgIGlmIGZ1bmN0aW9uTmFtZVxuICAgICAgICAgICAgdHAgPSBhcyA9ICcnXG4gICAgICAgICAgICBpZiB0eXBlTmFtZSBhbmQgZnVuY3Rpb25OYW1lLmluZGV4T2YgdHlwZU5hbWVcbiAgICAgICAgICAgICAgICB0cCA9IFwiI3t0eXBlTmFtZX0uXCJcbiAgICAgICAgICAgIGlmIG1ldGhvZE5hbWUgYW5kIGZ1bmN0aW9uTmFtZS5pbmRleE9mKFwiLiN7bWV0aG9kTmFtZX1cIikgIT0gZnVuY3Rpb25OYW1lLmxlbmd0aCAtIG1ldGhvZE5hbWUubGVuZ3RoIC0gMVxuICAgICAgICAgICAgICAgIGFzID0gXCIgW2FzICN7bWV0aG9kTmFtZX1dXCJcblxuICAgICAgICAgICAgXCIje3RwfSN7ZnVuY3Rpb25OYW1lfSN7YXN9ICgje2ZpbGVMb2NhdGlvbn0pXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgXCIje3R5cGVOYW1lfS4je21ldGhvZE5hbWUgb3IgJzxhbm9ueW1vdXM+J30gKCN7ZmlsZUxvY2F0aW9ufSlcIlxuICAgIGVsc2UgaWYgaXNDb25zdHJ1Y3RvclxuICAgICAgICBcIm5ldyAje2Z1bmN0aW9uTmFtZSBvciAnPGFub255bW91cz4nfSAoI3tmaWxlTG9jYXRpb259KVwiXG4gICAgZWxzZSBpZiBmdW5jdGlvbk5hbWVcbiAgICAgICAgXCIje2Z1bmN0aW9uTmFtZX0gKCN7ZmlsZUxvY2F0aW9ufSlcIlxuICAgIGVsc2VcbiAgICAgICAgZmlsZUxvY2F0aW9uXG4gICAgXG5tb2R1bGUuZXhwb3J0cyA9IFxuICAgIFxuICAgIEZJTEVfRVhURU5TSU9OUzogRklMRV9FWFRFTlNJT05TXG4gICAgVkVSU0lPTjogICAgICAgICBwa2cudmVyc2lvblxuICAgIHJ1bjogICAgICAgICAgICAgcnVuXG4gICAgZXZhbDogICAgICAgICAgICBldmFsdWF0ZVxuICAgIG5vZGVzOiAgICAgICAgICAgbm9kZXNcbiAgICBoZWxwZXJzOiAgICAgICAgIGhlbHBlcnNcbiAgICBjb21waWxlOiAgICAgICAgIGNvbXBpbGVcbiAgICB0b2tlbnM6ICAgICAgICAgIHRva2Vuc1xuICAgIHJlZ2lzdGVyOiAgICAgICAgLT4gcmVxdWlyZSAnLi9yZWdpc3RlcidcbiAgICBcbiAgICAiXX0=
//# sourceURL=../coffee/koffee.coffee