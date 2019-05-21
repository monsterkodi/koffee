###
000   000   0000000   00000000  00000000  00000000  00000000  
000  000   000   000  000       000       000       000       
0000000    000   000  000000    000000    0000000   0000000   
000  000   000   000  000       000       000       000       
000   000   0000000   000       000       00000000  00000000  
###

# This module contains the main entry functions for tokenizing, parsing, and compiling koffee into JavaScript.

fs        = require 'fs'
vm        = require 'vm'
path      = require 'path'
{Lexer}   = require './lexer'
{parser}  = require './parser'
helpers   = require './helpers'
SourceMap = require './sourcemap'
pkg       = require '../package.json'

{ injectMeta } = require './meta'
{ injectFeature, hasFeature } = require './features'
{ updateSyntaxError, throwSyntaxError, isCoffee, count, stringify } = helpers

FILE_EXTENSIONS = ['.coffee' '.koffee']

base64encode = (src) ->
    
    if typeof Buffer is 'function'
        Buffer.from(src).toString('base64')
    else if typeof btoa is 'function'
        # The contents of a `<script>` block are encoded via UTF-16, so if any extended
        # characters are used in the block, btoa will fail as it maxes out at UTF-8.
        # See https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#The_Unicode_Problem
        # for the gory details, and for the solution implemented here.
        btoa encodeURIComponent(src).replace /%([0-9A-F]{2})/g, (match, p1) ->
            String.fromCharCode '0x' + p1
    else
        throw new Error('Unable to base64 encode inline sourcemap.')

lexer = new Lexer # Instantiate a Lexer for our use here.
            
# For each compiled file, save its source in memory in case we need to
# recompile it later. We might need to recompile if the first compilation
# didn’t create a source map (faster) but something went wrong and we need
# a stack trace. Assuming that most of the time, code isn’t throwing
# exceptions, it’s probably more efficient to compile twice only when we
# need a stack trace, rather than always generating a source map even when
# it’s not likely to be used. Save in form of `filename`: `(source)`

sources = {}

# Also save source maps if generated, in form of `filename`: `(source map)`.

sourceMaps = {}

#  0000000   0000000   00     00  00000000   000  000      00000000  
# 000       000   000  000   000  000   000  000  000      000       
# 000       000   000  000000000  00000000   000  000      0000000   
# 000       000   000  000 0 000  000        000  000      000       
#  0000000   0000000   000   000  000        000  0000000  00000000  

# Compile koffee to JavaScript, using the Jison compiler.
#
# If `options.sourceMap` is specified, then `options.filename` must also be specified. 
# All options that can be passed to `SourceMap#generate` may also be passed here.
#
# This returns a javascript string, unless `options.sourceMap` is passed, in which case it returns a `{js, v3SourceMap, sourceMap}` object

