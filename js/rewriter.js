// koffee 0.31.0

/*
00000000   00000000  000   000  00000000   000  000000000  00000000  00000000   
000   000  000       000 0 000  000   000  000     000     000       000   000  
0000000    0000000   000000000  0000000    000     000     0000000   0000000    
000   000  000       000   000  000   000  000     000     000       000   000  
000   000  00000000  00     00  000   000  000     000     00000000  000   000
 */

(function() {
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

}).call(this);
