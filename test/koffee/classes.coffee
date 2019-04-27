
test "config constructors", ->
    
    class A
        constructor: (@prop='A', @dict = a:[1,2,3], b:'4') ->
            
    a = new A
    eq        a.prop, 'A'
    deepEqual a.dict, a:[1,2,3], b:'4'

test "method names", ->
    
    class A
        constructor: -> @name='A'
        @new: -> 'class'
        new: -> 'instance'
        A: -> 'constructor'
            
    a = new A
    eq a.name,  'A'
    eq A.new(), 'class'
    eq a.new(), 'instance'
    eq a.A(),   'constructor'
    
    eq A.constructor.name, 'Function'
    eq A.new.name, ''
    eq a.new.name, ''
    eq a.A.name,   ''
        
test "default arguments", ->
    
    class A
        constructor: (@a='A', @b, @c='C') ->
            
    a = new A 1, 2, 3
    eq a.a, 1
    eq a.b, 2
    eq a.c, 3

    a = new A 1, 2
    eq a.a, 1
    eq a.b, 2
    eq a.c, 'C'

    a = new A 1
    eq a.a, 1
    eq a.b, undefined
    eq a.c, 'C'

    a = new A
    eq a.a, 'A'
    eq a.b, undefined
    eq a.c, 'C'

    class B
        constructor: (@a='A', @b='B', @c) ->
    
    class C extends B
        constructor: (@a='Ab', @b, @c='Cb') ->
            super # C.__super__.constructor.apply(this, arguments)
            
    c = new C
    eq c.a, 'A'
    
    class D extends B
        constructor: (@a='Ab', @b, @c='Cb') ->
            super @a, @b, @c # D.__super__.constructor.call(this, this.a, this.b, this.c)

    d = new D
    eq d.a, 'Ab'
    
test "interesting 1", ->
    
    a = 'hello'
    b = 123
    c = [2.3,{}]
    o = {a,b,c}
    
    deepEqual o, a:'hello', b:123, c:[2.3,{}]
    
    A = 'hello'
    B = 'world'
    o = {B,A}
    
    eq o.A, 'hello'
    eq o.B, 'world'
    eq o.C, undefined
    
    {A, B, C} = {B:'hello',A:123}
    eq A, 123
    eq B, 'hello'
    eq C, undefined
    
test "hierarchy", ->    

    class A
        constructor: (arg) ->
            @prop = 'A-' + arg

    class B extends A
        constructor: (arg) ->
            super 'B-' + arg

    class C extends B
        constructor: ->
            super 'C'

    eq (new C).prop, 'A-B-C'
    