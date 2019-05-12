# Error Formatting
# ----------------
# Ensure that errors of different kinds (lexer, parser and compiler) are shown in a consistent way.

require('../../js/helpers').initTest() if not global.test

# test = -> # ALL TESTS HERE DISABLED!

assertErrorFormat = (code, expectedError) ->
    throws (-> Koffee.run code, feature:color:false), (err) ->
        receivedError = "#{err}".split('\n')[1..].join('\n')
        ceq receivedError, expectedError
        yes

test "lexer errors formatting", ->
    assertErrorFormat '''
        normalObject        = {}
        insideOutObject = }{
    ''',
    '''
        insideOutObject = }{
                          ▲ unmatched }
    '''

test "parser error formatting", ->
    assertErrorFormat '''
        foo in bar or in baz
    ''',
    '''
        foo in bar or in baz
                      ▲▲ unexpected in
    '''

test "compiler error formatting", ->
    assertErrorFormat '''
        evil = (foo, eval, bar) ->
    ''',
    '''
        evil = (foo, eval, bar) ->
                     ▲▲▲▲ 'eval' can't be assigned
    '''

test "compiler error formatting with mixed tab and space", ->
    assertErrorFormat """
        \t  if a
        \t  test
    """,
    '''
        \t  if a
        \t  ▲▲ unexpected if
    '''


if require?
    os   = require 'os'
    fs   = require 'fs'
    path = require 'path'

    test "patchStackTrace line patching", ->
        err = new Error 'error'
        ok err.stack.match /test[\/\\]coffee[\/\\]error_messages\.coffee:\d+:\d+\b/

    test "patchStackTrace stack prelude consistent with V8", ->
        err = new Error
        ok err.stack.match /^Error\n/ # Notice no colon when no message.

        err = new Error 'error'
        ok err.stack.match /^Error: error\n/

    test "#2849: compilation error in a require()d file", ->
        # Create a temporary file to require().
        tempFile = path.join os.tmpdir(), 'syntax-error.coffee'
        ok not fs.existsSync tempFile
        fs.writeFileSync tempFile, 'foo in bar or in baz'

        try
            assertErrorFormat """
                require '#{tempFile.replace /\\/g, '\\\\'}'
            """,
            """
                foo in bar or in baz
                              ▲▲ unexpected in
            """
        finally
            fs.unlinkSync tempFile

    test "#3890 Error.prepareStackTrace doesn't throw an error if a compiled file is deleted", ->
        # Adapted from https://github.com/atom/coffee-cash/blob/master/spec/coffee-cash-spec.coffee
        filePath = path.join os.tmpdir(), 'PrepareStackTraceTestFile.coffee'
        fs.writeFileSync filePath, "module.exports = -> throw new Error('hello world')"
        throwsAnError = require filePath
        fs.unlinkSync filePath

        try
            throwsAnError()
        catch error

        eq error.message, 'hello world'
        doesNotThrow(-> error.stack)
        notEqual error.stack.toString().indexOf(filePath), -1

    test "require #4418 stack traces for compiled files reference the correct line number", ->
        
        filePath = path.join os.tmpdir(), 'StackTraceLineNumberTestFile.coffee'
        fileContents = """
            testCompiledFileStackTraceLineNumber = ->
                # `a` on the next line is undefined and should throw a ReferenceError
                console.log a if true

            do testCompiledFileStackTraceLineNumber
            """
        fs.writeFileSync filePath, fileContents

        try
            require filePath
        catch error
        
        fs.unlinkSync filePath

        # Make sure the line number reported is 
        # line 3 (the original Coffee source) and not 
        # line 6 (the generated JavaScript).
                
        eq /StackTraceLineNumberTestFile.coffee:(\d)/.exec(error.stack.toString())[1], '3'

test "no require #4418 stack traces for compiled strings reference the correct line number", ->
    try
        Koffee.run """
            testCompiledStringStackTraceLineNumber = ->
                # `a` on the next line is undefined and should throw a ReferenceError
                console.log a if true

            do testCompiledStringStackTraceLineNumber
            """
    catch error

    # Make sure the line number reported is line 3 (the original Coffee source)
    # and not line 6 (the generated JavaScript).
    
    eq /at testCompiledStringStackTraceLineNumber.*:(\d):/.exec(error.stack.toString())[1], '3'

