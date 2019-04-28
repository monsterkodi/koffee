###
 0000000   0000000   00     00  00     00   0000000   000   000  0000000    
000       000   000  000   000  000   000  000   000  0000  000  000   000  
000       000   000  000000000  000000000  000000000  000 0 000  000   000  
000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  
 0000000   0000000   000   000  000   000  000   000  000   000  0000000    
###

# The `koffee` utility. Handles various tasks: 
#   - compile and save into `.js` files 
#   - compile and print to stdout 
#   - recompile if the source changes
#   - print a token stream 
#   - print a syntax tree
#   - launch an interactive REPL

fs             = require 'fs'
path           = require 'path'
helpers        = require './helpers'
optparse       = require './optparse'
Koffee         = require './koffee'
{spawn, exec}  = require 'child_process'
{EventEmitter} = require 'events'
useWinPathSep  = path.sep is '\\'

helpers.extend Koffee, new EventEmitter # Allow koffee to emit Node.js events.

print     = (line) -> process.stdout.write line
printLine = (line) -> process.stdout.write line + '\n'
printWarn = (line) -> process.stderr.write line + '\n'
hidden    = (file) -> /^\.|~$/.test file

# The help banner that is printed in conjunction with `-h`/`--help`.

BANNER = "Usage: koffee [options] path/to/script -- [args]"

# The list of valid option flags.

SWITCHES = [
    ['-b', '--bare',              'compile without a top-level function wrapper']
    ['-c', '--compile',           'compile to JavaScript and save as .js files']
    ['-e', '--eval',              'pass a string from the command line as input']
    ['-h', '--help',              'display this help message']
    ['-i', '--interactive',       'run an interactive REPL']
    ['-m', '--map',               'generate source map and save as .js.map files']
    ['-M', '--inline-map',        'generate source map and include it directly in output']
    ['-n', '--nodes',             'print out the parse tree that the parser produces']
    ['--nodejs [ARGS]',           'pass options directly to the "node" binary']
    ['--no-header',               'suppress the "Generated by" header']
    ['-o', '--output [DIR]',      'set the output directory for compiled JavaScript']
    ['-p', '--print',             'print out the compiled JavaScript']
    ['-r', '--require [MODULE*]', 'require the given module before eval or REPL']
    ['-s', '--stdio',             'listen for and compile scripts over stdio']
    ['-t', '--tokens',            'print out the tokens that the lexer/rewriter produce']
    ['-v', '--version',           'display the version number']
    ['-w', '--watch',             'watch scripts for changes and rerun commands']
]

opts         = {}
sources      = []
sourceCode   = []
notSources   = {}
watchedDirs  = {}
optionParser = null

# 00000000   000   000  000   000  
# 000   000  000   000  0000  000  
# 0000000    000   000  000 0 000  
# 000   000  000   000  000  0000  
# 000   000   0000000   000   000  

# Run `coffee` by parsing passed options and determining what action to take.
# Many flags cause us to divert before compiling anything. 
# Flags passed after `--` will be passed verbatim in `process.argv`

exports.run = ->
    parseOptions()
    
    # Make the REPL use the global context so as to 
    #   (a) be consistent with the `node` REPL and, therefore, 
    #   (b) make packages that modify native prototypes (such as 'colors' and 'sugar') work as expected.
    
    replCliOpts = useGlobal: yes
    opts.prelude = makePrelude opts.require         if opts.require
    replCliOpts.prelude = opts.prelude
    return forkNode()                               if opts.nodejs
    return usage()                                  if opts.help
    return version()                                if opts.version
    return require('./repl').start(replCliOpts)     if opts.interactive
    return compileStdio()                           if opts.stdio
    return compileScript null, opts.arguments[0]    if opts.eval
    return require('./repl').start(replCliOpts)     unless opts.arguments.length
    literals = if opts.run then opts.arguments.splice 1 else []
    process.argv = process.argv[0..1].concat literals
    process.argv[0] = 'koffee'

    opts.output = path.resolve opts.output  if opts.output
    for source in opts.arguments
        source = path.resolve source
        compilePath source, yes, source

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

compilePath = (source, topLevel, base) ->
    
    return if source in sources or
                        watchedDirs[source] or
                        not topLevel and (notSources[source] or hidden source)
    try
        stats = fs.statSync source
    catch err
        if err.code is 'ENOENT'
            console.error "File not found: #{source}"
            process.exit 1
        throw err
        
    if stats.isDirectory()
        
        if path.basename(source) is 'node_modules'
            notSources[source] = yes
            return
        if opts.run
            compilePath findDirectoryIndex(source), topLevel, base
            return
        watchDir source, base if opts.watch
        try
            files = fs.readdirSync source
        catch err
            if err.code is 'ENOENT' then return else throw err
        for file in files
            compilePath (path.join source, file), no, base
            
    else if topLevel or helpers.isCoffee source
        
        sources.push source
        sourceCode.push null
        delete notSources[source]
        watch source, base if opts.watch
        try
            code = fs.readFileSync source
        catch err
            if err.code is 'ENOENT' then return else throw err
        compileScript(source, code.toString(), base)
    else
        notSources[source] = yes

