// koffee 0.27.0

/*
 0000000   0000000   00     00  00     00   0000000   000   000  0000000    
000       000   000  000   000  000   000  000   000  0000  000  000   000  
000       000   000  000000000  000000000  000000000  000 0 000  000   000  
000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  
 0000000   0000000   000   000  000   000  000   000  000   000  0000000
 */
var EventEmitter, FEATURES, Koffee, SWITCHES, baseFileName, blue, blueBright, bold, compileOptions, compilePath, compileScript, compileStdio, cyan, cyanBright, dim, error, exec, findDirectoryIndex, fs, gray, grayBright, green, greenBright, helpers, hidden, isCoffee, logFeatures, magenta, magentaBright, makePrelude, merge, mkdirp, nopt, opts, outputPath, pad, parseOptions, path, print, printLine, printRewriter, printTokens, printWarn, red, redBright, ref, ref1, ref2, run, spawn, startRepl, stringify, timeLog, usage, useWinPathSep, version, wait, watchDir, watchFile, watchPath, white, whiteBright, writeJs, yellow, yellowBright;

fs = require('fs');

path = require('path');

nopt = require('nopt');

helpers = require('./helpers');

Koffee = require('./koffee');

ref = require('child_process'), spawn = ref.spawn, exec = ref.exec;

EventEmitter = require('events').EventEmitter;

useWinPathSep = path.sep === '\\';

helpers.extend(Koffee, new EventEmitter);

ref1 = require('./features'), FEATURES = ref1.FEATURES, logFeatures = ref1.logFeatures;

baseFileName = helpers.baseFileName, isCoffee = helpers.isCoffee, stringify = helpers.stringify, merge = helpers.merge, pad = helpers.pad;

ref2 = require('colorette'), dim = ref2.dim, bold = ref2.bold, red = ref2.red, redBright = ref2.redBright, gray = ref2.gray, grayBright = ref2.grayBright, yellow = ref2.yellow, yellowBright = ref2.yellowBright, green = ref2.green, greenBright = ref2.greenBright, white = ref2.white, whiteBright = ref2.whiteBright, blue = ref2.blue, blueBright = ref2.blueBright, cyan = ref2.cyan, cyanBright = ref2.cyanBright, magenta = ref2.magenta, magentaBright = ref2.magentaBright;

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

SWITCHES = [['-b', '--bare', 'compile without a top-level function wrapper', Boolean], ['-c', '--compile', 'compile to JavaScript and save as .js files', Boolean], ['-e', '--eval STRING', 'evaluate a string and print the result', [String, Array]], ['-f', '--features', 'list available features', Boolean], ['', '--no-`feature', 'disable a feature, e.g. --no-negative-index', null], ['-h', '--help', 'display this help message', Boolean], ['-j', '--js', 'print out the compiled JavaScript', Boolean], ['-m', '--map', 'generate source map and save as .js.map files', Boolean], ['-M', '--inline-map', 'generate source map and include it directly in output', Boolean], ['-n', '--noop', 'does nothing, for debugging purposes', Boolean], ['-o', '--output DIR', 'set the output directory for compiled JavaScript', String], ['-P', '--parse', 'print out the parse tree that the parser produces', Boolean], ['-r', '--require MODULE', 'require the given module before eval or REPL', [String, Array]], ['-R', '--rewriter', 'print out the code that the rewriter produces', Boolean], ['-s', '--stdio', 'listen for and compile scripts over stdio', Boolean], ['-t', '--test', 'compile and run the @test code', Boolean], ['-T', '--tokens', 'print out the tokens that the lexer/rewriter produce', Boolean], ['-v', '--version', 'display the version number', Boolean], ['-w', '--watch', 'watch scripts for changes and rerun commands', Boolean]];

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
        var ref3;
        o.feature[f.key] = (ref3 = o[f.flag]) != null ? ref3 : true;
        return delete o[f.flag];
    });
    if (o.Debug) {
        delete o.argv;
        return console.log(stringify(o));
    }
};

