require('../../js/helpers').initTest() if not global.test

compile = (s) -> Koffee.compile s, bare:true, feature:color:false

check = (c,p) -> 
    js = compile(c)
    if -1 == js.indexOf p
        eq js, p

equal = (c,p) -> 
    js = compile(c)
    eq js, p
   
out = ''
run = (c) -> 
    out = ''
    Koffee.eval c, 
        feature:color:false
        source:'file.koffee'
        sandbox:console:log:->out+=[].slice.apply(arguments).join(' ')+'\n' # wow!-)

doc = (c) -> 
    out = ''
    Koffee.eval c, 
        feature:color:false
        doc:true
        source:'file.koffee'
        sandbox:console:log:->out+=[].slice.apply(arguments).join(' ')+'\n' # wow!-)
        
# 00     00  00000000  000000000   0000000         000  00000000  
# 000   000  000          000     000   000        000  000       
# 000000000  0000000      000     000000000        000  000000    
# 000 0 000  000          000     000   000        000  000       
# 000   000  00000000     000     000   000        000  000       

test "meta if" ->
            
    eq os?.platform, undefined
    equal "▸if os.platform()=='win' then no ▸else yes", require('os').platform()=='win' and 'false;;\n' or 'true;;\n'
    equal "▸if 0         then no ▸else yes", 'true;;\n'
    equal "▸if null      then no ▸else yes", 'true;;\n'
    equal "▸if undefined then no ▸else yes", 'true;;\n'
    equal "▸if ''        then no ▸else yes", 'true;;\n'
    equal "▸if {}        then no ▸else yes", 'true;;\n'
    equal "▸if true      then yes ▸else no", 'true;;\n'
    equal "▸if false     then yes ▸else no", 'false;;\n'
    
    equal "▸if 1         ▸then yes ▸else no", 'true;;\n'
    equal "▸if true      ▸then yes ▸else no", 'true;;\n'
    equal "▸if 'a'       ▸then yes ▸else no", 'true;;\n'
    equal "▸if []        ▸then yes ▸else no", 'true;;\n'
    
    equal "▸if 0         ▸then 1 ▸else 2; ▸if 3 ▸then 4 ▸else 5", '2;\n4;;;\n'
    
    equal "2;4;5", '2;\n4;\n5;\n\n'
    
    equal """
        ▸if 'a'
            'hello'
        ▸else 
            'world'""", "'hello';;\n"
    equal """
        ▸if false
            'hello'
        ▸else 
            'world'""", "'world';;\n"

    equal """
        ▸if false
            'hello'
        ▸else ▸if yes
            123
        ▸else 
            'world'""", "123;;\n"

    equal """
        ▸if false
            'hello'
        ▸elif yes
            345
        ▸else 
            'world'""", "345;;\n"

# 000000000  000  000      0000000    00000000  
#    000     000  000      000   000  000       
#    000     000  000      000   000  0000000   
#    000     000  000      000   000  000       
#    000     000  0000000  0000000    00000000  

test "meta if tilde" ->
            
    eq os?.platform, undefined
    equal "~>if os.platform()=='win' then no ~>else yes", require('os').platform()=='win' and 'false;;\n' or 'true;;\n'
    equal "~>if 0         then no ~>else yes", 'true;;\n'
    equal "~>if null      then no ~>else yes", 'true;;\n'
    equal "~>if undefined then no ~>else yes", 'true;;\n'
    equal "~>if ''        then no ~>else yes", 'true;;\n'
    equal "~>if {}        then no ~>else yes", 'true;;\n'
    equal "~>if true      then yes ~>else no", 'true;;\n'
    equal "~>if false     then yes ~>else no", 'false;;\n'
     
    equal "~>if 1         ~>then yes ~>else no", 'true;;\n'
    equal "~>if true      ~>then yes ~>else no", 'true;;\n'
    equal "~>if 'a'       ~>then yes ~>else no", 'true;;\n'
    equal "~>if []        ~>then yes ~>else no", 'true;;\n'
     
    equal "~>if 0         ~>then 1 ~>else 2; ~>if 3 ~>then 4 ~>else 5", '2;\n4;;;\n'
     
    equal "2;4;5", '2;\n4;\n5;\n\n'
     
    equal """
        ~>if 'a'
            'hello'
        ~>else 
            'world'""", "'hello';;\n"
    equal """
        ~>if false
            'hello'
        ~>else 
            'world'""", "'world';;\n"

    equal """
        ~>if false
            'hello'
        ~>else ~>if yes
            123
        ~>else 
            'world'""", "123;;\n"

    equal """
        ~>if false
            'hello'
        ~>elif yes
            345
        ~>else 
            'world'""", "345;;\n"
            
