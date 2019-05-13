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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4ZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLDA0QkFBQTtJQUFBOzs7O0FBaUJBLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFFVCxhQUFlLE9BQUEsQ0FBUSxRQUFSOztBQUNqQixNQUFnQyxPQUFBLENBQVEsWUFBUixDQUFoQyxFQUFFLGlDQUFGLEVBQWlCOztBQUNqQixPQUE2RSxPQUFBLENBQVEsV0FBUixDQUE3RSxFQUFFLGtCQUFGLEVBQVMsb0JBQVQsRUFBaUIsc0JBQWpCLEVBQTBCLG9CQUExQixFQUFrQyxnREFBbEMsRUFBd0Q7O0FBS2xEOzs7OztvQkFpQkYsUUFBQSxHQUFVLFNBQUMsSUFBRCxFQUFPLElBQVA7QUFFTixZQUFBO1FBQUEsSUFBQSxHQUFPLGFBQUEsQ0FBYyxJQUFkO1FBQ1AsSUFBQSxHQUFPLFVBQUEsQ0FBYyxJQUFkO1FBRVAsSUFBQyxDQUFBLE1BQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxVQUFELEdBQWM7UUFDZCxJQUFDLENBQUEsTUFBRCxHQUFjO1FBQ2QsSUFBQyxDQUFBLE9BQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxPQUFELEdBQWM7UUFDZCxJQUFDLENBQUEsSUFBRCxHQUFjO1FBQ2QsSUFBQyxDQUFBLE1BQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxPQUFELEdBQWM7UUFDZCxJQUFDLENBQUEsVUFBRCxHQUFjO1FBQ2QsSUFBQyxDQUFBLFVBQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxtQkFBRCxHQUF1QjtRQUN2QixJQUFDLENBQUEsbUJBQUQsR0FBdUI7UUFFdkIsSUFBQyxDQUFBLFNBQUQsR0FBZSxJQUFJLENBQUMsSUFBTCxJQUFhO1FBQzVCLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBSSxDQUFDLE1BQUwsSUFBZTtRQUM5QixJQUFDLENBQUEsSUFBRCxHQUFRLElBQUMsQ0FBQSxLQUFELENBQU8sSUFBUDtR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QUFpQyxHQUFqQyxFQUFxQyxHQUFyQyxFQUF5QyxNQUF6QyxFQUFnRCxPQUFoRDs7QUFDWixTQUFBLEdBQVksUUFBUSxDQUFDLE1BQVQsQ0FBZ0IsQ0FBRSxRQUFGLEVBQVcsVUFBWCxFQUFzQixLQUF0QixFQUE0QixRQUE1QixFQUFxQyxZQUFyQyxFQUFrRCxPQUFsRCxFQUEwRCxXQUExRCxFQUFzRSxNQUF0RSxFQUE2RSxNQUE3RSxFQUFvRixXQUFwRixFQUFnRyxHQUFoRyxFQUFvRyxJQUFwRyxDQUFoQjs7QUFPWixTQUFBLEdBQVksU0FBUyxDQUFDLE1BQVYsQ0FBaUIsQ0FBQyxJQUFELEVBQU0sSUFBTixDQUFqQjs7QUFNWixVQUFBLEdBQWEsQ0FBQyxRQUFELEVBQVUsU0FBVixFQUFvQixZQUFwQjs7QUFJYixrQkFBQSxHQUFxQixDQUFDLEdBQUQsRUFBSyxHQUFMLEVBQVMsR0FBVDs7QUFJckIsVUFBQSxHQUFhLENBQUMsSUFBRCxFQUFNLEdBQU4sRUFBVSxJQUFWLEVBQWUsS0FBZixFQUFxQixPQUFyQixFQUE2QixNQUE3QixFQUFvQyxZQUFwQyxFQUFpRCxHQUFqRCxFQUFxRCxHQUFyRCxFQUNDLElBREQsRUFDTSxPQUROLEVBQ2MsVUFEZCxFQUN5QixTQUR6QixFQUNtQyxHQURuQyxFQUN1QyxHQUR2QyxFQUMyQyxHQUQzQyxFQUMrQyxJQUQvQyxFQUNvRCxJQURwRCxFQUVDLE1BRkQsRUFFUSxPQUZSLEVBRWdCLFNBRmhCOztBQUliLE9BQUEsR0FBYTs7QUFFYixNQUFNLENBQUMsT0FBUCxHQUNJO0lBQUEsWUFBQSxFQUFnQixXQUFXLENBQUMsTUFBWixDQUFtQixRQUFuQixDQUE0QixDQUFDLE1BQTdCLENBQW9DLGlCQUFwQyxDQUFoQjtJQUNBLGNBQUEsRUFBZ0IsY0FEaEI7SUFFQSxLQUFBLEVBQWdCLEtBRmhCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbjAwMCAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuMDAwICAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4wMDAgICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbjAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuIyMjXG5cbiMgVGhlIExleGVyIHVzZXMgYSBzZXJpZXMgb2YgdG9rZW4tbWF0Y2hpbmcgcmVnZXhlcyB0byBhdHRlbXB0IG1hdGNoZXMgYWdhaW5zdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBzb3VyY2UgY29kZS4gXG4jIFdoZW4gYSBtYXRjaCBpcyBmb3VuZCwgYSB0b2tlbiBpcyBwcm9kdWNlZCwgd2UgY29uc3VtZSB0aGUgbWF0Y2gsIGFuZCBzdGFydCBhZ2Fpbi4gXG4jIFRva2VucyBhcmUgaW4gdGhlIGZvcm06XG4jXG4jICAgIFt0YWcsIHZhbHVlLCBsb2NhdGlvbkRhdGFdXG4jXG4jIHdoZXJlIGxvY2F0aW9uRGF0YSBpcyB7Zmlyc3RfbGluZSwgZmlyc3RfY29sdW1uLCBsYXN0X2xpbmUsIGxhc3RfY29sdW1ufSwgXG4jIHdoaWNoIGlzIGEgZm9ybWF0IHRoYXQgY2FuIGJlIGZlZCBkaXJlY3RseSBpbnRvIEppc29uIHZpYSB0aGUgYHBhcnNlci5sZXhlcmAgZnVuY3Rpb24gZGVmaW5lZCBpbiBrb2ZmZWUuY29mZmVlLlxuXG5SZXdyaXRlciA9IHJlcXVpcmUgJy4vcmV3cml0ZXInXG5cbnsgaW5qZWN0TWV0YSB9ID0gcmVxdWlyZSAnLi9tZXRhJ1xueyBpbmplY3RGZWF0dXJlLCBoYXNGZWF0dXJlIH0gPSByZXF1aXJlICcuL2ZlYXR1cmVzJ1xueyBjb3VudCwgc3RhcnRzLCBjb21wYWN0LCByZXBlYXQsIGxvY2F0aW9uRGF0YVRvU3RyaW5nLCB0aHJvd1N5bnRheEVycm9yIH0gPSByZXF1aXJlICcuL2hlbHBlcnMnXG5cbiMgVGhlIExleGVyIGNsYXNzIHJlYWRzIGEgc3RyaW5nIGFuZCBkaXZ2aWVzIGl0IHVwIGludG8gdGFnZ2VkIHRva2Vucy4gXG4jIFNvbWUgcG90ZW50aWFsIGFtYmlndWl0eSBpbiB0aGUgZ3JhbW1hciBoYXMgYmVlbiBhdm9pZGVkIGJ5IHB1c2hpbmcgc29tZSBleHRyYSBzbWFydHMgaW50byB0aGUgTGV4ZXIuXG5cbmNsYXNzIExleGVyXG5cbiAgICAjIHRva2VuaXplIGlzIHRoZSBMZXhlcidzIG1haW4gbWV0aG9kLiBTY2FuIGJ5IGF0dGVtcHRpbmcgdG8gbWF0Y2ggdG9rZW5zXG4gICAgIyBvbmUgYXQgYSB0aW1lLCB1c2luZyBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBhbmNob3JlZCBhdCB0aGUgc3RhcnQgb2YgdGhlXG4gICAgIyByZW1haW5pbmcgY29kZSwgb3IgYSBjdXN0b20gcmVjdXJzaXZlIHRva2VuLW1hdGNoaW5nIG1ldGhvZCAoZm9yIGludGVycG9sYXRpb25zKS4gXG4gICAgIyBXaGVuIHRoZSBuZXh0IHRva2VuIGhhcyBiZWVuIHJlY29yZGVkLCB3ZSBtb3ZlIGZvcndhcmQgd2l0aGluIHRoZSBjb2RlIHBhc3QgdGhlIHRva2VuLCBhbmQgYmVnaW4gYWdhaW4uXG4gICAgI1xuICAgICMgRWFjaCB0b2tlbml6aW5nIG1ldGhvZCBpcyByZXNwb25zaWJsZSBmb3IgcmV0dXJuaW5nIHRoZSBudW1iZXIgb2YgY2hhcmFjdGVycyBpdCBoYXMgY29uc3VtZWQuXG4gICAgI1xuICAgICMgQmVmb3JlIHJldHVybmluZyB0aGUgdG9rZW4gc3RyZWFtLCBydW4gaXQgdGhyb3VnaCB0aGUgUmV3cml0ZXIuXG4gICAgXG4gICAgIyAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgICAgMDAwICAgMDAwICAgICAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgIDAwMCAgICAwMDAwMDAwICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICAgICAgICAgXG4gICAgdG9rZW5pemU6IChjb2RlLCBvcHRzKSA9PlxuXG4gICAgICAgIG9wdHMgPSBpbmplY3RGZWF0dXJlIG9wdHNcbiAgICAgICAgb3B0cyA9IGluamVjdE1ldGEgICAgb3B0cyAgIyBuZWVkZWQgdG8gc2hvcnRjdXQgbWV0YXMsIGUuZy4gQHRva2VuIC0+IEBpZiBAdG9rZW4gLi4uXG4gICAgICAgIFxuICAgICAgICBAaW5kZW50ICAgICA9IDAgICAgICAgICAgICAjIFRoZSBjdXJyZW50IGluZGVudGF0aW9uIGxldmVsLlxuICAgICAgICBAYmFzZUluZGVudCA9IDAgICAgICAgICAgICAjIFRoZSBvdmVyYWxsIG1pbmltdW0gaW5kZW50YXRpb24gbGV2ZWxcbiAgICAgICAgQGluZGVidCAgICAgPSAwICAgICAgICAgICAgIyBUaGUgb3Zlci1pbmRlbnRhdGlvbiBhdCB0aGUgY3VycmVudCBsZXZlbC5cbiAgICAgICAgQG91dGRlYnQgICAgPSAwICAgICAgICAgICAgIyBUaGUgdW5kZXItb3V0ZGVudGF0aW9uIGF0IHRoZSBjdXJyZW50IGxldmVsLlxuICAgICAgICBAaW5kZW50cyAgICA9IFtdICAgICAgICAgICAjIFRoZSBzdGFjayBvZiBhbGwgY3VycmVudCBpbmRlbnRhdGlvbiBsZXZlbHMuXG4gICAgICAgIEBlbmRzICAgICAgID0gW10gICAgICAgICAgICMgVGhlIHN0YWNrIGZvciBwYWlyaW5nIHVwIHRva2Vucy5cbiAgICAgICAgQHRva2VucyAgICAgPSBbXSAgICAgICAgICAgIyBTdHJlYW0gb2YgcGFyc2VkIHRva2VucyBpbiB0aGUgZm9ybSBgWydUWVBFJywgdmFsdWUsIGxvY2F0aW9uIGRhdGFdYC5cbiAgICAgICAgQHNlZW5Gb3IgICAgPSBubyAgICAgICAgICAgIyBVc2VkIHRvIHJlY29nbml6ZSBGT1JJTiwgRk9ST0YgYW5kIEZPUkZST00gdG9rZW5zLlxuICAgICAgICBAc2VlbkltcG9ydCA9IG5vICAgICAgICAgICAjIFVzZWQgdG8gcmVjb2duaXplIElNUE9SVCBGUk9NPyBBUz8gdG9rZW5zLlxuICAgICAgICBAc2VlbkV4cG9ydCA9IG5vICAgICAgICAgICAjIFVzZWQgdG8gcmVjb2duaXplIEVYUE9SVCBGUk9NPyBBUz8gdG9rZW5zLlxuICAgICAgICBAaW1wb3J0U3BlY2lmaWVyTGlzdCA9IG5vICAjIFVzZWQgdG8gaWRlbnRpZnkgd2hlbiBpbiBhbiBJTVBPUlQgey4uLn0gRlJPTT8gLi4uXG4gICAgICAgIEBleHBvcnRTcGVjaWZpZXJMaXN0ID0gbm8gICMgVXNlZCB0byBpZGVudGlmeSB3aGVuIGluIGFuIEVYUE9SVCB7Li4ufSBGUk9NPyAuLi5cblxuICAgICAgICBAY2h1bmtMaW5lICAgPSBvcHRzLmxpbmUgb3IgMCAgICAjIFRoZSBzdGFydCBsaW5lIGZvciB0aGUgY3VycmVudCBAY2h1bmsuXG4gICAgICAgIEBjaHVua0NvbHVtbiA9IG9wdHMuY29sdW1uIG9yIDAgICMgVGhlIHN0YXJ0IGNvbHVtbiBvZiB0aGUgY3VycmVudCBAY2h1bmsuXG4gICAgICAgIEBjb2RlID0gQGNsZWFuIGNvZGUgICAgICAgICAgICAgICMgVGhlIHN0cmlwcGVkLCBjbGVhbmVkIG9yaWdpbmFsIHNvdXJjZSBjb2RlLlxuXG4gICAgICAgICMgQXQgZXZlcnkgcG9zaXRpb24sIHJ1biB0aHJvdWdoIHRoaXMgbGlzdCBvZiBhdHRlbXB0ZWQgbWF0Y2hlcywgc2hvcnQtY2lyY3VpdGluZyBpZiBhbnkgb2YgdGhlbSBzdWNjZWVkLiBcbiAgICAgICAgIyBUaGVpciBvcmRlciBkZXRlcm1pbmVzIHByZWNlZGVuY2U6IGBAbGl0ZXJhbFRva2VuYCBpcyB0aGUgZmFsbGJhY2sgY2F0Y2gtYWxsLlxuICAgICAgICBcbiAgICAgICAgQGNodW5rSW5kZXggPSAwXG4gICAgICAgIHdoaWxlIEBjaHVuayA9IEBjb2RlW0BjaHVua0luZGV4Li5dXG4gICAgICAgICAgICBjb25zdW1lZCA9IFxcXG4gICAgICAgICAgICAgICAgICAgICBAZG9jVG9rZW4oKSAgICAgICAgb3JcbiAgICAgICAgICAgICAgICAgICAgIEBpZGVudGlmaWVyVG9rZW4oKSBvclxuICAgICAgICAgICAgICAgICAgICAgQGNvbW1lbnRUb2tlbigpICAgIG9yXG4gICAgICAgICAgICAgICAgICAgICBAd2hpdGVzcGFjZVRva2VuKCkgb3JcbiAgICAgICAgICAgICAgICAgICAgIEBsaW5lVG9rZW4oKSAgICAgICBvclxuICAgICAgICAgICAgICAgICAgICAgQHN0cmluZ1Rva2VuKCkgICAgIG9yXG4gICAgICAgICAgICAgICAgICAgICBAbnVtYmVyVG9rZW4oKSAgICAgb3JcbiAgICAgICAgICAgICAgICAgICAgIEByZWdleFRva2VuKCkgICAgICBvclxuICAgICAgICAgICAgICAgICAgICAgQGpzVG9rZW4oKSAgICAgICAgIG9yXG4gICAgICAgICAgICAgICAgICAgICBAbGl0ZXJhbFRva2VuKClcblxuICAgICAgICAgICAgIyBVcGRhdGUgcG9zaXRpb25cbiAgICAgICAgICAgIFtAY2h1bmtMaW5lLCBAY2h1bmtDb2x1bW5dID0gQGdldExpbmVBbmRDb2x1bW5Gcm9tQ2h1bmsgY29uc3VtZWRcblxuICAgICAgICAgICAgQGNodW5rSW5kZXggKz0gY29uc3VtZWRcblxuICAgICAgICAgICAgcmV0dXJuIHtAdG9rZW5zLCBpbmRleDogQGNodW5rSW5kZXh9IGlmIG9wdHMudW50aWxCYWxhbmNlZCBhbmQgQGVuZHMubGVuZ3RoIGlzIDBcblxuICAgICAgICBAY2xvc2VJbmRlbnRhdGlvbigpXG4gICAgICAgIEBlcnJvciBcIm1pc3NpbmcgI3tlbmQudGFnfVwiLCBlbmQub3JpZ2luWzJdIGlmIGVuZCA9IEBlbmRzLnBvcCgpXG4gICAgICAgIFxuICAgICAgICBpZiBoYXNGZWF0dXJlIG9wdHMsICdyZXdyaXRlJ1xuICAgICAgICAgICAgKG5ldyBSZXdyaXRlcikucmV3cml0ZSBAdG9rZW5zLCBvcHRzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHdhcm4gJ3NraXBwaW5nIHJld3JpdGUhJyMgLCBvcHRzXG5cbiAgICAgICAgQHRva2Vuc1xuXG4gICAgIyBQcmVwcm9jZXNzIHRoZSBjb2RlIHRvIHJlbW92ZSBsZWFkaW5nIGFuZCB0cmFpbGluZyB3aGl0ZXNwYWNlLCBjYXJyaWFnZSByZXR1cm5zLCBldGMuIFxuICAgIFxuICAgIGNsZWFuOiAoY29kZSkgLT5cbiAgICAgICAgXG4gICAgICAgIGNvZGUgPSBjb2RlLnNsaWNlKDEpIGlmIGNvZGUuY2hhckNvZGVBdCgwKSBpcyBCT01cbiAgICAgICAgY29kZSA9IGNvZGUucmVwbGFjZSgvXFxyL2csICcnKS5yZXBsYWNlIFRSQUlMSU5HX1NQQUNFUywgJydcbiAgICAgICAgaWYgV0hJVEVTUEFDRS50ZXN0IGNvZGVcbiAgICAgICAgICAgIGNvZGUgPSBcIlxcbiN7Y29kZX1cIlxuICAgICAgICAgICAgQGNodW5rTGluZS0tXG4gICAgICAgIGNvZGVcblxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAwMCAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgXG4gICAgXG4gICAgZG9jVG9rZW46IC0+XG5cbiAgICAgICAgRE9DID0gL14o4pa4fH4+KShkb2MpKFxccysoW1xcXCJdW15cXG5cXFwiXSpbXFxcIl18W1xcJ11bXlxcblxcJ10qW1xcJ10pKT9bXlxcblxcU10qXFxuL1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIDAgaWYgbm90IG1hdGNoID0gQGNodW5rLm1hdGNoIERPQ1xuICAgICAgICBcbiAgICAgICAgZG9jID0gbWF0Y2hbMF1cbiAgICAgICAgXG4gICAgICAgICMgbWFyY2ggdGhyb3VnaCBhbGwgZm9sbG93aW5nIGxpbmVzIHVudGlsIHNhbWUgb3Igc21hbGxlciBpbmRlbnQgaXMgZm91bmRcbiAgICAgICAgXG4gICAgICAgIHJlc3QgPSBAY2h1bmtbbWF0Y2hbMF0ubGVuZ3RoLi5dXG4gICAgICAgIFxuICAgICAgICBudW1MaW5lcyA9IDBcbiAgICAgICAgbGluZXMgPSByZXN0LnNwbGl0ICdcXG4nXG4gICAgICAgIGZvciBsaW5lIGluIGxpbmVzXG4gICAgICAgICAgICBudW1MaW5lcysrXG4gICAgICAgICAgICBtYXRjaCA9IFdISVRFU1BBQ0UuZXhlYyBsaW5lXG4gICAgICAgICAgICBpZiBtYXRjaFxuICAgICAgICAgICAgICAgIGxpbmVJbmRlbnQgPSBtYXRjaD9bMF0ubGVuZ3RoXG4gICAgICAgICAgICBlbHNlIGlmIGxpbmUubGVuZ3RoXG4gICAgICAgICAgICAgICAgbGluZUluZGVudCA9IDAgIyBsaW5lIHdpdGhvdXQgaW5kZW50YXRpb25cbiAgICAgICAgICAgIGVsc2UgXG4gICAgICAgICAgICAgICAgY29udGludWUgIyBpZ25vcmUgZW1wdHkgbGluZXNcbiAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgbGluZUluZGVudCA8PSBAaW5kZW50XG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgbGluZUluZGVudCA+IEBpbmRlbnQgdGhlbiBudW1MaW5lcysrICMgcHJvYmFibHkgYXQgZW5kIG9mIGlucHV0LCBpbmNsdWRlIGxhc3QgbGluZVxuICAgICAgICBcbiAgICAgICAgY21tdCA9IHJlcGVhdCAnICcsIEBpbmRlbnQrNFxuICAgICAgICBjbW10ICs9IFwiJycnXCJcbiAgICAgICAgYm9keSA9IGxpbmVzWy4uLm51bUxpbmVzLTFdXG4gICAgICAgIGFmdGVyID0gbGluZXNbbnVtTGluZXMtMS4uXVxuICAgICAgICBuZXdDb2RlID0gW2RvYywgY21tdCwgYm9keSwgY21tdCwgYWZ0ZXJdLmZsYXQoKS5qb2luICdcXG4nXG4gICAgICAgIEBjb2RlID0gQGNvZGVbLi4uQGNodW5rSW5kZXhdICsgbmV3Q29kZVxuICAgICAgICAjIOKWuGRiZyBAY29kZVxuICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgICMg4pa4ZGJnICdoZWFkJyBtYXRjaC5pbnB1dFsuLjEwMF1cbiAgICAgICAgXG4gICAgICAgIFxuICAgICMgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAwMDAwMCAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwMDAwICAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgICMgTWF0Y2hlcyBpZGVudGlmeWluZyBsaXRlcmFsczogdmFyaWFibGVzLCBrZXl3b3JkcywgbWV0aG9kIG5hbWVzLCBldGMuXG4gICAgIyBDaGVjayB0byBlbnN1cmUgdGhhdCBKYXZhU2NyaXB0IHJlc2VydmVkIHdvcmRzIGFyZW4ndCBiZWluZyB1c2VkIGFzIGlkZW50aWZpZXJzLiBcbiAgICAjIEJlY2F1c2UgS29mZmVlIHJlc2VydmVzIGEgaGFuZGZ1bCBvZiBrZXl3b3JkcyB0aGF0IGFyZSBhbGxvd2VkIGluIEphdmFTY3JpcHQsIFxuICAgICMgd2UncmUgY2FyZWZ1bCBub3QgdG8gdGFnIHRoZW0gYXMga2V5d29yZHMgd2hlbiByZWZlcmVuY2VkIGFzIHByb3BlcnR5IG5hbWVzIGhlcmUsIFxuICAgICMgc28geW91IGNhbiBzdGlsbCBkbyBgalF1ZXJ5LmlzKClgIGV2ZW4gdGhvdWdoIGBpc2AgbWVhbnMgYD09PWAgb3RoZXJ3aXNlLlxuICAgIFxuICAgIGlkZW50aWZpZXJUb2tlbjogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiAwIHVubGVzcyBtYXRjaCA9IElERU5USUZJRVIuZXhlYyBAY2h1bmtcbiAgICAgICAgW2lucHV0LCBpZCwgY29sb25dID0gbWF0Y2hcblxuICAgICAgICBpZExlbmd0aCA9IGlkLmxlbmd0aCAjIFByZXNlcnZlIGxlbmd0aCBvZiBpZCBmb3IgbG9jYXRpb24gZGF0YVxuICAgICAgICBwb3BwZWRUb2tlbiA9IHVuZGVmaW5lZFxuXG4gICAgICAgIGlmIGlkIGlzICdvd24nIGFuZCBAdGFnKCkgaXMgJ0ZPUidcbiAgICAgICAgICAgIEB0b2tlbiAnT1dOJywgaWRcbiAgICAgICAgICAgIHJldHVybiBpZC5sZW5ndGhcbiAgICAgICAgaWYgaWQgaXMgJ2Zyb20nIGFuZCBAdGFnKCkgaXMgJ1lJRUxEJ1xuICAgICAgICAgICAgQHRva2VuICdGUk9NJywgaWRcbiAgICAgICAgICAgIHJldHVybiBpZC5sZW5ndGhcbiAgICAgICAgaWYgaWQgaXMgJ2FzJyBhbmQgQHNlZW5JbXBvcnRcbiAgICAgICAgICAgIGlmIEB2YWx1ZSgpIGlzICcqJ1xuICAgICAgICAgICAgICAgIEB0b2tlbnNbQHRva2Vucy5sZW5ndGggLSAxXVswXSA9ICdJTVBPUlRfQUxMJ1xuICAgICAgICAgICAgZWxzZSBpZiBAdmFsdWUoKSBpbiBDT0ZGRUVfS0VZV09SRFNcbiAgICAgICAgICAgICAgICBAdG9rZW5zW0B0b2tlbnMubGVuZ3RoIC0gMV1bMF0gPSAnSURFTlRJRklFUidcbiAgICAgICAgICAgIGlmIEB0YWcoKSBpbiBbJ0RFRkFVTFQnICdJTVBPUlRfQUxMJyAnSURFTlRJRklFUiddXG4gICAgICAgICAgICAgICAgQHRva2VuICdBUycsIGlkXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlkLmxlbmd0aFxuICAgICAgICBpZiBpZCBpcyAnYXMnIGFuZCBAc2VlbkV4cG9ydCBhbmQgQHRhZygpIGluIFsnSURFTlRJRklFUicgJ0RFRkFVTFQnXVxuICAgICAgICAgICAgQHRva2VuICdBUycsIGlkXG4gICAgICAgICAgICByZXR1cm4gaWQubGVuZ3RoXG4gICAgICAgIGlmIGlkIGlzICdkZWZhdWx0JyBhbmQgQHNlZW5FeHBvcnQgYW5kIEB0YWcoKSBpbiBbJ0VYUE9SVCcgJ0FTJ11cbiAgICAgICAgICAgIEB0b2tlbiAnREVGQVVMVCcsIGlkXG4gICAgICAgICAgICByZXR1cm4gaWQubGVuZ3RoXG5cbiAgICAgICAgWy4uLiwgcHJldl0gPSBAdG9rZW5zXG5cbiAgICAgICAgdGFnID1cbiAgICAgICAgICAgIGlmIGNvbG9uIG9yIHByZXY/IGFuZCAocHJldlswXSBpbiBbJy4nICc/LicgJzo6JyAnPzo6J10gb3Igbm90IHByZXYuc3BhY2VkIGFuZCBwcmV2WzBdIGlzICdAJylcbiAgICAgICAgICAgICAgICAnUFJPUEVSVFknXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgJ0lERU5USUZJRVInXG5cbiAgICAgICAgaWYgdGFnIGlzICdJREVOVElGSUVSJyBhbmQgaWRbMF0gPT0gJ+KWuCcgYW5kIGlkWzEuLl0gaW4gTUVUQV9LRVlXT1JEU1xuICAgICAgICAgICAgaWYgaWQgPT0gJ+KWuGVsaWYnXG4gICAgICAgICAgICAgICAgQHRva2VuICdNRVRBX0VMU0UnLCAnZWxzZSdcbiAgICAgICAgICAgICAgICBAdG9rZW5zWy0xXS5zcGFjZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgdGFnID0gJ01FVEFfSUYnXG4gICAgICAgICAgICAgICAgaWQgID0gJ2lmJ1xuICAgICAgICAgICAgZWxzZSBpZiBpZCA9PSAn4pa4dGhlbidcbiAgICAgICAgICAgICAgICB0YWcgPSAnVEhFTidcbiAgICAgICAgICAgICAgICBpZCAgPSAndGhlbidcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpZCA9IGlkWzEuLl1cbiAgICAgICAgICAgICAgICB0YWcgPSAnTUVUQV8nICsgaWQudG9VcHBlckNhc2UoKVxuICAgICAgICAgICAgXG4gICAgICAgIGVsc2UgaWYgdGFnIGlzICdJREVOVElGSUVSJyBhbmQgKGlkIGluIEpTX0tFWVdPUkRTIG9yIGlkIGluIENPRkZFRV9LRVlXT1JEUykgYW5kIG5vdCAoQGV4cG9ydFNwZWNpZmllckxpc3QgYW5kIGlkIGluIENPRkZFRV9LRVlXT1JEUylcbiAgICAgICAgICAgIHRhZyA9IGlkLnRvVXBwZXJDYXNlKClcbiAgICAgICAgICAgIGlmIHRhZyBpcyAnV0hFTicgYW5kIEB0YWcoKSBpbiBMSU5FX0JSRUFLXG4gICAgICAgICAgICAgICAgdGFnID0gJ0xFQURJTkdfV0hFTidcbiAgICAgICAgICAgIGVsc2UgaWYgdGFnIGlzICdGT1InXG4gICAgICAgICAgICAgICAgQHNlZW5Gb3IgPSB5ZXNcbiAgICAgICAgICAgIGVsc2UgaWYgdGFnIGlzICdVTkxFU1MnXG4gICAgICAgICAgICAgICAgdGFnID0gJ0lGJ1xuICAgICAgICAgICAgZWxzZSBpZiB0YWcgaXMgJ0lNUE9SVCdcbiAgICAgICAgICAgICAgICBAc2VlbkltcG9ydCA9IHllc1xuICAgICAgICAgICAgZWxzZSBpZiB0YWcgaXMgJ0VYUE9SVCdcbiAgICAgICAgICAgICAgICBAc2VlbkV4cG9ydCA9IHllc1xuICAgICAgICAgICAgZWxzZSBpZiB0YWcgaW4gVU5BUllcbiAgICAgICAgICAgICAgICB0YWcgPSAnVU5BUlknXG4gICAgICAgICAgICBlbHNlIGlmIHRhZyBpbiBSRUxBVElPTlxuICAgICAgICAgICAgICAgIGlmIHRhZyAhPSAnSU5TVEFOQ0VPRicgYW5kIEBzZWVuRm9yXG4gICAgICAgICAgICAgICAgICAgIHRhZyA9ICdGT1InICsgdGFnXG4gICAgICAgICAgICAgICAgICAgIEBzZWVuRm9yID0gbm9cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHRhZyA9ICdSRUxBVElPTidcbiAgICAgICAgICAgICAgICAgICAgaWYgQHZhbHVlKCkgaXMgJyEnXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3BwZWRUb2tlbiA9IEB0b2tlbnMucG9wKClcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gJyEnICsgaWRcbiAgICAgICAgZWxzZSBpZiB0YWcgaXMgJ0lERU5USUZJRVInIGFuZCBAc2VlbkZvciBhbmQgaWQgaXMgJ2Zyb20nIGFuZCBpc0ZvckZyb20ocHJldilcbiAgICAgICAgICAgIHRhZyA9ICdGT1JGUk9NJ1xuICAgICAgICAgICAgQHNlZW5Gb3IgPSBub1xuXG4gICAgICAgIGlmIHRhZyBpcyAnSURFTlRJRklFUicgYW5kIGlkIGluIFJFU0VSVkVEXG4gICAgICAgICAgICBAZXJyb3IgXCJyZXNlcnZlZCB3b3JkICcje2lkfSdcIiwgbGVuZ3RoOmlkLmxlbmd0aFxuXG4gICAgICAgIHVubGVzcyB0YWcgaXMgJ1BST1BFUlRZJ1xuICAgICAgICAgICAgaWYgaWQgaW4gQ09GRkVFX0FMSUFTRVNcbiAgICAgICAgICAgICAgICBhbGlhcyA9IGlkXG4gICAgICAgICAgICAgICAgaWQgPSBDT0ZGRUVfQUxJQVNfTUFQW2lkXVxuICAgICAgICAgICAgdGFnID0gc3dpdGNoIGlkXG4gICAgICAgICAgICAgICAgd2hlbiAnIScgICAgICAgICAgICAgICAgICAgIHRoZW4gJ1VOQVJZJ1xuICAgICAgICAgICAgICAgIHdoZW4gJz09JywgJyE9JyAgICAgICAgICAgICB0aGVuICdDT01QQVJFJ1xuICAgICAgICAgICAgICAgIHdoZW4gJ3RydWUnLCAnZmFsc2UnICAgICAgICB0aGVuICdCT09MJ1xuICAgICAgICAgICAgICAgIHdoZW4gJyYmJywgJ3x8JyAgICAgICAgICAgICB0aGVuIGlkXG4gICAgICAgICAgICAgICAgd2hlbiAnYnJlYWsnLCAnY29udGludWUnLCAnZGVidWdnZXInIHRoZW4gJ1NUQVRFTUVOVCdcbiAgICAgICAgICAgICAgICBlbHNlICAgIHRhZ1xuXG4gICAgICAgIHRhZ1Rva2VuID0gQHRva2VuIHRhZywgaWQsIDAsIGlkTGVuZ3RoXG4gICAgICAgIHRhZ1Rva2VuLm9yaWdpbiA9IFt0YWcsIGFsaWFzLCB0YWdUb2tlblsyXV0gaWYgYWxpYXNcbiAgICAgICAgaWYgcG9wcGVkVG9rZW5cbiAgICAgICAgICAgIFt0YWdUb2tlblsyXS5maXJzdF9saW5lLCB0YWdUb2tlblsyXS5maXJzdF9jb2x1bW5dID1cbiAgICAgICAgICAgICAgICBbcG9wcGVkVG9rZW5bMl0uZmlyc3RfbGluZSwgcG9wcGVkVG9rZW5bMl0uZmlyc3RfY29sdW1uXVxuICAgICAgICBpZiBjb2xvblxuICAgICAgICAgICAgY29sb25PZmZzZXQgPSBpbnB1dC5sYXN0SW5kZXhPZiAnOidcbiAgICAgICAgICAgIEB0b2tlbiAnOicsICc6JywgY29sb25PZmZzZXQsIGNvbG9uLmxlbmd0aFxuXG4gICAgICAgIGlucHV0Lmxlbmd0aFxuXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcblxuICAgICMgTWF0Y2hlcyBudW1iZXJzLCBpbmNsdWRpbmcgZGVjaW1hbHMsIGhleCwgYW5kIGV4cG9uZW50aWFsIG5vdGF0aW9uLlxuICAgICMgQmUgY2FyZWZ1bCBub3QgdG8gaW50ZXJmZXJlIHdpdGggcmFuZ2VzLWluLXByb2dyZXNzLlxuICAgIFxuICAgIG51bWJlclRva2VuOiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIDAgdW5sZXNzIG1hdGNoID0gTlVNQkVSLmV4ZWMgQGNodW5rXG5cbiAgICAgICAgbnVtYmVyID0gbWF0Y2hbMF1cbiAgICAgICAgbGV4ZWRMZW5ndGggPSBudW1iZXIubGVuZ3RoXG5cbiAgICAgICAgc3dpdGNoXG4gICAgICAgICAgICB3aGVuIC9eMFtCT1hdLy50ZXN0IG51bWJlclxuICAgICAgICAgICAgICAgIEBlcnJvciBcInJhZGl4IHByZWZpeCBpbiAnI3tudW1iZXJ9JyBtdXN0IGJlIGxvd2VyY2FzZVwiLCBvZmZzZXQ6IDFcbiAgICAgICAgICAgIHdoZW4gL14oPyEweCkuKkUvLnRlc3QgbnVtYmVyXG4gICAgICAgICAgICAgICAgQGVycm9yIFwiZXhwb25lbnRpYWwgbm90YXRpb24gaW4gJyN7bnVtYmVyfScgbXVzdCBiZSBpbmRpY2F0ZWQgd2l0aCBhIGxvd2VyY2FzZSAnZSdcIixcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiBudW1iZXIuaW5kZXhPZignRScpXG4gICAgICAgICAgICB3aGVuIC9eMFxcZCpbODldLy50ZXN0IG51bWJlclxuICAgICAgICAgICAgICAgIEBlcnJvciBcImRlY2ltYWwgbGl0ZXJhbCAnI3tudW1iZXJ9JyBtdXN0IG5vdCBiZSBwcmVmaXhlZCB3aXRoICcwJ1wiLCBsZW5ndGg6IGxleGVkTGVuZ3RoXG4gICAgICAgICAgICB3aGVuIC9eMFxcZCsvLnRlc3QgbnVtYmVyXG4gICAgICAgICAgICAgICAgQGVycm9yIFwib2N0YWwgbGl0ZXJhbCAnI3tudW1iZXJ9JyBtdXN0IGJlIHByZWZpeGVkIHdpdGggJzBvJ1wiLCBsZW5ndGg6IGxleGVkTGVuZ3RoXG5cbiAgICAgICAgYmFzZSA9IHN3aXRjaCBudW1iZXIuY2hhckF0IDFcbiAgICAgICAgICAgIHdoZW4gJ2InIHRoZW4gMlxuICAgICAgICAgICAgd2hlbiAnbycgdGhlbiA4XG4gICAgICAgICAgICB3aGVuICd4JyB0aGVuIDE2XG4gICAgICAgICAgICBlbHNlIG51bGxcbiAgICAgICAgbnVtYmVyVmFsdWUgPSBpZiBiYXNlPyB0aGVuIHBhcnNlSW50KG51bWJlclsyLi5dLCBiYXNlKSBlbHNlIHBhcnNlRmxvYXQobnVtYmVyKVxuICAgICAgICBpZiBudW1iZXIuY2hhckF0KDEpIGluIFsnYicsICdvJ11cbiAgICAgICAgICAgIG51bWJlciA9IFwiMHgje251bWJlclZhbHVlLnRvU3RyaW5nIDE2fVwiXG5cbiAgICAgICAgdGFnID0gaWYgbnVtYmVyVmFsdWUgaXMgSW5maW5pdHkgdGhlbiAnSU5GSU5JVFknIGVsc2UgJ05VTUJFUidcbiAgICAgICAgQHRva2VuIHRhZywgbnVtYmVyLCAwLCBsZXhlZExlbmd0aFxuICAgICAgICBsZXhlZExlbmd0aFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICAjIE1hdGNoZXMgc3RyaW5ncywgaW5jbHVkaW5nIG11bHRpLWxpbmUgc3RyaW5ncywgYXMgd2VsbCBhcyBoZXJlZG9jcywgd2l0aCBvciB3aXRob3V0IGludGVycG9sYXRpb24uXG4gICAgXG4gICAgc3RyaW5nVG9rZW46IC0+XG4gICAgICAgIFxuICAgICAgICBbcXVvdGVdID0gU1RSSU5HX1NUQVJULmV4ZWMoQGNodW5rKSB8fCBbXVxuICAgICAgICByZXR1cm4gMCBpZiBub3QgcXVvdGVcblxuICAgICAgICAjIElmIHRoZSBwcmVjZWRpbmcgdG9rZW4gaXMgYGZyb21gIGFuZCB0aGlzIGlzIGFuIGltcG9ydCBvciBleHBvcnQgc3RhdGVtZW50LCBwcm9wZXJseSB0YWcgdGhlIGBmcm9tYC5cbiAgICAgICAgXG4gICAgICAgIGlmIEB0b2tlbnMubGVuZ3RoIGFuZCBAdmFsdWUoKSBpcyAnZnJvbScgYW5kIChAc2VlbkltcG9ydCBvciBAc2VlbkV4cG9ydClcbiAgICAgICAgICAgIEB0b2tlbnNbQHRva2Vucy5sZW5ndGggLSAxXVswXSA9ICdGUk9NJ1xuXG4gICAgICAgIHJlZ2V4ID0gc3dpdGNoIHF1b3RlXG4gICAgICAgICAgICB3aGVuIFwiJ1wiICAgdGhlbiBTVFJJTkdfU0lOR0xFXG4gICAgICAgICAgICB3aGVuICdcIicgICB0aGVuIFNUUklOR19ET1VCTEVcbiAgICAgICAgICAgIHdoZW4gXCInJydcIiB0aGVuIEhFUkVET0NfU0lOR0xFXG4gICAgICAgICAgICB3aGVuICdcIlwiXCInIHRoZW4gSEVSRURPQ19ET1VCTEVcbiAgICAgICAgaGVyZWRvYyA9IHF1b3RlLmxlbmd0aCBpcyAzXG5cbiAgICAgICAge3Rva2VucywgaW5kZXg6IGVuZH0gPSBAbWF0Y2hXaXRoSW50ZXJwb2xhdGlvbnMgcmVnZXgsIHF1b3RlXG4gICAgICAgICQgPSB0b2tlbnMubGVuZ3RoIC0gMVxuXG4gICAgICAgIGRlbGltaXRlciA9IHF1b3RlLmNoYXJBdCgwKVxuICAgICAgICBpZiBoZXJlZG9jXG4gICAgICAgICAgICAjIEZpbmQgdGhlIHNtYWxsZXN0IGluZGVudGF0aW9uLiBJdCB3aWxsIGJlIHJlbW92ZWQgZnJvbSBhbGwgbGluZXMgbGF0ZXIuXG4gICAgICAgICAgICBpbmRlbnQgPSBudWxsXG4gICAgICAgICAgICBkb2MgPSAodG9rZW5bMV0gZm9yIHRva2VuLCBpIGluIHRva2VucyB3aGVuIHRva2VuWzBdIGlzICdORU9TVFJJTkcnKS5qb2luICcje30nXG4gICAgICAgICAgICB3aGlsZSBtYXRjaCA9IEhFUkVET0NfSU5ERU5ULmV4ZWMgZG9jXG4gICAgICAgICAgICAgICAgYXR0ZW1wdCA9IG1hdGNoWzFdXG4gICAgICAgICAgICAgICAgaW5kZW50ID0gYXR0ZW1wdCBpZiBpbmRlbnQgaXMgbnVsbCBvciAwIDwgYXR0ZW1wdC5sZW5ndGggPCBpbmRlbnQubGVuZ3RoXG4gICAgICAgICAgICBpbmRlbnRSZWdleCA9IC8vLyBcXG4je2luZGVudH0gLy8vZyBpZiBpbmRlbnRcbiAgICAgICAgICAgIEBtZXJnZUludGVycG9sYXRpb25Ub2tlbnMgdG9rZW5zLCB7ZGVsaW1pdGVyfSwgKHZhbHVlLCBpKSA9PlxuICAgICAgICAgICAgICAgIHZhbHVlID0gQGZvcm1hdFN0cmluZyB2YWx1ZSwgZGVsaW1pdGVyOiBxdW90ZVxuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZSBpbmRlbnRSZWdleCwgJ1xcbicgaWYgaW5kZW50UmVnZXhcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UgTEVBRElOR19CTEFOS19MSU5FLCAgJycgaWYgaSBpcyAwXG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlIFRSQUlMSU5HX0JMQU5LX0xJTkUsICcnIGlmIGkgaXMgJFxuICAgICAgICAgICAgICAgIHZhbHVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBtZXJnZUludGVycG9sYXRpb25Ub2tlbnMgdG9rZW5zLCB7ZGVsaW1pdGVyfSwgKHZhbHVlLCBpKSA9PlxuICAgICAgICAgICAgICAgIHZhbHVlID0gQGZvcm1hdFN0cmluZyB2YWx1ZSwgZGVsaW1pdGVyOiBxdW90ZVxuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZSBTSU1QTEVfU1RSSU5HX09NSVQsIChtYXRjaCwgb2Zmc2V0KSAtPlxuICAgICAgICAgICAgICAgICAgICBpZiAoaSBpcyAwIGFuZCBvZmZzZXQgaXMgMCkgb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAoaSBpcyAkIGFuZCBvZmZzZXQgKyBtYXRjaC5sZW5ndGggaXMgdmFsdWUubGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICAgICAgJydcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgJyAnXG4gICAgICAgICAgICAgICAgdmFsdWVcbiAgICAgICAgZW5kXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAgICAwMDAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgY29tbWVudFRva2VuOiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIDAgdW5sZXNzIG1hdGNoID0gQGNodW5rLm1hdGNoIENPTU1FTlRcbiAgICAgICAgW2NvbW1lbnQsIGhlcmVdID0gbWF0Y2hcbiAgICAgICAgaWYgaGVyZVxuICAgICAgICAgICAgaWYgbWF0Y2ggPSBIRVJFQ09NTUVOVF9JTExFR0FMLmV4ZWMgY29tbWVudFxuICAgICAgICAgICAgICAgIEBlcnJvciBcImJsb2NrIGNvbW1lbnRzIGNhbm5vdCBjb250YWluICN7bWF0Y2hbMF19XCIsXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldDogbWF0Y2guaW5kZXgsIGxlbmd0aDogbWF0Y2hbMF0ubGVuZ3RoXG4gICAgICAgICAgICBpZiBoZXJlLmluZGV4T2YoJ1xcbicpID49IDBcbiAgICAgICAgICAgICAgICBoZXJlID0gaGVyZS5yZXBsYWNlIC8vLyBcXG4gI3tyZXBlYXQgJyAnLCBAaW5kZW50fSAvLy9nLCAnXFxuJ1xuICAgICAgICAgICAgQHRva2VuICdIRVJFQ09NTUVOVCcsIGhlcmUsIDAsIGNvbW1lbnQubGVuZ3RoXG4gICAgICAgIGNvbW1lbnQubGVuZ3RoXG4gICAgICAgIFxuICAgICMgICAgICAgMDAwICAgMDAwMDAwMCAgXG4gICAgIyAgICAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjICAgICAgIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICAjIE1hdGNoZXMgSmF2YVNjcmlwdCBpbnRlcnBvbGF0ZWQgZGlyZWN0bHkgaW50byB0aGUgc291cmNlIHZpYSBiYWNrdGlja3MuXG4gICAgXG4gICAganNUb2tlbjogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiAwIHVubGVzcyBAY2h1bmsuY2hhckF0KDApIGlzICdgJyBhbmRcbiAgICAgICAgICAgIChtYXRjaCA9IEhFUkVfSlNUT0tFTi5leGVjKEBjaHVuaykgb3IgSlNUT0tFTi5leGVjKEBjaHVuaykpXG4gICAgICAgICMgQ29udmVydCBlc2NhcGVkIGJhY2t0aWNrcyB0byBiYWNrdGlja3MsIGFuZCBlc2NhcGVkIGJhY2tzbGFzaGVzXG4gICAgICAgICMganVzdCBiZWZvcmUgZXNjYXBlZCBiYWNrdGlja3MgdG8gYmFja3NsYXNoZXNcbiAgICAgICAgc2NyaXB0ID0gbWF0Y2hbMV0ucmVwbGFjZSAvXFxcXCsoYHwkKS9nLCAoc3RyaW5nKSAtPlxuICAgICAgICAgICAgIyBgc3RyaW5nYCBpcyBhbHdheXMgYSB2YWx1ZSBsaWtlICdcXGAnLCAnXFxcXFxcYCcsICdcXFxcXFxcXFxcYCcsIGV0Yy5cbiAgICAgICAgICAgICMgQnkgcmVkdWNpbmcgaXQgdG8gaXRzIGxhdHRlciBoYWxmLCB3ZSB0dXJuICdcXGAnIHRvICdgJywgJ1xcXFxcXGAnIHRvICdcXGAnLCBldGMuXG4gICAgICAgICAgICBzdHJpbmdbLU1hdGguY2VpbChzdHJpbmcubGVuZ3RoIC8gMikuLl1cbiAgICAgICAgQHRva2VuICdKUycsIHNjcmlwdCwgMCwgbWF0Y2hbMF0ubGVuZ3RoXG4gICAgICAgIG1hdGNoWzBdLmxlbmd0aFxuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMCAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgICAgMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICAjIE1hdGNoZXMgcmVndWxhciBleHByZXNzaW9uIGxpdGVyYWxzLCBhcyB3ZWxsIGFzIG11bHRpbGluZSBleHRlbmRlZCBvbmVzLlxuICAgICMgTGV4aW5nIHJlZ3VsYXIgZXhwcmVzc2lvbnMgaXMgZGlmZmljdWx0IHRvIGRpc3Rpbmd1aXNoIGZyb20gZGl2aXNpb24sIFxuICAgICMgc28gd2UgYm9ycm93IHNvbWUgYmFzaWMgaGV1cmlzdGljcyBmcm9tIEphdmFTY3JpcHQgYW5kIFJ1YnkuXG4gICAgXG4gICAgcmVnZXhUb2tlbjogLT5cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaFxuICAgICAgICAgICAgd2hlbiBtYXRjaCA9IFJFR0VYX0lMTEVHQUwuZXhlYyBAY2h1bmtcbiAgICAgICAgICAgICAgICBAZXJyb3IgXCJyZWd1bGFyIGV4cHJlc3Npb25zIGNhbm5vdCBiZWdpbiB3aXRoICN7bWF0Y2hbMl19XCIsXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldDogbWF0Y2guaW5kZXggKyBtYXRjaFsxXS5sZW5ndGhcbiAgICAgICAgICAgIHdoZW4gbWF0Y2ggPSBAbWF0Y2hXaXRoSW50ZXJwb2xhdGlvbnMgSEVSRUdFWCwgJy8vLydcbiAgICAgICAgICAgICAgICB7dG9rZW5zLCBpbmRleH0gPSBtYXRjaFxuICAgICAgICAgICAgd2hlbiBtYXRjaCA9IFJFR0VYLmV4ZWMgQGNodW5rXG4gICAgICAgICAgICAgICAgW3JlZ2V4LCBib2R5LCBjbG9zZWRdID0gbWF0Y2hcbiAgICAgICAgICAgICAgICBAdmFsaWRhdGVFc2NhcGVzIGJvZHksIGlzUmVnZXg6IHllcywgb2Zmc2V0SW5DaHVuazogMVxuICAgICAgICAgICAgICAgIGJvZHkgPSBAZm9ybWF0UmVnZXggYm9keSwgZGVsaW1pdGVyOiAnLydcbiAgICAgICAgICAgICAgICBpbmRleCA9IHJlZ2V4Lmxlbmd0aFxuICAgICAgICAgICAgICAgIFsuLi4sIHByZXZdID0gQHRva2Vuc1xuICAgICAgICAgICAgICAgIGlmIHByZXZcbiAgICAgICAgICAgICAgICAgICAgaWYgcHJldi5zcGFjZWQgYW5kIHByZXZbMF0gaW4gQ0FMTEFCTEVcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAwIGlmIG5vdCBjbG9zZWQgb3IgUE9TU0lCTFlfRElWSVNJT04udGVzdCByZWdleFxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIHByZXZbMF0gaW4gTk9UX1JFR0VYXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMFxuICAgICAgICAgICAgICAgIEBlcnJvciAnbWlzc2luZyAvICh1bmNsb3NlZCByZWdleCknIHVubGVzcyBjbG9zZWRcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gMFxuXG4gICAgICAgIFtmbGFnc10gPSBSRUdFWF9GTEFHUy5leGVjIEBjaHVua1tpbmRleC4uXVxuICAgICAgICBlbmQgPSBpbmRleCArIGZsYWdzLmxlbmd0aFxuICAgICAgICBvcmlnaW4gPSBAbWFrZVRva2VuICdSRUdFWCcsIG51bGwsIDAsIGVuZFxuICAgICAgICBzd2l0Y2hcbiAgICAgICAgICAgIHdoZW4gbm90IFZBTElEX0ZMQUdTLnRlc3QgZmxhZ3NcbiAgICAgICAgICAgICAgICBAZXJyb3IgXCJpbnZhbGlkIHJlZ3VsYXIgZXhwcmVzc2lvbiBmbGFncyAje2ZsYWdzfVwiLCBvZmZzZXQ6IGluZGV4LCBsZW5ndGg6IGZsYWdzLmxlbmd0aFxuICAgICAgICAgICAgd2hlbiByZWdleCBvciB0b2tlbnMubGVuZ3RoIGlzIDFcbiAgICAgICAgICAgICAgICBib2R5ID89IEBmb3JtYXRIZXJlZ2V4IHRva2Vuc1swXVsxXVxuICAgICAgICAgICAgICAgIEB0b2tlbiAnUkVHRVgnLCBcIiN7QG1ha2VEZWxpbWl0ZWRMaXRlcmFsIGJvZHksIGRlbGltaXRlcjogJy8nfSN7ZmxhZ3N9XCIsIDAsIGVuZCwgb3JpZ2luXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHRva2VuICdSRUdFWF9TVEFSVCcsICcoJywgMCwgMCwgb3JpZ2luXG4gICAgICAgICAgICAgICAgQHRva2VuICdJREVOVElGSUVSJywgJ1JlZ0V4cCcsIDAsIDBcbiAgICAgICAgICAgICAgICBAdG9rZW4gJ0NBTExfU1RBUlQnLCAnKCcsIDAsIDBcbiAgICAgICAgICAgICAgICBAbWVyZ2VJbnRlcnBvbGF0aW9uVG9rZW5zIHRva2Vucywge2RlbGltaXRlcjogJ1wiJywgZG91YmxlOiB5ZXN9LCBAZm9ybWF0SGVyZWdleFxuICAgICAgICAgICAgICAgIGlmIGZsYWdzXG4gICAgICAgICAgICAgICAgICAgIEB0b2tlbiAnLCcsICcsJywgaW5kZXggLSAxLCAwXG4gICAgICAgICAgICAgICAgICAgIEB0b2tlbiAnU1RSSU5HJywgJ1wiJyArIGZsYWdzICsgJ1wiJywgaW5kZXggLSAxLCBmbGFncy5sZW5ndGhcbiAgICAgICAgICAgICAgICBAdG9rZW4gJyknLCAnKScsIGVuZCAtIDEsIDBcbiAgICAgICAgICAgICAgICBAdG9rZW4gJ1JFR0VYX0VORCcsICcpJywgZW5kIC0gMSwgMFxuXG4gICAgICAgIGVuZFxuXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICAjIE1hdGNoZXMgbmV3bGluZXMsIGluZGVudHMsIGFuZCBvdXRkZW50cywgYW5kIGRldGVybWluZXMgd2hpY2ggaXMgd2hpY2guXG4gICAgIyBJZiB3ZSBjYW4gZGV0ZWN0IHRoYXQgdGhlIGN1cnJlbnQgbGluZSBpcyBjb250aW51ZWQgb250byB0aGUgbmV4dCBsaW5lLFxuICAgICMgdGhlbiB0aGUgbmV3bGluZSBpcyBzdXBwcmVzc2VkOlxuICAgICNcbiAgICAjICAgICAgICAgICBlbGVtZW50c1xuICAgICMgICAgICAgICAgICAgICAuZWFjaCggLi4uIClcbiAgICAjICAgICAgICAgICAgICAgLm1hcCggLi4uIClcbiAgICAjXG4gICAgIyBLZWVwcyB0cmFjayBvZiB0aGUgbGV2ZWwgb2YgaW5kZW50YXRpb24sIGJlY2F1c2UgYSBzaW5nbGUgb3V0ZGVudCB0b2tlblxuICAgICMgY2FuIGNsb3NlIG11bHRpcGxlIGluZGVudHMsIHNvIHdlIG5lZWQgdG8ga25vdyBob3cgZmFyIGluIHdlIGhhcHBlbiB0byBiZS5cbiAgICBcbiAgICBsaW5lVG9rZW46IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gMCB1bmxlc3MgbWF0Y2ggPSBNVUxUSV9ERU5ULmV4ZWMgQGNodW5rXG4gICAgICAgIGluZGVudCA9IG1hdGNoWzBdXG5cbiAgICAgICAgQHNlZW5Gb3IgICAgPSBub1xuICAgICAgICBAc2VlbkltcG9ydCA9IG5vIHVubGVzcyBAaW1wb3J0U3BlY2lmaWVyTGlzdFxuICAgICAgICBAc2VlbkV4cG9ydCA9IG5vIHVubGVzcyBAZXhwb3J0U3BlY2lmaWVyTGlzdFxuXG4gICAgICAgIHNpemUgPSBpbmRlbnQubGVuZ3RoIC0gMSAtIGluZGVudC5sYXN0SW5kZXhPZiAnXFxuJ1xuICAgICAgICBub05ld2xpbmVzID0gQHVuZmluaXNoZWQoKVxuXG4gICAgICAgIGlmIHNpemUgLSBAaW5kZWJ0IGlzIEBpbmRlbnRcbiAgICAgICAgICAgIGlmIG5vTmV3bGluZXMgdGhlbiBAc3VwcHJlc3NOZXdsaW5lcygpIGVsc2UgQG5ld2xpbmVUb2tlbiAwXG4gICAgICAgICAgICByZXR1cm4gaW5kZW50Lmxlbmd0aFxuXG4gICAgICAgIGlmIHNpemUgPiBAaW5kZW50XG4gICAgICAgICAgICBpZiBub05ld2xpbmVzXG4gICAgICAgICAgICAgICAgQGluZGVidCA9IHNpemUgLSBAaW5kZW50XG4gICAgICAgICAgICAgICAgQHN1cHByZXNzTmV3bGluZXMoKVxuICAgICAgICAgICAgICAgIHJldHVybiBpbmRlbnQubGVuZ3RoXG4gICAgICAgICAgICB1bmxlc3MgQHRva2Vucy5sZW5ndGhcbiAgICAgICAgICAgICAgICBAYmFzZUluZGVudCA9IEBpbmRlbnQgPSBzaXplXG4gICAgICAgICAgICAgICAgcmV0dXJuIGluZGVudC5sZW5ndGhcbiAgICAgICAgICAgIGRpZmYgPSBzaXplIC0gQGluZGVudCArIEBvdXRkZWJ0XG4gICAgICAgICAgICBAdG9rZW4gJ0lOREVOVCcsIGRpZmYsIGluZGVudC5sZW5ndGggLSBzaXplLCBzaXplXG4gICAgICAgICAgICBAaW5kZW50cy5wdXNoIGRpZmZcbiAgICAgICAgICAgIEBlbmRzLnB1c2gge3RhZzogJ09VVERFTlQnfVxuICAgICAgICAgICAgQG91dGRlYnQgPSBAaW5kZWJ0ID0gMFxuICAgICAgICAgICAgQGluZGVudCA9IHNpemVcbiAgICAgICAgZWxzZSBpZiBzaXplIDwgQGJhc2VJbmRlbnRcbiAgICAgICAgICAgIEBlcnJvciAnbWlzc2luZyBpbmRlbnRhdGlvbicsIG9mZnNldDogaW5kZW50Lmxlbmd0aFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAaW5kZWJ0ID0gMFxuICAgICAgICAgICAgQG91dGRlbnRUb2tlbiBAaW5kZW50IC0gc2l6ZSwgbm9OZXdsaW5lcywgaW5kZW50Lmxlbmd0aFxuICAgICAgICBpbmRlbnQubGVuZ3RoXG5cbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICAjIFJlY29yZCBhbiBvdXRkZW50IHRva2VuIG9yIG11bHRpcGxlIHRva2VucywgaWYgd2UgaGFwcGVuIHRvIGJlIG1vdmluZyBiYWNrXG4gICAgIyBpbndhcmRzIHBhc3Qgc2V2ZXJhbCByZWNvcmRlZCBpbmRlbnRzLiBTZXRzIG5ldyBAaW5kZW50IHZhbHVlLlxuICAgIFxuICAgIG91dGRlbnRUb2tlbjogKG1vdmVPdXQsIG5vTmV3bGluZXMsIG91dGRlbnRMZW5ndGgpIC0+XG4gICAgICAgIFxuICAgICAgICBkZWNyZWFzZWRJbmRlbnQgPSBAaW5kZW50IC0gbW92ZU91dFxuICAgICAgICB3aGlsZSBtb3ZlT3V0ID4gMFxuICAgICAgICAgICAgbGFzdEluZGVudCA9IEBpbmRlbnRzW0BpbmRlbnRzLmxlbmd0aCAtIDFdXG4gICAgICAgICAgICBpZiBub3QgbGFzdEluZGVudFxuICAgICAgICAgICAgICAgIG1vdmVPdXQgPSAwXG4gICAgICAgICAgICBlbHNlIGlmIGxhc3RJbmRlbnQgaXMgQG91dGRlYnRcbiAgICAgICAgICAgICAgICBtb3ZlT3V0IC09IEBvdXRkZWJ0XG4gICAgICAgICAgICAgICAgQG91dGRlYnQgPSAwXG4gICAgICAgICAgICBlbHNlIGlmIGxhc3RJbmRlbnQgPCBAb3V0ZGVidFxuICAgICAgICAgICAgICAgIEBvdXRkZWJ0IC09IGxhc3RJbmRlbnRcbiAgICAgICAgICAgICAgICBtb3ZlT3V0ICAtPSBsYXN0SW5kZW50XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgZGVudCA9IEBpbmRlbnRzLnBvcCgpICsgQG91dGRlYnRcbiAgICAgICAgICAgICAgICBpZiBvdXRkZW50TGVuZ3RoIGFuZCBAY2h1bmtbb3V0ZGVudExlbmd0aF0gaW4gSU5ERU5UQUJMRV9DTE9TRVJTXG4gICAgICAgICAgICAgICAgICAgIGRlY3JlYXNlZEluZGVudCAtPSBkZW50IC0gbW92ZU91dFxuICAgICAgICAgICAgICAgICAgICBtb3ZlT3V0ID0gZGVudFxuICAgICAgICAgICAgICAgIEBvdXRkZWJ0ID0gMFxuICAgICAgICAgICAgICAgICMgcGFpciBtaWdodCBjYWxsIG91dGRlbnRUb2tlbiwgc28gcHJlc2VydmUgZGVjcmVhc2VkSW5kZW50XG4gICAgICAgICAgICAgICAgQHBhaXIgJ09VVERFTlQnXG4gICAgICAgICAgICAgICAgQHRva2VuICdPVVRERU5UJywgbW92ZU91dCwgMCwgb3V0ZGVudExlbmd0aFxuICAgICAgICAgICAgICAgIG1vdmVPdXQgLT0gZGVudFxuICAgICAgICBAb3V0ZGVidCAtPSBtb3ZlT3V0IGlmIGRlbnRcbiAgICAgICAgQHRva2Vucy5wb3AoKSB3aGlsZSBAdmFsdWUoKSBpcyAnOydcblxuICAgICAgICBAdG9rZW4gJ1RFUk1JTkFUT1InLCAnXFxuJywgb3V0ZGVudExlbmd0aCwgMCB1bmxlc3MgQHRhZygpIGlzICdURVJNSU5BVE9SJyBvciBub05ld2xpbmVzXG4gICAgICAgIEBpbmRlbnQgPSBkZWNyZWFzZWRJbmRlbnRcbiAgICAgICAgdGhpc1xuXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMCAgICAgMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgXG4gICAgIyBNYXRjaGVzIGFuZCBjb25zdW1lcyBub24tbWVhbmluZ2Z1bCB3aGl0ZXNwYWNlLiBUYWcgdGhlIHByZXZpb3VzIHRva2VuXG4gICAgIyBhcyBiZWluZyDigJxzcGFjZWTigJ0sIGJlY2F1c2UgdGhlcmUgYXJlIHNvbWUgY2FzZXMgd2hlcmUgaXQgbWFrZXMgYSBkaWZmZXJlbmNlLlxuICAgIFxuICAgIHdoaXRlc3BhY2VUb2tlbjogLT5cbiAgICAgICAgcmV0dXJuIDAgdW5sZXNzIChtYXRjaCA9IFdISVRFU1BBQ0UuZXhlYyBAY2h1bmspIG9yIChubGluZSA9IEBjaHVuay5jaGFyQXQoMCkgaXMgJ1xcbicpXG4gICAgICAgIFsuLi4sIHByZXZdID0gQHRva2Vuc1xuICAgICAgICBwcmV2W2lmIG1hdGNoIHRoZW4gJ3NwYWNlZCcgZWxzZSAnbmV3TGluZSddID0gdHJ1ZSBpZiBwcmV2XG4gICAgICAgIGlmIG1hdGNoIHRoZW4gbWF0Y2hbMF0ubGVuZ3RoIGVsc2UgMFxuXG4gICAgIyBHZW5lcmF0ZSBhIG5ld2xpbmUgdG9rZW4uIENvbnNlY3V0aXZlIG5ld2xpbmVzIGdldCBtZXJnZWQgdG9nZXRoZXIuXG4gICAgXG4gICAgbmV3bGluZVRva2VuOiAob2Zmc2V0KSAtPlxuICAgICAgICBAdG9rZW5zLnBvcCgpIHdoaWxlIEB2YWx1ZSgpIGlzICc7J1xuICAgICAgICBAdG9rZW4gJ1RFUk1JTkFUT1InLCAnXFxuJywgb2Zmc2V0LCAwIHVubGVzcyBAdGFnKCkgaXMgJ1RFUk1JTkFUT1InXG4gICAgICAgIHRoaXNcblxuICAgICMgVXNlIGEgYFxcYCBhdCBhIGxpbmUtZW5kaW5nIHRvIHN1cHByZXNzIHRoZSBuZXdsaW5lLlxuICAgICMgVGhlIHNsYXNoIGlzIHJlbW92ZWQgaGVyZSBvbmNlIGl0cyBqb2IgaXMgZG9uZS5cbiAgICBcbiAgICBzdXBwcmVzc05ld2xpbmVzOiAtPlxuICAgICAgICBAdG9rZW5zLnBvcCgpIGlmIEB2YWx1ZSgpIGlzICdcXFxcJ1xuICAgICAgICB0aGlzXG5cbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgIFxuICAgICMgMDAwICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgXG4gICAgIyAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIFxuICAgICMgMDAwMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgXG4gICAgXG4gICAgIyBXZSB0cmVhdCBhbGwgb3RoZXIgc2luZ2xlIGNoYXJhY3RlcnMgYXMgYSB0b2tlbi4gRS5nLjogYCggKSAsIC4gIWBcbiAgICAjIE11bHRpLWNoYXJhY3RlciBvcGVyYXRvcnMgYXJlIGFsc28gbGl0ZXJhbCB0b2tlbnMsIHNvIHRoYXQgSmlzb24gY2FuIGFzc2lnblxuICAgICMgdGhlIHByb3BlciBvcmRlciBvZiBvcGVyYXRpb25zLiBUaGVyZSBhcmUgc29tZSBzeW1ib2xzIHRoYXQgd2UgdGFnIHNwZWNpYWxseVxuICAgICMgaGVyZS4gYDtgIGFuZCBuZXdsaW5lcyBhcmUgYm90aCB0cmVhdGVkIGFzIGEgYFRFUk1JTkFUT1JgLCB3ZSBkaXN0aW5ndWlzaFxuICAgICMgcGFyZW50aGVzZXMgdGhhdCBpbmRpY2F0ZSBhIG1ldGhvZCBjYWxsIGZyb20gcmVndWxhciBwYXJlbnRoZXNlcywgYW5kIHNvIG9uLlxuICAgIFxuICAgIGxpdGVyYWxUb2tlbjogLT5cbiAgICAgICAgXG4gICAgICAgIGlmIG1hdGNoID0gT1BFUkFUT1IuZXhlYyBAY2h1bmtcbiAgICAgICAgICAgIFt2YWx1ZV0gPSBtYXRjaFxuICAgICAgICAgICAgQHRhZ1BhcmFtZXRlcnMoKSBpZiBDT0RFLnRlc3QgdmFsdWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdmFsdWUgPSBAY2h1bmsuY2hhckF0IDBcbiAgICAgICAgdGFnICA9IHZhbHVlXG4gICAgICAgIFsuLi4sIHByZXZdID0gQHRva2Vuc1xuXG4gICAgICAgIGlmIHByZXYgYW5kIHZhbHVlIGluIFsnPScsIENPTVBPVU5EX0FTU0lHTi4uLl1cbiAgICAgICAgICAgIHNraXBUb2tlbiA9IGZhbHNlXG4gICAgICAgICAgICBpZiB2YWx1ZSBpcyAnPScgYW5kIHByZXZbMV0gaW4gWyd8fCcsICcmJiddIGFuZCBub3QgcHJldi5zcGFjZWRcbiAgICAgICAgICAgICAgICBwcmV2WzBdID0gJ0NPTVBPVU5EX0FTU0lHTidcbiAgICAgICAgICAgICAgICBwcmV2WzFdICs9ICc9J1xuICAgICAgICAgICAgICAgIHByZXYgPSBAdG9rZW5zW0B0b2tlbnMubGVuZ3RoIC0gMl1cbiAgICAgICAgICAgICAgICBza2lwVG9rZW4gPSB0cnVlXG4gICAgICAgICAgICBpZiBwcmV2IGFuZCBwcmV2WzBdICE9ICdQUk9QRVJUWSdcbiAgICAgICAgICAgICAgICBvcmlnaW4gPSBwcmV2Lm9yaWdpbiA/IHByZXZcbiAgICAgICAgICAgICAgICBtZXNzYWdlID0gaXNVbmFzc2lnbmFibGUgcHJldlsxXSwgb3JpZ2luWzFdXG4gICAgICAgICAgICAgICAgQGVycm9yIG1lc3NhZ2UsIG9yaWdpblsyXSBpZiBtZXNzYWdlXG4gICAgICAgICAgICByZXR1cm4gdmFsdWUubGVuZ3RoIGlmIHNraXBUb2tlblxuXG4gICAgICAgIGlmIHZhbHVlIGlzICd7JyBhbmQgQHNlZW5JbXBvcnRcbiAgICAgICAgICAgIEBpbXBvcnRTcGVjaWZpZXJMaXN0ID0geWVzXG4gICAgICAgIGVsc2UgaWYgQGltcG9ydFNwZWNpZmllckxpc3QgYW5kIHZhbHVlIGlzICd9J1xuICAgICAgICAgICAgQGltcG9ydFNwZWNpZmllckxpc3QgPSBub1xuICAgICAgICBlbHNlIGlmIHZhbHVlIGlzICd7JyBhbmQgcHJldj9bMF0gaXMgJ0VYUE9SVCdcbiAgICAgICAgICAgIEBleHBvcnRTcGVjaWZpZXJMaXN0ID0geWVzXG4gICAgICAgIGVsc2UgaWYgQGV4cG9ydFNwZWNpZmllckxpc3QgYW5kIHZhbHVlIGlzICd9J1xuICAgICAgICAgICAgQGV4cG9ydFNwZWNpZmllckxpc3QgPSBub1xuXG4gICAgICAgIGlmIHZhbHVlIGlzICc7J1xuICAgICAgICAgICAgQHNlZW5Gb3IgPSBAc2VlbkltcG9ydCA9IEBzZWVuRXhwb3J0ID0gbm9cbiAgICAgICAgICAgIHRhZyA9ICdURVJNSU5BVE9SJ1xuICAgICAgICBlbHNlIGlmIHZhbHVlIGlzICcqJyBhbmQgcHJldlswXSBpcyAnRVhQT1JUJ1xuICAgICAgICAgICAgdGFnID0gJ0VYUE9SVF9BTEwnXG4gICAgICAgIGVsc2UgaWYgdmFsdWUgaW4gTUFUSCAgICAgICAgICAgICAgICAgICB0aGVuIHRhZyA9ICdNQVRIJ1xuICAgICAgICBlbHNlIGlmIHZhbHVlIGluIENPTVBBUkUgICAgICAgICAgICAgICAgdGhlbiB0YWcgPSAnQ09NUEFSRSdcbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpbiBDT01QT1VORF9BU1NJR04gICAgICAgIHRoZW4gdGFnID0gJ0NPTVBPVU5EX0FTU0lHTidcbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpbiBVTkFSWSAgICAgICAgICAgICAgICAgIHRoZW4gdGFnID0gJ1VOQVJZJ1xuICAgICAgICBlbHNlIGlmIHZhbHVlIGluIFVOQVJZX01BVEggICAgICAgICAgICAgdGhlbiB0YWcgPSAnVU5BUllfTUFUSCdcbiAgICAgICAgZWxzZSBpZiB2YWx1ZSBpbiBTSElGVCAgICAgICAgICAgICAgICAgIHRoZW4gdGFnID0gJ1NISUZUJ1xuICAgICAgICBlbHNlIGlmIHZhbHVlIGlzICc/JyBhbmQgcHJldj8uc3BhY2VkICAgdGhlbiB0YWcgPSAnQklOPydcbiAgICAgICAgZWxzZSBpZiBwcmV2IGFuZCBub3QgcHJldi5zcGFjZWRcbiAgICAgICAgICAgIGlmIHZhbHVlIGlzICcoJyBhbmQgcHJldlswXSBpbiBDQUxMQUJMRVxuICAgICAgICAgICAgICAgIHByZXZbMF0gPSAnRlVOQ19FWElTVCcgaWYgcHJldlswXSBpcyAnPydcbiAgICAgICAgICAgICAgICB0YWcgPSAnQ0FMTF9TVEFSVCdcbiAgICAgICAgICAgIGVsc2UgaWYgdmFsdWUgaXMgJ1snIGFuZCBwcmV2WzBdIGluIElOREVYQUJMRVxuICAgICAgICAgICAgICAgIHRhZyA9ICdJTkRFWF9TVEFSVCdcbiAgICAgICAgICAgICAgICBzd2l0Y2ggcHJldlswXVxuICAgICAgICAgICAgICAgICAgICB3aGVuICc/JyAgICB0aGVuIHByZXZbMF0gPSAnSU5ERVhfU09BSydcbiAgICAgICAgdG9rZW4gPSBAbWFrZVRva2VuIHRhZywgdmFsdWVcbiAgICAgICAgc3dpdGNoIHZhbHVlXG4gICAgICAgICAgICB3aGVuICcoJywgJ3snLCAnWycgdGhlbiBAZW5kcy5wdXNoIHt0YWc6IFJld3JpdGVyLklOVkVSU0VTW3ZhbHVlXSwgb3JpZ2luOiB0b2tlbn1cbiAgICAgICAgICAgIHdoZW4gJyknLCAnfScsICddJyB0aGVuIEBwYWlyIHZhbHVlXG4gICAgICAgIEB0b2tlbnMucHVzaCB0b2tlblxuICAgICAgICB2YWx1ZS5sZW5ndGhcblxuICAgICMjI1xuICAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIFxuICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIFxuICAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgICMjI1xuICAgIFxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgIyBBIHNvdXJjZSBvZiBhbWJpZ3VpdHkgaW4gb3VyIGdyYW1tYXIgdXNlZCB0byBiZSBwYXJhbWV0ZXIgbGlzdHMgaW4gZnVuY3Rpb25cbiAgICAjIGRlZmluaXRpb25zIHZlcnN1cyBhcmd1bWVudCBsaXN0cyBpbiBmdW5jdGlvbiBjYWxscy4gV2FsayBiYWNrd2FyZHMsIHRhZ2dpbmdcbiAgICAjIHBhcmFtZXRlcnMgc3BlY2lhbGx5IGluIG9yZGVyIHRvIG1ha2UgdGhpbmdzIGVhc2llciBmb3IgdGhlIHBhcnNlci5cbiAgICAgICAgXG4gICAgdGFnUGFyYW1ldGVyczogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzIGlmIEB0YWcoKSAhPSAnKSdcbiAgICAgICAgc3RhY2sgPSBbXVxuICAgICAgICB7dG9rZW5zfSA9IHRoaXNcbiAgICAgICAgaSA9IHRva2Vucy5sZW5ndGhcbiAgICAgICAgdG9rZW5zWy0taV1bMF0gPSAnUEFSQU1fRU5EJ1xuICAgICAgICB3aGlsZSB0b2sgPSB0b2tlbnNbLS1pXVxuICAgICAgICAgICAgc3dpdGNoIHRva1swXVxuICAgICAgICAgICAgICAgIHdoZW4gJyknXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2ggdG9rXG4gICAgICAgICAgICAgICAgd2hlbiAnKCcsICdDQUxMX1NUQVJUJ1xuICAgICAgICAgICAgICAgICAgICBpZiBzdGFjay5sZW5ndGggdGhlbiBzdGFjay5wb3AoKVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIHRva1swXSBpcyAnKCdcbiAgICAgICAgICAgICAgICAgICAgICAgIHRva1swXSA9ICdQQVJBTV9TVEFSVCdcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgcmV0dXJuIHRoaXNcbiAgICAgICAgdGhpc1xuXG4gICAgIyBDbG9zZSB1cCBhbGwgcmVtYWluaW5nIG9wZW4gYmxvY2tzIGF0IHRoZSBlbmQgb2YgdGhlIGZpbGUuXG4gICAgXG4gICAgY2xvc2VJbmRlbnRhdGlvbjogLT4gQG91dGRlbnRUb2tlbiBAaW5kZW50XG5cbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgIyBNYXRjaCB0aGUgY29udGVudHMgb2YgYSBkZWxpbWl0ZWQgdG9rZW4gYW5kIGV4cGFuZCB2YXJpYWJsZXMgYW5kIGV4cHJlc3Npb25zXG4gICAgIyBpbnNpZGUgaXQgdXNpbmcgUnVieS1saWtlIG5vdGF0aW9uIGZvciBzdWJzdGl0dXRpb24gb2YgYXJiaXRyYXJ5IGV4cHJlc3Npb25zLlxuICAgICNcbiAgICAjICAgIFwiSGVsbG8gI3tuYW1lLmNhcGl0YWxpemUoKX0uXCJcbiAgICAjXG4gICAgIyBJZiBpdCBlbmNvdW50ZXJzIGFuIGludGVycG9sYXRpb24sIHRoaXMgbWV0aG9kIHdpbGwgcmVjdXJzaXZlbHkgY3JlYXRlIGEgbmV3XG4gICAgIyBMZXhlciBhbmQgdG9rZW5pemUgdW50aWwgdGhlIGB7YCBvZiBgI3tgIGlzIGJhbGFuY2VkIHdpdGggYSBgfWAuXG4gICAgI1xuICAgICMgICAgLSBgcmVnZXhgIG1hdGNoZXMgdGhlIGNvbnRlbnRzIG9mIGEgdG9rZW4gKGJ1dCBub3QgYGRlbGltaXRlcmAsIGFuZCBub3RcbiAgICAjICAgICAgICBgI3tgIGlmIGludGVycG9sYXRpb25zIGFyZSBkZXNpcmVkKS5cbiAgICAjICAgIC0gYGRlbGltaXRlcmAgaXMgdGhlIGRlbGltaXRlciBvZiB0aGUgdG9rZW4uIEV4YW1wbGVzIGFyZSBgJ2AsIGBcImAsIGAnJydgLFxuICAgICMgICAgICAgIGBcIlwiXCJgIGFuZCBgLy8vYC5cbiAgICAjXG4gICAgIyBUaGlzIG1ldGhvZCBhbGxvd3MgdXMgdG8gaGF2ZSBzdHJpbmdzIHdpdGhpbiBpbnRlcnBvbGF0aW9ucyB3aXRoaW4gc3RyaW5ncywgYWQgaW5maW5pdHVtLlxuICAgIFxuICAgIG1hdGNoV2l0aEludGVycG9sYXRpb25zOiAocmVnZXgsIGRlbGltaXRlcikgLT5cbiAgICAgICAgXG4gICAgICAgIHRva2VucyA9IFtdXG4gICAgICAgIG9mZnNldEluQ2h1bmsgPSBkZWxpbWl0ZXIubGVuZ3RoXG4gICAgICAgIHJldHVybiBudWxsIHVubGVzcyBAY2h1bmtbLi4ub2Zmc2V0SW5DaHVua10gaXMgZGVsaW1pdGVyXG4gICAgICAgIHN0ciA9IEBjaHVua1tvZmZzZXRJbkNodW5rLi5dXG4gICAgICAgIGxvb3BcbiAgICAgICAgICAgIFtzdHJQYXJ0XSA9IHJlZ2V4LmV4ZWMgc3RyXG5cbiAgICAgICAgICAgIEB2YWxpZGF0ZUVzY2FwZXMgc3RyUGFydCwge2lzUmVnZXg6IGRlbGltaXRlci5jaGFyQXQoMCkgaXMgJy8nLCBvZmZzZXRJbkNodW5rfVxuXG4gICAgICAgICAgICAjIFB1c2ggYSBmYWtlICdORU9TVFJJTkcnIHRva2VuLCB3aGljaCB3aWxsIGdldCB0dXJuZWQgaW50byBhIHJlYWwgc3RyaW5nIGxhdGVyLlxuICAgICAgICAgICAgdG9rZW5zLnB1c2ggQG1ha2VUb2tlbiAnTkVPU1RSSU5HJywgc3RyUGFydCwgb2Zmc2V0SW5DaHVua1xuXG4gICAgICAgICAgICBzdHIgPSBzdHJbc3RyUGFydC5sZW5ndGguLl1cbiAgICAgICAgICAgIG9mZnNldEluQ2h1bmsgKz0gc3RyUGFydC5sZW5ndGhcblxuICAgICAgICAgICAgYnJlYWsgdW5sZXNzIHN0clsuLi4yXSBpcyAnI3snXG5cbiAgICAgICAgICAgICMgVGhlIGAxYHMgYXJlIHRvIHJlbW92ZSB0aGUgYCNgIGluIGAje2AuXG4gICAgICAgICAgICBbbGluZSwgY29sdW1uXSA9IEBnZXRMaW5lQW5kQ29sdW1uRnJvbUNodW5rIG9mZnNldEluQ2h1bmsgKyAxXG4gICAgICAgICAgICB7dG9rZW5zOiBuZXN0ZWQsIGluZGV4fSA9XG4gICAgICAgICAgICAgICAgbmV3IExleGVyKCkudG9rZW5pemUgc3RyWzEuLl0sIGxpbmU6IGxpbmUsIGNvbHVtbjogY29sdW1uLCB1bnRpbEJhbGFuY2VkOiBvblxuICAgICAgICAgICAgIyBTa2lwIHRoZSB0cmFpbGluZyBgfWAuXG4gICAgICAgICAgICBpbmRleCArPSAxXG5cbiAgICAgICAgICAgICMgVHVybiB0aGUgbGVhZGluZyBhbmQgdHJhaWxpbmcgYHtgIGFuZCBgfWAgaW50byBwYXJlbnRoZXNlcy4gVW5uZWNlc3NhcnlcbiAgICAgICAgICAgICMgcGFyZW50aGVzZXMgd2lsbCBiZSByZW1vdmVkIGxhdGVyLlxuICAgICAgICAgICAgW29wZW4sIC4uLiwgY2xvc2VdID0gbmVzdGVkXG4gICAgICAgICAgICBvcGVuWzBdICA9IG9wZW5bMV0gID0gJygnXG4gICAgICAgICAgICBjbG9zZVswXSA9IGNsb3NlWzFdID0gJyknXG4gICAgICAgICAgICBjbG9zZS5vcmlnaW4gPSBbJycsICdlbmQgb2YgaW50ZXJwb2xhdGlvbicsIGNsb3NlWzJdXVxuXG4gICAgICAgICAgICAjIFJlbW92ZSBsZWFkaW5nICdURVJNSU5BVE9SJyAoaWYgYW55KS5cbiAgICAgICAgICAgIG5lc3RlZC5zcGxpY2UgMSwgMSBpZiBuZXN0ZWRbMV0/WzBdIGlzICdURVJNSU5BVE9SJ1xuXG4gICAgICAgICAgICAjIFB1c2ggYSBmYWtlICdUT0tFTlMnIHRva2VuLCB3aGljaCB3aWxsIGdldCB0dXJuZWQgaW50byByZWFsIHRva2VucyBsYXRlci5cbiAgICAgICAgICAgIHRva2Vucy5wdXNoIFsnVE9LRU5TJywgbmVzdGVkXVxuXG4gICAgICAgICAgICBzdHIgPSBzdHJbaW5kZXguLl1cbiAgICAgICAgICAgIG9mZnNldEluQ2h1bmsgKz0gaW5kZXhcblxuICAgICAgICB1bmxlc3Mgc3RyWy4uLmRlbGltaXRlci5sZW5ndGhdIGlzIGRlbGltaXRlclxuICAgICAgICAgICAgQGVycm9yIFwibWlzc2luZyAje2RlbGltaXRlcn1cIiwgbGVuZ3RoOiBkZWxpbWl0ZXIubGVuZ3RoXG5cbiAgICAgICAgW2ZpcnN0VG9rZW4sIC4uLiwgbGFzdFRva2VuXSA9IHRva2Vuc1xuICAgICAgICBmaXJzdFRva2VuWzJdLmZpcnN0X2NvbHVtbiAtPSBkZWxpbWl0ZXIubGVuZ3RoXG4gICAgICAgIGlmIGxhc3RUb2tlblsxXS5zdWJzdHIoLTEpIGlzICdcXG4nXG4gICAgICAgICAgICBsYXN0VG9rZW5bMl0ubGFzdF9saW5lICs9IDFcbiAgICAgICAgICAgIGxhc3RUb2tlblsyXS5sYXN0X2NvbHVtbiA9IGRlbGltaXRlci5sZW5ndGggLSAxXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGxhc3RUb2tlblsyXS5sYXN0X2NvbHVtbiArPSBkZWxpbWl0ZXIubGVuZ3RoXG4gICAgICAgIGxhc3RUb2tlblsyXS5sYXN0X2NvbHVtbiAtPSAxIGlmIGxhc3RUb2tlblsxXS5sZW5ndGggaXMgMFxuXG4gICAgICAgIHt0b2tlbnMsIGluZGV4OiBvZmZzZXRJbkNodW5rICsgZGVsaW1pdGVyLmxlbmd0aH1cblxuICAgICMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgIyBNZXJnZSB0aGUgYXJyYXkgYHRva2Vuc2Agb2YgdGhlIGZha2UgdG9rZW4gdHlwZXMgJ1RPS0VOUycgYW5kICdORU9TVFJJTkcnICAoYXMgcmV0dXJuZWQgYnkgYG1hdGNoV2l0aEludGVycG9sYXRpb25zYCkgaW50byB0aGUgdG9rZW4gc3RyZWFtLiBcbiAgICAjIFRoZSB2YWx1ZSBvZiAnTkVPU1RSSU5HJ3MgYXJlIGNvbnZlcnRlZCB1c2luZyBgZm5gIGFuZCB0dXJuZWQgaW50byBzdHJpbmdzIHVzaW5nIGBvcHRpb25zYCBmaXJzdC5cbiAgICBcbiAgICBtZXJnZUludGVycG9sYXRpb25Ub2tlbnM6ICh0b2tlbnMsIG9wdGlvbnMsIGZuKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgdG9rZW5zLmxlbmd0aCA+IDFcbiAgICAgICAgICAgIGxwYXJlbiA9IEB0b2tlbiAnU1RSSU5HX1NUQVJUJywgJygnLCAwLCAwXG5cbiAgICAgICAgZmlyc3RJbmRleCA9IEB0b2tlbnMubGVuZ3RoXG4gICAgICAgIGZvciB0b2tlbiwgaSBpbiB0b2tlbnNcbiAgICAgICAgICAgIFt0YWcsIHZhbHVlXSA9IHRva2VuXG4gICAgICAgICAgICBzd2l0Y2ggdGFnXG4gICAgICAgICAgICAgICAgd2hlbiAnVE9LRU5TJ1xuICAgICAgICAgICAgICAgICAgICAjIE9wdGltaXplIG91dCBlbXB0eSBpbnRlcnBvbGF0aW9ucyAoYW4gZW1wdHkgcGFpciBvZiBwYXJlbnRoZXNlcykuXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlIGlmIHZhbHVlLmxlbmd0aCBpcyAyXG4gICAgICAgICAgICAgICAgICAgICMgUHVzaCBhbGwgdGhlIHRva2VucyBpbiB0aGUgZmFrZSAnVE9LRU5TJyB0b2tlbi4gXG4gICAgICAgICAgICAgICAgICAgICMgVGhlc2UgYWxyZWFkeSBoYXZlIHNhbmUgbG9jYXRpb24gZGF0YS5cbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb25Ub2tlbiA9IHZhbHVlWzBdXG4gICAgICAgICAgICAgICAgICAgIHRva2Vuc1RvUHVzaCA9IHZhbHVlXG4gICAgICAgICAgICAgICAgd2hlbiAnTkVPU1RSSU5HJ1xuICAgICAgICAgICAgICAgICAgICAjIENvbnZlcnQgJ05FT1NUUklORycgaW50byAnU1RSSU5HJy5cbiAgICAgICAgICAgICAgICAgICAgY29udmVydGVkID0gZm4uY2FsbCB0aGlzLCB0b2tlblsxXSwgaVxuICAgICAgICAgICAgICAgICAgICAjIE9wdGltaXplIG91dCBlbXB0eSBzdHJpbmdzLiBXZSBlbnN1cmUgdGhhdCB0aGUgdG9rZW5zIHN0cmVhbSBhbHdheXNcbiAgICAgICAgICAgICAgICAgICAgIyBzdGFydHMgd2l0aCBhIHN0cmluZyB0b2tlbiwgdGhvdWdoLCB0byBtYWtlIHN1cmUgdGhhdCB0aGUgcmVzdWx0XG4gICAgICAgICAgICAgICAgICAgICMgcmVhbGx5IGlzIGEgc3RyaW5nLlxuICAgICAgICAgICAgICAgICAgICBpZiBjb252ZXJ0ZWQubGVuZ3RoIGlzIDBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGkgaXMgMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0RW1wdHlTdHJpbmdJbmRleCA9IEB0b2tlbnMubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgICAgICAgICAgIyBIb3dldmVyLCB0aGVyZSBpcyBvbmUgY2FzZSB3aGVyZSB3ZSBjYW4gb3B0aW1pemUgYXdheSBhIHN0YXJ0aW5nIGVtcHR5IHN0cmluZy5cbiAgICAgICAgICAgICAgICAgICAgaWYgaSBpcyAyIGFuZCBmaXJzdEVtcHR5U3RyaW5nSW5kZXg/XG4gICAgICAgICAgICAgICAgICAgICAgICBAdG9rZW5zLnNwbGljZSBmaXJzdEVtcHR5U3RyaW5nSW5kZXgsIDIgIyBSZW1vdmUgZW1wdHkgc3RyaW5nIGFuZCB0aGUgcGx1cy5cbiAgICAgICAgICAgICAgICAgICAgdG9rZW5bMF0gPSAnU1RSSU5HJ1xuICAgICAgICAgICAgICAgICAgICB0b2tlblsxXSA9IEBtYWtlRGVsaW1pdGVkTGl0ZXJhbCBjb252ZXJ0ZWQsIG9wdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb25Ub2tlbiA9IHRva2VuXG4gICAgICAgICAgICAgICAgICAgIHRva2Vuc1RvUHVzaCA9IFt0b2tlbl1cbiAgICAgICAgICAgIGlmIEB0b2tlbnMubGVuZ3RoID4gZmlyc3RJbmRleFxuICAgICAgICAgICAgICAgICMgQ3JlYXRlIGEgMC1sZW5ndGggXCIrXCIgdG9rZW4uXG4gICAgICAgICAgICAgICAgcGx1c1Rva2VuID0gQHRva2VuICcrJywgJysnXG4gICAgICAgICAgICAgICAgcGx1c1Rva2VuWzJdID1cbiAgICAgICAgICAgICAgICAgICAgZmlyc3RfbGluZTogICBsb2NhdGlvblRva2VuWzJdLmZpcnN0X2xpbmVcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RfY29sdW1uOiBsb2NhdGlvblRva2VuWzJdLmZpcnN0X2NvbHVtblxuICAgICAgICAgICAgICAgICAgICBsYXN0X2xpbmU6ICAgIGxvY2F0aW9uVG9rZW5bMl0uZmlyc3RfbGluZVxuICAgICAgICAgICAgICAgICAgICBsYXN0X2NvbHVtbjogIGxvY2F0aW9uVG9rZW5bMl0uZmlyc3RfY29sdW1uXG4gICAgICAgICAgICBAdG9rZW5zLnB1c2ggdG9rZW5zVG9QdXNoLi4uXG5cbiAgICAgICAgaWYgbHBhcmVuXG4gICAgICAgICAgICBbLi4uLCBsYXN0VG9rZW5dID0gdG9rZW5zXG4gICAgICAgICAgICBscGFyZW4ub3JpZ2luID0gWydTVFJJTkcnLCBudWxsLFxuICAgICAgICAgICAgICAgIGZpcnN0X2xpbmU6ICAgbHBhcmVuWzJdLmZpcnN0X2xpbmVcbiAgICAgICAgICAgICAgICBmaXJzdF9jb2x1bW46IGxwYXJlblsyXS5maXJzdF9jb2x1bW5cbiAgICAgICAgICAgICAgICBsYXN0X2xpbmU6ICAgIGxhc3RUb2tlblsyXS5sYXN0X2xpbmVcbiAgICAgICAgICAgICAgICBsYXN0X2NvbHVtbjogIGxhc3RUb2tlblsyXS5sYXN0X2NvbHVtblxuICAgICAgICAgICAgXVxuICAgICAgICAgICAgcnBhcmVuID0gQHRva2VuICdTVFJJTkdfRU5EJywgJyknXG4gICAgICAgICAgICBycGFyZW5bMl0gPVxuICAgICAgICAgICAgICAgIGZpcnN0X2xpbmU6ICAgbGFzdFRva2VuWzJdLmxhc3RfbGluZVxuICAgICAgICAgICAgICAgIGZpcnN0X2NvbHVtbjogbGFzdFRva2VuWzJdLmxhc3RfY29sdW1uXG4gICAgICAgICAgICAgICAgbGFzdF9saW5lOiAgICBsYXN0VG9rZW5bMl0ubGFzdF9saW5lXG4gICAgICAgICAgICAgICAgbGFzdF9jb2x1bW46ICBsYXN0VG9rZW5bMl0ubGFzdF9jb2x1bW5cblxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgIyBQYWlycyB1cCBhIGNsb3NpbmcgdG9rZW4sIGVuc3VyaW5nIHRoYXQgYWxsIGxpc3RlZCBwYWlycyBvZiB0b2tlbnMgYXJlXG4gICAgIyBjb3JyZWN0bHkgYmFsYW5jZWQgdGhyb3VnaG91dCB0aGUgY291cnNlIG9mIHRoZSB0b2tlbiBzdHJlYW0uXG4gICAgXG4gICAgcGFpcjogKHRhZykgLT5cbiAgICAgICAgXG4gICAgICAgIFsuLi4sIHByZXZdID0gQGVuZHNcbiAgICAgICAgdW5sZXNzIHRhZyBpcyB3YW50ZWQgPSBwcmV2Py50YWdcbiAgICAgICAgICAgIEBlcnJvciBcInVubWF0Y2hlZCAje3RhZ31cIiB1bmxlc3MgJ09VVERFTlQnIGlzIHdhbnRlZFxuICAgICAgICAgICAgIyBBdXRvLWNsb3NlIElOREVOVCB0byBzdXBwb3J0IHN5bnRheCBsaWtlIHRoaXM6XG4gICAgICAgICAgICAjXG4gICAgICAgICAgICAjICAgICBlbC5jbGljaygoZXZlbnQpIC0+XG4gICAgICAgICAgICAjICAgICAgICAgZWwuaGlkZSgpKVxuICAgICAgICAgICAgWy4uLiwgbGFzdEluZGVudF0gPSBAaW5kZW50c1xuICAgICAgICAgICAgQG91dGRlbnRUb2tlbiBsYXN0SW5kZW50LCB0cnVlXG4gICAgICAgICAgICByZXR1cm4gQHBhaXIgdGFnXG4gICAgICAgIEBlbmRzLnBvcCgpXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG5cbiAgICAjIFJldHVybnMgdGhlIGxpbmUgYW5kIGNvbHVtbiBudW1iZXIgZnJvbSBhbiBvZmZzZXQgaW50byB0aGUgY3VycmVudCBjaHVuay5cbiAgICAjXG4gICAgIyBgb2Zmc2V0YCBpcyBhIG51bWJlciBvZiBjaGFyYWN0ZXJzIGludG8gQGNodW5rLlxuICAgIFxuICAgIGdldExpbmVBbmRDb2x1bW5Gcm9tQ2h1bms6IChvZmZzZXQpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBvZmZzZXQgaXMgMFxuICAgICAgICAgICAgcmV0dXJuIFtAY2h1bmtMaW5lLCBAY2h1bmtDb2x1bW5dXG5cbiAgICAgICAgaWYgb2Zmc2V0ID49IEBjaHVuay5sZW5ndGhcbiAgICAgICAgICAgIHN0cmluZyA9IEBjaHVua1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzdHJpbmcgPSBAY2h1bmtbLi5vZmZzZXQtMV1cblxuICAgICAgICBsaW5lQ291bnQgPSBjb3VudCBzdHJpbmcsICdcXG4nXG5cbiAgICAgICAgY29sdW1uID0gQGNodW5rQ29sdW1uXG4gICAgICAgIGlmIGxpbmVDb3VudCA+IDBcbiAgICAgICAgICAgIFsuLi4sIGxhc3RMaW5lXSA9IHN0cmluZy5zcGxpdCAnXFxuJ1xuICAgICAgICAgICAgY29sdW1uID0gbGFzdExpbmUubGVuZ3RoXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGNvbHVtbiArPSBzdHJpbmcubGVuZ3RoXG5cbiAgICAgICAgW0BjaHVua0xpbmUgKyBsaW5lQ291bnQsIGNvbHVtbl1cblxuICAgICMgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwMCAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwMCAgXG4gICAgIyAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICAjIFNhbWUgYXMgXCJ0b2tlblwiLCBleGNlcHRpb24gdGhpcyBqdXN0IHJldHVybnMgdGhlIHRva2VuIHdpdGhvdXQgYWRkaW5nIGl0IHRvIHRoZSByZXN1bHRzLlxuICAgIFxuICAgIG1ha2VUb2tlbjogKHRhZywgdmFsdWUsIG9mZnNldEluQ2h1bmsgPSAwLCBsZW5ndGggPSB2YWx1ZS5sZW5ndGgpIC0+XG4gICAgICAgIFxuICAgICAgICBsb2NhdGlvbkRhdGEgPSB7fVxuICAgICAgICBbbG9jYXRpb25EYXRhLmZpcnN0X2xpbmUsIGxvY2F0aW9uRGF0YS5maXJzdF9jb2x1bW5dID1cbiAgICAgICAgICAgIEBnZXRMaW5lQW5kQ29sdW1uRnJvbUNodW5rIG9mZnNldEluQ2h1bmtcblxuICAgICAgICAjIFVzZSBsZW5ndGggLSAxIGZvciB0aGUgZmluYWwgb2Zmc2V0IC0gd2UncmUgc3VwcGx5aW5nIHRoZSBsYXN0X2xpbmUgYW5kIHRoZSBsYXN0X2NvbHVtbixcbiAgICAgICAgIyBzbyBpZiBsYXN0X2NvbHVtbiA9PSBmaXJzdF9jb2x1bW4sIHRoZW4gd2UncmUgbG9va2luZyBhdCBhIGNoYXJhY3RlciBvZiBsZW5ndGggMS5cbiAgICAgICAgbGFzdENoYXJhY3RlciA9IGlmIGxlbmd0aCA+IDAgdGhlbiAobGVuZ3RoIC0gMSkgZWxzZSAwXG4gICAgICAgIFtsb2NhdGlvbkRhdGEubGFzdF9saW5lLCBsb2NhdGlvbkRhdGEubGFzdF9jb2x1bW5dID1cbiAgICAgICAgICAgIEBnZXRMaW5lQW5kQ29sdW1uRnJvbUNodW5rIG9mZnNldEluQ2h1bmsgKyBsYXN0Q2hhcmFjdGVyXG5cbiAgICAgICAgdG9rZW4gPSBbdGFnLCB2YWx1ZSwgbG9jYXRpb25EYXRhXVxuXG4gICAgICAgIHRva2VuXG5cbiAgICAjIEFkZCBhIHRva2VuIHRvIHRoZSByZXN1bHRzLlxuICAgICMgYG9mZnNldGAgaXMgdGhlIG9mZnNldCBpbnRvIHRoZSBjdXJyZW50IEBjaHVuayB3aGVyZSB0aGUgdG9rZW4gc3RhcnRzLlxuICAgICMgYGxlbmd0aGAgaXMgdGhlIGxlbmd0aCBvZiB0aGUgdG9rZW4gaW4gdGhlIEBjaHVuaywgYWZ0ZXIgdGhlIG9mZnNldC4gIFxuICAgICMgSWYgbm90IHNwZWNpZmllZCwgdGhlIGxlbmd0aCBvZiBgdmFsdWVgIHdpbGwgYmUgdXNlZC4gUmV0dXJucyB0aGUgbmV3IHRva2VuLlxuICAgIFxuICAgIHRva2VuOiAodGFnLCB2YWx1ZSwgb2Zmc2V0SW5DaHVuaywgbGVuZ3RoLCBvcmlnaW4pIC0+XG4gICAgICAgIFxuICAgICAgICB0b2tlbiA9IEBtYWtlVG9rZW4gdGFnLCB2YWx1ZSwgb2Zmc2V0SW5DaHVuaywgbGVuZ3RoXG4gICAgICAgIHRva2VuLm9yaWdpbiA9IG9yaWdpbiBpZiBvcmlnaW5cbiAgICAgICAgQHRva2Vucy5wdXNoIHRva2VuXG4gICAgICAgIHRva2VuXG5cbiAgICB0YWc6IC0+ICMgUGVlayBhdCB0aGUgbGFzdCB0YWcgaW4gdGhlIHRva2VuIHN0cmVhbS5cbiAgICAgICAgXG4gICAgICAgIFsuLi4sIHRva2VuXSA9IEB0b2tlbnNcbiAgICAgICAgdG9rZW4/WzBdXG5cbiAgICB2YWx1ZTogLT4gIyBQZWVrIGF0IHRoZSBsYXN0IHZhbHVlIGluIHRoZSB0b2tlbiBzdHJlYW0uXG4gICAgICAgIFxuICAgICAgICBbLi4uLCB0b2tlbl0gPSBAdG9rZW5zXG4gICAgICAgIHRva2VuP1sxXVxuXG4gICAgdW5maW5pc2hlZDogLT4gIyBBcmUgd2UgaW4gdGhlIG1pZHN0IG9mIGFuIHVuZmluaXNoZWQgZXhwcmVzc2lvbj9cbiAgICAgICAgXG4gICAgICAgIExJTkVfQ09OVElOVUVSLnRlc3QoQGNodW5rKSBvclxuICAgICAgICBAdGFnKCkgaW4gVU5GSU5JU0hFRFxuXG4gICAgZm9ybWF0U3RyaW5nOiAoc3RyLCBvcHRpb25zKSAtPlxuICAgICAgICBcbiAgICAgICAgQHJlcGxhY2VVbmljb2RlQ29kZVBvaW50RXNjYXBlcyBzdHIucmVwbGFjZShTVFJJTkdfT01JVCwgJyQxJyksIG9wdGlvbnNcblxuICAgIGZvcm1hdEhlcmVnZXg6IChzdHIpIC0+XG4gICAgICAgIFxuICAgICAgICBAZm9ybWF0UmVnZXggc3RyLnJlcGxhY2UoSEVSRUdFWF9PTUlULCAnJDEkMicpLCBkZWxpbWl0ZXI6ICcvLy8nXG5cbiAgICBmb3JtYXRSZWdleDogKHN0ciwgb3B0aW9ucykgLT5cbiAgICAgICAgXG4gICAgICAgIEByZXBsYWNlVW5pY29kZUNvZGVQb2ludEVzY2FwZXMgc3RyLCBvcHRpb25zXG5cbiAgICB1bmljb2RlQ29kZVBvaW50VG9Vbmljb2RlRXNjYXBlczogKGNvZGVQb2ludCkgLT5cbiAgICAgICAgXG4gICAgICAgIHRvVW5pY29kZUVzY2FwZSA9ICh2YWwpIC0+XG4gICAgICAgICAgICBzdHIgPSB2YWwudG9TdHJpbmcgMTZcbiAgICAgICAgICAgIFwiXFxcXHUje3JlcGVhdCAnMCcsIDQgLSBzdHIubGVuZ3RofSN7c3RyfVwiXG4gICAgICAgIHJldHVybiB0b1VuaWNvZGVFc2NhcGUoY29kZVBvaW50KSBpZiBjb2RlUG9pbnQgPCAweDEwMDAwXG4gICAgICAgICMgc3Vycm9nYXRlIHBhaXJcbiAgICAgICAgaGlnaCA9IE1hdGguZmxvb3IoKGNvZGVQb2ludCAtIDB4MTAwMDApIC8gMHg0MDApICsgMHhEODAwXG4gICAgICAgIGxvdyA9IChjb2RlUG9pbnQgLSAweDEwMDAwKSAlIDB4NDAwICsgMHhEQzAwXG4gICAgICAgIFwiI3t0b1VuaWNvZGVFc2NhcGUoaGlnaCl9I3t0b1VuaWNvZGVFc2NhcGUobG93KX1cIlxuXG4gICAgcmVwbGFjZVVuaWNvZGVDb2RlUG9pbnRFc2NhcGVzOiAoc3RyLCBvcHRpb25zKSAtPiAjIFJlcGxhY2UgXFx1ey4uLn0gd2l0aCBcXHV4eHh4W1xcdXh4eHhdIGluIHN0cmluZ3MgYW5kIHJlZ2V4ZXNcbiAgICAgICAgXG4gICAgICAgIHN0ci5yZXBsYWNlIFVOSUNPREVfQ09ERV9QT0lOVF9FU0NBUEUsIChtYXRjaCwgZXNjYXBlZEJhY2tzbGFzaCwgY29kZVBvaW50SGV4LCBvZmZzZXQpID0+XG4gICAgICAgICAgICByZXR1cm4gZXNjYXBlZEJhY2tzbGFzaCBpZiBlc2NhcGVkQmFja3NsYXNoXG5cbiAgICAgICAgICAgIGNvZGVQb2ludERlY2ltYWwgPSBwYXJzZUludCBjb2RlUG9pbnRIZXgsIDE2XG4gICAgICAgICAgICBpZiBjb2RlUG9pbnREZWNpbWFsID4gMHgxMGZmZmZcbiAgICAgICAgICAgICAgICBAZXJyb3IgXCJ1bmljb2RlIGNvZGUgcG9pbnQgZXNjYXBlcyBncmVhdGVyIHRoYW4gXFxcXHV7MTBmZmZmfSBhcmUgbm90IGFsbG93ZWRcIixcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiBvZmZzZXQgKyBvcHRpb25zLmRlbGltaXRlci5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgbGVuZ3RoOiBjb2RlUG9pbnRIZXgubGVuZ3RoICsgNFxuXG4gICAgICAgICAgICBAdW5pY29kZUNvZGVQb2ludFRvVW5pY29kZUVzY2FwZXMgY29kZVBvaW50RGVjaW1hbFxuXG4gICAgdmFsaWRhdGVFc2NhcGVzOiAoc3RyLCBvcHRpb25zID0ge30pIC0+ICMgVmFsaWRhdGVzIGVzY2FwZXMgaW4gc3RyaW5ncyBhbmQgcmVnZXhlcy5cbiAgICAgICAgXG4gICAgICAgIGludmFsaWRFc2NhcGVSZWdleCA9XG4gICAgICAgICAgICBpZiBvcHRpb25zLmlzUmVnZXhcbiAgICAgICAgICAgICAgICBSRUdFWF9JTlZBTElEX0VTQ0FQRVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIFNUUklOR19JTlZBTElEX0VTQ0FQRVxuICAgICAgICBtYXRjaCA9IGludmFsaWRFc2NhcGVSZWdleC5leGVjIHN0clxuICAgICAgICByZXR1cm4gdW5sZXNzIG1hdGNoXG4gICAgICAgIFtbXSwgYmVmb3JlLCBvY3RhbCwgaGV4LCB1bmljb2RlQ29kZVBvaW50LCB1bmljb2RlXSA9IG1hdGNoXG4gICAgICAgIG1lc3NhZ2UgPVxuICAgICAgICAgICAgaWYgb2N0YWxcbiAgICAgICAgICAgICAgICBcIm9jdGFsIGVzY2FwZSBzZXF1ZW5jZXMgYXJlIG5vdCBhbGxvd2VkXCJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBcImludmFsaWQgZXNjYXBlIHNlcXVlbmNlXCJcbiAgICAgICAgaW52YWxpZEVzY2FwZSA9IFwiXFxcXCN7b2N0YWwgb3IgaGV4IG9yIHVuaWNvZGVDb2RlUG9pbnQgb3IgdW5pY29kZX1cIlxuICAgICAgICBAZXJyb3IgXCIje21lc3NhZ2V9ICN7aW52YWxpZEVzY2FwZX1cIixcbiAgICAgICAgICAgIG9mZnNldDogKG9wdGlvbnMub2Zmc2V0SW5DaHVuayA/IDApICsgbWF0Y2guaW5kZXggKyBiZWZvcmUubGVuZ3RoXG4gICAgICAgICAgICBsZW5ndGg6IGludmFsaWRFc2NhcGUubGVuZ3RoXG5cbiAgICBtYWtlRGVsaW1pdGVkTGl0ZXJhbDogKGJvZHksIG9wdGlvbnMgPSB7fSkgLT4gIyBDb25zdHJ1Y3RzIGEgc3RyaW5nIG9yIHJlZ2V4IGJ5IGVzY2FwaW5nIGNlcnRhaW4gY2hhcmFjdGVycy5cbiAgICAgICAgXG4gICAgICAgIGJvZHkgPSAnKD86KScgaWYgYm9keSBpcyAnJyBhbmQgb3B0aW9ucy5kZWxpbWl0ZXIgaXMgJy8nXG4gICAgICAgIHJlZ2V4ID0gLy8vXG4gICAgICAgICAgICAgICAgKFxcXFxcXFxcKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBlc2NhcGVkIGJhY2tzbGFzaFxuICAgICAgICAgICAgfCAoXFxcXDAoPz1bMS03XSkpICAgICAgICAgICAgICAgICAgICAgICAjIG51bCBjaGFyYWN0ZXIgbWlzdGFrZW4gYXMgb2N0YWwgZXNjYXBlXG4gICAgICAgICAgICB8IFxcXFw/KCN7b3B0aW9ucy5kZWxpbWl0ZXJ9KSAgICAgICAgICAgICMgKHBvc3NpYmx5IGVzY2FwZWQpIGRlbGltaXRlclxuICAgICAgICAgICAgfCBcXFxcPyg/OiAoXFxuKXwoXFxyKXwoXFx1MjAyOCl8KFxcdTIwMjkpICkgIyAocG9zc2libHkgZXNjYXBlZCkgbmV3bGluZXNcbiAgICAgICAgICAgIHwgKFxcXFwuKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBvdGhlciBlc2NhcGVzXG4gICAgICAgIC8vL2dcbiAgICAgICAgYm9keSA9IGJvZHkucmVwbGFjZSByZWdleCwgKG1hdGNoLCBiYWNrc2xhc2gsIG51bCwgZGVsaW1pdGVyLCBsZiwgY3IsIGxzLCBwcywgb3RoZXIpIC0+IHN3aXRjaFxuICAgICAgICAgICAgIyBJZ25vcmUgZXNjYXBlZCBiYWNrc2xhc2hlcy5cbiAgICAgICAgICAgIHdoZW4gYmFja3NsYXNoIHRoZW4gKGlmIG9wdGlvbnMuZG91YmxlIHRoZW4gYmFja3NsYXNoICsgYmFja3NsYXNoIGVsc2UgYmFja3NsYXNoKVxuICAgICAgICAgICAgd2hlbiBudWwgICAgICAgdGhlbiAnXFxcXHgwMCdcbiAgICAgICAgICAgIHdoZW4gZGVsaW1pdGVyIHRoZW4gXCJcXFxcI3tkZWxpbWl0ZXJ9XCJcbiAgICAgICAgICAgIHdoZW4gbGYgICAgICAgIHRoZW4gJ1xcXFxuJ1xuICAgICAgICAgICAgd2hlbiBjciAgICAgICAgdGhlbiAnXFxcXHInXG4gICAgICAgICAgICB3aGVuIGxzICAgICAgICB0aGVuICdcXFxcdTIwMjgnXG4gICAgICAgICAgICB3aGVuIHBzICAgICAgICB0aGVuICdcXFxcdTIwMjknXG4gICAgICAgICAgICB3aGVuIG90aGVyICAgICB0aGVuIChpZiBvcHRpb25zLmRvdWJsZSB0aGVuIFwiXFxcXCN7b3RoZXJ9XCIgZWxzZSBvdGhlcilcbiAgICAgICAgXCIje29wdGlvbnMuZGVsaW1pdGVyfSN7Ym9keX0je29wdGlvbnMuZGVsaW1pdGVyfVwiXG5cbiAgICAjIFRocm93cyBhbiBlcnJvciBhdCBlaXRoZXIgYSBnaXZlbiBvZmZzZXQgZnJvbSB0aGUgY3VycmVudCBjaHVuayBvciBhdCB0aGUgbG9jYXRpb24gb2YgYSB0b2tlbiAoYHRva2VuWzJdYCkuXG4gICAgXG4gICAgZXJyb3I6IChtZXNzYWdlLCBvcHRpb25zPXt9KSAtPlxuICAgICAgICBcbiAgICAgICAgbG9jYXRpb24gPVxuICAgICAgICAgICAgaWYgJ2ZpcnN0X2xpbmUnIG9mIG9wdGlvbnNcbiAgICAgICAgICAgICAgICBvcHRpb25zXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgW2ZpcnN0X2xpbmUsIGZpcnN0X2NvbHVtbl0gPSBAZ2V0TGluZUFuZENvbHVtbkZyb21DaHVuayBvcHRpb25zLm9mZnNldCA/IDBcbiAgICAgICAgICAgICAgICB7Zmlyc3RfbGluZSwgZmlyc3RfY29sdW1uLCBsYXN0X2NvbHVtbjogZmlyc3RfY29sdW1uICsgKG9wdGlvbnMubGVuZ3RoID8gMSkgLSAxfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICB0aHJvd1N5bnRheEVycm9yIG1vZHVsZTonbGV4ZXInLCBtZXNzYWdlOm1lc3NhZ2UsIGxvY2F0aW9uOmxvY2F0aW9uXG5cbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcblxuaXNVbmFzc2lnbmFibGUgPSAobmFtZSwgZGlzcGxheU5hbWUgPSBuYW1lKSAtPiBzd2l0Y2hcbiAgICBcbiAgICB3aGVuIG5hbWUgaW4gW0pTX0tFWVdPUkRTLi4uLCBDT0ZGRUVfS0VZV09SRFMuLi5dXG4gICAgICAgIFwia2V5d29yZCAnI3tkaXNwbGF5TmFtZX0nIGNhbid0IGJlIGFzc2lnbmVkXCJcbiAgICB3aGVuIG5hbWUgaW4gU1RSSUNUX1BST1NDUklCRURcbiAgICAgICAgXCInI3tkaXNwbGF5TmFtZX0nIGNhbid0IGJlIGFzc2lnbmVkXCJcbiAgICB3aGVuIG5hbWUgaW4gUkVTRVJWRURcbiAgICAgICAgXCJyZXNlcnZlZCB3b3JkICcje2Rpc3BsYXlOYW1lfScgY2FuJ3QgYmUgYXNzaWduZWRcIlxuICAgIGVsc2VcbiAgICAgICAgZmFsc2VcblxuIyBgZnJvbWAgaXNu4oCZdCBhIGtleXdvcmQsIGJ1dCBpdCBiZWhhdmVzIGxpa2Ugb25lIGluIGBpbXBvcnRgIGFuZCBgZXhwb3J0YCBzdGF0ZW1lbnRzIChoYW5kbGVkIGFib3ZlKSBcbiMgYW5kIGluIHRoZSBkZWNsYXJhdGlvbiBsaW5lIG9mIGEgYGZvcmAgbG9vcC5cbiMgVHJ5IHRvIGRldGVjdCB3aGVuIGBmcm9tYCBpcyBhIHZhcmlhYmxlIGlkZW50aWZpZXIgYW5kIHdoZW4gaXQgaXMgdGhpcyDigJxzb21ldGltZXPigJ0ga2V5d29yZC5cblxuaXNGb3JGcm9tID0gKHByZXYpIC0+XG4gICAgXG4gICAgaWYgcHJldlswXSBpcyAnSURFTlRJRklFUidcbiAgICAgICAgIyBgZm9yIGkgZnJvbSBmcm9tYCwgYGZvciBmcm9tIGZyb20gaXRlcmFibGVgXG4gICAgICAgIGlmIHByZXZbMV0gaXMgJ2Zyb20nXG4gICAgICAgICAgICBwcmV2WzFdWzBdID0gJ0lERU5USUZJRVInXG4gICAgICAgICAgICB5ZXNcbiAgICAgICAgIyBgZm9yIGkgZnJvbSBpdGVyYWJsZWBcbiAgICAgICAgeWVzXG4gICAgIyBgZm9yIGZyb23igKZgXG4gICAgZWxzZSBpZiBwcmV2WzBdIGlzICdGT1InXG4gICAgICAgIG5vXG4gICAgIyBgZm9yIHtmcm9tfeKApmAsIGBmb3IgW2Zyb21d4oCmYCwgYGZvciB7YSwgZnJvbX3igKZgLCBgZm9yIHthOiBmcm9tfeKApmBcbiAgICBlbHNlIGlmIHByZXZbMV0gaW4gWyd7JydbJycsJyc6J11cbiAgICAgICAgbm9cbiAgICBlbHNlXG4gICAgICAgIHllc1xuXG4jIyNcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgIFxuIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4jIyNcblxuIyBLZXl3b3JkcyB0aGF0IHdlIHNoYXJlIGluIGNvbW1vbiB3aXRoIEphdmFTY3JpcHQuXG5cbk1FVEFfS0VZV09SRFMgPSBbICdpZicgJ3RoZW4nICdlbGlmJyAnZWxzZScgXVxuXG5KU19LRVlXT1JEUyA9IFtcbiAgICAndHJ1ZScgJ2ZhbHNlJyAnbnVsbCcgJ3RoaXMnXG4gICAgJ25ldycgJ2RlbGV0ZScgJ3R5cGVvZicgJ2luJyAnaW5zdGFuY2VvZidcbiAgICAncmV0dXJuJyAndGhyb3cnICdicmVhaycgJ2NvbnRpbnVlJyAnZGVidWdnZXInICd5aWVsZCdcbiAgICAnaWYnICdlbHNlJyAnc3dpdGNoJyAnZm9yJyAnd2hpbGUnICdkbycgJ3RyeScgJ2NhdGNoJyAnZmluYWxseSdcbiAgICAnY2xhc3MnICdleHRlbmRzJyAnc3VwZXInXG4gICAgJ2ltcG9ydCcgJ2V4cG9ydCcgJ2RlZmF1bHQnXG5dXG5cbkNPRkZFRV9LRVlXT1JEUyA9IFsgJ3VuZGVmaW5lZCcgJ0luZmluaXR5JyAnTmFOJyAndGhlbicgJ3VubGVzcycgJ3VudGlsJyAnbG9vcCcgJ29mJyAnYnknICd3aGVuJyBdXG5cbkNPRkZFRV9BTElBU19NQVAgPVxuICAgIGFuZCAgOiAnJiYnXG4gICAgb3IgICA6ICd8fCdcbiAgICBpcyAgIDogJz09J1xuICAgIGlzbnQgOiAnIT0nICMgdWdseSEgcmVtb3ZlIGluIGNhc2UgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkgd2l0aCBDUzEgaXMgYnJva2VuLiBcbiAgICBub3QgIDogJyEnXG4gICAgeWVzICA6ICd0cnVlJ1xuICAgIG5vICAgOiAnZmFsc2UnXG4gICAgb24gICA6ICd0cnVlJ1xuICAgIG9mZiAgOiAnZmFsc2UnXG5cbkNPRkZFRV9BTElBU0VTICA9IChrZXkgZm9yIGtleSBvZiBDT0ZGRUVfQUxJQVNfTUFQKVxuQ09GRkVFX0tFWVdPUkRTID0gQ09GRkVFX0tFWVdPUkRTLmNvbmNhdCBDT0ZGRUVfQUxJQVNFU1xuXG4jIFRoZSBsaXN0IG9mIGtleXdvcmRzIHRoYXQgYXJlIHJlc2VydmVkIGJ5IEphdmFTY3JpcHQsIGJ1dCBub3QgdXNlZCwgb3IgdXNlZCBpbnRlcm5hbGx5LlxuIyBXZSB0aHJvdyBhbiBlcnJvciB3aGVuIHRoZXNlIGFyZSBlbmNvdW50ZXJlZCwgdG8gYXZvaWQgaGF2aW5nIGEgSmF2YVNjcmlwdCBlcnJvciBhdCBydW50aW1lLlxuXG5SRVNFUlZFRCA9IFtcbiAgICAnY2FzZScgJ2Z1bmN0aW9uJyAndmFyJyAndm9pZCcgJ3dpdGgnICdjb25zdCcgJ2xldCcgJ2VudW0nXG4gICAgJ25hdGl2ZScgJ2ltcGxlbWVudHMnICdpbnRlcmZhY2UnICdwYWNrYWdlJyAncHJpdmF0ZSdcbiAgICAncHJvdGVjdGVkJyAncHVibGljJyAnc3RhdGljJ1xuXVxuXG5TVFJJQ1RfUFJPU0NSSUJFRCA9IFsnYXJndW1lbnRzJyAnZXZhbCddXG5cbiMgVGhlIHN1cGVyc2V0IG9mIGJvdGggSmF2YVNjcmlwdCBrZXl3b3JkcyBhbmQgcmVzZXJ2ZWQgd29yZHMsIG5vbmUgb2Ygd2hpY2ggbWF5XG4jIGJlIHVzZWQgYXMgaWRlbnRpZmllcnMgb3IgcHJvcGVydGllcy5cblxuQk9NID0gNjUyNzkgIyBUaGUgY2hhcmFjdGVyIGNvZGUgb2YgdGhlIG5hc3R5IE1pY3Jvc29mdCBtYWRuZXNzIG90aGVyd2lzZSBrbm93biBhcyB0aGUgQk9NLlxuXG4jIFRva2VuIG1hdGNoaW5nIHJlZ2V4ZXMuXG5cbklERU5USUZJRVIgPSAvLy8gXlxuICAgICg/IVxcZClcbiAgICAoICg/OiAoPyFcXHMpWyRcXHdcXHg3Zi1cXHVmZmZmXSApKyApXG4gICAgKCBbXlxcblxcU10qIDogKD8hOikgKT8gICAgIyBJcyB0aGlzIGEgcHJvcGVydHkgbmFtZT9cbi8vL1xuXG5OVU1CRVIgPSAvLy9cbiAgICBeIDBiWzAxXSsgICAgfCAgICAgICAgICAgICAgIyBiaW5hcnlcbiAgICBeIDBvWzAtN10rICAgfCAgICAgICAgICAgICAgIyBvY3RhbFxuICAgIF4gMHhbXFxkYS1mXSsgfCAgICAgICAgICAgICAgIyBoZXhcbiAgICBeIFxcZCpcXC4/XFxkKyAoPzplWystXT9cXGQrKT8gICMgZGVjaW1hbFxuLy8vaVxuXG5PUEVSQVRPUiA9IC8vLyBeIChcbiAgICA/OiBbLT1dPiAgICAgICAgICAgICAjIGZ1bmN0aW9uXG4gICAgIHwgWy0rKi8lPD4mfF4hPz1dPSAgIyBjb21wb3VuZCBhc3NpZ24gLyBjb21wYXJlXG4gICAgIHwgPj4+PT8gICAgICAgICAgICAgIyB6ZXJvLWZpbGwgcmlnaHQgc2hpZnRcbiAgICAgfCAoWy0rOl0pXFwxICAgICAgICAgIyBkb3VibGVzXG4gICAgIHwgKFsmfDw+Ki8lXSlcXDI9PyAgICMgbG9naWMgLyBzaGlmdCAvIHBvd2VyIC8gZmxvb3IgZGl2aXNpb24gLyBtb2R1bG9cbiAgICAgfCBcXD8oXFwufDo6KSAgICAgICAgICMgc29hayBhY2Nlc3NcbiAgICAgfCBcXC57MiwzfSAgICAgICAgICAgIyByYW5nZSBvciBzcGxhdFxuKSAvLy9cblxuV0hJVEVTUEFDRSA9IC9eW15cXG5cXFNdKy9cblxuIyBDT01NRU5UICAgID0gL14jIyMoW14jXVtcXHNcXFNdKj8pKD86IyMjW15cXG5cXFNdKnwjIyMkKXxeKD86XFxzKiMoPyEjI1teI10pLiopKy8gIyBtb3ZlZCB0byBlbmRcblxuQ09ERSAgICAgICA9IC9eWy09XT4vXG5cbk1VTFRJX0RFTlQgPSAvXig/OlxcblteXFxuXFxTXSopKy9cblxuSlNUT0tFTiAgICAgID0gLy8vXiBgKD8hYGApICgoPzogW15gXFxcXF0gfCBcXFxcW1xcc1xcU10gICAgICAgICAgICkqKSBgICAgLy8vXG5IRVJFX0pTVE9LRU4gPSAvLy9eIGBgYCAgICAgKCg/OiBbXmBcXFxcXSB8IFxcXFxbXFxzXFxTXSB8IGAoPyFgYCkgKSopIGBgYCAvLy9cblxuIyBTdHJpbmctbWF0Y2hpbmctcmVnZXhlcy5cblxuU1RSSU5HX1NUQVJUICAgPSAvXig/OicnJ3xcIlwiXCJ8J3xcIikvXG5cblNUUklOR19TSU5HTEUgID0gLy8vIF4oPzogW15cXFxcJ10gIHwgXFxcXFtcXHNcXFNdICAgICAgICAgICAgICAgICAgICAgICkqIC8vL1xuU1RSSU5HX0RPVUJMRSAgPSAvLy8gXig/OiBbXlxcXFxcIiNdIHwgXFxcXFtcXHNcXFNdIHwgICAgICAgICAgIFxcIyg/IVxceykgKSogLy8vXG5IRVJFRE9DX1NJTkdMRSA9IC8vLyBeKD86IFteXFxcXCddICB8IFxcXFxbXFxzXFxTXSB8ICcoPyEnJykgICAgICAgICAgICApKiAvLy9cbkhFUkVET0NfRE9VQkxFID0gLy8vIF4oPzogW15cXFxcXCIjXSB8IFxcXFxbXFxzXFxTXSB8IFwiKD8hXCJcIikgfCBcXCMoPyFcXHspICkqIC8vL1xuXG5TVFJJTkdfT01JVCAgICA9IC8vL1xuICAgICAgICAoKD86XFxcXFxcXFwpKykgICAgICAjIGNvbnN1bWUgKGFuZCBwcmVzZXJ2ZSkgYW4gZXZlbiBudW1iZXIgb2YgYmFja3NsYXNoZXNcbiAgICB8IFxcXFxbXlxcU1xcbl0qXFxuXFxzKiAgICAjIHJlbW92ZSBlc2NhcGVkIG5ld2xpbmVzXG4vLy9nXG5TSU1QTEVfU1RSSU5HX09NSVQgPSAvXFxzKlxcblxccyovZ1xuSEVSRURPQ19JTkRFTlQgICAgICAgPSAvXFxuKyhbXlxcblxcU10qKSg/PVxcUykvZ1xuXG4jIFJlZ2V4LW1hdGNoaW5nLXJlZ2V4ZXMuXG5SRUdFWCA9IC8vLyBeXG4gICAgLyAoPyEvKSAoKFxuICAgID86IFteIFsgLyBcXG4gXFxcXCBdICAgICMgZXZlcnkgb3RoZXIgdGhpbmdcbiAgICAgfCBcXFxcW15cXG5dICAgICAgICAgICAjIGFueXRoaW5nIGJ1dCBuZXdsaW5lcyBlc2NhcGVkXG4gICAgIHwgXFxbICAgICAgICAgICAgICAgICMgY2hhcmFjdGVyIGNsYXNzXG4gICAgICAgICAgICAgKD86IFxcXFxbXlxcbl0gfCBbXiBcXF0gXFxuIFxcXFwgXSApKlxuICAgICAgICAgXFxdXG4gICAgKSopICgvKT9cbi8vL1xuXG5SRUdFWF9GTEFHUyAgPSAvXlxcdyovXG5WQUxJRF9GTEFHUyAgPSAvXig/IS4qKC4pLipcXDEpW2ltZ3V5XSokL1xuXG5IRVJFR0VYICAgICAgPSAvLy8gXig/OiBbXlxcXFwvI10gfCBcXFxcW1xcc1xcU10gfCAvKD8hLy8pIHwgXFwjKD8hXFx7KSApKiAvLy9cblxuSEVSRUdFWF9PTUlUID0gLy8vXG4gICAgICAoKD86XFxcXFxcXFwpKykgICAgICAgICAgICMgY29uc3VtZSAoYW5kIHByZXNlcnZlKSBhbiBldmVuIG51bWJlciBvZiBiYWNrc2xhc2hlc1xuICAgIHwgXFxcXChcXHMpICAgICAgICAgICAgICAgICMgcHJlc2VydmUgZXNjYXBlZCB3aGl0ZXNwYWNlXG4gICAgfCBcXHMrKD86Iy4qKT8gICAgICAgICAgICMgcmVtb3ZlIHdoaXRlc3BhY2UgYW5kIGNvbW1lbnRzXG4vLy9nXG5cblJFR0VYX0lMTEVHQUwgPSAvLy8gXiAoIC8gfCAvezN9XFxzKikgKFxcKikgLy8vXG5cblBPU1NJQkxZX0RJVklTSU9OID0gLy8vIF4gLz0/XFxzIC8vL1xuXG4jIE90aGVyIHJlZ2V4ZXMuXG5cbkhFUkVDT01NRU5UX0lMTEVHQUwgPSAvXFwqXFwvL1xuXG5MSU5FX0NPTlRJTlVFUiAgICAgICAgICA9IC8vLyBeIFxccyogKD86ICwgfCBcXD8/XFwuKD8hWy5cXGRdKSB8IDo6ICkgLy8vXG5cblNUUklOR19JTlZBTElEX0VTQ0FQRSA9IC8vL1xuICAgICggKD86XnxbXlxcXFxdKSAoPzpcXFxcXFxcXCkqICkgICAgICAgICAgICAgICAgICAgIyBtYWtlIHN1cmUgdGhlIGVzY2FwZSBpc27igJl0IGVzY2FwZWRcbiAgICBcXFxcICggICBcbiAgICAgICAgID86ICgwWzAtN118WzEtN10pICAgICAgICAgICAgICAgICAgICAgICMgb2N0YWwgZXNjYXBlXG4gICAgICAgICAgICB8ICh4KD8hW1xcZGEtZkEtRl17Mn0pLnswLDJ9KSAgICAgICAgIyBoZXggZXNjYXBlXG4gICAgICAgICAgICB8ICh1XFx7KD8hW1xcZGEtZkEtRl17MSx9XFx9KVtefV0qXFx9PykgIyB1bmljb2RlIGNvZGUgcG9pbnQgZXNjYXBlXG4gICAgICAgICAgICB8ICh1KD8hXFx7fFtcXGRhLWZBLUZdezR9KS57MCw0fSkgICAgICMgdW5pY29kZSBlc2NhcGVcbiAgICApXG4vLy9cblJFR0VYX0lOVkFMSURfRVNDQVBFID0gLy8vXG4gICAgKCAoPzpefFteXFxcXF0pICg/OlxcXFxcXFxcKSogKSAgICAgICAgICAgICAgICAgICAjIG1ha2Ugc3VyZSB0aGUgZXNjYXBlIGlzbuKAmXQgZXNjYXBlZFxuICAgIFxcXFwgKCAgIFxuICAgICAgICAgPzogKDBbMC03XSkgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBvY3RhbCBlc2NhcGVcbiAgICAgICAgICAgIHwgKHgoPyFbXFxkYS1mQS1GXXsyfSkuezAsMn0pICAgICAgICAjIGhleCBlc2NhcGVcbiAgICAgICAgICAgIHwgKHVcXHsoPyFbXFxkYS1mQS1GXXsxLH1cXH0pW159XSpcXH0/KSAjIHVuaWNvZGUgY29kZSBwb2ludCBlc2NhcGVcbiAgICAgICAgICAgIHwgKHUoPyFcXHt8W1xcZGEtZkEtRl17NH0pLnswLDR9KSAgICAgIyB1bmljb2RlIGVzY2FwZVxuICAgIClcbi8vL1xuXG5VTklDT0RFX0NPREVfUE9JTlRfRVNDQVBFID0gLy8vXG4gICAgKCBcXFxcXFxcXCApICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBtYWtlIHN1cmUgdGhlIGVzY2FwZSBpc27igJl0IGVzY2FwZWRcbiAgICB8XG4gICAgXFxcXHVcXHsgKCBbXFxkYS1mQS1GXSsgKSBcXH1cbi8vL2dcblxuTEVBRElOR19CTEFOS19MSU5FICA9IC9eW15cXG5cXFNdKlxcbi9cblRSQUlMSU5HX0JMQU5LX0xJTkUgPSAvXFxuW15cXG5cXFNdKiQvXG5UUkFJTElOR19TUEFDRVMgICAgID0gL1xccyskL1xuQ09NUE9VTkRfQVNTSUdOICAgICA9IFsgJy09JyAnKz0nICcvPScgJyo9JyAnJT0nICd8fD0nICcmJj0nICc/PScgJzw8PScgJz4+PScgJz4+Pj0nICcmPScgJ149JyAnfD0nICcqKj0nICcvLz0nICclJT0nIF1cblVOQVJZICAgICAgICAgICAgICAgPSBbJ05FVycgJ1RZUEVPRicgJ0RFTEVURScgJ0RPJ11cblVOQVJZX01BVEggICAgICAgICAgPSBbJyEnICd+J11cblNISUZUICAgICAgICAgICAgICAgPSBbJzw8JyAnPj4nICc+Pj4nXVxuQ09NUEFSRSAgICAgICAgICAgICA9IFsnPT0nICchPScgJzwnICc+JyAnPD0nICc+PSddXG5NQVRIICAgICAgICAgICAgICAgID0gWycqJyAnLycgJyUnICcvLycgJyUlJ11cblJFTEFUSU9OICAgICAgICAgICAgPSBbJ0lOJyAnT0YnICdJTlNUQU5DRU9GJ10gIyBSZWxhdGlvbmFsIHRva2VucyB0aGF0IGFyZSBuZWdhdGFibGUgd2l0aCBgbm90YCBwcmVmaXguXG5CT09MICAgICAgICAgICAgICAgID0gWydUUlVFJyAnRkFMU0UnXVxuXG4jIFRva2VucyB3aGljaCBjb3VsZCBsZWdpdGltYXRlbHkgYmUgaW52b2tlZCBvciBpbmRleGVkLiBBbiBvcGVuaW5nXG4jIHBhcmVudGhlc2VzIG9yIGJyYWNrZXQgZm9sbG93aW5nIHRoZXNlIHRva2VucyB3aWxsIGJlIHJlY29yZGVkIGFzIHRoZSBzdGFydFxuIyBvZiBhIGZ1bmN0aW9uIGludm9jYXRpb24gb3IgaW5kZXhpbmcgb3BlcmF0aW9uLlxuXG5DQUxMQUJMRSAgPSBbJ0lERU5USUZJRVInICdQUk9QRVJUWScgJyknICddJyAnPycgJ0AnICdUSElTJyAnU1VQRVInXVxuSU5ERVhBQkxFID0gQ0FMTEFCTEUuY29uY2F0IFsgJ05VTUJFUicgJ0lORklOSVRZJyAnTkFOJyAnU1RSSU5HJyAnU1RSSU5HX0VORCcgJ1JFR0VYJyAnUkVHRVhfRU5EJyAnQk9PTCcgJ05VTEwnICdVTkRFRklORUQnICd9JyAnOjonIF1cblxuIyBUb2tlbnMgd2hpY2ggYSByZWd1bGFyIGV4cHJlc3Npb24gd2lsbCBuZXZlciBpbW1lZGlhdGVseSBmb2xsb3cgKGV4Y2VwdCBzcGFjZWRcbiMgQ0FMTEFCTEVzIGluIHNvbWUgY2FzZXMpLCBidXQgd2hpY2ggYSBkaXZpc2lvbiBvcGVyYXRvciBjYW4uXG4jXG4jIFNlZTogaHR0cDovL3d3dy1hcmNoaXZlLm1vemlsbGEub3JnL2pzL2xhbmd1YWdlL2pzMjAtMjAwMi0wNC9yYXRpb25hbGUvc3ludGF4Lmh0bWwjcmVndWxhci1leHByZXNzaW9uc1xuXG5OT1RfUkVHRVggPSBJTkRFWEFCTEUuY29uY2F0IFsnKysnICctLSddXG5cbiMgVG9rZW5zIHRoYXQsIHdoZW4gaW1tZWRpYXRlbHkgcHJlY2VkaW5nIGEgYFdIRU5gLCBpbmRpY2F0ZSB0aGF0IHRoZSBgV0hFTmBcbiMgb2NjdXJzIGF0IHRoZSBzdGFydCBvZiBhIGxpbmUuIFdlIGRpc2FtYmlndWF0ZSB0aGVzZSBmcm9tIHRyYWlsaW5nIHdoZW5zIHRvXG4jIGF2b2lkIGFuIGFtYmlndWl0eSBpbiB0aGUgZ3JhbW1hci5cblxuTElORV9CUkVBSyA9IFsnSU5ERU5UJyAnT1VUREVOVCcgJ1RFUk1JTkFUT1InXVxuXG4jIEFkZGl0aW9uYWwgaW5kZW50IGluIGZyb250IG9mIHRoZXNlIGlzIGlnbm9yZWQuXG5cbklOREVOVEFCTEVfQ0xPU0VSUyA9IFsnKScgJ30nICddJ11cblxuIyBUb2tlbnMgdGhhdCwgd2hlbiBhcHBlYXJpbmcgYXQgdGhlIGVuZCBvZiBhIGxpbmUsIHN1cHByZXNzIGEgZm9sbG93aW5nIFRFUk1JTkFUT1IvSU5ERU5UIHRva2VuXG5cblVORklOSVNIRUQgPSBbJ1xcXFwnICcuJyAnPy4nICc/OjonICdVTkFSWScgJ01BVEgnICdVTkFSWV9NQVRIJyAnKycgJy0nXG4gICAgICAgICAgICAgICcqKicgJ1NISUZUJyAnUkVMQVRJT04nICdDT01QQVJFJyAnJicgJ14nICd8JyAnJiYnICd8fCdcbiAgICAgICAgICAgICAgJ0JJTj8nICdUSFJPVycgJ0VYVEVORFMnXVxuICAgICAgICAgICAgICBcbkNPTU1FTlQgICAgPSAvXiMjIyhbXiNdW1xcc1xcU10qPykoPzojIyNbXlxcblxcU10qfCMjIyQpfF4oPzpcXHMqIyg/ISMjW14jXSkuKikrLyAgICAgICAgICAgICAgXG5cbm1vZHVsZS5leHBvcnRzID0gXG4gICAgSlNfRk9SQklEREVOOiAgIEpTX0tFWVdPUkRTLmNvbmNhdChSRVNFUlZFRCkuY29uY2F0KFNUUklDVF9QUk9TQ1JJQkVEKVxuICAgIGlzVW5hc3NpZ25hYmxlOiBpc1VuYXNzaWduYWJsZVxuICAgIExleGVyOiAgICAgICAgICBMZXhlclxuICAgICJdfQ==
//# sourceURL=../coffee/lexer.coffee