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
        Debug: opts.Debug,
        metalog: opts.metalog
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBaUJBLEVBQUEsR0FBbUIsT0FBQSxDQUFRLElBQVI7O0FBQ25CLElBQUEsR0FBbUIsT0FBQSxDQUFRLE1BQVI7O0FBQ25CLElBQUEsR0FBbUIsT0FBQSxDQUFRLE1BQVI7O0FBQ25CLE9BQUEsR0FBbUIsT0FBQSxDQUFRLFdBQVI7O0FBQ25CLE1BQUEsR0FBbUIsT0FBQSxDQUFRLFVBQVI7O0FBQ25CLE1BQW1CLE9BQUEsQ0FBUSxlQUFSLENBQW5CLEVBQUUsaUJBQUYsRUFBUzs7QUFDUCxlQUFpQixPQUFBLENBQVEsUUFBUjs7QUFFbkIsYUFBQSxHQUFtQixJQUFJLENBQUMsR0FBTCxLQUFZOztBQUUvQixPQUFPLENBQUMsTUFBUixDQUFlLE1BQWYsRUFBdUIsSUFBSSxZQUEzQjs7QUFDQSxPQUFPLENBQUMsTUFBUixDQUFBOztBQUVBLE9BQTRCLE9BQUEsQ0FBUSxZQUFSLENBQTVCLEVBQUUsd0JBQUYsRUFBWTs7QUFFVixtQ0FBRixFQUFnQiwyQkFBaEIsRUFBMEIsNkJBQTFCLEVBQXFDLHFCQUFyQyxFQUE0Qzs7QUFFNUMsS0FBQSxHQUFZLE9BQU8sQ0FBQzs7QUFDcEIsS0FBQSxHQUFZLFNBQUMsSUFBRDtXQUFVLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBZixDQUFxQixJQUFyQjtBQUFWOztBQUNaLFNBQUEsR0FBWSxTQUFDLElBQUQ7V0FBVSxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQWYsQ0FBcUIsSUFBQSxHQUFPLElBQTVCO0FBQVY7O0FBQ1osU0FBQSxHQUFZLFNBQUMsSUFBRDtXQUFVLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBZixDQUFxQixJQUFBLEdBQU8sSUFBNUI7QUFBVjs7QUFDWixNQUFBLEdBQVksU0FBQyxJQUFEO1dBQVUsUUFBUSxDQUFDLElBQVQsQ0FBYyxJQUFkO0FBQVY7O0FBRVosUUFBQSxHQUFXLENBQ1AsQ0FBQyxJQUFELEVBQU0sUUFBTixFQUE0Qiw4Q0FBNUIsRUFBb0YsT0FBcEYsQ0FETyxFQUVQLENBQUMsSUFBRCxFQUFNLFdBQU4sRUFBNEIsNkNBQTVCLEVBQW9GLE9BQXBGLENBRk8sRUFHUCxDQUFDLElBQUQsRUFBTSxPQUFOLEVBQTRCLHVCQUE1QixFQUFvRixPQUFwRixDQUhPLEVBSVAsQ0FBQyxJQUFELEVBQU0sZUFBTixFQUE0Qix3Q0FBNUIsRUFBbUYsQ0FBQyxNQUFELEVBQVMsS0FBVCxDQUFuRixDQUpPLEVBS1AsQ0FBQyxJQUFELEVBQU0sWUFBTixFQUE0Qix5QkFBNUIsRUFBb0YsT0FBcEYsQ0FMTyxFQU1QLENBQUMsRUFBRCxFQUFNLGVBQU4sRUFBNEIsNkNBQTVCLEVBQW9GLElBQXBGLENBTk8sRUFPUCxDQUFDLElBQUQsRUFBTSxRQUFOLEVBQTRCLDJCQUE1QixFQUFvRixPQUFwRixDQVBPLEVBUVAsQ0FBQyxJQUFELEVBQU0sTUFBTixFQUE0QixtQ0FBNUIsRUFBb0YsT0FBcEYsQ0FSTyxFQVNQLENBQUMsSUFBRCxFQUFNLE9BQU4sRUFBNEIsK0NBQTVCLEVBQW9GLE9BQXBGLENBVE8sRUFVUCxDQUFDLElBQUQsRUFBTSxjQUFOLEVBQTRCLHVEQUE1QixFQUFvRixPQUFwRixDQVZPLEVBV1AsQ0FBQyxFQUFELEVBQU0sV0FBTixFQUE0QixpQ0FBNUIsRUFBb0YsTUFBcEYsQ0FYTyxFQVlQLENBQUMsSUFBRCxFQUFNLFFBQU4sRUFBNEIsc0NBQTVCLEVBQW9GLE9BQXBGLENBWk8sRUFhUCxDQUFDLElBQUQsRUFBTSxjQUFOLEVBQTRCLGtEQUE1QixFQUFvRixNQUFwRixDQWJPLEVBY1AsQ0FBQyxJQUFELEVBQU0sU0FBTixFQUE0QixtREFBNUIsRUFBb0YsT0FBcEYsQ0FkTyxFQWVQLENBQUMsSUFBRCxFQUFNLGtCQUFOLEVBQTRCLDhDQUE1QixFQUFtRixDQUFDLE1BQUQsRUFBUyxLQUFULENBQW5GLENBZk8sRUFnQlAsQ0FBQyxJQUFELEVBQU0sVUFBTixFQUE0Qix3Q0FBNUIsRUFBb0YsT0FBcEYsQ0FoQk8sRUFpQlAsQ0FBQyxJQUFELEVBQU0sU0FBTixFQUE0QiwyQ0FBNUIsRUFBb0YsT0FBcEYsQ0FqQk8sRUFrQlAsQ0FBQyxJQUFELEVBQU0sUUFBTixFQUE0QixnQ0FBNUIsRUFBb0YsT0FBcEYsQ0FsQk8sRUFtQlAsQ0FBQyxJQUFELEVBQU0sVUFBTixFQUE0QixzREFBNUIsRUFBb0YsT0FBcEYsQ0FuQk8sRUFvQlAsQ0FBQyxJQUFELEVBQU0sV0FBTixFQUE0Qiw0QkFBNUIsRUFBb0YsT0FBcEYsQ0FwQk8sRUFxQlAsQ0FBQyxJQUFELEVBQU0sU0FBTixFQUE0Qiw4Q0FBNUIsRUFBb0YsT0FBcEYsQ0FyQk87O0FBd0JYLElBQUEsR0FBTzs7QUFRUCxZQUFBLEdBQWUsU0FBQTtBQUVYLFFBQUE7SUFBQSxLQUFBLEdBQVE7UUFBQSxLQUFBLEVBQU0sT0FBTjs7SUFDUixLQUFBLEdBQVE7UUFBQSxDQUFBLEVBQUUsU0FBRjtRQUFZLENBQUEsRUFBRSxNQUFkOztJQUNSLFFBQVEsQ0FBQyxHQUFULENBQWEsU0FBQyxDQUFEO0FBQU8sWUFBQTtRQUFBLENBQUEsR0FBSSxDQUFFLENBQUEsQ0FBQSxDQUFFLENBQUMsS0FBTCxDQUFXLEdBQVgsQ0FBZ0IsQ0FBQSxDQUFBLENBQUc7UUFBTSxJQUFtQixDQUFFLENBQUEsQ0FBQSxDQUFyQjtZQUFBLEtBQU0sQ0FBQSxDQUFBLENBQU4sR0FBVyxDQUFFLENBQUEsQ0FBQSxFQUFiOztRQUF5QixJQUE2QixDQUFFLENBQUEsQ0FBQSxDQUFGLEtBQU0sRUFBbkM7bUJBQUEsS0FBTSxDQUFBLENBQUUsQ0FBQSxDQUFBLENBQUcsQ0FBQSxDQUFBLENBQUwsQ0FBTixHQUFpQixJQUFBLEdBQUssRUFBdEI7O0lBQTdELENBQWI7SUFDQSxRQUFRLENBQUMsR0FBVCxDQUFhLFNBQUMsQ0FBRDtlQUFPLEtBQU0sQ0FBQSxDQUFDLENBQUMsR0FBRixDQUFOLEdBQWU7SUFBdEIsQ0FBYjtJQUVBLENBQUEsR0FBSSxJQUFBLEdBQU8sSUFBQSxDQUFLLEtBQUwsRUFBWSxLQUFaO0lBRVgsQ0FBQyxDQUFDLFlBQUYsQ0FBQyxDQUFDLFVBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuQixDQUFDLEVBQUMsU0FBRCxFQUFELEdBQWUsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUN0QixJQUF3QyxDQUFDLENBQUMsT0FBMUM7UUFBQSxDQUFDLENBQUMsT0FBRixHQUFlLFdBQUEsQ0FBWSxDQUFDLENBQUMsT0FBZCxFQUFmOztJQUNBLENBQUMsQ0FBQyxHQUFGLEdBQWUsQ0FBSSxDQUFDLENBQUMsQ0FBQyxPQUFGLElBQWEsQ0FBQyxDQUFDLEVBQWYsSUFBcUIsQ0FBQyxDQUFDLEdBQXZCLElBQThCLENBQUMsQ0FBQyxNQUFoQyxJQUEwQyxDQUFDLENBQUMsS0FBN0M7SUFDbkIsQ0FBQyxDQUFDLEVBQUYsR0FBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRixJQUFRLENBQUMsRUFBQyxJQUFELEVBQVQsSUFBa0IsQ0FBQyxDQUFDLEtBQUYsSUFBWSxDQUFDLENBQUMsT0FBakM7SUFFakIsQ0FBQyxDQUFDLE9BQUYsR0FBWTtJQUNaLFFBQVEsQ0FBQyxHQUFULENBQWEsU0FBQyxDQUFEO0FBQU8sWUFBQTtRQUFBLENBQUMsQ0FBQyxPQUFRLENBQUEsQ0FBQyxDQUFDLEdBQUYsQ0FBVix1Q0FBK0I7ZUFBTSxPQUFPLENBQUUsQ0FBQSxDQUFDLENBQUMsSUFBRjtJQUFyRCxDQUFiO0lBRUEsSUFBRyxDQUFDLENBQUMsS0FBTDtRQUNJLE9BQU8sQ0FBQyxDQUFDO2VBQUksT0FBQSxDQUNiLEdBRGEsQ0FDVCxTQUFBLENBQVUsQ0FBVixDQURTLEVBRGpCOztBQWxCVzs7QUE0QmYsR0FBQSxHQUFNLFNBQUE7QUFFRixRQUFBO0lBQUEsWUFBQSxDQUFBO0lBRUEsSUFBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQWIsS0FBc0IsS0FBekI7UUFDSSxTQUFTLENBQUMsT0FBTyxDQUFDLE9BQWxCLEdBQTRCLE1BRGhDOztJQUdBLElBQXlCLElBQUksQ0FBQyxRQUE5QjtBQUFBLGVBQU8sV0FBQSxDQUFBLEVBQVA7O0lBQ0EsSUFBeUIsSUFBSSxDQUFDLElBQTlCO0FBQUEsZUFBTyxLQUFBLENBQUEsRUFBUDs7SUFDQSxJQUF5QixJQUFJLENBQUMsT0FBOUI7QUFBQSxlQUFPLE9BQUEsQ0FBQSxFQUFQOztJQUNBLElBQXlCLElBQUksQ0FBQyxXQUE5QjtBQUFBLGVBQU8sU0FBQSxDQUFBLEVBQVA7O0lBQ0EsSUFBeUIsSUFBSSxDQUFDLEtBQTlCO0FBQUEsZUFBTyxZQUFBLENBQUEsRUFBUDs7SUFDQSxJQUFHLElBQUksRUFBQyxJQUFELEVBQVA7QUFDSTtBQUFBLGFBQUEsc0NBQUE7O1lBQ0ksYUFBQSxDQUFjLElBQWQ7QUFESjtBQUVBLGVBSEo7O0lBSUEsSUFBeUIsQ0FBSSxJQUFJLEVBQUMsU0FBRCxFQUFVLENBQUMsTUFBNUM7QUFBQSxlQUFPLFNBQUEsQ0FBQSxFQUFQOztJQUVBLFFBQUEsR0FBYyxDQUFJLElBQUksQ0FBQyxLQUFULElBQW1CLENBQUksSUFBSSxDQUFDLE9BQS9CLEdBQTRDLElBQUksRUFBQyxTQUFELEVBQVUsQ0FBQyxNQUFmLENBQXNCLENBQXRCLENBQTVDLEdBQXlFO0lBRXBGLE9BQU8sQ0FBQyxJQUFSLEdBQWUsT0FBTyxDQUFDLElBQUssWUFBSyxDQUFDLE1BQW5CLENBQTBCLFFBQTFCO0lBQ2YsT0FBTyxDQUFDLElBQUssQ0FBQSxDQUFBLENBQWIsR0FBa0I7SUFFbEIsSUFBMEMsSUFBSSxDQUFDLE1BQS9DO1FBQUEsSUFBSSxDQUFDLE1BQUwsR0FBYyxJQUFJLENBQUMsT0FBTCxDQUFhLElBQUksQ0FBQyxNQUFsQixFQUFkOztBQUNBO0FBQUE7U0FBQSx3Q0FBQTs7UUFDSSxNQUFBLEdBQVMsSUFBSSxDQUFDLE9BQUwsQ0FBYSxNQUFiO1FBRVQsSUFBRyxJQUFJLENBQUMsS0FBUjt5QkFDSSxTQUFBLENBQVUsTUFBVixHQURKO1NBQUEsTUFBQTt5QkFHSSxXQUFBLENBQVksTUFBWixFQUFvQjtnQkFBQSxRQUFBLEVBQVMsSUFBVDthQUFwQixHQUhKOztBQUhKOztBQXhCRTs7QUFnQ04sT0FBTyxDQUFDLEdBQVIsR0FBYzs7QUFFZCxTQUFBLEdBQVksU0FBQTtBQU1SLFFBQUE7SUFBQSxXQUFBLEdBQWM7UUFBQSxTQUFBLEVBQVcsSUFBWDs7SUFDZCxXQUFXLENBQUMsT0FBWixHQUFzQixJQUFJLENBQUM7V0FDM0IsT0FBQSxDQUFRLFFBQVIsQ0FBaUIsQ0FBQyxLQUFsQixDQUF3QixXQUF4QjtBQVJROztBQVVaLFdBQUEsR0FBYyxTQUFDLFFBQUQ7V0FFVixRQUFRLENBQUMsR0FBVCxDQUFhLFNBQUMsTUFBRDtBQUNULFlBQUE7UUFBQSxJQUE2QixLQUFBLEdBQVEsTUFBTSxDQUFDLEtBQVAsQ0FBYSxhQUFiLENBQXJDO1lBQUMsWUFBRCxFQUFJLGVBQUosRUFBVSxrQkFBVjs7UUFDQSxTQUFBLE9BQVMsWUFBQSxDQUFhLE1BQWIsRUFBcUIsSUFBckIsRUFBMEIsYUFBMUI7ZUFDTixJQUFELEdBQU0sY0FBTixHQUFvQixNQUFwQixHQUEyQjtJQUhwQixDQUFiLENBSUEsQ0FBQyxJQUpELENBSU0sR0FKTjtBQUZVOztBQWdCZCxXQUFBLEdBQWMsU0FBQyxNQUFELEVBQVMsR0FBVDtBQUVWLFFBQUE7SUFGNEIsa0RBQVM7SUFFckMsSUFBVSxDQUFJLFFBQUosSUFBaUIsTUFBQSxDQUFPLE1BQVAsQ0FBM0I7QUFBQSxlQUFBOztBQUVBO1FBQ0ksS0FBQSxHQUFRLEVBQUUsQ0FBQyxRQUFILENBQVksTUFBWixFQURaO0tBQUEsY0FBQTtRQUVNO1FBQ0YsSUFBRyxHQUFHLENBQUMsSUFBSixLQUFZLFFBQWY7WUFDRyxPQUFBLENBQUMsS0FBRCxDQUFPLGtDQUFBLEdBQW1DLE1BQW5DLEdBQTBDLEdBQWpEO1lBQ0MsT0FBTyxDQUFDLElBQVIsQ0FBYSxDQUFiLEVBRko7O0FBR0EsY0FBTSxJQU5WOztJQVFBLElBQUcsS0FBSyxDQUFDLFdBQU4sQ0FBQSxDQUFIO1FBRUksWUFBRyxJQUFJLENBQUMsUUFBTCxDQUFjLE1BQWQsRUFBQSxLQUEwQixjQUExQixJQUFBLElBQUEsS0FBeUMsTUFBNUM7QUFDSSxtQkFESjs7UUFHQSxJQUFHLElBQUksQ0FBQyxHQUFSO1lBQ0ksV0FBQSxDQUFZLGtCQUFBLENBQW1CLE1BQW5CLENBQVosRUFBd0M7Z0JBQUEsUUFBQSxFQUFTLFFBQVQ7YUFBeEM7QUFDQSxtQkFGSjs7UUFJQSxJQUEwQyxJQUFJLENBQUMsS0FBL0M7WUFBQSxPQUFBLENBQUEsR0FBQSxDQUFJLDBCQUFKLEVBQWdDLE1BQWhDLEVBQUE7O0FBRUE7WUFDSSxLQUFBLEdBQVEsRUFBRSxDQUFDLFdBQUgsQ0FBZSxNQUFmLEVBRFo7U0FBQSxjQUFBO1lBRU07WUFDRixJQUFHLEdBQUcsQ0FBQyxJQUFKLEtBQVksUUFBZjtBQUE2Qix1QkFBN0I7O0FBQ0Esa0JBQU0sSUFKVjs7QUFNQTthQUFBLHVDQUFBOzt5QkFDSSxXQUFBLENBQVksSUFBSSxDQUFDLElBQUwsQ0FBVSxNQUFWLEVBQWtCLElBQWxCLENBQVo7QUFESjt1QkFqQko7S0FBQSxNQW9CSyxJQUFHLFFBQUEsSUFBWSxRQUFBLENBQVMsTUFBVCxDQUFmO0FBRUQ7WUFDSSxJQUFBLEdBQU8sRUFBRSxDQUFDLFlBQUgsQ0FBZ0IsTUFBaEIsRUFEWDtTQUFBLGNBQUE7WUFFTTtZQUNGLElBQUcsR0FBRyxDQUFDLElBQUosS0FBWSxRQUFmO0FBQTZCLHVCQUE3Qjs7QUFDQSxrQkFBTSxJQUpWOztRQU1BLElBQTJDLElBQUksQ0FBQyxLQUFoRDtZQUFBLE9BQUEsQ0FBQSxHQUFBLENBQUksMkJBQUosRUFBaUMsTUFBakMsRUFBQTs7ZUFFQSxhQUFBLENBQWMsSUFBSSxDQUFDLFFBQUwsQ0FBQSxDQUFkLEVBQStCLE1BQS9CLEVBVkM7O0FBaENLOztBQTRDZCxrQkFBQSxHQUFxQixTQUFDLE1BQUQ7QUFFakIsUUFBQTtBQUFBO0FBQUEsU0FBQSxzQ0FBQTs7UUFDSSxLQUFBLEdBQVEsSUFBSSxDQUFDLElBQUwsQ0FBVSxNQUFWLEVBQWtCLE9BQUEsR0FBUSxHQUExQjtBQUNSO1lBQ0ksSUFBZ0IsQ0FBQyxFQUFFLENBQUMsUUFBSCxDQUFZLEtBQVosQ0FBRCxDQUFtQixDQUFDLE1BQXBCLENBQUEsQ0FBaEI7QUFBQSx1QkFBTyxNQUFQO2FBREo7U0FBQSxjQUFBO1lBRU07WUFDRixJQUFpQixHQUFHLENBQUMsSUFBSixLQUFZLFFBQTdCO0FBQUEsc0JBQU0sSUFBTjthQUhKOztBQUZKO0lBTUEsT0FBQSxDQUFBLEtBQUEsQ0FBTSwwQkFBQSxHQUEyQixNQUFqQztXQUNBLE9BQU8sQ0FBQyxJQUFSLENBQWEsQ0FBYjtBQVRpQjs7QUFvQnJCLGFBQUEsR0FBZ0IsU0FBQyxJQUFELEVBQU8sTUFBUDtBQUVaLFFBQUE7O1FBRm1CLFNBQU87O0lBRTFCLENBQUEsR0FBSTtJQUNKLE9BQUEsR0FBVSxjQUFBLENBQWUsTUFBZjtBQUVWO1FBQ0ksQ0FBQSxHQUFJLElBQUEsR0FBTztZQUFDLFFBQUEsTUFBRDtZQUFTLE1BQUEsSUFBVDtZQUFlLFNBQUEsT0FBZjs7UUFDWCxNQUFNLENBQUMsSUFBUCxDQUFZLFNBQVosRUFBdUIsSUFBdkI7UUFFQSxJQUFHLENBQUMsQ0FBQyxNQUFMO21CQUNJLFdBQUEsQ0FBWSxNQUFNLENBQUMsTUFBUCxDQUFjLENBQUMsQ0FBQyxJQUFoQixFQUFzQixDQUFDLENBQUMsT0FBeEIsQ0FBWixFQURKO1NBQUEsTUFFSyxJQUFHLENBQUMsQ0FBQyxNQUFMO21CQUNELGFBQUEsQ0FBYyxNQUFNLENBQUMsTUFBUCxDQUFjLENBQUMsQ0FBQyxJQUFoQixFQUFzQixDQUFDLENBQUMsT0FBeEIsQ0FBZCxFQURDO1NBQUEsTUFFQSxJQUFHLENBQUMsQ0FBQyxLQUFMO21CQUNELFNBQUEsQ0FBVSxNQUFNLENBQUMsS0FBUCxDQUFhLENBQUMsQ0FBQyxJQUFmLEVBQXFCLENBQUMsQ0FBQyxPQUF2QixDQUErQixDQUFDLFFBQWhDLENBQUEsQ0FBMEMsQ0FBQyxJQUEzQyxDQUFBLENBQVYsRUFEQztTQUFBLE1BRUEsSUFBRyxDQUFDLENBQUMsR0FBTDtZQUNELE1BQU0sQ0FBQyxRQUFQLENBQUE7WUFDQSxJQUF1QyxJQUFJLENBQUMsT0FBNUM7Z0JBQUEsTUFBTSxFQUFDLElBQUQsRUFBTixDQUFZLElBQUksQ0FBQyxPQUFqQixFQUEwQixDQUFDLENBQUMsT0FBNUIsRUFBQTs7O29CQUNTLENBQUM7O29CQUFELENBQUMsV0FBWSxPQUFPLENBQUM7O1lBQzlCLElBQUcsSUFBSSxDQUFDLElBQVI7dUJBQVcsT0FBQSxDQUFPLEdBQVAsQ0FBVyxXQUFBLEdBQVksTUFBdkIsRUFBWDthQUFBLE1BQUE7dUJBRUksTUFBTSxDQUFDLEdBQVAsQ0FBVyxDQUFDLENBQUMsSUFBYixFQUFtQixDQUFDLENBQUMsT0FBckIsRUFGSjthQUpDO1NBQUEsTUFBQTtZQVFELFFBQUEsR0FBVyxNQUFNLENBQUMsT0FBUCxDQUFlLENBQUMsQ0FBQyxJQUFqQixFQUF1QixDQUFDLENBQUMsT0FBekI7WUFDWCxDQUFDLENBQUMsTUFBRixHQUFXO1lBQ1gsSUFBRyxDQUFDLENBQUMsR0FBTDtnQkFDSSxDQUFDLENBQUMsTUFBRixHQUFXLFFBQVEsQ0FBQztnQkFDcEIsQ0FBQyxDQUFDLFNBQUYsR0FBYyxRQUFRLENBQUMsWUFGM0I7O1lBSUEsTUFBTSxDQUFDLElBQVAsQ0FBWSxTQUFaLEVBQXVCLElBQXZCO1lBRUEsSUFBRyxDQUFDLENBQUMsRUFBTDtnQkFDSSxJQUFHLElBQUksQ0FBQyxJQUFSOzJCQUFXLE9BQUEsQ0FBTyxHQUFQLENBQVcsVUFBQSxHQUFXLE1BQXRCLEVBQVg7aUJBQUEsTUFBQTsyQkFFSSxTQUFBLENBQVUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFULENBQUEsQ0FBVixFQUZKO2lCQURKO2FBQUEsTUFJSyxJQUFHLENBQUMsQ0FBQyxPQUFGLElBQWEsQ0FBQyxDQUFDLEdBQWxCO2dCQUNELElBQUcsSUFBSSxDQUFDLElBQVI7MkJBQVcsT0FBQSxDQUFPLEdBQVAsQ0FBVyxhQUFBLEdBQWMsT0FBTyxDQUFDLE1BQWpDLEVBQVg7aUJBQUEsTUFBQTsyQkFFSSxPQUFBLENBQVEsQ0FBQyxDQUFDLE1BQVYsRUFBa0IsQ0FBQyxDQUFDLE1BQXBCLEVBQTRCLE9BQU8sQ0FBQyxNQUFwQyxFQUE0QyxDQUFDLENBQUMsU0FBOUMsRUFGSjtpQkFEQzthQXBCSjtTQVZUO0tBQUEsY0FBQTtRQWtDTTtRQUVGLE1BQU0sQ0FBQyxJQUFQLENBQVksU0FBWixFQUF1QixHQUF2QixFQUE0QixJQUE1QjtRQUNBLElBQVUsTUFBTSxDQUFDLFNBQVAsQ0FBaUIsU0FBakIsQ0FBMkIsQ0FBQyxNQUF0QztBQUFBLG1CQUFBOztRQUVBLE9BQUEsR0FBVSxHQUFHLENBQUM7UUFFZCxJQUFHLEdBQUEsWUFBZSxXQUFsQjtZQUNJLFNBQUEsQ0FBVSxPQUFWLEVBREo7U0FBQSxNQUFBO1lBR0ksU0FBQSxDQUFVLEdBQUcsQ0FBQyxLQUFkLEVBSEo7O1FBS0EsSUFBRyxDQUFDLENBQUMsS0FBRixJQUFXLENBQUMsRUFBQyxJQUFELEVBQWY7bUJBQ0ksS0FBQSxDQUFNLE1BQU4sRUFESjtTQUFBLE1BQUE7bUJBR0ksT0FBTyxDQUFDLElBQVIsQ0FBYSxDQUFiLEVBSEo7U0E5Q0o7O0FBTFk7O0FBd0RoQixjQUFBLEdBQWlCLFNBQUMsTUFBRDtBQUViLFFBQUE7SUFBQSxLQUFBLEdBQ0k7UUFBQSxNQUFBLEVBQVcsTUFBWDtRQUNBLFNBQUEsRUFBVyxJQUFJLENBQUMsR0FEaEI7UUFFQSxTQUFBLEVBQVcsSUFBSyxDQUFBLFlBQUEsQ0FGaEI7UUFHQSxPQUFBLEVBQVcsSUFBSSxDQUFDLE9BSGhCO1FBSUEsSUFBQSxFQUFXLElBQUksQ0FBQyxJQUpoQjtRQUtBLElBQUEsRUFBVyxJQUFJLENBQUMsSUFMaEI7UUFNQSxHQUFBLEVBQVcsSUFBSSxDQUFDLEdBTmhCO1FBT0EsS0FBQSxFQUFXLElBQUksQ0FBQyxLQVBoQjtRQVFBLE9BQUEsRUFBVyxJQUFJLENBQUMsT0FSaEI7O0lBVUosSUFBRyxNQUFIO1FBRUksR0FBQSxHQUFNLE9BQU8sQ0FBQyxHQUFSLENBQUE7UUFDTixNQUFBLEdBQVMsVUFBQSxDQUFXLE1BQVgsRUFBbUIsS0FBbkI7UUFDVCxLQUFBLEdBQVEsSUFBSSxDQUFDLE9BQUwsQ0FBYSxNQUFiO1FBQ1IsS0FBQSxHQUFRLEtBQUEsQ0FBTSxLQUFOLEVBQWE7WUFDakIsUUFBQSxNQURpQjtZQUVqQixVQUFBLEVBQVksSUFBSSxDQUFDLFFBQUwsQ0FBYyxLQUFkLEVBQXFCLEdBQXJCLENBRks7WUFHakIsV0FBQSxFQUFhLENBQUMsSUFBSSxDQUFDLFFBQUwsQ0FBYyxHQUFkLEVBQW1CLE1BQW5CLENBQUQsQ0FISTtZQUlqQixhQUFBLEVBQWUsWUFBQSxDQUFhLE1BQWIsRUFBcUIsS0FBckIsRUFBeUIsYUFBekIsQ0FKRTtTQUFiLEVBTFo7O1dBV0E7QUF4QmE7O0FBNEJqQixZQUFBLEdBQWUsU0FBQTtBQUVYLFFBQUE7SUFBQSxPQUFBLEdBQVU7SUFDVixLQUFBLEdBQVEsT0FBTyxDQUFDLFNBQVIsQ0FBQTtJQUNSLEtBQUssQ0FBQyxFQUFOLENBQVMsTUFBVCxFQUFpQixTQUFDLE1BQUQ7UUFBWSxJQUF1QixNQUF2QjttQkFBQSxPQUFPLENBQUMsSUFBUixDQUFhLE1BQWIsRUFBQTs7SUFBWixDQUFqQjtXQUNBLEtBQUssQ0FBQyxFQUFOLENBQVMsS0FBVCxFQUFnQixTQUFBO2VBQUcsYUFBQSxDQUFjLE1BQU0sQ0FBQyxNQUFQLENBQWMsT0FBZCxDQUFzQixDQUFDLFFBQXZCLENBQUEsQ0FBZDtJQUFILENBQWhCO0FBTFc7O0FBYWYsU0FBQSxHQUFZLFNBQUMsTUFBRDtBQUVSLFFBQUE7QUFBQTtRQUNJLEtBQUEsR0FBUSxFQUFFLENBQUMsUUFBSCxDQUFZLE1BQVosRUFEWjtLQUFBLGNBQUE7UUFFTTtRQUNGLElBQVUsR0FBRyxDQUFDLElBQUosS0FBWSxRQUF0QjtBQUFBLG1CQUFBOztBQUNBLGVBQUssT0FBQSxDQUFFLEtBQUYsQ0FBUSxnQ0FBQSxHQUFpQyxNQUFqQyxHQUF3QyxHQUFoRCxFQUFvRCxHQUFwRCxFQUpUOztJQU1BLElBQUcsS0FBSyxDQUFDLFdBQU4sQ0FBQSxDQUFIO2VBQ0ksUUFBQSxDQUFTLE1BQVQsRUFESjtLQUFBLE1BQUE7ZUFHSSxTQUFBLENBQVUsTUFBVixFQUhKOztBQVJROztBQWdCWixTQUFBLEdBQVksU0FBQyxNQUFEO0FBRVIsUUFBQTtJQUFBLElBQVUsQ0FBSSxRQUFBLENBQVMsTUFBVCxDQUFkO0FBQUEsZUFBQTs7SUFBNkIsSUFFTSxJQUFJLENBQUMsS0FGWDtRQUFBLE9BQUEsQ0FFN0IsR0FGNkIsQ0FFekIsbUJBRnlCLEVBRUosTUFGSSxFQUFBOztJQUk3QixPQUFBLEdBQWlCO0lBQ2pCLFNBQUEsR0FBaUI7SUFDakIsY0FBQSxHQUFpQjtJQUVqQixZQUFBLEdBQWUsU0FBQTtlQUVYLE9BQUEsR0FBVSxFQUFFLENBQUMsS0FBSCxDQUFTLE1BQVQsQ0FDVixDQUFDLEVBRFMsQ0FDTixRQURNLEVBQ0ksU0FBQyxNQUFEO1lBRVYsSUFBVSxNQUFBLEtBQVUsUUFBcEI7QUFBQSx1QkFBQTs7WUFBNEIsSUFFZSxJQUFJLENBQUMsS0FGcEI7Z0JBQUEsT0FBQSxDQUU1QixHQUY0QixDQUV4QixtQkFGd0IsRUFFSCxNQUZHLEVBRUssTUFGTCxFQUFBOztZQUk1QixZQUFBLENBQWEsY0FBYjttQkFDQSxjQUFBLEdBQWlCLElBQUEsQ0FBSyxFQUFMLEVBQVMsU0FBQTt1QkFFdEIsRUFBRSxDQUFDLElBQUgsQ0FBUSxNQUFSLEVBQWdCLFNBQUMsR0FBRCxFQUFNLEtBQU47b0JBQ1osbUJBQTBCLEdBQUcsQ0FBRSxjQUFMLEtBQWEsUUFBdkM7QUFBQSwrQkFBTyxPQUFPLENBQUMsS0FBUixDQUFBLEVBQVA7O29CQUNBLElBQW9CLEdBQXBCO0FBQUEsK0JBQUssT0FBQSxDQUFFLEtBQUYsQ0FBUSxHQUFSLEVBQUw7O29CQUNBLElBQVUsU0FBQSxJQUFjLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBWixDQUFBLENBQUEsS0FBeUIsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFoQixDQUFBLENBQXZDLElBQXFFLEtBQUssQ0FBQyxJQUFOLEtBQWMsU0FBUyxDQUFDLElBQXZHO0FBQUEsK0JBQUE7O29CQUNBLFNBQUEsR0FBWTsyQkFDWixFQUFFLENBQUMsUUFBSCxDQUFZLE1BQVosRUFBb0IsU0FBQyxHQUFELEVBQU0sSUFBTjt3QkFDaEIsSUFBb0IsR0FBcEI7QUFBQSxtQ0FBSyxPQUFBLENBQUUsS0FBRixDQUFRLEdBQVIsRUFBTDs7d0JBQXVCLElBQ29CLElBQUksQ0FBQyxLQUR6Qjs0QkFBQSxPQUFBLENBQ3ZCLEdBRHVCLENBQ25CLDJCQURtQixFQUNVLE1BRFYsRUFBQTs7K0JBRXZCLGFBQUEsQ0FBYyxJQUFJLENBQUMsUUFBTCxDQUFBLENBQWQsRUFBK0IsTUFBL0I7b0JBSGdCLENBQXBCO2dCQUxZLENBQWhCO1lBRnNCLENBQVQ7UUFQUCxDQURKLENBb0JWLENBQUMsRUFwQlMsQ0FvQk4sT0FwQk0sRUFvQkcsU0FBQyxHQUFEO1lBQ1QsSUFBaUIsR0FBRyxDQUFDLElBQUosS0FBWSxPQUE3QjtBQUFBLHNCQUFNLElBQU47O1FBRFMsQ0FwQkg7SUFGQztBQXlCZjtlQUNJLFlBQUEsQ0FBQSxFQURKO0tBQUEsY0FBQTtRQUVNO2VBQ0gsT0FBQSxDQUFDLEtBQUQsQ0FBTyxHQUFQLEVBSEg7O0FBbkNROztBQXdDWixRQUFBLEdBQVcsU0FBQyxNQUFEO0FBRVIsUUFBQTtJQUFBLElBQW1DLElBQUksQ0FBQyxLQUF4QztRQUFBLE9BQUEsQ0FBQyxHQUFELENBQUssa0JBQUwsRUFBeUIsTUFBekIsRUFBQTs7SUFFQyxPQUFBLEdBQVU7SUFFVixZQUFBLEdBQWUsU0FBQTtBQUVYLFlBQUE7QUFBQTtZQUNJLEtBQUEsR0FBUSxFQUFFLENBQUMsV0FBSCxDQUFlLE1BQWYsRUFEWjtTQUFBLGNBQUE7WUFFTTtZQUNGLG1CQUFVLEdBQUcsQ0FBRSxjQUFMLEtBQWEsUUFBdkI7QUFBQSx1QkFBQTs7QUFDQSxrQkFBTSxJQUpWOztBQU1BLGFBQUEsdUNBQUE7O1lBQ0ksSUFBWSxJQUFLLENBQUEsQ0FBQSxDQUFMLEtBQVcsR0FBdkI7QUFBQSx5QkFBQTs7WUFDQSxJQUFZLElBQUEsS0FBUyxjQUFyQjtBQUFBLHlCQUFBOztZQUNBLFNBQUEsQ0FBVSxJQUFJLENBQUMsSUFBTCxDQUFVLE1BQVYsRUFBa0IsSUFBbEIsQ0FBVjtBQUhKO2VBS0EsT0FBQSxHQUFVLEVBQUUsQ0FBQyxLQUFILENBQVMsTUFBVCxDQUNWLENBQUMsRUFEUyxDQUNOLE9BRE0sRUFDRyxTQUFDLEdBQUQ7WUFDVCxJQUFpQixHQUFHLENBQUMsSUFBSixLQUFZLE9BQTdCO0FBQUEsc0JBQU0sSUFBTjs7bUJBQ0EsT0FBTyxDQUFDLEtBQVIsQ0FBQTtRQUZTLENBREgsQ0FJVixDQUFDLEVBSlMsQ0FJTixRQUpNLEVBSUksU0FBQyxNQUFELEVBQVMsQ0FBVDtZQUNWLElBQUcsTUFBQSxLQUFVLFFBQWI7Z0JBQ0csSUFBd0QsSUFBSSxDQUFDLEtBQTdEO29CQUFBLE9BQUEsQ0FBQyxHQUFELENBQUssa0JBQUwsRUFBeUIsTUFBekIsRUFBaUMsSUFBSSxDQUFDLElBQUwsQ0FBVSxNQUFWLEVBQWtCLENBQWxCLENBQWpDLEVBQUE7O3VCQUNDLFNBQUEsQ0FBVSxJQUFJLENBQUMsSUFBTCxDQUFVLE1BQVYsRUFBa0IsQ0FBbEIsQ0FBVixFQUZKOztRQURVLENBSko7SUFiQztBQXNCZjtlQUNJLFlBQUEsQ0FBQSxFQURKO0tBQUEsY0FBQTtRQUVNO1FBQ0YsSUFBVSxHQUFHLENBQUMsSUFBSixLQUFZLFFBQXRCO0FBQUEsbUJBQUE7O0FBQ0EsY0FBTSxJQUpWOztBQTVCTzs7QUFvQ1gsVUFBQSxHQUFhLFNBQUMsTUFBRCxFQUFTLFNBQVQ7QUFFVCxRQUFBO0lBQUEsUUFBQSxHQUFXLFlBQUEsQ0FBYSxNQUFiLEVBQXFCLElBQXJCLEVBQTBCLGFBQTFCO0lBQ1gsSUFBRyxJQUFJLENBQUMsTUFBUjtRQUNJLEdBQUEsR0FBTSxJQUFJLENBQUMsT0FEZjtLQUFBLE1BQUE7UUFHSSxHQUFBLEdBQU0sSUFBSSxDQUFDLE9BQUwsQ0FBYSxNQUFiLEVBSFY7O1dBSUEsSUFBSSxDQUFDLElBQUwsQ0FBVSxHQUFWLEVBQWUsUUFBQSxHQUFXLFNBQTFCO0FBUFM7O0FBV2IsTUFBQSxHQUFTLFNBQUMsR0FBRCxFQUFNLEVBQU47QUFDTCxRQUFBO0lBQUEsSUFBQSxHQUFPLEtBQUEsR0FBUSxDQUFDLE9BQU8sQ0FBQyxLQUFSLENBQUE7V0FFYixDQUFBLE1BQUEsR0FBUyxTQUFDLENBQUQsRUFBVSxFQUFWO2VBQ1IsRUFBRSxDQUFDLE1BQUgsQ0FBVSxDQUFWLEVBQWEsU0FBQyxNQUFEO1lBQ1QsSUFBRyxNQUFIO3VCQUNJLEVBQUEsQ0FBQSxFQURKO2FBQUEsTUFBQTt1QkFHSSxNQUFBLENBQU8sSUFBSSxDQUFDLE9BQUwsQ0FBYSxDQUFiLENBQVAsRUFBd0IsU0FBQTsyQkFDcEIsRUFBRSxDQUFDLEtBQUgsQ0FBUyxDQUFULEVBQVksSUFBWixFQUFrQixTQUFDLEdBQUQ7d0JBQ2QsSUFBaUIsR0FBakI7QUFBQSxtQ0FBTyxFQUFBLENBQUcsR0FBSCxFQUFQOzsrQkFDQSxFQUFBLENBQUE7b0JBRmMsQ0FBbEI7Z0JBRG9CLENBQXhCLEVBSEo7O1FBRFMsQ0FBYjtJQURRLENBQVQsQ0FBSCxDQUFpQixHQUFqQixFQUFzQixFQUF0QjtBQUhLOztBQXVCVCxPQUFBLEdBQVUsU0FBQyxNQUFELEVBQVMsRUFBVCxFQUFhLE1BQWIsRUFBcUIsa0JBQXJCO0FBRU4sUUFBQTs7UUFGMkIscUJBQXFCOztJQUVoRCxhQUFBLEdBQWdCLFVBQUEsQ0FBVyxNQUFYLEVBQW1CLFNBQW5CO0lBQ2hCLEtBQUEsR0FBUSxJQUFJLENBQUMsT0FBTCxDQUFhLE1BQWI7SUFDUixPQUFBLEdBQVUsU0FBQTtRQUNOLElBQUcsSUFBSSxDQUFDLE9BQVI7WUFDSSxJQUFZLEVBQUUsQ0FBQyxNQUFILElBQWEsQ0FBekI7Z0JBQUEsRUFBQSxHQUFLLElBQUw7O1lBQ0EsSUFBRyxrQkFBSDtnQkFBMkIsRUFBQSxHQUFRLEVBQUQsR0FBSSx5QkFBSixHQUE0QixDQUFDLFlBQUEsQ0FBYSxhQUFiLEVBQTRCLEtBQTVCLEVBQWdDLGFBQWhDLENBQUQsQ0FBNUIsR0FBMkUsS0FBN0c7O1lBQ0EsRUFBRSxDQUFDLFNBQUgsQ0FBYSxNQUFiLEVBQXFCLEVBQXJCLEVBQXlCLFNBQUMsR0FBRDtnQkFDckIsSUFBRyxHQUFIO29CQUNJLFNBQUEsQ0FBVSxHQUFHLENBQUMsT0FBZDsyQkFDQSxPQUFPLENBQUMsSUFBUixDQUFhLENBQWIsRUFGSjtpQkFBQSxNQUdLLElBQUcsSUFBSSxDQUFDLE9BQUwsSUFBaUIsSUFBSSxDQUFDLEtBQXpCOzJCQUNELE9BQUEsQ0FBUSxXQUFBLEdBQVksTUFBcEIsRUFEQzs7WUFKZ0IsQ0FBekIsRUFISjs7UUFTQSxJQUFHLGtCQUFIO21CQUNJLEVBQUUsQ0FBQyxTQUFILENBQWEsYUFBYixFQUE0QixrQkFBNUIsRUFBZ0QsU0FBQyxHQUFEO2dCQUM1QyxJQUFHLEdBQUg7b0JBQ0ksU0FBQSxDQUFVLDhCQUFBLEdBQStCLEdBQUcsQ0FBQyxPQUE3QzsyQkFDQSxPQUFPLENBQUMsSUFBUixDQUFhLENBQWIsRUFGSjs7WUFENEMsQ0FBaEQsRUFESjs7SUFWTTtXQWVWLEVBQUUsQ0FBQyxNQUFILENBQVUsS0FBVixFQUFpQixTQUFDLFFBQUQ7UUFDYixJQUFHLFFBQUg7bUJBQWlCLE9BQUEsQ0FBQSxFQUFqQjtTQUFBLE1BQUE7bUJBQWdDLE1BQUEsQ0FBTyxLQUFQLEVBQWMsT0FBZCxFQUFoQzs7SUFEYSxDQUFqQjtBQW5CTTs7QUFzQlYsSUFBQSxHQUFPLFNBQUMsWUFBRCxFQUFlLElBQWY7V0FBd0IsVUFBQSxDQUFXLElBQVgsRUFBaUIsWUFBakI7QUFBeEI7O0FBRVAsT0FBQSxHQUFVLFNBQUMsT0FBRDtXQUFXLE9BQUEsQ0FBRSxHQUFGLENBQVEsQ0FBQyxDQUFDLElBQUksSUFBTCxDQUFVLENBQUMsa0JBQVgsQ0FBQSxDQUFELENBQUEsR0FBaUMsS0FBakMsR0FBc0MsT0FBOUM7QUFBWDs7QUFRVixXQUFBLEdBQWMsU0FBQyxNQUFEO0FBRVYsUUFBQTtBQUFBO1NBQWEsbUdBQWI7UUFDSSxLQUFBLEdBQVMsTUFBTyxDQUFBLEtBQUE7UUFDaEIsR0FBQSxHQUFTLEtBQU0sQ0FBQSxDQUFBO1FBQ2YsS0FBQSxHQUFTLEtBQU0sQ0FBQSxDQUFBLENBQUUsQ0FBQyxRQUFULENBQUEsQ0FBbUIsQ0FBQyxPQUFwQixDQUE0QixJQUE1QixFQUFrQyxLQUFsQztRQUNULElBQUEsR0FBUyxJQUFBLENBQUssR0FBTDtRQUNULE1BQUEsR0FBUyxJQUFBLENBQUssTUFBQSxDQUFPLEtBQVAsQ0FBTDtRQUNULEtBQUEsR0FBUyxJQUFBLENBQUssR0FBQSxDQUFJLEtBQUosQ0FBTDtRQUNULElBQUcsR0FBQSxLQUFPLFlBQVY7eUJBQ0ksS0FBQSxDQUFNLE1BQU4sR0FESjtTQUFBLE1BRUssSUFBRyxHQUFBLEtBQU8sUUFBVjt5QkFDRCxLQUFBLENBQU0sSUFBQSxDQUFLLEdBQUEsQ0FBSSxNQUFKLENBQUwsQ0FBTixHQURDO1NBQUEsTUFFQSxJQUFHLEdBQUEsS0FBTyxTQUFWO3lCQUNELEtBQUEsQ0FBTSxJQUFBLENBQUssR0FBQSxDQUFJLE1BQUosQ0FBTCxDQUFOLEdBREM7U0FBQSxNQUVBLElBQUcsR0FBQSxLQUFRLE9BQVIsSUFBQSxHQUFBLEtBQWdCLGFBQWhCLElBQUEsR0FBQSxLQUE4QixXQUE5QixJQUFBLEdBQUEsS0FBMEMsTUFBN0M7eUJBQ0QsS0FBQSxDQUFNLEVBQUEsR0FBRyxLQUFILEdBQVcsSUFBWCxHQUFnQixHQUF0QixHQURDO1NBQUEsTUFFQSxJQUFHLEdBQUEsS0FBTyxLQUFWO3lCQUNELEtBQUEsQ0FBTSxFQUFBLEdBQUcsS0FBSCxHQUFXLE1BQVgsR0FBa0IsR0FBeEIsR0FEQztTQUFBLE1BQUE7eUJBR0QsS0FBQSxDQUFNLEVBQUEsR0FBRyxLQUFILEdBQVcsSUFBWCxHQUFnQixHQUFoQixHQUFtQixNQUFuQixHQUEwQixHQUFoQyxHQUhDOztBQWZUOztBQUZVOztBQXNCZCxhQUFBLEdBQWdCLFNBQUMsTUFBRDtBQUVaLFFBQUE7SUFBQSxNQUFBLEdBQVM7QUFDVDtTQUFhLG1HQUFiO1FBQ0ksS0FBQSxHQUFRLE1BQU8sQ0FBQSxLQUFBO1FBQ2YsR0FBQSxHQUFRLEtBQU0sQ0FBQSxDQUFBO1FBQ2QsS0FBQSxHQUFRLEtBQU0sQ0FBQSxDQUFBO1FBRWQsT0FBQSxHQUFVLFNBQUMsQ0FBRDttQkFBTyxHQUFBLENBQUksSUFBQSxDQUFLLENBQUwsQ0FBSjtRQUFQO1FBQ1YsT0FBQSxHQUFVLFNBQUMsQ0FBRDttQkFBTyxHQUFBLENBQUksSUFBQSxDQUFLLENBQUwsQ0FBSjtRQUFQO1FBQ1YsU0FBQSxHQUFZLFNBQUMsQ0FBRDttQkFBTyxHQUFBLENBQUksTUFBQSxDQUFPLENBQVAsQ0FBSjtRQUFQO1FBQ1osTUFBQSxHQUFTLFNBQUMsS0FBRCxFQUFRLENBQVI7QUFDTCxnQkFBQTtZQUFBLEtBQUEsQ0FBTSxLQUFBLENBQU0sRUFBQSxHQUFFLGFBQUMsSUFBSSxLQUFMLENBQVIsQ0FBTjtZQUNBLElBQWEsS0FBSyxDQUFDLE1BQU4sSUFBaUIsU0FBQSxNQUFPLENBQUEsS0FBQSxHQUFNLENBQU4sQ0FBUyxDQUFBLENBQUEsRUFBaEIsS0FBMkIsWUFBM0IsQ0FBOUI7dUJBQUEsS0FBQSxDQUFNLEdBQU4sRUFBQTs7UUFGSztBQUtULGdCQUFPLEdBQVA7QUFBQSxpQkFDUyxZQURUOzZCQUNrRCxLQUFBLENBQU0sSUFBQSxHQUFJLENBQUMsR0FBQSxDQUFJLEVBQUosRUFBUSxNQUFSLENBQUQsQ0FBVjtBQUF6QztBQURULGlCQUVTLFFBRlQ7Z0JBRWtELE1BQUEsSUFBVTs2QkFBRyxLQUFBLENBQU0sSUFBQSxHQUFJLENBQUMsR0FBQSxDQUFJLEVBQUosRUFBUSxNQUFSLENBQUQsQ0FBVjtBQUF0RDtBQUZULGlCQUdTLFNBSFQ7Z0JBR2tELE1BQUEsSUFBVTs2QkFBRyxLQUFBLENBQU0sSUFBQSxHQUFJLENBQUMsR0FBQSxDQUFJLEVBQUosRUFBUSxNQUFSLENBQUQsQ0FBVjtBQUF0RDtBQUhULGlCQUlTLGFBSlQ7NkJBSWtELE1BQUEsQ0FBTyxPQUFQO0FBQXpDO0FBSlQsaUJBS1MsWUFMVDtBQUFBLGlCQUtzQixVQUx0Qjs2QkFLa0QsTUFBQSxDQUFPLE9BQVA7QUFBNUI7QUFMdEIsaUJBTVMsT0FOVDs2QkFNa0QsTUFBQSxDQUFPLFVBQVAsRUFBbUIsS0FBbkI7QUFBekM7QUFOVCxpQkFPUyxJQVBUOzZCQU9rRCxNQUFBLENBQU8sVUFBUCxFQUFtQixLQUFuQjtBQUF6QztBQVBULGlCQVFTLElBUlQ7NkJBUWtELE1BQUEsQ0FBTyxVQUFQLEVBQW1CLElBQW5CO0FBQXpDO0FBUlQsaUJBU1MsUUFUVDs2QkFTa0QsTUFBQSxDQUFPLEtBQVA7QUFBekM7QUFUVCxpQkFVUyxjQVZUO0FBQUEsaUJBVXdCLFlBVnhCOzZCQVVrRCxNQUFBLENBQU8sU0FBUDtBQUExQjtBQVZ4QixpQkFXUyxVQVhUOzZCQVdrRCxNQUFBLENBQU8sTUFBUDtBQUF6QztBQVhULGlCQVlTLEdBWlQ7NkJBWWtELE1BQUEsQ0FBTyxTQUFQO0FBQXpDO0FBWlQsaUJBYVMsR0FiVDtnQkFjUSxZQUFHLE1BQU8sQ0FBQSxLQUFBLEdBQU0sQ0FBTixDQUFTLENBQUEsQ0FBQSxFQUFoQixLQUEyQixTQUEzQixJQUFBLElBQUEsS0FBcUMsV0FBckMsSUFBQSxJQUFBLEtBQWlELGNBQXBEO2lDQUF5RSxNQUFBLENBQU8sU0FBUCxHQUF6RTtpQkFBQSxNQUFBO2lDQUFnRyxNQUFBLENBQU8sT0FBUCxHQUFoRzs7QUFEQztBQWJULGlCQWVTLFNBZlQ7QUFBQSxpQkFlbUIsV0FmbkI7QUFBQSxpQkFlK0IsY0FmL0I7NkJBZW1ELE1BQUEsQ0FBTyxJQUFQLEVBQWEsR0FBQSxHQUFJLEtBQWpCO0FBQXBCO0FBZi9CLGlCQWdCUyxRQWhCVDs2QkFnQmtELE1BQUEsQ0FBTyxJQUFQO0FBQXpDO0FBaEJULGlCQWlCUyxHQWpCVDtBQUFBLGlCQWlCWSxHQWpCWjtnQkFpQmtELElBQUcsQ0FBSSxLQUFLLENBQUMsU0FBYjtpQ0FBNEIsTUFBQSxDQUFPLElBQVAsR0FBNUI7aUJBQUEsTUFBQTt5Q0FBQTs7QUFBdEM7QUFqQlosaUJBa0JTLEdBbEJUO0FBQUEsaUJBa0JhLEdBbEJiO0FBQUEsaUJBa0JpQixHQWxCakI7QUFBQSxpQkFrQnFCLElBbEJyQjtBQUFBLGlCQWtCMEIsSUFsQjFCO0FBQUEsaUJBa0IrQixLQWxCL0I7QUFBQSxpQkFrQnFDLElBbEJyQztBQUFBLGlCQW1CUyxHQW5CVDtBQUFBLGlCQW1CYSxHQW5CYjtBQUFBLGlCQW1CaUIsR0FuQmpCO0FBQUEsaUJBbUJxQixHQW5CckI7QUFBQSxpQkFtQnlCLEdBbkJ6QjtBQUFBLGlCQW1CNkIsTUFuQjdCO0FBQUEsaUJBbUJvQyxZQW5CcEM7QUFBQSxpQkFvQlMsYUFwQlQ7QUFBQSxpQkFvQnVCLFdBcEJ2QjtBQUFBLGlCQXFCUyxTQXJCVDtBQUFBLGlCQXFCbUIsaUJBckJuQjs2QkFxQmtELE1BQUEsQ0FBTyxJQUFQO0FBQS9CO0FBckJuQixpQkFzQlMsR0F0QlQ7QUFBQSxpQkFzQmEsR0F0QmI7QUFBQSxpQkFzQmlCLEdBdEJqQjs2QkFzQmtELE1BQUEsQ0FBTyxPQUFQO0FBQWpDO0FBdEJqQixpQkF1QlMsYUF2QlQ7QUFBQSxpQkF1QnVCLFdBdkJ2QjtBQUFBLGlCQXVCbUMsSUF2Qm5DO0FBQUEsaUJBdUJ3QyxJQXZCeEM7NkJBdUJrRCxNQUFBLENBQU8sU0FBQyxDQUFEOzJCQUFPLElBQUEsQ0FBSyxJQUFBLENBQUssQ0FBTCxDQUFMO2dCQUFQLENBQVA7QUFBVjtBQXZCeEMsaUJBd0JTLE1BeEJUO0FBQUEsaUJBd0JnQixXQXhCaEI7QUFBQSxpQkF3QjRCLFlBeEI1QjtBQUFBLGlCQXdCeUMsR0F4QnpDO0FBQUEsaUJBd0I2QyxJQXhCN0M7QUFBQSxpQkF3QmtELE1BeEJsRDs2QkF3QjhELE1BQUEsQ0FBTyxHQUFQO0FBQVo7QUF4QmxELGlCQXlCUyxPQXpCVDs2QkF5QmtELE1BQUEsQ0FBTyxPQUFQO0FBQXpDO0FBekJULGlCQTBCUyxLQTFCVDtBQUFBLGlCQTBCZSxPQTFCZjtBQUFBLGlCQTBCdUIsS0ExQnZCO0FBQUEsaUJBMEI2QixPQTFCN0I7QUFBQSxpQkEwQnFDLE9BMUJyQztBQUFBLGlCQTBCNkMsVUExQjdDO0FBQUEsaUJBMEJ3RCxTQTFCeEQ7QUFBQSxpQkEwQmtFLFdBMUJsRTtBQUFBLGlCQTBCOEUsS0ExQjlFO0FBQUEsaUJBMEJvRixPQTFCcEY7QUFBQSxpQkEwQjRGLE1BMUI1RjtBQUFBLGlCQTJCUyxJQTNCVDtBQUFBLGlCQTJCYyxTQTNCZDtBQUFBLGlCQTJCd0IsTUEzQnhCO0FBQUEsaUJBMkIrQixNQTNCL0I7QUFBQSxpQkEyQnNDLE1BM0J0QztBQUFBLGlCQTJCNkMsTUEzQjdDO0FBQUEsaUJBMkJvRCxPQTNCcEQ7QUFBQSxpQkEyQjRELFFBM0I1RDtBQUFBLGlCQTJCcUUsY0EzQnJFO0FBQUEsaUJBMkJvRixPQTNCcEY7QUFBQSxpQkE0QlMsTUE1QlQ7QUFBQSxpQkE0QmdCLE9BNUJoQjtBQUFBLGlCQTRCd0IsUUE1QnhCOzZCQTRCa0QsTUFBQSxDQUFPLFVBQVA7QUFBMUI7QUE1QnhCLGlCQTZCUyxZQTdCVDtBQThCUSx3QkFBTyxLQUFQO0FBQUEseUJBQ1MsU0FEVDtxQ0FDd0IsTUFBQSxDQUFPLElBQVA7QUFBZjtBQURUO3FDQUVTLE1BQUEsQ0FBTyxXQUFQO0FBRlQ7QUFEQztBQTdCVDtnQkFrQ1EsS0FBQSxDQUFNLEdBQUEsR0FBSSxHQUFKLEdBQVEsR0FBZDs2QkFFQSxNQUFBLENBQU8sSUFBUDtBQXBDUjtBQWJKOztBQUhZOztBQXNEaEIsT0FBQSxHQUFVLFNBQUE7V0FBRyxTQUFBLENBQVUsRUFBQSxHQUFHLE1BQU0sQ0FBQyxPQUFwQjtBQUFIOztBQUNWLEtBQUEsR0FBVSxTQUFBO0FBRU4sUUFBQTtJQUFBLEtBQUEsR0FBUSxDQUFHLENBQUMsSUFBQSxDQUFLLFFBQUwsQ0FBRCxDQUFBLEdBQWUsR0FBZixHQUFpQixDQUFDLE1BQUEsQ0FBTyxRQUFQLENBQUQsQ0FBakIsR0FBa0MsR0FBbEMsR0FBb0MsQ0FBQyxJQUFBLENBQUssV0FBTCxDQUFELENBQXBDLEdBQXNELGtCQUF0RCxHQUF1RSxDQUFDLElBQUEsQ0FBSyxXQUFMLENBQUQsQ0FBdkUsR0FBeUYsSUFBNUY7SUFFUixLQUFBLEdBQVEsUUFBUSxDQUFDLEdBQVQsQ0FBYSxTQUFDLElBQUQ7QUFDakIsWUFBQTtRQUFDLGVBQUQsRUFBUSxjQUFSLEVBQWM7UUFDZCxRQUFBLEdBQVcsSUFBSSxDQUFDLEtBQUwsQ0FBVyxnQkFBWCxDQUE2QixDQUFBLENBQUE7UUFDeEMsTUFBQSxHQUFjLEtBQUgsR0FBYyxJQUFBLENBQUssS0FBTSxDQUFBLENBQUEsQ0FBWCxDQUFBLEdBQWlCLElBQUEsQ0FBSyxJQUFBLENBQUssS0FBTSxTQUFYLENBQUwsQ0FBakIsR0FBMEMsSUFBeEQsR0FBa0U7UUFDN0UsS0FBQSxHQUFXLEdBQUEsQ0FBSSxJQUFKLEVBQVUsRUFBVjtRQUNYLEtBQUEsR0FBVyxJQUFBLENBQUssS0FBTSxZQUFYLENBQUEsR0FBb0IsSUFBQSxDQUFLLEtBQUEsQ0FBTSxLQUFNLFNBQUksQ0FBQyxLQUFYLENBQWlCLEdBQWpCLENBQXNCLENBQUEsQ0FBQSxDQUE1QixDQUFMLENBQXBCLEdBQTRELEdBQTVELEdBQWtFLElBQUEsQ0FBSyxVQUFBLENBQVcsS0FBTSxTQUFJLENBQUMsS0FBWCxDQUFpQixHQUFqQixDQUFzQixTQUFJLENBQUMsSUFBM0IsQ0FBZ0MsR0FBaEMsQ0FBWCxDQUFMO2VBQzdFLEtBQUssQ0FBQyxJQUFOLENBQVcsTUFBQSxHQUFTLE1BQVQsR0FBa0IsS0FBbEIsR0FBMEIsSUFBQSxDQUFLLFdBQUwsQ0FBckM7SUFOaUIsQ0FBYjtJQVFSLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBQSxDQUFLLG9FQUFMLENBQVg7V0FBb0YsT0FBQSxDQUVwRixHQUZvRixDQUVoRixJQUFBLEdBQUksQ0FBRSxLQUFLLENBQUMsSUFBTixDQUFXLElBQVgsQ0FBRixDQUFKLEdBQXdCLElBRndEO0FBWjlFIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4jIyNcblxuIyBoYW5kbGUgdmFyaW91cyB0YXNrczogXG4jXG4jICAgLSBjb21waWxlIGFuZCBzYXZlIGludG8gYC5qc2AgZmlsZXMgXG4jICAgLSBjb21waWxlIGFuZCBwcmludCB0byBzdGRvdXQgXG4jICAgLSByZWNvbXBpbGUgaWYgdGhlIHNvdXJjZSBjaGFuZ2VzXG4jICAgLSBwcmludCBsZXhlciB0b2tlbnNcbiMgICAtIHByaW50IGEgc3ludGF4IHRyZWVcbiMgICAtIGxhdW5jaCBhIFJFUExcblxuZnMgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ2ZzJ1xucGF0aCAgICAgICAgICAgICA9IHJlcXVpcmUgJ3BhdGgnXG5ub3B0ICAgICAgICAgICAgID0gcmVxdWlyZSAnbm9wdCdcbmhlbHBlcnMgICAgICAgICAgPSByZXF1aXJlICcuL2hlbHBlcnMnXG5Lb2ZmZWUgICAgICAgICAgID0gcmVxdWlyZSAnLi9rb2ZmZWUnXG57IHNwYXduLCBleGVjIH0gID0gcmVxdWlyZSAnY2hpbGRfcHJvY2VzcydcbnsgRXZlbnRFbWl0dGVyIH0gPSByZXF1aXJlICdldmVudHMnXG5cbnVzZVdpblBhdGhTZXAgICAgPSBwYXRoLnNlcCBpcyAnXFxcXCdcblxuaGVscGVycy5leHRlbmQgS29mZmVlLCBuZXcgRXZlbnRFbWl0dGVyICMgQWxsb3cgZW1pdHRpbmcgTm9kZSBldmVudHNcbmhlbHBlcnMuY29sb3JzKClcblxueyBGRUFUVVJFUywgbG9nRmVhdHVyZXMgfSA9IHJlcXVpcmUgJy4vZmVhdHVyZXMnXG5cbnsgYmFzZUZpbGVOYW1lLCBpc0NvZmZlZSwgc3RyaW5naWZ5LCBtZXJnZSwgcGFkIH0gPSBoZWxwZXJzXG5cbmVycm9yICAgICA9IGNvbnNvbGUuZXJyb3JcbnByaW50ICAgICA9IChsaW5lKSAtPiBwcm9jZXNzLnN0ZG91dC53cml0ZSBsaW5lXG5wcmludExpbmUgPSAobGluZSkgLT4gcHJvY2Vzcy5zdGRvdXQud3JpdGUgbGluZSArICdcXG4nICMgPz8/XG5wcmludFdhcm4gPSAobGluZSkgLT4gcHJvY2Vzcy5zdGRlcnIud3JpdGUgbGluZSArICdcXG4nICMgPz8/XG5oaWRkZW4gICAgPSAoZmlsZSkgLT4gL15cXC58fiQvLnRlc3QgZmlsZVxuXG5TV0lUQ0hFUyA9IFtcbiAgICBbJy1iJyAnLS1iYXJlJyAgICAgICAgICAgICAgJ2NvbXBpbGUgd2l0aG91dCBhIHRvcC1sZXZlbCBmdW5jdGlvbiB3cmFwcGVyJyAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctYycgJy0tY29tcGlsZScgICAgICAgICAgICdjb21waWxlIHRvIEphdmFTY3JpcHQgYW5kIHNhdmUgYXMgLmpzIGZpbGVzJyAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLWQnICctLWRvYycgICAgICAgICAgICAgICAnbG9nIHRoZSDilrhkb2Mgc2VjdGlvbnMnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLWUnICctLWV2YWwgU1RSSU5HJyAgICAgICAnZXZhbHVhdGUgYSBzdHJpbmcgYW5kIHByaW50IHRoZSByZXN1bHQnICAgICAgICAgICAgICAgW1N0cmluZywgQXJyYXldIF1cbiAgICBbJy1mJyAnLS1mZWF0dXJlcycgICAgICAgICAgJ2xpc3QgYXZhaWxhYmxlIGZlYXR1cmVzJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWycnICAgJy0tbm8tYGZlYXR1cmUnICAgICAgICdkaXNhYmxlIGEgZmVhdHVyZSwgZS5nLiAtLW5vLW5lZ2F0aXZlLWluZGV4JyAgICAgICAgICAgbnVsbCAgICAgICAgICAgXVxuICAgIFsnLWgnICctLWhlbHAnICAgICAgICAgICAgICAnZGlzcGxheSB0aGlzIGhlbHAgbWVzc2FnZScgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1qJyAnLS1qcycgICAgICAgICAgICAgICAgJ3ByaW50IG91dCB0aGUgY29tcGlsZWQgSmF2YVNjcmlwdCcgICAgICAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctbScgJy0tbWFwJyAgICAgICAgICAgICAgICdnZW5lcmF0ZSBzb3VyY2UgbWFwIGFuZCBzYXZlIGFzIC5qcy5tYXAgZmlsZXMnICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLU0nICctLWlubGluZS1tYXAnICAgICAgICAnZ2VuZXJhdGUgc291cmNlIG1hcCBhbmQgaW5jbHVkZSBpdCBkaXJlY3RseSBpbiBvdXRwdXQnIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJycgICAnLS1tZXRhbG9nJyAgICAgICAgICAgJ21ldGEgbG9nIChkZWZhdWx0OiBjb25zb2xlLmxvZyknICAgICAgICAgICAgICAgICAgICAgICBTdHJpbmcgICAgICAgICBdXG4gICAgWyctbicgJy0tbm9vcCcgICAgICAgICAgICAgICdkb2VzIG5vdGhpbmcsIGZvciBkZWJ1Z2dpbmcgcHVycG9zZXMnICAgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLW8nICctLW91dHB1dCBESVInICAgICAgICAnc2V0IHRoZSBvdXRwdXQgZGlyZWN0b3J5IGZvciBjb21waWxlZCBKYXZhU2NyaXB0JyAgICAgIFN0cmluZyAgICAgICAgIF1cbiAgICBbJy1QJyAnLS1wYXJzZScgICAgICAgICAgICAgJ3ByaW50IG91dCB0aGUgcGFyc2UgdHJlZSB0aGF0IHRoZSBwYXJzZXIgcHJvZHVjZXMnICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctcicgJy0tcmVxdWlyZSBNT0RVTEUnICAgICdyZXF1aXJlIHRoZSBnaXZlbiBtb2R1bGUgYmVmb3JlIGV2YWwgb3IgUkVQTCcgICAgICAgICBbU3RyaW5nLCBBcnJheV0gXVxuICAgIFsnLUMnICctLWNvZmZlZScgICAgICAgICAgICAncHJpbnQgdGhlIHRva2VuIHN0cmVhbSBhcyBDb2ZmZWVTY3JpcHQnICAgICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1zJyAnLS1zdGRpbycgICAgICAgICAgICAgJ2xpc3RlbiBmb3IgYW5kIGNvbXBpbGUgc2NyaXB0cyBvdmVyIHN0ZGlvJyAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctdCcgJy0tdGVzdCcgICAgICAgICAgICAgICdjb21waWxlIGFuZCBydW4gdGhlIEB0ZXN0IGNvZGUnICAgICAgICAgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLVQnICctLXRva2VucycgICAgICAgICAgICAncHJpbnQgb3V0IHRoZSB0b2tlbnMgdGhhdCB0aGUgbGV4ZXIvcmV3cml0ZXIgcHJvZHVjZScgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy12JyAnLS12ZXJzaW9uJyAgICAgICAgICAgJ2Rpc3BsYXkgdGhlIHZlcnNpb24gbnVtYmVyJyAgICAgICAgICAgICAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctdycgJy0td2F0Y2gnICAgICAgICAgICAgICd3YXRjaCBzY3JpcHRzIGZvciBjaGFuZ2VzIGFuZCByZXJ1biBjb21tYW5kcycgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuXVxuXG5vcHRzID0ge31cblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgXG4jICAwMDAwMDAwICAgMDAwICAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcblxucGFyc2VPcHRpb25zID0gLT5cblxuICAgIGtub3duID0gRGVidWc6Qm9vbGVhblxuICAgIHNob3J0ID0gRDonLS1EZWJ1ZycgcDonLS1qcydcbiAgICBTV0lUQ0hFUy5tYXAgKHMpIC0+IGwgPSBzWzFdLnNwbGl0KCcgJylbMF1bMi4uXTsga25vd25bbF0gPSBzWzNdIGlmIHNbM107IHNob3J0W3NbMF1bMV1dID0gXCItLSN7bH1cIiBpZiBzWzBdIT0nJ1xuICAgIEZFQVRVUkVTLm1hcCAoZikgLT4ga25vd25bZi5sYWddID0gQm9vbGVhblxuICAgIFxuICAgIG8gPSBvcHRzID0gbm9wdCBrbm93biwgc2hvcnRcbiAgICAgICAgXG4gICAgby5jb21waWxlICBvcj0gISFvLm91dHB1dFxuICAgIG8uYXJndW1lbnRzICA9IG8uYXJndi5yZW1haW5cbiAgICBvLnByZWx1ZGUgICAgPSBtYWtlUHJlbHVkZSBvLnJlcXVpcmUgaWYgby5yZXF1aXJlXG4gICAgby5ydW4gICAgICAgID0gbm90IChvLmNvbXBpbGUgb3Igby5qcyBvciBvLm1hcCBvciBvLnRva2VucyBvciBvLnBhcnNlKVxuICAgIG8uanMgICAgICAgICA9ICEhKG8uanMgb3Igby5ldmFsIG9yIG8uc3RkaW8gYW5kIG8uY29tcGlsZSkgIyBqcyBvdXRwdXQgaXMgcGFzc2VkIHRvIGV2YWwgYW5kIHN0ZGlvIGNvbXBpbGVcbiAgICBcbiAgICBvLmZlYXR1cmUgPSB7fVxuICAgIEZFQVRVUkVTLm1hcCAoZikgLT4gby5mZWF0dXJlW2Yua2V5XSA9IG9bZi5mbGFnXSA/IHRydWU7IGRlbGV0ZSBvW2YuZmxhZ11cbiAgICBcbiAgICBpZiBvLkRlYnVnXG4gICAgICAgIGRlbGV0ZSBvLmFyZ3ZcbiAgICAgICAgbG9nIHN0cmluZ2lmeSBvXG5cbiMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4jIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuXG5ydW4gPSAtPlxuICAgIFxuICAgIHBhcnNlT3B0aW9ucygpXG4gICAgXG4gICAgaWYgb3B0cy5mZWF0dXJlLmNvbG9yID09IGZhbHNlXG4gICAgICAgIGNvbG9yZXR0ZS5vcHRpb25zLmVuYWJsZWQgPSBmYWxzZVxuICAgICAgICBcbiAgICByZXR1cm4gbG9nRmVhdHVyZXMoKSAgaWYgb3B0cy5mZWF0dXJlc1xuICAgIHJldHVybiB1c2FnZSgpICAgICAgICBpZiBvcHRzLmhlbHBcbiAgICByZXR1cm4gdmVyc2lvbigpICAgICAgaWYgb3B0cy52ZXJzaW9uXG4gICAgcmV0dXJuIHN0YXJ0UmVwbCgpICAgIGlmIG9wdHMuaW50ZXJhY3RpdmVcbiAgICByZXR1cm4gY29tcGlsZVN0ZGlvKCkgaWYgb3B0cy5zdGRpb1xuICAgIGlmIG9wdHMuZXZhbFxuICAgICAgICBmb3IgZXZhbCBpbiBvcHRzLmV2YWxcbiAgICAgICAgICAgIGNvbXBpbGVTY3JpcHQgZXZhbFxuICAgICAgICByZXR1cm5cbiAgICByZXR1cm4gc3RhcnRSZXBsKCkgICAgaWYgbm90IG9wdHMuYXJndW1lbnRzLmxlbmd0aFxuICAgIFxuICAgIGxpdGVyYWxzID0gaWYgbm90IG9wdHMud2F0Y2ggYW5kIG5vdCBvcHRzLmNvbXBpbGUgdGhlbiBvcHRzLmFyZ3VtZW50cy5zcGxpY2UgMSBlbHNlIFtdXG4gICAgXG4gICAgcHJvY2Vzcy5hcmd2ID0gcHJvY2Vzcy5hcmd2WzAuLjFdLmNvbmNhdCBsaXRlcmFsc1xuICAgIHByb2Nlc3MuYXJndlswXSA9ICdrb2ZmZWUnXG5cbiAgICBvcHRzLm91dHB1dCA9IHBhdGgucmVzb2x2ZSBvcHRzLm91dHB1dCBpZiBvcHRzLm91dHB1dFxuICAgIGZvciBzb3VyY2UgaW4gb3B0cy5hcmd1bWVudHNcbiAgICAgICAgc291cmNlID0gcGF0aC5yZXNvbHZlIHNvdXJjZVxuICAgICAgICBcbiAgICAgICAgaWYgb3B0cy53YXRjaFxuICAgICAgICAgICAgd2F0Y2hQYXRoIHNvdXJjZVxuICAgICAgICBlbHNlICAgICBcbiAgICAgICAgICAgIGNvbXBpbGVQYXRoIHNvdXJjZSwgdG9wTGV2ZWw6eWVzXG5cbmV4cG9ydHMucnVuID0gcnVuXG4gICAgICAgIFxuc3RhcnRSZXBsID0gLT5cbiAgICBcbiAgICAjIE1ha2UgdGhlIFJFUEwgdXNlIHRoZSBnbG9iYWwgY29udGV4dCBzbyBhcyB0byBcbiAgICAjICAgKGEpIGJlIGNvbnNpc3RlbnQgd2l0aCB0aGUgYG5vZGVgIFJFUEwgYW5kLCB0aGVyZWZvcmUsIFxuICAgICMgICAoYikgbWFrZSBwYWNrYWdlcyB0aGF0IG1vZGlmeSBuYXRpdmUgcHJvdG90eXBlcyAoc3VjaCBhcyAnY29sb3JzJyBhbmQgJ3N1Z2FyJykgd29yayBhcyBleHBlY3RlZC5cbiAgICBcbiAgICByZXBsQ2xpT3B0cyA9IHVzZUdsb2JhbDogeWVzXG4gICAgcmVwbENsaU9wdHMucHJlbHVkZSA9IG9wdHMucHJlbHVkZVxuICAgIHJlcXVpcmUoJy4vcmVwbCcpLnN0YXJ0IHJlcGxDbGlPcHRzXG5cbm1ha2VQcmVsdWRlID0gKHJlcXVpcmVzKSAtPlxuICAgIFxuICAgIHJlcXVpcmVzLm1hcCAobW9kdWxlKSAtPlxuICAgICAgICBbXywgbmFtZSwgbW9kdWxlXSA9IG1hdGNoIGlmIG1hdGNoID0gbW9kdWxlLm1hdGNoKC9eKC4qKT0oLiopJC8pXG4gICAgICAgIG5hbWUgfHw9IGJhc2VGaWxlTmFtZSBtb2R1bGUsIHllcywgdXNlV2luUGF0aFNlcFxuICAgICAgICBcIiN7bmFtZX0gPSByZXF1aXJlKCcje21vZHVsZX0nKVwiXG4gICAgLmpvaW4gJzsnXG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG5cbiMgQ29tcGlsZSBhIHNjcmlwdCBvciBhIGRpcmVjdG9yeS4gSWYgYSBkaXJlY3RvcnkgaXMgcGFzc2VkLCByZWN1cnNpdmVseSBjb21waWxlIGFsbCAnLmNvZmZlZScgYW5kICcua29mZmVlJyBmaWxlcy5cblxuY29tcGlsZVBhdGggPSAoc291cmNlLCB0b3BMZXZlbDp0b3BMZXZlbD1ubykgLT5cblxuICAgIHJldHVybiBpZiBub3QgdG9wTGV2ZWwgYW5kIGhpZGRlbiBzb3VyY2VcbiAgICAgICAgICAgICAgXG4gICAgdHJ5XG4gICAgICAgIHN0YXRzID0gZnMuc3RhdFN5bmMgc291cmNlXG4gICAgY2F0Y2ggZXJyXG4gICAgICAgIGlmIGVyci5jb2RlIGlzICdFTk9FTlQnXG4gICAgICAgICAgICBlcnJvciBcIkNvbW1hbmQuY29tcGlsZVBhdGggY2FuJ3Qgc3RhdCAnI3tzb3VyY2V9J1wiXG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQgMVxuICAgICAgICB0aHJvdyBlcnJcbiAgICAgICAgXG4gICAgaWYgc3RhdHMuaXNEaXJlY3RvcnkoKVxuICAgICAgICBcbiAgICAgICAgaWYgcGF0aC5iYXNlbmFtZShzb3VyY2UpIGluIFsnbm9kZV9tb2R1bGVzJyAnLmdpdCddXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICBpZiBvcHRzLnJ1blxuICAgICAgICAgICAgY29tcGlsZVBhdGggZmluZERpcmVjdG9yeUluZGV4KHNvdXJjZSksIHRvcExldmVsOnRvcExldmVsXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICAgXG4gICAgICAgIGxvZyAnQ29tbWFuZC5jb21waWxlUGF0aCBkaXI6Jywgc291cmNlIGlmIG9wdHMuRGVidWdcbiAgICAgICAgXG4gICAgICAgIHRyeVxuICAgICAgICAgICAgZmlsZXMgPSBmcy5yZWFkZGlyU3luYyBzb3VyY2VcbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICBpZiBlcnIuY29kZSBpcyAnRU5PRU5UJyB0aGVuIHJldHVybiBcbiAgICAgICAgICAgIHRocm93IGVyclxuICAgICAgICAgICAgXG4gICAgICAgIGZvciBmaWxlIGluIGZpbGVzXG4gICAgICAgICAgICBjb21waWxlUGF0aCBwYXRoLmpvaW4gc291cmNlLCBmaWxlXG4gICAgICAgICAgICBcbiAgICBlbHNlIGlmIHRvcExldmVsIG9yIGlzQ29mZmVlIHNvdXJjZVxuICAgICAgICBcbiAgICAgICAgdHJ5XG4gICAgICAgICAgICBjb2RlID0gZnMucmVhZEZpbGVTeW5jIHNvdXJjZVxuICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgIGlmIGVyci5jb2RlIGlzICdFTk9FTlQnIHRoZW4gcmV0dXJuXG4gICAgICAgICAgICB0aHJvdyBlcnJcbiAgICAgICAgXG4gICAgICAgIGxvZyAnQ29tbWFuZC5jb21waWxlUGF0aCBmaWxlOicsIHNvdXJjZSBpZiBvcHRzLkRlYnVnXG4gICAgICAgICAgICBcbiAgICAgICAgY29tcGlsZVNjcmlwdCBjb2RlLnRvU3RyaW5nKCksIHNvdXJjZVxuICAgICAgICBcbmZpbmREaXJlY3RvcnlJbmRleCA9IChzb3VyY2UpIC0+XG5cbiAgICBmb3IgZXh0IGluIEtvZmZlZS5GSUxFX0VYVEVOU0lPTlNcbiAgICAgICAgaW5kZXggPSBwYXRoLmpvaW4gc291cmNlLCBcImluZGV4I3tleHR9XCJcbiAgICAgICAgdHJ5XG4gICAgICAgICAgICByZXR1cm4gaW5kZXggaWYgKGZzLnN0YXRTeW5jIGluZGV4KS5pc0ZpbGUoKVxuICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgIHRocm93IGVyciB1bmxlc3MgZXJyLmNvZGUgaXMgJ0VOT0VOVCdcbiAgICBlcnJvciBcIk1pc3NpbmcgaW5kZXguY29mZmVlIGluICN7c291cmNlfVwiXG4gICAgcHJvY2Vzcy5leGl0IDFcblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAgICAgICAwMDAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgICAwMDAgICAgIFxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgICAwMDAgICAgIFxuXG4jIENvbXBpbGUgYSBzaW5nbGUgc291cmNlIHNjcmlwdCwgY29udGFpbmluZyB0aGUgZ2l2ZW4gY29kZSwgYWNjb3JkaW5nIHRvIHRoZSByZXF1ZXN0ZWQgb3B0aW9ucy4gXG4jIElmIGV2YWx1YXRpbmcgdGhlIHNjcmlwdCBkaXJlY3RseSBzZXRzIGBfX2ZpbGVuYW1lYCwgYF9fZGlybmFtZWAgYW5kIGBtb2R1bGUuZmlsZW5hbWVgIHRvIGJlIGNvcnJlY3QgcmVsYXRpdmUgdG8gdGhlIHNjcmlwdCdzIHBhdGguXG5cbmNvbXBpbGVTY3JpcHQgPSAoY29kZSwgc291cmNlPW51bGwpIC0+XG4gICAgXG4gICAgbyA9IG9wdHNcbiAgICBvcHRpb25zID0gY29tcGlsZU9wdGlvbnMgc291cmNlXG4gICAgXG4gICAgdHJ5XG4gICAgICAgIHQgPSB0YXNrID0ge3NvdXJjZSwgY29kZSwgb3B0aW9uc31cbiAgICAgICAgS29mZmVlLmVtaXQgJ2NvbXBpbGUnLCB0YXNrXG4gICAgICAgIFxuICAgICAgICBpZiBvLnRva2Vuc1xuICAgICAgICAgICAgcHJpbnRUb2tlbnMgS29mZmVlLnRva2VucyB0LmNvZGUsIHQub3B0aW9uc1xuICAgICAgICBlbHNlIGlmIG8uY29mZmVlXG4gICAgICAgICAgICBwcmludFJld3JpdGVyIEtvZmZlZS50b2tlbnMgdC5jb2RlLCB0Lm9wdGlvbnNcbiAgICAgICAgZWxzZSBpZiBvLnBhcnNlXG4gICAgICAgICAgICBwcmludExpbmUgS29mZmVlLm5vZGVzKHQuY29kZSwgdC5vcHRpb25zKS50b1N0cmluZygpLnRyaW0oKVxuICAgICAgICBlbHNlIGlmIG8ucnVuXG4gICAgICAgICAgICBLb2ZmZWUucmVnaXN0ZXIoKVxuICAgICAgICAgICAgS29mZmVlLmV2YWwgb3B0cy5wcmVsdWRlLCB0Lm9wdGlvbnMgaWYgb3B0cy5wcmVsdWRlXG4gICAgICAgICAgICB0Lm9wdGlvbnMuZmlsZW5hbWUgPz0gb3B0aW9ucy5zb3VyY2VcbiAgICAgICAgICAgIGlmIG9wdHMubm9vcCB0aGVuIGxvZyBcIm5vb3AgcnVuICN7c291cmNlfVwiXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgS29mZmVlLnJ1biB0LmNvZGUsIHQub3B0aW9uc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBjb21waWxlZCA9IEtvZmZlZS5jb21waWxlIHQuY29kZSwgdC5vcHRpb25zXG4gICAgICAgICAgICB0Lm91dHB1dCA9IGNvbXBpbGVkXG4gICAgICAgICAgICBpZiBvLm1hcFxuICAgICAgICAgICAgICAgIHQub3V0cHV0ID0gY29tcGlsZWQuanNcbiAgICAgICAgICAgICAgICB0LnNvdXJjZU1hcCA9IGNvbXBpbGVkLnYzU291cmNlTWFwXG5cbiAgICAgICAgICAgIEtvZmZlZS5lbWl0ICdzdWNjZXNzJywgdGFza1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBvLmpzXG4gICAgICAgICAgICAgICAgaWYgb3B0cy5ub29wIHRoZW4gbG9nIFwibm9vcCBqcyAje3NvdXJjZX1cIlxuICAgICAgICAgICAgICAgIGVsc2UgXG4gICAgICAgICAgICAgICAgICAgIHByaW50TGluZSB0Lm91dHB1dC50cmltKClcbiAgICAgICAgICAgIGVsc2UgaWYgby5jb21waWxlIG9yIG8ubWFwXG4gICAgICAgICAgICAgICAgaWYgb3B0cy5ub29wIHRoZW4gbG9nIFwibm9vcCB3cml0ZSAje29wdGlvbnMuanNQYXRofVwiXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB3cml0ZUpzIHQuc291cmNlLCB0Lm91dHB1dCwgb3B0aW9ucy5qc1BhdGgsIHQuc291cmNlTWFwXG4gICAgY2F0Y2ggZXJyXG4gICAgICAgIFxuICAgICAgICBLb2ZmZWUuZW1pdCAnZmFpbHVyZScsIGVyciwgdGFza1xuICAgICAgICByZXR1cm4gaWYgS29mZmVlLmxpc3RlbmVycygnZmFpbHVyZScpLmxlbmd0aFxuXG4gICAgICAgIG1lc3NhZ2UgPSBlcnIubWVzc2FnZVxuICAgICAgICBcbiAgICAgICAgaWYgZXJyIGluc3RhbmNlb2YgU3ludGF4RXJyb3JcbiAgICAgICAgICAgIHByaW50TGluZSBtZXNzYWdlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHByaW50TGluZSBlcnIuc3RhY2tcbiAgICAgICAgXG4gICAgICAgIGlmIG8ud2F0Y2ggb3Igby5ldmFsXG4gICAgICAgICAgICBwcmludCAnXFx4MDcnICMgYmVsbFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQgMVxuXG5jb21waWxlT3B0aW9ucyA9IChzb3VyY2UpIC0+ICMgVGhlIGNvbXBpbGUtdGltZSBvcHRpb25zIHRvIHBhc3MgdG8gdGhlIGNvbXBpbGVyLlxuICAgIFxuICAgIGNvcHRzID0gICAgICAgICBcbiAgICAgICAgc291cmNlOiAgICBzb3VyY2VcbiAgICAgICAgc291cmNlTWFwOiBvcHRzLm1hcFxuICAgICAgICBpbmxpbmVNYXA6IG9wdHNbJ2lubGluZS1tYXAnXVxuICAgICAgICBmZWF0dXJlOiAgIG9wdHMuZmVhdHVyZVxuICAgICAgICBiYXJlOiAgICAgIG9wdHMuYmFyZVxuICAgICAgICB0ZXN0OiAgICAgIG9wdHMudGVzdFxuICAgICAgICBkb2M6ICAgICAgIG9wdHMuZG9jXG4gICAgICAgIERlYnVnOiAgICAgb3B0cy5EZWJ1Z1xuICAgICAgICBtZXRhbG9nOiAgIG9wdHMubWV0YWxvZ1xuXG4gICAgaWYgc291cmNlXG4gICAgICAgIFxuICAgICAgICBjd2QgPSBwcm9jZXNzLmN3ZCgpXG4gICAgICAgIGpzUGF0aCA9IG91dHB1dFBhdGggc291cmNlLCAnLmpzJ1xuICAgICAgICBqc0RpciA9IHBhdGguZGlybmFtZSBqc1BhdGhcbiAgICAgICAgY29wdHMgPSBtZXJnZSBjb3B0cywge1xuICAgICAgICAgICAganNQYXRoXG4gICAgICAgICAgICBzb3VyY2VSb290OiBwYXRoLnJlbGF0aXZlIGpzRGlyLCBjd2RcbiAgICAgICAgICAgIHNvdXJjZUZpbGVzOiBbcGF0aC5yZWxhdGl2ZSBjd2QsIHNvdXJjZV1cbiAgICAgICAgICAgIGdlbmVyYXRlZEZpbGU6IGJhc2VGaWxlTmFtZShqc1BhdGgsIG5vLCB1c2VXaW5QYXRoU2VwKVxuICAgICAgICB9XG4gICAgY29wdHNcbiAgICAgICAgICAgIFxuIyBBdHRhY2ggdGhlIGFwcHJvcHJpYXRlIGxpc3RlbmVycyB0byBjb21waWxlIHNjcmlwdHMgaW5jb21pbmcgb3ZlciAqKnN0ZGluKiosIGFuZCB3cml0ZSB0aGVtIGJhY2sgdG8gKipzdGRvdXQqKi5cblxuY29tcGlsZVN0ZGlvID0gLT5cbiAgICBcbiAgICBidWZmZXJzID0gW11cbiAgICBzdGRpbiA9IHByb2Nlc3Mub3BlblN0ZGluKClcbiAgICBzdGRpbi5vbiAnZGF0YScsIChidWZmZXIpIC0+IGJ1ZmZlcnMucHVzaCBidWZmZXIgaWYgYnVmZmVyXG4gICAgc3RkaW4ub24gJ2VuZCcsIC0+IGNvbXBpbGVTY3JpcHQgQnVmZmVyLmNvbmNhdChidWZmZXJzKS50b1N0cmluZygpXG5cbiMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuIyAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMDAwMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4jIDAwICAgICAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuXG53YXRjaFBhdGggPSAoc291cmNlKSAtPiAjIFdhdGNoIGEgZmlsZSBvciBkaXJlY3RvcnkuXG4gICAgXG4gICAgdHJ5XG4gICAgICAgIHN0YXRzID0gZnMuc3RhdFN5bmMgc291cmNlXG4gICAgY2F0Y2ggZXJyXG4gICAgICAgIHJldHVybiBpZiBlcnIuY29kZSBpcyAnRU5PRU5UJ1xuICAgICAgICByZXR1cm4gZXJyb3IgXCJDb21tYW5kLndhdGNoUGF0aCBjYW4ndCBzdGF0ICcje3NvdXJjZX0nXCIsIGVyclxuICAgICAgICAgICAgICAgIFxuICAgIGlmIHN0YXRzLmlzRGlyZWN0b3J5KClcbiAgICAgICAgd2F0Y2hEaXIgc291cmNlXG4gICAgZWxzZVxuICAgICAgICB3YXRjaEZpbGUgc291cmNlXG5cbiMgV2F0Y2ggYSBzaW5nbGUgZmlsZSB1c2luZyBgZnMud2F0Y2hgLCByZWNvbXBpbGluZyBpdCBldmVyeSB0aW1lIHRoZSBmaWxlIGlzIHVwZGF0ZWQuXG4jIE1heSBiZSB1c2VkIGluIGNvbWJpbmF0aW9uIHdpdGggb3RoZXIgb3B0aW9ucywgc3VjaCBhcyBgLS1wcmludGAuXG4gICAgICAgIFxud2F0Y2hGaWxlID0gKHNvdXJjZSkgLT5cbiAgICBcbiAgICByZXR1cm4gaWYgbm90IGlzQ29mZmVlIHNvdXJjZVxuICAgIFxuICAgIGxvZyAnQ29tbWFuZC53YXRjaEZpbGUnLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuICAgIFxuICAgIHdhdGNoZXIgICAgICAgID0gbnVsbFxuICAgIHByZXZTdGF0cyAgICAgID0gbnVsbFxuICAgIGNvbXBpbGVUaW1lb3V0ID0gbnVsbFxuXG4gICAgc3RhcnRXYXRjaGVyID0gLT5cbiAgICAgICAgXG4gICAgICAgIHdhdGNoZXIgPSBmcy53YXRjaCBzb3VyY2VcbiAgICAgICAgLm9uICdjaGFuZ2UnLCAoY2hhbmdlKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gaWYgY2hhbmdlICE9ICdjaGFuZ2UnXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGxvZyAnQ29tbWFuZC53YXRjaEZpbGUnLCBjaGFuZ2UsIHNvdXJjZSBpZiBvcHRzLkRlYnVnXG5cbiAgICAgICAgICAgIGNsZWFyVGltZW91dCBjb21waWxlVGltZW91dFxuICAgICAgICAgICAgY29tcGlsZVRpbWVvdXQgPSB3YWl0IDI1LCAtPlxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGZzLnN0YXQgc291cmNlLCAoZXJyLCBzdGF0cykgLT5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHdhdGNoZXIuY2xvc2UoKSBpZiBlcnI/LmNvZGUgaXMgJ0VOT0VOVCdcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVycm9yIGVyciBpZiBlcnJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlmIHByZXZTdGF0cyBhbmQgc3RhdHMubXRpbWUuZ2V0VGltZSgpIGlzIHByZXZTdGF0cy5tdGltZS5nZXRUaW1lKCkgYW5kIHN0YXRzLnNpemUgaXMgcHJldlN0YXRzLnNpemVcbiAgICAgICAgICAgICAgICAgICAgcHJldlN0YXRzID0gc3RhdHNcbiAgICAgICAgICAgICAgICAgICAgZnMucmVhZEZpbGUgc291cmNlLCAoZXJyLCBjb2RlKSAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVycm9yIGVyciBpZiBlcnJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZyAnQ29tbWFuZC53YXRjaEZpbGUgY29tcGlsZScsIHNvdXJjZSBpZiBvcHRzLkRlYnVnXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21waWxlU2NyaXB0IGNvZGUudG9TdHJpbmcoKSwgc291cmNlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgLm9uICdlcnJvcicsIChlcnIpIC0+XG4gICAgICAgICAgICB0aHJvdyBlcnIgdW5sZXNzIGVyci5jb2RlIGlzICdFUEVSTSdcblxuICAgIHRyeVxuICAgICAgICBzdGFydFdhdGNoZXIoKVxuICAgIGNhdGNoIGVyclxuICAgICAgICBlcnJvciBlcnJcblxud2F0Y2hEaXIgPSAoc291cmNlKSAtPlxuICAgIFxuICAgIGxvZyAnQ29tbWFuZC53YXRjaERpcicsIHNvdXJjZSBpZiBvcHRzLkRlYnVnXG4gICAgXG4gICAgd2F0Y2hlciA9IG51bGxcblxuICAgIHN0YXJ0V2F0Y2hlciA9IC0+XG5cbiAgICAgICAgdHJ5XG4gICAgICAgICAgICBmaWxlcyA9IGZzLnJlYWRkaXJTeW5jIHNvdXJjZVxuICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgIHJldHVybiBpZiBlcnI/LmNvZGUgaXMgJ0VOT0VOVCdcbiAgICAgICAgICAgIHRocm93IGVyclxuICAgICAgICAgICAgXG4gICAgICAgIGZvciBmaWxlIGluIGZpbGVzXG4gICAgICAgICAgICBjb250aW51ZSBpZiBmaWxlWzBdID09ICcuJ1xuICAgICAgICAgICAgY29udGludWUgaWYgZmlsZSBpbiBbJ25vZGVfbW9kdWxlcyddXG4gICAgICAgICAgICB3YXRjaFBhdGggcGF0aC5qb2luIHNvdXJjZSwgZmlsZVxuICAgICAgICBcbiAgICAgICAgd2F0Y2hlciA9IGZzLndhdGNoIHNvdXJjZVxuICAgICAgICAub24gJ2Vycm9yJywgKGVycikgLT5cbiAgICAgICAgICAgIHRocm93IGVyciB1bmxlc3MgZXJyLmNvZGUgaXMgJ0VQRVJNJ1xuICAgICAgICAgICAgd2F0Y2hlci5jbG9zZSgpXG4gICAgICAgIC5vbiAnY2hhbmdlJywgKGNoYW5nZSwgcCkgLT5cbiAgICAgICAgICAgIGlmIGNoYW5nZSA9PSAncmVuYW1lJ1xuICAgICAgICAgICAgICAgIGxvZyAnQ29tbWFuZC53YXRjaERpcicsIGNoYW5nZSwgcGF0aC5qb2luIHNvdXJjZSwgcCBpZiBvcHRzLkRlYnVnXG4gICAgICAgICAgICAgICAgd2F0Y2hQYXRoIHBhdGguam9pbiBzb3VyY2UsIHBcbiAgICAgICAgICAgIFxuICAgIHRyeVxuICAgICAgICBzdGFydFdhdGNoZXIoKVxuICAgIGNhdGNoIGVyclxuICAgICAgICByZXR1cm4gaWYgZXJyLmNvZGUgaXMgJ0VOT0VOVCdcbiAgICAgICAgdGhyb3cgZXJyXG5cbiMgR2V0IHRoZSBjb3JyZXNwb25kaW5nIG91dHB1dCBKYXZhU2NyaXB0IHBhdGggZm9yIGEgc291cmNlIGZpbGUuXG4gICAgXG5vdXRwdXRQYXRoID0gKHNvdXJjZSwgZXh0ZW5zaW9uKSAtPlxuICAgIFxuICAgIGJhc2VuYW1lID0gYmFzZUZpbGVOYW1lIHNvdXJjZSwgeWVzLCB1c2VXaW5QYXRoU2VwXG4gICAgaWYgb3B0cy5vdXRwdXRcbiAgICAgICAgZGlyID0gb3B0cy5vdXRwdXRcbiAgICBlbHNlXG4gICAgICAgIGRpciA9IHBhdGguZGlybmFtZSBzb3VyY2VcbiAgICBwYXRoLmpvaW4gZGlyLCBiYXNlbmFtZSArIGV4dGVuc2lvblxuXG4jIFJlY3Vyc2l2ZWx5IG1rZGlyLCBsaWtlIGBta2RpciAtcGAuXG5cbm1rZGlycCA9IChkaXIsIGZuKSAtPlxuICAgIG1vZGUgPSAwbzc3NyAmIH5wcm9jZXNzLnVtYXNrKClcblxuICAgIGRvIG1rZGlycyA9IChwID0gZGlyLCBmbikgLT5cbiAgICAgICAgZnMuZXhpc3RzIHAsIChleGlzdHMpIC0+XG4gICAgICAgICAgICBpZiBleGlzdHNcbiAgICAgICAgICAgICAgICBmbigpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgbWtkaXJzIHBhdGguZGlybmFtZShwKSwgLT5cbiAgICAgICAgICAgICAgICAgICAgZnMubWtkaXIgcCwgbW9kZSwgKGVycikgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmbiBlcnIgaWYgZXJyXG4gICAgICAgICAgICAgICAgICAgICAgICBmbigpXG5cbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAgMDAwICAgMDAwMDAwMCAgXG4jIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgICAgIDAwMCAgMDAwICAgICAgIFxuIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAgICAgICAwMDAgIDAwMDAwMDAgICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgXG4jIDAwICAgICAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuXG4jIFdyaXRlIG91dCBhIEphdmFTY3JpcHQgc291cmNlIGZpbGUgd2l0aCB0aGUgY29tcGlsZWQgY29kZS4gXG4jIEJ5IGRlZmF1bHQsIGZpbGVzIGFyZSB3cml0dGVuIG91dCBpbiBgY3dkYCBhcyBgLmpzYCBmaWxlcyB3aXRoIHRoZSBzYW1lIG5hbWUsIGJ1dCB0aGUgb3V0cHV0IGRpcmVjdG9yeSBjYW4gYmUgY3VzdG9taXplZCB3aXRoIGAtLW91dHB1dGAuXG4jIElmIGBnZW5lcmF0ZWRTb3VyY2VNYXBgIGlzIHByb3ZpZGVkLCB0aGlzIHdpbGwgd3JpdGUgYSBgLmpzLm1hcGAgZmlsZSBpbnRvIHRoZSBzYW1lIGRpcmVjdG9yeSBhcyB0aGUgYC5qc2AgZmlsZS5cblxud3JpdGVKcyA9IChzb3VyY2UsIGpzLCBqc1BhdGgsIGdlbmVyYXRlZFNvdXJjZU1hcCA9IG51bGwpIC0+XG4gICAgXG4gICAgc291cmNlTWFwUGF0aCA9IG91dHB1dFBhdGggc291cmNlLCAnLmpzLm1hcCdcbiAgICBqc0RpciA9IHBhdGguZGlybmFtZSBqc1BhdGhcbiAgICBjb21waWxlID0gLT5cbiAgICAgICAgaWYgb3B0cy5jb21waWxlXG4gICAgICAgICAgICBqcyA9ICcgJyBpZiBqcy5sZW5ndGggPD0gMFxuICAgICAgICAgICAgaWYgZ2VuZXJhdGVkU291cmNlTWFwIHRoZW4ganMgPSBcIiN7anN9XFxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9I3tiYXNlRmlsZU5hbWUgc291cmNlTWFwUGF0aCwgbm8sIHVzZVdpblBhdGhTZXB9XFxuXCJcbiAgICAgICAgICAgIGZzLndyaXRlRmlsZSBqc1BhdGgsIGpzLCAoZXJyKSAtPlxuICAgICAgICAgICAgICAgIGlmIGVyclxuICAgICAgICAgICAgICAgICAgICBwcmludExpbmUgZXJyLm1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0IDFcbiAgICAgICAgICAgICAgICBlbHNlIGlmIG9wdHMuY29tcGlsZSBhbmQgb3B0cy53YXRjaFxuICAgICAgICAgICAgICAgICAgICB0aW1lTG9nIFwiY29tcGlsZWQgI3tzb3VyY2V9XCJcbiAgICAgICAgaWYgZ2VuZXJhdGVkU291cmNlTWFwXG4gICAgICAgICAgICBmcy53cml0ZUZpbGUgc291cmNlTWFwUGF0aCwgZ2VuZXJhdGVkU291cmNlTWFwLCAoZXJyKSAtPlxuICAgICAgICAgICAgICAgIGlmIGVyclxuICAgICAgICAgICAgICAgICAgICBwcmludExpbmUgXCJDb3VsZCBub3Qgd3JpdGUgc291cmNlIG1hcDogI3tlcnIubWVzc2FnZX1cIlxuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQgMVxuICAgIGZzLmV4aXN0cyBqc0RpciwgKGl0RXhpc3RzKSAtPlxuICAgICAgICBpZiBpdEV4aXN0cyB0aGVuIGNvbXBpbGUoKSBlbHNlIG1rZGlycCBqc0RpciwgY29tcGlsZVxuXG53YWl0ID0gKG1pbGxpc2Vjb25kcywgZnVuYykgLT4gc2V0VGltZW91dCBmdW5jLCBtaWxsaXNlY29uZHMgIyBDb252ZW5pZW5jZSBmb3IgY2xlYW5lciBzZXRUaW1lb3V0cy5cblxudGltZUxvZyA9IChtZXNzYWdlKSAtPiBsb2cgXCIjeyhuZXcgRGF0ZSkudG9Mb2NhbGVUaW1lU3RyaW5nKCl9IC0gI3ttZXNzYWdlfVwiXG5cbiMgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMDAwMDAgICBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgICAwMDAgIFxuIyAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG5cbnByaW50VG9rZW5zID0gKHRva2VucykgLT5cblxuICAgIGZvciBpbmRleCBpbiBbMC4uLnRva2Vucy5sZW5ndGhdXG4gICAgICAgIHRva2VuICA9IHRva2Vuc1tpbmRleF1cbiAgICAgICAgdGFnICAgID0gdG9rZW5bMF1cbiAgICAgICAgdmFsdWUgID0gdG9rZW5bMV0udG9TdHJpbmcoKS5yZXBsYWNlKC9cXG4vLCAnXFxcXG4nKVxuICAgICAgICBjdGFnICAgPSBncmF5IHRhZ1xuICAgICAgICBjdmFsdWUgPSBib2xkIHllbGxvdyB2YWx1ZVxuICAgICAgICBpbmRleCAgPSBncmF5IGRpbSBpbmRleFxuICAgICAgICBpZiB0YWcgPT0gJ1RFUk1JTkFUT1InXG4gICAgICAgICAgICBwcmludCAnXFxuXFxuJ1xuICAgICAgICBlbHNlIGlmIHRhZyA9PSAnSU5ERU5UJ1xuICAgICAgICAgICAgcHJpbnQgZ3JheSBkaW0gJ0lORCAnXG4gICAgICAgIGVsc2UgaWYgdGFnID09ICdPVVRERU5UJ1xuICAgICAgICAgICAgcHJpbnQgZ3JheSBkaW0gJ09VVCAnXG4gICAgICAgIGVsc2UgaWYgdGFnIGluIFsnQ0xBU1MnICdQQVJBTV9TVEFSVCcgJ1BBUkFNX0VORCcgJ05VTEwnXVxuICAgICAgICAgICAgcHJpbnQgXCIje2luZGV4fSN7Y3RhZ30gXCJcbiAgICAgICAgZWxzZSBpZiB0YWcgaXMgdmFsdWVcbiAgICAgICAgICAgIHByaW50IFwiI3tpbmRleH0je2N2YWx1ZX0gXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcHJpbnQgXCIje2luZGV4fSN7Y3RhZ309I3tjdmFsdWV9IFwiXG4gICAgICAgIFxucHJpbnRSZXdyaXRlciA9ICh0b2tlbnMpIC0+XG5cbiAgICBpbmRlbnQgPSAwXG4gICAgZm9yIGluZGV4IGluIFswLi4udG9rZW5zLmxlbmd0aF1cbiAgICAgICAgdG9rZW4gPSB0b2tlbnNbaW5kZXhdXG4gICAgICAgIHRhZyAgID0gdG9rZW5bMF1cbiAgICAgICAgdmFsdWUgPSB0b2tlblsxXVxuICAgICAgICBcbiAgICAgICAgZ3JheURpbSA9IChzKSAtPiBkaW0gZ3JheSBzXG4gICAgICAgIGJsdWVEaW0gPSAocykgLT4gZGltIGJsdWUgc1xuICAgICAgICB5ZWxsb3dEaW0gPSAocykgLT4gZGltIHllbGxvdyBzXG4gICAgICAgIHNwYWNlZCA9IChjb2xvciwgdiktPlxuICAgICAgICAgICAgcHJpbnQgY29sb3IgXCIje3YgPyB2YWx1ZX1cIlxuICAgICAgICAgICAgcHJpbnQgJyAnIGlmIHRva2VuLnNwYWNlZCBhbmQgdG9rZW5zW2luZGV4KzFdWzBdIG5vdCBpbiBbJ0NBTExfU1RBUlQnXVxuXG4gICAgICAgICMgbG9nIHRva2VuXG4gICAgICAgIHN3aXRjaCB0YWcgXG4gICAgICAgICAgICB3aGVuICdURVJNSU5BVE9SJyAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcHJpbnQgXCJcXG4je3BhZCAnJywgaW5kZW50fVwiXG4gICAgICAgICAgICB3aGVuICdJTkRFTlQnICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gaW5kZW50ICs9IDQ7IHByaW50IFwiXFxuI3twYWQgJycsIGluZGVudH1cIlxuICAgICAgICAgICAgd2hlbiAnT1VUREVOVCcgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIGluZGVudCAtPSA0OyBwcmludCBcIlxcbiN7cGFkICcnLCBpbmRlbnR9XCJcbiAgICAgICAgICAgIHdoZW4gJ0hFUkVDT01NRU5UJyAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgZ3JheURpbVxuICAgICAgICAgICAgd2hlbiAnQ0FMTF9TVEFSVCcgJ0NBTExfRU5EJyAgICAgICAgICAgICB0aGVuIHNwYWNlZCBncmF5RGltXG4gICAgICAgICAgICB3aGVuICdVTkFSWScgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGJsdWVCcmlnaHQsICdub3QnXG4gICAgICAgICAgICB3aGVuICcmJicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGJsdWVCcmlnaHQsICdhbmQnXG4gICAgICAgICAgICB3aGVuICd8fCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGJsdWVCcmlnaHQsICdvcidcbiAgICAgICAgICAgIHdoZW4gJ1NUUklORycgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgZ3JlZW5cbiAgICAgICAgICAgIHdoZW4gJ1NUUklOR19TVEFSVCcgJ1NUUklOR19FTkQnICAgICAgICAgdGhlbiBzcGFjZWQgcmVkQnJpZ2h0XG4gICAgICAgICAgICB3aGVuICdQUk9QRVJUWScgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIHllbGxvd1xuICAgICAgICAgICAgd2hlbiAnOicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCB5ZWxsb3dEaW1cbiAgICAgICAgICAgIHdoZW4gJ0AnIFxuICAgICAgICAgICAgICAgIGlmIHRva2Vuc1tpbmRleCsxXVswXSBub3QgaW4gWydNRVRBX0lGJyAnTUVUQV9FTFNFJyAnUE9TVF9NRVRBX0lGJ10gdGhlbiBzcGFjZWQoeWVsbG93RGltKSBlbHNlIHNwYWNlZCBibHVlRGltXG4gICAgICAgICAgICB3aGVuICdNRVRBX0lGJyAnTUVUQV9FTFNFJyAnUE9TVF9NRVRBX0lGJyB0aGVuIHNwYWNlZCBibHVlLCAn4pa4Jyt2YWx1ZVxuICAgICAgICAgICAgd2hlbiAnTlVNQkVSJyAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCBibHVlXG4gICAgICAgICAgICB3aGVuICd7Jyd9JyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gaWYgbm90IHRva2VuLmdlbmVyYXRlZCB0aGVuIHNwYWNlZCBncmF5XG4gICAgICAgICAgICB3aGVuICc9JyAnKycgJy0nICcrKycgJy0tJyAnLi4uJyAnOjonIFxcXG4gICAgICAgICAgICAgICAgICdbJyAnXScgJ3snICd9JyAnLicgJ01BVEgnICdVTkFSWV9NQVRIJyBcXFxuICAgICAgICAgICAgICAgICAnSU5ERVhfU1RBUlQnICdJTkRFWF9FTkQnIFxcXG4gICAgICAgICAgICAgICAgICdDT01QQVJFJyAnQ09NUE9VTkRfQVNTSUdOJyAgICAgICAgIHRoZW4gc3BhY2VkIGdyYXlcbiAgICAgICAgICAgIHdoZW4gJywnICcoJyAnKScgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgZ3JheURpbVxuICAgICAgICAgICAgd2hlbiAnUEFSQU1fU1RBUlQnICdQQVJBTV9FTkQnICctPicgJz0+JyB0aGVuIHNwYWNlZCAocykgLT4gYm9sZCBibHVlIHNcbiAgICAgICAgICAgIHdoZW4gJ05VTEwnICdVTkRFRklORUQnICdGVU5DX0VYSVNUJyAnPycgJz8uJyAnQklOPycgdGhlbiBzcGFjZWQgcmVkXG4gICAgICAgICAgICB3aGVuICdSRUdFWCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIG1hZ2VudGFcbiAgICAgICAgICAgIHdoZW4gJ0ZPUicgJ0ZPUklOJyAnVFJZJyAnQ0FUQ0gnICdUSFJPVycgJ1JFTEFUSU9OJyAnRVhURU5EUycgJ1NUQVRFTUVOVCcgJ09XTicgJ0ZPUk9GJyAnTE9PUCcgXFxcbiAgICAgICAgICAgICAgICAgJ0lGJyAnUE9TVF9JRicgJ1dIRU4nICdUSEVOJyAnRUxTRScgJ1RISVMnICdTVVBFUicgJ1NXSVRDSCcgJ0xFQURJTkdfV0hFTicgJ1dISUxFJyBcXFxuICAgICAgICAgICAgICAgICAnQk9PTCcgJ0NMQVNTJyAnUkVUVVJOJyAgICAgICAgICAgICB0aGVuIHNwYWNlZCBibHVlQnJpZ2h0XG4gICAgICAgICAgICB3aGVuICdJREVOVElGSUVSJyBcbiAgICAgICAgICAgICAgICBzd2l0Y2ggdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAncmVxdWlyZScgdGhlbiBzcGFjZWQgZ3JheVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHNwYWNlZCB3aGl0ZUJyaWdodFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHByaW50IFwiPiN7dGFnfTxcIlxuICAgICAgICAgICAgICAgICMgc3BhY2VkIChzKSAtPiBib2xkIGJsdWVCcmlnaHQgc1xuICAgICAgICAgICAgICAgIHNwYWNlZCBjeWFuXG4gICAgICAgICAgICBcbnZlcnNpb24gPSAtPiBwcmludExpbmUgXCIje0tvZmZlZS5WRVJTSU9OfVwiXG51c2FnZSAgID0gLT4gXG5cbiAgICBsaW5lcyA9IFtcIiN7Z3JheSAnVXNhZ2U6J30gI3t5ZWxsb3cgJ2tvZmZlZSd9ICN7Z3JheSAnW29wdGlvbnNdJ30gcGF0aC90by9zY3JpcHQgI3tncmF5ICdbb3B0aW9uc10nfVxcblwiXVxuICAgIFxuICAgIHJ1bGVzID0gU1dJVENIRVMubWFwIChydWxlKSAtPlxuICAgICAgICBbc2hvcnQsIGxvbmcsIGRlc2NyaXB0aW9uXSA9IHJ1bGVcbiAgICAgICAgbG9uZ0ZsYWcgPSBsb25nLm1hdGNoKC9eKC0tXFx3W1xcd1xcLV0qKS8pWzFdXG4gICAgICAgIGNzaG9ydCAgID0gaWYgc2hvcnQgdGhlbiBncmF5KHNob3J0WzBdKSArIGJvbGQoZ3JheShzaG9ydFsxLi5dKSkgKyAnICAnIGVsc2UgJyAgICAnXG4gICAgICAgIGNsb25nICAgID0gcGFkIGxvbmcsIDIwXG4gICAgICAgIGNsb25nICAgID0gZ3JheShjbG9uZ1swLi4xXSkgKyBib2xkKHdoaXRlKGNsb25nWzIuLl0uc3BsaXQoJyAnKVswXSkpICsgJyAnICsgYm9sZChibHVlQnJpZ2h0KGNsb25nWzIuLl0uc3BsaXQoJyAnKVsxLi5dLmpvaW4oJyAnKSkpXG4gICAgICAgIGxpbmVzLnB1c2ggJyAgICAnICsgY3Nob3J0ICsgY2xvbmcgKyBncmF5IGRlc2NyaXB0aW9uXG4gICAgICAgIFxuICAgIGxpbmVzLnB1c2ggZ3JheSAnXFxuSWYgY2FsbGVkIHdpdGhvdXQgYSBzY3JpcHQsIHRoZSBpbnRlcmFjdGl2ZSBSRVBMIHdpbGwgYmUgc3RhcnRlZCdcbiAgICAgICAgXG4gICAgbG9nIFwiXFxuI3sgbGluZXMuam9pbignXFxuJykgfVxcblwiXG4gICAgICAgICJdfQ==
//# sourceURL=../coffee/command.coffee