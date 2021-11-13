// koffee 1.19.0

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
                break;
            }
        }
        if (lineIndent > this.indent) {
            numLines++;
        }
        cmmt = repeat(' ', this.indent + 4);
        cmmt += "'''";
        body = lines.slice(0, numLines - 1);
        after = lines.slice(numLines - 1);
        newCode = [doc, cmmt, body, cmmt, after].flat().join('\n');
        this.code = this.code.slice(0, this.chunkIndex) + newCode;
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

NUMBER = /^0b[01]+|^0o[0-7]+|^0x[\da-f]+|^\d+n|^\d*\.?\d+(?:e[+-]?\d+)?/i;

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

COMMENT = /^###([^#][\s\S]*?)(?:###[^\n\S]*|###$)|^(?:\s*#(?!##[^#]).*)+/;

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

module.exports = {
    JS_FORBIDDEN: JS_KEYWORDS.concat(RESERVED).concat(STRICT_PROSCRIBED),
    isUnassignable: isUnassignable,
    Lexer: Lexer
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4ZXIuanMiLCJzb3VyY2VSb290IjoiLi4vY29mZmVlIiwic291cmNlcyI6WyJsZXhlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsMDRCQUFBO0lBQUE7Ozs7QUFpQkEsUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztBQUVULGFBQWUsT0FBQSxDQUFRLFFBQVI7O0FBQ2pCLE1BQWdDLE9BQUEsQ0FBUSxZQUFSLENBQWhDLEVBQUUsaUNBQUYsRUFBaUI7O0FBQ2pCLE9BQTZFLE9BQUEsQ0FBUSxXQUFSLENBQTdFLEVBQUUsa0JBQUYsRUFBUyxvQkFBVCxFQUFpQixzQkFBakIsRUFBMEIsb0JBQTFCLEVBQWtDLGdEQUFsQyxFQUF3RDs7QUFLbEQ7Ozs7O29CQWlCRixRQUFBLEdBQVUsU0FBQyxJQUFELEVBQU8sSUFBUDtBQUVOLFlBQUE7UUFBQSxJQUFBLEdBQU8sYUFBQSxDQUFjLElBQWQ7UUFDUCxJQUFBLEdBQU8sVUFBQSxDQUFjLElBQWQ7UUFFUCxJQUFDLENBQUEsTUFBRCxHQUFjO1FBQ2QsSUFBQyxDQUFBLFVBQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxNQUFELEdBQWM7UUFDZCxJQUFDLENBQUEsT0FBRCxHQUFjO1FBQ2QsSUFBQyxDQUFBLE9BQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxJQUFELEdBQWM7UUFDZCxJQUFDLENBQUEsTUFBRCxHQUFjO1FBQ2QsSUFBQyxDQUFBLE9BQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxVQUFELEdBQWM7UUFDZCxJQUFDLENBQUEsVUFBRCxHQUFjO1FBQ2QsSUFBQyxDQUFBLG1CQUFELEdBQXVCO1FBQ3ZCLElBQUMsQ0FBQSxtQkFBRCxHQUF1QjtRQUV2QixJQUFDLENBQUEsU0FBRCxHQUFlLElBQUksQ0FBQyxJQUFMLElBQWE7UUFDNUIsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFJLENBQUMsTUFBTCxJQUFlO1FBQzlCLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBQyxD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QUFjLFVBQWQsRUFBeUIsR0FBekIsRUFBNkIsR0FBN0IsRUFBaUMsR0FBakMsRUFBcUMsR0FBckMsRUFBeUMsTUFBekMsRUFBZ0QsT0FBaEQ7O0FBQ1osU0FBQSxHQUFZLFFBQVEsQ0FBQyxNQUFULENBQWdCLENBQUUsUUFBRixFQUFXLFVBQVgsRUFBc0IsS0FBdEIsRUFBNEIsUUFBNUIsRUFBcUMsWUFBckMsRUFBa0QsT0FBbEQsRUFBMEQsV0FBMUQsRUFBc0UsTUFBdEUsRUFBNkUsTUFBN0UsRUFBb0YsV0FBcEYsRUFBZ0csR0FBaEcsRUFBb0csSUFBcEcsQ0FBaEI7O0FBT1osU0FBQSxHQUFZLFNBQVMsQ0FBQyxNQUFWLENBQWlCLENBQUMsSUFBRCxFQUFNLElBQU4sQ0FBakI7O0FBTVosVUFBQSxHQUFhLENBQUMsUUFBRCxFQUFVLFNBQVYsRUFBb0IsWUFBcEI7O0FBSWIsa0JBQUEsR0FBcUIsQ0FBQyxHQUFELEVBQUssR0FBTCxFQUFTLEdBQVQ7O0FBSXJCLFVBQUEsR0FBYSxDQUFDLElBQUQsRUFBTSxHQUFOLEVBQVUsSUFBVixFQUFlLEtBQWYsRUFBcUIsT0FBckIsRUFBNkIsTUFBN0IsRUFBb0MsWUFBcEMsRUFBaUQsR0FBakQsRUFBcUQsR0FBckQsRUFDQyxJQURELEVBQ00sT0FETixFQUNjLFVBRGQsRUFDeUIsU0FEekIsRUFDbUMsR0FEbkMsRUFDdUMsR0FEdkMsRUFDMkMsR0FEM0MsRUFDK0MsSUFEL0MsRUFDb0QsSUFEcEQsRUFFQyxNQUZELEVBRVEsT0FGUixFQUVnQixTQUZoQjs7QUFJYixNQUFNLENBQUMsT0FBUCxHQUNJO0lBQUEsWUFBQSxFQUFnQixXQUFXLENBQUMsTUFBWixDQUFtQixRQUFuQixDQUE0QixDQUFDLE1BQTdCLENBQW9DLGlCQUFwQyxDQUFoQjtJQUNBLGNBQUEsRUFBZ0IsY0FEaEI7SUFFQSxLQUFBLEVBQWdCLEtBRmhCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbjAwMCAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuMDAwICAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4wMDAgICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbjAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuIyMjXG5cbiMgVGhlIExleGVyIHVzZXMgYSBzZXJpZXMgb2YgdG9rZW4tbWF0Y2hpbmcgcmVnZXhlcyB0byBhdHRlbXB0IG1hdGNoZXMgYWdhaW5zdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBzb3VyY2UgY29kZS4gXG4jIFdoZW4gYSBtYXRjaCBpcyBmb3VuZCwgYSB0b2tlbiBpcyBwcm9kdWNlZCwgd2UgY29uc3VtZSB0aGUgbWF0Y2gsIGFuZCBzdGFydCBhZ2Fpbi4gXG4jIFRva2VucyBhcmUgaW4gdGhlIGZvcm06XG4jXG4jICAgIFt0YWcsIHZhbHVlLCBsb2NhdGlvbkRhdGFdXG4jXG4jIHdoZXJlIGxvY2F0aW9uRGF0YSBpcyB7Zmlyc3RfbGluZSwgZmlyc3RfY29sdW1uLCBsYXN0X2xpbmUsIGxhc3RfY29sdW1ufSwgXG4jIHdoaWNoIGlzIGEgZm9ybWF0IHRoYXQgY2FuIGJlIGZlZCBkaXJlY3RseSBpbnRvIEppc29uIHZpYSB0aGUgYHBhcnNlci5sZXhlcmAgZnVuY3Rpb24gZGVmaW5lZCBpbiBrb2ZmZWUuY29mZmVlLlxuXG5SZXdyaXRlciA9IHJlcXVpcmUgJy4vcmV3cml0ZXInXG5cbnsgaW5qZWN0TWV0YSB9ID0gcmVxdWlyZSAnLi9tZXRhJ1xueyBpbmplY3RGZWF0dXJlLCBoYXNGZWF0dXJlIH0gPSByZXF1aXJlICcuL2ZlYXR1cmVzJ1xueyBjb3VudCwgc3RhcnRzLCBjb21wYWN0LCByZXBlYXQsIGxvY2F0aW9uRGF0YVRvU3RyaW5nLCB0aHJvd1N5bnRheEVycm9yIH0gPSByZXF1aXJlICcuL2hlbHBlcnMnXG5cbiMgVGhlIExleGVyIGNsYXNzIHJlYWRzIGEgc3RyaW5nIGFuZCBkaXZ2aWVzIGl0IHVwIGludG8gdGFnZ2VkIHRva2Vucy4gXG4jIFNvbWUgcG90ZW50aWFsIGFtYmlndWl0eSBpbiB0aGUgZ3JhbW1hciBoYXMgYmVlbiBhdm9pZGVkIGJ5IHB1c2hpbmcgc29tZSBleHRyYSBzbWFydHMgaW50byB0aGUgTGV4ZXIuXG5cbmNsYXNzIExleGVyXG5cbiAgICAjIHRva2VuaXplIGlzIHRoZSBMZXhlcidzIG1haW4gbWV0aG9kLiBTY2FuIGJ5IGF0dGVtcHRpbmcgdG8gbWF0Y2ggdG9rZW5zXG4gICAgIyBvbmUgYXQgYSB0aW1lLCB1c2luZyBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBhbmNob3JlZCBhdCB0aGUgc3RhcnQgb2YgdGhlXG4gICAgIyByZW1haW5pbmcgY29kZSwgb3IgYSBjdXN0b20gcmVjdXJzaXZlIHRva2VuLW1hdGNoaW5nIG1ldGhvZCAoZm9yIGludGVycG9sYXRpb25zKS4gXG4gICAgIyBXaGVuIHRoZSBuZXh0IHRva2VuIGhhcyBiZWVuIHJlY29yZGVkLCB3ZSBtb3ZlIGZvcndhcmQgd2l0aGluIHRoZSBjb2RlIHBhc3QgdGhlIHRva2VuLCBhbmQgYmVnaW4gYWdhaW4uXG4gICAgI1xuICAgICMgRWFjaCB0b2tlbml6aW5nIG1ldGhvZCBpcyByZXNwb25zaWJsZSBmb3IgcmV0dXJuaW5nIHRoZSBudW1iZXIgb2YgY2hhcmFjdGVycyBpdCBoYXMgY29uc3VtZWQuXG4gICAgI1xuICAgICMgQmVmb3JlIHJldHVybmluZyB0aGUgdG9rZW4gc3RyZWFtLCBydW4gaXQgdGhyb3VnaCB0aGUgUmV3cml0ZXIuXG4gICAgXG4gICAgIyAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgICAgMDAwICAgMDAwICAgICAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgIDAwMCAgICAwMDAwMDAwICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICAgICAgICAgXG4gICAgdG9rZW5pemU6IChjb2RlLCBvcHRzKSA9PlxuXG4gICAgICAgIG9wdHMgPSBpbmplY3RGZWF0dXJlIG9wdHNcbiAgICAgICAgb3B0cyA9IGluamVjdE1ldGEgICAgb3B0cyAgIyBuZWVkZWQgdG8gc2hvcnRjdXQgbWV0YXMsIGUuZy4gQHRva2VuIC0+IEBpZiBAdG9rZW4gLi4uXG4gICAgICAgIFxuICAgICAgICBAaW5kZW50ICAgICA9IDAgICAgICAgICAgICAjIFRoZSBjdXJyZW50IGluZGVudGF0aW9uIGxldmVsLlxuICAgICAgICBAYmFzZUluZGVudCA9IDAgICAgICAgICAgICAjIFRoZSBvdmVyYWxsIG1pbmltdW0gaW5kZW50YXRpb24gbGV2ZWxcbiAgICAgICAgQGluZGVidCAgICAgPSAwICAgICAgICAgICAgIyBUaGUgb3Zlci1pbmRlbnRhdGlvbiBhdCB0aGUgY3VycmVudCBsZXZlbC5cbiAgICAgICAgQG91dGRlYnQgICAgPSAwICAgICAgICAgICAgIyBUaGUgdW5kZXItb3V0ZGVudGF0aW9uIGF0IHRoZSBjdXJyZW50IGxldmVsLlxuICAgICAgICBAaW5kZW50cyAgICA9IFtdICAgICAgICAgICAjIFRoZSBzdGFjayBvZiBhbGwgY3VycmVudCBpbmRlbnRhdGlvbiBsZXZlbHMuXG4gICAgICAgIEBlbmRzICAgICAgID0gW10gICAgICAgICAgICMgVGhlIHN0YWNrIGZvciBwYWlyaW5nIHVwIHRva2Vucy5cbiAgICAgICAgQHRva2VucyAgICAgPSBbXSAgICAgICAgICAgIyBTdHJlYW0gb2YgcGFyc2VkIHRva2VucyBpbiB0aGUgZm9ybSBgWydUWVBFJywgdmFsdWUsIGxvY2F0aW9uIGRhdGFdYC5cbiAgICAgICAgQHNlZW5Gb3IgICAgPSBubyAgICAgICAgICAgIyBVc2VkIHRvIHJlY29nbml6ZSBGT1JJTiwgRk9ST0YgYW5kIEZPUkZST00gdG9rZW5zLlxuICAgICAgICBAc2VlbkltcG9ydCA9IG5vICAgICAgICAgICAjIFVzZWQgdG8gcmVjb2duaXplIElNUE9SVCBGUk9NPyBBUz8gdG9rZW5zLlxuICAgICAgICBAc2VlbkV4cG9ydCA9IG5vICAgICAgICAgICAjIFVzZWQgdG8gcmVjb2duaXplIEVYUE9SVCBGUk9NPyBBUz8gdG9rZW5zLlxuICAgICAgICBAaW1wb3J0U3BlY2lmaWVyTGlzdCA9IG5vICAjIFVzZWQgdG8gaWRlbnRpZnkgd2hlbiBpbiBhbiBJTVBPUlQgey4uLn0gRlJPTT8gLi4uXG4gICAgICAgIEBleHBvcnRTcGVjaWZpZXJMaXN0ID0gbm8gICMgVXNlZCB0byBpZGVudGlmeSB3aGVuIGluIGFuIEVYUE9SVCB7Li4ufSBGUk9NPyAuLi5cblxuICAgICAgICBAY2h1bmtMaW5lICAgPSBvcHRzLmxpbmUgb3IgMCAgICAjIFRoZSBzdGFydCBsaW5lIGZvciB0aGUgY3VycmVudCBAY2h1bmsuXG4gICAgICAgIEBjaHVua0NvbHVtbiA9IG9wdHMuY29sdW1uIG9yIDAgICMgVGhlIHN0YXJ0IGNvbHVtbiBvZiB0aGUgY3VycmVudCBAY2h1bmsuXG4gICAgICAgIEBjb2RlID0gQGNsZWFuIGNvZGUgICAgICAgICAgICAgICMgVGhlIHN0cmlwcGVkLCBjbGVhbmVkIG9yaWdpbmFsIHNvdXJjZSBjb2RlLlxuXG4gICAgICAgICMgQXQgZXZlcnkgcG9zaXRpb24sIHJ1biB0aHJvdWdoIHRoaXMgbGlzdCBvZiBhdHRlbXB0ZWQgbWF0Y2hlcywgc2hvcnQtY2lyY3VpdGluZyBpZiBhbnkgb2YgdGhlbSBzdWNjZWVkLiBcbiAgICAgICAgIyBUaGVpciBvcmRlciBkZXRlcm1pbmVzIHByZWNlZGVuY2U6IGBAbGl0ZXJhbFRva2VuYCBpcyB0aGUgZmFsbGJhY2sgY2F0Y2gtYWxsLlxuICAgICAgICBcbiAgICAgICAgQGNodW5rSW5kZXggPSAwXG4gICAgICAgIHdoaWxlIEBjaHVuayA9IEBjb2RlW0BjaHVua0luZGV4Li5dXG4gICAgICAgICAgICBjb25zdW1lZCA9IFxcXG4gICAgICAgICAgICAgICAgICAgICBAZG9jVG9rZW4oKSAgICAgICAgb3JcbiAgICAgICAgICAgICAgICAgICAgIEBpZGVudGlmaWVyVG9rZW4oKSBvclxuICAgICAgICAgICAgICAgICAgICAgQGNvbW1lbnRUb2tlbigpICAgIG9yXG4gICAgICAgICAgICAgICAgICAgICBAd2hpdGVzcGFjZVRva2VuKCkgb3JcbiAgICAgICAgICAgICAgICAgICAgIEBsaW5lVG9rZW4oKSAgICAgICBvclxuICAgICAgICAgICAgICAgICAgICAgQHN0cmluZ1Rva2VuKCkgICAgIG9yXG4gICAgICAgICAgICAgICAgICAgICBAbnVtYmVyVG9rZW4oKSAgICAgb3JcbiAgICAgICAgICAgICAgICAgICAgIEByZWdleFRva2VuKCkgICAgICBvclxuICAgICAgICAgICAgICAgICAgICAgQGpzVG9rZW4oKSAgICAgICAgIG9yXG4gICAgICAgICAgICAgICAgICAgICBAbGl0ZXJhbFRva2VuKClcblxuICAgICAgICAgICAgIyBVcGRhdGUgcG9zaXRpb25cbiAgICAgICAgICAgIFtAY2h1bmtMaW5lLCBAY2h1bmtDb2x1bW5dID0gQGdldExpbmVBbmRDb2x1bW5Gcm9tQ2h1bmsgY29uc3VtZWRcblxuICAgICAgICAgICAgQGNodW5rSW5kZXggKz0gY29uc3VtZWRcblxuICAgICAgICAgICAgcmV0dXJuIHtAdG9rZW5zLCBpbmRleDogQGNodW5rSW5kZXh9IGlmIG9wdHMudW50aWxCYWxhbmNlZCBhbmQgQGVuZHMubGVuZ3RoIGlzIDBcblxuICAgICAgICBAY2xvc2VJbmRlbnRhdGlvbigpXG4gICAgICAgIEBlcnJvciBcIm1pc3NpbmcgI3tlbmQudGFnfVwiLCBlbmQub3JpZ2luWzJdIGlmIGVuZCA9IEBlbmRzLnBvcCgpXG4gICAgICAgIFxuICAgICAgICBpZiBoYXNGZWF0dXJlIG9wdHMsICdyZXdyaXRlJ1xuICAgICAgICAgICAgKG5ldyBSZXdyaXRlcikucmV3cml0ZSBAdG9rZW5zLCBvcHRzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHdhcm4gJ3NraXBwaW5nIHJld3JpdGUhJyMgLCBvcHRzXG5cbiAgICAgICAgQHRva2Vuc1xuXG4gICAgIyBQcmVwcm9jZXNzIHRoZSBjb2RlIHRvIHJlbW92ZSBsZWFkaW5nIGFuZCB0cmFpbGluZyB3aGl0ZXNwYWNlLCBjYXJyaWFnZSByZXR1cm5zLCBldGMuIFxuICAgIFxuICAgIGNsZWFuOiAoY29kZSkgLT5cbiAgICAgICAgXG4gICAgICAgIGNvZGUgPSBjb2RlLnNsaWNlKDEpIGlmIGNvZGUuY2hhckNvZGVBdCgwKSBpcyBCT01cbiAgICAgICAgY29kZSA9IGNvZGUucmVwbGFjZSgvXFxyL2csICcnKS5yZXBsYWNlIFRSQUlMSU5HX1NQQUNFUywgJydcbiAgICAgICAgaWYgV0hJVEVTUEFDRS50ZXN0IGNvZGVcbiAgICAgICAgICAgIGNvZGUgPSBcIlxcbiN7Y29kZX1cIlxuICAgICAgICAgICAgQGNodW5rTGluZS0tXG4gICAgICAgIGNvZGVcblxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAwMCAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgXG4gICAgXG4gICAgZG9jVG9rZW46IC0+XG5cbiAgICAgICAgRE9DID0gL14o4pa4fH4+KShkb2MpKFxccysoW1xcXCJdW15cXG5cXFwiXSpbXFxcIl18W1xcJ11bXlxcblxcJ10qW1xcJ10pKT9bXlxcblxcU10qXFxuL1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIDAgaWYgbm90IG1hdGNoID0gQGNodW5rLm1hdGNoIERPQ1xuICAgICAgICBcbiAgICAgICAgZG9jID0gbWF0Y2hbMF1cbiAgICAgICAgXG4gICAgICAgICMgbWFyY2ggdGhyb3VnaCBhbGwgZm9sbG93aW5nIGxpbmVzIHVudGlsIHNhbWUgb3Igc21hbGxlciBpbmRlbnQgaXMgZm91bmRcbiAgICAgICAgXG4gICAgICAgIHJlc3QgPSBAY2h1bmtbbWF0Y2hbMF0ubGVuZ3RoLi5dXG4gICAgICAgIFxuICAgICAgICBudW1MaW5lcyA9IDBcbiAgICAgICAgbGluZXMgPSByZXN0LnNwbGl0ICdcXG4nXG4gICAgICAgIGZvciBsaW5lIGluIGxpbmVzXG4gICAgICAgICAgICBudW1MaW5lcysrXG4gICAgICAgICAgICBtYXRjaCA9IFdISVRFU1BBQ0UuZXhlYyBsaW5lXG4gICAgICAgICAgICBpZiBtYXRjaFxuICAgICAgICAgICAgICAgIGxpbmVJbmRlbnQgPSBtYXRjaD9bMF0ubGVuZ3RoXG4gICAgICAgICAgICBlbHNlIGlmIGxpbmUubGVuZ3RoXG4gICAgICAgICAgICAgICAgbGluZUluZGVudCA9IDAgIyBsaW5lIHdpdGhvdXQgaW5kZW50YXRpb25cbiAgICAgICAgICAgIGVsc2UgXG4gICAgICAgICAgICAgICAgY29udGludWUgIyBpZ25vcmUgZW1wdHkgbGluZXNcbiAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgbGluZUluZGVudCA8PSBAaW5kZW50XG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgbGluZUluZGVudCA+IEBpbmRlbnQgdGhlbiBudW1MaW5lcysrICMgcHJvYmFibHkgYXQgZW5kIG9mIGlucHV0LCBpbmNsdWRlIGxhc3QgbGluZVxuICAgICAgICBcbiAgICAgICAgY21tdCA9IHJlcGVhdCAnICcsIEBpbmRlbnQrNFxuICAgICAgICBjbW10ICs9IFwiJycnXCJcbiAgICAgICAgYm9keSA9IGxpbmVzWy4uLm51bUxpbmVzLTFdXG4gICAgICAgIGFmdGVyID0gbGluZXNbbnVtTGluZXMtMS4uXVxuICAgICAgICBuZXdDb2RlID0gW2RvYywgY21tdCwgYm9keSwgY21tdCwgYWZ0ZXJdLmZsYXQoKS5qb2luICdcXG4nXG4gICAgICAgIEBjb2RlID0gQGNvZGVbLi4uQGNodW5rSW5kZXhdICsgbmV3Q29kZVxuICAgICAgICAjIOKWuGRiZyBAY29kZVxuICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgICMg4pa4ZGJnICdoZWFkJyBtYXRjaC5pbnB1dFsuLjEwMF1cbiAgICAgICAgXG4gICAgICAgIFxuICAgICMgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAwMDAwMCAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwMDAwICAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgICMgTWF0Y2hlcyBpZGVudGlmeWluZyBsaXRlcmFsczogdmFyaWFibGVzLCBrZXl3b3JkcywgbWV0aG9kIG5hbWVzLCBldGMuXG4gICAgIyBDaGVjayB0byBlbnN1cmUgdGhhdCBKYXZhU2NyaXB0IHJlc2VydmVkIHdvcmRzIGFyZW4ndCBiZWluZyB1c2VkIGFzIGlkZW50aWZpZXJzLiBcbiAgICAjIEJlY2F1c2UgS29mZmVlIHJlc2VydmVzIGEgaGFuZGZ1bCBvZiBrZXl3b3JkcyB0aGF0IGFyZSBhbGxvd2VkIGluIEphdmFTY3JpcHQsIFxuICAgICMgd2UncmUgY2FyZWZ1bCBub3QgdG8gdGFnIHRoZW0gYXMga2V5d29yZHMgd2hlbiByZWZlcmVuY2VkIGFzIHByb3BlcnR5IG5hbWVzIGhlcmUsIFxuICAgICMgc28geW91IGNhbiBzdGlsbCBkbyBgalF1ZXJ5LmlzKClgIGV2ZW4gdGhvdWdoIGBpc2AgbWVhbnMgYD09PWAgb3RoZXJ3aXNlLlxuICAgIFxuICAgIGlkZW50aWZpZXJUb2tlbjogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiAwIHVubGVzcyBtYXRjaCA9IElERU5USUZJRVIuZXhlYyBAY2h1bmtcbiAgICAgICAgW2lucHV0LCBpZCwgY29sb25dID0gbWF0Y2hcblxuICAgICAgICBpZExlbmd0aCA9IGlkLmxlbmd0aCAjIFByZXNlcnZlIGxlbmd0aCBvZiBpZCBmb3IgbG9jYXRpb24gZGF0YVxuICAgICAgICBwb3BwZWRUb2tlbiA9IHVuZGVmaW5lZFxuXG4gICAgICAgIGlmIGlkIGlzICdvd24nIGFuZCBAdGFnKCkgaXMgJ0ZPUidcbiAgICAgICAgICAgIEB0b2tlbiAnT1dOJywgaWRcbiAgICAgICAgICAgIHJldHVybiBpZC5sZW5ndGhcbiAgICAgICAgaWYgaWQgaXMgJ2Zyb20nIGFuZCBAdGFnKCkgaXMgJ1lJRUxEJ1xuICAgICAgICAgICAgQHRva2VuICdGUk9NJywgaWRcbiAgICAgICAgICAgIHJldHVybiBpZC5sZW5ndGhcbiAgICAgICAgaWYgaWQgaXMgJ2FzJyBhbmQgQHNlZW5JbXBvcnRcbiAgICAgICAgICAgIGlmIEB2YWx1ZSgpIGlzICcqJ1xuICAgICAgICAgICAgICAgIEB0b2tlbnNbQHRva2Vucy5sZW5ndGggLSAxXVswXSA9ICdJTVBPUlRfQUxMJ1xuICAgICAgICAgICAgZWxzZSBpZiBAdmFsdWUoKSBpbiBDT0ZGRUVfS0VZV09SRFNcbiAgICAgICAgICAgICAgICBAdG9rZW5zW0B0b2tlbnMubGVuZ3RoIC0gMV1bMF0gPSAnSURFTlRJRklFUidcbiAgICAgICAgICAgIGlmIEB0YWcoKSBpbiBbJ0RFRkFVTFQnICdJTVBPUlRfQUxMJyAnSURFTlRJRklFUiddXG4gICAgICAgICAgICAgICAgQHRva2VuICdBUycsIGlkXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlkLmxlbmd0aFxuICAgICAgICBpZiBpZCBpcyAnYXMnIGFuZCBAc2VlbkV4cG9ydCBhbmQgQHRhZygpIGluIFsnSURFTlRJRklFUicgJ0RFRkFVTFQnXVxuICAgICAgICAgICAgQHRva2VuICdBUycsIGlkXG4gICAgICAgICAgICByZXR1cm4gaWQubGVuZ3RoXG4gICAgICAgIGlmIGlkIGlzICdkZWZhdWx0JyBhbmQgQHNlZW5FeHBvcnQgYW5kIEB0YWcoKSBpbiBbJ0VYUE9SVCcgJ0FTJ11cbiAgICAgICAgICAgIEB0b2tlbiAnREVGQVVMVCcsIGlkXG4gICAgICAgICAgICByZXR1cm4gaWQubGVuZ3RoXG5cbiAgICAgICAgWy4uLiwgcHJldl0gPSBAdG9rZW5zXG5cbiAgICAgICAgdGFnID1cbiAgICAgICAgICAgIGlmIGNvbG9uIG9yIHByZXY/IGFuZCAocHJldlswXSBpbiBbJy4nICc/LicgJzo6JyAnPzo6J10gb3Igbm90IHByZXYuc3BhY2VkIGFuZCBwcmV2WzBdIGlzICdAJylcbiAgICAgICAgICAgICAgICAnUFJPUEVSVFknXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgJ0lERU5USUZJRVInXG5cbiAgICAgICAgaWYgdGFnIGlzICdJREVOVElGSUVSJyBhbmQgaWRbMF0gPT0gJ+KWuCcgYW5kIGlkWzEuLl0gaW4gTUVUQV9LRVlXT1JEU1xuICAgICAgICAgICAgaWYgaWQgPT0gJ+KWuGVsaWYnXG4gICAgICAgICAgICAgICAgQHRva2VuICdNRVRBX0VMU0UnLCAnZWxzZSdcbiAgICAgICAgICAgICAgICBAdG9rZW5zWy0xXS5zcGFjZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgdGFnID0gJ01FVEFfSUYnXG4gICAgICAgICAgICAgICAgaWQgID0gJ2lmJ1xuICAgICAgICAgICAgZWxzZSBpZiBpZCA9PSAn4pa4dGhlbidcbiAgICAgICAgICAgICAgICB0YWcgPSAnVEhFTidcbiAgICAgICAgICAgICAgICBpZCAgPSAndGhlbidcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpZCA9IGlkWzEuLl1cbiAgICAgICAgICAgICAgICB0YWcgPSAnTUVUQV8nICsgaWQudG9VcHBlckNhc2UoKVxuICAgICAgICAgICAgXG4gICAgICAgIGVsc2UgaWYgdGFnIGlzICdJREVOVElGSUVSJyBhbmQgKGlkIGluIEpTX0tFWVdPUkRTIG9yIGlkIGluIENPRkZFRV9LRVlXT1JEUykgYW5kIG5vdCAoQGV4cG9ydFNwZWNpZmllckxpc3QgYW5kIGlkIGluIENPRkZFRV9LRVlXT1JEUylcbiAgICAgICAgICAgIHRhZyA9IGlkLnRvVXBwZXJDYXNlKClcbiAgICAgICAgICAgIGlmIHRhZyBpcyAnV0hFTicgYW5kIEB0YWcoKSBpbiBMSU5FX0JSRUFLXG4gICAgICAgICAgICAgICAgdGFnID0gJ0xFQURJTkdfV0hFTidcbiAgICAgICAgICAgIGVsc2UgaWYgdGFnIGlzICdGT1InXG4gICAgICAgICAgICAgICAgQHNlZW5Gb3IgPSB5ZXNcbiAgICAgICAgICAgIGVsc2UgaWYgdGFnIGlzICdVTkxFU1MnXG4gICAgICAgICAgICAgICAgdGFnID0gJ0lGJ1xuICAgICAgICAgICAgZWxzZSBpZiB0YWcgaXMgJ0lNUE9SVCdcbiAgICAgICAgICAgICAgICBAc2VlbkltcG9ydCA9IHllc1xuICAgICAgICAgICAgZWxzZSBpZiB0YWcgaXMgJ0VYUE9SVCdcbiAgICAgICAgICAgICAgICBAc2VlbkV4cG9ydCA9IHllc1xuICAgICAgICAgICAgZWxzZSBpZiB0YWcgaW4gVU5BUllcbiAgICAgICAgICAgICAgICB0YWcgPSAnVU5BUlknXG4gICAgICAgICAgICBlbHNlIGlmIHRhZyBpbiBSRUxBVElPTlxuICAgICAgICAgICAgICAgIGlmIHRhZyAhPSAnSU5TVEFOQ0VPRicgYW5kIEBzZWVuRm9yXG4gICAgICAgICAgICAgICAgICAgIHRhZyA9ICdGT1InICsgdGFnXG4gICAgICAgICAgICAgICAgICAgIEBzZWVuRm9yID0gbm9cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHRhZyA9ICdSRUxBVElPTidcbiAgICAgICAgICAgICAgICAgICAgaWYgQHZhbHVlKCkgaXMgJyEnXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3BwZWRUb2tlbiA9IEB0b2tlbnMucG9wKClcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gJyEnICsgaWRcbiAgICAgICAgZWxzZSBpZiB0YWcgaXMgJ0lERU5USUZJRVInIGFuZCBAc2VlbkZvciBhbmQgaWQgaXMgJ2Zyb20nIGFuZCBpc0ZvckZyb20ocHJldilcbiAgICAgICAgICAgIHRhZyA9ICdGT1JGUk9NJ1xuICAgICAgICAgICAgQHNlZW5Gb3IgPSBub1xuXG4gICAgICAgIGlmIHRhZyBpcyAnSURFTlRJRklFUicgYW5kIGlkIGluIFJFU0VSVkVEXG4gICAgICAgICAgICBAZXJyb3IgXCJyZXNlcnZlZCB3b3JkICcje2lkfSdcIiwgbGVuZ3RoOmlkLmxlbmd0aFxuXG4gICAgICAgIHVubGVzcyB0YWcgaXMgJ1BST1BFUlRZJ1xuICAgICAgICAgICAgaWYgaWQgaW4gQ09GRkVFX0FMSUFTRVNcbiAgICAgICAgICAgICAgICBhbGlhcyA9IGlkXG4gICAgICAgICAgICAgICAgaWQgPSBDT0ZGRUVfQUxJQVNfTUFQW2lkXVxuICAgICAgICAgICAgdGFnID0gc3dpdGNoIGlkXG4gICAgICAgICAgICAgICAgd2hlbiAnIScgICAgICAgICAgICAgICAgICAgIHRoZW4gJ1VOQVJZJ1xuICAgICAgICAgICAgICAgIHdoZW4gJz09JywgJyE9JyAgICAgICAgICAgICB0aGVuICdDT01QQVJFJ1xuICAgICAgICAgICAgICAgIHdoZW4gJ3RydWUnLCAnZmFsc2UnICAgICAgICB0aGVuICdCT09MJ1xuICAgICAgICAgICAgICAgIHdoZW4gJyYmJywgJ3x8JyAgICAgICAgICAgICB0aGVuIGlkXG4gICAgICAgICAgICAgICAgd2hlbiAnYnJlYWsnLCAnY29udGludWUnLCAnZGVidWdnZXInIHRoZW4gJ1NUQVRFTUVOVCdcbiAgICAgICAgICAgICAgICBlbHNlICAgIHRhZ1xuXG4gICAgICAgIHRhZ1Rva2VuID0gQHRva2VuIHRhZywgaWQsIDAsIGlkTGVuZ3RoXG4gICAgICAgIHRhZ1Rva2VuLm9yaWdpbiA9IFt0YWcsIGFsaWFzLCB0YWdUb2tlblsyXV0gaWYgYWxpYXNcbiAgICAgICAgaWYgcG9wcGVkVG9rZW5cbiAgICAgICAgICAgIFt0YWdUb2tlblsyXS5maXJzdF9saW5lLCB0YWdUb2tlblsyXS5maXJzdF9jb2x1bW5dID1cbiAgICAgICAgICAgICAgICBbcG9wcGVkVG9rZW5bMl0uZmlyc3RfbGluZSwgcG9wcGVkVG9rZW5bMl0uZmlyc3RfY29sdW1uXVxuICAgICAgICBpZiBjb2xvblxuICAgICAgICAgICAgY29sb25PZmZzZXQgPSBpbnB1dC5sYXN0SW5kZXhPZiAnOidcbiAgICAgICAgICAgIEB0b2tlbiAnOicsICc6JywgY29sb25PZmZzZXQsIGNvbG9uLmxlbmd0aFxuXG4gICAgICAgIGlucHV0Lmxlbmd0aFxuXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcblxuICAgICMgTWF0Y2hlcyBudW1iZXJzLCBpbmNsdWRpbmcgZGVjaW1hbHMsIGhleCwgYW5kIGV4cG9uZW50aWFsIG5vdGF0aW9uLlxuICAgICMgQmUgY2FyZWZ1bCBub3QgdG8gaW50ZXJmZXJlIHdpdGggcmFuZ2VzLWluLXByb2dyZXNzLlxuICAgIFxuICAgIG51bWJlclRva2VuOiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIDAgdW5sZXNzIG1hdGNoID0gTlVNQkVSLmV4ZWMgQGNodW5rXG5cbiAgICAgICAgbnVtYmVyID0gbWF0Y2hbMF1cbiAgICAgICAgbGV4ZWRMZW5ndGggPSBudW1iZXIubGVuZ3RoXG5cbiAgICAgICAgc3dpdGNoXG4gICAgICAgICAgICB3aGVuIC9eMFtCT1hdLy50ZXN0IG51bWJlclxuICAgICAgICAgICAgICAgIEBlcnJvciBcInJhZGl4IHByZWZpeCBpbiAnI3tudW1iZXJ9JyBtdXN0IGJlIGxvd2VyY2FzZVwiLCBvZmZzZXQ6IDFcbiAgICAgICAgICAgIHdoZW4gL14oPyEweCkuKkUvLnRlc3QgbnVtYmVyXG4gICAgICAgICAgICAgICAgQGVycm9yIFwiZXhwb25lbnRpYWwgbm90YXRpb24gaW4gJyN7bnVtYmVyfScgbXVzdCBiZSBpbmRpY2F0ZWQgd2l0aCBhIGxvd2VyY2FzZSAnZSdcIixcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiBudW1iZXIuaW5kZXhPZignRScpXG4gICAgICAgICAgICB3aGVuIC9eMFxcZCpbODldLy50ZXN0IG51bWJlclxuICAgICAgICAgICAgICAgIEBlcnJvciBcImRlY2ltYWwgbGl0ZXJhbCAnI3tudW1iZXJ9JyBtdXN0IG5vdCBiZSBwcmVmaXhlZCB3aXRoICcwJ1wiLCBsZW5ndGg6IGxleGVkTGVuZ3RoXG4gICAgICAgICAgICB3aGVuIC9eMFxcZCsvLnRlc3QgbnVtYmVyXG4gICAgICAgICAgICAgICAgQGVycm9yIFwib2N0YWwgbGl0ZXJhbCAnI3tudW1iZXJ9JyBtdXN0IGJlIHByZWZpeGVkIHdpdGggJzBvJ1wiLCBsZW5ndGg6IGxleGVkTGVuZ3RoXG5cbiAgICAgICAgYmFzZSA9IHN3aXRjaCBudW1iZXIuY2hhckF0IDFcbiAgICAgICAgICAgIHdoZW4gJ2InIHRoZW4gMlxuICAgICAgICAgICAgd2hlbiAnbycgdGhlbiA4XG4gICAgICAgICAgICB3aGVuICd4JyB0aGVuIDE2XG4gICAgICAgICAgICBlbHNlIG51bGxcbiAgICAgICAgbnVtYmVyVmFsdWUgPSBpZiBiYXNlPyB0aGVuIHBhcnNlSW50KG51bWJlclsyLi5dLCBiYXNlKSBlbHNlIHBhcnNlRmxvYXQobnVtYmVyKVxuICAgICAgICBpZiBudW1iZXIuY2hhckF0KDEpIGluIFsnYicsICdvJ11cbiAgICAgICAgICAgIG51bWJlciA9IFwiMHgje251bWJlclZhbHVlLnRvU3RyaW5nIDE2fVwiXG5cbiAgICAgICAgdGFnID0gaWYgbnVtYmVyVmFsdWUgaXMgSW5maW5pdHkgdGhlbiAnSU5GSU5JVFknIGVsc2UgJ05VTUJFUidcbiAgICAgICAgQHRva2VuIHRhZywgbnVtYmVyLCAwLCBsZXhlZExlbmd0aFxuICAgICAgICBsZXhlZExlbmd0aFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICAjIE1hdGNoZXMgc3RyaW5ncywgaW5jbHVkaW5nIG11bHRpLWxpbmUgc3RyaW5ncywgYXMgd2VsbCBhcyBoZXJlZG9jcywgd2l0aCBvciB3aXRob3V0IGludGVycG9sYXRpb24uXG4gICAgXG4gICAgc3RyaW5nVG9rZW46IC0+XG4gICAgICAgIFxuICAgICAgICBbcXVvdGVdID0gU1RSSU5HX1NUQVJULmV4ZWMoQGNodW5rKSB8fCBbXVxuICAgICAgICByZXR1cm4gMCBpZiBub3QgcXVvdGVcblxuICAgICAgICAjIElmIHRoZSBwcmVjZWRpbmcgdG9rZW4gaXMgYGZyb21gIGFuZCB0aGlzIGlzIGFuIGltcG9ydCBvciBleHBvcnQgc3RhdGVtZW50LCBwcm9wZXJseSB0YWcgdGhlIGBmcm9tYC5cbiAgICAgICAgXG4gICAgICAgIGlmIEB0b2tlbnMubGVuZ3RoIGFuZCBAdmFsdWUoKSBpcyAnZnJvbScgYW5kIChAc2VlbkltcG9ydCBvciBAc2VlbkV4cG9ydClcbiAgICAgICAgICAgIEB0b2tlbnNbQHRva2Vucy5sZW5ndGggLSAxXVswXSA9ICdGUk9NJ1xuXG4gICAgICAgIHJlZ2V4ID0gc3dpdGNoIHF1b3RlXG4gICAgICAgICAgICB3aGVuIFwiJ1wiICAgdGhlbiBTVFJJTkdfU0lOR0xFXG4gICAgICAgICAgICB3aGVuICdcIicgICB0aGVuIFNUUklOR19ET1VCTEVcbiAgICAgICAgICAgIHdoZW4gXCInJydcIiB0aGVuIEhFUkVET0NfU0lOR0xFXG4gICAgICAgICAgICB3aGVuICdcIlwiXCInIHRoZW4gSEVSRURPQ19ET1VCTEVcbiAgICAgICAgaGVyZWRvYyA9IHF1b3RlLmxlbmd0aCBpcyAzXG5cbiAgICAgICAge3Rva2VucywgaW5kZXg6IGVuZH0gPSBAbWF0Y2hXaXRoSW50ZXJwb2xhdGlvbnMgcmVnZXgsIHF1b3RlXG4gICAgICAgICQgPSB0b2tlbnMubGVuZ3RoIC0gMVxuXG4gICAgICAgIGRlbGltaXRlciA9IHF1b3RlLmNoYXJBdCgwKVxuICAgICAgICBpZiBoZXJlZG9jXG4gICAgICAgICAgICAjIEZpbmQgdGhlIHNtYWxsZXN0IGluZGVudGF0aW9uLiBJdCB3aWxsIGJlIHJlbW92ZWQgZnJvbSBhbGwgbGluZXMgbGF0ZXIuXG4gICAgICAgICAgICBpbmRlbnQgPSBudWxsXG4gICAgICAgICAgICBkb2MgPSAodG9rZW5bMV0gZm9yIHRva2VuLCBpIGluIHRva2VucyB3aGVuIHRva2VuWzBdIGlzICdORU9TVFJJTkcnKS5qb2luICcje30nXG4gICAgICAgICAgICB3aGlsZSBtYXRjaCA9IEhFUkVET0NfSU5ERU5ULmV4ZWMgZG9jXG4gICAgICAgICAgICAgICAgYXR0ZW1wdCA9IG1hdGNoWzFdXG4gICAgICAgICAgICAgICAgaW5kZW50ID0gYXR0ZW1wdCBpZiBpbmRlbnQgaXMgbnVsbCBvciAwIDwgYXR0ZW1wdC5sZW5ndGggPCBpbmRlbnQubGVuZ3RoXG4gICAgICAgICAgICBpbmRlbnRSZWdleCA9IC8vLyBcXG4je2luZGVudH0gLy8vZyBpZiBpbmRlbnRcbiAgICAgICAgICAgIEBtZXJnZUludGVycG9sYXRpb25Ub2tlbnMgdG9rZW5zLCB7ZGVsaW1pdGVyfSwgKHZhbHVlLCBpKSA9PlxuICAgICAgICAgICAgICAgIHZhbHVlID0gQGZvcm1hdFN0cmluZyB2YWx1ZSwgZGVsaW1pdGVyOiBxdW90ZVxuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZSBpbmRlbnRSZWdleCwgJ1xcbicgaWYgaW5kZW50UmVnZXhcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UgTEVBRElOR19CTEFOS19MSU5FLCAgJycgaWYgaSBpcyAwXG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlIFRSQUlMSU5HX0JMQU5LX0xJTkUsICcnIGlmIGkgaXMgJFxuICAgICAgICAgICAgICAgIHZhbHVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBtZXJnZUludGVycG9sYXRpb25Ub2tlbnMgdG9rZW5zLCB7ZGVsaW1pdGVyfSwgKHZhbHVlLCBpKSA9PlxuICAgICAgICAgICAgICAgIHZhbHVlID0gQGZvcm1hdFN0cmluZyB2YWx1ZSwgZGVsaW1pdGVyOiBxdW90ZVxuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZSBTSU1QTEVfU1RSSU5HX09NSVQsIChtYXRjaCwgb2Zmc2V0KSAtPlxuICAgICAgICAgICAgICAgICAgICBpZiAoaSBpcyAwIGFuZCBvZmZzZXQgaXMgMCkgb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAoaSBpcyAkIGFuZCBvZmZzZXQgKyBtYXRjaC5sZW5ndGggaXMgdmFsdWUubGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICAgICAgJydcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgJyAnXG4gICAgICAgICAgICAgICAgdmFsdWVcbiAgICAgICAgZW5kXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAgICAwMDAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgY29tbWVudFRva2VuOiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIDAgdW5sZXNzIG1hdGNoID0gQGNodW5rLm1hdGNoIENPTU1FTlRcbiAgICAgICAgW2NvbW1lbnQsIGhlcmVdID0gbWF0Y2hcbiAgICAgICAgaWYgaGVyZVxuICAgICAgICAgICAgaWYgbWF0Y2ggPSBIRVJFQ09NTUVOVF9JTExFR0FMLmV4ZWMgY29tbWVudFxuICAgICAgICAgICAgICAgIEBlcnJvciBcImJsb2NrIGNvbW1lbnRzIGNhbm5vdCBjb250YWluICN7bWF0Y2hbMF19XCIsXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldDogbWF0Y2guaW5kZXgsIGxlbmd0aDogbWF0Y2hbMF0ubGVuZ3RoXG4gICAgICAgICAgICBpZiBoZXJlLmluZGV4T2YoJ1xcbicpID49IDBcbiAgICAgICAgICAgICAgICBoZXJlID0gaGVyZS5yZXBsYWNlIC8vLyBcXG4gI3tyZXBlYXQgJyAnLCBAaW5kZW50fSAvLy9nLCAnXFxuJ1xuICAgICAgICAgICAgQHRva2VuICdIRVJFQ09NTUVOVCcsIGhlcmUsIDAsIGNvbW1lbnQubGVuZ3RoXG4gICAgICAgIGNvbW1lbnQubGVuZ3RoXG4gICAgICAgIFxuICAgICMgICAgICAgMDAwICAgMDAwMDAwMCAgXG4gICAgIyAgICAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjICAgICAgIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICAjIE1hdGNoZXMgSmF2YVNjcmlwdCBpbnRlcnBvbGF0ZWQgZGlyZWN0bHkgaW50byB0aGUgc291cmNlIHZpYSBiYWNrdGlja3MuXG4gICAgXG4gICAganNUb2tlbjogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiAwIHVubGVzcyBAY2h1bmsuY2hhckF0KDApIGlzICdgJyBhbmRcbiAgICAgICAgICAgIChtYXRjaCA9IEhFUkVfSlNUT0tFTi5leGVjKEBjaHVuaykgb3IgSlNUT0tFTi5leGVjKEBjaHVuaykpXG4gICAgICAgICMgQ29udmVydCBlc2NhcGVkIGJhY2t0aWNrcyB0byBiYWNrdGlja3MsIGFuZCBlc2NhcGVkIGJhY2tzbGFzaGVzXG4gICAgICAgICMganVzdCBiZWZvcmUgZXNjYXBlZCBiYWNrdGlja3MgdG8gYmFja3NsYXNoZXNcbiAgICAgICAgc2NyaXB0ID0gbWF0Y2hbMV0ucmVwbGFjZSAvXFxcXCsoYHwkKS9nLCAoc3RyaW5nKSAtPlxuICAgICAgICAgICAgIyBgc3RyaW5nYCBpcyBhbHdheXMgYSB2YWx1ZSBsaWtlICdcXGAnLCAnXFxcXFxcYCcsICdcXFxcXFxcXFxcYCcsIGV0Yy5cbiAgICAgICAgICAgICMgQnkgcmVkdWNpbmcgaXQgdG8gaXRzIGxhdHRlciBoYWxmLCB3ZSB0dXJuICdcXGAnIHRvICdgJywgJ1xcXFxcXGAnIHRvICdcXGAnLCBldGMuXG4gICAgICAgICAgICBzdHJpbmdbLU1hdGguY2VpbChzdHJpbmcubGVuZ3RoIC8gMikuLl1cbiAgICAgICAgQHRva2VuICdKUycsIHNjcmlwdCwgMCwgbWF0Y2hbMF0ubGVuZ3RoXG4gICAgICAgIG1hdGNoWzBdLmxlbmd0aFxuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMCAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgICAgMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICAjIE1hdGNoZXMgcmVndWxhciBleHByZXNzaW9uIGxpdGVyYWxzLCBhcyB3ZWxsIGFzIG11bHRpbGluZSBleHRlbmRlZCBvbmVzLlxuICAgICMgTGV4aW5nIHJlZ3VsYXIgZXhwcmVzc2lvbnMgaXMgZGlmZmljdWx0IHRvIGRpc3Rpbmd1aXNoIGZyb20gZGl2aXNpb24sIFxuICAgICMgc28gd2UgYm9ycm93IHNvbWUgYmFzaWMgaGV1cmlzdGljcyBmcm9tIEphdmFTY3JpcHQgYW5kIFJ1YnkuXG4gICAgXG4gICAgcmVnZXhUb2tlbjogLT5cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaFxuICAgICAgICAgICAgd2hlbiBtYXRjaCA9IFJFR0VYX0lMTEVHQUwuZXhlYyBAY2h1bmtcbiAgICAgICAgICAgICAgICBAZXJyb3IgXCJyZWd1bGFyIGV4cHJlc3Npb25zIGNhbm5vdCBiZWdpbiB3aXRoICN7bWF0Y2hbMl19XCIsXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldDogbWF0Y2guaW5kZXggKyBtYXRjaFsxXS5sZW5ndGhcbiAgICAgICAgICAgIHdoZW4gbWF0Y2ggPSBAbWF0Y2hXaXRoSW50ZXJwb2xhdGlvbnMgSEVSRUdFWCwgJy8vLydcbiAgICAgICAgICAgICAgICB7dG9rZW5zLCBpbmRleH0gPSBtYXRjaFxuICAgICAgICAgICAgd2hlbiBtYXRjaCA9IFJFR0VYLmV4ZWMgQGNodW5rXG4gICAgICAgICAgICAgICAgW3JlZ2V4LCBib2R5LCBjbG9zZWRdID0gbWF0Y2hcbiAgICAgICAgICAgICAgICBAdmFsaWRhdGVFc2NhcGVzIGJvZHksIGlzUmVnZXg6IHllcywgb2Zmc2V0SW5DaHVuazogMVxuICAgICAgICAgICAgICAgIGJvZHkgPSBAZm9ybWF0UmVnZXggYm9keSwgZGVsaW1pdGVyOiAnLydcbiAgICAgICAgICAgICAgICBpbmRleCA9IHJlZ2V4Lmxlbmd0aFxuICAgICAgICAgICAgICAgIFsuLi4sIHByZXZdID0gQHRva2Vuc1xuICAgICAgICAgICAgICAgIGlmIHByZXZcbiAgICAgICAgICAgICAgICAgICAgaWYgcHJldi5zcGFjZWQgYW5kIHByZXZbMF0gaW4gQ0FMTEFCTEVcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAwIGlmIG5vdCBjbG9zZWQgb3IgUE9TU0lCTFlfRElWSVNJT04udGVzdCByZWdleFxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIHByZXZbMF0gaW4gTk9UX1JFR0VYXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMFxuICAgICAgICAgICAgICAgIEBlcnJvciAnbWlzc2luZyAvICh1bmNsb3NlZCByZWdleCknIHVubGVzcyBjbG9zZWRcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gMFxuXG4gICAgICAgIFtmbGFnc10gPSBSRUdFWF9GTEFHUy5leGVjIEBjaHVua1tpbmRleC4uXVxuICAgICAgICBlbmQgPSBpbmRleCArIGZsYWdzLmxlbmd0aFxuICAgICAgICBvcmlnaW4gPSBAbWFrZVRva2VuICdSRUdFWCcsIG51bGwsIDAsIGVuZFxuICAgICAgICBzd2l0Y2hcbiAgICAgICAgICAgIHdoZW4gbm90IFZBTElEX0ZMQUdTLnRlc3QgZmxhZ3NcbiAgICAgICAgICAgICAgICBAZXJyb3IgXCJpbnZhbGlkIHJlZ3VsYXIgZXhwcmVzc2lvbiBmbGFncyAje2ZsYWdzfVwiLCBvZmZzZXQ6IGluZGV4LCBsZW5ndGg6IGZsYWdzLmxlbmd0aFxuICAgICAgICAgICAgd2hlbiByZWdleCBvciB0b2tlbnMubGVuZ3RoIGlzIDFcbiAgICAgICAgICAgICAgICBib2R5ID89IEBmb3JtYXRIZXJlZ2V4IHRva2Vuc1swXVsxXVxuICAgICAgICAgICAgICAgIEB0b2tlbiAnUkVHRVgnLCBcIiN7QG1ha2VEZWxpbWl0ZWRMaXRlcmFsIGJvZHksIGRlbGltaXRlcjogJy8nfSN7ZmxhZ3N9XCIsIDAsIGVuZCwgb3JpZ2luXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHRva2VuICdSRUdFWF9TVEFSVCcsICcoJywgMCwgMCwgb3JpZ2luXG4gICAgICAgICAgICAgICAgQHRva2VuICdJREVOVElGSUVSJywgJ1JlZ0V4cCcsIDAsIDBcbiAgICAgICAgICAgICAgICBAdG9rZW4gJ0NBTExfU1RBUlQnLCAnKCcsIDAsIDBcbiAgICAgICAgICAgICAgICBAbWVyZ2VJbnRlcnBvbGF0aW9uVG9rZW5zIHRva2Vucywge2RlbGltaXRlcjogJ1wiJywgZG91YmxlOiB5ZXN9LCBAZm9ybWF0SGVyZWdleFxuICAgICAgICAgICAgICAgIGlmIGZsYWdzXG4gICAgICAgICAgICAgICAgICAgIEB0b2tlbiAnLCcsICcsJywgaW5kZXggLSAxLCAwXG4gICAgICAgICAgICAgICAgICAgIEB0b2tlbiAnU1RSSU5HJywgJ1wiJyArIGZsYWdzICsgJ1wiJywgaW5kZXggLSAxLCBmbGFncy5sZW5ndGhcbiAgICAgICAgICAgICAgICBAdG9rZW4gJyknLCAnKScsIGVuZCAtIDEsIDBcbiAgICAgICAgICAgICAgICBAdG9rZW4gJ1JFR0VYX0VORCcsICcpJywgZW5kIC0gMSwgMFxuXG4gICAgICAgIGVuZFxuXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICAjIE1hdGNoZXMgbmV3bGluZXMsIGluZGVudHMsIGFuZCBvdXRkZW50cywgYW5kIGRldGVybWluZXMgd2hpY2ggaXMgd2hpY2guXG4gICAgIyBJZiB3ZSBjYW4gZGV0ZWN0IHRoYXQgdGhlIGN1cnJlbnQgbGluZSBpcyBjb250aW51ZWQgb250byB0aGUgbmV4dCBsaW5lLFxuICAgICMgdGhlbiB0aGUgbmV3bGluZSBpcyBzdXBwcmVzc2VkOlxuICAgICNcbiAgICAjICAgICAgICAgICBlbGVtZW50c1xuICAgICMgICAgICAgICAgICAgICAuZWFjaCggLi4uIClcbiAgICAjICAgICAgICAgICAgICAgLm1hcCggLi4uIClcbiAgICAjXG4gICAgIyBLZWVwcyB0cmFjayBvZiB0aGUgbGV2ZWwgb2YgaW5kZW50YXRpb24sIGJlY2F1c2UgYSBzaW5nbGUgb3V0ZGVudCB0b2tlblxuICAgICMgY2FuIGNsb3NlIG11bHRpcGxlIGluZGVudHMsIHNvIHdlIG5lZWQgdG8ga25vdyBob3cgZmFyIGluIHdlIGhhcHBlbiB0byBiZS5cbiAgICBcbiAgICBsaW5lVG9rZW46IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gMCB1bmxlc3MgbWF0Y2ggPSBNVUxUSV9ERU5ULmV4ZWMgQGNodW5rXG4gICAgICAgIGluZGVudCA9IG1hdGNoWzBdXG5cbiAgICAgICAgQHNlZW5Gb3IgICAgPSBub1xuICAgICAgICBAc2VlbkltcG9ydCA9IG5vIHVubGVzcyBAaW1wb3J0U3BlY2lmaWVyTGlzdFxuICAgICAgICBAc2VlbkV4cG9ydCA9IG5vIHVubGVzcyBAZXhwb3J0U3BlY2lmaWVyTGlzdFxuXG4gICAgICAgIHNpemUgPSBpbmRlbnQubGVuZ3RoIC0gMSAtIGluZGVudC5sYXN0SW5kZXhPZiAnXFxuJ1xuICAgICAgICBub05ld2xpbmVzID0gQHVuZmluaXNoZWQoKVxuXG4gICAgICAgIGlmIHNpemUgLSBAaW5kZWJ0IGlzIEBpbmRlbnRcbiAgICAgICAgICAgIGlmIG5vTmV3bGluZXMgdGhlbiBAc3VwcHJlc3NOZXdsaW5lcygpIGVsc2UgQG5ld2xpbmVUb2tlbiAwXG4gICAgICAgICAgICByZXR1cm4gaW5kZW50Lmxlbmd0aFxuXG4gICAgICAgIGlmIHNpemUgPiBAaW5kZW50XG4gICAgICAgICAgICBpZiBub05ld2xpbmVzXG4gICAgICAgICAgICAgICAgQGluZGVidCA9IHNpemUgLSBAaW5kZW50XG4gICAgICAgICAgICAgICAgQHN1cHByZXNzTmV3bGluZXMoKVxuICAgICAgICAgICAgICAgIHJldHVybiBpbmRlbnQubGVuZ3RoXG4gICAgICAgICAgICB1bmxlc3MgQHRva2Vucy5sZW5ndGhcbiAgICAgICAgICAgICAgICBAYmFzZUluZGVudCA9IEBpbmRlbnQgPSBzaXplXG4gICAgICAgICAgICAgICAgcmV0dXJuIGluZGVudC5sZW5ndGhcbiAgICAgICAgICAgIGRpZmYgPSBzaXplIC0gQGluZGVudCArIEBvdXRkZWJ0XG4gICAgICAgICAgICBAdG9rZW4gJ0lOREVOVCcsIGRpZmYsIGluZGVudC5sZW5ndGggLSBzaXplLCBzaXplXG4gICAgICAgICAgICBAaW5kZW50cy5wdXNoIGRpZmZcbiAgICAgICAgICAgIEBlbmRzLnB1c2gge3RhZzogJ09VVERFTlQnfVxuICAgICAgICAgICAgQG91dGRlYnQgPSBAaW5kZWJ0ID0gMFxuICAgICAgICAgICAgQGluZGVudCA9IHNpemVcbiAgICAgICAgZWxzZSBpZiBzaXplIDwgQGJhc2VJbmRlbnRcbiAgICAgICAgICAgIEBlcnJvciAnbWlzc2luZyBpbmRlbnRhdGlvbicsIG9mZnNldDogaW5kZW50Lmxlbmd0aFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAaW5kZWJ0ID0gMFxuICAgICAgICAgICAgQG91dGRlbnRUb2tlbiBAaW5kZW50IC0gc2l6ZSwgbm9OZXdsaW5lcywgaW5kZW50Lmxlbmd0aFxuICAgICAgICBpbmRlbnQubGVuZ3RoXG5cbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICAjIFJlY29yZCBhbiBvdXRkZW50IHRva2VuIG9yIG11bHRpcGxlIHRva2VucywgaWYgd2UgaGFwcGVuIHRvIGJlIG1vdmluZyBiYWNrXG4gICAgIyBpbndhcmRzIHBhc3Qgc2V2ZXJhbCByZWNvcmRlZCBpbmRlbnRzLiBTZXRzIG5ldyBAaW5kZW50IHZhbHVlLlxuICAgIFxuICAgIG91dGRlbnRUb2tlbjogKG1vdmVPdXQsIG5vTmV3bGluZXMsIG91dGRlbnRMZW5ndGgpIC0+XG4gICAgICAgIFxuICAgICAgICBkZWNyZWFzZWRJbmRlbnQgPSBAaW5kZW50IC0gbW92ZU91dFxuICAgICAgICB3aGlsZSBtb3ZlT3V0ID4gMFxuICAgICAgICAgICAgbGFzdEluZGVudCA9IEBpbmRlbnRzW0BpbmRlbnRzLmxlbmd0aCAtIDFdXG4gICAgICAgICAgICBpZiBub3QgbGFzdEluZGVudFxuICAgICAgICAgICAgICAgIG1vdmVPdXQgPSAwXG4gICAgICAgICAgICBlbHNlIGlmIGxhc3RJbmRlbnQgaXMgQG91dGRlYnRcbiAgICAgICAgICAgICAgICBtb3ZlT3V0IC09IEBvdXRkZWJ0XG4gICAgICAgICAgICAgICAgQG91dGRlYnQgPSAwXG4gICAgICAgICAgICBlbHNlIGlmIGxhc3RJbmRlbnQgPCBAb3V0ZGVidFxuICAgICAgICAgICAgICAgIEBvdXRkZWJ0IC09IGxhc3RJbmRlbnRcbiAgICAgICAgICAgICAgICBtb3ZlT3V0ICAtPSBsYXN0SW5kZW50XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgZGVudCA9IEBpbmRlbnRzLnBvcCgpICsgQG91dGRlYnRcbiAgICAgICAgICAgICAgICBpZiBvdXRkZW50TGVuZ3RoIGFuZCBAY2h1bmtbb3V0ZGVudExlbmd0aF0gaW4gSU5ERU5UQUJMRV9DTE9TRVJTXG4gICAgICAgICAgICAgICAgICAgIGRlY3JlYXNlZEluZGVudCAtPSBkZW50IC0gbW92ZU91dFxuICAgICAgICAgICAgICAgICAgICBtb3ZlT3V0ID0gZGVudFxuICAgICAgICAgICAgICAgIEBvdXRkZWJ0ID0gMFxuICAgICAgICAgICAgICAgICMgcGFpciBtaWdodCBjYWxsIG91dGRlbnRUb2tlbiwgc28gcHJlc2VydmUgZGVjcmVhc2VkSW5kZW50XG4gICAgICAgICAgICAgICAgQHBhaXIgJ09VVERFTlQnXG4gICAgICAgICAgICAgICAgQHRva2VuICdPVVRERU5UJywgbW92ZU91dCwgMCwgb3V0ZGVudExlbmd0aFxuICAgICAgICAgICAgICAgIG1vdmVPdXQgLT0gZGVudFxuICAgICAgICBAb3V0ZGVidCAtPSBtb3ZlT3V0IGlmIGRlbnRcbiAgICAgICAgQHRva2Vucy5wb3AoKSB3aGlsZSBAdmFsdWUoKSBpcyAnOydcblxuICAgICAgICBAdG9rZW4gJ1RFUk1JTkFUT1InLCAnXFxuJywgb3V0ZGVudExlbmd0aCwgMCB1bmxlc3MgQHRhZygpIGlzICdURVJNSU5BVE9SJyBvciBub05ld2xpbmVzXG4gICAgICAgIEBpbmRlbnQgPSBkZWNyZWFzZWRJbmRlbnRcbiAgICAgICAgdGhpc1xuXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMCAgICAgMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgXG4gICAgIyBNYXRjaGVzIGFuZCBjb25zdW1lcyBub24tbWVhbmluZ2Z1bCB3aGl0ZXNwYWNlLiBUYWcgdGhlIHByZXZpb3VzIHRva2VuXG4gICAgIyBhcyBiZWluZyDigJxzcGFjZWTigJ0sIGJlY2F1c2UgdGhlcmUgYXJlIHNvbWUgY2FzZXMgd2hlcmUgaXQgbWFrZXMgYSBkaWZmZXJlbmNlLlxuICAgIFxuICAgIHdoaXRlc3BhY2VUb2tlbjogLT5cbiAgICAgICAgcmV0dXJuIDAgdW5sZXNzIChtYXRjaCA9IFdISVRFU1BBQ0UuZXhlYyBAY2h1bmspIG9yIChubGluZSA9IEBjaHVuay5jaGFyQXQoMCkgaXMgJ1xcbicpXG4gICAgICAgIFsuLi4sIHByZXZdID0gQHRva2Vuc1xuICAgICAgICBwcmV2W2lmIG1hdGNoIHRoZW4gJ3NwYWNlZCcgZWxzZSAnbmV3TGluZSddID0gdHJ1ZSBpZiBwcmV2XG4gICAgICAgIGlmIG1hdGNoIHRoZW4gbWF0Y2hbMF0ubGVuZ3RoIGVsc2UgMFxuXG4gICAgIyBHZW5lcmF0ZSBhIG5ld2xpbmUgdG9rZW4uIENvbnNlY3V0aXZlIG5ld2xpbmVzIGdldCBtZXJnZWQgdG9nZXRoZXIuXG4gICAgXG4gICAgbmV3bGluZVRva2VuOiAob2Zmc2V0KSAtPlxuICAgICAgICBAdG9rZW5zLnBvcCgpIHdoaWxlIEB2YWx1ZSgpIGlzICc7J1xuICAgICAgICBAdG9rZW4gJ1RFUk1JTkFUT1InLCAnXFxuJywgb2Zmc2V0LCAwIHVubGVzcyBAdGFnKCkgaXMgJ1RFUk1JTkFUT1InXG4gICAgICAgIHRoaXNcblxuICAgICMgVXNlIGEgYFxcYCBhdCBhIGxpbmUtZW5kaW5nIHRvIHN1cHByZXNzIHRoZSBuZXdsaW5lLlxuICAgICMgVGhlIHNsYXNoIGlzIHJlbW92ZWQgaGVyZSBvbmNlIGl0cyBqb2IgaXMgZG9uZS5cbiAgICBcbiAgICBzdXBwcmVzc05ld2xpbmVzOiAtPlxuICAgICAgICBAdG9rZW5zLnBvcCgpIGlmIEB2YWx1ZSgpIGlzICdcXFxcJ1xuICAgICAgICB0aGlzXG5cbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgIFxuICAgICMgMDAwICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgXG4gICAgIyAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIFxuICAgICMgMDAwMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgXG4gICAgXG4gICAgIyBXZSB0cmVhdCBhbGwgb3RoZXIgc2luZ2xlIGNoYXJhY3RlcnMgYXMgYSB0b2tlbi4gRS5nLjogYCggKSAsIC4gIWBcbiAgICAjIE11bHRpLWNoYXJhY3RlciBvcGVyYXRvcnMgYXJlIGFsc28gbGl0ZXJhbCB0b2tlbnMsIHNvIHRoYXQgSmlzb24gY2FuIGFzc2lnblxuICAgICMgdGhlIHByb3BlciBvcmRlciBvZiBvcGVyYXRpb25zLiBUaGVyZSBhcmUgc29tZSBzeW1ib2xzIHRoYXQgd2UgdGFnIHNwZWNpYWxseVxuICAgICMgaGVyZS4gYDtgIGFuZCBuZXdsaW5lcyBhcmUgYm90aCB0cmVhdGVkIGFzIGEgYFRFUk1JTkFUT1JgLCB3ZSBkaXN0aW5ndWlzaFxuICAgICMgcGFyZW50aGVzZXMgdGhhdCBpbmRpY2F0ZSBhIG1ldGhvZCBjYWxsIGZyb20gcmVndWxhciBwYXJlbnRoZXNlcywgYW5kIHNvIG9uLlxuICAgIFxuICAgIGxpdGVyYWxUb2tlbjogLT5cbiAgICAgICAgXG4gICAgICAgIGlmIG1hdGNoID0gT1BFUkFUT1IuZXhlYyBAY2h1bmtcbiAgICAgICAgICAgIFt2YWx1ZV0gPSBtYXRjaFxuICAgICAgICAgICAgQHRhZ1BhcmFtZXRlcnMoKSBpZiBDT0RFLnRlc3QgdmFsdWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdmFsdWUgPSBAY2h1bmsuY2hhckF0IDBcbiAgICAgICAgdGFnICA9IHZhbHVlXG4gICAgICAgIFsuLi4sIHByZXZdID0gQHRva2Vuc1xuXG4gICAgICAgIGlmIHByZXYgYW5kIHZhbHVlIGluIFsnPScsIENPTVBPVU5EX0FTU0lHTi4uLl1cbiAgICAgICAgICAgIHNraXBUb2tlbiA9IGZhbHNlXG4gICAgICAgICAgICBpZiB2YWx1ZSBpcyAnPScgYW5kIHByZXZbMV0gaW4gWyd8fCcsICcmJiddIGFuZCBub3QgcHJldi5zcGFjZWRcbiAgICAgICAgICAgICAgICBwcmV2WzBdID0gJ0NPTVBPVU5EX0FTU0lHTidcbiAgICAgICAgICAgICAgICBwcmV2WzFdICs9ICc9J1xuICAgICAgICAgICAgICAgIHByZXYgPSBAdG9rZW5zW0B0b2tlbnMubGVuZ3RoIC0gMl1cbiAgICAgICAgICAgICAgICBza2lwVG9rZW4gPSB0cnVlXG4gICAgICAgICAgICBpZiBwcmV2IGFuZCBwcmV2WzBdICE9ICdQUk9QRVJUWSdcbiAgICAgICAgICAgICAgICBvcmlnaW4gPSBwcmV2Lm9yaWdpbiA/IHByZXZcbiAgICAgICAgICAgICAgICBtZXNzYWdlID0gaXNVbmFzc2lnbmFibGUgcHJldlsxXSwgb3JpZ2luWzFdXG4gICAgICAgICAgICAgICAgQGVycm9yIG1lc3NhZ2UsIG9yaWdpblsyXSBpZiBtZXNzYWdlXG4gICAgICAgICAgICByZXR1cm4gdmFsdWUubGVuZ3RoIGlmIHNraXBUb2tlblxuXG4gICAgICAgIGlmIHZhbHVlIGlzICd7JyBhbmQgQHNlZW5JbXBvcnRcbiAgICAgICAgICAgIEBpbXBvcnRTcGVjaWZpZXJMaXN0ID0geWVzXG4gICAgICAgIGVsc2UgaWYgQGltcG9ydFNwZWNpZmllckxpc3QgYW5kIHZhbHVlIGlzICd9J1xuICAgICAgICAgICAgQGltcG9ydFNwZWNpZmllckxpc3QgPSBub1xuICAgICAgICBlbHNlIGlmIHZhbHVlIGlzICd7JyBhbmQgcHJldj9bMF0gaXMgJ0VYUE9SVCdcbiAgICAgICAgICAgIEBleHBvcnRTcGVjaWZpZXJMaXN0ID0geWVzXG4gICAgICAgIGVsc2UgaWYgQGV4cG9ydFNwZWNpZmllckxpc3QgYW5kIHZhbHVlIGlzICd9J1xuICAgICAgICAgICAgQGV4cG9ydFNwZWNpZmllckxpc3QgPSBub1xuXG4gICAgICAgIGlmIHZhbHVlIGlzICc7J1xuICAgICAgICAgICAgQHNlZW5Gb3IgPSBAc2VlbkltcG9ydCA9IEBzZWVuRXhwb3J0ID0gbm9cbiAgICAgICAgICAgIHRhZyA9ICdURVJNSU5BVE9SJ1xuICAgICAgICBlbHNlIGlmIHZhbHVlIGlzICcqJyBhbmQgcHJldlswXSBpcyAnRVhQT1JUJ1xuICAgICAgICAgICAgdGFnID0gJ0VYUE9SVF9BTEwnXG4gICAgICAgIGVsc2UgaWYgdmFsdWUgaW4gTUFUSCAgICAgICAgICAgICAgICAgICB0aGVuIHRhZyA9ICdNQVRIJ1xuICAgICAgICBlbHNlIGlmIHZhbHVlIGluIENPTVBBUkUgICAgICAgICAgICAgICAgdGhlbiB0YWcgPSAnQ09NUEFSRSdcbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpbiBDT01QT1VORF9BU1NJR04gICAgICAgIHRoZW4gdGFnID0gJ0NPTVBPVU5EX0FTU0lHTidcbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpbiBVTkFSWSAgICAgICAgICAgICAgICAgIHRoZW4gdGFnID0gJ1VOQVJZJ1xuICAgICAgICBlbHNlIGlmIHZhbHVlIGluIFVOQVJZX01BVEggICAgICAgICAgICAgdGhlbiB0YWcgPSAnVU5BUllfTUFUSCdcbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpbiBTSElGVCAgICAgICAgICAgICAgICAgIHRoZW4gdGFnID0gJ1NISUZUJ1xuICAgICAgICBlbHNlIGlmIHZhbHVlIGlzICc/JyBhbmQgcHJldj8uc3BhY2VkICAgdGhlbiB0YWcgPSAnQklOPydcbiAgICAgICAgZWxzZSBpZiBwcmV2IGFuZCBub3QgcHJldi5zcGFjZWRcbiAgICAgICAgICAgIGlmIHZhbHVlIGlzICcoJyBhbmQgcHJldlswXSBpbiBDQUxMQUJMRVxuICAgICAgICAgICAgICAgIHByZXZbMF0gPSAnRlVOQ19FWElTVCcgaWYgcHJldlswXSBpcyAnPydcbiAgICAgICAgICAgICAgICB0YWcgPSAnQ0FMTF9TVEFSVCdcbiAgICAgICAgICAgIGVsc2UgaWYgdmFsdWUgaXMgJ1snIGFuZCBwcmV2WzBdIGluIElOREVYQUJMRVxuICAgICAgICAgICAgICAgIHRhZyA9ICdJTkRFWF9TVEFSVCdcbiAgICAgICAgICAgICAgICBzd2l0Y2ggcHJldlswXVxuICAgICAgICAgICAgICAgICAgICB3aGVuICc/JyAgICB0aGVuIHByZXZbMF0gPSAnSU5ERVhfU09BSydcbiAgICAgICAgdG9rZW4gPSBAbWFrZVRva2VuIHRhZywgdmFsdWVcbiAgICAgICAgc3dpdGNoIHZhbHVlXG4gICAgICAgICAgICB3aGVuICcoJywgJ3snLCAnWycgdGhlbiBAZW5kcy5wdXNoIHt0YWc6IFJld3JpdGVyLklOVkVSU0VTW3ZhbHVlXSwgb3JpZ2luOiB0b2tlbn1cbiAgICAgICAgICAgIHdoZW4gJyknLCAnfScsICddJyB0aGVuIEBwYWlyIHZhbHVlXG4gICAgICAgIEB0b2tlbnMucHVzaCB0b2tlblxuICAgICAgICB2YWx1ZS5sZW5ndGhcblxuICAgICMjI1xuICAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIFxuICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIFxuICAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgICMjI1xuICAgIFxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgIyBBIHNvdXJjZSBvZiBhbWJpZ3VpdHkgaW4gb3VyIGdyYW1tYXIgdXNlZCB0byBiZSBwYXJhbWV0ZXIgbGlzdHMgaW4gZnVuY3Rpb25cbiAgICAjIGRlZmluaXRpb25zIHZlcnN1cyBhcmd1bWVudCBsaXN0cyBpbiBmdW5jdGlvbiBjYWxscy4gV2FsayBiYWNrd2FyZHMsIHRhZ2dpbmdcbiAgICAjIHBhcmFtZXRlcnMgc3BlY2lhbGx5IGluIG9yZGVyIHRvIG1ha2UgdGhpbmdzIGVhc2llciBmb3IgdGhlIHBhcnNlci5cbiAgICAgICAgXG4gICAgdGFnUGFyYW1ldGVyczogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzIGlmIEB0YWcoKSAhPSAnKSdcbiAgICAgICAgc3RhY2sgPSBbXVxuICAgICAgICB7dG9rZW5zfSA9IHRoaXNcbiAgICAgICAgaSA9IHRva2Vucy5sZW5ndGhcbiAgICAgICAgdG9rZW5zWy0taV1bMF0gPSAnUEFSQU1fRU5EJ1xuICAgICAgICB3aGlsZSB0b2sgPSB0b2tlbnNbLS1pXVxuICAgICAgICAgICAgc3dpdGNoIHRva1swXVxuICAgICAgICAgICAgICAgIHdoZW4gJyknXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2ggdG9rXG4gICAgICAgICAgICAgICAgd2hlbiAnKCcsICdDQUxMX1NUQVJUJ1xuICAgICAgICAgICAgICAgICAgICBpZiBzdGFjay5sZW5ndGggdGhlbiBzdGFjay5wb3AoKVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIHRva1swXSBpcyAnKCdcbiAgICAgICAgICAgICAgICAgICAgICAgIHRva1swXSA9ICdQQVJBTV9TVEFSVCdcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgcmV0dXJuIHRoaXNcbiAgICAgICAgdGhpc1xuXG4gICAgIyBDbG9zZSB1cCBhbGwgcmVtYWluaW5nIG9wZW4gYmxvY2tzIGF0IHRoZSBlbmQgb2YgdGhlIGZpbGUuXG4gICAgXG4gICAgY2xvc2VJbmRlbnRhdGlvbjogLT4gQG91dGRlbnRUb2tlbiBAaW5kZW50XG5cbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgIyBNYXRjaCB0aGUgY29udGVudHMgb2YgYSBkZWxpbWl0ZWQgdG9rZW4gYW5kIGV4cGFuZCB2YXJpYWJsZXMgYW5kIGV4cHJlc3Npb25zXG4gICAgIyBpbnNpZGUgaXQgdXNpbmcgUnVieS1saWtlIG5vdGF0aW9uIGZvciBzdWJzdGl0dXRpb24gb2YgYXJiaXRyYXJ5IGV4cHJlc3Npb25zLlxuICAgICNcbiAgICAjICAgIFwiSGVsbG8gI3tuYW1lLmNhcGl0YWxpemUoKX0uXCJcbiAgICAjXG4gICAgIyBJZiBpdCBlbmNvdW50ZXJzIGFuIGludGVycG9sYXRpb24sIHRoaXMgbWV0aG9kIHdpbGwgcmVjdXJzaXZlbHkgY3JlYXRlIGEgbmV3XG4gICAgIyBMZXhlciBhbmQgdG9rZW5pemUgdW50aWwgdGhlIGB7YCBvZiBgI3tgIGlzIGJhbGFuY2VkIHdpdGggYSBgfWAuXG4gICAgI1xuICAgICMgICAgLSBgcmVnZXhgIG1hdGNoZXMgdGhlIGNvbnRlbnRzIG9mIGEgdG9rZW4gKGJ1dCBub3QgYGRlbGltaXRlcmAsIGFuZCBub3RcbiAgICAjICAgICAgICBgI3tgIGlmIGludGVycG9sYXRpb25zIGFyZSBkZXNpcmVkKS5cbiAgICAjICAgIC0gYGRlbGltaXRlcmAgaXMgdGhlIGRlbGltaXRlciBvZiB0aGUgdG9rZW4uIEV4YW1wbGVzIGFyZSBgJ2AsIGBcImAsIGAnJydgLFxuICAgICMgICAgICAgIGBcIlwiXCJgIGFuZCBgLy8vYC5cbiAgICAjXG4gICAgIyBUaGlzIG1ldGhvZCBhbGxvd3MgdXMgdG8gaGF2ZSBzdHJpbmdzIHdpdGhpbiBpbnRlcnBvbGF0aW9ucyB3aXRoaW4gc3RyaW5ncywgYWQgaW5maW5pdHVtLlxuICAgIFxuICAgIG1hdGNoV2l0aEludGVycG9sYXRpb25zOiAocmVnZXgsIGRlbGltaXRlcikgLT5cbiAgICAgICAgXG4gICAgICAgIHRva2VucyA9IFtdXG4gICAgICAgIG9mZnNldEluQ2h1bmsgPSBkZWxpbWl0ZXIubGVuZ3RoXG4gICAgICAgIHJldHVybiBudWxsIHVubGVzcyBAY2h1bmtbLi4ub2Zmc2V0SW5DaHVua10gaXMgZGVsaW1pdGVyXG4gICAgICAgIHN0ciA9IEBjaHVua1tvZmZzZXRJbkNodW5rLi5dXG4gICAgICAgIGxvb3BcbiAgICAgICAgICAgIFtzdHJQYXJ0XSA9IHJlZ2V4LmV4ZWMgc3RyXG5cbiAgICAgICAgICAgIEB2YWxpZGF0ZUVzY2FwZXMgc3RyUGFydCwge2lzUmVnZXg6IGRlbGltaXRlci5jaGFyQXQoMCkgaXMgJy8nLCBvZmZzZXRJbkNodW5rfVxuXG4gICAgICAgICAgICAjIFB1c2ggYSBmYWtlICdORU9TVFJJTkcnIHRva2VuLCB3aGljaCB3aWxsIGdldCB0dXJuZWQgaW50byBhIHJlYWwgc3RyaW5nIGxhdGVyLlxuICAgICAgICAgICAgdG9rZW5zLnB1c2ggQG1ha2VUb2tlbiAnTkVPU1RSSU5HJywgc3RyUGFydCwgb2Zmc2V0SW5DaHVua1xuXG4gICAgICAgICAgICBzdHIgPSBzdHJbc3RyUGFydC5sZW5ndGguLl1cbiAgICAgICAgICAgIG9mZnNldEluQ2h1bmsgKz0gc3RyUGFydC5sZW5ndGhcblxuICAgICAgICAgICAgYnJlYWsgdW5sZXNzIHN0clsuLi4yXSBpcyAnI3snXG5cbiAgICAgICAgICAgICMgVGhlIGAxYHMgYXJlIHRvIHJlbW92ZSB0aGUgYCNgIGluIGAje2AuXG4gICAgICAgICAgICBbbGluZSwgY29sdW1uXSA9IEBnZXRMaW5lQW5kQ29sdW1uRnJvbUNodW5rIG9mZnNldEluQ2h1bmsgKyAxXG4gICAgICAgICAgICB7dG9rZW5zOiBuZXN0ZWQsIGluZGV4fSA9XG4gICAgICAgICAgICAgICAgbmV3IExleGVyKCkudG9rZW5pemUgc3RyWzEuLl0sIGxpbmU6IGxpbmUsIGNvbHVtbjogY29sdW1uLCB1bnRpbEJhbGFuY2VkOiBvblxuICAgICAgICAgICAgIyBTa2lwIHRoZSB0cmFpbGluZyBgfWAuXG4gICAgICAgICAgICBpbmRleCArPSAxXG5cbiAgICAgICAgICAgICMgVHVybiB0aGUgbGVhZGluZyBhbmQgdHJhaWxpbmcgYHtgIGFuZCBgfWAgaW50byBwYXJlbnRoZXNlcy4gVW5uZWNlc3NhcnlcbiAgICAgICAgICAgICMgcGFyZW50aGVzZXMgd2lsbCBiZSByZW1vdmVkIGxhdGVyLlxuICAgICAgICAgICAgW29wZW4sIC4uLiwgY2xvc2VdID0gbmVzdGVkXG4gICAgICAgICAgICBvcGVuWzBdICA9IG9wZW5bMV0gID0gJygnXG4gICAgICAgICAgICBjbG9zZVswXSA9IGNsb3NlWzFdID0gJyknXG4gICAgICAgICAgICBjbG9zZS5vcmlnaW4gPSBbJycsICdlbmQgb2YgaW50ZXJwb2xhdGlvbicsIGNsb3NlWzJdXVxuXG4gICAgICAgICAgICAjIFJlbW92ZSBsZWFkaW5nICdURVJNSU5BVE9SJyAoaWYgYW55KS5cbiAgICAgICAgICAgIG5lc3RlZC5zcGxpY2UgMSwgMSBpZiBuZXN0ZWRbMV0/WzBdIGlzICdURVJNSU5BVE9SJ1xuXG4gICAgICAgICAgICAjIFB1c2ggYSBmYWtlICdUT0tFTlMnIHRva2VuLCB3aGljaCB3aWxsIGdldCB0dXJuZWQgaW50byByZWFsIHRva2VucyBsYXRlci5cbiAgICAgICAgICAgIHRva2Vucy5wdXNoIFsnVE9LRU5TJywgbmVzdGVkXVxuXG4gICAgICAgICAgICBzdHIgPSBzdHJbaW5kZXguLl1cbiAgICAgICAgICAgIG9mZnNldEluQ2h1bmsgKz0gaW5kZXhcblxuICAgICAgICB1bmxlc3Mgc3RyWy4uLmRlbGltaXRlci5sZW5ndGhdIGlzIGRlbGltaXRlclxuICAgICAgICAgICAgQGVycm9yIFwibWlzc2luZyAje2RlbGltaXRlcn1cIiwgbGVuZ3RoOiBkZWxpbWl0ZXIubGVuZ3RoXG5cbiAgICAgICAgW2ZpcnN0VG9rZW4sIC4uLiwgbGFzdFRva2VuXSA9IHRva2Vuc1xuICAgICAgICBmaXJzdFRva2VuWzJdLmZpcnN0X2NvbHVtbiAtPSBkZWxpbWl0ZXIubGVuZ3RoXG4gICAgICAgIGlmIGxhc3RUb2tlblsxXS5zdWJzdHIoLTEpIGlzICdcXG4nXG4gICAgICAgICAgICBsYXN0VG9rZW5bMl0ubGFzdF9saW5lICs9IDFcbiAgICAgICAgICAgIGxhc3RUb2tlblsyXS5sYXN0X2NvbHVtbiA9IGRlbGltaXRlci5sZW5ndGggLSAxXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGxhc3RUb2tlblsyXS5sYXN0X2NvbHVtbiArPSBkZWxpbWl0ZXIubGVuZ3RoXG4gICAgICAgIGxhc3RUb2tlblsyXS5sYXN0X2NvbHVtbiAtPSAxIGlmIGxhc3RUb2tlblsxXS5sZW5ndGggaXMgMFxuXG4gICAgICAgIHt0b2tlbnMsIGluZGV4OiBvZmZzZXRJbkNodW5rICsgZGVsaW1pdGVyLmxlbmd0aH1cblxuICAgICMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgIyBNZXJnZSB0aGUgYXJyYXkgYHRva2Vuc2Agb2YgdGhlIGZha2UgdG9rZW4gdHlwZXMgJ1RPS0VOUycgYW5kICdORU9TVFJJTkcnICAoYXMgcmV0dXJuZWQgYnkgYG1hdGNoV2l0aEludGVycG9sYXRpb25zYCkgaW50byB0aGUgdG9rZW4gc3RyZWFtLiBcbiAgICAjIFRoZSB2YWx1ZSBvZiAnTkVPU1RSSU5HJ3MgYXJlIGNvbnZlcnRlZCB1c2luZyBgZm5gIGFuZCB0dXJuZWQgaW50byBzdHJpbmdzIHVzaW5nIGBvcHRpb25zYCBmaXJzdC5cbiAgICBcbiAgICBtZXJnZUludGVycG9sYXRpb25Ub2tlbnM6ICh0b2tlbnMsIG9wdGlvbnMsIGZuKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgdG9rZW5zLmxlbmd0aCA+IDFcbiAgICAgICAgICAgIGxwYXJlbiA9IEB0b2tlbiAnU1RSSU5HX1NUQVJUJywgJygnLCAwLCAwXG5cbiAgICAgICAgZmlyc3RJbmRleCA9IEB0b2tlbnMubGVuZ3RoXG4gICAgICAgIGZvciB0b2tlbiwgaSBpbiB0b2tlbnNcbiAgICAgICAgICAgIFt0YWcsIHZhbHVlXSA9IHRva2VuXG4gICAgICAgICAgICBzd2l0Y2ggdGFnXG4gICAgICAgICAgICAgICAgd2hlbiAnVE9LRU5TJ1xuICAgICAgICAgICAgICAgICAgICAjIE9wdGltaXplIG91dCBlbXB0eSBpbnRlcnBvbGF0aW9ucyAoYW4gZW1wdHkgcGFpciBvZiBwYXJlbnRoZXNlcykuXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlIGlmIHZhbHVlLmxlbmd0aCBpcyAyXG4gICAgICAgICAgICAgICAgICAgICMgUHVzaCBhbGwgdGhlIHRva2VucyBpbiB0aGUgZmFrZSAnVE9LRU5TJyB0b2tlbi4gXG4gICAgICAgICAgICAgICAgICAgICMgVGhlc2UgYWxyZWFkeSBoYXZlIHNhbmUgbG9jYXRpb24gZGF0YS5cbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb25Ub2tlbiA9IHZhbHVlWzBdXG4gICAgICAgICAgICAgICAgICAgIHRva2Vuc1RvUHVzaCA9IHZhbHVlXG4gICAgICAgICAgICAgICAgd2hlbiAnTkVPU1RSSU5HJ1xuICAgICAgICAgICAgICAgICAgICAjIENvbnZlcnQgJ05FT1NUUklORycgaW50byAnU1RSSU5HJy5cbiAgICAgICAgICAgICAgICAgICAgY29udmVydGVkID0gZm4uY2FsbCB0aGlzLCB0b2tlblsxXSwgaVxuICAgICAgICAgICAgICAgICAgICAjIE9wdGltaXplIG91dCBlbXB0eSBzdHJpbmdzLiBXZSBlbnN1cmUgdGhhdCB0aGUgdG9rZW5zIHN0cmVhbSBhbHdheXNcbiAgICAgICAgICAgICAgICAgICAgIyBzdGFydHMgd2l0aCBhIHN0cmluZyB0b2tlbiwgdGhvdWdoLCB0byBtYWtlIHN1cmUgdGhhdCB0aGUgcmVzdWx0XG4gICAgICAgICAgICAgICAgICAgICMgcmVhbGx5IGlzIGEgc3RyaW5nLlxuICAgICAgICAgICAgICAgICAgICBpZiBjb252ZXJ0ZWQubGVuZ3RoIGlzIDBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGkgaXMgMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0RW1wdHlTdHJpbmdJbmRleCA9IEB0b2tlbnMubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgICAgICAgICAgIyBIb3dldmVyLCB0aGVyZSBpcyBvbmUgY2FzZSB3aGVyZSB3ZSBjYW4gb3B0aW1pemUgYXdheSBhIHN0YXJ0aW5nIGVtcHR5IHN0cmluZy5cbiAgICAgICAgICAgICAgICAgICAgaWYgaSBpcyAyIGFuZCBmaXJzdEVtcHR5U3RyaW5nSW5kZXg/XG4gICAgICAgICAgICAgICAgICAgICAgICBAdG9rZW5zLnNwbGljZSBmaXJzdEVtcHR5U3RyaW5nSW5kZXgsIDIgIyBSZW1vdmUgZW1wdHkgc3RyaW5nIGFuZCB0aGUgcGx1cy5cbiAgICAgICAgICAgICAgICAgICAgdG9rZW5bMF0gPSAnU1RSSU5HJ1xuICAgICAgICAgICAgICAgICAgICB0b2tlblsxXSA9IEBtYWtlRGVsaW1pdGVkTGl0ZXJhbCBjb252ZXJ0ZWQsIG9wdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb25Ub2tlbiA9IHRva2VuXG4gICAgICAgICAgICAgICAgICAgIHRva2Vuc1RvUHVzaCA9IFt0b2tlbl1cbiAgICAgICAgICAgIGlmIEB0b2tlbnMubGVuZ3RoID4gZmlyc3RJbmRleFxuICAgICAgICAgICAgICAgICMgQ3JlYXRlIGEgMC1sZW5ndGggXCIrXCIgdG9rZW4uXG4gICAgICAgICAgICAgICAgcGx1c1Rva2VuID0gQHRva2VuICcrJywgJysnXG4gICAgICAgICAgICAgICAgcGx1c1Rva2VuWzJdID1cbiAgICAgICAgICAgICAgICAgICAgZmlyc3RfbGluZTogICBsb2NhdGlvblRva2VuWzJdLmZpcnN0X2xpbmVcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RfY29sdW1uOiBsb2NhdGlvblRva2VuWzJdLmZpcnN0X2NvbHVtblxuICAgICAgICAgICAgICAgICAgICBsYXN0X2xpbmU6ICAgIGxvY2F0aW9uVG9rZW5bMl0uZmlyc3RfbGluZVxuICAgICAgICAgICAgICAgICAgICBsYXN0X2NvbHVtbjogIGxvY2F0aW9uVG9rZW5bMl0uZmlyc3RfY29sdW1uXG4gICAgICAgICAgICBAdG9rZW5zLnB1c2ggdG9rZW5zVG9QdXNoLi4uXG5cbiAgICAgICAgaWYgbHBhcmVuXG4gICAgICAgICAgICBbLi4uLCBsYXN0VG9rZW5dID0gdG9rZW5zXG4gICAgICAgICAgICBscGFyZW4ub3JpZ2luID0gWydTVFJJTkcnLCBudWxsLFxuICAgICAgICAgICAgICAgIGZpcnN0X2xpbmU6ICAgbHBhcmVuWzJdLmZpcnN0X2xpbmVcbiAgICAgICAgICAgICAgICBmaXJzdF9jb2x1bW46IGxwYXJlblsyXS5maXJzdF9jb2x1bW5cbiAgICAgICAgICAgICAgICBsYXN0X2xpbmU6ICAgIGxhc3RUb2tlblsyXS5sYXN0X2xpbmVcbiAgICAgICAgICAgICAgICBsYXN0X2NvbHVtbjogIGxhc3RUb2tlblsyXS5sYXN0X2NvbHVtblxuICAgICAgICAgICAgXVxuICAgICAgICAgICAgcnBhcmVuID0gQHRva2VuICdTVFJJTkdfRU5EJywgJyknXG4gICAgICAgICAgICBycGFyZW5bMl0gPVxuICAgICAgICAgICAgICAgIGZpcnN0X2xpbmU6ICAgbGFzdFRva2VuWzJdLmxhc3RfbGluZVxuICAgICAgICAgICAgICAgIGZpcnN0X2NvbHVtbjogbGFzdFRva2VuWzJdLmxhc3RfY29sdW1uXG4gICAgICAgICAgICAgICAgbGFzdF9saW5lOiAgICBsYXN0VG9rZW5bMl0ubGFzdF9saW5lXG4gICAgICAgICAgICAgICAgbGFzdF9jb2x1bW46ICBsYXN0VG9rZW5bMl0ubGFzdF9jb2x1bW5cblxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgIyBQYWlycyB1cCBhIGNsb3NpbmcgdG9rZW4sIGVuc3VyaW5nIHRoYXQgYWxsIGxpc3RlZCBwYWlycyBvZiB0b2tlbnMgYXJlXG4gICAgIyBjb3JyZWN0bHkgYmFsYW5jZWQgdGhyb3VnaG91dCB0aGUgY291cnNlIG9mIHRoZSB0b2tlbiBzdHJlYW0uXG4gICAgXG4gICAgcGFpcjogKHRhZykgLT5cbiAgICAgICAgXG4gICAgICAgIFsuLi4sIHByZXZdID0gQGVuZHNcbiAgICAgICAgdW5sZXNzIHRhZyBpcyB3YW50ZWQgPSBwcmV2Py50YWdcbiAgICAgICAgICAgIEBlcnJvciBcInVubWF0Y2hlZCAje3RhZ31cIiB1bmxlc3MgJ09VVERFTlQnIGlzIHdhbnRlZFxuICAgICAgICAgICAgIyBBdXRvLWNsb3NlIElOREVOVCB0byBzdXBwb3J0IHN5bnRheCBsaWtlIHRoaXM6XG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjICAgICBlbC5jbGljaygoZXZlbnQpIC0+XG4gICAgICAgICAgICAjICAgICAgICAgZWwuaGlkZSgpKVxuICAgICAgICAgICAgWy4uLiwgbGFzdEluZGVudF0gPSBAaW5kZW50c1xuICAgICAgICAgICAgQG91dGRlbnRUb2tlbiBsYXN0SW5kZW50LCB0cnVlXG4gICAgICAgICAgICByZXR1cm4gQHBhaXIgdGFnXG4gICAgICAgIEBlbmRzLnBvcCgpXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG5cbiAgICAjIFJldHVybnMgdGhlIGxpbmUgYW5kIGNvbHVtbiBudW1iZXIgZnJvbSBhbiBvZmZzZXQgaW50byB0aGUgY3VycmVudCBjaHVuay5cbiAgICAjXG4gICAgIyBgb2Zmc2V0YCBpcyBhIG51bWJlciBvZiBjaGFyYWN0ZXJzIGludG8gQGNodW5rLlxuICAgIFxuICAgIGdldExpbmVBbmRDb2x1bW5Gcm9tQ2h1bms6IChvZmZzZXQpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBvZmZzZXQgaXMgMFxuICAgICAgICAgICAgcmV0dXJuIFtAY2h1bmtMaW5lLCBAY2h1bmtDb2x1bW5dXG5cbiAgICAgICAgaWYgb2Zmc2V0ID49IEBjaHVuay5sZW5ndGhcbiAgICAgICAgICAgIHN0cmluZyA9IEBjaHVua1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzdHJpbmcgPSBAY2h1bmtbLi5vZmZzZXQtMV1cblxuICAgICAgICBsaW5lQ291bnQgPSBjb3VudCBzdHJpbmcsICdcXG4nXG5cbiAgICAgICAgY29sdW1uID0gQGNodW5rQ29sdW1uXG4gICAgICAgIGlmIGxpbmVDb3VudCA+IDBcbiAgICAgICAgICAgIFsuLi4sIGxhc3RMaW5lXSA9IHN0cmluZy5zcGxpdCAnXFxuJ1xuICAgICAgICAgICAgY29sdW1uID0gbGFzdExpbmUubGVuZ3RoXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGNvbHVtbiArPSBzdHJpbmcubGVuZ3RoXG5cbiAgICAgICAgW0BjaHVua0xpbmUgKyBsaW5lQ291bnQsIGNvbHVtbl1cblxuICAgICMgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwMCAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwMCAgXG4gICAgIyAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICAjIFNhbWUgYXMgXCJ0b2tlblwiLCBleGNlcHRpb24gdGhpcyBqdXN0IHJldHVybnMgdGhlIHRva2VuIHdpdGhvdXQgYWRkaW5nIGl0IHRvIHRoZSByZXN1bHRzLlxuICAgIFxuICAgIG1ha2VUb2tlbjogKHRhZywgdmFsdWUsIG9mZnNldEluQ2h1bmsgPSAwLCBsZW5ndGggPSB2YWx1ZS5sZW5ndGgpIC0+XG4gICAgICAgIFxuICAgICAgICBsb2NhdGlvbkRhdGEgPSB7fVxuICAgICAgICBbbG9jYXRpb25EYXRhLmZpcnN0X2xpbmUsIGxvY2F0aW9uRGF0YS5maXJzdF9jb2x1bW5dID1cbiAgICAgICAgICAgIEBnZXRMaW5lQW5kQ29sdW1uRnJvbUNodW5rIG9mZnNldEluQ2h1bmtcblxuICAgICAgICAjIFVzZSBsZW5ndGggLSAxIGZvciB0aGUgZmluYWwgb2Zmc2V0IC0gd2UncmUgc3VwcGx5aW5nIHRoZSBsYXN0X2xpbmUgYW5kIHRoZSBsYXN0X2NvbHVtbixcbiAgICAgICAgIyBzbyBpZiBsYXN0X2NvbHVtbiA9PSBmaXJzdF9jb2x1bW4sIHRoZW4gd2UncmUgbG9va2luZyBhdCBhIGNoYXJhY3RlciBvZiBsZW5ndGggMS5cbiAgICAgICAgbGFzdENoYXJhY3RlciA9IGlmIGxlbmd0aCA+IDAgdGhlbiAobGVuZ3RoIC0gMSkgZWxzZSAwXG4gICAgICAgIFtsb2NhdGlvbkRhdGEubGFzdF9saW5lLCBsb2NhdGlvbkRhdGEubGFzdF9jb2x1bW5dID1cbiAgICAgICAgICAgIEBnZXRMaW5lQW5kQ29sdW1uRnJvbUNodW5rIG9mZnNldEluQ2h1bmsgKyBsYXN0Q2hhcmFjdGVyXG5cbiAgICAgICAgdG9rZW4gPSBbdGFnLCB2YWx1ZSwgbG9jYXRpb25EYXRhXVxuXG4gICAgICAgIHRva2VuXG5cbiAgICAjIEFkZCBhIHRva2VuIHRvIHRoZSByZXN1bHRzLlxuICAgICMgYG9mZnNldGAgaXMgdGhlIG9mZnNldCBpbnRvIHRoZSBjdXJyZW50IEBjaHVuayB3aGVyZSB0aGUgdG9rZW4gc3RhcnRzLlxuICAgICMgYGxlbmd0aGAgaXMgdGhlIGxlbmd0aCBvZiB0aGUgdG9rZW4gaW4gdGhlIEBjaHVuaywgYWZ0ZXIgdGhlIG9mZnNldC4gIFxuICAgICMgSWYgbm90IHNwZWNpZmllZCwgdGhlIGxlbmd0aCBvZiBgdmFsdWVgIHdpbGwgYmUgdXNlZC4gUmV0dXJucyB0aGUgbmV3IHRva2VuLlxuICAgIFxuICAgIHRva2VuOiAodGFnLCB2YWx1ZSwgb2Zmc2V0SW5DaHVuaywgbGVuZ3RoLCBvcmlnaW4pIC0+XG4gICAgICAgIFxuICAgICAgICB0b2tlbiA9IEBtYWtlVG9rZW4gdGFnLCB2YWx1ZSwgb2Zmc2V0SW5DaHVuaywgbGVuZ3RoXG4gICAgICAgIHRva2VuLm9yaWdpbiA9IG9yaWdpbiBpZiBvcmlnaW5cbiAgICAgICAgQHRva2Vucy5wdXNoIHRva2VuXG4gICAgICAgIHRva2VuXG5cbiAgICB0YWc6IC0+ICMgUGVlayBhdCB0aGUgbGFzdCB0YWcgaW4gdGhlIHRva2VuIHN0cmVhbS5cbiAgICAgICAgXG4gICAgICAgIFsuLi4sIHRva2VuXSA9IEB0b2tlbnNcbiAgICAgICAgdG9rZW4/WzBdXG5cbiAgICB2YWx1ZTogLT4gIyBQZWVrIGF0IHRoZSBsYXN0IHZhbHVlIGluIHRoZSB0b2tlbiBzdHJlYW0uXG4gICAgICAgIFxuICAgICAgICBbLi4uLCB0b2tlbl0gPSBAdG9rZW5zXG4gICAgICAgIHRva2VuP1sxXVxuXG4gICAgdW5maW5pc2hlZDogLT4gIyBBcmUgd2UgaW4gdGhlIG1pZHN0IG9mIGFuIHVuZmluaXNoZWQgZXhwcmVzc2lvbj9cbiAgICAgICAgXG4gICAgICAgIExJTkVfQ09OVElOVUVSLnRlc3QoQGNodW5rKSBvclxuICAgICAgICBAdGFnKCkgaW4gVU5GSU5JU0hFRFxuXG4gICAgZm9ybWF0U3RyaW5nOiAoc3RyLCBvcHRpb25zKSAtPlxuICAgICAgICBcbiAgICAgICAgQHJlcGxhY2VVbmljb2RlQ29kZVBvaW50RXNjYXBlcyBzdHIucmVwbGFjZShTVFJJTkdfT01JVCwgJyQxJyksIG9wdGlvbnNcblxuICAgIGZvcm1hdEhlcmVnZXg6IChzdHIpIC0+XG4gICAgICAgIFxuICAgICAgICBAZm9ybWF0UmVnZXggc3RyLnJlcGxhY2UoSEVSRUdFWF9PTUlULCAnJDEkMicpLCBkZWxpbWl0ZXI6ICcvLy8nXG5cbiAgICBmb3JtYXRSZWdleDogKHN0ciwgb3B0aW9ucykgLT5cbiAgICAgICAgXG4gICAgICAgIEByZXBsYWNlVW5pY29kZUNvZGVQb2ludEVzY2FwZXMgc3RyLCBvcHRpb25zXG5cbiAgICB1bmljb2RlQ29kZVBvaW50VG9Vbmljb2RlRXNjYXBlczogKGNvZGVQb2ludCkgLT5cbiAgICAgICAgXG4gICAgICAgIHRvVW5pY29kZUVzY2FwZSA9ICh2YWwpIC0+XG4gICAgICAgICAgICBzdHIgPSB2YWwudG9TdHJpbmcgMTZcbiAgICAgICAgICAgIFwiXFxcXHUje3JlcGVhdCAnMCcsIDQgLSBzdHIubGVuZ3RofSN7c3RyfVwiXG4gICAgICAgIHJldHVybiB0b1VuaWNvZGVFc2NhcGUoY29kZVBvaW50KSBpZiBjb2RlUG9pbnQgPCAweDEwMDAwXG4gICAgICAgICMgc3Vycm9nYXRlIHBhaXJcbiAgICAgICAgaGlnaCA9IE1hdGguZmxvb3IoKGNvZGVQb2ludCAtIDB4MTAwMDApIC8gMHg0MDApICsgMHhEODAwXG4gICAgICAgIGxvdyA9IChjb2RlUG9pbnQgLSAweDEwMDAwKSAlIDB4NDAwICsgMHhEQzAwXG4gICAgICAgIFwiI3t0b1VuaWNvZGVFc2NhcGUoaGlnaCl9I3t0b1VuaWNvZGVFc2NhcGUobG93KX1cIlxuXG4gICAgcmVwbGFjZVVuaWNvZGVDb2RlUG9pbnRFc2NhcGVzOiAoc3RyLCBvcHRpb25zKSAtPiAjIFJlcGxhY2UgXFx1ey4uLn0gd2l0aCBcXHV4eHh4W1xcdXh4eHhdIGluIHN0cmluZ3MgYW5kIHJlZ2V4ZXNcbiAgICAgICAgXG4gICAgICAgIHN0ci5yZXBsYWNlIFVOSUNPREVfQ09ERV9QT0lOVF9FU0NBUEUsIChtYXRjaCwgZXNjYXBlZEJhY2tzbGFzaCwgY29kZVBvaW50SGV4LCBvZmZzZXQpID0+XG4gICAgICAgICAgICByZXR1cm4gZXNjYXBlZEJhY2tzbGFzaCBpZiBlc2NhcGVkQmFja3NsYXNoXG5cbiAgICAgICAgICAgIGNvZGVQb2ludERlY2ltYWwgPSBwYXJzZUludCBjb2RlUG9pbnRIZXgsIDE2XG4gICAgICAgICAgICBpZiBjb2RlUG9pbnREZWNpbWFsID4gMHgxMGZmZmZcbiAgICAgICAgICAgICAgICBAZXJyb3IgXCJ1bmljb2RlIGNvZGUgcG9pbnQgZXNjYXBlcyBncmVhdGVyIHRoYW4gXFxcXHV7MTBmZmZmfSBhcmUgbm90IGFsbG93ZWRcIixcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiBvZmZzZXQgKyBvcHRpb25zLmRlbGltaXRlci5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgbGVuZ3RoOiBjb2RlUG9pbnRIZXgubGVuZ3RoICsgNFxuXG4gICAgICAgICAgICBAdW5pY29kZUNvZGVQb2ludFRvVW5pY29kZUVzY2FwZXMgY29kZVBvaW50RGVjaW1hbFxuXG4gICAgdmFsaWRhdGVFc2NhcGVzOiAoc3RyLCBvcHRpb25zID0ge30pIC0+ICMgVmFsaWRhdGVzIGVzY2FwZXMgaW4gc3RyaW5ncyBhbmQgcmVnZXhlcy5cbiAgICAgICAgXG4gICAgICAgIGludmFsaWRFc2NhcGVSZWdleCA9XG4gICAgICAgICAgICBpZiBvcHRpb25zLmlzUmVnZXhcbiAgICAgICAgICAgICAgICBSRUdFWF9JTlZBTElEX0VTQ0FQRVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIFNUUklOR19JTlZBTElEX0VTQ0FQRVxuICAgICAgICBtYXRjaCA9IGludmFsaWRFc2NhcGVSZWdleC5leGVjIHN0clxuICAgICAgICByZXR1cm4gdW5sZXNzIG1hdGNoXG4gICAgICAgIFtbXSwgYmVmb3JlLCBvY3RhbCwgaGV4LCB1bmljb2RlQ29kZVBvaW50LCB1bmljb2RlXSA9IG1hdGNoXG4gICAgICAgIG1lc3NhZ2UgPVxuICAgICAgICAgICAgaWYgb2N0YWxcbiAgICAgICAgICAgICAgICBcIm9jdGFsIGVzY2FwZSBzZXF1ZW5jZXMgYXJlIG5vdCBhbGxvd2VkXCJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBcImludmFsaWQgZXNjYXBlIHNlcXVlbmNlXCJcbiAgICAgICAgaW52YWxpZEVzY2FwZSA9IFwiXFxcXCN7b2N0YWwgb3IgaGV4IG9yIHVuaWNvZGVDb2RlUG9pbnQgb3IgdW5pY29kZX1cIlxuICAgICAgICBAZXJyb3IgXCIje21lc3NhZ2V9ICN7aW52YWxpZEVzY2FwZX1cIixcbiAgICAgICAgICAgIG9mZnNldDogKG9wdGlvbnMub2Zmc2V0SW5DaHVuayA/IDApICsgbWF0Y2guaW5kZXggKyBiZWZvcmUubGVuZ3RoXG4gICAgICAgICAgICBsZW5ndGg6IGludmFsaWRFc2NhcGUubGVuZ3RoXG5cbiAgICBtYWtlRGVsaW1pdGVkTGl0ZXJhbDogKGJvZHksIG9wdGlvbnMgPSB7fSkgLT4gIyBDb25zdHJ1Y3RzIGEgc3RyaW5nIG9yIHJlZ2V4IGJ5IGVzY2FwaW5nIGNlcnRhaW4gY2hhcmFjdGVycy5cbiAgICAgICAgXG4gICAgICAgIGJvZHkgPSAnKD86KScgaWYgYm9keSBpcyAnJyBhbmQgb3B0aW9ucy5kZWxpbWl0ZXIgaXMgJy8nXG4gICAgICAgIHJlZ2V4ID0gLy8vXG4gICAgICAgICAgICAgICAgKFxcXFxcXFxcKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBlc2NhcGVkIGJhY2tzbGFzaFxuICAgICAgICAgICAgfCAoXFxcXDAoPz1bMS03XSkpICAgICAgICAgICAgICAgICAgICAgICAjIG51bCBjaGFyYWN0ZXIgbWlzdGFrZW4gYXMgb2N0YWwgZXNjYXBlXG4gICAgICAgICAgICB8IFxcXFw/KCN7b3B0aW9ucy5kZWxpbWl0ZXJ9KSAgICAgICAgICAgICMgKHBvc3NpYmx5IGVzY2FwZWQpIGRlbGltaXRlclxuICAgICAgICAgICAgfCBcXFxcPyg/OiAoXFxuKXwoXFxyKXwoXFx1MjAyOCl8KFxcdTIwMjkpICkgIyAocG9zc2libHkgZXNjYXBlZCkgbmV3bGluZXNcbiAgICAgICAgICAgIHwgKFxcXFwuKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBvdGhlciBlc2NhcGVzXG4gICAgICAgIC8vL2dcbiAgICAgICAgYm9keSA9IGJvZHkucmVwbGFjZSByZWdleCwgKG1hdGNoLCBiYWNrc2xhc2gsIG51bCwgZGVsaW1pdGVyLCBsZiwgY3IsIGxzLCBwcywgb3RoZXIpIC0+IHN3aXRjaFxuICAgICAgICAgICAgIyBJZ25vcmUgZXNjYXBlZCBiYWNrc2xhc2hlcy5cbiAgICAgICAgICAgIHdoZW4gYmFja3NsYXNoIHRoZW4gKGlmIG9wdGlvbnMuZG91YmxlIHRoZW4gYmFja3NsYXNoICsgYmFja3NsYXNoIGVsc2UgYmFja3NsYXNoKVxuICAgICAgICAgICAgd2hlbiBudWwgICAgICAgdGhlbiAnXFxcXHgwMCdcbiAgICAgICAgICAgIHdoZW4gZGVsaW1pdGVyIHRoZW4gXCJcXFxcI3tkZWxpbWl0ZXJ9XCJcbiAgICAgICAgICAgIHdoZW4gbGYgICAgICAgIHRoZW4gJ1xcXFxuJ1xuICAgICAgICAgICAgd2hlbiBjciAgICAgICAgdGhlbiAnXFxcXHInXG4gICAgICAgICAgICB3aGVuIGxzICAgICAgICB0aGVuICdcXFxcdTIwMjgnXG4gICAgICAgICAgICB3aGVuIHBzICAgICAgICB0aGVuICdcXFxcdTIwMjknXG4gICAgICAgICAgICB3aGVuIG90aGVyICAgICB0aGVuIChpZiBvcHRpb25zLmRvdWJsZSB0aGVuIFwiXFxcXCN7b3RoZXJ9XCIgZWxzZSBvdGhlcilcbiAgICAgICAgXCIje29wdGlvbnMuZGVsaW1pdGVyfSN7Ym9keX0je29wdGlvbnMuZGVsaW1pdGVyfVwiXG5cbiAgICAjIFRocm93cyBhbiBlcnJvciBhdCBlaXRoZXIgYSBnaXZlbiBvZmZzZXQgZnJvbSB0aGUgY3VycmVudCBjaHVuayBvciBhdCB0aGUgbG9jYXRpb24gb2YgYSB0b2tlbiAoYHRva2VuWzJdYCkuXG4gICAgXG4gICAgZXJyb3I6IChtZXNzYWdlLCBvcHRpb25zPXt9KSAtPlxuICAgICAgICBcbiAgICAgICAgbG9jYXRpb24gPVxuICAgICAgICAgICAgaWYgJ2ZpcnN0X2xpbmUnIG9mIG9wdGlvbnNcbiAgICAgICAgICAgICAgICBvcHRpb25zXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgW2ZpcnN0X2xpbmUsIGZpcnN0X2NvbHVtbl0gPSBAZ2V0TGluZUFuZENvbHVtbkZyb21DaHVuayBvcHRpb25zLm9mZnNldCA/IDBcbiAgICAgICAgICAgICAgICB7Zmlyc3RfbGluZSwgZmlyc3RfY29sdW1uLCBsYXN0X2NvbHVtbjogZmlyc3RfY29sdW1uICsgKG9wdGlvbnMubGVuZ3RoID8gMSkgLSAxfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICB0aHJvd1N5bnRheEVycm9yIG1vZHVsZTonbGV4ZXInLCBtZXNzYWdlOm1lc3NhZ2UsIGxvY2F0aW9uOmxvY2F0aW9uXG5cbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcblxuaXNVbmFzc2lnbmFibGUgPSAobmFtZSwgZGlzcGxheU5hbWUgPSBuYW1lKSAtPiBzd2l0Y2hcbiAgICBcbiAgICB3aGVuIG5hbWUgaW4gW0pTX0tFWVdPUkRTLi4uLCBDT0ZGRUVfS0VZV09SRFMuLi5dXG4gICAgICAgIFwia2V5d29yZCAnI3tkaXNwbGF5TmFtZX0nIGNhbid0IGJlIGFzc2lnbmVkXCJcbiAgICB3aGVuIG5hbWUgaW4gU1RSSUNUX1BST1NDUklCRURcbiAgICAgICAgXCInI3tkaXNwbGF5TmFtZX0nIGNhbid0IGJlIGFzc2lnbmVkXCJcbiAgICB3aGVuIG5hbWUgaW4gUkVTRVJWRURcbiAgICAgICAgXCJyZXNlcnZlZCB3b3JkICcje2Rpc3BsYXlOYW1lfScgY2FuJ3QgYmUgYXNzaWduZWRcIlxuICAgIGVsc2VcbiAgICAgICAgZmFsc2VcblxuIyBgZnJvbWAgaXNu4oCZdCBhIGtleXdvcmQsIGJ1dCBpdCBiZWhhdmVzIGxpa2Ugb25lIGluIGBpbXBvcnRgIGFuZCBgZXhwb3J0YCBzdGF0ZW1lbnRzIChoYW5kbGVkIGFib3ZlKSBcbiMgYW5kIGluIHRoZSBkZWNsYXJhdGlvbiBsaW5lIG9mIGEgYGZvcmAgbG9vcC5cbiMgVHJ5IHRvIGRldGVjdCB3aGVuIGBmcm9tYCBpcyBhIHZhcmlhYmxlIGlkZW50aWZpZXIgYW5kIHdoZW4gaXQgaXMgdGhpcyDigJxzb21ldGltZXPigJ0ga2V5d29yZC5cblxuaXNGb3JGcm9tID0gKHByZXYpIC0+XG4gICAgXG4gICAgaWYgcHJldlswXSBpcyAnSURFTlRJRklFUidcbiAgICAgICAgIyBgZm9yIGkgZnJvbSBmcm9tYCwgYGZvciBmcm9tIGZyb20gaXRlcmFibGVgXG4gICAgICAgIGlmIHByZXZbMV0gaXMgJ2Zyb20nXG4gICAgICAgICAgICBwcmV2WzFdWzBdID0gJ0lERU5USUZJRVInXG4gICAgICAgICAgICB5ZXNcbiAgICAgICAgIyBgZm9yIGkgZnJvbSBpdGVyYWJsZWBcbiAgICAgICAgeWVzXG4gICAgIyBgZm9yIGZyb23igKZgXG4gICAgZWxzZSBpZiBwcmV2WzBdIGlzICdGT1InXG4gICAgICAgIG5vXG4gICAgIyBgZm9yIHtmcm9tfeKApmAsIGBmb3IgW2Zyb21d4oCmYCwgYGZvciB7YSwgZnJvbX3igKZgLCBgZm9yIHthOiBmcm9tfeKApmBcbiAgICBlbHNlIGlmIHByZXZbMV0gaW4gWyd7JydbJycsJyc6J11cbiAgICAgICAgbm9cbiAgICBlbHNlXG4gICAgICAgIHllc1xuXG4jIyNcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgIFxuIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4jIyNcblxuIyBLZXl3b3JkcyB0aGF0IHdlIHNoYXJlIGluIGNvbW1vbiB3aXRoIEphdmFTY3JpcHQuXG5cbk1FVEFfS0VZV09SRFMgPSBbICdpZicgJ3RoZW4nICdlbGlmJyAnZWxzZScgXVxuXG5KU19LRVlXT1JEUyA9IFtcbiAgICAndHJ1ZScgJ2ZhbHNlJyAnbnVsbCcgJ3RoaXMnXG4gICAgJ25ldycgJ2RlbGV0ZScgJ3R5cGVvZicgJ2luJyAnaW5zdGFuY2VvZidcbiAgICAncmV0dXJuJyAndGhyb3cnICdicmVhaycgJ2NvbnRpbnVlJyAnZGVidWdnZXInICd5aWVsZCdcbiAgICAnaWYnICdlbHNlJyAnc3dpdGNoJyAnZm9yJyAnd2hpbGUnICdkbycgJ3RyeScgJ2NhdGNoJyAnZmluYWxseSdcbiAgICAnY2xhc3MnICdleHRlbmRzJyAnc3VwZXInXG4gICAgJ2ltcG9ydCcgJ2V4cG9ydCcgJ2RlZmF1bHQnXG5dXG5cbkNPRkZFRV9LRVlXT1JEUyA9IFsgJ3VuZGVmaW5lZCcgJ0luZmluaXR5JyAnTmFOJyAndGhlbicgJ3VubGVzcycgJ3VudGlsJyAnbG9vcCcgJ29mJyAnYnknICd3aGVuJyBdXG5cbkNPRkZFRV9BTElBU19NQVAgPVxuICAgIGFuZCAgOiAnJiYnXG4gICAgb3IgICA6ICd8fCdcbiAgICBpcyAgIDogJz09J1xuICAgIGlzbnQgOiAnIT0nICMgdWdseSEgcmVtb3ZlIGluIGNhc2UgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkgd2l0aCBDUzEgaXMgYnJva2VuLiBcbiAgICBub3QgIDogJyEnXG4gICAgeWVzICA6ICd0cnVlJ1xuICAgIG5vICAgOiAnZmFsc2UnXG4gICAgb24gICA6ICd0cnVlJ1xuICAgIG9mZiAgOiAnZmFsc2UnXG5cbkNPRkZFRV9BTElBU0VTICA9IChrZXkgZm9yIGtleSBvZiBDT0ZGRUVfQUxJQVNfTUFQKVxuQ09GRkVFX0tFWVdPUkRTID0gQ09GRkVFX0tFWVdPUkRTLmNvbmNhdCBDT0ZGRUVfQUxJQVNFU1xuXG4jIFRoZSBsaXN0IG9mIGtleXdvcmRzIHRoYXQgYXJlIHJlc2VydmVkIGJ5IEphdmFTY3JpcHQsIGJ1dCBub3QgdXNlZCwgb3IgdXNlZCBpbnRlcm5hbGx5LlxuIyBXZSB0aHJvdyBhbiBlcnJvciB3aGVuIHRoZXNlIGFyZSBlbmNvdW50ZXJlZCwgdG8gYXZvaWQgaGF2aW5nIGEgSmF2YVNjcmlwdCBlcnJvciBhdCBydW50aW1lLlxuXG5SRVNFUlZFRCA9IFtcbiAgICAnY2FzZScgJ2Z1bmN0aW9uJyAndmFyJyAndm9pZCcgJ3dpdGgnICdjb25zdCcgJ2xldCcgJ2VudW0nXG4gICAgJ25hdGl2ZScgJ2ltcGxlbWVudHMnICdpbnRlcmZhY2UnICdwYWNrYWdlJyAncHJpdmF0ZSdcbiAgICAncHJvdGVjdGVkJyAncHVibGljJyAnc3RhdGljJ1xuXVxuXG5TVFJJQ1RfUFJPU0NSSUJFRCA9IFsnYXJndW1lbnRzJyAnZXZhbCddXG5cbiMgVGhlIHN1cGVyc2V0IG9mIGJvdGggSmF2YVNjcmlwdCBrZXl3b3JkcyBhbmQgcmVzZXJ2ZWQgd29yZHMsIG5vbmUgb2Ygd2hpY2ggbWF5XG4jIGJlIHVzZWQgYXMgaWRlbnRpZmllcnMgb3IgcHJvcGVydGllcy5cblxuQk9NID0gNjUyNzkgIyBUaGUgY2hhcmFjdGVyIGNvZGUgb2YgdGhlIG5hc3R5IE1pY3Jvc29mdCBtYWRuZXNzIG90aGVyd2lzZSBrbm93biBhcyB0aGUgQk9NLlxuXG4jIFRva2VuIG1hdGNoaW5nIHJlZ2V4ZXMuXG5cbklERU5USUZJRVIgPSAvLy8gXlxuICAgICg/IVxcZClcbiAgICAoICg/OiAoPyFcXHMpWyRcXHdcXHg3Zi1cXHVmZmZmXSApKyApXG4gICAgKCBbXlxcblxcU10qIDogKD8hOikgKT8gICAgIyBJcyB0aGlzIGEgcHJvcGVydHkgbmFtZT9cbi8vL1xuXG5OVU1CRVIgPSAvLy9cbiAgICBeIDBiWzAxXSsgICAgfCAgICAgICAgICAgICAgIyBiaW5hcnlcbiAgICBeIDBvWzAtN10rICAgfCAgICAgICAgICAgICAgIyBvY3RhbFxuICAgIF4gMHhbXFxkYS1mXSsgfCAgICAgICAgICAgICAgIyBoZXhcbiAgICBeIFxcZCtuICAgICAgIHwgICAgICAgICAgICAgICMgYmlnaW50XG4gICAgXiBcXGQqXFwuP1xcZCsgKD86ZVsrLV0/XFxkKyk/ICAjIGRlY2ltYWxcbi8vL2lcblxuT1BFUkFUT1IgPSAvLy8gXiAoXG4gICAgPzogWy09XT4gICAgICAgICAgICAgIyBmdW5jdGlvblxuICAgICB8IFstKyovJTw+JnxeIT89XT0gICMgY29tcG91bmQgYXNzaWduIC8gY29tcGFyZVxuICAgICB8ID4+Pj0/ICAgICAgICAgICAgICMgemVyby1maWxsIHJpZ2h0IHNoaWZ0XG4gICAgIHwgKFstKzpdKVxcMSAgICAgICAgICMgZG91Ymxlc1xuICAgICB8IChbJnw8PiovJV0pXFwyPT8gICAjIGxvZ2ljIC8gc2hpZnQgLyBwb3dlciAvIGZsb29yIGRpdmlzaW9uIC8gbW9kdWxvXG4gICAgIHwgXFw/KFxcLnw6OikgICAgICAgICAjIHNvYWsgYWNjZXNzXG4gICAgIHwgXFwuezIsM30gICAgICAgICAgICMgcmFuZ2Ugb3Igc3BsYXRcbikgLy8vXG5cbldISVRFU1BBQ0UgPSAvXlteXFxuXFxTXSsvXG5cbkNPREUgICAgICAgPSAvXlstPV0+L1xuXG5NVUxUSV9ERU5UID0gL14oPzpcXG5bXlxcblxcU10qKSsvXG5cbkpTVE9LRU4gICAgICA9IC8vL14gYCg/IWBgKSAoKD86IFteYFxcXFxdIHwgXFxcXFtcXHNcXFNdICAgICAgICAgICApKikgYCAgIC8vL1xuSEVSRV9KU1RPS0VOID0gLy8vXiBgYGAgICAgICgoPzogW15gXFxcXF0gfCBcXFxcW1xcc1xcU10gfCBgKD8hYGApICkqKSBgYGAgLy8vXG5cbiMgU3RyaW5nLW1hdGNoaW5nLXJlZ2V4ZXMuXG5cblNUUklOR19TVEFSVCA9IC9eKD86JycnfFwiXCJcInwnfFwiKS9cblNUUklOR19TSU5HTEUgID0gLy8vIF4oPzogW15cXFxcJ10gIHwgXFxcXFtcXHNcXFNdICAgICAgICAgICAgICAgICAgICAgICkqIC8vL1xuU1RSSU5HX0RPVUJMRSAgPSAvLy8gXig/OiBbXlxcXFxcIiNdIHwgXFxcXFtcXHNcXFNdIHwgICAgICAgICAgIFxcIyg/IVxceykgKSogLy8vXG5IRVJFRE9DX1NJTkdMRSA9IC8vLyBeKD86IFteXFxcXCddICB8IFxcXFxbXFxzXFxTXSB8ICcoPyEnJykgICAgICAgICAgICApKiAvLy9cbkhFUkVET0NfRE9VQkxFID0gLy8vIF4oPzogW15cXFxcXCIjXSB8IFxcXFxbXFxzXFxTXSB8IFwiKD8hXCJcIikgfCBcXCMoPyFcXHspICkqIC8vL1xuXG5DT01NRU5UICAgICAgPSAvXiMjIyhbXiNdW1xcc1xcU10qPykoPzojIyNbXlxcblxcU10qfCMjIyQpfF4oPzpcXHMqIyg/ISMjW14jXSkuKikrLyAgICAgICAgICAgICAgXG5cblNUUklOR19PTUlUICAgID0gLy8vXG4gICAgICAgICgoPzpcXFxcXFxcXCkrKSAgICAgICMgY29uc3VtZSAoYW5kIHByZXNlcnZlKSBhbiBldmVuIG51bWJlciBvZiBiYWNrc2xhc2hlc1xuICAgIHwgXFxcXFteXFxTXFxuXSpcXG5cXHMqICAgICMgcmVtb3ZlIGVzY2FwZWQgbmV3bGluZXNcbi8vL2dcblNJTVBMRV9TVFJJTkdfT01JVCA9IC9cXHMqXFxuXFxzKi9nXG5IRVJFRE9DX0lOREVOVCAgICAgICA9IC9cXG4rKFteXFxuXFxTXSopKD89XFxTKS9nXG5cbiMgUmVnZXgtbWF0Y2hpbmctcmVnZXhlcy5cblJFR0VYID0gLy8vIF5cbiAgICAvICg/IS8pICgoXG4gICAgPzogW14gWyAvIFxcbiBcXFxcIF0gICAgIyBldmVyeSBvdGhlciB0aGluZ1xuICAgICB8IFxcXFxbXlxcbl0gICAgICAgICAgICMgYW55dGhpbmcgYnV0IG5ld2xpbmVzIGVzY2FwZWRcbiAgICAgfCBcXFsgICAgICAgICAgICAgICAgIyBjaGFyYWN0ZXIgY2xhc3NcbiAgICAgICAgICAgICAoPzogXFxcXFteXFxuXSB8IFteIFxcXSBcXG4gXFxcXCBdICkqXG4gICAgICAgICBcXF1cbiAgICApKikgKC8pP1xuLy8vXG5cblJFR0VYX0ZMQUdTICA9IC9eXFx3Ki9cblZBTElEX0ZMQUdTICA9IC9eKD8hLiooLikuKlxcMSlbaW1ndXldKiQvXG5cbkhFUkVHRVggICAgICA9IC8vLyBeKD86IFteXFxcXC8jXSB8IFxcXFxbXFxzXFxTXSB8IC8oPyEvLykgfCBcXCMoPyFcXHspICkqIC8vL1xuXG5IRVJFR0VYX09NSVQgPSAvLy9cbiAgICAgICgoPzpcXFxcXFxcXCkrKSAgICAgICAgICAgIyBjb25zdW1lIChhbmQgcHJlc2VydmUpIGFuIGV2ZW4gbnVtYmVyIG9mIGJhY2tzbGFzaGVzXG4gICAgfCBcXFxcKFxccykgICAgICAgICAgICAgICAgIyBwcmVzZXJ2ZSBlc2NhcGVkIHdoaXRlc3BhY2VcbiAgICB8IFxccysoPzojLiopPyAgICAgICAgICAgIyByZW1vdmUgd2hpdGVzcGFjZSBhbmQgY29tbWVudHNcbi8vL2dcblxuUkVHRVhfSUxMRUdBTCA9IC8vLyBeICggLyB8IC97M31cXHMqKSAoXFwqKSAvLy9cblxuUE9TU0lCTFlfRElWSVNJT04gPSAvLy8gXiAvPT9cXHMgLy8vXG5cbiMgT3RoZXIgcmVnZXhlcy5cblxuSEVSRUNPTU1FTlRfSUxMRUdBTCA9IC9cXCpcXC8vXG5cbkxJTkVfQ09OVElOVUVSICAgICAgICAgID0gLy8vIF4gXFxzKiAoPzogLCB8IFxcPz9cXC4oPyFbLlxcZF0pIHwgOjogKSAvLy9cblxuU1RSSU5HX0lOVkFMSURfRVNDQVBFID0gLy8vXG4gICAgKCAoPzpefFteXFxcXF0pICg/OlxcXFxcXFxcKSogKSAgICAgICAgICAgICAgICAgICAjIG1ha2Ugc3VyZSB0aGUgZXNjYXBlIGlzbuKAmXQgZXNjYXBlZFxuICAgIFxcXFwgKCAgIFxuICAgICAgICAgPzogKDBbMC03XXxbMS03XSkgICAgICAgICAgICAgICAgICAgICAgIyBvY3RhbCBlc2NhcGVcbiAgICAgICAgICAgIHwgKHgoPyFbXFxkYS1mQS1GXXsyfSkuezAsMn0pICAgICAgICAjIGhleCBlc2NhcGVcbiAgICAgICAgICAgIHwgKHVcXHsoPyFbXFxkYS1mQS1GXXsxLH1cXH0pW159XSpcXH0/KSAjIHVuaWNvZGUgY29kZSBwb2ludCBlc2NhcGVcbiAgICAgICAgICAgIHwgKHUoPyFcXHt8W1xcZGEtZkEtRl17NH0pLnswLDR9KSAgICAgIyB1bmljb2RlIGVzY2FwZVxuICAgIClcbi8vL1xuUkVHRVhfSU5WQUxJRF9FU0NBUEUgPSAvLy9cbiAgICAoICg/Ol58W15cXFxcXSkgKD86XFxcXFxcXFwpKiApICAgICAgICAgICAgICAgICAgICMgbWFrZSBzdXJlIHRoZSBlc2NhcGUgaXNu4oCZdCBlc2NhcGVkXG4gICAgXFxcXCAoICAgXG4gICAgICAgICA/OiAoMFswLTddKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIG9jdGFsIGVzY2FwZVxuICAgICAgICAgICAgfCAoeCg/IVtcXGRhLWZBLUZdezJ9KS57MCwyfSkgICAgICAgICMgaGV4IGVzY2FwZVxuICAgICAgICAgICAgfCAodVxceyg/IVtcXGRhLWZBLUZdezEsfVxcfSlbXn1dKlxcfT8pICMgdW5pY29kZSBjb2RlIHBvaW50IGVzY2FwZVxuICAgICAgICAgICAgfCAodSg/IVxce3xbXFxkYS1mQS1GXXs0fSkuezAsNH0pICAgICAjIHVuaWNvZGUgZXNjYXBlXG4gICAgKVxuLy8vXG5cblVOSUNPREVfQ09ERV9QT0lOVF9FU0NBUEUgPSAvLy9cbiAgICAoIFxcXFxcXFxcICkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIG1ha2Ugc3VyZSB0aGUgZXNjYXBlIGlzbuKAmXQgZXNjYXBlZFxuICAgIHxcbiAgICBcXFxcdVxceyAoIFtcXGRhLWZBLUZdKyApIFxcfVxuLy8vZ1xuXG5MRUFESU5HX0JMQU5LX0xJTkUgID0gL15bXlxcblxcU10qXFxuL1xuVFJBSUxJTkdfQkxBTktfTElORSA9IC9cXG5bXlxcblxcU10qJC9cblRSQUlMSU5HX1NQQUNFUyAgICAgPSAvXFxzKyQvXG5DT01QT1VORF9BU1NJR04gICAgID0gWyAnLT0nICcrPScgJy89JyAnKj0nICclPScgJ3x8PScgJyYmPScgJz89JyAnPDw9JyAnPj49JyAnPj4+PScgJyY9JyAnXj0nICd8PScgJyoqPScgJy8vPScgJyUlPScgXVxuVU5BUlkgICAgICAgICAgICAgICA9IFsnTkVXJyAnVFlQRU9GJyAnREVMRVRFJyAnRE8nXVxuVU5BUllfTUFUSCAgICAgICAgICA9IFsnIScgJ34nXVxuU0hJRlQgICAgICAgICAgICAgICA9IFsnPDwnICc+PicgJz4+PiddXG5DT01QQVJFICAgICAgICAgICAgID0gWyc9PScgJyE9JyAnPCcgJz4nICc8PScgJz49J11cbk1BVEggICAgICAgICAgICAgICAgPSBbJyonICcvJyAnJScgJy8vJyAnJSUnXVxuUkVMQVRJT04gICAgICAgICAgICA9IFsnSU4nICdPRicgJ0lOU1RBTkNFT0YnXSAjIFJlbGF0aW9uYWwgdG9rZW5zIHRoYXQgYXJlIG5lZ2F0YWJsZSB3aXRoIGBub3RgIHByZWZpeC5cbkJPT0wgICAgICAgICAgICAgICAgPSBbJ1RSVUUnICdGQUxTRSddXG5cbiMgVG9rZW5zIHdoaWNoIGNvdWxkIGxlZ2l0aW1hdGVseSBiZSBpbnZva2VkIG9yIGluZGV4ZWQuIEFuIG9wZW5pbmdcbiMgcGFyZW50aGVzZXMgb3IgYnJhY2tldCBmb2xsb3dpbmcgdGhlc2UgdG9rZW5zIHdpbGwgYmUgcmVjb3JkZWQgYXMgdGhlIHN0YXJ0XG4jIG9mIGEgZnVuY3Rpb24gaW52b2NhdGlvbiBvciBpbmRleGluZyBvcGVyYXRpb24uXG5cbkNBTExBQkxFICA9IFsnSURFTlRJRklFUicgJ1BST1BFUlRZJyAnKScgJ10nICc/JyAnQCcgJ1RISVMnICdTVVBFUiddXG5JTkRFWEFCTEUgPSBDQUxMQUJMRS5jb25jYXQgWyAnTlVNQkVSJyAnSU5GSU5JVFknICdOQU4nICdTVFJJTkcnICdTVFJJTkdfRU5EJyAnUkVHRVgnICdSRUdFWF9FTkQnICdCT09MJyAnTlVMTCcgJ1VOREVGSU5FRCcgJ30nICc6OicgXVxuXG4jIFRva2VucyB3aGljaCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB3aWxsIG5ldmVyIGltbWVkaWF0ZWx5IGZvbGxvdyAoZXhjZXB0IHNwYWNlZFxuIyBDQUxMQUJMRXMgaW4gc29tZSBjYXNlcyksIGJ1dCB3aGljaCBhIGRpdmlzaW9uIG9wZXJhdG9yIGNhbi5cbiNcbiMgU2VlOiBodHRwOi8vd3d3LWFyY2hpdmUubW96aWxsYS5vcmcvanMvbGFuZ3VhZ2UvanMyMC0yMDAyLTA0L3JhdGlvbmFsZS9zeW50YXguaHRtbCNyZWd1bGFyLWV4cHJlc3Npb25zXG5cbk5PVF9SRUdFWCA9IElOREVYQUJMRS5jb25jYXQgWycrKycgJy0tJ11cblxuIyBUb2tlbnMgdGhhdCwgd2hlbiBpbW1lZGlhdGVseSBwcmVjZWRpbmcgYSBgV0hFTmAsIGluZGljYXRlIHRoYXQgdGhlIGBXSEVOYFxuIyBvY2N1cnMgYXQgdGhlIHN0YXJ0IG9mIGEgbGluZS4gV2UgZGlzYW1iaWd1YXRlIHRoZXNlIGZyb20gdHJhaWxpbmcgd2hlbnMgdG9cbiMgYXZvaWQgYW4gYW1iaWd1aXR5IGluIHRoZSBncmFtbWFyLlxuXG5MSU5FX0JSRUFLID0gWydJTkRFTlQnICdPVVRERU5UJyAnVEVSTUlOQVRPUiddXG5cbiMgQWRkaXRpb25hbCBpbmRlbnQgaW4gZnJvbnQgb2YgdGhlc2UgaXMgaWdub3JlZC5cblxuSU5ERU5UQUJMRV9DTE9TRVJTID0gWycpJyAnfScgJ10nXVxuXG4jIFRva2VucyB0aGF0LCB3aGVuIGFwcGVhcmluZyBhdCB0aGUgZW5kIG9mIGEgbGluZSwgc3VwcHJlc3MgYSBmb2xsb3dpbmcgVEVSTUlOQVRPUi9JTkRFTlQgdG9rZW5cblxuVU5GSU5JU0hFRCA9IFsnXFxcXCcgJy4nICc/LicgJz86OicgJ1VOQVJZJyAnTUFUSCcgJ1VOQVJZX01BVEgnICcrJyAnLSdcbiAgICAgICAgICAgICAgJyoqJyAnU0hJRlQnICdSRUxBVElPTicgJ0NPTVBBUkUnICcmJyAnXicgJ3wnICcmJicgJ3x8J1xuICAgICAgICAgICAgICAnQklOPycgJ1RIUk9XJyAnRVhURU5EUyddXG4gICAgICAgICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBcbiAgICBKU19GT1JCSURERU46ICAgSlNfS0VZV09SRFMuY29uY2F0KFJFU0VSVkVEKS5jb25jYXQoU1RSSUNUX1BST1NDUklCRUQpXG4gICAgaXNVbmFzc2lnbmFibGU6IGlzVW5hc3NpZ25hYmxlXG4gICAgTGV4ZXI6ICAgICAgICAgIExleGVyXG4gICAgIl19
//# sourceURL=../coffee/lexer.coffee