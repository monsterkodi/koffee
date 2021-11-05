// koffee 1.16.0
(function() {
    var Koffee, _, build, buildAndTest, buildCompiler, buildParser, childp, fs, helpers, libDir, node, noon, os, path, run, runTests, spawnTest;

    fs = require('fs');

    os = require('os');

    path = require('path');

    noon = require('noon');

    _ = require('underscore');

    childp = require('child_process');

    Koffee = require('./js/koffee');

    helpers = require('./js/helpers');

    helpers.colors();

    node = function(args, output, callback) {
        var proc;
        if (output == null) {
            output = 'stderr';
        }
        proc = childp.spawn('node', args, {
            cwd: process.cwd(),
            stdio: 'inherit'
        });
        return proc.on('exit', function(status) {
            if (typeof callback === 'function') {
                return callback(status);
            }
        });
    };

    run = function(args, callback) {
        return node(['bin/koffee'].concat(args), 'both', function(status) {
            if (status !== 0) {
                process.exit(1);
            }
            if (typeof callback === 'function') {
                return callback();
            }
        });
    };

    buildParser = function() {
        var parser;
        console.log(blueBright('parser'));
        helpers.extend(global, require('util'));
        require('jison');
        parser = require('./js/grammar').parser.generate();
        return fs.writeFileSync('js/parser.js', parser);
    };

    buildCompiler = function(callback) {
        var file, files;
        console.log(blueBright('compiler'));
        files = fs.readdirSync('coffee');
        files = (function() {
            var i, len, results;
            results = [];
            for (i = 0, len = files.length; i < len; i++) {
                file = files[i];
                if (file.match(/\.[ck]offee$/)) {
                    results.push('coffee/' + file);
                }
            }
            return results;
        })();
        return run(['--output', './js', '-c'].concat(files), callback);
    };

    build = function(callback) {
        buildParser();
        return buildCompiler(callback);
    };

    libDir = path.dirname(require.resolve('./js')) + '/';

    buildAndTest = function(parser) {
        var err;
        if (parser == null) {
            parser = true;
        }
        try {
            childp.execSync('git checkout js/*', {
                stdio: 'pipe'
            });
        } catch (error1) {
            err = error1;
            console.error(err.message);
        }
        return node(['bin/kake', parser && 'build' || 'compiler'], 'both', function() {
            return node(['bin/kake', 'test'], 'both');
        });
    };

    spawnTest = function(testset) {
        return node(['bin/kake', testset], 'both');
    };

    task('all', 'build twice, run the tests', function() {
        return build(function() {
            return build(function() {
                return node(['bin/kake', 'test'], 'both');
            });
        });
    });

    task('build', 'build the compiler and parser', build);

    task('parser', 'build the parser', buildParser);

    task('compiler', 'build the compiler', buildCompiler);

    task('watch', 'rebuild and/or test on file changes', function() {
        var watch;
        watch = function(filename, cb) {
            return fs.watch(filename, {
                interval: 200,
                recursive: true
            }, function(event, file) {
                if (event === 'change') {
                    return cb(event, file);
                }
            });
        };
        console.log(blueBright('watching ...'));
        watch('coffee/', function(event, file) {
            console.log(blueBright("coffee/" + file + " changed"));
            return buildAndTest(file === 'grammar.coffee');
        });
        watch('test/coffee/', function(event, file) {
            console.log(yellow("test/coffee/" + file + " changed"));
            return spawnTest('coffee');
        });
        watch('test/koffee', function(event, file) {
            console.log(yellow("test/koffee/" + file + " changed"));
            return spawnTest('koffee');
        });
        watch('kake.coffee', function() {
            console.log(blueBright("kake.coffee changed!"));
            childp.execSync('bin/kake watch', {
                stdio: 'inherit',
                shell: true,
                cwd: process.cwd()
            });
            return process.exit(0);
        });
        return process.on('exit', function() {
            return console.log('exit:', process.pid);
        });
    });

    task('bench', 'benchmark of compilation time', function() {
        var Rewriter, coffee, fmt, injectFeature, injectMeta, js, nodes, now, opts, sources, time, tokens, total;
        injectFeature = require('./js/features').injectFeature;
        injectMeta = require('./js/meta').injectMeta;
        opts = injectMeta(injectFeature({}));
        Rewriter = require('./js/rewriter');
        sources = ['koffee', 'grammar', 'helpers', 'lexer', 'nodes', 'rewriter', 'scope'];
        coffee = sources.map(function(name) {
            return fs.readFileSync("coffee/" + name + ".coffee");
        }).join('\n');
        fmt = function(ms) {
            return " " + (bold(("     " + ms).slice(-4))) + " ms";
        };
        total = 0;
        now = Date.now();
        time = function() {
            var ms;
            total += ms = -(now - (now = Date.now()));
            return fmt(ms);
        };
        tokens = Koffee.tokens(coffee, {
            feature: {
                rewrite: false
            }
        });
        console.log(gray("Lex    " + (time()) + " (" + tokens.length + " tokens)"));
        tokens = new Rewriter().rewrite(tokens, opts);
        console.log(gray("Rewrite" + (time()) + " (" + tokens.length + " tokens)"));
        nodes = Koffee.nodes(tokens, opts);
        console.log(gray("Parse  " + (time())));
        js = nodes.compile({
            bare: true
        });
        console.log(gray("Compile" + (time()) + " (" + js.length + " chars)"));
        return console.log(white("Total  " + (fmt(total))));
    });

    runTests = function(testsets) {
        var code, currentFile, description, err, error, fail, failedTests, failures, file, filename, files, i, j, k, len, len1, len2, message, passedTests, ref, source, startTime, testset, time;
        startTime = Date.now();
        currentFile = null;
        failures = [];
        passedTests = 0;
        failedTests = 0;
        global.test = function(description, fn) {
            var err;
            try {
                fn.test = {
                    description: description,
                    currentFile: currentFile
                };
                fn.call(fn);
                return ++passedTests;
            } catch (error1) {
                err = error1;
                ++failedTests;
                return failures.push({
                    filename: currentFile,
                    error: err,
                    description: description != null ? description : void 0,
                    source: fn.toString != null ? fn.toString() : void 0
                });
            }
        };
        helpers.initTest();
        files = [];
        for (i = 0, len = testsets.length; i < len; i++) {
            testset = testsets[i];
            files = files.concat(fs.readdirSync("test/" + testset).map(function(f) {
                return [testset, f];
            }));
        }
        console.log(green(files.length + " test files ..."));
        for (j = 0, len1 = files.length; j < len1; j++) {
            ref = files[j], testset = ref[0], file = ref[1];
            if (!(helpers.isCoffee(file))) {
                continue;
            }
            currentFile = filename = path.join('test', testset, file);
            code = fs.readFileSync(filename);
            try {
                Koffee.run(code.toString(), {
                    filename: filename
                });
            } catch (error1) {
                err = error1;
                failures.push({
                    filename: filename,
                    err: err
                });
            }
            if (failures.length) {
                console.log(red(path.basename(filename, '.coffee')));
                for (k = 0, len2 = failures.length; k < len2; k++) {
                    fail = failures[k];
                    error = fail.error, filename = fail.filename, description = fail.description, source = fail.source;
                    console.log(white(''));
                    if (description) {
                        console.log(green("    " + description));
                    }
                    console.log(yellow("    " + (error != null ? error.message : void 0)));
                    console.log(gray("    " + filename));
                    if (source) {
                        console.log(white("    " + source));
                    } else {
                        console.log(red("    " + error));
                    }
                }
            }
            failures = [];
        }
        time = ((Date.now() - startTime) / 1000).toFixed(2);
        message = green(passedTests + " passed tests in " + time + " seconds");
        if (!failedTests) {
            console.log(message);
        } else {
            console.log(red(failedTests + " failed and " + message));
        }
        return failedTests;
    };

    task('test', 'run the tests', function() {
        return process.exit(runTests(['koffee', 'coffee']));
    });

    task('coffee', 'run coffee tests', function() {
        return process.exit(runTests(['coffee']));
    });

    task('koffee', 'run koffee tests', function() {
        return process.exit(runTests(['koffee']));
    });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2FrZS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyJrYWtlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFBQSxRQUFBOztJQUFBLEVBQUEsR0FBVSxPQUFBLENBQVEsSUFBUjs7SUFDVixFQUFBLEdBQVUsT0FBQSxDQUFRLElBQVI7O0lBQ1YsSUFBQSxHQUFVLE9BQUEsQ0FBUSxNQUFSOztJQUNWLElBQUEsR0FBVSxPQUFBLENBQVEsTUFBUjs7SUFDVixDQUFBLEdBQVUsT0FBQSxDQUFRLFlBQVI7O0lBQ1YsTUFBQSxHQUFVLE9BQUEsQ0FBUSxlQUFSOztJQUNWLE1BQUEsR0FBVSxPQUFBLENBQVEsYUFBUjs7SUFDVixPQUFBLEdBQVUsT0FBQSxDQUFRLGNBQVI7O0lBRVYsT0FBTyxDQUFDLE1BQVIsQ0FBQTs7SUFRQSxJQUFBLEdBQU8sU0FBQyxJQUFELEVBQU8sTUFBUCxFQUF3QixRQUF4QjtBQUVILFlBQUE7O1lBRlUsU0FBTzs7UUFFakIsSUFBQSxHQUFPLE1BQU0sQ0FBQyxLQUFQLENBQWEsTUFBYixFQUFxQixJQUFyQixFQUEyQjtZQUFBLEdBQUEsRUFBSSxPQUFPLENBQUMsR0FBUixDQUFBLENBQUo7WUFBbUIsS0FBQSxFQUFNLFNBQXpCO1NBQTNCO2VBQ1AsSUFBSSxDQUFDLEVBQUwsQ0FBUSxNQUFSLEVBQWdCLFNBQUMsTUFBRDtZQUFZLElBQW9CLE9BQU8sUUFBUCxLQUFtQixVQUF2Qzt1QkFBQSxRQUFBLENBQVMsTUFBVCxFQUFBOztRQUFaLENBQWhCO0lBSEc7O0lBS1AsR0FBQSxHQUFNLFNBQUMsSUFBRCxFQUFPLFFBQVA7ZUFDRixJQUFBLENBQUssQ0FBQyxZQUFELENBQWMsQ0FBQyxNQUFmLENBQXNCLElBQXRCLENBQUwsRUFBa0MsTUFBbEMsRUFBMEMsU0FBQyxNQUFEO1lBQ3RDLElBQW1CLE1BQUEsS0FBVSxDQUE3QjtnQkFBQSxPQUFPLENBQUMsSUFBUixDQUFhLENBQWIsRUFBQTs7WUFDQSxJQUFj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QUFPLFdBQUQsR0FBYSxjQUFiLEdBQTJCLE9BQWpDLENBQUwsRUFISDs7QUFLQSxlQUFPO0lBM0RBOztJQTZEWCxJQUFBLENBQUssTUFBTCxFQUFlLGVBQWYsRUFBbUMsU0FBQTtlQUFHLE9BQU8sQ0FBQyxJQUFSLENBQWEsUUFBQSxDQUFTLENBQUMsUUFBRCxFQUFVLFFBQVYsQ0FBVCxDQUFiO0lBQUgsQ0FBbkM7O0lBQ0EsSUFBQSxDQUFLLFFBQUwsRUFBZSxrQkFBZixFQUFtQyxTQUFBO2VBQUcsT0FBTyxDQUFDLElBQVIsQ0FBYSxRQUFBLENBQVMsQ0FBQyxRQUFELENBQVQsQ0FBYjtJQUFILENBQW5DOztJQUNBLElBQUEsQ0FBSyxRQUFMLEVBQWUsa0JBQWYsRUFBbUMsU0FBQTtlQUFHLE9BQU8sQ0FBQyxJQUFSLENBQWEsUUFBQSxDQUFTLENBQUMsUUFBRCxDQUFULENBQWI7SUFBSCxDQUFuQztBQXBOQSIsInNvdXJjZXNDb250ZW50IjpbImZzICAgICAgPSByZXF1aXJlICdmcydcbm9zICAgICAgPSByZXF1aXJlICdvcydcbnBhdGggICAgPSByZXF1aXJlICdwYXRoJ1xubm9vbiAgICA9IHJlcXVpcmUgJ25vb24nXG5fICAgICAgID0gcmVxdWlyZSAndW5kZXJzY29yZSdcbmNoaWxkcCAgPSByZXF1aXJlICdjaGlsZF9wcm9jZXNzJ1xuS29mZmVlICA9IHJlcXVpcmUgJy4vanMva29mZmVlJ1xuaGVscGVycyA9IHJlcXVpcmUgJy4vanMvaGVscGVycydcblxuaGVscGVycy5jb2xvcnMoKVxuXG4jIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwICBcbiMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4jIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIFxuXG5ub2RlID0gKGFyZ3MsIG91dHB1dD0nc3RkZXJyJywgY2FsbGJhY2spIC0+XG4gICAgXG4gICAgcHJvYyA9IGNoaWxkcC5zcGF3biAnbm9kZScsIGFyZ3MsIGN3ZDpwcm9jZXNzLmN3ZCgpLCBzdGRpbzonaW5oZXJpdCdcbiAgICBwcm9jLm9uICdleGl0JywgKHN0YXR1cykgLT4gY2FsbGJhY2soc3RhdHVzKSBpZiB0eXBlb2YgY2FsbGJhY2sgaXMgJ2Z1bmN0aW9uJ1xuXG5ydW4gPSAoYXJncywgY2FsbGJhY2spIC0+XG4gICAgbm9kZSBbJ2Jpbi9rb2ZmZWUnXS5jb25jYXQoYXJncyksICdib3RoJywgKHN0YXR1cykgLT5cbiAgICAgICAgcHJvY2Vzcy5leGl0KDEpIGlmIHN0YXR1cyAhPSAwXG4gICAgICAgIGNhbGxiYWNrKCkgaWYgdHlwZW9mIGNhbGxiYWNrIGlzICdmdW5jdGlvbidcblxuIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIFxuIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIFxuIyAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwICAwMDAwMDAwICAwMDAwMDAwICAgIFxuXG5idWlsZFBhcnNlciA9IC0+XG4gICAgXG4gICAgbG9nIGJsdWVCcmlnaHQgJ3BhcnNlcidcbiAgICBoZWxwZXJzLmV4dGVuZCBnbG9iYWwsIHJlcXVpcmUgJ3V0aWwnXG4gICAgcmVxdWlyZSAnamlzb24nXG4gICAgcGFyc2VyID0gcmVxdWlyZSgnLi9qcy9ncmFtbWFyJykucGFyc2VyLmdlbmVyYXRlKClcbiAgICBmcy53cml0ZUZpbGVTeW5jICdqcy9wYXJzZXIuanMnLCBwYXJzZXJcblxuYnVpbGRDb21waWxlciA9IChjYWxsYmFjaykgLT5cbiAgICBcbiAgICBsb2cgYmx1ZUJyaWdodCAnY29tcGlsZXInIFxuICAgIGZpbGVzID0gZnMucmVhZGRpclN5bmMgJ2NvZmZlZSdcbiAgICBmaWxlcyA9ICgnY29mZmVlLycgKyBmaWxlIGZvciBmaWxlIGluIGZpbGVzIHdoZW4gZmlsZS5tYXRjaCgvXFwuW2NrXW9mZmVlJC8pKVxuICAgIHJ1biBbJy0tb3V0cHV0JyAnLi9qcycgJy1jJ10uY29uY2F0KGZpbGVzKSwgY2FsbGJhY2tcbiAgICBcbmJ1aWxkID0gKGNhbGxiYWNrKSAtPlxuICAgIFxuICAgIGJ1aWxkUGFyc2VyKClcbiAgICBidWlsZENvbXBpbGVyIGNhbGxiYWNrXG4gICAgXG4jICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiMgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgICAgMDAwICAgICAwMDAgICAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICBcblxubGliRGlyID0gcGF0aC5kaXJuYW1lKHJlcXVpcmUucmVzb2x2ZSAnLi9qcycpICsgJy8nXG5cbmJ1aWxkQW5kVGVzdCA9IChwYXJzZXI9eWVzKSAtPlxuICAgIFxuICAgIHRyeVxuICAgICAgICBjaGlsZHAuZXhlY1N5bmMgJ2dpdCBjaGVja291dCBqcy8qJywgc3RkaW86J3BpcGUnXG4gICAgY2F0Y2ggZXJyXG4gICAgICAgIGVycm9yIGVyci5tZXNzYWdlXG5cbiAgICBub2RlIFsnYmluL2tha2UnLCBwYXJzZXIgYW5kICdidWlsZCcgb3IgJ2NvbXBpbGVyJ10sICdib3RoJywgLT5cbiAgICAgICAgbm9kZSBbJ2Jpbi9rYWtlJywgJ3Rlc3QnXSwgJ2JvdGgnXG5cbnNwYXduVGVzdCA9ICh0ZXN0c2V0KSAtPlxuICAgIFxuICAgIG5vZGUgWydiaW4va2FrZScsIHRlc3RzZXRdLCAnYm90aCdcbiAgICAgICAgXG50YXNrICdhbGwnLCAgICAgICdidWlsZCB0d2ljZSwgcnVuIHRoZSB0ZXN0cycsICAgIC0+IGJ1aWxkIC0+IGJ1aWxkIC0+IG5vZGUgWydiaW4va2FrZScgJ3Rlc3QnXSwgJ2JvdGgnXG50YXNrICdidWlsZCcsICAgICdidWlsZCB0aGUgY29tcGlsZXIgYW5kIHBhcnNlcicsIGJ1aWxkXG50YXNrICdwYXJzZXInLCAgICdidWlsZCB0aGUgcGFyc2VyJywgICAgICAgICAgICAgIGJ1aWxkUGFyc2VyXG50YXNrICdjb21waWxlcicsICdidWlsZCB0aGUgY29tcGlsZXInLCAgICAgICAgICAgIGJ1aWxkQ29tcGlsZXJcblxuIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbiMgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAwMDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAgICAgIDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG5cbnRhc2sgJ3dhdGNoJywgJ3JlYnVpbGQgYW5kL29yIHRlc3Qgb24gZmlsZSBjaGFuZ2VzJywgLT4gXG4gICAgXG4gICAgd2F0Y2ggPSAoZmlsZW5hbWUsIGNiKSAtPlxuICAgICAgICBcbiAgICAgICAgZnMud2F0Y2ggZmlsZW5hbWUsIHtpbnRlcnZhbDogMjAwLCByZWN1cnNpdmU6eWVzfSwgKGV2ZW50LCBmaWxlKSAtPlxuICAgICAgICAgICAgaWYgZXZlbnQgaXMgJ2NoYW5nZScgdGhlbiBjYiBldmVudCwgZmlsZVxuICAgIFxuICAgIGxvZyBibHVlQnJpZ2h0ICd3YXRjaGluZyAuLi4nXG4gICAgd2F0Y2ggJ2NvZmZlZS8nLCAoZXZlbnQsZmlsZSkgLT5cbiAgICAgICAgbG9nIGJsdWVCcmlnaHQgXCJjb2ZmZWUvI3tmaWxlfSBjaGFuZ2VkXCJcbiAgICAgICAgYnVpbGRBbmRUZXN0IGZpbGUgaXMgJ2dyYW1tYXIuY29mZmVlJ1xuICAgICAgICAgICAgXG4gICAgd2F0Y2ggJ3Rlc3QvY29mZmVlLycsIChldmVudCxmaWxlKSAtPlxuICAgICAgICBsb2cgeWVsbG93IFwidGVzdC9jb2ZmZWUvI3tmaWxlfSBjaGFuZ2VkXCJcbiAgICAgICAgc3Bhd25UZXN0ICdjb2ZmZWUnXG4gICAgICAgICAgICBcbiAgICB3YXRjaCAndGVzdC9rb2ZmZWUnLCAoZXZlbnQsZmlsZSkgLT5cbiAgICAgICAgbG9nIHllbGxvdyBcInRlc3Qva29mZmVlLyN7ZmlsZX0gY2hhbmdlZFwiXG4gICAgICAgIHNwYXduVGVzdCAna29mZmVlJ1xuICBcbiAgICB3YXRjaCAna2FrZS5jb2ZmZWUnLCAtPlxuICAgICAgICBsb2cgYmx1ZUJyaWdodCBcImtha2UuY29mZmVlIGNoYW5nZWQhXCJcbiAgICAgICAgY2hpbGRwLmV4ZWNTeW5jICdiaW4va2FrZSB3YXRjaCcsIHN0ZGlvOiAnaW5oZXJpdCcsIHNoZWxsOiB0cnVlLCBjd2Q6cHJvY2Vzcy5jd2QoKVxuICAgICAgICBwcm9jZXNzLmV4aXQgMFxuICAgICAgICAgICAgXG4gICAgcHJvY2Vzcy5vbiAnZXhpdCcsIC0+IGxvZyAnZXhpdDonLCBwcm9jZXNzLnBpZFxuICAgICAgICAgICAgXG4jIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG5cbnRhc2sgJ2JlbmNoJywgJ2JlbmNobWFyayBvZiBjb21waWxhdGlvbiB0aW1lJywgLT5cbiAgICBcbiAgICB7IGluamVjdEZlYXR1cmUgfSA9IHJlcXVpcmUgJy4vanMvZmVhdHVyZXMnXG4gICAgeyBpbmplY3RNZXRhIH0gPSByZXF1aXJlICcuL2pzL21ldGEnXG4gICAgXG4gICAgb3B0cyA9IGluamVjdE1ldGEgaW5qZWN0RmVhdHVyZSB7fVxuICAgIFxuICAgIFJld3JpdGVyICA9IHJlcXVpcmUgJy4vanMvcmV3cml0ZXInXG4gICAgc291cmNlcyAgID0gWydrb2ZmZWUnICdncmFtbWFyJyAnaGVscGVycycgJ2xleGVyJyAnbm9kZXMnICdyZXdyaXRlcicgJ3Njb3BlJ11cbiAgICBjb2ZmZWUgICAgPSBzb3VyY2VzLm1hcCgobmFtZSkgLT4gZnMucmVhZEZpbGVTeW5jIFwiY29mZmVlLyN7bmFtZX0uY29mZmVlXCIpLmpvaW4gJ1xcbidcbiAgICBmbXQgICAgICAgPSAobXMpIC0+IFwiICN7Ym9sZCBcIiAgICAgI3ttc31cIi5zbGljZSAtNCB9IG1zXCJcbiAgICB0b3RhbCAgICAgPSAwXG4gICAgbm93ICAgICAgID0gRGF0ZS5ub3coKVxuICAgIHRpbWUgICAgICA9IC0+IHRvdGFsICs9IG1zID0gLShub3cgLSBub3cgPSBEYXRlLm5vdygpKTsgZm10IG1zXG4gICAgdG9rZW5zICAgID0gS29mZmVlLnRva2VucyBjb2ZmZWUsIGZlYXR1cmU6cmV3cml0ZTpub1xuICAgIGxvZyBncmF5ICBcIkxleCAgICAje3RpbWUoKX0gKCN7dG9rZW5zLmxlbmd0aH0gdG9rZW5zKVwiXG4gICAgdG9rZW5zICAgID0gbmV3IFJld3JpdGVyKCkucmV3cml0ZSB0b2tlbnMsIG9wdHNcbiAgICBsb2cgZ3JheSAgXCJSZXdyaXRlI3t0aW1lKCl9ICgje3Rva2Vucy5sZW5ndGh9IHRva2VucylcIlxuICAgIG5vZGVzICAgICA9IEtvZmZlZS5ub2RlcyB0b2tlbnMsIG9wdHNcbiAgICBsb2cgZ3JheSAgXCJQYXJzZSAgI3t0aW1lKCl9XCJcbiAgICBqcyAgICAgICAgPSBub2Rlcy5jb21waWxlIGJhcmU6IHllc1xuICAgIGxvZyBncmF5ICBcIkNvbXBpbGUje3RpbWUoKX0gKCN7anMubGVuZ3RofSBjaGFycylcIlxuICAgIGxvZyB3aGl0ZSBcIlRvdGFsICAjeyBmbXQgdG90YWwgfVwiXG5cbiMgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuIyAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgXG4jICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiMgICAgMDAwICAgICAwMDAgICAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgIFxuIyAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwICAgXG5cbnJ1blRlc3RzID0gKHRlc3RzZXRzKSAtPlxuICAgIFxuICAgIHN0YXJ0VGltZSAgICAgPSBEYXRlLm5vdygpXG4gICAgY3VycmVudEZpbGUgICA9IG51bGxcbiAgICBmYWlsdXJlcyAgICAgID0gW11cbiAgICBwYXNzZWRUZXN0cyAgID0gMFxuICAgIGZhaWxlZFRlc3RzICAgPSAwXG5cbiAgICBnbG9iYWwudGVzdCAgID0gKGRlc2NyaXB0aW9uLCBmbikgLT5cbiAgICAgICAgdHJ5XG4gICAgICAgICAgICBmbi50ZXN0ID0ge2Rlc2NyaXB0aW9uLCBjdXJyZW50RmlsZX1cbiAgICAgICAgICAgIGZuLmNhbGwoZm4pXG4gICAgICAgICAgICArK3Bhc3NlZFRlc3RzXG4gICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgKytmYWlsZWRUZXN0c1xuICAgICAgICAgICAgZmFpbHVyZXMucHVzaFxuICAgICAgICAgICAgICAgIGZpbGVuYW1lOiAgICBjdXJyZW50RmlsZVxuICAgICAgICAgICAgICAgIGVycm9yOiAgICAgICBlcnJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb24gaWYgZGVzY3JpcHRpb24/XG4gICAgICAgICAgICAgICAgc291cmNlOiAgICAgIGZuLnRvU3RyaW5nKCkgaWYgZm4udG9TdHJpbmc/XG5cbiAgICBoZWxwZXJzLmluaXRUZXN0KClcbiAgICAgICAgICAgICAgICBcbiAgICBmaWxlcyA9IFtdXG4gICAgZm9yIHRlc3RzZXQgaW4gdGVzdHNldHNcbiAgICAgICAgZmlsZXMgPSBmaWxlcy5jb25jYXQgZnMucmVhZGRpclN5bmMoXCJ0ZXN0LyN7dGVzdHNldH1cIikubWFwIChmKSAtPiBbdGVzdHNldCwgZl1cbiAgICAgICAgXG4gICAgbG9nIGdyZWVuIFwiI3tmaWxlcy5sZW5ndGh9IHRlc3QgZmlsZXMgLi4uXCJcbiAgICAgICAgXG4gICAgZm9yIFt0ZXN0c2V0LGZpbGVdIGluIGZpbGVzIHdoZW4gaGVscGVycy5pc0NvZmZlZSBmaWxlXG4gICAgICAgIFxuICAgICAgICBjdXJyZW50RmlsZSA9IGZpbGVuYW1lID0gcGF0aC5qb2luICd0ZXN0JywgdGVzdHNldCwgZmlsZVxuICAgICAgICBjb2RlID0gZnMucmVhZEZpbGVTeW5jIGZpbGVuYW1lXG4gICAgICAgIHRyeVxuICAgICAgICAgICAgS29mZmVlLnJ1biBjb2RlLnRvU3RyaW5nKCksIHtmaWxlbmFtZX1cbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICBmYWlsdXJlcy5wdXNoIHtmaWxlbmFtZSwgZXJyfVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIGZhaWx1cmVzLmxlbmd0aFxuICAgICAgICAgICAgbG9nIHJlZCBwYXRoLmJhc2VuYW1lKGZpbGVuYW1lLCAnLmNvZmZlZScpXG4gICAgICAgICAgICBmb3IgZmFpbCBpbiBmYWlsdXJlc1xuICAgICAgICAgICAgICAgIHtlcnJvciwgZmlsZW5hbWUsIGRlc2NyaXB0aW9uLCBzb3VyY2V9ID0gZmFpbFxuICAgICAgICAgICAgICAgIGxvZyB3aGl0ZSAnJ1xuICAgICAgICAgICAgICAgIGxvZyBncmVlbiAgXCIgICAgI3tkZXNjcmlwdGlvbn1cIiBpZiBkZXNjcmlwdGlvblxuICAgICAgICAgICAgICAgIGxvZyB5ZWxsb3cgXCIgICAgI3tlcnJvcj8ubWVzc2FnZX1cIlxuICAgICAgICAgICAgICAgIGxvZyBncmF5ICAgXCIgICAgI3tmaWxlbmFtZX1cIlxuICAgICAgICAgICAgICAgIGlmIHNvdXJjZVxuICAgICAgICAgICAgICAgICAgICBsb2cgd2hpdGUgIFwiICAgICN7c291cmNlfVwiIFxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgbG9nIHJlZCAgICBcIiAgICAje2Vycm9yfVwiXG4gICAgICAgIGZhaWx1cmVzID0gW11cbiAgICAgICAgICAgIFxuICAgIHRpbWUgPSAoKERhdGUubm93KCkgLSBzdGFydFRpbWUpIC8gMTAwMCkudG9GaXhlZCgyKVxuICAgIG1lc3NhZ2UgPSBncmVlbiBcIiN7cGFzc2VkVGVzdHN9IHBhc3NlZCB0ZXN0cyBpbiAje3RpbWV9IHNlY29uZHNcIlxuICAgIGlmIG5vdCBmYWlsZWRUZXN0c1xuICAgICAgICBsb2cgbWVzc2FnZVxuICAgIGVsc2VcbiAgICAgICAgbG9nIHJlZCBcIiN7ZmFpbGVkVGVzdHN9IGZhaWxlZCBhbmQgI3ttZXNzYWdlfVwiXG4gICAgXG4gICAgcmV0dXJuIGZhaWxlZFRlc3RzXG5cbnRhc2sgJ3Rlc3QnLCAgICdydW4gdGhlIHRlc3RzJywgICAgLT4gcHJvY2Vzcy5leGl0IHJ1blRlc3RzIFsna29mZmVlJyAnY29mZmVlJ10gIyBvcmRlciBzaG91bGQgbm90IGJlIGltcG9ydGFudC4gSWYgaXQgaXMsIGtvZmZlZSB0ZXN0cyBtaWdodCBjYWxsIGV2YWwgd2l0aG91dCBzYW5kYm94LlxudGFzayAnY29mZmVlJywgJ3J1biBjb2ZmZWUgdGVzdHMnLCAtPiBwcm9jZXNzLmV4aXQgcnVuVGVzdHMgWydjb2ZmZWUnXVxudGFzayAna29mZmVlJywgJ3J1biBrb2ZmZWUgdGVzdHMnLCAtPiBwcm9jZXNzLmV4aXQgcnVuVGVzdHMgWydrb2ZmZWUnXVxuXG5cblxuIl19
//# sourceURL=koffee