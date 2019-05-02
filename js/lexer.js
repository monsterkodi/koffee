
/*
000      00000000  000   000  00000000  00000000   
000      000        000 000   000       000   000  
000      0000000     00000    0000000   0000000    
000      000        000 000   000       000   000  
0000000  00000000  000   000  00000000  000   000
 */
var BOM, BOOL, CALLABLE, CODE, COFFEE_ALIASES, COFFEE_ALIAS_MAP, COFFEE_KEYWORDS, COMMENT, COMPARE, COMPOUND_ASSIGN, HERECOMMENT_ILLEGAL, HEREDOC_DOUBLE, HEREDOC_INDENT, HEREDOC_SINGLE, HEREGEX, HEREGEX_OMIT, HERE_JSTOKEN, IDENTIFIER, INDENTABLE_CLOSERS, INDEXABLE, INVERSES, JSTOKEN, JS_KEYWORDS, LEADING_BLANK_LINE, LINE_BREAK, LINE_CONTINUER, Lexer, MATH, MULTI_DENT, NOT_REGEX, NUMBER, OPERATOR, POSSIBLY_DIVISION, REGEX, REGEX_FLAGS, REGEX_ILLEGAL, REGEX_INVALID_ESCAPE, RELATION, RESERVED, Rewriter, SHIFT, SIMPLE_STRING_OMIT, STRICT_PROSCRIBED, STRING_DOUBLE, STRING_INVALID_ESCAPE, STRING_OMIT, STRING_SINGLE, STRING_START, TRAILING_BLANK_LINE, TRAILING_SPACES, UNARY, UNARY_MATH, UNFINISHED, UNICODE_CODE_POINT_ESCAPE, VALID_FLAGS, WHITESPACE, compact, count, isForFrom, isUnassignable, key, locationDataToString, log, ref, ref1, repeat, starts, throwSyntaxError,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  slice = [].slice;

ref = require('./rewriter'), Rewriter = ref.Rewriter, INVERSES = ref.INVERSES;

ref1 = require('./helpers'), count = ref1.count, starts = ref1.starts, compact = ref1.compact, repeat = ref1.repeat, locationDataToString = ref1.locationDataToString, throwSyntaxError = ref1.throwSyntaxError;

log = console.log;

