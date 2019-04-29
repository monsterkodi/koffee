## koffee 

is a clone of Coffeescript 1 with a few enhancements.

### Constructor shortcut

```coffeescript
    class C
    
        @: ->           
```

... is an **optional** shortcut for ...

```coffeescript
    class C          
        
        constructor: -> 
```

The next feature might be easier to understand with a little bit of motivation up front: 

### Config arguments

Let's assume we need a function `f`, whose behavior should be configurable via it's arguments.
Let's also assume that the configuration will probably grow or change a lot over time.
It makes sense to use a config dictionary as the argument:

```coffeescript
    f = (cfg = a:1, b:2) -> log cfg
```    
The default values are nicely visible, let's use it:

```coffeescript
    f()           # -> { a: 1, b: 2 }        
    f a:4, b:8    # -> { a: 4, b: 8 }        All good so far.
    f b:8, a:4    # -> { b: 8, a: 4 }        We can even change the order, nice!
                                             
    f b:8         # -> { b: 8 }              Oops!
```

Crap! We have to provide all the arguments? That sucks!
    
We need a better solution. Let's use the *destructuring feature* of Coffeescript:

```coffeescript
    f = ({a:a=1, b:b=2}) -> log {a, b}   
```

The arguments look a bit ugly, and we need to provide an empty dictionary for the default behavior. 
But hey, we got nice variable names inside `f` now and it works as intended:

```coffeescript    
    f {}          # -> { a: 1, b: 2 }  
    f a:4, b:8    # -> { a: 4, b: 8 }  
    f      b:8    # -> { a: 1, b: 8 }  
    f a:8         # -> { a: 8, b: 2 }
```    

#### Shortcut
 
koffee provides a nifty shortcut for this use case:

```coffeescript
    f = (a:1, b:2) -> log {a, b}  # Look, ma! The uglyness is gone :-)
    
    f {}          # -> { a: 1, b: 2 }
    f b:8         # -> { a: 1, b: 8 }
```

Almost like named parameters in other languages.

### Inheritance and `super`

Let's see what happens if we use this feature for method arguments.

```coffeescript
    class Base
        @: (@a:'Base') -> log @

    class A
        @: (@a:'A') -> super

    new A {}                      # -> A { a: 'A' }
```

Note that the default value of `a` in `A` is **not** overridden by the one in `Base`. 

```coffeescript
    class Base
        
        @: (doLog:true, @a:'Base', @b:'Base') ->   # only a and b are assigned to @
            log @ if doLog
            
    new Base {}                   # -> Base { a: 'Base', b: 'Base' }
    new Base b:1, a:2             # -> Base { a: 2, b: 1 }
    
    class BC extends Base
        
        @: (@b:'BC', @c:'BC') -> super
        
    new BC a:'myA'                # -> BC { a: 'myA', b: 'BC', c: 'BC' }
```

`BC` doesn't care about parameter `a`, but it is still available in `Base`.

If a subclass **does** care about a parameter, but doesn't want to change the default of `Base`:

```coffeescript
    class A extends Base
        
        @: (@a:) ->               # this is equivalent to @a:null
            log "before: #{@a}"   # -> before: myA
            super                 # -> A { a: 'myA', b: 'Base' }
            log "after:  #{@a}"   # -> after:  myA
            
    new A a:'myA'

    class Ignorant extends Base
        
        @: () -> 
            log "before: #{@a}"   # -> before: undefined
            super                 # -> N { a: 'myA', b: 'Base' }
            log "after:  #{@a}"   # -> after:  myA
            
    new Ignorant a:'myA'
```


