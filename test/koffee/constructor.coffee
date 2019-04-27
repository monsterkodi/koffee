
test "shortcut", ->
    
    class A
        @: -> @p = 'A'

    a = new A
    eq a.p, 'A'
    
test "shortcut spaced", ->
    
    class A
        @ : -> @p = 'A'

    a = new A
    eq a.p, 'A'

    class B
            @  :  -> @p = 'B'

    b = new B
    eq b.p, 'B'
    