
os     = require 'os'
fs     = require 'fs'
path   = require 'path'
Stream = require 'stream'
Repl   = require '../../js/repl'

class MockInputStream extends Stream
    @: ->
        @readable = true

    resume: ->

    emitLine: (val) ->
        @emit 'data', Buffer.from("#{val}\n")

class MockOutputStream extends Stream
    @: ->
        @writable = true
        @written = []

    write: (data) ->
        #console.log 'output write', arguments
        @written.push data

    lastWrite: (fromEnd = -1) ->
        @written[@written.length - 1 + fromEnd].replace /\r?\n$/, ''

# Create a dummy history file
historyFile = path.join os.tmpdir(), '.coffee_history_test'
fs.writeFileSync historyFile, '1 + 2\n'

testRepl = (desc, fn) ->
    
    input = new MockInputStream
    output = new MockOutputStream
    repl = Repl.start {input, output, historyFile}
    test desc, -> 
        fn input, output, repl
        
escape = { name: 'escape'}

testRepl 'reads history file', (input, output, repl) ->
    input.emitLine repl.history[0]
    eq '3', output.lastWrite()

testRepl "starts with prompt", (input, output) ->
    ceq '■▶ ', output.lastWrite(0)

testRepl "writes eval to output", (input, output) ->
    input.emitLine '1+1'
    eq '2', output.lastWrite()

testRepl "comments are ignored", (input, output) ->
    input.emitLine '1 + 1 #foo'
    eq '2', output.lastWrite()

testRepl "output in inspect mode", (input, output) ->
    input.emitLine '"1 + 1\\n"'
    eq "'1 + 1\\n'", output.lastWrite()

testRepl "variables are saved", (input, output) ->
    input.emitLine "foo = 'foo'"
    input.emitLine 'foobar = "#{foo}bar"'
    eq "'foobar'", output.lastWrite()

testRepl "empty command evaluates to nothing", (input, output) ->
    input.emitLine ''
    ceq '■▶ ', output.lastWrite()

testRepl "escape toggles multiline prompt", (input, output) ->
    input.emit 'keypress', null, escape
    ceq '◖▶ ', output.lastWrite(0)
    input.emit 'keypress', null, escape
    ceq '■▶ ', output.lastWrite(0)

testRepl "multiline continuation changes prompt", (input, output) ->
    input.emit 'keypress', null, escape
    input.emitLine ''
    eq '   ', output.lastWrite(0)

testRepl "evaluates multiline", (input, output) ->
    # Stubs. Could assert on their use.
    output.cursorTo = (pos) ->
    output.clearLine = ->

    input.emit 'keypress', null, escape
    input.emitLine 'do ->'
    input.emitLine '    1 + 1'
    input.emit 'keypress', null, escape
    eq '2', output.lastWrite()

testRepl "variables in scope are preserved", (input, output) ->
    input.emitLine 'a = 1'
    input.emitLine 'do -> a = 2'
    input.emitLine 'a'
    eq '2', output.lastWrite()

testRepl "existential assignment of previously declared variable", (input, output) ->
    input.emitLine 'a = null'
    input.emitLine 'a ?= 42'
    eq '42', output.lastWrite()

testRepl "keeps running after runtime error", (input, output) ->
    input.emitLine 'a = b'
    input.emitLine 'a'
    eq 'undefined', output.lastWrite()

process.on 'exit', ->
    try
        fs.unlinkSync historyFile
    catch exception # Already deleted, nothing else to do.
