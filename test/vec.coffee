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
    
▸vec(a, b)
  
    # 2 * a
    # a * 2
    # a * a
    # b * b * b
    
    # (b * b) * b
    
    # b * b * b * b
    # (b * b) * b * b
    # (b * b * b) * b
    # (b * b * b * b)
    # (b * b) * (b * b)
    
    # a * f * a
    # b * f * f * b #  b.dot(f.times(b.times(f)))
    a * ((b * f) * 1.1 * 2.2 * (2*a)) * b
    # a * ((b * f) * (1.1 * 2.2) * (2*a)) * b
    # b * a * ((b * f) * (1.1 * 2.2) * (2*a)) * b
    # a * ((b * f) * (1.1 * 2.2) * (2*a)) * b * a
    # b * a * ((b * f) * 1.1 * 2.2 * (2*a)) * b
    # a + b + a
    # a - b - a
    
# r = d.dot(e) * f