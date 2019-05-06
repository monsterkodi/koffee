###
00     00  00000000  000000000   0000000   
000   000  000          000     000   000  
000000000  0000000      000     000000000  
000 0 000  000          000     000   000  
000   000  00000000     000     000   000  
###

META = [
    key: 'profile'   
    meta: (o) -> 
        id = "#{o.node.condition.locationData.first_line+1}_#{o.node.condition.locationData.first_column}"
        if o.args[0]
            name = o.args[0]
        else
            name = id
        after:  "console.log('#{name}', require('pretty-time')(process.hrtime(koffee_#{id})));"
        code:   "koffee_#{id} = process.hrtime()"
        reduce: false
,
    key: 'start'   
    meta: (o) -> 
        id = o.args[0] ? 'start_end'
        before: "koffee_#{id} = process.hrtime()"
        reduce: true
        body:   false
,
    key: 'end'     
    meta: (o) -> 
        id = o.args[0] ? 'start_end'
        before: "console.log('#{id}', require('pretty-time')(process.hrtime(koffee_#{id})))"
        reduce: true
        body:   false
,        
    key: 'rand'    
    meta: (o) -> code:"Math.random() < #{o.args?[0] ? 0.5}" reduce:false   
    # key: 'token'   
    # key: 'parse'   
    # key: 'code'    
    # key: 'test'    
    # key: 'assert'  
    # key: 'dbg'     
]

injectMeta = (options) -> # make sure that options has a meta set
    
    options ?= {}
    
    { extend } = require './helpers'
    
    defaultMeta = {}
    META.map (m) -> defaultMeta[m.key] = m.meta
    
    meta    = extend defaultMeta, options.meta ? {}
    options = extend { meta: meta }, options
    options

logMetas = ->
    
    { pad } = require './helpers'
    log "\nMetas:\n\n#{ META.map((f) -> "    #{pad f.key}#{f.desc}").join('\n') }\n"
    
module.exports = { META, injectMeta, logMetas }
