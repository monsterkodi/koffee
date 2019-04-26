# See http://wiki.ecmascript.org/doku.php?id=harmony:egal
egal = (a, b) ->
  if a is b
    a isnt 0 or 1/a is 1/b
  else
    a isnt a and b isnt b

# A recursive functional equivalence helper; uses egal for testing equivalence.
arrayEgal = (a, b) ->
  if egal a, b then yes
  else if a instanceof Array and b instanceof Array
    return no unless a.length is b.length
    return no for el, idx in a when not arrayEgal el, b[idx]
    yes

exports.eq      = (a, b, msg) -> ok egal(a, b), msg or "\x1B[0;90m\n <<< expected >>>\n\x1B[0;93m#{a}\x1B[0;90m<<< to equal >>>\n\x1B[0;93m#{b}\x1B[0;90m<<< expected >>>\n"
exports.arrayEq = (a, b, msg) -> ok arrayEgal(a,b), msg or "\x1B[0;90m\n >>>\n\x1B[0;93m#{a}\x1B[0;90m<<< to deep equal >>>\n\x1B[0;93m#{b}\x1B[0;90m<<< expected >>>\n"

exports.toJS = (str) ->
  Koffee.compile str, bare: yes
  .replace /^\s+|\s+$/g, '' # Trim leading/trailing whitespace
