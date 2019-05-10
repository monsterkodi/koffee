// koffee 0.29.0

/*
000   000   0000000   000   000  00000000  
000  000   000   000  000  000   000       
0000000    000000000  0000000    0000000   
000  000   000   000  000  000   000       
000   000  000   000  000   000  00000000
 */

(function() {
    var Koffee, fs, gray, helpers, kakefileDirectory, nopt, path, printTasks, ref, run, tasks, white, yellow;

    fs = require('fs');

    path = require('path');

    nopt = require('nopt');

    helpers = require('./helpers');

    Koffee = require('./koffee');

    ref = require('colorette'), gray = ref.gray, white = ref.white, yellow = ref.yellow;

    tasks = {};

    Koffee.register();

    helpers.extend(global, {
        task: function(name, description, action) {
            var ref1;
            if (!action) {
                ref1 = [description, action], action = ref1[0], description = ref1[1];
            }
            return tasks[name] = {
                name: name,
                description: description,
                action: action
            };
        },
        invoke: function(name) {
            if (!tasks[name]) {
                console.log("No such task: " + name + "\n");
                console.log('To see a list of all tasks, run "kake"');
                process.exit(1);
            }
            return tasks[name].action();
        }
    });

    run = function() {
        var arg, i, len, results, tasklist;
        global.__originalDirname = fs.realpathSync('.');
        process.chdir(kakefileDirectory(__originalDirname));
        Koffee.run(fs.readFileSync('kake.coffee').toString(), {
            filename: 'kake.coffee'
        });
        tasklist = nopt().argv.remain;
        if (!tasklist.length) {
            return printTasks();
        }
        results = [];
        for (i = 0, len = tasklist.length; i < len; i++) {
            arg = tasklist[i];
            results.push(invoke(arg));
        }
        return results;
    };

    exports.run = run;

    printTasks = function() {
        var cakefilePath, desc, name, relative, task;
        relative = path.relative || path.resolve;
        cakefilePath = path.join(relative(__originalDirname, process.cwd()), 'kake.coffee');
        console.log(yellow("\nTasks:\n"));
        for (name in tasks) {
            task = tasks[name];
            desc = task.description ? "" + task.description : '';
            name = helpers.pad(name);
            console.log('    ' + white(name) + gray(desc));
        }
        return console.log('');
    };

    kakefileDirectory = function(dir) {
        var parent;
        if (fs.existsSync(path.join(dir, 'kake.coffee'))) {
            return dir;
        }
        parent = path.normalize(path.join(dir, '..'));
        if (parent !== dir) {
            return kakefileDirectory(parent);
        }
        throw new Error("kake.coffee not found in " + (process.cwd()));
    };

}).call(this);
