// koffee 0.52.0

/*
 0000000   0000000   00     00  00     00   0000000   000   000  0000000    
000       000   000  000   000  000   000  000   000  0000  000  000   000  
000       000   000  000000000  000000000  000000000  000 0 000  000   000  
000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  
 0000000   0000000   000   000  000   000  000   000  000   000  0000000
 */
var FEATURES, Koffee, SWITCHES, baseFileName, compileOptions, compilePath, compileScript, compileStdio, error, exec, findDirectoryIndex, fs, helpers, hidden, isCoffee, logFeatures, makePrelude, merge, mkdirp, nopt, opts, outputPath, pad, parseOptions, path, print, printLine, printRewriter, printTokens, printWarn, ref, ref1, run, spawn, startRepl, stringify, timeLog, usage, useWinPathSep, version, wait, watchDir, watchFile, watchPath, writeJs;

fs = require('fs');

path = require('path');

nopt = require('nopt');

helpers = require('./helpers');

Koffee = require('./koffee');

ref = require('child_process'), spawn = ref.spawn, exec = ref.exec;

useWinPathSep = path.sep === '\\';

helpers.colors();

ref1 = require('./features'), FEATURES = ref1.FEATURES, logFeatures = ref1.logFeatures;

baseFileName = helpers.baseFileName, isCoffee = helpers.isCoffee, stringify = helpers.stringify, merge = helpers.merge, pad = helpers.pad;

error = console.error;

print = function(line) {
    return process.stdout.write(line);
};

printLine = function(line) {
    return process.stdout.write(line + '\n');
};

printWarn = function(line) {
    return process.stderr.write(line + '\n');
};

hidden = function(file) {
    return /^\.|~$/.test(file);
};

SWITCHES = [['-b', '--bare', 'compile without a top-level function wrapper', Boolean], ['-c', '--compile', 'compile to JavaScript and save as .js files', Boolean], ['-d', '--doc', 'log the ▸doc sections', Boolean], ['-e', '--eval STRING', 'evaluate a string and print the result', [String, Array]], ['-f', '--features', 'list available features', Boolean], ['', '--no-`feature', 'disable a feature, e.g. --no-negative-index', null], ['-h', '--help', 'display this help message', Boolean], ['-j', '--js', 'print out the compiled JavaScript', Boolean], ['-m', '--map', 'generate source map and save as .js.map files', Boolean], ['-M', '--inline-map', 'generate source map and include it directly in output', Boolean], ['', '--metalog', 'meta log (default: console.log)', String], ['-n', '--noop', 'does nothing, for debugging purposes', Boolean], ['-o', '--output DIR', 'set the output directory for compiled JavaScript', String], ['-P', '--parse', 'print out the parse tree that the parser produces', Boolean], ['-r', '--require MODULE', 'require the given module before eval or REPL', [String, Array]], ['-C', '--coffee', 'print the token stream as CoffeeScript', Boolean], ['-s', '--stdio', 'listen for and compile scripts over stdio', Boolean], ['-t', '--test', 'compile and run the @test code', Boolean], ['-T', '--tokens', 'print out the tokens that the lexer/rewriter produce', Boolean], ['-v', '--version', 'display the version number', Boolean], ['-w', '--watch', 'watch scripts for changes and rerun commands', Boolean]];

opts = {};

parseOptions = function() {
    var known, o, short;
    known = {
        Debug: Boolean
    };
    short = {
        D: '--Debug',
        p: '--js'
    };
    SWITCHES.map(function(s) {
        var l;
        l = s[1].split(' ')[0].slice(2);
        if (s[3]) {
            known[l] = s[3];
        }
        if (s[0] !== '') {
            return short[s[0][1]] = "--" + l;
        }
    });
    FEATURES.map(function(f) {
        return known[f.lag] = Boolean;
    });
    o = opts = nopt(known, short);
    o.compile || (o.compile = !!o.output);
    o["arguments"] = o.argv.remain;
    if (o.require) {
        o.prelude = makePrelude(o.require);
    }
    o.run = !(o.compile || o.js || o.map || o.tokens || o.parse);
    o.js = !!(o.js || o["eval"] || o.stdio && o.compile);
    o.feature = {};
    FEATURES.map(function(f) {
        var ref2;
        o.feature[f.key] = (ref2 = o[f.flag]) != null ? ref2 : true;
        return delete o[f.flag];
    });
    if (o.Debug) {
        delete o.argv;
        return console.log(stringify(o));
    }
};

run = function() {
    var eval, i, j, len, len1, literals, ref2, ref3, results, source;
    parseOptions();
    if (opts.feature.color === false) {
        colorette.options.enabled = false;
    }
    if (opts.features) {
        return logFeatures();
    }
    if (opts.help) {
        return usage();
    }
    if (opts.version) {
        return version();
    }
    if (opts.interactive) {
        return startRepl();
    }
    if (opts.stdio) {
        return compileStdio();
    }
    if (opts["eval"]) {
        ref2 = opts["eval"];
        for (i = 0, len = ref2.length; i < len; i++) {
            eval = ref2[i];
            compileScript(eval);
        }
        return;
    }
    if (!opts["arguments"].length) {
        return startRepl();
    }
    literals = !opts.watch && !opts.compile ? opts["arguments"].splice(1) : [];
    process.argv = process.argv.slice(0, 2).concat(literals);
    process.argv[0] = 'koffee';
    if (opts.output) {
        opts.output = path.resolve(opts.output);
    }
    ref3 = opts["arguments"];
    results = [];
    for (j = 0, len1 = ref3.length; j < len1; j++) {
        source = ref3[j];
        source = path.resolve(source);
        if (opts.watch) {
            results.push(watchPath(source));
        } else {
            results.push(compilePath(source, {
                topLevel: true
            }));
        }
    }
    return results;
};

exports.run = run;

startRepl = function() {
    var replCliOpts;
    replCliOpts = {
        useGlobal: true
    };
    replCliOpts.prelude = opts.prelude;
    return require('./repl').start(replCliOpts);
};

makePrelude = function(requires) {
    return requires.map(function(module) {
        var _, match, name;
        if (match = module.match(/^(.*)=(.*)$/)) {
            _ = match[0], name = match[1], module = match[2];
        }
        name || (name = baseFileName(module, true, useWinPathSep));
        return name + " = require('" + module + "')";
    }).join(';');
};

compilePath = function(source, arg) {
    var code, err, file, files, i, len, ref2, ref3, results, stats, topLevel;
    topLevel = (ref2 = arg.topLevel) != null ? ref2 : false;
    if (!topLevel && hidden(source)) {
        return;
    }
    try {
        stats = fs.statSync(source);
    } catch (error1) {
        err = error1;
        if (err.code === 'ENOENT') {
            console.error("Command.compilePath can't stat '" + source + "'");
            process.exit(1);
        }
        throw err;
    }
    if (stats.isDirectory()) {
        if ((ref3 = path.basename(source)) === 'node_modules' || ref3 === '.git') {
            return;
        }
        if (opts.run) {
            compilePath(findDirectoryIndex(source), {
                topLevel: topLevel
            });
            return;
        }
        if (opts.Debug) {
            console.log('Command.compilePath dir:', source);
        }
        try {
            files = fs.readdirSync(source);
        } catch (error1) {
            err = error1;
            if (err.code === 'ENOENT') {
                return;
            }
            throw err;
        }
        results = [];
        for (i = 0, len = files.length; i < len; i++) {
            file = files[i];
            results.push(compilePath(path.join(source, file)));
        }
        return results;
    } else if (topLevel || isCoffee(source)) {
        try {
            code = fs.readFileSync(source);
        } catch (error1) {
            err = error1;
            if (err.code === 'ENOENT') {
                return;
            }
            throw err;
        }
        if (opts.Debug) {
            console.log('Command.compilePath file:', source);
        }
        return compileScript(code.toString(), source);
    }
};

findDirectoryIndex = function(source) {
    var err, ext, i, index, len, ref2;
    ref2 = Koffee.FILE_EXTENSIONS;
    for (i = 0, len = ref2.length; i < len; i++) {
        ext = ref2[i];
        index = path.join(source, "index" + ext);
        try {
            if ((fs.statSync(index)).isFile()) {
                return index;
            }
        } catch (error1) {
            err = error1;
            if (err.code !== 'ENOENT') {
                throw err;
            }
        }
    }
    console.error("Missing index.coffee in " + source);
    return process.exit(1);
};

compileScript = function(code, source) {
    var base, compiled, err, message, o, options, t, task;
    if (source == null) {
        source = null;
    }
    o = opts;
    options = compileOptions(source);
    try {
        t = task = {
            source: source,
            code: code,
            options: options
        };
        if (o.tokens) {
            return printTokens(Koffee.tokens(t.code, t.options));
        } else if (o.coffee) {
            return printRewriter(Koffee.tokens(t.code, t.options));
        } else if (o.parse) {
            return printLine(Koffee.nodes(t.code, t.options).toString().trim());
        } else if (o.run) {
            Koffee.register();
            if (opts.prelude) {
                Koffee["eval"](opts.prelude, t.options);
            }
            if ((base = t.options).filename != null) {
                base.filename;
            } else {
                base.filename = options.source;
            }
            if (opts.noop) {
                return console.log("noop run " + source);
            } else {
                return Koffee.run(t.code, t.options);
            }
        } else {
            compiled = Koffee.compile(t.code, t.options);
            t.output = compiled;
            if (o.map) {
                t.output = compiled.js;
                t.sourceMap = compiled.v3SourceMap;
            }
            if (o.js) {
                if (opts.noop) {
                    return console.log("noop js " + source);
                } else {
                    return printLine(t.output.trim());
                }
            } else if (o.compile || o.map) {
                if (opts.noop) {
                    return console.log("noop write " + options.jsPath);
                } else {
                    return writeJs(t.source, t.output, options.jsPath, t.sourceMap);
                }
            }
        }
    } catch (error1) {
        err = error1;
        message = err.message;
        if (err instanceof SyntaxError) {
            printLine(message);
        } else {
            printLine(err.stack);
        }
        if (o.watch || o["eval"]) {
            return print('\x07');
        } else {
            return process.exit(1);
        }
    }
};

