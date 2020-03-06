// koffee 1.12.0

/*
000   000   0000000   00000000  00000000  00000000  00000000  
000  000   000   000  000       000       000       000       
0000000    000   000  000000    000000    0000000   0000000   
000  000   000   000  000       000       000       000       
000   000   0000000   000       000       00000000  00000000
 */
var FILE_EXTENSIONS, Lexer, SourceMap, base64encode, compile, compileOptions, count, evaluate, formatSourcePosition, fragments, fs, getSourceMap, hasFeature, helpers, injectFeature, injectMeta, isCoffee, lexer, nodes, parser, path, pkg, ref, run, slash, sourceMaps, sources, stringify, throwSyntaxError, tokens, updateSyntaxError, vm,
    hasProp = {}.hasOwnProperty;

fs = require('fs');

vm = require('vm');

path = require('path');

slash = require('kslash');

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

compileOptions = function(source, opts) {
    var copts, cwd, jsDir, jsPath, ref1, srcRoot;
    copts = Object.assign({}, opts);
    if (source) {
        cwd = process.cwd();
        jsPath = (ref1 = opts.generatedFile) != null ? ref1 : slash.swapExt(source, 'js');
        jsDir = slash.isAbsolute(jsPath) && slash.dirname(jsPath) || cwd;
        srcRoot = slash.relative(slash.dir(source), jsDir);
        copts = helpers.merge(copts, {
            jsPath: jsPath,
            source: source,
            sourceRoot: srcRoot,
            sourceFiles: [slash.relative(source, slash.join(jsDir, srcRoot))],
            generatedFile: slash.file(jsPath)
        });
    }
    return copts;
};

