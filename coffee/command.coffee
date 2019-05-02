###
 0000000   0000000   00     00  00     00   0000000   000   000  0000000    
000       000   000  000   000  000   000  000   000  0000  000  000   000  
000       000   000  000000000  000000000  000000000  000 0 000  000   000  
000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  
 0000000   0000000   000   000  000   000  000   000  000   000  0000000    
###

# handle various tasks: 
#
#   - compile and save into `.js` files 
#   - compile and print to stdout 
#   - recompile if the source changes
#   - print lexer tokens
#   - print a syntax tree
#   - launch a REPL

fs               = require 'fs'
path             = require 'path'
nopt             = require 'nopt'
helpers          = require './helpers'
Koffee           = require './koffee'
{ spawn, exec }  = require 'child_process'
{ EventEmitter } = require 'events'

useWinPathSep    = path.sep is '\\'

helpers.extend Koffee, new EventEmitter # Allow emitting Node events

{ FEATURES } = require './features'

log       = console.log
error     = console.error
print     = (line) -> process.stdout.write line
printLine = (line) -> process.stdout.write line + '\n' # ???
printWarn = (line) -> process.stderr.write line + '\n' # ???
hidden    = (file) -> /^\.|~$/.test file

BANNER = "Usage: koffee [options] path/to/script -- [args]"

SWITCHES = [
    ['-b', '--bare',              'compile without a top-level function wrapper',          Boolean        ]
    ['-c', '--compile',           'compile to JavaScript and save as .js files',           Boolean        ]
    ['-e', '--eval [STRING]',     'pass a string from the command line as input',         [String, Array] ]
    ['-f', '--features',          'list available features',                               Boolean        ]
    ['',   '--no-[feature]',      'disable a feature, e.g. --no-negative-index',           null           ]
    ['-h', '--help',              'display this help message',                             Boolean        ]
    ['-j', '--js',                'print out the compiled JavaScript',                     Boolean        ]
    ['-m', '--map',               'generate source map and save as .js.map files',         Boolean        ]
    ['-M', '--inline-map',        'generate source map and include it directly in output', Boolean        ]
    ['-n', '--noop',              'does nothing, for debugging purposes',                  Boolean        ]
    ['-o', '--output [DIR]',      'set the output directory for compiled JavaScript',      String         ]
    ['-p', '--parse',             'print out the parse tree that the parser produces',     Boolean        ]
    ['-r', '--require [MODULE]',  'require the given module before eval or REPL',         [String, Array] ]
    ['-s', '--stdio',             'listen for and compile scripts over stdio',             Boolean        ]
    ['-t', '--tokens',            'print out the tokens that the lexer/rewriter produce',  Boolean        ]
    ['-v', '--version',           'display the version number',                            Boolean        ]
    ['-w', '--watch',             'watch scripts for changes and rerun commands',          Boolean        ]
]

opts = {}

#  0000000   00000000   000000000  000   0000000   000   000   0000000  
# 000   000  000   000     000     000  000   000  0000  000  000       
# 000   000  00000000      000     000  000   000  000 0 000  0000000   
# 000   000  000           000     000  000   000  000  0000       000  
#  0000000   000           000     000   0000000   000   000  0000000   

parseOptions = ->

    toggles = [ 'bare', 'compile', 'features', 'help', 'inline-map', 'js', 'map', 
                'parse', 'stdio', 'tokens','version', 'watch', 'Debug' ] 
    
    known = {Debug:Boolean}
    short = {D:'--Debug'}
    SWITCHES.map (s) -> l = s[1].split(' ')[0][2..]; known[l] = s[3] if s[3]; short[s[0][1]] = "--#{l}" if s[0]!=''
    FEATURES.map (f) -> known[f[0]] = Boolean
    
    o = opts = nopt known, short
        
    # log o
    
    o.compile  or= !!o.output
    o.arguments  = o.argv.remain
    o.run        = not (o.compile or o.js or o.map or o.tokens or o.parse)
    o.js         = !!(o.js or o.eval or o.stdio and o.compile) # js output is passed to eval and stdio compile
    
    o.feature = {}
    FEATURES.map (f) -> o.feature[f[0]] = o[f[0]] ? true; delete o[f[0]]
    
    if o.Debug
        delete o.argv
        log helpers.stringify o

# 00000000   000   000  000   000  
# 000   000  000   000  0000  000  
# 0000000    000   000  000 0 000  
# 000   000  000   000  000  0000  
# 000   000   0000000   000   000  

