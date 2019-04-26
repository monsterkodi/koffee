fs      = require 'fs'
os      = require 'os'
path    = require 'path'
_       = require 'underscore'
childp  = require 'child_process'
Koffee  = require './lib/koffee'
helpers = require './lib/helpers'

reset = '\x1B[0m'
bold  = '\x1B[0;1m'
log   = console.log
cLog  = (color,args) -> console.log.apply console.log, [color].concat [].slice.call(args,0), [reset]
    
yellow = -> cLog '\x1B[0;93m', arguments
red    = -> cLog '\x1B[0;31m', arguments
green  = -> cLog '\x1B[0;32m', arguments
blue   = -> cLog '\x1B[0;94m', arguments
white  = -> cLog '\x1B[0;37m', arguments
gray   = -> cLog '\x1B[0;90m', arguments

node = (args, output='stderr', callback) ->
    
    relayOutput = (buffer) -> process.stdout.write buffer.toString()
    proc = childp.spawn 'node', args, cwd:process.cwd()
    proc.stdout.on 'data', relayOutput if output is 'both' or output is 'stdout'
    proc.stderr.on 'data', relayOutput if output is 'both' or output is 'stderr'
    proc.on 'exit', (status) -> callback(status) if typeof callback is 'function'

run = (args, callback) ->
    
    node ['bin/koffee'].concat(args), 'stderr', (status) ->
        process.exit(1) if status isnt 0
        callback() if typeof callback is 'function'

buildParser = ->
    
    blue 'parser'
    helpers.extend global, require 'util'
    require 'jison'
    parser = require('./lib/grammar').parser.generate()
    fs.writeFileSync 'lib/parser.js', parser

buildCompiler = (callback) ->
    
    blue 'compiler' 
    files = fs.readdirSync 'src'
    files = ('src/' + file for file in files when file.match(/\.coffee$/))
    run ['-c', '-o', 'lib'].concat(files), callback

build = (callback) ->
    
    buildParser()
    buildCompiler callback

libPath = './lib'    
libDir  = path.dirname(require.resolve libPath) + '/'
    
#  0000000   000   000  0000000    000000000  00000000   0000000  000000000  
# 000   000  0000  000  000   000     000     000       000          000     
# 000000000  000 0 000  000   000     000     0000000   0000000      000     
# 000   000  000  0000  000   000     000     000            000     000     
# 000   000  000   000  0000000       000     00000000  0000000      000     

andTest = (testsets=['koffee', 'coffee'], doExit=true) =>
    
    for mod of require.cache when libDir is mod[0 ... libDir.length]
        delete require.cache[mod]

    results = runTests testsets
    process.exit results if doExit

buildAndTest = (parser=yes) ->
    
    childp.execSync 'git checkout lib/*', stdio:'pipe'

    node ['bin/kake', parser and 'build' or 'compiler'], 'both', ->
        node ['bin/kake', 'test'], 'both'

task 'all',      'build twice, run the tests',      -> build -> build andTest
task 'build',    'build the compiler and parser',   build
task 'parser',   'build the parser',                buildParser
task 'compiler', 'build the compiler',              buildCompiler

# 000   000   0000000   000000000   0000000  000   000  
# 000 0 000  000   000     000     000       000   000  
# 000000000  000000000     000     000       000000000  
# 000   000  000   000     000     000       000   000  
# 00     00  000   000     000      0000000  000   000  

task 'watch', 'rebuild and/or test on file changes', -> 
    
    blue 'watching ...'
    fs.watch 'src/', interval: 200, (eventType, filename) ->
        if eventType is 'change'
            blue "src/#{filename} changed"
            buildAndTest filename is 'grammar.coffee'
    fs.watch 'test/coffee/', {interval: 200, recursive: yes}, (eventType, filename) ->
        if eventType is 'change'
            yellow "test/coffee/#{filename} changed"
            andTest ['coffee'], false
    fs.watch 'test/koffee', {interval: 200, recursive: no}, (eventType, filename) ->
        if eventType is 'change'
            yellow "test/koffee/#{filename} changed"
            andTest ['koffee'], false

# 0000000    00000000  000   000   0000000  000   000  
# 000   000  000       0000  000  000       000   000  
# 0000000    0000000   000 0 000  000       000000000  
# 000   000  000       000  0000  000       000   000  
# 0000000    00000000  000   000   0000000  000   000  

task 'bench', 'benchmark of compilation time', ->
    
    {Rewriter} = require './lib/rewriter'
    sources = ['koffee', 'grammar', 'helpers', 'lexer', 'nodes', 'rewriter', 'scope']
    coffee  = sources.map((name) -> fs.readFileSync "src/#{name}.coffee").join '\n'
    fmt     = (ms) -> " #{bold}#{ "     #{ms}".slice -4 }#{reset} ms"
    total   = 0
    now     = Date.now()
    time    = -> total += ms = -(now - now = Date.now()); fmt ms
    tokens  = Koffee.tokens coffee, rewrite: no
    gray "Lex    #{time()} (#{tokens.length} tokens)"
    tokens  = new Rewriter().rewrite tokens
    gray "Rewrite#{time()} (#{tokens.length} tokens)"
    nodes   = Koffee.nodes tokens
    gray "Parse  #{time()}"
    js      = nodes.compile bare: yes
    gray "Compile#{time()} (#{js.length} chars)"
    white "Total  #{ fmt total }"

# 000000000  00000000   0000000  000000000   0000000  
#    000     000       000          000     000       
#    000     0000000   0000000      000     0000000   
#    000     000            000     000          000  
#    000     00000000  0000000      000     0000000   

runTests = (testsets) ->
    
    startTime   = Date.now()
    currentFile = null
    passedTests = 0
    failures    = []

    global[name] = func for name, func of require 'assert'
        
    global.Koffee = require libDir + 'koffee'
    global.Repl   = require libDir + 'repl'
    
    global.Koffee.register()

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

    helpers.extend global, require libDir + '../test/support/helpers'

    files = []
    for testset in testsets
        files = files.concat fs.readdirSync("test/#{testset}").map (f) -> [testset, f]
        
    red "#{files.length} test files ..."
        
    for [testset,file] in files when helpers.isCoffee file
        
        currentFile = filename = path.join 'test', testset, file
        code = fs.readFileSync filename
        try
            Koffee.run code.toString(), {filename}
            # green path.basename(file,'.coffee')
        catch error
            failures.push {filename, error}
            
        # collect and print errors.
        if failures.length
            red path.basename(filename, '.coffee')
            for fail in failures
                {error, filename, description, source} = fail
                white ''
                green  "    #{description}" if description
                yellow "    #{error.message}"
                gray   "    #{filename}"
                white  "    #{source}" if source
        failures = []
            
        
    time = ((Date.now() - startTime) / 1000).toFixed(2)
    message = "passed #{passedTests} tests in #{time} seconds"
    if not failures.length 
        green message
    else
        red "failed #{failures.length} and #{message}"
    
    return !failures.length

task 'test',   'run the tests',    -> process.exit runTests ['koffee', 'coffee']
task 'coffee', 'run coffee tests', -> process.exit runTests ['coffee']
task 'koffee', 'run koffee tests', -> process.exit runTests ['koffee']



