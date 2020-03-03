// koffee 1.7.0

/*
 0000000   0000000   00     00  00     00   0000000   000   000  0000000    
000       000   000  000   000  000   000  000   000  0000  000  000   000  
000       000   000  000000000  000000000  000000000  000 0 000  000   000  
000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  
 0000000   0000000   000   000  000   000  000   000  000   000  0000000
 */
var FEATURES, Koffee, SWITCHES, baseFileName, compilePath, compileScript, compileStdio, error, exec, findDirectoryIndex, fs, helpers, hidden, isCoffee, logFeatures, makePrelude, merge, mkdirp, nopt, opts, outputPath, pad, parseOptions, print, printFragments, printLine, printRewriter, printTokens, printWarn, ref, ref1, run, slash, spawn, startRepl, stringify, timeLog, usage, useWinPathSep, version, wait, watchDir, watchFile, watchPath, writeJs;

fs = require('fs');

slash = require('kslash');

nopt = require('nopt');

helpers = require('./helpers');

Koffee = require('./koffee');

ref = require('child_process'), spawn = ref.spawn, exec = ref.exec;

useWinPathSep = slash.sep === '\\';

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
    o.generatedFile = o.output;
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
    var eval, j, k, len, len1, literals, ref2, ref3, results, source;
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
        for (j = 0, len = ref2.length; j < len; j++) {
            eval = ref2[j];
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
    ref3 = opts["arguments"];
    results = [];
    for (k = 0, len1 = ref3.length; k < len1; k++) {
        source = ref3[k];
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
    var code, err, file, files, j, len, ref2, ref3, ref4, results, source, stats, topLevel;
    source = (ref2 = arg.source) != null ? ref2 : null, topLevel = (ref3 = arg.topLevel) != null ? ref3 : false;
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
        if ((ref4 = slash.basename(source)) === 'node_modules' || ref4 === '.git') {
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
        for (j = 0, len = files.length; j < len; j++) {
            file = files[j];
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
    var err, ext, index, j, len, ref2;
    ref2 = Koffee.FILE_EXTENSIONS;
    for (j = 0, len = ref2.length; j < len; j++) {
        ext = ref2[j];
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
    var base, compiled, err, message, o, options, t, task;
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
        var err, file, files, j, len;
        try {
            files = fs.readdirSync(source);
        } catch (error1) {
            err = error1;
            if ((err != null ? err.code : void 0) === 'ENOENT') {
                return;
            }
            throw err;
        }
        for (j = 0, len = files.length; j < len; j++) {
            file = files[j];
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
    var ctag, cvalue, index, j, ref2, results, tag, token, value;
    results = [];
    for (index = j = 0, ref2 = tokens.length; 0 <= ref2 ? j < ref2 : j > ref2; index = 0 <= ref2 ? ++j : --j) {
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
    var codeLines, column, frag, i, index, j, k, line, m, map, mapLineToString, mapline, n, q, ref2, ref3, ref4, ref5, ref6, results, trimmed;
    console.log('');
    for (index = j = 0, ref2 = fragments.length; 0 <= ref2 ? j < ref2 : j > ref2; index = 0 <= ref2 ? ++j : --j) {
        frag = fragments[index];
        line = blueBright('' + frag.locationData.first_line);
        if (frag.locationData.last_line !== frag.locationData.first_line) {
            line += dim(blue('-' + frag.locationData.last_line));
        } else {
            line += '  ';
        }
        column = blue('' + frag.locationData.first_column);
        trimmed = frag.code.replace(/ /g, '');
        if (trimmed.length) {
            if (trimmed.replace(/\n/g, '').length === 0) {
                console.log('');
            } else {
                console.log(line + ' ' + column + ' ' + (dim(gray(helpers.pad(frag.type, 20)))) + yellowBright(frag.code));
            }
        }
    }
    map = Koffee.compile(code, {
        feature: {
            header: true
        },
        filename: 'fragments',
        sourceMap: true
    });
    mapLineToString = function(mapline, key) {
        var k, len, ref3, s;
        if (key == null) {
            key = 'sourceLine';
        }
        s = '';
        ref3 = mapline.columns;
        for (k = 0, len = ref3.length; k < len; k++) {
            column = ref3[k];
            if (column) {
                s += column[key] % 10;
            } else {
                s += ' ';
            }
        }
        return s;
    };
    console.log(gray(dim(' 123456789 123456789 123456789 123456789 123456789')));
    codeLines = code.split('\n');
    for (i = k = 0, ref3 = codeLines.length; 0 <= ref3 ? k < ref3 : k > ref3; i = 0 <= ref3 ? ++k : --k) {
        if (codeLines[i].trim().length) {
            console.log(gray(dim(i + 1)) + greenBright(codeLines[i]));
        } else {
            console.log('');
        }
    }
    console.log('');
    console.log(gray(dim(' 123456789 123456789 123456789 123456789 123456789')));
    codeLines = map.js.split('\n');
    for (i = m = 0, ref4 = codeLines.length; 0 <= ref4 ? m < ref4 : m > ref4; i = 0 <= ref4 ? ++m : --m) {
        if (codeLines[i].trim().length) {
            console.log(gray(dim(i + 1)) + redBright(codeLines[i]));
        } else {
            console.log('');
        }
    }
    console.log(gray(dim(' 123456789 123456789 123456789 123456789 123456789')));
    for (i = n = 0, ref5 = map.sourceMap.lines.length; 0 <= ref5 ? n < ref5 : n > ref5; i = 0 <= ref5 ? ++n : --n) {
        mapline = map.sourceMap.lines[i];
        if (mapline) {
            console.log(gray(dim(i + 1)) + redBright(mapLineToString(mapline)));
        } else {
            console.log('');
        }
    }
    console.log(gray(dim(' 123456789 123456789 123456789 123456789 123456789')));
    results = [];
    for (i = q = 0, ref6 = map.sourceMap.lines.length; 0 <= ref6 ? q < ref6 : q > ref6; i = 0 <= ref6 ? ++q : --q) {
        mapline = map.sourceMap.lines[i];
        if (mapline) {
            results.push(console.log(gray(dim(i + 1)) + blueBright(mapLineToString(mapline, 'sourceColumn'))));
        } else {
            results.push(console.log(''));
        }
    }
    return results;
};

printRewriter = function(tokens) {
    var blueDim, grayDim, indent, index, j, ref2, ref3, results, spaced, tag, token, value, yellowDim;
    indent = 0;
    results = [];
    for (index = j = 0, ref2 = tokens.length; 0 <= ref2 ? j < ref2 : j > ref2; index = 0 <= ref2 ? ++j : --j) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBaUJBLEVBQUEsR0FBbUIsT0FBQSxDQUFRLElBQVI7O0FBQ25CLEtBQUEsR0FBbUIsT0FBQSxDQUFRLFFBQVI7O0FBQ25CLElBQUEsR0FBbUIsT0FBQSxDQUFRLE1BQVI7O0FBQ25CLE9BQUEsR0FBbUIsT0FBQSxDQUFRLFdBQVI7O0FBQ25CLE1BQUEsR0FBbUIsT0FBQSxDQUFRLFVBQVI7O0FBQ25CLE1BQW1CLE9BQUEsQ0FBUSxlQUFSLENBQW5CLEVBQUUsaUJBQUYsRUFBUzs7QUFFVCxhQUFBLEdBQW1CLEtBQUssQ0FBQyxHQUFOLEtBQWE7O0FBRWhDLE9BQU8sQ0FBQyxNQUFSLENBQUE7O0FBRUEsT0FBNEIsT0FBQSxDQUFRLFlBQVIsQ0FBNUIsRUFBRSx3QkFBRixFQUFZOztBQUVWLG1DQUFGLEVBQWdCLDJCQUFoQixFQUEwQiw2QkFBMUIsRUFBcUMscUJBQXJDLEVBQTRDOztBQUU1QyxLQUFBLEdBQVksT0FBTyxDQUFDOztBQUNwQixLQUFBLEdBQVksU0FBQyxJQUFEO1dBQVUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFmLENBQXFCLElBQXJCO0FBQVY7O0FBQ1osU0FBQSxHQUFZLFNBQUMsSUFBRDtXQUFVLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBZixDQUFxQixJQUFBLEdBQU8sSUFBNUI7QUFBVjs7QUFDWixTQUFBLEdBQVksU0FBQyxJQUFEO1dBQVUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFmLENBQXFCLElBQUEsR0FBTyxJQUE1QjtBQUFWOztBQUNaLE1BQUEsR0FBWSxTQUFDLElBQUQ7V0FBVSxRQUFRLENBQUMsSUFBVCxDQUFjLElBQWQ7QUFBVjs7QUFFWixRQUFBLEdBQVcsQ0FDUCxDQUFDLElBQUQsRUFBTSxRQUFOLEVBQTRCLDhDQUE1QixFQUFvRixPQUFwRixDQURPLEVBRVAs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LENBQUosR0FBd0IsSUFGd0Q7QUFaOUUiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICBcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiMjI1xuXG4jIGhhbmRsZSB2YXJpb3VzIHRhc2tzOiBcbiNcbiMgICAtIGNvbXBpbGUgYW5kIHNhdmUgaW50byBgLmpzYCBmaWxlcyBcbiMgICAtIGNvbXBpbGUgYW5kIHByaW50IHRvIHN0ZG91dCBcbiMgICAtIHJlY29tcGlsZSBpZiB0aGUgc291cmNlIGNoYW5nZXNcbiMgICAtIHByaW50IGxleGVyIHRva2Vuc1xuIyAgIC0gcHJpbnQgYSBzeW50YXggdHJlZVxuIyAgIC0gbGF1bmNoIGEgUkVQTFxuXG5mcyAgICAgICAgICAgICAgID0gcmVxdWlyZSAnZnMnXG5zbGFzaCAgICAgICAgICAgID0gcmVxdWlyZSAna3NsYXNoJ1xubm9wdCAgICAgICAgICAgICA9IHJlcXVpcmUgJ25vcHQnXG5oZWxwZXJzICAgICAgICAgID0gcmVxdWlyZSAnLi9oZWxwZXJzJ1xuS29mZmVlICAgICAgICAgICA9IHJlcXVpcmUgJy4va29mZmVlJ1xueyBzcGF3biwgZXhlYyB9ICA9IHJlcXVpcmUgJ2NoaWxkX3Byb2Nlc3MnXG5cbnVzZVdpblBhdGhTZXAgICAgPSBzbGFzaC5zZXAgaXMgJ1xcXFwnXG5cbmhlbHBlcnMuY29sb3JzKClcblxueyBGRUFUVVJFUywgbG9nRmVhdHVyZXMgfSA9IHJlcXVpcmUgJy4vZmVhdHVyZXMnXG5cbnsgYmFzZUZpbGVOYW1lLCBpc0NvZmZlZSwgc3RyaW5naWZ5LCBtZXJnZSwgcGFkIH0gPSBoZWxwZXJzXG5cbmVycm9yICAgICA9IGNvbnNvbGUuZXJyb3JcbnByaW50ICAgICA9IChsaW5lKSAtPiBwcm9jZXNzLnN0ZG91dC53cml0ZSBsaW5lXG5wcmludExpbmUgPSAobGluZSkgLT4gcHJvY2Vzcy5zdGRvdXQud3JpdGUgbGluZSArICdcXG4nICMgPz8/XG5wcmludFdhcm4gPSAobGluZSkgLT4gcHJvY2Vzcy5zdGRlcnIud3JpdGUgbGluZSArICdcXG4nICMgPz8/XG5oaWRkZW4gICAgPSAoZmlsZSkgLT4gL15cXC58fiQvLnRlc3QgZmlsZVxuXG5TV0lUQ0hFUyA9IFtcbiAgICBbJy1iJyAnLS1iYXJlJyAgICAgICAgICAgICAgJ2NvbXBpbGUgd2l0aG91dCBhIHRvcC1sZXZlbCBmdW5jdGlvbiB3cmFwcGVyJyAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctYycgJy0tY29tcGlsZScgICAgICAgICAgICdjb21waWxlIHRvIEphdmFTY3JpcHQgYW5kIHNhdmUgYXMgLmpzIGZpbGVzJyAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLWQnICctLWRvYycgICAgICAgICAgICAgICAnbG9nIHRoZSDilrhkb2Mgc2VjdGlvbnMnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLWUnICctLWV2YWwgU1RSSU5HJyAgICAgICAnZXZhbHVhdGUgYSBzdHJpbmcgYW5kIHByaW50IHRoZSByZXN1bHQnICAgICAgICAgICAgICAgW1N0cmluZywgQXJyYXldIF1cbiAgICBbJy1mJyAnLS1mZWF0dXJlcycgICAgICAgICAgJ2xpc3QgYXZhaWxhYmxlIGZlYXR1cmVzJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWycnICAgJy0tbm8tYGZlYXR1cmUnICAgICAgICdkaXNhYmxlIGEgZmVhdHVyZSwgZS5nLiAtLW5vLW5lZ2F0aXZlLWluZGV4JyAgICAgICAgICAgbnVsbCAgICAgICAgICAgXVxuICAgIFsnLWgnICctLWhlbHAnICAgICAgICAgICAgICAnZGlzcGxheSB0aGlzIGhlbHAgbWVzc2FnZScgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1qJyAnLS1qcycgICAgICAgICAgICAgICAgJ3ByaW50IHRoZSBjb21waWxlZCBKYXZhU2NyaXB0JyAgICAgICAgICAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctbScgJy0tbWFwJyAgICAgICAgICAgICAgICdnZW5lcmF0ZSBzb3VyY2UgbWFwIGFuZCBzYXZlIGFzIC5qcy5tYXAgZmlsZXMnICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLU0nICctLWlubGluZS1tYXAnICAgICAgICAnZ2VuZXJhdGUgc291cmNlIG1hcCBhbmQgaW5jbHVkZSBpdCBkaXJlY3RseSBpbiBvdXRwdXQnIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJycgICAnLS1tZXRhbG9nJyAgICAgICAgICAgJ21ldGEgbG9nIChkZWZhdWx0OiBjb25zb2xlLmxvZyknICAgICAgICAgICAgICAgICAgICAgICBTdHJpbmcgICAgICAgICBdXG4gICAgWyctbicgJy0tbm9vcCcgICAgICAgICAgICAgICdkb2VzIG5vdGhpbmcsIGZvciBkZWJ1Z2dpbmcgcHVycG9zZXMnICAgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLW8nICctLW91dHB1dCBESVInICAgICAgICAnc2V0IHRoZSBvdXRwdXQgZGlyZWN0b3J5IGZvciBjb21waWxlZCBKYXZhU2NyaXB0JyAgICAgIFN0cmluZyAgICAgICAgIF1cbiAgICBbJy1yJyAnLS1yZXF1aXJlIE1PRFVMRScgICAgJ3JlcXVpcmUgdGhlIGdpdmVuIG1vZHVsZSBiZWZvcmUgZXZhbCBvciBSRVBMJyAgICAgICAgIFtTdHJpbmcsIEFycmF5XSBdXG4gICAgWyctQycgJy0tY29mZmVlJyAgICAgICAgICAgICdwcmludCB0aGUgdG9rZW4gc3RyZWFtIGFzIENvZmZlZVNjcmlwdCcgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLXMnICctLXN0ZGlvJyAgICAgICAgICAgICAnbGlzdGVuIGZvciBhbmQgY29tcGlsZSBzY3JpcHRzIG92ZXIgc3RkaW8nICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy10JyAnLS10ZXN0JyAgICAgICAgICAgICAgJ2NvbXBpbGUgYW5kIHJ1biB0aGUgQHRlc3QgY29kZScgICAgICAgICAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctVCcgJy0tdG9rZW5zJyAgICAgICAgICAgICdwcmludCB0aGUgdG9rZW5zJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLUYnICctLWZyYWdtZW50cycgICAgICAgICAncHJpbnQgdGhlIGZyYWdtZW50cycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1QJyAnLS1wYXJzZScgICAgICAgICAgICAgJ3ByaW50IHRoZSBwYXJzZSB0cmVlJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctdicgJy0tdmVyc2lvbicgICAgICAgICAgICdkaXNwbGF5IHRoZSB2ZXJzaW9uIG51bWJlcicgICAgICAgICAgICAgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLXcnICctLXdhdGNoJyAgICAgICAgICAgICAnd2F0Y2ggc2NyaXB0cyBmb3IgY2hhbmdlcyBhbmQgcmVydW4gY29tbWFuZHMnICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbl1cblxub3B0cyA9IHt9XG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgIFxuIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgXG5cbnBhcnNlT3B0aW9ucyA9IC0+XG5cbiAgICBrbm93biA9IERlYnVnOkJvb2xlYW5cbiAgICBzaG9ydCA9IEQ6Jy0tRGVidWcnIHA6Jy0tanMnXG4gICAgU1dJVENIRVMubWFwIChzKSAtPiBsID0gc1sxXS5zcGxpdCgnICcpWzBdWzIuLl07IGtub3duW2xdID0gc1szXSBpZiBzWzNdOyBzaG9ydFtzWzBdWzFdXSA9IFwiLS0je2x9XCIgaWYgc1swXSE9JydcbiAgICBGRUFUVVJFUy5tYXAgKGYpIC0+IGtub3duW2YubGFnXSA9IEJvb2xlYW5cbiAgICBcbiAgICBvID0gb3B0cyA9IG5vcHQga25vd24sIHNob3J0XG4gICAgICAgIFxuICAgIG8uY29tcGlsZSAgb3I9ICEhby5vdXRwdXRcbiAgICBvLmFyZ3VtZW50cyAgPSBvLmFyZ3YucmVtYWluXG4gICAgby5wcmVsdWRlICAgID0gbWFrZVByZWx1ZGUgby5yZXF1aXJlIGlmIG8ucmVxdWlyZVxuICAgIG8ucnVuICAgICAgICA9IG5vdCAoby5jb21waWxlIG9yIG8uanMgb3Igby5tYXAgb3Igby50b2tlbnMgb3Igby5wYXJzZSlcbiAgICBvLmpzICAgICAgICAgPSAhIShvLmpzIG9yIG8uZXZhbCBvciBvLnN0ZGlvIGFuZCBvLmNvbXBpbGUpICMganMgb3V0cHV0IGlzIHBhc3NlZCB0byBldmFsIGFuZCBzdGRpbyBjb21waWxlXG4gICAgXG4gICAgby5zb3VyY2VNYXAgID0gby5tYXBcbiAgICBvLmlubGluZU1hcCAgPSBvWydpbmxpbmUtbWFwJ11cbiAgICBvLmdlbmVyYXRlZEZpbGUgPSBvLm91dHB1dFxuICAgIFxuICAgIG8uZmVhdHVyZSA9IHt9XG4gICAgRkVBVFVSRVMubWFwIChmKSAtPiBvLmZlYXR1cmVbZi5rZXldID0gb1tmLmZsYWddID8gdHJ1ZTsgZGVsZXRlIG9bZi5mbGFnXVxuICAgIFxuICAgIGlmIG8uRGVidWdcbiAgICAgICAgZGVsZXRlIG8uYXJndlxuICAgICAgICBsb2cgc3RyaW5naWZ5IG9cblxuIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4jIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG5cbnJ1biA9IC0+XG4gICAgXG4gICAgcGFyc2VPcHRpb25zKClcbiAgICBcbiAgICBpZiBvcHRzLmZlYXR1cmUuY29sb3IgPT0gZmFsc2VcbiAgICAgICAgY29sb3JldHRlLm9wdGlvbnMuZW5hYmxlZCA9IGZhbHNlXG4gICAgICAgIFxuICAgIHJldHVybiBsb2dGZWF0dXJlcygpICBpZiBvcHRzLmZlYXR1cmVzXG4gICAgcmV0dXJuIHVzYWdlKCkgICAgICAgIGlmIG9wdHMuaGVscFxuICAgIHJldHVybiB2ZXJzaW9uKCkgICAgICBpZiBvcHRzLnZlcnNpb25cbiAgICByZXR1cm4gc3RhcnRSZXBsKCkgICAgaWYgb3B0cy5pbnRlcmFjdGl2ZVxuICAgIHJldHVybiBjb21waWxlU3RkaW8oKSBpZiBvcHRzLnN0ZGlvXG4gICAgaWYgb3B0cy5ldmFsXG4gICAgICAgIGZvciBldmFsIGluIG9wdHMuZXZhbFxuICAgICAgICAgICAgY29tcGlsZVNjcmlwdCBldmFsXG4gICAgICAgIHJldHVyblxuICAgIHJldHVybiBzdGFydFJlcGwoKSAgICBpZiBub3Qgb3B0cy5hcmd1bWVudHMubGVuZ3RoXG4gICAgXG4gICAgbGl0ZXJhbHMgPSBpZiBub3Qgb3B0cy53YXRjaCBhbmQgbm90IG9wdHMuY29tcGlsZSB0aGVuIG9wdHMuYXJndW1lbnRzLnNwbGljZSAxIGVsc2UgW11cbiAgICBcbiAgICBwcm9jZXNzLmFyZ3YgPSBwcm9jZXNzLmFyZ3ZbMC4uMV0uY29uY2F0IGxpdGVyYWxzXG4gICAgcHJvY2Vzcy5hcmd2WzBdID0gJ2tvZmZlZSdcblxuICAgIG9wdHMub3V0cHV0ID0gc2xhc2gucmVzb2x2ZSBvcHRzLm91dHB1dCBpZiBvcHRzLm91dHB1dFxuICAgIGZvciBzb3VyY2UgaW4gb3B0cy5hcmd1bWVudHNcbiAgICAgICAgc291cmNlID0gc2xhc2gucmVzb2x2ZSBzb3VyY2VcbiAgICAgICAgXG4gICAgICAgIGlmIG9wdHMud2F0Y2hcbiAgICAgICAgICAgIHdhdGNoUGF0aCBzb3VyY2VcbiAgICAgICAgZWxzZSAgICAgXG4gICAgICAgICAgICBjb21waWxlUGF0aCBzb3VyY2U6c291cmNlLCB0b3BMZXZlbDp5ZXNcblxuZXhwb3J0cy5ydW4gPSBydW5cbiAgICAgICAgXG5zdGFydFJlcGwgPSAtPlxuICAgIFxuICAgICMgTWFrZSB0aGUgUkVQTCB1c2UgdGhlIGdsb2JhbCBjb250ZXh0IHNvIGFzIHRvIFxuICAgICMgICAoYSkgYmUgY29uc2lzdGVudCB3aXRoIHRoZSBgbm9kZWAgUkVQTCBhbmQsIHRoZXJlZm9yZSwgXG4gICAgIyAgIChiKSBtYWtlIHBhY2thZ2VzIHRoYXQgbW9kaWZ5IG5hdGl2ZSBwcm90b3R5cGVzIChzdWNoIGFzICdjb2xvcnMnIGFuZCAnc3VnYXInKSB3b3JrIGFzIGV4cGVjdGVkLlxuICAgIFxuICAgIHJlcGxDbGlPcHRzID0gdXNlR2xvYmFsOiB5ZXNcbiAgICByZXBsQ2xpT3B0cy5wcmVsdWRlID0gb3B0cy5wcmVsdWRlXG4gICAgcmVxdWlyZSgnLi9yZXBsJykuc3RhcnQgcmVwbENsaU9wdHNcblxubWFrZVByZWx1ZGUgPSAocmVxdWlyZXMpIC0+XG4gICAgXG4gICAgcmVxdWlyZXMubWFwIChtb2R1bGUpIC0+XG4gICAgICAgIFtfLCBuYW1lLCBtb2R1bGVdID0gbWF0Y2ggaWYgbWF0Y2ggPSBtb2R1bGUubWF0Y2goL14oLiopPSguKikkLylcbiAgICAgICAgbmFtZSB8fD0gYmFzZUZpbGVOYW1lIG1vZHVsZSwgeWVzLCB1c2VXaW5QYXRoU2VwXG4gICAgICAgIFwiI3tuYW1lfSA9IHJlcXVpcmUoJyN7bW9kdWxlfScpXCJcbiAgICAuam9pbiAnOydcblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcblxuIyBDb21waWxlIGEgc2NyaXB0IG9yIGEgZGlyZWN0b3J5LiBJZiBhIGRpcmVjdG9yeSBpcyBwYXNzZWQsIHJlY3Vyc2l2ZWx5IGNvbXBpbGUgYWxsICcuY29mZmVlJyBhbmQgJy5rb2ZmZWUnIGZpbGVzLlxuXG5jb21waWxlUGF0aCA9IChzb3VyY2U6LCB0b3BMZXZlbDpubykgLT5cblxuICAgIHJldHVybiBpZiBub3QgdG9wTGV2ZWwgYW5kIGhpZGRlbiBzb3VyY2VcbiAgICAgICAgICAgICAgXG4gICAgdHJ5XG4gICAgICAgIHN0YXRzID0gZnMuc3RhdFN5bmMgc291cmNlXG4gICAgY2F0Y2ggZXJyXG4gICAgICAgIGlmIGVyci5jb2RlIGlzICdFTk9FTlQnXG4gICAgICAgICAgICBlcnJvciBcIkNvbW1hbmQuY29tcGlsZVBhdGggY2FuJ3Qgc3RhdCAnI3tzb3VyY2V9J1wiXG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQgMVxuICAgICAgICB0aHJvdyBlcnJcbiAgICAgICAgXG4gICAgaWYgc3RhdHMuaXNEaXJlY3RvcnkoKVxuICAgICAgICBcbiAgICAgICAgaWYgc2xhc2guYmFzZW5hbWUoc291cmNlKSBpbiBbJ25vZGVfbW9kdWxlcycgJy5naXQnXVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgb3B0cy5ydW5cbiAgICAgICAgICAgIGNvbXBpbGVQYXRoIHNvdXJjZTpmaW5kRGlyZWN0b3J5SW5kZXgoc291cmNlKSwgdG9wTGV2ZWw6dG9wTGV2ZWxcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICBcbiAgICAgICAgbG9nICdDb21tYW5kLmNvbXBpbGVQYXRoIGRpcjonLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuICAgICAgICBcbiAgICAgICAgdHJ5XG4gICAgICAgICAgICBmaWxlcyA9IGZzLnJlYWRkaXJTeW5jIHNvdXJjZVxuICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgIGlmIGVyci5jb2RlIGlzICdFTk9FTlQnIHRoZW4gcmV0dXJuIFxuICAgICAgICAgICAgdGhyb3cgZXJyXG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIGZpbGUgaW4gZmlsZXNcbiAgICAgICAgICAgIGNvbXBpbGVQYXRoIHNvdXJjZTpzbGFzaC5qb2luIHNvdXJjZSwgZmlsZVxuICAgICAgICAgICAgXG4gICAgZWxzZSBpZiB0b3BMZXZlbCBvciBpc0NvZmZlZSBzb3VyY2VcbiAgICAgICAgXG4gICAgICAgIHRyeVxuICAgICAgICAgICAgY29kZSA9IGZzLnJlYWRGaWxlU3luYyBzb3VyY2VcbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICBpZiBlcnIuY29kZSBpcyAnRU5PRU5UJyB0aGVuIHJldHVyblxuICAgICAgICAgICAgdGhyb3cgZXJyXG4gICAgICAgIFxuICAgICAgICBsb2cgJ0NvbW1hbmQuY29tcGlsZVBhdGggZmlsZTonLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuICAgICAgICAgICAgXG4gICAgICAgIGNvbXBpbGVTY3JpcHQgY29kZS50b1N0cmluZygpLCBzb3VyY2VcbiAgICAgICAgXG5maW5kRGlyZWN0b3J5SW5kZXggPSAoc291cmNlKSAtPlxuXG4gICAgZm9yIGV4dCBpbiBLb2ZmZWUuRklMRV9FWFRFTlNJT05TXG4gICAgICAgIGluZGV4ID0gc2xhc2guam9pbiBzb3VyY2UsIFwiaW5kZXgje2V4dH1cIlxuICAgICAgICB0cnlcbiAgICAgICAgICAgIHJldHVybiBpbmRleCBpZiAoZnMuc3RhdFN5bmMgaW5kZXgpLmlzRmlsZSgpXG4gICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgdGhyb3cgZXJyIHVubGVzcyBlcnIuY29kZSBpcyAnRU5PRU5UJ1xuICAgIGVycm9yIFwiTWlzc2luZyBpbmRleC5jb2ZmZWUgaW4gI3tzb3VyY2V9XCJcbiAgICBwcm9jZXNzLmV4aXQgMVxuXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgICAgIDAwMCAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgICAgXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgICAgXG5cbiMgQ29tcGlsZSBhIHNpbmdsZSBzb3VyY2Ugc2NyaXB0LCBjb250YWluaW5nIHRoZSBnaXZlbiBjb2RlLCBhY2NvcmRpbmcgdG8gdGhlIHJlcXVlc3RlZCBvcHRpb25zLiBcbiMgSWYgZXZhbHVhdGluZyB0aGUgc2NyaXB0IGRpcmVjdGx5IHNldHMgYF9fZmlsZW5hbWVgLCBgX19kaXJuYW1lYCBhbmQgYG1vZHVsZS5maWxlbmFtZWAgdG8gYmUgY29ycmVjdCByZWxhdGl2ZSB0byB0aGUgc2NyaXB0J3Mgc2xhc2guXG5cbmNvbXBpbGVTY3JpcHQgPSAoY29kZSwgc291cmNlPW51bGwpIC0+XG4gICAgXG4gICAgbyA9IG9wdHNcbiAgICBvcHRpb25zID0gS29mZmVlLmNvbXBpbGVPcHRpb25zIHNvdXJjZSwgb3B0c1xuICAgIFxuICAgIHRyeVxuICAgICAgICB0ID0gdGFzayA9IHtzb3VyY2UsIGNvZGUsIG9wdGlvbnN9XG4gICAgICAgIFxuICAgICAgICBpZiBvLnRva2Vuc1xuICAgICAgICAgICAgcHJpbnRUb2tlbnMgS29mZmVlLnRva2VucyB0LmNvZGUsIHQub3B0aW9uc1xuICAgICAgICBlbHNlIGlmIG8uZnJhZ21lbnRzXG4gICAgICAgICAgICBwcmludEZyYWdtZW50cyBjb2RlLCBLb2ZmZWUuZnJhZ21lbnRzIHQuY29kZSwgdC5vcHRpb25zXG4gICAgICAgIGVsc2UgaWYgby5jb2ZmZWVcbiAgICAgICAgICAgIHByaW50UmV3cml0ZXIgS29mZmVlLnRva2VucyB0LmNvZGUsIHQub3B0aW9uc1xuICAgICAgICBlbHNlIGlmIG8ucGFyc2VcbiAgICAgICAgICAgIHByaW50TGluZSBLb2ZmZWUubm9kZXModC5jb2RlLCB0Lm9wdGlvbnMpLnRvU3RyaW5nKCkudHJpbSgpXG4gICAgICAgIGVsc2UgaWYgby5ydW5cbiAgICAgICAgICAgIEtvZmZlZS5yZWdpc3RlcigpXG4gICAgICAgICAgICBLb2ZmZWUuZXZhbCBvcHRzLnByZWx1ZGUsIHQub3B0aW9ucyBpZiBvcHRzLnByZWx1ZGVcbiAgICAgICAgICAgIHQub3B0aW9ucy5maWxlbmFtZSA/PSBvcHRpb25zLnNvdXJjZVxuICAgICAgICAgICAgaWYgb3B0cy5ub29wIFxuICAgICAgICAgICAgICAgIGxvZyBcIm5vb3AgcnVuICN7c291cmNlfVwiXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgS29mZmVlLnJ1biB0LmNvZGUsIHQub3B0aW9uc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBjb21waWxlZCA9IEtvZmZlZS5jb21waWxlIHQuY29kZSwgdC5vcHRpb25zXG4gICAgICAgICAgICB0Lm91dHB1dCA9IGNvbXBpbGVkXG4gICAgICAgICAgICBpZiBvLm1hcFxuICAgICAgICAgICAgICAgIHQub3V0cHV0ID0gY29tcGlsZWQuanNcbiAgICAgICAgICAgICAgICB0LnNvdXJjZU1hcCA9IGNvbXBpbGVkLnYzU291cmNlTWFwXG5cbiAgICAgICAgICAgIGlmIG8uanNcbiAgICAgICAgICAgICAgICBpZiBvcHRzLm5vb3AgdGhlbiBsb2cgXCJub29wIGpzICN7c291cmNlfVwiXG4gICAgICAgICAgICAgICAgZWxzZSBcbiAgICAgICAgICAgICAgICAgICAgcHJpbnRMaW5lIHQub3V0cHV0LnRyaW0oKVxuICAgICAgICAgICAgZWxzZSBpZiBvLmNvbXBpbGUgb3Igby5tYXBcbiAgICAgICAgICAgICAgICBpZiBvcHRzLm5vb3AgdGhlbiBsb2cgXCJub29wIHdyaXRlICN7b3B0aW9ucy5qc1BhdGh9XCJcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlSnMgdC5zb3VyY2UsIHQub3V0cHV0LCBvcHRpb25zLmpzUGF0aCwgdC5zb3VyY2VNYXBcbiAgICBjYXRjaCBlcnJcbiAgICAgICAgXG4gICAgICAgIG1lc3NhZ2UgPSBlcnIubWVzc2FnZVxuICAgICAgICBcbiAgICAgICAgaWYgZXJyIGluc3RhbmNlb2YgU3ludGF4RXJyb3JcbiAgICAgICAgICAgIHByaW50TGluZSBtZXNzYWdlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHByaW50TGluZSBlcnIuc3RhY2tcbiAgICAgICAgXG4gICAgICAgIGlmIG8ud2F0Y2ggb3Igby5ldmFsXG4gICAgICAgICAgICBwcmludCAnXFx4MDcnICMgYmVsbFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQgMVxuICAgICAgICAgICAgXG4jIEF0dGFjaCB0aGUgYXBwcm9wcmlhdGUgbGlzdGVuZXJzIHRvIGNvbXBpbGUgc2NyaXB0cyBpbmNvbWluZyBvdmVyICoqc3RkaW4qKiwgYW5kIHdyaXRlIHRoZW0gYmFjayB0byAqKnN0ZG91dCoqLlxuXG5jb21waWxlU3RkaW8gPSAtPlxuICAgIFxuICAgIGJ1ZmZlcnMgPSBbXVxuICAgIHN0ZGluID0gcHJvY2Vzcy5vcGVuU3RkaW4oKVxuICAgIHN0ZGluLm9uICdkYXRhJywgKGJ1ZmZlcikgLT4gYnVmZmVycy5wdXNoIGJ1ZmZlciBpZiBidWZmZXJcbiAgICBzdGRpbi5vbiAnZW5kJywgLT4gY29tcGlsZVNjcmlwdCBCdWZmZXIuY29uY2F0KGJ1ZmZlcnMpLnRvU3RyaW5nKClcblxuIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbiMgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAwMDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAgICAgIDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG5cbndhdGNoUGF0aCA9IChzb3VyY2UpIC0+ICMgV2F0Y2ggYSBmaWxlIG9yIGRpcmVjdG9yeS5cbiAgICBcbiAgICB0cnlcbiAgICAgICAgc3RhdHMgPSBmcy5zdGF0U3luYyBzb3VyY2VcbiAgICBjYXRjaCBlcnJcbiAgICAgICAgcmV0dXJuIGlmIGVyci5jb2RlIGlzICdFTk9FTlQnXG4gICAgICAgIHJldHVybiBlcnJvciBcIkNvbW1hbmQud2F0Y2hQYXRoIGNhbid0IHN0YXQgJyN7c291cmNlfSdcIiwgZXJyXG4gICAgICAgICAgICAgICAgXG4gICAgaWYgc3RhdHMuaXNEaXJlY3RvcnkoKVxuICAgICAgICB3YXRjaERpciBzb3VyY2VcbiAgICBlbHNlXG4gICAgICAgIHdhdGNoRmlsZSBzb3VyY2VcblxuIyBXYXRjaCBhIHNpbmdsZSBmaWxlIHVzaW5nIGBmcy53YXRjaGAsIHJlY29tcGlsaW5nIGl0IGV2ZXJ5IHRpbWUgdGhlIGZpbGUgaXMgdXBkYXRlZC5cbiMgTWF5IGJlIHVzZWQgaW4gY29tYmluYXRpb24gd2l0aCBvdGhlciBvcHRpb25zLCBzdWNoIGFzIGAtLXByaW50YC5cbiAgICAgICAgXG53YXRjaEZpbGUgPSAoc291cmNlKSAtPlxuICAgIFxuICAgIHJldHVybiBpZiBub3QgaXNDb2ZmZWUgc291cmNlXG4gICAgXG4gICAgbG9nICdDb21tYW5kLndhdGNoRmlsZScsIHNvdXJjZSBpZiBvcHRzLkRlYnVnXG4gICAgXG4gICAgd2F0Y2hlciAgICAgICAgPSBudWxsXG4gICAgcHJldlN0YXRzICAgICAgPSBudWxsXG4gICAgY29tcGlsZVRpbWVvdXQgPSBudWxsXG5cbiAgICBzdGFydFdhdGNoZXIgPSAtPlxuICAgICAgICBcbiAgICAgICAgd2F0Y2hlciA9IGZzLndhdGNoIHNvdXJjZVxuICAgICAgICAub24gJ2NoYW5nZScsIChjaGFuZ2UpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBpZiBjaGFuZ2UgIT0gJ2NoYW5nZSdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbG9nICdDb21tYW5kLndhdGNoRmlsZScsIGNoYW5nZSwgc291cmNlIGlmIG9wdHMuRGVidWdcblxuICAgICAgICAgICAgY2xlYXJUaW1lb3V0IGNvbXBpbGVUaW1lb3V0XG4gICAgICAgICAgICBjb21waWxlVGltZW91dCA9IHdhaXQgMjUsIC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZnMuc3RhdCBzb3VyY2UsIChlcnIsIHN0YXRzKSAtPlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gd2F0Y2hlci5jbG9zZSgpIGlmIGVycj8uY29kZSBpcyAnRU5PRU5UJ1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXJyb3IgZXJyIGlmIGVyclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaWYgcHJldlN0YXRzIGFuZCBzdGF0cy5tdGltZS5nZXRUaW1lKCkgaXMgcHJldlN0YXRzLm10aW1lLmdldFRpbWUoKSBhbmQgc3RhdHMuc2l6ZSBpcyBwcmV2U3RhdHMuc2l6ZVxuICAgICAgICAgICAgICAgICAgICBwcmV2U3RhdHMgPSBzdGF0c1xuICAgICAgICAgICAgICAgICAgICBmcy5yZWFkRmlsZSBzb3VyY2UsIChlcnIsIGNvZGUpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXJyb3IgZXJyIGlmIGVyclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9nICdDb21tYW5kLndhdGNoRmlsZSBjb21waWxlJywgc291cmNlIGlmIG9wdHMuRGVidWdcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBpbGVTY3JpcHQgY29kZS50b1N0cmluZygpLCBzb3VyY2VcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAub24gJ2Vycm9yJywgKGVycikgLT5cbiAgICAgICAgICAgIHRocm93IGVyciB1bmxlc3MgZXJyLmNvZGUgaXMgJ0VQRVJNJ1xuXG4gICAgdHJ5XG4gICAgICAgIHN0YXJ0V2F0Y2hlcigpXG4gICAgY2F0Y2ggZXJyXG4gICAgICAgIGVycm9yIGVyclxuXG53YXRjaERpciA9IChzb3VyY2UpIC0+XG4gICAgXG4gICAgbG9nICdDb21tYW5kLndhdGNoRGlyJywgc291cmNlIGlmIG9wdHMuRGVidWdcbiAgICBcbiAgICB3YXRjaGVyID0gbnVsbFxuXG4gICAgc3RhcnRXYXRjaGVyID0gLT5cblxuICAgICAgICB0cnlcbiAgICAgICAgICAgIGZpbGVzID0gZnMucmVhZGRpclN5bmMgc291cmNlXG4gICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgcmV0dXJuIGlmIGVycj8uY29kZSBpcyAnRU5PRU5UJ1xuICAgICAgICAgICAgdGhyb3cgZXJyXG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIGZpbGUgaW4gZmlsZXNcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIGZpbGVbMF0gPT0gJy4nXG4gICAgICAgICAgICBjb250aW51ZSBpZiBmaWxlIGluIFsnbm9kZV9tb2R1bGVzJ11cbiAgICAgICAgICAgIHdhdGNoUGF0aCBzbGFzaC5qb2luIHNvdXJjZSwgZmlsZVxuICAgICAgICBcbiAgICAgICAgd2F0Y2hlciA9IGZzLndhdGNoIHNvdXJjZVxuICAgICAgICAub24gJ2Vycm9yJywgKGVycikgLT5cbiAgICAgICAgICAgIHRocm93IGVyciB1bmxlc3MgZXJyLmNvZGUgaXMgJ0VQRVJNJ1xuICAgICAgICAgICAgd2F0Y2hlci5jbG9zZSgpXG4gICAgICAgIC5vbiAnY2hhbmdlJywgKGNoYW5nZSwgcCkgLT5cbiAgICAgICAgICAgIGlmIGNoYW5nZSA9PSAncmVuYW1lJ1xuICAgICAgICAgICAgICAgIGxvZyAnQ29tbWFuZC53YXRjaERpcicsIGNoYW5nZSwgc2xhc2guam9pbiBzb3VyY2UsIHAgaWYgb3B0cy5EZWJ1Z1xuICAgICAgICAgICAgICAgIHdhdGNoUGF0aCBzbGFzaC5qb2luIHNvdXJjZSwgcFxuICAgICAgICAgICAgXG4gICAgdHJ5XG4gICAgICAgIHN0YXJ0V2F0Y2hlcigpXG4gICAgY2F0Y2ggZXJyXG4gICAgICAgIHJldHVybiBpZiBlcnIuY29kZSBpcyAnRU5PRU5UJ1xuICAgICAgICB0aHJvdyBlcnJcblxuIyBHZXQgdGhlIGNvcnJlc3BvbmRpbmcgb3V0cHV0IEphdmFTY3JpcHQgcGF0aCBmb3IgYSBzb3VyY2UgZmlsZS5cbiAgICBcbm91dHB1dFBhdGggPSAoc291cmNlLCBleHRlbnNpb24pIC0+XG4gICAgXG4gICAgYmFzZW5hbWUgPSBiYXNlRmlsZU5hbWUgc291cmNlLCB5ZXMsIHVzZVdpblBhdGhTZXBcbiAgICBpZiBvcHRzLm91dHB1dFxuICAgICAgICBkaXIgPSBvcHRzLm91dHB1dFxuICAgIGVsc2VcbiAgICAgICAgZGlyID0gc2xhc2guZGlybmFtZSBzb3VyY2VcbiAgICBzbGFzaC5qb2luIGRpciwgYmFzZW5hbWUgKyBleHRlbnNpb25cblxuIyBSZWN1cnNpdmVseSBta2RpciwgbGlrZSBgbWtkaXIgLXBgLlxuXG5ta2RpcnAgPSAoZGlyLCBmbikgLT5cbiAgICBtb2RlID0gMG83NzcgJiB+cHJvY2Vzcy51bWFzaygpXG5cbiAgICBkbyBta2RpcnMgPSAocCA9IGRpciwgZm4pIC0+XG4gICAgICAgIGZzLmV4aXN0cyBwLCAoZXhpc3RzKSAtPlxuICAgICAgICAgICAgaWYgZXhpc3RzXG4gICAgICAgICAgICAgICAgZm4oKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIG1rZGlycyBzbGFzaC5kaXJuYW1lKHApLCAtPlxuICAgICAgICAgICAgICAgICAgICBmcy5ta2RpciBwLCBtb2RlLCAoZXJyKSAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZuIGVyciBpZiBlcnJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZuKClcblxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgICAgICAwMDAgICAwMDAwMDAwICBcbiMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgICAgICAgMDAwICAwMDAgICAgICAgXG4jIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgICAgIDAwMCAgMDAwMDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICBcbiMgMDAgICAgIDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG5cbiMgV3JpdGUgb3V0IGEgSmF2YVNjcmlwdCBzb3VyY2UgZmlsZSB3aXRoIHRoZSBjb21waWxlZCBjb2RlLiBcbiMgQnkgZGVmYXVsdCwgZmlsZXMgYXJlIHdyaXR0ZW4gb3V0IGluIGBjd2RgIGFzIGAuanNgIGZpbGVzIHdpdGggdGhlIHNhbWUgbmFtZSwgYnV0IHRoZSBvdXRwdXQgZGlyZWN0b3J5IGNhbiBiZSBjdXN0b21pemVkIHdpdGggYC0tb3V0cHV0YC5cbiMgSWYgYGdlbmVyYXRlZFNvdXJjZU1hcGAgaXMgcHJvdmlkZWQsIHRoaXMgd2lsbCB3cml0ZSBhIGAuanMubWFwYCBmaWxlIGludG8gdGhlIHNhbWUgZGlyZWN0b3J5IGFzIHRoZSBgLmpzYCBmaWxlLlxuXG53cml0ZUpzID0gKHNvdXJjZSwganMsIGpzUGF0aCwgZ2VuZXJhdGVkU291cmNlTWFwID0gbnVsbCkgLT5cbiAgICBcbiAgICBzb3VyY2VNYXBQYXRoID0gb3V0cHV0UGF0aCBzb3VyY2UsICcuanMubWFwJ1xuICAgIGpzRGlyID0gc2xhc2guZGlybmFtZSBqc1BhdGhcbiAgICBjb21waWxlID0gLT5cbiAgICAgICAgaWYgb3B0cy5jb21waWxlXG4gICAgICAgICAgICBqcyA9ICcgJyBpZiBqcy5sZW5ndGggPD0gMFxuICAgICAgICAgICAgaWYgZ2VuZXJhdGVkU291cmNlTWFwIHRoZW4ganMgPSBcIiN7anN9XFxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9I3tiYXNlRmlsZU5hbWUgc291cmNlTWFwUGF0aCwgbm8sIHVzZVdpblBhdGhTZXB9XFxuXCJcbiAgICAgICAgICAgIGZzLndyaXRlRmlsZSBqc1BhdGgsIGpzLCAoZXJyKSAtPlxuICAgICAgICAgICAgICAgIGlmIGVyclxuICAgICAgICAgICAgICAgICAgICBwcmludExpbmUgZXJyLm1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0IDFcbiAgICAgICAgICAgICAgICBlbHNlIGlmIG9wdHMuY29tcGlsZSBhbmQgb3B0cy53YXRjaFxuICAgICAgICAgICAgICAgICAgICB0aW1lTG9nIFwiY29tcGlsZWQgI3tzb3VyY2V9XCJcbiAgICAgICAgaWYgZ2VuZXJhdGVkU291cmNlTWFwXG4gICAgICAgICAgICBmcy53cml0ZUZpbGUgc291cmNlTWFwUGF0aCwgZ2VuZXJhdGVkU291cmNlTWFwLCAoZXJyKSAtPlxuICAgICAgICAgICAgICAgIGlmIGVyclxuICAgICAgICAgICAgICAgICAgICBwcmludExpbmUgXCJDb3VsZCBub3Qgd3JpdGUgc291cmNlIG1hcDogI3tlcnIubWVzc2FnZX1cIlxuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQgMVxuICAgIGZzLmV4aXN0cyBqc0RpciwgKGl0RXhpc3RzKSAtPlxuICAgICAgICBpZiBpdEV4aXN0cyB0aGVuIGNvbXBpbGUoKSBlbHNlIG1rZGlycCBqc0RpciwgY29tcGlsZVxuXG53YWl0ID0gKG1pbGxpc2Vjb25kcywgZnVuYykgLT4gc2V0VGltZW91dCBmdW5jLCBtaWxsaXNlY29uZHMgIyBDb252ZW5pZW5jZSBmb3IgY2xlYW5lciBzZXRUaW1lb3V0cy5cblxudGltZUxvZyA9IChtZXNzYWdlKSAtPiBsb2cgXCIjeyhuZXcgRGF0ZSkudG9Mb2NhbGVUaW1lU3RyaW5nKCl9IC0gI3ttZXNzYWdlfVwiXG5cbiMgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMDAwMDAgICBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgICAwMDAgIFxuIyAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG5cbnByaW50VG9rZW5zID0gKHRva2VucykgLT5cblxuICAgIGZvciBpbmRleCBpbiBbMC4uLnRva2Vucy5sZW5ndGhdXG4gICAgICAgIHRva2VuICA9IHRva2Vuc1tpbmRleF1cbiAgICAgICAgdGFnICAgID0gdG9rZW5bMF1cbiAgICAgICAgdmFsdWUgID0gdG9rZW5bMV0udG9TdHJpbmcoKS5yZXBsYWNlKC9cXG4vLCAnXFxcXG4nKVxuICAgICAgICBjdGFnICAgPSBncmF5IHRhZ1xuICAgICAgICBjdmFsdWUgPSBib2xkIHllbGxvdyB2YWx1ZVxuICAgICAgICBpbmRleCAgPSBncmF5IGRpbSBpbmRleFxuICAgICAgICBpZiB0YWcgPT0gJ1RFUk1JTkFUT1InXG4gICAgICAgICAgICBwcmludCAnXFxuXFxuJ1xuICAgICAgICBlbHNlIGlmIHRhZyA9PSAnSU5ERU5UJ1xuICAgICAgICAgICAgcHJpbnQgZ3JheSBkaW0gJ0lORCAnXG4gICAgICAgIGVsc2UgaWYgdGFnID09ICdPVVRERU5UJ1xuICAgICAgICAgICAgcHJpbnQgZ3JheSBkaW0gJ09VVCAnXG4gICAgICAgIGVsc2UgaWYgdGFnIGluIFsnQ0xBU1MnICdQQVJBTV9TVEFSVCcgJ1BBUkFNX0VORCcgJ05VTEwnXVxuICAgICAgICAgICAgcHJpbnQgXCIje2luZGV4fSN7Y3RhZ30gXCJcbiAgICAgICAgZWxzZSBpZiB0YWcgPT0gdmFsdWVcbiAgICAgICAgICAgIHByaW50IFwiI3tpbmRleH0je2N2YWx1ZX0gXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcHJpbnQgXCIje2luZGV4fSN7Y3RhZ309I3tjdmFsdWV9IFwiXG5cbiMgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuIyAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuXG5wcmludEZyYWdtZW50cyA9IChjb2RlLCBmcmFnbWVudHMpIC0+XG5cbiAgICBsb2cgJydcbiAgICBmb3IgaW5kZXggaW4gWzAuLi5mcmFnbWVudHMubGVuZ3RoXVxuICAgICAgICBmcmFnID0gZnJhZ21lbnRzW2luZGV4XVxuICAgICAgICBsaW5lID0gYmx1ZUJyaWdodCAnJytmcmFnLmxvY2F0aW9uRGF0YS5maXJzdF9saW5lIFxuICAgICAgICBpZiBmcmFnLmxvY2F0aW9uRGF0YS5sYXN0X2xpbmUgIT0gZnJhZy5sb2NhdGlvbkRhdGEuZmlyc3RfbGluZSBcbiAgICAgICAgICAgIGxpbmUgKz0gZGltIGJsdWUgJy0nK2ZyYWcubG9jYXRpb25EYXRhLmxhc3RfbGluZVxuICAgICAgICBlbHNlIGxpbmUgKz0gJyAgJ1xuICAgICAgICBjb2x1bW4gPSBibHVlICcnK2ZyYWcubG9jYXRpb25EYXRhLmZpcnN0X2NvbHVtbiBcbiAgICAgICAgdHJpbW1lZCA9IGZyYWcuY29kZS5yZXBsYWNlKC8gL2csICcnKVxuICAgICAgICBpZiB0cmltbWVkLmxlbmd0aFxuICAgICAgICAgICAgaWYgdHJpbW1lZC5yZXBsYWNlKC9cXG4vZywgJycpLmxlbmd0aCA9PSAwXG4gICAgICAgICAgICAgICAgbG9nICcnXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgbG9nIGxpbmUgKyAnICcgKyBjb2x1bW4gKyAnICcgKyAgKGRpbSBncmF5IGhlbHBlcnMucGFkIGZyYWcudHlwZSwgMjApICsgeWVsbG93QnJpZ2h0KGZyYWcuY29kZSlcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgbWFwID0gS29mZmVlLmNvbXBpbGUgY29kZSwgXG4gICAgICAgICAgICBmZWF0dXJlOiBoZWFkZXI6IHRydWVcbiAgICAgICAgICAgIGZpbGVuYW1lOiAnZnJhZ21lbnRzJ1xuICAgICAgICAgICAgc291cmNlTWFwOiB5ZXNcbiAgICAgICAgICAgICMgaW5saW5lTWFwOiB5ZXNcblxuICAgIG1hcExpbmVUb1N0cmluZyA9IChtYXBsaW5lLCBrZXk9J3NvdXJjZUxpbmUnKSAtPlxuICAgICAgICBzID0gJydcbiAgICAgICAgZm9yIGNvbHVtbiBpbiBtYXBsaW5lLmNvbHVtbnNcbiAgICAgICAgICAgIGlmIGNvbHVtblxuICAgICAgICAgICAgICAgIHMgKz0gY29sdW1uW2tleV0lMTBcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBzICs9ICcgJ1xuICAgICAgICBzXG4gICAgICAgICAgICBcbiAgICBsb2cgZ3JheSBkaW0gJyAxMjM0NTY3ODkgMTIzNDU2Nzg5IDEyMzQ1Njc4OSAxMjM0NTY3ODkgMTIzNDU2Nzg5J1xuICAgIGNvZGVMaW5lcyA9IGNvZGUuc3BsaXQgJ1xcbidcbiAgICBmb3IgaSBpbiBbMC4uLmNvZGVMaW5lcy5sZW5ndGhdXG4gICAgICAgIGlmIGNvZGVMaW5lc1tpXS50cmltKCkubGVuZ3RoXG4gICAgICAgICAgICBsb2cgZ3JheShkaW0gaSsxKSArIGdyZWVuQnJpZ2h0IGNvZGVMaW5lc1tpXVxuICAgICAgICBlbHNlIGxvZyAnJ1xuICAgICAgICAgICAgXG4gICAgbG9nICcnXG4gICAgbG9nIGdyYXkgZGltICcgMTIzNDU2Nzg5IDEyMzQ1Njc4OSAxMjM0NTY3ODkgMTIzNDU2Nzg5IDEyMzQ1Njc4OSdcbiAgICBjb2RlTGluZXMgPSBtYXAuanMuc3BsaXQgJ1xcbidcbiAgICBmb3IgaSBpbiBbMC4uLmNvZGVMaW5lcy5sZW5ndGhdXG4gICAgICAgIGlmIGNvZGVMaW5lc1tpXS50cmltKCkubGVuZ3RoXG4gICAgICAgICAgICBsb2cgZ3JheShkaW0gaSsxKSArIHJlZEJyaWdodCBjb2RlTGluZXNbaV1cbiAgICAgICAgZWxzZSBsb2cgJydcbiAgICAgICAgICAgIFxuICAgIGxvZyBncmF5IGRpbSAnIDEyMzQ1Njc4OSAxMjM0NTY3ODkgMTIzNDU2Nzg5IDEyMzQ1Njc4OSAxMjM0NTY3ODknICAgIFxuICAgIGZvciBpIGluIFswLi4ubWFwLnNvdXJjZU1hcC5saW5lcy5sZW5ndGhdXG4gICAgICAgIG1hcGxpbmUgPSBtYXAuc291cmNlTWFwLmxpbmVzW2ldXG4gICAgICAgIGlmIG1hcGxpbmVcbiAgICAgICAgICAgIGxvZyBncmF5KGRpbSBpKzEpICsgcmVkQnJpZ2h0IG1hcExpbmVUb1N0cmluZyBtYXBsaW5lXG4gICAgICAgIGVsc2UgbG9nICcnXG5cbiAgICBsb2cgZ3JheSBkaW0gJyAxMjM0NTY3ODkgMTIzNDU2Nzg5IDEyMzQ1Njc4OSAxMjM0NTY3ODkgMTIzNDU2Nzg5JyAgICBcbiAgICBmb3IgaSBpbiBbMC4uLm1hcC5zb3VyY2VNYXAubGluZXMubGVuZ3RoXVxuICAgICAgICBtYXBsaW5lID0gbWFwLnNvdXJjZU1hcC5saW5lc1tpXVxuICAgICAgICBpZiBtYXBsaW5lXG4gICAgICAgICAgICBsb2cgZ3JheShkaW0gaSsxKSArIGJsdWVCcmlnaHQgbWFwTGluZVRvU3RyaW5nIG1hcGxpbmUsICdzb3VyY2VDb2x1bW4nXG4gICAgICAgIGVsc2UgbG9nICcnXG4gICAgICAgICAgICBcbiMgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuXG5wcmludFJld3JpdGVyID0gKHRva2VucykgLT5cblxuICAgIGluZGVudCA9IDBcbiAgICBmb3IgaW5kZXggaW4gWzAuLi50b2tlbnMubGVuZ3RoXVxuICAgICAgICB0b2tlbiA9IHRva2Vuc1tpbmRleF1cbiAgICAgICAgdGFnICAgPSB0b2tlblswXVxuICAgICAgICB2YWx1ZSA9IHRva2VuWzFdXG4gICAgICAgIFxuICAgICAgICBncmF5RGltID0gKHMpIC0+IGRpbSBncmF5IHNcbiAgICAgICAgYmx1ZURpbSA9IChzKSAtPiBkaW0gYmx1ZSBzXG4gICAgICAgIHllbGxvd0RpbSA9IChzKSAtPiBkaW0geWVsbG93IHNcbiAgICAgICAgc3BhY2VkID0gKGNvbG9yLCB2KS0+XG4gICAgICAgICAgICBwcmludCBjb2xvciBcIiN7diA/IHZhbHVlfVwiXG4gICAgICAgICAgICBwcmludCAnICcgaWYgdG9rZW4uc3BhY2VkIGFuZCB0b2tlbnNbaW5kZXgrMV1bMF0gbm90IGluIFsnQ0FMTF9TVEFSVCddXG5cbiAgICAgICAgIyBsb2cgdG9rZW5cbiAgICAgICAgc3dpdGNoIHRhZyBcbiAgICAgICAgICAgIHdoZW4gJ1RFUk1JTkFUT1InICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBwcmludCBcIlxcbiN7cGFkICcnLCBpbmRlbnR9XCJcbiAgICAgICAgICAgIHdoZW4gJ0lOREVOVCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBpbmRlbnQgKz0gNDsgcHJpbnQgXCJcXG4je3BhZCAnJywgaW5kZW50fVwiXG4gICAgICAgICAgICB3aGVuICdPVVRERU5UJyAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gaW5kZW50IC09IDQ7IHByaW50IFwiXFxuI3twYWQgJycsIGluZGVudH1cIlxuICAgICAgICAgICAgd2hlbiAnSEVSRUNPTU1FTlQnICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCBncmF5RGltXG4gICAgICAgICAgICB3aGVuICdDQUxMX1NUQVJUJyAnQ0FMTF9FTkQnICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGdyYXlEaW1cbiAgICAgICAgICAgIHdoZW4gJ1VOQVJZJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgYmx1ZUJyaWdodCwgJ25vdCdcbiAgICAgICAgICAgIHdoZW4gJyYmJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgYmx1ZUJyaWdodCwgJ2FuZCdcbiAgICAgICAgICAgIHdoZW4gJ3x8JyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgYmx1ZUJyaWdodCwgJ29yJ1xuICAgICAgICAgICAgd2hlbiAnU1RSSU5HJyAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCBncmVlblxuICAgICAgICAgICAgd2hlbiAnU1RSSU5HX1NUQVJUJyAnU1RSSU5HX0VORCcgICAgICAgICB0aGVuIHNwYWNlZCByZWRCcmlnaHRcbiAgICAgICAgICAgIHdoZW4gJ1BST1BFUlRZJyAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgeWVsbG93XG4gICAgICAgICAgICB3aGVuICc6JyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIHllbGxvd0RpbVxuICAgICAgICAgICAgd2hlbiAnQCcgXG4gICAgICAgICAgICAgICAgaWYgdG9rZW5zW2luZGV4KzFdWzBdIG5vdCBpbiBbJ01FVEFfSUYnICdNRVRBX0VMU0UnICdQT1NUX01FVEFfSUYnXSB0aGVuIHNwYWNlZCh5ZWxsb3dEaW0pIGVsc2Ugc3BhY2VkIGJsdWVEaW1cbiAgICAgICAgICAgIHdoZW4gJ01FVEFfSUYnICdNRVRBX0VMU0UnICdQT1NUX01FVEFfSUYnIHRoZW4gc3BhY2VkIGJsdWUsICfilrgnK3ZhbHVlXG4gICAgICAgICAgICB3aGVuICdOVU1CRVInICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGJsdWVcbiAgICAgICAgICAgIHdoZW4gJ3snJ30nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBpZiBub3QgdG9rZW4uZ2VuZXJhdGVkIHRoZW4gc3BhY2VkIGdyYXlcbiAgICAgICAgICAgIHdoZW4gJz0nICcrJyAnLScgJysrJyAnLS0nICcuLi4nICc6OicgXFxcbiAgICAgICAgICAgICAgICAgJ1snICddJyAneycgJ30nICcuJyAnTUFUSCcgJ1VOQVJZX01BVEgnIFxcXG4gICAgICAgICAgICAgICAgICdJTkRFWF9TVEFSVCcgJ0lOREVYX0VORCcgXFxcbiAgICAgICAgICAgICAgICAgJ0NPTVBBUkUnICdDT01QT1VORF9BU1NJR04nICAgICAgICAgdGhlbiBzcGFjZWQgZ3JheVxuICAgICAgICAgICAgd2hlbiAnLCcgJygnICcpJyAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCBncmF5RGltXG4gICAgICAgICAgICB3aGVuICdQQVJBTV9TVEFSVCcgJ1BBUkFNX0VORCcgJy0+JyAnPT4nIHRoZW4gc3BhY2VkIChzKSAtPiBib2xkIGJsdWUgc1xuICAgICAgICAgICAgd2hlbiAnTlVMTCcgJ1VOREVGSU5FRCcgJ0ZVTkNfRVhJU1QnICc/JyAnPy4nICdCSU4/JyB0aGVuIHNwYWNlZCByZWRcbiAgICAgICAgICAgIHdoZW4gJ1JFR0VYJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgbWFnZW50YVxuICAgICAgICAgICAgd2hlbiAnRk9SJyAnRk9SSU4nICdUUlknICdDQVRDSCcgJ1RIUk9XJyAnUkVMQVRJT04nICdFWFRFTkRTJyAnU1RBVEVNRU5UJyAnT1dOJyAnRk9ST0YnICdMT09QJyBcXFxuICAgICAgICAgICAgICAgICAnSUYnICdQT1NUX0lGJyAnV0hFTicgJ1RIRU4nICdFTFNFJyAnVEhJUycgJ1NVUEVSJyAnU1dJVENIJyAnTEVBRElOR19XSEVOJyAnV0hJTEUnIFxcXG4gICAgICAgICAgICAgICAgICdCT09MJyAnQ0xBU1MnICdSRVRVUk4nICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGJsdWVCcmlnaHRcbiAgICAgICAgICAgIHdoZW4gJ0lERU5USUZJRVInIFxuICAgICAgICAgICAgICAgIHN3aXRjaCB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICB3aGVuICdyZXF1aXJlJyB0aGVuIHNwYWNlZCBncmF5XG4gICAgICAgICAgICAgICAgICAgIGVsc2Ugc3BhY2VkIHdoaXRlQnJpZ2h0XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcHJpbnQgXCI+I3t0YWd9PFwiXG4gICAgICAgICAgICAgICAgIyBzcGFjZWQgKHMpIC0+IGJvbGQgYmx1ZUJyaWdodCBzXG4gICAgICAgICAgICAgICAgc3BhY2VkIGN5YW5cbiAgICAgICAgICAgIFxudmVyc2lvbiA9IC0+IHByaW50TGluZSBcIiN7S29mZmVlLlZFUlNJT059XCJcbnVzYWdlICAgPSAtPiBcblxuICAgIGxpbmVzID0gW1wiI3tncmF5ICdVc2FnZTonfSAje3llbGxvdyAna29mZmVlJ30gI3tncmF5ICdbb3B0aW9uc10nfSBwYXRoL3RvL3NjcmlwdCAje2dyYXkgJ1tvcHRpb25zXSd9XFxuXCJdXG4gICAgXG4gICAgcnVsZXMgPSBTV0lUQ0hFUy5tYXAgKHJ1bGUpIC0+XG4gICAgICAgIFtzaG9ydCwgbG9uZywgZGVzY3JpcHRpb25dID0gcnVsZVxuICAgICAgICBsb25nRmxhZyA9IGxvbmcubWF0Y2goL14oLS1cXHdbXFx3XFwtXSopLylbMV1cbiAgICAgICAgY3Nob3J0ICAgPSBpZiBzaG9ydCB0aGVuIGdyYXkoc2hvcnRbMF0pICsgYm9sZChncmF5KHNob3J0WzEuLl0pKSArICcgICcgZWxzZSAnICAgICdcbiAgICAgICAgY2xvbmcgICAgPSBwYWQgbG9uZywgMjBcbiAgICAgICAgY2xvbmcgICAgPSBncmF5KGNsb25nWzAuLjFdKSArIGJvbGQod2hpdGUoY2xvbmdbMi4uXS5zcGxpdCgnICcpWzBdKSkgKyAnICcgKyBib2xkKGJsdWVCcmlnaHQoY2xvbmdbMi4uXS5zcGxpdCgnICcpWzEuLl0uam9pbignICcpKSlcbiAgICAgICAgbGluZXMucHVzaCAnICAgICcgKyBjc2hvcnQgKyBjbG9uZyArIGdyYXkgZGVzY3JpcHRpb25cbiAgICAgICAgXG4gICAgbGluZXMucHVzaCBncmF5ICdcXG5JZiBjYWxsZWQgd2l0aG91dCBhIHNjcmlwdCwgdGhlIGludGVyYWN0aXZlIFJFUEwgd2lsbCBiZSBzdGFydGVkJ1xuICAgICAgICBcbiAgICBsb2cgXCJcXG4jeyBsaW5lcy5qb2luKCdcXG4nKSB9XFxuXCJcbiAgICAgICAgIl19
//# sourceURL=../coffee/command.coffee