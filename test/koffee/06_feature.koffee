require('../../js/helpers').initTest() if not global.test

compile = (s,o) -> Koffee.compile s,o

check = (c,o,p) -> 
    js = compile c,o
    if -1 == js.indexOf p
        eq js, p

equal = (c,o,p) -> 
    js = compile c, o
    eq js, p
        
test "feature headers", ->
         
    equal '1+1', {}, """
    (function() {
        1 + 1;
    
    }).call(this);\n"""
    
    equal '1+1', bare:true, '1 + 1;\n'   
    equal '1+2', bare:true, feature:header:false, '1 + 2;\n'   
    check '1+3', bare:true, feature:header:true,  '// koffee '   
    equal '1+4', bare:true, feature:meta:false,   '1 + 4;\n'   

test "feature color" ->
         
    equal "▸dbg 'debug' 1+1", bare:true, "console.log('[2m[34m:[39m[22m[94m1[39m', '[1m[97mdebug[39m[22m', 1 + 1);\n"
    
test "feature color false" ->
    
    equal "▸dbg 'debug' 1+2", bare:true, feature:color:false, "console.log(':1', 'debug', 1 + 2);\n"
    
test "feature config parameters", ->
    
    run = (c,o,p) -> 
        r = Koffee.eval c, extend {sandbox:{_:_}}, o
        eq r,p
    
    # make sure the new super call behaviour isn't active in old style destructuring code
        
    run """
    class B
        @: ({a:@a = 1}) ->
        
    class A extends B
        @: ({a:@a = 2}) -> super
        
    a = new A {}
    a.a
    """, {}, 1

    # make sure the new super call behaviour is active when using the new style
    
    run """
    class B
        @: (@a:3) ->
         
    class A extends B
        @: (@a:4) -> super
          
    a = new A {}
    a.a 
    """, {}, 4
    
    # make sure we can turn it off
    
    throws -> run """
    class B
        @: (@a:3) ->
         
    class A extends B
        @: (@a:4) -> super
          
    a = new A {}
    a.a 
    """, feature:config_parameters:false, 4
    
    