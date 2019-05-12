// koffee 0.30.0

/*
000      00000000  000   000  00000000  00000000   
000      000        000 000   000       000   000  
000      0000000     00000    0000000   0000000    
000      000        000 000   000       000   000  
0000000  00000000  000   000  00000000  000   000
 */
var BOM, BOOL, CALLABLE, CODE, COFFEE_ALIASES, COFFEE_ALIAS_MAP, COFFEE_KEYWORDS, COMMENT, COMPARE, COMPOUND_ASSIGN, HERECOMMENT_ILLEGAL, HEREDOC_DOUBLE, HEREDOC_INDENT, HEREDOC_SINGLE, HEREGEX, HEREGEX_OMIT, HERE_JSTOKEN, IDENTIFIER, INDENTABLE_CLOSERS, INDEXABLE, JSTOKEN, JS_KEYWORDS, LEADING_BLANK_LINE, LINE_BREAK, LINE_CONTINUER, Lexer, MATH, META_KEYWORDS, MULTI_DENT, NOT_REGEX, NUMBER, OPERATOR, POSSIBLY_DIVISION, REGEX, REGEX_FLAGS, REGEX_ILLEGAL, REGEX_INVALID_ESCAPE, RELATION, RESERVED, Rewriter, SHIFT, SIMPLE_STRING_OMIT, STRICT_PROSCRIBED, STRING_DOUBLE, STRING_INVALID_ESCAPE, STRING_OMIT, STRING_SINGLE, STRING_START, TRAILING_BLANK_LINE, TRAILING_SPACES, UNARY, UNARY_MATH, UNFINISHED, UNICODE_CODE_POINT_ESCAPE, VALID_FLAGS, WHITESPACE, compact, count, hasFeature, injectFeature, injectMeta, isForFrom, isUnassignable, key, locationDataToString, ref, ref1, repeat, starts, throwSyntaxError,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf,
    slice = [].slice;

Rewriter = require('./rewriter');

injectMeta = require('./meta').injectMeta;

ref = require('./features'), injectFeature = ref.injectFeature, hasFeature = ref.hasFeature;

ref1 = require('./helpers'), count = ref1.count, starts = ref1.starts, compact = ref1.compact, repeat = ref1.repeat, locationDataToString = ref1.locationDataToString, throwSyntaxError = ref1.throwSyntaxError;