test "#1096: unexpected generated tokens", ->
    # Implicit ends
    assertErrorFormat 'a:, b', '''
        a:, b
          ▲ unexpected ,
    '''
    # Explicit ends
    assertErrorFormat '(a:)', '''
        (a:)
           ▲ unexpected )
    '''
    # Unexpected end of file
    assertErrorFormat 'a:', '''
        a:
          ▲ unexpected end of input
    '''
    assertErrorFormat 'a +', '''
        a +
           ▲ unexpected end of input
    '''
    # Unexpected key in implicit object (an implicit object itself is _not_
    # unexpected here)
    assertErrorFormat '''
        for i in [1]:
            1
    ''', '''
        for i in [1]:
                 ▲ unexpected [
    '''
    # Unexpected regex
    assertErrorFormat '{/a/i: val}', '''
        {/a/i: val}
         ▲▲▲▲ unexpected regex
    '''
    assertErrorFormat '{///a///i: val}', '''
        {///a///i: val}
         ▲▲▲▲▲▲▲▲ unexpected regex
    '''
    assertErrorFormat '{///#{a}///i: val}', '''
        {///#{a}///i: val}
         ▲▲▲▲▲▲▲▲▲▲▲ unexpected regex
    '''
    # Unexpected string
    assertErrorFormat 'import foo from "lib-#{version}"', '''
        import foo from "lib-#{version}"
                        ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲ the name of the module to be imported from must be an uninterpolated string
    '''

    # Unexpected number
    
    # different error in koffee, see optional_commata
    
    # assertErrorFormat '"a"0x00Af2', '''
    #     "a"0x00Af2
    #        ▲▲▲▲▲▲▲ unexpected number
    # '''

test "#1316: unexpected end of interpolation", ->
    assertErrorFormat '''
        "#{+}"
    ''', '''
        "#{+}"
            ▲ unexpected end of interpolation
    '''
    assertErrorFormat '''
        "#{++}"
    ''', '''
        "#{++}"
             ▲ unexpected end of interpolation
    '''
    assertErrorFormat '''
        "#{-}"
    ''', '''
        "#{-}"
            ▲ unexpected end of interpolation
    '''
    assertErrorFormat '''
        "#{--}"
    ''', '''
        "#{--}"
             ▲ unexpected end of interpolation
    '''
    assertErrorFormat '''
        "#{~}"
    ''', '''
        "#{~}"
            ▲ unexpected end of interpolation
    '''
    assertErrorFormat '''
        "#{!}"
    ''', '''
        "#{!}"
            ▲ unexpected end of interpolation
    '''
    assertErrorFormat '''
        "#{not}"
    ''', '''
        "#{not}"
              ▲ unexpected end of interpolation
    '''
    assertErrorFormat '''
        "#{5) + (4}_"
    ''', '''
        "#{5) + (4}_"
            ▲ unmatched )
    '''
    # #2918
    assertErrorFormat '''
        "#{foo.}"
    ''', '''
        "#{foo.}"
               ▲ unexpected end of interpolation
    '''

test "#3325: implicit indentation errors", ->
    assertErrorFormat '''
        i for i in a then i
    ''', '''
        i for i in a then i
                     ▲▲▲▲ unexpected then
    '''

test "explicit indentation errors", ->
    assertErrorFormat '''
        a = b
            c
    ''', '''
            c
        ▲▲▲▲ unexpected indentation
    '''