# 00000000   00000000    0000000   00000000  000  000      00000000  
# 000   000  000   000  000   000  000       000  000      000       
# 00000000   0000000    000   000  000000    000  000      0000000   
# 000        000   000  000   000  000       000  000      000       
# 000        000   000   0000000   000       000  0000000  00000000  

test "meta profile" ->

    check """
        ▸if ▸profile abc
            a 1
            b 2
            c 3
        """, """ 
        if (koffee_1_4 = process.hrtime.bigint()) {
            a(1);
            b(2);
            c(3);
            console.log('abc', (function(b){ let f=1000n; for (let u of ['ns','μs','ms','s']) { if (u=='s' || b<f) { return ''+(1000n*b/f)+' '+u; } f*=1000n; }})(process.hrtime.bigint()-koffee_1_4));
        };\n"""

    check """
        ▸if ▸profile then Math.sin(1)
        """, "if (koffee_1_4 = process.hrtime.bigint()) {\n    Math.sin(1)"

    check """
        ▸if ▸profile(test) then Math.sin(2)
        """, "if (koffee_1_4 = process.hrtime.bigint()) {\n    Math.sin(2);\n    console.log('test',"

    check """
        ▸if ▸profile test ▸then Math.sin(3)
        """, "if (koffee_1_4 = process.hrtime.bigint()) {\n    Math.sin(3);\n    console.log('test',"
    
    check """
        ▸if ▸profile
            ▸if ▸profile then bla()
        """, """
        if (koffee_1_4 = process.hrtime.bigint()) {
            if (koffee_2_8 = process.hrtime.bigint()) {
                bla();"""        

test "meta profile shortcut" ->
    
    check """
        ▸profile
            a 1
            b 2
            c 3
        """, """ 
        if (koffee_1_0 = process.hrtime.bigint()) {
            a(1);
            b(2);
            c(3);
            console.log('1_0', (function(b){ let f=1000n; for (let u of ['ns','μs','ms','s']) { if (u=='s' || b<f) { return ''+(1000n*b/f)+' '+u; } f*=1000n; }})(process.hrtime.bigint()-koffee_1_0));
        };\n"""
        
    check """
        ▸profile
            ▸profile
                ▸profile
                    a 1
        """, """
        if (koffee_1_0 = process.hrtime.bigint()) {
            if (koffee_2_4 = process.hrtime.bigint()) {
                if (koffee_3_8 = process.hrtime.bigint()) {
                    a(1);
                    console.log('3_8', (function(b){ let f=1000n; for (let u of ['ns','μs','ms','s']) { if (u=='s' || b<f) { return ''+(1000n*b/f)+' '+u; } f*=1000n; }})(process.hrtime.bigint()-koffee_3_8));
                };
                console.log('2_4', (function(b){ let f=1000n; for (let u of ['ns','μs','ms','s']) { if (u=='s' || b<f) { return ''+(1000n*b/f)+' '+u; } f*=1000n; }})(process.hrtime.bigint()-koffee_2_4));
            };
            console.log('1_0', (function(b){ let f=1000n; for (let u of ['ns','μs','ms','s']) { if (u=='s' || b<f) { return ''+(1000n*b/f)+' '+u; } f*=1000n; }})(process.hrtime.bigint()-koffee_1_0));
        };\n"""

    check """
        ▸profile 'hello1' sin 0.5
        """, """
        if (koffee_1_0 = process.hrtime.bigint()) {
            sin(0.5);
            console.log('hello1',"""
            
    check """▸profile() sin 0.5""", """
        if (koffee_1_0 = process.hrtime.bigint()) {
            sin(0.5);"""        
    
    check """▸profile sin 0.5""", """
        if (koffee_1_0 = process.hrtime.bigint()) {
            sin(0.5);"""        
    
    check """▸profile 123 sin 2""", """
        if (koffee_1_0 = process.hrtime.bigint()) {
            sin(2);
            console.log('123',"""

    check """▸profile "123" sin 2""", """
        if (koffee_1_0 = process.hrtime.bigint()) {
            sin(2);
            console.log('123',"""
            
    check """▸profile(hello3) sin 3""", """
        if (koffee_1_0 = process.hrtime.bigint()) {
            sin(3);
            console.log('hello3'"""
     
