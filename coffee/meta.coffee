###
00     00  00000000  000000000   0000000   
000   000  000          000     000   000  
000000000  0000000      000     000000000  
000 0 000  000          000     000   000  
000   000  00000000     000     000   000  
###

path = require 'path'

{ red, green, blue, blueBright, yellow, yellowBright, white, whiteBright, gray, bold, dim, options } = require 'colorette'

META = [
    
    # 00000000   00000000    0000000   00000000  000  000      00000000  
    # 000   000  000   000  000   000  000       000  000      000       
    # 00000000   0000000    000   000  000000    000  000      0000000   
    # 000        000   000  000   000  000       000  000      000       
    # 000        000   000   0000000   000       000  0000000  00000000  
    key:  'profile'   
    desc: '@profile [id] ...'
    meta: (args:,node:) -> 
        
        id = "#{node.condition.locationData.first_line+1}_#{node.condition.locationData.first_column}"
        name = args[0] ? id
        after:  "console.log('#{name}', require('pretty-time')(process.hrtime(koffee_#{id})));"
        code:   "koffee_#{id} = process.hrtime()"
        reduce: false
        body:   true
,
    #  0000000  000000000   0000000   00000000   000000000  
    # 000          000     000   000  000   000     000     
    # 0000000      000     000000000  0000000       000     
    #      000     000     000   000  000   000     000     
    # 0000000      000     000   000  000   000     000     
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
    # 0000000    0000000     0000000   
    # 000   000  000   000  000        
    # 000   000  0000000    000  0000  
    # 000   000  000   000  000   000  
    # 0000000    0000000     0000000   
    key: 'dbg'    
    desc: '@dbg msg ...'
    info:
        then: true
        args: 1
    meta: (opts:,args:,node:) ->
        code:   "true"
        eval:   true
        before: logSource opts:opts, args:args, node:node
        after:  ")"
        reduce: true
        block:  false
,    
    # 000000000  00000000   0000000  000000000  
    #    000     000       000          000     
    #    000     0000000   0000000      000     
    #    000     000            000     000     
    #    000     00000000  0000000      000     
    key: 'test'
    desc: '@test id ...'
    meta: (opts:,args:,node:) ->
        before: opts.test and logSource opts:opts, args:args, node:node, close:true
        skip:   not opts.test
        reduce: true
        body:   true
,        
    # 00000000    0000000   000   000  0000000    
    # 000   000  000   000  0000  000  000   000  
    # 0000000    000000000  000 0 000  000   000  
    # 000   000  000   000  000  0000  000   000  
    # 000   000  000   000  000   000  0000000    
    key: 'rand'    
    meta: (args:) -> 
        code:"Math.random() < #{args?[0] ? 0.5}" 
        reduce:false 
        body:true   
    
    # key: 'token' 'parse' 'code' 'test' 'assert'
]

#  0000000   0000000   00     00  00000000   000  000      00000000  
# 000       000   000  000   000  000   000  000  000      000       
# 000       000   000  000000000  00000000   000  000      0000000   
# 000       000   000  000 0 000  000        000  000      000       
#  0000000   0000000   000   000  000        000  0000000  00000000  

TAB = '    '

compileMetaIf = (node:,opts:) ->

    { Block, Assign, Value, Literal } = require './nodes'
    
    info = reduce:true, eval:true
    
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
        
    if info.skip then return []
    
    if info.eval
        
        cond = info.code ? node.fragmentsToText node.condition.compileToFragments opts, 2 #LEVEL_PAREN
        try
            os = require 'os'
            fs = require 'fs'
            info.body =!! eval cond
            if info.eval and info.reduce and not info.body and not node.elseBody
                return []
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
        frag.push node.makeCode (info.block != false and indent or '') + info.before
        
    if info.body
        if info.block != false
            body = node.ensureBlock node.body
        else
            if node.body instanceof Block
                body = node.body.expressions[0]
            else
                body = node.body
        if body
            frag = frag.concat body.compileToFragments bodyOpt
        
    if info.after
        frag.push node.makeCode ((info.block != false) and ('\n' + indent) or '') + info.after

    if not info.reduce
        frag.push node.makeCode("\n#{node.tab}}")
                    
    if node.elseBody and (info.reduce == false or info.body == false)
        frag.push node.makeCode ' else ' if not info.reduce
        if node.isChain
            frag = frag.concat node.elseBody.unwrap().compileToFragments bodyOpt
        else
            frag = frag.concat node.elseBody.compileToFragments bodyOpt
        
    return frag
    
# utility = (name, o) ->
    # {root} = o.scope
    # if name of root.utilities
        # root.utilities[name]
    # else
        # ref = root.freeVariable name
        # root.assign ref, UTILITIES[name] o # <- adds utility to top level scope
        # root.utilities[name] = ref

#  0000000   0000000   000   000  00000000    0000000  00000000  
# 000       000   000  000   000  000   000  000       000       
# 0000000   000   000  000   000  0000000    000       0000000   
#      000  000   000  000   000  000   000  000       000       
# 0000000    0000000    0000000   000   000   0000000  00000000  

logSource = (opts:,args:,node:,close:) ->
    
    options.enabled = opts.feature.color
    source = opts.source ? opts.filename ? ''
    ext = ''
    if source
        [source, ext...] = path.basename(source).split '.'
        source  = yellow [yellowBright(source), dim ext.join'.'].join dim '.'
    before  = "console.log('#{source}#{dim blue ':'}#{blueBright "#{node.condition.locationData.first_line+1}"}'"
    before += ", '#{bold whiteBright args[0]}'" if args[0] 
    if (close)
        before += ');'
    else
        before += ", "
    before
        
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
