// koffee 1.15.0

/*
000   000   0000000   00000000  00000000  00000000  00000000  
000  000   000   000  000       000       000       000       
0000000    000   000  000000    000000    0000000   0000000   
000  000   000   000  000       000       000       000       
000   000   0000000   000       000       00000000  00000000
 */

(function() {
    var FILE_EXTENSIONS, Lexer, SourceMap, base64encode, compile, compileOptions, count, evaluate, formatSourcePosition, fragments, fs, getSourceMap, hasFeature, helpers, injectFeature, injectMeta, isCoffee, lexer, nodes, parser, path, pkg, ref, run, slash, sourceMaps, sources, stringify, throwSyntaxError, tokens, updateSyntaxError, vm,
        hasProp = Object.hasOwn;

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
                        if (!hasProp(ref2, k)) continue;
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
                    console.log('[33m[93mkoffee[33m[2m.[22m[2mcoffee[22m[39m[2m[34m:[39m[22m[94m343[39m', '[1m[97m@yylloc?.first_line?[39m[22m');

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

}).call(this);