#  0000000  000000000   0000000   00000000   000000000        00000000  000   000  0000000    
# 000          000     000   000  000   000     000           000       0000  000  000   000  
# 0000000      000     000000000  0000000       000           0000000   000 0 000  000   000  
#      000     000     000   000  000   000     000           000       000  0000  000   000  
# 0000000      000     000   000  000   000     000           00000000  000   000  0000000    

test "start end" ->

    check """
        ▸start 'a'      
        f = -> ▸end 'a' 
        f()
    """, """
    koffee_a = process.hrtime.bigint();
    
    f = function() {
            console.log('a'"""
    
# 0000000    0000000     0000000   
# 000   000  000   000  000        
# 000   000  0000000    000  0000  
# 000   000  000   000  000   000  
# 0000000    0000000     0000000   

test "dbg" ->
    
    check """
    ▸dbg 'my object' a:1, b:2
    """, """
    console.log(':1', 'my object', {
        a: 1,
        b: 2
    });"""
    
#  0000000    0000000   0000000  00000000  00000000   000000000  
# 000   000  000       000       000       000   000     000     
# 000000000  0000000   0000000   0000000   0000000       000     
# 000   000       000       000  000       000   000     000     
# 000   000  0000000   0000000   00000000  000   000     000     

test "assert" ->
        
    # run """
        # ▸if ▸assert '1' then 1==2/2
        # ▸assert '2' 3/3==4/4
        # ▸assert '3!' 1==2/2.001
        # ▸assert '4!' 1!=2/2
        # f = ->
            # ▸assert '5!' false
            # ▸assert '6' true
        # f()"""
    #     
    # eq out, """
        # file.koffee:3 3!
        # file.koffee:4 4!
        # file.koffee:6 5!\n"""
    
    # TODO: interpolation in assert arg should work!
        
    # run """
    # a = 1
    # ▸assert "is #{a}==2?" a==2
    # """
    # eq out, """
    # file.koffee:2 is 1==2?\n"""
    
# 0000000     0000000    0000000  
# 000   000  000   000  000       
# 000   000  000   000  000       
# 000   000  000   000  000       
# 0000000     0000000    0000000  

test "doc" ->
                
    doc """
    ▸doc 'hello'
        
        world
        
        nice thing
    1
    """
    eq out, """
    ## hello
    
    world
    
    nice thing\n"""

    doc """
    ▸doc 'hello'
        world
        nice thing
    """
    eq out, """
    ## hello
    world
    nice thing\n"""

    doc """
    ▸doc 'hello'
    1+1
    ▸doc 'world'
                !!!
    2+2
    ▸doc
        
        nice
    3+3
    ▸doc
        thing
    """
    
    # worry about these  vvvv spaces?
    eq out, """## hello\n    \n## world\n!!!\n\nnice\nthing\n"""
    
test "doc as value" ->
    
    a = ▸doc 'is this possible?'
        'seems it is'
    eq a, ''

    d = b: ▸doc 'is this possible?'
        'seems it is'
    eq d.b, ''

    doc """
        a = ▸doc 'ha'
            'yes'
        d = b: ▸doc 'hb'
            'true'
        {a,d}
    """
    eq out, """
        ## ha
        'yes'
        ## hb
        'true'\n
    """
    
test 'single line' ->
    
    doesNotThrow -> Koffee.compile "▸doc 'is this possible?' 'yes'"
    
test "doesn't work" ->
    
    throws -> Koffee.compile "a = ▸doc 'is this possible?' ▸then 'no!'"
    throws -> Koffee.compile "▸doc 'is this possible?' ▸then 'no!'"
    throws -> Koffee.compile "▸doc 'is this possible?' then 'nope!'"
    
# 000   000  00000000   0000000  
# 000   000  000       000       
#  000 000   0000000   000       
#    000     000       000       
#     0      00000000   0000000  

test 'vec' ->
    
    equal """
        ▸vec(a, b, c, d)
            d = 4 * b * c * 3       
            a = b + c + d
            d = 5 + b * c
            d = b * c + 5
            d = a * b * c 
    """ """
        var a, d;
        
        d = c.dot(b.times(4)) * 3;
        a = b.plus(c).plus(d);
        d = 5 + b.dot(c);
        d = b.dot(c) + 5;
        d = c.times(a.dot(b));;\n"""
    