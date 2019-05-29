// koffee 0.52.0

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
    copts = Object.assign({}, opts);
    copts.sourceMap = opts.map;
    copts.inlineMap = opts['inline-map'];
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBaUJBLEVBQUEsR0FBbUIsT0FBQSxDQUFRLElBQVI7O0FBQ25CLElBQUEsR0FBbUIsT0FBQSxDQUFRLE1BQVI7O0FBQ25CLElBQUEsR0FBbUIsT0FBQSxDQUFRLE1BQVI7O0FBQ25CLE9BQUEsR0FBbUIsT0FBQSxDQUFRLFdBQVI7O0FBQ25CLE1BQUEsR0FBbUIsT0FBQSxDQUFRLFVBQVI7O0FBQ25CLE1BQW1CLE9BQUEsQ0FBUSxlQUFSLENBQW5CLEVBQUUsaUJBQUYsRUFBUzs7QUFDUCxlQUFpQixPQUFBLENBQVEsUUFBUjs7QUFFbkIsYUFBQSxHQUFtQixJQUFJLENBQUMsR0FBTCxLQUFZOztBQUUvQixPQUFPLENBQUMsTUFBUixDQUFlLE1BQWYsRUFBdUIsSUFBSSxZQUEzQjs7QUFDQSxPQUFPLENBQUMsTUFBUixDQUFBOztBQUVBLE9BQTRCLE9BQUEsQ0FBUSxZQUFSLENBQTVCLEVBQUUsd0JBQUYsRUFBWTs7QUFFVixtQ0FBRixFQUFnQiwyQkFBaEIsRUFBMEIsNkJBQTFCLEVBQXFDLHFCQUFyQyxFQUE0Qzs7QUFFNUMsS0FBQSxHQUFZLE9BQU8sQ0FBQzs7QUFDcEIsS0FBQSxHQUFZLFNBQUMsSUFBRDtXQUFVLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBZixDQUFxQixJQUFyQjtBQUFWOztBQUNaLFNBQUEsR0FBWSxTQUFDLElBQUQ7V0FBVSxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQWYsQ0FBcUIsSUFBQSxHQUFPLElBQTVCO0FBQVY7O0FBQ1osU0FBQSxHQUFZLFNBQUMsSUFBRDtXQUFVLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBZixDQUFxQixJQUFBLEdBQU8sSUFBNUI7QUFBVjs7QUFDWixNQUFBLEdBQVksU0FBQyxJQUFEO1dBQVUsUUFBUSxDQUFDLElBQVQsQ0FBYyxJQUFkO0FBQVY7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QWMsSUFBQSxDQUFLLEtBQU0sQ0FBQSxDQUFBLENBQVgsQ0FBQSxHQUFpQixJQUFBLENBQUssSUFBQSxDQUFLLEtBQU0sU0FBWCxDQUFMLENBQWpCLEdBQTBDLElBQXhELEdBQWtFO1FBQzdFLEtBQUEsR0FBVyxHQUFBLENBQUksSUFBSixFQUFVLEVBQVY7UUFDWCxLQUFBLEdBQVcsSUFBQSxDQUFLLEtBQU0sWUFBWCxDQUFBLEdBQW9CLElBQUEsQ0FBSyxLQUFBLENBQU0sS0FBTSxTQUFJLENBQUMsS0FBWCxDQUFpQixHQUFqQixDQUFzQixDQUFBLENBQUEsQ0FBNUIsQ0FBTCxDQUFwQixHQUE0RCxHQUE1RCxHQUFrRSxJQUFBLENBQUssVUFBQSxDQUFXLEtBQU0sU0FBSSxDQUFDLEtBQVgsQ0FBaUIsR0FBakIsQ0FBc0IsU0FBSSxDQUFDLElBQTNCLENBQWdDLEdBQWhDLENBQVgsQ0FBTDtlQUM3RSxLQUFLLENBQUMsSUFBTixDQUFXLE1BQUEsR0FBUyxNQUFULEdBQWtCLEtBQWxCLEdBQTBCLElBQUEsQ0FBSyxXQUFMLENBQXJDO0lBTmlCLENBQWI7SUFRUixLQUFLLENBQUMsSUFBTixDQUFXLElBQUEsQ0FBSyxvRUFBTCxDQUFYO1dBQW9GLE9BQUEsQ0FFcEYsR0FGb0YsQ0FFaEYsSUFBQSxHQUFJLENBQUUsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFYLENBQUYsQ0FBSixHQUF3QixJQUZ3RDtBQVo5RSIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIFxuIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuIyMjXG5cbiMgaGFuZGxlIHZhcmlvdXMgdGFza3M6IFxuI1xuIyAgIC0gY29tcGlsZSBhbmQgc2F2ZSBpbnRvIGAuanNgIGZpbGVzIFxuIyAgIC0gY29tcGlsZSBhbmQgcHJpbnQgdG8gc3Rkb3V0IFxuIyAgIC0gcmVjb21waWxlIGlmIHRoZSBzb3VyY2UgY2hhbmdlc1xuIyAgIC0gcHJpbnQgbGV4ZXIgdG9rZW5zXG4jICAgLSBwcmludCBhIHN5bnRheCB0cmVlXG4jICAgLSBsYXVuY2ggYSBSRVBMXG5cbmZzICAgICAgICAgICAgICAgPSByZXF1aXJlICdmcydcbnBhdGggICAgICAgICAgICAgPSByZXF1aXJlICdwYXRoJ1xubm9wdCAgICAgICAgICAgICA9IHJlcXVpcmUgJ25vcHQnXG5oZWxwZXJzICAgICAgICAgID0gcmVxdWlyZSAnLi9oZWxwZXJzJ1xuS29mZmVlICAgICAgICAgICA9IHJlcXVpcmUgJy4va29mZmVlJ1xueyBzcGF3biwgZXhlYyB9ICA9IHJlcXVpcmUgJ2NoaWxkX3Byb2Nlc3MnXG57IEV2ZW50RW1pdHRlciB9ID0gcmVxdWlyZSAnZXZlbnRzJ1xuXG51c2VXaW5QYXRoU2VwICAgID0gcGF0aC5zZXAgaXMgJ1xcXFwnXG5cbmhlbHBlcnMuZXh0ZW5kIEtvZmZlZSwgbmV3IEV2ZW50RW1pdHRlciAjIEFsbG93IGVtaXR0aW5nIE5vZGUgZXZlbnRzXG5oZWxwZXJzLmNvbG9ycygpXG5cbnsgRkVBVFVSRVMsIGxvZ0ZlYXR1cmVzIH0gPSByZXF1aXJlICcuL2ZlYXR1cmVzJ1xuXG57IGJhc2VGaWxlTmFtZSwgaXNDb2ZmZWUsIHN0cmluZ2lmeSwgbWVyZ2UsIHBhZCB9ID0gaGVscGVyc1xuXG5lcnJvciAgICAgPSBjb25zb2xlLmVycm9yXG5wcmludCAgICAgPSAobGluZSkgLT4gcHJvY2Vzcy5zdGRvdXQud3JpdGUgbGluZVxucHJpbnRMaW5lID0gKGxpbmUpIC0+IHByb2Nlc3Muc3Rkb3V0LndyaXRlIGxpbmUgKyAnXFxuJyAjID8/P1xucHJpbnRXYXJuID0gKGxpbmUpIC0+IHByb2Nlc3Muc3RkZXJyLndyaXRlIGxpbmUgKyAnXFxuJyAjID8/P1xuaGlkZGVuICAgID0gKGZpbGUpIC0+IC9eXFwufH4kLy50ZXN0IGZpbGVcblxuU1dJVENIRVMgPSBbXG4gICAgWyctYicgJy0tYmFyZScgICAgICAgICAgICAgICdjb21waWxlIHdpdGhvdXQgYSB0b3AtbGV2ZWwgZnVuY3Rpb24gd3JhcHBlcicgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLWMnICctLWNvbXBpbGUnICAgICAgICAgICAnY29tcGlsZSB0byBKYXZhU2NyaXB0IGFuZCBzYXZlIGFzIC5qcyBmaWxlcycgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1kJyAnLS1kb2MnICAgICAgICAgICAgICAgJ2xvZyB0aGUg4pa4ZG9jIHNlY3Rpb25zJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1lJyAnLS1ldmFsIFNUUklORycgICAgICAgJ2V2YWx1YXRlIGEgc3RyaW5nIGFuZCBwcmludCB0aGUgcmVzdWx0JyAgICAgICAgICAgICAgIFtTdHJpbmcsIEFycmF5XSBdXG4gICAgWyctZicgJy0tZmVhdHVyZXMnICAgICAgICAgICdsaXN0IGF2YWlsYWJsZSBmZWF0dXJlcycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnJyAgICctLW5vLWBmZWF0dXJlJyAgICAgICAnZGlzYWJsZSBhIGZlYXR1cmUsIGUuZy4gLS1uby1uZWdhdGl2ZS1pbmRleCcgICAgICAgICAgIG51bGwgICAgICAgICAgIF1cbiAgICBbJy1oJyAnLS1oZWxwJyAgICAgICAgICAgICAgJ2Rpc3BsYXkgdGhpcyBoZWxwIG1lc3NhZ2UnICAgICAgICAgICAgICAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctaicgJy0tanMnICAgICAgICAgICAgICAgICdwcmludCBvdXQgdGhlIGNvbXBpbGVkIEphdmFTY3JpcHQnICAgICAgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLW0nICctLW1hcCcgICAgICAgICAgICAgICAnZ2VuZXJhdGUgc291cmNlIG1hcCBhbmQgc2F2ZSBhcyAuanMubWFwIGZpbGVzJyAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1NJyAnLS1pbmxpbmUtbWFwJyAgICAgICAgJ2dlbmVyYXRlIHNvdXJjZSBtYXAgYW5kIGluY2x1ZGUgaXQgZGlyZWN0bHkgaW4gb3V0cHV0JyBCb29sZWFuICAgICAgICBdXG4gICAgWycnICAgJy0tbWV0YWxvZycgICAgICAgICAgICdtZXRhIGxvZyAoZGVmYXVsdDogY29uc29sZS5sb2cpJyAgICAgICAgICAgICAgICAgICAgICAgU3RyaW5nICAgICAgICAgXVxuICAgIFsnLW4nICctLW5vb3AnICAgICAgICAgICAgICAnZG9lcyBub3RoaW5nLCBmb3IgZGVidWdnaW5nIHB1cnBvc2VzJyAgICAgICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1vJyAnLS1vdXRwdXQgRElSJyAgICAgICAgJ3NldCB0aGUgb3V0cHV0IGRpcmVjdG9yeSBmb3IgY29tcGlsZWQgSmF2YVNjcmlwdCcgICAgICBTdHJpbmcgICAgICAgICBdXG4gICAgWyctUCcgJy0tcGFyc2UnICAgICAgICAgICAgICdwcmludCBvdXQgdGhlIHBhcnNlIHRyZWUgdGhhdCB0aGUgcGFyc2VyIHByb2R1Y2VzJyAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLXInICctLXJlcXVpcmUgTU9EVUxFJyAgICAncmVxdWlyZSB0aGUgZ2l2ZW4gbW9kdWxlIGJlZm9yZSBldmFsIG9yIFJFUEwnICAgICAgICAgW1N0cmluZywgQXJyYXldIF1cbiAgICBbJy1DJyAnLS1jb2ZmZWUnICAgICAgICAgICAgJ3ByaW50IHRoZSB0b2tlbiBzdHJlYW0gYXMgQ29mZmVlU2NyaXB0JyAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctcycgJy0tc3RkaW8nICAgICAgICAgICAgICdsaXN0ZW4gZm9yIGFuZCBjb21waWxlIHNjcmlwdHMgb3ZlciBzdGRpbycgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLXQnICctLXRlc3QnICAgICAgICAgICAgICAnY29tcGlsZSBhbmQgcnVuIHRoZSBAdGVzdCBjb2RlJyAgICAgICAgICAgICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1UJyAnLS10b2tlbnMnICAgICAgICAgICAgJ3ByaW50IG91dCB0aGUgdG9rZW5zIHRoYXQgdGhlIGxleGVyL3Jld3JpdGVyIHByb2R1Y2UnICBCb29sZWFuICAgICAgICBdXG4gICAgWyctdicgJy0tdmVyc2lvbicgICAgICAgICAgICdkaXNwbGF5IHRoZSB2ZXJzaW9uIG51bWJlcicgICAgICAgICAgICAgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLXcnICctLXdhdGNoJyAgICAgICAgICAgICAnd2F0Y2ggc2NyaXB0cyBmb3IgY2hhbmdlcyBhbmQgcmVydW4gY29tbWFuZHMnICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbl1cblxub3B0cyA9IHt9XG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgIFxuIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgXG5cbnBhcnNlT3B0aW9ucyA9IC0+XG5cbiAgICBrbm93biA9IERlYnVnOkJvb2xlYW5cbiAgICBzaG9ydCA9IEQ6Jy0tRGVidWcnIHA6Jy0tanMnXG4gICAgU1dJVENIRVMubWFwIChzKSAtPiBsID0gc1sxXS5zcGxpdCgnICcpWzBdWzIuLl07IGtub3duW2xdID0gc1szXSBpZiBzWzNdOyBzaG9ydFtzWzBdWzFdXSA9IFwiLS0je2x9XCIgaWYgc1swXSE9JydcbiAgICBGRUFUVVJFUy5tYXAgKGYpIC0+IGtub3duW2YubGFnXSA9IEJvb2xlYW5cbiAgICBcbiAgICBvID0gb3B0cyA9IG5vcHQga25vd24sIHNob3J0XG4gICAgICAgIFxuICAgIG8uY29tcGlsZSAgb3I9ICEhby5vdXRwdXRcbiAgICBvLmFyZ3VtZW50cyAgPSBvLmFyZ3YucmVtYWluXG4gICAgby5wcmVsdWRlICAgID0gbWFrZVByZWx1ZGUgby5yZXF1aXJlIGlmIG8ucmVxdWlyZVxuICAgIG8ucnVuICAgICAgICA9IG5vdCAoby5jb21waWxlIG9yIG8uanMgb3Igby5tYXAgb3Igby50b2tlbnMgb3Igby5wYXJzZSlcbiAgICBvLmpzICAgICAgICAgPSAhIShvLmpzIG9yIG8uZXZhbCBvciBvLnN0ZGlvIGFuZCBvLmNvbXBpbGUpICMganMgb3V0cHV0IGlzIHBhc3NlZCB0byBldmFsIGFuZCBzdGRpbyBjb21waWxlXG4gICAgXG4gICAgby5mZWF0dXJlID0ge31cbiAgICBGRUFUVVJFUy5tYXAgKGYpIC0+IG8uZmVhdHVyZVtmLmtleV0gPSBvW2YuZmxhZ10gPyB0cnVlOyBkZWxldGUgb1tmLmZsYWddXG4gICAgXG4gICAgaWYgby5EZWJ1Z1xuICAgICAgICBkZWxldGUgby5hcmd2XG4gICAgICAgIGxvZyBzdHJpbmdpZnkgb1xuXG4jIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiMgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcblxucnVuID0gLT5cbiAgICBcbiAgICBwYXJzZU9wdGlvbnMoKVxuICAgIFxuICAgIGlmIG9wdHMuZmVhdHVyZS5jb2xvciA9PSBmYWxzZVxuICAgICAgICBjb2xvcmV0dGUub3B0aW9ucy5lbmFibGVkID0gZmFsc2VcbiAgICAgICAgXG4gICAgcmV0dXJuIGxvZ0ZlYXR1cmVzKCkgIGlmIG9wdHMuZmVhdHVyZXNcbiAgICByZXR1cm4gdXNhZ2UoKSAgICAgICAgaWYgb3B0cy5oZWxwXG4gICAgcmV0dXJuIHZlcnNpb24oKSAgICAgIGlmIG9wdHMudmVyc2lvblxuICAgIHJldHVybiBzdGFydFJlcGwoKSAgICBpZiBvcHRzLmludGVyYWN0aXZlXG4gICAgcmV0dXJuIGNvbXBpbGVTdGRpbygpIGlmIG9wdHMuc3RkaW9cbiAgICBpZiBvcHRzLmV2YWxcbiAgICAgICAgZm9yIGV2YWwgaW4gb3B0cy5ldmFsXG4gICAgICAgICAgICBjb21waWxlU2NyaXB0IGV2YWxcbiAgICAgICAgcmV0dXJuXG4gICAgcmV0dXJuIHN0YXJ0UmVwbCgpICAgIGlmIG5vdCBvcHRzLmFyZ3VtZW50cy5sZW5ndGhcbiAgICBcbiAgICBsaXRlcmFscyA9IGlmIG5vdCBvcHRzLndhdGNoIGFuZCBub3Qgb3B0cy5jb21waWxlIHRoZW4gb3B0cy5hcmd1bWVudHMuc3BsaWNlIDEgZWxzZSBbXVxuICAgIFxuICAgIHByb2Nlc3MuYXJndiA9IHByb2Nlc3MuYXJndlswLi4xXS5jb25jYXQgbGl0ZXJhbHNcbiAgICBwcm9jZXNzLmFyZ3ZbMF0gPSAna29mZmVlJ1xuXG4gICAgb3B0cy5vdXRwdXQgPSBwYXRoLnJlc29sdmUgb3B0cy5vdXRwdXQgaWYgb3B0cy5vdXRwdXRcbiAgICBmb3Igc291cmNlIGluIG9wdHMuYXJndW1lbnRzXG4gICAgICAgIHNvdXJjZSA9IHBhdGgucmVzb2x2ZSBzb3VyY2VcbiAgICAgICAgXG4gICAgICAgIGlmIG9wdHMud2F0Y2hcbiAgICAgICAgICAgIHdhdGNoUGF0aCBzb3VyY2VcbiAgICAgICAgZWxzZSAgICAgXG4gICAgICAgICAgICBjb21waWxlUGF0aCBzb3VyY2UsIHRvcExldmVsOnllc1xuXG5leHBvcnRzLnJ1biA9IHJ1blxuICAgICAgICBcbnN0YXJ0UmVwbCA9IC0+XG4gICAgXG4gICAgIyBNYWtlIHRoZSBSRVBMIHVzZSB0aGUgZ2xvYmFsIGNvbnRleHQgc28gYXMgdG8gXG4gICAgIyAgIChhKSBiZSBjb25zaXN0ZW50IHdpdGggdGhlIGBub2RlYCBSRVBMIGFuZCwgdGhlcmVmb3JlLCBcbiAgICAjICAgKGIpIG1ha2UgcGFja2FnZXMgdGhhdCBtb2RpZnkgbmF0aXZlIHByb3RvdHlwZXMgKHN1Y2ggYXMgJ2NvbG9ycycgYW5kICdzdWdhcicpIHdvcmsgYXMgZXhwZWN0ZWQuXG4gICAgXG4gICAgcmVwbENsaU9wdHMgPSB1c2VHbG9iYWw6IHllc1xuICAgIHJlcGxDbGlPcHRzLnByZWx1ZGUgPSBvcHRzLnByZWx1ZGVcbiAgICByZXF1aXJlKCcuL3JlcGwnKS5zdGFydCByZXBsQ2xpT3B0c1xuXG5tYWtlUHJlbHVkZSA9IChyZXF1aXJlcykgLT5cbiAgICBcbiAgICByZXF1aXJlcy5tYXAgKG1vZHVsZSkgLT5cbiAgICAgICAgW18sIG5hbWUsIG1vZHVsZV0gPSBtYXRjaCBpZiBtYXRjaCA9IG1vZHVsZS5tYXRjaCgvXiguKik9KC4qKSQvKVxuICAgICAgICBuYW1lIHx8PSBiYXNlRmlsZU5hbWUgbW9kdWxlLCB5ZXMsIHVzZVdpblBhdGhTZXBcbiAgICAgICAgXCIje25hbWV9ID0gcmVxdWlyZSgnI3ttb2R1bGV9JylcIlxuICAgIC5qb2luICc7J1xuXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuXG4jIENvbXBpbGUgYSBzY3JpcHQgb3IgYSBkaXJlY3RvcnkuIElmIGEgZGlyZWN0b3J5IGlzIHBhc3NlZCwgcmVjdXJzaXZlbHkgY29tcGlsZSBhbGwgJy5jb2ZmZWUnIGFuZCAnLmtvZmZlZScgZmlsZXMuXG5cbmNvbXBpbGVQYXRoID0gKHNvdXJjZSwgdG9wTGV2ZWw6dG9wTGV2ZWw9bm8pIC0+XG5cbiAgICByZXR1cm4gaWYgbm90IHRvcExldmVsIGFuZCBoaWRkZW4gc291cmNlXG4gICAgICAgICAgICAgIFxuICAgIHRyeVxuICAgICAgICBzdGF0cyA9IGZzLnN0YXRTeW5jIHNvdXJjZVxuICAgIGNhdGNoIGVyclxuICAgICAgICBpZiBlcnIuY29kZSBpcyAnRU5PRU5UJ1xuICAgICAgICAgICAgZXJyb3IgXCJDb21tYW5kLmNvbXBpbGVQYXRoIGNhbid0IHN0YXQgJyN7c291cmNlfSdcIlxuICAgICAgICAgICAgcHJvY2Vzcy5leGl0IDFcbiAgICAgICAgdGhyb3cgZXJyXG4gICAgICAgIFxuICAgIGlmIHN0YXRzLmlzRGlyZWN0b3J5KClcbiAgICAgICAgXG4gICAgICAgIGlmIHBhdGguYmFzZW5hbWUoc291cmNlKSBpbiBbJ25vZGVfbW9kdWxlcycgJy5naXQnXVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgb3B0cy5ydW5cbiAgICAgICAgICAgIGNvbXBpbGVQYXRoIGZpbmREaXJlY3RvcnlJbmRleChzb3VyY2UpLCB0b3BMZXZlbDp0b3BMZXZlbFxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgIFxuICAgICAgICBsb2cgJ0NvbW1hbmQuY29tcGlsZVBhdGggZGlyOicsIHNvdXJjZSBpZiBvcHRzLkRlYnVnXG4gICAgICAgIFxuICAgICAgICB0cnlcbiAgICAgICAgICAgIGZpbGVzID0gZnMucmVhZGRpclN5bmMgc291cmNlXG4gICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgaWYgZXJyLmNvZGUgaXMgJ0VOT0VOVCcgdGhlbiByZXR1cm4gXG4gICAgICAgICAgICB0aHJvdyBlcnJcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgZmlsZSBpbiBmaWxlc1xuICAgICAgICAgICAgY29tcGlsZVBhdGggcGF0aC5qb2luIHNvdXJjZSwgZmlsZVxuICAgICAgICAgICAgXG4gICAgZWxzZSBpZiB0b3BMZXZlbCBvciBpc0NvZmZlZSBzb3VyY2VcbiAgICAgICAgXG4gICAgICAgIHRyeVxuICAgICAgICAgICAgY29kZSA9IGZzLnJlYWRGaWxlU3luYyBzb3VyY2VcbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICBpZiBlcnIuY29kZSBpcyAnRU5PRU5UJyB0aGVuIHJldHVyblxuICAgICAgICAgICAgdGhyb3cgZXJyXG4gICAgICAgIFxuICAgICAgICBsb2cgJ0NvbW1hbmQuY29tcGlsZVBhdGggZmlsZTonLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuICAgICAgICAgICAgXG4gICAgICAgIGNvbXBpbGVTY3JpcHQgY29kZS50b1N0cmluZygpLCBzb3VyY2VcbiAgICAgICAgXG5maW5kRGlyZWN0b3J5SW5kZXggPSAoc291cmNlKSAtPlxuXG4gICAgZm9yIGV4dCBpbiBLb2ZmZWUuRklMRV9FWFRFTlNJT05TXG4gICAgICAgIGluZGV4ID0gcGF0aC5qb2luIHNvdXJjZSwgXCJpbmRleCN7ZXh0fVwiXG4gICAgICAgIHRyeVxuICAgICAgICAgICAgcmV0dXJuIGluZGV4IGlmIChmcy5zdGF0U3luYyBpbmRleCkuaXNGaWxlKClcbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICB0aHJvdyBlcnIgdW5sZXNzIGVyci5jb2RlIGlzICdFTk9FTlQnXG4gICAgZXJyb3IgXCJNaXNzaW5nIGluZGV4LmNvZmZlZSBpbiAje3NvdXJjZX1cIlxuICAgIHByb2Nlc3MuZXhpdCAxXG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAgICAgMDAwICAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAgMDAwICAgICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAgMDAwICAgICBcblxuIyBDb21waWxlIGEgc2luZ2xlIHNvdXJjZSBzY3JpcHQsIGNvbnRhaW5pbmcgdGhlIGdpdmVuIGNvZGUsIGFjY29yZGluZyB0byB0aGUgcmVxdWVzdGVkIG9wdGlvbnMuIFxuIyBJZiBldmFsdWF0aW5nIHRoZSBzY3JpcHQgZGlyZWN0bHkgc2V0cyBgX19maWxlbmFtZWAsIGBfX2Rpcm5hbWVgIGFuZCBgbW9kdWxlLmZpbGVuYW1lYCB0byBiZSBjb3JyZWN0IHJlbGF0aXZlIHRvIHRoZSBzY3JpcHQncyBwYXRoLlxuXG5jb21waWxlU2NyaXB0ID0gKGNvZGUsIHNvdXJjZT1udWxsKSAtPlxuICAgIFxuICAgIG8gPSBvcHRzXG4gICAgb3B0aW9ucyA9IGNvbXBpbGVPcHRpb25zIHNvdXJjZVxuICAgIFxuICAgIHRyeVxuICAgICAgICB0ID0gdGFzayA9IHtzb3VyY2UsIGNvZGUsIG9wdGlvbnN9XG4gICAgICAgIEtvZmZlZS5lbWl0ICdjb21waWxlJywgdGFza1xuICAgICAgICBcbiAgICAgICAgaWYgby50b2tlbnNcbiAgICAgICAgICAgIHByaW50VG9rZW5zIEtvZmZlZS50b2tlbnMgdC5jb2RlLCB0Lm9wdGlvbnNcbiAgICAgICAgZWxzZSBpZiBvLmNvZmZlZVxuICAgICAgICAgICAgcHJpbnRSZXdyaXRlciBLb2ZmZWUudG9rZW5zIHQuY29kZSwgdC5vcHRpb25zXG4gICAgICAgIGVsc2UgaWYgby5wYXJzZVxuICAgICAgICAgICAgcHJpbnRMaW5lIEtvZmZlZS5ub2Rlcyh0LmNvZGUsIHQub3B0aW9ucykudG9TdHJpbmcoKS50cmltKClcbiAgICAgICAgZWxzZSBpZiBvLnJ1blxuICAgICAgICAgICAgS29mZmVlLnJlZ2lzdGVyKClcbiAgICAgICAgICAgIEtvZmZlZS5ldmFsIG9wdHMucHJlbHVkZSwgdC5vcHRpb25zIGlmIG9wdHMucHJlbHVkZVxuICAgICAgICAgICAgdC5vcHRpb25zLmZpbGVuYW1lID89IG9wdGlvbnMuc291cmNlXG4gICAgICAgICAgICBpZiBvcHRzLm5vb3AgdGhlbiBsb2cgXCJub29wIHJ1biAje3NvdXJjZX1cIlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEtvZmZlZS5ydW4gdC5jb2RlLCB0Lm9wdGlvbnNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgY29tcGlsZWQgPSBLb2ZmZWUuY29tcGlsZSB0LmNvZGUsIHQub3B0aW9uc1xuICAgICAgICAgICAgdC5vdXRwdXQgPSBjb21waWxlZFxuICAgICAgICAgICAgaWYgby5tYXBcbiAgICAgICAgICAgICAgICB0Lm91dHB1dCA9IGNvbXBpbGVkLmpzXG4gICAgICAgICAgICAgICAgdC5zb3VyY2VNYXAgPSBjb21waWxlZC52M1NvdXJjZU1hcFxuXG4gICAgICAgICAgICBLb2ZmZWUuZW1pdCAnc3VjY2VzcycsIHRhc2tcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgby5qc1xuICAgICAgICAgICAgICAgIGlmIG9wdHMubm9vcCB0aGVuIGxvZyBcIm5vb3AganMgI3tzb3VyY2V9XCJcbiAgICAgICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgICAgICBwcmludExpbmUgdC5vdXRwdXQudHJpbSgpXG4gICAgICAgICAgICBlbHNlIGlmIG8uY29tcGlsZSBvciBvLm1hcFxuICAgICAgICAgICAgICAgIGlmIG9wdHMubm9vcCB0aGVuIGxvZyBcIm5vb3Agd3JpdGUgI3tvcHRpb25zLmpzUGF0aH1cIlxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVKcyB0LnNvdXJjZSwgdC5vdXRwdXQsIG9wdGlvbnMuanNQYXRoLCB0LnNvdXJjZU1hcFxuICAgIGNhdGNoIGVyclxuICAgICAgICBcbiAgICAgICAgS29mZmVlLmVtaXQgJ2ZhaWx1cmUnLCBlcnIsIHRhc2tcbiAgICAgICAgcmV0dXJuIGlmIEtvZmZlZS5saXN0ZW5lcnMoJ2ZhaWx1cmUnKS5sZW5ndGhcblxuICAgICAgICBtZXNzYWdlID0gZXJyLm1lc3NhZ2VcbiAgICAgICAgXG4gICAgICAgIGlmIGVyciBpbnN0YW5jZW9mIFN5bnRheEVycm9yXG4gICAgICAgICAgICBwcmludExpbmUgbWVzc2FnZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwcmludExpbmUgZXJyLnN0YWNrXG4gICAgICAgIFxuICAgICAgICBpZiBvLndhdGNoIG9yIG8uZXZhbFxuICAgICAgICAgICAgcHJpbnQgJ1xceDA3JyAjIGJlbGxcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcHJvY2Vzcy5leGl0IDFcblxuY29tcGlsZU9wdGlvbnMgPSAoc291cmNlKSAtPiAjIFRoZSBjb21waWxlLXRpbWUgb3B0aW9ucyB0byBwYXNzIHRvIHRoZSBjb21waWxlci5cbiAgICBcbiAgICBjb3B0cyA9IE9iamVjdC5hc3NpZ24ge30sIG9wdHNcbiAgICBjb3B0cy5zb3VyY2VNYXAgPSBvcHRzLm1hcFxuICAgIGNvcHRzLmlubGluZU1hcCA9IG9wdHNbJ2lubGluZS1tYXAnXVxuXG4gICAgaWYgc291cmNlXG4gICAgICAgIFxuICAgICAgICBjd2QgPSBwcm9jZXNzLmN3ZCgpXG4gICAgICAgIGpzUGF0aCA9IG91dHB1dFBhdGggc291cmNlLCAnLmpzJ1xuICAgICAgICBqc0RpciA9IHBhdGguZGlybmFtZSBqc1BhdGhcbiAgICAgICAgY29wdHMgPSBtZXJnZSBjb3B0cywge1xuICAgICAgICAgICAganNQYXRoXG4gICAgICAgICAgICBzb3VyY2VSb290OiBwYXRoLnJlbGF0aXZlIGpzRGlyLCBjd2RcbiAgICAgICAgICAgIHNvdXJjZUZpbGVzOiBbcGF0aC5yZWxhdGl2ZSBjd2QsIHNvdXJjZV1cbiAgICAgICAgICAgIGdlbmVyYXRlZEZpbGU6IGJhc2VGaWxlTmFtZShqc1BhdGgsIG5vLCB1c2VXaW5QYXRoU2VwKVxuICAgICAgICB9XG4gICAgY29wdHNcbiAgICAgICAgICAgIFxuIyBBdHRhY2ggdGhlIGFwcHJvcHJpYXRlIGxpc3RlbmVycyB0byBjb21waWxlIHNjcmlwdHMgaW5jb21pbmcgb3ZlciAqKnN0ZGluKiosIGFuZCB3cml0ZSB0aGVtIGJhY2sgdG8gKipzdGRvdXQqKi5cblxuY29tcGlsZVN0ZGlvID0gLT5cbiAgICBcbiAgICBidWZmZXJzID0gW11cbiAgICBzdGRpbiA9IHByb2Nlc3Mub3BlblN0ZGluKClcbiAgICBzdGRpbi5vbiAnZGF0YScsIChidWZmZXIpIC0+IGJ1ZmZlcnMucHVzaCBidWZmZXIgaWYgYnVmZmVyXG4gICAgc3RkaW4ub24gJ2VuZCcsIC0+IGNvbXBpbGVTY3JpcHQgQnVmZmVyLmNvbmNhdChidWZmZXJzKS50b1N0cmluZygpXG5cbiMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuIyAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMDAwMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4jIDAwICAgICAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuXG53YXRjaFBhdGggPSAoc291cmNlKSAtPiAjIFdhdGNoIGEgZmlsZSBvciBkaXJlY3RvcnkuXG4gICAgXG4gICAgdHJ5XG4gICAgICAgIHN0YXRzID0gZnMuc3RhdFN5bmMgc291cmNlXG4gICAgY2F0Y2ggZXJyXG4gICAgICAgIHJldHVybiBpZiBlcnIuY29kZSBpcyAnRU5PRU5UJ1xuICAgICAgICByZXR1cm4gZXJyb3IgXCJDb21tYW5kLndhdGNoUGF0aCBjYW4ndCBzdGF0ICcje3NvdXJjZX0nXCIsIGVyclxuICAgICAgICAgICAgICAgIFxuICAgIGlmIHN0YXRzLmlzRGlyZWN0b3J5KClcbiAgICAgICAgd2F0Y2hEaXIgc291cmNlXG4gICAgZWxzZVxuICAgICAgICB3YXRjaEZpbGUgc291cmNlXG5cbiMgV2F0Y2ggYSBzaW5nbGUgZmlsZSB1c2luZyBgZnMud2F0Y2hgLCByZWNvbXBpbGluZyBpdCBldmVyeSB0aW1lIHRoZSBmaWxlIGlzIHVwZGF0ZWQuXG4jIE1heSBiZSB1c2VkIGluIGNvbWJpbmF0aW9uIHdpdGggb3RoZXIgb3B0aW9ucywgc3VjaCBhcyBgLS1wcmludGAuXG4gICAgICAgIFxud2F0Y2hGaWxlID0gKHNvdXJjZSkgLT5cbiAgICBcbiAgICByZXR1cm4gaWYgbm90IGlzQ29mZmVlIHNvdXJjZVxuICAgIFxuICAgIGxvZyAnQ29tbWFuZC53YXRjaEZpbGUnLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuICAgIFxuICAgIHdhdGNoZXIgICAgICAgID0gbnVsbFxuICAgIHByZXZTdGF0cyAgICAgID0gbnVsbFxuICAgIGNvbXBpbGVUaW1lb3V0ID0gbnVsbFxuXG4gICAgc3RhcnRXYXRjaGVyID0gLT5cbiAgICAgICAgXG4gICAgICAgIHdhdGNoZXIgPSBmcy53YXRjaCBzb3VyY2VcbiAgICAgICAgLm9uICdjaGFuZ2UnLCAoY2hhbmdlKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gaWYgY2hhbmdlICE9ICdjaGFuZ2UnXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGxvZyAnQ29tbWFuZC53YXRjaEZpbGUnLCBjaGFuZ2UsIHNvdXJjZSBpZiBvcHRzLkRlYnVnXG5cbiAgICAgICAgICAgIGNsZWFyVGltZW91dCBjb21waWxlVGltZW91dFxuICAgICAgICAgICAgY29tcGlsZVRpbWVvdXQgPSB3YWl0IDI1LCAtPlxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGZzLnN0YXQgc291cmNlLCAoZXJyLCBzdGF0cykgLT5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHdhdGNoZXIuY2xvc2UoKSBpZiBlcnI/LmNvZGUgaXMgJ0VOT0VOVCdcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVycm9yIGVyciBpZiBlcnJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlmIHByZXZTdGF0cyBhbmQgc3RhdHMubXRpbWUuZ2V0VGltZSgpIGlzIHByZXZTdGF0cy5tdGltZS5nZXRUaW1lKCkgYW5kIHN0YXRzLnNpemUgaXMgcHJldlN0YXRzLnNpemVcbiAgICAgICAgICAgICAgICAgICAgcHJldlN0YXRzID0gc3RhdHNcbiAgICAgICAgICAgICAgICAgICAgZnMucmVhZEZpbGUgc291cmNlLCAoZXJyLCBjb2RlKSAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVycm9yIGVyciBpZiBlcnJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZyAnQ29tbWFuZC53YXRjaEZpbGUgY29tcGlsZScsIHNvdXJjZSBpZiBvcHRzLkRlYnVnXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21waWxlU2NyaXB0IGNvZGUudG9TdHJpbmcoKSwgc291cmNlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgLm9uICdlcnJvcicsIChlcnIpIC0+XG4gICAgICAgICAgICB0aHJvdyBlcnIgdW5sZXNzIGVyci5jb2RlIGlzICdFUEVSTSdcblxuICAgIHRyeVxuICAgICAgICBzdGFydFdhdGNoZXIoKVxuICAgIGNhdGNoIGVyclxuICAgICAgICBlcnJvciBlcnJcblxud2F0Y2hEaXIgPSAoc291cmNlKSAtPlxuICAgIFxuICAgIGxvZyAnQ29tbWFuZC53YXRjaERpcicsIHNvdXJjZSBpZiBvcHRzLkRlYnVnXG4gICAgXG4gICAgd2F0Y2hlciA9IG51bGxcblxuICAgIHN0YXJ0V2F0Y2hlciA9IC0+XG5cbiAgICAgICAgdHJ5XG4gICAgICAgICAgICBmaWxlcyA9IGZzLnJlYWRkaXJTeW5jIHNvdXJjZVxuICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgIHJldHVybiBpZiBlcnI/LmNvZGUgaXMgJ0VOT0VOVCdcbiAgICAgICAgICAgIHRocm93IGVyclxuICAgICAgICAgICAgXG4gICAgICAgIGZvciBmaWxlIGluIGZpbGVzXG4gICAgICAgICAgICBjb250aW51ZSBpZiBmaWxlWzBdID09ICcuJ1xuICAgICAgICAgICAgY29udGludWUgaWYgZmlsZSBpbiBbJ25vZGVfbW9kdWxlcyddXG4gICAgICAgICAgICB3YXRjaFBhdGggcGF0aC5qb2luIHNvdXJjZSwgZmlsZVxuICAgICAgICBcbiAgICAgICAgd2F0Y2hlciA9IGZzLndhdGNoIHNvdXJjZVxuICAgICAgICAub24gJ2Vycm9yJywgKGVycikgLT5cbiAgICAgICAgICAgIHRocm93IGVyciB1bmxlc3MgZXJyLmNvZGUgaXMgJ0VQRVJNJ1xuICAgICAgICAgICAgd2F0Y2hlci5jbG9zZSgpXG4gICAgICAgIC5vbiAnY2hhbmdlJywgKGNoYW5nZSwgcCkgLT5cbiAgICAgICAgICAgIGlmIGNoYW5nZSA9PSAncmVuYW1lJ1xuICAgICAgICAgICAgICAgIGxvZyAnQ29tbWFuZC53YXRjaERpcicsIGNoYW5nZSwgcGF0aC5qb2luIHNvdXJjZSwgcCBpZiBvcHRzLkRlYnVnXG4gICAgICAgICAgICAgICAgd2F0Y2hQYXRoIHBhdGguam9pbiBzb3VyY2UsIHBcbiAgICAgICAgICAgIFxuICAgIHRyeVxuICAgICAgICBzdGFydFdhdGNoZXIoKVxuICAgIGNhdGNoIGVyclxuICAgICAgICByZXR1cm4gaWYgZXJyLmNvZGUgaXMgJ0VOT0VOVCdcbiAgICAgICAgdGhyb3cgZXJyXG5cbiMgR2V0IHRoZSBjb3JyZXNwb25kaW5nIG91dHB1dCBKYXZhU2NyaXB0IHBhdGggZm9yIGEgc291cmNlIGZpbGUuXG4gICAgXG5vdXRwdXRQYXRoID0gKHNvdXJjZSwgZXh0ZW5zaW9uKSAtPlxuICAgIFxuICAgIGJhc2VuYW1lID0gYmFzZUZpbGVOYW1lIHNvdXJjZSwgeWVzLCB1c2VXaW5QYXRoU2VwXG4gICAgaWYgb3B0cy5vdXRwdXRcbiAgICAgICAgZGlyID0gb3B0cy5vdXRwdXRcbiAgICBlbHNlXG4gICAgICAgIGRpciA9IHBhdGguZGlybmFtZSBzb3VyY2VcbiAgICBwYXRoLmpvaW4gZGlyLCBiYXNlbmFtZSArIGV4dGVuc2lvblxuXG4jIFJlY3Vyc2l2ZWx5IG1rZGlyLCBsaWtlIGBta2RpciAtcGAuXG5cbm1rZGlycCA9IChkaXIsIGZuKSAtPlxuICAgIG1vZGUgPSAwbzc3NyAmIH5wcm9jZXNzLnVtYXNrKClcblxuICAgIGRvIG1rZGlycyA9IChwID0gZGlyLCBmbikgLT5cbiAgICAgICAgZnMuZXhpc3RzIHAsIChleGlzdHMpIC0+XG4gICAgICAgICAgICBpZiBleGlzdHNcbiAgICAgICAgICAgICAgICBmbigpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgbWtkaXJzIHBhdGguZGlybmFtZShwKSwgLT5cbiAgICAgICAgICAgICAgICAgICAgZnMubWtkaXIgcCwgbW9kZSwgKGVycikgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmbiBlcnIgaWYgZXJyXG4gICAgICAgICAgICAgICAgICAgICAgICBmbigpXG5cbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAgMDAwICAgMDAwMDAwMCAgXG4jIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgICAgIDAwMCAgMDAwICAgICAgIFxuIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAgICAgICAwMDAgIDAwMDAwMDAgICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgXG4jIDAwICAgICAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuXG4jIFdyaXRlIG91dCBhIEphdmFTY3JpcHQgc291cmNlIGZpbGUgd2l0aCB0aGUgY29tcGlsZWQgY29kZS4gXG4jIEJ5IGRlZmF1bHQsIGZpbGVzIGFyZSB3cml0dGVuIG91dCBpbiBgY3dkYCBhcyBgLmpzYCBmaWxlcyB3aXRoIHRoZSBzYW1lIG5hbWUsIGJ1dCB0aGUgb3V0cHV0IGRpcmVjdG9yeSBjYW4gYmUgY3VzdG9taXplZCB3aXRoIGAtLW91dHB1dGAuXG4jIElmIGBnZW5lcmF0ZWRTb3VyY2VNYXBgIGlzIHByb3ZpZGVkLCB0aGlzIHdpbGwgd3JpdGUgYSBgLmpzLm1hcGAgZmlsZSBpbnRvIHRoZSBzYW1lIGRpcmVjdG9yeSBhcyB0aGUgYC5qc2AgZmlsZS5cblxud3JpdGVKcyA9IChzb3VyY2UsIGpzLCBqc1BhdGgsIGdlbmVyYXRlZFNvdXJjZU1hcCA9IG51bGwpIC0+XG4gICAgXG4gICAgc291cmNlTWFwUGF0aCA9IG91dHB1dFBhdGggc291cmNlLCAnLmpzLm1hcCdcbiAgICBqc0RpciA9IHBhdGguZGlybmFtZSBqc1BhdGhcbiAgICBjb21waWxlID0gLT5cbiAgICAgICAgaWYgb3B0cy5jb21waWxlXG4gICAgICAgICAgICBqcyA9ICcgJyBpZiBqcy5sZW5ndGggPD0gMFxuICAgICAgICAgICAgaWYgZ2VuZXJhdGVkU291cmNlTWFwIHRoZW4ganMgPSBcIiN7anN9XFxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9I3tiYXNlRmlsZU5hbWUgc291cmNlTWFwUGF0aCwgbm8sIHVzZVdpblBhdGhTZXB9XFxuXCJcbiAgICAgICAgICAgIGZzLndyaXRlRmlsZSBqc1BhdGgsIGpzLCAoZXJyKSAtPlxuICAgICAgICAgICAgICAgIGlmIGVyclxuICAgICAgICAgICAgICAgICAgICBwcmludExpbmUgZXJyLm1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0IDFcbiAgICAgICAgICAgICAgICBlbHNlIGlmIG9wdHMuY29tcGlsZSBhbmQgb3B0cy53YXRjaFxuICAgICAgICAgICAgICAgICAgICB0aW1lTG9nIFwiY29tcGlsZWQgI3tzb3VyY2V9XCJcbiAgICAgICAgaWYgZ2VuZXJhdGVkU291cmNlTWFwXG4gICAgICAgICAgICBmcy53cml0ZUZpbGUgc291cmNlTWFwUGF0aCwgZ2VuZXJhdGVkU291cmNlTWFwLCAoZXJyKSAtPlxuICAgICAgICAgICAgICAgIGlmIGVyclxuICAgICAgICAgICAgICAgICAgICBwcmludExpbmUgXCJDb3VsZCBub3Qgd3JpdGUgc291cmNlIG1hcDogI3tlcnIubWVzc2FnZX1cIlxuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQgMVxuICAgIGZzLmV4aXN0cyBqc0RpciwgKGl0RXhpc3RzKSAtPlxuICAgICAgICBpZiBpdEV4aXN0cyB0aGVuIGNvbXBpbGUoKSBlbHNlIG1rZGlycCBqc0RpciwgY29tcGlsZVxuXG53YWl0ID0gKG1pbGxpc2Vjb25kcywgZnVuYykgLT4gc2V0VGltZW91dCBmdW5jLCBtaWxsaXNlY29uZHMgIyBDb252ZW5pZW5jZSBmb3IgY2xlYW5lciBzZXRUaW1lb3V0cy5cblxudGltZUxvZyA9IChtZXNzYWdlKSAtPiBsb2cgXCIjeyhuZXcgRGF0ZSkudG9Mb2NhbGVUaW1lU3RyaW5nKCl9IC0gI3ttZXNzYWdlfVwiXG5cbiMgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMDAwMDAgICBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgICAwMDAgIFxuIyAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG5cbnByaW50VG9rZW5zID0gKHRva2VucykgLT5cblxuICAgIGZvciBpbmRleCBpbiBbMC4uLnRva2Vucy5sZW5ndGhdXG4gICAgICAgIHRva2VuICA9IHRva2Vuc1tpbmRleF1cbiAgICAgICAgdGFnICAgID0gdG9rZW5bMF1cbiAgICAgICAgdmFsdWUgID0gdG9rZW5bMV0udG9TdHJpbmcoKS5yZXBsYWNlKC9cXG4vLCAnXFxcXG4nKVxuICAgICAgICBjdGFnICAgPSBncmF5IHRhZ1xuICAgICAgICBjdmFsdWUgPSBib2xkIHllbGxvdyB2YWx1ZVxuICAgICAgICBpbmRleCAgPSBncmF5IGRpbSBpbmRleFxuICAgICAgICBpZiB0YWcgPT0gJ1RFUk1JTkFUT1InXG4gICAgICAgICAgICBwcmludCAnXFxuXFxuJ1xuICAgICAgICBlbHNlIGlmIHRhZyA9PSAnSU5ERU5UJ1xuICAgICAgICAgICAgcHJpbnQgZ3JheSBkaW0gJ0lORCAnXG4gICAgICAgIGVsc2UgaWYgdGFnID09ICdPVVRERU5UJ1xuICAgICAgICAgICAgcHJpbnQgZ3JheSBkaW0gJ09VVCAnXG4gICAgICAgIGVsc2UgaWYgdGFnIGluIFsnQ0xBU1MnICdQQVJBTV9TVEFSVCcgJ1BBUkFNX0VORCcgJ05VTEwnXVxuICAgICAgICAgICAgcHJpbnQgXCIje2luZGV4fSN7Y3RhZ30gXCJcbiAgICAgICAgZWxzZSBpZiB0YWcgPT0gdmFsdWVcbiAgICAgICAgICAgIHByaW50IFwiI3tpbmRleH0je2N2YWx1ZX0gXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcHJpbnQgXCIje2luZGV4fSN7Y3RhZ309I3tjdmFsdWV9IFwiXG4gICAgICAgIFxucHJpbnRSZXdyaXRlciA9ICh0b2tlbnMpIC0+XG5cbiAgICBpbmRlbnQgPSAwXG4gICAgZm9yIGluZGV4IGluIFswLi4udG9rZW5zLmxlbmd0aF1cbiAgICAgICAgdG9rZW4gPSB0b2tlbnNbaW5kZXhdXG4gICAgICAgIHRhZyAgID0gdG9rZW5bMF1cbiAgICAgICAgdmFsdWUgPSB0b2tlblsxXVxuICAgICAgICBcbiAgICAgICAgZ3JheURpbSA9IChzKSAtPiBkaW0gZ3JheSBzXG4gICAgICAgIGJsdWVEaW0gPSAocykgLT4gZGltIGJsdWUgc1xuICAgICAgICB5ZWxsb3dEaW0gPSAocykgLT4gZGltIHllbGxvdyBzXG4gICAgICAgIHNwYWNlZCA9IChjb2xvciwgdiktPlxuICAgICAgICAgICAgcHJpbnQgY29sb3IgXCIje3YgPyB2YWx1ZX1cIlxuICAgICAgICAgICAgcHJpbnQgJyAnIGlmIHRva2VuLnNwYWNlZCBhbmQgdG9rZW5zW2luZGV4KzFdWzBdIG5vdCBpbiBbJ0NBTExfU1RBUlQnXVxuXG4gICAgICAgICMgbG9nIHRva2VuXG4gICAgICAgIHN3aXRjaCB0YWcgXG4gICAgICAgICAgICB3aGVuICdURVJNSU5BVE9SJyAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcHJpbnQgXCJcXG4je3BhZCAnJywgaW5kZW50fVwiXG4gICAgICAgICAgICB3aGVuICdJTkRFTlQnICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gaW5kZW50ICs9IDQ7IHByaW50IFwiXFxuI3twYWQgJycsIGluZGVudH1cIlxuICAgICAgICAgICAgd2hlbiAnT1VUREVOVCcgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIGluZGVudCAtPSA0OyBwcmludCBcIlxcbiN7cGFkICcnLCBpbmRlbnR9XCJcbiAgICAgICAgICAgIHdoZW4gJ0hFUkVDT01NRU5UJyAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgZ3JheURpbVxuICAgICAgICAgICAgd2hlbiAnQ0FMTF9TVEFSVCcgJ0NBTExfRU5EJyAgICAgICAgICAgICB0aGVuIHNwYWNlZCBncmF5RGltXG4gICAgICAgICAgICB3aGVuICdVTkFSWScgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGJsdWVCcmlnaHQsICdub3QnXG4gICAgICAgICAgICB3aGVuICcmJicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGJsdWVCcmlnaHQsICdhbmQnXG4gICAgICAgICAgICB3aGVuICd8fCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGJsdWVCcmlnaHQsICdvcidcbiAgICAgICAgICAgIHdoZW4gJ1NUUklORycgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgZ3JlZW5cbiAgICAgICAgICAgIHdoZW4gJ1NUUklOR19TVEFSVCcgJ1NUUklOR19FTkQnICAgICAgICAgdGhlbiBzcGFjZWQgcmVkQnJpZ2h0XG4gICAgICAgICAgICB3aGVuICdQUk9QRVJUWScgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIHllbGxvd1xuICAgICAgICAgICAgd2hlbiAnOicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCB5ZWxsb3dEaW1cbiAgICAgICAgICAgIHdoZW4gJ0AnIFxuICAgICAgICAgICAgICAgIGlmIHRva2Vuc1tpbmRleCsxXVswXSBub3QgaW4gWydNRVRBX0lGJyAnTUVUQV9FTFNFJyAnUE9TVF9NRVRBX0lGJ10gdGhlbiBzcGFjZWQoeWVsbG93RGltKSBlbHNlIHNwYWNlZCBibHVlRGltXG4gICAgICAgICAgICB3aGVuICdNRVRBX0lGJyAnTUVUQV9FTFNFJyAnUE9TVF9NRVRBX0lGJyB0aGVuIHNwYWNlZCBibHVlLCAn4pa4Jyt2YWx1ZVxuICAgICAgICAgICAgd2hlbiAnTlVNQkVSJyAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCBibHVlXG4gICAgICAgICAgICB3aGVuICd7Jyd9JyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gaWYgbm90IHRva2VuLmdlbmVyYXRlZCB0aGVuIHNwYWNlZCBncmF5XG4gICAgICAgICAgICB3aGVuICc9JyAnKycgJy0nICcrKycgJy0tJyAnLi4uJyAnOjonIFxcXG4gICAgICAgICAgICAgICAgICdbJyAnXScgJ3snICd9JyAnLicgJ01BVEgnICdVTkFSWV9NQVRIJyBcXFxuICAgICAgICAgICAgICAgICAnSU5ERVhfU1RBUlQnICdJTkRFWF9FTkQnIFxcXG4gICAgICAgICAgICAgICAgICdDT01QQVJFJyAnQ09NUE9VTkRfQVNTSUdOJyAgICAgICAgIHRoZW4gc3BhY2VkIGdyYXlcbiAgICAgICAgICAgIHdoZW4gJywnICcoJyAnKScgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgZ3JheURpbVxuICAgICAgICAgICAgd2hlbiAnUEFSQU1fU1RBUlQnICdQQVJBTV9FTkQnICctPicgJz0+JyB0aGVuIHNwYWNlZCAocykgLT4gYm9sZCBibHVlIHNcbiAgICAgICAgICAgIHdoZW4gJ05VTEwnICdVTkRFRklORUQnICdGVU5DX0VYSVNUJyAnPycgJz8uJyAnQklOPycgdGhlbiBzcGFjZWQgcmVkXG4gICAgICAgICAgICB3aGVuICdSRUdFWCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIG1hZ2VudGFcbiAgICAgICAgICAgIHdoZW4gJ0ZPUicgJ0ZPUklOJyAnVFJZJyAnQ0FUQ0gnICdUSFJPVycgJ1JFTEFUSU9OJyAnRVhURU5EUycgJ1NUQVRFTUVOVCcgJ09XTicgJ0ZPUk9GJyAnTE9PUCcgXFxcbiAgICAgICAgICAgICAgICAgJ0lGJyAnUE9TVF9JRicgJ1dIRU4nICdUSEVOJyAnRUxTRScgJ1RISVMnICdTVVBFUicgJ1NXSVRDSCcgJ0xFQURJTkdfV0hFTicgJ1dISUxFJyBcXFxuICAgICAgICAgICAgICAgICAnQk9PTCcgJ0NMQVNTJyAnUkVUVVJOJyAgICAgICAgICAgICB0aGVuIHNwYWNlZCBibHVlQnJpZ2h0XG4gICAgICAgICAgICB3aGVuICdJREVOVElGSUVSJyBcbiAgICAgICAgICAgICAgICBzd2l0Y2ggdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAncmVxdWlyZScgdGhlbiBzcGFjZWQgZ3JheVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHNwYWNlZCB3aGl0ZUJyaWdodFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHByaW50IFwiPiN7dGFnfTxcIlxuICAgICAgICAgICAgICAgICMgc3BhY2VkIChzKSAtPiBib2xkIGJsdWVCcmlnaHQgc1xuICAgICAgICAgICAgICAgIHNwYWNlZCBjeWFuXG4gICAgICAgICAgICBcbnZlcnNpb24gPSAtPiBwcmludExpbmUgXCIje0tvZmZlZS5WRVJTSU9OfVwiXG51c2FnZSAgID0gLT4gXG5cbiAgICBsaW5lcyA9IFtcIiN7Z3JheSAnVXNhZ2U6J30gI3t5ZWxsb3cgJ2tvZmZlZSd9ICN7Z3JheSAnW29wdGlvbnNdJ30gcGF0aC90by9zY3JpcHQgI3tncmF5ICdbb3B0aW9uc10nfVxcblwiXVxuICAgIFxuICAgIHJ1bGVzID0gU1dJVENIRVMubWFwIChydWxlKSAtPlxuICAgICAgICBbc2hvcnQsIGxvbmcsIGRlc2NyaXB0aW9uXSA9IHJ1bGVcbiAgICAgICAgbG9uZ0ZsYWcgPSBsb25nLm1hdGNoKC9eKC0tXFx3W1xcd1xcLV0qKS8pWzFdXG4gICAgICAgIGNzaG9ydCAgID0gaWYgc2hvcnQgdGhlbiBncmF5KHNob3J0WzBdKSArIGJvbGQoZ3JheShzaG9ydFsxLi5dKSkgKyAnICAnIGVsc2UgJyAgICAnXG4gICAgICAgIGNsb25nICAgID0gcGFkIGxvbmcsIDIwXG4gICAgICAgIGNsb25nICAgID0gZ3JheShjbG9uZ1swLi4xXSkgKyBib2xkKHdoaXRlKGNsb25nWzIuLl0uc3BsaXQoJyAnKVswXSkpICsgJyAnICsgYm9sZChibHVlQnJpZ2h0KGNsb25nWzIuLl0uc3BsaXQoJyAnKVsxLi5dLmpvaW4oJyAnKSkpXG4gICAgICAgIGxpbmVzLnB1c2ggJyAgICAnICsgY3Nob3J0ICsgY2xvbmcgKyBncmF5IGRlc2NyaXB0aW9uXG4gICAgICAgIFxuICAgIGxpbmVzLnB1c2ggZ3JheSAnXFxuSWYgY2FsbGVkIHdpdGhvdXQgYSBzY3JpcHQsIHRoZSBpbnRlcmFjdGl2ZSBSRVBMIHdpbGwgYmUgc3RhcnRlZCdcbiAgICAgICAgXG4gICAgbG9nIFwiXFxuI3sgbGluZXMuam9pbignXFxuJykgfVxcblwiXG4gICAgICAgICJdfQ==
//# sourceURL=../coffee/command.coffee