
#### constructor shortcut

```
    class C
    
        @: ->             # is an optional shortcut for ...
          
# 	constructor: -> 

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
        
        @: (@a:5, @c:) -> super
        
    new ClassAC {}              # -> ClassAC { a: 5, c: 4, d: 3, b: 2 }
```
