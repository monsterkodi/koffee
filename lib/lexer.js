
/*
000      00000000  000   000  00000000  00000000   
000      000        000 000   000       000   000  
000      0000000     00000    0000000   0000000    
000      000        000 000   000       000   000  
0000000  00000000  000   000  00000000  000   000
 */
var BOM, BOOL, CALLABLE, CODE, COFFEE_ALIASES, COFFEE_ALIAS_MAP, COFFEE_KEYWORDS, COMMENT, COMPARE, COMPOUND_ASSIGN, HERECOMMENT_ILLEGAL, HEREDOC_DOUBLE, HEREDOC_INDENT, HEREDOC_SINGLE, HEREGEX, HEREGEX_OMIT, HERE_JSTOKEN, IDENTIFIER, INDENTABLE_CLOSERS, INDEXABLE, INVERSES, JSTOKEN, JS_KEYWORDS, LEADING_BLANK_LINE, LINE_BREAK, LINE_CONTINUER, Lexer, MATH, MULTI_DENT, NOT_REGEX, NUMBER, OPERATOR, POSSIBLY_DIVISION, REGEX, REGEX_FLAGS, REGEX_ILLEGAL, REGEX_INVALID_ESCAPE, RELATION, RESERVED, Rewriter, SHIFT, SIMPLE_STRING_OMIT, STRICT_PROSCRIBED, STRING_DOUBLE, STRING_INVALID_ESCAPE, STRING_OMIT, STRING_SINGLE, STRING_START, TRAILING_BLANK_LINE, TRAILING_SPACES, UNARY, UNARY_MATH, UNFINISHED, UNICODE_CODE_POINT_ESCAPE, VALID_FLAGS, WHITESPACE, compact, count, isForFrom, isUnassignable, key, locationDataToString, ref, ref1, repeat, starts, throwSyntaxError,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  slice = [].slice;

ref = require('./rewriter'), Rewriter = ref.Rewriter, INVERSES = ref.INVERSES;

ref1 = require('./helpers'), count = ref1.count, starts = ref1.starts, compact = ref1.compact, repeat = ref1.repeat, locationDataToString = ref1.locationDataToString, throwSyntaxError = ref1.throwSyntaxError;

