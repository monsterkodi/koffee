# Comments
# --------

# * Single-Line Comments
# * Block Comments

# Note: awkward spacing seen in some tests is likely intentional.

test "comments in objects", ->
    obj1 = {
    # comment
        # comment
            # comment
        one: 1
    # comment
        two: 2
            # comment
    }

    ok Object.hasOwn(obj1,'one')
    eq obj1.one, 1
    ok Object.hasOwn(obj1,'two')
    eq obj1.two, 2

test "comments in YAML-style objects", ->
    obj2 =
    # comment
        # comment
            # comment
        three: 3
    # comment
        four: 4
            # comment

    ok Object.hasOwn(obj2,'three')
    eq obj2.three, 3
    ok Object.hasOwn(obj2,'four')
    eq obj2.four, 4

test "comments following operators that continue lines", ->
    sum =
        1 +
        1 + # comment
        1
    eq 3, sum

test "comments in functions", ->
    fn = ->
    # comment
        false
        false       # comment
        false
        # comment

    # comment
        true

    ok fn()

    fn2 = -> #comment
        fn()
        # comment

    ok fn2()

test "trailing comment before an outdent", ->
    nonce = {}
    fn3 = ->
        if true
            undefined # comment
        nonce

    eq nonce, fn3()

test "comments in a switch", ->
    nonce = {}
    result = switch nonce #comment
        # comment
        when false then undefined
        # comment
        when null #comment
            undefined
        else nonce # comment

    eq nonce, result

test "comment with conditional statements", ->
    nonce = {}
    result = if false # comment
        undefined
    #comment
    else # comment
        nonce
        # comment
    eq nonce, result

test "spaced comments with conditional statements", ->
    nonce = {}
    result = if false
        undefined

    # comment
    else if false
        undefined

    # comment
    else
        nonce

    eq nonce, result


# Block Comments

###
    This is a here-comment.
    Kind of like a heredoc.
###

test "block comments in objects", ->
    a = {}
    b = {}
    obj = {
        a: a
        ###
        comment
        ###
        b: b
    }

    eq a, obj.a
    eq b, obj.b

test "block comments in YAML-style", ->
    a = {}
    b = {}
    obj =
        a: a
        ###
        comment
        ###
        b: b

    eq a, obj.a
    eq b, obj.b


test "block comments in functions", ->
    nonce = {}

    fn1 = ->
        true
        ###
        false
        ###

    ok fn1()

    fn2 =    ->
        ###
        block comment
        ###
        nonce

    eq nonce, fn2()

    fn3 = ->
        nonce
    ###
    block comment
    ###

    eq nonce, fn3()

    fn4 = ->
        one = ->
            ###
                block comment
            ###
            two = ->
                three = ->
                    nonce

    eq nonce, fn4()()()()

test "block comments inside class bodies", ->
    class A
        a: ->

        ###
        Comment
        ###
        b: ->

    ok A.prototype.b instanceof Function

    class B
        ###
        Comment
        ###
        a: ->
        b: ->

    ok B.prototype.a instanceof Function

test "#2037: herecomments shouldn't imply line terminators", ->
    do (-> ### ###; fail)

test "#2916: block comment before implicit call with implicit object", ->
    fn = (obj) -> ok obj.a
    ### ###
    fn
        a: yes

test "#3132: Format single-line block comment nicely", ->
    input = """
    ### Single-line block comment without additional space here => ###"""

    result = """

    /* Single-line block comment without additional space here => */


    """
    eq Koffee.compile(input, bare: on), result

test "#3132: Format multi-line block comment nicely", ->
    input = """
    ###
    # Multi-line
    # block
    # comment
    ###"""

    result = """

    /*
     * Multi-line
     * block
     * comment
     */


    """
    eq Koffee.compile(input, bare: on), result

test "#3132: Format simple block comment nicely", ->
    input = """
    ###
    No
    Preceding hash
    ###"""

    result = """

    /*
    No
    Preceding hash
     */


    """

    eq Koffee.compile(input, bare: on), result

test "#3132: Format indented block-comment nicely", ->
    input = """
    fn = () ->
        ###
        # Indented
        Multiline
        ###
        1"""

    result = """
    var fn;

    fn = function() {

        /*
         * Indented
        Multiline
         */
        return 1;
    };

    """
    eq Koffee.compile(input, bare: on), result

# Although adequately working, block comment-placement is not yet perfect.
# (Considering a case where multiple variables have been declared …)
test "#3132: Format jsdoc-style block-comment nicely", ->
    input = """
    ###*
    # Multiline for jsdoc-"@doctags"
    #
    # @type {Function}
    ###
    fn = () -> 1
    """

    result = """

    /**
     * Multiline for jsdoc-"@doctags"
     *
     * @type {Function}
     */
    var fn;

    fn = function() {
        return 1;
    };

    """
    eq Koffee.compile(input, bare: on), result

# Although adequately working, block comment-placement is not yet perfect.
# (Considering a case where multiple variables have been declared …)
test "#3132: Format hand-made (raw) jsdoc-style block-comment nicely", ->
    input = """
    ###*
     * Multiline for jsdoc-"@doctags"
     *
     * @type {Function}
    ###
    fn = () -> 1
    """

    result = """

    /**
     * Multiline for jsdoc-"@doctags"
     *
     * @type {Function}
     */
    var fn;

    fn = function() {
        return 1;
    };

    """
    eq Koffee.compile(input, bare: on), result

# Although adequately working, block comment-placement is not yet perfect.
# (Considering a case where multiple variables have been declared …)
test "#3132: Place block-comments nicely", ->
    input = """
    ###*
    # A dummy class definition
    #
    # @class
    ###
    class DummyClass

        ###*
        # @constructor
        ###
        @: ->

        ###*
        # Singleton reference
        #
        # @type {DummyClass}
        ###
        @instance = new DummyClass()

    """

    result = """

    /**
     * A dummy class definition
     *
     * @class
     */
    var DummyClass;

    DummyClass = (function() {

        /**
         * @constructor
         */
        function DummyClass() {}


        /**
         * Singleton reference
         *
         * @type {DummyClass}
         */

        DummyClass.instance = new DummyClass();

        return DummyClass;

    })();

    """
    eq Koffee.compile(input, bare: on), result

test "#3638: Demand a whitespace after # symbol", ->
    input = """
    ###
    #No
    #whitespace
    ###"""

    result = """

    /*
    #No
    #whitespace
     */


    """

    eq Koffee.compile(input, bare: on), result

test "#3761: Multiline comment at end of an object", ->
    anObject =
        x: 3
        ###
        #Comment
        ###

    ok anObject.x is 3

test "#4375: UTF-8 characters in comments", ->
    # 智に働けば角が立つ、情に掉させば流される。
    ok yes
