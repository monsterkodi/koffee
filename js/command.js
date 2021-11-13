// koffee 1.18.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZC5qcyIsInNvdXJjZVJvb3QiOiIuLi9jb2ZmZWUiLCJzb3VyY2VzIjpbImNvbW1hbmQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQWlCQSxFQUFBLEdBQW1CLE9BQUEsQ0FBUSxJQUFSOztBQUNuQixLQUFBLEdBQW1CLE9BQUEsQ0FBUSxRQUFSOztBQUNuQixJQUFBLEdBQW1CLE9BQUEsQ0FBUSxNQUFSOztBQUNuQixPQUFBLEdBQW1CLE9BQUEsQ0FBUSxXQUFSOztBQUNuQixRQUFBLEdBQW1CLE9BQUEsQ0FBUSxZQUFSOztBQUNuQixNQUFBLEdBQW1CLE9BQUEsQ0FBUSxVQUFSOztBQUNuQixNQUFtQixPQUFBLENBQVEsZUFBUixDQUFuQixFQUFFLGlCQUFGLEVBQVM7O0FBRVQsYUFBQSxHQUFtQixLQUFLLENBQUMsR0FBTixLQUFhOztBQUVoQyxPQUFPLENBQUMsTUFBUixDQUFBOztBQUVFLDRCQUFGLEVBQVk7O0FBRVYsbUNBQUYsRUFBZ0IsMkJBQWhCLEVBQTBCLDZCQUExQixFQUFxQyxxQkFBckMsRUFBNEM7O0FBRTVDLEtBQUEsR0FBWSxPQUFPLENBQUM7O0FBQ3BCLEtBQUEsR0FBWSxTQUFDLElBQUQ7V0FBVSxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQWYsQ0FBcUIsSUFBckI7QUFBVjs7QUFDWixTQUFBLEdBQVksU0FBQyxJQUFEO1dBQVUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFmLENBQXFCLElBQUEsR0FBTyxJQUE1QjtBQUFWOztBQUNaLFNBQUEsR0FBWSxTQUFDLElBQUQ7V0FBVSxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQWYsQ0FBcUIsSUFBQSxHQUFPLElBQTVCO0FBQVY7O0FBQ1osTUFBQSxHQUFZLFNBQUMsSUFBRDtXQUFVLFFBQVEsQ0FBQyxJQUFULENBQWMsSUFBZDtBQUFWOztBQUVaLFFBQUEsR0FBVyxDQUNQLENBQUMsSUFBRCxFQUFNLFFBQU4sRUFBNEIsOENBQTVC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QVcsS0FBTSxTQUFJLENBQUMsS0FBWCxDQUFpQixHQUFqQixDQUFzQixTQUFJLENBQUMsSUFBM0IsQ0FBZ0MsR0FBaEMsQ0FBWCxDQUFMO2VBQzdFLEtBQUssQ0FBQyxJQUFOLENBQVcsTUFBQSxHQUFTLE1BQVQsR0FBa0IsS0FBbEIsR0FBMEIsSUFBQSxDQUFLLFdBQUwsQ0FBckM7SUFOaUIsQ0FBYjtJQVFSLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBQSxDQUFLLG9FQUFMLENBQVg7V0FBb0YsT0FBQSxDQUVwRixHQUZvRixDQUVoRixJQUFBLEdBQUksQ0FBRSxLQUFLLENBQUMsSUFBTixDQUFXLElBQVgsQ0FBRixDQUFKLEdBQXdCLElBRndEO0FBWjlFIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4jIyNcblxuIyBoYW5kbGUgdmFyaW91cyB0YXNrczpcbiNcbiMgICAtIGNvbXBpbGUgYW5kIHNhdmUgaW50byBgLmpzYCBmaWxlcyBcbiMgICAtIGNvbXBpbGUgYW5kIHByaW50IHRvIHN0ZG91dCBcbiMgICAtIHJlY29tcGlsZSBpZiB0aGUgc291cmNlIGNoYW5nZXNcbiMgICAtIHByaW50IGxleGVyIHRva2Vuc1xuIyAgIC0gcHJpbnQgYSBzeW50YXggdHJlZVxuIyAgIC0gbGF1bmNoIGEgUkVQTFxuXG5mcyAgICAgICAgICAgICAgID0gcmVxdWlyZSAnZnMnXG5zbGFzaCAgICAgICAgICAgID0gcmVxdWlyZSAna3NsYXNoJ1xubm9wdCAgICAgICAgICAgICA9IHJlcXVpcmUgJ25vcHQnXG5oZWxwZXJzICAgICAgICAgID0gcmVxdWlyZSAnLi9oZWxwZXJzJ1xuZmVhdHVyZXMgICAgICAgICA9IHJlcXVpcmUgJy4vZmVhdHVyZXMnXG5Lb2ZmZWUgICAgICAgICAgID0gcmVxdWlyZSAnLi9rb2ZmZWUnXG57IHNwYXduLCBleGVjIH0gID0gcmVxdWlyZSAnY2hpbGRfcHJvY2VzcydcblxudXNlV2luUGF0aFNlcCAgICA9IHNsYXNoLnNlcCBpcyAnXFxcXCdcblxuaGVscGVycy5jb2xvcnMoKVxuXG57IEZFQVRVUkVTLCBsb2dGZWF0dXJlcyB9ID0gZmVhdHVyZXNcblxueyBiYXNlRmlsZU5hbWUsIGlzQ29mZmVlLCBzdHJpbmdpZnksIG1lcmdlLCBwYWQgfSA9IGhlbHBlcnNcblxuZXJyb3IgICAgID0gY29uc29sZS5lcnJvclxucHJpbnQgICAgID0gKGxpbmUpIC0+IHByb2Nlc3Muc3Rkb3V0LndyaXRlIGxpbmVcbnByaW50TGluZSA9IChsaW5lKSAtPiBwcm9jZXNzLnN0ZG91dC53cml0ZSBsaW5lICsgJ1xcbicgIyA/Pz9cbnByaW50V2FybiA9IChsaW5lKSAtPiBwcm9jZXNzLnN0ZGVyci53cml0ZSBsaW5lICsgJ1xcbicgIyA/Pz9cbmhpZGRlbiAgICA9IChmaWxlKSAtPiAvXlxcLnx+JC8udGVzdCBmaWxlXG5cblNXSVRDSEVTID0gW1xuICAgIFsnLWInICctLWJhcmUnICAgICAgICAgICAgICAnY29tcGlsZSB3aXRob3V0IGEgdG9wLWxldmVsIGZ1bmN0aW9uIHdyYXBwZXInICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1jJyAnLS1jb21waWxlJyAgICAgICAgICAgJ2NvbXBpbGUgdG8gSmF2YVNjcmlwdCBhbmQgc2F2ZSBhcyAuanMgZmlsZXMnICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctZCcgJy0tZG9jJyAgICAgICAgICAgICAgICdsb2cgdGhlIOKWuGRvYyBzZWN0aW9ucycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctZScgJy0tZXZhbCBTVFJJTkcnICAgICAgICdldmFsdWF0ZSBhIHN0cmluZyBhbmQgcHJpbnQgdGhlIHJlc3VsdCcgICAgICAgICAgICAgICBbU3RyaW5nLCBBcnJheV0gXVxuICAgIFsnLWYnICctLWZlYXR1cmVzJyAgICAgICAgICAnbGlzdCBhdmFpbGFibGUgZmVhdHVyZXMnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJycgICAnLS1uby1gZmVhdHVyZScgICAgICAgJ2Rpc2FibGUgYSBmZWF0dXJlLCBlLmcuIC0tbm8tbmVnYXRpdmUtaW5kZXgnICAgICAgICAgICBudWxsICAgICAgICAgICBdXG4gICAgWyctaCcgJy0taGVscCcgICAgICAgICAgICAgICdkaXNwbGF5IHRoaXMgaGVscCBtZXNzYWdlJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLWonICctLWpzJyAgICAgICAgICAgICAgICAncHJpbnQgdGhlIGNvbXBpbGVkIEphdmFTY3JpcHQnICAgICAgICAgICAgICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1tJyAnLS1tYXAnICAgICAgICAgICAgICAgJ2dlbmVyYXRlIHNvdXJjZSBtYXAgYW5kIHNhdmUgYXMgLmpzLm1hcCBmaWxlcycgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctTScgJy0taW5saW5lLW1hcCcgICAgICAgICdnZW5lcmF0ZSBzb3VyY2UgbWFwIGFuZCBpbmNsdWRlIGl0IGRpcmVjdGx5IGluIG91dHB1dCcgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnJyAgICctLW1ldGFsb2cnICAgICAgICAgICAnbWV0YSBsb2cgKGRlZmF1bHQ6IGNvbnNvbGUubG9nKScgICAgICAgICAgICAgICAgICAgICAgIFN0cmluZyAgICAgICAgIF1cbiAgICBbJy1uJyAnLS1ub29wJyAgICAgICAgICAgICAgJ2RvZXMgbm90aGluZywgZm9yIGRlYnVnZ2luZyBwdXJwb3NlcycgICAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctbycgJy0tb3V0cHV0IERJUicgICAgICAgICdzZXQgdGhlIG91dHB1dCBkaXJlY3RvcnkgZm9yIGNvbXBpbGVkIEphdmFTY3JpcHQnICAgICAgU3RyaW5nICAgICAgICAgXVxuICAgIFsnLXInICctLXJlcXVpcmUgTU9EVUxFJyAgICAncmVxdWlyZSB0aGUgZ2l2ZW4gbW9kdWxlIGJlZm9yZSBldmFsIG9yIFJFUEwnICAgICAgICAgW1N0cmluZywgQXJyYXldIF1cbiAgICBbJy1DJyAnLS1jb2ZmZWUnICAgICAgICAgICAgJ3ByaW50IHRoZSB0b2tlbiBzdHJlYW0gYXMgQ29mZmVlU2NyaXB0JyAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctcycgJy0tc3RkaW8nICAgICAgICAgICAgICdsaXN0ZW4gZm9yIGFuZCBjb21waWxlIHNjcmlwdHMgb3ZlciBzdGRpbycgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLXQnICctLXRlc3QnICAgICAgICAgICAgICAnY29tcGlsZSBhbmQgcnVuIHRoZSBAdGVzdCBjb2RlJyAgICAgICAgICAgICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1UJyAnLS10b2tlbnMnICAgICAgICAgICAgJ3ByaW50IHRoZSB0b2tlbnMnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctRicgJy0tZnJhZ21lbnRzJyAgICAgICAgICdwcmludCB0aGUgZnJhZ21lbnRzJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLVAnICctLXBhcnNlJyAgICAgICAgICAgICAncHJpbnQgdGhlIHBhcnNlIHRyZWUnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy12JyAnLS12ZXJzaW9uJyAgICAgICAgICAgJ2Rpc3BsYXkgdGhlIHZlcnNpb24gbnVtYmVyJyAgICAgICAgICAgICAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctdycgJy0td2F0Y2gnICAgICAgICAgICAgICd3YXRjaCBzY3JpcHRzIGZvciBjaGFuZ2VzIGFuZCByZXJ1biBjb21tYW5kcycgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuXVxuXG5vcHRzID0ge31cblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgXG4jICAwMDAwMDAwICAgMDAwICAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcblxucGFyc2VPcHRpb25zID0gLT5cblxuICAgIGtub3duID0gRGVidWc6Qm9vbGVhblxuICAgIHNob3J0ID0gRDonLS1EZWJ1ZycgcDonLS1qcydcbiAgICBTV0lUQ0hFUy5tYXAgKHMpIC0+IGwgPSBzWzFdLnNwbGl0KCcgJylbMF1bMi4uXTsga25vd25bbF0gPSBzWzNdIGlmIHNbM107IHNob3J0W3NbMF1bMV1dID0gXCItLSN7bH1cIiBpZiBzWzBdIT0nJ1xuICAgIEZFQVRVUkVTLm1hcCAoZikgLT4ga25vd25bZi5sYWddID0gQm9vbGVhblxuICAgIFxuICAgIG8gPSBvcHRzID0gbm9wdCBrbm93biwgc2hvcnRcbiAgICAgICAgXG4gICAgby5jb21waWxlICBvcj0gISFvLm91dHB1dFxuICAgIG8uYXJndW1lbnRzICA9IG8uYXJndi5yZW1haW5cbiAgICBvLnByZWx1ZGUgICAgPSBtYWtlUHJlbHVkZSBvLnJlcXVpcmUgaWYgby5yZXF1aXJlXG4gICAgby5ydW4gICAgICAgID0gbm90IChvLmNvbXBpbGUgb3Igby5qcyBvciBvLm1hcCBvciBvLnRva2VucyBvciBvLnBhcnNlKVxuICAgIG8uanMgICAgICAgICA9ICEhKG8uanMgb3Igby5ldmFsIG9yIG8uc3RkaW8gYW5kIG8uY29tcGlsZSkgIyBqcyBvdXRwdXQgaXMgcGFzc2VkIHRvIGV2YWwgYW5kIHN0ZGlvIGNvbXBpbGVcbiAgICBcbiAgICBvLnNvdXJjZU1hcCAgPSBvLm1hcFxuICAgIG8uaW5saW5lTWFwICA9IG9bJ2lubGluZS1tYXAnXVxuICAgICMgby5nZW5lcmF0ZWRGaWxlID0gby5vdXRwdXRcbiAgICBcbiAgICBvLmZlYXR1cmUgPSB7fVxuICAgIEZFQVRVUkVTLm1hcCAoZikgLT4gby5mZWF0dXJlW2Yua2V5XSA9IG9bZi5mbGFnXSA/IHRydWU7IGRlbGV0ZSBvW2YuZmxhZ11cbiAgICBcbiAgICBpZiBvLkRlYnVnXG4gICAgICAgIGRlbGV0ZSBvLmFyZ3ZcbiAgICAgICAgbG9nIHN0cmluZ2lmeSBvXG5cbiMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4jIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuXG5ydW4gPSAtPlxuICAgIFxuICAgIHBhcnNlT3B0aW9ucygpXG4gICAgXG4gICAgaWYgb3B0cy5mZWF0dXJlLmNvbG9yID09IGZhbHNlXG4gICAgICAgIGhlbHBlcnMuY29sb3JzIGZhbHNlXG4gICAgICAgIFxuICAgIHJldHVybiBsb2dGZWF0dXJlcygpICBpZiBvcHRzLmZlYXR1cmVzXG4gICAgcmV0dXJuIHVzYWdlKCkgICAgICAgIGlmIG9wdHMuaGVscFxuICAgIHJldHVybiB2ZXJzaW9uKCkgICAgICBpZiBvcHRzLnZlcnNpb25cbiAgICByZXR1cm4gc3RhcnRSZXBsKCkgICAgaWYgb3B0cy5pbnRlcmFjdGl2ZVxuICAgIHJldHVybiBjb21waWxlU3RkaW8oKSBpZiBvcHRzLnN0ZGlvXG4gICAgaWYgb3B0cy5ldmFsXG4gICAgICAgIGZvciBldmFsIGluIG9wdHMuZXZhbFxuICAgICAgICAgICAgY29tcGlsZVNjcmlwdCBldmFsXG4gICAgICAgIHJldHVyblxuICAgIHJldHVybiBzdGFydFJlcGwoKSAgICBpZiBub3Qgb3B0cy5hcmd1bWVudHMubGVuZ3RoXG4gICAgXG4gICAgbGl0ZXJhbHMgPSBpZiBub3Qgb3B0cy53YXRjaCBhbmQgbm90IG9wdHMuY29tcGlsZSB0aGVuIG9wdHMuYXJndW1lbnRzLnNwbGljZSAxIGVsc2UgW11cbiAgICBcbiAgICBwcm9jZXNzLmFyZ3YgPSBwcm9jZXNzLmFyZ3ZbMC4uMV0uY29uY2F0IGxpdGVyYWxzXG4gICAgcHJvY2Vzcy5hcmd2WzBdID0gJ2tvZmZlZSdcblxuICAgIG9wdHMub3V0cHV0ID0gc2xhc2gucmVzb2x2ZSBvcHRzLm91dHB1dCBpZiBvcHRzLm91dHB1dFxuICAgIGZvciBzb3VyY2UgaW4gb3B0cy5hcmd1bWVudHNcbiAgICAgICAgc291cmNlID0gc2xhc2gucmVzb2x2ZSBzb3VyY2VcbiAgICAgICAgXG4gICAgICAgIGlmIG9wdHMud2F0Y2hcbiAgICAgICAgICAgIHdhdGNoUGF0aCBzb3VyY2VcbiAgICAgICAgZWxzZSAgICAgXG4gICAgICAgICAgICBjb21waWxlUGF0aCBzb3VyY2U6c291cmNlLCB0b3BMZXZlbDp5ZXNcblxuZXhwb3J0cy5ydW4gPSBydW5cbiAgICAgICAgXG5zdGFydFJlcGwgPSAtPlxuICAgIFxuICAgICMgTWFrZSB0aGUgUkVQTCB1c2UgdGhlIGdsb2JhbCBjb250ZXh0IHNvIGFzIHRvIFxuICAgICMgICAoYSkgYmUgY29uc2lzdGVudCB3aXRoIHRoZSBgbm9kZWAgUkVQTCBhbmQsIHRoZXJlZm9yZSwgXG4gICAgIyAgIChiKSBtYWtlIHBhY2thZ2VzIHRoYXQgbW9kaWZ5IG5hdGl2ZSBwcm90b3R5cGVzIChzdWNoIGFzICdjb2xvcnMnIGFuZCAnc3VnYXInKSB3b3JrIGFzIGV4cGVjdGVkLlxuICAgIFxuICAgIHJlcGxDbGlPcHRzID0gdXNlR2xvYmFsOiB5ZXNcbiAgICByZXBsQ2xpT3B0cy5wcmVsdWRlID0gb3B0cy5wcmVsdWRlXG4gICAgcmVxdWlyZSgnLi9yZXBsJykuc3RhcnQgcmVwbENsaU9wdHNcblxubWFrZVByZWx1ZGUgPSAocmVxdWlyZXMpIC0+XG4gICAgXG4gICAgcmVxdWlyZXMubWFwIChtb2R1bGUpIC0+XG4gICAgICAgIFtfLCBuYW1lLCBtb2R1bGVdID0gbWF0Y2ggaWYgbWF0Y2ggPSBtb2R1bGUubWF0Y2goL14oLiopPSguKikkLylcbiAgICAgICAgbmFtZSB8fD0gYmFzZUZpbGVOYW1lIG1vZHVsZSwgeWVzLCB1c2VXaW5QYXRoU2VwXG4gICAgICAgIFwiI3tuYW1lfSA9IHJlcXVpcmUoJyN7bW9kdWxlfScpXCJcbiAgICAuam9pbiAnOydcblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcblxuIyBDb21waWxlIGEgc2NyaXB0IG9yIGEgZGlyZWN0b3J5LiBJZiBhIGRpcmVjdG9yeSBpcyBwYXNzZWQsIHJlY3Vyc2l2ZWx5IGNvbXBpbGUgYWxsICcuY29mZmVlJyBhbmQgJy5rb2ZmZWUnIGZpbGVzLlxuXG5jb21waWxlUGF0aCA9IChzb3VyY2U6LCB0b3BMZXZlbDpubykgLT5cblxuICAgIHJldHVybiBpZiBub3QgdG9wTGV2ZWwgYW5kIGhpZGRlbiBzb3VyY2VcbiAgICAgICAgICAgICAgXG4gICAgdHJ5XG4gICAgICAgIHN0YXRzID0gZnMuc3RhdFN5bmMgc291cmNlXG4gICAgY2F0Y2ggZXJyXG4gICAgICAgIGlmIGVyci5jb2RlIGlzICdFTk9FTlQnXG4gICAgICAgICAgICBlcnJvciBcIkNvbW1hbmQuY29tcGlsZVBhdGggY2FuJ3Qgc3RhdCAnI3tzb3VyY2V9J1wiXG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQgMVxuICAgICAgICB0aHJvdyBlcnJcbiAgICAgICAgXG4gICAgaWYgc3RhdHMuaXNEaXJlY3RvcnkoKVxuICAgICAgICBcbiAgICAgICAgaWYgc2xhc2guYmFzZW5hbWUoc291cmNlKSBpbiBbJ25vZGVfbW9kdWxlcycgJy5naXQnXVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgb3B0cy5ydW5cbiAgICAgICAgICAgIGNvbXBpbGVQYXRoIHNvdXJjZTpmaW5kRGlyZWN0b3J5SW5kZXgoc291cmNlKSwgdG9wTGV2ZWw6dG9wTGV2ZWxcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICBcbiAgICAgICAgbG9nICdDb21tYW5kLmNvbXBpbGVQYXRoIGRpcjonLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuICAgICAgICBcbiAgICAgICAgdHJ5XG4gICAgICAgICAgICBmaWxlcyA9IGZzLnJlYWRkaXJTeW5jIHNvdXJjZVxuICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgIGlmIGVyci5jb2RlIGlzICdFTk9FTlQnIHRoZW4gcmV0dXJuIFxuICAgICAgICAgICAgdGhyb3cgZXJyXG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIGZpbGUgaW4gZmlsZXNcbiAgICAgICAgICAgIGNvbXBpbGVQYXRoIHNvdXJjZTpzbGFzaC5qb2luIHNvdXJjZSwgZmlsZVxuICAgICAgICAgICAgXG4gICAgZWxzZSBpZiB0b3BMZXZlbCBvciBpc0NvZmZlZSBzb3VyY2VcbiAgICAgICAgXG4gICAgICAgIHRyeVxuICAgICAgICAgICAgY29kZSA9IGZzLnJlYWRGaWxlU3luYyBzb3VyY2VcbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICBpZiBlcnIuY29kZSBpcyAnRU5PRU5UJyB0aGVuIHJldHVyblxuICAgICAgICAgICAgdGhyb3cgZXJyXG4gICAgICAgIFxuICAgICAgICBsb2cgJ0NvbW1hbmQuY29tcGlsZVBhdGggZmlsZTonLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuICAgICAgICAgICAgXG4gICAgICAgIGNvbXBpbGVTY3JpcHQgY29kZS50b1N0cmluZygpLCBzb3VyY2VcbiAgICAgICAgXG5maW5kRGlyZWN0b3J5SW5kZXggPSAoc291cmNlKSAtPlxuXG4gICAgZm9yIGV4dCBpbiBLb2ZmZWUuRklMRV9FWFRFTlNJT05TXG4gICAgICAgIGluZGV4ID0gc2xhc2guam9pbiBzb3VyY2UsIFwiaW5kZXgje2V4dH1cIlxuICAgICAgICB0cnlcbiAgICAgICAgICAgIHJldHVybiBpbmRleCBpZiAoZnMuc3RhdFN5bmMgaW5kZXgpLmlzRmlsZSgpXG4gICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgdGhyb3cgZXJyIHVubGVzcyBlcnIuY29kZSBpcyAnRU5PRU5UJ1xuICAgIGVycm9yIFwiTWlzc2luZyBpbmRleC5jb2ZmZWUgaW4gI3tzb3VyY2V9XCJcbiAgICBwcm9jZXNzLmV4aXQgMVxuXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgICAgIDAwMCAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgICAgXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgICAgXG5cbiMgQ29tcGlsZSBhIHNpbmdsZSBzb3VyY2Ugc2NyaXB0LCBjb250YWluaW5nIHRoZSBnaXZlbiBjb2RlLCBhY2NvcmRpbmcgdG8gdGhlIHJlcXVlc3RlZCBvcHRpb25zLiBcbiMgSWYgZXZhbHVhdGluZyB0aGUgc2NyaXB0IGRpcmVjdGx5IHNldHMgYF9fZmlsZW5hbWVgLCBgX19kaXJuYW1lYCBhbmQgYG1vZHVsZS5maWxlbmFtZWAgdG8gYmUgY29ycmVjdCByZWxhdGl2ZSB0byB0aGUgc2NyaXB0J3Mgc2xhc2guXG5cbmNvbXBpbGVTY3JpcHQgPSAoY29kZSwgc291cmNlPW51bGwpIC0+XG4gICAgXG4gICAgbyA9IG9wdHNcbiAgICBvcHRpb25zID0gS29mZmVlLmNvbXBpbGVPcHRpb25zIHNvdXJjZSwgb3B0c1xuICAgIFxuICAgIHRyeVxuICAgICAgICB0ID0gdGFzayA9IHtzb3VyY2UsIGNvZGUsIG9wdGlvbnN9XG4gICAgICAgIFxuICAgICAgICBpZiBvLnRva2Vuc1xuICAgICAgICAgICAgcHJpbnRUb2tlbnMgS29mZmVlLnRva2VucyB0LmNvZGUsIHQub3B0aW9uc1xuICAgICAgICBlbHNlIGlmIG8uZnJhZ21lbnRzXG4gICAgICAgICAgICBwcmludEZyYWdtZW50cyBjb2RlLCBLb2ZmZWUuZnJhZ21lbnRzIHQuY29kZSwgdC5vcHRpb25zXG4gICAgICAgIGVsc2UgaWYgby5jb2ZmZWVcbiAgICAgICAgICAgIHByaW50UmV3cml0ZXIgS29mZmVlLnRva2VucyB0LmNvZGUsIHQub3B0aW9uc1xuICAgICAgICBlbHNlIGlmIG8ucGFyc2VcbiAgICAgICAgICAgIHByaW50TGluZSBLb2ZmZWUubm9kZXModC5jb2RlLCB0Lm9wdGlvbnMpLnRvU3RyaW5nKCkudHJpbSgpXG4gICAgICAgIGVsc2UgaWYgby5ydW5cbiAgICAgICAgICAgIEtvZmZlZS5yZWdpc3RlcigpXG4gICAgICAgICAgICBLb2ZmZWUuZXZhbCBvcHRzLnByZWx1ZGUsIHQub3B0aW9ucyBpZiBvcHRzLnByZWx1ZGVcbiAgICAgICAgICAgIHQub3B0aW9ucy5maWxlbmFtZSA/PSBvcHRpb25zLnNvdXJjZVxuICAgICAgICAgICAgaWYgb3B0cy5ub29wIFxuICAgICAgICAgICAgICAgIGxvZyBcIm5vb3AgcnVuICN7c291cmNlfVwiXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgS29mZmVlLnJ1biB0LmNvZGUsIHQub3B0aW9uc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBjb21waWxlZCA9IEtvZmZlZS5jb21waWxlIHQuY29kZSwgdC5vcHRpb25zXG4gICAgICAgICAgICB0Lm91dHB1dCA9IGNvbXBpbGVkXG4gICAgICAgICAgICBpZiBvLm1hcFxuICAgICAgICAgICAgICAgIHQub3V0cHV0ID0gY29tcGlsZWQuanNcbiAgICAgICAgICAgICAgICB0LnNvdXJjZU1hcCA9IGNvbXBpbGVkLnYzU291cmNlTWFwXG5cbiAgICAgICAgICAgIGlmIG8uanNcbiAgICAgICAgICAgICAgICBpZiBvcHRzLm5vb3AgdGhlbiBsb2cgXCJub29wIGpzICN7c291cmNlfVwiXG4gICAgICAgICAgICAgICAgZWxzZSBcbiAgICAgICAgICAgICAgICAgICAgcHJpbnRMaW5lIHQub3V0cHV0LnRyaW0oKVxuICAgICAgICAgICAgZWxzZSBpZiBvLmNvbXBpbGUgb3Igby5tYXBcbiAgICAgICAgICAgICAgICBpZiBvcHRzLm5vb3AgdGhlbiBsb2cgXCJub29wIHdyaXRlICN7b3B0aW9ucy5qc1BhdGh9XCJcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGpzUGF0aCA9IG9wdGlvbnMuanNQYXRoXG4gICAgICAgICAgICAgICAgICAgIGlmIG8ub3V0cHV0XG4gICAgICAgICAgICAgICAgICAgICAgICBqc1BhdGggPSBvdXRwdXRQYXRoIHQuc291cmNlLCAnLmpzJ1xuICAgICAgICAgICAgICAgICAgICB3cml0ZUpzIHQuc291cmNlLCB0Lm91dHB1dCwganNQYXRoLCB0LnNvdXJjZU1hcFxuICAgIGNhdGNoIGVyclxuICAgICAgICBcbiAgICAgICAgbWVzc2FnZSA9IGVyci5tZXNzYWdlXG4gICAgICAgIFxuICAgICAgICBpZiBlcnIgaW5zdGFuY2VvZiBTeW50YXhFcnJvclxuICAgICAgICAgICAgcHJpbnRMaW5lIG1lc3NhZ2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcHJpbnRMaW5lIGVyci5zdGFja1xuICAgICAgICBcbiAgICAgICAgaWYgby53YXRjaCBvciBvLmV2YWxcbiAgICAgICAgICAgIHByaW50ICdcXHgwNycgIyBiZWxsXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHByb2Nlc3MuZXhpdCAxXG4gICAgICAgICAgICBcbiMgQXR0YWNoIHRoZSBhcHByb3ByaWF0ZSBsaXN0ZW5lcnMgdG8gY29tcGlsZSBzY3JpcHRzIGluY29taW5nIG92ZXIgKipzdGRpbioqLCBhbmQgd3JpdGUgdGhlbSBiYWNrIHRvICoqc3Rkb3V0KiouXG5cbmNvbXBpbGVTdGRpbyA9IC0+XG4gICAgXG4gICAgYnVmZmVycyA9IFtdXG4gICAgc3RkaW4gPSBwcm9jZXNzLm9wZW5TdGRpbigpXG4gICAgc3RkaW4ub24gJ2RhdGEnLCAoYnVmZmVyKSAtPiBidWZmZXJzLnB1c2ggYnVmZmVyIGlmIGJ1ZmZlclxuICAgIHN0ZGluLm9uICdlbmQnLCAtPiBjb21waWxlU2NyaXB0IEJ1ZmZlci5jb25jYXQoYnVmZmVycykudG9TdHJpbmcoKVxuXG4jIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwMDAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuIyAwMCAgICAgMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICBcblxud2F0Y2hQYXRoID0gKHNvdXJjZSkgLT4gIyBXYXRjaCBhIGZpbGUgb3IgZGlyZWN0b3J5LlxuICAgIFxuICAgIHRyeVxuICAgICAgICBzdGF0cyA9IGZzLnN0YXRTeW5jIHNvdXJjZVxuICAgIGNhdGNoIGVyclxuICAgICAgICByZXR1cm4gaWYgZXJyLmNvZGUgaXMgJ0VOT0VOVCdcbiAgICAgICAgcmV0dXJuIGVycm9yIFwiQ29tbWFuZC53YXRjaFBhdGggY2FuJ3Qgc3RhdCAnI3tzb3VyY2V9J1wiLCBlcnJcbiAgICAgICAgICAgICAgICBcbiAgICBpZiBzdGF0cy5pc0RpcmVjdG9yeSgpXG4gICAgICAgIHdhdGNoRGlyIHNvdXJjZVxuICAgIGVsc2VcbiAgICAgICAgd2F0Y2hGaWxlIHNvdXJjZVxuXG4jIFdhdGNoIGEgc2luZ2xlIGZpbGUgdXNpbmcgYGZzLndhdGNoYCwgcmVjb21waWxpbmcgaXQgZXZlcnkgdGltZSB0aGUgZmlsZSBpcyB1cGRhdGVkLlxuIyBNYXkgYmUgdXNlZCBpbiBjb21iaW5hdGlvbiB3aXRoIG90aGVyIG9wdGlvbnMsIHN1Y2ggYXMgYC0tcHJpbnRgLlxuICAgICAgICBcbndhdGNoRmlsZSA9IChzb3VyY2UpIC0+XG4gICAgXG4gICAgcmV0dXJuIGlmIG5vdCBpc0NvZmZlZSBzb3VyY2VcbiAgICBcbiAgICBsb2cgJ0NvbW1hbmQud2F0Y2hGaWxlJywgc291cmNlIGlmIG9wdHMuRGVidWdcbiAgICBcbiAgICB3YXRjaGVyICAgICAgICA9IG51bGxcbiAgICBwcmV2U3RhdHMgICAgICA9IG51bGxcbiAgICBjb21waWxlVGltZW91dCA9IG51bGxcblxuICAgIHN0YXJ0V2F0Y2hlciA9IC0+XG4gICAgICAgIFxuICAgICAgICB3YXRjaGVyID0gZnMud2F0Y2ggc291cmNlXG4gICAgICAgIC5vbiAnY2hhbmdlJywgKGNoYW5nZSkgLT5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIGlmIGNoYW5nZSAhPSAnY2hhbmdlJ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBsb2cgJ0NvbW1hbmQud2F0Y2hGaWxlJywgY2hhbmdlLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQgY29tcGlsZVRpbWVvdXRcbiAgICAgICAgICAgIGNvbXBpbGVUaW1lb3V0ID0gd2FpdCAyNSwgLT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmcy5zdGF0IHNvdXJjZSwgKGVyciwgc3RhdHMpIC0+XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB3YXRjaGVyLmNsb3NlKCkgaWYgZXJyPy5jb2RlIGlzICdFTk9FTlQnXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnJvciBlcnIgaWYgZXJyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpZiBwcmV2U3RhdHMgYW5kIHN0YXRzLm10aW1lLmdldFRpbWUoKSBpcyBwcmV2U3RhdHMubXRpbWUuZ2V0VGltZSgpIGFuZCBzdGF0cy5zaXplIGlzIHByZXZTdGF0cy5zaXplXG4gICAgICAgICAgICAgICAgICAgIHByZXZTdGF0cyA9IHN0YXRzXG4gICAgICAgICAgICAgICAgICAgIGZzLnJlYWRGaWxlIHNvdXJjZSwgKGVyciwgY29kZSkgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnJvciBlcnIgaWYgZXJyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2cgJ0NvbW1hbmQud2F0Y2hGaWxlIGNvbXBpbGUnLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tcGlsZVNjcmlwdCBjb2RlLnRvU3RyaW5nKCksIHNvdXJjZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIC5vbiAnZXJyb3InLCAoZXJyKSAtPlxuICAgICAgICAgICAgdGhyb3cgZXJyIHVubGVzcyBlcnIuY29kZSBpcyAnRVBFUk0nXG5cbiAgICB0cnlcbiAgICAgICAgc3RhcnRXYXRjaGVyKClcbiAgICBjYXRjaCBlcnJcbiAgICAgICAgZXJyb3IgZXJyXG5cbndhdGNoRGlyID0gKHNvdXJjZSkgLT5cbiAgICBcbiAgICBsb2cgJ0NvbW1hbmQud2F0Y2hEaXInLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuICAgIFxuICAgIHdhdGNoZXIgPSBudWxsXG5cbiAgICBzdGFydFdhdGNoZXIgPSAtPlxuXG4gICAgICAgIHRyeVxuICAgICAgICAgICAgZmlsZXMgPSBmcy5yZWFkZGlyU3luYyBzb3VyY2VcbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICByZXR1cm4gaWYgZXJyPy5jb2RlIGlzICdFTk9FTlQnXG4gICAgICAgICAgICB0aHJvdyBlcnJcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgZmlsZSBpbiBmaWxlc1xuICAgICAgICAgICAgY29udGludWUgaWYgZmlsZVswXSA9PSAnLidcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIGZpbGUgaW4gWydub2RlX21vZHVsZXMnXVxuICAgICAgICAgICAgd2F0Y2hQYXRoIHNsYXNoLmpvaW4gc291cmNlLCBmaWxlXG4gICAgICAgIFxuICAgICAgICB3YXRjaGVyID0gZnMud2F0Y2ggc291cmNlXG4gICAgICAgIC5vbiAnZXJyb3InLCAoZXJyKSAtPlxuICAgICAgICAgICAgdGhyb3cgZXJyIHVubGVzcyBlcnIuY29kZSBpcyAnRVBFUk0nXG4gICAgICAgICAgICB3YXRjaGVyLmNsb3NlKClcbiAgICAgICAgLm9uICdjaGFuZ2UnLCAoY2hhbmdlLCBwKSAtPlxuICAgICAgICAgICAgaWYgY2hhbmdlID09ICdyZW5hbWUnXG4gICAgICAgICAgICAgICAgbG9nICdDb21tYW5kLndhdGNoRGlyJywgY2hhbmdlLCBzbGFzaC5qb2luIHNvdXJjZSwgcCBpZiBvcHRzLkRlYnVnXG4gICAgICAgICAgICAgICAgd2F0Y2hQYXRoIHNsYXNoLmpvaW4gc291cmNlLCBwXG4gICAgICAgICAgICBcbiAgICB0cnlcbiAgICAgICAgc3RhcnRXYXRjaGVyKClcbiAgICBjYXRjaCBlcnJcbiAgICAgICAgcmV0dXJuIGlmIGVyci5jb2RlIGlzICdFTk9FTlQnXG4gICAgICAgIHRocm93IGVyclxuXG4jIEdldCB0aGUgY29ycmVzcG9uZGluZyBvdXRwdXQgSmF2YVNjcmlwdCBwYXRoIGZvciBhIHNvdXJjZSBmaWxlLlxuICAgIFxub3V0cHV0UGF0aCA9IChzb3VyY2UsIGV4dGVuc2lvbikgLT5cbiAgICBcbiAgICBiYXNlbmFtZSA9IGJhc2VGaWxlTmFtZSBzb3VyY2UsIHllcywgdXNlV2luUGF0aFNlcFxuICAgIGlmIG9wdHMub3V0cHV0XG4gICAgICAgIGRpciA9IG9wdHMub3V0cHV0XG4gICAgZWxzZVxuICAgICAgICBkaXIgPSBzbGFzaC5kaXJuYW1lIHNvdXJjZVxuICAgIHNsYXNoLmpvaW4gZGlyLCBiYXNlbmFtZSArIGV4dGVuc2lvblxuXG4jIFJlY3Vyc2l2ZWx5IG1rZGlyLCBsaWtlIGBta2RpciAtcGAuXG5cbm1rZGlycCA9IChkaXIsIGZuKSAtPlxuICAgIG1vZGUgPSAwbzc3NyAmIH5wcm9jZXNzLnVtYXNrKClcblxuICAgIGRvIG1rZGlycyA9IChwID0gZGlyLCBmbikgLT5cbiAgICAgICAgZnMuZXhpc3RzIHAsIChleGlzdHMpIC0+XG4gICAgICAgICAgICBpZiBleGlzdHNcbiAgICAgICAgICAgICAgICBmbigpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgbWtkaXJzIHNsYXNoLmRpcm5hbWUocCksIC0+XG4gICAgICAgICAgICAgICAgICAgIGZzLm1rZGlyIHAsIG1vZGUsIChlcnIpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm4gZXJyIGlmIGVyclxuICAgICAgICAgICAgICAgICAgICAgICAgZm4oKVxuXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgIDAwMCAgIDAwMDAwMDAgIFxuIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgICAgICAwMDAgIDAwMCAgICAgICBcbiMgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgICAgICAgMDAwICAwMDAwMDAwICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuIyAwMCAgICAgMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcblxuIyBXcml0ZSBvdXQgYSBKYXZhU2NyaXB0IHNvdXJjZSBmaWxlIHdpdGggdGhlIGNvbXBpbGVkIGNvZGUuIFxuIyBCeSBkZWZhdWx0LCBmaWxlcyBhcmUgd3JpdHRlbiBvdXQgaW4gYGN3ZGAgYXMgYC5qc2AgZmlsZXMgd2l0aCB0aGUgc2FtZSBuYW1lLCBidXQgdGhlIG91dHB1dCBkaXJlY3RvcnkgY2FuIGJlIGN1c3RvbWl6ZWQgd2l0aCBgLS1vdXRwdXRgLlxuIyBJZiBgZ2VuZXJhdGVkU291cmNlTWFwYCBpcyBwcm92aWRlZCwgdGhpcyB3aWxsIHdyaXRlIGEgYC5qcy5tYXBgIGZpbGUgaW50byB0aGUgc2FtZSBkaXJlY3RvcnkgYXMgdGhlIGAuanNgIGZpbGUuXG5cbndyaXRlSnMgPSAoc291cmNlLCBqcywganNQYXRoLCBnZW5lcmF0ZWRTb3VyY2VNYXAgPSBudWxsKSAtPlxuICAgICMgbG9nIHNvdXJjZSwganNQYXRoXG4gICAgc291cmNlTWFwUGF0aCA9IG91dHB1dFBhdGggc291cmNlLCAnLmpzLm1hcCdcbiAgICBqc0RpciA9IHNsYXNoLmRpcm5hbWUganNQYXRoXG4gICAgY29tcGlsZSA9IC0+XG4gICAgICAgIGlmIG9wdHMuY29tcGlsZVxuICAgICAgICAgICAganMgPSAnICcgaWYganMubGVuZ3RoIDw9IDBcbiAgICAgICAgICAgIGlmIGdlbmVyYXRlZFNvdXJjZU1hcCB0aGVuIGpzID0gXCIje2pzfVxcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPSN7YmFzZUZpbGVOYW1lIHNvdXJjZU1hcFBhdGgsIG5vLCB1c2VXaW5QYXRoU2VwfVxcblwiXG4gICAgICAgICAgICBmcy53cml0ZUZpbGUganNQYXRoLCBqcywgKGVycikgLT5cbiAgICAgICAgICAgICAgICBpZiBlcnJcbiAgICAgICAgICAgICAgICAgICAgcHJpbnRMaW5lIGVyci5tZXNzYWdlXG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCAxXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBvcHRzLmNvbXBpbGUgYW5kIG9wdHMud2F0Y2hcbiAgICAgICAgICAgICAgICAgICAgdGltZUxvZyBcImNvbXBpbGVkICN7c291cmNlfVwiXG4gICAgICAgIGlmIGdlbmVyYXRlZFNvdXJjZU1hcFxuICAgICAgICAgICAgZnMud3JpdGVGaWxlIHNvdXJjZU1hcFBhdGgsIGdlbmVyYXRlZFNvdXJjZU1hcCwgKGVycikgLT5cbiAgICAgICAgICAgICAgICBpZiBlcnJcbiAgICAgICAgICAgICAgICAgICAgcHJpbnRMaW5lIFwiQ291bGQgbm90IHdyaXRlIHNvdXJjZSBtYXA6ICN7ZXJyLm1lc3NhZ2V9XCJcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0IDFcbiAgICBmcy5leGlzdHMganNEaXIsIChpdEV4aXN0cykgLT5cbiAgICAgICAgaWYgaXRFeGlzdHMgdGhlbiBjb21waWxlKCkgZWxzZSBta2RpcnAganNEaXIsIGNvbXBpbGVcblxud2FpdCA9IChtaWxsaXNlY29uZHMsIGZ1bmMpIC0+IHNldFRpbWVvdXQgZnVuYywgbWlsbGlzZWNvbmRzICMgQ29udmVuaWVuY2UgZm9yIGNsZWFuZXIgc2V0VGltZW91dHMuXG5cbnRpbWVMb2cgPSAobWVzc2FnZSkgLT4gbG9nIFwiI3sobmV3IERhdGUpLnRvTG9jYWxlVGltZVN0cmluZygpfSAtICN7bWVzc2FnZX1cIlxuXG4jIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgICAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAwMDAwICAgXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgICAgMDAwICBcbiMgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuXG5wcmludFRva2VucyA9ICh0b2tlbnMpIC0+XG5cbiAgICBmb3IgaW5kZXggaW4gWzAuLi50b2tlbnMubGVuZ3RoXVxuICAgICAgICB0b2tlbiAgPSB0b2tlbnNbaW5kZXhdXG4gICAgICAgIHRhZyAgICA9IHRva2VuWzBdXG4gICAgICAgIHZhbHVlICA9IHRva2VuWzFdLnRvU3RyaW5nKCkucmVwbGFjZSgvXFxuLywgJ1xcXFxuJylcbiAgICAgICAgY3RhZyAgID0gZ3JheSB0YWdcbiAgICAgICAgY3ZhbHVlID0gYm9sZCB5ZWxsb3cgdmFsdWVcbiAgICAgICAgaW5kZXggID0gZ3JheSBkaW0gaW5kZXhcbiAgICAgICAgaWYgdGFnID09ICdURVJNSU5BVE9SJ1xuICAgICAgICAgICAgcHJpbnQgJ1xcblxcbidcbiAgICAgICAgZWxzZSBpZiB0YWcgPT0gJ0lOREVOVCdcbiAgICAgICAgICAgIHByaW50IGdyYXkgZGltICdJTkQgJ1xuICAgICAgICBlbHNlIGlmIHRhZyA9PSAnT1VUREVOVCdcbiAgICAgICAgICAgIHByaW50IGdyYXkgZGltICdPVVQgJ1xuICAgICAgICBlbHNlIGlmIHRhZyBpbiBbJ0NMQVNTJyAnUEFSQU1fU1RBUlQnICdQQVJBTV9FTkQnICdOVUxMJ11cbiAgICAgICAgICAgIHByaW50IFwiI3tpbmRleH0je2N0YWd9IFwiXG4gICAgICAgIGVsc2UgaWYgdGFnID09IHZhbHVlXG4gICAgICAgICAgICBwcmludCBcIiN7aW5kZXh9I3tjdmFsdWV9IFwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHByaW50IFwiI3tpbmRleH0je2N0YWd9PSN7Y3ZhbHVlfSBcIlxuXG4jIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcblxucHJpbnRGcmFnbWVudHMgPSAoY29kZSwgZnJhZ21lbnRzKSAtPlxuXG4gICAgbG9nIGNvZGUsIGZyYWdtZW50c1xuICAgIGxvZyAnJ1xuICAgIGZvciBpbmRleCBpbiBbMC4uLmZyYWdtZW50cy5sZW5ndGhdXG4gICAgICAgIGZyYWcgPSBmcmFnbWVudHNbaW5kZXhdXG4gICAgICAgIGxpbmUgPSAnJ1xuICAgICAgICBjb2x1bW4gPSAnJ1xuICAgICAgICBpZiBmcmFnLmxvY2F0aW9uRGF0YVxuICAgICAgICAgICAgbGluZSA9IGJsdWVCcmlnaHQgJycrZnJhZy5sb2NhdGlvbkRhdGEuZmlyc3RfbGluZSBcbiAgICAgICAgICAgIGlmIGZyYWcubG9jYXRpb25EYXRhLmxhc3RfbGluZSAhPSBmcmFnLmxvY2F0aW9uRGF0YS5maXJzdF9saW5lIFxuICAgICAgICAgICAgICAgIGxpbmUgKz0gZGltIGJsdWUgJy0nK2ZyYWcubG9jYXRpb25EYXRhLmxhc3RfbGluZVxuICAgICAgICAgICAgZWxzZSBsaW5lICs9ICcgICdcbiAgICAgICAgICAgIGNvbHVtbiA9IGJsdWUgJycrZnJhZy5sb2NhdGlvbkRhdGEuZmlyc3RfY29sdW1uIFxuICAgICAgICB0cmltbWVkID0gZnJhZy5jb2RlLnJlcGxhY2UoLyAvZywgJycpXG4gICAgICAgIGlmIHRyaW1tZWQubGVuZ3RoXG4gICAgICAgICAgICBpZiB0cmltbWVkLnJlcGxhY2UoL1xcbi9nLCAnJykubGVuZ3RoID09IDBcbiAgICAgICAgICAgICAgICBsb2cgJydcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBsb2cgbGluZSArICcgJyArIGNvbHVtbiArICcgJyArICAoZGltIGdyYXkgaGVscGVycy5wYWQgZnJhZy50eXBlLCAyMCkgKyB5ZWxsb3dCcmlnaHQoZnJhZy5jb2RlKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAjIG1hcCA9IEtvZmZlZS5jb21waWxlIGNvZGUsIFxuICAgICAgICAgICAgIyBmZWF0dXJlOiBoZWFkZXI6IHRydWVcbiAgICAgICAgICAgICMgZmlsZW5hbWU6ICdmcmFnbWVudHMnXG4gICAgICAgICAgICAjIHNvdXJjZU1hcDogeWVzXG4gICAgICAgICAgICAjICMgaW5saW5lTWFwOiB5ZXNcblxuICAgICMgbWFwTGluZVRvU3RyaW5nID0gKG1hcGxpbmUsIGtleT0nc291cmNlTGluZScpIC0+XG4gICAgICAgICMgcyA9ICcnXG4gICAgICAgICMgZm9yIGNvbHVtbiBpbiBtYXBsaW5lLmNvbHVtbnNcbiAgICAgICAgICAgICMgaWYgY29sdW1uXG4gICAgICAgICAgICAgICAgIyBzICs9IGNvbHVtbltrZXldJTEwXG4gICAgICAgICAgICAjIGVsc2VcbiAgICAgICAgICAgICAgICAjIHMgKz0gJyAnXG4gICAgICAgICMgc1xuIyAgICAgICAgICAgICBcbiAgICAjIGxvZyBncmF5IGRpbSAnIDEyMzQ1Njc4OSAxMjM0NTY3ODkgMTIzNDU2Nzg5IDEyMzQ1Njc4OSAxMjM0NTY3ODknXG4gICAgIyBjb2RlTGluZXMgPSBjb2RlLnNwbGl0ICdcXG4nXG4gICAgIyBmb3IgaSBpbiBbMC4uLmNvZGVMaW5lcy5sZW5ndGhdXG4gICAgICAgICMgaWYgY29kZUxpbmVzW2ldLnRyaW0oKS5sZW5ndGhcbiAgICAgICAgICAgICMgbG9nIGdyYXkoZGltIGkrMSkgKyBncmVlbkJyaWdodCBjb2RlTGluZXNbaV1cbiAgICAgICAgIyBlbHNlIGxvZyAnJ1xuIyAgICAgICAgICAgICBcbiAgICAjIGxvZyAnJ1xuICAgICMgbG9nIGdyYXkgZGltICcgMTIzNDU2Nzg5IDEyMzQ1Njc4OSAxMjM0NTY3ODkgMTIzNDU2Nzg5IDEyMzQ1Njc4OSdcbiAgICAjIGNvZGVMaW5lcyA9IG1hcC5qcy5zcGxpdCAnXFxuJ1xuICAgICMgZm9yIGkgaW4gWzAuLi5jb2RlTGluZXMubGVuZ3RoXVxuICAgICAgICAjIGlmIGNvZGVMaW5lc1tpXS50cmltKCkubGVuZ3RoXG4gICAgICAgICAgICAjIGxvZyBncmF5KGRpbSBpKzEpICsgcmVkQnJpZ2h0IGNvZGVMaW5lc1tpXVxuICAgICAgICAjIGVsc2UgbG9nICcnXG4gICAgICAgICAgICBcbiAgICAjIGxvZyBncmF5IGRpbSAnIDEyMzQ1Njc4OSAxMjM0NTY3ODkgMTIzNDU2Nzg5IDEyMzQ1Njc4OSAxMjM0NTY3ODknICAgIFxuICAgICMgZm9yIGkgaW4gWzAuLi5tYXAuc291cmNlTWFwLmxpbmVzLmxlbmd0aF1cbiAgICAgICAgIyBtYXBsaW5lID0gbWFwLnNvdXJjZU1hcC5saW5lc1tpXVxuICAgICAgICAjIGlmIG1hcGxpbmVcbiAgICAgICAgICAgICMgbG9nIGdyYXkoZGltIGkrMSkgKyByZWRCcmlnaHQgbWFwTGluZVRvU3RyaW5nIG1hcGxpbmVcbiAgICAgICAgIyBlbHNlIGxvZyAnJ1xuXG4gICAgIyBsb2cgZ3JheSBkaW0gJyAxMjM0NTY3ODkgMTIzNDU2Nzg5IDEyMzQ1Njc4OSAxMjM0NTY3ODkgMTIzNDU2Nzg5JyAgICBcbiAgICAjIGZvciBpIGluIFswLi4ubWFwLnNvdXJjZU1hcC5saW5lcy5sZW5ndGhdXG4gICAgICAgICMgbWFwbGluZSA9IG1hcC5zb3VyY2VNYXAubGluZXNbaV1cbiAgICAgICAgIyBpZiBtYXBsaW5lXG4gICAgICAgICAgICAjIGxvZyBncmF5KGRpbSBpKzEpICsgYmx1ZUJyaWdodCBtYXBMaW5lVG9TdHJpbmcgbWFwbGluZSwgJ3NvdXJjZUNvbHVtbidcbiAgICAgICAgIyBlbHNlIGxvZyAnJ1xuICAgICAgICAgICAgXG4jIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcblxucHJpbnRSZXdyaXRlciA9ICh0b2tlbnMpIC0+XG5cbiAgICBpbmRlbnQgPSAwXG4gICAgZm9yIGluZGV4IGluIFswLi4udG9rZW5zLmxlbmd0aF1cbiAgICAgICAgdG9rZW4gPSB0b2tlbnNbaW5kZXhdXG4gICAgICAgIHRhZyAgID0gdG9rZW5bMF1cbiAgICAgICAgdmFsdWUgPSB0b2tlblsxXVxuICAgICAgICBcbiAgICAgICAgZ3JheURpbSA9IChzKSAtPiBkaW0gZ3JheSBzXG4gICAgICAgIGJsdWVEaW0gPSAocykgLT4gZGltIGJsdWUgc1xuICAgICAgICB5ZWxsb3dEaW0gPSAocykgLT4gZGltIHllbGxvdyBzXG4gICAgICAgIHNwYWNlZCA9IChjb2xvciwgdiktPlxuICAgICAgICAgICAgcHJpbnQgY29sb3IgXCIje3YgPyB2YWx1ZX1cIlxuICAgICAgICAgICAgcHJpbnQgJyAnIGlmIHRva2VuLnNwYWNlZCBhbmQgdG9rZW5zW2luZGV4KzFdWzBdIG5vdCBpbiBbJ0NBTExfU1RBUlQnXVxuXG4gICAgICAgICMgbG9nIHRva2VuXG4gICAgICAgIHN3aXRjaCB0YWcgXG4gICAgICAgICAgICB3aGVuICdURVJNSU5BVE9SJyAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcHJpbnQgXCJcXG4je3BhZCAnJywgaW5kZW50fVwiXG4gICAgICAgICAgICB3aGVuICdJTkRFTlQnICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gaW5kZW50ICs9IDQ7IHByaW50IFwiXFxuI3twYWQgJycsIGluZGVudH1cIlxuICAgICAgICAgICAgd2hlbiAnT1VUREVOVCcgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIGluZGVudCAtPSA0OyBwcmludCBcIlxcbiN7cGFkICcnLCBpbmRlbnR9XCJcbiAgICAgICAgICAgIHdoZW4gJ0hFUkVDT01NRU5UJyAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgZ3JheURpbVxuICAgICAgICAgICAgd2hlbiAnQ0FMTF9TVEFSVCcgJ0NBTExfRU5EJyAgICAgICAgICAgICB0aGVuIHNwYWNlZCBncmF5RGltXG4gICAgICAgICAgICB3aGVuICdVTkFSWScgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGJsdWVCcmlnaHQsICdub3QnXG4gICAgICAgICAgICB3aGVuICcmJicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGJsdWVCcmlnaHQsICdhbmQnXG4gICAgICAgICAgICB3aGVuICd8fCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGJsdWVCcmlnaHQsICdvcidcbiAgICAgICAgICAgIHdoZW4gJ1NUUklORycgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgZ3JlZW5cbiAgICAgICAgICAgIHdoZW4gJ1NUUklOR19TVEFSVCcgJ1NUUklOR19FTkQnICAgICAgICAgdGhlbiBzcGFjZWQgcmVkQnJpZ2h0XG4gICAgICAgICAgICB3aGVuICdQUk9QRVJUWScgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIHllbGxvd1xuICAgICAgICAgICAgd2hlbiAnOicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCB5ZWxsb3dEaW1cbiAgICAgICAgICAgIHdoZW4gJ0AnIFxuICAgICAgICAgICAgICAgIGlmIHRva2Vuc1tpbmRleCsxXVswXSBub3QgaW4gWydNRVRBX0lGJyAnTUVUQV9FTFNFJyAnUE9TVF9NRVRBX0lGJ10gdGhlbiBzcGFjZWQoeWVsbG93RGltKSBlbHNlIHNwYWNlZCBibHVlRGltXG4gICAgICAgICAgICB3aGVuICdNRVRBX0lGJyAnTUVUQV9FTFNFJyAnUE9TVF9NRVRBX0lGJyB0aGVuIHNwYWNlZCBibHVlLCAn4pa4Jyt2YWx1ZVxuICAgICAgICAgICAgd2hlbiAnTlVNQkVSJyAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCBibHVlXG4gICAgICAgICAgICB3aGVuICd7Jyd9JyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gaWYgbm90IHRva2VuLmdlbmVyYXRlZCB0aGVuIHNwYWNlZCBncmF5XG4gICAgICAgICAgICB3aGVuICc9JyAnKycgJy0nICcrKycgJy0tJyAnLi4uJyAnOjonIFxcXG4gICAgICAgICAgICAgICAgICdbJyAnXScgJ3snICd9JyAnLicgJ01BVEgnICdVTkFSWV9NQVRIJyBcXFxuICAgICAgICAgICAgICAgICAnSU5ERVhfU1RBUlQnICdJTkRFWF9FTkQnIFxcXG4gICAgICAgICAgICAgICAgICdDT01QQVJFJyAnQ09NUE9VTkRfQVNTSUdOJyAgICAgICAgIHRoZW4gc3BhY2VkIGdyYXlcbiAgICAgICAgICAgIHdoZW4gJywnICcoJyAnKScgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgZ3JheURpbVxuICAgICAgICAgICAgd2hlbiAnUEFSQU1fU1RBUlQnICdQQVJBTV9FTkQnICctPicgJz0+JyB0aGVuIHNwYWNlZCAocykgLT4gYm9sZCBibHVlIHNcbiAgICAgICAgICAgIHdoZW4gJ05VTEwnICdVTkRFRklORUQnICdGVU5DX0VYSVNUJyAnPycgJz8uJyAnQklOPycgdGhlbiBzcGFjZWQgcmVkXG4gICAgICAgICAgICB3aGVuICdSRUdFWCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIG1hZ2VudGFcbiAgICAgICAgICAgIHdoZW4gJ0ZPUicgJ0ZPUklOJyAnVFJZJyAnQ0FUQ0gnICdUSFJPVycgJ1JFTEFUSU9OJyAnRVhURU5EUycgJ1NUQVRFTUVOVCcgJ09XTicgJ0ZPUk9GJyAnTE9PUCcgXFxcbiAgICAgICAgICAgICAgICAgJ0lGJyAnUE9TVF9JRicgJ1dIRU4nICdUSEVOJyAnRUxTRScgJ1RISVMnICdTVVBFUicgJ1NXSVRDSCcgJ0xFQURJTkdfV0hFTicgJ1dISUxFJyBcXFxuICAgICAgICAgICAgICAgICAnQk9PTCcgJ0NMQVNTJyAnUkVUVVJOJyAgICAgICAgICAgICB0aGVuIHNwYWNlZCBibHVlQnJpZ2h0XG4gICAgICAgICAgICB3aGVuICdJREVOVElGSUVSJyBcbiAgICAgICAgICAgICAgICBzd2l0Y2ggdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAncmVxdWlyZScgdGhlbiBzcGFjZWQgZ3JheVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHNwYWNlZCB3aGl0ZUJyaWdodFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHByaW50IFwiPiN7dGFnfTxcIlxuICAgICAgICAgICAgICAgICMgc3BhY2VkIChzKSAtPiBib2xkIGJsdWVCcmlnaHQgc1xuICAgICAgICAgICAgICAgIHNwYWNlZCBjeWFuXG4gICAgICAgICAgICBcbnZlcnNpb24gPSAtPiBwcmludExpbmUgXCIje0tvZmZlZS5WRVJTSU9OfVwiXG51c2FnZSAgID0gLT4gXG5cbiAgICBsaW5lcyA9IFtcIiN7Z3JheSAnVXNhZ2U6J30gI3t5ZWxsb3cgJ2tvZmZlZSd9ICN7Z3JheSAnW29wdGlvbnNdJ30gcGF0aC90by9zY3JpcHQgI3tncmF5ICdbb3B0aW9uc10nfVxcblwiXVxuICAgIFxuICAgIHJ1bGVzID0gU1dJVENIRVMubWFwIChydWxlKSAtPlxuICAgICAgICBbc2hvcnQsIGxvbmcsIGRlc2NyaXB0aW9uXSA9IHJ1bGVcbiAgICAgICAgbG9uZ0ZsYWcgPSBsb25nLm1hdGNoKC9eKC0tXFx3W1xcd1xcLV0qKS8pWzFdXG4gICAgICAgIGNzaG9ydCAgID0gaWYgc2hvcnQgdGhlbiBncmF5KHNob3J0WzBdKSArIGJvbGQoZ3JheShzaG9ydFsxLi5dKSkgKyAnICAnIGVsc2UgJyAgICAnXG4gICAgICAgIGNsb25nICAgID0gcGFkIGxvbmcsIDIwXG4gICAgICAgIGNsb25nICAgID0gZ3JheShjbG9uZ1swLi4xXSkgKyBib2xkKHdoaXRlKGNsb25nWzIuLl0uc3BsaXQoJyAnKVswXSkpICsgJyAnICsgYm9sZChibHVlQnJpZ2h0KGNsb25nWzIuLl0uc3BsaXQoJyAnKVsxLi5dLmpvaW4oJyAnKSkpXG4gICAgICAgIGxpbmVzLnB1c2ggJyAgICAnICsgY3Nob3J0ICsgY2xvbmcgKyBncmF5IGRlc2NyaXB0aW9uXG4gICAgICAgIFxuICAgIGxpbmVzLnB1c2ggZ3JheSAnXFxuSWYgY2FsbGVkIHdpdGhvdXQgYSBzY3JpcHQsIHRoZSBpbnRlcmFjdGl2ZSBSRVBMIHdpbGwgYmUgc3RhcnRlZCdcbiAgICAgICAgXG4gICAgbG9nIFwiXFxuI3sgbGluZXMuam9pbignXFxuJykgfVxcblwiXG4gICAgICAgIFxuIl19
//# sourceURL=../coffee/command.coffee