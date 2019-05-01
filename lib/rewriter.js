
/*
00000000   00000000  000   000  00000000   000  000000000  00000000  00000000   
000   000  000       000 0 000  000   000  000     000     000       000   000  
0000000    0000000   000000000  0000000    000     000     0000000   0000000    
000   000  000       000   000  000   000  000     000     000       000   000  
000   000  00000000  00     00  000   000  000     000     00000000  000   000
 */
var BALANCED_PAIRS, CALL_CLOSERS, EXPRESSION_CLOSE, EXPRESSION_END, EXPRESSION_START, IMPLICIT_CALL, IMPLICIT_END, IMPLICIT_FUNC, IMPLICIT_UNSPACED_CALL, INVERSES, LINEBREAKS, Rewriter, SINGLE_CLOSERS, SINGLE_LINERS, k, left, len, log, ref, rite,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  slice = [].slice;

log = console.log;

Rewriter = (function() {
  function Rewriter() {}

  Rewriter.prototype.rewrite = function(tokens1) {
    this.tokens = tokens1;
    this.removeLeadingNewlines();
    this.constructorShortcut();
    this.closeOpenCalls();
    this.closeOpenIndexes();
    this.normalizeLines();
    this.tagPostfixConditionals();
    this.addImplicitBracesAndParens();
    this.configParameters();
    this.negativeIndex();
    this.addLocationDataToGeneratedTokens();
    this.fixOutdentLocationData();
    return this.tokens;
  };

  Rewriter.prototype.scanTokens = function(block) {
    var i, token, tokens;
    tokens = this.tokens;
    i = 0;
    while (token = tokens[i]) {
      i += block.call(this, token, i, tokens);
    }
    return true;
  };

  Rewriter.prototype.detectEnd = function(i, condition, action) {
    var levels, ref, ref1, token, tokens;
    tokens = this.tokens;
    levels = 0;
    while (token = tokens[i]) {
      if (levels === 0 && condition.call(this, token, i)) {
        return action.call(this, token, i);
      }
      if (!token || levels < 0) {
        return action.call(this, token, i - 1);
      }
      if (ref = token[0], indexOf.call(EXPRESSION_START, ref) >= 0) {
        levels += 1;
      } else if (ref1 = token[0], indexOf.call(EXPRESSION_END, ref1) >= 0) {
        levels -= 1;
      }
      i += 1;
    }
    return i - 1;
  };

  Rewriter.prototype.removeLeadingNewlines = function() {
    var i, k, len, ref, tag;
    ref = this.tokens;
    for (i = k = 0, len = ref.length; k < len; i = ++k) {
      tag = ref[i][0];
      if (tag !== 'TERMINATOR') {
        break;
      }
    }
    if (i) {
      return this.tokens.splice(0, i);
    }
  };

  Rewriter.prototype.check = function() {
    var index, j, k, l, ref;
    l = arguments;
    for (j = k = 0, ref = l.length; k < ref; j = k += 2) {
      index = l[j];
      if (index < 0) {
        return false;
      }
      if (this.tag(index) !== l[j + 1]) {
        return false;
      }
    }
    return true;
  };

  Rewriter.prototype.constructorShortcut = function() {
    return this.scanTokens(function(token, i, tokens) {
      var ref;
      if (i > 0 && tokens[i - 1][0] === '@' && tokens[i][0] === ':' && ((ref = tokens[i + 1][0]) === '->' || ref === 'PARAM_START')) {
        tokens[i - 1][0] = 'PROPERTY';
        tokens[i - 1][1] = 'constructor';
      }
      return 1;
    });
  };

  Rewriter.prototype.negativeIndex = function() {
    return this.scanTokens(function(token, i, tokens) {
      var generate, ref, ref1, ref2;
      generate = Rewriter.generate;
      if (this.check(i - 1, 'INDEX_START', i, '-', i + 1, 'NUMBER', i + 2, 'INDEX_END')) {
        if ((ref = this.tag(i - 2)) === 'IDENTIFIER' || ref === 'STRING') {
          tokens.splice(i, 0, generate(tokens[i - 2][0], tokens[i - 2][1], token), generate('.', '.', token), generate('PROPERTY', 'length', token));
          return 5;
        }
        if ((ref1 = this.tag(i - 2)) === 'STRING_END' || ref1 === ']' || ref1 === ')') {
          tokens.splice(i + 2, 0, generate('..', '..', token), generate(tokens[i][0], tokens[i][1], token), generate(tokens[i + 1][0], tokens[i + 1][1], token));
          if ((ref2 = this.tag(i - 2)) === ']' || ref2 === ')') {
            tokens.splice(i + 6, 0, generate('INDEX_START', '[', token), generate('NUMBER', '0', token), generate('INDEX_END', ']', token));
            return 7;
          }
          return 4;
        } else {
          log(this.tag(i - 2));
        }
      }
      return 1;
    });
  };

  Rewriter.prototype.closeOpenCalls = function() {
    var action, condition;
    condition = function(token, i) {
      var ref;
      return ((ref = token[0]) === ')' || ref === 'CALL_END') || token[0] === 'OUTDENT' && this.tag(i - 1) === ')';
    };
    action = function(token, i) {
      return this.tokens[token[0] === 'OUTDENT' ? i - 1 : i][0] = 'CALL_END';
    };
    return this.scanTokens(function(token, i) {
      if (token[0] === 'CALL_START') {
        this.detectEnd(i + 1, condition, action);
      }
      return 1;
    });
  };

  Rewriter.prototype.closeOpenIndexes = function() {
    var action, condition;
    condition = function(token, i) {
      var ref;
      return (ref = token[0]) === ']' || ref === 'INDEX_END';
    };
    action = function(token, i) {
      return token[0] = 'INDEX_END';
    };
    return this.scanTokens(function(token, i) {
      if (token[0] === 'INDEX_START') {
        this.detectEnd(i + 1, condition, action);
      }
      return 1;
    });
  };

  Rewriter.prototype.indexOfTag = function() {
    var fuzz, i, j, k, pattern, ref, ref1;
    i = arguments[0], pattern = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    fuzz = 0;
    for (j = k = 0, ref = pattern.length; 0 <= ref ? k < ref : k > ref; j = 0 <= ref ? ++k : --k) {
      while (this.tag(i + j + fuzz) === 'HERECOMMENT') {
        fuzz += 2;
      }
      if (pattern[j] == null) {
        continue;
      }
      if (typeof pattern[j] === 'string') {
        pattern[j] = [pattern[j]];
      }
      if (ref1 = this.tag(i + j + fuzz), indexOf.call(pattern[j], ref1) < 0) {
        return -1;
      }
    }
    return i + j + fuzz - 1;
  };

  Rewriter.prototype.looksObjectish = function(j) {
    var end, index;
    if (this.indexOfTag(j, '@', null, ':') > -1 || this.indexOfTag(j, null, ':') > -1) {
      return true;
    }
    index = this.indexOfTag(j, EXPRESSION_START);
    if (index > -1) {
      end = null;
      this.detectEnd(index + 1, (function(token) {
        var ref;
        return ref = token[0], indexOf.call(EXPRESSION_END, ref) >= 0;
      }), (function(token, i) {
        return end = i;
      }));
      if (this.tag(end + 1) === ':') {
        return true;
      }
    }
    return false;
  };

  Rewriter.prototype.findTagsBackwards = function(i, tags) {
    var backStack, ref, ref1, ref2, ref3, ref4, ref5;
    backStack = [];
    while (i >= 0 && (backStack.length || (ref2 = this.tag(i), indexOf.call(tags, ref2) < 0) && ((ref3 = this.tag(i), indexOf.call(EXPRESSION_START, ref3) < 0) || this.tokens[i].generated) && (ref4 = this.tag(i), indexOf.call(LINEBREAKS, ref4) < 0))) {
      if (ref = this.tag(i), indexOf.call(EXPRESSION_END, ref) >= 0) {
        backStack.push(this.tag(i));
      }
      if ((ref1 = this.tag(i), indexOf.call(EXPRESSION_START, ref1) >= 0) && backStack.length) {
        backStack.pop();
      }
      i -= 1;
    }
    return ref5 = this.tag(i), indexOf.call(tags, ref5) >= 0;
  };

  Rewriter.prototype.addImplicitBracesAndParens = function() {
    var stack, start;
    stack = [];
    start = null;
    return this.scanTokens(function(token, i, tokens) {
      var endImplicitCall, endImplicitObject, forward, generate, inImplicit, inImplicitCall, inImplicitControl, inImplicitObject, isImplicit, isImplicitCall, isImplicitObject, k, newLine, nextTag, offset, prevTag, prevToken, ref, ref1, ref2, ref3, ref4, ref5, s, sameLine, stackIdx, stackItem, stackTag, stackTop, startIdx, startImplicitCall, startImplicitObject, startsLine, tag;
      tag = token[0];
      prevTag = (prevToken = i > 0 ? tokens[i - 1] : [])[0];
      nextTag = (i < tokens.length - 1 ? tokens[i + 1] : [])[0];
      stackTop = function() {
        return stack[stack.length - 1];
      };
      startIdx = i;
      generate = Rewriter.generate;
      forward = function(n) {
        return i - startIdx + n;
      };
      isImplicit = function(stackItem) {
        var ref;
        return stackItem != null ? (ref = stackItem[2]) != null ? ref.ours : void 0 : void 0;
      };
      isImplicitObject = function(stackItem) {
        return isImplicit(stackItem) && (stackItem != null ? stackItem[0] : void 0) === '{';
      };
      isImplicitCall = function(stackItem) {
        return isImplicit(stackItem) && (stackItem != null ? stackItem[0] : void 0) === '(';
      };
      inImplicit = function() {
        return isImplicit(stackTop());
      };
      inImplicitCall = function() {
        return isImplicitCall(stackTop());
      };
      inImplicitObject = function() {
        return isImplicitObject(stackTop());
      };
      inImplicitControl = function() {
        var ref;
        return inImplicit && ((ref = stackTop()) != null ? ref[0] : void 0) === 'CONTROL';
      };
      startImplicitCall = function(j) {
        var idx;
        idx = j != null ? j : i;
        stack.push([
          '(', idx, {
            ours: true
          }
        ]);
        tokens.splice(idx, 0, generate('CALL_START', '(', ['', 'implicit function call', token[2]]));
        if (j == null) {
          return i += 1;
        }
      };
      endImplicitCall = function() {
        stack.pop();
        tokens.splice(i, 0, generate('CALL_END', ')', ['', 'end of input', token[2]]));
        return i += 1;
      };
      startImplicitObject = function(j, startsLine) {
        var idx, val;
        if (startsLine == null) {
          startsLine = true;
        }
        idx = j != null ? j : i;
        stack.push([
          '{', idx, {
            sameLine: true,
            startsLine: startsLine,
            ours: true
          }
        ]);
        val = new String('{');
        val.generated = true;
        tokens.splice(idx, 0, generate('{', val, token));
        if (j == null) {
          return i += 1;
        }
      };
      endImplicitObject = function(j) {
        j = j != null ? j : i;
        stack.pop();
        tokens.splice(j, 0, generate('}', '}', token));
        return i += 1;
      };
      if (inImplicitCall() && (tag === 'IF' || tag === 'TRY' || tag === 'FINALLY' || tag === 'CATCH' || tag === 'CLASS' || tag === 'SWITCH')) {
        stack.push([
          'CONTROL', i, {
            ours: true
          }
        ]);
        return forward(1);
      }
      if (tag === 'INDENT' && inImplicit()) {
        if (prevTag !== '=>' && prevTag !== '->' && prevTag !== '[' && prevTag !== '(' && prevTag !== ',' && prevTag !== '{' && prevTag !== 'TRY' && prevTag !== 'ELSE' && prevTag !== '=') {
          while (inImplicitCall()) {
            endImplicitCall();
          }
        }
        if (inImplicitControl()) {
          stack.pop();
        }
        stack.push([tag, i]);
        return forward(1);
      }
      if (indexOf.call(EXPRESSION_START, tag) >= 0) {
        stack.push([tag, i]);
        return forward(1);
      }
      if (indexOf.call(EXPRESSION_END, tag) >= 0) {
        while (inImplicit()) {
          if (inImplicitCall()) {
            endImplicitCall();
          } else if (inImplicitObject()) {
            endImplicitObject();
          } else {
            stack.pop();
          }
        }
        start = stack.pop();
      }
      if ((indexOf.call(IMPLICIT_FUNC, tag) >= 0 && token.spaced || tag === '?' && i > 0 && !tokens[i - 1].spaced) && (indexOf.call(IMPLICIT_CALL, nextTag) >= 0 || indexOf.call(IMPLICIT_UNSPACED_CALL, nextTag) >= 0 && !((ref = tokens[i + 1]) != null ? ref.spaced : void 0) && !((ref1 = tokens[i + 1]) != null ? ref1.newLine : void 0))) {
        if (tag === '?') {
          tag = token[0] = 'FUNC_EXIST';
        }
        startImplicitCall(i + 1);
        return forward(2);
      }
      if (indexOf.call(IMPLICIT_FUNC, tag) >= 0 && this.indexOfTag(i + 1, 'INDENT') > -1 && this.looksObjectish(i + 2) && !this.findTagsBackwards(i, ['CLASS', 'EXTENDS', 'IF', 'CATCH', 'SWITCH', 'LEADING_WHEN', 'FOR', 'WHILE', 'UNTIL'])) {
        startImplicitCall(i + 1);
        stack.push(['INDENT', i + 2]);
        return forward(3);
      }
      if (tag === ':') {
        s = (function() {
          var ref2;
          switch (false) {
            case ref2 = this.tag(i - 1), indexOf.call(EXPRESSION_END, ref2) < 0:
              return start[1];
            case this.tag(i - 2) !== '@':
              return i - 2;
            default:
              return i - 1;
          }
        }).call(this);
        while (this.tag(s - 2) === 'HERECOMMENT') {
          s -= 2;
        }
        this.insideForDeclaration = nextTag === 'FOR';
        startsLine = s === 0 || (ref2 = this.tag(s - 1), indexOf.call(LINEBREAKS, ref2) >= 0) || tokens[s - 1].newLine;
        if (stackTop()) {
          ref3 = stackTop(), stackTag = ref3[0], stackIdx = ref3[1];
          if ((stackTag === '{' || stackTag === 'INDENT' && this.tag(stackIdx - 1) === '{') && (startsLine || this.tag(s - 1) === ',' || this.tag(s - 1) === '{')) {
            return forward(1);
          }
        }
        startImplicitObject(s, !!startsLine);
        return forward(2);
      }
      if (indexOf.call(LINEBREAKS, tag) >= 0) {
        for (k = stack.length - 1; k >= 0; k += -1) {
          stackItem = stack[k];
          if (!isImplicit(stackItem)) {
            break;
          }
          if (isImplicitObject(stackItem)) {
            stackItem[2].sameLine = false;
          }
        }
      }
      newLine = prevTag === 'OUTDENT' || prevToken.newLine;
      if (indexOf.call(IMPLICIT_END, tag) >= 0 || indexOf.call(CALL_CLOSERS, tag) >= 0 && newLine) {
        while (inImplicit()) {
          ref4 = stackTop(), stackTag = ref4[0], stackIdx = ref4[1], (ref5 = ref4[2], sameLine = ref5.sameLine, startsLine = ref5.startsLine);
          if (inImplicitCall() && prevTag !== ',') {
            endImplicitCall();
          } else if (inImplicitObject() && !this.insideForDeclaration && sameLine && tag !== 'TERMINATOR' && prevTag !== ':') {
            endImplicitObject();
          } else if (inImplicitObject() && tag === 'TERMINATOR' && prevTag !== ',' && !(startsLine && this.looksObjectish(i + 1))) {
            if (nextTag === 'HERECOMMENT') {
              return forward(1);
            }
            endImplicitObject();
          } else {
            break;
          }
        }
      }
      if (tag === ',' && !this.looksObjectish(i + 1) && inImplicitObject() && !this.insideForDeclaration && (nextTag !== 'TERMINATOR' || !this.looksObjectish(i + 2))) {
        offset = nextTag === 'OUTDENT' ? 1 : 0;
        while (inImplicitObject()) {
          endImplicitObject(i + offset);
        }
      }
      return forward(1);
    });
  };

  Rewriter.prototype.configParameters = function() {
    var dictParamEnd, dictParamStart, generate, isInside, stackCount;
    generate = Rewriter.generate;
    dictParamStart = 0;
    dictParamEnd = 0;
    stackCount = 0;
    isInside = function() {
      return dictParamStart && !stackCount;
    };
    return this.scanTokens(function(token, i, tokens) {
      var nextTag, prevTag, prevToken, tag, thisToken, val;
      tag = token[0];
      prevTag = (prevToken = i > 0 ? tokens[i - 1] : [])[0];
      nextTag = (i < tokens.length - 1 ? tokens[i + 1] : [])[0];
      if (tag === '{') {
        if (prevTag === 'PARAM_START') {
          if (!dictParamStart) {
            dictParamStart = i;
          } else {
            stackCount++;
          }
        } else if (dictParamStart) {
          stackCount++;
        }
      } else if (tag === '}') {
        if (dictParamStart) {
          if (!stackCount) {
            dictParamEnd = i;
            dictParamStart = 0;
          } else {
            stackCount--;
          }
        }
      } else {
        if (isInside()) {
          if (tag === ':') {
            if (nextTag !== 'IDENTIFIER' && nextTag !== '@') {
              val = tokens[i - 1][1];
              if (this.tag(i - 2) === '@') {
                thisToken = tokens.splice(i - 2, 1)[0];
                tokens.splice(i, 0, thisToken);
                tokens.splice(i + 1, 0, generate('=', '=', token));
                tokens.splice(i + 1, 0, generate('PROPERTY', val, token));
              } else {
                tokens.splice(i + 1, 0, generate('=', '=', token));
                tokens.splice(i + 1, 0, generate('IDENTIFIER', val, token));
              }
              return 2;
            }
          }
          if (tag === '=') {
            if (nextTag === ',' || nextTag === '}') {
              tokens.splice(i + 1, 0, generate('NULL', 'null', token));
              return 2;
            }
          }
        }
      }
      return 1;
    });
  };

  Rewriter.prototype.addLocationDataToGeneratedTokens = function() {
    return this.scanTokens(function(token, i, tokens) {
      var column, line, nextLocation, prevLocation, ref, ref1;
      if (token[2]) {
        return 1;
      }
      if (!(token.generated || token.explicit)) {
        return 1;
      }
      if (token[0] === '{' && (nextLocation = (ref = tokens[i + 1]) != null ? ref[2] : void 0)) {
        line = nextLocation.first_line, column = nextLocation.first_column;
      } else if (prevLocation = (ref1 = tokens[i - 1]) != null ? ref1[2] : void 0) {
        line = prevLocation.last_line, column = prevLocation.last_column;
      } else {
        line = column = 0;
      }
      token[2] = {
        first_line: line,
        first_column: column,
        last_line: line,
        last_column: column
      };
      return 1;
    });
  };

  Rewriter.prototype.fixOutdentLocationData = function() {
    return this.scanTokens(function(token, i, tokens) {
      var prevLocationData;
      if (!(token[0] === 'OUTDENT' || (token.generated && token[0] === 'CALL_END') || (token.generated && token[0] === '}'))) {
        return 1;
      }
      prevLocationData = tokens[i - 1][2];
      token[2] = {
        first_line: prevLocationData.last_line,
        first_column: prevLocationData.last_column,
        last_line: prevLocationData.last_line,
        last_column: prevLocationData.last_column
      };
      return 1;
    });
  };

  Rewriter.prototype.normalizeLines = function() {
    var action, condition, indent, outdent, starter;
    starter = indent = outdent = null;
    condition = function(token, i) {
      var ref, ref1, ref2, ref3;
      return token[1] !== ';' && (ref = token[0], indexOf.call(SINGLE_CLOSERS, ref) >= 0) && !(token[0] === 'TERMINATOR' && (ref1 = this.tag(i + 1), indexOf.call(EXPRESSION_CLOSE, ref1) >= 0)) && !(token[0] === 'ELSE' && starter !== 'THEN') && !(((ref2 = token[0]) === 'CATCH' || ref2 === 'FINALLY') && (starter === '->' || starter === '=>')) || (ref3 = token[0], indexOf.call(CALL_CLOSERS, ref3) >= 0) && (this.tokens[i - 1].newLine || this.tokens[i - 1][0] === 'OUTDENT');
    };
    action = function(token, i) {
      return this.tokens.splice((this.tag(i - 1) === ',' ? i - 1 : i), 0, outdent);
    };
    return this.scanTokens(function(token, i, tokens) {
      var j, k, ref, ref1, ref2, tag;
      tag = token[0];
      if (tag === 'TERMINATOR') {
        if (this.tag(i + 1) === 'ELSE' && this.tag(i - 1) !== 'OUTDENT') {
          tokens.splice.apply(tokens, [i, 1].concat(slice.call(this.indentation())));
          return 1;
        }
        if (ref = this.tag(i + 1), indexOf.call(EXPRESSION_CLOSE, ref) >= 0) {
          tokens.splice(i, 1);
          return 0;
        }
      }
      if (tag === 'CATCH') {
        for (j = k = 1; k <= 2; j = ++k) {
          if (!((ref1 = this.tag(i + j)) === 'OUTDENT' || ref1 === 'TERMINATOR' || ref1 === 'FINALLY')) {
            continue;
          }
          tokens.splice.apply(tokens, [i + j, 0].concat(slice.call(this.indentation())));
          return 2 + j;
        }
      }
      if (indexOf.call(SINGLE_LINERS, tag) >= 0 && this.tag(i + 1) !== 'INDENT' && !(tag === 'ELSE' && this.tag(i + 1) === 'IF')) {
        starter = tag;
        ref2 = this.indentation(tokens[i]), indent = ref2[0], outdent = ref2[1];
        if (starter === 'THEN') {
          indent.fromThen = true;
        }
        tokens.splice(i + 1, 0, indent);
        this.detectEnd(i + 2, condition, action);
        if (tag === 'THEN') {
          tokens.splice(i, 1);
        }
        return 1;
      }
      return 1;
    });
  };

  Rewriter.prototype.tagPostfixConditionals = function() {
    var action, condition, original;
    original = null;
    condition = function(token, i) {
      var prevTag, tag;
      tag = token[0];
      prevTag = this.tokens[i - 1][0];
      return tag === 'TERMINATOR' || (tag === 'INDENT' && indexOf.call(SINGLE_LINERS, prevTag) < 0);
    };
    action = function(token, i) {
      if (token[0] !== 'INDENT' || (token.generated && !token.fromThen)) {
        return original[0] = 'POST_' + original[0];
      }
    };
    return this.scanTokens(function(token, i) {
      if (token[0] !== 'IF') {
        return 1;
      }
      original = token;
      this.detectEnd(i + 1, condition, action);
      return 1;
    });
  };

  Rewriter.prototype.indentation = function(origin) {
    var indent, outdent;
    indent = ['INDENT', 4];
    outdent = ['OUTDENT', 4];
    if (origin) {
      indent.generated = outdent.generated = true;
      indent.origin = outdent.origin = origin;
    } else {
      indent.explicit = outdent.explicit = true;
    }
    return [indent, outdent];
  };

  Rewriter.generate = function(tag, value, origin) {
    var tok;
    tok = [tag, value];
    tok.generated = true;
    if (origin) {
      tok.origin = origin;
    }
    return tok;
  };

  Rewriter.prototype.tag = function(i) {
    var ref;
    return (ref = this.tokens[i]) != null ? ref[0] : void 0;
  };

  return Rewriter;

})();

