
#### constructor shortcut

```
    class C
    
        @: ->             # is an optional shortcut for ...
          
# 	constructor: -> 

```


    # Let's assume we need a function f, whose behavior should be configurable via it's arguments.
    # Let's also assume that the configuration will probably grow or change a lot over time.
    # It makes sense to use a config dictionary as the argument:
```coffeescript
    f = (cfg = a:1, b:2) -> log cfg
```    
    # The default values are nicely visible, let's use it:
```coffeescript
    f()           # -> { a: 1, b: 2 }        
    f a:4, b:8    # -> { a: 4, b: 8 }        All good so far.
    f b:8, a:4    # -> { b: 8, a: 4 }        We can even change the order, nice!
                                             
    f b:8         # -> { b: 8 }              Oops!
```coffee-script
    # Crap! We have to provide all the arguments? That sucks!
    
    # We need a better solution. Let's use the destructuring feature:
```    
    f = ({a:a=1, b:b=2}) -> log {a, b}   
```    
    # The arguments look a bit ugly, but hey, we got nice variable names now.
```    
    f {}          # -> { a: 1, b: 2 }  #     We need to provide an empty dictionary for the default behavior.
    f a:4, b:8    # -> { a: 4, b: 8 }  #     But at least it works as intended.
    f b:8         # -> { a: 1, b: 8 }  
    f a:8         # -> { a: 8, b: 2 }
```    
    # koffee provides a shortcut for this use case:
```    
    f = (a:1, b:2) -> log {a, b}   
    
    f {}          # -> { a: 1, b: 2 }
    f b:8         # -> { a: 1, b: 8 }
```

#### config arguments

```
    class Base
        
        @: (doLog:true, @a:1, @b:2) -> log @ if doLog
            
            
    new Base {}                 # -> Base { a: 1, b: 2 }
    new Base b:1, a:2           # -> Base { a: 2, b: 1 }
    
    class ClassDC extends Base
        
        @: (@d:3, @c:4) -> super
        
    new ClassDC b:'b'           # -> ClassDC { d: 3, c: 4, a: 1, b: 'b' }

    class ClassAC extends ClassDC
        
        @: (@a:5, @c:) -> 
            log @c              
            super
        
    new ClassAC {}              # -> ClassAC { a: 5, c: 4, d: 3, b: 2 }
```
