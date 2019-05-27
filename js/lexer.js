// koffee 0.45.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4ZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLDA0QkFBQTtJQUFBOzs7O0FBaUJBLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFFVCxhQUFlLE9BQUEsQ0FBUSxRQUFSOztBQUNqQixNQUFnQyxPQUFBLENBQVEsWUFBUixDQUFoQyxFQUFFLGlDQUFGLEVBQWlCOztBQUNqQixPQUE2RSxPQUFBLENBQVEsV0FBUixDQUE3RSxFQUFFLGtCQUFGLEVBQVMsb0JBQVQsRUFBaUIsc0JBQWpCLEVBQTBCLG9CQUExQixFQUFrQyxnREFBbEMsRUFBd0Q7O0FBS2xEOzs7OztvQkFpQkYsUUFBQSxHQUFVLFNBQUMsSUFBRCxFQUFPLElBQVA7QUFFTixZQUFBO1FBQUEsSUFBQSxHQUFPLGFBQUEsQ0FBYyxJQUFkO1FBQ1AsSUFBQSxHQUFPLFVBQUEsQ0FBYyxJQUFkO1FBRVAsSUFBQyxDQUFBLE1BQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxVQUFELEdBQWM7UUFDZCxJQUFDLENBQUEsTUFBRCxHQUFjO1FBQ2QsSUFBQyxDQUFBLE9BQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxPQUFELEdBQWM7UUFDZCxJQUFDLENBQUEsSUFBRCxHQUFjO1FBQ2QsSUFBQyxDQUFBLE1BQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxPQUFELEdBQWM7UUFDZCxJQUFDLENBQUEsVUFBRCxHQUFjO1FBQ2QsSUFBQyxDQUFBLFVBQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxtQkFBRCxHQUF1QjtRQUN2QixJQUFDLENBQUEsbUJBQUQsR0FBdUI7UUFFdkIsSUFBQyxDQUFBLFNBQUQsR0FBZSxJQUFJLENBQUMsSUFBTCxJQUFhO1FBQzVCLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBSSxDQUFDLE1BQUwsSUFBZTtRQUM5QixJQUFDLENBQUEsSUFBRCxHQUFRLElBQUMsQ0FBQSxLQUFELENBQU8sSUFBUDtR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LEVBQTZCLEdBQTdCLEVBQWlDLEdBQWpDLEVBQXFDLEdBQXJDLEVBQXlDLE1BQXpDLEVBQWdELE9BQWhEOztBQUNaLFNBQUEsR0FBWSxRQUFRLENBQUMsTUFBVCxDQUFnQixDQUFFLFFBQUYsRUFBVyxVQUFYLEVBQXNCLEtBQXRCLEVBQTRCLFFBQTVCLEVBQXFDLFlBQXJDLEVBQWtELE9BQWxELEVBQTBELFdBQTFELEVBQXNFLE1BQXRFLEVBQTZFLE1BQTdFLEVBQW9GLFdBQXBGLEVBQWdHLEdBQWhHLEVBQW9HLElBQXBHLENBQWhCOztBQU9aLFNBQUEsR0FBWSxTQUFTLENBQUMsTUFBVixDQUFpQixDQUFDLElBQUQsRUFBTSxJQUFOLENBQWpCOztBQU1aLFVBQUEsR0FBYSxDQUFDLFFBQUQsRUFBVSxTQUFWLEVBQW9CLFlBQXBCOztBQUliLGtCQUFBLEdBQXFCLENBQUMsR0FBRCxFQUFLLEdBQUwsRUFBUyxHQUFUOztBQUlyQixVQUFBLEdBQWEsQ0FBQyxJQUFELEVBQU0sR0FBTixFQUFVLElBQVYsRUFBZSxLQUFmLEVBQXFCLE9BQXJCLEVBQTZCLE1BQTdCLEVBQW9DLFlBQXBDLEVBQWlELEdBQWpELEVBQXFELEdBQXJELEVBQ0MsSUFERCxFQUNNLE9BRE4sRUFDYyxVQURkLEVBQ3lCLFNBRHpCLEVBQ21DLEdBRG5DLEVBQ3VDLEdBRHZDLEVBQzJDLEdBRDNDLEVBQytDLElBRC9DLEVBQ29ELElBRHBELEVBRUMsTUFGRCxFQUVRLE9BRlIsRUFFZ0IsU0FGaEI7O0FBSWIsTUFBTSxDQUFDLE9BQVAsR0FDSTtJQUFBLFlBQUEsRUFBZ0IsV0FBVyxDQUFDLE1BQVosQ0FBbUIsUUFBbkIsQ0FBNEIsQ0FBQyxNQUE3QixDQUFvQyxpQkFBcEMsQ0FBaEI7SUFDQSxjQUFBLEVBQWdCLGNBRGhCO0lBRUEsS0FBQSxFQUFnQixLQUZoQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4wMDAgICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbjAwMCAgICAgIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuMDAwICAgICAgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4wMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiMjI1xuXG4jIFRoZSBMZXhlciB1c2VzIGEgc2VyaWVzIG9mIHRva2VuLW1hdGNoaW5nIHJlZ2V4ZXMgdG8gYXR0ZW1wdCBtYXRjaGVzIGFnYWluc3QgdGhlIGJlZ2lubmluZyBvZiB0aGUgc291cmNlIGNvZGUuIFxuIyBXaGVuIGEgbWF0Y2ggaXMgZm91bmQsIGEgdG9rZW4gaXMgcHJvZHVjZWQsIHdlIGNvbnN1bWUgdGhlIG1hdGNoLCBhbmQgc3RhcnQgYWdhaW4uIFxuIyBUb2tlbnMgYXJlIGluIHRoZSBmb3JtOlxuI1xuIyAgICBbdGFnLCB2YWx1ZSwgbG9jYXRpb25EYXRhXVxuI1xuIyB3aGVyZSBsb2NhdGlvbkRhdGEgaXMge2ZpcnN0X2xpbmUsIGZpcnN0X2NvbHVtbiwgbGFzdF9saW5lLCBsYXN0X2NvbHVtbn0sIFxuIyB3aGljaCBpcyBhIGZvcm1hdCB0aGF0IGNhbiBiZSBmZWQgZGlyZWN0bHkgaW50byBKaXNvbiB2aWEgdGhlIGBwYXJzZXIubGV4ZXJgIGZ1bmN0aW9uIGRlZmluZWQgaW4ga29mZmVlLmNvZmZlZS5cblxuUmV3cml0ZXIgPSByZXF1aXJlICcuL3Jld3JpdGVyJ1xuXG57IGluamVjdE1ldGEgfSA9IHJlcXVpcmUgJy4vbWV0YSdcbnsgaW5qZWN0RmVhdHVyZSwgaGFzRmVhdHVyZSB9ID0gcmVxdWlyZSAnLi9mZWF0dXJlcydcbnsgY291bnQsIHN0YXJ0cywgY29tcGFjdCwgcmVwZWF0LCBsb2NhdGlvbkRhdGFUb1N0cmluZywgdGhyb3dTeW50YXhFcnJvciB9ID0gcmVxdWlyZSAnLi9oZWxwZXJzJ1xuXG4jIFRoZSBMZXhlciBjbGFzcyByZWFkcyBhIHN0cmluZyBhbmQgZGl2dmllcyBpdCB1cCBpbnRvIHRhZ2dlZCB0b2tlbnMuIFxuIyBTb21lIHBvdGVudGlhbCBhbWJpZ3VpdHkgaW4gdGhlIGdyYW1tYXIgaGFzIGJlZW4gYXZvaWRlZCBieSBwdXNoaW5nIHNvbWUgZXh0cmEgc21hcnRzIGludG8gdGhlIExleGVyLlxuXG5jbGFzcyBMZXhlclxuXG4gICAgIyB0b2tlbml6ZSBpcyB0aGUgTGV4ZXIncyBtYWluIG1ldGhvZC4gU2NhbiBieSBhdHRlbXB0aW5nIHRvIG1hdGNoIHRva2Vuc1xuICAgICMgb25lIGF0IGEgdGltZSwgdXNpbmcgYSByZWd1bGFyIGV4cHJlc3Npb24gYW5jaG9yZWQgYXQgdGhlIHN0YXJ0IG9mIHRoZVxuICAgICMgcmVtYWluaW5nIGNvZGUsIG9yIGEgY3VzdG9tIHJlY3Vyc2l2ZSB0b2tlbi1tYXRjaGluZyBtZXRob2QgKGZvciBpbnRlcnBvbGF0aW9ucykuIFxuICAgICMgV2hlbiB0aGUgbmV4dCB0b2tlbiBoYXMgYmVlbiByZWNvcmRlZCwgd2UgbW92ZSBmb3J3YXJkIHdpdGhpbiB0aGUgY29kZSBwYXN0IHRoZSB0b2tlbiwgYW5kIGJlZ2luIGFnYWluLlxuICAgICNcbiAgICAjIEVhY2ggdG9rZW5pemluZyBtZXRob2QgaXMgcmVzcG9uc2libGUgZm9yIHJldHVybmluZyB0aGUgbnVtYmVyIG9mIGNoYXJhY3RlcnMgaXQgaGFzIGNvbnN1bWVkLlxuICAgICNcbiAgICAjIEJlZm9yZSByZXR1cm5pbmcgdGhlIHRva2VuIHN0cmVhbSwgcnVuIGl0IHRocm91Z2ggdGhlIFJld3JpdGVyLlxuICAgIFxuICAgICMgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAgIDAwMCAgIDAwMCAgICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgICAwMDAgICAgMDAwMDAwMCAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAgICAgICAgIFxuICAgIHRva2VuaXplOiAoY29kZSwgb3B0cykgPT5cblxuICAgICAgICBvcHRzID0gaW5qZWN0RmVhdHVyZSBvcHRzXG4gICAgICAgIG9wdHMgPSBpbmplY3RNZXRhICAgIG9wdHMgICMgbmVlZGVkIHRvIHNob3J0Y3V0IG1ldGFzLCBlLmcuIEB0b2tlbiAtPiBAaWYgQHRva2VuIC4uLlxuICAgICAgICBcbiAgICAgICAgQGluZGVudCAgICAgPSAwICAgICAgICAgICAgIyBUaGUgY3VycmVudCBpbmRlbnRhdGlvbiBsZXZlbC5cbiAgICAgICAgQGJhc2VJbmRlbnQgPSAwICAgICAgICAgICAgIyBUaGUgb3ZlcmFsbCBtaW5pbXVtIGluZGVudGF0aW9uIGxldmVsXG4gICAgICAgIEBpbmRlYnQgICAgID0gMCAgICAgICAgICAgICMgVGhlIG92ZXItaW5kZW50YXRpb24gYXQgdGhlIGN1cnJlbnQgbGV2ZWwuXG4gICAgICAgIEBvdXRkZWJ0ICAgID0gMCAgICAgICAgICAgICMgVGhlIHVuZGVyLW91dGRlbnRhdGlvbiBhdCB0aGUgY3VycmVudCBsZXZlbC5cbiAgICAgICAgQGluZGVudHMgICAgPSBbXSAgICAgICAgICAgIyBUaGUgc3RhY2sgb2YgYWxsIGN1cnJlbnQgaW5kZW50YXRpb24gbGV2ZWxzLlxuICAgICAgICBAZW5kcyAgICAgICA9IFtdICAgICAgICAgICAjIFRoZSBzdGFjayBmb3IgcGFpcmluZyB1cCB0b2tlbnMuXG4gICAgICAgIEB0b2tlbnMgICAgID0gW10gICAgICAgICAgICMgU3RyZWFtIG9mIHBhcnNlZCB0b2tlbnMgaW4gdGhlIGZvcm0gYFsnVFlQRScsIHZhbHVlLCBsb2NhdGlvbiBkYXRhXWAuXG4gICAgICAgIEBzZWVuRm9yICAgID0gbm8gICAgICAgICAgICMgVXNlZCB0byByZWNvZ25pemUgRk9SSU4sIEZPUk9GIGFuZCBGT1JGUk9NIHRva2Vucy5cbiAgICAgICAgQHNlZW5JbXBvcnQgPSBubyAgICAgICAgICAgIyBVc2VkIHRvIHJlY29nbml6ZSBJTVBPUlQgRlJPTT8gQVM/IHRva2Vucy5cbiAgICAgICAgQHNlZW5FeHBvcnQgPSBubyAgICAgICAgICAgIyBVc2VkIHRvIHJlY29nbml6ZSBFWFBPUlQgRlJPTT8gQVM/IHRva2Vucy5cbiAgICAgICAgQGltcG9ydFNwZWNpZmllckxpc3QgPSBubyAgIyBVc2VkIHRvIGlkZW50aWZ5IHdoZW4gaW4gYW4gSU1QT1JUIHsuLi59IEZST00/IC4uLlxuICAgICAgICBAZXhwb3J0U3BlY2lmaWVyTGlzdCA9IG5vICAjIFVzZWQgdG8gaWRlbnRpZnkgd2hlbiBpbiBhbiBFWFBPUlQgey4uLn0gRlJPTT8gLi4uXG5cbiAgICAgICAgQGNodW5rTGluZSAgID0gb3B0cy5saW5lIG9yIDAgICAgIyBUaGUgc3RhcnQgbGluZSBmb3IgdGhlIGN1cnJlbnQgQGNodW5rLlxuICAgICAgICBAY2h1bmtDb2x1bW4gPSBvcHRzLmNvbHVtbiBvciAwICAjIFRoZSBzdGFydCBjb2x1bW4gb2YgdGhlIGN1cnJlbnQgQGNodW5rLlxuICAgICAgICBAY29kZSA9IEBjbGVhbiBjb2RlICAgICAgICAgICAgICAjIFRoZSBzdHJpcHBlZCwgY2xlYW5lZCBvcmlnaW5hbCBzb3VyY2UgY29kZS5cblxuICAgICAgICAjIEF0IGV2ZXJ5IHBvc2l0aW9uLCBydW4gdGhyb3VnaCB0aGlzIGxpc3Qgb2YgYXR0ZW1wdGVkIG1hdGNoZXMsIHNob3J0LWNpcmN1aXRpbmcgaWYgYW55IG9mIHRoZW0gc3VjY2VlZC4gXG4gICAgICAgICMgVGhlaXIgb3JkZXIgZGV0ZXJtaW5lcyBwcmVjZWRlbmNlOiBgQGxpdGVyYWxUb2tlbmAgaXMgdGhlIGZhbGxiYWNrIGNhdGNoLWFsbC5cbiAgICAgICAgXG4gICAgICAgIEBjaHVua0luZGV4ID0gMFxuICAgICAgICB3aGlsZSBAY2h1bmsgPSBAY29kZVtAY2h1bmtJbmRleC4uXVxuICAgICAgICAgICAgY29uc3VtZWQgPSBcXFxuICAgICAgICAgICAgICAgICAgICAgQGRvY1Rva2VuKCkgICAgICAgIG9yXG4gICAgICAgICAgICAgICAgICAgICBAaWRlbnRpZmllclRva2VuKCkgb3JcbiAgICAgICAgICAgICAgICAgICAgIEBjb21tZW50VG9rZW4oKSAgICBvclxuICAgICAgICAgICAgICAgICAgICAgQHdoaXRlc3BhY2VUb2tlbigpIG9yXG4gICAgICAgICAgICAgICAgICAgICBAbGluZVRva2VuKCkgICAgICAgb3JcbiAgICAgICAgICAgICAgICAgICAgIEBzdHJpbmdUb2tlbigpICAgICBvclxuICAgICAgICAgICAgICAgICAgICAgQG51bWJlclRva2VuKCkgICAgIG9yXG4gICAgICAgICAgICAgICAgICAgICBAcmVnZXhUb2tlbigpICAgICAgb3JcbiAgICAgICAgICAgICAgICAgICAgIEBqc1Rva2VuKCkgICAgICAgICBvclxuICAgICAgICAgICAgICAgICAgICAgQGxpdGVyYWxUb2tlbigpXG5cbiAgICAgICAgICAgICMgVXBkYXRlIHBvc2l0aW9uXG4gICAgICAgICAgICBbQGNodW5rTGluZSwgQGNodW5rQ29sdW1uXSA9IEBnZXRMaW5lQW5kQ29sdW1uRnJvbUNodW5rIGNvbnN1bWVkXG5cbiAgICAgICAgICAgIEBjaHVua0luZGV4ICs9IGNvbnN1bWVkXG5cbiAgICAgICAgICAgIHJldHVybiB7QHRva2VucywgaW5kZXg6IEBjaHVua0luZGV4fSBpZiBvcHRzLnVudGlsQmFsYW5jZWQgYW5kIEBlbmRzLmxlbmd0aCBpcyAwXG5cbiAgICAgICAgQGNsb3NlSW5kZW50YXRpb24oKVxuICAgICAgICBAZXJyb3IgXCJtaXNzaW5nICN7ZW5kLnRhZ31cIiwgZW5kLm9yaWdpblsyXSBpZiBlbmQgPSBAZW5kcy5wb3AoKVxuICAgICAgICBcbiAgICAgICAgaWYgaGFzRmVhdHVyZSBvcHRzLCAncmV3cml0ZSdcbiAgICAgICAgICAgIChuZXcgUmV3cml0ZXIpLnJld3JpdGUgQHRva2Vucywgb3B0c1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICB3YXJuICdza2lwcGluZyByZXdyaXRlIScjICwgb3B0c1xuXG4gICAgICAgIEB0b2tlbnNcblxuICAgICMgUHJlcHJvY2VzcyB0aGUgY29kZSB0byByZW1vdmUgbGVhZGluZyBhbmQgdHJhaWxpbmcgd2hpdGVzcGFjZSwgY2FycmlhZ2UgcmV0dXJucywgZXRjLiBcbiAgICBcbiAgICBjbGVhbjogKGNvZGUpIC0+XG4gICAgICAgIFxuICAgICAgICBjb2RlID0gY29kZS5zbGljZSgxKSBpZiBjb2RlLmNoYXJDb2RlQXQoMCkgaXMgQk9NXG4gICAgICAgIGNvZGUgPSBjb2RlLnJlcGxhY2UoL1xcci9nLCAnJykucmVwbGFjZSBUUkFJTElOR19TUEFDRVMsICcnXG4gICAgICAgIGlmIFdISVRFU1BBQ0UudGVzdCBjb2RlXG4gICAgICAgICAgICBjb2RlID0gXCJcXG4je2NvZGV9XCJcbiAgICAgICAgICAgIEBjaHVua0xpbmUtLVxuICAgICAgICBjb2RlXG5cbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIFxuICAgIFxuICAgIGRvY1Rva2VuOiAtPlxuXG4gICAgICAgIERPQyA9IC9eKOKWuHx+PikoZG9jKShcXHMrKFtcXFwiXVteXFxuXFxcIl0qW1xcXCJdfFtcXCddW15cXG5cXCddKltcXCddKSk/W15cXG5cXFNdKlxcbi9cbiAgICAgICAgXG4gICAgICAgIHJldHVybiAwIGlmIG5vdCBtYXRjaCA9IEBjaHVuay5tYXRjaCBET0NcbiAgICAgICAgXG4gICAgICAgIGRvYyA9IG1hdGNoWzBdXG4gICAgICAgIFxuICAgICAgICAjIG1hcmNoIHRocm91Z2ggYWxsIGZvbGxvd2luZyBsaW5lcyB1bnRpbCBzYW1lIG9yIHNtYWxsZXIgaW5kZW50IGlzIGZvdW5kXG4gICAgICAgIFxuICAgICAgICByZXN0ID0gQGNodW5rW21hdGNoWzBdLmxlbmd0aC4uXVxuICAgICAgICBcbiAgICAgICAgbnVtTGluZXMgPSAwXG4gICAgICAgIGxpbmVzID0gcmVzdC5zcGxpdCAnXFxuJ1xuICAgICAgICBmb3IgbGluZSBpbiBsaW5lc1xuICAgICAgICAgICAgbnVtTGluZXMrK1xuICAgICAgICAgICAgbWF0Y2ggPSBXSElURVNQQUNFLmV4ZWMgbGluZVxuICAgICAgICAgICAgaWYgbWF0Y2hcbiAgICAgICAgICAgICAgICBsaW5lSW5kZW50ID0gbWF0Y2g/WzBdLmxlbmd0aFxuICAgICAgICAgICAgZWxzZSBpZiBsaW5lLmxlbmd0aFxuICAgICAgICAgICAgICAgIGxpbmVJbmRlbnQgPSAwICMgbGluZSB3aXRob3V0IGluZGVudGF0aW9uXG4gICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgIGNvbnRpbnVlICMgaWdub3JlIGVtcHR5IGxpbmVzXG4gICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGxpbmVJbmRlbnQgPD0gQGluZGVudFxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGxpbmVJbmRlbnQgPiBAaW5kZW50IHRoZW4gbnVtTGluZXMrKyAjIHByb2JhYmx5IGF0IGVuZCBvZiBpbnB1dCwgaW5jbHVkZSBsYXN0IGxpbmVcbiAgICAgICAgXG4gICAgICAgIGNtbXQgPSByZXBlYXQgJyAnLCBAaW5kZW50KzRcbiAgICAgICAgY21tdCArPSBcIicnJ1wiXG4gICAgICAgIGJvZHkgPSBsaW5lc1suLi5udW1MaW5lcy0xXVxuICAgICAgICBhZnRlciA9IGxpbmVzW251bUxpbmVzLTEuLl1cbiAgICAgICAgbmV3Q29kZSA9IFtkb2MsIGNtbXQsIGJvZHksIGNtbXQsIGFmdGVyXS5mbGF0KCkuam9pbiAnXFxuJ1xuICAgICAgICBAY29kZSA9IEBjb2RlWy4uLkBjaHVua0luZGV4XSArIG5ld0NvZGVcbiAgICAgICAgIyDilrhkYmcgQGNvZGVcbiAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICAjIOKWuGRiZyAnaGVhZCcgbWF0Y2guaW5wdXRbLi4xMDBdXG4gICAgICAgIFxuICAgICAgICBcbiAgICAjIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMDAwMCAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICAjIE1hdGNoZXMgaWRlbnRpZnlpbmcgbGl0ZXJhbHM6IHZhcmlhYmxlcywga2V5d29yZHMsIG1ldGhvZCBuYW1lcywgZXRjLlxuICAgICMgQ2hlY2sgdG8gZW5zdXJlIHRoYXQgSmF2YVNjcmlwdCByZXNlcnZlZCB3b3JkcyBhcmVuJ3QgYmVpbmcgdXNlZCBhcyBpZGVudGlmaWVycy4gXG4gICAgIyBCZWNhdXNlIEtvZmZlZSByZXNlcnZlcyBhIGhhbmRmdWwgb2Yga2V5d29yZHMgdGhhdCBhcmUgYWxsb3dlZCBpbiBKYXZhU2NyaXB0LCBcbiAgICAjIHdlJ3JlIGNhcmVmdWwgbm90IHRvIHRhZyB0aGVtIGFzIGtleXdvcmRzIHdoZW4gcmVmZXJlbmNlZCBhcyBwcm9wZXJ0eSBuYW1lcyBoZXJlLCBcbiAgICAjIHNvIHlvdSBjYW4gc3RpbGwgZG8gYGpRdWVyeS5pcygpYCBldmVuIHRob3VnaCBgaXNgIG1lYW5zIGA9PT1gIG90aGVyd2lzZS5cbiAgICBcbiAgICBpZGVudGlmaWVyVG9rZW46IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gMCB1bmxlc3MgbWF0Y2ggPSBJREVOVElGSUVSLmV4ZWMgQGNodW5rXG4gICAgICAgIFtpbnB1dCwgaWQsIGNvbG9uXSA9IG1hdGNoXG5cbiAgICAgICAgaWRMZW5ndGggPSBpZC5sZW5ndGggIyBQcmVzZXJ2ZSBsZW5ndGggb2YgaWQgZm9yIGxvY2F0aW9uIGRhdGFcbiAgICAgICAgcG9wcGVkVG9rZW4gPSB1bmRlZmluZWRcblxuICAgICAgICBpZiBpZCBpcyAnb3duJyBhbmQgQHRhZygpIGlzICdGT1InXG4gICAgICAgICAgICBAdG9rZW4gJ09XTicsIGlkXG4gICAgICAgICAgICByZXR1cm4gaWQubGVuZ3RoXG4gICAgICAgIGlmIGlkIGlzICdmcm9tJyBhbmQgQHRhZygpIGlzICdZSUVMRCdcbiAgICAgICAgICAgIEB0b2tlbiAnRlJPTScsIGlkXG4gICAgICAgICAgICByZXR1cm4gaWQubGVuZ3RoXG4gICAgICAgIGlmIGlkIGlzICdhcycgYW5kIEBzZWVuSW1wb3J0XG4gICAgICAgICAgICBpZiBAdmFsdWUoKSBpcyAnKidcbiAgICAgICAgICAgICAgICBAdG9rZW5zW0B0b2tlbnMubGVuZ3RoIC0gMV1bMF0gPSAnSU1QT1JUX0FMTCdcbiAgICAgICAgICAgIGVsc2UgaWYgQHZhbHVlKCkgaW4gQ09GRkVFX0tFWVdPUkRTXG4gICAgICAgICAgICAgICAgQHRva2Vuc1tAdG9rZW5zLmxlbmd0aCAtIDFdWzBdID0gJ0lERU5USUZJRVInXG4gICAgICAgICAgICBpZiBAdGFnKCkgaW4gWydERUZBVUxUJyAnSU1QT1JUX0FMTCcgJ0lERU5USUZJRVInXVxuICAgICAgICAgICAgICAgIEB0b2tlbiAnQVMnLCBpZFxuICAgICAgICAgICAgICAgIHJldHVybiBpZC5sZW5ndGhcbiAgICAgICAgaWYgaWQgaXMgJ2FzJyBhbmQgQHNlZW5FeHBvcnQgYW5kIEB0YWcoKSBpbiBbJ0lERU5USUZJRVInICdERUZBVUxUJ11cbiAgICAgICAgICAgIEB0b2tlbiAnQVMnLCBpZFxuICAgICAgICAgICAgcmV0dXJuIGlkLmxlbmd0aFxuICAgICAgICBpZiBpZCBpcyAnZGVmYXVsdCcgYW5kIEBzZWVuRXhwb3J0IGFuZCBAdGFnKCkgaW4gWydFWFBPUlQnICdBUyddXG4gICAgICAgICAgICBAdG9rZW4gJ0RFRkFVTFQnLCBpZFxuICAgICAgICAgICAgcmV0dXJuIGlkLmxlbmd0aFxuXG4gICAgICAgIFsuLi4sIHByZXZdID0gQHRva2Vuc1xuXG4gICAgICAgIHRhZyA9XG4gICAgICAgICAgICBpZiBjb2xvbiBvciBwcmV2PyBhbmQgKHByZXZbMF0gaW4gWycuJyAnPy4nICc6OicgJz86OiddIG9yIG5vdCBwcmV2LnNwYWNlZCBhbmQgcHJldlswXSBpcyAnQCcpXG4gICAgICAgICAgICAgICAgJ1BST1BFUlRZJ1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICdJREVOVElGSUVSJ1xuXG4gICAgICAgIGlmIHRhZyBpcyAnSURFTlRJRklFUicgYW5kIGlkWzBdID09ICfilrgnIGFuZCBpZFsxLi5dIGluIE1FVEFfS0VZV09SRFNcbiAgICAgICAgICAgIGlmIGlkID09ICfilrhlbGlmJ1xuICAgICAgICAgICAgICAgIEB0b2tlbiAnTUVUQV9FTFNFJywgJ2Vsc2UnXG4gICAgICAgICAgICAgICAgQHRva2Vuc1stMV0uc3BhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgICAgIHRhZyA9ICdNRVRBX0lGJ1xuICAgICAgICAgICAgICAgIGlkICA9ICdpZidcbiAgICAgICAgICAgIGVsc2UgaWYgaWQgPT0gJ+KWuHRoZW4nXG4gICAgICAgICAgICAgICAgdGFnID0gJ1RIRU4nXG4gICAgICAgICAgICAgICAgaWQgID0gJ3RoZW4nXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaWQgPSBpZFsxLi5dXG4gICAgICAgICAgICAgICAgdGFnID0gJ01FVEFfJyArIGlkLnRvVXBwZXJDYXNlKClcbiAgICAgICAgICAgIFxuICAgICAgICBlbHNlIGlmIHRhZyBpcyAnSURFTlRJRklFUicgYW5kIChpZCBpbiBKU19LRVlXT1JEUyBvciBpZCBpbiBDT0ZGRUVfS0VZV09SRFMpIGFuZCBub3QgKEBleHBvcnRTcGVjaWZpZXJMaXN0IGFuZCBpZCBpbiBDT0ZGRUVfS0VZV09SRFMpXG4gICAgICAgICAgICB0YWcgPSBpZC50b1VwcGVyQ2FzZSgpXG4gICAgICAgICAgICBpZiB0YWcgaXMgJ1dIRU4nIGFuZCBAdGFnKCkgaW4gTElORV9CUkVBS1xuICAgICAgICAgICAgICAgIHRhZyA9ICdMRUFESU5HX1dIRU4nXG4gICAgICAgICAgICBlbHNlIGlmIHRhZyBpcyAnRk9SJ1xuICAgICAgICAgICAgICAgIEBzZWVuRm9yID0geWVzXG4gICAgICAgICAgICBlbHNlIGlmIHRhZyBpcyAnVU5MRVNTJ1xuICAgICAgICAgICAgICAgIHRhZyA9ICdJRidcbiAgICAgICAgICAgIGVsc2UgaWYgdGFnIGlzICdJTVBPUlQnXG4gICAgICAgICAgICAgICAgQHNlZW5JbXBvcnQgPSB5ZXNcbiAgICAgICAgICAgIGVsc2UgaWYgdGFnIGlzICdFWFBPUlQnXG4gICAgICAgICAgICAgICAgQHNlZW5FeHBvcnQgPSB5ZXNcbiAgICAgICAgICAgIGVsc2UgaWYgdGFnIGluIFVOQVJZXG4gICAgICAgICAgICAgICAgdGFnID0gJ1VOQVJZJ1xuICAgICAgICAgICAgZWxzZSBpZiB0YWcgaW4gUkVMQVRJT05cbiAgICAgICAgICAgICAgICBpZiB0YWcgIT0gJ0lOU1RBTkNFT0YnIGFuZCBAc2VlbkZvclxuICAgICAgICAgICAgICAgICAgICB0YWcgPSAnRk9SJyArIHRhZ1xuICAgICAgICAgICAgICAgICAgICBAc2VlbkZvciA9IG5vXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB0YWcgPSAnUkVMQVRJT04nXG4gICAgICAgICAgICAgICAgICAgIGlmIEB2YWx1ZSgpIGlzICchJ1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9wcGVkVG9rZW4gPSBAdG9rZW5zLnBvcCgpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9ICchJyArIGlkXG4gICAgICAgIGVsc2UgaWYgdGFnIGlzICdJREVOVElGSUVSJyBhbmQgQHNlZW5Gb3IgYW5kIGlkIGlzICdmcm9tJyBhbmQgaXNGb3JGcm9tKHByZXYpXG4gICAgICAgICAgICB0YWcgPSAnRk9SRlJPTSdcbiAgICAgICAgICAgIEBzZWVuRm9yID0gbm9cblxuICAgICAgICBpZiB0YWcgaXMgJ0lERU5USUZJRVInIGFuZCBpZCBpbiBSRVNFUlZFRFxuICAgICAgICAgICAgQGVycm9yIFwicmVzZXJ2ZWQgd29yZCAnI3tpZH0nXCIsIGxlbmd0aDppZC5sZW5ndGhcblxuICAgICAgICB1bmxlc3MgdGFnIGlzICdQUk9QRVJUWSdcbiAgICAgICAgICAgIGlmIGlkIGluIENPRkZFRV9BTElBU0VTXG4gICAgICAgICAgICAgICAgYWxpYXMgPSBpZFxuICAgICAgICAgICAgICAgIGlkID0gQ09GRkVFX0FMSUFTX01BUFtpZF1cbiAgICAgICAgICAgIHRhZyA9IHN3aXRjaCBpZFxuICAgICAgICAgICAgICAgIHdoZW4gJyEnICAgICAgICAgICAgICAgICAgICB0aGVuICdVTkFSWSdcbiAgICAgICAgICAgICAgICB3aGVuICc9PScsICchPScgICAgICAgICAgICAgdGhlbiAnQ09NUEFSRSdcbiAgICAgICAgICAgICAgICB3aGVuICd0cnVlJywgJ2ZhbHNlJyAgICAgICAgdGhlbiAnQk9PTCdcbiAgICAgICAgICAgICAgICB3aGVuICcmJicsICd8fCcgICAgICAgICAgICAgdGhlbiBpZFxuICAgICAgICAgICAgICAgIHdoZW4gJ2JyZWFrJywgJ2NvbnRpbnVlJywgJ2RlYnVnZ2VyJyB0aGVuICdTVEFURU1FTlQnXG4gICAgICAgICAgICAgICAgZWxzZSAgICB0YWdcblxuICAgICAgICB0YWdUb2tlbiA9IEB0b2tlbiB0YWcsIGlkLCAwLCBpZExlbmd0aFxuICAgICAgICB0YWdUb2tlbi5vcmlnaW4gPSBbdGFnLCBhbGlhcywgdGFnVG9rZW5bMl1dIGlmIGFsaWFzXG4gICAgICAgIGlmIHBvcHBlZFRva2VuXG4gICAgICAgICAgICBbdGFnVG9rZW5bMl0uZmlyc3RfbGluZSwgdGFnVG9rZW5bMl0uZmlyc3RfY29sdW1uXSA9XG4gICAgICAgICAgICAgICAgW3BvcHBlZFRva2VuWzJdLmZpcnN0X2xpbmUsIHBvcHBlZFRva2VuWzJdLmZpcnN0X2NvbHVtbl1cbiAgICAgICAgaWYgY29sb25cbiAgICAgICAgICAgIGNvbG9uT2Zmc2V0ID0gaW5wdXQubGFzdEluZGV4T2YgJzonXG4gICAgICAgICAgICBAdG9rZW4gJzonLCAnOicsIGNvbG9uT2Zmc2V0LCBjb2xvbi5sZW5ndGhcblxuICAgICAgICBpbnB1dC5sZW5ndGhcblxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG5cbiAgICAjIE1hdGNoZXMgbnVtYmVycywgaW5jbHVkaW5nIGRlY2ltYWxzLCBoZXgsIGFuZCBleHBvbmVudGlhbCBub3RhdGlvbi5cbiAgICAjIEJlIGNhcmVmdWwgbm90IHRvIGludGVyZmVyZSB3aXRoIHJhbmdlcy1pbi1wcm9ncmVzcy5cbiAgICBcbiAgICBudW1iZXJUb2tlbjogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiAwIHVubGVzcyBtYXRjaCA9IE5VTUJFUi5leGVjIEBjaHVua1xuXG4gICAgICAgIG51bWJlciA9IG1hdGNoWzBdXG4gICAgICAgIGxleGVkTGVuZ3RoID0gbnVtYmVyLmxlbmd0aFxuXG4gICAgICAgIHN3aXRjaFxuICAgICAgICAgICAgd2hlbiAvXjBbQk9YXS8udGVzdCBudW1iZXJcbiAgICAgICAgICAgICAgICBAZXJyb3IgXCJyYWRpeCBwcmVmaXggaW4gJyN7bnVtYmVyfScgbXVzdCBiZSBsb3dlcmNhc2VcIiwgb2Zmc2V0OiAxXG4gICAgICAgICAgICB3aGVuIC9eKD8hMHgpLipFLy50ZXN0IG51bWJlclxuICAgICAgICAgICAgICAgIEBlcnJvciBcImV4cG9uZW50aWFsIG5vdGF0aW9uIGluICcje251bWJlcn0nIG11c3QgYmUgaW5kaWNhdGVkIHdpdGggYSBsb3dlcmNhc2UgJ2UnXCIsXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldDogbnVtYmVyLmluZGV4T2YoJ0UnKVxuICAgICAgICAgICAgd2hlbiAvXjBcXGQqWzg5XS8udGVzdCBudW1iZXJcbiAgICAgICAgICAgICAgICBAZXJyb3IgXCJkZWNpbWFsIGxpdGVyYWwgJyN7bnVtYmVyfScgbXVzdCBub3QgYmUgcHJlZml4ZWQgd2l0aCAnMCdcIiwgbGVuZ3RoOiBsZXhlZExlbmd0aFxuICAgICAgICAgICAgd2hlbiAvXjBcXGQrLy50ZXN0IG51bWJlclxuICAgICAgICAgICAgICAgIEBlcnJvciBcIm9jdGFsIGxpdGVyYWwgJyN7bnVtYmVyfScgbXVzdCBiZSBwcmVmaXhlZCB3aXRoICcwbydcIiwgbGVuZ3RoOiBsZXhlZExlbmd0aFxuXG4gICAgICAgIGJhc2UgPSBzd2l0Y2ggbnVtYmVyLmNoYXJBdCAxXG4gICAgICAgICAgICB3aGVuICdiJyB0aGVuIDJcbiAgICAgICAgICAgIHdoZW4gJ28nIHRoZW4gOFxuICAgICAgICAgICAgd2hlbiAneCcgdGhlbiAxNlxuICAgICAgICAgICAgZWxzZSBudWxsXG4gICAgICAgIG51bWJlclZhbHVlID0gaWYgYmFzZT8gdGhlbiBwYXJzZUludChudW1iZXJbMi4uXSwgYmFzZSkgZWxzZSBwYXJzZUZsb2F0KG51bWJlcilcbiAgICAgICAgaWYgbnVtYmVyLmNoYXJBdCgxKSBpbiBbJ2InLCAnbyddXG4gICAgICAgICAgICBudW1iZXIgPSBcIjB4I3tudW1iZXJWYWx1ZS50b1N0cmluZyAxNn1cIlxuXG4gICAgICAgIHRhZyA9IGlmIG51bWJlclZhbHVlIGlzIEluZmluaXR5IHRoZW4gJ0lORklOSVRZJyBlbHNlICdOVU1CRVInXG4gICAgICAgIEB0b2tlbiB0YWcsIG51bWJlciwgMCwgbGV4ZWRMZW5ndGhcbiAgICAgICAgbGV4ZWRMZW5ndGhcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwICAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgIyBNYXRjaGVzIHN0cmluZ3MsIGluY2x1ZGluZyBtdWx0aS1saW5lIHN0cmluZ3MsIGFzIHdlbGwgYXMgaGVyZWRvY3MsIHdpdGggb3Igd2l0aG91dCBpbnRlcnBvbGF0aW9uLlxuICAgIFxuICAgIHN0cmluZ1Rva2VuOiAtPlxuICAgICAgICBcbiAgICAgICAgW3F1b3RlXSA9IFNUUklOR19TVEFSVC5leGVjKEBjaHVuaykgfHwgW11cbiAgICAgICAgcmV0dXJuIDAgaWYgbm90IHF1b3RlXG5cbiAgICAgICAgIyBJZiB0aGUgcHJlY2VkaW5nIHRva2VuIGlzIGBmcm9tYCBhbmQgdGhpcyBpcyBhbiBpbXBvcnQgb3IgZXhwb3J0IHN0YXRlbWVudCwgcHJvcGVybHkgdGFnIHRoZSBgZnJvbWAuXG4gICAgICAgIFxuICAgICAgICBpZiBAdG9rZW5zLmxlbmd0aCBhbmQgQHZhbHVlKCkgaXMgJ2Zyb20nIGFuZCAoQHNlZW5JbXBvcnQgb3IgQHNlZW5FeHBvcnQpXG4gICAgICAgICAgICBAdG9rZW5zW0B0b2tlbnMubGVuZ3RoIC0gMV1bMF0gPSAnRlJPTSdcblxuICAgICAgICByZWdleCA9IHN3aXRjaCBxdW90ZVxuICAgICAgICAgICAgd2hlbiBcIidcIiAgIHRoZW4gU1RSSU5HX1NJTkdMRVxuICAgICAgICAgICAgd2hlbiAnXCInICAgdGhlbiBTVFJJTkdfRE9VQkxFXG4gICAgICAgICAgICB3aGVuIFwiJycnXCIgdGhlbiBIRVJFRE9DX1NJTkdMRVxuICAgICAgICAgICAgd2hlbiAnXCJcIlwiJyB0aGVuIEhFUkVET0NfRE9VQkxFXG4gICAgICAgIGhlcmVkb2MgPSBxdW90ZS5sZW5ndGggaXMgM1xuXG4gICAgICAgIHt0b2tlbnMsIGluZGV4OiBlbmR9ID0gQG1hdGNoV2l0aEludGVycG9sYXRpb25zIHJlZ2V4LCBxdW90ZVxuICAgICAgICAkID0gdG9rZW5zLmxlbmd0aCAtIDFcblxuICAgICAgICBkZWxpbWl0ZXIgPSBxdW90ZS5jaGFyQXQoMClcbiAgICAgICAgaWYgaGVyZWRvY1xuICAgICAgICAgICAgIyBGaW5kIHRoZSBzbWFsbGVzdCBpbmRlbnRhdGlvbi4gSXQgd2lsbCBiZSByZW1vdmVkIGZyb20gYWxsIGxpbmVzIGxhdGVyLlxuICAgICAgICAgICAgaW5kZW50ID0gbnVsbFxuICAgICAgICAgICAgZG9jID0gKHRva2VuWzFdIGZvciB0b2tlbiwgaSBpbiB0b2tlbnMgd2hlbiB0b2tlblswXSBpcyAnTkVPU1RSSU5HJykuam9pbiAnI3t9J1xuICAgICAgICAgICAgd2hpbGUgbWF0Y2ggPSBIRVJFRE9DX0lOREVOVC5leGVjIGRvY1xuICAgICAgICAgICAgICAgIGF0dGVtcHQgPSBtYXRjaFsxXVxuICAgICAgICAgICAgICAgIGluZGVudCA9IGF0dGVtcHQgaWYgaW5kZW50IGlzIG51bGwgb3IgMCA8IGF0dGVtcHQubGVuZ3RoIDwgaW5kZW50Lmxlbmd0aFxuICAgICAgICAgICAgaW5kZW50UmVnZXggPSAvLy8gXFxuI3tpbmRlbnR9IC8vL2cgaWYgaW5kZW50XG4gICAgICAgICAgICBAbWVyZ2VJbnRlcnBvbGF0aW9uVG9rZW5zIHRva2Vucywge2RlbGltaXRlcn0sICh2YWx1ZSwgaSkgPT5cbiAgICAgICAgICAgICAgICB2YWx1ZSA9IEBmb3JtYXRTdHJpbmcgdmFsdWUsIGRlbGltaXRlcjogcXVvdGVcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UgaW5kZW50UmVnZXgsICdcXG4nIGlmIGluZGVudFJlZ2V4XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlIExFQURJTkdfQkxBTktfTElORSwgICcnIGlmIGkgaXMgMFxuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZSBUUkFJTElOR19CTEFOS19MSU5FLCAnJyBpZiBpIGlzICRcbiAgICAgICAgICAgICAgICB2YWx1ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAbWVyZ2VJbnRlcnBvbGF0aW9uVG9rZW5zIHRva2Vucywge2RlbGltaXRlcn0sICh2YWx1ZSwgaSkgPT5cbiAgICAgICAgICAgICAgICB2YWx1ZSA9IEBmb3JtYXRTdHJpbmcgdmFsdWUsIGRlbGltaXRlcjogcXVvdGVcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UgU0lNUExFX1NUUklOR19PTUlULCAobWF0Y2gsIG9mZnNldCkgLT5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgaXMgMCBhbmQgb2Zmc2V0IGlzIDApIG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgKGkgaXMgJCBhbmQgb2Zmc2V0ICsgbWF0Y2gubGVuZ3RoIGlzIHZhbHVlLmxlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgICAgICcnXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICcgJ1xuICAgICAgICAgICAgICAgIHZhbHVlXG4gICAgICAgIGVuZFxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIGNvbW1lbnRUb2tlbjogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiAwIHVubGVzcyBtYXRjaCA9IEBjaHVuay5tYXRjaCBDT01NRU5UXG4gICAgICAgIFtjb21tZW50LCBoZXJlXSA9IG1hdGNoXG4gICAgICAgIGlmIGhlcmVcbiAgICAgICAgICAgIGlmIG1hdGNoID0gSEVSRUNPTU1FTlRfSUxMRUdBTC5leGVjIGNvbW1lbnRcbiAgICAgICAgICAgICAgICBAZXJyb3IgXCJibG9jayBjb21tZW50cyBjYW5ub3QgY29udGFpbiAje21hdGNoWzBdfVwiLFxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IG1hdGNoLmluZGV4LCBsZW5ndGg6IG1hdGNoWzBdLmxlbmd0aFxuICAgICAgICAgICAgaWYgaGVyZS5pbmRleE9mKCdcXG4nKSA+PSAwXG4gICAgICAgICAgICAgICAgaGVyZSA9IGhlcmUucmVwbGFjZSAvLy8gXFxuICN7cmVwZWF0ICcgJywgQGluZGVudH0gLy8vZywgJ1xcbidcbiAgICAgICAgICAgIEB0b2tlbiAnSEVSRUNPTU1FTlQnLCBoZXJlLCAwLCBjb21tZW50Lmxlbmd0aFxuICAgICAgICBjb21tZW50Lmxlbmd0aFxuICAgICAgICBcbiAgICAjICAgICAgIDAwMCAgIDAwMDAwMDAgIFxuICAgICMgICAgICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAgICAgICAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgIyBNYXRjaGVzIEphdmFTY3JpcHQgaW50ZXJwb2xhdGVkIGRpcmVjdGx5IGludG8gdGhlIHNvdXJjZSB2aWEgYmFja3RpY2tzLlxuICAgIFxuICAgIGpzVG9rZW46IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gMCB1bmxlc3MgQGNodW5rLmNoYXJBdCgwKSBpcyAnYCcgYW5kXG4gICAgICAgICAgICAobWF0Y2ggPSBIRVJFX0pTVE9LRU4uZXhlYyhAY2h1bmspIG9yIEpTVE9LRU4uZXhlYyhAY2h1bmspKVxuICAgICAgICAjIENvbnZlcnQgZXNjYXBlZCBiYWNrdGlja3MgdG8gYmFja3RpY2tzLCBhbmQgZXNjYXBlZCBiYWNrc2xhc2hlc1xuICAgICAgICAjIGp1c3QgYmVmb3JlIGVzY2FwZWQgYmFja3RpY2tzIHRvIGJhY2tzbGFzaGVzXG4gICAgICAgIHNjcmlwdCA9IG1hdGNoWzFdLnJlcGxhY2UgL1xcXFwrKGB8JCkvZywgKHN0cmluZykgLT5cbiAgICAgICAgICAgICMgYHN0cmluZ2AgaXMgYWx3YXlzIGEgdmFsdWUgbGlrZSAnXFxgJywgJ1xcXFxcXGAnLCAnXFxcXFxcXFxcXGAnLCBldGMuXG4gICAgICAgICAgICAjIEJ5IHJlZHVjaW5nIGl0IHRvIGl0cyBsYXR0ZXIgaGFsZiwgd2UgdHVybiAnXFxgJyB0byAnYCcsICdcXFxcXFxgJyB0byAnXFxgJywgZXRjLlxuICAgICAgICAgICAgc3RyaW5nWy1NYXRoLmNlaWwoc3RyaW5nLmxlbmd0aCAvIDIpLi5dXG4gICAgICAgIEB0b2tlbiAnSlMnLCBzY3JpcHQsIDAsIG1hdGNoWzBdLmxlbmd0aFxuICAgICAgICBtYXRjaFswXS5sZW5ndGhcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgIDAwMDAgIDAwMDAwMDAgICAgIDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgIyBNYXRjaGVzIHJlZ3VsYXIgZXhwcmVzc2lvbiBsaXRlcmFscywgYXMgd2VsbCBhcyBtdWx0aWxpbmUgZXh0ZW5kZWQgb25lcy5cbiAgICAjIExleGluZyByZWd1bGFyIGV4cHJlc3Npb25zIGlzIGRpZmZpY3VsdCB0byBkaXN0aW5ndWlzaCBmcm9tIGRpdmlzaW9uLCBcbiAgICAjIHNvIHdlIGJvcnJvdyBzb21lIGJhc2ljIGhldXJpc3RpY3MgZnJvbSBKYXZhU2NyaXB0IGFuZCBSdWJ5LlxuICAgIFxuICAgIHJlZ2V4VG9rZW46IC0+XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2hcbiAgICAgICAgICAgIHdoZW4gbWF0Y2ggPSBSRUdFWF9JTExFR0FMLmV4ZWMgQGNodW5rXG4gICAgICAgICAgICAgICAgQGVycm9yIFwicmVndWxhciBleHByZXNzaW9ucyBjYW5ub3QgYmVnaW4gd2l0aCAje21hdGNoWzJdfVwiLFxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IG1hdGNoLmluZGV4ICsgbWF0Y2hbMV0ubGVuZ3RoXG4gICAgICAgICAgICB3aGVuIG1hdGNoID0gQG1hdGNoV2l0aEludGVycG9sYXRpb25zIEhFUkVHRVgsICcvLy8nXG4gICAgICAgICAgICAgICAge3Rva2VucywgaW5kZXh9ID0gbWF0Y2hcbiAgICAgICAgICAgIHdoZW4gbWF0Y2ggPSBSRUdFWC5leGVjIEBjaHVua1xuICAgICAgICAgICAgICAgIFtyZWdleCwgYm9keSwgY2xvc2VkXSA9IG1hdGNoXG4gICAgICAgICAgICAgICAgQHZhbGlkYXRlRXNjYXBlcyBib2R5LCBpc1JlZ2V4OiB5ZXMsIG9mZnNldEluQ2h1bms6IDFcbiAgICAgICAgICAgICAgICBib2R5ID0gQGZvcm1hdFJlZ2V4IGJvZHksIGRlbGltaXRlcjogJy8nXG4gICAgICAgICAgICAgICAgaW5kZXggPSByZWdleC5sZW5ndGhcbiAgICAgICAgICAgICAgICBbLi4uLCBwcmV2XSA9IEB0b2tlbnNcbiAgICAgICAgICAgICAgICBpZiBwcmV2XG4gICAgICAgICAgICAgICAgICAgIGlmIHByZXYuc3BhY2VkIGFuZCBwcmV2WzBdIGluIENBTExBQkxFXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMCBpZiBub3QgY2xvc2VkIG9yIFBPU1NJQkxZX0RJVklTSU9OLnRlc3QgcmVnZXhcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBwcmV2WzBdIGluIE5PVF9SRUdFWFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgICAgICAgICBAZXJyb3IgJ21pc3NpbmcgLyAodW5jbG9zZWQgcmVnZXgpJyB1bmxlc3MgY2xvc2VkXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIDBcblxuICAgICAgICBbZmxhZ3NdID0gUkVHRVhfRkxBR1MuZXhlYyBAY2h1bmtbaW5kZXguLl1cbiAgICAgICAgZW5kID0gaW5kZXggKyBmbGFncy5sZW5ndGhcbiAgICAgICAgb3JpZ2luID0gQG1ha2VUb2tlbiAnUkVHRVgnLCBudWxsLCAwLCBlbmRcbiAgICAgICAgc3dpdGNoXG4gICAgICAgICAgICB3aGVuIG5vdCBWQUxJRF9GTEFHUy50ZXN0IGZsYWdzXG4gICAgICAgICAgICAgICAgQGVycm9yIFwiaW52YWxpZCByZWd1bGFyIGV4cHJlc3Npb24gZmxhZ3MgI3tmbGFnc31cIiwgb2Zmc2V0OiBpbmRleCwgbGVuZ3RoOiBmbGFncy5sZW5ndGhcbiAgICAgICAgICAgIHdoZW4gcmVnZXggb3IgdG9rZW5zLmxlbmd0aCBpcyAxXG4gICAgICAgICAgICAgICAgYm9keSA/PSBAZm9ybWF0SGVyZWdleCB0b2tlbnNbMF1bMV1cbiAgICAgICAgICAgICAgICBAdG9rZW4gJ1JFR0VYJywgXCIje0BtYWtlRGVsaW1pdGVkTGl0ZXJhbCBib2R5LCBkZWxpbWl0ZXI6ICcvJ30je2ZsYWdzfVwiLCAwLCBlbmQsIG9yaWdpblxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEB0b2tlbiAnUkVHRVhfU1RBUlQnLCAnKCcsIDAsIDAsIG9yaWdpblxuICAgICAgICAgICAgICAgIEB0b2tlbiAnSURFTlRJRklFUicsICdSZWdFeHAnLCAwLCAwXG4gICAgICAgICAgICAgICAgQHRva2VuICdDQUxMX1NUQVJUJywgJygnLCAwLCAwXG4gICAgICAgICAgICAgICAgQG1lcmdlSW50ZXJwb2xhdGlvblRva2VucyB0b2tlbnMsIHtkZWxpbWl0ZXI6ICdcIicsIGRvdWJsZTogeWVzfSwgQGZvcm1hdEhlcmVnZXhcbiAgICAgICAgICAgICAgICBpZiBmbGFnc1xuICAgICAgICAgICAgICAgICAgICBAdG9rZW4gJywnLCAnLCcsIGluZGV4IC0gMSwgMFxuICAgICAgICAgICAgICAgICAgICBAdG9rZW4gJ1NUUklORycsICdcIicgKyBmbGFncyArICdcIicsIGluZGV4IC0gMSwgZmxhZ3MubGVuZ3RoXG4gICAgICAgICAgICAgICAgQHRva2VuICcpJywgJyknLCBlbmQgLSAxLCAwXG4gICAgICAgICAgICAgICAgQHRva2VuICdSRUdFWF9FTkQnLCAnKScsIGVuZCAtIDEsIDBcblxuICAgICAgICBlbmRcblxuICAgICMgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgXG4gICAgXG4gICAgIyBNYXRjaGVzIG5ld2xpbmVzLCBpbmRlbnRzLCBhbmQgb3V0ZGVudHMsIGFuZCBkZXRlcm1pbmVzIHdoaWNoIGlzIHdoaWNoLlxuICAgICMgSWYgd2UgY2FuIGRldGVjdCB0aGF0IHRoZSBjdXJyZW50IGxpbmUgaXMgY29udGludWVkIG9udG8gdGhlIG5leHQgbGluZSxcbiAgICAjIHRoZW4gdGhlIG5ld2xpbmUgaXMgc3VwcHJlc3NlZDpcbiAgICAjXG4gICAgIyAgICAgICAgICAgZWxlbWVudHNcbiAgICAjICAgICAgICAgICAgICAgLmVhY2goIC4uLiApXG4gICAgIyAgICAgICAgICAgICAgIC5tYXAoIC4uLiApXG4gICAgI1xuICAgICMgS2VlcHMgdHJhY2sgb2YgdGhlIGxldmVsIG9mIGluZGVudGF0aW9uLCBiZWNhdXNlIGEgc2luZ2xlIG91dGRlbnQgdG9rZW5cbiAgICAjIGNhbiBjbG9zZSBtdWx0aXBsZSBpbmRlbnRzLCBzbyB3ZSBuZWVkIHRvIGtub3cgaG93IGZhciBpbiB3ZSBoYXBwZW4gdG8gYmUuXG4gICAgXG4gICAgbGluZVRva2VuOiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIDAgdW5sZXNzIG1hdGNoID0gTVVMVElfREVOVC5leGVjIEBjaHVua1xuICAgICAgICBpbmRlbnQgPSBtYXRjaFswXVxuXG4gICAgICAgIEBzZWVuRm9yICAgID0gbm9cbiAgICAgICAgQHNlZW5JbXBvcnQgPSBubyB1bmxlc3MgQGltcG9ydFNwZWNpZmllckxpc3RcbiAgICAgICAgQHNlZW5FeHBvcnQgPSBubyB1bmxlc3MgQGV4cG9ydFNwZWNpZmllckxpc3RcblxuICAgICAgICBzaXplID0gaW5kZW50Lmxlbmd0aCAtIDEgLSBpbmRlbnQubGFzdEluZGV4T2YgJ1xcbidcbiAgICAgICAgbm9OZXdsaW5lcyA9IEB1bmZpbmlzaGVkKClcblxuICAgICAgICBpZiBzaXplIC0gQGluZGVidCBpcyBAaW5kZW50XG4gICAgICAgICAgICBpZiBub05ld2xpbmVzIHRoZW4gQHN1cHByZXNzTmV3bGluZXMoKSBlbHNlIEBuZXdsaW5lVG9rZW4gMFxuICAgICAgICAgICAgcmV0dXJuIGluZGVudC5sZW5ndGhcblxuICAgICAgICBpZiBzaXplID4gQGluZGVudFxuICAgICAgICAgICAgaWYgbm9OZXdsaW5lc1xuICAgICAgICAgICAgICAgIEBpbmRlYnQgPSBzaXplIC0gQGluZGVudFxuICAgICAgICAgICAgICAgIEBzdXBwcmVzc05ld2xpbmVzKClcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5kZW50Lmxlbmd0aFxuICAgICAgICAgICAgdW5sZXNzIEB0b2tlbnMubGVuZ3RoXG4gICAgICAgICAgICAgICAgQGJhc2VJbmRlbnQgPSBAaW5kZW50ID0gc2l6ZVxuICAgICAgICAgICAgICAgIHJldHVybiBpbmRlbnQubGVuZ3RoXG4gICAgICAgICAgICBkaWZmID0gc2l6ZSAtIEBpbmRlbnQgKyBAb3V0ZGVidFxuICAgICAgICAgICAgQHRva2VuICdJTkRFTlQnLCBkaWZmLCBpbmRlbnQubGVuZ3RoIC0gc2l6ZSwgc2l6ZVxuICAgICAgICAgICAgQGluZGVudHMucHVzaCBkaWZmXG4gICAgICAgICAgICBAZW5kcy5wdXNoIHt0YWc6ICdPVVRERU5UJ31cbiAgICAgICAgICAgIEBvdXRkZWJ0ID0gQGluZGVidCA9IDBcbiAgICAgICAgICAgIEBpbmRlbnQgPSBzaXplXG4gICAgICAgIGVsc2UgaWYgc2l6ZSA8IEBiYXNlSW5kZW50XG4gICAgICAgICAgICBAZXJyb3IgJ21pc3NpbmcgaW5kZW50YXRpb24nLCBvZmZzZXQ6IGluZGVudC5sZW5ndGhcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGluZGVidCA9IDBcbiAgICAgICAgICAgIEBvdXRkZW50VG9rZW4gQGluZGVudCAtIHNpemUsIG5vTmV3bGluZXMsIGluZGVudC5sZW5ndGhcbiAgICAgICAgaW5kZW50Lmxlbmd0aFxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgIyBSZWNvcmQgYW4gb3V0ZGVudCB0b2tlbiBvciBtdWx0aXBsZSB0b2tlbnMsIGlmIHdlIGhhcHBlbiB0byBiZSBtb3ZpbmcgYmFja1xuICAgICMgaW53YXJkcyBwYXN0IHNldmVyYWwgcmVjb3JkZWQgaW5kZW50cy4gU2V0cyBuZXcgQGluZGVudCB2YWx1ZS5cbiAgICBcbiAgICBvdXRkZW50VG9rZW46IChtb3ZlT3V0LCBub05ld2xpbmVzLCBvdXRkZW50TGVuZ3RoKSAtPlxuICAgICAgICBcbiAgICAgICAgZGVjcmVhc2VkSW5kZW50ID0gQGluZGVudCAtIG1vdmVPdXRcbiAgICAgICAgd2hpbGUgbW92ZU91dCA+IDBcbiAgICAgICAgICAgIGxhc3RJbmRlbnQgPSBAaW5kZW50c1tAaW5kZW50cy5sZW5ndGggLSAxXVxuICAgICAgICAgICAgaWYgbm90IGxhc3RJbmRlbnRcbiAgICAgICAgICAgICAgICBtb3ZlT3V0ID0gMFxuICAgICAgICAgICAgZWxzZSBpZiBsYXN0SW5kZW50IGlzIEBvdXRkZWJ0XG4gICAgICAgICAgICAgICAgbW92ZU91dCAtPSBAb3V0ZGVidFxuICAgICAgICAgICAgICAgIEBvdXRkZWJ0ID0gMFxuICAgICAgICAgICAgZWxzZSBpZiBsYXN0SW5kZW50IDwgQG91dGRlYnRcbiAgICAgICAgICAgICAgICBAb3V0ZGVidCAtPSBsYXN0SW5kZW50XG4gICAgICAgICAgICAgICAgbW92ZU91dCAgLT0gbGFzdEluZGVudFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGRlbnQgPSBAaW5kZW50cy5wb3AoKSArIEBvdXRkZWJ0XG4gICAgICAgICAgICAgICAgaWYgb3V0ZGVudExlbmd0aCBhbmQgQGNodW5rW291dGRlbnRMZW5ndGhdIGluIElOREVOVEFCTEVfQ0xPU0VSU1xuICAgICAgICAgICAgICAgICAgICBkZWNyZWFzZWRJbmRlbnQgLT0gZGVudCAtIG1vdmVPdXRcbiAgICAgICAgICAgICAgICAgICAgbW92ZU91dCA9IGRlbnRcbiAgICAgICAgICAgICAgICBAb3V0ZGVidCA9IDBcbiAgICAgICAgICAgICAgICAjIHBhaXIgbWlnaHQgY2FsbCBvdXRkZW50VG9rZW4sIHNvIHByZXNlcnZlIGRlY3JlYXNlZEluZGVudFxuICAgICAgICAgICAgICAgIEBwYWlyICdPVVRERU5UJ1xuICAgICAgICAgICAgICAgIEB0b2tlbiAnT1VUREVOVCcsIG1vdmVPdXQsIDAsIG91dGRlbnRMZW5ndGhcbiAgICAgICAgICAgICAgICBtb3ZlT3V0IC09IGRlbnRcbiAgICAgICAgQG91dGRlYnQgLT0gbW92ZU91dCBpZiBkZW50XG4gICAgICAgIEB0b2tlbnMucG9wKCkgd2hpbGUgQHZhbHVlKCkgaXMgJzsnXG5cbiAgICAgICAgQHRva2VuICdURVJNSU5BVE9SJywgJ1xcbicsIG91dGRlbnRMZW5ndGgsIDAgdW5sZXNzIEB0YWcoKSBpcyAnVEVSTUlOQVRPUicgb3Igbm9OZXdsaW5lc1xuICAgICAgICBAaW5kZW50ID0gZGVjcmVhc2VkSW5kZW50XG4gICAgICAgIHRoaXNcblxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgICAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAgICAgIDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgICMgTWF0Y2hlcyBhbmQgY29uc3VtZXMgbm9uLW1lYW5pbmdmdWwgd2hpdGVzcGFjZS4gVGFnIHRoZSBwcmV2aW91cyB0b2tlblxuICAgICMgYXMgYmVpbmcg4oCcc3BhY2Vk4oCdLCBiZWNhdXNlIHRoZXJlIGFyZSBzb21lIGNhc2VzIHdoZXJlIGl0IG1ha2VzIGEgZGlmZmVyZW5jZS5cbiAgICBcbiAgICB3aGl0ZXNwYWNlVG9rZW46IC0+XG4gICAgICAgIHJldHVybiAwIHVubGVzcyAobWF0Y2ggPSBXSElURVNQQUNFLmV4ZWMgQGNodW5rKSBvciAobmxpbmUgPSBAY2h1bmsuY2hhckF0KDApIGlzICdcXG4nKVxuICAgICAgICBbLi4uLCBwcmV2XSA9IEB0b2tlbnNcbiAgICAgICAgcHJldltpZiBtYXRjaCB0aGVuICdzcGFjZWQnIGVsc2UgJ25ld0xpbmUnXSA9IHRydWUgaWYgcHJldlxuICAgICAgICBpZiBtYXRjaCB0aGVuIG1hdGNoWzBdLmxlbmd0aCBlbHNlIDBcblxuICAgICMgR2VuZXJhdGUgYSBuZXdsaW5lIHRva2VuLiBDb25zZWN1dGl2ZSBuZXdsaW5lcyBnZXQgbWVyZ2VkIHRvZ2V0aGVyLlxuICAgIFxuICAgIG5ld2xpbmVUb2tlbjogKG9mZnNldCkgLT5cbiAgICAgICAgQHRva2Vucy5wb3AoKSB3aGlsZSBAdmFsdWUoKSBpcyAnOydcbiAgICAgICAgQHRva2VuICdURVJNSU5BVE9SJywgJ1xcbicsIG9mZnNldCwgMCB1bmxlc3MgQHRhZygpIGlzICdURVJNSU5BVE9SJ1xuICAgICAgICB0aGlzXG5cbiAgICAjIFVzZSBhIGBcXGAgYXQgYSBsaW5lLWVuZGluZyB0byBzdXBwcmVzcyB0aGUgbmV3bGluZS5cbiAgICAjIFRoZSBzbGFzaCBpcyByZW1vdmVkIGhlcmUgb25jZSBpdHMgam9iIGlzIGRvbmUuXG4gICAgXG4gICAgc3VwcHJlc3NOZXdsaW5lczogLT5cbiAgICAgICAgQHRva2Vucy5wb3AoKSBpZiBAdmFsdWUoKSBpcyAnXFxcXCdcbiAgICAgICAgdGhpc1xuXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIFxuICAgICMgMDAwICAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAgICAgXG4gICAgIyAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICBcbiAgICAjIDAwMDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgIFxuICAgIFxuICAgICMgV2UgdHJlYXQgYWxsIG90aGVyIHNpbmdsZSBjaGFyYWN0ZXJzIGFzIGEgdG9rZW4uIEUuZy46IGAoICkgLCAuICFgXG4gICAgIyBNdWx0aS1jaGFyYWN0ZXIgb3BlcmF0b3JzIGFyZSBhbHNvIGxpdGVyYWwgdG9rZW5zLCBzbyB0aGF0IEppc29uIGNhbiBhc3NpZ25cbiAgICAjIHRoZSBwcm9wZXIgb3JkZXIgb2Ygb3BlcmF0aW9ucy4gVGhlcmUgYXJlIHNvbWUgc3ltYm9scyB0aGF0IHdlIHRhZyBzcGVjaWFsbHlcbiAgICAjIGhlcmUuIGA7YCBhbmQgbmV3bGluZXMgYXJlIGJvdGggdHJlYXRlZCBhcyBhIGBURVJNSU5BVE9SYCwgd2UgZGlzdGluZ3Vpc2hcbiAgICAjIHBhcmVudGhlc2VzIHRoYXQgaW5kaWNhdGUgYSBtZXRob2QgY2FsbCBmcm9tIHJlZ3VsYXIgcGFyZW50aGVzZXMsIGFuZCBzbyBvbi5cbiAgICBcbiAgICBsaXRlcmFsVG9rZW46IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBtYXRjaCA9IE9QRVJBVE9SLmV4ZWMgQGNodW5rXG4gICAgICAgICAgICBbdmFsdWVdID0gbWF0Y2hcbiAgICAgICAgICAgIEB0YWdQYXJhbWV0ZXJzKCkgaWYgQ09ERS50ZXN0IHZhbHVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHZhbHVlID0gQGNodW5rLmNoYXJBdCAwXG4gICAgICAgIHRhZyAgPSB2YWx1ZVxuICAgICAgICBbLi4uLCBwcmV2XSA9IEB0b2tlbnNcblxuICAgICAgICBpZiBwcmV2IGFuZCB2YWx1ZSBpbiBbJz0nLCBDT01QT1VORF9BU1NJR04uLi5dXG4gICAgICAgICAgICBza2lwVG9rZW4gPSBmYWxzZVxuICAgICAgICAgICAgaWYgdmFsdWUgaXMgJz0nIGFuZCBwcmV2WzFdIGluIFsnfHwnLCAnJiYnXSBhbmQgbm90IHByZXYuc3BhY2VkXG4gICAgICAgICAgICAgICAgcHJldlswXSA9ICdDT01QT1VORF9BU1NJR04nXG4gICAgICAgICAgICAgICAgcHJldlsxXSArPSAnPSdcbiAgICAgICAgICAgICAgICBwcmV2ID0gQHRva2Vuc1tAdG9rZW5zLmxlbmd0aCAtIDJdXG4gICAgICAgICAgICAgICAgc2tpcFRva2VuID0gdHJ1ZVxuICAgICAgICAgICAgaWYgcHJldiBhbmQgcHJldlswXSAhPSAnUFJPUEVSVFknXG4gICAgICAgICAgICAgICAgb3JpZ2luID0gcHJldi5vcmlnaW4gPyBwcmV2XG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IGlzVW5hc3NpZ25hYmxlIHByZXZbMV0sIG9yaWdpblsxXVxuICAgICAgICAgICAgICAgIEBlcnJvciBtZXNzYWdlLCBvcmlnaW5bMl0gaWYgbWVzc2FnZVxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlLmxlbmd0aCBpZiBza2lwVG9rZW5cblxuICAgICAgICBpZiB2YWx1ZSBpcyAneycgYW5kIEBzZWVuSW1wb3J0XG4gICAgICAgICAgICBAaW1wb3J0U3BlY2lmaWVyTGlzdCA9IHllc1xuICAgICAgICBlbHNlIGlmIEBpbXBvcnRTcGVjaWZpZXJMaXN0IGFuZCB2YWx1ZSBpcyAnfSdcbiAgICAgICAgICAgIEBpbXBvcnRTcGVjaWZpZXJMaXN0ID0gbm9cbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpcyAneycgYW5kIHByZXY/WzBdIGlzICdFWFBPUlQnXG4gICAgICAgICAgICBAZXhwb3J0U3BlY2lmaWVyTGlzdCA9IHllc1xuICAgICAgICBlbHNlIGlmIEBleHBvcnRTcGVjaWZpZXJMaXN0IGFuZCB2YWx1ZSBpcyAnfSdcbiAgICAgICAgICAgIEBleHBvcnRTcGVjaWZpZXJMaXN0ID0gbm9cblxuICAgICAgICBpZiB2YWx1ZSBpcyAnOydcbiAgICAgICAgICAgIEBzZWVuRm9yID0gQHNlZW5JbXBvcnQgPSBAc2VlbkV4cG9ydCA9IG5vXG4gICAgICAgICAgICB0YWcgPSAnVEVSTUlOQVRPUidcbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpcyAnKicgYW5kIHByZXZbMF0gaXMgJ0VYUE9SVCdcbiAgICAgICAgICAgIHRhZyA9ICdFWFBPUlRfQUxMJ1xuICAgICAgICBlbHNlIGlmIHZhbHVlIGluIE1BVEggICAgICAgICAgICAgICAgICAgdGhlbiB0YWcgPSAnTUFUSCdcbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpbiBDT01QQVJFICAgICAgICAgICAgICAgIHRoZW4gdGFnID0gJ0NPTVBBUkUnXG4gICAgICAgIGVsc2UgaWYgdmFsdWUgaW4gQ09NUE9VTkRfQVNTSUdOICAgICAgICB0aGVuIHRhZyA9ICdDT01QT1VORF9BU1NJR04nXG4gICAgICAgIGVsc2UgaWYgdmFsdWUgaW4gVU5BUlkgICAgICAgICAgICAgICAgICB0aGVuIHRhZyA9ICdVTkFSWSdcbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpbiBVTkFSWV9NQVRIICAgICAgICAgICAgIHRoZW4gdGFnID0gJ1VOQVJZX01BVEgnXG4gICAgICAgIGVsc2UgaWYgdmFsdWUgaW4gU0hJRlQgICAgICAgICAgICAgICAgICB0aGVuIHRhZyA9ICdTSElGVCdcbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpcyAnPycgYW5kIHByZXY/LnNwYWNlZCAgIHRoZW4gdGFnID0gJ0JJTj8nXG4gICAgICAgIGVsc2UgaWYgcHJldiBhbmQgbm90IHByZXYuc3BhY2VkXG4gICAgICAgICAgICBpZiB2YWx1ZSBpcyAnKCcgYW5kIHByZXZbMF0gaW4gQ0FMTEFCTEVcbiAgICAgICAgICAgICAgICBwcmV2WzBdID0gJ0ZVTkNfRVhJU1QnIGlmIHByZXZbMF0gaXMgJz8nXG4gICAgICAgICAgICAgICAgdGFnID0gJ0NBTExfU1RBUlQnXG4gICAgICAgICAgICBlbHNlIGlmIHZhbHVlIGlzICdbJyBhbmQgcHJldlswXSBpbiBJTkRFWEFCTEVcbiAgICAgICAgICAgICAgICB0YWcgPSAnSU5ERVhfU1RBUlQnXG4gICAgICAgICAgICAgICAgc3dpdGNoIHByZXZbMF1cbiAgICAgICAgICAgICAgICAgICAgd2hlbiAnPycgICAgdGhlbiBwcmV2WzBdID0gJ0lOREVYX1NPQUsnXG4gICAgICAgIHRva2VuID0gQG1ha2VUb2tlbiB0YWcsIHZhbHVlXG4gICAgICAgIHN3aXRjaCB2YWx1ZVxuICAgICAgICAgICAgd2hlbiAnKCcsICd7JywgJ1snIHRoZW4gQGVuZHMucHVzaCB7dGFnOiBSZXdyaXRlci5JTlZFUlNFU1t2YWx1ZV0sIG9yaWdpbjogdG9rZW59XG4gICAgICAgICAgICB3aGVuICcpJywgJ30nLCAnXScgdGhlbiBAcGFpciB2YWx1ZVxuICAgICAgICBAdG9rZW5zLnB1c2ggdG9rZW5cbiAgICAgICAgdmFsdWUubGVuZ3RoXG5cbiAgICAjIyNcbiAgICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICBcbiAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICBcbiAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICBcbiAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICAjIyNcbiAgICBcbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgICMgQSBzb3VyY2Ugb2YgYW1iaWd1aXR5IGluIG91ciBncmFtbWFyIHVzZWQgdG8gYmUgcGFyYW1ldGVyIGxpc3RzIGluIGZ1bmN0aW9uXG4gICAgIyBkZWZpbml0aW9ucyB2ZXJzdXMgYXJndW1lbnQgbGlzdHMgaW4gZnVuY3Rpb24gY2FsbHMuIFdhbGsgYmFja3dhcmRzLCB0YWdnaW5nXG4gICAgIyBwYXJhbWV0ZXJzIHNwZWNpYWxseSBpbiBvcmRlciB0byBtYWtlIHRoaW5ncyBlYXNpZXIgZm9yIHRoZSBwYXJzZXIuXG4gICAgICAgIFxuICAgIHRhZ1BhcmFtZXRlcnM6IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcyBpZiBAdGFnKCkgIT0gJyknXG4gICAgICAgIHN0YWNrID0gW11cbiAgICAgICAge3Rva2Vuc30gPSB0aGlzXG4gICAgICAgIGkgPSB0b2tlbnMubGVuZ3RoXG4gICAgICAgIHRva2Vuc1stLWldWzBdID0gJ1BBUkFNX0VORCdcbiAgICAgICAgd2hpbGUgdG9rID0gdG9rZW5zWy0taV1cbiAgICAgICAgICAgIHN3aXRjaCB0b2tbMF1cbiAgICAgICAgICAgICAgICB3aGVuICcpJ1xuICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoIHRva1xuICAgICAgICAgICAgICAgIHdoZW4gJygnLCAnQ0FMTF9TVEFSVCdcbiAgICAgICAgICAgICAgICAgICAgaWYgc3RhY2subGVuZ3RoIHRoZW4gc3RhY2sucG9wKClcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiB0b2tbMF0gaXMgJygnXG4gICAgICAgICAgICAgICAgICAgICAgICB0b2tbMF0gPSAnUEFSQU1fU1RBUlQnXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1xuICAgICAgICAgICAgICAgICAgICBlbHNlIHJldHVybiB0aGlzXG4gICAgICAgIHRoaXNcblxuICAgICMgQ2xvc2UgdXAgYWxsIHJlbWFpbmluZyBvcGVuIGJsb2NrcyBhdCB0aGUgZW5kIG9mIHRoZSBmaWxlLlxuICAgIFxuICAgIGNsb3NlSW5kZW50YXRpb246IC0+IEBvdXRkZW50VG9rZW4gQGluZGVudFxuXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgICMgTWF0Y2ggdGhlIGNvbnRlbnRzIG9mIGEgZGVsaW1pdGVkIHRva2VuIGFuZCBleHBhbmQgdmFyaWFibGVzIGFuZCBleHByZXNzaW9uc1xuICAgICMgaW5zaWRlIGl0IHVzaW5nIFJ1YnktbGlrZSBub3RhdGlvbiBmb3Igc3Vic3RpdHV0aW9uIG9mIGFyYml0cmFyeSBleHByZXNzaW9ucy5cbiAgICAjXG4gICAgIyAgICBcIkhlbGxvICN7bmFtZS5jYXBpdGFsaXplKCl9LlwiXG4gICAgI1xuICAgICMgSWYgaXQgZW5jb3VudGVycyBhbiBpbnRlcnBvbGF0aW9uLCB0aGlzIG1ldGhvZCB3aWxsIHJlY3Vyc2l2ZWx5IGNyZWF0ZSBhIG5ld1xuICAgICMgTGV4ZXIgYW5kIHRva2VuaXplIHVudGlsIHRoZSBge2Agb2YgYCN7YCBpcyBiYWxhbmNlZCB3aXRoIGEgYH1gLlxuICAgICNcbiAgICAjICAgIC0gYHJlZ2V4YCBtYXRjaGVzIHRoZSBjb250ZW50cyBvZiBhIHRva2VuIChidXQgbm90IGBkZWxpbWl0ZXJgLCBhbmQgbm90XG4gICAgIyAgICAgICAgYCN7YCBpZiBpbnRlcnBvbGF0aW9ucyBhcmUgZGVzaXJlZCkuXG4gICAgIyAgICAtIGBkZWxpbWl0ZXJgIGlzIHRoZSBkZWxpbWl0ZXIgb2YgdGhlIHRva2VuLiBFeGFtcGxlcyBhcmUgYCdgLCBgXCJgLCBgJycnYCxcbiAgICAjICAgICAgICBgXCJcIlwiYCBhbmQgYC8vL2AuXG4gICAgI1xuICAgICMgVGhpcyBtZXRob2QgYWxsb3dzIHVzIHRvIGhhdmUgc3RyaW5ncyB3aXRoaW4gaW50ZXJwb2xhdGlvbnMgd2l0aGluIHN0cmluZ3MsIGFkIGluZmluaXR1bS5cbiAgICBcbiAgICBtYXRjaFdpdGhJbnRlcnBvbGF0aW9uczogKHJlZ2V4LCBkZWxpbWl0ZXIpIC0+XG4gICAgICAgIFxuICAgICAgICB0b2tlbnMgPSBbXVxuICAgICAgICBvZmZzZXRJbkNodW5rID0gZGVsaW1pdGVyLmxlbmd0aFxuICAgICAgICByZXR1cm4gbnVsbCB1bmxlc3MgQGNodW5rWy4uLm9mZnNldEluQ2h1bmtdIGlzIGRlbGltaXRlclxuICAgICAgICBzdHIgPSBAY2h1bmtbb2Zmc2V0SW5DaHVuay4uXVxuICAgICAgICBsb29wXG4gICAgICAgICAgICBbc3RyUGFydF0gPSByZWdleC5leGVjIHN0clxuXG4gICAgICAgICAgICBAdmFsaWRhdGVFc2NhcGVzIHN0clBhcnQsIHtpc1JlZ2V4OiBkZWxpbWl0ZXIuY2hhckF0KDApIGlzICcvJywgb2Zmc2V0SW5DaHVua31cblxuICAgICAgICAgICAgIyBQdXNoIGEgZmFrZSAnTkVPU1RSSU5HJyB0b2tlbiwgd2hpY2ggd2lsbCBnZXQgdHVybmVkIGludG8gYSByZWFsIHN0cmluZyBsYXRlci5cbiAgICAgICAgICAgIHRva2Vucy5wdXNoIEBtYWtlVG9rZW4gJ05FT1NUUklORycsIHN0clBhcnQsIG9mZnNldEluQ2h1bmtcblxuICAgICAgICAgICAgc3RyID0gc3RyW3N0clBhcnQubGVuZ3RoLi5dXG4gICAgICAgICAgICBvZmZzZXRJbkNodW5rICs9IHN0clBhcnQubGVuZ3RoXG5cbiAgICAgICAgICAgIGJyZWFrIHVubGVzcyBzdHJbLi4uMl0gaXMgJyN7J1xuXG4gICAgICAgICAgICAjIFRoZSBgMWBzIGFyZSB0byByZW1vdmUgdGhlIGAjYCBpbiBgI3tgLlxuICAgICAgICAgICAgW2xpbmUsIGNvbHVtbl0gPSBAZ2V0TGluZUFuZENvbHVtbkZyb21DaHVuayBvZmZzZXRJbkNodW5rICsgMVxuICAgICAgICAgICAge3Rva2VuczogbmVzdGVkLCBpbmRleH0gPVxuICAgICAgICAgICAgICAgIG5ldyBMZXhlcigpLnRva2VuaXplIHN0clsxLi5dLCBsaW5lOiBsaW5lLCBjb2x1bW46IGNvbHVtbiwgdW50aWxCYWxhbmNlZDogb25cbiAgICAgICAgICAgICMgU2tpcCB0aGUgdHJhaWxpbmcgYH1gLlxuICAgICAgICAgICAgaW5kZXggKz0gMVxuXG4gICAgICAgICAgICAjIFR1cm4gdGhlIGxlYWRpbmcgYW5kIHRyYWlsaW5nIGB7YCBhbmQgYH1gIGludG8gcGFyZW50aGVzZXMuIFVubmVjZXNzYXJ5XG4gICAgICAgICAgICAjIHBhcmVudGhlc2VzIHdpbGwgYmUgcmVtb3ZlZCBsYXRlci5cbiAgICAgICAgICAgIFtvcGVuLCAuLi4sIGNsb3NlXSA9IG5lc3RlZFxuICAgICAgICAgICAgb3BlblswXSAgPSBvcGVuWzFdICA9ICcoJ1xuICAgICAgICAgICAgY2xvc2VbMF0gPSBjbG9zZVsxXSA9ICcpJ1xuICAgICAgICAgICAgY2xvc2Uub3JpZ2luID0gWycnLCAnZW5kIG9mIGludGVycG9sYXRpb24nLCBjbG9zZVsyXV1cblxuICAgICAgICAgICAgIyBSZW1vdmUgbGVhZGluZyAnVEVSTUlOQVRPUicgKGlmIGFueSkuXG4gICAgICAgICAgICBuZXN0ZWQuc3BsaWNlIDEsIDEgaWYgbmVzdGVkWzFdP1swXSBpcyAnVEVSTUlOQVRPUidcblxuICAgICAgICAgICAgIyBQdXNoIGEgZmFrZSAnVE9LRU5TJyB0b2tlbiwgd2hpY2ggd2lsbCBnZXQgdHVybmVkIGludG8gcmVhbCB0b2tlbnMgbGF0ZXIuXG4gICAgICAgICAgICB0b2tlbnMucHVzaCBbJ1RPS0VOUycsIG5lc3RlZF1cblxuICAgICAgICAgICAgc3RyID0gc3RyW2luZGV4Li5dXG4gICAgICAgICAgICBvZmZzZXRJbkNodW5rICs9IGluZGV4XG5cbiAgICAgICAgdW5sZXNzIHN0clsuLi5kZWxpbWl0ZXIubGVuZ3RoXSBpcyBkZWxpbWl0ZXJcbiAgICAgICAgICAgIEBlcnJvciBcIm1pc3NpbmcgI3tkZWxpbWl0ZXJ9XCIsIGxlbmd0aDogZGVsaW1pdGVyLmxlbmd0aFxuXG4gICAgICAgIFtmaXJzdFRva2VuLCAuLi4sIGxhc3RUb2tlbl0gPSB0b2tlbnNcbiAgICAgICAgZmlyc3RUb2tlblsyXS5maXJzdF9jb2x1bW4gLT0gZGVsaW1pdGVyLmxlbmd0aFxuICAgICAgICBpZiBsYXN0VG9rZW5bMV0uc3Vic3RyKC0xKSBpcyAnXFxuJ1xuICAgICAgICAgICAgbGFzdFRva2VuWzJdLmxhc3RfbGluZSArPSAxXG4gICAgICAgICAgICBsYXN0VG9rZW5bMl0ubGFzdF9jb2x1bW4gPSBkZWxpbWl0ZXIubGVuZ3RoIC0gMVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBsYXN0VG9rZW5bMl0ubGFzdF9jb2x1bW4gKz0gZGVsaW1pdGVyLmxlbmd0aFxuICAgICAgICBsYXN0VG9rZW5bMl0ubGFzdF9jb2x1bW4gLT0gMSBpZiBsYXN0VG9rZW5bMV0ubGVuZ3RoIGlzIDBcblxuICAgICAgICB7dG9rZW5zLCBpbmRleDogb2Zmc2V0SW5DaHVuayArIGRlbGltaXRlci5sZW5ndGh9XG5cbiAgICAjIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgIDAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgIFxuICAgICMgTWVyZ2UgdGhlIGFycmF5IGB0b2tlbnNgIG9mIHRoZSBmYWtlIHRva2VuIHR5cGVzICdUT0tFTlMnIGFuZCAnTkVPU1RSSU5HJyAgKGFzIHJldHVybmVkIGJ5IGBtYXRjaFdpdGhJbnRlcnBvbGF0aW9uc2ApIGludG8gdGhlIHRva2VuIHN0cmVhbS4gXG4gICAgIyBUaGUgdmFsdWUgb2YgJ05FT1NUUklORydzIGFyZSBjb252ZXJ0ZWQgdXNpbmcgYGZuYCBhbmQgdHVybmVkIGludG8gc3RyaW5ncyB1c2luZyBgb3B0aW9uc2AgZmlyc3QuXG4gICAgXG4gICAgbWVyZ2VJbnRlcnBvbGF0aW9uVG9rZW5zOiAodG9rZW5zLCBvcHRpb25zLCBmbikgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIHRva2Vucy5sZW5ndGggPiAxXG4gICAgICAgICAgICBscGFyZW4gPSBAdG9rZW4gJ1NUUklOR19TVEFSVCcsICcoJywgMCwgMFxuXG4gICAgICAgIGZpcnN0SW5kZXggPSBAdG9rZW5zLmxlbmd0aFxuICAgICAgICBmb3IgdG9rZW4sIGkgaW4gdG9rZW5zXG4gICAgICAgICAgICBbdGFnLCB2YWx1ZV0gPSB0b2tlblxuICAgICAgICAgICAgc3dpdGNoIHRhZ1xuICAgICAgICAgICAgICAgIHdoZW4gJ1RPS0VOUydcbiAgICAgICAgICAgICAgICAgICAgIyBPcHRpbWl6ZSBvdXQgZW1wdHkgaW50ZXJwb2xhdGlvbnMgKGFuIGVtcHR5IHBhaXIgb2YgcGFyZW50aGVzZXMpLlxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZSBpZiB2YWx1ZS5sZW5ndGggaXMgMlxuICAgICAgICAgICAgICAgICAgICAjIFB1c2ggYWxsIHRoZSB0b2tlbnMgaW4gdGhlIGZha2UgJ1RPS0VOUycgdG9rZW4uIFxuICAgICAgICAgICAgICAgICAgICAjIFRoZXNlIGFscmVhZHkgaGF2ZSBzYW5lIGxvY2F0aW9uIGRhdGEuXG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uVG9rZW4gPSB2YWx1ZVswXVxuICAgICAgICAgICAgICAgICAgICB0b2tlbnNUb1B1c2ggPSB2YWx1ZVxuICAgICAgICAgICAgICAgIHdoZW4gJ05FT1NUUklORydcbiAgICAgICAgICAgICAgICAgICAgIyBDb252ZXJ0ICdORU9TVFJJTkcnIGludG8gJ1NUUklORycuXG4gICAgICAgICAgICAgICAgICAgIGNvbnZlcnRlZCA9IGZuLmNhbGwgdGhpcywgdG9rZW5bMV0sIGlcbiAgICAgICAgICAgICAgICAgICAgIyBPcHRpbWl6ZSBvdXQgZW1wdHkgc3RyaW5ncy4gV2UgZW5zdXJlIHRoYXQgdGhlIHRva2VucyBzdHJlYW0gYWx3YXlzXG4gICAgICAgICAgICAgICAgICAgICMgc3RhcnRzIHdpdGggYSBzdHJpbmcgdG9rZW4sIHRob3VnaCwgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIHJlc3VsdFxuICAgICAgICAgICAgICAgICAgICAjIHJlYWxseSBpcyBhIHN0cmluZy5cbiAgICAgICAgICAgICAgICAgICAgaWYgY29udmVydGVkLmxlbmd0aCBpcyAwXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBpIGlzIDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaXJzdEVtcHR5U3RyaW5nSW5kZXggPSBAdG9rZW5zLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgICAgICMgSG93ZXZlciwgdGhlcmUgaXMgb25lIGNhc2Ugd2hlcmUgd2UgY2FuIG9wdGltaXplIGF3YXkgYSBzdGFydGluZyBlbXB0eSBzdHJpbmcuXG4gICAgICAgICAgICAgICAgICAgIGlmIGkgaXMgMiBhbmQgZmlyc3RFbXB0eVN0cmluZ0luZGV4P1xuICAgICAgICAgICAgICAgICAgICAgICAgQHRva2Vucy5zcGxpY2UgZmlyc3RFbXB0eVN0cmluZ0luZGV4LCAyICMgUmVtb3ZlIGVtcHR5IHN0cmluZyBhbmQgdGhlIHBsdXMuXG4gICAgICAgICAgICAgICAgICAgIHRva2VuWzBdID0gJ1NUUklORydcbiAgICAgICAgICAgICAgICAgICAgdG9rZW5bMV0gPSBAbWFrZURlbGltaXRlZExpdGVyYWwgY29udmVydGVkLCBvcHRpb25zXG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uVG9rZW4gPSB0b2tlblxuICAgICAgICAgICAgICAgICAgICB0b2tlbnNUb1B1c2ggPSBbdG9rZW5dXG4gICAgICAgICAgICBpZiBAdG9rZW5zLmxlbmd0aCA+IGZpcnN0SW5kZXhcbiAgICAgICAgICAgICAgICAjIENyZWF0ZSBhIDAtbGVuZ3RoIFwiK1wiIHRva2VuLlxuICAgICAgICAgICAgICAgIHBsdXNUb2tlbiA9IEB0b2tlbiAnKycsICcrJ1xuICAgICAgICAgICAgICAgIHBsdXNUb2tlblsyXSA9XG4gICAgICAgICAgICAgICAgICAgIGZpcnN0X2xpbmU6ICAgbG9jYXRpb25Ub2tlblsyXS5maXJzdF9saW5lXG4gICAgICAgICAgICAgICAgICAgIGZpcnN0X2NvbHVtbjogbG9jYXRpb25Ub2tlblsyXS5maXJzdF9jb2x1bW5cbiAgICAgICAgICAgICAgICAgICAgbGFzdF9saW5lOiAgICBsb2NhdGlvblRva2VuWzJdLmZpcnN0X2xpbmVcbiAgICAgICAgICAgICAgICAgICAgbGFzdF9jb2x1bW46ICBsb2NhdGlvblRva2VuWzJdLmZpcnN0X2NvbHVtblxuICAgICAgICAgICAgQHRva2Vucy5wdXNoIHRva2Vuc1RvUHVzaC4uLlxuXG4gICAgICAgIGlmIGxwYXJlblxuICAgICAgICAgICAgWy4uLiwgbGFzdFRva2VuXSA9IHRva2Vuc1xuICAgICAgICAgICAgbHBhcmVuLm9yaWdpbiA9IFsnU1RSSU5HJywgbnVsbCxcbiAgICAgICAgICAgICAgICBmaXJzdF9saW5lOiAgIGxwYXJlblsyXS5maXJzdF9saW5lXG4gICAgICAgICAgICAgICAgZmlyc3RfY29sdW1uOiBscGFyZW5bMl0uZmlyc3RfY29sdW1uXG4gICAgICAgICAgICAgICAgbGFzdF9saW5lOiAgICBsYXN0VG9rZW5bMl0ubGFzdF9saW5lXG4gICAgICAgICAgICAgICAgbGFzdF9jb2x1bW46ICBsYXN0VG9rZW5bMl0ubGFzdF9jb2x1bW5cbiAgICAgICAgICAgIF1cbiAgICAgICAgICAgIHJwYXJlbiA9IEB0b2tlbiAnU1RSSU5HX0VORCcsICcpJ1xuICAgICAgICAgICAgcnBhcmVuWzJdID1cbiAgICAgICAgICAgICAgICBmaXJzdF9saW5lOiAgIGxhc3RUb2tlblsyXS5sYXN0X2xpbmVcbiAgICAgICAgICAgICAgICBmaXJzdF9jb2x1bW46IGxhc3RUb2tlblsyXS5sYXN0X2NvbHVtblxuICAgICAgICAgICAgICAgIGxhc3RfbGluZTogICAgbGFzdFRva2VuWzJdLmxhc3RfbGluZVxuICAgICAgICAgICAgICAgIGxhc3RfY29sdW1uOiAgbGFzdFRva2VuWzJdLmxhc3RfY29sdW1uXG5cbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgICMgUGFpcnMgdXAgYSBjbG9zaW5nIHRva2VuLCBlbnN1cmluZyB0aGF0IGFsbCBsaXN0ZWQgcGFpcnMgb2YgdG9rZW5zIGFyZVxuICAgICMgY29ycmVjdGx5IGJhbGFuY2VkIHRocm91Z2hvdXQgdGhlIGNvdXJzZSBvZiB0aGUgdG9rZW4gc3RyZWFtLlxuICAgIFxuICAgIHBhaXI6ICh0YWcpIC0+XG4gICAgICAgIFxuICAgICAgICBbLi4uLCBwcmV2XSA9IEBlbmRzXG4gICAgICAgIHVubGVzcyB0YWcgaXMgd2FudGVkID0gcHJldj8udGFnXG4gICAgICAgICAgICBAZXJyb3IgXCJ1bm1hdGNoZWQgI3t0YWd9XCIgdW5sZXNzICdPVVRERU5UJyBpcyB3YW50ZWRcbiAgICAgICAgICAgICMgQXV0by1jbG9zZSBJTkRFTlQgdG8gc3VwcG9ydCBzeW50YXggbGlrZSB0aGlzOlxuICAgICAgICAgICAgI1xuICAgICAgICAgICAgIyAgICAgZWwuY2xpY2soKGV2ZW50KSAtPlxuICAgICAgICAgICAgIyAgICAgICAgIGVsLmhpZGUoKSlcbiAgICAgICAgICAgIFsuLi4sIGxhc3RJbmRlbnRdID0gQGluZGVudHNcbiAgICAgICAgICAgIEBvdXRkZW50VG9rZW4gbGFzdEluZGVudCwgdHJ1ZVxuICAgICAgICAgICAgcmV0dXJuIEBwYWlyIHRhZ1xuICAgICAgICBAZW5kcy5wb3AoKVxuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuXG4gICAgIyBSZXR1cm5zIHRoZSBsaW5lIGFuZCBjb2x1bW4gbnVtYmVyIGZyb20gYW4gb2Zmc2V0IGludG8gdGhlIGN1cnJlbnQgY2h1bmsuXG4gICAgI1xuICAgICMgYG9mZnNldGAgaXMgYSBudW1iZXIgb2YgY2hhcmFjdGVycyBpbnRvIEBjaHVuay5cbiAgICBcbiAgICBnZXRMaW5lQW5kQ29sdW1uRnJvbUNodW5rOiAob2Zmc2V0KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgb2Zmc2V0IGlzIDBcbiAgICAgICAgICAgIHJldHVybiBbQGNodW5rTGluZSwgQGNodW5rQ29sdW1uXVxuXG4gICAgICAgIGlmIG9mZnNldCA+PSBAY2h1bmsubGVuZ3RoXG4gICAgICAgICAgICBzdHJpbmcgPSBAY2h1bmtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgc3RyaW5nID0gQGNodW5rWy4ub2Zmc2V0LTFdXG5cbiAgICAgICAgbGluZUNvdW50ID0gY291bnQgc3RyaW5nLCAnXFxuJ1xuXG4gICAgICAgIGNvbHVtbiA9IEBjaHVua0NvbHVtblxuICAgICAgICBpZiBsaW5lQ291bnQgPiAwXG4gICAgICAgICAgICBbLi4uLCBsYXN0TGluZV0gPSBzdHJpbmcuc3BsaXQgJ1xcbidcbiAgICAgICAgICAgIGNvbHVtbiA9IGxhc3RMaW5lLmxlbmd0aFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBjb2x1bW4gKz0gc3RyaW5nLmxlbmd0aFxuXG4gICAgICAgIFtAY2h1bmtMaW5lICsgbGluZUNvdW50LCBjb2x1bW5dXG5cbiAgICAjIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMDAgIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwIDAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMDAgIFxuICAgICMgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgIyBTYW1lIGFzIFwidG9rZW5cIiwgZXhjZXB0aW9uIHRoaXMganVzdCByZXR1cm5zIHRoZSB0b2tlbiB3aXRob3V0IGFkZGluZyBpdCB0byB0aGUgcmVzdWx0cy5cbiAgICBcbiAgICBtYWtlVG9rZW46ICh0YWcsIHZhbHVlLCBvZmZzZXRJbkNodW5rID0gMCwgbGVuZ3RoID0gdmFsdWUubGVuZ3RoKSAtPlxuICAgICAgICBcbiAgICAgICAgbG9jYXRpb25EYXRhID0ge31cbiAgICAgICAgW2xvY2F0aW9uRGF0YS5maXJzdF9saW5lLCBsb2NhdGlvbkRhdGEuZmlyc3RfY29sdW1uXSA9XG4gICAgICAgICAgICBAZ2V0TGluZUFuZENvbHVtbkZyb21DaHVuayBvZmZzZXRJbkNodW5rXG5cbiAgICAgICAgIyBVc2UgbGVuZ3RoIC0gMSBmb3IgdGhlIGZpbmFsIG9mZnNldCAtIHdlJ3JlIHN1cHBseWluZyB0aGUgbGFzdF9saW5lIGFuZCB0aGUgbGFzdF9jb2x1bW4sXG4gICAgICAgICMgc28gaWYgbGFzdF9jb2x1bW4gPT0gZmlyc3RfY29sdW1uLCB0aGVuIHdlJ3JlIGxvb2tpbmcgYXQgYSBjaGFyYWN0ZXIgb2YgbGVuZ3RoIDEuXG4gICAgICAgIGxhc3RDaGFyYWN0ZXIgPSBpZiBsZW5ndGggPiAwIHRoZW4gKGxlbmd0aCAtIDEpIGVsc2UgMFxuICAgICAgICBbbG9jYXRpb25EYXRhLmxhc3RfbGluZSwgbG9jYXRpb25EYXRhLmxhc3RfY29sdW1uXSA9XG4gICAgICAgICAgICBAZ2V0TGluZUFuZENvbHVtbkZyb21DaHVuayBvZmZzZXRJbkNodW5rICsgbGFzdENoYXJhY3RlclxuXG4gICAgICAgIHRva2VuID0gW3RhZywgdmFsdWUsIGxvY2F0aW9uRGF0YV1cblxuICAgICAgICB0b2tlblxuXG4gICAgIyBBZGQgYSB0b2tlbiB0byB0aGUgcmVzdWx0cy5cbiAgICAjIGBvZmZzZXRgIGlzIHRoZSBvZmZzZXQgaW50byB0aGUgY3VycmVudCBAY2h1bmsgd2hlcmUgdGhlIHRva2VuIHN0YXJ0cy5cbiAgICAjIGBsZW5ndGhgIGlzIHRoZSBsZW5ndGggb2YgdGhlIHRva2VuIGluIHRoZSBAY2h1bmssIGFmdGVyIHRoZSBvZmZzZXQuICBcbiAgICAjIElmIG5vdCBzcGVjaWZpZWQsIHRoZSBsZW5ndGggb2YgYHZhbHVlYCB3aWxsIGJlIHVzZWQuIFJldHVybnMgdGhlIG5ldyB0b2tlbi5cbiAgICBcbiAgICB0b2tlbjogKHRhZywgdmFsdWUsIG9mZnNldEluQ2h1bmssIGxlbmd0aCwgb3JpZ2luKSAtPlxuICAgICAgICBcbiAgICAgICAgdG9rZW4gPSBAbWFrZVRva2VuIHRhZywgdmFsdWUsIG9mZnNldEluQ2h1bmssIGxlbmd0aFxuICAgICAgICB0b2tlbi5vcmlnaW4gPSBvcmlnaW4gaWYgb3JpZ2luXG4gICAgICAgIEB0b2tlbnMucHVzaCB0b2tlblxuICAgICAgICB0b2tlblxuXG4gICAgdGFnOiAtPiAjIFBlZWsgYXQgdGhlIGxhc3QgdGFnIGluIHRoZSB0b2tlbiBzdHJlYW0uXG4gICAgICAgIFxuICAgICAgICBbLi4uLCB0b2tlbl0gPSBAdG9rZW5zXG4gICAgICAgIHRva2VuP1swXVxuXG4gICAgdmFsdWU6IC0+ICMgUGVlayBhdCB0aGUgbGFzdCB2YWx1ZSBpbiB0aGUgdG9rZW4gc3RyZWFtLlxuICAgICAgICBcbiAgICAgICAgWy4uLiwgdG9rZW5dID0gQHRva2Vuc1xuICAgICAgICB0b2tlbj9bMV1cblxuICAgIHVuZmluaXNoZWQ6IC0+ICMgQXJlIHdlIGluIHRoZSBtaWRzdCBvZiBhbiB1bmZpbmlzaGVkIGV4cHJlc3Npb24/XG4gICAgICAgIFxuICAgICAgICBMSU5FX0NPTlRJTlVFUi50ZXN0KEBjaHVuaykgb3JcbiAgICAgICAgQHRhZygpIGluIFVORklOSVNIRURcblxuICAgIGZvcm1hdFN0cmluZzogKHN0ciwgb3B0aW9ucykgLT5cbiAgICAgICAgXG4gICAgICAgIEByZXBsYWNlVW5pY29kZUNvZGVQb2ludEVzY2FwZXMgc3RyLnJlcGxhY2UoU1RSSU5HX09NSVQsICckMScpLCBvcHRpb25zXG5cbiAgICBmb3JtYXRIZXJlZ2V4OiAoc3RyKSAtPlxuICAgICAgICBcbiAgICAgICAgQGZvcm1hdFJlZ2V4IHN0ci5yZXBsYWNlKEhFUkVHRVhfT01JVCwgJyQxJDInKSwgZGVsaW1pdGVyOiAnLy8vJ1xuXG4gICAgZm9ybWF0UmVnZXg6IChzdHIsIG9wdGlvbnMpIC0+XG4gICAgICAgIFxuICAgICAgICBAcmVwbGFjZVVuaWNvZGVDb2RlUG9pbnRFc2NhcGVzIHN0ciwgb3B0aW9uc1xuXG4gICAgdW5pY29kZUNvZGVQb2ludFRvVW5pY29kZUVzY2FwZXM6IChjb2RlUG9pbnQpIC0+XG4gICAgICAgIFxuICAgICAgICB0b1VuaWNvZGVFc2NhcGUgPSAodmFsKSAtPlxuICAgICAgICAgICAgc3RyID0gdmFsLnRvU3RyaW5nIDE2XG4gICAgICAgICAgICBcIlxcXFx1I3tyZXBlYXQgJzAnLCA0IC0gc3RyLmxlbmd0aH0je3N0cn1cIlxuICAgICAgICByZXR1cm4gdG9Vbmljb2RlRXNjYXBlKGNvZGVQb2ludCkgaWYgY29kZVBvaW50IDwgMHgxMDAwMFxuICAgICAgICAjIHN1cnJvZ2F0ZSBwYWlyXG4gICAgICAgIGhpZ2ggPSBNYXRoLmZsb29yKChjb2RlUG9pbnQgLSAweDEwMDAwKSAvIDB4NDAwKSArIDB4RDgwMFxuICAgICAgICBsb3cgPSAoY29kZVBvaW50IC0gMHgxMDAwMCkgJSAweDQwMCArIDB4REMwMFxuICAgICAgICBcIiN7dG9Vbmljb2RlRXNjYXBlKGhpZ2gpfSN7dG9Vbmljb2RlRXNjYXBlKGxvdyl9XCJcblxuICAgIHJlcGxhY2VVbmljb2RlQ29kZVBvaW50RXNjYXBlczogKHN0ciwgb3B0aW9ucykgLT4gIyBSZXBsYWNlIFxcdXsuLi59IHdpdGggXFx1eHh4eFtcXHV4eHh4XSBpbiBzdHJpbmdzIGFuZCByZWdleGVzXG4gICAgICAgIFxuICAgICAgICBzdHIucmVwbGFjZSBVTklDT0RFX0NPREVfUE9JTlRfRVNDQVBFLCAobWF0Y2gsIGVzY2FwZWRCYWNrc2xhc2gsIGNvZGVQb2ludEhleCwgb2Zmc2V0KSA9PlxuICAgICAgICAgICAgcmV0dXJuIGVzY2FwZWRCYWNrc2xhc2ggaWYgZXNjYXBlZEJhY2tzbGFzaFxuXG4gICAgICAgICAgICBjb2RlUG9pbnREZWNpbWFsID0gcGFyc2VJbnQgY29kZVBvaW50SGV4LCAxNlxuICAgICAgICAgICAgaWYgY29kZVBvaW50RGVjaW1hbCA+IDB4MTBmZmZmXG4gICAgICAgICAgICAgICAgQGVycm9yIFwidW5pY29kZSBjb2RlIHBvaW50IGVzY2FwZXMgZ3JlYXRlciB0aGFuIFxcXFx1ezEwZmZmZn0gYXJlIG5vdCBhbGxvd2VkXCIsXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldDogb2Zmc2V0ICsgb3B0aW9ucy5kZWxpbWl0ZXIubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIGxlbmd0aDogY29kZVBvaW50SGV4Lmxlbmd0aCArIDRcblxuICAgICAgICAgICAgQHVuaWNvZGVDb2RlUG9pbnRUb1VuaWNvZGVFc2NhcGVzIGNvZGVQb2ludERlY2ltYWxcblxuICAgIHZhbGlkYXRlRXNjYXBlczogKHN0ciwgb3B0aW9ucyA9IHt9KSAtPiAjIFZhbGlkYXRlcyBlc2NhcGVzIGluIHN0cmluZ3MgYW5kIHJlZ2V4ZXMuXG4gICAgICAgIFxuICAgICAgICBpbnZhbGlkRXNjYXBlUmVnZXggPVxuICAgICAgICAgICAgaWYgb3B0aW9ucy5pc1JlZ2V4XG4gICAgICAgICAgICAgICAgUkVHRVhfSU5WQUxJRF9FU0NBUEVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBTVFJJTkdfSU5WQUxJRF9FU0NBUEVcbiAgICAgICAgbWF0Y2ggPSBpbnZhbGlkRXNjYXBlUmVnZXguZXhlYyBzdHJcbiAgICAgICAgcmV0dXJuIHVubGVzcyBtYXRjaFxuICAgICAgICBbW10sIGJlZm9yZSwgb2N0YWwsIGhleCwgdW5pY29kZUNvZGVQb2ludCwgdW5pY29kZV0gPSBtYXRjaFxuICAgICAgICBtZXNzYWdlID1cbiAgICAgICAgICAgIGlmIG9jdGFsXG4gICAgICAgICAgICAgICAgXCJvY3RhbCBlc2NhcGUgc2VxdWVuY2VzIGFyZSBub3QgYWxsb3dlZFwiXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgXCJpbnZhbGlkIGVzY2FwZSBzZXF1ZW5jZVwiXG4gICAgICAgIGludmFsaWRFc2NhcGUgPSBcIlxcXFwje29jdGFsIG9yIGhleCBvciB1bmljb2RlQ29kZVBvaW50IG9yIHVuaWNvZGV9XCJcbiAgICAgICAgQGVycm9yIFwiI3ttZXNzYWdlfSAje2ludmFsaWRFc2NhcGV9XCIsXG4gICAgICAgICAgICBvZmZzZXQ6IChvcHRpb25zLm9mZnNldEluQ2h1bmsgPyAwKSArIG1hdGNoLmluZGV4ICsgYmVmb3JlLmxlbmd0aFxuICAgICAgICAgICAgbGVuZ3RoOiBpbnZhbGlkRXNjYXBlLmxlbmd0aFxuXG4gICAgbWFrZURlbGltaXRlZExpdGVyYWw6IChib2R5LCBvcHRpb25zID0ge30pIC0+ICMgQ29uc3RydWN0cyBhIHN0cmluZyBvciByZWdleCBieSBlc2NhcGluZyBjZXJ0YWluIGNoYXJhY3RlcnMuXG4gICAgICAgIFxuICAgICAgICBib2R5ID0gJyg/OiknIGlmIGJvZHkgaXMgJycgYW5kIG9wdGlvbnMuZGVsaW1pdGVyIGlzICcvJ1xuICAgICAgICByZWdleCA9IC8vL1xuICAgICAgICAgICAgICAgIChcXFxcXFxcXCkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgZXNjYXBlZCBiYWNrc2xhc2hcbiAgICAgICAgICAgIHwgKFxcXFwwKD89WzEtN10pKSAgICAgICAgICAgICAgICAgICAgICAgIyBudWwgY2hhcmFjdGVyIG1pc3Rha2VuIGFzIG9jdGFsIGVzY2FwZVxuICAgICAgICAgICAgfCBcXFxcPygje29wdGlvbnMuZGVsaW1pdGVyfSkgICAgICAgICAgICAjIChwb3NzaWJseSBlc2NhcGVkKSBkZWxpbWl0ZXJcbiAgICAgICAgICAgIHwgXFxcXD8oPzogKFxcbil8KFxccil8KFxcdTIwMjgpfChcXHUyMDI5KSApICMgKHBvc3NpYmx5IGVzY2FwZWQpIG5ld2xpbmVzXG4gICAgICAgICAgICB8IChcXFxcLikgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgb3RoZXIgZXNjYXBlc1xuICAgICAgICAvLy9nXG4gICAgICAgIGJvZHkgPSBib2R5LnJlcGxhY2UgcmVnZXgsIChtYXRjaCwgYmFja3NsYXNoLCBudWwsIGRlbGltaXRlciwgbGYsIGNyLCBscywgcHMsIG90aGVyKSAtPiBzd2l0Y2hcbiAgICAgICAgICAgICMgSWdub3JlIGVzY2FwZWQgYmFja3NsYXNoZXMuXG4gICAgICAgICAgICB3aGVuIGJhY2tzbGFzaCB0aGVuIChpZiBvcHRpb25zLmRvdWJsZSB0aGVuIGJhY2tzbGFzaCArIGJhY2tzbGFzaCBlbHNlIGJhY2tzbGFzaClcbiAgICAgICAgICAgIHdoZW4gbnVsICAgICAgIHRoZW4gJ1xcXFx4MDAnXG4gICAgICAgICAgICB3aGVuIGRlbGltaXRlciB0aGVuIFwiXFxcXCN7ZGVsaW1pdGVyfVwiXG4gICAgICAgICAgICB3aGVuIGxmICAgICAgICB0aGVuICdcXFxcbidcbiAgICAgICAgICAgIHdoZW4gY3IgICAgICAgIHRoZW4gJ1xcXFxyJ1xuICAgICAgICAgICAgd2hlbiBscyAgICAgICAgdGhlbiAnXFxcXHUyMDI4J1xuICAgICAgICAgICAgd2hlbiBwcyAgICAgICAgdGhlbiAnXFxcXHUyMDI5J1xuICAgICAgICAgICAgd2hlbiBvdGhlciAgICAgdGhlbiAoaWYgb3B0aW9ucy5kb3VibGUgdGhlbiBcIlxcXFwje290aGVyfVwiIGVsc2Ugb3RoZXIpXG4gICAgICAgIFwiI3tvcHRpb25zLmRlbGltaXRlcn0je2JvZHl9I3tvcHRpb25zLmRlbGltaXRlcn1cIlxuXG4gICAgIyBUaHJvd3MgYW4gZXJyb3IgYXQgZWl0aGVyIGEgZ2l2ZW4gb2Zmc2V0IGZyb20gdGhlIGN1cnJlbnQgY2h1bmsgb3IgYXQgdGhlIGxvY2F0aW9uIG9mIGEgdG9rZW4gKGB0b2tlblsyXWApLlxuICAgIFxuICAgIGVycm9yOiAobWVzc2FnZSwgb3B0aW9ucz17fSkgLT5cbiAgICAgICAgXG4gICAgICAgIGxvY2F0aW9uID1cbiAgICAgICAgICAgIGlmICdmaXJzdF9saW5lJyBvZiBvcHRpb25zXG4gICAgICAgICAgICAgICAgb3B0aW9uc1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIFtmaXJzdF9saW5lLCBmaXJzdF9jb2x1bW5dID0gQGdldExpbmVBbmRDb2x1bW5Gcm9tQ2h1bmsgb3B0aW9ucy5vZmZzZXQgPyAwXG4gICAgICAgICAgICAgICAge2ZpcnN0X2xpbmUsIGZpcnN0X2NvbHVtbiwgbGFzdF9jb2x1bW46IGZpcnN0X2NvbHVtbiArIChvcHRpb25zLmxlbmd0aCA/IDEpIC0gMX1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgdGhyb3dTeW50YXhFcnJvciBtb2R1bGU6J2xleGVyJywgbWVzc2FnZTptZXNzYWdlLCBsb2NhdGlvbjpsb2NhdGlvblxuXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG5cbmlzVW5hc3NpZ25hYmxlID0gKG5hbWUsIGRpc3BsYXlOYW1lID0gbmFtZSkgLT4gc3dpdGNoXG4gICAgXG4gICAgd2hlbiBuYW1lIGluIFtKU19LRVlXT1JEUy4uLiwgQ09GRkVFX0tFWVdPUkRTLi4uXVxuICAgICAgICBcImtleXdvcmQgJyN7ZGlzcGxheU5hbWV9JyBjYW4ndCBiZSBhc3NpZ25lZFwiXG4gICAgd2hlbiBuYW1lIGluIFNUUklDVF9QUk9TQ1JJQkVEXG4gICAgICAgIFwiJyN7ZGlzcGxheU5hbWV9JyBjYW4ndCBiZSBhc3NpZ25lZFwiXG4gICAgd2hlbiBuYW1lIGluIFJFU0VSVkVEXG4gICAgICAgIFwicmVzZXJ2ZWQgd29yZCAnI3tkaXNwbGF5TmFtZX0nIGNhbid0IGJlIGFzc2lnbmVkXCJcbiAgICBlbHNlXG4gICAgICAgIGZhbHNlXG5cbiMgYGZyb21gIGlzbuKAmXQgYSBrZXl3b3JkLCBidXQgaXQgYmVoYXZlcyBsaWtlIG9uZSBpbiBgaW1wb3J0YCBhbmQgYGV4cG9ydGAgc3RhdGVtZW50cyAoaGFuZGxlZCBhYm92ZSkgXG4jIGFuZCBpbiB0aGUgZGVjbGFyYXRpb24gbGluZSBvZiBhIGBmb3JgIGxvb3AuXG4jIFRyeSB0byBkZXRlY3Qgd2hlbiBgZnJvbWAgaXMgYSB2YXJpYWJsZSBpZGVudGlmaWVyIGFuZCB3aGVuIGl0IGlzIHRoaXMg4oCcc29tZXRpbWVz4oCdIGtleXdvcmQuXG5cbmlzRm9yRnJvbSA9IChwcmV2KSAtPlxuICAgIFxuICAgIGlmIHByZXZbMF0gaXMgJ0lERU5USUZJRVInXG4gICAgICAgICMgYGZvciBpIGZyb20gZnJvbWAsIGBmb3IgZnJvbSBmcm9tIGl0ZXJhYmxlYFxuICAgICAgICBpZiBwcmV2WzFdIGlzICdmcm9tJ1xuICAgICAgICAgICAgcHJldlsxXVswXSA9ICdJREVOVElGSUVSJ1xuICAgICAgICAgICAgeWVzXG4gICAgICAgICMgYGZvciBpIGZyb20gaXRlcmFibGVgXG4gICAgICAgIHllc1xuICAgICMgYGZvciBmcm9t4oCmYFxuICAgIGVsc2UgaWYgcHJldlswXSBpcyAnRk9SJ1xuICAgICAgICBub1xuICAgICMgYGZvciB7ZnJvbX3igKZgLCBgZm9yIFtmcm9tXeKApmAsIGBmb3Ige2EsIGZyb2194oCmYCwgYGZvciB7YTogZnJvbX3igKZgXG4gICAgZWxzZSBpZiBwcmV2WzFdIGluIFsneycnWycnLCcnOiddXG4gICAgICAgIG5vXG4gICAgZWxzZVxuICAgICAgICB5ZXNcblxuIyMjXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgICAgICAgMDAwICBcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuIyMjXG5cbiMgS2V5d29yZHMgdGhhdCB3ZSBzaGFyZSBpbiBjb21tb24gd2l0aCBKYXZhU2NyaXB0LlxuXG5NRVRBX0tFWVdPUkRTID0gWyAnaWYnICd0aGVuJyAnZWxpZicgJ2Vsc2UnIF1cblxuSlNfS0VZV09SRFMgPSBbXG4gICAgJ3RydWUnICdmYWxzZScgJ251bGwnICd0aGlzJ1xuICAgICduZXcnICdkZWxldGUnICd0eXBlb2YnICdpbicgJ2luc3RhbmNlb2YnXG4gICAgJ3JldHVybicgJ3Rocm93JyAnYnJlYWsnICdjb250aW51ZScgJ2RlYnVnZ2VyJyAneWllbGQnXG4gICAgJ2lmJyAnZWxzZScgJ3N3aXRjaCcgJ2ZvcicgJ3doaWxlJyAnZG8nICd0cnknICdjYXRjaCcgJ2ZpbmFsbHknXG4gICAgJ2NsYXNzJyAnZXh0ZW5kcycgJ3N1cGVyJ1xuICAgICdpbXBvcnQnICdleHBvcnQnICdkZWZhdWx0J1xuXVxuXG5DT0ZGRUVfS0VZV09SRFMgPSBbICd1bmRlZmluZWQnICdJbmZpbml0eScgJ05hTicgJ3RoZW4nICd1bmxlc3MnICd1bnRpbCcgJ2xvb3AnICdvZicgJ2J5JyAnd2hlbicgXVxuXG5DT0ZGRUVfQUxJQVNfTUFQID1cbiAgICBhbmQgIDogJyYmJ1xuICAgIG9yICAgOiAnfHwnXG4gICAgaXMgICA6ICc9PSdcbiAgICBpc250IDogJyE9JyAjIHVnbHkhIHJlbW92ZSBpbiBjYXNlIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IHdpdGggQ1MxIGlzIGJyb2tlbi4gXG4gICAgbm90ICA6ICchJ1xuICAgIHllcyAgOiAndHJ1ZSdcbiAgICBubyAgIDogJ2ZhbHNlJ1xuICAgIG9uICAgOiAndHJ1ZSdcbiAgICBvZmYgIDogJ2ZhbHNlJ1xuXG5DT0ZGRUVfQUxJQVNFUyAgPSAoa2V5IGZvciBrZXkgb2YgQ09GRkVFX0FMSUFTX01BUClcbkNPRkZFRV9LRVlXT1JEUyA9IENPRkZFRV9LRVlXT1JEUy5jb25jYXQgQ09GRkVFX0FMSUFTRVNcblxuIyBUaGUgbGlzdCBvZiBrZXl3b3JkcyB0aGF0IGFyZSByZXNlcnZlZCBieSBKYXZhU2NyaXB0LCBidXQgbm90IHVzZWQsIG9yIHVzZWQgaW50ZXJuYWxseS5cbiMgV2UgdGhyb3cgYW4gZXJyb3Igd2hlbiB0aGVzZSBhcmUgZW5jb3VudGVyZWQsIHRvIGF2b2lkIGhhdmluZyBhIEphdmFTY3JpcHQgZXJyb3IgYXQgcnVudGltZS5cblxuUkVTRVJWRUQgPSBbXG4gICAgJ2Nhc2UnICdmdW5jdGlvbicgJ3ZhcicgJ3ZvaWQnICd3aXRoJyAnY29uc3QnICdsZXQnICdlbnVtJ1xuICAgICduYXRpdmUnICdpbXBsZW1lbnRzJyAnaW50ZXJmYWNlJyAncGFja2FnZScgJ3ByaXZhdGUnXG4gICAgJ3Byb3RlY3RlZCcgJ3B1YmxpYycgJ3N0YXRpYydcbl1cblxuU1RSSUNUX1BST1NDUklCRUQgPSBbJ2FyZ3VtZW50cycgJ2V2YWwnXVxuXG4jIFRoZSBzdXBlcnNldCBvZiBib3RoIEphdmFTY3JpcHQga2V5d29yZHMgYW5kIHJlc2VydmVkIHdvcmRzLCBub25lIG9mIHdoaWNoIG1heVxuIyBiZSB1c2VkIGFzIGlkZW50aWZpZXJzIG9yIHByb3BlcnRpZXMuXG5cbkJPTSA9IDY1Mjc5ICMgVGhlIGNoYXJhY3RlciBjb2RlIG9mIHRoZSBuYXN0eSBNaWNyb3NvZnQgbWFkbmVzcyBvdGhlcndpc2Uga25vd24gYXMgdGhlIEJPTS5cblxuIyBUb2tlbiBtYXRjaGluZyByZWdleGVzLlxuXG5JREVOVElGSUVSID0gLy8vIF5cbiAgICAoPyFcXGQpXG4gICAgKCAoPzogKD8hXFxzKVskXFx3XFx4N2YtXFx1ZmZmZl0gKSsgKVxuICAgICggW15cXG5cXFNdKiA6ICg/ITopICk/ICAgICMgSXMgdGhpcyBhIHByb3BlcnR5IG5hbWU/XG4vLy9cblxuTlVNQkVSID0gLy8vXG4gICAgXiAwYlswMV0rICAgIHwgICAgICAgICAgICAgICMgYmluYXJ5XG4gICAgXiAwb1swLTddKyAgIHwgICAgICAgICAgICAgICMgb2N0YWxcbiAgICBeIDB4W1xcZGEtZl0rIHwgICAgICAgICAgICAgICMgaGV4XG4gICAgXiBcXGQrbiAgICAgICB8ICAgICAgICAgICAgICAjIGJpZ2ludFxuICAgIF4gXFxkKlxcLj9cXGQrICg/OmVbKy1dP1xcZCspPyAgIyBkZWNpbWFsXG4vLy9pXG5cbk9QRVJBVE9SID0gLy8vIF4gKFxuICAgID86IFstPV0+ICAgICAgICAgICAgICMgZnVuY3Rpb25cbiAgICAgfCBbLSsqLyU8PiZ8XiE/PV09ICAjIGNvbXBvdW5kIGFzc2lnbiAvIGNvbXBhcmVcbiAgICAgfCA+Pj49PyAgICAgICAgICAgICAjIHplcm8tZmlsbCByaWdodCBzaGlmdFxuICAgICB8IChbLSs6XSlcXDEgICAgICAgICAjIGRvdWJsZXNcbiAgICAgfCAoWyZ8PD4qLyVdKVxcMj0/ICAgIyBsb2dpYyAvIHNoaWZ0IC8gcG93ZXIgLyBmbG9vciBkaXZpc2lvbiAvIG1vZHVsb1xuICAgICB8IFxcPyhcXC58OjopICAgICAgICAgIyBzb2FrIGFjY2Vzc1xuICAgICB8IFxcLnsyLDN9ICAgICAgICAgICAjIHJhbmdlIG9yIHNwbGF0XG4pIC8vL1xuXG5XSElURVNQQUNFID0gL15bXlxcblxcU10rL1xuXG5DT0RFICAgICAgID0gL15bLT1dPi9cblxuTVVMVElfREVOVCA9IC9eKD86XFxuW15cXG5cXFNdKikrL1xuXG5KU1RPS0VOICAgICAgPSAvLy9eIGAoPyFgYCkgKCg/OiBbXmBcXFxcXSB8IFxcXFxbXFxzXFxTXSAgICAgICAgICAgKSopIGAgICAvLy9cbkhFUkVfSlNUT0tFTiA9IC8vL14gYGBgICAgICAoKD86IFteYFxcXFxdIHwgXFxcXFtcXHNcXFNdIHwgYCg/IWBgKSApKikgYGBgIC8vL1xuXG4jIFN0cmluZy1tYXRjaGluZy1yZWdleGVzLlxuXG5TVFJJTkdfU1RBUlQgPSAvXig/OicnJ3xcIlwiXCJ8J3xcIikvXG5TVFJJTkdfU0lOR0xFICA9IC8vLyBeKD86IFteXFxcXCddICB8IFxcXFxbXFxzXFxTXSAgICAgICAgICAgICAgICAgICAgICApKiAvLy9cblNUUklOR19ET1VCTEUgID0gLy8vIF4oPzogW15cXFxcXCIjXSB8IFxcXFxbXFxzXFxTXSB8ICAgICAgICAgICBcXCMoPyFcXHspICkqIC8vL1xuSEVSRURPQ19TSU5HTEUgPSAvLy8gXig/OiBbXlxcXFwnXSAgfCBcXFxcW1xcc1xcU10gfCAnKD8hJycpICAgICAgICAgICAgKSogLy8vXG5IRVJFRE9DX0RPVUJMRSA9IC8vLyBeKD86IFteXFxcXFwiI10gfCBcXFxcW1xcc1xcU10gfCBcIig/IVwiXCIpIHwgXFwjKD8hXFx7KSApKiAvLy9cblxuQ09NTUVOVCAgICAgID0gL14jIyMoW14jXVtcXHNcXFNdKj8pKD86IyMjW15cXG5cXFNdKnwjIyMkKXxeKD86XFxzKiMoPyEjI1teI10pLiopKy8gICAgICAgICAgICAgIFxuXG5TVFJJTkdfT01JVCAgICA9IC8vL1xuICAgICAgICAoKD86XFxcXFxcXFwpKykgICAgICAjIGNvbnN1bWUgKGFuZCBwcmVzZXJ2ZSkgYW4gZXZlbiBudW1iZXIgb2YgYmFja3NsYXNoZXNcbiAgICB8IFxcXFxbXlxcU1xcbl0qXFxuXFxzKiAgICAjIHJlbW92ZSBlc2NhcGVkIG5ld2xpbmVzXG4vLy9nXG5TSU1QTEVfU1RSSU5HX09NSVQgPSAvXFxzKlxcblxccyovZ1xuSEVSRURPQ19JTkRFTlQgICAgICAgPSAvXFxuKyhbXlxcblxcU10qKSg/PVxcUykvZ1xuXG4jIFJlZ2V4LW1hdGNoaW5nLXJlZ2V4ZXMuXG5SRUdFWCA9IC8vLyBeXG4gICAgLyAoPyEvKSAoKFxuICAgID86IFteIFsgLyBcXG4gXFxcXCBdICAgICMgZXZlcnkgb3RoZXIgdGhpbmdcbiAgICAgfCBcXFxcW15cXG5dICAgICAgICAgICAjIGFueXRoaW5nIGJ1dCBuZXdsaW5lcyBlc2NhcGVkXG4gICAgIHwgXFxbICAgICAgICAgICAgICAgICMgY2hhcmFjdGVyIGNsYXNzXG4gICAgICAgICAgICAgKD86IFxcXFxbXlxcbl0gfCBbXiBcXF0gXFxuIFxcXFwgXSApKlxuICAgICAgICAgXFxdXG4gICAgKSopICgvKT9cbi8vL1xuXG5SRUdFWF9GTEFHUyAgPSAvXlxcdyovXG5WQUxJRF9GTEFHUyAgPSAvXig/IS4qKC4pLipcXDEpW2ltZ3V5XSokL1xuXG5IRVJFR0VYICAgICAgPSAvLy8gXig/OiBbXlxcXFwvI10gfCBcXFxcW1xcc1xcU10gfCAvKD8hLy8pIHwgXFwjKD8hXFx7KSApKiAvLy9cblxuSEVSRUdFWF9PTUlUID0gLy8vXG4gICAgICAoKD86XFxcXFxcXFwpKykgICAgICAgICAgICMgY29uc3VtZSAoYW5kIHByZXNlcnZlKSBhbiBldmVuIG51bWJlciBvZiBiYWNrc2xhc2hlc1xuICAgIHwgXFxcXChcXHMpICAgICAgICAgICAgICAgICMgcHJlc2VydmUgZXNjYXBlZCB3aGl0ZXNwYWNlXG4gICAgfCBcXHMrKD86Iy4qKT8gICAgICAgICAgICMgcmVtb3ZlIHdoaXRlc3BhY2UgYW5kIGNvbW1lbnRzXG4vLy9nXG5cblJFR0VYX0lMTEVHQUwgPSAvLy8gXiAoIC8gfCAvezN9XFxzKikgKFxcKikgLy8vXG5cblBPU1NJQkxZX0RJVklTSU9OID0gLy8vIF4gLz0/XFxzIC8vL1xuXG4jIE90aGVyIHJlZ2V4ZXMuXG5cbkhFUkVDT01NRU5UX0lMTEVHQUwgPSAvXFwqXFwvL1xuXG5MSU5FX0NPTlRJTlVFUiAgICAgICAgICA9IC8vLyBeIFxccyogKD86ICwgfCBcXD8/XFwuKD8hWy5cXGRdKSB8IDo6ICkgLy8vXG5cblNUUklOR19JTlZBTElEX0VTQ0FQRSA9IC8vL1xuICAgICggKD86XnxbXlxcXFxdKSAoPzpcXFxcXFxcXCkqICkgICAgICAgICAgICAgICAgICAgIyBtYWtlIHN1cmUgdGhlIGVzY2FwZSBpc27igJl0IGVzY2FwZWRcbiAgICBcXFxcICggICBcbiAgICAgICAgID86ICgwWzAtN118WzEtN10pICAgICAgICAgICAgICAgICAgICAgICMgb2N0YWwgZXNjYXBlXG4gICAgICAgICAgICB8ICh4KD8hW1xcZGEtZkEtRl17Mn0pLnswLDJ9KSAgICAgICAgIyBoZXggZXNjYXBlXG4gICAgICAgICAgICB8ICh1XFx7KD8hW1xcZGEtZkEtRl17MSx9XFx9KVtefV0qXFx9PykgIyB1bmljb2RlIGNvZGUgcG9pbnQgZXNjYXBlXG4gICAgICAgICAgICB8ICh1KD8hXFx7fFtcXGRhLWZBLUZdezR9KS57MCw0fSkgICAgICMgdW5pY29kZSBlc2NhcGVcbiAgICApXG4vLy9cblJFR0VYX0lOVkFMSURfRVNDQVBFID0gLy8vXG4gICAgKCAoPzpefFteXFxcXF0pICg/OlxcXFxcXFxcKSogKSAgICAgICAgICAgICAgICAgICAjIG1ha2Ugc3VyZSB0aGUgZXNjYXBlIGlzbuKAmXQgZXNjYXBlZFxuICAgIFxcXFwgKCAgIFxuICAgICAgICAgPzogKDBbMC03XSkgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBvY3RhbCBlc2NhcGVcbiAgICAgICAgICAgIHwgKHgoPyFbXFxkYS1mQS1GXXsyfSkuezAsMn0pICAgICAgICAjIGhleCBlc2NhcGVcbiAgICAgICAgICAgIHwgKHVcXHsoPyFbXFxkYS1mQS1GXXsxLH1cXH0pW159XSpcXH0/KSAjIHVuaWNvZGUgY29kZSBwb2ludCBlc2NhcGVcbiAgICAgICAgICAgIHwgKHUoPyFcXHt8W1xcZGEtZkEtRl17NH0pLnswLDR9KSAgICAgIyB1bmljb2RlIGVzY2FwZVxuICAgIClcbi8vL1xuXG5VTklDT0RFX0NPREVfUE9JTlRfRVNDQVBFID0gLy8vXG4gICAgKCBcXFxcXFxcXCApICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBtYWtlIHN1cmUgdGhlIGVzY2FwZSBpc27igJl0IGVzY2FwZWRcbiAgICB8XG4gICAgXFxcXHVcXHsgKCBbXFxkYS1mQS1GXSsgKSBcXH1cbi8vL2dcblxuTEVBRElOR19CTEFOS19MSU5FICA9IC9eW15cXG5cXFNdKlxcbi9cblRSQUlMSU5HX0JMQU5LX0xJTkUgPSAvXFxuW15cXG5cXFNdKiQvXG5UUkFJTElOR19TUEFDRVMgICAgID0gL1xccyskL1xuQ09NUE9VTkRfQVNTSUdOICAgICA9IFsgJy09JyAnKz0nICcvPScgJyo9JyAnJT0nICd8fD0nICcmJj0nICc/PScgJzw8PScgJz4+PScgJz4+Pj0nICcmPScgJ149JyAnfD0nICcqKj0nICcvLz0nICclJT0nIF1cblVOQVJZICAgICAgICAgICAgICAgPSBbJ05FVycgJ1RZUEVPRicgJ0RFTEVURScgJ0RPJ11cblVOQVJZX01BVEggICAgICAgICAgPSBbJyEnICd+J11cblNISUZUICAgICAgICAgICAgICAgPSBbJzw8JyAnPj4nICc+Pj4nXVxuQ09NUEFSRSAgICAgICAgICAgICA9IFsnPT0nICchPScgJzwnICc+JyAnPD0nICc+PSddXG5NQVRIICAgICAgICAgICAgICAgID0gWycqJyAnLycgJyUnICcvLycgJyUlJ11cblJFTEFUSU9OICAgICAgICAgICAgPSBbJ0lOJyAnT0YnICdJTlNUQU5DRU9GJ10gIyBSZWxhdGlvbmFsIHRva2VucyB0aGF0IGFyZSBuZWdhdGFibGUgd2l0aCBgbm90YCBwcmVmaXguXG5CT09MICAgICAgICAgICAgICAgID0gWydUUlVFJyAnRkFMU0UnXVxuXG4jIFRva2VucyB3aGljaCBjb3VsZCBsZWdpdGltYXRlbHkgYmUgaW52b2tlZCBvciBpbmRleGVkLiBBbiBvcGVuaW5nXG4jIHBhcmVudGhlc2VzIG9yIGJyYWNrZXQgZm9sbG93aW5nIHRoZXNlIHRva2VucyB3aWxsIGJlIHJlY29yZGVkIGFzIHRoZSBzdGFydFxuIyBvZiBhIGZ1bmN0aW9uIGludm9jYXRpb24gb3IgaW5kZXhpbmcgb3BlcmF0aW9uLlxuXG5DQUxMQUJMRSAgPSBbJ0lERU5USUZJRVInICdQUk9QRVJUWScgJyknICddJyAnPycgJ0AnICdUSElTJyAnU1VQRVInXVxuSU5ERVhBQkxFID0gQ0FMTEFCTEUuY29uY2F0IFsgJ05VTUJFUicgJ0lORklOSVRZJyAnTkFOJyAnU1RSSU5HJyAnU1RSSU5HX0VORCcgJ1JFR0VYJyAnUkVHRVhfRU5EJyAnQk9PTCcgJ05VTEwnICdVTkRFRklORUQnICd9JyAnOjonIF1cblxuIyBUb2tlbnMgd2hpY2ggYSByZWd1bGFyIGV4cHJlc3Npb24gd2lsbCBuZXZlciBpbW1lZGlhdGVseSBmb2xsb3cgKGV4Y2VwdCBzcGFjZWRcbiMgQ0FMTEFCTEVzIGluIHNvbWUgY2FzZXMpLCBidXQgd2hpY2ggYSBkaXZpc2lvbiBvcGVyYXRvciBjYW4uXG4jXG4jIFNlZTogaHR0cDovL3d3dy1hcmNoaXZlLm1vemlsbGEub3JnL2pzL2xhbmd1YWdlL2pzMjAtMjAwMi0wNC9yYXRpb25hbGUvc3ludGF4Lmh0bWwjcmVndWxhci1leHByZXNzaW9uc1xuXG5OT1RfUkVHRVggPSBJTkRFWEFCTEUuY29uY2F0IFsnKysnICctLSddXG5cbiMgVG9rZW5zIHRoYXQsIHdoZW4gaW1tZWRpYXRlbHkgcHJlY2VkaW5nIGEgYFdIRU5gLCBpbmRpY2F0ZSB0aGF0IHRoZSBgV0hFTmBcbiMgb2NjdXJzIGF0IHRoZSBzdGFydCBvZiBhIGxpbmUuIFdlIGRpc2FtYmlndWF0ZSB0aGVzZSBmcm9tIHRyYWlsaW5nIHdoZW5zIHRvXG4jIGF2b2lkIGFuIGFtYmlndWl0eSBpbiB0aGUgZ3JhbW1hci5cblxuTElORV9CUkVBSyA9IFsnSU5ERU5UJyAnT1VUREVOVCcgJ1RFUk1JTkFUT1InXVxuXG4jIEFkZGl0aW9uYWwgaW5kZW50IGluIGZyb250IG9mIHRoZXNlIGlzIGlnbm9yZWQuXG5cbklOREVOVEFCTEVfQ0xPU0VSUyA9IFsnKScgJ30nICddJ11cblxuIyBUb2tlbnMgdGhhdCwgd2hlbiBhcHBlYXJpbmcgYXQgdGhlIGVuZCBvZiBhIGxpbmUsIHN1cHByZXNzIGEgZm9sbG93aW5nIFRFUk1JTkFUT1IvSU5ERU5UIHRva2VuXG5cblVORklOSVNIRUQgPSBbJ1xcXFwnICcuJyAnPy4nICc/OjonICdVTkFSWScgJ01BVEgnICdVTkFSWV9NQVRIJyAnKycgJy0nXG4gICAgICAgICAgICAgICcqKicgJ1NISUZUJyAnUkVMQVRJT04nICdDT01QQVJFJyAnJicgJ14nICd8JyAnJiYnICd8fCdcbiAgICAgICAgICAgICAgJ0JJTj8nICdUSFJPVycgJ0VYVEVORFMnXVxuICAgICAgICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gXG4gICAgSlNfRk9SQklEREVOOiAgIEpTX0tFWVdPUkRTLmNvbmNhdChSRVNFUlZFRCkuY29uY2F0KFNUUklDVF9QUk9TQ1JJQkVEKVxuICAgIGlzVW5hc3NpZ25hYmxlOiBpc1VuYXNzaWduYWJsZVxuICAgIExleGVyOiAgICAgICAgICBMZXhlclxuICAgICJdfQ==
//# sourceURL=../coffee/lexer.coffee