// koffee 0.52.0

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
                console.log('[33m[93mkoffee[33m[2m.[22m[2mcoffee[22m[39m[2m[34m:[39m[22m[94m297[39m', '[1m[97m@yylloc?.first_line?[39m[22m');

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia29mZmVlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx1U0FBQTtJQUFBOztBQVVBLEVBQUEsR0FBWSxPQUFBLENBQVEsSUFBUjs7QUFDWixFQUFBLEdBQVksT0FBQSxDQUFRLElBQVI7O0FBQ1osSUFBQSxHQUFZLE9BQUEsQ0FBUSxNQUFSOztBQUNYLFFBQVcsT0FBQSxDQUFRLFNBQVI7O0FBQ1gsU0FBVyxPQUFBLENBQVEsVUFBUjs7QUFDWixPQUFBLEdBQVksT0FBQSxDQUFRLFdBQVI7O0FBQ1osU0FBQSxHQUFZLE9BQUEsQ0FBUSxhQUFSOztBQUNaLEdBQUEsR0FBWSxPQUFBLENBQVEsaUJBQVI7O0FBRVYsYUFBZSxPQUFBLENBQVEsUUFBUjs7QUFDakIsTUFBZ0MsT0FBQSxDQUFRLFlBQVIsQ0FBaEMsRUFBRSxpQ0FBRixFQUFpQjs7QUFDZiw2Q0FBRixFQUFxQiwyQ0FBckIsRUFBdUMsMkJBQXZDLEVBQWlELHFCQUFqRCxFQUF3RDs7QUFFeEQsZUFBQSxHQUFrQixDQUFDLFNBQUQsRUFBVyxTQUFYOztBQUVsQixZQUFBLEdBQWUsU0FBQyxHQUFEO0lBRVgsSUFBRyxPQUFPLE1BQVAsS0FBaUIsVUFBcEI7ZUFDSSxNQUFNLENBQUMsSUFBUCxDQUFZLEdBQVosQ0FBZ0IsQ0FBQyxRQUFqQixDQUEwQixRQUExQixFQURKO0tBQUEsTUFFSyxJQUFHLE9BQU8sSUFBUCxLQUFlLFVBQWxCO2VBS0QsSUFBQSxDQUFLLGtCQUFBLENBQW1CLEdBQW5CLENBQXVCLENBQUMsT0FBeEIsQ0FBZ0MsaUJBQWhDLEVBQW1ELFNBQUMsS0FBRCxFQUFRLEVBQVI7bUJBQ3BELE1BQU0sQ0FBQyxZQUFQLENBQW9CLElBQUEsR0FBTyxFQUEzQjtRQURvRCxDQUFuRCxDQUFMLEVBTEM7S0FBQSxNQUFBO0FBUUQsY0FBTSxJQUFJLEtBQUosQ0FBVSwyQ0FBVixFQVJMOztBQUpNOztB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QUFpQixPQUxqQjtJQU1BLE9BQUEsRUFBaUIsT0FOakI7SUFPQSxNQUFBLEVBQWlCLE1BUGpCO0lBUUEsUUFBQSxFQUFpQixTQUFBO2VBQUcsT0FBQSxDQUFRLFlBQVI7SUFBSCxDQVJqQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICBcbjAwMCAgMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgXG4wMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwICAgIDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuMDAwICAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICBcbjAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMDAwMDAwICAwMDAwMDAwMCAgXG4jIyNcblxuIyBUaGlzIG1vZHVsZSBjb250YWlucyB0aGUgbWFpbiBlbnRyeSBmdW5jdGlvbnMgZm9yIHRva2VuaXppbmcsIHBhcnNpbmcsIGFuZCBjb21waWxpbmcga29mZmVlIGludG8gSmF2YVNjcmlwdC5cblxuZnMgICAgICAgID0gcmVxdWlyZSAnZnMnXG52bSAgICAgICAgPSByZXF1aXJlICd2bSdcbnBhdGggICAgICA9IHJlcXVpcmUgJ3BhdGgnXG57TGV4ZXJ9ICAgPSByZXF1aXJlICcuL2xleGVyJ1xue3BhcnNlcn0gID0gcmVxdWlyZSAnLi9wYXJzZXInXG5oZWxwZXJzICAgPSByZXF1aXJlICcuL2hlbHBlcnMnXG5Tb3VyY2VNYXAgPSByZXF1aXJlICcuL3NvdXJjZW1hcCdcbnBrZyAgICAgICA9IHJlcXVpcmUgJy4uL3BhY2thZ2UuanNvbidcblxueyBpbmplY3RNZXRhIH0gPSByZXF1aXJlICcuL21ldGEnXG57IGluamVjdEZlYXR1cmUsIGhhc0ZlYXR1cmUgfSA9IHJlcXVpcmUgJy4vZmVhdHVyZXMnXG57IHVwZGF0ZVN5bnRheEVycm9yLCB0aHJvd1N5bnRheEVycm9yLCBpc0NvZmZlZSwgY291bnQsIHN0cmluZ2lmeSB9ID0gaGVscGVyc1xuXG5GSUxFX0VYVEVOU0lPTlMgPSBbJy5jb2ZmZWUnICcua29mZmVlJ11cblxuYmFzZTY0ZW5jb2RlID0gKHNyYykgLT5cbiAgICBcbiAgICBpZiB0eXBlb2YgQnVmZmVyIGlzICdmdW5jdGlvbidcbiAgICAgICAgQnVmZmVyLmZyb20oc3JjKS50b1N0cmluZygnYmFzZTY0JylcbiAgICBlbHNlIGlmIHR5cGVvZiBidG9hIGlzICdmdW5jdGlvbidcbiAgICAgICAgIyBUaGUgY29udGVudHMgb2YgYSBgPHNjcmlwdD5gIGJsb2NrIGFyZSBlbmNvZGVkIHZpYSBVVEYtMTYsIHNvIGlmIGFueSBleHRlbmRlZFxuICAgICAgICAjIGNoYXJhY3RlcnMgYXJlIHVzZWQgaW4gdGhlIGJsb2NrLCBidG9hIHdpbGwgZmFpbCBhcyBpdCBtYXhlcyBvdXQgYXQgVVRGLTguXG4gICAgICAgICMgU2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9XaW5kb3dCYXNlNjQvQmFzZTY0X2VuY29kaW5nX2FuZF9kZWNvZGluZyNUaGVfVW5pY29kZV9Qcm9ibGVtXG4gICAgICAgICMgZm9yIHRoZSBnb3J5IGRldGFpbHMsIGFuZCBmb3IgdGhlIHNvbHV0aW9uIGltcGxlbWVudGVkIGhlcmUuXG4gICAgICAgIGJ0b2EgZW5jb2RlVVJJQ29tcG9uZW50KHNyYykucmVwbGFjZSAvJShbMC05QS1GXXsyfSkvZywgKG1hdGNoLCBwMSkgLT5cbiAgICAgICAgICAgIFN0cmluZy5mcm9tQ2hhckNvZGUgJzB4JyArIHAxXG4gICAgZWxzZVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBiYXNlNjQgZW5jb2RlIGlubGluZSBzb3VyY2VtYXAuJylcblxubGV4ZXIgPSBuZXcgTGV4ZXIgIyBJbnN0YW50aWF0ZSBhIExleGVyIGZvciBvdXIgdXNlIGhlcmUuXG4gICAgICAgICAgICBcbiMgRm9yIGVhY2ggY29tcGlsZWQgZmlsZSwgc2F2ZSBpdHMgc291cmNlIGluIG1lbW9yeSBpbiBjYXNlIHdlIG5lZWQgdG9cbiMgcmVjb21waWxlIGl0IGxhdGVyLiBXZSBtaWdodCBuZWVkIHRvIHJlY29tcGlsZSBpZiB0aGUgZmlyc3QgY29tcGlsYXRpb25cbiMgZGlkbuKAmXQgY3JlYXRlIGEgc291cmNlIG1hcCAoZmFzdGVyKSBidXQgc29tZXRoaW5nIHdlbnQgd3JvbmcgYW5kIHdlIG5lZWRcbiMgYSBzdGFjayB0cmFjZS4gQXNzdW1pbmcgdGhhdCBtb3N0IG9mIHRoZSB0aW1lLCBjb2RlIGlzbuKAmXQgdGhyb3dpbmdcbiMgZXhjZXB0aW9ucywgaXTigJlzIHByb2JhYmx5IG1vcmUgZWZmaWNpZW50IHRvIGNvbXBpbGUgdHdpY2Ugb25seSB3aGVuIHdlXG4jIG5lZWQgYSBzdGFjayB0cmFjZSwgcmF0aGVyIHRoYW4gYWx3YXlzIGdlbmVyYXRpbmcgYSBzb3VyY2UgbWFwIGV2ZW4gd2hlblxuIyBpdOKAmXMgbm90IGxpa2VseSB0byBiZSB1c2VkLiBTYXZlIGluIGZvcm0gb2YgYGZpbGVuYW1lYDogYChzb3VyY2UpYFxuXG5zb3VyY2VzID0ge31cblxuIyBBbHNvIHNhdmUgc291cmNlIG1hcHMgaWYgZ2VuZXJhdGVkLCBpbiBmb3JtIG9mIGBmaWxlbmFtZWA6IGAoc291cmNlIG1hcClgLlxuXG5zb3VyY2VNYXBzID0ge31cblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcblxuIyBDb21waWxlIGtvZmZlZSB0byBKYXZhU2NyaXB0LCB1c2luZyB0aGUgSmlzb24gY29tcGlsZXIuXG4jXG4jIElmIGBvcHRpb25zLnNvdXJjZU1hcGAgaXMgc3BlY2lmaWVkLCB0aGVuIGBvcHRpb25zLmZpbGVuYW1lYCBtdXN0IGFsc28gYmUgc3BlY2lmaWVkLiBcbiMgQWxsIG9wdGlvbnMgdGhhdCBjYW4gYmUgcGFzc2VkIHRvIGBTb3VyY2VNYXAjZ2VuZXJhdGVgIG1heSBhbHNvIGJlIHBhc3NlZCBoZXJlLlxuI1xuIyBUaGlzIHJldHVybnMgYSBqYXZhc2NyaXB0IHN0cmluZywgdW5sZXNzIGBvcHRpb25zLnNvdXJjZU1hcGAgaXMgcGFzc2VkLCBpbiB3aGljaCBjYXNlIGl0IHJldHVybnMgYSBge2pzLCB2M1NvdXJjZU1hcCwgc291cmNlTWFwfWAgb2JqZWN0XG5cbmNvbXBpbGUgPSAoY29kZSwgb3B0aW9ucykgLT5cbiAgICBcbiAgICB7IG1lcmdlLCBleHRlbmQgfSA9IGhlbHBlcnNcbiAgICBcbiAgICBvcHRpb25zID0gaW5qZWN0RmVhdHVyZSBvcHRpb25zXG4gICAgb3B0aW9ucyA9IGluamVjdE1ldGEgICAgb3B0aW9uc1xuICAgICAgICBcbiAgICAjIEFsd2F5cyBnZW5lcmF0ZSBhIHNvdXJjZSBtYXAgaWYgbm8gZmlsZW5hbWUgaXMgcGFzc2VkIGluLCBzaW5jZSB3aXRob3V0IGFcbiAgICAjIGEgZmlsZW5hbWUgd2UgaGF2ZSBubyB3YXkgdG8gcmV0cmlldmUgdGhpcyBzb3VyY2UgbGF0ZXIgaW4gdGhlIGV2ZW50IHRoYXRcbiAgICAjIHdlIG5lZWQgdG8gcmVjb21waWxlIGl0IHRvIGdldCBhIHNvdXJjZSBtYXAgZm9yIGBwcmVwYXJlU3RhY2tUcmFjZWAuXG4gICAgICAgIFxuICAgIGdlbmVyYXRlU291cmNlTWFwID0gb3B0aW9ucy5zb3VyY2VNYXAgb3Igb3B0aW9ucy5pbmxpbmVNYXAgb3Igbm90IG9wdGlvbnMuZmlsZW5hbWU/XG4gICAgZmlsZW5hbWUgPSBvcHRpb25zLmZpbGVuYW1lIG9yICcnXG5cbiAgICBzb3VyY2VzW2ZpbGVuYW1lID8gJz8nXSA9IGNvZGVcbiAgICBtYXAgPSBuZXcgU291cmNlTWFwIGlmIGdlbmVyYXRlU291cmNlTWFwXG5cbiAgICB0b2tlbnMgPSBsZXhlci50b2tlbml6ZSBjb2RlLCBvcHRpb25zXG5cbiAgICAjIFBhc3MgYSBsaXN0IG9mIHJlZmVyZW5jZWQgdmFyaWFibGVzLCBzbyB0aGF0IGdlbmVyYXRlZCB2YXJpYWJsZXMgd29uJ3QgZ2V0IHRoZSBzYW1lIG5hbWUuXG4gICAgXG4gICAgb3B0aW9ucy5yZWZlcmVuY2VkVmFycyA9ICggdG9rZW5bMV0gZm9yIHRva2VuIGluIHRva2VucyB3aGVuIHRva2VuWzBdIGlzICdJREVOVElGSUVSJyApXG5cbiAgICAjIENoZWNrIGZvciBpbXBvcnQgb3IgZXhwb3J0OyBpZiBmb3VuZCwgZm9yY2UgYmFyZSBtb2RlLlxuICAgICAgICBcbiAgICBpZiBub3Qgb3B0aW9ucy5iYXJlXG4gICAgICAgIGZvciB0b2tlbiBpbiB0b2tlbnNcbiAgICAgICAgICAgIGlmIHRva2VuWzBdIGluIFsnSU1QT1JUJyAnRVhQT1JUJ11cbiAgICAgICAgICAgICAgICBvcHRpb25zLmJhcmUgPSB5ZXNcbiAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgdHJ5XG4gICAgICAgIGZyYWdtZW50cyA9IHBhcnNlci5wYXJzZSh0b2tlbnMpLmNvbXBpbGVUb0ZyYWdtZW50cyBvcHRpb25zXG4gICAgY2F0Y2ggZXJyXG4gICAgICAgIGlmIGVyciBpbnN0YW5jZW9mIFN5bnRheEVycm9yXG4gICAgICAgICAgICB1cGRhdGVTeW50YXhFcnJvciBlcnIsIGNvZGUsIG9wdGlvbnMuc291cmNlID8gb3B0aW9ucy5maWxlbmFtZSA/ICcnLCBvcHRpb25zXG4gICAgICAgIHRocm93IGVyclxuICAgICAgICAgICAgXG4gICAgY3VycmVudExpbmUgPSAwXG4gICAgY3VycmVudExpbmUgKz0gMSBpZiBoYXNGZWF0dXJlIG9wdGlvbnMsICdoZWFkZXInXG4gICAgY3VycmVudENvbHVtbiA9IDBcbiAgICBqcyA9IFwiXCJcbiAgICBcbiAgICAjIGxvZyAnZnJhZ21lbnRzJywgc3RyaW5naWZ5IGZyYWdtZW50c1xuICAgIFxuICAgIGZvciBmcmFnbWVudCBpbiBmcmFnbWVudHNcbiAgICAgICAgIyBVcGRhdGUgdGhlIHNvdXJjZW1hcCB3aXRoIGRhdGEgZnJvbSBlYWNoIGZyYWdtZW50LlxuICAgICAgICBpZiBnZW5lcmF0ZVNvdXJjZU1hcFxuICAgICAgICAgICAgIyBEbyBub3QgaW5jbHVkZSBlbXB0eSwgd2hpdGVzcGFjZSwgb3Igc2VtaWNvbG9uLW9ubHkgZnJhZ21lbnRzLlxuICAgICAgICAgICAgaWYgZnJhZ21lbnQubG9jYXRpb25EYXRhIGFuZCBub3QgL15bO1xcc10qJC8udGVzdCBmcmFnbWVudC5jb2RlXG4gICAgICAgICAgICAgICAgbWFwLmFkZChcbiAgICAgICAgICAgICAgICAgICAgW2ZyYWdtZW50LmxvY2F0aW9uRGF0YS5maXJzdF9saW5lLCBmcmFnbWVudC5sb2NhdGlvbkRhdGEuZmlyc3RfY29sdW1uXVxuICAgICAgICAgICAgICAgICAgICBbY3VycmVudExpbmUsIGN1cnJlbnRDb2x1bW5dXG4gICAgICAgICAgICAgICAgICAgIHtub1JlcGxhY2U6IHRydWV9KVxuICAgICAgICAgICAgaWYgbm90IGZyYWdtZW50LmNvZGU/XG4gICAgICAgICAgICAgICAgbG9nICdnZW5lcmF0ZVNvdXJjZU1hcCcsIHN0cmluZ2lmeSBmcmFnbWVudFxuICAgICAgICAgICAgbmV3TGluZXMgPSBjb3VudCBmcmFnbWVudC5jb2RlLCBcIlxcblwiXG4gICAgICAgICAgICBjdXJyZW50TGluZSArPSBuZXdMaW5lc1xuICAgICAgICAgICAgaWYgbmV3TGluZXNcbiAgICAgICAgICAgICAgICBjdXJyZW50Q29sdW1uID0gZnJhZ21lbnQuY29kZS5sZW5ndGggLSAoZnJhZ21lbnQuY29kZS5sYXN0SW5kZXhPZihcIlxcblwiKSArIDEpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgY3VycmVudENvbHVtbiArPSBmcmFnbWVudC5jb2RlLmxlbmd0aFxuXG4gICAgICAgICMgQ29weSB0aGUgY29kZSBmcm9tIGVhY2ggZnJhZ21lbnQgaW50byB0aGUgZmluYWwgSmF2YVNjcmlwdC5cbiAgICAgICAganMgKz0gZnJhZ21lbnQuY29kZVxuXG4gICAgaWYgaGFzRmVhdHVyZSBvcHRpb25zLCAnaGVhZGVyJ1xuICAgICAgICBoZWFkZXIgPSBcImtvZmZlZSAje0BWRVJTSU9OfVwiXG4gICAgICAgIGpzID0gXCIvLyAje2hlYWRlcn1cXG4je2pzfVwiXG5cbiAgICBpZiBnZW5lcmF0ZVNvdXJjZU1hcFxuICAgICAgICB2M1NvdXJjZU1hcCA9IG1hcC5nZW5lcmF0ZShvcHRpb25zLCBjb2RlKVxuICAgICAgICBzb3VyY2VNYXBzW2ZpbGVuYW1lID8gJz8nXSA9IG1hcFxuXG4gICAgaWYgb3B0aW9ucy5pbmxpbmVNYXBcbiAgICAgICAgZW5jb2RlZCA9IGJhc2U2NGVuY29kZSBKU09OLnN0cmluZ2lmeSB2M1NvdXJjZU1hcFxuICAgICAgICBzb3VyY2VNYXBEYXRhVVJJID0gXCIvLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LCN7ZW5jb2RlZH1cIlxuICAgICAgICBzb3VyY2VVUkwgPSBcIi8vIyBzb3VyY2VVUkw9I3tvcHRpb25zLmZpbGVuYW1lID8gJ2tvZmZlZSd9XCJcbiAgICAgICAganMgPSBcIiN7anN9XFxuI3tzb3VyY2VNYXBEYXRhVVJJfVxcbiN7c291cmNlVVJMfVwiXG5cbiAgICBpZiBvcHRpb25zLnNvdXJjZU1hcFxuICAgICAgICB7XG4gICAgICAgICAgICBqc1xuICAgICAgICAgICAgc291cmNlTWFwOiBtYXBcbiAgICAgICAgICAgIHYzU291cmNlTWFwOiBKU09OLnN0cmluZ2lmeSB2M1NvdXJjZU1hcCwgbnVsbCwgMlxuICAgICAgICB9XG4gICAgZWxzZVxuICAgICAgICBqc1xuICAgICAgICAgICAgICAgIFxuIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgIFxuIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuXG4jIFBhcnNlIGEgc3RyaW5nIG9mIEtvZmZlZSBjb2RlIG9yIGFuIGFycmF5IG9mIGxleGVkIHRva2VucywgYW5kIHJldHVybiB0aGUgQVNULiBcbiMgWW91IGNhbiB0aGVuIGNvbXBpbGUgaXQgYnkgY2FsbGluZyBgLmNvbXBpbGUoKWAgb24gdGhlIHJvb3QsIG9yIHRyYXZlcnNlIGl0IGJ5IHVzaW5nIGAudHJhdmVyc2VDaGlsZHJlbigpYCB3aXRoIGEgY2FsbGJhY2suXG5cbm5vZGVzID0gKGNvZGUsIG9wdGlvbnMpIC0+XG4gICAgXG4gICAgaWYgdHlwZW9mIGNvZGUgaXMgJ3N0cmluZydcbiAgICAgICAgcGFyc2VyLnBhcnNlIGxleGVyLnRva2VuaXplIGNvZGUsIG9wdGlvbnNcbiAgICBlbHNlXG4gICAgICAgIHBhcnNlci5wYXJzZSBjb2RlXG4gICAgXG4jIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgICAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAwMDAwICAgXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgICAgMDAwICBcbiMgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuXG50b2tlbnMgPSAoY29kZSwgb3B0aW9ucykgLT5cbiAgICBcbiAgICB0cnlcbiAgICAgICAgbGV4ZXIudG9rZW5pemUgY29kZSwgb3B0aW9uc1xuICAgIGNhdGNoIGVyclxuICAgICAgICBpZiBlcnIgaW5zdGFuY2VvZiBTeW50YXhFcnJvclxuICAgICAgICAgICAgdXBkYXRlU3ludGF4RXJyb3IgZXJyLCBjb2RlLCBvcHRpb25zLnNvdXJjZSA/IG9wdGlvbnMuZmlsZW5hbWUgPyAnJywgb3B0aW9uc1xuICAgICAgICB0aHJvdyBlcnJcbiAgICAgICAgXG4jIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiMgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcblxuIyBDb21waWxlIGFuZCBleGVjdXRlIGEgc3RyaW5nIG9mIGtvZmZlZVxuXG5ydW4gPSAoY29kZSwgb3B0aW9ucz17fSkgLT5cbiAgICBcbiAgICBvcHRpb25zID0gaW5qZWN0RmVhdHVyZSBvcHRpb25zXG4gICAgb3B0aW9ucyA9IGluamVjdE1ldGEgICAgb3B0aW9uc1xuICAgIFxuICAgIG1haW5Nb2R1bGUgPSByZXF1aXJlLm1haW5cblxuICAgICMgU2V0IHRoZSBmaWxlbmFtZVxuICAgIFxuICAgIG1haW5Nb2R1bGUuZmlsZW5hbWUgPSBwcm9jZXNzLmFyZ3ZbMV0gPVxuICAgICAgICBpZiBvcHRpb25zLmZpbGVuYW1lIHRoZW4gZnMucmVhbHBhdGhTeW5jKG9wdGlvbnMuZmlsZW5hbWUpIGVsc2UgJydcblxuICAgIG1haW5Nb2R1bGUubW9kdWxlQ2FjaGUgYW5kPSB7fSAjIENsZWFyIHRoZSBtb2R1bGUgY2FjaGUuXG5cbiAgICAjIEFzc2lnbiBwYXRocyBmb3Igbm9kZV9tb2R1bGVzIGxvYWRpbmdcbiAgICAgICAgXG4gICAgZGlyID0gaWYgb3B0aW9ucy5maWxlbmFtZT9cbiAgICAgICAgcGF0aC5kaXJuYW1lIGZzLnJlYWxwYXRoU3luYyBvcHRpb25zLmZpbGVuYW1lXG4gICAgZWxzZVxuICAgICAgICBmcy5yZWFscGF0aFN5bmMgJy4nXG4gICAgICAgIFxuICAgIG1haW5Nb2R1bGUucGF0aHMgPSByZXF1aXJlKCdtb2R1bGUnKS5fbm9kZU1vZHVsZVBhdGhzIGRpclxuXG4gICAgaWYgbm90IGlzQ29mZmVlKG1haW5Nb2R1bGUuZmlsZW5hbWUpIG9yIHJlcXVpcmUuZXh0ZW5zaW9uc1xuICAgICAgICB0cnlcbiAgICAgICAgICAgIGFuc3dlciA9IGNvbXBpbGUgY29kZSwgb3B0aW9uc1xuICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgIHVwZGF0ZVN5bnRheEVycm9yIGVyciwgY29kZSwgbWFpbk1vZHVsZS5maWxlbmFtZSwgb3B0aW9uc1xuICAgICAgICAgICAgdGhyb3cgZXJyXG4gICAgICAgIFxuICAgICAgICBjb2RlID0gYW5zd2VyLmpzID8gYW5zd2VyXG5cbiAgICBtYWluTW9kdWxlLl9jb21waWxlIGNvZGUsIG1haW5Nb2R1bGUuZmlsZW5hbWVcblxuIyAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAgICAgMDAwIDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwMDAgICAgICAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG5cbiMgQ29tcGlsZSBhbmQgZXZhbHVhdGUgYSBzdHJpbmcgaW4gYSBOb2RlLmpzLWxpa2UgZW52aXJvbm1lbnQuIFRoZSBSRVBMIHVzZXMgdGhpcyB0byBydW4gdGhlIGlucHV0LlxuXG5ldmFsdWF0ZSA9IChjb2RlLCBvcHRpb25zPXt9KSAtPiAjIGV4cG9ydGVkIGFzIGV2YWxcbiAgICBcbiAgICByZXR1cm4gdW5sZXNzIGNvZGUgPSBjb2RlLnRyaW0oKVxuICAgIFxuICAgIGNyZWF0ZUNvbnRleHQgPSB2bS5jcmVhdGVDb250ZXh0XG5cbiAgICBpc0NvbnRleHQgPSB2bS5pc0NvbnRleHQgPyAoY3R4KSAtPlxuICAgICAgICBvcHRpb25zLnNhbmRib3ggaW5zdGFuY2VvZiBjcmVhdGVDb250ZXh0KCkuY29uc3RydWN0b3JcblxuICAgIGlmIGNyZWF0ZUNvbnRleHRcbiAgICAgICAgaWYgb3B0aW9ucy5zYW5kYm94P1xuICAgICAgICAgICAgaWYgaXNDb250ZXh0IG9wdGlvbnMuc2FuZGJveFxuICAgICAgICAgICAgICAgIHNhbmRib3ggPSBvcHRpb25zLnNhbmRib3hcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBzYW5kYm94ID0gY3JlYXRlQ29udGV4dCgpXG4gICAgICAgICAgICAgICAgc2FuZGJveFtrXSA9IHYgZm9yIG93biBrLCB2IG9mIG9wdGlvbnMuc2FuZGJveFxuICAgICAgICAgICAgc2FuZGJveC5nbG9iYWwgPSBzYW5kYm94LnJvb3QgPSBzYW5kYm94LkdMT0JBTCA9IHNhbmRib3hcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgc2FuZGJveCA9IGdsb2JhbFxuICAgICAgICBzYW5kYm94Ll9fZmlsZW5hbWUgPSBvcHRpb25zLmZpbGVuYW1lIHx8ICdldmFsJ1xuICAgICAgICBzYW5kYm94Ll9fZGlybmFtZSAgPSBwYXRoLmRpcm5hbWUgc2FuZGJveC5fX2ZpbGVuYW1lXG4gICAgICAgICMgZGVmaW5lIG1vZHVsZS9yZXF1aXJlIG9ubHkgaWYgdGhleSBjaG9zZSBub3QgdG8gc3BlY2lmeSB0aGVpciBvd25cbiAgICAgICAgdW5sZXNzIHNhbmRib3ggIT0gZ2xvYmFsIG9yIHNhbmRib3gubW9kdWxlIG9yIHNhbmRib3gucmVxdWlyZVxuICAgICAgICAgICAgTW9kdWxlID0gcmVxdWlyZSAnbW9kdWxlJ1xuICAgICAgICAgICAgc2FuZGJveC5tb2R1bGUgID0gX21vZHVsZSAgPSBuZXcgTW9kdWxlKG9wdGlvbnMubW9kdWxlbmFtZSB8fCAnZXZhbCcpXG4gICAgICAgICAgICBzYW5kYm94LnJlcXVpcmUgPSBfcmVxdWlyZSA9IChwYXRoKSAtPiAgTW9kdWxlLl9sb2FkIHBhdGgsIF9tb2R1bGUsIHRydWVcbiAgICAgICAgICAgIF9tb2R1bGUuZmlsZW5hbWUgPSBzYW5kYm94Ll9fZmlsZW5hbWVcbiAgICAgICAgICAgIGZvciByIGluIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzIHJlcXVpcmUgd2hlbiByIG5vdCBpbiBbJ3BhdGhzJyAnYXJndW1lbnRzJyAnY2FsbGVyJ11cbiAgICAgICAgICAgICAgICBfcmVxdWlyZVtyXSA9IHJlcXVpcmVbcl1cbiAgICAgICAgICAgICMgdXNlIHRoZSBzYW1lIGhhY2sgbm9kZSBjdXJyZW50bHkgdXNlcyBmb3IgdGhlaXIgb3duIFJFUExcbiAgICAgICAgICAgIF9yZXF1aXJlLnBhdGhzID0gX21vZHVsZS5wYXRocyA9IE1vZHVsZS5fbm9kZU1vZHVsZVBhdGhzIHByb2Nlc3MuY3dkKClcbiAgICAgICAgICAgIF9yZXF1aXJlLnJlc29sdmUgPSAocmVxdWVzdCkgLT4gTW9kdWxlLl9yZXNvbHZlRmlsZW5hbWUgcmVxdWVzdCwgX21vZHVsZVxuICAgIG8gPSB7fVxuICAgIG9ba10gPSB2IGZvciBvd24gaywgdiBvZiBvcHRpb25zXG4gICAgby5iYXJlID0geWVzICMgZW5zdXJlIHJldHVybiB2YWx1ZVxuICAgIGpzID0gY29tcGlsZSBjb2RlLCBvXG4gICAgaWYgc2FuZGJveCBpcyBnbG9iYWxcbiAgICAgICAgdm0ucnVuSW5UaGlzQ29udGV4dCBqc1xuICAgIGVsc2VcbiAgICAgICAgdm0ucnVuSW5Db250ZXh0IGpzLCBzYW5kYm94XG5cbiMgMDAwICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4jIDAwMCAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuIyAwMDAgICAgICAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiMgMDAwICAgICAgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuXG4jIFRoZSByZWFsIExleGVyIHByb2R1Y2VzIGEgZ2VuZXJpYyBzdHJlYW0gb2YgdG9rZW5zLiBcbiMgVGhpcyBvYmplY3QgcHJvdmlkZXMgYSB0aGluIHdyYXBwZXIgYXJvdW5kIGl0LCBjb21wYXRpYmxlIHdpdGggdGhlIEppc29uIEFQSS4gXG4jIFdlIGNhbiB0aGVuIHBhc3MgaXQgZGlyZWN0bHkgYXMgYSBcIkppc29uIGxleGVyXCIuXG5cbnBhcnNlci5sZXhlciA9XG4gICAgXG4gICAgbGV4OiAtPlxuICAgICAgICB0b2tlbiA9IHBhcnNlci50b2tlbnNbQHBvcysrXVxuICAgICAgICBpZiB0b2tlblxuICAgICAgICAgICAgW3RhZywgQHl5dGV4dCwgQHl5bGxvY10gPSB0b2tlblxuICAgICAgICAgICAgcGFyc2VyLmVycm9yVG9rZW4gPSB0b2tlbi5vcmlnaW4gb3IgdG9rZW5cbiAgICAgICAgICAgIOKWuGFzc2VydCBcIkB5eWxsb2M/LmZpcnN0X2xpbmU/XCIgQHl5bGxvYz8uZmlyc3RfbGluZT9cbiAgICAgICAgICAgIEB5eWxpbmVubyA9IEB5eWxsb2MuZmlyc3RfbGluZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0YWcgPSAnJ1xuICAgICAgICB0YWdcbiAgICAgICAgXG4gICAgc2V0SW5wdXQ6ICh0b2tlbnMpIC0+XG4gICAgICAgIHBhcnNlci50b2tlbnMgPSB0b2tlbnNcbiAgICAgICAgQHBvcyA9IDBcbiAgICAgICAgXG4gICAgdXBjb21pbmdJbnB1dDogLT4gXCJcIlxuICAgICAgICBcbnBhcnNlci55eSA9IHJlcXVpcmUgJy4vbm9kZXMnICMgTWFrZSBhbGwgdGhlIEFTVCBub2RlcyB2aXNpYmxlIHRvIHRoZSBwYXJzZXIuXG5cbnBhcnNlci55eS5wYXJzZUVycm9yID0gKG1lc3NhZ2UsIHt0b2tlbn0pIC0+ICMgT3ZlcnJpZGUgSmlzb24ncyBkZWZhdWx0IGVycm9yIGhhbmRsaW5nIGZ1bmN0aW9uLlxuICAgIFxuICAgICMgRGlzcmVnYXJkIEppc29uJ3MgbWVzc2FnZSwgaXQgY29udGFpbnMgcmVkdW5kYW50IGxpbmUgbnVtYmVyIGluZm9ybWF0aW9uLlxuICAgICMgRGlzcmVnYXJkIHRoZSB0b2tlbiwgd2UgdGFrZSBpdHMgdmFsdWUgZGlyZWN0bHkgZnJvbSB0aGUgbGV4ZXIgaW4gY2FzZVxuICAgICMgdGhlIGVycm9yIGlzIGNhdXNlZCBieSBhIGdlbmVyYXRlZCB0b2tlbiB3aGljaCBtaWdodCByZWZlciB0byBpdHMgb3JpZ2luLlxuICAgIFxuICAgIHtlcnJvclRva2VuLCB0b2tlbnN9ID0gcGFyc2VyXG4gICAgW2Vycm9yVGFnLCBlcnJvclRleHQsIGVycm9yTG9jXSA9IGVycm9yVG9rZW5cblxuICAgIGVycm9yVGV4dCA9IHN3aXRjaFxuICAgICAgICB3aGVuIGVycm9yVG9rZW4gaXMgdG9rZW5zW3Rva2Vucy5sZW5ndGggLSAxXVxuICAgICAgICAgICAgJ2VuZCBvZiBpbnB1dCdcbiAgICAgICAgd2hlbiBlcnJvclRhZyBpbiBbJ0lOREVOVCcgJ09VVERFTlQnXVxuICAgICAgICAgICAgJ2luZGVudGF0aW9uJ1xuICAgICAgICB3aGVuIGVycm9yVGFnIGluIFsnSURFTlRJRklFUicgJ05VTUJFUicgJ0lORklOSVRZJyAnU1RSSU5HJyAnU1RSSU5HX1NUQVJUJyAnUkVHRVgnICdSRUdFWF9TVEFSVCddXG4gICAgICAgICAgICBlcnJvclRhZy5yZXBsYWNlKC9fU1RBUlQkLywgJycpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgc3dpdGNoIGVycm9yVGV4dCAjIG5hbWUgd2hpdGVzcGFjZSBjaGFyYWN0ZXJcbiAgICAgICAgICAgICAgICB3aGVuICcgJyAgdGhlbiAnc3BhY2UnXG4gICAgICAgICAgICAgICAgd2hlbiAnXFxuJyB0aGVuICduZXdsaW5lJ1xuICAgICAgICAgICAgICAgIHdoZW4gJ1xccicgdGhlbiAnY2FycmlhZ2UgcmV0dXJuJ1xuICAgICAgICAgICAgICAgIHdoZW4gJ1xcdCcgdGhlbiAndGFiJ1xuICAgICAgICAgICAgICAgIGVsc2UgZXJyb3JUZXh0XG4gICAgICAgICAgICBcbiAgICAjIFRoZSBzZWNvbmQgYXJndW1lbnQgaGFzIGEgYGxvY2AgcHJvcGVydHksIHdoaWNoIHNob3VsZCBoYXZlIHRoZSBsb2NhdGlvbiBkYXRhIGZvciB0aGlzIHRva2VuLiBcbiAgICAjIFVuZm9ydHVuYXRlbHksIEppc29uIHNlZW1zIHRvIHNlbmQgYW4gb3V0ZGF0ZWQgYGxvY2AgKGZyb20gdGhlIHByZXZpb3VzIHRva2VuKSwgXG4gICAgIyBzbyB3ZSB0YWtlIHRoZSBsb2NhdGlvbiBpbmZvcm1hdGlvbiBkaXJlY3RseSBmcm9tIHRoZSBsZXhlci5cbiAgICBcbiAgICB0aHJvd1N5bnRheEVycm9yIG1vZHVsZTona29mZmVlJywgbWVzc2FnZTpcInVuZXhwZWN0ZWQgI3tlcnJvclRleHR9XCIsIGxvY2F0aW9uOmVycm9yTG9jXG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4jIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuXG5nZXRTb3VyY2VNYXAgPSAoZmlsZW5hbWUpIC0+XG4gICAgIFxuICAgICMgS29mZmVlIGNvbXBpbGVkIGluIGEgYnJvd3NlciBtYXkgZ2V0IGNvbXBpbGVkIHdpdGggYG9wdGlvbnMuZmlsZW5hbWVgIG9mIGA8YW5vbnltb3VzPmAsIFxuICAgICMgYnV0IHRoZSBicm93c2VyIG1heSByZXF1ZXN0IHRoZSBzdGFjayB0cmFjZSB3aXRoIHRoZSBmaWxlbmFtZSBvZiB0aGUgc2NyaXB0IGZpbGUuXG4gICAgXG4gICAgaWYgc291cmNlTWFwc1tmaWxlbmFtZV0/XG4gICAgICAgIHNvdXJjZU1hcHNbZmlsZW5hbWVdXG4gICAgZWxzZSBpZiBzb3VyY2VNYXBzWyc/J10/XG4gICAgICAgIHNvdXJjZU1hcHNbJz8nXVxuICAgIGVsc2UgaWYgc291cmNlc1tmaWxlbmFtZSA/ICc/J10/XG4gICAgICAgIGFuc3dlciA9IGNvbXBpbGUgc291cmNlc1tmaWxlbmFtZSA/ICc/J10sXG4gICAgICAgICAgICBmaWxlbmFtZTogZmlsZW5hbWVcbiAgICAgICAgICAgIHNvdXJjZU1hcDogeWVzXG4gICAgICAgIGFuc3dlci5zb3VyY2VNYXBcbiAgICBlbHNlXG4gICAgICAgIG51bGxcblxuIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4jIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAgICAwMDAgICAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIFxuIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcblxuIyBCYXNlZCBvbiBbbWljaGFlbGZpY2FycmEvS29mZmVlUmVkdXhdKGh0dHA6Ly9nb28uZ2wvWlR4MXApXG4jIE5vZGVKUyAvIFY4IGhhdmUgbm8gc3VwcG9ydCBmb3IgdHJhbnNmb3JtaW5nIHBvc2l0aW9ucyBpbiBzdGFjayB0cmFjZXMgdXNpbmdcbiMgc291cmNlTWFwLCBzbyB3ZSBtdXN0IG1vbmtleS1wYXRjaCBFcnJvciB0byBkaXNwbGF5IEtvZmZlZSBzb3VyY2UgcG9zaXRpb25zLlxuXG5FcnJvci5wcmVwYXJlU3RhY2tUcmFjZSA9IChlcnIsIHN0YWNrKSAtPlxuICAgICBcbiAgICBnZXRTb3VyY2VNYXBwaW5nID0gKGZpbGVuYW1lLCBsaW5lLCBjb2x1bW4pIC0+XG4gICAgICAgIHNvdXJjZU1hcCA9IGdldFNvdXJjZU1hcCBmaWxlbmFtZVxuICAgICAgICBhbnN3ZXIgPSBzb3VyY2VNYXAuc291cmNlTG9jYXRpb24gW2xpbmUgLSAxLCBjb2x1bW4gLSAxXSBpZiBzb3VyY2VNYXA/XG4gICAgICAgIGlmIGFuc3dlcj8gdGhlbiBbYW5zd2VyWzBdICsgMSwgYW5zd2VyWzFdICsgMV0gZWxzZSBudWxsXG5cbiAgICBmcmFtZXMgPSBmb3IgZnJhbWUgaW4gc3RhY2tcbiAgICAgICAgYnJlYWsgaWYgZnJhbWUuZ2V0RnVuY3Rpb24oKSBpcyBleHBvcnRzLnJ1blxuICAgICAgICBcIiAgICAgICAgYXQgI3tmb3JtYXRTb3VyY2VQb3NpdGlvbiBmcmFtZSwgZ2V0U291cmNlTWFwcGluZ31cIlxuXG4gICAgXCIje2Vyci50b1N0cmluZygpfVxcbiN7ZnJhbWVzLmpvaW4gJ1xcbid9XFxuXCJcbiAgICBcbiMgQmFzZWQgb24gaHR0cDovL3Y4Lmdvb2dsZWNvZGUuY29tL3N2bi9icmFuY2hlcy9ibGVlZGluZ19lZGdlL3NyYy9tZXNzYWdlcy5qc1xuIyBNb2RpZmllZCB0byBoYW5kbGUgc291cmNlTWFwXG5cbmZvcm1hdFNvdXJjZVBvc2l0aW9uID0gKGZyYW1lLCBnZXRTb3VyY2VNYXBwaW5nKSAtPlxuICAgICBcbiAgICBmaWxlbmFtZSA9IHVuZGVmaW5lZFxuICAgIGZpbGVMb2NhdGlvbiA9ICcnXG5cbiAgICBpZiBmcmFtZS5pc05hdGl2ZSgpXG4gICAgICAgIGZpbGVMb2NhdGlvbiA9IFwibmF0aXZlXCJcbiAgICBlbHNlXG4gICAgICAgIGlmIGZyYW1lLmlzRXZhbCgpXG4gICAgICAgICAgICBmaWxlbmFtZSA9IGZyYW1lLmdldFNjcmlwdE5hbWVPclNvdXJjZVVSTCgpXG4gICAgICAgICAgICBmaWxlTG9jYXRpb24gPSBcIiN7ZnJhbWUuZ2V0RXZhbE9yaWdpbigpfSwgXCIgdW5sZXNzIGZpbGVuYW1lXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGZpbGVuYW1lID0gZnJhbWUuZ2V0RmlsZU5hbWUoKVxuXG4gICAgICAgIGZpbGVuYW1lIG9yPSAnJ1xuXG4gICAgICAgIGxpbmUgICA9IGZyYW1lLmdldExpbmVOdW1iZXIoKVxuICAgICAgICBjb2x1bW4gPSBmcmFtZS5nZXRDb2x1bW5OdW1iZXIoKVxuXG4gICAgICAgICMgQ2hlY2sgZm9yIGEgc291cmNlTWFwIHBvc2l0aW9uXG4gICAgICAgIHNvdXJjZSA9IGdldFNvdXJjZU1hcHBpbmcgZmlsZW5hbWUsIGxpbmUsIGNvbHVtblxuICAgICAgICBmaWxlTG9jYXRpb24gPVxuICAgICAgICAgICAgaWYgc291cmNlXG4gICAgICAgICAgICAgICAgXCIje2ZpbGVuYW1lfToje3NvdXJjZVswXX06I3tzb3VyY2VbMV19XCJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBcIiN7ZmlsZW5hbWV9OiN7bGluZX06I3tjb2x1bW59XCJcblxuICAgIGZ1bmN0aW9uTmFtZSA9IGZyYW1lLmdldEZ1bmN0aW9uTmFtZSgpXG4gICAgaXNDb25zdHJ1Y3RvciA9IGZyYW1lLmlzQ29uc3RydWN0b3IoKVxuICAgIGlzTWV0aG9kQ2FsbCA9IG5vdCAoZnJhbWUuaXNUb3BsZXZlbCgpIG9yIGlzQ29uc3RydWN0b3IpXG5cbiAgICBpZiBpc01ldGhvZENhbGxcbiAgICAgICAgbWV0aG9kTmFtZSA9IGZyYW1lLmdldE1ldGhvZE5hbWUoKVxuICAgICAgICB0eXBlTmFtZSA9IGZyYW1lLmdldFR5cGVOYW1lKClcblxuICAgICAgICBpZiBmdW5jdGlvbk5hbWVcbiAgICAgICAgICAgIHRwID0gYXMgPSAnJ1xuICAgICAgICAgICAgaWYgdHlwZU5hbWUgYW5kIGZ1bmN0aW9uTmFtZS5pbmRleE9mIHR5cGVOYW1lXG4gICAgICAgICAgICAgICAgdHAgPSBcIiN7dHlwZU5hbWV9LlwiXG4gICAgICAgICAgICBpZiBtZXRob2ROYW1lIGFuZCBmdW5jdGlvbk5hbWUuaW5kZXhPZihcIi4je21ldGhvZE5hbWV9XCIpICE9IGZ1bmN0aW9uTmFtZS5sZW5ndGggLSBtZXRob2ROYW1lLmxlbmd0aCAtIDFcbiAgICAgICAgICAgICAgICBhcyA9IFwiIFthcyAje21ldGhvZE5hbWV9XVwiXG5cbiAgICAgICAgICAgIFwiI3t0cH0je2Z1bmN0aW9uTmFtZX0je2FzfSAoI3tmaWxlTG9jYXRpb259KVwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIFwiI3t0eXBlTmFtZX0uI3ttZXRob2ROYW1lIG9yICc8YW5vbnltb3VzPid9ICgje2ZpbGVMb2NhdGlvbn0pXCJcbiAgICBlbHNlIGlmIGlzQ29uc3RydWN0b3JcbiAgICAgICAgXCJuZXcgI3tmdW5jdGlvbk5hbWUgb3IgJzxhbm9ueW1vdXM+J30gKCN7ZmlsZUxvY2F0aW9ufSlcIlxuICAgIGVsc2UgaWYgZnVuY3Rpb25OYW1lXG4gICAgICAgIFwiI3tmdW5jdGlvbk5hbWV9ICgje2ZpbGVMb2NhdGlvbn0pXCJcbiAgICBlbHNlXG4gICAgICAgIGZpbGVMb2NhdGlvblxuICAgIFxubW9kdWxlLmV4cG9ydHMgPSBcbiAgICBcbiAgICBGSUxFX0VYVEVOU0lPTlM6IEZJTEVfRVhURU5TSU9OU1xuICAgIFZFUlNJT046ICAgICAgICAgcGtnLnZlcnNpb25cbiAgICBydW46ICAgICAgICAgICAgIHJ1blxuICAgIGV2YWw6ICAgICAgICAgICAgZXZhbHVhdGVcbiAgICBub2RlczogICAgICAgICAgIG5vZGVzXG4gICAgaGVscGVyczogICAgICAgICBoZWxwZXJzXG4gICAgY29tcGlsZTogICAgICAgICBjb21waWxlXG4gICAgdG9rZW5zOiAgICAgICAgICB0b2tlbnNcbiAgICByZWdpc3RlcjogICAgICAgIC0+IHJlcXVpcmUgJy4vcmVnaXN0ZXInXG4gICAgXG4gICAgIl19
//# sourceURL=../coffee/koffee.coffee