compileOptions = function(source) {
    var copts, cwd, jsDir, jsPath;
    copts = Object.assign({}, opts);
    copts.sourceMap = opts.map;
    copts.inlineMap = opts['inline-map'];
    if (source) {
        cwd = process.cwd();
        jsPath = outputPath(source, '.js');
        jsDir = path.dirname(jsPath);
        copts = merge(copts, {
            jsPath: jsPath,
            source: source,
            sourceRoot: path.relative(jsDir, cwd),
            sourceFiles: [path.relative(cwd, source)],
            generatedFile: baseFileName(jsPath, false, useWinPathSep)
        });
    }
    return copts;
};

compileStdio = function() {
    var buffers, stdin;
    buffers = [];
    stdin = process.openStdin();
    stdin.on('data', function(buffer) {
        if (buffer) {
            return buffers.push(buffer);
        }
    });
    return stdin.on('end', function() {
        return compileScript(Buffer.concat(buffers).toString());
    });
};

watchPath = function(source) {
    var err, stats;
    try {
        stats = fs.statSync(source);
    } catch (error1) {
        err = error1;
        if (err.code === 'ENOENT') {
            return;
        }
        return console.error("Command.watchPath can't stat '" + source + "'", err);
    }
    if (stats.isDirectory()) {
        return watchDir(source);
    } else {
        return watchFile(source);
    }
};

watchFile = function(source) {
    var compileTimeout, err, prevStats, startWatcher, watcher;
    if (!isCoffee(source)) {
        return;
    }
    if (opts.Debug) {
        console.log('Command.watchFile', source);
    }
    watcher = null;
    prevStats = null;
    compileTimeout = null;
    startWatcher = function() {
        return watcher = fs.watch(source).on('change', function(change) {
            if (change !== 'change') {
                return;
            }
            if (opts.Debug) {
                console.log('Command.watchFile', change, source);
            }
            clearTimeout(compileTimeout);
            return compileTimeout = wait(25, function() {
                return fs.stat(source, function(err, stats) {
                    if ((err != null ? err.code : void 0) === 'ENOENT') {
                        return watcher.close();
                    }
                    if (err) {
                        return console.error(err);
                    }
                    if (prevStats && stats.mtime.getTime() === prevStats.mtime.getTime() && stats.size === prevStats.size) {
                        return;
                    }
                    prevStats = stats;
                    return fs.readFile(source, function(err, code) {
                        if (err) {
                            return console.error(err);
                        }
                        if (opts.Debug) {
                            console.log('Command.watchFile compile', source);
                        }
                        return compileScript(code.toString(), source);
                    });
                });
            });
        }).on('error', function(err) {
            if (err.code !== 'EPERM') {
                throw err;
            }
        });
    };
    try {
        return startWatcher();
    } catch (error1) {
        err = error1;
        return console.error(err);
    }
};

watchDir = function(source) {
    var err, startWatcher, watcher;
    if (opts.Debug) {
        console.log('Command.watchDir', source);
    }
    watcher = null;
    startWatcher = function() {
        var err, file, files, i, len;
        try {
            files = fs.readdirSync(source);
        } catch (error1) {
            err = error1;
            if ((err != null ? err.code : void 0) === 'ENOENT') {
                return;
            }
            throw err;
        }
        for (i = 0, len = files.length; i < len; i++) {
            file = files[i];
            if (file[0] === '.') {
                continue;
            }
            if (file === 'node_modules') {
                continue;
            }
            watchPath(path.join(source, file));
        }
        return watcher = fs.watch(source).on('error', function(err) {
            if (err.code !== 'EPERM') {
                throw err;
            }
            return watcher.close();
        }).on('change', function(change, p) {
            if (change === 'rename') {
                if (opts.Debug) {
                    console.log('Command.watchDir', change, path.join(source, p));
                }
                return watchPath(path.join(source, p));
            }
        });
    };
    try {
        return startWatcher();
    } catch (error1) {
        err = error1;
        if (err.code === 'ENOENT') {
            return;
        }
        throw err;
    }
};

outputPath = function(source, extension) {
    var basename, dir;
    basename = baseFileName(source, true, useWinPathSep);
    if (opts.output) {
        dir = opts.output;
    } else {
        dir = path.dirname(source);
    }
    return path.join(dir, basename + extension);
};

mkdirp = function(dir, fn) {
    var mkdirs, mode;
    mode = 0x1ff & ~process.umask();
    return (mkdirs = function(p, fn) {
        return fs.exists(p, function(exists) {
            if (exists) {
                return fn();
            } else {
                return mkdirs(path.dirname(p), function() {
                    return fs.mkdir(p, mode, function(err) {
                        if (err) {
                            return fn(err);
                        }
                        return fn();
                    });
                });
            }
        });
    })(dir, fn);
};

writeJs = function(source, js, jsPath, generatedSourceMap) {
    var compile, jsDir, sourceMapPath;
    if (generatedSourceMap == null) {
        generatedSourceMap = null;
    }
    sourceMapPath = outputPath(source, '.js.map');
    jsDir = path.dirname(jsPath);
    compile = function() {
        if (opts.compile) {
            if (js.length <= 0) {
                js = ' ';
            }
            if (generatedSourceMap) {
                js = js + "\n//# sourceMappingURL=" + (baseFileName(sourceMapPath, false, useWinPathSep)) + "\n";
            }
            fs.writeFile(jsPath, js, function(err) {
                if (err) {
                    printLine(err.message);
                    return process.exit(1);
                } else if (opts.compile && opts.watch) {
                    return timeLog("compiled " + source);
                }
            });
        }
        if (generatedSourceMap) {
            return fs.writeFile(sourceMapPath, generatedSourceMap, function(err) {
                if (err) {
                    printLine("Could not write source map: " + err.message);
                    return process.exit(1);
                }
            });
        }
    };
    return fs.exists(jsDir, function(itExists) {
        if (itExists) {
            return compile();
        } else {
            return mkdirp(jsDir, compile);
        }
    });
};

wait = function(milliseconds, func) {
    return setTimeout(func, milliseconds);
};

timeLog = function(message) {
    return console.log(((new Date).toLocaleTimeString()) + " - " + message);
};

printTokens = function(tokens) {
    var ctag, cvalue, i, index, ref2, results, tag, token, value;
    results = [];
    for (index = i = 0, ref2 = tokens.length; 0 <= ref2 ? i < ref2 : i > ref2; index = 0 <= ref2 ? ++i : --i) {
        token = tokens[index];
        tag = token[0];
        value = token[1].toString().replace(/\n/, '\\n');
        ctag = gray(tag);
        cvalue = bold(yellow(value));
        index = gray(dim(index));
        if (tag === 'TERMINATOR') {
            results.push(print('\n\n'));
        } else if (tag === 'INDENT') {
            results.push(print(gray(dim('IND '))));
        } else if (tag === 'OUTDENT') {
            results.push(print(gray(dim('OUT '))));
        } else if (tag === 'CLASS' || tag === 'PARAM_START' || tag === 'PARAM_END' || tag === 'NULL') {
            results.push(print("" + index + ctag + " "));
        } else if (tag === value) {
            results.push(print("" + index + cvalue + " "));
        } else {
            results.push(print("" + index + ctag + "=" + cvalue + " "));
        }
    }
    return results;
};

printRewriter = function(tokens) {
    var blueDim, grayDim, i, indent, index, ref2, ref3, results, spaced, tag, token, value, yellowDim;
    indent = 0;
    results = [];
    for (index = i = 0, ref2 = tokens.length; 0 <= ref2 ? i < ref2 : i > ref2; index = 0 <= ref2 ? ++i : --i) {
        token = tokens[index];
        tag = token[0];
        value = token[1];
        grayDim = function(s) {
            return dim(gray(s));
        };
        blueDim = function(s) {
            return dim(blue(s));
        };
        yellowDim = function(s) {
            return dim(yellow(s));
        };
        spaced = function(color, v) {
            var ref3;
            print(color("" + (v != null ? v : value)));
            if (token.spaced && ((ref3 = tokens[index + 1][0]) !== 'CALL_START')) {
                return print(' ');
            }
        };
        switch (tag) {
            case 'TERMINATOR':
                results.push(print("\n" + (pad('', indent))));
                break;
            case 'INDENT':
                indent += 4;
                results.push(print("\n" + (pad('', indent))));
                break;
            case 'OUTDENT':
                indent -= 4;
                results.push(print("\n" + (pad('', indent))));
                break;
            case 'HERECOMMENT':
                results.push(spaced(grayDim));
                break;
            case 'CALL_START':
            case 'CALL_END':
                results.push(spaced(grayDim));
                break;
            case 'UNARY':
                results.push(spaced(blueBright, 'not'));
                break;
            case '&&':
                results.push(spaced(blueBright, 'and'));
                break;
            case '||':
                results.push(spaced(blueBright, 'or'));
                break;
            case 'STRING':
                results.push(spaced(green));
                break;
            case 'STRING_START':
            case 'STRING_END':
                results.push(spaced(redBright));
                break;
            case 'PROPERTY':
                results.push(spaced(yellow));
                break;
            case ':':
                results.push(spaced(yellowDim));
                break;
            case '@':
                if ((ref3 = tokens[index + 1][0]) !== 'META_IF' && ref3 !== 'META_ELSE' && ref3 !== 'POST_META_IF') {
                    results.push(spaced(yellowDim));
                } else {
                    results.push(spaced(blueDim));
                }
                break;
            case 'META_IF':
            case 'META_ELSE':
            case 'POST_META_IF':
                results.push(spaced(blue, '▸' + value));
                break;
            case 'NUMBER':
                results.push(spaced(blue));
                break;
            case '{':
            case '}':
                if (!token.generated) {
                    results.push(spaced(gray));
                } else {
                    results.push(void 0);
                }
                break;
            case '=':
            case '+':
            case '-':
            case '++':
            case '--':
            case '...':
            case '::':
            case '[':
            case ']':
            case '{':
            case '}':
            case '.':
            case 'MATH':
            case 'UNARY_MATH':
            case 'INDEX_START':
            case 'INDEX_END':
            case 'COMPARE':
            case 'COMPOUND_ASSIGN':
                results.push(spaced(gray));
                break;
            case ',':
            case '(':
            case ')':
                results.push(spaced(grayDim));
                break;
            case 'PARAM_START':
            case 'PARAM_END':
            case '->':
            case '=>':
                results.push(spaced(function(s) {
                    return bold(blue(s));
                }));
                break;
            case 'NULL':
            case 'UNDEFINED':
            case 'FUNC_EXIST':
            case '?':
            case '?.':
            case 'BIN?':
                results.push(spaced(red));
                break;
            case 'REGEX':
                results.push(spaced(magenta));
                break;
            case 'FOR':
            case 'FORIN':
            case 'TRY':
            case 'CATCH':
            case 'THROW':
            case 'RELATION':
            case 'EXTENDS':
            case 'STATEMENT':
            case 'OWN':
            case 'FOROF':
            case 'LOOP':
            case 'IF':
            case 'POST_IF':
            case 'WHEN':
            case 'THEN':
            case 'ELSE':
            case 'THIS':
            case 'SUPER':
            case 'SWITCH':
            case 'LEADING_WHEN':
            case 'WHILE':
            case 'BOOL':
            case 'CLASS':
            case 'RETURN':
                results.push(spaced(blueBright));
                break;
            case 'IDENTIFIER':
                switch (value) {
                    case 'require':
                        results.push(spaced(gray));
                        break;
                    default:
                        results.push(spaced(whiteBright));
                }
                break;
            default:
                print(">" + tag + "<");
                results.push(spaced(cyan));
        }
    }
    return results;
};

