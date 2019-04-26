# Importing
# ---------

test "modules can be imported and executed", ->

        magicKey = __filename
        magicValue = 0xFFFF

        if global[magicKey]?
            if exports?
                local = magicValue
                exports.method = -> local
        else
            global[magicKey] = {}
            if require?.extensions?
                ok require(__filename).method() is magicValue
            delete global[magicKey]

test "javascript modules can be imported", ->
        magicVal = 1
        for module in 'import.js import2 .import2 import.extension.js import.unknownextension .coffee'.split ' '
            ok require("./importing/#{module}").value?() is magicVal, module

test "modules can be imported", ->
        magicVal = 2
        for module in '.import.coffee import.coffee import.extension.coffee'.split ' '
            ok require("./importing/#{module}").value?() is magicVal, module

