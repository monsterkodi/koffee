###
00000000   00000000   0000000   000   0000000  000000000  00000000  00000000   
000   000  000       000        000  000          000     000       000   000  
0000000    0000000   000  0000  000  0000000      000     0000000   0000000    
000   000  000       000   000  000       000     000     000       000   000  
000   000  00000000   0000000   000  0000000      000     00000000  000   000  
###

Koffee        = require './koffee'
child_process = require 'child_process'
helpers       = require './helpers'
path          = require 'path'
fs            = require 'fs'

loadFile = (module, filename) ->
    
    code = fs.readFileSync filename, 'utf8'

    try
        answer = Koffee.compile code, 
            filename:  filename
            sourceMap: false
            inlineMap: true
            sourceFiles: [filename]
        module._compile answer, filename
    catch err
        throw helpers.updateSyntaxError err, code, filename

# If the installed version of Node supports `require.extensions`, register our extensions.

if require.extensions
    for ext in Koffee.FILE_EXTENSIONS
        require.extensions[ext] = loadFile

    # Patch Node's module loader to be able to handle multi-dot extensions.
    # This is a horrible thing that should not be required.
    
    Module = require 'module'

    findExtension = (filename) ->
        extensions = path.basename(filename).split '.'
        # Remove the initial dot from dotfiles.
        extensions.shift() if extensions[0] is ''
        # Start with the longest possible extension and work our way shortwards.
        while extensions.shift()
            curExtension = '.' + extensions.join '.'
            return curExtension if Module._extensions[curExtension]
        '.js'

    Module::load = (filename) ->
        @filename = filename
        @paths = Module._nodeModulePaths path.dirname filename
        extension = findExtension filename
        Module._extensions[extension](this, filename)
        @loaded = true

# If we're on Node, patch `child_process.fork` so that koffee scripts are able
# to fork both koffee and JavaScript files, directly.

if child_process
    
    {fork} = child_process
    binary = require.resolve '../bin/koffee'
    
    child_process.fork = (path, args, options) ->
        if helpers.isCoffee path
            unless Array.isArray args
                options = args or {}
                args = []
            args = [path].concat args
            path = binary
        fork path, args, options
