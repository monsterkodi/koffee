// koffee 0.28.0

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
    var Module, _module, _require, createContext, i, isContext, js, k, len, o, r, ref, ref1, ref2, ref3, sandbox, v;
    if (options == null) {
        options = {};
    }
    if (!(code = code.trim())) {
        return;
    }
    createContext = (ref = vm.Script.createContext) != null ? ref : vm.createContext;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia29mZmVlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSwrU0FBQTtJQUFBOztBQVVBLEVBQUEsR0FBWSxPQUFBLENBQVEsSUFBUjs7QUFDWixFQUFBLEdBQVksT0FBQSxDQUFRLElBQVI7O0FBQ1osSUFBQSxHQUFZLE9BQUEsQ0FBUSxNQUFSOztBQUNYLFFBQVcsT0FBQSxDQUFRLFNBQVI7O0FBQ1gsU0FBVyxPQUFBLENBQVEsVUFBUjs7QUFDWixPQUFBLEdBQVksT0FBQSxDQUFRLFdBQVI7O0FBQ1osU0FBQSxHQUFZLE9BQUEsQ0FBUSxhQUFSOztBQUNaLEdBQUEsR0FBWSxPQUFBLENBQVEsaUJBQVI7O0FBRVosT0FBTyxDQUFDLE9BQVIsR0FBa0IsR0FBRyxDQUFDOztBQUN0QixPQUFPLENBQUMsZUFBUixHQUEwQixlQUFBLEdBQWtCLENBQUMsU0FBRCxFQUFXLFNBQVg7O0FBRTVDLE9BQU8sQ0FBQyxPQUFSLEdBQWtCOztBQUVoQixxQ0FBRixFQUFpQiwrQkFBakIsRUFBNkIsNkNBQTdCLEVBQWdELHlEQUFoRCxFQUF5RSwyQ0FBekUsRUFBMkYsMkJBQTNGLEVBQXFHLHFCQUFyRyxFQUE0RywrQkFBNUcsRUFBd0g7O0FBRXhILFlBQUEsR0FBZSxTQUFDLEdBQUQ7SUFFWCxJQUFHLE9BQU8sTUFBUCxLQUFpQixVQUFwQjtlQUNJLE1BQU0sQ0FBQyxJQUFQLENBQVksR0FBWixDQUFnQixDQUFDLFFBQWpCLENBQTBCLFFBQTFCLEVBREo7S0FBQSxNQUVLLElBQUcsT0FBTyxJQUFQLEtBQWUsVUFBbEI7ZUFLRCxJQUFBLENBQUssa0JBQUEsQ0FBbUIsR0FBbkIsQ0FBdUIsQ0FBQyxPQUF4QixDQUFnQyxpQkFBaEMsRUFBbUQsU0FBQyxLQUFELEVBQVEsRUFBUjttQkFDcEQsTUFBTSxDQUFDLFlBQVAsQ0FBb0IsSUFBQSxHQUFPLEVBQTNCO1FBRG9ELENBQW5ELENB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QUFBLEdBQUcsRUFBSCxHQUFRLFlBQVIsR0FBdUIsRUFBdkIsR0FBMEIsSUFBMUIsR0FBOEIsWUFBOUIsR0FBMkMsSUFQL0M7U0FBQSxNQUFBO21CQVNPLFFBQUQsR0FBVSxHQUFWLEdBQVksQ0FBQyxVQUFBLElBQWMsYUFBZixDQUFaLEdBQXlDLElBQXpDLEdBQTZDLFlBQTdDLEdBQTBELElBVGhFO1NBSko7S0FBQSxNQWNLLElBQUcsYUFBSDtlQUNELE1BQUEsR0FBTSxDQUFDLFlBQUEsSUFBZ0IsYUFBakIsQ0FBTixHQUFxQyxJQUFyQyxHQUF5QyxZQUF6QyxHQUFzRCxJQURyRDtLQUFBLE1BRUEsSUFBRyxZQUFIO2VBQ0UsWUFBRCxHQUFjLElBQWQsR0FBa0IsWUFBbEIsR0FBK0IsSUFEaEM7S0FBQSxNQUFBO2VBR0QsYUFIQzs7QUEvQ2MiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgXG4wMDAgIDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIFxuMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMCAgICAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbjAwMCAgMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgXG4wMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuIyMjXG5cbiMgVGhpcyBtb2R1bGUgY29udGFpbnMgdGhlIG1haW4gZW50cnkgZnVuY3Rpb25zIGZvciB0b2tlbml6aW5nLCBwYXJzaW5nLCBhbmQgY29tcGlsaW5nIGtvZmZlZSBpbnRvIEphdmFTY3JpcHQuXG5cbmZzICAgICAgICA9IHJlcXVpcmUgJ2ZzJ1xudm0gICAgICAgID0gcmVxdWlyZSAndm0nXG5wYXRoICAgICAgPSByZXF1aXJlICdwYXRoJ1xue0xleGVyfSAgID0gcmVxdWlyZSAnLi9sZXhlcidcbntwYXJzZXJ9ICA9IHJlcXVpcmUgJy4vcGFyc2VyJ1xuaGVscGVycyAgID0gcmVxdWlyZSAnLi9oZWxwZXJzJ1xuU291cmNlTWFwID0gcmVxdWlyZSAnLi9zb3VyY2VtYXAnXG5wa2cgICAgICAgPSByZXF1aXJlICcuLi9wYWNrYWdlLmpzb24nXG5cbmV4cG9ydHMuVkVSU0lPTiA9IHBrZy52ZXJzaW9uXG5leHBvcnRzLkZJTEVfRVhURU5TSU9OUyA9IEZJTEVfRVhURU5TSU9OUyA9IFsnLmNvZmZlZScgJy5rb2ZmZWUnXVxuXG5leHBvcnRzLmhlbHBlcnMgPSBoZWxwZXJzXG5cbnsgaW5qZWN0RmVhdHVyZSwgaW5qZWN0TWV0YSwgdXBkYXRlU3ludGF4RXJyb3IsIG5hbWVXaGl0ZXNwYWNlQ2hhcmFjdGVyLCB0aHJvd1N5bnRheEVycm9yLCBpc0NvZmZlZSwgY291bnQsIGhhc0ZlYXR1cmUsIHN0cmluZ2lmeSB9ID0gaGVscGVyc1xuXG5iYXNlNjRlbmNvZGUgPSAoc3JjKSAtPlxuICAgIFxuICAgIGlmIHR5cGVvZiBCdWZmZXIgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICBCdWZmZXIuZnJvbShzcmMpLnRvU3RyaW5nKCdiYXNlNjQnKVxuICAgIGVsc2UgaWYgdHlwZW9mIGJ0b2EgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICAjIFRoZSBjb250ZW50cyBvZiBhIGA8c2NyaXB0PmAgYmxvY2sgYXJlIGVuY29kZWQgdmlhIFVURi0xNiwgc28gaWYgYW55IGV4dGVuZGVkXG4gICAgICAgICMgY2hhcmFjdGVycyBhcmUgdXNlZCBpbiB0aGUgYmxvY2ssIGJ0b2Egd2lsbCBmYWlsIGFzIGl0IG1heGVzIG91dCBhdCBVVEYtOC5cbiAgICAgICAgIyBTZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1dpbmRvd0Jhc2U2NC9CYXNlNjRfZW5jb2RpbmdfYW5kX2RlY29kaW5nI1RoZV9Vbmljb2RlX1Byb2JsZW1cbiAgICAgICAgIyBmb3IgdGhlIGdvcnkgZGV0YWlscywgYW5kIGZvciB0aGUgc29sdXRpb24gaW1wbGVtZW50ZWQgaGVyZS5cbiAgICAgICAgYnRvYSBlbmNvZGVVUklDb21wb25lbnQoc3JjKS5yZXBsYWNlIC8lKFswLTlBLUZdezJ9KS9nLCAobWF0Y2gsIHAxKSAtPlxuICAgICAgICAgICAgU3RyaW5nLmZyb21DaGFyQ29kZSAnMHgnICsgcDFcbiAgICBlbHNlXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIGJhc2U2NCBlbmNvZGUgaW5saW5lIHNvdXJjZW1hcC4nKVxuXG4jIFdyYXBwZXIgdG8gYWRkIHNvdXJjZSBmaWxlIGluZm9ybWF0aW9uIHRvIFN5bnRheEVycm9ycyB0aHJvd24gYnkgdGhlIGxleGVyL3BhcnNlci9jb21waWxlci5cblxud2l0aFByZXR0eUVycm9ycyA9IChmbikgLT5cbiAgICBcbiAgICAoY29kZSwgb3B0aW9ucyA9IHt9KSAtPiBcbiAgICAgICAgdHJ5XG4gICAgICAgICAgICBmbi5jYWxsIEAsIGNvZGUsIG9wdGlvbnNcbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICBpZiB0eXBlb2YgY29kZSAhPSAnc3RyaW5nJyAjIFN1cHBvcnQgYEtvZmZlZS5ub2Rlcyh0b2tlbnMpYC5cbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgZXJyLnRvU3RyaW5nKClcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB0aHJvdyB1cGRhdGVTeW50YXhFcnJvciBlcnIsIGNvZGUsIG9wdGlvbnMuZmlsZW5hbWVcblxuIyBGb3IgZWFjaCBjb21waWxlZCBmaWxlLCBzYXZlIGl0cyBzb3VyY2UgaW4gbWVtb3J5IGluIGNhc2Ugd2UgbmVlZCB0b1xuIyByZWNvbXBpbGUgaXQgbGF0ZXIuIFdlIG1pZ2h0IG5lZWQgdG8gcmVjb21waWxlIGlmIHRoZSBmaXJzdCBjb21waWxhdGlvblxuIyBkaWRu4oCZdCBjcmVhdGUgYSBzb3VyY2UgbWFwIChmYXN0ZXIpIGJ1dCBzb21ldGhpbmcgd2VudCB3cm9uZyBhbmQgd2UgbmVlZFxuIyBhIHN0YWNrIHRyYWNlLiBBc3N1bWluZyB0aGF0IG1vc3Qgb2YgdGhlIHRpbWUsIGNvZGUgaXNu4oCZdCB0aHJvd2luZ1xuIyBleGNlcHRpb25zLCBpdOKAmXMgcHJvYmFibHkgbW9yZSBlZmZpY2llbnQgdG8gY29tcGlsZSB0d2ljZSBvbmx5IHdoZW4gd2VcbiMgbmVlZCBhIHN0YWNrIHRyYWNlLCByYXRoZXIgdGhhbiBhbHdheXMgZ2VuZXJhdGluZyBhIHNvdXJjZSBtYXAgZXZlbiB3aGVuXG4jIGl04oCZcyBub3QgbGlrZWx5IHRvIGJlIHVzZWQuIFNhdmUgaW4gZm9ybSBvZiBgZmlsZW5hbWVgOiBgKHNvdXJjZSlgXG5cbnNvdXJjZXMgPSB7fVxuXG4jIEFsc28gc2F2ZSBzb3VyY2UgbWFwcyBpZiBnZW5lcmF0ZWQsIGluIGZvcm0gb2YgYGZpbGVuYW1lYDogYChzb3VyY2UgbWFwKWAuXG5cbnNvdXJjZU1hcHMgPSB7fVxuXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuXG4jIENvbXBpbGUga29mZmVlIHRvIEphdmFTY3JpcHQsIHVzaW5nIHRoZSBKaXNvbiBjb21waWxlci5cbiNcbiMgSWYgYG9wdGlvbnMuc291cmNlTWFwYCBpcyBzcGVjaWZpZWQsIHRoZW4gYG9wdGlvbnMuZmlsZW5hbWVgIG11c3QgYWxzbyBiZSBzcGVjaWZpZWQuIFxuIyBBbGwgb3B0aW9ucyB0aGF0IGNhbiBiZSBwYXNzZWQgdG8gYFNvdXJjZU1hcCNnZW5lcmF0ZWAgbWF5IGFsc28gYmUgcGFzc2VkIGhlcmUuXG4jXG4jIFRoaXMgcmV0dXJucyBhIGphdmFzY3JpcHQgc3RyaW5nLCB1bmxlc3MgYG9wdGlvbnMuc291cmNlTWFwYCBpcyBwYXNzZWQsIGluIHdoaWNoIGNhc2UgaXQgcmV0dXJucyBhIGB7anMsIHYzU291cmNlTWFwLCBzb3VyY2VNYXB9YCBvYmplY3RcblxuZXhwb3J0cy5jb21waWxlID0gY29tcGlsZSA9IHdpdGhQcmV0dHlFcnJvcnMgKGNvZGUsIG9wdGlvbnMpIC0+XG4gICAgXG4gICAgeyBtZXJnZSwgZXh0ZW5kIH0gPSBoZWxwZXJzXG4gICAgXG4gICAgb3B0aW9ucyA9IGluamVjdEZlYXR1cmUgb3B0aW9uc1xuICAgIG9wdGlvbnMgPSBpbmplY3RNZXRhICAgIG9wdGlvbnNcbiAgICAgICAgXG4gICAgIyBBbHdheXMgZ2VuZXJhdGUgYSBzb3VyY2UgbWFwIGlmIG5vIGZpbGVuYW1lIGlzIHBhc3NlZCBpbiwgc2luY2Ugd2l0aG91dCBhXG4gICAgIyBhIGZpbGVuYW1lIHdlIGhhdmUgbm8gd2F5IHRvIHJldHJpZXZlIHRoaXMgc291cmNlIGxhdGVyIGluIHRoZSBldmVudCB0aGF0XG4gICAgIyB3ZSBuZWVkIHRvIHJlY29tcGlsZSBpdCB0byBnZXQgYSBzb3VyY2UgbWFwIGZvciBgcHJlcGFyZVN0YWNrVHJhY2VgLlxuICAgICAgICBcbiAgICBnZW5lcmF0ZVNvdXJjZU1hcCA9IG9wdGlvbnMuc291cmNlTWFwIG9yIG9wdGlvbnMuaW5saW5lTWFwIG9yIG5vdCBvcHRpb25zLmZpbGVuYW1lP1xuICAgIGZpbGVuYW1lID0gb3B0aW9ucy5maWxlbmFtZSBvciAnPGFub255bW91cz4nXG5cbiAgICBzb3VyY2VzW2ZpbGVuYW1lXSA9IGNvZGVcbiAgICBtYXAgPSBuZXcgU291cmNlTWFwIGlmIGdlbmVyYXRlU291cmNlTWFwXG5cbiAgICB0b2tlbnMgPSBsZXhlci50b2tlbml6ZSBjb2RlLCBvcHRpb25zXG5cbiAgICAjIFBhc3MgYSBsaXN0IG9mIHJlZmVyZW5jZWQgdmFyaWFibGVzLCBzbyB0aGF0IGdlbmVyYXRlZCB2YXJpYWJsZXMgd29uJ3QgZ2V0IHRoZSBzYW1lIG5hbWUuXG4gICAgXG4gICAgb3B0aW9ucy5yZWZlcmVuY2VkVmFycyA9ICggdG9rZW5bMV0gZm9yIHRva2VuIGluIHRva2VucyB3aGVuIHRva2VuWzBdIGlzICdJREVOVElGSUVSJyApXG5cbiAgICAjIENoZWNrIGZvciBpbXBvcnQgb3IgZXhwb3J0OyBpZiBmb3VuZCwgZm9yY2UgYmFyZSBtb2RlLlxuICAgICAgICBcbiAgICBpZiBub3Qgb3B0aW9ucy5iYXJlXG4gICAgICAgIGZvciB0b2tlbiBpbiB0b2tlbnNcbiAgICAgICAgICAgIGlmIHRva2VuWzBdIGluIFsnSU1QT1JUJyAnRVhQT1JUJ11cbiAgICAgICAgICAgICAgICBvcHRpb25zLmJhcmUgPSB5ZXNcbiAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgZnJhZ21lbnRzID0gcGFyc2VyLnBhcnNlKHRva2VucykuY29tcGlsZVRvRnJhZ21lbnRzIG9wdGlvbnNcblxuICAgIGN1cnJlbnRMaW5lID0gMFxuICAgIGN1cnJlbnRMaW5lICs9IDEgaWYgaGFzRmVhdHVyZSBvcHRpb25zLCAnaGVhZGVyJ1xuICAgIGN1cnJlbnRDb2x1bW4gPSAwXG4gICAganMgPSBcIlwiXG4gICAgXG4gICAgIyBsb2cgJ2ZyYWdtZW50cycsIHN0cmluZ2lmeSBmcmFnbWVudHNcbiAgICBcbiAgICBmb3IgZnJhZ21lbnQgaW4gZnJhZ21lbnRzXG4gICAgICAgICMgVXBkYXRlIHRoZSBzb3VyY2VtYXAgd2l0aCBkYXRhIGZyb20gZWFjaCBmcmFnbWVudC5cbiAgICAgICAgaWYgZ2VuZXJhdGVTb3VyY2VNYXBcbiAgICAgICAgICAgICMgRG8gbm90IGluY2x1ZGUgZW1wdHksIHdoaXRlc3BhY2UsIG9yIHNlbWljb2xvbi1vbmx5IGZyYWdtZW50cy5cbiAgICAgICAgICAgIGlmIGZyYWdtZW50LmxvY2F0aW9uRGF0YSBhbmQgbm90IC9eWztcXHNdKiQvLnRlc3QgZnJhZ21lbnQuY29kZVxuICAgICAgICAgICAgICAgIG1hcC5hZGQoXG4gICAgICAgICAgICAgICAgICAgIFtmcmFnbWVudC5sb2NhdGlvbkRhdGEuZmlyc3RfbGluZSwgZnJhZ21lbnQubG9jYXRpb25EYXRhLmZpcnN0X2NvbHVtbl1cbiAgICAgICAgICAgICAgICAgICAgW2N1cnJlbnRMaW5lLCBjdXJyZW50Q29sdW1uXVxuICAgICAgICAgICAgICAgICAgICB7bm9SZXBsYWNlOiB0cnVlfSlcbiAgICAgICAgICAgIGlmIG5vdCBmcmFnbWVudC5jb2RlP1xuICAgICAgICAgICAgICAgIGxvZyAnZ2VuZXJhdGVTb3VyY2VNYXAnLCBzdHJpbmdpZnkgZnJhZ21lbnRcbiAgICAgICAgICAgIG5ld0xpbmVzID0gY291bnQgZnJhZ21lbnQuY29kZSwgXCJcXG5cIlxuICAgICAgICAgICAgY3VycmVudExpbmUgKz0gbmV3TGluZXNcbiAgICAgICAgICAgIGlmIG5ld0xpbmVzXG4gICAgICAgICAgICAgICAgY3VycmVudENvbHVtbiA9IGZyYWdtZW50LmNvZGUubGVuZ3RoIC0gKGZyYWdtZW50LmNvZGUubGFzdEluZGV4T2YoXCJcXG5cIikgKyAxKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGN1cnJlbnRDb2x1bW4gKz0gZnJhZ21lbnQuY29kZS5sZW5ndGhcblxuICAgICAgICAjIENvcHkgdGhlIGNvZGUgZnJvbSBlYWNoIGZyYWdtZW50IGludG8gdGhlIGZpbmFsIEphdmFTY3JpcHQuXG4gICAgICAgIGpzICs9IGZyYWdtZW50LmNvZGVcblxuICAgIGlmIGhhc0ZlYXR1cmUgb3B0aW9ucywgJ2hlYWRlcidcbiAgICAgICAgaGVhZGVyID0gXCJrb2ZmZWUgI3tAVkVSU0lPTn1cIlxuICAgICAgICBqcyA9IFwiLy8gI3toZWFkZXJ9XFxuI3tqc31cIlxuXG4gICAgaWYgZ2VuZXJhdGVTb3VyY2VNYXBcbiAgICAgICAgdjNTb3VyY2VNYXAgPSBtYXAuZ2VuZXJhdGUob3B0aW9ucywgY29kZSlcbiAgICAgICAgc291cmNlTWFwc1tmaWxlbmFtZV0gPSBtYXBcblxuICAgIGlmIG9wdGlvbnMuaW5saW5lTWFwXG4gICAgICAgIGVuY29kZWQgPSBiYXNlNjRlbmNvZGUgSlNPTi5zdHJpbmdpZnkgdjNTb3VyY2VNYXBcbiAgICAgICAgc291cmNlTWFwRGF0YVVSSSA9IFwiLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCwje2VuY29kZWR9XCJcbiAgICAgICAgc291cmNlVVJMID0gXCIvLyMgc291cmNlVVJMPSN7b3B0aW9ucy5maWxlbmFtZSA/ICdrb2ZmZWUnfVwiXG4gICAgICAgIGpzID0gXCIje2pzfVxcbiN7c291cmNlTWFwRGF0YVVSSX1cXG4je3NvdXJjZVVSTH1cIlxuXG4gICAgaWYgb3B0aW9ucy5zb3VyY2VNYXBcbiAgICAgICAge1xuICAgICAgICAgICAganNcbiAgICAgICAgICAgIHNvdXJjZU1hcDogbWFwXG4gICAgICAgICAgICB2M1NvdXJjZU1hcDogSlNPTi5zdHJpbmdpZnkgdjNTb3VyY2VNYXAsIG51bGwsIDJcbiAgICAgICAgfVxuICAgIGVsc2VcbiAgICAgICAganNcbiAgICAgICAgXG4jIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgICAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAwMDAwICAgXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgICAgMDAwICBcbiMgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuXG4jIFRva2VuaXplIGEgc3RyaW5nIG9mIGtvZmZlZSBjb2RlLCBhbmQgcmV0dXJuIHRoZSBhcnJheSBvZiB0b2tlbnMuXG5cbmV4cG9ydHMudG9rZW5zID0gd2l0aFByZXR0eUVycm9ycyAoY29kZSwgb3B0aW9ucykgLT4gbGV4ZXIudG9rZW5pemUgY29kZSwgb3B0aW9uc1xuXG4jIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4jIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4jIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4jIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwICAgXG5cbiMgUGFyc2UgYSBzdHJpbmcgb2YgS29mZmVlIGNvZGUgb3IgYW4gYXJyYXkgb2YgbGV4ZWQgdG9rZW5zLCBhbmQgcmV0dXJuIHRoZSBBU1QuIFxuIyBZb3UgY2FuIHRoZW4gY29tcGlsZSBpdCBieSBjYWxsaW5nIGAuY29tcGlsZSgpYCBvbiB0aGUgcm9vdCwgb3IgdHJhdmVyc2UgaXQgYnkgdXNpbmcgYC50cmF2ZXJzZUNoaWxkcmVuKClgIHdpdGggYSBjYWxsYmFjay5cblxuZXhwb3J0cy5ub2RlcyA9IHdpdGhQcmV0dHlFcnJvcnMgKHNvdXJjZSwgb3B0aW9ucykgLT5cbiAgICBcbiAgICBpZiB0eXBlb2Ygc291cmNlIGlzICdzdHJpbmcnXG4gICAgICAgIHBhcnNlci5wYXJzZSBsZXhlci50b2tlbml6ZSBzb3VyY2UsIG9wdGlvbnNcbiAgICBlbHNlXG4gICAgICAgIHBhcnNlci5wYXJzZSBzb3VyY2VcblxuIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4jIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG5cbiMgQ29tcGlsZSBhbmQgZXhlY3V0ZSBhIHN0cmluZyBvZiBrb2ZmZWUsIGNvcnJlY3RseSBzZXR0aW5nIGBfX2ZpbGVuYW1lYCwgYF9fZGlybmFtZWAsIGFuZCByZWxhdGl2ZSBgcmVxdWlyZSgpYC5cblxuZXhwb3J0cy5ydW4gPSAoY29kZSwgb3B0aW9ucyA9IHt9KSAtPlxuICAgIFxuICAgIG9wdGlvbnMgPSBpbmplY3RGZWF0dXJlIG9wdGlvbnNcbiAgICBvcHRpb25zID0gaW5qZWN0TWV0YSAgICBvcHRpb25zXG4gICAgXG4gICAgbWFpbk1vZHVsZSA9IHJlcXVpcmUubWFpblxuXG4gICAgIyBTZXQgdGhlIGZpbGVuYW1lXG4gICAgXG4gICAgbWFpbk1vZHVsZS5maWxlbmFtZSA9IHByb2Nlc3MuYXJndlsxXSA9XG4gICAgICAgIGlmIG9wdGlvbnMuZmlsZW5hbWUgdGhlbiBmcy5yZWFscGF0aFN5bmMob3B0aW9ucy5maWxlbmFtZSkgZWxzZSAnPGFub255bW91cz4nXG5cbiAgICBtYWluTW9kdWxlLm1vZHVsZUNhY2hlIGFuZD0ge30gIyBDbGVhciB0aGUgbW9kdWxlIGNhY2hlLlxuXG4gICAgIyBBc3NpZ24gcGF0aHMgZm9yIG5vZGVfbW9kdWxlcyBsb2FkaW5nXG4gICAgICAgIFxuICAgIGRpciA9IGlmIG9wdGlvbnMuZmlsZW5hbWU/XG4gICAgICAgIHBhdGguZGlybmFtZSBmcy5yZWFscGF0aFN5bmMgb3B0aW9ucy5maWxlbmFtZVxuICAgIGVsc2VcbiAgICAgICAgZnMucmVhbHBhdGhTeW5jICcuJ1xuICAgIG1haW5Nb2R1bGUucGF0aHMgPSByZXF1aXJlKCdtb2R1bGUnKS5fbm9kZU1vZHVsZVBhdGhzIGRpclxuXG4gICAgIyBDb21waWxlXG4gICAgXG4gICAgaWYgbm90IGlzQ29mZmVlKG1haW5Nb2R1bGUuZmlsZW5hbWUpIG9yIHJlcXVpcmUuZXh0ZW5zaW9uc1xuICAgICAgICBhbnN3ZXIgPSBjb21waWxlIGNvZGUsIG9wdGlvbnNcbiAgICAgICAgY29kZSA9IGFuc3dlci5qcyA/IGFuc3dlclxuXG4gICAgIyBsb2cgJ0tvZmZlZS5ydW4gbWFpbk1vZHVsZS5fY29tcGlsZScsIG1haW5Nb2R1bGUuZmlsZW5hbWUsIG9wdGlvbnMgaWYgb3B0aW9ucy5EZWJ1Z1xuICAgICAgICBcbiAgICBtYWluTW9kdWxlLl9jb21waWxlIGNvZGUsIG1haW5Nb2R1bGUuZmlsZW5hbWVcblxuIyAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIFxuIyAwMDAwMDAwICAgIDAwMCAwMDAgICAwMDAwMDAwMDAgIDAwMCAgICAgIFxuIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgIFxuIyAwMDAwMDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgIFxuXG4jIENvbXBpbGUgYW5kIGV2YWx1YXRlIGEgc3RyaW5nIGluIGEgTm9kZS5qcy1saWtlIGVudmlyb25tZW50LiBUaGUgUkVQTCB1c2VzIHRoaXMgdG8gcnVuIHRoZSBpbnB1dC5cblxuZXhwb3J0cy5ldmFsID0gKGNvZGUsIG9wdGlvbnMgPSB7fSkgLT5cbiAgICBcbiAgICByZXR1cm4gdW5sZXNzIGNvZGUgPSBjb2RlLnRyaW0oKVxuICAgIFxuICAgIGNyZWF0ZUNvbnRleHQgPSB2bS5TY3JpcHQuY3JlYXRlQ29udGV4dCA/IHZtLmNyZWF0ZUNvbnRleHRcblxuICAgIGlzQ29udGV4dCA9IHZtLmlzQ29udGV4dCA/IChjdHgpIC0+XG4gICAgICAgIG9wdGlvbnMuc2FuZGJveCBpbnN0YW5jZW9mIGNyZWF0ZUNvbnRleHQoKS5jb25zdHJ1Y3RvclxuXG4gICAgaWYgY3JlYXRlQ29udGV4dFxuICAgICAgICBpZiBvcHRpb25zLnNhbmRib3g/XG4gICAgICAgICAgICBpZiBpc0NvbnRleHQgb3B0aW9ucy5zYW5kYm94XG4gICAgICAgICAgICAgICAgc2FuZGJveCA9IG9wdGlvbnMuc2FuZGJveFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHNhbmRib3ggPSBjcmVhdGVDb250ZXh0KClcbiAgICAgICAgICAgICAgICBzYW5kYm94W2tdID0gdiBmb3Igb3duIGssIHYgb2Ygb3B0aW9ucy5zYW5kYm94XG4gICAgICAgICAgICBzYW5kYm94Lmdsb2JhbCA9IHNhbmRib3gucm9vdCA9IHNhbmRib3guR0xPQkFMID0gc2FuZGJveFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzYW5kYm94ID0gZ2xvYmFsXG4gICAgICAgIHNhbmRib3guX19maWxlbmFtZSA9IG9wdGlvbnMuZmlsZW5hbWUgfHwgJ2V2YWwnXG4gICAgICAgIHNhbmRib3guX19kaXJuYW1lICA9IHBhdGguZGlybmFtZSBzYW5kYm94Ll9fZmlsZW5hbWVcbiAgICAgICAgIyBkZWZpbmUgbW9kdWxlL3JlcXVpcmUgb25seSBpZiB0aGV5IGNob3NlIG5vdCB0byBzcGVjaWZ5IHRoZWlyIG93blxuICAgICAgICB1bmxlc3Mgc2FuZGJveCAhPSBnbG9iYWwgb3Igc2FuZGJveC5tb2R1bGUgb3Igc2FuZGJveC5yZXF1aXJlXG4gICAgICAgICAgICBNb2R1bGUgPSByZXF1aXJlICdtb2R1bGUnXG4gICAgICAgICAgICBzYW5kYm94Lm1vZHVsZSAgPSBfbW9kdWxlICA9IG5ldyBNb2R1bGUob3B0aW9ucy5tb2R1bGVuYW1lIHx8ICdldmFsJylcbiAgICAgICAgICAgIHNhbmRib3gucmVxdWlyZSA9IF9yZXF1aXJlID0gKHBhdGgpIC0+ICBNb2R1bGUuX2xvYWQgcGF0aCwgX21vZHVsZSwgdHJ1ZVxuICAgICAgICAgICAgX21vZHVsZS5maWxlbmFtZSA9IHNhbmRib3guX19maWxlbmFtZVxuICAgICAgICAgICAgZm9yIHIgaW4gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMgcmVxdWlyZSB3aGVuIHIgbm90IGluIFsncGF0aHMnICdhcmd1bWVudHMnICdjYWxsZXInXVxuICAgICAgICAgICAgICAgIF9yZXF1aXJlW3JdID0gcmVxdWlyZVtyXVxuICAgICAgICAgICAgIyB1c2UgdGhlIHNhbWUgaGFjayBub2RlIGN1cnJlbnRseSB1c2VzIGZvciB0aGVpciBvd24gUkVQTFxuICAgICAgICAgICAgX3JlcXVpcmUucGF0aHMgPSBfbW9kdWxlLnBhdGhzID0gTW9kdWxlLl9ub2RlTW9kdWxlUGF0aHMgcHJvY2Vzcy5jd2QoKVxuICAgICAgICAgICAgX3JlcXVpcmUucmVzb2x2ZSA9IChyZXF1ZXN0KSAtPiBNb2R1bGUuX3Jlc29sdmVGaWxlbmFtZSByZXF1ZXN0LCBfbW9kdWxlXG4gICAgbyA9IHt9XG4gICAgb1trXSA9IHYgZm9yIG93biBrLCB2IG9mIG9wdGlvbnNcbiAgICBvLmJhcmUgPSB5ZXMgIyBlbnN1cmUgcmV0dXJuIHZhbHVlXG4gICAganMgPSBjb21waWxlIGNvZGUsIG9cbiAgICBpZiBzYW5kYm94IGlzIGdsb2JhbFxuICAgICAgICB2bS5ydW5JblRoaXNDb250ZXh0IGpzXG4gICAgZWxzZVxuICAgICAgICB2bS5ydW5JbkNvbnRleHQganMsIHNhbmRib3hcblxuIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcblxuZXhwb3J0cy5yZWdpc3RlciA9IC0+IHJlcXVpcmUgJy4vcmVnaXN0ZXInXG5cbmV4cG9ydHMuX2NvbXBpbGVGaWxlID0gKGZpbGVuYW1lLCBzb3VyY2VNYXAgPSBubywgaW5saW5lTWFwID0gbm8pIC0+XG4gICAgXG4gICAgcmF3ID0gZnMucmVhZEZpbGVTeW5jIGZpbGVuYW1lLCAndXRmOCdcbiAgICAjIFN0cmlwIHRoZSBVbmljb2RlIGJ5dGUgb3JkZXIgbWFyaywgaWYgdGhpcyBmaWxlIGJlZ2lucyB3aXRoIG9uZS5cbiAgICBzdHJpcHBlZCA9IGlmIHJhdy5jaGFyQ29kZUF0KDApIGlzIDB4RkVGRiB0aGVuIHJhdy5zdWJzdHJpbmcgMSBlbHNlIHJhd1xuXG4gICAgdHJ5XG4gICAgICAgIGFuc3dlciA9IGNvbXBpbGUgc3RyaXBwZWQsIHtcbiAgICAgICAgICAgIGZpbGVuYW1lLCBzb3VyY2VNYXAsIGlubGluZU1hcFxuICAgICAgICAgICAgc291cmNlRmlsZXM6IFtmaWxlbmFtZV1cbiAgICAgICAgfVxuICAgIGNhdGNoIGVyclxuICAgICAgICAjIEFzIHRoZSBmaWxlbmFtZSBhbmQgY29kZSBvZiBhIGR5bmFtaWNhbGx5IGxvYWRlZCBmaWxlIHdpbGwgYmUgZGlmZmVyZW50XG4gICAgICAgICMgZnJvbSB0aGUgb3JpZ2luYWwgZmlsZSBjb21waWxlZCB3aXRoIEtvZmZlZS5ydW4sIGFkZCB0aGF0XG4gICAgICAgICMgaW5mb3JtYXRpb24gdG8gZXJyb3Igc28gaXQgY2FuIGJlIHByZXR0eS1wcmludGVkIGxhdGVyLlxuICAgICAgICB0aHJvdyB1cGRhdGVTeW50YXhFcnJvciBlcnIsIHN0cmlwcGVkLCBmaWxlbmFtZVxuXG4gICAgYW5zd2VyXG5cbiMgMDAwICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4jIDAwMCAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuIyAwMDAgICAgICAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiMgMDAwICAgICAgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuXG5sZXhlciA9IG5ldyBMZXhlciAjIEluc3RhbnRpYXRlIGEgTGV4ZXIgZm9yIG91ciB1c2UgaGVyZS5cblxuIyBUaGUgcmVhbCBMZXhlciBwcm9kdWNlcyBhIGdlbmVyaWMgc3RyZWFtIG9mIHRva2Vucy4gVGhpcyBvYmplY3QgcHJvdmlkZXMgYVxuIyB0aGluIHdyYXBwZXIgYXJvdW5kIGl0LCBjb21wYXRpYmxlIHdpdGggdGhlIEppc29uIEFQSS4gV2UgY2FuIHRoZW4gcGFzcyBpdFxuIyBkaXJlY3RseSBhcyBhIFwiSmlzb24gbGV4ZXJcIi5cblxucGFyc2VyLmxleGVyID1cbiAgICBcbiAgICBsZXg6IC0+XG4gICAgICAgIHRva2VuID0gcGFyc2VyLnRva2Vuc1tAcG9zKytdXG4gICAgICAgIGlmIHRva2VuXG4gICAgICAgICAgICBbdGFnLCBAeXl0ZXh0LCBAeXlsbG9jXSA9IHRva2VuXG4gICAgICAgICAgICBwYXJzZXIuZXJyb3JUb2tlbiA9IHRva2VuLm9yaWdpbiBvciB0b2tlblxuICAgICAgICAgICAgZXJyb3IgJ0RBRlVLJywgdG9rZW4gaWYgbm90IEB5eWxsb2M/LmZpcnN0X2xpbmU/XG4gICAgICAgICAgICBAeXlsaW5lbm8gPSBAeXlsbG9jLmZpcnN0X2xpbmVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdGFnID0gJydcbiAgICAgICAgdGFnXG4gICAgc2V0SW5wdXQ6ICh0b2tlbnMpIC0+XG4gICAgICAgIHBhcnNlci50b2tlbnMgPSB0b2tlbnNcbiAgICAgICAgQHBvcyA9IDBcbiAgICB1cGNvbWluZ0lucHV0OiAtPlxuICAgICAgICBcIlwiXG4gICAgICAgIFxucGFyc2VyLnl5ID0gcmVxdWlyZSAnLi9ub2RlcycgIyBNYWtlIGFsbCB0aGUgQVNUIG5vZGVzIHZpc2libGUgdG8gdGhlIHBhcnNlci5cblxucGFyc2VyLnl5LnBhcnNlRXJyb3IgPSAobWVzc2FnZSwge3Rva2VufSkgLT4gIyBPdmVycmlkZSBKaXNvbidzIGRlZmF1bHQgZXJyb3IgaGFuZGxpbmcgZnVuY3Rpb24uXG4gICAgXG4gICAgIyBEaXNyZWdhcmQgSmlzb24ncyBtZXNzYWdlLCBpdCBjb250YWlucyByZWR1bmRhbnQgbGluZSBudW1iZXIgaW5mb3JtYXRpb24uXG4gICAgIyBEaXNyZWdhcmQgdGhlIHRva2VuLCB3ZSB0YWtlIGl0cyB2YWx1ZSBkaXJlY3RseSBmcm9tIHRoZSBsZXhlciBpbiBjYXNlXG4gICAgIyB0aGUgZXJyb3IgaXMgY2F1c2VkIGJ5IGEgZ2VuZXJhdGVkIHRva2VuIHdoaWNoIG1pZ2h0IHJlZmVyIHRvIGl0cyBvcmlnaW4uXG4gICAgXG4gICAge2Vycm9yVG9rZW4sIHRva2Vuc30gPSBwYXJzZXJcbiAgICBbZXJyb3JUYWcsIGVycm9yVGV4dCwgZXJyb3JMb2NdID0gZXJyb3JUb2tlblxuXG4gICAgZXJyb3JUZXh0ID0gc3dpdGNoXG4gICAgICAgIHdoZW4gZXJyb3JUb2tlbiBpcyB0b2tlbnNbdG9rZW5zLmxlbmd0aCAtIDFdXG4gICAgICAgICAgICAnZW5kIG9mIGlucHV0J1xuICAgICAgICB3aGVuIGVycm9yVGFnIGluIFsnSU5ERU5UJyAnT1VUREVOVCddXG4gICAgICAgICAgICAnaW5kZW50YXRpb24nXG4gICAgICAgIHdoZW4gZXJyb3JUYWcgaW4gWydJREVOVElGSUVSJyAnTlVNQkVSJyAnSU5GSU5JVFknICdTVFJJTkcnICdTVFJJTkdfU1RBUlQnICdSRUdFWCcgJ1JFR0VYX1NUQVJUJ11cbiAgICAgICAgICAgIGVycm9yVGFnLnJlcGxhY2UoL19TVEFSVCQvLCAnJykudG9Mb3dlckNhc2UoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBuYW1lV2hpdGVzcGFjZUNoYXJhY3RlciBlcnJvclRleHRcblxuICAgICMgVGhlIHNlY29uZCBhcmd1bWVudCBoYXMgYSBgbG9jYCBwcm9wZXJ0eSwgd2hpY2ggc2hvdWxkIGhhdmUgdGhlIGxvY2F0aW9uIGRhdGEgZm9yIHRoaXMgdG9rZW4uIFxuICAgICMgVW5mb3J0dW5hdGVseSwgSmlzb24gc2VlbXMgdG8gc2VuZCBhbiBvdXRkYXRlZCBgbG9jYCAoZnJvbSB0aGUgcHJldmlvdXMgdG9rZW4pLCBcbiAgICAjIHNvIHdlIHRha2UgdGhlIGxvY2F0aW9uIGluZm9ybWF0aW9uIGRpcmVjdGx5IGZyb20gdGhlIGxleGVyLlxuICAgIFxuICAgIHRocm93U3ludGF4RXJyb3IgXCJ1bmV4cGVjdGVkICN7ZXJyb3JUZXh0fVwiLCBlcnJvckxvY1xuXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4jICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcblxuZ2V0U291cmNlTWFwID0gKGZpbGVuYW1lKSAtPlxuICAgICBcbiAgICAjIEtvZmZlZSBjb21waWxlZCBpbiBhIGJyb3dzZXIgbWF5IGdldCBjb21waWxlZCB3aXRoIGBvcHRpb25zLmZpbGVuYW1lYCBvZiBgPGFub255bW91cz5gLCBcbiAgICAjIGJ1dCB0aGUgYnJvd3NlciBtYXkgcmVxdWVzdCB0aGUgc3RhY2sgdHJhY2Ugd2l0aCB0aGUgZmlsZW5hbWUgb2YgdGhlIHNjcmlwdCBmaWxlLlxuICAgIFxuICAgIGlmIHNvdXJjZU1hcHNbZmlsZW5hbWVdP1xuICAgICAgICBzb3VyY2VNYXBzW2ZpbGVuYW1lXVxuICAgIGVsc2UgaWYgc291cmNlTWFwc1snPGFub255bW91cz4nXT9cbiAgICAgICAgc291cmNlTWFwc1snPGFub255bW91cz4nXVxuICAgIGVsc2UgaWYgc291cmNlc1tmaWxlbmFtZV0/XG4gICAgICAgIGFuc3dlciA9IGNvbXBpbGUgc291cmNlc1tmaWxlbmFtZV0sXG4gICAgICAgICAgICBmaWxlbmFtZTogZmlsZW5hbWVcbiAgICAgICAgICAgIHNvdXJjZU1hcDogeWVzXG4gICAgICAgIGFuc3dlci5zb3VyY2VNYXBcbiAgICBlbHNlXG4gICAgICAgIG51bGxcblxuIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4jIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAgICAwMDAgICAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIFxuIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcblxuIyBCYXNlZCBvbiBbbWljaGFlbGZpY2FycmEvS29mZmVlUmVkdXhdKGh0dHA6Ly9nb28uZ2wvWlR4MXApXG4jIE5vZGVKUyAvIFY4IGhhdmUgbm8gc3VwcG9ydCBmb3IgdHJhbnNmb3JtaW5nIHBvc2l0aW9ucyBpbiBzdGFjayB0cmFjZXMgdXNpbmdcbiMgc291cmNlTWFwLCBzbyB3ZSBtdXN0IG1vbmtleS1wYXRjaCBFcnJvciB0byBkaXNwbGF5IEtvZmZlZSBzb3VyY2UgcG9zaXRpb25zLlxuXG5FcnJvci5wcmVwYXJlU3RhY2tUcmFjZSA9IChlcnIsIHN0YWNrKSAtPlxuICAgIFxuICAgIGdldFNvdXJjZU1hcHBpbmcgPSAoZmlsZW5hbWUsIGxpbmUsIGNvbHVtbikgLT5cbiAgICAgICAgc291cmNlTWFwID0gZ2V0U291cmNlTWFwIGZpbGVuYW1lXG4gICAgICAgIGFuc3dlciA9IHNvdXJjZU1hcC5zb3VyY2VMb2NhdGlvbiBbbGluZSAtIDEsIGNvbHVtbiAtIDFdIGlmIHNvdXJjZU1hcD9cbiAgICAgICAgaWYgYW5zd2VyPyB0aGVuIFthbnN3ZXJbMF0gKyAxLCBhbnN3ZXJbMV0gKyAxXSBlbHNlIG51bGxcblxuICAgIGZyYW1lcyA9IGZvciBmcmFtZSBpbiBzdGFja1xuICAgICAgICBicmVhayBpZiBmcmFtZS5nZXRGdW5jdGlvbigpIGlzIGV4cG9ydHMucnVuXG4gICAgICAgIFwiICAgICAgICBhdCAje2Zvcm1hdFNvdXJjZVBvc2l0aW9uIGZyYW1lLCBnZXRTb3VyY2VNYXBwaW5nfVwiXG5cbiAgICBcIiN7ZXJyLnRvU3RyaW5nKCl9XFxuI3tmcmFtZXMuam9pbiAnXFxuJ31cXG5cIlxuICAgIFxuIyBCYXNlZCBvbiBodHRwOi8vdjguZ29vZ2xlY29kZS5jb20vc3ZuL2JyYW5jaGVzL2JsZWVkaW5nX2VkZ2Uvc3JjL21lc3NhZ2VzLmpzXG4jIE1vZGlmaWVkIHRvIGhhbmRsZSBzb3VyY2VNYXBcblxuZm9ybWF0U291cmNlUG9zaXRpb24gPSAoZnJhbWUsIGdldFNvdXJjZU1hcHBpbmcpIC0+XG4gICAgXG4gICAgZmlsZW5hbWUgPSB1bmRlZmluZWRcbiAgICBmaWxlTG9jYXRpb24gPSAnJ1xuXG4gICAgaWYgZnJhbWUuaXNOYXRpdmUoKVxuICAgICAgICBmaWxlTG9jYXRpb24gPSBcIm5hdGl2ZVwiXG4gICAgZWxzZVxuICAgICAgICBpZiBmcmFtZS5pc0V2YWwoKVxuICAgICAgICAgICAgZmlsZW5hbWUgPSBmcmFtZS5nZXRTY3JpcHROYW1lT3JTb3VyY2VVUkwoKVxuICAgICAgICAgICAgZmlsZUxvY2F0aW9uID0gXCIje2ZyYW1lLmdldEV2YWxPcmlnaW4oKX0sIFwiIHVubGVzcyBmaWxlbmFtZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBmaWxlbmFtZSA9IGZyYW1lLmdldEZpbGVOYW1lKClcblxuICAgICAgICBmaWxlbmFtZSBvcj0gXCI8YW5vbnltb3VzPlwiXG5cbiAgICAgICAgbGluZSA9IGZyYW1lLmdldExpbmVOdW1iZXIoKVxuICAgICAgICBjb2x1bW4gPSBmcmFtZS5nZXRDb2x1bW5OdW1iZXIoKVxuXG4gICAgICAgICMgQ2hlY2sgZm9yIGEgc291cmNlTWFwIHBvc2l0aW9uXG4gICAgICAgIHNvdXJjZSA9IGdldFNvdXJjZU1hcHBpbmcgZmlsZW5hbWUsIGxpbmUsIGNvbHVtblxuICAgICAgICBmaWxlTG9jYXRpb24gPVxuICAgICAgICAgICAgaWYgc291cmNlXG4gICAgICAgICAgICAgICAgXCIje2ZpbGVuYW1lfToje3NvdXJjZVswXX06I3tzb3VyY2VbMV19XCJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBcIiN7ZmlsZW5hbWV9OiN7bGluZX06I3tjb2x1bW59XCJcblxuICAgIGZ1bmN0aW9uTmFtZSA9IGZyYW1lLmdldEZ1bmN0aW9uTmFtZSgpXG4gICAgaXNDb25zdHJ1Y3RvciA9IGZyYW1lLmlzQ29uc3RydWN0b3IoKVxuICAgIGlzTWV0aG9kQ2FsbCA9IG5vdCAoZnJhbWUuaXNUb3BsZXZlbCgpIG9yIGlzQ29uc3RydWN0b3IpXG5cbiAgICBpZiBpc01ldGhvZENhbGxcbiAgICAgICAgbWV0aG9kTmFtZSA9IGZyYW1lLmdldE1ldGhvZE5hbWUoKVxuICAgICAgICB0eXBlTmFtZSA9IGZyYW1lLmdldFR5cGVOYW1lKClcblxuICAgICAgICBpZiBmdW5jdGlvbk5hbWVcbiAgICAgICAgICAgIHRwID0gYXMgPSAnJ1xuICAgICAgICAgICAgaWYgdHlwZU5hbWUgYW5kIGZ1bmN0aW9uTmFtZS5pbmRleE9mIHR5cGVOYW1lXG4gICAgICAgICAgICAgICAgdHAgPSBcIiN7dHlwZU5hbWV9LlwiXG4gICAgICAgICAgICBpZiBtZXRob2ROYW1lIGFuZCBmdW5jdGlvbk5hbWUuaW5kZXhPZihcIi4je21ldGhvZE5hbWV9XCIpICE9IGZ1bmN0aW9uTmFtZS5sZW5ndGggLSBtZXRob2ROYW1lLmxlbmd0aCAtIDFcbiAgICAgICAgICAgICAgICBhcyA9IFwiIFthcyAje21ldGhvZE5hbWV9XVwiXG5cbiAgICAgICAgICAgIFwiI3t0cH0je2Z1bmN0aW9uTmFtZX0je2FzfSAoI3tmaWxlTG9jYXRpb259KVwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIFwiI3t0eXBlTmFtZX0uI3ttZXRob2ROYW1lIG9yICc8YW5vbnltb3VzPid9ICgje2ZpbGVMb2NhdGlvbn0pXCJcbiAgICBlbHNlIGlmIGlzQ29uc3RydWN0b3JcbiAgICAgICAgXCJuZXcgI3tmdW5jdGlvbk5hbWUgb3IgJzxhbm9ueW1vdXM+J30gKCN7ZmlsZUxvY2F0aW9ufSlcIlxuICAgIGVsc2UgaWYgZnVuY3Rpb25OYW1lXG4gICAgICAgIFwiI3tmdW5jdGlvbk5hbWV9ICgje2ZpbGVMb2NhdGlvbn0pXCJcbiAgICBlbHNlXG4gICAgICAgIGZpbGVMb2NhdGlvblxuICAgIFxuICAgICJdfQ==
//# sourceURL=../coffee/koffee.coffee