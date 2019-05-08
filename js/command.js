// koffee 0.26.0

/*
 0000000   0000000   00     00  00     00   0000000   000   000  0000000    
000       000   000  000   000  000   000  000   000  0000  000  000   000  
000       000   000  000000000  000000000  000000000  000 0 000  000   000  
000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  
 0000000   0000000   000   000  000   000  000   000  000   000  0000000
 */

(function() {
    var EventEmitter, FEATURES, Koffee, SWITCHES, baseFileName, blue, blueBright, bold, compileOptions, compilePath, compileScript, compileStdio, dim, error, exec, findDirectoryIndex, fs, gray, green, helpers, hidden, isCoffee, logFeatures, makePrelude, merge, mkdirp, nopt, opts, outputPath, pad, parseOptions, path, print, printLine, printTokens, printWarn, ref, ref1, ref2, run, spawn, startRepl, stringify, timeLog, usage, useWinPathSep, version, wait, watchDir, watchFile, watchPath, white, whiteBright, writeJs, yellow;

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

    ref2 = require('colorette'), gray = ref2.gray, dim = ref2.dim, bold = ref2.bold, yellow = ref2.yellow, green = ref2.green, whiteBright = ref2.whiteBright, white = ref2.white, blueBright = ref2.blueBright, blue = ref2.blue;

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

    SWITCHES = [['-b', '--bare', 'compile without a top-level function wrapper', Boolean], ['-c', '--compile', 'compile to JavaScript and save as .js files', Boolean], ['-e', '--eval STRING', 'evaluate a string and print the result', [String, Array]], ['-f', '--features', 'list available features', Boolean], ['', '--no-`feature', 'disable a feature, e.g. --no-negative-index', null], ['-h', '--help', 'display this help message', Boolean], ['-j', '--js', 'print out the compiled JavaScript', Boolean], ['-m', '--map', 'generate source map and save as .js.map files', Boolean], ['-M', '--inline-map', 'generate source map and include it directly in output', Boolean], ['-n', '--noop', 'does nothing, for debugging purposes', Boolean], ['-o', '--output DIR', 'set the output directory for compiled JavaScript', String], ['-P', '--parse', 'print out the parse tree that the parser produces', Boolean], ['-r', '--require MODULE', 'require the given module before eval or REPL', [String, Array]], ['-s', '--stdio', 'listen for and compile scripts over stdio', Boolean], ['-t', '--test', 'compile and run the @test code', Boolean], ['-T', '--tokens', 'print out the tokens that the lexer/rewriter produce', Boolean], ['-v', '--version', 'display the version number', Boolean], ['-w', '--watch', 'watch scripts for changes and rerun commands', Boolean]];

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

}).call(this);
