// koffee 0.30.0

/*
 0000000   0000000   00     00  00     00   0000000   000   000  0000000    
000       000   000  000   000  000   000  000   000  0000  000  000   000  
000       000   000  000000000  000000000  000000000  000 0 000  000   000  
000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  
 0000000   0000000   000   000  000   000  000   000  000   000  0000000
 */
var EventEmitter, FEATURES, Koffee, SWITCHES, baseFileName, compileOptions, compilePath, compileScript, compileStdio, error, exec, findDirectoryIndex, fs, helpers, hidden, isCoffee, logFeatures, makePrelude, merge, mkdirp, nopt, opts, outputPath, pad, parseOptions, path, print, printLine, printRewriter, printTokens, printWarn, ref, ref1, run, spawn, startRepl, stringify, timeLog, usage, useWinPathSep, version, wait, watchDir, watchFile, watchPath, writeJs;

fs = require('fs');

path = require('path');

nopt = require('nopt');

helpers = require('./helpers');

Koffee = require('./koffee');

ref = require('child_process'), spawn = ref.spawn, exec = ref.exec;

EventEmitter = require('events').EventEmitter;

useWinPathSep = path.sep === '\\';

helpers.extend(Koffee, new EventEmitter);

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

SWITCHES = [['-b', '--bare', 'compile without a top-level function wrapper', Boolean], ['-c', '--compile', 'compile to JavaScript and save as .js files', Boolean], ['-e', '--eval STRING', 'evaluate a string and print the result', [String, Array]], ['-f', '--features', 'list available features', Boolean], ['', '--no-`feature', 'disable a feature, e.g. --no-negative-index', null], ['-h', '--help', 'display this help message', Boolean], ['-j', '--js', 'print out the compiled JavaScript', Boolean], ['-m', '--map', 'generate source map and save as .js.map files', Boolean], ['-M', '--inline-map', 'generate source map and include it directly in output', Boolean], ['-n', '--noop', 'does nothing, for debugging purposes', Boolean], ['-o', '--output DIR', 'set the output directory for compiled JavaScript', String], ['-P', '--parse', 'print out the parse tree that the parser produces', Boolean], ['-r', '--require MODULE', 'require the given module before eval or REPL', [String, Array]], ['-C', '--coffee', 'print the token stream as CoffeeScript', Boolean], ['-s', '--stdio', 'listen for and compile scripts over stdio', Boolean], ['-t', '--test', 'compile and run the @test code', Boolean], ['-T', '--tokens', 'print out the tokens that the lexer/rewriter produce', Boolean], ['-v', '--version', 'display the version number', Boolean], ['-w', '--watch', 'watch scripts for changes and rerun commands', Boolean]];

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
        Koffee.emit('compile', task);
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
            Koffee.emit('success', task);
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
        Koffee.emit('failure', err, task);
        if (Koffee.listeners('failure').length) {
            return;
        }
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
    copts = {
        source: source,
        sourceMap: opts.map,
        inlineMap: opts['inline-map'],
        feature: opts.feature,
        bare: opts.bare,
        test: opts.test,
        doc: opts.doc,
        Debug: opts.Debug
    };
    if (source) {
        cwd = process.cwd();
        jsPath = outputPath(source, '.js');
        jsDir = path.dirname(jsPath);
        copts = merge(copts, {
            jsPath: jsPath,
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBaUJBLEVBQUEsR0FBbUIsT0FBQSxDQUFRLElBQVI7O0FBQ25CLElBQUEsR0FBbUIsT0FBQSxDQUFRLE1BQVI7O0FBQ25CLElBQUEsR0FBbUIsT0FBQSxDQUFRLE1BQVI7O0FBQ25CLE9BQUEsR0FBbUIsT0FBQSxDQUFRLFdBQVI7O0FBQ25CLE1BQUEsR0FBbUIsT0FBQSxDQUFRLFVBQVI7O0FBQ25CLE1BQW1CLE9BQUEsQ0FBUSxlQUFSLENBQW5CLEVBQUUsaUJBQUYsRUFBUzs7QUFDUCxlQUFpQixPQUFBLENBQVEsUUFBUjs7QUFFbkIsYUFBQSxHQUFtQixJQUFJLENBQUMsR0FBTCxLQUFZOztBQUUvQixPQUFPLENBQUMsTUFBUixDQUFlLE1BQWYsRUFBdUIsSUFBSSxZQUEzQjs7QUFDQSxPQUFPLENBQUMsTUFBUixDQUFBOztBQUVBLE9BQTRCLE9BQUEsQ0FBUSxZQUFSLENBQTVCLEVBQUUsd0JBQUYsRUFBWTs7QUFFVixtQ0FBRixFQUFnQiwyQkFBaEIsRUFBMEIsNkJBQTFCLEVBQXFDLHFCQUFyQyxFQUE0Qzs7QUFFNUMsS0FBQSxHQUFZLE9BQU8sQ0FBQzs7QUFDcEIsS0FBQSxHQUFZLFNBQUMsSUFBRDtXQUFVLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBZixDQUFxQixJQUFyQjtBQUFWOztBQUNaLFNBQUEsR0FBWSxTQUFDLElBQUQ7V0FBVSxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQWYsQ0FBcUIsSUFBQSxHQUFPLElBQTVCO0FBQVY7O0FBQ1osU0FBQSxHQUFZLFNBQUMsSUFBRDtXQUFVLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBZixDQUFxQixJQUFBLEdBQU8sSUFBNUI7QUFBVjs7QUFDWixNQUFBLEdBQVksU0FBQyxJQUFEO1dBQVUsUUFBUSxDQUFDLElBQVQsQ0FBYyxJQUFkO0FBQVY7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LENBQUssS0FBTSxDQUFBLENBQUEsQ0FBWCxDQUFBLEdBQWlCLElBQUEsQ0FBSyxJQUFBLENBQUssS0FBTSxTQUFYLENBQUwsQ0FBakIsR0FBMEMsSUFBeEQsR0FBa0U7UUFDN0UsS0FBQSxHQUFXLEdBQUEsQ0FBSSxJQUFKLEVBQVUsRUFBVjtRQUNYLEtBQUEsR0FBVyxJQUFBLENBQUssS0FBTSxZQUFYLENBQUEsR0FBb0IsSUFBQSxDQUFLLEtBQUEsQ0FBTSxLQUFNLFNBQUksQ0FBQyxLQUFYLENBQWlCLEdBQWpCLENBQXNCLENBQUEsQ0FBQSxDQUE1QixDQUFMLENBQXBCLEdBQTRELEdBQTVELEdBQWtFLElBQUEsQ0FBSyxVQUFBLENBQVcsS0FBTSxTQUFJLENBQUMsS0FBWCxDQUFpQixHQUFqQixDQUFzQixTQUFJLENBQUMsSUFBM0IsQ0FBZ0MsR0FBaEMsQ0FBWCxDQUFMO2VBQzdFLEtBQUssQ0FBQyxJQUFOLENBQVcsTUFBQSxHQUFTLE1BQVQsR0FBa0IsS0FBbEIsR0FBMEIsSUFBQSxDQUFLLFdBQUwsQ0FBckM7SUFOaUIsQ0FBYjtJQVFSLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBQSxDQUFLLG9FQUFMLENBQVg7V0FBb0YsT0FBQSxDQUVwRixHQUZvRixDQUVoRixJQUFBLEdBQUksQ0FBRSxLQUFLLENBQUMsSUFBTixDQUFXLElBQVgsQ0FBRixDQUFKLEdBQXdCLElBRndEO0FBWjlFIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4jIyNcblxuIyBoYW5kbGUgdmFyaW91cyB0YXNrczogXG4jXG4jICAgLSBjb21waWxlIGFuZCBzYXZlIGludG8gYC5qc2AgZmlsZXMgXG4jICAgLSBjb21waWxlIGFuZCBwcmludCB0byBzdGRvdXQgXG4jICAgLSByZWNvbXBpbGUgaWYgdGhlIHNvdXJjZSBjaGFuZ2VzXG4jICAgLSBwcmludCBsZXhlciB0b2tlbnNcbiMgICAtIHByaW50IGEgc3ludGF4IHRyZWVcbiMgICAtIGxhdW5jaCBhIFJFUExcblxuZnMgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ2ZzJ1xucGF0aCAgICAgICAgICAgICA9IHJlcXVpcmUgJ3BhdGgnXG5ub3B0ICAgICAgICAgICAgID0gcmVxdWlyZSAnbm9wdCdcbmhlbHBlcnMgICAgICAgICAgPSByZXF1aXJlICcuL2hlbHBlcnMnXG5Lb2ZmZWUgICAgICAgICAgID0gcmVxdWlyZSAnLi9rb2ZmZWUnXG57IHNwYXduLCBleGVjIH0gID0gcmVxdWlyZSAnY2hpbGRfcHJvY2VzcydcbnsgRXZlbnRFbWl0dGVyIH0gPSByZXF1aXJlICdldmVudHMnXG5cbnVzZVdpblBhdGhTZXAgICAgPSBwYXRoLnNlcCBpcyAnXFxcXCdcblxuaGVscGVycy5leHRlbmQgS29mZmVlLCBuZXcgRXZlbnRFbWl0dGVyICMgQWxsb3cgZW1pdHRpbmcgTm9kZSBldmVudHNcbmhlbHBlcnMuY29sb3JzKClcblxueyBGRUFUVVJFUywgbG9nRmVhdHVyZXMgfSA9IHJlcXVpcmUgJy4vZmVhdHVyZXMnXG5cbnsgYmFzZUZpbGVOYW1lLCBpc0NvZmZlZSwgc3RyaW5naWZ5LCBtZXJnZSwgcGFkIH0gPSBoZWxwZXJzXG5cbmVycm9yICAgICA9IGNvbnNvbGUuZXJyb3JcbnByaW50ICAgICA9IChsaW5lKSAtPiBwcm9jZXNzLnN0ZG91dC53cml0ZSBsaW5lXG5wcmludExpbmUgPSAobGluZSkgLT4gcHJvY2Vzcy5zdGRvdXQud3JpdGUgbGluZSArICdcXG4nICMgPz8/XG5wcmludFdhcm4gPSAobGluZSkgLT4gcHJvY2Vzcy5zdGRlcnIud3JpdGUgbGluZSArICdcXG4nICMgPz8/XG5oaWRkZW4gICAgPSAoZmlsZSkgLT4gL15cXC58fiQvLnRlc3QgZmlsZVxuXG5TV0lUQ0hFUyA9IFtcbiAgICBbJy1iJyAnLS1iYXJlJyAgICAgICAgICAgICAgJ2NvbXBpbGUgd2l0aG91dCBhIHRvcC1sZXZlbCBmdW5jdGlvbiB3cmFwcGVyJyAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctYycgJy0tY29tcGlsZScgICAgICAgICAgICdjb21waWxlIHRvIEphdmFTY3JpcHQgYW5kIHNhdmUgYXMgLmpzIGZpbGVzJyAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLWUnICctLWV2YWwgU1RSSU5HJyAgICAgICAnZXZhbHVhdGUgYSBzdHJpbmcgYW5kIHByaW50IHRoZSByZXN1bHQnICAgICAgICAgICAgICAgW1N0cmluZywgQXJyYXldIF1cbiAgICBbJy1mJyAnLS1mZWF0dXJlcycgICAgICAgICAgJ2xpc3QgYXZhaWxhYmxlIGZlYXR1cmVzJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWycnICAgJy0tbm8tYGZlYXR1cmUnICAgICAgICdkaXNhYmxlIGEgZmVhdHVyZSwgZS5nLiAtLW5vLW5lZ2F0aXZlLWluZGV4JyAgICAgICAgICAgbnVsbCAgICAgICAgICAgXVxuICAgIFsnLWgnICctLWhlbHAnICAgICAgICAgICAgICAnZGlzcGxheSB0aGlzIGhlbHAgbWVzc2FnZScgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1qJyAnLS1qcycgICAgICAgICAgICAgICAgJ3ByaW50IG91dCB0aGUgY29tcGlsZWQgSmF2YVNjcmlwdCcgICAgICAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctbScgJy0tbWFwJyAgICAgICAgICAgICAgICdnZW5lcmF0ZSBzb3VyY2UgbWFwIGFuZCBzYXZlIGFzIC5qcy5tYXAgZmlsZXMnICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLU0nICctLWlubGluZS1tYXAnICAgICAgICAnZ2VuZXJhdGUgc291cmNlIG1hcCBhbmQgaW5jbHVkZSBpdCBkaXJlY3RseSBpbiBvdXRwdXQnIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1uJyAnLS1ub29wJyAgICAgICAgICAgICAgJ2RvZXMgbm90aGluZywgZm9yIGRlYnVnZ2luZyBwdXJwb3NlcycgICAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctbycgJy0tb3V0cHV0IERJUicgICAgICAgICdzZXQgdGhlIG91dHB1dCBkaXJlY3RvcnkgZm9yIGNvbXBpbGVkIEphdmFTY3JpcHQnICAgICAgU3RyaW5nICAgICAgICAgXVxuICAgIFsnLVAnICctLXBhcnNlJyAgICAgICAgICAgICAncHJpbnQgb3V0IHRoZSBwYXJzZSB0cmVlIHRoYXQgdGhlIHBhcnNlciBwcm9kdWNlcycgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1yJyAnLS1yZXF1aXJlIE1PRFVMRScgICAgJ3JlcXVpcmUgdGhlIGdpdmVuIG1vZHVsZSBiZWZvcmUgZXZhbCBvciBSRVBMJyAgICAgICAgIFtTdHJpbmcsIEFycmF5XSBdXG4gICAgWyctQycgJy0tY29mZmVlJyAgICAgICAgICAgICdwcmludCB0aGUgdG9rZW4gc3RyZWFtIGFzIENvZmZlZVNjcmlwdCcgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLXMnICctLXN0ZGlvJyAgICAgICAgICAgICAnbGlzdGVuIGZvciBhbmQgY29tcGlsZSBzY3JpcHRzIG92ZXIgc3RkaW8nICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy10JyAnLS10ZXN0JyAgICAgICAgICAgICAgJ2NvbXBpbGUgYW5kIHJ1biB0aGUgQHRlc3QgY29kZScgICAgICAgICAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctVCcgJy0tdG9rZW5zJyAgICAgICAgICAgICdwcmludCBvdXQgdGhlIHRva2VucyB0aGF0IHRoZSBsZXhlci9yZXdyaXRlciBwcm9kdWNlJyAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLXYnICctLXZlcnNpb24nICAgICAgICAgICAnZGlzcGxheSB0aGUgdmVyc2lvbiBudW1iZXInICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy13JyAnLS13YXRjaCcgICAgICAgICAgICAgJ3dhdGNoIHNjcmlwdHMgZm9yIGNoYW5nZXMgYW5kIHJlcnVuIGNvbW1hbmRzJyAgICAgICAgICBCb29sZWFuICAgICAgICBdXG5dXG5cbm9wdHMgPSB7fVxuXG4jICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICBcbiMgIDAwMDAwMDAgICAwMDAgICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuXG5wYXJzZU9wdGlvbnMgPSAtPlxuXG4gICAga25vd24gPSBEZWJ1ZzpCb29sZWFuXG4gICAgc2hvcnQgPSBEOictLURlYnVnJyBwOictLWpzJ1xuICAgIFNXSVRDSEVTLm1hcCAocykgLT4gbCA9IHNbMV0uc3BsaXQoJyAnKVswXVsyLi5dOyBrbm93bltsXSA9IHNbM10gaWYgc1szXTsgc2hvcnRbc1swXVsxXV0gPSBcIi0tI3tsfVwiIGlmIHNbMF0hPScnXG4gICAgRkVBVFVSRVMubWFwIChmKSAtPiBrbm93bltmLmxhZ10gPSBCb29sZWFuXG4gICAgXG4gICAgbyA9IG9wdHMgPSBub3B0IGtub3duLCBzaG9ydFxuICAgICAgICBcbiAgICBvLmNvbXBpbGUgIG9yPSAhIW8ub3V0cHV0XG4gICAgby5hcmd1bWVudHMgID0gby5hcmd2LnJlbWFpblxuICAgIG8ucHJlbHVkZSAgICA9IG1ha2VQcmVsdWRlIG8ucmVxdWlyZSBpZiBvLnJlcXVpcmVcbiAgICBvLnJ1biAgICAgICAgPSBub3QgKG8uY29tcGlsZSBvciBvLmpzIG9yIG8ubWFwIG9yIG8udG9rZW5zIG9yIG8ucGFyc2UpXG4gICAgby5qcyAgICAgICAgID0gISEoby5qcyBvciBvLmV2YWwgb3Igby5zdGRpbyBhbmQgby5jb21waWxlKSAjIGpzIG91dHB1dCBpcyBwYXNzZWQgdG8gZXZhbCBhbmQgc3RkaW8gY29tcGlsZVxuICAgIFxuICAgIG8uZmVhdHVyZSA9IHt9XG4gICAgRkVBVFVSRVMubWFwIChmKSAtPiBvLmZlYXR1cmVbZi5rZXldID0gb1tmLmZsYWddID8gdHJ1ZTsgZGVsZXRlIG9bZi5mbGFnXVxuICAgIFxuICAgIGlmIG8uRGVidWdcbiAgICAgICAgZGVsZXRlIG8uYXJndlxuICAgICAgICBsb2cgc3RyaW5naWZ5IG9cblxuIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4jIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG5cbnJ1biA9IC0+XG4gICAgXG4gICAgcGFyc2VPcHRpb25zKClcbiAgICBcbiAgICBpZiBvcHRzLmZlYXR1cmUuY29sb3IgPT0gZmFsc2VcbiAgICAgICAgY29sb3JldHRlLm9wdGlvbnMuZW5hYmxlZCA9IGZhbHNlXG4gICAgICAgIFxuICAgIHJldHVybiBsb2dGZWF0dXJlcygpICBpZiBvcHRzLmZlYXR1cmVzXG4gICAgcmV0dXJuIHVzYWdlKCkgICAgICAgIGlmIG9wdHMuaGVscFxuICAgIHJldHVybiB2ZXJzaW9uKCkgICAgICBpZiBvcHRzLnZlcnNpb25cbiAgICByZXR1cm4gc3RhcnRSZXBsKCkgICAgaWYgb3B0cy5pbnRlcmFjdGl2ZVxuICAgIHJldHVybiBjb21waWxlU3RkaW8oKSBpZiBvcHRzLnN0ZGlvXG4gICAgaWYgb3B0cy5ldmFsXG4gICAgICAgIGZvciBldmFsIGluIG9wdHMuZXZhbFxuICAgICAgICAgICAgY29tcGlsZVNjcmlwdCBldmFsXG4gICAgICAgIHJldHVyblxuICAgIHJldHVybiBzdGFydFJlcGwoKSAgICBpZiBub3Qgb3B0cy5hcmd1bWVudHMubGVuZ3RoXG4gICAgXG4gICAgbGl0ZXJhbHMgPSBpZiBub3Qgb3B0cy53YXRjaCBhbmQgbm90IG9wdHMuY29tcGlsZSB0aGVuIG9wdHMuYXJndW1lbnRzLnNwbGljZSAxIGVsc2UgW11cbiAgICBcbiAgICBwcm9jZXNzLmFyZ3YgPSBwcm9jZXNzLmFyZ3ZbMC4uMV0uY29uY2F0IGxpdGVyYWxzXG4gICAgcHJvY2Vzcy5hcmd2WzBdID0gJ2tvZmZlZSdcblxuICAgIG9wdHMub3V0cHV0ID0gcGF0aC5yZXNvbHZlIG9wdHMub3V0cHV0IGlmIG9wdHMub3V0cHV0XG4gICAgZm9yIHNvdXJjZSBpbiBvcHRzLmFyZ3VtZW50c1xuICAgICAgICBzb3VyY2UgPSBwYXRoLnJlc29sdmUgc291cmNlXG4gICAgICAgIFxuICAgICAgICBpZiBvcHRzLndhdGNoXG4gICAgICAgICAgICB3YXRjaFBhdGggc291cmNlXG4gICAgICAgIGVsc2UgICAgIFxuICAgICAgICAgICAgY29tcGlsZVBhdGggc291cmNlLCB0b3BMZXZlbDp5ZXNcblxuZXhwb3J0cy5ydW4gPSBydW5cbiAgICAgICAgXG5zdGFydFJlcGwgPSAtPlxuICAgIFxuICAgICMgTWFrZSB0aGUgUkVQTCB1c2UgdGhlIGdsb2JhbCBjb250ZXh0IHNvIGFzIHRvIFxuICAgICMgICAoYSkgYmUgY29uc2lzdGVudCB3aXRoIHRoZSBgbm9kZWAgUkVQTCBhbmQsIHRoZXJlZm9yZSwgXG4gICAgIyAgIChiKSBtYWtlIHBhY2thZ2VzIHRoYXQgbW9kaWZ5IG5hdGl2ZSBwcm90b3R5cGVzIChzdWNoIGFzICdjb2xvcnMnIGFuZCAnc3VnYXInKSB3b3JrIGFzIGV4cGVjdGVkLlxuICAgIFxuICAgIHJlcGxDbGlPcHRzID0gdXNlR2xvYmFsOiB5ZXNcbiAgICByZXBsQ2xpT3B0cy5wcmVsdWRlID0gb3B0cy5wcmVsdWRlXG4gICAgcmVxdWlyZSgnLi9yZXBsJykuc3RhcnQgcmVwbENsaU9wdHNcblxubWFrZVByZWx1ZGUgPSAocmVxdWlyZXMpIC0+XG4gICAgXG4gICAgcmVxdWlyZXMubWFwIChtb2R1bGUpIC0+XG4gICAgICAgIFtfLCBuYW1lLCBtb2R1bGVdID0gbWF0Y2ggaWYgbWF0Y2ggPSBtb2R1bGUubWF0Y2goL14oLiopPSguKikkLylcbiAgICAgICAgbmFtZSB8fD0gYmFzZUZpbGVOYW1lIG1vZHVsZSwgeWVzLCB1c2VXaW5QYXRoU2VwXG4gICAgICAgIFwiI3tuYW1lfSA9IHJlcXVpcmUoJyN7bW9kdWxlfScpXCJcbiAgICAuam9pbiAnOydcblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcblxuIyBDb21waWxlIGEgc2NyaXB0IG9yIGEgZGlyZWN0b3J5LiBJZiBhIGRpcmVjdG9yeSBpcyBwYXNzZWQsIHJlY3Vyc2l2ZWx5IGNvbXBpbGUgYWxsICcuY29mZmVlJyBhbmQgJy5rb2ZmZWUnIGZpbGVzLlxuXG5jb21waWxlUGF0aCA9IChzb3VyY2UsIHRvcExldmVsOnRvcExldmVsPW5vKSAtPlxuXG4gICAgcmV0dXJuIGlmIG5vdCB0b3BMZXZlbCBhbmQgaGlkZGVuIHNvdXJjZVxuICAgICAgICAgICAgICBcbiAgICB0cnlcbiAgICAgICAgc3RhdHMgPSBmcy5zdGF0U3luYyBzb3VyY2VcbiAgICBjYXRjaCBlcnJcbiAgICAgICAgaWYgZXJyLmNvZGUgaXMgJ0VOT0VOVCdcbiAgICAgICAgICAgIGVycm9yIFwiQ29tbWFuZC5jb21waWxlUGF0aCBjYW4ndCBzdGF0ICcje3NvdXJjZX0nXCJcbiAgICAgICAgICAgIHByb2Nlc3MuZXhpdCAxXG4gICAgICAgIHRocm93IGVyclxuICAgICAgICBcbiAgICBpZiBzdGF0cy5pc0RpcmVjdG9yeSgpXG4gICAgICAgIFxuICAgICAgICBpZiBwYXRoLmJhc2VuYW1lKHNvdXJjZSkgaW4gWydub2RlX21vZHVsZXMnICcuZ2l0J11cbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgXG4gICAgICAgIGlmIG9wdHMucnVuXG4gICAgICAgICAgICBjb21waWxlUGF0aCBmaW5kRGlyZWN0b3J5SW5kZXgoc291cmNlKSwgdG9wTGV2ZWw6dG9wTGV2ZWxcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICBcbiAgICAgICAgbG9nICdDb21tYW5kLmNvbXBpbGVQYXRoIGRpcjonLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuICAgICAgICBcbiAgICAgICAgdHJ5XG4gICAgICAgICAgICBmaWxlcyA9IGZzLnJlYWRkaXJTeW5jIHNvdXJjZVxuICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgIGlmIGVyci5jb2RlIGlzICdFTk9FTlQnIHRoZW4gcmV0dXJuIFxuICAgICAgICAgICAgdGhyb3cgZXJyXG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIGZpbGUgaW4gZmlsZXNcbiAgICAgICAgICAgIGNvbXBpbGVQYXRoIHBhdGguam9pbiBzb3VyY2UsIGZpbGVcbiAgICAgICAgICAgIFxuICAgIGVsc2UgaWYgdG9wTGV2ZWwgb3IgaXNDb2ZmZWUgc291cmNlXG4gICAgICAgIFxuICAgICAgICB0cnlcbiAgICAgICAgICAgIGNvZGUgPSBmcy5yZWFkRmlsZVN5bmMgc291cmNlXG4gICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgaWYgZXJyLmNvZGUgaXMgJ0VOT0VOVCcgdGhlbiByZXR1cm5cbiAgICAgICAgICAgIHRocm93IGVyclxuICAgICAgICBcbiAgICAgICAgbG9nICdDb21tYW5kLmNvbXBpbGVQYXRoIGZpbGU6Jywgc291cmNlIGlmIG9wdHMuRGVidWdcbiAgICAgICAgICAgIFxuICAgICAgICBjb21waWxlU2NyaXB0IGNvZGUudG9TdHJpbmcoKSwgc291cmNlXG4gICAgICAgIFxuZmluZERpcmVjdG9yeUluZGV4ID0gKHNvdXJjZSkgLT5cblxuICAgIGZvciBleHQgaW4gS29mZmVlLkZJTEVfRVhURU5TSU9OU1xuICAgICAgICBpbmRleCA9IHBhdGguam9pbiBzb3VyY2UsIFwiaW5kZXgje2V4dH1cIlxuICAgICAgICB0cnlcbiAgICAgICAgICAgIHJldHVybiBpbmRleCBpZiAoZnMuc3RhdFN5bmMgaW5kZXgpLmlzRmlsZSgpXG4gICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgdGhyb3cgZXJyIHVubGVzcyBlcnIuY29kZSBpcyAnRU5PRU5UJ1xuICAgIGVycm9yIFwiTWlzc2luZyBpbmRleC5jb2ZmZWUgaW4gI3tzb3VyY2V9XCJcbiAgICBwcm9jZXNzLmV4aXQgMVxuXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgICAgIDAwMCAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgICAgXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgICAgXG5cbiMgQ29tcGlsZSBhIHNpbmdsZSBzb3VyY2Ugc2NyaXB0LCBjb250YWluaW5nIHRoZSBnaXZlbiBjb2RlLCBhY2NvcmRpbmcgdG8gdGhlIHJlcXVlc3RlZCBvcHRpb25zLiBcbiMgSWYgZXZhbHVhdGluZyB0aGUgc2NyaXB0IGRpcmVjdGx5IHNldHMgYF9fZmlsZW5hbWVgLCBgX19kaXJuYW1lYCBhbmQgYG1vZHVsZS5maWxlbmFtZWAgdG8gYmUgY29ycmVjdCByZWxhdGl2ZSB0byB0aGUgc2NyaXB0J3MgcGF0aC5cblxuY29tcGlsZVNjcmlwdCA9IChjb2RlLCBzb3VyY2U9bnVsbCkgLT5cbiAgICBcbiAgICBvID0gb3B0c1xuICAgIG9wdGlvbnMgPSBjb21waWxlT3B0aW9ucyBzb3VyY2VcbiAgICBcbiAgICB0cnlcbiAgICAgICAgdCA9IHRhc2sgPSB7c291cmNlLCBjb2RlLCBvcHRpb25zfVxuICAgICAgICBLb2ZmZWUuZW1pdCAnY29tcGlsZScsIHRhc2tcbiAgICAgICAgXG4gICAgICAgIGlmIG8udG9rZW5zXG4gICAgICAgICAgICBwcmludFRva2VucyBLb2ZmZWUudG9rZW5zIHQuY29kZSwgdC5vcHRpb25zXG4gICAgICAgIGVsc2UgaWYgby5jb2ZmZWVcbiAgICAgICAgICAgIHByaW50UmV3cml0ZXIgS29mZmVlLnRva2VucyB0LmNvZGUsIHQub3B0aW9uc1xuICAgICAgICBlbHNlIGlmIG8ucGFyc2VcbiAgICAgICAgICAgIHByaW50TGluZSBLb2ZmZWUubm9kZXModC5jb2RlLCB0Lm9wdGlvbnMpLnRvU3RyaW5nKCkudHJpbSgpXG4gICAgICAgIGVsc2UgaWYgby5ydW5cbiAgICAgICAgICAgIEtvZmZlZS5yZWdpc3RlcigpXG4gICAgICAgICAgICBLb2ZmZWUuZXZhbCBvcHRzLnByZWx1ZGUsIHQub3B0aW9ucyBpZiBvcHRzLnByZWx1ZGVcbiAgICAgICAgICAgIHQub3B0aW9ucy5maWxlbmFtZSA/PSBvcHRpb25zLnNvdXJjZVxuICAgICAgICAgICAgaWYgb3B0cy5ub29wIHRoZW4gbG9nIFwibm9vcCBydW4gI3tzb3VyY2V9XCJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBLb2ZmZWUucnVuIHQuY29kZSwgdC5vcHRpb25zXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGNvbXBpbGVkID0gS29mZmVlLmNvbXBpbGUgdC5jb2RlLCB0Lm9wdGlvbnNcbiAgICAgICAgICAgIHQub3V0cHV0ID0gY29tcGlsZWRcbiAgICAgICAgICAgIGlmIG8ubWFwXG4gICAgICAgICAgICAgICAgdC5vdXRwdXQgPSBjb21waWxlZC5qc1xuICAgICAgICAgICAgICAgIHQuc291cmNlTWFwID0gY29tcGlsZWQudjNTb3VyY2VNYXBcblxuICAgICAgICAgICAgS29mZmVlLmVtaXQgJ3N1Y2Nlc3MnLCB0YXNrXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIG8uanNcbiAgICAgICAgICAgICAgICBpZiBvcHRzLm5vb3AgdGhlbiBsb2cgXCJub29wIGpzICN7c291cmNlfVwiXG4gICAgICAgICAgICAgICAgZWxzZSBcbiAgICAgICAgICAgICAgICAgICAgcHJpbnRMaW5lIHQub3V0cHV0LnRyaW0oKVxuICAgICAgICAgICAgZWxzZSBpZiBvLmNvbXBpbGUgb3Igby5tYXBcbiAgICAgICAgICAgICAgICBpZiBvcHRzLm5vb3AgdGhlbiBsb2cgXCJub29wIHdyaXRlICN7b3B0aW9ucy5qc1BhdGh9XCJcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlSnMgdC5zb3VyY2UsIHQub3V0cHV0LCBvcHRpb25zLmpzUGF0aCwgdC5zb3VyY2VNYXBcbiAgICBjYXRjaCBlcnJcbiAgICAgICAgXG4gICAgICAgIEtvZmZlZS5lbWl0ICdmYWlsdXJlJywgZXJyLCB0YXNrXG4gICAgICAgIHJldHVybiBpZiBLb2ZmZWUubGlzdGVuZXJzKCdmYWlsdXJlJykubGVuZ3RoXG5cbiAgICAgICAgbWVzc2FnZSA9IGVyci5tZXNzYWdlXG4gICAgICAgIFxuICAgICAgICBpZiBlcnIgaW5zdGFuY2VvZiBTeW50YXhFcnJvclxuICAgICAgICAgICAgcHJpbnRMaW5lIG1lc3NhZ2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcHJpbnRMaW5lIGVyci5zdGFja1xuICAgICAgICBcbiAgICAgICAgaWYgby53YXRjaCBvciBvLmV2YWxcbiAgICAgICAgICAgIHByaW50ICdcXHgwNycgIyBiZWxsXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHByb2Nlc3MuZXhpdCAxXG5cbmNvbXBpbGVPcHRpb25zID0gKHNvdXJjZSkgLT4gIyBUaGUgY29tcGlsZS10aW1lIG9wdGlvbnMgdG8gcGFzcyB0byB0aGUgY29tcGlsZXIuXG4gICAgXG4gICAgY29wdHMgPSAgICAgICAgIFxuICAgICAgICBzb3VyY2U6ICAgIHNvdXJjZVxuICAgICAgICBzb3VyY2VNYXA6IG9wdHMubWFwXG4gICAgICAgIGlubGluZU1hcDogb3B0c1snaW5saW5lLW1hcCddXG4gICAgICAgIGZlYXR1cmU6ICAgb3B0cy5mZWF0dXJlXG4gICAgICAgIGJhcmU6ICAgICAgb3B0cy5iYXJlXG4gICAgICAgIHRlc3Q6ICAgICAgb3B0cy50ZXN0XG4gICAgICAgIGRvYzogICAgICAgb3B0cy5kb2NcbiAgICAgICAgRGVidWc6ICAgICBvcHRzLkRlYnVnXG5cbiAgICBpZiBzb3VyY2VcbiAgICAgICAgXG4gICAgICAgIGN3ZCA9IHByb2Nlc3MuY3dkKClcbiAgICAgICAganNQYXRoID0gb3V0cHV0UGF0aCBzb3VyY2UsICcuanMnXG4gICAgICAgIGpzRGlyID0gcGF0aC5kaXJuYW1lIGpzUGF0aFxuICAgICAgICBjb3B0cyA9IG1lcmdlIGNvcHRzLCB7XG4gICAgICAgICAgICBqc1BhdGhcbiAgICAgICAgICAgIHNvdXJjZVJvb3Q6IHBhdGgucmVsYXRpdmUganNEaXIsIGN3ZFxuICAgICAgICAgICAgc291cmNlRmlsZXM6IFtwYXRoLnJlbGF0aXZlIGN3ZCwgc291cmNlXVxuICAgICAgICAgICAgZ2VuZXJhdGVkRmlsZTogYmFzZUZpbGVOYW1lKGpzUGF0aCwgbm8sIHVzZVdpblBhdGhTZXApXG4gICAgICAgIH1cbiAgICBjb3B0c1xuICAgICAgICAgICAgXG4jIEF0dGFjaCB0aGUgYXBwcm9wcmlhdGUgbGlzdGVuZXJzIHRvIGNvbXBpbGUgc2NyaXB0cyBpbmNvbWluZyBvdmVyICoqc3RkaW4qKiwgYW5kIHdyaXRlIHRoZW0gYmFjayB0byAqKnN0ZG91dCoqLlxuXG5jb21waWxlU3RkaW8gPSAtPlxuICAgIFxuICAgIGJ1ZmZlcnMgPSBbXVxuICAgIHN0ZGluID0gcHJvY2Vzcy5vcGVuU3RkaW4oKVxuICAgIHN0ZGluLm9uICdkYXRhJywgKGJ1ZmZlcikgLT4gYnVmZmVycy5wdXNoIGJ1ZmZlciBpZiBidWZmZXJcbiAgICBzdGRpbi5vbiAnZW5kJywgLT4gY29tcGlsZVNjcmlwdCBCdWZmZXIuY29uY2F0KGJ1ZmZlcnMpLnRvU3RyaW5nKClcblxuIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbiMgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAwMDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAgICAgIDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG5cbndhdGNoUGF0aCA9IChzb3VyY2UpIC0+ICMgV2F0Y2ggYSBmaWxlIG9yIGRpcmVjdG9yeS5cbiAgICBcbiAgICB0cnlcbiAgICAgICAgc3RhdHMgPSBmcy5zdGF0U3luYyBzb3VyY2VcbiAgICBjYXRjaCBlcnJcbiAgICAgICAgcmV0dXJuIGlmIGVyci5jb2RlIGlzICdFTk9FTlQnXG4gICAgICAgIHJldHVybiBlcnJvciBcIkNvbW1hbmQud2F0Y2hQYXRoIGNhbid0IHN0YXQgJyN7c291cmNlfSdcIiwgZXJyXG4gICAgICAgICAgICAgICAgXG4gICAgaWYgc3RhdHMuaXNEaXJlY3RvcnkoKVxuICAgICAgICB3YXRjaERpciBzb3VyY2VcbiAgICBlbHNlXG4gICAgICAgIHdhdGNoRmlsZSBzb3VyY2VcblxuIyBXYXRjaCBhIHNpbmdsZSBmaWxlIHVzaW5nIGBmcy53YXRjaGAsIHJlY29tcGlsaW5nIGl0IGV2ZXJ5IHRpbWUgdGhlIGZpbGUgaXMgdXBkYXRlZC5cbiMgTWF5IGJlIHVzZWQgaW4gY29tYmluYXRpb24gd2l0aCBvdGhlciBvcHRpb25zLCBzdWNoIGFzIGAtLXByaW50YC5cbiAgICAgICAgXG53YXRjaEZpbGUgPSAoc291cmNlKSAtPlxuICAgIFxuICAgIHJldHVybiBpZiBub3QgaXNDb2ZmZWUgc291cmNlXG4gICAgXG4gICAgbG9nICdDb21tYW5kLndhdGNoRmlsZScsIHNvdXJjZSBpZiBvcHRzLkRlYnVnXG4gICAgXG4gICAgd2F0Y2hlciAgICAgICAgPSBudWxsXG4gICAgcHJldlN0YXRzICAgICAgPSBudWxsXG4gICAgY29tcGlsZVRpbWVvdXQgPSBudWxsXG5cbiAgICBzdGFydFdhdGNoZXIgPSAtPlxuICAgICAgICBcbiAgICAgICAgd2F0Y2hlciA9IGZzLndhdGNoIHNvdXJjZVxuICAgICAgICAub24gJ2NoYW5nZScsIChjaGFuZ2UpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBpZiBjaGFuZ2UgIT0gJ2NoYW5nZSdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbG9nICdDb21tYW5kLndhdGNoRmlsZScsIGNoYW5nZSwgc291cmNlIGlmIG9wdHMuRGVidWdcblxuICAgICAgICAgICAgY2xlYXJUaW1lb3V0IGNvbXBpbGVUaW1lb3V0XG4gICAgICAgICAgICBjb21waWxlVGltZW91dCA9IHdhaXQgMjUsIC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZnMuc3RhdCBzb3VyY2UsIChlcnIsIHN0YXRzKSAtPlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gd2F0Y2hlci5jbG9zZSgpIGlmIGVycj8uY29kZSBpcyAnRU5PRU5UJ1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXJyb3IgZXJyIGlmIGVyclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaWYgcHJldlN0YXRzIGFuZCBzdGF0cy5tdGltZS5nZXRUaW1lKCkgaXMgcHJldlN0YXRzLm10aW1lLmdldFRpbWUoKSBhbmQgc3RhdHMuc2l6ZSBpcyBwcmV2U3RhdHMuc2l6ZVxuICAgICAgICAgICAgICAgICAgICBwcmV2U3RhdHMgPSBzdGF0c1xuICAgICAgICAgICAgICAgICAgICBmcy5yZWFkRmlsZSBzb3VyY2UsIChlcnIsIGNvZGUpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXJyb3IgZXJyIGlmIGVyclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9nICdDb21tYW5kLndhdGNoRmlsZSBjb21waWxlJywgc291cmNlIGlmIG9wdHMuRGVidWdcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBpbGVTY3JpcHQgY29kZS50b1N0cmluZygpLCBzb3VyY2VcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAub24gJ2Vycm9yJywgKGVycikgLT5cbiAgICAgICAgICAgIHRocm93IGVyciB1bmxlc3MgZXJyLmNvZGUgaXMgJ0VQRVJNJ1xuXG4gICAgdHJ5XG4gICAgICAgIHN0YXJ0V2F0Y2hlcigpXG4gICAgY2F0Y2ggZXJyXG4gICAgICAgIGVycm9yIGVyclxuXG53YXRjaERpciA9IChzb3VyY2UpIC0+XG4gICAgXG4gICAgbG9nICdDb21tYW5kLndhdGNoRGlyJywgc291cmNlIGlmIG9wdHMuRGVidWdcbiAgICBcbiAgICB3YXRjaGVyID0gbnVsbFxuXG4gICAgc3RhcnRXYXRjaGVyID0gLT5cblxuICAgICAgICB0cnlcbiAgICAgICAgICAgIGZpbGVzID0gZnMucmVhZGRpclN5bmMgc291cmNlXG4gICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgcmV0dXJuIGlmIGVycj8uY29kZSBpcyAnRU5PRU5UJ1xuICAgICAgICAgICAgdGhyb3cgZXJyXG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIGZpbGUgaW4gZmlsZXNcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIGZpbGVbMF0gPT0gJy4nXG4gICAgICAgICAgICBjb250aW51ZSBpZiBmaWxlIGluIFsnbm9kZV9tb2R1bGVzJ11cbiAgICAgICAgICAgIHdhdGNoUGF0aCBwYXRoLmpvaW4gc291cmNlLCBmaWxlXG4gICAgICAgIFxuICAgICAgICB3YXRjaGVyID0gZnMud2F0Y2ggc291cmNlXG4gICAgICAgIC5vbiAnZXJyb3InLCAoZXJyKSAtPlxuICAgICAgICAgICAgdGhyb3cgZXJyIHVubGVzcyBlcnIuY29kZSBpcyAnRVBFUk0nXG4gICAgICAgICAgICB3YXRjaGVyLmNsb3NlKClcbiAgICAgICAgLm9uICdjaGFuZ2UnLCAoY2hhbmdlLCBwKSAtPlxuICAgICAgICAgICAgaWYgY2hhbmdlID09ICdyZW5hbWUnXG4gICAgICAgICAgICAgICAgbG9nICdDb21tYW5kLndhdGNoRGlyJywgY2hhbmdlLCBwYXRoLmpvaW4gc291cmNlLCBwIGlmIG9wdHMuRGVidWdcbiAgICAgICAgICAgICAgICB3YXRjaFBhdGggcGF0aC5qb2luIHNvdXJjZSwgcFxuICAgICAgICAgICAgXG4gICAgdHJ5XG4gICAgICAgIHN0YXJ0V2F0Y2hlcigpXG4gICAgY2F0Y2ggZXJyXG4gICAgICAgIHJldHVybiBpZiBlcnIuY29kZSBpcyAnRU5PRU5UJ1xuICAgICAgICB0aHJvdyBlcnJcblxuIyBHZXQgdGhlIGNvcnJlc3BvbmRpbmcgb3V0cHV0IEphdmFTY3JpcHQgcGF0aCBmb3IgYSBzb3VyY2UgZmlsZS5cbiAgICBcbm91dHB1dFBhdGggPSAoc291cmNlLCBleHRlbnNpb24pIC0+XG4gICAgXG4gICAgYmFzZW5hbWUgPSBiYXNlRmlsZU5hbWUgc291cmNlLCB5ZXMsIHVzZVdpblBhdGhTZXBcbiAgICBpZiBvcHRzLm91dHB1dFxuICAgICAgICBkaXIgPSBvcHRzLm91dHB1dFxuICAgIGVsc2VcbiAgICAgICAgZGlyID0gcGF0aC5kaXJuYW1lIHNvdXJjZVxuICAgIHBhdGguam9pbiBkaXIsIGJhc2VuYW1lICsgZXh0ZW5zaW9uXG5cbiMgUmVjdXJzaXZlbHkgbWtkaXIsIGxpa2UgYG1rZGlyIC1wYC5cblxubWtkaXJwID0gKGRpciwgZm4pIC0+XG4gICAgbW9kZSA9IDBvNzc3ICYgfnByb2Nlc3MudW1hc2soKVxuXG4gICAgZG8gbWtkaXJzID0gKHAgPSBkaXIsIGZuKSAtPlxuICAgICAgICBmcy5leGlzdHMgcCwgKGV4aXN0cykgLT5cbiAgICAgICAgICAgIGlmIGV4aXN0c1xuICAgICAgICAgICAgICAgIGZuKClcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBta2RpcnMgcGF0aC5kaXJuYW1lKHApLCAtPlxuICAgICAgICAgICAgICAgICAgICBmcy5ta2RpciBwLCBtb2RlLCAoZXJyKSAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZuIGVyciBpZiBlcnJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZuKClcblxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgICAgICAwMDAgICAwMDAwMDAwICBcbiMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgICAgICAgMDAwICAwMDAgICAgICAgXG4jIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgICAgIDAwMCAgMDAwMDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICBcbiMgMDAgICAgIDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG5cbiMgV3JpdGUgb3V0IGEgSmF2YVNjcmlwdCBzb3VyY2UgZmlsZSB3aXRoIHRoZSBjb21waWxlZCBjb2RlLiBcbiMgQnkgZGVmYXVsdCwgZmlsZXMgYXJlIHdyaXR0ZW4gb3V0IGluIGBjd2RgIGFzIGAuanNgIGZpbGVzIHdpdGggdGhlIHNhbWUgbmFtZSwgYnV0IHRoZSBvdXRwdXQgZGlyZWN0b3J5IGNhbiBiZSBjdXN0b21pemVkIHdpdGggYC0tb3V0cHV0YC5cbiMgSWYgYGdlbmVyYXRlZFNvdXJjZU1hcGAgaXMgcHJvdmlkZWQsIHRoaXMgd2lsbCB3cml0ZSBhIGAuanMubWFwYCBmaWxlIGludG8gdGhlIHNhbWUgZGlyZWN0b3J5IGFzIHRoZSBgLmpzYCBmaWxlLlxuXG53cml0ZUpzID0gKHNvdXJjZSwganMsIGpzUGF0aCwgZ2VuZXJhdGVkU291cmNlTWFwID0gbnVsbCkgLT5cbiAgICBcbiAgICBzb3VyY2VNYXBQYXRoID0gb3V0cHV0UGF0aCBzb3VyY2UsICcuanMubWFwJ1xuICAgIGpzRGlyID0gcGF0aC5kaXJuYW1lIGpzUGF0aFxuICAgIGNvbXBpbGUgPSAtPlxuICAgICAgICBpZiBvcHRzLmNvbXBpbGVcbiAgICAgICAgICAgIGpzID0gJyAnIGlmIGpzLmxlbmd0aCA8PSAwXG4gICAgICAgICAgICBpZiBnZW5lcmF0ZWRTb3VyY2VNYXAgdGhlbiBqcyA9IFwiI3tqc31cXG4vLyMgc291cmNlTWFwcGluZ1VSTD0je2Jhc2VGaWxlTmFtZSBzb3VyY2VNYXBQYXRoLCBubywgdXNlV2luUGF0aFNlcH1cXG5cIlxuICAgICAgICAgICAgZnMud3JpdGVGaWxlIGpzUGF0aCwganMsIChlcnIpIC0+XG4gICAgICAgICAgICAgICAgaWYgZXJyXG4gICAgICAgICAgICAgICAgICAgIHByaW50TGluZSBlcnIubWVzc2FnZVxuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQgMVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgb3B0cy5jb21waWxlIGFuZCBvcHRzLndhdGNoXG4gICAgICAgICAgICAgICAgICAgIHRpbWVMb2cgXCJjb21waWxlZCAje3NvdXJjZX1cIlxuICAgICAgICBpZiBnZW5lcmF0ZWRTb3VyY2VNYXBcbiAgICAgICAgICAgIGZzLndyaXRlRmlsZSBzb3VyY2VNYXBQYXRoLCBnZW5lcmF0ZWRTb3VyY2VNYXAsIChlcnIpIC0+XG4gICAgICAgICAgICAgICAgaWYgZXJyXG4gICAgICAgICAgICAgICAgICAgIHByaW50TGluZSBcIkNvdWxkIG5vdCB3cml0ZSBzb3VyY2UgbWFwOiAje2Vyci5tZXNzYWdlfVwiXG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCAxXG4gICAgZnMuZXhpc3RzIGpzRGlyLCAoaXRFeGlzdHMpIC0+XG4gICAgICAgIGlmIGl0RXhpc3RzIHRoZW4gY29tcGlsZSgpIGVsc2UgbWtkaXJwIGpzRGlyLCBjb21waWxlXG5cbndhaXQgPSAobWlsbGlzZWNvbmRzLCBmdW5jKSAtPiBzZXRUaW1lb3V0IGZ1bmMsIG1pbGxpc2Vjb25kcyAjIENvbnZlbmllbmNlIGZvciBjbGVhbmVyIHNldFRpbWVvdXRzLlxuXG50aW1lTG9nID0gKG1lc3NhZ2UpIC0+IGxvZyBcIiN7KG5ldyBEYXRlKS50b0xvY2FsZVRpbWVTdHJpbmcoKX0gLSAje21lc3NhZ2V9XCJcblxuIyAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgICAgICBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAwICAgICAgIDAwMCAgXG4jICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcblxucHJpbnRUb2tlbnMgPSAodG9rZW5zKSAtPlxuXG4gICAgZm9yIGluZGV4IGluIFswLi4udG9rZW5zLmxlbmd0aF1cbiAgICAgICAgdG9rZW4gID0gdG9rZW5zW2luZGV4XVxuICAgICAgICB0YWcgICAgPSB0b2tlblswXVxuICAgICAgICB2YWx1ZSAgPSB0b2tlblsxXS50b1N0cmluZygpLnJlcGxhY2UoL1xcbi8sICdcXFxcbicpXG4gICAgICAgIGN0YWcgICA9IGdyYXkgdGFnXG4gICAgICAgIGN2YWx1ZSA9IGJvbGQgeWVsbG93IHZhbHVlXG4gICAgICAgIGluZGV4ICA9IGdyYXkgZGltIGluZGV4XG4gICAgICAgIGlmIHRhZyA9PSAnVEVSTUlOQVRPUidcbiAgICAgICAgICAgIHByaW50ICdcXG5cXG4nXG4gICAgICAgIGVsc2UgaWYgdGFnID09ICdJTkRFTlQnXG4gICAgICAgICAgICBwcmludCBncmF5IGRpbSAnSU5EICdcbiAgICAgICAgZWxzZSBpZiB0YWcgPT0gJ09VVERFTlQnXG4gICAgICAgICAgICBwcmludCBncmF5IGRpbSAnT1VUICdcbiAgICAgICAgZWxzZSBpZiB0YWcgaW4gWydDTEFTUycgJ1BBUkFNX1NUQVJUJyAnUEFSQU1fRU5EJyAnTlVMTCddXG4gICAgICAgICAgICBwcmludCBcIiN7aW5kZXh9I3tjdGFnfSBcIlxuICAgICAgICBlbHNlIGlmIHRhZyBpcyB2YWx1ZVxuICAgICAgICAgICAgcHJpbnQgXCIje2luZGV4fSN7Y3ZhbHVlfSBcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwcmludCBcIiN7aW5kZXh9I3tjdGFnfT0je2N2YWx1ZX0gXCJcbiAgICAgICAgXG5wcmludFJld3JpdGVyID0gKHRva2VucykgLT5cblxuICAgIGluZGVudCA9IDBcbiAgICBmb3IgaW5kZXggaW4gWzAuLi50b2tlbnMubGVuZ3RoXVxuICAgICAgICB0b2tlbiA9IHRva2Vuc1tpbmRleF1cbiAgICAgICAgdGFnICAgPSB0b2tlblswXVxuICAgICAgICB2YWx1ZSA9IHRva2VuWzFdXG4gICAgICAgIFxuICAgICAgICBncmF5RGltID0gKHMpIC0+IGRpbSBncmF5IHNcbiAgICAgICAgYmx1ZURpbSA9IChzKSAtPiBkaW0gYmx1ZSBzXG4gICAgICAgIHllbGxvd0RpbSA9IChzKSAtPiBkaW0geWVsbG93IHNcbiAgICAgICAgc3BhY2VkID0gKGNvbG9yLCB2KS0+XG4gICAgICAgICAgICBwcmludCBjb2xvciBcIiN7diA/IHZhbHVlfVwiXG4gICAgICAgICAgICBwcmludCAnICcgaWYgdG9rZW4uc3BhY2VkIGFuZCB0b2tlbnNbaW5kZXgrMV1bMF0gbm90IGluIFsnQ0FMTF9TVEFSVCddXG5cbiAgICAgICAgIyBsb2cgdG9rZW5cbiAgICAgICAgc3dpdGNoIHRhZyBcbiAgICAgICAgICAgIHdoZW4gJ1RFUk1JTkFUT1InICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBwcmludCBcIlxcbiN7cGFkICcnLCBpbmRlbnR9XCJcbiAgICAgICAgICAgIHdoZW4gJ0lOREVOVCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBpbmRlbnQgKz0gNDsgcHJpbnQgXCJcXG4je3BhZCAnJywgaW5kZW50fVwiXG4gICAgICAgICAgICB3aGVuICdPVVRERU5UJyAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gaW5kZW50IC09IDQ7IHByaW50IFwiXFxuI3twYWQgJycsIGluZGVudH1cIlxuICAgICAgICAgICAgd2hlbiAnSEVSRUNPTU1FTlQnICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCBncmF5RGltXG4gICAgICAgICAgICB3aGVuICdDQUxMX1NUQVJUJyAnQ0FMTF9FTkQnICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGdyYXlEaW1cbiAgICAgICAgICAgIHdoZW4gJ1VOQVJZJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgYmx1ZUJyaWdodCwgJ25vdCdcbiAgICAgICAgICAgIHdoZW4gJyYmJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgYmx1ZUJyaWdodCwgJ2FuZCdcbiAgICAgICAgICAgIHdoZW4gJ3x8JyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgYmx1ZUJyaWdodCwgJ29yJ1xuICAgICAgICAgICAgd2hlbiAnU1RSSU5HJyAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCBncmVlblxuICAgICAgICAgICAgd2hlbiAnU1RSSU5HX1NUQVJUJyAnU1RSSU5HX0VORCcgICAgICAgICB0aGVuIHNwYWNlZCByZWRCcmlnaHRcbiAgICAgICAgICAgIHdoZW4gJ1BST1BFUlRZJyAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgeWVsbG93XG4gICAgICAgICAgICB3aGVuICc6JyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIHllbGxvd0RpbVxuICAgICAgICAgICAgd2hlbiAnQCcgXG4gICAgICAgICAgICAgICAgaWYgdG9rZW5zW2luZGV4KzFdWzBdIG5vdCBpbiBbJ01FVEFfSUYnICdNRVRBX0VMU0UnICdQT1NUX01FVEFfSUYnXSB0aGVuIHNwYWNlZCh5ZWxsb3dEaW0pIGVsc2Ugc3BhY2VkIGJsdWVEaW1cbiAgICAgICAgICAgIHdoZW4gJ01FVEFfSUYnICdNRVRBX0VMU0UnICdQT1NUX01FVEFfSUYnIHRoZW4gc3BhY2VkIGJsdWUsICfilrgnK3ZhbHVlXG4gICAgICAgICAgICB3aGVuICdOVU1CRVInICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGJsdWVcbiAgICAgICAgICAgIHdoZW4gJ3snJ30nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBpZiBub3QgdG9rZW4uZ2VuZXJhdGVkIHRoZW4gc3BhY2VkIGdyYXlcbiAgICAgICAgICAgIHdoZW4gJz0nICcrJyAnLScgJysrJyAnLS0nICcuLi4nICc6OicgXFxcbiAgICAgICAgICAgICAgICAgJ1snICddJyAneycgJ30nICcuJyAnTUFUSCcgJ1VOQVJZX01BVEgnIFxcXG4gICAgICAgICAgICAgICAgICdJTkRFWF9TVEFSVCcgJ0lOREVYX0VORCcgXFxcbiAgICAgICAgICAgICAgICAgJ0NPTVBBUkUnICdDT01QT1VORF9BU1NJR04nICAgICAgICAgdGhlbiBzcGFjZWQgZ3JheVxuICAgICAgICAgICAgd2hlbiAnLCcgJygnICcpJyAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCBncmF5RGltXG4gICAgICAgICAgICB3aGVuICdQQVJBTV9TVEFSVCcgJ1BBUkFNX0VORCcgJy0+JyAnPT4nIHRoZW4gc3BhY2VkIChzKSAtPiBib2xkIGJsdWUgc1xuICAgICAgICAgICAgd2hlbiAnTlVMTCcgJ1VOREVGSU5FRCcgJ0ZVTkNfRVhJU1QnICc/JyAnPy4nICdCSU4/JyB0aGVuIHNwYWNlZCByZWRcbiAgICAgICAgICAgIHdoZW4gJ1JFR0VYJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgbWFnZW50YVxuICAgICAgICAgICAgd2hlbiAnRk9SJyAnRk9SSU4nICdUUlknICdDQVRDSCcgJ1RIUk9XJyAnUkVMQVRJT04nICdFWFRFTkRTJyAnU1RBVEVNRU5UJyAnT1dOJyAnRk9ST0YnICdMT09QJyBcXFxuICAgICAgICAgICAgICAgICAnSUYnICdQT1NUX0lGJyAnV0hFTicgJ1RIRU4nICdFTFNFJyAnVEhJUycgJ1NVUEVSJyAnU1dJVENIJyAnTEVBRElOR19XSEVOJyBcXFxuICAgICAgICAgICAgICAgICAnQk9PTCcgJ0NMQVNTJyAnUkVUVVJOJyAgICAgICAgICAgICB0aGVuIHNwYWNlZCBibHVlQnJpZ2h0XG4gICAgICAgICAgICB3aGVuICdJREVOVElGSUVSJyBcbiAgICAgICAgICAgICAgICBzd2l0Y2ggdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAncmVxdWlyZScgdGhlbiBzcGFjZWQgZ3JheVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHNwYWNlZCB3aGl0ZUJyaWdodFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHByaW50IFwiPiN7dGFnfTxcIlxuICAgICAgICAgICAgICAgICMgc3BhY2VkIChzKSAtPiBib2xkIGJsdWVCcmlnaHQgc1xuICAgICAgICAgICAgICAgIHNwYWNlZCBjeWFuXG4gICAgICAgICAgICBcbnZlcnNpb24gPSAtPiBwcmludExpbmUgXCIje0tvZmZlZS5WRVJTSU9OfVwiXG51c2FnZSAgID0gLT4gXG5cbiAgICBsaW5lcyA9IFtcIiN7Z3JheSAnVXNhZ2U6J30gI3t5ZWxsb3cgJ2tvZmZlZSd9ICN7Z3JheSAnW29wdGlvbnNdJ30gcGF0aC90by9zY3JpcHQgI3tncmF5ICdbb3B0aW9uc10nfVxcblwiXVxuICAgIFxuICAgIHJ1bGVzID0gU1dJVENIRVMubWFwIChydWxlKSAtPlxuICAgICAgICBbc2hvcnQsIGxvbmcsIGRlc2NyaXB0aW9uXSA9IHJ1bGVcbiAgICAgICAgbG9uZ0ZsYWcgPSBsb25nLm1hdGNoKC9eKC0tXFx3W1xcd1xcLV0qKS8pWzFdXG4gICAgICAgIGNzaG9ydCAgID0gaWYgc2hvcnQgdGhlbiBncmF5KHNob3J0WzBdKSArIGJvbGQoZ3JheShzaG9ydFsxLi5dKSkgKyAnICAnIGVsc2UgJyAgICAnXG4gICAgICAgIGNsb25nICAgID0gcGFkIGxvbmcsIDIwXG4gICAgICAgIGNsb25nICAgID0gZ3JheShjbG9uZ1swLi4xXSkgKyBib2xkKHdoaXRlKGNsb25nWzIuLl0uc3BsaXQoJyAnKVswXSkpICsgJyAnICsgYm9sZChibHVlQnJpZ2h0KGNsb25nWzIuLl0uc3BsaXQoJyAnKVsxLi5dLmpvaW4oJyAnKSkpXG4gICAgICAgIGxpbmVzLnB1c2ggJyAgICAnICsgY3Nob3J0ICsgY2xvbmcgKyBncmF5IGRlc2NyaXB0aW9uXG4gICAgICAgIFxuICAgIGxpbmVzLnB1c2ggZ3JheSAnXFxuSWYgY2FsbGVkIHdpdGhvdXQgYSBzY3JpcHQsIHRoZSBpbnRlcmFjdGl2ZSBSRVBMIHdpbGwgYmUgc3RhcnRlZCdcbiAgICAgICAgXG4gICAgbG9nIFwiXFxuI3sgbGluZXMuam9pbignXFxuJykgfVxcblwiXG4gICAgICAgICJdfQ==
//# sourceURL=../coffee/command.coffee