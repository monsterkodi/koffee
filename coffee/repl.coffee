###
00000000   00000000  00000000   000      
000   000  000       000   000  000      
0000000    0000000   00000000   000      
000   000  000       000        000      
000   000  00000000  000        0000000  
###

fs       = require 'fs'
path     = require 'path'
vm       = require 'vm'
nodeREPL = require 'repl'
Koffee   = require './koffee'

{ pad, merge, updateSyntaxError } = require './helpers'

# 00000000   000   000  000   000  
# 000   000  000   000  0000  000  
# 0000000    000   000  000 0 000  
# 000   000  000   000  000  0000  
# 000   000   0000000   000   000  

runInContext = (js, context, filename) ->
    
    if context is global
        vm.runInThisContext js, filename
    else
        vm.runInContext js, context, filename

# 00     00  000   000  000      000000000  000  000      000  000   000  00000000  
# 000   000  000   000  000         000     000  000      000  0000  000  000       
# 000000000  000   000  000         000     000  000      000  000 0 000  0000000   
# 000 0 000  000   000  000         000     000  000      000  000  0000  000       
# 000   000   0000000   0000000     000     000  0000000  000  000   000  00000000  

addMultilineHandler = (repl) ->
    
    {rli, inputStream, outputStream} = repl
    
    origPrompt = repl._prompt

    multiline =
        enabled: off
        buffer: ''

    nodeLineListener = rli.listeners('line')[0]
    rli.removeListener 'line', nodeLineListener
    
    rli.on 'line', (cmd) ->
        if multiline.enabled
            multiline.buffer += "#{cmd}\n"
            rli.setPrompt '   '
            rli.prompt true
        else
            rli.setPrompt origPrompt
            nodeLineListener cmd
        return
    
    inputStream.on 'keypress', (char, key) ->
        
        if key?.name == 'escape' # escape (multiline)
        
            if multiline.enabled
                # allow arbitrarily switching between modes any time before multiple lines are entered
                unless multiline.buffer.match /\n/
                    multiline.enabled = not multiline.enabled
                    rli.setPrompt origPrompt
                    rli.prompt true
                    return
                # no-op unless the current line is empty
                return if rli.line? and not rli.line.match /^\s*$/
                # eval, print, loop
                multiline.enabled = not multiline.enabled
                rli.line = ''
                rli.cursor = 0
                rli.output.cursorTo 0
                rli.output.clearLine 1
                # XXX: multiline hack
                multiline.buffer = multiline.buffer.replace /\n/g, '\uFF00'
                rli.emit 'line', multiline.buffer
                multiline.buffer = ''
            else
                multiline.enabled = not multiline.enabled
                rli.setPrompt yellow '◖▶ '
                rli.prompt true
        return

# 000   000  000   0000000  000000000   0000000   00000000   000   000  
# 000   000  000  000          000     000   000  000   000   000 000   
# 000000000  000  0000000      000     000   000  0000000      00000    
# 000   000  000       000     000     000   000  000   000     000     
# 000   000  000  0000000      000      0000000   000   000     000     

addHistory = (repl, filename, maxSize) ->
    
    lastLine = null
    try
        # Get file info and at most maxSize of command history
        stat = fs.statSync filename
        size = Math.min maxSize, stat.size
        # Read last `size` bytes from the file
        readFd = fs.openSync filename, 'r'
        buffer = Buffer.alloc(size)
        fs.readSync readFd, buffer, 0, size, stat.size - size
        fs.closeSync readFd
        # Set the history on the interpreter
        repl.rli.history = buffer.toString().split('\n').reverse()
        # If the history file was truncated we should pop off a potential partial line
        repl.rli.history.pop() if stat.size > maxSize
        # Shift off the final blank newline
        repl.rli.history.shift() if repl.rli.history[0] is ''
        repl.rli.historyIndex = -1
        lastLine = repl.rli.history[0]

    fd = fs.openSync filename, 'a'

    repl.rli.addListener 'line', (code) ->
        if code and code.length and code != '.history' and code != '.exit' and lastLine != code
            # Save the latest command in the file
            fs.writeSync fd, "#{code}\n"
            lastLine = code

    repl.on 'exit', -> fs.closeSync fd

