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
slash            = require 'kslash'
nopt             = require 'nopt'
helpers          = require './helpers'
Koffee           = require './koffee'
{ spawn, exec }  = require 'child_process'

useWinPathSep    = slash.sep is '\\'

helpers.colors()

{ FEATURES, logFeatures } = require './features'

{ baseFileName, isCoffee, stringify, merge, pad } = helpers

error     = console.error
print     = (line) -> process.stdout.write line
printLine = (line) -> process.stdout.write line + '\n' # ???
printWarn = (line) -> process.stderr.write line + '\n' # ???
hidden    = (file) -> /^\.|~$/.test file

SWITCHES = [
    ['-b' '--bare'              'compile without a top-level function wrapper'          Boolean        ]
    ['-c' '--compile'           'compile to JavaScript and save as .js files'           Boolean        ]
    ['-d' '--doc'               'log the ▸doc sections'                                 Boolean        ]
    ['-e' '--eval STRING'       'evaluate a string and print the result'               [String, Array] ]
    ['-f' '--features'          'list available features'                               Boolean        ]
    [''   '--no-`feature'       'disable a feature, e.g. --no-negative-index'           null           ]
    ['-h' '--help'              'display this help message'                             Boolean        ]
    ['-j' '--js'                'print the compiled JavaScript'                         Boolean        ]
    ['-m' '--map'               'generate source map and save as .js.map files'         Boolean        ]
    ['-M' '--inline-map'        'generate source map and include it directly in output' Boolean        ]
    [''   '--metalog'           'meta log (default: console.log)'                       String         ]
    ['-n' '--noop'              'does nothing, for debugging purposes'                  Boolean        ]
    ['-o' '--output DIR'        'set the output directory for compiled JavaScript'      String         ]
    ['-r' '--require MODULE'    'require the given module before eval or REPL'         [String, Array] ]
    ['-C' '--coffee'            'print the token stream as CoffeeScript'                Boolean        ]
    ['-s' '--stdio'             'listen for and compile scripts over stdio'             Boolean        ]
    ['-t' '--test'              'compile and run the @test code'                        Boolean        ]
    ['-T' '--tokens'            'print the tokens'                                      Boolean        ]
    ['-F' '--fragments'         'print the fragments'                                   Boolean        ]
    ['-P' '--parse'             'print the parse tree'                                  Boolean        ]
    ['-v' '--version'           'display the version number'                            Boolean        ]
    ['-w' '--watch'             'watch scripts for changes and rerun commands'          Boolean        ]
]

opts = {}

#  0000000   00000000   000000000  000   0000000   000   000   0000000  
# 000   000  000   000     000     000  000   000  0000  000  000       
# 000   000  00000000      000     000  000   000  000 0 000  0000000   
# 000   000  000           000     000  000   000  000  0000       000  
#  0000000   000           000     000   0000000   000   000  0000000   

parseOptions = ->

    known = Debug:Boolean
    short = D:'--Debug' p:'--js'
    SWITCHES.map (s) -> l = s[1].split(' ')[0][2..]; known[l] = s[3] if s[3]; short[s[0][1]] = "--#{l}" if s[0]!=''
    FEATURES.map (f) -> known[f.lag] = Boolean
    
    o = opts = nopt known, short
        
    o.compile  or= !!o.output
    o.arguments  = o.argv.remain
    o.prelude    = makePrelude o.require if o.require
    o.run        = not (o.compile or o.js or o.map or o.tokens or o.parse)
    o.js         = !!(o.js or o.eval or o.stdio and o.compile) # js output is passed to eval and stdio compile
    
    o.feature = {}
    FEATURES.map (f) -> o.feature[f.key] = o[f.flag] ? true; delete o[f.flag]
    
    if o.Debug
        delete o.argv
        log stringify o

# 00000000   000   000  000   000  
# 000   000  000   000  0000  000  
# 0000000    000   000  000 0 000  
# 000   000  000   000  000  0000  
# 000   000   0000000   000   000  

run = ->
    
    parseOptions()
    
    if opts.feature.color == false
        colorette.options.enabled = false
        
    return logFeatures()  if opts.features
    return usage()        if opts.help
    return version()      if opts.version
    return startRepl()    if opts.interactive
    return compileStdio() if opts.stdio
    if opts.eval
        for eval in opts.eval
            compileScript eval
        return
    return startRepl()    if not opts.arguments.length
    
    literals = if not opts.watch and not opts.compile then opts.arguments.splice 1 else []
    
    process.argv = process.argv[0..1].concat literals
    process.argv[0] = 'koffee'

    opts.output = slash.resolve opts.output if opts.output
    for source in opts.arguments
        source = slash.resolve source
        
        if opts.watch
            watchPath source
        else     
            compilePath source:source, topLevel:yes

