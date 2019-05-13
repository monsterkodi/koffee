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
        var consumed, end, ref2;
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
        this.code = this.clean(code);
        this.chunkIndex = 0;
        while (this.chunk = this.code.slice(this.chunkIndex)) {
            consumed = this.docToken() || this.identifierToken() || this.commentToken() || this.whitespaceToken() || this.lineToken() || this.stringToken() || this.numberToken() || this.regexToken() || this.jsToken() || this.literalToken();
            ref2 = this.getLineAndColumnFromChunk(consumed), this.chunkLine = ref2[0], this.chunkColumn = ref2[1];
            this.chunkIndex += consumed;
            if (opts.untilBalanced && this.ends.length === 0) {
                return {
                    tokens: this.tokens,
                    index: this.chunkIndex
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

    Lexer.prototype.docToken = function() {
        var DOC, after, body, cmmt, doc, j, len, line, lineIndent, lines, match, newCode, numLines, rest;
        DOC = /^(▸|~>)(doc)(\s+([\"][^\n\"]*[\"]|[\'][^\n\']*[\']))?[^\n\S]*\n/;
        if (!(match = this.chunk.match(DOC))) {
            return 0;
        }
        doc = match[0];
        rest = this.chunk.slice(match[0].length);
        numLines = 0;
        lines = rest.split('\n');
        for (j = 0, len = lines.length; j < len; j++) {
            line = lines[j];
            numLines++;
            match = WHITESPACE.exec(line);
            if (match) {
                lineIndent = match != null ? match[0].length : void 0;
            } else if (line.length) {
                lineIndent = 0;
            } else {
                continue;
            }
            if (lineIndent <= this.indent) {
                cmmt = repeat(' ', this.indent + 4);
                cmmt += "'''";
                body = lines.slice(0, numLines - 1);
                after = lines.slice(numLines - 1);
                newCode = [doc, cmmt, body, cmmt, after].flat().join('\n');
                this.code = this.code.slice(0, this.chunkIndex) + newCode;
                return;
            }
        }
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
                this.tokens.slice(-1)[0].spaced = true;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4ZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLDA0QkFBQTtJQUFBOzs7O0FBaUJBLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFFVCxhQUFlLE9BQUEsQ0FBUSxRQUFSOztBQUNqQixNQUFnQyxPQUFBLENBQVEsWUFBUixDQUFoQyxFQUFFLGlDQUFGLEVBQWlCOztBQUNqQixPQUE2RSxPQUFBLENBQVEsV0FBUixDQUE3RSxFQUFFLGtCQUFGLEVBQVMsb0JBQVQsRUFBaUIsc0JBQWpCLEVBQTBCLG9CQUExQixFQUFrQyxnREFBbEMsRUFBd0Q7O0FBS2xEOzs7OztvQkFpQkYsUUFBQSxHQUFVLFNBQUMsSUFBRCxFQUFPLElBQVA7QUFFTixZQUFBO1FBQUEsSUFBQSxHQUFPLGFBQUEsQ0FBYyxJQUFkO1FBQ1AsSUFBQSxHQUFPLFVBQUEsQ0FBYyxJQUFkO1FBRVAsSUFBQyxDQUFBLE1BQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxVQUFELEdBQWM7UUFDZCxJQUFDLENBQUEsTUFBRCxHQUFjO1FBQ2QsSUFBQyxDQUFBLE9BQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxPQUFELEdBQWM7UUFDZCxJQUFDLENBQUEsSUFBRCxHQUFjO1FBQ2QsSUFBQyxDQUFBLE1BQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxPQUFELEdBQWM7UUFDZCxJQUFDLENBQUEsVUFBRCxHQUFjO1FBQ2QsSUFBQyxDQUFBLFVBQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxtQkFBRCxHQUF1QjtRQUN2QixJQUFDLENBQUEsbUJBQUQsR0FBdUI7UUFFdkIsSUFBQyxDQUFBLFNBQUQsR0FBZSxJQUFJLENBQUMsSUFBTCxJQUFhO1FBQzVCLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBSSxDQUFDLE1BQUwsSUFBZTtRQUM5QixJQUFDLENBQUEsSUFBRCxHQUFRLElBQUMsQ0FBQSxLQUFELENBQU8sSUFBUDtR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QUNaLFNBQUEsR0FBWSxRQUFRLENBQUMsTUFBVCxDQUFnQixDQUFFLFFBQUYsRUFBVyxVQUFYLEVBQXNCLEtBQXRCLEVBQTRCLFFBQTVCLEVBQXFDLFlBQXJDLEVBQWtELE9BQWxELEVBQTBELFdBQTFELEVBQXNFLE1BQXRFLEVBQTZFLE1BQTdFLEVBQW9GLFdBQXBGLEVBQWdHLEdBQWhHLEVBQW9HLElBQXBHLENBQWhCOztBQU9aLFNBQUEsR0FBWSxTQUFTLENBQUMsTUFBVixDQUFpQixDQUFDLElBQUQsRUFBTSxJQUFOLENBQWpCOztBQU1aLFVBQUEsR0FBYSxDQUFDLFFBQUQsRUFBVSxTQUFWLEVBQW9CLFlBQXBCOztBQUliLGtCQUFBLEdBQXFCLENBQUMsR0FBRCxFQUFLLEdBQUwsRUFBUyxHQUFUOztBQUlyQixVQUFBLEdBQWEsQ0FBQyxJQUFELEVBQU0sR0FBTixFQUFVLElBQVYsRUFBZSxLQUFmLEVBQXFCLE9BQXJCLEVBQTZCLE1BQTdCLEVBQW9DLFlBQXBDLEVBQWlELEdBQWpELEVBQXFELEdBQXJELEVBQ0MsSUFERCxFQUNNLE9BRE4sRUFDYyxVQURkLEVBQ3lCLFNBRHpCLEVBQ21DLEdBRG5DLEVBQ3VDLEdBRHZDLEVBQzJDLEdBRDNDLEVBQytDLElBRC9DLEVBQ29ELElBRHBELEVBRUMsTUFGRCxFQUVRLE9BRlIsRUFFZ0IsU0FGaEI7O0FBSWIsT0FBQSxHQUFhOztBQUViLE1BQU0sQ0FBQyxPQUFQLEdBQ0k7SUFBQSxZQUFBLEVBQWdCLFdBQVcsQ0FBQyxNQUFaLENBQW1CLFFBQW5CLENBQTRCLENBQUMsTUFBN0IsQ0FBb0MsaUJBQXBDLENBQWhCO0lBQ0EsY0FBQSxFQUFnQixjQURoQjtJQUVBLEtBQUEsRUFBZ0IsS0FGaEIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuMDAwICAgICAgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4wMDAgICAgICAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbjAwMCAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4jIyNcblxuIyBUaGUgTGV4ZXIgdXNlcyBhIHNlcmllcyBvZiB0b2tlbi1tYXRjaGluZyByZWdleGVzIHRvIGF0dGVtcHQgbWF0Y2hlcyBhZ2FpbnN0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIHNvdXJjZSBjb2RlLiBcbiMgV2hlbiBhIG1hdGNoIGlzIGZvdW5kLCBhIHRva2VuIGlzIHByb2R1Y2VkLCB3ZSBjb25zdW1lIHRoZSBtYXRjaCwgYW5kIHN0YXJ0IGFnYWluLiBcbiMgVG9rZW5zIGFyZSBpbiB0aGUgZm9ybTpcbiNcbiMgICAgW3RhZywgdmFsdWUsIGxvY2F0aW9uRGF0YV1cbiNcbiMgd2hlcmUgbG9jYXRpb25EYXRhIGlzIHtmaXJzdF9saW5lLCBmaXJzdF9jb2x1bW4sIGxhc3RfbGluZSwgbGFzdF9jb2x1bW59LCBcbiMgd2hpY2ggaXMgYSBmb3JtYXQgdGhhdCBjYW4gYmUgZmVkIGRpcmVjdGx5IGludG8gSmlzb24gdmlhIHRoZSBgcGFyc2VyLmxleGVyYCBmdW5jdGlvbiBkZWZpbmVkIGluIGtvZmZlZS5jb2ZmZWUuXG5cblJld3JpdGVyID0gcmVxdWlyZSAnLi9yZXdyaXRlcidcblxueyBpbmplY3RNZXRhIH0gPSByZXF1aXJlICcuL21ldGEnXG57IGluamVjdEZlYXR1cmUsIGhhc0ZlYXR1cmUgfSA9IHJlcXVpcmUgJy4vZmVhdHVyZXMnXG57IGNvdW50LCBzdGFydHMsIGNvbXBhY3QsIHJlcGVhdCwgbG9jYXRpb25EYXRhVG9TdHJpbmcsIHRocm93U3ludGF4RXJyb3IgfSA9IHJlcXVpcmUgJy4vaGVscGVycydcblxuIyBUaGUgTGV4ZXIgY2xhc3MgcmVhZHMgYSBzdHJpbmcgYW5kIGRpdnZpZXMgaXQgdXAgaW50byB0YWdnZWQgdG9rZW5zLiBcbiMgU29tZSBwb3RlbnRpYWwgYW1iaWd1aXR5IGluIHRoZSBncmFtbWFyIGhhcyBiZWVuIGF2b2lkZWQgYnkgcHVzaGluZyBzb21lIGV4dHJhIHNtYXJ0cyBpbnRvIHRoZSBMZXhlci5cblxuY2xhc3MgTGV4ZXJcblxuICAgICMgdG9rZW5pemUgaXMgdGhlIExleGVyJ3MgbWFpbiBtZXRob2QuIFNjYW4gYnkgYXR0ZW1wdGluZyB0byBtYXRjaCB0b2tlbnNcbiAgICAjIG9uZSBhdCBhIHRpbWUsIHVzaW5nIGEgcmVndWxhciBleHByZXNzaW9uIGFuY2hvcmVkIGF0IHRoZSBzdGFydCBvZiB0aGVcbiAgICAjIHJlbWFpbmluZyBjb2RlLCBvciBhIGN1c3RvbSByZWN1cnNpdmUgdG9rZW4tbWF0Y2hpbmcgbWV0aG9kIChmb3IgaW50ZXJwb2xhdGlvbnMpLiBcbiAgICAjIFdoZW4gdGhlIG5leHQgdG9rZW4gaGFzIGJlZW4gcmVjb3JkZWQsIHdlIG1vdmUgZm9yd2FyZCB3aXRoaW4gdGhlIGNvZGUgcGFzdCB0aGUgdG9rZW4sIGFuZCBiZWdpbiBhZ2Fpbi5cbiAgICAjXG4gICAgIyBFYWNoIHRva2VuaXppbmcgbWV0aG9kIGlzIHJlc3BvbnNpYmxlIGZvciByZXR1cm5pbmcgdGhlIG51bWJlciBvZiBjaGFyYWN0ZXJzIGl0IGhhcyBjb25zdW1lZC5cbiAgICAjXG4gICAgIyBCZWZvcmUgcmV0dXJuaW5nIHRoZSB0b2tlbiBzdHJlYW0sIHJ1biBpdCB0aHJvdWdoIHRoZSBSZXdyaXRlci5cbiAgICBcbiAgICAjIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgICAwMDAgICAwMDAgICAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAgMDAwICAgIDAwMDAwMDAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgICAgICAgICBcbiAgICB0b2tlbml6ZTogKGNvZGUsIG9wdHMpID0+XG5cbiAgICAgICAgb3B0cyA9IGluamVjdEZlYXR1cmUgb3B0c1xuICAgICAgICBvcHRzID0gaW5qZWN0TWV0YSAgICBvcHRzICAjIG5lZWRlZCB0byBzaG9ydGN1dCBtZXRhcywgZS5nLiBAdG9rZW4gLT4gQGlmIEB0b2tlbiAuLi5cbiAgICAgICAgXG4gICAgICAgIEBpbmRlbnQgICAgID0gMCAgICAgICAgICAgICMgVGhlIGN1cnJlbnQgaW5kZW50YXRpb24gbGV2ZWwuXG4gICAgICAgIEBiYXNlSW5kZW50ID0gMCAgICAgICAgICAgICMgVGhlIG92ZXJhbGwgbWluaW11bSBpbmRlbnRhdGlvbiBsZXZlbFxuICAgICAgICBAaW5kZWJ0ICAgICA9IDAgICAgICAgICAgICAjIFRoZSBvdmVyLWluZGVudGF0aW9uIGF0IHRoZSBjdXJyZW50IGxldmVsLlxuICAgICAgICBAb3V0ZGVidCAgICA9IDAgICAgICAgICAgICAjIFRoZSB1bmRlci1vdXRkZW50YXRpb24gYXQgdGhlIGN1cnJlbnQgbGV2ZWwuXG4gICAgICAgIEBpbmRlbnRzICAgID0gW10gICAgICAgICAgICMgVGhlIHN0YWNrIG9mIGFsbCBjdXJyZW50IGluZGVudGF0aW9uIGxldmVscy5cbiAgICAgICAgQGVuZHMgICAgICAgPSBbXSAgICAgICAgICAgIyBUaGUgc3RhY2sgZm9yIHBhaXJpbmcgdXAgdG9rZW5zLlxuICAgICAgICBAdG9rZW5zICAgICA9IFtdICAgICAgICAgICAjIFN0cmVhbSBvZiBwYXJzZWQgdG9rZW5zIGluIHRoZSBmb3JtIGBbJ1RZUEUnLCB2YWx1ZSwgbG9jYXRpb24gZGF0YV1gLlxuICAgICAgICBAc2VlbkZvciAgICA9IG5vICAgICAgICAgICAjIFVzZWQgdG8gcmVjb2duaXplIEZPUklOLCBGT1JPRiBhbmQgRk9SRlJPTSB0b2tlbnMuXG4gICAgICAgIEBzZWVuSW1wb3J0ID0gbm8gICAgICAgICAgICMgVXNlZCB0byByZWNvZ25pemUgSU1QT1JUIEZST00/IEFTPyB0b2tlbnMuXG4gICAgICAgIEBzZWVuRXhwb3J0ID0gbm8gICAgICAgICAgICMgVXNlZCB0byByZWNvZ25pemUgRVhQT1JUIEZST00/IEFTPyB0b2tlbnMuXG4gICAgICAgIEBpbXBvcnRTcGVjaWZpZXJMaXN0ID0gbm8gICMgVXNlZCB0byBpZGVudGlmeSB3aGVuIGluIGFuIElNUE9SVCB7Li4ufSBGUk9NPyAuLi5cbiAgICAgICAgQGV4cG9ydFNwZWNpZmllckxpc3QgPSBubyAgIyBVc2VkIHRvIGlkZW50aWZ5IHdoZW4gaW4gYW4gRVhQT1JUIHsuLi59IEZST00/IC4uLlxuXG4gICAgICAgIEBjaHVua0xpbmUgICA9IG9wdHMubGluZSBvciAwICAgICMgVGhlIHN0YXJ0IGxpbmUgZm9yIHRoZSBjdXJyZW50IEBjaHVuay5cbiAgICAgICAgQGNodW5rQ29sdW1uID0gb3B0cy5jb2x1bW4gb3IgMCAgIyBUaGUgc3RhcnQgY29sdW1uIG9mIHRoZSBjdXJyZW50IEBjaHVuay5cbiAgICAgICAgQGNvZGUgPSBAY2xlYW4gY29kZSAgICAgICAgICAgICAgIyBUaGUgc3RyaXBwZWQsIGNsZWFuZWQgb3JpZ2luYWwgc291cmNlIGNvZGUuXG5cbiAgICAgICAgIyBBdCBldmVyeSBwb3NpdGlvbiwgcnVuIHRocm91Z2ggdGhpcyBsaXN0IG9mIGF0dGVtcHRlZCBtYXRjaGVzLCBzaG9ydC1jaXJjdWl0aW5nIGlmIGFueSBvZiB0aGVtIHN1Y2NlZWQuIFxuICAgICAgICAjIFRoZWlyIG9yZGVyIGRldGVybWluZXMgcHJlY2VkZW5jZTogYEBsaXRlcmFsVG9rZW5gIGlzIHRoZSBmYWxsYmFjayBjYXRjaC1hbGwuXG4gICAgICAgIFxuICAgICAgICBAY2h1bmtJbmRleCA9IDBcbiAgICAgICAgd2hpbGUgQGNodW5rID0gQGNvZGVbQGNodW5rSW5kZXguLl1cbiAgICAgICAgICAgIGNvbnN1bWVkID0gXFxcbiAgICAgICAgICAgICAgICAgICAgIEBkb2NUb2tlbigpICAgICAgICBvclxuICAgICAgICAgICAgICAgICAgICAgQGlkZW50aWZpZXJUb2tlbigpIG9yXG4gICAgICAgICAgICAgICAgICAgICBAY29tbWVudFRva2VuKCkgICAgb3JcbiAgICAgICAgICAgICAgICAgICAgIEB3aGl0ZXNwYWNlVG9rZW4oKSBvclxuICAgICAgICAgICAgICAgICAgICAgQGxpbmVUb2tlbigpICAgICAgIG9yXG4gICAgICAgICAgICAgICAgICAgICBAc3RyaW5nVG9rZW4oKSAgICAgb3JcbiAgICAgICAgICAgICAgICAgICAgIEBudW1iZXJUb2tlbigpICAgICBvclxuICAgICAgICAgICAgICAgICAgICAgQHJlZ2V4VG9rZW4oKSAgICAgIG9yXG4gICAgICAgICAgICAgICAgICAgICBAanNUb2tlbigpICAgICAgICAgb3JcbiAgICAgICAgICAgICAgICAgICAgIEBsaXRlcmFsVG9rZW4oKVxuXG4gICAgICAgICAgICAjIFVwZGF0ZSBwb3NpdGlvblxuICAgICAgICAgICAgW0BjaHVua0xpbmUsIEBjaHVua0NvbHVtbl0gPSBAZ2V0TGluZUFuZENvbHVtbkZyb21DaHVuayBjb25zdW1lZFxuXG4gICAgICAgICAgICBAY2h1bmtJbmRleCArPSBjb25zdW1lZFxuXG4gICAgICAgICAgICByZXR1cm4ge0B0b2tlbnMsIGluZGV4OiBAY2h1bmtJbmRleH0gaWYgb3B0cy51bnRpbEJhbGFuY2VkIGFuZCBAZW5kcy5sZW5ndGggaXMgMFxuXG4gICAgICAgIEBjbG9zZUluZGVudGF0aW9uKClcbiAgICAgICAgQGVycm9yIFwibWlzc2luZyAje2VuZC50YWd9XCIsIGVuZC5vcmlnaW5bMl0gaWYgZW5kID0gQGVuZHMucG9wKClcbiAgICAgICAgXG4gICAgICAgIGlmIGhhc0ZlYXR1cmUgb3B0cywgJ3Jld3JpdGUnXG4gICAgICAgICAgICAobmV3IFJld3JpdGVyKS5yZXdyaXRlIEB0b2tlbnMsIG9wdHNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgd2FybiAnc2tpcHBpbmcgcmV3cml0ZSEnIyAsIG9wdHNcblxuICAgICAgICBAdG9rZW5zXG5cbiAgICAjIFByZXByb2Nlc3MgdGhlIGNvZGUgdG8gcmVtb3ZlIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHdoaXRlc3BhY2UsIGNhcnJpYWdlIHJldHVybnMsIGV0Yy4gXG4gICAgXG4gICAgY2xlYW46IChjb2RlKSAtPlxuICAgICAgICBcbiAgICAgICAgY29kZSA9IGNvZGUuc2xpY2UoMSkgaWYgY29kZS5jaGFyQ29kZUF0KDApIGlzIEJPTVxuICAgICAgICBjb2RlID0gY29kZS5yZXBsYWNlKC9cXHIvZywgJycpLnJlcGxhY2UgVFJBSUxJTkdfU1BBQ0VTLCAnJ1xuICAgICAgICBpZiBXSElURVNQQUNFLnRlc3QgY29kZVxuICAgICAgICAgICAgY29kZSA9IFwiXFxuI3tjb2RlfVwiXG4gICAgICAgICAgICBAY2h1bmtMaW5lLS1cbiAgICAgICAgY29kZVxuXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAwMCAgICAwMDAwMDAwICBcbiAgICBcbiAgICBkb2NUb2tlbjogLT5cblxuICAgICAgICBET0MgPSAvXijilrh8fj4pKGRvYykoXFxzKyhbXFxcIl1bXlxcblxcXCJdKltcXFwiXXxbXFwnXVteXFxuXFwnXSpbXFwnXSkpP1teXFxuXFxTXSpcXG4vXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gMCBpZiBub3QgbWF0Y2ggPSBAY2h1bmsubWF0Y2ggRE9DXG4gICAgICAgIFxuICAgICAgICBkb2MgPSBtYXRjaFswXVxuICAgICAgICBcbiAgICAgICAgIyBtYXJjaCB0aHJvdWdoIGFsbCBmb2xsb3dpbmcgbGluZXMgdW50aWwgc2FtZSBvciBzbWFsbGVyIGluZGVudCBpcyBmb3VuZFxuICAgICAgICBcbiAgICAgICAgcmVzdCA9IEBjaHVua1ttYXRjaFswXS5sZW5ndGguLl1cbiAgICAgICAgXG4gICAgICAgIG51bUxpbmVzID0gMFxuICAgICAgICBsaW5lcyA9IHJlc3Quc3BsaXQgJ1xcbidcbiAgICAgICAgZm9yIGxpbmUgaW4gbGluZXNcbiAgICAgICAgICAgIG51bUxpbmVzKytcbiAgICAgICAgICAgIG1hdGNoID0gV0hJVEVTUEFDRS5leGVjIGxpbmVcbiAgICAgICAgICAgIGlmIG1hdGNoXG4gICAgICAgICAgICAgICAgbGluZUluZGVudCA9IG1hdGNoP1swXS5sZW5ndGhcbiAgICAgICAgICAgIGVsc2UgaWYgbGluZS5sZW5ndGhcbiAgICAgICAgICAgICAgICBsaW5lSW5kZW50ID0gMCAjIGxpbmUgd2l0aG91dCBpbmRlbnRhdGlvblxuICAgICAgICAgICAgZWxzZSBcbiAgICAgICAgICAgICAgICBjb250aW51ZSAjIGlnbm9yZSBlbXB0eSBsaW5lc1xuICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBsaW5lSW5kZW50IDw9IEBpbmRlbnRcbiAgICAgICAgICAgICAgICBjbW10ID0gcmVwZWF0ICcgJywgQGluZGVudCs0XG4gICAgICAgICAgICAgICAgY21tdCArPSBcIicnJ1wiXG4gICAgICAgICAgICAgICAgYm9keSA9IGxpbmVzWy4uLm51bUxpbmVzLTFdXG4gICAgICAgICAgICAgICAgYWZ0ZXIgPSBsaW5lc1tudW1MaW5lcy0xLi5dXG4gICAgICAgICAgICAgICAgbmV3Q29kZSA9IFtkb2MsIGNtbXQsIGJvZHksIGNtbXQsIGFmdGVyXS5mbGF0KCkuam9pbiAnXFxuJ1xuICAgICAgICAgICAgICAgIEBjb2RlID0gQGNvZGVbLi4uQGNodW5rSW5kZXhdICsgbmV3Q29kZVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgIyDilrhkYmcgJ2hlYWQnIG1hdGNoLmlucHV0Wy4uMTAwXVxuICAgICAgICBcbiAgICAgICAgXG4gICAgIyAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMDAwMDAwICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAwMDAgICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgIyBNYXRjaGVzIGlkZW50aWZ5aW5nIGxpdGVyYWxzOiB2YXJpYWJsZXMsIGtleXdvcmRzLCBtZXRob2QgbmFtZXMsIGV0Yy5cbiAgICAjIENoZWNrIHRvIGVuc3VyZSB0aGF0IEphdmFTY3JpcHQgcmVzZXJ2ZWQgd29yZHMgYXJlbid0IGJlaW5nIHVzZWQgYXMgaWRlbnRpZmllcnMuIFxuICAgICMgQmVjYXVzZSBLb2ZmZWUgcmVzZXJ2ZXMgYSBoYW5kZnVsIG9mIGtleXdvcmRzIHRoYXQgYXJlIGFsbG93ZWQgaW4gSmF2YVNjcmlwdCwgXG4gICAgIyB3ZSdyZSBjYXJlZnVsIG5vdCB0byB0YWcgdGhlbSBhcyBrZXl3b3JkcyB3aGVuIHJlZmVyZW5jZWQgYXMgcHJvcGVydHkgbmFtZXMgaGVyZSwgXG4gICAgIyBzbyB5b3UgY2FuIHN0aWxsIGRvIGBqUXVlcnkuaXMoKWAgZXZlbiB0aG91Z2ggYGlzYCBtZWFucyBgPT09YCBvdGhlcndpc2UuXG4gICAgXG4gICAgaWRlbnRpZmllclRva2VuOiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIDAgdW5sZXNzIG1hdGNoID0gSURFTlRJRklFUi5leGVjIEBjaHVua1xuICAgICAgICBbaW5wdXQsIGlkLCBjb2xvbl0gPSBtYXRjaFxuXG4gICAgICAgIGlkTGVuZ3RoID0gaWQubGVuZ3RoICMgUHJlc2VydmUgbGVuZ3RoIG9mIGlkIGZvciBsb2NhdGlvbiBkYXRhXG4gICAgICAgIHBvcHBlZFRva2VuID0gdW5kZWZpbmVkXG5cbiAgICAgICAgaWYgaWQgaXMgJ293bicgYW5kIEB0YWcoKSBpcyAnRk9SJ1xuICAgICAgICAgICAgQHRva2VuICdPV04nLCBpZFxuICAgICAgICAgICAgcmV0dXJuIGlkLmxlbmd0aFxuICAgICAgICBpZiBpZCBpcyAnZnJvbScgYW5kIEB0YWcoKSBpcyAnWUlFTEQnXG4gICAgICAgICAgICBAdG9rZW4gJ0ZST00nLCBpZFxuICAgICAgICAgICAgcmV0dXJuIGlkLmxlbmd0aFxuICAgICAgICBpZiBpZCBpcyAnYXMnIGFuZCBAc2VlbkltcG9ydFxuICAgICAgICAgICAgaWYgQHZhbHVlKCkgaXMgJyonXG4gICAgICAgICAgICAgICAgQHRva2Vuc1tAdG9rZW5zLmxlbmd0aCAtIDFdWzBdID0gJ0lNUE9SVF9BTEwnXG4gICAgICAgICAgICBlbHNlIGlmIEB2YWx1ZSgpIGluIENPRkZFRV9LRVlXT1JEU1xuICAgICAgICAgICAgICAgIEB0b2tlbnNbQHRva2Vucy5sZW5ndGggLSAxXVswXSA9ICdJREVOVElGSUVSJ1xuICAgICAgICAgICAgaWYgQHRhZygpIGluIFsnREVGQVVMVCcgJ0lNUE9SVF9BTEwnICdJREVOVElGSUVSJ11cbiAgICAgICAgICAgICAgICBAdG9rZW4gJ0FTJywgaWRcbiAgICAgICAgICAgICAgICByZXR1cm4gaWQubGVuZ3RoXG4gICAgICAgIGlmIGlkIGlzICdhcycgYW5kIEBzZWVuRXhwb3J0IGFuZCBAdGFnKCkgaW4gWydJREVOVElGSUVSJyAnREVGQVVMVCddXG4gICAgICAgICAgICBAdG9rZW4gJ0FTJywgaWRcbiAgICAgICAgICAgIHJldHVybiBpZC5sZW5ndGhcbiAgICAgICAgaWYgaWQgaXMgJ2RlZmF1bHQnIGFuZCBAc2VlbkV4cG9ydCBhbmQgQHRhZygpIGluIFsnRVhQT1JUJyAnQVMnXVxuICAgICAgICAgICAgQHRva2VuICdERUZBVUxUJywgaWRcbiAgICAgICAgICAgIHJldHVybiBpZC5sZW5ndGhcblxuICAgICAgICBbLi4uLCBwcmV2XSA9IEB0b2tlbnNcblxuICAgICAgICB0YWcgPVxuICAgICAgICAgICAgaWYgY29sb24gb3IgcHJldj8gYW5kIChwcmV2WzBdIGluIFsnLicgJz8uJyAnOjonICc/OjonXSBvciBub3QgcHJldi5zcGFjZWQgYW5kIHByZXZbMF0gaXMgJ0AnKVxuICAgICAgICAgICAgICAgICdQUk9QRVJUWSdcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAnSURFTlRJRklFUidcblxuICAgICAgICBpZiB0YWcgaXMgJ0lERU5USUZJRVInIGFuZCBpZFswXSA9PSAn4pa4JyBhbmQgaWRbMS4uXSBpbiBNRVRBX0tFWVdPUkRTXG4gICAgICAgICAgICBpZiBpZCA9PSAn4pa4ZWxpZidcbiAgICAgICAgICAgICAgICBAdG9rZW4gJ01FVEFfRUxTRScsICdlbHNlJ1xuICAgICAgICAgICAgICAgIEB0b2tlbnNbLTFdLnNwYWNlZCA9IHRydWVcbiAgICAgICAgICAgICAgICB0YWcgPSAnTUVUQV9JRidcbiAgICAgICAgICAgICAgICBpZCAgPSAnaWYnXG4gICAgICAgICAgICBlbHNlIGlmIGlkID09ICfilrh0aGVuJ1xuICAgICAgICAgICAgICAgIHRhZyA9ICdUSEVOJ1xuICAgICAgICAgICAgICAgIGlkICA9ICd0aGVuJ1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGlkID0gaWRbMS4uXVxuICAgICAgICAgICAgICAgIHRhZyA9ICdNRVRBXycgKyBpZC50b1VwcGVyQ2FzZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgZWxzZSBpZiB0YWcgaXMgJ0lERU5USUZJRVInIGFuZCAoaWQgaW4gSlNfS0VZV09SRFMgb3IgaWQgaW4gQ09GRkVFX0tFWVdPUkRTKSBhbmQgbm90IChAZXhwb3J0U3BlY2lmaWVyTGlzdCBhbmQgaWQgaW4gQ09GRkVFX0tFWVdPUkRTKVxuICAgICAgICAgICAgdGFnID0gaWQudG9VcHBlckNhc2UoKVxuICAgICAgICAgICAgaWYgdGFnIGlzICdXSEVOJyBhbmQgQHRhZygpIGluIExJTkVfQlJFQUtcbiAgICAgICAgICAgICAgICB0YWcgPSAnTEVBRElOR19XSEVOJ1xuICAgICAgICAgICAgZWxzZSBpZiB0YWcgaXMgJ0ZPUidcbiAgICAgICAgICAgICAgICBAc2VlbkZvciA9IHllc1xuICAgICAgICAgICAgZWxzZSBpZiB0YWcgaXMgJ1VOTEVTUydcbiAgICAgICAgICAgICAgICB0YWcgPSAnSUYnXG4gICAgICAgICAgICBlbHNlIGlmIHRhZyBpcyAnSU1QT1JUJ1xuICAgICAgICAgICAgICAgIEBzZWVuSW1wb3J0ID0geWVzXG4gICAgICAgICAgICBlbHNlIGlmIHRhZyBpcyAnRVhQT1JUJ1xuICAgICAgICAgICAgICAgIEBzZWVuRXhwb3J0ID0geWVzXG4gICAgICAgICAgICBlbHNlIGlmIHRhZyBpbiBVTkFSWVxuICAgICAgICAgICAgICAgIHRhZyA9ICdVTkFSWSdcbiAgICAgICAgICAgIGVsc2UgaWYgdGFnIGluIFJFTEFUSU9OXG4gICAgICAgICAgICAgICAgaWYgdGFnICE9ICdJTlNUQU5DRU9GJyBhbmQgQHNlZW5Gb3JcbiAgICAgICAgICAgICAgICAgICAgdGFnID0gJ0ZPUicgKyB0YWdcbiAgICAgICAgICAgICAgICAgICAgQHNlZW5Gb3IgPSBub1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgdGFnID0gJ1JFTEFUSU9OJ1xuICAgICAgICAgICAgICAgICAgICBpZiBAdmFsdWUoKSBpcyAnISdcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcHBlZFRva2VuID0gQHRva2Vucy5wb3AoKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSAnIScgKyBpZFxuICAgICAgICBlbHNlIGlmIHRhZyBpcyAnSURFTlRJRklFUicgYW5kIEBzZWVuRm9yIGFuZCBpZCBpcyAnZnJvbScgYW5kIGlzRm9yRnJvbShwcmV2KVxuICAgICAgICAgICAgdGFnID0gJ0ZPUkZST00nXG4gICAgICAgICAgICBAc2VlbkZvciA9IG5vXG5cbiAgICAgICAgaWYgdGFnIGlzICdJREVOVElGSUVSJyBhbmQgaWQgaW4gUkVTRVJWRURcbiAgICAgICAgICAgIEBlcnJvciBcInJlc2VydmVkIHdvcmQgJyN7aWR9J1wiLCBsZW5ndGg6aWQubGVuZ3RoXG5cbiAgICAgICAgdW5sZXNzIHRhZyBpcyAnUFJPUEVSVFknXG4gICAgICAgICAgICBpZiBpZCBpbiBDT0ZGRUVfQUxJQVNFU1xuICAgICAgICAgICAgICAgIGFsaWFzID0gaWRcbiAgICAgICAgICAgICAgICBpZCA9IENPRkZFRV9BTElBU19NQVBbaWRdXG4gICAgICAgICAgICB0YWcgPSBzd2l0Y2ggaWRcbiAgICAgICAgICAgICAgICB3aGVuICchJyAgICAgICAgICAgICAgICAgICAgdGhlbiAnVU5BUlknXG4gICAgICAgICAgICAgICAgd2hlbiAnPT0nLCAnIT0nICAgICAgICAgICAgIHRoZW4gJ0NPTVBBUkUnXG4gICAgICAgICAgICAgICAgd2hlbiAndHJ1ZScsICdmYWxzZScgICAgICAgIHRoZW4gJ0JPT0wnXG4gICAgICAgICAgICAgICAgd2hlbiAnJiYnLCAnfHwnICAgICAgICAgICAgIHRoZW4gaWRcbiAgICAgICAgICAgICAgICB3aGVuICdicmVhaycsICdjb250aW51ZScsICdkZWJ1Z2dlcicgdGhlbiAnU1RBVEVNRU5UJ1xuICAgICAgICAgICAgICAgIGVsc2UgICAgdGFnXG5cbiAgICAgICAgdGFnVG9rZW4gPSBAdG9rZW4gdGFnLCBpZCwgMCwgaWRMZW5ndGhcbiAgICAgICAgdGFnVG9rZW4ub3JpZ2luID0gW3RhZywgYWxpYXMsIHRhZ1Rva2VuWzJdXSBpZiBhbGlhc1xuICAgICAgICBpZiBwb3BwZWRUb2tlblxuICAgICAgICAgICAgW3RhZ1Rva2VuWzJdLmZpcnN0X2xpbmUsIHRhZ1Rva2VuWzJdLmZpcnN0X2NvbHVtbl0gPVxuICAgICAgICAgICAgICAgIFtwb3BwZWRUb2tlblsyXS5maXJzdF9saW5lLCBwb3BwZWRUb2tlblsyXS5maXJzdF9jb2x1bW5dXG4gICAgICAgIGlmIGNvbG9uXG4gICAgICAgICAgICBjb2xvbk9mZnNldCA9IGlucHV0Lmxhc3RJbmRleE9mICc6J1xuICAgICAgICAgICAgQHRva2VuICc6JywgJzonLCBjb2xvbk9mZnNldCwgY29sb24ubGVuZ3RoXG5cbiAgICAgICAgaW5wdXQubGVuZ3RoXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMCAgICAgMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuXG4gICAgIyBNYXRjaGVzIG51bWJlcnMsIGluY2x1ZGluZyBkZWNpbWFscywgaGV4LCBhbmQgZXhwb25lbnRpYWwgbm90YXRpb24uXG4gICAgIyBCZSBjYXJlZnVsIG5vdCB0byBpbnRlcmZlcmUgd2l0aCByYW5nZXMtaW4tcHJvZ3Jlc3MuXG4gICAgXG4gICAgbnVtYmVyVG9rZW46IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gMCB1bmxlc3MgbWF0Y2ggPSBOVU1CRVIuZXhlYyBAY2h1bmtcblxuICAgICAgICBudW1iZXIgPSBtYXRjaFswXVxuICAgICAgICBsZXhlZExlbmd0aCA9IG51bWJlci5sZW5ndGhcblxuICAgICAgICBzd2l0Y2hcbiAgICAgICAgICAgIHdoZW4gL14wW0JPWF0vLnRlc3QgbnVtYmVyXG4gICAgICAgICAgICAgICAgQGVycm9yIFwicmFkaXggcHJlZml4IGluICcje251bWJlcn0nIG11c3QgYmUgbG93ZXJjYXNlXCIsIG9mZnNldDogMVxuICAgICAgICAgICAgd2hlbiAvXig/ITB4KS4qRS8udGVzdCBudW1iZXJcbiAgICAgICAgICAgICAgICBAZXJyb3IgXCJleHBvbmVudGlhbCBub3RhdGlvbiBpbiAnI3tudW1iZXJ9JyBtdXN0IGJlIGluZGljYXRlZCB3aXRoIGEgbG93ZXJjYXNlICdlJ1wiLFxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IG51bWJlci5pbmRleE9mKCdFJylcbiAgICAgICAgICAgIHdoZW4gL14wXFxkKls4OV0vLnRlc3QgbnVtYmVyXG4gICAgICAgICAgICAgICAgQGVycm9yIFwiZGVjaW1hbCBsaXRlcmFsICcje251bWJlcn0nIG11c3Qgbm90IGJlIHByZWZpeGVkIHdpdGggJzAnXCIsIGxlbmd0aDogbGV4ZWRMZW5ndGhcbiAgICAgICAgICAgIHdoZW4gL14wXFxkKy8udGVzdCBudW1iZXJcbiAgICAgICAgICAgICAgICBAZXJyb3IgXCJvY3RhbCBsaXRlcmFsICcje251bWJlcn0nIG11c3QgYmUgcHJlZml4ZWQgd2l0aCAnMG8nXCIsIGxlbmd0aDogbGV4ZWRMZW5ndGhcblxuICAgICAgICBiYXNlID0gc3dpdGNoIG51bWJlci5jaGFyQXQgMVxuICAgICAgICAgICAgd2hlbiAnYicgdGhlbiAyXG4gICAgICAgICAgICB3aGVuICdvJyB0aGVuIDhcbiAgICAgICAgICAgIHdoZW4gJ3gnIHRoZW4gMTZcbiAgICAgICAgICAgIGVsc2UgbnVsbFxuICAgICAgICBudW1iZXJWYWx1ZSA9IGlmIGJhc2U/IHRoZW4gcGFyc2VJbnQobnVtYmVyWzIuLl0sIGJhc2UpIGVsc2UgcGFyc2VGbG9hdChudW1iZXIpXG4gICAgICAgIGlmIG51bWJlci5jaGFyQXQoMSkgaW4gWydiJywgJ28nXVxuICAgICAgICAgICAgbnVtYmVyID0gXCIweCN7bnVtYmVyVmFsdWUudG9TdHJpbmcgMTZ9XCJcblxuICAgICAgICB0YWcgPSBpZiBudW1iZXJWYWx1ZSBpcyBJbmZpbml0eSB0aGVuICdJTkZJTklUWScgZWxzZSAnTlVNQkVSJ1xuICAgICAgICBAdG9rZW4gdGFnLCBudW1iZXIsIDAsIGxleGVkTGVuZ3RoXG4gICAgICAgIGxleGVkTGVuZ3RoXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgICMgTWF0Y2hlcyBzdHJpbmdzLCBpbmNsdWRpbmcgbXVsdGktbGluZSBzdHJpbmdzLCBhcyB3ZWxsIGFzIGhlcmVkb2NzLCB3aXRoIG9yIHdpdGhvdXQgaW50ZXJwb2xhdGlvbi5cbiAgICBcbiAgICBzdHJpbmdUb2tlbjogLT5cbiAgICAgICAgXG4gICAgICAgIFtxdW90ZV0gPSBTVFJJTkdfU1RBUlQuZXhlYyhAY2h1bmspIHx8IFtdXG4gICAgICAgIHJldHVybiAwIGlmIG5vdCBxdW90ZVxuXG4gICAgICAgICMgSWYgdGhlIHByZWNlZGluZyB0b2tlbiBpcyBgZnJvbWAgYW5kIHRoaXMgaXMgYW4gaW1wb3J0IG9yIGV4cG9ydCBzdGF0ZW1lbnQsIHByb3Blcmx5IHRhZyB0aGUgYGZyb21gLlxuICAgICAgICBcbiAgICAgICAgaWYgQHRva2Vucy5sZW5ndGggYW5kIEB2YWx1ZSgpIGlzICdmcm9tJyBhbmQgKEBzZWVuSW1wb3J0IG9yIEBzZWVuRXhwb3J0KVxuICAgICAgICAgICAgQHRva2Vuc1tAdG9rZW5zLmxlbmd0aCAtIDFdWzBdID0gJ0ZST00nXG5cbiAgICAgICAgcmVnZXggPSBzd2l0Y2ggcXVvdGVcbiAgICAgICAgICAgIHdoZW4gXCInXCIgICB0aGVuIFNUUklOR19TSU5HTEVcbiAgICAgICAgICAgIHdoZW4gJ1wiJyAgIHRoZW4gU1RSSU5HX0RPVUJMRVxuICAgICAgICAgICAgd2hlbiBcIicnJ1wiIHRoZW4gSEVSRURPQ19TSU5HTEVcbiAgICAgICAgICAgIHdoZW4gJ1wiXCJcIicgdGhlbiBIRVJFRE9DX0RPVUJMRVxuICAgICAgICBoZXJlZG9jID0gcXVvdGUubGVuZ3RoIGlzIDNcblxuICAgICAgICB7dG9rZW5zLCBpbmRleDogZW5kfSA9IEBtYXRjaFdpdGhJbnRlcnBvbGF0aW9ucyByZWdleCwgcXVvdGVcbiAgICAgICAgJCA9IHRva2Vucy5sZW5ndGggLSAxXG5cbiAgICAgICAgZGVsaW1pdGVyID0gcXVvdGUuY2hhckF0KDApXG4gICAgICAgIGlmIGhlcmVkb2NcbiAgICAgICAgICAgICMgRmluZCB0aGUgc21hbGxlc3QgaW5kZW50YXRpb24uIEl0IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIGFsbCBsaW5lcyBsYXRlci5cbiAgICAgICAgICAgIGluZGVudCA9IG51bGxcbiAgICAgICAgICAgIGRvYyA9ICh0b2tlblsxXSBmb3IgdG9rZW4sIGkgaW4gdG9rZW5zIHdoZW4gdG9rZW5bMF0gaXMgJ05FT1NUUklORycpLmpvaW4gJyN7fSdcbiAgICAgICAgICAgIHdoaWxlIG1hdGNoID0gSEVSRURPQ19JTkRFTlQuZXhlYyBkb2NcbiAgICAgICAgICAgICAgICBhdHRlbXB0ID0gbWF0Y2hbMV1cbiAgICAgICAgICAgICAgICBpbmRlbnQgPSBhdHRlbXB0IGlmIGluZGVudCBpcyBudWxsIG9yIDAgPCBhdHRlbXB0Lmxlbmd0aCA8IGluZGVudC5sZW5ndGhcbiAgICAgICAgICAgIGluZGVudFJlZ2V4ID0gLy8vIFxcbiN7aW5kZW50fSAvLy9nIGlmIGluZGVudFxuICAgICAgICAgICAgQG1lcmdlSW50ZXJwb2xhdGlvblRva2VucyB0b2tlbnMsIHtkZWxpbWl0ZXJ9LCAodmFsdWUsIGkpID0+XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBAZm9ybWF0U3RyaW5nIHZhbHVlLCBkZWxpbWl0ZXI6IHF1b3RlXG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlIGluZGVudFJlZ2V4LCAnXFxuJyBpZiBpbmRlbnRSZWdleFxuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZSBMRUFESU5HX0JMQU5LX0xJTkUsICAnJyBpZiBpIGlzIDBcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UgVFJBSUxJTkdfQkxBTktfTElORSwgJycgaWYgaSBpcyAkXG4gICAgICAgICAgICAgICAgdmFsdWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQG1lcmdlSW50ZXJwb2xhdGlvblRva2VucyB0b2tlbnMsIHtkZWxpbWl0ZXJ9LCAodmFsdWUsIGkpID0+XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBAZm9ybWF0U3RyaW5nIHZhbHVlLCBkZWxpbWl0ZXI6IHF1b3RlXG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlIFNJTVBMRV9TVFJJTkdfT01JVCwgKG1hdGNoLCBvZmZzZXQpIC0+XG4gICAgICAgICAgICAgICAgICAgIGlmIChpIGlzIDAgYW5kIG9mZnNldCBpcyAwKSBvclxuICAgICAgICAgICAgICAgICAgICAgICAgIChpIGlzICQgYW5kIG9mZnNldCArIG1hdGNoLmxlbmd0aCBpcyB2YWx1ZS5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAnJ1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAnICdcbiAgICAgICAgICAgICAgICB2YWx1ZVxuICAgICAgICBlbmRcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBjb21tZW50VG9rZW46IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gMCB1bmxlc3MgbWF0Y2ggPSBAY2h1bmsubWF0Y2ggQ09NTUVOVFxuICAgICAgICBbY29tbWVudCwgaGVyZV0gPSBtYXRjaFxuICAgICAgICBpZiBoZXJlXG4gICAgICAgICAgICBpZiBtYXRjaCA9IEhFUkVDT01NRU5UX0lMTEVHQUwuZXhlYyBjb21tZW50XG4gICAgICAgICAgICAgICAgQGVycm9yIFwiYmxvY2sgY29tbWVudHMgY2Fubm90IGNvbnRhaW4gI3ttYXRjaFswXX1cIixcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiBtYXRjaC5pbmRleCwgbGVuZ3RoOiBtYXRjaFswXS5sZW5ndGhcbiAgICAgICAgICAgIGlmIGhlcmUuaW5kZXhPZignXFxuJykgPj0gMFxuICAgICAgICAgICAgICAgIGhlcmUgPSBoZXJlLnJlcGxhY2UgLy8vIFxcbiAje3JlcGVhdCAnICcsIEBpbmRlbnR9IC8vL2csICdcXG4nXG4gICAgICAgICAgICBAdG9rZW4gJ0hFUkVDT01NRU5UJywgaGVyZSwgMCwgY29tbWVudC5sZW5ndGhcbiAgICAgICAgY29tbWVudC5sZW5ndGhcbiAgICAgICAgXG4gICAgIyAgICAgICAwMDAgICAwMDAwMDAwICBcbiAgICAjICAgICAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgICAgICAgMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgICAgICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgICMgTWF0Y2hlcyBKYXZhU2NyaXB0IGludGVycG9sYXRlZCBkaXJlY3RseSBpbnRvIHRoZSBzb3VyY2UgdmlhIGJhY2t0aWNrcy5cbiAgICBcbiAgICBqc1Rva2VuOiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIDAgdW5sZXNzIEBjaHVuay5jaGFyQXQoMCkgaXMgJ2AnIGFuZFxuICAgICAgICAgICAgKG1hdGNoID0gSEVSRV9KU1RPS0VOLmV4ZWMoQGNodW5rKSBvciBKU1RPS0VOLmV4ZWMoQGNodW5rKSlcbiAgICAgICAgIyBDb252ZXJ0IGVzY2FwZWQgYmFja3RpY2tzIHRvIGJhY2t0aWNrcywgYW5kIGVzY2FwZWQgYmFja3NsYXNoZXNcbiAgICAgICAgIyBqdXN0IGJlZm9yZSBlc2NhcGVkIGJhY2t0aWNrcyB0byBiYWNrc2xhc2hlc1xuICAgICAgICBzY3JpcHQgPSBtYXRjaFsxXS5yZXBsYWNlIC9cXFxcKyhgfCQpL2csIChzdHJpbmcpIC0+XG4gICAgICAgICAgICAjIGBzdHJpbmdgIGlzIGFsd2F5cyBhIHZhbHVlIGxpa2UgJ1xcYCcsICdcXFxcXFxgJywgJ1xcXFxcXFxcXFxgJywgZXRjLlxuICAgICAgICAgICAgIyBCeSByZWR1Y2luZyBpdCB0byBpdHMgbGF0dGVyIGhhbGYsIHdlIHR1cm4gJ1xcYCcgdG8gJ2AnLCAnXFxcXFxcYCcgdG8gJ1xcYCcsIGV0Yy5cbiAgICAgICAgICAgIHN0cmluZ1stTWF0aC5jZWlsKHN0cmluZy5sZW5ndGggLyAyKS4uXVxuICAgICAgICBAdG9rZW4gJ0pTJywgc2NyaXB0LCAwLCBtYXRjaFswXS5sZW5ndGhcbiAgICAgICAgbWF0Y2hbMF0ubGVuZ3RoXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAwMDAwICAwMDAwMDAwICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgICMgTWF0Y2hlcyByZWd1bGFyIGV4cHJlc3Npb24gbGl0ZXJhbHMsIGFzIHdlbGwgYXMgbXVsdGlsaW5lIGV4dGVuZGVkIG9uZXMuXG4gICAgIyBMZXhpbmcgcmVndWxhciBleHByZXNzaW9ucyBpcyBkaWZmaWN1bHQgdG8gZGlzdGluZ3Vpc2ggZnJvbSBkaXZpc2lvbiwgXG4gICAgIyBzbyB3ZSBib3Jyb3cgc29tZSBiYXNpYyBoZXVyaXN0aWNzIGZyb20gSmF2YVNjcmlwdCBhbmQgUnVieS5cbiAgICBcbiAgICByZWdleFRva2VuOiAtPlxuICAgICAgICBcbiAgICAgICAgc3dpdGNoXG4gICAgICAgICAgICB3aGVuIG1hdGNoID0gUkVHRVhfSUxMRUdBTC5leGVjIEBjaHVua1xuICAgICAgICAgICAgICAgIEBlcnJvciBcInJlZ3VsYXIgZXhwcmVzc2lvbnMgY2Fubm90IGJlZ2luIHdpdGggI3ttYXRjaFsyXX1cIixcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiBtYXRjaC5pbmRleCArIG1hdGNoWzFdLmxlbmd0aFxuICAgICAgICAgICAgd2hlbiBtYXRjaCA9IEBtYXRjaFdpdGhJbnRlcnBvbGF0aW9ucyBIRVJFR0VYLCAnLy8vJ1xuICAgICAgICAgICAgICAgIHt0b2tlbnMsIGluZGV4fSA9IG1hdGNoXG4gICAgICAgICAgICB3aGVuIG1hdGNoID0gUkVHRVguZXhlYyBAY2h1bmtcbiAgICAgICAgICAgICAgICBbcmVnZXgsIGJvZHksIGNsb3NlZF0gPSBtYXRjaFxuICAgICAgICAgICAgICAgIEB2YWxpZGF0ZUVzY2FwZXMgYm9keSwgaXNSZWdleDogeWVzLCBvZmZzZXRJbkNodW5rOiAxXG4gICAgICAgICAgICAgICAgYm9keSA9IEBmb3JtYXRSZWdleCBib2R5LCBkZWxpbWl0ZXI6ICcvJ1xuICAgICAgICAgICAgICAgIGluZGV4ID0gcmVnZXgubGVuZ3RoXG4gICAgICAgICAgICAgICAgWy4uLiwgcHJldl0gPSBAdG9rZW5zXG4gICAgICAgICAgICAgICAgaWYgcHJldlxuICAgICAgICAgICAgICAgICAgICBpZiBwcmV2LnNwYWNlZCBhbmQgcHJldlswXSBpbiBDQUxMQUJMRVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDAgaWYgbm90IGNsb3NlZCBvciBQT1NTSUJMWV9ESVZJU0lPTi50ZXN0IHJlZ2V4XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgcHJldlswXSBpbiBOT1RfUkVHRVhcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgICAgICAgICAgQGVycm9yICdtaXNzaW5nIC8gKHVuY2xvc2VkIHJlZ2V4KScgdW5sZXNzIGNsb3NlZFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiAwXG5cbiAgICAgICAgW2ZsYWdzXSA9IFJFR0VYX0ZMQUdTLmV4ZWMgQGNodW5rW2luZGV4Li5dXG4gICAgICAgIGVuZCA9IGluZGV4ICsgZmxhZ3MubGVuZ3RoXG4gICAgICAgIG9yaWdpbiA9IEBtYWtlVG9rZW4gJ1JFR0VYJywgbnVsbCwgMCwgZW5kXG4gICAgICAgIHN3aXRjaFxuICAgICAgICAgICAgd2hlbiBub3QgVkFMSURfRkxBR1MudGVzdCBmbGFnc1xuICAgICAgICAgICAgICAgIEBlcnJvciBcImludmFsaWQgcmVndWxhciBleHByZXNzaW9uIGZsYWdzICN7ZmxhZ3N9XCIsIG9mZnNldDogaW5kZXgsIGxlbmd0aDogZmxhZ3MubGVuZ3RoXG4gICAgICAgICAgICB3aGVuIHJlZ2V4IG9yIHRva2Vucy5sZW5ndGggaXMgMVxuICAgICAgICAgICAgICAgIGJvZHkgPz0gQGZvcm1hdEhlcmVnZXggdG9rZW5zWzBdWzFdXG4gICAgICAgICAgICAgICAgQHRva2VuICdSRUdFWCcsIFwiI3tAbWFrZURlbGltaXRlZExpdGVyYWwgYm9keSwgZGVsaW1pdGVyOiAnLyd9I3tmbGFnc31cIiwgMCwgZW5kLCBvcmlnaW5cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAdG9rZW4gJ1JFR0VYX1NUQVJUJywgJygnLCAwLCAwLCBvcmlnaW5cbiAgICAgICAgICAgICAgICBAdG9rZW4gJ0lERU5USUZJRVInLCAnUmVnRXhwJywgMCwgMFxuICAgICAgICAgICAgICAgIEB0b2tlbiAnQ0FMTF9TVEFSVCcsICcoJywgMCwgMFxuICAgICAgICAgICAgICAgIEBtZXJnZUludGVycG9sYXRpb25Ub2tlbnMgdG9rZW5zLCB7ZGVsaW1pdGVyOiAnXCInLCBkb3VibGU6IHllc30sIEBmb3JtYXRIZXJlZ2V4XG4gICAgICAgICAgICAgICAgaWYgZmxhZ3NcbiAgICAgICAgICAgICAgICAgICAgQHRva2VuICcsJywgJywnLCBpbmRleCAtIDEsIDBcbiAgICAgICAgICAgICAgICAgICAgQHRva2VuICdTVFJJTkcnLCAnXCInICsgZmxhZ3MgKyAnXCInLCBpbmRleCAtIDEsIGZsYWdzLmxlbmd0aFxuICAgICAgICAgICAgICAgIEB0b2tlbiAnKScsICcpJywgZW5kIC0gMSwgMFxuICAgICAgICAgICAgICAgIEB0b2tlbiAnUkVHRVhfRU5EJywgJyknLCBlbmQgLSAxLCAwXG5cbiAgICAgICAgZW5kXG5cbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgICMgTWF0Y2hlcyBuZXdsaW5lcywgaW5kZW50cywgYW5kIG91dGRlbnRzLCBhbmQgZGV0ZXJtaW5lcyB3aGljaCBpcyB3aGljaC5cbiAgICAjIElmIHdlIGNhbiBkZXRlY3QgdGhhdCB0aGUgY3VycmVudCBsaW5lIGlzIGNvbnRpbnVlZCBvbnRvIHRoZSBuZXh0IGxpbmUsXG4gICAgIyB0aGVuIHRoZSBuZXdsaW5lIGlzIHN1cHByZXNzZWQ6XG4gICAgI1xuICAgICMgICAgICAgICAgIGVsZW1lbnRzXG4gICAgIyAgICAgICAgICAgICAgIC5lYWNoKCAuLi4gKVxuICAgICMgICAgICAgICAgICAgICAubWFwKCAuLi4gKVxuICAgICNcbiAgICAjIEtlZXBzIHRyYWNrIG9mIHRoZSBsZXZlbCBvZiBpbmRlbnRhdGlvbiwgYmVjYXVzZSBhIHNpbmdsZSBvdXRkZW50IHRva2VuXG4gICAgIyBjYW4gY2xvc2UgbXVsdGlwbGUgaW5kZW50cywgc28gd2UgbmVlZCB0byBrbm93IGhvdyBmYXIgaW4gd2UgaGFwcGVuIHRvIGJlLlxuICAgIFxuICAgIGxpbmVUb2tlbjogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiAwIHVubGVzcyBtYXRjaCA9IE1VTFRJX0RFTlQuZXhlYyBAY2h1bmtcbiAgICAgICAgaW5kZW50ID0gbWF0Y2hbMF1cblxuICAgICAgICBAc2VlbkZvciAgICA9IG5vXG4gICAgICAgIEBzZWVuSW1wb3J0ID0gbm8gdW5sZXNzIEBpbXBvcnRTcGVjaWZpZXJMaXN0XG4gICAgICAgIEBzZWVuRXhwb3J0ID0gbm8gdW5sZXNzIEBleHBvcnRTcGVjaWZpZXJMaXN0XG5cbiAgICAgICAgc2l6ZSA9IGluZGVudC5sZW5ndGggLSAxIC0gaW5kZW50Lmxhc3RJbmRleE9mICdcXG4nXG4gICAgICAgIG5vTmV3bGluZXMgPSBAdW5maW5pc2hlZCgpXG5cbiAgICAgICAgaWYgc2l6ZSAtIEBpbmRlYnQgaXMgQGluZGVudFxuICAgICAgICAgICAgaWYgbm9OZXdsaW5lcyB0aGVuIEBzdXBwcmVzc05ld2xpbmVzKCkgZWxzZSBAbmV3bGluZVRva2VuIDBcbiAgICAgICAgICAgIHJldHVybiBpbmRlbnQubGVuZ3RoXG5cbiAgICAgICAgaWYgc2l6ZSA+IEBpbmRlbnRcbiAgICAgICAgICAgIGlmIG5vTmV3bGluZXNcbiAgICAgICAgICAgICAgICBAaW5kZWJ0ID0gc2l6ZSAtIEBpbmRlbnRcbiAgICAgICAgICAgICAgICBAc3VwcHJlc3NOZXdsaW5lcygpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGluZGVudC5sZW5ndGhcbiAgICAgICAgICAgIHVubGVzcyBAdG9rZW5zLmxlbmd0aFxuICAgICAgICAgICAgICAgIEBiYXNlSW5kZW50ID0gQGluZGVudCA9IHNpemVcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5kZW50Lmxlbmd0aFxuICAgICAgICAgICAgZGlmZiA9IHNpemUgLSBAaW5kZW50ICsgQG91dGRlYnRcbiAgICAgICAgICAgIEB0b2tlbiAnSU5ERU5UJywgZGlmZiwgaW5kZW50Lmxlbmd0aCAtIHNpemUsIHNpemVcbiAgICAgICAgICAgIEBpbmRlbnRzLnB1c2ggZGlmZlxuICAgICAgICAgICAgQGVuZHMucHVzaCB7dGFnOiAnT1VUREVOVCd9XG4gICAgICAgICAgICBAb3V0ZGVidCA9IEBpbmRlYnQgPSAwXG4gICAgICAgICAgICBAaW5kZW50ID0gc2l6ZVxuICAgICAgICBlbHNlIGlmIHNpemUgPCBAYmFzZUluZGVudFxuICAgICAgICAgICAgQGVycm9yICdtaXNzaW5nIGluZGVudGF0aW9uJywgb2Zmc2V0OiBpbmRlbnQubGVuZ3RoXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBpbmRlYnQgPSAwXG4gICAgICAgICAgICBAb3V0ZGVudFRva2VuIEBpbmRlbnQgLSBzaXplLCBub05ld2xpbmVzLCBpbmRlbnQubGVuZ3RoXG4gICAgICAgIGluZGVudC5sZW5ndGhcblxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAgICAwMDAgICAgIFxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgICMgUmVjb3JkIGFuIG91dGRlbnQgdG9rZW4gb3IgbXVsdGlwbGUgdG9rZW5zLCBpZiB3ZSBoYXBwZW4gdG8gYmUgbW92aW5nIGJhY2tcbiAgICAjIGlud2FyZHMgcGFzdCBzZXZlcmFsIHJlY29yZGVkIGluZGVudHMuIFNldHMgbmV3IEBpbmRlbnQgdmFsdWUuXG4gICAgXG4gICAgb3V0ZGVudFRva2VuOiAobW92ZU91dCwgbm9OZXdsaW5lcywgb3V0ZGVudExlbmd0aCkgLT5cbiAgICAgICAgXG4gICAgICAgIGRlY3JlYXNlZEluZGVudCA9IEBpbmRlbnQgLSBtb3ZlT3V0XG4gICAgICAgIHdoaWxlIG1vdmVPdXQgPiAwXG4gICAgICAgICAgICBsYXN0SW5kZW50ID0gQGluZGVudHNbQGluZGVudHMubGVuZ3RoIC0gMV1cbiAgICAgICAgICAgIGlmIG5vdCBsYXN0SW5kZW50XG4gICAgICAgICAgICAgICAgbW92ZU91dCA9IDBcbiAgICAgICAgICAgIGVsc2UgaWYgbGFzdEluZGVudCBpcyBAb3V0ZGVidFxuICAgICAgICAgICAgICAgIG1vdmVPdXQgLT0gQG91dGRlYnRcbiAgICAgICAgICAgICAgICBAb3V0ZGVidCA9IDBcbiAgICAgICAgICAgIGVsc2UgaWYgbGFzdEluZGVudCA8IEBvdXRkZWJ0XG4gICAgICAgICAgICAgICAgQG91dGRlYnQgLT0gbGFzdEluZGVudFxuICAgICAgICAgICAgICAgIG1vdmVPdXQgIC09IGxhc3RJbmRlbnRcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBkZW50ID0gQGluZGVudHMucG9wKCkgKyBAb3V0ZGVidFxuICAgICAgICAgICAgICAgIGlmIG91dGRlbnRMZW5ndGggYW5kIEBjaHVua1tvdXRkZW50TGVuZ3RoXSBpbiBJTkRFTlRBQkxFX0NMT1NFUlNcbiAgICAgICAgICAgICAgICAgICAgZGVjcmVhc2VkSW5kZW50IC09IGRlbnQgLSBtb3ZlT3V0XG4gICAgICAgICAgICAgICAgICAgIG1vdmVPdXQgPSBkZW50XG4gICAgICAgICAgICAgICAgQG91dGRlYnQgPSAwXG4gICAgICAgICAgICAgICAgIyBwYWlyIG1pZ2h0IGNhbGwgb3V0ZGVudFRva2VuLCBzbyBwcmVzZXJ2ZSBkZWNyZWFzZWRJbmRlbnRcbiAgICAgICAgICAgICAgICBAcGFpciAnT1VUREVOVCdcbiAgICAgICAgICAgICAgICBAdG9rZW4gJ09VVERFTlQnLCBtb3ZlT3V0LCAwLCBvdXRkZW50TGVuZ3RoXG4gICAgICAgICAgICAgICAgbW92ZU91dCAtPSBkZW50XG4gICAgICAgIEBvdXRkZWJ0IC09IG1vdmVPdXQgaWYgZGVudFxuICAgICAgICBAdG9rZW5zLnBvcCgpIHdoaWxlIEB2YWx1ZSgpIGlzICc7J1xuXG4gICAgICAgIEB0b2tlbiAnVEVSTUlOQVRPUicsICdcXG4nLCBvdXRkZW50TGVuZ3RoLCAwIHVubGVzcyBAdGFnKCkgaXMgJ1RFUk1JTkFUT1InIG9yIG5vTmV3bGluZXNcbiAgICAgICAgQGluZGVudCA9IGRlY3JlYXNlZEluZGVudFxuICAgICAgICB0aGlzXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwICAgICAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICAjIE1hdGNoZXMgYW5kIGNvbnN1bWVzIG5vbi1tZWFuaW5nZnVsIHdoaXRlc3BhY2UuIFRhZyB0aGUgcHJldmlvdXMgdG9rZW5cbiAgICAjIGFzIGJlaW5nIOKAnHNwYWNlZOKAnSwgYmVjYXVzZSB0aGVyZSBhcmUgc29tZSBjYXNlcyB3aGVyZSBpdCBtYWtlcyBhIGRpZmZlcmVuY2UuXG4gICAgXG4gICAgd2hpdGVzcGFjZVRva2VuOiAtPlxuICAgICAgICByZXR1cm4gMCB1bmxlc3MgKG1hdGNoID0gV0hJVEVTUEFDRS5leGVjIEBjaHVuaykgb3IgKG5saW5lID0gQGNodW5rLmNoYXJBdCgwKSBpcyAnXFxuJylcbiAgICAgICAgWy4uLiwgcHJldl0gPSBAdG9rZW5zXG4gICAgICAgIHByZXZbaWYgbWF0Y2ggdGhlbiAnc3BhY2VkJyBlbHNlICduZXdMaW5lJ10gPSB0cnVlIGlmIHByZXZcbiAgICAgICAgaWYgbWF0Y2ggdGhlbiBtYXRjaFswXS5sZW5ndGggZWxzZSAwXG5cbiAgICAjIEdlbmVyYXRlIGEgbmV3bGluZSB0b2tlbi4gQ29uc2VjdXRpdmUgbmV3bGluZXMgZ2V0IG1lcmdlZCB0b2dldGhlci5cbiAgICBcbiAgICBuZXdsaW5lVG9rZW46IChvZmZzZXQpIC0+XG4gICAgICAgIEB0b2tlbnMucG9wKCkgd2hpbGUgQHZhbHVlKCkgaXMgJzsnXG4gICAgICAgIEB0b2tlbiAnVEVSTUlOQVRPUicsICdcXG4nLCBvZmZzZXQsIDAgdW5sZXNzIEB0YWcoKSBpcyAnVEVSTUlOQVRPUidcbiAgICAgICAgdGhpc1xuXG4gICAgIyBVc2UgYSBgXFxgIGF0IGEgbGluZS1lbmRpbmcgdG8gc3VwcHJlc3MgdGhlIG5ld2xpbmUuXG4gICAgIyBUaGUgc2xhc2ggaXMgcmVtb3ZlZCBoZXJlIG9uY2UgaXRzIGpvYiBpcyBkb25lLlxuICAgIFxuICAgIHN1cHByZXNzTmV3bGluZXM6IC0+XG4gICAgICAgIEB0b2tlbnMucG9wKCkgaWYgQHZhbHVlKCkgaXMgJ1xcXFwnXG4gICAgICAgIHRoaXNcblxuICAgICMgMDAwICAgICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgXG4gICAgIyAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgICAgIFxuICAgICMgMDAwICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgXG4gICAgIyAwMDAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICBcbiAgICBcbiAgICAjIFdlIHRyZWF0IGFsbCBvdGhlciBzaW5nbGUgY2hhcmFjdGVycyBhcyBhIHRva2VuLiBFLmcuOiBgKCApICwgLiAhYFxuICAgICMgTXVsdGktY2hhcmFjdGVyIG9wZXJhdG9ycyBhcmUgYWxzbyBsaXRlcmFsIHRva2Vucywgc28gdGhhdCBKaXNvbiBjYW4gYXNzaWduXG4gICAgIyB0aGUgcHJvcGVyIG9yZGVyIG9mIG9wZXJhdGlvbnMuIFRoZXJlIGFyZSBzb21lIHN5bWJvbHMgdGhhdCB3ZSB0YWcgc3BlY2lhbGx5XG4gICAgIyBoZXJlLiBgO2AgYW5kIG5ld2xpbmVzIGFyZSBib3RoIHRyZWF0ZWQgYXMgYSBgVEVSTUlOQVRPUmAsIHdlIGRpc3Rpbmd1aXNoXG4gICAgIyBwYXJlbnRoZXNlcyB0aGF0IGluZGljYXRlIGEgbWV0aG9kIGNhbGwgZnJvbSByZWd1bGFyIHBhcmVudGhlc2VzLCBhbmQgc28gb24uXG4gICAgXG4gICAgbGl0ZXJhbFRva2VuOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgbWF0Y2ggPSBPUEVSQVRPUi5leGVjIEBjaHVua1xuICAgICAgICAgICAgW3ZhbHVlXSA9IG1hdGNoXG4gICAgICAgICAgICBAdGFnUGFyYW1ldGVycygpIGlmIENPREUudGVzdCB2YWx1ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB2YWx1ZSA9IEBjaHVuay5jaGFyQXQgMFxuICAgICAgICB0YWcgID0gdmFsdWVcbiAgICAgICAgWy4uLiwgcHJldl0gPSBAdG9rZW5zXG5cbiAgICAgICAgaWYgcHJldiBhbmQgdmFsdWUgaW4gWyc9JywgQ09NUE9VTkRfQVNTSUdOLi4uXVxuICAgICAgICAgICAgc2tpcFRva2VuID0gZmFsc2VcbiAgICAgICAgICAgIGlmIHZhbHVlIGlzICc9JyBhbmQgcHJldlsxXSBpbiBbJ3x8JywgJyYmJ10gYW5kIG5vdCBwcmV2LnNwYWNlZFxuICAgICAgICAgICAgICAgIHByZXZbMF0gPSAnQ09NUE9VTkRfQVNTSUdOJ1xuICAgICAgICAgICAgICAgIHByZXZbMV0gKz0gJz0nXG4gICAgICAgICAgICAgICAgcHJldiA9IEB0b2tlbnNbQHRva2Vucy5sZW5ndGggLSAyXVxuICAgICAgICAgICAgICAgIHNraXBUb2tlbiA9IHRydWVcbiAgICAgICAgICAgIGlmIHByZXYgYW5kIHByZXZbMF0gIT0gJ1BST1BFUlRZJ1xuICAgICAgICAgICAgICAgIG9yaWdpbiA9IHByZXYub3JpZ2luID8gcHJldlxuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBpc1VuYXNzaWduYWJsZSBwcmV2WzFdLCBvcmlnaW5bMV1cbiAgICAgICAgICAgICAgICBAZXJyb3IgbWVzc2FnZSwgb3JpZ2luWzJdIGlmIG1lc3NhZ2VcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZS5sZW5ndGggaWYgc2tpcFRva2VuXG5cbiAgICAgICAgaWYgdmFsdWUgaXMgJ3snIGFuZCBAc2VlbkltcG9ydFxuICAgICAgICAgICAgQGltcG9ydFNwZWNpZmllckxpc3QgPSB5ZXNcbiAgICAgICAgZWxzZSBpZiBAaW1wb3J0U3BlY2lmaWVyTGlzdCBhbmQgdmFsdWUgaXMgJ30nXG4gICAgICAgICAgICBAaW1wb3J0U3BlY2lmaWVyTGlzdCA9IG5vXG4gICAgICAgIGVsc2UgaWYgdmFsdWUgaXMgJ3snIGFuZCBwcmV2P1swXSBpcyAnRVhQT1JUJ1xuICAgICAgICAgICAgQGV4cG9ydFNwZWNpZmllckxpc3QgPSB5ZXNcbiAgICAgICAgZWxzZSBpZiBAZXhwb3J0U3BlY2lmaWVyTGlzdCBhbmQgdmFsdWUgaXMgJ30nXG4gICAgICAgICAgICBAZXhwb3J0U3BlY2lmaWVyTGlzdCA9IG5vXG5cbiAgICAgICAgaWYgdmFsdWUgaXMgJzsnXG4gICAgICAgICAgICBAc2VlbkZvciA9IEBzZWVuSW1wb3J0ID0gQHNlZW5FeHBvcnQgPSBub1xuICAgICAgICAgICAgdGFnID0gJ1RFUk1JTkFUT1InXG4gICAgICAgIGVsc2UgaWYgdmFsdWUgaXMgJyonIGFuZCBwcmV2WzBdIGlzICdFWFBPUlQnXG4gICAgICAgICAgICB0YWcgPSAnRVhQT1JUX0FMTCdcbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpbiBNQVRIICAgICAgICAgICAgICAgICAgIHRoZW4gdGFnID0gJ01BVEgnXG4gICAgICAgIGVsc2UgaWYgdmFsdWUgaW4gQ09NUEFSRSAgICAgICAgICAgICAgICB0aGVuIHRhZyA9ICdDT01QQVJFJ1xuICAgICAgICBlbHNlIGlmIHZhbHVlIGluIENPTVBPVU5EX0FTU0lHTiAgICAgICAgdGhlbiB0YWcgPSAnQ09NUE9VTkRfQVNTSUdOJ1xuICAgICAgICBlbHNlIGlmIHZhbHVlIGluIFVOQVJZICAgICAgICAgICAgICAgICAgdGhlbiB0YWcgPSAnVU5BUlknXG4gICAgICAgIGVsc2UgaWYgdmFsdWUgaW4gVU5BUllfTUFUSCAgICAgICAgICAgICB0aGVuIHRhZyA9ICdVTkFSWV9NQVRIJ1xuICAgICAgICBlbHNlIGlmIHZhbHVlIGluIFNISUZUICAgICAgICAgICAgICAgICAgdGhlbiB0YWcgPSAnU0hJRlQnXG4gICAgICAgIGVsc2UgaWYgdmFsdWUgaXMgJz8nIGFuZCBwcmV2Py5zcGFjZWQgICB0aGVuIHRhZyA9ICdCSU4/J1xuICAgICAgICBlbHNlIGlmIHByZXYgYW5kIG5vdCBwcmV2LnNwYWNlZFxuICAgICAgICAgICAgaWYgdmFsdWUgaXMgJygnIGFuZCBwcmV2WzBdIGluIENBTExBQkxFXG4gICAgICAgICAgICAgICAgcHJldlswXSA9ICdGVU5DX0VYSVNUJyBpZiBwcmV2WzBdIGlzICc/J1xuICAgICAgICAgICAgICAgIHRhZyA9ICdDQUxMX1NUQVJUJ1xuICAgICAgICAgICAgZWxzZSBpZiB2YWx1ZSBpcyAnWycgYW5kIHByZXZbMF0gaW4gSU5ERVhBQkxFXG4gICAgICAgICAgICAgICAgdGFnID0gJ0lOREVYX1NUQVJUJ1xuICAgICAgICAgICAgICAgIHN3aXRjaCBwcmV2WzBdXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gJz8nICAgIHRoZW4gcHJldlswXSA9ICdJTkRFWF9TT0FLJ1xuICAgICAgICB0b2tlbiA9IEBtYWtlVG9rZW4gdGFnLCB2YWx1ZVxuICAgICAgICBzd2l0Y2ggdmFsdWVcbiAgICAgICAgICAgIHdoZW4gJygnLCAneycsICdbJyB0aGVuIEBlbmRzLnB1c2gge3RhZzogUmV3cml0ZXIuSU5WRVJTRVNbdmFsdWVdLCBvcmlnaW46IHRva2VufVxuICAgICAgICAgICAgd2hlbiAnKScsICd9JywgJ10nIHRoZW4gQHBhaXIgdmFsdWVcbiAgICAgICAgQHRva2Vucy5wdXNoIHRva2VuXG4gICAgICAgIHZhbHVlLmxlbmd0aFxuXG4gICAgIyMjXG4gICAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgXG4gICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgXG4gICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgXG4gICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgIyMjXG4gICAgXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICAjIEEgc291cmNlIG9mIGFtYmlndWl0eSBpbiBvdXIgZ3JhbW1hciB1c2VkIHRvIGJlIHBhcmFtZXRlciBsaXN0cyBpbiBmdW5jdGlvblxuICAgICMgZGVmaW5pdGlvbnMgdmVyc3VzIGFyZ3VtZW50IGxpc3RzIGluIGZ1bmN0aW9uIGNhbGxzLiBXYWxrIGJhY2t3YXJkcywgdGFnZ2luZ1xuICAgICMgcGFyYW1ldGVycyBzcGVjaWFsbHkgaW4gb3JkZXIgdG8gbWFrZSB0aGluZ3MgZWFzaWVyIGZvciB0aGUgcGFyc2VyLlxuICAgICAgICBcbiAgICB0YWdQYXJhbWV0ZXJzOiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXMgaWYgQHRhZygpICE9ICcpJ1xuICAgICAgICBzdGFjayA9IFtdXG4gICAgICAgIHt0b2tlbnN9ID0gdGhpc1xuICAgICAgICBpID0gdG9rZW5zLmxlbmd0aFxuICAgICAgICB0b2tlbnNbLS1pXVswXSA9ICdQQVJBTV9FTkQnXG4gICAgICAgIHdoaWxlIHRvayA9IHRva2Vuc1stLWldXG4gICAgICAgICAgICBzd2l0Y2ggdG9rWzBdXG4gICAgICAgICAgICAgICAgd2hlbiAnKSdcbiAgICAgICAgICAgICAgICAgICAgc3RhY2sucHVzaCB0b2tcbiAgICAgICAgICAgICAgICB3aGVuICcoJywgJ0NBTExfU1RBUlQnXG4gICAgICAgICAgICAgICAgICAgIGlmIHN0YWNrLmxlbmd0aCB0aGVuIHN0YWNrLnBvcCgpXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgdG9rWzBdIGlzICcoJ1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9rWzBdID0gJ1BBUkFNX1NUQVJUJ1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNcbiAgICAgICAgICAgICAgICAgICAgZWxzZSByZXR1cm4gdGhpc1xuICAgICAgICB0aGlzXG5cbiAgICAjIENsb3NlIHVwIGFsbCByZW1haW5pbmcgb3BlbiBibG9ja3MgYXQgdGhlIGVuZCBvZiB0aGUgZmlsZS5cbiAgICBcbiAgICBjbG9zZUluZGVudGF0aW9uOiAtPiBAb3V0ZGVudFRva2VuIEBpbmRlbnRcblxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICAjIE1hdGNoIHRoZSBjb250ZW50cyBvZiBhIGRlbGltaXRlZCB0b2tlbiBhbmQgZXhwYW5kIHZhcmlhYmxlcyBhbmQgZXhwcmVzc2lvbnNcbiAgICAjIGluc2lkZSBpdCB1c2luZyBSdWJ5LWxpa2Ugbm90YXRpb24gZm9yIHN1YnN0aXR1dGlvbiBvZiBhcmJpdHJhcnkgZXhwcmVzc2lvbnMuXG4gICAgI1xuICAgICMgICAgXCJIZWxsbyAje25hbWUuY2FwaXRhbGl6ZSgpfS5cIlxuICAgICNcbiAgICAjIElmIGl0IGVuY291bnRlcnMgYW4gaW50ZXJwb2xhdGlvbiwgdGhpcyBtZXRob2Qgd2lsbCByZWN1cnNpdmVseSBjcmVhdGUgYSBuZXdcbiAgICAjIExleGVyIGFuZCB0b2tlbml6ZSB1bnRpbCB0aGUgYHtgIG9mIGAje2AgaXMgYmFsYW5jZWQgd2l0aCBhIGB9YC5cbiAgICAjXG4gICAgIyAgICAtIGByZWdleGAgbWF0Y2hlcyB0aGUgY29udGVudHMgb2YgYSB0b2tlbiAoYnV0IG5vdCBgZGVsaW1pdGVyYCwgYW5kIG5vdFxuICAgICMgICAgICAgIGAje2AgaWYgaW50ZXJwb2xhdGlvbnMgYXJlIGRlc2lyZWQpLlxuICAgICMgICAgLSBgZGVsaW1pdGVyYCBpcyB0aGUgZGVsaW1pdGVyIG9mIHRoZSB0b2tlbi4gRXhhbXBsZXMgYXJlIGAnYCwgYFwiYCwgYCcnJ2AsXG4gICAgIyAgICAgICAgYFwiXCJcImAgYW5kIGAvLy9gLlxuICAgICNcbiAgICAjIFRoaXMgbWV0aG9kIGFsbG93cyB1cyB0byBoYXZlIHN0cmluZ3Mgd2l0aGluIGludGVycG9sYXRpb25zIHdpdGhpbiBzdHJpbmdzLCBhZCBpbmZpbml0dW0uXG4gICAgXG4gICAgbWF0Y2hXaXRoSW50ZXJwb2xhdGlvbnM6IChyZWdleCwgZGVsaW1pdGVyKSAtPlxuICAgICAgICBcbiAgICAgICAgdG9rZW5zID0gW11cbiAgICAgICAgb2Zmc2V0SW5DaHVuayA9IGRlbGltaXRlci5sZW5ndGhcbiAgICAgICAgcmV0dXJuIG51bGwgdW5sZXNzIEBjaHVua1suLi5vZmZzZXRJbkNodW5rXSBpcyBkZWxpbWl0ZXJcbiAgICAgICAgc3RyID0gQGNodW5rW29mZnNldEluQ2h1bmsuLl1cbiAgICAgICAgbG9vcFxuICAgICAgICAgICAgW3N0clBhcnRdID0gcmVnZXguZXhlYyBzdHJcblxuICAgICAgICAgICAgQHZhbGlkYXRlRXNjYXBlcyBzdHJQYXJ0LCB7aXNSZWdleDogZGVsaW1pdGVyLmNoYXJBdCgwKSBpcyAnLycsIG9mZnNldEluQ2h1bmt9XG5cbiAgICAgICAgICAgICMgUHVzaCBhIGZha2UgJ05FT1NUUklORycgdG9rZW4sIHdoaWNoIHdpbGwgZ2V0IHR1cm5lZCBpbnRvIGEgcmVhbCBzdHJpbmcgbGF0ZXIuXG4gICAgICAgICAgICB0b2tlbnMucHVzaCBAbWFrZVRva2VuICdORU9TVFJJTkcnLCBzdHJQYXJ0LCBvZmZzZXRJbkNodW5rXG5cbiAgICAgICAgICAgIHN0ciA9IHN0cltzdHJQYXJ0Lmxlbmd0aC4uXVxuICAgICAgICAgICAgb2Zmc2V0SW5DaHVuayArPSBzdHJQYXJ0Lmxlbmd0aFxuXG4gICAgICAgICAgICBicmVhayB1bmxlc3Mgc3RyWy4uLjJdIGlzICcjeydcblxuICAgICAgICAgICAgIyBUaGUgYDFgcyBhcmUgdG8gcmVtb3ZlIHRoZSBgI2AgaW4gYCN7YC5cbiAgICAgICAgICAgIFtsaW5lLCBjb2x1bW5dID0gQGdldExpbmVBbmRDb2x1bW5Gcm9tQ2h1bmsgb2Zmc2V0SW5DaHVuayArIDFcbiAgICAgICAgICAgIHt0b2tlbnM6IG5lc3RlZCwgaW5kZXh9ID1cbiAgICAgICAgICAgICAgICBuZXcgTGV4ZXIoKS50b2tlbml6ZSBzdHJbMS4uXSwgbGluZTogbGluZSwgY29sdW1uOiBjb2x1bW4sIHVudGlsQmFsYW5jZWQ6IG9uXG4gICAgICAgICAgICAjIFNraXAgdGhlIHRyYWlsaW5nIGB9YC5cbiAgICAgICAgICAgIGluZGV4ICs9IDFcblxuICAgICAgICAgICAgIyBUdXJuIHRoZSBsZWFkaW5nIGFuZCB0cmFpbGluZyBge2AgYW5kIGB9YCBpbnRvIHBhcmVudGhlc2VzLiBVbm5lY2Vzc2FyeVxuICAgICAgICAgICAgIyBwYXJlbnRoZXNlcyB3aWxsIGJlIHJlbW92ZWQgbGF0ZXIuXG4gICAgICAgICAgICBbb3BlbiwgLi4uLCBjbG9zZV0gPSBuZXN0ZWRcbiAgICAgICAgICAgIG9wZW5bMF0gID0gb3BlblsxXSAgPSAnKCdcbiAgICAgICAgICAgIGNsb3NlWzBdID0gY2xvc2VbMV0gPSAnKSdcbiAgICAgICAgICAgIGNsb3NlLm9yaWdpbiA9IFsnJywgJ2VuZCBvZiBpbnRlcnBvbGF0aW9uJywgY2xvc2VbMl1dXG5cbiAgICAgICAgICAgICMgUmVtb3ZlIGxlYWRpbmcgJ1RFUk1JTkFUT1InIChpZiBhbnkpLlxuICAgICAgICAgICAgbmVzdGVkLnNwbGljZSAxLCAxIGlmIG5lc3RlZFsxXT9bMF0gaXMgJ1RFUk1JTkFUT1InXG5cbiAgICAgICAgICAgICMgUHVzaCBhIGZha2UgJ1RPS0VOUycgdG9rZW4sIHdoaWNoIHdpbGwgZ2V0IHR1cm5lZCBpbnRvIHJlYWwgdG9rZW5zIGxhdGVyLlxuICAgICAgICAgICAgdG9rZW5zLnB1c2ggWydUT0tFTlMnLCBuZXN0ZWRdXG5cbiAgICAgICAgICAgIHN0ciA9IHN0cltpbmRleC4uXVxuICAgICAgICAgICAgb2Zmc2V0SW5DaHVuayArPSBpbmRleFxuXG4gICAgICAgIHVubGVzcyBzdHJbLi4uZGVsaW1pdGVyLmxlbmd0aF0gaXMgZGVsaW1pdGVyXG4gICAgICAgICAgICBAZXJyb3IgXCJtaXNzaW5nICN7ZGVsaW1pdGVyfVwiLCBsZW5ndGg6IGRlbGltaXRlci5sZW5ndGhcblxuICAgICAgICBbZmlyc3RUb2tlbiwgLi4uLCBsYXN0VG9rZW5dID0gdG9rZW5zXG4gICAgICAgIGZpcnN0VG9rZW5bMl0uZmlyc3RfY29sdW1uIC09IGRlbGltaXRlci5sZW5ndGhcbiAgICAgICAgaWYgbGFzdFRva2VuWzFdLnN1YnN0cigtMSkgaXMgJ1xcbidcbiAgICAgICAgICAgIGxhc3RUb2tlblsyXS5sYXN0X2xpbmUgKz0gMVxuICAgICAgICAgICAgbGFzdFRva2VuWzJdLmxhc3RfY29sdW1uID0gZGVsaW1pdGVyLmxlbmd0aCAtIDFcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbGFzdFRva2VuWzJdLmxhc3RfY29sdW1uICs9IGRlbGltaXRlci5sZW5ndGhcbiAgICAgICAgbGFzdFRva2VuWzJdLmxhc3RfY29sdW1uIC09IDEgaWYgbGFzdFRva2VuWzFdLmxlbmd0aCBpcyAwXG5cbiAgICAgICAge3Rva2VucywgaW5kZXg6IG9mZnNldEluQ2h1bmsgKyBkZWxpbWl0ZXIubGVuZ3RofVxuXG4gICAgIyAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICBcbiAgICAjIE1lcmdlIHRoZSBhcnJheSBgdG9rZW5zYCBvZiB0aGUgZmFrZSB0b2tlbiB0eXBlcyAnVE9LRU5TJyBhbmQgJ05FT1NUUklORycgIChhcyByZXR1cm5lZCBieSBgbWF0Y2hXaXRoSW50ZXJwb2xhdGlvbnNgKSBpbnRvIHRoZSB0b2tlbiBzdHJlYW0uIFxuICAgICMgVGhlIHZhbHVlIG9mICdORU9TVFJJTkcncyBhcmUgY29udmVydGVkIHVzaW5nIGBmbmAgYW5kIHR1cm5lZCBpbnRvIHN0cmluZ3MgdXNpbmcgYG9wdGlvbnNgIGZpcnN0LlxuICAgIFxuICAgIG1lcmdlSW50ZXJwb2xhdGlvblRva2VuczogKHRva2Vucywgb3B0aW9ucywgZm4pIC0+XG4gICAgICAgIFxuICAgICAgICBpZiB0b2tlbnMubGVuZ3RoID4gMVxuICAgICAgICAgICAgbHBhcmVuID0gQHRva2VuICdTVFJJTkdfU1RBUlQnLCAnKCcsIDAsIDBcblxuICAgICAgICBmaXJzdEluZGV4ID0gQHRva2Vucy5sZW5ndGhcbiAgICAgICAgZm9yIHRva2VuLCBpIGluIHRva2Vuc1xuICAgICAgICAgICAgW3RhZywgdmFsdWVdID0gdG9rZW5cbiAgICAgICAgICAgIHN3aXRjaCB0YWdcbiAgICAgICAgICAgICAgICB3aGVuICdUT0tFTlMnXG4gICAgICAgICAgICAgICAgICAgICMgT3B0aW1pemUgb3V0IGVtcHR5IGludGVycG9sYXRpb25zIChhbiBlbXB0eSBwYWlyIG9mIHBhcmVudGhlc2VzKS5cbiAgICAgICAgICAgICAgICAgICAgY29udGludWUgaWYgdmFsdWUubGVuZ3RoIGlzIDJcbiAgICAgICAgICAgICAgICAgICAgIyBQdXNoIGFsbCB0aGUgdG9rZW5zIGluIHRoZSBmYWtlICdUT0tFTlMnIHRva2VuLiBcbiAgICAgICAgICAgICAgICAgICAgIyBUaGVzZSBhbHJlYWR5IGhhdmUgc2FuZSBsb2NhdGlvbiBkYXRhLlxuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvblRva2VuID0gdmFsdWVbMF1cbiAgICAgICAgICAgICAgICAgICAgdG9rZW5zVG9QdXNoID0gdmFsdWVcbiAgICAgICAgICAgICAgICB3aGVuICdORU9TVFJJTkcnXG4gICAgICAgICAgICAgICAgICAgICMgQ29udmVydCAnTkVPU1RSSU5HJyBpbnRvICdTVFJJTkcnLlxuICAgICAgICAgICAgICAgICAgICBjb252ZXJ0ZWQgPSBmbi5jYWxsIHRoaXMsIHRva2VuWzFdLCBpXG4gICAgICAgICAgICAgICAgICAgICMgT3B0aW1pemUgb3V0IGVtcHR5IHN0cmluZ3MuIFdlIGVuc3VyZSB0aGF0IHRoZSB0b2tlbnMgc3RyZWFtIGFsd2F5c1xuICAgICAgICAgICAgICAgICAgICAjIHN0YXJ0cyB3aXRoIGEgc3RyaW5nIHRva2VuLCB0aG91Z2gsIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSByZXN1bHRcbiAgICAgICAgICAgICAgICAgICAgIyByZWFsbHkgaXMgYSBzdHJpbmcuXG4gICAgICAgICAgICAgICAgICAgIGlmIGNvbnZlcnRlZC5sZW5ndGggaXMgMFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgaSBpcyAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3RFbXB0eVN0cmluZ0luZGV4ID0gQHRva2Vucy5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgICAgICAjIEhvd2V2ZXIsIHRoZXJlIGlzIG9uZSBjYXNlIHdoZXJlIHdlIGNhbiBvcHRpbWl6ZSBhd2F5IGEgc3RhcnRpbmcgZW1wdHkgc3RyaW5nLlxuICAgICAgICAgICAgICAgICAgICBpZiBpIGlzIDIgYW5kIGZpcnN0RW1wdHlTdHJpbmdJbmRleD9cbiAgICAgICAgICAgICAgICAgICAgICAgIEB0b2tlbnMuc3BsaWNlIGZpcnN0RW1wdHlTdHJpbmdJbmRleCwgMiAjIFJlbW92ZSBlbXB0eSBzdHJpbmcgYW5kIHRoZSBwbHVzLlxuICAgICAgICAgICAgICAgICAgICB0b2tlblswXSA9ICdTVFJJTkcnXG4gICAgICAgICAgICAgICAgICAgIHRva2VuWzFdID0gQG1ha2VEZWxpbWl0ZWRMaXRlcmFsIGNvbnZlcnRlZCwgb3B0aW9uc1xuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvblRva2VuID0gdG9rZW5cbiAgICAgICAgICAgICAgICAgICAgdG9rZW5zVG9QdXNoID0gW3Rva2VuXVxuICAgICAgICAgICAgaWYgQHRva2Vucy5sZW5ndGggPiBmaXJzdEluZGV4XG4gICAgICAgICAgICAgICAgIyBDcmVhdGUgYSAwLWxlbmd0aCBcIitcIiB0b2tlbi5cbiAgICAgICAgICAgICAgICBwbHVzVG9rZW4gPSBAdG9rZW4gJysnLCAnKydcbiAgICAgICAgICAgICAgICBwbHVzVG9rZW5bMl0gPVxuICAgICAgICAgICAgICAgICAgICBmaXJzdF9saW5lOiAgIGxvY2F0aW9uVG9rZW5bMl0uZmlyc3RfbGluZVxuICAgICAgICAgICAgICAgICAgICBmaXJzdF9jb2x1bW46IGxvY2F0aW9uVG9rZW5bMl0uZmlyc3RfY29sdW1uXG4gICAgICAgICAgICAgICAgICAgIGxhc3RfbGluZTogICAgbG9jYXRpb25Ub2tlblsyXS5maXJzdF9saW5lXG4gICAgICAgICAgICAgICAgICAgIGxhc3RfY29sdW1uOiAgbG9jYXRpb25Ub2tlblsyXS5maXJzdF9jb2x1bW5cbiAgICAgICAgICAgIEB0b2tlbnMucHVzaCB0b2tlbnNUb1B1c2guLi5cblxuICAgICAgICBpZiBscGFyZW5cbiAgICAgICAgICAgIFsuLi4sIGxhc3RUb2tlbl0gPSB0b2tlbnNcbiAgICAgICAgICAgIGxwYXJlbi5vcmlnaW4gPSBbJ1NUUklORycsIG51bGwsXG4gICAgICAgICAgICAgICAgZmlyc3RfbGluZTogICBscGFyZW5bMl0uZmlyc3RfbGluZVxuICAgICAgICAgICAgICAgIGZpcnN0X2NvbHVtbjogbHBhcmVuWzJdLmZpcnN0X2NvbHVtblxuICAgICAgICAgICAgICAgIGxhc3RfbGluZTogICAgbGFzdFRva2VuWzJdLmxhc3RfbGluZVxuICAgICAgICAgICAgICAgIGxhc3RfY29sdW1uOiAgbGFzdFRva2VuWzJdLmxhc3RfY29sdW1uXG4gICAgICAgICAgICBdXG4gICAgICAgICAgICBycGFyZW4gPSBAdG9rZW4gJ1NUUklOR19FTkQnLCAnKSdcbiAgICAgICAgICAgIHJwYXJlblsyXSA9XG4gICAgICAgICAgICAgICAgZmlyc3RfbGluZTogICBsYXN0VG9rZW5bMl0ubGFzdF9saW5lXG4gICAgICAgICAgICAgICAgZmlyc3RfY29sdW1uOiBsYXN0VG9rZW5bMl0ubGFzdF9jb2x1bW5cbiAgICAgICAgICAgICAgICBsYXN0X2xpbmU6ICAgIGxhc3RUb2tlblsyXS5sYXN0X2xpbmVcbiAgICAgICAgICAgICAgICBsYXN0X2NvbHVtbjogIGxhc3RUb2tlblsyXS5sYXN0X2NvbHVtblxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICAjIFBhaXJzIHVwIGEgY2xvc2luZyB0b2tlbiwgZW5zdXJpbmcgdGhhdCBhbGwgbGlzdGVkIHBhaXJzIG9mIHRva2VucyBhcmVcbiAgICAjIGNvcnJlY3RseSBiYWxhbmNlZCB0aHJvdWdob3V0IHRoZSBjb3Vyc2Ugb2YgdGhlIHRva2VuIHN0cmVhbS5cbiAgICBcbiAgICBwYWlyOiAodGFnKSAtPlxuICAgICAgICBcbiAgICAgICAgWy4uLiwgcHJldl0gPSBAZW5kc1xuICAgICAgICB1bmxlc3MgdGFnIGlzIHdhbnRlZCA9IHByZXY/LnRhZ1xuICAgICAgICAgICAgQGVycm9yIFwidW5tYXRjaGVkICN7dGFnfVwiIHVubGVzcyAnT1VUREVOVCcgaXMgd2FudGVkXG4gICAgICAgICAgICAjIEF1dG8tY2xvc2UgSU5ERU5UIHRvIHN1cHBvcnQgc3ludGF4IGxpa2UgdGhpczpcbiAgICAgICAgICAgICNcbiAgICAgICAgICAgICMgICAgIGVsLmNsaWNrKChldmVudCkgLT5cbiAgICAgICAgICAgICMgICAgICAgICBlbC5oaWRlKCkpXG4gICAgICAgICAgICBbLi4uLCBsYXN0SW5kZW50XSA9IEBpbmRlbnRzXG4gICAgICAgICAgICBAb3V0ZGVudFRva2VuIGxhc3RJbmRlbnQsIHRydWVcbiAgICAgICAgICAgIHJldHVybiBAcGFpciB0YWdcbiAgICAgICAgQGVuZHMucG9wKClcblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcblxuICAgICMgUmV0dXJucyB0aGUgbGluZSBhbmQgY29sdW1uIG51bWJlciBmcm9tIGFuIG9mZnNldCBpbnRvIHRoZSBjdXJyZW50IGNodW5rLlxuICAgICNcbiAgICAjIGBvZmZzZXRgIGlzIGEgbnVtYmVyIG9mIGNoYXJhY3RlcnMgaW50byBAY2h1bmsuXG4gICAgXG4gICAgZ2V0TGluZUFuZENvbHVtbkZyb21DaHVuazogKG9mZnNldCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIG9mZnNldCBpcyAwXG4gICAgICAgICAgICByZXR1cm4gW0BjaHVua0xpbmUsIEBjaHVua0NvbHVtbl1cblxuICAgICAgICBpZiBvZmZzZXQgPj0gQGNodW5rLmxlbmd0aFxuICAgICAgICAgICAgc3RyaW5nID0gQGNodW5rXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHN0cmluZyA9IEBjaHVua1suLm9mZnNldC0xXVxuXG4gICAgICAgIGxpbmVDb3VudCA9IGNvdW50IHN0cmluZywgJ1xcbidcblxuICAgICAgICBjb2x1bW4gPSBAY2h1bmtDb2x1bW5cbiAgICAgICAgaWYgbGluZUNvdW50ID4gMFxuICAgICAgICAgICAgWy4uLiwgbGFzdExpbmVdID0gc3RyaW5nLnNwbGl0ICdcXG4nXG4gICAgICAgICAgICBjb2x1bW4gPSBsYXN0TGluZS5sZW5ndGhcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgY29sdW1uICs9IHN0cmluZy5sZW5ndGhcblxuICAgICAgICBbQGNodW5rTGluZSArIGxpbmVDb3VudCwgY29sdW1uXVxuXG4gICAgIyAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAwICAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAwICBcbiAgICAjICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgICMgU2FtZSBhcyBcInRva2VuXCIsIGV4Y2VwdGlvbiB0aGlzIGp1c3QgcmV0dXJucyB0aGUgdG9rZW4gd2l0aG91dCBhZGRpbmcgaXQgdG8gdGhlIHJlc3VsdHMuXG4gICAgXG4gICAgbWFrZVRva2VuOiAodGFnLCB2YWx1ZSwgb2Zmc2V0SW5DaHVuayA9IDAsIGxlbmd0aCA9IHZhbHVlLmxlbmd0aCkgLT5cbiAgICAgICAgXG4gICAgICAgIGxvY2F0aW9uRGF0YSA9IHt9XG4gICAgICAgIFtsb2NhdGlvbkRhdGEuZmlyc3RfbGluZSwgbG9jYXRpb25EYXRhLmZpcnN0X2NvbHVtbl0gPVxuICAgICAgICAgICAgQGdldExpbmVBbmRDb2x1bW5Gcm9tQ2h1bmsgb2Zmc2V0SW5DaHVua1xuXG4gICAgICAgICMgVXNlIGxlbmd0aCAtIDEgZm9yIHRoZSBmaW5hbCBvZmZzZXQgLSB3ZSdyZSBzdXBwbHlpbmcgdGhlIGxhc3RfbGluZSBhbmQgdGhlIGxhc3RfY29sdW1uLFxuICAgICAgICAjIHNvIGlmIGxhc3RfY29sdW1uID09IGZpcnN0X2NvbHVtbiwgdGhlbiB3ZSdyZSBsb29raW5nIGF0IGEgY2hhcmFjdGVyIG9mIGxlbmd0aCAxLlxuICAgICAgICBsYXN0Q2hhcmFjdGVyID0gaWYgbGVuZ3RoID4gMCB0aGVuIChsZW5ndGggLSAxKSBlbHNlIDBcbiAgICAgICAgW2xvY2F0aW9uRGF0YS5sYXN0X2xpbmUsIGxvY2F0aW9uRGF0YS5sYXN0X2NvbHVtbl0gPVxuICAgICAgICAgICAgQGdldExpbmVBbmRDb2x1bW5Gcm9tQ2h1bmsgb2Zmc2V0SW5DaHVuayArIGxhc3RDaGFyYWN0ZXJcblxuICAgICAgICB0b2tlbiA9IFt0YWcsIHZhbHVlLCBsb2NhdGlvbkRhdGFdXG5cbiAgICAgICAgdG9rZW5cblxuICAgICMgQWRkIGEgdG9rZW4gdG8gdGhlIHJlc3VsdHMuXG4gICAgIyBgb2Zmc2V0YCBpcyB0aGUgb2Zmc2V0IGludG8gdGhlIGN1cnJlbnQgQGNodW5rIHdoZXJlIHRoZSB0b2tlbiBzdGFydHMuXG4gICAgIyBgbGVuZ3RoYCBpcyB0aGUgbGVuZ3RoIG9mIHRoZSB0b2tlbiBpbiB0aGUgQGNodW5rLCBhZnRlciB0aGUgb2Zmc2V0LiAgXG4gICAgIyBJZiBub3Qgc3BlY2lmaWVkLCB0aGUgbGVuZ3RoIG9mIGB2YWx1ZWAgd2lsbCBiZSB1c2VkLiBSZXR1cm5zIHRoZSBuZXcgdG9rZW4uXG4gICAgXG4gICAgdG9rZW46ICh0YWcsIHZhbHVlLCBvZmZzZXRJbkNodW5rLCBsZW5ndGgsIG9yaWdpbikgLT5cbiAgICAgICAgXG4gICAgICAgIHRva2VuID0gQG1ha2VUb2tlbiB0YWcsIHZhbHVlLCBvZmZzZXRJbkNodW5rLCBsZW5ndGhcbiAgICAgICAgdG9rZW4ub3JpZ2luID0gb3JpZ2luIGlmIG9yaWdpblxuICAgICAgICBAdG9rZW5zLnB1c2ggdG9rZW5cbiAgICAgICAgdG9rZW5cblxuICAgIHRhZzogLT4gIyBQZWVrIGF0IHRoZSBsYXN0IHRhZyBpbiB0aGUgdG9rZW4gc3RyZWFtLlxuICAgICAgICBcbiAgICAgICAgWy4uLiwgdG9rZW5dID0gQHRva2Vuc1xuICAgICAgICB0b2tlbj9bMF1cblxuICAgIHZhbHVlOiAtPiAjIFBlZWsgYXQgdGhlIGxhc3QgdmFsdWUgaW4gdGhlIHRva2VuIHN0cmVhbS5cbiAgICAgICAgXG4gICAgICAgIFsuLi4sIHRva2VuXSA9IEB0b2tlbnNcbiAgICAgICAgdG9rZW4/WzFdXG5cbiAgICB1bmZpbmlzaGVkOiAtPiAjIEFyZSB3ZSBpbiB0aGUgbWlkc3Qgb2YgYW4gdW5maW5pc2hlZCBleHByZXNzaW9uP1xuICAgICAgICBcbiAgICAgICAgTElORV9DT05USU5VRVIudGVzdChAY2h1bmspIG9yXG4gICAgICAgIEB0YWcoKSBpbiBVTkZJTklTSEVEXG5cbiAgICBmb3JtYXRTdHJpbmc6IChzdHIsIG9wdGlvbnMpIC0+XG4gICAgICAgIFxuICAgICAgICBAcmVwbGFjZVVuaWNvZGVDb2RlUG9pbnRFc2NhcGVzIHN0ci5yZXBsYWNlKFNUUklOR19PTUlULCAnJDEnKSwgb3B0aW9uc1xuXG4gICAgZm9ybWF0SGVyZWdleDogKHN0cikgLT5cbiAgICAgICAgXG4gICAgICAgIEBmb3JtYXRSZWdleCBzdHIucmVwbGFjZShIRVJFR0VYX09NSVQsICckMSQyJyksIGRlbGltaXRlcjogJy8vLydcblxuICAgIGZvcm1hdFJlZ2V4OiAoc3RyLCBvcHRpb25zKSAtPlxuICAgICAgICBcbiAgICAgICAgQHJlcGxhY2VVbmljb2RlQ29kZVBvaW50RXNjYXBlcyBzdHIsIG9wdGlvbnNcblxuICAgIHVuaWNvZGVDb2RlUG9pbnRUb1VuaWNvZGVFc2NhcGVzOiAoY29kZVBvaW50KSAtPlxuICAgICAgICBcbiAgICAgICAgdG9Vbmljb2RlRXNjYXBlID0gKHZhbCkgLT5cbiAgICAgICAgICAgIHN0ciA9IHZhbC50b1N0cmluZyAxNlxuICAgICAgICAgICAgXCJcXFxcdSN7cmVwZWF0ICcwJywgNCAtIHN0ci5sZW5ndGh9I3tzdHJ9XCJcbiAgICAgICAgcmV0dXJuIHRvVW5pY29kZUVzY2FwZShjb2RlUG9pbnQpIGlmIGNvZGVQb2ludCA8IDB4MTAwMDBcbiAgICAgICAgIyBzdXJyb2dhdGUgcGFpclxuICAgICAgICBoaWdoID0gTWF0aC5mbG9vcigoY29kZVBvaW50IC0gMHgxMDAwMCkgLyAweDQwMCkgKyAweEQ4MDBcbiAgICAgICAgbG93ID0gKGNvZGVQb2ludCAtIDB4MTAwMDApICUgMHg0MDAgKyAweERDMDBcbiAgICAgICAgXCIje3RvVW5pY29kZUVzY2FwZShoaWdoKX0je3RvVW5pY29kZUVzY2FwZShsb3cpfVwiXG5cbiAgICByZXBsYWNlVW5pY29kZUNvZGVQb2ludEVzY2FwZXM6IChzdHIsIG9wdGlvbnMpIC0+ICMgUmVwbGFjZSBcXHV7Li4ufSB3aXRoIFxcdXh4eHhbXFx1eHh4eF0gaW4gc3RyaW5ncyBhbmQgcmVnZXhlc1xuICAgICAgICBcbiAgICAgICAgc3RyLnJlcGxhY2UgVU5JQ09ERV9DT0RFX1BPSU5UX0VTQ0FQRSwgKG1hdGNoLCBlc2NhcGVkQmFja3NsYXNoLCBjb2RlUG9pbnRIZXgsIG9mZnNldCkgPT5cbiAgICAgICAgICAgIHJldHVybiBlc2NhcGVkQmFja3NsYXNoIGlmIGVzY2FwZWRCYWNrc2xhc2hcblxuICAgICAgICAgICAgY29kZVBvaW50RGVjaW1hbCA9IHBhcnNlSW50IGNvZGVQb2ludEhleCwgMTZcbiAgICAgICAgICAgIGlmIGNvZGVQb2ludERlY2ltYWwgPiAweDEwZmZmZlxuICAgICAgICAgICAgICAgIEBlcnJvciBcInVuaWNvZGUgY29kZSBwb2ludCBlc2NhcGVzIGdyZWF0ZXIgdGhhbiBcXFxcdXsxMGZmZmZ9IGFyZSBub3QgYWxsb3dlZFwiLFxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IG9mZnNldCArIG9wdGlvbnMuZGVsaW1pdGVyLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICBsZW5ndGg6IGNvZGVQb2ludEhleC5sZW5ndGggKyA0XG5cbiAgICAgICAgICAgIEB1bmljb2RlQ29kZVBvaW50VG9Vbmljb2RlRXNjYXBlcyBjb2RlUG9pbnREZWNpbWFsXG5cbiAgICB2YWxpZGF0ZUVzY2FwZXM6IChzdHIsIG9wdGlvbnMgPSB7fSkgLT4gIyBWYWxpZGF0ZXMgZXNjYXBlcyBpbiBzdHJpbmdzIGFuZCByZWdleGVzLlxuICAgICAgICBcbiAgICAgICAgaW52YWxpZEVzY2FwZVJlZ2V4ID1cbiAgICAgICAgICAgIGlmIG9wdGlvbnMuaXNSZWdleFxuICAgICAgICAgICAgICAgIFJFR0VYX0lOVkFMSURfRVNDQVBFXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgU1RSSU5HX0lOVkFMSURfRVNDQVBFXG4gICAgICAgIG1hdGNoID0gaW52YWxpZEVzY2FwZVJlZ2V4LmV4ZWMgc3RyXG4gICAgICAgIHJldHVybiB1bmxlc3MgbWF0Y2hcbiAgICAgICAgW1tdLCBiZWZvcmUsIG9jdGFsLCBoZXgsIHVuaWNvZGVDb2RlUG9pbnQsIHVuaWNvZGVdID0gbWF0Y2hcbiAgICAgICAgbWVzc2FnZSA9XG4gICAgICAgICAgICBpZiBvY3RhbFxuICAgICAgICAgICAgICAgIFwib2N0YWwgZXNjYXBlIHNlcXVlbmNlcyBhcmUgbm90IGFsbG93ZWRcIlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIFwiaW52YWxpZCBlc2NhcGUgc2VxdWVuY2VcIlxuICAgICAgICBpbnZhbGlkRXNjYXBlID0gXCJcXFxcI3tvY3RhbCBvciBoZXggb3IgdW5pY29kZUNvZGVQb2ludCBvciB1bmljb2RlfVwiXG4gICAgICAgIEBlcnJvciBcIiN7bWVzc2FnZX0gI3tpbnZhbGlkRXNjYXBlfVwiLFxuICAgICAgICAgICAgb2Zmc2V0OiAob3B0aW9ucy5vZmZzZXRJbkNodW5rID8gMCkgKyBtYXRjaC5pbmRleCArIGJlZm9yZS5sZW5ndGhcbiAgICAgICAgICAgIGxlbmd0aDogaW52YWxpZEVzY2FwZS5sZW5ndGhcblxuICAgIG1ha2VEZWxpbWl0ZWRMaXRlcmFsOiAoYm9keSwgb3B0aW9ucyA9IHt9KSAtPiAjIENvbnN0cnVjdHMgYSBzdHJpbmcgb3IgcmVnZXggYnkgZXNjYXBpbmcgY2VydGFpbiBjaGFyYWN0ZXJzLlxuICAgICAgICBcbiAgICAgICAgYm9keSA9ICcoPzopJyBpZiBib2R5IGlzICcnIGFuZCBvcHRpb25zLmRlbGltaXRlciBpcyAnLydcbiAgICAgICAgcmVnZXggPSAvLy9cbiAgICAgICAgICAgICAgICAoXFxcXFxcXFwpICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIGVzY2FwZWQgYmFja3NsYXNoXG4gICAgICAgICAgICB8IChcXFxcMCg/PVsxLTddKSkgICAgICAgICAgICAgICAgICAgICAgICMgbnVsIGNoYXJhY3RlciBtaXN0YWtlbiBhcyBvY3RhbCBlc2NhcGVcbiAgICAgICAgICAgIHwgXFxcXD8oI3tvcHRpb25zLmRlbGltaXRlcn0pICAgICAgICAgICAgIyAocG9zc2libHkgZXNjYXBlZCkgZGVsaW1pdGVyXG4gICAgICAgICAgICB8IFxcXFw/KD86IChcXG4pfChcXHIpfChcXHUyMDI4KXwoXFx1MjAyOSkgKSAjIChwb3NzaWJseSBlc2NhcGVkKSBuZXdsaW5lc1xuICAgICAgICAgICAgfCAoXFxcXC4pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIG90aGVyIGVzY2FwZXNcbiAgICAgICAgLy8vZ1xuICAgICAgICBib2R5ID0gYm9keS5yZXBsYWNlIHJlZ2V4LCAobWF0Y2gsIGJhY2tzbGFzaCwgbnVsLCBkZWxpbWl0ZXIsIGxmLCBjciwgbHMsIHBzLCBvdGhlcikgLT4gc3dpdGNoXG4gICAgICAgICAgICAjIElnbm9yZSBlc2NhcGVkIGJhY2tzbGFzaGVzLlxuICAgICAgICAgICAgd2hlbiBiYWNrc2xhc2ggdGhlbiAoaWYgb3B0aW9ucy5kb3VibGUgdGhlbiBiYWNrc2xhc2ggKyBiYWNrc2xhc2ggZWxzZSBiYWNrc2xhc2gpXG4gICAgICAgICAgICB3aGVuIG51bCAgICAgICB0aGVuICdcXFxceDAwJ1xuICAgICAgICAgICAgd2hlbiBkZWxpbWl0ZXIgdGhlbiBcIlxcXFwje2RlbGltaXRlcn1cIlxuICAgICAgICAgICAgd2hlbiBsZiAgICAgICAgdGhlbiAnXFxcXG4nXG4gICAgICAgICAgICB3aGVuIGNyICAgICAgICB0aGVuICdcXFxccidcbiAgICAgICAgICAgIHdoZW4gbHMgICAgICAgIHRoZW4gJ1xcXFx1MjAyOCdcbiAgICAgICAgICAgIHdoZW4gcHMgICAgICAgIHRoZW4gJ1xcXFx1MjAyOSdcbiAgICAgICAgICAgIHdoZW4gb3RoZXIgICAgIHRoZW4gKGlmIG9wdGlvbnMuZG91YmxlIHRoZW4gXCJcXFxcI3tvdGhlcn1cIiBlbHNlIG90aGVyKVxuICAgICAgICBcIiN7b3B0aW9ucy5kZWxpbWl0ZXJ9I3tib2R5fSN7b3B0aW9ucy5kZWxpbWl0ZXJ9XCJcblxuICAgICMgVGhyb3dzIGFuIGVycm9yIGF0IGVpdGhlciBhIGdpdmVuIG9mZnNldCBmcm9tIHRoZSBjdXJyZW50IGNodW5rIG9yIGF0IHRoZSBsb2NhdGlvbiBvZiBhIHRva2VuIChgdG9rZW5bMl1gKS5cbiAgICBcbiAgICBlcnJvcjogKG1lc3NhZ2UsIG9wdGlvbnM9e30pIC0+XG4gICAgICAgIFxuICAgICAgICBsb2NhdGlvbiA9XG4gICAgICAgICAgICBpZiAnZmlyc3RfbGluZScgb2Ygb3B0aW9uc1xuICAgICAgICAgICAgICAgIG9wdGlvbnNcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBbZmlyc3RfbGluZSwgZmlyc3RfY29sdW1uXSA9IEBnZXRMaW5lQW5kQ29sdW1uRnJvbUNodW5rIG9wdGlvbnMub2Zmc2V0ID8gMFxuICAgICAgICAgICAgICAgIHtmaXJzdF9saW5lLCBmaXJzdF9jb2x1bW4sIGxhc3RfY29sdW1uOiBmaXJzdF9jb2x1bW4gKyAob3B0aW9ucy5sZW5ndGggPyAxKSAtIDF9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIHRocm93U3ludGF4RXJyb3IgbW9kdWxlOidsZXhlcicsIG1lc3NhZ2U6bWVzc2FnZSwgbG9jYXRpb246bG9jYXRpb25cblxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuXG5pc1VuYXNzaWduYWJsZSA9IChuYW1lLCBkaXNwbGF5TmFtZSA9IG5hbWUpIC0+IHN3aXRjaFxuICAgIFxuICAgIHdoZW4gbmFtZSBpbiBbSlNfS0VZV09SRFMuLi4sIENPRkZFRV9LRVlXT1JEUy4uLl1cbiAgICAgICAgXCJrZXl3b3JkICcje2Rpc3BsYXlOYW1lfScgY2FuJ3QgYmUgYXNzaWduZWRcIlxuICAgIHdoZW4gbmFtZSBpbiBTVFJJQ1RfUFJPU0NSSUJFRFxuICAgICAgICBcIicje2Rpc3BsYXlOYW1lfScgY2FuJ3QgYmUgYXNzaWduZWRcIlxuICAgIHdoZW4gbmFtZSBpbiBSRVNFUlZFRFxuICAgICAgICBcInJlc2VydmVkIHdvcmQgJyN7ZGlzcGxheU5hbWV9JyBjYW4ndCBiZSBhc3NpZ25lZFwiXG4gICAgZWxzZVxuICAgICAgICBmYWxzZVxuXG4jIGBmcm9tYCBpc27igJl0IGEga2V5d29yZCwgYnV0IGl0IGJlaGF2ZXMgbGlrZSBvbmUgaW4gYGltcG9ydGAgYW5kIGBleHBvcnRgIHN0YXRlbWVudHMgKGhhbmRsZWQgYWJvdmUpIFxuIyBhbmQgaW4gdGhlIGRlY2xhcmF0aW9uIGxpbmUgb2YgYSBgZm9yYCBsb29wLlxuIyBUcnkgdG8gZGV0ZWN0IHdoZW4gYGZyb21gIGlzIGEgdmFyaWFibGUgaWRlbnRpZmllciBhbmQgd2hlbiBpdCBpcyB0aGlzIOKAnHNvbWV0aW1lc+KAnSBrZXl3b3JkLlxuXG5pc0ZvckZyb20gPSAocHJldikgLT5cbiAgICBcbiAgICBpZiBwcmV2WzBdIGlzICdJREVOVElGSUVSJ1xuICAgICAgICAjIGBmb3IgaSBmcm9tIGZyb21gLCBgZm9yIGZyb20gZnJvbSBpdGVyYWJsZWBcbiAgICAgICAgaWYgcHJldlsxXSBpcyAnZnJvbSdcbiAgICAgICAgICAgIHByZXZbMV1bMF0gPSAnSURFTlRJRklFUidcbiAgICAgICAgICAgIHllc1xuICAgICAgICAjIGBmb3IgaSBmcm9tIGl0ZXJhYmxlYFxuICAgICAgICB5ZXNcbiAgICAjIGBmb3IgZnJvbeKApmBcbiAgICBlbHNlIGlmIHByZXZbMF0gaXMgJ0ZPUidcbiAgICAgICAgbm9cbiAgICAjIGBmb3Ige2Zyb2194oCmYCwgYGZvciBbZnJvbV3igKZgLCBgZm9yIHthLCBmcm9tfeKApmAsIGBmb3Ige2E6IGZyb2194oCmYFxuICAgIGVsc2UgaWYgcHJldlsxXSBpbiBbJ3snJ1snJywnJzonXVxuICAgICAgICBub1xuICAgIGVsc2VcbiAgICAgICAgeWVzXG5cbiMjI1xuIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiMjI1xuXG4jIEtleXdvcmRzIHRoYXQgd2Ugc2hhcmUgaW4gY29tbW9uIHdpdGggSmF2YVNjcmlwdC5cblxuTUVUQV9LRVlXT1JEUyA9IFsgJ2lmJyAndGhlbicgJ2VsaWYnICdlbHNlJyBdXG5cbkpTX0tFWVdPUkRTID0gW1xuICAgICd0cnVlJyAnZmFsc2UnICdudWxsJyAndGhpcydcbiAgICAnbmV3JyAnZGVsZXRlJyAndHlwZW9mJyAnaW4nICdpbnN0YW5jZW9mJ1xuICAgICdyZXR1cm4nICd0aHJvdycgJ2JyZWFrJyAnY29udGludWUnICdkZWJ1Z2dlcicgJ3lpZWxkJ1xuICAgICdpZicgJ2Vsc2UnICdzd2l0Y2gnICdmb3InICd3aGlsZScgJ2RvJyAndHJ5JyAnY2F0Y2gnICdmaW5hbGx5J1xuICAgICdjbGFzcycgJ2V4dGVuZHMnICdzdXBlcidcbiAgICAnaW1wb3J0JyAnZXhwb3J0JyAnZGVmYXVsdCdcbl1cblxuQ09GRkVFX0tFWVdPUkRTID0gWyAndW5kZWZpbmVkJyAnSW5maW5pdHknICdOYU4nICd0aGVuJyAndW5sZXNzJyAndW50aWwnICdsb29wJyAnb2YnICdieScgJ3doZW4nIF1cblxuQ09GRkVFX0FMSUFTX01BUCA9XG4gICAgYW5kICA6ICcmJidcbiAgICBvciAgIDogJ3x8J1xuICAgIGlzICAgOiAnPT0nXG4gICAgaXNudCA6ICchPScgIyB1Z2x5ISByZW1vdmUgaW4gY2FzZSBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSB3aXRoIENTMSBpcyBicm9rZW4uIFxuICAgIG5vdCAgOiAnISdcbiAgICB5ZXMgIDogJ3RydWUnXG4gICAgbm8gICA6ICdmYWxzZSdcbiAgICBvbiAgIDogJ3RydWUnXG4gICAgb2ZmICA6ICdmYWxzZSdcblxuQ09GRkVFX0FMSUFTRVMgID0gKGtleSBmb3Iga2V5IG9mIENPRkZFRV9BTElBU19NQVApXG5DT0ZGRUVfS0VZV09SRFMgPSBDT0ZGRUVfS0VZV09SRFMuY29uY2F0IENPRkZFRV9BTElBU0VTXG5cbiMgVGhlIGxpc3Qgb2Yga2V5d29yZHMgdGhhdCBhcmUgcmVzZXJ2ZWQgYnkgSmF2YVNjcmlwdCwgYnV0IG5vdCB1c2VkLCBvciB1c2VkIGludGVybmFsbHkuXG4jIFdlIHRocm93IGFuIGVycm9yIHdoZW4gdGhlc2UgYXJlIGVuY291bnRlcmVkLCB0byBhdm9pZCBoYXZpbmcgYSBKYXZhU2NyaXB0IGVycm9yIGF0IHJ1bnRpbWUuXG5cblJFU0VSVkVEID0gW1xuICAgICdjYXNlJyAnZnVuY3Rpb24nICd2YXInICd2b2lkJyAnd2l0aCcgJ2NvbnN0JyAnbGV0JyAnZW51bSdcbiAgICAnbmF0aXZlJyAnaW1wbGVtZW50cycgJ2ludGVyZmFjZScgJ3BhY2thZ2UnICdwcml2YXRlJ1xuICAgICdwcm90ZWN0ZWQnICdwdWJsaWMnICdzdGF0aWMnXG5dXG5cblNUUklDVF9QUk9TQ1JJQkVEID0gWydhcmd1bWVudHMnICdldmFsJ11cblxuIyBUaGUgc3VwZXJzZXQgb2YgYm90aCBKYXZhU2NyaXB0IGtleXdvcmRzIGFuZCByZXNlcnZlZCB3b3Jkcywgbm9uZSBvZiB3aGljaCBtYXlcbiMgYmUgdXNlZCBhcyBpZGVudGlmaWVycyBvciBwcm9wZXJ0aWVzLlxuXG5CT00gPSA2NTI3OSAjIFRoZSBjaGFyYWN0ZXIgY29kZSBvZiB0aGUgbmFzdHkgTWljcm9zb2Z0IG1hZG5lc3Mgb3RoZXJ3aXNlIGtub3duIGFzIHRoZSBCT00uXG5cbiMgVG9rZW4gbWF0Y2hpbmcgcmVnZXhlcy5cblxuSURFTlRJRklFUiA9IC8vLyBeXG4gICAgKD8hXFxkKVxuICAgICggKD86ICg/IVxccylbJFxcd1xceDdmLVxcdWZmZmZdICkrIClcbiAgICAoIFteXFxuXFxTXSogOiAoPyE6KSApPyAgICAjIElzIHRoaXMgYSBwcm9wZXJ0eSBuYW1lP1xuLy8vXG5cbk5VTUJFUiA9IC8vL1xuICAgIF4gMGJbMDFdKyAgICB8ICAgICAgICAgICAgICAjIGJpbmFyeVxuICAgIF4gMG9bMC03XSsgICB8ICAgICAgICAgICAgICAjIG9jdGFsXG4gICAgXiAweFtcXGRhLWZdKyB8ICAgICAgICAgICAgICAjIGhleFxuICAgIF4gXFxkKlxcLj9cXGQrICg/OmVbKy1dP1xcZCspPyAgIyBkZWNpbWFsXG4vLy9pXG5cbk9QRVJBVE9SID0gLy8vIF4gKFxuICAgID86IFstPV0+ICAgICAgICAgICAgICMgZnVuY3Rpb25cbiAgICAgfCBbLSsqLyU8PiZ8XiE/PV09ICAjIGNvbXBvdW5kIGFzc2lnbiAvIGNvbXBhcmVcbiAgICAgfCA+Pj49PyAgICAgICAgICAgICAjIHplcm8tZmlsbCByaWdodCBzaGlmdFxuICAgICB8IChbLSs6XSlcXDEgICAgICAgICAjIGRvdWJsZXNcbiAgICAgfCAoWyZ8PD4qLyVdKVxcMj0/ICAgIyBsb2dpYyAvIHNoaWZ0IC8gcG93ZXIgLyBmbG9vciBkaXZpc2lvbiAvIG1vZHVsb1xuICAgICB8IFxcPyhcXC58OjopICAgICAgICAgIyBzb2FrIGFjY2Vzc1xuICAgICB8IFxcLnsyLDN9ICAgICAgICAgICAjIHJhbmdlIG9yIHNwbGF0XG4pIC8vL1xuXG5XSElURVNQQUNFID0gL15bXlxcblxcU10rL1xuXG4jIENPTU1FTlQgICAgPSAvXiMjIyhbXiNdW1xcc1xcU10qPykoPzojIyNbXlxcblxcU10qfCMjIyQpfF4oPzpcXHMqIyg/ISMjW14jXSkuKikrLyAjIG1vdmVkIHRvIGVuZFxuXG5DT0RFICAgICAgID0gL15bLT1dPi9cblxuTVVMVElfREVOVCA9IC9eKD86XFxuW15cXG5cXFNdKikrL1xuXG5KU1RPS0VOICAgICAgPSAvLy9eIGAoPyFgYCkgKCg/OiBbXmBcXFxcXSB8IFxcXFxbXFxzXFxTXSAgICAgICAgICAgKSopIGAgICAvLy9cbkhFUkVfSlNUT0tFTiA9IC8vL14gYGBgICAgICAoKD86IFteYFxcXFxdIHwgXFxcXFtcXHNcXFNdIHwgYCg/IWBgKSApKikgYGBgIC8vL1xuXG4jIFN0cmluZy1tYXRjaGluZy1yZWdleGVzLlxuXG5TVFJJTkdfU1RBUlQgICA9IC9eKD86JycnfFwiXCJcInwnfFwiKS9cblxuU1RSSU5HX1NJTkdMRSAgPSAvLy8gXig/OiBbXlxcXFwnXSAgfCBcXFxcW1xcc1xcU10gICAgICAgICAgICAgICAgICAgICAgKSogLy8vXG5TVFJJTkdfRE9VQkxFICA9IC8vLyBeKD86IFteXFxcXFwiI10gfCBcXFxcW1xcc1xcU10gfCAgICAgICAgICAgXFwjKD8hXFx7KSApKiAvLy9cbkhFUkVET0NfU0lOR0xFID0gLy8vIF4oPzogW15cXFxcJ10gIHwgXFxcXFtcXHNcXFNdIHwgJyg/IScnKSAgICAgICAgICAgICkqIC8vL1xuSEVSRURPQ19ET1VCTEUgPSAvLy8gXig/OiBbXlxcXFxcIiNdIHwgXFxcXFtcXHNcXFNdIHwgXCIoPyFcIlwiKSB8IFxcIyg/IVxceykgKSogLy8vXG5cblNUUklOR19PTUlUICAgID0gLy8vXG4gICAgICAgICgoPzpcXFxcXFxcXCkrKSAgICAgICMgY29uc3VtZSAoYW5kIHByZXNlcnZlKSBhbiBldmVuIG51bWJlciBvZiBiYWNrc2xhc2hlc1xuICAgIHwgXFxcXFteXFxTXFxuXSpcXG5cXHMqICAgICMgcmVtb3ZlIGVzY2FwZWQgbmV3bGluZXNcbi8vL2dcblNJTVBMRV9TVFJJTkdfT01JVCA9IC9cXHMqXFxuXFxzKi9nXG5IRVJFRE9DX0lOREVOVCAgICAgICA9IC9cXG4rKFteXFxuXFxTXSopKD89XFxTKS9nXG5cbiMgUmVnZXgtbWF0Y2hpbmctcmVnZXhlcy5cblJFR0VYID0gLy8vIF5cbiAgICAvICg/IS8pICgoXG4gICAgPzogW14gWyAvIFxcbiBcXFxcIF0gICAgIyBldmVyeSBvdGhlciB0aGluZ1xuICAgICB8IFxcXFxbXlxcbl0gICAgICAgICAgICMgYW55dGhpbmcgYnV0IG5ld2xpbmVzIGVzY2FwZWRcbiAgICAgfCBcXFsgICAgICAgICAgICAgICAgIyBjaGFyYWN0ZXIgY2xhc3NcbiAgICAgICAgICAgICAoPzogXFxcXFteXFxuXSB8IFteIFxcXSBcXG4gXFxcXCBdICkqXG4gICAgICAgICBcXF1cbiAgICApKikgKC8pP1xuLy8vXG5cblJFR0VYX0ZMQUdTICA9IC9eXFx3Ki9cblZBTElEX0ZMQUdTICA9IC9eKD8hLiooLikuKlxcMSlbaW1ndXldKiQvXG5cbkhFUkVHRVggICAgICA9IC8vLyBeKD86IFteXFxcXC8jXSB8IFxcXFxbXFxzXFxTXSB8IC8oPyEvLykgfCBcXCMoPyFcXHspICkqIC8vL1xuXG5IRVJFR0VYX09NSVQgPSAvLy9cbiAgICAgICgoPzpcXFxcXFxcXCkrKSAgICAgICAgICAgIyBjb25zdW1lIChhbmQgcHJlc2VydmUpIGFuIGV2ZW4gbnVtYmVyIG9mIGJhY2tzbGFzaGVzXG4gICAgfCBcXFxcKFxccykgICAgICAgICAgICAgICAgIyBwcmVzZXJ2ZSBlc2NhcGVkIHdoaXRlc3BhY2VcbiAgICB8IFxccysoPzojLiopPyAgICAgICAgICAgIyByZW1vdmUgd2hpdGVzcGFjZSBhbmQgY29tbWVudHNcbi8vL2dcblxuUkVHRVhfSUxMRUdBTCA9IC8vLyBeICggLyB8IC97M31cXHMqKSAoXFwqKSAvLy9cblxuUE9TU0lCTFlfRElWSVNJT04gPSAvLy8gXiAvPT9cXHMgLy8vXG5cbiMgT3RoZXIgcmVnZXhlcy5cblxuSEVSRUNPTU1FTlRfSUxMRUdBTCA9IC9cXCpcXC8vXG5cbkxJTkVfQ09OVElOVUVSICAgICAgICAgID0gLy8vIF4gXFxzKiAoPzogLCB8IFxcPz9cXC4oPyFbLlxcZF0pIHwgOjogKSAvLy9cblxuU1RSSU5HX0lOVkFMSURfRVNDQVBFID0gLy8vXG4gICAgKCAoPzpefFteXFxcXF0pICg/OlxcXFxcXFxcKSogKSAgICAgICAgICAgICAgICAgICAjIG1ha2Ugc3VyZSB0aGUgZXNjYXBlIGlzbuKAmXQgZXNjYXBlZFxuICAgIFxcXFwgKCAgIFxuICAgICAgICAgPzogKDBbMC03XXxbMS03XSkgICAgICAgICAgICAgICAgICAgICAgIyBvY3RhbCBlc2NhcGVcbiAgICAgICAgICAgIHwgKHgoPyFbXFxkYS1mQS1GXXsyfSkuezAsMn0pICAgICAgICAjIGhleCBlc2NhcGVcbiAgICAgICAgICAgIHwgKHVcXHsoPyFbXFxkYS1mQS1GXXsxLH1cXH0pW159XSpcXH0/KSAjIHVuaWNvZGUgY29kZSBwb2ludCBlc2NhcGVcbiAgICAgICAgICAgIHwgKHUoPyFcXHt8W1xcZGEtZkEtRl17NH0pLnswLDR9KSAgICAgIyB1bmljb2RlIGVzY2FwZVxuICAgIClcbi8vL1xuUkVHRVhfSU5WQUxJRF9FU0NBUEUgPSAvLy9cbiAgICAoICg/Ol58W15cXFxcXSkgKD86XFxcXFxcXFwpKiApICAgICAgICAgICAgICAgICAgICMgbWFrZSBzdXJlIHRoZSBlc2NhcGUgaXNu4oCZdCBlc2NhcGVkXG4gICAgXFxcXCAoICAgXG4gICAgICAgICA/OiAoMFswLTddKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIG9jdGFsIGVzY2FwZVxuICAgICAgICAgICAgfCAoeCg/IVtcXGRhLWZBLUZdezJ9KS57MCwyfSkgICAgICAgICMgaGV4IGVzY2FwZVxuICAgICAgICAgICAgfCAodVxceyg/IVtcXGRhLWZBLUZdezEsfVxcfSlbXn1dKlxcfT8pICMgdW5pY29kZSBjb2RlIHBvaW50IGVzY2FwZVxuICAgICAgICAgICAgfCAodSg/IVxce3xbXFxkYS1mQS1GXXs0fSkuezAsNH0pICAgICAjIHVuaWNvZGUgZXNjYXBlXG4gICAgKVxuLy8vXG5cblVOSUNPREVfQ09ERV9QT0lOVF9FU0NBUEUgPSAvLy9cbiAgICAoIFxcXFxcXFxcICkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIG1ha2Ugc3VyZSB0aGUgZXNjYXBlIGlzbuKAmXQgZXNjYXBlZFxuICAgIHxcbiAgICBcXFxcdVxceyAoIFtcXGRhLWZBLUZdKyApIFxcfVxuLy8vZ1xuXG5MRUFESU5HX0JMQU5LX0xJTkUgID0gL15bXlxcblxcU10qXFxuL1xuVFJBSUxJTkdfQkxBTktfTElORSA9IC9cXG5bXlxcblxcU10qJC9cblRSQUlMSU5HX1NQQUNFUyAgICAgPSAvXFxzKyQvXG5DT01QT1VORF9BU1NJR04gICAgID0gWyAnLT0nICcrPScgJy89JyAnKj0nICclPScgJ3x8PScgJyYmPScgJz89JyAnPDw9JyAnPj49JyAnPj4+PScgJyY9JyAnXj0nICd8PScgJyoqPScgJy8vPScgJyUlPScgXVxuVU5BUlkgICAgICAgICAgICAgICA9IFsnTkVXJyAnVFlQRU9GJyAnREVMRVRFJyAnRE8nXVxuVU5BUllfTUFUSCAgICAgICAgICA9IFsnIScgJ34nXVxuU0hJRlQgICAgICAgICAgICAgICA9IFsnPDwnICc+PicgJz4+PiddXG5DT01QQVJFICAgICAgICAgICAgID0gWyc9PScgJyE9JyAnPCcgJz4nICc8PScgJz49J11cbk1BVEggICAgICAgICAgICAgICAgPSBbJyonICcvJyAnJScgJy8vJyAnJSUnXVxuUkVMQVRJT04gICAgICAgICAgICA9IFsnSU4nICdPRicgJ0lOU1RBTkNFT0YnXSAjIFJlbGF0aW9uYWwgdG9rZW5zIHRoYXQgYXJlIG5lZ2F0YWJsZSB3aXRoIGBub3RgIHByZWZpeC5cbkJPT0wgICAgICAgICAgICAgICAgPSBbJ1RSVUUnICdGQUxTRSddXG5cbiMgVG9rZW5zIHdoaWNoIGNvdWxkIGxlZ2l0aW1hdGVseSBiZSBpbnZva2VkIG9yIGluZGV4ZWQuIEFuIG9wZW5pbmdcbiMgcGFyZW50aGVzZXMgb3IgYnJhY2tldCBmb2xsb3dpbmcgdGhlc2UgdG9rZW5zIHdpbGwgYmUgcmVjb3JkZWQgYXMgdGhlIHN0YXJ0XG4jIG9mIGEgZnVuY3Rpb24gaW52b2NhdGlvbiBvciBpbmRleGluZyBvcGVyYXRpb24uXG5cbkNBTExBQkxFICA9IFsnSURFTlRJRklFUicgJ1BST1BFUlRZJyAnKScgJ10nICc/JyAnQCcgJ1RISVMnICdTVVBFUiddXG5JTkRFWEFCTEUgPSBDQUxMQUJMRS5jb25jYXQgWyAnTlVNQkVSJyAnSU5GSU5JVFknICdOQU4nICdTVFJJTkcnICdTVFJJTkdfRU5EJyAnUkVHRVgnICdSRUdFWF9FTkQnICdCT09MJyAnTlVMTCcgJ1VOREVGSU5FRCcgJ30nICc6OicgXVxuXG4jIFRva2VucyB3aGljaCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB3aWxsIG5ldmVyIGltbWVkaWF0ZWx5IGZvbGxvdyAoZXhjZXB0IHNwYWNlZFxuIyBDQUxMQUJMRXMgaW4gc29tZSBjYXNlcyksIGJ1dCB3aGljaCBhIGRpdmlzaW9uIG9wZXJhdG9yIGNhbi5cbiNcbiMgU2VlOiBodHRwOi8vd3d3LWFyY2hpdmUubW96aWxsYS5vcmcvanMvbGFuZ3VhZ2UvanMyMC0yMDAyLTA0L3JhdGlvbmFsZS9zeW50YXguaHRtbCNyZWd1bGFyLWV4cHJlc3Npb25zXG5cbk5PVF9SRUdFWCA9IElOREVYQUJMRS5jb25jYXQgWycrKycgJy0tJ11cblxuIyBUb2tlbnMgdGhhdCwgd2hlbiBpbW1lZGlhdGVseSBwcmVjZWRpbmcgYSBgV0hFTmAsIGluZGljYXRlIHRoYXQgdGhlIGBXSEVOYFxuIyBvY2N1cnMgYXQgdGhlIHN0YXJ0IG9mIGEgbGluZS4gV2UgZGlzYW1iaWd1YXRlIHRoZXNlIGZyb20gdHJhaWxpbmcgd2hlbnMgdG9cbiMgYXZvaWQgYW4gYW1iaWd1aXR5IGluIHRoZSBncmFtbWFyLlxuXG5MSU5FX0JSRUFLID0gWydJTkRFTlQnICdPVVRERU5UJyAnVEVSTUlOQVRPUiddXG5cbiMgQWRkaXRpb25hbCBpbmRlbnQgaW4gZnJvbnQgb2YgdGhlc2UgaXMgaWdub3JlZC5cblxuSU5ERU5UQUJMRV9DTE9TRVJTID0gWycpJyAnfScgJ10nXVxuXG4jIFRva2VucyB0aGF0LCB3aGVuIGFwcGVhcmluZyBhdCB0aGUgZW5kIG9mIGEgbGluZSwgc3VwcHJlc3MgYSBmb2xsb3dpbmcgVEVSTUlOQVRPUi9JTkRFTlQgdG9rZW5cblxuVU5GSU5JU0hFRCA9IFsnXFxcXCcgJy4nICc/LicgJz86OicgJ1VOQVJZJyAnTUFUSCcgJ1VOQVJZX01BVEgnICcrJyAnLSdcbiAgICAgICAgICAgICAgJyoqJyAnU0hJRlQnICdSRUxBVElPTicgJ0NPTVBBUkUnICcmJyAnXicgJ3wnICcmJicgJ3x8J1xuICAgICAgICAgICAgICAnQklOPycgJ1RIUk9XJyAnRVhURU5EUyddXG4gICAgICAgICAgICAgIFxuQ09NTUVOVCAgICA9IC9eIyMjKFteI11bXFxzXFxTXSo/KSg/OiMjI1teXFxuXFxTXSp8IyMjJCl8Xig/OlxccyojKD8hIyNbXiNdKS4qKSsvICAgICAgICAgICAgICBcblxubW9kdWxlLmV4cG9ydHMgPSBcbiAgICBKU19GT1JCSURERU46ICAgSlNfS0VZV09SRFMuY29uY2F0KFJFU0VSVkVEKS5jb25jYXQoU1RSSUNUX1BST1NDUklCRUQpXG4gICAgaXNVbmFzc2lnbmFibGU6IGlzVW5hc3NpZ25hYmxlXG4gICAgTGV4ZXI6ICAgICAgICAgIExleGVyXG4gICAgIl19
//# sourceURL=../coffee/lexer.coffee