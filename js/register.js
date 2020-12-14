// koffee 1.13.0

/*
00000000   00000000   0000000   000   0000000  000000000  00000000  00000000   
000   000  000       000        000  000          000     000       000   000  
0000000    0000000   000  0000  000  0000000      000     0000000   0000000    
000   000  000       000   000  000       000     000     000       000   000  
000   000  00000000   0000000   000  0000000      000     00000000  000   000
 */

(function() {
    var Koffee, Module, binary, child_process, ext, findExtension, fork, fs, helpers, i, len, loadFile, path, ref;

    Koffee = require('./koffee');

    child_process = require('child_process');

    helpers = require('./helpers');

    path = require('path');

    fs = require('fs');

    loadFile = function(module, filename) {
        var answer, code, err;
        code = fs.readFileSync(filename, 'utf8');
        try {
            answer = Koffee.compile(code, {
                filename: filename,
                sourceMap: false,
                inlineMap: true,
                sourceFiles: [filename]
            });
            return module._compile(answer, filename);
        } catch (error) {
            err = error;
            throw helpers.updateSyntaxError(err, code, filename);
        }
    };

    if (require.extensions) {
        ref = Koffee.FILE_EXTENSIONS;
        for (i = 0, len = ref.length; i < len; i++) {
            ext = ref[i];
            require.extensions[ext] = loadFile;
        }
        Module = require('module');
        findExtension = function(filename) {
            var curExtension, extensions;
            extensions = path.basename(filename).split('.');
            if (extensions[0] === '') {
                extensions.shift();
            }
            while (extensions.shift()) {
                curExtension = '.' + extensions.join('.');
                if (Module._extensions[curExtension]) {
                    return curExtension;
                }
            }
            return '.js';
        };
        Module.prototype.load = function(filename) {
            var extension;
            this.filename = filename;
            this.paths = Module._nodeModulePaths(path.dirname(filename));
            extension = findExtension(filename);
            Module._extensions[extension](this, filename);
            return this.loaded = true;
        };
    }

    if (child_process) {
        fork = child_process.fork;
        binary = require.resolve('../bin/koffee');
        child_process.fork = function(path, args, options) {
            if (helpers.isCoffee(path)) {
                if (!Array.isArray(args)) {
                    options = args || {};
                    args = [];
                }
                args = [path].concat(args);
                path = binary;
            }
            return fork(path, args, options);
        };
    }

}).call(this);