#  0000000  000000000   0000000   00000000   000000000  
# 000          000     000   000  000   000     000     
# 0000000      000     000000000  0000000       000     
#      000     000     000   000  000   000     000     
# 0000000      000     000   000  000   000     000     

start = (opts={}) ->
    
    [major, minor, build] = process.versions.node.split('.').map (n) -> parseInt(n, 10)

    if major < 10
        console.warn "Node 10+ required for koffee REPL"
        process.exit 1

    Koffee.register()
    process.argv = ['koffee'].concat process.argv[2..]
    repl = null
    
    # 0000000    00000000  00000000   0000000   000   000  000      000000000   0000000  
    # 000   000  000       000       000   000  000   000  000         000     000       
    # 000   000  0000000   000000    000000000  000   000  000         000     0000000   
    # 000   000  000       000       000   000  000   000  000         000          000  
    # 0000000    00000000  000       000   000   0000000   0000000     000     0000000   
    
    replDefaults =
        
        prompt: blue "■▶ ",
        historyFile: path.join process.env.HOME, '.koffee_history' if process.env.HOME
        historyMaxInputSize: 10240
        # escapeCodeTimeout: 20
        removeHistoryDuplicates: true
        
        eval: (input, context, filename, cb) ->
            
            input = input.replace /\uFF00/g, '\n' # XXX: multiline hack.
            input = input.replace /^\(([\s\S]*)\n\)$/m, '$1' # Node's REPL sends the input ending with a newline and then wrapped in parens. Unwrap all that.
            input = input.replace /^\s*try\s*{([\s\S]*)}\s*catch.*$/m, '$1' # Node's REPL v6.9.1+ sends the input wrapped in a try/catch statement. Unwrap that too.
    
            { Block, Assign, Value, Literal } = require './nodes'
    
            try
                tokens = Koffee.tokens input
                referencedVars = ( token[1] for token in tokens when token[0] is 'IDENTIFIER' )
                ast = Koffee.nodes tokens
                js = ast.compile 
                    bare:           yes
                    locals:         Object.keys context
                    referencedVars: referencedVars
                if js.trim().length
                    cb null, runInContext js, context, filename
                else
                    cb null
            catch err
                # AST's `compile` does not add source code information to syntax errors.
                updateSyntaxError err, input#, '?'
                if err.markLine and err.codeLine
                    ln_cl = '   '
                    if err.line > 1 
                        ln_cl = pad "#{err.line}:", 3
                    if repl
                        repl.outputStream.write ln_cl + err.codeLine + '\n'
                        repl.outputStream.write pad('',ln_cl.length) + err.markLine + '\n'
                    else
                        log ln_cl + err.codeLine
                        log pad('',ln_cl.length) + err.markLine
                else
                    if repl
                        repl.outputStream.write err.message + '\n'
                    else
                        log err.message
                cb null
                
    opts = merge replDefaults, opts
    repl = nodeREPL.start opts

    completer = repl.rli.completer
    repl.rli.completer = (line, callback) ->
        completer line, (err, r) ->
            if r[0].length > 1
                callback null, r
            else if r[0].length == 1 and r[0][0] == r[1]
                repl.rli.write '.'         # suppress showing the single result as list       
                callback null, [null,null] # TODO: check if we can figure out the object type
            else
                callback null, r
    
    # ▸dbg 'repl.rli' repl.rli
    
    runInContext opts.prelude, repl.context, 'prelude' if opts.prelude
    repl.on 'exit', -> repl.outputStream.write '\n' if not repl.rli.closed
    addMultilineHandler repl
    addHistory repl, opts.historyFile, opts.historyMaxInputSize if opts.historyFile

    repl.commands['load'].help = 'Load code from a file into this REPL session'
    repl.commands['history'] = # Add a command to show the history stack
        help: 'Show command history'
        action: ->
            repl.outputStream.write "#{repl.rli.history[..].reverse().join '\n'}\n"
            repl.displayPrompt()
    repl

module.exports = {start}