exports.run = run
        
startRepl = ->
    
    # Make the REPL use the global context so as to 
    #   (a) be consistent with the `node` REPL and, therefore, 
    #   (b) make packages that modify native prototypes (such as 'colors' and 'sugar') work as expected.
    
    replCliOpts = useGlobal: yes
    replCliOpts.prelude = opts.prelude
    require('./repl').start replCliOpts

makePrelude = (requires) ->
    
    requires.map (module) ->
        [_, name, module] = match if match = module.match(/^(.*)=(.*)$/)
        name ||= baseFileName module, yes, useWinPathSep
        "#{name} = require('#{module}')"
    .join ';'

#  0000000   0000000   00     00  00000000   000  000      00000000  
# 000       000   000  000   000  000   000  000  000      000       
# 000       000   000  000000000  00000000   000  000      0000000   
# 000       000   000  000 0 000  000        000  000      000       
#  0000000   0000000   000   000  000        000  0000000  00000000  

# Compile a script or a directory. If a directory is passed, recursively compile all '.coffee' and '.koffee' files.

compilePath = (source:, topLevel:no) ->

    return if not topLevel and hidden source
              
    try
        stats = fs.statSync source
    catch err
        if err.code is 'ENOENT'
            error "Command.compilePath can't stat '#{source}'"
            process.exit 1
        throw err
        
    if stats.isDirectory()
        
        if slash.basename(source) in ['node_modules' '.git']
            return
            
        if opts.run
            compilePath source:findDirectoryIndex(source), topLevel:topLevel
            return
                 
        log 'Command.compilePath dir:', source if opts.Debug
        
        try
            files = fs.readdirSync source
        catch err
            if err.code is 'ENOENT' then return 
            throw err
            
        for file in files
            compilePath source:slash.join source, file
            
    else if topLevel or isCoffee source
        
        try
            code = fs.readFileSync source
        catch err
            if err.code is 'ENOENT' then return
            throw err
        
        log 'Command.compilePath file:', source if opts.Debug
            
        compileScript code.toString(), source
        
findDirectoryIndex = (source) ->

    for ext in Koffee.FILE_EXTENSIONS
        index = slash.join source, "index#{ext}"
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
# If evaluating the script directly sets `__filename`, `__dirname` and `module.filename` to be correct relative to the script's slash.

compileScript = (code, source=null) ->
    
    o = opts
    options = compileOptions source
    
    try
        t = task = {source, code, options}
        
        if o.tokens
            printTokens Koffee.tokens t.code, t.options
        else if o.fragments
            printFragments code, Koffee.fragments t.code, t.options
        else if o.coffee
            printRewriter Koffee.tokens t.code, t.options
        else if o.parse
            printLine Koffee.nodes(t.code, t.options).toString().trim()
        else if o.run
            Koffee.register()
            Koffee.eval opts.prelude, t.options if opts.prelude
            t.options.filename ?= options.source
            if opts.noop 
                log "noop run #{source}"
            else
                Koffee.run t.code, t.options
        else
            compiled = Koffee.compile t.code, t.options
            t.output = compiled
            if o.map
                t.output = compiled.js
                t.sourceMap = compiled.v3SourceMap

            if o.js
                if opts.noop then log "noop js #{source}"
                else 
                    printLine t.output.trim()
            else if o.compile or o.map
                if opts.noop then log "noop write #{options.jsPath}"
                else
                    writeJs t.source, t.output, options.jsPath, t.sourceMap
    catch err
        
        message = err.message
        
        if err instanceof SyntaxError
            printLine message
        else
            printLine err.stack
        
        if o.watch or o.eval
            print '\x07' # bell
        else
            process.exit 1

compileOptions = (source) -> # The compile-time options to pass to the compiler.
    
    copts = Object.assign {}, opts
    copts.sourceMap = opts.map
    copts.inlineMap = opts['inline-map']

    if source
        
        cwd = process.cwd()
        jsPath = outputPath source, '.js'
        jsDir = slash.dirname jsPath
        copts = merge copts, {
            jsPath
            source: source
            sourceRoot: slash.relative jsDir, cwd
            sourceFiles: [slash.relative cwd, source]
            generatedFile: baseFileName(jsPath, no, useWinPathSep)
        }
    copts
            
