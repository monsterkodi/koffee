// koffee 1.9.0

/*
 0000000   0000000   00     00  00     00   0000000   000   000  0000000    
000       000   000  000   000  000   000  000   000  0000  000  000   000  
000       000   000  000000000  000000000  000000000  000 0 000  000   000  
000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  
 0000000   0000000   000   000  000   000  000   000  000   000  0000000
 */
var FEATURES, Koffee, SWITCHES, baseFileName, compileOptions, compilePath, compileScript, compileStdio, error, exec, findDirectoryIndex, fs, helpers, hidden, isCoffee, logFeatures, makePrelude, merge, mkdirp, nopt, opts, outputPath, pad, parseOptions, print, printFragments, printLine, printRewriter, printTokens, printWarn, ref, ref1, run, slash, spawn, startRepl, stringify, timeLog, usage, useWinPathSep, version, wait, watchDir, watchFile, watchPath, writeJs;

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
    options = compileOptions(source);
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

compileOptions = function(source) {
    var copts, cwd, jsDir, jsPath, srcRoot;
    copts = Object.assign({}, opts);
    copts.sourceMap = opts.map;
    copts.inlineMap = opts['inline-map'];
    if (source) {
        cwd = process.cwd();
        jsPath = outputPath(source, '.js');
        jsDir = slash.dirname(jsPath);
        srcRoot = slash.relative(slash.dir(source), jsDir);
        copts = merge(copts, {
            jsPath: jsPath,
            source: source,
            sourceRoot: srcRoot,
            sourceFiles: [slash.relative(source, slash.join(cwd, srcRoot))],
            generatedFile: slash.file(jsPath)
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBaUJBLEVBQUEsR0FBbUIsT0FBQSxDQUFRLElBQVI7O0FBQ25CLEtBQUEsR0FBbUIsT0FBQSxDQUFRLFFBQVI7O0FBQ25CLElBQUEsR0FBbUIsT0FBQSxDQUFRLE1BQVI7O0FBQ25CLE9BQUEsR0FBbUIsT0FBQSxDQUFRLFdBQVI7O0FBQ25CLE1BQUEsR0FBbUIsT0FBQSxDQUFRLFVBQVI7O0FBQ25CLE1BQW1CLE9BQUEsQ0FBUSxlQUFSLENBQW5CLEVBQUUsaUJBQUYsRUFBUzs7QUFFVCxhQUFBLEdBQW1CLEtBQUssQ0FBQyxHQUFOLEtBQWE7O0FBRWhDLE9BQU8sQ0FBQyxNQUFSLENBQUE7O0FBRUEsT0FBNEIsT0FBQSxDQUFRLFlBQVIsQ0FBNUIsRUFBRSx3QkFBRixFQUFZOztBQUVWLG1DQUFGLEVBQWdCLDJCQUFoQixFQUEwQiw2QkFBMUIsRUFBcUMscUJBQXJDLEVBQTRDOztBQUU1QyxLQUFBLEdBQVksT0FBTyxDQUFDOztBQUNwQixLQUFBLEdBQVksU0FBQyxJQUFEO1dBQVUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFmLENBQXFCLElBQXJCO0FBQVY7O0FBQ1osU0FBQSxHQUFZLFNBQUMsSUFBRDtXQUFVLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBZixDQUFxQixJQUFBLEdBQU8sSUFBNUI7QUFBVjs7QUFDWixTQUFBLEdBQVksU0FBQyxJQUFEO1dBQVUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFmLENBQXFCLElBQUEsR0FBTyxJQUE1QjtBQUFWOztBQUNaLE1BQUEsR0FBWSxTQUFDLElBQUQ7V0FBVSxRQUFRLENBQUMsSUFBVCxDQUFjLElBQWQ7QUFBVjs7QUFFWixRQUFBLEdBQVcsQ0FDUCxDQUFDLElBQUQsRUFBTSxRQUFOLEVBQTRCLDhDQUE1QixFQUFvRixPQUFwRixDQURPLEVBRVAs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SUFBeEQsR0FBa0U7UUFDN0UsS0FBQSxHQUFXLEdBQUEsQ0FBSSxJQUFKLEVBQVUsRUFBVjtRQUNYLEtBQUEsR0FBVyxJQUFBLENBQUssS0FBTSxZQUFYLENBQUEsR0FBb0IsSUFBQSxDQUFLLEtBQUEsQ0FBTSxLQUFNLFNBQUksQ0FBQyxLQUFYLENBQWlCLEdBQWpCLENBQXNCLENBQUEsQ0FBQSxDQUE1QixDQUFMLENBQXBCLEdBQTRELEdBQTVELEdBQWtFLElBQUEsQ0FBSyxVQUFBLENBQVcsS0FBTSxTQUFJLENBQUMsS0FBWCxDQUFpQixHQUFqQixDQUFzQixTQUFJLENBQUMsSUFBM0IsQ0FBZ0MsR0FBaEMsQ0FBWCxDQUFMO2VBQzdFLEtBQUssQ0FBQyxJQUFOLENBQVcsTUFBQSxHQUFTLE1BQVQsR0FBa0IsS0FBbEIsR0FBMEIsSUFBQSxDQUFLLFdBQUwsQ0FBckM7SUFOaUIsQ0FBYjtJQVFSLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBQSxDQUFLLG9FQUFMLENBQVg7V0FBb0YsT0FBQSxDQUVwRixHQUZvRixDQUVoRixJQUFBLEdBQUksQ0FBRSxLQUFLLENBQUMsSUFBTixDQUFXLElBQVgsQ0FBRixDQUFKLEdBQXdCLElBRndEO0FBWjlFIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4jIyNcblxuIyBoYW5kbGUgdmFyaW91cyB0YXNrczogXG4jXG4jICAgLSBjb21waWxlIGFuZCBzYXZlIGludG8gYC5qc2AgZmlsZXMgXG4jICAgLSBjb21waWxlIGFuZCBwcmludCB0byBzdGRvdXQgXG4jICAgLSByZWNvbXBpbGUgaWYgdGhlIHNvdXJjZSBjaGFuZ2VzXG4jICAgLSBwcmludCBsZXhlciB0b2tlbnNcbiMgICAtIHByaW50IGEgc3ludGF4IHRyZWVcbiMgICAtIGxhdW5jaCBhIFJFUExcblxuZnMgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ2ZzJ1xuc2xhc2ggICAgICAgICAgICA9IHJlcXVpcmUgJ2tzbGFzaCdcbm5vcHQgICAgICAgICAgICAgPSByZXF1aXJlICdub3B0J1xuaGVscGVycyAgICAgICAgICA9IHJlcXVpcmUgJy4vaGVscGVycydcbktvZmZlZSAgICAgICAgICAgPSByZXF1aXJlICcuL2tvZmZlZSdcbnsgc3Bhd24sIGV4ZWMgfSAgPSByZXF1aXJlICdjaGlsZF9wcm9jZXNzJ1xuXG51c2VXaW5QYXRoU2VwICAgID0gc2xhc2guc2VwIGlzICdcXFxcJ1xuXG5oZWxwZXJzLmNvbG9ycygpXG5cbnsgRkVBVFVSRVMsIGxvZ0ZlYXR1cmVzIH0gPSByZXF1aXJlICcuL2ZlYXR1cmVzJ1xuXG57IGJhc2VGaWxlTmFtZSwgaXNDb2ZmZWUsIHN0cmluZ2lmeSwgbWVyZ2UsIHBhZCB9ID0gaGVscGVyc1xuXG5lcnJvciAgICAgPSBjb25zb2xlLmVycm9yXG5wcmludCAgICAgPSAobGluZSkgLT4gcHJvY2Vzcy5zdGRvdXQud3JpdGUgbGluZVxucHJpbnRMaW5lID0gKGxpbmUpIC0+IHByb2Nlc3Muc3Rkb3V0LndyaXRlIGxpbmUgKyAnXFxuJyAjID8/P1xucHJpbnRXYXJuID0gKGxpbmUpIC0+IHByb2Nlc3Muc3RkZXJyLndyaXRlIGxpbmUgKyAnXFxuJyAjID8/P1xuaGlkZGVuICAgID0gKGZpbGUpIC0+IC9eXFwufH4kLy50ZXN0IGZpbGVcblxuU1dJVENIRVMgPSBbXG4gICAgWyctYicgJy0tYmFyZScgICAgICAgICAgICAgICdjb21waWxlIHdpdGhvdXQgYSB0b3AtbGV2ZWwgZnVuY3Rpb24gd3JhcHBlcicgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLWMnICctLWNvbXBpbGUnICAgICAgICAgICAnY29tcGlsZSB0byBKYXZhU2NyaXB0IGFuZCBzYXZlIGFzIC5qcyBmaWxlcycgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1kJyAnLS1kb2MnICAgICAgICAgICAgICAgJ2xvZyB0aGUg4pa4ZG9jIHNlY3Rpb25zJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1lJyAnLS1ldmFsIFNUUklORycgICAgICAgJ2V2YWx1YXRlIGEgc3RyaW5nIGFuZCBwcmludCB0aGUgcmVzdWx0JyAgICAgICAgICAgICAgIFtTdHJpbmcsIEFycmF5XSBdXG4gICAgWyctZicgJy0tZmVhdHVyZXMnICAgICAgICAgICdsaXN0IGF2YWlsYWJsZSBmZWF0dXJlcycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnJyAgICctLW5vLWBmZWF0dXJlJyAgICAgICAnZGlzYWJsZSBhIGZlYXR1cmUsIGUuZy4gLS1uby1uZWdhdGl2ZS1pbmRleCcgICAgICAgICAgIG51bGwgICAgICAgICAgIF1cbiAgICBbJy1oJyAnLS1oZWxwJyAgICAgICAgICAgICAgJ2Rpc3BsYXkgdGhpcyBoZWxwIG1lc3NhZ2UnICAgICAgICAgICAgICAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctaicgJy0tanMnICAgICAgICAgICAgICAgICdwcmludCB0aGUgY29tcGlsZWQgSmF2YVNjcmlwdCcgICAgICAgICAgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLW0nICctLW1hcCcgICAgICAgICAgICAgICAnZ2VuZXJhdGUgc291cmNlIG1hcCBhbmQgc2F2ZSBhcyAuanMubWFwIGZpbGVzJyAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1NJyAnLS1pbmxpbmUtbWFwJyAgICAgICAgJ2dlbmVyYXRlIHNvdXJjZSBtYXAgYW5kIGluY2x1ZGUgaXQgZGlyZWN0bHkgaW4gb3V0cHV0JyBCb29sZWFuICAgICAgICBdXG4gICAgWycnICAgJy0tbWV0YWxvZycgICAgICAgICAgICdtZXRhIGxvZyAoZGVmYXVsdDogY29uc29sZS5sb2cpJyAgICAgICAgICAgICAgICAgICAgICAgU3RyaW5nICAgICAgICAgXVxuICAgIFsnLW4nICctLW5vb3AnICAgICAgICAgICAgICAnZG9lcyBub3RoaW5nLCBmb3IgZGVidWdnaW5nIHB1cnBvc2VzJyAgICAgICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1vJyAnLS1vdXRwdXQgRElSJyAgICAgICAgJ3NldCB0aGUgb3V0cHV0IGRpcmVjdG9yeSBmb3IgY29tcGlsZWQgSmF2YVNjcmlwdCcgICAgICBTdHJpbmcgICAgICAgICBdXG4gICAgWyctcicgJy0tcmVxdWlyZSBNT0RVTEUnICAgICdyZXF1aXJlIHRoZSBnaXZlbiBtb2R1bGUgYmVmb3JlIGV2YWwgb3IgUkVQTCcgICAgICAgICBbU3RyaW5nLCBBcnJheV0gXVxuICAgIFsnLUMnICctLWNvZmZlZScgICAgICAgICAgICAncHJpbnQgdGhlIHRva2VuIHN0cmVhbSBhcyBDb2ZmZWVTY3JpcHQnICAgICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1zJyAnLS1zdGRpbycgICAgICAgICAgICAgJ2xpc3RlbiBmb3IgYW5kIGNvbXBpbGUgc2NyaXB0cyBvdmVyIHN0ZGlvJyAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctdCcgJy0tdGVzdCcgICAgICAgICAgICAgICdjb21waWxlIGFuZCBydW4gdGhlIEB0ZXN0IGNvZGUnICAgICAgICAgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLVQnICctLXRva2VucycgICAgICAgICAgICAncHJpbnQgdGhlIHRva2VucycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy1GJyAnLS1mcmFnbWVudHMnICAgICAgICAgJ3ByaW50IHRoZSBmcmFnbWVudHMnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBCb29sZWFuICAgICAgICBdXG4gICAgWyctUCcgJy0tcGFyc2UnICAgICAgICAgICAgICdwcmludCB0aGUgcGFyc2UgdHJlZScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQm9vbGVhbiAgICAgICAgXVxuICAgIFsnLXYnICctLXZlcnNpb24nICAgICAgICAgICAnZGlzcGxheSB0aGUgdmVyc2lvbiBudW1iZXInICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJvb2xlYW4gICAgICAgIF1cbiAgICBbJy13JyAnLS13YXRjaCcgICAgICAgICAgICAgJ3dhdGNoIHNjcmlwdHMgZm9yIGNoYW5nZXMgYW5kIHJlcnVuIGNvbW1hbmRzJyAgICAgICAgICBCb29sZWFuICAgICAgICBdXG5dXG5cbm9wdHMgPSB7fVxuXG4jICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICBcbiMgIDAwMDAwMDAgICAwMDAgICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuXG5wYXJzZU9wdGlvbnMgPSAtPlxuXG4gICAga25vd24gPSBEZWJ1ZzpCb29sZWFuXG4gICAgc2hvcnQgPSBEOictLURlYnVnJyBwOictLWpzJ1xuICAgIFNXSVRDSEVTLm1hcCAocykgLT4gbCA9IHNbMV0uc3BsaXQoJyAnKVswXVsyLi5dOyBrbm93bltsXSA9IHNbM10gaWYgc1szXTsgc2hvcnRbc1swXVsxXV0gPSBcIi0tI3tsfVwiIGlmIHNbMF0hPScnXG4gICAgRkVBVFVSRVMubWFwIChmKSAtPiBrbm93bltmLmxhZ10gPSBCb29sZWFuXG4gICAgXG4gICAgbyA9IG9wdHMgPSBub3B0IGtub3duLCBzaG9ydFxuICAgICAgICBcbiAgICBvLmNvbXBpbGUgIG9yPSAhIW8ub3V0cHV0XG4gICAgby5hcmd1bWVudHMgID0gby5hcmd2LnJlbWFpblxuICAgIG8ucHJlbHVkZSAgICA9IG1ha2VQcmVsdWRlIG8ucmVxdWlyZSBpZiBvLnJlcXVpcmVcbiAgICBvLnJ1biAgICAgICAgPSBub3QgKG8uY29tcGlsZSBvciBvLmpzIG9yIG8ubWFwIG9yIG8udG9rZW5zIG9yIG8ucGFyc2UpXG4gICAgby5qcyAgICAgICAgID0gISEoby5qcyBvciBvLmV2YWwgb3Igby5zdGRpbyBhbmQgby5jb21waWxlKSAjIGpzIG91dHB1dCBpcyBwYXNzZWQgdG8gZXZhbCBhbmQgc3RkaW8gY29tcGlsZVxuICAgIFxuICAgIG8uZmVhdHVyZSA9IHt9XG4gICAgRkVBVFVSRVMubWFwIChmKSAtPiBvLmZlYXR1cmVbZi5rZXldID0gb1tmLmZsYWddID8gdHJ1ZTsgZGVsZXRlIG9bZi5mbGFnXVxuICAgIFxuICAgIGlmIG8uRGVidWdcbiAgICAgICAgZGVsZXRlIG8uYXJndlxuICAgICAgICBsb2cgc3RyaW5naWZ5IG9cblxuIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4jIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG5cbnJ1biA9IC0+XG4gICAgXG4gICAgcGFyc2VPcHRpb25zKClcbiAgICBcbiAgICBpZiBvcHRzLmZlYXR1cmUuY29sb3IgPT0gZmFsc2VcbiAgICAgICAgY29sb3JldHRlLm9wdGlvbnMuZW5hYmxlZCA9IGZhbHNlXG4gICAgICAgIFxuICAgIHJldHVybiBsb2dGZWF0dXJlcygpICBpZiBvcHRzLmZlYXR1cmVzXG4gICAgcmV0dXJuIHVzYWdlKCkgICAgICAgIGlmIG9wdHMuaGVscFxuICAgIHJldHVybiB2ZXJzaW9uKCkgICAgICBpZiBvcHRzLnZlcnNpb25cbiAgICByZXR1cm4gc3RhcnRSZXBsKCkgICAgaWYgb3B0cy5pbnRlcmFjdGl2ZVxuICAgIHJldHVybiBjb21waWxlU3RkaW8oKSBpZiBvcHRzLnN0ZGlvXG4gICAgaWYgb3B0cy5ldmFsXG4gICAgICAgIGZvciBldmFsIGluIG9wdHMuZXZhbFxuICAgICAgICAgICAgY29tcGlsZVNjcmlwdCBldmFsXG4gICAgICAgIHJldHVyblxuICAgIHJldHVybiBzdGFydFJlcGwoKSAgICBpZiBub3Qgb3B0cy5hcmd1bWVudHMubGVuZ3RoXG4gICAgXG4gICAgbGl0ZXJhbHMgPSBpZiBub3Qgb3B0cy53YXRjaCBhbmQgbm90IG9wdHMuY29tcGlsZSB0aGVuIG9wdHMuYXJndW1lbnRzLnNwbGljZSAxIGVsc2UgW11cbiAgICBcbiAgICBwcm9jZXNzLmFyZ3YgPSBwcm9jZXNzLmFyZ3ZbMC4uMV0uY29uY2F0IGxpdGVyYWxzXG4gICAgcHJvY2Vzcy5hcmd2WzBdID0gJ2tvZmZlZSdcblxuICAgIG9wdHMub3V0cHV0ID0gc2xhc2gucmVzb2x2ZSBvcHRzLm91dHB1dCBpZiBvcHRzLm91dHB1dFxuICAgIGZvciBzb3VyY2UgaW4gb3B0cy5hcmd1bWVudHNcbiAgICAgICAgc291cmNlID0gc2xhc2gucmVzb2x2ZSBzb3VyY2VcbiAgICAgICAgXG4gICAgICAgIGlmIG9wdHMud2F0Y2hcbiAgICAgICAgICAgIHdhdGNoUGF0aCBzb3VyY2VcbiAgICAgICAgZWxzZSAgICAgXG4gICAgICAgICAgICBjb21waWxlUGF0aCBzb3VyY2U6c291cmNlLCB0b3BMZXZlbDp5ZXNcblxuZXhwb3J0cy5ydW4gPSBydW5cbiAgICAgICAgXG5zdGFydFJlcGwgPSAtPlxuICAgIFxuICAgICMgTWFrZSB0aGUgUkVQTCB1c2UgdGhlIGdsb2JhbCBjb250ZXh0IHNvIGFzIHRvIFxuICAgICMgICAoYSkgYmUgY29uc2lzdGVudCB3aXRoIHRoZSBgbm9kZWAgUkVQTCBhbmQsIHRoZXJlZm9yZSwgXG4gICAgIyAgIChiKSBtYWtlIHBhY2thZ2VzIHRoYXQgbW9kaWZ5IG5hdGl2ZSBwcm90b3R5cGVzIChzdWNoIGFzICdjb2xvcnMnIGFuZCAnc3VnYXInKSB3b3JrIGFzIGV4cGVjdGVkLlxuICAgIFxuICAgIHJlcGxDbGlPcHRzID0gdXNlR2xvYmFsOiB5ZXNcbiAgICByZXBsQ2xpT3B0cy5wcmVsdWRlID0gb3B0cy5wcmVsdWRlXG4gICAgcmVxdWlyZSgnLi9yZXBsJykuc3RhcnQgcmVwbENsaU9wdHNcblxubWFrZVByZWx1ZGUgPSAocmVxdWlyZXMpIC0+XG4gICAgXG4gICAgcmVxdWlyZXMubWFwIChtb2R1bGUpIC0+XG4gICAgICAgIFtfLCBuYW1lLCBtb2R1bGVdID0gbWF0Y2ggaWYgbWF0Y2ggPSBtb2R1bGUubWF0Y2goL14oLiopPSguKikkLylcbiAgICAgICAgbmFtZSB8fD0gYmFzZUZpbGVOYW1lIG1vZHVsZSwgeWVzLCB1c2VXaW5QYXRoU2VwXG4gICAgICAgIFwiI3tuYW1lfSA9IHJlcXVpcmUoJyN7bW9kdWxlfScpXCJcbiAgICAuam9pbiAnOydcblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcblxuIyBDb21waWxlIGEgc2NyaXB0IG9yIGEgZGlyZWN0b3J5LiBJZiBhIGRpcmVjdG9yeSBpcyBwYXNzZWQsIHJlY3Vyc2l2ZWx5IGNvbXBpbGUgYWxsICcuY29mZmVlJyBhbmQgJy5rb2ZmZWUnIGZpbGVzLlxuXG5jb21waWxlUGF0aCA9IChzb3VyY2U6LCB0b3BMZXZlbDpubykgLT5cblxuICAgIHJldHVybiBpZiBub3QgdG9wTGV2ZWwgYW5kIGhpZGRlbiBzb3VyY2VcbiAgICAgICAgICAgICAgXG4gICAgdHJ5XG4gICAgICAgIHN0YXRzID0gZnMuc3RhdFN5bmMgc291cmNlXG4gICAgY2F0Y2ggZXJyXG4gICAgICAgIGlmIGVyci5jb2RlIGlzICdFTk9FTlQnXG4gICAgICAgICAgICBlcnJvciBcIkNvbW1hbmQuY29tcGlsZVBhdGggY2FuJ3Qgc3RhdCAnI3tzb3VyY2V9J1wiXG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQgMVxuICAgICAgICB0aHJvdyBlcnJcbiAgICAgICAgXG4gICAgaWYgc3RhdHMuaXNEaXJlY3RvcnkoKVxuICAgICAgICBcbiAgICAgICAgaWYgc2xhc2guYmFzZW5hbWUoc291cmNlKSBpbiBbJ25vZGVfbW9kdWxlcycgJy5naXQnXVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgb3B0cy5ydW5cbiAgICAgICAgICAgIGNvbXBpbGVQYXRoIHNvdXJjZTpmaW5kRGlyZWN0b3J5SW5kZXgoc291cmNlKSwgdG9wTGV2ZWw6dG9wTGV2ZWxcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICBcbiAgICAgICAgbG9nICdDb21tYW5kLmNvbXBpbGVQYXRoIGRpcjonLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuICAgICAgICBcbiAgICAgICAgdHJ5XG4gICAgICAgICAgICBmaWxlcyA9IGZzLnJlYWRkaXJTeW5jIHNvdXJjZVxuICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgIGlmIGVyci5jb2RlIGlzICdFTk9FTlQnIHRoZW4gcmV0dXJuIFxuICAgICAgICAgICAgdGhyb3cgZXJyXG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIGZpbGUgaW4gZmlsZXNcbiAgICAgICAgICAgIGNvbXBpbGVQYXRoIHNvdXJjZTpzbGFzaC5qb2luIHNvdXJjZSwgZmlsZVxuICAgICAgICAgICAgXG4gICAgZWxzZSBpZiB0b3BMZXZlbCBvciBpc0NvZmZlZSBzb3VyY2VcbiAgICAgICAgXG4gICAgICAgIHRyeVxuICAgICAgICAgICAgY29kZSA9IGZzLnJlYWRGaWxlU3luYyBzb3VyY2VcbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICBpZiBlcnIuY29kZSBpcyAnRU5PRU5UJyB0aGVuIHJldHVyblxuICAgICAgICAgICAgdGhyb3cgZXJyXG4gICAgICAgIFxuICAgICAgICBsb2cgJ0NvbW1hbmQuY29tcGlsZVBhdGggZmlsZTonLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuICAgICAgICAgICAgXG4gICAgICAgIGNvbXBpbGVTY3JpcHQgY29kZS50b1N0cmluZygpLCBzb3VyY2VcbiAgICAgICAgXG5maW5kRGlyZWN0b3J5SW5kZXggPSAoc291cmNlKSAtPlxuXG4gICAgZm9yIGV4dCBpbiBLb2ZmZWUuRklMRV9FWFRFTlNJT05TXG4gICAgICAgIGluZGV4ID0gc2xhc2guam9pbiBzb3VyY2UsIFwiaW5kZXgje2V4dH1cIlxuICAgICAgICB0cnlcbiAgICAgICAgICAgIHJldHVybiBpbmRleCBpZiAoZnMuc3RhdFN5bmMgaW5kZXgpLmlzRmlsZSgpXG4gICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgdGhyb3cgZXJyIHVubGVzcyBlcnIuY29kZSBpcyAnRU5PRU5UJ1xuICAgIGVycm9yIFwiTWlzc2luZyBpbmRleC5jb2ZmZWUgaW4gI3tzb3VyY2V9XCJcbiAgICBwcm9jZXNzLmV4aXQgMVxuXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgICAgIDAwMCAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgICAgXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgICAgXG5cbiMgQ29tcGlsZSBhIHNpbmdsZSBzb3VyY2Ugc2NyaXB0LCBjb250YWluaW5nIHRoZSBnaXZlbiBjb2RlLCBhY2NvcmRpbmcgdG8gdGhlIHJlcXVlc3RlZCBvcHRpb25zLiBcbiMgSWYgZXZhbHVhdGluZyB0aGUgc2NyaXB0IGRpcmVjdGx5IHNldHMgYF9fZmlsZW5hbWVgLCBgX19kaXJuYW1lYCBhbmQgYG1vZHVsZS5maWxlbmFtZWAgdG8gYmUgY29ycmVjdCByZWxhdGl2ZSB0byB0aGUgc2NyaXB0J3Mgc2xhc2guXG5cbmNvbXBpbGVTY3JpcHQgPSAoY29kZSwgc291cmNlPW51bGwpIC0+XG4gICAgXG4gICAgbyA9IG9wdHNcbiAgICBvcHRpb25zID0gY29tcGlsZU9wdGlvbnMgc291cmNlXG4gICAgXG4gICAgdHJ5XG4gICAgICAgIHQgPSB0YXNrID0ge3NvdXJjZSwgY29kZSwgb3B0aW9uc31cbiAgICAgICAgXG4gICAgICAgIGlmIG8udG9rZW5zXG4gICAgICAgICAgICBwcmludFRva2VucyBLb2ZmZWUudG9rZW5zIHQuY29kZSwgdC5vcHRpb25zXG4gICAgICAgIGVsc2UgaWYgby5mcmFnbWVudHNcbiAgICAgICAgICAgIHByaW50RnJhZ21lbnRzIGNvZGUsIEtvZmZlZS5mcmFnbWVudHMgdC5jb2RlLCB0Lm9wdGlvbnNcbiAgICAgICAgZWxzZSBpZiBvLmNvZmZlZVxuICAgICAgICAgICAgcHJpbnRSZXdyaXRlciBLb2ZmZWUudG9rZW5zIHQuY29kZSwgdC5vcHRpb25zXG4gICAgICAgIGVsc2UgaWYgby5wYXJzZVxuICAgICAgICAgICAgcHJpbnRMaW5lIEtvZmZlZS5ub2Rlcyh0LmNvZGUsIHQub3B0aW9ucykudG9TdHJpbmcoKS50cmltKClcbiAgICAgICAgZWxzZSBpZiBvLnJ1blxuICAgICAgICAgICAgS29mZmVlLnJlZ2lzdGVyKClcbiAgICAgICAgICAgIEtvZmZlZS5ldmFsIG9wdHMucHJlbHVkZSwgdC5vcHRpb25zIGlmIG9wdHMucHJlbHVkZVxuICAgICAgICAgICAgdC5vcHRpb25zLmZpbGVuYW1lID89IG9wdGlvbnMuc291cmNlXG4gICAgICAgICAgICBpZiBvcHRzLm5vb3AgXG4gICAgICAgICAgICAgICAgbG9nIFwibm9vcCBydW4gI3tzb3VyY2V9XCJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBLb2ZmZWUucnVuIHQuY29kZSwgdC5vcHRpb25zXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGNvbXBpbGVkID0gS29mZmVlLmNvbXBpbGUgdC5jb2RlLCB0Lm9wdGlvbnNcbiAgICAgICAgICAgIHQub3V0cHV0ID0gY29tcGlsZWRcbiAgICAgICAgICAgIGlmIG8ubWFwXG4gICAgICAgICAgICAgICAgdC5vdXRwdXQgPSBjb21waWxlZC5qc1xuICAgICAgICAgICAgICAgIHQuc291cmNlTWFwID0gY29tcGlsZWQudjNTb3VyY2VNYXBcblxuICAgICAgICAgICAgaWYgby5qc1xuICAgICAgICAgICAgICAgIGlmIG9wdHMubm9vcCB0aGVuIGxvZyBcIm5vb3AganMgI3tzb3VyY2V9XCJcbiAgICAgICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgICAgICBwcmludExpbmUgdC5vdXRwdXQudHJpbSgpXG4gICAgICAgICAgICBlbHNlIGlmIG8uY29tcGlsZSBvciBvLm1hcFxuICAgICAgICAgICAgICAgIGlmIG9wdHMubm9vcCB0aGVuIGxvZyBcIm5vb3Agd3JpdGUgI3tvcHRpb25zLmpzUGF0aH1cIlxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVKcyB0LnNvdXJjZSwgdC5vdXRwdXQsIG9wdGlvbnMuanNQYXRoLCB0LnNvdXJjZU1hcFxuICAgIGNhdGNoIGVyclxuICAgICAgICBcbiAgICAgICAgbWVzc2FnZSA9IGVyci5tZXNzYWdlXG4gICAgICAgIFxuICAgICAgICBpZiBlcnIgaW5zdGFuY2VvZiBTeW50YXhFcnJvclxuICAgICAgICAgICAgcHJpbnRMaW5lIG1lc3NhZ2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcHJpbnRMaW5lIGVyci5zdGFja1xuICAgICAgICBcbiAgICAgICAgaWYgby53YXRjaCBvciBvLmV2YWxcbiAgICAgICAgICAgIHByaW50ICdcXHgwNycgIyBiZWxsXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHByb2Nlc3MuZXhpdCAxXG5cbmNvbXBpbGVPcHRpb25zID0gKHNvdXJjZSkgLT4gIyBUaGUgY29tcGlsZS10aW1lIG9wdGlvbnMgdG8gcGFzcyB0byB0aGUgY29tcGlsZXIuXG4gICAgXG4gICAgY29wdHMgPSBPYmplY3QuYXNzaWduIHt9LCBvcHRzXG4gICAgY29wdHMuc291cmNlTWFwID0gb3B0cy5tYXBcbiAgICBjb3B0cy5pbmxpbmVNYXAgPSBvcHRzWydpbmxpbmUtbWFwJ11cblxuICAgIGlmIHNvdXJjZVxuICAgICAgICBcbiAgICAgICAgY3dkID0gcHJvY2Vzcy5jd2QoKVxuICAgICAgICBqc1BhdGggPSBvdXRwdXRQYXRoIHNvdXJjZSwgJy5qcydcbiAgICAgICAganNEaXIgPSBzbGFzaC5kaXJuYW1lIGpzUGF0aFxuICAgICAgICBzcmNSb290ID0gc2xhc2gucmVsYXRpdmUgc2xhc2guZGlyKHNvdXJjZSksIGpzRGlyXG4gICAgICAgIGNvcHRzID0gbWVyZ2UgY29wdHMsIHtcbiAgICAgICAgICAgIGpzUGF0aFxuICAgICAgICAgICAgc291cmNlOiBzb3VyY2VcbiAgICAgICAgICAgIHNvdXJjZVJvb3Q6IHNyY1Jvb3RcbiAgICAgICAgICAgIHNvdXJjZUZpbGVzOiBbc2xhc2gucmVsYXRpdmUgc291cmNlLCBzbGFzaC5qb2luIGN3ZCwgc3JjUm9vdF1cbiAgICAgICAgICAgIGdlbmVyYXRlZEZpbGU6IHNsYXNoLmZpbGUganNQYXRoXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgIyBsb2cgJ2NvbXBpbGVPcHRpb25zJyBjb3B0c1xuICAgIGNvcHRzXG4gICAgICAgICAgICBcbiMgQXR0YWNoIHRoZSBhcHByb3ByaWF0ZSBsaXN0ZW5lcnMgdG8gY29tcGlsZSBzY3JpcHRzIGluY29taW5nIG92ZXIgKipzdGRpbioqLCBhbmQgd3JpdGUgdGhlbSBiYWNrIHRvICoqc3Rkb3V0KiouXG5cbmNvbXBpbGVTdGRpbyA9IC0+XG4gICAgXG4gICAgYnVmZmVycyA9IFtdXG4gICAgc3RkaW4gPSBwcm9jZXNzLm9wZW5TdGRpbigpXG4gICAgc3RkaW4ub24gJ2RhdGEnLCAoYnVmZmVyKSAtPiBidWZmZXJzLnB1c2ggYnVmZmVyIGlmIGJ1ZmZlclxuICAgIHN0ZGluLm9uICdlbmQnLCAtPiBjb21waWxlU2NyaXB0IEJ1ZmZlci5jb25jYXQoYnVmZmVycykudG9TdHJpbmcoKVxuXG4jIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwMDAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuIyAwMCAgICAgMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICBcblxud2F0Y2hQYXRoID0gKHNvdXJjZSkgLT4gIyBXYXRjaCBhIGZpbGUgb3IgZGlyZWN0b3J5LlxuICAgIFxuICAgIHRyeVxuICAgICAgICBzdGF0cyA9IGZzLnN0YXRTeW5jIHNvdXJjZVxuICAgIGNhdGNoIGVyclxuICAgICAgICByZXR1cm4gaWYgZXJyLmNvZGUgaXMgJ0VOT0VOVCdcbiAgICAgICAgcmV0dXJuIGVycm9yIFwiQ29tbWFuZC53YXRjaFBhdGggY2FuJ3Qgc3RhdCAnI3tzb3VyY2V9J1wiLCBlcnJcbiAgICAgICAgICAgICAgICBcbiAgICBpZiBzdGF0cy5pc0RpcmVjdG9yeSgpXG4gICAgICAgIHdhdGNoRGlyIHNvdXJjZVxuICAgIGVsc2VcbiAgICAgICAgd2F0Y2hGaWxlIHNvdXJjZVxuXG4jIFdhdGNoIGEgc2luZ2xlIGZpbGUgdXNpbmcgYGZzLndhdGNoYCwgcmVjb21waWxpbmcgaXQgZXZlcnkgdGltZSB0aGUgZmlsZSBpcyB1cGRhdGVkLlxuIyBNYXkgYmUgdXNlZCBpbiBjb21iaW5hdGlvbiB3aXRoIG90aGVyIG9wdGlvbnMsIHN1Y2ggYXMgYC0tcHJpbnRgLlxuICAgICAgICBcbndhdGNoRmlsZSA9IChzb3VyY2UpIC0+XG4gICAgXG4gICAgcmV0dXJuIGlmIG5vdCBpc0NvZmZlZSBzb3VyY2VcbiAgICBcbiAgICBsb2cgJ0NvbW1hbmQud2F0Y2hGaWxlJywgc291cmNlIGlmIG9wdHMuRGVidWdcbiAgICBcbiAgICB3YXRjaGVyICAgICAgICA9IG51bGxcbiAgICBwcmV2U3RhdHMgICAgICA9IG51bGxcbiAgICBjb21waWxlVGltZW91dCA9IG51bGxcblxuICAgIHN0YXJ0V2F0Y2hlciA9IC0+XG4gICAgICAgIFxuICAgICAgICB3YXRjaGVyID0gZnMud2F0Y2ggc291cmNlXG4gICAgICAgIC5vbiAnY2hhbmdlJywgKGNoYW5nZSkgLT5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIGlmIGNoYW5nZSAhPSAnY2hhbmdlJ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBsb2cgJ0NvbW1hbmQud2F0Y2hGaWxlJywgY2hhbmdlLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQgY29tcGlsZVRpbWVvdXRcbiAgICAgICAgICAgIGNvbXBpbGVUaW1lb3V0ID0gd2FpdCAyNSwgLT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmcy5zdGF0IHNvdXJjZSwgKGVyciwgc3RhdHMpIC0+XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB3YXRjaGVyLmNsb3NlKCkgaWYgZXJyPy5jb2RlIGlzICdFTk9FTlQnXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnJvciBlcnIgaWYgZXJyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpZiBwcmV2U3RhdHMgYW5kIHN0YXRzLm10aW1lLmdldFRpbWUoKSBpcyBwcmV2U3RhdHMubXRpbWUuZ2V0VGltZSgpIGFuZCBzdGF0cy5zaXplIGlzIHByZXZTdGF0cy5zaXplXG4gICAgICAgICAgICAgICAgICAgIHByZXZTdGF0cyA9IHN0YXRzXG4gICAgICAgICAgICAgICAgICAgIGZzLnJlYWRGaWxlIHNvdXJjZSwgKGVyciwgY29kZSkgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnJvciBlcnIgaWYgZXJyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2cgJ0NvbW1hbmQud2F0Y2hGaWxlIGNvbXBpbGUnLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tcGlsZVNjcmlwdCBjb2RlLnRvU3RyaW5nKCksIHNvdXJjZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIC5vbiAnZXJyb3InLCAoZXJyKSAtPlxuICAgICAgICAgICAgdGhyb3cgZXJyIHVubGVzcyBlcnIuY29kZSBpcyAnRVBFUk0nXG5cbiAgICB0cnlcbiAgICAgICAgc3RhcnRXYXRjaGVyKClcbiAgICBjYXRjaCBlcnJcbiAgICAgICAgZXJyb3IgZXJyXG5cbndhdGNoRGlyID0gKHNvdXJjZSkgLT5cbiAgICBcbiAgICBsb2cgJ0NvbW1hbmQud2F0Y2hEaXInLCBzb3VyY2UgaWYgb3B0cy5EZWJ1Z1xuICAgIFxuICAgIHdhdGNoZXIgPSBudWxsXG5cbiAgICBzdGFydFdhdGNoZXIgPSAtPlxuXG4gICAgICAgIHRyeVxuICAgICAgICAgICAgZmlsZXMgPSBmcy5yZWFkZGlyU3luYyBzb3VyY2VcbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICByZXR1cm4gaWYgZXJyPy5jb2RlIGlzICdFTk9FTlQnXG4gICAgICAgICAgICB0aHJvdyBlcnJcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgZmlsZSBpbiBmaWxlc1xuICAgICAgICAgICAgY29udGludWUgaWYgZmlsZVswXSA9PSAnLidcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIGZpbGUgaW4gWydub2RlX21vZHVsZXMnXVxuICAgICAgICAgICAgd2F0Y2hQYXRoIHNsYXNoLmpvaW4gc291cmNlLCBmaWxlXG4gICAgICAgIFxuICAgICAgICB3YXRjaGVyID0gZnMud2F0Y2ggc291cmNlXG4gICAgICAgIC5vbiAnZXJyb3InLCAoZXJyKSAtPlxuICAgICAgICAgICAgdGhyb3cgZXJyIHVubGVzcyBlcnIuY29kZSBpcyAnRVBFUk0nXG4gICAgICAgICAgICB3YXRjaGVyLmNsb3NlKClcbiAgICAgICAgLm9uICdjaGFuZ2UnLCAoY2hhbmdlLCBwKSAtPlxuICAgICAgICAgICAgaWYgY2hhbmdlID09ICdyZW5hbWUnXG4gICAgICAgICAgICAgICAgbG9nICdDb21tYW5kLndhdGNoRGlyJywgY2hhbmdlLCBzbGFzaC5qb2luIHNvdXJjZSwgcCBpZiBvcHRzLkRlYnVnXG4gICAgICAgICAgICAgICAgd2F0Y2hQYXRoIHNsYXNoLmpvaW4gc291cmNlLCBwXG4gICAgICAgICAgICBcbiAgICB0cnlcbiAgICAgICAgc3RhcnRXYXRjaGVyKClcbiAgICBjYXRjaCBlcnJcbiAgICAgICAgcmV0dXJuIGlmIGVyci5jb2RlIGlzICdFTk9FTlQnXG4gICAgICAgIHRocm93IGVyclxuXG4jIEdldCB0aGUgY29ycmVzcG9uZGluZyBvdXRwdXQgSmF2YVNjcmlwdCBwYXRoIGZvciBhIHNvdXJjZSBmaWxlLlxuICAgIFxub3V0cHV0UGF0aCA9IChzb3VyY2UsIGV4dGVuc2lvbikgLT5cbiAgICBcbiAgICBiYXNlbmFtZSA9IGJhc2VGaWxlTmFtZSBzb3VyY2UsIHllcywgdXNlV2luUGF0aFNlcFxuICAgIGlmIG9wdHMub3V0cHV0XG4gICAgICAgIGRpciA9IG9wdHMub3V0cHV0XG4gICAgZWxzZVxuICAgICAgICBkaXIgPSBzbGFzaC5kaXJuYW1lIHNvdXJjZVxuICAgIHNsYXNoLmpvaW4gZGlyLCBiYXNlbmFtZSArIGV4dGVuc2lvblxuXG4jIFJlY3Vyc2l2ZWx5IG1rZGlyLCBsaWtlIGBta2RpciAtcGAuXG5cbm1rZGlycCA9IChkaXIsIGZuKSAtPlxuICAgIG1vZGUgPSAwbzc3NyAmIH5wcm9jZXNzLnVtYXNrKClcblxuICAgIGRvIG1rZGlycyA9IChwID0gZGlyLCBmbikgLT5cbiAgICAgICAgZnMuZXhpc3RzIHAsIChleGlzdHMpIC0+XG4gICAgICAgICAgICBpZiBleGlzdHNcbiAgICAgICAgICAgICAgICBmbigpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgbWtkaXJzIHNsYXNoLmRpcm5hbWUocCksIC0+XG4gICAgICAgICAgICAgICAgICAgIGZzLm1rZGlyIHAsIG1vZGUsIChlcnIpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm4gZXJyIGlmIGVyclxuICAgICAgICAgICAgICAgICAgICAgICAgZm4oKVxuXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgIDAwMCAgIDAwMDAwMDAgIFxuIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgICAgICAwMDAgIDAwMCAgICAgICBcbiMgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgICAgICAgMDAwICAwMDAwMDAwICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuIyAwMCAgICAgMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcblxuIyBXcml0ZSBvdXQgYSBKYXZhU2NyaXB0IHNvdXJjZSBmaWxlIHdpdGggdGhlIGNvbXBpbGVkIGNvZGUuIFxuIyBCeSBkZWZhdWx0LCBmaWxlcyBhcmUgd3JpdHRlbiBvdXQgaW4gYGN3ZGAgYXMgYC5qc2AgZmlsZXMgd2l0aCB0aGUgc2FtZSBuYW1lLCBidXQgdGhlIG91dHB1dCBkaXJlY3RvcnkgY2FuIGJlIGN1c3RvbWl6ZWQgd2l0aCBgLS1vdXRwdXRgLlxuIyBJZiBgZ2VuZXJhdGVkU291cmNlTWFwYCBpcyBwcm92aWRlZCwgdGhpcyB3aWxsIHdyaXRlIGEgYC5qcy5tYXBgIGZpbGUgaW50byB0aGUgc2FtZSBkaXJlY3RvcnkgYXMgdGhlIGAuanNgIGZpbGUuXG5cbndyaXRlSnMgPSAoc291cmNlLCBqcywganNQYXRoLCBnZW5lcmF0ZWRTb3VyY2VNYXAgPSBudWxsKSAtPlxuICAgIFxuICAgIHNvdXJjZU1hcFBhdGggPSBvdXRwdXRQYXRoIHNvdXJjZSwgJy5qcy5tYXAnXG4gICAganNEaXIgPSBzbGFzaC5kaXJuYW1lIGpzUGF0aFxuICAgIGNvbXBpbGUgPSAtPlxuICAgICAgICBpZiBvcHRzLmNvbXBpbGVcbiAgICAgICAgICAgIGpzID0gJyAnIGlmIGpzLmxlbmd0aCA8PSAwXG4gICAgICAgICAgICBpZiBnZW5lcmF0ZWRTb3VyY2VNYXAgdGhlbiBqcyA9IFwiI3tqc31cXG4vLyMgc291cmNlTWFwcGluZ1VSTD0je2Jhc2VGaWxlTmFtZSBzb3VyY2VNYXBQYXRoLCBubywgdXNlV2luUGF0aFNlcH1cXG5cIlxuICAgICAgICAgICAgZnMud3JpdGVGaWxlIGpzUGF0aCwganMsIChlcnIpIC0+XG4gICAgICAgICAgICAgICAgaWYgZXJyXG4gICAgICAgICAgICAgICAgICAgIHByaW50TGluZSBlcnIubWVzc2FnZVxuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQgMVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgb3B0cy5jb21waWxlIGFuZCBvcHRzLndhdGNoXG4gICAgICAgICAgICAgICAgICAgIHRpbWVMb2cgXCJjb21waWxlZCAje3NvdXJjZX1cIlxuICAgICAgICBpZiBnZW5lcmF0ZWRTb3VyY2VNYXBcbiAgICAgICAgICAgIGZzLndyaXRlRmlsZSBzb3VyY2VNYXBQYXRoLCBnZW5lcmF0ZWRTb3VyY2VNYXAsIChlcnIpIC0+XG4gICAgICAgICAgICAgICAgaWYgZXJyXG4gICAgICAgICAgICAgICAgICAgIHByaW50TGluZSBcIkNvdWxkIG5vdCB3cml0ZSBzb3VyY2UgbWFwOiAje2Vyci5tZXNzYWdlfVwiXG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCAxXG4gICAgZnMuZXhpc3RzIGpzRGlyLCAoaXRFeGlzdHMpIC0+XG4gICAgICAgIGlmIGl0RXhpc3RzIHRoZW4gY29tcGlsZSgpIGVsc2UgbWtkaXJwIGpzRGlyLCBjb21waWxlXG5cbndhaXQgPSAobWlsbGlzZWNvbmRzLCBmdW5jKSAtPiBzZXRUaW1lb3V0IGZ1bmMsIG1pbGxpc2Vjb25kcyAjIENvbnZlbmllbmNlIGZvciBjbGVhbmVyIHNldFRpbWVvdXRzLlxuXG50aW1lTG9nID0gKG1lc3NhZ2UpIC0+IGxvZyBcIiN7KG5ldyBEYXRlKS50b0xvY2FsZVRpbWVTdHJpbmcoKX0gLSAje21lc3NhZ2V9XCJcblxuIyAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgICAgICBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAwICAgICAgIDAwMCAgXG4jICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcblxucHJpbnRUb2tlbnMgPSAodG9rZW5zKSAtPlxuXG4gICAgZm9yIGluZGV4IGluIFswLi4udG9rZW5zLmxlbmd0aF1cbiAgICAgICAgdG9rZW4gID0gdG9rZW5zW2luZGV4XVxuICAgICAgICB0YWcgICAgPSB0b2tlblswXVxuICAgICAgICB2YWx1ZSAgPSB0b2tlblsxXS50b1N0cmluZygpLnJlcGxhY2UoL1xcbi8sICdcXFxcbicpXG4gICAgICAgIGN0YWcgICA9IGdyYXkgdGFnXG4gICAgICAgIGN2YWx1ZSA9IGJvbGQgeWVsbG93IHZhbHVlXG4gICAgICAgIGluZGV4ICA9IGdyYXkgZGltIGluZGV4XG4gICAgICAgIGlmIHRhZyA9PSAnVEVSTUlOQVRPUidcbiAgICAgICAgICAgIHByaW50ICdcXG5cXG4nXG4gICAgICAgIGVsc2UgaWYgdGFnID09ICdJTkRFTlQnXG4gICAgICAgICAgICBwcmludCBncmF5IGRpbSAnSU5EICdcbiAgICAgICAgZWxzZSBpZiB0YWcgPT0gJ09VVERFTlQnXG4gICAgICAgICAgICBwcmludCBncmF5IGRpbSAnT1VUICdcbiAgICAgICAgZWxzZSBpZiB0YWcgaW4gWydDTEFTUycgJ1BBUkFNX1NUQVJUJyAnUEFSQU1fRU5EJyAnTlVMTCddXG4gICAgICAgICAgICBwcmludCBcIiN7aW5kZXh9I3tjdGFnfSBcIlxuICAgICAgICBlbHNlIGlmIHRhZyA9PSB2YWx1ZVxuICAgICAgICAgICAgcHJpbnQgXCIje2luZGV4fSN7Y3ZhbHVlfSBcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwcmludCBcIiN7aW5kZXh9I3tjdGFnfT0je2N2YWx1ZX0gXCJcblxuIyAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4jIDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAgICAwMDAgICAgICAgICAgMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG5cbnByaW50RnJhZ21lbnRzID0gKGNvZGUsIGZyYWdtZW50cykgLT5cblxuICAgIGxvZyAnJ1xuICAgIGZvciBpbmRleCBpbiBbMC4uLmZyYWdtZW50cy5sZW5ndGhdXG4gICAgICAgIGZyYWcgPSBmcmFnbWVudHNbaW5kZXhdXG4gICAgICAgIGxpbmUgPSBibHVlQnJpZ2h0ICcnK2ZyYWcubG9jYXRpb25EYXRhLmZpcnN0X2xpbmUgXG4gICAgICAgIGlmIGZyYWcubG9jYXRpb25EYXRhLmxhc3RfbGluZSAhPSBmcmFnLmxvY2F0aW9uRGF0YS5maXJzdF9saW5lIFxuICAgICAgICAgICAgbGluZSArPSBkaW0gYmx1ZSAnLScrZnJhZy5sb2NhdGlvbkRhdGEubGFzdF9saW5lXG4gICAgICAgIGVsc2UgbGluZSArPSAnICAnXG4gICAgICAgIGNvbHVtbiA9IGJsdWUgJycrZnJhZy5sb2NhdGlvbkRhdGEuZmlyc3RfY29sdW1uIFxuICAgICAgICB0cmltbWVkID0gZnJhZy5jb2RlLnJlcGxhY2UoLyAvZywgJycpXG4gICAgICAgIGlmIHRyaW1tZWQubGVuZ3RoXG4gICAgICAgICAgICBpZiB0cmltbWVkLnJlcGxhY2UoL1xcbi9nLCAnJykubGVuZ3RoID09IDBcbiAgICAgICAgICAgICAgICBsb2cgJydcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBsb2cgbGluZSArICcgJyArIGNvbHVtbiArICcgJyArICAoZGltIGdyYXkgaGVscGVycy5wYWQgZnJhZy50eXBlLCAyMCkgKyB5ZWxsb3dCcmlnaHQoZnJhZy5jb2RlKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICBtYXAgPSBLb2ZmZWUuY29tcGlsZSBjb2RlLCBcbiAgICAgICAgICAgIGZlYXR1cmU6IGhlYWRlcjogdHJ1ZVxuICAgICAgICAgICAgZmlsZW5hbWU6ICdmcmFnbWVudHMnXG4gICAgICAgICAgICBzb3VyY2VNYXA6IHllc1xuICAgICAgICAgICAgIyBpbmxpbmVNYXA6IHllc1xuXG4gICAgbWFwTGluZVRvU3RyaW5nID0gKG1hcGxpbmUsIGtleT0nc291cmNlTGluZScpIC0+XG4gICAgICAgIHMgPSAnJ1xuICAgICAgICBmb3IgY29sdW1uIGluIG1hcGxpbmUuY29sdW1uc1xuICAgICAgICAgICAgaWYgY29sdW1uXG4gICAgICAgICAgICAgICAgcyArPSBjb2x1bW5ba2V5XSUxMFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHMgKz0gJyAnXG4gICAgICAgIHNcbiAgICAgICAgICAgIFxuICAgIGxvZyBncmF5IGRpbSAnIDEyMzQ1Njc4OSAxMjM0NTY3ODkgMTIzNDU2Nzg5IDEyMzQ1Njc4OSAxMjM0NTY3ODknXG4gICAgY29kZUxpbmVzID0gY29kZS5zcGxpdCAnXFxuJ1xuICAgIGZvciBpIGluIFswLi4uY29kZUxpbmVzLmxlbmd0aF1cbiAgICAgICAgaWYgY29kZUxpbmVzW2ldLnRyaW0oKS5sZW5ndGhcbiAgICAgICAgICAgIGxvZyBncmF5KGRpbSBpKzEpICsgZ3JlZW5CcmlnaHQgY29kZUxpbmVzW2ldXG4gICAgICAgIGVsc2UgbG9nICcnXG4gICAgICAgICAgICBcbiAgICBsb2cgJydcbiAgICBsb2cgZ3JheSBkaW0gJyAxMjM0NTY3ODkgMTIzNDU2Nzg5IDEyMzQ1Njc4OSAxMjM0NTY3ODkgMTIzNDU2Nzg5J1xuICAgIGNvZGVMaW5lcyA9IG1hcC5qcy5zcGxpdCAnXFxuJ1xuICAgIGZvciBpIGluIFswLi4uY29kZUxpbmVzLmxlbmd0aF1cbiAgICAgICAgaWYgY29kZUxpbmVzW2ldLnRyaW0oKS5sZW5ndGhcbiAgICAgICAgICAgIGxvZyBncmF5KGRpbSBpKzEpICsgcmVkQnJpZ2h0IGNvZGVMaW5lc1tpXVxuICAgICAgICBlbHNlIGxvZyAnJ1xuICAgICAgICAgICAgXG4gICAgbG9nIGdyYXkgZGltICcgMTIzNDU2Nzg5IDEyMzQ1Njc4OSAxMjM0NTY3ODkgMTIzNDU2Nzg5IDEyMzQ1Njc4OScgICAgXG4gICAgZm9yIGkgaW4gWzAuLi5tYXAuc291cmNlTWFwLmxpbmVzLmxlbmd0aF1cbiAgICAgICAgbWFwbGluZSA9IG1hcC5zb3VyY2VNYXAubGluZXNbaV1cbiAgICAgICAgaWYgbWFwbGluZVxuICAgICAgICAgICAgbG9nIGdyYXkoZGltIGkrMSkgKyByZWRCcmlnaHQgbWFwTGluZVRvU3RyaW5nIG1hcGxpbmVcbiAgICAgICAgZWxzZSBsb2cgJydcblxuICAgIGxvZyBncmF5IGRpbSAnIDEyMzQ1Njc4OSAxMjM0NTY3ODkgMTIzNDU2Nzg5IDEyMzQ1Njc4OSAxMjM0NTY3ODknICAgIFxuICAgIGZvciBpIGluIFswLi4ubWFwLnNvdXJjZU1hcC5saW5lcy5sZW5ndGhdXG4gICAgICAgIG1hcGxpbmUgPSBtYXAuc291cmNlTWFwLmxpbmVzW2ldXG4gICAgICAgIGlmIG1hcGxpbmVcbiAgICAgICAgICAgIGxvZyBncmF5KGRpbSBpKzEpICsgYmx1ZUJyaWdodCBtYXBMaW5lVG9TdHJpbmcgbWFwbGluZSwgJ3NvdXJjZUNvbHVtbidcbiAgICAgICAgZWxzZSBsb2cgJydcbiAgICAgICAgICAgIFxuIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG5cbnByaW50UmV3cml0ZXIgPSAodG9rZW5zKSAtPlxuXG4gICAgaW5kZW50ID0gMFxuICAgIGZvciBpbmRleCBpbiBbMC4uLnRva2Vucy5sZW5ndGhdXG4gICAgICAgIHRva2VuID0gdG9rZW5zW2luZGV4XVxuICAgICAgICB0YWcgICA9IHRva2VuWzBdXG4gICAgICAgIHZhbHVlID0gdG9rZW5bMV1cbiAgICAgICAgXG4gICAgICAgIGdyYXlEaW0gPSAocykgLT4gZGltIGdyYXkgc1xuICAgICAgICBibHVlRGltID0gKHMpIC0+IGRpbSBibHVlIHNcbiAgICAgICAgeWVsbG93RGltID0gKHMpIC0+IGRpbSB5ZWxsb3cgc1xuICAgICAgICBzcGFjZWQgPSAoY29sb3IsIHYpLT5cbiAgICAgICAgICAgIHByaW50IGNvbG9yIFwiI3t2ID8gdmFsdWV9XCJcbiAgICAgICAgICAgIHByaW50ICcgJyBpZiB0b2tlbi5zcGFjZWQgYW5kIHRva2Vuc1tpbmRleCsxXVswXSBub3QgaW4gWydDQUxMX1NUQVJUJ11cblxuICAgICAgICAjIGxvZyB0b2tlblxuICAgICAgICBzd2l0Y2ggdGFnIFxuICAgICAgICAgICAgd2hlbiAnVEVSTUlOQVRPUicgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHByaW50IFwiXFxuI3twYWQgJycsIGluZGVudH1cIlxuICAgICAgICAgICAgd2hlbiAnSU5ERU5UJyAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIGluZGVudCArPSA0OyBwcmludCBcIlxcbiN7cGFkICcnLCBpbmRlbnR9XCJcbiAgICAgICAgICAgIHdoZW4gJ09VVERFTlQnICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBpbmRlbnQgLT0gNDsgcHJpbnQgXCJcXG4je3BhZCAnJywgaW5kZW50fVwiXG4gICAgICAgICAgICB3aGVuICdIRVJFQ09NTUVOVCcgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGdyYXlEaW1cbiAgICAgICAgICAgIHdoZW4gJ0NBTExfU1RBUlQnICdDQUxMX0VORCcgICAgICAgICAgICAgdGhlbiBzcGFjZWQgZ3JheURpbVxuICAgICAgICAgICAgd2hlbiAnVU5BUlknICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCBibHVlQnJpZ2h0LCAnbm90J1xuICAgICAgICAgICAgd2hlbiAnJiYnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCBibHVlQnJpZ2h0LCAnYW5kJ1xuICAgICAgICAgICAgd2hlbiAnfHwnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCBibHVlQnJpZ2h0LCAnb3InXG4gICAgICAgICAgICB3aGVuICdTVFJJTkcnICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGdyZWVuXG4gICAgICAgICAgICB3aGVuICdTVFJJTkdfU1RBUlQnICdTVFJJTkdfRU5EJyAgICAgICAgIHRoZW4gc3BhY2VkIHJlZEJyaWdodFxuICAgICAgICAgICAgd2hlbiAnUFJPUEVSVFknICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCB5ZWxsb3dcbiAgICAgICAgICAgIHdoZW4gJzonICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgeWVsbG93RGltXG4gICAgICAgICAgICB3aGVuICdAJyBcbiAgICAgICAgICAgICAgICBpZiB0b2tlbnNbaW5kZXgrMV1bMF0gbm90IGluIFsnTUVUQV9JRicgJ01FVEFfRUxTRScgJ1BPU1RfTUVUQV9JRiddIHRoZW4gc3BhY2VkKHllbGxvd0RpbSkgZWxzZSBzcGFjZWQgYmx1ZURpbVxuICAgICAgICAgICAgd2hlbiAnTUVUQV9JRicgJ01FVEFfRUxTRScgJ1BPU1RfTUVUQV9JRicgdGhlbiBzcGFjZWQgYmx1ZSwgJ+KWuCcrdmFsdWVcbiAgICAgICAgICAgIHdoZW4gJ05VTUJFUicgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBzcGFjZWQgYmx1ZVxuICAgICAgICAgICAgd2hlbiAneycnfScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIGlmIG5vdCB0b2tlbi5nZW5lcmF0ZWQgdGhlbiBzcGFjZWQgZ3JheVxuICAgICAgICAgICAgd2hlbiAnPScgJysnICctJyAnKysnICctLScgJy4uLicgJzo6JyBcXFxuICAgICAgICAgICAgICAgICAnWycgJ10nICd7JyAnfScgJy4nICdNQVRIJyAnVU5BUllfTUFUSCcgXFxcbiAgICAgICAgICAgICAgICAgJ0lOREVYX1NUQVJUJyAnSU5ERVhfRU5EJyBcXFxuICAgICAgICAgICAgICAgICAnQ09NUEFSRScgJ0NPTVBPVU5EX0FTU0lHTicgICAgICAgICB0aGVuIHNwYWNlZCBncmF5XG4gICAgICAgICAgICB3aGVuICcsJyAnKCcgJyknICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gc3BhY2VkIGdyYXlEaW1cbiAgICAgICAgICAgIHdoZW4gJ1BBUkFNX1NUQVJUJyAnUEFSQU1fRU5EJyAnLT4nICc9PicgdGhlbiBzcGFjZWQgKHMpIC0+IGJvbGQgYmx1ZSBzXG4gICAgICAgICAgICB3aGVuICdOVUxMJyAnVU5ERUZJTkVEJyAnRlVOQ19FWElTVCcgJz8nICc/LicgJ0JJTj8nIHRoZW4gc3BhY2VkIHJlZFxuICAgICAgICAgICAgd2hlbiAnUkVHRVgnICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHNwYWNlZCBtYWdlbnRhXG4gICAgICAgICAgICB3aGVuICdGT1InICdGT1JJTicgJ1RSWScgJ0NBVENIJyAnVEhST1cnICdSRUxBVElPTicgJ0VYVEVORFMnICdTVEFURU1FTlQnICdPV04nICdGT1JPRicgJ0xPT1AnIFxcXG4gICAgICAgICAgICAgICAgICdJRicgJ1BPU1RfSUYnICdXSEVOJyAnVEhFTicgJ0VMU0UnICdUSElTJyAnU1VQRVInICdTV0lUQ0gnICdMRUFESU5HX1dIRU4nICdXSElMRScgXFxcbiAgICAgICAgICAgICAgICAgJ0JPT0wnICdDTEFTUycgJ1JFVFVSTicgICAgICAgICAgICAgdGhlbiBzcGFjZWQgYmx1ZUJyaWdodFxuICAgICAgICAgICAgd2hlbiAnSURFTlRJRklFUicgXG4gICAgICAgICAgICAgICAgc3dpdGNoIHZhbHVlXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gJ3JlcXVpcmUnIHRoZW4gc3BhY2VkIGdyYXlcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBzcGFjZWQgd2hpdGVCcmlnaHRcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBwcmludCBcIj4je3RhZ308XCJcbiAgICAgICAgICAgICAgICAjIHNwYWNlZCAocykgLT4gYm9sZCBibHVlQnJpZ2h0IHNcbiAgICAgICAgICAgICAgICBzcGFjZWQgY3lhblxuICAgICAgICAgICAgXG52ZXJzaW9uID0gLT4gcHJpbnRMaW5lIFwiI3tLb2ZmZWUuVkVSU0lPTn1cIlxudXNhZ2UgICA9IC0+IFxuXG4gICAgbGluZXMgPSBbXCIje2dyYXkgJ1VzYWdlOid9ICN7eWVsbG93ICdrb2ZmZWUnfSAje2dyYXkgJ1tvcHRpb25zXSd9IHBhdGgvdG8vc2NyaXB0ICN7Z3JheSAnW29wdGlvbnNdJ31cXG5cIl1cbiAgICBcbiAgICBydWxlcyA9IFNXSVRDSEVTLm1hcCAocnVsZSkgLT5cbiAgICAgICAgW3Nob3J0LCBsb25nLCBkZXNjcmlwdGlvbl0gPSBydWxlXG4gICAgICAgIGxvbmdGbGFnID0gbG9uZy5tYXRjaCgvXigtLVxcd1tcXHdcXC1dKikvKVsxXVxuICAgICAgICBjc2hvcnQgICA9IGlmIHNob3J0IHRoZW4gZ3JheShzaG9ydFswXSkgKyBib2xkKGdyYXkoc2hvcnRbMS4uXSkpICsgJyAgJyBlbHNlICcgICAgJ1xuICAgICAgICBjbG9uZyAgICA9IHBhZCBsb25nLCAyMFxuICAgICAgICBjbG9uZyAgICA9IGdyYXkoY2xvbmdbMC4uMV0pICsgYm9sZCh3aGl0ZShjbG9uZ1syLi5dLnNwbGl0KCcgJylbMF0pKSArICcgJyArIGJvbGQoYmx1ZUJyaWdodChjbG9uZ1syLi5dLnNwbGl0KCcgJylbMS4uXS5qb2luKCcgJykpKVxuICAgICAgICBsaW5lcy5wdXNoICcgICAgJyArIGNzaG9ydCArIGNsb25nICsgZ3JheSBkZXNjcmlwdGlvblxuICAgICAgICBcbiAgICBsaW5lcy5wdXNoIGdyYXkgJ1xcbklmIGNhbGxlZCB3aXRob3V0IGEgc2NyaXB0LCB0aGUgaW50ZXJhY3RpdmUgUkVQTCB3aWxsIGJlIHN0YXJ0ZWQnXG4gICAgICAgIFxuICAgIGxvZyBcIlxcbiN7IGxpbmVzLmpvaW4oJ1xcbicpIH1cXG5cIlxuICAgICAgICAiXX0=
//# sourceURL=../coffee/command.coffee