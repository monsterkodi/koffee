// koffee 1.3.0

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
                if (this.check(i, ['NUMBER', 'STRING', 'NULL', 'UNDEFINED', 'BOOL', 'STRING_END', '}'], i + 1, ['NUMBER', 'STRING', 'NULL', 'UNDEFINED', 'BOOL', 'STRING_START', 'PARAM_START', 'IDENTIFIER', 'PROPERTY', '{', '(', '[', '->', '=>', '@', 'UNARY'])) {
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
                    if ((ref3 = this.tag(i - 1)) !== 'META_IF') {
                        if (ref4 = token[1], indexOf.call(Object.keys(this.opts.meta), ref4) >= 0) {
                            meta = this.opts.meta[token[1]];
                            tokens.splice(i, 0, this.generate('META_IF', 'if'));
                            tokens[i].spaced = true;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmV3cml0ZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHdQQUFBO0lBQUE7OztBQVFFLGFBQWUsT0FBQSxDQUFRLFlBQVI7O0FBU1g7Ozt1QkFPRixPQUFBLEdBQVMsU0FBQyxPQUFELEVBQVUsSUFBVjtRQUFDLElBQUMsQ0FBQSxTQUFEO1FBQVMsSUFBQyxDQUFBLE9BQUQ7UUFFZixJQUFDLENBQUEscUJBQUQsQ0FBQTtRQUVBLElBQUMsQ0FBQSxTQUFELENBQUE7UUFFQSxJQUFDLENBQUEsY0FBRCxDQUFBO1FBQ0EsSUFBQyxDQUFBLGdCQUFELENBQUE7UUFDQSxJQUFDLENBQUEsY0FBRCxDQUFBO1FBQ0EsSUFBQyxDQUFBLHNCQUFELENBQUE7UUFDQSxJQUFDLENBQUEsMEJBQUQsQ0FBQTtRQUVBLElBQXVCLFVBQUEsQ0FBVyxJQUFDLENBQUEsSUFBWixFQUFrQixtQkFBbEIsQ0FBdkI7WUFBQSxJQUFDLENBQUEsZ0JBQUQsQ0FBQSxFQUFBOztRQUNBLElBQXVCLFVBQUEsQ0FBVyxJQUFDLENBQUEsSUFBWixFQUFrQixnQkFBbEIsQ0FBdkI7WUFBQSxJQUFDLENBQUEsYUFBRCxDQUFBLEVBQUE7O1FBRUEsSUFBQyxDQUFBLGdDQUFELENBQUE7UUFDQSxJQUFDLENBQUEsc0JBQUQsQ0FBQTtlQUNBLElBQUMsQ0FBQTtJQWpCSTs7dUJBd0JULFVBQUEsR0FBWSxTQUFDLEtBQUQ7QUFFUixZQUFBO1FBQUMsU0FBVTtRQUNYLENBQUEsR0FBSTtBQUNtQyxlQUFNLEtBQUEsR0FBUSxNQUFPLENBQUEsQ0FBQSxDQUFyQjtZQUF2QyxDQUFBLElBQUssS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFYLEVBQWlCLEtBQWpCLEVBQXdCLENBQXhCLEVBQTJCLE1BQTNCO1FBQWtDO2VBQ3ZDO0lBTFE7O3VCQU9aLFNBQUEsR0FBVyxTQUFDLENBQUQsRUFBSSxTQUFKLEVBQWUs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ZixhQUFBLEdBQWlCLENBQUMsTUFBRCxFQUFRLFdBQVIsRUFBb0IsSUFBcEIsRUFBeUIsSUFBekIsRUFBOEIsS0FBOUIsRUFBb0MsU0FBcEMsRUFBOEMsTUFBOUM7O0FBQ2pCLGNBQUEsR0FBaUIsQ0FBQyxZQUFELEVBQWMsT0FBZCxFQUFzQixTQUF0QixFQUFnQyxNQUFoQyxFQUF1QyxXQUF2QyxFQUFtRCxTQUFuRCxFQUE2RCxjQUE3RDs7QUFHakIsVUFBQSxHQUFhLENBQUMsWUFBRCxFQUFjLFFBQWQsRUFBdUIsU0FBdkI7O0FBR2IsWUFBQSxHQUFlLENBQUMsR0FBRCxFQUFLLElBQUwsRUFBVSxJQUFWLEVBQWUsS0FBZjs7QUFFZixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbjAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4wMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbjAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4jIyNcblxueyBoYXNGZWF0dXJlIH0gPSByZXF1aXJlICcuL2ZlYXR1cmVzJ1xuXG4jIFRoZSBsYW5ndWFnZSBoYXMgYSBnb29kIGRlYWwgb2Ygb3B0aW9uYWwsIGltcGxpY2l0IGFuZCBzaG9ydGhhbmQgc3ludGF4LiBcbiMgVGhpcyBjYW4gZ3JlYXRseSBjb21wbGljYXRlIGEgZ3JhbW1hciBhbmQgYmxvYXQgdGhlIHJlc3VsdGluZyBwYXJzZSB0YWJsZS4gXG4jIEluc3RlYWQgb2YgbWFraW5nIHRoZSBwYXJzZXIgaGFuZGxlIGl0IGFsbCwgd2UgdGFrZSBhIHNlcmllcyBvZiBwYXNzZXMgb3ZlciB0aGUgdG9rZW4gc3RyZWFtLCBcbiMgdXNpbmcgdGhpcyBSZXdyaXRlciB0byBjb252ZXJ0IHNob3J0aGFuZCBpbnRvIHRoZSB1bmFtYmlndW91cyBsb25nIGZvcm0sIFxuIyBhZGQgaW1wbGljaXQgaW5kZW50YXRpb24gYW5kIHBhcmVudGhlc2VzLCBhbmQgZ2VuZXJhbGx5IGNsZWFuIHRoaW5ncyB1cC5cbiMgVGhlIFJld3JpdGVyIGlzIHVzZWQgYnkgdGhlIExleGVyLCBkaXJlY3RseSBhZ2FpbnN0IGl0cyBpbnRlcm5hbCBhcnJheSBvZiB0b2tlbnMuXG5cbmNsYXNzIFJld3JpdGVyXG5cbiAgICAjIFJld3JpdGUgdGhlIHRva2VuIHN0cmVhbSBpbiBtdWx0aXBsZSBwYXNzZXMsIG9uZSBsb2dpY2FsIGZpbHRlciBhdCBhIHRpbWUuIFxuICAgICMgVGhpcyBjb3VsZCBjZXJ0YWlubHkgYmUgY2hhbmdlZCBpbnRvIGEgc2luZ2xlIHBhc3MgdGhyb3VnaCB0aGUgc3RyZWFtLCB3aXRoIGEgYmlnIHN3aXRjaCwgXG4gICAgIyBidXQgaXQncyBtdWNoIG5pY2VyIHRvIHdvcmsgd2l0aCBsaWtlIHRoaXMuIFxuICAgICMgVGhlIG9yZGVyIG9mIHRoZXNlIHBhc3NlcyBtYXR0ZXJzIC0tIGluZGVudGF0aW9uIG11c3QgYmUgY29ycmVjdGVkIGJlZm9yZSBpbXBsaWNpdCBwYXJlbnRoZXNlcyBjYW4gYmUgd3JhcHBlZCBhcm91bmQgYmxvY2tzIG9mIGNvZGUuXG4gICAgXG4gICAgcmV3cml0ZTogKEB0b2tlbnMsIEBvcHRzKSAtPlxuICAgICAgICBcbiAgICAgICAgQHJlbW92ZUxlYWRpbmdOZXdsaW5lcygpXG4gICAgICAgIFxuICAgICAgICBAc2hvcnRjdXRzKCkgIyBrb2ZmZWVcbiAgICAgICAgXG4gICAgICAgIEBjbG9zZU9wZW5DYWxscygpXG4gICAgICAgIEBjbG9zZU9wZW5JbmRleGVzKClcbiAgICAgICAgQG5vcm1hbGl6ZUxpbmVzKClcbiAgICAgICAgQHRhZ1Bvc3RmaXhDb25kaXRpb25hbHMoKVxuICAgICAgICBAYWRkSW1wbGljaXRCcmFjZXNBbmRQYXJlbnMoKVxuICAgICAgICBcbiAgICAgICAgQGNvbmZpZ1BhcmFtZXRlcnMoKSBpZiBoYXNGZWF0dXJlIEBvcHRzLCAnY29uZmlnX3BhcmFtZXRlcnMnICMga29mZmVlXG4gICAgICAgIEBuZWdhdGl2ZUluZGV4KCkgICAgaWYgaGFzRmVhdHVyZSBAb3B0cywgJ25lZ2F0aXZlX2luZGV4JyAgICAjIGtvZmZlZVxuICAgICAgICBcbiAgICAgICAgQGFkZExvY2F0aW9uRGF0YVRvR2VuZXJhdGVkVG9rZW5zKClcbiAgICAgICAgQGZpeE91dGRlbnRMb2NhdGlvbkRhdGEoKSAgIFxuICAgICAgICBAdG9rZW5zXG5cbiAgICAjIFJld3JpdGUgdGhlIHRva2VuIHN0cmVhbSwgbG9va2luZyBvbmUgdG9rZW4gYWhlYWQgYW5kIGJlaGluZC5cbiAgICAjIEFsbG93IHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIGJsb2NrIHRvIHRlbGwgdXMgaG93IG1hbnkgdG9rZW5zIHRvIG1vdmVcbiAgICAjIGZvcndhcmRzIChvciBiYWNrd2FyZHMpIGluIHRoZSBzdHJlYW0sIHRvIG1ha2Ugc3VyZSB3ZSBkb24ndCBtaXNzIGFueXRoaW5nXG4gICAgIyBhcyB0b2tlbnMgYXJlIGluc2VydGVkIGFuZCByZW1vdmVkLCBhbmQgdGhlIHN0cmVhbSBjaGFuZ2VzIGxlbmd0aCB1bmRlciBvdXIgZmVldC5cbiAgICBcbiAgICBzY2FuVG9rZW5zOiAoYmxvY2spIC0+XG4gICAgICAgIFxuICAgICAgICB7dG9rZW5zfSA9IHRoaXNcbiAgICAgICAgaSA9IDBcbiAgICAgICAgaSArPSBibG9jay5jYWxsIHRoaXMsIHRva2VuLCBpLCB0b2tlbnMgd2hpbGUgdG9rZW4gPSB0b2tlbnNbaV1cbiAgICAgICAgdHJ1ZVxuXG4gICAgZGV0ZWN0RW5kOiAoaSwgY29uZGl0aW9uLCBhY3Rpb24pIC0+XG4gICAgICAgIFxuICAgICAgICB7dG9rZW5zfSA9IHRoaXNcbiAgICAgICAgbGV2ZWxzID0gMFxuICAgICAgICB3aGlsZSB0b2tlbiA9IHRva2Vuc1tpXVxuICAgICAgICAgICAgcmV0dXJuIGFjdGlvbi5jYWxsIHRoaXMsIHRva2VuLCBpIGlmIGxldmVscyBpcyAwIGFuZCBjb25kaXRpb24uY2FsbCB0aGlzLCB0b2tlbiwgaVxuICAgICAgICAgICAgcmV0dXJuIGFjdGlvbi5jYWxsIHRoaXMsIHRva2VuLCBpIC0gMSBpZiBub3QgdG9rZW4gb3IgbGV2ZWxzIDwgMFxuICAgICAgICAgICAgaWYgdG9rZW5bMF0gaW4gRVhQUkVTU0lPTl9TVEFSVFxuICAgICAgICAgICAgICAgIGxldmVscyArPSAxXG4gICAgICAgICAgICBlbHNlIGlmIHRva2VuWzBdIGluIEVYUFJFU1NJT05fRU5EXG4gICAgICAgICAgICAgICAgbGV2ZWxzIC09IDFcbiAgICAgICAgICAgIGkgKz0gMVxuICAgICAgICBpIC0gMVxuXG4gICAgIyBMZWFkaW5nIG5ld2xpbmVzIHdvdWxkIGludHJvZHVjZSBhbiBhbWJpZ3VpdHkgaW4gdGhlIGdyYW1tYXIsIHNvIHdlIGRpc3BhdGNoIHRoZW0gaGVyZS5cbiAgICBcbiAgICByZW1vdmVMZWFkaW5nTmV3bGluZXM6IC0+XG4gICAgICAgIFxuICAgICAgICBicmVhayBmb3IgW3RhZ10sIGkgaW4gQHRva2VucyB3aGVuIHRhZyAhPSAnVEVSTUlOQVRPUidcbiAgICAgICAgQHRva2Vucy5zcGxpY2UgMCwgaSBpZiBpXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuXG4gICAgZG9lc01hdGNoOiAoaW5kZXgsIG1hdGNoKSAtPlxuXG4gICAgICAgIGlmIHR5cGVvZihtYXRjaCkgPT0gJ3N0cmluZydcbiAgICAgICAgICAgIEB0YWcoaW5kZXgpID09IG1hdGNoXG4gICAgICAgIGVsc2UgaWYgbWF0Y2guY29uc3RydWN0b3IgPT0gT2JqZWN0XG4gICAgICAgICAgICB0ID0gQHRva2Vuc1tpbmRleF1cbiAgICAgICAgICAgIGtleSA9IE9iamVjdC5rZXlzKG1hdGNoKVswXVxuICAgICAgICAgICAgdmFsID0gbWF0Y2hba2V5XVxuICAgICAgICAgICAgdFswXSA9PSBrZXkgYW5kIHRbMV0gPT0gdmFsXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGZhbHNlXG4gICAgXG4gICAgY2hlY2s6IC0+IFxuICAgICAgICAgICAgICAgIFxuICAgICAgICBsID0gYXJndW1lbnRzXG4gICAgICAgIGZvciBqIGluIFswLi4ubC5sZW5ndGhdIGJ5IDJcbiAgICAgICAgICAgIGluZGV4ID0gbFtqXVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlIGlmIGluZGV4IDwgMFxuICAgICAgICAgICAgaWYgbFtqKzFdIGluc3RhbmNlb2YgQXJyYXlcbiAgICAgICAgICAgICAgICBmb3VuZCA9IGZhbHNlXG4gICAgICAgICAgICAgICAgZm9yIGUgaW4gbFtqKzFdXG4gICAgICAgICAgICAgICAgICAgIGlmIEBkb2VzTWF0Y2ggaW5kZXgsIGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICBpZiBub3QgZm91bmRcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaWYgbm90IEBkb2VzTWF0Y2ggaW5kZXgsIGxbaisxXVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgdHJ1ZVxuICAgICAgICBcbiAgICBmaW5kTWF0Y2hpbmdUYWdCYWNrd2FyZHM6IChjbG9zZSwgaSwgY2hlY2spIC0+IFxuICAgICAgICBcbiAgICAgICAgb3BlbiA9IHsgUEFSQU1fRU5EOidQQVJBTV9TVEFSVCcsICddJzonWycsICd9JzoneycgfVtjbG9zZV1cbiAgICAgICAgd2FybiBcImNhbnQgbWF0Y2ggI3tjbG9zZX1cIiBpZiBub3Qgb3BlblxuICAgICAgICBwdXNoZWQgPSAwXG4gICAgICAgIGogPSBpXG4gICAgICAgIHdoaWxlIGotLSAjIHdhbGsgYmFja3dhcmRzIHVudGlsIG1hdGNoaW5nIHRhZyBpcyBmb3VuZFxuICAgICAgICAgICAgY3VycmVudCA9IEB0YWcoailcbiAgICAgICAgICAgIGlmIGN1cnJlbnQgPT0gY2xvc2VcbiAgICAgICAgICAgICAgICBwdXNoZWQrK1xuICAgICAgICAgICAgZWxzZSBpZiBjdXJyZW50ID09IG9wZW5cbiAgICAgICAgICAgICAgICBpZiBwdXNoZWRcbiAgICAgICAgICAgICAgICAgICAgcHVzaGVkLS1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIHB1c2hlZCA9PSAwICMgbWF0Y2hpbmcgYnJhY2tldCBmb3VuZFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5kZXg6alxuICAgICAgICAgICAgZWxzZSBpZiBjaGVjaz8gYW5kIG5vdCBjaGVjayBjdXJyZW50IFxuICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgaW5kZXg6LTFcblxuICAgIGZpbmRNYXRjaGluZ1RhZ0ZvcndhcmRzOiAob3BlbiwgaSwgY2hlY2spIC0+IFxuICAgICAgICBcbiAgICAgICAgY2xvc2UgPSB7IFNUUklOR19TVEFSVDonU1RSSU5HX0VORCcgfVtvcGVuXVxuICAgICAgICB3YXJuIFwiY2FudCBtYXRjaCAje29wZW59XCIgaWYgbm90IGNsb3NlXG4gICAgICAgIHB1c2hlZCA9IDBcbiAgICAgICAgaiA9IGlcbiAgICAgICAgd2hpbGUgKytqIDwgQHRva2Vucy5sZW5ndGggIyB3YWxrIGZvcndhcmQgdW50aWwgbWF0Y2hpbmcgdGFnIGlzIGZvdW5kXG4gICAgICAgICAgICBjdXJyZW50ID0gQHRhZyhqKVxuICAgICAgICAgICAgIyBsb2cgXCJjdXJyZW50ICN7an0gI3tjdXJyZW50fVwiXG4gICAgICAgICAgICBpZiBjdXJyZW50ID09IG9wZW5cbiAgICAgICAgICAgICAgICBwdXNoZWQrK1xuICAgICAgICAgICAgZWxzZSBpZiBjdXJyZW50ID09IGNsb3NlXG4gICAgICAgICAgICAgICAgaWYgcHVzaGVkXG4gICAgICAgICAgICAgICAgICAgIHB1c2hlZC0tXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBwdXNoZWQgPT0gMCAjIG1hdGNoaW5nIGJyYWNrZXQgZm91bmRcbiAgICAgICAgICAgICAgICAgICAgIyBsb2cgJ0ZPVU5EJ1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5kZXg6alxuICAgICAgICAgICAgZWxzZSBpZiBjaGVjaz8gYW5kIG5vdCBjaGVjayBjdXJyZW50IFxuICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgaW5kZXg6LTFcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgICAgICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIHNob3J0Y3V0czogLT5cbiAgICAgICAgXG4gICAgICAgIEBzY2FuVG9rZW5zICh0b2tlbiwgaSwgdG9rZW5zKSAtPlxuXG4gICAgICAgICAgICBpZiBoYXNGZWF0dXJlIEBvcHRzLCAnY29uc3RydWN0b3Jfc2hvcnRjdXQnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgQGNoZWNrIGktMSwgJ0AnLCBpLCAnOicsIGkrMSwgWyctPicgJ1BBUkFNX1NUQVJUJyAnSURFTlRJRklFUiddXG4gICAgICAgICAgICAgICAgICAgIHRva2Vuc1tpLTFdWzBdID0gJ1BST1BFUlRZJ1xuICAgICAgICAgICAgICAgICAgICB0b2tlbnNbaS0xXVsxXSA9ICdjb25zdHJ1Y3RvcidcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDFcbiAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGhhc0ZlYXR1cmUgQG9wdHMsICdjb25zb2xlX3Nob3J0Y3V0J1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgQGNoZWNrIGksIFt7SURFTlRJRklFUjonbG9nJ30ge0lERU5USUZJRVI6J3dhcm4nfSB7SURFTlRJRklFUjonZXJyb3InfV0sIGkrMSwgWydOVU1CRVInICdJREVOVElGSUVSJyAnUFJPUEVSVFknICdTVFJJTkcnICdTVFJJTkdfU1RBUlQnICdDQUxMX1NUQVJUJyAnSUYnICdNRVRBX0lGJyAnWycgJygnICd7JyAnQCddXG4gICAgICAgICAgICAgICAgICAgIHRva2VuWzBdID0gJ1BST1BFUlRZJ1xuICAgICAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGksIDAsIEBnZW5lcmF0ZSgnSURFTlRJRklFUicnY29uc29sZScgdG9rZW4pLCBAZ2VuZXJhdGUoJy4nJy4nIHRva2VuKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gM1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGhhc0ZlYXR1cmUgQG9wdHMsICdvcHRpb25hbF9jb21tYXRhJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIEBjaGVjayBpLCBbJ05VTUJFUicnU1RSSU5HJydOVUxMJydVTkRFRklORUQnJ0JPT0wnJ1NUUklOR19FTkQnJ30nXSwgaSsxLCBbJ05VTUJFUicnU1RSSU5HJydOVUxMJydVTkRFRklORUQnJ0JPT0wnJ1NUUklOR19TVEFSVCcnUEFSQU1fU1RBUlQnJ0lERU5USUZJRVInJ1BST1BFUlRZJyd7JycoJydbJyctPicnPT4nJ0AnJ1VOQVJZJ11cbiAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpKzEsIDAsIEBnZW5lcmF0ZSAnLCcnLCdcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDJcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgQHRhZyhpKSBpbiBbJ10nXSBhbmQgdG9rZW5zW2ldLnNwYWNlZCBhbmQgQHRhZyhpKzEpIGluIFsnTlVNQkVSJydTVFJJTkcnJ1NUUklOR19TVEFSVCcnSURFTlRJRklFUicnUFJPUEVSVFknJ3snJygnJ1snXSAgXG4gICAgICAgICAgICAgICAgICAgIG1hdGNoID0gQGZpbmRNYXRjaGluZ1RhZ0JhY2t3YXJkcyBAdGFnKGkpLCBpLCAodGFnKSAtPiB0YWcgaW4gWydOVU1CRVInJ1NUUklORycnUFJPUEVSVFknJzonJywnXVxuICAgICAgICAgICAgICAgICAgICBpZiBtYXRjaC5pbmRleCA+PSAwXG4gICAgICAgICAgICAgICAgICAgICAgICAjIGluc2VydCBjb21tYSBpZiBtYXRjaGluZyBicmFja2V0IGlzIG5vdCBwcmVjZWRlZCBieSBpZGVudGlmaWVyIG9yIGVuZCBvZiBjYWxsXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBtYXRjaC5pbmRleCA9PSAwIG9yIEB0YWcobWF0Y2guaW5kZXgtMSkgbm90IGluIFsnSURFTlRJRklFUicnQ0FMTF9FTkQnXSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGkrMSwgMCwgQGdlbmVyYXRlICcsJycsJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBoYXNGZWF0dXJlIEBvcHRzLCAnbWV0YSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIEBjaGVjayBpLCBbVU5BUllfTUFUSDonfiddLCBpKzEsIFtDT01QQVJFOic+J10sIGkrMiwgWydJREVOVElGSUVSJydJRicnVEhFTicnRUxTRSddXG4gICAgICAgICAgICAgICAgICAgIGlmIEB0YWcoaSsyKSA9PSAnSURFTlRJRklFUidcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHRva2Vuc1tpKzJdWzFdID09ICdlbGlmJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSwgMywgQGdlbmVyYXRlKCdNRVRBX0VMU0UnJ2Vsc2UnKSwgQGdlbmVyYXRlKCdNRVRBX0lGJydpZicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5zW2ldLnNwYWNlZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnNbaSsxXS5zcGFjZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnNbaSsyXVsxXSA9ICfilrgnK3Rva2Vuc1tpKzJdWzFdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5zW2krMl1bMF0gPSAnSURFTlRJRklFUidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGksIDJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMFxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnNbaSsyXVswXSA9ICdNRVRBXycrdG9rZW5zW2krMl1bMF0gaWYgdG9rZW5zW2krMl1bMF0gIT0gJ1RIRU4nXG4gICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGksIDJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgdG9rZW5bMV1bMF0gPT0gJ+KWuCdcbiAgICAgICAgICAgICAgICAgICAgaWYgQHRhZyhpLTEpIG5vdCBpbiBbJ01FVEFfSUYnXVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgdG9rZW5bMV0gaW4gT2JqZWN0LmtleXMgQG9wdHMubWV0YVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGEgPSBAb3B0cy5tZXRhW3Rva2VuWzFdXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSwgMCwgQGdlbmVyYXRlICdNRVRBX0lGJydpZidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnNbaV0uc3BhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkdiA9IDJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBAdGFnKGkrYWR2KSA9PSAnQ0FMTF9TVEFSVCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgQHRhZyhpK2FkdisrKSBub3QgaW4gWydDQUxMX0VORCcnKScnVEVSTUlOQVRPUiddXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciBhIGluIFswLi4uKG1ldGEuaW5mbz8uYXJncyA/IDEpXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgQHRhZyhpK2FkdikgaW4gWydOVU1CRVInJ1NUUklORyddXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJnKysgIyBhcmd1bWVudCBmb3VuZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkdisrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIEB0YWcoaSthZHYpID09ICdTVFJJTkdfU1RBUlQnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2ggPSBAZmluZE1hdGNoaW5nVGFnRm9yd2FyZHMgQHRhZyhpK2FkdiksIGkrYWR2XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgbWF0Y2guaW5kZXggPj0gMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmcrKyAjIHN0cmluZyBpbnRlcnBvbGF0aW9uIGFyZ3VtZW50IGZvdW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkdis9IG1hdGNoLmluZGV4IC0gaSAtIDEgIyBjYW4gd2UgYWR2YW5jZSBvdmVyIHRoZSB3aG9sZSBpbnRlcnBvbGF0aW9uPyBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2cgJ21hdGNoIGluZGV4JywgbWF0Y2gsIEB0YWcoaSthZHYpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgYXJnID09IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSthZHYsIDAsIEBnZW5lcmF0ZSgnQ0FMTF9TVEFSVCcnKCcpLCBAZ2VuZXJhdGUoJ0NBTExfRU5EJycpJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkdiArPSAyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgbWV0YS5pbmZvPy50aGVuIG9yIEB0YWcoaSthZHYpIG5vdCBpbiBbJ1RFUk1JTkFUT1InJ0lOREVOVCcnQ0FMTF9TVEFSVCddXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSthZHYrKywgMCwgQGdlbmVyYXRlICdUSEVOJyd0aGVuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhZHZcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIDFcbiAgICBcbiAgICBuZWdhdGl2ZUluZGV4OiAtPlxuXG4gICAgICAgIEBzY2FuVG9rZW5zICh0b2tlbiwgaSwgdG9rZW5zKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBAY2hlY2sgaS0xLCAnSU5ERVhfU1RBUlQnLCBpLCAnLScsIGkrMSwgJ05VTUJFUicsIGkrMiwgJ0lOREVYX0VORCdcbiAgICAgICAgICAgICAgICBpZiBAdGFnKGktMikgaW4gWydJREVOVElGSUVSJydQUk9QRVJUWScnU1RSSU5HJydTVFJJTkdfRU5EJyddJycpJ11cbiAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpKzIsIDAsIEBnZW5lcmF0ZSgnLi4nJy4uJyksIEBnZW5lcmF0ZSh0b2tlbnNbaV1bMF0sIHRva2Vuc1tpXVsxXSksIEBnZW5lcmF0ZSh0b2tlbnNbaSsxXVswXSwgdG9rZW5zW2krMV1bMV0pXG4gICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSs2LCAwLCBAZ2VuZXJhdGUoJ0lOREVYX1NUQVJUJydbJyksIEBnZW5lcmF0ZSgnTlVNQkVSJycwJyksIEBnZW5lcmF0ZSgnSU5ERVhfRU5EJyddJylcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDdcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGxvZyBAdGFnKGktMilcbiAgICAgICAgICAgIDFcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMCAgICAgMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAgICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGNvbmZpZ1BhcmFtZXRlcnM6IC0+XG4gICAgICAgIFxuICAgICAgICBkaWN0UGFyYW1TdGFydCA9IDBcbiAgICAgICAgZGljdFBhcmFtRW5kICAgPSAwXG4gICAgICAgIHN0YWNrQ291bnQgICAgID0gMFxuICAgICAgICBcbiAgICAgICAgaXNJbnNpZGUgPSAtPiBkaWN0UGFyYW1TdGFydCBhbmQgbm90IHN0YWNrQ291bnRcbiAgICAgICAgXG4gICAgICAgIEBzY2FuVG9rZW5zICh0b2tlbiwgaSwgdG9rZW5zKSAtPlxuXG4gICAgICAgICAgICBbdGFnXSAgICAgPSB0b2tlblxuICAgICAgICAgICAgW3ByZXZUYWddID0gcHJldlRva2VuID0gaWYgaSA+IDAgdGhlbiB0b2tlbnNbaSAtIDFdIGVsc2UgW11cbiAgICAgICAgICAgIFtuZXh0VGFnXSA9IGlmIGkgPCB0b2tlbnMubGVuZ3RoIC0gMSB0aGVuIHRva2Vuc1tpICsgMV0gZWxzZSBbXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiB0YWcgaXMgJ3snXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgcHJldlRhZyA9PSAnUEFSQU1fU1RBUlQnIG9yIHByZXZUYWcgbm90IGluIFsnWycsICd7J10gYW5kIEBmaW5kTWF0Y2hpbmdUYWdCYWNrd2FyZHMoJ1BBUkFNX0VORCcsIGkpLmluZGV4ID49IDBcbiAgICAgICAgICAgICAgICAgICAgaWYgbm90IGRpY3RQYXJhbVN0YXJ0XG4gICAgICAgICAgICAgICAgICAgICAgICBkaWN0UGFyYW1TdGFydCA9IGlcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2tDb3VudCsrXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBkaWN0UGFyYW1TdGFydFxuICAgICAgICAgICAgICAgICAgICBzdGFja0NvdW50KytcbiAgICAgICAgICAgIGVsc2UgaWYgdGFnIGlzICd9J1xuICAgICAgICAgICAgICAgIGlmIGRpY3RQYXJhbVN0YXJ0IFxuICAgICAgICAgICAgICAgICAgICBpZiBub3Qgc3RhY2tDb3VudFxuICAgICAgICAgICAgICAgICAgICAgICAgZGljdFBhcmFtRW5kID0gaVxuICAgICAgICAgICAgICAgICAgICAgICAgZGljdFBhcmFtU3RhcnQgPSAwXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrQ291bnQtLVxuICAgICAgICAgICAgZWxzZSBcbiAgICAgICAgICAgICAgICBpZiBpc0luc2lkZSgpXG4gICAgICAgICAgICAgICAgICAgIGlmIHRhZyA9PSAnOicgYW5kIG5leHRUYWcgbm90IGluIFsnSURFTlRJRklFUicnQCddXG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVuID0gQGZpbmRNYXRjaGluZ1RhZ0JhY2t3YXJkcyAnfScsIGlcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIG9wZW4uaW5kZXggPj0gMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIEB0YWcob3Blbi5pbmRleC0xKSBub3QgaW4gWyc9J11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpLCAxLCBAZ2VuZXJhdGUgJz0nJz0nIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBuZXh0VGFnIGluIFsnLCcsICd9J11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSsxLCAwLCBAZ2VuZXJhdGUgJ05VTEwnJ251bGwnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMlxuICAgICAgICAgICAgMVxuICAgICAgICAgICAgICAgICBcbiAgICAjIFRoZSBsZXhlciBoYXMgdGFnZ2VkIHRoZSBvcGVuaW5nIHBhcmVudGhlc2lzIG9mIGEgbWV0aG9kIGNhbGwuIE1hdGNoIGl0IHdpdGhcbiAgICAjIGl0cyBwYWlyZWQgY2xvc2UuIFdlIGhhdmUgdGhlIG1pcy1uZXN0ZWQgb3V0ZGVudCBjYXNlIGluY2x1ZGVkIGhlcmUgZm9yXG4gICAgIyBjYWxscyB0aGF0IGNsb3NlIG9uIHRoZSBzYW1lIGxpbmUsIGp1c3QgYmVmb3JlIHRoZWlyIG91dGRlbnQuXG4gICAgXG4gICAgY2xvc2VPcGVuQ2FsbHM6IC0+XG4gICAgICAgIFxuICAgICAgICBjb25kaXRpb24gPSAodG9rZW4sIGkpIC0+XG4gICAgICAgICAgICB0b2tlblswXSBpbiBbJyknICdDQUxMX0VORCddIG9yXG4gICAgICAgICAgICB0b2tlblswXSBpcyAnT1VUREVOVCcgYW5kIEB0YWcoaSAtIDEpIGlzICcpJ1xuXG4gICAgICAgIGFjdGlvbiA9ICh0b2tlbiwgaSkgLT5cbiAgICAgICAgICAgIEB0b2tlbnNbaWYgdG9rZW5bMF0gaXMgJ09VVERFTlQnIHRoZW4gaSAtIDEgZWxzZSBpXVswXSA9ICdDQUxMX0VORCdcblxuICAgICAgICBAc2NhblRva2VucyAodG9rZW4sIGkpIC0+XG4gICAgICAgICAgICBAZGV0ZWN0RW5kIGkgKyAxLCBjb25kaXRpb24sIGFjdGlvbiBpZiB0b2tlblswXSBpcyAnQ0FMTF9TVEFSVCdcbiAgICAgICAgICAgIDFcblxuICAgICMgVGhlIGxleGVyIGhhcyB0YWdnZWQgdGhlIG9wZW5pbmcgcGFyZW50aGVzaXMgb2YgYW4gaW5kZXhpbmcgb3BlcmF0aW9uIGNhbGwuXG4gICAgIyBNYXRjaCBpdCB3aXRoIGl0cyBwYWlyZWQgY2xvc2UuXG4gICAgXG4gICAgY2xvc2VPcGVuSW5kZXhlczogLT5cbiAgICAgICAgXG4gICAgICAgIGNvbmRpdGlvbiA9ICh0b2tlbiwgaSkgLT5cbiAgICAgICAgICAgIHRva2VuWzBdIGluIFsnXScgJ0lOREVYX0VORCddXG5cbiAgICAgICAgYWN0aW9uID0gKHRva2VuLCBpKSAtPlxuICAgICAgICAgICAgdG9rZW5bMF0gPSAnSU5ERVhfRU5EJ1xuXG4gICAgICAgIEBzY2FuVG9rZW5zICh0b2tlbiwgaSkgLT5cbiAgICAgICAgICAgIEBkZXRlY3RFbmQgaSArIDEsIGNvbmRpdGlvbiwgYWN0aW9uIGlmIHRva2VuWzBdIGlzICdJTkRFWF9TVEFSVCdcbiAgICAgICAgICAgIDFcblxuICAgICMgTWF0Y2ggdGFncyBpbiB0b2tlbiBzdHJlYW0gc3RhcnRpbmcgYXQgYGlgIHdpdGggYHBhdHRlcm5gLCBza2lwcGluZyAnSEVSRUNPTU1FTlQncy5cbiAgICAjIGBwYXR0ZXJuYCBtYXkgY29uc2lzdCBvZiBzdHJpbmdzIChlcXVhbGl0eSksIGFuIGFycmF5IG9mIHN0cmluZ3MgKG9uZSBvZilcbiAgICAjIG9yIG51bGwgKHdpbGRjYXJkKS4gUmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIG1hdGNoIG9yIC0xIGlmIG5vIG1hdGNoLlxuICAgIFxuICAgIGluZGV4T2ZUYWc6IChpLCBwYXR0ZXJuLi4uKSAtPlxuICAgICAgICBmdXp6ID0gMFxuICAgICAgICBmb3IgaiBpbiBbMCAuLi4gcGF0dGVybi5sZW5ndGhdXG4gICAgICAgICAgICBmdXp6ICs9IDIgd2hpbGUgQHRhZyhpICsgaiArIGZ1enopIGlzICdIRVJFQ09NTUVOVCdcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIG5vdCBwYXR0ZXJuW2pdP1xuICAgICAgICAgICAgcGF0dGVybltqXSA9IFtwYXR0ZXJuW2pdXSBpZiB0eXBlb2YgcGF0dGVybltqXSBpcyAnc3RyaW5nJ1xuICAgICAgICAgICAgcmV0dXJuIC0xIGlmIEB0YWcoaSArIGogKyBmdXp6KSBub3QgaW4gcGF0dGVybltqXVxuICAgICAgICBpICsgaiArIGZ1enogLSAxXG5cbiAgICAjIGBAPHg+OmAsIGA8eD46YCBvciBgPEVYUFJFU1NJT05fU1RBUlQ+PHg+Li4uPEVYUFJFU1NJT05fRU5EPjpgLCBza2lwcGluZyBvdmVyICdIRVJFQ09NTUVOVCdzLlxuICAgIFxuICAgIGxvb2tzT2JqZWN0aXNoOiAoaikgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB5ZXMgaWYgQGluZGV4T2ZUYWcoaiwgJ0AnLCBudWxsLCAnOicpID4gLTEgb3IgQGluZGV4T2ZUYWcoaiwgbnVsbCwgJzonKSA+IC0xXG4gICAgICAgIFxuICAgICAgICBpbmRleCA9IEBpbmRleE9mVGFnKGosIEVYUFJFU1NJT05fU1RBUlQpXG4gICAgICAgIGlmIGluZGV4ID4gLTFcbiAgICAgICAgICAgIGVuZCA9IG51bGxcbiAgICAgICAgICAgIEBkZXRlY3RFbmQgaW5kZXggKyAxLCAoKHRva2VuKSAtPiB0b2tlblswXSBpbiBFWFBSRVNTSU9OX0VORCksICgodG9rZW4sIGkpIC0+IGVuZCA9IGkpXG4gICAgICAgICAgICByZXR1cm4geWVzIGlmIEB0YWcoZW5kICsgMSkgaXMgJzonXG4gICAgICAgIG5vXG5cbiAgICAjIFJldHVybnMgYHllc2AgaWYgY3VycmVudCBsaW5lIG9mIHRva2VucyBjb250YWluIGFuIGVsZW1lbnQgb2YgdGFncyBvbiBzYW1lIGV4cHJlc3Npb24gbGV2ZWwuIFxuICAgICMgU3RvcCBzZWFyY2hpbmcgYXQgTElORUJSRUFLUyBvciBleHBsaWNpdCBzdGFydCBvZiBjb250YWluaW5nIGJhbGFuY2VkIGV4cHJlc3Npb24uXG4gICAgXG4gICAgZmluZFRhZ3NCYWNrd2FyZHM6IChpLCB0YWdzKSAtPlxuICAgICAgICBiYWNrU3RhY2sgPSBbXVxuICAgICAgICB3aGlsZSBpID49IDAgYW5kIChiYWNrU3RhY2subGVuZ3RoIG9yXG4gICAgICAgICAgICAgICAgICAgIEB0YWcoaSkgbm90IGluIHRhZ3MgYW5kXG4gICAgICAgICAgICAgICAgICAgIChAdGFnKGkpIG5vdCBpbiBFWFBSRVNTSU9OX1NUQVJUIG9yIEB0b2tlbnNbaV0uZ2VuZXJhdGVkKSBhbmRcbiAgICAgICAgICAgICAgICAgICAgQHRhZyhpKSBub3QgaW4gTElORUJSRUFLUylcbiAgICAgICAgICAgIGJhY2tTdGFjay5wdXNoIEB0YWcoaSkgaWYgQHRhZyhpKSBpbiBFWFBSRVNTSU9OX0VORFxuICAgICAgICAgICAgYmFja1N0YWNrLnBvcCgpIGlmIEB0YWcoaSkgaW4gRVhQUkVTU0lPTl9TVEFSVCBhbmQgYmFja1N0YWNrLmxlbmd0aFxuICAgICAgICAgICAgaSAtPSAxXG4gICAgICAgIEB0YWcoaSkgaW4gdGFnc1xuXG4gICAgIyAwMDAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgIyBMb29rIGZvciBzaWducyBvZiBpbXBsaWNpdCBjYWxscyBhbmQgb2JqZWN0cyBpbiB0aGUgdG9rZW4gc3RyZWFtIGFuZCBhZGQgdGhlbS5cbiAgICAgICAgXG4gICAgYWRkSW1wbGljaXRCcmFjZXNBbmRQYXJlbnM6IC0+XG5cbiAgICAgICAgIyBUcmFjayBjdXJyZW50IGJhbGFuY2luZyBkZXB0aCAoYm90aCBpbXBsaWNpdCBhbmQgZXhwbGljaXQpIG9uIHN0YWNrLlxuICAgICAgICBzdGFjayA9IFtdXG4gICAgICAgIHN0YXJ0ID0gbnVsbFxuXG4gICAgICAgIEBzY2FuVG9rZW5zICh0b2tlbiwgaSwgdG9rZW5zKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBbdGFnXSAgICAgPSB0b2tlblxuICAgICAgICAgICAgW3ByZXZUYWddID0gcHJldlRva2VuID0gaWYgaSA+IDAgdGhlbiB0b2tlbnNbaSAtIDFdIGVsc2UgW11cbiAgICAgICAgICAgIFtuZXh0VGFnXSA9IGlmIGkgPCB0b2tlbnMubGVuZ3RoIC0gMSB0aGVuIHRva2Vuc1tpICsgMV0gZWxzZSBbXVxuICAgICAgICAgICAgc3RhY2tUb3AgID0gLT4gc3RhY2tbc3RhY2subGVuZ3RoIC0gMV1cbiAgICAgICAgICAgIHN0YXJ0SWR4ICA9IGlcblxuICAgICAgICAgICAgIyBIZWxwZXIgZnVuY3Rpb24sIHVzZWQgZm9yIGtlZXBpbmcgdHJhY2sgb2YgdGhlIG51bWJlciBvZiB0b2tlbnMgY29uc3VtZWRcbiAgICAgICAgICAgICMgYW5kIHNwbGljZWQsIHdoZW4gcmV0dXJuaW5nIGZvciBnZXR0aW5nIGEgbmV3IHRva2VuLlxuICAgICAgICAgICAgZm9yd2FyZCAgID0gKG4pIC0+IGkgLSBzdGFydElkeCArIG5cblxuICAgICAgICAgICAgIyBIZWxwZXIgZnVuY3Rpb25zXG4gICAgICAgICAgICBpc0ltcGxpY2l0ICAgICAgICAgID0gKHN0YWNrSXRlbSkgLT4gc3RhY2tJdGVtP1syXT8ub3Vyc1xuICAgICAgICAgICAgaXNJbXBsaWNpdE9iamVjdCAgICA9IChzdGFja0l0ZW0pIC0+IGlzSW1wbGljaXQoc3RhY2tJdGVtKSBhbmQgc3RhY2tJdGVtP1swXSBpcyAneydcbiAgICAgICAgICAgIGlzSW1wbGljaXRDYWxsICAgICAgPSAoc3RhY2tJdGVtKSAtPiBpc0ltcGxpY2l0KHN0YWNrSXRlbSkgYW5kIHN0YWNrSXRlbT9bMF0gaXMgJygnXG4gICAgICAgICAgICBpbkltcGxpY2l0ICAgICAgICAgID0gLT4gaXNJbXBsaWNpdCBzdGFja1RvcCgpXG4gICAgICAgICAgICBpbkltcGxpY2l0Q2FsbCAgICAgID0gLT4gaXNJbXBsaWNpdENhbGwgc3RhY2tUb3AoKVxuICAgICAgICAgICAgaW5JbXBsaWNpdE9iamVjdCAgICA9IC0+IGlzSW1wbGljaXRPYmplY3Qgc3RhY2tUb3AoKVxuICAgICAgICAgICAgIyBVbmNsb3NlZCBjb250cm9sIHN0YXRlbWVudCBpbnNpZGUgaW1wbGljaXQgcGFyZW5zIChsaWtlXG4gICAgICAgICAgICAjIGNsYXNzIGRlY2xhcmF0aW9uIG9yIGlmLWNvbmRpdGlvbmFscylcbiAgICAgICAgICAgIGluSW1wbGljaXRDb250cm9sID0gLT4gaW5JbXBsaWNpdCBhbmQgc3RhY2tUb3AoKT9bMF0gaXMgJ0NPTlRST0wnXG5cbiAgICAgICAgICAgIHN0YXJ0SW1wbGljaXRDYWxsID0gKGopIC0+XG4gICAgICAgICAgICAgICAgaWR4ID0gaiA/IGlcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoIFsnKCcsIGlkeCwgb3VyczogeWVzXVxuICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaWR4LCAwLCBSZXdyaXRlci5nZW5lcmF0ZSAnQ0FMTF9TVEFSVCcsICcoJywgWycnLCAnaW1wbGljaXQgZnVuY3Rpb24gY2FsbCcsIHRva2VuWzJdXVxuICAgICAgICAgICAgICAgIGkgKz0gMSBpZiBub3Qgaj9cblxuICAgICAgICAgICAgZW5kSW1wbGljaXRDYWxsID0gLT5cbiAgICAgICAgICAgICAgICBzdGFjay5wb3AoKVxuICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSwgMCwgUmV3cml0ZXIuZ2VuZXJhdGUgJ0NBTExfRU5EJywgJyknLCBbJycsICdlbmQgb2YgaW5wdXQnLCB0b2tlblsyXV1cbiAgICAgICAgICAgICAgICBpICs9IDFcblxuICAgICAgICAgICAgc3RhcnRJbXBsaWNpdE9iamVjdCA9IChqLCBzdGFydHNMaW5lID0geWVzKSAtPlxuICAgICAgICAgICAgICAgIGlkeCA9IGogPyBpXG4gICAgICAgICAgICAgICAgc3RhY2sucHVzaCBbJ3snLCBpZHgsIHNhbWVMaW5lOiB5ZXMsIHN0YXJ0c0xpbmU6IHN0YXJ0c0xpbmUsIG91cnM6IHllc11cbiAgICAgICAgICAgICAgICB2YWwgPSBuZXcgU3RyaW5nICd7J1xuICAgICAgICAgICAgICAgIHZhbC5nZW5lcmF0ZWQgPSB5ZXNcbiAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGlkeCwgMCwgUmV3cml0ZXIuZ2VuZXJhdGUgJ3snLCB2YWwsIHRva2VuXG4gICAgICAgICAgICAgICAgaSArPSAxIGlmIG5vdCBqP1xuXG4gICAgICAgICAgICBlbmRJbXBsaWNpdE9iamVjdCA9IChqKSAtPlxuICAgICAgICAgICAgICAgIGogPSBqID8gaVxuICAgICAgICAgICAgICAgIHN0YWNrLnBvcCgpXG4gICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBqLCAwLCBSZXdyaXRlci5nZW5lcmF0ZSAnfScsICd9JywgdG9rZW5cbiAgICAgICAgICAgICAgICBpICs9IDFcblxuICAgICAgICAgICAgIyBEb24ndCBlbmQgYW4gaW1wbGljaXQgY2FsbCBvbiBuZXh0IGluZGVudCBpZiBhbnkgb2YgdGhlc2UgYXJlIGluIGFuIGFyZ3VtZW50XG4gICAgICAgICAgICBpZiBpbkltcGxpY2l0Q2FsbCgpIGFuZCB0YWcgaW4gWydJRicgJ01FVEFfSUYnLCAnVFJZJyAnRklOQUxMWScgJ0NBVENIJyAnQ0xBU1MnICdTV0lUQ0gnXVxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2ggWydDT05UUk9MJywgaSwgb3VyczogeWVzXVxuICAgICAgICAgICAgICAgIHJldHVybiBmb3J3YXJkKDEpXG5cbiAgICAgICAgICAgIGlmIHRhZyBpcyAnSU5ERU5UJyBhbmQgaW5JbXBsaWNpdCgpXG5cbiAgICAgICAgICAgICAgICAjIEFuIGBJTkRFTlRgIGNsb3NlcyBhbiBpbXBsaWNpdCBjYWxsIHVubGVzc1xuICAgICAgICAgICAgICAgICNcbiAgICAgICAgICAgICAgICAjICAgIDEuIFdlIGhhdmUgc2VlbiBhIGBDT05UUk9MYCBhcmd1bWVudCBvbiB0aGUgbGluZS5cbiAgICAgICAgICAgICAgICAjICAgIDIuIFRoZSBsYXN0IHRva2VuIGJlZm9yZSB0aGUgaW5kZW50IGlzIHBhcnQgb2YgdGhlIGxpc3QgYmVsb3dcbiAgICAgICAgICAgICAgICAjXG4gICAgICAgICAgICAgICAgaWYgcHJldlRhZyBub3QgaW4gWyc9PicgJy0+JyAnWycgJygnICcsJyAneycgJ1RSWScgJ0VMU0UnLCAnTUVUQV9FTFNFJyAnPSddXG4gICAgICAgICAgICAgICAgICAgIGVuZEltcGxpY2l0Q2FsbCgpIHdoaWxlIGluSW1wbGljaXRDYWxsKClcbiAgICAgICAgICAgICAgICBzdGFjay5wb3AoKSBpZiBpbkltcGxpY2l0Q29udHJvbCgpXG4gICAgICAgICAgICAgICAgc3RhY2sucHVzaCBbdGFnLCBpXVxuICAgICAgICAgICAgICAgIHJldHVybiBmb3J3YXJkKDEpXG5cbiAgICAgICAgICAgICMgU3RyYWlnaHRmb3J3YXJkIHN0YXJ0IG9mIGV4cGxpY2l0IGV4cHJlc3Npb25cbiAgICAgICAgICAgIGlmIHRhZyBpbiBFWFBSRVNTSU9OX1NUQVJUXG4gICAgICAgICAgICAgICAgc3RhY2sucHVzaCBbdGFnLCBpXVxuICAgICAgICAgICAgICAgIHJldHVybiBmb3J3YXJkKDEpXG5cbiAgICAgICAgICAgICMgQ2xvc2UgYWxsIGltcGxpY2l0IGV4cHJlc3Npb25zIGluc2lkZSBvZiBleHBsaWNpdGx5IGNsb3NlZCBleHByZXNzaW9ucy5cbiAgICAgICAgICAgIGlmIHRhZyBpbiBFWFBSRVNTSU9OX0VORFxuICAgICAgICAgICAgICAgIHdoaWxlIGluSW1wbGljaXQoKVxuICAgICAgICAgICAgICAgICAgICBpZiBpbkltcGxpY2l0Q2FsbCgpXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmRJbXBsaWNpdENhbGwoKVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGluSW1wbGljaXRPYmplY3QoKVxuICAgICAgICAgICAgICAgICAgICAgICAgZW5kSW1wbGljaXRPYmplY3QoKVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFjay5wb3AoKVxuICAgICAgICAgICAgICAgIHN0YXJ0ID0gc3RhY2sucG9wKClcblxuICAgICAgICAgICAgIyBSZWNvZ25pemUgc3RhbmRhcmQgaW1wbGljaXQgY2FsbHMgbGlrZVxuICAgICAgICAgICAgIyBmIGEsIGYoKSBiLCBmPyBjLCBoWzBdIGQgZXRjLlxuICAgICAgICAgICAgaWYgKHRhZyBpbiBJTVBMSUNJVF9GVU5DIGFuZCB0b2tlbi5zcGFjZWQgb3JcbiAgICAgICAgICAgICAgICAgICAgdGFnIGlzICc/JyBhbmQgaSA+IDAgYW5kIG5vdCB0b2tlbnNbaSAtIDFdLnNwYWNlZCkgYW5kXG4gICAgICAgICAgICAgICAgIChuZXh0VGFnIGluIElNUExJQ0lUX0NBTEwgb3JcbiAgICAgICAgICAgICAgICAgICAgbmV4dFRhZyBpbiBJTVBMSUNJVF9VTlNQQUNFRF9DQUxMIGFuZFxuICAgICAgICAgICAgICAgICAgICBub3QgdG9rZW5zW2kgKyAxXT8uc3BhY2VkIGFuZCBub3QgdG9rZW5zW2kgKyAxXT8ubmV3TGluZSlcbiAgICAgICAgICAgICAgICB0YWcgPSB0b2tlblswXSA9ICdGVU5DX0VYSVNUJyBpZiB0YWcgaXMgJz8nXG4gICAgICAgICAgICAgICAgc3RhcnRJbXBsaWNpdENhbGwgaSArIDFcbiAgICAgICAgICAgICAgICByZXR1cm4gZm9yd2FyZCgyKVxuXG4gICAgICAgICAgICAjIEltcGxpY2l0IGNhbGwgdGFraW5nIGFuIGltcGxpY2l0IGluZGVudGVkIG9iamVjdCBhcyBmaXJzdCBhcmd1bWVudC5cbiAgICAgICAgICAgICNcbiAgICAgICAgICAgICMgICAgICAgICAgIGZcbiAgICAgICAgICAgICMgICAgICAgICAgICAgICBhOiBiXG4gICAgICAgICAgICAjICAgICAgICAgICAgICAgYzogZFxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyBhbmRcbiAgICAgICAgICAgICNcbiAgICAgICAgICAgICMgICAgICAgICAgIGZcbiAgICAgICAgICAgICMgICAgICAgICAgICAgICAxXG4gICAgICAgICAgICAjICAgICAgICAgICAgICAgYTogYlxuICAgICAgICAgICAgIyAgICAgICAgICAgICAgIGI6IGNcbiAgICAgICAgICAgICNcbiAgICAgICAgICAgICMgRG9uJ3QgYWNjZXB0IGltcGxpY2l0IGNhbGxzIG9mIHRoaXMgdHlwZSwgd2hlbiBvbiB0aGUgc2FtZSBsaW5lXG4gICAgICAgICAgICAjIGFzIHRoZSBjb250cm9sIHN0cnVjdHVyZXMgYmVsb3cgYXMgdGhhdCBtYXkgbWlzaW50ZXJwcmV0IGNvbnN0cnVjdHMgbGlrZTpcbiAgICAgICAgICAgICNcbiAgICAgICAgICAgICMgICAgICAgICAgIGlmIGZcbiAgICAgICAgICAgICMgICAgICAgICAgICAgICAgYTogMVxuICAgICAgICAgICAgIyBhc1xuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyAgICAgICAgICAgaWYgZihhOiAxKVxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyB3aGljaCBpcyBwcm9iYWJseSBhbHdheXMgdW5pbnRlbmRlZC5cbiAgICAgICAgICAgICMgRnVydGhlcm1vcmUgZG9uJ3QgYWxsb3cgdGhpcyBpbiBsaXRlcmFsIGFycmF5cywgYXMgdGhhdCBjcmVhdGVzIGdyYW1tYXRpY2FsIGFtYmlndWl0aWVzLlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiB0YWcgaW4gSU1QTElDSVRfRlVOQyBhbmRcbiAgICAgICAgICAgICAgICAgQGluZGV4T2ZUYWcoaSArIDEsICdJTkRFTlQnKSA+IC0xIGFuZCBAbG9va3NPYmplY3Rpc2goaSArIDIpIGFuZFxuICAgICAgICAgICAgICAgICBub3QgQGZpbmRUYWdzQmFja3dhcmRzKGksIFsnQ0xBU1MnICdFWFRFTkRTJyAnSUYnICdNRVRBX0lGJyAnQ0FUQ0gnICdTV0lUQ0gnICdMRUFESU5HX1dIRU4nICdGT1InICdXSElMRScgJ1VOVElMJ10pXG4gICAgICAgICAgICAgICAgc3RhcnRJbXBsaWNpdENhbGwgaSArIDFcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoIFsnSU5ERU5UJywgaSArIDJdXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvcndhcmQoMylcblxuICAgICAgICAgICAgIyBJbXBsaWNpdCBvYmplY3RzIHN0YXJ0IGhlcmVcbiAgICAgICAgICAgIGlmIHRhZyBpcyAnOidcbiAgICAgICAgICAgICAgICAjIEdvIGJhY2sgdG8gdGhlIChpbXBsaWNpdCkgc3RhcnQgb2YgdGhlIG9iamVjdFxuICAgICAgICAgICAgICAgIHMgPSBzd2l0Y2hcbiAgICAgICAgICAgICAgICAgICAgd2hlbiBAdGFnKGkgLSAxKSBpbiBFWFBSRVNTSU9OX0VORCB0aGVuIHN0YXJ0WzFdXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gQHRhZyhpIC0gMikgaXMgJ0AnIHRoZW4gaSAtIDJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpIC0gMVxuICAgICAgICAgICAgICAgIHMgLT0gMiB3aGlsZSBAdGFnKHMgLSAyKSBpcyAnSEVSRUNPTU1FTlQnXG5cbiAgICAgICAgICAgICAgICAjIE1hcmsgaWYgdGhlIHZhbHVlIGlzIGEgZm9yIGxvb3BcbiAgICAgICAgICAgICAgICBAaW5zaWRlRm9yRGVjbGFyYXRpb24gPSBuZXh0VGFnIGlzICdGT1InXG5cbiAgICAgICAgICAgICAgICBzdGFydHNMaW5lID0gcyBpcyAwIG9yIEB0YWcocyAtIDEpIGluIExJTkVCUkVBS1Mgb3IgdG9rZW5zW3MgLSAxXS5uZXdMaW5lXG4gICAgICAgICAgICAgICAgIyBBcmUgd2UganVzdCBjb250aW51aW5nIGFuIGFscmVhZHkgZGVjbGFyZWQgb2JqZWN0P1xuICAgICAgICAgICAgICAgIGlmIHN0YWNrVG9wKClcbiAgICAgICAgICAgICAgICAgICAgW3N0YWNrVGFnLCBzdGFja0lkeF0gPSBzdGFja1RvcCgpXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGFja1RhZyBpcyAneycgb3Igc3RhY2tUYWcgaXMgJ0lOREVOVCcgYW5kIEB0YWcoc3RhY2tJZHggLSAxKSBpcyAneycpIGFuZFxuICAgICAgICAgICAgICAgICAgICAgICAgIChzdGFydHNMaW5lIG9yIEB0YWcocyAtIDEpIGlzICcsJyBvciBAdGFnKHMgLSAxKSBpcyAneycpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm9yd2FyZCgxKVxuXG4gICAgICAgICAgICAgICAgc3RhcnRJbXBsaWNpdE9iamVjdChzLCAhIXN0YXJ0c0xpbmUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvcndhcmQoMilcblxuICAgICAgICAgICAgIyBFbmQgaW1wbGljaXQgY2FsbHMgd2hlbiBjaGFpbmluZyBtZXRob2QgY2FsbHNcbiAgICAgICAgICAgICMgbGlrZSBlLmcuOlxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyAgICAgICAgICAgZiAtPlxuICAgICAgICAgICAgIyAgICAgICAgICAgICAgIGFcbiAgICAgICAgICAgICMgICAgICAgICAgIC5nIGIsIC0+XG4gICAgICAgICAgICAjICAgICAgICAgICAgICAgY1xuICAgICAgICAgICAgIyAgICAgICAgICAgLmggYVxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyBhbmQgYWxzb1xuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyAgICAgICAgICAgZiBhXG4gICAgICAgICAgICAjICAgICAgICAgICAuZyBiXG4gICAgICAgICAgICAjICAgICAgICAgICAuaCBhXG5cbiAgICAgICAgICAgICMgTWFyayBhbGwgZW5jbG9zaW5nIG9iamVjdHMgYXMgbm90IHNhbWVMaW5lXG4gICAgICAgICAgICBpZiB0YWcgaW4gTElORUJSRUFLU1xuICAgICAgICAgICAgICAgIGZvciBzdGFja0l0ZW0gaW4gc3RhY2sgYnkgLTFcbiAgICAgICAgICAgICAgICAgICAgYnJlYWsgdW5sZXNzIGlzSW1wbGljaXQgc3RhY2tJdGVtXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrSXRlbVsyXS5zYW1lTGluZSA9IG5vIGlmIGlzSW1wbGljaXRPYmplY3Qgc3RhY2tJdGVtXG5cbiAgICAgICAgICAgIG5ld0xpbmUgPSBwcmV2VGFnIGlzICdPVVRERU5UJyBvciBwcmV2VG9rZW4ubmV3TGluZVxuICAgICAgICAgICAgaWYgdGFnIGluIElNUExJQ0lUX0VORCBvciB0YWcgaW4gQ0FMTF9DTE9TRVJTIGFuZCBuZXdMaW5lXG4gICAgICAgICAgICAgICAgd2hpbGUgaW5JbXBsaWNpdCgpXG4gICAgICAgICAgICAgICAgICAgIFtzdGFja1RhZywgc3RhY2tJZHgsIHtzYW1lTGluZSwgc3RhcnRzTGluZX1dID0gc3RhY2tUb3AoKVxuICAgICAgICAgICAgICAgICAgICAjIENsb3NlIGltcGxpY2l0IGNhbGxzIHdoZW4gcmVhY2hlZCBlbmQgb2YgYXJndW1lbnQgbGlzdFxuICAgICAgICAgICAgICAgICAgICBpZiBpbkltcGxpY2l0Q2FsbCgpIGFuZCBwcmV2VGFnICE9ICcsJ1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5kSW1wbGljaXRDYWxsKClcbiAgICAgICAgICAgICAgICAgICAgIyBDbG9zZSBpbXBsaWNpdCBvYmplY3RzIHN1Y2ggYXM6XG4gICAgICAgICAgICAgICAgICAgICMgcmV0dXJuIGE6IDEsIGI6IDIgdW5sZXNzIHRydWVcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBpbkltcGxpY2l0T2JqZWN0KCkgYW5kIG5vdCBAaW5zaWRlRm9yRGVjbGFyYXRpb24gYW5kIHNhbWVMaW5lIGFuZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnICE9ICdURVJNSU5BVE9SJyBhbmQgcHJldlRhZyAhPSAnOidcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZEltcGxpY2l0T2JqZWN0KClcbiAgICAgICAgICAgICAgICAgICAgIyBDbG9zZSBpbXBsaWNpdCBvYmplY3RzIHdoZW4gYXQgZW5kIG9mIGxpbmUsIGxpbmUgZGlkbid0IGVuZCB3aXRoIGEgY29tbWFcbiAgICAgICAgICAgICAgICAgICAgIyBhbmQgdGhlIGltcGxpY2l0IG9iamVjdCBkaWRuJ3Qgc3RhcnQgdGhlIGxpbmUgb3IgdGhlIG5leHQgbGluZSBkb2Vzbid0IGxvb2sgbGlrZVxuICAgICAgICAgICAgICAgICAgICAjIHRoZSBjb250aW51YXRpb24gb2YgYW4gb2JqZWN0LlxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGluSW1wbGljaXRPYmplY3QoKSBhbmQgdGFnIGlzICdURVJNSU5BVE9SJyBhbmQgcHJldlRhZyAhPSAnLCcgYW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3QgKHN0YXJ0c0xpbmUgYW5kIEBsb29rc09iamVjdGlzaChpICsgMSkpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm9yd2FyZCAxIGlmIG5leHRUYWcgaXMgJ0hFUkVDT01NRU5UJ1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5kSW1wbGljaXRPYmplY3QoKVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICAjIENsb3NlIGltcGxpY2l0IG9iamVjdCBpZiBjb21tYSBpcyB0aGUgbGFzdCBjaGFyYWN0ZXJcbiAgICAgICAgICAgICMgYW5kIHdoYXQgY29tZXMgYWZ0ZXIgZG9lc24ndCBsb29rIGxpa2UgaXQgYmVsb25ncy5cbiAgICAgICAgICAgICMgVGhpcyBpcyB1c2VkIGZvciB0cmFpbGluZyBjb21tYXMgYW5kIGNhbGxzLCBsaWtlOlxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyAgICAgICAgICAgeCA9XG4gICAgICAgICAgICAjICAgICAgICAgICAgICAgICAgIGE6IGIsXG4gICAgICAgICAgICAjICAgICAgICAgICAgICAgICAgIGM6IGQsXG4gICAgICAgICAgICAjICAgICAgICAgICBlID0gMlxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyBhbmRcbiAgICAgICAgICAgICNcbiAgICAgICAgICAgICMgICAgICAgICAgIGYgYSwgYjogYywgZDogZSwgZiwgZzogaDogaSwgalxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgaWYgdGFnIGlzICcsJyBhbmQgbm90IEBsb29rc09iamVjdGlzaChpICsgMSkgYW5kIGluSW1wbGljaXRPYmplY3QoKSBhbmRcbiAgICAgICAgICAgICAgICAgbm90IEBpbnNpZGVGb3JEZWNsYXJhdGlvbiBhbmRcbiAgICAgICAgICAgICAgICAgKG5leHRUYWcgIT0gJ1RFUk1JTkFUT1InIG9yIG5vdCBAbG9va3NPYmplY3Rpc2goaSArIDIpKVxuICAgICAgICAgICAgICAgICMgV2hlbiBuZXh0VGFnIGlzIE9VVERFTlQgdGhlIGNvbW1hIGlzIGluc2lnbmlmaWNhbnQgYW5kXG4gICAgICAgICAgICAgICAgIyBzaG91bGQganVzdCBiZSBpZ25vcmVkIHNvIGVtYmVkIGl0IGluIHRoZSBpbXBsaWNpdCBvYmplY3QuXG4gICAgICAgICAgICAgICAgI1xuICAgICAgICAgICAgICAgICMgV2hlbiBpdCBpc24ndCB0aGUgY29tbWEgZ28gb24gdG8gcGxheSBhIHJvbGUgaW4gYSBjYWxsIG9yXG4gICAgICAgICAgICAgICAgIyBhcnJheSBmdXJ0aGVyIHVwIHRoZSBzdGFjaywgc28gZ2l2ZSBpdCBhIGNoYW5jZS5cblxuICAgICAgICAgICAgICAgIG9mZnNldCA9IGlmIG5leHRUYWcgaXMgJ09VVERFTlQnIHRoZW4gMSBlbHNlIDBcbiAgICAgICAgICAgICAgICB3aGlsZSBpbkltcGxpY2l0T2JqZWN0KClcbiAgICAgICAgICAgICAgICAgICAgZW5kSW1wbGljaXRPYmplY3QgaSArIG9mZnNldFxuICAgICAgICAgICAgcmV0dXJuIGZvcndhcmQoMSlcbiAgICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICBcbiAgICAjIEFkZCBsb2NhdGlvbiBkYXRhIHRvIGFsbCB0b2tlbnMgZ2VuZXJhdGVkIGJ5IHRoZSByZXdyaXRlci5cbiAgICBcbiAgICBhZGRMb2NhdGlvbkRhdGFUb0dlbmVyYXRlZFRva2VuczogLT5cbiAgICAgICAgQHNjYW5Ub2tlbnMgKHRva2VuLCBpLCB0b2tlbnMpIC0+XG4gICAgICAgICAgICByZXR1cm4gMSBpZiB0b2tlblsyXVxuICAgICAgICAgICAgcmV0dXJuIDEgdW5sZXNzIHRva2VuLmdlbmVyYXRlZCBvciB0b2tlbi5leHBsaWNpdFxuICAgICAgICAgICAgaWYgdG9rZW5bMF0gaXMgJ3snIGFuZCBuZXh0TG9jYXRpb249dG9rZW5zW2kgKyAxXT9bMl1cbiAgICAgICAgICAgICAgICB7Zmlyc3RfbGluZTogbGluZSwgZmlyc3RfY29sdW1uOiBjb2x1bW59ID0gbmV4dExvY2F0aW9uXG4gICAgICAgICAgICBlbHNlIGlmIHByZXZMb2NhdGlvbiA9IHRva2Vuc1tpIC0gMV0/WzJdXG4gICAgICAgICAgICAgICAge2xhc3RfbGluZTogbGluZSwgbGFzdF9jb2x1bW46IGNvbHVtbn0gPSBwcmV2TG9jYXRpb25cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBsaW5lID0gY29sdW1uID0gMFxuICAgICAgICAgICAgdG9rZW5bMl0gPVxuICAgICAgICAgICAgICAgIGZpcnN0X2xpbmU6ICAgbGluZVxuICAgICAgICAgICAgICAgIGZpcnN0X2NvbHVtbjogY29sdW1uXG4gICAgICAgICAgICAgICAgbGFzdF9saW5lOiAgICBsaW5lXG4gICAgICAgICAgICAgICAgbGFzdF9jb2x1bW46ICBjb2x1bW5cbiAgICAgICAgICAgIHJldHVybiAxXG5cbiAgICAjIE9VVERFTlQgdG9rZW5zIHNob3VsZCBhbHdheXMgYmUgcG9zaXRpb25lZCBhdCB0aGUgbGFzdCBjaGFyYWN0ZXIgb2YgdGhlXG4gICAgIyBwcmV2aW91cyB0b2tlbiwgc28gdGhhdCBBU1Qgbm9kZXMgZW5kaW5nIGluIGFuIE9VVERFTlQgdG9rZW4gZW5kIHVwIHdpdGggYVxuICAgICMgbG9jYXRpb24gY29ycmVzcG9uZGluZyB0byB0aGUgbGFzdCBcInJlYWxcIiB0b2tlbiB1bmRlciB0aGUgbm9kZS5cbiAgICBmaXhPdXRkZW50TG9jYXRpb25EYXRhOiAtPlxuICAgICAgICBAc2NhblRva2VucyAodG9rZW4sIGksIHRva2VucykgLT5cbiAgICAgICAgICAgIHJldHVybiAxIHVubGVzcyB0b2tlblswXSBpcyAnT1VUREVOVCcgb3JcbiAgICAgICAgICAgICAgICAodG9rZW4uZ2VuZXJhdGVkIGFuZCB0b2tlblswXSBpcyAnQ0FMTF9FTkQnKSBvclxuICAgICAgICAgICAgICAgICh0b2tlbi5nZW5lcmF0ZWQgYW5kIHRva2VuWzBdIGlzICd9JylcbiAgICAgICAgICAgIHByZXZMb2NhdGlvbkRhdGEgPSB0b2tlbnNbaSAtIDFdWzJdXG4gICAgICAgICAgICB0b2tlblsyXSA9XG4gICAgICAgICAgICAgICAgZmlyc3RfbGluZTogICBwcmV2TG9jYXRpb25EYXRhLmxhc3RfbGluZVxuICAgICAgICAgICAgICAgIGZpcnN0X2NvbHVtbjogcHJldkxvY2F0aW9uRGF0YS5sYXN0X2NvbHVtblxuICAgICAgICAgICAgICAgIGxhc3RfbGluZTogICAgcHJldkxvY2F0aW9uRGF0YS5sYXN0X2xpbmVcbiAgICAgICAgICAgICAgICBsYXN0X2NvbHVtbjogIHByZXZMb2NhdGlvbkRhdGEubGFzdF9jb2x1bW5cbiAgICAgICAgICAgIHJldHVybiAxXG5cbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAgICAgMDAwICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICAjIEJlY2F1c2Ugb3VyIGdyYW1tYXIgaXMgTEFMUigxKSwgaXQgY2FuJ3QgaGFuZGxlIHNvbWUgc2luZ2xlLWxpbmVcbiAgICAjIGV4cHJlc3Npb25zIHRoYXQgbGFjayBlbmRpbmcgZGVsaW1pdGVycy4gVGhlICoqUmV3cml0ZXIqKiBhZGRzIHRoZSBpbXBsaWNpdFxuICAgICMgYmxvY2tzLCBzbyBpdCBkb2Vzbid0IG5lZWQgdG8uIFRvIGtlZXAgdGhlIGdyYW1tYXIgY2xlYW4gYW5kIHRpZHksIHRyYWlsaW5nXG4gICAgIyBuZXdsaW5lcyB3aXRoaW4gZXhwcmVzc2lvbnMgYXJlIHJlbW92ZWQgYW5kIHRoZSBpbmRlbnRhdGlvbiB0b2tlbnMgb2YgZW1wdHlcbiAgICAjIGJsb2NrcyBhcmUgYWRkZWQuXG4gICAgXG4gICAgbm9ybWFsaXplTGluZXM6IC0+XG4gICAgICAgIHN0YXJ0ZXIgPSBpbmRlbnQgPSBvdXRkZW50ID0gbnVsbFxuXG4gICAgICAgIGNvbmRpdGlvbiA9ICh0b2tlbiwgaSkgLT5cbiAgICAgICAgICAgIHRva2VuWzFdICE9ICc7JyBhbmQgdG9rZW5bMF0gaW4gU0lOR0xFX0NMT1NFUlMgYW5kXG4gICAgICAgICAgICBub3QgKHRva2VuWzBdIGlzICdURVJNSU5BVE9SJyBhbmQgQHRhZyhpICsgMSkgaW4gRVhQUkVTU0lPTl9DTE9TRSkgYW5kXG4gICAgICAgICAgICBub3QgKHRva2VuWzBdIGluIFsnRUxTRScsICdNRVRBX0VMU0UnXSBhbmQgc3RhcnRlciAhPSAnVEhFTicpIGFuZFxuICAgICAgICAgICAgbm90ICh0b2tlblswXSBpbiBbJ0NBVENIJyAnRklOQUxMWSddIGFuZCBzdGFydGVyIGluIFsnLT4nLCAnPT4nXSkgb3JcbiAgICAgICAgICAgIHRva2VuWzBdIGluIENBTExfQ0xPU0VSUyBhbmRcbiAgICAgICAgICAgIChAdG9rZW5zW2kgLSAxXS5uZXdMaW5lIG9yIEB0b2tlbnNbaSAtIDFdWzBdIGlzICdPVVRERU5UJylcblxuICAgICAgICBhY3Rpb24gPSAodG9rZW4sIGkpIC0+XG4gICAgICAgICAgICBAdG9rZW5zLnNwbGljZSAoaWYgQHRhZyhpIC0gMSkgaXMgJywnIHRoZW4gaSAtIDEgZWxzZSBpKSwgMCwgb3V0ZGVudFxuXG4gICAgICAgIEBzY2FuVG9rZW5zICh0b2tlbiwgaSwgdG9rZW5zKSAtPlxuICAgICAgICAgICAgW3RhZ10gPSB0b2tlblxuICAgICAgICAgICAgaWYgdGFnIGlzICdURVJNSU5BVE9SJ1xuICAgICAgICAgICAgICAgIGlmIEB0YWcoaSArIDEpIGluIFsnRUxTRScsICdNRVRBX0VMU0UnXSBhbmQgQHRhZyhpIC0gMSkgIT0gJ09VVERFTlQnXG4gICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSwgMSwgQGluZGVudGF0aW9uKCkuLi5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDFcbiAgICAgICAgICAgICAgICBpZiBAdGFnKGkgKyAxKSBpbiBFWFBSRVNTSU9OX0NMT1NFXG4gICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSwgMVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMFxuICAgICAgICAgICAgaWYgdGFnIGlzICdDQVRDSCdcbiAgICAgICAgICAgICAgICBmb3IgaiBpbiBbMS4uMl0gd2hlbiBAdGFnKGkgKyBqKSBpbiBbJ09VVERFTlQnICdURVJNSU5BVE9SJyAnRklOQUxMWSddXG4gICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSArIGosIDAsIEBpbmRlbnRhdGlvbigpLi4uXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAyICsgalxuICAgICAgICAgICAgaWYgdGFnIGluIFNJTkdMRV9MSU5FUlMgYW5kIEB0YWcoaSArIDEpICE9ICdJTkRFTlQnIGFuZCBub3QgKHRhZyBpcyAnRUxTRScgYW5kIEB0YWcoaSArIDEpIGlzICdJRicpIGFuZCBub3QgKHRhZyBpcyAnTUVUQV9FTFNFJyBhbmQgQHRhZyhpICsgMSkgaXMgJ01FVEFfSUYnKVxuICAgICAgICAgICAgICAgIHN0YXJ0ZXIgPSB0YWdcbiAgICAgICAgICAgICAgICBbaW5kZW50LCBvdXRkZW50XSA9IEBpbmRlbnRhdGlvbiB0b2tlbnNbaV1cbiAgICAgICAgICAgICAgICBpbmRlbnQuZnJvbVRoZW4gICA9IHRydWUgaWYgc3RhcnRlciBpcyAnVEhFTidcbiAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGkgKyAxLCAwLCBpbmRlbnRcbiAgICAgICAgICAgICAgICBAZGV0ZWN0RW5kIGkgKyAyLCBjb25kaXRpb24sIGFjdGlvblxuICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSwgMSBpZiB0YWcgaXMgJ1RIRU4nXG4gICAgICAgICAgICAgICAgcmV0dXJuIDFcbiAgICAgICAgICAgIHJldHVybiAxXG5cbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwICAgIDAwMCAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwIDAwMCAgIFxuICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgIyBUYWcgcG9zdGZpeCBjb25kaXRpb25hbHMgYXMgc3VjaCwgc28gdGhhdCB3ZSBjYW4gcGFyc2UgdGhlbSB3aXRoIGFcbiAgICAjIGRpZmZlcmVudCBwcmVjZWRlbmNlLlxuICAgIFxuICAgIHRhZ1Bvc3RmaXhDb25kaXRpb25hbHM6IC0+XG5cbiAgICAgICAgb3JpZ2luYWwgPSBudWxsXG5cbiAgICAgICAgY29uZGl0aW9uID0gKHRva2VuLCBpKSAtPlxuICAgICAgICAgICAgW3RhZ10gPSB0b2tlblxuICAgICAgICAgICAgW3ByZXZUYWddID0gQHRva2Vuc1tpIC0gMV1cbiAgICAgICAgICAgIHRhZyBpcyAnVEVSTUlOQVRPUicgb3IgKHRhZyBpcyAnSU5ERU5UJyBhbmQgcHJldlRhZyBub3QgaW4gU0lOR0xFX0xJTkVSUylcblxuICAgICAgICBhY3Rpb24gPSAodG9rZW4sIGkpIC0+XG4gICAgICAgICAgICBpZiB0b2tlblswXSBub3QgaW4gWydJTkRFTlQnXSBvciAodG9rZW4uZ2VuZXJhdGVkIGFuZCBub3QgdG9rZW4uZnJvbVRoZW4pXG4gICAgICAgICAgICAgICAgb3JpZ2luYWxbMF0gPSAnUE9TVF8nICsgb3JpZ2luYWxbMF1cblxuICAgICAgICBAc2NhblRva2VucyAodG9rZW4sIGkpIC0+XG4gICAgICAgICAgICByZXR1cm4gMSB1bmxlc3MgdG9rZW5bMF0gaW4gWydJRicsICdNRVRBX0lGJ11cbiAgICAgICAgICAgIG9yaWdpbmFsID0gdG9rZW5cbiAgICAgICAgICAgIEBkZXRlY3RFbmQgaSArIDEsIGNvbmRpdGlvbiwgYWN0aW9uXG4gICAgICAgICAgICByZXR1cm4gMVxuXG4gICAgIyBHZW5lcmF0ZSB0aGUgaW5kZW50YXRpb24gdG9rZW5zLCBiYXNlZCBvbiBhbm90aGVyIHRva2VuIG9uIHRoZSBzYW1lIGxpbmUuXG4gICAgXG4gICAgaW5kZW50YXRpb246IChvcmlnaW4pIC0+XG4gICAgICAgIFxuICAgICAgICBpbmRlbnQgID0gWydJTkRFTlQnLCA0XVxuICAgICAgICBvdXRkZW50ID0gWydPVVRERU5UJywgNF1cbiAgICAgICAgaWYgb3JpZ2luXG4gICAgICAgICAgICBpbmRlbnQuZ2VuZXJhdGVkID0gb3V0ZGVudC5nZW5lcmF0ZWQgPSB5ZXNcbiAgICAgICAgICAgIGluZGVudC5vcmlnaW4gPSBvdXRkZW50Lm9yaWdpbiA9IG9yaWdpblxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpbmRlbnQuZXhwbGljaXQgPSBvdXRkZW50LmV4cGxpY2l0ID0geWVzXG4gICAgICAgIFtpbmRlbnQsIG91dGRlbnRdXG5cbiAgICAjIENyZWF0ZSBhIGdlbmVyYXRlZCB0b2tlbjogb25lIHRoYXQgZXhpc3RzIGR1ZSB0byBhIHVzZSBvZiBpbXBsaWNpdCBzeW50YXguXG4gICAgXG4gICAgQGdlbmVyYXRlOiAodGFnLCB2YWx1ZSwgb3JpZ2luKSAtPlxuICAgICAgICB0b2sgPSBbdGFnLCB2YWx1ZV1cbiAgICAgICAgdG9rLmdlbmVyYXRlZCA9IHllc1xuICAgICAgICB0b2sub3JpZ2luID0gb3JpZ2luIGlmIG9yaWdpblxuICAgICAgICB0b2tcbiAgICAgICAgXG4gICAgZ2VuZXJhdGU6IFJld3JpdGVyLmdlbmVyYXRlXG5cbiAgICB0YWc6IChpKSAtPiBAdG9rZW5zW2ldP1swXSAjIExvb2sgdXAgYSB0YWcgYnkgdG9rZW4gaW5kZXguXG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuXG4jIExpc3Qgb2YgdGhlIHRva2VuIHBhaXJzIHRoYXQgbXVzdCBiZSBiYWxhbmNlZC5cblxuQkFMQU5DRURfUEFJUlMgPSBbXG4gICAgWycoJycpJ11cbiAgICBbJ1snJ10nXVxuICAgIFsneycnfSddXG4gICAgWydJTkRFTlQnJ09VVERFTlQnXSxcbiAgICBbJ0NBTExfU1RBUlQnJ0NBTExfRU5EJ11cbiAgICBbJ1BBUkFNX1NUQVJUJydQQVJBTV9FTkQnXVxuICAgIFsnSU5ERVhfU1RBUlQnJ0lOREVYX0VORCddXG4gICAgWydTVFJJTkdfU1RBUlQnJ1NUUklOR19FTkQnXVxuICAgIFsnUkVHRVhfU1RBUlQnJ1JFR0VYX0VORCddXG5dXG5cbiMgVGhlIGludmVyc2UgbWFwcGluZ3Mgb2YgYEJBTEFOQ0VEX1BBSVJTYCB3ZSdyZSB0cnlpbmcgdG8gZml4IHVwLCBzbyB3ZSBjYW4gbG9vayB0aGluZ3MgdXAgZnJvbSBlaXRoZXIgZW5kLlxuXG4jIFRoZSB0b2tlbnMgdGhhdCBzaWduYWwgdGhlIHN0YXJ0L2VuZCBvZiBhIGJhbGFuY2VkIHBhaXIuXG5FWFBSRVNTSU9OX1NUQVJUID0gW11cbkVYUFJFU1NJT05fRU5EICAgPSBbXVxuXG5JTlZFUlNFUyA9IHt9XG5mb3IgW2xlZnQsIHJpdGVdIGluIEJBTEFOQ0VEX1BBSVJTXG4gICAgRVhQUkVTU0lPTl9TVEFSVC5wdXNoIElOVkVSU0VTW3JpdGVdID0gbGVmdFxuICAgIEVYUFJFU1NJT05fRU5EICAucHVzaCBJTlZFUlNFU1tsZWZ0XSA9IHJpdGVcblxuUmV3cml0ZXIuSU5WRVJTRVMgPSBJTlZFUlNFU1xuICAgIFxuIyBUb2tlbnMgdGhhdCBpbmRpY2F0ZSB0aGUgY2xvc2Ugb2YgYSBjbGF1c2Ugb2YgYW4gZXhwcmVzc2lvbi5cbkVYUFJFU1NJT05fQ0xPU0UgPSBbJ0NBVENIJyAnVEhFTicgJ0VMU0UnICdNRVRBX0VMU0UnICdGSU5BTExZJ10uY29uY2F0IEVYUFJFU1NJT05fRU5EXG5cbiMgVG9rZW5zIHRoYXQsIGlmIGZvbGxvd2VkIGJ5IGFuIGBJTVBMSUNJVF9DQUxMYCwgaW5kaWNhdGUgYSBmdW5jdGlvbiBpbnZvY2F0aW9uLlxuSU1QTElDSVRfRlVOQyA9IFsnSURFTlRJRklFUicgJ1BST1BFUlRZJyAnU1VQRVInICcpJyAnQ0FMTF9FTkQnICddJyAnSU5ERVhfRU5EJyAnQCcgJ1RISVMnXVxuXG4jIElmIHByZWNlZGVkIGJ5IGFuIGBJTVBMSUNJVF9GVU5DYCwgaW5kaWNhdGVzIGEgZnVuY3Rpb24gaW52b2NhdGlvbi5cbklNUExJQ0lUX0NBTEwgPSBbXG4gICAgJ0lERU5USUZJRVInICdQUk9QRVJUWScgJ05VTUJFUicgJ0lORklOSVRZJyAnTkFOJ1xuICAgICdTVFJJTkcnICdTVFJJTkdfU1RBUlQnICdSRUdFWCcgJ1JFR0VYX1NUQVJUJyAnSlMnXG4gICAgJ05FVycgJ1BBUkFNX1NUQVJUJyAnQ0xBU1MnICdJRicgJ01FVEFfSUYnLCAnVFJZJyAnU1dJVENIJyAnVEhJUydcbiAgICAnVU5ERUZJTkVEJyAnTlVMTCcgJ0JPT0wnXG4gICAgJ1VOQVJZJyAnWUlFTEQnICdVTkFSWV9NQVRIJyAnU1VQRVInICdUSFJPVydcbiAgICAnQCcgJy0+JyAnPT4nICdbJyAnKCcgJ3snICctLScgJysrJ1xuXVxuXG5JTVBMSUNJVF9VTlNQQUNFRF9DQUxMID0gWycrJyAnLSddXG5cbiMgVG9rZW5zIHRoYXQgYWx3YXlzIG1hcmsgdGhlIGVuZCBvZiBhbiBpbXBsaWNpdCBjYWxsIGZvciBzaW5nbGUtbGluZXJzLlxuSU1QTElDSVRfRU5EID0gWydQT1NUX0lGJyAnUE9TVF9NRVRBX0lGJyAnRk9SJyAnV0hJTEUnICdVTlRJTCcgJ1dIRU4nICdCWScgJ0xPT1AnICdURVJNSU5BVE9SJ11cblxuIyBTaW5nbGUtbGluZSBmbGF2b3JzIG9mIGJsb2NrIGV4cHJlc3Npb25zIHRoYXQgaGF2ZSB1bmNsb3NlZCBlbmRpbmdzLlxuIyBUaGUgZ3JhbW1hciBjYW4ndCBkaXNhbWJpZ3VhdGUgdGhlbSwgc28gd2UgaW5zZXJ0IHRoZSBpbXBsaWNpdCBpbmRlbnRhdGlvbi5cblNJTkdMRV9MSU5FUlMgID0gWydFTFNFJyAnTUVUQV9FTFNFJyAnLT4nICc9PicgJ1RSWScgJ0ZJTkFMTFknICdUSEVOJ11cblNJTkdMRV9DTE9TRVJTID0gWydURVJNSU5BVE9SJyAnQ0FUQ0gnICdGSU5BTExZJyAnRUxTRScgJ01FVEFfRUxTRScgJ09VVERFTlQnICdMRUFESU5HX1dIRU4nXVxuXG4jIFRva2VucyB0aGF0IGVuZCBhIGxpbmUuXG5MSU5FQlJFQUtTID0gWydURVJNSU5BVE9SJyAnSU5ERU5UJyAnT1VUREVOVCddXG5cbiMgVG9rZW5zIHRoYXQgY2xvc2Ugb3BlbiBjYWxscyB3aGVuIHRoZXkgZm9sbG93IGEgbmV3bGluZS5cbkNBTExfQ0xPU0VSUyA9IFsnLicgJz8uJyAnOjonICc/OjonXVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJld3JpdGVyXG4iXX0=
//# sourceURL=../coffee/rewriter.coffee