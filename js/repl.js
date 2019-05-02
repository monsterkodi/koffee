// Generated by koffee 0.5.0

/*
00000000   00000000  00000000   000      
000   000  000       000   000  000      
0000000    0000000   00000000   000      
000   000  000       000        000      
000   000  00000000  000        0000000
 */
var Koffee, addHistory, addMultilineHandler, fs, getCommandId, merge, nodeREPL, path, ref, replDefaults, runInContext, updateSyntaxError, vm;

fs = require('fs');

path = require('path');

vm = require('vm');

nodeREPL = require('repl');

Koffee = require('./koffee');

ref = require('./helpers'), merge = ref.merge, updateSyntaxError = ref.updateSyntaxError;

replDefaults = {
    prompt: 'koffee> ',
    historyFile: process.env.HOME ? path.join(process.env.HOME, '.koffee_history') : void 0,
    historyMaxInputSize: 10240,
    "eval": function(input, context, filename, cb) {
        var Assign, Block, Literal, Value, ast, err, js, ref1, referencedVars, token, tokens;
        input = input.replace(/\uFF00/g, '\n');
        input = input.replace(/^\(([\s\S]*)\n\)$/m, '$1');
        input = input.replace(/^\s*try\s*{([\s\S]*)}\s*catch.*$/m, '$1');
        ref1 = require('./nodes'), Block = ref1.Block, Assign = ref1.Assign, Value = ref1.Value, Literal = ref1.Literal;
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
            ast = new Block([new Assign(new Value(new Literal('__')), ast, '=')]);
            js = ast.compile({
                bare: true,
                locals: Object.keys(context),
                referencedVars: referencedVars
            });
            return cb(null, runInContext(js, context, filename));
        } catch (error) {
            err = error;
            updateSyntaxError(err, input);
            return cb(err);
        }
    }
};

runInContext = function(js, context, filename) {
    if (context === global) {
        return vm.runInThisContext(js, filename);
    } else {
        return vm.runInContext(js, context, filename);
    }
};

