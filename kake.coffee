fs      = require 'fs'
os      = require 'os'
path    = require 'path'
noon    = require 'noon'
_       = require 'underscore'
childp  = require 'child_process'
Koffee  = require './js/koffee'
helpers = require './js/helpers'

{ white, green, red, blueBright, yellow, gray, bold } = require 'colorette'

# 000   000   0000000   0000000    00000000  
# 0000  000  000   000  000   000  000       
# 000 0 000  000   000  000   000  0000000   
# 000  0000  000   000  000   000  000       
# 000   000   0000000   0000000    00000000  

node = (args, output='stderr', callback) ->
    
    proc = childp.spawn 'node', args, cwd:process.cwd(), stdio:'inherit'
    proc.on 'exit', (status) -> callback(status) if typeof callback is 'function'

run = (args, callback) ->
    node ['bin/koffee'].concat(args), 'both', (status) ->
        process.exit(1) if status != 0
        callback() if typeof callback is 'function'

# 0000000    000   000  000  000      0000000    
# 000   000  000   000  000  000      000   000  
# 0000000    000   000  000  000      000   000  
# 000   000  000   000  000  000      000   000  
# 0000000     0000000   000  0000000  0000000    

buildParser = ->
    
    log blueBright 'parser'
    helpers.extend global, require 'util'
    require 'jison'
    parser = require('./js/grammar').parser.generate()
    fs.writeFileSync 'js/parser.js', parser

buildCompiler = (callback) ->
    
    log blueBright 'compiler' 
    files = fs.readdirSync 'coffee'
    files = ('coffee/' + file for file in files when file.match(/\.[ck]offee$/))
    run ['-co' 'js'].concat(files), callback
    
build = (callback) ->
    
    buildParser()
    buildCompiler callback
    
#  0000000   000   000  0000000    000000000  00000000   0000000  000000000  
# 000   000  0000  000  000   000     000     000       000          000     
# 000000000  000 0 000  000   000     000     0000000   0000000      000     
# 000   000  000  0000  000   000     000     000            000     000     
# 000   000  000   000  0000000       000     00000000  0000000      000     

libDir = path.dirname(require.resolve './js') + '/'

buildAndTest = (parser=yes) ->
    
    try
        childp.execSync 'git checkout js/*', stdio:'pipe'
    catch err
        error err.message

    node ['bin/kake', parser and 'build' or 'compiler'], 'both', ->
        node ['bin/kake', 'test'], 'both'

spawnTest = (testset) ->
    
    node ['bin/kake', testset], 'both'
        
task 'all',      'build twice, run the tests',    -> build -> build -> node ['bin/kake' 'test'], 'both'
task 'build',    'build the compiler and parser', build
task 'parser',   'build the parser',              buildParser
task 'compiler', 'build the compiler',            buildCompiler

# 000   000   0000000   000000000   0000000  000   000  
# 000 0 000  000   000     000     000       000   000  
# 000000000  000000000     000     000       000000000  
# 000   000  000   000     000     000       000   000  
# 00     00  000   000     000      0000000  000   000  

task 'watch', 'rebuild and/or test on file changes', -> 
    
    watch = (filename, cb) ->
        
        fs.watch filename, {interval: 200, recursive:yes}, (event, file) ->
            if event is 'change' then cb event, file
    
    log blueBright 'watching ...'
    watch 'coffee/', (event,file) ->
        log blueBright "coffee/#{file} changed"
        buildAndTest file is 'grammar.coffee'
            
    watch 'test/coffee/', (event,file) ->
        log yellow "test/coffee/#{file} changed"
        spawnTest 'coffee'
            
    watch 'test/koffee', (event,file) ->
        log yellow "test/koffee/#{file} changed"
        spawnTest 'koffee'
  
    watch 'kake.coffee', ->
        log blueBright "kake.coffee changed!"
        childp.execSync 'bin/kake watch', stdio: 'inherit', shell: true, cwd:process.cwd()
        process.exit 0
            
    process.on 'exit', -> log 'exit:', process.pid
            
# 0000000    00000000  000   000   0000000  000   000  
# 000   000  000       0000  000  000       000   000  
# 0000000    0000000   000 0 000  000       000000000  
# 000   000  000       000  0000  000       000   000  
# 0000000    00000000  000   000   0000000  000   000  

task 'bench', 'benchmark of compilation time', ->
    
    @if @profile
        Rewriter  = require './js/rewriter'
        sources   = ['koffee' 'grammar' 'helpers' 'lexer' 'nodes' 'rewriter' 'scope']
        coffee    = sources.map((name) -> fs.readFileSync "coffee/#{name}.coffee").join '\n'
        fmt       = (ms) -> " #{bold "     #{ms}".slice -4 } ms"
        total     = 0
        now       = Date.now()
        time      = -> total += ms = -(now - now = Date.now()); fmt ms
        tokens    = Koffee.tokens coffee, feature: rewrite: no
        log gray  "Lex    #{time()} (#{tokens.length} tokens)"
        tokens    = new Rewriter().rewrite tokens
        log gray  "Rewrite#{time()} (#{tokens.length} tokens)"
        nodes     = Koffee.nodes tokens
        log gray  "Parse  #{time()}"
        js        = nodes.compile bare: yes
        log gray  "Compile#{time()} (#{js.length} chars)"
        log white "Total  #{ fmt total }"

# 000000000  00000000   0000000  000000000   0000000  
#    000     000       000          000     000       
#    000     0000000   0000000      000     0000000   
#    000     000            000     000          000  
#    000     00000000  0000000      000     0000000   

runTests = (testsets) ->
    
    startTime     = Date.now()
    currentFile   = null
    failures      = []
    passedTests   = 0
    failedTests   = 0

    global.test   = (description, fn) ->
        try
            fn.test = {description, currentFile}
            fn.call(fn)
            ++passedTests
        catch err
            ++failedTests
            failures.push
                filename:    currentFile
                error:       err
                description: description if description?
                source:      fn.toString() if fn.toString?

    helpers.initTest()
                
    files = []
    for testset in testsets
        files = files.concat fs.readdirSync("test/#{testset}").map (f) -> [testset, f]
        
    log green "#{files.length} test files ..."
        
    for [testset,file] in files when helpers.isCoffee file
        
        currentFile = filename = path.join 'test', testset, file
        code = fs.readFileSync filename
        try
            Koffee.run code.toString(), {filename}
        catch err
            failures.push {filename, err}
            
        if failures.length
            log red path.basename(filename, '.coffee')
            for fail in failures
                {error, filename, description, source} = fail
                log white ''
                log green  "    #{description}" if description
                log yellow "    #{error?.message}"
                log gray   "    #{filename}"
                if source
                    log white  "    #{source}" 
                else
                    log red    "    #{error}"
        failures = []
            
    time = ((Date.now() - startTime) / 1000).toFixed(2)
    message = green "#{passedTests} passed tests in #{time} seconds"
    if not failedTests
        log message
    else
        log red "#{failedTests} failed and #{message}"
    
    return failedTests

task 'test',   'run the tests',    -> process.exit runTests ['koffee' 'coffee']
task 'coffee', 'run coffee tests', -> process.exit runTests ['coffee']
task 'koffee', 'run koffee tests', -> process.exit runTests ['koffee']



