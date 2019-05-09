// koffee 0.26.0

/*
000      00000000  000   000  00000000  00000000   
000      000        000 000   000       000   000  
000      0000000     00000    0000000   0000000    
000      000        000 000   000       000   000  
0000000  00000000  000   000  00000000  000   000
 */
var BOM, BOOL, CALLABLE, CODE, COFFEE_ALIASES, COFFEE_ALIAS_MAP, COFFEE_KEYWORDS, COMMENT, COMPARE, COMPOUND_ASSIGN, HERECOMMENT_ILLEGAL, HEREDOC_DOUBLE, HEREDOC_INDENT, HEREDOC_SINGLE, HEREGEX, HEREGEX_OMIT, HERE_JSTOKEN, IDENTIFIER, INDENTABLE_CLOSERS, INDEXABLE, JSTOKEN, JS_KEYWORDS, LEADING_BLANK_LINE, LINE_BREAK, LINE_CONTINUER, Lexer, MATH, META_KEYWORDS, MULTI_DENT, NOT_REGEX, NUMBER, OPERATOR, POSSIBLY_DIVISION, REGEX, REGEX_FLAGS, REGEX_ILLEGAL, REGEX_INVALID_ESCAPE, RELATION, RESERVED, Rewriter, SHIFT, SIMPLE_STRING_OMIT, STRICT_PROSCRIBED, STRING_DOUBLE, STRING_INVALID_ESCAPE, STRING_OMIT, STRING_SINGLE, STRING_START, TRAILING_BLANK_LINE, TRAILING_SPACES, UNARY, UNARY_MATH, UNFINISHED, UNICODE_CODE_POINT_ESCAPE, VALID_FLAGS, WHITESPACE, compact, count, hasFeature, injectFeature, injectMeta, isForFrom, isUnassignable, key, locationDataToString, ref, repeat, starts, throwSyntaxError,
    indexOf = [].indexOf,
    slice = [].slice;

Rewriter = require('./rewriter');

ref = require('./helpers'), count = ref.count, starts = ref.starts, compact = ref.compact, repeat = ref.repeat, locationDataToString = ref.locationDataToString, throwSyntaxError = ref.throwSyntaxError, injectMeta = ref.injectMeta, injectFeature = ref.injectFeature, hasFeature = ref.hasFeature;