# Run `coffee` by parsing passed options and determining what action to take.
# Many flags cause us to divert before compiling anything. 
# Flags passed after `--` will be passed verbatim in `process.argv`

run = ->
    
    parseOptions()
        
    return features()     if opts.features
    return usage()        if opts.help
    return version()      if opts.version
    return startRepl()    if opts.interactive
    return compileStdio() if opts.stdio
    if opts.eval
        for eval in opts.eval
            compileScript eval
        return
    return startRepl()    if not opts.arguments.length
    
    literals = if opts.run then opts.arguments.splice 1 else []
    
    process.argv = process.argv[0..1].concat literals
    process.argv[0] = 'koffee'

    opts.output = path.resolve opts.output if opts.output
    for source in opts.arguments
        source = path.resolve source
        
        if opts.watch
            watchPath source
        else
            compilePath source, yes

exports.run = run
        
startRepl = ->
    
    # Make the REPL use the global context so as to 
    #   (a) be consistent with the `node` REPL and, therefore, 
    #   (b) make packages that modify native prototypes (such as 'colors' and 'sugar') work as expected.
    
    replCliOpts = useGlobal: yes
    opts.prelude = makePrelude opts.require if opts.require
    replCliOpts.prelude = opts.prelude
    require('./repl').start replCliOpts

makePrelude = (requires) ->
    
    requires.map (module) ->
        [_, name, module] = match if match = module.match(/^(.*)=(.*)$/)
        name ||= helpers.baseFileName module, yes, useWinPathSep
        "#{name} = require('#{module}')"
    .join ';'

#  0000000   0000000   00     00  00000000   000  000      00000000  
# 000       000   000  000   000  000   000  000  000      000       
# 000       000   000  000000000  00000000   000  000      0000000   
# 000       000   000  000 0 000  000        000  000      000       
#  0000000   0000000   000   000  000        000  0000000  00000000  

# Compile a script or a directory. If a directory is passed, recursively compile all '.coffee' and '.koffee' files.

compilePath = (source, topLevel = no) ->

    return if not topLevel and hidden source
              
    try
        stats = fs.statSync source
    catch err
        if err.code is 'ENOENT'
            error "Command.compilePath can't stat '#{source}'"
            process.exit 1
        throw err
        
    if stats.isDirectory()
        
        if path.basename(source) in ['node_modules', '.git']
            return
            
        if opts.run
            compilePath findDirectoryIndex(source), topLevel
            return
                 
        log 'Command.compilePath dir:', source if opts.Debug
        
        try
            files = fs.readdirSync source
        catch err
            if err.code is 'ENOENT' then return 
            throw err
            
        for file in files
            compilePath path.join source, file
            
    else if topLevel or helpers.isCoffee source
        
        try
            code = fs.readFileSync source
        catch err
            if err.code is 'ENOENT' then return
            throw err
        
        log 'Command.compilePath file:', source if opts.Debug
            
        compileScript code.toString(), source
        
findDirectoryIndex = (source) ->

    for ext in Koffee.FILE_EXTENSIONS
        index = path.join source, "index#{ext}"
        try
            return index if (fs.statSync index).isFile()
        catch err
            throw err unless err.code is 'ENOENT'
    error "Missing index.coffee in #{source}"
    process.exit 1

#  0000000   0000000   00     00  00000000   000  000      00000000   0000000   0000000  00000000   000  00000000   000000000  
# 000       000   000  000   000  000   000  000  000      000       000       000       000   000  000  000   000     000     
# 000       000   000  000000000  00000000   000  000      0000000   0000000   000       0000000    000  00000000      000     
# 000       000   000  000 0 000  000        000  000      000            000  000       000   000  000  000           000     
#  0000000   0000000   000   000  000        000  0000000  00000000  0000000    0000000  000   000  000  000           000     

# Compile a single source script, containing the given code, according to the requested options. 
# If evaluating the script directly sets `__filename`, `__dirname` and `module.filename` to be correct relative to the script's path.

