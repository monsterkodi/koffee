// koffee 1.16.0

/*
 0000000   0000000   00     00  00     00   0000000   000   000  0000000    
000       000   000  000   000  000   000  000   000  0000  000  000   000  
000       000   000  000000000  000000000  000000000  000 0 000  000   000  
000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  
 0000000   0000000   000   000  000   000  000   000  000   000  0000000
 */
var FEATURES, Koffee, SWITCHES, baseFileName, compilePath, compileScript, compileStdio, error, exec, features, findDirectoryIndex, fs, helpers, hidden, isCoffee, logFeatures, makePrelude, merge, mkdirp, nopt, opts, outputPath, pad, parseOptions, print, printFragments, printLine, printRewriter, printTokens, printWarn, ref, run, slash, spawn, startRepl, stringify, timeLog, usage, useWinPathSep, version, wait, watchDir, watchFile, watchPath, writeJs;

fs = require('fs');

slash = require('kslash');

nopt = require('nopt');

helpers = require('./helpers');

features = require('./features');

Koffee = require('./koffee');

ref = require('child_process'), spawn = ref.spawn, exec = ref.exec;

useWinPathSep = slash.sep === '\\';

helpers.colors();

FEATURES = features.FEATURES, logFeatures = features.logFeatures;

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

SWITCHES = [['-b', '--bare', 'compile without a top-level function wrapper', Boolean], ['-c', '--compile', 'compile to JavaScript and save as .js files', Boolean], ['-d', '--doc', 'log the ▸doc sections', Boolean], ['-e', '--eval STRING', 'evaluate a string and print the result', [String, Array]], ['-f', '--features', 'list available features', Boolean], ['', '--no-`feature', 'disable a feature, e.g. --no-negative-index', null], ['-h', '--help', 'display this help message', Boolean], ['-j', '--js', 'print the compiled JavaScript', Boolean], ['-m', '--map', 'generate source map and save as .js.map files', Boolean], ['-M', '--inline-map', 'generate source map and include it directly in output', Boolean], ['', '--metalog', 'meta log (default: console.log)', String], ['-n', '--noop', 'does nothing, for debugging purposes', Boolean], ['-o', '--output DIR', 'set the output directory for compiled JavaScript', String], ['-r', '--require MODULE', 'require the given module before eval or REPL', [String, Array]], ['-C', '--coffee', 'print the token stream as CoffeeScript', Boolean], ['-s', '--stdio', 'listen for and compile scripts over stdio', Boolean], ['-t', '--test', 'compile and run the @test code', Boolean], ['-T', '--tokens', 'print the tokens', Boolean], ['-F', '--fragments', 'print the fragments', Boolean], ['-P', '--parse', 'print the parse tree', Boolean], ['-v', '--version', 'display the version number', Boolean], ['-w', '--watch', 'watch scripts for changes and rerun commands', Boolean]];

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
    o.sourceMap = o.map;
    o.inlineMap = o['inline-map'];
    o.feature = {};
    FEATURES.map(function(f) {
        var ref1;
        o.feature[f.key] = (ref1 = o[f.flag]) != null ? ref1 : true;
        return delete o[f.flag];
    });
    if (o.Debug) {
        delete o.argv;
        return console.log(stringify(o));
    }
};

