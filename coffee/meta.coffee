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
        It can contain anything except \'\'\'.
        
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
        we are done.
        ```
        
        but `koffee file` will only print `some code`
        
    key:  '▸doc'
    desc: '▸doc [header] ...'
    meta: (args:,node:,opts:) ->
        header = args[0] and "'## #{args[0]}\\n'+" or "''+"
        before: opts.doc and "#{metaLog(opts)}(#{header}"
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
    meta: (args:,node:,opts:) -> 
        
        id = "#{node.condition.locationData.first_line+1}_#{node.condition.locationData.first_column}"
        name = args[0] ? id
        code:   "koffee_#{id} = process.hrtime.bigint()"
        after:  "#{metaLog(opts)}('#{name}', (function(b){ let f=1000n; for (let u of ['ns','μs','ms','s']) { if (u=='s' || b<f) { return ''+(1000n*b/f)+' '+u; } f*=1000n; }})(process.hrtime.bigint()-koffee_#{id}));"
        reduce: false
        body:   true
,
    #  0000000   000   000  00000000  00000000    0000000    0000000   00000000  
    # 000   000  000   000  000       000   000  000   000  000        000       
    # 000000000   000 000   0000000   0000000    000000000  000  0000  0000000   
    # 000   000     000     000       000   000  000   000  000   000  000       
    # 000   000      0      00000000  000   000  000   000   0000000   00000000  
    
    key:  '▸average'   
    desc: '▸average num ...'
    meta: (args:,node:,opts:) -> 
        
        id  = "#{node.condition.locationData.first_line+1}_#{node.condition.locationData.first_column}"
        num = args[0] ? 100
        before:  """
            
            koffee_#{id} = 0n;
            for(i = 0; i < #{num}; i++) 
            { 
                koffee_#{id}_start = process.hrtime.bigint();
            
            """
        after: """
            koffee_#{id} += process.hrtime.bigint() - koffee_#{id}_start;
            };
            koffee_#{id} /= #{num}n;
            #{metaLog(opts)}('#{id}', (function(b){ let f=1000n; for (let u of ['ns','μs','ms','s']) { if (u=='s' || b<f) { return ''+(1000n*b/f)+' '+u; } f*=1000n; }})(koffee_#{id})); 
            """
        reduce: true
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
        before: "koffee_#{id} = process.hrtime.bigint()"
        reduce: true
        body:   false
,
    key:  '▸end'     
    desc: '▸end id ...'
    info:
        then: true
        args: 1
    meta: (args:,opts:) -> 
        id = args[0] ? 'start_end'
        before: "#{metaLog(opts)}('#{id}', (function(b){ let f=1000n; for (let u of ['ns','μs','ms','s']) { if (u=='s' || b<f) { return ''+(1000n*b/f)+' '+u; } f*=1000n; }})(process.hrtime.bigint()-koffee_#{id}));"
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
        before: logSource {opts, args, node}
        after:  ')'
        reduce: true
        body:   true
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
        
        { Block, extend } = require './nodes'
        if node.body instanceof Block
            body = node.body.expressions[0]
        else
            body = node.body
            
        frag = body.compileToFragments opts
        text = node.fragmentsToText frag
        args = ['assertion failure!'] if not args.length
        before: logSource {opts, args, node, close:true}
        after:  'process.exit(666);'
        then:   true # should not be used with a block
        eval:   false
        reduce: false
        code:   "!(#{text})"
,    
    # 000000000  00000000   0000000  000000000  
    #    000     000       000          000     
    #    000     0000000   0000000      000     
    #    000     000            000     000     
    #    000     00000000  0000000      000     
    
    key:  '▸test'
    desc: '▸test [id] ...'
    meta: (opts:,args:,node:) ->
        before  = logSource {opts, args, node, close:true}
        before += '\n    try {\n'
        dedent: true
        before: opts.test and before
        after:  opts.test and "} catch(err) { #{metaLog(opts)}(err.message); }\n"
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
    { extend, merge } = require './helpers'
        
    info = reduce:true, eval:true
    
    if node.condition.base?.value?.startsWith '▸'
        
        metaKey = node.condition.base.value
        if typeof opts.meta[metaKey] == 'function'
            info = opts.meta[metaKey] {opts, node, args:[]}
            
    if node.condition.variable?.base?.value?.startsWith '▸'
        
        metaKey = node.condition.variable.base.value
        if typeof opts.meta[metaKey] == 'function'
            args = node.condition.args.map (a) -> 
                a.base?.value
            args = args.map (a) -> if a[0] in ['"', "'"] then a[1..-2] else a
            info = opts.meta[metaKey] {opts, node, args}
        
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

metaLog = (opts) -> opts.metalog ? 'console.log'

logSource = (opts:,args:,node:,close:) ->
    
    colorette.options.enabled = opts.feature.color
    source = opts.source ? opts.filename ? ''
    ext = ''
    if source
        [source, ext...] = path.basename(source).split '.'
        source  = yellow [yellowBright(source), dim ext.join'.'].join dim '.'
    before  = "#{metaLog(opts)}('#{source}#{dim blue ':'}#{blueBright "#{node.condition.locationData.first_line+1}"}'"
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