compileScript = (input, file = null) ->
    
    o = opts
    options = compileOptions file
    
    try
        t = task = {file, input, options}
        Koffee.emit 'compile', task
        if o.tokens
            printTokens Koffee.tokens t.input, t.options
        else if o.nodes
            printLine Koffee.nodes(t.input, t.options).toString().trim()
        else if o.run
            Koffee.register()
            Koffee.eval opts.prelude, t.options if opts.prelude
            # log "Command.compileScript Koffee.run input:", t.input if opts.Debug
            t.options.filename ?= options.source
            # log "Command.compileScript Koffee.run options:", t.options if opts.Debug
            # log "Command.compileScript Koffee.run task:", t if opts.Debug
            if opts.noop then log "noop run #{file}"
            else
                Koffee.run t.input, t.options
        else
            compiled = Koffee.compile t.input, t.options
            t.output = compiled
            if o.map
                t.output = compiled.js
                t.sourceMap = compiled.v3SourceMap

            Koffee.emit 'success', task
            
            if o.js
                if opts.noop then log "noop js #{file}"
                else 
                    printLine t.output.trim()
            else if o.compile or o.map
                if opts.noop then log "noop write #{options.jsPath}"
                else
                    writeJs t.file, t.output, options.jsPath, t.sourceMap
    catch err
        
        Koffee.emit 'failure', err, task
        return if Koffee.listeners('failure').length
        message = err?.stack or "#{err}"
        if o.watch
            printLine message + '\x07'
        else
            printWarn message
            process.exit 1

compileOptions = (source) -> # The compile-time options to pass to the compiler.
    
    copts =         
        source:    source
        sourceMap: opts.map
        inlineMap: opts['inline-map']
        feature:   opts.feature
        bare:      opts.bare
        Debug:     opts.Debug

    if source
        
        cwd = process.cwd()
        jsPath = outputPath source, '.js'
        jsDir = path.dirname jsPath
        copts = helpers.merge copts, {
            jsPath
            sourceRoot: path.relative jsDir, cwd
            sourceFiles: [path.relative cwd, source]
            generatedFile: helpers.baseFileName(jsPath, no, useWinPathSep)
        }
        # else
            # copts = helpers.merge copts,
                # sourceRoot: ""
                # sourceFiles: [helpers.baseFileName source, no, useWinPathSep]
                # generatedFile: helpers.baseFileName(source, yes, useWinPathSep) + ".js"
    copts
            
# Attach the appropriate listeners to compile scripts incoming over **stdin**, and write them back to **stdout**.

compileStdio = ->
    
    buffers = []
    stdin = process.openStdin()
    stdin.on 'data', (buffer) ->
        buffers.push buffer if buffer
    stdin.on 'end', ->
        compileScript Buffer.concat(buffers).toString()

# 000   000   0000000   000000000   0000000  000   000  
# 000 0 000  000   000     000     000       000   000  
# 000000000  000000000     000     000       000000000  
# 000   000  000   000     000     000       000   000  
# 00     00  000   000     000      0000000  000   000  

watchPath = (source) -> # Watch a file or directory.
    
    try
        stats = fs.statSync source
    catch err
        return if err.code is 'ENOENT'
        return error "Command.watchPath can't stat '#{source}'", err
                
    if stats.isDirectory()
        watchDir source
    else
        watchFile source

# Watch a single file using `fs.watch`, recompiling it every time the file is updated.
# May be used in combination with other options, such as `--print`.
        
watchFile = (source) ->
    
    return if not helpers.isCoffee source
    
    log 'Command.watchFile', source if opts.Debug
    
    watcher        = null
    prevStats      = null
    compileTimeout = null

    startWatcher = ->
        
        watcher = fs.watch source
        .on 'change', (change) ->
            
            return if change != 'change'
            
            log 'Command.watchFile', change, source if opts.Debug

            clearTimeout compileTimeout
            compileTimeout = wait 25, ->
                
                fs.stat source, (err, stats) ->
                    return watcher.close() if err?.code is 'ENOENT'
                    return error err if err
                    return if prevStats and stats.mtime.getTime() is prevStats.mtime.getTime() and stats.size is prevStats.size
                    prevStats = stats
                    fs.readFile source, (err, code) ->
                        return error err if err
                        log 'Command.watchFile compile', source if opts.Debug
                        compileScript code.toString(), source
                        
        .on 'error', (err) ->
            throw err unless err.code is 'EPERM'

    try
        startWatcher()
    catch err
        error err

watchDir = (source) ->
    
    log 'Command.watchDir', source if opts.Debug
    
    watcher = null

    startWatcher = ->

        try
            files = fs.readdirSync source
        catch err
            return if err?.code is 'ENOENT'
            throw err
            
        for file in files
            continue if file[0] == '.'
            continue if file in ['node_modules']
            watchPath path.join source, file
        
        watcher = fs.watch source
        .on 'error', (err) ->
            throw err unless err.code is 'EPERM'
            watcher.close()
        .on 'change', (change, p) ->
            if change == 'rename'
                log 'Command.watchDir', change, path.join source, p if opts.Debug
                watchPath path.join source, p
            
    try
        startWatcher()
    catch err
        return if err.code is 'ENOENT'
        throw err