version = function() {
    return printLine("" + Koffee.VERSION);
};

usage = function() {
    var lines, rules;
    lines = [(gray('Usage:')) + " " + (yellow('koffee')) + " " + (gray('[options]')) + " path/to/script " + (gray('[options]')) + "\n"];
    rules = SWITCHES.map(function(rule) {
        var clong, cshort, description, long, longFlag, short;
        short = rule[0], long = rule[1], description = rule[2];
        longFlag = long.match(/^(--\w[\w\-]*)/)[1];
        cshort = short ? gray(short[0]) + bold(gray(short.slice(1))) + '  ' : '    ';
        clong = pad(long, 20);
        clong = gray(clong.slice(0, 2)) + bold(white(clong.slice(2).split(' ')[0])) + ' ' + bold(blueBright(clong.slice(2).split(' ').slice(1).join(' ')));
        return lines.push('    ' + cshort + clong + gray(description));
    });
    lines.push(gray('\nIf called without a script, the interactive REPL will be started'));
    return console.log("\n" + (lines.join('\n')) + "\n");
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBaUJBLEVBQUEsR0FBbUIsT0FBQSxDQUFRLElBQVI7O0FBQ25CLElBQUEsR0FBbUIsT0FBQSxDQUFRLE1BQVI7O0FBQ25CLElBQUEsR0FBbUIsT0FBQSxDQUFRLE1BQVI7O0FBQ25CLE9BQUEsR0FBbUIsT0FBQSxDQUFRLFdBQVI7O0FBQ25CLE1BQUEsR0FBbUIsT0FBQSxDQUFRLFVBQVI7O0FBQ25CLE1BQW1CLE9BQUEsQ0FBUSxlQUFSLENBQW5CLEVBQUUsaUJBQUYsRUFBUzs7QUFFVCxhQUFBLEdBQW1CLElBQUksQ0FBQyxHQUFMLEtBQVk7O0FBRS9CLE9BQU8sQ0FBQyxNQUFSLENBQUE7O0FBRUEsT0FBNEIsT0FBQSxDQUFRLFlBQVIsQ0FBNUIsRUFBRSx3QkFBRixFQUFZOztBQUVWLG1DQUFGLEVBQWdCLDJCQUFoQixFQUEwQiw2QkFBMUIsRUFBcUMscUJBQXJDLEVBQTRDOztBQUU1QyxLQUFBLEdBQVksT0FBTyxDQUFDOztBQUNwQixLQUFBLEdBQVksU0FBQyxJQUFEO1dBQVUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFmLENBQXFCLElBQXJCO0FBQVY7O0FBQ1osU0FBQSxHQUFZLFNBQUMsSUFBRDtXQUFVLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBZixDQUFxQixJQUFBLEdBQU8sSUFBNUI7QUFBVjs7QUFDWixTQUFBLEdBQVksU0FBQyxJQUFEO1dBQVUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFmLENBQXFCLElBQUEsR0FBTyxJQUE1QjtBQUFWOztBQUNaLE1BQUEsR0FBWSxTQUFDLElBQUQ7V0FBVSxRQUFRLENBQUMsSUFBVCxDQUFjLElBQWQ7QUFBVjs7QUFFWixRQUFBLEdBQVcsQ0FDUCxDQUFDLElBQUQsRUFBTSxRQUFOLEVBQTRCLDhDQUE1QixFQUFvRixPQUFwRixDQURPLEVBRVAs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QUE1QixDQUFMLENBQXBCLEdBQTRELEdBQTVELEdBQWtFLElBQUEsQ0FBSyxVQUFBLENBQVcsS0FBTSxTQUFJLENBQUMsS0FBWCxDQUFpQixHQUFqQixDQUFzQixTQUFJLENBQUMsSUFBM0IsQ0FBZ0MsR0FBaEMsQ0FBWCxDQUFMO2VBQzdFLEtBQUssQ0FBQyxJQUFOLENBQVcsTUFBQSxHQUFTLE1BQVQsR0FBa0IsS0FBbEIsR0FBMEIsSUFBQSxDQUFLLFdBQUwsQ0FBckM7SUFOaUIsQ0FBYjtJQVFSLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBQSxDQUFLLG9FQUFMLENBQVg7V0FBb0YsT0FBQSxDQUVwRixHQUZvRixDQUVoRixJQUFBLEdBQUksQ0FBRSxLQUFLLENBQUMsSUFBTixDQUFXLElBQVgsQ0FBRixDQUFKLEdBQXdCLElBRndEO0FBWjlFIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4jIyNcblxuIyBoYW5kbGUgdmFyaW91cyB0YXNrczogXG4jXG4jICAgLSBjb21waWxlIGFuZCBzYXZlIGludG8gYC5qc2AgZmlsZXMgXG4jICAgLSBjb21waWxlIGFuZCBwcmludCB0byBzdGRvdXQgXG4jICAgLSByZWNvbXBpbGUgaWYgdGhlIHNvdXJjZSBjaGFuZ2VzXG4jICAgLSBwcmludCBsZXhlciB0b2tlbnNcbiMgICAtIHByaW50IGEgc3ludGF4IHRyZWVcbiMgICAtIGxhdW5jaCBhIFJFUExcblxuZnMgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ2ZzJ1xucGF0aCAgICAgICAgICAgICA9IHJlcXVpcmUgJ3BhdGgnXG5ub3B0ICAgICAgICAgICAgID0gcmVxdWlyZSAnbm9wdCdcbmhlbHBlcnMgICAgICAgICAgPSByZXF1aXJlICcuL2hlbHBlcnMnXG5Lb2ZmZWUgICAgICAgICAgID0gcmVxdWlyZSAnLi9rb2ZmZWUnXG57IHNwYXduLCBleGVjIH0gID0gcmVxdWlyZSAnY2hpbGRfcHJvY2VzcydcblxudXNlV2luUGF0aFNlcCAgICA9IHBhdGguc2VwIGlzICdcXFxcJ1xuXG5oZWxwZXJzLmNvbG9ycygpXG5cbnsgRkVBVFVSRVMsIGxvZ0ZlYXR1cmVzIH0gPSByZXF1aXJlICcuL2ZlYXR1cmVzJ1xuXG57IGJhc2VGaWxlTmFtZSwgaXNDb2ZmZWUsIHN0cmluZ2lmeSwgbWVyZ2UsIHBhZCB9ID0gaGVscGVyc1xuXG5lcnJvciAgICAgPSBjb25zb2xlLmVycm9yXG5wcmludCAgICAgPSAobGluZSkgLT4gcHJvY2Vzcy5zdGRvdXQud3JpdGUgbGluZVxucHJpbnRMaW5lID0gKGxpbmUpIC0+IHByb2Nlc3Muc3Rkb3V0LndyaXRlIGxpbmUgKyAnXFxuJyAjID8/P1xucHJpbnRXYXJuID0gKGxpbmUpIC0+IHByb2Nlc3Muc3RkZXJyLndyaXRlIGxpbmUgKyAnXFxuJyAjID8/P1xuaGlkZGVuICAgID0gKGZpbGUpIC0+IC9eXFwufH4kLy50ZXN0IGZpbGVcblxuU1dJVENIRVMgPSBbXG4gICAgWyctYicgJy0tYmFyZScgICAgICAgICAgICAgICdjb21waWxlIHdpdGhvdXQgYSB0b3AtbGV2ZWwgZnVuY3Rpb24gd3JhcHBlcicgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLWMnICctLWNvbXBpbGUnICAgICAgICAgICAnY29tcGlsZSB0byBKYXZhU2NyaXB0IGFuZCBzYXZlIGFzIC5qcyBmaWxlcycgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1kJyAnLS1kb2MnICAgICAgICAgICAgICAgJ2xvZyB0aGUg4pa4ZG9jIHNlY3Rpb25zJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1lJyAnLS1ldmFsIFNUUklORycgICAgICAgJ2V2YWx1YXRlIGEgc3RyaW5nIGFuZCBwcmludCB0aGUgcmVzdWx0JyAgICAgICAgICAgICAgIFtTdHJpbmcsIEFycmF5XSBdXG4gICAgWyctZicgJy0tZmVhdHVyZXMnICAgICAgICAgICdsaXN0IGF2YWlsYWJsZSBmZWF0dXJlcycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnJyAgICctLW5vLWBmZWF0dXJlJyAgICAgICAnZGlzYWJsZSBhIGZlYXR1cmUsIGUuZy4gLS1uby1uZWdhdGl2ZS1pbmRleCcgICAgICAgICAgIG51bGwgICAgICAgICAgIF1cbiAgICBbJy1oJyAnLS1oZWxwJyAgICAgICAgICAgICAgJ2Rpc3BsYXkgdGhpcyBoZWxwIG1lc3NhZ2UnICAgICAgICAgICAgICAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctaicgJy0tanMnICAgICAgICAgICAgICAgICdwcmludCBvdXQgdGhlIGNvbXBpbGVkIEphdmFTY3JpcHQnICAgICAgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLW0nICctLW1hcCcgICAgICAgICAgICAgICAnZ2VuZXJhdGUgc291cmNlIG1hcCBhbmQgc2F2ZSBhcyAuanMubWFwIGZpbGVzJyAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1NJyAnLS1pbmxpbmUtbWFwJyAgICAgICAgJ2dlbmVyYXRlIHNvdXJjZSBtYXAgYW5kIGluY2x1ZGUgaXQgZGlyZWN0bHkgaW4gb3V0cHV0JyBCb29sZWFuICAgICAgICBdXG4gICAgWycnICAgJy0tbWV0YWxvZycgICAgICAgICAgICdtZXRhIGxvZyAoZGVmYXVsdDogY29uc29sZS5sb2cpJyAgICAgICAgICAgICAgICAgICAgICAgU3RyaW5nICAgICAgICAgXVxuICAgIFsnLW4nICctLW5vb3AnICAgICAgICAgICAgICAnZG9lcyBub3RoaW5nLCBmb3IgZGVidWdnaW5nIHB1cnBvc2VzJyAgICAgICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1vJyAnLS1vdXRwdXQgRElSJyAgICAgICAgJ3NldCB0aGUgb3V0cHV0IGRpcmVjdG9yeSBmb3IgY29tcGlsZWQgSmF2YVNjcmlwdCcgICAgICBTdHJpbmcgICAgICAgICBdXG4gICAgWyctUCcgJy0tcGFyc2UnICAgICAgICAgICAgICdwcmludCBvdXQgdGhlIHBhcnNlIHRyZWUgdGhhdCB0aGUgcGFyc2VyIHByb2R1Y2VzJyAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLXInICctLXJlcXVpcmUgTU9EVUxFJyAgICAncmVxdWlyZSB0aGUgZ2l2ZW4gbW9kdWxlIGJlZm9yZSBldmFsIG9yIFJFUEwnICAgICAgICAgW1N0cmluZywgQXJyYXldIF1cbiAgICBbJy1DJyAnLS1jb2ZmZWUnICAgICAgICAgICAgJ3ByaW50IHRoZSB0b2tlbiBzdHJlYW0gYXMgQ29mZmVlU2NyaXB0JyAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctcycgJy0tc3RkaW8nICAgICAgICAgICAgICdsaXN0ZW4gZm9yIGFuZCBjb21waWxlIHNjcmlwdHMgb3ZlciBzdGRpbycgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLXQnICctLXRlc3QnICAgICAgICAgICAgICAnY29tcGlsZSBhbmQgcnVuIHRoZSBAdGVzdCBjb2RlJyAgICAgICAgICAgICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1UJyAnLS10b2tlbnMnICAgICAgICAgICAgJ3ByaW50IG91dCB0aGUgdG9rZW5zIHRoYXQgdGhlIGxleGVyL3Jld3JpdGVyIHByb2R1Y2UnICBCb29sZWFuICAgICAgICBdXG4gICAgWyctdicgJy0tdmVyc2lvbicgICAgICAgICAgICdkaXNwbGF5IHRoZSB2ZXJzaW9uIG51bWJlcicgICAgICAgICAgICAgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLXcnICctLXdhdGNoJyAgICAgICAgICAgICAnd2F0Y2ggc2NyaXB0cyBmb3IgY2hhbmdlcyBhbmQgcmVydW4gY29tbWFuZHMnICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbl1cblxub3B0cyA9IHt9XG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgIFxuIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgXG5cbnBhcnNlT3B0aW9ucyA9IC0+XG5cbiAgICBrbm93biA9IERlYnVnOkJvb2xlYW5cbiAgICBzaG9ydCA9IEQ6Jy0tRGVidWcnIHA6Jy0tanMnXG4gICAgU1dJVENIRVMubWFwIChzKSAtPiBsID0gc1sxXS5zcGxpdCgnICcpWzBdWzIuLl07IGtub3duW2xdID0gc1szXSBpZiBzWzNdOyBzaG9ydFtzWzBdWzFdXSA9IFwiLS0je2x9XCIgaWYgc1swXSE9JydcbiAgICBGRUFUVVJFUy5tYXAgKGYpIC0+IGtub3duW2YubGFnXSA9IEJvb2xlYW5cbiAgICBcbiAgICBvID0gb3B0cyA9IG5vcHQga25vd24sIHNob3J0XG4gICAgICAgIFxuICAgIG8uY29tcGlsZSAgb3I9ICEhby5vdXRwdXRcbiAgICBvLmFyZ3VtZW50cyAgPSBvLmFyZ3YucmVtYWluXG4gICAgby5wcmVsdWRlICAgID0gbWFrZVByZWx1ZGUgby5yZXF1aXJlIGlmIG8ucmVxdWlyZVxuICAgIG8ucnVuICAgICAgICA9IG5vdCAoby5jb21waWxlIG9yIG8uanMgb3Igby5tYXAgb3Igby50b2tlbnMgb3Igby5wYXJzZSlcbiAgICBvLmpzICAgICAgICAgPSAhIShvLmpzIG9yIG8uZXZhbCBvciBvLnN0ZGlvIGFuZCBvLmNvbXBpbGUpICMganMgb3V0cHV0IGlzIHBhc3NlZCB0byBldmFsIGFuZCBzdGRpbyBjb21waWxlXG4gICAgXG4gICAgby5mZWF0dXJlID0ge31cbiAgICBGRUFUVVJFUy5tYXAgKGYpIC0+IG8uZmVhdHVyZVtmLmtleV0gPSBvW2YuZmxhZ10gPyB0cnVlOyBkZWxldGUgb1tmLmZsYWddXG4gICAgXG4gICAgaWYgby5EZWJ1Z1xuICAgICAgICBkZWxldGUgby5hcmd2XG4gICAgICAgIGxvZyBzdHJpbmdpZnkgb1xuXG4jIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiMgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcblxucnVuID0gLT5cbiAgICBcbiAgICBwYXJzZU9wdGlvbnMoKVxuICAgIFxuICAgIGlmIG9wdHMuZmVhdHVyZS5jb2xvciA9PSBmYWxzZVxuICAgICAgICBjb2xvcmV0dGUub3B0aW9ucy5lbmFibGVkID0gZmFsc2VcbiAgICAgICAgXG4gICAgcmV0dXJuIGxvZ0ZlYXR1cmVzKCkgIGlmIG9wdHMuZmVhdHVyZXNcbiAgICByZXR1cm4gdXNhZ2UoKSAgICAgICAgaWYgb3B0cy5oZWxwXG4gICAgcmV0dXJuIHZlcnNpb24oKSAgICAgIGlmIG9wdHMudmVyc2lvblxuICAgIHJldHVybiBzdGFydFJlcGwoKSAgICBpZiBvcHRzLmludGVyYWN0aXZlXG4gICAgcmV0dXJuIGNvbXBpbGVTdGRpbygpIGlmIG9wdHMuc3RkaW9cbiAgICBpZiBvcHRzLmV2YWxcbiAgICAgICAgZm9yIGV2YWwgaW4gb3B0cy5ldmFsXG4gICAgICAgICAgICBjb21waWxlU2NyaXB0IGV2YWxcbiAgICAgICAgcmV0dXJuXG4gICAgcmV0dXJuIHN0YXJ0UmVwbCgpICAgIGlmIG5vdCBvcHRzLmFyZ3VtZW50cy5sZW5ndGhcbiAgICBcbiAgICBsaXRlcmFscyA9IGlmIG5vdCBvcHRzLndhdGNoIGFuZCBub3Qgb3B0cy5jb21waWxlIHRoZW4gb3B0cy5hcmd1bWVudHMuc3BsaWNlIDEgZWxzZSBbXVxuICAgIFxuICAgIHByb2Nlc3MuYXJndiA9IHByb2Nlc3MuYXJndlswLi4xXS5jb25jYXQgbGl0ZXJhbHNcbiAgICBwcm9jZXNzLmFyZ3ZbMF0gPSAna29mZmVlJ1xuXG4gICAgb3B0cy5vdXRwdXQgPSBwYXRoLnJlc29sdmUgb3B0cy5vdXRwdXQgaWYgb3B0cy5vdXRwdXRcbiAgICBmb3Igc291cmNlIGluIG9wdHMuYXJndW1lbnRzXG4gICAgICAgIHNvdXJjZSA9IHBhdGgucmVzb2x2ZSBzb3VyY2VcbiAgICAgICAgXG4gICAgICAgIGlmIG9wdHMud2F0Y2hcbiAgICAgICAgICAgIHdhdGNoUGF0aCBzb3VyY2VcbiAgICAgICAgZWxzZSAgICAgXG4gICAgICAgICAgICBjb21waWxlUGF0aCBzb3VyY2UsIHRvcExldmVsOnllc1xuXG5leHBvcnRzLnJ1biA9IHJ1blxuICAgICAgICBcbnN0YXJ0UmVwbCA9IC0+XG4gICAgXG4gICAgIyBNYWtlIHRoZSBSRVBMIHVzZSB0aGUgZ2xvYmFsIGNvbnRleHQgc28gYXMgdG8gXG4gICAgIyAgIChhKSBiZSBjb25zaXN0ZW50IHdpdGggdGhlIGBub2RlYCBSRVBMIGFuZCwgdGhlcmVmb3JlLCBcbiAgICAjICAgKGIpIG1ha2UgcGFja2FnZXMgdGhhdCBtb2RpZnkgbmF0aXZlIHByb3RvdHlwZXMgKHN1Y2ggYXMgJ2NvbG9ycycgYW5kICdzdWdhcicpIHdvcmsgYXMgZXhwZWN0ZWQuXG4gICAgXG4gICAgcmVwbENsaU9wdHMgPSB1c2VHbG9iYWw6IHllc1xuICAgIHJlcGxDbGlPcHRzLnByZWx1ZGUgPSBvcHRzLnByZWx1ZGVcbiAgICByZXF1aXJlKCcuL3JlcGwnKS5zdGFydCByZXBsQ2xpT3B0c1xuXG5tYWtlUHJlbHVkZSA9IChyZXF1aXJlcykgLT5cbiAgICBcbiAgICByZXF1aXJlcy5tYXAgKG1vZHVsZSkgLT5cbiAgICAgICAgW18sIG5hbWUsIG1vZHVsZV0gPSBtYXRjaCBpZiBtYXRjaCA9IG1vZHVsZS5tYXRjaCgvXiguKik9KC4qKSQvKVxuICAgICAgICBuYW1lIHx8PSBiYXNlRmlsZU5hbWUgbW9kdWxlLCB5ZXMsIHVzZVdpblBhdGhTZXBcbiAgICAgICAgXCIje25hbWV9ID0gcmVxdWlyZSgnI3ttb2R1bGV9JylcIlxuICAgIC5qb2luICc7J1xuXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuXG4jIENvbXBpbGUgYSBzY3JpcHQgb3IgYSBkaXJlY3RvcnkuIElmIGEgZGlyZWN0b3J5IGlzIHBhc3NlZCwgcmVjdXJzaXZlbHkgY29tcGlsZSBhbGwgJy5jb2ZmZWUnIGFuZCAnLmtvZmZlZScgZmlsZXMuXG5cbmNvbXBpbGVQYXRoID0gKHNvdXJjZSwgdG9wTGV2ZWw6dG9wTGV2ZWw9bm8pIC0+XG5cbiAgICByZXR1cm4gaWYgbm90IHRvcExldmVsIGFuZCBoaWRkZW4gc291cmNlXG4gICAgICAgICAgICAgIFxuICAgIHRyeVxuICAgICAgICBzdGF0cyA9IGZzLnN0YXRTeW5jIHNvdXJjZVxuICAgIGNhdGNoIGVyclxuICAgICAgICBpZiBlcnIuY29kZSBpcyAnRU5PRU5UJ1xuICAgICAgICAgICAgZXJyb3IgXCJDb21tYW5kLmNvbXBpbGVQYXRoIGNhbid0IHN0YXQgJyN7c291cmNlfSdcIlxuICAgICAgICAgICAgcHJvY2Vzcy5leGl0IDFcbiAgICAgICAgdGhyb3cgZXJyXG4gICAgICAgIFxuICAgIGlmIHN0YXRzLmlzRGlyZWN0b3J5KClcbiAgICAgICAgXG4gICAgICAgIGlmIHBhdGguYmFzZW5hbWUoc291cmNlKSBpbiBbJ25vZGVfbW9kdWxlcycgJy5naXQnXVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgb3B0cy5ydW5cbiAgICAgICAgICAgIGNvbXBpbGVQYXRoIGZpbmREaXJlY3RvcnlJbmRleChzb3VyY2UpLCB0b3BMZXZlbDp0b3BMZXZlbFxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgIFxuICAgICAgICBsb2cgJ0NvbW1hbmQuY29tcGlsZVBhdGggZGlyOicsIHNvdXJjZSBpZiBvcHRzLkRlYnVnXG4gICAgICAgIFxuICAgICAgICB0cnlcbiAgICAgICAgICAgIGZpbGVzID0gZnMucmVhZGRpclN5bmMgc291cmNlXG4gICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgaWYgZXJyLmNvZGUgaXMgJ0VOT0VOVCcgdGhlbiByZXR1cm4gXG4gICAgICAgICAgICB0aHJvdyBlcnJcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgZmlsZSBpbiBmaWxlc1xuICAgICAgICAgICAgY29tcGlsZVBhdGggcGF0aC5qb2luIHNvdXJjZSwgZmlsZVxuICAgICAgICAgICAgXG4gICAgZWxzZSBpZiB0b3BMZXZlbCBvciBpc0NvZmZlZSBzb3VyY2VcbiAgICAgICAgXG4gICAgICAgIHRyeVxuICAgICAgICAgICAgY29kZSA9IGZzLnJlYWRGaWxlU3luYyBzb3VyY2VcbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICBpZiBlcnIuY29kZSBpcyAnRU5PRU5UJyB0aGVuIHJldHVyblxuICAgICAgICAgICAgdGhyb3cgZXJyXG4gICAgICAgIFxuICAgICAgICBsb2cgJ0NvbW1hbmQuY29tcGlsZVBhdGggZmlsZTonLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuICAgICAgICAgICAgXG4gICAgICAgIGNvbXBpbGVTY3JpcHQgY29kZS50b1N0cmluZygpLCBzb3VyY2VcbiAgICAgICAgXG5maW5kRGlyZWN0b3J5SW5kZXggPSAoc291cmNlKSAtPlxuXG4gICAgZm9yIGV4dCBpbiBLb2ZmZWUuRklMRV9FWFRFTlNJT05TXG4gICAgICAgIGluZGV4ID0gcGF0aC5qb2luIHNvdXJjZSwgXCJpbmRleCN7ZXh0fVwiXG4gICAgICAgIHRyeVxuICAgICAgICAgICAgcmV0dXJuIGluZGV4IGlmIChmcy5zdGF0U3luYyBpbmRleCkuaXNGaWxlKClcbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICB0aHJvdyBlcnIgdW5sZXNzIGVyci5jb2RlIGlzICdFTk9FTlQnXG4gICAgZXJyb3IgXCJNaXNzaW5nIGluZGV4LmNvZmZlZSBpbiAje3NvdXJjZX1cIlxuICAgIHByb2Nlc3MuZXhpdCAxXG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAgICAgMDAwICAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAgMDAwICAgICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAgMDAwICAgICBcblxuIyBDb21waWxlIGEgc2luZ2xlIHNvdXJjZSBzY3JpcHQsIGNvbnRhaW5pbmcgdGhlIGdpdmVuIGNvZGUsIGFjY29yZGluZyB0byB0aGUgcmVxdWVzdGVkIG9wdGlvbnMuIFxuIyBJZiBldmFsdWF0aW5nIHRoZSBzY3JpcHQgZGlyZWN0bHkgc2V0cyBgX19maWxlbmFtZWAsIGBfX2Rpcm5hbWVgIGFuZCBgbW9kdWxlLmZpbGVuYW1lYCB0byBiZSBjb3JyZWN0IHJlbGF0aXZlIHRvIHRoZSBzY3JpcHQncyBwYXRoLlxuXG5jb21waWxlU2NyaXB0ID0gKGNvZGUsIHNvdXJjZT1udWxsKSAtPlxuICAgIFxuICAgIG8gPSBvcHRzXG4gICAgb3B0aW9ucyA9IGNvbXBpbGVPcHRpb25zIHNvdXJjZVxuICAgIFxuICAgIHRyeVxuICAgICAgICB0ID0gdGFzayA9IHtzb3VyY2UsIGNvZGUsIG9wdGlvbnN9XG4gICAgICAgIFxuICAgICAgICBpZiBvLnRva2Vuc1xuICAgICAgICAgICAgcHJpbnRUb2tlbnMgS29mZmVlLnRva2VucyB0LmNvZGUsIHQub3B0aW9uc1xuICAgICAgICBlbHNlIGlmIG8uY29mZmVlXG4gICAgICAgICAgICBwcmludFJld3JpdGVyIEtvZmZlZS50b2tlbnMgdC5jb2RlLCB0Lm9wdGlvbnNcbiAgICAgICAgZWxzZSBpZiBvLnBhcnNlXG4gICAgICAgICAgICBwcmludExpbmUgS29mZmVlLm5vZGVzKHQuY29kZSwgdC5vcHRpb25zKS50b1N0cmluZygpLnRyaW0oKVxuICAgICAgICBlbHNlIGlmIG8ucnVuXG4gICAgICAgICAgICBLb2ZmZWUucmVnaXN0ZXIoKVxuICAgICAgICAgICAgS29mZmVlLmV2YWwgb3B0cy5wcmVsdWRlLCB0Lm9wdGlvbnMgaWYgb3B0cy5wcmVsdWRlXG4gICAgICAgICAgICB0Lm9wdGlvbnMuZmlsZW5hbWUgPz0gb3B0aW9ucy5zb3VyY2VcbiAgICAgICAgICAgIGlmIG9wdHMubm9vcCBcbiAgICAgICAgICAgICAgICBsb2cgXCJub29wIHJ1biAje3NvdXJjZX1cIlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEtvZmZlZS5ydW4gdC5jb2RlLCB0Lm9wdGlvbnNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgY29tcGlsZWQgPSBLb2ZmZWUuY29tcGlsZSB0LmNvZGUsIHQub3B0aW9uc1xuICAgICAgICAgICAgdC5vdXRwdXQgPSBjb21waWxlZFxuICAgICAgICAgICAgaWYgby5tYXBcbiAgICAgICAgICAgICAgICB0Lm91dHB1dCA9IGNvbXBpbGVkLmpzXG4gICAgICAgICAgICAgICAgdC5zb3VyY2VNYXAgPSBjb21waWxlZC52M1NvdXJjZU1hcFxuXG4gICAgICAgICAgICBpZiBvLmpzXG4gICAgICAgICAgICAgICAgaWYgb3B0cy5ub29wIHRoZW4gbG9nIFwibm9vcCBqcyAje3NvdXJjZX1cIlxuICAgICAgICAgICAgICAgIGVsc2UgXG4gICAgICAgICAgICAgICAgICAgIHByaW50TGluZSB0Lm91dHB1dC50cmltKClcbiAgICAgICAgICAgIGVsc2UgaWYgby5jb21waWxlIG9yIG8ubWFwXG4gICAgICAgICAgICAgICAgaWYgb3B0cy5ub29wIHRoZW4gbG9nIFwibm9vcCB3cml0ZSAje29wdGlvbnMuanNQYXRofVwiXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB3cml0ZUpzIHQuc291cmNlLCB0Lm91dHB1dCwgb3B0aW9ucy5qc1BhdGgsIHQuc291cmNlTWFwXG4gICAgY2F0Y2ggZXJyXG4gICAgICAgIFxuICAgICAgICBtZXNzYWdlID0gZXJyLm1lc3NhZ2VcbiAgICAgICAgXG4gICAgICAgIGlmIGVyciBpbnN0YW5jZW9mIFN5bnRheEVycm9yXG4gICAgICAgICAgICBwcmludExpbmUgbWVzc2FnZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwcmludExpbmUgZXJyLnN0YWNrXG4gICAgICAgIFxuICAgICAgICBpZiBvLndhdGNoIG9yIG8uZXZhbFxuICAgICAgICAgICAgcHJpbnQgJ1xceDA3JyAjIGJlbGxcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcHJvY2Vzcy5leGl0IDFcblxuY29tcGlsZU9wdGlvbnMgPSAoc291cmNlKSAtPiAjIFRoZSBjb21waWxlLXRpbWUgb3B0aW9ucyB0byBwYXNzIHRvIHRoZSBjb21waWxlci5cbiAgICBcbiAgICBjb3B0cyA9IE9iamVjdC5hc3NpZ24ge30sIG9wdHNcbiAgICBjb3B0cy5zb3VyY2VNYXAgPSBvcHRzLm1hcFxuICAgIGNvcHRzLmlubGluZU1hcCA9IG9wdHNbJ2lubGluZS1tYXAnXVxuXG4gICAgaWYgc291cmNlXG4gICAgICAgIFxuICAgICAgICBjd2QgPSBwcm9jZXNzLmN3ZCgpXG4gICAgICAgIGpzUGF0aCA9IG91dHB1dFBhdGggc291cmNlLCAnLmpzJ1xuICAgICAgICBqc0RpciA9IHBhdGguZGlybmFtZSBqc1BhdGhcbiAgICAgICAgY29wdHMgPSBtZXJnZSBjb3B0cywge1xuICAgICAgICAgICAganNQYXRoXG4gICAgICAgICAgICBzb3VyY2U6IHNvdXJjZVxuICAgICAgICAgICAgc291cmNlUm9vdDogcGF0aC5yZWxhdGl2ZSBqc0RpciwgY3dkXG4gICAgICAgICAgICBzb3VyY2VGaWxlczogW3BhdGgucmVsYXRpdmUgY3dkLCBzb3VyY2VdXG4gICAgICAgICAgICBnZW5lcmF0ZWRGaWxlOiBiYXNlRmlsZU5hbWUoanNQYXRoLCBubywgdXNlV2luUGF0aFNlcClcbiAgICAgICAgfVxuICAgIGNvcHRzXG4gICAgICAgICAgICBcbiMgQXR0YWNoIHRoZSBhcHByb3ByaWF0ZSBsaXN0ZW5lcnMgdG8gY29tcGlsZSBzY3JpcHRzIGluY29taW5nIG92ZXIgKipzdGRpbioqLCBhbmQgd3JpdGUgdGhlbSBiYWNrIHRvICoqc3Rkb3V0KiouXG5cbmNvbXBpbGVTdGRpbyA9IC0+XG4gICAgXG4gICAgYnVmZmVycyA9IFtdXG4gICAgc3RkaW4gPSBwcm9jZXNzLm9wZW5TdGRpbigpXG4gICAgc3RkaW4ub24gJ2RhdGEnLCAoYnVmZmVyKSAtPiBidWZmZXJzLnB1c2ggYnVmZmVyIGlmIGJ1ZmZlclxuICAgIHN0ZGluLm9uICdlbmQnLCAtPiBjb21waWxlU2NyaXB0IEJ1ZmZlci5jb25jYXQoYnVmZmVycykudG9TdHJpbmcoKVxuXG4jIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwMDAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuIyAwMCAgICAgMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICBcblxud2F0Y2hQYXRoID0gKHNvdXJjZSkgLT4gIyBXYXRjaCBhIGZpbGUgb3IgZGlyZWN0b3J5LlxuICAgIFxuICAgIHRyeVxuICAgICAgICBzdGF0cyA9IGZzLnN0YXRTeW5jIHNvdXJjZVxuICAgIGNhdGNoIGVyclxuICAgICAgICByZXR1cm4gaWYgZXJyLmNvZGUgaXMgJ0VOT0VOVCdcbiAgICAgICAgcmV0dXJuIGVycm9yIFwiQ29tbWFuZC53YXRjaFBhdGggY2FuJ3Qgc3RhdCAnI3tzb3VyY2V9J1wiLCBlcnJcbiAgICAgICAgICAgICAgICBcbiAgICBpZiBzdGF0cy5pc0RpcmVjdG9yeSgpXG4gICAgICAgIHdhdGNoRGlyIHNvdXJjZVxuICAgIGVsc2VcbiAgICAgICAgd2F0Y2hGaWxlIHNvdXJjZVxuXG4jIFdhdGNoIGEgc2luZ2xlIGZpbGUgdXNpbmcgYGZzLndhdGNoYCwgcmVjb21waWxpbmcgaXQgZXZlcnkgdGltZSB0aGUgZmlsZSBpcyB1cGRhdGVkLlxuIyBNYXkgYmUgdXNlZCBpbiBjb21iaW5hdGlvbiB3aXRoIG90aGVyIG9wdGlvbnMsIHN1Y2ggYXMgYC0tcHJpbnRgLlxuICAgICAgICBcbndhdGNoRmlsZSA9IChzb3VyY2UpIC0+XG4gICAgXG4gICAgcmV0dXJuIGlmIG5vdCBpc0NvZmZlZSBzb3VyY2VcbiAgICBcbiAgICBsb2cgJ0NvbW1hbmQud2F0Y2hGaWxlJywgc291cmNlIGlmIG9wdHMuRGVidWdcbiAgICBcbiAgICB3YXRjaGVyICAgICAgICA9IG51bGxcbiAgICBwcmV2U3RhdHMgICAgICA9IG51bGxcbiAgICBjb21waWxlVGltZW91dCA9IG51bGxcblxuICAgIHN0YXJ0V2F0Y2hlciA9IC0+XG4gICAgICAgIFxuICAgICAgICB3YXRjaGVyID0gZnMud2F0Y2ggc291cmNlXG4gICAgICAgIC5vbiAnY2hhbmdlJywgKGNoYW5nZSkgLT5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIGlmIGNoYW5nZSAhPSAnY2hhbmdlJ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBsb2cgJ0NvbW1hbmQud2F0Y2hGaWxlJywgY2hhbmdlLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQgY29tcGlsZVRpbWVvdXRcbiAgICAgICAgICAgIGNvbXBpbGVUaW1lb3V0ID0gd2FpdCAyNSwgLT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmcy5zdGF0IHNvdXJjZSwgKGVyciwgc3RhdHMpIC0+XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB3YXRjaGVyLmNsb3NlKCkgaWYgZXJyPy5jb2RlIGlzICdFTk9FTlQnXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnJvciBlcnIgaWYgZXJyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpZiBwcmV2U3RhdHMgYW5kIHN0YXRzLm10aW1lLmdldFRpbWUoKSBpcyBwcmV2U3RhdHMubXRpbWUuZ2V0VGltZSgpIGFuZCBzdGF0cy5zaXplIGlzIHByZXZTdGF0cy5zaXplXG4gICAgICAgICAgICAgICAgICAgIHByZXZTdGF0cyA9IHN0YXRzXG4gICAgICAgICAgICAgICAgICAgIGZzLnJlYWRGaWxlIHNvdXJjZSwgKGVyciwgY29kZSkgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnJvciBlcnIgaWYgZXJyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2cgJ0NvbW1hbmQud2F0Y2hGaWxlIGNvbXBpbGUnLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tcGlsZVNjcmlwdCBjb2RlLnRvU3RyaW5nKCksIHNvdXJjZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIC5vbiAnZXJyb3InLCAoZXJyKSAtPlxuICAgICAgICAgICAgdGhyb3cgZXJyIHVubGVzcyBlcnIuY29kZSBpcyAnRVBFUk0nXG5cbiAgICB0cnlcbiAgICAgICAgc3RhcnRXYXRjaGVyKClcbiAgICBjYXRjaCBlcnJcbiAgICAgICAgZXJyb3IgZXJyXG5cbndhdGNoRGlyID0gKHNvdXJjZSkgLT5cbiAgICBcbiAgICBsb2cgJ0NvbW1hbmQud2F0Y2hEaXInLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuICAgIFxuICAgIHdhdGNoZXIgPSBudWxsXG5cbiAgICBzdGFydFdhdGNoZXIgPSAtPlxuXG4gICAgICAgIHRyeVxuICAgICAgICAgICAgZmlsZXMgPSBmcy5yZWFkZGlyU3luYyBzb3VyY2VcbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICByZXR1cm4gaWYgZXJyPy5jb2RlIGlzICdFTk9FTlQnXG4gICAgICAgICAgICB0aHJvdyBlcnJcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgZmlsZSBpbiBmaWxlc1xuICAgICAgICAgICAgY29udGludWUgaWYgZmlsZVswXSA9PSAnLidcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIGZpbGUgaW4gWydub2RlX21vZHVsZXMnXVxuICAgICAgICAgICAgd2F0Y2hQYXRoIHBhdGguam9pbiBzb3VyY2UsIGZpbGVcbiAgICAgICAgXG4gICAgICAgIHdhdGNoZXIgPSBmcy53YXRjaCBzb3VyY2VcbiAgICAgICAgLm9uICdlcnJvcicsIChlcnIpIC0+XG4gICAgICAgICAgICB0aHJvdyBlcnIgdW5sZXNzIGVyci5jb2RlIGlzICdFUEVSTSdcbiAgICAgICAgICAgIHdhdGNoZXIuY2xvc2UoKVxuICAgICAgICAub24gJ2NoYW5nZScsIChjaGFuZ2UsIHApIC0+XG4gICAgICAgICAgICBpZiBjaGFuZ2UgPT0gJ3JlbmFtZSdcbiAgICAgICAgICAgICAgICBsb2cgJ0NvbW1hbmQud2F0Y2hEaXInLCBjaGFuZ2UsIHBhdGguam9pbiBzb3VyY2UsIHAgaWYgb3B0cy5EZWJ1Z1xuICAgICAgICAgICAgICAgIHdhdGNoUGF0aCBwYXRoLmpvaW4gc291cmNlLCBwXG4gICAgICAgICAgICBcbiAgICB0cnlcbiAgICAgICAgc3RhcnRXYXRjaGVyKClcbiAgICBjYXRjaCBlcnJcbiAgICAgICAgcmV0dXJuIGlmIGVyci5jb2RlIGlzICdFTk9FTlQnXG4gICAgICAgIHRocm93IGVyclxuXG4jIEdldCB0aGUgY29ycmVzcG9uZGluZyBvdXRwdXQgSmF2YVNjcmlwdCBwYXRoIGZvciBhIHNvdXJjZSBmaWxlLlxuICAgIFxub3V0cHV0UGF0aCA9IChzb3VyY2UsIGV4dGVuc2lvbikgLT5cbiAgICBcbiAgICBiYXNlbmFtZSA9IGJhc2VGaWxlTmFtZSBzb3VyY2UsIHllcywgdXNlV2luUGF0aFNlcFxuICAgIGlmIG9wdHMub3V0cHV0XG4gICAgICAgIGRpciA9IG9wdHMub3V0cHV0XG4gICAgZWxzZVxuICAgICAgICBkaXIgPSBwYXRoLmRpcm5hbWUgc291cmNlXG4gICAgcGF0aC5qb2luIGRpciwgYmFzZW5hbWUgKyBleHRlbnNpb25cblxuIyBSZWN1cnNpdmVseSBta2RpciwgbGlrZSBgbWtkaXIgLXBgLlxuXG5ta2RpcnAgPSAoZGlyLCBmbikgLT5cbiAgICBtb2RlID0gMG83NzcgJiB+cHJvY2Vzcy51bWFzaygpXG5cbiAgICBkbyBta2RpcnMgPSAocCA9IGRpciwgZm4pIC0+XG4gICAgICAgIGZzLmV4aXN0cyBwLCAoZXhpc3RzKSAtPlxuICAgICAgICAgICAgaWYgZXhpc3RzXG4gICAgICAgICAgICAgICAgZm4oKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIG1rZGlycyBwYXRoLmRpcm5hbWUocCksIC0+XG4gICAgICAgICAgICAgICAgICAgIGZzLm1rZGlyIHAsIG1vZGUsIChlcnIpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm4gZXJyIGlmIGVyclxuICAgICAgICAgICAgICAgICAgICAgICAgZm4oKVxuXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgIDAwMCAgIDAwMDAwMDAgIFxuIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgICAgICAwMDAgIDAwMCAgICAgICBcbiMgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgICAgICAgMDAwICAwMDAwMDAwICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuIyAwMCAgICAgMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcblxuIyBXcml0ZSBvdXQgYSBKYXZhU2NyaXB0IHNvdXJjZSBmaWxlIHdpdGggdGhlIGNvbXBpbGVkIGNvZGUuIFxuIyBCeSBkZWZhdWx0LCBmaWxlcyBhcmUgd3JpdHRlbiBvdXQgaW4gYGN3ZGAgYXMgYC5qc2AgZmlsZXMgd2l0aCB0aGUgc2FtZSBuYW1lLCBidXQgdGhlIG91dHB1dCBkaXJlY3RvcnkgY2FuIGJlIGN1c3RvbWl6ZWQgd2l0aCBgLS1vdXRwdXRgLlxuIyBJZiBgZ2VuZXJhdGVkU291cmNlTWFwYCBpcyBwcm92aWRlZCwgdGhpcyB3aWxsIHdyaXRlIGEgYC5qcy5tYXBgIGZpbGUgaW50byB0aGUgc2FtZSBkaXJlY3RvcnkgYXMgdGhlIGAuanNgIGZpbGUuXG5cbndyaXRlSnMgPSAoc291cmNlLCBqcywganNQYXRoLCBnZW5lcmF0ZWRTb3VyY2VNYXAgPSBudWxsKSAtPlxuICAgIFxuICAgIHNvdXJjZU1hcFBhdGggPSBvdXRwdXRQYXRoIHNvdXJjZSwgJy5qcy5tYXAnXG4gICAganNEaXIgPSBwYXRoLmRpcm5hbWUganNQYXRoXG4gICAgY29tcGlsZSA9IC0+XG4gICAgICAgIGlmIG9wdHMuY29tcGlsZVxuICAgICAgICAgICAganMgPSAnICcgaWYganMubGVuZ3RoIDw9IDBcbiAgICAgICAgICAgIGlmIGdlbmVyYXRlZFNvdXJjZU1hcCB0aGVuIGpzID0gXCIje2pzfVxcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPSN7YmFzZUZpbGVOYW1lIHNvdXJjZU1hcFBhdGgsIG5vLCB1c2VXaW5QYXRoU2VwfVxcblwiXG4gICAgICAgICAgICBmcy53cml0ZUZpbGUganNQYXRoLCBqcywgKGVycikgLT5cbiAgICAgICAgICAgICAgICBpZiBlcnJcbiAgICAgICAgICAgICAgICAgICAgcHJpbnRMaW5lIGVyci5tZXNzYWdlXG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCAxXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBvcHRzLmNvbXBpbGUgYW5kIG9wdHMud2F0Y2hcbiAgICAgICAgICAgICAgICAgICAgdGltZUxvZyBcImNvbXBpbGVkICN7c291cmNlfVwiXG4gICAgICAgIGlmIGdlbmVyYXRlZFNvdXJjZU1hcFxuICAgICAgICAgICAgZnMud3JpdGVGaWxlIHNvdXJjZU1hcFBhdGgsIGdlbmVyYXRlZFNvdXJjZU1hcCwgKGVycikgLT5cbiAgICAgICAgICAgICAgICBpZiBlcnJcbiAgICAgICAgICAgICAgICAgICAgcHJpbnRMaW5lIFwiQ291bGQgbm90IHdyaXRlIHNvdXJjZSBtYXA6ICN7ZXJyLm1lc3NhZ2V9XCJcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0IDFcbiAgICBmcy5leGlzdHMganNEaXIsIChpdEV4aXN0cykgLT5cbiAgICAgICAgaWYgaXRFeGlzdHMgdGhlbiBjb21waWxlKCkgZWxzZSBta2RpcnAganNEaXIsIGNvbXBpbGVcblxud2FpdCA9IChtaWxsaXNlY29uZHMsIGZ1bmMpIC0+IHNldFRpbWVvdXQgZnVuYywgbWlsbGlzZWNvbmRzICMgQ29udmVuaWVuY2UgZm9yIGNsZWFuZXIgc2V0VGltZW91dHMuXG5cbnRpbWVMb2cgPSAobWVzc2FnZSkgLT4gbG9nIFwiI3sobmV3IERhdGUpLnRvTG9jYWxlVGltZVN0cmluZygpfSAtICN7bWVzc2FnZX1cIlxuXG4jIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgICAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAwMDAwICAgXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgICAgMDAwICBcbiMgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuXG5wcmludFRva2VucyA9ICh0b2tlbnMpIC0+XG5cbiAgICBmb3IgaW5kZXggaW4gWzAuLi50b2tlbnMubGVuZ3RoXVxuICAgICAgICB0b2tlbiAgPSB0b2tlbnNbaW5kZXhdXG4gICAgICAgIHRhZyAgICA9IHRva2VuWzBdXG4gICAgICAgIHZhbHVlICA9IHRva2VuWzFdLnRvU3RyaW5nKCkucmVwbGFjZSgvXFxuLywgJ1xcXFxuJylcbiAgICAgICAgY3RhZyAgID0gZ3JheSB0YWdcbiAgICAgICAgY3ZhbHVlID0gYm9sZCB5ZWxsb3cgdmFsdWVcbiAgICAgICAgaW5kZXggID0gZ3JheSBkaW0gaW5kZXhcbiAgICAgICAgaWYgdGFnID09ICdURVJNSU5BVE9SJ1xuICAgICAgICAgICAgcHJpbnQgJ1xcblxcbidcbiAgICAgICAgZWxzZSBpZiB0YWcgPT0gJ0lOREVOVCdcbiAgICAgICAgICAgIHByaW50IGdyYXkgZGltICdJTkQgJ1xuICAgICAgICBlbHNlIGlmIHRhZyA9PSAnT1VUREVOVCdcbiAgICAgICAgICAgIHByaW50IGdyYXkgZGltICdPVVQgJ1xuICAgICAgICBlbHNlIGlmIHRhZyBpbiBbJ0NMQVNTJyAnUEFSQU1fU1RBUlQnICdQQVJBTV9FTkQnICdOVUxMJ11cbiAgICAgICAgICAgIHByaW50IFwiI3tpbmRleH0je2N0YWd9IFwiXG4gICAgICAgIGVsc2UgaWYgdGFnID09IHZhbHVlXG4gICAgICAgICAgICBwcmludCBcIiN7aW5kZXh9I3tjdmFsdWV9IFwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHByaW50IFwiI3tpbmRleH0je2N0YWd9PSN7Y3ZhbHVlfSBcIlxuICAgICAgICBcbnByaW50UmV3cml0ZXIgPSAodG9rZW5zKSAtPlxuXG4gICAgaW5kZW50ID0gMFxuICAgIGZvciBpbmRleCBpbiBbMC4uLnRva2Vucy5sZW5ndGhdXG4gICAgICAgIHRva2VuID0gdG9rZW5zW2luZGV4XVxuICAgICAgICB0YWcgICA9IHRva2VuWzBdXG4gICAgICAgIHZhbHVlID0gdG9rZW5bMV1cbiAgICAgICAgXG4gICAgICAgIGdyYXlEaW0gPSAocykgLT4gZGltIGdyYXkgc1xuICAgICAgICBibHVlRGltID0gKHMpIC0+IGRpbSBibHVlIHNcbiAgICAgICAgeWVsbG93RGltID0gKHMpIC0+IGRpbSB5ZWxsb3cgc1xuICAgICAgICBzcGFjZWQgPSAoY29sb3IsIHYpLT5cbiAgICAgICAgICAgIHByaW50IGNvbG9yIFwiI3t2ID8gdmFsdWV9XCJcbiAgICAgICAgICAgIHByaW50ICcgJyBpZiB0b2tlbi5zcGFjZWQgYW5kIHRva2Vuc1tpbmRleCsxXVswXSBub3QgaW4gWydDQUxMX1NUQVJUJ11cblxuICAgICAgICAjIGxvZyB0b2tlblxuICAgICAgICBzd2l0Y2ggdGFnIFxuICAgICAgICAgICAgd2hlbiAnVEVSTUlOQVRPUicgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHByaW50IFwiXFxuI3twYWQgJycsIGluZGVudH1cIlxuICAgICAgICAgICAgd2hlbiAnSU5ERU5UJyAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIGluZGVudCArPSA0OyBwcmludCBcIlxcbiN7cGFkICcnLCBpbmRlbnR9XCJcbiAgICAgICAgICAgIHdoZW4gJ09VVERFTlQnICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBpbmRlbnQgLT0gNDsgcHJpbnQgXCJcXG4je3BhZCAnJywgaW5kZW50fVwiXG4gICAgICAgICAgICB3aGVuICdIRVJFQ09NTUVOVCcgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGdyYXlEaW1cbiAgICAgICAgICAgIHdoZW4gJ0NBTExfU1RBUlQnICdDQUxMX0VORCcgICAgICAgICAgICAgdGhlbiBzcGFjZWQgZ3JheURpbVxuICAgICAgICAgICAgd2hlbiAnVU5BUlknICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCBibHVlQnJpZ2h0LCAnbm90J1xuICAgICAgICAgICAgd2hlbiAnJiYnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCBibHVlQnJpZ2h0LCAnYW5kJ1xuICAgICAgICAgICAgd2hlbiAnfHwnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCBibHVlQnJpZ2h0LCAnb3InXG4gICAgICAgICAgICB3aGVuICdTVFJJTkcnICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGdyZWVuXG4gICAgICAgICAgICB3aGVuICdTVFJJTkdfU1RBUlQnICdTVFJJTkdfRU5EJyAgICAgICAgIHRoZW4gc3BhY2VkIHJlZEJyaWdodFxuICAgICAgICAgICAgd2hlbiAnUFJPUEVSVFknICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCB5ZWxsb3dcbiAgICAgICAgICAgIHdoZW4gJzonICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgeWVsbG93RGltXG4gICAgICAgICAgICB3aGVuICdAJyBcbiAgICAgICAgICAgICAgICBpZiB0b2tlbnNbaW5kZXgrMV1bMF0gbm90IGluIFsnTUVUQV9JRicgJ01FVEFfRUxTRScgJ1BPU1RfTUVUQV9JRiddIHRoZW4gc3BhY2VkKHllbGxvd0RpbSkgZWxzZSBzcGFjZWQgYmx1ZURpbVxuICAgICAgICAgICAgd2hlbiAnTUVUQV9JRicgJ01FVEFfRUxTRScgJ1BPU1RfTUVUQV9JRicgdGhlbiBzcGFjZWQgYmx1ZSwgJ+KWuCcrdmFsdWVcbiAgICAgICAgICAgIHdoZW4gJ05VTUJFUicgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgYmx1ZVxuICAgICAgICAgICAgd2hlbiAneycnfScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIGlmIG5vdCB0b2tlbi5nZW5lcmF0ZWQgdGhlbiBzcGFjZWQgZ3JheVxuICAgICAgICAgICAgd2hlbiAnPScgJysnICctJyAnKysnICctLScgJy4uLicgJzo6JyBcXFxuICAgICAgICAgICAgICAgICAnWycgJ10nICd7JyAnfScgJy4nICdNQVRIJyAnVU5BUllfTUFUSCcgXFxcbiAgICAgICAgICAgICAgICAgJ0lOREVYX1NUQVJUJyAnSU5ERVhfRU5EJyBcXFxuICAgICAgICAgICAgICAgICAnQ09NUEFSRScgJ0NPTVBPVU5EX0FTU0lHTicgICAgICAgICB0aGVuIHNwYWNlZCBncmF5XG4gICAgICAgICAgICB3aGVuICcsJyAnKCcgJyknICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGdyYXlEaW1cbiAgICAgICAgICAgIHdoZW4gJ1BBUkFNX1NUQVJUJyAnUEFSQU1fRU5EJyAnLT4nICc9PicgdGhlbiBzcGFjZWQgKHMpIC0+IGJvbGQgYmx1ZSBzXG4gICAgICAgICAgICB3aGVuICdOVUxMJyAnVU5ERUZJTkVEJyAnRlVOQ19FWElTVCcgJz8nICc/LicgJ0JJTj8nIHRoZW4gc3BhY2VkIHJlZFxuICAgICAgICAgICAgd2hlbiAnUkVHRVgnICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCBtYWdlbnRhXG4gICAgICAgICAgICB3aGVuICdGT1InICdGT1JJTicgJ1RSWScgJ0NBVENIJyAnVEhST1cnICdSRUxBVElPTicgJ0VYVEVORFMnICdTVEFURU1FTlQnICdPV04nICdGT1JPRicgJ0xPT1AnIFxcXG4gICAgICAgICAgICAgICAgICdJRicgJ1BPU1RfSUYnICdXSEVOJyAnVEhFTicgJ0VMU0UnICdUSElTJyAnU1VQRVInICdTV0lUQ0gnICdMRUFESU5HX1dIRU4nICdXSElMRScgXFxcbiAgICAgICAgICAgICAgICAgJ0JPT0wnICdDTEFTUycgJ1JFVFVSTicgICAgICAgICAgICAgdGhlbiBzcGFjZWQgYmx1ZUJyaWdodFxuICAgICAgICAgICAgd2hlbiAnSURFTlRJRklFUicgXG4gICAgICAgICAgICAgICAgc3dpdGNoIHZhbHVlXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gJ3JlcXVpcmUnIHRoZW4gc3BhY2VkIGdyYXlcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBzcGFjZWQgd2hpdGVCcmlnaHRcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBwcmludCBcIj4je3RhZ308XCJcbiAgICAgICAgICAgICAgICAjIHNwYWNlZCAocykgLT4gYm9sZCBibHVlQnJpZ2h0IHNcbiAgICAgICAgICAgICAgICBzcGFjZWQgY3lhblxuICAgICAgICAgICAgXG52ZXJzaW9uID0gLT4gcHJpbnRMaW5lIFwiI3tLb2ZmZWUuVkVSU0lPTn1cIlxudXNhZ2UgICA9IC0+IFxuXG4gICAgbGluZXMgPSBbXCIje2dyYXkgJ1VzYWdlOid9ICN7eWVsbG93ICdrb2ZmZWUnfSAje2dyYXkgJ1tvcHRpb25zXSd9IHBhdGgvdG8vc2NyaXB0ICN7Z3JheSAnW29wdGlvbnNdJ31cXG5cIl1cbiAgICBcbiAgICBydWxlcyA9IFNXSVRDSEVTLm1hcCAocnVsZSkgLT5cbiAgICAgICAgW3Nob3J0LCBsb25nLCBkZXNjcmlwdGlvbl0gPSBydWxlXG4gICAgICAgIGxvbmdGbGFnID0gbG9uZy5tYXRjaCgvXigtLVxcd1tcXHdcXC1dKikvKVsxXVxuICAgICAgICBjc2hvcnQgICA9IGlmIHNob3J0IHRoZW4gZ3JheShzaG9ydFswXSkgKyBib2xkKGdyYXkoc2hvcnRbMS4uXSkpICsgJyAgJyBlbHNlICcgICAgJ1xuICAgICAgICBjbG9uZyAgICA9IHBhZCBsb25nLCAyMFxuICAgICAgICBjbG9uZyAgICA9IGdyYXkoY2xvbmdbMC4uMV0pICsgYm9sZCh3aGl0ZShjbG9uZ1syLi5dLnNwbGl0KCcgJylbMF0pKSArICcgJyArIGJvbGQoYmx1ZUJyaWdodChjbG9uZ1syLi5dLnNwbGl0KCcgJylbMS4uXS5qb2luKCcgJykpKVxuICAgICAgICBsaW5lcy5wdXNoICcgICAgJyArIGNzaG9ydCArIGNsb25nICsgZ3JheSBkZXNjcmlwdGlvblxuICAgICAgICBcbiAgICBsaW5lcy5wdXNoIGdyYXkgJ1xcbklmIGNhbGxlZCB3aXRob3V0IGEgc2NyaXB0LCB0aGUgaW50ZXJhY3RpdmUgUkVQTCB3aWxsIGJlIHN0YXJ0ZWQnXG4gICAgICAgIFxuICAgIGxvZyBcIlxcbiN7IGxpbmVzLmpvaW4oJ1xcbicpIH1cXG5cIlxuICAgICAgICAiXX0=
//# sourceURL=../coffee/command.coffee