addMultilineHandler = function(repl) {
    var inputStream, multiline, nodeLineListener, origPrompt, outputStream, ref1, rli;
    rli = repl.rli, inputStream = repl.inputStream, outputStream = repl.outputStream;
    origPrompt = (ref1 = repl._prompt) != null ? ref1 : repl.prompt;
    multiline = {
        enabled: false,
        initialPrompt: origPrompt.replace(/^[^> ]*/, function(x) {
            return x.replace(/./g, '-');
        }),
        prompt: origPrompt.replace(/^[^> ]*>?/, function(x) {
            return x.replace(/./g, '.');
        }),
        buffer: ''
    };
    nodeLineListener = rli.listeners('line')[0];
    rli.removeListener('line', nodeLineListener);
    rli.on('line', function(cmd) {
        if (multiline.enabled) {
            multiline.buffer += cmd + "\n";
            rli.setPrompt(multiline.prompt);
            rli.prompt(true);
        } else {
            rli.setPrompt(origPrompt);
            nodeLineListener(cmd);
        }
    });
    return inputStream.on('keypress', function(char, key) {
        if (!(key && key.ctrl && !key.meta && !key.shift && key.name === 'v')) {
            return;
        }
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
            rli.setPrompt(multiline.initialPrompt);
            rli.prompt(true);
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
    repl.on('exit', function() {
        return fs.closeSync(fd);
    });
    return repl.commands[getCommandId(repl, 'history')] = {
        help: 'Show command history',
        action: function() {
            repl.outputStream.write((repl.rli.history.slice(0).reverse().join('\n')) + "\n");
            return repl.displayPrompt();
        }
    };
};

getCommandId = function(repl, commandName) {
    var commandsHaveLeadingDot;
    commandsHaveLeadingDot = repl.commands['.help'] != null;
    if (commandsHaveLeadingDot) {
        return "." + commandName;
    } else {
        return commandName;
    }
};

module.exports = {
    start: function(opts) {
        var build, major, minor, ref1, repl;
        if (opts == null) {
            opts = {};
        }
        ref1 = process.versions.node.split('.').map(function(n) {
            return parseInt(n, 10);
        }), major = ref1[0], minor = ref1[1], build = ref1[2];
        if (major < 10) {
            console.warn("Node 10.0.0+ required for koffee REPL");
            process.exit(1);
        }
        Koffee.register();
        process.argv = ['koffee'].concat(process.argv.slice(2));
        opts = merge(replDefaults, opts);
        repl = nodeREPL.start(opts);
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
        repl.commands[getCommandId(repl, 'load')].help = 'Load code from a file into this REPL session';
        return repl;
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwbC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsRUFBQSxHQUFXLE9BQUEsQ0FBUSxJQUFSOztBQUNYLElBQUEsR0FBVyxPQUFBLENBQVEsTUFBUjs7QUFDWCxFQUFBLEdBQVcsT0FBQSxDQUFRLElBQVI7O0FBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxNQUFSOztBQUNYLE1BQUEsR0FBVyxPQUFBLENBQVEsVUFBUjs7QUFFWCxNQUE2QixPQUFBLENBQVEsV0FBUixDQUE3QixFQUFDLGlCQUFELEVBQVE7O0FBUVIsWUFBQSxHQUVJO0lBQUEsTUFBQSxFQUFRLFVBQVI7SUFDQSxXQUFBLEVBQThELE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBN0QsR0FBQSxJQUFJLENBQUMsSUFBTCxDQUFVLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBdEIsRUFBNEIsaUJBQTVCLENBQUEsR0FBQSxNQURiO0lBRUEsbUJBQUEsRUFBcUIsS0FGckI7SUFJQSxDQUFBLElBQUEsQ0FBQSxFQUFNLFNBQUMsS0FBRCxFQUFRLE9BQVIsRUFBaUIsUUFBakIsRUFBMkIsRUFBM0I7QUFFRixZQUFBO1FBQUEsS0FBQSxHQUFRLEtBQUssQ0FBQyxPQUFOLENBQWMsU0FBZCxFQUF5QixJQUF6QjtRQUdSLEtBQUEsR0FBUSxLQUFLLENBQUMsT0FBTixDQUFjLG9CQUFkLEVBQW9DLElBQXBDO1FBR1IsS0FBQSxHQUFRLEtBQUssQ0FBQyxPQUFOLENBQWMsbUNBQWQsRUFBbUQsSUFBbkQ7UUFHUixPQUFrQyxPQUFBLENBQVEsU0FBUixDQUFsQyxFQUFDLGtCQUFELEVBQVEsb0JBQVIsRUFBZ0Isa0JBQWhCLEVBQXVCO0FBRXZCO1lBRUksTUFBQSxHQUFTLE1BQU0sQ0FBQyxNQUFQLENBQWMsS0FBZDtZQUVULGNBQUE7O0FBQW1CO3FCQUFBLHdDQUFBOzt3QkFBa0MsS0FBTSxDQUFBLENBQUEs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LFlBQU4sRUFBb0IsSUFBcEI7UUFDUCxJQUFBLEdBQU8sUUFBUSxDQUFDLEtBQVQsQ0FBZSxJQUFmO1FBQ1AsSUFBc0QsSUFBSSxDQUFDLE9BQTNEO1lBQUEsWUFBQSxDQUFhLElBQUksQ0FBQyxPQUFsQixFQUEyQixJQUFJLENBQUMsT0FBaEMsRUFBeUMsU0FBekMsRUFBQTs7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLE1BQVIsRUFBZ0IsU0FBQTtZQUFHLElBQWdDLENBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUE3Qzt1QkFBQSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQWxCLENBQXdCLElBQXhCLEVBQUE7O1FBQUgsQ0FBaEI7UUFDQSxtQkFBQSxDQUFvQixJQUFwQjtRQUNBLElBQStELElBQUksQ0FBQyxXQUFwRTtZQUFBLFVBQUEsQ0FBVyxJQUFYLEVBQWlCLElBQUksQ0FBQyxXQUF0QixFQUFtQyxJQUFJLENBQUMsbUJBQXhDLEVBQUE7O1FBRUEsSUFBSSxDQUFDLFFBQVMsQ0FBQSxZQUFBLENBQWEsSUFBYixFQUFtQixNQUFuQixDQUFBLENBQTJCLENBQUMsSUFBMUMsR0FBaUQ7ZUFDakQ7SUFqQkcsQ0FBUCIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgICAgICBcbjAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgXG4wMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMCAgICAgIFxuMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAwMDAgICAgICBcbjAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgXG4jIyNcblxuZnMgICAgICAgPSByZXF1aXJlICdmcydcbnBhdGggICAgID0gcmVxdWlyZSAncGF0aCdcbnZtICAgICAgID0gcmVxdWlyZSAndm0nXG5ub2RlUkVQTCA9IHJlcXVpcmUgJ3JlcGwnXG5Lb2ZmZWUgICA9IHJlcXVpcmUgJy4va29mZmVlJ1xuXG57bWVyZ2UsIHVwZGF0ZVN5bnRheEVycm9yfSA9IHJlcXVpcmUgJy4vaGVscGVycydcblxuIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuIyAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgIDAwMCAgICAgICAgICAwMDAgIFxuIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuXG5yZXBsRGVmYXVsdHMgPVxuICAgIFxuICAgIHByb21wdDogJ2tvZmZlZT4gJyxcbiAgICBoaXN0b3J5RmlsZTogcGF0aC5qb2luIHByb2Nlc3MuZW52LkhPTUUsICcua29mZmVlX2hpc3RvcnknIGlmIHByb2Nlc3MuZW52LkhPTUVcbiAgICBoaXN0b3J5TWF4SW5wdXRTaXplOiAxMDI0MFxuICAgIFxuICAgIGV2YWw6IChpbnB1dCwgY29udGV4dCwgZmlsZW5hbWUsIGNiKSAtPlxuICAgICAgICAjIFhYWDogbXVsdGlsaW5lIGhhY2suXG4gICAgICAgIGlucHV0ID0gaW5wdXQucmVwbGFjZSAvXFx1RkYwMC9nLCAnXFxuJ1xuICAgICAgICAjIE5vZGUncyBSRVBMIHNlbmRzIHRoZSBpbnB1dCBlbmRpbmcgd2l0aCBhIG5ld2xpbmUgYW5kIHRoZW4gd3JhcHBlZCBpblxuICAgICAgICAjIHBhcmVucy4gVW53cmFwIGFsbCB0aGF0LlxuICAgICAgICBpbnB1dCA9IGlucHV0LnJlcGxhY2UgL15cXCgoW1xcc1xcU10qKVxcblxcKSQvbSwgJyQxJ1xuICAgICAgICAjIE5vZGUncyBSRVBMIHY2LjkuMSsgc2VuZHMgdGhlIGlucHV0IHdyYXBwZWQgaW4gYSB0cnkvY2F0Y2ggc3RhdGVtZW50LlxuICAgICAgICAjIFVud3JhcCB0aGF0IHRvby5cbiAgICAgICAgaW5wdXQgPSBpbnB1dC5yZXBsYWNlIC9eXFxzKnRyeVxccyp7KFtcXHNcXFNdKil9XFxzKmNhdGNoLiokL20sICckMSdcblxuICAgICAgICAjIFJlcXVpcmUgQVNUIG5vZGVzIHRvIGRvIHNvbWUgQVNUIG1hbmlwdWxhdGlvbi5cbiAgICAgICAge0Jsb2NrLCBBc3NpZ24sIFZhbHVlLCBMaXRlcmFsfSA9IHJlcXVpcmUgJy4vbm9kZXMnXG5cbiAgICAgICAgdHJ5XG4gICAgICAgICAgICAjIFRva2VuaXplIHRoZSBjbGVhbiBpbnB1dC5cbiAgICAgICAgICAgIHRva2VucyA9IEtvZmZlZS50b2tlbnMgaW5wdXRcbiAgICAgICAgICAgICMgQ29sbGVjdCByZWZlcmVuY2VkIHZhcmlhYmxlIG5hbWVzIGp1c3QgbGlrZSBpbiBgS29mZmVlLmNvbXBpbGVgLlxuICAgICAgICAgICAgcmVmZXJlbmNlZFZhcnMgPSAoIHRva2VuWzFdIGZvciB0b2tlbiBpbiB0b2tlbnMgd2hlbiB0b2tlblswXSBpcyAnSURFTlRJRklFUicgKVxuICAgICAgICAgICAgIyBHZW5lcmF0ZSB0aGUgQVNUIG9mIHRoZSB0b2tlbnMuXG4gICAgICAgICAgICBhc3QgPSBLb2ZmZWUubm9kZXMgdG9rZW5zXG4gICAgICAgICAgICAjIEFkZCBhc3NpZ25tZW50IHRvIGBfYCB2YXJpYWJsZSB0byBmb3JjZSB0aGUgaW5wdXQgdG8gYmUgYW4gZXhwcmVzc2lvbi5cbiAgICAgICAgICAgIGFzdCA9IG5ldyBCbG9jayBbXG4gICAgICAgICAgICAgICAgbmV3IEFzc2lnbiAobmV3IFZhbHVlIG5ldyBMaXRlcmFsICdfXycpLCBhc3QsICc9J1xuICAgICAgICAgICAgXVxuICAgICAgICAgICAganMgPSBhc3QuY29tcGlsZSB7YmFyZTogeWVzLCBsb2NhbHM6IE9iamVjdC5rZXlzKGNvbnRleHQpLCByZWZlcmVuY2VkVmFyc31cbiAgICAgICAgICAgIGNiIG51bGwsIHJ1bkluQ29udGV4dCBqcywgY29udGV4dCwgZmlsZW5hbWVcbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICAjIEFTVCdzIGBjb21waWxlYCBkb2VzIG5vdCBhZGQgc291cmNlIGNvZGUgaW5mb3JtYXRpb24gdG8gc3ludGF4IGVycm9ycy5cbiAgICAgICAgICAgIHVwZGF0ZVN5bnRheEVycm9yIGVyciwgaW5wdXRcbiAgICAgICAgICAgIGNiIGVyclxuXG5ydW5JbkNvbnRleHQgPSAoanMsIGNvbnRleHQsIGZpbGVuYW1lKSAtPlxuICAgIGlmIGNvbnRleHQgaXMgZ2xvYmFsXG4gICAgICAgIHZtLnJ1bkluVGhpc0NvbnRleHQganMsIGZpbGVuYW1lXG4gICAgZWxzZVxuICAgICAgICB2bS5ydW5JbkNvbnRleHQganMsIGNvbnRleHQsIGZpbGVuYW1lXG5cbmFkZE11bHRpbGluZUhhbmRsZXIgPSAocmVwbCkgLT5cbiAgICB7cmxpLCBpbnB1dFN0cmVhbSwgb3V0cHV0U3RyZWFtfSA9IHJlcGxcbiAgICAjIE5vZGUgMC4xMS4xMiBjaGFuZ2VkIEFQSSwgcHJvbXB0IGlzIG5vdyBfcHJvbXB0LlxuICAgIG9yaWdQcm9tcHQgPSByZXBsLl9wcm9tcHQgPyByZXBsLnByb21wdFxuXG4gICAgbXVsdGlsaW5lID1cbiAgICAgICAgZW5hYmxlZDogb2ZmXG4gICAgICAgIGluaXRpYWxQcm9tcHQ6IG9yaWdQcm9tcHQucmVwbGFjZSAvXltePiBdKi8sICh4KSAtPiB4LnJlcGxhY2UgLy4vZywgJy0nXG4gICAgICAgIHByb21wdDogb3JpZ1Byb21wdC5yZXBsYWNlIC9eW14+IF0qPj8vLCAoeCkgLT4geC5yZXBsYWNlIC8uL2csICcuJ1xuICAgICAgICBidWZmZXI6ICcnXG5cbiAgICAjIFByb3h5IG5vZGUncyBsaW5lIGxpc3RlbmVyXG4gICAgbm9kZUxpbmVMaXN0ZW5lciA9IHJsaS5saXN0ZW5lcnMoJ2xpbmUnKVswXVxuICAgIHJsaS5yZW1vdmVMaXN0ZW5lciAnbGluZScsIG5vZGVMaW5lTGlzdGVuZXJcbiAgICBybGkub24gJ2xpbmUnLCAoY21kKSAtPlxuICAgICAgICBpZiBtdWx0aWxpbmUuZW5hYmxlZFxuICAgICAgICAgICAgbXVsdGlsaW5lLmJ1ZmZlciArPSBcIiN7Y21kfVxcblwiXG4gICAgICAgICAgICBybGkuc2V0UHJvbXB0IG11bHRpbGluZS5wcm9tcHRcbiAgICAgICAgICAgIHJsaS5wcm9tcHQgdHJ1ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBybGkuc2V0UHJvbXB0IG9yaWdQcm9tcHRcbiAgICAgICAgICAgIG5vZGVMaW5lTGlzdGVuZXIgY21kXG4gICAgICAgIHJldHVyblxuXG4gICAgIyBIYW5kbGUgQ3RybC12XG4gICAgaW5wdXRTdHJlYW0ub24gJ2tleXByZXNzJywgKGNoYXIsIGtleSkgLT5cbiAgICAgICAgcmV0dXJuIHVubGVzcyBrZXkgYW5kIGtleS5jdHJsIGFuZCBub3Qga2V5Lm1ldGEgYW5kIG5vdCBrZXkuc2hpZnQgYW5kIGtleS5uYW1lIGlzICd2J1xuICAgICAgICBpZiBtdWx0aWxpbmUuZW5hYmxlZFxuICAgICAgICAgICAgIyBhbGxvdyBhcmJpdHJhcmlseSBzd2l0Y2hpbmcgYmV0d2VlbiBtb2RlcyBhbnkgdGltZSBiZWZvcmUgbXVsdGlwbGUgbGluZXMgYXJlIGVudGVyZWRcbiAgICAgICAgICAgIHVubGVzcyBtdWx0aWxpbmUuYnVmZmVyLm1hdGNoIC9cXG4vXG4gICAgICAgICAgICAgICAgbXVsdGlsaW5lLmVuYWJsZWQgPSBub3QgbXVsdGlsaW5lLmVuYWJsZWRcbiAgICAgICAgICAgICAgICBybGkuc2V0UHJvbXB0IG9yaWdQcm9tcHRcbiAgICAgICAgICAgICAgICBybGkucHJvbXB0IHRydWVcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICMgbm8tb3AgdW5sZXNzIHRoZSBjdXJyZW50IGxpbmUgaXMgZW1wdHlcbiAgICAgICAgICAgIHJldHVybiBpZiBybGkubGluZT8gYW5kIG5vdCBybGkubGluZS5tYXRjaCAvXlxccyokL1xuICAgICAgICAgICAgIyBldmFsLCBwcmludCwgbG9vcFxuICAgICAgICAgICAgbXVsdGlsaW5lLmVuYWJsZWQgPSBub3QgbXVsdGlsaW5lLmVuYWJsZWRcbiAgICAgICAgICAgIHJsaS5saW5lID0gJydcbiAgICAgICAgICAgIHJsaS5jdXJzb3IgPSAwXG4gICAgICAgICAgICBybGkub3V0cHV0LmN1cnNvclRvIDBcbiAgICAgICAgICAgIHJsaS5vdXRwdXQuY2xlYXJMaW5lIDFcbiAgICAgICAgICAgICMgWFhYOiBtdWx0aWxpbmUgaGFja1xuICAgICAgICAgICAgbXVsdGlsaW5lLmJ1ZmZlciA9IG11bHRpbGluZS5idWZmZXIucmVwbGFjZSAvXFxuL2csICdcXHVGRjAwJ1xuICAgICAgICAgICAgcmxpLmVtaXQgJ2xpbmUnLCBtdWx0aWxpbmUuYnVmZmVyXG4gICAgICAgICAgICBtdWx0aWxpbmUuYnVmZmVyID0gJydcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbXVsdGlsaW5lLmVuYWJsZWQgPSBub3QgbXVsdGlsaW5lLmVuYWJsZWRcbiAgICAgICAgICAgIHJsaS5zZXRQcm9tcHQgbXVsdGlsaW5lLmluaXRpYWxQcm9tcHRcbiAgICAgICAgICAgIHJsaS5wcm9tcHQgdHJ1ZVxuICAgICAgICByZXR1cm5cblxuIyBTdG9yZSBhbmQgbG9hZCBjb21tYW5kIGhpc3RvcnkgZnJvbSBhIGZpbGVcbmFkZEhpc3RvcnkgPSAocmVwbCwgZmlsZW5hbWUsIG1heFNpemUpIC0+XG4gICAgbGFzdExpbmUgPSBudWxsXG4gICAgdHJ5XG4gICAgICAgICMgR2V0IGZpbGUgaW5mbyBhbmQgYXQgbW9zdCBtYXhTaXplIG9mIGNvbW1hbmQgaGlzdG9yeVxuICAgICAgICBzdGF0ID0gZnMuc3RhdFN5bmMgZmlsZW5hbWVcbiAgICAgICAgc2l6ZSA9IE1hdGgubWluIG1heFNpemUsIHN0YXQuc2l6ZVxuICAgICAgICAjIFJlYWQgbGFzdCBgc2l6ZWAgYnl0ZXMgZnJvbSB0aGUgZmlsZVxuICAgICAgICByZWFkRmQgPSBmcy5vcGVuU3luYyBmaWxlbmFtZSwgJ3InXG4gICAgICAgIGJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyhzaXplKVxuICAgICAgICBmcy5yZWFkU3luYyByZWFkRmQsIGJ1ZmZlciwgMCwgc2l6ZSwgc3RhdC5zaXplIC0gc2l6ZVxuICAgICAgICBmcy5jbG9zZVN5bmMgcmVhZEZkXG4gICAgICAgICMgU2V0IHRoZSBoaXN0b3J5IG9uIHRoZSBpbnRlcnByZXRlclxuICAgICAgICByZXBsLnJsaS5oaXN0b3J5ID0gYnVmZmVyLnRvU3RyaW5nKCkuc3BsaXQoJ1xcbicpLnJldmVyc2UoKVxuICAgICAgICAjIElmIHRoZSBoaXN0b3J5IGZpbGUgd2FzIHRydW5jYXRlZCB3ZSBzaG91bGQgcG9wIG9mZiBhIHBvdGVudGlhbCBwYXJ0aWFsIGxpbmVcbiAgICAgICAgcmVwbC5ybGkuaGlzdG9yeS5wb3AoKSBpZiBzdGF0LnNpemUgPiBtYXhTaXplXG4gICAgICAgICMgU2hpZnQgb2ZmIHRoZSBmaW5hbCBibGFuayBuZXdsaW5lXG4gICAgICAgIHJlcGwucmxpLmhpc3Rvcnkuc2hpZnQoKSBpZiByZXBsLnJsaS5oaXN0b3J5WzBdIGlzICcnXG4gICAgICAgIHJlcGwucmxpLmhpc3RvcnlJbmRleCA9IC0xXG4gICAgICAgIGxhc3RMaW5lID0gcmVwbC5ybGkuaGlzdG9yeVswXVxuXG4gICAgZmQgPSBmcy5vcGVuU3luYyBmaWxlbmFtZSwgJ2EnXG5cbiAgICByZXBsLnJsaS5hZGRMaXN0ZW5lciAnbGluZScsIChjb2RlKSAtPlxuICAgICAgICBpZiBjb2RlIGFuZCBjb2RlLmxlbmd0aCBhbmQgY29kZSAhPSAnLmhpc3RvcnknIGFuZCBjb2RlICE9ICcuZXhpdCcgYW5kIGxhc3RMaW5lICE9IGNvZGVcbiAgICAgICAgICAgICMgU2F2ZSB0aGUgbGF0ZXN0IGNvbW1hbmQgaW4gdGhlIGZpbGVcbiAgICAgICAgICAgIGZzLndyaXRlU3luYyBmZCwgXCIje2NvZGV9XFxuXCJcbiAgICAgICAgICAgIGxhc3RMaW5lID0gY29kZVxuXG4gICAgcmVwbC5vbiAnZXhpdCcsIC0+IGZzLmNsb3NlU3luYyBmZFxuXG4gICAgcmVwbC5jb21tYW5kc1tnZXRDb21tYW5kSWQocmVwbCwgJ2hpc3RvcnknKV0gPSAjIEFkZCBhIGNvbW1hbmQgdG8gc2hvdyB0aGUgaGlzdG9yeSBzdGFja1xuICAgICAgICBoZWxwOiAnU2hvdyBjb21tYW5kIGhpc3RvcnknXG4gICAgICAgIGFjdGlvbjogLT5cbiAgICAgICAgICAgIHJlcGwub3V0cHV0U3RyZWFtLndyaXRlIFwiI3tyZXBsLnJsaS5oaXN0b3J5Wy4uXS5yZXZlcnNlKCkuam9pbiAnXFxuJ31cXG5cIlxuICAgICAgICAgICAgcmVwbC5kaXNwbGF5UHJvbXB0KClcblxuZ2V0Q29tbWFuZElkID0gKHJlcGwsIGNvbW1hbmROYW1lKSAtPlxuICAgICMgTm9kZSAwLjExIGNoYW5nZWQgQVBJLCBhIGNvbW1hbmQgc3VjaCBhcyAnLmhlbHAnIGlzIG5vdyBzdG9yZWQgYXMgJ2hlbHAnXG4gICAgY29tbWFuZHNIYXZlTGVhZGluZ0RvdCA9IHJlcGwuY29tbWFuZHNbJy5oZWxwJ10/XG4gICAgaWYgY29tbWFuZHNIYXZlTGVhZGluZ0RvdCB0aGVuIFwiLiN7Y29tbWFuZE5hbWV9XCIgZWxzZSBjb21tYW5kTmFtZVxuXG5tb2R1bGUuZXhwb3J0cyA9XG4gICAgc3RhcnQ6IChvcHRzID0ge30pIC0+XG4gICAgICAgIFttYWpvciwgbWlub3IsIGJ1aWxkXSA9IHByb2Nlc3MudmVyc2lvbnMubm9kZS5zcGxpdCgnLicpLm1hcCAobikgLT4gcGFyc2VJbnQobiwgMTApXG5cbiAgICAgICAgaWYgbWFqb3IgPCAxMFxuICAgICAgICAgICAgY29uc29sZS53YXJuIFwiTm9kZSAxMC4wLjArIHJlcXVpcmVkIGZvciBrb2ZmZWUgUkVQTFwiXG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQgMVxuXG4gICAgICAgIEtvZmZlZS5yZWdpc3RlcigpXG4gICAgICAgIHByb2Nlc3MuYXJndiA9IFsna29mZmVlJ10uY29uY2F0IHByb2Nlc3MuYXJndlsyLi5dXG4gICAgICAgIG9wdHMgPSBtZXJnZSByZXBsRGVmYXVsdHMsIG9wdHNcbiAgICAgICAgcmVwbCA9IG5vZGVSRVBMLnN0YXJ0IG9wdHNcbiAgICAgICAgcnVuSW5Db250ZXh0IG9wdHMucHJlbHVkZSwgcmVwbC5jb250ZXh0LCAncHJlbHVkZScgaWYgb3B0cy5wcmVsdWRlXG4gICAgICAgIHJlcGwub24gJ2V4aXQnLCAtPiByZXBsLm91dHB1dFN0cmVhbS53cml0ZSAnXFxuJyBpZiBub3QgcmVwbC5ybGkuY2xvc2VkXG4gICAgICAgIGFkZE11bHRpbGluZUhhbmRsZXIgcmVwbFxuICAgICAgICBhZGRIaXN0b3J5IHJlcGwsIG9wdHMuaGlzdG9yeUZpbGUsIG9wdHMuaGlzdG9yeU1heElucHV0U2l6ZSBpZiBvcHRzLmhpc3RvcnlGaWxlXG4gICAgICAgICMgQWRhcHQgaGVscCBpbmhlcml0ZWQgZnJvbSB0aGUgbm9kZSBSRVBMXG4gICAgICAgIHJlcGwuY29tbWFuZHNbZ2V0Q29tbWFuZElkKHJlcGwsICdsb2FkJyldLmhlbHAgPSAnTG9hZCBjb2RlIGZyb20gYSBmaWxlIGludG8gdGhpcyBSRVBMIHNlc3Npb24nXG4gICAgICAgIHJlcGxcbiJdfQ==
//# sourceURL=../coffee/repl.coffee