Lexer = (function() {
    function Lexer() {
        this.tokenize = bind(this.tokenize, this);
    }

    Lexer.prototype.tokenize = function(code, opts) {
        var consumed, end, i, ref2;
        opts = injectFeature(opts);
        opts = injectMeta(opts);
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
        if (hasFeature(opts, 'rewrite')) {
            (new Rewriter).rewrite(this.tokens, opts);
        } else {
            console.warn('skipping rewrite!');
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
        var alias, colon, colonOffset, id, idLength, input, match, poppedToken, prev, ref10, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, tag, tagToken;
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
        if (tag === 'IDENTIFIER' && id[0] === '▸' && (ref8 = id.slice(1), indexOf.call(META_KEYWORDS, ref8) >= 0)) {
            if (id === '▸elif') {
                this.token('META_ELSE', 'else');
                tag = 'META_IF';
                id = 'if';
            } else if (id === '▸then') {
                tag = 'THEN';
                id = 'then';
            } else {
                id = id.slice(1);
                tag = 'META_' + id.toUpperCase();
            }
        } else if (tag === 'IDENTIFIER' && (indexOf.call(JS_KEYWORDS, id) >= 0 || indexOf.call(COFFEE_KEYWORDS, id) >= 0) && !(this.exportSpecifierList && indexOf.call(COFFEE_KEYWORDS, id) >= 0)) {
            tag = id.toUpperCase();
            if (tag === 'WHEN' && (ref9 = this.tag(), indexOf.call(LINE_BREAK, ref9) >= 0)) {
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
                    case '&&':
                    case '||':
                        return id;
                    case 'break':
                    case 'continue':
                    case 'debugger':
                        return 'STATEMENT';
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
            ref10 = [poppedToken[2].first_line, poppedToken[2].first_column], tagToken[2].first_line = ref10[0], tagToken[2].first_column = ref10[1];
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
                if (body != null) {
                    body;
                } else {
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
                    tag: Rewriter.INVERSES[value],
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
        return throwSyntaxError({
            module: 'lexer',
            message: message,
            location: location
        });
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

META_KEYWORDS = ['if', 'then', 'elif', 'else'];

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

module.exports = {
    JS_FORBIDDEN: JS_KEYWORDS.concat(RESERVED).concat(STRICT_PROSCRIBED),
    isUnassignable: isUnassignable,
    Lexer: Lexer
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4ZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLDA0QkFBQTtJQUFBOzs7O0FBaUJBLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFFVCxhQUFlLE9BQUEsQ0FBUSxRQUFSOztBQUNqQixNQUFnQyxPQUFBLENBQVEsWUFBUixDQUFoQyxFQUFFLGlDQUFGLEVBQWlCOztBQUNqQixPQUE2RSxPQUFBLENBQVEsV0FBUixDQUE3RSxFQUFFLGtCQUFGLEVBQVMsb0JBQVQsRUFBaUIsc0JBQWpCLEVBQTBCLG9CQUExQixFQUFrQyxnREFBbEMsRUFBd0Q7O0FBS2xEOzs7OztvQkFpQkYsUUFBQSxHQUFVLFNBQUMsSUFBRCxFQUFPLElBQVA7QUFFTixZQUFBO1FBQUEsSUFBQSxHQUFPLGFBQUEsQ0FBYyxJQUFkO1FBQ1AsSUFBQSxHQUFPLFVBQUEsQ0FBYyxJQUFkO1FBRVAsSUFBQyxDQUFBLE1BQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxVQUFELEdBQWM7UUFDZCxJQUFDLENBQUEsTUFBRCxHQUFjO1FBQ2QsSUFBQyxDQUFBLE9BQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxPQUFELEdBQWM7UUFDZCxJQUFDLENBQUEsSUFBRCxHQUFjO1FBQ2QsSUFBQyxDQUFBLE1BQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxPQUFELEdBQWM7UUFDZCxJQUFDLENBQUEsVUFBRCxHQUFjO1FBQ2QsSUFBQyxDQUFBLFVBQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxtQkFBRCxHQUF1QjtRQUN2QixJQUFDLENBQUEsbUJBQUQsR0FBdUI7UUFFdkIsSUFBQyxDQUFBLFNBQUQsR0FDSSxJQUFJLENBQUMsSUFBTCxJQUFhO1FBQ2pCLElBQUMsQ0FBQSxXQUFELEdBQ0ksSUFBSSxDQUFDLE1BQUwsSUFBZTtRQUNuQixJQUFBLEdBQU8sSUFBQyxDQUFBLEtBQUQsQ0FBTyxJQUFQO1FBS1AsQ0FBQSxH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LEVBQXNCLEtBQXRCLEVBQTRCLFFBQTVCLEVBQXFDLFlBQXJDLEVBQWtELE9BQWxELEVBQTBELFdBQTFELEVBQXNFLE1BQXRFLEVBQTZFLE1BQTdFLEVBQW9GLFdBQXBGLEVBQWdHLEdBQWhHLEVBQW9HLElBQXBHLENBQWhCOztBQU9aLFNBQUEsR0FBWSxTQUFTLENBQUMsTUFBVixDQUFpQixDQUFDLElBQUQsRUFBTSxJQUFOLENBQWpCOztBQU1aLFVBQUEsR0FBYSxDQUFDLFFBQUQsRUFBVSxTQUFWLEVBQW9CLFlBQXBCOztBQUliLGtCQUFBLEdBQXFCLENBQUMsR0FBRCxFQUFLLEdBQUwsRUFBUyxHQUFUOztBQUlyQixVQUFBLEdBQWEsQ0FBQyxJQUFELEVBQU0sR0FBTixFQUFVLElBQVYsRUFBZSxLQUFmLEVBQXFCLE9BQXJCLEVBQTZCLE1BQTdCLEVBQW9DLFlBQXBDLEVBQWlELEdBQWpELEVBQXFELEdBQXJELEVBQ0MsSUFERCxFQUNNLE9BRE4sRUFDYyxVQURkLEVBQ3lCLFNBRHpCLEVBQ21DLEdBRG5DLEVBQ3VDLEdBRHZDLEVBQzJDLEdBRDNDLEVBQytDLElBRC9DLEVBQ29ELElBRHBELEVBRUMsTUFGRCxFQUVRLE9BRlIsRUFFZ0IsU0FGaEI7O0FBSWIsT0FBQSxHQUFhOztBQUViLE1BQU0sQ0FBQyxPQUFQLEdBQ0k7SUFBQSxZQUFBLEVBQWdCLFdBQVcsQ0FBQyxNQUFaLENBQW1CLFFBQW5CLENBQTRCLENBQUMsTUFBN0IsQ0FBb0MsaUJBQXBDLENBQWhCO0lBQ0EsY0FBQSxFQUFnQixjQURoQjtJQUVBLEtBQUEsRUFBZ0IsS0FGaEIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuMDAwICAgICAgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4wMDAgICAgICAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbjAwMCAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4jIyNcblxuIyBUaGUgTGV4ZXIgdXNlcyBhIHNlcmllcyBvZiB0b2tlbi1tYXRjaGluZyByZWdleGVzIHRvIGF0dGVtcHQgbWF0Y2hlcyBhZ2FpbnN0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIHNvdXJjZSBjb2RlLiBcbiMgV2hlbiBhIG1hdGNoIGlzIGZvdW5kLCBhIHRva2VuIGlzIHByb2R1Y2VkLCB3ZSBjb25zdW1lIHRoZSBtYXRjaCwgYW5kIHN0YXJ0IGFnYWluLiBcbiMgVG9rZW5zIGFyZSBpbiB0aGUgZm9ybTpcbiNcbiMgICAgW3RhZywgdmFsdWUsIGxvY2F0aW9uRGF0YV1cbiNcbiMgd2hlcmUgbG9jYXRpb25EYXRhIGlzIHtmaXJzdF9saW5lLCBmaXJzdF9jb2x1bW4sIGxhc3RfbGluZSwgbGFzdF9jb2x1bW59LCBcbiMgd2hpY2ggaXMgYSBmb3JtYXQgdGhhdCBjYW4gYmUgZmVkIGRpcmVjdGx5IGludG8gSmlzb24gdmlhIHRoZSBgcGFyc2VyLmxleGVyYCBmdW5jdGlvbiBkZWZpbmVkIGluIGtvZmZlZS5jb2ZmZWUuXG5cblJld3JpdGVyID0gcmVxdWlyZSAnLi9yZXdyaXRlcidcblxueyBpbmplY3RNZXRhIH0gPSByZXF1aXJlICcuL21ldGEnXG57IGluamVjdEZlYXR1cmUsIGhhc0ZlYXR1cmUgfSA9IHJlcXVpcmUgJy4vZmVhdHVyZXMnXG57IGNvdW50LCBzdGFydHMsIGNvbXBhY3QsIHJlcGVhdCwgbG9jYXRpb25EYXRhVG9TdHJpbmcsIHRocm93U3ludGF4RXJyb3IgfSA9IHJlcXVpcmUgJy4vaGVscGVycydcblxuIyBUaGUgTGV4ZXIgY2xhc3MgcmVhZHMgYSBzdHJpbmcgYW5kIGRpdnZpZXMgaXQgdXAgaW50byB0YWdnZWQgdG9rZW5zLiBcbiMgU29tZSBwb3RlbnRpYWwgYW1iaWd1aXR5IGluIHRoZSBncmFtbWFyIGhhcyBiZWVuIGF2b2lkZWQgYnkgcHVzaGluZyBzb21lIGV4dHJhIHNtYXJ0cyBpbnRvIHRoZSBMZXhlci5cblxuY2xhc3MgTGV4ZXJcblxuICAgICMgdG9rZW5pemUgaXMgdGhlIExleGVyJ3MgbWFpbiBtZXRob2QuIFNjYW4gYnkgYXR0ZW1wdGluZyB0byBtYXRjaCB0b2tlbnNcbiAgICAjIG9uZSBhdCBhIHRpbWUsIHVzaW5nIGEgcmVndWxhciBleHByZXNzaW9uIGFuY2hvcmVkIGF0IHRoZSBzdGFydCBvZiB0aGVcbiAgICAjIHJlbWFpbmluZyBjb2RlLCBvciBhIGN1c3RvbSByZWN1cnNpdmUgdG9rZW4tbWF0Y2hpbmcgbWV0aG9kIChmb3IgaW50ZXJwb2xhdGlvbnMpLiBcbiAgICAjIFdoZW4gdGhlIG5leHQgdG9rZW4gaGFzIGJlZW4gcmVjb3JkZWQsIHdlIG1vdmUgZm9yd2FyZCB3aXRoaW4gdGhlIGNvZGUgcGFzdCB0aGUgdG9rZW4sIGFuZCBiZWdpbiBhZ2Fpbi5cbiAgICAjXG4gICAgIyBFYWNoIHRva2VuaXppbmcgbWV0aG9kIGlzIHJlc3BvbnNpYmxlIGZvciByZXR1cm5pbmcgdGhlIG51bWJlciBvZiBjaGFyYWN0ZXJzIGl0IGhhcyBjb25zdW1lZC5cbiAgICAjXG4gICAgIyBCZWZvcmUgcmV0dXJuaW5nIHRoZSB0b2tlbiBzdHJlYW0sIHJ1biBpdCB0aHJvdWdoIHRoZSBSZXdyaXRlci5cbiAgICBcbiAgICAjIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgICAwMDAgICAwMDAgICAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAgMDAwICAgIDAwMDAwMDAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgICAgICAgICBcbiAgICB0b2tlbml6ZTogKGNvZGUsIG9wdHMpID0+XG5cbiAgICAgICAgb3B0cyA9IGluamVjdEZlYXR1cmUgb3B0c1xuICAgICAgICBvcHRzID0gaW5qZWN0TWV0YSAgICBvcHRzICAjIG5lZWRlZCB0byBzaG9ydGN1dCBtZXRhcywgZS5nLiBAdG9rZW4gLT4gQGlmIEB0b2tlbiAuLi5cbiAgICAgICAgXG4gICAgICAgIEBpbmRlbnQgICAgID0gMCAgICAgICAgICAgICMgVGhlIGN1cnJlbnQgaW5kZW50YXRpb24gbGV2ZWwuXG4gICAgICAgIEBiYXNlSW5kZW50ID0gMCAgICAgICAgICAgICMgVGhlIG92ZXJhbGwgbWluaW11bSBpbmRlbnRhdGlvbiBsZXZlbFxuICAgICAgICBAaW5kZWJ0ICAgICA9IDAgICAgICAgICAgICAjIFRoZSBvdmVyLWluZGVudGF0aW9uIGF0IHRoZSBjdXJyZW50IGxldmVsLlxuICAgICAgICBAb3V0ZGVidCAgICA9IDAgICAgICAgICAgICAjIFRoZSB1bmRlci1vdXRkZW50YXRpb24gYXQgdGhlIGN1cnJlbnQgbGV2ZWwuXG4gICAgICAgIEBpbmRlbnRzICAgID0gW10gICAgICAgICAgICMgVGhlIHN0YWNrIG9mIGFsbCBjdXJyZW50IGluZGVudGF0aW9uIGxldmVscy5cbiAgICAgICAgQGVuZHMgICAgICAgPSBbXSAgICAgICAgICAgIyBUaGUgc3RhY2sgZm9yIHBhaXJpbmcgdXAgdG9rZW5zLlxuICAgICAgICBAdG9rZW5zICAgICA9IFtdICAgICAgICAgICAjIFN0cmVhbSBvZiBwYXJzZWQgdG9rZW5zIGluIHRoZSBmb3JtIGBbJ1RZUEUnLCB2YWx1ZSwgbG9jYXRpb24gZGF0YV1gLlxuICAgICAgICBAc2VlbkZvciAgICA9IG5vICAgICAgICAgICAjIFVzZWQgdG8gcmVjb2duaXplIEZPUklOLCBGT1JPRiBhbmQgRk9SRlJPTSB0b2tlbnMuXG4gICAgICAgIEBzZWVuSW1wb3J0ID0gbm8gICAgICAgICAgICMgVXNlZCB0byByZWNvZ25pemUgSU1QT1JUIEZST00/IEFTPyB0b2tlbnMuXG4gICAgICAgIEBzZWVuRXhwb3J0ID0gbm8gICAgICAgICAgICMgVXNlZCB0byByZWNvZ25pemUgRVhQT1JUIEZST00/IEFTPyB0b2tlbnMuXG4gICAgICAgIEBpbXBvcnRTcGVjaWZpZXJMaXN0ID0gbm8gICMgVXNlZCB0byBpZGVudGlmeSB3aGVuIGluIGFuIElNUE9SVCB7Li4ufSBGUk9NPyAuLi5cbiAgICAgICAgQGV4cG9ydFNwZWNpZmllckxpc3QgPSBubyAgIyBVc2VkIHRvIGlkZW50aWZ5IHdoZW4gaW4gYW4gRVhQT1JUIHsuLi59IEZST00/IC4uLlxuXG4gICAgICAgIEBjaHVua0xpbmUgPVxuICAgICAgICAgICAgb3B0cy5saW5lIG9yIDAgICAgICAgICAjIFRoZSBzdGFydCBsaW5lIGZvciB0aGUgY3VycmVudCBAY2h1bmsuXG4gICAgICAgIEBjaHVua0NvbHVtbiA9XG4gICAgICAgICAgICBvcHRzLmNvbHVtbiBvciAwICAgICAgICMgVGhlIHN0YXJ0IGNvbHVtbiBvZiB0aGUgY3VycmVudCBAY2h1bmsuXG4gICAgICAgIGNvZGUgPSBAY2xlYW4gY29kZSAgICAgICAgICMgVGhlIHN0cmlwcGVkLCBjbGVhbmVkIG9yaWdpbmFsIHNvdXJjZSBjb2RlLlxuXG4gICAgICAgICMgQXQgZXZlcnkgcG9zaXRpb24sIHJ1biB0aHJvdWdoIHRoaXMgbGlzdCBvZiBhdHRlbXB0ZWQgbWF0Y2hlcywgc2hvcnQtY2lyY3VpdGluZyBpZiBhbnkgb2YgdGhlbSBzdWNjZWVkLiBcbiAgICAgICAgIyBUaGVpciBvcmRlciBkZXRlcm1pbmVzIHByZWNlZGVuY2U6IGBAbGl0ZXJhbFRva2VuYCBpcyB0aGUgZmFsbGJhY2sgY2F0Y2gtYWxsLlxuICAgICAgICBcbiAgICAgICAgaSA9IDBcbiAgICAgICAgd2hpbGUgQGNodW5rID0gY29kZVtpLi5dXG4gICAgICAgICAgICBjb25zdW1lZCA9IFxcXG4gICAgICAgICAgICAgICAgICAgICBAaWRlbnRpZmllclRva2VuKCkgb3JcbiAgICAgICAgICAgICAgICAgICAgIEBjb21tZW50VG9rZW4oKSAgICBvclxuICAgICAgICAgICAgICAgICAgICAgQHdoaXRlc3BhY2VUb2tlbigpIG9yXG4gICAgICAgICAgICAgICAgICAgICBAbGluZVRva2VuKCkgICAgICAgb3JcbiAgICAgICAgICAgICAgICAgICAgIEBzdHJpbmdUb2tlbigpICAgICBvclxuICAgICAgICAgICAgICAgICAgICAgQG51bWJlclRva2VuKCkgICAgIG9yXG4gICAgICAgICAgICAgICAgICAgICBAcmVnZXhUb2tlbigpICAgICAgb3JcbiAgICAgICAgICAgICAgICAgICAgIEBqc1Rva2VuKCkgICAgICAgICBvclxuICAgICAgICAgICAgICAgICAgICAgQGxpdGVyYWxUb2tlbigpXG5cbiAgICAgICAgICAgICMgVXBkYXRlIHBvc2l0aW9uXG4gICAgICAgICAgICBbQGNodW5rTGluZSwgQGNodW5rQ29sdW1uXSA9IEBnZXRMaW5lQW5kQ29sdW1uRnJvbUNodW5rIGNvbnN1bWVkXG5cbiAgICAgICAgICAgIGkgKz0gY29uc3VtZWRcblxuICAgICAgICAgICAgcmV0dXJuIHtAdG9rZW5zLCBpbmRleDogaX0gaWYgb3B0cy51bnRpbEJhbGFuY2VkIGFuZCBAZW5kcy5sZW5ndGggaXMgMFxuXG4gICAgICAgIEBjbG9zZUluZGVudGF0aW9uKClcbiAgICAgICAgQGVycm9yIFwibWlzc2luZyAje2VuZC50YWd9XCIsIGVuZC5vcmlnaW5bMl0gaWYgZW5kID0gQGVuZHMucG9wKClcbiAgICAgICAgXG4gICAgICAgIGlmIGhhc0ZlYXR1cmUgb3B0cywgJ3Jld3JpdGUnXG4gICAgICAgICAgICAobmV3IFJld3JpdGVyKS5yZXdyaXRlIEB0b2tlbnMsIG9wdHNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgd2FybiAnc2tpcHBpbmcgcmV3cml0ZSEnIyAsIG9wdHNcblxuICAgICAgICBAdG9rZW5zXG5cbiAgICAjIFByZXByb2Nlc3MgdGhlIGNvZGUgdG8gcmVtb3ZlIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHdoaXRlc3BhY2UsIGNhcnJpYWdlIHJldHVybnMsIGV0Yy4gXG4gICAgXG4gICAgY2xlYW46IChjb2RlKSAtPlxuICAgICAgICBjb2RlID0gY29kZS5zbGljZSgxKSBpZiBjb2RlLmNoYXJDb2RlQXQoMCkgaXMgQk9NXG4gICAgICAgIGNvZGUgPSBjb2RlLnJlcGxhY2UoL1xcci9nLCAnJykucmVwbGFjZSBUUkFJTElOR19TUEFDRVMsICcnXG4gICAgICAgIGlmIFdISVRFU1BBQ0UudGVzdCBjb2RlXG4gICAgICAgICAgICBjb2RlID0gXCJcXG4je2NvZGV9XCJcbiAgICAgICAgICAgIEBjaHVua0xpbmUtLVxuICAgICAgICBjb2RlXG5cbiAgICAjIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMDAwMCAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICAjIE1hdGNoZXMgaWRlbnRpZnlpbmcgbGl0ZXJhbHM6IHZhcmlhYmxlcywga2V5d29yZHMsIG1ldGhvZCBuYW1lcywgZXRjLlxuICAgICMgQ2hlY2sgdG8gZW5zdXJlIHRoYXQgSmF2YVNjcmlwdCByZXNlcnZlZCB3b3JkcyBhcmVuJ3QgYmVpbmcgdXNlZCBhcyBpZGVudGlmaWVycy4gXG4gICAgIyBCZWNhdXNlIEtvZmZlZSByZXNlcnZlcyBhIGhhbmRmdWwgb2Yga2V5d29yZHMgdGhhdCBhcmUgYWxsb3dlZCBpbiBKYXZhU2NyaXB0LCBcbiAgICAjIHdlJ3JlIGNhcmVmdWwgbm90IHRvIHRhZyB0aGVtIGFzIGtleXdvcmRzIHdoZW4gcmVmZXJlbmNlZCBhcyBwcm9wZXJ0eSBuYW1lcyBoZXJlLCBcbiAgICAjIHNvIHlvdSBjYW4gc3RpbGwgZG8gYGpRdWVyeS5pcygpYCBldmVuIHRob3VnaCBgaXNgIG1lYW5zIGA9PT1gIG90aGVyd2lzZS5cbiAgICBcbiAgICBpZGVudGlmaWVyVG9rZW46IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gMCB1bmxlc3MgbWF0Y2ggPSBJREVOVElGSUVSLmV4ZWMgQGNodW5rXG4gICAgICAgIFtpbnB1dCwgaWQsIGNvbG9uXSA9IG1hdGNoXG5cbiAgICAgICAgaWRMZW5ndGggPSBpZC5sZW5ndGggIyBQcmVzZXJ2ZSBsZW5ndGggb2YgaWQgZm9yIGxvY2F0aW9uIGRhdGFcbiAgICAgICAgcG9wcGVkVG9rZW4gPSB1bmRlZmluZWRcblxuICAgICAgICBpZiBpZCBpcyAnb3duJyBhbmQgQHRhZygpIGlzICdGT1InXG4gICAgICAgICAgICBAdG9rZW4gJ09XTicsIGlkXG4gICAgICAgICAgICByZXR1cm4gaWQubGVuZ3RoXG4gICAgICAgIGlmIGlkIGlzICdmcm9tJyBhbmQgQHRhZygpIGlzICdZSUVMRCdcbiAgICAgICAgICAgIEB0b2tlbiAnRlJPTScsIGlkXG4gICAgICAgICAgICByZXR1cm4gaWQubGVuZ3RoXG4gICAgICAgIGlmIGlkIGlzICdhcycgYW5kIEBzZWVuSW1wb3J0XG4gICAgICAgICAgICBpZiBAdmFsdWUoKSBpcyAnKidcbiAgICAgICAgICAgICAgICBAdG9rZW5zW0B0b2tlbnMubGVuZ3RoIC0gMV1bMF0gPSAnSU1QT1JUX0FMTCdcbiAgICAgICAgICAgIGVsc2UgaWYgQHZhbHVlKCkgaW4gQ09GRkVFX0tFWVdPUkRTXG4gICAgICAgICAgICAgICAgQHRva2Vuc1tAdG9rZW5zLmxlbmd0aCAtIDFdWzBdID0gJ0lERU5USUZJRVInXG4gICAgICAgICAgICBpZiBAdGFnKCkgaW4gWydERUZBVUxUJyAnSU1QT1JUX0FMTCcgJ0lERU5USUZJRVInXVxuICAgICAgICAgICAgICAgIEB0b2tlbiAnQVMnLCBpZFxuICAgICAgICAgICAgICAgIHJldHVybiBpZC5sZW5ndGhcbiAgICAgICAgaWYgaWQgaXMgJ2FzJyBhbmQgQHNlZW5FeHBvcnQgYW5kIEB0YWcoKSBpbiBbJ0lERU5USUZJRVInICdERUZBVUxUJ11cbiAgICAgICAgICAgIEB0b2tlbiAnQVMnLCBpZFxuICAgICAgICAgICAgcmV0dXJuIGlkLmxlbmd0aFxuICAgICAgICBpZiBpZCBpcyAnZGVmYXVsdCcgYW5kIEBzZWVuRXhwb3J0IGFuZCBAdGFnKCkgaW4gWydFWFBPUlQnICdBUyddXG4gICAgICAgICAgICBAdG9rZW4gJ0RFRkFVTFQnLCBpZFxuICAgICAgICAgICAgcmV0dXJuIGlkLmxlbmd0aFxuXG4gICAgICAgIFsuLi4sIHByZXZdID0gQHRva2Vuc1xuXG4gICAgICAgIHRhZyA9XG4gICAgICAgICAgICBpZiBjb2xvbiBvciBwcmV2PyBhbmQgKHByZXZbMF0gaW4gWycuJyAnPy4nICc6OicgJz86OiddIG9yIG5vdCBwcmV2LnNwYWNlZCBhbmQgcHJldlswXSBpcyAnQCcpXG4gICAgICAgICAgICAgICAgJ1BST1BFUlRZJ1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICdJREVOVElGSUVSJ1xuXG4gICAgICAgIGlmIHRhZyBpcyAnSURFTlRJRklFUicgYW5kIGlkWzBdID09ICfilrgnIGFuZCBpZFsxLi5dIGluIE1FVEFfS0VZV09SRFNcbiAgICAgICAgICAgICMgbG9nICfilrhNRVRBJywgaWQgIywgQHRva2Vuc1stMS4uLTFdLCBAdG9rZW5zWy0xXSwgQHRva2Vucy5sZW5ndGhcbiAgICAgICAgICAgICMgQHRva2Vucy5wb3AoKVxuICAgICAgICAgICAgaWYgaWQgPT0gJ+KWuGVsaWYnXG4gICAgICAgICAgICAgICAgQHRva2VuICdNRVRBX0VMU0UnLCAnZWxzZSdcbiAgICAgICAgICAgICAgICB0YWcgPSAnTUVUQV9JRidcbiAgICAgICAgICAgICAgICBpZCAgPSAnaWYnXG4gICAgICAgICAgICBlbHNlIGlmIGlkID09ICfilrh0aGVuJ1xuICAgICAgICAgICAgICAgIHRhZyA9ICdUSEVOJ1xuICAgICAgICAgICAgICAgIGlkICA9ICd0aGVuJ1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGlkID0gaWRbMS4uXVxuICAgICAgICAgICAgICAgIHRhZyA9ICdNRVRBXycgKyBpZC50b1VwcGVyQ2FzZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgZWxzZSBpZiB0YWcgaXMgJ0lERU5USUZJRVInIGFuZCAoaWQgaW4gSlNfS0VZV09SRFMgb3IgaWQgaW4gQ09GRkVFX0tFWVdPUkRTKSBhbmQgbm90IChAZXhwb3J0U3BlY2lmaWVyTGlzdCBhbmQgaWQgaW4gQ09GRkVFX0tFWVdPUkRTKVxuICAgICAgICAgICAgdGFnID0gaWQudG9VcHBlckNhc2UoKVxuICAgICAgICAgICAgaWYgdGFnIGlzICdXSEVOJyBhbmQgQHRhZygpIGluIExJTkVfQlJFQUtcbiAgICAgICAgICAgICAgICB0YWcgPSAnTEVBRElOR19XSEVOJ1xuICAgICAgICAgICAgZWxzZSBpZiB0YWcgaXMgJ0ZPUidcbiAgICAgICAgICAgICAgICBAc2VlbkZvciA9IHllc1xuICAgICAgICAgICAgZWxzZSBpZiB0YWcgaXMgJ1VOTEVTUydcbiAgICAgICAgICAgICAgICB0YWcgPSAnSUYnXG4gICAgICAgICAgICBlbHNlIGlmIHRhZyBpcyAnSU1QT1JUJ1xuICAgICAgICAgICAgICAgIEBzZWVuSW1wb3J0ID0geWVzXG4gICAgICAgICAgICBlbHNlIGlmIHRhZyBpcyAnRVhQT1JUJ1xuICAgICAgICAgICAgICAgIEBzZWVuRXhwb3J0ID0geWVzXG4gICAgICAgICAgICBlbHNlIGlmIHRhZyBpbiBVTkFSWVxuICAgICAgICAgICAgICAgIHRhZyA9ICdVTkFSWSdcbiAgICAgICAgICAgIGVsc2UgaWYgdGFnIGluIFJFTEFUSU9OXG4gICAgICAgICAgICAgICAgaWYgdGFnICE9ICdJTlNUQU5DRU9GJyBhbmQgQHNlZW5Gb3JcbiAgICAgICAgICAgICAgICAgICAgdGFnID0gJ0ZPUicgKyB0YWdcbiAgICAgICAgICAgICAgICAgICAgQHNlZW5Gb3IgPSBub1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgdGFnID0gJ1JFTEFUSU9OJ1xuICAgICAgICAgICAgICAgICAgICBpZiBAdmFsdWUoKSBpcyAnISdcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcHBlZFRva2VuID0gQHRva2Vucy5wb3AoKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSAnIScgKyBpZFxuICAgICAgICBlbHNlIGlmIHRhZyBpcyAnSURFTlRJRklFUicgYW5kIEBzZWVuRm9yIGFuZCBpZCBpcyAnZnJvbScgYW5kIGlzRm9yRnJvbShwcmV2KVxuICAgICAgICAgICAgdGFnID0gJ0ZPUkZST00nXG4gICAgICAgICAgICBAc2VlbkZvciA9IG5vXG5cbiAgICAgICAgaWYgdGFnIGlzICdJREVOVElGSUVSJyBhbmQgaWQgaW4gUkVTRVJWRURcbiAgICAgICAgICAgIEBlcnJvciBcInJlc2VydmVkIHdvcmQgJyN7aWR9J1wiLCBsZW5ndGg6IGlkLmxlbmd0aFxuXG4gICAgICAgIHVubGVzcyB0YWcgaXMgJ1BST1BFUlRZJ1xuICAgICAgICAgICAgaWYgaWQgaW4gQ09GRkVFX0FMSUFTRVNcbiAgICAgICAgICAgICAgICBhbGlhcyA9IGlkXG4gICAgICAgICAgICAgICAgaWQgPSBDT0ZGRUVfQUxJQVNfTUFQW2lkXVxuICAgICAgICAgICAgdGFnID0gc3dpdGNoIGlkXG4gICAgICAgICAgICAgICAgd2hlbiAnIScgICAgICAgICAgICAgICAgICAgIHRoZW4gJ1VOQVJZJ1xuICAgICAgICAgICAgICAgIHdoZW4gJz09JywgJyE9JyAgICAgICAgICAgICB0aGVuICdDT01QQVJFJ1xuICAgICAgICAgICAgICAgIHdoZW4gJ3RydWUnLCAnZmFsc2UnICAgICAgICB0aGVuICdCT09MJ1xuICAgICAgICAgICAgICAgIHdoZW4gJyYmJywgJ3x8JyAgICAgICAgICAgICB0aGVuIGlkXG4gICAgICAgICAgICAgICAgd2hlbiAnYnJlYWsnLCAnY29udGludWUnLCAnZGVidWdnZXInIHRoZW4gJ1NUQVRFTUVOVCdcbiAgICAgICAgICAgICAgICBlbHNlICAgIHRhZ1xuXG4gICAgICAgIHRhZ1Rva2VuID0gQHRva2VuIHRhZywgaWQsIDAsIGlkTGVuZ3RoXG4gICAgICAgIHRhZ1Rva2VuLm9yaWdpbiA9IFt0YWcsIGFsaWFzLCB0YWdUb2tlblsyXV0gaWYgYWxpYXNcbiAgICAgICAgaWYgcG9wcGVkVG9rZW5cbiAgICAgICAgICAgIFt0YWdUb2tlblsyXS5maXJzdF9saW5lLCB0YWdUb2tlblsyXS5maXJzdF9jb2x1bW5dID1cbiAgICAgICAgICAgICAgICBbcG9wcGVkVG9rZW5bMl0uZmlyc3RfbGluZSwgcG9wcGVkVG9rZW5bMl0uZmlyc3RfY29sdW1uXVxuICAgICAgICBpZiBjb2xvblxuICAgICAgICAgICAgY29sb25PZmZzZXQgPSBpbnB1dC5sYXN0SW5kZXhPZiAnOidcbiAgICAgICAgICAgIEB0b2tlbiAnOicsICc6JywgY29sb25PZmZzZXQsIGNvbG9uLmxlbmd0aFxuXG4gICAgICAgIGlucHV0Lmxlbmd0aFxuXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcblxuICAgICMgTWF0Y2hlcyBudW1iZXJzLCBpbmNsdWRpbmcgZGVjaW1hbHMsIGhleCwgYW5kIGV4cG9uZW50aWFsIG5vdGF0aW9uLlxuICAgICMgQmUgY2FyZWZ1bCBub3QgdG8gaW50ZXJmZXJlIHdpdGggcmFuZ2VzLWluLXByb2dyZXNzLlxuICAgIFxuICAgIG51bWJlclRva2VuOiAtPlxuICAgICAgICByZXR1cm4gMCB1bmxlc3MgbWF0Y2ggPSBOVU1CRVIuZXhlYyBAY2h1bmtcblxuICAgICAgICBudW1iZXIgPSBtYXRjaFswXVxuICAgICAgICBsZXhlZExlbmd0aCA9IG51bWJlci5sZW5ndGhcblxuICAgICAgICBzd2l0Y2hcbiAgICAgICAgICAgIHdoZW4gL14wW0JPWF0vLnRlc3QgbnVtYmVyXG4gICAgICAgICAgICAgICAgQGVycm9yIFwicmFkaXggcHJlZml4IGluICcje251bWJlcn0nIG11c3QgYmUgbG93ZXJjYXNlXCIsIG9mZnNldDogMVxuICAgICAgICAgICAgd2hlbiAvXig/ITB4KS4qRS8udGVzdCBudW1iZXJcbiAgICAgICAgICAgICAgICBAZXJyb3IgXCJleHBvbmVudGlhbCBub3RhdGlvbiBpbiAnI3tudW1iZXJ9JyBtdXN0IGJlIGluZGljYXRlZCB3aXRoIGEgbG93ZXJjYXNlICdlJ1wiLFxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IG51bWJlci5pbmRleE9mKCdFJylcbiAgICAgICAgICAgIHdoZW4gL14wXFxkKls4OV0vLnRlc3QgbnVtYmVyXG4gICAgICAgICAgICAgICAgQGVycm9yIFwiZGVjaW1hbCBsaXRlcmFsICcje251bWJlcn0nIG11c3Qgbm90IGJlIHByZWZpeGVkIHdpdGggJzAnXCIsIGxlbmd0aDogbGV4ZWRMZW5ndGhcbiAgICAgICAgICAgIHdoZW4gL14wXFxkKy8udGVzdCBudW1iZXJcbiAgICAgICAgICAgICAgICBAZXJyb3IgXCJvY3RhbCBsaXRlcmFsICcje251bWJlcn0nIG11c3QgYmUgcHJlZml4ZWQgd2l0aCAnMG8nXCIsIGxlbmd0aDogbGV4ZWRMZW5ndGhcblxuICAgICAgICBiYXNlID0gc3dpdGNoIG51bWJlci5jaGFyQXQgMVxuICAgICAgICAgICAgd2hlbiAnYicgdGhlbiAyXG4gICAgICAgICAgICB3aGVuICdvJyB0aGVuIDhcbiAgICAgICAgICAgIHdoZW4gJ3gnIHRoZW4gMTZcbiAgICAgICAgICAgIGVsc2UgbnVsbFxuICAgICAgICBudW1iZXJWYWx1ZSA9IGlmIGJhc2U/IHRoZW4gcGFyc2VJbnQobnVtYmVyWzIuLl0sIGJhc2UpIGVsc2UgcGFyc2VGbG9hdChudW1iZXIpXG4gICAgICAgIGlmIG51bWJlci5jaGFyQXQoMSkgaW4gWydiJywgJ28nXVxuICAgICAgICAgICAgbnVtYmVyID0gXCIweCN7bnVtYmVyVmFsdWUudG9TdHJpbmcgMTZ9XCJcblxuICAgICAgICB0YWcgPSBpZiBudW1iZXJWYWx1ZSBpcyBJbmZpbml0eSB0aGVuICdJTkZJTklUWScgZWxzZSAnTlVNQkVSJ1xuICAgICAgICBAdG9rZW4gdGFnLCBudW1iZXIsIDAsIGxleGVkTGVuZ3RoXG4gICAgICAgIGxleGVkTGVuZ3RoXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgICMgTWF0Y2hlcyBzdHJpbmdzLCBpbmNsdWRpbmcgbXVsdGktbGluZSBzdHJpbmdzLCBhcyB3ZWxsIGFzIGhlcmVkb2NzLCB3aXRoIG9yIHdpdGhvdXQgaW50ZXJwb2xhdGlvbi5cbiAgICBcbiAgICBzdHJpbmdUb2tlbjogLT5cbiAgICAgICAgW3F1b3RlXSA9IFNUUklOR19TVEFSVC5leGVjKEBjaHVuaykgfHwgW11cbiAgICAgICAgcmV0dXJuIDAgdW5sZXNzIHF1b3RlXG5cbiAgICAgICAgIyBJZiB0aGUgcHJlY2VkaW5nIHRva2VuIGlzIGBmcm9tYCBhbmQgdGhpcyBpcyBhbiBpbXBvcnQgb3IgZXhwb3J0IHN0YXRlbWVudCwgcHJvcGVybHkgdGFnIHRoZSBgZnJvbWAuXG4gICAgICAgIFxuICAgICAgICBpZiBAdG9rZW5zLmxlbmd0aCBhbmQgQHZhbHVlKCkgaXMgJ2Zyb20nIGFuZCAoQHNlZW5JbXBvcnQgb3IgQHNlZW5FeHBvcnQpXG4gICAgICAgICAgICBAdG9rZW5zW0B0b2tlbnMubGVuZ3RoIC0gMV1bMF0gPSAnRlJPTSdcblxuICAgICAgICByZWdleCA9IHN3aXRjaCBxdW90ZVxuICAgICAgICAgICAgd2hlbiBcIidcIiAgIHRoZW4gU1RSSU5HX1NJTkdMRVxuICAgICAgICAgICAgd2hlbiAnXCInICAgdGhlbiBTVFJJTkdfRE9VQkxFXG4gICAgICAgICAgICB3aGVuIFwiJycnXCIgdGhlbiBIRVJFRE9DX1NJTkdMRVxuICAgICAgICAgICAgd2hlbiAnXCJcIlwiJyB0aGVuIEhFUkVET0NfRE9VQkxFXG4gICAgICAgIGhlcmVkb2MgPSBxdW90ZS5sZW5ndGggaXMgM1xuXG4gICAgICAgIHt0b2tlbnMsIGluZGV4OiBlbmR9ID0gQG1hdGNoV2l0aEludGVycG9sYXRpb25zIHJlZ2V4LCBxdW90ZVxuICAgICAgICAkID0gdG9rZW5zLmxlbmd0aCAtIDFcblxuICAgICAgICBkZWxpbWl0ZXIgPSBxdW90ZS5jaGFyQXQoMClcbiAgICAgICAgaWYgaGVyZWRvY1xuICAgICAgICAgICAgIyBGaW5kIHRoZSBzbWFsbGVzdCBpbmRlbnRhdGlvbi4gSXQgd2lsbCBiZSByZW1vdmVkIGZyb20gYWxsIGxpbmVzIGxhdGVyLlxuICAgICAgICAgICAgaW5kZW50ID0gbnVsbFxuICAgICAgICAgICAgZG9jID0gKHRva2VuWzFdIGZvciB0b2tlbiwgaSBpbiB0b2tlbnMgd2hlbiB0b2tlblswXSBpcyAnTkVPU1RSSU5HJykuam9pbiAnI3t9J1xuICAgICAgICAgICAgd2hpbGUgbWF0Y2ggPSBIRVJFRE9DX0lOREVOVC5leGVjIGRvY1xuICAgICAgICAgICAgICAgIGF0dGVtcHQgPSBtYXRjaFsxXVxuICAgICAgICAgICAgICAgIGluZGVudCA9IGF0dGVtcHQgaWYgaW5kZW50IGlzIG51bGwgb3IgMCA8IGF0dGVtcHQubGVuZ3RoIDwgaW5kZW50Lmxlbmd0aFxuICAgICAgICAgICAgaW5kZW50UmVnZXggPSAvLy8gXFxuI3tpbmRlbnR9IC8vL2cgaWYgaW5kZW50XG4gICAgICAgICAgICBAbWVyZ2VJbnRlcnBvbGF0aW9uVG9rZW5zIHRva2Vucywge2RlbGltaXRlcn0sICh2YWx1ZSwgaSkgPT5cbiAgICAgICAgICAgICAgICB2YWx1ZSA9IEBmb3JtYXRTdHJpbmcgdmFsdWUsIGRlbGltaXRlcjogcXVvdGVcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UgaW5kZW50UmVnZXgsICdcXG4nIGlmIGluZGVudFJlZ2V4XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlIExFQURJTkdfQkxBTktfTElORSwgICAgJycgaWYgaSBpcyAwXG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlIFRSQUlMSU5HX0JMQU5LX0xJTkUsICcnIGlmIGkgaXMgJFxuICAgICAgICAgICAgICAgIHZhbHVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBtZXJnZUludGVycG9sYXRpb25Ub2tlbnMgdG9rZW5zLCB7ZGVsaW1pdGVyfSwgKHZhbHVlLCBpKSA9PlxuICAgICAgICAgICAgICAgIHZhbHVlID0gQGZvcm1hdFN0cmluZyB2YWx1ZSwgZGVsaW1pdGVyOiBxdW90ZVxuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZSBTSU1QTEVfU1RSSU5HX09NSVQsIChtYXRjaCwgb2Zmc2V0KSAtPlxuICAgICAgICAgICAgICAgICAgICBpZiAoaSBpcyAwIGFuZCBvZmZzZXQgaXMgMCkgb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAoaSBpcyAkIGFuZCBvZmZzZXQgKyBtYXRjaC5sZW5ndGggaXMgdmFsdWUubGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICAgICAgJydcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgJyAnXG4gICAgICAgICAgICAgICAgdmFsdWVcbiAgICAgICAgZW5kXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAgICAwMDAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgY29tbWVudFRva2VuOiAtPlxuICAgICAgICByZXR1cm4gMCB1bmxlc3MgbWF0Y2ggPSBAY2h1bmsubWF0Y2ggQ09NTUVOVFxuICAgICAgICBbY29tbWVudCwgaGVyZV0gPSBtYXRjaFxuICAgICAgICBpZiBoZXJlXG4gICAgICAgICAgICBpZiBtYXRjaCA9IEhFUkVDT01NRU5UX0lMTEVHQUwuZXhlYyBjb21tZW50XG4gICAgICAgICAgICAgICAgQGVycm9yIFwiYmxvY2sgY29tbWVudHMgY2Fubm90IGNvbnRhaW4gI3ttYXRjaFswXX1cIixcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiBtYXRjaC5pbmRleCwgbGVuZ3RoOiBtYXRjaFswXS5sZW5ndGhcbiAgICAgICAgICAgIGlmIGhlcmUuaW5kZXhPZignXFxuJykgPj0gMFxuICAgICAgICAgICAgICAgIGhlcmUgPSBoZXJlLnJlcGxhY2UgLy8vIFxcbiAje3JlcGVhdCAnICcsIEBpbmRlbnR9IC8vL2csICdcXG4nXG4gICAgICAgICAgICBAdG9rZW4gJ0hFUkVDT01NRU5UJywgaGVyZSwgMCwgY29tbWVudC5sZW5ndGhcbiAgICAgICAgY29tbWVudC5sZW5ndGhcblxuICAgICMgICAgICAgMDAwICAgMDAwMDAwMCAgXG4gICAgIyAgICAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjICAgICAgIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICAjIE1hdGNoZXMgSmF2YVNjcmlwdCBpbnRlcnBvbGF0ZWQgZGlyZWN0bHkgaW50byB0aGUgc291cmNlIHZpYSBiYWNrdGlja3MuXG4gICAgXG4gICAganNUb2tlbjogLT5cbiAgICAgICAgcmV0dXJuIDAgdW5sZXNzIEBjaHVuay5jaGFyQXQoMCkgaXMgJ2AnIGFuZFxuICAgICAgICAgICAgKG1hdGNoID0gSEVSRV9KU1RPS0VOLmV4ZWMoQGNodW5rKSBvciBKU1RPS0VOLmV4ZWMoQGNodW5rKSlcbiAgICAgICAgIyBDb252ZXJ0IGVzY2FwZWQgYmFja3RpY2tzIHRvIGJhY2t0aWNrcywgYW5kIGVzY2FwZWQgYmFja3NsYXNoZXNcbiAgICAgICAgIyBqdXN0IGJlZm9yZSBlc2NhcGVkIGJhY2t0aWNrcyB0byBiYWNrc2xhc2hlc1xuICAgICAgICBzY3JpcHQgPSBtYXRjaFsxXS5yZXBsYWNlIC9cXFxcKyhgfCQpL2csIChzdHJpbmcpIC0+XG4gICAgICAgICAgICAjIGBzdHJpbmdgIGlzIGFsd2F5cyBhIHZhbHVlIGxpa2UgJ1xcYCcsICdcXFxcXFxgJywgJ1xcXFxcXFxcXFxgJywgZXRjLlxuICAgICAgICAgICAgIyBCeSByZWR1Y2luZyBpdCB0byBpdHMgbGF0dGVyIGhhbGYsIHdlIHR1cm4gJ1xcYCcgdG8gJ2AnLCAnXFxcXFxcYCcgdG8gJ1xcYCcsIGV0Yy5cbiAgICAgICAgICAgIHN0cmluZ1stTWF0aC5jZWlsKHN0cmluZy5sZW5ndGggLyAyKS4uXVxuICAgICAgICBAdG9rZW4gJ0pTJywgc2NyaXB0LCAwLCBtYXRjaFswXS5sZW5ndGhcbiAgICAgICAgbWF0Y2hbMF0ubGVuZ3RoXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAwMDAwICAwMDAwMDAwICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgICMgTWF0Y2hlcyByZWd1bGFyIGV4cHJlc3Npb24gbGl0ZXJhbHMsIGFzIHdlbGwgYXMgbXVsdGlsaW5lIGV4dGVuZGVkIG9uZXMuXG4gICAgIyBMZXhpbmcgcmVndWxhciBleHByZXNzaW9ucyBpcyBkaWZmaWN1bHQgdG8gZGlzdGluZ3Vpc2ggZnJvbSBkaXZpc2lvbiwgXG4gICAgIyBzbyB3ZSBib3Jyb3cgc29tZSBiYXNpYyBoZXVyaXN0aWNzIGZyb20gSmF2YVNjcmlwdCBhbmQgUnVieS5cbiAgICBcbiAgICByZWdleFRva2VuOiAtPlxuICAgICAgICBzd2l0Y2hcbiAgICAgICAgICAgIHdoZW4gbWF0Y2ggPSBSRUdFWF9JTExFR0FMLmV4ZWMgQGNodW5rXG4gICAgICAgICAgICAgICAgQGVycm9yIFwicmVndWxhciBleHByZXNzaW9ucyBjYW5ub3QgYmVnaW4gd2l0aCAje21hdGNoWzJdfVwiLFxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IG1hdGNoLmluZGV4ICsgbWF0Y2hbMV0ubGVuZ3RoXG4gICAgICAgICAgICB3aGVuIG1hdGNoID0gQG1hdGNoV2l0aEludGVycG9sYXRpb25zIEhFUkVHRVgsICcvLy8nXG4gICAgICAgICAgICAgICAge3Rva2VucywgaW5kZXh9ID0gbWF0Y2hcbiAgICAgICAgICAgIHdoZW4gbWF0Y2ggPSBSRUdFWC5leGVjIEBjaHVua1xuICAgICAgICAgICAgICAgIFtyZWdleCwgYm9keSwgY2xvc2VkXSA9IG1hdGNoXG4gICAgICAgICAgICAgICAgQHZhbGlkYXRlRXNjYXBlcyBib2R5LCBpc1JlZ2V4OiB5ZXMsIG9mZnNldEluQ2h1bms6IDFcbiAgICAgICAgICAgICAgICBib2R5ID0gQGZvcm1hdFJlZ2V4IGJvZHksIGRlbGltaXRlcjogJy8nXG4gICAgICAgICAgICAgICAgaW5kZXggPSByZWdleC5sZW5ndGhcbiAgICAgICAgICAgICAgICBbLi4uLCBwcmV2XSA9IEB0b2tlbnNcbiAgICAgICAgICAgICAgICBpZiBwcmV2XG4gICAgICAgICAgICAgICAgICAgIGlmIHByZXYuc3BhY2VkIGFuZCBwcmV2WzBdIGluIENBTExBQkxFXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMCBpZiBub3QgY2xvc2VkIG9yIFBPU1NJQkxZX0RJVklTSU9OLnRlc3QgcmVnZXhcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBwcmV2WzBdIGluIE5PVF9SRUdFWFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgICAgICAgICBAZXJyb3IgJ21pc3NpbmcgLyAodW5jbG9zZWQgcmVnZXgpJyB1bmxlc3MgY2xvc2VkXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIDBcblxuICAgICAgICBbZmxhZ3NdID0gUkVHRVhfRkxBR1MuZXhlYyBAY2h1bmtbaW5kZXguLl1cbiAgICAgICAgZW5kID0gaW5kZXggKyBmbGFncy5sZW5ndGhcbiAgICAgICAgb3JpZ2luID0gQG1ha2VUb2tlbiAnUkVHRVgnLCBudWxsLCAwLCBlbmRcbiAgICAgICAgc3dpdGNoXG4gICAgICAgICAgICB3aGVuIG5vdCBWQUxJRF9GTEFHUy50ZXN0IGZsYWdzXG4gICAgICAgICAgICAgICAgQGVycm9yIFwiaW52YWxpZCByZWd1bGFyIGV4cHJlc3Npb24gZmxhZ3MgI3tmbGFnc31cIiwgb2Zmc2V0OiBpbmRleCwgbGVuZ3RoOiBmbGFncy5sZW5ndGhcbiAgICAgICAgICAgIHdoZW4gcmVnZXggb3IgdG9rZW5zLmxlbmd0aCBpcyAxXG4gICAgICAgICAgICAgICAgYm9keSA/PSBAZm9ybWF0SGVyZWdleCB0b2tlbnNbMF1bMV1cbiAgICAgICAgICAgICAgICBAdG9rZW4gJ1JFR0VYJywgXCIje0BtYWtlRGVsaW1pdGVkTGl0ZXJhbCBib2R5LCBkZWxpbWl0ZXI6ICcvJ30je2ZsYWdzfVwiLCAwLCBlbmQsIG9yaWdpblxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEB0b2tlbiAnUkVHRVhfU1RBUlQnLCAnKCcsIDAsIDAsIG9yaWdpblxuICAgICAgICAgICAgICAgIEB0b2tlbiAnSURFTlRJRklFUicsICdSZWdFeHAnLCAwLCAwXG4gICAgICAgICAgICAgICAgQHRva2VuICdDQUxMX1NUQVJUJywgJygnLCAwLCAwXG4gICAgICAgICAgICAgICAgQG1lcmdlSW50ZXJwb2xhdGlvblRva2VucyB0b2tlbnMsIHtkZWxpbWl0ZXI6ICdcIicsIGRvdWJsZTogeWVzfSwgQGZvcm1hdEhlcmVnZXhcbiAgICAgICAgICAgICAgICBpZiBmbGFnc1xuICAgICAgICAgICAgICAgICAgICBAdG9rZW4gJywnLCAnLCcsIGluZGV4IC0gMSwgMFxuICAgICAgICAgICAgICAgICAgICBAdG9rZW4gJ1NUUklORycsICdcIicgKyBmbGFncyArICdcIicsIGluZGV4IC0gMSwgZmxhZ3MubGVuZ3RoXG4gICAgICAgICAgICAgICAgQHRva2VuICcpJywgJyknLCBlbmQgLSAxLCAwXG4gICAgICAgICAgICAgICAgQHRva2VuICdSRUdFWF9FTkQnLCAnKScsIGVuZCAtIDEsIDBcblxuICAgICAgICBlbmRcblxuICAgICMgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgXG4gICAgXG4gICAgIyBNYXRjaGVzIG5ld2xpbmVzLCBpbmRlbnRzLCBhbmQgb3V0ZGVudHMsIGFuZCBkZXRlcm1pbmVzIHdoaWNoIGlzIHdoaWNoLlxuICAgICMgSWYgd2UgY2FuIGRldGVjdCB0aGF0IHRoZSBjdXJyZW50IGxpbmUgaXMgY29udGludWVkIG9udG8gdGhlIG5leHQgbGluZSxcbiAgICAjIHRoZW4gdGhlIG5ld2xpbmUgaXMgc3VwcHJlc3NlZDpcbiAgICAjXG4gICAgIyAgICAgICAgICAgZWxlbWVudHNcbiAgICAjICAgICAgICAgICAgICAgLmVhY2goIC4uLiApXG4gICAgIyAgICAgICAgICAgICAgIC5tYXAoIC4uLiApXG4gICAgI1xuICAgICMgS2VlcHMgdHJhY2sgb2YgdGhlIGxldmVsIG9mIGluZGVudGF0aW9uLCBiZWNhdXNlIGEgc2luZ2xlIG91dGRlbnQgdG9rZW5cbiAgICAjIGNhbiBjbG9zZSBtdWx0aXBsZSBpbmRlbnRzLCBzbyB3ZSBuZWVkIHRvIGtub3cgaG93IGZhciBpbiB3ZSBoYXBwZW4gdG8gYmUuXG4gICAgXG4gICAgbGluZVRva2VuOiAtPlxuICAgICAgICByZXR1cm4gMCB1bmxlc3MgbWF0Y2ggPSBNVUxUSV9ERU5ULmV4ZWMgQGNodW5rXG4gICAgICAgIGluZGVudCA9IG1hdGNoWzBdXG5cbiAgICAgICAgQHNlZW5Gb3IgPSBub1xuICAgICAgICBAc2VlbkltcG9ydCA9IG5vIHVubGVzcyBAaW1wb3J0U3BlY2lmaWVyTGlzdFxuICAgICAgICBAc2VlbkV4cG9ydCA9IG5vIHVubGVzcyBAZXhwb3J0U3BlY2lmaWVyTGlzdFxuXG4gICAgICAgIHNpemUgPSBpbmRlbnQubGVuZ3RoIC0gMSAtIGluZGVudC5sYXN0SW5kZXhPZiAnXFxuJ1xuICAgICAgICBub05ld2xpbmVzID0gQHVuZmluaXNoZWQoKVxuXG4gICAgICAgIGlmIHNpemUgLSBAaW5kZWJ0IGlzIEBpbmRlbnRcbiAgICAgICAgICAgIGlmIG5vTmV3bGluZXMgdGhlbiBAc3VwcHJlc3NOZXdsaW5lcygpIGVsc2UgQG5ld2xpbmVUb2tlbiAwXG4gICAgICAgICAgICByZXR1cm4gaW5kZW50Lmxlbmd0aFxuXG4gICAgICAgIGlmIHNpemUgPiBAaW5kZW50XG4gICAgICAgICAgICBpZiBub05ld2xpbmVzXG4gICAgICAgICAgICAgICAgQGluZGVidCA9IHNpemUgLSBAaW5kZW50XG4gICAgICAgICAgICAgICAgQHN1cHByZXNzTmV3bGluZXMoKVxuICAgICAgICAgICAgICAgIHJldHVybiBpbmRlbnQubGVuZ3RoXG4gICAgICAgICAgICB1bmxlc3MgQHRva2Vucy5sZW5ndGhcbiAgICAgICAgICAgICAgICBAYmFzZUluZGVudCA9IEBpbmRlbnQgPSBzaXplXG4gICAgICAgICAgICAgICAgcmV0dXJuIGluZGVudC5sZW5ndGhcbiAgICAgICAgICAgIGRpZmYgPSBzaXplIC0gQGluZGVudCArIEBvdXRkZWJ0XG4gICAgICAgICAgICBAdG9rZW4gJ0lOREVOVCcsIGRpZmYsIGluZGVudC5sZW5ndGggLSBzaXplLCBzaXplXG4gICAgICAgICAgICBAaW5kZW50cy5wdXNoIGRpZmZcbiAgICAgICAgICAgIEBlbmRzLnB1c2gge3RhZzogJ09VVERFTlQnfVxuICAgICAgICAgICAgQG91dGRlYnQgPSBAaW5kZWJ0ID0gMFxuICAgICAgICAgICAgQGluZGVudCA9IHNpemVcbiAgICAgICAgZWxzZSBpZiBzaXplIDwgQGJhc2VJbmRlbnRcbiAgICAgICAgICAgIEBlcnJvciAnbWlzc2luZyBpbmRlbnRhdGlvbicsIG9mZnNldDogaW5kZW50Lmxlbmd0aFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAaW5kZWJ0ID0gMFxuICAgICAgICAgICAgQG91dGRlbnRUb2tlbiBAaW5kZW50IC0gc2l6ZSwgbm9OZXdsaW5lcywgaW5kZW50Lmxlbmd0aFxuICAgICAgICBpbmRlbnQubGVuZ3RoXG5cbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICAjIFJlY29yZCBhbiBvdXRkZW50IHRva2VuIG9yIG11bHRpcGxlIHRva2VucywgaWYgd2UgaGFwcGVuIHRvIGJlIG1vdmluZyBiYWNrXG4gICAgIyBpbndhcmRzIHBhc3Qgc2V2ZXJhbCByZWNvcmRlZCBpbmRlbnRzLiBTZXRzIG5ldyBAaW5kZW50IHZhbHVlLlxuICAgIFxuICAgIG91dGRlbnRUb2tlbjogKG1vdmVPdXQsIG5vTmV3bGluZXMsIG91dGRlbnRMZW5ndGgpIC0+XG4gICAgICAgIGRlY3JlYXNlZEluZGVudCA9IEBpbmRlbnQgLSBtb3ZlT3V0XG4gICAgICAgIHdoaWxlIG1vdmVPdXQgPiAwXG4gICAgICAgICAgICBsYXN0SW5kZW50ID0gQGluZGVudHNbQGluZGVudHMubGVuZ3RoIC0gMV1cbiAgICAgICAgICAgIGlmIG5vdCBsYXN0SW5kZW50XG4gICAgICAgICAgICAgICAgbW92ZU91dCA9IDBcbiAgICAgICAgICAgIGVsc2UgaWYgbGFzdEluZGVudCBpcyBAb3V0ZGVidFxuICAgICAgICAgICAgICAgIG1vdmVPdXQgLT0gQG91dGRlYnRcbiAgICAgICAgICAgICAgICBAb3V0ZGVidCA9IDBcbiAgICAgICAgICAgIGVsc2UgaWYgbGFzdEluZGVudCA8IEBvdXRkZWJ0XG4gICAgICAgICAgICAgICAgQG91dGRlYnQgLT0gbGFzdEluZGVudFxuICAgICAgICAgICAgICAgIG1vdmVPdXQgIC09IGxhc3RJbmRlbnRcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBkZW50ID0gQGluZGVudHMucG9wKCkgKyBAb3V0ZGVidFxuICAgICAgICAgICAgICAgIGlmIG91dGRlbnRMZW5ndGggYW5kIEBjaHVua1tvdXRkZW50TGVuZ3RoXSBpbiBJTkRFTlRBQkxFX0NMT1NFUlNcbiAgICAgICAgICAgICAgICAgICAgZGVjcmVhc2VkSW5kZW50IC09IGRlbnQgLSBtb3ZlT3V0XG4gICAgICAgICAgICAgICAgICAgIG1vdmVPdXQgPSBkZW50XG4gICAgICAgICAgICAgICAgQG91dGRlYnQgPSAwXG4gICAgICAgICAgICAgICAgIyBwYWlyIG1pZ2h0IGNhbGwgb3V0ZGVudFRva2VuLCBzbyBwcmVzZXJ2ZSBkZWNyZWFzZWRJbmRlbnRcbiAgICAgICAgICAgICAgICBAcGFpciAnT1VUREVOVCdcbiAgICAgICAgICAgICAgICBAdG9rZW4gJ09VVERFTlQnLCBtb3ZlT3V0LCAwLCBvdXRkZW50TGVuZ3RoXG4gICAgICAgICAgICAgICAgbW92ZU91dCAtPSBkZW50XG4gICAgICAgIEBvdXRkZWJ0IC09IG1vdmVPdXQgaWYgZGVudFxuICAgICAgICBAdG9rZW5zLnBvcCgpIHdoaWxlIEB2YWx1ZSgpIGlzICc7J1xuXG4gICAgICAgIEB0b2tlbiAnVEVSTUlOQVRPUicsICdcXG4nLCBvdXRkZW50TGVuZ3RoLCAwIHVubGVzcyBAdGFnKCkgaXMgJ1RFUk1JTkFUT1InIG9yIG5vTmV3bGluZXNcbiAgICAgICAgQGluZGVudCA9IGRlY3JlYXNlZEluZGVudFxuICAgICAgICB0aGlzXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwICAgICAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICAjIE1hdGNoZXMgYW5kIGNvbnN1bWVzIG5vbi1tZWFuaW5nZnVsIHdoaXRlc3BhY2UuIFRhZyB0aGUgcHJldmlvdXMgdG9rZW5cbiAgICAjIGFzIGJlaW5nIOKAnHNwYWNlZOKAnSwgYmVjYXVzZSB0aGVyZSBhcmUgc29tZSBjYXNlcyB3aGVyZSBpdCBtYWtlcyBhIGRpZmZlcmVuY2UuXG4gICAgXG4gICAgd2hpdGVzcGFjZVRva2VuOiAtPlxuICAgICAgICByZXR1cm4gMCB1bmxlc3MgKG1hdGNoID0gV0hJVEVTUEFDRS5leGVjIEBjaHVuaykgb3IgKG5saW5lID0gQGNodW5rLmNoYXJBdCgwKSBpcyAnXFxuJylcbiAgICAgICAgWy4uLiwgcHJldl0gPSBAdG9rZW5zXG4gICAgICAgIHByZXZbaWYgbWF0Y2ggdGhlbiAnc3BhY2VkJyBlbHNlICduZXdMaW5lJ10gPSB0cnVlIGlmIHByZXZcbiAgICAgICAgaWYgbWF0Y2ggdGhlbiBtYXRjaFswXS5sZW5ndGggZWxzZSAwXG5cbiAgICAjIEdlbmVyYXRlIGEgbmV3bGluZSB0b2tlbi4gQ29uc2VjdXRpdmUgbmV3bGluZXMgZ2V0IG1lcmdlZCB0b2dldGhlci5cbiAgICBcbiAgICBuZXdsaW5lVG9rZW46IChvZmZzZXQpIC0+XG4gICAgICAgIEB0b2tlbnMucG9wKCkgd2hpbGUgQHZhbHVlKCkgaXMgJzsnXG4gICAgICAgIEB0b2tlbiAnVEVSTUlOQVRPUicsICdcXG4nLCBvZmZzZXQsIDAgdW5sZXNzIEB0YWcoKSBpcyAnVEVSTUlOQVRPUidcbiAgICAgICAgdGhpc1xuXG4gICAgIyBVc2UgYSBgXFxgIGF0IGEgbGluZS1lbmRpbmcgdG8gc3VwcHJlc3MgdGhlIG5ld2xpbmUuXG4gICAgIyBUaGUgc2xhc2ggaXMgcmVtb3ZlZCBoZXJlIG9uY2UgaXRzIGpvYiBpcyBkb25lLlxuICAgIFxuICAgIHN1cHByZXNzTmV3bGluZXM6IC0+XG4gICAgICAgIEB0b2tlbnMucG9wKCkgaWYgQHZhbHVlKCkgaXMgJ1xcXFwnXG4gICAgICAgIHRoaXNcblxuICAgICMgMDAwICAgICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgXG4gICAgIyAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgICAgIFxuICAgICMgMDAwICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgXG4gICAgIyAwMDAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICBcbiAgICBcbiAgICAjIFdlIHRyZWF0IGFsbCBvdGhlciBzaW5nbGUgY2hhcmFjdGVycyBhcyBhIHRva2VuLiBFLmcuOiBgKCApICwgLiAhYFxuICAgICMgTXVsdGktY2hhcmFjdGVyIG9wZXJhdG9ycyBhcmUgYWxzbyBsaXRlcmFsIHRva2Vucywgc28gdGhhdCBKaXNvbiBjYW4gYXNzaWduXG4gICAgIyB0aGUgcHJvcGVyIG9yZGVyIG9mIG9wZXJhdGlvbnMuIFRoZXJlIGFyZSBzb21lIHN5bWJvbHMgdGhhdCB3ZSB0YWcgc3BlY2lhbGx5XG4gICAgIyBoZXJlLiBgO2AgYW5kIG5ld2xpbmVzIGFyZSBib3RoIHRyZWF0ZWQgYXMgYSBgVEVSTUlOQVRPUmAsIHdlIGRpc3Rpbmd1aXNoXG4gICAgIyBwYXJlbnRoZXNlcyB0aGF0IGluZGljYXRlIGEgbWV0aG9kIGNhbGwgZnJvbSByZWd1bGFyIHBhcmVudGhlc2VzLCBhbmQgc28gb24uXG4gICAgXG4gICAgbGl0ZXJhbFRva2VuOiAtPlxuICAgICAgICBpZiBtYXRjaCA9IE9QRVJBVE9SLmV4ZWMgQGNodW5rXG4gICAgICAgICAgICBbdmFsdWVdID0gbWF0Y2hcbiAgICAgICAgICAgIEB0YWdQYXJhbWV0ZXJzKCkgaWYgQ09ERS50ZXN0IHZhbHVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHZhbHVlID0gQGNodW5rLmNoYXJBdCAwXG4gICAgICAgIHRhZyAgPSB2YWx1ZVxuICAgICAgICBbLi4uLCBwcmV2XSA9IEB0b2tlbnNcblxuICAgICAgICBpZiBwcmV2IGFuZCB2YWx1ZSBpbiBbJz0nLCBDT01QT1VORF9BU1NJR04uLi5dXG4gICAgICAgICAgICBza2lwVG9rZW4gPSBmYWxzZVxuICAgICAgICAgICAgaWYgdmFsdWUgaXMgJz0nIGFuZCBwcmV2WzFdIGluIFsnfHwnLCAnJiYnXSBhbmQgbm90IHByZXYuc3BhY2VkXG4gICAgICAgICAgICAgICAgcHJldlswXSA9ICdDT01QT1VORF9BU1NJR04nXG4gICAgICAgICAgICAgICAgcHJldlsxXSArPSAnPSdcbiAgICAgICAgICAgICAgICBwcmV2ID0gQHRva2Vuc1tAdG9rZW5zLmxlbmd0aCAtIDJdXG4gICAgICAgICAgICAgICAgc2tpcFRva2VuID0gdHJ1ZVxuICAgICAgICAgICAgaWYgcHJldiBhbmQgcHJldlswXSAhPSAnUFJPUEVSVFknXG4gICAgICAgICAgICAgICAgb3JpZ2luID0gcHJldi5vcmlnaW4gPyBwcmV2XG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IGlzVW5hc3NpZ25hYmxlIHByZXZbMV0sIG9yaWdpblsxXVxuICAgICAgICAgICAgICAgIEBlcnJvciBtZXNzYWdlLCBvcmlnaW5bMl0gaWYgbWVzc2FnZVxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlLmxlbmd0aCBpZiBza2lwVG9rZW5cblxuICAgICAgICBpZiB2YWx1ZSBpcyAneycgYW5kIEBzZWVuSW1wb3J0XG4gICAgICAgICAgICBAaW1wb3J0U3BlY2lmaWVyTGlzdCA9IHllc1xuICAgICAgICBlbHNlIGlmIEBpbXBvcnRTcGVjaWZpZXJMaXN0IGFuZCB2YWx1ZSBpcyAnfSdcbiAgICAgICAgICAgIEBpbXBvcnRTcGVjaWZpZXJMaXN0ID0gbm9cbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpcyAneycgYW5kIHByZXY/WzBdIGlzICdFWFBPUlQnXG4gICAgICAgICAgICBAZXhwb3J0U3BlY2lmaWVyTGlzdCA9IHllc1xuICAgICAgICBlbHNlIGlmIEBleHBvcnRTcGVjaWZpZXJMaXN0IGFuZCB2YWx1ZSBpcyAnfSdcbiAgICAgICAgICAgIEBleHBvcnRTcGVjaWZpZXJMaXN0ID0gbm9cblxuICAgICAgICBpZiB2YWx1ZSBpcyAnOydcbiAgICAgICAgICAgIEBzZWVuRm9yID0gQHNlZW5JbXBvcnQgPSBAc2VlbkV4cG9ydCA9IG5vXG4gICAgICAgICAgICB0YWcgPSAnVEVSTUlOQVRPUidcbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpcyAnKicgYW5kIHByZXZbMF0gaXMgJ0VYUE9SVCdcbiAgICAgICAgICAgIHRhZyA9ICdFWFBPUlRfQUxMJ1xuICAgICAgICBlbHNlIGlmIHZhbHVlIGluIE1BVEggICAgICAgICAgICAgICAgICAgdGhlbiB0YWcgPSAnTUFUSCdcbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpbiBDT01QQVJFICAgICAgICAgICAgICAgIHRoZW4gdGFnID0gJ0NPTVBBUkUnXG4gICAgICAgIGVsc2UgaWYgdmFsdWUgaW4gQ09NUE9VTkRfQVNTSUdOICAgICAgICB0aGVuIHRhZyA9ICdDT01QT1VORF9BU1NJR04nXG4gICAgICAgIGVsc2UgaWYgdmFsdWUgaW4gVU5BUlkgICAgICAgICAgICAgICAgICB0aGVuIHRhZyA9ICdVTkFSWSdcbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpbiBVTkFSWV9NQVRIICAgICAgICAgICAgIHRoZW4gdGFnID0gJ1VOQVJZX01BVEgnXG4gICAgICAgIGVsc2UgaWYgdmFsdWUgaW4gU0hJRlQgICAgICAgICAgICAgICAgICB0aGVuIHRhZyA9ICdTSElGVCdcbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpcyAnPycgYW5kIHByZXY/LnNwYWNlZCAgIHRoZW4gdGFnID0gJ0JJTj8nXG4gICAgICAgIGVsc2UgaWYgcHJldiBhbmQgbm90IHByZXYuc3BhY2VkXG4gICAgICAgICAgICBpZiB2YWx1ZSBpcyAnKCcgYW5kIHByZXZbMF0gaW4gQ0FMTEFCTEVcbiAgICAgICAgICAgICAgICBwcmV2WzBdID0gJ0ZVTkNfRVhJU1QnIGlmIHByZXZbMF0gaXMgJz8nXG4gICAgICAgICAgICAgICAgdGFnID0gJ0NBTExfU1RBUlQnXG4gICAgICAgICAgICBlbHNlIGlmIHZhbHVlIGlzICdbJyBhbmQgcHJldlswXSBpbiBJTkRFWEFCTEVcbiAgICAgICAgICAgICAgICB0YWcgPSAnSU5ERVhfU1RBUlQnXG4gICAgICAgICAgICAgICAgc3dpdGNoIHByZXZbMF1cbiAgICAgICAgICAgICAgICAgICAgd2hlbiAnPycgICAgdGhlbiBwcmV2WzBdID0gJ0lOREVYX1NPQUsnXG4gICAgICAgIHRva2VuID0gQG1ha2VUb2tlbiB0YWcsIHZhbHVlXG4gICAgICAgIHN3aXRjaCB2YWx1ZVxuICAgICAgICAgICAgd2hlbiAnKCcsICd7JywgJ1snIHRoZW4gQGVuZHMucHVzaCB7dGFnOiBSZXdyaXRlci5JTlZFUlNFU1t2YWx1ZV0sIG9yaWdpbjogdG9rZW59XG4gICAgICAgICAgICB3aGVuICcpJywgJ30nLCAnXScgdGhlbiBAcGFpciB2YWx1ZVxuICAgICAgICBAdG9rZW5zLnB1c2ggdG9rZW5cbiAgICAgICAgdmFsdWUubGVuZ3RoXG5cbiAgICAjIyNcbiAgICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICBcbiAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICBcbiAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICBcbiAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICAjIyNcbiAgICBcbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgICMgQSBzb3VyY2Ugb2YgYW1iaWd1aXR5IGluIG91ciBncmFtbWFyIHVzZWQgdG8gYmUgcGFyYW1ldGVyIGxpc3RzIGluIGZ1bmN0aW9uXG4gICAgIyBkZWZpbml0aW9ucyB2ZXJzdXMgYXJndW1lbnQgbGlzdHMgaW4gZnVuY3Rpb24gY2FsbHMuIFdhbGsgYmFja3dhcmRzLCB0YWdnaW5nXG4gICAgIyBwYXJhbWV0ZXJzIHNwZWNpYWxseSBpbiBvcmRlciB0byBtYWtlIHRoaW5ncyBlYXNpZXIgZm9yIHRoZSBwYXJzZXIuXG4gICAgICAgIFxuICAgIHRhZ1BhcmFtZXRlcnM6IC0+XG4gICAgICAgIHJldHVybiB0aGlzIGlmIEB0YWcoKSAhPSAnKSdcbiAgICAgICAgc3RhY2sgPSBbXVxuICAgICAgICB7dG9rZW5zfSA9IHRoaXNcbiAgICAgICAgaSA9IHRva2Vucy5sZW5ndGhcbiAgICAgICAgdG9rZW5zWy0taV1bMF0gPSAnUEFSQU1fRU5EJ1xuICAgICAgICB3aGlsZSB0b2sgPSB0b2tlbnNbLS1pXVxuICAgICAgICAgICAgc3dpdGNoIHRva1swXVxuICAgICAgICAgICAgICAgIHdoZW4gJyknXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2ggdG9rXG4gICAgICAgICAgICAgICAgd2hlbiAnKCcsICdDQUxMX1NUQVJUJ1xuICAgICAgICAgICAgICAgICAgICBpZiBzdGFjay5sZW5ndGggdGhlbiBzdGFjay5wb3AoKVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIHRva1swXSBpcyAnKCdcbiAgICAgICAgICAgICAgICAgICAgICAgIHRva1swXSA9ICdQQVJBTV9TVEFSVCdcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgcmV0dXJuIHRoaXNcbiAgICAgICAgdGhpc1xuXG4gICAgIyBDbG9zZSB1cCBhbGwgcmVtYWluaW5nIG9wZW4gYmxvY2tzIGF0IHRoZSBlbmQgb2YgdGhlIGZpbGUuXG4gICAgXG4gICAgY2xvc2VJbmRlbnRhdGlvbjogLT5cbiAgICAgICAgQG91dGRlbnRUb2tlbiBAaW5kZW50XG5cbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgIyBNYXRjaCB0aGUgY29udGVudHMgb2YgYSBkZWxpbWl0ZWQgdG9rZW4gYW5kIGV4cGFuZCB2YXJpYWJsZXMgYW5kIGV4cHJlc3Npb25zXG4gICAgIyBpbnNpZGUgaXQgdXNpbmcgUnVieS1saWtlIG5vdGF0aW9uIGZvciBzdWJzdGl0dXRpb24gb2YgYXJiaXRyYXJ5IGV4cHJlc3Npb25zLlxuICAgICNcbiAgICAjICAgIFwiSGVsbG8gI3tuYW1lLmNhcGl0YWxpemUoKX0uXCJcbiAgICAjXG4gICAgIyBJZiBpdCBlbmNvdW50ZXJzIGFuIGludGVycG9sYXRpb24sIHRoaXMgbWV0aG9kIHdpbGwgcmVjdXJzaXZlbHkgY3JlYXRlIGEgbmV3XG4gICAgIyBMZXhlciBhbmQgdG9rZW5pemUgdW50aWwgdGhlIGB7YCBvZiBgI3tgIGlzIGJhbGFuY2VkIHdpdGggYSBgfWAuXG4gICAgI1xuICAgICMgICAgLSBgcmVnZXhgIG1hdGNoZXMgdGhlIGNvbnRlbnRzIG9mIGEgdG9rZW4gKGJ1dCBub3QgYGRlbGltaXRlcmAsIGFuZCBub3RcbiAgICAjICAgICAgICBgI3tgIGlmIGludGVycG9sYXRpb25zIGFyZSBkZXNpcmVkKS5cbiAgICAjICAgIC0gYGRlbGltaXRlcmAgaXMgdGhlIGRlbGltaXRlciBvZiB0aGUgdG9rZW4uIEV4YW1wbGVzIGFyZSBgJ2AsIGBcImAsIGAnJydgLFxuICAgICMgICAgICAgIGBcIlwiXCJgIGFuZCBgLy8vYC5cbiAgICAjXG4gICAgIyBUaGlzIG1ldGhvZCBhbGxvd3MgdXMgdG8gaGF2ZSBzdHJpbmdzIHdpdGhpbiBpbnRlcnBvbGF0aW9ucyB3aXRoaW4gc3RyaW5ncywgYWQgaW5maW5pdHVtLlxuICAgIFxuICAgIG1hdGNoV2l0aEludGVycG9sYXRpb25zOiAocmVnZXgsIGRlbGltaXRlcikgLT5cbiAgICAgICAgXG4gICAgICAgIHRva2VucyA9IFtdXG4gICAgICAgIG9mZnNldEluQ2h1bmsgPSBkZWxpbWl0ZXIubGVuZ3RoXG4gICAgICAgIHJldHVybiBudWxsIHVubGVzcyBAY2h1bmtbLi4ub2Zmc2V0SW5DaHVua10gaXMgZGVsaW1pdGVyXG4gICAgICAgIHN0ciA9IEBjaHVua1tvZmZzZXRJbkNodW5rLi5dXG4gICAgICAgIGxvb3BcbiAgICAgICAgICAgIFtzdHJQYXJ0XSA9IHJlZ2V4LmV4ZWMgc3RyXG5cbiAgICAgICAgICAgIEB2YWxpZGF0ZUVzY2FwZXMgc3RyUGFydCwge2lzUmVnZXg6IGRlbGltaXRlci5jaGFyQXQoMCkgaXMgJy8nLCBvZmZzZXRJbkNodW5rfVxuXG4gICAgICAgICAgICAjIFB1c2ggYSBmYWtlICdORU9TVFJJTkcnIHRva2VuLCB3aGljaCB3aWxsIGdldCB0dXJuZWQgaW50byBhIHJlYWwgc3RyaW5nIGxhdGVyLlxuICAgICAgICAgICAgdG9rZW5zLnB1c2ggQG1ha2VUb2tlbiAnTkVPU1RSSU5HJywgc3RyUGFydCwgb2Zmc2V0SW5DaHVua1xuXG4gICAgICAgICAgICBzdHIgPSBzdHJbc3RyUGFydC5sZW5ndGguLl1cbiAgICAgICAgICAgIG9mZnNldEluQ2h1bmsgKz0gc3RyUGFydC5sZW5ndGhcblxuICAgICAgICAgICAgYnJlYWsgdW5sZXNzIHN0clsuLi4yXSBpcyAnI3snXG5cbiAgICAgICAgICAgICMgVGhlIGAxYHMgYXJlIHRvIHJlbW92ZSB0aGUgYCNgIGluIGAje2AuXG4gICAgICAgICAgICBbbGluZSwgY29sdW1uXSA9IEBnZXRMaW5lQW5kQ29sdW1uRnJvbUNodW5rIG9mZnNldEluQ2h1bmsgKyAxXG4gICAgICAgICAgICB7dG9rZW5zOiBuZXN0ZWQsIGluZGV4fSA9XG4gICAgICAgICAgICAgICAgbmV3IExleGVyKCkudG9rZW5pemUgc3RyWzEuLl0sIGxpbmU6IGxpbmUsIGNvbHVtbjogY29sdW1uLCB1bnRpbEJhbGFuY2VkOiBvblxuICAgICAgICAgICAgIyBTa2lwIHRoZSB0cmFpbGluZyBgfWAuXG4gICAgICAgICAgICBpbmRleCArPSAxXG5cbiAgICAgICAgICAgICMgVHVybiB0aGUgbGVhZGluZyBhbmQgdHJhaWxpbmcgYHtgIGFuZCBgfWAgaW50byBwYXJlbnRoZXNlcy4gVW5uZWNlc3NhcnlcbiAgICAgICAgICAgICMgcGFyZW50aGVzZXMgd2lsbCBiZSByZW1vdmVkIGxhdGVyLlxuICAgICAgICAgICAgW29wZW4sIC4uLiwgY2xvc2VdID0gbmVzdGVkXG4gICAgICAgICAgICBvcGVuWzBdICA9IG9wZW5bMV0gID0gJygnXG4gICAgICAgICAgICBjbG9zZVswXSA9IGNsb3NlWzFdID0gJyknXG4gICAgICAgICAgICBjbG9zZS5vcmlnaW4gPSBbJycsICdlbmQgb2YgaW50ZXJwb2xhdGlvbicsIGNsb3NlWzJdXVxuXG4gICAgICAgICAgICAjIFJlbW92ZSBsZWFkaW5nICdURVJNSU5BVE9SJyAoaWYgYW55KS5cbiAgICAgICAgICAgIG5lc3RlZC5zcGxpY2UgMSwgMSBpZiBuZXN0ZWRbMV0/WzBdIGlzICdURVJNSU5BVE9SJ1xuXG4gICAgICAgICAgICAjIFB1c2ggYSBmYWtlICdUT0tFTlMnIHRva2VuLCB3aGljaCB3aWxsIGdldCB0dXJuZWQgaW50byByZWFsIHRva2VucyBsYXRlci5cbiAgICAgICAgICAgIHRva2Vucy5wdXNoIFsnVE9LRU5TJywgbmVzdGVkXVxuXG4gICAgICAgICAgICBzdHIgPSBzdHJbaW5kZXguLl1cbiAgICAgICAgICAgIG9mZnNldEluQ2h1bmsgKz0gaW5kZXhcblxuICAgICAgICB1bmxlc3Mgc3RyWy4uLmRlbGltaXRlci5sZW5ndGhdIGlzIGRlbGltaXRlclxuICAgICAgICAgICAgQGVycm9yIFwibWlzc2luZyAje2RlbGltaXRlcn1cIiwgbGVuZ3RoOiBkZWxpbWl0ZXIubGVuZ3RoXG5cbiAgICAgICAgW2ZpcnN0VG9rZW4sIC4uLiwgbGFzdFRva2VuXSA9IHRva2Vuc1xuICAgICAgICBmaXJzdFRva2VuWzJdLmZpcnN0X2NvbHVtbiAtPSBkZWxpbWl0ZXIubGVuZ3RoXG4gICAgICAgIGlmIGxhc3RUb2tlblsxXS5zdWJzdHIoLTEpIGlzICdcXG4nXG4gICAgICAgICAgICBsYXN0VG9rZW5bMl0ubGFzdF9saW5lICs9IDFcbiAgICAgICAgICAgIGxhc3RUb2tlblsyXS5sYXN0X2NvbHVtbiA9IGRlbGltaXRlci5sZW5ndGggLSAxXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGxhc3RUb2tlblsyXS5sYXN0X2NvbHVtbiArPSBkZWxpbWl0ZXIubGVuZ3RoXG4gICAgICAgIGxhc3RUb2tlblsyXS5sYXN0X2NvbHVtbiAtPSAxIGlmIGxhc3RUb2tlblsxXS5sZW5ndGggaXMgMFxuXG4gICAgICAgIHt0b2tlbnMsIGluZGV4OiBvZmZzZXRJbkNodW5rICsgZGVsaW1pdGVyLmxlbmd0aH1cblxuICAgICMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgIyBNZXJnZSB0aGUgYXJyYXkgYHRva2Vuc2Agb2YgdGhlIGZha2UgdG9rZW4gdHlwZXMgJ1RPS0VOUycgYW5kICdORU9TVFJJTkcnICAoYXMgcmV0dXJuZWQgYnkgYG1hdGNoV2l0aEludGVycG9sYXRpb25zYCkgaW50byB0aGUgdG9rZW4gc3RyZWFtLiBcbiAgICAjIFRoZSB2YWx1ZSBvZiAnTkVPU1RSSU5HJ3MgYXJlIGNvbnZlcnRlZCB1c2luZyBgZm5gIGFuZCB0dXJuZWQgaW50byBzdHJpbmdzIHVzaW5nIGBvcHRpb25zYCBmaXJzdC5cbiAgICBcbiAgICBtZXJnZUludGVycG9sYXRpb25Ub2tlbnM6ICh0b2tlbnMsIG9wdGlvbnMsIGZuKSAtPlxuICAgICAgICBpZiB0b2tlbnMubGVuZ3RoID4gMVxuICAgICAgICAgICAgbHBhcmVuID0gQHRva2VuICdTVFJJTkdfU1RBUlQnLCAnKCcsIDAsIDBcblxuICAgICAgICBmaXJzdEluZGV4ID0gQHRva2Vucy5sZW5ndGhcbiAgICAgICAgZm9yIHRva2VuLCBpIGluIHRva2Vuc1xuICAgICAgICAgICAgW3RhZywgdmFsdWVdID0gdG9rZW5cbiAgICAgICAgICAgIHN3aXRjaCB0YWdcbiAgICAgICAgICAgICAgICB3aGVuICdUT0tFTlMnXG4gICAgICAgICAgICAgICAgICAgICMgT3B0aW1pemUgb3V0IGVtcHR5IGludGVycG9sYXRpb25zIChhbiBlbXB0eSBwYWlyIG9mIHBhcmVudGhlc2VzKS5cbiAgICAgICAgICAgICAgICAgICAgY29udGludWUgaWYgdmFsdWUubGVuZ3RoIGlzIDJcbiAgICAgICAgICAgICAgICAgICAgIyBQdXNoIGFsbCB0aGUgdG9rZW5zIGluIHRoZSBmYWtlICdUT0tFTlMnIHRva2VuLiBcbiAgICAgICAgICAgICAgICAgICAgIyBUaGVzZSBhbHJlYWR5IGhhdmUgc2FuZSBsb2NhdGlvbiBkYXRhLlxuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvblRva2VuID0gdmFsdWVbMF1cbiAgICAgICAgICAgICAgICAgICAgdG9rZW5zVG9QdXNoID0gdmFsdWVcbiAgICAgICAgICAgICAgICB3aGVuICdORU9TVFJJTkcnXG4gICAgICAgICAgICAgICAgICAgICMgQ29udmVydCAnTkVPU1RSSU5HJyBpbnRvICdTVFJJTkcnLlxuICAgICAgICAgICAgICAgICAgICBjb252ZXJ0ZWQgPSBmbi5jYWxsIHRoaXMsIHRva2VuWzFdLCBpXG4gICAgICAgICAgICAgICAgICAgICMgT3B0aW1pemUgb3V0IGVtcHR5IHN0cmluZ3MuIFdlIGVuc3VyZSB0aGF0IHRoZSB0b2tlbnMgc3RyZWFtIGFsd2F5c1xuICAgICAgICAgICAgICAgICAgICAjIHN0YXJ0cyB3aXRoIGEgc3RyaW5nIHRva2VuLCB0aG91Z2gsIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSByZXN1bHRcbiAgICAgICAgICAgICAgICAgICAgIyByZWFsbHkgaXMgYSBzdHJpbmcuXG4gICAgICAgICAgICAgICAgICAgIGlmIGNvbnZlcnRlZC5sZW5ndGggaXMgMFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgaSBpcyAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3RFbXB0eVN0cmluZ0luZGV4ID0gQHRva2Vucy5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgICAgICAjIEhvd2V2ZXIsIHRoZXJlIGlzIG9uZSBjYXNlIHdoZXJlIHdlIGNhbiBvcHRpbWl6ZSBhd2F5IGEgc3RhcnRpbmcgZW1wdHkgc3RyaW5nLlxuICAgICAgICAgICAgICAgICAgICBpZiBpIGlzIDIgYW5kIGZpcnN0RW1wdHlTdHJpbmdJbmRleD9cbiAgICAgICAgICAgICAgICAgICAgICAgIEB0b2tlbnMuc3BsaWNlIGZpcnN0RW1wdHlTdHJpbmdJbmRleCwgMiAjIFJlbW92ZSBlbXB0eSBzdHJpbmcgYW5kIHRoZSBwbHVzLlxuICAgICAgICAgICAgICAgICAgICB0b2tlblswXSA9ICdTVFJJTkcnXG4gICAgICAgICAgICAgICAgICAgIHRva2VuWzFdID0gQG1ha2VEZWxpbWl0ZWRMaXRlcmFsIGNvbnZlcnRlZCwgb3B0aW9uc1xuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvblRva2VuID0gdG9rZW5cbiAgICAgICAgICAgICAgICAgICAgdG9rZW5zVG9QdXNoID0gW3Rva2VuXVxuICAgICAgICAgICAgaWYgQHRva2Vucy5sZW5ndGggPiBmaXJzdEluZGV4XG4gICAgICAgICAgICAgICAgIyBDcmVhdGUgYSAwLWxlbmd0aCBcIitcIiB0b2tlbi5cbiAgICAgICAgICAgICAgICBwbHVzVG9rZW4gPSBAdG9rZW4gJysnLCAnKydcbiAgICAgICAgICAgICAgICBwbHVzVG9rZW5bMl0gPVxuICAgICAgICAgICAgICAgICAgICBmaXJzdF9saW5lOiAgIGxvY2F0aW9uVG9rZW5bMl0uZmlyc3RfbGluZVxuICAgICAgICAgICAgICAgICAgICBmaXJzdF9jb2x1bW46IGxvY2F0aW9uVG9rZW5bMl0uZmlyc3RfY29sdW1uXG4gICAgICAgICAgICAgICAgICAgIGxhc3RfbGluZTogICAgbG9jYXRpb25Ub2tlblsyXS5maXJzdF9saW5lXG4gICAgICAgICAgICAgICAgICAgIGxhc3RfY29sdW1uOiAgbG9jYXRpb25Ub2tlblsyXS5maXJzdF9jb2x1bW5cbiAgICAgICAgICAgIEB0b2tlbnMucHVzaCB0b2tlbnNUb1B1c2guLi5cblxuICAgICAgICBpZiBscGFyZW5cbiAgICAgICAgICAgIFsuLi4sIGxhc3RUb2tlbl0gPSB0b2tlbnNcbiAgICAgICAgICAgIGxwYXJlbi5vcmlnaW4gPSBbJ1NUUklORycsIG51bGwsXG4gICAgICAgICAgICAgICAgZmlyc3RfbGluZTogICBscGFyZW5bMl0uZmlyc3RfbGluZVxuICAgICAgICAgICAgICAgIGZpcnN0X2NvbHVtbjogbHBhcmVuWzJdLmZpcnN0X2NvbHVtblxuICAgICAgICAgICAgICAgIGxhc3RfbGluZTogICAgbGFzdFRva2VuWzJdLmxhc3RfbGluZVxuICAgICAgICAgICAgICAgIGxhc3RfY29sdW1uOiAgbGFzdFRva2VuWzJdLmxhc3RfY29sdW1uXG4gICAgICAgICAgICBdXG4gICAgICAgICAgICBycGFyZW4gPSBAdG9rZW4gJ1NUUklOR19FTkQnLCAnKSdcbiAgICAgICAgICAgIHJwYXJlblsyXSA9XG4gICAgICAgICAgICAgICAgZmlyc3RfbGluZTogICBsYXN0VG9rZW5bMl0ubGFzdF9saW5lXG4gICAgICAgICAgICAgICAgZmlyc3RfY29sdW1uOiBsYXN0VG9rZW5bMl0ubGFzdF9jb2x1bW5cbiAgICAgICAgICAgICAgICBsYXN0X2xpbmU6ICAgIGxhc3RUb2tlblsyXS5sYXN0X2xpbmVcbiAgICAgICAgICAgICAgICBsYXN0X2NvbHVtbjogIGxhc3RUb2tlblsyXS5sYXN0X2NvbHVtblxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICAjIFBhaXJzIHVwIGEgY2xvc2luZyB0b2tlbiwgZW5zdXJpbmcgdGhhdCBhbGwgbGlzdGVkIHBhaXJzIG9mIHRva2VucyBhcmVcbiAgICAjIGNvcnJlY3RseSBiYWxhbmNlZCB0aHJvdWdob3V0IHRoZSBjb3Vyc2Ugb2YgdGhlIHRva2VuIHN0cmVhbS5cbiAgICBcbiAgICBwYWlyOiAodGFnKSAtPlxuICAgICAgICBbLi4uLCBwcmV2XSA9IEBlbmRzXG4gICAgICAgIHVubGVzcyB0YWcgaXMgd2FudGVkID0gcHJldj8udGFnXG4gICAgICAgICAgICBAZXJyb3IgXCJ1bm1hdGNoZWQgI3t0YWd9XCIgdW5sZXNzICdPVVRERU5UJyBpcyB3YW50ZWRcbiAgICAgICAgICAgICMgQXV0by1jbG9zZSBJTkRFTlQgdG8gc3VwcG9ydCBzeW50YXggbGlrZSB0aGlzOlxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyAgICAgZWwuY2xpY2soKGV2ZW50KSAtPlxuICAgICAgICAgICAgIyAgICAgICAgIGVsLmhpZGUoKSlcbiAgICAgICAgICAgIFsuLi4sIGxhc3RJbmRlbnRdID0gQGluZGVudHNcbiAgICAgICAgICAgIEBvdXRkZW50VG9rZW4gbGFzdEluZGVudCwgdHJ1ZVxuICAgICAgICAgICAgcmV0dXJuIEBwYWlyIHRhZ1xuICAgICAgICBAZW5kcy5wb3AoKVxuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuXG4gICAgIyBSZXR1cm5zIHRoZSBsaW5lIGFuZCBjb2x1bW4gbnVtYmVyIGZyb20gYW4gb2Zmc2V0IGludG8gdGhlIGN1cnJlbnQgY2h1bmsuXG4gICAgI1xuICAgICMgYG9mZnNldGAgaXMgYSBudW1iZXIgb2YgY2hhcmFjdGVycyBpbnRvIEBjaHVuay5cbiAgICBcbiAgICBnZXRMaW5lQW5kQ29sdW1uRnJvbUNodW5rOiAob2Zmc2V0KSAtPlxuICAgICAgICBpZiBvZmZzZXQgaXMgMFxuICAgICAgICAgICAgcmV0dXJuIFtAY2h1bmtMaW5lLCBAY2h1bmtDb2x1bW5dXG5cbiAgICAgICAgaWYgb2Zmc2V0ID49IEBjaHVuay5sZW5ndGhcbiAgICAgICAgICAgIHN0cmluZyA9IEBjaHVua1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzdHJpbmcgPSBAY2h1bmtbLi5vZmZzZXQtMV1cblxuICAgICAgICBsaW5lQ291bnQgPSBjb3VudCBzdHJpbmcsICdcXG4nXG5cbiAgICAgICAgY29sdW1uID0gQGNodW5rQ29sdW1uXG4gICAgICAgIGlmIGxpbmVDb3VudCA+IDBcbiAgICAgICAgICAgIFsuLi4sIGxhc3RMaW5lXSA9IHN0cmluZy5zcGxpdCAnXFxuJ1xuICAgICAgICAgICAgY29sdW1uID0gbGFzdExpbmUubGVuZ3RoXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGNvbHVtbiArPSBzdHJpbmcubGVuZ3RoXG5cbiAgICAgICAgW0BjaHVua0xpbmUgKyBsaW5lQ291bnQsIGNvbHVtbl1cblxuICAgICMgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwMCAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwMCAgXG4gICAgIyAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICAjIFNhbWUgYXMgXCJ0b2tlblwiLCBleGNlcHRpb24gdGhpcyBqdXN0IHJldHVybnMgdGhlIHRva2VuIHdpdGhvdXQgYWRkaW5nIGl0IHRvIHRoZSByZXN1bHRzLlxuICAgIFxuICAgIG1ha2VUb2tlbjogKHRhZywgdmFsdWUsIG9mZnNldEluQ2h1bmsgPSAwLCBsZW5ndGggPSB2YWx1ZS5sZW5ndGgpIC0+XG4gICAgICAgIGxvY2F0aW9uRGF0YSA9IHt9XG4gICAgICAgIFtsb2NhdGlvbkRhdGEuZmlyc3RfbGluZSwgbG9jYXRpb25EYXRhLmZpcnN0X2NvbHVtbl0gPVxuICAgICAgICAgICAgQGdldExpbmVBbmRDb2x1bW5Gcm9tQ2h1bmsgb2Zmc2V0SW5DaHVua1xuXG4gICAgICAgICMgVXNlIGxlbmd0aCAtIDEgZm9yIHRoZSBmaW5hbCBvZmZzZXQgLSB3ZSdyZSBzdXBwbHlpbmcgdGhlIGxhc3RfbGluZSBhbmQgdGhlIGxhc3RfY29sdW1uLFxuICAgICAgICAjIHNvIGlmIGxhc3RfY29sdW1uID09IGZpcnN0X2NvbHVtbiwgdGhlbiB3ZSdyZSBsb29raW5nIGF0IGEgY2hhcmFjdGVyIG9mIGxlbmd0aCAxLlxuICAgICAgICBsYXN0Q2hhcmFjdGVyID0gaWYgbGVuZ3RoID4gMCB0aGVuIChsZW5ndGggLSAxKSBlbHNlIDBcbiAgICAgICAgW2xvY2F0aW9uRGF0YS5sYXN0X2xpbmUsIGxvY2F0aW9uRGF0YS5sYXN0X2NvbHVtbl0gPVxuICAgICAgICAgICAgQGdldExpbmVBbmRDb2x1bW5Gcm9tQ2h1bmsgb2Zmc2V0SW5DaHVuayArIGxhc3RDaGFyYWN0ZXJcblxuICAgICAgICB0b2tlbiA9IFt0YWcsIHZhbHVlLCBsb2NhdGlvbkRhdGFdXG5cbiAgICAgICAgdG9rZW5cblxuICAgICMgQWRkIGEgdG9rZW4gdG8gdGhlIHJlc3VsdHMuXG4gICAgIyBgb2Zmc2V0YCBpcyB0aGUgb2Zmc2V0IGludG8gdGhlIGN1cnJlbnQgQGNodW5rIHdoZXJlIHRoZSB0b2tlbiBzdGFydHMuXG4gICAgIyBgbGVuZ3RoYCBpcyB0aGUgbGVuZ3RoIG9mIHRoZSB0b2tlbiBpbiB0aGUgQGNodW5rLCBhZnRlciB0aGUgb2Zmc2V0LiAgXG4gICAgIyBJZiBub3Qgc3BlY2lmaWVkLCB0aGUgbGVuZ3RoIG9mIGB2YWx1ZWAgd2lsbCBiZSB1c2VkLiBSZXR1cm5zIHRoZSBuZXcgdG9rZW4uXG4gICAgXG4gICAgdG9rZW46ICh0YWcsIHZhbHVlLCBvZmZzZXRJbkNodW5rLCBsZW5ndGgsIG9yaWdpbikgLT5cbiAgICAgICAgXG4gICAgICAgIHRva2VuID0gQG1ha2VUb2tlbiB0YWcsIHZhbHVlLCBvZmZzZXRJbkNodW5rLCBsZW5ndGhcbiAgICAgICAgdG9rZW4ub3JpZ2luID0gb3JpZ2luIGlmIG9yaWdpblxuICAgICAgICBAdG9rZW5zLnB1c2ggdG9rZW5cbiAgICAgICAgdG9rZW5cblxuICAgIHRhZzogLT4gIyBQZWVrIGF0IHRoZSBsYXN0IHRhZyBpbiB0aGUgdG9rZW4gc3RyZWFtLlxuICAgICAgICBbLi4uLCB0b2tlbl0gPSBAdG9rZW5zXG4gICAgICAgIHRva2VuP1swXVxuXG4gICAgdmFsdWU6IC0+ICMgUGVlayBhdCB0aGUgbGFzdCB2YWx1ZSBpbiB0aGUgdG9rZW4gc3RyZWFtLlxuICAgICAgICBbLi4uLCB0b2tlbl0gPSBAdG9rZW5zXG4gICAgICAgIHRva2VuP1sxXVxuXG4gICAgdW5maW5pc2hlZDogLT4gIyBBcmUgd2UgaW4gdGhlIG1pZHN0IG9mIGFuIHVuZmluaXNoZWQgZXhwcmVzc2lvbj9cbiAgICAgICAgTElORV9DT05USU5VRVIudGVzdChAY2h1bmspIG9yXG4gICAgICAgIEB0YWcoKSBpbiBVTkZJTklTSEVEXG5cbiAgICBmb3JtYXRTdHJpbmc6IChzdHIsIG9wdGlvbnMpIC0+XG4gICAgICAgIEByZXBsYWNlVW5pY29kZUNvZGVQb2ludEVzY2FwZXMgc3RyLnJlcGxhY2UoU1RSSU5HX09NSVQsICckMScpLCBvcHRpb25zXG5cbiAgICBmb3JtYXRIZXJlZ2V4OiAoc3RyKSAtPlxuICAgICAgICBAZm9ybWF0UmVnZXggc3RyLnJlcGxhY2UoSEVSRUdFWF9PTUlULCAnJDEkMicpLCBkZWxpbWl0ZXI6ICcvLy8nXG5cbiAgICBmb3JtYXRSZWdleDogKHN0ciwgb3B0aW9ucykgLT5cbiAgICAgICAgQHJlcGxhY2VVbmljb2RlQ29kZVBvaW50RXNjYXBlcyBzdHIsIG9wdGlvbnNcblxuICAgIHVuaWNvZGVDb2RlUG9pbnRUb1VuaWNvZGVFc2NhcGVzOiAoY29kZVBvaW50KSAtPlxuICAgICAgICB0b1VuaWNvZGVFc2NhcGUgPSAodmFsKSAtPlxuICAgICAgICAgICAgc3RyID0gdmFsLnRvU3RyaW5nIDE2XG4gICAgICAgICAgICBcIlxcXFx1I3tyZXBlYXQgJzAnLCA0IC0gc3RyLmxlbmd0aH0je3N0cn1cIlxuICAgICAgICByZXR1cm4gdG9Vbmljb2RlRXNjYXBlKGNvZGVQb2ludCkgaWYgY29kZVBvaW50IDwgMHgxMDAwMFxuICAgICAgICAjIHN1cnJvZ2F0ZSBwYWlyXG4gICAgICAgIGhpZ2ggPSBNYXRoLmZsb29yKChjb2RlUG9pbnQgLSAweDEwMDAwKSAvIDB4NDAwKSArIDB4RDgwMFxuICAgICAgICBsb3cgPSAoY29kZVBvaW50IC0gMHgxMDAwMCkgJSAweDQwMCArIDB4REMwMFxuICAgICAgICBcIiN7dG9Vbmljb2RlRXNjYXBlKGhpZ2gpfSN7dG9Vbmljb2RlRXNjYXBlKGxvdyl9XCJcblxuICAgICMgUmVwbGFjZSBcXHV7Li4ufSB3aXRoIFxcdXh4eHhbXFx1eHh4eF0gaW4gc3RyaW5ncyBhbmQgcmVnZXhlc1xuICAgIHJlcGxhY2VVbmljb2RlQ29kZVBvaW50RXNjYXBlczogKHN0ciwgb3B0aW9ucykgLT5cbiAgICAgICAgc3RyLnJlcGxhY2UgVU5JQ09ERV9DT0RFX1BPSU5UX0VTQ0FQRSwgKG1hdGNoLCBlc2NhcGVkQmFja3NsYXNoLCBjb2RlUG9pbnRIZXgsIG9mZnNldCkgPT5cbiAgICAgICAgICAgIHJldHVybiBlc2NhcGVkQmFja3NsYXNoIGlmIGVzY2FwZWRCYWNrc2xhc2hcblxuICAgICAgICAgICAgY29kZVBvaW50RGVjaW1hbCA9IHBhcnNlSW50IGNvZGVQb2ludEhleCwgMTZcbiAgICAgICAgICAgIGlmIGNvZGVQb2ludERlY2ltYWwgPiAweDEwZmZmZlxuICAgICAgICAgICAgICAgIEBlcnJvciBcInVuaWNvZGUgY29kZSBwb2ludCBlc2NhcGVzIGdyZWF0ZXIgdGhhbiBcXFxcdXsxMGZmZmZ9IGFyZSBub3QgYWxsb3dlZFwiLFxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IG9mZnNldCArIG9wdGlvbnMuZGVsaW1pdGVyLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICBsZW5ndGg6IGNvZGVQb2ludEhleC5sZW5ndGggKyA0XG5cbiAgICAgICAgICAgIEB1bmljb2RlQ29kZVBvaW50VG9Vbmljb2RlRXNjYXBlcyBjb2RlUG9pbnREZWNpbWFsXG5cbiAgICAjIFZhbGlkYXRlcyBlc2NhcGVzIGluIHN0cmluZ3MgYW5kIHJlZ2V4ZXMuXG4gICAgdmFsaWRhdGVFc2NhcGVzOiAoc3RyLCBvcHRpb25zID0ge30pIC0+XG4gICAgICAgIGludmFsaWRFc2NhcGVSZWdleCA9XG4gICAgICAgICAgICBpZiBvcHRpb25zLmlzUmVnZXhcbiAgICAgICAgICAgICAgICBSRUdFWF9JTlZBTElEX0VTQ0FQRVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIFNUUklOR19JTlZBTElEX0VTQ0FQRVxuICAgICAgICBtYXRjaCA9IGludmFsaWRFc2NhcGVSZWdleC5leGVjIHN0clxuICAgICAgICByZXR1cm4gdW5sZXNzIG1hdGNoXG4gICAgICAgIFtbXSwgYmVmb3JlLCBvY3RhbCwgaGV4LCB1bmljb2RlQ29kZVBvaW50LCB1bmljb2RlXSA9IG1hdGNoXG4gICAgICAgIG1lc3NhZ2UgPVxuICAgICAgICAgICAgaWYgb2N0YWxcbiAgICAgICAgICAgICAgICBcIm9jdGFsIGVzY2FwZSBzZXF1ZW5jZXMgYXJlIG5vdCBhbGxvd2VkXCJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBcImludmFsaWQgZXNjYXBlIHNlcXVlbmNlXCJcbiAgICAgICAgaW52YWxpZEVzY2FwZSA9IFwiXFxcXCN7b2N0YWwgb3IgaGV4IG9yIHVuaWNvZGVDb2RlUG9pbnQgb3IgdW5pY29kZX1cIlxuICAgICAgICBAZXJyb3IgXCIje21lc3NhZ2V9ICN7aW52YWxpZEVzY2FwZX1cIixcbiAgICAgICAgICAgIG9mZnNldDogKG9wdGlvbnMub2Zmc2V0SW5DaHVuayA/IDApICsgbWF0Y2guaW5kZXggKyBiZWZvcmUubGVuZ3RoXG4gICAgICAgICAgICBsZW5ndGg6IGludmFsaWRFc2NhcGUubGVuZ3RoXG5cbiAgICAjIENvbnN0cnVjdHMgYSBzdHJpbmcgb3IgcmVnZXggYnkgZXNjYXBpbmcgY2VydGFpbiBjaGFyYWN0ZXJzLlxuICAgIG1ha2VEZWxpbWl0ZWRMaXRlcmFsOiAoYm9keSwgb3B0aW9ucyA9IHt9KSAtPlxuICAgICAgICBib2R5ID0gJyg/OiknIGlmIGJvZHkgaXMgJycgYW5kIG9wdGlvbnMuZGVsaW1pdGVyIGlzICcvJ1xuICAgICAgICByZWdleCA9IC8vL1xuICAgICAgICAgICAgICAgIChcXFxcXFxcXCkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgZXNjYXBlZCBiYWNrc2xhc2hcbiAgICAgICAgICAgIHwgKFxcXFwwKD89WzEtN10pKSAgICAgICAgICAgICAgICAgICAgICAgIyBudWwgY2hhcmFjdGVyIG1pc3Rha2VuIGFzIG9jdGFsIGVzY2FwZVxuICAgICAgICAgICAgfCBcXFxcPygje29wdGlvbnMuZGVsaW1pdGVyfSkgICAgICAgICAgICAjIChwb3NzaWJseSBlc2NhcGVkKSBkZWxpbWl0ZXJcbiAgICAgICAgICAgIHwgXFxcXD8oPzogKFxcbil8KFxccil8KFxcdTIwMjgpfChcXHUyMDI5KSApICMgKHBvc3NpYmx5IGVzY2FwZWQpIG5ld2xpbmVzXG4gICAgICAgICAgICB8IChcXFxcLikgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgb3RoZXIgZXNjYXBlc1xuICAgICAgICAvLy9nXG4gICAgICAgIGJvZHkgPSBib2R5LnJlcGxhY2UgcmVnZXgsIChtYXRjaCwgYmFja3NsYXNoLCBudWwsIGRlbGltaXRlciwgbGYsIGNyLCBscywgcHMsIG90aGVyKSAtPiBzd2l0Y2hcbiAgICAgICAgICAgICMgSWdub3JlIGVzY2FwZWQgYmFja3NsYXNoZXMuXG4gICAgICAgICAgICB3aGVuIGJhY2tzbGFzaCB0aGVuIChpZiBvcHRpb25zLmRvdWJsZSB0aGVuIGJhY2tzbGFzaCArIGJhY2tzbGFzaCBlbHNlIGJhY2tzbGFzaClcbiAgICAgICAgICAgIHdoZW4gbnVsICAgICAgIHRoZW4gJ1xcXFx4MDAnXG4gICAgICAgICAgICB3aGVuIGRlbGltaXRlciB0aGVuIFwiXFxcXCN7ZGVsaW1pdGVyfVwiXG4gICAgICAgICAgICB3aGVuIGxmICAgICAgICB0aGVuICdcXFxcbidcbiAgICAgICAgICAgIHdoZW4gY3IgICAgICAgIHRoZW4gJ1xcXFxyJ1xuICAgICAgICAgICAgd2hlbiBscyAgICAgICAgdGhlbiAnXFxcXHUyMDI4J1xuICAgICAgICAgICAgd2hlbiBwcyAgICAgICAgdGhlbiAnXFxcXHUyMDI5J1xuICAgICAgICAgICAgd2hlbiBvdGhlciAgICAgdGhlbiAoaWYgb3B0aW9ucy5kb3VibGUgdGhlbiBcIlxcXFwje290aGVyfVwiIGVsc2Ugb3RoZXIpXG4gICAgICAgIFwiI3tvcHRpb25zLmRlbGltaXRlcn0je2JvZHl9I3tvcHRpb25zLmRlbGltaXRlcn1cIlxuXG4gICAgIyBUaHJvd3MgYW4gZXJyb3IgYXQgZWl0aGVyIGEgZ2l2ZW4gb2Zmc2V0IGZyb20gdGhlIGN1cnJlbnQgY2h1bmsgb3IgYXQgdGhlIGxvY2F0aW9uIG9mIGEgdG9rZW4gKGB0b2tlblsyXWApLlxuICAgIFxuICAgIGVycm9yOiAobWVzc2FnZSwgb3B0aW9ucz17fSkgLT5cbiAgICAgICAgbG9jYXRpb24gPVxuICAgICAgICAgICAgaWYgJ2ZpcnN0X2xpbmUnIG9mIG9wdGlvbnNcbiAgICAgICAgICAgICAgICBvcHRpb25zXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgW2ZpcnN0X2xpbmUsIGZpcnN0X2NvbHVtbl0gPSBAZ2V0TGluZUFuZENvbHVtbkZyb21DaHVuayBvcHRpb25zLm9mZnNldCA/IDBcbiAgICAgICAgICAgICAgICB7Zmlyc3RfbGluZSwgZmlyc3RfY29sdW1uLCBsYXN0X2NvbHVtbjogZmlyc3RfY29sdW1uICsgKG9wdGlvbnMubGVuZ3RoID8gMSkgLSAxfVxuICAgICAgICB0aHJvd1N5bnRheEVycm9yIG1vZHVsZTonbGV4ZXInLCBtZXNzYWdlOm1lc3NhZ2UsIGxvY2F0aW9uOmxvY2F0aW9uXG5cbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcblxuaXNVbmFzc2lnbmFibGUgPSAobmFtZSwgZGlzcGxheU5hbWUgPSBuYW1lKSAtPiBzd2l0Y2hcbiAgICB3aGVuIG5hbWUgaW4gW0pTX0tFWVdPUkRTLi4uLCBDT0ZGRUVfS0VZV09SRFMuLi5dXG4gICAgICAgIFwia2V5d29yZCAnI3tkaXNwbGF5TmFtZX0nIGNhbid0IGJlIGFzc2lnbmVkXCJcbiAgICB3aGVuIG5hbWUgaW4gU1RSSUNUX1BST1NDUklCRURcbiAgICAgICAgXCInI3tkaXNwbGF5TmFtZX0nIGNhbid0IGJlIGFzc2lnbmVkXCJcbiAgICB3aGVuIG5hbWUgaW4gUkVTRVJWRURcbiAgICAgICAgXCJyZXNlcnZlZCB3b3JkICcje2Rpc3BsYXlOYW1lfScgY2FuJ3QgYmUgYXNzaWduZWRcIlxuICAgIGVsc2VcbiAgICAgICAgZmFsc2VcblxuIyBgZnJvbWAgaXNu4oCZdCBhIGtleXdvcmQsIGJ1dCBpdCBiZWhhdmVzIGxpa2Ugb25lIGluIGBpbXBvcnRgIGFuZCBgZXhwb3J0YCBzdGF0ZW1lbnRzIChoYW5kbGVkIGFib3ZlKSBcbiMgYW5kIGluIHRoZSBkZWNsYXJhdGlvbiBsaW5lIG9mIGEgYGZvcmAgbG9vcC5cbiMgVHJ5IHRvIGRldGVjdCB3aGVuIGBmcm9tYCBpcyBhIHZhcmlhYmxlIGlkZW50aWZpZXIgYW5kIHdoZW4gaXQgaXMgdGhpcyDigJxzb21ldGltZXPigJ0ga2V5d29yZC5cblxuaXNGb3JGcm9tID0gKHByZXYpIC0+XG4gICAgaWYgcHJldlswXSBpcyAnSURFTlRJRklFUidcbiAgICAgICAgIyBgZm9yIGkgZnJvbSBmcm9tYCwgYGZvciBmcm9tIGZyb20gaXRlcmFibGVgXG4gICAgICAgIGlmIHByZXZbMV0gaXMgJ2Zyb20nXG4gICAgICAgICAgICBwcmV2WzFdWzBdID0gJ0lERU5USUZJRVInXG4gICAgICAgICAgICB5ZXNcbiAgICAgICAgIyBgZm9yIGkgZnJvbSBpdGVyYWJsZWBcbiAgICAgICAgeWVzXG4gICAgIyBgZm9yIGZyb23igKZgXG4gICAgZWxzZSBpZiBwcmV2WzBdIGlzICdGT1InXG4gICAgICAgIG5vXG4gICAgIyBgZm9yIHtmcm9tfeKApmAsIGBmb3IgW2Zyb21d4oCmYCwgYGZvciB7YSwgZnJvbX3igKZgLCBgZm9yIHthOiBmcm9tfeKApmBcbiAgICBlbHNlIGlmIHByZXZbMV0gaW4gWyd7JydbJycsJyc6J11cbiAgICAgICAgbm9cbiAgICBlbHNlXG4gICAgICAgIHllc1xuXG4jIyNcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgIFxuIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4jIyNcblxuIyBLZXl3b3JkcyB0aGF0IHdlIHNoYXJlIGluIGNvbW1vbiB3aXRoIEphdmFTY3JpcHQuXG5cbk1FVEFfS0VZV09SRFMgPSBbICdpZicgJ3RoZW4nICdlbGlmJyAnZWxzZScgXVxuXG5KU19LRVlXT1JEUyA9IFtcbiAgICAndHJ1ZScgJ2ZhbHNlJyAnbnVsbCcgJ3RoaXMnXG4gICAgJ25ldycgJ2RlbGV0ZScgJ3R5cGVvZicgJ2luJyAnaW5zdGFuY2VvZidcbiAgICAncmV0dXJuJyAndGhyb3cnICdicmVhaycgJ2NvbnRpbnVlJyAnZGVidWdnZXInICd5aWVsZCdcbiAgICAnaWYnICdlbHNlJyAnc3dpdGNoJyAnZm9yJyAnd2hpbGUnICdkbycgJ3RyeScgJ2NhdGNoJyAnZmluYWxseSdcbiAgICAnY2xhc3MnICdleHRlbmRzJyAnc3VwZXInXG4gICAgJ2ltcG9ydCcgJ2V4cG9ydCcgJ2RlZmF1bHQnXG5dXG5cbkNPRkZFRV9LRVlXT1JEUyA9IFsgJ3VuZGVmaW5lZCcgJ0luZmluaXR5JyAnTmFOJyAndGhlbicgJ3VubGVzcycgJ3VudGlsJyAnbG9vcCcgJ29mJyAnYnknICd3aGVuJyBdXG5cbkNPRkZFRV9BTElBU19NQVAgPVxuICAgIGFuZCAgOiAnJiYnXG4gICAgb3IgICA6ICd8fCdcbiAgICBpcyAgIDogJz09J1xuICAgIGlzbnQgOiAnIT0nICMgdWdseSEgcmVtb3ZlIGluIGNhc2UgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkgd2l0aCBDUzEgaXMgYnJva2VuLiBcbiAgICBub3QgIDogJyEnXG4gICAgeWVzICA6ICd0cnVlJ1xuICAgIG5vICAgOiAnZmFsc2UnXG4gICAgb24gICA6ICd0cnVlJ1xuICAgIG9mZiAgOiAnZmFsc2UnXG5cbkNPRkZFRV9BTElBU0VTICA9IChrZXkgZm9yIGtleSBvZiBDT0ZGRUVfQUxJQVNfTUFQKVxuQ09GRkVFX0tFWVdPUkRTID0gQ09GRkVFX0tFWVdPUkRTLmNvbmNhdCBDT0ZGRUVfQUxJQVNFU1xuXG4jIFRoZSBsaXN0IG9mIGtleXdvcmRzIHRoYXQgYXJlIHJlc2VydmVkIGJ5IEphdmFTY3JpcHQsIGJ1dCBub3QgdXNlZCwgb3IgdXNlZCBpbnRlcm5hbGx5LlxuIyBXZSB0aHJvdyBhbiBlcnJvciB3aGVuIHRoZXNlIGFyZSBlbmNvdW50ZXJlZCwgdG8gYXZvaWQgaGF2aW5nIGEgSmF2YVNjcmlwdCBlcnJvciBhdCBydW50aW1lLlxuXG5SRVNFUlZFRCA9IFtcbiAgICAnY2FzZScgJ2Z1bmN0aW9uJyAndmFyJyAndm9pZCcgJ3dpdGgnICdjb25zdCcgJ2xldCcgJ2VudW0nXG4gICAgJ25hdGl2ZScgJ2ltcGxlbWVudHMnICdpbnRlcmZhY2UnICdwYWNrYWdlJyAncHJpdmF0ZSdcbiAgICAncHJvdGVjdGVkJyAncHVibGljJyAnc3RhdGljJ1xuXVxuXG5TVFJJQ1RfUFJPU0NSSUJFRCA9IFsnYXJndW1lbnRzJyAnZXZhbCddXG5cbiMgVGhlIHN1cGVyc2V0IG9mIGJvdGggSmF2YVNjcmlwdCBrZXl3b3JkcyBhbmQgcmVzZXJ2ZWQgd29yZHMsIG5vbmUgb2Ygd2hpY2ggbWF5XG4jIGJlIHVzZWQgYXMgaWRlbnRpZmllcnMgb3IgcHJvcGVydGllcy5cblxuQk9NID0gNjUyNzkgIyBUaGUgY2hhcmFjdGVyIGNvZGUgb2YgdGhlIG5hc3R5IE1pY3Jvc29mdCBtYWRuZXNzIG90aGVyd2lzZSBrbm93biBhcyB0aGUgQk9NLlxuXG4jIFRva2VuIG1hdGNoaW5nIHJlZ2V4ZXMuXG5cbklERU5USUZJRVIgPSAvLy8gXlxuICAgICg/IVxcZClcbiAgICAoICg/OiAoPyFcXHMpWyRcXHdcXHg3Zi1cXHVmZmZmXSApKyApXG4gICAgKCBbXlxcblxcU10qIDogKD8hOikgKT8gICAgIyBJcyB0aGlzIGEgcHJvcGVydHkgbmFtZT9cbi8vL1xuXG5OVU1CRVIgPSAvLy9cbiAgICBeIDBiWzAxXSsgICAgfCAgICAgICAgICAgICAgIyBiaW5hcnlcbiAgICBeIDBvWzAtN10rICAgfCAgICAgICAgICAgICAgIyBvY3RhbFxuICAgIF4gMHhbXFxkYS1mXSsgfCAgICAgICAgICAgICAgIyBoZXhcbiAgICBeIFxcZCpcXC4/XFxkKyAoPzplWystXT9cXGQrKT8gICMgZGVjaW1hbFxuLy8vaVxuXG5PUEVSQVRPUiA9IC8vLyBeIChcbiAgICA/OiBbLT1dPiAgICAgICAgICAgICAjIGZ1bmN0aW9uXG4gICAgIHwgWy0rKi8lPD4mfF4hPz1dPSAgIyBjb21wb3VuZCBhc3NpZ24gLyBjb21wYXJlXG4gICAgIHwgPj4+PT8gICAgICAgICAgICAgIyB6ZXJvLWZpbGwgcmlnaHQgc2hpZnRcbiAgICAgfCAoWy0rOl0pXFwxICAgICAgICAgIyBkb3VibGVzXG4gICAgIHwgKFsmfDw+Ki8lXSlcXDI9PyAgICMgbG9naWMgLyBzaGlmdCAvIHBvd2VyIC8gZmxvb3IgZGl2aXNpb24gLyBtb2R1bG9cbiAgICAgfCBcXD8oXFwufDo6KSAgICAgICAgICMgc29hayBhY2Nlc3NcbiAgICAgfCBcXC57MiwzfSAgICAgICAgICAgIyByYW5nZSBvciBzcGxhdFxuKSAvLy9cblxuV0hJVEVTUEFDRSA9IC9eW15cXG5cXFNdKy9cblxuIyBDT01NRU5UICAgID0gL14jIyMoW14jXVtcXHNcXFNdKj8pKD86IyMjW15cXG5cXFNdKnwjIyMkKXxeKD86XFxzKiMoPyEjI1teI10pLiopKy8gIyBtb3ZlZCB0byBlbmRcblxuQ09ERSAgICAgICA9IC9eWy09XT4vXG5cbk1VTFRJX0RFTlQgPSAvXig/OlxcblteXFxuXFxTXSopKy9cblxuSlNUT0tFTiAgICAgID0gLy8vXiBgKD8hYGApICgoPzogW15gXFxcXF0gfCBcXFxcW1xcc1xcU10gICAgICAgICAgICAgICApKikgYCAgIC8vL1xuSEVSRV9KU1RPS0VOID0gLy8vXiBgYGAgICAgICAgICAoKD86IFteYFxcXFxdIHwgXFxcXFtcXHNcXFNdIHwgYCg/IWBgKSApKikgYGBgIC8vL1xuXG4jIFN0cmluZy1tYXRjaGluZy1yZWdleGVzLlxuXG5TVFJJTkdfU1RBUlQgICA9IC9eKD86JycnfFwiXCJcInwnfFwiKS9cblxuU1RSSU5HX1NJTkdMRSAgPSAvLy8gXig/OiBbXlxcXFwnXSAgfCBcXFxcW1xcc1xcU10gICAgICAgICAgICAgICAgICAgICAgKSogLy8vXG5TVFJJTkdfRE9VQkxFICA9IC8vLyBeKD86IFteXFxcXFwiI10gfCBcXFxcW1xcc1xcU10gfCAgICAgICAgICAgXFwjKD8hXFx7KSApKiAvLy9cbkhFUkVET0NfU0lOR0xFID0gLy8vIF4oPzogW15cXFxcJ10gICAgfCBcXFxcW1xcc1xcU10gfCAnKD8hJycpICAgICAgICAgICkqIC8vL1xuSEVSRURPQ19ET1VCTEUgPSAvLy8gXig/OiBbXlxcXFxcIiNdIHwgXFxcXFtcXHNcXFNdIHwgXCIoPyFcIlwiKSB8IFxcIyg/IVxceykgKSogLy8vXG5cblNUUklOR19PTUlUICAgID0gLy8vXG4gICAgICAgICgoPzpcXFxcXFxcXCkrKSAgICAgICMgY29uc3VtZSAoYW5kIHByZXNlcnZlKSBhbiBldmVuIG51bWJlciBvZiBiYWNrc2xhc2hlc1xuICAgIHwgXFxcXFteXFxTXFxuXSpcXG5cXHMqICAgICMgcmVtb3ZlIGVzY2FwZWQgbmV3bGluZXNcbi8vL2dcblNJTVBMRV9TVFJJTkdfT01JVCA9IC9cXHMqXFxuXFxzKi9nXG5IRVJFRE9DX0lOREVOVCAgICAgICA9IC9cXG4rKFteXFxuXFxTXSopKD89XFxTKS9nXG5cbiMgUmVnZXgtbWF0Y2hpbmctcmVnZXhlcy5cblJFR0VYID0gLy8vIF5cbiAgICAvICg/IS8pICgoXG4gICAgPzogW14gWyAvIFxcbiBcXFxcIF0gICAgIyBldmVyeSBvdGhlciB0aGluZ1xuICAgICB8IFxcXFxbXlxcbl0gICAgICAgICAgICMgYW55dGhpbmcgYnV0IG5ld2xpbmVzIGVzY2FwZWRcbiAgICAgfCBcXFsgICAgICAgICAgICAgICAgIyBjaGFyYWN0ZXIgY2xhc3NcbiAgICAgICAgICAgICAoPzogXFxcXFteXFxuXSB8IFteIFxcXSBcXG4gXFxcXCBdICkqXG4gICAgICAgICBcXF1cbiAgICApKikgKC8pP1xuLy8vXG5cblJFR0VYX0ZMQUdTICA9IC9eXFx3Ki9cblZBTElEX0ZMQUdTICA9IC9eKD8hLiooLikuKlxcMSlbaW1ndXldKiQvXG5cbkhFUkVHRVggICAgICA9IC8vLyBeKD86IFteXFxcXC8jXSB8IFxcXFxbXFxzXFxTXSB8IC8oPyEvLykgfCBcXCMoPyFcXHspICkqIC8vL1xuXG5IRVJFR0VYX09NSVQgPSAvLy9cbiAgICAgICgoPzpcXFxcXFxcXCkrKSAgICAgICAgICAgIyBjb25zdW1lIChhbmQgcHJlc2VydmUpIGFuIGV2ZW4gbnVtYmVyIG9mIGJhY2tzbGFzaGVzXG4gICAgfCBcXFxcKFxccykgICAgICAgICAgICAgICAgIyBwcmVzZXJ2ZSBlc2NhcGVkIHdoaXRlc3BhY2VcbiAgICB8IFxccysoPzojLiopPyAgICAgICAgICAgIyByZW1vdmUgd2hpdGVzcGFjZSBhbmQgY29tbWVudHNcbi8vL2dcblxuUkVHRVhfSUxMRUdBTCA9IC8vLyBeICggLyB8IC97M31cXHMqKSAoXFwqKSAvLy9cblxuUE9TU0lCTFlfRElWSVNJT04gPSAvLy8gXiAvPT9cXHMgLy8vXG5cbiMgT3RoZXIgcmVnZXhlcy5cblxuSEVSRUNPTU1FTlRfSUxMRUdBTCA9IC9cXCpcXC8vXG5cbkxJTkVfQ09OVElOVUVSICAgICAgICAgID0gLy8vIF4gXFxzKiAoPzogLCB8IFxcPz9cXC4oPyFbLlxcZF0pIHwgOjogKSAvLy9cblxuU1RSSU5HX0lOVkFMSURfRVNDQVBFID0gLy8vXG4gICAgKCAoPzpefFteXFxcXF0pICg/OlxcXFxcXFxcKSogKSAgICAgICAgICAgICAgICAgICAjIG1ha2Ugc3VyZSB0aGUgZXNjYXBlIGlzbuKAmXQgZXNjYXBlZFxuICAgIFxcXFwgKCAgIFxuICAgICAgICAgPzogKDBbMC03XXxbMS03XSkgICAgICAgICAgICAgICAgICAgICAgIyBvY3RhbCBlc2NhcGVcbiAgICAgICAgICAgIHwgKHgoPyFbXFxkYS1mQS1GXXsyfSkuezAsMn0pICAgICAgICAjIGhleCBlc2NhcGVcbiAgICAgICAgICAgIHwgKHVcXHsoPyFbXFxkYS1mQS1GXXsxLH1cXH0pW159XSpcXH0/KSAjIHVuaWNvZGUgY29kZSBwb2ludCBlc2NhcGVcbiAgICAgICAgICAgIHwgKHUoPyFcXHt8W1xcZGEtZkEtRl17NH0pLnswLDR9KSAgICAgIyB1bmljb2RlIGVzY2FwZVxuICAgIClcbi8vL1xuUkVHRVhfSU5WQUxJRF9FU0NBUEUgPSAvLy9cbiAgICAoICg/Ol58W15cXFxcXSkgKD86XFxcXFxcXFwpKiApICAgICAgICAgICAgICAgICAgICMgbWFrZSBzdXJlIHRoZSBlc2NhcGUgaXNu4oCZdCBlc2NhcGVkXG4gICAgXFxcXCAoICAgXG4gICAgICAgICA/OiAoMFswLTddKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIG9jdGFsIGVzY2FwZVxuICAgICAgICAgICAgfCAoeCg/IVtcXGRhLWZBLUZdezJ9KS57MCwyfSkgICAgICAgICMgaGV4IGVzY2FwZVxuICAgICAgICAgICAgfCAodVxceyg/IVtcXGRhLWZBLUZdezEsfVxcfSlbXn1dKlxcfT8pICMgdW5pY29kZSBjb2RlIHBvaW50IGVzY2FwZVxuICAgICAgICAgICAgfCAodSg/IVxce3xbXFxkYS1mQS1GXXs0fSkuezAsNH0pICAgICAjIHVuaWNvZGUgZXNjYXBlXG4gICAgKVxuLy8vXG5cblVOSUNPREVfQ09ERV9QT0lOVF9FU0NBUEUgPSAvLy9cbiAgICAoIFxcXFxcXFxcICkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIG1ha2Ugc3VyZSB0aGUgZXNjYXBlIGlzbuKAmXQgZXNjYXBlZFxuICAgIHxcbiAgICBcXFxcdVxceyAoIFtcXGRhLWZBLUZdKyApIFxcfVxuLy8vZ1xuXG5MRUFESU5HX0JMQU5LX0xJTkUgID0gL15bXlxcblxcU10qXFxuL1xuVFJBSUxJTkdfQkxBTktfTElORSA9IC9cXG5bXlxcblxcU10qJC9cblRSQUlMSU5HX1NQQUNFUyAgICAgPSAvXFxzKyQvXG5DT01QT1VORF9BU1NJR04gICAgID0gWyAnLT0nICcrPScgJy89JyAnKj0nICclPScgJ3x8PScgJyYmPScgJz89JyAnPDw9JyAnPj49JyAnPj4+PScgJyY9JyAnXj0nICd8PScgJyoqPScgJy8vPScgJyUlPScgXVxuVU5BUlkgICAgICAgICAgICAgICA9IFsnTkVXJyAnVFlQRU9GJyAnREVMRVRFJyAnRE8nXVxuVU5BUllfTUFUSCAgICAgICAgICA9IFsnIScgJ34nXVxuU0hJRlQgICAgICAgICAgICAgICA9IFsnPDwnICc+PicgJz4+PiddXG5DT01QQVJFICAgICAgICAgICAgID0gWyc9PScgJyE9JyAnPCcgJz4nICc8PScgJz49J11cbk1BVEggICAgICAgICAgICAgICAgPSBbJyonICcvJyAnJScgJy8vJyAnJSUnXVxuUkVMQVRJT04gICAgICAgICAgICA9IFsnSU4nICdPRicgJ0lOU1RBTkNFT0YnXSAjIFJlbGF0aW9uYWwgdG9rZW5zIHRoYXQgYXJlIG5lZ2F0YWJsZSB3aXRoIGBub3RgIHByZWZpeC5cbkJPT0wgICAgICAgICAgICAgICAgPSBbJ1RSVUUnICdGQUxTRSddXG5cbiMgVG9rZW5zIHdoaWNoIGNvdWxkIGxlZ2l0aW1hdGVseSBiZSBpbnZva2VkIG9yIGluZGV4ZWQuIEFuIG9wZW5pbmdcbiMgcGFyZW50aGVzZXMgb3IgYnJhY2tldCBmb2xsb3dpbmcgdGhlc2UgdG9rZW5zIHdpbGwgYmUgcmVjb3JkZWQgYXMgdGhlIHN0YXJ0XG4jIG9mIGEgZnVuY3Rpb24gaW52b2NhdGlvbiBvciBpbmRleGluZyBvcGVyYXRpb24uXG5cbkNBTExBQkxFICA9IFsnSURFTlRJRklFUicgJ1BST1BFUlRZJyAnKScgJ10nICc/JyAnQCcgJ1RISVMnICdTVVBFUiddXG5JTkRFWEFCTEUgPSBDQUxMQUJMRS5jb25jYXQgWyAnTlVNQkVSJyAnSU5GSU5JVFknICdOQU4nICdTVFJJTkcnICdTVFJJTkdfRU5EJyAnUkVHRVgnICdSRUdFWF9FTkQnICdCT09MJyAnTlVMTCcgJ1VOREVGSU5FRCcgJ30nICc6OicgXVxuXG4jIFRva2VucyB3aGljaCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB3aWxsIG5ldmVyIGltbWVkaWF0ZWx5IGZvbGxvdyAoZXhjZXB0IHNwYWNlZFxuIyBDQUxMQUJMRXMgaW4gc29tZSBjYXNlcyksIGJ1dCB3aGljaCBhIGRpdmlzaW9uIG9wZXJhdG9yIGNhbi5cbiNcbiMgU2VlOiBodHRwOi8vd3d3LWFyY2hpdmUubW96aWxsYS5vcmcvanMvbGFuZ3VhZ2UvanMyMC0yMDAyLTA0L3JhdGlvbmFsZS9zeW50YXguaHRtbCNyZWd1bGFyLWV4cHJlc3Npb25zXG5cbk5PVF9SRUdFWCA9IElOREVYQUJMRS5jb25jYXQgWycrKycgJy0tJ11cblxuIyBUb2tlbnMgdGhhdCwgd2hlbiBpbW1lZGlhdGVseSBwcmVjZWRpbmcgYSBgV0hFTmAsIGluZGljYXRlIHRoYXQgdGhlIGBXSEVOYFxuIyBvY2N1cnMgYXQgdGhlIHN0YXJ0IG9mIGEgbGluZS4gV2UgZGlzYW1iaWd1YXRlIHRoZXNlIGZyb20gdHJhaWxpbmcgd2hlbnMgdG9cbiMgYXZvaWQgYW4gYW1iaWd1aXR5IGluIHRoZSBncmFtbWFyLlxuXG5MSU5FX0JSRUFLID0gWydJTkRFTlQnICdPVVRERU5UJyAnVEVSTUlOQVRPUiddXG5cbiMgQWRkaXRpb25hbCBpbmRlbnQgaW4gZnJvbnQgb2YgdGhlc2UgaXMgaWdub3JlZC5cblxuSU5ERU5UQUJMRV9DTE9TRVJTID0gWycpJyAnfScgJ10nXVxuXG4jIFRva2VucyB0aGF0LCB3aGVuIGFwcGVhcmluZyBhdCB0aGUgZW5kIG9mIGEgbGluZSwgc3VwcHJlc3MgYSBmb2xsb3dpbmcgVEVSTUlOQVRPUi9JTkRFTlQgdG9rZW5cblxuVU5GSU5JU0hFRCA9IFsnXFxcXCcgJy4nICc/LicgJz86OicgJ1VOQVJZJyAnTUFUSCcgJ1VOQVJZX01BVEgnICcrJyAnLSdcbiAgICAgICAgICAgICAgJyoqJyAnU0hJRlQnICdSRUxBVElPTicgJ0NPTVBBUkUnICcmJyAnXicgJ3wnICcmJicgJ3x8J1xuICAgICAgICAgICAgICAnQklOPycgJ1RIUk9XJyAnRVhURU5EUyddXG4gICAgICAgICAgICAgIFxuQ09NTUVOVCAgICA9IC9eIyMjKFteI11bXFxzXFxTXSo/KSg/OiMjI1teXFxuXFxTXSp8IyMjJCl8Xig/OlxccyojKD8hIyNbXiNdKS4qKSsvICAgICAgICAgICAgICBcblxubW9kdWxlLmV4cG9ydHMgPSBcbiAgICBKU19GT1JCSURERU46ICAgSlNfS0VZV09SRFMuY29uY2F0KFJFU0VSVkVEKS5jb25jYXQoU1RSSUNUX1BST1NDUklCRUQpXG4gICAgaXNVbmFzc2lnbmFibGU6IGlzVW5hc3NpZ25hYmxlXG4gICAgTGV4ZXI6ICAgICAgICAgIExleGVyXG4gICAgIl19
//# sourceURL=../coffee/lexer.coffee