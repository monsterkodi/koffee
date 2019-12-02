// koffee 1.5.0

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

hasFeature = require('./features').hasFeature;

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

    Rewriter.prototype.findMatchingTagForwards = function(open, i, check) {
        var close, current, j, pushed;
        close = {
            STRING_START: 'STRING_END'
        }[open];
        if (!close) {
            console.warn("cant match " + open);
        }
        pushed = 0;
        j = i;
        while (++j < this.tokens.length) {
            current = this.tag(j);
            if (current === open) {
                pushed++;
            } else if (current === close) {
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
            var a, adv, arg, k, match, meta, ref, ref1, ref10, ref11, ref12, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9;
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
                if (this.check(i, ['NUMBER', 'STRING', 'NULL', 'UNDEFINED', 'BOOL', 'STRING_END', '}'], i + 1, ['NUMBER', 'STRING', 'NULL', 'UNDEFINED', 'BOOL', 'STRING_START', 'PARAM_START', 'IDENTIFIER', 'PROPERTY', '{', '(', '[', '->', '=>', '@', 'UNARY'])) {
                    tokens.splice(i + 1, 0, this.generate(',', ','));
                    return 2;
                }
                if (this.check(i, ['NUMBER', 'STRING', 'NULL', 'UNDEFINED', 'BOOL', 'STRING_END', '}'], i + 1, ['-', '+'], i + 2, ['NUMBER', 'IDENTIFIER'])) {
                    if ((tokens[i][2].last_column + 1 < (ref = tokens[i + 1][2].last_column) && ref === tokens[i + 2][2].first_column - 1)) {
                        tokens.splice(i + 1, 0, this.generate(',', ','));
                        return 2;
                    }
                }
                if (((ref1 = this.tag(i)) === ']') && tokens[i].spaced && ((ref2 = this.tag(i + 1)) === 'NUMBER' || ref2 === 'STRING' || ref2 === 'STRING_START' || ref2 === 'IDENTIFIER' || ref2 === 'PROPERTY' || ref2 === '{' || ref2 === '(' || ref2 === '[')) {
                    match = this.findMatchingTagBackwards(this.tag(i), i, function(tag) {
                        return tag === 'NUMBER' || tag === 'STRING' || tag === 'PROPERTY' || tag === ':' || tag === ',' || tag === '-' || tag === '+';
                    });
                    if (match.index >= 0) {
                        if (match.index === 0 || ((ref3 = this.tag(match.index - 1)) !== 'IDENTIFIER' && ref3 !== 'CALL_END')) {
                            tokens.splice(i + 1, 0, this.generate(',', ','));
                            return 2;
                        }
                    }
                }
            }
            if (hasFeature(this.opts, 'meta')) {
                if (this.check(i, [
                    {
                        UNARY_MATH: '~'
                    }
                ], i + 1, [
                    {
                        COMPARE: '>'
                    }
                ], i + 2, ['IDENTIFIER', 'IF', 'THEN', 'ELSE'])) {
                    if (this.tag(i + 2) === 'IDENTIFIER') {
                        if (tokens[i + 2][1] === 'elif') {
                            tokens.splice(i, 3, this.generate('META_ELSE', 'else'), this.generate('META_IF', 'if'));
                            tokens[i].spaced = true;
                            tokens[i + 1].spaced = true;
                            return 0;
                        } else {
                            tokens[i + 2][1] = '▸' + tokens[i + 2][1];
                            tokens[i + 2][0] = 'IDENTIFIER';
                            tokens.splice(i, 2);
                            return 0;
                        }
                    } else {
                        if (tokens[i + 2][0] !== 'THEN') {
                            tokens[i + 2][0] = 'META_' + tokens[i + 2][0];
                        }
                        tokens.splice(i, 2);
                        return 0;
                    }
                }
                if (token[1][0] === '▸') {
                    if ((ref4 = this.tag(i - 1)) !== 'META_IF') {
                        if (ref5 = token[1], indexOf.call(Object.keys(this.opts.meta), ref5) >= 0) {
                            meta = this.opts.meta[token[1]];
                            tokens.splice(i, 0, this.generate('META_IF', 'if'));
                            tokens[i].spaced = true;
                            adv = 2;
                            if (this.tag(i + adv) === 'CALL_START') {
                                while ((ref6 = this.tag(i + adv++)) !== 'CALL_END' && ref6 !== ')' && ref6 !== 'TERMINATOR') {
                                    true;
                                }
                            } else {
                                arg = 0;
                                for (a = k = 0, ref7 = (ref8 = (ref9 = meta.info) != null ? ref9.args : void 0) != null ? ref8 : 1; 0 <= ref7 ? k < ref7 : k > ref7; a = 0 <= ref7 ? ++k : --k) {
                                    if ((ref10 = this.tag(i + adv)) === 'NUMBER' || ref10 === 'STRING') {
                                        arg++;
                                        adv++;
                                    } else if (this.tag(i + adv) === 'STRING_START') {
                                        match = this.findMatchingTagForwards(this.tag(i + adv), i + adv);
                                        if (match.index >= 0) {
                                            arg++;
                                            adv += match.index - i - 1;
                                        } else {
                                            console.log('match index', match, this.tag(i + adv));
                                        }
                                    } else {
                                        break;
                                    }
                                }
                                if (arg === 0) {
                                    tokens.splice(i + adv, 0, this.generate('CALL_START', '('), this.generate('CALL_END', ')'));
                                    adv += 2;
                                }
                            }
                            if (((ref11 = meta.info) != null ? ref11.then : void 0) || ((ref12 = this.tag(i + adv)) !== 'TERMINATOR' && ref12 !== 'INDENT' && ref12 !== 'CALL_START')) {
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

module.exports = Rewriter;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmV3cml0ZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHdQQUFBO0lBQUE7OztBQVFFLGFBQWUsT0FBQSxDQUFRLFlBQVI7O0FBU1g7Ozt1QkFPRixPQUFBLEdBQVMsU0FBQyxPQUFELEVBQVUsSUFBVjtRQUFDLElBQUMsQ0FBQSxTQUFEO1FBQVMsSUFBQyxDQUFBLE9BQUQ7UUFFZixJQUFDLENBQUEscUJBQUQsQ0FBQTtRQUVBLElBQUMsQ0FBQSxTQUFELENBQUE7UUFFQSxJQUFDLENBQUEsY0FBRCxDQUFBO1FBQ0EsSUFBQyxDQUFBLGdCQUFELENBQUE7UUFDQSxJQUFDLENBQUEsY0FBRCxDQUFBO1FBQ0EsSUFBQyxDQUFBLHNCQUFELENBQUE7UUFDQSxJQUFDLENBQUEsMEJBQUQsQ0FBQTtRQUVBLElBQXVCLFVBQUEsQ0FBVyxJQUFDLENBQUEsSUFBWixFQUFrQixtQkFBbEIsQ0FBdkI7WUFBQSxJQUFDLENBQUEsZ0JBQUQsQ0FBQSxFQUFBOztRQUNBLElBQXVCLFVBQUEsQ0FBVyxJQUFDLENBQUEsSUFBWixFQUFrQixnQkFBbEIsQ0FBdkI7WUFBQSxJQUFDLENBQUEsYUFBRCxDQUFBLEVBQUE7O1FBRUEsSUFBQyxDQUFBLGdDQUFELENBQUE7UUFDQSxJQUFDLENBQUEsc0JBQUQsQ0FBQTtlQUNBLElBQUMsQ0FBQTtJQWpCSTs7dUJBd0JULFVBQUEsR0FBWSxTQUFDLEtBQUQ7QUFFUixZQUFBO1FBQUMsU0FBVTtRQUNYLENBQUEsR0FBSTtBQUNtQyxlQUFNLEtBQUEsR0FBUSxNQUFPLENBQUEsQ0FBQSxDQUFyQjtZQUF2QyxDQUFBLElBQUssS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFYLEVBQWlCLEtBQWpCLEVBQXdCLENBQXhCLEVBQTJCLE1BQTNCO1FBQWtDO2VBQ3ZDO0lBTFE7O3VCQU9aLFNBQUEsR0FBVyxTQUFDLENBQUQsRUFBSSxTQUFKLEVBQWUs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LEVBQVUsSUFBVixFQUFlLEtBQWY7O0FBRWYsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4wMDAgICAwMDAgIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbjAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4wMDAgICAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuIyMjXG5cbnsgaGFzRmVhdHVyZSB9ID0gcmVxdWlyZSAnLi9mZWF0dXJlcydcblxuIyBUaGUgbGFuZ3VhZ2UgaGFzIGEgZ29vZCBkZWFsIG9mIG9wdGlvbmFsLCBpbXBsaWNpdCBhbmQgc2hvcnRoYW5kIHN5bnRheC4gXG4jIFRoaXMgY2FuIGdyZWF0bHkgY29tcGxpY2F0ZSBhIGdyYW1tYXIgYW5kIGJsb2F0IHRoZSByZXN1bHRpbmcgcGFyc2UgdGFibGUuIFxuIyBJbnN0ZWFkIG9mIG1ha2luZyB0aGUgcGFyc2VyIGhhbmRsZSBpdCBhbGwsIHdlIHRha2UgYSBzZXJpZXMgb2YgcGFzc2VzIG92ZXIgdGhlIHRva2VuIHN0cmVhbSwgXG4jIHVzaW5nIHRoaXMgUmV3cml0ZXIgdG8gY29udmVydCBzaG9ydGhhbmQgaW50byB0aGUgdW5hbWJpZ3VvdXMgbG9uZyBmb3JtLCBcbiMgYWRkIGltcGxpY2l0IGluZGVudGF0aW9uIGFuZCBwYXJlbnRoZXNlcywgYW5kIGdlbmVyYWxseSBjbGVhbiB0aGluZ3MgdXAuXG4jIFRoZSBSZXdyaXRlciBpcyB1c2VkIGJ5IHRoZSBMZXhlciwgZGlyZWN0bHkgYWdhaW5zdCBpdHMgaW50ZXJuYWwgYXJyYXkgb2YgdG9rZW5zLlxuXG5jbGFzcyBSZXdyaXRlclxuXG4gICAgIyBSZXdyaXRlIHRoZSB0b2tlbiBzdHJlYW0gaW4gbXVsdGlwbGUgcGFzc2VzLCBvbmUgbG9naWNhbCBmaWx0ZXIgYXQgYSB0aW1lLiBcbiAgICAjIFRoaXMgY291bGQgY2VydGFpbmx5IGJlIGNoYW5nZWQgaW50byBhIHNpbmdsZSBwYXNzIHRocm91Z2ggdGhlIHN0cmVhbSwgd2l0aCBhIGJpZyBzd2l0Y2gsIFxuICAgICMgYnV0IGl0J3MgbXVjaCBuaWNlciB0byB3b3JrIHdpdGggbGlrZSB0aGlzLiBcbiAgICAjIFRoZSBvcmRlciBvZiB0aGVzZSBwYXNzZXMgbWF0dGVycyAtLSBpbmRlbnRhdGlvbiBtdXN0IGJlIGNvcnJlY3RlZCBiZWZvcmUgaW1wbGljaXQgcGFyZW50aGVzZXMgY2FuIGJlIHdyYXBwZWQgYXJvdW5kIGJsb2NrcyBvZiBjb2RlLlxuICAgIFxuICAgIHJld3JpdGU6IChAdG9rZW5zLCBAb3B0cykgLT5cbiAgICAgICAgXG4gICAgICAgIEByZW1vdmVMZWFkaW5nTmV3bGluZXMoKVxuICAgICAgICBcbiAgICAgICAgQHNob3J0Y3V0cygpICMga29mZmVlXG4gICAgICAgIFxuICAgICAgICBAY2xvc2VPcGVuQ2FsbHMoKVxuICAgICAgICBAY2xvc2VPcGVuSW5kZXhlcygpXG4gICAgICAgIEBub3JtYWxpemVMaW5lcygpXG4gICAgICAgIEB0YWdQb3N0Zml4Q29uZGl0aW9uYWxzKClcbiAgICAgICAgQGFkZEltcGxpY2l0QnJhY2VzQW5kUGFyZW5zKClcbiAgICAgICAgXG4gICAgICAgIEBjb25maWdQYXJhbWV0ZXJzKCkgaWYgaGFzRmVhdHVyZSBAb3B0cywgJ2NvbmZpZ19wYXJhbWV0ZXJzJyAjIGtvZmZlZVxuICAgICAgICBAbmVnYXRpdmVJbmRleCgpICAgIGlmIGhhc0ZlYXR1cmUgQG9wdHMsICduZWdhdGl2ZV9pbmRleCcgICAgIyBrb2ZmZWVcbiAgICAgICAgXG4gICAgICAgIEBhZGRMb2NhdGlvbkRhdGFUb0dlbmVyYXRlZFRva2VucygpXG4gICAgICAgIEBmaXhPdXRkZW50TG9jYXRpb25EYXRhKCkgICBcbiAgICAgICAgQHRva2Vuc1xuXG4gICAgIyBSZXdyaXRlIHRoZSB0b2tlbiBzdHJlYW0sIGxvb2tpbmcgb25lIHRva2VuIGFoZWFkIGFuZCBiZWhpbmQuXG4gICAgIyBBbGxvdyB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBibG9jayB0byB0ZWxsIHVzIGhvdyBtYW55IHRva2VucyB0byBtb3ZlXG4gICAgIyBmb3J3YXJkcyAob3IgYmFja3dhcmRzKSBpbiB0aGUgc3RyZWFtLCB0byBtYWtlIHN1cmUgd2UgZG9uJ3QgbWlzcyBhbnl0aGluZ1xuICAgICMgYXMgdG9rZW5zIGFyZSBpbnNlcnRlZCBhbmQgcmVtb3ZlZCwgYW5kIHRoZSBzdHJlYW0gY2hhbmdlcyBsZW5ndGggdW5kZXIgb3VyIGZlZXQuXG4gICAgXG4gICAgc2NhblRva2VuczogKGJsb2NrKSAtPlxuICAgICAgICBcbiAgICAgICAge3Rva2Vuc30gPSB0aGlzXG4gICAgICAgIGkgPSAwXG4gICAgICAgIGkgKz0gYmxvY2suY2FsbCB0aGlzLCB0b2tlbiwgaSwgdG9rZW5zIHdoaWxlIHRva2VuID0gdG9rZW5zW2ldXG4gICAgICAgIHRydWVcblxuICAgIGRldGVjdEVuZDogKGksIGNvbmRpdGlvbiwgYWN0aW9uKSAtPlxuICAgICAgICBcbiAgICAgICAge3Rva2Vuc30gPSB0aGlzXG4gICAgICAgIGxldmVscyA9IDBcbiAgICAgICAgd2hpbGUgdG9rZW4gPSB0b2tlbnNbaV1cbiAgICAgICAgICAgIHJldHVybiBhY3Rpb24uY2FsbCB0aGlzLCB0b2tlbiwgaSBpZiBsZXZlbHMgaXMgMCBhbmQgY29uZGl0aW9uLmNhbGwgdGhpcywgdG9rZW4sIGlcbiAgICAgICAgICAgIHJldHVybiBhY3Rpb24uY2FsbCB0aGlzLCB0b2tlbiwgaSAtIDEgaWYgbm90IHRva2VuIG9yIGxldmVscyA8IDBcbiAgICAgICAgICAgIGlmIHRva2VuWzBdIGluIEVYUFJFU1NJT05fU1RBUlRcbiAgICAgICAgICAgICAgICBsZXZlbHMgKz0gMVxuICAgICAgICAgICAgZWxzZSBpZiB0b2tlblswXSBpbiBFWFBSRVNTSU9OX0VORFxuICAgICAgICAgICAgICAgIGxldmVscyAtPSAxXG4gICAgICAgICAgICBpICs9IDFcbiAgICAgICAgaSAtIDFcblxuICAgICMgTGVhZGluZyBuZXdsaW5lcyB3b3VsZCBpbnRyb2R1Y2UgYW4gYW1iaWd1aXR5IGluIHRoZSBncmFtbWFyLCBzbyB3ZSBkaXNwYXRjaCB0aGVtIGhlcmUuXG4gICAgXG4gICAgcmVtb3ZlTGVhZGluZ05ld2xpbmVzOiAtPlxuICAgICAgICBcbiAgICAgICAgYnJlYWsgZm9yIFt0YWddLCBpIGluIEB0b2tlbnMgd2hlbiB0YWcgIT0gJ1RFUk1JTkFUT1InXG4gICAgICAgIEB0b2tlbnMuc3BsaWNlIDAsIGkgaWYgaVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICBcblxuICAgIGRvZXNNYXRjaDogKGluZGV4LCBtYXRjaCkgLT5cblxuICAgICAgICBpZiB0eXBlb2YobWF0Y2gpID09ICdzdHJpbmcnXG4gICAgICAgICAgICBAdGFnKGluZGV4KSA9PSBtYXRjaFxuICAgICAgICBlbHNlIGlmIG1hdGNoLmNvbnN0cnVjdG9yID09IE9iamVjdFxuICAgICAgICAgICAgdCA9IEB0b2tlbnNbaW5kZXhdXG4gICAgICAgICAgICBrZXkgPSBPYmplY3Qua2V5cyhtYXRjaClbMF1cbiAgICAgICAgICAgIHZhbCA9IG1hdGNoW2tleV1cbiAgICAgICAgICAgIHRbMF0gPT0ga2V5IGFuZCB0WzFdID09IHZhbFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBmYWxzZVxuICAgIFxuICAgIGNoZWNrOiAtPiBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgbCA9IGFyZ3VtZW50c1xuICAgICAgICBmb3IgaiBpbiBbMC4uLmwubGVuZ3RoXSBieSAyXG4gICAgICAgICAgICBpbmRleCA9IGxbal1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZSBpZiBpbmRleCA8IDBcbiAgICAgICAgICAgIGlmIGxbaisxXSBpbnN0YW5jZW9mIEFycmF5XG4gICAgICAgICAgICAgICAgZm91bmQgPSBmYWxzZVxuICAgICAgICAgICAgICAgIGZvciBlIGluIGxbaisxXVxuICAgICAgICAgICAgICAgICAgICBpZiBAZG9lc01hdGNoIGluZGV4LCBlXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgaWYgbm90IGZvdW5kXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGlmIG5vdCBAZG9lc01hdGNoIGluZGV4LCBsW2orMV1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIHRydWVcbiAgICAgICAgXG4gICAgZmluZE1hdGNoaW5nVGFnQmFja3dhcmRzOiAoY2xvc2UsIGksIGNoZWNrKSAtPiBcbiAgICAgICAgXG4gICAgICAgIG9wZW4gPSB7IFBBUkFNX0VORDonUEFSQU1fU1RBUlQnLCAnXSc6J1snLCAnfSc6J3snIH1bY2xvc2VdXG4gICAgICAgIHdhcm4gXCJjYW50IG1hdGNoICN7Y2xvc2V9XCIgaWYgbm90IG9wZW5cbiAgICAgICAgcHVzaGVkID0gMFxuICAgICAgICBqID0gaVxuICAgICAgICB3aGlsZSBqLS0gIyB3YWxrIGJhY2t3YXJkcyB1bnRpbCBtYXRjaGluZyB0YWcgaXMgZm91bmRcbiAgICAgICAgICAgIGN1cnJlbnQgPSBAdGFnKGopXG4gICAgICAgICAgICBpZiBjdXJyZW50ID09IGNsb3NlXG4gICAgICAgICAgICAgICAgcHVzaGVkKytcbiAgICAgICAgICAgIGVsc2UgaWYgY3VycmVudCA9PSBvcGVuXG4gICAgICAgICAgICAgICAgaWYgcHVzaGVkXG4gICAgICAgICAgICAgICAgICAgIHB1c2hlZC0tXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBwdXNoZWQgPT0gMCAjIG1hdGNoaW5nIGJyYWNrZXQgZm91bmRcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGluZGV4OmpcbiAgICAgICAgICAgIGVsc2UgaWYgY2hlY2s/IGFuZCBub3QgY2hlY2sgY3VycmVudCBcbiAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgIGluZGV4Oi0xXG5cbiAgICBmaW5kTWF0Y2hpbmdUYWdGb3J3YXJkczogKG9wZW4sIGksIGNoZWNrKSAtPiBcbiAgICAgICAgXG4gICAgICAgIGNsb3NlID0geyBTVFJJTkdfU1RBUlQ6J1NUUklOR19FTkQnIH1bb3Blbl1cbiAgICAgICAgd2FybiBcImNhbnQgbWF0Y2ggI3tvcGVufVwiIGlmIG5vdCBjbG9zZVxuICAgICAgICBwdXNoZWQgPSAwXG4gICAgICAgIGogPSBpXG4gICAgICAgIHdoaWxlICsraiA8IEB0b2tlbnMubGVuZ3RoICMgd2FsayBmb3J3YXJkIHVudGlsIG1hdGNoaW5nIHRhZyBpcyBmb3VuZFxuICAgICAgICAgICAgY3VycmVudCA9IEB0YWcoailcbiAgICAgICAgICAgICMgbG9nIFwiY3VycmVudCAje2p9ICN7Y3VycmVudH1cIlxuICAgICAgICAgICAgaWYgY3VycmVudCA9PSBvcGVuXG4gICAgICAgICAgICAgICAgcHVzaGVkKytcbiAgICAgICAgICAgIGVsc2UgaWYgY3VycmVudCA9PSBjbG9zZVxuICAgICAgICAgICAgICAgIGlmIHB1c2hlZFxuICAgICAgICAgICAgICAgICAgICBwdXNoZWQtLVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgcHVzaGVkID09IDAgIyBtYXRjaGluZyBicmFja2V0IGZvdW5kXG4gICAgICAgICAgICAgICAgICAgICMgbG9nICdGT1VORCdcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGluZGV4OmpcbiAgICAgICAgICAgIGVsc2UgaWYgY2hlY2s/IGFuZCBub3QgY2hlY2sgY3VycmVudCBcbiAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgIGluZGV4Oi0xXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBzaG9ydGN1dHM6IC0+XG4gICAgICAgIFxuICAgICAgICBAc2NhblRva2VucyAodG9rZW4sIGksIHRva2VucykgLT5cblxuICAgICAgICAgICAgaWYgaGFzRmVhdHVyZSBAb3B0cywgJ2NvbnN0cnVjdG9yX3Nob3J0Y3V0J1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIEBjaGVjayBpLTEgJ0AnLCBpLCAnOicsIGkrMSBbJy0+JyAnUEFSQU1fU1RBUlQnICdJREVOVElGSUVSJ11cbiAgICAgICAgICAgICAgICAgICAgdG9rZW5zW2ktMV1bMF0gPSAnUFJPUEVSVFknXG4gICAgICAgICAgICAgICAgICAgIHRva2Vuc1tpLTFdWzFdID0gJ2NvbnN0cnVjdG9yJ1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMVxuICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgaGFzRmVhdHVyZSBAb3B0cywgJ2NvbnNvbGVfc2hvcnRjdXQnXG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBAY2hlY2sgaSwgW3tJREVOVElGSUVSOidsb2cnfSB7SURFTlRJRklFUjond2Fybid9IHtJREVOVElGSUVSOidlcnJvcid9XSwgaSsxIFsnTlVNQkVSJyAnSURFTlRJRklFUicgJ1BST1BFUlRZJyAnU1RSSU5HJyAnU1RSSU5HX1NUQVJUJyAnQ0FMTF9TVEFSVCcgJ0lGJyAnTUVUQV9JRicgJ1snICcoJyAneycgJ0AnXVxuICAgICAgICAgICAgICAgICAgICB0b2tlblswXSA9ICdQUk9QRVJUWSdcbiAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpLCAwIEBnZW5lcmF0ZSgnSURFTlRJRklFUicnY29uc29sZScgdG9rZW4pLCBAZ2VuZXJhdGUoJy4nJy4nIHRva2VuKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gM1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGhhc0ZlYXR1cmUgQG9wdHMsICdvcHRpb25hbF9jb21tYXRhJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIEBjaGVjayBpLCBbJ05VTUJFUicnU1RSSU5HJydOVUxMJydVTkRFRklORUQnJ0JPT0wnJ1NUUklOR19FTkQnJ30nXSwgaSsxIFsnTlVNQkVSJydTVFJJTkcnJ05VTEwnJ1VOREVGSU5FRCcnQk9PTCcnU1RSSU5HX1NUQVJUJydQQVJBTV9TVEFSVCcnSURFTlRJRklFUicnUFJPUEVSVFknJ3snJygnJ1snJy0+Jyc9PicnQCcnVU5BUlknXVxuICAgICAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGkrMSAwIEBnZW5lcmF0ZSAnLCcnLCdcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDJcblxuICAgICAgICAgICAgICAgIGlmIEBjaGVjayBpLCBbJ05VTUJFUicnU1RSSU5HJydOVUxMJydVTkRFRklORUQnJ0JPT0wnJ1NUUklOR19FTkQnJ30nXSwgaSsxIFsnLScnKyddLCBpKzIgWydOVU1CRVInJ0lERU5USUZJRVInXVxuICAgICAgICAgICAgICAgICAgICBpZiB0b2tlbnNbaV1bMl0ubGFzdF9jb2x1bW4rMSA8IHRva2Vuc1tpKzFdWzJdLmxhc3RfY29sdW1uID09IHRva2Vuc1tpKzJdWzJdLmZpcnN0X2NvbHVtbi0xXG4gICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGkrMSAwIEBnZW5lcmF0ZSAnLCcnLCdcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAyXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIEB0YWcoaSkgaW4gWyddJ10gYW5kIHRva2Vuc1tpXS5zcGFjZWQgYW5kIEB0YWcoaSsxKSBpbiBbJ05VTUJFUicnU1RSSU5HJydTVFJJTkdfU1RBUlQnJ0lERU5USUZJRVInJ1BST1BFUlRZJyd7JycoJydbJ10gIFxuICAgICAgICAgICAgICAgICAgICBtYXRjaCA9IEBmaW5kTWF0Y2hpbmdUYWdCYWNrd2FyZHMgQHRhZyhpKSwgaSwgKHRhZykgLT4gdGFnIGluIFsnTlVNQkVSJydTVFJJTkcnJ1BST1BFUlRZJyc6JycsJyctJycrJ11cbiAgICAgICAgICAgICAgICAgICAgaWYgbWF0Y2guaW5kZXggPj0gMFxuICAgICAgICAgICAgICAgICAgICAgICAgIyBpbnNlcnQgY29tbWEgaWYgbWF0Y2hpbmcgYnJhY2tldCBpcyBub3QgcHJlY2VkZWQgYnkgaWRlbnRpZmllciBvciBlbmQgb2YgY2FsbFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbWF0Y2guaW5kZXggPT0gMCBvciBAdGFnKG1hdGNoLmluZGV4LTEpIG5vdCBpbiBbJ0lERU5USUZJRVInJ0NBTExfRU5EJ10gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpKzEgMCBAZ2VuZXJhdGUgJywnJywnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGhhc0ZlYXR1cmUgQG9wdHMsICdtZXRhJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgQGNoZWNrIGksIFtVTkFSWV9NQVRIOid+J10sIGkrMSBbQ09NUEFSRTonPiddLCBpKzIgWydJREVOVElGSUVSJydJRicnVEhFTicnRUxTRSddXG4gICAgICAgICAgICAgICAgICAgIGlmIEB0YWcoaSsyKSA9PSAnSURFTlRJRklFUidcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHRva2Vuc1tpKzJdWzFdID09ICdlbGlmJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSwgMyBAZ2VuZXJhdGUoJ01FVEFfRUxTRScnZWxzZScpLCBAZ2VuZXJhdGUoJ01FVEFfSUYnJ2lmJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnNbaV0uc3BhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vuc1tpKzFdLnNwYWNlZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vuc1tpKzJdWzFdID0gJ+KWuCcrdG9rZW5zW2krMl1bMV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnNbaSsyXVswXSA9ICdJREVOVElGSUVSJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSwgMlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vuc1tpKzJdWzBdID0gJ01FVEFfJyt0b2tlbnNbaSsyXVswXSBpZiB0b2tlbnNbaSsyXVswXSAhPSAnVEhFTidcbiAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSwgMlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiB0b2tlblsxXVswXSA9PSAn4pa4J1xuICAgICAgICAgICAgICAgICAgICBpZiBAdGFnKGktMSkgbm90IGluIFsnTUVUQV9JRiddXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiB0b2tlblsxXSBpbiBPYmplY3Qua2V5cyBAb3B0cy5tZXRhXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YSA9IEBvcHRzLm1ldGFbdG9rZW5bMV1dXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpLCAwLCBAZ2VuZXJhdGUgJ01FVEFfSUYnJ2lmJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vuc1tpXS5zcGFjZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWR2ID0gMlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIEB0YWcoaSthZHYpID09ICdDQUxMX1NUQVJUJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSBAdGFnKGkrYWR2KyspIG5vdCBpbiBbJ0NBTExfRU5EJycpJydURVJNSU5BVE9SJ11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIGEgaW4gWzAuLi4obWV0YS5pbmZvPy5hcmdzID8gMSldXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBAdGFnKGkrYWR2KSBpbiBbJ05VTUJFUicnU1RSSU5HJ11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmcrKyAjIGFyZ3VtZW50IGZvdW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWR2KytcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgQHRhZyhpK2FkdikgPT0gJ1NUUklOR19TVEFSVCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaCA9IEBmaW5kTWF0Y2hpbmdUYWdGb3J3YXJkcyBAdGFnKGkrYWR2KSwgaSthZHZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBtYXRjaC5pbmRleCA+PSAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZysrICMgc3RyaW5nIGludGVycG9sYXRpb24gYXJndW1lbnQgZm91bmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWR2Kz0gbWF0Y2guaW5kZXggLSBpIC0gMSAjIGNhbiB3ZSBhZHZhbmNlIG92ZXIgdGhlIHdob2xlIGludGVycG9sYXRpb24/IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZyAnbWF0Y2ggaW5kZXgnIG1hdGNoLCBAdGFnKGkrYWR2KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIGFyZyA9PSAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGkrYWR2LCAwLCBAZ2VuZXJhdGUoJ0NBTExfU1RBUlQnJygnKSwgQGdlbmVyYXRlKCdDQUxMX0VORCcnKScpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZHYgKz0gMlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIG1ldGEuaW5mbz8udGhlbiBvciBAdGFnKGkrYWR2KSBub3QgaW4gWydURVJNSU5BVE9SJydJTkRFTlQnJ0NBTExfU1RBUlQnXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGkrYWR2KyssIDAgQGdlbmVyYXRlICdUSEVOJyd0aGVuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhZHZcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIDFcbiAgICBcbiAgICBuZWdhdGl2ZUluZGV4OiAtPlxuXG4gICAgICAgIEBzY2FuVG9rZW5zICh0b2tlbiwgaSwgdG9rZW5zKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBAY2hlY2sgaS0xICdJTkRFWF9TVEFSVCcgaSwgJy0nIGkrMSAnTlVNQkVSJyBpKzIgJ0lOREVYX0VORCdcbiAgICAgICAgICAgICAgICBpZiBAdGFnKGktMikgaW4gWydJREVOVElGSUVSJydQUk9QRVJUWScnU1RSSU5HJydTVFJJTkdfRU5EJyddJycpJ11cbiAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpKzIgMCBAZ2VuZXJhdGUoJy4uJycuLicpLCBAZ2VuZXJhdGUodG9rZW5zW2ldWzBdLCB0b2tlbnNbaV1bMV0pLCBAZ2VuZXJhdGUodG9rZW5zW2krMV1bMF0sIHRva2Vuc1tpKzFdWzFdKVxuICAgICAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGkrNiAwIEBnZW5lcmF0ZSgnSU5ERVhfU1RBUlQnJ1snKSwgQGdlbmVyYXRlKCdOVU1CRVInJzAnKSwgQGdlbmVyYXRlKCdJTkRFWF9FTkQnJ10nKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gN1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgbG9nIEB0YWcoaS0yKVxuICAgICAgICAgICAgMVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwICAgICAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMCAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgY29uZmlnUGFyYW1ldGVyczogLT5cbiAgICAgICAgXG4gICAgICAgIGRpY3RQYXJhbVN0YXJ0ID0gMFxuICAgICAgICBkaWN0UGFyYW1FbmQgICA9IDBcbiAgICAgICAgc3RhY2tDb3VudCAgICAgPSAwXG4gICAgICAgIFxuICAgICAgICBpc0luc2lkZSA9IC0+IGRpY3RQYXJhbVN0YXJ0IGFuZCBub3Qgc3RhY2tDb3VudFxuICAgICAgICBcbiAgICAgICAgQHNjYW5Ub2tlbnMgKHRva2VuLCBpLCB0b2tlbnMpIC0+XG5cbiAgICAgICAgICAgIFt0YWddICAgICA9IHRva2VuXG4gICAgICAgICAgICBbcHJldlRhZ10gPSBwcmV2VG9rZW4gPSBpZiBpID4gMCB0aGVuIHRva2Vuc1tpIC0gMV0gZWxzZSBbXVxuICAgICAgICAgICAgW25leHRUYWddID0gaWYgaSA8IHRva2Vucy5sZW5ndGggLSAxIHRoZW4gdG9rZW5zW2kgKyAxXSBlbHNlIFtdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHRhZyBpcyAneydcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBwcmV2VGFnID09ICdQQVJBTV9TVEFSVCcgb3IgcHJldlRhZyBub3QgaW4gWydbJyd7J10gYW5kIEBmaW5kTWF0Y2hpbmdUYWdCYWNrd2FyZHMoJ1BBUkFNX0VORCcgaSkuaW5kZXggPj0gMFxuICAgICAgICAgICAgICAgICAgICBpZiBub3QgZGljdFBhcmFtU3RhcnRcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpY3RQYXJhbVN0YXJ0ID0gaVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFja0NvdW50KytcbiAgICAgICAgICAgICAgICBlbHNlIGlmIGRpY3RQYXJhbVN0YXJ0XG4gICAgICAgICAgICAgICAgICAgIHN0YWNrQ291bnQrK1xuICAgICAgICAgICAgZWxzZSBpZiB0YWcgaXMgJ30nXG4gICAgICAgICAgICAgICAgaWYgZGljdFBhcmFtU3RhcnQgXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vdCBzdGFja0NvdW50XG4gICAgICAgICAgICAgICAgICAgICAgICBkaWN0UGFyYW1FbmQgPSBpXG4gICAgICAgICAgICAgICAgICAgICAgICBkaWN0UGFyYW1TdGFydCA9IDBcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2tDb3VudC0tXG4gICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgIGlmIGlzSW5zaWRlKClcbiAgICAgICAgICAgICAgICAgICAgaWYgdGFnID09ICc6JyBhbmQgbmV4dFRhZyBub3QgaW4gWydJREVOVElGSUVSJydAJ11cbiAgICAgICAgICAgICAgICAgICAgICAgIG9wZW4gPSBAZmluZE1hdGNoaW5nVGFnQmFja3dhcmRzICd9JyBpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBvcGVuLmluZGV4ID49IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBAdGFnKG9wZW4uaW5kZXgtMSkgbm90IGluIFsnPSddXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSwgMSBAZ2VuZXJhdGUgJz0nJz0nIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBuZXh0VGFnIGluIFsnLCcnfSddXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGkrMSAwIEBnZW5lcmF0ZSAnTlVMTCcnbnVsbCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAyXG4gICAgICAgICAgICAxXG4gICAgICAgICAgICAgICAgIFxuICAgICMgVGhlIGxleGVyIGhhcyB0YWdnZWQgdGhlIG9wZW5pbmcgcGFyZW50aGVzaXMgb2YgYSBtZXRob2QgY2FsbC4gTWF0Y2ggaXQgd2l0aFxuICAgICMgaXRzIHBhaXJlZCBjbG9zZS4gV2UgaGF2ZSB0aGUgbWlzLW5lc3RlZCBvdXRkZW50IGNhc2UgaW5jbHVkZWQgaGVyZSBmb3JcbiAgICAjIGNhbGxzIHRoYXQgY2xvc2Ugb24gdGhlIHNhbWUgbGluZSwganVzdCBiZWZvcmUgdGhlaXIgb3V0ZGVudC5cbiAgICBcbiAgICBjbG9zZU9wZW5DYWxsczogLT5cbiAgICAgICAgXG4gICAgICAgIGNvbmRpdGlvbiA9ICh0b2tlbiwgaSkgLT5cbiAgICAgICAgICAgIHRva2VuWzBdIGluIFsnKScgJ0NBTExfRU5EJ10gb3JcbiAgICAgICAgICAgIHRva2VuWzBdIGlzICdPVVRERU5UJyBhbmQgQHRhZyhpIC0gMSkgaXMgJyknXG5cbiAgICAgICAgYWN0aW9uID0gKHRva2VuLCBpKSAtPlxuICAgICAgICAgICAgQHRva2Vuc1tpZiB0b2tlblswXSBpcyAnT1VUREVOVCcgdGhlbiBpIC0gMSBlbHNlIGldWzBdID0gJ0NBTExfRU5EJ1xuXG4gICAgICAgIEBzY2FuVG9rZW5zICh0b2tlbiwgaSkgLT5cbiAgICAgICAgICAgIEBkZXRlY3RFbmQgaSArIDEsIGNvbmRpdGlvbiwgYWN0aW9uIGlmIHRva2VuWzBdIGlzICdDQUxMX1NUQVJUJ1xuICAgICAgICAgICAgMVxuXG4gICAgIyBUaGUgbGV4ZXIgaGFzIHRhZ2dlZCB0aGUgb3BlbmluZyBwYXJlbnRoZXNpcyBvZiBhbiBpbmRleGluZyBvcGVyYXRpb24gY2FsbC5cbiAgICAjIE1hdGNoIGl0IHdpdGggaXRzIHBhaXJlZCBjbG9zZS5cbiAgICBcbiAgICBjbG9zZU9wZW5JbmRleGVzOiAtPlxuICAgICAgICBcbiAgICAgICAgY29uZGl0aW9uID0gKHRva2VuLCBpKSAtPlxuICAgICAgICAgICAgdG9rZW5bMF0gaW4gWyddJyAnSU5ERVhfRU5EJ11cblxuICAgICAgICBhY3Rpb24gPSAodG9rZW4sIGkpIC0+XG4gICAgICAgICAgICB0b2tlblswXSA9ICdJTkRFWF9FTkQnXG5cbiAgICAgICAgQHNjYW5Ub2tlbnMgKHRva2VuLCBpKSAtPlxuICAgICAgICAgICAgQGRldGVjdEVuZCBpICsgMSwgY29uZGl0aW9uLCBhY3Rpb24gaWYgdG9rZW5bMF0gaXMgJ0lOREVYX1NUQVJUJ1xuICAgICAgICAgICAgMVxuXG4gICAgIyBNYXRjaCB0YWdzIGluIHRva2VuIHN0cmVhbSBzdGFydGluZyBhdCBgaWAgd2l0aCBgcGF0dGVybmAsIHNraXBwaW5nICdIRVJFQ09NTUVOVCdzLlxuICAgICMgYHBhdHRlcm5gIG1heSBjb25zaXN0IG9mIHN0cmluZ3MgKGVxdWFsaXR5KSwgYW4gYXJyYXkgb2Ygc3RyaW5ncyAob25lIG9mKVxuICAgICMgb3IgbnVsbCAod2lsZGNhcmQpLiBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgbWF0Y2ggb3IgLTEgaWYgbm8gbWF0Y2guXG4gICAgXG4gICAgaW5kZXhPZlRhZzogKGksIHBhdHRlcm4uLi4pIC0+XG4gICAgICAgIGZ1enogPSAwXG4gICAgICAgIGZvciBqIGluIFswIC4uLiBwYXR0ZXJuLmxlbmd0aF1cbiAgICAgICAgICAgIGZ1enogKz0gMiB3aGlsZSBAdGFnKGkgKyBqICsgZnV6eikgaXMgJ0hFUkVDT01NRU5UJ1xuICAgICAgICAgICAgY29udGludWUgaWYgbm90IHBhdHRlcm5bal0/XG4gICAgICAgICAgICBwYXR0ZXJuW2pdID0gW3BhdHRlcm5bal1dIGlmIHR5cGVvZiBwYXR0ZXJuW2pdIGlzICdzdHJpbmcnXG4gICAgICAgICAgICByZXR1cm4gLTEgaWYgQHRhZyhpICsgaiArIGZ1enopIG5vdCBpbiBwYXR0ZXJuW2pdXG4gICAgICAgIGkgKyBqICsgZnV6eiAtIDFcblxuICAgICMgYEA8eD46YCwgYDx4PjpgIG9yIGA8RVhQUkVTU0lPTl9TVEFSVD48eD4uLi48RVhQUkVTU0lPTl9FTkQ+OmAsIHNraXBwaW5nIG92ZXIgJ0hFUkVDT01NRU5UJ3MuXG4gICAgXG4gICAgbG9va3NPYmplY3Rpc2g6IChqKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHllcyBpZiBAaW5kZXhPZlRhZyhqLCAnQCcsIG51bGwsICc6JykgPiAtMSBvciBAaW5kZXhPZlRhZyhqLCBudWxsLCAnOicpID4gLTFcbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gQGluZGV4T2ZUYWcoaiwgRVhQUkVTU0lPTl9TVEFSVClcbiAgICAgICAgaWYgaW5kZXggPiAtMVxuICAgICAgICAgICAgZW5kID0gbnVsbFxuICAgICAgICAgICAgQGRldGVjdEVuZCBpbmRleCArIDEsICgodG9rZW4pIC0+IHRva2VuWzBdIGluIEVYUFJFU1NJT05fRU5EKSwgKCh0b2tlbiwgaSkgLT4gZW5kID0gaSlcbiAgICAgICAgICAgIHJldHVybiB5ZXMgaWYgQHRhZyhlbmQgKyAxKSBpcyAnOidcbiAgICAgICAgbm9cblxuICAgICMgUmV0dXJucyBgeWVzYCBpZiBjdXJyZW50IGxpbmUgb2YgdG9rZW5zIGNvbnRhaW4gYW4gZWxlbWVudCBvZiB0YWdzIG9uIHNhbWUgZXhwcmVzc2lvbiBsZXZlbC4gXG4gICAgIyBTdG9wIHNlYXJjaGluZyBhdCBMSU5FQlJFQUtTIG9yIGV4cGxpY2l0IHN0YXJ0IG9mIGNvbnRhaW5pbmcgYmFsYW5jZWQgZXhwcmVzc2lvbi5cbiAgICBcbiAgICBmaW5kVGFnc0JhY2t3YXJkczogKGksIHRhZ3MpIC0+XG4gICAgICAgIGJhY2tTdGFjayA9IFtdXG4gICAgICAgIHdoaWxlIGkgPj0gMCBhbmQgKGJhY2tTdGFjay5sZW5ndGggb3JcbiAgICAgICAgICAgICAgICAgICAgQHRhZyhpKSBub3QgaW4gdGFncyBhbmRcbiAgICAgICAgICAgICAgICAgICAgKEB0YWcoaSkgbm90IGluIEVYUFJFU1NJT05fU1RBUlQgb3IgQHRva2Vuc1tpXS5nZW5lcmF0ZWQpIGFuZFxuICAgICAgICAgICAgICAgICAgICBAdGFnKGkpIG5vdCBpbiBMSU5FQlJFQUtTKVxuICAgICAgICAgICAgYmFja1N0YWNrLnB1c2ggQHRhZyhpKSBpZiBAdGFnKGkpIGluIEVYUFJFU1NJT05fRU5EXG4gICAgICAgICAgICBiYWNrU3RhY2sucG9wKCkgaWYgQHRhZyhpKSBpbiBFWFBSRVNTSU9OX1NUQVJUIGFuZCBiYWNrU3RhY2subGVuZ3RoXG4gICAgICAgICAgICBpIC09IDFcbiAgICAgICAgQHRhZyhpKSBpbiB0YWdzXG5cbiAgICAjIDAwMCAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICAjIExvb2sgZm9yIHNpZ25zIG9mIGltcGxpY2l0IGNhbGxzIGFuZCBvYmplY3RzIGluIHRoZSB0b2tlbiBzdHJlYW0gYW5kIGFkZCB0aGVtLlxuICAgICAgICBcbiAgICBhZGRJbXBsaWNpdEJyYWNlc0FuZFBhcmVuczogLT5cblxuICAgICAgICAjIFRyYWNrIGN1cnJlbnQgYmFsYW5jaW5nIGRlcHRoIChib3RoIGltcGxpY2l0IGFuZCBleHBsaWNpdCkgb24gc3RhY2suXG4gICAgICAgIHN0YWNrID0gW11cbiAgICAgICAgc3RhcnQgPSBudWxsXG5cbiAgICAgICAgQHNjYW5Ub2tlbnMgKHRva2VuLCBpLCB0b2tlbnMpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIFt0YWddICAgICA9IHRva2VuXG4gICAgICAgICAgICBbcHJldlRhZ10gPSBwcmV2VG9rZW4gPSBpZiBpID4gMCB0aGVuIHRva2Vuc1tpIC0gMV0gZWxzZSBbXVxuICAgICAgICAgICAgW25leHRUYWddID0gaWYgaSA8IHRva2Vucy5sZW5ndGggLSAxIHRoZW4gdG9rZW5zW2kgKyAxXSBlbHNlIFtdXG4gICAgICAgICAgICBzdGFja1RvcCAgPSAtPiBzdGFja1tzdGFjay5sZW5ndGggLSAxXVxuICAgICAgICAgICAgc3RhcnRJZHggID0gaVxuXG4gICAgICAgICAgICAjIEhlbHBlciBmdW5jdGlvbiwgdXNlZCBmb3Iga2VlcGluZyB0cmFjayBvZiB0aGUgbnVtYmVyIG9mIHRva2VucyBjb25zdW1lZFxuICAgICAgICAgICAgIyBhbmQgc3BsaWNlZCwgd2hlbiByZXR1cm5pbmcgZm9yIGdldHRpbmcgYSBuZXcgdG9rZW4uXG4gICAgICAgICAgICBmb3J3YXJkICAgPSAobikgLT4gaSAtIHN0YXJ0SWR4ICsgblxuXG4gICAgICAgICAgICAjIEhlbHBlciBmdW5jdGlvbnNcbiAgICAgICAgICAgIGlzSW1wbGljaXQgICAgICAgICAgPSAoc3RhY2tJdGVtKSAtPiBzdGFja0l0ZW0/WzJdPy5vdXJzXG4gICAgICAgICAgICBpc0ltcGxpY2l0T2JqZWN0ICAgID0gKHN0YWNrSXRlbSkgLT4gaXNJbXBsaWNpdChzdGFja0l0ZW0pIGFuZCBzdGFja0l0ZW0/WzBdIGlzICd7J1xuICAgICAgICAgICAgaXNJbXBsaWNpdENhbGwgICAgICA9IChzdGFja0l0ZW0pIC0+IGlzSW1wbGljaXQoc3RhY2tJdGVtKSBhbmQgc3RhY2tJdGVtP1swXSBpcyAnKCdcbiAgICAgICAgICAgIGluSW1wbGljaXQgICAgICAgICAgPSAtPiBpc0ltcGxpY2l0IHN0YWNrVG9wKClcbiAgICAgICAgICAgIGluSW1wbGljaXRDYWxsICAgICAgPSAtPiBpc0ltcGxpY2l0Q2FsbCBzdGFja1RvcCgpXG4gICAgICAgICAgICBpbkltcGxpY2l0T2JqZWN0ICAgID0gLT4gaXNJbXBsaWNpdE9iamVjdCBzdGFja1RvcCgpXG4gICAgICAgICAgICAjIFVuY2xvc2VkIGNvbnRyb2wgc3RhdGVtZW50IGluc2lkZSBpbXBsaWNpdCBwYXJlbnMgKGxpa2VcbiAgICAgICAgICAgICMgY2xhc3MgZGVjbGFyYXRpb24gb3IgaWYtY29uZGl0aW9uYWxzKVxuICAgICAgICAgICAgaW5JbXBsaWNpdENvbnRyb2wgPSAtPiBpbkltcGxpY2l0IGFuZCBzdGFja1RvcCgpP1swXSBpcyAnQ09OVFJPTCdcblxuICAgICAgICAgICAgc3RhcnRJbXBsaWNpdENhbGwgPSAoaikgLT5cbiAgICAgICAgICAgICAgICBpZHggPSBqID8gaVxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2ggWycoJywgaWR4LCBvdXJzOiB5ZXNdXG4gICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpZHgsIDAsIFJld3JpdGVyLmdlbmVyYXRlICdDQUxMX1NUQVJUJywgJygnLCBbJycsICdpbXBsaWNpdCBmdW5jdGlvbiBjYWxsJywgdG9rZW5bMl1dXG4gICAgICAgICAgICAgICAgaSArPSAxIGlmIG5vdCBqP1xuXG4gICAgICAgICAgICBlbmRJbXBsaWNpdENhbGwgPSAtPlxuICAgICAgICAgICAgICAgIHN0YWNrLnBvcCgpXG4gICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpLCAwLCBSZXdyaXRlci5nZW5lcmF0ZSAnQ0FMTF9FTkQnLCAnKScsIFsnJywgJ2VuZCBvZiBpbnB1dCcsIHRva2VuWzJdXVxuICAgICAgICAgICAgICAgIGkgKz0gMVxuXG4gICAgICAgICAgICBzdGFydEltcGxpY2l0T2JqZWN0ID0gKGosIHN0YXJ0c0xpbmUgPSB5ZXMpIC0+XG4gICAgICAgICAgICAgICAgaWR4ID0gaiA/IGlcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoIFsneycsIGlkeCwgc2FtZUxpbmU6IHllcywgc3RhcnRzTGluZTogc3RhcnRzTGluZSwgb3VyczogeWVzXVxuICAgICAgICAgICAgICAgIHZhbCA9IG5ldyBTdHJpbmcgJ3snXG4gICAgICAgICAgICAgICAgdmFsLmdlbmVyYXRlZCA9IHllc1xuICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaWR4LCAwLCBSZXdyaXRlci5nZW5lcmF0ZSAneycsIHZhbCwgdG9rZW5cbiAgICAgICAgICAgICAgICBpICs9IDEgaWYgbm90IGo/XG5cbiAgICAgICAgICAgIGVuZEltcGxpY2l0T2JqZWN0ID0gKGopIC0+XG4gICAgICAgICAgICAgICAgaiA9IGogPyBpXG4gICAgICAgICAgICAgICAgc3RhY2sucG9wKClcbiAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGosIDAsIFJld3JpdGVyLmdlbmVyYXRlICd9JywgJ30nLCB0b2tlblxuICAgICAgICAgICAgICAgIGkgKz0gMVxuXG4gICAgICAgICAgICAjIERvbid0IGVuZCBhbiBpbXBsaWNpdCBjYWxsIG9uIG5leHQgaW5kZW50IGlmIGFueSBvZiB0aGVzZSBhcmUgaW4gYW4gYXJndW1lbnRcbiAgICAgICAgICAgIGlmIGluSW1wbGljaXRDYWxsKCkgYW5kIHRhZyBpbiBbJ0lGJyAnTUVUQV9JRicsICdUUlknICdGSU5BTExZJyAnQ0FUQ0gnICdDTEFTUycgJ1NXSVRDSCddXG4gICAgICAgICAgICAgICAgc3RhY2sucHVzaCBbJ0NPTlRST0wnLCBpLCBvdXJzOiB5ZXNdXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvcndhcmQoMSlcblxuICAgICAgICAgICAgaWYgdGFnIGlzICdJTkRFTlQnIGFuZCBpbkltcGxpY2l0KClcblxuICAgICAgICAgICAgICAgICMgQW4gYElOREVOVGAgY2xvc2VzIGFuIGltcGxpY2l0IGNhbGwgdW5sZXNzXG4gICAgICAgICAgICAgICAgI1xuICAgICAgICAgICAgICAgICMgICAgMS4gV2UgaGF2ZSBzZWVuIGEgYENPTlRST0xgIGFyZ3VtZW50IG9uIHRoZSBsaW5lLlxuICAgICAgICAgICAgICAgICMgICAgMi4gVGhlIGxhc3QgdG9rZW4gYmVmb3JlIHRoZSBpbmRlbnQgaXMgcGFydCBvZiB0aGUgbGlzdCBiZWxvd1xuICAgICAgICAgICAgICAgICNcbiAgICAgICAgICAgICAgICBpZiBwcmV2VGFnIG5vdCBpbiBbJz0+JyAnLT4nICdbJyAnKCcgJywnICd7JyAnVFJZJyAnRUxTRScsICdNRVRBX0VMU0UnICc9J11cbiAgICAgICAgICAgICAgICAgICAgZW5kSW1wbGljaXRDYWxsKCkgd2hpbGUgaW5JbXBsaWNpdENhbGwoKVxuICAgICAgICAgICAgICAgIHN0YWNrLnBvcCgpIGlmIGluSW1wbGljaXRDb250cm9sKClcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoIFt0YWcsIGldXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvcndhcmQoMSlcblxuICAgICAgICAgICAgIyBTdHJhaWdodGZvcndhcmQgc3RhcnQgb2YgZXhwbGljaXQgZXhwcmVzc2lvblxuICAgICAgICAgICAgaWYgdGFnIGluIEVYUFJFU1NJT05fU1RBUlRcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoIFt0YWcsIGldXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvcndhcmQoMSlcblxuICAgICAgICAgICAgIyBDbG9zZSBhbGwgaW1wbGljaXQgZXhwcmVzc2lvbnMgaW5zaWRlIG9mIGV4cGxpY2l0bHkgY2xvc2VkIGV4cHJlc3Npb25zLlxuICAgICAgICAgICAgaWYgdGFnIGluIEVYUFJFU1NJT05fRU5EXG4gICAgICAgICAgICAgICAgd2hpbGUgaW5JbXBsaWNpdCgpXG4gICAgICAgICAgICAgICAgICAgIGlmIGluSW1wbGljaXRDYWxsKClcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZEltcGxpY2l0Q2FsbCgpXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgaW5JbXBsaWNpdE9iamVjdCgpXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmRJbXBsaWNpdE9iamVjdCgpXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrLnBvcCgpXG4gICAgICAgICAgICAgICAgc3RhcnQgPSBzdGFjay5wb3AoKVxuXG4gICAgICAgICAgICAjIFJlY29nbml6ZSBzdGFuZGFyZCBpbXBsaWNpdCBjYWxscyBsaWtlXG4gICAgICAgICAgICAjIGYgYSwgZigpIGIsIGY/IGMsIGhbMF0gZCBldGMuXG4gICAgICAgICAgICBpZiAodGFnIGluIElNUExJQ0lUX0ZVTkMgYW5kIHRva2VuLnNwYWNlZCBvclxuICAgICAgICAgICAgICAgICAgICB0YWcgaXMgJz8nIGFuZCBpID4gMCBhbmQgbm90IHRva2Vuc1tpIC0gMV0uc3BhY2VkKSBhbmRcbiAgICAgICAgICAgICAgICAgKG5leHRUYWcgaW4gSU1QTElDSVRfQ0FMTCBvclxuICAgICAgICAgICAgICAgICAgICBuZXh0VGFnIGluIElNUExJQ0lUX1VOU1BBQ0VEX0NBTEwgYW5kXG4gICAgICAgICAgICAgICAgICAgIG5vdCB0b2tlbnNbaSArIDFdPy5zcGFjZWQgYW5kIG5vdCB0b2tlbnNbaSArIDFdPy5uZXdMaW5lKVxuICAgICAgICAgICAgICAgIHRhZyA9IHRva2VuWzBdID0gJ0ZVTkNfRVhJU1QnIGlmIHRhZyBpcyAnPydcbiAgICAgICAgICAgICAgICBzdGFydEltcGxpY2l0Q2FsbCBpICsgMVxuICAgICAgICAgICAgICAgIHJldHVybiBmb3J3YXJkKDIpXG5cbiAgICAgICAgICAgICMgSW1wbGljaXQgY2FsbCB0YWtpbmcgYW4gaW1wbGljaXQgaW5kZW50ZWQgb2JqZWN0IGFzIGZpcnN0IGFyZ3VtZW50LlxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyAgICAgICAgICAgZlxuICAgICAgICAgICAgIyAgICAgICAgICAgICAgIGE6IGJcbiAgICAgICAgICAgICMgICAgICAgICAgICAgICBjOiBkXG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjIGFuZFxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyAgICAgICAgICAgZlxuICAgICAgICAgICAgIyAgICAgICAgICAgICAgIDFcbiAgICAgICAgICAgICMgICAgICAgICAgICAgICBhOiBiXG4gICAgICAgICAgICAjICAgICAgICAgICAgICAgYjogY1xuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyBEb24ndCBhY2NlcHQgaW1wbGljaXQgY2FsbHMgb2YgdGhpcyB0eXBlLCB3aGVuIG9uIHRoZSBzYW1lIGxpbmVcbiAgICAgICAgICAgICMgYXMgdGhlIGNvbnRyb2wgc3RydWN0dXJlcyBiZWxvdyBhcyB0aGF0IG1heSBtaXNpbnRlcnByZXQgY29uc3RydWN0cyBsaWtlOlxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyAgICAgICAgICAgaWYgZlxuICAgICAgICAgICAgIyAgICAgICAgICAgICAgICBhOiAxXG4gICAgICAgICAgICAjIGFzXG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjICAgICAgICAgICBpZiBmKGE6IDEpXG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjIHdoaWNoIGlzIHByb2JhYmx5IGFsd2F5cyB1bmludGVuZGVkLlxuICAgICAgICAgICAgIyBGdXJ0aGVybW9yZSBkb24ndCBhbGxvdyB0aGlzIGluIGxpdGVyYWwgYXJyYXlzLCBhcyB0aGF0IGNyZWF0ZXMgZ3JhbW1hdGljYWwgYW1iaWd1aXRpZXMuXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHRhZyBpbiBJTVBMSUNJVF9GVU5DIGFuZFxuICAgICAgICAgICAgICAgICBAaW5kZXhPZlRhZyhpICsgMSwgJ0lOREVOVCcpID4gLTEgYW5kIEBsb29rc09iamVjdGlzaChpICsgMikgYW5kXG4gICAgICAgICAgICAgICAgIG5vdCBAZmluZFRhZ3NCYWNrd2FyZHMoaSwgWydDTEFTUycgJ0VYVEVORFMnICdJRicgJ01FVEFfSUYnICdDQVRDSCcgJ1NXSVRDSCcgJ0xFQURJTkdfV0hFTicgJ0ZPUicgJ1dISUxFJyAnVU5USUwnXSlcbiAgICAgICAgICAgICAgICBzdGFydEltcGxpY2l0Q2FsbCBpICsgMVxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2ggWydJTkRFTlQnLCBpICsgMl1cbiAgICAgICAgICAgICAgICByZXR1cm4gZm9yd2FyZCgzKVxuXG4gICAgICAgICAgICAjIEltcGxpY2l0IG9iamVjdHMgc3RhcnQgaGVyZVxuICAgICAgICAgICAgaWYgdGFnIGlzICc6J1xuICAgICAgICAgICAgICAgICMgR28gYmFjayB0byB0aGUgKGltcGxpY2l0KSBzdGFydCBvZiB0aGUgb2JqZWN0XG4gICAgICAgICAgICAgICAgcyA9IHN3aXRjaFxuICAgICAgICAgICAgICAgICAgICB3aGVuIEB0YWcoaSAtIDEpIGluIEVYUFJFU1NJT05fRU5EIHRoZW4gc3RhcnRbMV1cbiAgICAgICAgICAgICAgICAgICAgd2hlbiBAdGFnKGkgLSAyKSBpcyAnQCcgdGhlbiBpIC0gMlxuICAgICAgICAgICAgICAgICAgICBlbHNlIGkgLSAxXG4gICAgICAgICAgICAgICAgcyAtPSAyIHdoaWxlIEB0YWcocyAtIDIpIGlzICdIRVJFQ09NTUVOVCdcblxuICAgICAgICAgICAgICAgICMgTWFyayBpZiB0aGUgdmFsdWUgaXMgYSBmb3IgbG9vcFxuICAgICAgICAgICAgICAgIEBpbnNpZGVGb3JEZWNsYXJhdGlvbiA9IG5leHRUYWcgaXMgJ0ZPUidcblxuICAgICAgICAgICAgICAgIHN0YXJ0c0xpbmUgPSBzIGlzIDAgb3IgQHRhZyhzIC0gMSkgaW4gTElORUJSRUFLUyBvciB0b2tlbnNbcyAtIDFdLm5ld0xpbmVcbiAgICAgICAgICAgICAgICAjIEFyZSB3ZSBqdXN0IGNvbnRpbnVpbmcgYW4gYWxyZWFkeSBkZWNsYXJlZCBvYmplY3Q/XG4gICAgICAgICAgICAgICAgaWYgc3RhY2tUb3AoKVxuICAgICAgICAgICAgICAgICAgICBbc3RhY2tUYWcsIHN0YWNrSWR4XSA9IHN0YWNrVG9wKClcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YWNrVGFnIGlzICd7JyBvciBzdGFja1RhZyBpcyAnSU5ERU5UJyBhbmQgQHRhZyhzdGFja0lkeCAtIDEpIGlzICd7JykgYW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAgKHN0YXJ0c0xpbmUgb3IgQHRhZyhzIC0gMSkgaXMgJywnIG9yIEB0YWcocyAtIDEpIGlzICd7JylcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmb3J3YXJkKDEpXG5cbiAgICAgICAgICAgICAgICBzdGFydEltcGxpY2l0T2JqZWN0KHMsICEhc3RhcnRzTGluZSlcbiAgICAgICAgICAgICAgICByZXR1cm4gZm9yd2FyZCgyKVxuXG4gICAgICAgICAgICAjIEVuZCBpbXBsaWNpdCBjYWxscyB3aGVuIGNoYWluaW5nIG1ldGhvZCBjYWxsc1xuICAgICAgICAgICAgIyBsaWtlIGUuZy46XG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjICAgICAgICAgICBmIC0+XG4gICAgICAgICAgICAjICAgICAgICAgICAgICAgYVxuICAgICAgICAgICAgIyAgICAgICAgICAgLmcgYiwgLT5cbiAgICAgICAgICAgICMgICAgICAgICAgICAgICBjXG4gICAgICAgICAgICAjICAgICAgICAgICAuaCBhXG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjIGFuZCBhbHNvXG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjICAgICAgICAgICBmIGFcbiAgICAgICAgICAgICMgICAgICAgICAgIC5nIGJcbiAgICAgICAgICAgICMgICAgICAgICAgIC5oIGFcblxuICAgICAgICAgICAgIyBNYXJrIGFsbCBlbmNsb3Npbmcgb2JqZWN0cyBhcyBub3Qgc2FtZUxpbmVcbiAgICAgICAgICAgIGlmIHRhZyBpbiBMSU5FQlJFQUtTXG4gICAgICAgICAgICAgICAgZm9yIHN0YWNrSXRlbSBpbiBzdGFjayBieSAtMVxuICAgICAgICAgICAgICAgICAgICBicmVhayB1bmxlc3MgaXNJbXBsaWNpdCBzdGFja0l0ZW1cbiAgICAgICAgICAgICAgICAgICAgc3RhY2tJdGVtWzJdLnNhbWVMaW5lID0gbm8gaWYgaXNJbXBsaWNpdE9iamVjdCBzdGFja0l0ZW1cblxuICAgICAgICAgICAgbmV3TGluZSA9IHByZXZUYWcgaXMgJ09VVERFTlQnIG9yIHByZXZUb2tlbi5uZXdMaW5lXG4gICAgICAgICAgICBpZiB0YWcgaW4gSU1QTElDSVRfRU5EIG9yIHRhZyBpbiBDQUxMX0NMT1NFUlMgYW5kIG5ld0xpbmVcbiAgICAgICAgICAgICAgICB3aGlsZSBpbkltcGxpY2l0KClcbiAgICAgICAgICAgICAgICAgICAgW3N0YWNrVGFnLCBzdGFja0lkeCwge3NhbWVMaW5lLCBzdGFydHNMaW5lfV0gPSBzdGFja1RvcCgpXG4gICAgICAgICAgICAgICAgICAgICMgQ2xvc2UgaW1wbGljaXQgY2FsbHMgd2hlbiByZWFjaGVkIGVuZCBvZiBhcmd1bWVudCBsaXN0XG4gICAgICAgICAgICAgICAgICAgIGlmIGluSW1wbGljaXRDYWxsKCkgYW5kIHByZXZUYWcgIT0gJywnXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmRJbXBsaWNpdENhbGwoKVxuICAgICAgICAgICAgICAgICAgICAjIENsb3NlIGltcGxpY2l0IG9iamVjdHMgc3VjaCBhczpcbiAgICAgICAgICAgICAgICAgICAgIyByZXR1cm4gYTogMSwgYjogMiB1bmxlc3MgdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGluSW1wbGljaXRPYmplY3QoKSBhbmQgbm90IEBpbnNpZGVGb3JEZWNsYXJhdGlvbiBhbmQgc2FtZUxpbmUgYW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcgIT0gJ1RFUk1JTkFUT1InIGFuZCBwcmV2VGFnICE9ICc6J1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5kSW1wbGljaXRPYmplY3QoKVxuICAgICAgICAgICAgICAgICAgICAjIENsb3NlIGltcGxpY2l0IG9iamVjdHMgd2hlbiBhdCBlbmQgb2YgbGluZSwgbGluZSBkaWRuJ3QgZW5kIHdpdGggYSBjb21tYVxuICAgICAgICAgICAgICAgICAgICAjIGFuZCB0aGUgaW1wbGljaXQgb2JqZWN0IGRpZG4ndCBzdGFydCB0aGUgbGluZSBvciB0aGUgbmV4dCBsaW5lIGRvZXNuJ3QgbG9vayBsaWtlXG4gICAgICAgICAgICAgICAgICAgICMgdGhlIGNvbnRpbnVhdGlvbiBvZiBhbiBvYmplY3QuXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgaW5JbXBsaWNpdE9iamVjdCgpIGFuZCB0YWcgaXMgJ1RFUk1JTkFUT1InIGFuZCBwcmV2VGFnICE9ICcsJyBhbmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdCAoc3RhcnRzTGluZSBhbmQgQGxvb2tzT2JqZWN0aXNoKGkgKyAxKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmb3J3YXJkIDEgaWYgbmV4dFRhZyBpcyAnSEVSRUNPTU1FTlQnXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmRJbXBsaWNpdE9iamVjdCgpXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICMgQ2xvc2UgaW1wbGljaXQgb2JqZWN0IGlmIGNvbW1hIGlzIHRoZSBsYXN0IGNoYXJhY3RlclxuICAgICAgICAgICAgIyBhbmQgd2hhdCBjb21lcyBhZnRlciBkb2Vzbid0IGxvb2sgbGlrZSBpdCBiZWxvbmdzLlxuICAgICAgICAgICAgIyBUaGlzIGlzIHVzZWQgZm9yIHRyYWlsaW5nIGNvbW1hcyBhbmQgY2FsbHMsIGxpa2U6XG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjICAgICAgICAgICB4ID1cbiAgICAgICAgICAgICMgICAgICAgICAgICAgICAgICAgYTogYixcbiAgICAgICAgICAgICMgICAgICAgICAgICAgICAgICAgYzogZCxcbiAgICAgICAgICAgICMgICAgICAgICAgIGUgPSAyXG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjIGFuZFxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyAgICAgICAgICAgZiBhLCBiOiBjLCBkOiBlLCBmLCBnOiBoOiBpLCBqXG4gICAgICAgICAgICAjXG4gICAgICAgICAgICBpZiB0YWcgaXMgJywnIGFuZCBub3QgQGxvb2tzT2JqZWN0aXNoKGkgKyAxKSBhbmQgaW5JbXBsaWNpdE9iamVjdCgpIGFuZFxuICAgICAgICAgICAgICAgICBub3QgQGluc2lkZUZvckRlY2xhcmF0aW9uIGFuZFxuICAgICAgICAgICAgICAgICAobmV4dFRhZyAhPSAnVEVSTUlOQVRPUicgb3Igbm90IEBsb29rc09iamVjdGlzaChpICsgMikpXG4gICAgICAgICAgICAgICAgIyBXaGVuIG5leHRUYWcgaXMgT1VUREVOVCB0aGUgY29tbWEgaXMgaW5zaWduaWZpY2FudCBhbmRcbiAgICAgICAgICAgICAgICAjIHNob3VsZCBqdXN0IGJlIGlnbm9yZWQgc28gZW1iZWQgaXQgaW4gdGhlIGltcGxpY2l0IG9iamVjdC5cbiAgICAgICAgICAgICAgICAjXG4gICAgICAgICAgICAgICAgIyBXaGVuIGl0IGlzbid0IHRoZSBjb21tYSBnbyBvbiB0byBwbGF5IGEgcm9sZSBpbiBhIGNhbGwgb3JcbiAgICAgICAgICAgICAgICAjIGFycmF5IGZ1cnRoZXIgdXAgdGhlIHN0YWNrLCBzbyBnaXZlIGl0IGEgY2hhbmNlLlxuXG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gaWYgbmV4dFRhZyBpcyAnT1VUREVOVCcgdGhlbiAxIGVsc2UgMFxuICAgICAgICAgICAgICAgIHdoaWxlIGluSW1wbGljaXRPYmplY3QoKVxuICAgICAgICAgICAgICAgICAgICBlbmRJbXBsaWNpdE9iamVjdCBpICsgb2Zmc2V0XG4gICAgICAgICAgICByZXR1cm4gZm9yd2FyZCgxKVxuICAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgIFxuICAgICMgQWRkIGxvY2F0aW9uIGRhdGEgdG8gYWxsIHRva2VucyBnZW5lcmF0ZWQgYnkgdGhlIHJld3JpdGVyLlxuICAgIFxuICAgIGFkZExvY2F0aW9uRGF0YVRvR2VuZXJhdGVkVG9rZW5zOiAtPlxuICAgICAgICBAc2NhblRva2VucyAodG9rZW4sIGksIHRva2VucykgLT5cbiAgICAgICAgICAgIHJldHVybiAxIGlmIHRva2VuWzJdXG4gICAgICAgICAgICByZXR1cm4gMSB1bmxlc3MgdG9rZW4uZ2VuZXJhdGVkIG9yIHRva2VuLmV4cGxpY2l0XG4gICAgICAgICAgICBpZiB0b2tlblswXSBpcyAneycgYW5kIG5leHRMb2NhdGlvbj10b2tlbnNbaSArIDFdP1syXVxuICAgICAgICAgICAgICAgIHtmaXJzdF9saW5lOiBsaW5lLCBmaXJzdF9jb2x1bW46IGNvbHVtbn0gPSBuZXh0TG9jYXRpb25cbiAgICAgICAgICAgIGVsc2UgaWYgcHJldkxvY2F0aW9uID0gdG9rZW5zW2kgLSAxXT9bMl1cbiAgICAgICAgICAgICAgICB7bGFzdF9saW5lOiBsaW5lLCBsYXN0X2NvbHVtbjogY29sdW1ufSA9IHByZXZMb2NhdGlvblxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGxpbmUgPSBjb2x1bW4gPSAwXG4gICAgICAgICAgICB0b2tlblsyXSA9XG4gICAgICAgICAgICAgICAgZmlyc3RfbGluZTogICBsaW5lXG4gICAgICAgICAgICAgICAgZmlyc3RfY29sdW1uOiBjb2x1bW5cbiAgICAgICAgICAgICAgICBsYXN0X2xpbmU6ICAgIGxpbmVcbiAgICAgICAgICAgICAgICBsYXN0X2NvbHVtbjogIGNvbHVtblxuICAgICAgICAgICAgcmV0dXJuIDFcblxuICAgICMgT1VUREVOVCB0b2tlbnMgc2hvdWxkIGFsd2F5cyBiZSBwb3NpdGlvbmVkIGF0IHRoZSBsYXN0IGNoYXJhY3RlciBvZiB0aGVcbiAgICAjIHByZXZpb3VzIHRva2VuLCBzbyB0aGF0IEFTVCBub2RlcyBlbmRpbmcgaW4gYW4gT1VUREVOVCB0b2tlbiBlbmQgdXAgd2l0aCBhXG4gICAgIyBsb2NhdGlvbiBjb3JyZXNwb25kaW5nIHRvIHRoZSBsYXN0IFwicmVhbFwiIHRva2VuIHVuZGVyIHRoZSBub2RlLlxuICAgIGZpeE91dGRlbnRMb2NhdGlvbkRhdGE6IC0+XG4gICAgICAgIEBzY2FuVG9rZW5zICh0b2tlbiwgaSwgdG9rZW5zKSAtPlxuICAgICAgICAgICAgcmV0dXJuIDEgdW5sZXNzIHRva2VuWzBdIGlzICdPVVRERU5UJyBvclxuICAgICAgICAgICAgICAgICh0b2tlbi5nZW5lcmF0ZWQgYW5kIHRva2VuWzBdIGlzICdDQUxMX0VORCcpIG9yXG4gICAgICAgICAgICAgICAgKHRva2VuLmdlbmVyYXRlZCBhbmQgdG9rZW5bMF0gaXMgJ30nKVxuICAgICAgICAgICAgcHJldkxvY2F0aW9uRGF0YSA9IHRva2Vuc1tpIC0gMV1bMl1cbiAgICAgICAgICAgIHRva2VuWzJdID1cbiAgICAgICAgICAgICAgICBmaXJzdF9saW5lOiAgIHByZXZMb2NhdGlvbkRhdGEubGFzdF9saW5lXG4gICAgICAgICAgICAgICAgZmlyc3RfY29sdW1uOiBwcmV2TG9jYXRpb25EYXRhLmxhc3RfY29sdW1uXG4gICAgICAgICAgICAgICAgbGFzdF9saW5lOiAgICBwcmV2TG9jYXRpb25EYXRhLmxhc3RfbGluZVxuICAgICAgICAgICAgICAgIGxhc3RfY29sdW1uOiAgcHJldkxvY2F0aW9uRGF0YS5sYXN0X2NvbHVtblxuICAgICAgICAgICAgcmV0dXJuIDFcblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgICAwMDAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgICMgQmVjYXVzZSBvdXIgZ3JhbW1hciBpcyBMQUxSKDEpLCBpdCBjYW4ndCBoYW5kbGUgc29tZSBzaW5nbGUtbGluZVxuICAgICMgZXhwcmVzc2lvbnMgdGhhdCBsYWNrIGVuZGluZyBkZWxpbWl0ZXJzLiBUaGUgKipSZXdyaXRlcioqIGFkZHMgdGhlIGltcGxpY2l0XG4gICAgIyBibG9ja3MsIHNvIGl0IGRvZXNuJ3QgbmVlZCB0by4gVG8ga2VlcCB0aGUgZ3JhbW1hciBjbGVhbiBhbmQgdGlkeSwgdHJhaWxpbmdcbiAgICAjIG5ld2xpbmVzIHdpdGhpbiBleHByZXNzaW9ucyBhcmUgcmVtb3ZlZCBhbmQgdGhlIGluZGVudGF0aW9uIHRva2VucyBvZiBlbXB0eVxuICAgICMgYmxvY2tzIGFyZSBhZGRlZC5cbiAgICBcbiAgICBub3JtYWxpemVMaW5lczogLT5cbiAgICAgICAgc3RhcnRlciA9IGluZGVudCA9IG91dGRlbnQgPSBudWxsXG5cbiAgICAgICAgY29uZGl0aW9uID0gKHRva2VuLCBpKSAtPlxuICAgICAgICAgICAgdG9rZW5bMV0gIT0gJzsnIGFuZCB0b2tlblswXSBpbiBTSU5HTEVfQ0xPU0VSUyBhbmRcbiAgICAgICAgICAgIG5vdCAodG9rZW5bMF0gaXMgJ1RFUk1JTkFUT1InIGFuZCBAdGFnKGkgKyAxKSBpbiBFWFBSRVNTSU9OX0NMT1NFKSBhbmRcbiAgICAgICAgICAgIG5vdCAodG9rZW5bMF0gaW4gWydFTFNFJyAnTUVUQV9FTFNFJ10gYW5kIHN0YXJ0ZXIgIT0gJ1RIRU4nKSBhbmRcbiAgICAgICAgICAgIG5vdCAodG9rZW5bMF0gaW4gWydDQVRDSCcgJ0ZJTkFMTFknXSBhbmQgc3RhcnRlciBpbiBbJy0+JyAnPT4nXSkgb3JcbiAgICAgICAgICAgIHRva2VuWzBdIGluIENBTExfQ0xPU0VSUyBhbmRcbiAgICAgICAgICAgIChAdG9rZW5zW2kgLSAxXS5uZXdMaW5lIG9yIEB0b2tlbnNbaSAtIDFdWzBdIGlzICdPVVRERU5UJylcblxuICAgICAgICBhY3Rpb24gPSAodG9rZW4sIGkpIC0+XG4gICAgICAgICAgICBAdG9rZW5zLnNwbGljZSAoaWYgQHRhZyhpIC0gMSkgaXMgJywnIHRoZW4gaSAtIDEgZWxzZSBpKSwgMCwgb3V0ZGVudFxuXG4gICAgICAgIEBzY2FuVG9rZW5zICh0b2tlbiwgaSwgdG9rZW5zKSAtPlxuICAgICAgICAgICAgW3RhZ10gPSB0b2tlblxuICAgICAgICAgICAgaWYgdGFnIGlzICdURVJNSU5BVE9SJ1xuICAgICAgICAgICAgICAgIGlmIEB0YWcoaSArIDEpIGluIFsnRUxTRScgJ01FVEFfRUxTRSddIGFuZCBAdGFnKGkgLSAxKSAhPSAnT1VUREVOVCdcbiAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpLCAxLCBAaW5kZW50YXRpb24oKS4uLlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMVxuICAgICAgICAgICAgICAgIGlmIEB0YWcoaSArIDEpIGluIEVYUFJFU1NJT05fQ0xPU0VcbiAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpLCAxXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgICAgICBpZiB0YWcgaXMgJ0NBVENIJ1xuICAgICAgICAgICAgICAgIGZvciBqIGluIFsxLi4yXSB3aGVuIEB0YWcoaSArIGopIGluIFsnT1VUREVOVCcgJ1RFUk1JTkFUT1InICdGSU5BTExZJ11cbiAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpICsgaiwgMCwgQGluZGVudGF0aW9uKCkuLi5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDIgKyBqXG4gICAgICAgICAgICBpZiB0YWcgaW4gU0lOR0xFX0xJTkVSUyBhbmQgQHRhZyhpICsgMSkgIT0gJ0lOREVOVCcgYW5kIG5vdCAodGFnIGlzICdFTFNFJyBhbmQgQHRhZyhpICsgMSkgaXMgJ0lGJykgYW5kIG5vdCAodGFnIGlzICdNRVRBX0VMU0UnIGFuZCBAdGFnKGkgKyAxKSBpcyAnTUVUQV9JRicpXG4gICAgICAgICAgICAgICAgc3RhcnRlciA9IHRhZ1xuICAgICAgICAgICAgICAgIFtpbmRlbnQsIG91dGRlbnRdID0gQGluZGVudGF0aW9uIHRva2Vuc1tpXVxuICAgICAgICAgICAgICAgIGluZGVudC5mcm9tVGhlbiAgID0gdHJ1ZSBpZiBzdGFydGVyIGlzICdUSEVOJ1xuICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSArIDEsIDAsIGluZGVudFxuICAgICAgICAgICAgICAgIEBkZXRlY3RFbmQgaSArIDIsIGNvbmRpdGlvbiwgYWN0aW9uXG4gICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpLCAxIGlmIHRhZyBpcyAnVEhFTidcbiAgICAgICAgICAgICAgICByZXR1cm4gMVxuICAgICAgICAgICAgcmV0dXJuIDFcblxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAwMDAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAgICAgMDAwICAgIDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICAjIFRhZyBwb3N0Zml4IGNvbmRpdGlvbmFscyBhcyBzdWNoLCBzbyB0aGF0IHdlIGNhbiBwYXJzZSB0aGVtIHdpdGggYVxuICAgICMgZGlmZmVyZW50IHByZWNlZGVuY2UuXG4gICAgXG4gICAgdGFnUG9zdGZpeENvbmRpdGlvbmFsczogLT5cblxuICAgICAgICBvcmlnaW5hbCA9IG51bGxcblxuICAgICAgICBjb25kaXRpb24gPSAodG9rZW4sIGkpIC0+XG4gICAgICAgICAgICBbdGFnXSA9IHRva2VuXG4gICAgICAgICAgICBbcHJldlRhZ10gPSBAdG9rZW5zW2kgLSAxXVxuICAgICAgICAgICAgdGFnIGlzICdURVJNSU5BVE9SJyBvciAodGFnIGlzICdJTkRFTlQnIGFuZCBwcmV2VGFnIG5vdCBpbiBTSU5HTEVfTElORVJTKVxuXG4gICAgICAgIGFjdGlvbiA9ICh0b2tlbiwgaSkgLT5cbiAgICAgICAgICAgIGlmIHRva2VuWzBdIG5vdCBpbiBbJ0lOREVOVCddIG9yICh0b2tlbi5nZW5lcmF0ZWQgYW5kIG5vdCB0b2tlbi5mcm9tVGhlbilcbiAgICAgICAgICAgICAgICBvcmlnaW5hbFswXSA9ICdQT1NUXycgKyBvcmlnaW5hbFswXVxuXG4gICAgICAgIEBzY2FuVG9rZW5zICh0b2tlbiwgaSkgLT5cbiAgICAgICAgICAgIHJldHVybiAxIHVubGVzcyB0b2tlblswXSBpbiBbJ0lGJywgJ01FVEFfSUYnXVxuICAgICAgICAgICAgb3JpZ2luYWwgPSB0b2tlblxuICAgICAgICAgICAgQGRldGVjdEVuZCBpICsgMSwgY29uZGl0aW9uLCBhY3Rpb25cbiAgICAgICAgICAgIHJldHVybiAxXG5cbiAgICAjIEdlbmVyYXRlIHRoZSBpbmRlbnRhdGlvbiB0b2tlbnMsIGJhc2VkIG9uIGFub3RoZXIgdG9rZW4gb24gdGhlIHNhbWUgbGluZS5cbiAgICBcbiAgICBpbmRlbnRhdGlvbjogKG9yaWdpbikgLT5cbiAgICAgICAgXG4gICAgICAgIGluZGVudCAgPSBbJ0lOREVOVCcsIDRdXG4gICAgICAgIG91dGRlbnQgPSBbJ09VVERFTlQnLCA0XVxuICAgICAgICBpZiBvcmlnaW5cbiAgICAgICAgICAgIGluZGVudC5nZW5lcmF0ZWQgPSBvdXRkZW50LmdlbmVyYXRlZCA9IHllc1xuICAgICAgICAgICAgaW5kZW50Lm9yaWdpbiA9IG91dGRlbnQub3JpZ2luID0gb3JpZ2luXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGluZGVudC5leHBsaWNpdCA9IG91dGRlbnQuZXhwbGljaXQgPSB5ZXNcbiAgICAgICAgW2luZGVudCwgb3V0ZGVudF1cblxuICAgICMgQ3JlYXRlIGEgZ2VuZXJhdGVkIHRva2VuOiBvbmUgdGhhdCBleGlzdHMgZHVlIHRvIGEgdXNlIG9mIGltcGxpY2l0IHN5bnRheC5cbiAgICBcbiAgICBAZ2VuZXJhdGU6ICh0YWcsIHZhbHVlLCBvcmlnaW4pIC0+XG4gICAgICAgIHRvayA9IFt0YWcsIHZhbHVlXVxuICAgICAgICB0b2suZ2VuZXJhdGVkID0geWVzXG4gICAgICAgIHRvay5vcmlnaW4gPSBvcmlnaW4gaWYgb3JpZ2luXG4gICAgICAgIHRva1xuICAgICAgICBcbiAgICBnZW5lcmF0ZTogUmV3cml0ZXIuZ2VuZXJhdGVcblxuICAgIHRhZzogKGkpIC0+IEB0b2tlbnNbaV0/WzBdICMgTG9vayB1cCBhIHRhZyBieSB0b2tlbiBpbmRleC5cblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgICAgICAgMDAwICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG5cbiMgTGlzdCBvZiB0aGUgdG9rZW4gcGFpcnMgdGhhdCBtdXN0IGJlIGJhbGFuY2VkLlxuXG5CQUxBTkNFRF9QQUlSUyA9IFtcbiAgICBbJygnJyknXVxuICAgIFsnWycnXSddXG4gICAgWyd7Jyd9J11cbiAgICBbJ0lOREVOVCcnT1VUREVOVCddLFxuICAgIFsnQ0FMTF9TVEFSVCcnQ0FMTF9FTkQnXVxuICAgIFsnUEFSQU1fU1RBUlQnJ1BBUkFNX0VORCddXG4gICAgWydJTkRFWF9TVEFSVCcnSU5ERVhfRU5EJ11cbiAgICBbJ1NUUklOR19TVEFSVCcnU1RSSU5HX0VORCddXG4gICAgWydSRUdFWF9TVEFSVCcnUkVHRVhfRU5EJ11cbl1cblxuIyBUaGUgaW52ZXJzZSBtYXBwaW5ncyBvZiBgQkFMQU5DRURfUEFJUlNgIHdlJ3JlIHRyeWluZyB0byBmaXggdXAsIHNvIHdlIGNhbiBsb29rIHRoaW5ncyB1cCBmcm9tIGVpdGhlciBlbmQuXG5cbiMgVGhlIHRva2VucyB0aGF0IHNpZ25hbCB0aGUgc3RhcnQvZW5kIG9mIGEgYmFsYW5jZWQgcGFpci5cbkVYUFJFU1NJT05fU1RBUlQgPSBbXVxuRVhQUkVTU0lPTl9FTkQgICA9IFtdXG5cbklOVkVSU0VTID0ge31cbmZvciBbbGVmdCwgcml0ZV0gaW4gQkFMQU5DRURfUEFJUlNcbiAgICBFWFBSRVNTSU9OX1NUQVJULnB1c2ggSU5WRVJTRVNbcml0ZV0gPSBsZWZ0XG4gICAgRVhQUkVTU0lPTl9FTkQgIC5wdXNoIElOVkVSU0VTW2xlZnRdID0gcml0ZVxuXG5SZXdyaXRlci5JTlZFUlNFUyA9IElOVkVSU0VTXG4gICAgXG4jIFRva2VucyB0aGF0IGluZGljYXRlIHRoZSBjbG9zZSBvZiBhIGNsYXVzZSBvZiBhbiBleHByZXNzaW9uLlxuRVhQUkVTU0lPTl9DTE9TRSA9IFsnQ0FUQ0gnICdUSEVOJyAnRUxTRScgJ01FVEFfRUxTRScgJ0ZJTkFMTFknXS5jb25jYXQgRVhQUkVTU0lPTl9FTkRcblxuIyBUb2tlbnMgdGhhdCwgaWYgZm9sbG93ZWQgYnkgYW4gYElNUExJQ0lUX0NBTExgLCBpbmRpY2F0ZSBhIGZ1bmN0aW9uIGludm9jYXRpb24uXG5JTVBMSUNJVF9GVU5DID0gWydJREVOVElGSUVSJyAnUFJPUEVSVFknICdTVVBFUicgJyknICdDQUxMX0VORCcgJ10nICdJTkRFWF9FTkQnICdAJyAnVEhJUyddXG5cbiMgSWYgcHJlY2VkZWQgYnkgYW4gYElNUExJQ0lUX0ZVTkNgLCBpbmRpY2F0ZXMgYSBmdW5jdGlvbiBpbnZvY2F0aW9uLlxuSU1QTElDSVRfQ0FMTCA9IFtcbiAgICAnSURFTlRJRklFUicgJ1BST1BFUlRZJyAnTlVNQkVSJyAnSU5GSU5JVFknICdOQU4nXG4gICAgJ1NUUklORycgJ1NUUklOR19TVEFSVCcgJ1JFR0VYJyAnUkVHRVhfU1RBUlQnICdKUydcbiAgICAnTkVXJyAnUEFSQU1fU1RBUlQnICdDTEFTUycgJ0lGJyAnTUVUQV9JRicsICdUUlknICdTV0lUQ0gnICdUSElTJ1xuICAgICdVTkRFRklORUQnICdOVUxMJyAnQk9PTCdcbiAgICAnVU5BUlknICdZSUVMRCcgJ1VOQVJZX01BVEgnICdTVVBFUicgJ1RIUk9XJ1xuICAgICdAJyAnLT4nICc9PicgJ1snICcoJyAneycgJy0tJyAnKysnXG5dXG5cbklNUExJQ0lUX1VOU1BBQ0VEX0NBTEwgPSBbJysnICctJ11cblxuIyBUb2tlbnMgdGhhdCBhbHdheXMgbWFyayB0aGUgZW5kIG9mIGFuIGltcGxpY2l0IGNhbGwgZm9yIHNpbmdsZS1saW5lcnMuXG5JTVBMSUNJVF9FTkQgPSBbJ1BPU1RfSUYnICdQT1NUX01FVEFfSUYnICdGT1InICdXSElMRScgJ1VOVElMJyAnV0hFTicgJ0JZJyAnTE9PUCcgJ1RFUk1JTkFUT1InXVxuXG4jIFNpbmdsZS1saW5lIGZsYXZvcnMgb2YgYmxvY2sgZXhwcmVzc2lvbnMgdGhhdCBoYXZlIHVuY2xvc2VkIGVuZGluZ3MuXG4jIFRoZSBncmFtbWFyIGNhbid0IGRpc2FtYmlndWF0ZSB0aGVtLCBzbyB3ZSBpbnNlcnQgdGhlIGltcGxpY2l0IGluZGVudGF0aW9uLlxuU0lOR0xFX0xJTkVSUyAgPSBbJ0VMU0UnICdNRVRBX0VMU0UnICctPicgJz0+JyAnVFJZJyAnRklOQUxMWScgJ1RIRU4nXVxuU0lOR0xFX0NMT1NFUlMgPSBbJ1RFUk1JTkFUT1InICdDQVRDSCcgJ0ZJTkFMTFknICdFTFNFJyAnTUVUQV9FTFNFJyAnT1VUREVOVCcgJ0xFQURJTkdfV0hFTiddXG5cbiMgVG9rZW5zIHRoYXQgZW5kIGEgbGluZS5cbkxJTkVCUkVBS1MgPSBbJ1RFUk1JTkFUT1InICdJTkRFTlQnICdPVVRERU5UJ11cblxuIyBUb2tlbnMgdGhhdCBjbG9zZSBvcGVuIGNhbGxzIHdoZW4gdGhleSBmb2xsb3cgYSBuZXdsaW5lLlxuQ0FMTF9DTE9TRVJTID0gWycuJyAnPy4nICc6OicgJz86OiddXG5cbm1vZHVsZS5leHBvcnRzID0gUmV3cml0ZXJcbiJdfQ==
//# sourceURL=../coffee/rewriter.coffee