test "unclosed strings", ->
    assertErrorFormat '''
        '
    ''', '''
        '
        ▲ missing '
    '''
    assertErrorFormat '''
        "
    ''', '''
        "
        ▲ missing "
    '''
    assertErrorFormat """
        '''
    """, """
        '''
        ▲▲▲ missing '''
    """
    assertErrorFormat '''
        """
    ''', '''
        """
        ▲▲▲ missing """
    '''
    assertErrorFormat '''
        "#{"
    ''', '''
        "#{"
           ▲ missing "
    '''
    assertErrorFormat '''
        """#{"
    ''', '''
        """#{"
             ▲ missing "
    '''
    assertErrorFormat '''
        "#{"""
    ''', '''
        "#{"""
           ▲▲▲ missing """
    '''
    assertErrorFormat '''
        """#{"""
    ''', '''
        """#{"""
             ▲▲▲ missing """
    '''
    assertErrorFormat '''
        ///#{"""
    ''', '''
        ///#{"""
             ▲▲▲ missing """
    '''
    assertErrorFormat '''
        "a
            #{foo """
                bar
                    #{ +'12 }
                baz
                """} b"
    ''', '''            #{ +'12 }\n                ▲ missing \''''
    # https://github.com/jashkenas/Koffee/issues/3301#issuecomment-31735168
    assertErrorFormat '''
        # Note the double escaping; this would be `"""a\"""` real code.
        """a\\"""
    ''', '''
        """a\\"""
        ▲▲▲ missing """
    '''

test "unclosed heregexes", ->
    assertErrorFormat '''
        ///
    ''', '''
        ///
        ▲▲▲ missing ///
    '''
    # https://github.com/jashkenas/Koffee/issues/3301#issuecomment-31735168
    assertErrorFormat '''
        # Note the double escaping; this would be `///a\///` real code.
        ///a\\///
    ''', '''
        ///a\\///
        ▲▲▲ missing ///
    '''

test "unexpected token after string", ->
    # Parsing error.
    
    # different errors in koffee, see optional_commata
    
    # assertErrorFormat '''
    #     'foo'bar
    # ''', '''
    #     'foo'bar
    #          ▲▲▲ unexpected identifier
    # '''
    # assertErrorFormat '''
    #     "foo"bar
    # ''', '''
    #     "foo"bar
    #          ▲▲▲ unexpected identifier
    # '''
    # Lexing error.
    assertErrorFormat '''
        'foo'bar'
    ''', '''
        'foo'bar'
                ▲ missing '
    '''
    assertErrorFormat '''
        "foo"bar"
    ''', '''
        "foo"bar"
                ▲ missing "
    '''

test "#3348: Location data is wrong in interpolations with leading whitespace", ->
    assertErrorFormat '''
        "#{ * }"
    ''', '''
        "#{ * }"
            ▲ unexpected *
    '''

test "octal escapes", ->
    assertErrorFormat '''
        "a\\0\\tb\\\\\\07c"
    ''', '''
        "a\\0\\tb\\\\\\07c"
        \    \   \ \ ▲▲▲ octal escape sequences are not allowed \\07
    '''
    assertErrorFormat '''
        "a
            #{b} \\1"
    ''', '''
        \    #{b} \\1"
        \         ▲\▲ octal escape sequences are not allowed \\1
    '''
    assertErrorFormat '''
        /a\\0\\tb\\\\\\07c/
    ''', '''
        /a\\0\\tb\\\\\\07c/
        \    \   \ \ ▲▲▲ octal escape sequences are not allowed \\07
    '''
    assertErrorFormat '''
        /a\\1\\tb\\\\\\07c/
    ''', '''
        /a\\1\\tb\\\\\\07c/
        \    \   \ \ ▲▲▲ octal escape sequences are not allowed \\07
    '''
    assertErrorFormat '''
        ///a
            #{b} \\01///
    ''', '''
        \    #{b} \\01///
        \         ▲▲▲ octal escape sequences are not allowed \\01
    '''

test "#3795: invalid escapes", ->
    assertErrorFormat '''
        "a\\0\\tb\\\\\\x7g"
    ''', '''
        "a\\0\\tb\\\\\\x7g"
        \    \   \ \ ▲▲▲▲ invalid escape sequence \\x7g
    '''
    assertErrorFormat '''
        "a
            #{b} \\uA02
         c"
    ''', '''
        \    #{b} \\uA02
        \         ▲\▲▲▲▲ invalid escape sequence \\uA02
    '''
    assertErrorFormat '''
        /a\\u002space/
    ''', '''
        /a\\u002space/
          ▲\▲▲▲▲▲ invalid escape sequence \\u002s
    '''
    assertErrorFormat '''
        ///a \\u002 0 space///
    ''', '''
        ///a \\u002 0 space///
             ▲\▲▲▲▲▲ invalid escape sequence \\u002 \
    '''
    assertErrorFormat '''
        ///a
            #{b} \\x0
         c///
    ''', '''
        \    #{b} \\x0
        \         ▲▲▲ invalid escape sequence \\x0
    '''
    assertErrorFormat '''
        /ab\\u/
    ''', '''
        /ab\\u/
           ▲\▲ invalid escape sequence \\u
    '''

