
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

    Rewriter.prototype.rewrite = function(tokens1, opts) {
        var ref, ref1, ref2;
        this.tokens = tokens1;
        this.removeLeadingNewlines();
        if ((opts != null ? (ref = opts.feature) != null ? ref['constructor-shortcut'] : void 0 : void 0) !== false) {
            this.constructorShortcut();
        }
        this.closeOpenCalls();
        this.closeOpenIndexes();
        this.normalizeLines();
        this.tagPostfixConditionals();
        this.addImplicitBracesAndParens();
        if ((opts != null ? (ref1 = opts.feature) != null ? ref1['config-parameters'] : void 0 : void 0) !== false) {
            this.configParameters();
        }
        if ((opts != null ? (ref2 = opts.feature) != null ? ref2['negative-index'] : void 0 : void 0) !== false) {
            this.negativeIndex();
        }
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
            var generate, ref, ref1;
            generate = Rewriter.generate;
            if (this.check(i - 1, 'INDEX_START', i, '-', i + 1, 'NUMBER', i + 2, 'INDEX_END')) {
                if (this.tag(i - 2) === 'IDENTIFIER') {
                    tokens.splice(i, 0, generate(tokens[i - 2][0], tokens[i - 2][1], token), generate('.', '.', token), generate('PROPERTY', 'length', token));
                    return 5;
                }
                if ((ref = this.tag(i - 2)) === 'STRING' || ref === 'STRING_END' || ref === ']' || ref === ')') {
                    tokens.splice(i + 2, 0, generate('..', '..', token), generate(tokens[i][0], tokens[i][1], token), generate(tokens[i + 1][0], tokens[i + 1][1], token));
                    if ((ref1 = this.tag(i - 2)) === ']' || ref1 === ')') {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmV3cml0ZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7OztBQUFBLElBQUEsaVBBQUE7SUFBQTs7O0FBUUEsR0FBQSxHQUFNLE9BQU8sQ0FBQzs7QUFVUjs7O3VCQVFGLE9BQUEsR0FBUyxTQUFDLE9BQUQsRUFBVSxJQUFWO0FBTUwsWUFBQTtRQU5NLElBQUMsQ0FBQSxTQUFEO1FBTU4sSUFBQyxDQUFBLHFCQUFELENBQUE7UUFFQSxzREFBeUMsQ0FBQSxzQkFBQSxvQkFBZixLQUEwQyxLQUFwRTtZQUFBLElBQUMsQ0FBQSxtQkFBRCxDQUFBLEVBQUE7O1FBRUEsSUFBQyxDQUFBLGNBQUQsQ0FBQTtRQUNBLElBQUMsQ0FBQSxnQkFBRCxDQUFBO1FBQ0EsSUFBQyxDQUFBLGNBQUQsQ0FBQTtRQUNBLElBQUMsQ0FBQSxzQkFBRCxDQUFBO1FBQ0EsSUFBQyxDQUFBLDBCQUFELENBQUE7UUFFQSx3REFBeUMsQ0FBQSxtQkFBQSxvQkFBZixLQUF1QyxLQUFqRTtZQUFBLElBQUMsQ0FBQSxnQkFBRCxDQUFBLEVBQUE7O1FBQ0Esd0RBQXlDLENBQUEsZ0JBQUEsb0JBQWYsS0FBdUMsS0FBakU7WUFBQSxJQUFDLENBQUEsYUFBRCxDQUFBLEVBQUE7O1FBRUEsSUFBQyxDQUFBLGdDQUFELENBQUE7UUFDQSxJQUFDLENBQUEsc0JBQUQsQ0FBQTtlQUNBLElBQUMsQ0FBQTtJQXJCSTs7dUJBNkJULFVBQUEsR0FBWSxTQUFDLEtBQUQ7QUFFUixZQUFBO1FBQUMsU0FBVTtRQUNYLENBQUEsR0FBSTtBQUNtQyxlQUFNLEtBQUEsR0FBUSxNQUFPLENBQUEsQ0FBQSxDQUFyQjtZQUF2QyxDQUFBLElBQUssS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFYLEVBQWlCLEtBQWpCLEVBQXdCLENBQXhCLEVBQTJCLE1BQTNCO1FBQWtDO2VBQ3ZDO0lBTFE7O3VCQU9aLFNBQUEsR0FBVyxTQUFDLENBQUQsRUFBSSxT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R3pCLFlBQUEsR0FBdUIsQ0FBQyxTQUFELEVBQVksS0FBWixFQUFtQixPQUFuQixFQUE0QixPQUE1QixFQUFxQyxNQUFyQyxFQUE2QyxJQUE3QyxFQUNuQixNQURtQixFQUNYLFlBRFc7O0FBS3ZCLGFBQUEsR0FBdUIsQ0FBQyxNQUFELEVBQVMsSUFBVCxFQUFlLElBQWYsRUFBcUIsS0FBckIsRUFBNEIsU0FBNUIsRUFBdUMsTUFBdkM7O0FBQ3ZCLGNBQUEsR0FBbUIsQ0FBQyxZQUFELEVBQWUsT0FBZixFQUF3QixTQUF4QixFQUFtQyxNQUFuQyxFQUEyQyxTQUEzQyxFQUFzRCxjQUF0RDs7QUFHbkIsVUFBQSxHQUF1QixDQUFDLFlBQUQsRUFBZSxRQUFmLEVBQXlCLFNBQXpCOztBQUd2QixZQUFBLEdBQXVCLENBQUMsR0FBRCxFQUFNLElBQU4sRUFBWSxJQUFaLEVBQWtCLEtBQWxCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuMDAwICAgMDAwICAwMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbjAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4wMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuMDAwICAgMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiMjI1xuXG5sb2cgPSBjb25zb2xlLmxvZ1xuXG4jIFRoZSBsYW5ndWFnZSBoYXMgYSBnb29kIGRlYWwgb2Ygb3B0aW9uYWwgc3ludGF4LCBpbXBsaWNpdCBzeW50YXgsXG4jIGFuZCBzaG9ydGhhbmQgc3ludGF4LiBUaGlzIGNhbiBncmVhdGx5IGNvbXBsaWNhdGUgYSBncmFtbWFyIGFuZCBibG9hdFxuIyB0aGUgcmVzdWx0aW5nIHBhcnNlIHRhYmxlLiBJbnN0ZWFkIG9mIG1ha2luZyB0aGUgcGFyc2VyIGhhbmRsZSBpdCBhbGwsIHdlIHRha2VcbiMgYSBzZXJpZXMgb2YgcGFzc2VzIG92ZXIgdGhlIHRva2VuIHN0cmVhbSwgdXNpbmcgdGhpcyAqKlJld3JpdGVyKiogdG8gY29udmVydFxuIyBzaG9ydGhhbmQgaW50byB0aGUgdW5hbWJpZ3VvdXMgbG9uZyBmb3JtLCBhZGQgaW1wbGljaXQgaW5kZW50YXRpb24gYW5kXG4jIHBhcmVudGhlc2VzLCBhbmQgZ2VuZXJhbGx5IGNsZWFuIHRoaW5ncyB1cC5cbiMgVGhlIFJld3JpdGVyIGlzIHVzZWQgYnkgdGhlIExleGVyLCBkaXJlY3RseSBhZ2FpbnN0IGl0cyBpbnRlcm5hbCBhcnJheSBvZiB0b2tlbnMuXG5cbmNsYXNzIFJld3JpdGVyXG5cbiAgICAjIFJld3JpdGUgdGhlIHRva2VuIHN0cmVhbSBpbiBtdWx0aXBsZSBwYXNzZXMsIG9uZSBsb2dpY2FsIGZpbHRlciBhdFxuICAgICMgYSB0aW1lLiBUaGlzIGNvdWxkIGNlcnRhaW5seSBiZSBjaGFuZ2VkIGludG8gYSBzaW5nbGUgcGFzcyB0aHJvdWdoIHRoZVxuICAgICMgc3RyZWFtLCB3aXRoIGEgYmlnIG9sJyBlZmZpY2llbnQgc3dpdGNoLCBidXQgaXQncyBtdWNoIG5pY2VyIHRvIHdvcmsgd2l0aFxuICAgICMgbGlrZSB0aGlzLiBUaGUgb3JkZXIgb2YgdGhlc2UgcGFzc2VzIG1hdHRlcnMgLS0gaW5kZW50YXRpb24gbXVzdCBiZVxuICAgICMgY29ycmVjdGVkIGJlZm9yZSBpbXBsaWNpdCBwYXJlbnRoZXNlcyBjYW4gYmUgd3JhcHBlZCBhcm91bmQgYmxvY2tzIG9mIGNvZGUuXG4gICAgXG4gICAgcmV3cml0ZTogKEB0b2tlbnMsIG9wdHMpIC0+XG4gICAgICAgIFxuICAgICAgICAjIGxvZyAnUmV3cml0ZXIucmV3cml0ZScsIG9wdHNcbiAgICAgICAgIyBIZWxwZnVsIHNuaXBwZXQgZm9yIGRlYnVnZ2luZzpcbiAgICAgICAgIyBjb25zb2xlLmxvZyAodFswXSArICcvJyArIHRbMV0gZm9yIHQgaW4gQHRva2Vucykuam9pbiAnICdcbiAgICAgICAgICAgIFxuICAgICAgICBAcmVtb3ZlTGVhZGluZ05ld2xpbmVzKClcbiAgICAgICAgXG4gICAgICAgIEBjb25zdHJ1Y3RvclNob3J0Y3V0KCkgaWYgb3B0cz8uZmVhdHVyZT9bJ2NvbnN0cnVjdG9yLXNob3J0Y3V0J10gIT0gZmFsc2UgIyBrb2ZmZWVcbiAgICAgICAgXG4gICAgICAgIEBjbG9zZU9wZW5DYWxscygpXG4gICAgICAgIEBjbG9zZU9wZW5JbmRleGVzKClcbiAgICAgICAgQG5vcm1hbGl6ZUxpbmVzKClcbiAgICAgICAgQHRhZ1Bvc3RmaXhDb25kaXRpb25hbHMoKVxuICAgICAgICBAYWRkSW1wbGljaXRCcmFjZXNBbmRQYXJlbnMoKVxuICAgICAgICBcbiAgICAgICAgQGNvbmZpZ1BhcmFtZXRlcnMoKSAgICBpZiBvcHRzPy5mZWF0dXJlP1snY29uZmlnLXBhcmFtZXRlcnMnXSAhPSBmYWxzZSAjIGtvZmZlZVxuICAgICAgICBAbmVnYXRpdmVJbmRleCgpICAgICAgIGlmIG9wdHM/LmZlYXR1cmU/WyduZWdhdGl2ZS1pbmRleCddICAgICE9IGZhbHNlICMga29mZmVlXG4gICAgICAgIFxuICAgICAgICBAYWRkTG9jYXRpb25EYXRhVG9HZW5lcmF0ZWRUb2tlbnMoKVxuICAgICAgICBAZml4T3V0ZGVudExvY2F0aW9uRGF0YSgpICAgXG4gICAgICAgIEB0b2tlbnNcblxuICAgICMgUmV3cml0ZSB0aGUgdG9rZW4gc3RyZWFtLCBsb29raW5nIG9uZSB0b2tlbiBhaGVhZCBhbmQgYmVoaW5kLlxuICAgICMgQWxsb3cgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgYmxvY2sgdG8gdGVsbCB1cyBob3cgbWFueSB0b2tlbnMgdG8gbW92ZVxuICAgICMgZm9yd2FyZHMgKG9yIGJhY2t3YXJkcykgaW4gdGhlIHN0cmVhbSwgdG8gbWFrZSBzdXJlIHdlIGRvbid0IG1pc3MgYW55dGhpbmdcbiAgICAjIGFzIHRva2VucyBhcmUgaW5zZXJ0ZWQgYW5kIHJlbW92ZWQsIGFuZCB0aGUgc3RyZWFtIGNoYW5nZXMgbGVuZ3RoIHVuZGVyXG4gICAgIyBvdXIgZmVldC5cbiAgICBcbiAgICBzY2FuVG9rZW5zOiAoYmxvY2spIC0+XG4gICAgICAgIFxuICAgICAgICB7dG9rZW5zfSA9IHRoaXNcbiAgICAgICAgaSA9IDBcbiAgICAgICAgaSArPSBibG9jay5jYWxsIHRoaXMsIHRva2VuLCBpLCB0b2tlbnMgd2hpbGUgdG9rZW4gPSB0b2tlbnNbaV1cbiAgICAgICAgdHJ1ZVxuXG4gICAgZGV0ZWN0RW5kOiAoaSwgY29uZGl0aW9uLCBhY3Rpb24pIC0+XG4gICAgICAgIFxuICAgICAgICB7dG9rZW5zfSA9IHRoaXNcbiAgICAgICAgbGV2ZWxzID0gMFxuICAgICAgICB3aGlsZSB0b2tlbiA9IHRva2Vuc1tpXVxuICAgICAgICAgICAgcmV0dXJuIGFjdGlvbi5jYWxsIHRoaXMsIHRva2VuLCBpIGlmIGxldmVscyBpcyAwIGFuZCBjb25kaXRpb24uY2FsbCB0aGlzLCB0b2tlbiwgaVxuICAgICAgICAgICAgcmV0dXJuIGFjdGlvbi5jYWxsIHRoaXMsIHRva2VuLCBpIC0gMSBpZiBub3QgdG9rZW4gb3IgbGV2ZWxzIDwgMFxuICAgICAgICAgICAgaWYgdG9rZW5bMF0gaW4gRVhQUkVTU0lPTl9TVEFSVFxuICAgICAgICAgICAgICAgIGxldmVscyArPSAxXG4gICAgICAgICAgICBlbHNlIGlmIHRva2VuWzBdIGluIEVYUFJFU1NJT05fRU5EXG4gICAgICAgICAgICAgICAgbGV2ZWxzIC09IDFcbiAgICAgICAgICAgIGkgKz0gMVxuICAgICAgICBpIC0gMVxuXG4gICAgIyBMZWFkaW5nIG5ld2xpbmVzIHdvdWxkIGludHJvZHVjZSBhbiBhbWJpZ3VpdHkgaW4gdGhlIGdyYW1tYXIsIHNvIHdlIGRpc3BhdGNoIHRoZW0gaGVyZS5cbiAgICBcbiAgICByZW1vdmVMZWFkaW5nTmV3bGluZXM6IC0+XG4gICAgICAgIFxuICAgICAgICBicmVhayBmb3IgW3RhZ10sIGkgaW4gQHRva2VucyB3aGVuIHRhZyAhPSAnVEVSTUlOQVRPUidcbiAgICAgICAgQHRva2Vucy5zcGxpY2UgMCwgaSBpZiBpXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgIFxuICAgICAgICBcbiAgICBjaGVjazogLT4gXG4gICAgICAgIGwgPSBhcmd1bWVudHNcbiAgICAgICAgZm9yIGogaW4gWzAuLi5sLmxlbmd0aF0gYnkgMlxuICAgICAgICAgICAgaW5kZXggPSBsW2pdXG4gICAgICAgICAgICByZXR1cm4gZmFsc2UgaWYgaW5kZXggPCAwXG4gICAgICAgICAgICBpZiBAdGFnKGluZGV4KSAhPSBsW2orMV1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgICAgIFxuICAgICMgcmVwbGFjZSBgQDpgIHdpdGggYGNvbnN0cnVjdG9yOmBcbiAgICBcbiAgICBjb25zdHJ1Y3RvclNob3J0Y3V0OiAtPlxuICAgICAgICAgXG4gICAgICAgIEBzY2FuVG9rZW5zICh0b2tlbiwgaSwgdG9rZW5zKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBpID4gMCBhbmQgdG9rZW5zW2ktMV1bMF0gaXMgJ0AnIGFuZCB0b2tlbnNbaV1bMF0gaXMgJzonIGFuZCB0b2tlbnNbaSsxXVswXSBpbiBbJy0+JywgJ1BBUkFNX1NUQVJUJ11cbiAgICAgICAgICAgICAgICB0b2tlbnNbaS0xXVswXSA9ICdQUk9QRVJUWSdcbiAgICAgICAgICAgICAgICB0b2tlbnNbaS0xXVsxXSA9ICdjb25zdHJ1Y3RvcidcbiAgICAgICAgICAgIDFcbiAgICAgICAgICAgIFxuICAgICMgcmVwbGFjZSBgWy0xXWAgd2l0aCBgWy0xLi4tMV1gIGFmdGVyIGlkZW50aWZpZXIsIHN0cmluZywgYXJyYXksIGJyYWNrZXRzXG4gICAgXG4gICAgbmVnYXRpdmVJbmRleDogLT5cblxuICAgICAgICBAc2NhblRva2VucyAodG9rZW4sIGksIHRva2VucykgLT5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZ2VuZXJhdGUgPSBSZXdyaXRlci5nZW5lcmF0ZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBAY2hlY2sgaS0xLCAnSU5ERVhfU1RBUlQnLCBpLCAnLScsIGkrMSwgJ05VTUJFUicsIGkrMiwgJ0lOREVYX0VORCdcbiAgICAgICAgICAgICAgICBpZiBAdGFnKGktMikgPT0gJ0lERU5USUZJRVInXG4gICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSwgMCwgZ2VuZXJhdGUodG9rZW5zW2ktMl1bMF0sIHRva2Vuc1tpLTJdWzFdLCB0b2tlbiksIGdlbmVyYXRlKCcuJywgJy4nLCB0b2tlbiksIGdlbmVyYXRlKCdQUk9QRVJUWScsICdsZW5ndGgnLCB0b2tlbikgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gNVxuICAgICAgICAgICAgICAgIGlmIEB0YWcoaS0yKSBpbiBbJ1NUUklORycsICdTVFJJTkdfRU5EJywgJ10nLCAnKSddXG4gICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSsyLCAwLCBnZW5lcmF0ZSgnLi4nLCAnLi4nLCB0b2tlbiksIGdlbmVyYXRlKHRva2Vuc1tpXVswXSwgdG9rZW5zW2ldWzFdLCB0b2tlbiksIGdlbmVyYXRlKHRva2Vuc1tpKzFdWzBdLCB0b2tlbnNbaSsxXVsxXSwgdG9rZW4pXG4gICAgICAgICAgICAgICAgICAgIGlmIEB0YWcoaS0yKSBpbiBbJ10nLCAnKSddXG4gICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGkrNiwgMCwgZ2VuZXJhdGUoJ0lOREVYX1NUQVJUJywgJ1snLCB0b2tlbiksIGdlbmVyYXRlKCdOVU1CRVInLCAnMCcsIHRva2VuKSwgZ2VuZXJhdGUoJ0lOREVYX0VORCcsICddJywgdG9rZW4pXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gN1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gNFxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgbG9nIEB0YWcoaS0yKVxuICAgICAgICAgICAgMVxuICAgICAgICBcbiAgICAjIFRoZSBsZXhlciBoYXMgdGFnZ2VkIHRoZSBvcGVuaW5nIHBhcmVudGhlc2lzIG9mIGEgbWV0aG9kIGNhbGwuIE1hdGNoIGl0IHdpdGhcbiAgICAjIGl0cyBwYWlyZWQgY2xvc2UuIFdlIGhhdmUgdGhlIG1pcy1uZXN0ZWQgb3V0ZGVudCBjYXNlIGluY2x1ZGVkIGhlcmUgZm9yXG4gICAgIyBjYWxscyB0aGF0IGNsb3NlIG9uIHRoZSBzYW1lIGxpbmUsIGp1c3QgYmVmb3JlIHRoZWlyIG91dGRlbnQuXG4gICAgXG4gICAgY2xvc2VPcGVuQ2FsbHM6IC0+XG4gICAgICAgIFxuICAgICAgICBjb25kaXRpb24gPSAodG9rZW4sIGkpIC0+XG4gICAgICAgICAgICB0b2tlblswXSBpbiBbJyknLCAnQ0FMTF9FTkQnXSBvclxuICAgICAgICAgICAgdG9rZW5bMF0gaXMgJ09VVERFTlQnIGFuZCBAdGFnKGkgLSAxKSBpcyAnKSdcblxuICAgICAgICBhY3Rpb24gPSAodG9rZW4sIGkpIC0+XG4gICAgICAgICAgICBAdG9rZW5zW2lmIHRva2VuWzBdIGlzICdPVVRERU5UJyB0aGVuIGkgLSAxIGVsc2UgaV1bMF0gPSAnQ0FMTF9FTkQnXG5cbiAgICAgICAgQHNjYW5Ub2tlbnMgKHRva2VuLCBpKSAtPlxuICAgICAgICAgICAgQGRldGVjdEVuZCBpICsgMSwgY29uZGl0aW9uLCBhY3Rpb24gaWYgdG9rZW5bMF0gaXMgJ0NBTExfU1RBUlQnXG4gICAgICAgICAgICAxXG5cbiAgICAjIFRoZSBsZXhlciBoYXMgdGFnZ2VkIHRoZSBvcGVuaW5nIHBhcmVudGhlc2lzIG9mIGFuIGluZGV4aW5nIG9wZXJhdGlvbiBjYWxsLlxuICAgICMgTWF0Y2ggaXQgd2l0aCBpdHMgcGFpcmVkIGNsb3NlLlxuICAgIFxuICAgIGNsb3NlT3BlbkluZGV4ZXM6IC0+XG4gICAgICAgIFxuICAgICAgICBjb25kaXRpb24gPSAodG9rZW4sIGkpIC0+XG4gICAgICAgICAgICB0b2tlblswXSBpbiBbJ10nLCAnSU5ERVhfRU5EJ11cblxuICAgICAgICBhY3Rpb24gPSAodG9rZW4sIGkpIC0+XG4gICAgICAgICAgICB0b2tlblswXSA9ICdJTkRFWF9FTkQnXG5cbiAgICAgICAgQHNjYW5Ub2tlbnMgKHRva2VuLCBpKSAtPlxuICAgICAgICAgICAgQGRldGVjdEVuZCBpICsgMSwgY29uZGl0aW9uLCBhY3Rpb24gaWYgdG9rZW5bMF0gaXMgJ0lOREVYX1NUQVJUJ1xuICAgICAgICAgICAgMVxuXG4gICAgIyBNYXRjaCB0YWdzIGluIHRva2VuIHN0cmVhbSBzdGFydGluZyBhdCBgaWAgd2l0aCBgcGF0dGVybmAsIHNraXBwaW5nICdIRVJFQ09NTUVOVCdzLlxuICAgICMgYHBhdHRlcm5gIG1heSBjb25zaXN0IG9mIHN0cmluZ3MgKGVxdWFsaXR5KSwgYW4gYXJyYXkgb2Ygc3RyaW5ncyAob25lIG9mKVxuICAgICMgb3IgbnVsbCAod2lsZGNhcmQpLiBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgbWF0Y2ggb3IgLTEgaWYgbm8gbWF0Y2guXG4gICAgXG4gICAgaW5kZXhPZlRhZzogKGksIHBhdHRlcm4uLi4pIC0+XG4gICAgICAgIGZ1enogPSAwXG4gICAgICAgIGZvciBqIGluIFswIC4uLiBwYXR0ZXJuLmxlbmd0aF1cbiAgICAgICAgICAgIGZ1enogKz0gMiB3aGlsZSBAdGFnKGkgKyBqICsgZnV6eikgaXMgJ0hFUkVDT01NRU5UJ1xuICAgICAgICAgICAgY29udGludWUgaWYgbm90IHBhdHRlcm5bal0/XG4gICAgICAgICAgICBwYXR0ZXJuW2pdID0gW3BhdHRlcm5bal1dIGlmIHR5cGVvZiBwYXR0ZXJuW2pdIGlzICdzdHJpbmcnXG4gICAgICAgICAgICByZXR1cm4gLTEgaWYgQHRhZyhpICsgaiArIGZ1enopIG5vdCBpbiBwYXR0ZXJuW2pdXG4gICAgICAgIGkgKyBqICsgZnV6eiAtIDFcblxuICAgICMgYEA8eD46YCwgYDx4PjpgIG9yIGA8RVhQUkVTU0lPTl9TVEFSVD48eD4uLi48RVhQUkVTU0lPTl9FTkQ+OmAsIHNraXBwaW5nIG92ZXIgJ0hFUkVDT01NRU5UJ3MuXG4gICAgXG4gICAgbG9va3NPYmplY3Rpc2g6IChqKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHllcyBpZiBAaW5kZXhPZlRhZyhqLCAnQCcsIG51bGwsICc6JykgPiAtMSBvciBAaW5kZXhPZlRhZyhqLCBudWxsLCAnOicpID4gLTFcbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gQGluZGV4T2ZUYWcoaiwgRVhQUkVTU0lPTl9TVEFSVClcbiAgICAgICAgaWYgaW5kZXggPiAtMVxuICAgICAgICAgICAgZW5kID0gbnVsbFxuICAgICAgICAgICAgQGRldGVjdEVuZCBpbmRleCArIDEsICgodG9rZW4pIC0+IHRva2VuWzBdIGluIEVYUFJFU1NJT05fRU5EKSwgKCh0b2tlbiwgaSkgLT4gZW5kID0gaSlcbiAgICAgICAgICAgIHJldHVybiB5ZXMgaWYgQHRhZyhlbmQgKyAxKSBpcyAnOidcbiAgICAgICAgbm9cblxuICAgICMgUmV0dXJucyBgeWVzYCBpZiBjdXJyZW50IGxpbmUgb2YgdG9rZW5zIGNvbnRhaW4gYW4gZWxlbWVudCBvZiB0YWdzIG9uIHNhbWUgZXhwcmVzc2lvbiBsZXZlbC4gXG4gICAgIyBTdG9wIHNlYXJjaGluZyBhdCBMSU5FQlJFQUtTIG9yIGV4cGxpY2l0IHN0YXJ0IG9mIGNvbnRhaW5pbmcgYmFsYW5jZWQgZXhwcmVzc2lvbi5cbiAgICBcbiAgICBmaW5kVGFnc0JhY2t3YXJkczogKGksIHRhZ3MpIC0+XG4gICAgICAgIGJhY2tTdGFjayA9IFtdXG4gICAgICAgIHdoaWxlIGkgPj0gMCBhbmQgKGJhY2tTdGFjay5sZW5ndGggb3JcbiAgICAgICAgICAgICAgICAgICAgQHRhZyhpKSBub3QgaW4gdGFncyBhbmRcbiAgICAgICAgICAgICAgICAgICAgKEB0YWcoaSkgbm90IGluIEVYUFJFU1NJT05fU1RBUlQgb3IgQHRva2Vuc1tpXS5nZW5lcmF0ZWQpIGFuZFxuICAgICAgICAgICAgICAgICAgICBAdGFnKGkpIG5vdCBpbiBMSU5FQlJFQUtTKVxuICAgICAgICAgICAgYmFja1N0YWNrLnB1c2ggQHRhZyhpKSBpZiBAdGFnKGkpIGluIEVYUFJFU1NJT05fRU5EXG4gICAgICAgICAgICBiYWNrU3RhY2sucG9wKCkgaWYgQHRhZyhpKSBpbiBFWFBSRVNTSU9OX1NUQVJUIGFuZCBiYWNrU3RhY2subGVuZ3RoXG4gICAgICAgICAgICBpIC09IDFcbiAgICAgICAgQHRhZyhpKSBpbiB0YWdzXG5cbiAgICAjIDAwMCAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICAjIExvb2sgZm9yIHNpZ25zIG9mIGltcGxpY2l0IGNhbGxzIGFuZCBvYmplY3RzIGluIHRoZSB0b2tlbiBzdHJlYW0gYW5kIGFkZCB0aGVtLlxuICAgICAgICBcbiAgICBhZGRJbXBsaWNpdEJyYWNlc0FuZFBhcmVuczogLT5cbiAgICAgICAgIyBUcmFjayBjdXJyZW50IGJhbGFuY2luZyBkZXB0aCAoYm90aCBpbXBsaWNpdCBhbmQgZXhwbGljaXQpIG9uIHN0YWNrLlxuICAgICAgICBzdGFjayA9IFtdXG4gICAgICAgIHN0YXJ0ID0gbnVsbFxuXG4gICAgICAgIEBzY2FuVG9rZW5zICh0b2tlbiwgaSwgdG9rZW5zKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBbdGFnXSAgICAgPSB0b2tlblxuICAgICAgICAgICAgW3ByZXZUYWddID0gcHJldlRva2VuID0gaWYgaSA+IDAgdGhlbiB0b2tlbnNbaSAtIDFdIGVsc2UgW11cbiAgICAgICAgICAgIFtuZXh0VGFnXSA9IGlmIGkgPCB0b2tlbnMubGVuZ3RoIC0gMSB0aGVuIHRva2Vuc1tpICsgMV0gZWxzZSBbXVxuICAgICAgICAgICAgc3RhY2tUb3AgID0gLT4gc3RhY2tbc3RhY2subGVuZ3RoIC0gMV1cbiAgICAgICAgICAgIHN0YXJ0SWR4ICA9IGlcbiAgICAgICAgICAgIGdlbmVyYXRlICA9IFJld3JpdGVyLmdlbmVyYXRlXG5cbiAgICAgICAgICAgICMgSGVscGVyIGZ1bmN0aW9uLCB1c2VkIGZvciBrZWVwaW5nIHRyYWNrIG9mIHRoZSBudW1iZXIgb2YgdG9rZW5zIGNvbnN1bWVkXG4gICAgICAgICAgICAjIGFuZCBzcGxpY2VkLCB3aGVuIHJldHVybmluZyBmb3IgZ2V0dGluZyBhIG5ldyB0b2tlbi5cbiAgICAgICAgICAgIGZvcndhcmQgICA9IChuKSAtPiBpIC0gc3RhcnRJZHggKyBuXG5cbiAgICAgICAgICAgICMgSGVscGVyIGZ1bmN0aW9uc1xuICAgICAgICAgICAgaXNJbXBsaWNpdCAgICAgICAgICA9IChzdGFja0l0ZW0pIC0+IHN0YWNrSXRlbT9bMl0/Lm91cnNcbiAgICAgICAgICAgIGlzSW1wbGljaXRPYmplY3QgICAgPSAoc3RhY2tJdGVtKSAtPiBpc0ltcGxpY2l0KHN0YWNrSXRlbSkgYW5kIHN0YWNrSXRlbT9bMF0gaXMgJ3snXG4gICAgICAgICAgICBpc0ltcGxpY2l0Q2FsbCAgICAgID0gKHN0YWNrSXRlbSkgLT4gaXNJbXBsaWNpdChzdGFja0l0ZW0pIGFuZCBzdGFja0l0ZW0/WzBdIGlzICcoJ1xuICAgICAgICAgICAgaW5JbXBsaWNpdCAgICAgICAgICA9IC0+IGlzSW1wbGljaXQgc3RhY2tUb3AoKVxuICAgICAgICAgICAgaW5JbXBsaWNpdENhbGwgICAgICA9IC0+IGlzSW1wbGljaXRDYWxsIHN0YWNrVG9wKClcbiAgICAgICAgICAgIGluSW1wbGljaXRPYmplY3QgICAgPSAtPiBpc0ltcGxpY2l0T2JqZWN0IHN0YWNrVG9wKClcbiAgICAgICAgICAgICMgVW5jbG9zZWQgY29udHJvbCBzdGF0ZW1lbnQgaW5zaWRlIGltcGxpY2l0IHBhcmVucyAobGlrZVxuICAgICAgICAgICAgIyBjbGFzcyBkZWNsYXJhdGlvbiBvciBpZi1jb25kaXRpb25hbHMpXG4gICAgICAgICAgICBpbkltcGxpY2l0Q29udHJvbCA9IC0+IGluSW1wbGljaXQgYW5kIHN0YWNrVG9wKCk/WzBdIGlzICdDT05UUk9MJ1xuXG4gICAgICAgICAgICBzdGFydEltcGxpY2l0Q2FsbCA9IChqKSAtPlxuICAgICAgICAgICAgICAgIGlkeCA9IGogPyBpXG4gICAgICAgICAgICAgICAgc3RhY2sucHVzaCBbJygnLCBpZHgsIG91cnM6IHllc11cbiAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGlkeCwgMCwgZ2VuZXJhdGUgJ0NBTExfU1RBUlQnLCAnKCcsIFsnJywgJ2ltcGxpY2l0IGZ1bmN0aW9uIGNhbGwnLCB0b2tlblsyXV1cbiAgICAgICAgICAgICAgICBpICs9IDEgaWYgbm90IGo/XG5cbiAgICAgICAgICAgIGVuZEltcGxpY2l0Q2FsbCA9IC0+XG4gICAgICAgICAgICAgICAgc3RhY2sucG9wKClcbiAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGksIDAsIGdlbmVyYXRlICdDQUxMX0VORCcsICcpJywgWycnLCAnZW5kIG9mIGlucHV0JywgdG9rZW5bMl1dXG4gICAgICAgICAgICAgICAgaSArPSAxXG5cbiAgICAgICAgICAgIHN0YXJ0SW1wbGljaXRPYmplY3QgPSAoaiwgc3RhcnRzTGluZSA9IHllcykgLT5cbiAgICAgICAgICAgICAgICBpZHggPSBqID8gaVxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2ggWyd7JywgaWR4LCBzYW1lTGluZTogeWVzLCBzdGFydHNMaW5lOiBzdGFydHNMaW5lLCBvdXJzOiB5ZXNdXG4gICAgICAgICAgICAgICAgdmFsID0gbmV3IFN0cmluZyAneydcbiAgICAgICAgICAgICAgICB2YWwuZ2VuZXJhdGVkID0geWVzXG4gICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpZHgsIDAsIGdlbmVyYXRlICd7JywgdmFsLCB0b2tlblxuICAgICAgICAgICAgICAgIGkgKz0gMSBpZiBub3Qgaj9cblxuICAgICAgICAgICAgZW5kSW1wbGljaXRPYmplY3QgPSAoaikgLT5cbiAgICAgICAgICAgICAgICBqID0gaiA/IGlcbiAgICAgICAgICAgICAgICBzdGFjay5wb3AoKVxuICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaiwgMCwgZ2VuZXJhdGUgJ30nLCAnfScsIHRva2VuXG4gICAgICAgICAgICAgICAgaSArPSAxXG5cbiAgICAgICAgICAgICMgRG9uJ3QgZW5kIGFuIGltcGxpY2l0IGNhbGwgb24gbmV4dCBpbmRlbnQgaWYgYW55IG9mIHRoZXNlIGFyZSBpbiBhbiBhcmd1bWVudFxuICAgICAgICAgICAgaWYgaW5JbXBsaWNpdENhbGwoKSBhbmQgdGFnIGluIFsnSUYnLCAnVFJZJywgJ0ZJTkFMTFknLCAnQ0FUQ0gnLFxuICAgICAgICAgICAgICAgICdDTEFTUycsICdTV0lUQ0gnXVxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2ggWydDT05UUk9MJywgaSwgb3VyczogeWVzXVxuICAgICAgICAgICAgICAgIHJldHVybiBmb3J3YXJkKDEpXG5cbiAgICAgICAgICAgIGlmIHRhZyBpcyAnSU5ERU5UJyBhbmQgaW5JbXBsaWNpdCgpXG5cbiAgICAgICAgICAgICAgICAjIEFuIGBJTkRFTlRgIGNsb3NlcyBhbiBpbXBsaWNpdCBjYWxsIHVubGVzc1xuICAgICAgICAgICAgICAgICNcbiAgICAgICAgICAgICAgICAjICAgIDEuIFdlIGhhdmUgc2VlbiBhIGBDT05UUk9MYCBhcmd1bWVudCBvbiB0aGUgbGluZS5cbiAgICAgICAgICAgICAgICAjICAgIDIuIFRoZSBsYXN0IHRva2VuIGJlZm9yZSB0aGUgaW5kZW50IGlzIHBhcnQgb2YgdGhlIGxpc3QgYmVsb3dcbiAgICAgICAgICAgICAgICAjXG4gICAgICAgICAgICAgICAgaWYgcHJldlRhZyBub3QgaW4gWyc9PicsICctPicsICdbJywgJygnLCAnLCcsICd7JywgJ1RSWScsICdFTFNFJywgJz0nXVxuICAgICAgICAgICAgICAgICAgICBlbmRJbXBsaWNpdENhbGwoKSB3aGlsZSBpbkltcGxpY2l0Q2FsbCgpXG4gICAgICAgICAgICAgICAgc3RhY2sucG9wKCkgaWYgaW5JbXBsaWNpdENvbnRyb2woKVxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2ggW3RhZywgaV1cbiAgICAgICAgICAgICAgICByZXR1cm4gZm9yd2FyZCgxKVxuXG4gICAgICAgICAgICAjIFN0cmFpZ2h0Zm9yd2FyZCBzdGFydCBvZiBleHBsaWNpdCBleHByZXNzaW9uXG4gICAgICAgICAgICBpZiB0YWcgaW4gRVhQUkVTU0lPTl9TVEFSVFxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2ggW3RhZywgaV1cbiAgICAgICAgICAgICAgICByZXR1cm4gZm9yd2FyZCgxKVxuXG4gICAgICAgICAgICAjIENsb3NlIGFsbCBpbXBsaWNpdCBleHByZXNzaW9ucyBpbnNpZGUgb2YgZXhwbGljaXRseSBjbG9zZWQgZXhwcmVzc2lvbnMuXG4gICAgICAgICAgICBpZiB0YWcgaW4gRVhQUkVTU0lPTl9FTkRcbiAgICAgICAgICAgICAgICB3aGlsZSBpbkltcGxpY2l0KClcbiAgICAgICAgICAgICAgICAgICAgaWYgaW5JbXBsaWNpdENhbGwoKVxuICAgICAgICAgICAgICAgICAgICAgICAgZW5kSW1wbGljaXRDYWxsKClcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBpbkltcGxpY2l0T2JqZWN0KClcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZEltcGxpY2l0T2JqZWN0KClcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2sucG9wKClcbiAgICAgICAgICAgICAgICBzdGFydCA9IHN0YWNrLnBvcCgpXG5cbiAgICAgICAgICAgICMgUmVjb2duaXplIHN0YW5kYXJkIGltcGxpY2l0IGNhbGxzIGxpa2VcbiAgICAgICAgICAgICMgZiBhLCBmKCkgYiwgZj8gYywgaFswXSBkIGV0Yy5cbiAgICAgICAgICAgIGlmICh0YWcgaW4gSU1QTElDSVRfRlVOQyBhbmQgdG9rZW4uc3BhY2VkIG9yXG4gICAgICAgICAgICAgICAgICAgIHRhZyBpcyAnPycgYW5kIGkgPiAwIGFuZCBub3QgdG9rZW5zW2kgLSAxXS5zcGFjZWQpIGFuZFxuICAgICAgICAgICAgICAgICAobmV4dFRhZyBpbiBJTVBMSUNJVF9DQUxMIG9yXG4gICAgICAgICAgICAgICAgICAgIG5leHRUYWcgaW4gSU1QTElDSVRfVU5TUEFDRURfQ0FMTCBhbmRcbiAgICAgICAgICAgICAgICAgICAgbm90IHRva2Vuc1tpICsgMV0/LnNwYWNlZCBhbmQgbm90IHRva2Vuc1tpICsgMV0/Lm5ld0xpbmUpXG4gICAgICAgICAgICAgICAgdGFnID0gdG9rZW5bMF0gPSAnRlVOQ19FWElTVCcgaWYgdGFnIGlzICc/J1xuICAgICAgICAgICAgICAgIHN0YXJ0SW1wbGljaXRDYWxsIGkgKyAxXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvcndhcmQoMilcblxuICAgICAgICAgICAgIyBJbXBsaWNpdCBjYWxsIHRha2luZyBhbiBpbXBsaWNpdCBpbmRlbnRlZCBvYmplY3QgYXMgZmlyc3QgYXJndW1lbnQuXG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjICAgICAgICAgICBmXG4gICAgICAgICAgICAjICAgICAgICAgICAgICAgYTogYlxuICAgICAgICAgICAgIyAgICAgICAgICAgICAgIGM6IGRcbiAgICAgICAgICAgICNcbiAgICAgICAgICAgICMgYW5kXG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjICAgICAgICAgICBmXG4gICAgICAgICAgICAjICAgICAgICAgICAgICAgMVxuICAgICAgICAgICAgIyAgICAgICAgICAgICAgIGE6IGJcbiAgICAgICAgICAgICMgICAgICAgICAgICAgICBiOiBjXG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjIERvbid0IGFjY2VwdCBpbXBsaWNpdCBjYWxscyBvZiB0aGlzIHR5cGUsIHdoZW4gb24gdGhlIHNhbWUgbGluZVxuICAgICAgICAgICAgIyBhcyB0aGUgY29udHJvbCBzdHJ1Y3R1cmVzIGJlbG93IGFzIHRoYXQgbWF5IG1pc2ludGVycHJldCBjb25zdHJ1Y3RzIGxpa2U6XG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjICAgICAgICAgICBpZiBmXG4gICAgICAgICAgICAjICAgICAgICAgICAgICAgIGE6IDFcbiAgICAgICAgICAgICMgYXNcbiAgICAgICAgICAgICNcbiAgICAgICAgICAgICMgICAgICAgICAgIGlmIGYoYTogMSlcbiAgICAgICAgICAgICNcbiAgICAgICAgICAgICMgd2hpY2ggaXMgcHJvYmFibHkgYWx3YXlzIHVuaW50ZW5kZWQuXG4gICAgICAgICAgICAjIEZ1cnRoZXJtb3JlIGRvbid0IGFsbG93IHRoaXMgaW4gbGl0ZXJhbCBhcnJheXMsIGFzIHRoYXQgY3JlYXRlcyBncmFtbWF0aWNhbCBhbWJpZ3VpdGllcy5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgdGFnIGluIElNUExJQ0lUX0ZVTkMgYW5kXG4gICAgICAgICAgICAgICAgIEBpbmRleE9mVGFnKGkgKyAxLCAnSU5ERU5UJykgPiAtMSBhbmQgQGxvb2tzT2JqZWN0aXNoKGkgKyAyKSBhbmRcbiAgICAgICAgICAgICAgICAgbm90IEBmaW5kVGFnc0JhY2t3YXJkcyhpLCBbJ0NMQVNTJywgJ0VYVEVORFMnLCAnSUYnLCAnQ0FUQ0gnLFxuICAgICAgICAgICAgICAgICAgICAnU1dJVENIJywgJ0xFQURJTkdfV0hFTicsICdGT1InLCAnV0hJTEUnLCAnVU5USUwnXSlcbiAgICAgICAgICAgICAgICBzdGFydEltcGxpY2l0Q2FsbCBpICsgMVxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2ggWydJTkRFTlQnLCBpICsgMl1cbiAgICAgICAgICAgICAgICByZXR1cm4gZm9yd2FyZCgzKVxuXG4gICAgICAgICAgICAjIEltcGxpY2l0IG9iamVjdHMgc3RhcnQgaGVyZVxuICAgICAgICAgICAgaWYgdGFnIGlzICc6J1xuICAgICAgICAgICAgICAgICMgR28gYmFjayB0byB0aGUgKGltcGxpY2l0KSBzdGFydCBvZiB0aGUgb2JqZWN0XG4gICAgICAgICAgICAgICAgcyA9IHN3aXRjaFxuICAgICAgICAgICAgICAgICAgICB3aGVuIEB0YWcoaSAtIDEpIGluIEVYUFJFU1NJT05fRU5EIHRoZW4gc3RhcnRbMV1cbiAgICAgICAgICAgICAgICAgICAgd2hlbiBAdGFnKGkgLSAyKSBpcyAnQCcgdGhlbiBpIC0gMlxuICAgICAgICAgICAgICAgICAgICBlbHNlIGkgLSAxXG4gICAgICAgICAgICAgICAgcyAtPSAyIHdoaWxlIEB0YWcocyAtIDIpIGlzICdIRVJFQ09NTUVOVCdcblxuICAgICAgICAgICAgICAgICMgTWFyayBpZiB0aGUgdmFsdWUgaXMgYSBmb3IgbG9vcFxuICAgICAgICAgICAgICAgIEBpbnNpZGVGb3JEZWNsYXJhdGlvbiA9IG5leHRUYWcgaXMgJ0ZPUidcblxuICAgICAgICAgICAgICAgIHN0YXJ0c0xpbmUgPSBzIGlzIDAgb3IgQHRhZyhzIC0gMSkgaW4gTElORUJSRUFLUyBvciB0b2tlbnNbcyAtIDFdLm5ld0xpbmVcbiAgICAgICAgICAgICAgICAjIEFyZSB3ZSBqdXN0IGNvbnRpbnVpbmcgYW4gYWxyZWFkeSBkZWNsYXJlZCBvYmplY3Q/XG4gICAgICAgICAgICAgICAgaWYgc3RhY2tUb3AoKVxuICAgICAgICAgICAgICAgICAgICBbc3RhY2tUYWcsIHN0YWNrSWR4XSA9IHN0YWNrVG9wKClcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YWNrVGFnIGlzICd7JyBvciBzdGFja1RhZyBpcyAnSU5ERU5UJyBhbmQgQHRhZyhzdGFja0lkeCAtIDEpIGlzICd7JykgYW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAgKHN0YXJ0c0xpbmUgb3IgQHRhZyhzIC0gMSkgaXMgJywnIG9yIEB0YWcocyAtIDEpIGlzICd7JylcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmb3J3YXJkKDEpXG5cbiAgICAgICAgICAgICAgICBzdGFydEltcGxpY2l0T2JqZWN0KHMsICEhc3RhcnRzTGluZSlcbiAgICAgICAgICAgICAgICByZXR1cm4gZm9yd2FyZCgyKVxuXG4gICAgICAgICAgICAjIEVuZCBpbXBsaWNpdCBjYWxscyB3aGVuIGNoYWluaW5nIG1ldGhvZCBjYWxsc1xuICAgICAgICAgICAgIyBsaWtlIGUuZy46XG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjICAgICAgICAgICBmIC0+XG4gICAgICAgICAgICAjICAgICAgICAgICAgICAgYVxuICAgICAgICAgICAgIyAgICAgICAgICAgLmcgYiwgLT5cbiAgICAgICAgICAgICMgICAgICAgICAgICAgICBjXG4gICAgICAgICAgICAjICAgICAgICAgICAuaCBhXG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjIGFuZCBhbHNvXG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjICAgICAgICAgICBmIGFcbiAgICAgICAgICAgICMgICAgICAgICAgIC5nIGJcbiAgICAgICAgICAgICMgICAgICAgICAgIC5oIGFcblxuICAgICAgICAgICAgIyBNYXJrIGFsbCBlbmNsb3Npbmcgb2JqZWN0cyBhcyBub3Qgc2FtZUxpbmVcbiAgICAgICAgICAgIGlmIHRhZyBpbiBMSU5FQlJFQUtTXG4gICAgICAgICAgICAgICAgZm9yIHN0YWNrSXRlbSBpbiBzdGFjayBieSAtMVxuICAgICAgICAgICAgICAgICAgICBicmVhayB1bmxlc3MgaXNJbXBsaWNpdCBzdGFja0l0ZW1cbiAgICAgICAgICAgICAgICAgICAgc3RhY2tJdGVtWzJdLnNhbWVMaW5lID0gbm8gaWYgaXNJbXBsaWNpdE9iamVjdCBzdGFja0l0ZW1cblxuICAgICAgICAgICAgbmV3TGluZSA9IHByZXZUYWcgaXMgJ09VVERFTlQnIG9yIHByZXZUb2tlbi5uZXdMaW5lXG4gICAgICAgICAgICBpZiB0YWcgaW4gSU1QTElDSVRfRU5EIG9yIHRhZyBpbiBDQUxMX0NMT1NFUlMgYW5kIG5ld0xpbmVcbiAgICAgICAgICAgICAgICB3aGlsZSBpbkltcGxpY2l0KClcbiAgICAgICAgICAgICAgICAgICAgW3N0YWNrVGFnLCBzdGFja0lkeCwge3NhbWVMaW5lLCBzdGFydHNMaW5lfV0gPSBzdGFja1RvcCgpXG4gICAgICAgICAgICAgICAgICAgICMgQ2xvc2UgaW1wbGljaXQgY2FsbHMgd2hlbiByZWFjaGVkIGVuZCBvZiBhcmd1bWVudCBsaXN0XG4gICAgICAgICAgICAgICAgICAgIGlmIGluSW1wbGljaXRDYWxsKCkgYW5kIHByZXZUYWcgIT0gJywnXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmRJbXBsaWNpdENhbGwoKVxuICAgICAgICAgICAgICAgICAgICAjIENsb3NlIGltcGxpY2l0IG9iamVjdHMgc3VjaCBhczpcbiAgICAgICAgICAgICAgICAgICAgIyByZXR1cm4gYTogMSwgYjogMiB1bmxlc3MgdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGluSW1wbGljaXRPYmplY3QoKSBhbmQgbm90IEBpbnNpZGVGb3JEZWNsYXJhdGlvbiBhbmQgc2FtZUxpbmUgYW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcgIT0gJ1RFUk1JTkFUT1InIGFuZCBwcmV2VGFnICE9ICc6J1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5kSW1wbGljaXRPYmplY3QoKVxuICAgICAgICAgICAgICAgICAgICAjIENsb3NlIGltcGxpY2l0IG9iamVjdHMgd2hlbiBhdCBlbmQgb2YgbGluZSwgbGluZSBkaWRuJ3QgZW5kIHdpdGggYSBjb21tYVxuICAgICAgICAgICAgICAgICAgICAjIGFuZCB0aGUgaW1wbGljaXQgb2JqZWN0IGRpZG4ndCBzdGFydCB0aGUgbGluZSBvciB0aGUgbmV4dCBsaW5lIGRvZXNuJ3QgbG9vayBsaWtlXG4gICAgICAgICAgICAgICAgICAgICMgdGhlIGNvbnRpbnVhdGlvbiBvZiBhbiBvYmplY3QuXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgaW5JbXBsaWNpdE9iamVjdCgpIGFuZCB0YWcgaXMgJ1RFUk1JTkFUT1InIGFuZCBwcmV2VGFnICE9ICcsJyBhbmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdCAoc3RhcnRzTGluZSBhbmQgQGxvb2tzT2JqZWN0aXNoKGkgKyAxKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmb3J3YXJkIDEgaWYgbmV4dFRhZyBpcyAnSEVSRUNPTU1FTlQnXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmRJbXBsaWNpdE9iamVjdCgpXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICMgQ2xvc2UgaW1wbGljaXQgb2JqZWN0IGlmIGNvbW1hIGlzIHRoZSBsYXN0IGNoYXJhY3RlclxuICAgICAgICAgICAgIyBhbmQgd2hhdCBjb21lcyBhZnRlciBkb2Vzbid0IGxvb2sgbGlrZSBpdCBiZWxvbmdzLlxuICAgICAgICAgICAgIyBUaGlzIGlzIHVzZWQgZm9yIHRyYWlsaW5nIGNvbW1hcyBhbmQgY2FsbHMsIGxpa2U6XG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjICAgICAgICAgICB4ID1cbiAgICAgICAgICAgICMgICAgICAgICAgICAgICAgICAgYTogYixcbiAgICAgICAgICAgICMgICAgICAgICAgICAgICAgICAgYzogZCxcbiAgICAgICAgICAgICMgICAgICAgICAgIGUgPSAyXG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjIGFuZFxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyAgICAgICAgICAgZiBhLCBiOiBjLCBkOiBlLCBmLCBnOiBoOiBpLCBqXG4gICAgICAgICAgICAjXG4gICAgICAgICAgICBpZiB0YWcgaXMgJywnIGFuZCBub3QgQGxvb2tzT2JqZWN0aXNoKGkgKyAxKSBhbmQgaW5JbXBsaWNpdE9iamVjdCgpIGFuZFxuICAgICAgICAgICAgICAgICBub3QgQGluc2lkZUZvckRlY2xhcmF0aW9uIGFuZFxuICAgICAgICAgICAgICAgICAobmV4dFRhZyAhPSAnVEVSTUlOQVRPUicgb3Igbm90IEBsb29rc09iamVjdGlzaChpICsgMikpXG4gICAgICAgICAgICAgICAgIyBXaGVuIG5leHRUYWcgaXMgT1VUREVOVCB0aGUgY29tbWEgaXMgaW5zaWduaWZpY2FudCBhbmRcbiAgICAgICAgICAgICAgICAjIHNob3VsZCBqdXN0IGJlIGlnbm9yZWQgc28gZW1iZWQgaXQgaW4gdGhlIGltcGxpY2l0IG9iamVjdC5cbiAgICAgICAgICAgICAgICAjXG4gICAgICAgICAgICAgICAgIyBXaGVuIGl0IGlzbid0IHRoZSBjb21tYSBnbyBvbiB0byBwbGF5IGEgcm9sZSBpbiBhIGNhbGwgb3JcbiAgICAgICAgICAgICAgICAjIGFycmF5IGZ1cnRoZXIgdXAgdGhlIHN0YWNrLCBzbyBnaXZlIGl0IGEgY2hhbmNlLlxuXG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gaWYgbmV4dFRhZyBpcyAnT1VUREVOVCcgdGhlbiAxIGVsc2UgMFxuICAgICAgICAgICAgICAgIHdoaWxlIGluSW1wbGljaXRPYmplY3QoKVxuICAgICAgICAgICAgICAgICAgICBlbmRJbXBsaWNpdE9iamVjdCBpICsgb2Zmc2V0XG4gICAgICAgICAgICByZXR1cm4gZm9yd2FyZCgxKVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMCAgICAgMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAgICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGNvbmZpZ1BhcmFtZXRlcnM6IC0+XG4gICAgICAgIFxuICAgICAgICBnZW5lcmF0ZSAgICAgICA9IFJld3JpdGVyLmdlbmVyYXRlXG4gICAgICAgIGRpY3RQYXJhbVN0YXJ0ID0gMFxuICAgICAgICBkaWN0UGFyYW1FbmQgICA9IDBcbiAgICAgICAgc3RhY2tDb3VudCAgICAgPSAwXG4gICAgICAgIFxuICAgICAgICBpc0luc2lkZSA9IC0+IGRpY3RQYXJhbVN0YXJ0IGFuZCBub3Qgc3RhY2tDb3VudFxuICAgICAgICBcbiAgICAgICAgQHNjYW5Ub2tlbnMgKHRva2VuLCBpLCB0b2tlbnMpIC0+XG5cbiAgICAgICAgICAgIFt0YWddICAgICA9IHRva2VuXG4gICAgICAgICAgICBbcHJldlRhZ10gPSBwcmV2VG9rZW4gPSBpZiBpID4gMCB0aGVuIHRva2Vuc1tpIC0gMV0gZWxzZSBbXVxuICAgICAgICAgICAgW25leHRUYWddID0gaWYgaSA8IHRva2Vucy5sZW5ndGggLSAxIHRoZW4gdG9rZW5zW2kgKyAxXSBlbHNlIFtdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHRhZyBpcyAneydcbiAgICAgICAgICAgICAgICBpZiBwcmV2VGFnIGlzICdQQVJBTV9TVEFSVCcgXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vdCBkaWN0UGFyYW1TdGFydFxuICAgICAgICAgICAgICAgICAgICAgICAgZGljdFBhcmFtU3RhcnQgPSBpXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrQ291bnQrK1xuICAgICAgICAgICAgICAgIGVsc2UgaWYgZGljdFBhcmFtU3RhcnRcbiAgICAgICAgICAgICAgICAgICAgc3RhY2tDb3VudCsrXG4gICAgICAgICAgICBlbHNlIGlmIHRhZyBpcyAnfSdcbiAgICAgICAgICAgICAgICBpZiBkaWN0UGFyYW1TdGFydCBcbiAgICAgICAgICAgICAgICAgICAgaWYgbm90IHN0YWNrQ291bnRcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpY3RQYXJhbUVuZCA9IGlcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpY3RQYXJhbVN0YXJ0ID0gMFxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFja0NvdW50LS1cbiAgICAgICAgICAgIGVsc2UgXG4gICAgICAgICAgICAgICAgaWYgaXNJbnNpZGUoKVxuICAgICAgICAgICAgICAgICAgICBpZiB0YWcgPT0gJzonXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBuZXh0VGFnIG5vdCBpbiBbJ0lERU5USUZJRVInLCAnQCddXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gdG9rZW5zW2ktMV1bMV0gIyBjb3B5IHZhbHVlIGZyb20gcHJvcGVydHkgdG9rZW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBAdGFnKGktMikgPT0gJ0AnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFt0aGlzVG9rZW5dID0gdG9rZW5zLnNwbGljZSBpLTIsIDEgIyBwdWxsIHRoZSBAIG91dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGksICAgMCwgdGhpc1Rva2VuICAgICMgaW5zZXJ0IGl0IGFmdGVyIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpKzEsIDAsIGdlbmVyYXRlICc9JywgJz0nLCB0b2tlblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGkrMSwgMCwgZ2VuZXJhdGUgJ1BST1BFUlRZJywgdmFsLCB0b2tlblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpKzEsIDAsIGdlbmVyYXRlICc9JywgJz0nLCB0b2tlblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGkrMSwgMCwgZ2VuZXJhdGUgJ0lERU5USUZJRVInLCB2YWwsIHRva2VuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDJcbiAgICAgICAgICAgICAgICAgICAgaWYgdGFnID09ICc9J1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbmV4dFRhZyBpbiBbJywnLCAnfSddXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpKzEsIDAsIGdlbmVyYXRlICdOVUxMJywgJ251bGwnLCB0b2tlblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAyXG4gICAgICAgICAgICAxXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICBcbiAgICAjIEFkZCBsb2NhdGlvbiBkYXRhIHRvIGFsbCB0b2tlbnMgZ2VuZXJhdGVkIGJ5IHRoZSByZXdyaXRlci5cbiAgICBcbiAgICBhZGRMb2NhdGlvbkRhdGFUb0dlbmVyYXRlZFRva2VuczogLT5cbiAgICAgICAgQHNjYW5Ub2tlbnMgKHRva2VuLCBpLCB0b2tlbnMpIC0+XG4gICAgICAgICAgICByZXR1cm4gMSBpZiB0b2tlblsyXVxuICAgICAgICAgICAgcmV0dXJuIDEgdW5sZXNzIHRva2VuLmdlbmVyYXRlZCBvciB0b2tlbi5leHBsaWNpdFxuICAgICAgICAgICAgaWYgdG9rZW5bMF0gaXMgJ3snIGFuZCBuZXh0TG9jYXRpb249dG9rZW5zW2kgKyAxXT9bMl1cbiAgICAgICAgICAgICAgICB7Zmlyc3RfbGluZTogbGluZSwgZmlyc3RfY29sdW1uOiBjb2x1bW59ID0gbmV4dExvY2F0aW9uXG4gICAgICAgICAgICBlbHNlIGlmIHByZXZMb2NhdGlvbiA9IHRva2Vuc1tpIC0gMV0/WzJdXG4gICAgICAgICAgICAgICAge2xhc3RfbGluZTogbGluZSwgbGFzdF9jb2x1bW46IGNvbHVtbn0gPSBwcmV2TG9jYXRpb25cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBsaW5lID0gY29sdW1uID0gMFxuICAgICAgICAgICAgdG9rZW5bMl0gPVxuICAgICAgICAgICAgICAgIGZpcnN0X2xpbmU6ICAgbGluZVxuICAgICAgICAgICAgICAgIGZpcnN0X2NvbHVtbjogY29sdW1uXG4gICAgICAgICAgICAgICAgbGFzdF9saW5lOiAgICBsaW5lXG4gICAgICAgICAgICAgICAgbGFzdF9jb2x1bW46ICBjb2x1bW5cbiAgICAgICAgICAgIHJldHVybiAxXG5cbiAgICAjIE9VVERFTlQgdG9rZW5zIHNob3VsZCBhbHdheXMgYmUgcG9zaXRpb25lZCBhdCB0aGUgbGFzdCBjaGFyYWN0ZXIgb2YgdGhlXG4gICAgIyBwcmV2aW91cyB0b2tlbiwgc28gdGhhdCBBU1Qgbm9kZXMgZW5kaW5nIGluIGFuIE9VVERFTlQgdG9rZW4gZW5kIHVwIHdpdGggYVxuICAgICMgbG9jYXRpb24gY29ycmVzcG9uZGluZyB0byB0aGUgbGFzdCBcInJlYWxcIiB0b2tlbiB1bmRlciB0aGUgbm9kZS5cbiAgICBmaXhPdXRkZW50TG9jYXRpb25EYXRhOiAtPlxuICAgICAgICBAc2NhblRva2VucyAodG9rZW4sIGksIHRva2VucykgLT5cbiAgICAgICAgICAgIHJldHVybiAxIHVubGVzcyB0b2tlblswXSBpcyAnT1VUREVOVCcgb3JcbiAgICAgICAgICAgICAgICAodG9rZW4uZ2VuZXJhdGVkIGFuZCB0b2tlblswXSBpcyAnQ0FMTF9FTkQnKSBvclxuICAgICAgICAgICAgICAgICh0b2tlbi5nZW5lcmF0ZWQgYW5kIHRva2VuWzBdIGlzICd9JylcbiAgICAgICAgICAgIHByZXZMb2NhdGlvbkRhdGEgPSB0b2tlbnNbaSAtIDFdWzJdXG4gICAgICAgICAgICB0b2tlblsyXSA9XG4gICAgICAgICAgICAgICAgZmlyc3RfbGluZTogICBwcmV2TG9jYXRpb25EYXRhLmxhc3RfbGluZVxuICAgICAgICAgICAgICAgIGZpcnN0X2NvbHVtbjogcHJldkxvY2F0aW9uRGF0YS5sYXN0X2NvbHVtblxuICAgICAgICAgICAgICAgIGxhc3RfbGluZTogICAgcHJldkxvY2F0aW9uRGF0YS5sYXN0X2xpbmVcbiAgICAgICAgICAgICAgICBsYXN0X2NvbHVtbjogIHByZXZMb2NhdGlvbkRhdGEubGFzdF9jb2x1bW5cbiAgICAgICAgICAgIHJldHVybiAxXG5cbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAgICAgMDAwICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICAjIEJlY2F1c2Ugb3VyIGdyYW1tYXIgaXMgTEFMUigxKSwgaXQgY2FuJ3QgaGFuZGxlIHNvbWUgc2luZ2xlLWxpbmVcbiAgICAjIGV4cHJlc3Npb25zIHRoYXQgbGFjayBlbmRpbmcgZGVsaW1pdGVycy4gVGhlICoqUmV3cml0ZXIqKiBhZGRzIHRoZSBpbXBsaWNpdFxuICAgICMgYmxvY2tzLCBzbyBpdCBkb2Vzbid0IG5lZWQgdG8uIFRvIGtlZXAgdGhlIGdyYW1tYXIgY2xlYW4gYW5kIHRpZHksIHRyYWlsaW5nXG4gICAgIyBuZXdsaW5lcyB3aXRoaW4gZXhwcmVzc2lvbnMgYXJlIHJlbW92ZWQgYW5kIHRoZSBpbmRlbnRhdGlvbiB0b2tlbnMgb2YgZW1wdHlcbiAgICAjIGJsb2NrcyBhcmUgYWRkZWQuXG4gICAgXG4gICAgbm9ybWFsaXplTGluZXM6IC0+XG4gICAgICAgIHN0YXJ0ZXIgPSBpbmRlbnQgPSBvdXRkZW50ID0gbnVsbFxuXG4gICAgICAgIGNvbmRpdGlvbiA9ICh0b2tlbiwgaSkgLT5cbiAgICAgICAgICAgIHRva2VuWzFdICE9ICc7JyBhbmQgdG9rZW5bMF0gaW4gU0lOR0xFX0NMT1NFUlMgYW5kXG4gICAgICAgICAgICBub3QgKHRva2VuWzBdIGlzICdURVJNSU5BVE9SJyBhbmQgQHRhZyhpICsgMSkgaW4gRVhQUkVTU0lPTl9DTE9TRSkgYW5kXG4gICAgICAgICAgICBub3QgKHRva2VuWzBdIGlzICdFTFNFJyBhbmQgc3RhcnRlciAhPSAnVEhFTicpIGFuZFxuICAgICAgICAgICAgbm90ICh0b2tlblswXSBpbiBbJ0NBVENIJywgJ0ZJTkFMTFknXSBhbmQgc3RhcnRlciBpbiBbJy0+JywgJz0+J10pIG9yXG4gICAgICAgICAgICB0b2tlblswXSBpbiBDQUxMX0NMT1NFUlMgYW5kXG4gICAgICAgICAgICAoQHRva2Vuc1tpIC0gMV0ubmV3TGluZSBvciBAdG9rZW5zW2kgLSAxXVswXSBpcyAnT1VUREVOVCcpXG5cbiAgICAgICAgYWN0aW9uID0gKHRva2VuLCBpKSAtPlxuICAgICAgICAgICAgQHRva2Vucy5zcGxpY2UgKGlmIEB0YWcoaSAtIDEpIGlzICcsJyB0aGVuIGkgLSAxIGVsc2UgaSksIDAsIG91dGRlbnRcblxuICAgICAgICBAc2NhblRva2VucyAodG9rZW4sIGksIHRva2VucykgLT5cbiAgICAgICAgICAgIFt0YWddID0gdG9rZW5cbiAgICAgICAgICAgIGlmIHRhZyBpcyAnVEVSTUlOQVRPUidcbiAgICAgICAgICAgICAgICBpZiBAdGFnKGkgKyAxKSBpcyAnRUxTRScgYW5kIEB0YWcoaSAtIDEpICE9ICdPVVRERU5UJ1xuICAgICAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGksIDEsIEBpbmRlbnRhdGlvbigpLi4uXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAxXG4gICAgICAgICAgICAgICAgaWYgQHRhZyhpICsgMSkgaW4gRVhQUkVTU0lPTl9DTE9TRVxuICAgICAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGksIDFcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgICAgIGlmIHRhZyBpcyAnQ0FUQ0gnXG4gICAgICAgICAgICAgICAgZm9yIGogaW4gWzEuLjJdIHdoZW4gQHRhZyhpICsgaikgaW4gWydPVVRERU5UJywgJ1RFUk1JTkFUT1InLCAnRklOQUxMWSddXG4gICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSArIGosIDAsIEBpbmRlbnRhdGlvbigpLi4uXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAyICsgalxuICAgICAgICAgICAgaWYgdGFnIGluIFNJTkdMRV9MSU5FUlMgYW5kIEB0YWcoaSArIDEpICE9ICdJTkRFTlQnIGFuZFxuICAgICAgICAgICAgICAgICBub3QgKHRhZyBpcyAnRUxTRScgYW5kIEB0YWcoaSArIDEpIGlzICdJRicpXG4gICAgICAgICAgICAgICAgc3RhcnRlciA9IHRhZ1xuICAgICAgICAgICAgICAgIFtpbmRlbnQsIG91dGRlbnRdID0gQGluZGVudGF0aW9uIHRva2Vuc1tpXVxuICAgICAgICAgICAgICAgIGluZGVudC5mcm9tVGhlbiAgICAgPSB0cnVlIGlmIHN0YXJ0ZXIgaXMgJ1RIRU4nXG4gICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpICsgMSwgMCwgaW5kZW50XG4gICAgICAgICAgICAgICAgQGRldGVjdEVuZCBpICsgMiwgY29uZGl0aW9uLCBhY3Rpb25cbiAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGksIDEgaWYgdGFnIGlzICdUSEVOJ1xuICAgICAgICAgICAgICAgIHJldHVybiAxXG4gICAgICAgICAgICByZXR1cm4gMVxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMCAgICAwMDAgICAgMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgICMgVGFnIHBvc3RmaXggY29uZGl0aW9uYWxzIGFzIHN1Y2gsIHNvIHRoYXQgd2UgY2FuIHBhcnNlIHRoZW0gd2l0aCBhXG4gICAgIyBkaWZmZXJlbnQgcHJlY2VkZW5jZS5cbiAgICBcbiAgICB0YWdQb3N0Zml4Q29uZGl0aW9uYWxzOiAtPlxuXG4gICAgICAgIG9yaWdpbmFsID0gbnVsbFxuXG4gICAgICAgIGNvbmRpdGlvbiA9ICh0b2tlbiwgaSkgLT5cbiAgICAgICAgICAgIFt0YWddID0gdG9rZW5cbiAgICAgICAgICAgIFtwcmV2VGFnXSA9IEB0b2tlbnNbaSAtIDFdXG4gICAgICAgICAgICB0YWcgaXMgJ1RFUk1JTkFUT1InIG9yICh0YWcgaXMgJ0lOREVOVCcgYW5kIHByZXZUYWcgbm90IGluIFNJTkdMRV9MSU5FUlMpXG5cbiAgICAgICAgYWN0aW9uID0gKHRva2VuLCBpKSAtPlxuICAgICAgICAgICAgaWYgdG9rZW5bMF0gIT0gJ0lOREVOVCcgb3IgKHRva2VuLmdlbmVyYXRlZCBhbmQgbm90IHRva2VuLmZyb21UaGVuKVxuICAgICAgICAgICAgICAgIG9yaWdpbmFsWzBdID0gJ1BPU1RfJyArIG9yaWdpbmFsWzBdXG5cbiAgICAgICAgQHNjYW5Ub2tlbnMgKHRva2VuLCBpKSAtPlxuICAgICAgICAgICAgcmV0dXJuIDEgdW5sZXNzIHRva2VuWzBdIGlzICdJRidcbiAgICAgICAgICAgIG9yaWdpbmFsID0gdG9rZW5cbiAgICAgICAgICAgIEBkZXRlY3RFbmQgaSArIDEsIGNvbmRpdGlvbiwgYWN0aW9uXG4gICAgICAgICAgICByZXR1cm4gMVxuXG4gICAgIyBHZW5lcmF0ZSB0aGUgaW5kZW50YXRpb24gdG9rZW5zLCBiYXNlZCBvbiBhbm90aGVyIHRva2VuIG9uIHRoZSBzYW1lIGxpbmUuXG4gICAgXG4gICAgaW5kZW50YXRpb246IChvcmlnaW4pIC0+XG4gICAgICAgIFxuICAgICAgICBpbmRlbnQgID0gWydJTkRFTlQnLCA0XVxuICAgICAgICBvdXRkZW50ID0gWydPVVRERU5UJywgNF1cbiAgICAgICAgaWYgb3JpZ2luXG4gICAgICAgICAgICBpbmRlbnQuZ2VuZXJhdGVkID0gb3V0ZGVudC5nZW5lcmF0ZWQgPSB5ZXNcbiAgICAgICAgICAgIGluZGVudC5vcmlnaW4gPSBvdXRkZW50Lm9yaWdpbiA9IG9yaWdpblxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpbmRlbnQuZXhwbGljaXQgPSBvdXRkZW50LmV4cGxpY2l0ID0geWVzXG4gICAgICAgIFtpbmRlbnQsIG91dGRlbnRdXG5cbiAgICAjIENyZWF0ZSBhIGdlbmVyYXRlZCB0b2tlbjogb25lIHRoYXQgZXhpc3RzIGR1ZSB0byBhIHVzZSBvZiBpbXBsaWNpdCBzeW50YXguXG4gICAgXG4gICAgQGdlbmVyYXRlOiAodGFnLCB2YWx1ZSwgb3JpZ2luKSAtPlxuICAgICAgICB0b2sgPSBbdGFnLCB2YWx1ZV1cbiAgICAgICAgdG9rLmdlbmVyYXRlZCA9IHllc1xuICAgICAgICB0b2sub3JpZ2luID0gb3JpZ2luIGlmIG9yaWdpblxuICAgICAgICB0b2tcblxuICAgIHRhZzogKGkpIC0+IEB0b2tlbnNbaV0/WzBdICMgTG9vayB1cCBhIHRhZyBieSB0b2tlbiBpbmRleC5cblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgICAgICAgMDAwICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG5cbiMgTGlzdCBvZiB0aGUgdG9rZW4gcGFpcnMgdGhhdCBtdXN0IGJlIGJhbGFuY2VkLlxuXG5CQUxBTkNFRF9QQUlSUyA9IFtcbiAgICBbJygnLCAnKSddXG4gICAgWydbJywgJ10nXVxuICAgIFsneycsICd9J11cbiAgICBbJ0lOREVOVCcsICdPVVRERU5UJ10sXG4gICAgWydDQUxMX1NUQVJUJywgJ0NBTExfRU5EJ11cbiAgICBbJ1BBUkFNX1NUQVJUJywgJ1BBUkFNX0VORCddXG4gICAgWydJTkRFWF9TVEFSVCcsICdJTkRFWF9FTkQnXVxuICAgIFsnU1RSSU5HX1NUQVJUJywgJ1NUUklOR19FTkQnXVxuICAgIFsnUkVHRVhfU1RBUlQnLCAnUkVHRVhfRU5EJ11cbl1cblxuIyBUaGUgaW52ZXJzZSBtYXBwaW5ncyBvZiBgQkFMQU5DRURfUEFJUlNgIHdlJ3JlIHRyeWluZyB0byBmaXggdXAsIHNvIHdlIGNhbiBsb29rIHRoaW5ncyB1cCBmcm9tIGVpdGhlciBlbmQuXG5cbmV4cG9ydHMuSU5WRVJTRVMgPSBJTlZFUlNFUyA9IHt9XG5leHBvcnRzLlJld3JpdGVyID0gUmV3cml0ZXJcblxuIyBUaGUgdG9rZW5zIHRoYXQgc2lnbmFsIHRoZSBzdGFydC9lbmQgb2YgYSBiYWxhbmNlZCBwYWlyLlxuRVhQUkVTU0lPTl9TVEFSVCA9IFtdXG5FWFBSRVNTSU9OX0VORCAgID0gW11cblxuZm9yIFtsZWZ0LCByaXRlXSBpbiBCQUxBTkNFRF9QQUlSU1xuICAgIEVYUFJFU1NJT05fU1RBUlQucHVzaCBJTlZFUlNFU1tyaXRlXSA9IGxlZnRcbiAgICBFWFBSRVNTSU9OX0VORCAgLnB1c2ggSU5WRVJTRVNbbGVmdF0gPSByaXRlXG5cbiMgVG9rZW5zIHRoYXQgaW5kaWNhdGUgdGhlIGNsb3NlIG9mIGEgY2xhdXNlIG9mIGFuIGV4cHJlc3Npb24uXG5FWFBSRVNTSU9OX0NMT1NFID0gWydDQVRDSCcsICdUSEVOJywgJ0VMU0UnLCAnRklOQUxMWSddLmNvbmNhdCBFWFBSRVNTSU9OX0VORFxuXG4jIFRva2VucyB0aGF0LCBpZiBmb2xsb3dlZCBieSBhbiBgSU1QTElDSVRfQ0FMTGAsIGluZGljYXRlIGEgZnVuY3Rpb24gaW52b2NhdGlvbi5cbklNUExJQ0lUX0ZVTkMgPSBbJ0lERU5USUZJRVInLCAnUFJPUEVSVFknLCAnU1VQRVInLCAnKScsICdDQUxMX0VORCcsICddJywgJ0lOREVYX0VORCcsICdAJywgJ1RISVMnXVxuXG4jIElmIHByZWNlZGVkIGJ5IGFuIGBJTVBMSUNJVF9GVU5DYCwgaW5kaWNhdGVzIGEgZnVuY3Rpb24gaW52b2NhdGlvbi5cbklNUExJQ0lUX0NBTEwgPSBbXG4gICAgJ0lERU5USUZJRVInLCAnUFJPUEVSVFknLCAnTlVNQkVSJywgJ0lORklOSVRZJywgJ05BTidcbiAgICAnU1RSSU5HJywgJ1NUUklOR19TVEFSVCcsICdSRUdFWCcsICdSRUdFWF9TVEFSVCcsICdKUydcbiAgICAnTkVXJywgJ1BBUkFNX1NUQVJUJywgJ0NMQVNTJywgJ0lGJywgJ1RSWScsICdTV0lUQ0gnLCAnVEhJUydcbiAgICAnVU5ERUZJTkVEJywgJ05VTEwnLCAnQk9PTCdcbiAgICAnVU5BUlknLCAnWUlFTEQnLCAnVU5BUllfTUFUSCcsICdTVVBFUicsICdUSFJPVydcbiAgICAnQCcsICctPicsICc9PicsICdbJywgJygnLCAneycsICctLScsICcrKydcbl1cblxuSU1QTElDSVRfVU5TUEFDRURfQ0FMTCA9IFsnKycsICctJ11cblxuIyBUb2tlbnMgdGhhdCBhbHdheXMgbWFyayB0aGUgZW5kIG9mIGFuIGltcGxpY2l0IGNhbGwgZm9yIHNpbmdsZS1saW5lcnMuXG5JTVBMSUNJVF9FTkQgICAgICAgICA9IFsnUE9TVF9JRicsICdGT1InLCAnV0hJTEUnLCAnVU5USUwnLCAnV0hFTicsICdCWScsXG4gICAgJ0xPT1AnLCAnVEVSTUlOQVRPUiddXG5cbiMgU2luZ2xlLWxpbmUgZmxhdm9ycyBvZiBibG9jayBleHByZXNzaW9ucyB0aGF0IGhhdmUgdW5jbG9zZWQgZW5kaW5ncy5cbiMgVGhlIGdyYW1tYXIgY2FuJ3QgZGlzYW1iaWd1YXRlIHRoZW0sIHNvIHdlIGluc2VydCB0aGUgaW1wbGljaXQgaW5kZW50YXRpb24uXG5TSU5HTEVfTElORVJTICAgICAgICA9IFsnRUxTRScsICctPicsICc9PicsICdUUlknLCAnRklOQUxMWScsICdUSEVOJ11cblNJTkdMRV9DTE9TRVJTICAgPSBbJ1RFUk1JTkFUT1InLCAnQ0FUQ0gnLCAnRklOQUxMWScsICdFTFNFJywgJ09VVERFTlQnLCAnTEVBRElOR19XSEVOJ11cblxuIyBUb2tlbnMgdGhhdCBlbmQgYSBsaW5lLlxuTElORUJSRUFLUyAgICAgICAgICAgPSBbJ1RFUk1JTkFUT1InLCAnSU5ERU5UJywgJ09VVERFTlQnXVxuXG4jIFRva2VucyB0aGF0IGNsb3NlIG9wZW4gY2FsbHMgd2hlbiB0aGV5IGZvbGxvdyBhIG5ld2xpbmUuXG5DQUxMX0NMT1NFUlMgICAgICAgICA9IFsnLicsICc/LicsICc6OicsICc/OjonXVxuIl19
//# sourceURL=../src/rewriter.coffee