compile = (code, options) ->
    
    { merge, extend } = helpers
    
    options = injectFeature options
    options = injectMeta    options
        
    # Always generate a source map if no filename is passed in, since without a
    # a filename we have no way to retrieve this source later in the event that
    # we need to recompile it to get a source map for `prepareStackTrace`.
        
    generateSourceMap = options.sourceMap or options.inlineMap or not options.filename?
    filename = options.filename or ''

    sources[filename ? '?'] = code
    map = new SourceMap if generateSourceMap

    tokens = lexer.tokenize code, options

    # Pass a list of referenced variables, so that generated variables won't get the same name.
    
    options.referencedVars = ( token[1] for token in tokens when token[0] is 'IDENTIFIER' )

    # Check for import or export; if found, force bare mode.
        
    if not options.bare
        for token in tokens
            if token[0] in ['IMPORT' 'EXPORT']
                options.bare = yes
                break

    fragments = parser.parse(tokens).compileToFragments options

    currentLine = 0
    currentLine += 1 if hasFeature options, 'header'
    currentColumn = 0
    js = ""
    
    # log 'fragments', stringify fragments
    
    for fragment in fragments
        # Update the sourcemap with data from each fragment.
        if generateSourceMap
            # Do not include empty, whitespace, or semicolon-only fragments.
            if fragment.locationData and not /^[;\s]*$/.test fragment.code
                map.add(
                    [fragment.locationData.first_line, fragment.locationData.first_column]
                    [currentLine, currentColumn]
                    {noReplace: true})
            if not fragment.code?
                log 'generateSourceMap', stringify fragment
            newLines = count fragment.code, "\n"
            currentLine += newLines
            if newLines
                currentColumn = fragment.code.length - (fragment.code.lastIndexOf("\n") + 1)
            else
                currentColumn += fragment.code.length

        # Copy the code from each fragment into the final JavaScript.
        js += fragment.code

    if hasFeature options, 'header'
        header = "koffee #{@VERSION}"
        js = "// #{header}\n#{js}"

    if generateSourceMap
        v3SourceMap = map.generate(options, code)
        sourceMaps[filename ? '?'] = map

    if options.inlineMap
        encoded = base64encode JSON.stringify v3SourceMap
        sourceMapDataURI = "//# sourceMappingURL=data:application/json;base64,#{encoded}"
        sourceURL = "//# sourceURL=#{options.filename ? 'koffee'}"
        js = "#{js}\n#{sourceMapDataURI}\n#{sourceURL}"

    if options.sourceMap
        {
            js
            sourceMap: map
            v3SourceMap: JSON.stringify v3SourceMap, null, 2
        }
    else
        js
                
# 000   000   0000000   0000000    00000000   0000000  
# 0000  000  000   000  000   000  000       000       
# 000 0 000  000   000  000   000  0000000   0000000   
# 000  0000  000   000  000   000  000            000  
# 000   000   0000000   0000000    00000000  0000000   

# Parse a string of Koffee code or an array of lexed tokens, and return the AST. 
# You can then compile it by calling `.compile()` on the root, or traverse it by using `.traverseChildren()` with a callback.

nodes = (code, options) ->
    
    if typeof code is 'string'
        parser.parse lexer.tokenize code, options
    else
        parser.parse code
    
# 000000000   0000000   000   000  00000000  000   000   0000000  
#    000     000   000  000  000   000       0000  000  000       
#    000     000   000  0000000    0000000   000 0 000  0000000   
#    000     000   000  000  000   000       000  0000       000  
#    000      0000000   000   000  00000000  000   000  0000000   

tokens = (code, options) ->
    
    try
        lexer.tokenize code, options
    catch err
        if err instanceof SyntaxError
            updateSyntaxError err, code, options.source ? options.filename ? '', options
        throw err
        
# 00000000   000   000  000   000  
# 000   000  000   000  0000  000  
# 0000000    000   000  000 0 000  
# 000   000  000   000  000  0000  
# 000   000   0000000   000   000  

# Compile and execute a string of koffee

run = (code, options={}) ->
    
    options = injectFeature options
    options = injectMeta    options
    
    mainModule = require.main

    # Set the filename
    
    mainModule.filename = process.argv[1] =
        if options.filename then fs.realpathSync(options.filename) else ''

    mainModule.moduleCache and= {} # Clear the module cache.

    # Assign paths for node_modules loading
        
    dir = if options.filename?
        path.dirname fs.realpathSync options.filename
    else
        fs.realpathSync '.'
        
    mainModule.paths = require('module')._nodeModulePaths dir

    if not isCoffee(mainModule.filename) or require.extensions
        try
            answer = compile code, options
        catch err
            # log 'koffee.run compile error', options.filename, mainModule.filename, err
            updateSyntaxError err, code, mainModule.filename, options
            throw err
        
        code = answer.js ? answer

    # log 'Koffee.run mainModule._compile', mainModule.filename, options if options.Debug
        
    mainModule._compile code, mainModule.filename

# 00000000  000   000   0000000   000      000   000   0000000   000000000  00000000  
# 000       000   000  000   000  000      000   000  000   000     000     000       
# 0000000    000 000   000000000  000      000   000  000000000     000     0000000   
# 000          000     000   000  000      000   000  000   000     000     000       
# 00000000      0      000   000  0000000   0000000   000   000     000     00000000  

