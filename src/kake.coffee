# `kake` is a simplified version of [Make](http://www.gnu.org/software/make/)
# ([Rake](http://rake.rubyforge.org/), [Jake](https://github.com/280north/jake))
# for Koffee. You define tasks with names and descriptions in a kakefile (kake.coffee),
# and can call them from the command line, or invoke them from other tasks.
#
# Running `kake` with no arguments will print out a list of all the tasks in the
# current directory's kakefile.

fs        = require 'fs'
path      = require 'path'
helpers   = require './helpers'
optparse  = require './optparse'
Koffee    = require './koffee'

Koffee.register() # Register .coffee extension

# Keep track of the list of defined tasks, the accepted options, and so on.
tasks       = {}
options     = {}
switches    = []
oparse      = null

# Mixin the top-level kake functions for kakefiles to use directly.
helpers.extend global,

    # Define a task with a short name, an optional sentence description,
    # and the function to run as the action itself.
    task: (name, description, action) ->
        [action, description] = [description, action] unless action
        tasks[name] = {name, description, action}

    # Define an option that kake accepts. The parsed options hash,
    # containing all of the command-line options passed, will be made available
    # as the first argument to the action.
    option: (letter, flag, description) ->
        switches.push [letter, flag, description]

    # Invoke another task in the current file.
    invoke: (name) ->
        missingTask name unless tasks[name]
        tasks[name].action options

# Run `kake`. Executes all of the tasks you pass, in order. Note that Node's
# asynchrony may cause tasks to execute in a different order than you'd expect.
# If no tasks are passed, print the help screen. Keep a reference to the
# original directory name, when running kake tasks from subdirectories.
exports.run = ->
    global.__originalDirname = fs.realpathSync '.'
    process.chdir cakefileDirectory __originalDirname
    args = process.argv[2..]
    Koffee.run fs.readFileSync('kake.coffee').toString(), filename: 'kake.coffee'
    oparse = new optparse.OptionParser switches
    return printTasks() unless args.length
    try
        options = oparse.parse(args)
    catch e
        return fatalError "#{e}"
    invoke arg for arg in options.arguments

# Display the list of kake tasks
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

# Print an error and exit when attempting to use an invalid task/option.
fatalError = (message) ->
    console.error message + '\n'
    console.log 'To see a list of all tasks/options, run "kake"'
    process.exit 1

missingTask = (task) -> fatalError "No such task: #{task}"

# When `kake` is invoked, search in the current and all parent directories to find the relevant kakefile.
cakefileDirectory = (dir) ->
    return dir if fs.existsSync path.join dir, 'kake.coffee'
    parent = path.normalize path.join dir, '..'
    return cakefileDirectory parent unless parent is dir
    throw new Error "kake.coffee not found in #{process.cwd()}"