Lexer = (function() {
  function Lexer() {}

  Lexer.prototype.tokenize = function(code, opts) {
    var consumed, end, i, ref2, ref3;
    if (opts == null) {
      opts = {};
    }
    this.indent = 0;
    this.baseIndent = 0;
    this.indebt = 0;
    this.outdebt = 0;
    this.indents = [];
    this.ends = [];
    this.tokens = [];
    this.seenFor = false;
    this.seenImport = false;
    this.seenExport = false;
    this.importSpecifierList = false;
    this.exportSpecifierList = false;
    this.chunkLine = opts.line || 0;
    this.chunkColumn = opts.column || 0;
    code = this.clean(code);
    i = 0;
    while (this.chunk = code.slice(i)) {
      consumed = this.identifierToken() || this.commentToken() || this.whitespaceToken() || this.lineToken() || this.stringToken() || this.numberToken() || this.regexToken() || this.jsToken() || this.literalToken();
      ref2 = this.getLineAndColumnFromChunk(consumed), this.chunkLine = ref2[0], this.chunkColumn = ref2[1];
      i += consumed;
      if (opts.untilBalanced && this.ends.length === 0) {
        return {
          tokens: this.tokens,
          index: i
        };
      }
    }
    this.closeIndentation();
    if (end = this.ends.pop()) {
      this.error("missing " + end.tag, end.origin[2]);
    }
    if (((ref3 = opts.feature) != null ? ref3.rewrite : void 0) === false) {
      log('skipping rewrite!', opts);
    } else {
      (new Rewriter).rewrite(this.tokens, opts);
    }
    return this.tokens;
  };

  Lexer.prototype.clean = function(code) {
    if (code.charCodeAt(0) === BOM) {
      code = code.slice(1);
    }
    code = code.replace(/\r/g, '').replace(TRAILING_SPACES, '');
    if (WHITESPACE.test(code)) {
      code = "\n" + code;
      this.chunkLine--;
    }
    return code;
  };

  Lexer.prototype.identifierToken = function() {
    var alias, colon, colonOffset, id, idLength, input, match, poppedToken, prev, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, tag, tagToken;
    if (!(match = IDENTIFIER.exec(this.chunk))) {
      return 0;
    }
    input = match[0], id = match[1], colon = match[2];
    idLength = id.length;
    poppedToken = void 0;
    if (id === 'own' && this.tag() === 'FOR') {
      this.token('OWN', id);
      return id.length;
    }
    if (id === 'from' && this.tag() === 'YIELD') {
      this.token('FROM', id);
      return id.length;
    }
    if (id === 'as' && this.seenImport) {
      if (this.value() === '*') {
        this.tokens[this.tokens.length - 1][0] = 'IMPORT_ALL';
      } else if (ref2 = this.value(), indexOf.call(COFFEE_KEYWORDS, ref2) >= 0) {
        this.tokens[this.tokens.length - 1][0] = 'IDENTIFIER';
      }
      if ((ref3 = this.tag()) === 'DEFAULT' || ref3 === 'IMPORT_ALL' || ref3 === 'IDENTIFIER') {
        this.token('AS', id);
        return id.length;
      }
    }
    if (id === 'as' && this.seenExport && ((ref4 = this.tag()) === 'IDENTIFIER' || ref4 === 'DEFAULT')) {
      this.token('AS', id);
      return id.length;
    }
    if (id === 'default' && this.seenExport && ((ref5 = this.tag()) === 'EXPORT' || ref5 === 'AS')) {
      this.token('DEFAULT', id);
      return id.length;
    }
    ref6 = this.tokens, prev = ref6[ref6.length - 1];
    tag = colon || (prev != null) && (((ref7 = prev[0]) === '.' || ref7 === '?.' || ref7 === '::' || ref7 === '?::') || !prev.spaced && prev[0] === '@') ? 'PROPERTY' : 'IDENTIFIER';
    if (tag === 'IDENTIFIER' && (indexOf.call(JS_KEYWORDS, id) >= 0 || indexOf.call(COFFEE_KEYWORDS, id) >= 0) && !(this.exportSpecifierList && indexOf.call(COFFEE_KEYWORDS, id) >= 0)) {
      tag = id.toUpperCase();
      if (tag === 'WHEN' && (ref8 = this.tag(), indexOf.call(LINE_BREAK, ref8) >= 0)) {
        tag = 'LEADING_WHEN';
      } else if (tag === 'FOR') {
        this.seenFor = true;
      } else if (tag === 'UNLESS') {
        tag = 'IF';
      } else if (tag === 'IMPORT') {
        this.seenImport = true;
      } else if (tag === 'EXPORT') {
        this.seenExport = true;
      } else if (indexOf.call(UNARY, tag) >= 0) {
        tag = 'UNARY';
      } else if (indexOf.call(RELATION, tag) >= 0) {
        if (tag !== 'INSTANCEOF' && this.seenFor) {
          tag = 'FOR' + tag;
          this.seenFor = false;
        } else {
          tag = 'RELATION';
          if (this.value() === '!') {
            poppedToken = this.tokens.pop();
            id = '!' + id;
          }
        }
      }
    } else if (tag === 'IDENTIFIER' && this.seenFor && id === 'from' && isForFrom(prev)) {
      tag = 'FORFROM';
      this.seenFor = false;
    }
    if (tag === 'IDENTIFIER' && indexOf.call(RESERVED, id) >= 0) {
      this.error("reserved word '" + id + "'", {
        length: id.length
      });
    }
    if (tag !== 'PROPERTY') {
      if (indexOf.call(COFFEE_ALIASES, id) >= 0) {
        alias = id;
        id = COFFEE_ALIAS_MAP[id];
      }
      tag = (function() {
        switch (id) {
          case '!':
            return 'UNARY';
          case '==':
          case '!=':
            return 'COMPARE';
          case 'true':
          case 'false':
            return 'BOOL';
          case 'break':
          case 'continue':
          case 'debugger':
            return 'STATEMENT';
          case '&&':
          case '||':
            return id;
          default:
            return tag;
        }
      })();
    }
    tagToken = this.token(tag, id, 0, idLength);
    if (alias) {
      tagToken.origin = [tag, alias, tagToken[2]];
    }
    if (poppedToken) {
      ref9 = [poppedToken[2].first_line, poppedToken[2].first_column], tagToken[2].first_line = ref9[0], tagToken[2].first_column = ref9[1];
    }
    if (colon) {
      colonOffset = input.lastIndexOf(':');
      this.token(':', ':', colonOffset, colon.length);
    }
    return input.length;
  };

  Lexer.prototype.numberToken = function() {
    var base, lexedLength, match, number, numberValue, ref2, tag;
    if (!(match = NUMBER.exec(this.chunk))) {
      return 0;
    }
    number = match[0];
    lexedLength = number.length;
    switch (false) {
      case !/^0[BOX]/.test(number):
        this.error("radix prefix in '" + number + "' must be lowercase", {
          offset: 1
        });
        break;
      case !/^(?!0x).*E/.test(number):
        this.error("exponential notation in '" + number + "' must be indicated with a lowercase 'e'", {
          offset: number.indexOf('E')
        });
        break;
      case !/^0\d*[89]/.test(number):
        this.error("decimal literal '" + number + "' must not be prefixed with '0'", {
          length: lexedLength
        });
        break;
      case !/^0\d+/.test(number):
        this.error("octal literal '" + number + "' must be prefixed with '0o'", {
          length: lexedLength
        });
    }
    base = (function() {
      switch (number.charAt(1)) {
        case 'b':
          return 2;
        case 'o':
          return 8;
        case 'x':
          return 16;
        default:
          return null;
      }
    })();
    numberValue = base != null ? parseInt(number.slice(2), base) : parseFloat(number);
    if ((ref2 = number.charAt(1)) === 'b' || ref2 === 'o') {
      number = "0x" + (numberValue.toString(16));
    }
    tag = numberValue === 2e308 ? 'INFINITY' : 'NUMBER';
    this.token(tag, number, 0, lexedLength);
    return lexedLength;
  };

  Lexer.prototype.stringToken = function() {
    var $, attempt, delimiter, doc, end, heredoc, i, indent, indentRegex, match, quote, ref2, ref3, regex, token, tokens;
    quote = (STRING_START.exec(this.chunk) || [])[0];
    if (!quote) {
      return 0;
    }
    if (this.tokens.length && this.value() === 'from' && (this.seenImport || this.seenExport)) {
      this.tokens[this.tokens.length - 1][0] = 'FROM';
    }
    regex = (function() {
      switch (quote) {
        case "'":
          return STRING_SINGLE;
        case '"':
          return STRING_DOUBLE;
        case "'''":
          return HEREDOC_SINGLE;
        case '"""':
          return HEREDOC_DOUBLE;
      }
    })();
    heredoc = quote.length === 3;
    ref2 = this.matchWithInterpolations(regex, quote), tokens = ref2.tokens, end = ref2.index;
    $ = tokens.length - 1;
    delimiter = quote.charAt(0);
    if (heredoc) {
      indent = null;
      doc = ((function() {
        var j, len, results;
        results = [];
        for (i = j = 0, len = tokens.length; j < len; i = ++j) {
          token = tokens[i];
          if (token[0] === 'NEOSTRING') {
            results.push(token[1]);
          }
        }
        return results;
      })()).join('#{}');
      while (match = HEREDOC_INDENT.exec(doc)) {
        attempt = match[1];
        if (indent === null || (0 < (ref3 = attempt.length) && ref3 < indent.length)) {
          indent = attempt;
        }
      }
      if (indent) {
        indentRegex = RegExp("\\n" + indent, "g");
      }
      this.mergeInterpolationTokens(tokens, {
        delimiter: delimiter
      }, (function(_this) {
        return function(value, i) {
          value = _this.formatString(value, {
            delimiter: quote
          });
          if (indentRegex) {
            value = value.replace(indentRegex, '\n');
          }
          if (i === 0) {
            value = value.replace(LEADING_BLANK_LINE, '');
          }
          if (i === $) {
            value = value.replace(TRAILING_BLANK_LINE, '');
          }
          return value;
        };
      })(this));
    } else {
      this.mergeInterpolationTokens(tokens, {
        delimiter: delimiter
      }, (function(_this) {
        return function(value, i) {
          value = _this.formatString(value, {
            delimiter: quote
          });
          value = value.replace(SIMPLE_STRING_OMIT, function(match, offset) {
            if ((i === 0 && offset === 0) || (i === $ && offset + match.length === value.length)) {
              return '';
            } else {
              return ' ';
            }
          });
          return value;
        };
      })(this));
    }
    return end;
  };

  Lexer.prototype.commentToken = function() {
    var comment, here, match;
    if (!(match = this.chunk.match(COMMENT))) {
      return 0;
    }
    comment = match[0], here = match[1];
    if (here) {
      if (match = HERECOMMENT_ILLEGAL.exec(comment)) {
        this.error("block comments cannot contain " + match[0], {
          offset: match.index,
          length: match[0].length
        });
      }
      if (here.indexOf('\n') >= 0) {
        here = here.replace(RegExp("\\n" + (repeat(' ', this.indent)), "g"), '\n');
      }
      this.token('HERECOMMENT', here, 0, comment.length);
    }
    return comment.length;
  };

  Lexer.prototype.jsToken = function() {
    var match, script;
    if (!(this.chunk.charAt(0) === '`' && (match = HERE_JSTOKEN.exec(this.chunk) || JSTOKEN.exec(this.chunk)))) {
      return 0;
    }
    script = match[1].replace(/\\+(`|$)/g, function(string) {
      return string.slice(-Math.ceil(string.length / 2));
    });
    this.token('JS', script, 0, match[0].length);
    return match[0].length;
  };

  Lexer.prototype.regexToken = function() {
    var body, closed, end, flags, index, match, origin, prev, ref2, ref3, ref4, regex, tokens;
    switch (false) {
      case !(match = REGEX_ILLEGAL.exec(this.chunk)):
        this.error("regular expressions cannot begin with " + match[2], {
          offset: match.index + match[1].length
        });
        break;
      case !(match = this.matchWithInterpolations(HEREGEX, '///')):
        tokens = match.tokens, index = match.index;
        break;
      case !(match = REGEX.exec(this.chunk)):
        regex = match[0], body = match[1], closed = match[2];
        this.validateEscapes(body, {
          isRegex: true,
          offsetInChunk: 1
        });
        body = this.formatRegex(body, {
          delimiter: '/'
        });
        index = regex.length;
        ref2 = this.tokens, prev = ref2[ref2.length - 1];
        if (prev) {
          if (prev.spaced && (ref3 = prev[0], indexOf.call(CALLABLE, ref3) >= 0)) {
            if (!closed || POSSIBLY_DIVISION.test(regex)) {
              return 0;
            }
          } else if (ref4 = prev[0], indexOf.call(NOT_REGEX, ref4) >= 0) {
            return 0;
          }
        }
        if (!closed) {
          this.error('missing / (unclosed regex)');
        }
        break;
      default:
        return 0;
    }
    flags = REGEX_FLAGS.exec(this.chunk.slice(index))[0];
    end = index + flags.length;
    origin = this.makeToken('REGEX', null, 0, end);
    switch (false) {
      case !!VALID_FLAGS.test(flags):
        this.error("invalid regular expression flags " + flags, {
          offset: index,
          length: flags.length
        });
        break;
      case !(regex || tokens.length === 1):
        if (body == null) {
          body = this.formatHeregex(tokens[0][1]);
        }
        this.token('REGEX', "" + (this.makeDelimitedLiteral(body, {
          delimiter: '/'
        })) + flags, 0, end, origin);
        break;
      default:
        this.token('REGEX_START', '(', 0, 0, origin);
        this.token('IDENTIFIER', 'RegExp', 0, 0);
        this.token('CALL_START', '(', 0, 0);
        this.mergeInterpolationTokens(tokens, {
          delimiter: '"',
          double: true
        }, this.formatHeregex);
        if (flags) {
          this.token(',', ',', index - 1, 0);
          this.token('STRING', '"' + flags + '"', index - 1, flags.length);
        }
        this.token(')', ')', end - 1, 0);
        this.token('REGEX_END', ')', end - 1, 0);
    }
    return end;
  };

  Lexer.prototype.lineToken = function() {
    var diff, indent, match, noNewlines, size;
    if (!(match = MULTI_DENT.exec(this.chunk))) {
      return 0;
    }
    indent = match[0];
    this.seenFor = false;
    if (!this.importSpecifierList) {
      this.seenImport = false;
    }
    if (!this.exportSpecifierList) {
      this.seenExport = false;
    }
    size = indent.length - 1 - indent.lastIndexOf('\n');
    noNewlines = this.unfinished();
    if (size - this.indebt === this.indent) {
      if (noNewlines) {
        this.suppressNewlines();
      } else {
        this.newlineToken(0);
      }
      return indent.length;
    }
    if (size > this.indent) {
      if (noNewlines) {
        this.indebt = size - this.indent;
        this.suppressNewlines();
        return indent.length;
      }
      if (!this.tokens.length) {
        this.baseIndent = this.indent = size;
        return indent.length;
      }
      diff = size - this.indent + this.outdebt;
      this.token('INDENT', diff, indent.length - size, size);
      this.indents.push(diff);
      this.ends.push({
        tag: 'OUTDENT'
      });
      this.outdebt = this.indebt = 0;
      this.indent = size;
    } else if (size < this.baseIndent) {
      this.error('missing indentation', {
        offset: indent.length
      });
    } else {
      this.indebt = 0;
      this.outdentToken(this.indent - size, noNewlines, indent.length);
    }
    return indent.length;
  };

  Lexer.prototype.outdentToken = function(moveOut, noNewlines, outdentLength) {
    var decreasedIndent, dent, lastIndent, ref2;
    decreasedIndent = this.indent - moveOut;
    while (moveOut > 0) {
      lastIndent = this.indents[this.indents.length - 1];
      if (!lastIndent) {
        moveOut = 0;
      } else if (lastIndent === this.outdebt) {
        moveOut -= this.outdebt;
        this.outdebt = 0;
      } else if (lastIndent < this.outdebt) {
        this.outdebt -= lastIndent;
        moveOut -= lastIndent;
      } else {
        dent = this.indents.pop() + this.outdebt;
        if (outdentLength && (ref2 = this.chunk[outdentLength], indexOf.call(INDENTABLE_CLOSERS, ref2) >= 0)) {
          decreasedIndent -= dent - moveOut;
          moveOut = dent;
        }
        this.outdebt = 0;
        this.pair('OUTDENT');
        this.token('OUTDENT', moveOut, 0, outdentLength);
        moveOut -= dent;
      }
    }
    if (dent) {
      this.outdebt -= moveOut;
    }
    while (this.value() === ';') {
      this.tokens.pop();
    }
    if (!(this.tag() === 'TERMINATOR' || noNewlines)) {
      this.token('TERMINATOR', '\n', outdentLength, 0);
    }
    this.indent = decreasedIndent;
    return this;
  };

  Lexer.prototype.whitespaceToken = function() {
    var match, nline, prev, ref2;
    if (!((match = WHITESPACE.exec(this.chunk)) || (nline = this.chunk.charAt(0) === '\n'))) {
      return 0;
    }
    ref2 = this.tokens, prev = ref2[ref2.length - 1];
    if (prev) {
      prev[match ? 'spaced' : 'newLine'] = true;
    }
    if (match) {
      return match[0].length;
    } else {
      return 0;
    }
  };

  Lexer.prototype.newlineToken = function(offset) {
    while (this.value() === ';') {
      this.tokens.pop();
    }
    if (this.tag() !== 'TERMINATOR') {
      this.token('TERMINATOR', '\n', offset, 0);
    }
    return this;
  };

  Lexer.prototype.suppressNewlines = function() {
    if (this.value() === '\\') {
      this.tokens.pop();
    }
    return this;
  };

  Lexer.prototype.literalToken = function() {
    var match, message, origin, prev, ref2, ref3, ref4, ref5, ref6, skipToken, tag, token, value;
    if (match = OPERATOR.exec(this.chunk)) {
      value = match[0];
      if (CODE.test(value)) {
        this.tagParameters();
      }
    } else {
      value = this.chunk.charAt(0);
    }
    tag = value;
    ref2 = this.tokens, prev = ref2[ref2.length - 1];
    if (prev && indexOf.call(['='].concat(slice.call(COMPOUND_ASSIGN)), value) >= 0) {
      skipToken = false;
      if (value === '=' && ((ref3 = prev[1]) === '||' || ref3 === '&&') && !prev.spaced) {
        prev[0] = 'COMPOUND_ASSIGN';
        prev[1] += '=';
        prev = this.tokens[this.tokens.length - 2];
        skipToken = true;
      }
      if (prev && prev[0] !== 'PROPERTY') {
        origin = (ref4 = prev.origin) != null ? ref4 : prev;
        message = isUnassignable(prev[1], origin[1]);
        if (message) {
          this.error(message, origin[2]);
        }
      }
      if (skipToken) {
        return value.length;
      }
    }
    if (value === '{' && this.seenImport) {
      this.importSpecifierList = true;
    } else if (this.importSpecifierList && value === '}') {
      this.importSpecifierList = false;
    } else if (value === '{' && (prev != null ? prev[0] : void 0) === 'EXPORT') {
      this.exportSpecifierList = true;
    } else if (this.exportSpecifierList && value === '}') {
      this.exportSpecifierList = false;
    }
    if (value === ';') {
      this.seenFor = this.seenImport = this.seenExport = false;
      tag = 'TERMINATOR';
    } else if (value === '*' && prev[0] === 'EXPORT') {
      tag = 'EXPORT_ALL';
    } else if (indexOf.call(MATH, value) >= 0) {
      tag = 'MATH';
    } else if (indexOf.call(COMPARE, value) >= 0) {
      tag = 'COMPARE';
    } else if (indexOf.call(COMPOUND_ASSIGN, value) >= 0) {
      tag = 'COMPOUND_ASSIGN';
    } else if (indexOf.call(UNARY, value) >= 0) {
      tag = 'UNARY';
    } else if (indexOf.call(UNARY_MATH, value) >= 0) {
      tag = 'UNARY_MATH';
    } else if (indexOf.call(SHIFT, value) >= 0) {
      tag = 'SHIFT';
    } else if (value === '?' && (prev != null ? prev.spaced : void 0)) {
      tag = 'BIN?';
    } else if (prev && !prev.spaced) {
      if (value === '(' && (ref5 = prev[0], indexOf.call(CALLABLE, ref5) >= 0)) {
        if (prev[0] === '?') {
          prev[0] = 'FUNC_EXIST';
        }
        tag = 'CALL_START';
      } else if (value === '[' && (ref6 = prev[0], indexOf.call(INDEXABLE, ref6) >= 0)) {
        tag = 'INDEX_START';
        switch (prev[0]) {
          case '?':
            prev[0] = 'INDEX_SOAK';
        }
      }
    }
    token = this.makeToken(tag, value);
    switch (value) {
      case '(':
      case '{':
      case '[':
        this.ends.push({
          tag: INVERSES[value],
          origin: token
        });
        break;
      case ')':
      case '}':
      case ']':
        this.pair(value);
    }
    this.tokens.push(token);
    return value.length;
  };


  /*
  00     00   0000000   000   000  000  00000000   000   000  000       0000000   000000000   0000000   00000000    0000000  
  000   000  000   000  0000  000  000  000   000  000   000  000      000   000     000     000   000  000   000  000       
  000000000  000000000  000 0 000  000  00000000   000   000  000      000000000     000     000   000  0000000    0000000   
  000 0 000  000   000  000  0000  000  000        000   000  000      000   000     000     000   000  000   000       000  
  000   000  000   000  000   000  000  000         0000000   0000000  000   000     000      0000000   000   000  0000000
   */

  Lexer.prototype.tagParameters = function() {
    var i, stack, tok, tokens;
    if (this.tag() !== ')') {
      return this;
    }
    stack = [];
    tokens = this.tokens;
    i = tokens.length;
    tokens[--i][0] = 'PARAM_END';
    while (tok = tokens[--i]) {
      switch (tok[0]) {
        case ')':
          stack.push(tok);
          break;
        case '(':
        case 'CALL_START':
          if (stack.length) {
            stack.pop();
          } else if (tok[0] === '(') {
            tok[0] = 'PARAM_START';
            return this;
          } else {
            return this;
          }
      }
    }
    return this;
  };

  Lexer.prototype.closeIndentation = function() {
    return this.outdentToken(this.indent);
  };

  Lexer.prototype.matchWithInterpolations = function(regex, delimiter) {
    var close, column, firstToken, index, lastToken, line, nested, offsetInChunk, open, ref2, ref3, ref4, str, strPart, tokens;
    tokens = [];
    offsetInChunk = delimiter.length;
    if (this.chunk.slice(0, offsetInChunk) !== delimiter) {
      return null;
    }
    str = this.chunk.slice(offsetInChunk);
    while (true) {
      strPart = regex.exec(str)[0];
      this.validateEscapes(strPart, {
        isRegex: delimiter.charAt(0) === '/',
        offsetInChunk: offsetInChunk
      });
      tokens.push(this.makeToken('NEOSTRING', strPart, offsetInChunk));
      str = str.slice(strPart.length);
      offsetInChunk += strPart.length;
      if (str.slice(0, 2) !== '#{') {
        break;
      }
      ref2 = this.getLineAndColumnFromChunk(offsetInChunk + 1), line = ref2[0], column = ref2[1];
      ref3 = new Lexer().tokenize(str.slice(1), {
        line: line,
        column: column,
        untilBalanced: true
      }), nested = ref3.tokens, index = ref3.index;
      index += 1;
      open = nested[0], close = nested[nested.length - 1];
      open[0] = open[1] = '(';
      close[0] = close[1] = ')';
      close.origin = ['', 'end of interpolation', close[2]];
      if (((ref4 = nested[1]) != null ? ref4[0] : void 0) === 'TERMINATOR') {
        nested.splice(1, 1);
      }
      tokens.push(['TOKENS', nested]);
      str = str.slice(index);
      offsetInChunk += index;
    }
    if (str.slice(0, delimiter.length) !== delimiter) {
      this.error("missing " + delimiter, {
        length: delimiter.length
      });
    }
    firstToken = tokens[0], lastToken = tokens[tokens.length - 1];
    firstToken[2].first_column -= delimiter.length;
    if (lastToken[1].substr(-1) === '\n') {
      lastToken[2].last_line += 1;
      lastToken[2].last_column = delimiter.length - 1;
    } else {
      lastToken[2].last_column += delimiter.length;
    }
    if (lastToken[1].length === 0) {
      lastToken[2].last_column -= 1;
    }
    return {
      tokens: tokens,
      index: offsetInChunk + delimiter.length
    };
  };

  Lexer.prototype.mergeInterpolationTokens = function(tokens, options, fn) {
    var converted, firstEmptyStringIndex, firstIndex, i, j, lastToken, len, locationToken, lparen, plusToken, ref2, rparen, tag, token, tokensToPush, value;
    if (tokens.length > 1) {
      lparen = this.token('STRING_START', '(', 0, 0);
    }
    firstIndex = this.tokens.length;
    for (i = j = 0, len = tokens.length; j < len; i = ++j) {
      token = tokens[i];
      tag = token[0], value = token[1];
      switch (tag) {
        case 'TOKENS':
          if (value.length === 2) {
            continue;
          }
          locationToken = value[0];
          tokensToPush = value;
          break;
        case 'NEOSTRING':
          converted = fn.call(this, token[1], i);
          if (converted.length === 0) {
            if (i === 0) {
              firstEmptyStringIndex = this.tokens.length;
            } else {
              continue;
            }
          }
          if (i === 2 && (firstEmptyStringIndex != null)) {
            this.tokens.splice(firstEmptyStringIndex, 2);
          }
          token[0] = 'STRING';
          token[1] = this.makeDelimitedLiteral(converted, options);
          locationToken = token;
          tokensToPush = [token];
      }
      if (this.tokens.length > firstIndex) {
        plusToken = this.token('+', '+');
        plusToken[2] = {
          first_line: locationToken[2].first_line,
          first_column: locationToken[2].first_column,
          last_line: locationToken[2].first_line,
          last_column: locationToken[2].first_column
        };
      }
      (ref2 = this.tokens).push.apply(ref2, tokensToPush);
    }
    if (lparen) {
      lastToken = tokens[tokens.length - 1];
      lparen.origin = [
        'STRING', null, {
          first_line: lparen[2].first_line,
          first_column: lparen[2].first_column,
          last_line: lastToken[2].last_line,
          last_column: lastToken[2].last_column
        }
      ];
      rparen = this.token('STRING_END', ')');
      return rparen[2] = {
        first_line: lastToken[2].last_line,
        first_column: lastToken[2].last_column,
        last_line: lastToken[2].last_line,
        last_column: lastToken[2].last_column
      };
    }
  };

  Lexer.prototype.pair = function(tag) {
    var lastIndent, prev, ref2, ref3, wanted;
    ref2 = this.ends, prev = ref2[ref2.length - 1];
    if (tag !== (wanted = prev != null ? prev.tag : void 0)) {
      if ('OUTDENT' !== wanted) {
        this.error("unmatched " + tag);
      }
      ref3 = this.indents, lastIndent = ref3[ref3.length - 1];
      this.outdentToken(lastIndent, true);
      return this.pair(tag);
    }
    return this.ends.pop();
  };

  Lexer.prototype.getLineAndColumnFromChunk = function(offset) {
    var column, lastLine, lineCount, ref2, string;
    if (offset === 0) {
      return [this.chunkLine, this.chunkColumn];
    }
    if (offset >= this.chunk.length) {
      string = this.chunk;
    } else {
      string = this.chunk.slice(0, +(offset - 1) + 1 || 9e9);
    }
    lineCount = count(string, '\n');
    column = this.chunkColumn;
    if (lineCount > 0) {
      ref2 = string.split('\n'), lastLine = ref2[ref2.length - 1];
      column = lastLine.length;
    } else {
      column += string.length;
    }
    return [this.chunkLine + lineCount, column];
  };

  Lexer.prototype.makeToken = function(tag, value, offsetInChunk, length) {
    var lastCharacter, locationData, ref2, ref3, token;
    if (offsetInChunk == null) {
      offsetInChunk = 0;
    }
    if (length == null) {
      length = value.length;
    }
    locationData = {};
    ref2 = this.getLineAndColumnFromChunk(offsetInChunk), locationData.first_line = ref2[0], locationData.first_column = ref2[1];
    lastCharacter = length > 0 ? length - 1 : 0;
    ref3 = this.getLineAndColumnFromChunk(offsetInChunk + lastCharacter), locationData.last_line = ref3[0], locationData.last_column = ref3[1];
    token = [tag, value, locationData];
    return token;
  };

  Lexer.prototype.token = function(tag, value, offsetInChunk, length, origin) {
    var token;
    token = this.makeToken(tag, value, offsetInChunk, length);
    if (origin) {
      token.origin = origin;
    }
    this.tokens.push(token);
    return token;
  };

  Lexer.prototype.tag = function() {
    var ref2, token;
    ref2 = this.tokens, token = ref2[ref2.length - 1];
    return token != null ? token[0] : void 0;
  };

  Lexer.prototype.value = function() {
    var ref2, token;
    ref2 = this.tokens, token = ref2[ref2.length - 1];
    return token != null ? token[1] : void 0;
  };

  Lexer.prototype.unfinished = function() {
    var ref2;
    return LINE_CONTINUER.test(this.chunk) || (ref2 = this.tag(), indexOf.call(UNFINISHED, ref2) >= 0);
  };

  Lexer.prototype.formatString = function(str, options) {
    return this.replaceUnicodeCodePointEscapes(str.replace(STRING_OMIT, '$1'), options);
  };

  Lexer.prototype.formatHeregex = function(str) {
    return this.formatRegex(str.replace(HEREGEX_OMIT, '$1$2'), {
      delimiter: '///'
    });
  };

  Lexer.prototype.formatRegex = function(str, options) {
    return this.replaceUnicodeCodePointEscapes(str, options);
  };

  Lexer.prototype.unicodeCodePointToUnicodeEscapes = function(codePoint) {
    var high, low, toUnicodeEscape;
    toUnicodeEscape = function(val) {
      var str;
      str = val.toString(16);
      return "\\u" + (repeat('0', 4 - str.length)) + str;
    };
    if (codePoint < 0x10000) {
      return toUnicodeEscape(codePoint);
    }
    high = Math.floor((codePoint - 0x10000) / 0x400) + 0xD800;
    low = (codePoint - 0x10000) % 0x400 + 0xDC00;
    return "" + (toUnicodeEscape(high)) + (toUnicodeEscape(low));
  };

  Lexer.prototype.replaceUnicodeCodePointEscapes = function(str, options) {
    return str.replace(UNICODE_CODE_POINT_ESCAPE, (function(_this) {
      return function(match, escapedBackslash, codePointHex, offset) {
        var codePointDecimal;
        if (escapedBackslash) {
          return escapedBackslash;
        }
        codePointDecimal = parseInt(codePointHex, 16);
        if (codePointDecimal > 0x10ffff) {
          _this.error("unicode code point escapes greater than \\u{10ffff} are not allowed", {
            offset: offset + options.delimiter.length,
            length: codePointHex.length + 4
          });
        }
        return _this.unicodeCodePointToUnicodeEscapes(codePointDecimal);
      };
    })(this));
  };

  Lexer.prototype.validateEscapes = function(str, options) {
    var before, hex, invalidEscape, invalidEscapeRegex, match, message, octal, ref2, unicode, unicodeCodePoint;
    if (options == null) {
      options = {};
    }
    invalidEscapeRegex = options.isRegex ? REGEX_INVALID_ESCAPE : STRING_INVALID_ESCAPE;
    match = invalidEscapeRegex.exec(str);
    if (!match) {
      return;
    }
    match[0], before = match[1], octal = match[2], hex = match[3], unicodeCodePoint = match[4], unicode = match[5];
    message = octal ? "octal escape sequences are not allowed" : "invalid escape sequence";
    invalidEscape = "\\" + (octal || hex || unicodeCodePoint || unicode);
    return this.error(message + " " + invalidEscape, {
      offset: ((ref2 = options.offsetInChunk) != null ? ref2 : 0) + match.index + before.length,
      length: invalidEscape.length
    });
  };

  Lexer.prototype.makeDelimitedLiteral = function(body, options) {
    var regex;
    if (options == null) {
      options = {};
    }
    if (body === '' && options.delimiter === '/') {
      body = '(?:)';
    }
    regex = RegExp("(\\\\\\\\)|(\\\\0(?=[1-7]))|\\\\?(" + options.delimiter + ")|\\\\?(?:(\\n)|(\\r)|(\\u2028)|(\\u2029))|(\\\\.)", "g");
    body = body.replace(regex, function(match, backslash, nul, delimiter, lf, cr, ls, ps, other) {
      switch (false) {
        case !backslash:
          if (options.double) {
            return backslash + backslash;
          } else {
            return backslash;
          }
        case !nul:
          return '\\x00';
        case !delimiter:
          return "\\" + delimiter;
        case !lf:
          return '\\n';
        case !cr:
          return '\\r';
        case !ls:
          return '\\u2028';
        case !ps:
          return '\\u2029';
        case !other:
          if (options.double) {
            return "\\" + other;
          } else {
            return other;
          }
      }
    });
    return "" + options.delimiter + body + options.delimiter;
  };

  Lexer.prototype.error = function(message, options) {
    var first_column, first_line, location, ref2, ref3, ref4;
    if (options == null) {
      options = {};
    }
    location = 'first_line' in options ? options : ((ref3 = this.getLineAndColumnFromChunk((ref2 = options.offset) != null ? ref2 : 0), first_line = ref3[0], first_column = ref3[1], ref3), {
      first_line: first_line,
      first_column: first_column,
      last_column: first_column + ((ref4 = options.length) != null ? ref4 : 1) - 1
    });
    return throwSyntaxError(message, location);
  };

  return Lexer;

})();

isUnassignable = function(name, displayName) {
  if (displayName == null) {
    displayName = name;
  }
  switch (false) {
    case indexOf.call(slice.call(JS_KEYWORDS).concat(slice.call(COFFEE_KEYWORDS)), name) < 0:
      return "keyword '" + displayName + "' can't be assigned";
    case indexOf.call(STRICT_PROSCRIBED, name) < 0:
      return "'" + displayName + "' can't be assigned";
    case indexOf.call(RESERVED, name) < 0:
      return "reserved word '" + displayName + "' can't be assigned";
    default:
      return false;
  }
};

exports.isUnassignable = isUnassignable;

exports.Lexer = Lexer;

isForFrom = function(prev) {
  var ref2;
  if (prev[0] === 'IDENTIFIER') {
    if (prev[1] === 'from') {
      prev[1][0] = 'IDENTIFIER';
      true;
    }
    return true;
  } else if (prev[0] === 'FOR') {
    return false;
  } else if ((ref2 = prev[1]) === '{' || ref2 === '[' || ref2 === ',' || ref2 === ':') {
    return false;
  } else {
    return true;
  }
};


/*
 0000000   0000000   000   000   0000000  000000000   0000000   000   000  000000000   0000000  
000       000   000  0000  000  000          000     000   000  0000  000     000     000       
000       000   000  000 0 000  0000000      000     000000000  000 0 000     000     0000000   
000       000   000  000  0000       000     000     000   000  000  0000     000          000  
 0000000   0000000   000   000  0000000      000     000   000  000   000     000     0000000
 */

JS_KEYWORDS = ['true', 'false', 'null', 'this', 'new', 'delete', 'typeof', 'in', 'instanceof', 'return', 'throw', 'break', 'continue', 'debugger', 'yield', 'if', 'else', 'switch', 'for', 'while', 'do', 'try', 'catch', 'finally', 'class', 'extends', 'super', 'import', 'export', 'default'];

COFFEE_KEYWORDS = ['undefined', 'Infinity', 'NaN', 'then', 'unless', 'until', 'loop', 'of', 'by', 'when'];

COFFEE_ALIAS_MAP = {
  and: '&&',
  or: '||',
  is: '==',
  isnt: '!=',
  not: '!',
  yes: 'true',
  no: 'false',
  on: 'true',
  off: 'false'
};

COFFEE_ALIASES = (function() {
  var results;
  results = [];
  for (key in COFFEE_ALIAS_MAP) {
    results.push(key);
  }
  return results;
})();

COFFEE_KEYWORDS = COFFEE_KEYWORDS.concat(COFFEE_ALIASES);

RESERVED = ['case', 'function', 'var', 'void', 'with', 'const', 'let', 'enum', 'native', 'implements', 'interface', 'package', 'private', 'protected', 'public', 'static'];

STRICT_PROSCRIBED = ['arguments', 'eval'];

exports.JS_FORBIDDEN = JS_KEYWORDS.concat(RESERVED).concat(STRICT_PROSCRIBED);

BOM = 65279;

IDENTIFIER = /^(?!\d)((?:(?!\s)[$\w\x7f-\uffff])+)([^\n\S]*:(?!:))?/;

NUMBER = /^0b[01]+|^0o[0-7]+|^0x[\da-f]+|^\d*\.?\d+(?:e[+-]?\d+)?/i;

OPERATOR = /^(?:[-=]>|[-+*\/%<>&|^!?=]=|>>>=?|([-+:])\1|([&|<>*\/%])\2=?|\?(\.|::)|\.{2,3})/;

WHITESPACE = /^[^\n\S]+/;

CODE = /^[-=]>/;

MULTI_DENT = /^(?:\n[^\n\S]*)+/;

JSTOKEN = /^`(?!``)((?:[^`\\]|\\[\s\S])*)`/;

HERE_JSTOKEN = /^```((?:[^`\\]|\\[\s\S]|`(?!``))*)```/;

STRING_START = /^(?:'''|"""|'|")/;

STRING_SINGLE = /^(?:[^\\']|\\[\s\S])*/;

STRING_DOUBLE = /^(?:[^\\"#]|\\[\s\S]|\#(?!\{))*/;

HEREDOC_SINGLE = /^(?:[^\\']|\\[\s\S]|'(?!''))*/;

HEREDOC_DOUBLE = /^(?:[^\\"#]|\\[\s\S]|"(?!"")|\#(?!\{))*/;

STRING_OMIT = /((?:\\\\)+)|\\[^\S\n]*\n\s*/g;

SIMPLE_STRING_OMIT = /\s*\n\s*/g;

HEREDOC_INDENT = /\n+([^\n\S]*)(?=\S)/g;

REGEX = /^\/(?!\/)((?:[^[\/\n\\]|\\[^\n]|\[(?:\\[^\n]|[^\]\n\\])*\])*)(\/)?/;

REGEX_FLAGS = /^\w*/;

VALID_FLAGS = /^(?!.*(.).*\1)[imguy]*$/;

HEREGEX = /^(?:[^\\\/#]|\\[\s\S]|\/(?!\/\/)|\#(?!\{))*/;

HEREGEX_OMIT = /((?:\\\\)+)|\\(\s)|\s+(?:#.*)?/g;

REGEX_ILLEGAL = /^(\/|\/{3}\s*)(\*)/;

POSSIBLY_DIVISION = /^\/=?\s/;

HERECOMMENT_ILLEGAL = /\*\//;

LINE_CONTINUER = /^\s*(?:,|\??\.(?![.\d])|::)/;

STRING_INVALID_ESCAPE = /((?:^|[^\\])(?:\\\\)*)\\(?:(0[0-7]|[1-7])|(x(?![\da-fA-F]{2}).{0,2})|(u\{(?![\da-fA-F]{1,}\})[^}]*\}?)|(u(?!\{|[\da-fA-F]{4}).{0,4}))/;

REGEX_INVALID_ESCAPE = /((?:^|[^\\])(?:\\\\)*)\\(?:(0[0-7])|(x(?![\da-fA-F]{2}).{0,2})|(u\{(?![\da-fA-F]{1,}\})[^}]*\}?)|(u(?!\{|[\da-fA-F]{4}).{0,4}))/;

UNICODE_CODE_POINT_ESCAPE = /(\\\\)|\\u\{([\da-fA-F]+)\}/g;

LEADING_BLANK_LINE = /^[^\n\S]*\n/;

TRAILING_BLANK_LINE = /\n[^\n\S]*$/;

TRAILING_SPACES = /\s+$/;

COMPOUND_ASSIGN = ['-=', '+=', '/=', '*=', '%=', '||=', '&&=', '?=', '<<=', '>>=', '>>>=', '&=', '^=', '|=', '**=', '//=', '%%='];

UNARY = ['NEW', 'TYPEOF', 'DELETE', 'DO'];

UNARY_MATH = ['!', '~'];

SHIFT = ['<<', '>>', '>>>'];

COMPARE = ['==', '!=', '<', '>', '<=', '>='];

MATH = ['*', '/', '%', '//', '%%'];

RELATION = ['IN', 'OF', 'INSTANCEOF'];

BOOL = ['TRUE', 'FALSE'];

CALLABLE = ['IDENTIFIER', 'PROPERTY', ')', ']', '?', '@', 'THIS', 'SUPER'];

INDEXABLE = CALLABLE.concat(['NUMBER', 'INFINITY', 'NAN', 'STRING', 'STRING_END', 'REGEX', 'REGEX_END', 'BOOL', 'NULL', 'UNDEFINED', '}', '::']);

NOT_REGEX = INDEXABLE.concat(['++', '--']);

LINE_BREAK = ['INDENT', 'OUTDENT', 'TERMINATOR'];

INDENTABLE_CLOSERS = [')', '}', ']'];

UNFINISHED = ['\\', '.', '?.', '?::', 'UNARY', 'MATH', 'UNARY_MATH', '+', '-', '**', 'SHIFT', 'RELATION', 'COMPARE', '&', '^', '|', '&&', '||', 'BIN?', 'THROW', 'EXTENDS'];

COMMENT = /^###([^#][\s\S]*?)(?:###[^\n\S]*|###$)|^(?:\s*#(?!##[^#]).*)+/;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4ZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7OztBQUFBLElBQUEsbTJCQUFBO0VBQUE7OztBQWlCQSxNQUF1QixPQUFBLENBQVEsWUFBUixDQUF2QixFQUFDLHVCQUFELEVBQVc7O0FBRVgsT0FBMkUsT0FBQSxDQUFRLFdBQVIsQ0FBM0UsRUFBQyxrQkFBRCxFQUFRLG9CQUFSLEVBQWdCLHNCQUFoQixFQUF5QixvQkFBekIsRUFBaUMsZ0RBQWpDLEVBQXVEOztBQUV2RCxHQUFBLEdBQU0sT0FBTyxDQUFDOztBQUtSOzs7a0JBaUJGLFFBQUEsR0FBVSxTQUFDLElBQUQsRUFBTyxJQUFQO0FBRU4sUUFBQTs7TUFGYSxPQUFPOztJQUVwQixJQUFDLENBQUEsTUFBRCxHQUFjO0lBQ2QsSUFBQyxDQUFBLFVBQUQsR0FBYztJQUNkLElBQUMsQ0FBQSxNQUFELEdBQWM7SUFDZCxJQUFDLENBQUEsT0FBRCxHQUFjO0lBQ2QsSUFBQyxDQUFBLE9BQUQsR0FBYztJQUNkLElBQUMsQ0FBQSxJQUFELEdBQWM7SUFDZCxJQUFDLENBQUEsTUFBRCxHQUFjO0lBQ2QsSUFBQyxDQUFBLE9BQUQsR0FBYztJQUNkLElBQUMsQ0FBQSxVQUFELEdBQWM7SUFDZCxJQUFDLENBQUEsVUFBRCxHQUFjO0lBQ2QsSUFBQyxDQUFBLG1CQUFELEdBQXVCO0lBQ3ZCLElBQUMsQ0FBQSxtQkFBRCxHQUF1QjtJQUV2QixJQUFDLENBQUEsU0FBRCxHQUNJLElBQUksQ0FBQyxJQUFMLElBQWE7SUFDakIsSUFBQyxDQUFBLFdBQUQsR0FDSSxJQUFJLENBQUMsTUFBTCxJQUFlO0lBQ25CLElBQUEsR0FBTyxJQUFDLENBQUEsS0FBRCxDQUFPLElBQVA7SUFLUCxDQUFBLEdBQUk7QUFDSixXQUFNLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBSyxTQUFwQjtNQUNJLFFBQUEsR0FDUyxJQUFDLENBQUEsZUFBRCxDQUFBLENBQUEs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R0FBckMsRUFBMEMsR0FBMUMsRUFBK0MsTUFBL0MsRUFBdUQsT0FBdkQ7O0FBQ1osU0FBQSxHQUFZLFFBQVEsQ0FBQyxNQUFULENBQWdCLENBQ3hCLFFBRHdCLEVBQ2QsVUFEYyxFQUNGLEtBREUsRUFDSyxRQURMLEVBQ2UsWUFEZixFQUM2QixPQUQ3QixFQUNzQyxXQUR0QyxFQUV4QixNQUZ3QixFQUVoQixNQUZnQixFQUVSLFdBRlEsRUFFSyxHQUZMLEVBRVUsSUFGVixDQUFoQjs7QUFVWixTQUFBLEdBQVksU0FBUyxDQUFDLE1BQVYsQ0FBaUIsQ0FBQyxJQUFELEVBQU8sSUFBUCxDQUFqQjs7QUFNWixVQUFBLEdBQWEsQ0FBQyxRQUFELEVBQVcsU0FBWCxFQUFzQixZQUF0Qjs7QUFJYixrQkFBQSxHQUFxQixDQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsR0FBWDs7QUFJckIsVUFBQSxHQUFhLENBQUMsSUFBRCxFQUFPLEdBQVAsRUFBWSxJQUFaLEVBQWtCLEtBQWxCLEVBQXlCLE9BQXpCLEVBQWtDLE1BQWxDLEVBQTBDLFlBQTFDLEVBQXdELEdBQXhELEVBQTZELEdBQTdELEVBQ0MsSUFERCxFQUNPLE9BRFAsRUFDZ0IsVUFEaEIsRUFDNEIsU0FENUIsRUFDdUMsR0FEdkMsRUFDNEMsR0FENUMsRUFDaUQsR0FEakQsRUFDc0QsSUFEdEQsRUFDNEQsSUFENUQsRUFFQyxNQUZELEVBRVMsT0FGVCxFQUVrQixTQUZsQjs7QUFJYixPQUFBLEdBQWEiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuMDAwICAgICAgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4wMDAgICAgICAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbjAwMCAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4jIyNcblxuIyBUaGUgTGV4ZXIgdXNlcyBhIHNlcmllcyBvZiB0b2tlbi1tYXRjaGluZyByZWdleGVzIHRvIGF0dGVtcHQgbWF0Y2hlcyBhZ2FpbnN0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIHNvdXJjZSBjb2RlLiBcbiMgV2hlbiBhIG1hdGNoIGlzIGZvdW5kLCBhIHRva2VuIGlzIHByb2R1Y2VkLCB3ZSBjb25zdW1lIHRoZSBtYXRjaCwgYW5kIHN0YXJ0IGFnYWluLiBcbiMgVG9rZW5zIGFyZSBpbiB0aGUgZm9ybTpcbiNcbiMgICAgW3RhZywgdmFsdWUsIGxvY2F0aW9uRGF0YV1cbiNcbiMgd2hlcmUgbG9jYXRpb25EYXRhIGlzIHtmaXJzdF9saW5lLCBmaXJzdF9jb2x1bW4sIGxhc3RfbGluZSwgbGFzdF9jb2x1bW59LCBcbiMgd2hpY2ggaXMgYSBmb3JtYXQgdGhhdCBjYW4gYmUgZmVkIGRpcmVjdGx5IGludG8gSmlzb24gdmlhIHRoZSBgcGFyc2VyLmxleGVyYCBmdW5jdGlvbiBkZWZpbmVkIGluIGtvZmZlZS5jb2ZmZWUuXG5cbntSZXdyaXRlciwgSU5WRVJTRVN9ID0gcmVxdWlyZSAnLi9yZXdyaXRlcidcblxue2NvdW50LCBzdGFydHMsIGNvbXBhY3QsIHJlcGVhdCwgbG9jYXRpb25EYXRhVG9TdHJpbmcsIHRocm93U3ludGF4RXJyb3J9ID0gcmVxdWlyZSAnLi9oZWxwZXJzJ1xuXG5sb2cgPSBjb25zb2xlLmxvZ1xuXG4jIFRoZSBMZXhlciBjbGFzcyByZWFkcyBhIHN0cmluZyBhbmQgZGl2dmllcyBpdCB1cCBpbnRvIHRhZ2dlZCB0b2tlbnMuIFxuIyBTb21lIHBvdGVudGlhbCBhbWJpZ3VpdHkgaW4gdGhlIGdyYW1tYXIgaGFzIGJlZW4gYXZvaWRlZCBieSBwdXNoaW5nIHNvbWUgZXh0cmEgc21hcnRzIGludG8gdGhlIExleGVyLlxuXG5jbGFzcyBMZXhlclxuXG4gICAgIyB0b2tlbml6ZSBpcyB0aGUgTGV4ZXIncyBtYWluIG1ldGhvZC4gU2NhbiBieSBhdHRlbXB0aW5nIHRvIG1hdGNoIHRva2Vuc1xuICAgICMgb25lIGF0IGEgdGltZSwgdXNpbmcgYSByZWd1bGFyIGV4cHJlc3Npb24gYW5jaG9yZWQgYXQgdGhlIHN0YXJ0IG9mIHRoZVxuICAgICMgcmVtYWluaW5nIGNvZGUsIG9yIGEgY3VzdG9tIHJlY3Vyc2l2ZSB0b2tlbi1tYXRjaGluZyBtZXRob2QgKGZvciBpbnRlcnBvbGF0aW9ucykuIFxuICAgICMgV2hlbiB0aGUgbmV4dCB0b2tlbiBoYXMgYmVlbiByZWNvcmRlZCwgd2UgbW92ZSBmb3J3YXJkIHdpdGhpbiB0aGUgY29kZSBwYXN0IHRoZSB0b2tlbiwgYW5kIGJlZ2luIGFnYWluLlxuICAgICNcbiAgICAjIEVhY2ggdG9rZW5pemluZyBtZXRob2QgaXMgcmVzcG9uc2libGUgZm9yIHJldHVybmluZyB0aGUgbnVtYmVyIG9mIGNoYXJhY3RlcnMgaXQgaGFzIGNvbnN1bWVkLlxuICAgICNcbiAgICAjIEJlZm9yZSByZXR1cm5pbmcgdGhlIHRva2VuIHN0cmVhbSwgcnVuIGl0IHRocm91Z2ggdGhlIFJld3JpdGVyLlxuICAgIFxuICAgICMgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAgIDAwMCAgIDAwMCAgICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgICAwMDAgICAgMDAwMDAwMCAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICB0b2tlbml6ZTogKGNvZGUsIG9wdHMgPSB7fSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBpbmRlbnQgICAgID0gMCAgICAgICAgICAgICMgVGhlIGN1cnJlbnQgaW5kZW50YXRpb24gbGV2ZWwuXG4gICAgICAgIEBiYXNlSW5kZW50ID0gMCAgICAgICAgICAgICMgVGhlIG92ZXJhbGwgbWluaW11bSBpbmRlbnRhdGlvbiBsZXZlbFxuICAgICAgICBAaW5kZWJ0ICAgICA9IDAgICAgICAgICAgICAjIFRoZSBvdmVyLWluZGVudGF0aW9uIGF0IHRoZSBjdXJyZW50IGxldmVsLlxuICAgICAgICBAb3V0ZGVidCAgICA9IDAgICAgICAgICAgICAjIFRoZSB1bmRlci1vdXRkZW50YXRpb24gYXQgdGhlIGN1cnJlbnQgbGV2ZWwuXG4gICAgICAgIEBpbmRlbnRzICAgID0gW10gICAgICAgICAgICMgVGhlIHN0YWNrIG9mIGFsbCBjdXJyZW50IGluZGVudGF0aW9uIGxldmVscy5cbiAgICAgICAgQGVuZHMgICAgICAgPSBbXSAgICAgICAgICAgIyBUaGUgc3RhY2sgZm9yIHBhaXJpbmcgdXAgdG9rZW5zLlxuICAgICAgICBAdG9rZW5zICAgICA9IFtdICAgICAgICAgICAjIFN0cmVhbSBvZiBwYXJzZWQgdG9rZW5zIGluIHRoZSBmb3JtIGBbJ1RZUEUnLCB2YWx1ZSwgbG9jYXRpb24gZGF0YV1gLlxuICAgICAgICBAc2VlbkZvciAgICA9IG5vICAgICAgICAgICAjIFVzZWQgdG8gcmVjb2duaXplIEZPUklOLCBGT1JPRiBhbmQgRk9SRlJPTSB0b2tlbnMuXG4gICAgICAgIEBzZWVuSW1wb3J0ID0gbm8gICAgICAgICAgICMgVXNlZCB0byByZWNvZ25pemUgSU1QT1JUIEZST00/IEFTPyB0b2tlbnMuXG4gICAgICAgIEBzZWVuRXhwb3J0ID0gbm8gICAgICAgICAgICMgVXNlZCB0byByZWNvZ25pemUgRVhQT1JUIEZST00/IEFTPyB0b2tlbnMuXG4gICAgICAgIEBpbXBvcnRTcGVjaWZpZXJMaXN0ID0gbm8gICMgVXNlZCB0byBpZGVudGlmeSB3aGVuIGluIGFuIElNUE9SVCB7Li4ufSBGUk9NPyAuLi5cbiAgICAgICAgQGV4cG9ydFNwZWNpZmllckxpc3QgPSBubyAgIyBVc2VkIHRvIGlkZW50aWZ5IHdoZW4gaW4gYW4gRVhQT1JUIHsuLi59IEZST00/IC4uLlxuXG4gICAgICAgIEBjaHVua0xpbmUgPVxuICAgICAgICAgICAgb3B0cy5saW5lIG9yIDAgICAgICAgICAjIFRoZSBzdGFydCBsaW5lIGZvciB0aGUgY3VycmVudCBAY2h1bmsuXG4gICAgICAgIEBjaHVua0NvbHVtbiA9XG4gICAgICAgICAgICBvcHRzLmNvbHVtbiBvciAwICAgICAgICMgVGhlIHN0YXJ0IGNvbHVtbiBvZiB0aGUgY3VycmVudCBAY2h1bmsuXG4gICAgICAgIGNvZGUgPSBAY2xlYW4gY29kZSAgICAgICAgICMgVGhlIHN0cmlwcGVkLCBjbGVhbmVkIG9yaWdpbmFsIHNvdXJjZSBjb2RlLlxuXG4gICAgICAgICMgQXQgZXZlcnkgcG9zaXRpb24sIHJ1biB0aHJvdWdoIHRoaXMgbGlzdCBvZiBhdHRlbXB0ZWQgbWF0Y2hlcywgc2hvcnQtY2lyY3VpdGluZyBpZiBhbnkgb2YgdGhlbSBzdWNjZWVkLiBcbiAgICAgICAgIyBUaGVpciBvcmRlciBkZXRlcm1pbmVzIHByZWNlZGVuY2U6IGBAbGl0ZXJhbFRva2VuYCBpcyB0aGUgZmFsbGJhY2sgY2F0Y2gtYWxsLlxuICAgICAgICBcbiAgICAgICAgaSA9IDBcbiAgICAgICAgd2hpbGUgQGNodW5rID0gY29kZVtpLi5dXG4gICAgICAgICAgICBjb25zdW1lZCA9IFxcXG4gICAgICAgICAgICAgICAgICAgICBAaWRlbnRpZmllclRva2VuKCkgb3JcbiAgICAgICAgICAgICAgICAgICAgIEBjb21tZW50VG9rZW4oKSAgICBvclxuICAgICAgICAgICAgICAgICAgICAgQHdoaXRlc3BhY2VUb2tlbigpIG9yXG4gICAgICAgICAgICAgICAgICAgICBAbGluZVRva2VuKCkgICAgICAgb3JcbiAgICAgICAgICAgICAgICAgICAgIEBzdHJpbmdUb2tlbigpICAgICBvclxuICAgICAgICAgICAgICAgICAgICAgQG51bWJlclRva2VuKCkgICAgIG9yXG4gICAgICAgICAgICAgICAgICAgICBAcmVnZXhUb2tlbigpICAgICAgb3JcbiAgICAgICAgICAgICAgICAgICAgIEBqc1Rva2VuKCkgICAgICAgICBvclxuICAgICAgICAgICAgICAgICAgICAgQGxpdGVyYWxUb2tlbigpXG5cbiAgICAgICAgICAgICMgVXBkYXRlIHBvc2l0aW9uXG4gICAgICAgICAgICBbQGNodW5rTGluZSwgQGNodW5rQ29sdW1uXSA9IEBnZXRMaW5lQW5kQ29sdW1uRnJvbUNodW5rIGNvbnN1bWVkXG5cbiAgICAgICAgICAgIGkgKz0gY29uc3VtZWRcblxuICAgICAgICAgICAgcmV0dXJuIHtAdG9rZW5zLCBpbmRleDogaX0gaWYgb3B0cy51bnRpbEJhbGFuY2VkIGFuZCBAZW5kcy5sZW5ndGggaXMgMFxuXG4gICAgICAgIEBjbG9zZUluZGVudGF0aW9uKClcbiAgICAgICAgQGVycm9yIFwibWlzc2luZyAje2VuZC50YWd9XCIsIGVuZC5vcmlnaW5bMl0gaWYgZW5kID0gQGVuZHMucG9wKClcbiAgICAgICAgXG4gICAgICAgIGlmIG9wdHMuZmVhdHVyZT8ucmV3cml0ZSA9PSBmYWxzZVxuICAgICAgICAgICAgbG9nICdza2lwcGluZyByZXdyaXRlIScsIG9wdHNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgKG5ldyBSZXdyaXRlcikucmV3cml0ZSBAdG9rZW5zLCBvcHRzXG4gICAgICAgIFxuICAgICAgICBAdG9rZW5zXG5cbiAgICAjIFByZXByb2Nlc3MgdGhlIGNvZGUgdG8gcmVtb3ZlIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHdoaXRlc3BhY2UsIGNhcnJpYWdlIHJldHVybnMsIGV0Yy4gXG4gICAgXG4gICAgY2xlYW46IChjb2RlKSAtPlxuICAgICAgICBjb2RlID0gY29kZS5zbGljZSgxKSBpZiBjb2RlLmNoYXJDb2RlQXQoMCkgaXMgQk9NXG4gICAgICAgIGNvZGUgPSBjb2RlLnJlcGxhY2UoL1xcci9nLCAnJykucmVwbGFjZSBUUkFJTElOR19TUEFDRVMsICcnXG4gICAgICAgIGlmIFdISVRFU1BBQ0UudGVzdCBjb2RlXG4gICAgICAgICAgICBjb2RlID0gXCJcXG4je2NvZGV9XCJcbiAgICAgICAgICAgIEBjaHVua0xpbmUtLVxuICAgICAgICBjb2RlXG5cbiAgICAjIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMDAwMCAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICAjIE1hdGNoZXMgaWRlbnRpZnlpbmcgbGl0ZXJhbHM6IHZhcmlhYmxlcywga2V5d29yZHMsIG1ldGhvZCBuYW1lcywgZXRjLlxuICAgICMgQ2hlY2sgdG8gZW5zdXJlIHRoYXQgSmF2YVNjcmlwdCByZXNlcnZlZCB3b3JkcyBhcmVuJ3QgYmVpbmcgdXNlZCBhc1xuICAgICMgaWRlbnRpZmllcnMuIEJlY2F1c2UgS29mZmVlIHJlc2VydmVzIGEgaGFuZGZ1bCBvZiBrZXl3b3JkcyB0aGF0IGFyZVxuICAgICMgYWxsb3dlZCBpbiBKYXZhU2NyaXB0LCB3ZSdyZSBjYXJlZnVsIG5vdCB0byB0YWcgdGhlbSBhcyBrZXl3b3JkcyB3aGVuXG4gICAgIyByZWZlcmVuY2VkIGFzIHByb3BlcnR5IG5hbWVzIGhlcmUsIHNvIHlvdSBjYW4gc3RpbGwgZG8gYGpRdWVyeS5pcygpYCBldmVuXG4gICAgIyB0aG91Z2ggYGlzYCBtZWFucyBgPT09YCBvdGhlcndpc2UuXG4gICAgXG4gICAgaWRlbnRpZmllclRva2VuOiAtPlxuICAgICAgICByZXR1cm4gMCB1bmxlc3MgbWF0Y2ggPSBJREVOVElGSUVSLmV4ZWMgQGNodW5rXG4gICAgICAgIFtpbnB1dCwgaWQsIGNvbG9uXSA9IG1hdGNoXG5cbiAgICAgICAgIyBQcmVzZXJ2ZSBsZW5ndGggb2YgaWQgZm9yIGxvY2F0aW9uIGRhdGFcbiAgICAgICAgaWRMZW5ndGggPSBpZC5sZW5ndGhcbiAgICAgICAgcG9wcGVkVG9rZW4gPSB1bmRlZmluZWRcblxuICAgICAgICBpZiBpZCBpcyAnb3duJyBhbmQgQHRhZygpIGlzICdGT1InXG4gICAgICAgICAgICBAdG9rZW4gJ09XTicsIGlkXG4gICAgICAgICAgICByZXR1cm4gaWQubGVuZ3RoXG4gICAgICAgIGlmIGlkIGlzICdmcm9tJyBhbmQgQHRhZygpIGlzICdZSUVMRCdcbiAgICAgICAgICAgIEB0b2tlbiAnRlJPTScsIGlkXG4gICAgICAgICAgICByZXR1cm4gaWQubGVuZ3RoXG4gICAgICAgIGlmIGlkIGlzICdhcycgYW5kIEBzZWVuSW1wb3J0XG4gICAgICAgICAgICBpZiBAdmFsdWUoKSBpcyAnKidcbiAgICAgICAgICAgICAgICBAdG9rZW5zW0B0b2tlbnMubGVuZ3RoIC0gMV1bMF0gPSAnSU1QT1JUX0FMTCdcbiAgICAgICAgICAgIGVsc2UgaWYgQHZhbHVlKCkgaW4gQ09GRkVFX0tFWVdPUkRTXG4gICAgICAgICAgICAgICAgQHRva2Vuc1tAdG9rZW5zLmxlbmd0aCAtIDFdWzBdID0gJ0lERU5USUZJRVInXG4gICAgICAgICAgICBpZiBAdGFnKCkgaW4gWydERUZBVUxUJywgJ0lNUE9SVF9BTEwnLCAnSURFTlRJRklFUiddXG4gICAgICAgICAgICAgICAgQHRva2VuICdBUycsIGlkXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlkLmxlbmd0aFxuICAgICAgICBpZiBpZCBpcyAnYXMnIGFuZCBAc2VlbkV4cG9ydCBhbmQgQHRhZygpIGluIFsnSURFTlRJRklFUicsICdERUZBVUxUJ11cbiAgICAgICAgICAgIEB0b2tlbiAnQVMnLCBpZFxuICAgICAgICAgICAgcmV0dXJuIGlkLmxlbmd0aFxuICAgICAgICBpZiBpZCBpcyAnZGVmYXVsdCcgYW5kIEBzZWVuRXhwb3J0IGFuZCBAdGFnKCkgaW4gWydFWFBPUlQnLCAnQVMnXVxuICAgICAgICAgICAgQHRva2VuICdERUZBVUxUJywgaWRcbiAgICAgICAgICAgIHJldHVybiBpZC5sZW5ndGhcblxuICAgICAgICBbLi4uLCBwcmV2XSA9IEB0b2tlbnNcblxuICAgICAgICB0YWcgPVxuICAgICAgICAgICAgaWYgY29sb24gb3IgcHJldj8gYW5kXG4gICAgICAgICAgICAgICAgIChwcmV2WzBdIGluIFsnLicsICc/LicsICc6OicsICc/OjonXSBvclxuICAgICAgICAgICAgICAgICBub3QgcHJldi5zcGFjZWQgYW5kIHByZXZbMF0gaXMgJ0AnKVxuICAgICAgICAgICAgICAgICdQUk9QRVJUWSdcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAnSURFTlRJRklFUidcblxuICAgICAgICBpZiB0YWcgaXMgJ0lERU5USUZJRVInIGFuZCAoaWQgaW4gSlNfS0VZV09SRFMgb3IgaWQgaW4gQ09GRkVFX0tFWVdPUkRTKSBhbmRcbiAgICAgICAgICAgICBub3QgKEBleHBvcnRTcGVjaWZpZXJMaXN0IGFuZCBpZCBpbiBDT0ZGRUVfS0VZV09SRFMpXG4gICAgICAgICAgICB0YWcgPSBpZC50b1VwcGVyQ2FzZSgpXG4gICAgICAgICAgICBpZiB0YWcgaXMgJ1dIRU4nIGFuZCBAdGFnKCkgaW4gTElORV9CUkVBS1xuICAgICAgICAgICAgICAgIHRhZyA9ICdMRUFESU5HX1dIRU4nXG4gICAgICAgICAgICBlbHNlIGlmIHRhZyBpcyAnRk9SJ1xuICAgICAgICAgICAgICAgIEBzZWVuRm9yID0geWVzXG4gICAgICAgICAgICBlbHNlIGlmIHRhZyBpcyAnVU5MRVNTJ1xuICAgICAgICAgICAgICAgIHRhZyA9ICdJRidcbiAgICAgICAgICAgIGVsc2UgaWYgdGFnIGlzICdJTVBPUlQnXG4gICAgICAgICAgICAgICAgQHNlZW5JbXBvcnQgPSB5ZXNcbiAgICAgICAgICAgIGVsc2UgaWYgdGFnIGlzICdFWFBPUlQnXG4gICAgICAgICAgICAgICAgQHNlZW5FeHBvcnQgPSB5ZXNcbiAgICAgICAgICAgIGVsc2UgaWYgdGFnIGluIFVOQVJZXG4gICAgICAgICAgICAgICAgdGFnID0gJ1VOQVJZJ1xuICAgICAgICAgICAgZWxzZSBpZiB0YWcgaW4gUkVMQVRJT05cbiAgICAgICAgICAgICAgICBpZiB0YWcgIT0gJ0lOU1RBTkNFT0YnIGFuZCBAc2VlbkZvclxuICAgICAgICAgICAgICAgICAgICB0YWcgPSAnRk9SJyArIHRhZ1xuICAgICAgICAgICAgICAgICAgICBAc2VlbkZvciA9IG5vXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB0YWcgPSAnUkVMQVRJT04nXG4gICAgICAgICAgICAgICAgICAgIGlmIEB2YWx1ZSgpIGlzICchJ1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9wcGVkVG9rZW4gPSBAdG9rZW5zLnBvcCgpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9ICchJyArIGlkXG4gICAgICAgIGVsc2UgaWYgdGFnIGlzICdJREVOVElGSUVSJyBhbmQgQHNlZW5Gb3IgYW5kIGlkIGlzICdmcm9tJyBhbmRcbiAgICAgICAgICAgICBpc0ZvckZyb20ocHJldilcbiAgICAgICAgICAgIHRhZyA9ICdGT1JGUk9NJ1xuICAgICAgICAgICAgQHNlZW5Gb3IgPSBub1xuXG4gICAgICAgIGlmIHRhZyBpcyAnSURFTlRJRklFUicgYW5kIGlkIGluIFJFU0VSVkVEXG4gICAgICAgICAgICBAZXJyb3IgXCJyZXNlcnZlZCB3b3JkICcje2lkfSdcIiwgbGVuZ3RoOiBpZC5sZW5ndGhcblxuICAgICAgICB1bmxlc3MgdGFnIGlzICdQUk9QRVJUWSdcbiAgICAgICAgICAgIGlmIGlkIGluIENPRkZFRV9BTElBU0VTXG4gICAgICAgICAgICAgICAgYWxpYXMgPSBpZFxuICAgICAgICAgICAgICAgIGlkID0gQ09GRkVFX0FMSUFTX01BUFtpZF1cbiAgICAgICAgICAgIHRhZyA9IHN3aXRjaCBpZFxuICAgICAgICAgICAgICAgIHdoZW4gJyEnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiAnVU5BUlknXG4gICAgICAgICAgICAgICAgd2hlbiAnPT0nLCAnIT0nICAgICAgICAgICAgICAgICAgdGhlbiAnQ09NUEFSRSdcbiAgICAgICAgICAgICAgICB3aGVuICd0cnVlJywgJ2ZhbHNlJyAgICAgICAgIHRoZW4gJ0JPT0wnXG4gICAgICAgICAgICAgICAgd2hlbiAnYnJlYWsnLCAnY29udGludWUnLCBcXFxuICAgICAgICAgICAgICAgICAgICAgICAgICdkZWJ1Z2dlcicgICAgICAgICAgICAgICAgICB0aGVuICdTVEFURU1FTlQnXG4gICAgICAgICAgICAgICAgd2hlbiAnJiYnLCAnfHwnICAgICAgICAgICAgICAgICAgdGhlbiBpZFxuICAgICAgICAgICAgICAgIGVsc2UgICAgdGFnXG5cbiAgICAgICAgdGFnVG9rZW4gPSBAdG9rZW4gdGFnLCBpZCwgMCwgaWRMZW5ndGhcbiAgICAgICAgdGFnVG9rZW4ub3JpZ2luID0gW3RhZywgYWxpYXMsIHRhZ1Rva2VuWzJdXSBpZiBhbGlhc1xuICAgICAgICBpZiBwb3BwZWRUb2tlblxuICAgICAgICAgICAgW3RhZ1Rva2VuWzJdLmZpcnN0X2xpbmUsIHRhZ1Rva2VuWzJdLmZpcnN0X2NvbHVtbl0gPVxuICAgICAgICAgICAgICAgIFtwb3BwZWRUb2tlblsyXS5maXJzdF9saW5lLCBwb3BwZWRUb2tlblsyXS5maXJzdF9jb2x1bW5dXG4gICAgICAgIGlmIGNvbG9uXG4gICAgICAgICAgICBjb2xvbk9mZnNldCA9IGlucHV0Lmxhc3RJbmRleE9mICc6J1xuICAgICAgICAgICAgQHRva2VuICc6JywgJzonLCBjb2xvbk9mZnNldCwgY29sb24ubGVuZ3RoXG5cbiAgICAgICAgaW5wdXQubGVuZ3RoXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMCAgICAgMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuXG4gICAgIyBNYXRjaGVzIG51bWJlcnMsIGluY2x1ZGluZyBkZWNpbWFscywgaGV4LCBhbmQgZXhwb25lbnRpYWwgbm90YXRpb24uXG4gICAgIyBCZSBjYXJlZnVsIG5vdCB0byBpbnRlcmZlcmUgd2l0aCByYW5nZXMtaW4tcHJvZ3Jlc3MuXG4gICAgXG4gICAgbnVtYmVyVG9rZW46IC0+XG4gICAgICAgIHJldHVybiAwIHVubGVzcyBtYXRjaCA9IE5VTUJFUi5leGVjIEBjaHVua1xuXG4gICAgICAgIG51bWJlciA9IG1hdGNoWzBdXG4gICAgICAgIGxleGVkTGVuZ3RoID0gbnVtYmVyLmxlbmd0aFxuXG4gICAgICAgIHN3aXRjaFxuICAgICAgICAgICAgd2hlbiAvXjBbQk9YXS8udGVzdCBudW1iZXJcbiAgICAgICAgICAgICAgICBAZXJyb3IgXCJyYWRpeCBwcmVmaXggaW4gJyN7bnVtYmVyfScgbXVzdCBiZSBsb3dlcmNhc2VcIiwgb2Zmc2V0OiAxXG4gICAgICAgICAgICB3aGVuIC9eKD8hMHgpLipFLy50ZXN0IG51bWJlclxuICAgICAgICAgICAgICAgIEBlcnJvciBcImV4cG9uZW50aWFsIG5vdGF0aW9uIGluICcje251bWJlcn0nIG11c3QgYmUgaW5kaWNhdGVkIHdpdGggYSBsb3dlcmNhc2UgJ2UnXCIsXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldDogbnVtYmVyLmluZGV4T2YoJ0UnKVxuICAgICAgICAgICAgd2hlbiAvXjBcXGQqWzg5XS8udGVzdCBudW1iZXJcbiAgICAgICAgICAgICAgICBAZXJyb3IgXCJkZWNpbWFsIGxpdGVyYWwgJyN7bnVtYmVyfScgbXVzdCBub3QgYmUgcHJlZml4ZWQgd2l0aCAnMCdcIiwgbGVuZ3RoOiBsZXhlZExlbmd0aFxuICAgICAgICAgICAgd2hlbiAvXjBcXGQrLy50ZXN0IG51bWJlclxuICAgICAgICAgICAgICAgIEBlcnJvciBcIm9jdGFsIGxpdGVyYWwgJyN7bnVtYmVyfScgbXVzdCBiZSBwcmVmaXhlZCB3aXRoICcwbydcIiwgbGVuZ3RoOiBsZXhlZExlbmd0aFxuXG4gICAgICAgIGJhc2UgPSBzd2l0Y2ggbnVtYmVyLmNoYXJBdCAxXG4gICAgICAgICAgICB3aGVuICdiJyB0aGVuIDJcbiAgICAgICAgICAgIHdoZW4gJ28nIHRoZW4gOFxuICAgICAgICAgICAgd2hlbiAneCcgdGhlbiAxNlxuICAgICAgICAgICAgZWxzZSBudWxsXG4gICAgICAgIG51bWJlclZhbHVlID0gaWYgYmFzZT8gdGhlbiBwYXJzZUludChudW1iZXJbMi4uXSwgYmFzZSkgZWxzZSBwYXJzZUZsb2F0KG51bWJlcilcbiAgICAgICAgaWYgbnVtYmVyLmNoYXJBdCgxKSBpbiBbJ2InLCAnbyddXG4gICAgICAgICAgICBudW1iZXIgPSBcIjB4I3tudW1iZXJWYWx1ZS50b1N0cmluZyAxNn1cIlxuXG4gICAgICAgIHRhZyA9IGlmIG51bWJlclZhbHVlIGlzIEluZmluaXR5IHRoZW4gJ0lORklOSVRZJyBlbHNlICdOVU1CRVInXG4gICAgICAgIEB0b2tlbiB0YWcsIG51bWJlciwgMCwgbGV4ZWRMZW5ndGhcbiAgICAgICAgbGV4ZWRMZW5ndGhcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwICAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgIyBNYXRjaGVzIHN0cmluZ3MsIGluY2x1ZGluZyBtdWx0aS1saW5lIHN0cmluZ3MsIGFzIHdlbGwgYXMgaGVyZWRvY3MsIHdpdGggb3Igd2l0aG91dCBpbnRlcnBvbGF0aW9uLlxuICAgIFxuICAgIHN0cmluZ1Rva2VuOiAtPlxuICAgICAgICBbcXVvdGVdID0gU1RSSU5HX1NUQVJULmV4ZWMoQGNodW5rKSB8fCBbXVxuICAgICAgICByZXR1cm4gMCB1bmxlc3MgcXVvdGVcblxuICAgICAgICAjIElmIHRoZSBwcmVjZWRpbmcgdG9rZW4gaXMgYGZyb21gIGFuZCB0aGlzIGlzIGFuIGltcG9ydCBvciBleHBvcnQgc3RhdGVtZW50LCBwcm9wZXJseSB0YWcgdGhlIGBmcm9tYC5cbiAgICAgICAgXG4gICAgICAgIGlmIEB0b2tlbnMubGVuZ3RoIGFuZCBAdmFsdWUoKSBpcyAnZnJvbScgYW5kIChAc2VlbkltcG9ydCBvciBAc2VlbkV4cG9ydClcbiAgICAgICAgICAgIEB0b2tlbnNbQHRva2Vucy5sZW5ndGggLSAxXVswXSA9ICdGUk9NJ1xuXG4gICAgICAgIHJlZ2V4ID0gc3dpdGNoIHF1b3RlXG4gICAgICAgICAgICB3aGVuIFwiJ1wiICAgICB0aGVuIFNUUklOR19TSU5HTEVcbiAgICAgICAgICAgIHdoZW4gJ1wiJyAgICAgdGhlbiBTVFJJTkdfRE9VQkxFXG4gICAgICAgICAgICB3aGVuIFwiJycnXCIgdGhlbiBIRVJFRE9DX1NJTkdMRVxuICAgICAgICAgICAgd2hlbiAnXCJcIlwiJyB0aGVuIEhFUkVET0NfRE9VQkxFXG4gICAgICAgIGhlcmVkb2MgPSBxdW90ZS5sZW5ndGggaXMgM1xuXG4gICAgICAgIHt0b2tlbnMsIGluZGV4OiBlbmR9ID0gQG1hdGNoV2l0aEludGVycG9sYXRpb25zIHJlZ2V4LCBxdW90ZVxuICAgICAgICAkID0gdG9rZW5zLmxlbmd0aCAtIDFcblxuICAgICAgICBkZWxpbWl0ZXIgPSBxdW90ZS5jaGFyQXQoMClcbiAgICAgICAgaWYgaGVyZWRvY1xuICAgICAgICAgICAgIyBGaW5kIHRoZSBzbWFsbGVzdCBpbmRlbnRhdGlvbi4gSXQgd2lsbCBiZSByZW1vdmVkIGZyb20gYWxsIGxpbmVzIGxhdGVyLlxuICAgICAgICAgICAgaW5kZW50ID0gbnVsbFxuICAgICAgICAgICAgZG9jID0gKHRva2VuWzFdIGZvciB0b2tlbiwgaSBpbiB0b2tlbnMgd2hlbiB0b2tlblswXSBpcyAnTkVPU1RSSU5HJykuam9pbiAnI3t9J1xuICAgICAgICAgICAgd2hpbGUgbWF0Y2ggPSBIRVJFRE9DX0lOREVOVC5leGVjIGRvY1xuICAgICAgICAgICAgICAgIGF0dGVtcHQgPSBtYXRjaFsxXVxuICAgICAgICAgICAgICAgIGluZGVudCA9IGF0dGVtcHQgaWYgaW5kZW50IGlzIG51bGwgb3IgMCA8IGF0dGVtcHQubGVuZ3RoIDwgaW5kZW50Lmxlbmd0aFxuICAgICAgICAgICAgaW5kZW50UmVnZXggPSAvLy8gXFxuI3tpbmRlbnR9IC8vL2cgaWYgaW5kZW50XG4gICAgICAgICAgICBAbWVyZ2VJbnRlcnBvbGF0aW9uVG9rZW5zIHRva2Vucywge2RlbGltaXRlcn0sICh2YWx1ZSwgaSkgPT5cbiAgICAgICAgICAgICAgICB2YWx1ZSA9IEBmb3JtYXRTdHJpbmcgdmFsdWUsIGRlbGltaXRlcjogcXVvdGVcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UgaW5kZW50UmVnZXgsICdcXG4nIGlmIGluZGVudFJlZ2V4XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlIExFQURJTkdfQkxBTktfTElORSwgICAgJycgaWYgaSBpcyAwXG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlIFRSQUlMSU5HX0JMQU5LX0xJTkUsICcnIGlmIGkgaXMgJFxuICAgICAgICAgICAgICAgIHZhbHVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBtZXJnZUludGVycG9sYXRpb25Ub2tlbnMgdG9rZW5zLCB7ZGVsaW1pdGVyfSwgKHZhbHVlLCBpKSA9PlxuICAgICAgICAgICAgICAgIHZhbHVlID0gQGZvcm1hdFN0cmluZyB2YWx1ZSwgZGVsaW1pdGVyOiBxdW90ZVxuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZSBTSU1QTEVfU1RSSU5HX09NSVQsIChtYXRjaCwgb2Zmc2V0KSAtPlxuICAgICAgICAgICAgICAgICAgICBpZiAoaSBpcyAwIGFuZCBvZmZzZXQgaXMgMCkgb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAoaSBpcyAkIGFuZCBvZmZzZXQgKyBtYXRjaC5sZW5ndGggaXMgdmFsdWUubGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICAgICAgJydcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgJyAnXG4gICAgICAgICAgICAgICAgdmFsdWVcbiAgICAgICAgZW5kXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAgICAwMDAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgY29tbWVudFRva2VuOiAtPlxuICAgICAgICByZXR1cm4gMCB1bmxlc3MgbWF0Y2ggPSBAY2h1bmsubWF0Y2ggQ09NTUVOVFxuICAgICAgICBbY29tbWVudCwgaGVyZV0gPSBtYXRjaFxuICAgICAgICBpZiBoZXJlXG4gICAgICAgICAgICBpZiBtYXRjaCA9IEhFUkVDT01NRU5UX0lMTEVHQUwuZXhlYyBjb21tZW50XG4gICAgICAgICAgICAgICAgQGVycm9yIFwiYmxvY2sgY29tbWVudHMgY2Fubm90IGNvbnRhaW4gI3ttYXRjaFswXX1cIixcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiBtYXRjaC5pbmRleCwgbGVuZ3RoOiBtYXRjaFswXS5sZW5ndGhcbiAgICAgICAgICAgIGlmIGhlcmUuaW5kZXhPZignXFxuJykgPj0gMFxuICAgICAgICAgICAgICAgIGhlcmUgPSBoZXJlLnJlcGxhY2UgLy8vIFxcbiAje3JlcGVhdCAnICcsIEBpbmRlbnR9IC8vL2csICdcXG4nXG4gICAgICAgICAgICBAdG9rZW4gJ0hFUkVDT01NRU5UJywgaGVyZSwgMCwgY29tbWVudC5sZW5ndGhcbiAgICAgICAgY29tbWVudC5sZW5ndGhcblxuICAgICMgICAgICAgMDAwICAgMDAwMDAwMCAgXG4gICAgIyAgICAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjICAgICAgIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICAjIE1hdGNoZXMgSmF2YVNjcmlwdCBpbnRlcnBvbGF0ZWQgZGlyZWN0bHkgaW50byB0aGUgc291cmNlIHZpYSBiYWNrdGlja3MuXG4gICAgXG4gICAganNUb2tlbjogLT5cbiAgICAgICAgcmV0dXJuIDAgdW5sZXNzIEBjaHVuay5jaGFyQXQoMCkgaXMgJ2AnIGFuZFxuICAgICAgICAgICAgKG1hdGNoID0gSEVSRV9KU1RPS0VOLmV4ZWMoQGNodW5rKSBvciBKU1RPS0VOLmV4ZWMoQGNodW5rKSlcbiAgICAgICAgIyBDb252ZXJ0IGVzY2FwZWQgYmFja3RpY2tzIHRvIGJhY2t0aWNrcywgYW5kIGVzY2FwZWQgYmFja3NsYXNoZXNcbiAgICAgICAgIyBqdXN0IGJlZm9yZSBlc2NhcGVkIGJhY2t0aWNrcyB0byBiYWNrc2xhc2hlc1xuICAgICAgICBzY3JpcHQgPSBtYXRjaFsxXS5yZXBsYWNlIC9cXFxcKyhgfCQpL2csIChzdHJpbmcpIC0+XG4gICAgICAgICAgICAjIGBzdHJpbmdgIGlzIGFsd2F5cyBhIHZhbHVlIGxpa2UgJ1xcYCcsICdcXFxcXFxgJywgJ1xcXFxcXFxcXFxgJywgZXRjLlxuICAgICAgICAgICAgIyBCeSByZWR1Y2luZyBpdCB0byBpdHMgbGF0dGVyIGhhbGYsIHdlIHR1cm4gJ1xcYCcgdG8gJ2AnLCAnXFxcXFxcYCcgdG8gJ1xcYCcsIGV0Yy5cbiAgICAgICAgICAgIHN0cmluZ1stTWF0aC5jZWlsKHN0cmluZy5sZW5ndGggLyAyKS4uXVxuICAgICAgICBAdG9rZW4gJ0pTJywgc2NyaXB0LCAwLCBtYXRjaFswXS5sZW5ndGhcbiAgICAgICAgbWF0Y2hbMF0ubGVuZ3RoXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAwMDAwICAwMDAwMDAwICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgICMgTWF0Y2hlcyByZWd1bGFyIGV4cHJlc3Npb24gbGl0ZXJhbHMsIGFzIHdlbGwgYXMgbXVsdGlsaW5lIGV4dGVuZGVkIG9uZXMuXG4gICAgIyBMZXhpbmcgcmVndWxhciBleHByZXNzaW9ucyBpcyBkaWZmaWN1bHQgdG8gZGlzdGluZ3Vpc2ggZnJvbSBkaXZpc2lvbiwgXG4gICAgIyBzbyB3ZSBib3Jyb3cgc29tZSBiYXNpYyBoZXVyaXN0aWNzIGZyb20gSmF2YVNjcmlwdCBhbmQgUnVieS5cbiAgICBcbiAgICByZWdleFRva2VuOiAtPlxuICAgICAgICBzd2l0Y2hcbiAgICAgICAgICAgIHdoZW4gbWF0Y2ggPSBSRUdFWF9JTExFR0FMLmV4ZWMgQGNodW5rXG4gICAgICAgICAgICAgICAgQGVycm9yIFwicmVndWxhciBleHByZXNzaW9ucyBjYW5ub3QgYmVnaW4gd2l0aCAje21hdGNoWzJdfVwiLFxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IG1hdGNoLmluZGV4ICsgbWF0Y2hbMV0ubGVuZ3RoXG4gICAgICAgICAgICB3aGVuIG1hdGNoID0gQG1hdGNoV2l0aEludGVycG9sYXRpb25zIEhFUkVHRVgsICcvLy8nXG4gICAgICAgICAgICAgICAge3Rva2VucywgaW5kZXh9ID0gbWF0Y2hcbiAgICAgICAgICAgIHdoZW4gbWF0Y2ggPSBSRUdFWC5leGVjIEBjaHVua1xuICAgICAgICAgICAgICAgIFtyZWdleCwgYm9keSwgY2xvc2VkXSA9IG1hdGNoXG4gICAgICAgICAgICAgICAgQHZhbGlkYXRlRXNjYXBlcyBib2R5LCBpc1JlZ2V4OiB5ZXMsIG9mZnNldEluQ2h1bms6IDFcbiAgICAgICAgICAgICAgICBib2R5ID0gQGZvcm1hdFJlZ2V4IGJvZHksIGRlbGltaXRlcjogJy8nXG4gICAgICAgICAgICAgICAgaW5kZXggPSByZWdleC5sZW5ndGhcbiAgICAgICAgICAgICAgICBbLi4uLCBwcmV2XSA9IEB0b2tlbnNcbiAgICAgICAgICAgICAgICBpZiBwcmV2XG4gICAgICAgICAgICAgICAgICAgIGlmIHByZXYuc3BhY2VkIGFuZCBwcmV2WzBdIGluIENBTExBQkxFXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMCBpZiBub3QgY2xvc2VkIG9yIFBPU1NJQkxZX0RJVklTSU9OLnRlc3QgcmVnZXhcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBwcmV2WzBdIGluIE5PVF9SRUdFWFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgICAgICAgICBAZXJyb3IgJ21pc3NpbmcgLyAodW5jbG9zZWQgcmVnZXgpJyB1bmxlc3MgY2xvc2VkXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIDBcblxuICAgICAgICBbZmxhZ3NdID0gUkVHRVhfRkxBR1MuZXhlYyBAY2h1bmtbaW5kZXguLl1cbiAgICAgICAgZW5kID0gaW5kZXggKyBmbGFncy5sZW5ndGhcbiAgICAgICAgb3JpZ2luID0gQG1ha2VUb2tlbiAnUkVHRVgnLCBudWxsLCAwLCBlbmRcbiAgICAgICAgc3dpdGNoXG4gICAgICAgICAgICB3aGVuIG5vdCBWQUxJRF9GTEFHUy50ZXN0IGZsYWdzXG4gICAgICAgICAgICAgICAgQGVycm9yIFwiaW52YWxpZCByZWd1bGFyIGV4cHJlc3Npb24gZmxhZ3MgI3tmbGFnc31cIiwgb2Zmc2V0OiBpbmRleCwgbGVuZ3RoOiBmbGFncy5sZW5ndGhcbiAgICAgICAgICAgIHdoZW4gcmVnZXggb3IgdG9rZW5zLmxlbmd0aCBpcyAxXG4gICAgICAgICAgICAgICAgYm9keSA/PSBAZm9ybWF0SGVyZWdleCB0b2tlbnNbMF1bMV1cbiAgICAgICAgICAgICAgICBAdG9rZW4gJ1JFR0VYJywgXCIje0BtYWtlRGVsaW1pdGVkTGl0ZXJhbCBib2R5LCBkZWxpbWl0ZXI6ICcvJ30je2ZsYWdzfVwiLCAwLCBlbmQsIG9yaWdpblxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEB0b2tlbiAnUkVHRVhfU1RBUlQnLCAnKCcsIDAsIDAsIG9yaWdpblxuICAgICAgICAgICAgICAgIEB0b2tlbiAnSURFTlRJRklFUicsICdSZWdFeHAnLCAwLCAwXG4gICAgICAgICAgICAgICAgQHRva2VuICdDQUxMX1NUQVJUJywgJygnLCAwLCAwXG4gICAgICAgICAgICAgICAgQG1lcmdlSW50ZXJwb2xhdGlvblRva2VucyB0b2tlbnMsIHtkZWxpbWl0ZXI6ICdcIicsIGRvdWJsZTogeWVzfSwgQGZvcm1hdEhlcmVnZXhcbiAgICAgICAgICAgICAgICBpZiBmbGFnc1xuICAgICAgICAgICAgICAgICAgICBAdG9rZW4gJywnLCAnLCcsIGluZGV4IC0gMSwgMFxuICAgICAgICAgICAgICAgICAgICBAdG9rZW4gJ1NUUklORycsICdcIicgKyBmbGFncyArICdcIicsIGluZGV4IC0gMSwgZmxhZ3MubGVuZ3RoXG4gICAgICAgICAgICAgICAgQHRva2VuICcpJywgJyknLCBlbmQgLSAxLCAwXG4gICAgICAgICAgICAgICAgQHRva2VuICdSRUdFWF9FTkQnLCAnKScsIGVuZCAtIDEsIDBcblxuICAgICAgICBlbmRcblxuICAgICMgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgXG4gICAgXG4gICAgIyBNYXRjaGVzIG5ld2xpbmVzLCBpbmRlbnRzLCBhbmQgb3V0ZGVudHMsIGFuZCBkZXRlcm1pbmVzIHdoaWNoIGlzIHdoaWNoLlxuICAgICMgSWYgd2UgY2FuIGRldGVjdCB0aGF0IHRoZSBjdXJyZW50IGxpbmUgaXMgY29udGludWVkIG9udG8gdGhlIG5leHQgbGluZSxcbiAgICAjIHRoZW4gdGhlIG5ld2xpbmUgaXMgc3VwcHJlc3NlZDpcbiAgICAjXG4gICAgIyAgICAgICAgICAgZWxlbWVudHNcbiAgICAjICAgICAgICAgICAgICAgLmVhY2goIC4uLiApXG4gICAgIyAgICAgICAgICAgICAgIC5tYXAoIC4uLiApXG4gICAgI1xuICAgICMgS2VlcHMgdHJhY2sgb2YgdGhlIGxldmVsIG9mIGluZGVudGF0aW9uLCBiZWNhdXNlIGEgc2luZ2xlIG91dGRlbnQgdG9rZW5cbiAgICAjIGNhbiBjbG9zZSBtdWx0aXBsZSBpbmRlbnRzLCBzbyB3ZSBuZWVkIHRvIGtub3cgaG93IGZhciBpbiB3ZSBoYXBwZW4gdG8gYmUuXG4gICAgXG4gICAgbGluZVRva2VuOiAtPlxuICAgICAgICByZXR1cm4gMCB1bmxlc3MgbWF0Y2ggPSBNVUxUSV9ERU5ULmV4ZWMgQGNodW5rXG4gICAgICAgIGluZGVudCA9IG1hdGNoWzBdXG5cbiAgICAgICAgQHNlZW5Gb3IgPSBub1xuICAgICAgICBAc2VlbkltcG9ydCA9IG5vIHVubGVzcyBAaW1wb3J0U3BlY2lmaWVyTGlzdFxuICAgICAgICBAc2VlbkV4cG9ydCA9IG5vIHVubGVzcyBAZXhwb3J0U3BlY2lmaWVyTGlzdFxuXG4gICAgICAgIHNpemUgPSBpbmRlbnQubGVuZ3RoIC0gMSAtIGluZGVudC5sYXN0SW5kZXhPZiAnXFxuJ1xuICAgICAgICBub05ld2xpbmVzID0gQHVuZmluaXNoZWQoKVxuXG4gICAgICAgIGlmIHNpemUgLSBAaW5kZWJ0IGlzIEBpbmRlbnRcbiAgICAgICAgICAgIGlmIG5vTmV3bGluZXMgdGhlbiBAc3VwcHJlc3NOZXdsaW5lcygpIGVsc2UgQG5ld2xpbmVUb2tlbiAwXG4gICAgICAgICAgICByZXR1cm4gaW5kZW50Lmxlbmd0aFxuXG4gICAgICAgIGlmIHNpemUgPiBAaW5kZW50XG4gICAgICAgICAgICBpZiBub05ld2xpbmVzXG4gICAgICAgICAgICAgICAgQGluZGVidCA9IHNpemUgLSBAaW5kZW50XG4gICAgICAgICAgICAgICAgQHN1cHByZXNzTmV3bGluZXMoKVxuICAgICAgICAgICAgICAgIHJldHVybiBpbmRlbnQubGVuZ3RoXG4gICAgICAgICAgICB1bmxlc3MgQHRva2Vucy5sZW5ndGhcbiAgICAgICAgICAgICAgICBAYmFzZUluZGVudCA9IEBpbmRlbnQgPSBzaXplXG4gICAgICAgICAgICAgICAgcmV0dXJuIGluZGVudC5sZW5ndGhcbiAgICAgICAgICAgIGRpZmYgPSBzaXplIC0gQGluZGVudCArIEBvdXRkZWJ0XG4gICAgICAgICAgICBAdG9rZW4gJ0lOREVOVCcsIGRpZmYsIGluZGVudC5sZW5ndGggLSBzaXplLCBzaXplXG4gICAgICAgICAgICBAaW5kZW50cy5wdXNoIGRpZmZcbiAgICAgICAgICAgIEBlbmRzLnB1c2gge3RhZzogJ09VVERFTlQnfVxuICAgICAgICAgICAgQG91dGRlYnQgPSBAaW5kZWJ0ID0gMFxuICAgICAgICAgICAgQGluZGVudCA9IHNpemVcbiAgICAgICAgZWxzZSBpZiBzaXplIDwgQGJhc2VJbmRlbnRcbiAgICAgICAgICAgIEBlcnJvciAnbWlzc2luZyBpbmRlbnRhdGlvbicsIG9mZnNldDogaW5kZW50Lmxlbmd0aFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAaW5kZWJ0ID0gMFxuICAgICAgICAgICAgQG91dGRlbnRUb2tlbiBAaW5kZW50IC0gc2l6ZSwgbm9OZXdsaW5lcywgaW5kZW50Lmxlbmd0aFxuICAgICAgICBpbmRlbnQubGVuZ3RoXG5cbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICAjIFJlY29yZCBhbiBvdXRkZW50IHRva2VuIG9yIG11bHRpcGxlIHRva2VucywgaWYgd2UgaGFwcGVuIHRvIGJlIG1vdmluZyBiYWNrXG4gICAgIyBpbndhcmRzIHBhc3Qgc2V2ZXJhbCByZWNvcmRlZCBpbmRlbnRzLiBTZXRzIG5ldyBAaW5kZW50IHZhbHVlLlxuICAgIFxuICAgIG91dGRlbnRUb2tlbjogKG1vdmVPdXQsIG5vTmV3bGluZXMsIG91dGRlbnRMZW5ndGgpIC0+XG4gICAgICAgIGRlY3JlYXNlZEluZGVudCA9IEBpbmRlbnQgLSBtb3ZlT3V0XG4gICAgICAgIHdoaWxlIG1vdmVPdXQgPiAwXG4gICAgICAgICAgICBsYXN0SW5kZW50ID0gQGluZGVudHNbQGluZGVudHMubGVuZ3RoIC0gMV1cbiAgICAgICAgICAgIGlmIG5vdCBsYXN0SW5kZW50XG4gICAgICAgICAgICAgICAgbW92ZU91dCA9IDBcbiAgICAgICAgICAgIGVsc2UgaWYgbGFzdEluZGVudCBpcyBAb3V0ZGVidFxuICAgICAgICAgICAgICAgIG1vdmVPdXQgLT0gQG91dGRlYnRcbiAgICAgICAgICAgICAgICBAb3V0ZGVidCA9IDBcbiAgICAgICAgICAgIGVsc2UgaWYgbGFzdEluZGVudCA8IEBvdXRkZWJ0XG4gICAgICAgICAgICAgICAgQG91dGRlYnQgLT0gbGFzdEluZGVudFxuICAgICAgICAgICAgICAgIG1vdmVPdXQgIC09IGxhc3RJbmRlbnRcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBkZW50ID0gQGluZGVudHMucG9wKCkgKyBAb3V0ZGVidFxuICAgICAgICAgICAgICAgIGlmIG91dGRlbnRMZW5ndGggYW5kIEBjaHVua1tvdXRkZW50TGVuZ3RoXSBpbiBJTkRFTlRBQkxFX0NMT1NFUlNcbiAgICAgICAgICAgICAgICAgICAgZGVjcmVhc2VkSW5kZW50IC09IGRlbnQgLSBtb3ZlT3V0XG4gICAgICAgICAgICAgICAgICAgIG1vdmVPdXQgPSBkZW50XG4gICAgICAgICAgICAgICAgQG91dGRlYnQgPSAwXG4gICAgICAgICAgICAgICAgIyBwYWlyIG1pZ2h0IGNhbGwgb3V0ZGVudFRva2VuLCBzbyBwcmVzZXJ2ZSBkZWNyZWFzZWRJbmRlbnRcbiAgICAgICAgICAgICAgICBAcGFpciAnT1VUREVOVCdcbiAgICAgICAgICAgICAgICBAdG9rZW4gJ09VVERFTlQnLCBtb3ZlT3V0LCAwLCBvdXRkZW50TGVuZ3RoXG4gICAgICAgICAgICAgICAgbW92ZU91dCAtPSBkZW50XG4gICAgICAgIEBvdXRkZWJ0IC09IG1vdmVPdXQgaWYgZGVudFxuICAgICAgICBAdG9rZW5zLnBvcCgpIHdoaWxlIEB2YWx1ZSgpIGlzICc7J1xuXG4gICAgICAgIEB0b2tlbiAnVEVSTUlOQVRPUicsICdcXG4nLCBvdXRkZW50TGVuZ3RoLCAwIHVubGVzcyBAdGFnKCkgaXMgJ1RFUk1JTkFUT1InIG9yIG5vTmV3bGluZXNcbiAgICAgICAgQGluZGVudCA9IGRlY3JlYXNlZEluZGVudFxuICAgICAgICB0aGlzXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwICAgICAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICAjIE1hdGNoZXMgYW5kIGNvbnN1bWVzIG5vbi1tZWFuaW5nZnVsIHdoaXRlc3BhY2UuIFRhZyB0aGUgcHJldmlvdXMgdG9rZW5cbiAgICAjIGFzIGJlaW5nIOKAnHNwYWNlZOKAnSwgYmVjYXVzZSB0aGVyZSBhcmUgc29tZSBjYXNlcyB3aGVyZSBpdCBtYWtlcyBhIGRpZmZlcmVuY2UuXG4gICAgXG4gICAgd2hpdGVzcGFjZVRva2VuOiAtPlxuICAgICAgICByZXR1cm4gMCB1bmxlc3MgKG1hdGNoID0gV0hJVEVTUEFDRS5leGVjIEBjaHVuaykgb3IgKG5saW5lID0gQGNodW5rLmNoYXJBdCgwKSBpcyAnXFxuJylcbiAgICAgICAgWy4uLiwgcHJldl0gPSBAdG9rZW5zXG4gICAgICAgIHByZXZbaWYgbWF0Y2ggdGhlbiAnc3BhY2VkJyBlbHNlICduZXdMaW5lJ10gPSB0cnVlIGlmIHByZXZcbiAgICAgICAgaWYgbWF0Y2ggdGhlbiBtYXRjaFswXS5sZW5ndGggZWxzZSAwXG5cbiAgICAjIEdlbmVyYXRlIGEgbmV3bGluZSB0b2tlbi4gQ29uc2VjdXRpdmUgbmV3bGluZXMgZ2V0IG1lcmdlZCB0b2dldGhlci5cbiAgICBcbiAgICBuZXdsaW5lVG9rZW46IChvZmZzZXQpIC0+XG4gICAgICAgIEB0b2tlbnMucG9wKCkgd2hpbGUgQHZhbHVlKCkgaXMgJzsnXG4gICAgICAgIEB0b2tlbiAnVEVSTUlOQVRPUicsICdcXG4nLCBvZmZzZXQsIDAgdW5sZXNzIEB0YWcoKSBpcyAnVEVSTUlOQVRPUidcbiAgICAgICAgdGhpc1xuXG4gICAgIyBVc2UgYSBgXFxgIGF0IGEgbGluZS1lbmRpbmcgdG8gc3VwcHJlc3MgdGhlIG5ld2xpbmUuXG4gICAgIyBUaGUgc2xhc2ggaXMgcmVtb3ZlZCBoZXJlIG9uY2UgaXRzIGpvYiBpcyBkb25lLlxuICAgIFxuICAgIHN1cHByZXNzTmV3bGluZXM6IC0+XG4gICAgICAgIEB0b2tlbnMucG9wKCkgaWYgQHZhbHVlKCkgaXMgJ1xcXFwnXG4gICAgICAgIHRoaXNcblxuICAgICMgMDAwICAgICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgXG4gICAgIyAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgICAgIFxuICAgICMgMDAwICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgXG4gICAgIyAwMDAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICBcbiAgICBcbiAgICAjIFdlIHRyZWF0IGFsbCBvdGhlciBzaW5nbGUgY2hhcmFjdGVycyBhcyBhIHRva2VuLiBFLmcuOiBgKCApICwgLiAhYFxuICAgICMgTXVsdGktY2hhcmFjdGVyIG9wZXJhdG9ycyBhcmUgYWxzbyBsaXRlcmFsIHRva2Vucywgc28gdGhhdCBKaXNvbiBjYW4gYXNzaWduXG4gICAgIyB0aGUgcHJvcGVyIG9yZGVyIG9mIG9wZXJhdGlvbnMuIFRoZXJlIGFyZSBzb21lIHN5bWJvbHMgdGhhdCB3ZSB0YWcgc3BlY2lhbGx5XG4gICAgIyBoZXJlLiBgO2AgYW5kIG5ld2xpbmVzIGFyZSBib3RoIHRyZWF0ZWQgYXMgYSBgVEVSTUlOQVRPUmAsIHdlIGRpc3Rpbmd1aXNoXG4gICAgIyBwYXJlbnRoZXNlcyB0aGF0IGluZGljYXRlIGEgbWV0aG9kIGNhbGwgZnJvbSByZWd1bGFyIHBhcmVudGhlc2VzLCBhbmQgc28gb24uXG4gICAgXG4gICAgbGl0ZXJhbFRva2VuOiAtPlxuICAgICAgICBpZiBtYXRjaCA9IE9QRVJBVE9SLmV4ZWMgQGNodW5rXG4gICAgICAgICAgICBbdmFsdWVdID0gbWF0Y2hcbiAgICAgICAgICAgIEB0YWdQYXJhbWV0ZXJzKCkgaWYgQ09ERS50ZXN0IHZhbHVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHZhbHVlID0gQGNodW5rLmNoYXJBdCAwXG4gICAgICAgIHRhZyAgPSB2YWx1ZVxuICAgICAgICBbLi4uLCBwcmV2XSA9IEB0b2tlbnNcblxuICAgICAgICBpZiBwcmV2IGFuZCB2YWx1ZSBpbiBbJz0nLCBDT01QT1VORF9BU1NJR04uLi5dXG4gICAgICAgICAgICBza2lwVG9rZW4gPSBmYWxzZVxuICAgICAgICAgICAgaWYgdmFsdWUgaXMgJz0nIGFuZCBwcmV2WzFdIGluIFsnfHwnLCAnJiYnXSBhbmQgbm90IHByZXYuc3BhY2VkXG4gICAgICAgICAgICAgICAgcHJldlswXSA9ICdDT01QT1VORF9BU1NJR04nXG4gICAgICAgICAgICAgICAgcHJldlsxXSArPSAnPSdcbiAgICAgICAgICAgICAgICBwcmV2ID0gQHRva2Vuc1tAdG9rZW5zLmxlbmd0aCAtIDJdXG4gICAgICAgICAgICAgICAgc2tpcFRva2VuID0gdHJ1ZVxuICAgICAgICAgICAgaWYgcHJldiBhbmQgcHJldlswXSAhPSAnUFJPUEVSVFknXG4gICAgICAgICAgICAgICAgb3JpZ2luID0gcHJldi5vcmlnaW4gPyBwcmV2XG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IGlzVW5hc3NpZ25hYmxlIHByZXZbMV0sIG9yaWdpblsxXVxuICAgICAgICAgICAgICAgIEBlcnJvciBtZXNzYWdlLCBvcmlnaW5bMl0gaWYgbWVzc2FnZVxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlLmxlbmd0aCBpZiBza2lwVG9rZW5cblxuICAgICAgICBpZiB2YWx1ZSBpcyAneycgYW5kIEBzZWVuSW1wb3J0XG4gICAgICAgICAgICBAaW1wb3J0U3BlY2lmaWVyTGlzdCA9IHllc1xuICAgICAgICBlbHNlIGlmIEBpbXBvcnRTcGVjaWZpZXJMaXN0IGFuZCB2YWx1ZSBpcyAnfSdcbiAgICAgICAgICAgIEBpbXBvcnRTcGVjaWZpZXJMaXN0ID0gbm9cbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpcyAneycgYW5kIHByZXY/WzBdIGlzICdFWFBPUlQnXG4gICAgICAgICAgICBAZXhwb3J0U3BlY2lmaWVyTGlzdCA9IHllc1xuICAgICAgICBlbHNlIGlmIEBleHBvcnRTcGVjaWZpZXJMaXN0IGFuZCB2YWx1ZSBpcyAnfSdcbiAgICAgICAgICAgIEBleHBvcnRTcGVjaWZpZXJMaXN0ID0gbm9cblxuICAgICAgICBpZiB2YWx1ZSBpcyAnOydcbiAgICAgICAgICAgIEBzZWVuRm9yID0gQHNlZW5JbXBvcnQgPSBAc2VlbkV4cG9ydCA9IG5vXG4gICAgICAgICAgICB0YWcgPSAnVEVSTUlOQVRPUidcbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpcyAnKicgYW5kIHByZXZbMF0gaXMgJ0VYUE9SVCdcbiAgICAgICAgICAgIHRhZyA9ICdFWFBPUlRfQUxMJ1xuICAgICAgICBlbHNlIGlmIHZhbHVlIGluIE1BVEggICAgICAgICAgICAgICAgICAgdGhlbiB0YWcgPSAnTUFUSCdcbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpbiBDT01QQVJFICAgICAgICAgICAgICAgIHRoZW4gdGFnID0gJ0NPTVBBUkUnXG4gICAgICAgIGVsc2UgaWYgdmFsdWUgaW4gQ09NUE9VTkRfQVNTSUdOICAgICAgICB0aGVuIHRhZyA9ICdDT01QT1VORF9BU1NJR04nXG4gICAgICAgIGVsc2UgaWYgdmFsdWUgaW4gVU5BUlkgICAgICAgICAgICAgICAgICB0aGVuIHRhZyA9ICdVTkFSWSdcbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpbiBVTkFSWV9NQVRIICAgICAgICAgICAgIHRoZW4gdGFnID0gJ1VOQVJZX01BVEgnXG4gICAgICAgIGVsc2UgaWYgdmFsdWUgaW4gU0hJRlQgICAgICAgICAgICAgICAgICB0aGVuIHRhZyA9ICdTSElGVCdcbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpcyAnPycgYW5kIHByZXY/LnNwYWNlZCAgIHRoZW4gdGFnID0gJ0JJTj8nXG4gICAgICAgIGVsc2UgaWYgcHJldiBhbmQgbm90IHByZXYuc3BhY2VkXG4gICAgICAgICAgICBpZiB2YWx1ZSBpcyAnKCcgYW5kIHByZXZbMF0gaW4gQ0FMTEFCTEVcbiAgICAgICAgICAgICAgICBwcmV2WzBdID0gJ0ZVTkNfRVhJU1QnIGlmIHByZXZbMF0gaXMgJz8nXG4gICAgICAgICAgICAgICAgdGFnID0gJ0NBTExfU1RBUlQnXG4gICAgICAgICAgICBlbHNlIGlmIHZhbHVlIGlzICdbJyBhbmQgcHJldlswXSBpbiBJTkRFWEFCTEVcbiAgICAgICAgICAgICAgICB0YWcgPSAnSU5ERVhfU1RBUlQnXG4gICAgICAgICAgICAgICAgc3dpdGNoIHByZXZbMF1cbiAgICAgICAgICAgICAgICAgICAgd2hlbiAnPycgICAgdGhlbiBwcmV2WzBdID0gJ0lOREVYX1NPQUsnXG4gICAgICAgIHRva2VuID0gQG1ha2VUb2tlbiB0YWcsIHZhbHVlXG4gICAgICAgIHN3aXRjaCB2YWx1ZVxuICAgICAgICAgICAgd2hlbiAnKCcsICd7JywgJ1snIHRoZW4gQGVuZHMucHVzaCB7dGFnOiBJTlZFUlNFU1t2YWx1ZV0sIG9yaWdpbjogdG9rZW59XG4gICAgICAgICAgICB3aGVuICcpJywgJ30nLCAnXScgdGhlbiBAcGFpciB2YWx1ZVxuICAgICAgICBAdG9rZW5zLnB1c2ggdG9rZW5cbiAgICAgICAgdmFsdWUubGVuZ3RoXG5cbiAgICAjIyNcbiAgICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICBcbiAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICBcbiAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICBcbiAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICAjIyNcbiAgICBcbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgICMgQSBzb3VyY2Ugb2YgYW1iaWd1aXR5IGluIG91ciBncmFtbWFyIHVzZWQgdG8gYmUgcGFyYW1ldGVyIGxpc3RzIGluIGZ1bmN0aW9uXG4gICAgIyBkZWZpbml0aW9ucyB2ZXJzdXMgYXJndW1lbnQgbGlzdHMgaW4gZnVuY3Rpb24gY2FsbHMuIFdhbGsgYmFja3dhcmRzLCB0YWdnaW5nXG4gICAgIyBwYXJhbWV0ZXJzIHNwZWNpYWxseSBpbiBvcmRlciB0byBtYWtlIHRoaW5ncyBlYXNpZXIgZm9yIHRoZSBwYXJzZXIuXG4gICAgICAgIFxuICAgIHRhZ1BhcmFtZXRlcnM6IC0+XG4gICAgICAgIHJldHVybiB0aGlzIGlmIEB0YWcoKSAhPSAnKSdcbiAgICAgICAgc3RhY2sgPSBbXVxuICAgICAgICB7dG9rZW5zfSA9IHRoaXNcbiAgICAgICAgaSA9IHRva2Vucy5sZW5ndGhcbiAgICAgICAgdG9rZW5zWy0taV1bMF0gPSAnUEFSQU1fRU5EJ1xuICAgICAgICB3aGlsZSB0b2sgPSB0b2tlbnNbLS1pXVxuICAgICAgICAgICAgc3dpdGNoIHRva1swXVxuICAgICAgICAgICAgICAgIHdoZW4gJyknXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2ggdG9rXG4gICAgICAgICAgICAgICAgd2hlbiAnKCcsICdDQUxMX1NUQVJUJ1xuICAgICAgICAgICAgICAgICAgICBpZiBzdGFjay5sZW5ndGggdGhlbiBzdGFjay5wb3AoKVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIHRva1swXSBpcyAnKCdcbiAgICAgICAgICAgICAgICAgICAgICAgIHRva1swXSA9ICdQQVJBTV9TVEFSVCdcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgcmV0dXJuIHRoaXNcbiAgICAgICAgdGhpc1xuXG4gICAgIyBDbG9zZSB1cCBhbGwgcmVtYWluaW5nIG9wZW4gYmxvY2tzIGF0IHRoZSBlbmQgb2YgdGhlIGZpbGUuXG4gICAgXG4gICAgY2xvc2VJbmRlbnRhdGlvbjogLT5cbiAgICAgICAgQG91dGRlbnRUb2tlbiBAaW5kZW50XG5cbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgIyBNYXRjaCB0aGUgY29udGVudHMgb2YgYSBkZWxpbWl0ZWQgdG9rZW4gYW5kIGV4cGFuZCB2YXJpYWJsZXMgYW5kIGV4cHJlc3Npb25zXG4gICAgIyBpbnNpZGUgaXQgdXNpbmcgUnVieS1saWtlIG5vdGF0aW9uIGZvciBzdWJzdGl0dXRpb24gb2YgYXJiaXRyYXJ5IGV4cHJlc3Npb25zLlxuICAgICNcbiAgICAjICAgIFwiSGVsbG8gI3tuYW1lLmNhcGl0YWxpemUoKX0uXCJcbiAgICAjXG4gICAgIyBJZiBpdCBlbmNvdW50ZXJzIGFuIGludGVycG9sYXRpb24sIHRoaXMgbWV0aG9kIHdpbGwgcmVjdXJzaXZlbHkgY3JlYXRlIGEgbmV3XG4gICAgIyBMZXhlciBhbmQgdG9rZW5pemUgdW50aWwgdGhlIGB7YCBvZiBgI3tgIGlzIGJhbGFuY2VkIHdpdGggYSBgfWAuXG4gICAgI1xuICAgICMgICAgLSBgcmVnZXhgIG1hdGNoZXMgdGhlIGNvbnRlbnRzIG9mIGEgdG9rZW4gKGJ1dCBub3QgYGRlbGltaXRlcmAsIGFuZCBub3RcbiAgICAjICAgICAgICBgI3tgIGlmIGludGVycG9sYXRpb25zIGFyZSBkZXNpcmVkKS5cbiAgICAjICAgIC0gYGRlbGltaXRlcmAgaXMgdGhlIGRlbGltaXRlciBvZiB0aGUgdG9rZW4uIEV4YW1wbGVzIGFyZSBgJ2AsIGBcImAsIGAnJydgLFxuICAgICMgICAgICAgIGBcIlwiXCJgIGFuZCBgLy8vYC5cbiAgICAjXG4gICAgIyBUaGlzIG1ldGhvZCBhbGxvd3MgdXMgdG8gaGF2ZSBzdHJpbmdzIHdpdGhpbiBpbnRlcnBvbGF0aW9ucyB3aXRoaW4gc3RyaW5ncywgYWQgaW5maW5pdHVtLlxuICAgIFxuICAgIG1hdGNoV2l0aEludGVycG9sYXRpb25zOiAocmVnZXgsIGRlbGltaXRlcikgLT5cbiAgICAgICAgXG4gICAgICAgIHRva2VucyA9IFtdXG4gICAgICAgIG9mZnNldEluQ2h1bmsgPSBkZWxpbWl0ZXIubGVuZ3RoXG4gICAgICAgIHJldHVybiBudWxsIHVubGVzcyBAY2h1bmtbLi4ub2Zmc2V0SW5DaHVua10gaXMgZGVsaW1pdGVyXG4gICAgICAgIHN0ciA9IEBjaHVua1tvZmZzZXRJbkNodW5rLi5dXG4gICAgICAgIGxvb3BcbiAgICAgICAgICAgIFtzdHJQYXJ0XSA9IHJlZ2V4LmV4ZWMgc3RyXG5cbiAgICAgICAgICAgIEB2YWxpZGF0ZUVzY2FwZXMgc3RyUGFydCwge2lzUmVnZXg6IGRlbGltaXRlci5jaGFyQXQoMCkgaXMgJy8nLCBvZmZzZXRJbkNodW5rfVxuXG4gICAgICAgICAgICAjIFB1c2ggYSBmYWtlICdORU9TVFJJTkcnIHRva2VuLCB3aGljaCB3aWxsIGdldCB0dXJuZWQgaW50byBhIHJlYWwgc3RyaW5nIGxhdGVyLlxuICAgICAgICAgICAgdG9rZW5zLnB1c2ggQG1ha2VUb2tlbiAnTkVPU1RSSU5HJywgc3RyUGFydCwgb2Zmc2V0SW5DaHVua1xuXG4gICAgICAgICAgICBzdHIgPSBzdHJbc3RyUGFydC5sZW5ndGguLl1cbiAgICAgICAgICAgIG9mZnNldEluQ2h1bmsgKz0gc3RyUGFydC5sZW5ndGhcblxuICAgICAgICAgICAgYnJlYWsgdW5sZXNzIHN0clsuLi4yXSBpcyAnI3snXG5cbiAgICAgICAgICAgICMgVGhlIGAxYHMgYXJlIHRvIHJlbW92ZSB0aGUgYCNgIGluIGAje2AuXG4gICAgICAgICAgICBbbGluZSwgY29sdW1uXSA9IEBnZXRMaW5lQW5kQ29sdW1uRnJvbUNodW5rIG9mZnNldEluQ2h1bmsgKyAxXG4gICAgICAgICAgICB7dG9rZW5zOiBuZXN0ZWQsIGluZGV4fSA9XG4gICAgICAgICAgICAgICAgbmV3IExleGVyKCkudG9rZW5pemUgc3RyWzEuLl0sIGxpbmU6IGxpbmUsIGNvbHVtbjogY29sdW1uLCB1bnRpbEJhbGFuY2VkOiBvblxuICAgICAgICAgICAgIyBTa2lwIHRoZSB0cmFpbGluZyBgfWAuXG4gICAgICAgICAgICBpbmRleCArPSAxXG5cbiAgICAgICAgICAgICMgVHVybiB0aGUgbGVhZGluZyBhbmQgdHJhaWxpbmcgYHtgIGFuZCBgfWAgaW50byBwYXJlbnRoZXNlcy4gVW5uZWNlc3NhcnlcbiAgICAgICAgICAgICMgcGFyZW50aGVzZXMgd2lsbCBiZSByZW1vdmVkIGxhdGVyLlxuICAgICAgICAgICAgW29wZW4sIC4uLiwgY2xvc2VdID0gbmVzdGVkXG4gICAgICAgICAgICBvcGVuWzBdICA9IG9wZW5bMV0gID0gJygnXG4gICAgICAgICAgICBjbG9zZVswXSA9IGNsb3NlWzFdID0gJyknXG4gICAgICAgICAgICBjbG9zZS5vcmlnaW4gPSBbJycsICdlbmQgb2YgaW50ZXJwb2xhdGlvbicsIGNsb3NlWzJdXVxuXG4gICAgICAgICAgICAjIFJlbW92ZSBsZWFkaW5nICdURVJNSU5BVE9SJyAoaWYgYW55KS5cbiAgICAgICAgICAgIG5lc3RlZC5zcGxpY2UgMSwgMSBpZiBuZXN0ZWRbMV0/WzBdIGlzICdURVJNSU5BVE9SJ1xuXG4gICAgICAgICAgICAjIFB1c2ggYSBmYWtlICdUT0tFTlMnIHRva2VuLCB3aGljaCB3aWxsIGdldCB0dXJuZWQgaW50byByZWFsIHRva2VucyBsYXRlci5cbiAgICAgICAgICAgIHRva2Vucy5wdXNoIFsnVE9LRU5TJywgbmVzdGVkXVxuXG4gICAgICAgICAgICBzdHIgPSBzdHJbaW5kZXguLl1cbiAgICAgICAgICAgIG9mZnNldEluQ2h1bmsgKz0gaW5kZXhcblxuICAgICAgICB1bmxlc3Mgc3RyWy4uLmRlbGltaXRlci5sZW5ndGhdIGlzIGRlbGltaXRlclxuICAgICAgICAgICAgQGVycm9yIFwibWlzc2luZyAje2RlbGltaXRlcn1cIiwgbGVuZ3RoOiBkZWxpbWl0ZXIubGVuZ3RoXG5cbiAgICAgICAgW2ZpcnN0VG9rZW4sIC4uLiwgbGFzdFRva2VuXSA9IHRva2Vuc1xuICAgICAgICBmaXJzdFRva2VuWzJdLmZpcnN0X2NvbHVtbiAtPSBkZWxpbWl0ZXIubGVuZ3RoXG4gICAgICAgIGlmIGxhc3RUb2tlblsxXS5zdWJzdHIoLTEpIGlzICdcXG4nXG4gICAgICAgICAgICBsYXN0VG9rZW5bMl0ubGFzdF9saW5lICs9IDFcbiAgICAgICAgICAgIGxhc3RUb2tlblsyXS5sYXN0X2NvbHVtbiA9IGRlbGltaXRlci5sZW5ndGggLSAxXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGxhc3RUb2tlblsyXS5sYXN0X2NvbHVtbiArPSBkZWxpbWl0ZXIubGVuZ3RoXG4gICAgICAgIGxhc3RUb2tlblsyXS5sYXN0X2NvbHVtbiAtPSAxIGlmIGxhc3RUb2tlblsxXS5sZW5ndGggaXMgMFxuXG4gICAgICAgIHt0b2tlbnMsIGluZGV4OiBvZmZzZXRJbkNodW5rICsgZGVsaW1pdGVyLmxlbmd0aH1cblxuICAgICMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgIyBNZXJnZSB0aGUgYXJyYXkgYHRva2Vuc2Agb2YgdGhlIGZha2UgdG9rZW4gdHlwZXMgJ1RPS0VOUycgYW5kICdORU9TVFJJTkcnICAoYXMgcmV0dXJuZWQgYnkgYG1hdGNoV2l0aEludGVycG9sYXRpb25zYCkgaW50byB0aGUgdG9rZW4gc3RyZWFtLiBcbiAgICAjIFRoZSB2YWx1ZSBvZiAnTkVPU1RSSU5HJ3MgYXJlIGNvbnZlcnRlZCB1c2luZyBgZm5gIGFuZCB0dXJuZWQgaW50byBzdHJpbmdzIHVzaW5nIGBvcHRpb25zYCBmaXJzdC5cbiAgICBcbiAgICBtZXJnZUludGVycG9sYXRpb25Ub2tlbnM6ICh0b2tlbnMsIG9wdGlvbnMsIGZuKSAtPlxuICAgICAgICBpZiB0b2tlbnMubGVuZ3RoID4gMVxuICAgICAgICAgICAgbHBhcmVuID0gQHRva2VuICdTVFJJTkdfU1RBUlQnLCAnKCcsIDAsIDBcblxuICAgICAgICBmaXJzdEluZGV4ID0gQHRva2Vucy5sZW5ndGhcbiAgICAgICAgZm9yIHRva2VuLCBpIGluIHRva2Vuc1xuICAgICAgICAgICAgW3RhZywgdmFsdWVdID0gdG9rZW5cbiAgICAgICAgICAgIHN3aXRjaCB0YWdcbiAgICAgICAgICAgICAgICB3aGVuICdUT0tFTlMnXG4gICAgICAgICAgICAgICAgICAgICMgT3B0aW1pemUgb3V0IGVtcHR5IGludGVycG9sYXRpb25zIChhbiBlbXB0eSBwYWlyIG9mIHBhcmVudGhlc2VzKS5cbiAgICAgICAgICAgICAgICAgICAgY29udGludWUgaWYgdmFsdWUubGVuZ3RoIGlzIDJcbiAgICAgICAgICAgICAgICAgICAgIyBQdXNoIGFsbCB0aGUgdG9rZW5zIGluIHRoZSBmYWtlICdUT0tFTlMnIHRva2VuLiBcbiAgICAgICAgICAgICAgICAgICAgIyBUaGVzZSBhbHJlYWR5IGhhdmUgc2FuZSBsb2NhdGlvbiBkYXRhLlxuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvblRva2VuID0gdmFsdWVbMF1cbiAgICAgICAgICAgICAgICAgICAgdG9rZW5zVG9QdXNoID0gdmFsdWVcbiAgICAgICAgICAgICAgICB3aGVuICdORU9TVFJJTkcnXG4gICAgICAgICAgICAgICAgICAgICMgQ29udmVydCAnTkVPU1RSSU5HJyBpbnRvICdTVFJJTkcnLlxuICAgICAgICAgICAgICAgICAgICBjb252ZXJ0ZWQgPSBmbi5jYWxsIHRoaXMsIHRva2VuWzFdLCBpXG4gICAgICAgICAgICAgICAgICAgICMgT3B0aW1pemUgb3V0IGVtcHR5IHN0cmluZ3MuIFdlIGVuc3VyZSB0aGF0IHRoZSB0b2tlbnMgc3RyZWFtIGFsd2F5c1xuICAgICAgICAgICAgICAgICAgICAjIHN0YXJ0cyB3aXRoIGEgc3RyaW5nIHRva2VuLCB0aG91Z2gsIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSByZXN1bHRcbiAgICAgICAgICAgICAgICAgICAgIyByZWFsbHkgaXMgYSBzdHJpbmcuXG4gICAgICAgICAgICAgICAgICAgIGlmIGNvbnZlcnRlZC5sZW5ndGggaXMgMFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgaSBpcyAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3RFbXB0eVN0cmluZ0luZGV4ID0gQHRva2Vucy5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgICAgICAjIEhvd2V2ZXIsIHRoZXJlIGlzIG9uZSBjYXNlIHdoZXJlIHdlIGNhbiBvcHRpbWl6ZSBhd2F5IGEgc3RhcnRpbmcgZW1wdHkgc3RyaW5nLlxuICAgICAgICAgICAgICAgICAgICBpZiBpIGlzIDIgYW5kIGZpcnN0RW1wdHlTdHJpbmdJbmRleD9cbiAgICAgICAgICAgICAgICAgICAgICAgIEB0b2tlbnMuc3BsaWNlIGZpcnN0RW1wdHlTdHJpbmdJbmRleCwgMiAjIFJlbW92ZSBlbXB0eSBzdHJpbmcgYW5kIHRoZSBwbHVzLlxuICAgICAgICAgICAgICAgICAgICB0b2tlblswXSA9ICdTVFJJTkcnXG4gICAgICAgICAgICAgICAgICAgIHRva2VuWzFdID0gQG1ha2VEZWxpbWl0ZWRMaXRlcmFsIGNvbnZlcnRlZCwgb3B0aW9uc1xuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvblRva2VuID0gdG9rZW5cbiAgICAgICAgICAgICAgICAgICAgdG9rZW5zVG9QdXNoID0gW3Rva2VuXVxuICAgICAgICAgICAgaWYgQHRva2Vucy5sZW5ndGggPiBmaXJzdEluZGV4XG4gICAgICAgICAgICAgICAgIyBDcmVhdGUgYSAwLWxlbmd0aCBcIitcIiB0b2tlbi5cbiAgICAgICAgICAgICAgICBwbHVzVG9rZW4gPSBAdG9rZW4gJysnLCAnKydcbiAgICAgICAgICAgICAgICBwbHVzVG9rZW5bMl0gPVxuICAgICAgICAgICAgICAgICAgICBmaXJzdF9saW5lOiAgIGxvY2F0aW9uVG9rZW5bMl0uZmlyc3RfbGluZVxuICAgICAgICAgICAgICAgICAgICBmaXJzdF9jb2x1bW46IGxvY2F0aW9uVG9rZW5bMl0uZmlyc3RfY29sdW1uXG4gICAgICAgICAgICAgICAgICAgIGxhc3RfbGluZTogICAgbG9jYXRpb25Ub2tlblsyXS5maXJzdF9saW5lXG4gICAgICAgICAgICAgICAgICAgIGxhc3RfY29sdW1uOiAgbG9jYXRpb25Ub2tlblsyXS5maXJzdF9jb2x1bW5cbiAgICAgICAgICAgIEB0b2tlbnMucHVzaCB0b2tlbnNUb1B1c2guLi5cblxuICAgICAgICBpZiBscGFyZW5cbiAgICAgICAgICAgIFsuLi4sIGxhc3RUb2tlbl0gPSB0b2tlbnNcbiAgICAgICAgICAgIGxwYXJlbi5vcmlnaW4gPSBbJ1NUUklORycsIG51bGwsXG4gICAgICAgICAgICAgICAgZmlyc3RfbGluZTogICBscGFyZW5bMl0uZmlyc3RfbGluZVxuICAgICAgICAgICAgICAgIGZpcnN0X2NvbHVtbjogbHBhcmVuWzJdLmZpcnN0X2NvbHVtblxuICAgICAgICAgICAgICAgIGxhc3RfbGluZTogICAgbGFzdFRva2VuWzJdLmxhc3RfbGluZVxuICAgICAgICAgICAgICAgIGxhc3RfY29sdW1uOiAgbGFzdFRva2VuWzJdLmxhc3RfY29sdW1uXG4gICAgICAgICAgICBdXG4gICAgICAgICAgICBycGFyZW4gPSBAdG9rZW4gJ1NUUklOR19FTkQnLCAnKSdcbiAgICAgICAgICAgIHJwYXJlblsyXSA9XG4gICAgICAgICAgICAgICAgZmlyc3RfbGluZTogICBsYXN0VG9rZW5bMl0ubGFzdF9saW5lXG4gICAgICAgICAgICAgICAgZmlyc3RfY29sdW1uOiBsYXN0VG9rZW5bMl0ubGFzdF9jb2x1bW5cbiAgICAgICAgICAgICAgICBsYXN0X2xpbmU6ICAgIGxhc3RUb2tlblsyXS5sYXN0X2xpbmVcbiAgICAgICAgICAgICAgICBsYXN0X2NvbHVtbjogIGxhc3RUb2tlblsyXS5sYXN0X2NvbHVtblxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICAjIFBhaXJzIHVwIGEgY2xvc2luZyB0b2tlbiwgZW5zdXJpbmcgdGhhdCBhbGwgbGlzdGVkIHBhaXJzIG9mIHRva2VucyBhcmVcbiAgICAjIGNvcnJlY3RseSBiYWxhbmNlZCB0aHJvdWdob3V0IHRoZSBjb3Vyc2Ugb2YgdGhlIHRva2VuIHN0cmVhbS5cbiAgICBcbiAgICBwYWlyOiAodGFnKSAtPlxuICAgICAgICBbLi4uLCBwcmV2XSA9IEBlbmRzXG4gICAgICAgIHVubGVzcyB0YWcgaXMgd2FudGVkID0gcHJldj8udGFnXG4gICAgICAgICAgICBAZXJyb3IgXCJ1bm1hdGNoZWQgI3t0YWd9XCIgdW5sZXNzICdPVVRERU5UJyBpcyB3YW50ZWRcbiAgICAgICAgICAgICMgQXV0by1jbG9zZSBJTkRFTlQgdG8gc3VwcG9ydCBzeW50YXggbGlrZSB0aGlzOlxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyAgICAgZWwuY2xpY2soKGV2ZW50KSAtPlxuICAgICAgICAgICAgIyAgICAgICAgIGVsLmhpZGUoKSlcbiAgICAgICAgICAgIFsuLi4sIGxhc3RJbmRlbnRdID0gQGluZGVudHNcbiAgICAgICAgICAgIEBvdXRkZW50VG9rZW4gbGFzdEluZGVudCwgdHJ1ZVxuICAgICAgICAgICAgcmV0dXJuIEBwYWlyIHRhZ1xuICAgICAgICBAZW5kcy5wb3AoKVxuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuXG4gICAgIyBSZXR1cm5zIHRoZSBsaW5lIGFuZCBjb2x1bW4gbnVtYmVyIGZyb20gYW4gb2Zmc2V0IGludG8gdGhlIGN1cnJlbnQgY2h1bmsuXG4gICAgI1xuICAgICMgYG9mZnNldGAgaXMgYSBudW1iZXIgb2YgY2hhcmFjdGVycyBpbnRvIEBjaHVuay5cbiAgICBcbiAgICBnZXRMaW5lQW5kQ29sdW1uRnJvbUNodW5rOiAob2Zmc2V0KSAtPlxuICAgICAgICBpZiBvZmZzZXQgaXMgMFxuICAgICAgICAgICAgcmV0dXJuIFtAY2h1bmtMaW5lLCBAY2h1bmtDb2x1bW5dXG5cbiAgICAgICAgaWYgb2Zmc2V0ID49IEBjaHVuay5sZW5ndGhcbiAgICAgICAgICAgIHN0cmluZyA9IEBjaHVua1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzdHJpbmcgPSBAY2h1bmtbLi5vZmZzZXQtMV1cblxuICAgICAgICBsaW5lQ291bnQgPSBjb3VudCBzdHJpbmcsICdcXG4nXG5cbiAgICAgICAgY29sdW1uID0gQGNodW5rQ29sdW1uXG4gICAgICAgIGlmIGxpbmVDb3VudCA+IDBcbiAgICAgICAgICAgIFsuLi4sIGxhc3RMaW5lXSA9IHN0cmluZy5zcGxpdCAnXFxuJ1xuICAgICAgICAgICAgY29sdW1uID0gbGFzdExpbmUubGVuZ3RoXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGNvbHVtbiArPSBzdHJpbmcubGVuZ3RoXG5cbiAgICAgICAgW0BjaHVua0xpbmUgKyBsaW5lQ291bnQsIGNvbHVtbl1cblxuICAgICMgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwMCAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwMCAgXG4gICAgIyAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICAjIFNhbWUgYXMgXCJ0b2tlblwiLCBleGNlcHRpb24gdGhpcyBqdXN0IHJldHVybnMgdGhlIHRva2VuIHdpdGhvdXQgYWRkaW5nIGl0IHRvIHRoZSByZXN1bHRzLlxuICAgIFxuICAgIG1ha2VUb2tlbjogKHRhZywgdmFsdWUsIG9mZnNldEluQ2h1bmsgPSAwLCBsZW5ndGggPSB2YWx1ZS5sZW5ndGgpIC0+XG4gICAgICAgIGxvY2F0aW9uRGF0YSA9IHt9XG4gICAgICAgIFtsb2NhdGlvbkRhdGEuZmlyc3RfbGluZSwgbG9jYXRpb25EYXRhLmZpcnN0X2NvbHVtbl0gPVxuICAgICAgICAgICAgQGdldExpbmVBbmRDb2x1bW5Gcm9tQ2h1bmsgb2Zmc2V0SW5DaHVua1xuXG4gICAgICAgICMgVXNlIGxlbmd0aCAtIDEgZm9yIHRoZSBmaW5hbCBvZmZzZXQgLSB3ZSdyZSBzdXBwbHlpbmcgdGhlIGxhc3RfbGluZSBhbmQgdGhlIGxhc3RfY29sdW1uLFxuICAgICAgICAjIHNvIGlmIGxhc3RfY29sdW1uID09IGZpcnN0X2NvbHVtbiwgdGhlbiB3ZSdyZSBsb29raW5nIGF0IGEgY2hhcmFjdGVyIG9mIGxlbmd0aCAxLlxuICAgICAgICBsYXN0Q2hhcmFjdGVyID0gaWYgbGVuZ3RoID4gMCB0aGVuIChsZW5ndGggLSAxKSBlbHNlIDBcbiAgICAgICAgW2xvY2F0aW9uRGF0YS5sYXN0X2xpbmUsIGxvY2F0aW9uRGF0YS5sYXN0X2NvbHVtbl0gPVxuICAgICAgICAgICAgQGdldExpbmVBbmRDb2x1bW5Gcm9tQ2h1bmsgb2Zmc2V0SW5DaHVuayArIGxhc3RDaGFyYWN0ZXJcblxuICAgICAgICB0b2tlbiA9IFt0YWcsIHZhbHVlLCBsb2NhdGlvbkRhdGFdXG5cbiAgICAgICAgdG9rZW5cblxuICAgICMgQWRkIGEgdG9rZW4gdG8gdGhlIHJlc3VsdHMuXG4gICAgIyBgb2Zmc2V0YCBpcyB0aGUgb2Zmc2V0IGludG8gdGhlIGN1cnJlbnQgQGNodW5rIHdoZXJlIHRoZSB0b2tlbiBzdGFydHMuXG4gICAgIyBgbGVuZ3RoYCBpcyB0aGUgbGVuZ3RoIG9mIHRoZSB0b2tlbiBpbiB0aGUgQGNodW5rLCBhZnRlciB0aGUgb2Zmc2V0LiAgXG4gICAgIyBJZiBub3Qgc3BlY2lmaWVkLCB0aGUgbGVuZ3RoIG9mIGB2YWx1ZWAgd2lsbCBiZSB1c2VkLiBSZXR1cm5zIHRoZSBuZXcgdG9rZW4uXG4gICAgXG4gICAgdG9rZW46ICh0YWcsIHZhbHVlLCBvZmZzZXRJbkNodW5rLCBsZW5ndGgsIG9yaWdpbikgLT5cbiAgICAgICAgdG9rZW4gPSBAbWFrZVRva2VuIHRhZywgdmFsdWUsIG9mZnNldEluQ2h1bmssIGxlbmd0aFxuICAgICAgICB0b2tlbi5vcmlnaW4gPSBvcmlnaW4gaWYgb3JpZ2luXG4gICAgICAgIEB0b2tlbnMucHVzaCB0b2tlblxuICAgICAgICB0b2tlblxuXG4gICAgIyBQZWVrIGF0IHRoZSBsYXN0IHRhZyBpbiB0aGUgdG9rZW4gc3RyZWFtLlxuICAgIHRhZzogLT5cbiAgICAgICAgWy4uLiwgdG9rZW5dID0gQHRva2Vuc1xuICAgICAgICB0b2tlbj9bMF1cblxuICAgICMgUGVlayBhdCB0aGUgbGFzdCB2YWx1ZSBpbiB0aGUgdG9rZW4gc3RyZWFtLlxuICAgIHZhbHVlOiAtPlxuICAgICAgICBbLi4uLCB0b2tlbl0gPSBAdG9rZW5zXG4gICAgICAgIHRva2VuP1sxXVxuXG4gICAgIyBBcmUgd2UgaW4gdGhlIG1pZHN0IG9mIGFuIHVuZmluaXNoZWQgZXhwcmVzc2lvbj9cbiAgICB1bmZpbmlzaGVkOiAtPlxuICAgICAgICBMSU5FX0NPTlRJTlVFUi50ZXN0KEBjaHVuaykgb3JcbiAgICAgICAgQHRhZygpIGluIFVORklOSVNIRURcblxuICAgIGZvcm1hdFN0cmluZzogKHN0ciwgb3B0aW9ucykgLT5cbiAgICAgICAgQHJlcGxhY2VVbmljb2RlQ29kZVBvaW50RXNjYXBlcyBzdHIucmVwbGFjZShTVFJJTkdfT01JVCwgJyQxJyksIG9wdGlvbnNcblxuICAgIGZvcm1hdEhlcmVnZXg6IChzdHIpIC0+XG4gICAgICAgIEBmb3JtYXRSZWdleCBzdHIucmVwbGFjZShIRVJFR0VYX09NSVQsICckMSQyJyksIGRlbGltaXRlcjogJy8vLydcblxuICAgIGZvcm1hdFJlZ2V4OiAoc3RyLCBvcHRpb25zKSAtPlxuICAgICAgICBAcmVwbGFjZVVuaWNvZGVDb2RlUG9pbnRFc2NhcGVzIHN0ciwgb3B0aW9uc1xuXG4gICAgdW5pY29kZUNvZGVQb2ludFRvVW5pY29kZUVzY2FwZXM6IChjb2RlUG9pbnQpIC0+XG4gICAgICAgIHRvVW5pY29kZUVzY2FwZSA9ICh2YWwpIC0+XG4gICAgICAgICAgICBzdHIgPSB2YWwudG9TdHJpbmcgMTZcbiAgICAgICAgICAgIFwiXFxcXHUje3JlcGVhdCAnMCcsIDQgLSBzdHIubGVuZ3RofSN7c3RyfVwiXG4gICAgICAgIHJldHVybiB0b1VuaWNvZGVFc2NhcGUoY29kZVBvaW50KSBpZiBjb2RlUG9pbnQgPCAweDEwMDAwXG4gICAgICAgICMgc3Vycm9nYXRlIHBhaXJcbiAgICAgICAgaGlnaCA9IE1hdGguZmxvb3IoKGNvZGVQb2ludCAtIDB4MTAwMDApIC8gMHg0MDApICsgMHhEODAwXG4gICAgICAgIGxvdyA9IChjb2RlUG9pbnQgLSAweDEwMDAwKSAlIDB4NDAwICsgMHhEQzAwXG4gICAgICAgIFwiI3t0b1VuaWNvZGVFc2NhcGUoaGlnaCl9I3t0b1VuaWNvZGVFc2NhcGUobG93KX1cIlxuXG4gICAgIyBSZXBsYWNlIFxcdXsuLi59IHdpdGggXFx1eHh4eFtcXHV4eHh4XSBpbiBzdHJpbmdzIGFuZCByZWdleGVzXG4gICAgcmVwbGFjZVVuaWNvZGVDb2RlUG9pbnRFc2NhcGVzOiAoc3RyLCBvcHRpb25zKSAtPlxuICAgICAgICBzdHIucmVwbGFjZSBVTklDT0RFX0NPREVfUE9JTlRfRVNDQVBFLCAobWF0Y2gsIGVzY2FwZWRCYWNrc2xhc2gsIGNvZGVQb2ludEhleCwgb2Zmc2V0KSA9PlxuICAgICAgICAgICAgcmV0dXJuIGVzY2FwZWRCYWNrc2xhc2ggaWYgZXNjYXBlZEJhY2tzbGFzaFxuXG4gICAgICAgICAgICBjb2RlUG9pbnREZWNpbWFsID0gcGFyc2VJbnQgY29kZVBvaW50SGV4LCAxNlxuICAgICAgICAgICAgaWYgY29kZVBvaW50RGVjaW1hbCA+IDB4MTBmZmZmXG4gICAgICAgICAgICAgICAgQGVycm9yIFwidW5pY29kZSBjb2RlIHBvaW50IGVzY2FwZXMgZ3JlYXRlciB0aGFuIFxcXFx1ezEwZmZmZn0gYXJlIG5vdCBhbGxvd2VkXCIsXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldDogb2Zmc2V0ICsgb3B0aW9ucy5kZWxpbWl0ZXIubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIGxlbmd0aDogY29kZVBvaW50SGV4Lmxlbmd0aCArIDRcblxuICAgICAgICAgICAgQHVuaWNvZGVDb2RlUG9pbnRUb1VuaWNvZGVFc2NhcGVzIGNvZGVQb2ludERlY2ltYWxcblxuICAgICMgVmFsaWRhdGVzIGVzY2FwZXMgaW4gc3RyaW5ncyBhbmQgcmVnZXhlcy5cbiAgICB2YWxpZGF0ZUVzY2FwZXM6IChzdHIsIG9wdGlvbnMgPSB7fSkgLT5cbiAgICAgICAgaW52YWxpZEVzY2FwZVJlZ2V4ID1cbiAgICAgICAgICAgIGlmIG9wdGlvbnMuaXNSZWdleFxuICAgICAgICAgICAgICAgIFJFR0VYX0lOVkFMSURfRVNDQVBFXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgU1RSSU5HX0lOVkFMSURfRVNDQVBFXG4gICAgICAgIG1hdGNoID0gaW52YWxpZEVzY2FwZVJlZ2V4LmV4ZWMgc3RyXG4gICAgICAgIHJldHVybiB1bmxlc3MgbWF0Y2hcbiAgICAgICAgW1tdLCBiZWZvcmUsIG9jdGFsLCBoZXgsIHVuaWNvZGVDb2RlUG9pbnQsIHVuaWNvZGVdID0gbWF0Y2hcbiAgICAgICAgbWVzc2FnZSA9XG4gICAgICAgICAgICBpZiBvY3RhbFxuICAgICAgICAgICAgICAgIFwib2N0YWwgZXNjYXBlIHNlcXVlbmNlcyBhcmUgbm90IGFsbG93ZWRcIlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIFwiaW52YWxpZCBlc2NhcGUgc2VxdWVuY2VcIlxuICAgICAgICBpbnZhbGlkRXNjYXBlID0gXCJcXFxcI3tvY3RhbCBvciBoZXggb3IgdW5pY29kZUNvZGVQb2ludCBvciB1bmljb2RlfVwiXG4gICAgICAgIEBlcnJvciBcIiN7bWVzc2FnZX0gI3tpbnZhbGlkRXNjYXBlfVwiLFxuICAgICAgICAgICAgb2Zmc2V0OiAob3B0aW9ucy5vZmZzZXRJbkNodW5rID8gMCkgKyBtYXRjaC5pbmRleCArIGJlZm9yZS5sZW5ndGhcbiAgICAgICAgICAgIGxlbmd0aDogaW52YWxpZEVzY2FwZS5sZW5ndGhcblxuICAgICMgQ29uc3RydWN0cyBhIHN0cmluZyBvciByZWdleCBieSBlc2NhcGluZyBjZXJ0YWluIGNoYXJhY3RlcnMuXG4gICAgbWFrZURlbGltaXRlZExpdGVyYWw6IChib2R5LCBvcHRpb25zID0ge30pIC0+XG4gICAgICAgIGJvZHkgPSAnKD86KScgaWYgYm9keSBpcyAnJyBhbmQgb3B0aW9ucy5kZWxpbWl0ZXIgaXMgJy8nXG4gICAgICAgIHJlZ2V4ID0gLy8vXG4gICAgICAgICAgICAgICAgKFxcXFxcXFxcKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBlc2NhcGVkIGJhY2tzbGFzaFxuICAgICAgICAgICAgfCAoXFxcXDAoPz1bMS03XSkpICAgICAgICAgICAgICAgICAgICAgICAjIG51bCBjaGFyYWN0ZXIgbWlzdGFrZW4gYXMgb2N0YWwgZXNjYXBlXG4gICAgICAgICAgICB8IFxcXFw/KCN7b3B0aW9ucy5kZWxpbWl0ZXJ9KSAgICAgICAgICAgICMgKHBvc3NpYmx5IGVzY2FwZWQpIGRlbGltaXRlclxuICAgICAgICAgICAgfCBcXFxcPyg/OiAoXFxuKXwoXFxyKXwoXFx1MjAyOCl8KFxcdTIwMjkpICkgIyAocG9zc2libHkgZXNjYXBlZCkgbmV3bGluZXNcbiAgICAgICAgICAgIHwgKFxcXFwuKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBvdGhlciBlc2NhcGVzXG4gICAgICAgIC8vL2dcbiAgICAgICAgYm9keSA9IGJvZHkucmVwbGFjZSByZWdleCwgKG1hdGNoLCBiYWNrc2xhc2gsIG51bCwgZGVsaW1pdGVyLCBsZiwgY3IsIGxzLCBwcywgb3RoZXIpIC0+IHN3aXRjaFxuICAgICAgICAgICAgIyBJZ25vcmUgZXNjYXBlZCBiYWNrc2xhc2hlcy5cbiAgICAgICAgICAgIHdoZW4gYmFja3NsYXNoIHRoZW4gKGlmIG9wdGlvbnMuZG91YmxlIHRoZW4gYmFja3NsYXNoICsgYmFja3NsYXNoIGVsc2UgYmFja3NsYXNoKVxuICAgICAgICAgICAgd2hlbiBudWwgICAgICAgICAgICAgdGhlbiAnXFxcXHgwMCdcbiAgICAgICAgICAgIHdoZW4gZGVsaW1pdGVyIHRoZW4gXCJcXFxcI3tkZWxpbWl0ZXJ9XCJcbiAgICAgICAgICAgIHdoZW4gbGYgICAgICAgICAgICAgIHRoZW4gJ1xcXFxuJ1xuICAgICAgICAgICAgd2hlbiBjciAgICAgICAgICAgICAgdGhlbiAnXFxcXHInXG4gICAgICAgICAgICB3aGVuIGxzICAgICAgICAgICAgICB0aGVuICdcXFxcdTIwMjgnXG4gICAgICAgICAgICB3aGVuIHBzICAgICAgICAgICAgICB0aGVuICdcXFxcdTIwMjknXG4gICAgICAgICAgICB3aGVuIG90aGVyICAgICAgIHRoZW4gKGlmIG9wdGlvbnMuZG91YmxlIHRoZW4gXCJcXFxcI3tvdGhlcn1cIiBlbHNlIG90aGVyKVxuICAgICAgICBcIiN7b3B0aW9ucy5kZWxpbWl0ZXJ9I3tib2R5fSN7b3B0aW9ucy5kZWxpbWl0ZXJ9XCJcblxuICAgICMgVGhyb3dzIGFuIGVycm9yIGF0IGVpdGhlciBhIGdpdmVuIG9mZnNldCBmcm9tIHRoZSBjdXJyZW50IGNodW5rIG9yIGF0IHRoZSBsb2NhdGlvbiBvZiBhIHRva2VuIChgdG9rZW5bMl1gKS5cbiAgICBcbiAgICBlcnJvcjogKG1lc3NhZ2UsIG9wdGlvbnMgPSB7fSkgLT5cbiAgICAgICAgbG9jYXRpb24gPVxuICAgICAgICAgICAgaWYgJ2ZpcnN0X2xpbmUnIG9mIG9wdGlvbnNcbiAgICAgICAgICAgICAgICBvcHRpb25zXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgW2ZpcnN0X2xpbmUsIGZpcnN0X2NvbHVtbl0gPSBAZ2V0TGluZUFuZENvbHVtbkZyb21DaHVuayBvcHRpb25zLm9mZnNldCA/IDBcbiAgICAgICAgICAgICAgICB7Zmlyc3RfbGluZSwgZmlyc3RfY29sdW1uLCBsYXN0X2NvbHVtbjogZmlyc3RfY29sdW1uICsgKG9wdGlvbnMubGVuZ3RoID8gMSkgLSAxfVxuICAgICAgICB0aHJvd1N5bnRheEVycm9yIG1lc3NhZ2UsIGxvY2F0aW9uXG5cbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcblxuaXNVbmFzc2lnbmFibGUgPSAobmFtZSwgZGlzcGxheU5hbWUgPSBuYW1lKSAtPiBzd2l0Y2hcbiAgICB3aGVuIG5hbWUgaW4gW0pTX0tFWVdPUkRTLi4uLCBDT0ZGRUVfS0VZV09SRFMuLi5dXG4gICAgICAgIFwia2V5d29yZCAnI3tkaXNwbGF5TmFtZX0nIGNhbid0IGJlIGFzc2lnbmVkXCJcbiAgICB3aGVuIG5hbWUgaW4gU1RSSUNUX1BST1NDUklCRURcbiAgICAgICAgXCInI3tkaXNwbGF5TmFtZX0nIGNhbid0IGJlIGFzc2lnbmVkXCJcbiAgICB3aGVuIG5hbWUgaW4gUkVTRVJWRURcbiAgICAgICAgXCJyZXNlcnZlZCB3b3JkICcje2Rpc3BsYXlOYW1lfScgY2FuJ3QgYmUgYXNzaWduZWRcIlxuICAgIGVsc2VcbiAgICAgICAgZmFsc2VcblxuZXhwb3J0cy5pc1VuYXNzaWduYWJsZSA9IGlzVW5hc3NpZ25hYmxlXG5leHBvcnRzLkxleGVyID0gTGV4ZXJcblxuIyBgZnJvbWAgaXNu4oCZdCBhIGtleXdvcmQsIGJ1dCBpdCBiZWhhdmVzIGxpa2Ugb25lIGluIGBpbXBvcnRgIGFuZCBgZXhwb3J0YCBzdGF0ZW1lbnRzIChoYW5kbGVkIGFib3ZlKSBcbiMgYW5kIGluIHRoZSBkZWNsYXJhdGlvbiBsaW5lIG9mIGEgYGZvcmAgbG9vcC5cbiMgVHJ5IHRvIGRldGVjdCB3aGVuIGBmcm9tYCBpcyBhIHZhcmlhYmxlIGlkZW50aWZpZXIgYW5kIHdoZW4gaXQgaXMgdGhpcyDigJxzb21ldGltZXPigJ0ga2V5d29yZC5cblxuaXNGb3JGcm9tID0gKHByZXYpIC0+XG4gICAgaWYgcHJldlswXSBpcyAnSURFTlRJRklFUidcbiAgICAgICAgIyBgZm9yIGkgZnJvbSBmcm9tYCwgYGZvciBmcm9tIGZyb20gaXRlcmFibGVgXG4gICAgICAgIGlmIHByZXZbMV0gaXMgJ2Zyb20nXG4gICAgICAgICAgICBwcmV2WzFdWzBdID0gJ0lERU5USUZJRVInXG4gICAgICAgICAgICB5ZXNcbiAgICAgICAgIyBgZm9yIGkgZnJvbSBpdGVyYWJsZWBcbiAgICAgICAgeWVzXG4gICAgIyBgZm9yIGZyb23igKZgXG4gICAgZWxzZSBpZiBwcmV2WzBdIGlzICdGT1InXG4gICAgICAgIG5vXG4gICAgIyBgZm9yIHtmcm9tfeKApmAsIGBmb3IgW2Zyb21d4oCmYCwgYGZvciB7YSwgZnJvbX3igKZgLCBgZm9yIHthOiBmcm9tfeKApmBcbiAgICBlbHNlIGlmIHByZXZbMV0gaW4gWyd7JywgJ1snLCAnLCcsICc6J11cbiAgICAgICAgbm9cbiAgICBlbHNlXG4gICAgICAgIHllc1xuXG4jIyNcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgIFxuIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4jIyNcblxuIyBLZXl3b3JkcyB0aGF0IHdlIHNoYXJlIGluIGNvbW1vbiB3aXRoIEphdmFTY3JpcHQuXG5cbkpTX0tFWVdPUkRTID0gW1xuICAgICd0cnVlJywgJ2ZhbHNlJywgJ251bGwnLCAndGhpcydcbiAgICAnbmV3JywgJ2RlbGV0ZScsICd0eXBlb2YnLCAnaW4nLCAnaW5zdGFuY2VvZidcbiAgICAncmV0dXJuJywgJ3Rocm93JywgJ2JyZWFrJywgJ2NvbnRpbnVlJywgJ2RlYnVnZ2VyJywgJ3lpZWxkJ1xuICAgICdpZicsICdlbHNlJywgJ3N3aXRjaCcsICdmb3InLCAnd2hpbGUnLCAnZG8nLCAndHJ5JywgJ2NhdGNoJywgJ2ZpbmFsbHknXG4gICAgJ2NsYXNzJywgJ2V4dGVuZHMnLCAnc3VwZXInXG4gICAgJ2ltcG9ydCcsICdleHBvcnQnLCAnZGVmYXVsdCdcbl1cblxuQ09GRkVFX0tFWVdPUkRTID0gW1xuICAgICd1bmRlZmluZWQnLCAnSW5maW5pdHknLCAnTmFOJ1xuICAgICd0aGVuJywgJ3VubGVzcycsICd1bnRpbCcsICdsb29wJywgJ29mJywgJ2J5JywgJ3doZW4nXG5dXG5cbkNPRkZFRV9BTElBU19NQVAgPVxuICAgIGFuZCAgOiAnJiYnXG4gICAgb3IgICA6ICd8fCdcbiAgICBpcyAgIDogJz09J1xuICAgIGlzbnQgOiAnIT0nICMgdWdseSEgcmVtb3ZlIGluIGNhc2UgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkgd2l0aCBDUzEgaXMgYnJva2VuLiBcbiAgICBub3QgIDogJyEnXG4gICAgeWVzICA6ICd0cnVlJ1xuICAgIG5vICAgOiAnZmFsc2UnXG4gICAgb24gICA6ICd0cnVlJ1xuICAgIG9mZiAgOiAnZmFsc2UnXG5cbkNPRkZFRV9BTElBU0VTICA9IChrZXkgZm9yIGtleSBvZiBDT0ZGRUVfQUxJQVNfTUFQKVxuQ09GRkVFX0tFWVdPUkRTID0gQ09GRkVFX0tFWVdPUkRTLmNvbmNhdCBDT0ZGRUVfQUxJQVNFU1xuXG4jIFRoZSBsaXN0IG9mIGtleXdvcmRzIHRoYXQgYXJlIHJlc2VydmVkIGJ5IEphdmFTY3JpcHQsIGJ1dCBub3QgdXNlZCwgb3IgdXNlZCBpbnRlcm5hbGx5LlxuIyBXZSB0aHJvdyBhbiBlcnJvciB3aGVuIHRoZXNlIGFyZSBlbmNvdW50ZXJlZCwgdG8gYXZvaWQgaGF2aW5nIGEgSmF2YVNjcmlwdCBlcnJvciBhdCBydW50aW1lLlxuXG5SRVNFUlZFRCA9IFtcbiAgICAnY2FzZScsICdmdW5jdGlvbicsICd2YXInLCAndm9pZCcsICd3aXRoJywgJ2NvbnN0JywgJ2xldCcsICdlbnVtJ1xuICAgICduYXRpdmUnLCAnaW1wbGVtZW50cycsICdpbnRlcmZhY2UnLCAncGFja2FnZScsICdwcml2YXRlJ1xuICAgICdwcm90ZWN0ZWQnLCAncHVibGljJywgJ3N0YXRpYydcbl1cblxuU1RSSUNUX1BST1NDUklCRUQgPSBbJ2FyZ3VtZW50cycsICdldmFsJ11cblxuIyBUaGUgc3VwZXJzZXQgb2YgYm90aCBKYXZhU2NyaXB0IGtleXdvcmRzIGFuZCByZXNlcnZlZCB3b3Jkcywgbm9uZSBvZiB3aGljaCBtYXlcbiMgYmUgdXNlZCBhcyBpZGVudGlmaWVycyBvciBwcm9wZXJ0aWVzLlxuXG5leHBvcnRzLkpTX0ZPUkJJRERFTiA9IEpTX0tFWVdPUkRTLmNvbmNhdChSRVNFUlZFRCkuY29uY2F0KFNUUklDVF9QUk9TQ1JJQkVEKVxuXG5CT00gPSA2NTI3OSAjIFRoZSBjaGFyYWN0ZXIgY29kZSBvZiB0aGUgbmFzdHkgTWljcm9zb2Z0IG1hZG5lc3Mgb3RoZXJ3aXNlIGtub3duIGFzIHRoZSBCT00uXG5cbiMgVG9rZW4gbWF0Y2hpbmcgcmVnZXhlcy5cblxuSURFTlRJRklFUiA9IC8vLyBeXG4gICAgKD8hXFxkKVxuICAgICggKD86ICg/IVxccylbJFxcd1xceDdmLVxcdWZmZmZdICkrIClcbiAgICAoIFteXFxuXFxTXSogOiAoPyE6KSApPyAgICAjIElzIHRoaXMgYSBwcm9wZXJ0eSBuYW1lP1xuLy8vXG5cbk5VTUJFUiA9IC8vL1xuICAgIF4gMGJbMDFdKyAgICB8ICAgICAgICAgICAgICAjIGJpbmFyeVxuICAgIF4gMG9bMC03XSsgICB8ICAgICAgICAgICAgICAjIG9jdGFsXG4gICAgXiAweFtcXGRhLWZdKyB8ICAgICAgICAgICAgICAjIGhleFxuICAgIF4gXFxkKlxcLj9cXGQrICg/OmVbKy1dP1xcZCspPyAgIyBkZWNpbWFsXG4vLy9pXG5cbk9QRVJBVE9SID0gLy8vIF4gKFxuICAgID86IFstPV0+ICAgICAgICAgICAgICMgZnVuY3Rpb25cbiAgICAgfCBbLSsqLyU8PiZ8XiE/PV09ICAjIGNvbXBvdW5kIGFzc2lnbiAvIGNvbXBhcmVcbiAgICAgfCA+Pj49PyAgICAgICAgICAgICAjIHplcm8tZmlsbCByaWdodCBzaGlmdFxuICAgICB8IChbLSs6XSlcXDEgICAgICAgICAjIGRvdWJsZXNcbiAgICAgfCAoWyZ8PD4qLyVdKVxcMj0/ICAgIyBsb2dpYyAvIHNoaWZ0IC8gcG93ZXIgLyBmbG9vciBkaXZpc2lvbiAvIG1vZHVsb1xuICAgICB8IFxcPyhcXC58OjopICAgICAgICAgIyBzb2FrIGFjY2Vzc1xuICAgICB8IFxcLnsyLDN9ICAgICAgICAgICAjIHJhbmdlIG9yIHNwbGF0XG4pIC8vL1xuXG5XSElURVNQQUNFID0gL15bXlxcblxcU10rL1xuXG4jIENPTU1FTlQgICAgPSAvXiMjIyhbXiNdW1xcc1xcU10qPykoPzojIyNbXlxcblxcU10qfCMjIyQpfF4oPzpcXHMqIyg/ISMjW14jXSkuKikrLyAjIG1vdmVkIHRvIGVuZFxuXG5DT0RFICAgICAgID0gL15bLT1dPi9cblxuTVVMVElfREVOVCA9IC9eKD86XFxuW15cXG5cXFNdKikrL1xuXG5KU1RPS0VOICAgICAgPSAvLy9eIGAoPyFgYCkgKCg/OiBbXmBcXFxcXSB8IFxcXFxbXFxzXFxTXSAgICAgICAgICAgICAgICAgICApKikgYCAgIC8vL1xuSEVSRV9KU1RPS0VOID0gLy8vXiBgYGAgICAgICAgICAoKD86IFteYFxcXFxdIHwgXFxcXFtcXHNcXFNdIHwgYCg/IWBgKSApKikgYGBgIC8vL1xuXG4jIFN0cmluZy1tYXRjaGluZy1yZWdleGVzLlxuXG5TVFJJTkdfU1RBUlQgICA9IC9eKD86JycnfFwiXCJcInwnfFwiKS9cblxuU1RSSU5HX1NJTkdMRSAgPSAvLy8gXig/OiBbXlxcXFwnXSAgfCBcXFxcW1xcc1xcU10gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApKiAvLy9cblNUUklOR19ET1VCTEUgID0gLy8vIF4oPzogW15cXFxcXCIjXSB8IFxcXFxbXFxzXFxTXSB8ICAgICAgICAgICAgICAgICAgICAgXFwjKD8hXFx7KSApKiAvLy9cbkhFUkVET0NfU0lOR0xFID0gLy8vIF4oPzogW15cXFxcJ10gICAgfCBcXFxcW1xcc1xcU10gfCAnKD8hJycpICAgICAgICAgICAgICAgICAgICAgICAgKSogLy8vXG5IRVJFRE9DX0RPVUJMRSA9IC8vLyBeKD86IFteXFxcXFwiI10gfCBcXFxcW1xcc1xcU10gfCBcIig/IVwiXCIpIHwgXFwjKD8hXFx7KSApKiAvLy9cblxuU1RSSU5HX09NSVQgICAgPSAvLy9cbiAgICAgICAgKCg/OlxcXFxcXFxcKSspICAgICAgIyBjb25zdW1lIChhbmQgcHJlc2VydmUpIGFuIGV2ZW4gbnVtYmVyIG9mIGJhY2tzbGFzaGVzXG4gICAgfCBcXFxcW15cXFNcXG5dKlxcblxccyogICAgIyByZW1vdmUgZXNjYXBlZCBuZXdsaW5lc1xuLy8vZ1xuU0lNUExFX1NUUklOR19PTUlUID0gL1xccypcXG5cXHMqL2dcbkhFUkVET0NfSU5ERU5UICAgICAgID0gL1xcbisoW15cXG5cXFNdKikoPz1cXFMpL2dcblxuIyBSZWdleC1tYXRjaGluZy1yZWdleGVzLlxuUkVHRVggPSAvLy8gXlxuICAgIC8gKD8hLykgKChcbiAgICA/OiBbXiBbIC8gXFxuIFxcXFwgXSAgICAjIGV2ZXJ5IG90aGVyIHRoaW5nXG4gICAgIHwgXFxcXFteXFxuXSAgICAgICAgICAgIyBhbnl0aGluZyBidXQgbmV3bGluZXMgZXNjYXBlZFxuICAgICB8IFxcWyAgICAgICAgICAgICAgICAjIGNoYXJhY3RlciBjbGFzc1xuICAgICAgICAgICAgICg/OiBcXFxcW15cXG5dIHwgW14gXFxdIFxcbiBcXFxcIF0gKSpcbiAgICAgICAgIFxcXVxuICAgICkqKSAoLyk/XG4vLy9cblxuUkVHRVhfRkxBR1MgID0gL15cXHcqL1xuVkFMSURfRkxBR1MgID0gL14oPyEuKiguKS4qXFwxKVtpbWd1eV0qJC9cblxuSEVSRUdFWCAgICAgID0gLy8vIF4oPzogW15cXFxcLyNdIHwgXFxcXFtcXHNcXFNdIHwgLyg/IS8vKSB8IFxcIyg/IVxceykgKSogLy8vXG5cbkhFUkVHRVhfT01JVCA9IC8vL1xuICAgICAgICAoKD86XFxcXFxcXFwpKykgICAgICAgICAjIGNvbnN1bWUgKGFuZCBwcmVzZXJ2ZSkgYW4gZXZlbiBudW1iZXIgb2YgYmFja3NsYXNoZXNcbiAgICB8IFxcXFwoXFxzKSAgICAgICAgICAgICAgICAjIHByZXNlcnZlIGVzY2FwZWQgd2hpdGVzcGFjZVxuICAgIHwgXFxzKyg/OiMuKik/ICAgICAgICAgICAjIHJlbW92ZSB3aGl0ZXNwYWNlIGFuZCBjb21tZW50c1xuLy8vZ1xuXG5SRUdFWF9JTExFR0FMID0gLy8vIF4gKCAvIHwgL3szfVxccyopIChcXCopIC8vL1xuXG5QT1NTSUJMWV9ESVZJU0lPTiA9IC8vLyBeIC89P1xccyAvLy9cblxuIyBPdGhlciByZWdleGVzLlxuXG5IRVJFQ09NTUVOVF9JTExFR0FMID0gL1xcKlxcLy9cblxuTElORV9DT05USU5VRVIgICAgICAgICAgPSAvLy8gXiBcXHMqICg/OiAsIHwgXFw/P1xcLig/IVsuXFxkXSkgfCA6OiApIC8vL1xuXG5TVFJJTkdfSU5WQUxJRF9FU0NBUEUgPSAvLy9cbiAgICAoICg/Ol58W15cXFxcXSkgKD86XFxcXFxcXFwpKiApICAgICAgICAgICAgICAgICMgbWFrZSBzdXJlIHRoZSBlc2NhcGUgaXNu4oCZdCBlc2NhcGVkXG4gICAgXFxcXCAoXG4gICAgICAgICA/OiAoMFswLTddfFsxLTddKSAgICAgICAgICAgICAgICAgICAgICAgIyBvY3RhbCBlc2NhcGVcbiAgICAgICAgICAgIHwgKHgoPyFbXFxkYS1mQS1GXXsyfSkuezAsMn0pICMgaGV4IGVzY2FwZVxuICAgICAgICAgICAgfCAodVxceyg/IVtcXGRhLWZBLUZdezEsfVxcfSlbXn1dKlxcfT8pICMgdW5pY29kZSBjb2RlIHBvaW50IGVzY2FwZVxuICAgICAgICAgICAgfCAodSg/IVxce3xbXFxkYS1mQS1GXXs0fSkuezAsNH0pICMgdW5pY29kZSBlc2NhcGVcbiAgICApXG4vLy9cblJFR0VYX0lOVkFMSURfRVNDQVBFID0gLy8vXG4gICAgKCAoPzpefFteXFxcXF0pICg/OlxcXFxcXFxcKSogKSAgICAgICAgICAgICAgICAjIG1ha2Ugc3VyZSB0aGUgZXNjYXBlIGlzbuKAmXQgZXNjYXBlZFxuICAgIFxcXFwgKFxuICAgICAgICAgPzogKDBbMC03XSkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBvY3RhbCBlc2NhcGVcbiAgICAgICAgICAgIHwgKHgoPyFbXFxkYS1mQS1GXXsyfSkuezAsMn0pICMgaGV4IGVzY2FwZVxuICAgICAgICAgICAgfCAodVxceyg/IVtcXGRhLWZBLUZdezEsfVxcfSlbXn1dKlxcfT8pICMgdW5pY29kZSBjb2RlIHBvaW50IGVzY2FwZVxuICAgICAgICAgICAgfCAodSg/IVxce3xbXFxkYS1mQS1GXXs0fSkuezAsNH0pICMgdW5pY29kZSBlc2NhcGVcbiAgICApXG4vLy9cblxuVU5JQ09ERV9DT0RFX1BPSU5UX0VTQ0FQRSA9IC8vL1xuICAgICggXFxcXFxcXFwgKSAgICAgICAgICAgICAgICAjIG1ha2Ugc3VyZSB0aGUgZXNjYXBlIGlzbuKAmXQgZXNjYXBlZFxuICAgIHxcbiAgICBcXFxcdVxceyAoIFtcXGRhLWZBLUZdKyApIFxcfVxuLy8vZ1xuXG5MRUFESU5HX0JMQU5LX0xJTkUgID0gL15bXlxcblxcU10qXFxuL1xuVFJBSUxJTkdfQkxBTktfTElORSA9IC9cXG5bXlxcblxcU10qJC9cblxuVFJBSUxJTkdfU1BBQ0VTICAgICA9IC9cXHMrJC9cblxuIyBDb21wb3VuZCBhc3NpZ25tZW50IHRva2Vucy5cbkNPTVBPVU5EX0FTU0lHTiA9IFtcbiAgICAnLT0nLCAnKz0nLCAnLz0nLCAnKj0nLCAnJT0nLCAnfHw9JywgJyYmPScsICc/PScsICc8PD0nLCAnPj49JywgJz4+Pj0nXG4gICAgJyY9JywgJ149JywgJ3w9JywgJyoqPScsICcvLz0nLCAnJSU9J1xuXVxuXG5VTkFSWSA9IFsnTkVXJywgJ1RZUEVPRicsICdERUxFVEUnLCAnRE8nXVxuXG5VTkFSWV9NQVRIID0gWychJywgJ34nXVxuXG5TSElGVCA9IFsnPDwnLCAnPj4nLCAnPj4+J11cblxuQ09NUEFSRSA9IFsnPT0nLCAnIT0nLCAnPCcsICc+JywgJzw9JywgJz49J11cblxuTUFUSCA9IFsnKicsICcvJywgJyUnLCAnLy8nLCAnJSUnXVxuXG5SRUxBVElPTiA9IFsnSU4nLCAnT0YnLCAnSU5TVEFOQ0VPRiddICMgUmVsYXRpb25hbCB0b2tlbnMgdGhhdCBhcmUgbmVnYXRhYmxlIHdpdGggYG5vdGAgcHJlZml4LlxuXG5CT09MID0gWydUUlVFJywgJ0ZBTFNFJ11cblxuIyBUb2tlbnMgd2hpY2ggY291bGQgbGVnaXRpbWF0ZWx5IGJlIGludm9rZWQgb3IgaW5kZXhlZC4gQW4gb3BlbmluZ1xuIyBwYXJlbnRoZXNlcyBvciBicmFja2V0IGZvbGxvd2luZyB0aGVzZSB0b2tlbnMgd2lsbCBiZSByZWNvcmRlZCBhcyB0aGUgc3RhcnRcbiMgb2YgYSBmdW5jdGlvbiBpbnZvY2F0aW9uIG9yIGluZGV4aW5nIG9wZXJhdGlvbi5cblxuQ0FMTEFCTEUgID0gWydJREVOVElGSUVSJywgJ1BST1BFUlRZJywgJyknLCAnXScsICc/JywgJ0AnLCAnVEhJUycsICdTVVBFUiddXG5JTkRFWEFCTEUgPSBDQUxMQUJMRS5jb25jYXQgW1xuICAgICdOVU1CRVInLCAnSU5GSU5JVFknLCAnTkFOJywgJ1NUUklORycsICdTVFJJTkdfRU5EJywgJ1JFR0VYJywgJ1JFR0VYX0VORCdcbiAgICAnQk9PTCcsICdOVUxMJywgJ1VOREVGSU5FRCcsICd9JywgJzo6J1xuXVxuXG4jIFRva2VucyB3aGljaCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB3aWxsIG5ldmVyIGltbWVkaWF0ZWx5IGZvbGxvdyAoZXhjZXB0IHNwYWNlZFxuIyBDQUxMQUJMRXMgaW4gc29tZSBjYXNlcyksIGJ1dCB3aGljaCBhIGRpdmlzaW9uIG9wZXJhdG9yIGNhbi5cbiNcbiMgU2VlOiBodHRwOi8vd3d3LWFyY2hpdmUubW96aWxsYS5vcmcvanMvbGFuZ3VhZ2UvanMyMC0yMDAyLTA0L3JhdGlvbmFsZS9zeW50YXguaHRtbCNyZWd1bGFyLWV4cHJlc3Npb25zXG5cbk5PVF9SRUdFWCA9IElOREVYQUJMRS5jb25jYXQgWycrKycsICctLSddXG5cbiMgVG9rZW5zIHRoYXQsIHdoZW4gaW1tZWRpYXRlbHkgcHJlY2VkaW5nIGEgYFdIRU5gLCBpbmRpY2F0ZSB0aGF0IHRoZSBgV0hFTmBcbiMgb2NjdXJzIGF0IHRoZSBzdGFydCBvZiBhIGxpbmUuIFdlIGRpc2FtYmlndWF0ZSB0aGVzZSBmcm9tIHRyYWlsaW5nIHdoZW5zIHRvXG4jIGF2b2lkIGFuIGFtYmlndWl0eSBpbiB0aGUgZ3JhbW1hci5cblxuTElORV9CUkVBSyA9IFsnSU5ERU5UJywgJ09VVERFTlQnLCAnVEVSTUlOQVRPUiddXG5cbiMgQWRkaXRpb25hbCBpbmRlbnQgaW4gZnJvbnQgb2YgdGhlc2UgaXMgaWdub3JlZC5cblxuSU5ERU5UQUJMRV9DTE9TRVJTID0gWycpJywgJ30nLCAnXSddXG5cbiMgVG9rZW5zIHRoYXQsIHdoZW4gYXBwZWFyaW5nIGF0IHRoZSBlbmQgb2YgYSBsaW5lLCBzdXBwcmVzcyBhIGZvbGxvd2luZyBURVJNSU5BVE9SL0lOREVOVCB0b2tlblxuXG5VTkZJTklTSEVEID0gWydcXFxcJywgJy4nLCAnPy4nLCAnPzo6JywgJ1VOQVJZJywgJ01BVEgnLCAnVU5BUllfTUFUSCcsICcrJywgJy0nLFxuICAgICAgICAgICAgICAnKionLCAnU0hJRlQnLCAnUkVMQVRJT04nLCAnQ09NUEFSRScsICcmJywgJ14nLCAnfCcsICcmJicsICd8fCcsXG4gICAgICAgICAgICAgICdCSU4/JywgJ1RIUk9XJywgJ0VYVEVORFMnXVxuICAgICAgICAgICAgICBcbkNPTU1FTlQgICAgPSAvXiMjIyhbXiNdW1xcc1xcU10qPykoPzojIyNbXlxcblxcU10qfCMjIyQpfF4oPzpcXHMqIyg/ISMjW14jXSkuKikrLyAgICAgICAgICAgICAgXG4iXX0=
//# sourceURL=../src/lexer.coffee