BALANCED_PAIRS = [['(', ')'], ['[', ']'], ['{', '}'], ['INDENT', 'OUTDENT'], ['CALL_START', 'CALL_END'], ['PARAM_START', 'PARAM_END'], ['INDEX_START', 'INDEX_END'], ['STRING_START', 'STRING_END'], ['REGEX_START', 'REGEX_END']];

exports.INVERSES = INVERSES = {};

exports.Rewriter = Rewriter;

EXPRESSION_START = [];

EXPRESSION_END = [];

for (k = 0, len = BALANCED_PAIRS.length; k < len; k++) {
  ref = BALANCED_PAIRS[k], left = ref[0], rite = ref[1];
  EXPRESSION_START.push(INVERSES[rite] = left);
  EXPRESSION_END.push(INVERSES[left] = rite);
}

EXPRESSION_CLOSE = ['CATCH', 'THEN', 'ELSE', 'FINALLY'].concat(EXPRESSION_END);

IMPLICIT_FUNC = ['IDENTIFIER', 'PROPERTY', 'SUPER', ')', 'CALL_END', ']', 'INDEX_END', '@', 'THIS'];

IMPLICIT_CALL = ['IDENTIFIER', 'PROPERTY', 'NUMBER', 'INFINITY', 'NAN', 'STRING', 'STRING_START', 'REGEX', 'REGEX_START', 'JS', 'NEW', 'PARAM_START', 'CLASS', 'IF', 'TRY', 'SWITCH', 'THIS', 'UNDEFINED', 'NULL', 'BOOL', 'UNARY', 'YIELD', 'UNARY_MATH', 'SUPER', 'THROW', '@', '->', '=>', '[', '(', '{', '--', '++'];

