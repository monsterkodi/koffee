// koffee 0.38.0

/*
00000000   00000000  00000000   000      
000   000  000       000   000  000      
0000000    0000000   00000000   000      
000   000  000       000        000      
000   000  00000000  000        0000000
 */

(function() {
    var Koffee, addHistory, addMultilineHandler, fs, merge, nodeREPL, pad, path, ref, runInContext, start, updateSyntaxError, vm;

    fs = require('fs');

    path = require('path');

    vm = require('vm');

    nodeREPL = require('repl');

    Koffee = require('./koffee');

    ref = require('./helpers'), pad = ref.pad, merge = ref.merge, updateSyntaxError = ref.updateSyntaxError;

    runInContext = function(js, context, filename) {
        if (context === global) {
            return vm.runInThisContext(js, filename);
        } else {
            return vm.runInContext(js, context, filename);
        }
    };

    addMultilineHandler = function(repl) {
        var inputStream, multiline, nodeLineListener, origPrompt, outputStream, rli;
        rli = repl.rli, inputStream = repl.inputStream, outputStream = repl.outputStream;
        origPrompt = repl._prompt;
        multiline = {
            enabled: false,
            buffer: ''
        };
        nodeLineListener = rli.listeners('line')[0];
        rli.removeListener('line', nodeLineListener);
        rli.on('line', function(cmd) {
            if (multiline.enabled) {
                multiline.buffer += cmd + "\n";
                rli.setPrompt('   ');
                rli.prompt(true);
            } else {
                rli.setPrompt(origPrompt);
                nodeLineListener(cmd);
            }
        });
        return inputStream.on('keypress', function(char, key) {
            if ((key != null ? key.name : void 0) === 'escape') {
                if (multiline.enabled) {
                    if (!multiline.buffer.match(/\n/)) {
                        multiline.enabled = !multiline.enabled;
                        rli.setPrompt(origPrompt);
                        rli.prompt(true);
                        return;
                    }
                    if ((rli.line != null) && !rli.line.match(/^\s*$/)) {
                        return;
                    }
                    multiline.enabled = !multiline.enabled;
                    rli.line = '';
                    rli.cursor = 0;
                    rli.output.cursorTo(0);
                    rli.output.clearLine(1);
                    multiline.buffer = multiline.buffer.replace(/\n/g, '\uFF00');
                    rli.emit('line', multiline.buffer);
                    multiline.buffer = '';
                } else {
                    multiline.enabled = !multiline.enabled;
                    rli.setPrompt(yellow('◖▶ '));
                    rli.prompt(true);
                }
            }
        });
    };

    addHistory = function(repl, filename, maxSize) {
        var buffer, fd, lastLine, readFd, size, stat;
        lastLine = null;
        try {
            stat = fs.statSync(filename);
            size = Math.min(maxSize, stat.size);
            readFd = fs.openSync(filename, 'r');
            buffer = Buffer.alloc(size);
            fs.readSync(readFd, buffer, 0, size, stat.size - size);
            fs.closeSync(readFd);
            repl.rli.history = buffer.toString().split('\n').reverse();
            if (stat.size > maxSize) {
                repl.rli.history.pop();
            }
            if (repl.rli.history[0] === '') {
                repl.rli.history.shift();
            }
            repl.rli.historyIndex = -1;
            lastLine = repl.rli.history[0];
        } catch (error) {}
        fd = fs.openSync(filename, 'a');
        repl.rli.addListener('line', function(code) {
            if (code && code.length && code !== '.history' && code !== '.exit' && lastLine !== code) {
                fs.writeSync(fd, code + "\n");
                return lastLine = code;
            }
        });
        return repl.on('exit', function() {
            return fs.closeSync(fd);
        });
    };

    start = function(opts) {
        var build, completer, major, minor, ref1, repl, replDefaults;
        if (opts == null) {
            opts = {};
        }
        ref1 = process.versions.node.split('.').map(function(n) {
            return parseInt(n, 10);
        }), major = ref1[0], minor = ref1[1], build = ref1[2];
        if (major < 10) {
            console.warn("Node 10+ required for koffee REPL");
            process.exit(1);
        }
        Koffee.register();
        process.argv = ['koffee'].concat(process.argv.slice(2));
        repl = null;
        replDefaults = {
            prompt: process.env.HOME ? blue("■▶ ", {
                historyFile: path.join(process.env.HOME, '.koffee_history')
            }) : void 0,
            historyMaxInputSize: 10240,
            removeHistoryDuplicates: true,
            "eval": function(input, context, filename, cb) {
                var Assign, Block, Literal, Value, ast, err, js, ln_cl, ref2, referencedVars, token, tokens;
                input = input.replace(/\uFF00/g, '\n');
                input = input.replace(/^\(([\s\S]*)\n\)$/m, '$1');
                input = input.replace(/^\s*try\s*{([\s\S]*)}\s*catch.*$/m, '$1');
                ref2 = require('./nodes'), Block = ref2.Block, Assign = ref2.Assign, Value = ref2.Value, Literal = ref2.Literal;
                try {
                    tokens = Koffee.tokens(input);
                    referencedVars = (function() {
                        var i, len, results;
                        results = [];
                        for (i = 0, len = tokens.length; i < len; i++) {
                            token = tokens[i];
                            if (token[0] === 'IDENTIFIER') {
                                results.push(token[1]);
                            }
                        }
                        return results;
                    })();
                    ast = Koffee.nodes(tokens);
                    js = ast.compile({
                        bare: true,
                        locals: Object.keys(context),
                        referencedVars: referencedVars
                    });
                    if (js.trim().length) {
                        return cb(null, runInContext(js, context, filename));
                    } else {
                        return cb(null);
                    }
                } catch (error) {
                    err = error;
                    updateSyntaxError(err, input);
                    if (err.markLine && err.codeLine) {
                        ln_cl = '   ';
                        if (err.line > 1) {
                            ln_cl = pad(err.line + ":", 3);
                        }
                        if (repl) {
                            repl.outputStream.write(ln_cl + err.codeLine + '\n');
                            repl.outputStream.write(pad('', ln_cl.length) + err.markLine + '\n');
                        } else {
                            console.log(ln_cl + err.codeLine);
                            console.log(pad('', ln_cl.length) + err.markLine);
                        }
                    } else {
                        if (repl) {
                            repl.outputStream.write(err.message + '\n');
                        } else {
                            console.log(err.message);
                        }
                    }
                    return cb(null);
                }
            }
        };
        opts = merge(replDefaults, opts);
        repl = nodeREPL.start(opts);
        completer = repl.rli.completer;
        repl.rli.completer = function(line, callback) {
            return completer(line, function(err, r) {
                if (r[0].length > 1) {
                    return callback(null, r);
                } else if (r[0].length === 1 && r[0][0] === r[1]) {
                    repl.rli.write('.');
                    return callback(null, [null, null]);
                } else {
                    return callback(null, r);
                }
            });
        };
        if (opts.prelude) {
            runInContext(opts.prelude, repl.context, 'prelude');
        }
        repl.on('exit', function() {
            if (!repl.rli.closed) {
                return repl.outputStream.write('\n');
            }
        });
        addMultilineHandler(repl);
        if (opts.historyFile) {
            addHistory(repl, opts.historyFile, opts.historyMaxInputSize);
        }
        repl.commands['load'].help = 'Load code from a file into this REPL session';
        repl.commands['history'] = {
            help: 'Show command history',
            action: function() {
                repl.outputStream.write((repl.rli.history.slice(0).reverse().join('\n')) + "\n");
                return repl.displayPrompt();
            }
        };
        return repl;
    };

    module.exports = {
        start: start
    };

}).call(this);
