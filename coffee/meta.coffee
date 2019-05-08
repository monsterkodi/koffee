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

#  0000000   0000000   00     00  00000000   000  000      00000000  
# 000       000   000  000   000  000   000  000  000      000       
# 000       000   000  000000000  00000000   000  000      0000000   
# 000       000   000  000 0 000  000        000  000      000       
#  0000000   0000000   000   000  000        000  0000000  00000000  

TAB = '    '

compileMetaIf = (node:,opts:) ->

    info = reduce:true
    
    if node.condition.base?.value == 'this'
        
        metaKey = node.condition.properties?[0]?.name?.value
        if typeof opts.meta[metaKey] == 'function'
            info = opts.meta[metaKey] opts:opts, node:node, args:[]
            
    else if node.condition.variable?.base?.value == 'this'
        
        metaKey = node.condition.variable.properties?[0]?.name?.value
        if typeof opts.meta[metaKey] == 'function'
            args = node.condition.args.map (a) -> 
                a.base?.value
            args = args.map (a) -> if a[0] in ['"', "'"] then a[1..-2] else a
            info = opts.meta[metaKey] opts:opts, node:node, args:args
        
    if info.eval or not info.code?
        
        cond = info.code ? node.fragmentsToText node.condition.compileToFragments opts, 2 #LEVEL_PAREN
        try
            os = require 'os'
            fs = require 'fs'
            info.body =!! eval cond
            if info.eval and info.reduce and not info.body and not node.elseBody
                return []
            # log conditionResult:info.body for:cond
        catch err
            error err
        
    frag = []
    
    if info.reduce == false
        frag = frag.concat node.makeCode("if ("), node.makeCode(info.code), node.makeCode(") {\n")
        
        indent = opts.indent + TAB
        bodyOpt = merge opts, {indent}
    else
        indent = opts.indent
        bodyOpt = opts

    if info.before
        if info.block == false
            frag.push node.makeCode info.before
        else
            frag.push node.makeCode indent + info.before
        
    if info.body
        if info.block != false
            body = node.ensureBlock node.body
        else
            # log 'NOBLOCK', node.body instanceof Block
            if node.body instanceof Block
                # log 'deblock', node.body
                body = node.body.expressions[0]
            else
                body = node.body
        frag = frag.concat body.compileToFragments bodyOpt
        
    if info.after
        if info.block == false
            frag.push node.makeCode info.after
        else
            frag.push node.makeCode '\n' + indent + info.after

    if not info.reduce
        frag.push node.makeCode("\n#{node.tab}}")
                    
    if node.elseBody and (info.reduce == false or info.body == false)
        frag.push node.makeCode ' else ' if not info.reduce
        if node.isChain
            frag = frag.concat node.elseBody.unwrap().compileToFragments bodyOpt, 1 # LEVEL_TOP  ???
        else
            frag = frag.concat node.elseBody.compileToFragments bodyOpt
        
    # frag.push node.makeCode '' if not frag.length
    # log frag
    return frag
    
# 000  000   000        000  00000000   0000000  000000000  
# 000  0000  000        000  000       000          000     
# 000  000 0 000        000  0000000   000          000     
# 000  000  0000  000   000  000       000          000     
# 000  000   000   0000000   00000000   0000000     000     

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
    
module.exports = { META, injectMeta, logMetas, compileMetaIf }
