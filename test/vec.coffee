# class Vec
    # times: (s) ->
    # plus:  (o) ->
    # minus: (o) ->
    # dot:   (o) ->

# a = new Vec
# b = new Vec
# c = new Vec

# ▸vec(a, b, c, d, e)

    # a = 1 * b * (c + a) * (2 * d)

▸vec(a, b, c)

    a * b
    a * Math.cos(b*c)
    Math.cos(3) * a
    a * 2
    a * a
    a * b * c

    (a * b) * c
    a * (b * c)

    b * b * b * b
    (b * b) * b * b
    (b * b * b) * b
    (b * b * b * b)
    (b * b) * (b * b)

    a * f * a
    b * f * f * b
    a * ((b * f) * 1.1 * 2.2 * (2*a)) * b
    a * ((b * f) * (1.1 * 2.2) * (2*a)) * b
    b * a * ((b * f) * (1.1 * 2.2) * (2*a)) * b
    a * ((b * f) * (1.1 * 2.2) * (2*a)) * b * a
    b * a * ((b * f) * 1.1 * 2.2 * (2*a)) * b
    a + b + c
    a - b
    a - b - c

    (a + b) - a + b - a
    a - (b - a) - b - a

    a * (a+b)
    (a-b) * c

▸vec(a, b, c, d, e)
    
    a + b - (c - b - a) 
    (b-a)*(a-b)
    b * a.length()
    (b-a).to(a-b)
    log a-b
    log a*b
    log a*b,b-c,a*d
    log 1,b-c,a*d,f
    
    if true
        r = a-b*c
        r = a*b
        r -= a*c
        r += a*d
        r *= a*e
        r ?= a*f
       
a = 1
b = c * d
        
# r = d.dot(e) * f