// koffee 1.9.0

/*
000   000   0000000   00000000  00000000  00000000  00000000  
000  000   000   000  000       000       000       000       
0000000    000   000  000000    000000    0000000   0000000   
000  000   000   000  000       000       000       000       
000   000   0000000   000       000       00000000  00000000
 */
var FILE_EXTENSIONS, Lexer, SourceMap, base64encode, compile, count, evaluate, formatSourcePosition, fragments, fs, getSourceMap, hasFeature, helpers, injectFeature, injectMeta, isCoffee, lexer, nodes, parser, path, pkg, ref, run, sourceMaps, sources, stringify, throwSyntaxError, tokens, updateSyntaxError, vm,
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

ref = require('./features'), hasFeature = ref.hasFeature, injectFeature = ref.injectFeature;

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
    var currentColumn, currentLine, encoded, err, extend, filename, fragment, fragments, generateSourceMap, header, i, j, js, len, len1, map, merge, newLines, ref1, ref2, ref3, ref4, sourceMapDataURI, sourceURL, token, tokens, v3SourceMap;
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
    try {
        fragments = parser.parse(tokens).compileToFragments(options);
    } catch (error) {
        err = error;
        if (err instanceof SyntaxError) {
            updateSyntaxError(err, code, (ref2 = (ref3 = options.source) != null ? ref3 : options.filename) != null ? ref2 : '', options);
        }
        throw err;
    }
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
        sourceURL = "//# sourceURL=" + ((ref4 = options.filename) != null ? ref4 : 'koffee');
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

fragments = function(code, options) {
    options = injectFeature(options);
    options = injectMeta(options);
    tokens = lexer.tokenize(code, options);
    return fragments = parser.parse(tokens).compileToFragments(options);
};

run = function(code, options) {
    var answer, dir, err, jscode, mainModule, ref1;
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
        jscode = (ref1 = answer.js) != null ? ref1 : answer;
    }
    try {
        return mainModule._compile(jscode, mainModule.filename);
    } catch (error) {
        err = error;
        updateSyntaxError(err, code, mainModule.filename, options);
        throw err;
    }
};

