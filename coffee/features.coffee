###
00000000  00000000   0000000   000000000  000   000  00000000   00000000   0000000  
000       000       000   000     000     000   000  000   000  000       000       
000000    0000000   000000000     000     000   000  0000000    0000000   0000000   
000       000       000   000     000     000   000  000   000  000            000  
000       00000000  000   000     000      0000000   000   000  00000000  0000000   
###

helpers = require './helpers'
helpers.colors()

FEATURES = [
    { flag: 'color'                 key: 'color'                 desc: 'output with ansi colors'           enabled: true  }
    { flag: 'config-parameters'     key: 'config_parameters'     desc: 'enable config parameters'          enabled: true  }
    { flag: 'console-shortcut'      key: 'console_shortcut'      desc: 'replace log with console.log'      enabled: true  }
    { flag: 'constructor-shortcut'  key: 'constructor_shortcut'  desc: 'replace @: with constructor:'      enabled: true  }
    { flag: 'header'                key: 'header'                desc: 'prefix with koffee version header' enabled: false }
    { flag: 'negative-index'        key: 'negative_index'        desc: 'replace a[-1] with a[-1..-1]'      enabled: true  }
    { flag: 'optional-commata'      key: 'optional_commata'      desc: 'insert commata when possible'      enabled: true  }
    { flag: 'rewrite'               key: 'rewrite'               desc: 'rewrite tokens'                    enabled: true  }
    { flag: 'meta'                  key: 'meta'                  desc: 'meta'                              enabled: true  }
]

hasFeature = (options, feature) -> options?.feature?[feature] != false

injectFeature = (options) -> # make sure that options has a feature set
    
    { extend, merge } = require './helpers'
    
    options ?= {}
    feature = {}
    FEATURES.map (f) -> feature[f.key] = f.enabled
    o = extend {}, options
    o.feature = extend feature, options.feature ? {}
    o

logFeatures = ->
    
    log "\n#{gray 'Features:'}\n\n#{ FEATURES.map((f) -> "    #{helpers.pad f.flag}#{gray f.desc}").join('\n') }\n"
    
    { logMetas } = require './meta'
    logMetas()
    
module.exports = { FEATURES, injectFeature, logFeatures, hasFeature }