test "illegal herecomment", ->
    assertErrorFormat '''
        ###
            Regex: /a*/g
        ###
    ''', '''
        \    Regex: /a*/g
        \             ▲▲ block comments cannot contain */
    '''

test "#1724: regular expressions beginning with *", ->
    assertErrorFormat '''
        /* foo/
    ''', '''
        /* foo/
         ▲ regular expressions cannot begin with *
    '''
    assertErrorFormat '''
        ///
            * foo
        ///
    ''', '''
        \    * foo
        \    ▲ regular expressions cannot begin with *
    '''

test "invalid regex flags", ->
    assertErrorFormat '''
        /a/ii
    ''', '''
        /a/ii
           ▲▲ invalid regular expression flags ii
    '''
    assertErrorFormat '''
        /a/G
    ''', '''
        /a/G
           ▲ invalid regular expression flags G
    '''
    assertErrorFormat '''
        /a/gimi
    ''', '''
        /a/gimi
           ▲▲▲▲ invalid regular expression flags gimi
    '''
    assertErrorFormat '''
        /a/g_
    ''', '''
        /a/g_
           ▲▲ invalid regular expression flags g_
    '''
    assertErrorFormat '''
        ///a///ii
    ''', '''
        ///a///ii
               ▲▲ invalid regular expression flags ii
    '''
    doesNotThrow -> Koffee.compile '/a/ymgi'

test "missing `)`, `}`, `]`", ->
    assertErrorFormat '''
        (
    ''', '''
        (
        ▲ missing )
    '''
    assertErrorFormat '''
        {
    ''', '''
        {
        ▲ missing }
    '''
    assertErrorFormat '''
        [
    ''', '''
        [
        ▲ missing ]
    '''
    assertErrorFormat '''
        obj = {a: [1, (2+
    ''', '''
        obj = {a: [1, (2+
                      ▲ missing )
    '''
    assertErrorFormat '''
        "#{
    ''', '''
        "#{
          ▲ missing }
    '''
    assertErrorFormat '''
        """
            foo#{ bar "#{1}"
    ''', '''
        \    foo#{ bar "#{1}"
        \        ▲ missing }
    '''

test "unclosed regexes", ->
    assertErrorFormat '''
        /
    ''', '''
        /
        ▲ missing / (unclosed regex)
    '''
    assertErrorFormat '''
        # Note the double escaping; this would be `/a\/` real code.
        /a\\/
    ''', '''
        /a\\/
        ▲ missing / (unclosed regex)
    '''
    assertErrorFormat '''
        /// ▲
            a #{""" ""#{if /[/].test "|" then 1 else 0}"" """}
        ///
    ''', '''
        \    a #{""" ""#{if /[/].test "|" then 1 else 0}"" """}
        \                   ▲ missing / (unclosed regex)
    '''

test "duplicate function arguments", ->
    assertErrorFormat '''
        (foo, bar, foo) ->
    ''', '''
        (foo, bar, foo) ->
                   ▲▲▲ multiple parameters named foo
    '''
    assertErrorFormat '''
        (@foo, bar, @foo) ->
    ''', '''
        (@foo, bar, @foo) ->
                    ▲▲▲▲ multiple parameters named @foo
    '''