findDirectoryIndex = (source) ->
    
    for ext in Koffee.FILE_EXTENSIONS
        index = path.join source, "index#{ext}"
        try
            return index if (fs.statSync index).isFile()
        catch err
            throw err unless err.code is 'ENOENT'
    console.error "Missing index.coffee or index.litcoffee in #{source}"
    process.exit 1

# Compile a single source script, containing the given code, according to the requested options. 
# If evaluating the script directly sets `__filename`, `__dirname` and `module.filename` to be correct relative to the script's path.

compileScript = (file, input, base = null) ->
    
    o = opts
    options = compileOptions file, base
    
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
            Koffee.run t.input, t.options
        else
            compiled = Koffee.compile t.input, t.options
            t.output = compiled
            if o.map
                t.output = compiled.js
                t.sourceMap = compiled.v3SourceMap

            Koffee.emit 'success', task
            if o.print
                printLine t.output.trim()
            else if o.compile or o.map
                writeJs base, t.file, t.output, options.jsPath, t.sourceMap
    catch err
        Koffee.emit 'failure', err, task
        return if Koffee.listeners('failure').length
        message = err?.stack or "#{err}"
        if o.watch
            printLine message + '\x07'
        else
            printWarn message
            process.exit 1

# Attach the appropriate listeners to compile scripts incoming over **stdin**, and write them back to **stdout**.

compileStdio = ->
    
    buffers = []
    stdin = process.openStdin()
    stdin.on 'data', (buffer) ->
        buffers.push buffer if buffer
    stdin.on 'end', ->
        compileScript null, Buffer.concat(buffers).toString()

# 000   000   0000000   000000000   0000000  000   000  
# 000 0 000  000   000     000     000       000   000  
# 000000000  000000000     000     000       000000000  
# 000   000  000   000     000     000       000   000  
# 00     00  000   000     000      0000000  000   000  

# Watch a source Koffee file using `fs.watch`, recompiling it every time the file is updated.
# May be used in combination with other options, such as `--print`.

watch = (source, base) ->
    watcher              = null
    prevStats            = null
    compileTimeout = null

    watchErr = (err) ->
        throw err unless err.code is 'ENOENT'
        return unless source in sources
        try
            rewatch()
            compile()
        catch
            removeSource source, base
            compileJoin()

    compile = ->
        clearTimeout compileTimeout
        compileTimeout = wait 25, ->
            fs.stat source, (err, stats) ->
                return watchErr err if err
                return rewatch() if prevStats and
                                    stats.size is prevStats.size and
                                    stats.mtime.getTime() is prevStats.mtime.getTime()
                prevStats = stats
                fs.readFile source, (err, code) ->
                    return watchErr err if err
                    compileScript(source, code.toString(), base)
                    rewatch()

    startWatcher = ->
        watcher = fs.watch source
        .on 'change', compile
        .on 'error', (err) ->
            throw err unless err.code is 'EPERM'
            removeSource source, base

    rewatch = ->
        watcher?.close()
        startWatcher()

    try
        startWatcher()
    catch err
        watchErr err

# Watch a directory of files for new additions.
    
watchDir = (source, base) ->
    watcher        = null
    readdirTimeout = null

    startWatcher = ->
        watcher = fs.watch source
        .on 'error', (err) ->
            throw err unless err.code is 'EPERM'
            stopWatcher()
        .on 'change', ->
            clearTimeout readdirTimeout
            readdirTimeout = wait 25, ->
                try
                    files = fs.readdirSync source
                catch err
                    throw err unless err.code is 'ENOENT'
                    return stopWatcher()
                for file in files
                    compilePath (path.join source, file), no, base

    stopWatcher = ->
        watcher.close()
        removeSourceDir source, base

    watchedDirs[source] = yes
    try
        startWatcher()
    catch err
        throw err unless err.code is 'ENOENT'

removeSourceDir = (source, base) ->
    delete watchedDirs[source]
    sourcesChanged = no
    for file in sources when source is path.dirname file
        removeSource file, base
        sourcesChanged = yes

# Remove a file from our source list, and source code cache. Optionally remove the compiled JS version as well.

removeSource = (source, base) ->
    index = sources.indexOf source
    sources.splice index, 1
    sourceCode.splice index, 1
    
    silentUnlink outputPath source, base
    silentUnlink outputPath source, base, '.js.map'
    timeLog "removed #{source}"

