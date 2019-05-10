## koffee 

is a clone of [Coffeescript](http://coffeescript.org) (Version 1) with a few enhancements.

## Constructor shortcut

```coffeescript
class C
    @: ->           
```

... is an *optional* shortcut for ...

```coffeescript
class C          
    constructor: -> 
```

## Negative indexing

```coffeescript
s = "abcde"

s[-1]        # -> 'e'
"abcde"[-2]  # -> 'd'
('cde')[-3]  # -> 'c'
[1,2,3][-2]  # -> 2

a = -2
s[a]         # -> undefined
```

`v[-n]` is a shortcut for `v[-n..-n][0]` for number literals `n`. 
Passing variables with negative values still returns *undefined*.

## Console shortcuts

```coffeescript
log 'hello'  # -> hello
warn 'world' # -> world
error '!'    # -> !
```

Simple shortcuts for `log`, `warn` and `error` methods of `console`.

By the way, did I mention that all **koffee** features are individually toggleable? 
E.g., this one can be deactivated by passing the commandline flag `--no-console-shortcut` to the *koffee* command or by
setting a flag in the options when calling module methods:

```coffeescript
koffee = require 'koffee'
koffee.compile code, feature:console_shortcut:false
```

## Optional commata

Coffeescript has a very nice way of initializing arrays:

```coffeescript
a = [
   1
   2
   3
]
```

If you decide to join these into a single line, you have a problem: for each of the lines a comma must be inserted.
The same goes for objects that span over multiple lines. 

In **koffee**, you don't need to insert commata after number or string primitives and POD structures.
Those are all valid expressions:

```
a = [ 1 2 3 ]           
a = { b:1 c:2 d:3 }   
a =   b:1 c:2 d:3
a =   b:[ c:2 'd' 3 ]  
a = [ [1 2] [d:3] ]
log 'a:' a , 'd:' 3      
```

We are probably reaching the limits of minimalism here :)

## Meta Macros

**koffee** allows you to control which blocks of code get compiled into JavaScript:

```coffeescript
▸if false               # this block won't be compiled to .js
    code to             # 
    exclude from        # 
    compilation         # 

▸elif true              # this branch is switched on, so
    log 'hello'         # + these two lines 
    log 'world'         # + will be compiled
    
▸else                   # another ignored block
    null                # 
```

You can provide code in the condition, which will be evaluated at compile time


```coffeescript
▸if os.platform()=='darwin' ▸then log 'mac' ▸else process.exit 0
```

will compile to 

```javascript
console.log("mac");
```
on macOS, on other platforms it will produce

```javascript
process.exit(0);
```

If the condition part of `▸if` starts with a `▸`, a lookup will be made into the compile options meta map.
If a matching entry is found, the provided coffeescript blocks can be modified arbitrarily before they are written to JavaScript.
When the macro is only operating on one block of code, you can omit the leading `▸if`.

The default map includes some simple but useful examples that use this feature. 

```coffeescript
                                # log file position and object
▸dbg 'my object' a:1, b:2       # -> file:1 my object { a: 1, b: 2 }

                                # log execution times  
▸profile 'sum'                  # -> 6_4 1ms          line_col prefix
    ▸profile s1()               # -> 7_4 2ms          if not named
    ▸profile s2()               # -> sum 3ms
    
▸start 'a'                      # like ▸profile, but lets you control
f = -> ▸end 'a'                 # when to start and stop timing
f()                             # -> a 824μs
    
▸test 'info'                    # will only be compiled if --test flag is set
    myTest()                    # includes logs for each test block
```

## Config arguments

Still here? Nice!

The last feature might be easier to understand with a little bit of motivation up front: 

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
f = ({a=1, b=2}) -> log {a, b}   
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

f {}          # -> { a: 1, b: null }
f b:2         # -> { a: 1, b: 2 }
```

### Inheritance and *super*

Let's see what happens if we use this feature for method arguments.

```coffeescript
class Base
    @: (@a:'Base') -> log @

class A extends Base
    @: (@a:'A') -> super

new A {}      # -> A { a: 'A' }
```

Note that the default value of `a` in `A` is **not** overridden by the one in `Base`. 

Here the behavior of a `super` call without brackets differs from that of Coffeescript. 
While the original applies the `arguments` unmodified (and thereby missing the destructuring assignment),
**koffee** does internally modify the arguments by inserting 

```coffeescript
arguments[0] = _.defaults {a:@a}, arguments[0]
```

immediately before applying `super`.

This will throw at runtime, if `_.defaults` is not defined. **koffee** simply assumes that either [underscore](https://underscorejs.org/) or [lodash](https://lodash.com/) is used.

## Compatibility

So far, the **koffee** *compiler* output should be compatible with the latest version of Coffeescript on the version 1 branch.

The added features only use syntax that was invalid in CS1, so koffee should be able to compile any valid CS1 code.
CS2 code should compile as well, but this is untested.

Some features have been changed or removed:

- literal coffeescript is gone
- *kake* and *koffee* work slightly different than *cake* and *coffee*
- internal option parser replaced with [nopt](https://github.com/npm/nopt)