# Attach the appropriate listeners to compile scripts incoming over **stdin**, and write them back to **stdout**.

compileStdio = ->
    
    buffers = []
    stdin = process.openStdin()
    stdin.on 'data', (buffer) -> buffers.push buffer if buffer
    stdin.on 'end', -> compileScript Buffer.concat(buffers).toString()

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
    
    return if not isCoffee source
    
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
            watchPath slash.join source, file
        
        watcher = fs.watch source
        .on 'error', (err) ->
            throw err unless err.code is 'EPERM'
            watcher.close()
        .on 'change', (change, p) ->
            if change == 'rename'
                log 'Command.watchDir', change, slash.join source, p if opts.Debug
                watchPath slash.join source, p
            
    try
        startWatcher()
    catch err
        return if err.code is 'ENOENT'
        throw err

# Get the corresponding output JavaScript path for a source file.
    
outputPath = (source, extension) ->
    
    basename = baseFileName source, yes, useWinPathSep
    if opts.output
        dir = opts.output
    else
        dir = slash.dirname source
    slash.join dir, basename + extension

# Recursively mkdir, like `mkdir -p`.

mkdirp = (dir, fn) ->
    mode = 0o777 & ~process.umask()

    do mkdirs = (p = dir, fn) ->
        fs.exists p, (exists) ->
            if exists
                fn()
            else
                mkdirs slash.dirname(p), ->
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
    jsDir = slash.dirname jsPath
    compile = ->
        if opts.compile
            js = ' ' if js.length <= 0
            if generatedSourceMap then js = "#{js}\n//# sourceMappingURL=#{baseFileName sourceMapPath, no, useWinPathSep}\n"
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

    for index in [0...tokens.length]
        token  = tokens[index]
        tag    = token[0]
        value  = token[1].toString().replace(/\n/, '\\n')
        ctag   = gray tag
        cvalue = bold yellow value
        index  = gray dim index
        if tag == 'TERMINATOR'
            print '\n\n'
        else if tag == 'INDENT'
            print gray dim 'IND '
        else if tag == 'OUTDENT'
            print gray dim 'OUT '
        else if tag in ['CLASS' 'PARAM_START' 'PARAM_END' 'NULL']
            print "#{index}#{ctag} "
        else if tag == value
            print "#{index}#{cvalue} "
        else
            print "#{index}#{ctag}=#{cvalue} "

# 00000000  00000000    0000000    0000000   00     00  00000000  000   000  000000000   0000000  
# 000       000   000  000   000  000        000   000  000       0000  000     000     000       
# 000000    0000000    000000000  000  0000  000000000  0000000   000 0 000     000     0000000   
# 000       000   000  000   000  000   000  000 0 000  000       000  0000     000          000  
# 000       000   000  000   000   0000000   000   000  00000000  000   000     000     0000000   

printFragments = (code, fragments) ->

    log ''
    for index in [0...fragments.length]
        frag = fragments[index]
        line = blueBright ''+frag.locationData.first_line 
        if frag.locationData.last_line != frag.locationData.first_line 
            line += dim blue '-'+frag.locationData.last_line
        else line += '  '
        column = blue ''+frag.locationData.first_column 
        trimmed = frag.code.replace(/ /g, '')
        if trimmed.length
            if trimmed.replace(/\n/g, '').length == 0
                log ''
            else
                log line + ' ' + column + ' ' +  (dim gray helpers.pad frag.type, 20) + yellowBright(frag.code)
                    
    map = Koffee.compile code, 
            feature: header: true
            filename: 'fragments'
            sourceMap: yes
            # inlineMap: yes

    mapLineToString = (mapline, key='sourceLine') ->
        s = ''
        for column in mapline.columns
            if column
                s += column[key]%10
            else
                s += ' '
        s
            
    log gray dim ' 123456789 123456789 123456789 123456789 123456789'
    codeLines = code.split '\n'
    for i in [0...codeLines.length]
        if codeLines[i].trim().length
            log gray(dim i+1) + greenBright codeLines[i]
        else log ''
            
    log ''
    log gray dim ' 123456789 123456789 123456789 123456789 123456789'
    codeLines = map.js.split '\n'
    for i in [0...codeLines.length]
        if codeLines[i].trim().length
            log gray(dim i+1) + redBright codeLines[i]
        else log ''
            
    log gray dim ' 123456789 123456789 123456789 123456789 123456789'    
    for i in [0...map.sourceMap.lines.length]
        mapline = map.sourceMap.lines[i]
        if mapline
            log gray(dim i+1) + redBright mapLineToString mapline
        else log ''

    log gray dim ' 123456789 123456789 123456789 123456789 123456789'    
    for i in [0...map.sourceMap.lines.length]
        mapline = map.sourceMap.lines[i]
        if mapline
            log gray(dim i+1) + blueBright mapLineToString mapline, 'sourceColumn'
        else log ''
            
