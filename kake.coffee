fs      = require 'fs'
os      = require 'os'
path    = require 'path'
_       = require 'underscore'
Koffee  = require './lib/koffee'
helpers = require './lib/helpers'
{ spawn, exec, execSync } = require 'child_process'

bold = red = green = reset = ''
unless process.env.NODE_DISABLE_COLORS
    bold  = '\x1B[0;1m'
    red   = '\x1B[0;31m'
    green = '\x1B[0;32m'
    reset = '\x1B[0m'

log = (message, color, explanation) -> console.log color + message + reset + ' ' + (explanation or '')

spawnNodeProcess = (args, output='stderr', callback) ->
    
    relayOutput = (buffer) -> process.stdout.write buffer.toString()
    proc = spawn 'node', args
    proc.stdout.on 'data', relayOutput if output is 'both' or output is 'stdout'
    proc.stderr.on 'data', relayOutput if output is 'both' or output is 'stderr'
    proc.on 'exit', (status) -> callback(status) if typeof callback is 'function'

run = (args, callback) ->
    
    spawnNodeProcess ['bin/koffee'].concat(args), 'stderr', (status) ->
        process.exit(1) if status isnt 0
        callback() if typeof callback is 'function'

buildParser = ->
    
    log 'parser', red 
    helpers.extend global, require 'util'
    require 'jison'
    parser = require('./lib/grammar').parser.generate()
    fs.writeFileSync 'lib/parser.js', parser

buildCompiler = (callback) ->
    
    log 'compiler', red 
    files = fs.readdirSync 'src'
    files = ('src/' + file for file in files when file.match(/\.coffee$/))
    run ['-c', '-o', 'lib'].concat(files), callback

build = (callback) ->
    
    buildParser()
    buildCompiler callback

andTest = ->
    
    csPath = './lib'
    csDir = path.dirname require.resolve csPath

    for mod of require.cache when csDir is mod[0 ... csDir.length]
        delete require.cache[mod]

    testResults = runTests ['koffee', 'coffee'], require csPath
    process.exit testResults

buildAndTest = (includingParser = yes) ->
    
    process.stdout.write '\x1Bc' # Clear terminal screen.
    execSync 'git checkout lib/*', stdio: [0,1,2] # Reset the generated compiler.

    buildArgs = ['bin/kake', if includingParser then 'build' else 'compiler']
    spawnNodeProcess buildArgs, 'both', ->
        spawnNodeProcess ['bin/kake', 'test'], 'both'

task 'all', 'build twice, run the tests', -> build -> build andTest

task 'build', 'build the compiler and parser', build

task 'parser', 'build the parser', buildParser

task 'compiler', 'build the compiler', buildCompiler

task 'watch', 'rebuild and test on file changes', -> 
    
    buildAndTest()
    fs.watch 'src/', interval: 200, (eventType, filename) ->
        if eventType is 'change'
            console.log "src/#{filename} changed"
            buildAndTest filename is 'grammar.coffee'
    fs.watch 'test/', {interval: 200, recursive: yes}, (eventType, filename) ->
        if eventType is 'change'
            console.log "test/#{filename} changed"
            buildAndTest no

task 'bench', 'benchmark of compilation time', ->
    
    {Rewriter} = require './lib/rewriter'
    sources = ['koffee', 'grammar', 'helpers', 'lexer', 'nodes', 'rewriter', 'scope']
    coffee  = sources.map((name) -> fs.readFileSync "src/#{name}.coffee").join '\n'
    fmt      = (ms) -> " #{bold}#{ "     #{ms}".slice -4 }#{reset} ms"
    total    = 0
    now      = Date.now()
    time     = -> total += ms = -(now - now = Date.now()); fmt ms
    tokens = Koffee.tokens coffee, rewrite: no
    console.log "Lex    #{time()} (#{tokens.length} tokens)"
    tokens = new Rewriter().rewrite tokens
    console.log "Rewrite#{time()} (#{tokens.length} tokens)"
    nodes    = Koffee.nodes tokens
    console.log "Parse  #{time()}"
    js       = nodes.compile bare: yes
    console.log "Compile#{time()} (#{js.length} chars)"
    console.log "total  #{ fmt total }"

runTests = (testsets, koffee=Koffee) ->
    
    Koffee.register()
    startTime   = Date.now()
    currentFile = null
    passedTests = 0
    failures    = []

    global[name] = func for name, func of require 'assert'

    global.Koffee = koffee
    global.Repl = require './lib/repl'

    global.test = (description, fn) ->
        try
            fn.test = {description, currentFile}
            fn.call(fn)
            ++passedTests
        catch e
            failures.push
                filename: currentFile
                error: e
                description: description if description?
                source: fn.toString() if fn.toString?

    helpers.extend global, require './test/support/helpers'

    # When all the tests have run, collect and print errors.
    # If a stacktrace is available, output the compiled function source.
    process.on 'exit', ->
        time = ((Date.now() - startTime) / 1000).toFixed(2)
        message = "passed #{passedTests} tests in #{time} seconds#{reset}"
        return log(message, green) unless failures.length
        log "failed #{failures.length} and #{message}", red
        for fail in failures
            {error, filename, description, source}  = fail
            console.log ''
            log "    #{description}", red if description
            log "    #{error.stack}", red
            console.log "    #{source}" if source
        return

    # Run every test in the `test` folder
    files = []
    for testset in testsets
        files = files.concat fs.readdirSync("test/#{testset}").map (f) -> [testset, f]
    log "#{files.length} tests ...", red
        
    for [testset,file] in files when helpers.isCoffee file
        
        currentFile = filename = path.join 'test', testset, file
        code = fs.readFileSync filename
        try
            Koffee.run code.toString(), {filename}
            log path.basename(file,'.coffee'), green
        catch error
            log path.basename(file,'.coffee'), red
            failures.push {filename, error}
            
    log "... failures: #{failures.length}", red
    return !failures.length

task 'test',   'run the tests',    -> process.exit runTests ['koffee', 'coffee']
task 'coffee', 'run coffee tests', -> process.exit runTests ['coffee']
task 'koffee', 'run koffee tests', -> process.exit runTests ['koffee']