# Compile and evaluate a string in a Node.js-like environment. The REPL uses this to run the input.

evaluate = (code, options={}) -> # exported as eval
    
    return unless code = code.trim()
    
    createContext = vm.createContext

    isContext = vm.isContext ? (ctx) ->
        options.sandbox instanceof createContext().constructor

    if createContext
        if options.sandbox?
            if isContext options.sandbox
                sandbox = options.sandbox
            else
                sandbox = createContext()
                sandbox[k] = v for own k, v of options.sandbox
            sandbox.global = sandbox.root = sandbox.GLOBAL = sandbox
        else
            sandbox = global
        sandbox.__filename = options.filename || 'eval'
        sandbox.__dirname  = path.dirname sandbox.__filename
        # define module/require only if they chose not to specify their own
        unless sandbox != global or sandbox.module or sandbox.require
            Module = require 'module'
            sandbox.module  = _module  = new Module(options.modulename || 'eval')
            sandbox.require = _require = (path) ->  Module._load path, _module, true
            _module.filename = sandbox.__filename
            for r in Object.getOwnPropertyNames require when r not in ['paths' 'arguments' 'caller']
                _require[r] = require[r]
            # use the same hack node currently uses for their own REPL
            _require.paths = _module.paths = Module._nodeModulePaths process.cwd()
            _require.resolve = (request) -> Module._resolveFilename request, _module
    o = {}
    o[k] = v for own k, v of options
    o.bare = yes # ensure return value
    js = compile code, o
    if sandbox is global
        vm.runInThisContext js
    else
        vm.runInContext js, sandbox

# 000      00000000  000   000  00000000  00000000   
# 000      000        000 000   000       000   000  
# 000      0000000     00000    0000000   0000000    
# 000      000        000 000   000       000   000  
# 0000000  00000000  000   000  00000000  000   000  

# The real Lexer produces a generic stream of tokens. 
# This object provides a thin wrapper around it, compatible with the Jison API. 
# We can then pass it directly as a "Jison lexer".

parser.lexer =
    
    lex: ->
        token = parser.tokens[@pos++]
        if token
            [tag, @yytext, @yylloc] = token
            parser.errorToken = token.origin or token
            ▸assert "@yylloc?.first_line?" @yylloc?.first_line?
            @yylineno = @yylloc.first_line
        else
            tag = ''
        tag
        
    setInput: (tokens) ->
        parser.tokens = tokens
        @pos = 0
        
    upcomingInput: -> ""
        
parser.yy = require './nodes' # Make all the AST nodes visible to the parser.

parser.yy.parseError = (message, {token}) -> # Override Jison's default error handling function.
    
    # Disregard Jison's message, it contains redundant line number information.
    # Disregard the token, we take its value directly from the lexer in case
    # the error is caused by a generated token which might refer to its origin.
    
    {errorToken, tokens} = parser
    [errorTag, errorText, errorLoc] = errorToken

    errorText = switch
        when errorToken is tokens[tokens.length - 1]
            'end of input'
        when errorTag in ['INDENT' 'OUTDENT']
            'indentation'
        when errorTag in ['IDENTIFIER' 'NUMBER' 'INFINITY' 'STRING' 'STRING_START' 'REGEX' 'REGEX_START']
            errorTag.replace(/_START$/, '').toLowerCase()
        else
            switch errorText # name whitespace character
                when ' '  then 'space'
                when '\n' then 'newline'
                when '\r' then 'carriage return'
                when '\t' then 'tab'
                else errorText
            
    # The second argument has a `loc` property, which should have the location data for this token. 
    # Unfortunately, Jison seems to send an outdated `loc` (from the previous token), 
    # so we take the location information directly from the lexer.
    
    throwSyntaxError module:'koffee', message:"unexpected #{errorText}", location:errorLoc