# 00000000   00000000  000   000  00000000   000  000000000  00000000  
# 000   000  000       000 0 000  000   000  000     000     000       
# 0000000    0000000   000000000  0000000    000     000     0000000   
# 000   000  000       000   000  000   000  000     000     000       
# 000   000  00000000  00     00  000   000  000     000     00000000  

printRewriter = (tokens) ->

    indent = 0
    for index in [0...tokens.length]
        token = tokens[index]
        tag   = token[0]
        value = token[1]
        
        grayDim = (s) -> dim gray s
        blueDim = (s) -> dim blue s
        yellowDim = (s) -> dim yellow s
        spaced = (color, v)->
            print color "#{v ? value}"
            print ' ' if token.spaced and tokens[index+1][0] not in ['CALL_START']

        # log token
        switch tag 
            when 'TERMINATOR'                        then print "\n#{pad '', indent}"
            when 'INDENT'                            then indent += 4; print "\n#{pad '', indent}"
            when 'OUTDENT'                           then indent -= 4; print "\n#{pad '', indent}"
            when 'HERECOMMENT'                       then spaced grayDim
            when 'CALL_START' 'CALL_END'             then spaced grayDim
            when 'UNARY'                             then spaced blueBright, 'not'
            when '&&'                                then spaced blueBright, 'and'
            when '||'                                then spaced blueBright, 'or'
            when 'STRING'                            then spaced green
            when 'STRING_START' 'STRING_END'         then spaced redBright
            when 'PROPERTY'                          then spaced yellow
            when ':'                                 then spaced yellowDim
            when '@' 
                if tokens[index+1][0] not in ['META_IF' 'META_ELSE' 'POST_META_IF'] then spaced(yellowDim) else spaced blueDim
            when 'META_IF' 'META_ELSE' 'POST_META_IF' then spaced blue, '▸'+value
            when 'NUMBER'                            then spaced blue
            when '{''}'                              then if not token.generated then spaced gray
            when '=' '+' '-' '++' '--' '...' '::' \
                 '[' ']' '{' '}' '.' 'MATH' 'UNARY_MATH' \
                 'INDEX_START' 'INDEX_END' \
                 'COMPARE' 'COMPOUND_ASSIGN'         then spaced gray
            when ',' '(' ')'                         then spaced grayDim
            when 'PARAM_START' 'PARAM_END' '->' '=>' then spaced (s) -> bold blue s
            when 'NULL' 'UNDEFINED' 'FUNC_EXIST' '?' '?.' 'BIN?' then spaced red
            when 'REGEX'                             then spaced magenta
            when 'FOR' 'FORIN' 'TRY' 'CATCH' 'THROW' 'RELATION' 'EXTENDS' 'STATEMENT' 'OWN' 'FOROF' 'LOOP' \
                 'IF' 'POST_IF' 'WHEN' 'THEN' 'ELSE' 'THIS' 'SUPER' 'SWITCH' 'LEADING_WHEN' 'WHILE' \
                 'BOOL' 'CLASS' 'RETURN'             then spaced blueBright
            when 'IDENTIFIER' 
                switch value
                    when 'require' then spaced gray
                    else spaced whiteBright
            else
                print ">#{tag}<"
                # spaced (s) -> bold blueBright s
                spaced cyan
            
version = -> printLine "#{Koffee.VERSION}"
usage   = -> 

    lines = ["#{gray 'Usage:'} #{yellow 'koffee'} #{gray '[options]'} path/to/script #{gray '[options]'}\n"]
    
    rules = SWITCHES.map (rule) ->
        [short, long, description] = rule
        longFlag = long.match(/^(--\w[\w\-]*)/)[1]
        cshort   = if short then gray(short[0]) + bold(gray(short[1..])) + '  ' else '    '
        clong    = pad long, 20
        clong    = gray(clong[0..1]) + bold(white(clong[2..].split(' ')[0])) + ' ' + bold(blueBright(clong[2..].split(' ')[1..].join(' ')))
        lines.push '    ' + cshort + clong + gray description
        
    lines.push gray '\nIf called without a script, the interactive REPL will be started'
        
    log "\n#{ lines.join('\n') }\n"
        