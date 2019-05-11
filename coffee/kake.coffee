###
000   000   0000000   000   000  00000000  
000  000   000   000  000  000   000       
0000000    000000000  0000000    0000000   
000  000   000   000  000  000   000       
000   000  000   000  000   000  00000000
###

# koffee's build tool. It executes tasks defined in a kakefile (kake.coffee).
# Called with no arguments, it prints a list of all available tasks.

fs       = require 'fs'
path     = require 'path'
nopt     = require 'nopt'
helpers  = require './helpers'
Koffee   = require './koffee'

helpers.colors()

tasks    = {}

Koffee.register() 

helpers.extend global, # Mixin the top-level kake functions for kakefiles to use directly.

    # Define a task with a short name, an optional description, and the function to run.
    
    task: (name, description, action) ->
        
        [action, description] = [description, action] if not action
        tasks[name] = {name, description, action}

    invoke: (name) -> # Invoke another task in the current file.
        
        if not tasks[name]
        
            log "No such task: #{name}\n"
            log 'To see a list of all tasks, run "kake"'
            process.exit 1
        
        tasks[name].action()

# 00000000   000   000  000   000  
# 000   000  000   000  0000  000  
# 0000000    000   000  000 0 000  
# 000   000  000   000  000  0000  
# 000   000   0000000   000   000  

# Run `kake`. Executes all of the tasks you pass, in order. 
# Note that Node's asynchrony may cause tasks to execute in a different order than you'd expect.
# If no tasks are passed, print the help.
# Keeps a reference to the original directory name, when running tasks from subdirectories.

run = ->
    
    global.__originalDirname = fs.realpathSync '.'
    process.chdir kakefileDirectory __originalDirname
    
    Koffee.run fs.readFileSync('kake.coffee').toString(), filename: 'kake.coffee'
    tasklist = nopt().argv.remain
    return printTasks() if not tasklist.length
    invoke arg for arg in tasklist
        
printTasks = ->
    
    relative = path.relative or path.resolve
    cakefilePath = path.join relative(__originalDirname, process.cwd()), 'kake.coffee'
    # log "\n#{cakefilePath} tasks:\n"
    log yellow "\nTasks:\n"
    for name, task of tasks
        desc = if task.description then "#{task.description}" else ''
        name = helpers.pad name
        log '    ' + white(name) + gray(desc)
    log ''

kakefileDirectory = (dir) -> # Search in the current and all parent directories to find the relevant kakefile.
    
    return dir if fs.existsSync path.join dir, 'kake.coffee'
    parent = path.normalize path.join dir, '..'
    return kakefileDirectory parent unless parent is dir
    throw new Error "kake.coffee not found in #{process.cwd()}"

module.exports = run
