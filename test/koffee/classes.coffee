
test "config constructors", ->
    
    class A
        constructor: (@prop='A') ->
            
    eq (new A).prop, 'A'

test "interesting 1", ->
    
    a = 'hello'
    b = 123
    c = [2.3,{}]
    o = {a,b,c}
    
    deepEqual o, a:'hello', b:123, c:[2.3,{}]
    
test "interesting 2", ->
    
    A = 'hello'
    B = 'world'
    o = {B,A}
    
    eq o.A, 'hello'
    eq o.B, 'world'
    eq o.C, undefined
    
test "interesting 3", ->
    
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