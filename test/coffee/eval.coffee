if vm = require? 'vm'

    test "Koffee.eval runs in the global context by default", ->
        global.punctuation = '!'
        code = '''
        global.fhqwhgads = "global superpower#{global.punctuation}"
        '''
        result = Koffee.eval code
        eq result, 'global superpower!'
        eq fhqwhgads, 'global superpower!'

    test "Koffee.eval can run in, and modify, a Script context sandbox", ->
        createContext = vm.Script.createContext ? vm.createContext
        sandbox = createContext()
        sandbox.foo = 'bar'
        code = '''
        global.foo = 'not bar!'
        '''
        result = Koffee.eval code, {sandbox}
        eq result, 'not bar!'
        eq sandbox.foo, 'not bar!'

    test "Koffee.eval can run in, but cannot modify, an ordinary object sandbox", ->
        sandbox = {foo: 'bar'}
        code = '''
        global.foo = 'not bar!'
        '''
        result = Koffee.eval code, {sandbox}
        eq result, 'not bar!'
        eq sandbox.foo, 'bar'