evaluate = function(code, options) {
    var Module, _module, _require, createContext, err, i, isContext, js, k, len, o, r, ref1, ref2, ref3, ref4, ref5, sandbox, v;
    if (options == null) {
        options = {};
    }
    if (!(code = code.trim())) {
        return;
    }
    options = injectFeature(options);
    options = injectMeta(options);
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
    o = Object.assign({}, options);
    o.bare = true;
    js = compile(code, o);
    try {
        if (sandbox === global) {
            return vm.runInThisContext(js);
        } else {
            return vm.runInContext(js, sandbox);
        }
    } catch (error) {
        err = error;
        updateSyntaxError(err, code, (ref4 = (ref5 = options.source) != null ? ref5 : options.filename) != null ? ref4 : '', options);
        throw err;
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
                console.log('[33m[93mkoffee[33m[2m.[22m[2mcoffee[22m[39m[2m[34m:[39m[22m[94m321[39m', '[1m[97m@yylloc?.first_line?[39m[22m');

                process.exit(666);
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
    fragments: fragments,
    register: function() {
        return require('./register');
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia29mZmVlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxrVEFBQTtJQUFBOztBQVVBLEVBQUEsR0FBWSxPQUFBLENBQVEsSUFBUjs7QUFDWixFQUFBLEdBQVksT0FBQSxDQUFRLElBQVI7O0FBQ1osSUFBQSxHQUFZLE9BQUEsQ0FBUSxNQUFSOztBQUNWLFFBQVUsT0FBQSxDQUFRLFNBQVI7O0FBQ1YsU0FBVyxPQUFBLENBQVEsVUFBUjs7QUFDYixPQUFBLEdBQVksT0FBQSxDQUFRLFdBQVI7O0FBQ1osU0FBQSxHQUFZLE9BQUEsQ0FBUSxhQUFSOztBQUNaLEdBQUEsR0FBWSxPQUFBLENBQVEsaUJBQVI7O0FBRVYsYUFBZSxPQUFBLENBQVEsUUFBUjs7QUFDakIsTUFBZ0MsT0FBQSxDQUFRLFlBQVIsQ0FBaEMsRUFBRSwyQkFBRixFQUFjOztBQUNaLDZDQUFGLEVBQXFCLDJDQUFyQixFQUF1QywyQkFBdkMsRUFBaUQscUJBQWpELEVBQXdEOztBQUV4RCxlQUFBLEdBQWtCLENBQUMsU0FBRCxFQUFXLFNBQVg7O0FBRWxCLFlBQUEsR0FBZSxTQUFDLEdBQUQ7SUFFWCxJQUFHLE9BQU8sTUFBUCxLQUFpQixVQUFwQjtlQUNJLE1BQU0sQ0FBQyxJQUFQLENBQVksR0FBWixDQUFnQixDQUFDLFFBQWpCLENBQTBCLFFBQTFCLEVBREo7S0FBQSxNQUVLLElBQUcsT0FBTyxJQUFQLEtBQWUsVUFBbEI7ZUFLRCxJQUFBLENBQUssa0JBQUEsQ0FBbUIsR0FBbkIsQ0FBdUIsQ0FBQyxPQUF4QixDQUFnQyxpQkFBaEMsRUFBbUQsU0FBQyxLQUFELEVBQVEsRUFBUjttQkFDcEQsTUFBTSxDQUFDLFlBQVAsQ0FBb0IsSUFBQSxHQUFPLEVBQTNCO1FBRG9ELENBQW5ELENBQUwsRUFMQztLQUFBLE1BQUE7QUFRRCxjQUFNLElBQUksS0FBSixDQUFVLDJDQUFWLEVBUkw7O0FBSk07O0FB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LEtBQTBDLFlBQVksQ0FBQyxNQUFiLEdBQXNCLFVBQVUsQ0FBQyxNQUFqQyxHQUEwQyxDQUF0RztnQkFDSSxFQUFBLEdBQUssT0FBQSxHQUFRLFVBQVIsR0FBbUIsSUFENUI7O21CQUdBLEVBQUEsR0FBRyxFQUFILEdBQVEsWUFBUixHQUF1QixFQUF2QixHQUEwQixJQUExQixHQUE4QixZQUE5QixHQUEyQyxJQVAvQztTQUFBLE1BQUE7bUJBU08sUUFBRCxHQUFVLEdBQVYsR0FBWSxDQUFDLFVBQUEsSUFBYyxhQUFmLENBQVosR0FBeUMsSUFBekMsR0FBNkMsWUFBN0MsR0FBMEQsSUFUaEU7U0FKSjtLQUFBLE1BY0ssSUFBRyxhQUFIO2VBQ0QsTUFBQSxHQUFNLENBQUMsWUFBQSxJQUFnQixhQUFqQixDQUFOLEdBQXFDLElBQXJDLEdBQXlDLFlBQXpDLEdBQXNELElBRHJEO0tBQUEsTUFFQSxJQUFHLFlBQUg7ZUFDRSxZQUFELEdBQWMsSUFBZCxHQUFrQixZQUFsQixHQUErQixJQURoQztLQUFBLE1BQUE7ZUFHRCxhQUhDOztBQS9DYzs7QUFvRHZCLE1BQU0sQ0FBQyxPQUFQLEdBRUk7SUFBQSxlQUFBLEVBQWlCLGVBQWpCO0lBQ0EsT0FBQSxFQUFpQixHQUFHLENBQUMsT0FEckI7SUFFQSxHQUFBLEVBQWlCLEdBRmpCO0lBR0EsQ0FBQSxJQUFBLENBQUEsRUFBaUIsUUFIakI7SUFJQSxLQUFBLEVBQWlCLEtBSmpCO0lBS0EsT0FBQSxFQUFpQixPQUxqQjtJQU1BLE9BQUEsRUFBaUIsT0FOakI7SUFPQSxNQUFBLEVBQWlCLE1BUGpCO0lBUUEsU0FBQSxFQUFpQixTQVJqQjtJQVNBLFFBQUEsRUFBaUIsU0FBQTtlQUFHLE9BQUEsQ0FBUSxZQUFSO0lBQUgsQ0FUakIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgXG4wMDAgIDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIFxuMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMCAgICAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbjAwMCAgMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgXG4wMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuIyMjXG5cbiMgVGhpcyBtb2R1bGUgY29udGFpbnMgdGhlIG1haW4gZW50cnkgZnVuY3Rpb25zIGZvciB0b2tlbml6aW5nLCBwYXJzaW5nLCBhbmQgY29tcGlsaW5nIGtvZmZlZSBpbnRvIEphdmFTY3JpcHQuXG5cbmZzICAgICAgICA9IHJlcXVpcmUgJ2ZzJ1xudm0gICAgICAgID0gcmVxdWlyZSAndm0nXG5wYXRoICAgICAgPSByZXF1aXJlICdwYXRoJ1xueyBMZXhlciB9ID0gcmVxdWlyZSAnLi9sZXhlcidcbnsgcGFyc2VyIH0gPSByZXF1aXJlICcuL3BhcnNlcidcbmhlbHBlcnMgICA9IHJlcXVpcmUgJy4vaGVscGVycydcblNvdXJjZU1hcCA9IHJlcXVpcmUgJy4vc291cmNlbWFwJ1xucGtnICAgICAgID0gcmVxdWlyZSAnLi4vcGFja2FnZS5qc29uJ1xuXG57IGluamVjdE1ldGEgfSA9IHJlcXVpcmUgJy4vbWV0YSdcbnsgaGFzRmVhdHVyZSwgaW5qZWN0RmVhdHVyZSB9ID0gcmVxdWlyZSAnLi9mZWF0dXJlcydcbnsgdXBkYXRlU3ludGF4RXJyb3IsIHRocm93U3ludGF4RXJyb3IsIGlzQ29mZmVlLCBjb3VudCwgc3RyaW5naWZ5IH0gPSBoZWxwZXJzXG5cbkZJTEVfRVhURU5TSU9OUyA9IFsnLmNvZmZlZScgJy5rb2ZmZWUnXVxuXG5iYXNlNjRlbmNvZGUgPSAoc3JjKSAtPlxuICAgIFxuICAgIGlmIHR5cGVvZiBCdWZmZXIgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICBCdWZmZXIuZnJvbShzcmMpLnRvU3RyaW5nKCdiYXNlNjQnKVxuICAgIGVsc2UgaWYgdHlwZW9mIGJ0b2EgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICAjIFRoZSBjb250ZW50cyBvZiBhIGA8c2NyaXB0PmAgYmxvY2sgYXJlIGVuY29kZWQgdmlhIFVURi0xNiwgc28gaWYgYW55IGV4dGVuZGVkXG4gICAgICAgICMgY2hhcmFjdGVycyBhcmUgdXNlZCBpbiB0aGUgYmxvY2ssIGJ0b2Egd2lsbCBmYWlsIGFzIGl0IG1heGVzIG91dCBhdCBVVEYtOC5cbiAgICAgICAgIyBTZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1dpbmRvd0Jhc2U2NC9CYXNlNjRfZW5jb2RpbmdfYW5kX2RlY29kaW5nI1RoZV9Vbmljb2RlX1Byb2JsZW1cbiAgICAgICAgIyBmb3IgdGhlIGdvcnkgZGV0YWlscywgYW5kIGZvciB0aGUgc29sdXRpb24gaW1wbGVtZW50ZWQgaGVyZS5cbiAgICAgICAgYnRvYSBlbmNvZGVVUklDb21wb25lbnQoc3JjKS5yZXBsYWNlIC8lKFswLTlBLUZdezJ9KS9nLCAobWF0Y2gsIHAxKSAtPlxuICAgICAgICAgICAgU3RyaW5nLmZyb21DaGFyQ29kZSAnMHgnICsgcDFcbiAgICBlbHNlXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIGJhc2U2NCBlbmNvZGUgaW5saW5lIHNvdXJjZW1hcC4nKVxuXG5sZXhlciA9IG5ldyBMZXhlciAjIEluc3RhbnRpYXRlIGEgTGV4ZXIgZm9yIG91ciB1c2UgaGVyZS5cbiAgICAgICAgICAgIFxuIyBGb3IgZWFjaCBjb21waWxlZCBmaWxlLCBzYXZlIGl0cyBzb3VyY2UgaW4gbWVtb3J5IGluIGNhc2Ugd2UgbmVlZCB0b1xuIyByZWNvbXBpbGUgaXQgbGF0ZXIuIFdlIG1pZ2h0IG5lZWQgdG8gcmVjb21waWxlIGlmIHRoZSBmaXJzdCBjb21waWxhdGlvblxuIyBkaWRu4oCZdCBjcmVhdGUgYSBzb3VyY2UgbWFwIChmYXN0ZXIpIGJ1dCBzb21ldGhpbmcgd2VudCB3cm9uZyBhbmQgd2UgbmVlZFxuIyBhIHN0YWNrIHRyYWNlLiBBc3N1bWluZyB0aGF0IG1vc3Qgb2YgdGhlIHRpbWUsIGNvZGUgaXNu4oCZdCB0aHJvd2luZ1xuIyBleGNlcHRpb25zLCBpdOKAmXMgcHJvYmFibHkgbW9yZSBlZmZpY2llbnQgdG8gY29tcGlsZSB0d2ljZSBvbmx5IHdoZW4gd2VcbiMgbmVlZCBhIHN0YWNrIHRyYWNlLCByYXRoZXIgdGhhbiBhbHdheXMgZ2VuZXJhdGluZyBhIHNvdXJjZSBtYXAgZXZlbiB3aGVuXG4jIGl04oCZcyBub3QgbGlrZWx5IHRvIGJlIHVzZWQuIFNhdmUgaW4gZm9ybSBvZiBgZmlsZW5hbWVgOiBgKHNvdXJjZSlgXG5cbnNvdXJjZXMgPSB7fVxuXG4jIEFsc28gc2F2ZSBzb3VyY2UgbWFwcyBpZiBnZW5lcmF0ZWQsIGluIGZvcm0gb2YgYGZpbGVuYW1lYDogYChzb3VyY2UgbWFwKWAuXG5cbnNvdXJjZU1hcHMgPSB7fVxuXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuXG4jIENvbXBpbGUga29mZmVlIHRvIEphdmFTY3JpcHQsIHVzaW5nIHRoZSBKaXNvbiBjb21waWxlci5cbiNcbiMgSWYgYG9wdGlvbnMuc291cmNlTWFwYCBpcyBzcGVjaWZpZWQsIHRoZW4gYG9wdGlvbnMuZmlsZW5hbWVgIG11c3QgYWxzbyBiZSBzcGVjaWZpZWQuIFxuIyBBbGwgb3B0aW9ucyB0aGF0IGNhbiBiZSBwYXNzZWQgdG8gYFNvdXJjZU1hcCNnZW5lcmF0ZWAgbWF5IGFsc28gYmUgcGFzc2VkIGhlcmUuXG4jXG4jIFRoaXMgcmV0dXJucyBhIGphdmFzY3JpcHQgc3RyaW5nLCB1bmxlc3MgYG9wdGlvbnMuc291cmNlTWFwYCBpcyBwYXNzZWQsIGluIHdoaWNoIGNhc2UgaXQgcmV0dXJucyBhIGB7anMsIHYzU291cmNlTWFwLCBzb3VyY2VNYXB9YCBvYmplY3RcblxuY29tcGlsZSA9IChjb2RlLCBvcHRpb25zKSAtPlxuICAgIFxuICAgIHsgbWVyZ2UsIGV4dGVuZCB9ID0gaGVscGVyc1xuICAgIFxuICAgIG9wdGlvbnMgPSBpbmplY3RGZWF0dXJlIG9wdGlvbnNcbiAgICBvcHRpb25zID0gaW5qZWN0TWV0YSAgICBvcHRpb25zXG4gICAgICAgIFxuICAgICMgQWx3YXlzIGdlbmVyYXRlIGEgc291cmNlIG1hcCBpZiBubyBmaWxlbmFtZSBpcyBwYXNzZWQgaW4sIHNpbmNlIHdpdGhvdXQgYVxuICAgICMgYSBmaWxlbmFtZSB3ZSBoYXZlIG5vIHdheSB0byByZXRyaWV2ZSB0aGlzIHNvdXJjZSBsYXRlciBpbiB0aGUgZXZlbnQgdGhhdFxuICAgICMgd2UgbmVlZCB0byByZWNvbXBpbGUgaXQgdG8gZ2V0IGEgc291cmNlIG1hcCBmb3IgYHByZXBhcmVTdGFja1RyYWNlYC5cbiAgICAgICAgXG4gICAgZ2VuZXJhdGVTb3VyY2VNYXAgPSBvcHRpb25zLnNvdXJjZU1hcCBvciBvcHRpb25zLmlubGluZU1hcCBvciBub3Qgb3B0aW9ucy5maWxlbmFtZT9cbiAgICBmaWxlbmFtZSA9IG9wdGlvbnMuZmlsZW5hbWUgb3IgJydcblxuICAgIHNvdXJjZXNbZmlsZW5hbWUgPyAnPyddID0gY29kZVxuICAgIG1hcCA9IG5ldyBTb3VyY2VNYXAgaWYgZ2VuZXJhdGVTb3VyY2VNYXBcblxuICAgIHRva2VucyA9IGxleGVyLnRva2VuaXplIGNvZGUsIG9wdGlvbnNcblxuICAgICMgUGFzcyBhIGxpc3Qgb2YgcmVmZXJlbmNlZCB2YXJpYWJsZXMsIHNvIHRoYXQgZ2VuZXJhdGVkIHZhcmlhYmxlcyB3b24ndCBnZXQgdGhlIHNhbWUgbmFtZS5cbiAgICBcbiAgICBvcHRpb25zLnJlZmVyZW5jZWRWYXJzID0gKCB0b2tlblsxXSBmb3IgdG9rZW4gaW4gdG9rZW5zIHdoZW4gdG9rZW5bMF0gaXMgJ0lERU5USUZJRVInIClcblxuICAgICMgQ2hlY2sgZm9yIGltcG9ydCBvciBleHBvcnQ7IGlmIGZvdW5kLCBmb3JjZSBiYXJlIG1vZGUuXG4gICAgICAgIFxuICAgIGlmIG5vdCBvcHRpb25zLmJhcmVcbiAgICAgICAgZm9yIHRva2VuIGluIHRva2Vuc1xuICAgICAgICAgICAgaWYgdG9rZW5bMF0gaW4gWydJTVBPUlQnICdFWFBPUlQnXVxuICAgICAgICAgICAgICAgIG9wdGlvbnMuYmFyZSA9IHllc1xuICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICB0cnlcbiAgICAgICAgZnJhZ21lbnRzID0gcGFyc2VyLnBhcnNlKHRva2VucykuY29tcGlsZVRvRnJhZ21lbnRzIG9wdGlvbnNcbiAgICBjYXRjaCBlcnJcbiAgICAgICAgaWYgZXJyIGluc3RhbmNlb2YgU3ludGF4RXJyb3JcbiAgICAgICAgICAgIHVwZGF0ZVN5bnRheEVycm9yIGVyciwgY29kZSwgb3B0aW9ucy5zb3VyY2UgPyBvcHRpb25zLmZpbGVuYW1lID8gJycsIG9wdGlvbnNcbiAgICAgICAgdGhyb3cgZXJyXG4gICAgICAgICAgICBcbiAgICBjdXJyZW50TGluZSA9IDBcbiAgICBjdXJyZW50TGluZSArPSAxIGlmIGhhc0ZlYXR1cmUgb3B0aW9ucywgJ2hlYWRlcidcbiAgICBjdXJyZW50Q29sdW1uID0gMFxuICAgIGpzID0gXCJcIlxuICAgIFxuICAgIGZvciBmcmFnbWVudCBpbiBmcmFnbWVudHNcbiAgICAgICAgIyBVcGRhdGUgdGhlIHNvdXJjZW1hcCB3aXRoIGRhdGEgZnJvbSBlYWNoIGZyYWdtZW50LlxuICAgICAgICBpZiBnZW5lcmF0ZVNvdXJjZU1hcFxuICAgICAgICAgICAgIyBEbyBub3QgaW5jbHVkZSBlbXB0eSwgd2hpdGVzcGFjZSwgb3Igc2VtaWNvbG9uLW9ubHkgZnJhZ21lbnRzLlxuICAgICAgICAgICAgaWYgZnJhZ21lbnQubG9jYXRpb25EYXRhIGFuZCBub3QgL15bO1xcc10qJC8udGVzdCBmcmFnbWVudC5jb2RlXG4gICAgICAgICAgICAgICAgbWFwLmFkZChcbiAgICAgICAgICAgICAgICAgICAgW2ZyYWdtZW50LmxvY2F0aW9uRGF0YS5maXJzdF9saW5lLCBmcmFnbWVudC5sb2NhdGlvbkRhdGEuZmlyc3RfY29sdW1uXVxuICAgICAgICAgICAgICAgICAgICBbY3VycmVudExpbmUsIGN1cnJlbnRDb2x1bW5dXG4gICAgICAgICAgICAgICAgICAgIHtub1JlcGxhY2U6IHRydWV9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIG5ld0xpbmVzID0gY291bnQgZnJhZ21lbnQuY29kZSwgXCJcXG5cIlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBjdXJyZW50TGluZSArPSBuZXdMaW5lc1xuICAgICAgICAgICAgaWYgbmV3TGluZXNcbiAgICAgICAgICAgICAgICBjdXJyZW50Q29sdW1uID0gZnJhZ21lbnQuY29kZS5sZW5ndGggLSAoZnJhZ21lbnQuY29kZS5sYXN0SW5kZXhPZihcIlxcblwiKSArIDEpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgY3VycmVudENvbHVtbiArPSBmcmFnbWVudC5jb2RlLmxlbmd0aFxuXG4gICAgICAgIGpzICs9IGZyYWdtZW50LmNvZGUgIyBDb3B5IHRoZSBjb2RlIGZyb20gZWFjaCBmcmFnbWVudCBpbnRvIHRoZSBmaW5hbCBKYXZhU2NyaXB0LlxuXG4gICAgaWYgaGFzRmVhdHVyZSBvcHRpb25zLCAnaGVhZGVyJ1xuICAgICAgICBoZWFkZXIgPSBcImtvZmZlZSAje0BWRVJTSU9OfVwiXG4gICAgICAgIGpzID0gXCIvLyAje2hlYWRlcn1cXG4je2pzfVwiXG5cbiAgICBpZiBnZW5lcmF0ZVNvdXJjZU1hcFxuICAgICAgICB2M1NvdXJjZU1hcCA9IG1hcC5nZW5lcmF0ZShvcHRpb25zLCBjb2RlKVxuICAgICAgICBzb3VyY2VNYXBzW2ZpbGVuYW1lID8gJz8nXSA9IG1hcFxuXG4gICAgaWYgb3B0aW9ucy5pbmxpbmVNYXBcbiAgICAgICAgZW5jb2RlZCA9IGJhc2U2NGVuY29kZSBKU09OLnN0cmluZ2lmeSB2M1NvdXJjZU1hcFxuICAgICAgICBzb3VyY2VNYXBEYXRhVVJJID0gXCIvLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LCN7ZW5jb2RlZH1cIlxuICAgICAgICBzb3VyY2VVUkwgPSBcIi8vIyBzb3VyY2VVUkw9I3tvcHRpb25zLmZpbGVuYW1lID8gJ2tvZmZlZSd9XCJcbiAgICAgICAganMgPSBcIiN7anN9XFxuI3tzb3VyY2VNYXBEYXRhVVJJfVxcbiN7c291cmNlVVJMfVwiXG5cbiAgICBpZiBvcHRpb25zLnNvdXJjZU1hcFxuICAgICAgICB7XG4gICAgICAgICAgICBqc1xuICAgICAgICAgICAgc291cmNlTWFwOiBtYXBcbiAgICAgICAgICAgIHYzU291cmNlTWFwOiBKU09OLnN0cmluZ2lmeSB2M1NvdXJjZU1hcCwgbnVsbCwgMlxuICAgICAgICB9XG4gICAgZWxzZVxuICAgICAgICBqc1xuICAgICAgICAgICAgICAgIFxuIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgIFxuIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuXG4jIFBhcnNlIGEgc3RyaW5nIG9mIEtvZmZlZSBjb2RlIG9yIGFuIGFycmF5IG9mIGxleGVkIHRva2VucywgYW5kIHJldHVybiB0aGUgQVNULiBcbiMgWW91IGNhbiB0aGVuIGNvbXBpbGUgaXQgYnkgY2FsbGluZyBgLmNvbXBpbGUoKWAgb24gdGhlIHJvb3QsIG9yIHRyYXZlcnNlIGl0IGJ5IHVzaW5nIGAudHJhdmVyc2VDaGlsZHJlbigpYCB3aXRoIGEgY2FsbGJhY2suXG5cbm5vZGVzID0gKGNvZGUsIG9wdGlvbnMpIC0+XG4gICAgXG4gICAgaWYgdHlwZW9mIGNvZGUgaXMgJ3N0cmluZydcbiAgICAgICAgcGFyc2VyLnBhcnNlIGxleGVyLnRva2VuaXplIGNvZGUsIG9wdGlvbnNcbiAgICBlbHNlXG4gICAgICAgIHBhcnNlci5wYXJzZSBjb2RlXG4gICAgXG4jIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgICAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAwMDAwICAgXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgICAgMDAwICBcbiMgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuXG50b2tlbnMgPSAoY29kZSwgb3B0aW9ucykgLT5cbiAgICBcbiAgICB0cnlcbiAgICAgICAgbGV4ZXIudG9rZW5pemUgY29kZSwgb3B0aW9uc1xuICAgIGNhdGNoIGVyclxuICAgICAgICBpZiBlcnIgaW5zdGFuY2VvZiBTeW50YXhFcnJvclxuICAgICAgICAgICAgdXBkYXRlU3ludGF4RXJyb3IgZXJyLCBjb2RlLCBvcHRpb25zLnNvdXJjZSA/IG9wdGlvbnMuZmlsZW5hbWUgPyAnJywgb3B0aW9uc1xuICAgICAgICB0aHJvdyBlcnJcbiAgICAgICAgXG4jIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcblxuZnJhZ21lbnRzID0gKGNvZGUsIG9wdGlvbnMpIC0+XG4gICAgXG4gICAgb3B0aW9ucyA9IGluamVjdEZlYXR1cmUgb3B0aW9uc1xuICAgIG9wdGlvbnMgPSBpbmplY3RNZXRhICAgIG9wdGlvbnNcbiAgICBcbiAgICB0b2tlbnMgPSBsZXhlci50b2tlbml6ZSBjb2RlLCBvcHRpb25zXG4gICAgZnJhZ21lbnRzID0gcGFyc2VyLnBhcnNlKHRva2VucykuY29tcGlsZVRvRnJhZ21lbnRzIG9wdGlvbnNcbiAgICAgICAgXG4jIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiMgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcblxuIyBDb21waWxlIGFuZCBleGVjdXRlIGEgc3RyaW5nIG9mIGtvZmZlZVxuXG5ydW4gPSAoY29kZSwgb3B0aW9ucz17fSkgLT5cbiAgICBcbiAgICBvcHRpb25zID0gaW5qZWN0RmVhdHVyZSBvcHRpb25zXG4gICAgb3B0aW9ucyA9IGluamVjdE1ldGEgICAgb3B0aW9uc1xuICAgIFxuICAgIG1haW5Nb2R1bGUgPSByZXF1aXJlLm1haW5cblxuICAgICMgU2V0IHRoZSBmaWxlbmFtZVxuICAgIFxuICAgIG1haW5Nb2R1bGUuZmlsZW5hbWUgPSBwcm9jZXNzLmFyZ3ZbMV0gPVxuICAgICAgICBpZiBvcHRpb25zLmZpbGVuYW1lIHRoZW4gZnMucmVhbHBhdGhTeW5jKG9wdGlvbnMuZmlsZW5hbWUpIGVsc2UgJydcblxuICAgIG1haW5Nb2R1bGUubW9kdWxlQ2FjaGUgYW5kPSB7fSAjIENsZWFyIHRoZSBtb2R1bGUgY2FjaGUuXG5cbiAgICAjIEFzc2lnbiBwYXRocyBmb3Igbm9kZV9tb2R1bGVzIGxvYWRpbmdcbiAgICAgICAgXG4gICAgZGlyID0gaWYgb3B0aW9ucy5maWxlbmFtZT9cbiAgICAgICAgcGF0aC5kaXJuYW1lIGZzLnJlYWxwYXRoU3luYyBvcHRpb25zLmZpbGVuYW1lXG4gICAgZWxzZVxuICAgICAgICBmcy5yZWFscGF0aFN5bmMgJy4nXG4gICAgICAgIFxuICAgIG1haW5Nb2R1bGUucGF0aHMgPSByZXF1aXJlKCdtb2R1bGUnKS5fbm9kZU1vZHVsZVBhdGhzIGRpclxuXG4gICAgaWYgbm90IGlzQ29mZmVlKG1haW5Nb2R1bGUuZmlsZW5hbWUpIG9yIHJlcXVpcmUuZXh0ZW5zaW9uc1xuICAgICAgICB0cnlcbiAgICAgICAgICAgIGFuc3dlciA9IGNvbXBpbGUgY29kZSwgb3B0aW9uc1xuICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgIHVwZGF0ZVN5bnRheEVycm9yIGVyciwgY29kZSwgbWFpbk1vZHVsZS5maWxlbmFtZSwgb3B0aW9uc1xuICAgICAgICAgICAgdGhyb3cgZXJyXG4gICAgICAgIFxuICAgICAgICBqc2NvZGUgPSBhbnN3ZXIuanMgPyBhbnN3ZXJcblxuICAgIHRyeVxuICAgICAgICBtYWluTW9kdWxlLl9jb21waWxlIGpzY29kZSwgbWFpbk1vZHVsZS5maWxlbmFtZVxuICAgIGNhdGNoIGVyclxuICAgICAgICB1cGRhdGVTeW50YXhFcnJvciBlcnIsIGNvZGUsIG1haW5Nb2R1bGUuZmlsZW5hbWUsIG9wdGlvbnNcbiAgICAgICAgdGhyb3cgZXJyXG4gICAgICAgICAgICBcbiMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuIyAwMDAwMDAwICAgIDAwMCAwMDAgICAwMDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuXG4jIENvbXBpbGUgYW5kIGV2YWx1YXRlIGEgc3RyaW5nIGluIGEgTm9kZS5qcy1saWtlIGVudmlyb25tZW50LiBUaGUgUkVQTCB1c2VzIHRoaXMgdG8gcnVuIHRoZSBpbnB1dC5cblxuZXZhbHVhdGUgPSAoY29kZSwgb3B0aW9ucz17fSkgLT4gIyBleHBvcnRlZCBhcyBldmFsXG4gICAgXG4gICAgcmV0dXJuIHVubGVzcyBjb2RlID0gY29kZS50cmltKClcbiAgICBcbiAgICBvcHRpb25zID0gaW5qZWN0RmVhdHVyZSBvcHRpb25zXG4gICAgb3B0aW9ucyA9IGluamVjdE1ldGEgICAgb3B0aW9uc1xuICAgIFxuICAgIGNyZWF0ZUNvbnRleHQgPSB2bS5jcmVhdGVDb250ZXh0XG5cbiAgICBpc0NvbnRleHQgPSB2bS5pc0NvbnRleHQgPyAoY3R4KSAtPlxuICAgICAgICBvcHRpb25zLnNhbmRib3ggaW5zdGFuY2VvZiBjcmVhdGVDb250ZXh0KCkuY29uc3RydWN0b3JcblxuICAgIGlmIGNyZWF0ZUNvbnRleHRcbiAgICAgICAgaWYgb3B0aW9ucy5zYW5kYm94P1xuICAgICAgICAgICAgaWYgaXNDb250ZXh0IG9wdGlvbnMuc2FuZGJveFxuICAgICAgICAgICAgICAgIHNhbmRib3ggPSBvcHRpb25zLnNhbmRib3hcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBzYW5kYm94ID0gY3JlYXRlQ29udGV4dCgpXG4gICAgICAgICAgICAgICAgc2FuZGJveFtrXSA9IHYgZm9yIG93biBrLCB2IG9mIG9wdGlvbnMuc2FuZGJveFxuICAgICAgICAgICAgc2FuZGJveC5nbG9iYWwgPSBzYW5kYm94LnJvb3QgPSBzYW5kYm94LkdMT0JBTCA9IHNhbmRib3hcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgc2FuZGJveCA9IGdsb2JhbFxuICAgICAgICBzYW5kYm94Ll9fZmlsZW5hbWUgPSBvcHRpb25zLmZpbGVuYW1lIHx8ICdldmFsJ1xuICAgICAgICBzYW5kYm94Ll9fZGlybmFtZSAgPSBwYXRoLmRpcm5hbWUgc2FuZGJveC5fX2ZpbGVuYW1lXG4gICAgICAgICMgZGVmaW5lIG1vZHVsZS9yZXF1aXJlIG9ubHkgaWYgdGhleSBjaG9zZSBub3QgdG8gc3BlY2lmeSB0aGVpciBvd25cbiAgICAgICAgdW5sZXNzIHNhbmRib3ggIT0gZ2xvYmFsIG9yIHNhbmRib3gubW9kdWxlIG9yIHNhbmRib3gucmVxdWlyZVxuICAgICAgICAgICAgTW9kdWxlID0gcmVxdWlyZSAnbW9kdWxlJ1xuICAgICAgICAgICAgc2FuZGJveC5tb2R1bGUgID0gX21vZHVsZSAgPSBuZXcgTW9kdWxlKG9wdGlvbnMubW9kdWxlbmFtZSB8fCAnZXZhbCcpXG4gICAgICAgICAgICBzYW5kYm94LnJlcXVpcmUgPSBfcmVxdWlyZSA9IChwYXRoKSAtPiAgTW9kdWxlLl9sb2FkIHBhdGgsIF9tb2R1bGUsIHRydWVcbiAgICAgICAgICAgIF9tb2R1bGUuZmlsZW5hbWUgPSBzYW5kYm94Ll9fZmlsZW5hbWVcbiAgICAgICAgICAgIGZvciByIGluIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzIHJlcXVpcmUgd2hlbiByIG5vdCBpbiBbJ3BhdGhzJyAnYXJndW1lbnRzJyAnY2FsbGVyJ11cbiAgICAgICAgICAgICAgICBfcmVxdWlyZVtyXSA9IHJlcXVpcmVbcl1cbiAgICAgICAgICAgICMgdXNlIHRoZSBzYW1lIGhhY2sgbm9kZSBjdXJyZW50bHkgdXNlcyBmb3IgdGhlaXIgb3duIFJFUExcbiAgICAgICAgICAgIF9yZXF1aXJlLnBhdGhzID0gX21vZHVsZS5wYXRocyA9IE1vZHVsZS5fbm9kZU1vZHVsZVBhdGhzIHByb2Nlc3MuY3dkKClcbiAgICAgICAgICAgIF9yZXF1aXJlLnJlc29sdmUgPSAocmVxdWVzdCkgLT4gTW9kdWxlLl9yZXNvbHZlRmlsZW5hbWUgcmVxdWVzdCwgX21vZHVsZVxuICAgICAgICAgICAgXG4gICAgbyA9IE9iamVjdC5hc3NpZ24ge30sIG9wdGlvbnNcbiAgICBvLmJhcmUgPSB0cnVlIFxuICAgIFxuICAgIGpzID0gY29tcGlsZSBjb2RlLCBvXG4gICAgXG4gICAgdHJ5XG4gICAgICAgIGlmIHNhbmRib3ggaXMgZ2xvYmFsXG4gICAgICAgICAgICB2bS5ydW5JblRoaXNDb250ZXh0IGpzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHZtLnJ1bkluQ29udGV4dCBqcywgc2FuZGJveFxuICAgIGNhdGNoIGVyclxuICAgICAgICB1cGRhdGVTeW50YXhFcnJvciBlcnIsIGNvZGUsIG9wdGlvbnMuc291cmNlID8gb3B0aW9ucy5maWxlbmFtZSA/ICcnLCBvcHRpb25zXG4gICAgICAgIHRocm93IGVyclxuICAgIFxuIyAwMDAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiMgMDAwICAgICAgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgICAgIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuIyAwMDAgICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG5cbiMgVGhlIHJlYWwgTGV4ZXIgcHJvZHVjZXMgYSBnZW5lcmljIHN0cmVhbSBvZiB0b2tlbnMuIFxuIyBUaGlzIG9iamVjdCBwcm92aWRlcyBhIHRoaW4gd3JhcHBlciBhcm91bmQgaXQsIGNvbXBhdGlibGUgd2l0aCB0aGUgSmlzb24gQVBJLiBcbiMgV2UgY2FuIHRoZW4gcGFzcyBpdCBkaXJlY3RseSBhcyBhIFwiSmlzb24gbGV4ZXJcIi5cblxucGFyc2VyLmxleGVyID1cbiAgICBcbiAgICBsZXg6IC0+XG4gICAgICAgIHRva2VuID0gcGFyc2VyLnRva2Vuc1tAcG9zKytdXG4gICAgICAgIGlmIHRva2VuXG4gICAgICAgICAgICBbdGFnLCBAeXl0ZXh0LCBAeXlsbG9jXSA9IHRva2VuXG4gICAgICAgICAgICBwYXJzZXIuZXJyb3JUb2tlbiA9IHRva2VuLm9yaWdpbiBvciB0b2tlblxuICAgICAgICAgICAg4pa4YXNzZXJ0IFwiQHl5bGxvYz8uZmlyc3RfbGluZT9cIiBAeXlsbG9jPy5maXJzdF9saW5lP1xuICAgICAgICAgICAgQHl5bGluZW5vID0gQHl5bGxvYy5maXJzdF9saW5lXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHRhZyA9ICcnXG4gICAgICAgIHRhZ1xuICAgICAgICBcbiAgICBzZXRJbnB1dDogKHRva2VucykgLT5cbiAgICAgICAgcGFyc2VyLnRva2VucyA9IHRva2Vuc1xuICAgICAgICBAcG9zID0gMFxuICAgICAgICBcbiAgICB1cGNvbWluZ0lucHV0OiAtPiBcIlwiXG4gICAgICAgIFxucGFyc2VyLnl5ID0gcmVxdWlyZSAnLi9ub2RlcycgIyBNYWtlIGFsbCB0aGUgQVNUIG5vZGVzIHZpc2libGUgdG8gdGhlIHBhcnNlci5cblxucGFyc2VyLnl5LnBhcnNlRXJyb3IgPSAobWVzc2FnZSwge3Rva2VufSkgLT4gIyBPdmVycmlkZSBKaXNvbidzIGRlZmF1bHQgZXJyb3IgaGFuZGxpbmcgZnVuY3Rpb24uXG4gICAgXG4gICAgIyBEaXNyZWdhcmQgSmlzb24ncyBtZXNzYWdlLCBpdCBjb250YWlucyByZWR1bmRhbnQgbGluZSBudW1iZXIgaW5mb3JtYXRpb24uXG4gICAgIyBEaXNyZWdhcmQgdGhlIHRva2VuLCB3ZSB0YWtlIGl0cyB2YWx1ZSBkaXJlY3RseSBmcm9tIHRoZSBsZXhlciBpbiBjYXNlXG4gICAgIyB0aGUgZXJyb3IgaXMgY2F1c2VkIGJ5IGEgZ2VuZXJhdGVkIHRva2VuIHdoaWNoIG1pZ2h0IHJlZmVyIHRvIGl0cyBvcmlnaW4uXG4gICAgXG4gICAge2Vycm9yVG9rZW4sIHRva2Vuc30gPSBwYXJzZXJcbiAgICBbZXJyb3JUYWcsIGVycm9yVGV4dCwgZXJyb3JMb2NdID0gZXJyb3JUb2tlblxuXG4gICAgZXJyb3JUZXh0ID0gc3dpdGNoXG4gICAgICAgIHdoZW4gZXJyb3JUb2tlbiBpcyB0b2tlbnNbdG9rZW5zLmxlbmd0aCAtIDFdXG4gICAgICAgICAgICAnZW5kIG9mIGlucHV0J1xuICAgICAgICB3aGVuIGVycm9yVGFnIGluIFsnSU5ERU5UJyAnT1VUREVOVCddXG4gICAgICAgICAgICAnaW5kZW50YXRpb24nXG4gICAgICAgIHdoZW4gZXJyb3JUYWcgaW4gWydJREVOVElGSUVSJyAnTlVNQkVSJyAnSU5GSU5JVFknICdTVFJJTkcnICdTVFJJTkdfU1RBUlQnICdSRUdFWCcgJ1JFR0VYX1NUQVJUJ11cbiAgICAgICAgICAgIGVycm9yVGFnLnJlcGxhY2UoL19TVEFSVCQvLCAnJykudG9Mb3dlckNhc2UoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzd2l0Y2ggZXJyb3JUZXh0ICMgbmFtZSB3aGl0ZXNwYWNlIGNoYXJhY3RlclxuICAgICAgICAgICAgICAgIHdoZW4gJyAnICB0aGVuICdzcGFjZSdcbiAgICAgICAgICAgICAgICB3aGVuICdcXG4nIHRoZW4gJ25ld2xpbmUnXG4gICAgICAgICAgICAgICAgd2hlbiAnXFxyJyB0aGVuICdjYXJyaWFnZSByZXR1cm4nXG4gICAgICAgICAgICAgICAgd2hlbiAnXFx0JyB0aGVuICd0YWInXG4gICAgICAgICAgICAgICAgZWxzZSBlcnJvclRleHRcbiAgICAgICAgICAgIFxuICAgICMgVGhlIHNlY29uZCBhcmd1bWVudCBoYXMgYSBgbG9jYCBwcm9wZXJ0eSwgd2hpY2ggc2hvdWxkIGhhdmUgdGhlIGxvY2F0aW9uIGRhdGEgZm9yIHRoaXMgdG9rZW4uIFxuICAgICMgVW5mb3J0dW5hdGVseSwgSmlzb24gc2VlbXMgdG8gc2VuZCBhbiBvdXRkYXRlZCBgbG9jYCAoZnJvbSB0aGUgcHJldmlvdXMgdG9rZW4pLCBcbiAgICAjIHNvIHdlIHRha2UgdGhlIGxvY2F0aW9uIGluZm9ybWF0aW9uIGRpcmVjdGx5IGZyb20gdGhlIGxleGVyLlxuICAgIFxuICAgIHRocm93U3ludGF4RXJyb3IgbW9kdWxlOidrb2ZmZWUnLCBtZXNzYWdlOlwidW5leHBlY3RlZCAje2Vycm9yVGV4dH1cIiwgbG9jYXRpb246ZXJyb3JMb2NcblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiMgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG5cbmdldFNvdXJjZU1hcCA9IChmaWxlbmFtZSkgLT5cbiAgICAgXG4gICAgIyBLb2ZmZWUgY29tcGlsZWQgaW4gYSBicm93c2VyIG1heSBnZXQgY29tcGlsZWQgd2l0aCBgb3B0aW9ucy5maWxlbmFtZWAgb2YgYDxhbm9ueW1vdXM+YCwgXG4gICAgIyBidXQgdGhlIGJyb3dzZXIgbWF5IHJlcXVlc3QgdGhlIHN0YWNrIHRyYWNlIHdpdGggdGhlIGZpbGVuYW1lIG9mIHRoZSBzY3JpcHQgZmlsZS5cbiAgICBcbiAgICBpZiBzb3VyY2VNYXBzW2ZpbGVuYW1lXT9cbiAgICAgICAgc291cmNlTWFwc1tmaWxlbmFtZV1cbiAgICBlbHNlIGlmIHNvdXJjZU1hcHNbJz8nXT9cbiAgICAgICAgc291cmNlTWFwc1snPyddXG4gICAgZWxzZSBpZiBzb3VyY2VzW2ZpbGVuYW1lID8gJz8nXT9cbiAgICAgICAgYW5zd2VyID0gY29tcGlsZSBzb3VyY2VzW2ZpbGVuYW1lID8gJz8nXSxcbiAgICAgICAgICAgIGZpbGVuYW1lOiBmaWxlbmFtZVxuICAgICAgICAgICAgc291cmNlTWFwOiB5ZXNcbiAgICAgICAgYW5zd2VyLnNvdXJjZU1hcFxuICAgIGVsc2VcbiAgICAgICAgbnVsbFxuXG4jICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgXG4jICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuXG4jIEJhc2VkIG9uIFttaWNoYWVsZmljYXJyYS9Lb2ZmZWVSZWR1eF0oaHR0cDovL2dvby5nbC9aVHgxcClcbiMgTm9kZUpTIC8gVjggaGF2ZSBubyBzdXBwb3J0IGZvciB0cmFuc2Zvcm1pbmcgcG9zaXRpb25zIGluIHN0YWNrIHRyYWNlcyB1c2luZ1xuIyBzb3VyY2VNYXAsIHNvIHdlIG11c3QgbW9ua2V5LXBhdGNoIEVycm9yIHRvIGRpc3BsYXkgS29mZmVlIHNvdXJjZSBwb3NpdGlvbnMuXG5cbiMgRXJyb3IucHJlcGFyZVN0YWNrVHJhY2UgPSAoZXJyLCBzdGFjaykgLT5cbiMgICAgICAgXG4gICAgIyAjIGxvZyAncHJlcGFyZVN0YWNrVHJhY2UgLS0tJywgZXJyLnN0YWNrIFxuICAgICMgIyBsb2cgJ3ByZXBhcmVTdGFja1RyYWNlJywgc3RhY2tbMF0uZ2V0RnVuY3Rpb24oKVxuICAgICMgIyBsb2cgJ3ByZXBhcmVTdGFja1RyYWNlJywgc3RhY2tbMF0uZ2V0TGluZU51bWJlcigpXG4gICAgIyAjIGxvZyAncHJlcGFyZVN0YWNrVHJhY2UnLCBzdGFja1swXS5nZXRDb2x1bW5OdW1iZXIoKVxuIyAgICAgICBcbiAgICAjIGdldFNvdXJjZU1hcHBpbmcgPSAoZmlsZW5hbWUsIGxpbmUsIGNvbHVtbikgLT5cbiAgICAgICAgIyBzb3VyY2VNYXAgPSBnZXRTb3VyY2VNYXAgZmlsZW5hbWVcbiAgICAgICAgIyBhbnN3ZXIgPSBzb3VyY2VNYXAuc291cmNlTG9jYXRpb24gW2xpbmUgLSAxLCBjb2x1bW4gLSAxXSBpZiBzb3VyY2VNYXA/XG4gICAgICAgICMgaWYgYW5zd2VyPyB0aGVuIFthbnN3ZXJbMF0gKyAxLCBhbnN3ZXJbMV0gKyAxXSBlbHNlIG51bGxcblxuICAgICMgZnJhbWVzID0gZm9yIGZyYW1lIGluIHN0YWNrXG4gICAgICAgICMgYnJlYWsgaWYgZnJhbWUuZ2V0RnVuY3Rpb24oKSBpcyBleHBvcnRzLnJ1blxuICAgICAgICAjIFwiICAgICAgICBhdCAje2Zvcm1hdFNvdXJjZVBvc2l0aW9uIGZyYW1lLCBnZXRTb3VyY2VNYXBwaW5nfVwiXG5cbiAgICAjIHJlc3VsdCA9IFwiI3tlcnIudG9TdHJpbmcoKX1cXG4je2ZyYW1lcy5qb2luICdcXG4nfVxcblwiXG4gICAgIyAjIGxvZyAncHJlcGFyZVN0YWNrVHJhY2UgcmVzdWx0OicsIHJlc3VsdCAgICBcbiAgICAjIHJlc3VsdFxuICAgIFxuIyBCYXNlZCBvbiBodHRwOi8vdjguZ29vZ2xlY29kZS5jb20vc3ZuL2JyYW5jaGVzL2JsZWVkaW5nX2VkZ2Uvc3JjL21lc3NhZ2VzLmpzXG4jIE1vZGlmaWVkIHRvIGhhbmRsZSBzb3VyY2VNYXBcblxuZm9ybWF0U291cmNlUG9zaXRpb24gPSAoZnJhbWUsIGdldFNvdXJjZU1hcHBpbmcpIC0+XG4gICAgIFxuICAgIGZpbGVuYW1lID0gdW5kZWZpbmVkXG4gICAgZmlsZUxvY2F0aW9uID0gJydcblxuICAgIGlmIGZyYW1lLmlzTmF0aXZlKClcbiAgICAgICAgZmlsZUxvY2F0aW9uID0gXCJuYXRpdmVcIlxuICAgIGVsc2VcbiAgICAgICAgaWYgZnJhbWUuaXNFdmFsKClcbiAgICAgICAgICAgIGZpbGVuYW1lID0gZnJhbWUuZ2V0U2NyaXB0TmFtZU9yU291cmNlVVJMKClcbiAgICAgICAgICAgIGZpbGVMb2NhdGlvbiA9IFwiI3tmcmFtZS5nZXRFdmFsT3JpZ2luKCl9LCBcIiB1bmxlc3MgZmlsZW5hbWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZmlsZW5hbWUgPSBmcmFtZS5nZXRGaWxlTmFtZSgpXG5cbiAgICAgICAgZmlsZW5hbWUgb3I9ICcnXG5cbiAgICAgICAgbGluZSAgID0gZnJhbWUuZ2V0TGluZU51bWJlcigpXG4gICAgICAgIGNvbHVtbiA9IGZyYW1lLmdldENvbHVtbk51bWJlcigpXG5cbiAgICAgICAgIyBDaGVjayBmb3IgYSBzb3VyY2VNYXAgcG9zaXRpb25cbiAgICAgICAgc291cmNlID0gZ2V0U291cmNlTWFwcGluZyBmaWxlbmFtZSwgbGluZSwgY29sdW1uXG4gICAgICAgIGZpbGVMb2NhdGlvbiA9XG4gICAgICAgICAgICBpZiBzb3VyY2VcbiAgICAgICAgICAgICAgICBcIiN7ZmlsZW5hbWV9OiN7c291cmNlWzBdfToje3NvdXJjZVsxXX1cIlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIFwiI3tmaWxlbmFtZX06I3tsaW5lfToje2NvbHVtbn1cIlxuXG4gICAgZnVuY3Rpb25OYW1lID0gZnJhbWUuZ2V0RnVuY3Rpb25OYW1lKClcbiAgICBpc0NvbnN0cnVjdG9yID0gZnJhbWUuaXNDb25zdHJ1Y3RvcigpXG4gICAgaXNNZXRob2RDYWxsID0gbm90IChmcmFtZS5pc1RvcGxldmVsKCkgb3IgaXNDb25zdHJ1Y3RvcilcblxuICAgIGlmIGlzTWV0aG9kQ2FsbFxuICAgICAgICBtZXRob2ROYW1lID0gZnJhbWUuZ2V0TWV0aG9kTmFtZSgpXG4gICAgICAgIHR5cGVOYW1lID0gZnJhbWUuZ2V0VHlwZU5hbWUoKVxuXG4gICAgICAgIGlmIGZ1bmN0aW9uTmFtZVxuICAgICAgICAgICAgdHAgPSBhcyA9ICcnXG4gICAgICAgICAgICBpZiB0eXBlTmFtZSBhbmQgZnVuY3Rpb25OYW1lLmluZGV4T2YgdHlwZU5hbWVcbiAgICAgICAgICAgICAgICB0cCA9IFwiI3t0eXBlTmFtZX0uXCJcbiAgICAgICAgICAgIGlmIG1ldGhvZE5hbWUgYW5kIGZ1bmN0aW9uTmFtZS5pbmRleE9mKFwiLiN7bWV0aG9kTmFtZX1cIikgIT0gZnVuY3Rpb25OYW1lLmxlbmd0aCAtIG1ldGhvZE5hbWUubGVuZ3RoIC0gMVxuICAgICAgICAgICAgICAgIGFzID0gXCIgW2FzICN7bWV0aG9kTmFtZX1dXCJcblxuICAgICAgICAgICAgXCIje3RwfSN7ZnVuY3Rpb25OYW1lfSN7YXN9ICgje2ZpbGVMb2NhdGlvbn0pXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgXCIje3R5cGVOYW1lfS4je21ldGhvZE5hbWUgb3IgJzxhbm9ueW1vdXM+J30gKCN7ZmlsZUxvY2F0aW9ufSlcIlxuICAgIGVsc2UgaWYgaXNDb25zdHJ1Y3RvclxuICAgICAgICBcIm5ldyAje2Z1bmN0aW9uTmFtZSBvciAnPGFub255bW91cz4nfSAoI3tmaWxlTG9jYXRpb259KVwiXG4gICAgZWxzZSBpZiBmdW5jdGlvbk5hbWVcbiAgICAgICAgXCIje2Z1bmN0aW9uTmFtZX0gKCN7ZmlsZUxvY2F0aW9ufSlcIlxuICAgIGVsc2VcbiAgICAgICAgZmlsZUxvY2F0aW9uXG4gICAgXG5tb2R1bGUuZXhwb3J0cyA9IFxuICAgIFxuICAgIEZJTEVfRVhURU5TSU9OUzogRklMRV9FWFRFTlNJT05TXG4gICAgVkVSU0lPTjogICAgICAgICBwa2cudmVyc2lvblxuICAgIHJ1bjogICAgICAgICAgICAgcnVuXG4gICAgZXZhbDogICAgICAgICAgICBldmFsdWF0ZVxuICAgIG5vZGVzOiAgICAgICAgICAgbm9kZXNcbiAgICBoZWxwZXJzOiAgICAgICAgIGhlbHBlcnNcbiAgICBjb21waWxlOiAgICAgICAgIGNvbXBpbGVcbiAgICB0b2tlbnM6ICAgICAgICAgIHRva2Vuc1xuICAgIGZyYWdtZW50czogICAgICAgZnJhZ21lbnRzXG4gICAgcmVnaXN0ZXI6ICAgICAgICAtPiByZXF1aXJlICcuL3JlZ2lzdGVyJ1xuICAgIFxuICAgICJdfQ==
//# sourceURL=../coffee/koffee.coffee