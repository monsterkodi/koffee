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
            
# 000   000  00000000   0000000  
# 000   000  000       000       
#  000 000   0000000   000       
#    000     000       000       
#     0      00000000   0000000  
        
test 'times' ->

    equal """
        ▸vec(a)
            a * 1.2
            1.2 * a
            a * 3
            3 * a
            a * b
            b * a
            a * Math.cos(0.5)
            Math.cos(0.5) * a
    """ """
        a.times(1.2);
        a.times(1.2);
        a.times(3);
        a.times(3);
        a.times(b);
        a.times(b);
        a.times(Math.cos(0.5));
        a.times(Math.cos(0.5));;\n"""
        
test 'div' ->

    equal """
        ▸vec(a)
            a / 3
            a / 1.2
            a / Math.cos(0.5)
            a * 2/3
            a * (2/3)
            2/3 * a
            a / 1.2
            1/1.2 * a
            a * 1/f
            1/f * a
            a * 1/Math.cos(0.5)
            1/Math.cos(0.5) * a
            a / 2 / 3
    """ """
        a.times(1 / 3);
        a.times(1 / 1.2);
        a.times(1 / Math.cos(0.5));
        a.times(2).times(1 / 3);
        a.times(2 / 3);
        a.times(2 / 3);
        a.times(1 / 1.2);
        a.times(1 / 1.2);
        a.times(1).times(1 / f);
        a.times(1 / f);
        a.times(1).times(1 / Math.cos(0.5));
        a.times(1 / Math.cos(0.5));
        a.times(1 / 2).times(1 / 3);;\n"""
        
test 'dot2' ->

    equal """
        ▸vec(a,b)
            a * a
            a * b
            b * b
            a * c
            c * b
    """ """
        a.dot(a);
        a.dot(b);
        b.dot(b);
        a.times(c);
        b.times(c);;\n"""

test 'dot3' ->

    equal """
        ▸vec(a,b,c)
            a * a * a
            a * b * c
            (a * b) * c
            a * (b * c)
            (a * b * c)
    """ """
        a.times(a.dot(a));
        c.times(a.dot(b));
        c.times(a.dot(b));
        a.times(b.dot(c));
        c.times(a.dot(b));;\n"""

test 'dot4' ->

    equal """
        ▸vec(a,b,c,d)
            b * b * b * b
            (b * b) * b * b
            (b * b * b) * b
            (b * b * b * b)
            (b * b) * (b * b)
    """ """
        b.dot(b.times(b.dot(b)));
        b.dot(b.times(b.dot(b)));
        b.dot(b.times(b.dot(b)));
        b.dot(b.times(b.dot(b)));
        (b.dot(b)) * (b.dot(b));;\n"""
 

test 'plus minus' ->

    equal """
        ▸vec(a,b,c)
            a-b
            b-a
            b- c
            a - b
            a - b - c
            a + b + c
            (a + b) - a + b - a
            a - (b - a) - b - a
            a + b - (c - b - a)
            log a-b
            log "hello #{'#'}{a-b}"
    """ """
        a.minus(b);
        b.minus(a);
        b.minus(c);
        a.minus(b);
        a.minus(b).minus(c);
        a.plus(b).plus(c);
        (a.plus(b)).minus(a).plus(b).minus(a);
        a.minus(b.minus(a)).minus(b).minus(a);
        a.plus(b).minus(c.minus(b).minus(a));
        console.log(a.minus(b));
        console.log("hello " + (a.minus(b)));;\n"""


test 'block' ->
                
    equal """
        ▸vec(a, b, c, d)
            
            f = ->
                a * (a+b)
                (a-b) * c
                (b-a)*(a-b)
                d = ->
                    b * a.length()
                    (b-a).to(a-b)
                d b*a
            f a - b
            log a-b
            
            switch a*c
                when 'a' then log a*b,b-c
                when 'b'
                    a*b;b-c
                else
                    log a*b if a-d

            log 1,b-c, if 1 then a*d else f
        
            if true
                r = a-b*c
                r = a*b
                r -= a*c
            else
                r += a*d
                r *= a*e
                r ?= a*f
    """ """
        var f, r;
        
        f = function() {
            var d;
            a.dot(a.plus(b));
            c.dot(a.minus(b));
            (b.minus(a)).dot(a.minus(b));
            d = function() {
                b.times(a.length());
                return (b.minus(a)).to(a.minus(b));
            };
            return d(b.dot(a));
        };
        f(a.minus(b));
        console.log(a.minus(b));
        switch (a * c) {
            case 'a':
                console.log(a.dot(b), b.minus(c));
                break;
            case 'b':
                a.dot(b);
                b.minus(c);
                break;
            default:
                if (a - d) {
                    console.log(a.dot(b));
                }
        }
        console.log(1, b.minus(c), 1 ? a.dot(d) : f);
        if (true) {
            r = a.minus(b.dot(c));
            r = a.dot(b);
            r -= a.dot(c);
        } else {
            r += a.dot(d);
            r *= a.times(e);
            if (r != null) {
                r;
            } else {
                r = a.times(f);
            }
        };\n"""

test 'scope' ->
    equal """
        a * b
        c - d
        ▸vec(a, b, c, d)
            a = c - d
            b = c * d
        a * b
        c - d
    """ """
        var a, b;
        
        a * b;
        
        c - d;
        
        a = c.minus(d);
        b = c.dot(d);;
        
        a * b;
        
        c - d;\n"""

test 'misc1' ->
    
    equal """
        ▸vec(a, b, c, d)
            a * ((b * f) * 1.1 * 2.2 * (2*a)) * b
            a * ((b * f) * (1.1 * 2.2) * (2*a)) * b
            b * a * ((b * f) * (1.1 * 2.2) * (2*a)) * b
            a * ((b * f) * (1.1 * 2.2) * (2*a)) * b * a
            b * a * ((b * f) * 1.1 * 2.2 * (2*a)) * b
        """ """
        b.dot(a.times((b.times(f)).times(1.1).times(2.2).dot(a.times(2))));
        b.dot(a.times((b.times(f)).times(1.1 * 2.2).dot(a.times(2))));
        b.times(b.dot(a) * ((b.times(f)).times(1.1 * 2.2).dot(a.times(2))));
        a.times(b.dot(a.times((b.times(f)).times(1.1 * 2.2).dot(a.times(2)))));
        b.times(b.dot(a) * ((b.times(f)).times(1.1).times(2.2).dot(a.times(2))));;\n"""

test 'misc2' ->
    
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
        