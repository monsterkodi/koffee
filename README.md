koffee is a clone of Coffeescript 1

### constructor shortcut

```coffeescript
    class C
    
        @: ->           
```

... is an **optional** shortcut for ...

```coffeescript
    class C          
        
        constructor: -> 
```

### config arguments

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
    
We need a better solution. Let's use the destructuring feature:

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

#### koffee shortcut
 
koffee provides a nifty shortcut for this use case:

```coffeescript
    f = (a:1, b:2) -> log {a, b}  # Look, ma! The uglyness is gone :-)
    
    f {}          # -> { a: 1, b: 2 }
    f b:8         # -> { a: 1, b: 8 }
```

Almost like named parameters in other languages.

### inheritance and super

Let's see what happens if we use this feature for method arguments.

```coffeescript
    class Base
        
        @: (doLog:true, @a:'Base', @b:'Base') ->   # note that a and b are assiged to this
            log @ if doLog
            
    new Base {}                   # -> Base { a: 'Base', b: 'Base' }
    new Base b:1, a:2             # -> Base { a: 2, b: 1 }
    
    class ClassDC extends Base
        
        @: (@d:'DC', @c:'DC') -> super
        
    new ClassDC b:'myBase'        # -> ClassDC { d: 'D', c: 'C', a: 'Base', b: 'myBase' }
```

ClassDC doesn't care about `b`, but it is still available in Base.

If a subclass **does** care about a parameter, but doesn't want to change the default in Base:

```coffeescript
    class ClassC extends ClassDC
        
        @: (@c:) ->               # this is equivalent to @c:null
            log "before: #{@c}"   # -> before: myC
            super                 # -> ClassC { c: 'myC', d: 'DC', a: 'Base', b: 'Base' }
            log "after:  #{@c}"   # -> after:  myC
            
    new ClassC c:'myC'

    class Class extends ClassDC
        
        @: () -> 
            log "before: #{@c}"   # -> before: undefined
            super                 # -> Class { d: 'DC', c: 'myC', a: 'Base', b: 'Base' }
            log "after:  #{@c}"   # -> after:  myC
            
    new Class c:'myC'       
```