Lexer = (function() {
    function Lexer() {}

    Lexer.prototype.tokenize = function(code, opts) {
        var consumed, end, i, ref1;
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
            ref1 = this.getLineAndColumnFromChunk(consumed), this.chunkLine = ref1[0], this.chunkColumn = ref1[1];
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
        var alias, colon, colonOffset, id, idLength, input, match, poppedToken, prev, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, tag, tagToken;
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
            } else if (ref1 = this.value(), indexOf.call(COFFEE_KEYWORDS, ref1) >= 0) {
                this.tokens[this.tokens.length - 1][0] = 'IDENTIFIER';
            }
            if ((ref2 = this.tag()) === 'DEFAULT' || ref2 === 'IMPORT_ALL' || ref2 === 'IDENTIFIER') {
                this.token('AS', id);
                return id.length;
            }
        }
        if (id === 'as' && this.seenExport && ((ref3 = this.tag()) === 'IDENTIFIER' || ref3 === 'DEFAULT')) {
            this.token('AS', id);
            return id.length;
        }
        if (id === 'default' && this.seenExport && ((ref4 = this.tag()) === 'EXPORT' || ref4 === 'AS')) {
            this.token('DEFAULT', id);
            return id.length;
        }
        ref5 = this.tokens, prev = ref5[ref5.length - 1];
        tag = colon || (prev != null) && (((ref6 = prev[0]) === '.' || ref6 === '?.' || ref6 === '::' || ref6 === '?::') || !prev.spaced && prev[0] === '@') ? 'PROPERTY' : 'IDENTIFIER';
        if (tag === 'PROPERTY' && (prev != null ? prev[0] : void 0) === '@' && indexOf.call(META_KEYWORDS, id) >= 0) {
            this.tokens.pop();
            if (id === 'elif') {
                this.token('META_ELSE', 'else');
                tag = 'META_IF';
                id = 'if';
            } else if (id === 'then') {
                tag = 'THEN';
            } else {
                tag = 'META_' + id.toUpperCase();
            }
        } else if (tag === 'IDENTIFIER' && (indexOf.call(JS_KEYWORDS, id) >= 0 || indexOf.call(COFFEE_KEYWORDS, id) >= 0) && !(this.exportSpecifierList && indexOf.call(COFFEE_KEYWORDS, id) >= 0)) {
            tag = id.toUpperCase();
            if (tag === 'WHEN' && (ref7 = this.tag(), indexOf.call(LINE_BREAK, ref7) >= 0)) {
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
            ref8 = [poppedToken[2].first_line, poppedToken[2].first_column], tagToken[2].first_line = ref8[0], tagToken[2].first_column = ref8[1];
        }
        if (colon) {
            colonOffset = input.lastIndexOf(':');
            this.token(':', ':', colonOffset, colon.length);
        }
        return input.length;
    };

    Lexer.prototype.numberToken = function() {
        var base, lexedLength, match, number, numberValue, ref1, tag;
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
        if ((ref1 = number.charAt(1)) === 'b' || ref1 === 'o') {
            number = "0x" + (numberValue.toString(16));
        }
        tag = numberValue === 2e308 ? 'INFINITY' : 'NUMBER';
        this.token(tag, number, 0, lexedLength);
        return lexedLength;
    };

    Lexer.prototype.stringToken = function() {
        var $, attempt, delimiter, doc, end, heredoc, i, indent, indentRegex, match, quote, ref1, ref2, regex, token, tokens;
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
        ref1 = this.matchWithInterpolations(regex, quote), tokens = ref1.tokens, end = ref1.index;
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
                if (indent === null || (0 < (ref2 = attempt.length) && ref2 < indent.length)) {
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
        var body, closed, end, flags, index, match, origin, prev, ref1, ref2, ref3, regex, tokens;
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
                ref1 = this.tokens, prev = ref1[ref1.length - 1];
                if (prev) {
                    if (prev.spaced && (ref2 = prev[0], indexOf.call(CALLABLE, ref2) >= 0)) {
                        if (!closed || POSSIBLY_DIVISION.test(regex)) {
                            return 0;
                        }
                    } else if (ref3 = prev[0], indexOf.call(NOT_REGEX, ref3) >= 0) {
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
        var decreasedIndent, dent, lastIndent, ref1;
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
                if (outdentLength && (ref1 = this.chunk[outdentLength], indexOf.call(INDENTABLE_CLOSERS, ref1) >= 0)) {
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
        var match, nline, prev, ref1;
        if (!((match = WHITESPACE.exec(this.chunk)) || (nline = this.chunk.charAt(0) === '\n'))) {
            return 0;
        }
        ref1 = this.tokens, prev = ref1[ref1.length - 1];
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
        var match, message, origin, prev, ref1, ref2, ref3, ref4, ref5, skipToken, tag, token, value;
        if (match = OPERATOR.exec(this.chunk)) {
            value = match[0];
            if (CODE.test(value)) {
                this.tagParameters();
            }
        } else {
            value = this.chunk.charAt(0);
        }
        tag = value;
        ref1 = this.tokens, prev = ref1[ref1.length - 1];
        if (prev && indexOf.call(['='].concat(slice.call(COMPOUND_ASSIGN)), value) >= 0) {
            skipToken = false;
            if (value === '=' && ((ref2 = prev[1]) === '||' || ref2 === '&&') && !prev.spaced) {
                prev[0] = 'COMPOUND_ASSIGN';
                prev[1] += '=';
                prev = this.tokens[this.tokens.length - 2];
                skipToken = true;
            }
            if (prev && prev[0] !== 'PROPERTY') {
                origin = (ref3 = prev.origin) != null ? ref3 : prev;
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
            if (value === '(' && (ref4 = prev[0], indexOf.call(CALLABLE, ref4) >= 0)) {
                if (prev[0] === '?') {
                    prev[0] = 'FUNC_EXIST';
                }
                tag = 'CALL_START';
            } else if (value === '[' && (ref5 = prev[0], indexOf.call(INDEXABLE, ref5) >= 0)) {
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
        var close, column, firstToken, index, lastToken, line, nested, offsetInChunk, open, ref1, ref2, ref3, str, strPart, tokens;
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
            ref1 = this.getLineAndColumnFromChunk(offsetInChunk + 1), line = ref1[0], column = ref1[1];
            ref2 = new Lexer().tokenize(str.slice(1), {
                line: line,
                column: column,
                untilBalanced: true
            }), nested = ref2.tokens, index = ref2.index;
            index += 1;
            open = nested[0], close = nested[nested.length - 1];
            open[0] = open[1] = '(';
            close[0] = close[1] = ')';
            close.origin = ['', 'end of interpolation', close[2]];
            if (((ref3 = nested[1]) != null ? ref3[0] : void 0) === 'TERMINATOR') {
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
        var converted, firstEmptyStringIndex, firstIndex, i, j, lastToken, len, locationToken, lparen, plusToken, ref1, rparen, tag, token, tokensToPush, value;
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
            (ref1 = this.tokens).push.apply(ref1, tokensToPush);
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
        var lastIndent, prev, ref1, ref2, wanted;
        ref1 = this.ends, prev = ref1[ref1.length - 1];
        if (tag !== (wanted = prev != null ? prev.tag : void 0)) {
            if ('OUTDENT' !== wanted) {
                this.error("unmatched " + tag);
            }
            ref2 = this.indents, lastIndent = ref2[ref2.length - 1];
            this.outdentToken(lastIndent, true);
            return this.pair(tag);
        }
        return this.ends.pop();
    };

    Lexer.prototype.getLineAndColumnFromChunk = function(offset) {
        var column, lastLine, lineCount, ref1, string;
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
            ref1 = string.split('\n'), lastLine = ref1[ref1.length - 1];
            column = lastLine.length;
        } else {
            column += string.length;
        }
        return [this.chunkLine + lineCount, column];
    };

    Lexer.prototype.makeToken = function(tag, value, offsetInChunk, length) {
        var lastCharacter, locationData, ref1, ref2, token;
        if (offsetInChunk == null) {
            offsetInChunk = 0;
        }
        if (length == null) {
            length = value.length;
        }
        locationData = {};
        ref1 = this.getLineAndColumnFromChunk(offsetInChunk), locationData.first_line = ref1[0], locationData.first_column = ref1[1];
        lastCharacter = length > 0 ? length - 1 : 0;
        ref2 = this.getLineAndColumnFromChunk(offsetInChunk + lastCharacter), locationData.last_line = ref2[0], locationData.last_column = ref2[1];
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
        var ref1, token;
        ref1 = this.tokens, token = ref1[ref1.length - 1];
        return token != null ? token[0] : void 0;
    };

    Lexer.prototype.value = function() {
        var ref1, token;
        ref1 = this.tokens, token = ref1[ref1.length - 1];
        return token != null ? token[1] : void 0;
    };

    Lexer.prototype.unfinished = function() {
        var ref1;
        return LINE_CONTINUER.test(this.chunk) || (ref1 = this.tag(), indexOf.call(UNFINISHED, ref1) >= 0);
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
        var before, hex, invalidEscape, invalidEscapeRegex, match, message, octal, ref1, unicode, unicodeCodePoint;
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
            offset: ((ref1 = options.offsetInChunk) != null ? ref1 : 0) + match.index + before.length,
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
        var first_column, first_line, location, ref1, ref2, ref3;
        if (options == null) {
            options = {};
        }
        location = 'first_line' in options ? options : ((ref2 = this.getLineAndColumnFromChunk((ref1 = options.offset) != null ? ref1 : 0), first_line = ref2[0], first_column = ref2[1], ref2), {
            first_line: first_line,
            first_column: first_column,
            last_column: first_column + ((ref3 = options.length) != null ? ref3 : 1) - 1
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
    var ref1;
    if (prev[0] === 'IDENTIFIER') {
        if (prev[1] === 'from') {
            prev[1][0] = 'IDENTIFIER';
            true;
        }
        return true;
    } else if (prev[0] === 'FOR') {
        return false;
    } else if ((ref1 = prev[1]) === '{' || ref1 === '[' || ref1 === ',' || ref1 === ':') {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4ZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLG80QkFBQTtJQUFBOzs7QUFpQkEsUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztBQUVYLE1BQW9ILE9BQUEsQ0FBUSxXQUFSLENBQXBILEVBQUUsaUJBQUYsRUFBUyxtQkFBVCxFQUFpQixxQkFBakIsRUFBMEIsbUJBQTFCLEVBQWtDLCtDQUFsQyxFQUF3RCx1Q0FBeEQsRUFBMEUsMkJBQTFFLEVBQXNGLGlDQUF0RixFQUFxRzs7QUFLL0Y7OztvQkFpQkYsUUFBQSxHQUFVLFNBQUMsSUFBRCxFQUFPLElBQVA7QUFFTixZQUFBO1FBQUEsSUFBQSxHQUFPLGFBQUEsQ0FBYyxJQUFkO1FBQ1AsSUFBQSxHQUFPLFVBQUEsQ0FBYyxJQUFkO1FBRVAsSUFBQyxDQUFBLE1BQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxVQUFELEdBQWM7UUFDZCxJQUFDLENBQUEsTUFBRCxHQUFjO1FBQ2QsSUFBQyxDQUFBLE9BQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxPQUFELEdBQWM7UUFDZCxJQUFDLENBQUEsSUFBRCxHQUFjO1FBQ2QsSUFBQyxDQUFBLE1BQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxPQUFELEdBQWM7UUFDZCxJQUFDLENBQUEsVUFBRCxHQUFjO1FBQ2QsSUFBQyxDQUFBLFVBQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxtQkFBRCxHQUF1QjtRQUN2QixJQUFDLENBQUEsbUJBQUQsR0FBdUI7UUFFdkIsSUFBQyxDQUFBLFNBQUQsR0FDSSxJQUFJLENBQUMsSUFBTCxJQUFhO1FBQ2pCLElBQUMsQ0FBQSxXQUFELEdBQ0ksSUFBSSxDQUFDLE1BQUwsSUFBZTtRQUNuQixJQUFBLEdBQU8sSUFBQyxDQUFBLEtBQUQsQ0FBTyxJQUFQO1FBS1AsQ0FBQSxHQUFJO0FBQ0osZUFBTSxJQUFDLENBQUEsS0FBRCxHQUFTLElBQUssU0FB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QixDQUFFLFFBQUYsRUFBVyxVQUFYLEVBQXNCLEtBQXRCLEVBQTRCLFFBQTVCLEVBQXFDLFlBQXJDLEVBQWtELE9BQWxELEVBQTBELFdBQTFELEVBQXNFLE1BQXRFLEVBQTZFLE1BQTdFLEVBQW9GLFdBQXBGLEVBQWdHLEdBQWhHLEVBQW9HLElBQXBHLENBQWhCOztBQU9aLFNBQUEsR0FBWSxTQUFTLENBQUMsTUFBVixDQUFpQixDQUFDLElBQUQsRUFBTSxJQUFOLENBQWpCOztBQU1aLFVBQUEsR0FBYSxDQUFDLFFBQUQsRUFBVSxTQUFWLEVBQW9CLFlBQXBCOztBQUliLGtCQUFBLEdBQXFCLENBQUMsR0FBRCxFQUFLLEdBQUwsRUFBUyxHQUFUOztBQUlyQixVQUFBLEdBQWEsQ0FBQyxJQUFELEVBQU0sR0FBTixFQUFVLElBQVYsRUFBZSxLQUFmLEVBQXFCLE9BQXJCLEVBQTZCLE1BQTdCLEVBQW9DLFlBQXBDLEVBQWlELEdBQWpELEVBQXFELEdBQXJELEVBQ0MsSUFERCxFQUNNLE9BRE4sRUFDYyxVQURkLEVBQ3lCLFNBRHpCLEVBQ21DLEdBRG5DLEVBQ3VDLEdBRHZDLEVBQzJDLEdBRDNDLEVBQytDLElBRC9DLEVBQ29ELElBRHBELEVBRUMsTUFGRCxFQUVRLE9BRlIsRUFFZ0IsU0FGaEI7O0FBSWIsT0FBQSxHQUFhIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbjAwMCAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuMDAwICAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4wMDAgICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbjAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuIyMjXG5cbiMgVGhlIExleGVyIHVzZXMgYSBzZXJpZXMgb2YgdG9rZW4tbWF0Y2hpbmcgcmVnZXhlcyB0byBhdHRlbXB0IG1hdGNoZXMgYWdhaW5zdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBzb3VyY2UgY29kZS4gXG4jIFdoZW4gYSBtYXRjaCBpcyBmb3VuZCwgYSB0b2tlbiBpcyBwcm9kdWNlZCwgd2UgY29uc3VtZSB0aGUgbWF0Y2gsIGFuZCBzdGFydCBhZ2Fpbi4gXG4jIFRva2VucyBhcmUgaW4gdGhlIGZvcm06XG4jXG4jICAgIFt0YWcsIHZhbHVlLCBsb2NhdGlvbkRhdGFdXG4jXG4jIHdoZXJlIGxvY2F0aW9uRGF0YSBpcyB7Zmlyc3RfbGluZSwgZmlyc3RfY29sdW1uLCBsYXN0X2xpbmUsIGxhc3RfY29sdW1ufSwgXG4jIHdoaWNoIGlzIGEgZm9ybWF0IHRoYXQgY2FuIGJlIGZlZCBkaXJlY3RseSBpbnRvIEppc29uIHZpYSB0aGUgYHBhcnNlci5sZXhlcmAgZnVuY3Rpb24gZGVmaW5lZCBpbiBrb2ZmZWUuY29mZmVlLlxuXG5SZXdyaXRlciA9IHJlcXVpcmUgJy4vcmV3cml0ZXInXG5cbnsgY291bnQsIHN0YXJ0cywgY29tcGFjdCwgcmVwZWF0LCBsb2NhdGlvbkRhdGFUb1N0cmluZywgdGhyb3dTeW50YXhFcnJvciwgaW5qZWN0TWV0YSwgaW5qZWN0RmVhdHVyZSwgaGFzRmVhdHVyZSB9ID0gcmVxdWlyZSAnLi9oZWxwZXJzJ1xuXG4jIFRoZSBMZXhlciBjbGFzcyByZWFkcyBhIHN0cmluZyBhbmQgZGl2dmllcyBpdCB1cCBpbnRvIHRhZ2dlZCB0b2tlbnMuIFxuIyBTb21lIHBvdGVudGlhbCBhbWJpZ3VpdHkgaW4gdGhlIGdyYW1tYXIgaGFzIGJlZW4gYXZvaWRlZCBieSBwdXNoaW5nIHNvbWUgZXh0cmEgc21hcnRzIGludG8gdGhlIExleGVyLlxuXG5jbGFzcyBMZXhlclxuXG4gICAgIyB0b2tlbml6ZSBpcyB0aGUgTGV4ZXIncyBtYWluIG1ldGhvZC4gU2NhbiBieSBhdHRlbXB0aW5nIHRvIG1hdGNoIHRva2Vuc1xuICAgICMgb25lIGF0IGEgdGltZSwgdXNpbmcgYSByZWd1bGFyIGV4cHJlc3Npb24gYW5jaG9yZWQgYXQgdGhlIHN0YXJ0IG9mIHRoZVxuICAgICMgcmVtYWluaW5nIGNvZGUsIG9yIGEgY3VzdG9tIHJlY3Vyc2l2ZSB0b2tlbi1tYXRjaGluZyBtZXRob2QgKGZvciBpbnRlcnBvbGF0aW9ucykuIFxuICAgICMgV2hlbiB0aGUgbmV4dCB0b2tlbiBoYXMgYmVlbiByZWNvcmRlZCwgd2UgbW92ZSBmb3J3YXJkIHdpdGhpbiB0aGUgY29kZSBwYXN0IHRoZSB0b2tlbiwgYW5kIGJlZ2luIGFnYWluLlxuICAgICNcbiAgICAjIEVhY2ggdG9rZW5pemluZyBtZXRob2QgaXMgcmVzcG9uc2libGUgZm9yIHJldHVybmluZyB0aGUgbnVtYmVyIG9mIGNoYXJhY3RlcnMgaXQgaGFzIGNvbnN1bWVkLlxuICAgICNcbiAgICAjIEJlZm9yZSByZXR1cm5pbmcgdGhlIHRva2VuIHN0cmVhbSwgcnVuIGl0IHRocm91Z2ggdGhlIFJld3JpdGVyLlxuICAgIFxuICAgICMgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAgIDAwMCAgIDAwMCAgICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgICAwMDAgICAgMDAwMDAwMCAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAgICAgICAgIFxuICAgIHRva2VuaXplOiAoY29kZSwgb3B0cykgLT5cblxuICAgICAgICBvcHRzID0gaW5qZWN0RmVhdHVyZSBvcHRzXG4gICAgICAgIG9wdHMgPSBpbmplY3RNZXRhICAgIG9wdHMgICMgd2lsbCBiZSBuZWVkZWQgdG8gc2hvcnRjdXQgbWV0YXMsIGUuZy4gQHRva2VuIC0+IEBpZiBAdG9rZW4gLi4uXG4gICAgICAgIFxuICAgICAgICBAaW5kZW50ICAgICA9IDAgICAgICAgICAgICAjIFRoZSBjdXJyZW50IGluZGVudGF0aW9uIGxldmVsLlxuICAgICAgICBAYmFzZUluZGVudCA9IDAgICAgICAgICAgICAjIFRoZSBvdmVyYWxsIG1pbmltdW0gaW5kZW50YXRpb24gbGV2ZWxcbiAgICAgICAgQGluZGVidCAgICAgPSAwICAgICAgICAgICAgIyBUaGUgb3Zlci1pbmRlbnRhdGlvbiBhdCB0aGUgY3VycmVudCBsZXZlbC5cbiAgICAgICAgQG91dGRlYnQgICAgPSAwICAgICAgICAgICAgIyBUaGUgdW5kZXItb3V0ZGVudGF0aW9uIGF0IHRoZSBjdXJyZW50IGxldmVsLlxuICAgICAgICBAaW5kZW50cyAgICA9IFtdICAgICAgICAgICAjIFRoZSBzdGFjayBvZiBhbGwgY3VycmVudCBpbmRlbnRhdGlvbiBsZXZlbHMuXG4gICAgICAgIEBlbmRzICAgICAgID0gW10gICAgICAgICAgICMgVGhlIHN0YWNrIGZvciBwYWlyaW5nIHVwIHRva2Vucy5cbiAgICAgICAgQHRva2VucyAgICAgPSBbXSAgICAgICAgICAgIyBTdHJlYW0gb2YgcGFyc2VkIHRva2VucyBpbiB0aGUgZm9ybSBgWydUWVBFJywgdmFsdWUsIGxvY2F0aW9uIGRhdGFdYC5cbiAgICAgICAgQHNlZW5Gb3IgICAgPSBubyAgICAgICAgICAgIyBVc2VkIHRvIHJlY29nbml6ZSBGT1JJTiwgRk9ST0YgYW5kIEZPUkZST00gdG9rZW5zLlxuICAgICAgICBAc2VlbkltcG9ydCA9IG5vICAgICAgICAgICAjIFVzZWQgdG8gcmVjb2duaXplIElNUE9SVCBGUk9NPyBBUz8gdG9rZW5zLlxuICAgICAgICBAc2VlbkV4cG9ydCA9IG5vICAgICAgICAgICAjIFVzZWQgdG8gcmVjb2duaXplIEVYUE9SVCBGUk9NPyBBUz8gdG9rZW5zLlxuICAgICAgICBAaW1wb3J0U3BlY2lmaWVyTGlzdCA9IG5vICAjIFVzZWQgdG8gaWRlbnRpZnkgd2hlbiBpbiBhbiBJTVBPUlQgey4uLn0gRlJPTT8gLi4uXG4gICAgICAgIEBleHBvcnRTcGVjaWZpZXJMaXN0ID0gbm8gICMgVXNlZCB0byBpZGVudGlmeSB3aGVuIGluIGFuIEVYUE9SVCB7Li4ufSBGUk9NPyAuLi5cblxuICAgICAgICBAY2h1bmtMaW5lID1cbiAgICAgICAgICAgIG9wdHMubGluZSBvciAwICAgICAgICAgIyBUaGUgc3RhcnQgbGluZSBmb3IgdGhlIGN1cnJlbnQgQGNodW5rLlxuICAgICAgICBAY2h1bmtDb2x1bW4gPVxuICAgICAgICAgICAgb3B0cy5jb2x1bW4gb3IgMCAgICAgICAjIFRoZSBzdGFydCBjb2x1bW4gb2YgdGhlIGN1cnJlbnQgQGNodW5rLlxuICAgICAgICBjb2RlID0gQGNsZWFuIGNvZGUgICAgICAgICAjIFRoZSBzdHJpcHBlZCwgY2xlYW5lZCBvcmlnaW5hbCBzb3VyY2UgY29kZS5cblxuICAgICAgICAjIEF0IGV2ZXJ5IHBvc2l0aW9uLCBydW4gdGhyb3VnaCB0aGlzIGxpc3Qgb2YgYXR0ZW1wdGVkIG1hdGNoZXMsIHNob3J0LWNpcmN1aXRpbmcgaWYgYW55IG9mIHRoZW0gc3VjY2VlZC4gXG4gICAgICAgICMgVGhlaXIgb3JkZXIgZGV0ZXJtaW5lcyBwcmVjZWRlbmNlOiBgQGxpdGVyYWxUb2tlbmAgaXMgdGhlIGZhbGxiYWNrIGNhdGNoLWFsbC5cbiAgICAgICAgXG4gICAgICAgIGkgPSAwXG4gICAgICAgIHdoaWxlIEBjaHVuayA9IGNvZGVbaS4uXVxuICAgICAgICAgICAgY29uc3VtZWQgPSBcXFxuICAgICAgICAgICAgICAgICAgICAgQGlkZW50aWZpZXJUb2tlbigpIG9yXG4gICAgICAgICAgICAgICAgICAgICBAY29tbWVudFRva2VuKCkgICAgb3JcbiAgICAgICAgICAgICAgICAgICAgIEB3aGl0ZXNwYWNlVG9rZW4oKSBvclxuICAgICAgICAgICAgICAgICAgICAgQGxpbmVUb2tlbigpICAgICAgIG9yXG4gICAgICAgICAgICAgICAgICAgICBAc3RyaW5nVG9rZW4oKSAgICAgb3JcbiAgICAgICAgICAgICAgICAgICAgIEBudW1iZXJUb2tlbigpICAgICBvclxuICAgICAgICAgICAgICAgICAgICAgQHJlZ2V4VG9rZW4oKSAgICAgIG9yXG4gICAgICAgICAgICAgICAgICAgICBAanNUb2tlbigpICAgICAgICAgb3JcbiAgICAgICAgICAgICAgICAgICAgIEBsaXRlcmFsVG9rZW4oKVxuXG4gICAgICAgICAgICAjIFVwZGF0ZSBwb3NpdGlvblxuICAgICAgICAgICAgW0BjaHVua0xpbmUsIEBjaHVua0NvbHVtbl0gPSBAZ2V0TGluZUFuZENvbHVtbkZyb21DaHVuayBjb25zdW1lZFxuXG4gICAgICAgICAgICBpICs9IGNvbnN1bWVkXG5cbiAgICAgICAgICAgIHJldHVybiB7QHRva2VucywgaW5kZXg6IGl9IGlmIG9wdHMudW50aWxCYWxhbmNlZCBhbmQgQGVuZHMubGVuZ3RoIGlzIDBcblxuICAgICAgICBAY2xvc2VJbmRlbnRhdGlvbigpXG4gICAgICAgIEBlcnJvciBcIm1pc3NpbmcgI3tlbmQudGFnfVwiLCBlbmQub3JpZ2luWzJdIGlmIGVuZCA9IEBlbmRzLnBvcCgpXG4gICAgICAgIFxuICAgICAgICBpZiBoYXNGZWF0dXJlIG9wdHMsICdyZXdyaXRlJ1xuICAgICAgICAgICAgKG5ldyBSZXdyaXRlcikucmV3cml0ZSBAdG9rZW5zLCBvcHRzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHdhcm4gJ3NraXBwaW5nIHJld3JpdGUhJyMgLCBvcHRzXG5cbiAgICAgICAgQHRva2Vuc1xuXG4gICAgIyBQcmVwcm9jZXNzIHRoZSBjb2RlIHRvIHJlbW92ZSBsZWFkaW5nIGFuZCB0cmFpbGluZyB3aGl0ZXNwYWNlLCBjYXJyaWFnZSByZXR1cm5zLCBldGMuIFxuICAgIFxuICAgIGNsZWFuOiAoY29kZSkgLT5cbiAgICAgICAgY29kZSA9IGNvZGUuc2xpY2UoMSkgaWYgY29kZS5jaGFyQ29kZUF0KDApIGlzIEJPTVxuICAgICAgICBjb2RlID0gY29kZS5yZXBsYWNlKC9cXHIvZywgJycpLnJlcGxhY2UgVFJBSUxJTkdfU1BBQ0VTLCAnJ1xuICAgICAgICBpZiBXSElURVNQQUNFLnRlc3QgY29kZVxuICAgICAgICAgICAgY29kZSA9IFwiXFxuI3tjb2RlfVwiXG4gICAgICAgICAgICBAY2h1bmtMaW5lLS1cbiAgICAgICAgY29kZVxuXG4gICAgIyAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMDAwMDAwICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAwMDAgICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgIyBNYXRjaGVzIGlkZW50aWZ5aW5nIGxpdGVyYWxzOiB2YXJpYWJsZXMsIGtleXdvcmRzLCBtZXRob2QgbmFtZXMsIGV0Yy5cbiAgICAjIENoZWNrIHRvIGVuc3VyZSB0aGF0IEphdmFTY3JpcHQgcmVzZXJ2ZWQgd29yZHMgYXJlbid0IGJlaW5nIHVzZWQgYXMgaWRlbnRpZmllcnMuIFxuICAgICMgQmVjYXVzZSBLb2ZmZWUgcmVzZXJ2ZXMgYSBoYW5kZnVsIG9mIGtleXdvcmRzIHRoYXQgYXJlIGFsbG93ZWQgaW4gSmF2YVNjcmlwdCwgXG4gICAgIyB3ZSdyZSBjYXJlZnVsIG5vdCB0byB0YWcgdGhlbSBhcyBrZXl3b3JkcyB3aGVuIHJlZmVyZW5jZWQgYXMgcHJvcGVydHkgbmFtZXMgaGVyZSwgXG4gICAgIyBzbyB5b3UgY2FuIHN0aWxsIGRvIGBqUXVlcnkuaXMoKWAgZXZlbiB0aG91Z2ggYGlzYCBtZWFucyBgPT09YCBvdGhlcndpc2UuXG4gICAgXG4gICAgaWRlbnRpZmllclRva2VuOiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIDAgdW5sZXNzIG1hdGNoID0gSURFTlRJRklFUi5leGVjIEBjaHVua1xuICAgICAgICBbaW5wdXQsIGlkLCBjb2xvbl0gPSBtYXRjaFxuXG4gICAgICAgIGlkTGVuZ3RoID0gaWQubGVuZ3RoICMgUHJlc2VydmUgbGVuZ3RoIG9mIGlkIGZvciBsb2NhdGlvbiBkYXRhXG4gICAgICAgIHBvcHBlZFRva2VuID0gdW5kZWZpbmVkXG5cbiAgICAgICAgaWYgaWQgaXMgJ293bicgYW5kIEB0YWcoKSBpcyAnRk9SJ1xuICAgICAgICAgICAgQHRva2VuICdPV04nLCBpZFxuICAgICAgICAgICAgcmV0dXJuIGlkLmxlbmd0aFxuICAgICAgICBpZiBpZCBpcyAnZnJvbScgYW5kIEB0YWcoKSBpcyAnWUlFTEQnXG4gICAgICAgICAgICBAdG9rZW4gJ0ZST00nLCBpZFxuICAgICAgICAgICAgcmV0dXJuIGlkLmxlbmd0aFxuICAgICAgICBpZiBpZCBpcyAnYXMnIGFuZCBAc2VlbkltcG9ydFxuICAgICAgICAgICAgaWYgQHZhbHVlKCkgaXMgJyonXG4gICAgICAgICAgICAgICAgQHRva2Vuc1tAdG9rZW5zLmxlbmd0aCAtIDFdWzBdID0gJ0lNUE9SVF9BTEwnXG4gICAgICAgICAgICBlbHNlIGlmIEB2YWx1ZSgpIGluIENPRkZFRV9LRVlXT1JEU1xuICAgICAgICAgICAgICAgIEB0b2tlbnNbQHRva2Vucy5sZW5ndGggLSAxXVswXSA9ICdJREVOVElGSUVSJ1xuICAgICAgICAgICAgaWYgQHRhZygpIGluIFsnREVGQVVMVCcgJ0lNUE9SVF9BTEwnICdJREVOVElGSUVSJ11cbiAgICAgICAgICAgICAgICBAdG9rZW4gJ0FTJywgaWRcbiAgICAgICAgICAgICAgICByZXR1cm4gaWQubGVuZ3RoXG4gICAgICAgIGlmIGlkIGlzICdhcycgYW5kIEBzZWVuRXhwb3J0IGFuZCBAdGFnKCkgaW4gWydJREVOVElGSUVSJyAnREVGQVVMVCddXG4gICAgICAgICAgICBAdG9rZW4gJ0FTJywgaWRcbiAgICAgICAgICAgIHJldHVybiBpZC5sZW5ndGhcbiAgICAgICAgaWYgaWQgaXMgJ2RlZmF1bHQnIGFuZCBAc2VlbkV4cG9ydCBhbmQgQHRhZygpIGluIFsnRVhQT1JUJyAnQVMnXVxuICAgICAgICAgICAgQHRva2VuICdERUZBVUxUJywgaWRcbiAgICAgICAgICAgIHJldHVybiBpZC5sZW5ndGhcblxuICAgICAgICBbLi4uLCBwcmV2XSA9IEB0b2tlbnNcblxuICAgICAgICB0YWcgPVxuICAgICAgICAgICAgaWYgY29sb24gb3IgcHJldj8gYW5kIChwcmV2WzBdIGluIFsnLicgJz8uJyAnOjonICc/OjonXSBvciBub3QgcHJldi5zcGFjZWQgYW5kIHByZXZbMF0gaXMgJ0AnKVxuICAgICAgICAgICAgICAgICdQUk9QRVJUWSdcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAnSURFTlRJRklFUidcblxuICAgICAgICBpZiB0YWcgaXMgJ1BST1BFUlRZJyBhbmQgcHJldj9bMF0gaXMgJ0AnIGFuZCBpZCBpbiBNRVRBX0tFWVdPUkRTXG4gICAgICAgICAgICAjIGxvZyAnQFBST1BFUlRZJywgaWQsIEB0b2tlbnNbLTEuLi0xXSwgQHRva2Vuc1stMV0sIEB0b2tlbnMubGVuZ3RoXG4gICAgICAgICAgICBAdG9rZW5zLnBvcCgpXG4gICAgICAgICAgICBpZiBpZCA9PSAnZWxpZidcbiAgICAgICAgICAgICAgICBAdG9rZW4gJ01FVEFfRUxTRScsICdlbHNlJ1xuICAgICAgICAgICAgICAgIHRhZyA9ICdNRVRBX0lGJ1xuICAgICAgICAgICAgICAgIGlkICA9ICdpZidcbiAgICAgICAgICAgIGVsc2UgaWYgaWQgPT0gJ3RoZW4nXG4gICAgICAgICAgICAgICAgdGFnID0gJ1RIRU4nXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdGFnID0gJ01FVEFfJyArIGlkLnRvVXBwZXJDYXNlKClcbiAgICAgICAgICAgIFxuICAgICAgICBlbHNlIGlmIHRhZyBpcyAnSURFTlRJRklFUicgYW5kIChpZCBpbiBKU19LRVlXT1JEUyBvciBpZCBpbiBDT0ZGRUVfS0VZV09SRFMpIGFuZCBub3QgKEBleHBvcnRTcGVjaWZpZXJMaXN0IGFuZCBpZCBpbiBDT0ZGRUVfS0VZV09SRFMpXG4gICAgICAgICAgICB0YWcgPSBpZC50b1VwcGVyQ2FzZSgpXG4gICAgICAgICAgICBpZiB0YWcgaXMgJ1dIRU4nIGFuZCBAdGFnKCkgaW4gTElORV9CUkVBS1xuICAgICAgICAgICAgICAgIHRhZyA9ICdMRUFESU5HX1dIRU4nXG4gICAgICAgICAgICBlbHNlIGlmIHRhZyBpcyAnRk9SJ1xuICAgICAgICAgICAgICAgIEBzZWVuRm9yID0geWVzXG4gICAgICAgICAgICBlbHNlIGlmIHRhZyBpcyAnVU5MRVNTJ1xuICAgICAgICAgICAgICAgIHRhZyA9ICdJRidcbiAgICAgICAgICAgIGVsc2UgaWYgdGFnIGlzICdJTVBPUlQnXG4gICAgICAgICAgICAgICAgQHNlZW5JbXBvcnQgPSB5ZXNcbiAgICAgICAgICAgIGVsc2UgaWYgdGFnIGlzICdFWFBPUlQnXG4gICAgICAgICAgICAgICAgQHNlZW5FeHBvcnQgPSB5ZXNcbiAgICAgICAgICAgIGVsc2UgaWYgdGFnIGluIFVOQVJZXG4gICAgICAgICAgICAgICAgdGFnID0gJ1VOQVJZJ1xuICAgICAgICAgICAgZWxzZSBpZiB0YWcgaW4gUkVMQVRJT05cbiAgICAgICAgICAgICAgICBpZiB0YWcgIT0gJ0lOU1RBTkNFT0YnIGFuZCBAc2VlbkZvclxuICAgICAgICAgICAgICAgICAgICB0YWcgPSAnRk9SJyArIHRhZ1xuICAgICAgICAgICAgICAgICAgICBAc2VlbkZvciA9IG5vXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB0YWcgPSAnUkVMQVRJT04nXG4gICAgICAgICAgICAgICAgICAgIGlmIEB2YWx1ZSgpIGlzICchJ1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9wcGVkVG9rZW4gPSBAdG9rZW5zLnBvcCgpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9ICchJyArIGlkXG4gICAgICAgIGVsc2UgaWYgdGFnIGlzICdJREVOVElGSUVSJyBhbmQgQHNlZW5Gb3IgYW5kIGlkIGlzICdmcm9tJyBhbmQgaXNGb3JGcm9tKHByZXYpXG4gICAgICAgICAgICB0YWcgPSAnRk9SRlJPTSdcbiAgICAgICAgICAgIEBzZWVuRm9yID0gbm9cblxuICAgICAgICBpZiB0YWcgaXMgJ0lERU5USUZJRVInIGFuZCBpZCBpbiBSRVNFUlZFRFxuICAgICAgICAgICAgQGVycm9yIFwicmVzZXJ2ZWQgd29yZCAnI3tpZH0nXCIsIGxlbmd0aDogaWQubGVuZ3RoXG5cbiAgICAgICAgdW5sZXNzIHRhZyBpcyAnUFJPUEVSVFknXG4gICAgICAgICAgICBpZiBpZCBpbiBDT0ZGRUVfQUxJQVNFU1xuICAgICAgICAgICAgICAgIGFsaWFzID0gaWRcbiAgICAgICAgICAgICAgICBpZCA9IENPRkZFRV9BTElBU19NQVBbaWRdXG4gICAgICAgICAgICB0YWcgPSBzd2l0Y2ggaWRcbiAgICAgICAgICAgICAgICB3aGVuICchJyAgICAgICAgICAgICAgICAgICAgdGhlbiAnVU5BUlknXG4gICAgICAgICAgICAgICAgd2hlbiAnPT0nLCAnIT0nICAgICAgICAgICAgIHRoZW4gJ0NPTVBBUkUnXG4gICAgICAgICAgICAgICAgd2hlbiAndHJ1ZScsICdmYWxzZScgICAgICAgIHRoZW4gJ0JPT0wnXG4gICAgICAgICAgICAgICAgd2hlbiAnJiYnLCAnfHwnICAgICAgICAgICAgIHRoZW4gaWRcbiAgICAgICAgICAgICAgICB3aGVuICdicmVhaycsICdjb250aW51ZScsICdkZWJ1Z2dlcicgdGhlbiAnU1RBVEVNRU5UJ1xuICAgICAgICAgICAgICAgIGVsc2UgICAgdGFnXG5cbiAgICAgICAgdGFnVG9rZW4gPSBAdG9rZW4gdGFnLCBpZCwgMCwgaWRMZW5ndGhcbiAgICAgICAgdGFnVG9rZW4ub3JpZ2luID0gW3RhZywgYWxpYXMsIHRhZ1Rva2VuWzJdXSBpZiBhbGlhc1xuICAgICAgICBpZiBwb3BwZWRUb2tlblxuICAgICAgICAgICAgW3RhZ1Rva2VuWzJdLmZpcnN0X2xpbmUsIHRhZ1Rva2VuWzJdLmZpcnN0X2NvbHVtbl0gPVxuICAgICAgICAgICAgICAgIFtwb3BwZWRUb2tlblsyXS5maXJzdF9saW5lLCBwb3BwZWRUb2tlblsyXS5maXJzdF9jb2x1bW5dXG4gICAgICAgIGlmIGNvbG9uXG4gICAgICAgICAgICBjb2xvbk9mZnNldCA9IGlucHV0Lmxhc3RJbmRleE9mICc6J1xuICAgICAgICAgICAgQHRva2VuICc6JywgJzonLCBjb2xvbk9mZnNldCwgY29sb24ubGVuZ3RoXG5cbiAgICAgICAgaW5wdXQubGVuZ3RoXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMCAgICAgMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuXG4gICAgIyBNYXRjaGVzIG51bWJlcnMsIGluY2x1ZGluZyBkZWNpbWFscywgaGV4LCBhbmQgZXhwb25lbnRpYWwgbm90YXRpb24uXG4gICAgIyBCZSBjYXJlZnVsIG5vdCB0byBpbnRlcmZlcmUgd2l0aCByYW5nZXMtaW4tcHJvZ3Jlc3MuXG4gICAgXG4gICAgbnVtYmVyVG9rZW46IC0+XG4gICAgICAgIHJldHVybiAwIHVubGVzcyBtYXRjaCA9IE5VTUJFUi5leGVjIEBjaHVua1xuXG4gICAgICAgIG51bWJlciA9IG1hdGNoWzBdXG4gICAgICAgIGxleGVkTGVuZ3RoID0gbnVtYmVyLmxlbmd0aFxuXG4gICAgICAgIHN3aXRjaFxuICAgICAgICAgICAgd2hlbiAvXjBbQk9YXS8udGVzdCBudW1iZXJcbiAgICAgICAgICAgICAgICBAZXJyb3IgXCJyYWRpeCBwcmVmaXggaW4gJyN7bnVtYmVyfScgbXVzdCBiZSBsb3dlcmNhc2VcIiwgb2Zmc2V0OiAxXG4gICAgICAgICAgICB3aGVuIC9eKD8hMHgpLipFLy50ZXN0IG51bWJlclxuICAgICAgICAgICAgICAgIEBlcnJvciBcImV4cG9uZW50aWFsIG5vdGF0aW9uIGluICcje251bWJlcn0nIG11c3QgYmUgaW5kaWNhdGVkIHdpdGggYSBsb3dlcmNhc2UgJ2UnXCIsXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldDogbnVtYmVyLmluZGV4T2YoJ0UnKVxuICAgICAgICAgICAgd2hlbiAvXjBcXGQqWzg5XS8udGVzdCBudW1iZXJcbiAgICAgICAgICAgICAgICBAZXJyb3IgXCJkZWNpbWFsIGxpdGVyYWwgJyN7bnVtYmVyfScgbXVzdCBub3QgYmUgcHJlZml4ZWQgd2l0aCAnMCdcIiwgbGVuZ3RoOiBsZXhlZExlbmd0aFxuICAgICAgICAgICAgd2hlbiAvXjBcXGQrLy50ZXN0IG51bWJlclxuICAgICAgICAgICAgICAgIEBlcnJvciBcIm9jdGFsIGxpdGVyYWwgJyN7bnVtYmVyfScgbXVzdCBiZSBwcmVmaXhlZCB3aXRoICcwbydcIiwgbGVuZ3RoOiBsZXhlZExlbmd0aFxuXG4gICAgICAgIGJhc2UgPSBzd2l0Y2ggbnVtYmVyLmNoYXJBdCAxXG4gICAgICAgICAgICB3aGVuICdiJyB0aGVuIDJcbiAgICAgICAgICAgIHdoZW4gJ28nIHRoZW4gOFxuICAgICAgICAgICAgd2hlbiAneCcgdGhlbiAxNlxuICAgICAgICAgICAgZWxzZSBudWxsXG4gICAgICAgIG51bWJlclZhbHVlID0gaWYgYmFzZT8gdGhlbiBwYXJzZUludChudW1iZXJbMi4uXSwgYmFzZSkgZWxzZSBwYXJzZUZsb2F0KG51bWJlcilcbiAgICAgICAgaWYgbnVtYmVyLmNoYXJBdCgxKSBpbiBbJ2InLCAnbyddXG4gICAgICAgICAgICBudW1iZXIgPSBcIjB4I3tudW1iZXJWYWx1ZS50b1N0cmluZyAxNn1cIlxuXG4gICAgICAgIHRhZyA9IGlmIG51bWJlclZhbHVlIGlzIEluZmluaXR5IHRoZW4gJ0lORklOSVRZJyBlbHNlICdOVU1CRVInXG4gICAgICAgIEB0b2tlbiB0YWcsIG51bWJlciwgMCwgbGV4ZWRMZW5ndGhcbiAgICAgICAgbGV4ZWRMZW5ndGhcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwICAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgIyBNYXRjaGVzIHN0cmluZ3MsIGluY2x1ZGluZyBtdWx0aS1saW5lIHN0cmluZ3MsIGFzIHdlbGwgYXMgaGVyZWRvY3MsIHdpdGggb3Igd2l0aG91dCBpbnRlcnBvbGF0aW9uLlxuICAgIFxuICAgIHN0cmluZ1Rva2VuOiAtPlxuICAgICAgICBbcXVvdGVdID0gU1RSSU5HX1NUQVJULmV4ZWMoQGNodW5rKSB8fCBbXVxuICAgICAgICByZXR1cm4gMCB1bmxlc3MgcXVvdGVcblxuICAgICAgICAjIElmIHRoZSBwcmVjZWRpbmcgdG9rZW4gaXMgYGZyb21gIGFuZCB0aGlzIGlzIGFuIGltcG9ydCBvciBleHBvcnQgc3RhdGVtZW50LCBwcm9wZXJseSB0YWcgdGhlIGBmcm9tYC5cbiAgICAgICAgXG4gICAgICAgIGlmIEB0b2tlbnMubGVuZ3RoIGFuZCBAdmFsdWUoKSBpcyAnZnJvbScgYW5kIChAc2VlbkltcG9ydCBvciBAc2VlbkV4cG9ydClcbiAgICAgICAgICAgIEB0b2tlbnNbQHRva2Vucy5sZW5ndGggLSAxXVswXSA9ICdGUk9NJ1xuXG4gICAgICAgIHJlZ2V4ID0gc3dpdGNoIHF1b3RlXG4gICAgICAgICAgICB3aGVuIFwiJ1wiICAgdGhlbiBTVFJJTkdfU0lOR0xFXG4gICAgICAgICAgICB3aGVuICdcIicgICB0aGVuIFNUUklOR19ET1VCTEVcbiAgICAgICAgICAgIHdoZW4gXCInJydcIiB0aGVuIEhFUkVET0NfU0lOR0xFXG4gICAgICAgICAgICB3aGVuICdcIlwiXCInIHRoZW4gSEVSRURPQ19ET1VCTEVcbiAgICAgICAgaGVyZWRvYyA9IHF1b3RlLmxlbmd0aCBpcyAzXG5cbiAgICAgICAge3Rva2VucywgaW5kZXg6IGVuZH0gPSBAbWF0Y2hXaXRoSW50ZXJwb2xhdGlvbnMgcmVnZXgsIHF1b3RlXG4gICAgICAgICQgPSB0b2tlbnMubGVuZ3RoIC0gMVxuXG4gICAgICAgIGRlbGltaXRlciA9IHF1b3RlLmNoYXJBdCgwKVxuICAgICAgICBpZiBoZXJlZG9jXG4gICAgICAgICAgICAjIEZpbmQgdGhlIHNtYWxsZXN0IGluZGVudGF0aW9uLiBJdCB3aWxsIGJlIHJlbW92ZWQgZnJvbSBhbGwgbGluZXMgbGF0ZXIuXG4gICAgICAgICAgICBpbmRlbnQgPSBudWxsXG4gICAgICAgICAgICBkb2MgPSAodG9rZW5bMV0gZm9yIHRva2VuLCBpIGluIHRva2VucyB3aGVuIHRva2VuWzBdIGlzICdORU9TVFJJTkcnKS5qb2luICcje30nXG4gICAgICAgICAgICB3aGlsZSBtYXRjaCA9IEhFUkVET0NfSU5ERU5ULmV4ZWMgZG9jXG4gICAgICAgICAgICAgICAgYXR0ZW1wdCA9IG1hdGNoWzFdXG4gICAgICAgICAgICAgICAgaW5kZW50ID0gYXR0ZW1wdCBpZiBpbmRlbnQgaXMgbnVsbCBvciAwIDwgYXR0ZW1wdC5sZW5ndGggPCBpbmRlbnQubGVuZ3RoXG4gICAgICAgICAgICBpbmRlbnRSZWdleCA9IC8vLyBcXG4je2luZGVudH0gLy8vZyBpZiBpbmRlbnRcbiAgICAgICAgICAgIEBtZXJnZUludGVycG9sYXRpb25Ub2tlbnMgdG9rZW5zLCB7ZGVsaW1pdGVyfSwgKHZhbHVlLCBpKSA9PlxuICAgICAgICAgICAgICAgIHZhbHVlID0gQGZvcm1hdFN0cmluZyB2YWx1ZSwgZGVsaW1pdGVyOiBxdW90ZVxuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZSBpbmRlbnRSZWdleCwgJ1xcbicgaWYgaW5kZW50UmVnZXhcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UgTEVBRElOR19CTEFOS19MSU5FLCAgICAnJyBpZiBpIGlzIDBcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UgVFJBSUxJTkdfQkxBTktfTElORSwgJycgaWYgaSBpcyAkXG4gICAgICAgICAgICAgICAgdmFsdWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQG1lcmdlSW50ZXJwb2xhdGlvblRva2VucyB0b2tlbnMsIHtkZWxpbWl0ZXJ9LCAodmFsdWUsIGkpID0+XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBAZm9ybWF0U3RyaW5nIHZhbHVlLCBkZWxpbWl0ZXI6IHF1b3RlXG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlIFNJTVBMRV9TVFJJTkdfT01JVCwgKG1hdGNoLCBvZmZzZXQpIC0+XG4gICAgICAgICAgICAgICAgICAgIGlmIChpIGlzIDAgYW5kIG9mZnNldCBpcyAwKSBvclxuICAgICAgICAgICAgICAgICAgICAgICAgIChpIGlzICQgYW5kIG9mZnNldCArIG1hdGNoLmxlbmd0aCBpcyB2YWx1ZS5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAnJ1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAnICdcbiAgICAgICAgICAgICAgICB2YWx1ZVxuICAgICAgICBlbmRcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBjb21tZW50VG9rZW46IC0+XG4gICAgICAgIHJldHVybiAwIHVubGVzcyBtYXRjaCA9IEBjaHVuay5tYXRjaCBDT01NRU5UXG4gICAgICAgIFtjb21tZW50LCBoZXJlXSA9IG1hdGNoXG4gICAgICAgIGlmIGhlcmVcbiAgICAgICAgICAgIGlmIG1hdGNoID0gSEVSRUNPTU1FTlRfSUxMRUdBTC5leGVjIGNvbW1lbnRcbiAgICAgICAgICAgICAgICBAZXJyb3IgXCJibG9jayBjb21tZW50cyBjYW5ub3QgY29udGFpbiAje21hdGNoWzBdfVwiLFxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IG1hdGNoLmluZGV4LCBsZW5ndGg6IG1hdGNoWzBdLmxlbmd0aFxuICAgICAgICAgICAgaWYgaGVyZS5pbmRleE9mKCdcXG4nKSA+PSAwXG4gICAgICAgICAgICAgICAgaGVyZSA9IGhlcmUucmVwbGFjZSAvLy8gXFxuICN7cmVwZWF0ICcgJywgQGluZGVudH0gLy8vZywgJ1xcbidcbiAgICAgICAgICAgIEB0b2tlbiAnSEVSRUNPTU1FTlQnLCBoZXJlLCAwLCBjb21tZW50Lmxlbmd0aFxuICAgICAgICBjb21tZW50Lmxlbmd0aFxuXG4gICAgIyAgICAgICAwMDAgICAwMDAwMDAwICBcbiAgICAjICAgICAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgICAgICAgMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgICAgICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgICMgTWF0Y2hlcyBKYXZhU2NyaXB0IGludGVycG9sYXRlZCBkaXJlY3RseSBpbnRvIHRoZSBzb3VyY2UgdmlhIGJhY2t0aWNrcy5cbiAgICBcbiAgICBqc1Rva2VuOiAtPlxuICAgICAgICByZXR1cm4gMCB1bmxlc3MgQGNodW5rLmNoYXJBdCgwKSBpcyAnYCcgYW5kXG4gICAgICAgICAgICAobWF0Y2ggPSBIRVJFX0pTVE9LRU4uZXhlYyhAY2h1bmspIG9yIEpTVE9LRU4uZXhlYyhAY2h1bmspKVxuICAgICAgICAjIENvbnZlcnQgZXNjYXBlZCBiYWNrdGlja3MgdG8gYmFja3RpY2tzLCBhbmQgZXNjYXBlZCBiYWNrc2xhc2hlc1xuICAgICAgICAjIGp1c3QgYmVmb3JlIGVzY2FwZWQgYmFja3RpY2tzIHRvIGJhY2tzbGFzaGVzXG4gICAgICAgIHNjcmlwdCA9IG1hdGNoWzFdLnJlcGxhY2UgL1xcXFwrKGB8JCkvZywgKHN0cmluZykgLT5cbiAgICAgICAgICAgICMgYHN0cmluZ2AgaXMgYWx3YXlzIGEgdmFsdWUgbGlrZSAnXFxgJywgJ1xcXFxcXGAnLCAnXFxcXFxcXFxcXGAnLCBldGMuXG4gICAgICAgICAgICAjIEJ5IHJlZHVjaW5nIGl0IHRvIGl0cyBsYXR0ZXIgaGFsZiwgd2UgdHVybiAnXFxgJyB0byAnYCcsICdcXFxcXFxgJyB0byAnXFxgJywgZXRjLlxuICAgICAgICAgICAgc3RyaW5nWy1NYXRoLmNlaWwoc3RyaW5nLmxlbmd0aCAvIDIpLi5dXG4gICAgICAgIEB0b2tlbiAnSlMnLCBzY3JpcHQsIDAsIG1hdGNoWzBdLmxlbmd0aFxuICAgICAgICBtYXRjaFswXS5sZW5ndGhcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgIDAwMDAgIDAwMDAwMDAgICAgIDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgIyBNYXRjaGVzIHJlZ3VsYXIgZXhwcmVzc2lvbiBsaXRlcmFscywgYXMgd2VsbCBhcyBtdWx0aWxpbmUgZXh0ZW5kZWQgb25lcy5cbiAgICAjIExleGluZyByZWd1bGFyIGV4cHJlc3Npb25zIGlzIGRpZmZpY3VsdCB0byBkaXN0aW5ndWlzaCBmcm9tIGRpdmlzaW9uLCBcbiAgICAjIHNvIHdlIGJvcnJvdyBzb21lIGJhc2ljIGhldXJpc3RpY3MgZnJvbSBKYXZhU2NyaXB0IGFuZCBSdWJ5LlxuICAgIFxuICAgIHJlZ2V4VG9rZW46IC0+XG4gICAgICAgIHN3aXRjaFxuICAgICAgICAgICAgd2hlbiBtYXRjaCA9IFJFR0VYX0lMTEVHQUwuZXhlYyBAY2h1bmtcbiAgICAgICAgICAgICAgICBAZXJyb3IgXCJyZWd1bGFyIGV4cHJlc3Npb25zIGNhbm5vdCBiZWdpbiB3aXRoICN7bWF0Y2hbMl19XCIsXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldDogbWF0Y2guaW5kZXggKyBtYXRjaFsxXS5sZW5ndGhcbiAgICAgICAgICAgIHdoZW4gbWF0Y2ggPSBAbWF0Y2hXaXRoSW50ZXJwb2xhdGlvbnMgSEVSRUdFWCwgJy8vLydcbiAgICAgICAgICAgICAgICB7dG9rZW5zLCBpbmRleH0gPSBtYXRjaFxuICAgICAgICAgICAgd2hlbiBtYXRjaCA9IFJFR0VYLmV4ZWMgQGNodW5rXG4gICAgICAgICAgICAgICAgW3JlZ2V4LCBib2R5LCBjbG9zZWRdID0gbWF0Y2hcbiAgICAgICAgICAgICAgICBAdmFsaWRhdGVFc2NhcGVzIGJvZHksIGlzUmVnZXg6IHllcywgb2Zmc2V0SW5DaHVuazogMVxuICAgICAgICAgICAgICAgIGJvZHkgPSBAZm9ybWF0UmVnZXggYm9keSwgZGVsaW1pdGVyOiAnLydcbiAgICAgICAgICAgICAgICBpbmRleCA9IHJlZ2V4Lmxlbmd0aFxuICAgICAgICAgICAgICAgIFsuLi4sIHByZXZdID0gQHRva2Vuc1xuICAgICAgICAgICAgICAgIGlmIHByZXZcbiAgICAgICAgICAgICAgICAgICAgaWYgcHJldi5zcGFjZWQgYW5kIHByZXZbMF0gaW4gQ0FMTEFCTEVcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAwIGlmIG5vdCBjbG9zZWQgb3IgUE9TU0lCTFlfRElWSVNJT04udGVzdCByZWdleFxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIHByZXZbMF0gaW4gTk9UX1JFR0VYXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMFxuICAgICAgICAgICAgICAgIEBlcnJvciAnbWlzc2luZyAvICh1bmNsb3NlZCByZWdleCknIHVubGVzcyBjbG9zZWRcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gMFxuXG4gICAgICAgIFtmbGFnc10gPSBSRUdFWF9GTEFHUy5leGVjIEBjaHVua1tpbmRleC4uXVxuICAgICAgICBlbmQgPSBpbmRleCArIGZsYWdzLmxlbmd0aFxuICAgICAgICBvcmlnaW4gPSBAbWFrZVRva2VuICdSRUdFWCcsIG51bGwsIDAsIGVuZFxuICAgICAgICBzd2l0Y2hcbiAgICAgICAgICAgIHdoZW4gbm90IFZBTElEX0ZMQUdTLnRlc3QgZmxhZ3NcbiAgICAgICAgICAgICAgICBAZXJyb3IgXCJpbnZhbGlkIHJlZ3VsYXIgZXhwcmVzc2lvbiBmbGFncyAje2ZsYWdzfVwiLCBvZmZzZXQ6IGluZGV4LCBsZW5ndGg6IGZsYWdzLmxlbmd0aFxuICAgICAgICAgICAgd2hlbiByZWdleCBvciB0b2tlbnMubGVuZ3RoIGlzIDFcbiAgICAgICAgICAgICAgICBib2R5ID89IEBmb3JtYXRIZXJlZ2V4IHRva2Vuc1swXVsxXVxuICAgICAgICAgICAgICAgIEB0b2tlbiAnUkVHRVgnLCBcIiN7QG1ha2VEZWxpbWl0ZWRMaXRlcmFsIGJvZHksIGRlbGltaXRlcjogJy8nfSN7ZmxhZ3N9XCIsIDAsIGVuZCwgb3JpZ2luXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHRva2VuICdSRUdFWF9TVEFSVCcsICcoJywgMCwgMCwgb3JpZ2luXG4gICAgICAgICAgICAgICAgQHRva2VuICdJREVOVElGSUVSJywgJ1JlZ0V4cCcsIDAsIDBcbiAgICAgICAgICAgICAgICBAdG9rZW4gJ0NBTExfU1RBUlQnLCAnKCcsIDAsIDBcbiAgICAgICAgICAgICAgICBAbWVyZ2VJbnRlcnBvbGF0aW9uVG9rZW5zIHRva2Vucywge2RlbGltaXRlcjogJ1wiJywgZG91YmxlOiB5ZXN9LCBAZm9ybWF0SGVyZWdleFxuICAgICAgICAgICAgICAgIGlmIGZsYWdzXG4gICAgICAgICAgICAgICAgICAgIEB0b2tlbiAnLCcsICcsJywgaW5kZXggLSAxLCAwXG4gICAgICAgICAgICAgICAgICAgIEB0b2tlbiAnU1RSSU5HJywgJ1wiJyArIGZsYWdzICsgJ1wiJywgaW5kZXggLSAxLCBmbGFncy5sZW5ndGhcbiAgICAgICAgICAgICAgICBAdG9rZW4gJyknLCAnKScsIGVuZCAtIDEsIDBcbiAgICAgICAgICAgICAgICBAdG9rZW4gJ1JFR0VYX0VORCcsICcpJywgZW5kIC0gMSwgMFxuXG4gICAgICAgIGVuZFxuXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICAjIE1hdGNoZXMgbmV3bGluZXMsIGluZGVudHMsIGFuZCBvdXRkZW50cywgYW5kIGRldGVybWluZXMgd2hpY2ggaXMgd2hpY2guXG4gICAgIyBJZiB3ZSBjYW4gZGV0ZWN0IHRoYXQgdGhlIGN1cnJlbnQgbGluZSBpcyBjb250aW51ZWQgb250byB0aGUgbmV4dCBsaW5lLFxuICAgICMgdGhlbiB0aGUgbmV3bGluZSBpcyBzdXBwcmVzc2VkOlxuICAgICNcbiAgICAjICAgICAgICAgICBlbGVtZW50c1xuICAgICMgICAgICAgICAgICAgICAuZWFjaCggLi4uIClcbiAgICAjICAgICAgICAgICAgICAgLm1hcCggLi4uIClcbiAgICAjXG4gICAgIyBLZWVwcyB0cmFjayBvZiB0aGUgbGV2ZWwgb2YgaW5kZW50YXRpb24sIGJlY2F1c2UgYSBzaW5nbGUgb3V0ZGVudCB0b2tlblxuICAgICMgY2FuIGNsb3NlIG11bHRpcGxlIGluZGVudHMsIHNvIHdlIG5lZWQgdG8ga25vdyBob3cgZmFyIGluIHdlIGhhcHBlbiB0byBiZS5cbiAgICBcbiAgICBsaW5lVG9rZW46IC0+XG4gICAgICAgIHJldHVybiAwIHVubGVzcyBtYXRjaCA9IE1VTFRJX0RFTlQuZXhlYyBAY2h1bmtcbiAgICAgICAgaW5kZW50ID0gbWF0Y2hbMF1cblxuICAgICAgICBAc2VlbkZvciA9IG5vXG4gICAgICAgIEBzZWVuSW1wb3J0ID0gbm8gdW5sZXNzIEBpbXBvcnRTcGVjaWZpZXJMaXN0XG4gICAgICAgIEBzZWVuRXhwb3J0ID0gbm8gdW5sZXNzIEBleHBvcnRTcGVjaWZpZXJMaXN0XG5cbiAgICAgICAgc2l6ZSA9IGluZGVudC5sZW5ndGggLSAxIC0gaW5kZW50Lmxhc3RJbmRleE9mICdcXG4nXG4gICAgICAgIG5vTmV3bGluZXMgPSBAdW5maW5pc2hlZCgpXG5cbiAgICAgICAgaWYgc2l6ZSAtIEBpbmRlYnQgaXMgQGluZGVudFxuICAgICAgICAgICAgaWYgbm9OZXdsaW5lcyB0aGVuIEBzdXBwcmVzc05ld2xpbmVzKCkgZWxzZSBAbmV3bGluZVRva2VuIDBcbiAgICAgICAgICAgIHJldHVybiBpbmRlbnQubGVuZ3RoXG5cbiAgICAgICAgaWYgc2l6ZSA+IEBpbmRlbnRcbiAgICAgICAgICAgIGlmIG5vTmV3bGluZXNcbiAgICAgICAgICAgICAgICBAaW5kZWJ0ID0gc2l6ZSAtIEBpbmRlbnRcbiAgICAgICAgICAgICAgICBAc3VwcHJlc3NOZXdsaW5lcygpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGluZGVudC5sZW5ndGhcbiAgICAgICAgICAgIHVubGVzcyBAdG9rZW5zLmxlbmd0aFxuICAgICAgICAgICAgICAgIEBiYXNlSW5kZW50ID0gQGluZGVudCA9IHNpemVcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5kZW50Lmxlbmd0aFxuICAgICAgICAgICAgZGlmZiA9IHNpemUgLSBAaW5kZW50ICsgQG91dGRlYnRcbiAgICAgICAgICAgIEB0b2tlbiAnSU5ERU5UJywgZGlmZiwgaW5kZW50Lmxlbmd0aCAtIHNpemUsIHNpemVcbiAgICAgICAgICAgIEBpbmRlbnRzLnB1c2ggZGlmZlxuICAgICAgICAgICAgQGVuZHMucHVzaCB7dGFnOiAnT1VUREVOVCd9XG4gICAgICAgICAgICBAb3V0ZGVidCA9IEBpbmRlYnQgPSAwXG4gICAgICAgICAgICBAaW5kZW50ID0gc2l6ZVxuICAgICAgICBlbHNlIGlmIHNpemUgPCBAYmFzZUluZGVudFxuICAgICAgICAgICAgQGVycm9yICdtaXNzaW5nIGluZGVudGF0aW9uJywgb2Zmc2V0OiBpbmRlbnQubGVuZ3RoXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBpbmRlYnQgPSAwXG4gICAgICAgICAgICBAb3V0ZGVudFRva2VuIEBpbmRlbnQgLSBzaXplLCBub05ld2xpbmVzLCBpbmRlbnQubGVuZ3RoXG4gICAgICAgIGluZGVudC5sZW5ndGhcblxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAgICAwMDAgICAgIFxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgICMgUmVjb3JkIGFuIG91dGRlbnQgdG9rZW4gb3IgbXVsdGlwbGUgdG9rZW5zLCBpZiB3ZSBoYXBwZW4gdG8gYmUgbW92aW5nIGJhY2tcbiAgICAjIGlud2FyZHMgcGFzdCBzZXZlcmFsIHJlY29yZGVkIGluZGVudHMuIFNldHMgbmV3IEBpbmRlbnQgdmFsdWUuXG4gICAgXG4gICAgb3V0ZGVudFRva2VuOiAobW92ZU91dCwgbm9OZXdsaW5lcywgb3V0ZGVudExlbmd0aCkgLT5cbiAgICAgICAgZGVjcmVhc2VkSW5kZW50ID0gQGluZGVudCAtIG1vdmVPdXRcbiAgICAgICAgd2hpbGUgbW92ZU91dCA+IDBcbiAgICAgICAgICAgIGxhc3RJbmRlbnQgPSBAaW5kZW50c1tAaW5kZW50cy5sZW5ndGggLSAxXVxuICAgICAgICAgICAgaWYgbm90IGxhc3RJbmRlbnRcbiAgICAgICAgICAgICAgICBtb3ZlT3V0ID0gMFxuICAgICAgICAgICAgZWxzZSBpZiBsYXN0SW5kZW50IGlzIEBvdXRkZWJ0XG4gICAgICAgICAgICAgICAgbW92ZU91dCAtPSBAb3V0ZGVidFxuICAgICAgICAgICAgICAgIEBvdXRkZWJ0ID0gMFxuICAgICAgICAgICAgZWxzZSBpZiBsYXN0SW5kZW50IDwgQG91dGRlYnRcbiAgICAgICAgICAgICAgICBAb3V0ZGVidCAtPSBsYXN0SW5kZW50XG4gICAgICAgICAgICAgICAgbW92ZU91dCAgLT0gbGFzdEluZGVudFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGRlbnQgPSBAaW5kZW50cy5wb3AoKSArIEBvdXRkZWJ0XG4gICAgICAgICAgICAgICAgaWYgb3V0ZGVudExlbmd0aCBhbmQgQGNodW5rW291dGRlbnRMZW5ndGhdIGluIElOREVOVEFCTEVfQ0xPU0VSU1xuICAgICAgICAgICAgICAgICAgICBkZWNyZWFzZWRJbmRlbnQgLT0gZGVudCAtIG1vdmVPdXRcbiAgICAgICAgICAgICAgICAgICAgbW92ZU91dCA9IGRlbnRcbiAgICAgICAgICAgICAgICBAb3V0ZGVidCA9IDBcbiAgICAgICAgICAgICAgICAjIHBhaXIgbWlnaHQgY2FsbCBvdXRkZW50VG9rZW4sIHNvIHByZXNlcnZlIGRlY3JlYXNlZEluZGVudFxuICAgICAgICAgICAgICAgIEBwYWlyICdPVVRERU5UJ1xuICAgICAgICAgICAgICAgIEB0b2tlbiAnT1VUREVOVCcsIG1vdmVPdXQsIDAsIG91dGRlbnRMZW5ndGhcbiAgICAgICAgICAgICAgICBtb3ZlT3V0IC09IGRlbnRcbiAgICAgICAgQG91dGRlYnQgLT0gbW92ZU91dCBpZiBkZW50XG4gICAgICAgIEB0b2tlbnMucG9wKCkgd2hpbGUgQHZhbHVlKCkgaXMgJzsnXG5cbiAgICAgICAgQHRva2VuICdURVJNSU5BVE9SJywgJ1xcbicsIG91dGRlbnRMZW5ndGgsIDAgdW5sZXNzIEB0YWcoKSBpcyAnVEVSTUlOQVRPUicgb3Igbm9OZXdsaW5lc1xuICAgICAgICBAaW5kZW50ID0gZGVjcmVhc2VkSW5kZW50XG4gICAgICAgIHRoaXNcblxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgICAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAgICAgIDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgICMgTWF0Y2hlcyBhbmQgY29uc3VtZXMgbm9uLW1lYW5pbmdmdWwgd2hpdGVzcGFjZS4gVGFnIHRoZSBwcmV2aW91cyB0b2tlblxuICAgICMgYXMgYmVpbmcg4oCcc3BhY2Vk4oCdLCBiZWNhdXNlIHRoZXJlIGFyZSBzb21lIGNhc2VzIHdoZXJlIGl0IG1ha2VzIGEgZGlmZmVyZW5jZS5cbiAgICBcbiAgICB3aGl0ZXNwYWNlVG9rZW46IC0+XG4gICAgICAgIHJldHVybiAwIHVubGVzcyAobWF0Y2ggPSBXSElURVNQQUNFLmV4ZWMgQGNodW5rKSBvciAobmxpbmUgPSBAY2h1bmsuY2hhckF0KDApIGlzICdcXG4nKVxuICAgICAgICBbLi4uLCBwcmV2XSA9IEB0b2tlbnNcbiAgICAgICAgcHJldltpZiBtYXRjaCB0aGVuICdzcGFjZWQnIGVsc2UgJ25ld0xpbmUnXSA9IHRydWUgaWYgcHJldlxuICAgICAgICBpZiBtYXRjaCB0aGVuIG1hdGNoWzBdLmxlbmd0aCBlbHNlIDBcblxuICAgICMgR2VuZXJhdGUgYSBuZXdsaW5lIHRva2VuLiBDb25zZWN1dGl2ZSBuZXdsaW5lcyBnZXQgbWVyZ2VkIHRvZ2V0aGVyLlxuICAgIFxuICAgIG5ld2xpbmVUb2tlbjogKG9mZnNldCkgLT5cbiAgICAgICAgQHRva2Vucy5wb3AoKSB3aGlsZSBAdmFsdWUoKSBpcyAnOydcbiAgICAgICAgQHRva2VuICdURVJNSU5BVE9SJywgJ1xcbicsIG9mZnNldCwgMCB1bmxlc3MgQHRhZygpIGlzICdURVJNSU5BVE9SJ1xuICAgICAgICB0aGlzXG5cbiAgICAjIFVzZSBhIGBcXGAgYXQgYSBsaW5lLWVuZGluZyB0byBzdXBwcmVzcyB0aGUgbmV3bGluZS5cbiAgICAjIFRoZSBzbGFzaCBpcyByZW1vdmVkIGhlcmUgb25jZSBpdHMgam9iIGlzIGRvbmUuXG4gICAgXG4gICAgc3VwcHJlc3NOZXdsaW5lczogLT5cbiAgICAgICAgQHRva2Vucy5wb3AoKSBpZiBAdmFsdWUoKSBpcyAnXFxcXCdcbiAgICAgICAgdGhpc1xuXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIFxuICAgICMgMDAwICAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAgICAgXG4gICAgIyAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICBcbiAgICAjIDAwMDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgIFxuICAgIFxuICAgICMgV2UgdHJlYXQgYWxsIG90aGVyIHNpbmdsZSBjaGFyYWN0ZXJzIGFzIGEgdG9rZW4uIEUuZy46IGAoICkgLCAuICFgXG4gICAgIyBNdWx0aS1jaGFyYWN0ZXIgb3BlcmF0b3JzIGFyZSBhbHNvIGxpdGVyYWwgdG9rZW5zLCBzbyB0aGF0IEppc29uIGNhbiBhc3NpZ25cbiAgICAjIHRoZSBwcm9wZXIgb3JkZXIgb2Ygb3BlcmF0aW9ucy4gVGhlcmUgYXJlIHNvbWUgc3ltYm9scyB0aGF0IHdlIHRhZyBzcGVjaWFsbHlcbiAgICAjIGhlcmUuIGA7YCBhbmQgbmV3bGluZXMgYXJlIGJvdGggdHJlYXRlZCBhcyBhIGBURVJNSU5BVE9SYCwgd2UgZGlzdGluZ3Vpc2hcbiAgICAjIHBhcmVudGhlc2VzIHRoYXQgaW5kaWNhdGUgYSBtZXRob2QgY2FsbCBmcm9tIHJlZ3VsYXIgcGFyZW50aGVzZXMsIGFuZCBzbyBvbi5cbiAgICBcbiAgICBsaXRlcmFsVG9rZW46IC0+XG4gICAgICAgIGlmIG1hdGNoID0gT1BFUkFUT1IuZXhlYyBAY2h1bmtcbiAgICAgICAgICAgIFt2YWx1ZV0gPSBtYXRjaFxuICAgICAgICAgICAgQHRhZ1BhcmFtZXRlcnMoKSBpZiBDT0RFLnRlc3QgdmFsdWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdmFsdWUgPSBAY2h1bmsuY2hhckF0IDBcbiAgICAgICAgdGFnICA9IHZhbHVlXG4gICAgICAgIFsuLi4sIHByZXZdID0gQHRva2Vuc1xuXG4gICAgICAgIGlmIHByZXYgYW5kIHZhbHVlIGluIFsnPScsIENPTVBPVU5EX0FTU0lHTi4uLl1cbiAgICAgICAgICAgIHNraXBUb2tlbiA9IGZhbHNlXG4gICAgICAgICAgICBpZiB2YWx1ZSBpcyAnPScgYW5kIHByZXZbMV0gaW4gWyd8fCcsICcmJiddIGFuZCBub3QgcHJldi5zcGFjZWRcbiAgICAgICAgICAgICAgICBwcmV2WzBdID0gJ0NPTVBPVU5EX0FTU0lHTidcbiAgICAgICAgICAgICAgICBwcmV2WzFdICs9ICc9J1xuICAgICAgICAgICAgICAgIHByZXYgPSBAdG9rZW5zW0B0b2tlbnMubGVuZ3RoIC0gMl1cbiAgICAgICAgICAgICAgICBza2lwVG9rZW4gPSB0cnVlXG4gICAgICAgICAgICBpZiBwcmV2IGFuZCBwcmV2WzBdICE9ICdQUk9QRVJUWSdcbiAgICAgICAgICAgICAgICBvcmlnaW4gPSBwcmV2Lm9yaWdpbiA/IHByZXZcbiAgICAgICAgICAgICAgICBtZXNzYWdlID0gaXNVbmFzc2lnbmFibGUgcHJldlsxXSwgb3JpZ2luWzFdXG4gICAgICAgICAgICAgICAgQGVycm9yIG1lc3NhZ2UsIG9yaWdpblsyXSBpZiBtZXNzYWdlXG4gICAgICAgICAgICByZXR1cm4gdmFsdWUubGVuZ3RoIGlmIHNraXBUb2tlblxuXG4gICAgICAgIGlmIHZhbHVlIGlzICd7JyBhbmQgQHNlZW5JbXBvcnRcbiAgICAgICAgICAgIEBpbXBvcnRTcGVjaWZpZXJMaXN0ID0geWVzXG4gICAgICAgIGVsc2UgaWYgQGltcG9ydFNwZWNpZmllckxpc3QgYW5kIHZhbHVlIGlzICd9J1xuICAgICAgICAgICAgQGltcG9ydFNwZWNpZmllckxpc3QgPSBub1xuICAgICAgICBlbHNlIGlmIHZhbHVlIGlzICd7JyBhbmQgcHJldj9bMF0gaXMgJ0VYUE9SVCdcbiAgICAgICAgICAgIEBleHBvcnRTcGVjaWZpZXJMaXN0ID0geWVzXG4gICAgICAgIGVsc2UgaWYgQGV4cG9ydFNwZWNpZmllckxpc3QgYW5kIHZhbHVlIGlzICd9J1xuICAgICAgICAgICAgQGV4cG9ydFNwZWNpZmllckxpc3QgPSBub1xuXG4gICAgICAgIGlmIHZhbHVlIGlzICc7J1xuICAgICAgICAgICAgQHNlZW5Gb3IgPSBAc2VlbkltcG9ydCA9IEBzZWVuRXhwb3J0ID0gbm9cbiAgICAgICAgICAgIHRhZyA9ICdURVJNSU5BVE9SJ1xuICAgICAgICBlbHNlIGlmIHZhbHVlIGlzICcqJyBhbmQgcHJldlswXSBpcyAnRVhQT1JUJ1xuICAgICAgICAgICAgdGFnID0gJ0VYUE9SVF9BTEwnXG4gICAgICAgIGVsc2UgaWYgdmFsdWUgaW4gTUFUSCAgICAgICAgICAgICAgICAgICB0aGVuIHRhZyA9ICdNQVRIJ1xuICAgICAgICBlbHNlIGlmIHZhbHVlIGluIENPTVBBUkUgICAgICAgICAgICAgICAgdGhlbiB0YWcgPSAnQ09NUEFSRSdcbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpbiBDT01QT1VORF9BU1NJR04gICAgICAgIHRoZW4gdGFnID0gJ0NPTVBPVU5EX0FTU0lHTidcbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpbiBVTkFSWSAgICAgICAgICAgICAgICAgIHRoZW4gdGFnID0gJ1VOQVJZJ1xuICAgICAgICBlbHNlIGlmIHZhbHVlIGluIFVOQVJZX01BVEggICAgICAgICAgICAgdGhlbiB0YWcgPSAnVU5BUllfTUFUSCdcbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpbiBTSElGVCAgICAgICAgICAgICAgICAgIHRoZW4gdGFnID0gJ1NISUZUJ1xuICAgICAgICBlbHNlIGlmIHZhbHVlIGlzICc/JyBhbmQgcHJldj8uc3BhY2VkICAgdGhlbiB0YWcgPSAnQklOPydcbiAgICAgICAgZWxzZSBpZiBwcmV2IGFuZCBub3QgcHJldi5zcGFjZWRcbiAgICAgICAgICAgIGlmIHZhbHVlIGlzICcoJyBhbmQgcHJldlswXSBpbiBDQUxMQUJMRVxuICAgICAgICAgICAgICAgIHByZXZbMF0gPSAnRlVOQ19FWElTVCcgaWYgcHJldlswXSBpcyAnPydcbiAgICAgICAgICAgICAgICB0YWcgPSAnQ0FMTF9TVEFSVCdcbiAgICAgICAgICAgIGVsc2UgaWYgdmFsdWUgaXMgJ1snIGFuZCBwcmV2WzBdIGluIElOREVYQUJMRVxuICAgICAgICAgICAgICAgIHRhZyA9ICdJTkRFWF9TVEFSVCdcbiAgICAgICAgICAgICAgICBzd2l0Y2ggcHJldlswXVxuICAgICAgICAgICAgICAgICAgICB3aGVuICc/JyAgICB0aGVuIHByZXZbMF0gPSAnSU5ERVhfU09BSydcbiAgICAgICAgdG9rZW4gPSBAbWFrZVRva2VuIHRhZywgdmFsdWVcbiAgICAgICAgc3dpdGNoIHZhbHVlXG4gICAgICAgICAgICB3aGVuICcoJywgJ3snLCAnWycgdGhlbiBAZW5kcy5wdXNoIHt0YWc6IFJld3JpdGVyLklOVkVSU0VTW3ZhbHVlXSwgb3JpZ2luOiB0b2tlbn1cbiAgICAgICAgICAgIHdoZW4gJyknLCAnfScsICddJyB0aGVuIEBwYWlyIHZhbHVlXG4gICAgICAgIEB0b2tlbnMucHVzaCB0b2tlblxuICAgICAgICB2YWx1ZS5sZW5ndGhcblxuICAgICMjI1xuICAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIFxuICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIFxuICAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgICMjI1xuICAgIFxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgIyBBIHNvdXJjZSBvZiBhbWJpZ3VpdHkgaW4gb3VyIGdyYW1tYXIgdXNlZCB0byBiZSBwYXJhbWV0ZXIgbGlzdHMgaW4gZnVuY3Rpb25cbiAgICAjIGRlZmluaXRpb25zIHZlcnN1cyBhcmd1bWVudCBsaXN0cyBpbiBmdW5jdGlvbiBjYWxscy4gV2FsayBiYWNrd2FyZHMsIHRhZ2dpbmdcbiAgICAjIHBhcmFtZXRlcnMgc3BlY2lhbGx5IGluIG9yZGVyIHRvIG1ha2UgdGhpbmdzIGVhc2llciBmb3IgdGhlIHBhcnNlci5cbiAgICAgICAgXG4gICAgdGFnUGFyYW1ldGVyczogLT5cbiAgICAgICAgcmV0dXJuIHRoaXMgaWYgQHRhZygpICE9ICcpJ1xuICAgICAgICBzdGFjayA9IFtdXG4gICAgICAgIHt0b2tlbnN9ID0gdGhpc1xuICAgICAgICBpID0gdG9rZW5zLmxlbmd0aFxuICAgICAgICB0b2tlbnNbLS1pXVswXSA9ICdQQVJBTV9FTkQnXG4gICAgICAgIHdoaWxlIHRvayA9IHRva2Vuc1stLWldXG4gICAgICAgICAgICBzd2l0Y2ggdG9rWzBdXG4gICAgICAgICAgICAgICAgd2hlbiAnKSdcbiAgICAgICAgICAgICAgICAgICAgc3RhY2sucHVzaCB0b2tcbiAgICAgICAgICAgICAgICB3aGVuICcoJywgJ0NBTExfU1RBUlQnXG4gICAgICAgICAgICAgICAgICAgIGlmIHN0YWNrLmxlbmd0aCB0aGVuIHN0YWNrLnBvcCgpXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgdG9rWzBdIGlzICcoJ1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9rWzBdID0gJ1BBUkFNX1NUQVJUJ1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNcbiAgICAgICAgICAgICAgICAgICAgZWxzZSByZXR1cm4gdGhpc1xuICAgICAgICB0aGlzXG5cbiAgICAjIENsb3NlIHVwIGFsbCByZW1haW5pbmcgb3BlbiBibG9ja3MgYXQgdGhlIGVuZCBvZiB0aGUgZmlsZS5cbiAgICBcbiAgICBjbG9zZUluZGVudGF0aW9uOiAtPlxuICAgICAgICBAb3V0ZGVudFRva2VuIEBpbmRlbnRcblxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICAjIE1hdGNoIHRoZSBjb250ZW50cyBvZiBhIGRlbGltaXRlZCB0b2tlbiBhbmQgZXhwYW5kIHZhcmlhYmxlcyBhbmQgZXhwcmVzc2lvbnNcbiAgICAjIGluc2lkZSBpdCB1c2luZyBSdWJ5LWxpa2Ugbm90YXRpb24gZm9yIHN1YnN0aXR1dGlvbiBvZiBhcmJpdHJhcnkgZXhwcmVzc2lvbnMuXG4gICAgI1xuICAgICMgICAgXCJIZWxsbyAje25hbWUuY2FwaXRhbGl6ZSgpfS5cIlxuICAgICNcbiAgICAjIElmIGl0IGVuY291bnRlcnMgYW4gaW50ZXJwb2xhdGlvbiwgdGhpcyBtZXRob2Qgd2lsbCByZWN1cnNpdmVseSBjcmVhdGUgYSBuZXdcbiAgICAjIExleGVyIGFuZCB0b2tlbml6ZSB1bnRpbCB0aGUgYHtgIG9mIGAje2AgaXMgYmFsYW5jZWQgd2l0aCBhIGB9YC5cbiAgICAjXG4gICAgIyAgICAtIGByZWdleGAgbWF0Y2hlcyB0aGUgY29udGVudHMgb2YgYSB0b2tlbiAoYnV0IG5vdCBgZGVsaW1pdGVyYCwgYW5kIG5vdFxuICAgICMgICAgICAgIGAje2AgaWYgaW50ZXJwb2xhdGlvbnMgYXJlIGRlc2lyZWQpLlxuICAgICMgICAgLSBgZGVsaW1pdGVyYCBpcyB0aGUgZGVsaW1pdGVyIG9mIHRoZSB0b2tlbi4gRXhhbXBsZXMgYXJlIGAnYCwgYFwiYCwgYCcnJ2AsXG4gICAgIyAgICAgICAgYFwiXCJcImAgYW5kIGAvLy9gLlxuICAgICNcbiAgICAjIFRoaXMgbWV0aG9kIGFsbG93cyB1cyB0byBoYXZlIHN0cmluZ3Mgd2l0aGluIGludGVycG9sYXRpb25zIHdpdGhpbiBzdHJpbmdzLCBhZCBpbmZpbml0dW0uXG4gICAgXG4gICAgbWF0Y2hXaXRoSW50ZXJwb2xhdGlvbnM6IChyZWdleCwgZGVsaW1pdGVyKSAtPlxuICAgICAgICBcbiAgICAgICAgdG9rZW5zID0gW11cbiAgICAgICAgb2Zmc2V0SW5DaHVuayA9IGRlbGltaXRlci5sZW5ndGhcbiAgICAgICAgcmV0dXJuIG51bGwgdW5sZXNzIEBjaHVua1suLi5vZmZzZXRJbkNodW5rXSBpcyBkZWxpbWl0ZXJcbiAgICAgICAgc3RyID0gQGNodW5rW29mZnNldEluQ2h1bmsuLl1cbiAgICAgICAgbG9vcFxuICAgICAgICAgICAgW3N0clBhcnRdID0gcmVnZXguZXhlYyBzdHJcblxuICAgICAgICAgICAgQHZhbGlkYXRlRXNjYXBlcyBzdHJQYXJ0LCB7aXNSZWdleDogZGVsaW1pdGVyLmNoYXJBdCgwKSBpcyAnLycsIG9mZnNldEluQ2h1bmt9XG5cbiAgICAgICAgICAgICMgUHVzaCBhIGZha2UgJ05FT1NUUklORycgdG9rZW4sIHdoaWNoIHdpbGwgZ2V0IHR1cm5lZCBpbnRvIGEgcmVhbCBzdHJpbmcgbGF0ZXIuXG4gICAgICAgICAgICB0b2tlbnMucHVzaCBAbWFrZVRva2VuICdORU9TVFJJTkcnLCBzdHJQYXJ0LCBvZmZzZXRJbkNodW5rXG5cbiAgICAgICAgICAgIHN0ciA9IHN0cltzdHJQYXJ0Lmxlbmd0aC4uXVxuICAgICAgICAgICAgb2Zmc2V0SW5DaHVuayArPSBzdHJQYXJ0Lmxlbmd0aFxuXG4gICAgICAgICAgICBicmVhayB1bmxlc3Mgc3RyWy4uLjJdIGlzICcjeydcblxuICAgICAgICAgICAgIyBUaGUgYDFgcyBhcmUgdG8gcmVtb3ZlIHRoZSBgI2AgaW4gYCN7YC5cbiAgICAgICAgICAgIFtsaW5lLCBjb2x1bW5dID0gQGdldExpbmVBbmRDb2x1bW5Gcm9tQ2h1bmsgb2Zmc2V0SW5DaHVuayArIDFcbiAgICAgICAgICAgIHt0b2tlbnM6IG5lc3RlZCwgaW5kZXh9ID1cbiAgICAgICAgICAgICAgICBuZXcgTGV4ZXIoKS50b2tlbml6ZSBzdHJbMS4uXSwgbGluZTogbGluZSwgY29sdW1uOiBjb2x1bW4sIHVudGlsQmFsYW5jZWQ6IG9uXG4gICAgICAgICAgICAjIFNraXAgdGhlIHRyYWlsaW5nIGB9YC5cbiAgICAgICAgICAgIGluZGV4ICs9IDFcblxuICAgICAgICAgICAgIyBUdXJuIHRoZSBsZWFkaW5nIGFuZCB0cmFpbGluZyBge2AgYW5kIGB9YCBpbnRvIHBhcmVudGhlc2VzLiBVbm5lY2Vzc2FyeVxuICAgICAgICAgICAgIyBwYXJlbnRoZXNlcyB3aWxsIGJlIHJlbW92ZWQgbGF0ZXIuXG4gICAgICAgICAgICBbb3BlbiwgLi4uLCBjbG9zZV0gPSBuZXN0ZWRcbiAgICAgICAgICAgIG9wZW5bMF0gID0gb3BlblsxXSAgPSAnKCdcbiAgICAgICAgICAgIGNsb3NlWzBdID0gY2xvc2VbMV0gPSAnKSdcbiAgICAgICAgICAgIGNsb3NlLm9yaWdpbiA9IFsnJywgJ2VuZCBvZiBpbnRlcnBvbGF0aW9uJywgY2xvc2VbMl1dXG5cbiAgICAgICAgICAgICMgUmVtb3ZlIGxlYWRpbmcgJ1RFUk1JTkFUT1InIChpZiBhbnkpLlxuICAgICAgICAgICAgbmVzdGVkLnNwbGljZSAxLCAxIGlmIG5lc3RlZFsxXT9bMF0gaXMgJ1RFUk1JTkFUT1InXG5cbiAgICAgICAgICAgICMgUHVzaCBhIGZha2UgJ1RPS0VOUycgdG9rZW4sIHdoaWNoIHdpbGwgZ2V0IHR1cm5lZCBpbnRvIHJlYWwgdG9rZW5zIGxhdGVyLlxuICAgICAgICAgICAgdG9rZW5zLnB1c2ggWydUT0tFTlMnLCBuZXN0ZWRdXG5cbiAgICAgICAgICAgIHN0ciA9IHN0cltpbmRleC4uXVxuICAgICAgICAgICAgb2Zmc2V0SW5DaHVuayArPSBpbmRleFxuXG4gICAgICAgIHVubGVzcyBzdHJbLi4uZGVsaW1pdGVyLmxlbmd0aF0gaXMgZGVsaW1pdGVyXG4gICAgICAgICAgICBAZXJyb3IgXCJtaXNzaW5nICN7ZGVsaW1pdGVyfVwiLCBsZW5ndGg6IGRlbGltaXRlci5sZW5ndGhcblxuICAgICAgICBbZmlyc3RUb2tlbiwgLi4uLCBsYXN0VG9rZW5dID0gdG9rZW5zXG4gICAgICAgIGZpcnN0VG9rZW5bMl0uZmlyc3RfY29sdW1uIC09IGRlbGltaXRlci5sZW5ndGhcbiAgICAgICAgaWYgbGFzdFRva2VuWzFdLnN1YnN0cigtMSkgaXMgJ1xcbidcbiAgICAgICAgICAgIGxhc3RUb2tlblsyXS5sYXN0X2xpbmUgKz0gMVxuICAgICAgICAgICAgbGFzdFRva2VuWzJdLmxhc3RfY29sdW1uID0gZGVsaW1pdGVyLmxlbmd0aCAtIDFcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbGFzdFRva2VuWzJdLmxhc3RfY29sdW1uICs9IGRlbGltaXRlci5sZW5ndGhcbiAgICAgICAgbGFzdFRva2VuWzJdLmxhc3RfY29sdW1uIC09IDEgaWYgbGFzdFRva2VuWzFdLmxlbmd0aCBpcyAwXG5cbiAgICAgICAge3Rva2VucywgaW5kZXg6IG9mZnNldEluQ2h1bmsgKyBkZWxpbWl0ZXIubGVuZ3RofVxuXG4gICAgIyAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICBcbiAgICAjIE1lcmdlIHRoZSBhcnJheSBgdG9rZW5zYCBvZiB0aGUgZmFrZSB0b2tlbiB0eXBlcyAnVE9LRU5TJyBhbmQgJ05FT1NUUklORycgIChhcyByZXR1cm5lZCBieSBgbWF0Y2hXaXRoSW50ZXJwb2xhdGlvbnNgKSBpbnRvIHRoZSB0b2tlbiBzdHJlYW0uIFxuICAgICMgVGhlIHZhbHVlIG9mICdORU9TVFJJTkcncyBhcmUgY29udmVydGVkIHVzaW5nIGBmbmAgYW5kIHR1cm5lZCBpbnRvIHN0cmluZ3MgdXNpbmcgYG9wdGlvbnNgIGZpcnN0LlxuICAgIFxuICAgIG1lcmdlSW50ZXJwb2xhdGlvblRva2VuczogKHRva2Vucywgb3B0aW9ucywgZm4pIC0+XG4gICAgICAgIGlmIHRva2Vucy5sZW5ndGggPiAxXG4gICAgICAgICAgICBscGFyZW4gPSBAdG9rZW4gJ1NUUklOR19TVEFSVCcsICcoJywgMCwgMFxuXG4gICAgICAgIGZpcnN0SW5kZXggPSBAdG9rZW5zLmxlbmd0aFxuICAgICAgICBmb3IgdG9rZW4sIGkgaW4gdG9rZW5zXG4gICAgICAgICAgICBbdGFnLCB2YWx1ZV0gPSB0b2tlblxuICAgICAgICAgICAgc3dpdGNoIHRhZ1xuICAgICAgICAgICAgICAgIHdoZW4gJ1RPS0VOUydcbiAgICAgICAgICAgICAgICAgICAgIyBPcHRpbWl6ZSBvdXQgZW1wdHkgaW50ZXJwb2xhdGlvbnMgKGFuIGVtcHR5IHBhaXIgb2YgcGFyZW50aGVzZXMpLlxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZSBpZiB2YWx1ZS5sZW5ndGggaXMgMlxuICAgICAgICAgICAgICAgICAgICAjIFB1c2ggYWxsIHRoZSB0b2tlbnMgaW4gdGhlIGZha2UgJ1RPS0VOUycgdG9rZW4uIFxuICAgICAgICAgICAgICAgICAgICAjIFRoZXNlIGFscmVhZHkgaGF2ZSBzYW5lIGxvY2F0aW9uIGRhdGEuXG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uVG9rZW4gPSB2YWx1ZVswXVxuICAgICAgICAgICAgICAgICAgICB0b2tlbnNUb1B1c2ggPSB2YWx1ZVxuICAgICAgICAgICAgICAgIHdoZW4gJ05FT1NUUklORydcbiAgICAgICAgICAgICAgICAgICAgIyBDb252ZXJ0ICdORU9TVFJJTkcnIGludG8gJ1NUUklORycuXG4gICAgICAgICAgICAgICAgICAgIGNvbnZlcnRlZCA9IGZuLmNhbGwgdGhpcywgdG9rZW5bMV0sIGlcbiAgICAgICAgICAgICAgICAgICAgIyBPcHRpbWl6ZSBvdXQgZW1wdHkgc3RyaW5ncy4gV2UgZW5zdXJlIHRoYXQgdGhlIHRva2VucyBzdHJlYW0gYWx3YXlzXG4gICAgICAgICAgICAgICAgICAgICMgc3RhcnRzIHdpdGggYSBzdHJpbmcgdG9rZW4sIHRob3VnaCwgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIHJlc3VsdFxuICAgICAgICAgICAgICAgICAgICAjIHJlYWxseSBpcyBhIHN0cmluZy5cbiAgICAgICAgICAgICAgICAgICAgaWYgY29udmVydGVkLmxlbmd0aCBpcyAwXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBpIGlzIDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaXJzdEVtcHR5U3RyaW5nSW5kZXggPSBAdG9rZW5zLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgICAgICMgSG93ZXZlciwgdGhlcmUgaXMgb25lIGNhc2Ugd2hlcmUgd2UgY2FuIG9wdGltaXplIGF3YXkgYSBzdGFydGluZyBlbXB0eSBzdHJpbmcuXG4gICAgICAgICAgICAgICAgICAgIGlmIGkgaXMgMiBhbmQgZmlyc3RFbXB0eVN0cmluZ0luZGV4P1xuICAgICAgICAgICAgICAgICAgICAgICAgQHRva2Vucy5zcGxpY2UgZmlyc3RFbXB0eVN0cmluZ0luZGV4LCAyICMgUmVtb3ZlIGVtcHR5IHN0cmluZyBhbmQgdGhlIHBsdXMuXG4gICAgICAgICAgICAgICAgICAgIHRva2VuWzBdID0gJ1NUUklORydcbiAgICAgICAgICAgICAgICAgICAgdG9rZW5bMV0gPSBAbWFrZURlbGltaXRlZExpdGVyYWwgY29udmVydGVkLCBvcHRpb25zXG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uVG9rZW4gPSB0b2tlblxuICAgICAgICAgICAgICAgICAgICB0b2tlbnNUb1B1c2ggPSBbdG9rZW5dXG4gICAgICAgICAgICBpZiBAdG9rZW5zLmxlbmd0aCA+IGZpcnN0SW5kZXhcbiAgICAgICAgICAgICAgICAjIENyZWF0ZSBhIDAtbGVuZ3RoIFwiK1wiIHRva2VuLlxuICAgICAgICAgICAgICAgIHBsdXNUb2tlbiA9IEB0b2tlbiAnKycsICcrJ1xuICAgICAgICAgICAgICAgIHBsdXNUb2tlblsyXSA9XG4gICAgICAgICAgICAgICAgICAgIGZpcnN0X2xpbmU6ICAgbG9jYXRpb25Ub2tlblsyXS5maXJzdF9saW5lXG4gICAgICAgICAgICAgICAgICAgIGZpcnN0X2NvbHVtbjogbG9jYXRpb25Ub2tlblsyXS5maXJzdF9jb2x1bW5cbiAgICAgICAgICAgICAgICAgICAgbGFzdF9saW5lOiAgICBsb2NhdGlvblRva2VuWzJdLmZpcnN0X2xpbmVcbiAgICAgICAgICAgICAgICAgICAgbGFzdF9jb2x1bW46ICBsb2NhdGlvblRva2VuWzJdLmZpcnN0X2NvbHVtblxuICAgICAgICAgICAgQHRva2Vucy5wdXNoIHRva2Vuc1RvUHVzaC4uLlxuXG4gICAgICAgIGlmIGxwYXJlblxuICAgICAgICAgICAgWy4uLiwgbGFzdFRva2VuXSA9IHRva2Vuc1xuICAgICAgICAgICAgbHBhcmVuLm9yaWdpbiA9IFsnU1RSSU5HJywgbnVsbCxcbiAgICAgICAgICAgICAgICBmaXJzdF9saW5lOiAgIGxwYXJlblsyXS5maXJzdF9saW5lXG4gICAgICAgICAgICAgICAgZmlyc3RfY29sdW1uOiBscGFyZW5bMl0uZmlyc3RfY29sdW1uXG4gICAgICAgICAgICAgICAgbGFzdF9saW5lOiAgICBsYXN0VG9rZW5bMl0ubGFzdF9saW5lXG4gICAgICAgICAgICAgICAgbGFzdF9jb2x1bW46ICBsYXN0VG9rZW5bMl0ubGFzdF9jb2x1bW5cbiAgICAgICAgICAgIF1cbiAgICAgICAgICAgIHJwYXJlbiA9IEB0b2tlbiAnU1RSSU5HX0VORCcsICcpJ1xuICAgICAgICAgICAgcnBhcmVuWzJdID1cbiAgICAgICAgICAgICAgICBmaXJzdF9saW5lOiAgIGxhc3RUb2tlblsyXS5sYXN0X2xpbmVcbiAgICAgICAgICAgICAgICBmaXJzdF9jb2x1bW46IGxhc3RUb2tlblsyXS5sYXN0X2NvbHVtblxuICAgICAgICAgICAgICAgIGxhc3RfbGluZTogICAgbGFzdFRva2VuWzJdLmxhc3RfbGluZVxuICAgICAgICAgICAgICAgIGxhc3RfY29sdW1uOiAgbGFzdFRva2VuWzJdLmxhc3RfY29sdW1uXG5cbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgICMgUGFpcnMgdXAgYSBjbG9zaW5nIHRva2VuLCBlbnN1cmluZyB0aGF0IGFsbCBsaXN0ZWQgcGFpcnMgb2YgdG9rZW5zIGFyZVxuICAgICMgY29ycmVjdGx5IGJhbGFuY2VkIHRocm91Z2hvdXQgdGhlIGNvdXJzZSBvZiB0aGUgdG9rZW4gc3RyZWFtLlxuICAgIFxuICAgIHBhaXI6ICh0YWcpIC0+XG4gICAgICAgIFsuLi4sIHByZXZdID0gQGVuZHNcbiAgICAgICAgdW5sZXNzIHRhZyBpcyB3YW50ZWQgPSBwcmV2Py50YWdcbiAgICAgICAgICAgIEBlcnJvciBcInVubWF0Y2hlZCAje3RhZ31cIiB1bmxlc3MgJ09VVERFTlQnIGlzIHdhbnRlZFxuICAgICAgICAgICAgIyBBdXRvLWNsb3NlIElOREVOVCB0byBzdXBwb3J0IHN5bnRheCBsaWtlIHRoaXM6XG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjICAgICBlbC5jbGljaygoZXZlbnQpIC0+XG4gICAgICAgICAgICAjICAgICAgICAgZWwuaGlkZSgpKVxuICAgICAgICAgICAgWy4uLiwgbGFzdEluZGVudF0gPSBAaW5kZW50c1xuICAgICAgICAgICAgQG91dGRlbnRUb2tlbiBsYXN0SW5kZW50LCB0cnVlXG4gICAgICAgICAgICByZXR1cm4gQHBhaXIgdGFnXG4gICAgICAgIEBlbmRzLnBvcCgpXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG5cbiAgICAjIFJldHVybnMgdGhlIGxpbmUgYW5kIGNvbHVtbiBudW1iZXIgZnJvbSBhbiBvZmZzZXQgaW50byB0aGUgY3VycmVudCBjaHVuay5cbiAgICAjXG4gICAgIyBgb2Zmc2V0YCBpcyBhIG51bWJlciBvZiBjaGFyYWN0ZXJzIGludG8gQGNodW5rLlxuICAgIFxuICAgIGdldExpbmVBbmRDb2x1bW5Gcm9tQ2h1bms6IChvZmZzZXQpIC0+XG4gICAgICAgIGlmIG9mZnNldCBpcyAwXG4gICAgICAgICAgICByZXR1cm4gW0BjaHVua0xpbmUsIEBjaHVua0NvbHVtbl1cblxuICAgICAgICBpZiBvZmZzZXQgPj0gQGNodW5rLmxlbmd0aFxuICAgICAgICAgICAgc3RyaW5nID0gQGNodW5rXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHN0cmluZyA9IEBjaHVua1suLm9mZnNldC0xXVxuXG4gICAgICAgIGxpbmVDb3VudCA9IGNvdW50IHN0cmluZywgJ1xcbidcblxuICAgICAgICBjb2x1bW4gPSBAY2h1bmtDb2x1bW5cbiAgICAgICAgaWYgbGluZUNvdW50ID4gMFxuICAgICAgICAgICAgWy4uLiwgbGFzdExpbmVdID0gc3RyaW5nLnNwbGl0ICdcXG4nXG4gICAgICAgICAgICBjb2x1bW4gPSBsYXN0TGluZS5sZW5ndGhcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgY29sdW1uICs9IHN0cmluZy5sZW5ndGhcblxuICAgICAgICBbQGNodW5rTGluZSArIGxpbmVDb3VudCwgY29sdW1uXVxuXG4gICAgIyAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAwICAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAwICBcbiAgICAjICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgICMgU2FtZSBhcyBcInRva2VuXCIsIGV4Y2VwdGlvbiB0aGlzIGp1c3QgcmV0dXJucyB0aGUgdG9rZW4gd2l0aG91dCBhZGRpbmcgaXQgdG8gdGhlIHJlc3VsdHMuXG4gICAgXG4gICAgbWFrZVRva2VuOiAodGFnLCB2YWx1ZSwgb2Zmc2V0SW5DaHVuayA9IDAsIGxlbmd0aCA9IHZhbHVlLmxlbmd0aCkgLT5cbiAgICAgICAgbG9jYXRpb25EYXRhID0ge31cbiAgICAgICAgW2xvY2F0aW9uRGF0YS5maXJzdF9saW5lLCBsb2NhdGlvbkRhdGEuZmlyc3RfY29sdW1uXSA9XG4gICAgICAgICAgICBAZ2V0TGluZUFuZENvbHVtbkZyb21DaHVuayBvZmZzZXRJbkNodW5rXG5cbiAgICAgICAgIyBVc2UgbGVuZ3RoIC0gMSBmb3IgdGhlIGZpbmFsIG9mZnNldCAtIHdlJ3JlIHN1cHBseWluZyB0aGUgbGFzdF9saW5lIGFuZCB0aGUgbGFzdF9jb2x1bW4sXG4gICAgICAgICMgc28gaWYgbGFzdF9jb2x1bW4gPT0gZmlyc3RfY29sdW1uLCB0aGVuIHdlJ3JlIGxvb2tpbmcgYXQgYSBjaGFyYWN0ZXIgb2YgbGVuZ3RoIDEuXG4gICAgICAgIGxhc3RDaGFyYWN0ZXIgPSBpZiBsZW5ndGggPiAwIHRoZW4gKGxlbmd0aCAtIDEpIGVsc2UgMFxuICAgICAgICBbbG9jYXRpb25EYXRhLmxhc3RfbGluZSwgbG9jYXRpb25EYXRhLmxhc3RfY29sdW1uXSA9XG4gICAgICAgICAgICBAZ2V0TGluZUFuZENvbHVtbkZyb21DaHVuayBvZmZzZXRJbkNodW5rICsgbGFzdENoYXJhY3RlclxuXG4gICAgICAgIHRva2VuID0gW3RhZywgdmFsdWUsIGxvY2F0aW9uRGF0YV1cblxuICAgICAgICB0b2tlblxuXG4gICAgIyBBZGQgYSB0b2tlbiB0byB0aGUgcmVzdWx0cy5cbiAgICAjIGBvZmZzZXRgIGlzIHRoZSBvZmZzZXQgaW50byB0aGUgY3VycmVudCBAY2h1bmsgd2hlcmUgdGhlIHRva2VuIHN0YXJ0cy5cbiAgICAjIGBsZW5ndGhgIGlzIHRoZSBsZW5ndGggb2YgdGhlIHRva2VuIGluIHRoZSBAY2h1bmssIGFmdGVyIHRoZSBvZmZzZXQuICBcbiAgICAjIElmIG5vdCBzcGVjaWZpZWQsIHRoZSBsZW5ndGggb2YgYHZhbHVlYCB3aWxsIGJlIHVzZWQuIFJldHVybnMgdGhlIG5ldyB0b2tlbi5cbiAgICBcbiAgICB0b2tlbjogKHRhZywgdmFsdWUsIG9mZnNldEluQ2h1bmssIGxlbmd0aCwgb3JpZ2luKSAtPlxuICAgICAgICBcbiAgICAgICAgdG9rZW4gPSBAbWFrZVRva2VuIHRhZywgdmFsdWUsIG9mZnNldEluQ2h1bmssIGxlbmd0aFxuICAgICAgICB0b2tlbi5vcmlnaW4gPSBvcmlnaW4gaWYgb3JpZ2luXG4gICAgICAgIEB0b2tlbnMucHVzaCB0b2tlblxuICAgICAgICB0b2tlblxuXG4gICAgdGFnOiAtPiAjIFBlZWsgYXQgdGhlIGxhc3QgdGFnIGluIHRoZSB0b2tlbiBzdHJlYW0uXG4gICAgICAgIFsuLi4sIHRva2VuXSA9IEB0b2tlbnNcbiAgICAgICAgdG9rZW4/WzBdXG5cbiAgICB2YWx1ZTogLT4gIyBQZWVrIGF0IHRoZSBsYXN0IHZhbHVlIGluIHRoZSB0b2tlbiBzdHJlYW0uXG4gICAgICAgIFsuLi4sIHRva2VuXSA9IEB0b2tlbnNcbiAgICAgICAgdG9rZW4/WzFdXG5cbiAgICB1bmZpbmlzaGVkOiAtPiAjIEFyZSB3ZSBpbiB0aGUgbWlkc3Qgb2YgYW4gdW5maW5pc2hlZCBleHByZXNzaW9uP1xuICAgICAgICBMSU5FX0NPTlRJTlVFUi50ZXN0KEBjaHVuaykgb3JcbiAgICAgICAgQHRhZygpIGluIFVORklOSVNIRURcblxuICAgIGZvcm1hdFN0cmluZzogKHN0ciwgb3B0aW9ucykgLT5cbiAgICAgICAgQHJlcGxhY2VVbmljb2RlQ29kZVBvaW50RXNjYXBlcyBzdHIucmVwbGFjZShTVFJJTkdfT01JVCwgJyQxJyksIG9wdGlvbnNcblxuICAgIGZvcm1hdEhlcmVnZXg6IChzdHIpIC0+XG4gICAgICAgIEBmb3JtYXRSZWdleCBzdHIucmVwbGFjZShIRVJFR0VYX09NSVQsICckMSQyJyksIGRlbGltaXRlcjogJy8vLydcblxuICAgIGZvcm1hdFJlZ2V4OiAoc3RyLCBvcHRpb25zKSAtPlxuICAgICAgICBAcmVwbGFjZVVuaWNvZGVDb2RlUG9pbnRFc2NhcGVzIHN0ciwgb3B0aW9uc1xuXG4gICAgdW5pY29kZUNvZGVQb2ludFRvVW5pY29kZUVzY2FwZXM6IChjb2RlUG9pbnQpIC0+XG4gICAgICAgIHRvVW5pY29kZUVzY2FwZSA9ICh2YWwpIC0+XG4gICAgICAgICAgICBzdHIgPSB2YWwudG9TdHJpbmcgMTZcbiAgICAgICAgICAgIFwiXFxcXHUje3JlcGVhdCAnMCcsIDQgLSBzdHIubGVuZ3RofSN7c3RyfVwiXG4gICAgICAgIHJldHVybiB0b1VuaWNvZGVFc2NhcGUoY29kZVBvaW50KSBpZiBjb2RlUG9pbnQgPCAweDEwMDAwXG4gICAgICAgICMgc3Vycm9nYXRlIHBhaXJcbiAgICAgICAgaGlnaCA9IE1hdGguZmxvb3IoKGNvZGVQb2ludCAtIDB4MTAwMDApIC8gMHg0MDApICsgMHhEODAwXG4gICAgICAgIGxvdyA9IChjb2RlUG9pbnQgLSAweDEwMDAwKSAlIDB4NDAwICsgMHhEQzAwXG4gICAgICAgIFwiI3t0b1VuaWNvZGVFc2NhcGUoaGlnaCl9I3t0b1VuaWNvZGVFc2NhcGUobG93KX1cIlxuXG4gICAgIyBSZXBsYWNlIFxcdXsuLi59IHdpdGggXFx1eHh4eFtcXHV4eHh4XSBpbiBzdHJpbmdzIGFuZCByZWdleGVzXG4gICAgcmVwbGFjZVVuaWNvZGVDb2RlUG9pbnRFc2NhcGVzOiAoc3RyLCBvcHRpb25zKSAtPlxuICAgICAgICBzdHIucmVwbGFjZSBVTklDT0RFX0NPREVfUE9JTlRfRVNDQVBFLCAobWF0Y2gsIGVzY2FwZWRCYWNrc2xhc2gsIGNvZGVQb2ludEhleCwgb2Zmc2V0KSA9PlxuICAgICAgICAgICAgcmV0dXJuIGVzY2FwZWRCYWNrc2xhc2ggaWYgZXNjYXBlZEJhY2tzbGFzaFxuXG4gICAgICAgICAgICBjb2RlUG9pbnREZWNpbWFsID0gcGFyc2VJbnQgY29kZVBvaW50SGV4LCAxNlxuICAgICAgICAgICAgaWYgY29kZVBvaW50RGVjaW1hbCA+IDB4MTBmZmZmXG4gICAgICAgICAgICAgICAgQGVycm9yIFwidW5pY29kZSBjb2RlIHBvaW50IGVzY2FwZXMgZ3JlYXRlciB0aGFuIFxcXFx1ezEwZmZmZn0gYXJlIG5vdCBhbGxvd2VkXCIsXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldDogb2Zmc2V0ICsgb3B0aW9ucy5kZWxpbWl0ZXIubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIGxlbmd0aDogY29kZVBvaW50SGV4Lmxlbmd0aCArIDRcblxuICAgICAgICAgICAgQHVuaWNvZGVDb2RlUG9pbnRUb1VuaWNvZGVFc2NhcGVzIGNvZGVQb2ludERlY2ltYWxcblxuICAgICMgVmFsaWRhdGVzIGVzY2FwZXMgaW4gc3RyaW5ncyBhbmQgcmVnZXhlcy5cbiAgICB2YWxpZGF0ZUVzY2FwZXM6IChzdHIsIG9wdGlvbnMgPSB7fSkgLT5cbiAgICAgICAgaW52YWxpZEVzY2FwZVJlZ2V4ID1cbiAgICAgICAgICAgIGlmIG9wdGlvbnMuaXNSZWdleFxuICAgICAgICAgICAgICAgIFJFR0VYX0lOVkFMSURfRVNDQVBFXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgU1RSSU5HX0lOVkFMSURfRVNDQVBFXG4gICAgICAgIG1hdGNoID0gaW52YWxpZEVzY2FwZVJlZ2V4LmV4ZWMgc3RyXG4gICAgICAgIHJldHVybiB1bmxlc3MgbWF0Y2hcbiAgICAgICAgW1tdLCBiZWZvcmUsIG9jdGFsLCBoZXgsIHVuaWNvZGVDb2RlUG9pbnQsIHVuaWNvZGVdID0gbWF0Y2hcbiAgICAgICAgbWVzc2FnZSA9XG4gICAgICAgICAgICBpZiBvY3RhbFxuICAgICAgICAgICAgICAgIFwib2N0YWwgZXNjYXBlIHNlcXVlbmNlcyBhcmUgbm90IGFsbG93ZWRcIlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIFwiaW52YWxpZCBlc2NhcGUgc2VxdWVuY2VcIlxuICAgICAgICBpbnZhbGlkRXNjYXBlID0gXCJcXFxcI3tvY3RhbCBvciBoZXggb3IgdW5pY29kZUNvZGVQb2ludCBvciB1bmljb2RlfVwiXG4gICAgICAgIEBlcnJvciBcIiN7bWVzc2FnZX0gI3tpbnZhbGlkRXNjYXBlfVwiLFxuICAgICAgICAgICAgb2Zmc2V0OiAob3B0aW9ucy5vZmZzZXRJbkNodW5rID8gMCkgKyBtYXRjaC5pbmRleCArIGJlZm9yZS5sZW5ndGhcbiAgICAgICAgICAgIGxlbmd0aDogaW52YWxpZEVzY2FwZS5sZW5ndGhcblxuICAgICMgQ29uc3RydWN0cyBhIHN0cmluZyBvciByZWdleCBieSBlc2NhcGluZyBjZXJ0YWluIGNoYXJhY3RlcnMuXG4gICAgbWFrZURlbGltaXRlZExpdGVyYWw6IChib2R5LCBvcHRpb25zID0ge30pIC0+XG4gICAgICAgIGJvZHkgPSAnKD86KScgaWYgYm9keSBpcyAnJyBhbmQgb3B0aW9ucy5kZWxpbWl0ZXIgaXMgJy8nXG4gICAgICAgIHJlZ2V4ID0gLy8vXG4gICAgICAgICAgICAgICAgKFxcXFxcXFxcKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBlc2NhcGVkIGJhY2tzbGFzaFxuICAgICAgICAgICAgfCAoXFxcXDAoPz1bMS03XSkpICAgICAgICAgICAgICAgICAgICAgICAjIG51bCBjaGFyYWN0ZXIgbWlzdGFrZW4gYXMgb2N0YWwgZXNjYXBlXG4gICAgICAgICAgICB8IFxcXFw/KCN7b3B0aW9ucy5kZWxpbWl0ZXJ9KSAgICAgICAgICAgICMgKHBvc3NpYmx5IGVzY2FwZWQpIGRlbGltaXRlclxuICAgICAgICAgICAgfCBcXFxcPyg/OiAoXFxuKXwoXFxyKXwoXFx1MjAyOCl8KFxcdTIwMjkpICkgIyAocG9zc2libHkgZXNjYXBlZCkgbmV3bGluZXNcbiAgICAgICAgICAgIHwgKFxcXFwuKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBvdGhlciBlc2NhcGVzXG4gICAgICAgIC8vL2dcbiAgICAgICAgYm9keSA9IGJvZHkucmVwbGFjZSByZWdleCwgKG1hdGNoLCBiYWNrc2xhc2gsIG51bCwgZGVsaW1pdGVyLCBsZiwgY3IsIGxzLCBwcywgb3RoZXIpIC0+IHN3aXRjaFxuICAgICAgICAgICAgIyBJZ25vcmUgZXNjYXBlZCBiYWNrc2xhc2hlcy5cbiAgICAgICAgICAgIHdoZW4gYmFja3NsYXNoIHRoZW4gKGlmIG9wdGlvbnMuZG91YmxlIHRoZW4gYmFja3NsYXNoICsgYmFja3NsYXNoIGVsc2UgYmFja3NsYXNoKVxuICAgICAgICAgICAgd2hlbiBudWwgICAgICAgdGhlbiAnXFxcXHgwMCdcbiAgICAgICAgICAgIHdoZW4gZGVsaW1pdGVyIHRoZW4gXCJcXFxcI3tkZWxpbWl0ZXJ9XCJcbiAgICAgICAgICAgIHdoZW4gbGYgICAgICAgIHRoZW4gJ1xcXFxuJ1xuICAgICAgICAgICAgd2hlbiBjciAgICAgICAgdGhlbiAnXFxcXHInXG4gICAgICAgICAgICB3aGVuIGxzICAgICAgICB0aGVuICdcXFxcdTIwMjgnXG4gICAgICAgICAgICB3aGVuIHBzICAgICAgICB0aGVuICdcXFxcdTIwMjknXG4gICAgICAgICAgICB3aGVuIG90aGVyICAgICB0aGVuIChpZiBvcHRpb25zLmRvdWJsZSB0aGVuIFwiXFxcXCN7b3RoZXJ9XCIgZWxzZSBvdGhlcilcbiAgICAgICAgXCIje29wdGlvbnMuZGVsaW1pdGVyfSN7Ym9keX0je29wdGlvbnMuZGVsaW1pdGVyfVwiXG5cbiAgICAjIFRocm93cyBhbiBlcnJvciBhdCBlaXRoZXIgYSBnaXZlbiBvZmZzZXQgZnJvbSB0aGUgY3VycmVudCBjaHVuayBvciBhdCB0aGUgbG9jYXRpb24gb2YgYSB0b2tlbiAoYHRva2VuWzJdYCkuXG4gICAgXG4gICAgZXJyb3I6IChtZXNzYWdlLCBvcHRpb25zID0ge30pIC0+XG4gICAgICAgIGxvY2F0aW9uID1cbiAgICAgICAgICAgIGlmICdmaXJzdF9saW5lJyBvZiBvcHRpb25zXG4gICAgICAgICAgICAgICAgb3B0aW9uc1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIFtmaXJzdF9saW5lLCBmaXJzdF9jb2x1bW5dID0gQGdldExpbmVBbmRDb2x1bW5Gcm9tQ2h1bmsgb3B0aW9ucy5vZmZzZXQgPyAwXG4gICAgICAgICAgICAgICAge2ZpcnN0X2xpbmUsIGZpcnN0X2NvbHVtbiwgbGFzdF9jb2x1bW46IGZpcnN0X2NvbHVtbiArIChvcHRpb25zLmxlbmd0aCA/IDEpIC0gMX1cbiAgICAgICAgdGhyb3dTeW50YXhFcnJvciBtZXNzYWdlLCBsb2NhdGlvblxuXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG5cbmlzVW5hc3NpZ25hYmxlID0gKG5hbWUsIGRpc3BsYXlOYW1lID0gbmFtZSkgLT4gc3dpdGNoXG4gICAgd2hlbiBuYW1lIGluIFtKU19LRVlXT1JEUy4uLiwgQ09GRkVFX0tFWVdPUkRTLi4uXVxuICAgICAgICBcImtleXdvcmQgJyN7ZGlzcGxheU5hbWV9JyBjYW4ndCBiZSBhc3NpZ25lZFwiXG4gICAgd2hlbiBuYW1lIGluIFNUUklDVF9QUk9TQ1JJQkVEXG4gICAgICAgIFwiJyN7ZGlzcGxheU5hbWV9JyBjYW4ndCBiZSBhc3NpZ25lZFwiXG4gICAgd2hlbiBuYW1lIGluIFJFU0VSVkVEXG4gICAgICAgIFwicmVzZXJ2ZWQgd29yZCAnI3tkaXNwbGF5TmFtZX0nIGNhbid0IGJlIGFzc2lnbmVkXCJcbiAgICBlbHNlXG4gICAgICAgIGZhbHNlXG5cbmV4cG9ydHMuaXNVbmFzc2lnbmFibGUgPSBpc1VuYXNzaWduYWJsZVxuZXhwb3J0cy5MZXhlciA9IExleGVyXG5cbiMgYGZyb21gIGlzbuKAmXQgYSBrZXl3b3JkLCBidXQgaXQgYmVoYXZlcyBsaWtlIG9uZSBpbiBgaW1wb3J0YCBhbmQgYGV4cG9ydGAgc3RhdGVtZW50cyAoaGFuZGxlZCBhYm92ZSkgXG4jIGFuZCBpbiB0aGUgZGVjbGFyYXRpb24gbGluZSBvZiBhIGBmb3JgIGxvb3AuXG4jIFRyeSB0byBkZXRlY3Qgd2hlbiBgZnJvbWAgaXMgYSB2YXJpYWJsZSBpZGVudGlmaWVyIGFuZCB3aGVuIGl0IGlzIHRoaXMg4oCcc29tZXRpbWVz4oCdIGtleXdvcmQuXG5cbmlzRm9yRnJvbSA9IChwcmV2KSAtPlxuICAgIGlmIHByZXZbMF0gaXMgJ0lERU5USUZJRVInXG4gICAgICAgICMgYGZvciBpIGZyb20gZnJvbWAsIGBmb3IgZnJvbSBmcm9tIGl0ZXJhYmxlYFxuICAgICAgICBpZiBwcmV2WzFdIGlzICdmcm9tJ1xuICAgICAgICAgICAgcHJldlsxXVswXSA9ICdJREVOVElGSUVSJ1xuICAgICAgICAgICAgeWVzXG4gICAgICAgICMgYGZvciBpIGZyb20gaXRlcmFibGVgXG4gICAgICAgIHllc1xuICAgICMgYGZvciBmcm9t4oCmYFxuICAgIGVsc2UgaWYgcHJldlswXSBpcyAnRk9SJ1xuICAgICAgICBub1xuICAgICMgYGZvciB7ZnJvbX3igKZgLCBgZm9yIFtmcm9tXeKApmAsIGBmb3Ige2EsIGZyb2194oCmYCwgYGZvciB7YTogZnJvbX3igKZgXG4gICAgZWxzZSBpZiBwcmV2WzFdIGluIFsneycnWycnLCcnOiddXG4gICAgICAgIG5vXG4gICAgZWxzZVxuICAgICAgICB5ZXNcblxuIyMjXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgICAgICAgMDAwICBcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuIyMjXG5cbiMgS2V5d29yZHMgdGhhdCB3ZSBzaGFyZSBpbiBjb21tb24gd2l0aCBKYXZhU2NyaXB0LlxuXG5NRVRBX0tFWVdPUkRTID0gWyAnaWYnICd0aGVuJyAnZWxpZicgJ2Vsc2UnIF1cblxuSlNfS0VZV09SRFMgPSBbXG4gICAgJ3RydWUnICdmYWxzZScgJ251bGwnICd0aGlzJ1xuICAgICduZXcnICdkZWxldGUnICd0eXBlb2YnICdpbicgJ2luc3RhbmNlb2YnXG4gICAgJ3JldHVybicgJ3Rocm93JyAnYnJlYWsnICdjb250aW51ZScgJ2RlYnVnZ2VyJyAneWllbGQnXG4gICAgJ2lmJyAnZWxzZScgJ3N3aXRjaCcgJ2ZvcicgJ3doaWxlJyAnZG8nICd0cnknICdjYXRjaCcgJ2ZpbmFsbHknXG4gICAgJ2NsYXNzJyAnZXh0ZW5kcycgJ3N1cGVyJ1xuICAgICdpbXBvcnQnICdleHBvcnQnICdkZWZhdWx0J1xuXVxuXG5DT0ZGRUVfS0VZV09SRFMgPSBbICd1bmRlZmluZWQnICdJbmZpbml0eScgJ05hTicgJ3RoZW4nICd1bmxlc3MnICd1bnRpbCcgJ2xvb3AnICdvZicgJ2J5JyAnd2hlbicgXVxuXG5DT0ZGRUVfQUxJQVNfTUFQID1cbiAgICBhbmQgIDogJyYmJ1xuICAgIG9yICAgOiAnfHwnXG4gICAgaXMgICA6ICc9PSdcbiAgICBpc250IDogJyE9JyAjIHVnbHkhIHJlbW92ZSBpbiBjYXNlIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IHdpdGggQ1MxIGlzIGJyb2tlbi4gXG4gICAgbm90ICA6ICchJ1xuICAgIHllcyAgOiAndHJ1ZSdcbiAgICBubyAgIDogJ2ZhbHNlJ1xuICAgIG9uICAgOiAndHJ1ZSdcbiAgICBvZmYgIDogJ2ZhbHNlJ1xuXG5DT0ZGRUVfQUxJQVNFUyAgPSAoa2V5IGZvciBrZXkgb2YgQ09GRkVFX0FMSUFTX01BUClcbkNPRkZFRV9LRVlXT1JEUyA9IENPRkZFRV9LRVlXT1JEUy5jb25jYXQgQ09GRkVFX0FMSUFTRVNcblxuIyBUaGUgbGlzdCBvZiBrZXl3b3JkcyB0aGF0IGFyZSByZXNlcnZlZCBieSBKYXZhU2NyaXB0LCBidXQgbm90IHVzZWQsIG9yIHVzZWQgaW50ZXJuYWxseS5cbiMgV2UgdGhyb3cgYW4gZXJyb3Igd2hlbiB0aGVzZSBhcmUgZW5jb3VudGVyZWQsIHRvIGF2b2lkIGhhdmluZyBhIEphdmFTY3JpcHQgZXJyb3IgYXQgcnVudGltZS5cblxuUkVTRVJWRUQgPSBbXG4gICAgJ2Nhc2UnICdmdW5jdGlvbicgJ3ZhcicgJ3ZvaWQnICd3aXRoJyAnY29uc3QnICdsZXQnICdlbnVtJ1xuICAgICduYXRpdmUnICdpbXBsZW1lbnRzJyAnaW50ZXJmYWNlJyAncGFja2FnZScgJ3ByaXZhdGUnXG4gICAgJ3Byb3RlY3RlZCcgJ3B1YmxpYycgJ3N0YXRpYydcbl1cblxuU1RSSUNUX1BST1NDUklCRUQgPSBbJ2FyZ3VtZW50cycgJ2V2YWwnXVxuXG4jIFRoZSBzdXBlcnNldCBvZiBib3RoIEphdmFTY3JpcHQga2V5d29yZHMgYW5kIHJlc2VydmVkIHdvcmRzLCBub25lIG9mIHdoaWNoIG1heVxuIyBiZSB1c2VkIGFzIGlkZW50aWZpZXJzIG9yIHByb3BlcnRpZXMuXG5cbmV4cG9ydHMuSlNfRk9SQklEREVOID0gSlNfS0VZV09SRFMuY29uY2F0KFJFU0VSVkVEKS5jb25jYXQoU1RSSUNUX1BST1NDUklCRUQpXG5cbkJPTSA9IDY1Mjc5ICMgVGhlIGNoYXJhY3RlciBjb2RlIG9mIHRoZSBuYXN0eSBNaWNyb3NvZnQgbWFkbmVzcyBvdGhlcndpc2Uga25vd24gYXMgdGhlIEJPTS5cblxuIyBUb2tlbiBtYXRjaGluZyByZWdleGVzLlxuXG5JREVOVElGSUVSID0gLy8vIF5cbiAgICAoPyFcXGQpXG4gICAgKCAoPzogKD8hXFxzKVskXFx3XFx4N2YtXFx1ZmZmZl0gKSsgKVxuICAgICggW15cXG5cXFNdKiA6ICg/ITopICk/ICAgICMgSXMgdGhpcyBhIHByb3BlcnR5IG5hbWU/XG4vLy9cblxuTlVNQkVSID0gLy8vXG4gICAgXiAwYlswMV0rICAgIHwgICAgICAgICAgICAgICMgYmluYXJ5XG4gICAgXiAwb1swLTddKyAgIHwgICAgICAgICAgICAgICMgb2N0YWxcbiAgICBeIDB4W1xcZGEtZl0rIHwgICAgICAgICAgICAgICMgaGV4XG4gICAgXiBcXGQqXFwuP1xcZCsgKD86ZVsrLV0/XFxkKyk/ICAjIGRlY2ltYWxcbi8vL2lcblxuT1BFUkFUT1IgPSAvLy8gXiAoXG4gICAgPzogWy09XT4gICAgICAgICAgICAgIyBmdW5jdGlvblxuICAgICB8IFstKyovJTw+JnxeIT89XT0gICMgY29tcG91bmQgYXNzaWduIC8gY29tcGFyZVxuICAgICB8ID4+Pj0/ICAgICAgICAgICAgICMgemVyby1maWxsIHJpZ2h0IHNoaWZ0XG4gICAgIHwgKFstKzpdKVxcMSAgICAgICAgICMgZG91Ymxlc1xuICAgICB8IChbJnw8PiovJV0pXFwyPT8gICAjIGxvZ2ljIC8gc2hpZnQgLyBwb3dlciAvIGZsb29yIGRpdmlzaW9uIC8gbW9kdWxvXG4gICAgIHwgXFw/KFxcLnw6OikgICAgICAgICAjIHNvYWsgYWNjZXNzXG4gICAgIHwgXFwuezIsM30gICAgICAgICAgICMgcmFuZ2Ugb3Igc3BsYXRcbikgLy8vXG5cbldISVRFU1BBQ0UgPSAvXlteXFxuXFxTXSsvXG5cbiMgQ09NTUVOVCAgICA9IC9eIyMjKFteI11bXFxzXFxTXSo/KSg/OiMjI1teXFxuXFxTXSp8IyMjJCl8Xig/OlxccyojKD8hIyNbXiNdKS4qKSsvICMgbW92ZWQgdG8gZW5kXG5cbkNPREUgICAgICAgPSAvXlstPV0+L1xuXG5NVUxUSV9ERU5UID0gL14oPzpcXG5bXlxcblxcU10qKSsvXG5cbkpTVE9LRU4gICAgICA9IC8vL14gYCg/IWBgKSAoKD86IFteYFxcXFxdIHwgXFxcXFtcXHNcXFNdICAgICAgICAgICAgICAgKSopIGAgICAvLy9cbkhFUkVfSlNUT0tFTiA9IC8vL14gYGBgICAgICAgICAgKCg/OiBbXmBcXFxcXSB8IFxcXFxbXFxzXFxTXSB8IGAoPyFgYCkgKSopIGBgYCAvLy9cblxuIyBTdHJpbmctbWF0Y2hpbmctcmVnZXhlcy5cblxuU1RSSU5HX1NUQVJUICAgPSAvXig/OicnJ3xcIlwiXCJ8J3xcIikvXG5cblNUUklOR19TSU5HTEUgID0gLy8vIF4oPzogW15cXFxcJ10gIHwgXFxcXFtcXHNcXFNdICAgICAgICAgICAgICAgICAgICAgICkqIC8vL1xuU1RSSU5HX0RPVUJMRSAgPSAvLy8gXig/OiBbXlxcXFxcIiNdIHwgXFxcXFtcXHNcXFNdIHwgICAgICAgICAgIFxcIyg/IVxceykgKSogLy8vXG5IRVJFRE9DX1NJTkdMRSA9IC8vLyBeKD86IFteXFxcXCddICAgIHwgXFxcXFtcXHNcXFNdIHwgJyg/IScnKSAgICAgICAgICApKiAvLy9cbkhFUkVET0NfRE9VQkxFID0gLy8vIF4oPzogW15cXFxcXCIjXSB8IFxcXFxbXFxzXFxTXSB8IFwiKD8hXCJcIikgfCBcXCMoPyFcXHspICkqIC8vL1xuXG5TVFJJTkdfT01JVCAgICA9IC8vL1xuICAgICAgICAoKD86XFxcXFxcXFwpKykgICAgICAjIGNvbnN1bWUgKGFuZCBwcmVzZXJ2ZSkgYW4gZXZlbiBudW1iZXIgb2YgYmFja3NsYXNoZXNcbiAgICB8IFxcXFxbXlxcU1xcbl0qXFxuXFxzKiAgICAjIHJlbW92ZSBlc2NhcGVkIG5ld2xpbmVzXG4vLy9nXG5TSU1QTEVfU1RSSU5HX09NSVQgPSAvXFxzKlxcblxccyovZ1xuSEVSRURPQ19JTkRFTlQgICAgICAgPSAvXFxuKyhbXlxcblxcU10qKSg/PVxcUykvZ1xuXG4jIFJlZ2V4LW1hdGNoaW5nLXJlZ2V4ZXMuXG5SRUdFWCA9IC8vLyBeXG4gICAgLyAoPyEvKSAoKFxuICAgID86IFteIFsgLyBcXG4gXFxcXCBdICAgICMgZXZlcnkgb3RoZXIgdGhpbmdcbiAgICAgfCBcXFxcW15cXG5dICAgICAgICAgICAjIGFueXRoaW5nIGJ1dCBuZXdsaW5lcyBlc2NhcGVkXG4gICAgIHwgXFxbICAgICAgICAgICAgICAgICMgY2hhcmFjdGVyIGNsYXNzXG4gICAgICAgICAgICAgKD86IFxcXFxbXlxcbl0gfCBbXiBcXF0gXFxuIFxcXFwgXSApKlxuICAgICAgICAgXFxdXG4gICAgKSopICgvKT9cbi8vL1xuXG5SRUdFWF9GTEFHUyAgPSAvXlxcdyovXG5WQUxJRF9GTEFHUyAgPSAvXig/IS4qKC4pLipcXDEpW2ltZ3V5XSokL1xuXG5IRVJFR0VYICAgICAgPSAvLy8gXig/OiBbXlxcXFwvI10gfCBcXFxcW1xcc1xcU10gfCAvKD8hLy8pIHwgXFwjKD8hXFx7KSApKiAvLy9cblxuSEVSRUdFWF9PTUlUID0gLy8vXG4gICAgICAoKD86XFxcXFxcXFwpKykgICAgICAgICAgICMgY29uc3VtZSAoYW5kIHByZXNlcnZlKSBhbiBldmVuIG51bWJlciBvZiBiYWNrc2xhc2hlc1xuICAgIHwgXFxcXChcXHMpICAgICAgICAgICAgICAgICMgcHJlc2VydmUgZXNjYXBlZCB3aGl0ZXNwYWNlXG4gICAgfCBcXHMrKD86Iy4qKT8gICAgICAgICAgICMgcmVtb3ZlIHdoaXRlc3BhY2UgYW5kIGNvbW1lbnRzXG4vLy9nXG5cblJFR0VYX0lMTEVHQUwgPSAvLy8gXiAoIC8gfCAvezN9XFxzKikgKFxcKikgLy8vXG5cblBPU1NJQkxZX0RJVklTSU9OID0gLy8vIF4gLz0/XFxzIC8vL1xuXG4jIE90aGVyIHJlZ2V4ZXMuXG5cbkhFUkVDT01NRU5UX0lMTEVHQUwgPSAvXFwqXFwvL1xuXG5MSU5FX0NPTlRJTlVFUiAgICAgICAgICA9IC8vLyBeIFxccyogKD86ICwgfCBcXD8/XFwuKD8hWy5cXGRdKSB8IDo6ICkgLy8vXG5cblNUUklOR19JTlZBTElEX0VTQ0FQRSA9IC8vL1xuICAgICggKD86XnxbXlxcXFxdKSAoPzpcXFxcXFxcXCkqICkgICAgICAgICAgICAgICAgICAgIyBtYWtlIHN1cmUgdGhlIGVzY2FwZSBpc27igJl0IGVzY2FwZWRcbiAgICBcXFxcICggICBcbiAgICAgICAgID86ICgwWzAtN118WzEtN10pICAgICAgICAgICAgICAgICAgICAgICMgb2N0YWwgZXNjYXBlXG4gICAgICAgICAgICB8ICh4KD8hW1xcZGEtZkEtRl17Mn0pLnswLDJ9KSAgICAgICAgIyBoZXggZXNjYXBlXG4gICAgICAgICAgICB8ICh1XFx7KD8hW1xcZGEtZkEtRl17MSx9XFx9KVtefV0qXFx9PykgIyB1bmljb2RlIGNvZGUgcG9pbnQgZXNjYXBlXG4gICAgICAgICAgICB8ICh1KD8hXFx7fFtcXGRhLWZBLUZdezR9KS57MCw0fSkgICAgICMgdW5pY29kZSBlc2NhcGVcbiAgICApXG4vLy9cblJFR0VYX0lOVkFMSURfRVNDQVBFID0gLy8vXG4gICAgKCAoPzpefFteXFxcXF0pICg/OlxcXFxcXFxcKSogKSAgICAgICAgICAgICAgICAgICAjIG1ha2Ugc3VyZSB0aGUgZXNjYXBlIGlzbuKAmXQgZXNjYXBlZFxuICAgIFxcXFwgKCAgIFxuICAgICAgICAgPzogKDBbMC03XSkgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBvY3RhbCBlc2NhcGVcbiAgICAgICAgICAgIHwgKHgoPyFbXFxkYS1mQS1GXXsyfSkuezAsMn0pICAgICAgICAjIGhleCBlc2NhcGVcbiAgICAgICAgICAgIHwgKHVcXHsoPyFbXFxkYS1mQS1GXXsxLH1cXH0pW159XSpcXH0/KSAjIHVuaWNvZGUgY29kZSBwb2ludCBlc2NhcGVcbiAgICAgICAgICAgIHwgKHUoPyFcXHt8W1xcZGEtZkEtRl17NH0pLnswLDR9KSAgICAgIyB1bmljb2RlIGVzY2FwZVxuICAgIClcbi8vL1xuXG5VTklDT0RFX0NPREVfUE9JTlRfRVNDQVBFID0gLy8vXG4gICAgKCBcXFxcXFxcXCApICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBtYWtlIHN1cmUgdGhlIGVzY2FwZSBpc27igJl0IGVzY2FwZWRcbiAgICB8XG4gICAgXFxcXHVcXHsgKCBbXFxkYS1mQS1GXSsgKSBcXH1cbi8vL2dcblxuTEVBRElOR19CTEFOS19MSU5FICA9IC9eW15cXG5cXFNdKlxcbi9cblRSQUlMSU5HX0JMQU5LX0xJTkUgPSAvXFxuW15cXG5cXFNdKiQvXG5UUkFJTElOR19TUEFDRVMgICAgID0gL1xccyskL1xuQ09NUE9VTkRfQVNTSUdOICAgICA9IFsgJy09JyAnKz0nICcvPScgJyo9JyAnJT0nICd8fD0nICcmJj0nICc/PScgJzw8PScgJz4+PScgJz4+Pj0nICcmPScgJ149JyAnfD0nICcqKj0nICcvLz0nICclJT0nIF1cblVOQVJZICAgICAgICAgICAgICAgPSBbJ05FVycgJ1RZUEVPRicgJ0RFTEVURScgJ0RPJ11cblVOQVJZX01BVEggICAgICAgICAgPSBbJyEnICd+J11cblNISUZUICAgICAgICAgICAgICAgPSBbJzw8JyAnPj4nICc+Pj4nXVxuQ09NUEFSRSAgICAgICAgICAgICA9IFsnPT0nICchPScgJzwnICc+JyAnPD0nICc+PSddXG5NQVRIICAgICAgICAgICAgICAgID0gWycqJyAnLycgJyUnICcvLycgJyUlJ11cblJFTEFUSU9OICAgICAgICAgICAgPSBbJ0lOJyAnT0YnICdJTlNUQU5DRU9GJ10gIyBSZWxhdGlvbmFsIHRva2VucyB0aGF0IGFyZSBuZWdhdGFibGUgd2l0aCBgbm90YCBwcmVmaXguXG5CT09MICAgICAgICAgICAgICAgID0gWydUUlVFJyAnRkFMU0UnXVxuXG4jIFRva2VucyB3aGljaCBjb3VsZCBsZWdpdGltYXRlbHkgYmUgaW52b2tlZCBvciBpbmRleGVkLiBBbiBvcGVuaW5nXG4jIHBhcmVudGhlc2VzIG9yIGJyYWNrZXQgZm9sbG93aW5nIHRoZXNlIHRva2VucyB3aWxsIGJlIHJlY29yZGVkIGFzIHRoZSBzdGFydFxuIyBvZiBhIGZ1bmN0aW9uIGludm9jYXRpb24gb3IgaW5kZXhpbmcgb3BlcmF0aW9uLlxuXG5DQUxMQUJMRSAgPSBbJ0lERU5USUZJRVInICdQUk9QRVJUWScgJyknICddJyAnPycgJ0AnICdUSElTJyAnU1VQRVInXVxuSU5ERVhBQkxFID0gQ0FMTEFCTEUuY29uY2F0IFsgJ05VTUJFUicgJ0lORklOSVRZJyAnTkFOJyAnU1RSSU5HJyAnU1RSSU5HX0VORCcgJ1JFR0VYJyAnUkVHRVhfRU5EJyAnQk9PTCcgJ05VTEwnICdVTkRFRklORUQnICd9JyAnOjonIF1cblxuIyBUb2tlbnMgd2hpY2ggYSByZWd1bGFyIGV4cHJlc3Npb24gd2lsbCBuZXZlciBpbW1lZGlhdGVseSBmb2xsb3cgKGV4Y2VwdCBzcGFjZWRcbiMgQ0FMTEFCTEVzIGluIHNvbWUgY2FzZXMpLCBidXQgd2hpY2ggYSBkaXZpc2lvbiBvcGVyYXRvciBjYW4uXG4jXG4jIFNlZTogaHR0cDovL3d3dy1hcmNoaXZlLm1vemlsbGEub3JnL2pzL2xhbmd1YWdlL2pzMjAtMjAwMi0wNC9yYXRpb25hbGUvc3ludGF4Lmh0bWwjcmVndWxhci1leHByZXNzaW9uc1xuXG5OT1RfUkVHRVggPSBJTkRFWEFCTEUuY29uY2F0IFsnKysnICctLSddXG5cbiMgVG9rZW5zIHRoYXQsIHdoZW4gaW1tZWRpYXRlbHkgcHJlY2VkaW5nIGEgYFdIRU5gLCBpbmRpY2F0ZSB0aGF0IHRoZSBgV0hFTmBcbiMgb2NjdXJzIGF0IHRoZSBzdGFydCBvZiBhIGxpbmUuIFdlIGRpc2FtYmlndWF0ZSB0aGVzZSBmcm9tIHRyYWlsaW5nIHdoZW5zIHRvXG4jIGF2b2lkIGFuIGFtYmlndWl0eSBpbiB0aGUgZ3JhbW1hci5cblxuTElORV9CUkVBSyA9IFsnSU5ERU5UJyAnT1VUREVOVCcgJ1RFUk1JTkFUT1InXVxuXG4jIEFkZGl0aW9uYWwgaW5kZW50IGluIGZyb250IG9mIHRoZXNlIGlzIGlnbm9yZWQuXG5cbklOREVOVEFCTEVfQ0xPU0VSUyA9IFsnKScgJ30nICddJ11cblxuIyBUb2tlbnMgdGhhdCwgd2hlbiBhcHBlYXJpbmcgYXQgdGhlIGVuZCBvZiBhIGxpbmUsIHN1cHByZXNzIGEgZm9sbG93aW5nIFRFUk1JTkFUT1IvSU5ERU5UIHRva2VuXG5cblVORklOSVNIRUQgPSBbJ1xcXFwnICcuJyAnPy4nICc/OjonICdVTkFSWScgJ01BVEgnICdVTkFSWV9NQVRIJyAnKycgJy0nXG4gICAgICAgICAgICAgICcqKicgJ1NISUZUJyAnUkVMQVRJT04nICdDT01QQVJFJyAnJicgJ14nICd8JyAnJiYnICd8fCdcbiAgICAgICAgICAgICAgJ0JJTj8nICdUSFJPVycgJ0VYVEVORFMnXVxuICAgICAgICAgICAgICBcbkNPTU1FTlQgICAgPSAvXiMjIyhbXiNdW1xcc1xcU10qPykoPzojIyNbXlxcblxcU10qfCMjIyQpfF4oPzpcXHMqIyg/ISMjW14jXSkuKikrLyAgICAgICAgICAgICAgXG4iXX0=
//# sourceURL=../coffee/lexer.coffee