# Get the corresponding output JavaScript path for a source file.
    
outputPath = (source, extension) ->
    
    basename = helpers.baseFileName source, yes, useWinPathSep
    if opts.output
        dir = opts.output
    else
        dir = path.dirname source
    path.join dir, basename + extension

# Recursively mkdir, like `mkdir -p`.

mkdirp = (dir, fn) ->
    mode = 0o777 & ~process.umask()

    do mkdirs = (p = dir, fn) ->
        fs.exists p, (exists) ->
            if exists
                fn()
            else
                mkdirs path.dirname(p), ->
                    fs.mkdir p, mode, (err) ->
                        return fn err if err
                        fn()

# 000   000  00000000   000  000000000  00000000        000   0000000  
# 000 0 000  000   000  000     000     000             000  000       
# 000000000  0000000    000     000     0000000         000  0000000   
# 000   000  000   000  000     000     000       000   000       000  
# 00     00  000   000  000     000     00000000   0000000   0000000   

# Write out a JavaScript source file with the compiled code. 
# By default, files are written out in `cwd` as `.js` files with the same name, but the output directory can be customized with `--output`.
# If `generatedSourceMap` is provided, this will write a `.js.map` file into the same directory as the `.js` file.

writeJs = (source, js, jsPath, generatedSourceMap = null) ->
    
    sourceMapPath = outputPath source, '.js.map'
    jsDir = path.dirname jsPath
    compile = ->
        if opts.compile
            js = ' ' if js.length <= 0
            if generatedSourceMap then js = "#{js}\n//# sourceMappingURL=#{helpers.baseFileName sourceMapPath, no, useWinPathSep}\n"
            fs.writeFile jsPath, js, (err) ->
                if err
                    printLine err.message
                    process.exit 1
                else if opts.compile and opts.watch
                    timeLog "compiled #{source}"
        if generatedSourceMap
            fs.writeFile sourceMapPath, generatedSourceMap, (err) ->
                if err
                    printLine "Could not write source map: #{err.message}"
                    process.exit 1
    fs.exists jsDir, (itExists) ->
        if itExists then compile() else mkdirp jsDir, compile

wait = (milliseconds, func) -> setTimeout func, milliseconds # Convenience for cleaner setTimeouts.

timeLog = (message) -> log "#{(new Date).toLocaleTimeString()} - #{message}"

# 000000000   0000000   000   000  00000000  000   000   0000000  
#    000     000   000  000  000   000       0000  000  000       
#    000     000   000  0000000    0000000   000 0 000  0000000   
#    000     000   000  000  000   000       000  0000       000  
#    000      0000000   000   000  00000000  000   000  0000000   

printTokens = (tokens) ->
    # strings = for token in tokens
        # tag = token[0]
        # value = token[1].toString().replace(/\n/, '\\n')
        # "[#{tag} #{value}]"
    # printLine strings.join(' ')
    for index in [0...tokens.length]
        token = tokens[index]
        tag   = token[0]
        value = token[1].toString().replace(/\n/, '\\n')
        if tag == 'TERMINATOR'
            print '\n\n'
        else if tag == 'INDENT'
            print 'IND '
        else if tag == 'OUTDENT'
            print 'OUT '
        else if tag in ['CLASS', 'PARAM_START', 'PARAM_END', 'NULL']
            print "#{index} #{tag} "
        else if tag is value
            print "#{index} #{tag} "
        else
            print "#{index} #{tag}=#{value} "
        
version = -> printLine "#{Koffee.VERSION}"
usage   = -> 

    lines = ["#{BANNER}\n"]
    
    rules = SWITCHES.map (rule) ->
        rule.unshift null if rule.length < 3
        [short, long, description] = rule
        match    = long.match(/\[(\w+(\*?))\]/)
        longFlag = long.match(/^(--\w[\w\-]*)/)[1]
        letter   = if short then short + ', ' else '    '
        option   = helpers.pad letter + long
        lines.push '    ' + option + description
        
    log "\n#{ lines.join('\n') }\n"
        
features = ->
    
    f = (f) -> "    #{helpers.pad f[0]}#{f[1]}"
        
    log "\nFeatures:\n\n#{ FEATURES.map(f).join('\n') }\n"
