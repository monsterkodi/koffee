###
000   000   0000000   000   000  00000000  
000  000   000   000  000  000   000       
0000000    000000000  0000000    0000000   
000  000   000   000  000  000   000       
000   000  000   000  000   000  00000000  
###

# `kake` is a koffee's build tool. It executes tasks defined in a kakefile (kake.coffee).
# Called with no arguments, it prints a list of all available tasks.

fs       = require 'fs'
path     = require 'path'
helpers  = require './helpers'
optparse = require './optparse'
Koffee   = require './koffee'

tasks    = {}
options  = {}
switches = []
oparse   = null

Koffee.register() 

# Mixin the top-level kake functions for kakefiles to use directly.
    
helpers.extend global,

    # Define a task with a short name, an optional description, and the function to run.
    
    task: (name, description, action) ->
        
        [action, description] = [description, action] if not action
        tasks[name] = {name, description, action}

    # Define an option.
    # The parsed options hash, containing all of the command-line options passed, 
    # will be made available as the first argument to the action.
    
    option: (letter, flag, description) ->
        
        switches.push [letter, flag, description]
    
    invoke: (name) -> # Invoke another task in the current file.
        
        missingTask name unless tasks[name]
        tasks[name].action options

# 00000000   000   000  000   000  
# 000   000  000   000  0000  000  
# 0000000    000   000  000 0 000  
# 000   000  000   000  000  0000  
# 000   000   0000000   000   000  

# Run `kake`. Executes all of the tasks you pass, in order. Note that Node's
# asynchrony may cause tasks to execute in a different order than you'd expect.
# If no tasks are passed, print the help screen. Keep a reference to the
# original directory name, when running kake tasks from subdirectories.

exports.run = ->
    
    global.__originalDirname = fs.realpathSync '.'
    process.chdir kakefileDirectory __originalDirname
    args = process.argv[2..]
    Koffee.run fs.readFileSync('kake.coffee').toString(), filename: 'kake.coffee'
    oparse = new optparse.OptionParser switches
    return printTasks() unless args.length
    try
        options = oparse.parse(args)
    catch e
        return fatalError "#{e}"
    invoke arg for arg in options.arguments

printTasks = ->
    
    relative = path.relative or path.resolve
    cakefilePath = path.join relative(__originalDirname, process.cwd()), 'kake.coffee'
    console.log "#{cakefilePath} tasks:\n"
    for name, task of tasks
        spaces = 13 - name.length
        spaces = if spaces > 0 then Array(spaces + 1).join(' ') else ''
        desc   = if task.description then "# #{task.description}" else ''
        console.log "kake #{name}#{spaces} #{desc}"
    console.log oparse.help() if switches.length

fatalError = (message) -> # Print an error and exit when attempting to use an invalid task/option.
    
    console.error message + '\n'
    console.log 'To see a list of all tasks/options, run "kake"'
    process.exit 1

missingTask = (task) -> fatalError "No such task: #{task}"

kakefileDirectory = (dir) -> # Search in the current and all parent directories to find the relevant kakefile.
    
    return dir if fs.existsSync path.join dir, 'kake.coffee'
    parent = path.normalize path.join dir, '..'
    return kakefileDirectory parent unless parent is dir
    throw new Error "kake.coffee not found in #{process.cwd()}"
