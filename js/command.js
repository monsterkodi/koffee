// koffee 0.42.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBaUJBLEVBQUEsR0FBbUIsT0FBQSxDQUFRLElBQVI7O0FBQ25CLElBQUEsR0FBbUIsT0FBQSxDQUFRLE1BQVI7O0FBQ25CLElBQUEsR0FBbUIsT0FBQSxDQUFRLE1BQVI7O0FBQ25CLE9BQUEsR0FBbUIsT0FBQSxDQUFRLFdBQVI7O0FBQ25CLE1BQUEsR0FBbUIsT0FBQSxDQUFRLFVBQVI7O0FBQ25CLE1BQW1CLE9BQUEsQ0FBUSxlQUFSLENBQW5CLEVBQUUsaUJBQUYsRUFBUzs7QUFDUCxlQUFpQixPQUFBLENBQVEsUUFBUjs7QUFFbkIsYUFBQSxHQUFtQixJQUFJLENBQUMsR0FBTCxLQUFZOztBQUUvQixPQUFPLENBQUMsTUFBUixDQUFlLE1BQWYsRUFBdUIsSUFBSSxZQUEzQjs7QUFDQSxPQUFPLENBQUMsTUFBUixDQUFBOztBQUVBLE9BQTRCLE9BQUEsQ0FBUSxZQUFSLENBQTVCLEVBQUUsd0JBQUYsRUFBWTs7QUFFVixtQ0FBRixFQUFnQiwyQkFBaEIsRUFBMEIsNkJBQTFCLEVBQXFDLHFCQUFyQyxFQUE0Qzs7QUFFNUMsS0FBQSxHQUFZLE9BQU8sQ0FBQzs7QUFDcEIsS0FBQSxHQUFZLFNBQUMsSUFBRDtXQUFVLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBZixDQUFxQixJQUFyQjtBQUFWOztBQUNaLFNBQUEsR0FBWSxTQUFDLElBQUQ7V0FBVSxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQWYsQ0FBcUIsSUFBQSxHQUFPLElBQTVCO0FBQVY7O0FBQ1osU0FBQSxHQUFZLFNBQUMsSUFBRDtXQUFVLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBZixDQUFxQixJQUFBLEdBQU8sSUFBNUI7QUFBVjs7QUFDWixNQUFBLEdBQVksU0FBQyxJQUFEO1dBQVUsUUFBUSxDQUFDLElBQVQsQ0FBYyxJQUFkO0FBQVY7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LEdBQWMsS0FBSCxHQUFjLElBQUEsQ0FBSyxLQUFNLENBQUEsQ0FBQSxDQUFYLENBQUEsR0FBaUIsSUFBQSxDQUFLLElBQUEsQ0FBSyxLQUFNLFNBQVgsQ0FBTCxDQUFqQixHQUEwQyxJQUF4RCxHQUFrRTtRQUM3RSxLQUFBLEdBQVcsR0FBQSxDQUFJLElBQUosRUFBVSxFQUFWO1FBQ1gsS0FBQSxHQUFXLElBQUEsQ0FBSyxLQUFNLFlBQVgsQ0FBQSxHQUFvQixJQUFBLENBQUssS0FBQSxDQUFNLEtBQU0sU0FBSSxDQUFDLEtBQVgsQ0FBaUIsR0FBakIsQ0FBc0IsQ0FBQSxDQUFBLENBQTVCLENBQUwsQ0FBcEIsR0FBNEQsR0FBNUQsR0FBa0UsSUFBQSxDQUFLLFVBQUEsQ0FBVyxLQUFNLFNBQUksQ0FBQyxLQUFYLENBQWlCLEdBQWpCLENBQXNCLFNBQUksQ0FBQyxJQUEzQixDQUFnQyxHQUFoQyxDQUFYLENBQUw7ZUFDN0UsS0FBSyxDQUFDLElBQU4sQ0FBVyxNQUFBLEdBQVMsTUFBVCxHQUFrQixLQUFsQixHQUEwQixJQUFBLENBQUssV0FBTCxDQUFyQztJQU5pQixDQUFiO0lBUVIsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFBLENBQUssb0VBQUwsQ0FBWDtXQUFvRixPQUFBLENBRXBGLEdBRm9GLENBRWhGLElBQUEsR0FBSSxDQUFFLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWCxDQUFGLENBQUosR0FBd0IsSUFGd0Q7QUFaOUUiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICBcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiMjI1xuXG4jIGhhbmRsZSB2YXJpb3VzIHRhc2tzOiBcbiNcbiMgICAtIGNvbXBpbGUgYW5kIHNhdmUgaW50byBgLmpzYCBmaWxlcyBcbiMgICAtIGNvbXBpbGUgYW5kIHByaW50IHRvIHN0ZG91dCBcbiMgICAtIHJlY29tcGlsZSBpZiB0aGUgc291cmNlIGNoYW5nZXNcbiMgICAtIHByaW50IGxleGVyIHRva2Vuc1xuIyAgIC0gcHJpbnQgYSBzeW50YXggdHJlZVxuIyAgIC0gbGF1bmNoIGEgUkVQTFxuXG5mcyAgICAgICAgICAgICAgID0gcmVxdWlyZSAnZnMnXG5wYXRoICAgICAgICAgICAgID0gcmVxdWlyZSAncGF0aCdcbm5vcHQgICAgICAgICAgICAgPSByZXF1aXJlICdub3B0J1xuaGVscGVycyAgICAgICAgICA9IHJlcXVpcmUgJy4vaGVscGVycydcbktvZmZlZSAgICAgICAgICAgPSByZXF1aXJlICcuL2tvZmZlZSdcbnsgc3Bhd24sIGV4ZWMgfSAgPSByZXF1aXJlICdjaGlsZF9wcm9jZXNzJ1xueyBFdmVudEVtaXR0ZXIgfSA9IHJlcXVpcmUgJ2V2ZW50cydcblxudXNlV2luUGF0aFNlcCAgICA9IHBhdGguc2VwIGlzICdcXFxcJ1xuXG5oZWxwZXJzLmV4dGVuZCBLb2ZmZWUsIG5ldyBFdmVudEVtaXR0ZXIgIyBBbGxvdyBlbWl0dGluZyBOb2RlIGV2ZW50c1xuaGVscGVycy5jb2xvcnMoKVxuXG57IEZFQVRVUkVTLCBsb2dGZWF0dXJlcyB9ID0gcmVxdWlyZSAnLi9mZWF0dXJlcydcblxueyBiYXNlRmlsZU5hbWUsIGlzQ29mZmVlLCBzdHJpbmdpZnksIG1lcmdlLCBwYWQgfSA9IGhlbHBlcnNcblxuZXJyb3IgICAgID0gY29uc29sZS5lcnJvclxucHJpbnQgICAgID0gKGxpbmUpIC0+IHByb2Nlc3Muc3Rkb3V0LndyaXRlIGxpbmVcbnByaW50TGluZSA9IChsaW5lKSAtPiBwcm9jZXNzLnN0ZG91dC53cml0ZSBsaW5lICsgJ1xcbicgIyA/Pz9cbnByaW50V2FybiA9IChsaW5lKSAtPiBwcm9jZXNzLnN0ZGVyci53cml0ZSBsaW5lICsgJ1xcbicgIyA/Pz9cbmhpZGRlbiAgICA9IChmaWxlKSAtPiAvXlxcLnx+JC8udGVzdCBmaWxlXG5cblNXSVRDSEVTID0gW1xuICAgIFsnLWInICctLWJhcmUnICAgICAgICAgICAgICAnY29tcGlsZSB3aXRob3V0IGEgdG9wLWxldmVsIGZ1bmN0aW9uIHdyYXBwZXInICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1jJyAnLS1jb21waWxlJyAgICAgICAgICAgJ2NvbXBpbGUgdG8gSmF2YVNjcmlwdCBhbmQgc2F2ZSBhcyAuanMgZmlsZXMnICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctZScgJy0tZXZhbCBTVFJJTkcnICAgICAgICdldmFsdWF0ZSBhIHN0cmluZyBhbmQgcHJpbnQgdGhlIHJlc3VsdCcgICAgICAgICAgICAgICBbU3RyaW5nLCBBcnJheV0gXVxuICAgIFsnLWYnICctLWZlYXR1cmVzJyAgICAgICAgICAnbGlzdCBhdmFpbGFibGUgZmVhdHVyZXMnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJycgICAnLS1uby1gZmVhdHVyZScgICAgICAgJ2Rpc2FibGUgYSBmZWF0dXJlLCBlLmcuIC0tbm8tbmVnYXRpdmUtaW5kZXgnICAgICAgICAgICBudWxsICAgICAgICAgICBdXG4gICAgWyctaCcgJy0taGVscCcgICAgICAgICAgICAgICdkaXNwbGF5IHRoaXMgaGVscCBtZXNzYWdlJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLWonICctLWpzJyAgICAgICAgICAgICAgICAncHJpbnQgb3V0IHRoZSBjb21waWxlZCBKYXZhU2NyaXB0JyAgICAgICAgICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1tJyAnLS1tYXAnICAgICAgICAgICAgICAgJ2dlbmVyYXRlIHNvdXJjZSBtYXAgYW5kIHNhdmUgYXMgLmpzLm1hcCBmaWxlcycgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctTScgJy0taW5saW5lLW1hcCcgICAgICAgICdnZW5lcmF0ZSBzb3VyY2UgbWFwIGFuZCBpbmNsdWRlIGl0IGRpcmVjdGx5IGluIG91dHB1dCcgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLW4nICctLW5vb3AnICAgICAgICAgICAgICAnZG9lcyBub3RoaW5nLCBmb3IgZGVidWdnaW5nIHB1cnBvc2VzJyAgICAgICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1vJyAnLS1vdXRwdXQgRElSJyAgICAgICAgJ3NldCB0aGUgb3V0cHV0IGRpcmVjdG9yeSBmb3IgY29tcGlsZWQgSmF2YVNjcmlwdCcgICAgICBTdHJpbmcgICAgICAgICBdXG4gICAgWyctUCcgJy0tcGFyc2UnICAgICAgICAgICAgICdwcmludCBvdXQgdGhlIHBhcnNlIHRyZWUgdGhhdCB0aGUgcGFyc2VyIHByb2R1Y2VzJyAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLXInICctLXJlcXVpcmUgTU9EVUxFJyAgICAncmVxdWlyZSB0aGUgZ2l2ZW4gbW9kdWxlIGJlZm9yZSBldmFsIG9yIFJFUEwnICAgICAgICAgW1N0cmluZywgQXJyYXldIF1cbiAgICBbJy1DJyAnLS1jb2ZmZWUnICAgICAgICAgICAgJ3ByaW50IHRoZSB0b2tlbiBzdHJlYW0gYXMgQ29mZmVlU2NyaXB0JyAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctcycgJy0tc3RkaW8nICAgICAgICAgICAgICdsaXN0ZW4gZm9yIGFuZCBjb21waWxlIHNjcmlwdHMgb3ZlciBzdGRpbycgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLXQnICctLXRlc3QnICAgICAgICAgICAgICAnY29tcGlsZSBhbmQgcnVuIHRoZSBAdGVzdCBjb2RlJyAgICAgICAgICAgICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1UJyAnLS10b2tlbnMnICAgICAgICAgICAgJ3ByaW50IG91dCB0aGUgdG9rZW5zIHRoYXQgdGhlIGxleGVyL3Jld3JpdGVyIHByb2R1Y2UnICBCb29sZWFuICAgICAgICBdXG4gICAgWyctdicgJy0tdmVyc2lvbicgICAgICAgICAgICdkaXNwbGF5IHRoZSB2ZXJzaW9uIG51bWJlcicgICAgICAgICAgICAgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLXcnICctLXdhdGNoJyAgICAgICAgICAgICAnd2F0Y2ggc2NyaXB0cyBmb3IgY2hhbmdlcyBhbmQgcmVydW4gY29tbWFuZHMnICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbl1cblxub3B0cyA9IHt9XG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgIFxuIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgXG5cbnBhcnNlT3B0aW9ucyA9IC0+XG5cbiAgICBrbm93biA9IERlYnVnOkJvb2xlYW5cbiAgICBzaG9ydCA9IEQ6Jy0tRGVidWcnIHA6Jy0tanMnXG4gICAgU1dJVENIRVMubWFwIChzKSAtPiBsID0gc1sxXS5zcGxpdCgnICcpWzBdWzIuLl07IGtub3duW2xdID0gc1szXSBpZiBzWzNdOyBzaG9ydFtzWzBdWzFdXSA9IFwiLS0je2x9XCIgaWYgc1swXSE9JydcbiAgICBGRUFUVVJFUy5tYXAgKGYpIC0+IGtub3duW2YubGFnXSA9IEJvb2xlYW5cbiAgICBcbiAgICBvID0gb3B0cyA9IG5vcHQga25vd24sIHNob3J0XG4gICAgICAgIFxuICAgIG8uY29tcGlsZSAgb3I9ICEhby5vdXRwdXRcbiAgICBvLmFyZ3VtZW50cyAgPSBvLmFyZ3YucmVtYWluXG4gICAgby5wcmVsdWRlICAgID0gbWFrZVByZWx1ZGUgby5yZXF1aXJlIGlmIG8ucmVxdWlyZVxuICAgIG8ucnVuICAgICAgICA9IG5vdCAoby5jb21waWxlIG9yIG8uanMgb3Igby5tYXAgb3Igby50b2tlbnMgb3Igby5wYXJzZSlcbiAgICBvLmpzICAgICAgICAgPSAhIShvLmpzIG9yIG8uZXZhbCBvciBvLnN0ZGlvIGFuZCBvLmNvbXBpbGUpICMganMgb3V0cHV0IGlzIHBhc3NlZCB0byBldmFsIGFuZCBzdGRpbyBjb21waWxlXG4gICAgXG4gICAgby5mZWF0dXJlID0ge31cbiAgICBGRUFUVVJFUy5tYXAgKGYpIC0+IG8uZmVhdHVyZVtmLmtleV0gPSBvW2YuZmxhZ10gPyB0cnVlOyBkZWxldGUgb1tmLmZsYWddXG4gICAgXG4gICAgaWYgby5EZWJ1Z1xuICAgICAgICBkZWxldGUgby5hcmd2XG4gICAgICAgIGxvZyBzdHJpbmdpZnkgb1xuXG4jIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiMgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcblxucnVuID0gLT5cbiAgICBcbiAgICBwYXJzZU9wdGlvbnMoKVxuICAgIFxuICAgIGlmIG9wdHMuZmVhdHVyZS5jb2xvciA9PSBmYWxzZVxuICAgICAgICBjb2xvcmV0dGUub3B0aW9ucy5lbmFibGVkID0gZmFsc2VcbiAgICAgICAgXG4gICAgcmV0dXJuIGxvZ0ZlYXR1cmVzKCkgIGlmIG9wdHMuZmVhdHVyZXNcbiAgICByZXR1cm4gdXNhZ2UoKSAgICAgICAgaWYgb3B0cy5oZWxwXG4gICAgcmV0dXJuIHZlcnNpb24oKSAgICAgIGlmIG9wdHMudmVyc2lvblxuICAgIHJldHVybiBzdGFydFJlcGwoKSAgICBpZiBvcHRzLmludGVyYWN0aXZlXG4gICAgcmV0dXJuIGNvbXBpbGVTdGRpbygpIGlmIG9wdHMuc3RkaW9cbiAgICBpZiBvcHRzLmV2YWxcbiAgICAgICAgZm9yIGV2YWwgaW4gb3B0cy5ldmFsXG4gICAgICAgICAgICBjb21waWxlU2NyaXB0IGV2YWxcbiAgICAgICAgcmV0dXJuXG4gICAgcmV0dXJuIHN0YXJ0UmVwbCgpICAgIGlmIG5vdCBvcHRzLmFyZ3VtZW50cy5sZW5ndGhcbiAgICBcbiAgICBsaXRlcmFscyA9IGlmIG5vdCBvcHRzLndhdGNoIGFuZCBub3Qgb3B0cy5jb21waWxlIHRoZW4gb3B0cy5hcmd1bWVudHMuc3BsaWNlIDEgZWxzZSBbXVxuICAgIFxuICAgIHByb2Nlc3MuYXJndiA9IHByb2Nlc3MuYXJndlswLi4xXS5jb25jYXQgbGl0ZXJhbHNcbiAgICBwcm9jZXNzLmFyZ3ZbMF0gPSAna29mZmVlJ1xuXG4gICAgb3B0cy5vdXRwdXQgPSBwYXRoLnJlc29sdmUgb3B0cy5vdXRwdXQgaWYgb3B0cy5vdXRwdXRcbiAgICBmb3Igc291cmNlIGluIG9wdHMuYXJndW1lbnRzXG4gICAgICAgIHNvdXJjZSA9IHBhdGgucmVzb2x2ZSBzb3VyY2VcbiAgICAgICAgXG4gICAgICAgIGlmIG9wdHMud2F0Y2hcbiAgICAgICAgICAgIHdhdGNoUGF0aCBzb3VyY2VcbiAgICAgICAgZWxzZSAgICAgXG4gICAgICAgICAgICBjb21waWxlUGF0aCBzb3VyY2UsIHRvcExldmVsOnllc1xuXG5leHBvcnRzLnJ1biA9IHJ1blxuICAgICAgICBcbnN0YXJ0UmVwbCA9IC0+XG4gICAgXG4gICAgIyBNYWtlIHRoZSBSRVBMIHVzZSB0aGUgZ2xvYmFsIGNvbnRleHQgc28gYXMgdG8gXG4gICAgIyAgIChhKSBiZSBjb25zaXN0ZW50IHdpdGggdGhlIGBub2RlYCBSRVBMIGFuZCwgdGhlcmVmb3JlLCBcbiAgICAjICAgKGIpIG1ha2UgcGFja2FnZXMgdGhhdCBtb2RpZnkgbmF0aXZlIHByb3RvdHlwZXMgKHN1Y2ggYXMgJ2NvbG9ycycgYW5kICdzdWdhcicpIHdvcmsgYXMgZXhwZWN0ZWQuXG4gICAgXG4gICAgcmVwbENsaU9wdHMgPSB1c2VHbG9iYWw6IHllc1xuICAgIHJlcGxDbGlPcHRzLnByZWx1ZGUgPSBvcHRzLnByZWx1ZGVcbiAgICByZXF1aXJlKCcuL3JlcGwnKS5zdGFydCByZXBsQ2xpT3B0c1xuXG5tYWtlUHJlbHVkZSA9IChyZXF1aXJlcykgLT5cbiAgICBcbiAgICByZXF1aXJlcy5tYXAgKG1vZHVsZSkgLT5cbiAgICAgICAgW18sIG5hbWUsIG1vZHVsZV0gPSBtYXRjaCBpZiBtYXRjaCA9IG1vZHVsZS5tYXRjaCgvXiguKik9KC4qKSQvKVxuICAgICAgICBuYW1lIHx8PSBiYXNlRmlsZU5hbWUgbW9kdWxlLCB5ZXMsIHVzZVdpblBhdGhTZXBcbiAgICAgICAgXCIje25hbWV9ID0gcmVxdWlyZSgnI3ttb2R1bGV9JylcIlxuICAgIC5qb2luICc7J1xuXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuXG4jIENvbXBpbGUgYSBzY3JpcHQgb3IgYSBkaXJlY3RvcnkuIElmIGEgZGlyZWN0b3J5IGlzIHBhc3NlZCwgcmVjdXJzaXZlbHkgY29tcGlsZSBhbGwgJy5jb2ZmZWUnIGFuZCAnLmtvZmZlZScgZmlsZXMuXG5cbmNvbXBpbGVQYXRoID0gKHNvdXJjZSwgdG9wTGV2ZWw6dG9wTGV2ZWw9bm8pIC0+XG5cbiAgICByZXR1cm4gaWYgbm90IHRvcExldmVsIGFuZCBoaWRkZW4gc291cmNlXG4gICAgICAgICAgICAgIFxuICAgIHRyeVxuICAgICAgICBzdGF0cyA9IGZzLnN0YXRTeW5jIHNvdXJjZVxuICAgIGNhdGNoIGVyclxuICAgICAgICBpZiBlcnIuY29kZSBpcyAnRU5PRU5UJ1xuICAgICAgICAgICAgZXJyb3IgXCJDb21tYW5kLmNvbXBpbGVQYXRoIGNhbid0IHN0YXQgJyN7c291cmNlfSdcIlxuICAgICAgICAgICAgcHJvY2Vzcy5leGl0IDFcbiAgICAgICAgdGhyb3cgZXJyXG4gICAgICAgIFxuICAgIGlmIHN0YXRzLmlzRGlyZWN0b3J5KClcbiAgICAgICAgXG4gICAgICAgIGlmIHBhdGguYmFzZW5hbWUoc291cmNlKSBpbiBbJ25vZGVfbW9kdWxlcycgJy5naXQnXVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgb3B0cy5ydW5cbiAgICAgICAgICAgIGNvbXBpbGVQYXRoIGZpbmREaXJlY3RvcnlJbmRleChzb3VyY2UpLCB0b3BMZXZlbDp0b3BMZXZlbFxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgIFxuICAgICAgICBsb2cgJ0NvbW1hbmQuY29tcGlsZVBhdGggZGlyOicsIHNvdXJjZSBpZiBvcHRzLkRlYnVnXG4gICAgICAgIFxuICAgICAgICB0cnlcbiAgICAgICAgICAgIGZpbGVzID0gZnMucmVhZGRpclN5bmMgc291cmNlXG4gICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgaWYgZXJyLmNvZGUgaXMgJ0VOT0VOVCcgdGhlbiByZXR1cm4gXG4gICAgICAgICAgICB0aHJvdyBlcnJcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgZmlsZSBpbiBmaWxlc1xuICAgICAgICAgICAgY29tcGlsZVBhdGggcGF0aC5qb2luIHNvdXJjZSwgZmlsZVxuICAgICAgICAgICAgXG4gICAgZWxzZSBpZiB0b3BMZXZlbCBvciBpc0NvZmZlZSBzb3VyY2VcbiAgICAgICAgXG4gICAgICAgIHRyeVxuICAgICAgICAgICAgY29kZSA9IGZzLnJlYWRGaWxlU3luYyBzb3VyY2VcbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICBpZiBlcnIuY29kZSBpcyAnRU5PRU5UJyB0aGVuIHJldHVyblxuICAgICAgICAgICAgdGhyb3cgZXJyXG4gICAgICAgIFxuICAgICAgICBsb2cgJ0NvbW1hbmQuY29tcGlsZVBhdGggZmlsZTonLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuICAgICAgICAgICAgXG4gICAgICAgIGNvbXBpbGVTY3JpcHQgY29kZS50b1N0cmluZygpLCBzb3VyY2VcbiAgICAgICAgXG5maW5kRGlyZWN0b3J5SW5kZXggPSAoc291cmNlKSAtPlxuXG4gICAgZm9yIGV4dCBpbiBLb2ZmZWUuRklMRV9FWFRFTlNJT05TXG4gICAgICAgIGluZGV4ID0gcGF0aC5qb2luIHNvdXJjZSwgXCJpbmRleCN7ZXh0fVwiXG4gICAgICAgIHRyeVxuICAgICAgICAgICAgcmV0dXJuIGluZGV4IGlmIChmcy5zdGF0U3luYyBpbmRleCkuaXNGaWxlKClcbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICB0aHJvdyBlcnIgdW5sZXNzIGVyci5jb2RlIGlzICdFTk9FTlQnXG4gICAgZXJyb3IgXCJNaXNzaW5nIGluZGV4LmNvZmZlZSBpbiAje3NvdXJjZX1cIlxuICAgIHByb2Nlc3MuZXhpdCAxXG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAgICAgMDAwICAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAgMDAwICAgICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAgMDAwICAgICBcblxuIyBDb21waWxlIGEgc2luZ2xlIHNvdXJjZSBzY3JpcHQsIGNvbnRhaW5pbmcgdGhlIGdpdmVuIGNvZGUsIGFjY29yZGluZyB0byB0aGUgcmVxdWVzdGVkIG9wdGlvbnMuIFxuIyBJZiBldmFsdWF0aW5nIHRoZSBzY3JpcHQgZGlyZWN0bHkgc2V0cyBgX19maWxlbmFtZWAsIGBfX2Rpcm5hbWVgIGFuZCBgbW9kdWxlLmZpbGVuYW1lYCB0byBiZSBjb3JyZWN0IHJlbGF0aXZlIHRvIHRoZSBzY3JpcHQncyBwYXRoLlxuXG5jb21waWxlU2NyaXB0ID0gKGNvZGUsIHNvdXJjZT1udWxsKSAtPlxuICAgIFxuICAgIG8gPSBvcHRzXG4gICAgb3B0aW9ucyA9IGNvbXBpbGVPcHRpb25zIHNvdXJjZVxuICAgIFxuICAgIHRyeVxuICAgICAgICB0ID0gdGFzayA9IHtzb3VyY2UsIGNvZGUsIG9wdGlvbnN9XG4gICAgICAgIEtvZmZlZS5lbWl0ICdjb21waWxlJywgdGFza1xuICAgICAgICBcbiAgICAgICAgaWYgby50b2tlbnNcbiAgICAgICAgICAgIHByaW50VG9rZW5zIEtvZmZlZS50b2tlbnMgdC5jb2RlLCB0Lm9wdGlvbnNcbiAgICAgICAgZWxzZSBpZiBvLmNvZmZlZVxuICAgICAgICAgICAgcHJpbnRSZXdyaXRlciBLb2ZmZWUudG9rZW5zIHQuY29kZSwgdC5vcHRpb25zXG4gICAgICAgIGVsc2UgaWYgby5wYXJzZVxuICAgICAgICAgICAgcHJpbnRMaW5lIEtvZmZlZS5ub2Rlcyh0LmNvZGUsIHQub3B0aW9ucykudG9TdHJpbmcoKS50cmltKClcbiAgICAgICAgZWxzZSBpZiBvLnJ1blxuICAgICAgICAgICAgS29mZmVlLnJlZ2lzdGVyKClcbiAgICAgICAgICAgIEtvZmZlZS5ldmFsIG9wdHMucHJlbHVkZSwgdC5vcHRpb25zIGlmIG9wdHMucHJlbHVkZVxuICAgICAgICAgICAgdC5vcHRpb25zLmZpbGVuYW1lID89IG9wdGlvbnMuc291cmNlXG4gICAgICAgICAgICBpZiBvcHRzLm5vb3AgdGhlbiBsb2cgXCJub29wIHJ1biAje3NvdXJjZX1cIlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEtvZmZlZS5ydW4gdC5jb2RlLCB0Lm9wdGlvbnNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgY29tcGlsZWQgPSBLb2ZmZWUuY29tcGlsZSB0LmNvZGUsIHQub3B0aW9uc1xuICAgICAgICAgICAgdC5vdXRwdXQgPSBjb21waWxlZFxuICAgICAgICAgICAgaWYgby5tYXBcbiAgICAgICAgICAgICAgICB0Lm91dHB1dCA9IGNvbXBpbGVkLmpzXG4gICAgICAgICAgICAgICAgdC5zb3VyY2VNYXAgPSBjb21waWxlZC52M1NvdXJjZU1hcFxuXG4gICAgICAgICAgICBLb2ZmZWUuZW1pdCAnc3VjY2VzcycsIHRhc2tcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgby5qc1xuICAgICAgICAgICAgICAgIGlmIG9wdHMubm9vcCB0aGVuIGxvZyBcIm5vb3AganMgI3tzb3VyY2V9XCJcbiAgICAgICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgICAgICBwcmludExpbmUgdC5vdXRwdXQudHJpbSgpXG4gICAgICAgICAgICBlbHNlIGlmIG8uY29tcGlsZSBvciBvLm1hcFxuICAgICAgICAgICAgICAgIGlmIG9wdHMubm9vcCB0aGVuIGxvZyBcIm5vb3Agd3JpdGUgI3tvcHRpb25zLmpzUGF0aH1cIlxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVKcyB0LnNvdXJjZSwgdC5vdXRwdXQsIG9wdGlvbnMuanNQYXRoLCB0LnNvdXJjZU1hcFxuICAgIGNhdGNoIGVyclxuICAgICAgICBcbiAgICAgICAgS29mZmVlLmVtaXQgJ2ZhaWx1cmUnLCBlcnIsIHRhc2tcbiAgICAgICAgcmV0dXJuIGlmIEtvZmZlZS5saXN0ZW5lcnMoJ2ZhaWx1cmUnKS5sZW5ndGhcblxuICAgICAgICBtZXNzYWdlID0gZXJyLm1lc3NhZ2VcbiAgICAgICAgXG4gICAgICAgIGlmIGVyciBpbnN0YW5jZW9mIFN5bnRheEVycm9yXG4gICAgICAgICAgICBwcmludExpbmUgbWVzc2FnZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwcmludExpbmUgZXJyLnN0YWNrXG4gICAgICAgIFxuICAgICAgICBpZiBvLndhdGNoIG9yIG8uZXZhbFxuICAgICAgICAgICAgcHJpbnQgJ1xceDA3JyAjIGJlbGxcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcHJvY2Vzcy5leGl0IDFcblxuY29tcGlsZU9wdGlvbnMgPSAoc291cmNlKSAtPiAjIFRoZSBjb21waWxlLXRpbWUgb3B0aW9ucyB0byBwYXNzIHRvIHRoZSBjb21waWxlci5cbiAgICBcbiAgICBjb3B0cyA9ICAgICAgICAgXG4gICAgICAgIHNvdXJjZTogICAgc291cmNlXG4gICAgICAgIHNvdXJjZU1hcDogb3B0cy5tYXBcbiAgICAgICAgaW5saW5lTWFwOiBvcHRzWydpbmxpbmUtbWFwJ11cbiAgICAgICAgZmVhdHVyZTogICBvcHRzLmZlYXR1cmVcbiAgICAgICAgYmFyZTogICAgICBvcHRzLmJhcmVcbiAgICAgICAgdGVzdDogICAgICBvcHRzLnRlc3RcbiAgICAgICAgZG9jOiAgICAgICBvcHRzLmRvY1xuICAgICAgICBEZWJ1ZzogICAgIG9wdHMuRGVidWdcblxuICAgIGlmIHNvdXJjZVxuICAgICAgICBcbiAgICAgICAgY3dkID0gcHJvY2Vzcy5jd2QoKVxuICAgICAgICBqc1BhdGggPSBvdXRwdXRQYXRoIHNvdXJjZSwgJy5qcydcbiAgICAgICAganNEaXIgPSBwYXRoLmRpcm5hbWUganNQYXRoXG4gICAgICAgIGNvcHRzID0gbWVyZ2UgY29wdHMsIHtcbiAgICAgICAgICAgIGpzUGF0aFxuICAgICAgICAgICAgc291cmNlUm9vdDogcGF0aC5yZWxhdGl2ZSBqc0RpciwgY3dkXG4gICAgICAgICAgICBzb3VyY2VGaWxlczogW3BhdGgucmVsYXRpdmUgY3dkLCBzb3VyY2VdXG4gICAgICAgICAgICBnZW5lcmF0ZWRGaWxlOiBiYXNlRmlsZU5hbWUoanNQYXRoLCBubywgdXNlV2luUGF0aFNlcClcbiAgICAgICAgfVxuICAgIGNvcHRzXG4gICAgICAgICAgICBcbiMgQXR0YWNoIHRoZSBhcHByb3ByaWF0ZSBsaXN0ZW5lcnMgdG8gY29tcGlsZSBzY3JpcHRzIGluY29taW5nIG92ZXIgKipzdGRpbioqLCBhbmQgd3JpdGUgdGhlbSBiYWNrIHRvICoqc3Rkb3V0KiouXG5cbmNvbXBpbGVTdGRpbyA9IC0+XG4gICAgXG4gICAgYnVmZmVycyA9IFtdXG4gICAgc3RkaW4gPSBwcm9jZXNzLm9wZW5TdGRpbigpXG4gICAgc3RkaW4ub24gJ2RhdGEnLCAoYnVmZmVyKSAtPiBidWZmZXJzLnB1c2ggYnVmZmVyIGlmIGJ1ZmZlclxuICAgIHN0ZGluLm9uICdlbmQnLCAtPiBjb21waWxlU2NyaXB0IEJ1ZmZlci5jb25jYXQoYnVmZmVycykudG9TdHJpbmcoKVxuXG4jIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwMDAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuIyAwMCAgICAgMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICBcblxud2F0Y2hQYXRoID0gKHNvdXJjZSkgLT4gIyBXYXRjaCBhIGZpbGUgb3IgZGlyZWN0b3J5LlxuICAgIFxuICAgIHRyeVxuICAgICAgICBzdGF0cyA9IGZzLnN0YXRTeW5jIHNvdXJjZVxuICAgIGNhdGNoIGVyclxuICAgICAgICByZXR1cm4gaWYgZXJyLmNvZGUgaXMgJ0VOT0VOVCdcbiAgICAgICAgcmV0dXJuIGVycm9yIFwiQ29tbWFuZC53YXRjaFBhdGggY2FuJ3Qgc3RhdCAnI3tzb3VyY2V9J1wiLCBlcnJcbiAgICAgICAgICAgICAgICBcbiAgICBpZiBzdGF0cy5pc0RpcmVjdG9yeSgpXG4gICAgICAgIHdhdGNoRGlyIHNvdXJjZVxuICAgIGVsc2VcbiAgICAgICAgd2F0Y2hGaWxlIHNvdXJjZVxuXG4jIFdhdGNoIGEgc2luZ2xlIGZpbGUgdXNpbmcgYGZzLndhdGNoYCwgcmVjb21waWxpbmcgaXQgZXZlcnkgdGltZSB0aGUgZmlsZSBpcyB1cGRhdGVkLlxuIyBNYXkgYmUgdXNlZCBpbiBjb21iaW5hdGlvbiB3aXRoIG90aGVyIG9wdGlvbnMsIHN1Y2ggYXMgYC0tcHJpbnRgLlxuICAgICAgICBcbndhdGNoRmlsZSA9IChzb3VyY2UpIC0+XG4gICAgXG4gICAgcmV0dXJuIGlmIG5vdCBpc0NvZmZlZSBzb3VyY2VcbiAgICBcbiAgICBsb2cgJ0NvbW1hbmQud2F0Y2hGaWxlJywgc291cmNlIGlmIG9wdHMuRGVidWdcbiAgICBcbiAgICB3YXRjaGVyICAgICAgICA9IG51bGxcbiAgICBwcmV2U3RhdHMgICAgICA9IG51bGxcbiAgICBjb21waWxlVGltZW91dCA9IG51bGxcblxuICAgIHN0YXJ0V2F0Y2hlciA9IC0+XG4gICAgICAgIFxuICAgICAgICB3YXRjaGVyID0gZnMud2F0Y2ggc291cmNlXG4gICAgICAgIC5vbiAnY2hhbmdlJywgKGNoYW5nZSkgLT5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIGlmIGNoYW5nZSAhPSAnY2hhbmdlJ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBsb2cgJ0NvbW1hbmQud2F0Y2hGaWxlJywgY2hhbmdlLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQgY29tcGlsZVRpbWVvdXRcbiAgICAgICAgICAgIGNvbXBpbGVUaW1lb3V0ID0gd2FpdCAyNSwgLT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmcy5zdGF0IHNvdXJjZSwgKGVyciwgc3RhdHMpIC0+XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB3YXRjaGVyLmNsb3NlKCkgaWYgZXJyPy5jb2RlIGlzICdFTk9FTlQnXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnJvciBlcnIgaWYgZXJyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpZiBwcmV2U3RhdHMgYW5kIHN0YXRzLm10aW1lLmdldFRpbWUoKSBpcyBwcmV2U3RhdHMubXRpbWUuZ2V0VGltZSgpIGFuZCBzdGF0cy5zaXplIGlzIHByZXZTdGF0cy5zaXplXG4gICAgICAgICAgICAgICAgICAgIHByZXZTdGF0cyA9IHN0YXRzXG4gICAgICAgICAgICAgICAgICAgIGZzLnJlYWRGaWxlIHNvdXJjZSwgKGVyciwgY29kZSkgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnJvciBlcnIgaWYgZXJyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2cgJ0NvbW1hbmQud2F0Y2hGaWxlIGNvbXBpbGUnLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tcGlsZVNjcmlwdCBjb2RlLnRvU3RyaW5nKCksIHNvdXJjZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIC5vbiAnZXJyb3InLCAoZXJyKSAtPlxuICAgICAgICAgICAgdGhyb3cgZXJyIHVubGVzcyBlcnIuY29kZSBpcyAnRVBFUk0nXG5cbiAgICB0cnlcbiAgICAgICAgc3RhcnRXYXRjaGVyKClcbiAgICBjYXRjaCBlcnJcbiAgICAgICAgZXJyb3IgZXJyXG5cbndhdGNoRGlyID0gKHNvdXJjZSkgLT5cbiAgICBcbiAgICBsb2cgJ0NvbW1hbmQud2F0Y2hEaXInLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuICAgIFxuICAgIHdhdGNoZXIgPSBudWxsXG5cbiAgICBzdGFydFdhdGNoZXIgPSAtPlxuXG4gICAgICAgIHRyeVxuICAgICAgICAgICAgZmlsZXMgPSBmcy5yZWFkZGlyU3luYyBzb3VyY2VcbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICByZXR1cm4gaWYgZXJyPy5jb2RlIGlzICdFTk9FTlQnXG4gICAgICAgICAgICB0aHJvdyBlcnJcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgZmlsZSBpbiBmaWxlc1xuICAgICAgICAgICAgY29udGludWUgaWYgZmlsZVswXSA9PSAnLidcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIGZpbGUgaW4gWydub2RlX21vZHVsZXMnXVxuICAgICAgICAgICAgd2F0Y2hQYXRoIHBhdGguam9pbiBzb3VyY2UsIGZpbGVcbiAgICAgICAgXG4gICAgICAgIHdhdGNoZXIgPSBmcy53YXRjaCBzb3VyY2VcbiAgICAgICAgLm9uICdlcnJvcicsIChlcnIpIC0+XG4gICAgICAgICAgICB0aHJvdyBlcnIgdW5sZXNzIGVyci5jb2RlIGlzICdFUEVSTSdcbiAgICAgICAgICAgIHdhdGNoZXIuY2xvc2UoKVxuICAgICAgICAub24gJ2NoYW5nZScsIChjaGFuZ2UsIHApIC0+XG4gICAgICAgICAgICBpZiBjaGFuZ2UgPT0gJ3JlbmFtZSdcbiAgICAgICAgICAgICAgICBsb2cgJ0NvbW1hbmQud2F0Y2hEaXInLCBjaGFuZ2UsIHBhdGguam9pbiBzb3VyY2UsIHAgaWYgb3B0cy5EZWJ1Z1xuICAgICAgICAgICAgICAgIHdhdGNoUGF0aCBwYXRoLmpvaW4gc291cmNlLCBwXG4gICAgICAgICAgICBcbiAgICB0cnlcbiAgICAgICAgc3RhcnRXYXRjaGVyKClcbiAgICBjYXRjaCBlcnJcbiAgICAgICAgcmV0dXJuIGlmIGVyci5jb2RlIGlzICdFTk9FTlQnXG4gICAgICAgIHRocm93IGVyclxuXG4jIEdldCB0aGUgY29ycmVzcG9uZGluZyBvdXRwdXQgSmF2YVNjcmlwdCBwYXRoIGZvciBhIHNvdXJjZSBmaWxlLlxuICAgIFxub3V0cHV0UGF0aCA9IChzb3VyY2UsIGV4dGVuc2lvbikgLT5cbiAgICBcbiAgICBiYXNlbmFtZSA9IGJhc2VGaWxlTmFtZSBzb3VyY2UsIHllcywgdXNlV2luUGF0aFNlcFxuICAgIGlmIG9wdHMub3V0cHV0XG4gICAgICAgIGRpciA9IG9wdHMub3V0cHV0XG4gICAgZWxzZVxuICAgICAgICBkaXIgPSBwYXRoLmRpcm5hbWUgc291cmNlXG4gICAgcGF0aC5qb2luIGRpciwgYmFzZW5hbWUgKyBleHRlbnNpb25cblxuIyBSZWN1cnNpdmVseSBta2RpciwgbGlrZSBgbWtkaXIgLXBgLlxuXG5ta2RpcnAgPSAoZGlyLCBmbikgLT5cbiAgICBtb2RlID0gMG83NzcgJiB+cHJvY2Vzcy51bWFzaygpXG5cbiAgICBkbyBta2RpcnMgPSAocCA9IGRpciwgZm4pIC0+XG4gICAgICAgIGZzLmV4aXN0cyBwLCAoZXhpc3RzKSAtPlxuICAgICAgICAgICAgaWYgZXhpc3RzXG4gICAgICAgICAgICAgICAgZm4oKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIG1rZGlycyBwYXRoLmRpcm5hbWUocCksIC0+XG4gICAgICAgICAgICAgICAgICAgIGZzLm1rZGlyIHAsIG1vZGUsIChlcnIpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm4gZXJyIGlmIGVyclxuICAgICAgICAgICAgICAgICAgICAgICAgZm4oKVxuXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgIDAwMCAgIDAwMDAwMDAgIFxuIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgICAgICAwMDAgIDAwMCAgICAgICBcbiMgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgICAgICAgMDAwICAwMDAwMDAwICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuIyAwMCAgICAgMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcblxuIyBXcml0ZSBvdXQgYSBKYXZhU2NyaXB0IHNvdXJjZSBmaWxlIHdpdGggdGhlIGNvbXBpbGVkIGNvZGUuIFxuIyBCeSBkZWZhdWx0LCBmaWxlcyBhcmUgd3JpdHRlbiBvdXQgaW4gYGN3ZGAgYXMgYC5qc2AgZmlsZXMgd2l0aCB0aGUgc2FtZSBuYW1lLCBidXQgdGhlIG91dHB1dCBkaXJlY3RvcnkgY2FuIGJlIGN1c3RvbWl6ZWQgd2l0aCBgLS1vdXRwdXRgLlxuIyBJZiBgZ2VuZXJhdGVkU291cmNlTWFwYCBpcyBwcm92aWRlZCwgdGhpcyB3aWxsIHdyaXRlIGEgYC5qcy5tYXBgIGZpbGUgaW50byB0aGUgc2FtZSBkaXJlY3RvcnkgYXMgdGhlIGAuanNgIGZpbGUuXG5cbndyaXRlSnMgPSAoc291cmNlLCBqcywganNQYXRoLCBnZW5lcmF0ZWRTb3VyY2VNYXAgPSBudWxsKSAtPlxuICAgIFxuICAgIHNvdXJjZU1hcFBhdGggPSBvdXRwdXRQYXRoIHNvdXJjZSwgJy5qcy5tYXAnXG4gICAganNEaXIgPSBwYXRoLmRpcm5hbWUganNQYXRoXG4gICAgY29tcGlsZSA9IC0+XG4gICAgICAgIGlmIG9wdHMuY29tcGlsZVxuICAgICAgICAgICAganMgPSAnICcgaWYganMubGVuZ3RoIDw9IDBcbiAgICAgICAgICAgIGlmIGdlbmVyYXRlZFNvdXJjZU1hcCB0aGVuIGpzID0gXCIje2pzfVxcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPSN7YmFzZUZpbGVOYW1lIHNvdXJjZU1hcFBhdGgsIG5vLCB1c2VXaW5QYXRoU2VwfVxcblwiXG4gICAgICAgICAgICBmcy53cml0ZUZpbGUganNQYXRoLCBqcywgKGVycikgLT5cbiAgICAgICAgICAgICAgICBpZiBlcnJcbiAgICAgICAgICAgICAgICAgICAgcHJpbnRMaW5lIGVyci5tZXNzYWdlXG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCAxXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBvcHRzLmNvbXBpbGUgYW5kIG9wdHMud2F0Y2hcbiAgICAgICAgICAgICAgICAgICAgdGltZUxvZyBcImNvbXBpbGVkICN7c291cmNlfVwiXG4gICAgICAgIGlmIGdlbmVyYXRlZFNvdXJjZU1hcFxuICAgICAgICAgICAgZnMud3JpdGVGaWxlIHNvdXJjZU1hcFBhdGgsIGdlbmVyYXRlZFNvdXJjZU1hcCwgKGVycikgLT5cbiAgICAgICAgICAgICAgICBpZiBlcnJcbiAgICAgICAgICAgICAgICAgICAgcHJpbnRMaW5lIFwiQ291bGQgbm90IHdyaXRlIHNvdXJjZSBtYXA6ICN7ZXJyLm1lc3NhZ2V9XCJcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0IDFcbiAgICBmcy5leGlzdHMganNEaXIsIChpdEV4aXN0cykgLT5cbiAgICAgICAgaWYgaXRFeGlzdHMgdGhlbiBjb21waWxlKCkgZWxzZSBta2RpcnAganNEaXIsIGNvbXBpbGVcblxud2FpdCA9IChtaWxsaXNlY29uZHMsIGZ1bmMpIC0+IHNldFRpbWVvdXQgZnVuYywgbWlsbGlzZWNvbmRzICMgQ29udmVuaWVuY2UgZm9yIGNsZWFuZXIgc2V0VGltZW91dHMuXG5cbnRpbWVMb2cgPSAobWVzc2FnZSkgLT4gbG9nIFwiI3sobmV3IERhdGUpLnRvTG9jYWxlVGltZVN0cmluZygpfSAtICN7bWVzc2FnZX1cIlxuXG4jIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgICAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAwMDAwICAgXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgICAgMDAwICBcbiMgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuXG5wcmludFRva2VucyA9ICh0b2tlbnMpIC0+XG5cbiAgICBmb3IgaW5kZXggaW4gWzAuLi50b2tlbnMubGVuZ3RoXVxuICAgICAgICB0b2tlbiAgPSB0b2tlbnNbaW5kZXhdXG4gICAgICAgIHRhZyAgICA9IHRva2VuWzBdXG4gICAgICAgIHZhbHVlICA9IHRva2VuWzFdLnRvU3RyaW5nKCkucmVwbGFjZSgvXFxuLywgJ1xcXFxuJylcbiAgICAgICAgY3RhZyAgID0gZ3JheSB0YWdcbiAgICAgICAgY3ZhbHVlID0gYm9sZCB5ZWxsb3cgdmFsdWVcbiAgICAgICAgaW5kZXggID0gZ3JheSBkaW0gaW5kZXhcbiAgICAgICAgaWYgdGFnID09ICdURVJNSU5BVE9SJ1xuICAgICAgICAgICAgcHJpbnQgJ1xcblxcbidcbiAgICAgICAgZWxzZSBpZiB0YWcgPT0gJ0lOREVOVCdcbiAgICAgICAgICAgIHByaW50IGdyYXkgZGltICdJTkQgJ1xuICAgICAgICBlbHNlIGlmIHRhZyA9PSAnT1VUREVOVCdcbiAgICAgICAgICAgIHByaW50IGdyYXkgZGltICdPVVQgJ1xuICAgICAgICBlbHNlIGlmIHRhZyBpbiBbJ0NMQVNTJyAnUEFSQU1fU1RBUlQnICdQQVJBTV9FTkQnICdOVUxMJ11cbiAgICAgICAgICAgIHByaW50IFwiI3tpbmRleH0je2N0YWd9IFwiXG4gICAgICAgIGVsc2UgaWYgdGFnIGlzIHZhbHVlXG4gICAgICAgICAgICBwcmludCBcIiN7aW5kZXh9I3tjdmFsdWV9IFwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHByaW50IFwiI3tpbmRleH0je2N0YWd9PSN7Y3ZhbHVlfSBcIlxuICAgICAgICBcbnByaW50UmV3cml0ZXIgPSAodG9rZW5zKSAtPlxuXG4gICAgaW5kZW50ID0gMFxuICAgIGZvciBpbmRleCBpbiBbMC4uLnRva2Vucy5sZW5ndGhdXG4gICAgICAgIHRva2VuID0gdG9rZW5zW2luZGV4XVxuICAgICAgICB0YWcgICA9IHRva2VuWzBdXG4gICAgICAgIHZhbHVlID0gdG9rZW5bMV1cbiAgICAgICAgXG4gICAgICAgIGdyYXlEaW0gPSAocykgLT4gZGltIGdyYXkgc1xuICAgICAgICBibHVlRGltID0gKHMpIC0+IGRpbSBibHVlIHNcbiAgICAgICAgeWVsbG93RGltID0gKHMpIC0+IGRpbSB5ZWxsb3cgc1xuICAgICAgICBzcGFjZWQgPSAoY29sb3IsIHYpLT5cbiAgICAgICAgICAgIHByaW50IGNvbG9yIFwiI3t2ID8gdmFsdWV9XCJcbiAgICAgICAgICAgIHByaW50ICcgJyBpZiB0b2tlbi5zcGFjZWQgYW5kIHRva2Vuc1tpbmRleCsxXVswXSBub3QgaW4gWydDQUxMX1NUQVJUJ11cblxuICAgICAgICAjIGxvZyB0b2tlblxuICAgICAgICBzd2l0Y2ggdGFnIFxuICAgICAgICAgICAgd2hlbiAnVEVSTUlOQVRPUicgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHByaW50IFwiXFxuI3twYWQgJycsIGluZGVudH1cIlxuICAgICAgICAgICAgd2hlbiAnSU5ERU5UJyAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIGluZGVudCArPSA0OyBwcmludCBcIlxcbiN7cGFkICcnLCBpbmRlbnR9XCJcbiAgICAgICAgICAgIHdoZW4gJ09VVERFTlQnICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBpbmRlbnQgLT0gNDsgcHJpbnQgXCJcXG4je3BhZCAnJywgaW5kZW50fVwiXG4gICAgICAgICAgICB3aGVuICdIRVJFQ09NTUVOVCcgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGdyYXlEaW1cbiAgICAgICAgICAgIHdoZW4gJ0NBTExfU1RBUlQnICdDQUxMX0VORCcgICAgICAgICAgICAgdGhlbiBzcGFjZWQgZ3JheURpbVxuICAgICAgICAgICAgd2hlbiAnVU5BUlknICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCBibHVlQnJpZ2h0LCAnbm90J1xuICAgICAgICAgICAgd2hlbiAnJiYnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCBibHVlQnJpZ2h0LCAnYW5kJ1xuICAgICAgICAgICAgd2hlbiAnfHwnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCBibHVlQnJpZ2h0LCAnb3InXG4gICAgICAgICAgICB3aGVuICdTVFJJTkcnICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGdyZWVuXG4gICAgICAgICAgICB3aGVuICdTVFJJTkdfU1RBUlQnICdTVFJJTkdfRU5EJyAgICAgICAgIHRoZW4gc3BhY2VkIHJlZEJyaWdodFxuICAgICAgICAgICAgd2hlbiAnUFJPUEVSVFknICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCB5ZWxsb3dcbiAgICAgICAgICAgIHdoZW4gJzonICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgeWVsbG93RGltXG4gICAgICAgICAgICB3aGVuICdAJyBcbiAgICAgICAgICAgICAgICBpZiB0b2tlbnNbaW5kZXgrMV1bMF0gbm90IGluIFsnTUVUQV9JRicgJ01FVEFfRUxTRScgJ1BPU1RfTUVUQV9JRiddIHRoZW4gc3BhY2VkKHllbGxvd0RpbSkgZWxzZSBzcGFjZWQgYmx1ZURpbVxuICAgICAgICAgICAgd2hlbiAnTUVUQV9JRicgJ01FVEFfRUxTRScgJ1BPU1RfTUVUQV9JRicgdGhlbiBzcGFjZWQgYmx1ZSwgJ+KWuCcrdmFsdWVcbiAgICAgICAgICAgIHdoZW4gJ05VTUJFUicgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgYmx1ZVxuICAgICAgICAgICAgd2hlbiAneycnfScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIGlmIG5vdCB0b2tlbi5nZW5lcmF0ZWQgdGhlbiBzcGFjZWQgZ3JheVxuICAgICAgICAgICAgd2hlbiAnPScgJysnICctJyAnKysnICctLScgJy4uLicgJzo6JyBcXFxuICAgICAgICAgICAgICAgICAnWycgJ10nICd7JyAnfScgJy4nICdNQVRIJyAnVU5BUllfTUFUSCcgXFxcbiAgICAgICAgICAgICAgICAgJ0lOREVYX1NUQVJUJyAnSU5ERVhfRU5EJyBcXFxuICAgICAgICAgICAgICAgICAnQ09NUEFSRScgJ0NPTVBPVU5EX0FTU0lHTicgICAgICAgICB0aGVuIHNwYWNlZCBncmF5XG4gICAgICAgICAgICB3aGVuICcsJyAnKCcgJyknICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGdyYXlEaW1cbiAgICAgICAgICAgIHdoZW4gJ1BBUkFNX1NUQVJUJyAnUEFSQU1fRU5EJyAnLT4nICc9PicgdGhlbiBzcGFjZWQgKHMpIC0+IGJvbGQgYmx1ZSBzXG4gICAgICAgICAgICB3aGVuICdOVUxMJyAnVU5ERUZJTkVEJyAnRlVOQ19FWElTVCcgJz8nICc/LicgJ0JJTj8nIHRoZW4gc3BhY2VkIHJlZFxuICAgICAgICAgICAgd2hlbiAnUkVHRVgnICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCBtYWdlbnRhXG4gICAgICAgICAgICB3aGVuICdGT1InICdGT1JJTicgJ1RSWScgJ0NBVENIJyAnVEhST1cnICdSRUxBVElPTicgJ0VYVEVORFMnICdTVEFURU1FTlQnICdPV04nICdGT1JPRicgJ0xPT1AnIFxcXG4gICAgICAgICAgICAgICAgICdJRicgJ1BPU1RfSUYnICdXSEVOJyAnVEhFTicgJ0VMU0UnICdUSElTJyAnU1VQRVInICdTV0lUQ0gnICdMRUFESU5HX1dIRU4nICdXSElMRScgXFxcbiAgICAgICAgICAgICAgICAgJ0JPT0wnICdDTEFTUycgJ1JFVFVSTicgICAgICAgICAgICAgdGhlbiBzcGFjZWQgYmx1ZUJyaWdodFxuICAgICAgICAgICAgd2hlbiAnSURFTlRJRklFUicgXG4gICAgICAgICAgICAgICAgc3dpdGNoIHZhbHVlXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gJ3JlcXVpcmUnIHRoZW4gc3BhY2VkIGdyYXlcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBzcGFjZWQgd2hpdGVCcmlnaHRcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBwcmludCBcIj4je3RhZ308XCJcbiAgICAgICAgICAgICAgICAjIHNwYWNlZCAocykgLT4gYm9sZCBibHVlQnJpZ2h0IHNcbiAgICAgICAgICAgICAgICBzcGFjZWQgY3lhblxuICAgICAgICAgICAgXG52ZXJzaW9uID0gLT4gcHJpbnRMaW5lIFwiI3tLb2ZmZWUuVkVSU0lPTn1cIlxudXNhZ2UgICA9IC0+IFxuXG4gICAgbGluZXMgPSBbXCIje2dyYXkgJ1VzYWdlOid9ICN7eWVsbG93ICdrb2ZmZWUnfSAje2dyYXkgJ1tvcHRpb25zXSd9IHBhdGgvdG8vc2NyaXB0ICN7Z3JheSAnW29wdGlvbnNdJ31cXG5cIl1cbiAgICBcbiAgICBydWxlcyA9IFNXSVRDSEVTLm1hcCAocnVsZSkgLT5cbiAgICAgICAgW3Nob3J0LCBsb25nLCBkZXNjcmlwdGlvbl0gPSBydWxlXG4gICAgICAgIGxvbmdGbGFnID0gbG9uZy5tYXRjaCgvXigtLVxcd1tcXHdcXC1dKikvKVsxXVxuICAgICAgICBjc2hvcnQgICA9IGlmIHNob3J0IHRoZW4gZ3JheShzaG9ydFswXSkgKyBib2xkKGdyYXkoc2hvcnRbMS4uXSkpICsgJyAgJyBlbHNlICcgICAgJ1xuICAgICAgICBjbG9uZyAgICA9IHBhZCBsb25nLCAyMFxuICAgICAgICBjbG9uZyAgICA9IGdyYXkoY2xvbmdbMC4uMV0pICsgYm9sZCh3aGl0ZShjbG9uZ1syLi5dLnNwbGl0KCcgJylbMF0pKSArICcgJyArIGJvbGQoYmx1ZUJyaWdodChjbG9uZ1syLi5dLnNwbGl0KCcgJylbMS4uXS5qb2luKCcgJykpKVxuICAgICAgICBsaW5lcy5wdXNoICcgICAgJyArIGNzaG9ydCArIGNsb25nICsgZ3JheSBkZXNjcmlwdGlvblxuICAgICAgICBcbiAgICBsaW5lcy5wdXNoIGdyYXkgJ1xcbklmIGNhbGxlZCB3aXRob3V0IGEgc2NyaXB0LCB0aGUgaW50ZXJhY3RpdmUgUkVQTCB3aWxsIGJlIHN0YXJ0ZWQnXG4gICAgICAgIFxuICAgIGxvZyBcIlxcbiN7IGxpbmVzLmpvaW4oJ1xcbicpIH1cXG5cIlxuICAgICAgICAiXX0=
//# sourceURL=../coffee/command.coffee