IMPLICIT_UNSPACED_CALL = ['+', '-'];

IMPLICIT_END = ['POST_IF', 'FOR', 'WHILE', 'UNTIL', 'WHEN', 'BY', 'LOOP', 'TERMINATOR'];

SINGLE_LINERS = ['ELSE', '->', '=>', 'TRY', 'FINALLY', 'THEN'];

SINGLE_CLOSERS = ['TERMINATOR', 'CATCH', 'FINALLY', 'ELSE', 'OUTDENT', 'LEADING_WHEN'];

LINEBREAKS = ['TERMINATOR', 'INDENT', 'OUTDENT'];

CALL_CLOSERS = ['.', '?.', '::', '?::'];

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmV3cml0ZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7OztBQUFBLElBQUEsaVBBQUE7RUFBQTs7O0FBUUEsR0FBQSxHQUFNLE9BQU8sQ0FBQzs7QUFVUjs7O3FCQVFGLE9BQUEsR0FBUyxTQUFDLE9BQUQ7SUFBQyxJQUFDLENBQUEsU0FBRDtJQUdOLElBQUMsQ0FBQSxxQkFBRCxDQUFBO0lBRUEsSUFBQyxDQUFBLG1CQUFELENBQUE7SUFFQSxJQUFDLENBQUEsY0FBRCxDQUFBO0lBQ0EsSUFBQyxDQUFBLGdCQUFELENBQUE7SUFDQSxJQUFDLENBQUEsY0FBRCxDQUFBO0lBQ0EsSUFBQyxDQUFBLHNCQUFELENBQUE7SUFDQSxJQUFDLENBQUEsMEJBQUQsQ0FBQTtJQUVBLElBQUMsQ0FBQSxnQkFBRCxDQUFBO0lBQ0EsSUFBQyxDQUFBLGFBQUQsQ0FBQTtJQUVBLElBQUMsQ0FBQSxnQ0FBRCxDQUFBO0lBQ0EsSUFBQyxDQUFBLHNCQUFELENBQUE7V0FDQSxJQUFDLENBQUE7RUFsQkk7O3FCQTBCVCxVQUFBLEdBQVksU0FBQyxLQUFEO0FBQ1IsUUFBQTtJQUFDLFNBQVU7SUFDWCxDQUFBLEdBQUk7QUFDbUMsV0FBTSxLQUFBLEdBQVEsTUFBTyxDQUFBLENBQUEsQ0FBckI7TUFBdkMsQ0FBQSxJQUFLLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWCxFQUFpQixLQUFqQixFQUF3QixDQUF4QixFQUEyQixNQUEzQjtJQUFrQztXQUN2QztFQUpROztxQkFNWixTQUFBLEdBQVcsU0FBQyxDQUFELEVBQUksU0FBSixFQUFlLE1BQWY7QUFDUCxRQUFBO0lBQUMsU0FBVTtJQUNYLE1BQUEsR0FBUztBQUNULFdBQU0sS0FBQSxHQUFRLE1BQU8sQ0FBQSxDQUFBLENBQXJCO01BQ0ksSUFBcUMsTUFBQSxLQUFVLENBQVYsSUFBZ0IsU0FBUyxDQUFDLElBQVYsQ0FBZSxJQUFmLEVBQXFCLEtBQXJCLEVB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b3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4wMDAgICAwMDAgIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbjAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4wMDAgICAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuIyMjXG5cbmxvZyA9IGNvbnNvbGUubG9nXG5cbiMgVGhlIGxhbmd1YWdlIGhhcyBhIGdvb2QgZGVhbCBvZiBvcHRpb25hbCBzeW50YXgsIGltcGxpY2l0IHN5bnRheCxcbiMgYW5kIHNob3J0aGFuZCBzeW50YXguIFRoaXMgY2FuIGdyZWF0bHkgY29tcGxpY2F0ZSBhIGdyYW1tYXIgYW5kIGJsb2F0XG4jIHRoZSByZXN1bHRpbmcgcGFyc2UgdGFibGUuIEluc3RlYWQgb2YgbWFraW5nIHRoZSBwYXJzZXIgaGFuZGxlIGl0IGFsbCwgd2UgdGFrZVxuIyBhIHNlcmllcyBvZiBwYXNzZXMgb3ZlciB0aGUgdG9rZW4gc3RyZWFtLCB1c2luZyB0aGlzICoqUmV3cml0ZXIqKiB0byBjb252ZXJ0XG4jIHNob3J0aGFuZCBpbnRvIHRoZSB1bmFtYmlndW91cyBsb25nIGZvcm0sIGFkZCBpbXBsaWNpdCBpbmRlbnRhdGlvbiBhbmRcbiMgcGFyZW50aGVzZXMsIGFuZCBnZW5lcmFsbHkgY2xlYW4gdGhpbmdzIHVwLlxuIyBUaGUgUmV3cml0ZXIgaXMgdXNlZCBieSB0aGUgTGV4ZXIsIGRpcmVjdGx5IGFnYWluc3QgaXRzIGludGVybmFsIGFycmF5IG9mIHRva2Vucy5cblxuY2xhc3MgUmV3cml0ZXJcblxuICAgICMgUmV3cml0ZSB0aGUgdG9rZW4gc3RyZWFtIGluIG11bHRpcGxlIHBhc3Nlcywgb25lIGxvZ2ljYWwgZmlsdGVyIGF0XG4gICAgIyBhIHRpbWUuIFRoaXMgY291bGQgY2VydGFpbmx5IGJlIGNoYW5nZWQgaW50byBhIHNpbmdsZSBwYXNzIHRocm91Z2ggdGhlXG4gICAgIyBzdHJlYW0sIHdpdGggYSBiaWcgb2wnIGVmZmljaWVudCBzd2l0Y2gsIGJ1dCBpdCdzIG11Y2ggbmljZXIgdG8gd29yayB3aXRoXG4gICAgIyBsaWtlIHRoaXMuIFRoZSBvcmRlciBvZiB0aGVzZSBwYXNzZXMgbWF0dGVycyAtLSBpbmRlbnRhdGlvbiBtdXN0IGJlXG4gICAgIyBjb3JyZWN0ZWQgYmVmb3JlIGltcGxpY2l0IHBhcmVudGhlc2VzIGNhbiBiZSB3cmFwcGVkIGFyb3VuZCBibG9ja3Mgb2YgY29kZS5cbiAgICBcbiAgICByZXdyaXRlOiAoQHRva2VucykgLT5cbiAgICAgICAgIyBIZWxwZnVsIHNuaXBwZXQgZm9yIGRlYnVnZ2luZzpcbiAgICAgICAgIyBjb25zb2xlLmxvZyAodFswXSArICcvJyArIHRbMV0gZm9yIHQgaW4gQHRva2Vucykuam9pbiAnICdcbiAgICAgICAgQHJlbW92ZUxlYWRpbmdOZXdsaW5lcygpXG4gICAgICAgIFxuICAgICAgICBAY29uc3RydWN0b3JTaG9ydGN1dCgpICMga29mZmVlXG4gICAgICAgIFxuICAgICAgICBAY2xvc2VPcGVuQ2FsbHMoKVxuICAgICAgICBAY2xvc2VPcGVuSW5kZXhlcygpXG4gICAgICAgIEBub3JtYWxpemVMaW5lcygpXG4gICAgICAgIEB0YWdQb3N0Zml4Q29uZGl0aW9uYWxzKClcbiAgICAgICAgQGFkZEltcGxpY2l0QnJhY2VzQW5kUGFyZW5zKClcbiAgICAgICAgXG4gICAgICAgIEBjb25maWdQYXJhbWV0ZXJzKCkgICAgIyBrb2ZmZWVcbiAgICAgICAgQG5lZ2F0aXZlSW5kZXgoKSAgICAgICAjIGtvZmZlZVxuICAgICAgICBcbiAgICAgICAgQGFkZExvY2F0aW9uRGF0YVRvR2VuZXJhdGVkVG9rZW5zKClcbiAgICAgICAgQGZpeE91dGRlbnRMb2NhdGlvbkRhdGEoKSAgIFxuICAgICAgICBAdG9rZW5zXG5cbiAgICAjIFJld3JpdGUgdGhlIHRva2VuIHN0cmVhbSwgbG9va2luZyBvbmUgdG9rZW4gYWhlYWQgYW5kIGJlaGluZC5cbiAgICAjIEFsbG93IHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIGJsb2NrIHRvIHRlbGwgdXMgaG93IG1hbnkgdG9rZW5zIHRvIG1vdmVcbiAgICAjIGZvcndhcmRzIChvciBiYWNrd2FyZHMpIGluIHRoZSBzdHJlYW0sIHRvIG1ha2Ugc3VyZSB3ZSBkb24ndCBtaXNzIGFueXRoaW5nXG4gICAgIyBhcyB0b2tlbnMgYXJlIGluc2VydGVkIGFuZCByZW1vdmVkLCBhbmQgdGhlIHN0cmVhbSBjaGFuZ2VzIGxlbmd0aCB1bmRlclxuICAgICMgb3VyIGZlZXQuXG4gICAgXG4gICAgc2NhblRva2VuczogKGJsb2NrKSAtPlxuICAgICAgICB7dG9rZW5zfSA9IHRoaXNcbiAgICAgICAgaSA9IDBcbiAgICAgICAgaSArPSBibG9jay5jYWxsIHRoaXMsIHRva2VuLCBpLCB0b2tlbnMgd2hpbGUgdG9rZW4gPSB0b2tlbnNbaV1cbiAgICAgICAgdHJ1ZVxuXG4gICAgZGV0ZWN0RW5kOiAoaSwgY29uZGl0aW9uLCBhY3Rpb24pIC0+XG4gICAgICAgIHt0b2tlbnN9ID0gdGhpc1xuICAgICAgICBsZXZlbHMgPSAwXG4gICAgICAgIHdoaWxlIHRva2VuID0gdG9rZW5zW2ldXG4gICAgICAgICAgICByZXR1cm4gYWN0aW9uLmNhbGwgdGhpcywgdG9rZW4sIGkgaWYgbGV2ZWxzIGlzIDAgYW5kIGNvbmRpdGlvbi5jYWxsIHRoaXMsIHRva2VuLCBpXG4gICAgICAgICAgICByZXR1cm4gYWN0aW9uLmNhbGwgdGhpcywgdG9rZW4sIGkgLSAxIGlmIG5vdCB0b2tlbiBvciBsZXZlbHMgPCAwXG4gICAgICAgICAgICBpZiB0b2tlblswXSBpbiBFWFBSRVNTSU9OX1NUQVJUXG4gICAgICAgICAgICAgICAgbGV2ZWxzICs9IDFcbiAgICAgICAgICAgIGVsc2UgaWYgdG9rZW5bMF0gaW4gRVhQUkVTU0lPTl9FTkRcbiAgICAgICAgICAgICAgICBsZXZlbHMgLT0gMVxuICAgICAgICAgICAgaSArPSAxXG4gICAgICAgIGkgLSAxXG5cbiAgICAjIExlYWRpbmcgbmV3bGluZXMgd291bGQgaW50cm9kdWNlIGFuIGFtYmlndWl0eSBpbiB0aGUgZ3JhbW1hciwgc28gd2UgZGlzcGF0Y2ggdGhlbSBoZXJlLlxuICAgIFxuICAgIHJlbW92ZUxlYWRpbmdOZXdsaW5lczogLT5cbiAgICAgICAgXG4gICAgICAgIGJyZWFrIGZvciBbdGFnXSwgaSBpbiBAdG9rZW5zIHdoZW4gdGFnICE9ICdURVJNSU5BVE9SJ1xuICAgICAgICBAdG9rZW5zLnNwbGljZSAwLCBpIGlmIGlcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgICAgIFxuICAgIGNoZWNrOiAtPiBcbiAgICAgICAgbCA9IGFyZ3VtZW50c1xuICAgICAgICBmb3IgaiBpbiBbMC4uLmwubGVuZ3RoXSBieSAyXG4gICAgICAgICAgICBpbmRleCA9IGxbal1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZSBpZiBpbmRleCA8IDBcbiAgICAgICAgICAgIGlmIEB0YWcoaW5kZXgpICE9IGxbaisxXVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB0cnVlXG4gICAgICAgICAgICAgICAgXG4gICAgIyByZXBsYWNlIGBAOmAgd2l0aCBgY29uc3RydWN0b3I6YFxuICAgIFxuICAgIGNvbnN0cnVjdG9yU2hvcnRjdXQ6IC0+XG4gICAgICAgICBcbiAgICAgICAgQHNjYW5Ub2tlbnMgKHRva2VuLCBpLCB0b2tlbnMpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGkgPiAwIGFuZCB0b2tlbnNbaS0xXVswXSBpcyAnQCcgYW5kIHRva2Vuc1tpXVswXSBpcyAnOicgYW5kIHRva2Vuc1tpKzFdWzBdIGluIFsnLT4nLCAnUEFSQU1fU1RBUlQnXVxuICAgICAgICAgICAgICAgIHRva2Vuc1tpLTFdWzBdID0gJ1BST1BFUlRZJ1xuICAgICAgICAgICAgICAgIHRva2Vuc1tpLTFdWzFdID0gJ2NvbnN0cnVjdG9yJ1xuICAgICAgICAgICAgMVxuICAgICAgICAgICAgXG4gICAgIyByZXBsYWNlIGBbLTFdYCB3aXRoIGBbLTEuLi0xXWAgYWZ0ZXIgaWRlbnRpZmllciwgc3RyaW5nLCBhcnJheSwgYnJhY2tldHNcbiAgICBcbiAgICBuZWdhdGl2ZUluZGV4OiAtPlxuXG4gICAgICAgIEBzY2FuVG9rZW5zICh0b2tlbiwgaSwgdG9rZW5zKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBnZW5lcmF0ZSA9IFJld3JpdGVyLmdlbmVyYXRlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIEBjaGVjayBpLTEsICdJTkRFWF9TVEFSVCcsIGksICctJywgaSsxLCAnTlVNQkVSJywgaSsyLCAnSU5ERVhfRU5EJ1xuICAgICAgICAgICAgICAgIGlmIEB0YWcoaS0yKSBpbiBbJ0lERU5USUZJRVInLCAnU1RSSU5HJ11cbiAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpLCAwLCBnZW5lcmF0ZSh0b2tlbnNbaS0yXVswXSwgdG9rZW5zW2ktMl1bMV0sIHRva2VuKSwgZ2VuZXJhdGUoJy4nLCAnLicsIHRva2VuKSwgZ2VuZXJhdGUoJ1BST1BFUlRZJywgJ2xlbmd0aCcsIHRva2VuKSAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiA1XG4gICAgICAgICAgICAgICAgaWYgQHRhZyhpLTIpIGluIFsnU1RSSU5HX0VORCcsICddJywgJyknXVxuICAgICAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGkrMiwgMCwgZ2VuZXJhdGUoJy4uJywgJy4uJywgdG9rZW4pLCBnZW5lcmF0ZSh0b2tlbnNbaV1bMF0sIHRva2Vuc1tpXVsxXSwgdG9rZW4pLCBnZW5lcmF0ZSh0b2tlbnNbaSsxXVswXSwgdG9rZW5zW2krMV1bMV0sIHRva2VuKVxuICAgICAgICAgICAgICAgICAgICBpZiBAdGFnKGktMikgaW4gWyddJywgJyknXVxuICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpKzYsIDAsIGdlbmVyYXRlKCdJTkRFWF9TVEFSVCcsICdbJywgdG9rZW4pLCBnZW5lcmF0ZSgnTlVNQkVSJywgJzAnLCB0b2tlbiksIGdlbmVyYXRlKCdJTkRFWF9FTkQnLCAnXScsIHRva2VuKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDdcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDRcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGxvZyBAdGFnKGktMilcbiAgICAgICAgICAgIDFcbiAgICAgICAgXG4gICAgIyBUaGUgbGV4ZXIgaGFzIHRhZ2dlZCB0aGUgb3BlbmluZyBwYXJlbnRoZXNpcyBvZiBhIG1ldGhvZCBjYWxsLiBNYXRjaCBpdCB3aXRoXG4gICAgIyBpdHMgcGFpcmVkIGNsb3NlLiBXZSBoYXZlIHRoZSBtaXMtbmVzdGVkIG91dGRlbnQgY2FzZSBpbmNsdWRlZCBoZXJlIGZvclxuICAgICMgY2FsbHMgdGhhdCBjbG9zZSBvbiB0aGUgc2FtZSBsaW5lLCBqdXN0IGJlZm9yZSB0aGVpciBvdXRkZW50LlxuICAgIFxuICAgIGNsb3NlT3BlbkNhbGxzOiAtPlxuICAgICAgICBcbiAgICAgICAgY29uZGl0aW9uID0gKHRva2VuLCBpKSAtPlxuICAgICAgICAgICAgdG9rZW5bMF0gaW4gWycpJywgJ0NBTExfRU5EJ10gb3JcbiAgICAgICAgICAgIHRva2VuWzBdIGlzICdPVVRERU5UJyBhbmQgQHRhZyhpIC0gMSkgaXMgJyknXG5cbiAgICAgICAgYWN0aW9uID0gKHRva2VuLCBpKSAtPlxuICAgICAgICAgICAgQHRva2Vuc1tpZiB0b2tlblswXSBpcyAnT1VUREVOVCcgdGhlbiBpIC0gMSBlbHNlIGldWzBdID0gJ0NBTExfRU5EJ1xuXG4gICAgICAgIEBzY2FuVG9rZW5zICh0b2tlbiwgaSkgLT5cbiAgICAgICAgICAgIEBkZXRlY3RFbmQgaSArIDEsIGNvbmRpdGlvbiwgYWN0aW9uIGlmIHRva2VuWzBdIGlzICdDQUxMX1NUQVJUJ1xuICAgICAgICAgICAgMVxuXG4gICAgIyBUaGUgbGV4ZXIgaGFzIHRhZ2dlZCB0aGUgb3BlbmluZyBwYXJlbnRoZXNpcyBvZiBhbiBpbmRleGluZyBvcGVyYXRpb24gY2FsbC5cbiAgICAjIE1hdGNoIGl0IHdpdGggaXRzIHBhaXJlZCBjbG9zZS5cbiAgICBcbiAgICBjbG9zZU9wZW5JbmRleGVzOiAtPlxuICAgICAgICBcbiAgICAgICAgY29uZGl0aW9uID0gKHRva2VuLCBpKSAtPlxuICAgICAgICAgICAgdG9rZW5bMF0gaW4gWyddJywgJ0lOREVYX0VORCddXG5cbiAgICAgICAgYWN0aW9uID0gKHRva2VuLCBpKSAtPlxuICAgICAgICAgICAgdG9rZW5bMF0gPSAnSU5ERVhfRU5EJ1xuXG4gICAgICAgIEBzY2FuVG9rZW5zICh0b2tlbiwgaSkgLT5cbiAgICAgICAgICAgIEBkZXRlY3RFbmQgaSArIDEsIGNvbmRpdGlvbiwgYWN0aW9uIGlmIHRva2VuWzBdIGlzICdJTkRFWF9TVEFSVCdcbiAgICAgICAgICAgIDFcblxuICAgICMgTWF0Y2ggdGFncyBpbiB0b2tlbiBzdHJlYW0gc3RhcnRpbmcgYXQgYGlgIHdpdGggYHBhdHRlcm5gLCBza2lwcGluZyAnSEVSRUNPTU1FTlQncy5cbiAgICAjIGBwYXR0ZXJuYCBtYXkgY29uc2lzdCBvZiBzdHJpbmdzIChlcXVhbGl0eSksIGFuIGFycmF5IG9mIHN0cmluZ3MgKG9uZSBvZilcbiAgICAjIG9yIG51bGwgKHdpbGRjYXJkKS4gUmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIG1hdGNoIG9yIC0xIGlmIG5vIG1hdGNoLlxuICAgIFxuICAgIGluZGV4T2ZUYWc6IChpLCBwYXR0ZXJuLi4uKSAtPlxuICAgICAgICBmdXp6ID0gMFxuICAgICAgICBmb3IgaiBpbiBbMCAuLi4gcGF0dGVybi5sZW5ndGhdXG4gICAgICAgICAgICBmdXp6ICs9IDIgd2hpbGUgQHRhZyhpICsgaiArIGZ1enopIGlzICdIRVJFQ09NTUVOVCdcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIG5vdCBwYXR0ZXJuW2pdP1xuICAgICAgICAgICAgcGF0dGVybltqXSA9IFtwYXR0ZXJuW2pdXSBpZiB0eXBlb2YgcGF0dGVybltqXSBpcyAnc3RyaW5nJ1xuICAgICAgICAgICAgcmV0dXJuIC0xIGlmIEB0YWcoaSArIGogKyBmdXp6KSBub3QgaW4gcGF0dGVybltqXVxuICAgICAgICBpICsgaiArIGZ1enogLSAxXG5cbiAgICAjIGBAPHg+OmAsIGA8eD46YCBvciBgPEVYUFJFU1NJT05fU1RBUlQ+PHg+Li4uPEVYUFJFU1NJT05fRU5EPjpgLCBza2lwcGluZyBvdmVyICdIRVJFQ09NTUVOVCdzLlxuICAgIFxuICAgIGxvb2tzT2JqZWN0aXNoOiAoaikgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB5ZXMgaWYgQGluZGV4T2ZUYWcoaiwgJ0AnLCBudWxsLCAnOicpID4gLTEgb3IgQGluZGV4T2ZUYWcoaiwgbnVsbCwgJzonKSA+IC0xXG4gICAgICAgIFxuICAgICAgICBpbmRleCA9IEBpbmRleE9mVGFnKGosIEVYUFJFU1NJT05fU1RBUlQpXG4gICAgICAgIGlmIGluZGV4ID4gLTFcbiAgICAgICAgICAgIGVuZCA9IG51bGxcbiAgICAgICAgICAgIEBkZXRlY3RFbmQgaW5kZXggKyAxLCAoKHRva2VuKSAtPiB0b2tlblswXSBpbiBFWFBSRVNTSU9OX0VORCksICgodG9rZW4sIGkpIC0+IGVuZCA9IGkpXG4gICAgICAgICAgICByZXR1cm4geWVzIGlmIEB0YWcoZW5kICsgMSkgaXMgJzonXG4gICAgICAgIG5vXG5cbiAgICAjIFJldHVybnMgYHllc2AgaWYgY3VycmVudCBsaW5lIG9mIHRva2VucyBjb250YWluIGFuIGVsZW1lbnQgb2YgdGFncyBvbiBzYW1lIGV4cHJlc3Npb24gbGV2ZWwuIFxuICAgICMgU3RvcCBzZWFyY2hpbmcgYXQgTElORUJSRUFLUyBvciBleHBsaWNpdCBzdGFydCBvZiBjb250YWluaW5nIGJhbGFuY2VkIGV4cHJlc3Npb24uXG4gICAgXG4gICAgZmluZFRhZ3NCYWNrd2FyZHM6IChpLCB0YWdzKSAtPlxuICAgICAgICBiYWNrU3RhY2sgPSBbXVxuICAgICAgICB3aGlsZSBpID49IDAgYW5kIChiYWNrU3RhY2subGVuZ3RoIG9yXG4gICAgICAgICAgICAgICAgICAgIEB0YWcoaSkgbm90IGluIHRhZ3MgYW5kXG4gICAgICAgICAgICAgICAgICAgIChAdGFnKGkpIG5vdCBpbiBFWFBSRVNTSU9OX1NUQVJUIG9yIEB0b2tlbnNbaV0uZ2VuZXJhdGVkKSBhbmRcbiAgICAgICAgICAgICAgICAgICAgQHRhZyhpKSBub3QgaW4gTElORUJSRUFLUylcbiAgICAgICAgICAgIGJhY2tTdGFjay5wdXNoIEB0YWcoaSkgaWYgQHRhZyhpKSBpbiBFWFBSRVNTSU9OX0VORFxuICAgICAgICAgICAgYmFja1N0YWNrLnBvcCgpIGlmIEB0YWcoaSkgaW4gRVhQUkVTU0lPTl9TVEFSVCBhbmQgYmFja1N0YWNrLmxlbmd0aFxuICAgICAgICAgICAgaSAtPSAxXG4gICAgICAgIEB0YWcoaSkgaW4gdGFnc1xuXG4gICAgIyAwMDAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgIyBMb29rIGZvciBzaWducyBvZiBpbXBsaWNpdCBjYWxscyBhbmQgb2JqZWN0cyBpbiB0aGUgdG9rZW4gc3RyZWFtIGFuZCBhZGQgdGhlbS5cbiAgICAgICAgXG4gICAgYWRkSW1wbGljaXRCcmFjZXNBbmRQYXJlbnM6IC0+XG4gICAgICAgICMgVHJhY2sgY3VycmVudCBiYWxhbmNpbmcgZGVwdGggKGJvdGggaW1wbGljaXQgYW5kIGV4cGxpY2l0KSBvbiBzdGFjay5cbiAgICAgICAgc3RhY2sgPSBbXVxuICAgICAgICBzdGFydCA9IG51bGxcblxuICAgICAgICBAc2NhblRva2VucyAodG9rZW4sIGksIHRva2VucykgLT5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgW3RhZ10gICAgID0gdG9rZW5cbiAgICAgICAgICAgIFtwcmV2VGFnXSA9IHByZXZUb2tlbiA9IGlmIGkgPiAwIHRoZW4gdG9rZW5zW2kgLSAxXSBlbHNlIFtdXG4gICAgICAgICAgICBbbmV4dFRhZ10gPSBpZiBpIDwgdG9rZW5zLmxlbmd0aCAtIDEgdGhlbiB0b2tlbnNbaSArIDFdIGVsc2UgW11cbiAgICAgICAgICAgIHN0YWNrVG9wICA9IC0+IHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdXG4gICAgICAgICAgICBzdGFydElkeCAgPSBpXG4gICAgICAgICAgICBnZW5lcmF0ZSAgPSBSZXdyaXRlci5nZW5lcmF0ZVxuXG4gICAgICAgICAgICAjIEhlbHBlciBmdW5jdGlvbiwgdXNlZCBmb3Iga2VlcGluZyB0cmFjayBvZiB0aGUgbnVtYmVyIG9mIHRva2VucyBjb25zdW1lZFxuICAgICAgICAgICAgIyBhbmQgc3BsaWNlZCwgd2hlbiByZXR1cm5pbmcgZm9yIGdldHRpbmcgYSBuZXcgdG9rZW4uXG4gICAgICAgICAgICBmb3J3YXJkICAgPSAobikgLT4gaSAtIHN0YXJ0SWR4ICsgblxuXG4gICAgICAgICAgICAjIEhlbHBlciBmdW5jdGlvbnNcbiAgICAgICAgICAgIGlzSW1wbGljaXQgICAgICAgICAgPSAoc3RhY2tJdGVtKSAtPiBzdGFja0l0ZW0/WzJdPy5vdXJzXG4gICAgICAgICAgICBpc0ltcGxpY2l0T2JqZWN0ICAgID0gKHN0YWNrSXRlbSkgLT4gaXNJbXBsaWNpdChzdGFja0l0ZW0pIGFuZCBzdGFja0l0ZW0/WzBdIGlzICd7J1xuICAgICAgICAgICAgaXNJbXBsaWNpdENhbGwgICAgICA9IChzdGFja0l0ZW0pIC0+IGlzSW1wbGljaXQoc3RhY2tJdGVtKSBhbmQgc3RhY2tJdGVtP1swXSBpcyAnKCdcbiAgICAgICAgICAgIGluSW1wbGljaXQgICAgICAgICAgPSAtPiBpc0ltcGxpY2l0IHN0YWNrVG9wKClcbiAgICAgICAgICAgIGluSW1wbGljaXRDYWxsICAgICAgPSAtPiBpc0ltcGxpY2l0Q2FsbCBzdGFja1RvcCgpXG4gICAgICAgICAgICBpbkltcGxpY2l0T2JqZWN0ICAgID0gLT4gaXNJbXBsaWNpdE9iamVjdCBzdGFja1RvcCgpXG4gICAgICAgICAgICAjIFVuY2xvc2VkIGNvbnRyb2wgc3RhdGVtZW50IGluc2lkZSBpbXBsaWNpdCBwYXJlbnMgKGxpa2VcbiAgICAgICAgICAgICMgY2xhc3MgZGVjbGFyYXRpb24gb3IgaWYtY29uZGl0aW9uYWxzKVxuICAgICAgICAgICAgaW5JbXBsaWNpdENvbnRyb2wgPSAtPiBpbkltcGxpY2l0IGFuZCBzdGFja1RvcCgpP1swXSBpcyAnQ09OVFJPTCdcblxuICAgICAgICAgICAgc3RhcnRJbXBsaWNpdENhbGwgPSAoaikgLT5cbiAgICAgICAgICAgICAgICBpZHggPSBqID8gaVxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2ggWycoJywgaWR4LCBvdXJzOiB5ZXNdXG4gICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpZHgsIDAsIGdlbmVyYXRlICdDQUxMX1NUQVJUJywgJygnLCBbJycsICdpbXBsaWNpdCBmdW5jdGlvbiBjYWxsJywgdG9rZW5bMl1dXG4gICAgICAgICAgICAgICAgaSArPSAxIGlmIG5vdCBqP1xuXG4gICAgICAgICAgICBlbmRJbXBsaWNpdENhbGwgPSAtPlxuICAgICAgICAgICAgICAgIHN0YWNrLnBvcCgpXG4gICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpLCAwLCBnZW5lcmF0ZSAnQ0FMTF9FTkQnLCAnKScsIFsnJywgJ2VuZCBvZiBpbnB1dCcsIHRva2VuWzJdXVxuICAgICAgICAgICAgICAgIGkgKz0gMVxuXG4gICAgICAgICAgICBzdGFydEltcGxpY2l0T2JqZWN0ID0gKGosIHN0YXJ0c0xpbmUgPSB5ZXMpIC0+XG4gICAgICAgICAgICAgICAgaWR4ID0gaiA/IGlcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoIFsneycsIGlkeCwgc2FtZUxpbmU6IHllcywgc3RhcnRzTGluZTogc3RhcnRzTGluZSwgb3VyczogeWVzXVxuICAgICAgICAgICAgICAgIHZhbCA9IG5ldyBTdHJpbmcgJ3snXG4gICAgICAgICAgICAgICAgdmFsLmdlbmVyYXRlZCA9IHllc1xuICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaWR4LCAwLCBnZW5lcmF0ZSAneycsIHZhbCwgdG9rZW5cbiAgICAgICAgICAgICAgICBpICs9IDEgaWYgbm90IGo/XG5cbiAgICAgICAgICAgIGVuZEltcGxpY2l0T2JqZWN0ID0gKGopIC0+XG4gICAgICAgICAgICAgICAgaiA9IGogPyBpXG4gICAgICAgICAgICAgICAgc3RhY2sucG9wKClcbiAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGosIDAsIGdlbmVyYXRlICd9JywgJ30nLCB0b2tlblxuICAgICAgICAgICAgICAgIGkgKz0gMVxuXG4gICAgICAgICAgICAjIERvbid0IGVuZCBhbiBpbXBsaWNpdCBjYWxsIG9uIG5leHQgaW5kZW50IGlmIGFueSBvZiB0aGVzZSBhcmUgaW4gYW4gYXJndW1lbnRcbiAgICAgICAgICAgIGlmIGluSW1wbGljaXRDYWxsKCkgYW5kIHRhZyBpbiBbJ0lGJywgJ1RSWScsICdGSU5BTExZJywgJ0NBVENIJyxcbiAgICAgICAgICAgICAgICAnQ0xBU1MnLCAnU1dJVENIJ11cbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoIFsnQ09OVFJPTCcsIGksIG91cnM6IHllc11cbiAgICAgICAgICAgICAgICByZXR1cm4gZm9yd2FyZCgxKVxuXG4gICAgICAgICAgICBpZiB0YWcgaXMgJ0lOREVOVCcgYW5kIGluSW1wbGljaXQoKVxuXG4gICAgICAgICAgICAgICAgIyBBbiBgSU5ERU5UYCBjbG9zZXMgYW4gaW1wbGljaXQgY2FsbCB1bmxlc3NcbiAgICAgICAgICAgICAgICAjXG4gICAgICAgICAgICAgICAgIyAgICAxLiBXZSBoYXZlIHNlZW4gYSBgQ09OVFJPTGAgYXJndW1lbnQgb24gdGhlIGxpbmUuXG4gICAgICAgICAgICAgICAgIyAgICAyLiBUaGUgbGFzdCB0b2tlbiBiZWZvcmUgdGhlIGluZGVudCBpcyBwYXJ0IG9mIHRoZSBsaXN0IGJlbG93XG4gICAgICAgICAgICAgICAgI1xuICAgICAgICAgICAgICAgIGlmIHByZXZUYWcgbm90IGluIFsnPT4nLCAnLT4nLCAnWycsICcoJywgJywnLCAneycsICdUUlknLCAnRUxTRScsICc9J11cbiAgICAgICAgICAgICAgICAgICAgZW5kSW1wbGljaXRDYWxsKCkgd2hpbGUgaW5JbXBsaWNpdENhbGwoKVxuICAgICAgICAgICAgICAgIHN0YWNrLnBvcCgpIGlmIGluSW1wbGljaXRDb250cm9sKClcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoIFt0YWcsIGldXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvcndhcmQoMSlcblxuICAgICAgICAgICAgIyBTdHJhaWdodGZvcndhcmQgc3RhcnQgb2YgZXhwbGljaXQgZXhwcmVzc2lvblxuICAgICAgICAgICAgaWYgdGFnIGluIEVYUFJFU1NJT05fU1RBUlRcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoIFt0YWcsIGldXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvcndhcmQoMSlcblxuICAgICAgICAgICAgIyBDbG9zZSBhbGwgaW1wbGljaXQgZXhwcmVzc2lvbnMgaW5zaWRlIG9mIGV4cGxpY2l0bHkgY2xvc2VkIGV4cHJlc3Npb25zLlxuICAgICAgICAgICAgaWYgdGFnIGluIEVYUFJFU1NJT05fRU5EXG4gICAgICAgICAgICAgICAgd2hpbGUgaW5JbXBsaWNpdCgpXG4gICAgICAgICAgICAgICAgICAgIGlmIGluSW1wbGljaXRDYWxsKClcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZEltcGxpY2l0Q2FsbCgpXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgaW5JbXBsaWNpdE9iamVjdCgpXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmRJbXBsaWNpdE9iamVjdCgpXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrLnBvcCgpXG4gICAgICAgICAgICAgICAgc3RhcnQgPSBzdGFjay5wb3AoKVxuXG4gICAgICAgICAgICAjIFJlY29nbml6ZSBzdGFuZGFyZCBpbXBsaWNpdCBjYWxscyBsaWtlXG4gICAgICAgICAgICAjIGYgYSwgZigpIGIsIGY/IGMsIGhbMF0gZCBldGMuXG4gICAgICAgICAgICBpZiAodGFnIGluIElNUExJQ0lUX0ZVTkMgYW5kIHRva2VuLnNwYWNlZCBvclxuICAgICAgICAgICAgICAgICAgICB0YWcgaXMgJz8nIGFuZCBpID4gMCBhbmQgbm90IHRva2Vuc1tpIC0gMV0uc3BhY2VkKSBhbmRcbiAgICAgICAgICAgICAgICAgKG5leHRUYWcgaW4gSU1QTElDSVRfQ0FMTCBvclxuICAgICAgICAgICAgICAgICAgICBuZXh0VGFnIGluIElNUExJQ0lUX1VOU1BBQ0VEX0NBTEwgYW5kXG4gICAgICAgICAgICAgICAgICAgIG5vdCB0b2tlbnNbaSArIDFdPy5zcGFjZWQgYW5kIG5vdCB0b2tlbnNbaSArIDFdPy5uZXdMaW5lKVxuICAgICAgICAgICAgICAgIHRhZyA9IHRva2VuWzBdID0gJ0ZVTkNfRVhJU1QnIGlmIHRhZyBpcyAnPydcbiAgICAgICAgICAgICAgICBzdGFydEltcGxpY2l0Q2FsbCBpICsgMVxuICAgICAgICAgICAgICAgIHJldHVybiBmb3J3YXJkKDIpXG5cbiAgICAgICAgICAgICMgSW1wbGljaXQgY2FsbCB0YWtpbmcgYW4gaW1wbGljaXQgaW5kZW50ZWQgb2JqZWN0IGFzIGZpcnN0IGFyZ3VtZW50LlxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyAgICAgICAgICAgZlxuICAgICAgICAgICAgIyAgICAgICAgICAgICAgIGE6IGJcbiAgICAgICAgICAgICMgICAgICAgICAgICAgICBjOiBkXG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjIGFuZFxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyAgICAgICAgICAgZlxuICAgICAgICAgICAgIyAgICAgICAgICAgICAgIDFcbiAgICAgICAgICAgICMgICAgICAgICAgICAgICBhOiBiXG4gICAgICAgICAgICAjICAgICAgICAgICAgICAgYjogY1xuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyBEb24ndCBhY2NlcHQgaW1wbGljaXQgY2FsbHMgb2YgdGhpcyB0eXBlLCB3aGVuIG9uIHRoZSBzYW1lIGxpbmVcbiAgICAgICAgICAgICMgYXMgdGhlIGNvbnRyb2wgc3RydWN0dXJlcyBiZWxvdyBhcyB0aGF0IG1heSBtaXNpbnRlcnByZXQgY29uc3RydWN0cyBsaWtlOlxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyAgICAgICAgICAgaWYgZlxuICAgICAgICAgICAgIyAgICAgICAgICAgICAgICBhOiAxXG4gICAgICAgICAgICAjIGFzXG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjICAgICAgICAgICBpZiBmKGE6IDEpXG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjIHdoaWNoIGlzIHByb2JhYmx5IGFsd2F5cyB1bmludGVuZGVkLlxuICAgICAgICAgICAgIyBGdXJ0aGVybW9yZSBkb24ndCBhbGxvdyB0aGlzIGluIGxpdGVyYWwgYXJyYXlzLCBhcyB0aGF0IGNyZWF0ZXMgZ3JhbW1hdGljYWwgYW1iaWd1aXRpZXMuXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHRhZyBpbiBJTVBMSUNJVF9GVU5DIGFuZFxuICAgICAgICAgICAgICAgICBAaW5kZXhPZlRhZyhpICsgMSwgJ0lOREVOVCcpID4gLTEgYW5kIEBsb29rc09iamVjdGlzaChpICsgMikgYW5kXG4gICAgICAgICAgICAgICAgIG5vdCBAZmluZFRhZ3NCYWNrd2FyZHMoaSwgWydDTEFTUycsICdFWFRFTkRTJywgJ0lGJywgJ0NBVENIJyxcbiAgICAgICAgICAgICAgICAgICAgJ1NXSVRDSCcsICdMRUFESU5HX1dIRU4nLCAnRk9SJywgJ1dISUxFJywgJ1VOVElMJ10pXG4gICAgICAgICAgICAgICAgc3RhcnRJbXBsaWNpdENhbGwgaSArIDFcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoIFsnSU5ERU5UJywgaSArIDJdXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvcndhcmQoMylcblxuICAgICAgICAgICAgIyBJbXBsaWNpdCBvYmplY3RzIHN0YXJ0IGhlcmVcbiAgICAgICAgICAgIGlmIHRhZyBpcyAnOidcbiAgICAgICAgICAgICAgICAjIEdvIGJhY2sgdG8gdGhlIChpbXBsaWNpdCkgc3RhcnQgb2YgdGhlIG9iamVjdFxuICAgICAgICAgICAgICAgIHMgPSBzd2l0Y2hcbiAgICAgICAgICAgICAgICAgICAgd2hlbiBAdGFnKGkgLSAxKSBpbiBFWFBSRVNTSU9OX0VORCB0aGVuIHN0YXJ0WzFdXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gQHRhZyhpIC0gMikgaXMgJ0AnIHRoZW4gaSAtIDJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpIC0gMVxuICAgICAgICAgICAgICAgIHMgLT0gMiB3aGlsZSBAdGFnKHMgLSAyKSBpcyAnSEVSRUNPTU1FTlQnXG5cbiAgICAgICAgICAgICAgICAjIE1hcmsgaWYgdGhlIHZhbHVlIGlzIGEgZm9yIGxvb3BcbiAgICAgICAgICAgICAgICBAaW5zaWRlRm9yRGVjbGFyYXRpb24gPSBuZXh0VGFnIGlzICdGT1InXG5cbiAgICAgICAgICAgICAgICBzdGFydHNMaW5lID0gcyBpcyAwIG9yIEB0YWcocyAtIDEpIGluIExJTkVCUkVBS1Mgb3IgdG9rZW5zW3MgLSAxXS5uZXdMaW5lXG4gICAgICAgICAgICAgICAgIyBBcmUgd2UganVzdCBjb250aW51aW5nIGFuIGFscmVhZHkgZGVjbGFyZWQgb2JqZWN0P1xuICAgICAgICAgICAgICAgIGlmIHN0YWNrVG9wKClcbiAgICAgICAgICAgICAgICAgICAgW3N0YWNrVGFnLCBzdGFja0lkeF0gPSBzdGFja1RvcCgpXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGFja1RhZyBpcyAneycgb3Igc3RhY2tUYWcgaXMgJ0lOREVOVCcgYW5kIEB0YWcoc3RhY2tJZHggLSAxKSBpcyAneycpIGFuZFxuICAgICAgICAgICAgICAgICAgICAgICAgIChzdGFydHNMaW5lIG9yIEB0YWcocyAtIDEpIGlzICcsJyBvciBAdGFnKHMgLSAxKSBpcyAneycpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm9yd2FyZCgxKVxuXG4gICAgICAgICAgICAgICAgc3RhcnRJbXBsaWNpdE9iamVjdChzLCAhIXN0YXJ0c0xpbmUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvcndhcmQoMilcblxuICAgICAgICAgICAgIyBFbmQgaW1wbGljaXQgY2FsbHMgd2hlbiBjaGFpbmluZyBtZXRob2QgY2FsbHNcbiAgICAgICAgICAgICMgbGlrZSBlLmcuOlxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyAgICAgICAgICAgZiAtPlxuICAgICAgICAgICAgIyAgICAgICAgICAgICAgIGFcbiAgICAgICAgICAgICMgICAgICAgICAgIC5nIGIsIC0+XG4gICAgICAgICAgICAjICAgICAgICAgICAgICAgY1xuICAgICAgICAgICAgIyAgICAgICAgICAgLmggYVxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyBhbmQgYWxzb1xuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyAgICAgICAgICAgZiBhXG4gICAgICAgICAgICAjICAgICAgICAgICAuZyBiXG4gICAgICAgICAgICAjICAgICAgICAgICAuaCBhXG5cbiAgICAgICAgICAgICMgTWFyayBhbGwgZW5jbG9zaW5nIG9iamVjdHMgYXMgbm90IHNhbWVMaW5lXG4gICAgICAgICAgICBpZiB0YWcgaW4gTElORUJSRUFLU1xuICAgICAgICAgICAgICAgIGZvciBzdGFja0l0ZW0gaW4gc3RhY2sgYnkgLTFcbiAgICAgICAgICAgICAgICAgICAgYnJlYWsgdW5sZXNzIGlzSW1wbGljaXQgc3RhY2tJdGVtXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrSXRlbVsyXS5zYW1lTGluZSA9IG5vIGlmIGlzSW1wbGljaXRPYmplY3Qgc3RhY2tJdGVtXG5cbiAgICAgICAgICAgIG5ld0xpbmUgPSBwcmV2VGFnIGlzICdPVVRERU5UJyBvciBwcmV2VG9rZW4ubmV3TGluZVxuICAgICAgICAgICAgaWYgdGFnIGluIElNUExJQ0lUX0VORCBvciB0YWcgaW4gQ0FMTF9DTE9TRVJTIGFuZCBuZXdMaW5lXG4gICAgICAgICAgICAgICAgd2hpbGUgaW5JbXBsaWNpdCgpXG4gICAgICAgICAgICAgICAgICAgIFtzdGFja1RhZywgc3RhY2tJZHgsIHtzYW1lTGluZSwgc3RhcnRzTGluZX1dID0gc3RhY2tUb3AoKVxuICAgICAgICAgICAgICAgICAgICAjIENsb3NlIGltcGxpY2l0IGNhbGxzIHdoZW4gcmVhY2hlZCBlbmQgb2YgYXJndW1lbnQgbGlzdFxuICAgICAgICAgICAgICAgICAgICBpZiBpbkltcGxpY2l0Q2FsbCgpIGFuZCBwcmV2VGFnICE9ICcsJ1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5kSW1wbGljaXRDYWxsKClcbiAgICAgICAgICAgICAgICAgICAgIyBDbG9zZSBpbXBsaWNpdCBvYmplY3RzIHN1Y2ggYXM6XG4gICAgICAgICAgICAgICAgICAgICMgcmV0dXJuIGE6IDEsIGI6IDIgdW5sZXNzIHRydWVcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBpbkltcGxpY2l0T2JqZWN0KCkgYW5kIG5vdCBAaW5zaWRlRm9yRGVjbGFyYXRpb24gYW5kIHNhbWVMaW5lIGFuZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnICE9ICdURVJNSU5BVE9SJyBhbmQgcHJldlRhZyAhPSAnOidcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZEltcGxpY2l0T2JqZWN0KClcbiAgICAgICAgICAgICAgICAgICAgIyBDbG9zZSBpbXBsaWNpdCBvYmplY3RzIHdoZW4gYXQgZW5kIG9mIGxpbmUsIGxpbmUgZGlkbid0IGVuZCB3aXRoIGEgY29tbWFcbiAgICAgICAgICAgICAgICAgICAgIyBhbmQgdGhlIGltcGxpY2l0IG9iamVjdCBkaWRuJ3Qgc3RhcnQgdGhlIGxpbmUgb3IgdGhlIG5leHQgbGluZSBkb2Vzbid0IGxvb2sgbGlrZVxuICAgICAgICAgICAgICAgICAgICAjIHRoZSBjb250aW51YXRpb24gb2YgYW4gb2JqZWN0LlxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGluSW1wbGljaXRPYmplY3QoKSBhbmQgdGFnIGlzICdURVJNSU5BVE9SJyBhbmQgcHJldlRhZyAhPSAnLCcgYW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3QgKHN0YXJ0c0xpbmUgYW5kIEBsb29rc09iamVjdGlzaChpICsgMSkpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm9yd2FyZCAxIGlmIG5leHRUYWcgaXMgJ0hFUkVDT01NRU5UJ1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5kSW1wbGljaXRPYmplY3QoKVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICAjIENsb3NlIGltcGxpY2l0IG9iamVjdCBpZiBjb21tYSBpcyB0aGUgbGFzdCBjaGFyYWN0ZXJcbiAgICAgICAgICAgICMgYW5kIHdoYXQgY29tZXMgYWZ0ZXIgZG9lc24ndCBsb29rIGxpa2UgaXQgYmVsb25ncy5cbiAgICAgICAgICAgICMgVGhpcyBpcyB1c2VkIGZvciB0cmFpbGluZyBjb21tYXMgYW5kIGNhbGxzLCBsaWtlOlxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyAgICAgICAgICAgeCA9XG4gICAgICAgICAgICAjICAgICAgICAgICAgICAgICAgIGE6IGIsXG4gICAgICAgICAgICAjICAgICAgICAgICAgICAgICAgIGM6IGQsXG4gICAgICAgICAgICAjICAgICAgICAgICBlID0gMlxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyBhbmRcbiAgICAgICAgICAgICNcbiAgICAgICAgICAgICMgICAgICAgICAgIGYgYSwgYjogYywgZDogZSwgZiwgZzogaDogaSwgalxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgaWYgdGFnIGlzICcsJyBhbmQgbm90IEBsb29rc09iamVjdGlzaChpICsgMSkgYW5kIGluSW1wbGljaXRPYmplY3QoKSBhbmRcbiAgICAgICAgICAgICAgICAgbm90IEBpbnNpZGVGb3JEZWNsYXJhdGlvbiBhbmRcbiAgICAgICAgICAgICAgICAgKG5leHRUYWcgIT0gJ1RFUk1JTkFUT1InIG9yIG5vdCBAbG9va3NPYmplY3Rpc2goaSArIDIpKVxuICAgICAgICAgICAgICAgICMgV2hlbiBuZXh0VGFnIGlzIE9VVERFTlQgdGhlIGNvbW1hIGlzIGluc2lnbmlmaWNhbnQgYW5kXG4gICAgICAgICAgICAgICAgIyBzaG91bGQganVzdCBiZSBpZ25vcmVkIHNvIGVtYmVkIGl0IGluIHRoZSBpbXBsaWNpdCBvYmplY3QuXG4gICAgICAgICAgICAgICAgI1xuICAgICAgICAgICAgICAgICMgV2hlbiBpdCBpc24ndCB0aGUgY29tbWEgZ28gb24gdG8gcGxheSBhIHJvbGUgaW4gYSBjYWxsIG9yXG4gICAgICAgICAgICAgICAgIyBhcnJheSBmdXJ0aGVyIHVwIHRoZSBzdGFjaywgc28gZ2l2ZSBpdCBhIGNoYW5jZS5cblxuICAgICAgICAgICAgICAgIG9mZnNldCA9IGlmIG5leHRUYWcgaXMgJ09VVERFTlQnIHRoZW4gMSBlbHNlIDBcbiAgICAgICAgICAgICAgICB3aGlsZSBpbkltcGxpY2l0T2JqZWN0KClcbiAgICAgICAgICAgICAgICAgICAgZW5kSW1wbGljaXRPYmplY3QgaSArIG9mZnNldFxuICAgICAgICAgICAgcmV0dXJuIGZvcndhcmQoMSlcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAgICAgIDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwICAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBjb25maWdQYXJhbWV0ZXJzOiAtPlxuICAgICAgICBcbiAgICAgICAgZ2VuZXJhdGUgICAgICAgPSBSZXdyaXRlci5nZW5lcmF0ZVxuICAgICAgICBkaWN0UGFyYW1TdGFydCA9IDBcbiAgICAgICAgZGljdFBhcmFtRW5kICAgPSAwXG4gICAgICAgIHN0YWNrQ291bnQgICAgID0gMFxuICAgICAgICBcbiAgICAgICAgaXNJbnNpZGUgPSAtPiBkaWN0UGFyYW1TdGFydCBhbmQgbm90IHN0YWNrQ291bnRcbiAgICAgICAgXG4gICAgICAgIEBzY2FuVG9rZW5zICh0b2tlbiwgaSwgdG9rZW5zKSAtPlxuXG4gICAgICAgICAgICBbdGFnXSAgICAgPSB0b2tlblxuICAgICAgICAgICAgW3ByZXZUYWddID0gcHJldlRva2VuID0gaWYgaSA+IDAgdGhlbiB0b2tlbnNbaSAtIDFdIGVsc2UgW11cbiAgICAgICAgICAgIFtuZXh0VGFnXSA9IGlmIGkgPCB0b2tlbnMubGVuZ3RoIC0gMSB0aGVuIHRva2Vuc1tpICsgMV0gZWxzZSBbXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiB0YWcgaXMgJ3snXG4gICAgICAgICAgICAgICAgaWYgcHJldlRhZyBpcyAnUEFSQU1fU1RBUlQnIFxuICAgICAgICAgICAgICAgICAgICBpZiBub3QgZGljdFBhcmFtU3RhcnRcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpY3RQYXJhbVN0YXJ0ID0gaVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFja0NvdW50KytcbiAgICAgICAgICAgICAgICBlbHNlIGlmIGRpY3RQYXJhbVN0YXJ0XG4gICAgICAgICAgICAgICAgICAgIHN0YWNrQ291bnQrK1xuICAgICAgICAgICAgZWxzZSBpZiB0YWcgaXMgJ30nXG4gICAgICAgICAgICAgICAgaWYgZGljdFBhcmFtU3RhcnQgXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vdCBzdGFja0NvdW50XG4gICAgICAgICAgICAgICAgICAgICAgICBkaWN0UGFyYW1FbmQgPSBpXG4gICAgICAgICAgICAgICAgICAgICAgICBkaWN0UGFyYW1TdGFydCA9IDBcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2tDb3VudC0tXG4gICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgIGlmIGlzSW5zaWRlKClcbiAgICAgICAgICAgICAgICAgICAgaWYgdGFnID09ICc6J1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbmV4dFRhZyBub3QgaW4gWydJREVOVElGSUVSJywgJ0AnXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbCA9IHRva2Vuc1tpLTFdWzFdICMgY29weSB2YWx1ZSBmcm9tIHByb3BlcnR5IHRva2VuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgQHRhZyhpLTIpID09ICdAJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbdGhpc1Rva2VuXSA9IHRva2Vucy5zcGxpY2UgaS0yLCAxICMgcHVsbCB0aGUgQCBvdXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpLCAgIDAsIHRoaXNUb2tlbiAgICAjIGluc2VydCBpdCBhZnRlciA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSsxLCAwLCBnZW5lcmF0ZSAnPScsICc9JywgdG9rZW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpKzEsIDAsIGdlbmVyYXRlICdQUk9QRVJUWScsIHZhbCwgdG9rZW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSsxLCAwLCBnZW5lcmF0ZSAnPScsICc9JywgdG9rZW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpKzEsIDAsIGdlbmVyYXRlICdJREVOVElGSUVSJywgdmFsLCB0b2tlblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAyXG4gICAgICAgICAgICAgICAgICAgIGlmIHRhZyA9PSAnPSdcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIG5leHRUYWcgaW4gWycsJywgJ30nXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSsxLCAwLCBnZW5lcmF0ZSAnTlVMTCcsICdudWxsJywgdG9rZW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMlxuICAgICAgICAgICAgMVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgIyBBZGQgbG9jYXRpb24gZGF0YSB0byBhbGwgdG9rZW5zIGdlbmVyYXRlZCBieSB0aGUgcmV3cml0ZXIuXG4gICAgXG4gICAgYWRkTG9jYXRpb25EYXRhVG9HZW5lcmF0ZWRUb2tlbnM6IC0+XG4gICAgICAgIEBzY2FuVG9rZW5zICh0b2tlbiwgaSwgdG9rZW5zKSAtPlxuICAgICAgICAgICAgcmV0dXJuIDEgaWYgdG9rZW5bMl1cbiAgICAgICAgICAgIHJldHVybiAxIHVubGVzcyB0b2tlbi5nZW5lcmF0ZWQgb3IgdG9rZW4uZXhwbGljaXRcbiAgICAgICAgICAgIGlmIHRva2VuWzBdIGlzICd7JyBhbmQgbmV4dExvY2F0aW9uPXRva2Vuc1tpICsgMV0/WzJdXG4gICAgICAgICAgICAgICAge2ZpcnN0X2xpbmU6IGxpbmUsIGZpcnN0X2NvbHVtbjogY29sdW1ufSA9IG5leHRMb2NhdGlvblxuICAgICAgICAgICAgZWxzZSBpZiBwcmV2TG9jYXRpb24gPSB0b2tlbnNbaSAtIDFdP1syXVxuICAgICAgICAgICAgICAgIHtsYXN0X2xpbmU6IGxpbmUsIGxhc3RfY29sdW1uOiBjb2x1bW59ID0gcHJldkxvY2F0aW9uXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgbGluZSA9IGNvbHVtbiA9IDBcbiAgICAgICAgICAgIHRva2VuWzJdID1cbiAgICAgICAgICAgICAgICBmaXJzdF9saW5lOiAgIGxpbmVcbiAgICAgICAgICAgICAgICBmaXJzdF9jb2x1bW46IGNvbHVtblxuICAgICAgICAgICAgICAgIGxhc3RfbGluZTogICAgbGluZVxuICAgICAgICAgICAgICAgIGxhc3RfY29sdW1uOiAgY29sdW1uXG4gICAgICAgICAgICByZXR1cm4gMVxuXG4gICAgIyBPVVRERU5UIHRva2VucyBzaG91bGQgYWx3YXlzIGJlIHBvc2l0aW9uZWQgYXQgdGhlIGxhc3QgY2hhcmFjdGVyIG9mIHRoZVxuICAgICMgcHJldmlvdXMgdG9rZW4sIHNvIHRoYXQgQVNUIG5vZGVzIGVuZGluZyBpbiBhbiBPVVRERU5UIHRva2VuIGVuZCB1cCB3aXRoIGFcbiAgICAjIGxvY2F0aW9uIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGxhc3QgXCJyZWFsXCIgdG9rZW4gdW5kZXIgdGhlIG5vZGUuXG4gICAgZml4T3V0ZGVudExvY2F0aW9uRGF0YTogLT5cbiAgICAgICAgQHNjYW5Ub2tlbnMgKHRva2VuLCBpLCB0b2tlbnMpIC0+XG4gICAgICAgICAgICByZXR1cm4gMSB1bmxlc3MgdG9rZW5bMF0gaXMgJ09VVERFTlQnIG9yXG4gICAgICAgICAgICAgICAgKHRva2VuLmdlbmVyYXRlZCBhbmQgdG9rZW5bMF0gaXMgJ0NBTExfRU5EJykgb3JcbiAgICAgICAgICAgICAgICAodG9rZW4uZ2VuZXJhdGVkIGFuZCB0b2tlblswXSBpcyAnfScpXG4gICAgICAgICAgICBwcmV2TG9jYXRpb25EYXRhID0gdG9rZW5zW2kgLSAxXVsyXVxuICAgICAgICAgICAgdG9rZW5bMl0gPVxuICAgICAgICAgICAgICAgIGZpcnN0X2xpbmU6ICAgcHJldkxvY2F0aW9uRGF0YS5sYXN0X2xpbmVcbiAgICAgICAgICAgICAgICBmaXJzdF9jb2x1bW46IHByZXZMb2NhdGlvbkRhdGEubGFzdF9jb2x1bW5cbiAgICAgICAgICAgICAgICBsYXN0X2xpbmU6ICAgIHByZXZMb2NhdGlvbkRhdGEubGFzdF9saW5lXG4gICAgICAgICAgICAgICAgbGFzdF9jb2x1bW46ICBwcmV2TG9jYXRpb25EYXRhLmxhc3RfY29sdW1uXG4gICAgICAgICAgICByZXR1cm4gMVxuXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwICAgIDAwMCAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgXG4gICAgIyBCZWNhdXNlIG91ciBncmFtbWFyIGlzIExBTFIoMSksIGl0IGNhbid0IGhhbmRsZSBzb21lIHNpbmdsZS1saW5lXG4gICAgIyBleHByZXNzaW9ucyB0aGF0IGxhY2sgZW5kaW5nIGRlbGltaXRlcnMuIFRoZSAqKlJld3JpdGVyKiogYWRkcyB0aGUgaW1wbGljaXRcbiAgICAjIGJsb2Nrcywgc28gaXQgZG9lc24ndCBuZWVkIHRvLiBUbyBrZWVwIHRoZSBncmFtbWFyIGNsZWFuIGFuZCB0aWR5LCB0cmFpbGluZ1xuICAgICMgbmV3bGluZXMgd2l0aGluIGV4cHJlc3Npb25zIGFyZSByZW1vdmVkIGFuZCB0aGUgaW5kZW50YXRpb24gdG9rZW5zIG9mIGVtcHR5XG4gICAgIyBibG9ja3MgYXJlIGFkZGVkLlxuICAgIFxuICAgIG5vcm1hbGl6ZUxpbmVzOiAtPlxuICAgICAgICBzdGFydGVyID0gaW5kZW50ID0gb3V0ZGVudCA9IG51bGxcblxuICAgICAgICBjb25kaXRpb24gPSAodG9rZW4sIGkpIC0+XG4gICAgICAgICAgICB0b2tlblsxXSAhPSAnOycgYW5kIHRva2VuWzBdIGluIFNJTkdMRV9DTE9TRVJTIGFuZFxuICAgICAgICAgICAgbm90ICh0b2tlblswXSBpcyAnVEVSTUlOQVRPUicgYW5kIEB0YWcoaSArIDEpIGluIEVYUFJFU1NJT05fQ0xPU0UpIGFuZFxuICAgICAgICAgICAgbm90ICh0b2tlblswXSBpcyAnRUxTRScgYW5kIHN0YXJ0ZXIgIT0gJ1RIRU4nKSBhbmRcbiAgICAgICAgICAgIG5vdCAodG9rZW5bMF0gaW4gWydDQVRDSCcsICdGSU5BTExZJ10gYW5kIHN0YXJ0ZXIgaW4gWyctPicsICc9PiddKSBvclxuICAgICAgICAgICAgdG9rZW5bMF0gaW4gQ0FMTF9DTE9TRVJTIGFuZFxuICAgICAgICAgICAgKEB0b2tlbnNbaSAtIDFdLm5ld0xpbmUgb3IgQHRva2Vuc1tpIC0gMV1bMF0gaXMgJ09VVERFTlQnKVxuXG4gICAgICAgIGFjdGlvbiA9ICh0b2tlbiwgaSkgLT5cbiAgICAgICAgICAgIEB0b2tlbnMuc3BsaWNlIChpZiBAdGFnKGkgLSAxKSBpcyAnLCcgdGhlbiBpIC0gMSBlbHNlIGkpLCAwLCBvdXRkZW50XG5cbiAgICAgICAgQHNjYW5Ub2tlbnMgKHRva2VuLCBpLCB0b2tlbnMpIC0+XG4gICAgICAgICAgICBbdGFnXSA9IHRva2VuXG4gICAgICAgICAgICBpZiB0YWcgaXMgJ1RFUk1JTkFUT1InXG4gICAgICAgICAgICAgICAgaWYgQHRhZyhpICsgMSkgaXMgJ0VMU0UnIGFuZCBAdGFnKGkgLSAxKSAhPSAnT1VUREVOVCdcbiAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpLCAxLCBAaW5kZW50YXRpb24oKS4uLlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMVxuICAgICAgICAgICAgICAgIGlmIEB0YWcoaSArIDEpIGluIEVYUFJFU1NJT05fQ0xPU0VcbiAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpLCAxXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgICAgICBpZiB0YWcgaXMgJ0NBVENIJ1xuICAgICAgICAgICAgICAgIGZvciBqIGluIFsxLi4yXSB3aGVuIEB0YWcoaSArIGopIGluIFsnT1VUREVOVCcsICdURVJNSU5BVE9SJywgJ0ZJTkFMTFknXVxuICAgICAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGkgKyBqLCAwLCBAaW5kZW50YXRpb24oKS4uLlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMiArIGpcbiAgICAgICAgICAgIGlmIHRhZyBpbiBTSU5HTEVfTElORVJTIGFuZCBAdGFnKGkgKyAxKSAhPSAnSU5ERU5UJyBhbmRcbiAgICAgICAgICAgICAgICAgbm90ICh0YWcgaXMgJ0VMU0UnIGFuZCBAdGFnKGkgKyAxKSBpcyAnSUYnKVxuICAgICAgICAgICAgICAgIHN0YXJ0ZXIgPSB0YWdcbiAgICAgICAgICAgICAgICBbaW5kZW50LCBvdXRkZW50XSA9IEBpbmRlbnRhdGlvbiB0b2tlbnNbaV1cbiAgICAgICAgICAgICAgICBpbmRlbnQuZnJvbVRoZW4gICAgID0gdHJ1ZSBpZiBzdGFydGVyIGlzICdUSEVOJ1xuICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSArIDEsIDAsIGluZGVudFxuICAgICAgICAgICAgICAgIEBkZXRlY3RFbmQgaSArIDIsIGNvbmRpdGlvbiwgYWN0aW9uXG4gICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpLCAxIGlmIHRhZyBpcyAnVEhFTidcbiAgICAgICAgICAgICAgICByZXR1cm4gMVxuICAgICAgICAgICAgcmV0dXJuIDFcblxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAwMDAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAgICAgMDAwICAgIDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICAjIFRhZyBwb3N0Zml4IGNvbmRpdGlvbmFscyBhcyBzdWNoLCBzbyB0aGF0IHdlIGNhbiBwYXJzZSB0aGVtIHdpdGggYVxuICAgICMgZGlmZmVyZW50IHByZWNlZGVuY2UuXG4gICAgXG4gICAgdGFnUG9zdGZpeENvbmRpdGlvbmFsczogLT5cblxuICAgICAgICBvcmlnaW5hbCA9IG51bGxcblxuICAgICAgICBjb25kaXRpb24gPSAodG9rZW4sIGkpIC0+XG4gICAgICAgICAgICBbdGFnXSA9IHRva2VuXG4gICAgICAgICAgICBbcHJldlRhZ10gPSBAdG9rZW5zW2kgLSAxXVxuICAgICAgICAgICAgdGFnIGlzICdURVJNSU5BVE9SJyBvciAodGFnIGlzICdJTkRFTlQnIGFuZCBwcmV2VGFnIG5vdCBpbiBTSU5HTEVfTElORVJTKVxuXG4gICAgICAgIGFjdGlvbiA9ICh0b2tlbiwgaSkgLT5cbiAgICAgICAgICAgIGlmIHRva2VuWzBdICE9ICdJTkRFTlQnIG9yICh0b2tlbi5nZW5lcmF0ZWQgYW5kIG5vdCB0b2tlbi5mcm9tVGhlbilcbiAgICAgICAgICAgICAgICBvcmlnaW5hbFswXSA9ICdQT1NUXycgKyBvcmlnaW5hbFswXVxuXG4gICAgICAgIEBzY2FuVG9rZW5zICh0b2tlbiwgaSkgLT5cbiAgICAgICAgICAgIHJldHVybiAxIHVubGVzcyB0b2tlblswXSBpcyAnSUYnXG4gICAgICAgICAgICBvcmlnaW5hbCA9IHRva2VuXG4gICAgICAgICAgICBAZGV0ZWN0RW5kIGkgKyAxLCBjb25kaXRpb24sIGFjdGlvblxuICAgICAgICAgICAgcmV0dXJuIDFcblxuICAgICMgR2VuZXJhdGUgdGhlIGluZGVudGF0aW9uIHRva2VucywgYmFzZWQgb24gYW5vdGhlciB0b2tlbiBvbiB0aGUgc2FtZSBsaW5lLlxuICAgIFxuICAgIGluZGVudGF0aW9uOiAob3JpZ2luKSAtPlxuICAgICAgICBcbiAgICAgICAgaW5kZW50ICA9IFsnSU5ERU5UJywgNF1cbiAgICAgICAgb3V0ZGVudCA9IFsnT1VUREVOVCcsIDRdXG4gICAgICAgIGlmIG9yaWdpblxuICAgICAgICAgICAgaW5kZW50LmdlbmVyYXRlZCA9IG91dGRlbnQuZ2VuZXJhdGVkID0geWVzXG4gICAgICAgICAgICBpbmRlbnQub3JpZ2luID0gb3V0ZGVudC5vcmlnaW4gPSBvcmlnaW5cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaW5kZW50LmV4cGxpY2l0ID0gb3V0ZGVudC5leHBsaWNpdCA9IHllc1xuICAgICAgICBbaW5kZW50LCBvdXRkZW50XVxuXG4gICAgIyBDcmVhdGUgYSBnZW5lcmF0ZWQgdG9rZW46IG9uZSB0aGF0IGV4aXN0cyBkdWUgdG8gYSB1c2Ugb2YgaW1wbGljaXQgc3ludGF4LlxuICAgIFxuICAgIEBnZW5lcmF0ZTogKHRhZywgdmFsdWUsIG9yaWdpbikgLT5cbiAgICAgICAgdG9rID0gW3RhZywgdmFsdWVdXG4gICAgICAgIHRvay5nZW5lcmF0ZWQgPSB5ZXNcbiAgICAgICAgdG9rLm9yaWdpbiA9IG9yaWdpbiBpZiBvcmlnaW5cbiAgICAgICAgdG9rXG5cbiAgICB0YWc6IChpKSAtPiBAdG9rZW5zW2ldP1swXSAjIExvb2sgdXAgYSB0YWcgYnkgdG9rZW4gaW5kZXguXG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuXG4jIExpc3Qgb2YgdGhlIHRva2VuIHBhaXJzIHRoYXQgbXVzdCBiZSBiYWxhbmNlZC5cblxuQkFMQU5DRURfUEFJUlMgPSBbXG4gICAgWycoJywgJyknXVxuICAgIFsnWycsICddJ11cbiAgICBbJ3snLCAnfSddXG4gICAgWydJTkRFTlQnLCAnT1VUREVOVCddLFxuICAgIFsnQ0FMTF9TVEFSVCcsICdDQUxMX0VORCddXG4gICAgWydQQVJBTV9TVEFSVCcsICdQQVJBTV9FTkQnXVxuICAgIFsnSU5ERVhfU1RBUlQnLCAnSU5ERVhfRU5EJ11cbiAgICBbJ1NUUklOR19TVEFSVCcsICdTVFJJTkdfRU5EJ11cbiAgICBbJ1JFR0VYX1NUQVJUJywgJ1JFR0VYX0VORCddXG5dXG5cbiMgVGhlIGludmVyc2UgbWFwcGluZ3Mgb2YgYEJBTEFOQ0VEX1BBSVJTYCB3ZSdyZSB0cnlpbmcgdG8gZml4IHVwLCBzbyB3ZSBjYW4gbG9vayB0aGluZ3MgdXAgZnJvbSBlaXRoZXIgZW5kLlxuXG5leHBvcnRzLklOVkVSU0VTID0gSU5WRVJTRVMgPSB7fVxuZXhwb3J0cy5SZXdyaXRlciA9IFJld3JpdGVyXG5cbiMgVGhlIHRva2VucyB0aGF0IHNpZ25hbCB0aGUgc3RhcnQvZW5kIG9mIGEgYmFsYW5jZWQgcGFpci5cbkVYUFJFU1NJT05fU1RBUlQgPSBbXVxuRVhQUkVTU0lPTl9FTkQgICA9IFtdXG5cbmZvciBbbGVmdCwgcml0ZV0gaW4gQkFMQU5DRURfUEFJUlNcbiAgICBFWFBSRVNTSU9OX1NUQVJULnB1c2ggSU5WRVJTRVNbcml0ZV0gPSBsZWZ0XG4gICAgRVhQUkVTU0lPTl9FTkQgIC5wdXNoIElOVkVSU0VTW2xlZnRdID0gcml0ZVxuXG4jIFRva2VucyB0aGF0IGluZGljYXRlIHRoZSBjbG9zZSBvZiBhIGNsYXVzZSBvZiBhbiBleHByZXNzaW9uLlxuRVhQUkVTU0lPTl9DTE9TRSA9IFsnQ0FUQ0gnLCAnVEhFTicsICdFTFNFJywgJ0ZJTkFMTFknXS5jb25jYXQgRVhQUkVTU0lPTl9FTkRcblxuIyBUb2tlbnMgdGhhdCwgaWYgZm9sbG93ZWQgYnkgYW4gYElNUExJQ0lUX0NBTExgLCBpbmRpY2F0ZSBhIGZ1bmN0aW9uIGludm9jYXRpb24uXG5JTVBMSUNJVF9GVU5DID0gWydJREVOVElGSUVSJywgJ1BST1BFUlRZJywgJ1NVUEVSJywgJyknLCAnQ0FMTF9FTkQnLCAnXScsICdJTkRFWF9FTkQnLCAnQCcsICdUSElTJ11cblxuIyBJZiBwcmVjZWRlZCBieSBhbiBgSU1QTElDSVRfRlVOQ2AsIGluZGljYXRlcyBhIGZ1bmN0aW9uIGludm9jYXRpb24uXG5JTVBMSUNJVF9DQUxMID0gW1xuICAgICdJREVOVElGSUVSJywgJ1BST1BFUlRZJywgJ05VTUJFUicsICdJTkZJTklUWScsICdOQU4nXG4gICAgJ1NUUklORycsICdTVFJJTkdfU1RBUlQnLCAnUkVHRVgnLCAnUkVHRVhfU1RBUlQnLCAnSlMnXG4gICAgJ05FVycsICdQQVJBTV9TVEFSVCcsICdDTEFTUycsICdJRicsICdUUlknLCAnU1dJVENIJywgJ1RISVMnXG4gICAgJ1VOREVGSU5FRCcsICdOVUxMJywgJ0JPT0wnXG4gICAgJ1VOQVJZJywgJ1lJRUxEJywgJ1VOQVJZX01BVEgnLCAnU1VQRVInLCAnVEhST1cnXG4gICAgJ0AnLCAnLT4nLCAnPT4nLCAnWycsICcoJywgJ3snLCAnLS0nLCAnKysnXG5dXG5cbklNUExJQ0lUX1VOU1BBQ0VEX0NBTEwgPSBbJysnLCAnLSddXG5cbiMgVG9rZW5zIHRoYXQgYWx3YXlzIG1hcmsgdGhlIGVuZCBvZiBhbiBpbXBsaWNpdCBjYWxsIGZvciBzaW5nbGUtbGluZXJzLlxuSU1QTElDSVRfRU5EICAgICAgICAgPSBbJ1BPU1RfSUYnLCAnRk9SJywgJ1dISUxFJywgJ1VOVElMJywgJ1dIRU4nLCAnQlknLFxuICAgICdMT09QJywgJ1RFUk1JTkFUT1InXVxuXG4jIFNpbmdsZS1saW5lIGZsYXZvcnMgb2YgYmxvY2sgZXhwcmVzc2lvbnMgdGhhdCBoYXZlIHVuY2xvc2VkIGVuZGluZ3MuXG4jIFRoZSBncmFtbWFyIGNhbid0IGRpc2FtYmlndWF0ZSB0aGVtLCBzbyB3ZSBpbnNlcnQgdGhlIGltcGxpY2l0IGluZGVudGF0aW9uLlxuU0lOR0xFX0xJTkVSUyAgICAgICAgPSBbJ0VMU0UnLCAnLT4nLCAnPT4nLCAnVFJZJywgJ0ZJTkFMTFknLCAnVEhFTiddXG5TSU5HTEVfQ0xPU0VSUyAgID0gWydURVJNSU5BVE9SJywgJ0NBVENIJywgJ0ZJTkFMTFknLCAnRUxTRScsICdPVVRERU5UJywgJ0xFQURJTkdfV0hFTiddXG5cbiMgVG9rZW5zIHRoYXQgZW5kIGEgbGluZS5cbkxJTkVCUkVBS1MgICAgICAgICAgID0gWydURVJNSU5BVE9SJywgJ0lOREVOVCcsICdPVVRERU5UJ11cblxuIyBUb2tlbnMgdGhhdCBjbG9zZSBvcGVuIGNhbGxzIHdoZW4gdGhleSBmb2xsb3cgYSBuZXdsaW5lLlxuQ0FMTF9DTE9TRVJTICAgICAgICAgPSBbJy4nLCAnPy4nLCAnOjonLCAnPzo6J11cbiJdfQ==
//# sourceURL=../src/rewriter.coffee