silentUnlink = (path) ->
    try
        fs.unlinkSync path
    catch err
        throw err unless err.code in ['ENOENT', 'EPERM']

# Get the corresponding output JavaScript path for a source file.
    
outputPath = (source, base, extension=".js") ->
    basename    = helpers.baseFileName source, yes, useWinPathSep
    srcDir      = path.dirname source
    if not opts.output
        dir = srcDir
    else if source is base
        dir = opts.output
    else
        dir = path.join opts.output, path.relative base, srcDir
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

writeJs = (base, sourcePath, js, jsPath, generatedSourceMap = null) ->
    
    sourceMapPath = outputPath sourcePath, base, ".js.map"
    jsDir    = path.dirname jsPath
    compile = ->
        if opts.compile
            js = ' ' if js.length <= 0
            if generatedSourceMap then js = "#{js}\n//# sourceMappingURL=#{helpers.baseFileName sourceMapPath, no, useWinPathSep}\n"
            fs.writeFile jsPath, js, (err) ->
                if err
                    printLine err.message
                    process.exit 1
                else if opts.compile and opts.watch
                    timeLog "compiled #{sourcePath}"
        if generatedSourceMap
            fs.writeFile sourceMapPath, generatedSourceMap, (err) ->
                if err
                    printLine "Could not write source map: #{err.message}"
                    process.exit 1
    fs.exists jsDir, (itExists) ->
        if itExists then compile() else mkdirp jsDir, compile

# Convenience for cleaner setTimeouts.
    
wait = (milliseconds, func) -> setTimeout func, milliseconds

# When watching scripts, it's useful to log changes with the timestamp.

timeLog = (message) ->
    console.log "#{(new Date).toLocaleTimeString()} - #{message}"

printTokens = (tokens) ->
    # strings = for token in tokens
        # tag = token[0]
        # value = token[1].toString().replace(/\n/, '\\n')
        # "[#{tag} #{value}]"
    # printLine strings.join(' ')
    for token in tokens
        tag   = token[0]
        value = token[1].toString().replace(/\n/, '\\n')
        if tag == 'TERMINATOR'
            print '\n'
        else if tag == 'INDENT'
            print 'IND '
        else if tag == 'OUTDENT'
            print 'OUT '
        else if tag in ['CLASS', 'PARAM_START', 'PARAM_END']
            print "#{tag} "
        else if tag is value
            print "#{tag} "
        else
            print "#{tag}=#{value} "

#  0000000   00000000   000000000  000   0000000   000   000   0000000  
# 000   000  000   000     000     000  000   000  0000  000  000       
# 000   000  00000000      000     000  000   000  000 0 000  0000000   
# 000   000  000           000     000  000   000  000  0000       000  
#  0000000   000           000     000   0000000   000   000  0000000   

parseOptions = ->
    optionParser = new optparse.OptionParser SWITCHES, BANNER
    o = opts     = optionParser.parse process.argv[2..]
    o.compile  or= !!o.output
    o.run        = not (o.compile or o.print or o.map)
    o.print      = !!(o.print or (o.eval or o.stdio and o.compile))

# The compile-time options to pass to the compiler.

compileOptions = (filename, base) ->
    answer = {
        filename
        bare: opts.bare
        header: opts.compile and not opts['no-header']
        sourceMap: opts.map
        inlineMap: opts['inline-map']
    }
    if filename
        if base
            cwd = process.cwd()
            jsPath = outputPath filename, base
            jsDir = path.dirname jsPath
            answer = helpers.merge answer, {
                jsPath
                sourceRoot: path.relative jsDir, cwd
                sourceFiles: [path.relative cwd, filename]
                generatedFile: helpers.baseFileName(jsPath, no, useWinPathSep)
            }
        else
            answer = helpers.merge answer,
                sourceRoot: ""
                sourceFiles: [helpers.baseFileName filename, no, useWinPathSep]
                generatedFile: helpers.baseFileName(filename, yes, useWinPathSep) + ".js"
    answer

# Start up a new Node.js instance with the arguments in `--nodejs` passed to the `node` binary, preserving the other options.

forkNode = ->
    nodeArgs = opts.nodejs.split /\s+/
    args     = process.argv[1..]
    args.splice args.indexOf('--nodejs'), 2
    p = spawn process.execPath, nodeArgs.concat(args),
        cwd:    process.cwd()
        env:    process.env
        stdio:  [0, 1, 2]
    p.on 'exit', (code) -> process.exit code

usage   = -> printLine optionParser.help() 
version = -> printLine "koffee version #{Koffee.VERSION}" 
    
