###
00     00  00000000  000000000   0000000   
000   000  000          000     000   000  
000000000  0000000      000     000000000  
000 0 000  000          000     000   000  
000   000  00000000     000     000   000  
###

META = [
    
    key: 'profile'   
    meta: (args:,node:) -> 
        id = "#{node.condition.locationData.first_line+1}_#{node.condition.locationData.first_column}"
        name = args[0] ? id
        after:  "console.log('#{name}', require('pretty-time')(process.hrtime(koffee_#{id})));"
        code:   "koffee_#{id} = process.hrtime()"
        reduce: false
,
    key: 'start'   
    meta: (args:) -> 
        id = args[0] ? 'start_end'
        before: "koffee_#{id} = process.hrtime()"
        reduce: true
        body:   false
,
    key: 'end'     
    meta: (args:) -> 
        id = args[0] ? 'start_end'
        before: "console.log('#{id}', require('pretty-time')(process.hrtime(koffee_#{id})))"
        reduce: true
        body:   false
,        
    key: 'rand'    
    meta: (args:) -> code:"Math.random() < #{args?[0] ? 0.5}" reduce:false   
    
    # key: 'token' 'parse' 'code' 'test' 'assert' 'dbg' 
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