test "reserved words", ->
    assertErrorFormat '''
        case
    ''', '''
        case
        ▲▲▲▲ reserved word 'case'
    '''
    assertErrorFormat '''
        case = 1
    ''', '''
        case = 1
        ▲▲▲▲ reserved word 'case'
    '''
    assertErrorFormat '''
        for = 1
    ''', '''
        for = 1
        ▲▲▲ keyword 'for' can't be assigned
    '''
    assertErrorFormat '''
        unless = 1
    ''', '''
        unless = 1
        ▲▲▲▲▲▲ keyword 'unless' can't be assigned
    '''
    assertErrorFormat '''
        for += 1
    ''', '''
        for += 1
        ▲▲▲ keyword 'for' can't be assigned
    '''
    assertErrorFormat '''
        for &&= 1
    ''', '''
        for &&= 1
        ▲▲▲ keyword 'for' can't be assigned
    '''
    # Make sure token look-behind doesn't go out of range.
    assertErrorFormat '''
        &&= 1
    ''', '''
        &&= 1
        ▲▲▲ unexpected &&=
    '''
    # #2306: Show unaliased name in error messages.
    assertErrorFormat '''
        on = 1
    ''', '''
        on = 1
        ▲▲ keyword 'on' can't be assigned
    '''

test "strict mode errors", ->
    assertErrorFormat '''
        eval = 1
    ''', '''
        eval = 1
        ▲▲▲▲ 'eval' can't be assigned
    '''
    assertErrorFormat '''
        class eval
    ''', '''
        class eval
              ▲▲▲▲ 'eval' can't be assigned
    '''
    assertErrorFormat '''
        arguments++
    ''', '''
        arguments++
        ▲▲▲▲▲▲▲▲▲ 'arguments' can't be assigned
    '''
    assertErrorFormat '''
        --arguments
    ''', '''
        --arguments
          ▲▲▲▲▲▲▲▲▲ 'arguments' can't be assigned
    '''

test "invalid numbers", ->
    assertErrorFormat '''
        0X0
    ''', '''
        0X0
         ▲ radix prefix in '0X0' must be lowercase
    '''
    assertErrorFormat '''
        10E0
    ''', '''
        10E0
          ▲ exponential notation in '10E0' must be indicated with a lowercase 'e'
    '''
    assertErrorFormat '''
        018
    ''', '''
        018
        ▲▲▲ decimal literal '018' must not be prefixed with '0'
    '''
    assertErrorFormat '''
        010
    ''', '''
        010
        ▲▲▲ octal literal '010' must be prefixed with '0o'
'''

test "unexpected object keys", ->
    assertErrorFormat '''
        {[[]]}
    ''', '''
        {[[]]}
         ▲ unexpected [
    '''
    assertErrorFormat '''
        {[[]]: 1}
    ''', '''
        {[[]]: 1}
         ▲ unexpected [
    '''
    assertErrorFormat '''
        [[]]: 1
    ''', '''
        [[]]: 1
        ▲ unexpected [
    '''
    assertErrorFormat '''
        {(a + "b")}
    ''', '''
        {(a + "b")}
         ▲ unexpected (
    '''
    assertErrorFormat '''
        {(a + "b"): 1}
    ''', '''
        {(a + "b"): 1}
         ▲ unexpected (
    '''
    assertErrorFormat '''
        (a + "b"): 1
    ''', '''
        (a + "b"): 1
        ▲ unexpected (
    '''
    assertErrorFormat '''
        a: 1, [[]]: 2
    ''', '''
        a: 1, [[]]: 2
              ▲ unexpected [
    '''
    assertErrorFormat '''
        {a: 1, [[]]: 2}
    ''', '''
        {a: 1, [[]]: 2}
               ▲ unexpected [
    '''

test "invalid object keys", ->
    assertErrorFormat '''
        @a: 1
    ''', '''
        @a: 1
        ▲▲ invalid object key
    '''
    assertErrorFormat '''
        f
            @a: 1
    ''', '''
        \    @a: 1
        \    ▲▲ invalid object key
    '''
    assertErrorFormat '''
        {a=2}
    ''', '''
        {a=2}
          ▲ unexpected =
    '''

test "invalid destructuring default target", ->
    assertErrorFormat '''
        {'a' = 2} = obj
    ''', '''
        {'a' = 2} = obj
             ▲ unexpected =
    '''

