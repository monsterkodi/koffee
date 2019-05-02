###
000   000  00000000  000      00000000   00000000  00000000    0000000  
000   000  000       000      000   000  000       000   000  000       
000000000  0000000   000      00000000   0000000   0000000    0000000   
000   000  000       000      000        000       000   000       000  
000   000  00000000  0000000  000        00000000  000   000  0000000   
###

# Functions that we'd like to share among the Lexer, Rewriter, and Nodes. 
# Merge objects, flatten arrays, count characters, that sort of thing.

# Peek at the beginning of a given string to see if it matches a sequence.

features = require './features'

exports.injectFeature = features.injectFeature

exports.starts = (string, literal, start) ->
    literal is string.substr start, literal.length

# Peek at the end of a given string to see if it matches a sequence.

exports.ends = (string, literal, back) ->
    len = literal.length
    literal is string.substr string.length - len - (back or 0), len

# Repeat a string `n` times.

exports.repeat = repeat = (str, n) ->
    
    # Use clever algorithm to have O(log(n)) string concatenation operations.
    res = ''
    while n > 0
        res += str if n & 1
        n >>>= 1
        str += str
    res

exports.pad = (str, length=24) -> # str padded with spaces to length
    
    spaces = length - str.length
    spaces = if spaces > 0 then Array(spaces + 1).join(' ') else ''
    "#{str}#{spaces}"
    
# Trim out all falsy values from an array.

exports.compact = (array) ->
    item for item in array when item

# Count the number of occurrences of a string in a string.

exports.count = (string, substr) ->
    num = pos = 0
    return 1/0 unless substr.length
    num++ while pos = 1 + string.indexOf substr, pos
    num

# Merge objects, returning a fresh copy with attributes from both sides.
# Used every time `Base#compile` is called, to allow properties in the
# options hash to propagate down the tree without polluting other branches.

exports.merge = (options, overrides) ->
    extend (extend {}, options), overrides

# 00000000  000   000  000000000  00000000  000   000  0000000    
# 000        000 000      000     000       0000  000  000   000  
# 0000000     00000       000     0000000   000 0 000  000   000  
# 000        000 000      000     000       000  0000  000   000  
# 00000000  000   000     000     00000000  000   000  0000000    

# Extend a source object with the properties of another object (shallow copy).

exports.extend = extend = (object, properties) ->
    for key, val of properties
        object[key] = val
    object

# Return a flattened version of an array.
# Handy for getting a list of `children` from the nodes.
    
exports.flatten = flatten = (array) ->
    flattened = []
    for element in array
        if '[object Array]' is Object::toString.call element
            flattened = flattened.concat flatten element
        else
            flattened.push element
    flattened

# Delete a key from an object, returning the value. Useful when a node is
# looking for a particular method in an options hash.
    
exports.del = (obj, key) ->
    val =  obj[key]
    delete obj[key]
    val

# Typical Array::some

exports.some = Array::some ? (fn) ->
    return true for e in this when fn e
    false

# Merge two jison-style location data objects together.
# If `last` is not provided, this will simply return `first`.

buildLocationData = (first, last) ->
    if not last
        first
    else
        first_line: first.first_line
        first_column: first.first_column
        last_line: last.last_line
        last_column: last.last_column

# This returns a function which takes an object as a parameter, and if that
# object is an AST node, updates that object's locationData.
# The object is returned either way.

exports.addLocationDataFn = (first, last) ->
    (obj) ->
        if ((typeof obj) is 'object') and (!!obj['updateLocationDataIfMissing'])
            obj.updateLocationDataIfMissing buildLocationData(first, last)

        return obj

# Convert jison location data to a string.
# `obj` can be a token, or a locationData.

exports.locationDataToString = (obj) ->
    if ("2" of obj) and ("first_line" of obj[2]) then locationData = obj[2]
    else if "first_line" of obj then locationData = obj

    if locationData
        "#{locationData.first_line + 1}:#{locationData.first_column + 1}-" +
        "#{locationData.last_line + 1}:#{locationData.last_column + 1}"
    else
        "No location data"

# A `.coffee.md` compatible version of `basename`, that returns the file sans-extension.

exports.baseFileName = (file, stripExt = no, useWinPathSep = no) ->
    pathSep = if useWinPathSep then /\\|\// else /\//
    parts = file.split(pathSep)
    file = parts[parts.length - 1]
    return file unless stripExt and file.indexOf('.') >= 0
    parts = file.split('.')
    parts.pop()
    parts.pop() if /^[ck]offee$/.test(parts[parts.length-1]) and parts.length > 1
    parts.join('.')

