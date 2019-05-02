require('../../js/helpers').initTest() if not global.test

test "constructor shortcut", ->
    
    class A
        @: -> @p = 'A'

    a = new A
    eq a.p, 'A'

    class B
        @: (@p='B') ->

    b = new B
    eq b.p, 'B'
    
test "constructor shortcut spaced", ->
    
    class A
        @ : -> @p = 'A'

    a = new A
    eq a.p, 'A'

    class B
            @  :  -> @p = 'B'

    b = new B
    eq b.p, 'B'

    class C
            @  : (@p='C') ->

    c = new C
    eq c.p, 'C'
    
test "constructor shortcut invalid elsewhere", ->
    
    throws -> Koffee.compile "@:"
    throws -> Koffee.compile "a = @:1"
    throws -> Koffee.compile "d = @:(1+2)"
     
test "constructor shortcut in dictionary - weird, but ok", ->
    
    f = -> 2+3
    d = a:1, f:f, @: -> (1+2)
    
    ok d.constructor
    ok d.constructor instanceof Function
    eq typeof(d.constructor), 'function'
    
test "classes with value'd constructors", ->

    counter = 0
    classMaker = ->
        inner = ++counter
        ->
            @value = inner

    class One
        @: classMaker()

    class Two
        @: classMaker()

    eq (new One).value, 1
    eq (new Two).value, 2
    eq (new One).value, 1
    eq (new Two).value, 2
    
test "#1182: a subclass should be able to set its constructor to an external function", ->
    ctor = ->
        @val = 1
    class A
    class B extends A
        @: ctor
    eq (new B).val, 1

test "#1182: external constructors continued", ->
    ctor = ->
    class A
    class B extends A
        method: ->
        @: ctor
    ok B::method

test "#1313: misplaced __extends", ->
    nonce = {}
    class A
    class B extends A
        prop: nonce
        @: ->
    eq nonce, B::prop

test "#1182: execution order needs to be considered as well", ->
    counter = 0
    makeFn = (n) -> eq n, ++counter; ->
    class B extends (makeFn 1)
        @B: makeFn 2
        @: makeFn 3

test "#1182: external constructors with bound functions", ->
    fn = ->
        {one: 1}
        this
    class B
    class A
        @: fn
        method: => this instanceof A
    ok (new A).method.call(new B)
    
test "#1966: external constructors should produce their return value", ->
    ctor = -> {}
    class A then @: ctor
    ok (new A) not instanceof A
    
    
    