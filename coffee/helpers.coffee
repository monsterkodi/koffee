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

colors = ->
    colorette = require 'colorette'
    colornames =  [
        'dim'     'bold'
        'red'     'redBright'
        'gray'    'grayBright'
        'yellow'  'yellowBright'
        'green'   'greenBright'
        'white'   'whiteBright'
        'blue'    'blueBright'
        'cyan'    'cyanBright'
        'magenta' 'magentaBright'
    ] 
    for name in colornames
        global[name] = colorette[name]
    global.colorette = colorette

starts = (string, literal, start) ->
    literal is string.substr start, literal.length

# Peek at the end of a given string to see if it matches a sequence.

ends = (string, literal, back) ->
    len = literal.length
    literal is string.substr string.length - len - (back or 0), len

# Repeat a string `n` times.

repeat = (str, n) ->
    
    # Use clever algorithm to have O(log(n)) string concatenation operations.
    res = ''
    while n > 0
        res += str if n & 1
        n >>>= 1
        str += str
    res

pad = (str, length=24) -> # str padded with spaces to length
    
    spaces = length - str.length
    spaces = if spaces > 0 then Array(spaces + 1).join(' ') else ''
    "#{str}#{spaces}"
    
# Trim out all falsy values from an array.

compact = (array) ->
    item for item in array when item

# Count the number of occurrences of a string in a string.

count = (s, substr) ->
    num = pos = 0
    return 1/0 unless substr.length
    num++ while pos = 1 + s.indexOf substr, pos
    num

# 00000000  000   000  000000000  00000000  000   000  0000000    
# 000        000 000      000     000       0000  000  000   000  
# 0000000     00000       000     0000000   000 0 000  000   000  
# 000        000 000      000     000       000  0000  000   000  
# 00000000  000   000     000     00000000  000   000  0000000    

# Extend a source object with the properties of another object (shallow copy).

extend = (object, properties) ->
    for key, val of properties
        object[key] = val
    object

# Merge objects, returning a fresh copy with attributes from both sides.
# Used every time `Base#compile` is called, to allow properties in the
# options hash to propagate down the tree without polluting other branches.

merge = (options, overrides) -> extend (extend {}, options), overrides

# Return a flattened version of an array.
# Handy for getting a list of `children` from the nodes.
    
flatten = (array) ->
    flattened = []
    for element in array
        if '[object Array]' is Object::toString.call element
            flattened = flattened.concat flatten element
        else
            flattened.push element
    flattened

# Delete a key from an object, returning the value. Useful when a node is
# looking for a particular method in an options hash.
    
del = (obj, key) ->
    val =  obj[key]
    delete obj[key]
    val

# Typical Array::some

some = Array::some ? (fn) ->
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

addLocationDataFn = (first, last) ->
    (obj) ->
        if ((typeof obj) is 'object') and (!!obj['updateLocationDataIfMissing'])
            obj.updateLocationDataIfMissing buildLocationData(first, last)

        return obj

# Convert jison location data to a string.
# `obj` can be a token, or a locationData.

locationDataToString = (obj) ->
    if ("2" of obj) and ("first_line" of obj[2]) then locationData = obj[2]
    else if "first_line" of obj then locationData = obj

    if locationData
        "#{locationData.first_line + 1}:#{locationData.first_column + 1}-" +
        "#{locationData.last_line + 1}:#{locationData.last_column + 1}"
    else
        "No location data"

# A `.coffee.md` compatible version of `basename`, that returns the file sans-extension.

baseFileName = (file, stripExt = no, useWinPathSep = no) ->
    pathSep = if useWinPathSep then /\\|\// else /\//
    parts = file.split(pathSep)
    file = parts[parts.length - 1]
    return file unless stripExt and file.indexOf('.') >= 0
    parts = file.split('.')
    parts.pop()
    parts.pop() if /^[ck]offee$/.test(parts[parts.length-1]) and parts.length > 1
    parts.join('.')

# Determine if a filename represents a koffee file.

isCoffee = (file) -> /\.[ck]offee$/.test file

#  0000000  000   000  000   000  000000000   0000000   000   000  00000000  00000000   00000000    0000000   00000000   
# 000        000 000   0000  000     000     000   000   000 000   000       000   000  000   000  000   000  000   000  
# 0000000     00000    000 0 000     000     000000000    00000    0000000   0000000    0000000    000   000  0000000    
#      000     000     000  0000     000     000   000   000 000   000       000   000  000   000  000   000  000   000  
# 0000000      000     000   000     000     000   000  000   000  00000000  000   000  000   000   0000000   000   000  

throwSyntaxError = (module:,message:,location:) ->
    
    err = new SyntaxError "#{bold yellowBright message} #{dim gray '#'} #{gray module}"
    err.location = location
    throw err

updateSyntaxError = (err, code, filename, options) -> # Update a compiler SyntaxError with source code information
    
    err.code     ?= code
    err.filename ?= filename
    
    if err.code and err.location        

        {first_line, first_column, last_line, last_column} = err.location
        last_line ?= first_line
        last_column ?= first_column
    
        codeLine = err.code.split('\n')[first_line]
        start    = first_column        
        end      = if first_line is last_line then last_column + 1 else codeLine.length # Show only the first line on multi-line errors.
        marker   = codeLine[...start].replace(/[^\s]/g, ' ') + repeat('▲', end - start)
    
        if options?.feature?.color != false
            colorize = (str) -> red str
            codeLine = codeLine[...start] + colorize(codeLine[start...end]) + codeLine[end..]
            marker   = colorize marker
                
        fileLine = "#{err.filename ? '?'}:#{first_line + 1}:#{first_column + 1}"
            
        err.message = """
            #{fileLine} #{codeLine}
            #{pad('', fileLine.length+1) + marker} #{err.message}
            """
    else
        # ▸dbg 'code or location?' code:err.code?, location:err.location?
        err.message = Error::toString.call err 
        
    err

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
    
arrayEgal = (a, b) ->
  if egal a, b then yes
  else if a instanceof Array and b instanceof Array
    return no if a.length != b.length
    return no for el, idx in a when not arrayEgal el, b[idx]
    yes

eq      = (a, b, msg) -> ok egal(a, b), msg or "\x1B[0;90m\n <<< expected >>>\n\x1B[0;93m#{a}\x1B[0;90m<<< to equal >>>\n\x1B[0;93m#{b}\x1B[0;90m<<< expected >>>\n"
arrayEq = (a, b, msg) -> ok arrayEgal(a,b), msg or "\x1B[0;90m\n >>>\n\x1B[0;93m#{a}\x1B[0;90m<<< to deep equal >>>\n\x1B[0;93m#{b}\x1B[0;90m<<< expected >>>\n"

toJS = (str) ->
  Koffee.compile str, bare: yes
  .replace /^\s+|\s+$/g, '' # Trim leading/trailing whitespace

stringify = (o) ->
    noon = require 'noon'
    noon.stringify o, circular: true, colors: true
    
# Initialize global variables used in test scripts 
# Supports running single test via `koffee test/..`

initTest = ->
    extend global, require 'assert' 
    global.Koffee = require './koffee'
    global._ = require 'underscore'
    extend global, module.exports
    if not global.test then global.test = (n,f) -> log n; f()
        
module.exports = {
    colors
    starts
    ends
    repeat
    pad
    compact
    count
    merge
    extend
    flatten
    del
    some
    addLocationDataFn
    locationDataToString
    baseFileName
    isCoffee
    throwSyntaxError
    updateSyntaxError
    eq
    arrayEq
    toJS
    stringify
    initTest
}
    