run = function() {
    var eval, i, j, len, len1, literals, ref3, ref4, results, source;
    parseOptions();
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
        ref3 = opts["eval"];
        for (i = 0, len = ref3.length; i < len; i++) {
            eval = ref3[i];
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
    ref4 = opts["arguments"];
    results = [];
    for (j = 0, len1 = ref4.length; j < len1; j++) {
        source = ref4[j];
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
    var code, err, file, files, i, len, ref3, ref4, results, stats, topLevel;
    topLevel = (ref3 = arg.topLevel) != null ? ref3 : false;
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
        if ((ref4 = path.basename(source)) === 'node_modules' || ref4 === '.git') {
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
    var err, ext, i, index, len, ref3;
    ref3 = Koffee.FILE_EXTENSIONS;
    for (i = 0, len = ref3.length; i < len; i++) {
        ext = ref3[i];
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
        } else if (o.rewriter) {
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
        message = (err != null ? err.stack : void 0) || ("" + err);
        if (o.watch) {
            return printLine(message + '\x07');
        } else {
            printWarn(message);
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
    var ctag, cvalue, i, index, ref3, results, tag, token, value;
    results = [];
    for (index = i = 0, ref3 = tokens.length; 0 <= ref3 ? i < ref3 : i > ref3; index = 0 <= ref3 ? ++i : --i) {
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
    var blueDim, grayDim, i, indent, index, ref3, ref4, results, spaced, tag, token, value, yellowDim;
    indent = 0;
    results = [];
    for (index = i = 0, ref3 = tokens.length; 0 <= ref3 ? i < ref3 : i > ref3; index = 0 <= ref3 ? ++i : --i) {
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
            var ref4;
            print(color("" + (v != null ? v : value)));
            if (token.spaced && ((ref4 = tokens[index + 1][0]) !== 'CALL_START')) {
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
                if ((ref4 = tokens[index + 1][0]) !== 'META_IF' && ref4 !== 'META_ELSE' && ref4 !== 'POST_META_IF') {
                    results.push(spaced(yellowDim));
                } else {
                    results.push(spaced(blueDim));
                }
                break;
            case 'META_IF':
            case 'META_ELSE':
            case 'POST_META_IF':
                results.push(spaced(blue));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBaUJBLEVBQUEsR0FBbUIsT0FBQSxDQUFRLElBQVI7O0FBQ25CLElBQUEsR0FBbUIsT0FBQSxDQUFRLE1BQVI7O0FBQ25CLElBQUEsR0FBbUIsT0FBQSxDQUFRLE1BQVI7O0FBQ25CLE9BQUEsR0FBbUIsT0FBQSxDQUFRLFdBQVI7O0FBQ25CLE1BQUEsR0FBbUIsT0FBQSxDQUFRLFVBQVI7O0FBQ25CLE1BQW1CLE9BQUEsQ0FBUSxlQUFSLENBQW5CLEVBQUUsaUJBQUYsRUFBUzs7QUFDUCxlQUFpQixPQUFBLENBQVEsUUFBUjs7QUFFbkIsYUFBQSxHQUFtQixJQUFJLENBQUMsR0FBTCxLQUFZOztBQUUvQixPQUFPLENBQUMsTUFBUixDQUFlLE1BQWYsRUFBdUIsSUFBSSxZQUEzQjs7QUFFQSxPQUE0QixPQUFBLENBQVEsWUFBUixDQUE1QixFQUFFLHdCQUFGLEVBQVk7O0FBRVYsbUNBQUYsRUFBZ0IsMkJBQWhCLEVBQTBCLDZCQUExQixFQUFxQyxxQkFBckMsRUFBNEM7O0FBQzVDLE9BVUksT0FBQSxDQUFRLFdBQVIsQ0FWSixFQUNJLGNBREosRUFDWSxnQkFEWixFQUVJLGNBRkosRUFFWSwwQkFGWixFQUdJLGdCQUhKLEVBR1ksNEJBSFosRUFJSSxvQkFKSixFQUlZLGdDQUpaLEVBS0ksa0JBTEosRUFLWSw4QkFMWixFQU1JLGtCQU5KLEVBTVksOEJBTlosRUFPSSxnQkFQSixFQU9ZLDRCQVBaLEVBUUksZ0JBUkosRUFRWSw0QkFSWixFQVNJLHNCQVRKLEVBU2E7O0FBR2IsS0FBQSxHQUFZLE9BQU8sQ0FBQzs7QUFDcEIsS0FBQSxHQUFZLFNBQUMsSUFBRDtXQUFVLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBZixDQUFxQixJQUFyQjtBQUFWOztBQUNaLFNBQUEsR0FBWSxTQUFDLElBQUQ7V0FBVSxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQWYsQ0FBcUIsSUFBQSxHQUFPLElBQTVCO0FBQVY7O0FBQ1osU0FBQSxHQUFZLFNBQUMsSUFBRDtXQUFVLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBZixDQUFxQixJQUFBLEdBQU8sSUFBNUI7QUFBVjs7QUFDWixNQUFBLEdBQVksU0FBQyxJQUFEO1dBQVUsUUFBUSxDQUFDLElBQVQsQ0FBYyxJQUFkO0FBQVY7O0FBRVosUUFBQSxHQUFXLENBQ1AsQ0FBQyxJQUFELEVBQU0sUUFBTixFQUE0Qiw4Q0FBNUIsRUFBb0YsT0FBcEYsQ0FETyxFQUVQLENBQUMsSUFBRCxFQUFNLFdBQU4sRUFBNEIsNkNBQTVCLEVBQW9GLE9BQXBGLENBRk8sRUFHUCxDQUFDLElBQUQsRUFBTSxlQUFOLEVBQTRCLHdDQUE1QixFQUFtRixDQUFDLE1BQUQsRUFBUyxLQUFULENBQW5GLENBSE8sRUFJUCxDQUFDLElBQUQsRUFBTSxZQUFOLEVBQTRCLHlCQUE1QixFQUFvRixPQUFwRixDQUpPLEVBS1AsQ0FBQyxFQUFELEVBQU0sZUFBTixFQUE0Qiw2Q0FBNUIsRUFBb0YsSUFBcEYsQ0FMTyxFQU1QLENBQUMsSUFBRCxFQUFNLFFBQU4sRUFBNEIsMkJBQTVCLEVBQW9GLE9BQXBGLENBTk8sRUFPUCxDQUFDLElBQUQsRUFBTSxNQUFOLEVBQTRCLG1DQUE1QixFQUFvRixPQUFwRixDQVBPLEVBUVAsQ0FBQyxJQUFELEVBQU0sT0FBTixFQUE0QiwrQ0FBNUIsRUFBb0YsT0FBcEYsQ0FSTyxFQVNQLENBQUMsSUFBRCxFQUFNLGNBQU4sRUFBNEIsdURBQTVCLEVBQW9GLE9BQXBGLENBVE8sRUFVUCxDQUFDLElBQUQsRUFBTSxRQUFOLEVBQTRCLHNDQUE1QixFQUFvRixPQUFwRixDQVZPLEVBV1AsQ0FBQyxJQUFELEVBQU0sY0FBTixFQUE0QixrREFBNUIsRUFBb0YsTUFBcEYsQ0FYTyxFQVlQLENBQUMsSUFBRCxFQUFNLFNBQU4sRUFBNEIsbURBQTVCLEVBQW9GLE9BQXBGLENBWk8sRUFhUCxDQUFDLElBQUQsRUFBTSxrQkFBTixFQUE0Qiw4Q0FBNUIsRUFBbUYsQ0FBQyxNQUFELEVBQVMsS0FBVCxDQUFuRixDQWJPLEVBY1AsQ0FBQyxJQUFELEVBQU0sWUFBTixFQUE0QiwrQ0FBNUIsRUFBb0YsT0FBcEYsQ0FkTyxFQWVQLENBQUMsSUFBRCxFQUFNLFNBQU4sRUFBNEIsMkNBQTVCLEVBQW9GLE9BQXBGLENBZk8sRUFnQlAsQ0FBQyxJQUFELEVBQU0sUUFBTixFQUE0QixnQ0FBNUIsRUFBb0YsT0FBcEYsQ0FoQk8sRUFpQlAsQ0FBQyxJQUFELEVBQU0sVUFBTixFQUE0QixzREFBNUIsRUFBb0YsT0FBcEYsQ0FqQk8sRUFrQlAsQ0FBQyxJQUFELEVBQU0sV0FBTixFQUE0Qiw0QkFBNUIsRUFBb0YsT0FBcEYsQ0FsQk8sRUFtQlAsQ0FBQyxJQUFELEVBQU0sU0FBTixFQUE0Qiw4Q0FBNUIsRUFBb0YsT0FBcEYsQ0FuQk87O0FBc0JYLElBQUEsR0FBTzs7QUFRUCxZQUFBLEdBQWUsU0FBQTtBQUVYLFFBQUE7SUFBQSxLQUFBLEdBQVE7UUFBQSxLQUFBLEVBQU0sT0FBTjs7SUFDUixLQUFBLEdBQVE7UUFBQSxDQUFBLEVBQUUsU0FBRjtRQUFZLENBQUEsRUFBRSxNQUFkOztJQUNSLFFBQVEsQ0FBQyxHQUFULENBQWEsU0FBQyxDQUFEO0FBQU8sWUFBQTtRQUFBLENBQUEsR0FBSSxDQUFFLENBQUEsQ0FBQSxDQUFFLENBQUMsS0FBTCxDQUFXLEdBQVgsQ0FBZ0IsQ0FBQSxDQUFBLENBQUc7UUFBTSxJQUFtQixDQUFFLENBQUEsQ0FBQSxDQUFyQjtZQUFBLEtBQU0sQ0FBQSxDQUFBLENBQU4sR0FBVyxDQUFFLENBQUEsQ0FBQSxFQUFiOztRQUF5QixJQUE2QixDQUFFLENBQUEsQ0FBQSxDQUFGLEtBQU0sRUFBbkM7bUJBQUEsS0FBTSxDQUFBLENBQUUsQ0FBQSxDQUFBLENBQUcsQ0FBQSxDQUFBLENBQUwsQ0FBTixHQUFpQixJQUFBLEdBQUssRUFBdEI7O0lBQTdELENBQWI7SUFDQSxRQUFRLENBQUMsR0FBVCxDQUFhLFNBQUMsQ0FBRDtlQUFPLEtBQU0sQ0FBQSxDQUFDLENBQUMsR0FBRixDQUFOLEdBQWU7SUFBdEIsQ0FBYjtJQUVBLENBQUEsR0FBSSxJQUFBLEdBQU8sSUFBQSxDQUFLLEtBQUwsRUFBWSxLQUFaO0lBRVgsQ0FBQyxDQUFDLFlBQUYsQ0FBQyxDQUFDLFVBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuQixDQUFDLEVBQUMsU0FBRCxFQUFELEdBQWUsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUN0QixJQUF3QyxDQUFDLENBQUMsT0FBMUM7UUFBQSxDQUFDLENBQUMsT0FBRixHQUFlLFdBQUEsQ0FBWSxDQUFDLENBQUMsT0FBZCxFQUFmOztJQUNBLENBQUMsQ0FBQyxHQUFGLEdBQWUsQ0FBSSxDQUFDLENBQUMsQ0FBQyxPQUFGLElBQWEsQ0FBQyxDQUFDLEVBQWYsSUFBcUIsQ0FBQyxDQUFDLEdBQXZCLElBQThCLENBQUMsQ0FBQyxNQUFoQyxJQUEwQyxDQUFDLENBQUMsS0FBN0M7SUFDbkIsQ0FBQyxDQUFDLEVBQUYsR0FBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRixJQUFRLENBQUMsRUFBQyxJQUFELEVBQVQsSUFBa0IsQ0FBQyxDQUFDLEtBQUYsSUFBWSxDQUFDLENBQUMsT0FBakM7SUFFakIsQ0FBQyxDQUFDLE9BQUYsR0FBWTtJQUNaLFFBQVEsQ0FBQyxHQUFULENBQWEsU0FBQyxDQUFEO0FBQU8sWUFBQTtRQUFBLENBQUMsQ0FBQyxPQUFRLENBQUEsQ0FBQyxDQUFDLEdBQUYsQ0FBVix1Q0FBK0I7ZUFBTSxPQUFPLENBQUUsQ0FBQSxDQUFDLENBQUMsSUFBRjtJQUFyRCxDQUFiO0lBRUEsSUFBRyxDQUFDLENBQUMsS0FBTDtRQUNJLE9BQU8sQ0FBQyxDQUFDO2VBQUksT0FBQSxDQUNiLEdBRGEsQ0FDVCxTQUFBLENBQVUsQ0FBVixDQURTLEVBRGpCOztBQWxCVzs7QUE0QmYsR0FBQSxHQUFNLFNBQUE7QUFFRixRQUFBO0lBQUEsWUFBQSxDQUFBO0lBRUEsSUFBeUIsSUFBSSxDQUFDLFFBQTlCO0FBQUEsZUFBTyxXQUFBLENBQUEsRUFBUDs7SUFDQSxJQUF5QixJQUFJLENBQUMsSUFBOUI7QUFBQSxlQUFPLEtBQUEsQ0FBQSxFQUFQOztJQUNBLElBQXlCLElBQUksQ0FBQyxPQUE5QjtBQUFBLGVBQU8sT0FBQSxDQUFBLEVBQVA7O0lBQ0EsSUFBeUIsSUFBSSxDQUFDLFdBQTlCO0FBQUEsZUFBTyxTQUFBLENBQUEsRUFBUDs7SUFDQSxJQUF5QixJQUFJLENBQUMsS0FBOUI7QUFBQSxlQUFPLFlBQUEsQ0FBQSxFQUFQOztJQUNBLElBQUcsSUFBSSxFQUFDLElBQUQsRUFBUDtBQUNJO0FBQUEsYUFBQSxzQ0FBQTs7WUFDSSxhQUFBLENBQWMsSUFBZDtBQURKO0FBRUEsZUFISjs7SUFJQSxJQUF5QixDQUFJLElBQUksRUFBQyxTQUFELEVBQVUsQ0FBQyxNQUE1QztBQUFBLGVBQU8sU0FBQSxDQUFBLEVBQVA7O0lBRUEsUUFBQSxHQUFjLENBQUksSUFBSSxDQUFDLEtBQVQsSUFBbUIsQ0FBSSxJQUFJLENBQUMsT0FBL0IsR0FBNEMsSUFBSSxFQUFDLFNBQUQsRUFBVSxDQUFDLE1BQWYsQ0FBc0IsQ0FBdEIsQ0FBNUMsR0FBeUU7SUFFcEYsT0FBTyxDQUFDLElBQVIsR0FBZSxPQUFPLENBQUMsSUFBSyxZQUFLLENBQUMsTUFBbkIsQ0FBMEIsUUFBMUI7SUFDZixPQUFPLENBQUMsSUFBSyxDQUFBLENBQUEsQ0FBYixHQUFrQjtJQUVsQixJQUEwQyxJQUFJLENBQUMsTUFBL0M7UUFBQSxJQUFJLENBQUMsTUFBTCxHQUFjLElBQUksQ0FBQyxPQUFMLENBQWEsSUFBSSxDQUFDLE1BQWxCLEVBQWQ7O0FBQ0E7QUFBQTtTQUFBLHdDQUFBOztRQUNJLE1BQUEsR0FBUyxJQUFJLENBQUMsT0FBTCxDQUFhLE1BQWI7UUFFVCxJQUFHLElBQUksQ0FBQyxLQUFSO3lCQUNJLFNBQUEsQ0FBVSxNQUFWLEdBREo7U0FBQSxNQUFBO3lCQUdJLFdBQUEsQ0FBWSxNQUFaLEVBQW9CO2dCQUFBLFFBQUEsRUFBUyxJQUFUO2FBQXBCLEdBSEo7O0FBSEo7O0FBckJFOztBQTZCTixPQUFPLENBQUMsR0FBUixHQUFjOztBQUVkLFNBQUEsR0FBWSxTQUFBO0FBTVIsUUFBQTtJQUFBLFdBQUEsR0FBYztRQUFBLFNBQUEsRUFBVyxJQUFYOztJQUNkLFdBQVcsQ0FBQyxPQUFaLEdBQXNCLElBQUksQ0FBQztXQUMzQixPQUFBLENBQVEsUUFBUixDQUFpQixDQUFDLEtBQWxCLENBQXdCLFdBQXhCO0FBUlE7O0FBVVosV0FBQSxHQUFjLFNBQUMsUUFBRDtXQUVWLFFBQVEsQ0FBQyxHQUFULENBQWEsU0FBQyxNQUFEO0FBQ1QsWUFBQTtRQUFBLElBQTZCLEtBQUEsR0FBUSxNQUFNLENBQUMsS0FBUCxDQUFhLGFBQWIsQ0FBckM7WUFBQyxZQUFELEVBQUksZUFBSixFQUFVLGtCQUFWOztRQUNBLFNBQUEsT0FBUyxZQUFBLENBQWEsTUFBYixFQUFxQixJQUFyQixFQUEwQixhQUExQjtlQUNOLElBQUQsR0FBTSxjQUFOLEdBQW9CLE1BQXBCLEdBQTJCO0lBSHBCLENBQWIsQ0FJQSxDQUFDLElBSkQsQ0FJTSxHQUpOO0FBRlU7O0FBZ0JkLFdBQUEsR0FBYyxTQUFDLE1BQUQsRUFBUyxHQUFUO0FBRVYsUUFBQTtJQUY0QixrREFBUztJQUVyQyxJQUFVLENBQUksUUFBSixJQUFpQixNQUFBLENBQU8sTUFBUCxDQUEzQjtBQUFBLGVBQUE7O0FBRUE7UUFDSSxLQUFBLEdBQVEsRUFBRSxDQUFDLFFBQUgsQ0FBWSxNQUFaLEVBRFo7S0FBQSxjQUFBO1FBRU07UUFDRixJQUFHLEdBQUcsQ0FBQyxJQUFKLEtBQVksUUFBZjtZQUNHLE9BQUEsQ0FBQyxLQUFELENBQU8sa0NBQUEsR0FBbUMsTUFBbkMsR0FBMEMsR0FBakQ7WUFDQyxPQUFPLENBQUMsSUFBUixDQUFhLENBQWIsRUFGSjs7QUFHQSxjQUFNLElBTlY7O0lBUUEsSUFBRyxLQUFLLENBQUMsV0FBTixDQUFBLENBQUg7UUFFSSxZQUFHLElBQUksQ0FBQyxRQUFMLENBQWMsTUFBZCxFQUFBLEtBQTBCLGNBQTFCLElBQUEsSUFBQSxLQUF5QyxNQUE1QztBQUNJLG1CQURKOztRQUdBLElBQUcsSUFBSSxDQUFDLEdBQVI7WUFDSSxXQUFBLENBQVksa0JBQUEsQ0FBbUIsTUFBbkIsQ0FBWixFQUF3QztnQkFBQSxRQUFBLEVBQVMsUUFBVDthQUF4QztBQUNBLG1CQUZKOztRQUlBLElBQTBDLElBQUksQ0FBQyxLQUEvQztZQUFBLE9BQUEsQ0FBQSxHQUFBLENBQUksMEJBQUosRUFBZ0MsTUFBaEMsRUFBQTs7QUFFQTtZQUNJLEtBQUEsR0FBUSxFQUFFLENBQUMsV0FBSCxDQUFlLE1BQWYsRUFEWjtTQUFBLGNBQUE7WUFFTTtZQUNGLElBQUcsR0FBRyxDQUFDLElBQUosS0FBWSxRQUFmO0FBQTZCLHVCQUE3Qjs7QUFDQSxrQkFBTSxJQUpWOztBQU1BO2FBQUEsdUNBQUE7O3lCQUNJLFdBQUEsQ0FBWSxJQUFJLENBQUMsSUFBTCxDQUFVLE1BQVYsRUFBa0IsSUFBbEIsQ0FBWjtBQURKO3VCQWpCSjtLQUFBLE1Bb0JLLElBQUcsUUFBQSxJQUFZLFFBQUEsQ0FBUyxNQUFULENBQWY7QUFFRDtZQUNJLElBQUEsR0FBTyxFQUFFLENBQUMsWUFBSCxDQUFnQixNQUFoQixFQURYO1NBQUEsY0FBQTtZQUVNO1lBQ0YsSUFBRyxHQUFHLENBQUMsSUFBSixLQUFZLFFBQWY7QUFBNkIsdUJBQTdCOztBQUNBLGtCQUFNLElBSlY7O1FBTUEsSUFBMkMsSUFBSSxDQUFDLEtBQWhEO1lBQUEsT0FBQSxDQUFBLEdBQUEsQ0FBSSwyQkFBSixFQUFpQyxNQUFqQyxFQUFBOztlQUVBLGFBQUEsQ0FBYyxJQUFJLENBQUMsUUFBTCxDQUFBLENBQWQsRUFBK0IsTUFBL0IsRUFWQzs7QUFoQ0s7O0FBNENkLGtCQUFBLEdBQXFCLFNBQUMsTUFBRDtBQUVqQixRQUFBO0FBQUE7QUFBQSxTQUFBLHNDQUFBOztRQUNJLEtBQUEsR0FBUSxJQUFJLENBQUMsSUFBTCxDQUFVLE1BQVYsRUFBa0IsT0FBQSxHQUFRLEdBQTFCO0FBQ1I7WUFDSSxJQUFnQixDQUFDLEVBQUUsQ0FBQyxRQUFILENBQVksS0FBWixDQUFELENBQW1CLENBQUMsTUFBcEIsQ0FBQSxDQUFoQjtBQUFBLHVCQUFPLE1BQVA7YUFESjtTQUFBLGNBQUE7WUFFTTtZQUNGLElBQWlCLEdBQUcsQ0FBQyxJQUFKLEtBQVksUUFBN0I7QUFBQSxzQkFBTSxJQUFOO2FBSEo7O0FBRko7SUFNQSxPQUFBLENBQUEsS0FBQSxDQUFNLDBCQUFBLEdBQTJCLE1BQWpDO1dBQ0EsT0FBTyxDQUFDLElBQVIsQ0FBYSxDQUFiO0FBVGlCOztBQW9CckIsYUFBQSxHQUFnQixTQUFDLElBQUQsRUFBTyxNQUFQO0FBRVosUUFBQTs7UUFGbUIsU0FBUzs7SUFFNUIsQ0FBQSxHQUFJO0lBQ0osT0FBQSxHQUFVLGNBQUEsQ0FBZSxNQUFmO0FBRVY7UUFDSSxDQUFBLEdBQUksSUFBQSxHQUFPO1lBQUMsUUFBQSxNQUFEO1lBQVMsTUFBQSxJQUFUO1lBQWUsU0FBQSxPQUFmOztRQUNYLE1BQU0sQ0FBQyxJQUFQLENBQVksU0FBWixFQUF1QixJQUF2QjtRQUNBLElBQUcsQ0FBQyxDQUFDLE1BQUw7bUJBQ0ksV0FBQSxDQUFZLE1BQU0sQ0FBQyxNQUFQLENBQWMsQ0FBQyxDQUFDLElBQWhCLEVBQXNCLENBQUMsQ0FBQyxPQUF4QixDQUFaLEVBREo7U0FBQSxNQUVLLElBQUcsQ0FBQyxDQUFDLFFBQUw7bUJBQ0QsYUFBQSxDQUFjLE1BQU0sQ0FBQyxNQUFQLENBQWMsQ0FBQyxDQUFDLElBQWhCLEVBQXNCLENBQUMsQ0FBQyxPQUF4QixDQUFkLEVBREM7U0FBQSxNQUVBLElBQUcsQ0FBQyxDQUFDLEtBQUw7bUJBQ0QsU0FBQSxDQUFVLE1BQU0sQ0FBQyxLQUFQLENBQWEsQ0FBQyxDQUFDLElBQWYsRUFBcUIsQ0FBQyxDQUFDLE9BQXZCLENBQStCLENBQUMsUUFBaEMsQ0FBQSxDQUEwQyxDQUFDLElBQTNDLENBQUEsQ0FBVixFQURDO1NBQUEsTUFFQSxJQUFHLENBQUMsQ0FBQyxHQUFMO1lBQ0QsTUFBTSxDQUFDLFFBQVAsQ0FBQTtZQUNBLElBQXVDLElBQUksQ0FBQyxPQUE1QztnQkFBQSxNQUFNLEVBQUMsSUFBRCxFQUFOLENBQVksSUFBSSxDQUFDLE9BQWpCLEVBQTBCLENBQUMsQ0FBQyxPQUE1QixFQUFBOzs7b0JBQ1MsQ0FBQzs7b0JBQUQsQ0FBQyxXQUFZLE9BQU8sQ0FBQzs7WUFDOUIsSUFBRyxJQUFJLENBQUMsSUFBUjt1QkFBVyxPQUFBLENBQU8sR0FBUCxDQUFXLFdBQUEsR0FBWSxNQUF2QixFQUFYO2FBQUEsTUFBQTt1QkFFSSxNQUFNLENBQUMsR0FBUCxDQUFXLENBQUMsQ0FBQyxJQUFiLEVBQW1CLENBQUMsQ0FBQyxPQUFyQixFQUZKO2FBSkM7U0FBQSxNQUFBO1lBUUQsUUFBQSxHQUFXLE1BQU0sQ0FBQyxPQUFQLENBQWUsQ0FBQyxDQUFDLElBQWpCLEVBQXVCLENBQUMsQ0FBQyxPQUF6QjtZQUNYLENBQUMsQ0FBQyxNQUFGLEdBQVc7WUFDWCxJQUFHLENBQUMsQ0FBQyxHQUFMO2dCQUNJLENBQUMsQ0FBQyxNQUFGLEdBQVcsUUFBUSxDQUFDO2dCQUNwQixDQUFDLENBQUMsU0FBRixHQUFjLFFBQVEsQ0FBQyxZQUYzQjs7WUFJQSxNQUFNLENBQUMsSUFBUCxDQUFZLFNBQVosRUFBdUIsSUFBdkI7WUFFQSxJQUFHLENBQUMsQ0FBQyxFQUFMO2dCQUNJLElBQUcsSUFBSSxDQUFDLElBQVI7MkJBQVcsT0FBQSxDQUFPLEdBQVAsQ0FBVyxVQUFBLEdBQVcsTUFBdEIsRUFBWDtpQkFBQSxNQUFBOzJCQUVJLFNBQUEsQ0FBVSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQVQsQ0FBQSxDQUFWLEVBRko7aUJBREo7YUFBQSxNQUlLLElBQUcsQ0FBQyxDQUFDLE9BQUYsSUFBYSxDQUFDLENBQUMsR0FBbEI7Z0JBQ0QsSUFBRyxJQUFJLENBQUMsSUFBUjsyQkFBVyxPQUFBLENBQU8sR0FBUCxDQUFXLGFBQUEsR0FBYyxPQUFPLENBQUMsTUFBakMsRUFBWDtpQkFBQSxNQUFBOzJCQUVJLE9BQUEsQ0FBUSxDQUFDLENBQUMsTUFBVixFQUFrQixDQUFDLENBQUMsTUFBcEIsRUFBNEIsT0FBTyxDQUFDLE1BQXBDLEVBQTRDLENBQUMsQ0FBQyxTQUE5QyxFQUZKO2lCQURDO2FBcEJKO1NBVFQ7S0FBQSxjQUFBO1FBaUNNO1FBRUYsTUFBTSxDQUFDLElBQVAsQ0FBWSxTQUFaLEVBQXVCLEdBQXZCLEVBQTRCLElBQTVCO1FBQ0EsSUFBVSxNQUFNLENBQUMsU0FBUCxDQUFpQixTQUFqQixDQUEyQixDQUFDLE1BQXRDO0FBQUEsbUJBQUE7O1FBQ0EsT0FBQSxrQkFBVSxHQUFHLENBQUUsZUFBTCxJQUFjLENBQUEsRUFBQSxHQUFHLEdBQUg7UUFDeEIsSUFBRyxDQUFDLENBQUMsS0FBTDttQkFDSSxTQUFBLENBQVUsT0FBQSxHQUFVLE1BQXBCLEVBREo7U0FBQSxNQUFBO1lBR0ksU0FBQSxDQUFVLE9BQVY7bUJBQ0EsT0FBTyxDQUFDLElBQVIsQ0FBYSxDQUFiLEVBSko7U0F0Q0o7O0FBTFk7O0FBaURoQixjQUFBLEdBQWlCLFNBQUMsTUFBRDtBQUViLFFBQUE7SUFBQSxLQUFBLEdBQ0k7UUFBQSxNQUFBLEVBQVcsTUFBWDtRQUNBLFNBQUEsRUFBVyxJQUFJLENBQUMsR0FEaEI7UUFFQSxTQUFBLEVBQVcsSUFBSyxDQUFBLFlBQUEsQ0FGaEI7UUFHQSxPQUFBLEVBQVcsSUFBSSxDQUFDLE9BSGhCO1FBSUEsSUFBQSxFQUFXLElBQUksQ0FBQyxJQUpoQjtRQUtBLElBQUEsRUFBVyxJQUFJLENBQUMsSUFMaEI7UUFNQSxLQUFBLEVBQVcsSUFBSSxDQUFDLEtBTmhCOztJQVFKLElBQUcsTUFBSDtRQUVJLEdBQUEsR0FBTSxPQUFPLENBQUMsR0FBUixDQUFBO1FBQ04sTUFBQSxHQUFTLFVBQUEsQ0FBVyxNQUFYLEVBQW1CLEtBQW5CO1FBQ1QsS0FBQSxHQUFRLElBQUksQ0FBQyxPQUFMLENBQWEsTUFBYjtRQUNSLEtBQUEsR0FBUSxLQUFBLENBQU0sS0FBTixFQUFhO1lBQ2pCLFFBQUEsTUFEaUI7WUFFakIsVUFBQSxFQUFZLElBQUksQ0FBQyxRQUFMLENBQWMsS0FBZCxFQUFxQixHQUFyQixDQUZLO1lBR2pCLFdBQUEsRUFBYSxDQUFDLElBQUksQ0FBQyxRQUFMLENBQWMsR0FBZCxFQUFtQixNQUFuQixDQUFELENBSEk7WUFJakIsYUFBQSxFQUFlLFlBQUEsQ0FBYSxNQUFiLEVBQXFCLEtBQXJCLEVBQXlCLGFBQXpCLENBSkU7U0FBYixFQUxaOztXQVdBO0FBdEJhOztBQTBCakIsWUFBQSxHQUFlLFNBQUE7QUFFWCxRQUFBO0lBQUEsT0FBQSxHQUFVO0lBQ1YsS0FBQSxHQUFRLE9BQU8sQ0FBQyxTQUFSLENBQUE7SUFDUixLQUFLLENBQUMsRUFBTixDQUFTLE1BQVQsRUFBaUIsU0FBQyxNQUFEO1FBQ2IsSUFBdUIsTUFBdkI7bUJBQUEsT0FBTyxDQUFDLElBQVIsQ0FBYSxNQUFiLEVBQUE7O0lBRGEsQ0FBakI7V0FFQSxLQUFLLENBQUMsRUFBTixDQUFTLEtBQVQsRUFBZ0IsU0FBQTtlQUNaLGFBQUEsQ0FBYyxNQUFNLENBQUMsTUFBUCxDQUFjLE9BQWQsQ0FBc0IsQ0FBQyxRQUF2QixDQUFBLENBQWQ7SUFEWSxDQUFoQjtBQU5XOztBQWVmLFNBQUEsR0FBWSxTQUFDLE1BQUQ7QUFFUixRQUFBO0FBQUE7UUFDSSxLQUFBLEdBQVEsRUFBRSxDQUFDLFFBQUgsQ0FBWSxNQUFaLEVBRFo7S0FBQSxjQUFBO1FBRU07UUFDRixJQUFVLEdBQUcsQ0FBQyxJQUFKLEtBQVksUUFBdEI7QUFBQSxtQkFBQTs7QUFDQSxlQUFLLE9BQUEsQ0FBRSxLQUFGLENBQVEsZ0NBQUEsR0FBaUMsTUFBakMsR0FBd0MsR0FBaEQsRUFBb0QsR0FBcEQsRUFKVDs7SUFNQSxJQUFHLEtBQUssQ0FBQyxXQUFOLENBQUEsQ0FBSDtlQUNJLFFBQUEsQ0FBUyxNQUFULEVBREo7S0FBQSxNQUFBO2VBR0ksU0FBQSxDQUFVLE1BQVYsRUFISjs7QUFSUTs7QUFnQlosU0FBQSxHQUFZLFNBQUMsTUFBRDtBQUVSLFFBQUE7SUFBQSxJQUFVLENBQUksUUFBQSxDQUFTLE1BQVQsQ0FBZDtBQUFBLGVBQUE7O0lBQTZCLElBRU0sSUFBSSxDQUFDLEtBRlg7UUFBQSxPQUFBLENBRTdCLEdBRjZCLENBRXpCLG1CQUZ5QixFQUVKLE1BRkksRUFBQTs7SUFJN0IsT0FBQSxHQUFpQjtJQUNqQixTQUFBLEdBQWlCO0lBQ2pCLGNBQUEsR0FBaUI7SUFFakIsWUFBQSxHQUFlLFNBQUE7ZUFFWCxPQUFBLEdBQVUsRUFBRSxDQUFDLEtBQUgsQ0FBUyxNQUFULENBQ1YsQ0FBQyxFQURTLENBQ04sUUFETSxFQUNJLFNBQUMsTUFBRDtZQUVWLElBQVUsTUFBQSxLQUFVLFFBQXBCO0FBQUEsdUJBQUE7O1lBQTRCLElBRWUsSUFBSSxDQUFDLEtBRnBCO2dCQUFBLE9BQUEsQ0FFNUIsR0FGNEIsQ0FFeEIsbUJBRndCLEVBRUgsTUFGRyxFQUVLLE1BRkwsRUFBQTs7WUFJNUIsWUFBQSxDQUFhLGNBQWI7bUJBQ0EsY0FBQSxHQUFpQixJQUFBLENBQUssRUFBTCxFQUFTLFNBQUE7dUJBRXRCLEVBQUUsQ0FBQyxJQUFILENBQVEsTUFBUixFQUFnQixTQUFDLEdBQUQsRUFBTSxLQUFOO29CQUNaLG1CQUEwQixHQUFHLENBQUUsY0FBTCxLQUFhLFFBQXZDO0FBQUEsK0JBQU8sT0FBTyxDQUFDLEtBQVIsQ0FBQSxFQUFQOztvQkFDQSxJQUFvQixHQUFwQjtBQUFBLCtCQUFLLE9BQUEsQ0FBRSxLQUFGLENBQVEsR0FBUixFQUFMOztvQkFDQSxJQUFVLFNBQUEsSUFBYyxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQVosQ0FBQSxDQUFBLEtBQXlCLFNBQVMsQ0FBQyxLQUFLLENBQUMsT0FBaEIsQ0FBQSxDQUF2QyxJQUFxRSxLQUFLLENBQUMsSUFBTixLQUFjLFNBQVMsQ0FBQyxJQUF2RztBQUFBLCtCQUFBOztvQkFDQSxTQUFBLEdBQVk7MkJBQ1osRUFBRSxDQUFDLFFBQUgsQ0FBWSxNQUFaLEVBQW9CLFNBQUMsR0FBRCxFQUFNLElBQU47d0JBQ2hCLElBQW9CLEdBQXBCO0FBQUEsbUNBQUssT0FBQSxDQUFFLEtBQUYsQ0FBUSxHQUFSLEVBQUw7O3dCQUF1QixJQUNvQixJQUFJLENBQUMsS0FEekI7NEJBQUEsT0FBQSxDQUN2QixHQUR1QixDQUNuQiwyQkFEbUIsRUFDVSxNQURWLEVBQUE7OytCQUV2QixhQUFBLENBQWMsSUFBSSxDQUFDLFFBQUwsQ0FBQSxDQUFkLEVBQStCLE1BQS9CO29CQUhnQixDQUFwQjtnQkFMWSxDQUFoQjtZQUZzQixDQUFUO1FBUFAsQ0FESixDQW9CVixDQUFDLEVBcEJTLENBb0JOLE9BcEJNLEVBb0JHLFNBQUMsR0FBRDtZQUNULElBQWlCLEdBQUcsQ0FBQyxJQUFKLEtBQVksT0FBN0I7QUFBQSxzQkFBTSxJQUFOOztRQURTLENBcEJIO0lBRkM7QUF5QmY7ZUFDSSxZQUFBLENBQUEsRUFESjtLQUFBLGNBQUE7UUFFTTtlQUNILE9BQUEsQ0FBQyxLQUFELENBQU8sR0FBUCxFQUhIOztBQW5DUTs7QUF3Q1osUUFBQSxHQUFXLFNBQUMsTUFBRDtBQUVSLFFBQUE7SUFBQSxJQUFtQyxJQUFJLENBQUMsS0FBeEM7UUFBQSxPQUFBLENBQUMsR0FBRCxDQUFLLGtCQUFMLEVBQXlCLE1BQXpCLEVBQUE7O0lBRUMsT0FBQSxHQUFVO0lBRVYsWUFBQSxHQUFlLFNBQUE7QUFFWCxZQUFBO0FBQUE7WUFDSSxLQUFBLEdBQVEsRUFBRSxDQUFDLFdBQUgsQ0FBZSxNQUFmLEVBRFo7U0FBQSxjQUFBO1lBRU07WUFDRixtQkFBVSxHQUFHLENBQUUsY0FBTCxLQUFhLFFBQXZCO0FBQUEsdUJBQUE7O0FBQ0Esa0JBQU0sSUFKVjs7QUFNQSxhQUFBLHVDQUFBOztZQUNJLElBQVksSUFBSyxDQUFBLENBQUEsQ0FBTCxLQUFXLEdBQXZCO0FBQUEseUJBQUE7O1lBQ0EsSUFBWSxJQUFBLEtBQVMsY0FBckI7QUFBQSx5QkFBQTs7WUFDQSxTQUFBLENBQVUsSUFBSSxDQUFDLElBQUwsQ0FBVSxNQUFWLEVBQWtCLElBQWxCLENBQVY7QUFISjtlQUtBLE9BQUEsR0FBVSxFQUFFLENBQUMsS0FBSCxDQUFTLE1BQVQsQ0FDVixDQUFDLEVBRFMsQ0FDTixPQURNLEVBQ0csU0FBQyxHQUFEO1lBQ1QsSUFBaUIsR0FBRyxDQUFDLElBQUosS0FBWSxPQUE3QjtBQUFBLHNCQUFNLElBQU47O21CQUNBLE9BQU8sQ0FBQyxLQUFSLENBQUE7UUFGUyxDQURILENBSVYsQ0FBQyxFQUpTLENBSU4sUUFKTSxFQUlJLFNBQUMsTUFBRCxFQUFTLENBQVQ7WUFDVixJQUFHLE1BQUEsS0FBVSxRQUFiO2dCQUNHLElBQXdELElBQUksQ0FBQyxLQUE3RDtvQkFBQSxPQUFBLENBQUMsR0FBRCxDQUFLLGtCQUFMLEVBQXlCLE1BQXpCLEVBQWlDLElBQUksQ0FBQyxJQUFMLENBQVUsTUFBVixFQUFrQixDQUFsQixDQUFqQyxFQUFBOzt1QkFDQyxTQUFBLENBQVUsSUFBSSxDQUFDLElBQUwsQ0FBVSxNQUFWLEVBQWtCLENBQWxCLENBQVYsRUFGSjs7UUFEVSxDQUpKO0lBYkM7QUFzQmY7ZUFDSSxZQUFBLENBQUEsRUFESjtLQUFBLGNBQUE7UUFFTTtRQUNGLElBQVUsR0FBRyxDQUFDLElBQUosS0FBWSxRQUF0QjtBQUFBLG1CQUFBOztBQUNBLGNBQU0sSUFKVjs7QUE1Qk87O0FBb0NYLFVBQUEsR0FBYSxTQUFDLE1BQUQsRUFBUyxTQUFUO0FBRVQsUUFBQTtJQUFBLFFBQUEsR0FBVyxZQUFBLENBQWEsTUFBYixFQUFxQixJQUFyQixFQUEwQixhQUExQjtJQUNYLElBQUcsSUFBSSxDQUFDLE1BQVI7UUFDSSxHQUFBLEdBQU0sSUFBSSxDQUFDLE9BRGY7S0FBQSxNQUFBO1FBR0ksR0FBQSxHQUFNLElBQUksQ0FBQyxPQUFMLENBQWEsTUFBYixFQUhWOztXQUlBLElBQUksQ0FBQyxJQUFMLENBQVUsR0FBVixFQUFlLFFBQUEsR0FBVyxTQUExQjtBQVBTOztBQVdiLE1BQUEsR0FBUyxTQUFDLEdBQUQsRUFBTSxFQUFOO0FBQ0wsUUFBQTtJQUFBLElBQUEsR0FBTyxLQUFBLEdBQVEsQ0FBQyxPQUFPLENBQUMsS0FBUixDQUFBO1dBRWIsQ0FBQSxNQUFBLEdBQVMsU0FBQyxDQUFELEVBQVUsRUFBVjtlQUNSLEVBQUUsQ0FBQyxNQUFILENBQVUsQ0FBVixFQUFhLFNBQUMsTUFBRDtZQUNULElBQUcsTUFBSDt1QkFDSSxFQUFBLENBQUEsRUFESjthQUFBLE1BQUE7dUJBR0ksTUFBQSxDQUFPLElBQUksQ0FBQyxPQUFMLENBQWEsQ0FBYixDQUFQLEVBQXdCLFNBQUE7MkJBQ3BCLEVBQUUsQ0FBQyxLQUFILENBQVMsQ0FBVCxFQUFZLElBQVosRUFBa0IsU0FBQyxHQUFEO3dCQUNkLElBQWlCLEdBQWpCO0FBQUEsbUNBQU8sRUFBQSxDQUFHLEdBQUgsRUFBUDs7K0JBQ0EsRUFBQSxDQUFBO29CQUZjLENBQWxCO2dCQURvQixDQUF4QixFQUhKOztRQURTLENBQWI7SUFEUSxDQUFULENBQUgsQ0FBaUIsR0FBakIsRUFBc0IsRUFBdEI7QUFISzs7QUF1QlQsT0FBQSxHQUFVLFNBQUMsTUFBRCxFQUFTLEVBQVQsRUFBYSxNQUFiLEVBQXFCLGtCQUFyQjtBQUVOLFFBQUE7O1FBRjJCLHFCQUFxQjs7SUFFaEQsYUFBQSxHQUFnQixVQUFBLENBQVcsTUFBWCxFQUFtQixTQUFuQjtJQUNoQixLQUFBLEdBQVEsSUFBSSxDQUFDLE9BQUwsQ0FBYSxNQUFiO0lBQ1IsT0FBQSxHQUFVLFNBQUE7UUFDTixJQUFHLElBQUksQ0FBQyxPQUFSO1lBQ0ksSUFBWSxFQUFFLENBQUMsTUFBSCxJQUFhLENBQXpCO2dCQUFBLEVBQUEsR0FBSyxJQUFMOztZQUNBLElBQUcsa0JBQUg7Z0JBQTJCLEVBQUEsR0FBUSxFQUFELEdBQUkseUJBQUosR0FBNEIsQ0FBQyxZQUFBLENBQWEsYUFBYixFQUE0QixLQUE1QixFQUFnQyxhQUFoQyxDQUFELENBQTVCLEdBQTJFLEtBQTdHOztZQUNBLEVBQUUsQ0FBQyxTQUFILENBQWEsTUFBYixFQUFxQixFQUFyQixFQUF5QixTQUFDLEdBQUQ7Z0JBQ3JCLElBQUcsR0FBSDtvQkFDSSxTQUFBLENBQVUsR0FBRyxDQUFDLE9BQWQ7MkJBQ0EsT0FBTyxDQUFDLElBQVIsQ0FBYSxDQUFiLEVBRko7aUJBQUEsTUFHSyxJQUFHLElBQUksQ0FBQyxPQUFMLElBQWlCLElBQUksQ0FBQyxLQUF6QjsyQkFDRCxPQUFBLENBQVEsV0FBQSxHQUFZLE1BQXBCLEVBREM7O1lBSmdCLENBQXpCLEVBSEo7O1FBU0EsSUFBRyxrQkFBSDttQkFDSSxFQUFFLENBQUMsU0FBSCxDQUFhLGFBQWIsRUFBNEIsa0JBQTVCLEVBQWdELFNBQUMsR0FBRDtnQkFDNUMsSUFBRyxHQUFIO29CQUNJLFNBQUEsQ0FBVSw4QkFBQSxHQUErQixHQUFHLENBQUMsT0FBN0M7MkJBQ0EsT0FBTyxDQUFDLElBQVIsQ0FBYSxDQUFiLEVBRko7O1lBRDRDLENBQWhELEVBREo7O0lBVk07V0FlVixFQUFFLENBQUMsTUFBSCxDQUFVLEtBQVYsRUFBaUIsU0FBQyxRQUFEO1FBQ2IsSUFBRyxRQUFIO21CQUFpQixPQUFBLENBQUEsRUFBakI7U0FBQSxNQUFBO21CQUFnQyxNQUFBLENBQU8sS0FBUCxFQUFjLE9BQWQsRUFBaEM7O0lBRGEsQ0FBakI7QUFuQk07O0FBc0JWLElBQUEsR0FBTyxTQUFDLFlBQUQsRUFBZSxJQUFmO1dBQXdCLFVBQUEsQ0FBVyxJQUFYLEVBQWlCLFlBQWpCO0FBQXhCOztBQUVQLE9BQUEsR0FBVSxTQUFDLE9BQUQ7V0FBVyxPQUFBLENBQUUsR0FBRixDQUFRLENBQUMsQ0FBQyxJQUFJLElBQUwsQ0FBVSxDQUFDLGtCQUFYLENBQUEsQ0FBRCxDQUFBLEdBQWlDLEtBQWpDLEdBQXNDLE9BQTlDO0FBQVg7O0FBUVYsV0FBQSxHQUFjLFNBQUMsTUFBRDtBQUVWLFFBQUE7QUFBQTtTQUFhLG1HQUFiO1FBQ0ksS0FBQSxHQUFTLE1BQU8sQ0FBQSxLQUFBO1FBQ2hCLEdBQUEsR0FBUyxLQUFNLENBQUEsQ0FBQTtRQUNmLEtBQUEsR0FBUyxLQUFNLENBQUEsQ0FBQSxDQUFFLENBQUMsUUFBVCxDQUFBLENBQW1CLENBQUMsT0FBcEIsQ0FBNEIsSUFBNUIsRUFBa0MsS0FBbEM7UUFDVCxJQUFBLEdBQVMsSUFBQSxDQUFLLEdBQUw7UUFDVCxNQUFBLEdBQVMsSUFBQSxDQUFLLE1BQUEsQ0FBTyxLQUFQLENBQUw7UUFDVCxLQUFBLEdBQVMsSUFBQSxDQUFLLEdBQUEsQ0FBSSxLQUFKLENBQUw7UUFDVCxJQUFHLEdBQUEsS0FBTyxZQUFWO3lCQUNJLEtBQUEsQ0FBTSxNQUFOLEdBREo7U0FBQSxNQUVLLElBQUcsR0FBQSxLQUFPLFFBQVY7eUJBQ0QsS0FBQSxDQUFNLElBQUEsQ0FBSyxHQUFBLENBQUksTUFBSixDQUFMLENBQU4sR0FEQztTQUFBLE1BRUEsSUFBRyxHQUFBLEtBQU8sU0FBVjt5QkFDRCxLQUFBLENBQU0sSUFBQSxDQUFLLEdBQUEsQ0FBSSxNQUFKLENBQUwsQ0FBTixHQURDO1NBQUEsTUFFQSxJQUFHLEdBQUEsS0FBUSxPQUFSLElBQUEsR0FBQSxLQUFnQixhQUFoQixJQUFBLEdBQUEsS0FBOEIsV0FBOUIsSUFBQSxHQUFBLEtBQTBDLE1BQTdDO3lCQUNELEtBQUEsQ0FBTSxFQUFBLEdBQUcsS0FBSCxHQUFXLElBQVgsR0FBZ0IsR0FBdEIsR0FEQztTQUFBLE1BRUEsSUFBRyxHQUFBLEtBQU8sS0FBVjt5QkFDRCxLQUFBLENBQU0sRUFBQSxHQUFHLEtBQUgsR0FBVyxNQUFYLEdBQWtCLEdBQXhCLEdBREM7U0FBQSxNQUFBO3lCQUdELEtBQUEsQ0FBTSxFQUFBLEdBQUcsS0FBSCxHQUFXLElBQVgsR0FBZ0IsR0FBaEIsR0FBbUIsTUFBbkIsR0FBMEIsR0FBaEMsR0FIQzs7QUFmVDs7QUFGVTs7QUFzQmQsYUFBQSxHQUFnQixTQUFDLE1BQUQ7QUFFWixRQUFBO0lBQUEsTUFBQSxHQUFTO0FBQ1Q7U0FBYSxtR0FBYjtRQUNJLEtBQUEsR0FBUSxNQUFPLENBQUEsS0FBQTtRQUNmLEdBQUEsR0FBUSxLQUFNLENBQUEsQ0FBQTtRQUNkLEtBQUEsR0FBUSxLQUFNLENBQUEsQ0FBQTtRQUVkLE9BQUEsR0FBVSxTQUFDLENBQUQ7bUJBQU8sR0FBQSxDQUFJLElBQUEsQ0FBSyxDQUFMLENBQUo7UUFBUDtRQUNWLE9BQUEsR0FBVSxTQUFDLENBQUQ7bUJBQU8sR0FBQSxDQUFJLElBQUEsQ0FBSyxDQUFMLENBQUo7UUFBUDtRQUNWLFNBQUEsR0FBWSxTQUFDLENBQUQ7bUJBQU8sR0FBQSxDQUFJLE1BQUEsQ0FBTyxDQUFQLENBQUo7UUFBUDtRQUNaLE1BQUEsR0FBUyxTQUFDLEtBQUQsRUFBUSxDQUFSO0FBQ0wsZ0JBQUE7WUFBQSxLQUFBLENBQU0sS0FBQSxDQUFNLEVBQUEsR0FBRSxhQUFDLElBQUksS0FBTCxDQUFSLENBQU47WUFDQSxJQUFhLEtBQUssQ0FBQyxNQUFOLElBQWlCLFNBQUEsTUFBTyxDQUFBLEtBQUEsR0FBTSxDQUFOLENBQVMsQ0FBQSxDQUFBLEVBQWhCLEtBQTJCLFlBQTNCLENBQTlCO3VCQUFBLEtBQUEsQ0FBTSxHQUFOLEVBQUE7O1FBRks7QUFLVCxnQkFBTyxHQUFQO0FBQUEsaUJBQ1MsWUFEVDs2QkFDa0QsS0FBQSxDQUFNLElBQUEsR0FBSSxDQUFDLEdBQUEsQ0FBSSxFQUFKLEVBQVEsTUFBUixDQUFELENBQVY7QUFBekM7QUFEVCxpQkFFUyxRQUZUO2dCQUVrRCxNQUFBLElBQVU7NkJBQUcsS0FBQSxDQUFNLElBQUEsR0FBSSxDQUFDLEdBQUEsQ0FBSSxFQUFKLEVBQVEsTUFBUixDQUFELENBQVY7QUFBdEQ7QUFGVCxpQkFHUyxTQUhUO2dCQUdrRCxNQUFBLElBQVU7NkJBQUcsS0FBQSxDQUFNLElBQUEsR0FBSSxDQUFDLEdBQUEsQ0FBSSxFQUFKLEVBQVEsTUFBUixDQUFELENBQVY7QUFBdEQ7QUFIVCxpQkFJUyxhQUpUOzZCQUlrRCxNQUFBLENBQU8sT0FBUDtBQUF6QztBQUpULGlCQUtTLFlBTFQ7QUFBQSxpQkFLc0IsVUFMdEI7NkJBS2tELE1BQUEsQ0FBTyxPQUFQO0FBQTVCO0FBTHRCLGlCQU1TLE9BTlQ7NkJBTWtELE1BQUEsQ0FBTyxVQUFQLEVBQW1CLEtBQW5CO0FBQXpDO0FBTlQsaUJBT1MsSUFQVDs2QkFPa0QsTUFBQSxDQUFPLFVBQVAsRUFBbUIsS0FBbkI7QUFBekM7QUFQVCxpQkFRUyxJQVJUOzZCQVFrRCxNQUFBLENBQU8sVUFBUCxFQUFtQixJQUFuQjtBQUF6QztBQVJULGlCQVNTLFFBVFQ7NkJBU2tELE1BQUEsQ0FBTyxLQUFQO0FBQXpDO0FBVFQsaUJBVVMsY0FWVDtBQUFBLGlCQVV3QixZQVZ4Qjs2QkFVa0QsTUFBQSxDQUFPLFNBQVA7QUFBMUI7QUFWeEIsaUJBV1MsVUFYVDs2QkFXa0QsTUFBQSxDQUFPLE1BQVA7QUFBekM7QUFYVCxpQkFZUyxHQVpUOzZCQVlrRCxNQUFBLENBQU8sU0FBUDtBQUF6QztBQVpULGlCQWFTLEdBYlQ7Z0JBY1EsWUFBRyxNQUFPLENBQUEsS0FBQSxHQUFNLENBQU4sQ0FBUyxDQUFBLENBQUEsRUFBaEIsS0FBMkIsU0FBM0IsSUFBQSxJQUFBLEtBQXFDLFdBQXJDLElBQUEsSUFBQSxLQUFpRCxjQUFwRDtpQ0FBeUUsTUFBQSxDQUFPLFNBQVAsR0FBekU7aUJBQUEsTUFBQTtpQ0FBZ0csTUFBQSxDQUFPLE9BQVAsR0FBaEc7O0FBREM7QUFiVCxpQkFlUyxTQWZUO0FBQUEsaUJBZW1CLFdBZm5CO0FBQUEsaUJBZStCLGNBZi9COzZCQWVtRCxNQUFBLENBQU8sSUFBUDtBQUFwQjtBQWYvQixpQkFnQlMsUUFoQlQ7NkJBZ0JrRCxNQUFBLENBQU8sSUFBUDtBQUF6QztBQWhCVCxpQkFpQlMsR0FqQlQ7QUFBQSxpQkFpQlksR0FqQlo7Z0JBaUJrRCxJQUFHLENBQUksS0FBSyxDQUFDLFNBQWI7aUNBQTRCLE1BQUEsQ0FBTyxJQUFQLEdBQTVCO2lCQUFBLE1BQUE7eUNBQUE7O0FBQXRDO0FBakJaLGlCQWtCUyxHQWxCVDtBQUFBLGlCQWtCYSxHQWxCYjtBQUFBLGlCQWtCaUIsR0FsQmpCO0FBQUEsaUJBa0JxQixJQWxCckI7QUFBQSxpQkFrQjBCLElBbEIxQjtBQUFBLGlCQWtCK0IsS0FsQi9CO0FBQUEsaUJBa0JxQyxJQWxCckM7QUFBQSxpQkFtQlMsR0FuQlQ7QUFBQSxpQkFtQmEsR0FuQmI7QUFBQSxpQkFtQmlCLEdBbkJqQjtBQUFBLGlCQW1CcUIsR0FuQnJCO0FBQUEsaUJBbUJ5QixHQW5CekI7QUFBQSxpQkFtQjZCLE1BbkI3QjtBQUFBLGlCQW1Cb0MsWUFuQnBDO0FBQUEsaUJBb0JTLGFBcEJUO0FBQUEsaUJBb0J1QixXQXBCdkI7QUFBQSxpQkFxQlMsU0FyQlQ7QUFBQSxpQkFxQm1CLGlCQXJCbkI7NkJBcUJrRCxNQUFBLENBQU8sSUFBUDtBQUEvQjtBQXJCbkIsaUJBc0JTLEdBdEJUO0FBQUEsaUJBc0JhLEdBdEJiO0FBQUEsaUJBc0JpQixHQXRCakI7NkJBc0JrRCxNQUFBLENBQU8sT0FBUDtBQUFqQztBQXRCakIsaUJBdUJTLGFBdkJUO0FBQUEsaUJBdUJ1QixXQXZCdkI7QUFBQSxpQkF1Qm1DLElBdkJuQztBQUFBLGlCQXVCd0MsSUF2QnhDOzZCQXVCa0QsTUFBQSxDQUFPLFNBQUMsQ0FBRDsyQkFBTyxJQUFBLENBQUssSUFBQSxDQUFLLENBQUwsQ0FBTDtnQkFBUCxDQUFQO0FBQVY7QUF2QnhDLGlCQXdCUyxNQXhCVDtBQUFBLGlCQXdCZ0IsV0F4QmhCO0FBQUEsaUJBd0I0QixZQXhCNUI7QUFBQSxpQkF3QnlDLEdBeEJ6QztBQUFBLGlCQXdCNkMsSUF4QjdDO0FBQUEsaUJBd0JrRCxNQXhCbEQ7NkJBd0I4RCxNQUFBLENBQU8sR0FBUDtBQUFaO0FBeEJsRCxpQkF5QlMsT0F6QlQ7NkJBeUJrRCxNQUFBLENBQU8sT0FBUDtBQUF6QztBQXpCVCxpQkEwQlMsS0ExQlQ7QUFBQSxpQkEwQmUsT0ExQmY7QUFBQSxpQkEwQnVCLEtBMUJ2QjtBQUFBLGlCQTBCNkIsT0ExQjdCO0FBQUEsaUJBMEJxQyxPQTFCckM7QUFBQSxpQkEwQjZDLFVBMUI3QztBQUFBLGlCQTBCd0QsU0ExQnhEO0FBQUEsaUJBMEJrRSxXQTFCbEU7QUFBQSxpQkEwQjhFLEtBMUI5RTtBQUFBLGlCQTBCb0YsT0ExQnBGO0FBQUEsaUJBMEI0RixNQTFCNUY7QUFBQSxpQkEyQlMsSUEzQlQ7QUFBQSxpQkEyQmMsU0EzQmQ7QUFBQSxpQkEyQndCLE1BM0J4QjtBQUFBLGlCQTJCK0IsTUEzQi9CO0FBQUEsaUJBMkJzQyxNQTNCdEM7QUFBQSxpQkEyQjZDLE1BM0I3QztBQUFBLGlCQTJCb0QsT0EzQnBEO0FBQUEsaUJBMkI0RCxRQTNCNUQ7QUFBQSxpQkEyQnFFLGNBM0JyRTtBQUFBLGlCQTRCUyxNQTVCVDtBQUFBLGlCQTRCZ0IsT0E1QmhCO0FBQUEsaUJBNEJ3QixRQTVCeEI7NkJBNEJrRCxNQUFBLENBQU8sVUFBUDtBQUExQjtBQTVCeEIsaUJBNkJTLFlBN0JUO0FBOEJRLHdCQUFPLEtBQVA7QUFBQSx5QkFDUyxTQURUO3FDQUN3QixNQUFBLENBQU8sSUFBUDtBQUFmO0FBRFQ7cUNBRVMsTUFBQSxDQUFPLFdBQVA7QUFGVDtBQURDO0FBN0JUO2dCQWtDUSxLQUFBLENBQU0sR0FBQSxHQUFJLEdBQUosR0FBUSxHQUFkOzZCQUVBLE1BQUEsQ0FBTyxJQUFQO0FBcENSO0FBYko7O0FBSFk7O0FBc0RoQixPQUFBLEdBQVUsU0FBQTtXQUFHLFNBQUEsQ0FBVSxFQUFBLEdBQUcsTUFBTSxDQUFDLE9BQXBCO0FBQUg7O0FBQ1YsS0FBQSxHQUFVLFNBQUE7QUFFTixRQUFBO0lBQUEsS0FBQSxHQUFRLENBQUcsQ0FBQyxJQUFBLENBQUssUUFBTCxDQUFELENBQUEsR0FBZSxHQUFmLEdBQWlCLENBQUMsTUFBQSxDQUFPLFFBQVAsQ0FBRCxDQUFqQixHQUFrQyxHQUFsQyxHQUFvQyxDQUFDLElBQUEsQ0FBSyxXQUFMLENBQUQsQ0FBcEMsR0FBc0Qsa0JBQXRELEdBQXVFLENBQUMsSUFBQSxDQUFLLFdBQUwsQ0FBRCxDQUF2RSxHQUF5RixJQUE1RjtJQUVSLEtBQUEsR0FBUSxRQUFRLENBQUMsR0FBVCxDQUFhLFNBQUMsSUFBRDtBQUNqQixZQUFBO1FBQUMsZUFBRCxFQUFRLGNBQVIsRUFBYztRQUNkLFFBQUEsR0FBVyxJQUFJLENBQUMsS0FBTCxDQUFXLGdCQUFYLENBQTZCLENBQUEsQ0FBQTtRQUN4QyxNQUFBLEdBQWMsS0FBSCxHQUFjLElBQUEsQ0FBSyxLQUFNLENBQUEsQ0FBQSxDQUFYLENBQUEsR0FBaUIsSUFBQSxDQUFLLElBQUEsQ0FBSyxLQUFNLFNBQVgsQ0FBTCxDQUFqQixHQUEwQyxJQUF4RCxHQUFrRTtRQUM3RSxLQUFBLEdBQVcsR0FBQSxDQUFJLElBQUosRUFBVSxFQUFWO1FBQ1gsS0FBQSxHQUFXLElBQUEsQ0FBSyxLQUFNLFlBQVgsQ0FBQSxHQUFvQixJQUFBLENBQUssS0FBQSxDQUFNLEtBQU0sU0FBSSxDQUFDLEtBQVgsQ0FBaUIsR0FBakIsQ0FBc0IsQ0FBQSxDQUFBLENBQTVCLENBQUwsQ0FBcEIsR0FBNEQsR0FBNUQsR0FBa0UsSUFBQSxDQUFLLFVBQUEsQ0FBVyxLQUFNLFNBQUksQ0FBQyxLQUFYLENBQWlCLEdBQWpCLENBQXNCLFNBQUksQ0FBQyxJQUEzQixDQUFnQyxHQUFoQyxDQUFYLENBQUw7ZUFDN0UsS0FBSyxDQUFDLElBQU4sQ0FBVyxNQUFBLEdBQVMsTUFBVCxHQUFrQixLQUFsQixHQUEwQixJQUFBLENBQUssV0FBTCxDQUFyQztJQU5pQixDQUFiO0lBUVIsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFBLENBQUssb0VBQUwsQ0FBWDtXQUFvRixPQUFBLENBRXBGLEdBRm9GLENBRWhGLElBQUEsR0FBSSxDQUFFLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWCxDQUFGLENBQUosR0FBd0IsSUFGd0Q7QUFaOUUiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICBcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiMjI1xuXG4jIGhhbmRsZSB2YXJpb3VzIHRhc2tzOiBcbiNcbiMgICAtIGNvbXBpbGUgYW5kIHNhdmUgaW50byBgLmpzYCBmaWxlcyBcbiMgICAtIGNvbXBpbGUgYW5kIHByaW50IHRvIHN0ZG91dCBcbiMgICAtIHJlY29tcGlsZSBpZiB0aGUgc291cmNlIGNoYW5nZXNcbiMgICAtIHByaW50IGxleGVyIHRva2Vuc1xuIyAgIC0gcHJpbnQgYSBzeW50YXggdHJlZVxuIyAgIC0gbGF1bmNoIGEgUkVQTFxuXG5mcyAgICAgICAgICAgICAgID0gcmVxdWlyZSAnZnMnXG5wYXRoICAgICAgICAgICAgID0gcmVxdWlyZSAncGF0aCdcbm5vcHQgICAgICAgICAgICAgPSByZXF1aXJlICdub3B0J1xuaGVscGVycyAgICAgICAgICA9IHJlcXVpcmUgJy4vaGVscGVycydcbktvZmZlZSAgICAgICAgICAgPSByZXF1aXJlICcuL2tvZmZlZSdcbnsgc3Bhd24sIGV4ZWMgfSAgPSByZXF1aXJlICdjaGlsZF9wcm9jZXNzJ1xueyBFdmVudEVtaXR0ZXIgfSA9IHJlcXVpcmUgJ2V2ZW50cydcblxudXNlV2luUGF0aFNlcCAgICA9IHBhdGguc2VwIGlzICdcXFxcJ1xuXG5oZWxwZXJzLmV4dGVuZCBLb2ZmZWUsIG5ldyBFdmVudEVtaXR0ZXIgIyBBbGxvdyBlbWl0dGluZyBOb2RlIGV2ZW50c1xuXG57IEZFQVRVUkVTLCBsb2dGZWF0dXJlcyB9ID0gcmVxdWlyZSAnLi9mZWF0dXJlcydcblxueyBiYXNlRmlsZU5hbWUsIGlzQ29mZmVlLCBzdHJpbmdpZnksIG1lcmdlLCBwYWQgfSA9IGhlbHBlcnNcbnsgXG4gICAgZGltLCAgICBib2xkLCBcbiAgICByZWQsICAgIHJlZEJyaWdodCxcbiAgICBncmF5LCAgIGdyYXlCcmlnaHQsIFxuICAgIHllbGxvdywgeWVsbG93QnJpZ2h0LFxuICAgIGdyZWVuLCAgZ3JlZW5CcmlnaHQsXG4gICAgd2hpdGUsICB3aGl0ZUJyaWdodCwgXG4gICAgYmx1ZSwgICBibHVlQnJpZ2h0LCBcbiAgICBjeWFuLCAgIGN5YW5CcmlnaHQsXG4gICAgbWFnZW50YSwgbWFnZW50YUJyaWdodCxcbn0gPSByZXF1aXJlICdjb2xvcmV0dGUnXG5cbmVycm9yICAgICA9IGNvbnNvbGUuZXJyb3JcbnByaW50ICAgICA9IChsaW5lKSAtPiBwcm9jZXNzLnN0ZG91dC53cml0ZSBsaW5lXG5wcmludExpbmUgPSAobGluZSkgLT4gcHJvY2Vzcy5zdGRvdXQud3JpdGUgbGluZSArICdcXG4nICMgPz8/XG5wcmludFdhcm4gPSAobGluZSkgLT4gcHJvY2Vzcy5zdGRlcnIud3JpdGUgbGluZSArICdcXG4nICMgPz8/XG5oaWRkZW4gICAgPSAoZmlsZSkgLT4gL15cXC58fiQvLnRlc3QgZmlsZVxuXG5TV0lUQ0hFUyA9IFtcbiAgICBbJy1iJyAnLS1iYXJlJyAgICAgICAgICAgICAgJ2NvbXBpbGUgd2l0aG91dCBhIHRvcC1sZXZlbCBmdW5jdGlvbiB3cmFwcGVyJyAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctYycgJy0tY29tcGlsZScgICAgICAgICAgICdjb21waWxlIHRvIEphdmFTY3JpcHQgYW5kIHNhdmUgYXMgLmpzIGZpbGVzJyAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLWUnICctLWV2YWwgU1RSSU5HJyAgICAgICAnZXZhbHVhdGUgYSBzdHJpbmcgYW5kIHByaW50IHRoZSByZXN1bHQnICAgICAgICAgICAgICAgW1N0cmluZywgQXJyYXldIF1cbiAgICBbJy1mJyAnLS1mZWF0dXJlcycgICAgICAgICAgJ2xpc3QgYXZhaWxhYmxlIGZlYXR1cmVzJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWycnICAgJy0tbm8tYGZlYXR1cmUnICAgICAgICdkaXNhYmxlIGEgZmVhdHVyZSwgZS5nLiAtLW5vLW5lZ2F0aXZlLWluZGV4JyAgICAgICAgICAgbnVsbCAgICAgICAgICAgXVxuICAgIFsnLWgnICctLWhlbHAnICAgICAgICAgICAgICAnZGlzcGxheSB0aGlzIGhlbHAgbWVzc2FnZScgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1qJyAnLS1qcycgICAgICAgICAgICAgICAgJ3ByaW50IG91dCB0aGUgY29tcGlsZWQgSmF2YVNjcmlwdCcgICAgICAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctbScgJy0tbWFwJyAgICAgICAgICAgICAgICdnZW5lcmF0ZSBzb3VyY2UgbWFwIGFuZCBzYXZlIGFzIC5qcy5tYXAgZmlsZXMnICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLU0nICctLWlubGluZS1tYXAnICAgICAgICAnZ2VuZXJhdGUgc291cmNlIG1hcCBhbmQgaW5jbHVkZSBpdCBkaXJlY3RseSBpbiBvdXRwdXQnIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1uJyAnLS1ub29wJyAgICAgICAgICAgICAgJ2RvZXMgbm90aGluZywgZm9yIGRlYnVnZ2luZyBwdXJwb3NlcycgICAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctbycgJy0tb3V0cHV0IERJUicgICAgICAgICdzZXQgdGhlIG91dHB1dCBkaXJlY3RvcnkgZm9yIGNvbXBpbGVkIEphdmFTY3JpcHQnICAgICAgU3RyaW5nICAgICAgICAgXVxuICAgIFsnLVAnICctLXBhcnNlJyAgICAgICAgICAgICAncHJpbnQgb3V0IHRoZSBwYXJzZSB0cmVlIHRoYXQgdGhlIHBhcnNlciBwcm9kdWNlcycgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1yJyAnLS1yZXF1aXJlIE1PRFVMRScgICAgJ3JlcXVpcmUgdGhlIGdpdmVuIG1vZHVsZSBiZWZvcmUgZXZhbCBvciBSRVBMJyAgICAgICAgIFtTdHJpbmcsIEFycmF5XSBdXG4gICAgWyctUicgJy0tcmV3cml0ZXInICAgICAgICAgICdwcmludCBvdXQgdGhlIGNvZGUgdGhhdCB0aGUgcmV3cml0ZXIgcHJvZHVjZXMnICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLXMnICctLXN0ZGlvJyAgICAgICAgICAgICAnbGlzdGVuIGZvciBhbmQgY29tcGlsZSBzY3JpcHRzIG92ZXIgc3RkaW8nICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy10JyAnLS10ZXN0JyAgICAgICAgICAgICAgJ2NvbXBpbGUgYW5kIHJ1biB0aGUgQHRlc3QgY29kZScgICAgICAgICAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctVCcgJy0tdG9rZW5zJyAgICAgICAgICAgICdwcmludCBvdXQgdGhlIHRva2VucyB0aGF0IHRoZSBsZXhlci9yZXdyaXRlciBwcm9kdWNlJyAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLXYnICctLXZlcnNpb24nICAgICAgICAgICAnZGlzcGxheSB0aGUgdmVyc2lvbiBudW1iZXInICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy13JyAnLS13YXRjaCcgICAgICAgICAgICAgJ3dhdGNoIHNjcmlwdHMgZm9yIGNoYW5nZXMgYW5kIHJlcnVuIGNvbW1hbmRzJyAgICAgICAgICBCb29sZWFuICAgICAgICBdXG5dXG5cbm9wdHMgPSB7fVxuXG4jICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICBcbiMgIDAwMDAwMDAgICAwMDAgICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuXG5wYXJzZU9wdGlvbnMgPSAtPlxuXG4gICAga25vd24gPSBEZWJ1ZzpCb29sZWFuXG4gICAgc2hvcnQgPSBEOictLURlYnVnJyBwOictLWpzJ1xuICAgIFNXSVRDSEVTLm1hcCAocykgLT4gbCA9IHNbMV0uc3BsaXQoJyAnKVswXVsyLi5dOyBrbm93bltsXSA9IHNbM10gaWYgc1szXTsgc2hvcnRbc1swXVsxXV0gPSBcIi0tI3tsfVwiIGlmIHNbMF0hPScnXG4gICAgRkVBVFVSRVMubWFwIChmKSAtPiBrbm93bltmLmxhZ10gPSBCb29sZWFuXG4gICAgXG4gICAgbyA9IG9wdHMgPSBub3B0IGtub3duLCBzaG9ydFxuICAgICAgICBcbiAgICBvLmNvbXBpbGUgIG9yPSAhIW8ub3V0cHV0XG4gICAgby5hcmd1bWVudHMgID0gby5hcmd2LnJlbWFpblxuICAgIG8ucHJlbHVkZSAgICA9IG1ha2VQcmVsdWRlIG8ucmVxdWlyZSBpZiBvLnJlcXVpcmVcbiAgICBvLnJ1biAgICAgICAgPSBub3QgKG8uY29tcGlsZSBvciBvLmpzIG9yIG8ubWFwIG9yIG8udG9rZW5zIG9yIG8ucGFyc2UpXG4gICAgby5qcyAgICAgICAgID0gISEoby5qcyBvciBvLmV2YWwgb3Igby5zdGRpbyBhbmQgby5jb21waWxlKSAjIGpzIG91dHB1dCBpcyBwYXNzZWQgdG8gZXZhbCBhbmQgc3RkaW8gY29tcGlsZVxuICAgIFxuICAgIG8uZmVhdHVyZSA9IHt9XG4gICAgRkVBVFVSRVMubWFwIChmKSAtPiBvLmZlYXR1cmVbZi5rZXldID0gb1tmLmZsYWddID8gdHJ1ZTsgZGVsZXRlIG9bZi5mbGFnXVxuICAgIFxuICAgIGlmIG8uRGVidWdcbiAgICAgICAgZGVsZXRlIG8uYXJndlxuICAgICAgICBsb2cgc3RyaW5naWZ5IG9cblxuIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4jIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG5cbnJ1biA9IC0+XG4gICAgXG4gICAgcGFyc2VPcHRpb25zKClcbiAgICAgICAgXG4gICAgcmV0dXJuIGxvZ0ZlYXR1cmVzKCkgIGlmIG9wdHMuZmVhdHVyZXNcbiAgICByZXR1cm4gdXNhZ2UoKSAgICAgICAgaWYgb3B0cy5oZWxwXG4gICAgcmV0dXJuIHZlcnNpb24oKSAgICAgIGlmIG9wdHMudmVyc2lvblxuICAgIHJldHVybiBzdGFydFJlcGwoKSAgICBpZiBvcHRzLmludGVyYWN0aXZlXG4gICAgcmV0dXJuIGNvbXBpbGVTdGRpbygpIGlmIG9wdHMuc3RkaW9cbiAgICBpZiBvcHRzLmV2YWxcbiAgICAgICAgZm9yIGV2YWwgaW4gb3B0cy5ldmFsXG4gICAgICAgICAgICBjb21waWxlU2NyaXB0IGV2YWxcbiAgICAgICAgcmV0dXJuXG4gICAgcmV0dXJuIHN0YXJ0UmVwbCgpICAgIGlmIG5vdCBvcHRzLmFyZ3VtZW50cy5sZW5ndGhcbiAgICBcbiAgICBsaXRlcmFscyA9IGlmIG5vdCBvcHRzLndhdGNoIGFuZCBub3Qgb3B0cy5jb21waWxlIHRoZW4gb3B0cy5hcmd1bWVudHMuc3BsaWNlIDEgZWxzZSBbXVxuICAgIFxuICAgIHByb2Nlc3MuYXJndiA9IHByb2Nlc3MuYXJndlswLi4xXS5jb25jYXQgbGl0ZXJhbHNcbiAgICBwcm9jZXNzLmFyZ3ZbMF0gPSAna29mZmVlJ1xuXG4gICAgb3B0cy5vdXRwdXQgPSBwYXRoLnJlc29sdmUgb3B0cy5vdXRwdXQgaWYgb3B0cy5vdXRwdXRcbiAgICBmb3Igc291cmNlIGluIG9wdHMuYXJndW1lbnRzXG4gICAgICAgIHNvdXJjZSA9IHBhdGgucmVzb2x2ZSBzb3VyY2VcbiAgICAgICAgXG4gICAgICAgIGlmIG9wdHMud2F0Y2hcbiAgICAgICAgICAgIHdhdGNoUGF0aCBzb3VyY2VcbiAgICAgICAgZWxzZSAgICAgXG4gICAgICAgICAgICBjb21waWxlUGF0aCBzb3VyY2UsIHRvcExldmVsOnllc1xuXG5leHBvcnRzLnJ1biA9IHJ1blxuICAgICAgICBcbnN0YXJ0UmVwbCA9IC0+XG4gICAgXG4gICAgIyBNYWtlIHRoZSBSRVBMIHVzZSB0aGUgZ2xvYmFsIGNvbnRleHQgc28gYXMgdG8gXG4gICAgIyAgIChhKSBiZSBjb25zaXN0ZW50IHdpdGggdGhlIGBub2RlYCBSRVBMIGFuZCwgdGhlcmVmb3JlLCBcbiAgICAjICAgKGIpIG1ha2UgcGFja2FnZXMgdGhhdCBtb2RpZnkgbmF0aXZlIHByb3RvdHlwZXMgKHN1Y2ggYXMgJ2NvbG9ycycgYW5kICdzdWdhcicpIHdvcmsgYXMgZXhwZWN0ZWQuXG4gICAgXG4gICAgcmVwbENsaU9wdHMgPSB1c2VHbG9iYWw6IHllc1xuICAgIHJlcGxDbGlPcHRzLnByZWx1ZGUgPSBvcHRzLnByZWx1ZGVcbiAgICByZXF1aXJlKCcuL3JlcGwnKS5zdGFydCByZXBsQ2xpT3B0c1xuXG5tYWtlUHJlbHVkZSA9IChyZXF1aXJlcykgLT5cbiAgICBcbiAgICByZXF1aXJlcy5tYXAgKG1vZHVsZSkgLT5cbiAgICAgICAgW18sIG5hbWUsIG1vZHVsZV0gPSBtYXRjaCBpZiBtYXRjaCA9IG1vZHVsZS5tYXRjaCgvXiguKik9KC4qKSQvKVxuICAgICAgICBuYW1lIHx8PSBiYXNlRmlsZU5hbWUgbW9kdWxlLCB5ZXMsIHVzZVdpblBhdGhTZXBcbiAgICAgICAgXCIje25hbWV9ID0gcmVxdWlyZSgnI3ttb2R1bGV9JylcIlxuICAgIC5qb2luICc7J1xuXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuXG4jIENvbXBpbGUgYSBzY3JpcHQgb3IgYSBkaXJlY3RvcnkuIElmIGEgZGlyZWN0b3J5IGlzIHBhc3NlZCwgcmVjdXJzaXZlbHkgY29tcGlsZSBhbGwgJy5jb2ZmZWUnIGFuZCAnLmtvZmZlZScgZmlsZXMuXG5cbmNvbXBpbGVQYXRoID0gKHNvdXJjZSwgdG9wTGV2ZWw6dG9wTGV2ZWw9bm8pIC0+XG5cbiAgICByZXR1cm4gaWYgbm90IHRvcExldmVsIGFuZCBoaWRkZW4gc291cmNlXG4gICAgICAgICAgICAgIFxuICAgIHRyeVxuICAgICAgICBzdGF0cyA9IGZzLnN0YXRTeW5jIHNvdXJjZVxuICAgIGNhdGNoIGVyclxuICAgICAgICBpZiBlcnIuY29kZSBpcyAnRU5PRU5UJ1xuICAgICAgICAgICAgZXJyb3IgXCJDb21tYW5kLmNvbXBpbGVQYXRoIGNhbid0IHN0YXQgJyN7c291cmNlfSdcIlxuICAgICAgICAgICAgcHJvY2Vzcy5leGl0IDFcbiAgICAgICAgdGhyb3cgZXJyXG4gICAgICAgIFxuICAgIGlmIHN0YXRzLmlzRGlyZWN0b3J5KClcbiAgICAgICAgXG4gICAgICAgIGlmIHBhdGguYmFzZW5hbWUoc291cmNlKSBpbiBbJ25vZGVfbW9kdWxlcycgJy5naXQnXVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgb3B0cy5ydW5cbiAgICAgICAgICAgIGNvbXBpbGVQYXRoIGZpbmREaXJlY3RvcnlJbmRleChzb3VyY2UpLCB0b3BMZXZlbDp0b3BMZXZlbFxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgIFxuICAgICAgICBsb2cgJ0NvbW1hbmQuY29tcGlsZVBhdGggZGlyOicsIHNvdXJjZSBpZiBvcHRzLkRlYnVnXG4gICAgICAgIFxuICAgICAgICB0cnlcbiAgICAgICAgICAgIGZpbGVzID0gZnMucmVhZGRpclN5bmMgc291cmNlXG4gICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgaWYgZXJyLmNvZGUgaXMgJ0VOT0VOVCcgdGhlbiByZXR1cm4gXG4gICAgICAgICAgICB0aHJvdyBlcnJcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgZmlsZSBpbiBmaWxlc1xuICAgICAgICAgICAgY29tcGlsZVBhdGggcGF0aC5qb2luIHNvdXJjZSwgZmlsZVxuICAgICAgICAgICAgXG4gICAgZWxzZSBpZiB0b3BMZXZlbCBvciBpc0NvZmZlZSBzb3VyY2VcbiAgICAgICAgXG4gICAgICAgIHRyeVxuICAgICAgICAgICAgY29kZSA9IGZzLnJlYWRGaWxlU3luYyBzb3VyY2VcbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICBpZiBlcnIuY29kZSBpcyAnRU5PRU5UJyB0aGVuIHJldHVyblxuICAgICAgICAgICAgdGhyb3cgZXJyXG4gICAgICAgIFxuICAgICAgICBsb2cgJ0NvbW1hbmQuY29tcGlsZVBhdGggZmlsZTonLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuICAgICAgICAgICAgXG4gICAgICAgIGNvbXBpbGVTY3JpcHQgY29kZS50b1N0cmluZygpLCBzb3VyY2VcbiAgICAgICAgXG5maW5kRGlyZWN0b3J5SW5kZXggPSAoc291cmNlKSAtPlxuXG4gICAgZm9yIGV4dCBpbiBLb2ZmZWUuRklMRV9FWFRFTlNJT05TXG4gICAgICAgIGluZGV4ID0gcGF0aC5qb2luIHNvdXJjZSwgXCJpbmRleCN7ZXh0fVwiXG4gICAgICAgIHRyeVxuICAgICAgICAgICAgcmV0dXJuIGluZGV4IGlmIChmcy5zdGF0U3luYyBpbmRleCkuaXNGaWxlKClcbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICB0aHJvdyBlcnIgdW5sZXNzIGVyci5jb2RlIGlzICdFTk9FTlQnXG4gICAgZXJyb3IgXCJNaXNzaW5nIGluZGV4LmNvZmZlZSBpbiAje3NvdXJjZX1cIlxuICAgIHByb2Nlc3MuZXhpdCAxXG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAgICAgMDAwICAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAgMDAwICAgICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAgMDAwICAgICBcblxuIyBDb21waWxlIGEgc2luZ2xlIHNvdXJjZSBzY3JpcHQsIGNvbnRhaW5pbmcgdGhlIGdpdmVuIGNvZGUsIGFjY29yZGluZyB0byB0aGUgcmVxdWVzdGVkIG9wdGlvbnMuIFxuIyBJZiBldmFsdWF0aW5nIHRoZSBzY3JpcHQgZGlyZWN0bHkgc2V0cyBgX19maWxlbmFtZWAsIGBfX2Rpcm5hbWVgIGFuZCBgbW9kdWxlLmZpbGVuYW1lYCB0byBiZSBjb3JyZWN0IHJlbGF0aXZlIHRvIHRoZSBzY3JpcHQncyBwYXRoLlxuXG5jb21waWxlU2NyaXB0ID0gKGNvZGUsIHNvdXJjZSA9IG51bGwpIC0+XG4gICAgXG4gICAgbyA9IG9wdHNcbiAgICBvcHRpb25zID0gY29tcGlsZU9wdGlvbnMgc291cmNlXG4gICAgXG4gICAgdHJ5XG4gICAgICAgIHQgPSB0YXNrID0ge3NvdXJjZSwgY29kZSwgb3B0aW9uc31cbiAgICAgICAgS29mZmVlLmVtaXQgJ2NvbXBpbGUnLCB0YXNrXG4gICAgICAgIGlmIG8udG9rZW5zXG4gICAgICAgICAgICBwcmludFRva2VucyBLb2ZmZWUudG9rZW5zIHQuY29kZSwgdC5vcHRpb25zXG4gICAgICAgIGVsc2UgaWYgby5yZXdyaXRlclxuICAgICAgICAgICAgcHJpbnRSZXdyaXRlciBLb2ZmZWUudG9rZW5zIHQuY29kZSwgdC5vcHRpb25zXG4gICAgICAgIGVsc2UgaWYgby5wYXJzZVxuICAgICAgICAgICAgcHJpbnRMaW5lIEtvZmZlZS5ub2Rlcyh0LmNvZGUsIHQub3B0aW9ucykudG9TdHJpbmcoKS50cmltKClcbiAgICAgICAgZWxzZSBpZiBvLnJ1blxuICAgICAgICAgICAgS29mZmVlLnJlZ2lzdGVyKClcbiAgICAgICAgICAgIEtvZmZlZS5ldmFsIG9wdHMucHJlbHVkZSwgdC5vcHRpb25zIGlmIG9wdHMucHJlbHVkZVxuICAgICAgICAgICAgdC5vcHRpb25zLmZpbGVuYW1lID89IG9wdGlvbnMuc291cmNlXG4gICAgICAgICAgICBpZiBvcHRzLm5vb3AgdGhlbiBsb2cgXCJub29wIHJ1biAje3NvdXJjZX1cIlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEtvZmZlZS5ydW4gdC5jb2RlLCB0Lm9wdGlvbnNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgY29tcGlsZWQgPSBLb2ZmZWUuY29tcGlsZSB0LmNvZGUsIHQub3B0aW9uc1xuICAgICAgICAgICAgdC5vdXRwdXQgPSBjb21waWxlZFxuICAgICAgICAgICAgaWYgby5tYXBcbiAgICAgICAgICAgICAgICB0Lm91dHB1dCA9IGNvbXBpbGVkLmpzXG4gICAgICAgICAgICAgICAgdC5zb3VyY2VNYXAgPSBjb21waWxlZC52M1NvdXJjZU1hcFxuXG4gICAgICAgICAgICBLb2ZmZWUuZW1pdCAnc3VjY2VzcycsIHRhc2tcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgby5qc1xuICAgICAgICAgICAgICAgIGlmIG9wdHMubm9vcCB0aGVuIGxvZyBcIm5vb3AganMgI3tzb3VyY2V9XCJcbiAgICAgICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgICAgICBwcmludExpbmUgdC5vdXRwdXQudHJpbSgpXG4gICAgICAgICAgICBlbHNlIGlmIG8uY29tcGlsZSBvciBvLm1hcFxuICAgICAgICAgICAgICAgIGlmIG9wdHMubm9vcCB0aGVuIGxvZyBcIm5vb3Agd3JpdGUgI3tvcHRpb25zLmpzUGF0aH1cIlxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVKcyB0LnNvdXJjZSwgdC5vdXRwdXQsIG9wdGlvbnMuanNQYXRoLCB0LnNvdXJjZU1hcFxuICAgIGNhdGNoIGVyclxuICAgICAgICBcbiAgICAgICAgS29mZmVlLmVtaXQgJ2ZhaWx1cmUnLCBlcnIsIHRhc2tcbiAgICAgICAgcmV0dXJuIGlmIEtvZmZlZS5saXN0ZW5lcnMoJ2ZhaWx1cmUnKS5sZW5ndGhcbiAgICAgICAgbWVzc2FnZSA9IGVycj8uc3RhY2sgb3IgXCIje2Vycn1cIlxuICAgICAgICBpZiBvLndhdGNoXG4gICAgICAgICAgICBwcmludExpbmUgbWVzc2FnZSArICdcXHgwNydcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcHJpbnRXYXJuIG1lc3NhZ2VcbiAgICAgICAgICAgIHByb2Nlc3MuZXhpdCAxXG5cbmNvbXBpbGVPcHRpb25zID0gKHNvdXJjZSkgLT4gIyBUaGUgY29tcGlsZS10aW1lIG9wdGlvbnMgdG8gcGFzcyB0byB0aGUgY29tcGlsZXIuXG4gICAgXG4gICAgY29wdHMgPSAgICAgICAgIFxuICAgICAgICBzb3VyY2U6ICAgIHNvdXJjZVxuICAgICAgICBzb3VyY2VNYXA6IG9wdHMubWFwXG4gICAgICAgIGlubGluZU1hcDogb3B0c1snaW5saW5lLW1hcCddXG4gICAgICAgIGZlYXR1cmU6ICAgb3B0cy5mZWF0dXJlXG4gICAgICAgIGJhcmU6ICAgICAgb3B0cy5iYXJlXG4gICAgICAgIHRlc3Q6ICAgICAgb3B0cy50ZXN0XG4gICAgICAgIERlYnVnOiAgICAgb3B0cy5EZWJ1Z1xuXG4gICAgaWYgc291cmNlXG4gICAgICAgIFxuICAgICAgICBjd2QgPSBwcm9jZXNzLmN3ZCgpXG4gICAgICAgIGpzUGF0aCA9IG91dHB1dFBhdGggc291cmNlLCAnLmpzJ1xuICAgICAgICBqc0RpciA9IHBhdGguZGlybmFtZSBqc1BhdGhcbiAgICAgICAgY29wdHMgPSBtZXJnZSBjb3B0cywge1xuICAgICAgICAgICAganNQYXRoXG4gICAgICAgICAgICBzb3VyY2VSb290OiBwYXRoLnJlbGF0aXZlIGpzRGlyLCBjd2RcbiAgICAgICAgICAgIHNvdXJjZUZpbGVzOiBbcGF0aC5yZWxhdGl2ZSBjd2QsIHNvdXJjZV1cbiAgICAgICAgICAgIGdlbmVyYXRlZEZpbGU6IGJhc2VGaWxlTmFtZShqc1BhdGgsIG5vLCB1c2VXaW5QYXRoU2VwKVxuICAgICAgICB9XG4gICAgY29wdHNcbiAgICAgICAgICAgIFxuIyBBdHRhY2ggdGhlIGFwcHJvcHJpYXRlIGxpc3RlbmVycyB0byBjb21waWxlIHNjcmlwdHMgaW5jb21pbmcgb3ZlciAqKnN0ZGluKiosIGFuZCB3cml0ZSB0aGVtIGJhY2sgdG8gKipzdGRvdXQqKi5cblxuY29tcGlsZVN0ZGlvID0gLT5cbiAgICBcbiAgICBidWZmZXJzID0gW11cbiAgICBzdGRpbiA9IHByb2Nlc3Mub3BlblN0ZGluKClcbiAgICBzdGRpbi5vbiAnZGF0YScsIChidWZmZXIpIC0+XG4gICAgICAgIGJ1ZmZlcnMucHVzaCBidWZmZXIgaWYgYnVmZmVyXG4gICAgc3RkaW4ub24gJ2VuZCcsIC0+XG4gICAgICAgIGNvbXBpbGVTY3JpcHQgQnVmZmVyLmNvbmNhdChidWZmZXJzKS50b1N0cmluZygpXG5cbiMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuIyAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMDAwMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4jIDAwICAgICAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuXG53YXRjaFBhdGggPSAoc291cmNlKSAtPiAjIFdhdGNoIGEgZmlsZSBvciBkaXJlY3RvcnkuXG4gICAgXG4gICAgdHJ5XG4gICAgICAgIHN0YXRzID0gZnMuc3RhdFN5bmMgc291cmNlXG4gICAgY2F0Y2ggZXJyXG4gICAgICAgIHJldHVybiBpZiBlcnIuY29kZSBpcyAnRU5PRU5UJ1xuICAgICAgICByZXR1cm4gZXJyb3IgXCJDb21tYW5kLndhdGNoUGF0aCBjYW4ndCBzdGF0ICcje3NvdXJjZX0nXCIsIGVyclxuICAgICAgICAgICAgICAgIFxuICAgIGlmIHN0YXRzLmlzRGlyZWN0b3J5KClcbiAgICAgICAgd2F0Y2hEaXIgc291cmNlXG4gICAgZWxzZVxuICAgICAgICB3YXRjaEZpbGUgc291cmNlXG5cbiMgV2F0Y2ggYSBzaW5nbGUgZmlsZSB1c2luZyBgZnMud2F0Y2hgLCByZWNvbXBpbGluZyBpdCBldmVyeSB0aW1lIHRoZSBmaWxlIGlzIHVwZGF0ZWQuXG4jIE1heSBiZSB1c2VkIGluIGNvbWJpbmF0aW9uIHdpdGggb3RoZXIgb3B0aW9ucywgc3VjaCBhcyBgLS1wcmludGAuXG4gICAgICAgIFxud2F0Y2hGaWxlID0gKHNvdXJjZSkgLT5cbiAgICBcbiAgICByZXR1cm4gaWYgbm90IGlzQ29mZmVlIHNvdXJjZVxuICAgIFxuICAgIGxvZyAnQ29tbWFuZC53YXRjaEZpbGUnLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuICAgIFxuICAgIHdhdGNoZXIgICAgICAgID0gbnVsbFxuICAgIHByZXZTdGF0cyAgICAgID0gbnVsbFxuICAgIGNvbXBpbGVUaW1lb3V0ID0gbnVsbFxuXG4gICAgc3RhcnRXYXRjaGVyID0gLT5cbiAgICAgICAgXG4gICAgICAgIHdhdGNoZXIgPSBmcy53YXRjaCBzb3VyY2VcbiAgICAgICAgLm9uICdjaGFuZ2UnLCAoY2hhbmdlKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gaWYgY2hhbmdlICE9ICdjaGFuZ2UnXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGxvZyAnQ29tbWFuZC53YXRjaEZpbGUnLCBjaGFuZ2UsIHNvdXJjZSBpZiBvcHRzLkRlYnVnXG5cbiAgICAgICAgICAgIGNsZWFyVGltZW91dCBjb21waWxlVGltZW91dFxuICAgICAgICAgICAgY29tcGlsZVRpbWVvdXQgPSB3YWl0IDI1LCAtPlxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGZzLnN0YXQgc291cmNlLCAoZXJyLCBzdGF0cykgLT5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHdhdGNoZXIuY2xvc2UoKSBpZiBlcnI/LmNvZGUgaXMgJ0VOT0VOVCdcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVycm9yIGVyciBpZiBlcnJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlmIHByZXZTdGF0cyBhbmQgc3RhdHMubXRpbWUuZ2V0VGltZSgpIGlzIHByZXZTdGF0cy5tdGltZS5nZXRUaW1lKCkgYW5kIHN0YXRzLnNpemUgaXMgcHJldlN0YXRzLnNpemVcbiAgICAgICAgICAgICAgICAgICAgcHJldlN0YXRzID0gc3RhdHNcbiAgICAgICAgICAgICAgICAgICAgZnMucmVhZEZpbGUgc291cmNlLCAoZXJyLCBjb2RlKSAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVycm9yIGVyciBpZiBlcnJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZyAnQ29tbWFuZC53YXRjaEZpbGUgY29tcGlsZScsIHNvdXJjZSBpZiBvcHRzLkRlYnVnXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21waWxlU2NyaXB0IGNvZGUudG9TdHJpbmcoKSwgc291cmNlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgLm9uICdlcnJvcicsIChlcnIpIC0+XG4gICAgICAgICAgICB0aHJvdyBlcnIgdW5sZXNzIGVyci5jb2RlIGlzICdFUEVSTSdcblxuICAgIHRyeVxuICAgICAgICBzdGFydFdhdGNoZXIoKVxuICAgIGNhdGNoIGVyclxuICAgICAgICBlcnJvciBlcnJcblxud2F0Y2hEaXIgPSAoc291cmNlKSAtPlxuICAgIFxuICAgIGxvZyAnQ29tbWFuZC53YXRjaERpcicsIHNvdXJjZSBpZiBvcHRzLkRlYnVnXG4gICAgXG4gICAgd2F0Y2hlciA9IG51bGxcblxuICAgIHN0YXJ0V2F0Y2hlciA9IC0+XG5cbiAgICAgICAgdHJ5XG4gICAgICAgICAgICBmaWxlcyA9IGZzLnJlYWRkaXJTeW5jIHNvdXJjZVxuICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgIHJldHVybiBpZiBlcnI/LmNvZGUgaXMgJ0VOT0VOVCdcbiAgICAgICAgICAgIHRocm93IGVyclxuICAgICAgICAgICAgXG4gICAgICAgIGZvciBmaWxlIGluIGZpbGVzXG4gICAgICAgICAgICBjb250aW51ZSBpZiBmaWxlWzBdID09ICcuJ1xuICAgICAgICAgICAgY29udGludWUgaWYgZmlsZSBpbiBbJ25vZGVfbW9kdWxlcyddXG4gICAgICAgICAgICB3YXRjaFBhdGggcGF0aC5qb2luIHNvdXJjZSwgZmlsZVxuICAgICAgICBcbiAgICAgICAgd2F0Y2hlciA9IGZzLndhdGNoIHNvdXJjZVxuICAgICAgICAub24gJ2Vycm9yJywgKGVycikgLT5cbiAgICAgICAgICAgIHRocm93IGVyciB1bmxlc3MgZXJyLmNvZGUgaXMgJ0VQRVJNJ1xuICAgICAgICAgICAgd2F0Y2hlci5jbG9zZSgpXG4gICAgICAgIC5vbiAnY2hhbmdlJywgKGNoYW5nZSwgcCkgLT5cbiAgICAgICAgICAgIGlmIGNoYW5nZSA9PSAncmVuYW1lJ1xuICAgICAgICAgICAgICAgIGxvZyAnQ29tbWFuZC53YXRjaERpcicsIGNoYW5nZSwgcGF0aC5qb2luIHNvdXJjZSwgcCBpZiBvcHRzLkRlYnVnXG4gICAgICAgICAgICAgICAgd2F0Y2hQYXRoIHBhdGguam9pbiBzb3VyY2UsIHBcbiAgICAgICAgICAgIFxuICAgIHRyeVxuICAgICAgICBzdGFydFdhdGNoZXIoKVxuICAgIGNhdGNoIGVyclxuICAgICAgICByZXR1cm4gaWYgZXJyLmNvZGUgaXMgJ0VOT0VOVCdcbiAgICAgICAgdGhyb3cgZXJyXG5cbiMgR2V0IHRoZSBjb3JyZXNwb25kaW5nIG91dHB1dCBKYXZhU2NyaXB0IHBhdGggZm9yIGEgc291cmNlIGZpbGUuXG4gICAgXG5vdXRwdXRQYXRoID0gKHNvdXJjZSwgZXh0ZW5zaW9uKSAtPlxuICAgIFxuICAgIGJhc2VuYW1lID0gYmFzZUZpbGVOYW1lIHNvdXJjZSwgeWVzLCB1c2VXaW5QYXRoU2VwXG4gICAgaWYgb3B0cy5vdXRwdXRcbiAgICAgICAgZGlyID0gb3B0cy5vdXRwdXRcbiAgICBlbHNlXG4gICAgICAgIGRpciA9IHBhdGguZGlybmFtZSBzb3VyY2VcbiAgICBwYXRoLmpvaW4gZGlyLCBiYXNlbmFtZSArIGV4dGVuc2lvblxuXG4jIFJlY3Vyc2l2ZWx5IG1rZGlyLCBsaWtlIGBta2RpciAtcGAuXG5cbm1rZGlycCA9IChkaXIsIGZuKSAtPlxuICAgIG1vZGUgPSAwbzc3NyAmIH5wcm9jZXNzLnVtYXNrKClcblxuICAgIGRvIG1rZGlycyA9IChwID0gZGlyLCBmbikgLT5cbiAgICAgICAgZnMuZXhpc3RzIHAsIChleGlzdHMpIC0+XG4gICAgICAgICAgICBpZiBleGlzdHNcbiAgICAgICAgICAgICAgICBmbigpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgbWtkaXJzIHBhdGguZGlybmFtZShwKSwgLT5cbiAgICAgICAgICAgICAgICAgICAgZnMubWtkaXIgcCwgbW9kZSwgKGVycikgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmbiBlcnIgaWYgZXJyXG4gICAgICAgICAgICAgICAgICAgICAgICBmbigpXG5cbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAgMDAwICAgMDAwMDAwMCAgXG4jIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgICAgIDAwMCAgMDAwICAgICAgIFxuIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAgICAgICAwMDAgIDAwMDAwMDAgICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgXG4jIDAwICAgICAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuXG4jIFdyaXRlIG91dCBhIEphdmFTY3JpcHQgc291cmNlIGZpbGUgd2l0aCB0aGUgY29tcGlsZWQgY29kZS4gXG4jIEJ5IGRlZmF1bHQsIGZpbGVzIGFyZSB3cml0dGVuIG91dCBpbiBgY3dkYCBhcyBgLmpzYCBmaWxlcyB3aXRoIHRoZSBzYW1lIG5hbWUsIGJ1dCB0aGUgb3V0cHV0IGRpcmVjdG9yeSBjYW4gYmUgY3VzdG9taXplZCB3aXRoIGAtLW91dHB1dGAuXG4jIElmIGBnZW5lcmF0ZWRTb3VyY2VNYXBgIGlzIHByb3ZpZGVkLCB0aGlzIHdpbGwgd3JpdGUgYSBgLmpzLm1hcGAgZmlsZSBpbnRvIHRoZSBzYW1lIGRpcmVjdG9yeSBhcyB0aGUgYC5qc2AgZmlsZS5cblxud3JpdGVKcyA9IChzb3VyY2UsIGpzLCBqc1BhdGgsIGdlbmVyYXRlZFNvdXJjZU1hcCA9IG51bGwpIC0+XG4gICAgXG4gICAgc291cmNlTWFwUGF0aCA9IG91dHB1dFBhdGggc291cmNlLCAnLmpzLm1hcCdcbiAgICBqc0RpciA9IHBhdGguZGlybmFtZSBqc1BhdGhcbiAgICBjb21waWxlID0gLT5cbiAgICAgICAgaWYgb3B0cy5jb21waWxlXG4gICAgICAgICAgICBqcyA9ICcgJyBpZiBqcy5sZW5ndGggPD0gMFxuICAgICAgICAgICAgaWYgZ2VuZXJhdGVkU291cmNlTWFwIHRoZW4ganMgPSBcIiN7anN9XFxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9I3tiYXNlRmlsZU5hbWUgc291cmNlTWFwUGF0aCwgbm8sIHVzZVdpblBhdGhTZXB9XFxuXCJcbiAgICAgICAgICAgIGZzLndyaXRlRmlsZSBqc1BhdGgsIGpzLCAoZXJyKSAtPlxuICAgICAgICAgICAgICAgIGlmIGVyclxuICAgICAgICAgICAgICAgICAgICBwcmludExpbmUgZXJyLm1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0IDFcbiAgICAgICAgICAgICAgICBlbHNlIGlmIG9wdHMuY29tcGlsZSBhbmQgb3B0cy53YXRjaFxuICAgICAgICAgICAgICAgICAgICB0aW1lTG9nIFwiY29tcGlsZWQgI3tzb3VyY2V9XCJcbiAgICAgICAgaWYgZ2VuZXJhdGVkU291cmNlTWFwXG4gICAgICAgICAgICBmcy53cml0ZUZpbGUgc291cmNlTWFwUGF0aCwgZ2VuZXJhdGVkU291cmNlTWFwLCAoZXJyKSAtPlxuICAgICAgICAgICAgICAgIGlmIGVyclxuICAgICAgICAgICAgICAgICAgICBwcmludExpbmUgXCJDb3VsZCBub3Qgd3JpdGUgc291cmNlIG1hcDogI3tlcnIubWVzc2FnZX1cIlxuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQgMVxuICAgIGZzLmV4aXN0cyBqc0RpciwgKGl0RXhpc3RzKSAtPlxuICAgICAgICBpZiBpdEV4aXN0cyB0aGVuIGNvbXBpbGUoKSBlbHNlIG1rZGlycCBqc0RpciwgY29tcGlsZVxuXG53YWl0ID0gKG1pbGxpc2Vjb25kcywgZnVuYykgLT4gc2V0VGltZW91dCBmdW5jLCBtaWxsaXNlY29uZHMgIyBDb252ZW5pZW5jZSBmb3IgY2xlYW5lciBzZXRUaW1lb3V0cy5cblxudGltZUxvZyA9IChtZXNzYWdlKSAtPiBsb2cgXCIjeyhuZXcgRGF0ZSkudG9Mb2NhbGVUaW1lU3RyaW5nKCl9IC0gI3ttZXNzYWdlfVwiXG5cbiMgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMDAwMDAgICBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgICAwMDAgIFxuIyAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG5cbnByaW50VG9rZW5zID0gKHRva2VucykgLT5cblxuICAgIGZvciBpbmRleCBpbiBbMC4uLnRva2Vucy5sZW5ndGhdXG4gICAgICAgIHRva2VuICA9IHRva2Vuc1tpbmRleF1cbiAgICAgICAgdGFnICAgID0gdG9rZW5bMF1cbiAgICAgICAgdmFsdWUgID0gdG9rZW5bMV0udG9TdHJpbmcoKS5yZXBsYWNlKC9cXG4vLCAnXFxcXG4nKVxuICAgICAgICBjdGFnICAgPSBncmF5IHRhZ1xuICAgICAgICBjdmFsdWUgPSBib2xkIHllbGxvdyB2YWx1ZVxuICAgICAgICBpbmRleCAgPSBncmF5IGRpbSBpbmRleFxuICAgICAgICBpZiB0YWcgPT0gJ1RFUk1JTkFUT1InXG4gICAgICAgICAgICBwcmludCAnXFxuXFxuJ1xuICAgICAgICBlbHNlIGlmIHRhZyA9PSAnSU5ERU5UJ1xuICAgICAgICAgICAgcHJpbnQgZ3JheSBkaW0gJ0lORCAnXG4gICAgICAgIGVsc2UgaWYgdGFnID09ICdPVVRERU5UJ1xuICAgICAgICAgICAgcHJpbnQgZ3JheSBkaW0gJ09VVCAnXG4gICAgICAgIGVsc2UgaWYgdGFnIGluIFsnQ0xBU1MnICdQQVJBTV9TVEFSVCcgJ1BBUkFNX0VORCcgJ05VTEwnXVxuICAgICAgICAgICAgcHJpbnQgXCIje2luZGV4fSN7Y3RhZ30gXCJcbiAgICAgICAgZWxzZSBpZiB0YWcgaXMgdmFsdWVcbiAgICAgICAgICAgIHByaW50IFwiI3tpbmRleH0je2N2YWx1ZX0gXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcHJpbnQgXCIje2luZGV4fSN7Y3RhZ309I3tjdmFsdWV9IFwiXG4gICAgICAgIFxucHJpbnRSZXdyaXRlciA9ICh0b2tlbnMpIC0+XG5cbiAgICBpbmRlbnQgPSAwXG4gICAgZm9yIGluZGV4IGluIFswLi4udG9rZW5zLmxlbmd0aF1cbiAgICAgICAgdG9rZW4gPSB0b2tlbnNbaW5kZXhdXG4gICAgICAgIHRhZyAgID0gdG9rZW5bMF1cbiAgICAgICAgdmFsdWUgPSB0b2tlblsxXVxuICAgICAgICBcbiAgICAgICAgZ3JheURpbSA9IChzKSAtPiBkaW0gZ3JheSBzXG4gICAgICAgIGJsdWVEaW0gPSAocykgLT4gZGltIGJsdWUgc1xuICAgICAgICB5ZWxsb3dEaW0gPSAocykgLT4gZGltIHllbGxvdyBzXG4gICAgICAgIHNwYWNlZCA9IChjb2xvciwgdiktPlxuICAgICAgICAgICAgcHJpbnQgY29sb3IgXCIje3YgPyB2YWx1ZX1cIlxuICAgICAgICAgICAgcHJpbnQgJyAnIGlmIHRva2VuLnNwYWNlZCBhbmQgdG9rZW5zW2luZGV4KzFdWzBdIG5vdCBpbiBbJ0NBTExfU1RBUlQnXVxuXG4gICAgICAgICMgbG9nIHRva2VuXG4gICAgICAgIHN3aXRjaCB0YWcgXG4gICAgICAgICAgICB3aGVuICdURVJNSU5BVE9SJyAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcHJpbnQgXCJcXG4je3BhZCAnJywgaW5kZW50fVwiXG4gICAgICAgICAgICB3aGVuICdJTkRFTlQnICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gaW5kZW50ICs9IDQ7IHByaW50IFwiXFxuI3twYWQgJycsIGluZGVudH1cIlxuICAgICAgICAgICAgd2hlbiAnT1VUREVOVCcgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIGluZGVudCAtPSA0OyBwcmludCBcIlxcbiN7cGFkICcnLCBpbmRlbnR9XCJcbiAgICAgICAgICAgIHdoZW4gJ0hFUkVDT01NRU5UJyAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgZ3JheURpbVxuICAgICAgICAgICAgd2hlbiAnQ0FMTF9TVEFSVCcgJ0NBTExfRU5EJyAgICAgICAgICAgICB0aGVuIHNwYWNlZCBncmF5RGltXG4gICAgICAgICAgICB3aGVuICdVTkFSWScgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGJsdWVCcmlnaHQsICdub3QnXG4gICAgICAgICAgICB3aGVuICcmJicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGJsdWVCcmlnaHQsICdhbmQnXG4gICAgICAgICAgICB3aGVuICd8fCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGJsdWVCcmlnaHQsICdvcidcbiAgICAgICAgICAgIHdoZW4gJ1NUUklORycgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgZ3JlZW5cbiAgICAgICAgICAgIHdoZW4gJ1NUUklOR19TVEFSVCcgJ1NUUklOR19FTkQnICAgICAgICAgdGhlbiBzcGFjZWQgcmVkQnJpZ2h0XG4gICAgICAgICAgICB3aGVuICdQUk9QRVJUWScgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIHllbGxvd1xuICAgICAgICAgICAgd2hlbiAnOicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCB5ZWxsb3dEaW1cbiAgICAgICAgICAgIHdoZW4gJ0AnIFxuICAgICAgICAgICAgICAgIGlmIHRva2Vuc1tpbmRleCsxXVswXSBub3QgaW4gWydNRVRBX0lGJyAnTUVUQV9FTFNFJyAnUE9TVF9NRVRBX0lGJ10gdGhlbiBzcGFjZWQoeWVsbG93RGltKSBlbHNlIHNwYWNlZCBibHVlRGltXG4gICAgICAgICAgICB3aGVuICdNRVRBX0lGJyAnTUVUQV9FTFNFJyAnUE9TVF9NRVRBX0lGJyB0aGVuIHNwYWNlZCBibHVlXG4gICAgICAgICAgICB3aGVuICdOVU1CRVInICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGJsdWVcbiAgICAgICAgICAgIHdoZW4gJ3snJ30nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBpZiBub3QgdG9rZW4uZ2VuZXJhdGVkIHRoZW4gc3BhY2VkIGdyYXlcbiAgICAgICAgICAgIHdoZW4gJz0nICcrJyAnLScgJysrJyAnLS0nICcuLi4nICc6OicgXFxcbiAgICAgICAgICAgICAgICAgJ1snICddJyAneycgJ30nICcuJyAnTUFUSCcgJ1VOQVJZX01BVEgnIFxcXG4gICAgICAgICAgICAgICAgICdJTkRFWF9TVEFSVCcgJ0lOREVYX0VORCcgXFxcbiAgICAgICAgICAgICAgICAgJ0NPTVBBUkUnICdDT01QT1VORF9BU1NJR04nICAgICAgICAgdGhlbiBzcGFjZWQgZ3JheVxuICAgICAgICAgICAgd2hlbiAnLCcgJygnICcpJyAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCBncmF5RGltXG4gICAgICAgICAgICB3aGVuICdQQVJBTV9TVEFSVCcgJ1BBUkFNX0VORCcgJy0+JyAnPT4nIHRoZW4gc3BhY2VkIChzKSAtPiBib2xkIGJsdWUgc1xuICAgICAgICAgICAgd2hlbiAnTlVMTCcgJ1VOREVGSU5FRCcgJ0ZVTkNfRVhJU1QnICc/JyAnPy4nICdCSU4/JyB0aGVuIHNwYWNlZCByZWRcbiAgICAgICAgICAgIHdoZW4gJ1JFR0VYJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgbWFnZW50YVxuICAgICAgICAgICAgd2hlbiAnRk9SJyAnRk9SSU4nICdUUlknICdDQVRDSCcgJ1RIUk9XJyAnUkVMQVRJT04nICdFWFRFTkRTJyAnU1RBVEVNRU5UJyAnT1dOJyAnRk9ST0YnICdMT09QJyBcXFxuICAgICAgICAgICAgICAgICAnSUYnICdQT1NUX0lGJyAnV0hFTicgJ1RIRU4nICdFTFNFJyAnVEhJUycgJ1NVUEVSJyAnU1dJVENIJyAnTEVBRElOR19XSEVOJyBcXFxuICAgICAgICAgICAgICAgICAnQk9PTCcgJ0NMQVNTJyAnUkVUVVJOJyAgICAgICAgICAgICB0aGVuIHNwYWNlZCBibHVlQnJpZ2h0XG4gICAgICAgICAgICB3aGVuICdJREVOVElGSUVSJyBcbiAgICAgICAgICAgICAgICBzd2l0Y2ggdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAncmVxdWlyZScgdGhlbiBzcGFjZWQgZ3JheVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHNwYWNlZCB3aGl0ZUJyaWdodFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHByaW50IFwiPiN7dGFnfTxcIlxuICAgICAgICAgICAgICAgICMgc3BhY2VkIChzKSAtPiBib2xkIGJsdWVCcmlnaHQgc1xuICAgICAgICAgICAgICAgIHNwYWNlZCBjeWFuXG4gICAgICAgICAgICBcbnZlcnNpb24gPSAtPiBwcmludExpbmUgXCIje0tvZmZlZS5WRVJTSU9OfVwiXG51c2FnZSAgID0gLT4gXG5cbiAgICBsaW5lcyA9IFtcIiN7Z3JheSAnVXNhZ2U6J30gI3t5ZWxsb3cgJ2tvZmZlZSd9ICN7Z3JheSAnW29wdGlvbnNdJ30gcGF0aC90by9zY3JpcHQgI3tncmF5ICdbb3B0aW9uc10nfVxcblwiXVxuICAgIFxuICAgIHJ1bGVzID0gU1dJVENIRVMubWFwIChydWxlKSAtPlxuICAgICAgICBbc2hvcnQsIGxvbmcsIGRlc2NyaXB0aW9uXSA9IHJ1bGVcbiAgICAgICAgbG9uZ0ZsYWcgPSBsb25nLm1hdGNoKC9eKC0tXFx3W1xcd1xcLV0qKS8pWzFdXG4gICAgICAgIGNzaG9ydCAgID0gaWYgc2hvcnQgdGhlbiBncmF5KHNob3J0WzBdKSArIGJvbGQoZ3JheShzaG9ydFsxLi5dKSkgKyAnICAnIGVsc2UgJyAgICAnXG4gICAgICAgIGNsb25nICAgID0gcGFkIGxvbmcsIDIwXG4gICAgICAgIGNsb25nICAgID0gZ3JheShjbG9uZ1swLi4xXSkgKyBib2xkKHdoaXRlKGNsb25nWzIuLl0uc3BsaXQoJyAnKVswXSkpICsgJyAnICsgYm9sZChibHVlQnJpZ2h0KGNsb25nWzIuLl0uc3BsaXQoJyAnKVsxLi5dLmpvaW4oJyAnKSkpXG4gICAgICAgIGxpbmVzLnB1c2ggJyAgICAnICsgY3Nob3J0ICsgY2xvbmcgKyBncmF5IGRlc2NyaXB0aW9uXG4gICAgICAgIFxuICAgIGxpbmVzLnB1c2ggZ3JheSAnXFxuSWYgY2FsbGVkIHdpdGhvdXQgYSBzY3JpcHQsIHRoZSBpbnRlcmFjdGl2ZSBSRVBMIHdpbGwgYmUgc3RhcnRlZCdcbiAgICAgICAgXG4gICAgbG9nIFwiXFxuI3sgbGluZXMuam9pbignXFxuJykgfVxcblwiXG4gICAgICAgICJdfQ==
//# sourceURL=../coffee/command.coffee