Lexer = (function() {
  function Lexer() {}

  Lexer.prototype.tokenize = function(code, opts) {
    var consumed, end, i, ref2;
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
    if (opts.rewrite === false) {
      return this.tokens;
    }
    (new Rewriter).rewrite(this.tokens);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4ZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7OztBQUFBLElBQUEsODFCQUFBO0VBQUE7OztBQWlCQSxNQUF1QixPQUFBLENBQVEsWUFBUixDQUF2QixFQUFDLHVCQUFELEVBQVc7O0FBRVgsT0FBMkUsT0FBQSxDQUFRLFdBQVIsQ0FBM0UsRUFBQyxrQkFBRCxFQUFRLG9CQUFSLEVBQWdCLHNCQUFoQixFQUF5QixvQkFBekIsRUFBaUMsZ0RBQWpDLEVBQXVEOztBQUtqRDs7O2tCQWlCRixRQUFBLEdBQVUsU0FBQyxJQUFELEVBQU8sSUFBUDtBQUVOLFFBQUE7O01BRmEsT0FBTzs7SUFFcEIsSUFBQyxDQUFBLE1BQUQsR0FBYztJQUNkLElBQUMsQ0FBQSxVQUFELEdBQWM7SUFDZCxJQUFDLENBQUEsTUFBRCxHQUFjO0lBQ2QsSUFBQyxDQUFBLE9BQUQsR0FBYztJQUNkLElBQUMsQ0FBQSxPQUFELEdBQWM7SUFDZCxJQUFDLENBQUEsSUFBRCxHQUFjO0lBQ2QsSUFBQyxDQUFBLE1BQUQsR0FBYztJQUNkLElBQUMsQ0FBQSxPQUFELEdBQWM7SUFDZCxJQUFDLENBQUEsVUFBRCxHQUFjO0lBQ2QsSUFBQyxDQUFBLFVBQUQsR0FBYztJQUNkLElBQUMsQ0FBQSxtQkFBRCxHQUF1QjtJQUN2QixJQUFDLENBQUEsbUJBQUQsR0FBdUI7SUFFdkIsSUFBQyxDQUFBLFNBQUQsR0FDSSxJQUFJLENBQUMsSUFBTCxJQUFhO0lBQ2pCLElBQUMsQ0FBQSxXQUFELEdBQ0ksSUFBSSxDQUFDLE1BQUwsSUFBZTtJQUNuQixJQUFBLEdBQU8sSUFBQyxDQUFBLEtBQUQsQ0FBTyxJQUFQO0lBS1AsQ0FBQSxHQUFJO0FBQ0osV0FBTSxJQUFDLENBQUEsS0FBRCxHQUFTLElBQUssU0FBcEI7TUFDSSxRQUFBLEdBQ1MsSUFBQyxDQUFBLGVBQUQsQ0FBQSxDQUFBLElBQ0EsSUFBQyxDQUFBLFlBQUQsQ0FBQSxD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Q0FBQyxNQUFULENBQWdCLENBQ3hCLFFBRHdCLEVBQ2QsVUFEYyxFQUNGLEtBREUsRUFDSyxRQURMLEVBQ2UsWUFEZixFQUM2QixPQUQ3QixFQUNzQyxXQUR0QyxFQUV4QixNQUZ3QixFQUVoQixNQUZnQixFQUVSLFdBRlEsRUFFSyxHQUZMLEVBRVUsSUFGVixDQUFoQjs7QUFVWixTQUFBLEdBQVksU0FBUyxDQUFDLE1BQVYsQ0FBaUIsQ0FBQyxJQUFELEVBQU8sSUFBUCxDQUFqQjs7QUFNWixVQUFBLEdBQWEsQ0FBQyxRQUFELEVBQVcsU0FBWCxFQUFzQixZQUF0Qjs7QUFJYixrQkFBQSxHQUFxQixDQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsR0FBWDs7QUFJckIsVUFBQSxHQUFhLENBQUMsSUFBRCxFQUFPLEdBQVAsRUFBWSxJQUFaLEVBQWtCLEtBQWxCLEVBQXlCLE9BQXpCLEVBQWtDLE1BQWxDLEVBQTBDLFlBQTFDLEVBQXdELEdBQXhELEVBQTZELEdBQTdELEVBQ0MsSUFERCxFQUNPLE9BRFAsRUFDZ0IsVUFEaEIsRUFDNEIsU0FENUIsRUFDdUMsR0FEdkMsRUFDNEMsR0FENUMsRUFDaUQsR0FEakQsRUFDc0QsSUFEdEQsRUFDNEQsSUFENUQsRUFFQyxNQUZELEVBRVMsT0FGVCxFQUVrQixTQUZsQjs7QUFJYixPQUFBLEdBQWEiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuMDAwICAgICAgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4wMDAgICAgICAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbjAwMCAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4jIyNcblxuIyBUaGUgTGV4ZXIgdXNlcyBhIHNlcmllcyBvZiB0b2tlbi1tYXRjaGluZyByZWdleGVzIHRvIGF0dGVtcHQgbWF0Y2hlcyBhZ2FpbnN0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIHNvdXJjZSBjb2RlLiBcbiMgV2hlbiBhIG1hdGNoIGlzIGZvdW5kLCBhIHRva2VuIGlzIHByb2R1Y2VkLCB3ZSBjb25zdW1lIHRoZSBtYXRjaCwgYW5kIHN0YXJ0IGFnYWluLiBcbiMgVG9rZW5zIGFyZSBpbiB0aGUgZm9ybTpcbiNcbiMgICAgW3RhZywgdmFsdWUsIGxvY2F0aW9uRGF0YV1cbiNcbiMgd2hlcmUgbG9jYXRpb25EYXRhIGlzIHtmaXJzdF9saW5lLCBmaXJzdF9jb2x1bW4sIGxhc3RfbGluZSwgbGFzdF9jb2x1bW59LCBcbiMgd2hpY2ggaXMgYSBmb3JtYXQgdGhhdCBjYW4gYmUgZmVkIGRpcmVjdGx5IGludG8gSmlzb24gdmlhIHRoZSBgcGFyc2VyLmxleGVyYCBmdW5jdGlvbiBkZWZpbmVkIGluIGtvZmZlZS5jb2ZmZWUuXG5cbntSZXdyaXRlciwgSU5WRVJTRVN9ID0gcmVxdWlyZSAnLi9yZXdyaXRlcidcblxue2NvdW50LCBzdGFydHMsIGNvbXBhY3QsIHJlcGVhdCwgbG9jYXRpb25EYXRhVG9TdHJpbmcsIHRocm93U3ludGF4RXJyb3J9ID0gcmVxdWlyZSAnLi9oZWxwZXJzJ1xuXG4jIFRoZSBMZXhlciBjbGFzcyByZWFkcyBhIHN0cmVhbSBvZiBrb2ZmZWUgYW5kIGRpdnZpZXMgaXQgdXAgaW50byB0YWdnZWQgdG9rZW5zLiBcbiMgU29tZSBwb3RlbnRpYWwgYW1iaWd1aXR5IGluIHRoZSBncmFtbWFyIGhhcyBiZWVuIGF2b2lkZWQgYnkgcHVzaGluZyBzb21lIGV4dHJhIHNtYXJ0cyBpbnRvIHRoZSBMZXhlci5cblxuY2xhc3MgTGV4ZXJcblxuICAgICMgdG9rZW5pemUgaXMgdGhlIExleGVyJ3MgbWFpbiBtZXRob2QuIFNjYW4gYnkgYXR0ZW1wdGluZyB0byBtYXRjaCB0b2tlbnNcbiAgICAjIG9uZSBhdCBhIHRpbWUsIHVzaW5nIGEgcmVndWxhciBleHByZXNzaW9uIGFuY2hvcmVkIGF0IHRoZSBzdGFydCBvZiB0aGVcbiAgICAjIHJlbWFpbmluZyBjb2RlLCBvciBhIGN1c3RvbSByZWN1cnNpdmUgdG9rZW4tbWF0Y2hpbmcgbWV0aG9kIChmb3IgaW50ZXJwb2xhdGlvbnMpLiBcbiAgICAjIFdoZW4gdGhlIG5leHQgdG9rZW4gaGFzIGJlZW4gcmVjb3JkZWQsIHdlIG1vdmUgZm9yd2FyZCB3aXRoaW4gdGhlIGNvZGUgcGFzdCB0aGUgdG9rZW4sIGFuZCBiZWdpbiBhZ2Fpbi5cbiAgICAjXG4gICAgIyBFYWNoIHRva2VuaXppbmcgbWV0aG9kIGlzIHJlc3BvbnNpYmxlIGZvciByZXR1cm5pbmcgdGhlIG51bWJlciBvZiBjaGFyYWN0ZXJzIGl0IGhhcyBjb25zdW1lZC5cbiAgICAjXG4gICAgIyBCZWZvcmUgcmV0dXJuaW5nIHRoZSB0b2tlbiBzdHJlYW0sIHJ1biBpdCB0aHJvdWdoIHRoZSBSZXdyaXRlci5cbiAgICBcbiAgICAjIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgICAwMDAgICAwMDAgICAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAgMDAwICAgIDAwMDAwMDAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgXG4gICAgdG9rZW5pemU6IChjb2RlLCBvcHRzID0ge30pIC0+XG4gICAgICAgIFxuICAgICAgICBAaW5kZW50ICAgICA9IDAgICAgICAgICAgICAjIFRoZSBjdXJyZW50IGluZGVudGF0aW9uIGxldmVsLlxuICAgICAgICBAYmFzZUluZGVudCA9IDAgICAgICAgICAgICAjIFRoZSBvdmVyYWxsIG1pbmltdW0gaW5kZW50YXRpb24gbGV2ZWxcbiAgICAgICAgQGluZGVidCAgICAgPSAwICAgICAgICAgICAgIyBUaGUgb3Zlci1pbmRlbnRhdGlvbiBhdCB0aGUgY3VycmVudCBsZXZlbC5cbiAgICAgICAgQG91dGRlYnQgICAgPSAwICAgICAgICAgICAgIyBUaGUgdW5kZXItb3V0ZGVudGF0aW9uIGF0IHRoZSBjdXJyZW50IGxldmVsLlxuICAgICAgICBAaW5kZW50cyAgICA9IFtdICAgICAgICAgICAjIFRoZSBzdGFjayBvZiBhbGwgY3VycmVudCBpbmRlbnRhdGlvbiBsZXZlbHMuXG4gICAgICAgIEBlbmRzICAgICAgID0gW10gICAgICAgICAgICMgVGhlIHN0YWNrIGZvciBwYWlyaW5nIHVwIHRva2Vucy5cbiAgICAgICAgQHRva2VucyAgICAgPSBbXSAgICAgICAgICAgIyBTdHJlYW0gb2YgcGFyc2VkIHRva2VucyBpbiB0aGUgZm9ybSBgWydUWVBFJywgdmFsdWUsIGxvY2F0aW9uIGRhdGFdYC5cbiAgICAgICAgQHNlZW5Gb3IgICAgPSBubyAgICAgICAgICAgIyBVc2VkIHRvIHJlY29nbml6ZSBGT1JJTiwgRk9ST0YgYW5kIEZPUkZST00gdG9rZW5zLlxuICAgICAgICBAc2VlbkltcG9ydCA9IG5vICAgICAgICAgICAjIFVzZWQgdG8gcmVjb2duaXplIElNUE9SVCBGUk9NPyBBUz8gdG9rZW5zLlxuICAgICAgICBAc2VlbkV4cG9ydCA9IG5vICAgICAgICAgICAjIFVzZWQgdG8gcmVjb2duaXplIEVYUE9SVCBGUk9NPyBBUz8gdG9rZW5zLlxuICAgICAgICBAaW1wb3J0U3BlY2lmaWVyTGlzdCA9IG5vICAjIFVzZWQgdG8gaWRlbnRpZnkgd2hlbiBpbiBhbiBJTVBPUlQgey4uLn0gRlJPTT8gLi4uXG4gICAgICAgIEBleHBvcnRTcGVjaWZpZXJMaXN0ID0gbm8gICMgVXNlZCB0byBpZGVudGlmeSB3aGVuIGluIGFuIEVYUE9SVCB7Li4ufSBGUk9NPyAuLi5cblxuICAgICAgICBAY2h1bmtMaW5lID1cbiAgICAgICAgICAgIG9wdHMubGluZSBvciAwICAgICAgICAgIyBUaGUgc3RhcnQgbGluZSBmb3IgdGhlIGN1cnJlbnQgQGNodW5rLlxuICAgICAgICBAY2h1bmtDb2x1bW4gPVxuICAgICAgICAgICAgb3B0cy5jb2x1bW4gb3IgMCAgICAgICAjIFRoZSBzdGFydCBjb2x1bW4gb2YgdGhlIGN1cnJlbnQgQGNodW5rLlxuICAgICAgICBjb2RlID0gQGNsZWFuIGNvZGUgICAgICAgICAjIFRoZSBzdHJpcHBlZCwgY2xlYW5lZCBvcmlnaW5hbCBzb3VyY2UgY29kZS5cblxuICAgICAgICAjIEF0IGV2ZXJ5IHBvc2l0aW9uLCBydW4gdGhyb3VnaCB0aGlzIGxpc3Qgb2YgYXR0ZW1wdGVkIG1hdGNoZXMsIHNob3J0LWNpcmN1aXRpbmcgaWYgYW55IG9mIHRoZW0gc3VjY2VlZC4gXG4gICAgICAgICMgVGhlaXIgb3JkZXIgZGV0ZXJtaW5lcyBwcmVjZWRlbmNlOiBgQGxpdGVyYWxUb2tlbmAgaXMgdGhlIGZhbGxiYWNrIGNhdGNoLWFsbC5cbiAgICAgICAgXG4gICAgICAgIGkgPSAwXG4gICAgICAgIHdoaWxlIEBjaHVuayA9IGNvZGVbaS4uXVxuICAgICAgICAgICAgY29uc3VtZWQgPSBcXFxuICAgICAgICAgICAgICAgICAgICAgQGlkZW50aWZpZXJUb2tlbigpIG9yXG4gICAgICAgICAgICAgICAgICAgICBAY29tbWVudFRva2VuKCkgICAgb3JcbiAgICAgICAgICAgICAgICAgICAgIEB3aGl0ZXNwYWNlVG9rZW4oKSBvclxuICAgICAgICAgICAgICAgICAgICAgQGxpbmVUb2tlbigpICAgICAgIG9yXG4gICAgICAgICAgICAgICAgICAgICBAc3RyaW5nVG9rZW4oKSAgICAgb3JcbiAgICAgICAgICAgICAgICAgICAgIEBudW1iZXJUb2tlbigpICAgICBvclxuICAgICAgICAgICAgICAgICAgICAgQHJlZ2V4VG9rZW4oKSAgICAgIG9yXG4gICAgICAgICAgICAgICAgICAgICBAanNUb2tlbigpICAgICAgICAgb3JcbiAgICAgICAgICAgICAgICAgICAgIEBsaXRlcmFsVG9rZW4oKVxuXG4gICAgICAgICAgICAjIFVwZGF0ZSBwb3NpdGlvblxuICAgICAgICAgICAgW0BjaHVua0xpbmUsIEBjaHVua0NvbHVtbl0gPSBAZ2V0TGluZUFuZENvbHVtbkZyb21DaHVuayBjb25zdW1lZFxuXG4gICAgICAgICAgICBpICs9IGNvbnN1bWVkXG5cbiAgICAgICAgICAgIHJldHVybiB7QHRva2VucywgaW5kZXg6IGl9IGlmIG9wdHMudW50aWxCYWxhbmNlZCBhbmQgQGVuZHMubGVuZ3RoIGlzIDBcblxuICAgICAgICBAY2xvc2VJbmRlbnRhdGlvbigpXG4gICAgICAgIEBlcnJvciBcIm1pc3NpbmcgI3tlbmQudGFnfVwiLCBlbmQub3JpZ2luWzJdIGlmIGVuZCA9IEBlbmRzLnBvcCgpXG4gICAgICAgIGlmIG9wdHMucmV3cml0ZSBpcyBvZmZcbiAgICAgICAgICAgIHJldHVybiBAdG9rZW5zIFxuICAgICAgICAobmV3IFJld3JpdGVyKS5yZXdyaXRlIEB0b2tlbnNcbiAgICAgICAgXG4gICAgICAgIEB0b2tlbnNcblxuICAgICMgUHJlcHJvY2VzcyB0aGUgY29kZSB0byByZW1vdmUgbGVhZGluZyBhbmQgdHJhaWxpbmcgd2hpdGVzcGFjZSwgY2FycmlhZ2UgcmV0dXJucywgZXRjLiBcbiAgICBcbiAgICBjbGVhbjogKGNvZGUpIC0+XG4gICAgICAgIGNvZGUgPSBjb2RlLnNsaWNlKDEpIGlmIGNvZGUuY2hhckNvZGVBdCgwKSBpcyBCT01cbiAgICAgICAgY29kZSA9IGNvZGUucmVwbGFjZSgvXFxyL2csICcnKS5yZXBsYWNlIFRSQUlMSU5HX1NQQUNFUywgJydcbiAgICAgICAgaWYgV0hJVEVTUEFDRS50ZXN0IGNvZGVcbiAgICAgICAgICAgIGNvZGUgPSBcIlxcbiN7Y29kZX1cIlxuICAgICAgICAgICAgQGNodW5rTGluZS0tXG4gICAgICAgIGNvZGVcblxuICAgICMgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAwMDAwMCAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwMDAwICAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgICMgTWF0Y2hlcyBpZGVudGlmeWluZyBsaXRlcmFsczogdmFyaWFibGVzLCBrZXl3b3JkcywgbWV0aG9kIG5hbWVzLCBldGMuXG4gICAgIyBDaGVjayB0byBlbnN1cmUgdGhhdCBKYXZhU2NyaXB0IHJlc2VydmVkIHdvcmRzIGFyZW4ndCBiZWluZyB1c2VkIGFzXG4gICAgIyBpZGVudGlmaWVycy4gQmVjYXVzZSBLb2ZmZWUgcmVzZXJ2ZXMgYSBoYW5kZnVsIG9mIGtleXdvcmRzIHRoYXQgYXJlXG4gICAgIyBhbGxvd2VkIGluIEphdmFTY3JpcHQsIHdlJ3JlIGNhcmVmdWwgbm90IHRvIHRhZyB0aGVtIGFzIGtleXdvcmRzIHdoZW5cbiAgICAjIHJlZmVyZW5jZWQgYXMgcHJvcGVydHkgbmFtZXMgaGVyZSwgc28geW91IGNhbiBzdGlsbCBkbyBgalF1ZXJ5LmlzKClgIGV2ZW5cbiAgICAjIHRob3VnaCBgaXNgIG1lYW5zIGA9PT1gIG90aGVyd2lzZS5cbiAgICBcbiAgICBpZGVudGlmaWVyVG9rZW46IC0+XG4gICAgICAgIHJldHVybiAwIHVubGVzcyBtYXRjaCA9IElERU5USUZJRVIuZXhlYyBAY2h1bmtcbiAgICAgICAgW2lucHV0LCBpZCwgY29sb25dID0gbWF0Y2hcblxuICAgICAgICAjIFByZXNlcnZlIGxlbmd0aCBvZiBpZCBmb3IgbG9jYXRpb24gZGF0YVxuICAgICAgICBpZExlbmd0aCA9IGlkLmxlbmd0aFxuICAgICAgICBwb3BwZWRUb2tlbiA9IHVuZGVmaW5lZFxuXG4gICAgICAgIGlmIGlkIGlzICdvd24nIGFuZCBAdGFnKCkgaXMgJ0ZPUidcbiAgICAgICAgICAgIEB0b2tlbiAnT1dOJywgaWRcbiAgICAgICAgICAgIHJldHVybiBpZC5sZW5ndGhcbiAgICAgICAgaWYgaWQgaXMgJ2Zyb20nIGFuZCBAdGFnKCkgaXMgJ1lJRUxEJ1xuICAgICAgICAgICAgQHRva2VuICdGUk9NJywgaWRcbiAgICAgICAgICAgIHJldHVybiBpZC5sZW5ndGhcbiAgICAgICAgaWYgaWQgaXMgJ2FzJyBhbmQgQHNlZW5JbXBvcnRcbiAgICAgICAgICAgIGlmIEB2YWx1ZSgpIGlzICcqJ1xuICAgICAgICAgICAgICAgIEB0b2tlbnNbQHRva2Vucy5sZW5ndGggLSAxXVswXSA9ICdJTVBPUlRfQUxMJ1xuICAgICAgICAgICAgZWxzZSBpZiBAdmFsdWUoKSBpbiBDT0ZGRUVfS0VZV09SRFNcbiAgICAgICAgICAgICAgICBAdG9rZW5zW0B0b2tlbnMubGVuZ3RoIC0gMV1bMF0gPSAnSURFTlRJRklFUidcbiAgICAgICAgICAgIGlmIEB0YWcoKSBpbiBbJ0RFRkFVTFQnLCAnSU1QT1JUX0FMTCcsICdJREVOVElGSUVSJ11cbiAgICAgICAgICAgICAgICBAdG9rZW4gJ0FTJywgaWRcbiAgICAgICAgICAgICAgICByZXR1cm4gaWQubGVuZ3RoXG4gICAgICAgIGlmIGlkIGlzICdhcycgYW5kIEBzZWVuRXhwb3J0IGFuZCBAdGFnKCkgaW4gWydJREVOVElGSUVSJywgJ0RFRkFVTFQnXVxuICAgICAgICAgICAgQHRva2VuICdBUycsIGlkXG4gICAgICAgICAgICByZXR1cm4gaWQubGVuZ3RoXG4gICAgICAgIGlmIGlkIGlzICdkZWZhdWx0JyBhbmQgQHNlZW5FeHBvcnQgYW5kIEB0YWcoKSBpbiBbJ0VYUE9SVCcsICdBUyddXG4gICAgICAgICAgICBAdG9rZW4gJ0RFRkFVTFQnLCBpZFxuICAgICAgICAgICAgcmV0dXJuIGlkLmxlbmd0aFxuXG4gICAgICAgIFsuLi4sIHByZXZdID0gQHRva2Vuc1xuXG4gICAgICAgIHRhZyA9XG4gICAgICAgICAgICBpZiBjb2xvbiBvciBwcmV2PyBhbmRcbiAgICAgICAgICAgICAgICAgKHByZXZbMF0gaW4gWycuJywgJz8uJywgJzo6JywgJz86OiddIG9yXG4gICAgICAgICAgICAgICAgIG5vdCBwcmV2LnNwYWNlZCBhbmQgcHJldlswXSBpcyAnQCcpXG4gICAgICAgICAgICAgICAgJ1BST1BFUlRZJ1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICdJREVOVElGSUVSJ1xuXG4gICAgICAgIGlmIHRhZyBpcyAnSURFTlRJRklFUicgYW5kIChpZCBpbiBKU19LRVlXT1JEUyBvciBpZCBpbiBDT0ZGRUVfS0VZV09SRFMpIGFuZFxuICAgICAgICAgICAgIG5vdCAoQGV4cG9ydFNwZWNpZmllckxpc3QgYW5kIGlkIGluIENPRkZFRV9LRVlXT1JEUylcbiAgICAgICAgICAgIHRhZyA9IGlkLnRvVXBwZXJDYXNlKClcbiAgICAgICAgICAgIGlmIHRhZyBpcyAnV0hFTicgYW5kIEB0YWcoKSBpbiBMSU5FX0JSRUFLXG4gICAgICAgICAgICAgICAgdGFnID0gJ0xFQURJTkdfV0hFTidcbiAgICAgICAgICAgIGVsc2UgaWYgdGFnIGlzICdGT1InXG4gICAgICAgICAgICAgICAgQHNlZW5Gb3IgPSB5ZXNcbiAgICAgICAgICAgIGVsc2UgaWYgdGFnIGlzICdVTkxFU1MnXG4gICAgICAgICAgICAgICAgdGFnID0gJ0lGJ1xuICAgICAgICAgICAgZWxzZSBpZiB0YWcgaXMgJ0lNUE9SVCdcbiAgICAgICAgICAgICAgICBAc2VlbkltcG9ydCA9IHllc1xuICAgICAgICAgICAgZWxzZSBpZiB0YWcgaXMgJ0VYUE9SVCdcbiAgICAgICAgICAgICAgICBAc2VlbkV4cG9ydCA9IHllc1xuICAgICAgICAgICAgZWxzZSBpZiB0YWcgaW4gVU5BUllcbiAgICAgICAgICAgICAgICB0YWcgPSAnVU5BUlknXG4gICAgICAgICAgICBlbHNlIGlmIHRhZyBpbiBSRUxBVElPTlxuICAgICAgICAgICAgICAgIGlmIHRhZyAhPSAnSU5TVEFOQ0VPRicgYW5kIEBzZWVuRm9yXG4gICAgICAgICAgICAgICAgICAgIHRhZyA9ICdGT1InICsgdGFnXG4gICAgICAgICAgICAgICAgICAgIEBzZWVuRm9yID0gbm9cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHRhZyA9ICdSRUxBVElPTidcbiAgICAgICAgICAgICAgICAgICAgaWYgQHZhbHVlKCkgaXMgJyEnXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3BwZWRUb2tlbiA9IEB0b2tlbnMucG9wKClcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gJyEnICsgaWRcbiAgICAgICAgZWxzZSBpZiB0YWcgaXMgJ0lERU5USUZJRVInIGFuZCBAc2VlbkZvciBhbmQgaWQgaXMgJ2Zyb20nIGFuZFxuICAgICAgICAgICAgIGlzRm9yRnJvbShwcmV2KVxuICAgICAgICAgICAgdGFnID0gJ0ZPUkZST00nXG4gICAgICAgICAgICBAc2VlbkZvciA9IG5vXG5cbiAgICAgICAgaWYgdGFnIGlzICdJREVOVElGSUVSJyBhbmQgaWQgaW4gUkVTRVJWRURcbiAgICAgICAgICAgIEBlcnJvciBcInJlc2VydmVkIHdvcmQgJyN7aWR9J1wiLCBsZW5ndGg6IGlkLmxlbmd0aFxuXG4gICAgICAgIHVubGVzcyB0YWcgaXMgJ1BST1BFUlRZJ1xuICAgICAgICAgICAgaWYgaWQgaW4gQ09GRkVFX0FMSUFTRVNcbiAgICAgICAgICAgICAgICBhbGlhcyA9IGlkXG4gICAgICAgICAgICAgICAgaWQgPSBDT0ZGRUVfQUxJQVNfTUFQW2lkXVxuICAgICAgICAgICAgdGFnID0gc3dpdGNoIGlkXG4gICAgICAgICAgICAgICAgd2hlbiAnIScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuICdVTkFSWSdcbiAgICAgICAgICAgICAgICB3aGVuICc9PScsICchPScgICAgICAgICAgICAgICAgICB0aGVuICdDT01QQVJFJ1xuICAgICAgICAgICAgICAgIHdoZW4gJ3RydWUnLCAnZmFsc2UnICAgICAgICAgdGhlbiAnQk9PTCdcbiAgICAgICAgICAgICAgICB3aGVuICdicmVhaycsICdjb250aW51ZScsIFxcXG4gICAgICAgICAgICAgICAgICAgICAgICAgJ2RlYnVnZ2VyJyAgICAgICAgICAgICAgICAgIHRoZW4gJ1NUQVRFTUVOVCdcbiAgICAgICAgICAgICAgICB3aGVuICcmJicsICd8fCcgICAgICAgICAgICAgICAgICB0aGVuIGlkXG4gICAgICAgICAgICAgICAgZWxzZSAgICB0YWdcblxuICAgICAgICB0YWdUb2tlbiA9IEB0b2tlbiB0YWcsIGlkLCAwLCBpZExlbmd0aFxuICAgICAgICB0YWdUb2tlbi5vcmlnaW4gPSBbdGFnLCBhbGlhcywgdGFnVG9rZW5bMl1dIGlmIGFsaWFzXG4gICAgICAgIGlmIHBvcHBlZFRva2VuXG4gICAgICAgICAgICBbdGFnVG9rZW5bMl0uZmlyc3RfbGluZSwgdGFnVG9rZW5bMl0uZmlyc3RfY29sdW1uXSA9XG4gICAgICAgICAgICAgICAgW3BvcHBlZFRva2VuWzJdLmZpcnN0X2xpbmUsIHBvcHBlZFRva2VuWzJdLmZpcnN0X2NvbHVtbl1cbiAgICAgICAgaWYgY29sb25cbiAgICAgICAgICAgIGNvbG9uT2Zmc2V0ID0gaW5wdXQubGFzdEluZGV4T2YgJzonXG4gICAgICAgICAgICBAdG9rZW4gJzonLCAnOicsIGNvbG9uT2Zmc2V0LCBjb2xvbi5sZW5ndGhcblxuICAgICAgICBpbnB1dC5sZW5ndGhcblxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG5cbiAgICAjIE1hdGNoZXMgbnVtYmVycywgaW5jbHVkaW5nIGRlY2ltYWxzLCBoZXgsIGFuZCBleHBvbmVudGlhbCBub3RhdGlvbi5cbiAgICAjIEJlIGNhcmVmdWwgbm90IHRvIGludGVyZmVyZSB3aXRoIHJhbmdlcy1pbi1wcm9ncmVzcy5cbiAgICBcbiAgICBudW1iZXJUb2tlbjogLT5cbiAgICAgICAgcmV0dXJuIDAgdW5sZXNzIG1hdGNoID0gTlVNQkVSLmV4ZWMgQGNodW5rXG5cbiAgICAgICAgbnVtYmVyID0gbWF0Y2hbMF1cbiAgICAgICAgbGV4ZWRMZW5ndGggPSBudW1iZXIubGVuZ3RoXG5cbiAgICAgICAgc3dpdGNoXG4gICAgICAgICAgICB3aGVuIC9eMFtCT1hdLy50ZXN0IG51bWJlclxuICAgICAgICAgICAgICAgIEBlcnJvciBcInJhZGl4IHByZWZpeCBpbiAnI3tudW1iZXJ9JyBtdXN0IGJlIGxvd2VyY2FzZVwiLCBvZmZzZXQ6IDFcbiAgICAgICAgICAgIHdoZW4gL14oPyEweCkuKkUvLnRlc3QgbnVtYmVyXG4gICAgICAgICAgICAgICAgQGVycm9yIFwiZXhwb25lbnRpYWwgbm90YXRpb24gaW4gJyN7bnVtYmVyfScgbXVzdCBiZSBpbmRpY2F0ZWQgd2l0aCBhIGxvd2VyY2FzZSAnZSdcIixcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiBudW1iZXIuaW5kZXhPZignRScpXG4gICAgICAgICAgICB3aGVuIC9eMFxcZCpbODldLy50ZXN0IG51bWJlclxuICAgICAgICAgICAgICAgIEBlcnJvciBcImRlY2ltYWwgbGl0ZXJhbCAnI3tudW1iZXJ9JyBtdXN0IG5vdCBiZSBwcmVmaXhlZCB3aXRoICcwJ1wiLCBsZW5ndGg6IGxleGVkTGVuZ3RoXG4gICAgICAgICAgICB3aGVuIC9eMFxcZCsvLnRlc3QgbnVtYmVyXG4gICAgICAgICAgICAgICAgQGVycm9yIFwib2N0YWwgbGl0ZXJhbCAnI3tudW1iZXJ9JyBtdXN0IGJlIHByZWZpeGVkIHdpdGggJzBvJ1wiLCBsZW5ndGg6IGxleGVkTGVuZ3RoXG5cbiAgICAgICAgYmFzZSA9IHN3aXRjaCBudW1iZXIuY2hhckF0IDFcbiAgICAgICAgICAgIHdoZW4gJ2InIHRoZW4gMlxuICAgICAgICAgICAgd2hlbiAnbycgdGhlbiA4XG4gICAgICAgICAgICB3aGVuICd4JyB0aGVuIDE2XG4gICAgICAgICAgICBlbHNlIG51bGxcbiAgICAgICAgbnVtYmVyVmFsdWUgPSBpZiBiYXNlPyB0aGVuIHBhcnNlSW50KG51bWJlclsyLi5dLCBiYXNlKSBlbHNlIHBhcnNlRmxvYXQobnVtYmVyKVxuICAgICAgICBpZiBudW1iZXIuY2hhckF0KDEpIGluIFsnYicsICdvJ11cbiAgICAgICAgICAgIG51bWJlciA9IFwiMHgje251bWJlclZhbHVlLnRvU3RyaW5nIDE2fVwiXG5cbiAgICAgICAgdGFnID0gaWYgbnVtYmVyVmFsdWUgaXMgSW5maW5pdHkgdGhlbiAnSU5GSU5JVFknIGVsc2UgJ05VTUJFUidcbiAgICAgICAgQHRva2VuIHRhZywgbnVtYmVyLCAwLCBsZXhlZExlbmd0aFxuICAgICAgICBsZXhlZExlbmd0aFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICAjIE1hdGNoZXMgc3RyaW5ncywgaW5jbHVkaW5nIG11bHRpLWxpbmUgc3RyaW5ncywgYXMgd2VsbCBhcyBoZXJlZG9jcywgd2l0aCBvciB3aXRob3V0IGludGVycG9sYXRpb24uXG4gICAgXG4gICAgc3RyaW5nVG9rZW46IC0+XG4gICAgICAgIFtxdW90ZV0gPSBTVFJJTkdfU1RBUlQuZXhlYyhAY2h1bmspIHx8IFtdXG4gICAgICAgIHJldHVybiAwIHVubGVzcyBxdW90ZVxuXG4gICAgICAgICMgSWYgdGhlIHByZWNlZGluZyB0b2tlbiBpcyBgZnJvbWAgYW5kIHRoaXMgaXMgYW4gaW1wb3J0IG9yIGV4cG9ydCBzdGF0ZW1lbnQsIHByb3Blcmx5IHRhZyB0aGUgYGZyb21gLlxuICAgICAgICBcbiAgICAgICAgaWYgQHRva2Vucy5sZW5ndGggYW5kIEB2YWx1ZSgpIGlzICdmcm9tJyBhbmQgKEBzZWVuSW1wb3J0IG9yIEBzZWVuRXhwb3J0KVxuICAgICAgICAgICAgQHRva2Vuc1tAdG9rZW5zLmxlbmd0aCAtIDFdWzBdID0gJ0ZST00nXG5cbiAgICAgICAgcmVnZXggPSBzd2l0Y2ggcXVvdGVcbiAgICAgICAgICAgIHdoZW4gXCInXCIgICAgIHRoZW4gU1RSSU5HX1NJTkdMRVxuICAgICAgICAgICAgd2hlbiAnXCInICAgICB0aGVuIFNUUklOR19ET1VCTEVcbiAgICAgICAgICAgIHdoZW4gXCInJydcIiB0aGVuIEhFUkVET0NfU0lOR0xFXG4gICAgICAgICAgICB3aGVuICdcIlwiXCInIHRoZW4gSEVSRURPQ19ET1VCTEVcbiAgICAgICAgaGVyZWRvYyA9IHF1b3RlLmxlbmd0aCBpcyAzXG5cbiAgICAgICAge3Rva2VucywgaW5kZXg6IGVuZH0gPSBAbWF0Y2hXaXRoSW50ZXJwb2xhdGlvbnMgcmVnZXgsIHF1b3RlXG4gICAgICAgICQgPSB0b2tlbnMubGVuZ3RoIC0gMVxuXG4gICAgICAgIGRlbGltaXRlciA9IHF1b3RlLmNoYXJBdCgwKVxuICAgICAgICBpZiBoZXJlZG9jXG4gICAgICAgICAgICAjIEZpbmQgdGhlIHNtYWxsZXN0IGluZGVudGF0aW9uLiBJdCB3aWxsIGJlIHJlbW92ZWQgZnJvbSBhbGwgbGluZXMgbGF0ZXIuXG4gICAgICAgICAgICBpbmRlbnQgPSBudWxsXG4gICAgICAgICAgICBkb2MgPSAodG9rZW5bMV0gZm9yIHRva2VuLCBpIGluIHRva2VucyB3aGVuIHRva2VuWzBdIGlzICdORU9TVFJJTkcnKS5qb2luICcje30nXG4gICAgICAgICAgICB3aGlsZSBtYXRjaCA9IEhFUkVET0NfSU5ERU5ULmV4ZWMgZG9jXG4gICAgICAgICAgICAgICAgYXR0ZW1wdCA9IG1hdGNoWzFdXG4gICAgICAgICAgICAgICAgaW5kZW50ID0gYXR0ZW1wdCBpZiBpbmRlbnQgaXMgbnVsbCBvciAwIDwgYXR0ZW1wdC5sZW5ndGggPCBpbmRlbnQubGVuZ3RoXG4gICAgICAgICAgICBpbmRlbnRSZWdleCA9IC8vLyBcXG4je2luZGVudH0gLy8vZyBpZiBpbmRlbnRcbiAgICAgICAgICAgIEBtZXJnZUludGVycG9sYXRpb25Ub2tlbnMgdG9rZW5zLCB7ZGVsaW1pdGVyfSwgKHZhbHVlLCBpKSA9PlxuICAgICAgICAgICAgICAgIHZhbHVlID0gQGZvcm1hdFN0cmluZyB2YWx1ZSwgZGVsaW1pdGVyOiBxdW90ZVxuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZSBpbmRlbnRSZWdleCwgJ1xcbicgaWYgaW5kZW50UmVnZXhcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UgTEVBRElOR19CTEFOS19MSU5FLCAgICAnJyBpZiBpIGlzIDBcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UgVFJBSUxJTkdfQkxBTktfTElORSwgJycgaWYgaSBpcyAkXG4gICAgICAgICAgICAgICAgdmFsdWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQG1lcmdlSW50ZXJwb2xhdGlvblRva2VucyB0b2tlbnMsIHtkZWxpbWl0ZXJ9LCAodmFsdWUsIGkpID0+XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBAZm9ybWF0U3RyaW5nIHZhbHVlLCBkZWxpbWl0ZXI6IHF1b3RlXG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlIFNJTVBMRV9TVFJJTkdfT01JVCwgKG1hdGNoLCBvZmZzZXQpIC0+XG4gICAgICAgICAgICAgICAgICAgIGlmIChpIGlzIDAgYW5kIG9mZnNldCBpcyAwKSBvclxuICAgICAgICAgICAgICAgICAgICAgICAgIChpIGlzICQgYW5kIG9mZnNldCArIG1hdGNoLmxlbmd0aCBpcyB2YWx1ZS5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAnJ1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAnICdcbiAgICAgICAgICAgICAgICB2YWx1ZVxuXG4gICAgICAgIGVuZFxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIGNvbW1lbnRUb2tlbjogLT5cbiAgICAgICAgcmV0dXJuIDAgdW5sZXNzIG1hdGNoID0gQGNodW5rLm1hdGNoIENPTU1FTlRcbiAgICAgICAgW2NvbW1lbnQsIGhlcmVdID0gbWF0Y2hcbiAgICAgICAgaWYgaGVyZVxuICAgICAgICAgICAgaWYgbWF0Y2ggPSBIRVJFQ09NTUVOVF9JTExFR0FMLmV4ZWMgY29tbWVudFxuICAgICAgICAgICAgICAgIEBlcnJvciBcImJsb2NrIGNvbW1lbnRzIGNhbm5vdCBjb250YWluICN7bWF0Y2hbMF19XCIsXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldDogbWF0Y2guaW5kZXgsIGxlbmd0aDogbWF0Y2hbMF0ubGVuZ3RoXG4gICAgICAgICAgICBpZiBoZXJlLmluZGV4T2YoJ1xcbicpID49IDBcbiAgICAgICAgICAgICAgICBoZXJlID0gaGVyZS5yZXBsYWNlIC8vLyBcXG4gI3tyZXBlYXQgJyAnLCBAaW5kZW50fSAvLy9nLCAnXFxuJ1xuICAgICAgICAgICAgQHRva2VuICdIRVJFQ09NTUVOVCcsIGhlcmUsIDAsIGNvbW1lbnQubGVuZ3RoXG4gICAgICAgIGNvbW1lbnQubGVuZ3RoXG5cbiAgICAjICAgICAgIDAwMCAgIDAwMDAwMDAgIFxuICAgICMgICAgICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAgICAgICAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgIyBNYXRjaGVzIEphdmFTY3JpcHQgaW50ZXJwb2xhdGVkIGRpcmVjdGx5IGludG8gdGhlIHNvdXJjZSB2aWEgYmFja3RpY2tzLlxuICAgIFxuICAgIGpzVG9rZW46IC0+XG4gICAgICAgIHJldHVybiAwIHVubGVzcyBAY2h1bmsuY2hhckF0KDApIGlzICdgJyBhbmRcbiAgICAgICAgICAgIChtYXRjaCA9IEhFUkVfSlNUT0tFTi5leGVjKEBjaHVuaykgb3IgSlNUT0tFTi5leGVjKEBjaHVuaykpXG4gICAgICAgICMgQ29udmVydCBlc2NhcGVkIGJhY2t0aWNrcyB0byBiYWNrdGlja3MsIGFuZCBlc2NhcGVkIGJhY2tzbGFzaGVzXG4gICAgICAgICMganVzdCBiZWZvcmUgZXNjYXBlZCBiYWNrdGlja3MgdG8gYmFja3NsYXNoZXNcbiAgICAgICAgc2NyaXB0ID0gbWF0Y2hbMV0ucmVwbGFjZSAvXFxcXCsoYHwkKS9nLCAoc3RyaW5nKSAtPlxuICAgICAgICAgICAgIyBgc3RyaW5nYCBpcyBhbHdheXMgYSB2YWx1ZSBsaWtlICdcXGAnLCAnXFxcXFxcYCcsICdcXFxcXFxcXFxcYCcsIGV0Yy5cbiAgICAgICAgICAgICMgQnkgcmVkdWNpbmcgaXQgdG8gaXRzIGxhdHRlciBoYWxmLCB3ZSB0dXJuICdcXGAnIHRvICdgJywgJ1xcXFxcXGAnIHRvICdcXGAnLCBldGMuXG4gICAgICAgICAgICBzdHJpbmdbLU1hdGguY2VpbChzdHJpbmcubGVuZ3RoIC8gMikuLl1cbiAgICAgICAgQHRva2VuICdKUycsIHNjcmlwdCwgMCwgbWF0Y2hbMF0ubGVuZ3RoXG4gICAgICAgIG1hdGNoWzBdLmxlbmd0aFxuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMCAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgICAgMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICAjIE1hdGNoZXMgcmVndWxhciBleHByZXNzaW9uIGxpdGVyYWxzLCBhcyB3ZWxsIGFzIG11bHRpbGluZSBleHRlbmRlZCBvbmVzLlxuICAgICMgTGV4aW5nIHJlZ3VsYXIgZXhwcmVzc2lvbnMgaXMgZGlmZmljdWx0IHRvIGRpc3Rpbmd1aXNoIGZyb20gZGl2aXNpb24sIFxuICAgICMgc28gd2UgYm9ycm93IHNvbWUgYmFzaWMgaGV1cmlzdGljcyBmcm9tIEphdmFTY3JpcHQgYW5kIFJ1YnkuXG4gICAgXG4gICAgcmVnZXhUb2tlbjogLT5cbiAgICAgICAgc3dpdGNoXG4gICAgICAgICAgICB3aGVuIG1hdGNoID0gUkVHRVhfSUxMRUdBTC5leGVjIEBjaHVua1xuICAgICAgICAgICAgICAgIEBlcnJvciBcInJlZ3VsYXIgZXhwcmVzc2lvbnMgY2Fubm90IGJlZ2luIHdpdGggI3ttYXRjaFsyXX1cIixcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiBtYXRjaC5pbmRleCArIG1hdGNoWzFdLmxlbmd0aFxuICAgICAgICAgICAgd2hlbiBtYXRjaCA9IEBtYXRjaFdpdGhJbnRlcnBvbGF0aW9ucyBIRVJFR0VYLCAnLy8vJ1xuICAgICAgICAgICAgICAgIHt0b2tlbnMsIGluZGV4fSA9IG1hdGNoXG4gICAgICAgICAgICB3aGVuIG1hdGNoID0gUkVHRVguZXhlYyBAY2h1bmtcbiAgICAgICAgICAgICAgICBbcmVnZXgsIGJvZHksIGNsb3NlZF0gPSBtYXRjaFxuICAgICAgICAgICAgICAgIEB2YWxpZGF0ZUVzY2FwZXMgYm9keSwgaXNSZWdleDogeWVzLCBvZmZzZXRJbkNodW5rOiAxXG4gICAgICAgICAgICAgICAgYm9keSA9IEBmb3JtYXRSZWdleCBib2R5LCBkZWxpbWl0ZXI6ICcvJ1xuICAgICAgICAgICAgICAgIGluZGV4ID0gcmVnZXgubGVuZ3RoXG4gICAgICAgICAgICAgICAgWy4uLiwgcHJldl0gPSBAdG9rZW5zXG4gICAgICAgICAgICAgICAgaWYgcHJldlxuICAgICAgICAgICAgICAgICAgICBpZiBwcmV2LnNwYWNlZCBhbmQgcHJldlswXSBpbiBDQUxMQUJMRVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDAgaWYgbm90IGNsb3NlZCBvciBQT1NTSUJMWV9ESVZJU0lPTi50ZXN0IHJlZ2V4XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgcHJldlswXSBpbiBOT1RfUkVHRVhcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgICAgICAgICAgQGVycm9yICdtaXNzaW5nIC8gKHVuY2xvc2VkIHJlZ2V4KScgdW5sZXNzIGNsb3NlZFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiAwXG5cbiAgICAgICAgW2ZsYWdzXSA9IFJFR0VYX0ZMQUdTLmV4ZWMgQGNodW5rW2luZGV4Li5dXG4gICAgICAgIGVuZCA9IGluZGV4ICsgZmxhZ3MubGVuZ3RoXG4gICAgICAgIG9yaWdpbiA9IEBtYWtlVG9rZW4gJ1JFR0VYJywgbnVsbCwgMCwgZW5kXG4gICAgICAgIHN3aXRjaFxuICAgICAgICAgICAgd2hlbiBub3QgVkFMSURfRkxBR1MudGVzdCBmbGFnc1xuICAgICAgICAgICAgICAgIEBlcnJvciBcImludmFsaWQgcmVndWxhciBleHByZXNzaW9uIGZsYWdzICN7ZmxhZ3N9XCIsIG9mZnNldDogaW5kZXgsIGxlbmd0aDogZmxhZ3MubGVuZ3RoXG4gICAgICAgICAgICB3aGVuIHJlZ2V4IG9yIHRva2Vucy5sZW5ndGggaXMgMVxuICAgICAgICAgICAgICAgIGJvZHkgPz0gQGZvcm1hdEhlcmVnZXggdG9rZW5zWzBdWzFdXG4gICAgICAgICAgICAgICAgQHRva2VuICdSRUdFWCcsIFwiI3tAbWFrZURlbGltaXRlZExpdGVyYWwgYm9keSwgZGVsaW1pdGVyOiAnLyd9I3tmbGFnc31cIiwgMCwgZW5kLCBvcmlnaW5cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAdG9rZW4gJ1JFR0VYX1NUQVJUJywgJygnLCAwLCAwLCBvcmlnaW5cbiAgICAgICAgICAgICAgICBAdG9rZW4gJ0lERU5USUZJRVInLCAnUmVnRXhwJywgMCwgMFxuICAgICAgICAgICAgICAgIEB0b2tlbiAnQ0FMTF9TVEFSVCcsICcoJywgMCwgMFxuICAgICAgICAgICAgICAgIEBtZXJnZUludGVycG9sYXRpb25Ub2tlbnMgdG9rZW5zLCB7ZGVsaW1pdGVyOiAnXCInLCBkb3VibGU6IHllc30sIEBmb3JtYXRIZXJlZ2V4XG4gICAgICAgICAgICAgICAgaWYgZmxhZ3NcbiAgICAgICAgICAgICAgICAgICAgQHRva2VuICcsJywgJywnLCBpbmRleCAtIDEsIDBcbiAgICAgICAgICAgICAgICAgICAgQHRva2VuICdTVFJJTkcnLCAnXCInICsgZmxhZ3MgKyAnXCInLCBpbmRleCAtIDEsIGZsYWdzLmxlbmd0aFxuICAgICAgICAgICAgICAgIEB0b2tlbiAnKScsICcpJywgZW5kIC0gMSwgMFxuICAgICAgICAgICAgICAgIEB0b2tlbiAnUkVHRVhfRU5EJywgJyknLCBlbmQgLSAxLCAwXG5cbiAgICAgICAgZW5kXG5cbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgICMgTWF0Y2hlcyBuZXdsaW5lcywgaW5kZW50cywgYW5kIG91dGRlbnRzLCBhbmQgZGV0ZXJtaW5lcyB3aGljaCBpcyB3aGljaC5cbiAgICAjIElmIHdlIGNhbiBkZXRlY3QgdGhhdCB0aGUgY3VycmVudCBsaW5lIGlzIGNvbnRpbnVlZCBvbnRvIHRoZSBuZXh0IGxpbmUsXG4gICAgIyB0aGVuIHRoZSBuZXdsaW5lIGlzIHN1cHByZXNzZWQ6XG4gICAgI1xuICAgICMgICAgICAgICAgIGVsZW1lbnRzXG4gICAgIyAgICAgICAgICAgICAgIC5lYWNoKCAuLi4gKVxuICAgICMgICAgICAgICAgICAgICAubWFwKCAuLi4gKVxuICAgICNcbiAgICAjIEtlZXBzIHRyYWNrIG9mIHRoZSBsZXZlbCBvZiBpbmRlbnRhdGlvbiwgYmVjYXVzZSBhIHNpbmdsZSBvdXRkZW50IHRva2VuXG4gICAgIyBjYW4gY2xvc2UgbXVsdGlwbGUgaW5kZW50cywgc28gd2UgbmVlZCB0byBrbm93IGhvdyBmYXIgaW4gd2UgaGFwcGVuIHRvIGJlLlxuICAgIFxuICAgIGxpbmVUb2tlbjogLT5cbiAgICAgICAgcmV0dXJuIDAgdW5sZXNzIG1hdGNoID0gTVVMVElfREVOVC5leGVjIEBjaHVua1xuICAgICAgICBpbmRlbnQgPSBtYXRjaFswXVxuXG4gICAgICAgIEBzZWVuRm9yID0gbm9cbiAgICAgICAgQHNlZW5JbXBvcnQgPSBubyB1bmxlc3MgQGltcG9ydFNwZWNpZmllckxpc3RcbiAgICAgICAgQHNlZW5FeHBvcnQgPSBubyB1bmxlc3MgQGV4cG9ydFNwZWNpZmllckxpc3RcblxuICAgICAgICBzaXplID0gaW5kZW50Lmxlbmd0aCAtIDEgLSBpbmRlbnQubGFzdEluZGV4T2YgJ1xcbidcbiAgICAgICAgbm9OZXdsaW5lcyA9IEB1bmZpbmlzaGVkKClcblxuICAgICAgICBpZiBzaXplIC0gQGluZGVidCBpcyBAaW5kZW50XG4gICAgICAgICAgICBpZiBub05ld2xpbmVzIHRoZW4gQHN1cHByZXNzTmV3bGluZXMoKSBlbHNlIEBuZXdsaW5lVG9rZW4gMFxuICAgICAgICAgICAgcmV0dXJuIGluZGVudC5sZW5ndGhcblxuICAgICAgICBpZiBzaXplID4gQGluZGVudFxuICAgICAgICAgICAgaWYgbm9OZXdsaW5lc1xuICAgICAgICAgICAgICAgIEBpbmRlYnQgPSBzaXplIC0gQGluZGVudFxuICAgICAgICAgICAgICAgIEBzdXBwcmVzc05ld2xpbmVzKClcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5kZW50Lmxlbmd0aFxuICAgICAgICAgICAgdW5sZXNzIEB0b2tlbnMubGVuZ3RoXG4gICAgICAgICAgICAgICAgQGJhc2VJbmRlbnQgPSBAaW5kZW50ID0gc2l6ZVxuICAgICAgICAgICAgICAgIHJldHVybiBpbmRlbnQubGVuZ3RoXG4gICAgICAgICAgICBkaWZmID0gc2l6ZSAtIEBpbmRlbnQgKyBAb3V0ZGVidFxuICAgICAgICAgICAgQHRva2VuICdJTkRFTlQnLCBkaWZmLCBpbmRlbnQubGVuZ3RoIC0gc2l6ZSwgc2l6ZVxuICAgICAgICAgICAgQGluZGVudHMucHVzaCBkaWZmXG4gICAgICAgICAgICBAZW5kcy5wdXNoIHt0YWc6ICdPVVRERU5UJ31cbiAgICAgICAgICAgIEBvdXRkZWJ0ID0gQGluZGVidCA9IDBcbiAgICAgICAgICAgIEBpbmRlbnQgPSBzaXplXG4gICAgICAgIGVsc2UgaWYgc2l6ZSA8IEBiYXNlSW5kZW50XG4gICAgICAgICAgICBAZXJyb3IgJ21pc3NpbmcgaW5kZW50YXRpb24nLCBvZmZzZXQ6IGluZGVudC5sZW5ndGhcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGluZGVidCA9IDBcbiAgICAgICAgICAgIEBvdXRkZW50VG9rZW4gQGluZGVudCAtIHNpemUsIG5vTmV3bGluZXMsIGluZGVudC5sZW5ndGhcbiAgICAgICAgaW5kZW50Lmxlbmd0aFxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgIyBSZWNvcmQgYW4gb3V0ZGVudCB0b2tlbiBvciBtdWx0aXBsZSB0b2tlbnMsIGlmIHdlIGhhcHBlbiB0byBiZSBtb3ZpbmcgYmFja1xuICAgICMgaW53YXJkcyBwYXN0IHNldmVyYWwgcmVjb3JkZWQgaW5kZW50cy4gU2V0cyBuZXcgQGluZGVudCB2YWx1ZS5cbiAgICBcbiAgICBvdXRkZW50VG9rZW46IChtb3ZlT3V0LCBub05ld2xpbmVzLCBvdXRkZW50TGVuZ3RoKSAtPlxuICAgICAgICBkZWNyZWFzZWRJbmRlbnQgPSBAaW5kZW50IC0gbW92ZU91dFxuICAgICAgICB3aGlsZSBtb3ZlT3V0ID4gMFxuICAgICAgICAgICAgbGFzdEluZGVudCA9IEBpbmRlbnRzW0BpbmRlbnRzLmxlbmd0aCAtIDFdXG4gICAgICAgICAgICBpZiBub3QgbGFzdEluZGVudFxuICAgICAgICAgICAgICAgIG1vdmVPdXQgPSAwXG4gICAgICAgICAgICBlbHNlIGlmIGxhc3RJbmRlbnQgaXMgQG91dGRlYnRcbiAgICAgICAgICAgICAgICBtb3ZlT3V0IC09IEBvdXRkZWJ0XG4gICAgICAgICAgICAgICAgQG91dGRlYnQgPSAwXG4gICAgICAgICAgICBlbHNlIGlmIGxhc3RJbmRlbnQgPCBAb3V0ZGVidFxuICAgICAgICAgICAgICAgIEBvdXRkZWJ0IC09IGxhc3RJbmRlbnRcbiAgICAgICAgICAgICAgICBtb3ZlT3V0ICAtPSBsYXN0SW5kZW50XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgZGVudCA9IEBpbmRlbnRzLnBvcCgpICsgQG91dGRlYnRcbiAgICAgICAgICAgICAgICBpZiBvdXRkZW50TGVuZ3RoIGFuZCBAY2h1bmtbb3V0ZGVudExlbmd0aF0gaW4gSU5ERU5UQUJMRV9DTE9TRVJTXG4gICAgICAgICAgICAgICAgICAgIGRlY3JlYXNlZEluZGVudCAtPSBkZW50IC0gbW92ZU91dFxuICAgICAgICAgICAgICAgICAgICBtb3ZlT3V0ID0gZGVudFxuICAgICAgICAgICAgICAgIEBvdXRkZWJ0ID0gMFxuICAgICAgICAgICAgICAgICMgcGFpciBtaWdodCBjYWxsIG91dGRlbnRUb2tlbiwgc28gcHJlc2VydmUgZGVjcmVhc2VkSW5kZW50XG4gICAgICAgICAgICAgICAgQHBhaXIgJ09VVERFTlQnXG4gICAgICAgICAgICAgICAgQHRva2VuICdPVVRERU5UJywgbW92ZU91dCwgMCwgb3V0ZGVudExlbmd0aFxuICAgICAgICAgICAgICAgIG1vdmVPdXQgLT0gZGVudFxuICAgICAgICBAb3V0ZGVidCAtPSBtb3ZlT3V0IGlmIGRlbnRcbiAgICAgICAgQHRva2Vucy5wb3AoKSB3aGlsZSBAdmFsdWUoKSBpcyAnOydcblxuICAgICAgICBAdG9rZW4gJ1RFUk1JTkFUT1InLCAnXFxuJywgb3V0ZGVudExlbmd0aCwgMCB1bmxlc3MgQHRhZygpIGlzICdURVJNSU5BVE9SJyBvciBub05ld2xpbmVzXG4gICAgICAgIEBpbmRlbnQgPSBkZWNyZWFzZWRJbmRlbnRcbiAgICAgICAgdGhpc1xuXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMCAgICAgMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgXG4gICAgIyBNYXRjaGVzIGFuZCBjb25zdW1lcyBub24tbWVhbmluZ2Z1bCB3aGl0ZXNwYWNlLiBUYWcgdGhlIHByZXZpb3VzIHRva2VuXG4gICAgIyBhcyBiZWluZyDigJxzcGFjZWTigJ0sIGJlY2F1c2UgdGhlcmUgYXJlIHNvbWUgY2FzZXMgd2hlcmUgaXQgbWFrZXMgYSBkaWZmZXJlbmNlLlxuICAgIFxuICAgIHdoaXRlc3BhY2VUb2tlbjogLT5cbiAgICAgICAgcmV0dXJuIDAgdW5sZXNzIChtYXRjaCA9IFdISVRFU1BBQ0UuZXhlYyBAY2h1bmspIG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKG5saW5lID0gQGNodW5rLmNoYXJBdCgwKSBpcyAnXFxuJylcbiAgICAgICAgWy4uLiwgcHJldl0gPSBAdG9rZW5zXG4gICAgICAgIHByZXZbaWYgbWF0Y2ggdGhlbiAnc3BhY2VkJyBlbHNlICduZXdMaW5lJ10gPSB0cnVlIGlmIHByZXZcbiAgICAgICAgaWYgbWF0Y2ggdGhlbiBtYXRjaFswXS5sZW5ndGggZWxzZSAwXG5cbiAgICAjIEdlbmVyYXRlIGEgbmV3bGluZSB0b2tlbi4gQ29uc2VjdXRpdmUgbmV3bGluZXMgZ2V0IG1lcmdlZCB0b2dldGhlci5cbiAgICBcbiAgICBuZXdsaW5lVG9rZW46IChvZmZzZXQpIC0+XG4gICAgICAgIEB0b2tlbnMucG9wKCkgd2hpbGUgQHZhbHVlKCkgaXMgJzsnXG4gICAgICAgIEB0b2tlbiAnVEVSTUlOQVRPUicsICdcXG4nLCBvZmZzZXQsIDAgdW5sZXNzIEB0YWcoKSBpcyAnVEVSTUlOQVRPUidcbiAgICAgICAgdGhpc1xuXG4gICAgIyBVc2UgYSBgXFxgIGF0IGEgbGluZS1lbmRpbmcgdG8gc3VwcHJlc3MgdGhlIG5ld2xpbmUuXG4gICAgIyBUaGUgc2xhc2ggaXMgcmVtb3ZlZCBoZXJlIG9uY2UgaXRzIGpvYiBpcyBkb25lLlxuICAgIFxuICAgIHN1cHByZXNzTmV3bGluZXM6IC0+XG4gICAgICAgIEB0b2tlbnMucG9wKCkgaWYgQHZhbHVlKCkgaXMgJ1xcXFwnXG4gICAgICAgIHRoaXNcblxuICAgICMgMDAwICAgICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgXG4gICAgIyAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgICAgIFxuICAgICMgMDAwICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgXG4gICAgIyAwMDAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICBcbiAgICBcbiAgICAjIFdlIHRyZWF0IGFsbCBvdGhlciBzaW5nbGUgY2hhcmFjdGVycyBhcyBhIHRva2VuLiBFLmcuOiBgKCApICwgLiAhYFxuICAgICMgTXVsdGktY2hhcmFjdGVyIG9wZXJhdG9ycyBhcmUgYWxzbyBsaXRlcmFsIHRva2Vucywgc28gdGhhdCBKaXNvbiBjYW4gYXNzaWduXG4gICAgIyB0aGUgcHJvcGVyIG9yZGVyIG9mIG9wZXJhdGlvbnMuIFRoZXJlIGFyZSBzb21lIHN5bWJvbHMgdGhhdCB3ZSB0YWcgc3BlY2lhbGx5XG4gICAgIyBoZXJlLiBgO2AgYW5kIG5ld2xpbmVzIGFyZSBib3RoIHRyZWF0ZWQgYXMgYSBgVEVSTUlOQVRPUmAsIHdlIGRpc3Rpbmd1aXNoXG4gICAgIyBwYXJlbnRoZXNlcyB0aGF0IGluZGljYXRlIGEgbWV0aG9kIGNhbGwgZnJvbSByZWd1bGFyIHBhcmVudGhlc2VzLCBhbmQgc28gb24uXG4gICAgXG4gICAgbGl0ZXJhbFRva2VuOiAtPlxuICAgICAgICBpZiBtYXRjaCA9IE9QRVJBVE9SLmV4ZWMgQGNodW5rXG4gICAgICAgICAgICBbdmFsdWVdID0gbWF0Y2hcbiAgICAgICAgICAgIEB0YWdQYXJhbWV0ZXJzKCkgaWYgQ09ERS50ZXN0IHZhbHVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHZhbHVlID0gQGNodW5rLmNoYXJBdCAwXG4gICAgICAgIHRhZyAgPSB2YWx1ZVxuICAgICAgICBbLi4uLCBwcmV2XSA9IEB0b2tlbnNcblxuICAgICAgICBpZiBwcmV2IGFuZCB2YWx1ZSBpbiBbJz0nLCBDT01QT1VORF9BU1NJR04uLi5dXG4gICAgICAgICAgICBza2lwVG9rZW4gPSBmYWxzZVxuICAgICAgICAgICAgaWYgdmFsdWUgaXMgJz0nIGFuZCBwcmV2WzFdIGluIFsnfHwnLCAnJiYnXSBhbmQgbm90IHByZXYuc3BhY2VkXG4gICAgICAgICAgICAgICAgcHJldlswXSA9ICdDT01QT1VORF9BU1NJR04nXG4gICAgICAgICAgICAgICAgcHJldlsxXSArPSAnPSdcbiAgICAgICAgICAgICAgICBwcmV2ID0gQHRva2Vuc1tAdG9rZW5zLmxlbmd0aCAtIDJdXG4gICAgICAgICAgICAgICAgc2tpcFRva2VuID0gdHJ1ZVxuICAgICAgICAgICAgaWYgcHJldiBhbmQgcHJldlswXSAhPSAnUFJPUEVSVFknXG4gICAgICAgICAgICAgICAgb3JpZ2luID0gcHJldi5vcmlnaW4gPyBwcmV2XG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IGlzVW5hc3NpZ25hYmxlIHByZXZbMV0sIG9yaWdpblsxXVxuICAgICAgICAgICAgICAgIEBlcnJvciBtZXNzYWdlLCBvcmlnaW5bMl0gaWYgbWVzc2FnZVxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlLmxlbmd0aCBpZiBza2lwVG9rZW5cblxuICAgICAgICBpZiB2YWx1ZSBpcyAneycgYW5kIEBzZWVuSW1wb3J0XG4gICAgICAgICAgICBAaW1wb3J0U3BlY2lmaWVyTGlzdCA9IHllc1xuICAgICAgICBlbHNlIGlmIEBpbXBvcnRTcGVjaWZpZXJMaXN0IGFuZCB2YWx1ZSBpcyAnfSdcbiAgICAgICAgICAgIEBpbXBvcnRTcGVjaWZpZXJMaXN0ID0gbm9cbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpcyAneycgYW5kIHByZXY/WzBdIGlzICdFWFBPUlQnXG4gICAgICAgICAgICBAZXhwb3J0U3BlY2lmaWVyTGlzdCA9IHllc1xuICAgICAgICBlbHNlIGlmIEBleHBvcnRTcGVjaWZpZXJMaXN0IGFuZCB2YWx1ZSBpcyAnfSdcbiAgICAgICAgICAgIEBleHBvcnRTcGVjaWZpZXJMaXN0ID0gbm9cblxuICAgICAgICBpZiB2YWx1ZSBpcyAnOydcbiAgICAgICAgICAgIEBzZWVuRm9yID0gQHNlZW5JbXBvcnQgPSBAc2VlbkV4cG9ydCA9IG5vXG4gICAgICAgICAgICB0YWcgPSAnVEVSTUlOQVRPUidcbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpcyAnKicgYW5kIHByZXZbMF0gaXMgJ0VYUE9SVCdcbiAgICAgICAgICAgIHRhZyA9ICdFWFBPUlRfQUxMJ1xuICAgICAgICBlbHNlIGlmIHZhbHVlIGluIE1BVEggICAgICAgICAgICAgICAgICAgdGhlbiB0YWcgPSAnTUFUSCdcbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpbiBDT01QQVJFICAgICAgICAgICAgICAgIHRoZW4gdGFnID0gJ0NPTVBBUkUnXG4gICAgICAgIGVsc2UgaWYgdmFsdWUgaW4gQ09NUE9VTkRfQVNTSUdOICAgICAgICB0aGVuIHRhZyA9ICdDT01QT1VORF9BU1NJR04nXG4gICAgICAgIGVsc2UgaWYgdmFsdWUgaW4gVU5BUlkgICAgICAgICAgICAgICAgICB0aGVuIHRhZyA9ICdVTkFSWSdcbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpbiBVTkFSWV9NQVRIICAgICAgICAgICAgIHRoZW4gdGFnID0gJ1VOQVJZX01BVEgnXG4gICAgICAgIGVsc2UgaWYgdmFsdWUgaW4gU0hJRlQgICAgICAgICAgICAgICAgICB0aGVuIHRhZyA9ICdTSElGVCdcbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpcyAnPycgYW5kIHByZXY/LnNwYWNlZCAgIHRoZW4gdGFnID0gJ0JJTj8nXG4gICAgICAgIGVsc2UgaWYgcHJldiBhbmQgbm90IHByZXYuc3BhY2VkXG4gICAgICAgICAgICBpZiB2YWx1ZSBpcyAnKCcgYW5kIHByZXZbMF0gaW4gQ0FMTEFCTEVcbiAgICAgICAgICAgICAgICBwcmV2WzBdID0gJ0ZVTkNfRVhJU1QnIGlmIHByZXZbMF0gaXMgJz8nXG4gICAgICAgICAgICAgICAgdGFnID0gJ0NBTExfU1RBUlQnXG4gICAgICAgICAgICBlbHNlIGlmIHZhbHVlIGlzICdbJyBhbmQgcHJldlswXSBpbiBJTkRFWEFCTEVcbiAgICAgICAgICAgICAgICB0YWcgPSAnSU5ERVhfU1RBUlQnXG4gICAgICAgICAgICAgICAgc3dpdGNoIHByZXZbMF1cbiAgICAgICAgICAgICAgICAgICAgd2hlbiAnPycgICAgdGhlbiBwcmV2WzBdID0gJ0lOREVYX1NPQUsnXG4gICAgICAgIHRva2VuID0gQG1ha2VUb2tlbiB0YWcsIHZhbHVlXG4gICAgICAgIHN3aXRjaCB2YWx1ZVxuICAgICAgICAgICAgd2hlbiAnKCcsICd7JywgJ1snIHRoZW4gQGVuZHMucHVzaCB7dGFnOiBJTlZFUlNFU1t2YWx1ZV0sIG9yaWdpbjogdG9rZW59XG4gICAgICAgICAgICB3aGVuICcpJywgJ30nLCAnXScgdGhlbiBAcGFpciB2YWx1ZVxuICAgICAgICBAdG9rZW5zLnB1c2ggdG9rZW5cbiAgICAgICAgdmFsdWUubGVuZ3RoXG5cbiAgICAjIyNcbiAgICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICBcbiAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICBcbiAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICBcbiAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICAjIyNcbiAgICBcbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgICMgQSBzb3VyY2Ugb2YgYW1iaWd1aXR5IGluIG91ciBncmFtbWFyIHVzZWQgdG8gYmUgcGFyYW1ldGVyIGxpc3RzIGluIGZ1bmN0aW9uXG4gICAgIyBkZWZpbml0aW9ucyB2ZXJzdXMgYXJndW1lbnQgbGlzdHMgaW4gZnVuY3Rpb24gY2FsbHMuIFdhbGsgYmFja3dhcmRzLCB0YWdnaW5nXG4gICAgIyBwYXJhbWV0ZXJzIHNwZWNpYWxseSBpbiBvcmRlciB0byBtYWtlIHRoaW5ncyBlYXNpZXIgZm9yIHRoZSBwYXJzZXIuXG4gICAgICAgIFxuICAgIHRhZ1BhcmFtZXRlcnM6IC0+XG4gICAgICAgIHJldHVybiB0aGlzIGlmIEB0YWcoKSAhPSAnKSdcbiAgICAgICAgc3RhY2sgPSBbXVxuICAgICAgICB7dG9rZW5zfSA9IHRoaXNcbiAgICAgICAgaSA9IHRva2Vucy5sZW5ndGhcbiAgICAgICAgdG9rZW5zWy0taV1bMF0gPSAnUEFSQU1fRU5EJ1xuICAgICAgICB3aGlsZSB0b2sgPSB0b2tlbnNbLS1pXVxuICAgICAgICAgICAgc3dpdGNoIHRva1swXVxuICAgICAgICAgICAgICAgIHdoZW4gJyknXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2ggdG9rXG4gICAgICAgICAgICAgICAgd2hlbiAnKCcsICdDQUxMX1NUQVJUJ1xuICAgICAgICAgICAgICAgICAgICBpZiBzdGFjay5sZW5ndGggdGhlbiBzdGFjay5wb3AoKVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIHRva1swXSBpcyAnKCdcbiAgICAgICAgICAgICAgICAgICAgICAgIHRva1swXSA9ICdQQVJBTV9TVEFSVCdcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgcmV0dXJuIHRoaXNcbiAgICAgICAgdGhpc1xuXG4gICAgIyBDbG9zZSB1cCBhbGwgcmVtYWluaW5nIG9wZW4gYmxvY2tzIGF0IHRoZSBlbmQgb2YgdGhlIGZpbGUuXG4gICAgXG4gICAgY2xvc2VJbmRlbnRhdGlvbjogLT5cbiAgICAgICAgQG91dGRlbnRUb2tlbiBAaW5kZW50XG5cbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgIyBNYXRjaCB0aGUgY29udGVudHMgb2YgYSBkZWxpbWl0ZWQgdG9rZW4gYW5kIGV4cGFuZCB2YXJpYWJsZXMgYW5kIGV4cHJlc3Npb25zXG4gICAgIyBpbnNpZGUgaXQgdXNpbmcgUnVieS1saWtlIG5vdGF0aW9uIGZvciBzdWJzdGl0dXRpb24gb2YgYXJiaXRyYXJ5IGV4cHJlc3Npb25zLlxuICAgICNcbiAgICAjICAgIFwiSGVsbG8gI3tuYW1lLmNhcGl0YWxpemUoKX0uXCJcbiAgICAjXG4gICAgIyBJZiBpdCBlbmNvdW50ZXJzIGFuIGludGVycG9sYXRpb24sIHRoaXMgbWV0aG9kIHdpbGwgcmVjdXJzaXZlbHkgY3JlYXRlIGEgbmV3XG4gICAgIyBMZXhlciBhbmQgdG9rZW5pemUgdW50aWwgdGhlIGB7YCBvZiBgI3tgIGlzIGJhbGFuY2VkIHdpdGggYSBgfWAuXG4gICAgI1xuICAgICMgICAgLSBgcmVnZXhgIG1hdGNoZXMgdGhlIGNvbnRlbnRzIG9mIGEgdG9rZW4gKGJ1dCBub3QgYGRlbGltaXRlcmAsIGFuZCBub3RcbiAgICAjICAgICAgICBgI3tgIGlmIGludGVycG9sYXRpb25zIGFyZSBkZXNpcmVkKS5cbiAgICAjICAgIC0gYGRlbGltaXRlcmAgaXMgdGhlIGRlbGltaXRlciBvZiB0aGUgdG9rZW4uIEV4YW1wbGVzIGFyZSBgJ2AsIGBcImAsIGAnJydgLFxuICAgICMgICAgICAgIGBcIlwiXCJgIGFuZCBgLy8vYC5cbiAgICAjXG4gICAgIyBUaGlzIG1ldGhvZCBhbGxvd3MgdXMgdG8gaGF2ZSBzdHJpbmdzIHdpdGhpbiBpbnRlcnBvbGF0aW9ucyB3aXRoaW4gc3RyaW5ncywgYWQgaW5maW5pdHVtLlxuICAgIFxuICAgIG1hdGNoV2l0aEludGVycG9sYXRpb25zOiAocmVnZXgsIGRlbGltaXRlcikgLT5cbiAgICAgICAgdG9rZW5zID0gW11cbiAgICAgICAgb2Zmc2V0SW5DaHVuayA9IGRlbGltaXRlci5sZW5ndGhcbiAgICAgICAgcmV0dXJuIG51bGwgdW5sZXNzIEBjaHVua1suLi5vZmZzZXRJbkNodW5rXSBpcyBkZWxpbWl0ZXJcbiAgICAgICAgc3RyID0gQGNodW5rW29mZnNldEluQ2h1bmsuLl1cbiAgICAgICAgbG9vcFxuICAgICAgICAgICAgW3N0clBhcnRdID0gcmVnZXguZXhlYyBzdHJcblxuICAgICAgICAgICAgQHZhbGlkYXRlRXNjYXBlcyBzdHJQYXJ0LCB7aXNSZWdleDogZGVsaW1pdGVyLmNoYXJBdCgwKSBpcyAnLycsIG9mZnNldEluQ2h1bmt9XG5cbiAgICAgICAgICAgICMgUHVzaCBhIGZha2UgJ05FT1NUUklORycgdG9rZW4sIHdoaWNoIHdpbGwgZ2V0IHR1cm5lZCBpbnRvIGEgcmVhbCBzdHJpbmcgbGF0ZXIuXG4gICAgICAgICAgICB0b2tlbnMucHVzaCBAbWFrZVRva2VuICdORU9TVFJJTkcnLCBzdHJQYXJ0LCBvZmZzZXRJbkNodW5rXG5cbiAgICAgICAgICAgIHN0ciA9IHN0cltzdHJQYXJ0Lmxlbmd0aC4uXVxuICAgICAgICAgICAgb2Zmc2V0SW5DaHVuayArPSBzdHJQYXJ0Lmxlbmd0aFxuXG4gICAgICAgICAgICBicmVhayB1bmxlc3Mgc3RyWy4uLjJdIGlzICcjeydcblxuICAgICAgICAgICAgIyBUaGUgYDFgcyBhcmUgdG8gcmVtb3ZlIHRoZSBgI2AgaW4gYCN7YC5cbiAgICAgICAgICAgIFtsaW5lLCBjb2x1bW5dID0gQGdldExpbmVBbmRDb2x1bW5Gcm9tQ2h1bmsgb2Zmc2V0SW5DaHVuayArIDFcbiAgICAgICAgICAgIHt0b2tlbnM6IG5lc3RlZCwgaW5kZXh9ID1cbiAgICAgICAgICAgICAgICBuZXcgTGV4ZXIoKS50b2tlbml6ZSBzdHJbMS4uXSwgbGluZTogbGluZSwgY29sdW1uOiBjb2x1bW4sIHVudGlsQmFsYW5jZWQ6IG9uXG4gICAgICAgICAgICAjIFNraXAgdGhlIHRyYWlsaW5nIGB9YC5cbiAgICAgICAgICAgIGluZGV4ICs9IDFcblxuICAgICAgICAgICAgIyBUdXJuIHRoZSBsZWFkaW5nIGFuZCB0cmFpbGluZyBge2AgYW5kIGB9YCBpbnRvIHBhcmVudGhlc2VzLiBVbm5lY2Vzc2FyeVxuICAgICAgICAgICAgIyBwYXJlbnRoZXNlcyB3aWxsIGJlIHJlbW92ZWQgbGF0ZXIuXG4gICAgICAgICAgICBbb3BlbiwgLi4uLCBjbG9zZV0gPSBuZXN0ZWRcbiAgICAgICAgICAgIG9wZW5bMF0gID0gb3BlblsxXSAgPSAnKCdcbiAgICAgICAgICAgIGNsb3NlWzBdID0gY2xvc2VbMV0gPSAnKSdcbiAgICAgICAgICAgIGNsb3NlLm9yaWdpbiA9IFsnJywgJ2VuZCBvZiBpbnRlcnBvbGF0aW9uJywgY2xvc2VbMl1dXG5cbiAgICAgICAgICAgICMgUmVtb3ZlIGxlYWRpbmcgJ1RFUk1JTkFUT1InIChpZiBhbnkpLlxuICAgICAgICAgICAgbmVzdGVkLnNwbGljZSAxLCAxIGlmIG5lc3RlZFsxXT9bMF0gaXMgJ1RFUk1JTkFUT1InXG5cbiAgICAgICAgICAgICMgUHVzaCBhIGZha2UgJ1RPS0VOUycgdG9rZW4sIHdoaWNoIHdpbGwgZ2V0IHR1cm5lZCBpbnRvIHJlYWwgdG9rZW5zIGxhdGVyLlxuICAgICAgICAgICAgdG9rZW5zLnB1c2ggWydUT0tFTlMnLCBuZXN0ZWRdXG5cbiAgICAgICAgICAgIHN0ciA9IHN0cltpbmRleC4uXVxuICAgICAgICAgICAgb2Zmc2V0SW5DaHVuayArPSBpbmRleFxuXG4gICAgICAgIHVubGVzcyBzdHJbLi4uZGVsaW1pdGVyLmxlbmd0aF0gaXMgZGVsaW1pdGVyXG4gICAgICAgICAgICBAZXJyb3IgXCJtaXNzaW5nICN7ZGVsaW1pdGVyfVwiLCBsZW5ndGg6IGRlbGltaXRlci5sZW5ndGhcblxuICAgICAgICBbZmlyc3RUb2tlbiwgLi4uLCBsYXN0VG9rZW5dID0gdG9rZW5zXG4gICAgICAgIGZpcnN0VG9rZW5bMl0uZmlyc3RfY29sdW1uIC09IGRlbGltaXRlci5sZW5ndGhcbiAgICAgICAgaWYgbGFzdFRva2VuWzFdLnN1YnN0cigtMSkgaXMgJ1xcbidcbiAgICAgICAgICAgIGxhc3RUb2tlblsyXS5sYXN0X2xpbmUgKz0gMVxuICAgICAgICAgICAgbGFzdFRva2VuWzJdLmxhc3RfY29sdW1uID0gZGVsaW1pdGVyLmxlbmd0aCAtIDFcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbGFzdFRva2VuWzJdLmxhc3RfY29sdW1uICs9IGRlbGltaXRlci5sZW5ndGhcbiAgICAgICAgbGFzdFRva2VuWzJdLmxhc3RfY29sdW1uIC09IDEgaWYgbGFzdFRva2VuWzFdLmxlbmd0aCBpcyAwXG5cbiAgICAgICAge3Rva2VucywgaW5kZXg6IG9mZnNldEluQ2h1bmsgKyBkZWxpbWl0ZXIubGVuZ3RofVxuXG4gICAgIyAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICBcbiAgICAjIE1lcmdlIHRoZSBhcnJheSBgdG9rZW5zYCBvZiB0aGUgZmFrZSB0b2tlbiB0eXBlcyAnVE9LRU5TJyBhbmQgJ05FT1NUUklORycgIChhcyByZXR1cm5lZCBieSBgbWF0Y2hXaXRoSW50ZXJwb2xhdGlvbnNgKSBpbnRvIHRoZSB0b2tlbiBzdHJlYW0uIFxuICAgICMgVGhlIHZhbHVlIG9mICdORU9TVFJJTkcncyBhcmUgY29udmVydGVkIHVzaW5nIGBmbmAgYW5kIHR1cm5lZCBpbnRvIHN0cmluZ3MgdXNpbmcgYG9wdGlvbnNgIGZpcnN0LlxuICAgIFxuICAgIG1lcmdlSW50ZXJwb2xhdGlvblRva2VuczogKHRva2Vucywgb3B0aW9ucywgZm4pIC0+XG4gICAgICAgIGlmIHRva2Vucy5sZW5ndGggPiAxXG4gICAgICAgICAgICBscGFyZW4gPSBAdG9rZW4gJ1NUUklOR19TVEFSVCcsICcoJywgMCwgMFxuXG4gICAgICAgIGZpcnN0SW5kZXggPSBAdG9rZW5zLmxlbmd0aFxuICAgICAgICBmb3IgdG9rZW4sIGkgaW4gdG9rZW5zXG4gICAgICAgICAgICBbdGFnLCB2YWx1ZV0gPSB0b2tlblxuICAgICAgICAgICAgc3dpdGNoIHRhZ1xuICAgICAgICAgICAgICAgIHdoZW4gJ1RPS0VOUydcbiAgICAgICAgICAgICAgICAgICAgIyBPcHRpbWl6ZSBvdXQgZW1wdHkgaW50ZXJwb2xhdGlvbnMgKGFuIGVtcHR5IHBhaXIgb2YgcGFyZW50aGVzZXMpLlxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZSBpZiB2YWx1ZS5sZW5ndGggaXMgMlxuICAgICAgICAgICAgICAgICAgICAjIFB1c2ggYWxsIHRoZSB0b2tlbnMgaW4gdGhlIGZha2UgJ1RPS0VOUycgdG9rZW4uIFxuICAgICAgICAgICAgICAgICAgICAjIFRoZXNlIGFscmVhZHkgaGF2ZSBzYW5lIGxvY2F0aW9uIGRhdGEuXG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uVG9rZW4gPSB2YWx1ZVswXVxuICAgICAgICAgICAgICAgICAgICB0b2tlbnNUb1B1c2ggPSB2YWx1ZVxuICAgICAgICAgICAgICAgIHdoZW4gJ05FT1NUUklORydcbiAgICAgICAgICAgICAgICAgICAgIyBDb252ZXJ0ICdORU9TVFJJTkcnIGludG8gJ1NUUklORycuXG4gICAgICAgICAgICAgICAgICAgIGNvbnZlcnRlZCA9IGZuLmNhbGwgdGhpcywgdG9rZW5bMV0sIGlcbiAgICAgICAgICAgICAgICAgICAgIyBPcHRpbWl6ZSBvdXQgZW1wdHkgc3RyaW5ncy4gV2UgZW5zdXJlIHRoYXQgdGhlIHRva2VucyBzdHJlYW0gYWx3YXlzXG4gICAgICAgICAgICAgICAgICAgICMgc3RhcnRzIHdpdGggYSBzdHJpbmcgdG9rZW4sIHRob3VnaCwgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIHJlc3VsdFxuICAgICAgICAgICAgICAgICAgICAjIHJlYWxseSBpcyBhIHN0cmluZy5cbiAgICAgICAgICAgICAgICAgICAgaWYgY29udmVydGVkLmxlbmd0aCBpcyAwXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBpIGlzIDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaXJzdEVtcHR5U3RyaW5nSW5kZXggPSBAdG9rZW5zLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgICAgICMgSG93ZXZlciwgdGhlcmUgaXMgb25lIGNhc2Ugd2hlcmUgd2UgY2FuIG9wdGltaXplIGF3YXkgYSBzdGFydGluZyBlbXB0eSBzdHJpbmcuXG4gICAgICAgICAgICAgICAgICAgIGlmIGkgaXMgMiBhbmQgZmlyc3RFbXB0eVN0cmluZ0luZGV4P1xuICAgICAgICAgICAgICAgICAgICAgICAgQHRva2Vucy5zcGxpY2UgZmlyc3RFbXB0eVN0cmluZ0luZGV4LCAyICMgUmVtb3ZlIGVtcHR5IHN0cmluZyBhbmQgdGhlIHBsdXMuXG4gICAgICAgICAgICAgICAgICAgIHRva2VuWzBdID0gJ1NUUklORydcbiAgICAgICAgICAgICAgICAgICAgdG9rZW5bMV0gPSBAbWFrZURlbGltaXRlZExpdGVyYWwgY29udmVydGVkLCBvcHRpb25zXG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uVG9rZW4gPSB0b2tlblxuICAgICAgICAgICAgICAgICAgICB0b2tlbnNUb1B1c2ggPSBbdG9rZW5dXG4gICAgICAgICAgICBpZiBAdG9rZW5zLmxlbmd0aCA+IGZpcnN0SW5kZXhcbiAgICAgICAgICAgICAgICAjIENyZWF0ZSBhIDAtbGVuZ3RoIFwiK1wiIHRva2VuLlxuICAgICAgICAgICAgICAgIHBsdXNUb2tlbiA9IEB0b2tlbiAnKycsICcrJ1xuICAgICAgICAgICAgICAgIHBsdXNUb2tlblsyXSA9XG4gICAgICAgICAgICAgICAgICAgIGZpcnN0X2xpbmU6ICAgbG9jYXRpb25Ub2tlblsyXS5maXJzdF9saW5lXG4gICAgICAgICAgICAgICAgICAgIGZpcnN0X2NvbHVtbjogbG9jYXRpb25Ub2tlblsyXS5maXJzdF9jb2x1bW5cbiAgICAgICAgICAgICAgICAgICAgbGFzdF9saW5lOiAgICBsb2NhdGlvblRva2VuWzJdLmZpcnN0X2xpbmVcbiAgICAgICAgICAgICAgICAgICAgbGFzdF9jb2x1bW46ICBsb2NhdGlvblRva2VuWzJdLmZpcnN0X2NvbHVtblxuICAgICAgICAgICAgQHRva2Vucy5wdXNoIHRva2Vuc1RvUHVzaC4uLlxuXG4gICAgICAgIGlmIGxwYXJlblxuICAgICAgICAgICAgWy4uLiwgbGFzdFRva2VuXSA9IHRva2Vuc1xuICAgICAgICAgICAgbHBhcmVuLm9yaWdpbiA9IFsnU1RSSU5HJywgbnVsbCxcbiAgICAgICAgICAgICAgICBmaXJzdF9saW5lOiAgIGxwYXJlblsyXS5maXJzdF9saW5lXG4gICAgICAgICAgICAgICAgZmlyc3RfY29sdW1uOiBscGFyZW5bMl0uZmlyc3RfY29sdW1uXG4gICAgICAgICAgICAgICAgbGFzdF9saW5lOiAgICBsYXN0VG9rZW5bMl0ubGFzdF9saW5lXG4gICAgICAgICAgICAgICAgbGFzdF9jb2x1bW46ICBsYXN0VG9rZW5bMl0ubGFzdF9jb2x1bW5cbiAgICAgICAgICAgIF1cbiAgICAgICAgICAgIHJwYXJlbiA9IEB0b2tlbiAnU1RSSU5HX0VORCcsICcpJ1xuICAgICAgICAgICAgcnBhcmVuWzJdID1cbiAgICAgICAgICAgICAgICBmaXJzdF9saW5lOiAgIGxhc3RUb2tlblsyXS5sYXN0X2xpbmVcbiAgICAgICAgICAgICAgICBmaXJzdF9jb2x1bW46IGxhc3RUb2tlblsyXS5sYXN0X2NvbHVtblxuICAgICAgICAgICAgICAgIGxhc3RfbGluZTogICAgbGFzdFRva2VuWzJdLmxhc3RfbGluZVxuICAgICAgICAgICAgICAgIGxhc3RfY29sdW1uOiAgbGFzdFRva2VuWzJdLmxhc3RfY29sdW1uXG5cbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgICMgUGFpcnMgdXAgYSBjbG9zaW5nIHRva2VuLCBlbnN1cmluZyB0aGF0IGFsbCBsaXN0ZWQgcGFpcnMgb2YgdG9rZW5zIGFyZVxuICAgICMgY29ycmVjdGx5IGJhbGFuY2VkIHRocm91Z2hvdXQgdGhlIGNvdXJzZSBvZiB0aGUgdG9rZW4gc3RyZWFtLlxuICAgIFxuICAgIHBhaXI6ICh0YWcpIC0+XG4gICAgICAgIFsuLi4sIHByZXZdID0gQGVuZHNcbiAgICAgICAgdW5sZXNzIHRhZyBpcyB3YW50ZWQgPSBwcmV2Py50YWdcbiAgICAgICAgICAgIEBlcnJvciBcInVubWF0Y2hlZCAje3RhZ31cIiB1bmxlc3MgJ09VVERFTlQnIGlzIHdhbnRlZFxuICAgICAgICAgICAgIyBBdXRvLWNsb3NlIElOREVOVCB0byBzdXBwb3J0IHN5bnRheCBsaWtlIHRoaXM6XG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjICAgICBlbC5jbGljaygoZXZlbnQpIC0+XG4gICAgICAgICAgICAjICAgICAgICAgZWwuaGlkZSgpKVxuICAgICAgICAgICAgWy4uLiwgbGFzdEluZGVudF0gPSBAaW5kZW50c1xuICAgICAgICAgICAgQG91dGRlbnRUb2tlbiBsYXN0SW5kZW50LCB0cnVlXG4gICAgICAgICAgICByZXR1cm4gQHBhaXIgdGFnXG4gICAgICAgIEBlbmRzLnBvcCgpXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG5cbiAgICAjIFJldHVybnMgdGhlIGxpbmUgYW5kIGNvbHVtbiBudW1iZXIgZnJvbSBhbiBvZmZzZXQgaW50byB0aGUgY3VycmVudCBjaHVuay5cbiAgICAjXG4gICAgIyBgb2Zmc2V0YCBpcyBhIG51bWJlciBvZiBjaGFyYWN0ZXJzIGludG8gQGNodW5rLlxuICAgIFxuICAgIGdldExpbmVBbmRDb2x1bW5Gcm9tQ2h1bms6IChvZmZzZXQpIC0+XG4gICAgICAgIGlmIG9mZnNldCBpcyAwXG4gICAgICAgICAgICByZXR1cm4gW0BjaHVua0xpbmUsIEBjaHVua0NvbHVtbl1cblxuICAgICAgICBpZiBvZmZzZXQgPj0gQGNodW5rLmxlbmd0aFxuICAgICAgICAgICAgc3RyaW5nID0gQGNodW5rXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHN0cmluZyA9IEBjaHVua1suLm9mZnNldC0xXVxuXG4gICAgICAgIGxpbmVDb3VudCA9IGNvdW50IHN0cmluZywgJ1xcbidcblxuICAgICAgICBjb2x1bW4gPSBAY2h1bmtDb2x1bW5cbiAgICAgICAgaWYgbGluZUNvdW50ID4gMFxuICAgICAgICAgICAgWy4uLiwgbGFzdExpbmVdID0gc3RyaW5nLnNwbGl0ICdcXG4nXG4gICAgICAgICAgICBjb2x1bW4gPSBsYXN0TGluZS5sZW5ndGhcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgY29sdW1uICs9IHN0cmluZy5sZW5ndGhcblxuICAgICAgICBbQGNodW5rTGluZSArIGxpbmVDb3VudCwgY29sdW1uXVxuXG4gICAgIyAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAwICAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAwICBcbiAgICAjICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgICMgU2FtZSBhcyBcInRva2VuXCIsIGV4Y2VwdGlvbiB0aGlzIGp1c3QgcmV0dXJucyB0aGUgdG9rZW4gd2l0aG91dCBhZGRpbmcgaXQgdG8gdGhlIHJlc3VsdHMuXG4gICAgXG4gICAgbWFrZVRva2VuOiAodGFnLCB2YWx1ZSwgb2Zmc2V0SW5DaHVuayA9IDAsIGxlbmd0aCA9IHZhbHVlLmxlbmd0aCkgLT5cbiAgICAgICAgbG9jYXRpb25EYXRhID0ge31cbiAgICAgICAgW2xvY2F0aW9uRGF0YS5maXJzdF9saW5lLCBsb2NhdGlvbkRhdGEuZmlyc3RfY29sdW1uXSA9XG4gICAgICAgICAgICBAZ2V0TGluZUFuZENvbHVtbkZyb21DaHVuayBvZmZzZXRJbkNodW5rXG5cbiAgICAgICAgIyBVc2UgbGVuZ3RoIC0gMSBmb3IgdGhlIGZpbmFsIG9mZnNldCAtIHdlJ3JlIHN1cHBseWluZyB0aGUgbGFzdF9saW5lIGFuZCB0aGUgbGFzdF9jb2x1bW4sXG4gICAgICAgICMgc28gaWYgbGFzdF9jb2x1bW4gPT0gZmlyc3RfY29sdW1uLCB0aGVuIHdlJ3JlIGxvb2tpbmcgYXQgYSBjaGFyYWN0ZXIgb2YgbGVuZ3RoIDEuXG4gICAgICAgIGxhc3RDaGFyYWN0ZXIgPSBpZiBsZW5ndGggPiAwIHRoZW4gKGxlbmd0aCAtIDEpIGVsc2UgMFxuICAgICAgICBbbG9jYXRpb25EYXRhLmxhc3RfbGluZSwgbG9jYXRpb25EYXRhLmxhc3RfY29sdW1uXSA9XG4gICAgICAgICAgICBAZ2V0TGluZUFuZENvbHVtbkZyb21DaHVuayBvZmZzZXRJbkNodW5rICsgbGFzdENoYXJhY3RlclxuXG4gICAgICAgIHRva2VuID0gW3RhZywgdmFsdWUsIGxvY2F0aW9uRGF0YV1cblxuICAgICAgICB0b2tlblxuXG4gICAgIyBBZGQgYSB0b2tlbiB0byB0aGUgcmVzdWx0cy5cbiAgICAjIGBvZmZzZXRgIGlzIHRoZSBvZmZzZXQgaW50byB0aGUgY3VycmVudCBAY2h1bmsgd2hlcmUgdGhlIHRva2VuIHN0YXJ0cy5cbiAgICAjIGBsZW5ndGhgIGlzIHRoZSBsZW5ndGggb2YgdGhlIHRva2VuIGluIHRoZSBAY2h1bmssIGFmdGVyIHRoZSBvZmZzZXQuICBcbiAgICAjIElmIG5vdCBzcGVjaWZpZWQsIHRoZSBsZW5ndGggb2YgYHZhbHVlYCB3aWxsIGJlIHVzZWQuIFJldHVybnMgdGhlIG5ldyB0b2tlbi5cbiAgICBcbiAgICB0b2tlbjogKHRhZywgdmFsdWUsIG9mZnNldEluQ2h1bmssIGxlbmd0aCwgb3JpZ2luKSAtPlxuICAgICAgICB0b2tlbiA9IEBtYWtlVG9rZW4gdGFnLCB2YWx1ZSwgb2Zmc2V0SW5DaHVuaywgbGVuZ3RoXG4gICAgICAgIHRva2VuLm9yaWdpbiA9IG9yaWdpbiBpZiBvcmlnaW5cbiAgICAgICAgQHRva2Vucy5wdXNoIHRva2VuXG4gICAgICAgIHRva2VuXG5cbiAgICAjIFBlZWsgYXQgdGhlIGxhc3QgdGFnIGluIHRoZSB0b2tlbiBzdHJlYW0uXG4gICAgdGFnOiAtPlxuICAgICAgICBbLi4uLCB0b2tlbl0gPSBAdG9rZW5zXG4gICAgICAgIHRva2VuP1swXVxuXG4gICAgIyBQZWVrIGF0IHRoZSBsYXN0IHZhbHVlIGluIHRoZSB0b2tlbiBzdHJlYW0uXG4gICAgdmFsdWU6IC0+XG4gICAgICAgIFsuLi4sIHRva2VuXSA9IEB0b2tlbnNcbiAgICAgICAgdG9rZW4/WzFdXG5cbiAgICAjIEFyZSB3ZSBpbiB0aGUgbWlkc3Qgb2YgYW4gdW5maW5pc2hlZCBleHByZXNzaW9uP1xuICAgIHVuZmluaXNoZWQ6IC0+XG4gICAgICAgIExJTkVfQ09OVElOVUVSLnRlc3QoQGNodW5rKSBvclxuICAgICAgICBAdGFnKCkgaW4gVU5GSU5JU0hFRFxuXG4gICAgZm9ybWF0U3RyaW5nOiAoc3RyLCBvcHRpb25zKSAtPlxuICAgICAgICBAcmVwbGFjZVVuaWNvZGVDb2RlUG9pbnRFc2NhcGVzIHN0ci5yZXBsYWNlKFNUUklOR19PTUlULCAnJDEnKSwgb3B0aW9uc1xuXG4gICAgZm9ybWF0SGVyZWdleDogKHN0cikgLT5cbiAgICAgICAgQGZvcm1hdFJlZ2V4IHN0ci5yZXBsYWNlKEhFUkVHRVhfT01JVCwgJyQxJDInKSwgZGVsaW1pdGVyOiAnLy8vJ1xuXG4gICAgZm9ybWF0UmVnZXg6IChzdHIsIG9wdGlvbnMpIC0+XG4gICAgICAgIEByZXBsYWNlVW5pY29kZUNvZGVQb2ludEVzY2FwZXMgc3RyLCBvcHRpb25zXG5cbiAgICB1bmljb2RlQ29kZVBvaW50VG9Vbmljb2RlRXNjYXBlczogKGNvZGVQb2ludCkgLT5cbiAgICAgICAgdG9Vbmljb2RlRXNjYXBlID0gKHZhbCkgLT5cbiAgICAgICAgICAgIHN0ciA9IHZhbC50b1N0cmluZyAxNlxuICAgICAgICAgICAgXCJcXFxcdSN7cmVwZWF0ICcwJywgNCAtIHN0ci5sZW5ndGh9I3tzdHJ9XCJcbiAgICAgICAgcmV0dXJuIHRvVW5pY29kZUVzY2FwZShjb2RlUG9pbnQpIGlmIGNvZGVQb2ludCA8IDB4MTAwMDBcbiAgICAgICAgIyBzdXJyb2dhdGUgcGFpclxuICAgICAgICBoaWdoID0gTWF0aC5mbG9vcigoY29kZVBvaW50IC0gMHgxMDAwMCkgLyAweDQwMCkgKyAweEQ4MDBcbiAgICAgICAgbG93ID0gKGNvZGVQb2ludCAtIDB4MTAwMDApICUgMHg0MDAgKyAweERDMDBcbiAgICAgICAgXCIje3RvVW5pY29kZUVzY2FwZShoaWdoKX0je3RvVW5pY29kZUVzY2FwZShsb3cpfVwiXG5cbiAgICAjIFJlcGxhY2UgXFx1ey4uLn0gd2l0aCBcXHV4eHh4W1xcdXh4eHhdIGluIHN0cmluZ3MgYW5kIHJlZ2V4ZXNcbiAgICByZXBsYWNlVW5pY29kZUNvZGVQb2ludEVzY2FwZXM6IChzdHIsIG9wdGlvbnMpIC0+XG4gICAgICAgIHN0ci5yZXBsYWNlIFVOSUNPREVfQ09ERV9QT0lOVF9FU0NBUEUsIChtYXRjaCwgZXNjYXBlZEJhY2tzbGFzaCwgY29kZVBvaW50SGV4LCBvZmZzZXQpID0+XG4gICAgICAgICAgICByZXR1cm4gZXNjYXBlZEJhY2tzbGFzaCBpZiBlc2NhcGVkQmFja3NsYXNoXG5cbiAgICAgICAgICAgIGNvZGVQb2ludERlY2ltYWwgPSBwYXJzZUludCBjb2RlUG9pbnRIZXgsIDE2XG4gICAgICAgICAgICBpZiBjb2RlUG9pbnREZWNpbWFsID4gMHgxMGZmZmZcbiAgICAgICAgICAgICAgICBAZXJyb3IgXCJ1bmljb2RlIGNvZGUgcG9pbnQgZXNjYXBlcyBncmVhdGVyIHRoYW4gXFxcXHV7MTBmZmZmfSBhcmUgbm90IGFsbG93ZWRcIixcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiBvZmZzZXQgKyBvcHRpb25zLmRlbGltaXRlci5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgbGVuZ3RoOiBjb2RlUG9pbnRIZXgubGVuZ3RoICsgNFxuXG4gICAgICAgICAgICBAdW5pY29kZUNvZGVQb2ludFRvVW5pY29kZUVzY2FwZXMgY29kZVBvaW50RGVjaW1hbFxuXG4gICAgIyBWYWxpZGF0ZXMgZXNjYXBlcyBpbiBzdHJpbmdzIGFuZCByZWdleGVzLlxuICAgIHZhbGlkYXRlRXNjYXBlczogKHN0ciwgb3B0aW9ucyA9IHt9KSAtPlxuICAgICAgICBpbnZhbGlkRXNjYXBlUmVnZXggPVxuICAgICAgICAgICAgaWYgb3B0aW9ucy5pc1JlZ2V4XG4gICAgICAgICAgICAgICAgUkVHRVhfSU5WQUxJRF9FU0NBUEVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBTVFJJTkdfSU5WQUxJRF9FU0NBUEVcbiAgICAgICAgbWF0Y2ggPSBpbnZhbGlkRXNjYXBlUmVnZXguZXhlYyBzdHJcbiAgICAgICAgcmV0dXJuIHVubGVzcyBtYXRjaFxuICAgICAgICBbW10sIGJlZm9yZSwgb2N0YWwsIGhleCwgdW5pY29kZUNvZGVQb2ludCwgdW5pY29kZV0gPSBtYXRjaFxuICAgICAgICBtZXNzYWdlID1cbiAgICAgICAgICAgIGlmIG9jdGFsXG4gICAgICAgICAgICAgICAgXCJvY3RhbCBlc2NhcGUgc2VxdWVuY2VzIGFyZSBub3QgYWxsb3dlZFwiXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgXCJpbnZhbGlkIGVzY2FwZSBzZXF1ZW5jZVwiXG4gICAgICAgIGludmFsaWRFc2NhcGUgPSBcIlxcXFwje29jdGFsIG9yIGhleCBvciB1bmljb2RlQ29kZVBvaW50IG9yIHVuaWNvZGV9XCJcbiAgICAgICAgQGVycm9yIFwiI3ttZXNzYWdlfSAje2ludmFsaWRFc2NhcGV9XCIsXG4gICAgICAgICAgICBvZmZzZXQ6IChvcHRpb25zLm9mZnNldEluQ2h1bmsgPyAwKSArIG1hdGNoLmluZGV4ICsgYmVmb3JlLmxlbmd0aFxuICAgICAgICAgICAgbGVuZ3RoOiBpbnZhbGlkRXNjYXBlLmxlbmd0aFxuXG4gICAgIyBDb25zdHJ1Y3RzIGEgc3RyaW5nIG9yIHJlZ2V4IGJ5IGVzY2FwaW5nIGNlcnRhaW4gY2hhcmFjdGVycy5cbiAgICBtYWtlRGVsaW1pdGVkTGl0ZXJhbDogKGJvZHksIG9wdGlvbnMgPSB7fSkgLT5cbiAgICAgICAgYm9keSA9ICcoPzopJyBpZiBib2R5IGlzICcnIGFuZCBvcHRpb25zLmRlbGltaXRlciBpcyAnLydcbiAgICAgICAgcmVnZXggPSAvLy9cbiAgICAgICAgICAgICAgICAoXFxcXFxcXFwpICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIGVzY2FwZWQgYmFja3NsYXNoXG4gICAgICAgICAgICB8IChcXFxcMCg/PVsxLTddKSkgICAgICAgICAgICAgICAgICAgICAgICMgbnVsIGNoYXJhY3RlciBtaXN0YWtlbiBhcyBvY3RhbCBlc2NhcGVcbiAgICAgICAgICAgIHwgXFxcXD8oI3tvcHRpb25zLmRlbGltaXRlcn0pICAgICAgICAgICAgIyAocG9zc2libHkgZXNjYXBlZCkgZGVsaW1pdGVyXG4gICAgICAgICAgICB8IFxcXFw/KD86IChcXG4pfChcXHIpfChcXHUyMDI4KXwoXFx1MjAyOSkgKSAjIChwb3NzaWJseSBlc2NhcGVkKSBuZXdsaW5lc1xuICAgICAgICAgICAgfCAoXFxcXC4pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIG90aGVyIGVzY2FwZXNcbiAgICAgICAgLy8vZ1xuICAgICAgICBib2R5ID0gYm9keS5yZXBsYWNlIHJlZ2V4LCAobWF0Y2gsIGJhY2tzbGFzaCwgbnVsLCBkZWxpbWl0ZXIsIGxmLCBjciwgbHMsIHBzLCBvdGhlcikgLT4gc3dpdGNoXG4gICAgICAgICAgICAjIElnbm9yZSBlc2NhcGVkIGJhY2tzbGFzaGVzLlxuICAgICAgICAgICAgd2hlbiBiYWNrc2xhc2ggdGhlbiAoaWYgb3B0aW9ucy5kb3VibGUgdGhlbiBiYWNrc2xhc2ggKyBiYWNrc2xhc2ggZWxzZSBiYWNrc2xhc2gpXG4gICAgICAgICAgICB3aGVuIG51bCAgICAgICAgICAgICB0aGVuICdcXFxceDAwJ1xuICAgICAgICAgICAgd2hlbiBkZWxpbWl0ZXIgdGhlbiBcIlxcXFwje2RlbGltaXRlcn1cIlxuICAgICAgICAgICAgd2hlbiBsZiAgICAgICAgICAgICAgdGhlbiAnXFxcXG4nXG4gICAgICAgICAgICB3aGVuIGNyICAgICAgICAgICAgICB0aGVuICdcXFxccidcbiAgICAgICAgICAgIHdoZW4gbHMgICAgICAgICAgICAgIHRoZW4gJ1xcXFx1MjAyOCdcbiAgICAgICAgICAgIHdoZW4gcHMgICAgICAgICAgICAgIHRoZW4gJ1xcXFx1MjAyOSdcbiAgICAgICAgICAgIHdoZW4gb3RoZXIgICAgICAgdGhlbiAoaWYgb3B0aW9ucy5kb3VibGUgdGhlbiBcIlxcXFwje290aGVyfVwiIGVsc2Ugb3RoZXIpXG4gICAgICAgIFwiI3tvcHRpb25zLmRlbGltaXRlcn0je2JvZHl9I3tvcHRpb25zLmRlbGltaXRlcn1cIlxuXG4gICAgIyBUaHJvd3MgYW4gZXJyb3IgYXQgZWl0aGVyIGEgZ2l2ZW4gb2Zmc2V0IGZyb20gdGhlIGN1cnJlbnQgY2h1bmsgb3IgYXQgdGhlIGxvY2F0aW9uIG9mIGEgdG9rZW4gKGB0b2tlblsyXWApLlxuICAgIFxuICAgIGVycm9yOiAobWVzc2FnZSwgb3B0aW9ucyA9IHt9KSAtPlxuICAgICAgICBsb2NhdGlvbiA9XG4gICAgICAgICAgICBpZiAnZmlyc3RfbGluZScgb2Ygb3B0aW9uc1xuICAgICAgICAgICAgICAgIG9wdGlvbnNcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBbZmlyc3RfbGluZSwgZmlyc3RfY29sdW1uXSA9IEBnZXRMaW5lQW5kQ29sdW1uRnJvbUNodW5rIG9wdGlvbnMub2Zmc2V0ID8gMFxuICAgICAgICAgICAgICAgIHtmaXJzdF9saW5lLCBmaXJzdF9jb2x1bW4sIGxhc3RfY29sdW1uOiBmaXJzdF9jb2x1bW4gKyAob3B0aW9ucy5sZW5ndGggPyAxKSAtIDF9XG4gICAgICAgIHRocm93U3ludGF4RXJyb3IgbWVzc2FnZSwgbG9jYXRpb25cblxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuXG5pc1VuYXNzaWduYWJsZSA9IChuYW1lLCBkaXNwbGF5TmFtZSA9IG5hbWUpIC0+IHN3aXRjaFxuICAgIHdoZW4gbmFtZSBpbiBbSlNfS0VZV09SRFMuLi4sIENPRkZFRV9LRVlXT1JEUy4uLl1cbiAgICAgICAgXCJrZXl3b3JkICcje2Rpc3BsYXlOYW1lfScgY2FuJ3QgYmUgYXNzaWduZWRcIlxuICAgIHdoZW4gbmFtZSBpbiBTVFJJQ1RfUFJPU0NSSUJFRFxuICAgICAgICBcIicje2Rpc3BsYXlOYW1lfScgY2FuJ3QgYmUgYXNzaWduZWRcIlxuICAgIHdoZW4gbmFtZSBpbiBSRVNFUlZFRFxuICAgICAgICBcInJlc2VydmVkIHdvcmQgJyN7ZGlzcGxheU5hbWV9JyBjYW4ndCBiZSBhc3NpZ25lZFwiXG4gICAgZWxzZVxuICAgICAgICBmYWxzZVxuXG5leHBvcnRzLmlzVW5hc3NpZ25hYmxlID0gaXNVbmFzc2lnbmFibGVcbmV4cG9ydHMuTGV4ZXIgPSBMZXhlclxuXG4jIGBmcm9tYCBpc27igJl0IGEga29mZmVlIGtleXdvcmQsIFxuIyBidXQgaXQgYmVoYXZlcyBsaWtlIG9uZSBpbiBgaW1wb3J0YCBhbmQgYGV4cG9ydGAgc3RhdGVtZW50cyAoaGFuZGxlZCBhYm92ZSkgYW5kIGluIHRoZSBkZWNsYXJhdGlvbiBsaW5lIG9mIGEgYGZvcmAgbG9vcC5cbiMgVHJ5IHRvIGRldGVjdCB3aGVuIGBmcm9tYCBpcyBhIHZhcmlhYmxlIGlkZW50aWZpZXIgYW5kIHdoZW4gaXQgaXMgdGhpcyDigJxzb21ldGltZXPigJ0ga2V5d29yZC5cblxuaXNGb3JGcm9tID0gKHByZXYpIC0+XG4gICAgaWYgcHJldlswXSBpcyAnSURFTlRJRklFUidcbiAgICAgICAgIyBgZm9yIGkgZnJvbSBmcm9tYCwgYGZvciBmcm9tIGZyb20gaXRlcmFibGVgXG4gICAgICAgIGlmIHByZXZbMV0gaXMgJ2Zyb20nXG4gICAgICAgICAgICBwcmV2WzFdWzBdID0gJ0lERU5USUZJRVInXG4gICAgICAgICAgICB5ZXNcbiAgICAgICAgIyBgZm9yIGkgZnJvbSBpdGVyYWJsZWBcbiAgICAgICAgeWVzXG4gICAgIyBgZm9yIGZyb23igKZgXG4gICAgZWxzZSBpZiBwcmV2WzBdIGlzICdGT1InXG4gICAgICAgIG5vXG4gICAgIyBgZm9yIHtmcm9tfeKApmAsIGBmb3IgW2Zyb21d4oCmYCwgYGZvciB7YSwgZnJvbX3igKZgLCBgZm9yIHthOiBmcm9tfeKApmBcbiAgICBlbHNlIGlmIHByZXZbMV0gaW4gWyd7JywgJ1snLCAnLCcsICc6J11cbiAgICAgICAgbm9cbiAgICBlbHNlXG4gICAgICAgIHllc1xuXG4jIyNcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgIFxuIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4jIyNcblxuIyBLZXl3b3JkcyB0aGF0IEtvZmZlZSBzaGFyZXMgaW4gY29tbW9uIHdpdGggSmF2YVNjcmlwdC5cblxuSlNfS0VZV09SRFMgPSBbXG4gICAgJ3RydWUnLCAnZmFsc2UnLCAnbnVsbCcsICd0aGlzJ1xuICAgICduZXcnLCAnZGVsZXRlJywgJ3R5cGVvZicsICdpbicsICdpbnN0YW5jZW9mJ1xuICAgICdyZXR1cm4nLCAndGhyb3cnLCAnYnJlYWsnLCAnY29udGludWUnLCAnZGVidWdnZXInLCAneWllbGQnXG4gICAgJ2lmJywgJ2Vsc2UnLCAnc3dpdGNoJywgJ2ZvcicsICd3aGlsZScsICdkbycsICd0cnknLCAnY2F0Y2gnLCAnZmluYWxseSdcbiAgICAnY2xhc3MnLCAnZXh0ZW5kcycsICdzdXBlcidcbiAgICAnaW1wb3J0JywgJ2V4cG9ydCcsICdkZWZhdWx0J1xuXVxuXG4jIEtvZmZlZS1vbmx5IGtleXdvcmRzLlxuXG5DT0ZGRUVfS0VZV09SRFMgPSBbXG4gICAgJ3VuZGVmaW5lZCcsICdJbmZpbml0eScsICdOYU4nXG4gICAgJ3RoZW4nLCAndW5sZXNzJywgJ3VudGlsJywgJ2xvb3AnLCAnb2YnLCAnYnknLCAnd2hlbidcbl1cblxuQ09GRkVFX0FMSUFTX01BUCA9XG4gICAgYW5kICA6ICcmJidcbiAgICBvciAgIDogJ3x8J1xuICAgIGlzICAgOiAnPT0nXG4gICAgaXNudCA6ICchPScgIyB1Z2x5ISByZW1vdmUgaW4gY2FzZSBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSB3aXRoIENTMSBpcyBicm9rZW4uIFxuICAgIG5vdCAgOiAnISdcbiAgICB5ZXMgIDogJ3RydWUnXG4gICAgbm8gICA6ICdmYWxzZSdcbiAgICBvbiAgIDogJ3RydWUnXG4gICAgb2ZmICA6ICdmYWxzZSdcblxuQ09GRkVFX0FMSUFTRVMgID0gKGtleSBmb3Iga2V5IG9mIENPRkZFRV9BTElBU19NQVApXG5DT0ZGRUVfS0VZV09SRFMgPSBDT0ZGRUVfS0VZV09SRFMuY29uY2F0IENPRkZFRV9BTElBU0VTXG5cbiMgVGhlIGxpc3Qgb2Yga2V5d29yZHMgdGhhdCBhcmUgcmVzZXJ2ZWQgYnkgSmF2YVNjcmlwdCwgYnV0IG5vdCB1c2VkLCBvciBhcmVcbiMgdXNlZCBieSBLb2ZmZWUgaW50ZXJuYWxseS4gV2UgdGhyb3cgYW4gZXJyb3Igd2hlbiB0aGVzZSBhcmUgZW5jb3VudGVyZWQsXG4jIHRvIGF2b2lkIGhhdmluZyBhIEphdmFTY3JpcHQgZXJyb3IgYXQgcnVudGltZS5cblxuUkVTRVJWRUQgPSBbXG4gICAgJ2Nhc2UnLCAnZnVuY3Rpb24nLCAndmFyJywgJ3ZvaWQnLCAnd2l0aCcsICdjb25zdCcsICdsZXQnLCAnZW51bSdcbiAgICAnbmF0aXZlJywgJ2ltcGxlbWVudHMnLCAnaW50ZXJmYWNlJywgJ3BhY2thZ2UnLCAncHJpdmF0ZSdcbiAgICAncHJvdGVjdGVkJywgJ3B1YmxpYycsICdzdGF0aWMnXG5dXG5cblNUUklDVF9QUk9TQ1JJQkVEID0gWydhcmd1bWVudHMnLCAnZXZhbCddXG5cbiMgVGhlIHN1cGVyc2V0IG9mIGJvdGggSmF2YVNjcmlwdCBrZXl3b3JkcyBhbmQgcmVzZXJ2ZWQgd29yZHMsIG5vbmUgb2Ygd2hpY2ggbWF5XG4jIGJlIHVzZWQgYXMgaWRlbnRpZmllcnMgb3IgcHJvcGVydGllcy5cblxuZXhwb3J0cy5KU19GT1JCSURERU4gPSBKU19LRVlXT1JEUy5jb25jYXQoUkVTRVJWRUQpLmNvbmNhdChTVFJJQ1RfUFJPU0NSSUJFRClcblxuQk9NID0gNjUyNzkgIyBUaGUgY2hhcmFjdGVyIGNvZGUgb2YgdGhlIG5hc3R5IE1pY3Jvc29mdCBtYWRuZXNzIG90aGVyd2lzZSBrbm93biBhcyB0aGUgQk9NLlxuXG4jIFRva2VuIG1hdGNoaW5nIHJlZ2V4ZXMuXG5cbklERU5USUZJRVIgPSAvLy8gXlxuICAgICg/IVxcZClcbiAgICAoICg/OiAoPyFcXHMpWyRcXHdcXHg3Zi1cXHVmZmZmXSApKyApXG4gICAgKCBbXlxcblxcU10qIDogKD8hOikgKT8gICAgIyBJcyB0aGlzIGEgcHJvcGVydHkgbmFtZT9cbi8vL1xuXG5OVU1CRVIgPSAvLy9cbiAgICBeIDBiWzAxXSsgICAgfCAgICAgICAgICAgICAgIyBiaW5hcnlcbiAgICBeIDBvWzAtN10rICAgfCAgICAgICAgICAgICAgIyBvY3RhbFxuICAgIF4gMHhbXFxkYS1mXSsgfCAgICAgICAgICAgICAgIyBoZXhcbiAgICBeIFxcZCpcXC4/XFxkKyAoPzplWystXT9cXGQrKT8gICMgZGVjaW1hbFxuLy8vaVxuXG5PUEVSQVRPUiA9IC8vLyBeIChcbiAgICA/OiBbLT1dPiAgICAgICAgICAgICAjIGZ1bmN0aW9uXG4gICAgIHwgWy0rKi8lPD4mfF4hPz1dPSAgIyBjb21wb3VuZCBhc3NpZ24gLyBjb21wYXJlXG4gICAgIHwgPj4+PT8gICAgICAgICAgICAgIyB6ZXJvLWZpbGwgcmlnaHQgc2hpZnRcbiAgICAgfCAoWy0rOl0pXFwxICAgICAgICAgIyBkb3VibGVzXG4gICAgIHwgKFsmfDw+Ki8lXSlcXDI9PyAgICMgbG9naWMgLyBzaGlmdCAvIHBvd2VyIC8gZmxvb3IgZGl2aXNpb24gLyBtb2R1bG9cbiAgICAgfCBcXD8oXFwufDo6KSAgICAgICAgICMgc29hayBhY2Nlc3NcbiAgICAgfCBcXC57MiwzfSAgICAgICAgICAgIyByYW5nZSBvciBzcGxhdFxuKSAvLy9cblxuV0hJVEVTUEFDRSA9IC9eW15cXG5cXFNdKy9cblxuIyBDT01NRU5UICAgID0gL14jIyMoW14jXVtcXHNcXFNdKj8pKD86IyMjW15cXG5cXFNdKnwjIyMkKXxeKD86XFxzKiMoPyEjI1teI10pLiopKy8gIyBtb3ZlZCB0byBlbmRcblxuQ09ERSAgICAgICA9IC9eWy09XT4vXG5cbk1VTFRJX0RFTlQgPSAvXig/OlxcblteXFxuXFxTXSopKy9cblxuSlNUT0tFTiAgICAgID0gLy8vXiBgKD8hYGApICgoPzogW15gXFxcXF0gfCBcXFxcW1xcc1xcU10gICAgICAgICAgICAgICAgICAgKSopIGAgICAvLy9cbkhFUkVfSlNUT0tFTiA9IC8vL14gYGBgICAgICAgICAgKCg/OiBbXmBcXFxcXSB8IFxcXFxbXFxzXFxTXSB8IGAoPyFgYCkgKSopIGBgYCAvLy9cblxuIyBTdHJpbmctbWF0Y2hpbmctcmVnZXhlcy5cblxuU1RSSU5HX1NUQVJUICAgPSAvXig/OicnJ3xcIlwiXCJ8J3xcIikvXG5cblNUUklOR19TSU5HTEUgID0gLy8vIF4oPzogW15cXFxcJ10gIHwgXFxcXFtcXHNcXFNdICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSogLy8vXG5TVFJJTkdfRE9VQkxFICA9IC8vLyBeKD86IFteXFxcXFwiI10gfCBcXFxcW1xcc1xcU10gfCAgICAgICAgICAgICAgICAgICAgIFxcIyg/IVxceykgKSogLy8vXG5IRVJFRE9DX1NJTkdMRSA9IC8vLyBeKD86IFteXFxcXCddICAgIHwgXFxcXFtcXHNcXFNdIHwgJyg/IScnKSAgICAgICAgICAgICAgICAgICAgICAgICkqIC8vL1xuSEVSRURPQ19ET1VCTEUgPSAvLy8gXig/OiBbXlxcXFxcIiNdIHwgXFxcXFtcXHNcXFNdIHwgXCIoPyFcIlwiKSB8IFxcIyg/IVxceykgKSogLy8vXG5cblNUUklOR19PTUlUICAgID0gLy8vXG4gICAgICAgICgoPzpcXFxcXFxcXCkrKSAgICAgICMgY29uc3VtZSAoYW5kIHByZXNlcnZlKSBhbiBldmVuIG51bWJlciBvZiBiYWNrc2xhc2hlc1xuICAgIHwgXFxcXFteXFxTXFxuXSpcXG5cXHMqICAgICMgcmVtb3ZlIGVzY2FwZWQgbmV3bGluZXNcbi8vL2dcblNJTVBMRV9TVFJJTkdfT01JVCA9IC9cXHMqXFxuXFxzKi9nXG5IRVJFRE9DX0lOREVOVCAgICAgICA9IC9cXG4rKFteXFxuXFxTXSopKD89XFxTKS9nXG5cbiMgUmVnZXgtbWF0Y2hpbmctcmVnZXhlcy5cblJFR0VYID0gLy8vIF5cbiAgICAvICg/IS8pICgoXG4gICAgPzogW14gWyAvIFxcbiBcXFxcIF0gICAgIyBldmVyeSBvdGhlciB0aGluZ1xuICAgICB8IFxcXFxbXlxcbl0gICAgICAgICAgICMgYW55dGhpbmcgYnV0IG5ld2xpbmVzIGVzY2FwZWRcbiAgICAgfCBcXFsgICAgICAgICAgICAgICAgIyBjaGFyYWN0ZXIgY2xhc3NcbiAgICAgICAgICAgICAoPzogXFxcXFteXFxuXSB8IFteIFxcXSBcXG4gXFxcXCBdICkqXG4gICAgICAgICBcXF1cbiAgICApKikgKC8pP1xuLy8vXG5cblJFR0VYX0ZMQUdTICA9IC9eXFx3Ki9cblZBTElEX0ZMQUdTICA9IC9eKD8hLiooLikuKlxcMSlbaW1ndXldKiQvXG5cbkhFUkVHRVggICAgICA9IC8vLyBeKD86IFteXFxcXC8jXSB8IFxcXFxbXFxzXFxTXSB8IC8oPyEvLykgfCBcXCMoPyFcXHspICkqIC8vL1xuXG5IRVJFR0VYX09NSVQgPSAvLy9cbiAgICAgICAgKCg/OlxcXFxcXFxcKSspICAgICAgICAgIyBjb25zdW1lIChhbmQgcHJlc2VydmUpIGFuIGV2ZW4gbnVtYmVyIG9mIGJhY2tzbGFzaGVzXG4gICAgfCBcXFxcKFxccykgICAgICAgICAgICAgICAgIyBwcmVzZXJ2ZSBlc2NhcGVkIHdoaXRlc3BhY2VcbiAgICB8IFxccysoPzojLiopPyAgICAgICAgICAgIyByZW1vdmUgd2hpdGVzcGFjZSBhbmQgY29tbWVudHNcbi8vL2dcblxuUkVHRVhfSUxMRUdBTCA9IC8vLyBeICggLyB8IC97M31cXHMqKSAoXFwqKSAvLy9cblxuUE9TU0lCTFlfRElWSVNJT04gPSAvLy8gXiAvPT9cXHMgLy8vXG5cbiMgT3RoZXIgcmVnZXhlcy5cblxuSEVSRUNPTU1FTlRfSUxMRUdBTCA9IC9cXCpcXC8vXG5cbkxJTkVfQ09OVElOVUVSICAgICAgICAgID0gLy8vIF4gXFxzKiAoPzogLCB8IFxcPz9cXC4oPyFbLlxcZF0pIHwgOjogKSAvLy9cblxuU1RSSU5HX0lOVkFMSURfRVNDQVBFID0gLy8vXG4gICAgKCAoPzpefFteXFxcXF0pICg/OlxcXFxcXFxcKSogKSAgICAgICAgICAgICAgICAjIG1ha2Ugc3VyZSB0aGUgZXNjYXBlIGlzbuKAmXQgZXNjYXBlZFxuICAgIFxcXFwgKFxuICAgICAgICAgPzogKDBbMC03XXxbMS03XSkgICAgICAgICAgICAgICAgICAgICAgICMgb2N0YWwgZXNjYXBlXG4gICAgICAgICAgICB8ICh4KD8hW1xcZGEtZkEtRl17Mn0pLnswLDJ9KSAjIGhleCBlc2NhcGVcbiAgICAgICAgICAgIHwgKHVcXHsoPyFbXFxkYS1mQS1GXXsxLH1cXH0pW159XSpcXH0/KSAjIHVuaWNvZGUgY29kZSBwb2ludCBlc2NhcGVcbiAgICAgICAgICAgIHwgKHUoPyFcXHt8W1xcZGEtZkEtRl17NH0pLnswLDR9KSAjIHVuaWNvZGUgZXNjYXBlXG4gICAgKVxuLy8vXG5SRUdFWF9JTlZBTElEX0VTQ0FQRSA9IC8vL1xuICAgICggKD86XnxbXlxcXFxdKSAoPzpcXFxcXFxcXCkqICkgICAgICAgICAgICAgICAgIyBtYWtlIHN1cmUgdGhlIGVzY2FwZSBpc27igJl0IGVzY2FwZWRcbiAgICBcXFxcIChcbiAgICAgICAgID86ICgwWzAtN10pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgb2N0YWwgZXNjYXBlXG4gICAgICAgICAgICB8ICh4KD8hW1xcZGEtZkEtRl17Mn0pLnswLDJ9KSAjIGhleCBlc2NhcGVcbiAgICAgICAgICAgIHwgKHVcXHsoPyFbXFxkYS1mQS1GXXsxLH1cXH0pW159XSpcXH0/KSAjIHVuaWNvZGUgY29kZSBwb2ludCBlc2NhcGVcbiAgICAgICAgICAgIHwgKHUoPyFcXHt8W1xcZGEtZkEtRl17NH0pLnswLDR9KSAjIHVuaWNvZGUgZXNjYXBlXG4gICAgKVxuLy8vXG5cblVOSUNPREVfQ09ERV9QT0lOVF9FU0NBUEUgPSAvLy9cbiAgICAoIFxcXFxcXFxcICkgICAgICAgICAgICAgICAgIyBtYWtlIHN1cmUgdGhlIGVzY2FwZSBpc27igJl0IGVzY2FwZWRcbiAgICB8XG4gICAgXFxcXHVcXHsgKCBbXFxkYS1mQS1GXSsgKSBcXH1cbi8vL2dcblxuTEVBRElOR19CTEFOS19MSU5FICA9IC9eW15cXG5cXFNdKlxcbi9cblRSQUlMSU5HX0JMQU5LX0xJTkUgPSAvXFxuW15cXG5cXFNdKiQvXG5cblRSQUlMSU5HX1NQQUNFUyAgICAgPSAvXFxzKyQvXG5cbiMgQ29tcG91bmQgYXNzaWdubWVudCB0b2tlbnMuXG5DT01QT1VORF9BU1NJR04gPSBbXG4gICAgJy09JywgJys9JywgJy89JywgJyo9JywgJyU9JywgJ3x8PScsICcmJj0nLCAnPz0nLCAnPDw9JywgJz4+PScsICc+Pj49J1xuICAgICcmPScsICdePScsICd8PScsICcqKj0nLCAnLy89JywgJyUlPSdcbl1cblxuVU5BUlkgPSBbJ05FVycsICdUWVBFT0YnLCAnREVMRVRFJywgJ0RPJ11cblxuVU5BUllfTUFUSCA9IFsnIScsICd+J11cblxuU0hJRlQgPSBbJzw8JywgJz4+JywgJz4+PiddXG5cbkNPTVBBUkUgPSBbJz09JywgJyE9JywgJzwnLCAnPicsICc8PScsICc+PSddXG5cbk1BVEggPSBbJyonLCAnLycsICclJywgJy8vJywgJyUlJ11cblxuUkVMQVRJT04gPSBbJ0lOJywgJ09GJywgJ0lOU1RBTkNFT0YnXSAjIFJlbGF0aW9uYWwgdG9rZW5zIHRoYXQgYXJlIG5lZ2F0YWJsZSB3aXRoIGBub3RgIHByZWZpeC5cblxuQk9PTCA9IFsnVFJVRScsICdGQUxTRSddXG5cbiMgVG9rZW5zIHdoaWNoIGNvdWxkIGxlZ2l0aW1hdGVseSBiZSBpbnZva2VkIG9yIGluZGV4ZWQuIEFuIG9wZW5pbmdcbiMgcGFyZW50aGVzZXMgb3IgYnJhY2tldCBmb2xsb3dpbmcgdGhlc2UgdG9rZW5zIHdpbGwgYmUgcmVjb3JkZWQgYXMgdGhlIHN0YXJ0XG4jIG9mIGEgZnVuY3Rpb24gaW52b2NhdGlvbiBvciBpbmRleGluZyBvcGVyYXRpb24uXG5cbkNBTExBQkxFICA9IFsnSURFTlRJRklFUicsICdQUk9QRVJUWScsICcpJywgJ10nLCAnPycsICdAJywgJ1RISVMnLCAnU1VQRVInXVxuSU5ERVhBQkxFID0gQ0FMTEFCTEUuY29uY2F0IFtcbiAgICAnTlVNQkVSJywgJ0lORklOSVRZJywgJ05BTicsICdTVFJJTkcnLCAnU1RSSU5HX0VORCcsICdSRUdFWCcsICdSRUdFWF9FTkQnXG4gICAgJ0JPT0wnLCAnTlVMTCcsICdVTkRFRklORUQnLCAnfScsICc6Oidcbl1cblxuIyBUb2tlbnMgd2hpY2ggYSByZWd1bGFyIGV4cHJlc3Npb24gd2lsbCBuZXZlciBpbW1lZGlhdGVseSBmb2xsb3cgKGV4Y2VwdCBzcGFjZWRcbiMgQ0FMTEFCTEVzIGluIHNvbWUgY2FzZXMpLCBidXQgd2hpY2ggYSBkaXZpc2lvbiBvcGVyYXRvciBjYW4uXG4jXG4jIFNlZTogaHR0cDovL3d3dy1hcmNoaXZlLm1vemlsbGEub3JnL2pzL2xhbmd1YWdlL2pzMjAtMjAwMi0wNC9yYXRpb25hbGUvc3ludGF4Lmh0bWwjcmVndWxhci1leHByZXNzaW9uc1xuXG5OT1RfUkVHRVggPSBJTkRFWEFCTEUuY29uY2F0IFsnKysnLCAnLS0nXVxuXG4jIFRva2VucyB0aGF0LCB3aGVuIGltbWVkaWF0ZWx5IHByZWNlZGluZyBhIGBXSEVOYCwgaW5kaWNhdGUgdGhhdCB0aGUgYFdIRU5gXG4jIG9jY3VycyBhdCB0aGUgc3RhcnQgb2YgYSBsaW5lLiBXZSBkaXNhbWJpZ3VhdGUgdGhlc2UgZnJvbSB0cmFpbGluZyB3aGVucyB0b1xuIyBhdm9pZCBhbiBhbWJpZ3VpdHkgaW4gdGhlIGdyYW1tYXIuXG5cbkxJTkVfQlJFQUsgPSBbJ0lOREVOVCcsICdPVVRERU5UJywgJ1RFUk1JTkFUT1InXVxuXG4jIEFkZGl0aW9uYWwgaW5kZW50IGluIGZyb250IG9mIHRoZXNlIGlzIGlnbm9yZWQuXG5cbklOREVOVEFCTEVfQ0xPU0VSUyA9IFsnKScsICd9JywgJ10nXVxuXG4jIFRva2VucyB0aGF0LCB3aGVuIGFwcGVhcmluZyBhdCB0aGUgZW5kIG9mIGEgbGluZSwgc3VwcHJlc3MgYSBmb2xsb3dpbmcgVEVSTUlOQVRPUi9JTkRFTlQgdG9rZW5cblxuVU5GSU5JU0hFRCA9IFsnXFxcXCcsICcuJywgJz8uJywgJz86OicsICdVTkFSWScsICdNQVRIJywgJ1VOQVJZX01BVEgnLCAnKycsICctJyxcbiAgICAgICAgICAgICAgJyoqJywgJ1NISUZUJywgJ1JFTEFUSU9OJywgJ0NPTVBBUkUnLCAnJicsICdeJywgJ3wnLCAnJiYnLCAnfHwnLFxuICAgICAgICAgICAgICAnQklOPycsICdUSFJPVycsICdFWFRFTkRTJ11cbiAgICAgICAgICAgICAgXG5DT01NRU5UICAgID0gL14jIyMoW14jXVtcXHNcXFNdKj8pKD86IyMjW15cXG5cXFNdKnwjIyMkKXxeKD86XFxzKiMoPyEjI1teI10pLiopKy8gICAgICAgICAgICAgIFxuIl19
//# sourceURL=../src/lexer.coffee