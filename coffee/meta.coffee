###
00     00  00000000  000000000   0000000   
000   000  000          000     000   000  
000000000  0000000      000     000000000  
000 0 000  000          000     000   000  
000   000  00000000     000     000   000  
###

randMeta    = (o) -> code:"Math.random() < #{o.args?[0] ? 0.5}" reduce:false
codeMeta    = (o) -> 
testMeta    = (o) -> reduce:true
tokenMeta   = (o) -> reduce:true
parseMeta   = (o) -> reduce:true
debugMeta   = (o) -> reduce:true
assertMeta  = (o) -> reduce:true
profileMeta = (o) -> 
    id = "#{o.node.condition.locationData.first_line+1}_#{o.node.condition.locationData.first_column}"
    if o.args[0]
        name = o.args[0]
    else
        name = id
    after:  "console.log('#{name}', require('pretty-time')(process.hrtime(koffee_#{id})));" #Number.parseFloat().toFixed(6));"
    code:   "koffee_#{id} = process.hrtime()"
    reduce: false

META = [
    { key: 'token'   desc: 'tokenized expression' meta:tokenMeta   }
    { key: 'parse'   desc: 'parsed    expression' meta:parseMeta   }
    { key: 'code'    desc: 'compiled  expression' meta:codeMeta    }
    { key: 'test'    desc: 'test'                 meta:testMeta    }
    { key: 'assert'  desc: 'assert'               meta:assertMeta  }
    { key: 'profile' desc: 'profile'              meta:profileMeta }
    { key: 'dbg'     desc: 'debug'                meta:debugMeta   }
    { key: 'rand'    desc: 'rand'                 meta:randMeta    }
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