test "#4070: lone expansion", ->
    assertErrorFormat '''
        [...] = a
    ''', '''
        [...] = a
         ▲▲▲ Destructuring assignment has no target
    '''
    assertErrorFormat '''
        [ ..., ] = a
    ''', '''
        [ ..., ] = a
          ▲▲▲ Destructuring assignment has no target
    '''

test "#3926: implicit object in parameter list", ->
    
    # this is valid syntax in koffee (config parameter) 
    
    # assertErrorFormat '''
    #     (a: b) ->
    # ''', '''
    #     (a: b) ->
    #       ▲ unexpected :
    # '''
    # assertErrorFormat '''
    #     (one, two, {three, four: five}, key: value) ->
    # ''', '''
    #     (one, two, {three, four: five}, key: value) ->
    #                                        ▲ unexpected :
    # '''

test "#4130: unassignable in destructured param", ->

    # this is handled in koffee/02_config_parameters now
        
    #assertErrorFormat '''
    #    fun = ({
    #        @param : null
    #    }) ->
    #        console.log "Oh hello!"
    #''', '''
    #        @param : null
    #                 ▲▲▲▲ keyword 'null' can't be assigned
    #'''
    # assertErrorFormat '''
    #     ({a: null}) ->
    # ''', '''
    #     ({a: null}) ->
    #          ▲▲▲▲ keyword 'null' can't be assigned
    # '''
    # assertErrorFormat '''
    #     ({a: 1}) ->
    # ''', '''
    #     ({a: 1}) ->
    #          ▲ '1' can't be assigned
    # '''
    # assertErrorFormat '''
    #     ({1}) ->
    # ''', '''
    #     ({1}) ->
    #       ▲ '1' can't be assigned
    # '''
    # assertErrorFormat '''
    #     ({a: true = 1}) ->
    # ''', '''
    #     ({a: true = 1}) ->
    #          ▲▲▲▲ keyword 'true' can't be assigned
    # '''

test "`yield` outside of a function", ->
    assertErrorFormat '''
        yield 1
    ''', '''
        yield 1
        ▲▲▲▲▲▲▲ yield can only occur inside functions
    '''
    assertErrorFormat '''
        yield return
    ''', '''
        yield return
        ▲▲▲▲▲▲▲▲▲▲▲▲ yield can only occur inside functions
    '''

test "#4097: `yield return` as an expression", ->
    assertErrorFormat '''
        -> (yield return)
    ''', '''
        -> (yield return)
            ▲▲▲▲▲▲▲▲▲▲▲▲ cannot use a pure statement in an expression
    '''

test "`&&=` and `||=` with a space in-between", ->
    assertErrorFormat '''
        a = 0
        a && = 1
    ''', '''
        a && = 1
             ▲ unexpected =
    '''
    assertErrorFormat '''
        a = 0
        a and = 1
    ''', '''
        a and = 1
              ▲ unexpected =
    '''
    assertErrorFormat '''
        a = 0
        a || = 1
    ''', '''
        a || = 1
             ▲ unexpected =
    '''
    assertErrorFormat '''
        a = 0
        a or = 1
    ''', '''
        a or = 1
             ▲ unexpected =
    '''

test "anonymous functions cannot be exported", ->
    assertErrorFormat '''
        export ->
            console.log 'hello, world!'
    ''', '''
        export ->
               ▲▲ unexpected ->
    '''

test "anonymous classes cannot be exported", ->
    assertErrorFormat '''
        export class
            @: ->
                console.log 'hello, world!'
    ''', '''
        export class
               ▲▲▲▲▲ anonymous classes cannot be exported
    '''

test "unless enclosed by curly braces, only * can be aliased", ->
    assertErrorFormat '''
        import foo as bar from 'lib'
    ''', '''
        import foo as bar from 'lib'
                   ▲▲ unexpected as
    '''

test "unwrapped imports must follow constrained syntax", ->
    assertErrorFormat '''
        import foo, bar from 'lib'
    ''', '''
        import foo, bar from 'lib'
                    ▲▲▲ unexpected identifier
    '''
    assertErrorFormat '''
        import foo, bar, baz from 'lib'
    ''', '''
        import foo, bar, baz from 'lib'
                    ▲▲▲ unexpected identifier
    '''
    assertErrorFormat '''
        import foo, bar as baz from 'lib'
    ''', '''
        import foo, bar as baz from 'lib'
                    ▲▲▲ unexpected identifier
    '''

