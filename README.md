## koffee 

is a clone of [Coffeescript](http://coffeescript.org) (Version 1) with a few enhancements.

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

### Negative indexing

```coffeescript
    s = "abcde"
    
    s[-1]        # -> 'e'
    
    "abcde"[-2]  # -> 'd'
    
    ('cde')[-3]  # -> 'c'
    
    [1,2,3][-2]  # -> 2
```

`v[-n]` is a shortcut for
- `v[v.length-n]` for identifiers and strings
- `v[-n..-n]`     for interpolated strings 
- `v[-n..-n][0]`  for arrays and scopes

`n` has to be a literal number. Passing variables with negative values still returns *undefined*.

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
    
We need a better solution. Let's use the *[destructuring feature](http://coffeescript.org/#destructuring)* of Coffeescript:

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

### Shortcut
 
**koffee** provides a nifty shortcut for this use case:

```coffeescript
    f = (a:1, b:2) -> log {a, b}  # Look, ma! The uglyness is gone :-)
```

The default values can be omitted:

```coffeescript
    f = (a:1, b:) -> log {a, b}
    
    f {}                          # -> { a: 1, b: null }
    f b:2                         # -> { a: 1, b: 2 }
```

### Inheritance and *super*

Let's see what happens if we use this feature for method arguments.

```coffeescript
    class Base
        @: (@a:'Base') -> log @

    class A extends Base
        @: (@a:'A') -> super

    new A {}                      # -> A { a: 'A' }
```

Note that the default value of `a` in `A` is **not** overridden by the one in `Base`. 

Here the behavior of a `super` call without brackets differs from that of Coffeescript. 
While the original applies the `arguments` unmodified (and thereby missing the destructuring assignment),
**koffee** does internally modify the arguments by applying 

```coffeescript
arguments[0] = _.defaults {a:@a}, arguments[0]
```

before the call to `super`. 

This will throw at runtime, if `_.defaults` is not defined. **koffee** simply assumes that either [underscore](https://underscorejs.org/) or [lodash](https://lodash.com/) is used.

## Compatibility

So far, the **koffee** *compiler* output should be compatible with the latest version of Coffeescript on the version 1 branch.

The added features only use syntax that was invalid in CS1, so koffee should be able to compile any valid CS1 code.

But some features have been changed or removed from the original:

- literal coffeescript is gone
- *kake* and *koffee* work slightly different than *cake* and *coffee*
- internal option parser replaced with [nopt](https://github.com/npm/nopt)

