// koffee 0.47.0

/*
000   000  000       0000000   00000000   
000  000   000      000   000  000   000  
0000000    000      000   000  0000000    
000  000   000      000   000  000   000  
000   000  0000000   0000000   000   000
 */

(function() {
    var FLOAT, HEADER, HEX, HEXNUM, NUMBER, PUNCT, SPACE, actExt, addValue, addValues, blockComment, blocked, chunk, chunkIndex, chunked, codeTypes, coffeePunct, coffeeWord, commentHeader, cppMacro, cssWord, dashArrow, dict, escape, ext, extStack, extTop, exts, fillComment, float, getChunk, getValue, getmatch, handl, handlers, hashComment, i, interpolation, j, jsPunct, jsWord, jsonPunct, jsonWord, k, keyword, keywords, koffee, kstr, lang, last, len, len1, len2, len3, line, lines0, lines1, mdPunct, names, noon, noonComment, noonProp, noonPunct, noonWord, notCode, number, obj, p, parse, popExt, popStack, property, pushExt, pushStack, q, r, ref, ref1, ref2, regexp, setValue, shPunct, simpleString, slash, slashComment, stack, stackTop, stacked, starComment, swtch, text0, text1, thisCall, topType, tripleRegexp, tripleString, urlPunct, urlWord, value, word, words, xmlPunct,
        indexOf = [].indexOf;

    ref = require('kxk'), slash = ref.slash, noon = ref.noon, kstr = ref.kstr, last = ref.last;

    koffee = require('koffee');

    exts = ['txt', 'log', 'koffee'];

    lang = {};

    ref1 = noon.load(slash.join(__dirname, '..', 'coffee', 'lang.noon'));
    for (names in ref1) {
        keywords = ref1[names];
        ref2 = names.split(/\s/);
        for (j = 0, len = ref2.length; j < len; j++) {
            ext = ref2[j];
            if (indexOf.call(exts, ext) < 0) {
                exts.push(ext);
            }
            if (lang[ext] != null) {
                lang[ext];
            } else {
                lang[ext] = {};
            }
            for (value in keywords) {
                words = keywords[value];
                for (k = 0, len1 = words.length; k < len1; k++) {
                    word = words[k];
                    lang[ext][word] = value;
                }
            }
        }
    }

    swtch = {
        coffee: {
            doc: {
                turd: '▸',
                to: 'md',
                indent: 1
            }
        },
        md: {
            coffeescript: {
                turd: '```',
                to: 'coffee',
                end: '```',
                add: 'code triple'
            },
            javascript: {
                turd: '```',
                to: 'js',
                end: '```',
                add: 'code triple'
            }
        }
    };

    for (p = 0, len2 = exts.length; p < len2; p++) {
        ext = exts[p];
        swtch.md[ext] = {
            turd: '```',
            to: ext,
            end: '```',
            add: 'code triple'
        };
    }

    SPACE = /\s/;

    HEADER = /^0+$/;

    PUNCT = /\W+/g;

    NUMBER = /^\d+$/;

    FLOAT = /^\d+f$/;

    HEXNUM = /^0x[a-fA-F\d]+$/;

    HEX = /^[a-fA-F\d]+$/;

    codeTypes = ['interpolation', 'code triple'];

''

    chunked = function(lines, ext) {
        var lineno;
        if (ext === 'koffee') {
            ext = 'coffee';
        }
        if (indexOf.call(exts, ext) < 0) {
            ext = 'txt';
        }
        lineno = 0;
        return lines.map(function(text) {
            var advance, c, chunks, l, len3, line, m, pc, pi, punct, q, ref3, ref4, rl, s, sc, turd, w, wl;
            line = {
                chunks: [],
                chars: 0,
                index: lineno++,
                number: lineno,
                ext: ext
            };
            chunks = kstr.replaceTabs(text).split(SPACE);
            if (chunks.length === 1 && chunks[0] === '') {
                return line;
            }
            c = 0;
            for (q = 0, len3 = chunks.length; q < len3; q++) {
                s = chunks[q];
                if (s === '') {
                    c++;
                } else {
                    if (line.chunks.length) {
                        c++;
                    }
                    l = s.length;
                    sc = c;
                    while (m = PUNCT.exec(s)) {
                        if (m.index > 0) {
                            wl = m.index - (c - sc);
                            w = s.slice(c - sc, m.index);
                            line.chunks.push({
                                start: c,
                                length: wl,
                                match: w,
                                value: 'text'
                            });
                            c += wl;
                        }
                        turd = punct = m[0];
                        pi = 0;
                        advance = 1;
                        value = 'punct';
                        while (pi < punct.length - 1) {
                            pc = punct[pi];
                            advance = 1;
                            if ((0xD800 <= (ref3 = punct.charCodeAt(pi)) && ref3 <= 0xDBFF) && (0xDC00 <= (ref4 = punct.charCodeAt(pi + 1)) && ref4 <= 0xDFFF)) {
                                advance = 2;
                                value = 'text';
                                pc += punct[pi + 1];
                            } else {
                                value = 'punct';
                            }
                            pi += advance;
                            line.chunks.push({
                                start: c,
                                length: advance,
                                match: pc,
                                turd: turd,
                                value: value
                            });
                            c += advance;
                            turd = turd.slice(advance);
                        }
                        if (pi < punct.length) {
                            line.chunks.push({
                                start: c,
                                length: advance,
                                match: punct.slice(pi),
                                value: value
                            });
                            c += advance;
                        }
                    }
                    if (c < sc + l) {
                        rl = sc + l - c;
                        w = s.slice(l - rl);
                        line.chunks.push({
                            start: c,
                            length: rl,
                            match: w,
                            value: 'text'
                        });
                        c += rl;
                    }
                }
            }
            if (line.chunks.length) {
                last = line.chunks.slice(-1)[0];
                line.chars = last.start + last.length;
            }
            return line;
        });
    };


    /*
    000   000   0000000   000   000  0000000    000      00000000  00000000    0000000    
    000   000  000   000  0000  000  000   000  000      000       000   000  000         
    000000000  000000000  000 0 000  000   000  000      0000000   0000000    0000000     
    000   000  000   000  000  0000  000   000  000      000       000   000       000    
    000   000  000   000  000   000  0000000    0000000  00000000  000   000  0000000
     */

    extStack = [];

    stack = [];

    handl = [];

    extTop = null;

    stackTop = null;

    notCode = false;

    topType = '';

    ext = '';

    line = null;

    chunk = null;

    chunkIndex = 0;

    fillComment = function(n) {
        var c, i, len3, len4, mightBeHeader, q, r, ref3, restChunks, t;
        for (i = q = 0, ref3 = n; 0 <= ref3 ? q < ref3 : q > ref3; i = 0 <= ref3 ? ++q : --q) {
            addValue(i, 'comment');
        }
        if (chunkIndex < line.chunks.length - n) {
            restChunks = line.chunks.slice(chunkIndex + n);
            mightBeHeader = true;
            for (r = 0, len3 = restChunks.length; r < len3; r++) {
                c = restChunks[r];
                c.value = 'comment';
                if (mightBeHeader && !HEADER.test(c.match)) {
                    mightBeHeader = false;
                }
            }
            if (mightBeHeader) {
                for (t = 0, len4 = restChunks.length; t < len4; t++) {
                    c = restChunks[t];
                    c.value += ' header';
                }
            }
        }
        return line.chunks.length - chunkIndex + n;
    };

    hashComment = function() {
        if (stackTop && topType !== 'regexp triple') {
            return;
        }
        if (stackTop && stackTop.lineno === line.number) {
            return;
        }
        if (chunk.match === "#") {
            return fillComment(1);
        }
    };

    noonComment = function() {
        if (stackTop) {
            return;
        }
        if (chunk.match === "#" && chunkIndex === 0) {
            return fillComment(1);
        }
    };

    slashComment = function() {
        var ref3;
        if (stackTop) {
            return;
        }
        if ((ref3 = chunk.turd) != null ? ref3.startsWith("//") : void 0) {
            return fillComment(2);
        }
    };

    blockComment = function() {
        var type;
        if (!chunk.turd || chunk.turd.length < 3) {
            return;
        }
        type = 'comment triple';
        if (topType && (topType !== 'interpolation' && topType !== type)) {
            return;
        }
        if (chunk.turd.slice(0, 3) === '###') {
            if (topType === type) {
                popStack();
            } else {
                pushStack({
                    type: type,
                    strong: true
                });
            }
            return addValues(3, type);
        }
    };

    starComment = function() {
        var type;
        if (!chunk.turd) {
            return;
        }
        type = 'comment triple';
        if (topType && topType !== type) {
            return;
        }
        if (chunk.turd.slice(0, 2) === '/*' && !topType) {
            pushStack({
                type: type,
                strong: true
            });
            return addValues(2, type);
        }
        if (chunk.turd.slice(0, 2) === '*/' && topType === type) {
            popStack();
            return addValues(2, type);
        }
    };

    dashArrow = function() {
        var markFunc, ref3;
        if (notCode) {
            return;
        }
        markFunc = function() {
            if (line.chunks[0].value === 'text') {
                if (line.chunks[1].match === '=' && line.chunks[2].match !== '>') {
                    line.chunks[0].value = 'function';
                    return line.chunks[1].value += ' function';
                } else if (line.chunks[1].match === ':') {
                    line.chunks[0].value = 'method';
                    return line.chunks[1].value += ' method';
                }
            }
        };
        if (chunk.turd) {
            if (chunk.turd.startsWith('->')) {
                markFunc();
                addValue(0, 'function tail');
                addValue(1, 'function head');
                if (line.chunks[0].value === 'dictionary key' || ((ref3 = line.chunks[0].turd) != null ? ref3.slice(0, 2) : void 0) === '@:') {
                    line.chunks[0].value = 'method';
                    line.chunks[1].value = 'punct method';
                } else if (line.chunks[0].match === '@' && line.chunks[1].value === 'dictionary key') {
                    line.chunks[0].value = 'punct method class';
                    line.chunks[1].value = 'method class';
                    line.chunks[2].value = 'punct method class';
                }
                return 2;
            }
            if (chunk.turd.startsWith('=>')) {
                markFunc();
                addValue(0, 'function bound tail');
                addValue(1, 'function bound head');
                if (line.chunks[0].value === 'dictionary key') {
                    line.chunks[0].value = 'method';
                    line.chunks[1].value = 'punct method';
                }
                return 2;
            }
        }
    };

    commentHeader = function() {
        if (topType === 'comment triple') {
            if (HEADER.test(chunk.match)) {
                chunk.value = 'comment triple header';
                return 1;
            }
        }
    };

    thisCall = function() {
        setValue(-1, 'function call');
        if (getmatch(-2) === '@') {
            setValue(-2, 'punct function call');
        }
        return 0;
    };

    coffeePunct = function() {
        var next, prev, prevEnd, ref3, ref4, ref5;
        if (notCode) {
            return;
        }
        if (chunk.match === '▸') {
            return addValue(0, 'meta');
        }
        if (chunk.turd === '~>') {
            return addValues(2, 'meta');
        }
        if (prev = getChunk(-1)) {
            if (((ref3 = chunk.turd) != null ? ref3.startsWith('..') : void 0) && prev.match !== '.') {
                if (chunk.turd[2] !== '.') {
                    return addValues(2, 'range');
                }
                if (chunk.turd[3] !== '.') {
                    return addValues(3, 'range');
                }
            }
            if (prev.value.startsWith('text') || prev.value === 'property') {
                prevEnd = prev.start + prev.length;
                if (chunk.match === '(' && prevEnd === chunk.start) {
                    return thisCall();
                } else if (prevEnd < chunk.start) {
                    if (ref4 = chunk.match, indexOf.call('@[({"\'', ref4) >= 0) {
                        return thisCall();
                    } else if (ref5 = chunk.match, indexOf.call('+-/', ref5) >= 0) {
                        next = getChunk(1);
                        if (!next || next.match !== '=' && next.start === chunk.start + 1) {
                            return thisCall();
                        }
                    }
                }
            }
        }
    };

    coffeeWord = function() {
        var prev, ref3;
        if (notCode) {
            return;
        }
        if (prev = getChunk(-1)) {
            if (prev.value === 'punct meta') {
                if (chunk.start === prev.start + 1) {
                    setValue(0, 'meta');
                    return 0;
                }
            }
            if ((ref3 = prev.match) === 'class' || ref3 === 'extends') {
                setValue(0, 'class');
                return 1;
            }
            if (chunk.value.startsWith('keyword')) {
                return 1;
            }
            if (prev.match === '@') {
                addValue(-1, 'this');
                addValue(0, 'this');
                return 1;
            }
            if ((prev.value.startsWith('text') || prev.value === 'property') && prev.start + prev.length < chunk.start) {
                return thisCall();
            }
        }
    };

    property = function() {
        var prevPrev, ref3;
        if (notCode) {
            return;
        }
        if (getmatch(-1) === '.') {
            prevPrev = getChunk(-2);
            if ((prevPrev != null ? prevPrev.match : void 0) !== '.') {
                addValue(-1, 'property');
                setValue(0, 'property');
                if (prevPrev) {
                    if (((ref3 = prevPrev.value) !== 'property' && ref3 !== 'number') && !prevPrev.value.startsWith('punct')) {
                        setValue(-2, 'obj');
                    }
                }
                return 1;
            }
        }
    };

    noonProp = function() {
        var i, prev, q, ref3;
        if (prev = getChunk(-1)) {
            if (prev.start + prev.length + 1 < chunk.start) {
                if (prev.value !== 'obj') {
                    for (i = q = ref3 = chunkIndex - 1; ref3 <= 0 ? q <= 0 : q >= 0; i = ref3 <= 0 ? ++q : --q) {
                        if (i < chunkIndex - 1 && line.chunks[i].start + line.chunks[i].length + 1 < line.chunks[i + 1].start) {
                            break;
                        }
                        if (line.chunks[i].value === 'text' || line.chunks[i].value === 'obj') {
                            line.chunks[i].value = 'property';
                        } else if (line.chunks[i].value === 'punct') {
                            line.chunks[i].value = 'punct property';
                        } else {
                            break;
                        }
                    }
                }
            }
        }
        return 0;
    };

    noonPunct = function() {
        if (notCode) {
            return;
        }
        return noonProp();
    };

    noonWord = function() {
        if (notCode) {
            return;
        }
        if (chunk.start === 0) {
            setValue(0, 'obj');
            return 1;
        }
        return noonProp();
    };

    urlPunct = function() {
        var fileext, i, next, prev, q, ref3, ref4, ref5;
        if (prev = getChunk(-1)) {
            if (chunk.turd === '://') {
                if (getmatch(4) === '.' && getChunk(5)) {
                    setValue(-1, 'url protocol');
                    addValues(3, 'url');
                    setValue(3, 'url domain');
                    setValue(4, 'punct url tld');
                    setValue(5, 'url tld');
                    return 6;
                }
            }
            if (chunk.match === '.') {
                if (!prev.value.startsWith('number') && prev.value !== 'semver' && (ref3 = prev.match, indexOf.call('\\./', ref3) < 0)) {
                    if (next = getChunk(1)) {
                        if (next.start === chunk.start + chunk.length) {
                            fileext = next.match;
                            if (indexOf.call('\\./', fileext) < 0) {
                                setValue(-1, fileext + ' file');
                                addValue(0, fileext);
                                setValue(1, fileext + ' ext');
                                return 2;
                            }
                        }
                    }
                }
            }
            if (chunk.match === '/') {
                for (i = q = ref4 = chunkIndex; ref4 <= 0 ? q <= 0 : q >= 0; i = ref4 <= 0 ? ++q : --q) {
                    if (line.chunks[i].start + line.chunks[i].length < ((ref5 = line.chunks[i + 1]) != null ? ref5.start : void 0)) {
                        break;
                    }
                    if (line.chunks[i].value.endsWith('dir')) {
                        break;
                    }
                    if (line.chunks[i].value.startsWith('url')) {
                        break;
                    }
                    if (line.chunks[i].match === '"') {
                        break;
                    }
                    if (line.chunks[i].value.startsWith('punct')) {
                        line.chunks[i].value = 'punct dir';
                    } else {
                        line.chunks[i].value = 'text dir';
                    }
                }
                return 1;
            }
        }
        return 0;
    };

    urlWord = function() {
        var next, prev, ref3, ref4;
        if (prev = getChunk(-1)) {
            if (ref3 = prev.match, indexOf.call('\\/', ref3) >= 0) {
                next = getChunk(1);
                if (!next || next.start > chunk.start + chunk.length || (ref4 = next.match, indexOf.call('\\./', ref4) < 0)) {
                    return addValue(0, 'file');
                }
            }
        }
    };

    jsPunct = function() {
        var prev;
        if (notCode) {
            return;
        }
        if (prev = getChunk(-1)) {
            if (chunk.match === '(') {
                if (prev.value.startsWith('text') || prev.value === 'property') {
                    setValue(-1, 'function call');
                    return 1;
                }
            }
        }
    };

    jsWord = function() {
        if (chunk.value === 'keyword function') {
            if (getmatch(-1) === '=' && getValue(-2).startsWith('text')) {
                setValue(-2, 'function');
            }
        }
        return 0;
    };

    dict = function() {
        var prev, ref3, ref4;
        if (notCode) {
            return;
        }
        if (chunk.match === ':' && !((ref3 = chunk.turd) != null ? ref3.startsWith('::') : void 0)) {
            if (prev = getChunk(-1)) {
                if ((ref4 = prev.value.split(' ')[0]) === 'string' || ref4 === 'number' || ref4 === 'text' || ref4 === 'keyword') {
                    setValue(-1, 'dictionary key');
                    setValue(0, 'punct dictionary');
                    return 1;
                }
            }
        }
    };

    jsonPunct = function() {
        var i, prev, q, ref3;
        if (notCode) {
            return;
        }
        if (chunk.match === ':') {
            if (prev = getChunk(-1)) {
                if (prev.match === '"') {
                    for (i = q = ref3 = chunkIndex - 2; ref3 <= 0 ? q <= 0 : q >= 0; i = ref3 <= 0 ? ++q : --q) {
                        if (line.chunks[i].value === 'punct string double') {
                            line.chunks[i].value = 'punct dictionary';
                            break;
                        }
                        line.chunks[i].value = 'dictionary key';
                    }
                    setValue(-1, 'punct dictionary');
                    setValue(0, 'punct dictionary');
                    return 1;
                }
            }
        }
    };

    jsonWord = function() {
        var prev, ref3, ref4;
        if (topType === 'string double' && (prev = getChunk(-1))) {
            if (ref3 = prev.match, indexOf.call('"^~', ref3) >= 0) {
                if (NUMBER.test(getmatch(0)) && getmatch(1) === '.' && NUMBER.test(getmatch(2)) && getmatch(3) === '.' && NUMBER.test(getmatch(4))) {
                    if (ref4 = prev.match, indexOf.call('^~', ref4) >= 0) {
                        setValue(-1, 'punct semver');
                    }
                    setValue(0, 'semver');
                    setValue(1, 'punct semver');
                    setValue(2, 'semver');
                    setValue(3, 'punct semver');
                    setValue(4, 'semver');
                    return 5;
                }
            }
        }
    };

    escape = function() {
        var ref3, ref4;
        if (chunk.match === '\\' && ((topType != null ? topType.startsWith('regexp') : void 0) || (topType != null ? topType.startsWith('string') : void 0))) {
            if (chunkIndex === 0 || !((ref3 = getChunk(-1)) != null ? ref3.escape : void 0)) {
                if (((ref4 = getChunk(1)) != null ? ref4.start : void 0) === chunk.start + 1) {
                    chunk.escape = true;
                    addValue(0, 'escape');
                    return stacked();
                }
            }
        }
    };

    regexp = function() {
        var next, prev, ref3, ref4;
        if (topType != null ? topType.startsWith('string') : void 0) {
            return;
        }
        if ((ref3 = getChunk(-1)) != null ? ref3.escape : void 0) {
            return stacked();
        }
        if (chunk.match === '/') {
            if (topType === 'regexp') {
                chunk.value += ' regexp end';
                popStack();
                return 1;
            }
            if (chunkIndex) {
                prev = getChunk(-1);
                next = getChunk(+1);
                if (!prev.value.startsWith('punct') || (ref4 = prev.match, indexOf.call(")]", ref4) >= 0)) {
                    if ((prev.start + prev.length < chunk.start) && (next != null ? next.start : void 0) > chunk.start + 1) {
                        return;
                    }
                    if ((prev.start + prev.length === chunk.start) && (next != null ? next.start : void 0) === chunk.start + 1) {
                        return;
                    }
                }
                if ((next != null ? next.match : void 0) === '=') {
                    return;
                }
                if (prev.value.startsWith('number')) {
                    return;
                }
            }
            pushStack({
                type: 'regexp'
            });
            return addValue(0, 'regexp start');
        }
        return escape();
    };

    tripleRegexp = function() {
        var type;
        if (!chunk.turd || chunk.turd.length < 3) {
            return;
        }
        type = 'regexp triple';
        if (topType && (topType !== 'interpolation' && topType !== type)) {
            return;
        }
        if (chunk.turd.slice(0, 3) === '///') {
            if (topType === type) {
                popStack();
            } else {
                pushStack({
                    type: type,
                    lineno: line.number
                });
            }
            return addValues(3, type);
        }
    };

    simpleString = function() {
        var ref3, ref4, type;
        if (topType === 'regexp') {
            return;
        }
        if ((ref3 = getChunk(-1)) != null ? ref3.escape : void 0) {
            return stacked();
        }
        if (ref4 = chunk.match, indexOf.call('"\'', ref4) >= 0) {
            type = (function() {
                switch (chunk.match) {
                    case '"':
                        return 'string double';
                    case "'":
                        return 'string single';
                }
            })();
            if (topType === type) {
                addValue(0, type);
                popStack();
                return 1;
            } else if (notCode) {
                return stacked();
            }
            pushStack({
                strong: true,
                type: type
            });
            addValue(0, type);
            return 1;
        }
        return escape();
    };

    tripleString = function() {
        var ref3, type;
        if (!chunk.turd || chunk.turd.length < 3) {
            return;
        }
        if (topType === 'regexp' || topType === 'string single' || topType === 'string double') {
            return;
        }
        if ((ref3 = getChunk(-1)) != null ? ref3.escape : void 0) {
            return stacked();
        }
        type = (function() {
            switch (chunk.turd.slice(0, 3)) {
                case '"""':
                    return 'string double triple';
                case "'''":
                    return 'string single triple';
            }
        })();
        if (type) {
            if (type !== topType && (topType != null ? topType.startsWith('string') : void 0)) {
                return;
            }
            if (topType === type) {
                popStack();
            } else {
                pushStack({
                    strong: true,
                    type: type
                });
            }
            return addValues(3, type);
        }
        return escape();
    };

    number = function() {
        var ref3;
        if (notCode) {
            return;
        }
        if (NUMBER.test(chunk.match)) {
            if (getmatch(-1) === '.') {
                if (getValue(-4) === 'number float' && getValue(-2) === 'number float') {
                    if (ref3 = getmatch(-5), indexOf.call('^~', ref3) >= 0) {
                        setValue(-5, 'punct semver');
                    }
                    setValue(-4, 'semver');
                    setValue(-3, 'punct semver');
                    setValue(-2, 'semver');
                    setValue(-1, 'punct semver');
                    setValue(0, 'semver');
                    return 1;
                }
                if (getValue(-2) === 'number') {
                    setValue(-2, 'number float');
                    addValue(-1, 'number float');
                    setValue(0, 'number float');
                    return 1;
                }
            }
            chunk.value = 'number';
            return 1;
        }
        if (HEXNUM.test(chunk.match)) {
            chunk.value = 'number hex';
            return 1;
        }
    };

    float = function() {
        if (FLOAT.test(chunk.match)) {
            if (getmatch(-1) === '.') {
                if (getValue(-2) === 'number') {
                    setValue(-2, 'number float');
                    addValue(-1, 'number float');
                    setValue(0, 'number float');
                    return 1;
                }
            }
            chunk.value = 'number float';
            return 1;
        }
    };

    cssWord = function() {
        var prev, prevPrev, ref3, ref4, ref5;
        if (((ref3 = chunk.match.slice(-2)) === 'px' || ref3 === 'em' || ref3 === 'ex') && NUMBER.test(chunk.match.slice(0, -2))) {
            setValue(0, 'number');
            return 1;
        }
        if (((ref4 = chunk.match.slice(-1)) === 's') && NUMBER.test(chunk.match.slice(0, -1))) {
            setValue(0, 'number');
            return 1;
        }
        if (prev = getChunk(-1)) {
            if (prev.match === '.') {
                addValue(-1, 'class');
                setValue(0, 'class');
                return 1;
            }
            if (prev.match === "#") {
                if (chunk.match.length === 3 || chunk.match.length === 6) {
                    if (HEX.test(chunk.match)) {
                        addValue(-1, 'number hex');
                        setValue(0, 'number hex');
                        return 1;
                    }
                }
                addValue(-1, 'function');
                setValue(0, 'function');
                return 1;
            }
            if (prev.match === '-') {
                if (prevPrev = getChunk(-2)) {
                    if ((ref5 = prevPrev.value) === 'class' || ref5 === 'function') {
                        addValue(-1, prevPrev.value);
                        setValue(0, prevPrev.value);
                        return 1;
                    }
                }
            }
        }
    };

    mdPunct = function() {
        var ref3, ref4, ref5, ref6, ref7, type;
        if (chunkIndex === 0) {
            if (!chunk.turd && (ref3 = chunk.match, indexOf.call('-*', ref3) >= 0) && ((ref4 = getChunk(1)) != null ? ref4.start : void 0) > chunk.start + 1) {
                type = ['li1', 'li2', 'li3'][chunk.start / 4];
                pushStack({
                    merge: true,
                    fill: true,
                    type: type
                });
                return addValue(0, type + ' marker');
            }
            if (chunk.match === '#') {
                if (!chunk.turd) {
                    pushStack({
                        merge: true,
                        fill: true,
                        type: 'h1'
                    });
                    return addValue(0, 'h1');
                }
                switch (chunk.turd) {
                    case '##':
                        pushStack({
                            merge: true,
                            fill: true,
                            type: 'h2'
                        });
                        return addValues(2, 'h2');
                    case '###':
                        pushStack({
                            merge: true,
                            fill: true,
                            type: 'h3'
                        });
                        return addValues(3, 'h3');
                    case '####':
                        pushStack({
                            merge: true,
                            fill: true,
                            type: 'h4'
                        });
                        return addValues(4, 'h4');
                    case '#####':
                        pushStack({
                            merge: true,
                            fill: true,
                            type: 'h5'
                        });
                        return addValues(5, 'h5');
                }
            }
        }
        if (chunk.match === '*') {
            if (((ref5 = chunk.turd) != null ? ref5.slice(0, 2) : void 0) === '**') {
                type = 'bold';
                if (topType != null ? topType.endsWith(type) : void 0) {
                    addValues(2, topType);
                    popStack();
                    return 2;
                }
                if (stackTop != null ? stackTop.merge : void 0) {
                    type = stackTop.type + ' ' + type;
                }
                pushStack({
                    merge: true,
                    type: type
                });
                return addValues(2, type);
            }
            type = 'italic';
            if (topType != null ? topType.endsWith(type) : void 0) {
                addValue(0, topType);
                popStack();
                return 1;
            }
            if (stackTop != null ? stackTop.merge : void 0) {
                type = stackTop.type + ' ' + type;
            }
            pushStack({
                merge: true,
                type: type
            });
            addValue(0, type);
            return 1;
        }
        if (chunk.match === '`') {
            if (((ref6 = chunk.turd) != null ? ref6.slice(0, 3) : void 0) === '```') {
                type = 'code triple';
                if ((ref7 = getmatch(3)) === 'coffeescript' || ref7 === 'javascript' || ref7 === 'js') {
                    setValue(3, 'comment');
                    return addValues(3, type);
                }
                pushStack({
                    weak: true,
                    type: type
                });
                return addValues(3, type);
            }
            type = 'code';
            if (topType != null ? topType.endsWith(type) : void 0) {
                addValue(0, topType);
                popStack();
                return 1;
            }
            if (stackTop != null ? stackTop.merge : void 0) {
                type = stackTop.type + ' ' + type;
            }
            pushStack({
                merge: true,
                type: type
            });
            return addValue(0, type);
        }
    };

    interpolation = function() {
        var ref3;
        if (topType === 'string double') {
            if ((ref3 = chunk.turd) != null ? ref3.startsWith("\#{") : void 0) {
                pushStack({
                    type: 'interpolation',
                    weak: true
                });
                return addValues(2, 'string interpolation start');
            }
        } else if (topType === 'interpolation') {
            if (chunk.match === '}') {
                addValue(0, 'string interpolation end');
                popStack();
                return 1;
            }
        }
    };

    keyword = function() {
        if (notCode) {
            return;
        }
        if (!lang[ext]) {
            return;
        }
        if (lang[ext].hasOwnProperty(chunk.match)) {
            chunk.value = lang[ext][chunk.match];
        }
    };

    xmlPunct = function() {
        var ref3;
        if (chunk.turd === '</') {
            return addValues(2, 'keyword');
        }
        if ((ref3 = chunk.match) === '<' || ref3 === '>') {
            return addValue(0, 'keyword');
        }
    };

    cppMacro = function() {
        if (chunk.match === "#") {
            addValue(0, 'define');
            setValue(1, 'define');
            return 2;
        }
    };

    shPunct = function() {
        var ref3, ref4, ref5, ref6;
        if (chunk.match === '/' && ((ref3 = getChunk(-1)) != null ? ref3.start : void 0) + ((ref4 = getChunk(-1)) != null ? ref4.length : void 0) === chunk.start) {
            return addValue(-1, 'dir');
        }
        if (chunk.turd === '--' && ((ref5 = getChunk(2)) != null ? ref5.start : void 0) === chunk.start + 2) {
            addValue(0, 'argument');
            addValue(1, 'argument');
            setValue(2, 'argument');
            return 3;
        }
        if (chunk.match === '-' && ((ref6 = getChunk(1)) != null ? ref6.start : void 0) === chunk.start + 1) {
            addValue(0, 'argument');
            setValue(1, 'argument');
            return 2;
        }
    };

    stacked = function() {
        if (stackTop) {
            if (stackTop.weak) {
                return;
            }
            if (stackTop.strong) {
                chunk.value = topType;
            } else {
                chunk.value += ' ' + topType;
            }
            return 1;
        }
    };

    pushExt = function(mtch) {
        extTop = {
            "switch": mtch,
            start: line,
            stack: stack
        };
        return extStack.push(extTop);
    };

    actExt = function() {
        stack = [];
        stackTop = null;
        topType = '';
        return notCode = false;
    };

    popExt = function() {
        stack = extTop.stack;
        line.ext = extTop.start.ext;
        extStack.pop();
        extTop = extStack.slice(-1)[0];
        stackTop = stack.slice(-1)[0];
        topType = stackTop != null ? stackTop.type : void 0;
        return notCode = stackTop && indexOf.call(codeTypes, topType) < 0;
    };

    pushStack = function(o) {
        stack.push(o);
        stackTop = o;
        topType = o.type;
        return notCode = indexOf.call(codeTypes, topType) < 0;
    };

    popStack = function() {
        stack.pop();
        stackTop = stack.slice(-1)[0];
        topType = stackTop != null ? stackTop.type : void 0;
        return notCode = stackTop && indexOf.call(codeTypes, topType) < 0;
    };

    getChunk = function(d) {
        return line.chunks[chunkIndex + d];
    };

    setValue = function(d, value) {
        var ref3;
        if ((0 <= (ref3 = chunkIndex + d) && ref3 < line.chunks.length)) {
            return line.chunks[chunkIndex + d].value = value;
        }
    };

    getValue = function(d) {
        var ref3, ref4;
        return (ref3 = (ref4 = getChunk(d)) != null ? ref4.value : void 0) != null ? ref3 : '';
    };

    getmatch = function(d) {
        var ref3, ref4;
        return (ref3 = (ref4 = getChunk(d)) != null ? ref4.match : void 0) != null ? ref3 : '';
    };

    addValue = function(d, value) {
        var ref3;
        if ((0 <= (ref3 = chunkIndex + d) && ref3 < line.chunks.length)) {
            line.chunks[chunkIndex + d].value += ' ' + value;
        }
        return 1;
    };

    addValues = function(n, value) {
        var i, q, ref3;
        for (i = q = 0, ref3 = n; 0 <= ref3 ? q < ref3 : q > ref3; i = 0 <= ref3 ? ++q : --q) {
            addValue(i, value);
        }
        return n;
    };

    handlers = {
        coffee: {
            punct: [blockComment, hashComment, tripleRegexp, coffeePunct, tripleString, simpleString, interpolation, dashArrow, regexp, dict],
            word: [keyword, coffeeWord, number, property]
        },
        noon: {
            punct: [noonComment, noonPunct, urlPunct],
            word: [noonWord, urlWord, number]
        },
        js: {
            punct: [starComment, slashComment, jsPunct, simpleString, dashArrow, regexp, dict],
            word: [keyword, jsWord, number, property]
        },
        ts: {
            punct: [starComment, slashComment, jsPunct, simpleString, dashArrow, regexp, dict],
            word: [keyword, jsWord, number, property]
        },
        iss: {
            punct: [starComment, slashComment, simpleString],
            word: [keyword, number]
        },
        ini: {
            punct: [starComment, slashComment, simpleString, cppMacro],
            word: [number]
        },
        cpp: {
            punct: [starComment, slashComment, simpleString, cppMacro],
            word: [keyword, number, float]
        },
        hpp: {
            punct: [starComment, slashComment, simpleString, cppMacro],
            word: [keyword, number, float]
        },
        c: {
            punct: [starComment, slashComment, simpleString, cppMacro],
            word: [keyword, number, float]
        },
        h: {
            punct: [starComment, slashComment, simpleString, cppMacro],
            word: [keyword, number, float]
        },
        cs: {
            punct: [starComment, slashComment, simpleString],
            word: [keyword, number]
        },
        pug: {
            punct: [starComment, slashComment, simpleString],
            word: [keyword, number]
        },
        styl: {
            punct: [starComment, slashComment, simpleString],
            word: [keyword, cssWord, number]
        },
        css: {
            punct: [starComment, slashComment, simpleString],
            word: [keyword, cssWord, number]
        },
        sass: {
            punct: [starComment, slashComment, simpleString],
            word: [keyword, cssWord, number]
        },
        scss: {
            punct: [starComment, slashComment, simpleString],
            word: [keyword, cssWord, number]
        },
        svg: {
            punct: [simpleString, xmlPunct],
            word: [keyword, number]
        },
        html: {
            punct: [simpleString, xmlPunct],
            word: [keyword, number]
        },
        htm: {
            punct: [simpleString, xmlPunct],
            word: [keyword, number]
        },
        sh: {
            punct: [hashComment, simpleString, urlPunct, shPunct],
            word: [keyword, urlWord, number]
        },
        json: {
            punct: [simpleString, jsonPunct, urlPunct],
            word: [keyword, jsonWord, urlWord, number]
        },
        log: {
            punct: [simpleString, urlPunct, dict],
            word: [urlWord, number]
        },
        md: {
            punct: [mdPunct, urlPunct, xmlPunct],
            word: [urlWord, number]
        },
        fish: {
            punct: [hashComment, simpleString],
            word: [keyword, number]
        }
    };

    for (q = 0, len3 = exts.length; q < len3; q++) {
        ext = exts[q];
        if (handlers[ext] == null) {
            handlers[ext] = {
                punct: [simpleString],
                word: [number]
            };
        }
    }

    for (ext in handlers) {
        obj = handlers[ext];
        handlers[ext].punct.push(stacked);
        handlers[ext].word.push(stacked);
    }


    /*
    0000000    000       0000000    0000000  000   000  00000000  0000000    
    000   000  000      000   000  000       000  000   000       000   000  
    0000000    000      000   000  000       0000000    0000000   000   000  
    000   000  000      000   000  000       000  000   000       000   000  
    0000000    0000000   0000000    0000000  000   000  00000000  0000000
     */

''

    blocked = function(lines) {
        var advance, beforeIndex, hnd, len4, len5, len6, len7, len8, mightBeHeader, mtch, r, ref10, ref11, ref3, ref4, ref5, ref6, ref7, ref8, ref9, t, turdChunk, u, v, x;
        extStack = [];
        stack = [];
        handl = [];
        extTop = null;
        stackTop = null;
        notCode = false;
        topType = '';
        ext = '';
        line = null;
        chunk = null;
        chunkIndex = 0;
        for (r = 0, len4 = lines.length; r < len4; r++) {
            line = lines[r];
            if (stackTop) {
                if (stackTop.type === 'comment triple') {
                    mightBeHeader = true;
                    ref3 = line.chunks;
                    for (t = 0, len5 = ref3.length; t < len5; t++) {
                        chunk = ref3[t];
                        if (!HEADER.test(chunk.match)) {
                            mightBeHeader = false;
                            break;
                        }
                    }
                    if (mightBeHeader) {
                        ref4 = line.chunks;
                        for (u = 0, len6 = ref4.length; u < len6; u++) {
                            chunk = ref4[u];
                            chunk.value = 'comment triple header';
                        }
                        continue;
                    }
                }
                if (stackTop.fill) {
                    popStack();
                }
            }
            if (extTop) {
                if (extTop["switch"].indent && ((ref5 = line.chunks[0]) != null ? ref5.start : void 0) <= extTop.start.chunks[0].start) {
                    popExt();
                } else {
                    line.ext = extTop["switch"].to;
                }
            }
            if (ext !== line.ext) {
                actExt();
                handl = handlers[ext = line.ext];
                if (!handl) {
                    console.log('[33m[93mklor[33m[2m.[22m[2mcoffee[22m[39m[2m[34m:[39m[22m[94m1079[39m', line);
                    console.log('[33m[93mklor[33m[2m.[22m[2mcoffee[22m[39m[2m[34m:[39m[22m[94m1080[39m', handlers);
                }
                if (!(handl)) {
                    console.log('[33m[93mklor[33m[2m.[22m[2mcoffee[22m[39m[2m[34m:[39m[22m[94m1081[39m', '[1m[97massertion failure![39m[22m');

                    process.exit(666);
                };
            }
            chunkIndex = 0;
            while (chunkIndex < line.chunks.length) {
                chunk = line.chunks[chunkIndex];
                beforeIndex = chunkIndex;
                if (chunk.value === 'punct') {
                    if (extTop) {
                        if ((extTop["switch"].end != null) && extTop["switch"].end === chunk.turd) {
                            if (extTop["switch"].add) {
                                addValues(chunk.turd.length, extTop["switch"].add);
                            }
                            popExt();
                        }
                    }
                    ref7 = (ref6 = handl.punct) != null ? ref6 : [];
                    for (v = 0, len7 = ref7.length; v < len7; v++) {
                        hnd = ref7[v];
                        if (advance = hnd()) {
                            chunkIndex += advance;
                            break;
                        }
                    }
                } else {
                    if (!notCode) {
                        if (mtch = (ref8 = swtch[line.ext]) != null ? ref8[chunk.match] : void 0) {
                            if (mtch.turd) {
                                turdChunk = getChunk(-mtch.turd.length);
                                if (mtch.turd === ((ref9 = turdChunk != null ? turdChunk.turd : void 0) != null ? ref9 : turdChunk != null ? turdChunk.match : void 0)) {
                                    pushExt(mtch);
                                }
                            }
                        }
                    }
                    ref11 = (ref10 = handl.word) != null ? ref10 : [];
                    for (x = 0, len8 = ref11.length; x < len8; x++) {
                        hnd = ref11[x];
                        if (advance = hnd()) {
                            chunkIndex += advance;
                            break;
                        }
                    }
                }
                if (chunkIndex === beforeIndex) {
                    chunkIndex++;
                }
            }
        }
        return lines;
    };

    parse = function(lines, ext) {
        if (ext == null) {
            ext = 'coffee';
        }
        return blocked(chunked(lines, ext));
    };

    module.exports = {
        kolor: require('./kolor'),
        exts: exts,
        parse: parse,
        chunked: chunked,
        ranges: function(line, ext) {
            if (ext == null) {
                ext = 'coffee';
            }
            return parse([line], ext)[0].chunks;
        },
        dissect: function(lines, ext) {
            if (ext == null) {
                ext = 'coffee';
            }
            return parse(lines, ext).map(function(l) {
                return l.chunks;
            });
        }
    };

    console.log('[33m[93mklor[33m[2m.[22m[2mcoffee[22m[39m[2m[34m:[39m[22m[94m1149[39m', '[1m[97mprofile[39m[22m');

    try {
    text0 = slash.readText(__dirname + "/../../koffee/coffee/nodes.coffee");
    text1 = slash.readText(__dirname + "/test.coffee");
        
koffee_1154_4_sum = 0n;
for(i = 0; i < 2; i++) 
{ 
    koffee_1154_4_start = process.hrtime.bigint();
    lines0 = text0.split('\n');
    koffee_1154_4_sum += process.hrtime.bigint() - koffee_1154_4_start;
};
koffee_1154_4_sum /= 2n;
koffee_1154_4_end = (function (bint) { let fact = 1000n; for (let unit of ['ns','μs','ms','s','m']) { 
    if (unit == 'm') { return '' + (1000n*bint/fact) + unit; }
    if (bint < fact)
    {
        # koffee_1154_4_end = '' + (1000n*koffee_1154_4_sum/fact) + unit;
        return '' + (bint/fact) + unit;
    }
    fact *= 1000n;
}})(koffee_1154_4_sum);
console.log('1154_4', koffee_1154_4_end);;
        
koffee_1156_4_sum = 0n;
for(i = 0; i < 2; i++) 
{ 
    koffee_1156_4_start = process.hrtime.bigint();
    lines1 = text1.split('\n');
    koffee_1156_4_sum += process.hrtime.bigint() - koffee_1156_4_start;
};
koffee_1156_4_sum /= 2n;
koffee_1156_4_end = (function (bint) { let fact = 1000n; for (let unit of ['ns','μs','ms','s','m']) { 
    if (unit == 'm') { return '' + (1000n*bint/fact) + unit; }
    if (bint < fact)
    {
        # koffee_1156_4_end = '' + (1000n*koffee_1156_4_sum/fact) + unit;
        return '' + (bint/fact) + unit;
    }
    fact *= 1000n;
}})(koffee_1156_4_sum);
console.log('1156_4', koffee_1156_4_end);;
    for (i = r = 0; r <= 5; i = ++r) {
        parse(lines0);
    }
        
koffee_1162_4_sum = 0n;
for(i = 0; i < 50; i++) 
{ 
    koffee_1162_4_start = process.hrtime.bigint();
    parse(lines0);
    koffee_1162_4_sum += process.hrtime.bigint() - koffee_1162_4_start;
};
koffee_1162_4_sum /= 50n;
koffee_1162_4_end = (function (bint) { let fact = 1000n; for (let unit of ['ns','μs','ms','s','m']) { 
    if (unit == 'm') { return '' + (1000n*bint/fact) + unit; }
    if (bint < fact)
    {
        # koffee_1162_4_end = '' + (1000n*koffee_1162_4_sum/fact) + unit;
        return '' + (bint/fact) + unit;
    }
    fact *= 1000n;
}})(koffee_1162_4_sum);
console.log('1162_4', koffee_1162_4_end);;
    } catch(err) { console.log(err.message); }
;

}).call(this);