test "cannot export * without a module to export from", ->
    assertErrorFormat '''
        export *
    ''', '''
        export *
                ▲ unexpected end of input
    '''

test "imports and exports must be top-level", ->
    assertErrorFormat '''
        if foo
            import { bar } from 'lib'
    ''', '''
        \    import { bar } from 'lib'
        \    ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲ import statements must be at top-level scope
    '''
    assertErrorFormat '''
        foo = ->
            export { bar }
    ''', '''
        \    export { bar }
        \    ▲▲▲▲▲▲▲▲▲▲▲▲▲▲ export statements must be at top-level scope
    '''

test "cannot import the same member more than once", ->
    assertErrorFormat '''
        import { foo, foo } from 'lib'
    ''', '''
        import { foo, foo } from 'lib'
                      ▲▲▲ 'foo' has already been declared
    '''
    assertErrorFormat '''
        import { foo, bar, foo } from 'lib'
    ''', '''
        import { foo, bar, foo } from 'lib'
                           ▲▲▲ 'foo' has already been declared
    '''
    assertErrorFormat '''
        import { foo, bar as foo } from 'lib'
    ''', '''
        import { foo, bar as foo } from 'lib'
                      ▲▲▲▲▲▲▲▲▲▲ 'foo' has already been declared
    '''
    assertErrorFormat '''
        import foo, { foo } from 'lib'
    ''', '''
        import foo, { foo } from 'lib'
                      ▲▲▲ 'foo' has already been declared
    '''
    assertErrorFormat '''
        import foo, { bar as foo } from 'lib'
    ''', '''
        import foo, { bar as foo } from 'lib'
                      ▲▲▲▲▲▲▲▲▲▲ 'foo' has already been declared
    '''
    assertErrorFormat '''
        import foo from 'libA'
        import foo from 'libB'
    ''', '''
        import foo from 'libB'
               ▲▲▲ 'foo' has already been declared
    '''
    assertErrorFormat '''
        import * as foo from 'libA'
        import { foo } from 'libB'
    ''', '''
        import { foo } from 'libB'
                 ▲▲▲ 'foo' has already been declared
    '''

test "imported members cannot be reassigned", ->
    assertErrorFormat '''
        import { foo } from 'lib'
        foo = 'bar'
    ''', '''
        foo = 'bar'
        ▲▲▲ 'foo' is read-only
    '''
    assertErrorFormat '''
        import { foo } from 'lib'
        export default foo = 'bar'
    ''', '''
        export default foo = 'bar'
                       ▲▲▲ 'foo' is read-only
    '''
    assertErrorFormat '''
        import { foo } from 'lib'
        export foo = 'bar'
    ''', '''
        export foo = 'bar'
               ▲▲▲ 'foo' is read-only
    '''

test "Koffee keywords cannot be used as unaliased names in import lists", ->
    assertErrorFormat """
        import { unless, baz as bar } from 'lib'
        bar.barMethod()
    """, '''
        import { unless, baz as bar } from 'lib'
                 ▲▲▲▲▲▲ unexpected unless
    '''

test "Koffee keywords cannot be used as local names in import list aliases", ->
    assertErrorFormat """
        import { bar as unless, baz as bar } from 'lib'
        bar.barMethod()
    """, '''
        import { bar as unless, baz as bar } from 'lib'
                        ▲▲▲▲▲▲ unexpected unless
    '''

test "indexes are not supported in for-from loops", ->
    assertErrorFormat "x for x, i from [1, 2, 3]", '''
        x for x, i from [1, 2, 3]
                 ▲ cannot use index with for-from
    '''

test "own is not supported in for-from loops", ->
    assertErrorFormat "x for own x from [1, 2, 3]", '''
        x for own x from [1, 2, 3]
              ▲▲▲ cannot use own with for-from
        '''