run = function() {
    var eval, i, j, len, len1, literals, ref1, ref2, results, source;
    parseOptions();
    if (opts.feature.color === false) {
        helpers.colors(false);
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
        ref1 = opts["eval"];
        for (i = 0, len = ref1.length; i < len; i++) {
            eval = ref1[i];
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
        opts.output = slash.resolve(opts.output);
    }
    ref2 = opts["arguments"];
    results = [];
    for (j = 0, len1 = ref2.length; j < len1; j++) {
        source = ref2[j];
        source = slash.resolve(source);
        if (opts.watch) {
            results.push(watchPath(source));
        } else {
            results.push(compilePath({
                source: source,
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

compilePath = function(arg) {
    var code, err, file, files, i, len, ref1, ref2, ref3, results, source, stats, topLevel;
    source = (ref1 = arg.source) != null ? ref1 : null, topLevel = (ref2 = arg.topLevel) != null ? ref2 : false;
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
        if ((ref3 = slash.basename(source)) === 'node_modules' || ref3 === '.git') {
            return;
        }
        if (opts.run) {
            compilePath({
                source: findDirectoryIndex(source),
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
            results.push(compilePath({
                source: slash.join(source, file)
            }));
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
    var err, ext, i, index, len, ref1;
    ref1 = Koffee.FILE_EXTENSIONS;
    for (i = 0, len = ref1.length; i < len; i++) {
        ext = ref1[i];
        index = slash.join(source, "index" + ext);
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
    var base, compiled, err, jsPath, message, o, options, t, task;
    if (source == null) {
        source = null;
    }
    o = opts;
    options = Koffee.compileOptions(source, opts);
    try {
        t = task = {
            source: source,
            code: code,
            options: options
        };
        if (o.tokens) {
            return printTokens(Koffee.tokens(t.code, t.options));
        } else if (o.fragments) {
            return printFragments(code, Koffee.fragments(t.code, t.options));
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
                    jsPath = options.jsPath;
                    if (o.output) {
                        jsPath = outputPath(t.source, '.js');
                    }
                    return writeJs(t.source, t.output, jsPath, t.sourceMap);
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
            watchPath(slash.join(source, file));
        }
        return watcher = fs.watch(source).on('error', function(err) {
            if (err.code !== 'EPERM') {
                throw err;
            }
            return watcher.close();
        }).on('change', function(change, p) {
            if (change === 'rename') {
                if (opts.Debug) {
                    console.log('Command.watchDir', change, slash.join(source, p));
                }
                return watchPath(slash.join(source, p));
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
        dir = slash.dirname(source);
    }
    return slash.join(dir, basename + extension);
};

mkdirp = function(dir, fn) {
    var mkdirs, mode;
    mode = 0x1ff & ~process.umask();
    return (mkdirs = function(p, fn) {
        return fs.exists(p, function(exists) {
            if (exists) {
                return fn();
            } else {
                return mkdirs(slash.dirname(p), function() {
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
    jsDir = slash.dirname(jsPath);
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
    var ctag, cvalue, i, index, ref1, results, tag, token, value;
    results = [];
    for (index = i = 0, ref1 = tokens.length; 0 <= ref1 ? i < ref1 : i > ref1; index = 0 <= ref1 ? ++i : --i) {
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

printFragments = function(code, fragments) {
    var column, frag, i, index, line, ref1, results, trimmed;
    console.log(code, fragments);
    console.log('');
    results = [];
    for (index = i = 0, ref1 = fragments.length; 0 <= ref1 ? i < ref1 : i > ref1; index = 0 <= ref1 ? ++i : --i) {
        frag = fragments[index];
        line = '';
        column = '';
        if (frag.locationData) {
            line = blueBright('' + frag.locationData.first_line);
            if (frag.locationData.last_line !== frag.locationData.first_line) {
                line += dim(blue('-' + frag.locationData.last_line));
            } else {
                line += '  ';
            }
            column = blue('' + frag.locationData.first_column);
        }
        trimmed = frag.code.replace(/ /g, '');
        if (trimmed.length) {
            if (trimmed.replace(/\n/g, '').length === 0) {
                results.push(console.log(''));
            } else {
                results.push(console.log(line + ' ' + column + ' ' + (dim(gray(helpers.pad(frag.type, 20)))) + yellowBright(frag.code)));
            }
        } else {
            results.push(void 0);
        }
    }
    return results;
};

printRewriter = function(tokens) {
    var blueDim, grayDim, i, indent, index, ref1, ref2, results, spaced, tag, token, value, yellowDim;
    indent = 0;
    results = [];
    for (index = i = 0, ref1 = tokens.length; 0 <= ref1 ? i < ref1 : i > ref1; index = 0 <= ref1 ? ++i : --i) {
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
            var ref2;
            print(color("" + (v != null ? v : value)));
            if (token.spaced && ((ref2 = tokens[index + 1][0]) !== 'CALL_START')) {
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
                if ((ref2 = tokens[index + 1][0]) !== 'META_IF' && ref2 !== 'META_ELSE' && ref2 !== 'POST_META_IF') {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZC5qcyIsInNvdXJjZVJvb3QiOiIuLi9jb2ZmZWUiLCJzb3VyY2VzIjpbImNvbW1hbmQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQWlCQSxFQUFBLEdBQW1CLE9BQUEsQ0FBUSxJQUFSOztBQUNuQixLQUFBLEdBQW1CLE9BQUEsQ0FBUSxRQUFSOztBQUNuQixJQUFBLEdBQW1CLE9BQUEsQ0FBUSxNQUFSOztBQUNuQixPQUFBLEdBQW1CLE9BQUEsQ0FBUSxXQUFSOztBQUNuQixRQUFBLEdBQW1CLE9BQUEsQ0FBUSxZQUFSOztBQUNuQixNQUFBLEdBQW1CLE9BQUEsQ0FBUSxVQUFSOztBQUNuQixNQUFtQixPQUFBLENBQVEsZUFBUixDQUFuQixFQUFFLGlCQUFGLEVBQVM7O0FBRVQsYUFBQSxHQUFtQixLQUFLLENBQUMsR0FBTixLQUFhOztBQUVoQyxPQUFPLENBQUMsTUFBUixDQUFBOztBQUVFLDRCQUFGLEVBQVk7O0FBRVYsbUNBQUYsRUFBZ0IsMkJBQWhCLEVBQTBCLDZCQUExQixFQUFxQyxxQkFBckMsRUFBNEM7O0FBRTVDLEtBQUEsR0FBWSxPQUFPLENBQUM7O0FBQ3BCLEtBQUEsR0FBWSxTQUFDLElBQUQ7V0FBVSxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQWYsQ0FBcUIsSUFBckI7QUFBVjs7QUFDWixTQUFBLEdBQVksU0FBQyxJQUFEO1dBQVUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFmLENBQXFCLElBQUEsR0FBTyxJQUE1QjtBQUFWOztBQUNaLFNBQUEsR0FBWSxTQUFDLElBQUQ7V0FBVSxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQWYsQ0FBcUIsSUFBQSxHQUFPLElBQTVCO0FBQVY7O0FBQ1osTUFBQSxHQUFZLFNBQUMsSUFBRDtXQUFVLFFBQVEsQ0FBQyxJQUFULENBQWMsSUFBZDtBQUFWOztBQUVaLFFBQUEsR0FBVyxDQUNQLENBQUMsSUFBRCxFQUFNLFFBQU4sRUFBNEIsOENBQTVC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QVcsS0FBTSxTQUFJLENBQUMsS0FBWCxDQUFpQixHQUFqQixDQUFzQixTQUFJLENBQUMsSUFBM0IsQ0FBZ0MsR0FBaEMsQ0FBWCxDQUFMO2VBQzdFLEtBQUssQ0FBQyxJQUFOLENBQVcsTUFBQSxHQUFTLE1BQVQsR0FBa0IsS0FBbEIsR0FBMEIsSUFBQSxDQUFLLFdBQUwsQ0FBckM7SUFOaUIsQ0FBYjtJQVFSLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBQSxDQUFLLG9FQUFMLENBQVg7V0FBb0YsT0FBQSxDQUVwRixHQUZvRixDQUVoRixJQUFBLEdBQUksQ0FBRSxLQUFLLENBQUMsSUFBTixDQUFXLElBQVgsQ0FBRixDQUFKLEdBQXdCLElBRndEO0FBWjlFIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4jIyNcblxuIyBoYW5kbGUgdmFyaW91cyB0YXNrczogXG4jXG4jICAgLSBjb21waWxlIGFuZCBzYXZlIGludG8gYC5qc2AgZmlsZXMgXG4jICAgLSBjb21waWxlIGFuZCBwcmludCB0byBzdGRvdXQgXG4jICAgLSByZWNvbXBpbGUgaWYgdGhlIHNvdXJjZSBjaGFuZ2VzXG4jICAgLSBwcmludCBsZXhlciB0b2tlbnNcbiMgICAtIHByaW50IGEgc3ludGF4IHRyZWVcbiMgICAtIGxhdW5jaCBhIFJFUExcblxuZnMgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ2ZzJ1xuc2xhc2ggICAgICAgICAgICA9IHJlcXVpcmUgJ2tzbGFzaCdcbm5vcHQgICAgICAgICAgICAgPSByZXF1aXJlICdub3B0J1xuaGVscGVycyAgICAgICAgICA9IHJlcXVpcmUgJy4vaGVscGVycydcbmZlYXR1cmVzICAgICAgICAgPSByZXF1aXJlICcuL2ZlYXR1cmVzJ1xuS29mZmVlICAgICAgICAgICA9IHJlcXVpcmUgJy4va29mZmVlJ1xueyBzcGF3biwgZXhlYyB9ICA9IHJlcXVpcmUgJ2NoaWxkX3Byb2Nlc3MnXG5cbnVzZVdpblBhdGhTZXAgICAgPSBzbGFzaC5zZXAgaXMgJ1xcXFwnXG5cbmhlbHBlcnMuY29sb3JzKClcblxueyBGRUFUVVJFUywgbG9nRmVhdHVyZXMgfSA9IGZlYXR1cmVzXG5cbnsgYmFzZUZpbGVOYW1lLCBpc0NvZmZlZSwgc3RyaW5naWZ5LCBtZXJnZSwgcGFkIH0gPSBoZWxwZXJzXG5cbmVycm9yICAgICA9IGNvbnNvbGUuZXJyb3JcbnByaW50ICAgICA9IChsaW5lKSAtPiBwcm9jZXNzLnN0ZG91dC53cml0ZSBsaW5lXG5wcmludExpbmUgPSAobGluZSkgLT4gcHJvY2Vzcy5zdGRvdXQud3JpdGUgbGluZSArICdcXG4nICMgPz8/XG5wcmludFdhcm4gPSAobGluZSkgLT4gcHJvY2Vzcy5zdGRlcnIud3JpdGUgbGluZSArICdcXG4nICMgPz8/XG5oaWRkZW4gICAgPSAoZmlsZSkgLT4gL15cXC58fiQvLnRlc3QgZmlsZVxuXG5TV0lUQ0hFUyA9IFtcbiAgICBbJy1iJyAnLS1iYXJlJyAgICAgICAgICAgICAgJ2NvbXBpbGUgd2l0aG91dCBhIHRvcC1sZXZlbCBmdW5jdGlvbiB3cmFwcGVyJyAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctYycgJy0tY29tcGlsZScgICAgICAgICAgICdjb21waWxlIHRvIEphdmFTY3JpcHQgYW5kIHNhdmUgYXMgLmpzIGZpbGVzJyAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLWQnICctLWRvYycgICAgICAgICAgICAgICAnbG9nIHRoZSDilrhkb2Mgc2VjdGlvbnMnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLWUnICctLWV2YWwgU1RSSU5HJyAgICAgICAnZXZhbHVhdGUgYSBzdHJpbmcgYW5kIHByaW50IHRoZSByZXN1bHQnICAgICAgICAgICAgICAgW1N0cmluZywgQXJyYXldIF1cbiAgICBbJy1mJyAnLS1mZWF0dXJlcycgICAgICAgICAgJ2xpc3QgYXZhaWxhYmxlIGZlYXR1cmVzJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWycnICAgJy0tbm8tYGZlYXR1cmUnICAgICAgICdkaXNhYmxlIGEgZmVhdHVyZSwgZS5nLiAtLW5vLW5lZ2F0aXZlLWluZGV4JyAgICAgICAgICAgbnVsbCAgICAgICAgICAgXVxuICAgIFsnLWgnICctLWhlbHAnICAgICAgICAgICAgICAnZGlzcGxheSB0aGlzIGhlbHAgbWVzc2FnZScgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1qJyAnLS1qcycgICAgICAgICAgICAgICAgJ3ByaW50IHRoZSBjb21waWxlZCBKYXZhU2NyaXB0JyAgICAgICAgICAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctbScgJy0tbWFwJyAgICAgICAgICAgICAgICdnZW5lcmF0ZSBzb3VyY2UgbWFwIGFuZCBzYXZlIGFzIC5qcy5tYXAgZmlsZXMnICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLU0nICctLWlubGluZS1tYXAnICAgICAgICAnZ2VuZXJhdGUgc291cmNlIG1hcCBhbmQgaW5jbHVkZSBpdCBkaXJlY3RseSBpbiBvdXRwdXQnIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJycgICAnLS1tZXRhbG9nJyAgICAgICAgICAgJ21ldGEgbG9nIChkZWZhdWx0OiBjb25zb2xlLmxvZyknICAgICAgICAgICAgICAgICAgICAgICBTdHJpbmcgICAgICAgICBdXG4gICAgWyctbicgJy0tbm9vcCcgICAgICAgICAgICAgICdkb2VzIG5vdGhpbmcsIGZvciBkZWJ1Z2dpbmcgcHVycG9zZXMnICAgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLW8nICctLW91dHB1dCBESVInICAgICAgICAnc2V0IHRoZSBvdXRwdXQgZGlyZWN0b3J5IGZvciBjb21waWxlZCBKYXZhU2NyaXB0JyAgICAgIFN0cmluZyAgICAgICAgIF1cbiAgICBbJy1yJyAnLS1yZXF1aXJlIE1PRFVMRScgICAgJ3JlcXVpcmUgdGhlIGdpdmVuIG1vZHVsZSBiZWZvcmUgZXZhbCBvciBSRVBMJyAgICAgICAgIFtTdHJpbmcsIEFycmF5XSBdXG4gICAgWyctQycgJy0tY29mZmVlJyAgICAgICAgICAgICdwcmludCB0aGUgdG9rZW4gc3RyZWFtIGFzIENvZmZlZVNjcmlwdCcgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLXMnICctLXN0ZGlvJyAgICAgICAgICAgICAnbGlzdGVuIGZvciBhbmQgY29tcGlsZSBzY3JpcHRzIG92ZXIgc3RkaW8nICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy10JyAnLS10ZXN0JyAgICAgICAgICAgICAgJ2NvbXBpbGUgYW5kIHJ1biB0aGUgQHRlc3QgY29kZScgICAgICAgICAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctVCcgJy0tdG9rZW5zJyAgICAgICAgICAgICdwcmludCB0aGUgdG9rZW5zJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLUYnICctLWZyYWdtZW50cycgICAgICAgICAncHJpbnQgdGhlIGZyYWdtZW50cycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1QJyAnLS1wYXJzZScgICAgICAgICAgICAgJ3ByaW50IHRoZSBwYXJzZSB0cmVlJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctdicgJy0tdmVyc2lvbicgICAgICAgICAgICdkaXNwbGF5IHRoZSB2ZXJzaW9uIG51bWJlcicgICAgICAgICAgICAgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLXcnICctLXdhdGNoJyAgICAgICAgICAgICAnd2F0Y2ggc2NyaXB0cyBmb3IgY2hhbmdlcyBhbmQgcmVydW4gY29tbWFuZHMnICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbl1cblxub3B0cyA9IHt9XG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgIFxuIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgXG5cbnBhcnNlT3B0aW9ucyA9IC0+XG5cbiAgICBrbm93biA9IERlYnVnOkJvb2xlYW5cbiAgICBzaG9ydCA9IEQ6Jy0tRGVidWcnIHA6Jy0tanMnXG4gICAgU1dJVENIRVMubWFwIChzKSAtPiBsID0gc1sxXS5zcGxpdCgnICcpWzBdWzIuLl07IGtub3duW2xdID0gc1szXSBpZiBzWzNdOyBzaG9ydFtzWzBdWzFdXSA9IFwiLS0je2x9XCIgaWYgc1swXSE9JydcbiAgICBGRUFUVVJFUy5tYXAgKGYpIC0+IGtub3duW2YubGFnXSA9IEJvb2xlYW5cbiAgICBcbiAgICBvID0gb3B0cyA9IG5vcHQga25vd24sIHNob3J0XG4gICAgICAgIFxuICAgIG8uY29tcGlsZSAgb3I9ICEhby5vdXRwdXRcbiAgICBvLmFyZ3VtZW50cyAgPSBvLmFyZ3YucmVtYWluXG4gICAgby5wcmVsdWRlICAgID0gbWFrZVByZWx1ZGUgby5yZXF1aXJlIGlmIG8ucmVxdWlyZVxuICAgIG8ucnVuICAgICAgICA9IG5vdCAoby5jb21waWxlIG9yIG8uanMgb3Igby5tYXAgb3Igby50b2tlbnMgb3Igby5wYXJzZSlcbiAgICBvLmpzICAgICAgICAgPSAhIShvLmpzIG9yIG8uZXZhbCBvciBvLnN0ZGlvIGFuZCBvLmNvbXBpbGUpICMganMgb3V0cHV0IGlzIHBhc3NlZCB0byBldmFsIGFuZCBzdGRpbyBjb21waWxlXG4gICAgXG4gICAgby5zb3VyY2VNYXAgID0gby5tYXBcbiAgICBvLmlubGluZU1hcCAgPSBvWydpbmxpbmUtbWFwJ11cbiAgICAjIG8uZ2VuZXJhdGVkRmlsZSA9IG8ub3V0cHV0XG4gICAgXG4gICAgby5mZWF0dXJlID0ge31cbiAgICBGRUFUVVJFUy5tYXAgKGYpIC0+IG8uZmVhdHVyZVtmLmtleV0gPSBvW2YuZmxhZ10gPyB0cnVlOyBkZWxldGUgb1tmLmZsYWddXG4gICAgXG4gICAgaWYgby5EZWJ1Z1xuICAgICAgICBkZWxldGUgby5hcmd2XG4gICAgICAgIGxvZyBzdHJpbmdpZnkgb1xuXG4jIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiMgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcblxucnVuID0gLT5cbiAgICBcbiAgICBwYXJzZU9wdGlvbnMoKVxuICAgIFxuICAgIGlmIG9wdHMuZmVhdHVyZS5jb2xvciA9PSBmYWxzZVxuICAgICAgICBoZWxwZXJzLmNvbG9ycyBmYWxzZVxuICAgICAgICBcbiAgICByZXR1cm4gbG9nRmVhdHVyZXMoKSAgaWYgb3B0cy5mZWF0dXJlc1xuICAgIHJldHVybiB1c2FnZSgpICAgICAgICBpZiBvcHRzLmhlbHBcbiAgICByZXR1cm4gdmVyc2lvbigpICAgICAgaWYgb3B0cy52ZXJzaW9uXG4gICAgcmV0dXJuIHN0YXJ0UmVwbCgpICAgIGlmIG9wdHMuaW50ZXJhY3RpdmVcbiAgICByZXR1cm4gY29tcGlsZVN0ZGlvKCkgaWYgb3B0cy5zdGRpb1xuICAgIGlmIG9wdHMuZXZhbFxuICAgICAgICBmb3IgZXZhbCBpbiBvcHRzLmV2YWxcbiAgICAgICAgICAgIGNvbXBpbGVTY3JpcHQgZXZhbFxuICAgICAgICByZXR1cm5cbiAgICByZXR1cm4gc3RhcnRSZXBsKCkgICAgaWYgbm90IG9wdHMuYXJndW1lbnRzLmxlbmd0aFxuICAgIFxuICAgIGxpdGVyYWxzID0gaWYgbm90IG9wdHMud2F0Y2ggYW5kIG5vdCBvcHRzLmNvbXBpbGUgdGhlbiBvcHRzLmFyZ3VtZW50cy5zcGxpY2UgMSBlbHNlIFtdXG4gICAgXG4gICAgcHJvY2Vzcy5hcmd2ID0gcHJvY2Vzcy5hcmd2WzAuLjFdLmNvbmNhdCBsaXRlcmFsc1xuICAgIHByb2Nlc3MuYXJndlswXSA9ICdrb2ZmZWUnXG5cbiAgICBvcHRzLm91dHB1dCA9IHNsYXNoLnJlc29sdmUgb3B0cy5vdXRwdXQgaWYgb3B0cy5vdXRwdXRcbiAgICBmb3Igc291cmNlIGluIG9wdHMuYXJndW1lbnRzXG4gICAgICAgIHNvdXJjZSA9IHNsYXNoLnJlc29sdmUgc291cmNlXG4gICAgICAgIFxuICAgICAgICBpZiBvcHRzLndhdGNoXG4gICAgICAgICAgICB3YXRjaFBhdGggc291cmNlXG4gICAgICAgIGVsc2UgICAgIFxuICAgICAgICAgICAgY29tcGlsZVBhdGggc291cmNlOnNvdXJjZSwgdG9wTGV2ZWw6eWVzXG5cbmV4cG9ydHMucnVuID0gcnVuXG4gICAgICAgIFxuc3RhcnRSZXBsID0gLT5cbiAgICBcbiAgICAjIE1ha2UgdGhlIFJFUEwgdXNlIHRoZSBnbG9iYWwgY29udGV4dCBzbyBhcyB0byBcbiAgICAjICAgKGEpIGJlIGNvbnNpc3RlbnQgd2l0aCB0aGUgYG5vZGVgIFJFUEwgYW5kLCB0aGVyZWZvcmUsIFxuICAgICMgICAoYikgbWFrZSBwYWNrYWdlcyB0aGF0IG1vZGlmeSBuYXRpdmUgcHJvdG90eXBlcyAoc3VjaCBhcyAnY29sb3JzJyBhbmQgJ3N1Z2FyJykgd29yayBhcyBleHBlY3RlZC5cbiAgICBcbiAgICByZXBsQ2xpT3B0cyA9IHVzZUdsb2JhbDogeWVzXG4gICAgcmVwbENsaU9wdHMucHJlbHVkZSA9IG9wdHMucHJlbHVkZVxuICAgIHJlcXVpcmUoJy4vcmVwbCcpLnN0YXJ0IHJlcGxDbGlPcHRzXG5cbm1ha2VQcmVsdWRlID0gKHJlcXVpcmVzKSAtPlxuICAgIFxuICAgIHJlcXVpcmVzLm1hcCAobW9kdWxlKSAtPlxuICAgICAgICBbXywgbmFtZSwgbW9kdWxlXSA9IG1hdGNoIGlmIG1hdGNoID0gbW9kdWxlLm1hdGNoKC9eKC4qKT0oLiopJC8pXG4gICAgICAgIG5hbWUgfHw9IGJhc2VGaWxlTmFtZSBtb2R1bGUsIHllcywgdXNlV2luUGF0aFNlcFxuICAgICAgICBcIiN7bmFtZX0gPSByZXF1aXJlKCcje21vZHVsZX0nKVwiXG4gICAgLmpvaW4gJzsnXG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG5cbiMgQ29tcGlsZSBhIHNjcmlwdCBvciBhIGRpcmVjdG9yeS4gSWYgYSBkaXJlY3RvcnkgaXMgcGFzc2VkLCByZWN1cnNpdmVseSBjb21waWxlIGFsbCAnLmNvZmZlZScgYW5kICcua29mZmVlJyBmaWxlcy5cblxuY29tcGlsZVBhdGggPSAoc291cmNlOiwgdG9wTGV2ZWw6bm8pIC0+XG5cbiAgICByZXR1cm4gaWYgbm90IHRvcExldmVsIGFuZCBoaWRkZW4gc291cmNlXG4gICAgICAgICAgICAgIFxuICAgIHRyeVxuICAgICAgICBzdGF0cyA9IGZzLnN0YXRTeW5jIHNvdXJjZVxuICAgIGNhdGNoIGVyclxuICAgICAgICBpZiBlcnIuY29kZSBpcyAnRU5PRU5UJ1xuICAgICAgICAgICAgZXJyb3IgXCJDb21tYW5kLmNvbXBpbGVQYXRoIGNhbid0IHN0YXQgJyN7c291cmNlfSdcIlxuICAgICAgICAgICAgcHJvY2Vzcy5leGl0IDFcbiAgICAgICAgdGhyb3cgZXJyXG4gICAgICAgIFxuICAgIGlmIHN0YXRzLmlzRGlyZWN0b3J5KClcbiAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLmJhc2VuYW1lKHNvdXJjZSkgaW4gWydub2RlX21vZHVsZXMnICcuZ2l0J11cbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgXG4gICAgICAgIGlmIG9wdHMucnVuXG4gICAgICAgICAgICBjb21waWxlUGF0aCBzb3VyY2U6ZmluZERpcmVjdG9yeUluZGV4KHNvdXJjZSksIHRvcExldmVsOnRvcExldmVsXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICAgXG4gICAgICAgIGxvZyAnQ29tbWFuZC5jb21waWxlUGF0aCBkaXI6Jywgc291cmNlIGlmIG9wdHMuRGVidWdcbiAgICAgICAgXG4gICAgICAgIHRyeVxuICAgICAgICAgICAgZmlsZXMgPSBmcy5yZWFkZGlyU3luYyBzb3VyY2VcbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICBpZiBlcnIuY29kZSBpcyAnRU5PRU5UJyB0aGVuIHJldHVybiBcbiAgICAgICAgICAgIHRocm93IGVyclxuICAgICAgICAgICAgXG4gICAgICAgIGZvciBmaWxlIGluIGZpbGVzXG4gICAgICAgICAgICBjb21waWxlUGF0aCBzb3VyY2U6c2xhc2guam9pbiBzb3VyY2UsIGZpbGVcbiAgICAgICAgICAgIFxuICAgIGVsc2UgaWYgdG9wTGV2ZWwgb3IgaXNDb2ZmZWUgc291cmNlXG4gICAgICAgIFxuICAgICAgICB0cnlcbiAgICAgICAgICAgIGNvZGUgPSBmcy5yZWFkRmlsZVN5bmMgc291cmNlXG4gICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgaWYgZXJyLmNvZGUgaXMgJ0VOT0VOVCcgdGhlbiByZXR1cm5cbiAgICAgICAgICAgIHRocm93IGVyclxuICAgICAgICBcbiAgICAgICAgbG9nICdDb21tYW5kLmNvbXBpbGVQYXRoIGZpbGU6Jywgc291cmNlIGlmIG9wdHMuRGVidWdcbiAgICAgICAgICAgIFxuICAgICAgICBjb21waWxlU2NyaXB0IGNvZGUudG9TdHJpbmcoKSwgc291cmNlXG4gICAgICAgIFxuZmluZERpcmVjdG9yeUluZGV4ID0gKHNvdXJjZSkgLT5cblxuICAgIGZvciBleHQgaW4gS29mZmVlLkZJTEVfRVhURU5TSU9OU1xuICAgICAgICBpbmRleCA9IHNsYXNoLmpvaW4gc291cmNlLCBcImluZGV4I3tleHR9XCJcbiAgICAgICAgdHJ5XG4gICAgICAgICAgICByZXR1cm4gaW5kZXggaWYgKGZzLnN0YXRTeW5jIGluZGV4KS5pc0ZpbGUoKVxuICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgIHRocm93IGVyciB1bmxlc3MgZXJyLmNvZGUgaXMgJ0VOT0VOVCdcbiAgICBlcnJvciBcIk1pc3NpbmcgaW5kZXguY29mZmVlIGluICN7c291cmNlfVwiXG4gICAgcHJvY2Vzcy5leGl0IDFcblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAgICAgICAwMDAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgICAwMDAgICAgIFxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgICAwMDAgICAgIFxuXG4jIENvbXBpbGUgYSBzaW5nbGUgc291cmNlIHNjcmlwdCwgY29udGFpbmluZyB0aGUgZ2l2ZW4gY29kZSwgYWNjb3JkaW5nIHRvIHRoZSByZXF1ZXN0ZWQgb3B0aW9ucy4gXG4jIElmIGV2YWx1YXRpbmcgdGhlIHNjcmlwdCBkaXJlY3RseSBzZXRzIGBfX2ZpbGVuYW1lYCwgYF9fZGlybmFtZWAgYW5kIGBtb2R1bGUuZmlsZW5hbWVgIHRvIGJlIGNvcnJlY3QgcmVsYXRpdmUgdG8gdGhlIHNjcmlwdCdzIHNsYXNoLlxuXG5jb21waWxlU2NyaXB0ID0gKGNvZGUsIHNvdXJjZT1udWxsKSAtPlxuICAgIFxuICAgIG8gPSBvcHRzXG4gICAgb3B0aW9ucyA9IEtvZmZlZS5jb21waWxlT3B0aW9ucyBzb3VyY2UsIG9wdHNcbiAgICBcbiAgICB0cnlcbiAgICAgICAgdCA9IHRhc2sgPSB7c291cmNlLCBjb2RlLCBvcHRpb25zfVxuICAgICAgICBcbiAgICAgICAgaWYgby50b2tlbnNcbiAgICAgICAgICAgIHByaW50VG9rZW5zIEtvZmZlZS50b2tlbnMgdC5jb2RlLCB0Lm9wdGlvbnNcbiAgICAgICAgZWxzZSBpZiBvLmZyYWdtZW50c1xuICAgICAgICAgICAgcHJpbnRGcmFnbWVudHMgY29kZSwgS29mZmVlLmZyYWdtZW50cyB0LmNvZGUsIHQub3B0aW9uc1xuICAgICAgICBlbHNlIGlmIG8uY29mZmVlXG4gICAgICAgICAgICBwcmludFJld3JpdGVyIEtvZmZlZS50b2tlbnMgdC5jb2RlLCB0Lm9wdGlvbnNcbiAgICAgICAgZWxzZSBpZiBvLnBhcnNlXG4gICAgICAgICAgICBwcmludExpbmUgS29mZmVlLm5vZGVzKHQuY29kZSwgdC5vcHRpb25zKS50b1N0cmluZygpLnRyaW0oKVxuICAgICAgICBlbHNlIGlmIG8ucnVuXG4gICAgICAgICAgICBLb2ZmZWUucmVnaXN0ZXIoKVxuICAgICAgICAgICAgS29mZmVlLmV2YWwgb3B0cy5wcmVsdWRlLCB0Lm9wdGlvbnMgaWYgb3B0cy5wcmVsdWRlXG4gICAgICAgICAgICB0Lm9wdGlvbnMuZmlsZW5hbWUgPz0gb3B0aW9ucy5zb3VyY2VcbiAgICAgICAgICAgIGlmIG9wdHMubm9vcCBcbiAgICAgICAgICAgICAgICBsb2cgXCJub29wIHJ1biAje3NvdXJjZX1cIlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEtvZmZlZS5ydW4gdC5jb2RlLCB0Lm9wdGlvbnNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgY29tcGlsZWQgPSBLb2ZmZWUuY29tcGlsZSB0LmNvZGUsIHQub3B0aW9uc1xuICAgICAgICAgICAgdC5vdXRwdXQgPSBjb21waWxlZFxuICAgICAgICAgICAgaWYgby5tYXBcbiAgICAgICAgICAgICAgICB0Lm91dHB1dCA9IGNvbXBpbGVkLmpzXG4gICAgICAgICAgICAgICAgdC5zb3VyY2VNYXAgPSBjb21waWxlZC52M1NvdXJjZU1hcFxuXG4gICAgICAgICAgICBpZiBvLmpzXG4gICAgICAgICAgICAgICAgaWYgb3B0cy5ub29wIHRoZW4gbG9nIFwibm9vcCBqcyAje3NvdXJjZX1cIlxuICAgICAgICAgICAgICAgIGVsc2UgXG4gICAgICAgICAgICAgICAgICAgIHByaW50TGluZSB0Lm91dHB1dC50cmltKClcbiAgICAgICAgICAgIGVsc2UgaWYgby5jb21waWxlIG9yIG8ubWFwXG4gICAgICAgICAgICAgICAgaWYgb3B0cy5ub29wIHRoZW4gbG9nIFwibm9vcCB3cml0ZSAje29wdGlvbnMuanNQYXRofVwiXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBqc1BhdGggPSBvcHRpb25zLmpzUGF0aFxuICAgICAgICAgICAgICAgICAgICBpZiBvLm91dHB1dFxuICAgICAgICAgICAgICAgICAgICAgICAganNQYXRoID0gb3V0cHV0UGF0aCB0LnNvdXJjZSwgJy5qcydcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVKcyB0LnNvdXJjZSwgdC5vdXRwdXQsIGpzUGF0aCwgdC5zb3VyY2VNYXBcbiAgICBjYXRjaCBlcnJcbiAgICAgICAgXG4gICAgICAgIG1lc3NhZ2UgPSBlcnIubWVzc2FnZVxuICAgICAgICBcbiAgICAgICAgaWYgZXJyIGluc3RhbmNlb2YgU3ludGF4RXJyb3JcbiAgICAgICAgICAgIHByaW50TGluZSBtZXNzYWdlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHByaW50TGluZSBlcnIuc3RhY2tcbiAgICAgICAgXG4gICAgICAgIGlmIG8ud2F0Y2ggb3Igby5ldmFsXG4gICAgICAgICAgICBwcmludCAnXFx4MDcnICMgYmVsbFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQgMVxuICAgICAgICAgICAgXG4jIEF0dGFjaCB0aGUgYXBwcm9wcmlhdGUgbGlzdGVuZXJzIHRvIGNvbXBpbGUgc2NyaXB0cyBpbmNvbWluZyBvdmVyICoqc3RkaW4qKiwgYW5kIHdyaXRlIHRoZW0gYmFjayB0byAqKnN0ZG91dCoqLlxuXG5jb21waWxlU3RkaW8gPSAtPlxuICAgIFxuICAgIGJ1ZmZlcnMgPSBbXVxuICAgIHN0ZGluID0gcHJvY2Vzcy5vcGVuU3RkaW4oKVxuICAgIHN0ZGluLm9uICdkYXRhJywgKGJ1ZmZlcikgLT4gYnVmZmVycy5wdXNoIGJ1ZmZlciBpZiBidWZmZXJcbiAgICBzdGRpbi5vbiAnZW5kJywgLT4gY29tcGlsZVNjcmlwdCBCdWZmZXIuY29uY2F0KGJ1ZmZlcnMpLnRvU3RyaW5nKClcblxuIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbiMgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAwMDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAgICAgIDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG5cbndhdGNoUGF0aCA9IChzb3VyY2UpIC0+ICMgV2F0Y2ggYSBmaWxlIG9yIGRpcmVjdG9yeS5cbiAgICBcbiAgICB0cnlcbiAgICAgICAgc3RhdHMgPSBmcy5zdGF0U3luYyBzb3VyY2VcbiAgICBjYXRjaCBlcnJcbiAgICAgICAgcmV0dXJuIGlmIGVyci5jb2RlIGlzICdFTk9FTlQnXG4gICAgICAgIHJldHVybiBlcnJvciBcIkNvbW1hbmQud2F0Y2hQYXRoIGNhbid0IHN0YXQgJyN7c291cmNlfSdcIiwgZXJyXG4gICAgICAgICAgICAgICAgXG4gICAgaWYgc3RhdHMuaXNEaXJlY3RvcnkoKVxuICAgICAgICB3YXRjaERpciBzb3VyY2VcbiAgICBlbHNlXG4gICAgICAgIHdhdGNoRmlsZSBzb3VyY2VcblxuIyBXYXRjaCBhIHNpbmdsZSBmaWxlIHVzaW5nIGBmcy53YXRjaGAsIHJlY29tcGlsaW5nIGl0IGV2ZXJ5IHRpbWUgdGhlIGZpbGUgaXMgdXBkYXRlZC5cbiMgTWF5IGJlIHVzZWQgaW4gY29tYmluYXRpb24gd2l0aCBvdGhlciBvcHRpb25zLCBzdWNoIGFzIGAtLXByaW50YC5cbiAgICAgICAgXG53YXRjaEZpbGUgPSAoc291cmNlKSAtPlxuICAgIFxuICAgIHJldHVybiBpZiBub3QgaXNDb2ZmZWUgc291cmNlXG4gICAgXG4gICAgbG9nICdDb21tYW5kLndhdGNoRmlsZScsIHNvdXJjZSBpZiBvcHRzLkRlYnVnXG4gICAgXG4gICAgd2F0Y2hlciAgICAgICAgPSBudWxsXG4gICAgcHJldlN0YXRzICAgICAgPSBudWxsXG4gICAgY29tcGlsZVRpbWVvdXQgPSBudWxsXG5cbiAgICBzdGFydFdhdGNoZXIgPSAtPlxuICAgICAgICBcbiAgICAgICAgd2F0Y2hlciA9IGZzLndhdGNoIHNvdXJjZVxuICAgICAgICAub24gJ2NoYW5nZScsIChjaGFuZ2UpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBpZiBjaGFuZ2UgIT0gJ2NoYW5nZSdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbG9nICdDb21tYW5kLndhdGNoRmlsZScsIGNoYW5nZSwgc291cmNlIGlmIG9wdHMuRGVidWdcblxuICAgICAgICAgICAgY2xlYXJUaW1lb3V0IGNvbXBpbGVUaW1lb3V0XG4gICAgICAgICAgICBjb21waWxlVGltZW91dCA9IHdhaXQgMjUsIC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZnMuc3RhdCBzb3VyY2UsIChlcnIsIHN0YXRzKSAtPlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gd2F0Y2hlci5jbG9zZSgpIGlmIGVycj8uY29kZSBpcyAnRU5PRU5UJ1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXJyb3IgZXJyIGlmIGVyclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaWYgcHJldlN0YXRzIGFuZCBzdGF0cy5tdGltZS5nZXRUaW1lKCkgaXMgcHJldlN0YXRzLm10aW1lLmdldFRpbWUoKSBhbmQgc3RhdHMuc2l6ZSBpcyBwcmV2U3RhdHMuc2l6ZVxuICAgICAgICAgICAgICAgICAgICBwcmV2U3RhdHMgPSBzdGF0c1xuICAgICAgICAgICAgICAgICAgICBmcy5yZWFkRmlsZSBzb3VyY2UsIChlcnIsIGNvZGUpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXJyb3IgZXJyIGlmIGVyclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9nICdDb21tYW5kLndhdGNoRmlsZSBjb21waWxlJywgc291cmNlIGlmIG9wdHMuRGVidWdcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBpbGVTY3JpcHQgY29kZS50b1N0cmluZygpLCBzb3VyY2VcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAub24gJ2Vycm9yJywgKGVycikgLT5cbiAgICAgICAgICAgIHRocm93IGVyciB1bmxlc3MgZXJyLmNvZGUgaXMgJ0VQRVJNJ1xuXG4gICAgdHJ5XG4gICAgICAgIHN0YXJ0V2F0Y2hlcigpXG4gICAgY2F0Y2ggZXJyXG4gICAgICAgIGVycm9yIGVyclxuXG53YXRjaERpciA9IChzb3VyY2UpIC0+XG4gICAgXG4gICAgbG9nICdDb21tYW5kLndhdGNoRGlyJywgc291cmNlIGlmIG9wdHMuRGVidWdcbiAgICBcbiAgICB3YXRjaGVyID0gbnVsbFxuXG4gICAgc3RhcnRXYXRjaGVyID0gLT5cblxuICAgICAgICB0cnlcbiAgICAgICAgICAgIGZpbGVzID0gZnMucmVhZGRpclN5bmMgc291cmNlXG4gICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgcmV0dXJuIGlmIGVycj8uY29kZSBpcyAnRU5PRU5UJ1xuICAgICAgICAgICAgdGhyb3cgZXJyXG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIGZpbGUgaW4gZmlsZXNcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIGZpbGVbMF0gPT0gJy4nXG4gICAgICAgICAgICBjb250aW51ZSBpZiBmaWxlIGluIFsnbm9kZV9tb2R1bGVzJ11cbiAgICAgICAgICAgIHdhdGNoUGF0aCBzbGFzaC5qb2luIHNvdXJjZSwgZmlsZVxuICAgICAgICBcbiAgICAgICAgd2F0Y2hlciA9IGZzLndhdGNoIHNvdXJjZVxuICAgICAgICAub24gJ2Vycm9yJywgKGVycikgLT5cbiAgICAgICAgICAgIHRocm93IGVyciB1bmxlc3MgZXJyLmNvZGUgaXMgJ0VQRVJNJ1xuICAgICAgICAgICAgd2F0Y2hlci5jbG9zZSgpXG4gICAgICAgIC5vbiAnY2hhbmdlJywgKGNoYW5nZSwgcCkgLT5cbiAgICAgICAgICAgIGlmIGNoYW5nZSA9PSAncmVuYW1lJ1xuICAgICAgICAgICAgICAgIGxvZyAnQ29tbWFuZC53YXRjaERpcicsIGNoYW5nZSwgc2xhc2guam9pbiBzb3VyY2UsIHAgaWYgb3B0cy5EZWJ1Z1xuICAgICAgICAgICAgICAgIHdhdGNoUGF0aCBzbGFzaC5qb2luIHNvdXJjZSwgcFxuICAgICAgICAgICAgXG4gICAgdHJ5XG4gICAgICAgIHN0YXJ0V2F0Y2hlcigpXG4gICAgY2F0Y2ggZXJyXG4gICAgICAgIHJldHVybiBpZiBlcnIuY29kZSBpcyAnRU5PRU5UJ1xuICAgICAgICB0aHJvdyBlcnJcblxuIyBHZXQgdGhlIGNvcnJlc3BvbmRpbmcgb3V0cHV0IEphdmFTY3JpcHQgcGF0aCBmb3IgYSBzb3VyY2UgZmlsZS5cbiAgICBcbm91dHB1dFBhdGggPSAoc291cmNlLCBleHRlbnNpb24pIC0+XG4gICAgXG4gICAgYmFzZW5hbWUgPSBiYXNlRmlsZU5hbWUgc291cmNlLCB5ZXMsIHVzZVdpblBhdGhTZXBcbiAgICBpZiBvcHRzLm91dHB1dFxuICAgICAgICBkaXIgPSBvcHRzLm91dHB1dFxuICAgIGVsc2VcbiAgICAgICAgZGlyID0gc2xhc2guZGlybmFtZSBzb3VyY2VcbiAgICBzbGFzaC5qb2luIGRpciwgYmFzZW5hbWUgKyBleHRlbnNpb25cblxuIyBSZWN1cnNpdmVseSBta2RpciwgbGlrZSBgbWtkaXIgLXBgLlxuXG5ta2RpcnAgPSAoZGlyLCBmbikgLT5cbiAgICBtb2RlID0gMG83NzcgJiB+cHJvY2Vzcy51bWFzaygpXG5cbiAgICBkbyBta2RpcnMgPSAocCA9IGRpciwgZm4pIC0+XG4gICAgICAgIGZzLmV4aXN0cyBwLCAoZXhpc3RzKSAtPlxuICAgICAgICAgICAgaWYgZXhpc3RzXG4gICAgICAgICAgICAgICAgZm4oKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIG1rZGlycyBzbGFzaC5kaXJuYW1lKHApLCAtPlxuICAgICAgICAgICAgICAgICAgICBmcy5ta2RpciBwLCBtb2RlLCAoZXJyKSAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZuIGVyciBpZiBlcnJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZuKClcblxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgICAgICAwMDAgICAwMDAwMDAwICBcbiMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgICAgICAgMDAwICAwMDAgICAgICAgXG4jIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgICAgIDAwMCAgMDAwMDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICBcbiMgMDAgICAgIDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG5cbiMgV3JpdGUgb3V0IGEgSmF2YVNjcmlwdCBzb3VyY2UgZmlsZSB3aXRoIHRoZSBjb21waWxlZCBjb2RlLiBcbiMgQnkgZGVmYXVsdCwgZmlsZXMgYXJlIHdyaXR0ZW4gb3V0IGluIGBjd2RgIGFzIGAuanNgIGZpbGVzIHdpdGggdGhlIHNhbWUgbmFtZSwgYnV0IHRoZSBvdXRwdXQgZGlyZWN0b3J5IGNhbiBiZSBjdXN0b21pemVkIHdpdGggYC0tb3V0cHV0YC5cbiMgSWYgYGdlbmVyYXRlZFNvdXJjZU1hcGAgaXMgcHJvdmlkZWQsIHRoaXMgd2lsbCB3cml0ZSBhIGAuanMubWFwYCBmaWxlIGludG8gdGhlIHNhbWUgZGlyZWN0b3J5IGFzIHRoZSBgLmpzYCBmaWxlLlxuXG53cml0ZUpzID0gKHNvdXJjZSwganMsIGpzUGF0aCwgZ2VuZXJhdGVkU291cmNlTWFwID0gbnVsbCkgLT5cbiAgICAjIGxvZyBzb3VyY2UsIGpzUGF0aFxuICAgIHNvdXJjZU1hcFBhdGggPSBvdXRwdXRQYXRoIHNvdXJjZSwgJy5qcy5tYXAnXG4gICAganNEaXIgPSBzbGFzaC5kaXJuYW1lIGpzUGF0aFxuICAgIGNvbXBpbGUgPSAtPlxuICAgICAgICBpZiBvcHRzLmNvbXBpbGVcbiAgICAgICAgICAgIGpzID0gJyAnIGlmIGpzLmxlbmd0aCA8PSAwXG4gICAgICAgICAgICBpZiBnZW5lcmF0ZWRTb3VyY2VNYXAgdGhlbiBqcyA9IFwiI3tqc31cXG4vLyMgc291cmNlTWFwcGluZ1VSTD0je2Jhc2VGaWxlTmFtZSBzb3VyY2VNYXBQYXRoLCBubywgdXNlV2luUGF0aFNlcH1cXG5cIlxuICAgICAgICAgICAgZnMud3JpdGVGaWxlIGpzUGF0aCwganMsIChlcnIpIC0+XG4gICAgICAgICAgICAgICAgaWYgZXJyXG4gICAgICAgICAgICAgICAgICAgIHByaW50TGluZSBlcnIubWVzc2FnZVxuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQgMVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgb3B0cy5jb21waWxlIGFuZCBvcHRzLndhdGNoXG4gICAgICAgICAgICAgICAgICAgIHRpbWVMb2cgXCJjb21waWxlZCAje3NvdXJjZX1cIlxuICAgICAgICBpZiBnZW5lcmF0ZWRTb3VyY2VNYXBcbiAgICAgICAgICAgIGZzLndyaXRlRmlsZSBzb3VyY2VNYXBQYXRoLCBnZW5lcmF0ZWRTb3VyY2VNYXAsIChlcnIpIC0+XG4gICAgICAgICAgICAgICAgaWYgZXJyXG4gICAgICAgICAgICAgICAgICAgIHByaW50TGluZSBcIkNvdWxkIG5vdCB3cml0ZSBzb3VyY2UgbWFwOiAje2Vyci5tZXNzYWdlfVwiXG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCAxXG4gICAgZnMuZXhpc3RzIGpzRGlyLCAoaXRFeGlzdHMpIC0+XG4gICAgICAgIGlmIGl0RXhpc3RzIHRoZW4gY29tcGlsZSgpIGVsc2UgbWtkaXJwIGpzRGlyLCBjb21waWxlXG5cbndhaXQgPSAobWlsbGlzZWNvbmRzLCBmdW5jKSAtPiBzZXRUaW1lb3V0IGZ1bmMsIG1pbGxpc2Vjb25kcyAjIENvbnZlbmllbmNlIGZvciBjbGVhbmVyIHNldFRpbWVvdXRzLlxuXG50aW1lTG9nID0gKG1lc3NhZ2UpIC0+IGxvZyBcIiN7KG5ldyBEYXRlKS50b0xvY2FsZVRpbWVTdHJpbmcoKX0gLSAje21lc3NhZ2V9XCJcblxuIyAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgICAgICBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAwICAgICAgIDAwMCAgXG4jICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcblxucHJpbnRUb2tlbnMgPSAodG9rZW5zKSAtPlxuXG4gICAgZm9yIGluZGV4IGluIFswLi4udG9rZW5zLmxlbmd0aF1cbiAgICAgICAgdG9rZW4gID0gdG9rZW5zW2luZGV4XVxuICAgICAgICB0YWcgICAgPSB0b2tlblswXVxuICAgICAgICB2YWx1ZSAgPSB0b2tlblsxXS50b1N0cmluZygpLnJlcGxhY2UoL1xcbi8sICdcXFxcbicpXG4gICAgICAgIGN0YWcgICA9IGdyYXkgdGFnXG4gICAgICAgIGN2YWx1ZSA9IGJvbGQgeWVsbG93IHZhbHVlXG4gICAgICAgIGluZGV4ICA9IGdyYXkgZGltIGluZGV4XG4gICAgICAgIGlmIHRhZyA9PSAnVEVSTUlOQVRPUidcbiAgICAgICAgICAgIHByaW50ICdcXG5cXG4nXG4gICAgICAgIGVsc2UgaWYgdGFnID09ICdJTkRFTlQnXG4gICAgICAgICAgICBwcmludCBncmF5IGRpbSAnSU5EICdcbiAgICAgICAgZWxzZSBpZiB0YWcgPT0gJ09VVERFTlQnXG4gICAgICAgICAgICBwcmludCBncmF5IGRpbSAnT1VUICdcbiAgICAgICAgZWxzZSBpZiB0YWcgaW4gWydDTEFTUycgJ1BBUkFNX1NUQVJUJyAnUEFSQU1fRU5EJyAnTlVMTCddXG4gICAgICAgICAgICBwcmludCBcIiN7aW5kZXh9I3tjdGFnfSBcIlxuICAgICAgICBlbHNlIGlmIHRhZyA9PSB2YWx1ZVxuICAgICAgICAgICAgcHJpbnQgXCIje2luZGV4fSN7Y3ZhbHVlfSBcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwcmludCBcIiN7aW5kZXh9I3tjdGFnfT0je2N2YWx1ZX0gXCJcblxuIyAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4jIDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAgICAwMDAgICAgICAgICAgMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG5cbnByaW50RnJhZ21lbnRzID0gKGNvZGUsIGZyYWdtZW50cykgLT5cblxuICAgIGxvZyBjb2RlLCBmcmFnbWVudHNcbiAgICBsb2cgJydcbiAgICBmb3IgaW5kZXggaW4gWzAuLi5mcmFnbWVudHMubGVuZ3RoXVxuICAgICAgICBmcmFnID0gZnJhZ21lbnRzW2luZGV4XVxuICAgICAgICBsaW5lID0gJydcbiAgICAgICAgY29sdW1uID0gJydcbiAgICAgICAgaWYgZnJhZy5sb2NhdGlvbkRhdGFcbiAgICAgICAgICAgIGxpbmUgPSBibHVlQnJpZ2h0ICcnK2ZyYWcubG9jYXRpb25EYXRhLmZpcnN0X2xpbmUgXG4gICAgICAgICAgICBpZiBmcmFnLmxvY2F0aW9uRGF0YS5sYXN0X2xpbmUgIT0gZnJhZy5sb2NhdGlvbkRhdGEuZmlyc3RfbGluZSBcbiAgICAgICAgICAgICAgICBsaW5lICs9IGRpbSBibHVlICctJytmcmFnLmxvY2F0aW9uRGF0YS5sYXN0X2xpbmVcbiAgICAgICAgICAgIGVsc2UgbGluZSArPSAnICAnXG4gICAgICAgICAgICBjb2x1bW4gPSBibHVlICcnK2ZyYWcubG9jYXRpb25EYXRhLmZpcnN0X2NvbHVtbiBcbiAgICAgICAgdHJpbW1lZCA9IGZyYWcuY29kZS5yZXBsYWNlKC8gL2csICcnKVxuICAgICAgICBpZiB0cmltbWVkLmxlbmd0aFxuICAgICAgICAgICAgaWYgdHJpbW1lZC5yZXBsYWNlKC9cXG4vZywgJycpLmxlbmd0aCA9PSAwXG4gICAgICAgICAgICAgICAgbG9nICcnXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgbG9nIGxpbmUgKyAnICcgKyBjb2x1bW4gKyAnICcgKyAgKGRpbSBncmF5IGhlbHBlcnMucGFkIGZyYWcudHlwZSwgMjApICsgeWVsbG93QnJpZ2h0KGZyYWcuY29kZSlcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgIyBtYXAgPSBLb2ZmZWUuY29tcGlsZSBjb2RlLCBcbiAgICAgICAgICAgICMgZmVhdHVyZTogaGVhZGVyOiB0cnVlXG4gICAgICAgICAgICAjIGZpbGVuYW1lOiAnZnJhZ21lbnRzJ1xuICAgICAgICAgICAgIyBzb3VyY2VNYXA6IHllc1xuICAgICAgICAgICAgIyAjIGlubGluZU1hcDogeWVzXG5cbiAgICAjIG1hcExpbmVUb1N0cmluZyA9IChtYXBsaW5lLCBrZXk9J3NvdXJjZUxpbmUnKSAtPlxuICAgICAgICAjIHMgPSAnJ1xuICAgICAgICAjIGZvciBjb2x1bW4gaW4gbWFwbGluZS5jb2x1bW5zXG4gICAgICAgICAgICAjIGlmIGNvbHVtblxuICAgICAgICAgICAgICAgICMgcyArPSBjb2x1bW5ba2V5XSUxMFxuICAgICAgICAgICAgIyBlbHNlXG4gICAgICAgICAgICAgICAgIyBzICs9ICcgJ1xuICAgICAgICAjIHNcbiMgICAgICAgICAgICAgXG4gICAgIyBsb2cgZ3JheSBkaW0gJyAxMjM0NTY3ODkgMTIzNDU2Nzg5IDEyMzQ1Njc4OSAxMjM0NTY3ODkgMTIzNDU2Nzg5J1xuICAgICMgY29kZUxpbmVzID0gY29kZS5zcGxpdCAnXFxuJ1xuICAgICMgZm9yIGkgaW4gWzAuLi5jb2RlTGluZXMubGVuZ3RoXVxuICAgICAgICAjIGlmIGNvZGVMaW5lc1tpXS50cmltKCkubGVuZ3RoXG4gICAgICAgICAgICAjIGxvZyBncmF5KGRpbSBpKzEpICsgZ3JlZW5CcmlnaHQgY29kZUxpbmVzW2ldXG4gICAgICAgICMgZWxzZSBsb2cgJydcbiMgICAgICAgICAgICAgXG4gICAgIyBsb2cgJydcbiAgICAjIGxvZyBncmF5IGRpbSAnIDEyMzQ1Njc4OSAxMjM0NTY3ODkgMTIzNDU2Nzg5IDEyMzQ1Njc4OSAxMjM0NTY3ODknXG4gICAgIyBjb2RlTGluZXMgPSBtYXAuanMuc3BsaXQgJ1xcbidcbiAgICAjIGZvciBpIGluIFswLi4uY29kZUxpbmVzLmxlbmd0aF1cbiAgICAgICAgIyBpZiBjb2RlTGluZXNbaV0udHJpbSgpLmxlbmd0aFxuICAgICAgICAgICAgIyBsb2cgZ3JheShkaW0gaSsxKSArIHJlZEJyaWdodCBjb2RlTGluZXNbaV1cbiAgICAgICAgIyBlbHNlIGxvZyAnJ1xuICAgICAgICAgICAgXG4gICAgIyBsb2cgZ3JheSBkaW0gJyAxMjM0NTY3ODkgMTIzNDU2Nzg5IDEyMzQ1Njc4OSAxMjM0NTY3ODkgMTIzNDU2Nzg5JyAgICBcbiAgICAjIGZvciBpIGluIFswLi4ubWFwLnNvdXJjZU1hcC5saW5lcy5sZW5ndGhdXG4gICAgICAgICMgbWFwbGluZSA9IG1hcC5zb3VyY2VNYXAubGluZXNbaV1cbiAgICAgICAgIyBpZiBtYXBsaW5lXG4gICAgICAgICAgICAjIGxvZyBncmF5KGRpbSBpKzEpICsgcmVkQnJpZ2h0IG1hcExpbmVUb1N0cmluZyBtYXBsaW5lXG4gICAgICAgICMgZWxzZSBsb2cgJydcblxuICAgICMgbG9nIGdyYXkgZGltICcgMTIzNDU2Nzg5IDEyMzQ1Njc4OSAxMjM0NTY3ODkgMTIzNDU2Nzg5IDEyMzQ1Njc4OScgICAgXG4gICAgIyBmb3IgaSBpbiBbMC4uLm1hcC5zb3VyY2VNYXAubGluZXMubGVuZ3RoXVxuICAgICAgICAjIG1hcGxpbmUgPSBtYXAuc291cmNlTWFwLmxpbmVzW2ldXG4gICAgICAgICMgaWYgbWFwbGluZVxuICAgICAgICAgICAgIyBsb2cgZ3JheShkaW0gaSsxKSArIGJsdWVCcmlnaHQgbWFwTGluZVRvU3RyaW5nIG1hcGxpbmUsICdzb3VyY2VDb2x1bW4nXG4gICAgICAgICMgZWxzZSBsb2cgJydcbiAgICAgICAgICAgIFxuIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG5cbnByaW50UmV3cml0ZXIgPSAodG9rZW5zKSAtPlxuXG4gICAgaW5kZW50ID0gMFxuICAgIGZvciBpbmRleCBpbiBbMC4uLnRva2Vucy5sZW5ndGhdXG4gICAgICAgIHRva2VuID0gdG9rZW5zW2luZGV4XVxuICAgICAgICB0YWcgICA9IHRva2VuWzBdXG4gICAgICAgIHZhbHVlID0gdG9rZW5bMV1cbiAgICAgICAgXG4gICAgICAgIGdyYXlEaW0gPSAocykgLT4gZGltIGdyYXkgc1xuICAgICAgICBibHVlRGltID0gKHMpIC0+IGRpbSBibHVlIHNcbiAgICAgICAgeWVsbG93RGltID0gKHMpIC0+IGRpbSB5ZWxsb3cgc1xuICAgICAgICBzcGFjZWQgPSAoY29sb3IsIHYpLT5cbiAgICAgICAgICAgIHByaW50IGNvbG9yIFwiI3t2ID8gdmFsdWV9XCJcbiAgICAgICAgICAgIHByaW50ICcgJyBpZiB0b2tlbi5zcGFjZWQgYW5kIHRva2Vuc1tpbmRleCsxXVswXSBub3QgaW4gWydDQUxMX1NUQVJUJ11cblxuICAgICAgICAjIGxvZyB0b2tlblxuICAgICAgICBzd2l0Y2ggdGFnIFxuICAgICAgICAgICAgd2hlbiAnVEVSTUlOQVRPUicgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHByaW50IFwiXFxuI3twYWQgJycsIGluZGVudH1cIlxuICAgICAgICAgICAgd2hlbiAnSU5ERU5UJyAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIGluZGVudCArPSA0OyBwcmludCBcIlxcbiN7cGFkICcnLCBpbmRlbnR9XCJcbiAgICAgICAgICAgIHdoZW4gJ09VVERFTlQnICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBpbmRlbnQgLT0gNDsgcHJpbnQgXCJcXG4je3BhZCAnJywgaW5kZW50fVwiXG4gICAgICAgICAgICB3aGVuICdIRVJFQ09NTUVOVCcgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGdyYXlEaW1cbiAgICAgICAgICAgIHdoZW4gJ0NBTExfU1RBUlQnICdDQUxMX0VORCcgICAgICAgICAgICAgdGhlbiBzcGFjZWQgZ3JheURpbVxuICAgICAgICAgICAgd2hlbiAnVU5BUlknICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCBibHVlQnJpZ2h0LCAnbm90J1xuICAgICAgICAgICAgd2hlbiAnJiYnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCBibHVlQnJpZ2h0LCAnYW5kJ1xuICAgICAgICAgICAgd2hlbiAnfHwnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCBibHVlQnJpZ2h0LCAnb3InXG4gICAgICAgICAgICB3aGVuICdTVFJJTkcnICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGdyZWVuXG4gICAgICAgICAgICB3aGVuICdTVFJJTkdfU1RBUlQnICdTVFJJTkdfRU5EJyAgICAgICAgIHRoZW4gc3BhY2VkIHJlZEJyaWdodFxuICAgICAgICAgICAgd2hlbiAnUFJPUEVSVFknICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCB5ZWxsb3dcbiAgICAgICAgICAgIHdoZW4gJzonICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgeWVsbG93RGltXG4gICAgICAgICAgICB3aGVuICdAJyBcbiAgICAgICAgICAgICAgICBpZiB0b2tlbnNbaW5kZXgrMV1bMF0gbm90IGluIFsnTUVUQV9JRicgJ01FVEFfRUxTRScgJ1BPU1RfTUVUQV9JRiddIHRoZW4gc3BhY2VkKHllbGxvd0RpbSkgZWxzZSBzcGFjZWQgYmx1ZURpbVxuICAgICAgICAgICAgd2hlbiAnTUVUQV9JRicgJ01FVEFfRUxTRScgJ1BPU1RfTUVUQV9JRicgdGhlbiBzcGFjZWQgYmx1ZSwgJ+KWuCcrdmFsdWVcbiAgICAgICAgICAgIHdoZW4gJ05VTUJFUicgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgYmx1ZVxuICAgICAgICAgICAgd2hlbiAneycnfScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIGlmIG5vdCB0b2tlbi5nZW5lcmF0ZWQgdGhlbiBzcGFjZWQgZ3JheVxuICAgICAgICAgICAgd2hlbiAnPScgJysnICctJyAnKysnICctLScgJy4uLicgJzo6JyBcXFxuICAgICAgICAgICAgICAgICAnWycgJ10nICd7JyAnfScgJy4nICdNQVRIJyAnVU5BUllfTUFUSCcgXFxcbiAgICAgICAgICAgICAgICAgJ0lOREVYX1NUQVJUJyAnSU5ERVhfRU5EJyBcXFxuICAgICAgICAgICAgICAgICAnQ09NUEFSRScgJ0NPTVBPVU5EX0FTU0lHTicgICAgICAgICB0aGVuIHNwYWNlZCBncmF5XG4gICAgICAgICAgICB3aGVuICcsJyAnKCcgJyknICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGdyYXlEaW1cbiAgICAgICAgICAgIHdoZW4gJ1BBUkFNX1NUQVJUJyAnUEFSQU1fRU5EJyAnLT4nICc9PicgdGhlbiBzcGFjZWQgKHMpIC0+IGJvbGQgYmx1ZSBzXG4gICAgICAgICAgICB3aGVuICdOVUxMJyAnVU5ERUZJTkVEJyAnRlVOQ19FWElTVCcgJz8nICc/LicgJ0JJTj8nIHRoZW4gc3BhY2VkIHJlZFxuICAgICAgICAgICAgd2hlbiAnUkVHRVgnICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCBtYWdlbnRhXG4gICAgICAgICAgICB3aGVuICdGT1InICdGT1JJTicgJ1RSWScgJ0NBVENIJyAnVEhST1cnICdSRUxBVElPTicgJ0VYVEVORFMnICdTVEFURU1FTlQnICdPV04nICdGT1JPRicgJ0xPT1AnIFxcXG4gICAgICAgICAgICAgICAgICdJRicgJ1BPU1RfSUYnICdXSEVOJyAnVEhFTicgJ0VMU0UnICdUSElTJyAnU1VQRVInICdTV0lUQ0gnICdMRUFESU5HX1dIRU4nICdXSElMRScgXFxcbiAgICAgICAgICAgICAgICAgJ0JPT0wnICdDTEFTUycgJ1JFVFVSTicgICAgICAgICAgICAgdGhlbiBzcGFjZWQgYmx1ZUJyaWdodFxuICAgICAgICAgICAgd2hlbiAnSURFTlRJRklFUicgXG4gICAgICAgICAgICAgICAgc3dpdGNoIHZhbHVlXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gJ3JlcXVpcmUnIHRoZW4gc3BhY2VkIGdyYXlcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBzcGFjZWQgd2hpdGVCcmlnaHRcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBwcmludCBcIj4je3RhZ308XCJcbiAgICAgICAgICAgICAgICAjIHNwYWNlZCAocykgLT4gYm9sZCBibHVlQnJpZ2h0IHNcbiAgICAgICAgICAgICAgICBzcGFjZWQgY3lhblxuICAgICAgICAgICAgXG52ZXJzaW9uID0gLT4gcHJpbnRMaW5lIFwiI3tLb2ZmZWUuVkVSU0lPTn1cIlxudXNhZ2UgICA9IC0+IFxuXG4gICAgbGluZXMgPSBbXCIje2dyYXkgJ1VzYWdlOid9ICN7eWVsbG93ICdrb2ZmZWUnfSAje2dyYXkgJ1tvcHRpb25zXSd9IHBhdGgvdG8vc2NyaXB0ICN7Z3JheSAnW29wdGlvbnNdJ31cXG5cIl1cbiAgICBcbiAgICBydWxlcyA9IFNXSVRDSEVTLm1hcCAocnVsZSkgLT5cbiAgICAgICAgW3Nob3J0LCBsb25nLCBkZXNjcmlwdGlvbl0gPSBydWxlXG4gICAgICAgIGxvbmdGbGFnID0gbG9uZy5tYXRjaCgvXigtLVxcd1tcXHdcXC1dKikvKVsxXVxuICAgICAgICBjc2hvcnQgICA9IGlmIHNob3J0IHRoZW4gZ3JheShzaG9ydFswXSkgKyBib2xkKGdyYXkoc2hvcnRbMS4uXSkpICsgJyAgJyBlbHNlICcgICAgJ1xuICAgICAgICBjbG9uZyAgICA9IHBhZCBsb25nLCAyMFxuICAgICAgICBjbG9uZyAgICA9IGdyYXkoY2xvbmdbMC4uMV0pICsgYm9sZCh3aGl0ZShjbG9uZ1syLi5dLnNwbGl0KCcgJylbMF0pKSArICcgJyArIGJvbGQoYmx1ZUJyaWdodChjbG9uZ1syLi5dLnNwbGl0KCcgJylbMS4uXS5qb2luKCcgJykpKVxuICAgICAgICBsaW5lcy5wdXNoICcgICAgJyArIGNzaG9ydCArIGNsb25nICsgZ3JheSBkZXNjcmlwdGlvblxuICAgICAgICBcbiAgICBsaW5lcy5wdXNoIGdyYXkgJ1xcbklmIGNhbGxlZCB3aXRob3V0IGEgc2NyaXB0LCB0aGUgaW50ZXJhY3RpdmUgUkVQTCB3aWxsIGJlIHN0YXJ0ZWQnXG4gICAgICAgIFxuICAgIGxvZyBcIlxcbiN7IGxpbmVzLmpvaW4oJ1xcbicpIH1cXG5cIlxuICAgICAgICBcbiJdfQ==
//# sourceURL=../coffee/command.coffee