compile = function(code, options) {
    var currentColumn, currentLine, encoded, err, filename, fragment, fragments, generateSourceMap, header, i, j, js, len, len1, map, newLines, ref1, ref2, ref3, ref4, sourceMapDataURI, sourceURL, token, tokens, v3SourceMap;
    options = injectFeature(options);
    options = injectMeta(options);
    options = compileOptions(options.source, options);
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
                klog('[33m[93mkoffee[33m[2m.[22m[2mcoffee[22m[39m[2m[34m:[39m[22m[94m343[39m', '[1m[97m@yylloc?.first_line?[39m[22m');

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
    compileOptions: compileOptions,
    tokens: tokens,
    fragments: fragments,
    register: function() {
        return require('./register');
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia29mZmVlLmpzIiwic291cmNlUm9vdCI6Ii4uL2NvZmZlZSIsInNvdXJjZXMiOlsia29mZmVlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx5VUFBQTtJQUFBOztBQVVBLEVBQUEsR0FBWSxPQUFBLENBQVEsSUFBUjs7QUFDWixFQUFBLEdBQVksT0FBQSxDQUFRLElBQVI7O0FBQ1osSUFBQSxHQUFZLE9BQUEsQ0FBUSxNQUFSOztBQUNaLEtBQUEsR0FBWSxPQUFBLENBQVEsUUFBUjs7QUFDVixRQUFVLE9BQUEsQ0FBUSxTQUFSOztBQUNWLFNBQVcsT0FBQSxDQUFRLFVBQVI7O0FBQ2IsT0FBQSxHQUFZLE9BQUEsQ0FBUSxXQUFSOztBQUNaLFNBQUEsR0FBWSxPQUFBLENBQVEsYUFBUjs7QUFDWixHQUFBLEdBQVksT0FBQSxDQUFRLGlCQUFSOztBQUVWLGFBQWUsT0FBQSxDQUFRLFFBQVI7O0FBQ2pCLE1BQWdDLE9BQUEsQ0FBUSxZQUFSLENBQWhDLEVBQUUsMkJBQUYsRUFBYzs7QUFDWiw2Q0FBRixFQUFxQiwyQ0FBckIsRUFBdUMsMkJBQXZDLEVBQWlELHFCQUFqRCxFQUF3RDs7QUFFeEQsZUFBQSxHQUFrQixDQUFDLFNBQUQsRUFBVyxTQUFYOztBQUVsQixZQUFBLEdBQWUsU0FBQyxHQUFEO0lBRVgsSUFBRyxPQUFPLE1BQVAsS0FBaUIsVUFBcEI7ZUFDSSxNQUFNLENBQUMsSUFBUCxDQUFZLEdBQVosQ0FBZ0IsQ0FBQyxRQUFqQixDQUEwQixRQUExQixFQURKO0tBQUEsTUFFSyxJQUFHLE9BQU8sSUFBUCxLQUFlLFVBQWxCO2VBS0QsSUFBQSxDQUFLLGtCQUFBLENBQW1CLEdBQW5CLENBQXVCLENBQUMsT0FBeEIsQ0FBZ0MsaUJBQWhDLEVBQW1ELFNBQUMsS0FBRCxFQUFRLEVBQVI7bUJBQ3BELE1BQU0sQ0FBQyxZQUFQLENBQW9CLElBQUEsR0FBTyxFQUEzQjtRQURvRCxDQUFuRCxDQUFMLEVBTEM7S0FB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OEIsWUFBOUIsR0FBMkMsSUFQL0M7U0FBQSxNQUFBO21CQVNPLFFBQUQsR0FBVSxHQUFWLEdBQVksQ0FBQyxVQUFBLElBQWMsYUFBZixDQUFaLEdBQXlDLElBQXpDLEdBQTZDLFlBQTdDLEdBQTBELElBVGhFO1NBSko7S0FBQSxNQWNLLElBQUcsYUFBSDtlQUNELE1BQUEsR0FBTSxDQUFDLFlBQUEsSUFBZ0IsYUFBakIsQ0FBTixHQUFxQyxJQUFyQyxHQUF5QyxZQUF6QyxHQUFzRCxJQURyRDtLQUFBLE1BRUEsSUFBRyxZQUFIO2VBQ0UsWUFBRCxHQUFjLElBQWQsR0FBa0IsWUFBbEIsR0FBK0IsSUFEaEM7S0FBQSxNQUFBO2VBR0QsYUFIQzs7QUEvQ2M7O0FBb0R2QixNQUFNLENBQUMsT0FBUCxHQUVJO0lBQUEsZUFBQSxFQUFpQixlQUFqQjtJQUNBLE9BQUEsRUFBaUIsR0FBRyxDQUFDLE9BRHJCO0lBRUEsR0FBQSxFQUFpQixHQUZqQjtJQUdBLENBQUEsSUFBQSxDQUFBLEVBQWlCLFFBSGpCO0lBSUEsS0FBQSxFQUFpQixLQUpqQjtJQUtBLE9BQUEsRUFBaUIsT0FMakI7SUFNQSxPQUFBLEVBQWlCLE9BTmpCO0lBT0EsY0FBQSxFQUFpQixjQVBqQjtJQVFBLE1BQUEsRUFBaUIsTUFSakI7SUFTQSxTQUFBLEVBQWlCLFNBVGpCO0lBVUEsUUFBQSxFQUFpQixTQUFBO2VBQUcsT0FBQSxDQUFRLFlBQVI7SUFBSCxDQVZqQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICBcbjAwMCAgMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgXG4wMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwICAgIDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuMDAwICAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICBcbjAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMDAwMDAwICAwMDAwMDAwMCAgXG4jIyNcblxuIyBUaGlzIG1vZHVsZSBjb250YWlucyB0aGUgbWFpbiBlbnRyeSBmdW5jdGlvbnMgZm9yIHRva2VuaXppbmcsIHBhcnNpbmcsIGFuZCBjb21waWxpbmcga29mZmVlIGludG8gSmF2YVNjcmlwdC5cblxuZnMgICAgICAgID0gcmVxdWlyZSAnZnMnXG52bSAgICAgICAgPSByZXF1aXJlICd2bSdcbnBhdGggICAgICA9IHJlcXVpcmUgJ3BhdGgnXG5zbGFzaCAgICAgPSByZXF1aXJlICdrc2xhc2gnXG57IExleGVyIH0gPSByZXF1aXJlICcuL2xleGVyJ1xueyBwYXJzZXIgfSA9IHJlcXVpcmUgJy4vcGFyc2VyJ1xuaGVscGVycyAgID0gcmVxdWlyZSAnLi9oZWxwZXJzJ1xuU291cmNlTWFwID0gcmVxdWlyZSAnLi9zb3VyY2VtYXAnXG5wa2cgICAgICAgPSByZXF1aXJlICcuLi9wYWNrYWdlLmpzb24nXG5cbnsgaW5qZWN0TWV0YSB9ID0gcmVxdWlyZSAnLi9tZXRhJ1xueyBoYXNGZWF0dXJlLCBpbmplY3RGZWF0dXJlIH0gPSByZXF1aXJlICcuL2ZlYXR1cmVzJ1xueyB1cGRhdGVTeW50YXhFcnJvciwgdGhyb3dTeW50YXhFcnJvciwgaXNDb2ZmZWUsIGNvdW50LCBzdHJpbmdpZnkgfSA9IGhlbHBlcnNcblxuRklMRV9FWFRFTlNJT05TID0gWycuY29mZmVlJyAnLmtvZmZlZSddXG5cbmJhc2U2NGVuY29kZSA9IChzcmMpIC0+XG4gICAgXG4gICAgaWYgdHlwZW9mIEJ1ZmZlciBpcyAnZnVuY3Rpb24nXG4gICAgICAgIEJ1ZmZlci5mcm9tKHNyYykudG9TdHJpbmcoJ2Jhc2U2NCcpXG4gICAgZWxzZSBpZiB0eXBlb2YgYnRvYSBpcyAnZnVuY3Rpb24nXG4gICAgICAgICMgVGhlIGNvbnRlbnRzIG9mIGEgYDxzY3JpcHQ+YCBibG9jayBhcmUgZW5jb2RlZCB2aWEgVVRGLTE2LCBzbyBpZiBhbnkgZXh0ZW5kZWRcbiAgICAgICAgIyBjaGFyYWN0ZXJzIGFyZSB1c2VkIGluIHRoZSBibG9jaywgYnRvYSB3aWxsIGZhaWwgYXMgaXQgbWF4ZXMgb3V0IGF0IFVURi04LlxuICAgICAgICAjIFNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvV2luZG93QmFzZTY0L0Jhc2U2NF9lbmNvZGluZ19hbmRfZGVjb2RpbmcjVGhlX1VuaWNvZGVfUHJvYmxlbVxuICAgICAgICAjIGZvciB0aGUgZ29yeSBkZXRhaWxzLCBhbmQgZm9yIHRoZSBzb2x1dGlvbiBpbXBsZW1lbnRlZCBoZXJlLlxuICAgICAgICBidG9hIGVuY29kZVVSSUNvbXBvbmVudChzcmMpLnJlcGxhY2UgLyUoWzAtOUEtRl17Mn0pL2csIChtYXRjaCwgcDEpIC0+XG4gICAgICAgICAgICBTdHJpbmcuZnJvbUNoYXJDb2RlICcweCcgKyBwMVxuICAgIGVsc2VcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gYmFzZTY0IGVuY29kZSBpbmxpbmUgc291cmNlbWFwLicpXG5cbmxleGVyID0gbmV3IExleGVyICMgSW5zdGFudGlhdGUgYSBMZXhlciBmb3Igb3VyIHVzZSBoZXJlLlxuICAgICAgICAgICAgXG4jIEZvciBlYWNoIGNvbXBpbGVkIGZpbGUsIHNhdmUgaXRzIHNvdXJjZSBpbiBtZW1vcnkgaW4gY2FzZSB3ZSBuZWVkIHRvXG4jIHJlY29tcGlsZSBpdCBsYXRlci4gV2UgbWlnaHQgbmVlZCB0byByZWNvbXBpbGUgaWYgdGhlIGZpcnN0IGNvbXBpbGF0aW9uXG4jIGRpZG7igJl0IGNyZWF0ZSBhIHNvdXJjZSBtYXAgKGZhc3RlcikgYnV0IHNvbWV0aGluZyB3ZW50IHdyb25nIGFuZCB3ZSBuZWVkXG4jIGEgc3RhY2sgdHJhY2UuIEFzc3VtaW5nIHRoYXQgbW9zdCBvZiB0aGUgdGltZSwgY29kZSBpc27igJl0IHRocm93aW5nXG4jIGV4Y2VwdGlvbnMsIGl04oCZcyBwcm9iYWJseSBtb3JlIGVmZmljaWVudCB0byBjb21waWxlIHR3aWNlIG9ubHkgd2hlbiB3ZVxuIyBuZWVkIGEgc3RhY2sgdHJhY2UsIHJhdGhlciB0aGFuIGFsd2F5cyBnZW5lcmF0aW5nIGEgc291cmNlIG1hcCBldmVuIHdoZW5cbiMgaXTigJlzIG5vdCBsaWtlbHkgdG8gYmUgdXNlZC4gU2F2ZSBpbiBmb3JtIG9mIGBmaWxlbmFtZWA6IGAoc291cmNlKWBcblxuc291cmNlcyA9IHt9XG5cbiMgQWxzbyBzYXZlIHNvdXJjZSBtYXBzIGlmIGdlbmVyYXRlZCwgaW4gZm9ybSBvZiBgZmlsZW5hbWVgOiBgKHNvdXJjZSBtYXApYC5cblxuc291cmNlTWFwcyA9IHt9XG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG5cbiMgQ29tcGlsZSBrb2ZmZWUgdG8gSmF2YVNjcmlwdCwgdXNpbmcgdGhlIEppc29uIGNvbXBpbGVyLlxuI1xuIyBJZiBgb3B0aW9ucy5zb3VyY2VNYXBgIGlzIHNwZWNpZmllZCwgdGhlbiBgb3B0aW9ucy5maWxlbmFtZWAgbXVzdCBhbHNvIGJlIHNwZWNpZmllZC4gXG4jIEFsbCBvcHRpb25zIHRoYXQgY2FuIGJlIHBhc3NlZCB0byBgU291cmNlTWFwI2dlbmVyYXRlYCBtYXkgYWxzbyBiZSBwYXNzZWQgaGVyZS5cbiNcbiMgVGhpcyByZXR1cm5zIGEgamF2YXNjcmlwdCBzdHJpbmcsIHVubGVzcyBgb3B0aW9ucy5zb3VyY2VNYXBgIGlzIHBhc3NlZCwgaW4gd2hpY2ggY2FzZSBpdCByZXR1cm5zIGEgYHtqcywgdjNTb3VyY2VNYXAsIHNvdXJjZU1hcH1gIG9iamVjdFxuXG5jb21waWxlT3B0aW9ucyA9IChzb3VyY2UsIG9wdHMpIC0+XG4gICAgXG4gICAgY29wdHMgPSBPYmplY3QuYXNzaWduIHt9LCBvcHRzXG5cbiAgICBpZiBzb3VyY2VcbiAgICAgICAgXG4gICAgICAgIGN3ZCAgICAgPSBwcm9jZXNzLmN3ZCgpXG4gICAgICAgIGpzUGF0aCAgPSBvcHRzLmdlbmVyYXRlZEZpbGUgPyBzbGFzaC5zd2FwRXh0IHNvdXJjZSwgJ2pzJ1xuICAgICAgICBqc0RpciAgID0gc2xhc2guaXNBYnNvbHV0ZShqc1BhdGgpIGFuZCBzbGFzaC5kaXJuYW1lKGpzUGF0aCkgb3IgY3dkXG4gICAgICAgIHNyY1Jvb3QgPSBzbGFzaC5yZWxhdGl2ZSBzbGFzaC5kaXIoc291cmNlKSwganNEaXJcbiAgICAgICAgY29wdHMgPSBoZWxwZXJzLm1lcmdlIGNvcHRzLCB7XG4gICAgICAgICAgICBqc1BhdGhcbiAgICAgICAgICAgIHNvdXJjZTogICAgICAgIHNvdXJjZVxuICAgICAgICAgICAgc291cmNlUm9vdDogICAgc3JjUm9vdFxuICAgICAgICAgICAgc291cmNlRmlsZXM6ICAgW3NsYXNoLnJlbGF0aXZlIHNvdXJjZSwgc2xhc2guam9pbiBqc0Rpciwgc3JjUm9vdF1cbiAgICAgICAgICAgIGdlbmVyYXRlZEZpbGU6IHNsYXNoLmZpbGUganNQYXRoXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgY29wdHNcblxuY29tcGlsZSA9IChjb2RlLCBvcHRpb25zKSAtPlxuICAgIFxuICAgIG9wdGlvbnMgPSBpbmplY3RGZWF0dXJlICBvcHRpb25zXG4gICAgb3B0aW9ucyA9IGluamVjdE1ldGEgICAgIG9wdGlvbnNcbiAgICBvcHRpb25zID0gY29tcGlsZU9wdGlvbnMgb3B0aW9ucy5zb3VyY2UsIG9wdGlvbnNcbiAgICAgICAgXG4gICAgIyByZXF1aXJlKCdreGsnKS5rbG9nIG9wdGlvbnNcbiAgICBcbiAgICAjIEFsd2F5cyBnZW5lcmF0ZSBhIHNvdXJjZSBtYXAgaWYgbm8gZmlsZW5hbWUgaXMgcGFzc2VkIGluLCBzaW5jZSB3aXRob3V0IGFcbiAgICAjIGEgZmlsZW5hbWUgd2UgaGF2ZSBubyB3YXkgdG8gcmV0cmlldmUgdGhpcyBzb3VyY2UgbGF0ZXIgaW4gdGhlIGV2ZW50IHRoYXRcbiAgICAjIHdlIG5lZWQgdG8gcmVjb21waWxlIGl0IHRvIGdldCBhIHNvdXJjZSBtYXAgZm9yIGBwcmVwYXJlU3RhY2tUcmFjZWAuXG4gICAgICAgIFxuICAgIGdlbmVyYXRlU291cmNlTWFwID0gb3B0aW9ucy5zb3VyY2VNYXAgb3Igb3B0aW9ucy5pbmxpbmVNYXAgb3Igbm90IG9wdGlvbnMuZmlsZW5hbWU/XG4gICAgZmlsZW5hbWUgPSBvcHRpb25zLmZpbGVuYW1lIG9yICcnXG4gICAgXG4gICAgc291cmNlc1tmaWxlbmFtZSA/ICc/J10gPSBjb2RlXG4gICAgbWFwID0gbmV3IFNvdXJjZU1hcCBpZiBnZW5lcmF0ZVNvdXJjZU1hcFxuXG4gICAgdG9rZW5zID0gbGV4ZXIudG9rZW5pemUgY29kZSwgb3B0aW9uc1xuXG4gICAgIyBQYXNzIGEgbGlzdCBvZiByZWZlcmVuY2VkIHZhcmlhYmxlcywgc28gdGhhdCBnZW5lcmF0ZWQgdmFyaWFibGVzIHdvbid0IGdldCB0aGUgc2FtZSBuYW1lLlxuICAgIFxuICAgIG9wdGlvbnMucmVmZXJlbmNlZFZhcnMgPSAoIHRva2VuWzFdIGZvciB0b2tlbiBpbiB0b2tlbnMgd2hlbiB0b2tlblswXSBpcyAnSURFTlRJRklFUicgKVxuXG4gICAgIyBDaGVjayBmb3IgaW1wb3J0IG9yIGV4cG9ydDsgaWYgZm91bmQsIGZvcmNlIGJhcmUgbW9kZS5cbiAgICAgICAgXG4gICAgaWYgbm90IG9wdGlvbnMuYmFyZVxuICAgICAgICBmb3IgdG9rZW4gaW4gdG9rZW5zXG4gICAgICAgICAgICBpZiB0b2tlblswXSBpbiBbJ0lNUE9SVCcgJ0VYUE9SVCddXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5iYXJlID0geWVzXG4gICAgICAgICAgICAgICAgYnJlYWtcblxuICAgIHRyeVxuICAgICAgICBmcmFnbWVudHMgPSBwYXJzZXIucGFyc2UodG9rZW5zKS5jb21waWxlVG9GcmFnbWVudHMgb3B0aW9uc1xuICAgIGNhdGNoIGVyclxuICAgICAgICBpZiBlcnIgaW5zdGFuY2VvZiBTeW50YXhFcnJvclxuICAgICAgICAgICAgdXBkYXRlU3ludGF4RXJyb3IgZXJyLCBjb2RlLCBvcHRpb25zLnNvdXJjZSA/IG9wdGlvbnMuZmlsZW5hbWUgPyAnJywgb3B0aW9uc1xuICAgICAgICB0aHJvdyBlcnJcbiAgICAgICAgICAgIFxuICAgIGN1cnJlbnRMaW5lID0gMFxuICAgIGN1cnJlbnRMaW5lICs9IDEgaWYgaGFzRmVhdHVyZSBvcHRpb25zLCAnaGVhZGVyJ1xuICAgIGN1cnJlbnRDb2x1bW4gPSAwXG4gICAganMgPSBcIlwiXG4gICAgXG4gICAgZm9yIGZyYWdtZW50IGluIGZyYWdtZW50c1xuICAgICAgICAjIFVwZGF0ZSB0aGUgc291cmNlbWFwIHdpdGggZGF0YSBmcm9tIGVhY2ggZnJhZ21lbnQuXG4gICAgICAgIGlmIGdlbmVyYXRlU291cmNlTWFwXG4gICAgICAgICAgICAjIERvIG5vdCBpbmNsdWRlIGVtcHR5LCB3aGl0ZXNwYWNlLCBvciBzZW1pY29sb24tb25seSBmcmFnbWVudHMuXG4gICAgICAgICAgICBpZiBmcmFnbWVudC5sb2NhdGlvbkRhdGEgYW5kIG5vdCAvXls7XFxzXSokLy50ZXN0IGZyYWdtZW50LmNvZGVcbiAgICAgICAgICAgICAgICBtYXAuYWRkKFxuICAgICAgICAgICAgICAgICAgICBbZnJhZ21lbnQubG9jYXRpb25EYXRhLmZpcnN0X2xpbmUsIGZyYWdtZW50LmxvY2F0aW9uRGF0YS5maXJzdF9jb2x1bW5dXG4gICAgICAgICAgICAgICAgICAgIFtjdXJyZW50TGluZSwgY3VycmVudENvbHVtbl1cbiAgICAgICAgICAgICAgICAgICAge25vUmVwbGFjZTogdHJ1ZX0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgbmV3TGluZXMgPSBjb3VudCBmcmFnbWVudC5jb2RlLCBcIlxcblwiXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGN1cnJlbnRMaW5lICs9IG5ld0xpbmVzXG4gICAgICAgICAgICBpZiBuZXdMaW5lc1xuICAgICAgICAgICAgICAgIGN1cnJlbnRDb2x1bW4gPSBmcmFnbWVudC5jb2RlLmxlbmd0aCAtIChmcmFnbWVudC5jb2RlLmxhc3RJbmRleE9mKFwiXFxuXCIpICsgMSlcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBjdXJyZW50Q29sdW1uICs9IGZyYWdtZW50LmNvZGUubGVuZ3RoXG5cbiAgICAgICAganMgKz0gZnJhZ21lbnQuY29kZSAjIENvcHkgdGhlIGNvZGUgZnJvbSBlYWNoIGZyYWdtZW50IGludG8gdGhlIGZpbmFsIEphdmFTY3JpcHQuXG5cbiAgICBpZiBoYXNGZWF0dXJlIG9wdGlvbnMsICdoZWFkZXInXG4gICAgICAgIGhlYWRlciA9IFwia29mZmVlICN7QFZFUlNJT059XCJcbiAgICAgICAganMgPSBcIi8vICN7aGVhZGVyfVxcbiN7anN9XCJcblxuICAgIGlmIGdlbmVyYXRlU291cmNlTWFwXG4gICAgICAgIHYzU291cmNlTWFwID0gbWFwLmdlbmVyYXRlKG9wdGlvbnMsIGNvZGUpXG4gICAgICAgIHNvdXJjZU1hcHNbZmlsZW5hbWUgPyAnPyddID0gbWFwXG5cbiAgICBpZiBvcHRpb25zLmlubGluZU1hcFxuICAgICAgICBlbmNvZGVkID0gYmFzZTY0ZW5jb2RlIEpTT04uc3RyaW5naWZ5IHYzU291cmNlTWFwXG4gICAgICAgIHNvdXJjZU1hcERhdGFVUkkgPSBcIi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsI3tlbmNvZGVkfVwiXG4gICAgICAgIHNvdXJjZVVSTCA9IFwiLy8jIHNvdXJjZVVSTD0je29wdGlvbnMuZmlsZW5hbWUgPyAna29mZmVlJ31cIlxuICAgICAgICBqcyA9IFwiI3tqc31cXG4je3NvdXJjZU1hcERhdGFVUkl9XFxuI3tzb3VyY2VVUkx9XCJcblxuICAgIGlmIG9wdGlvbnMuc291cmNlTWFwXG4gICAgICAgIHtcbiAgICAgICAgICAgIGpzXG4gICAgICAgICAgICBzb3VyY2VNYXA6IG1hcFxuICAgICAgICAgICAgdjNTb3VyY2VNYXA6IEpTT04uc3RyaW5naWZ5IHYzU291cmNlTWFwLCBudWxsLCAyXG4gICAgICAgIH1cbiAgICBlbHNlXG4gICAgICAgIGpzXG4gICAgICAgICAgICAgICAgXG4jIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4jIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4jIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4jIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwICAgXG5cbiMgUGFyc2UgYSBzdHJpbmcgb2YgS29mZmVlIGNvZGUgb3IgYW4gYXJyYXkgb2YgbGV4ZWQgdG9rZW5zLCBhbmQgcmV0dXJuIHRoZSBBU1QuIFxuIyBZb3UgY2FuIHRoZW4gY29tcGlsZSBpdCBieSBjYWxsaW5nIGAuY29tcGlsZSgpYCBvbiB0aGUgcm9vdCwgb3IgdHJhdmVyc2UgaXQgYnkgdXNpbmcgYC50cmF2ZXJzZUNoaWxkcmVuKClgIHdpdGggYSBjYWxsYmFjay5cblxubm9kZXMgPSAoY29kZSwgb3B0aW9ucykgLT5cbiAgICBcbiAgICBpZiB0eXBlb2YgY29kZSBpcyAnc3RyaW5nJ1xuICAgICAgICBwYXJzZXIucGFyc2UgbGV4ZXIudG9rZW5pemUgY29kZSwgb3B0aW9uc1xuICAgIGVsc2VcbiAgICAgICAgcGFyc2VyLnBhcnNlIGNvZGVcbiAgICBcbiMgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMDAwMDAgICBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgICAwMDAgIFxuIyAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG5cbnRva2VucyA9IChjb2RlLCBvcHRpb25zKSAtPlxuICAgIFxuICAgIHRyeVxuICAgICAgICBsZXhlci50b2tlbml6ZSBjb2RlLCBvcHRpb25zXG4gICAgY2F0Y2ggZXJyXG4gICAgICAgIGlmIGVyciBpbnN0YW5jZW9mIFN5bnRheEVycm9yXG4gICAgICAgICAgICB1cGRhdGVTeW50YXhFcnJvciBlcnIsIGNvZGUsIG9wdGlvbnMuc291cmNlID8gb3B0aW9ucy5maWxlbmFtZSA/ICcnLCBvcHRpb25zXG4gICAgICAgIHRocm93IGVyclxuICAgICAgICBcbiMgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuIyAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuXG5mcmFnbWVudHMgPSAoY29kZSwgb3B0aW9ucykgLT5cbiAgICBcbiAgICBvcHRpb25zID0gaW5qZWN0RmVhdHVyZSBvcHRpb25zXG4gICAgb3B0aW9ucyA9IGluamVjdE1ldGEgICAgb3B0aW9uc1xuICAgIFxuICAgIHRva2VucyA9IGxleGVyLnRva2VuaXplIGNvZGUsIG9wdGlvbnNcbiAgICBmcmFnbWVudHMgPSBwYXJzZXIucGFyc2UodG9rZW5zKS5jb21waWxlVG9GcmFnbWVudHMgb3B0aW9uc1xuICAgICAgICBcbiMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4jIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuXG4jIENvbXBpbGUgYW5kIGV4ZWN1dGUgYSBzdHJpbmcgb2Yga29mZmVlXG5cbnJ1biA9IChjb2RlLCBvcHRpb25zPXt9KSAtPlxuICAgIFxuICAgIG9wdGlvbnMgPSBpbmplY3RGZWF0dXJlIG9wdGlvbnNcbiAgICBvcHRpb25zID0gaW5qZWN0TWV0YSAgICBvcHRpb25zXG4gICAgXG4gICAgbWFpbk1vZHVsZSA9IHJlcXVpcmUubWFpblxuXG4gICAgIyBTZXQgdGhlIGZpbGVuYW1lXG4gICAgXG4gICAgbWFpbk1vZHVsZS5maWxlbmFtZSA9IHByb2Nlc3MuYXJndlsxXSA9XG4gICAgICAgIGlmIG9wdGlvbnMuZmlsZW5hbWUgdGhlbiBmcy5yZWFscGF0aFN5bmMob3B0aW9ucy5maWxlbmFtZSkgZWxzZSAnJ1xuXG4gICAgbWFpbk1vZHVsZS5tb2R1bGVDYWNoZSBhbmQ9IHt9ICMgQ2xlYXIgdGhlIG1vZHVsZSBjYWNoZS5cblxuICAgICMgQXNzaWduIHBhdGhzIGZvciBub2RlX21vZHVsZXMgbG9hZGluZ1xuICAgICAgICBcbiAgICBkaXIgPSBpZiBvcHRpb25zLmZpbGVuYW1lP1xuICAgICAgICBwYXRoLmRpcm5hbWUgZnMucmVhbHBhdGhTeW5jIG9wdGlvbnMuZmlsZW5hbWVcbiAgICBlbHNlXG4gICAgICAgIGZzLnJlYWxwYXRoU3luYyAnLidcbiAgICAgICAgXG4gICAgbWFpbk1vZHVsZS5wYXRocyA9IHJlcXVpcmUoJ21vZHVsZScpLl9ub2RlTW9kdWxlUGF0aHMgZGlyXG5cbiAgICBpZiBub3QgaXNDb2ZmZWUobWFpbk1vZHVsZS5maWxlbmFtZSkgb3IgcmVxdWlyZS5leHRlbnNpb25zXG4gICAgICAgIHRyeVxuICAgICAgICAgICAgYW5zd2VyID0gY29tcGlsZSBjb2RlLCBvcHRpb25zXG4gICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgdXBkYXRlU3ludGF4RXJyb3IgZXJyLCBjb2RlLCBtYWluTW9kdWxlLmZpbGVuYW1lLCBvcHRpb25zXG4gICAgICAgICAgICB0aHJvdyBlcnJcbiAgICAgICAgXG4gICAgICAgIGpzY29kZSA9IGFuc3dlci5qcyA/IGFuc3dlclxuXG4gICAgdHJ5XG4gICAgICAgIG1haW5Nb2R1bGUuX2NvbXBpbGUganNjb2RlLCBtYWluTW9kdWxlLmZpbGVuYW1lXG4gICAgY2F0Y2ggZXJyXG4gICAgICAgIHVwZGF0ZVN5bnRheEVycm9yIGVyciwgY29kZSwgbWFpbk1vZHVsZS5maWxlbmFtZSwgb3B0aW9uc1xuICAgICAgICB0aHJvdyBlcnJcbiAgICAgICAgICAgIFxuIyAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAgICAgMDAwIDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwMDAgICAgICAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG5cbiMgQ29tcGlsZSBhbmQgZXZhbHVhdGUgYSBzdHJpbmcgaW4gYSBOb2RlLmpzLWxpa2UgZW52aXJvbm1lbnQuIFRoZSBSRVBMIHVzZXMgdGhpcyB0byBydW4gdGhlIGlucHV0LlxuXG5ldmFsdWF0ZSA9IChjb2RlLCBvcHRpb25zPXt9KSAtPiAjIGV4cG9ydGVkIGFzIGV2YWxcbiAgICBcbiAgICByZXR1cm4gdW5sZXNzIGNvZGUgPSBjb2RlLnRyaW0oKVxuICAgIFxuICAgIG9wdGlvbnMgPSBpbmplY3RGZWF0dXJlIG9wdGlvbnNcbiAgICBvcHRpb25zID0gaW5qZWN0TWV0YSAgICBvcHRpb25zXG4gICAgXG4gICAgY3JlYXRlQ29udGV4dCA9IHZtLmNyZWF0ZUNvbnRleHRcblxuICAgIGlzQ29udGV4dCA9IHZtLmlzQ29udGV4dCA/IChjdHgpIC0+XG4gICAgICAgIG9wdGlvbnMuc2FuZGJveCBpbnN0YW5jZW9mIGNyZWF0ZUNvbnRleHQoKS5jb25zdHJ1Y3RvclxuXG4gICAgaWYgY3JlYXRlQ29udGV4dFxuICAgICAgICBpZiBvcHRpb25zLnNhbmRib3g/XG4gICAgICAgICAgICBpZiBpc0NvbnRleHQgb3B0aW9ucy5zYW5kYm94XG4gICAgICAgICAgICAgICAgc2FuZGJveCA9IG9wdGlvbnMuc2FuZGJveFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHNhbmRib3ggPSBjcmVhdGVDb250ZXh0KClcbiAgICAgICAgICAgICAgICBzYW5kYm94W2tdID0gdiBmb3Igb3duIGssIHYgb2Ygb3B0aW9ucy5zYW5kYm94XG4gICAgICAgICAgICBzYW5kYm94Lmdsb2JhbCA9IHNhbmRib3gucm9vdCA9IHNhbmRib3guR0xPQkFMID0gc2FuZGJveFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzYW5kYm94ID0gZ2xvYmFsXG4gICAgICAgIHNhbmRib3guX19maWxlbmFtZSA9IG9wdGlvbnMuZmlsZW5hbWUgfHwgJ2V2YWwnXG4gICAgICAgIHNhbmRib3guX19kaXJuYW1lICA9IHBhdGguZGlybmFtZSBzYW5kYm94Ll9fZmlsZW5hbWVcbiAgICAgICAgIyBkZWZpbmUgbW9kdWxlL3JlcXVpcmUgb25seSBpZiB0aGV5IGNob3NlIG5vdCB0byBzcGVjaWZ5IHRoZWlyIG93blxuICAgICAgICB1bmxlc3Mgc2FuZGJveCAhPSBnbG9iYWwgb3Igc2FuZGJveC5tb2R1bGUgb3Igc2FuZGJveC5yZXF1aXJlXG4gICAgICAgICAgICBNb2R1bGUgPSByZXF1aXJlICdtb2R1bGUnXG4gICAgICAgICAgICBzYW5kYm94Lm1vZHVsZSAgPSBfbW9kdWxlICA9IG5ldyBNb2R1bGUob3B0aW9ucy5tb2R1bGVuYW1lIHx8ICdldmFsJylcbiAgICAgICAgICAgIHNhbmRib3gucmVxdWlyZSA9IF9yZXF1aXJlID0gKHBhdGgpIC0+ICBNb2R1bGUuX2xvYWQgcGF0aCwgX21vZHVsZSwgdHJ1ZVxuICAgICAgICAgICAgX21vZHVsZS5maWxlbmFtZSA9IHNhbmRib3guX19maWxlbmFtZVxuICAgICAgICAgICAgZm9yIHIgaW4gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMgcmVxdWlyZSB3aGVuIHIgbm90IGluIFsncGF0aHMnICdhcmd1bWVudHMnICdjYWxsZXInXVxuICAgICAgICAgICAgICAgIF9yZXF1aXJlW3JdID0gcmVxdWlyZVtyXVxuICAgICAgICAgICAgIyB1c2UgdGhlIHNhbWUgaGFjayBub2RlIGN1cnJlbnRseSB1c2VzIGZvciB0aGVpciBvd24gUkVQTFxuICAgICAgICAgICAgX3JlcXVpcmUucGF0aHMgPSBfbW9kdWxlLnBhdGhzID0gTW9kdWxlLl9ub2RlTW9kdWxlUGF0aHMgcHJvY2Vzcy5jd2QoKVxuICAgICAgICAgICAgX3JlcXVpcmUucmVzb2x2ZSA9IChyZXF1ZXN0KSAtPiBNb2R1bGUuX3Jlc29sdmVGaWxlbmFtZSByZXF1ZXN0LCBfbW9kdWxlXG4gICAgICAgICAgICBcbiAgICBvID0gT2JqZWN0LmFzc2lnbiB7fSwgb3B0aW9uc1xuICAgIG8uYmFyZSA9IHRydWUgXG4gICAgXG4gICAganMgPSBjb21waWxlIGNvZGUsIG9cbiAgICBcbiAgICB0cnlcbiAgICAgICAgaWYgc2FuZGJveCBpcyBnbG9iYWxcbiAgICAgICAgICAgIHZtLnJ1bkluVGhpc0NvbnRleHQganNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdm0ucnVuSW5Db250ZXh0IGpzLCBzYW5kYm94XG4gICAgY2F0Y2ggZXJyXG4gICAgICAgIHVwZGF0ZVN5bnRheEVycm9yIGVyciwgY29kZSwgb3B0aW9ucy5zb3VyY2UgPyBvcHRpb25zLmZpbGVuYW1lID8gJycsIG9wdGlvbnNcbiAgICAgICAgdGhyb3cgZXJyXG4gICAgXG4jIDAwMCAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuIyAwMDAgICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwICAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4jIDAwMCAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuIyAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcblxuIyBUaGUgcmVhbCBMZXhlciBwcm9kdWNlcyBhIGdlbmVyaWMgc3RyZWFtIG9mIHRva2Vucy4gXG4jIFRoaXMgb2JqZWN0IHByb3ZpZGVzIGEgdGhpbiB3cmFwcGVyIGFyb3VuZCBpdCwgY29tcGF0aWJsZSB3aXRoIHRoZSBKaXNvbiBBUEkuIFxuIyBXZSBjYW4gdGhlbiBwYXNzIGl0IGRpcmVjdGx5IGFzIGEgXCJKaXNvbiBsZXhlclwiLlxuXG5wYXJzZXIubGV4ZXIgPVxuICAgIFxuICAgIGxleDogLT5cbiAgICAgICAgdG9rZW4gPSBwYXJzZXIudG9rZW5zW0Bwb3MrK11cbiAgICAgICAgaWYgdG9rZW5cbiAgICAgICAgICAgIFt0YWcsIEB5eXRleHQsIEB5eWxsb2NdID0gdG9rZW5cbiAgICAgICAgICAgIHBhcnNlci5lcnJvclRva2VuID0gdG9rZW4ub3JpZ2luIG9yIHRva2VuXG4gICAgICAgICAgICDilrhhc3NlcnQgXCJAeXlsbG9jPy5maXJzdF9saW5lP1wiIEB5eWxsb2M/LmZpcnN0X2xpbmU/XG4gICAgICAgICAgICBAeXlsaW5lbm8gPSBAeXlsbG9jLmZpcnN0X2xpbmVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdGFnID0gJydcbiAgICAgICAgdGFnXG4gICAgICAgIFxuICAgIHNldElucHV0OiAodG9rZW5zKSAtPlxuICAgICAgICBwYXJzZXIudG9rZW5zID0gdG9rZW5zXG4gICAgICAgIEBwb3MgPSAwXG4gICAgICAgIFxuICAgIHVwY29taW5nSW5wdXQ6IC0+IFwiXCJcbiAgICAgICAgXG5wYXJzZXIueXkgPSByZXF1aXJlICcuL25vZGVzJyAjIE1ha2UgYWxsIHRoZSBBU1Qgbm9kZXMgdmlzaWJsZSB0byB0aGUgcGFyc2VyLlxuXG5wYXJzZXIueXkucGFyc2VFcnJvciA9IChtZXNzYWdlLCB7dG9rZW59KSAtPiAjIE92ZXJyaWRlIEppc29uJ3MgZGVmYXVsdCBlcnJvciBoYW5kbGluZyBmdW5jdGlvbi5cbiAgICBcbiAgICAjIERpc3JlZ2FyZCBKaXNvbidzIG1lc3NhZ2UsIGl0IGNvbnRhaW5zIHJlZHVuZGFudCBsaW5lIG51bWJlciBpbmZvcm1hdGlvbi5cbiAgICAjIERpc3JlZ2FyZCB0aGUgdG9rZW4sIHdlIHRha2UgaXRzIHZhbHVlIGRpcmVjdGx5IGZyb20gdGhlIGxleGVyIGluIGNhc2VcbiAgICAjIHRoZSBlcnJvciBpcyBjYXVzZWQgYnkgYSBnZW5lcmF0ZWQgdG9rZW4gd2hpY2ggbWlnaHQgcmVmZXIgdG8gaXRzIG9yaWdpbi5cbiAgICBcbiAgICB7ZXJyb3JUb2tlbiwgdG9rZW5zfSA9IHBhcnNlclxuICAgIFtlcnJvclRhZywgZXJyb3JUZXh0LCBlcnJvckxvY10gPSBlcnJvclRva2VuXG5cbiAgICBlcnJvclRleHQgPSBzd2l0Y2hcbiAgICAgICAgd2hlbiBlcnJvclRva2VuIGlzIHRva2Vuc1t0b2tlbnMubGVuZ3RoIC0gMV1cbiAgICAgICAgICAgICdlbmQgb2YgaW5wdXQnXG4gICAgICAgIHdoZW4gZXJyb3JUYWcgaW4gWydJTkRFTlQnICdPVVRERU5UJ11cbiAgICAgICAgICAgICdpbmRlbnRhdGlvbidcbiAgICAgICAgd2hlbiBlcnJvclRhZyBpbiBbJ0lERU5USUZJRVInICdOVU1CRVInICdJTkZJTklUWScgJ1NUUklORycgJ1NUUklOR19TVEFSVCcgJ1JFR0VYJyAnUkVHRVhfU1RBUlQnXVxuICAgICAgICAgICAgZXJyb3JUYWcucmVwbGFjZSgvX1NUQVJUJC8sICcnKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHN3aXRjaCBlcnJvclRleHQgIyBuYW1lIHdoaXRlc3BhY2UgY2hhcmFjdGVyXG4gICAgICAgICAgICAgICAgd2hlbiAnICcgIHRoZW4gJ3NwYWNlJ1xuICAgICAgICAgICAgICAgIHdoZW4gJ1xcbicgdGhlbiAnbmV3bGluZSdcbiAgICAgICAgICAgICAgICB3aGVuICdcXHInIHRoZW4gJ2NhcnJpYWdlIHJldHVybidcbiAgICAgICAgICAgICAgICB3aGVuICdcXHQnIHRoZW4gJ3RhYidcbiAgICAgICAgICAgICAgICBlbHNlIGVycm9yVGV4dFxuICAgICAgICAgICAgXG4gICAgIyBUaGUgc2Vjb25kIGFyZ3VtZW50IGhhcyBhIGBsb2NgIHByb3BlcnR5LCB3aGljaCBzaG91bGQgaGF2ZSB0aGUgbG9jYXRpb24gZGF0YSBmb3IgdGhpcyB0b2tlbi4gXG4gICAgIyBVbmZvcnR1bmF0ZWx5LCBKaXNvbiBzZWVtcyB0byBzZW5kIGFuIG91dGRhdGVkIGBsb2NgIChmcm9tIHRoZSBwcmV2aW91cyB0b2tlbiksIFxuICAgICMgc28gd2UgdGFrZSB0aGUgbG9jYXRpb24gaW5mb3JtYXRpb24gZGlyZWN0bHkgZnJvbSB0aGUgbGV4ZXIuXG4gICAgXG4gICAgdGhyb3dTeW50YXhFcnJvciBtb2R1bGU6J2tvZmZlZScsIG1lc3NhZ2U6XCJ1bmV4cGVjdGVkICN7ZXJyb3JUZXh0fVwiLCBsb2NhdGlvbjplcnJvckxvY1xuXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4jICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcblxuZ2V0U291cmNlTWFwID0gKGZpbGVuYW1lKSAtPlxuICAgICBcbiAgICAjIEtvZmZlZSBjb21waWxlZCBpbiBhIGJyb3dzZXIgbWF5IGdldCBjb21waWxlZCB3aXRoIGBvcHRpb25zLmZpbGVuYW1lYCBvZiBgPGFub255bW91cz5gLCBcbiAgICAjIGJ1dCB0aGUgYnJvd3NlciBtYXkgcmVxdWVzdCB0aGUgc3RhY2sgdHJhY2Ugd2l0aCB0aGUgZmlsZW5hbWUgb2YgdGhlIHNjcmlwdCBmaWxlLlxuICAgIFxuICAgIGlmIHNvdXJjZU1hcHNbZmlsZW5hbWVdP1xuICAgICAgICBzb3VyY2VNYXBzW2ZpbGVuYW1lXVxuICAgIGVsc2UgaWYgc291cmNlTWFwc1snPyddP1xuICAgICAgICBzb3VyY2VNYXBzWyc/J11cbiAgICBlbHNlIGlmIHNvdXJjZXNbZmlsZW5hbWUgPyAnPyddP1xuICAgICAgICBhbnN3ZXIgPSBjb21waWxlIHNvdXJjZXNbZmlsZW5hbWUgPyAnPyddLFxuICAgICAgICAgICAgZmlsZW5hbWU6IGZpbGVuYW1lXG4gICAgICAgICAgICBzb3VyY2VNYXA6IHllc1xuICAgICAgICBhbnN3ZXIuc291cmNlTWFwXG4gICAgZWxzZVxuICAgICAgICBudWxsXG5cbiMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgICAgMDAwICAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICBcbiMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG5cbiMgQmFzZWQgb24gW21pY2hhZWxmaWNhcnJhL0tvZmZlZVJlZHV4XShodHRwOi8vZ29vLmdsL1pUeDFwKVxuIyBOb2RlSlMgLyBWOCBoYXZlIG5vIHN1cHBvcnQgZm9yIHRyYW5zZm9ybWluZyBwb3NpdGlvbnMgaW4gc3RhY2sgdHJhY2VzIHVzaW5nXG4jIHNvdXJjZU1hcCwgc28gd2UgbXVzdCBtb25rZXktcGF0Y2ggRXJyb3IgdG8gZGlzcGxheSBLb2ZmZWUgc291cmNlIHBvc2l0aW9ucy5cblxuIyBFcnJvci5wcmVwYXJlU3RhY2tUcmFjZSA9IChlcnIsIHN0YWNrKSAtPlxuIyAgICAgICBcbiAgICAjICMgbG9nICdwcmVwYXJlU3RhY2tUcmFjZSAtLS0nLCBlcnIuc3RhY2sgXG4gICAgIyAjIGxvZyAncHJlcGFyZVN0YWNrVHJhY2UnLCBzdGFja1swXS5nZXRGdW5jdGlvbigpXG4gICAgIyAjIGxvZyAncHJlcGFyZVN0YWNrVHJhY2UnLCBzdGFja1swXS5nZXRMaW5lTnVtYmVyKClcbiAgICAjICMgbG9nICdwcmVwYXJlU3RhY2tUcmFjZScsIHN0YWNrWzBdLmdldENvbHVtbk51bWJlcigpXG4jICAgICAgIFxuICAgICMgZ2V0U291cmNlTWFwcGluZyA9IChmaWxlbmFtZSwgbGluZSwgY29sdW1uKSAtPlxuICAgICAgICAjIHNvdXJjZU1hcCA9IGdldFNvdXJjZU1hcCBmaWxlbmFtZVxuICAgICAgICAjIGFuc3dlciA9IHNvdXJjZU1hcC5zb3VyY2VMb2NhdGlvbiBbbGluZSAtIDEsIGNvbHVtbiAtIDFdIGlmIHNvdXJjZU1hcD9cbiAgICAgICAgIyBpZiBhbnN3ZXI/IHRoZW4gW2Fuc3dlclswXSArIDEsIGFuc3dlclsxXSArIDFdIGVsc2UgbnVsbFxuXG4gICAgIyBmcmFtZXMgPSBmb3IgZnJhbWUgaW4gc3RhY2tcbiAgICAgICAgIyBicmVhayBpZiBmcmFtZS5nZXRGdW5jdGlvbigpIGlzIGV4cG9ydHMucnVuXG4gICAgICAgICMgXCIgICAgICAgIGF0ICN7Zm9ybWF0U291cmNlUG9zaXRpb24gZnJhbWUsIGdldFNvdXJjZU1hcHBpbmd9XCJcblxuICAgICMgcmVzdWx0ID0gXCIje2Vyci50b1N0cmluZygpfVxcbiN7ZnJhbWVzLmpvaW4gJ1xcbid9XFxuXCJcbiAgICAjICMgbG9nICdwcmVwYXJlU3RhY2tUcmFjZSByZXN1bHQ6JywgcmVzdWx0ICAgIFxuICAgICMgcmVzdWx0XG4gICAgXG4jIEJhc2VkIG9uIGh0dHA6Ly92OC5nb29nbGVjb2RlLmNvbS9zdm4vYnJhbmNoZXMvYmxlZWRpbmdfZWRnZS9zcmMvbWVzc2FnZXMuanNcbiMgTW9kaWZpZWQgdG8gaGFuZGxlIHNvdXJjZU1hcFxuXG5mb3JtYXRTb3VyY2VQb3NpdGlvbiA9IChmcmFtZSwgZ2V0U291cmNlTWFwcGluZykgLT5cbiAgICAgXG4gICAgZmlsZW5hbWUgPSB1bmRlZmluZWRcbiAgICBmaWxlTG9jYXRpb24gPSAnJ1xuXG4gICAgaWYgZnJhbWUuaXNOYXRpdmUoKVxuICAgICAgICBmaWxlTG9jYXRpb24gPSBcIm5hdGl2ZVwiXG4gICAgZWxzZVxuICAgICAgICBpZiBmcmFtZS5pc0V2YWwoKVxuICAgICAgICAgICAgZmlsZW5hbWUgPSBmcmFtZS5nZXRTY3JpcHROYW1lT3JTb3VyY2VVUkwoKVxuICAgICAgICAgICAgZmlsZUxvY2F0aW9uID0gXCIje2ZyYW1lLmdldEV2YWxPcmlnaW4oKX0sIFwiIHVubGVzcyBmaWxlbmFtZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBmaWxlbmFtZSA9IGZyYW1lLmdldEZpbGVOYW1lKClcblxuICAgICAgICBmaWxlbmFtZSBvcj0gJydcblxuICAgICAgICBsaW5lICAgPSBmcmFtZS5nZXRMaW5lTnVtYmVyKClcbiAgICAgICAgY29sdW1uID0gZnJhbWUuZ2V0Q29sdW1uTnVtYmVyKClcblxuICAgICAgICAjIENoZWNrIGZvciBhIHNvdXJjZU1hcCBwb3NpdGlvblxuICAgICAgICBzb3VyY2UgPSBnZXRTb3VyY2VNYXBwaW5nIGZpbGVuYW1lLCBsaW5lLCBjb2x1bW5cbiAgICAgICAgZmlsZUxvY2F0aW9uID1cbiAgICAgICAgICAgIGlmIHNvdXJjZVxuICAgICAgICAgICAgICAgIFwiI3tmaWxlbmFtZX06I3tzb3VyY2VbMF19OiN7c291cmNlWzFdfVwiXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgXCIje2ZpbGVuYW1lfToje2xpbmV9OiN7Y29sdW1ufVwiXG5cbiAgICBmdW5jdGlvbk5hbWUgPSBmcmFtZS5nZXRGdW5jdGlvbk5hbWUoKVxuICAgIGlzQ29uc3RydWN0b3IgPSBmcmFtZS5pc0NvbnN0cnVjdG9yKClcbiAgICBpc01ldGhvZENhbGwgPSBub3QgKGZyYW1lLmlzVG9wbGV2ZWwoKSBvciBpc0NvbnN0cnVjdG9yKVxuXG4gICAgaWYgaXNNZXRob2RDYWxsXG4gICAgICAgIG1ldGhvZE5hbWUgPSBmcmFtZS5nZXRNZXRob2ROYW1lKClcbiAgICAgICAgdHlwZU5hbWUgPSBmcmFtZS5nZXRUeXBlTmFtZSgpXG5cbiAgICAgICAgaWYgZnVuY3Rpb25OYW1lXG4gICAgICAgICAgICB0cCA9IGFzID0gJydcbiAgICAgICAgICAgIGlmIHR5cGVOYW1lIGFuZCBmdW5jdGlvbk5hbWUuaW5kZXhPZiB0eXBlTmFtZVxuICAgICAgICAgICAgICAgIHRwID0gXCIje3R5cGVOYW1lfS5cIlxuICAgICAgICAgICAgaWYgbWV0aG9kTmFtZSBhbmQgZnVuY3Rpb25OYW1lLmluZGV4T2YoXCIuI3ttZXRob2ROYW1lfVwiKSAhPSBmdW5jdGlvbk5hbWUubGVuZ3RoIC0gbWV0aG9kTmFtZS5sZW5ndGggLSAxXG4gICAgICAgICAgICAgICAgYXMgPSBcIiBbYXMgI3ttZXRob2ROYW1lfV1cIlxuXG4gICAgICAgICAgICBcIiN7dHB9I3tmdW5jdGlvbk5hbWV9I3thc30gKCN7ZmlsZUxvY2F0aW9ufSlcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBcIiN7dHlwZU5hbWV9LiN7bWV0aG9kTmFtZSBvciAnPGFub255bW91cz4nfSAoI3tmaWxlTG9jYXRpb259KVwiXG4gICAgZWxzZSBpZiBpc0NvbnN0cnVjdG9yXG4gICAgICAgIFwibmV3ICN7ZnVuY3Rpb25OYW1lIG9yICc8YW5vbnltb3VzPid9ICgje2ZpbGVMb2NhdGlvbn0pXCJcbiAgICBlbHNlIGlmIGZ1bmN0aW9uTmFtZVxuICAgICAgICBcIiN7ZnVuY3Rpb25OYW1lfSAoI3tmaWxlTG9jYXRpb259KVwiXG4gICAgZWxzZVxuICAgICAgICBmaWxlTG9jYXRpb25cbiAgICBcbm1vZHVsZS5leHBvcnRzID0gXG4gICAgXG4gICAgRklMRV9FWFRFTlNJT05TOiBGSUxFX0VYVEVOU0lPTlNcbiAgICBWRVJTSU9OOiAgICAgICAgIHBrZy52ZXJzaW9uXG4gICAgcnVuOiAgICAgICAgICAgICBydW5cbiAgICBldmFsOiAgICAgICAgICAgIGV2YWx1YXRlXG4gICAgbm9kZXM6ICAgICAgICAgICBub2Rlc1xuICAgIGhlbHBlcnM6ICAgICAgICAgaGVscGVyc1xuICAgIGNvbXBpbGU6ICAgICAgICAgY29tcGlsZVxuICAgIGNvbXBpbGVPcHRpb25zOiAgY29tcGlsZU9wdGlvbnNcbiAgICB0b2tlbnM6ICAgICAgICAgIHRva2Vuc1xuICAgIGZyYWdtZW50czogICAgICAgZnJhZ21lbnRzXG4gICAgcmVnaXN0ZXI6ICAgICAgICAtPiByZXF1aXJlICcuL3JlZ2lzdGVyJ1xuICAgIFxuICAgICJdfQ==
//# sourceURL=../coffee/koffee.coffee