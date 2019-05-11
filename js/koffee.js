// koffee 0.31.0

/*
000   000   0000000   00000000  00000000  00000000  00000000  
000  000   000   000  000       000       000       000       
0000000    000   000  000000    000000    0000000   0000000   
000  000   000   000  000       000       000       000       
000   000   0000000   000       000       00000000  00000000
 */

(function() {
    var FILE_EXTENSIONS, Lexer, SourceMap, base64encode, compile, compileFile, count, evaluate, fs, getSourceMap, hasFeature, helpers, injectFeature, injectMeta, isCoffee, lexer, nameWhitespaceCharacter, nodes, parser, path, pkg, ref, run, sourceMaps, sources, stringify, throwSyntaxError, updateSyntaxError, vm,
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

    updateSyntaxError = helpers.updateSyntaxError, nameWhitespaceCharacter = helpers.nameWhitespaceCharacter, throwSyntaxError = helpers.throwSyntaxError, isCoffee = helpers.isCoffee, count = helpers.count, stringify = helpers.stringify;

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
        filename = options.filename || '?';
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
            sourceMaps[filename] = map;
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

    run = function(code, options) {
        var answer, dir, err, mainModule, ref1;
        if (options == null) {
            options = {};
        }
        options = injectFeature(options);
        options = injectMeta(options);
        mainModule = require.main;
        mainModule.filename = process.argv[1] = options.filename ? fs.realpathSync(options.filename) : '?';
        mainModule.moduleCache && (mainModule.moduleCache = {});
        dir = options.filename != null ? path.dirname(fs.realpathSync(options.filename)) : fs.realpathSync('.');
        mainModule.paths = require('module')._nodeModulePaths(dir);
        if (!isCoffee(mainModule.filename) || require.extensions) {
            try {
                answer = compile(code, options);
            } catch (error) {
                err = error;
                updateSyntaxError(err, code, mainModule.filename);
                console.log(err.message);
                return;
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

    compileFile = function(filename, sourceMap, inlineMap) {
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

    parser.lexer = {
        lex: function() {
            var ref1, tag, token;
            token = parser.tokens[this.pos++];
            if (token) {
                tag = token[0], this.yytext = token[1], this.yylloc = token[2];
                parser.errorToken = token.origin || token;
                if (!(((ref1 = this.yylloc) != null ? ref1.first_line : void 0) != null)) {
                    console.log('[33m[93mkoffee[33m[2m.[22m[2mcoffee[22m[39m[2m[34m:[39m[22m[94m306[39m', '[1m[97m@yylloc?.first_line?[39m[22m');
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

    module.exports = {
        FILE_EXTENSIONS: FILE_EXTENSIONS,
        VERSION: pkg.version,
        run: run,
        "eval": evaluate,
        nodes: nodes,
        helpers: helpers,
        compile: compile,
        tokens: lexer.tokenize,
        register: function() {
            return require('./register');
        },
        compileFile: compileFile
    };

}).call(this);
