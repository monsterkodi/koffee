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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmV3cml0ZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHdQQUFBO0lBQUE7OztBQVFFLGFBQWUsT0FBQSxDQUFRLFlBQVI7O0FBU1g7Ozt1QkFPRixPQUFBLEdBQVMsU0FBQyxPQUFELEVBQVUsSUFBVjtRQUFDLElBQUMsQ0FBQSxTQUFEO1FBQVMsSUFBQyxDQUFBLE9BQUQ7UUFFZixJQUFDLENBQUEscUJBQUQsQ0FBQTtRQUVBLElBQUMsQ0FBQSxTQUFELENBQUE7UUFFQSxJQUFDLENBQUEsY0FBRCxDQUFBO1FBQ0EsSUFBQyxDQUFBLGdCQUFELENBQUE7UUFDQSxJQUFDLENBQUEsY0FBRCxDQUFBO1FBQ0EsSUFBQyxDQUFBLHNCQUFELENBQUE7UUFDQSxJQUFDLENBQUEsMEJBQUQsQ0FBQTtRQUVBLElBQXVCLFVBQUEsQ0FBVyxJQUFDLENBQUEsSUFBWixFQUFrQixtQkFBbEIsQ0FBdkI7WUFBQSxJQUFDLENBQUEsZ0JBQUQsQ0FBQSxFQUFBOztRQUNBLElBQXVCLFVBQUEsQ0FBVyxJQUFDLENBQUEsSUFBWixFQUFrQixnQkFBbEIsQ0FBdkI7WUFBQSxJQUFDLENBQUEsYUFBRCxDQUFBLEVBQUE7O1FBRUEsSUFBQyxDQUFBLGdDQUFELENBQUE7UUFDQSxJQUFDLENBQUEsc0JBQUQsQ0FBQTtlQUNBLElBQUMsQ0FBQTtJQWpCSTs7dUJBd0JULFVBQUEsR0FBWSxTQUFDLEtBQUQ7QUFFUixZQUFBO1FBQUMsU0FBVTtRQUNYLENBQUEsR0FBSTtBQUNtQyxlQUFNLEtBQUEsR0FBUSxNQUFPLENBQUEsQ0FBQSxDQUFyQjtZQUF2QyxDQUFBLElBQUssS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFYLEVBQWlCLEtBQWpCLEVBQXdCLENBQXhCLEVBQTJCLE1BQTNCO1FBQWtDO2VBQ3ZDO0lBTFE7O3VCQU9aLFNBQUEsR0FBVyxTQUFDLENBQUQsRUFBSSxTQUFKLEVBQWUs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LGFBQUEsR0FBaUIsQ0FBQyxNQUFELEVBQVEsV0FBUixFQUFvQixJQUFwQixFQUF5QixJQUF6QixFQUE4QixLQUE5QixFQUFvQyxTQUFwQyxFQUE4QyxNQUE5Qzs7QUFDakIsY0FBQSxHQUFpQixDQUFDLFlBQUQsRUFBYyxPQUFkLEVBQXNCLFNBQXRCLEVBQWdDLE1BQWhDLEVBQXVDLFdBQXZDLEVBQW1ELFNBQW5ELEVBQTZELGNBQTdEOztBQUdqQixVQUFBLEdBQWEsQ0FBQyxZQUFELEVBQWMsUUFBZCxFQUF1QixTQUF2Qjs7QUFHYixZQUFBLEdBQWUsQ0FBQyxHQUFELEVBQUssSUFBTCxFQUFVLElBQVYsRUFBZSxLQUFmOztBQUVmLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuMDAwICAgMDAwICAwMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbjAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4wMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuMDAwICAgMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiMjI1xuXG57IGhhc0ZlYXR1cmUgfSA9IHJlcXVpcmUgJy4vZmVhdHVyZXMnXG5cbiMgVGhlIGxhbmd1YWdlIGhhcyBhIGdvb2QgZGVhbCBvZiBvcHRpb25hbCwgaW1wbGljaXQgYW5kIHNob3J0aGFuZCBzeW50YXguIFxuIyBUaGlzIGNhbiBncmVhdGx5IGNvbXBsaWNhdGUgYSBncmFtbWFyIGFuZCBibG9hdCB0aGUgcmVzdWx0aW5nIHBhcnNlIHRhYmxlLiBcbiMgSW5zdGVhZCBvZiBtYWtpbmcgdGhlIHBhcnNlciBoYW5kbGUgaXQgYWxsLCB3ZSB0YWtlIGEgc2VyaWVzIG9mIHBhc3NlcyBvdmVyIHRoZSB0b2tlbiBzdHJlYW0sIFxuIyB1c2luZyB0aGlzIFJld3JpdGVyIHRvIGNvbnZlcnQgc2hvcnRoYW5kIGludG8gdGhlIHVuYW1iaWd1b3VzIGxvbmcgZm9ybSwgXG4jIGFkZCBpbXBsaWNpdCBpbmRlbnRhdGlvbiBhbmQgcGFyZW50aGVzZXMsIGFuZCBnZW5lcmFsbHkgY2xlYW4gdGhpbmdzIHVwLlxuIyBUaGUgUmV3cml0ZXIgaXMgdXNlZCBieSB0aGUgTGV4ZXIsIGRpcmVjdGx5IGFnYWluc3QgaXRzIGludGVybmFsIGFycmF5IG9mIHRva2Vucy5cblxuY2xhc3MgUmV3cml0ZXJcblxuICAgICMgUmV3cml0ZSB0aGUgdG9rZW4gc3RyZWFtIGluIG11bHRpcGxlIHBhc3Nlcywgb25lIGxvZ2ljYWwgZmlsdGVyIGF0IGEgdGltZS4gXG4gICAgIyBUaGlzIGNvdWxkIGNlcnRhaW5seSBiZSBjaGFuZ2VkIGludG8gYSBzaW5nbGUgcGFzcyB0aHJvdWdoIHRoZSBzdHJlYW0sIHdpdGggYSBiaWcgc3dpdGNoLCBcbiAgICAjIGJ1dCBpdCdzIG11Y2ggbmljZXIgdG8gd29yayB3aXRoIGxpa2UgdGhpcy4gXG4gICAgIyBUaGUgb3JkZXIgb2YgdGhlc2UgcGFzc2VzIG1hdHRlcnMgLS0gaW5kZW50YXRpb24gbXVzdCBiZSBjb3JyZWN0ZWQgYmVmb3JlIGltcGxpY2l0IHBhcmVudGhlc2VzIGNhbiBiZSB3cmFwcGVkIGFyb3VuZCBibG9ja3Mgb2YgY29kZS5cbiAgICBcbiAgICByZXdyaXRlOiAoQHRva2VucywgQG9wdHMpIC0+XG4gICAgICAgIFxuICAgICAgICBAcmVtb3ZlTGVhZGluZ05ld2xpbmVzKClcbiAgICAgICAgXG4gICAgICAgIEBzaG9ydGN1dHMoKSAjIGtvZmZlZVxuICAgICAgICBcbiAgICAgICAgQGNsb3NlT3BlbkNhbGxzKClcbiAgICAgICAgQGNsb3NlT3BlbkluZGV4ZXMoKVxuICAgICAgICBAbm9ybWFsaXplTGluZXMoKVxuICAgICAgICBAdGFnUG9zdGZpeENvbmRpdGlvbmFscygpXG4gICAgICAgIEBhZGRJbXBsaWNpdEJyYWNlc0FuZFBhcmVucygpXG4gICAgICAgIFxuICAgICAgICBAY29uZmlnUGFyYW1ldGVycygpIGlmIGhhc0ZlYXR1cmUgQG9wdHMsICdjb25maWdfcGFyYW1ldGVycycgIyBrb2ZmZWVcbiAgICAgICAgQG5lZ2F0aXZlSW5kZXgoKSAgICBpZiBoYXNGZWF0dXJlIEBvcHRzLCAnbmVnYXRpdmVfaW5kZXgnICAgICMga29mZmVlXG4gICAgICAgIFxuICAgICAgICBAYWRkTG9jYXRpb25EYXRhVG9HZW5lcmF0ZWRUb2tlbnMoKVxuICAgICAgICBAZml4T3V0ZGVudExvY2F0aW9uRGF0YSgpICAgXG4gICAgICAgIEB0b2tlbnNcblxuICAgICMgUmV3cml0ZSB0aGUgdG9rZW4gc3RyZWFtLCBsb29raW5nIG9uZSB0b2tlbiBhaGVhZCBhbmQgYmVoaW5kLlxuICAgICMgQWxsb3cgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgYmxvY2sgdG8gdGVsbCB1cyBob3cgbWFueSB0b2tlbnMgdG8gbW92ZVxuICAgICMgZm9yd2FyZHMgKG9yIGJhY2t3YXJkcykgaW4gdGhlIHN0cmVhbSwgdG8gbWFrZSBzdXJlIHdlIGRvbid0IG1pc3MgYW55dGhpbmdcbiAgICAjIGFzIHRva2VucyBhcmUgaW5zZXJ0ZWQgYW5kIHJlbW92ZWQsIGFuZCB0aGUgc3RyZWFtIGNoYW5nZXMgbGVuZ3RoIHVuZGVyIG91ciBmZWV0LlxuICAgIFxuICAgIHNjYW5Ub2tlbnM6IChibG9jaykgLT5cbiAgICAgICAgXG4gICAgICAgIHt0b2tlbnN9ID0gdGhpc1xuICAgICAgICBpID0gMFxuICAgICAgICBpICs9IGJsb2NrLmNhbGwgdGhpcywgdG9rZW4sIGksIHRva2VucyB3aGlsZSB0b2tlbiA9IHRva2Vuc1tpXVxuICAgICAgICB0cnVlXG5cbiAgICBkZXRlY3RFbmQ6IChpLCBjb25kaXRpb24sIGFjdGlvbikgLT5cbiAgICAgICAgXG4gICAgICAgIHt0b2tlbnN9ID0gdGhpc1xuICAgICAgICBsZXZlbHMgPSAwXG4gICAgICAgIHdoaWxlIHRva2VuID0gdG9rZW5zW2ldXG4gICAgICAgICAgICByZXR1cm4gYWN0aW9uLmNhbGwgdGhpcywgdG9rZW4sIGkgaWYgbGV2ZWxzIGlzIDAgYW5kIGNvbmRpdGlvbi5jYWxsIHRoaXMsIHRva2VuLCBpXG4gICAgICAgICAgICByZXR1cm4gYWN0aW9uLmNhbGwgdGhpcywgdG9rZW4sIGkgLSAxIGlmIG5vdCB0b2tlbiBvciBsZXZlbHMgPCAwXG4gICAgICAgICAgICBpZiB0b2tlblswXSBpbiBFWFBSRVNTSU9OX1NUQVJUXG4gICAgICAgICAgICAgICAgbGV2ZWxzICs9IDFcbiAgICAgICAgICAgIGVsc2UgaWYgdG9rZW5bMF0gaW4gRVhQUkVTU0lPTl9FTkRcbiAgICAgICAgICAgICAgICBsZXZlbHMgLT0gMVxuICAgICAgICAgICAgaSArPSAxXG4gICAgICAgIGkgLSAxXG5cbiAgICAjIExlYWRpbmcgbmV3bGluZXMgd291bGQgaW50cm9kdWNlIGFuIGFtYmlndWl0eSBpbiB0aGUgZ3JhbW1hciwgc28gd2UgZGlzcGF0Y2ggdGhlbSBoZXJlLlxuICAgIFxuICAgIHJlbW92ZUxlYWRpbmdOZXdsaW5lczogLT5cbiAgICAgICAgXG4gICAgICAgIGJyZWFrIGZvciBbdGFnXSwgaSBpbiBAdG9rZW5zIHdoZW4gdGFnICE9ICdURVJNSU5BVE9SJ1xuICAgICAgICBAdG9rZW5zLnNwbGljZSAwLCBpIGlmIGlcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG5cbiAgICBkb2VzTWF0Y2g6IChpbmRleCwgbWF0Y2gpIC0+XG5cbiAgICAgICAgaWYgdHlwZW9mKG1hdGNoKSA9PSAnc3RyaW5nJ1xuICAgICAgICAgICAgQHRhZyhpbmRleCkgPT0gbWF0Y2hcbiAgICAgICAgZWxzZSBpZiBtYXRjaC5jb25zdHJ1Y3RvciA9PSBPYmplY3RcbiAgICAgICAgICAgIHQgPSBAdG9rZW5zW2luZGV4XVxuICAgICAgICAgICAga2V5ID0gT2JqZWN0LmtleXMobWF0Y2gpWzBdXG4gICAgICAgICAgICB2YWwgPSBtYXRjaFtrZXldXG4gICAgICAgICAgICB0WzBdID09IGtleSBhbmQgdFsxXSA9PSB2YWxcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZmFsc2VcbiAgICBcbiAgICBjaGVjazogLT4gXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGwgPSBhcmd1bWVudHNcbiAgICAgICAgZm9yIGogaW4gWzAuLi5sLmxlbmd0aF0gYnkgMlxuICAgICAgICAgICAgaW5kZXggPSBsW2pdXG4gICAgICAgICAgICByZXR1cm4gZmFsc2UgaWYgaW5kZXggPCAwXG4gICAgICAgICAgICBpZiBsW2orMV0gaW5zdGFuY2VvZiBBcnJheVxuICAgICAgICAgICAgICAgIGZvdW5kID0gZmFsc2VcbiAgICAgICAgICAgICAgICBmb3IgZSBpbiBsW2orMV1cbiAgICAgICAgICAgICAgICAgICAgaWYgQGRvZXNNYXRjaCBpbmRleCwgZVxuICAgICAgICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIGlmIG5vdCBmb3VuZFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpZiBub3QgQGRvZXNNYXRjaCBpbmRleCwgbFtqKzFdXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB0cnVlXG4gICAgICAgIFxuICAgIGZpbmRNYXRjaGluZ1RhZ0JhY2t3YXJkczogKGNsb3NlLCBpLCBjaGVjaykgLT4gXG4gICAgICAgIFxuICAgICAgICBvcGVuID0geyBQQVJBTV9FTkQ6J1BBUkFNX1NUQVJUJywgJ10nOidbJywgJ30nOid7JyB9W2Nsb3NlXVxuICAgICAgICB3YXJuIFwiY2FudCBtYXRjaCAje2Nsb3NlfVwiIGlmIG5vdCBvcGVuXG4gICAgICAgIHB1c2hlZCA9IDBcbiAgICAgICAgaiA9IGlcbiAgICAgICAgd2hpbGUgai0tICMgd2FsayBiYWNrd2FyZHMgdW50aWwgbWF0Y2hpbmcgdGFnIGlzIGZvdW5kXG4gICAgICAgICAgICBjdXJyZW50ID0gQHRhZyhqKVxuICAgICAgICAgICAgaWYgY3VycmVudCA9PSBjbG9zZVxuICAgICAgICAgICAgICAgIHB1c2hlZCsrXG4gICAgICAgICAgICBlbHNlIGlmIGN1cnJlbnQgPT0gb3BlblxuICAgICAgICAgICAgICAgIGlmIHB1c2hlZFxuICAgICAgICAgICAgICAgICAgICBwdXNoZWQtLVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgcHVzaGVkID09IDAgIyBtYXRjaGluZyBicmFja2V0IGZvdW5kXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpbmRleDpqXG4gICAgICAgICAgICBlbHNlIGlmIGNoZWNrPyBhbmQgbm90IGNoZWNrIGN1cnJlbnQgXG4gICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICBpbmRleDotMVxuXG4gICAgZmluZE1hdGNoaW5nVGFnRm9yd2FyZHM6IChvcGVuLCBpLCBjaGVjaykgLT4gXG4gICAgICAgIFxuICAgICAgICBjbG9zZSA9IHsgU1RSSU5HX1NUQVJUOidTVFJJTkdfRU5EJyB9W29wZW5dXG4gICAgICAgIHdhcm4gXCJjYW50IG1hdGNoICN7b3Blbn1cIiBpZiBub3QgY2xvc2VcbiAgICAgICAgcHVzaGVkID0gMFxuICAgICAgICBqID0gaVxuICAgICAgICB3aGlsZSArK2ogPCBAdG9rZW5zLmxlbmd0aCAjIHdhbGsgZm9yd2FyZCB1bnRpbCBtYXRjaGluZyB0YWcgaXMgZm91bmRcbiAgICAgICAgICAgIGN1cnJlbnQgPSBAdGFnKGopXG4gICAgICAgICAgICAjIGxvZyBcImN1cnJlbnQgI3tqfSAje2N1cnJlbnR9XCJcbiAgICAgICAgICAgIGlmIGN1cnJlbnQgPT0gb3BlblxuICAgICAgICAgICAgICAgIHB1c2hlZCsrXG4gICAgICAgICAgICBlbHNlIGlmIGN1cnJlbnQgPT0gY2xvc2VcbiAgICAgICAgICAgICAgICBpZiBwdXNoZWRcbiAgICAgICAgICAgICAgICAgICAgcHVzaGVkLS1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIHB1c2hlZCA9PSAwICMgbWF0Y2hpbmcgYnJhY2tldCBmb3VuZFxuICAgICAgICAgICAgICAgICAgICAjIGxvZyAnRk9VTkQnXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpbmRleDpqXG4gICAgICAgICAgICBlbHNlIGlmIGNoZWNrPyBhbmQgbm90IGNoZWNrIGN1cnJlbnQgXG4gICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICBpbmRleDotMVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgc2hvcnRjdXRzOiAtPlxuICAgICAgICBcbiAgICAgICAgQHNjYW5Ub2tlbnMgKHRva2VuLCBpLCB0b2tlbnMpIC0+XG5cbiAgICAgICAgICAgIGlmIGhhc0ZlYXR1cmUgQG9wdHMsICdjb25zdHJ1Y3Rvcl9zaG9ydGN1dCdcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBAY2hlY2sgaS0xICdAJywgaSwgJzonLCBpKzEgWyctPicgJ1BBUkFNX1NUQVJUJyAnSURFTlRJRklFUiddXG4gICAgICAgICAgICAgICAgICAgIHRva2Vuc1tpLTFdWzBdID0gJ1BST1BFUlRZJ1xuICAgICAgICAgICAgICAgICAgICB0b2tlbnNbaS0xXVsxXSA9ICdjb25zdHJ1Y3RvcidcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDFcbiAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGhhc0ZlYXR1cmUgQG9wdHMsICdjb25zb2xlX3Nob3J0Y3V0J1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgQGNoZWNrIGksIFt7SURFTlRJRklFUjonbG9nJ30ge0lERU5USUZJRVI6J3dhcm4nfSB7SURFTlRJRklFUjonZXJyb3InfV0sIGkrMSBbJ05VTUJFUicgJ0lERU5USUZJRVInICdQUk9QRVJUWScgJ1NUUklORycgJ1NUUklOR19TVEFSVCcgJ0NBTExfU1RBUlQnICdJRicgJ01FVEFfSUYnICdbJyAnKCcgJ3snICdAJ11cbiAgICAgICAgICAgICAgICAgICAgdG9rZW5bMF0gPSAnUFJPUEVSVFknXG4gICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSwgMCBAZ2VuZXJhdGUoJ0lERU5USUZJRVInJ2NvbnNvbGUnIHRva2VuKSwgQGdlbmVyYXRlKCcuJycuJyB0b2tlbilcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDNcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBoYXNGZWF0dXJlIEBvcHRzLCAnb3B0aW9uYWxfY29tbWF0YSdcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBAY2hlY2sgaSwgWydOVU1CRVInJ1NUUklORycnTlVMTCcnVU5ERUZJTkVEJydCT09MJydTVFJJTkdfRU5EJyd9J10sIGkrMSBbJ05VTUJFUicnU1RSSU5HJydOVUxMJydVTkRFRklORUQnJ0JPT0wnJ1NUUklOR19TVEFSVCcnUEFSQU1fU1RBUlQnJ0lERU5USUZJRVInJ1BST1BFUlRZJyd7JycoJydbJyctPicnPT4nJ0AnJ1VOQVJZJ11cbiAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpKzEgMCBAZ2VuZXJhdGUgJywnJywnXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAyXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIEB0YWcoaSkgaW4gWyddJ10gYW5kIHRva2Vuc1tpXS5zcGFjZWQgYW5kIEB0YWcoaSsxKSBpbiBbJ05VTUJFUicnU1RSSU5HJydTVFJJTkdfU1RBUlQnJ0lERU5USUZJRVInJ1BST1BFUlRZJyd7JycoJydbJ10gIFxuICAgICAgICAgICAgICAgICAgICBtYXRjaCA9IEBmaW5kTWF0Y2hpbmdUYWdCYWNrd2FyZHMgQHRhZyhpKSwgaSwgKHRhZykgLT4gdGFnIGluIFsnTlVNQkVSJydTVFJJTkcnJ1BST1BFUlRZJyc6JycsJ11cbiAgICAgICAgICAgICAgICAgICAgaWYgbWF0Y2guaW5kZXggPj0gMFxuICAgICAgICAgICAgICAgICAgICAgICAgIyBpbnNlcnQgY29tbWEgaWYgbWF0Y2hpbmcgYnJhY2tldCBpcyBub3QgcHJlY2VkZWQgYnkgaWRlbnRpZmllciBvciBlbmQgb2YgY2FsbFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbWF0Y2guaW5kZXggPT0gMCBvciBAdGFnKG1hdGNoLmluZGV4LTEpIG5vdCBpbiBbJ0lERU5USUZJRVInJ0NBTExfRU5EJ10gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpKzEgMCBAZ2VuZXJhdGUgJywnJywnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGhhc0ZlYXR1cmUgQG9wdHMsICdtZXRhJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgQGNoZWNrIGksIFtVTkFSWV9NQVRIOid+J10sIGkrMSBbQ09NUEFSRTonPiddLCBpKzIgWydJREVOVElGSUVSJydJRicnVEhFTicnRUxTRSddXG4gICAgICAgICAgICAgICAgICAgIGlmIEB0YWcoaSsyKSA9PSAnSURFTlRJRklFUidcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHRva2Vuc1tpKzJdWzFdID09ICdlbGlmJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSwgMyBAZ2VuZXJhdGUoJ01FVEFfRUxTRScnZWxzZScpLCBAZ2VuZXJhdGUoJ01FVEFfSUYnJ2lmJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnNbaV0uc3BhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vuc1tpKzFdLnNwYWNlZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vuc1tpKzJdWzFdID0gJ+KWuCcrdG9rZW5zW2krMl1bMV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnNbaSsyXVswXSA9ICdJREVOVElGSUVSJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSwgMlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vuc1tpKzJdWzBdID0gJ01FVEFfJyt0b2tlbnNbaSsyXVswXSBpZiB0b2tlbnNbaSsyXVswXSAhPSAnVEhFTidcbiAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSwgMlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiB0b2tlblsxXVswXSA9PSAn4pa4J1xuICAgICAgICAgICAgICAgICAgICBpZiBAdGFnKGktMSkgbm90IGluIFsnTUVUQV9JRiddXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiB0b2tlblsxXSBpbiBPYmplY3Qua2V5cyBAb3B0cy5tZXRhXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YSA9IEBvcHRzLm1ldGFbdG9rZW5bMV1dXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpLCAwLCBAZ2VuZXJhdGUgJ01FVEFfSUYnJ2lmJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vuc1tpXS5zcGFjZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWR2ID0gMlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIEB0YWcoaSthZHYpID09ICdDQUxMX1NUQVJUJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSBAdGFnKGkrYWR2KyspIG5vdCBpbiBbJ0NBTExfRU5EJycpJydURVJNSU5BVE9SJ11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIGEgaW4gWzAuLi4obWV0YS5pbmZvPy5hcmdzID8gMSldXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBAdGFnKGkrYWR2KSBpbiBbJ05VTUJFUicnU1RSSU5HJ11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmcrKyAjIGFyZ3VtZW50IGZvdW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWR2KytcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgQHRhZyhpK2FkdikgPT0gJ1NUUklOR19TVEFSVCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaCA9IEBmaW5kTWF0Y2hpbmdUYWdGb3J3YXJkcyBAdGFnKGkrYWR2KSwgaSthZHZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBtYXRjaC5pbmRleCA+PSAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZysrICMgc3RyaW5nIGludGVycG9sYXRpb24gYXJndW1lbnQgZm91bmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWR2Kz0gbWF0Y2guaW5kZXggLSBpIC0gMSAjIGNhbiB3ZSBhZHZhbmNlIG92ZXIgdGhlIHdob2xlIGludGVycG9sYXRpb24/IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZyAnbWF0Y2ggaW5kZXgnIG1hdGNoLCBAdGFnKGkrYWR2KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIGFyZyA9PSAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGkrYWR2LCAwLCBAZ2VuZXJhdGUoJ0NBTExfU1RBUlQnJygnKSwgQGdlbmVyYXRlKCdDQUxMX0VORCcnKScpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZHYgKz0gMlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIG1ldGEuaW5mbz8udGhlbiBvciBAdGFnKGkrYWR2KSBub3QgaW4gWydURVJNSU5BVE9SJydJTkRFTlQnJ0NBTExfU1RBUlQnXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGkrYWR2KyssIDAgQGdlbmVyYXRlICdUSEVOJyd0aGVuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhZHZcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIDFcbiAgICBcbiAgICBuZWdhdGl2ZUluZGV4OiAtPlxuXG4gICAgICAgIEBzY2FuVG9rZW5zICh0b2tlbiwgaSwgdG9rZW5zKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBAY2hlY2sgaS0xICdJTkRFWF9TVEFSVCcgaSwgJy0nIGkrMSAnTlVNQkVSJyBpKzIgJ0lOREVYX0VORCdcbiAgICAgICAgICAgICAgICBpZiBAdGFnKGktMikgaW4gWydJREVOVElGSUVSJydQUk9QRVJUWScnU1RSSU5HJydTVFJJTkdfRU5EJyddJycpJ11cbiAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpKzIgMCBAZ2VuZXJhdGUoJy4uJycuLicpLCBAZ2VuZXJhdGUodG9rZW5zW2ldWzBdLCB0b2tlbnNbaV1bMV0pLCBAZ2VuZXJhdGUodG9rZW5zW2krMV1bMF0sIHRva2Vuc1tpKzFdWzFdKVxuICAgICAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGkrNiAwIEBnZW5lcmF0ZSgnSU5ERVhfU1RBUlQnJ1snKSwgQGdlbmVyYXRlKCdOVU1CRVInJzAnKSwgQGdlbmVyYXRlKCdJTkRFWF9FTkQnJ10nKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gN1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgbG9nIEB0YWcoaS0yKVxuICAgICAgICAgICAgMVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwICAgICAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMCAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgY29uZmlnUGFyYW1ldGVyczogLT5cbiAgICAgICAgXG4gICAgICAgIGRpY3RQYXJhbVN0YXJ0ID0gMFxuICAgICAgICBkaWN0UGFyYW1FbmQgICA9IDBcbiAgICAgICAgc3RhY2tDb3VudCAgICAgPSAwXG4gICAgICAgIFxuICAgICAgICBpc0luc2lkZSA9IC0+IGRpY3RQYXJhbVN0YXJ0IGFuZCBub3Qgc3RhY2tDb3VudFxuICAgICAgICBcbiAgICAgICAgQHNjYW5Ub2tlbnMgKHRva2VuLCBpLCB0b2tlbnMpIC0+XG5cbiAgICAgICAgICAgIFt0YWddICAgICA9IHRva2VuXG4gICAgICAgICAgICBbcHJldlRhZ10gPSBwcmV2VG9rZW4gPSBpZiBpID4gMCB0aGVuIHRva2Vuc1tpIC0gMV0gZWxzZSBbXVxuICAgICAgICAgICAgW25leHRUYWddID0gaWYgaSA8IHRva2Vucy5sZW5ndGggLSAxIHRoZW4gdG9rZW5zW2kgKyAxXSBlbHNlIFtdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHRhZyBpcyAneydcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBwcmV2VGFnID09ICdQQVJBTV9TVEFSVCcgb3IgcHJldlRhZyBub3QgaW4gWydbJyd7J10gYW5kIEBmaW5kTWF0Y2hpbmdUYWdCYWNrd2FyZHMoJ1BBUkFNX0VORCcgaSkuaW5kZXggPj0gMFxuICAgICAgICAgICAgICAgICAgICBpZiBub3QgZGljdFBhcmFtU3RhcnRcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpY3RQYXJhbVN0YXJ0ID0gaVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFja0NvdW50KytcbiAgICAgICAgICAgICAgICBlbHNlIGlmIGRpY3RQYXJhbVN0YXJ0XG4gICAgICAgICAgICAgICAgICAgIHN0YWNrQ291bnQrK1xuICAgICAgICAgICAgZWxzZSBpZiB0YWcgaXMgJ30nXG4gICAgICAgICAgICAgICAgaWYgZGljdFBhcmFtU3RhcnQgXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vdCBzdGFja0NvdW50XG4gICAgICAgICAgICAgICAgICAgICAgICBkaWN0UGFyYW1FbmQgPSBpXG4gICAgICAgICAgICAgICAgICAgICAgICBkaWN0UGFyYW1TdGFydCA9IDBcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2tDb3VudC0tXG4gICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgIGlmIGlzSW5zaWRlKClcbiAgICAgICAgICAgICAgICAgICAgaWYgdGFnID09ICc6JyBhbmQgbmV4dFRhZyBub3QgaW4gWydJREVOVElGSUVSJydAJ11cbiAgICAgICAgICAgICAgICAgICAgICAgIG9wZW4gPSBAZmluZE1hdGNoaW5nVGFnQmFja3dhcmRzICd9JyBpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBvcGVuLmluZGV4ID49IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBAdGFnKG9wZW4uaW5kZXgtMSkgbm90IGluIFsnPSddXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSwgMSBAZ2VuZXJhdGUgJz0nJz0nIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBuZXh0VGFnIGluIFsnLCcnfSddXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGkrMSAwIEBnZW5lcmF0ZSAnTlVMTCcnbnVsbCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAyXG4gICAgICAgICAgICAxXG4gICAgICAgICAgICAgICAgIFxuICAgICMgVGhlIGxleGVyIGhhcyB0YWdnZWQgdGhlIG9wZW5pbmcgcGFyZW50aGVzaXMgb2YgYSBtZXRob2QgY2FsbC4gTWF0Y2ggaXQgd2l0aFxuICAgICMgaXRzIHBhaXJlZCBjbG9zZS4gV2UgaGF2ZSB0aGUgbWlzLW5lc3RlZCBvdXRkZW50IGNhc2UgaW5jbHVkZWQgaGVyZSBmb3JcbiAgICAjIGNhbGxzIHRoYXQgY2xvc2Ugb24gdGhlIHNhbWUgbGluZSwganVzdCBiZWZvcmUgdGhlaXIgb3V0ZGVudC5cbiAgICBcbiAgICBjbG9zZU9wZW5DYWxsczogLT5cbiAgICAgICAgXG4gICAgICAgIGNvbmRpdGlvbiA9ICh0b2tlbiwgaSkgLT5cbiAgICAgICAgICAgIHRva2VuWzBdIGluIFsnKScgJ0NBTExfRU5EJ10gb3JcbiAgICAgICAgICAgIHRva2VuWzBdIGlzICdPVVRERU5UJyBhbmQgQHRhZyhpIC0gMSkgaXMgJyknXG5cbiAgICAgICAgYWN0aW9uID0gKHRva2VuLCBpKSAtPlxuICAgICAgICAgICAgQHRva2Vuc1tpZiB0b2tlblswXSBpcyAnT1VUREVOVCcgdGhlbiBpIC0gMSBlbHNlIGldWzBdID0gJ0NBTExfRU5EJ1xuXG4gICAgICAgIEBzY2FuVG9rZW5zICh0b2tlbiwgaSkgLT5cbiAgICAgICAgICAgIEBkZXRlY3RFbmQgaSArIDEsIGNvbmRpdGlvbiwgYWN0aW9uIGlmIHRva2VuWzBdIGlzICdDQUxMX1NUQVJUJ1xuICAgICAgICAgICAgMVxuXG4gICAgIyBUaGUgbGV4ZXIgaGFzIHRhZ2dlZCB0aGUgb3BlbmluZyBwYXJlbnRoZXNpcyBvZiBhbiBpbmRleGluZyBvcGVyYXRpb24gY2FsbC5cbiAgICAjIE1hdGNoIGl0IHdpdGggaXRzIHBhaXJlZCBjbG9zZS5cbiAgICBcbiAgICBjbG9zZU9wZW5JbmRleGVzOiAtPlxuICAgICAgICBcbiAgICAgICAgY29uZGl0aW9uID0gKHRva2VuLCBpKSAtPlxuICAgICAgICAgICAgdG9rZW5bMF0gaW4gWyddJyAnSU5ERVhfRU5EJ11cblxuICAgICAgICBhY3Rpb24gPSAodG9rZW4sIGkpIC0+XG4gICAgICAgICAgICB0b2tlblswXSA9ICdJTkRFWF9FTkQnXG5cbiAgICAgICAgQHNjYW5Ub2tlbnMgKHRva2VuLCBpKSAtPlxuICAgICAgICAgICAgQGRldGVjdEVuZCBpICsgMSwgY29uZGl0aW9uLCBhY3Rpb24gaWYgdG9rZW5bMF0gaXMgJ0lOREVYX1NUQVJUJ1xuICAgICAgICAgICAgMVxuXG4gICAgIyBNYXRjaCB0YWdzIGluIHRva2VuIHN0cmVhbSBzdGFydGluZyBhdCBgaWAgd2l0aCBgcGF0dGVybmAsIHNraXBwaW5nICdIRVJFQ09NTUVOVCdzLlxuICAgICMgYHBhdHRlcm5gIG1heSBjb25zaXN0IG9mIHN0cmluZ3MgKGVxdWFsaXR5KSwgYW4gYXJyYXkgb2Ygc3RyaW5ncyAob25lIG9mKVxuICAgICMgb3IgbnVsbCAod2lsZGNhcmQpLiBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgbWF0Y2ggb3IgLTEgaWYgbm8gbWF0Y2guXG4gICAgXG4gICAgaW5kZXhPZlRhZzogKGksIHBhdHRlcm4uLi4pIC0+XG4gICAgICAgIGZ1enogPSAwXG4gICAgICAgIGZvciBqIGluIFswIC4uLiBwYXR0ZXJuLmxlbmd0aF1cbiAgICAgICAgICAgIGZ1enogKz0gMiB3aGlsZSBAdGFnKGkgKyBqICsgZnV6eikgaXMgJ0hFUkVDT01NRU5UJ1xuICAgICAgICAgICAgY29udGludWUgaWYgbm90IHBhdHRlcm5bal0/XG4gICAgICAgICAgICBwYXR0ZXJuW2pdID0gW3BhdHRlcm5bal1dIGlmIHR5cGVvZiBwYXR0ZXJuW2pdIGlzICdzdHJpbmcnXG4gICAgICAgICAgICByZXR1cm4gLTEgaWYgQHRhZyhpICsgaiArIGZ1enopIG5vdCBpbiBwYXR0ZXJuW2pdXG4gICAgICAgIGkgKyBqICsgZnV6eiAtIDFcblxuICAgICMgYEA8eD46YCwgYDx4PjpgIG9yIGA8RVhQUkVTU0lPTl9TVEFSVD48eD4uLi48RVhQUkVTU0lPTl9FTkQ+OmAsIHNraXBwaW5nIG92ZXIgJ0hFUkVDT01NRU5UJ3MuXG4gICAgXG4gICAgbG9va3NPYmplY3Rpc2g6IChqKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHllcyBpZiBAaW5kZXhPZlRhZyhqLCAnQCcsIG51bGwsICc6JykgPiAtMSBvciBAaW5kZXhPZlRhZyhqLCBudWxsLCAnOicpID4gLTFcbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gQGluZGV4T2ZUYWcoaiwgRVhQUkVTU0lPTl9TVEFSVClcbiAgICAgICAgaWYgaW5kZXggPiAtMVxuICAgICAgICAgICAgZW5kID0gbnVsbFxuICAgICAgICAgICAgQGRldGVjdEVuZCBpbmRleCArIDEsICgodG9rZW4pIC0+IHRva2VuWzBdIGluIEVYUFJFU1NJT05fRU5EKSwgKCh0b2tlbiwgaSkgLT4gZW5kID0gaSlcbiAgICAgICAgICAgIHJldHVybiB5ZXMgaWYgQHRhZyhlbmQgKyAxKSBpcyAnOidcbiAgICAgICAgbm9cblxuICAgICMgUmV0dXJucyBgeWVzYCBpZiBjdXJyZW50IGxpbmUgb2YgdG9rZW5zIGNvbnRhaW4gYW4gZWxlbWVudCBvZiB0YWdzIG9uIHNhbWUgZXhwcmVzc2lvbiBsZXZlbC4gXG4gICAgIyBTdG9wIHNlYXJjaGluZyBhdCBMSU5FQlJFQUtTIG9yIGV4cGxpY2l0IHN0YXJ0IG9mIGNvbnRhaW5pbmcgYmFsYW5jZWQgZXhwcmVzc2lvbi5cbiAgICBcbiAgICBmaW5kVGFnc0JhY2t3YXJkczogKGksIHRhZ3MpIC0+XG4gICAgICAgIGJhY2tTdGFjayA9IFtdXG4gICAgICAgIHdoaWxlIGkgPj0gMCBhbmQgKGJhY2tTdGFjay5sZW5ndGggb3JcbiAgICAgICAgICAgICAgICAgICAgQHRhZyhpKSBub3QgaW4gdGFncyBhbmRcbiAgICAgICAgICAgICAgICAgICAgKEB0YWcoaSkgbm90IGluIEVYUFJFU1NJT05fU1RBUlQgb3IgQHRva2Vuc1tpXS5nZW5lcmF0ZWQpIGFuZFxuICAgICAgICAgICAgICAgICAgICBAdGFnKGkpIG5vdCBpbiBMSU5FQlJFQUtTKVxuICAgICAgICAgICAgYmFja1N0YWNrLnB1c2ggQHRhZyhpKSBpZiBAdGFnKGkpIGluIEVYUFJFU1NJT05fRU5EXG4gICAgICAgICAgICBiYWNrU3RhY2sucG9wKCkgaWYgQHRhZyhpKSBpbiBFWFBSRVNTSU9OX1NUQVJUIGFuZCBiYWNrU3RhY2subGVuZ3RoXG4gICAgICAgICAgICBpIC09IDFcbiAgICAgICAgQHRhZyhpKSBpbiB0YWdzXG5cbiAgICAjIDAwMCAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICAjIExvb2sgZm9yIHNpZ25zIG9mIGltcGxpY2l0IGNhbGxzIGFuZCBvYmplY3RzIGluIHRoZSB0b2tlbiBzdHJlYW0gYW5kIGFkZCB0aGVtLlxuICAgICAgICBcbiAgICBhZGRJbXBsaWNpdEJyYWNlc0FuZFBhcmVuczogLT5cblxuICAgICAgICAjIFRyYWNrIGN1cnJlbnQgYmFsYW5jaW5nIGRlcHRoIChib3RoIGltcGxpY2l0IGFuZCBleHBsaWNpdCkgb24gc3RhY2suXG4gICAgICAgIHN0YWNrID0gW11cbiAgICAgICAgc3RhcnQgPSBudWxsXG5cbiAgICAgICAgQHNjYW5Ub2tlbnMgKHRva2VuLCBpLCB0b2tlbnMpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIFt0YWddICAgICA9IHRva2VuXG4gICAgICAgICAgICBbcHJldlRhZ10gPSBwcmV2VG9rZW4gPSBpZiBpID4gMCB0aGVuIHRva2Vuc1tpIC0gMV0gZWxzZSBbXVxuICAgICAgICAgICAgW25leHRUYWddID0gaWYgaSA8IHRva2Vucy5sZW5ndGggLSAxIHRoZW4gdG9rZW5zW2kgKyAxXSBlbHNlIFtdXG4gICAgICAgICAgICBzdGFja1RvcCAgPSAtPiBzdGFja1tzdGFjay5sZW5ndGggLSAxXVxuICAgICAgICAgICAgc3RhcnRJZHggID0gaVxuXG4gICAgICAgICAgICAjIEhlbHBlciBmdW5jdGlvbiwgdXNlZCBmb3Iga2VlcGluZyB0cmFjayBvZiB0aGUgbnVtYmVyIG9mIHRva2VucyBjb25zdW1lZFxuICAgICAgICAgICAgIyBhbmQgc3BsaWNlZCwgd2hlbiByZXR1cm5pbmcgZm9yIGdldHRpbmcgYSBuZXcgdG9rZW4uXG4gICAgICAgICAgICBmb3J3YXJkICAgPSAobikgLT4gaSAtIHN0YXJ0SWR4ICsgblxuXG4gICAgICAgICAgICAjIEhlbHBlciBmdW5jdGlvbnNcbiAgICAgICAgICAgIGlzSW1wbGljaXQgICAgICAgICAgPSAoc3RhY2tJdGVtKSAtPiBzdGFja0l0ZW0/WzJdPy5vdXJzXG4gICAgICAgICAgICBpc0ltcGxpY2l0T2JqZWN0ICAgID0gKHN0YWNrSXRlbSkgLT4gaXNJbXBsaWNpdChzdGFja0l0ZW0pIGFuZCBzdGFja0l0ZW0/WzBdIGlzICd7J1xuICAgICAgICAgICAgaXNJbXBsaWNpdENhbGwgICAgICA9IChzdGFja0l0ZW0pIC0+IGlzSW1wbGljaXQoc3RhY2tJdGVtKSBhbmQgc3RhY2tJdGVtP1swXSBpcyAnKCdcbiAgICAgICAgICAgIGluSW1wbGljaXQgICAgICAgICAgPSAtPiBpc0ltcGxpY2l0IHN0YWNrVG9wKClcbiAgICAgICAgICAgIGluSW1wbGljaXRDYWxsICAgICAgPSAtPiBpc0ltcGxpY2l0Q2FsbCBzdGFja1RvcCgpXG4gICAgICAgICAgICBpbkltcGxpY2l0T2JqZWN0ICAgID0gLT4gaXNJbXBsaWNpdE9iamVjdCBzdGFja1RvcCgpXG4gICAgICAgICAgICAjIFVuY2xvc2VkIGNvbnRyb2wgc3RhdGVtZW50IGluc2lkZSBpbXBsaWNpdCBwYXJlbnMgKGxpa2VcbiAgICAgICAgICAgICMgY2xhc3MgZGVjbGFyYXRpb24gb3IgaWYtY29uZGl0aW9uYWxzKVxuICAgICAgICAgICAgaW5JbXBsaWNpdENvbnRyb2wgPSAtPiBpbkltcGxpY2l0IGFuZCBzdGFja1RvcCgpP1swXSBpcyAnQ09OVFJPTCdcblxuICAgICAgICAgICAgc3RhcnRJbXBsaWNpdENhbGwgPSAoaikgLT5cbiAgICAgICAgICAgICAgICBpZHggPSBqID8gaVxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2ggWycoJywgaWR4LCBvdXJzOiB5ZXNdXG4gICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpZHgsIDAsIFJld3JpdGVyLmdlbmVyYXRlICdDQUxMX1NUQVJUJywgJygnLCBbJycsICdpbXBsaWNpdCBmdW5jdGlvbiBjYWxsJywgdG9rZW5bMl1dXG4gICAgICAgICAgICAgICAgaSArPSAxIGlmIG5vdCBqP1xuXG4gICAgICAgICAgICBlbmRJbXBsaWNpdENhbGwgPSAtPlxuICAgICAgICAgICAgICAgIHN0YWNrLnBvcCgpXG4gICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpLCAwLCBSZXdyaXRlci5nZW5lcmF0ZSAnQ0FMTF9FTkQnLCAnKScsIFsnJywgJ2VuZCBvZiBpbnB1dCcsIHRva2VuWzJdXVxuICAgICAgICAgICAgICAgIGkgKz0gMVxuXG4gICAgICAgICAgICBzdGFydEltcGxpY2l0T2JqZWN0ID0gKGosIHN0YXJ0c0xpbmUgPSB5ZXMpIC0+XG4gICAgICAgICAgICAgICAgaWR4ID0gaiA/IGlcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoIFsneycsIGlkeCwgc2FtZUxpbmU6IHllcywgc3RhcnRzTGluZTogc3RhcnRzTGluZSwgb3VyczogeWVzXVxuICAgICAgICAgICAgICAgIHZhbCA9IG5ldyBTdHJpbmcgJ3snXG4gICAgICAgICAgICAgICAgdmFsLmdlbmVyYXRlZCA9IHllc1xuICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaWR4LCAwLCBSZXdyaXRlci5nZW5lcmF0ZSAneycsIHZhbCwgdG9rZW5cbiAgICAgICAgICAgICAgICBpICs9IDEgaWYgbm90IGo/XG5cbiAgICAgICAgICAgIGVuZEltcGxpY2l0T2JqZWN0ID0gKGopIC0+XG4gICAgICAgICAgICAgICAgaiA9IGogPyBpXG4gICAgICAgICAgICAgICAgc3RhY2sucG9wKClcbiAgICAgICAgICAgICAgICB0b2tlbnMuc3BsaWNlIGosIDAsIFJld3JpdGVyLmdlbmVyYXRlICd9JywgJ30nLCB0b2tlblxuICAgICAgICAgICAgICAgIGkgKz0gMVxuXG4gICAgICAgICAgICAjIERvbid0IGVuZCBhbiBpbXBsaWNpdCBjYWxsIG9uIG5leHQgaW5kZW50IGlmIGFueSBvZiB0aGVzZSBhcmUgaW4gYW4gYXJndW1lbnRcbiAgICAgICAgICAgIGlmIGluSW1wbGljaXRDYWxsKCkgYW5kIHRhZyBpbiBbJ0lGJyAnTUVUQV9JRicsICdUUlknICdGSU5BTExZJyAnQ0FUQ0gnICdDTEFTUycgJ1NXSVRDSCddXG4gICAgICAgICAgICAgICAgc3RhY2sucHVzaCBbJ0NPTlRST0wnLCBpLCBvdXJzOiB5ZXNdXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvcndhcmQoMSlcblxuICAgICAgICAgICAgaWYgdGFnIGlzICdJTkRFTlQnIGFuZCBpbkltcGxpY2l0KClcblxuICAgICAgICAgICAgICAgICMgQW4gYElOREVOVGAgY2xvc2VzIGFuIGltcGxpY2l0IGNhbGwgdW5sZXNzXG4gICAgICAgICAgICAgICAgI1xuICAgICAgICAgICAgICAgICMgICAgMS4gV2UgaGF2ZSBzZWVuIGEgYENPTlRST0xgIGFyZ3VtZW50IG9uIHRoZSBsaW5lLlxuICAgICAgICAgICAgICAgICMgICAgMi4gVGhlIGxhc3QgdG9rZW4gYmVmb3JlIHRoZSBpbmRlbnQgaXMgcGFydCBvZiB0aGUgbGlzdCBiZWxvd1xuICAgICAgICAgICAgICAgICNcbiAgICAgICAgICAgICAgICBpZiBwcmV2VGFnIG5vdCBpbiBbJz0+JyAnLT4nICdbJyAnKCcgJywnICd7JyAnVFJZJyAnRUxTRScsICdNRVRBX0VMU0UnICc9J11cbiAgICAgICAgICAgICAgICAgICAgZW5kSW1wbGljaXRDYWxsKCkgd2hpbGUgaW5JbXBsaWNpdENhbGwoKVxuICAgICAgICAgICAgICAgIHN0YWNrLnBvcCgpIGlmIGluSW1wbGljaXRDb250cm9sKClcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoIFt0YWcsIGldXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvcndhcmQoMSlcblxuICAgICAgICAgICAgIyBTdHJhaWdodGZvcndhcmQgc3RhcnQgb2YgZXhwbGljaXQgZXhwcmVzc2lvblxuICAgICAgICAgICAgaWYgdGFnIGluIEVYUFJFU1NJT05fU1RBUlRcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoIFt0YWcsIGldXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvcndhcmQoMSlcblxuICAgICAgICAgICAgIyBDbG9zZSBhbGwgaW1wbGljaXQgZXhwcmVzc2lvbnMgaW5zaWRlIG9mIGV4cGxpY2l0bHkgY2xvc2VkIGV4cHJlc3Npb25zLlxuICAgICAgICAgICAgaWYgdGFnIGluIEVYUFJFU1NJT05fRU5EXG4gICAgICAgICAgICAgICAgd2hpbGUgaW5JbXBsaWNpdCgpXG4gICAgICAgICAgICAgICAgICAgIGlmIGluSW1wbGljaXRDYWxsKClcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZEltcGxpY2l0Q2FsbCgpXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgaW5JbXBsaWNpdE9iamVjdCgpXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmRJbXBsaWNpdE9iamVjdCgpXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrLnBvcCgpXG4gICAgICAgICAgICAgICAgc3RhcnQgPSBzdGFjay5wb3AoKVxuXG4gICAgICAgICAgICAjIFJlY29nbml6ZSBzdGFuZGFyZCBpbXBsaWNpdCBjYWxscyBsaWtlXG4gICAgICAgICAgICAjIGYgYSwgZigpIGIsIGY/IGMsIGhbMF0gZCBldGMuXG4gICAgICAgICAgICBpZiAodGFnIGluIElNUExJQ0lUX0ZVTkMgYW5kIHRva2VuLnNwYWNlZCBvclxuICAgICAgICAgICAgICAgICAgICB0YWcgaXMgJz8nIGFuZCBpID4gMCBhbmQgbm90IHRva2Vuc1tpIC0gMV0uc3BhY2VkKSBhbmRcbiAgICAgICAgICAgICAgICAgKG5leHRUYWcgaW4gSU1QTElDSVRfQ0FMTCBvclxuICAgICAgICAgICAgICAgICAgICBuZXh0VGFnIGluIElNUExJQ0lUX1VOU1BBQ0VEX0NBTEwgYW5kXG4gICAgICAgICAgICAgICAgICAgIG5vdCB0b2tlbnNbaSArIDFdPy5zcGFjZWQgYW5kIG5vdCB0b2tlbnNbaSArIDFdPy5uZXdMaW5lKVxuICAgICAgICAgICAgICAgIHRhZyA9IHRva2VuWzBdID0gJ0ZVTkNfRVhJU1QnIGlmIHRhZyBpcyAnPydcbiAgICAgICAgICAgICAgICBzdGFydEltcGxpY2l0Q2FsbCBpICsgMVxuICAgICAgICAgICAgICAgIHJldHVybiBmb3J3YXJkKDIpXG5cbiAgICAgICAgICAgICMgSW1wbGljaXQgY2FsbCB0YWtpbmcgYW4gaW1wbGljaXQgaW5kZW50ZWQgb2JqZWN0IGFzIGZpcnN0IGFyZ3VtZW50LlxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyAgICAgICAgICAgZlxuICAgICAgICAgICAgIyAgICAgICAgICAgICAgIGE6IGJcbiAgICAgICAgICAgICMgICAgICAgICAgICAgICBjOiBkXG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjIGFuZFxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyAgICAgICAgICAgZlxuICAgICAgICAgICAgIyAgICAgICAgICAgICAgIDFcbiAgICAgICAgICAgICMgICAgICAgICAgICAgICBhOiBiXG4gICAgICAgICAgICAjICAgICAgICAgICAgICAgYjogY1xuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyBEb24ndCBhY2NlcHQgaW1wbGljaXQgY2FsbHMgb2YgdGhpcyB0eXBlLCB3aGVuIG9uIHRoZSBzYW1lIGxpbmVcbiAgICAgICAgICAgICMgYXMgdGhlIGNvbnRyb2wgc3RydWN0dXJlcyBiZWxvdyBhcyB0aGF0IG1heSBtaXNpbnRlcnByZXQgY29uc3RydWN0cyBsaWtlOlxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyAgICAgICAgICAgaWYgZlxuICAgICAgICAgICAgIyAgICAgICAgICAgICAgICBhOiAxXG4gICAgICAgICAgICAjIGFzXG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjICAgICAgICAgICBpZiBmKGE6IDEpXG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjIHdoaWNoIGlzIHByb2JhYmx5IGFsd2F5cyB1bmludGVuZGVkLlxuICAgICAgICAgICAgIyBGdXJ0aGVybW9yZSBkb24ndCBhbGxvdyB0aGlzIGluIGxpdGVyYWwgYXJyYXlzLCBhcyB0aGF0IGNyZWF0ZXMgZ3JhbW1hdGljYWwgYW1iaWd1aXRpZXMuXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHRhZyBpbiBJTVBMSUNJVF9GVU5DIGFuZFxuICAgICAgICAgICAgICAgICBAaW5kZXhPZlRhZyhpICsgMSwgJ0lOREVOVCcpID4gLTEgYW5kIEBsb29rc09iamVjdGlzaChpICsgMikgYW5kXG4gICAgICAgICAgICAgICAgIG5vdCBAZmluZFRhZ3NCYWNrd2FyZHMoaSwgWydDTEFTUycgJ0VYVEVORFMnICdJRicgJ01FVEFfSUYnICdDQVRDSCcgJ1NXSVRDSCcgJ0xFQURJTkdfV0hFTicgJ0ZPUicgJ1dISUxFJyAnVU5USUwnXSlcbiAgICAgICAgICAgICAgICBzdGFydEltcGxpY2l0Q2FsbCBpICsgMVxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2ggWydJTkRFTlQnLCBpICsgMl1cbiAgICAgICAgICAgICAgICByZXR1cm4gZm9yd2FyZCgzKVxuXG4gICAgICAgICAgICAjIEltcGxpY2l0IG9iamVjdHMgc3RhcnQgaGVyZVxuICAgICAgICAgICAgaWYgdGFnIGlzICc6J1xuICAgICAgICAgICAgICAgICMgR28gYmFjayB0byB0aGUgKGltcGxpY2l0KSBzdGFydCBvZiB0aGUgb2JqZWN0XG4gICAgICAgICAgICAgICAgcyA9IHN3aXRjaFxuICAgICAgICAgICAgICAgICAgICB3aGVuIEB0YWcoaSAtIDEpIGluIEVYUFJFU1NJT05fRU5EIHRoZW4gc3RhcnRbMV1cbiAgICAgICAgICAgICAgICAgICAgd2hlbiBAdGFnKGkgLSAyKSBpcyAnQCcgdGhlbiBpIC0gMlxuICAgICAgICAgICAgICAgICAgICBlbHNlIGkgLSAxXG4gICAgICAgICAgICAgICAgcyAtPSAyIHdoaWxlIEB0YWcocyAtIDIpIGlzICdIRVJFQ09NTUVOVCdcblxuICAgICAgICAgICAgICAgICMgTWFyayBpZiB0aGUgdmFsdWUgaXMgYSBmb3IgbG9vcFxuICAgICAgICAgICAgICAgIEBpbnNpZGVGb3JEZWNsYXJhdGlvbiA9IG5leHRUYWcgaXMgJ0ZPUidcblxuICAgICAgICAgICAgICAgIHN0YXJ0c0xpbmUgPSBzIGlzIDAgb3IgQHRhZyhzIC0gMSkgaW4gTElORUJSRUFLUyBvciB0b2tlbnNbcyAtIDFdLm5ld0xpbmVcbiAgICAgICAgICAgICAgICAjIEFyZSB3ZSBqdXN0IGNvbnRpbnVpbmcgYW4gYWxyZWFkeSBkZWNsYXJlZCBvYmplY3Q/XG4gICAgICAgICAgICAgICAgaWYgc3RhY2tUb3AoKVxuICAgICAgICAgICAgICAgICAgICBbc3RhY2tUYWcsIHN0YWNrSWR4XSA9IHN0YWNrVG9wKClcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YWNrVGFnIGlzICd7JyBvciBzdGFja1RhZyBpcyAnSU5ERU5UJyBhbmQgQHRhZyhzdGFja0lkeCAtIDEpIGlzICd7JykgYW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAgKHN0YXJ0c0xpbmUgb3IgQHRhZyhzIC0gMSkgaXMgJywnIG9yIEB0YWcocyAtIDEpIGlzICd7JylcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmb3J3YXJkKDEpXG5cbiAgICAgICAgICAgICAgICBzdGFydEltcGxpY2l0T2JqZWN0KHMsICEhc3RhcnRzTGluZSlcbiAgICAgICAgICAgICAgICByZXR1cm4gZm9yd2FyZCgyKVxuXG4gICAgICAgICAgICAjIEVuZCBpbXBsaWNpdCBjYWxscyB3aGVuIGNoYWluaW5nIG1ldGhvZCBjYWxsc1xuICAgICAgICAgICAgIyBsaWtlIGUuZy46XG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjICAgICAgICAgICBmIC0+XG4gICAgICAgICAgICAjICAgICAgICAgICAgICAgYVxuICAgICAgICAgICAgIyAgICAgICAgICAgLmcgYiwgLT5cbiAgICAgICAgICAgICMgICAgICAgICAgICAgICBjXG4gICAgICAgICAgICAjICAgICAgICAgICAuaCBhXG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjIGFuZCBhbHNvXG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjICAgICAgICAgICBmIGFcbiAgICAgICAgICAgICMgICAgICAgICAgIC5nIGJcbiAgICAgICAgICAgICMgICAgICAgICAgIC5oIGFcblxuICAgICAgICAgICAgIyBNYXJrIGFsbCBlbmNsb3Npbmcgb2JqZWN0cyBhcyBub3Qgc2FtZUxpbmVcbiAgICAgICAgICAgIGlmIHRhZyBpbiBMSU5FQlJFQUtTXG4gICAgICAgICAgICAgICAgZm9yIHN0YWNrSXRlbSBpbiBzdGFjayBieSAtMVxuICAgICAgICAgICAgICAgICAgICBicmVhayB1bmxlc3MgaXNJbXBsaWNpdCBzdGFja0l0ZW1cbiAgICAgICAgICAgICAgICAgICAgc3RhY2tJdGVtWzJdLnNhbWVMaW5lID0gbm8gaWYgaXNJbXBsaWNpdE9iamVjdCBzdGFja0l0ZW1cblxuICAgICAgICAgICAgbmV3TGluZSA9IHByZXZUYWcgaXMgJ09VVERFTlQnIG9yIHByZXZUb2tlbi5uZXdMaW5lXG4gICAgICAgICAgICBpZiB0YWcgaW4gSU1QTElDSVRfRU5EIG9yIHRhZyBpbiBDQUxMX0NMT1NFUlMgYW5kIG5ld0xpbmVcbiAgICAgICAgICAgICAgICB3aGlsZSBpbkltcGxpY2l0KClcbiAgICAgICAgICAgICAgICAgICAgW3N0YWNrVGFnLCBzdGFja0lkeCwge3NhbWVMaW5lLCBzdGFydHNMaW5lfV0gPSBzdGFja1RvcCgpXG4gICAgICAgICAgICAgICAgICAgICMgQ2xvc2UgaW1wbGljaXQgY2FsbHMgd2hlbiByZWFjaGVkIGVuZCBvZiBhcmd1bWVudCBsaXN0XG4gICAgICAgICAgICAgICAgICAgIGlmIGluSW1wbGljaXRDYWxsKCkgYW5kIHByZXZUYWcgIT0gJywnXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmRJbXBsaWNpdENhbGwoKVxuICAgICAgICAgICAgICAgICAgICAjIENsb3NlIGltcGxpY2l0IG9iamVjdHMgc3VjaCBhczpcbiAgICAgICAgICAgICAgICAgICAgIyByZXR1cm4gYTogMSwgYjogMiB1bmxlc3MgdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGluSW1wbGljaXRPYmplY3QoKSBhbmQgbm90IEBpbnNpZGVGb3JEZWNsYXJhdGlvbiBhbmQgc2FtZUxpbmUgYW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcgIT0gJ1RFUk1JTkFUT1InIGFuZCBwcmV2VGFnICE9ICc6J1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5kSW1wbGljaXRPYmplY3QoKVxuICAgICAgICAgICAgICAgICAgICAjIENsb3NlIGltcGxpY2l0IG9iamVjdHMgd2hlbiBhdCBlbmQgb2YgbGluZSwgbGluZSBkaWRuJ3QgZW5kIHdpdGggYSBjb21tYVxuICAgICAgICAgICAgICAgICAgICAjIGFuZCB0aGUgaW1wbGljaXQgb2JqZWN0IGRpZG4ndCBzdGFydCB0aGUgbGluZSBvciB0aGUgbmV4dCBsaW5lIGRvZXNuJ3QgbG9vayBsaWtlXG4gICAgICAgICAgICAgICAgICAgICMgdGhlIGNvbnRpbnVhdGlvbiBvZiBhbiBvYmplY3QuXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgaW5JbXBsaWNpdE9iamVjdCgpIGFuZCB0YWcgaXMgJ1RFUk1JTkFUT1InIGFuZCBwcmV2VGFnICE9ICcsJyBhbmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdCAoc3RhcnRzTGluZSBhbmQgQGxvb2tzT2JqZWN0aXNoKGkgKyAxKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmb3J3YXJkIDEgaWYgbmV4dFRhZyBpcyAnSEVSRUNPTU1FTlQnXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmRJbXBsaWNpdE9iamVjdCgpXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICMgQ2xvc2UgaW1wbGljaXQgb2JqZWN0IGlmIGNvbW1hIGlzIHRoZSBsYXN0IGNoYXJhY3RlclxuICAgICAgICAgICAgIyBhbmQgd2hhdCBjb21lcyBhZnRlciBkb2Vzbid0IGxvb2sgbGlrZSBpdCBiZWxvbmdzLlxuICAgICAgICAgICAgIyBUaGlzIGlzIHVzZWQgZm9yIHRyYWlsaW5nIGNvbW1hcyBhbmQgY2FsbHMsIGxpa2U6XG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjICAgICAgICAgICB4ID1cbiAgICAgICAgICAgICMgICAgICAgICAgICAgICAgICAgYTogYixcbiAgICAgICAgICAgICMgICAgICAgICAgICAgICAgICAgYzogZCxcbiAgICAgICAgICAgICMgICAgICAgICAgIGUgPSAyXG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjIGFuZFxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyAgICAgICAgICAgZiBhLCBiOiBjLCBkOiBlLCBmLCBnOiBoOiBpLCBqXG4gICAgICAgICAgICAjXG4gICAgICAgICAgICBpZiB0YWcgaXMgJywnIGFuZCBub3QgQGxvb2tzT2JqZWN0aXNoKGkgKyAxKSBhbmQgaW5JbXBsaWNpdE9iamVjdCgpIGFuZFxuICAgICAgICAgICAgICAgICBub3QgQGluc2lkZUZvckRlY2xhcmF0aW9uIGFuZFxuICAgICAgICAgICAgICAgICAobmV4dFRhZyAhPSAnVEVSTUlOQVRPUicgb3Igbm90IEBsb29rc09iamVjdGlzaChpICsgMikpXG4gICAgICAgICAgICAgICAgIyBXaGVuIG5leHRUYWcgaXMgT1VUREVOVCB0aGUgY29tbWEgaXMgaW5zaWduaWZpY2FudCBhbmRcbiAgICAgICAgICAgICAgICAjIHNob3VsZCBqdXN0IGJlIGlnbm9yZWQgc28gZW1iZWQgaXQgaW4gdGhlIGltcGxpY2l0IG9iamVjdC5cbiAgICAgICAgICAgICAgICAjXG4gICAgICAgICAgICAgICAgIyBXaGVuIGl0IGlzbid0IHRoZSBjb21tYSBnbyBvbiB0byBwbGF5IGEgcm9sZSBpbiBhIGNhbGwgb3JcbiAgICAgICAgICAgICAgICAjIGFycmF5IGZ1cnRoZXIgdXAgdGhlIHN0YWNrLCBzbyBnaXZlIGl0IGEgY2hhbmNlLlxuXG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gaWYgbmV4dFRhZyBpcyAnT1VUREVOVCcgdGhlbiAxIGVsc2UgMFxuICAgICAgICAgICAgICAgIHdoaWxlIGluSW1wbGljaXRPYmplY3QoKVxuICAgICAgICAgICAgICAgICAgICBlbmRJbXBsaWNpdE9iamVjdCBpICsgb2Zmc2V0XG4gICAgICAgICAgICByZXR1cm4gZm9yd2FyZCgxKVxuICAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgIFxuICAgICMgQWRkIGxvY2F0aW9uIGRhdGEgdG8gYWxsIHRva2VucyBnZW5lcmF0ZWQgYnkgdGhlIHJld3JpdGVyLlxuICAgIFxuICAgIGFkZExvY2F0aW9uRGF0YVRvR2VuZXJhdGVkVG9rZW5zOiAtPlxuICAgICAgICBAc2NhblRva2VucyAodG9rZW4sIGksIHRva2VucykgLT5cbiAgICAgICAgICAgIHJldHVybiAxIGlmIHRva2VuWzJdXG4gICAgICAgICAgICByZXR1cm4gMSB1bmxlc3MgdG9rZW4uZ2VuZXJhdGVkIG9yIHRva2VuLmV4cGxpY2l0XG4gICAgICAgICAgICBpZiB0b2tlblswXSBpcyAneycgYW5kIG5leHRMb2NhdGlvbj10b2tlbnNbaSArIDFdP1syXVxuICAgICAgICAgICAgICAgIHtmaXJzdF9saW5lOiBsaW5lLCBmaXJzdF9jb2x1bW46IGNvbHVtbn0gPSBuZXh0TG9jYXRpb25cbiAgICAgICAgICAgIGVsc2UgaWYgcHJldkxvY2F0aW9uID0gdG9rZW5zW2kgLSAxXT9bMl1cbiAgICAgICAgICAgICAgICB7bGFzdF9saW5lOiBsaW5lLCBsYXN0X2NvbHVtbjogY29sdW1ufSA9IHByZXZMb2NhdGlvblxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGxpbmUgPSBjb2x1bW4gPSAwXG4gICAgICAgICAgICB0b2tlblsyXSA9XG4gICAgICAgICAgICAgICAgZmlyc3RfbGluZTogICBsaW5lXG4gICAgICAgICAgICAgICAgZmlyc3RfY29sdW1uOiBjb2x1bW5cbiAgICAgICAgICAgICAgICBsYXN0X2xpbmU6ICAgIGxpbmVcbiAgICAgICAgICAgICAgICBsYXN0X2NvbHVtbjogIGNvbHVtblxuICAgICAgICAgICAgcmV0dXJuIDFcblxuICAgICMgT1VUREVOVCB0b2tlbnMgc2hvdWxkIGFsd2F5cyBiZSBwb3NpdGlvbmVkIGF0IHRoZSBsYXN0IGNoYXJhY3RlciBvZiB0aGVcbiAgICAjIHByZXZpb3VzIHRva2VuLCBzbyB0aGF0IEFTVCBub2RlcyBlbmRpbmcgaW4gYW4gT1VUREVOVCB0b2tlbiBlbmQgdXAgd2l0aCBhXG4gICAgIyBsb2NhdGlvbiBjb3JyZXNwb25kaW5nIHRvIHRoZSBsYXN0IFwicmVhbFwiIHRva2VuIHVuZGVyIHRoZSBub2RlLlxuICAgIGZpeE91dGRlbnRMb2NhdGlvbkRhdGE6IC0+XG4gICAgICAgIEBzY2FuVG9rZW5zICh0b2tlbiwgaSwgdG9rZW5zKSAtPlxuICAgICAgICAgICAgcmV0dXJuIDEgdW5sZXNzIHRva2VuWzBdIGlzICdPVVRERU5UJyBvclxuICAgICAgICAgICAgICAgICh0b2tlbi5nZW5lcmF0ZWQgYW5kIHRva2VuWzBdIGlzICdDQUxMX0VORCcpIG9yXG4gICAgICAgICAgICAgICAgKHRva2VuLmdlbmVyYXRlZCBhbmQgdG9rZW5bMF0gaXMgJ30nKVxuICAgICAgICAgICAgcHJldkxvY2F0aW9uRGF0YSA9IHRva2Vuc1tpIC0gMV1bMl1cbiAgICAgICAgICAgIHRva2VuWzJdID1cbiAgICAgICAgICAgICAgICBmaXJzdF9saW5lOiAgIHByZXZMb2NhdGlvbkRhdGEubGFzdF9saW5lXG4gICAgICAgICAgICAgICAgZmlyc3RfY29sdW1uOiBwcmV2TG9jYXRpb25EYXRhLmxhc3RfY29sdW1uXG4gICAgICAgICAgICAgICAgbGFzdF9saW5lOiAgICBwcmV2TG9jYXRpb25EYXRhLmxhc3RfbGluZVxuICAgICAgICAgICAgICAgIGxhc3RfY29sdW1uOiAgcHJldkxvY2F0aW9uRGF0YS5sYXN0X2NvbHVtblxuICAgICAgICAgICAgcmV0dXJuIDFcblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgICAwMDAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgICMgQmVjYXVzZSBvdXIgZ3JhbW1hciBpcyBMQUxSKDEpLCBpdCBjYW4ndCBoYW5kbGUgc29tZSBzaW5nbGUtbGluZVxuICAgICMgZXhwcmVzc2lvbnMgdGhhdCBsYWNrIGVuZGluZyBkZWxpbWl0ZXJzLiBUaGUgKipSZXdyaXRlcioqIGFkZHMgdGhlIGltcGxpY2l0XG4gICAgIyBibG9ja3MsIHNvIGl0IGRvZXNuJ3QgbmVlZCB0by4gVG8ga2VlcCB0aGUgZ3JhbW1hciBjbGVhbiBhbmQgdGlkeSwgdHJhaWxpbmdcbiAgICAjIG5ld2xpbmVzIHdpdGhpbiBleHByZXNzaW9ucyBhcmUgcmVtb3ZlZCBhbmQgdGhlIGluZGVudGF0aW9uIHRva2VucyBvZiBlbXB0eVxuICAgICMgYmxvY2tzIGFyZSBhZGRlZC5cbiAgICBcbiAgICBub3JtYWxpemVMaW5lczogLT5cbiAgICAgICAgc3RhcnRlciA9IGluZGVudCA9IG91dGRlbnQgPSBudWxsXG5cbiAgICAgICAgY29uZGl0aW9uID0gKHRva2VuLCBpKSAtPlxuICAgICAgICAgICAgdG9rZW5bMV0gIT0gJzsnIGFuZCB0b2tlblswXSBpbiBTSU5HTEVfQ0xPU0VSUyBhbmRcbiAgICAgICAgICAgIG5vdCAodG9rZW5bMF0gaXMgJ1RFUk1JTkFUT1InIGFuZCBAdGFnKGkgKyAxKSBpbiBFWFBSRVNTSU9OX0NMT1NFKSBhbmRcbiAgICAgICAgICAgIG5vdCAodG9rZW5bMF0gaW4gWydFTFNFJyAnTUVUQV9FTFNFJ10gYW5kIHN0YXJ0ZXIgIT0gJ1RIRU4nKSBhbmRcbiAgICAgICAgICAgIG5vdCAodG9rZW5bMF0gaW4gWydDQVRDSCcgJ0ZJTkFMTFknXSBhbmQgc3RhcnRlciBpbiBbJy0+JyAnPT4nXSkgb3JcbiAgICAgICAgICAgIHRva2VuWzBdIGluIENBTExfQ0xPU0VSUyBhbmRcbiAgICAgICAgICAgIChAdG9rZW5zW2kgLSAxXS5uZXdMaW5lIG9yIEB0b2tlbnNbaSAtIDFdWzBdIGlzICdPVVRERU5UJylcblxuICAgICAgICBhY3Rpb24gPSAodG9rZW4sIGkpIC0+XG4gICAgICAgICAgICBAdG9rZW5zLnNwbGljZSAoaWYgQHRhZyhpIC0gMSkgaXMgJywnIHRoZW4gaSAtIDEgZWxzZSBpKSwgMCwgb3V0ZGVudFxuXG4gICAgICAgIEBzY2FuVG9rZW5zICh0b2tlbiwgaSwgdG9rZW5zKSAtPlxuICAgICAgICAgICAgW3RhZ10gPSB0b2tlblxuICAgICAgICAgICAgaWYgdGFnIGlzICdURVJNSU5BVE9SJ1xuICAgICAgICAgICAgICAgIGlmIEB0YWcoaSArIDEpIGluIFsnRUxTRScgJ01FVEFfRUxTRSddIGFuZCBAdGFnKGkgLSAxKSAhPSAnT1VUREVOVCdcbiAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpLCAxLCBAaW5kZW50YXRpb24oKS4uLlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMVxuICAgICAgICAgICAgICAgIGlmIEB0YWcoaSArIDEpIGluIEVYUFJFU1NJT05fQ0xPU0VcbiAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpLCAxXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgICAgICBpZiB0YWcgaXMgJ0NBVENIJ1xuICAgICAgICAgICAgICAgIGZvciBqIGluIFsxLi4yXSB3aGVuIEB0YWcoaSArIGopIGluIFsnT1VUREVOVCcgJ1RFUk1JTkFUT1InICdGSU5BTExZJ11cbiAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpICsgaiwgMCwgQGluZGVudGF0aW9uKCkuLi5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDIgKyBqXG4gICAgICAgICAgICBpZiB0YWcgaW4gU0lOR0xFX0xJTkVSUyBhbmQgQHRhZyhpICsgMSkgIT0gJ0lOREVOVCcgYW5kIG5vdCAodGFnIGlzICdFTFNFJyBhbmQgQHRhZyhpICsgMSkgaXMgJ0lGJykgYW5kIG5vdCAodGFnIGlzICdNRVRBX0VMU0UnIGFuZCBAdGFnKGkgKyAxKSBpcyAnTUVUQV9JRicpXG4gICAgICAgICAgICAgICAgc3RhcnRlciA9IHRhZ1xuICAgICAgICAgICAgICAgIFtpbmRlbnQsIG91dGRlbnRdID0gQGluZGVudGF0aW9uIHRva2Vuc1tpXVxuICAgICAgICAgICAgICAgIGluZGVudC5mcm9tVGhlbiAgID0gdHJ1ZSBpZiBzdGFydGVyIGlzICdUSEVOJ1xuICAgICAgICAgICAgICAgIHRva2Vucy5zcGxpY2UgaSArIDEsIDAsIGluZGVudFxuICAgICAgICAgICAgICAgIEBkZXRlY3RFbmQgaSArIDIsIGNvbmRpdGlvbiwgYWN0aW9uXG4gICAgICAgICAgICAgICAgdG9rZW5zLnNwbGljZSBpLCAxIGlmIHRhZyBpcyAnVEhFTidcbiAgICAgICAgICAgICAgICByZXR1cm4gMVxuICAgICAgICAgICAgcmV0dXJuIDFcblxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAwMDAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAgICAgMDAwICAgIDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICAjIFRhZyBwb3N0Zml4IGNvbmRpdGlvbmFscyBhcyBzdWNoLCBzbyB0aGF0IHdlIGNhbiBwYXJzZSB0aGVtIHdpdGggYVxuICAgICMgZGlmZmVyZW50IHByZWNlZGVuY2UuXG4gICAgXG4gICAgdGFnUG9zdGZpeENvbmRpdGlvbmFsczogLT5cblxuICAgICAgICBvcmlnaW5hbCA9IG51bGxcblxuICAgICAgICBjb25kaXRpb24gPSAodG9rZW4sIGkpIC0+XG4gICAgICAgICAgICBbdGFnXSA9IHRva2VuXG4gICAgICAgICAgICBbcHJldlRhZ10gPSBAdG9rZW5zW2kgLSAxXVxuICAgICAgICAgICAgdGFnIGlzICdURVJNSU5BVE9SJyBvciAodGFnIGlzICdJTkRFTlQnIGFuZCBwcmV2VGFnIG5vdCBpbiBTSU5HTEVfTElORVJTKVxuXG4gICAgICAgIGFjdGlvbiA9ICh0b2tlbiwgaSkgLT5cbiAgICAgICAgICAgIGlmIHRva2VuWzBdIG5vdCBpbiBbJ0lOREVOVCddIG9yICh0b2tlbi5nZW5lcmF0ZWQgYW5kIG5vdCB0b2tlbi5mcm9tVGhlbilcbiAgICAgICAgICAgICAgICBvcmlnaW5hbFswXSA9ICdQT1NUXycgKyBvcmlnaW5hbFswXVxuXG4gICAgICAgIEBzY2FuVG9rZW5zICh0b2tlbiwgaSkgLT5cbiAgICAgICAgICAgIHJldHVybiAxIHVubGVzcyB0b2tlblswXSBpbiBbJ0lGJywgJ01FVEFfSUYnXVxuICAgICAgICAgICAgb3JpZ2luYWwgPSB0b2tlblxuICAgICAgICAgICAgQGRldGVjdEVuZCBpICsgMSwgY29uZGl0aW9uLCBhY3Rpb25cbiAgICAgICAgICAgIHJldHVybiAxXG5cbiAgICAjIEdlbmVyYXRlIHRoZSBpbmRlbnRhdGlvbiB0b2tlbnMsIGJhc2VkIG9uIGFub3RoZXIgdG9rZW4gb24gdGhlIHNhbWUgbGluZS5cbiAgICBcbiAgICBpbmRlbnRhdGlvbjogKG9yaWdpbikgLT5cbiAgICAgICAgXG4gICAgICAgIGluZGVudCAgPSBbJ0lOREVOVCcsIDRdXG4gICAgICAgIG91dGRlbnQgPSBbJ09VVERFTlQnLCA0XVxuICAgICAgICBpZiBvcmlnaW5cbiAgICAgICAgICAgIGluZGVudC5nZW5lcmF0ZWQgPSBvdXRkZW50LmdlbmVyYXRlZCA9IHllc1xuICAgICAgICAgICAgaW5kZW50Lm9yaWdpbiA9IG91dGRlbnQub3JpZ2luID0gb3JpZ2luXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGluZGVudC5leHBsaWNpdCA9IG91dGRlbnQuZXhwbGljaXQgPSB5ZXNcbiAgICAgICAgW2luZGVudCwgb3V0ZGVudF1cblxuICAgICMgQ3JlYXRlIGEgZ2VuZXJhdGVkIHRva2VuOiBvbmUgdGhhdCBleGlzdHMgZHVlIHRvIGEgdXNlIG9mIGltcGxpY2l0IHN5bnRheC5cbiAgICBcbiAgICBAZ2VuZXJhdGU6ICh0YWcsIHZhbHVlLCBvcmlnaW4pIC0+XG4gICAgICAgIHRvayA9IFt0YWcsIHZhbHVlXVxuICAgICAgICB0b2suZ2VuZXJhdGVkID0geWVzXG4gICAgICAgIHRvay5vcmlnaW4gPSBvcmlnaW4gaWYgb3JpZ2luXG4gICAgICAgIHRva1xuICAgICAgICBcbiAgICBnZW5lcmF0ZTogUmV3cml0ZXIuZ2VuZXJhdGVcblxuICAgIHRhZzogKGkpIC0+IEB0b2tlbnNbaV0/WzBdICMgTG9vayB1cCBhIHRhZyBieSB0b2tlbiBpbmRleC5cblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgICAgICAgMDAwICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG5cbiMgTGlzdCBvZiB0aGUgdG9rZW4gcGFpcnMgdGhhdCBtdXN0IGJlIGJhbGFuY2VkLlxuXG5CQUxBTkNFRF9QQUlSUyA9IFtcbiAgICBbJygnJyknXVxuICAgIFsnWycnXSddXG4gICAgWyd7Jyd9J11cbiAgICBbJ0lOREVOVCcnT1VUREVOVCddLFxuICAgIFsnQ0FMTF9TVEFSVCcnQ0FMTF9FTkQnXVxuICAgIFsnUEFSQU1fU1RBUlQnJ1BBUkFNX0VORCddXG4gICAgWydJTkRFWF9TVEFSVCcnSU5ERVhfRU5EJ11cbiAgICBbJ1NUUklOR19TVEFSVCcnU1RSSU5HX0VORCddXG4gICAgWydSRUdFWF9TVEFSVCcnUkVHRVhfRU5EJ11cbl1cblxuIyBUaGUgaW52ZXJzZSBtYXBwaW5ncyBvZiBgQkFMQU5DRURfUEFJUlNgIHdlJ3JlIHRyeWluZyB0byBmaXggdXAsIHNvIHdlIGNhbiBsb29rIHRoaW5ncyB1cCBmcm9tIGVpdGhlciBlbmQuXG5cbiMgVGhlIHRva2VucyB0aGF0IHNpZ25hbCB0aGUgc3RhcnQvZW5kIG9mIGEgYmFsYW5jZWQgcGFpci5cbkVYUFJFU1NJT05fU1RBUlQgPSBbXVxuRVhQUkVTU0lPTl9FTkQgICA9IFtdXG5cbklOVkVSU0VTID0ge31cbmZvciBbbGVmdCwgcml0ZV0gaW4gQkFMQU5DRURfUEFJUlNcbiAgICBFWFBSRVNTSU9OX1NUQVJULnB1c2ggSU5WRVJTRVNbcml0ZV0gPSBsZWZ0XG4gICAgRVhQUkVTU0lPTl9FTkQgIC5wdXNoIElOVkVSU0VTW2xlZnRdID0gcml0ZVxuXG5SZXdyaXRlci5JTlZFUlNFUyA9IElOVkVSU0VTXG4gICAgXG4jIFRva2VucyB0aGF0IGluZGljYXRlIHRoZSBjbG9zZSBvZiBhIGNsYXVzZSBvZiBhbiBleHByZXNzaW9uLlxuRVhQUkVTU0lPTl9DTE9TRSA9IFsnQ0FUQ0gnICdUSEVOJyAnRUxTRScgJ01FVEFfRUxTRScgJ0ZJTkFMTFknXS5jb25jYXQgRVhQUkVTU0lPTl9FTkRcblxuIyBUb2tlbnMgdGhhdCwgaWYgZm9sbG93ZWQgYnkgYW4gYElNUExJQ0lUX0NBTExgLCBpbmRpY2F0ZSBhIGZ1bmN0aW9uIGludm9jYXRpb24uXG5JTVBMSUNJVF9GVU5DID0gWydJREVOVElGSUVSJyAnUFJPUEVSVFknICdTVVBFUicgJyknICdDQUxMX0VORCcgJ10nICdJTkRFWF9FTkQnICdAJyAnVEhJUyddXG5cbiMgSWYgcHJlY2VkZWQgYnkgYW4gYElNUExJQ0lUX0ZVTkNgLCBpbmRpY2F0ZXMgYSBmdW5jdGlvbiBpbnZvY2F0aW9uLlxuSU1QTElDSVRfQ0FMTCA9IFtcbiAgICAnSURFTlRJRklFUicgJ1BST1BFUlRZJyAnTlVNQkVSJyAnSU5GSU5JVFknICdOQU4nXG4gICAgJ1NUUklORycgJ1NUUklOR19TVEFSVCcgJ1JFR0VYJyAnUkVHRVhfU1RBUlQnICdKUydcbiAgICAnTkVXJyAnUEFSQU1fU1RBUlQnICdDTEFTUycgJ0lGJyAnTUVUQV9JRicsICdUUlknICdTV0lUQ0gnICdUSElTJ1xuICAgICdVTkRFRklORUQnICdOVUxMJyAnQk9PTCdcbiAgICAnVU5BUlknICdZSUVMRCcgJ1VOQVJZX01BVEgnICdTVVBFUicgJ1RIUk9XJ1xuICAgICdAJyAnLT4nICc9PicgJ1snICcoJyAneycgJy0tJyAnKysnXG5dXG5cbklNUExJQ0lUX1VOU1BBQ0VEX0NBTEwgPSBbJysnICctJ11cblxuIyBUb2tlbnMgdGhhdCBhbHdheXMgbWFyayB0aGUgZW5kIG9mIGFuIGltcGxpY2l0IGNhbGwgZm9yIHNpbmdsZS1saW5lcnMuXG5JTVBMSUNJVF9FTkQgPSBbJ1BPU1RfSUYnICdQT1NUX01FVEFfSUYnICdGT1InICdXSElMRScgJ1VOVElMJyAnV0hFTicgJ0JZJyAnTE9PUCcgJ1RFUk1JTkFUT1InXVxuXG4jIFNpbmdsZS1saW5lIGZsYXZvcnMgb2YgYmxvY2sgZXhwcmVzc2lvbnMgdGhhdCBoYXZlIHVuY2xvc2VkIGVuZGluZ3MuXG4jIFRoZSBncmFtbWFyIGNhbid0IGRpc2FtYmlndWF0ZSB0aGVtLCBzbyB3ZSBpbnNlcnQgdGhlIGltcGxpY2l0IGluZGVudGF0aW9uLlxuU0lOR0xFX0xJTkVSUyAgPSBbJ0VMU0UnICdNRVRBX0VMU0UnICctPicgJz0+JyAnVFJZJyAnRklOQUxMWScgJ1RIRU4nXVxuU0lOR0xFX0NMT1NFUlMgPSBbJ1RFUk1JTkFUT1InICdDQVRDSCcgJ0ZJTkFMTFknICdFTFNFJyAnTUVUQV9FTFNFJyAnT1VUREVOVCcgJ0xFQURJTkdfV0hFTiddXG5cbiMgVG9rZW5zIHRoYXQgZW5kIGEgbGluZS5cbkxJTkVCUkVBS1MgPSBbJ1RFUk1JTkFUT1InICdJTkRFTlQnICdPVVRERU5UJ11cblxuIyBUb2tlbnMgdGhhdCBjbG9zZSBvcGVuIGNhbGxzIHdoZW4gdGhleSBmb2xsb3cgYSBuZXdsaW5lLlxuQ0FMTF9DTE9TRVJTID0gWycuJyAnPy4nICc6OicgJz86OiddXG5cbm1vZHVsZS5leHBvcnRzID0gUmV3cml0ZXJcbiJdfQ==
//# sourceURL=../coffee/rewriter.coffee