# 000   0000000   0000000   0000000   00000000  00000000  00000000  00000000  
# 000  000       000       000   000  000       000       000       000       
# 000  0000000   000       000   000  000000    000000    0000000   0000000   
# 000       000  000       000   000  000       000       000       000       
# 000  0000000    0000000   0000000   000       000       00000000  00000000  

# Determine if a filename represents a koffee file.

exports.isCoffee = (file) -> /\.[ck]offee$/.test file

# Throws a SyntaxError from a given location.
# The error's `toString` will return an error message following the "standard"
# format `<filename>:<line>:<col>: <message>` plus the line with the error and a
# marker showing where the error is.

exports.throwSyntaxError = (message, location) ->
    error = new SyntaxError message
    error.location = location
    error.toString = syntaxErrorToString

    # Instead of showing the compiler's stacktrace, show our custom error message.
    # This is useful when the error bubbles up in Node.js applications that compile Koffee.
    error.stack = error.toString()

    throw error

# Update a compiler SyntaxError with source code information if it didn't have it already.

exports.updateSyntaxError = (error, code, filename) ->
    # Avoid screwing up the `stack` property of other errors (i.e. possible bugs).
    if error.toString is syntaxErrorToString
        error.code or= code
        error.filename or= filename
        error.stack = error.toString()
    error

syntaxErrorToString = ->
    
    return Error::toString.call @ unless @code and @location

    {first_line, first_column, last_line, last_column} = @location
    last_line ?= first_line
    last_column ?= first_column

    filename = @filename or '[stdin]'
    codeLine = @code.split('\n')[first_line]
    start    = first_column
    # Show only the first line on multi-line errors.
    end      = if first_line is last_line then last_column + 1 else codeLine.length
    marker   = codeLine[...start].replace(/[^\s]/g, ' ') + repeat('^', end - start)

    # Check to see if we're running on a color-enabled TTY.
    if process?
        colorsEnabled = process.stdout?.isTTY and not process.env?.NODE_DISABLE_COLORS

    if @colorful ? colorsEnabled
        colorize = (str) -> "\x1B[1;31m#{str}\x1B[0m"
        codeLine = codeLine[...start] + colorize(codeLine[start...end]) + codeLine[end..]
        marker   = colorize marker

    """
        #{filename}:#{first_line + 1}:#{first_column + 1}: error: #{@message}
        #{codeLine}
        #{marker}
    """

exports.nameWhitespaceCharacter = (string) ->
    
    switch string
        when ' ' then 'space'
        when '\n' then 'newline'
        when '\r' then 'carriage return'
        when '\t' then 'tab'
        else string

# 000000000  00000000   0000000  000000000  
#    000     000       000          000     
#    000     0000000   0000000      000     
#    000     000            000     000     
#    000     00000000  0000000      000     

egal = (a, b) ->
  if a is b
    a != 0 or 1/a is 1/b
  else
    a != a and b != b

# A recursive functional equivalence helper; uses egal for testing equivalence.
    
arrayEgal = (a, b) ->
  if egal a, b then yes
  else if a instanceof Array and b instanceof Array
    return no unless a.length is b.length
    return no for el, idx in a when not arrayEgal el, b[idx]
    yes

exports.eq      = (a, b, msg) -> ok egal(a, b), msg or "\x1B[0;90m\n <<< expected >>>\n\x1B[0;93m#{a}\x1B[0;90m<<< to equal >>>\n\x1B[0;93m#{b}\x1B[0;90m<<< expected >>>\n"
exports.arrayEq = (a, b, msg) -> ok arrayEgal(a,b), msg or "\x1B[0;90m\n >>>\n\x1B[0;93m#{a}\x1B[0;90m<<< to deep equal >>>\n\x1B[0;93m#{b}\x1B[0;90m<<< expected >>>\n"

exports.toJS = (str) ->
  Koffee.compile str, bare: yes
  .replace /^\s+|\s+$/g, '' # Trim leading/trailing whitespace

exports.stringify = (o) ->
    noon = require 'noon'
    noon.stringify o, circular: true, colors: true
    
# Initialize global variables used in test scripts 
# Supports running single test via `koffee test/..`
    
exports.initTest = ->
    extend global, require 'assert' 
    global.Koffee = require './koffee'
    global._ = require 'underscore'
    extend global, exports
    if not global.log  then global.log = console.log 
    if not global.test then global.test = (n,f) -> log n; f()
    