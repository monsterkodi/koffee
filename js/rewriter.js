// koffee 0.26.0

/*
00000000   00000000  000   000  00000000   000  000000000  00000000  00000000   
000   000  000       000 0 000  000   000  000     000     000       000   000  
0000000    0000000   000000000  0000000    000     000     0000000   0000000    
000   000  000       000   000  000   000  000     000     000       000   000  
000   000  00000000  00     00  000   000  000     000     00000000  000   000
 */
var BALANCED_PAIRS, CALL_CLOSERS, EXPRESSION_CLOSE, EXPRESSION_END, EXPRESSION_START, IMPLICIT_CALL, IMPLICIT_END, IMPLICIT_FUNC, IMPLICIT_UNSPACED_CALL, INVERSES, LINEBREAKS, Rewriter, SINGLE_CLOSERS, SINGLE_LINERS, hasFeature, k, left, len, ref, rite,
    indexOf = [].indexOf,
    slice = [].slice;

hasFeature = require('./helpers').hasFeature;

Rewriter = (function() {
    function Rewriter() {}

    Rewriter.prototype.rewrite = function(tokens1, opts) {
        this.tokens = tokens1;
        this.opts = opts;
        this.removeLeadingNewlines();
        this.shortcuts();
        this.closeOpenCalls();
        this.closeOpenIndexes();
        this.normalizeLines();
        this.tagPostfixConditionals();
        this.addImplicitBracesAndParens();
        if (hasFeature(this.opts, 'config_parameters')) {
            this.configParameters();
        }
        if (hasFeature(this.opts, 'negative_index')) {
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

    Rewriter.prototype.doesMatch = function(index, match) {
        var key, t, val;
        if (typeof match === 'string') {
            return this.tag(index) === match;
        } else if (match.constructor === Object) {
            t = this.tokens[index];
            key = Object.keys(match)[0];
            val = match[key];
            return t[0] === key && t[1] === val;
        } else {
            return false;
        }
    };

    Rewriter.prototype.check = function() {
        var e, found, index, j, k, l, len, m, ref, ref1;
        l = arguments;
        for (j = k = 0, ref = l.length; k < ref; j = k += 2) {
            index = l[j];
            if (index < 0) {
                return false;
            }
            if (l[j + 1] instanceof Array) {
                found = false;
                ref1 = l[j + 1];
                for (m = 0, len = ref1.length; m < len; m++) {
                    e = ref1[m];
                    if (this.doesMatch(index, e)) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    return false;
                }
            } else {
                if (!this.doesMatch(index, l[j + 1])) {
                    return false;
                }
            }
        }
        return true;
    };

    Rewriter.prototype.findMatchingTagBackwards = function(close, i, check) {
        var current, j, open, pushed;
        open = {
            PARAM_END: 'PARAM_START',
            ']': '[',
            '}': '{'
        }[close];
        if (!open) {
            console.warn("cant match " + close);
        }
        pushed = 0;
        j = i;
        while (j--) {
            current = this.tag(j);
            if (current === close) {
                pushed++;
            } else if (current === open) {
                if (pushed) {
                    pushed--;
                } else if (pushed === 0) {
                    return {
                        index: j
                    };
                }
            } else if ((check != null) && !check(current)) {
                break;
            }
        }
        return {
            index: -1
        };
    };

    Rewriter.prototype.shortcuts = function() {
        return this.scanTokens(function(token, i, tokens) {
            var a, adv, arg, k, match, meta, ref, ref1, ref10, ref11, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9;
            if (hasFeature(this.opts, 'constructor_shortcut')) {
                if (this.check(i - 1, '@', i, ':', i + 1, ['->', 'PARAM_START', 'IDENTIFIER'])) {
                    tokens[i - 1][0] = 'PROPERTY';
                    tokens[i - 1][1] = 'constructor';
                    return 1;
                }
            }
            if (hasFeature(this.opts, 'console_shortcut')) {
                if (this.check(i, [
                    {
                        IDENTIFIER: 'log'
                    }, {
                        IDENTIFIER: 'warn'
                    }, {
                        IDENTIFIER: 'error'
                    }
                ], i + 1, ['NUMBER', 'IDENTIFIER', 'PROPERTY', 'STRING', 'STRING_START', 'CALL_START', 'IF', 'META_IF', '[', '(', '{', '@'])) {
                    token[0] = 'PROPERTY';
                    tokens.splice(i, 0, this.generate('IDENTIFIER', 'console', token), this.generate('.', '.', token));
                    return 3;
                }
            }
            if (hasFeature(this.opts, 'optional_commata')) {
                if (this.check(i, ['NUMBER', 'STRING', 'NULL', 'UNDEFINED', 'BOOL', 'STRING_END', '}'], i + 1, ['NUMBER', 'STRING', 'NULL', 'UNDEFINED', 'BOOL', 'STRING_START', 'IDENTIFIER', 'PROPERTY', '{', '(', '['])) {
                    tokens.splice(i + 1, 0, this.generate(',', ','));
                    return 2;
                }
                if (((ref = this.tag(i)) === ']') && tokens[i].spaced && ((ref1 = this.tag(i + 1)) === 'NUMBER' || ref1 === 'STRING' || ref1 === 'STRING_START' || ref1 === 'IDENTIFIER' || ref1 === 'PROPERTY' || ref1 === '{' || ref1 === '(' || ref1 === '[')) {
                    match = this.findMatchingTagBackwards(this.tag(i), i, function(tag) {
                        return tag === 'NUMBER' || tag === 'STRING' || tag === 'PROPERTY' || tag === ':' || tag === ',';
                    });
                    if (match.index >= 0) {
                        if (match.index === 0 || ((ref2 = this.tag(match.index - 1)) !== 'IDENTIFIER' && ref2 !== 'CALL_END')) {
                            tokens.splice(i + 1, 0, this.generate(',', ','));
                            return 2;
                        }
                    }
                }
            }
            if (hasFeature(this.opts, 'meta')) {
                if (this.check(i - 1, '@', i, 'PROPERTY')) {
                    if ((ref3 = this.tag(i - 2)) !== 'META_IF') {
                        if (ref4 = token[1], indexOf.call(Object.keys(this.opts.meta), ref4) >= 0) {
                            meta = this.opts.meta[token[1]];
                            tokens.splice(i - 1, 0, this.generate('META_IF', 'if'));
                            tokens[i - 1].spaced = true;
                            adv = 2;
                            if (this.tag(i + adv) === 'CALL_START') {
                                while ((ref5 = this.tag(i + adv++)) !== 'CALL_END' && ref5 !== ')' && ref5 !== 'TERMINATOR') {
                                    true;
                                }
                            } else {
                                arg = 0;
                                for (a = k = 0, ref6 = (ref7 = (ref8 = meta.info) != null ? ref8.args : void 0) != null ? ref7 : 1; 0 <= ref6 ? k < ref6 : k > ref6; a = 0 <= ref6 ? ++k : --k) {
                                    if ((ref9 = this.tag(i + adv)) === 'NUMBER' || ref9 === 'STRING') {
                                        arg++;
                                        adv++;
                                    } else {
                                        break;
                                    }
                                }
                                if (arg === 0) {
                                    tokens.splice(i + adv, 0, this.generate('CALL_START', '('), this.generate('CALL_END', ')'));
                                    adv += 2;
                                }
                            }
                            if (((ref10 = meta.info) != null ? ref10.then : void 0) || ((ref11 = this.tag(i + adv)) !== 'TERMINATOR' && ref11 !== 'INDENT' && ref11 !== 'CALL_START')) {
                                tokens.splice(i + adv++, 0, this.generate('THEN', 'then'));
                            }
                            return adv;
                        }
                    }
                }
            }
            return 1;
        });
    };

    Rewriter.prototype.negativeIndex = function() {
        return this.scanTokens(function(token, i, tokens) {
            var ref;
            if (this.check(i - 1, 'INDEX_START', i, '-', i + 1, 'NUMBER', i + 2, 'INDEX_END')) {
                if ((ref = this.tag(i - 2)) === 'IDENTIFIER' || ref === 'PROPERTY' || ref === 'STRING' || ref === 'STRING_END' || ref === ']' || ref === ')') {
                    tokens.splice(i + 2, 0, this.generate('..', '..'), this.generate(tokens[i][0], tokens[i][1]), this.generate(tokens[i + 1][0], tokens[i + 1][1]));
                    tokens.splice(i + 6, 0, this.generate('INDEX_START', '['), this.generate('NUMBER', '0'), this.generate('INDEX_END', ']'));
                    return 7;
                } else {
                    console.log(this.tag(i - 2));
                }
            }
            return 1;
        });
    };

    Rewriter.prototype.configParameters = function() {
        var dictParamEnd, dictParamStart, isInside, stackCount;
        dictParamStart = 0;
        dictParamEnd = 0;
        stackCount = 0;
        isInside = function() {
            return dictParamStart && !stackCount;
        };
        return this.scanTokens(function(token, i, tokens) {
            var nextTag, open, prevTag, prevToken, ref, tag;
            tag = token[0];
            prevTag = (prevToken = i > 0 ? tokens[i - 1] : [])[0];
            nextTag = (i < tokens.length - 1 ? tokens[i + 1] : [])[0];
            if (tag === '{') {
                if (prevTag === 'PARAM_START' || (prevTag !== '[' && prevTag !== '{') && this.findMatchingTagBackwards('PARAM_END', i).index >= 0) {
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
                    if (tag === ':' && (nextTag !== 'IDENTIFIER' && nextTag !== '@')) {
                        open = this.findMatchingTagBackwards('}', i);
                        if (open.index >= 0) {
                            if ((ref = this.tag(open.index - 1)) !== '=') {
                                tokens.splice(i, 1, this.generate('=', '='));
                                if (nextTag === ',' || nextTag === '}') {
                                    tokens.splice(i + 1, 0, this.generate('NULL', 'null'));
                                    return 2;
                                }
                            }
                        }
                    }
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
            var endImplicitCall, endImplicitObject, forward, inImplicit, inImplicitCall, inImplicitControl, inImplicitObject, isImplicit, isImplicitCall, isImplicitObject, k, newLine, nextTag, offset, prevTag, prevToken, ref, ref1, ref2, ref3, ref4, ref5, s, sameLine, stackIdx, stackItem, stackTag, stackTop, startIdx, startImplicitCall, startImplicitObject, startsLine, tag;
            tag = token[0];
            prevTag = (prevToken = i > 0 ? tokens[i - 1] : [])[0];
            nextTag = (i < tokens.length - 1 ? tokens[i + 1] : [])[0];
            stackTop = function() {
                return stack[stack.length - 1];
            };
            startIdx = i;
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
                tokens.splice(idx, 0, Rewriter.generate('CALL_START', '(', ['', 'implicit function call', token[2]]));
                if (j == null) {
                    return i += 1;
                }
            };
            endImplicitCall = function() {
                stack.pop();
                tokens.splice(i, 0, Rewriter.generate('CALL_END', ')', ['', 'end of input', token[2]]));
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
                tokens.splice(idx, 0, Rewriter.generate('{', val, token));
                if (j == null) {
                    return i += 1;
                }
            };
            endImplicitObject = function(j) {
                j = j != null ? j : i;
                stack.pop();
                tokens.splice(j, 0, Rewriter.generate('}', '}', token));
                return i += 1;
            };
            if (inImplicitCall() && (tag === 'IF' || tag === 'META_IF' || tag === 'TRY' || tag === 'FINALLY' || tag === 'CATCH' || tag === 'CLASS' || tag === 'SWITCH')) {
                stack.push([
                    'CONTROL', i, {
                        ours: true
                    }
                ]);
                return forward(1);
            }
            if (tag === 'INDENT' && inImplicit()) {
                if (prevTag !== '=>' && prevTag !== '->' && prevTag !== '[' && prevTag !== '(' && prevTag !== ',' && prevTag !== '{' && prevTag !== 'TRY' && prevTag !== 'ELSE' && prevTag !== 'META_ELSE' && prevTag !== '=') {
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
            if (indexOf.call(IMPLICIT_FUNC, tag) >= 0 && this.indexOfTag(i + 1, 'INDENT') > -1 && this.looksObjectish(i + 2) && !this.findTagsBackwards(i, ['CLASS', 'EXTENDS', 'IF', 'META_IF', 'CATCH', 'SWITCH', 'LEADING_WHEN', 'FOR', 'WHILE', 'UNTIL'])) {
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
            var ref, ref1, ref2, ref3, ref4;
            return token[1] !== ';' && (ref = token[0], indexOf.call(SINGLE_CLOSERS, ref) >= 0) && !(token[0] === 'TERMINATOR' && (ref1 = this.tag(i + 1), indexOf.call(EXPRESSION_CLOSE, ref1) >= 0)) && !(((ref2 = token[0]) === 'ELSE' || ref2 === 'META_ELSE') && starter !== 'THEN') && !(((ref3 = token[0]) === 'CATCH' || ref3 === 'FINALLY') && (starter === '->' || starter === '=>')) || (ref4 = token[0], indexOf.call(CALL_CLOSERS, ref4) >= 0) && (this.tokens[i - 1].newLine || this.tokens[i - 1][0] === 'OUTDENT');
        };
        action = function(token, i) {
            return this.tokens.splice((this.tag(i - 1) === ',' ? i - 1 : i), 0, outdent);
        };
        return this.scanTokens(function(token, i, tokens) {
            var j, k, ref, ref1, ref2, ref3, tag;
            tag = token[0];
            if (tag === 'TERMINATOR') {
                if (((ref = this.tag(i + 1)) === 'ELSE' || ref === 'META_ELSE') && this.tag(i - 1) !== 'OUTDENT') {
                    tokens.splice.apply(tokens, [i, 1].concat(slice.call(this.indentation())));
                    return 1;
                }
                if (ref1 = this.tag(i + 1), indexOf.call(EXPRESSION_CLOSE, ref1) >= 0) {
                    tokens.splice(i, 1);
                    return 0;
                }
            }
            if (tag === 'CATCH') {
                for (j = k = 1; k <= 2; j = ++k) {
                    if (!((ref2 = this.tag(i + j)) === 'OUTDENT' || ref2 === 'TERMINATOR' || ref2 === 'FINALLY')) {
                        continue;
                    }
                    tokens.splice.apply(tokens, [i + j, 0].concat(slice.call(this.indentation())));
                    return 2 + j;
                }
            }
            if (indexOf.call(SINGLE_LINERS, tag) >= 0 && this.tag(i + 1) !== 'INDENT' && !(tag === 'ELSE' && this.tag(i + 1) === 'IF') && !(tag === 'META_ELSE' && this.tag(i + 1) === 'META_IF')) {
                starter = tag;
                ref3 = this.indentation(tokens[i]), indent = ref3[0], outdent = ref3[1];
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
            var ref;
            if (((ref = token[0]) !== 'INDENT') || (token.generated && !token.fromThen)) {
                return original[0] = 'POST_' + original[0];
            }
        };
        return this.scanTokens(function(token, i) {
            var ref;
            if ((ref = token[0]) !== 'IF' && ref !== 'META_IF') {
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

    Rewriter.prototype.generate = Rewriter.generate;

    Rewriter.prototype.tag = function(i) {
        var ref;
        return (ref = this.tokens[i]) != null ? ref[0] : void 0;
    };

    return Rewriter;

})();

BALANCED_PAIRS = [['(', ')'], ['[', ']'], ['{', '}'], ['INDENT', 'OUTDENT'], ['CALL_START', 'CALL_END'], ['PARAM_START', 'PARAM_END'], ['INDEX_START', 'INDEX_END'], ['STRING_START', 'STRING_END'], ['REGEX_START', 'REGEX_END']];

module.exports = Rewriter;

EXPRESSION_START = [];

EXPRESSION_END = [];

INVERSES = {};

for (k = 0, len = BALANCED_PAIRS.length; k < len; k++) {
    ref = BALANCED_PAIRS[k], left = ref[0], rite = ref[1];
    EXPRESSION_START.push(INVERSES[rite] = left);
    EXPRESSION_END.push(INVERSES[left] = rite);
}

Rewriter.INVERSES = INVERSES;

EXPRESSION_CLOSE = ['CATCH', 'THEN', 'ELSE', 'META_ELSE', 'FINALLY'].concat(EXPRESSION_END);

IMPLICIT_FUNC = ['IDENTIFIER', 'PROPERTY', 'SUPER', ')', 'CALL_END', ']', 'INDEX_END', '@', 'THIS'];

IMPLICIT_CALL = ['IDENTIFIER', 'PROPERTY', 'NUMBER', 'INFINITY', 'NAN', 'STRING', 'STRING_START', 'REGEX', 'REGEX_START', 'JS', 'NEW', 'PARAM_START', 'CLASS', 'IF', 'META_IF', 'TRY', 'SWITCH', 'THIS', 'UNDEFINED', 'NULL', 'BOOL', 'UNARY', 'YIELD', 'UNARY_MATH', 'SUPER', 'THROW', '@', '->', '=>', '[', '(', '{', '--', '++'];

IMPLICIT_UNSPACED_CALL = ['+', '-'];

IMPLICIT_END = ['POST_IF', 'POST_META_IF', 'FOR', 'WHILE', 'UNTIL', 'WHEN', 'BY', 'LOOP', 'TERMINATOR'];

SINGLE_LINERS = ['ELSE', 'META_ELSE', '->', '=>', 'TRY', 'FINALLY', 'THEN'];

SINGLE_CLOSERS = ['TERMINATOR', 'CATCH', 'FINALLY', 'ELSE', 'META_ELSE', 'OUTDENT', 'LEADING_WHEN'];

LINEBREAKS = ['TERMINATOR', 'INDENT', 'OUTDENT'];

CALL_CLOSERS = ['.', '?.', '::', '?::'];

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmV3cml0ZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHdQQUFBO0lBQUE7OztBQVFFLGFBQWUsT0FBQSxDQUFRLFdBQVI7O0FBU1g7Ozt1QkFPRixPQUFBLEdBQVMsU0FBQyxPQUFELEVBQVUsSUFBVjtRQUFDLElBQUMsQ0FBQSxTQUFEO1FBQVMsSUFBQyxDQUFBLE9BQUQ7UUFFZixJQUFDLENBQUEscUJBQUQsQ0FBQTtRQUVBLElBQUMsQ0FBQSxTQUFELENBQUE7UUFFQSxJQUFDLENBQUEsY0FBRCxDQUFBO1FBQ0EsSUFBQyxDQUFBLGdCQUFELENBQUE7UUFDQSxJQUFDLENBQUEsY0FBRCxDQUFBO1FBQ0EsSUFBQyxDQUFBLHNCQUFELENBQUE7UUFDQSxJQUFDLENBQUEsMEJBQUQsQ0FBQTtRQUVBLElBQXVCLFVBQUEsQ0FBVyxJQUFDLENBQUEsSUFBWixFQUFrQixtQkFBbEIsQ0FBdkI7WUFBQSxJQUFDLENBQUEsZ0JBQUQsQ0FBQSxFQUFBOztRQUNBLElBQXVCLFVBQUEsQ0FBVyxJQUFDLENBQUEsSUFBWixFQUFrQixnQkFBbEIsQ0FBdkI7WUFBQSxJQUFDLENBQUEsYUFBRCxDQUFBLEVBQUE7O1FBRUEsSUFBQyxDQUFBLGdDQUFELENBQUE7UUFDQSxJQUFDLENBQUEsc0JBQUQsQ0FBQTtlQUNBLElBQUMsQ0FBQTtJQWpCSTs7dUJBd0JULFVBQUEsR0FBWSxTQUFDLEtBQUQ7QUFFUixZQUFBO1FBQUMsU0FBVTtRQUNYLENBQUEsR0FBSTtBQUNtQyxlQUFNLEtBQUEsR0FBUSxNQUFPLENBQUEsQ0FBQSxDQUFyQjtZQUF2QyxDQUFBLElBQUssS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFYLEVBQWlCLEtBQWpCLEVBQXdCLENBQXhCLEVBQTJCLE1BQTNCO1FBQWtDO2VBQ3ZDO0lBTFE7O3VCQU9aLFNBQUEsR0FBVyxTQUFDLENBQUQsRUFBSSxTQUFKLEVBQWUs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SUFBTCxFQUFVLElBQVYsRUFBZSxLQUFmIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuMDAwICAgMDAwICAwMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbjAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4wMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuMDAwICAgMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiMjI1xuXG57IGhhc0ZlYXR1cmUgfSA9IHJlcXVpcmUgJy4vaGVscGVycydcblxuIyBUaGUgbGFuZ3VhZ2UgaGFzIGEgZ29vZCBkZWFsIG9mIG9wdGlvbmFsLCBpbXBsaWNpdCBhbmQgc2hvcnRoYW5kIHN5bnRheC4gXG4jIFRoaXMgY2FuIGdyZWF0bHkgY29tcGxpY2F0ZSBhIGdyYW1tYXIgYW5kIGJsb2F0IHRoZSByZXN1bHRpbmcgcGFyc2UgdGFibGUuIFxuIyBJbnN0ZWFkIG9mIG1ha2luZyB0aGUgcGFyc2VyIGhhbmRsZSBpdCBhbGwsIHdlIHRha2UgYSBzZXJpZXMgb2YgcGFzc2VzIG92ZXIgdGhlIHRva2VuIHN0cmVhbSwgXG4jIHVzaW5nIHRoaXMgKipSZXdyaXRlcioqIHRvIGNvbnZlcnQgc2hvcnRoYW5kIGludG8gdGhlIHVuYW1iaWd1b3VzIGxvbmcgZm9ybSwgXG4jIGFkZCBpbXBsaWNpdCBpbmRlbnRhdGlvbiBhbmQgcGFyZW50aGVzZXMsIGFuZCBnZW5lcmFsbHkgY2xlYW4gdGhpbmdzIHVwLlxuIyBUaGUgUmV3cml0ZXIgaXMgdXNlZCBieSB0aGUgTGV4ZXIsIGRpcmVjdGx5IGFnYWluc3QgaXRzIGludGVybmFsIGFycmF5IG9mIHRva2Vucy5cblxuY2xhc3MgUmV3cml0ZXJcblxuICAgICMgUmV3cml0ZSB0aGUgdG9rZW4gc3RyZWFtIGluIG11bHRpcGxlIHBhc3Nlcywgb25lIGxvZ2ljYWwgZmlsdGVyIGF0IGEgdGltZS4gXG4gICAgIyBUaGlzIGNvdWxkIGNlcnRhaW5seSBiZSBjaGFuZ2VkIGludG8gYSBzaW5nbGUgcGFzcyB0aHJvdWdoIHRoZSBzdHJlYW0sIHdpdGggYSBiaWcgc3dpdGNoLCBcbiAgICAjIGJ1dCBpdCdzIG11Y2ggbmljZXIgdG8gd29yayB3aXRoIGxpa2UgdGhpcy4gXG4gICAgIyBUaGUgb3JkZXIgb2YgdGhlc2UgcGFzc2VzIG1hdHRlcnMgLS0gaW5kZW50YXRpb24gbXVzdCBiZSBjb3JyZWN0ZWQgYmVmb3JlIGltcGxpY2l0IHBhcmVudGhlc2VzIGNhbiBiZSB3cmFwcGVkIGFyb3VuZCBibG9ja3Mgb2YgY29kZS5cbiAgICBcbiAgICByZXdyaXRlOiAoQHRva2VucywgQG9wdHMpIC0+XG4gICAgICAgIFxuICAgICAgICBAcmVtb3ZlTGVhZGluZ05ld2xpbmVzKClcbiAgICAgICAgXG4gICAgICAgIEBzaG9ydGN1dHMoKSAjIGtvZmZlZVxuICAgICAgICBcbiAgICAgICAgQGNsb3NlT3BlbkNhbGxzKClcbiAgICAgICAgQGNsb3NlT3BlbkluZGV4ZXMoKVxuICAgICAgICBAbm9ybWFsaXplTGluZXMoKVxuICAgICAgICBAdGFnUG9zdGZpeENvbmRpdGlvbmFscygpXG4gICAgICAgIEBhZGRJbXBsaWNpdEJyYWNlc0FuZFBhcmVucygpXG4gICAgICAgIFxuICAgICAgICBAY29uZmlnUGFyYW1ldGVycygpIGlmIGhhc0ZlYXR1cmUgQG9wdHMsICdjb25maWdfcGFyYW1ldGVycycgIyBrb2ZmZWVcbiAgICAgICAgQG5lZ2F0aXZlSW5kZXgoKSAgICBpZiBoYXNGZWF0dXJlIEBvcHRzLCAnbmVnYXRpdmVfaW5kZXgnICAgICMga29mZmVlXG4gICAgICAgIFxuICAgICAgICBAYWRkTG9jYXRpb25EYXRhVG9HZW5lcmF0ZWRUb2tlbnMoKVxuICAgICAgICBAZml4T3V0ZGVudExvY2F0aW9uRGF0YSgpICAgXG4gICAgICAgIEB0b2tlbnNcblxuICAgICMgUmV3cml0ZSB0aGUgdG9rZW4gc3RyZWFtLCBsb29raW5nIG9uZSB0b2tlbiBhaGVhZCBhbmQgYmVoaW5kLlxuICAgICMgQWxsb3cgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgYmxvY2sgdG8gdGVsbCB1cyBob3cgbWFueSB0b2tlbnMgdG8gbW92ZVxuICAgICMgZm9yd2FyZHMgKG9yIGJhY2t3YXJkcykgaW4gdGhlIHN0cmVhbSwgdG8gbWFrZSBzdXJlIHdlIGRvbid0IG1pc3MgYW55dGhpbmdcbiAgICAjIGFzIHRva2VucyBhcmUgaW5zZXJ0ZWQgYW5kIHJlbW92ZWQsIGFuZCB0aGUgc3RyZWFtIGNoYW5nZXMgbGVuZ3RoIHVuZGVyIG91ciBmZWV0LlxuICAgIFxuICAgIHNjYW5Ub2tlbnM6IChibG9jaykgLT5cbiAgICAgICAgXG4gICAgICAgIHt0b2tlbnN9ID0gdGhpc1xuICAgICAgICBpID0gMFxuICAgICAgICBpICs9IGJsb2NrLmNhbGwgdGhpcywgdG9rZW4sIGksIHRva2VucyB3aGlsZSB0b2tlbiA9IHRva2Vuc1tpXVxuICAgICAgICB0cnVlXG5cbiAgICBkZXRlY3RFbmQ6IChpLCBjb25kaXRpb24sIGFjdGlvbikgLT5cbiAgICAgICAgXG4gICAgICAgIHt0b2tlbnN9ID0gdGhpc1xuICAgICAgICBsZXZlbHMgPSAwXG4gICAgICAgIHdoaWxlIHRva2VuID0gdG9rZW5zW2ldXG4gICAgICAgICAgICByZXR1cm4gYWN0aW9uLmNhbGwgdGhpcywgdG9rZW4sIGkgaWYgbGV2ZWxzIGlzIDAgYW5kIGNvbmRpdGlvbi5jYWxsIHRoaXMsIHRva2VuLCBpXG4gICAgICAgICAgICByZXR1cm4gYWN0aW9uLmNhbGwgdGhpcywgdG9rZW4sIGkgLSAxIGlmIG5vdCB0b2tlbiBvciBsZXZlbHMgPCAwXG4gICAgICAgICAgICBpZiB0b2tlblswXSBpbiBFWFBSRVNTSU9OX1NUQVJUXG4gICAgICAgICAgICAgICAgbGV2ZWxzICs9IDFcbiAgICAgICAgICAgIGVsc2UgaWYgdG9rZW5bMF0gaW4gRVhQUkVTU0lPTl9FTkRcbiAgICAgICAgICAgICAgICBsZXZlbHMgLT0gMVxuICAgICAgICAgICAgaSArPSAxXG4gICAgICAgIGkgLSAxXG5cbiAgICAjIExlYWRpbmcgbmV3bGluZXMgd291bGQgaW50cm9kdWNlIGFuIGFtYmlndWl0eSBpbiB0aGUgZ3JhbW1hciwgc28gd2UgZGlzcGF0Y2ggdGhlbSBoZXJlLlxuICAgIFxuICAgIHJlbW92ZUxlYWRpbmdOZXdsaW5lczogLT5cbiAgICAgICAgXG4gICAgICAgIGJyZWFrIGZvciBbdGFnXSwgaSBpbiBAdG9rZW5zIHdoZW4gdGFnICE9ICdURVJNSU5BVE9SJ1xuICAgICAgICBAdG9rZW5zLnNwbGljZSAwLCBpIGlmIGlcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG5cbiAgICBkb2VzTWF0Y2g6IChpbmRleCwgbWF0Y2gpIC0+XG5cbiAgICAgICAgaWYgdHlwZW9mKG1hdGNoKSA9PSAnc3RyaW5nJ1xuICAgICAgICAgICAgQHRhZyhpbmRleCkgPT0gbWF0Y2hcbiAgICAgICAgZWxzZSBpZiBtYXRjaC5jb25zdHJ1Y3RvciA9PSBPYmplY3RcbiAgICAgICAgICAgIHQgPSBAdG9rZW5zW2luZGV4XVxuICAgICAgICAgICAga2V5ID0gT2JqZWN0LmtleXMobWF0Y2gpWzBdXG4gICAgICAgICAgICB2YWwgPSBtYXRjaFtrZXldXG4gICAgICAgICAgICB0WzBdID09IGtleSBhbmQgdFsxXSA9PSB2YWxcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZmFsc2VcbiAgICBcbiAgICBjaGVjazogLT4gXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGwgPSBhcmd1bWVudHNcbiAgICAgICAgZm9yIGogaW4gWzAuLi5sLmxlbmd0aF0gYnkgMlxuICAgICAgICAgICAgaW5kZXggPSBsW2pdXG4gICAgICAgICAgICByZXR1cm4gZmFsc2UgaWYgaW5kZXggPCAwXG4gICAgICAgICAgICBpZiBsW2orMV0gaW5zdGFuY2VvZiBBcnJheVxuICAgICAgICAgICAgICAgIGZvdW5kID0gZmFsc2VcbiAgICAgICAgICAgICAgICBmb3IgZSBpbiBsW2orMV1cbiAgICAgICAgICAgICAgICAgICAgaWYgQGRvZXNNYXRjaCBpbmRleCwgZVxuICAgICAgICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIGlmIG5vdCBmb3VuZFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpZiBub3QgQGRvZXNNYXRjaCBpbmRleCwgbFtqKzFdXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB0cnVlXG4gICAgICAgIFxuICAgIGZpbmRNYXRjaGluZ1RhZ0JhY2t3YXJkczogKGNsb3NlLCBpLCBjaGVjaykgLT4gXG4gICAgICAgIFxuICAgICAgICBvcGVuID0geyBQQVJBTV9FTkQ6J1BBUkFNX1NUQVJUJywgJ10nOidbJywgJ30nOid7JyB9W2Nsb3NlXVxuICAgICAgICB3YXJuIFwiY2FudCBtYXRjaCAje2Nsb3NlfVwiIGlmIG5vdCBvcGVuXG4gICAgICAgIHB1c2hlZCA9IDBcbiAgICAgICAgaiA9IGlcbiAgICAgICAgd2hpbGUgai0tICMgd2FsayBiYWNrd2FyZHMgdW50aWwgbWF0Y2hpbmcgdGFnIGlzIGZvdW5kXG4gICAgICAgICAgICBjdXJyZW50ID0gQHRhZyhqKVxuICAgICAgICAgICAgaWYgY3VycmVudCA9PSBjbG9zZVxuICAgICAgICAgICAgICAgIHB1c2hlZCsrXG4gICAgICAgICAgICBlbHNlIGlmIGN1cnJlbnQgPT0gb3BlblxuICAgICAgICAgICAgICAgIGlmIHB1c2hlZFxuICAgICAgICAgICAgICAgICAgICBwdXNoZWQtLVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgcHVzaGVkID09IDAgIyBtYXRjaGluZyBicmFja2V0IGZvdW5kXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpbmRleDpqXG4gICAgICAgICAgICBlbHNlIGlmIGNoZWNrPyBhbmQgbm90IGNoZWNrIGN1cnJlbnQgXG4gICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICBpbmRleDotMVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgc2hvcnRjdXRzOiAtPlxuICAgICAgICBcbiAgICAgICAgQHNjYW5Ub2tlbnMgKHRva2VuLCBpLCB0b2tlbnMpIC0+XG5cbiAgICAgICAgICAgIGlmIGhhc0ZlYXR1cmUgQG9wdHMsICdjb25zdHJ1Y3Rvcl9zaG9ydGN1dCdcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBAY2hlY2sgaS0xLCAnQCcsIGksICc6JywgaSsxLCBbJy0+JyAnUEFSQU1fU1RBUlQnICdJREVOVElGSUVSJ11cbiAgICAgICAgICAgICAgICAgICAgdG9rZW5zW2ktMV1bMF0gPSAnUFJPUEVSVFknXG4gICAgICAgICAgICAgICAgICAgIHRva2Vuc1tpLTFdWzFdID0gJ2NvbnN0cnVjdG9yJ1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMVxuICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgaGFzRmVhdHVyZSBAb3B0cywgJ2NvbnNvbGVfc2hvcnRjdXQnXG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBAY2hlY2sgaSwgW3tJREVOVElGSUVSOidsb2cnfSB7SURFTlRJRklFUjond2Fybid9IHtJREVOVElGSUVSOidlcnJvcid9XSwgaSsxLCBbJ05VTUJFUicgJ0lERU5USUZJRVInICdQUk9QRVJUWScgJ1NUUklORycgJ1NUUklOR19TVEFSVCcgJ0NBTExfU1RBUlQnICdJRicgJ01FVEFfSUYnICdbJyAnKCcgJ3snICdAJ11cbiAgICAgICAgICAgICAgICAgICAgdG9rZW5bMF0gPSAnUFJPUEVSVFknXG4gICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSwgMCwgQGdlbmVyYXRlKCdJREVOVElGSUVSJywgJ2NvbnNvbGUnLCB0b2tlbiksIEBnZW5lcmF0ZSgnLicsICcuJywgdG9rZW4pXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAzXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgaGFzRmVhdHVyZSBAb3B0cywgJ29wdGlvbmFsX2NvbW1hdGEnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgQGNoZWNrIGksIFsnTlVNQkVSJyAnU1RSSU5HJyAnTlVMTCcgJ1VOREVGSU5FRCcgJ0JPT0wnICdTVFJJTkdfRU5EJywgJ30nXSwgaSsxLCBbJ05VTUJFUicgJ1NUUklORycgJ05VTEwnICdVTkRFRklORUQnICdCT09MJyAnU1RSSU5HX1NUQVJUJyAnSURFTlRJRklFUicgJ1BST1BFUlRZJyAneycgJygnICdbJ10gIFxuICAgICAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGkrMSwgMCwgQGdlbmVyYXRlICcsJywgJywnXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAyXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIEB0YWcoaSkgaW4gWyddJ10gYW5kIHRva2Vuc1tpXS5zcGFjZWQgYW5kIEB0YWcoaSsxKSBpbiBbJ05VTUJFUicgJ1NUUklORycgJ1NUUklOR19TVEFSVCcgJ0lERU5USUZJRVInICdQUk9QRVJUWScgJ3snICcoJyAnWyddICBcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2ggPSBAZmluZE1hdGNoaW5nVGFnQmFja3dhcmRzIEB0YWcoaSksIGksICh0YWcpIC0+IHRhZyBpbiBbJ05VTUJFUicgJ1NUUklORycgJ1BST1BFUlRZJyAnOicgJywnXVxuICAgICAgICAgICAgICAgICAgICBpZiBtYXRjaC5pbmRleCA+PSAwXG4gICAgICAgICAgICAgICAgICAgICAgICAjIGluc2VydCBjb21tYSBpZiBtYXRjaGluZyBicmFja2V0IGlzIG5vdCBwcmVjZWRlZCBieSBpZGVudGlmaWVyIG9yIGVuZCBvZiBjYWxsXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBtYXRjaC5pbmRleCA9PSAwIG9yIEB0YWcobWF0Y2guaW5kZXgtMSkgbm90IGluIFsnSURFTlRJRklFUicgJ0NBTExfRU5EJ10gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpKzEsIDAsIEBnZW5lcmF0ZSAnLCcsICcsJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBoYXNGZWF0dXJlIEBvcHRzLCAnbWV0YSdcbiAgICAgICAgICAgICAgICBpZiBAY2hlY2sgaS0xLCAnQCcsIGksICdQUk9QRVJUWSdcbiAgICAgICAgICAgICAgICAgICAgaWYgQHRhZyhpLTIpIG5vdCBpbiBbJ01FVEFfSUYnXVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgdG9rZW5bMV0gaW4gT2JqZWN0LmtleXMgQG9wdHMubWV0YVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGEgPSBAb3B0cy5tZXRhW3Rva2VuWzFdXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaS0xLCAwLCBAZ2VuZXJhdGUgJ01FVEFfSUYnLCAnaWYnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5zW2ktMV0uc3BhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkdiA9IDJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBAdGFnKGkrYWR2KSA9PSAnQ0FMTF9TVEFSVCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgQHRhZyhpK2FkdisrKSBub3QgaW4gWydDQUxMX0VORCcsICcpJywgJ1RFUk1JTkFUT1InXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgYSBpbiBbMC4uLihtZXRhLmluZm8/LmFyZ3MgPyAxKV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIEB0YWcoaSthZHYpIGluIFsnTlVNQkVSJywgJ1NUUklORyddXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJnKysgIyBhcmd1bWVudCBmb3VuZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkdisrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgYXJnID09IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSthZHYsIDAsIEBnZW5lcmF0ZSgnQ0FMTF9TVEFSVCcsICcoJyksIEBnZW5lcmF0ZSgnQ0FMTF9FTkQnLCAnKScpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZHYgKz0gMlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIG1ldGEuaW5mbz8udGhlbiBvciBAdGFnKGkrYWR2KSBub3QgaW4gWydURVJNSU5BVE9SJywgJ0lOREVOVCcsICdDQUxMX1NUQVJUJ11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpK2FkdisrLCAwLCBAZ2VuZXJhdGUgJ1RIRU4nLCAndGhlbidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWR2XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAxXG4gICAgXG4gICAgbmVnYXRpdmVJbmRleDogLT5cblxuICAgICAgICBAc2NhblRva2VucyAodG9rZW4sIGksIHRva2VucykgLT5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgQGNoZWNrIGktMSwgJ0lOREVYX1NUQVJUJywgaSwgJy0nLCBpKzEsICdOVU1CRVInLCBpKzIsICdJTkRFWF9FTkQnXG4gICAgICAgICAgICAgICAgaWYgQHRhZyhpLTIpIGluIFsnSURFTlRJRklFUicsICdQUk9QRVJUWScsICdTVFJJTkcnICdTVFJJTkdfRU5EJyAnXScgJyknXVxuICAgICAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGkrMiwgMCwgQGdlbmVyYXRlKCcuLicsICcuLicpLCBAZ2VuZXJhdGUodG9rZW5zW2ldWzBdLCB0b2tlbnNbaV1bMV0pLCBAZ2VuZXJhdGUodG9rZW5zW2krMV1bMF0sIHRva2Vuc1tpKzFdWzFdKVxuICAgICAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGkrNiwgMCwgQGdlbmVyYXRlKCdJTkRFWF9TVEFSVCcsICdbJyksIEBnZW5lcmF0ZSgnTlVNQkVSJywgJzAnKSwgQGdlbmVyYXRlKCdJTkRFWF9FTkQnLCAnXScpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiA3XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBsb2cgQHRhZyhpLTIpXG4gICAgICAgICAgICAxXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAgICAgIDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwICAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBjb25maWdQYXJhbWV0ZXJzOiAtPlxuICAgICAgICBcbiAgICAgICAgZGljdFBhcmFtU3RhcnQgPSAwXG4gICAgICAgIGRpY3RQYXJhbUVuZCAgID0gMFxuICAgICAgICBzdGFja0NvdW50ICAgICA9IDBcbiAgICAgICAgXG4gICAgICAgIGlzSW5zaWRlID0gLT4gZGljdFBhcmFtU3RhcnQgYW5kIG5vdCBzdGFja0NvdW50XG4gICAgICAgIFxuICAgICAgICBAc2NhblRva2VucyAodG9rZW4sIGksIHRva2VucykgLT5cblxuICAgICAgICAgICAgW3RhZ10gICAgID0gdG9rZW5cbiAgICAgICAgICAgIFtwcmV2VGFnXSA9IHByZXZUb2tlbiA9IGlmIGkgPiAwIHRoZW4gdG9rZW5zW2kgLSAxXSBlbHNlIFtdXG4gICAgICAgICAgICBbbmV4dFRhZ10gPSBpZiBpIDwgdG9rZW5zLmxlbmd0aCAtIDEgdGhlbiB0b2tlbnNbaSArIDFdIGVsc2UgW11cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgdGFnIGlzICd7J1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIHByZXZUYWcgPT0gJ1BBUkFNX1NUQVJUJyBvciBwcmV2VGFnIG5vdCBpbiBbJ1snLCAneyddIGFuZCBAZmluZE1hdGNoaW5nVGFnQmFja3dhcmRzKCdQQVJBTV9FTkQnLCBpKS5pbmRleCA+PSAwXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vdCBkaWN0UGFyYW1TdGFydFxuICAgICAgICAgICAgICAgICAgICAgICAgZGljdFBhcmFtU3RhcnQgPSBpXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrQ291bnQrK1xuICAgICAgICAgICAgICAgIGVsc2UgaWYgZGljdFBhcmFtU3RhcnRcbiAgICAgICAgICAgICAgICAgICAgc3RhY2tDb3VudCsrXG4gICAgICAgICAgICBlbHNlIGlmIHRhZyBpcyAnfSdcbiAgICAgICAgICAgICAgICBpZiBkaWN0UGFyYW1TdGFydCBcbiAgICAgICAgICAgICAgICAgICAgaWYgbm90IHN0YWNrQ291bnRcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpY3RQYXJhbUVuZCA9IGlcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpY3RQYXJhbVN0YXJ0ID0gMFxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFja0NvdW50LS1cbiAgICAgICAgICAgIGVsc2UgXG4gICAgICAgICAgICAgICAgaWYgaXNJbnNpZGUoKVxuICAgICAgICAgICAgICAgICAgICBpZiB0YWcgPT0gJzonIGFuZCBuZXh0VGFnIG5vdCBpbiBbJ0lERU5USUZJRVInICdAJ11cbiAgICAgICAgICAgICAgICAgICAgICAgIG9wZW4gPSBAZmluZE1hdGNoaW5nVGFnQmFja3dhcmRzICd9JywgaVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgb3Blbi5pbmRleCA+PSAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgQHRhZyhvcGVuLmluZGV4LTEpIG5vdCBpbiBbJz0nXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGksIDEsIEBnZW5lcmF0ZSAnPScsICc9JyBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgbmV4dFRhZyBpbiBbJywnLCAnfSddXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGkrMSwgMCwgQGdlbmVyYXRlICdOVUxMJywgJ251bGwnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMlxuICAgICAgICAgICAgMVxuICAgICAgICAgICAgICAgICBcbiAgICAjIFRoZSBsZXhlciBoYXMgdGFnZ2VkIHRoZSBvcGVuaW5nIHBhcmVudGhlc2lzIG9mIGEgbWV0aG9kIGNhbGwuIE1hdGNoIGl0IHdpdGhcbiAgICAjIGl0cyBwYWlyZWQgY2xvc2UuIFdlIGhhdmUgdGhlIG1pcy1uZXN0ZWQgb3V0ZGVudCBjYXNlIGluY2x1ZGVkIGhlcmUgZm9yXG4gICAgIyBjYWxscyB0aGF0IGNsb3NlIG9uIHRoZSBzYW1lIGxpbmUsIGp1c3QgYmVmb3JlIHRoZWlyIG91dGRlbnQuXG4gICAgXG4gICAgY2xvc2VPcGVuQ2FsbHM6IC0+XG4gICAgICAgIFxuICAgICAgICBjb25kaXRpb24gPSAodG9rZW4sIGkpIC0+XG4gICAgICAgICAgICB0b2tlblswXSBpbiBbJyknICdDQUxMX0VORCddIG9yXG4gICAgICAgICAgICB0b2tlblswXSBpcyAnT1VUREVOVCcgYW5kIEB0YWcoaSAtIDEpIGlzICcpJ1xuXG4gICAgICAgIGFjdGlvbiA9ICh0b2tlbiwgaSkgLT5cbiAgICAgICAgICAgIEB0b2tlbnNbaWYgdG9rZW5bMF0gaXMgJ09VVERFTlQnIHRoZW4gaSAtIDEgZWxzZSBpXVswXSA9ICdDQUxMX0VORCdcblxuICAgICAgICBAc2NhblRva2VucyAodG9rZW4sIGkpIC0+XG4gICAgICAgICAgICBAZGV0ZWN0RW5kIGkgKyAxLCBjb25kaXRpb24sIGFjdGlvbiBpZiB0b2tlblswXSBpcyAnQ0FMTF9TVEFSVCdcbiAgICAgICAgICAgIDFcblxuICAgICMgVGhlIGxleGVyIGhhcyB0YWdnZWQgdGhlIG9wZW5pbmcgcGFyZW50aGVzaXMgb2YgYW4gaW5kZXhpbmcgb3BlcmF0aW9uIGNhbGwuXG4gICAgIyBNYXRjaCBpdCB3aXRoIGl0cyBwYWlyZWQgY2xvc2UuXG4gICAgXG4gICAgY2xvc2VPcGVuSW5kZXhlczogLT5cbiAgICAgICAgXG4gICAgICAgIGNvbmRpdGlvbiA9ICh0b2tlbiwgaSkgLT5cbiAgICAgICAgICAgIHRva2VuWzBdIGluIFsnXScgJ0lOREVYX0VORCddXG5cbiAgICAgICAgYWN0aW9uID0gKHRva2VuLCBpKSAtPlxuICAgICAgICAgICAgdG9rZW5bMF0gPSAnSU5ERVhfRU5EJ1xuXG4gICAgICAgIEBzY2FuVG9rZW5zICh0b2tlbiwgaSkgLT5cbiAgICAgICAgICAgIEBkZXRlY3RFbmQgaSArIDEsIGNvbmRpdGlvbiwgYWN0aW9uIGlmIHRva2VuWzBdIGlzICdJTkRFWF9TVEFSVCdcbiAgICAgICAgICAgIDFcblxuICAgICMgTWF0Y2ggdGFncyBpbiB0b2tlbiBzdHJlYW0gc3RhcnRpbmcgYXQgYGlgIHdpdGggYHBhdHRlcm5gLCBza2lwcGluZyAnSEVSRUNPTU1FTlQncy5cbiAgICAjIGBwYXR0ZXJuYCBtYXkgY29uc2lzdCBvZiBzdHJpbmdzIChlcXVhbGl0eSksIGFuIGFycmF5IG9mIHN0cmluZ3MgKG9uZSBvZilcbiAgICAjIG9yIG51bGwgKHdpbGRjYXJkKS4gUmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIG1hdGNoIG9yIC0xIGlmIG5vIG1hdGNoLlxuICAgIFxuICAgIGluZGV4T2ZUYWc6IChpLCBwYXR0ZXJuLi4uKSAtPlxuICAgICAgICBmdXp6ID0gMFxuICAgICAgICBmb3IgaiBpbiBbMCAuLi4gcGF0dGVybi5sZW5ndGhdXG4gICAgICAgICAgICBmdXp6ICs9IDIgd2hpbGUgQHRhZyhpICsgaiArIGZ1enopIGlzICdIRVJFQ09NTUVOVCdcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIG5vdCBwYXR0ZXJuW2pdP1xuICAgICAgICAgICAgcGF0dGVybltqXSA9IFtwYXR0ZXJuW2pdXSBpZiB0eXBlb2YgcGF0dGVybltqXSBpcyAnc3RyaW5nJ1xuICAgICAgICAgICAgcmV0dXJuIC0xIGlmIEB0YWcoaSArIGogKyBmdXp6KSBub3QgaW4gcGF0dGVybltqXVxuICAgICAgICBpICsgaiArIGZ1enogLSAxXG5cbiAgICAjIGBAPHg+OmAsIGA8eD46YCBvciBgPEVYUFJFU1NJT05fU1RBUlQ+PHg+Li4uPEVYUFJFU1NJT05fRU5EPjpgLCBza2lwcGluZyBvdmVyICdIRVJFQ09NTUVOVCdzLlxuICAgIFxuICAgIGxvb2tzT2JqZWN0aXNoOiAoaikgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB5ZXMgaWYgQGluZGV4T2ZUYWcoaiwgJ0AnLCBudWxsLCAnOicpID4gLTEgb3IgQGluZGV4T2ZUYWcoaiwgbnVsbCwgJzonKSA+IC0xXG4gICAgICAgIFxuICAgICAgICBpbmRleCA9IEBpbmRleE9mVGFnKGosIEVYUFJFU1NJT05fU1RBUlQpXG4gICAgICAgIGlmIGluZGV4ID4gLTFcbiAgICAgICAgICAgIGVuZCA9IG51bGxcbiAgICAgICAgICAgIEBkZXRlY3RFbmQgaW5kZXggKyAxLCAoKHRva2VuKSAtPiB0b2tlblswXSBpbiBFWFBSRVNTSU9OX0VORCksICgodG9rZW4sIGkpIC0+IGVuZCA9IGkpXG4gICAgICAgICAgICByZXR1cm4geWVzIGlmIEB0YWcoZW5kICsgMSkgaXMgJzonXG4gICAgICAgIG5vXG5cbiAgICAjIFJldHVybnMgYHllc2AgaWYgY3VycmVudCBsaW5lIG9mIHRva2VucyBjb250YWluIGFuIGVsZW1lbnQgb2YgdGFncyBvbiBzYW1lIGV4cHJlc3Npb24gbGV2ZWwuIFxuICAgICMgU3RvcCBzZWFyY2hpbmcgYXQgTElORUJSRUFLUyBvciBleHBsaWNpdCBzdGFydCBvZiBjb250YWluaW5nIGJhbGFuY2VkIGV4cHJlc3Npb24uXG4gICAgXG4gICAgZmluZFRhZ3NCYWNrd2FyZHM6IChpLCB0YWdzKSAtPlxuICAgICAgICBiYWNrU3RhY2sgPSBbXVxuICAgICAgICB3aGlsZSBpID49IDAgYW5kIChiYWNrU3RhY2subGVuZ3RoIG9yXG4gICAgICAgICAgICAgICAgICAgIEB0YWcoaSkgbm90IGluIHRhZ3MgYW5kXG4gICAgICAgICAgICAgICAgICAgIChAdGFnKGkpIG5vdCBpbiBFWFBSRVNTSU9OX1NUQVJUIG9yIEB0b2tlbnNbaV0uZ2VuZXJhdGVkKSBhbmRcbiAgICAgICAgICAgICAgICAgICAgQHRhZyhpKSBub3QgaW4gTElORUJSRUFLUylcbiAgICAgICAgICAgIGJhY2tTdGFjay5wdXNoIEB0YWcoaSkgaWYgQHRhZyhpKSBpbiBFWFBSRVNTSU9OX0VORFxuICAgICAgICAgICAgYmFja1N0YWNrLnBvcCgpIGlmIEB0YWcoaSkgaW4gRVhQUkVTU0lPTl9TVEFSVCBhbmQgYmFja1N0YWNrLmxlbmd0aFxuICAgICAgICAgICAgaSAtPSAxXG4gICAgICAgIEB0YWcoaSkgaW4gdGFnc1xuXG4gICAgIyAwMDAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgIyBMb29rIGZvciBzaWducyBvZiBpbXBsaWNpdCBjYWxscyBhbmQgb2JqZWN0cyBpbiB0aGUgdG9rZW4gc3RyZWFtIGFuZCBhZGQgdGhlbS5cbiAgICAgICAgXG4gICAgYWRkSW1wbGljaXRCcmFjZXNBbmRQYXJlbnM6IC0+XG5cbiAgICAgICAgIyBUcmFjayBjdXJyZW50IGJhbGFuY2luZyBkZXB0aCAoYm90aCBpbXBsaWNpdCBhbmQgZXhwbGljaXQpIG9uIHN0YWNrLlxuICAgICAgICBzdGFjayA9IFtdXG4gICAgICAgIHN0YXJ0ID0gbnVsbFxuXG4gICAgICAgIEBzY2FuVG9rZW5zICh0b2tlbiwgaSwgdG9rZW5zKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBbdGFnXSAgICAgPSB0b2tlblxuICAgICAgICAgICAgW3ByZXZUYWddID0gcHJldlRva2VuID0gaWYgaSA+IDAgdGhlbiB0b2tlbnNbaSAtIDFdIGVsc2UgW11cbiAgICAgICAgICAgIFtuZXh0VGFnXSA9IGlmIGkgPCB0b2tlbnMubGVuZ3RoIC0gMSB0aGVuIHRva2Vuc1tpICsgMV0gZWxzZSBbXVxuICAgICAgICAgICAgc3RhY2tUb3AgID0gLT4gc3RhY2tbc3RhY2subGVuZ3RoIC0gMV1cbiAgICAgICAgICAgIHN0YXJ0SWR4ICA9IGlcblxuICAgICAgICAgICAgIyBIZWxwZXIgZnVuY3Rpb24sIHVzZWQgZm9yIGtlZXBpbmcgdHJhY2sgb2YgdGhlIG51bWJlciBvZiB0b2tlbnMgY29uc3VtZWRcbiAgICAgICAgICAgICMgYW5kIHNwbGljZWQsIHdoZW4gcmV0dXJuaW5nIGZvciBnZXR0aW5nIGEgbmV3IHRva2VuLlxuICAgICAgICAgICAgZm9yd2FyZCAgID0gKG4pIC0+IGkgLSBzdGFydElkeCArIG5cblxuICAgICAgICAgICAgIyBIZWxwZXIgZnVuY3Rpb25zXG4gICAgICAgICAgICBpc0ltcGxpY2l0ICAgICAgICAgID0gKHN0YWNrSXRlbSkgLT4gc3RhY2tJdGVtP1syXT8ub3Vyc1xuICAgICAgICAgICAgaXNJbXBsaWNpdE9iamVjdCAgICA9IChzdGFja0l0ZW0pIC0+IGlzSW1wbGljaXQoc3RhY2tJdGVtKSBhbmQgc3RhY2tJdGVtP1swXSBpcyAneydcbiAgICAgICAgICAgIGlzSW1wbGljaXRDYWxsICAgICAgPSAoc3RhY2tJdGVtKSAtPiBpc0ltcGxpY2l0KHN0YWNrSXRlbSkgYW5kIHN0YWNrSXRlbT9bMF0gaXMgJygnXG4gICAgICAgICAgICBpbkltcGxpY2l0ICAgICAgICAgID0gLT4gaXNJbXBsaWNpdCBzdGFja1RvcCgpXG4gICAgICAgICAgICBpbkltcGxpY2l0Q2FsbCAgICAgID0gLT4gaXNJbXBsaWNpdENhbGwgc3RhY2tUb3AoKVxuICAgICAgICAgICAgaW5JbXBsaWNpdE9iamVjdCAgICA9IC0+IGlzSW1wbGljaXRPYmplY3Qgc3RhY2tUb3AoKVxuICAgICAgICAgICAgIyBVbmNsb3NlZCBjb250cm9sIHN0YXRlbWVudCBpbnNpZGUgaW1wbGljaXQgcGFyZW5zIChsaWtlXG4gICAgICAgICAgICAjIGNsYXNzIGRlY2xhcmF0aW9uIG9yIGlmLWNvbmRpdGlvbmFscylcbiAgICAgICAgICAgIGluSW1wbGljaXRDb250cm9sID0gLT4gaW5JbXBsaWNpdCBhbmQgc3RhY2tUb3AoKT9bMF0gaXMgJ0NPTlRST0wnXG5cbiAgICAgICAgICAgIHN0YXJ0SW1wbGljaXRDYWxsID0gKGopIC0+XG4gICAgICAgICAgICAgICAgaWR4ID0gaiA/IGlcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoIFsnKCcsIGlkeCwgb3VyczogeWVzXVxuICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaWR4LCAwLCBSZXdyaXRlci5nZW5lcmF0ZSAnQ0FMTF9TVEFSVCcsICcoJywgWycnLCAnaW1wbGljaXQgZnVuY3Rpb24gY2FsbCcsIHRva2VuWzJdXVxuICAgICAgICAgICAgICAgIGkgKz0gMSBpZiBub3Qgaj9cblxuICAgICAgICAgICAgZW5kSW1wbGljaXRDYWxsID0gLT5cbiAgICAgICAgICAgICAgICBzdGFjay5wb3AoKVxuICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSwgMCwgUmV3cml0ZXIuZ2VuZXJhdGUgJ0NBTExfRU5EJywgJyknLCBbJycsICdlbmQgb2YgaW5wdXQnLCB0b2tlblsyXV1cbiAgICAgICAgICAgICAgICBpICs9IDFcblxuICAgICAgICAgICAgc3RhcnRJbXBsaWNpdE9iamVjdCA9IChqLCBzdGFydHNMaW5lID0geWVzKSAtPlxuICAgICAgICAgICAgICAgIGlkeCA9IGogPyBpXG4gICAgICAgICAgICAgICAgc3RhY2sucHVzaCBbJ3snLCBpZHgsIHNhbWVMaW5lOiB5ZXMsIHN0YXJ0c0xpbmU6IHN0YXJ0c0xpbmUsIG91cnM6IHllc11cbiAgICAgICAgICAgICAgICB2YWwgPSBuZXcgU3RyaW5nICd7J1xuICAgICAgICAgICAgICAgIHZhbC5nZW5lcmF0ZWQgPSB5ZXNcbiAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGlkeCwgMCwgUmV3cml0ZXIuZ2VuZXJhdGUgJ3snLCB2YWwsIHRva2VuXG4gICAgICAgICAgICAgICAgaSArPSAxIGlmIG5vdCBqP1xuXG4gICAgICAgICAgICBlbmRJbXBsaWNpdE9iamVjdCA9IChqKSAtPlxuICAgICAgICAgICAgICAgIGogPSBqID8gaVxuICAgICAgICAgICAgICAgIHN0YWNrLnBvcCgpXG4gICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBqLCAwLCBSZXdyaXRlci5nZW5lcmF0ZSAnfScsICd9JywgdG9rZW5cbiAgICAgICAgICAgICAgICBpICs9IDFcblxuICAgICAgICAgICAgIyBEb24ndCBlbmQgYW4gaW1wbGljaXQgY2FsbCBvbiBuZXh0IGluZGVudCBpZiBhbnkgb2YgdGhlc2UgYXJlIGluIGFuIGFyZ3VtZW50XG4gICAgICAgICAgICBpZiBpbkltcGxpY2l0Q2FsbCgpIGFuZCB0YWcgaW4gWydJRicgJ01FVEFfSUYnLCAnVFJZJyAnRklOQUxMWScgJ0NBVENIJyAnQ0xBU1MnICdTV0lUQ0gnXVxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2ggWydDT05UUk9MJywgaSwgb3VyczogeWVzXVxuICAgICAgICAgICAgICAgIHJldHVybiBmb3J3YXJkKDEpXG5cbiAgICAgICAgICAgIGlmIHRhZyBpcyAnSU5ERU5UJyBhbmQgaW5JbXBsaWNpdCgpXG5cbiAgICAgICAgICAgICAgICAjIEFuIGBJTkRFTlRgIGNsb3NlcyBhbiBpbXBsaWNpdCBjYWxsIHVubGVzc1xuICAgICAgICAgICAgICAgICNcbiAgICAgICAgICAgICAgICAjICAgIDEuIFdlIGhhdmUgc2VlbiBhIGBDT05UUk9MYCBhcmd1bWVudCBvbiB0aGUgbGluZS5cbiAgICAgICAgICAgICAgICAjICAgIDIuIFRoZSBsYXN0IHRva2VuIGJlZm9yZSB0aGUgaW5kZW50IGlzIHBhcnQgb2YgdGhlIGxpc3QgYmVsb3dcbiAgICAgICAgICAgICAgICAjXG4gICAgICAgICAgICAgICAgaWYgcHJldlRhZyBub3QgaW4gWyc9PicgJy0+JyAnWycgJygnICcsJyAneycgJ1RSWScgJ0VMU0UnLCAnTUVUQV9FTFNFJyAnPSddXG4gICAgICAgICAgICAgICAgICAgIGVuZEltcGxpY2l0Q2FsbCgpIHdoaWxlIGluSW1wbGljaXRDYWxsKClcbiAgICAgICAgICAgICAgICBzdGFjay5wb3AoKSBpZiBpbkltcGxpY2l0Q29udHJvbCgpXG4gICAgICAgICAgICAgICAgc3RhY2sucHVzaCBbdGFnLCBpXVxuICAgICAgICAgICAgICAgIHJldHVybiBmb3J3YXJkKDEpXG5cbiAgICAgICAgICAgICMgU3RyYWlnaHRmb3J3YXJkIHN0YXJ0IG9mIGV4cGxpY2l0IGV4cHJlc3Npb25cbiAgICAgICAgICAgIGlmIHRhZyBpbiBFWFBSRVNTSU9OX1NUQVJUXG4gICAgICAgICAgICAgICAgc3RhY2sucHVzaCBbdGFnLCBpXVxuICAgICAgICAgICAgICAgIHJldHVybiBmb3J3YXJkKDEpXG5cbiAgICAgICAgICAgICMgQ2xvc2UgYWxsIGltcGxpY2l0IGV4cHJlc3Npb25zIGluc2lkZSBvZiBleHBsaWNpdGx5IGNsb3NlZCBleHByZXNzaW9ucy5cbiAgICAgICAgICAgIGlmIHRhZyBpbiBFWFBSRVNTSU9OX0VORFxuICAgICAgICAgICAgICAgIHdoaWxlIGluSW1wbGljaXQoKVxuICAgICAgICAgICAgICAgICAgICBpZiBpbkltcGxpY2l0Q2FsbCgpXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmRJbXBsaWNpdENhbGwoKVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGluSW1wbGljaXRPYmplY3QoKVxuICAgICAgICAgICAgICAgICAgICAgICAgZW5kSW1wbGljaXRPYmplY3QoKVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFjay5wb3AoKVxuICAgICAgICAgICAgICAgIHN0YXJ0ID0gc3RhY2sucG9wKClcblxuICAgICAgICAgICAgIyBSZWNvZ25pemUgc3RhbmRhcmQgaW1wbGljaXQgY2FsbHMgbGlrZVxuICAgICAgICAgICAgIyBmIGEsIGYoKSBiLCBmPyBjLCBoWzBdIGQgZXRjLlxuICAgICAgICAgICAgaWYgKHRhZyBpbiBJTVBMSUNJVF9GVU5DIGFuZCB0b2tlbi5zcGFjZWQgb3JcbiAgICAgICAgICAgICAgICAgICAgdGFnIGlzICc/JyBhbmQgaSA+IDAgYW5kIG5vdCB0b2tlbnNbaSAtIDFdLnNwYWNlZCkgYW5kXG4gICAgICAgICAgICAgICAgIChuZXh0VGFnIGluIElNUExJQ0lUX0NBTEwgb3JcbiAgICAgICAgICAgICAgICAgICAgbmV4dFRhZyBpbiBJTVBMSUNJVF9VTlNQQUNFRF9DQUxMIGFuZFxuICAgICAgICAgICAgICAgICAgICBub3QgdG9rZW5zW2kgKyAxXT8uc3BhY2VkIGFuZCBub3QgdG9rZW5zW2kgKyAxXT8ubmV3TGluZSlcbiAgICAgICAgICAgICAgICB0YWcgPSB0b2tlblswXSA9ICdGVU5DX0VYSVNUJyBpZiB0YWcgaXMgJz8nXG4gICAgICAgICAgICAgICAgc3RhcnRJbXBsaWNpdENhbGwgaSArIDFcbiAgICAgICAgICAgICAgICByZXR1cm4gZm9yd2FyZCgyKVxuXG4gICAgICAgICAgICAjIEltcGxpY2l0IGNhbGwgdGFraW5nIGFuIGltcGxpY2l0IGluZGVudGVkIG9iamVjdCBhcyBmaXJzdCBhcmd1bWVudC5cbiAgICAgICAgICAgICNcbiAgICAgICAgICAgICMgICAgICAgICAgIGZcbiAgICAgICAgICAgICMgICAgICAgICAgICAgICBhOiBiXG4gICAgICAgICAgICAjICAgICAgICAgICAgICAgYzogZFxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyBhbmRcbiAgICAgICAgICAgICNcbiAgICAgICAgICAgICMgICAgICAgICAgIGZcbiAgICAgICAgICAgICMgICAgICAgICAgICAgICAxXG4gICAgICAgICAgICAjICAgICAgICAgICAgICAgYTogYlxuICAgICAgICAgICAgIyAgICAgICAgICAgICAgIGI6IGNcbiAgICAgICAgICAgICNcbiAgICAgICAgICAgICMgRG9uJ3QgYWNjZXB0IGltcGxpY2l0IGNhbGxzIG9mIHRoaXMgdHlwZSwgd2hlbiBvbiB0aGUgc2FtZSBsaW5lXG4gICAgICAgICAgICAjIGFzIHRoZSBjb250cm9sIHN0cnVjdHVyZXMgYmVsb3cgYXMgdGhhdCBtYXkgbWlzaW50ZXJwcmV0IGNvbnN0cnVjdHMgbGlrZTpcbiAgICAgICAgICAgICNcbiAgICAgICAgICAgICMgICAgICAgICAgIGlmIGZcbiAgICAgICAgICAgICMgICAgICAgICAgICAgICAgYTogMVxuICAgICAgICAgICAgIyBhc1xuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyAgICAgICAgICAgaWYgZihhOiAxKVxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyB3aGljaCBpcyBwcm9iYWJseSBhbHdheXMgdW5pbnRlbmRlZC5cbiAgICAgICAgICAgICMgRnVydGhlcm1vcmUgZG9uJ3QgYWxsb3cgdGhpcyBpbiBsaXRlcmFsIGFycmF5cywgYXMgdGhhdCBjcmVhdGVzIGdyYW1tYXRpY2FsIGFtYmlndWl0aWVzLlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiB0YWcgaW4gSU1QTElDSVRfRlVOQyBhbmRcbiAgICAgICAgICAgICAgICAgQGluZGV4T2ZUYWcoaSArIDEsICdJTkRFTlQnKSA+IC0xIGFuZCBAbG9va3NPYmplY3Rpc2goaSArIDIpIGFuZFxuICAgICAgICAgICAgICAgICBub3QgQGZpbmRUYWdzQmFja3dhcmRzKGksIFsnQ0xBU1MnICdFWFRFTkRTJyAnSUYnICdNRVRBX0lGJyAnQ0FUQ0gnICdTV0lUQ0gnICdMRUFESU5HX1dIRU4nICdGT1InICdXSElMRScgJ1VOVElMJ10pXG4gICAgICAgICAgICAgICAgc3RhcnRJbXBsaWNpdENhbGwgaSArIDFcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoIFsnSU5ERU5UJywgaSArIDJdXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvcndhcmQoMylcblxuICAgICAgICAgICAgIyBJbXBsaWNpdCBvYmplY3RzIHN0YXJ0IGhlcmVcbiAgICAgICAgICAgIGlmIHRhZyBpcyAnOidcbiAgICAgICAgICAgICAgICAjIEdvIGJhY2sgdG8gdGhlIChpbXBsaWNpdCkgc3RhcnQgb2YgdGhlIG9iamVjdFxuICAgICAgICAgICAgICAgIHMgPSBzd2l0Y2hcbiAgICAgICAgICAgICAgICAgICAgd2hlbiBAdGFnKGkgLSAxKSBpbiBFWFBSRVNTSU9OX0VORCB0aGVuIHN0YXJ0WzFdXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gQHRhZyhpIC0gMikgaXMgJ0AnIHRoZW4gaSAtIDJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpIC0gMVxuICAgICAgICAgICAgICAgIHMgLT0gMiB3aGlsZSBAdGFnKHMgLSAyKSBpcyAnSEVSRUNPTU1FTlQnXG5cbiAgICAgICAgICAgICAgICAjIE1hcmsgaWYgdGhlIHZhbHVlIGlzIGEgZm9yIGxvb3BcbiAgICAgICAgICAgICAgICBAaW5zaWRlRm9yRGVjbGFyYXRpb24gPSBuZXh0VGFnIGlzICdGT1InXG5cbiAgICAgICAgICAgICAgICBzdGFydHNMaW5lID0gcyBpcyAwIG9yIEB0YWcocyAtIDEpIGluIExJTkVCUkVBS1Mgb3IgdG9rZW5zW3MgLSAxXS5uZXdMaW5lXG4gICAgICAgICAgICAgICAgIyBBcmUgd2UganVzdCBjb250aW51aW5nIGFuIGFscmVhZHkgZGVjbGFyZWQgb2JqZWN0P1xuICAgICAgICAgICAgICAgIGlmIHN0YWNrVG9wKClcbiAgICAgICAgICAgICAgICAgICAgW3N0YWNrVGFnLCBzdGFja0lkeF0gPSBzdGFja1RvcCgpXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGFja1RhZyBpcyAneycgb3Igc3RhY2tUYWcgaXMgJ0lOREVOVCcgYW5kIEB0YWcoc3RhY2tJZHggLSAxKSBpcyAneycpIGFuZFxuICAgICAgICAgICAgICAgICAgICAgICAgIChzdGFydHNMaW5lIG9yIEB0YWcocyAtIDEpIGlzICcsJyBvciBAdGFnKHMgLSAxKSBpcyAneycpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm9yd2FyZCgxKVxuXG4gICAgICAgICAgICAgICAgc3RhcnRJbXBsaWNpdE9iamVjdChzLCAhIXN0YXJ0c0xpbmUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvcndhcmQoMilcblxuICAgICAgICAgICAgIyBFbmQgaW1wbGljaXQgY2FsbHMgd2hlbiBjaGFpbmluZyBtZXRob2QgY2FsbHNcbiAgICAgICAgICAgICMgbGlrZSBlLmcuOlxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyAgICAgICAgICAgZiAtPlxuICAgICAgICAgICAgIyAgICAgICAgICAgICAgIGFcbiAgICAgICAgICAgICMgICAgICAgICAgIC5nIGIsIC0+XG4gICAgICAgICAgICAjICAgICAgICAgICAgICAgY1xuICAgICAgICAgICAgIyAgICAgICAgICAgLmggYVxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyBhbmQgYWxzb1xuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyAgICAgICAgICAgZiBhXG4gICAgICAgICAgICAjICAgICAgICAgICAuZyBiXG4gICAgICAgICAgICAjICAgICAgICAgICAuaCBhXG5cbiAgICAgICAgICAgICMgTWFyayBhbGwgZW5jbG9zaW5nIG9iamVjdHMgYXMgbm90IHNhbWVMaW5lXG4gICAgICAgICAgICBpZiB0YWcgaW4gTElORUJSRUFLU1xuICAgICAgICAgICAgICAgIGZvciBzdGFja0l0ZW0gaW4gc3RhY2sgYnkgLTFcbiAgICAgICAgICAgICAgICAgICAgYnJlYWsgdW5sZXNzIGlzSW1wbGljaXQgc3RhY2tJdGVtXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrSXRlbVsyXS5zYW1lTGluZSA9IG5vIGlmIGlzSW1wbGljaXRPYmplY3Qgc3RhY2tJdGVtXG5cbiAgICAgICAgICAgIG5ld0xpbmUgPSBwcmV2VGFnIGlzICdPVVRERU5UJyBvciBwcmV2VG9rZW4ubmV3TGluZVxuICAgICAgICAgICAgaWYgdGFnIGluIElNUExJQ0lUX0VORCBvciB0YWcgaW4gQ0FMTF9DTE9TRVJTIGFuZCBuZXdMaW5lXG4gICAgICAgICAgICAgICAgd2hpbGUgaW5JbXBsaWNpdCgpXG4gICAgICAgICAgICAgICAgICAgIFtzdGFja1RhZywgc3RhY2tJZHgsIHtzYW1lTGluZSwgc3RhcnRzTGluZX1dID0gc3RhY2tUb3AoKVxuICAgICAgICAgICAgICAgICAgICAjIENsb3NlIGltcGxpY2l0IGNhbGxzIHdoZW4gcmVhY2hlZCBlbmQgb2YgYXJndW1lbnQgbGlzdFxuICAgICAgICAgICAgICAgICAgICBpZiBpbkltcGxpY2l0Q2FsbCgpIGFuZCBwcmV2VGFnICE9ICcsJ1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5kSW1wbGljaXRDYWxsKClcbiAgICAgICAgICAgICAgICAgICAgIyBDbG9zZSBpbXBsaWNpdCBvYmplY3RzIHN1Y2ggYXM6XG4gICAgICAgICAgICAgICAgICAgICMgcmV0dXJuIGE6IDEsIGI6IDIgdW5sZXNzIHRydWVcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBpbkltcGxpY2l0T2JqZWN0KCkgYW5kIG5vdCBAaW5zaWRlRm9yRGVjbGFyYXRpb24gYW5kIHNhbWVMaW5lIGFuZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnICE9ICdURVJNSU5BVE9SJyBhbmQgcHJldlRhZyAhPSAnOidcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZEltcGxpY2l0T2JqZWN0KClcbiAgICAgICAgICAgICAgICAgICAgIyBDbG9zZSBpbXBsaWNpdCBvYmplY3RzIHdoZW4gYXQgZW5kIG9mIGxpbmUsIGxpbmUgZGlkbid0IGVuZCB3aXRoIGEgY29tbWFcbiAgICAgICAgICAgICAgICAgICAgIyBhbmQgdGhlIGltcGxpY2l0IG9iamVjdCBkaWRuJ3Qgc3RhcnQgdGhlIGxpbmUgb3IgdGhlIG5leHQgbGluZSBkb2Vzbid0IGxvb2sgbGlrZVxuICAgICAgICAgICAgICAgICAgICAjIHRoZSBjb250aW51YXRpb24gb2YgYW4gb2JqZWN0LlxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGluSW1wbGljaXRPYmplY3QoKSBhbmQgdGFnIGlzICdURVJNSU5BVE9SJyBhbmQgcHJldlRhZyAhPSAnLCcgYW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3QgKHN0YXJ0c0xpbmUgYW5kIEBsb29rc09iamVjdGlzaChpICsgMSkpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm9yd2FyZCAxIGlmIG5leHRUYWcgaXMgJ0hFUkVDT01NRU5UJ1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5kSW1wbGljaXRPYmplY3QoKVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICAjIENsb3NlIGltcGxpY2l0IG9iamVjdCBpZiBjb21tYSBpcyB0aGUgbGFzdCBjaGFyYWN0ZXJcbiAgICAgICAgICAgICMgYW5kIHdoYXQgY29tZXMgYWZ0ZXIgZG9lc24ndCBsb29rIGxpa2UgaXQgYmVsb25ncy5cbiAgICAgICAgICAgICMgVGhpcyBpcyB1c2VkIGZvciB0cmFpbGluZyBjb21tYXMgYW5kIGNhbGxzLCBsaWtlOlxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyAgICAgICAgICAgeCA9XG4gICAgICAgICAgICAjICAgICAgICAgICAgICAgICAgIGE6IGIsXG4gICAgICAgICAgICAjICAgICAgICAgICAgICAgICAgIGM6IGQsXG4gICAgICAgICAgICAjICAgICAgICAgICBlID0gMlxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyBhbmRcbiAgICAgICAgICAgICNcbiAgICAgICAgICAgICMgICAgICAgICAgIGYgYSwgYjogYywgZDogZSwgZiwgZzogaDogaSwgalxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgaWYgdGFnIGlzICcsJyBhbmQgbm90IEBsb29rc09iamVjdGlzaChpICsgMSkgYW5kIGluSW1wbGljaXRPYmplY3QoKSBhbmRcbiAgICAgICAgICAgICAgICAgbm90IEBpbnNpZGVGb3JEZWNsYXJhdGlvbiBhbmRcbiAgICAgICAgICAgICAgICAgKG5leHRUYWcgIT0gJ1RFUk1JTkFUT1InIG9yIG5vdCBAbG9va3NPYmplY3Rpc2goaSArIDIpKVxuICAgICAgICAgICAgICAgICMgV2hlbiBuZXh0VGFnIGlzIE9VVERFTlQgdGhlIGNvbW1hIGlzIGluc2lnbmlmaWNhbnQgYW5kXG4gICAgICAgICAgICAgICAgIyBzaG91bGQganVzdCBiZSBpZ25vcmVkIHNvIGVtYmVkIGl0IGluIHRoZSBpbXBsaWNpdCBvYmplY3QuXG4gICAgICAgICAgICAgICAgI1xuICAgICAgICAgICAgICAgICMgV2hlbiBpdCBpc24ndCB0aGUgY29tbWEgZ28gb24gdG8gcGxheSBhIHJvbGUgaW4gYSBjYWxsIG9yXG4gICAgICAgICAgICAgICAgIyBhcnJheSBmdXJ0aGVyIHVwIHRoZSBzdGFjaywgc28gZ2l2ZSBpdCBhIGNoYW5jZS5cblxuICAgICAgICAgICAgICAgIG9mZnNldCA9IGlmIG5leHRUYWcgaXMgJ09VVERFTlQnIHRoZW4gMSBlbHNlIDBcbiAgICAgICAgICAgICAgICB3aGlsZSBpbkltcGxpY2l0T2JqZWN0KClcbiAgICAgICAgICAgICAgICAgICAgZW5kSW1wbGljaXRPYmplY3QgaSArIG9mZnNldFxuICAgICAgICAgICAgcmV0dXJuIGZvcndhcmQoMSlcbiAgICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICBcbiAgICAjIEFkZCBsb2NhdGlvbiBkYXRhIHRvIGFsbCB0b2tlbnMgZ2VuZXJhdGVkIGJ5IHRoZSByZXdyaXRlci5cbiAgICBcbiAgICBhZGRMb2NhdGlvbkRhdGFUb0dlbmVyYXRlZFRva2VuczogLT5cbiAgICAgICAgQHNjYW5Ub2tlbnMgKHRva2VuLCBpLCB0b2tlbnMpIC0+XG4gICAgICAgICAgICByZXR1cm4gMSBpZiB0b2tlblsyXVxuICAgICAgICAgICAgcmV0dXJuIDEgdW5sZXNzIHRva2VuLmdlbmVyYXRlZCBvciB0b2tlbi5leHBsaWNpdFxuICAgICAgICAgICAgaWYgdG9rZW5bMF0gaXMgJ3snIGFuZCBuZXh0TG9jYXRpb249dG9rZW5zW2kgKyAxXT9bMl1cbiAgICAgICAgICAgICAgICB7Zmlyc3RfbGluZTogbGluZSwgZmlyc3RfY29sdW1uOiBjb2x1bW59ID0gbmV4dExvY2F0aW9uXG4gICAgICAgICAgICBlbHNlIGlmIHByZXZMb2NhdGlvbiA9IHRva2Vuc1tpIC0gMV0/WzJdXG4gICAgICAgICAgICAgICAge2xhc3RfbGluZTogbGluZSwgbGFzdF9jb2x1bW46IGNvbHVtbn0gPSBwcmV2TG9jYXRpb25cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBsaW5lID0gY29sdW1uID0gMFxuICAgICAgICAgICAgdG9rZW5bMl0gPVxuICAgICAgICAgICAgICAgIGZpcnN0X2xpbmU6ICAgbGluZVxuICAgICAgICAgICAgICAgIGZpcnN0X2NvbHVtbjogY29sdW1uXG4gICAgICAgICAgICAgICAgbGFzdF9saW5lOiAgICBsaW5lXG4gICAgICAgICAgICAgICAgbGFzdF9jb2x1bW46ICBjb2x1bW5cbiAgICAgICAgICAgIHJldHVybiAxXG5cbiAgICAjIE9VVERFTlQgdG9rZW5zIHNob3VsZCBhbHdheXMgYmUgcG9zaXRpb25lZCBhdCB0aGUgbGFzdCBjaGFyYWN0ZXIgb2YgdGhlXG4gICAgIyBwcmV2aW91cyB0b2tlbiwgc28gdGhhdCBBU1Qgbm9kZXMgZW5kaW5nIGluIGFuIE9VVERFTlQgdG9rZW4gZW5kIHVwIHdpdGggYVxuICAgICMgbG9jYXRpb24gY29ycmVzcG9uZGluZyB0byB0aGUgbGFzdCBcInJlYWxcIiB0b2tlbiB1bmRlciB0aGUgbm9kZS5cbiAgICBmaXhPdXRkZW50TG9jYXRpb25EYXRhOiAtPlxuICAgICAgICBAc2NhblRva2VucyAodG9rZW4sIGksIHRva2VucykgLT5cbiAgICAgICAgICAgIHJldHVybiAxIHVubGVzcyB0b2tlblswXSBpcyAnT1VUREVOVCcgb3JcbiAgICAgICAgICAgICAgICAodG9rZW4uZ2VuZXJhdGVkIGFuZCB0b2tlblswXSBpcyAnQ0FMTF9FTkQnKSBvclxuICAgICAgICAgICAgICAgICh0b2tlbi5nZW5lcmF0ZWQgYW5kIHRva2VuWzBdIGlzICd9JylcbiAgICAgICAgICAgIHByZXZMb2NhdGlvbkRhdGEgPSB0b2tlbnNbaSAtIDFdWzJdXG4gICAgICAgICAgICB0b2tlblsyXSA9XG4gICAgICAgICAgICAgICAgZmlyc3RfbGluZTogICBwcmV2TG9jYXRpb25EYXRhLmxhc3RfbGluZVxuICAgICAgICAgICAgICAgIGZpcnN0X2NvbHVtbjogcHJldkxvY2F0aW9uRGF0YS5sYXN0X2NvbHVtblxuICAgICAgICAgICAgICAgIGxhc3RfbGluZTogICAgcHJldkxvY2F0aW9uRGF0YS5sYXN0X2xpbmVcbiAgICAgICAgICAgICAgICBsYXN0X2NvbHVtbjogIHByZXZMb2NhdGlvbkRhdGEubGFzdF9jb2x1bW5cbiAgICAgICAgICAgIHJldHVybiAxXG5cbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAgICAgMDAwICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICAjIEJlY2F1c2Ugb3VyIGdyYW1tYXIgaXMgTEFMUigxKSwgaXQgY2FuJ3QgaGFuZGxlIHNvbWUgc2luZ2xlLWxpbmVcbiAgICAjIGV4cHJlc3Npb25zIHRoYXQgbGFjayBlbmRpbmcgZGVsaW1pdGVycy4gVGhlICoqUmV3cml0ZXIqKiBhZGRzIHRoZSBpbXBsaWNpdFxuICAgICMgYmxvY2tzLCBzbyBpdCBkb2Vzbid0IG5lZWQgdG8uIFRvIGtlZXAgdGhlIGdyYW1tYXIgY2xlYW4gYW5kIHRpZHksIHRyYWlsaW5nXG4gICAgIyBuZXdsaW5lcyB3aXRoaW4gZXhwcmVzc2lvbnMgYXJlIHJlbW92ZWQgYW5kIHRoZSBpbmRlbnRhdGlvbiB0b2tlbnMgb2YgZW1wdHlcbiAgICAjIGJsb2NrcyBhcmUgYWRkZWQuXG4gICAgXG4gICAgbm9ybWFsaXplTGluZXM6IC0+XG4gICAgICAgIHN0YXJ0ZXIgPSBpbmRlbnQgPSBvdXRkZW50ID0gbnVsbFxuXG4gICAgICAgIGNvbmRpdGlvbiA9ICh0b2tlbiwgaSkgLT5cbiAgICAgICAgICAgIHRva2VuWzFdICE9ICc7JyBhbmQgdG9rZW5bMF0gaW4gU0lOR0xFX0NMT1NFUlMgYW5kXG4gICAgICAgICAgICBub3QgKHRva2VuWzBdIGlzICdURVJNSU5BVE9SJyBhbmQgQHRhZyhpICsgMSkgaW4gRVhQUkVTU0lPTl9DTE9TRSkgYW5kXG4gICAgICAgICAgICBub3QgKHRva2VuWzBdIGluIFsnRUxTRScsICdNRVRBX0VMU0UnXSBhbmQgc3RhcnRlciAhPSAnVEhFTicpIGFuZFxuICAgICAgICAgICAgbm90ICh0b2tlblswXSBpbiBbJ0NBVENIJyAnRklOQUxMWSddIGFuZCBzdGFydGVyIGluIFsnLT4nLCAnPT4nXSkgb3JcbiAgICAgICAgICAgIHRva2VuWzBdIGluIENBTExfQ0xPU0VSUyBhbmRcbiAgICAgICAgICAgIChAdG9rZW5zW2kgLSAxXS5uZXdMaW5lIG9yIEB0b2tlbnNbaSAtIDFdWzBdIGlzICdPVVRERU5UJylcblxuICAgICAgICBhY3Rpb24gPSAodG9rZW4sIGkpIC0+XG4gICAgICAgICAgICBAdG9rZW5zLnNwbGljZSAoaWYgQHRhZyhpIC0gMSkgaXMgJywnIHRoZW4gaSAtIDEgZWxzZSBpKSwgMCwgb3V0ZGVudFxuXG4gICAgICAgIEBzY2FuVG9rZW5zICh0b2tlbiwgaSwgdG9rZW5zKSAtPlxuICAgICAgICAgICAgW3RhZ10gPSB0b2tlblxuICAgICAgICAgICAgaWYgdGFnIGlzICdURVJNSU5BVE9SJ1xuICAgICAgICAgICAgICAgIGlmIEB0YWcoaSArIDEpIGluIFsnRUxTRScsICdNRVRBX0VMU0UnXSBhbmQgQHRhZyhpIC0gMSkgIT0gJ09VVERFTlQnXG4gICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSwgMSwgQGluZGVudGF0aW9uKCkuLi5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDFcbiAgICAgICAgICAgICAgICBpZiBAdGFnKGkgKyAxKSBpbiBFWFBSRVNTSU9OX0NMT1NFXG4gICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSwgMVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMFxuICAgICAgICAgICAgaWYgdGFnIGlzICdDQVRDSCdcbiAgICAgICAgICAgICAgICBmb3IgaiBpbiBbMS4uMl0gd2hlbiBAdGFnKGkgKyBqKSBpbiBbJ09VVERFTlQnICdURVJNSU5BVE9SJyAnRklOQUxMWSddXG4gICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSArIGosIDAsIEBpbmRlbnRhdGlvbigpLi4uXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAyICsgalxuICAgICAgICAgICAgaWYgdGFnIGluIFNJTkdMRV9MSU5FUlMgYW5kIEB0YWcoaSArIDEpICE9ICdJTkRFTlQnIGFuZCBub3QgKHRhZyBpcyAnRUxTRScgYW5kIEB0YWcoaSArIDEpIGlzICdJRicpIGFuZCBub3QgKHRhZyBpcyAnTUVUQV9FTFNFJyBhbmQgQHRhZyhpICsgMSkgaXMgJ01FVEFfSUYnKVxuICAgICAgICAgICAgICAgIHN0YXJ0ZXIgPSB0YWdcbiAgICAgICAgICAgICAgICBbaW5kZW50LCBvdXRkZW50XSA9IEBpbmRlbnRhdGlvbiB0b2tlbnNbaV1cbiAgICAgICAgICAgICAgICBpbmRlbnQuZnJvbVRoZW4gICA9IHRydWUgaWYgc3RhcnRlciBpcyAnVEhFTidcbiAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGkgKyAxLCAwLCBpbmRlbnRcbiAgICAgICAgICAgICAgICBAZGV0ZWN0RW5kIGkgKyAyLCBjb25kaXRpb24sIGFjdGlvblxuICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSwgMSBpZiB0YWcgaXMgJ1RIRU4nXG4gICAgICAgICAgICAgICAgcmV0dXJuIDFcbiAgICAgICAgICAgIHJldHVybiAxXG5cbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwICAgIDAwMCAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwIDAwMCAgIFxuICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgIyBUYWcgcG9zdGZpeCBjb25kaXRpb25hbHMgYXMgc3VjaCwgc28gdGhhdCB3ZSBjYW4gcGFyc2UgdGhlbSB3aXRoIGFcbiAgICAjIGRpZmZlcmVudCBwcmVjZWRlbmNlLlxuICAgIFxuICAgIHRhZ1Bvc3RmaXhDb25kaXRpb25hbHM6IC0+XG5cbiAgICAgICAgb3JpZ2luYWwgPSBudWxsXG5cbiAgICAgICAgY29uZGl0aW9uID0gKHRva2VuLCBpKSAtPlxuICAgICAgICAgICAgW3RhZ10gPSB0b2tlblxuICAgICAgICAgICAgW3ByZXZUYWddID0gQHRva2Vuc1tpIC0gMV1cbiAgICAgICAgICAgIHRhZyBpcyAnVEVSTUlOQVRPUicgb3IgKHRhZyBpcyAnSU5ERU5UJyBhbmQgcHJldlRhZyBub3QgaW4gU0lOR0xFX0xJTkVSUylcblxuICAgICAgICBhY3Rpb24gPSAodG9rZW4sIGkpIC0+XG4gICAgICAgICAgICBpZiB0b2tlblswXSBub3QgaW4gWydJTkRFTlQnXSBvciAodG9rZW4uZ2VuZXJhdGVkIGFuZCBub3QgdG9rZW4uZnJvbVRoZW4pXG4gICAgICAgICAgICAgICAgb3JpZ2luYWxbMF0gPSAnUE9TVF8nICsgb3JpZ2luYWxbMF1cblxuICAgICAgICBAc2NhblRva2VucyAodG9rZW4sIGkpIC0+XG4gICAgICAgICAgICByZXR1cm4gMSB1bmxlc3MgdG9rZW5bMF0gaW4gWydJRicsICdNRVRBX0lGJ11cbiAgICAgICAgICAgIG9yaWdpbmFsID0gdG9rZW5cbiAgICAgICAgICAgIEBkZXRlY3RFbmQgaSArIDEsIGNvbmRpdGlvbiwgYWN0aW9uXG4gICAgICAgICAgICByZXR1cm4gMVxuXG4gICAgIyBHZW5lcmF0ZSB0aGUgaW5kZW50YXRpb24gdG9rZW5zLCBiYXNlZCBvbiBhbm90aGVyIHRva2VuIG9uIHRoZSBzYW1lIGxpbmUuXG4gICAgXG4gICAgaW5kZW50YXRpb246IChvcmlnaW4pIC0+XG4gICAgICAgIFxuICAgICAgICBpbmRlbnQgID0gWydJTkRFTlQnLCA0XVxuICAgICAgICBvdXRkZW50ID0gWydPVVRERU5UJywgNF1cbiAgICAgICAgaWYgb3JpZ2luXG4gICAgICAgICAgICBpbmRlbnQuZ2VuZXJhdGVkID0gb3V0ZGVudC5nZW5lcmF0ZWQgPSB5ZXNcbiAgICAgICAgICAgIGluZGVudC5vcmlnaW4gPSBvdXRkZW50Lm9yaWdpbiA9IG9yaWdpblxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpbmRlbnQuZXhwbGljaXQgPSBvdXRkZW50LmV4cGxpY2l0ID0geWVzXG4gICAgICAgIFtpbmRlbnQsIG91dGRlbnRdXG5cbiAgICAjIENyZWF0ZSBhIGdlbmVyYXRlZCB0b2tlbjogb25lIHRoYXQgZXhpc3RzIGR1ZSB0byBhIHVzZSBvZiBpbXBsaWNpdCBzeW50YXguXG4gICAgXG4gICAgQGdlbmVyYXRlOiAodGFnLCB2YWx1ZSwgb3JpZ2luKSAtPlxuICAgICAgICB0b2sgPSBbdGFnLCB2YWx1ZV1cbiAgICAgICAgdG9rLmdlbmVyYXRlZCA9IHllc1xuICAgICAgICB0b2sub3JpZ2luID0gb3JpZ2luIGlmIG9yaWdpblxuICAgICAgICB0b2tcbiAgICAgICAgXG4gICAgZ2VuZXJhdGU6IFJld3JpdGVyLmdlbmVyYXRlXG5cbiAgICB0YWc6IChpKSAtPiBAdG9rZW5zW2ldP1swXSAjIExvb2sgdXAgYSB0YWcgYnkgdG9rZW4gaW5kZXguXG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuXG4jIExpc3Qgb2YgdGhlIHRva2VuIHBhaXJzIHRoYXQgbXVzdCBiZSBiYWxhbmNlZC5cblxuQkFMQU5DRURfUEFJUlMgPSBbXG4gICAgWycoJycpJ11cbiAgICBbJ1snJ10nXVxuICAgIFsneycnfSddXG4gICAgWydJTkRFTlQnJ09VVERFTlQnXSxcbiAgICBbJ0NBTExfU1RBUlQnJ0NBTExfRU5EJ11cbiAgICBbJ1BBUkFNX1NUQVJUJydQQVJBTV9FTkQnXVxuICAgIFsnSU5ERVhfU1RBUlQnJ0lOREVYX0VORCddXG4gICAgWydTVFJJTkdfU1RBUlQnJ1NUUklOR19FTkQnXVxuICAgIFsnUkVHRVhfU1RBUlQnJ1JFR0VYX0VORCddXG5dXG5cbiMgVGhlIGludmVyc2UgbWFwcGluZ3Mgb2YgYEJBTEFOQ0VEX1BBSVJTYCB3ZSdyZSB0cnlpbmcgdG8gZml4IHVwLCBzbyB3ZSBjYW4gbG9vayB0aGluZ3MgdXAgZnJvbSBlaXRoZXIgZW5kLlxuXG5tb2R1bGUuZXhwb3J0cyA9IFJld3JpdGVyXG5cbiMgVGhlIHRva2VucyB0aGF0IHNpZ25hbCB0aGUgc3RhcnQvZW5kIG9mIGEgYmFsYW5jZWQgcGFpci5cbkVYUFJFU1NJT05fU1RBUlQgPSBbXVxuRVhQUkVTU0lPTl9FTkQgICA9IFtdXG5cbklOVkVSU0VTID0ge31cbmZvciBbbGVmdCwgcml0ZV0gaW4gQkFMQU5DRURfUEFJUlNcbiAgICBFWFBSRVNTSU9OX1NUQVJULnB1c2ggSU5WRVJTRVNbcml0ZV0gPSBsZWZ0XG4gICAgRVhQUkVTU0lPTl9FTkQgIC5wdXNoIElOVkVSU0VTW2xlZnRdID0gcml0ZVxuXG5SZXdyaXRlci5JTlZFUlNFUyA9IElOVkVSU0VTXG4gICAgXG4jIFRva2VucyB0aGF0IGluZGljYXRlIHRoZSBjbG9zZSBvZiBhIGNsYXVzZSBvZiBhbiBleHByZXNzaW9uLlxuRVhQUkVTU0lPTl9DTE9TRSA9IFsnQ0FUQ0gnICdUSEVOJyAnRUxTRScgJ01FVEFfRUxTRScgJ0ZJTkFMTFknXS5jb25jYXQgRVhQUkVTU0lPTl9FTkRcblxuIyBUb2tlbnMgdGhhdCwgaWYgZm9sbG93ZWQgYnkgYW4gYElNUExJQ0lUX0NBTExgLCBpbmRpY2F0ZSBhIGZ1bmN0aW9uIGludm9jYXRpb24uXG5JTVBMSUNJVF9GVU5DID0gWydJREVOVElGSUVSJyAnUFJPUEVSVFknICdTVVBFUicgJyknICdDQUxMX0VORCcgJ10nICdJTkRFWF9FTkQnICdAJyAnVEhJUyddXG5cbiMgSWYgcHJlY2VkZWQgYnkgYW4gYElNUExJQ0lUX0ZVTkNgLCBpbmRpY2F0ZXMgYSBmdW5jdGlvbiBpbnZvY2F0aW9uLlxuSU1QTElDSVRfQ0FMTCA9IFtcbiAgICAnSURFTlRJRklFUicgJ1BST1BFUlRZJyAnTlVNQkVSJyAnSU5GSU5JVFknICdOQU4nXG4gICAgJ1NUUklORycgJ1NUUklOR19TVEFSVCcgJ1JFR0VYJyAnUkVHRVhfU1RBUlQnICdKUydcbiAgICAnTkVXJyAnUEFSQU1fU1RBUlQnICdDTEFTUycgJ0lGJyAnTUVUQV9JRicsICdUUlknICdTV0lUQ0gnICdUSElTJ1xuICAgICdVTkRFRklORUQnICdOVUxMJyAnQk9PTCdcbiAgICAnVU5BUlknICdZSUVMRCcgJ1VOQVJZX01BVEgnICdTVVBFUicgJ1RIUk9XJ1xuICAgICdAJyAnLT4nICc9PicgJ1snICcoJyAneycgJy0tJyAnKysnXG5dXG5cbklNUExJQ0lUX1VOU1BBQ0VEX0NBTEwgPSBbJysnICctJ11cblxuIyBUb2tlbnMgdGhhdCBhbHdheXMgbWFyayB0aGUgZW5kIG9mIGFuIGltcGxpY2l0IGNhbGwgZm9yIHNpbmdsZS1saW5lcnMuXG5JTVBMSUNJVF9FTkQgPSBbJ1BPU1RfSUYnICdQT1NUX01FVEFfSUYnICdGT1InICdXSElMRScgJ1VOVElMJyAnV0hFTicgJ0JZJyAnTE9PUCcgJ1RFUk1JTkFUT1InXVxuXG4jIFNpbmdsZS1saW5lIGZsYXZvcnMgb2YgYmxvY2sgZXhwcmVzc2lvbnMgdGhhdCBoYXZlIHVuY2xvc2VkIGVuZGluZ3MuXG4jIFRoZSBncmFtbWFyIGNhbid0IGRpc2FtYmlndWF0ZSB0aGVtLCBzbyB3ZSBpbnNlcnQgdGhlIGltcGxpY2l0IGluZGVudGF0aW9uLlxuU0lOR0xFX0xJTkVSUyAgPSBbJ0VMU0UnICdNRVRBX0VMU0UnICctPicgJz0+JyAnVFJZJyAnRklOQUxMWScgJ1RIRU4nXVxuU0lOR0xFX0NMT1NFUlMgPSBbJ1RFUk1JTkFUT1InICdDQVRDSCcgJ0ZJTkFMTFknICdFTFNFJyAnTUVUQV9FTFNFJyAnT1VUREVOVCcgJ0xFQURJTkdfV0hFTiddXG5cbiMgVG9rZW5zIHRoYXQgZW5kIGEgbGluZS5cbkxJTkVCUkVBS1MgPSBbJ1RFUk1JTkFUT1InICdJTkRFTlQnICdPVVRERU5UJ11cblxuIyBUb2tlbnMgdGhhdCBjbG9zZSBvcGVuIGNhbGxzIHdoZW4gdGhleSBmb2xsb3cgYSBuZXdsaW5lLlxuQ0FMTF9DTE9TRVJTID0gWycuJyAnPy4nICc6OicgJz86OiddXG4iXX0=
//# sourceURL=../coffee/rewriter.coffee