#  0000000   0000000   000   000  00000000    0000000  00000000  00     00   0000000   00000000   
# 000       000   000  000   000  000   000  000       000       000   000  000   000  000   000  
# 0000000   000   000  000   000  0000000    000       0000000   000000000  000000000  00000000   
#      000  000   000  000   000  000   000  000       000       000 0 000  000   000  000        
# 0000000    0000000    0000000   000   000   0000000  00000000  000   000  000   000  000        

getSourceMap = (filename) ->
     
    # Koffee compiled in a browser may get compiled with `options.filename` of `<anonymous>`, 
    # but the browser may request the stack trace with the filename of the script file.
    
    if sourceMaps[filename]?
        sourceMaps[filename]
    else if sourceMaps['?']?
        sourceMaps['?']
    else if sources[filename ? '?']?
        answer = compile sources[filename ? '?'],
            filename: filename
            sourceMap: yes
        answer.sourceMap
    else
        null

#  0000000  000000000   0000000    0000000  000   000  000000000  00000000    0000000    0000000  00000000  
# 000          000     000   000  000       000  000      000     000   000  000   000  000       000       
# 0000000      000     000000000  000       0000000       000     0000000    000000000  000       0000000   
#      000     000     000   000  000       000  000      000     000   000  000   000  000       000       
# 0000000      000     000   000   0000000  000   000     000     000   000  000   000   0000000  00000000  

# Based on [michaelficarra/KoffeeRedux](http://goo.gl/ZTx1p)
# NodeJS / V8 have no support for transforming positions in stack traces using
# sourceMap, so we must monkey-patch Error to display Koffee source positions.

Error.prepareStackTrace = (err, stack) ->
     
    getSourceMapping = (filename, line, column) ->
        sourceMap = getSourceMap filename
        answer = sourceMap.sourceLocation [line - 1, column - 1] if sourceMap?
        if answer? then [answer[0] + 1, answer[1] + 1] else null

    frames = for frame in stack
        break if frame.getFunction() is exports.run
        "        at #{formatSourcePosition frame, getSourceMapping}"

    "#{err.toString()}\n#{frames.join '\n'}\n"
    
# Based on http://v8.googlecode.com/svn/branches/bleeding_edge/src/messages.js
# Modified to handle sourceMap

formatSourcePosition = (frame, getSourceMapping) ->
     
    filename = undefined
    fileLocation = ''

    if frame.isNative()
        fileLocation = "native"
    else
        if frame.isEval()
            filename = frame.getScriptNameOrSourceURL()
            fileLocation = "#{frame.getEvalOrigin()}, " unless filename
        else
            filename = frame.getFileName()

        filename or= ''

        line   = frame.getLineNumber()
        column = frame.getColumnNumber()

        # Check for a sourceMap position
        source = getSourceMapping filename, line, column
        fileLocation =
            if source
                "#{filename}:#{source[0]}:#{source[1]}"
            else
                "#{filename}:#{line}:#{column}"

    functionName = frame.getFunctionName()
    isConstructor = frame.isConstructor()
    isMethodCall = not (frame.isToplevel() or isConstructor)

    if isMethodCall
        methodName = frame.getMethodName()
        typeName = frame.getTypeName()

        if functionName
            tp = as = ''
            if typeName and functionName.indexOf typeName
                tp = "#{typeName}."
            if methodName and functionName.indexOf(".#{methodName}") != functionName.length - methodName.length - 1
                as = " [as #{methodName}]"

            "#{tp}#{functionName}#{as} (#{fileLocation})"
        else
            "#{typeName}.#{methodName or '<anonymous>'} (#{fileLocation})"
    else if isConstructor
        "new #{functionName or '<anonymous>'} (#{fileLocation})"
    else if functionName
        "#{functionName} (#{fileLocation})"
    else
        fileLocation
    
module.exports = 
    
    FILE_EXTENSIONS: FILE_EXTENSIONS
    VERSION:         pkg.version
    run:             run
    eval:            evaluate
    nodes:           nodes
    helpers:         helpers
    compile:         compile
    tokens:          tokens
    register:        -> require './register'
    
    