test "tagged template literals must be called by an identifier", ->
    
    # these throw a different error in koffee, see optional_commata
    
    #assertErrorFormat "1''", '''
    #    1''
    #    ▲ literal is not a function
    #'''
    #assertErrorFormat '1""', '''
    #    1""
    #    ▲ literal is not a function
    #'''
    #assertErrorFormat "1'b'", '''
    #    1'b'
    #    ▲ literal is not a function
    #'''
    #assertErrorFormat '1"b"', '''
    #    1"b"
    #    ▲ literal is not a function
    #'''
    #assertErrorFormat "1'''b'''", """
    #    1'''b'''
    #    ▲ literal is not a function
    #"""
    #assertErrorFormat '1"""b"""', '''
    #    1"""b"""
    #    ▲ literal is not a function
    #'''
    #assertErrorFormat '1"#{b}"', '''
    #    1"#{b}"
    #    ▲ literal is not a function
    #'''
    #assertErrorFormat '1"""#{b}"""', '''
    #    1"""#{b}"""
    #    ▲ literal is not a function
    #'''

test "can't use pattern matches for loop indices", ->
    assertErrorFormat 'a for b, {c} in d', '''
        a for b, {c} in d
                 ▲▲▲ index cannot be a pattern matching expression
    '''

test "#4248: Unicode code point escapes", ->
    assertErrorFormat '''
        "a
            #{b} \\u{G02}
         c"
    ''', '''
        \    #{b} \\u{G02}
        \         ▲\▲▲▲▲▲▲ invalid escape sequence \\u{G02}
    '''
    assertErrorFormat '''
        /a\\u{}b/
    ''', '''
        /a\\u{}b/
          ▲▲▲▲ invalid escape sequence \\u{}
    '''
    assertErrorFormat '''
        ///a \\u{01abc///
    ''', '''
        ///a \\u{01abc///
             ▲\▲▲▲▲▲▲▲ invalid escape sequence \\u{01abc
    '''

    assertErrorFormat '''
        /\\u{123} \\u{110000}/
    ''', '''
        /\\u{123} \\u{110000}/
        \         ▲\▲▲▲▲▲▲▲▲▲ unicode code point escapes greater than \\u{10ffff} are not allowed
    '''

    assertErrorFormat '''
        ///abc\\\\\\u{123456}///u
    ''', '''
        ///abc\\\\\\u{123456}///u
               \ \▲\▲▲▲▲▲▲▲▲▲ unicode code point escapes greater than \\u{10ffff} are not allowed
    '''

    assertErrorFormat '''
        """
            \\u{123}
            a
                \\u{00110000}
            #{ 'b' }
        """
    ''', '''
        \        \\u{00110000}
        \        ▲\▲▲▲▲▲▲▲▲▲▲▲ unicode code point escapes greater than \\u{10ffff} are not allowed
    '''

    assertErrorFormat '''
        '\\u{a}\\u{1111110000}'
    ''', '''
        '\\u{a}\\u{1111110000}'
         \     ▲\▲▲▲▲▲▲▲▲▲▲▲▲▲ unicode code point escapes greater than \\u{10ffff} are not allowed
    '''

test "#4283: error message for implicit call", ->
    assertErrorFormat '''
        console.log {search, users, contacts users_to_display}
    ''', '''
        console.log {search, users, contacts users_to_display}
                                    ▲▲▲▲▲▲▲▲ unexpected implicit function call
    '''

test "#3199: error message for call indented non-object", ->
    assertErrorFormat '''
        fn = ->
        fn
            1
    ''', '''
            1
        ▲▲▲▲ unexpected indentation
    '''

test "#3199: error message for call indented comprehension", ->
    assertErrorFormat '''
        fn = ->
        fn
            x for x in [1, 2, 3]
    ''', '''
            x for x in [1, 2, 3]
        ▲▲▲▲ unexpected indentation
    '''

test "#3199: error message for return indented non-object", ->
    assertErrorFormat '''
        return
            1
    ''', '''
        \    1
        \    ▲ unexpected number
    '''

test "#3199: error message for return indented comprehension", ->
    assertErrorFormat '''
        return
            x for x in [1, 2, 3]
    ''', '''
        \    x for x in [1, 2, 3]
        \    ▲ unexpected identifier
    '''
