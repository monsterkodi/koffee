###
00     00  00000000  000000000   0000000   
000   000  000          000     000   000  
000000000  0000000      000     000000000  
000 0 000  000          000     000   000  
000   000  00000000     000     000   000  
###

META = [
    
    key:  'profile'   
    desc: '@profile [id] ...'
    info:
        args: 1
    meta: (args:,node:) -> 
        id = "#{node.condition.locationData.first_line+1}_#{node.condition.locationData.first_column}"
        name = args[0] ? id
        after:  "console.log('#{name}', require('pretty-time')(process.hrtime(koffee_#{id})));"
        code:   "koffee_#{id} = process.hrtime()"
        reduce: false
        body:   true
,
    key:  'start'   
    desc: '@start id ...'
    info:
        then: true
        args: 1
    meta: (args:) -> 
        id = args[0] ? 'start_end'
        before: "koffee_#{id} = process.hrtime()"
        reduce: true
        body:   false
,
    key:  'end'     
    desc: '@end id ...'
    info:
        then: true
        args: 1
    meta: (args:) -> 
        id = args[0] ? 'start_end'
        before: "console.log('#{id}', require('pretty-time')(process.hrtime(koffee_#{id})))"
        reduce: true
        body:   false
,        
    key: 'dbg'    
    desc: '@dbg msg ...'
    info:
        then: true
        args: 1
    meta: (opts:,args:,node:) ->
        # log opts, args
        
        before  = "console.log('#{require('path').basename(opts.source)}:#{node.condition.locationData.first_line+1}'"
        before += ", '#{args[0]}'" if args[0] 
        before += ", "
        
        code:   "o.Debug"
        eval:   true
        before: before
        after:  ")"
        reduce: true
        block:  false
,        
    key: 'rand'    
    meta: (args:) -> 
        code:"Math.random() < #{args?[0] ? 0.5}" 
        reduce:false 
        body:true   
    
    # key: 'token' 'parse' 'code' 'test' 'assert' 'dbg' 
]

injectMeta = (options) -> # make sure that options has a meta set
    
    options ?= {}
    
    { extend } = require './helpers'
    
    defaultMeta = {}
    META.map (m) -> defaultMeta[m.key] = m.meta; m.meta.key = m.key; m.meta.info = m.info
    
    meta    = extend defaultMeta, options.meta ? {}
    options = extend { meta: meta }, options
    options

logMetas = ->
    
    { pad } = require './helpers'
    { gray } = require 'colorette'
    log "#{gray 'Metas:'}\n\n#{ META.map((f) -> "    #{pad f.key}#{gray f.desc ? "@#{f.key} ..."}").join('\n') }"
    log "    if else                 #{gray '@if cond ... [[@elif cond ...] @else ...]'}\n"
    
module.exports = { META, injectMeta, logMetas }
