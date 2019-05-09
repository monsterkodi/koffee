// koffee 0.26.0

/*
 0000000   0000000   00     00  00     00   0000000   000   000  0000000    
000       000   000  000   000  000   000  000   000  0000  000  000   000  
000       000   000  000000000  000000000  000000000  000 0 000  000   000  
000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  
 0000000   0000000   000   000  000   000  000   000  000   000  0000000
 */
var EventEmitter, FEATURES, Koffee, SWITCHES, baseFileName, blue, blueBright, bold, compileOptions, compilePath, compileScript, compileStdio, dim, error, exec, findDirectoryIndex, fs, gray, green, helpers, hidden, isCoffee, logFeatures, makePrelude, merge, mkdirp, nopt, opts, outputPath, pad, parseOptions, path, print, printLine, printRewriter, printTokens, printWarn, ref, ref1, ref2, run, spawn, startRepl, stringify, timeLog, usage, useWinPathSep, version, wait, watchDir, watchFile, watchPath, white, whiteBright, writeJs, yellow;

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
    var i, index, ref3, ref4, results, tag, token, value;
    results = [];
    for (index = i = 0, ref3 = tokens.length; 0 <= ref3 ? i < ref3 : i > ref3; index = 0 <= ref3 ? ++i : --i) {
        token = tokens[index];
        tag = token[0];
        value = token[1];
        switch (tag) {
            case 'TERMINATOR':
                results.push(print('\n'));
                break;
            case 'INDENT':
                results.push(print('\n    '));
                break;
            case 'OUTDENT':
                results.push(print('\n'));
                break;
            default:
                print("" + value);
                if (token.spaced && ((ref4 = tokens[index + 1][0]) !== 'CALL_START' && ref4 !== 'CALL_END')) {
                    results.push(print(' '));
                } else {
                    results.push(void 0);
                }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBaUJBLEVBQUEsR0FBbUIsT0FBQSxDQUFRLElBQVI7O0FBQ25CLElBQUEsR0FBbUIsT0FBQSxDQUFRLE1BQVI7O0FBQ25CLElBQUEsR0FBbUIsT0FBQSxDQUFRLE1BQVI7O0FBQ25CLE9BQUEsR0FBbUIsT0FBQSxDQUFRLFdBQVI7O0FBQ25CLE1BQUEsR0FBbUIsT0FBQSxDQUFRLFVBQVI7O0FBQ25CLE1BQW1CLE9BQUEsQ0FBUSxlQUFSLENBQW5CLEVBQUUsaUJBQUYsRUFBUzs7QUFDUCxlQUFpQixPQUFBLENBQVEsUUFBUjs7QUFFbkIsYUFBQSxHQUFtQixJQUFJLENBQUMsR0FBTCxLQUFZOztBQUUvQixPQUFPLENBQUMsTUFBUixDQUFlLE1BQWYsRUFBdUIsSUFBSSxZQUEzQjs7QUFFQSxPQUE0QixPQUFBLENBQVEsWUFBUixDQUE1QixFQUFFLHdCQUFGLEVBQVk7O0FBRVYsbUNBQUYsRUFBZ0IsMkJBQWhCLEVBQTBCLDZCQUExQixFQUFxQyxxQkFBckMsRUFBNEM7O0FBRTVDLE9BQTJFLE9BQUEsQ0FBUSxXQUFSLENBQTNFLEVBQUUsZ0JBQUYsRUFBUSxjQUFSLEVBQWEsZ0JBQWIsRUFBbUIsb0JBQW5CLEVBQTJCLGtCQUEzQixFQUFrQyw4QkFBbEMsRUFBK0Msa0JBQS9DLEVBQXNELDRCQUF0RCxFQUFrRTs7QUFFbEUsS0FBQSxHQUFZLE9BQU8sQ0FBQzs7QUFDcEIsS0FBQSxHQUFZLFNBQUMsSUFBRDtXQUFVLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBZixDQUFxQixJQUFyQjtBQUFWOztBQUNaLFNBQUEsR0FBWSxTQUFDLElBQUQ7V0FBVSxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQWYsQ0FBcUIsSUFBQSxHQUFPLElBQTVCO0FBQVY7O0FBQ1osU0FBQSxHQUFZLFNBQUMsSUFBRDtXQUFVLE9B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LEtBQVgsQ0FBaUIsR0FBakIsQ0FBc0IsQ0FBQSxDQUFBLENBQTVCLENBQUwsQ0FBcEIsR0FBNEQsR0FBNUQsR0FBa0UsSUFBQSxDQUFLLFVBQUEsQ0FBVyxLQUFNLFNBQUksQ0FBQyxLQUFYLENBQWlCLEdBQWpCLENBQXNCLFNBQUksQ0FBQyxJQUEzQixDQUFnQyxHQUFoQyxDQUFYLENBQUw7ZUFDN0UsS0FBSyxDQUFDLElBQU4sQ0FBVyxNQUFBLEdBQVMsTUFBVCxHQUFrQixLQUFsQixHQUEwQixJQUFBLENBQUssV0FBTCxDQUFyQztJQU5pQixDQUFiO0lBUVIsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFBLENBQUssb0VBQUwsQ0FBWDtXQUFvRixPQUFBLENBRXBGLEdBRm9GLENBRWhGLElBQUEsR0FBSSxDQUFFLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWCxDQUFGLENBQUosR0FBd0IsSUFGd0Q7QUFaOUUiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICBcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiMjI1xuXG4jIGhhbmRsZSB2YXJpb3VzIHRhc2tzOiBcbiNcbiMgICAtIGNvbXBpbGUgYW5kIHNhdmUgaW50byBgLmpzYCBmaWxlcyBcbiMgICAtIGNvbXBpbGUgYW5kIHByaW50IHRvIHN0ZG91dCBcbiMgICAtIHJlY29tcGlsZSBpZiB0aGUgc291cmNlIGNoYW5nZXNcbiMgICAtIHByaW50IGxleGVyIHRva2Vuc1xuIyAgIC0gcHJpbnQgYSBzeW50YXggdHJlZVxuIyAgIC0gbGF1bmNoIGEgUkVQTFxuXG5mcyAgICAgICAgICAgICAgID0gcmVxdWlyZSAnZnMnXG5wYXRoICAgICAgICAgICAgID0gcmVxdWlyZSAncGF0aCdcbm5vcHQgICAgICAgICAgICAgPSByZXF1aXJlICdub3B0J1xuaGVscGVycyAgICAgICAgICA9IHJlcXVpcmUgJy4vaGVscGVycydcbktvZmZlZSAgICAgICAgICAgPSByZXF1aXJlICcuL2tvZmZlZSdcbnsgc3Bhd24sIGV4ZWMgfSAgPSByZXF1aXJlICdjaGlsZF9wcm9jZXNzJ1xueyBFdmVudEVtaXR0ZXIgfSA9IHJlcXVpcmUgJ2V2ZW50cydcblxudXNlV2luUGF0aFNlcCAgICA9IHBhdGguc2VwIGlzICdcXFxcJ1xuXG5oZWxwZXJzLmV4dGVuZCBLb2ZmZWUsIG5ldyBFdmVudEVtaXR0ZXIgIyBBbGxvdyBlbWl0dGluZyBOb2RlIGV2ZW50c1xuXG57IEZFQVRVUkVTLCBsb2dGZWF0dXJlcyB9ID0gcmVxdWlyZSAnLi9mZWF0dXJlcydcblxueyBiYXNlRmlsZU5hbWUsIGlzQ29mZmVlLCBzdHJpbmdpZnksIG1lcmdlLCBwYWQgfSA9IGhlbHBlcnNcblxueyBncmF5LCBkaW0sIGJvbGQsIHllbGxvdywgZ3JlZW4sIHdoaXRlQnJpZ2h0LCB3aGl0ZSwgYmx1ZUJyaWdodCwgYmx1ZSB9ID0gcmVxdWlyZSAnY29sb3JldHRlJ1xuXG5lcnJvciAgICAgPSBjb25zb2xlLmVycm9yXG5wcmludCAgICAgPSAobGluZSkgLT4gcHJvY2Vzcy5zdGRvdXQud3JpdGUgbGluZVxucHJpbnRMaW5lID0gKGxpbmUpIC0+IHByb2Nlc3Muc3Rkb3V0LndyaXRlIGxpbmUgKyAnXFxuJyAjID8/P1xucHJpbnRXYXJuID0gKGxpbmUpIC0+IHByb2Nlc3Muc3RkZXJyLndyaXRlIGxpbmUgKyAnXFxuJyAjID8/P1xuaGlkZGVuICAgID0gKGZpbGUpIC0+IC9eXFwufH4kLy50ZXN0IGZpbGVcblxuU1dJVENIRVMgPSBbXG4gICAgWyctYicgJy0tYmFyZScgICAgICAgICAgICAgICdjb21waWxlIHdpdGhvdXQgYSB0b3AtbGV2ZWwgZnVuY3Rpb24gd3JhcHBlcicgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLWMnICctLWNvbXBpbGUnICAgICAgICAgICAnY29tcGlsZSB0byBKYXZhU2NyaXB0IGFuZCBzYXZlIGFzIC5qcyBmaWxlcycgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1lJyAnLS1ldmFsIFNUUklORycgICAgICAgJ2V2YWx1YXRlIGEgc3RyaW5nIGFuZCBwcmludCB0aGUgcmVzdWx0JyAgICAgICAgICAgICAgIFtTdHJpbmcsIEFycmF5XSBdXG4gICAgWyctZicgJy0tZmVhdHVyZXMnICAgICAgICAgICdsaXN0IGF2YWlsYWJsZSBmZWF0dXJlcycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnJyAgICctLW5vLWBmZWF0dXJlJyAgICAgICAnZGlzYWJsZSBhIGZlYXR1cmUsIGUuZy4gLS1uby1uZWdhdGl2ZS1pbmRleCcgICAgICAgICAgIG51bGwgICAgICAgICAgIF1cbiAgICBbJy1oJyAnLS1oZWxwJyAgICAgICAgICAgICAgJ2Rpc3BsYXkgdGhpcyBoZWxwIG1lc3NhZ2UnICAgICAgICAgICAgICAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctaicgJy0tanMnICAgICAgICAgICAgICAgICdwcmludCBvdXQgdGhlIGNvbXBpbGVkIEphdmFTY3JpcHQnICAgICAgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLW0nICctLW1hcCcgICAgICAgICAgICAgICAnZ2VuZXJhdGUgc291cmNlIG1hcCBhbmQgc2F2ZSBhcyAuanMubWFwIGZpbGVzJyAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1NJyAnLS1pbmxpbmUtbWFwJyAgICAgICAgJ2dlbmVyYXRlIHNvdXJjZSBtYXAgYW5kIGluY2x1ZGUgaXQgZGlyZWN0bHkgaW4gb3V0cHV0JyBCb29sZWFuICAgICAgICBdXG4gICAgWyctbicgJy0tbm9vcCcgICAgICAgICAgICAgICdkb2VzIG5vdGhpbmcsIGZvciBkZWJ1Z2dpbmcgcHVycG9zZXMnICAgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLW8nICctLW91dHB1dCBESVInICAgICAgICAnc2V0IHRoZSBvdXRwdXQgZGlyZWN0b3J5IGZvciBjb21waWxlZCBKYXZhU2NyaXB0JyAgICAgIFN0cmluZyAgICAgICAgIF1cbiAgICBbJy1QJyAnLS1wYXJzZScgICAgICAgICAgICAgJ3ByaW50IG91dCB0aGUgcGFyc2UgdHJlZSB0aGF0IHRoZSBwYXJzZXIgcHJvZHVjZXMnICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctcicgJy0tcmVxdWlyZSBNT0RVTEUnICAgICdyZXF1aXJlIHRoZSBnaXZlbiBtb2R1bGUgYmVmb3JlIGV2YWwgb3IgUkVQTCcgICAgICAgICBbU3RyaW5nLCBBcnJheV0gXVxuICAgIFsnLVInICctLXJld3JpdGVyJyAgICAgICAgICAncHJpbnQgb3V0IHRoZSBjb2RlIHRoYXQgdGhlIHJld3JpdGVyIHByb2R1Y2VzJyAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1zJyAnLS1zdGRpbycgICAgICAgICAgICAgJ2xpc3RlbiBmb3IgYW5kIGNvbXBpbGUgc2NyaXB0cyBvdmVyIHN0ZGlvJyAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctdCcgJy0tdGVzdCcgICAgICAgICAgICAgICdjb21waWxlIGFuZCBydW4gdGhlIEB0ZXN0IGNvZGUnICAgICAgICAgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLVQnICctLXRva2VucycgICAgICAgICAgICAncHJpbnQgb3V0IHRoZSB0b2tlbnMgdGhhdCB0aGUgbGV4ZXIvcmV3cml0ZXIgcHJvZHVjZScgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy12JyAnLS12ZXJzaW9uJyAgICAgICAgICAgJ2Rpc3BsYXkgdGhlIHZlcnNpb24gbnVtYmVyJyAgICAgICAgICAgICAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctdycgJy0td2F0Y2gnICAgICAgICAgICAgICd3YXRjaCBzY3JpcHRzIGZvciBjaGFuZ2VzIGFuZCByZXJ1biBjb21tYW5kcycgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuXVxuXG5vcHRzID0ge31cblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgXG4jICAwMDAwMDAwICAgMDAwICAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcblxucGFyc2VPcHRpb25zID0gLT5cblxuICAgIGtub3duID0gRGVidWc6Qm9vbGVhblxuICAgIHNob3J0ID0gRDonLS1EZWJ1ZycgcDonLS1qcydcbiAgICBTV0lUQ0hFUy5tYXAgKHMpIC0+IGwgPSBzWzFdLnNwbGl0KCcgJylbMF1bMi4uXTsga25vd25bbF0gPSBzWzNdIGlmIHNbM107IHNob3J0W3NbMF1bMV1dID0gXCItLSN7bH1cIiBpZiBzWzBdIT0nJ1xuICAgIEZFQVRVUkVTLm1hcCAoZikgLT4ga25vd25bZi5sYWddID0gQm9vbGVhblxuICAgIFxuICAgIG8gPSBvcHRzID0gbm9wdCBrbm93biwgc2hvcnRcbiAgICAgICAgXG4gICAgby5jb21waWxlICBvcj0gISFvLm91dHB1dFxuICAgIG8uYXJndW1lbnRzICA9IG8uYXJndi5yZW1haW5cbiAgICBvLnByZWx1ZGUgICAgPSBtYWtlUHJlbHVkZSBvLnJlcXVpcmUgaWYgby5yZXF1aXJlXG4gICAgby5ydW4gICAgICAgID0gbm90IChvLmNvbXBpbGUgb3Igby5qcyBvciBvLm1hcCBvciBvLnRva2VucyBvciBvLnBhcnNlKVxuICAgIG8uanMgICAgICAgICA9ICEhKG8uanMgb3Igby5ldmFsIG9yIG8uc3RkaW8gYW5kIG8uY29tcGlsZSkgIyBqcyBvdXRwdXQgaXMgcGFzc2VkIHRvIGV2YWwgYW5kIHN0ZGlvIGNvbXBpbGVcbiAgICBcbiAgICBvLmZlYXR1cmUgPSB7fVxuICAgIEZFQVRVUkVTLm1hcCAoZikgLT4gby5mZWF0dXJlW2Yua2V5XSA9IG9bZi5mbGFnXSA/IHRydWU7IGRlbGV0ZSBvW2YuZmxhZ11cbiAgICBcbiAgICBpZiBvLkRlYnVnXG4gICAgICAgIGRlbGV0ZSBvLmFyZ3ZcbiAgICAgICAgbG9nIHN0cmluZ2lmeSBvXG5cbiMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4jIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuXG5ydW4gPSAtPlxuICAgIFxuICAgIHBhcnNlT3B0aW9ucygpXG4gICAgICAgIFxuICAgIHJldHVybiBsb2dGZWF0dXJlcygpICBpZiBvcHRzLmZlYXR1cmVzXG4gICAgcmV0dXJuIHVzYWdlKCkgICAgICAgIGlmIG9wdHMuaGVscFxuICAgIHJldHVybiB2ZXJzaW9uKCkgICAgICBpZiBvcHRzLnZlcnNpb25cbiAgICByZXR1cm4gc3RhcnRSZXBsKCkgICAgaWYgb3B0cy5pbnRlcmFjdGl2ZVxuICAgIHJldHVybiBjb21waWxlU3RkaW8oKSBpZiBvcHRzLnN0ZGlvXG4gICAgaWYgb3B0cy5ldmFsXG4gICAgICAgIGZvciBldmFsIGluIG9wdHMuZXZhbFxuICAgICAgICAgICAgY29tcGlsZVNjcmlwdCBldmFsXG4gICAgICAgIHJldHVyblxuICAgIHJldHVybiBzdGFydFJlcGwoKSAgICBpZiBub3Qgb3B0cy5hcmd1bWVudHMubGVuZ3RoXG4gICAgXG4gICAgbGl0ZXJhbHMgPSBpZiBub3Qgb3B0cy53YXRjaCBhbmQgbm90IG9wdHMuY29tcGlsZSB0aGVuIG9wdHMuYXJndW1lbnRzLnNwbGljZSAxIGVsc2UgW11cbiAgICBcbiAgICBwcm9jZXNzLmFyZ3YgPSBwcm9jZXNzLmFyZ3ZbMC4uMV0uY29uY2F0IGxpdGVyYWxzXG4gICAgcHJvY2Vzcy5hcmd2WzBdID0gJ2tvZmZlZSdcblxuICAgIG9wdHMub3V0cHV0ID0gcGF0aC5yZXNvbHZlIG9wdHMub3V0cHV0IGlmIG9wdHMub3V0cHV0XG4gICAgZm9yIHNvdXJjZSBpbiBvcHRzLmFyZ3VtZW50c1xuICAgICAgICBzb3VyY2UgPSBwYXRoLnJlc29sdmUgc291cmNlXG4gICAgICAgIFxuICAgICAgICBpZiBvcHRzLndhdGNoXG4gICAgICAgICAgICB3YXRjaFBhdGggc291cmNlXG4gICAgICAgIGVsc2UgICAgIFxuICAgICAgICAgICAgY29tcGlsZVBhdGggc291cmNlLCB0b3BMZXZlbDp5ZXNcblxuZXhwb3J0cy5ydW4gPSBydW5cbiAgICAgICAgXG5zdGFydFJlcGwgPSAtPlxuICAgIFxuICAgICMgTWFrZSB0aGUgUkVQTCB1c2UgdGhlIGdsb2JhbCBjb250ZXh0IHNvIGFzIHRvIFxuICAgICMgICAoYSkgYmUgY29uc2lzdGVudCB3aXRoIHRoZSBgbm9kZWAgUkVQTCBhbmQsIHRoZXJlZm9yZSwgXG4gICAgIyAgIChiKSBtYWtlIHBhY2thZ2VzIHRoYXQgbW9kaWZ5IG5hdGl2ZSBwcm90b3R5cGVzIChzdWNoIGFzICdjb2xvcnMnIGFuZCAnc3VnYXInKSB3b3JrIGFzIGV4cGVjdGVkLlxuICAgIFxuICAgIHJlcGxDbGlPcHRzID0gdXNlR2xvYmFsOiB5ZXNcbiAgICByZXBsQ2xpT3B0cy5wcmVsdWRlID0gb3B0cy5wcmVsdWRlXG4gICAgcmVxdWlyZSgnLi9yZXBsJykuc3RhcnQgcmVwbENsaU9wdHNcblxubWFrZVByZWx1ZGUgPSAocmVxdWlyZXMpIC0+XG4gICAgXG4gICAgcmVxdWlyZXMubWFwIChtb2R1bGUpIC0+XG4gICAgICAgIFtfLCBuYW1lLCBtb2R1bGVdID0gbWF0Y2ggaWYgbWF0Y2ggPSBtb2R1bGUubWF0Y2goL14oLiopPSguKikkLylcbiAgICAgICAgbmFtZSB8fD0gYmFzZUZpbGVOYW1lIG1vZHVsZSwgeWVzLCB1c2VXaW5QYXRoU2VwXG4gICAgICAgIFwiI3tuYW1lfSA9IHJlcXVpcmUoJyN7bW9kdWxlfScpXCJcbiAgICAuam9pbiAnOydcblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcblxuIyBDb21waWxlIGEgc2NyaXB0IG9yIGEgZGlyZWN0b3J5LiBJZiBhIGRpcmVjdG9yeSBpcyBwYXNzZWQsIHJlY3Vyc2l2ZWx5IGNvbXBpbGUgYWxsICcuY29mZmVlJyBhbmQgJy5rb2ZmZWUnIGZpbGVzLlxuXG5jb21waWxlUGF0aCA9IChzb3VyY2UsIHRvcExldmVsOnRvcExldmVsPW5vKSAtPlxuXG4gICAgcmV0dXJuIGlmIG5vdCB0b3BMZXZlbCBhbmQgaGlkZGVuIHNvdXJjZVxuICAgICAgICAgICAgICBcbiAgICB0cnlcbiAgICAgICAgc3RhdHMgPSBmcy5zdGF0U3luYyBzb3VyY2VcbiAgICBjYXRjaCBlcnJcbiAgICAgICAgaWYgZXJyLmNvZGUgaXMgJ0VOT0VOVCdcbiAgICAgICAgICAgIGVycm9yIFwiQ29tbWFuZC5jb21waWxlUGF0aCBjYW4ndCBzdGF0ICcje3NvdXJjZX0nXCJcbiAgICAgICAgICAgIHByb2Nlc3MuZXhpdCAxXG4gICAgICAgIHRocm93IGVyclxuICAgICAgICBcbiAgICBpZiBzdGF0cy5pc0RpcmVjdG9yeSgpXG4gICAgICAgIFxuICAgICAgICBpZiBwYXRoLmJhc2VuYW1lKHNvdXJjZSkgaW4gWydub2RlX21vZHVsZXMnICcuZ2l0J11cbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgXG4gICAgICAgIGlmIG9wdHMucnVuXG4gICAgICAgICAgICBjb21waWxlUGF0aCBmaW5kRGlyZWN0b3J5SW5kZXgoc291cmNlKSwgdG9wTGV2ZWw6dG9wTGV2ZWxcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICBcbiAgICAgICAgbG9nICdDb21tYW5kLmNvbXBpbGVQYXRoIGRpcjonLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuICAgICAgICBcbiAgICAgICAgdHJ5XG4gICAgICAgICAgICBmaWxlcyA9IGZzLnJlYWRkaXJTeW5jIHNvdXJjZVxuICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgIGlmIGVyci5jb2RlIGlzICdFTk9FTlQnIHRoZW4gcmV0dXJuIFxuICAgICAgICAgICAgdGhyb3cgZXJyXG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIGZpbGUgaW4gZmlsZXNcbiAgICAgICAgICAgIGNvbXBpbGVQYXRoIHBhdGguam9pbiBzb3VyY2UsIGZpbGVcbiAgICAgICAgICAgIFxuICAgIGVsc2UgaWYgdG9wTGV2ZWwgb3IgaXNDb2ZmZWUgc291cmNlXG4gICAgICAgIFxuICAgICAgICB0cnlcbiAgICAgICAgICAgIGNvZGUgPSBmcy5yZWFkRmlsZVN5bmMgc291cmNlXG4gICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgaWYgZXJyLmNvZGUgaXMgJ0VOT0VOVCcgdGhlbiByZXR1cm5cbiAgICAgICAgICAgIHRocm93IGVyclxuICAgICAgICBcbiAgICAgICAgbG9nICdDb21tYW5kLmNvbXBpbGVQYXRoIGZpbGU6Jywgc291cmNlIGlmIG9wdHMuRGVidWdcbiAgICAgICAgICAgIFxuICAgICAgICBjb21waWxlU2NyaXB0IGNvZGUudG9TdHJpbmcoKSwgc291cmNlXG4gICAgICAgIFxuZmluZERpcmVjdG9yeUluZGV4ID0gKHNvdXJjZSkgLT5cblxuICAgIGZvciBleHQgaW4gS29mZmVlLkZJTEVfRVhURU5TSU9OU1xuICAgICAgICBpbmRleCA9IHBhdGguam9pbiBzb3VyY2UsIFwiaW5kZXgje2V4dH1cIlxuICAgICAgICB0cnlcbiAgICAgICAgICAgIHJldHVybiBpbmRleCBpZiAoZnMuc3RhdFN5bmMgaW5kZXgpLmlzRmlsZSgpXG4gICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgdGhyb3cgZXJyIHVubGVzcyBlcnIuY29kZSBpcyAnRU5PRU5UJ1xuICAgIGVycm9yIFwiTWlzc2luZyBpbmRleC5jb2ZmZWUgaW4gI3tzb3VyY2V9XCJcbiAgICBwcm9jZXNzLmV4aXQgMVxuXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgICAgIDAwMCAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgICAgXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgICAgXG5cbiMgQ29tcGlsZSBhIHNpbmdsZSBzb3VyY2Ugc2NyaXB0LCBjb250YWluaW5nIHRoZSBnaXZlbiBjb2RlLCBhY2NvcmRpbmcgdG8gdGhlIHJlcXVlc3RlZCBvcHRpb25zLiBcbiMgSWYgZXZhbHVhdGluZyB0aGUgc2NyaXB0IGRpcmVjdGx5IHNldHMgYF9fZmlsZW5hbWVgLCBgX19kaXJuYW1lYCBhbmQgYG1vZHVsZS5maWxlbmFtZWAgdG8gYmUgY29ycmVjdCByZWxhdGl2ZSB0byB0aGUgc2NyaXB0J3MgcGF0aC5cblxuY29tcGlsZVNjcmlwdCA9IChjb2RlLCBzb3VyY2UgPSBudWxsKSAtPlxuICAgIFxuICAgIG8gPSBvcHRzXG4gICAgb3B0aW9ucyA9IGNvbXBpbGVPcHRpb25zIHNvdXJjZVxuICAgIFxuICAgIHRyeVxuICAgICAgICB0ID0gdGFzayA9IHtzb3VyY2UsIGNvZGUsIG9wdGlvbnN9XG4gICAgICAgIEtvZmZlZS5lbWl0ICdjb21waWxlJywgdGFza1xuICAgICAgICBpZiBvLnRva2Vuc1xuICAgICAgICAgICAgcHJpbnRUb2tlbnMgS29mZmVlLnRva2VucyB0LmNvZGUsIHQub3B0aW9uc1xuICAgICAgICBlbHNlIGlmIG8ucmV3cml0ZXJcbiAgICAgICAgICAgIHByaW50UmV3cml0ZXIgS29mZmVlLnRva2VucyB0LmNvZGUsIHQub3B0aW9uc1xuICAgICAgICBlbHNlIGlmIG8ucGFyc2VcbiAgICAgICAgICAgIHByaW50TGluZSBLb2ZmZWUubm9kZXModC5jb2RlLCB0Lm9wdGlvbnMpLnRvU3RyaW5nKCkudHJpbSgpXG4gICAgICAgIGVsc2UgaWYgby5ydW5cbiAgICAgICAgICAgIEtvZmZlZS5yZWdpc3RlcigpXG4gICAgICAgICAgICBLb2ZmZWUuZXZhbCBvcHRzLnByZWx1ZGUsIHQub3B0aW9ucyBpZiBvcHRzLnByZWx1ZGVcbiAgICAgICAgICAgIHQub3B0aW9ucy5maWxlbmFtZSA/PSBvcHRpb25zLnNvdXJjZVxuICAgICAgICAgICAgaWYgb3B0cy5ub29wIHRoZW4gbG9nIFwibm9vcCBydW4gI3tzb3VyY2V9XCJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBLb2ZmZWUucnVuIHQuY29kZSwgdC5vcHRpb25zXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGNvbXBpbGVkID0gS29mZmVlLmNvbXBpbGUgdC5jb2RlLCB0Lm9wdGlvbnNcbiAgICAgICAgICAgIHQub3V0cHV0ID0gY29tcGlsZWRcbiAgICAgICAgICAgIGlmIG8ubWFwXG4gICAgICAgICAgICAgICAgdC5vdXRwdXQgPSBjb21waWxlZC5qc1xuICAgICAgICAgICAgICAgIHQuc291cmNlTWFwID0gY29tcGlsZWQudjNTb3VyY2VNYXBcblxuICAgICAgICAgICAgS29mZmVlLmVtaXQgJ3N1Y2Nlc3MnLCB0YXNrXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIG8uanNcbiAgICAgICAgICAgICAgICBpZiBvcHRzLm5vb3AgdGhlbiBsb2cgXCJub29wIGpzICN7c291cmNlfVwiXG4gICAgICAgICAgICAgICAgZWxzZSBcbiAgICAgICAgICAgICAgICAgICAgcHJpbnRMaW5lIHQub3V0cHV0LnRyaW0oKVxuICAgICAgICAgICAgZWxzZSBpZiBvLmNvbXBpbGUgb3Igby5tYXBcbiAgICAgICAgICAgICAgICBpZiBvcHRzLm5vb3AgdGhlbiBsb2cgXCJub29wIHdyaXRlICN7b3B0aW9ucy5qc1BhdGh9XCJcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlSnMgdC5zb3VyY2UsIHQub3V0cHV0LCBvcHRpb25zLmpzUGF0aCwgdC5zb3VyY2VNYXBcbiAgICBjYXRjaCBlcnJcbiAgICAgICAgXG4gICAgICAgIEtvZmZlZS5lbWl0ICdmYWlsdXJlJywgZXJyLCB0YXNrXG4gICAgICAgIHJldHVybiBpZiBLb2ZmZWUubGlzdGVuZXJzKCdmYWlsdXJlJykubGVuZ3RoXG4gICAgICAgIG1lc3NhZ2UgPSBlcnI/LnN0YWNrIG9yIFwiI3tlcnJ9XCJcbiAgICAgICAgaWYgby53YXRjaFxuICAgICAgICAgICAgcHJpbnRMaW5lIG1lc3NhZ2UgKyAnXFx4MDcnXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHByaW50V2FybiBtZXNzYWdlXG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQgMVxuXG5jb21waWxlT3B0aW9ucyA9IChzb3VyY2UpIC0+ICMgVGhlIGNvbXBpbGUtdGltZSBvcHRpb25zIHRvIHBhc3MgdG8gdGhlIGNvbXBpbGVyLlxuICAgIFxuICAgIGNvcHRzID0gICAgICAgICBcbiAgICAgICAgc291cmNlOiAgICBzb3VyY2VcbiAgICAgICAgc291cmNlTWFwOiBvcHRzLm1hcFxuICAgICAgICBpbmxpbmVNYXA6IG9wdHNbJ2lubGluZS1tYXAnXVxuICAgICAgICBmZWF0dXJlOiAgIG9wdHMuZmVhdHVyZVxuICAgICAgICBiYXJlOiAgICAgIG9wdHMuYmFyZVxuICAgICAgICB0ZXN0OiAgICAgIG9wdHMudGVzdFxuICAgICAgICBEZWJ1ZzogICAgIG9wdHMuRGVidWdcblxuICAgIGlmIHNvdXJjZVxuICAgICAgICBcbiAgICAgICAgY3dkID0gcHJvY2Vzcy5jd2QoKVxuICAgICAgICBqc1BhdGggPSBvdXRwdXRQYXRoIHNvdXJjZSwgJy5qcydcbiAgICAgICAganNEaXIgPSBwYXRoLmRpcm5hbWUganNQYXRoXG4gICAgICAgIGNvcHRzID0gbWVyZ2UgY29wdHMsIHtcbiAgICAgICAgICAgIGpzUGF0aFxuICAgICAgICAgICAgc291cmNlUm9vdDogcGF0aC5yZWxhdGl2ZSBqc0RpciwgY3dkXG4gICAgICAgICAgICBzb3VyY2VGaWxlczogW3BhdGgucmVsYXRpdmUgY3dkLCBzb3VyY2VdXG4gICAgICAgICAgICBnZW5lcmF0ZWRGaWxlOiBiYXNlRmlsZU5hbWUoanNQYXRoLCBubywgdXNlV2luUGF0aFNlcClcbiAgICAgICAgfVxuICAgIGNvcHRzXG4gICAgICAgICAgICBcbiMgQXR0YWNoIHRoZSBhcHByb3ByaWF0ZSBsaXN0ZW5lcnMgdG8gY29tcGlsZSBzY3JpcHRzIGluY29taW5nIG92ZXIgKipzdGRpbioqLCBhbmQgd3JpdGUgdGhlbSBiYWNrIHRvICoqc3Rkb3V0KiouXG5cbmNvbXBpbGVTdGRpbyA9IC0+XG4gICAgXG4gICAgYnVmZmVycyA9IFtdXG4gICAgc3RkaW4gPSBwcm9jZXNzLm9wZW5TdGRpbigpXG4gICAgc3RkaW4ub24gJ2RhdGEnLCAoYnVmZmVyKSAtPlxuICAgICAgICBidWZmZXJzLnB1c2ggYnVmZmVyIGlmIGJ1ZmZlclxuICAgIHN0ZGluLm9uICdlbmQnLCAtPlxuICAgICAgICBjb21waWxlU2NyaXB0IEJ1ZmZlci5jb25jYXQoYnVmZmVycykudG9TdHJpbmcoKVxuXG4jIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwMDAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuIyAwMCAgICAgMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICBcblxud2F0Y2hQYXRoID0gKHNvdXJjZSkgLT4gIyBXYXRjaCBhIGZpbGUgb3IgZGlyZWN0b3J5LlxuICAgIFxuICAgIHRyeVxuICAgICAgICBzdGF0cyA9IGZzLnN0YXRTeW5jIHNvdXJjZVxuICAgIGNhdGNoIGVyclxuICAgICAgICByZXR1cm4gaWYgZXJyLmNvZGUgaXMgJ0VOT0VOVCdcbiAgICAgICAgcmV0dXJuIGVycm9yIFwiQ29tbWFuZC53YXRjaFBhdGggY2FuJ3Qgc3RhdCAnI3tzb3VyY2V9J1wiLCBlcnJcbiAgICAgICAgICAgICAgICBcbiAgICBpZiBzdGF0cy5pc0RpcmVjdG9yeSgpXG4gICAgICAgIHdhdGNoRGlyIHNvdXJjZVxuICAgIGVsc2VcbiAgICAgICAgd2F0Y2hGaWxlIHNvdXJjZVxuXG4jIFdhdGNoIGEgc2luZ2xlIGZpbGUgdXNpbmcgYGZzLndhdGNoYCwgcmVjb21waWxpbmcgaXQgZXZlcnkgdGltZSB0aGUgZmlsZSBpcyB1cGRhdGVkLlxuIyBNYXkgYmUgdXNlZCBpbiBjb21iaW5hdGlvbiB3aXRoIG90aGVyIG9wdGlvbnMsIHN1Y2ggYXMgYC0tcHJpbnRgLlxuICAgICAgICBcbndhdGNoRmlsZSA9IChzb3VyY2UpIC0+XG4gICAgXG4gICAgcmV0dXJuIGlmIG5vdCBpc0NvZmZlZSBzb3VyY2VcbiAgICBcbiAgICBsb2cgJ0NvbW1hbmQud2F0Y2hGaWxlJywgc291cmNlIGlmIG9wdHMuRGVidWdcbiAgICBcbiAgICB3YXRjaGVyICAgICAgICA9IG51bGxcbiAgICBwcmV2U3RhdHMgICAgICA9IG51bGxcbiAgICBjb21waWxlVGltZW91dCA9IG51bGxcblxuICAgIHN0YXJ0V2F0Y2hlciA9IC0+XG4gICAgICAgIFxuICAgICAgICB3YXRjaGVyID0gZnMud2F0Y2ggc291cmNlXG4gICAgICAgIC5vbiAnY2hhbmdlJywgKGNoYW5nZSkgLT5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIGlmIGNoYW5nZSAhPSAnY2hhbmdlJ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBsb2cgJ0NvbW1hbmQud2F0Y2hGaWxlJywgY2hhbmdlLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQgY29tcGlsZVRpbWVvdXRcbiAgICAgICAgICAgIGNvbXBpbGVUaW1lb3V0ID0gd2FpdCAyNSwgLT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmcy5zdGF0IHNvdXJjZSwgKGVyciwgc3RhdHMpIC0+XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB3YXRjaGVyLmNsb3NlKCkgaWYgZXJyPy5jb2RlIGlzICdFTk9FTlQnXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnJvciBlcnIgaWYgZXJyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpZiBwcmV2U3RhdHMgYW5kIHN0YXRzLm10aW1lLmdldFRpbWUoKSBpcyBwcmV2U3RhdHMubXRpbWUuZ2V0VGltZSgpIGFuZCBzdGF0cy5zaXplIGlzIHByZXZTdGF0cy5zaXplXG4gICAgICAgICAgICAgICAgICAgIHByZXZTdGF0cyA9IHN0YXRzXG4gICAgICAgICAgICAgICAgICAgIGZzLnJlYWRGaWxlIHNvdXJjZSwgKGVyciwgY29kZSkgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnJvciBlcnIgaWYgZXJyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2cgJ0NvbW1hbmQud2F0Y2hGaWxlIGNvbXBpbGUnLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tcGlsZVNjcmlwdCBjb2RlLnRvU3RyaW5nKCksIHNvdXJjZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIC5vbiAnZXJyb3InLCAoZXJyKSAtPlxuICAgICAgICAgICAgdGhyb3cgZXJyIHVubGVzcyBlcnIuY29kZSBpcyAnRVBFUk0nXG5cbiAgICB0cnlcbiAgICAgICAgc3RhcnRXYXRjaGVyKClcbiAgICBjYXRjaCBlcnJcbiAgICAgICAgZXJyb3IgZXJyXG5cbndhdGNoRGlyID0gKHNvdXJjZSkgLT5cbiAgICBcbiAgICBsb2cgJ0NvbW1hbmQud2F0Y2hEaXInLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuICAgIFxuICAgIHdhdGNoZXIgPSBudWxsXG5cbiAgICBzdGFydFdhdGNoZXIgPSAtPlxuXG4gICAgICAgIHRyeVxuICAgICAgICAgICAgZmlsZXMgPSBmcy5yZWFkZGlyU3luYyBzb3VyY2VcbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICByZXR1cm4gaWYgZXJyPy5jb2RlIGlzICdFTk9FTlQnXG4gICAgICAgICAgICB0aHJvdyBlcnJcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgZmlsZSBpbiBmaWxlc1xuICAgICAgICAgICAgY29udGludWUgaWYgZmlsZVswXSA9PSAnLidcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIGZpbGUgaW4gWydub2RlX21vZHVsZXMnXVxuICAgICAgICAgICAgd2F0Y2hQYXRoIHBhdGguam9pbiBzb3VyY2UsIGZpbGVcbiAgICAgICAgXG4gICAgICAgIHdhdGNoZXIgPSBmcy53YXRjaCBzb3VyY2VcbiAgICAgICAgLm9uICdlcnJvcicsIChlcnIpIC0+XG4gICAgICAgICAgICB0aHJvdyBlcnIgdW5sZXNzIGVyci5jb2RlIGlzICdFUEVSTSdcbiAgICAgICAgICAgIHdhdGNoZXIuY2xvc2UoKVxuICAgICAgICAub24gJ2NoYW5nZScsIChjaGFuZ2UsIHApIC0+XG4gICAgICAgICAgICBpZiBjaGFuZ2UgPT0gJ3JlbmFtZSdcbiAgICAgICAgICAgICAgICBsb2cgJ0NvbW1hbmQud2F0Y2hEaXInLCBjaGFuZ2UsIHBhdGguam9pbiBzb3VyY2UsIHAgaWYgb3B0cy5EZWJ1Z1xuICAgICAgICAgICAgICAgIHdhdGNoUGF0aCBwYXRoLmpvaW4gc291cmNlLCBwXG4gICAgICAgICAgICBcbiAgICB0cnlcbiAgICAgICAgc3RhcnRXYXRjaGVyKClcbiAgICBjYXRjaCBlcnJcbiAgICAgICAgcmV0dXJuIGlmIGVyci5jb2RlIGlzICdFTk9FTlQnXG4gICAgICAgIHRocm93IGVyclxuXG4jIEdldCB0aGUgY29ycmVzcG9uZGluZyBvdXRwdXQgSmF2YVNjcmlwdCBwYXRoIGZvciBhIHNvdXJjZSBmaWxlLlxuICAgIFxub3V0cHV0UGF0aCA9IChzb3VyY2UsIGV4dGVuc2lvbikgLT5cbiAgICBcbiAgICBiYXNlbmFtZSA9IGJhc2VGaWxlTmFtZSBzb3VyY2UsIHllcywgdXNlV2luUGF0aFNlcFxuICAgIGlmIG9wdHMub3V0cHV0XG4gICAgICAgIGRpciA9IG9wdHMub3V0cHV0XG4gICAgZWxzZVxuICAgICAgICBkaXIgPSBwYXRoLmRpcm5hbWUgc291cmNlXG4gICAgcGF0aC5qb2luIGRpciwgYmFzZW5hbWUgKyBleHRlbnNpb25cblxuIyBSZWN1cnNpdmVseSBta2RpciwgbGlrZSBgbWtkaXIgLXBgLlxuXG5ta2RpcnAgPSAoZGlyLCBmbikgLT5cbiAgICBtb2RlID0gMG83NzcgJiB+cHJvY2Vzcy51bWFzaygpXG5cbiAgICBkbyBta2RpcnMgPSAocCA9IGRpciwgZm4pIC0+XG4gICAgICAgIGZzLmV4aXN0cyBwLCAoZXhpc3RzKSAtPlxuICAgICAgICAgICAgaWYgZXhpc3RzXG4gICAgICAgICAgICAgICAgZm4oKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIG1rZGlycyBwYXRoLmRpcm5hbWUocCksIC0+XG4gICAgICAgICAgICAgICAgICAgIGZzLm1rZGlyIHAsIG1vZGUsIChlcnIpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm4gZXJyIGlmIGVyclxuICAgICAgICAgICAgICAgICAgICAgICAgZm4oKVxuXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgIDAwMCAgIDAwMDAwMDAgIFxuIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgICAgICAwMDAgIDAwMCAgICAgICBcbiMgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgICAgICAgMDAwICAwMDAwMDAwICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuIyAwMCAgICAgMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcblxuIyBXcml0ZSBvdXQgYSBKYXZhU2NyaXB0IHNvdXJjZSBmaWxlIHdpdGggdGhlIGNvbXBpbGVkIGNvZGUuIFxuIyBCeSBkZWZhdWx0LCBmaWxlcyBhcmUgd3JpdHRlbiBvdXQgaW4gYGN3ZGAgYXMgYC5qc2AgZmlsZXMgd2l0aCB0aGUgc2FtZSBuYW1lLCBidXQgdGhlIG91dHB1dCBkaXJlY3RvcnkgY2FuIGJlIGN1c3RvbWl6ZWQgd2l0aCBgLS1vdXRwdXRgLlxuIyBJZiBgZ2VuZXJhdGVkU291cmNlTWFwYCBpcyBwcm92aWRlZCwgdGhpcyB3aWxsIHdyaXRlIGEgYC5qcy5tYXBgIGZpbGUgaW50byB0aGUgc2FtZSBkaXJlY3RvcnkgYXMgdGhlIGAuanNgIGZpbGUuXG5cbndyaXRlSnMgPSAoc291cmNlLCBqcywganNQYXRoLCBnZW5lcmF0ZWRTb3VyY2VNYXAgPSBudWxsKSAtPlxuICAgIFxuICAgIHNvdXJjZU1hcFBhdGggPSBvdXRwdXRQYXRoIHNvdXJjZSwgJy5qcy5tYXAnXG4gICAganNEaXIgPSBwYXRoLmRpcm5hbWUganNQYXRoXG4gICAgY29tcGlsZSA9IC0+XG4gICAgICAgIGlmIG9wdHMuY29tcGlsZVxuICAgICAgICAgICAganMgPSAnICcgaWYganMubGVuZ3RoIDw9IDBcbiAgICAgICAgICAgIGlmIGdlbmVyYXRlZFNvdXJjZU1hcCB0aGVuIGpzID0gXCIje2pzfVxcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPSN7YmFzZUZpbGVOYW1lIHNvdXJjZU1hcFBhdGgsIG5vLCB1c2VXaW5QYXRoU2VwfVxcblwiXG4gICAgICAgICAgICBmcy53cml0ZUZpbGUganNQYXRoLCBqcywgKGVycikgLT5cbiAgICAgICAgICAgICAgICBpZiBlcnJcbiAgICAgICAgICAgICAgICAgICAgcHJpbnRMaW5lIGVyci5tZXNzYWdlXG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCAxXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBvcHRzLmNvbXBpbGUgYW5kIG9wdHMud2F0Y2hcbiAgICAgICAgICAgICAgICAgICAgdGltZUxvZyBcImNvbXBpbGVkICN7c291cmNlfVwiXG4gICAgICAgIGlmIGdlbmVyYXRlZFNvdXJjZU1hcFxuICAgICAgICAgICAgZnMud3JpdGVGaWxlIHNvdXJjZU1hcFBhdGgsIGdlbmVyYXRlZFNvdXJjZU1hcCwgKGVycikgLT5cbiAgICAgICAgICAgICAgICBpZiBlcnJcbiAgICAgICAgICAgICAgICAgICAgcHJpbnRMaW5lIFwiQ291bGQgbm90IHdyaXRlIHNvdXJjZSBtYXA6ICN7ZXJyLm1lc3NhZ2V9XCJcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0IDFcbiAgICBmcy5leGlzdHMganNEaXIsIChpdEV4aXN0cykgLT5cbiAgICAgICAgaWYgaXRFeGlzdHMgdGhlbiBjb21waWxlKCkgZWxzZSBta2RpcnAganNEaXIsIGNvbXBpbGVcblxud2FpdCA9IChtaWxsaXNlY29uZHMsIGZ1bmMpIC0+IHNldFRpbWVvdXQgZnVuYywgbWlsbGlzZWNvbmRzICMgQ29udmVuaWVuY2UgZm9yIGNsZWFuZXIgc2V0VGltZW91dHMuXG5cbnRpbWVMb2cgPSAobWVzc2FnZSkgLT4gbG9nIFwiI3sobmV3IERhdGUpLnRvTG9jYWxlVGltZVN0cmluZygpfSAtICN7bWVzc2FnZX1cIlxuXG4jIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgICAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAwMDAwICAgXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgICAgMDAwICBcbiMgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuXG5wcmludFRva2VucyA9ICh0b2tlbnMpIC0+XG5cbiAgICBmb3IgaW5kZXggaW4gWzAuLi50b2tlbnMubGVuZ3RoXVxuICAgICAgICB0b2tlbiAgPSB0b2tlbnNbaW5kZXhdXG4gICAgICAgIHRhZyAgICA9IHRva2VuWzBdXG4gICAgICAgIHZhbHVlICA9IHRva2VuWzFdLnRvU3RyaW5nKCkucmVwbGFjZSgvXFxuLywgJ1xcXFxuJylcbiAgICAgICAgY3RhZyAgID0gZ3JheSB0YWdcbiAgICAgICAgY3ZhbHVlID0gYm9sZCB5ZWxsb3cgdmFsdWVcbiAgICAgICAgaW5kZXggID0gZ3JheSBkaW0gaW5kZXhcbiAgICAgICAgaWYgdGFnID09ICdURVJNSU5BVE9SJ1xuICAgICAgICAgICAgcHJpbnQgJ1xcblxcbidcbiAgICAgICAgZWxzZSBpZiB0YWcgPT0gJ0lOREVOVCdcbiAgICAgICAgICAgIHByaW50IGdyYXkgZGltICdJTkQgJ1xuICAgICAgICBlbHNlIGlmIHRhZyA9PSAnT1VUREVOVCdcbiAgICAgICAgICAgIHByaW50IGdyYXkgZGltICdPVVQgJ1xuICAgICAgICBlbHNlIGlmIHRhZyBpbiBbJ0NMQVNTJyAnUEFSQU1fU1RBUlQnICdQQVJBTV9FTkQnICdOVUxMJ11cbiAgICAgICAgICAgIHByaW50IFwiI3tpbmRleH0je2N0YWd9IFwiXG4gICAgICAgIGVsc2UgaWYgdGFnIGlzIHZhbHVlXG4gICAgICAgICAgICBwcmludCBcIiN7aW5kZXh9I3tjdmFsdWV9IFwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHByaW50IFwiI3tpbmRleH0je2N0YWd9PSN7Y3ZhbHVlfSBcIlxuICAgICAgICBcbnByaW50UmV3cml0ZXIgPSAodG9rZW5zKSAtPlxuICAgIFxuICAgIGZvciBpbmRleCBpbiBbMC4uLnRva2Vucy5sZW5ndGhdXG4gICAgICAgIHRva2VuID0gdG9rZW5zW2luZGV4XVxuICAgICAgICB0YWcgICA9IHRva2VuWzBdXG4gICAgICAgIHZhbHVlID0gdG9rZW5bMV1cbiAgICAgICAgIyBsb2cgdG9rZW5cbiAgICAgICAgc3dpdGNoIHRhZyBcbiAgICAgICAgICAgIHdoZW4gJ1RFUk1JTkFUT1InIHRoZW4gcHJpbnQgJ1xcbidcbiAgICAgICAgICAgIHdoZW4gJ0lOREVOVCcgICAgIHRoZW4gcHJpbnQgJ1xcbiAgICAnXG4gICAgICAgICAgICB3aGVuICdPVVRERU5UJyAgICB0aGVuIHByaW50ICdcXG4nXG4gICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgIHByaW50IFwiI3t2YWx1ZX1cIlxuICAgICAgICAgICAgICAgIGlmIHRva2VuLnNwYWNlZCBhbmQgdG9rZW5zW2luZGV4KzFdWzBdIG5vdCBpbiBbJ0NBTExfU1RBUlQnLCAnQ0FMTF9FTkQnXVxuICAgICAgICAgICAgICAgICAgICBwcmludCAnICdcbiAgICAgICAgICAgIFxudmVyc2lvbiA9IC0+IHByaW50TGluZSBcIiN7S29mZmVlLlZFUlNJT059XCJcbnVzYWdlICAgPSAtPiBcblxuICAgIGxpbmVzID0gW1wiI3tncmF5ICdVc2FnZTonfSAje3llbGxvdyAna29mZmVlJ30gI3tncmF5ICdbb3B0aW9uc10nfSBwYXRoL3RvL3NjcmlwdCAje2dyYXkgJ1tvcHRpb25zXSd9XFxuXCJdXG4gICAgXG4gICAgcnVsZXMgPSBTV0lUQ0hFUy5tYXAgKHJ1bGUpIC0+XG4gICAgICAgIFtzaG9ydCwgbG9uZywgZGVzY3JpcHRpb25dID0gcnVsZVxuICAgICAgICBsb25nRmxhZyA9IGxvbmcubWF0Y2goL14oLS1cXHdbXFx3XFwtXSopLylbMV1cbiAgICAgICAgY3Nob3J0ICAgPSBpZiBzaG9ydCB0aGVuIGdyYXkoc2hvcnRbMF0pICsgYm9sZChncmF5KHNob3J0WzEuLl0pKSArICcgICcgZWxzZSAnICAgICdcbiAgICAgICAgY2xvbmcgICAgPSBwYWQgbG9uZywgMjBcbiAgICAgICAgY2xvbmcgICAgPSBncmF5KGNsb25nWzAuLjFdKSArIGJvbGQod2hpdGUoY2xvbmdbMi4uXS5zcGxpdCgnICcpWzBdKSkgKyAnICcgKyBib2xkKGJsdWVCcmlnaHQoY2xvbmdbMi4uXS5zcGxpdCgnICcpWzEuLl0uam9pbignICcpKSlcbiAgICAgICAgbGluZXMucHVzaCAnICAgICcgKyBjc2hvcnQgKyBjbG9uZyArIGdyYXkgZGVzY3JpcHRpb25cbiAgICAgICAgXG4gICAgbGluZXMucHVzaCBncmF5ICdcXG5JZiBjYWxsZWQgd2l0aG91dCBhIHNjcmlwdCwgdGhlIGludGVyYWN0aXZlIFJFUEwgd2lsbCBiZSBzdGFydGVkJ1xuICAgICAgICBcbiAgICBsb2cgXCJcXG4jeyBsaW5lcy5qb2luKCdcXG4nKSB9XFxuXCJcbiAgICAgICAgIl19
//# sourceURL=../coffee/command.coffee