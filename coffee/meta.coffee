###
00     00  00000000  000000000   0000000   
000   000  000          000     000   000  
000000000  0000000      000     000000000  
000 0 000  000          000     000   000  
000   000  00000000     000     000   000  
###

path = require 'path'

helpers = require './helpers'
helpers.colors()

META = [
        
    # 0000000     0000000    0000000  
    # 000   000  000   000  000       
    # 000   000  000   000  000       
    # 000   000  000   000  000       
    # 0000000     0000000    0000000  

    doc: ▸doc '▸doc'
        
        This is a slightly special macro, because it's first pass is hardcoded in the tokenizer.
        The body of the macro is wrapped in a skinny triple string before further tokenization.
        It can contain anything except a skinny triple string.
        
        In normal operation, it is reduced to the empty string. 
        But if **koffee** is called with the `--doc` argument, logs will be inserted instead.
        
        ```coffeescript
        ▸doc 'title'
            my documentation ...
        log 'some code'
        ▸doc
            we are done.
        ```
        
        `koffee --doc file` will output
        
        ```markdown
        ## title
        my documentation ...
        some code
        we are done
        ```
        
        but `koffee file` will only print `some code`
        
    key:  '▸doc'
    desc: '▸doc [header] ...'
    meta: (args:,node:,opts:) ->
        header = args[0] and "'## #{args[0]}\\n'+" or "''+"
        before: opts.doc and "console.log(#{header}"
        after:  ")"
        skip:   not opts.doc and with:"''"
        reduce: true
        body:   true
        block:  false
,    
    # 00000000   00000000    0000000   00000000  000  000      00000000  
    # 000   000  000   000  000   000  000       000  000      000       
    # 00000000   0000000    000   000  000000    000  000      0000000   
    # 000        000   000  000   000  000       000  000      000       
    # 000        000   000   0000000   000       000  0000000  00000000  
    
    key:  '▸profile'   
    desc: '▸profile [id] ...'
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
    
    key:  '▸start'   
    desc: '▸start id ...'
    info:
        then: true
        args: 1
    meta: (args:) -> 
        id = args[0] ? 'start_end'
        before: "koffee_#{id} = process.hrtime()"
        reduce: true
        body:   false
,
    key:  '▸end'     
    desc: '▸end id ...'
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
    
    key:  '▸dbg'    
    desc: '▸dbg [msg] ...'
    info:
        then: true # should not be used with a block
        args: 1
    meta: (opts:,args:,node:) ->
        code:   "true"
        eval:   true
        before: logSource opts:opts, args:args, node:node
        after:  ")"
        reduce: true
        block:  false
,        
    #  0000000    0000000   0000000  00000000  00000000   000000000  
    # 000   000  000       000       000       000   000     000     
    # 000000000  0000000   0000000   0000000   0000000       000     
    # 000   000       000       000  000       000   000     000     
    # 000   000  0000000   0000000   00000000  000   000     000     
    
    key:  '▸assert'    
    desc: '▸assert [msg] ...'
    meta: (opts:,args:,node:) ->
        
        { Block } = require './nodes' 
        if node.body instanceof Block
            body = node.body.expressions[0]
        else
            body = node.body
            
        frag = body.compileToFragments opts
        text = node.fragmentsToText frag
        code = "!(#{text})"
        args = ['assertion failure!'] if not args.length
        before: logSource opts:opts, args:args, node:node, close:true
        then:   true # should not be used with a block
        eval:   false
        reduce: false
        # block:  false
        code:   code            
,    
    # 000000000  00000000   0000000  000000000  
    #    000     000       000          000     
    #    000     0000000   0000000      000     
    #    000     000            000     000     
    #    000     00000000  0000000      000     
    
    key:  '▸test'
    desc: '▸test [id] ...'
    meta: (opts:,args:,node:) ->
        dedent: true
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
    
    key: '▸rand'    
    meta: (args:) -> 
        code:   "Math.random() < #{args?[0] ? 0.5}" 
        reduce: false 
        body:   true   
    
    # key: 'token' 'parse' 'code'
]

#  0000000   0000000   00     00  00000000   000  000      00000000  
# 000       000   000  000   000  000   000  000  000      000       
# 000       000   000  000000000  00000000   000  000      0000000   
# 000       000   000  000 0 000  000        000  000      000       
#  0000000   0000000   000   000  000        000  0000000  00000000  

TAB = '    '

compileMetaIf = (node:,opts:) ->

    { Block, Assign, Value, Literal } = require './nodes'
    { merge } = require './helpers'
        
    info = reduce:true, eval:true
    
    if node.condition.base?.value?.startsWith '▸'
        
        metaKey = node.condition.base.value
        if typeof opts.meta[metaKey] == 'function'
            info = opts.meta[metaKey] opts:opts, node:node, args:[]
            
    if node.condition.variable?.base?.value?.startsWith '▸'
        
        metaKey = node.condition.variable.base.value
        if typeof opts.meta[metaKey] == 'function'
            args = node.condition.args.map (a) -> 
                a.base?.value
            args = args.map (a) -> if a[0] in ['"', "'"] then a[1..-2] else a
            info = opts.meta[metaKey] opts:opts, node:node, args:args
        
    if info.skip 
        if info.skip.with?
            return node.makeCode info.skip.with
        return []
    
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
        frag.push node.makeCode (info.block!=false and info.dedent!=true and indent or '') + info.before
        
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
        else
            frag.push node.makeCode "''" # if info.block == false ???
        
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
    
# 000       0000000    0000000          0000000   0000000   000   000  00000000    0000000  00000000  
# 000      000   000  000              000       000   000  000   000  000   000  000       000       
# 000      000   000  000  0000        0000000   000   000  000   000  0000000    000       0000000   
# 000      000   000  000   000             000  000   000  000   000  000   000  000       000       
# 0000000   0000000    0000000         0000000    0000000    0000000   000   000   0000000  00000000  

logSource = (opts:,args:,node:,close:) ->
    
    colorette.options.enabled = opts.feature.color
    source = opts.source ? opts.filename ? ''
    ext = ''
    if source
        [source, ext...] = path.basename(source).split '.'
        source  = yellow [yellowBright(source), dim ext.join'.'].join dim '.'
    before  = "console.log('#{source}#{dim blue ':'}#{blueBright "#{node.condition.locationData.first_line+1}"}'"
    before += ", '#{bold whiteBright args[0]}'" if args[0] 
    if (close)
        before += ');\n'
    else
        before += ", "
    colorette.options.enabled = true
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
    
    log "#{gray 'Metas:'}\n\n#{ META.map((f) -> "    #{helpers.pad f.key}#{gray f.desc ? "#{f.key} ..."}").join('\n') }"
    log "    ▸if                     #{gray '▸if cond ... [[▸elif cond ...] ▸else ...]'}\n"
    
module.exports = { META, injectMeta, logMetas, compileMetaIf }
