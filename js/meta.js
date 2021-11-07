// koffee 1.16.0

/*
00     00  00000000  000000000   0000000   
000   000  000          000     000   000  
000000000  0000000      000     000000000  
000 0 000  000          000     000   000  
000   000  00000000     000     000   000
 */

(function() {
    var META, TAB, compileMetaIf, helpers, injectMeta, logMetas, logSource, metaLog, path,
        indexOf = [].indexOf,
        slice = [].slice;

    path = require('path');

    helpers = require('./helpers');

    helpers.colors();

    META = [
        {
            key: '▸vec',
            desc: '▸vec(a, ...)',
            meta: function(arg1) {
                var Access, Block, Call, IdentifierLiteral, NumberLiteral, Op, PropertyName, Value, args, bodyIndex, cn, config, convert, exp, firstIndex, firstType, identifiers, index, info, j, k, l, len, len1, len2, nd, node, nodeArray, nodeIndex, nodeInfos, nodes, o, opts, otherIndex, otherInfo, otherNode, preParse, ref, ref1, ref10, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, results, secondIndex, secondType, type, vecIndex, vecInfo, vecNode;
                args = (ref = arg1.args) != null ? ref : null, node = (ref1 = arg1.node) != null ? ref1 : null, opts = (ref2 = arg1.opts) != null ? ref2 : null;
                config = ((ref3 = args[0]) != null ? ref3.dot : void 0) != null ? args[0] : {
                    times: 'times',
                    dot: 'dot',
                    plus: 'plus',
                    minus: 'minus'
                };
                nodes = require('./nodes');
                Op = nodes.Op, Value = nodes.Value, Call = nodes.Call, Access = nodes.Access, Block = nodes.Block, NumberLiteral = nodes.NumberLiteral, IdentifierLiteral = nodes.IdentifierLiteral, PropertyName = nodes.PropertyName;
                identifiers = node.condition.args.map(function(arg) {
                    return arg.base.value;
                });
                ref4 = node.body.expressions;
                for (j = 0, len = ref4.length; j < len; j++) {
                    exp = ref4[j];
                    nodeInfos = [];
                    nodeIndex = -1;
                    preParse = function(node) {
                        var firstIsValue, firstIsVec, ref10, ref11, ref12, ref13, ref14, ref15, ref16, ref5, ref6, ref7, ref8, ref9, secondIsValue, secondIsVec;
                        if (node instanceof Op) {
                            firstIsValue = node.first instanceof Value;
                            secondIsValue = node.second instanceof Value;
                            firstIsVec = firstIsValue && (ref5 = node.first.base.value, indexOf.call(identifiers, ref5) >= 0);
                            secondIsVec = secondIsValue && (ref6 = node.second.base.value, indexOf.call(identifiers, ref6) >= 0);
                            if (node.operator === '*') {
                                nodeInfos[++nodeIndex] = {
                                    node: node
                                };
                                if (firstIsVec && secondIsVec) {
                                    nodeInfos[nodeIndex].vecOp = 'dot';
                                    nodeInfos[nodeIndex].type = 'num';
                                } else if (firstIsVec) {
                                    nodeInfos[nodeIndex].side = 'left';
                                    if (secondIsValue && node.second.base instanceof NumberLiteral || node.second.base instanceof IdentifierLiteral) {
                                        nodeInfos[nodeIndex].vecOp = 'times';
                                        nodeInfos[nodeIndex].type = 'vec';
                                    } else {
                                        nodeInfos[nodeIndex].vecOp = 'timesOrDot';
                                    }
                                } else if (secondIsVec) {
                                    nodeInfos[nodeIndex].side = 'right';
                                    if (firstIsValue && node.first.base instanceof NumberLiteral || node.first.base instanceof IdentifierLiteral) {
                                        nodeInfos[nodeIndex].vecOp = 'times';
                                        nodeInfos[nodeIndex].type = 'vec';
                                    } else {
                                        nodeInfos[nodeIndex].vecOp = 'timesOrDot';
                                    }
                                } else {
                                    nodeInfos[nodeIndex].operator = '*';
                                }
                            }
                            if (node.operator === '+') {
                                nodeInfos[++nodeIndex] = {
                                    node: node
                                };
                                if (firstIsVec && secondIsVec) {
                                    nodeInfos[nodeIndex].vecOp = 'plus';
                                    nodeInfos[nodeIndex].type = 'vec';
                                } else if (firstIsVec) {
                                    nodeInfos[nodeIndex].vecOp = 'plus';
                                    nodeInfos[nodeIndex].type = 'vec';
                                } else if (secondIsVec) {
                                    nodeInfos[nodeIndex].vecOp = 'plus';
                                    nodeInfos[nodeIndex].type = 'vec';
                                } else {
                                    nodeInfos[nodeIndex].operator = '+';
                                }
                            }
                            if (node.operator === '-') {
                                nodeInfos[++nodeIndex] = {
                                    node: node
                                };
                                if (firstIsVec && secondIsVec) {
                                    nodeInfos[nodeIndex].vecOp = 'minus';
                                    return nodeInfos[nodeIndex].type = 'vec';
                                } else if (firstIsVec) {
                                    nodeInfos[nodeIndex].vecOp = 'minus';
                                    return nodeInfos[nodeIndex].type = 'vec';
                                } else if (secondIsVec) {
                                    nodeInfos[nodeIndex].vecOp = 'minus';
                                    return nodeInfos[nodeIndex].type = 'vec';
                                } else {
                                    return nodeInfos[nodeIndex].operator = '-';
                                }
                            }
                        } else if (node.constructor.name === 'Value') {
                            nodeInfos[++nodeIndex] = {
                                node: node
                            };
                            if (!node.base.value) {
                                nodeInfos[nodeIndex].body = (ref7 = node.base.body) != null ? (ref8 = ref7.expressions) != null ? (ref9 = ref8[0]) != null ? ref9.constructor.name : void 0 : void 0 : void 0;
                            } else {
                                nodeInfos[nodeIndex].value = node.base.value;
                            }
                            if (ref10 = node.base.value, indexOf.call(identifiers, ref10) >= 0) {
                                return nodeInfos[nodeIndex].type = 'vec';
                            }
                        } else if (node.constructor.name === 'Call') {
                            nodeInfos[++nodeIndex] = {
                                node: node
                            };
                            nodeInfos[nodeIndex].call = (ref11 = (ref12 = node.variable) != null ? (ref13 = ref12.base) != null ? ref13.value : void 0 : void 0) != null ? ref11 : true;
                            return nodeInfos[nodeIndex].type = 'num';
                        } else if (node.constructor.name === 'Assign') {
                            nodeInfos[++nodeIndex] = {
                                node: node
                            };
                            nodeInfos[nodeIndex].call = ((ref14 = (ref15 = node.variable) != null ? (ref16 = ref15.base) != null ? ref16.value : void 0 : void 0) != null ? ref14 : '?') + "=";
                            return nodeInfos[nodeIndex].type = 'num';
                        }
                    };
                    preParse(exp);
                    exp.traverseChildren(true, preParse);
                    nodeArray = nodeInfos.map(function(i) {
                        var n;
                        n = i.node;
                        delete i.node;
                        return n;
                    });
                    ref6 = (function() {
                        results = [];
                        for (var l = ref5 = nodeInfos.length - 1; ref5 <= 0 ? l <= 0 : l >= 0; ref5 <= 0 ? l++ : l--){ results.push(l); }
                        return results;
                    }).apply(this);
                    for (k = 0, len1 = ref6.length; k < len1; k++) {
                        index = ref6[k];
                        info = nodeInfos[index];
                        nd = nodeArray[index];
                        if (info.vecOp) {
                            otherNode = info.side === 'left' ? nd.second : nd.first;
                            vecNode = info.side === 'left' ? nd.first : nd.second;
                            otherIndex = nodeArray.indexOf(otherNode);
                            vecIndex = nodeArray.indexOf(vecNode);
                            otherInfo = nodeInfos[otherIndex];
                            vecInfo = nodeInfos[vecIndex];
                            if (info.vecOp === 'timesOrDot') {
                                if (!otherInfo) {
                                    info.vecOp = 'times';
                                    info.type = 'vec';
                                } else if (otherInfo.type === 'num') {
                                    info.vecOp = 'times';
                                    info.type = 'vec';
                                } else if (otherInfo.type === 'vec') {
                                    info.vecOp = 'dot';
                                    info.type = 'num';
                                }
                            }
                        } else if (info.operator) {
                            firstIndex = nodeArray.indexOf(nd.first);
                            secondIndex = nodeArray.indexOf(nd.second);
                            firstType = firstIndex < 0 && 'num' || nodeInfos[firstIndex].type;
                            secondType = secondIndex < 0 && 'num' || nodeInfos[secondIndex].type;
                            if ((firstType === 'vec' && 'vec' === secondType)) {
                                if (info.operator === '*') {
                                    info.vecOp = 'dot';
                                    info.type = 'num';
                                } else if (info.operator === '-') {
                                    info.vecOp = 'minus';
                                    info.type = 'vec';
                                } else if (info.operator === '+') {
                                    info.vecOp = 'plus';
                                    info.type = 'vec';
                                }
                            } else if (firstType === 'vec' && secondType === 'num') {
                                info.vecOp = 'times';
                                info.type = 'vec';
                                info.side = 'left';
                            } else if (firstType === 'num' && secondType === 'vec') {
                                info.vecOp = 'times';
                                info.type = 'vec';
                                info.side = 'right';
                            } else if ((firstType === 'num' && 'num' === secondType)) {
                                info.type = 'num';
                            }
                        } else {
                            if (info.value && !info.type) {
                                if (nd.base instanceof IdentifierLiteral) {
                                    info.type = 'num';
                                } else if (nd.base instanceof NumberLiteral) {
                                    info.type = 'num';
                                } else {
                                    console.log('nd.base', nd);
                                }
                            }
                            if ((ref7 = info.type) === 'num' || ref7 === 'vec') {
                                true;
                            } else if (info.body === 'Op') {
                                bodyIndex = nodeArray.indexOf((ref8 = nd.base) != null ? (ref9 = ref8.body) != null ? ref9.expressions[0] : void 0 : void 0);
                                if (type = (ref10 = nodeInfos[bodyIndex]) != null ? ref10.type : void 0) {
                                    info.type = type;
                                }
                            }
                        }
                    }
                    convert = function(nd) {
                        var al, nn, oi, op, pn, ref11, ref12, vn;
                        index = nodeArray.indexOf(nd);
                        info = nodeInfos[index];
                        if (info != null ? info.vecOp : void 0) {
                            vn = info.side === 'right' ? nd.second : nd.first;
                            pn = info.side === 'right' ? nd.first : nd.second;
                            oi = nodeArray.indexOf(pn);
                            op = info.vecOp;
                            if (!((ref11 = vn.base) != null ? ref11.value : void 0)) {
                                vn = convert(vn);
                            }
                            al = [convert(pn)];
                            return nn = new Call(new Value(vn, [new Access(new PropertyName(op))]), al);
                        } else if (info != null ? info.call : void 0) {
                            if ((ref12 = nd.args) != null ? ref12.length : void 0) {
                                nd.args = nd.args.map(function(nda) {
                                    return convert(nda);
                                });
                            } else if (nd.value) {
                                nd.value = convert(nd.value);
                            }
                            return nd;
                        } else {
                            return nd;
                        }
                    };
                    for (index = o = 0, len2 = nodeInfos.length; o < len2; index = ++o) {
                        info = nodeInfos[index];
                        if (info.vecOp) {
                            nd = nodeArray[index];
                            cn = convert(nd);
                            node.traverseChildren(true, function(tn) {
                                if (tn.first === nd) {
                                    return tn.first = cn;
                                } else if (tn.second === nd) {
                                    return tn.second = cn;
                                } else if ((tn.expressions != null) && indexOf.call(tn.expressions, nd) >= 0) {
                                    return tn.expressions[tn.expressions.indexOf(nd)] = cn;
                                }
                            });
                        } else if (info.call) {
                            convert(nodeArray[index]);
                        }
                    }
                }
                return {
                    dedent: true,
                    reduce: true,
                    body: true,
                    block: true
                };
            }
        }, {
            doc: '',
            key: '▸doc',
            desc: '▸doc [header] ...',
            meta: function(arg1) {
                var args, header, node, opts, ref, ref1, ref2;
                args = (ref = arg1.args) != null ? ref : null, node = (ref1 = arg1.node) != null ? ref1 : null, opts = (ref2 = arg1.opts) != null ? ref2 : null;
                header = args[0] && ("'## " + args[0] + "\\n'+") || "''+";
                return {
                    before: opts.doc && ((metaLog(opts)) + "(" + header),
                    after: ")",
                    skip: !opts.doc && {
                        "with": "''"
                    },
                    reduce: true,
                    body: true,
                    block: false
                };
            }
        }, {
            key: '▸profile',
            desc: '▸profile [id] ...',
            meta: function(arg1) {
                var args, id, name, node, opts, ref, ref1, ref2, ref3;
                args = (ref = arg1.args) != null ? ref : null, node = (ref1 = arg1.node) != null ? ref1 : null, opts = (ref2 = arg1.opts) != null ? ref2 : null;
                id = (node.condition.locationData.first_line + 1) + "_" + node.condition.locationData.first_column;
                name = (ref3 = args[0]) != null ? ref3 : id;
                return {
                    code: "koffee_" + id + " = process.hrtime.bigint()",
                    after: (metaLog(opts)) + "('" + name + "', (function(b){ let f=1000n; for (let u of ['ns','μs','ms','s']) { if (u=='s' || b<f) { return ''+(1000n*b/f)+' '+u; } f*=1000n; }})(process.hrtime.bigint()-koffee_" + id + "));",
                    reduce: false,
                    body: true
                };
            }
        }, {
            key: '▸average',
            desc: '▸average num ...',
            meta: function(arg1) {
                var args, id, node, num, opts, ref, ref1, ref2, ref3;
                args = (ref = arg1.args) != null ? ref : null, node = (ref1 = arg1.node) != null ? ref1 : null, opts = (ref2 = arg1.opts) != null ? ref2 : null;
                id = (node.condition.locationData.first_line + 1) + "_" + node.condition.locationData.first_column;
                num = (ref3 = args[0]) != null ? ref3 : 100;
                return {
                    before: "\nkoffee_" + id + " = 0n;\nfor(i = 0; i < " + num + "; i++) \n{ \n    koffee_" + id + "_start = process.hrtime.bigint();\n",
                    after: "koffee_" + id + " += process.hrtime.bigint() - koffee_" + id + "_start;\n};\nkoffee_" + id + " /= " + num + "n;\n" + (metaLog(opts)) + "('" + id + "', (function(b){ let f=1000n; for (let u of ['ns','μs','ms','s']) { if (u=='s' || b<f) { return ''+(1000n*b/f)+' '+u; } f*=1000n; }})(koffee_" + id + ")); ",
                    reduce: true,
                    body: true
                };
            }
        }, {
            key: '▸start',
            desc: '▸start id ...',
            info: {
                then: true,
                args: 1
            },
            meta: function(arg1) {
                var args, id, ref, ref1;
                args = (ref = arg1.args) != null ? ref : null;
                id = (ref1 = args[0]) != null ? ref1 : 'start_end';
                return {
                    before: "koffee_" + id + " = process.hrtime.bigint()",
                    reduce: true,
                    body: false
                };
            }
        }, {
            key: '▸end',
            desc: '▸end id ...',
            info: {
                then: true,
                args: 1
            },
            meta: function(arg1) {
                var args, id, opts, ref, ref1, ref2;
                args = (ref = arg1.args) != null ? ref : null, opts = (ref1 = arg1.opts) != null ? ref1 : null;
                id = (ref2 = args[0]) != null ? ref2 : 'start_end';
                return {
                    before: (metaLog(opts)) + "('" + id + "', (function(b){ let f=1000n; for (let u of ['ns','μs','ms','s']) { if (u=='s' || b<f) { return ''+(1000n*b/f)+' '+u; } f*=1000n; }})(process.hrtime.bigint()-koffee_" + id + "));",
                    reduce: true,
                    body: false
                };
            }
        }, {
            key: '▸dbg',
            desc: '▸dbg [msg] ...',
            info: {
                then: true,
                args: 1
            },
            meta: function(arg1) {
                var args, node, opts, ref, ref1, ref2;
                opts = (ref = arg1.opts) != null ? ref : null, args = (ref1 = arg1.args) != null ? ref1 : null, node = (ref2 = arg1.node) != null ? ref2 : null;
                return {
                    before: logSource({
                        opts: opts,
                        args: args,
                        node: node
                    }),
                    after: ')',
                    reduce: true,
                    body: true,
                    block: false
                };
            }
        }, {
            key: '▸assert',
            desc: '▸assert [msg] ...',
            meta: function(arg1) {
                var Block, args, body, extend, frag, node, nodes, opts, ref, ref1, ref2, text;
                opts = (ref = arg1.opts) != null ? ref : null, args = (ref1 = arg1.args) != null ? ref1 : null, node = (ref2 = arg1.node) != null ? ref2 : null;
                nodes = require('./nodes');
                Block = nodes.Block, extend = nodes.extend;
                if (node.body instanceof Block) {
                    body = node.body.expressions[0];
                } else {
                    body = node.body;
                }
                frag = body.compileToFragments(opts);
                text = node.fragmentsToText(frag);
                if (!args.length) {
                    args = ['assertion failure!'];
                }
                return {
                    before: logSource({
                        opts: opts,
                        args: args,
                        node: node,
                        close: true
                    }),
                    after: 'process.exit(666);',
                    then: true,
                    "eval": false,
                    reduce: false,
                    code: "!(" + text + ")"
                };
            }
        }, {
            key: '▸test',
            desc: '▸test [id] ...',
            meta: function(arg1) {
                var args, before, node, opts, ref, ref1, ref2;
                opts = (ref = arg1.opts) != null ? ref : null, args = (ref1 = arg1.args) != null ? ref1 : null, node = (ref2 = arg1.node) != null ? ref2 : null;
                before = logSource({
                    opts: opts,
                    args: args,
                    node: node,
                    close: true
                });
                before += '\n    try {\n';
                return {
                    dedent: true,
                    before: opts.test && before,
                    after: opts.test && ("} catch(err) { " + (metaLog(opts)) + "(err.message); }\n"),
                    skip: !opts.test,
                    reduce: true,
                    body: true
                };
            }
        }, {
            key: '▸rand',
            meta: function(arg1) {
                var args, ref, ref1;
                args = (ref = arg1.args) != null ? ref : null;
                return {
                    code: "Math.random() < " + ((ref1 = args != null ? args[0] : void 0) != null ? ref1 : 0.5),
                    reduce: false,
                    body: true
                };
            }
        }
    ];

    TAB = '    ';

    compileMetaIf = function(arg1) {
        var Assign, Block, Literal, Value, args, body, bodyOpt, cond, err, extend, frag, fs, indent, info, merge, metaKey, node, nodes, opts, os, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7;
        node = (ref = arg1.node) != null ? ref : null, opts = (ref1 = arg1.opts) != null ? ref1 : null;
        nodes = require('./nodes');
        Block = nodes.Block, Assign = nodes.Assign, Value = nodes.Value, Literal = nodes.Literal;
        extend = helpers.extend, merge = helpers.merge;
        info = {
            reduce: true,
            "eval": true
        };
        if ((ref2 = node.condition.base) != null ? (ref3 = ref2.value) != null ? ref3.startsWith('▸') : void 0 : void 0) {
            metaKey = node.condition.base.value;
            if (typeof opts.meta[metaKey] === 'function') {
                info = opts.meta[metaKey]({
                    opts: opts,
                    node: node,
                    args: []
                });
            }
        }
        if ((ref4 = node.condition.variable) != null ? (ref5 = ref4.base) != null ? (ref6 = ref5.value) != null ? ref6.startsWith('▸') : void 0 : void 0 : void 0) {
            metaKey = node.condition.variable.base.value;
            if (typeof opts.meta[metaKey] === 'function') {
                args = node.condition.args.map(function(a) {
                    var ref7;
                    return (ref7 = a.base) != null ? ref7.value : void 0;
                });
                args = args.map(function(a) {
                    var ref7;
                    if ((ref7 = a[0]) === '"' || ref7 === "'") {
                        return a.slice(1, -1);
                    } else {
                        return a;
                    }
                });
                info = opts.meta[metaKey]({
                    opts: opts,
                    node: node,
                    args: args
                });
            }
        }
        if (info.skip) {
            if (info.skip["with"] != null) {
                return node.makeCode(info.skip["with"]);
            }
            return [];
        }
        if (info["eval"]) {
            cond = (ref7 = info.code) != null ? ref7 : node.fragmentsToText(node.condition.compileToFragments(opts, 2));
            try {
                os = require('os');
                fs = require('fs');
                info.body = !!eval(cond);
                if (info["eval"] && info.reduce && !info.body && !node.elseBody) {
                    return [];
                }
            } catch (error) {
                err = error;
                console.error(err);
            }
        }
        frag = [];
        if (info.reduce === false) {
            frag = frag.concat(node.makeCode("if ("), node.makeCode(info.code), node.makeCode(") {\n"));
            indent = opts.indent + TAB;
            bodyOpt = merge(opts, {
                indent: indent
            });
        } else {
            indent = opts.indent;
            bodyOpt = opts;
        }
        if (info.before) {
            frag.push(node.makeCode((info.block !== false && info.dedent !== true && indent || '') + info.before));
        }
        if (info.body) {
            if (info.block !== false) {
                body = node.ensureBlock(node.body);
            } else {
                if (node.body instanceof Block) {
                    body = node.body.expressions[0];
                } else {
                    body = node.body;
                }
            }
            if (body) {
                frag = frag.concat(body.compileToFragments(bodyOpt));
            } else {
                frag.push(node.makeCode("''"));
            }
        }
        if (info.after) {
            frag.push(node.makeCode(((info.block !== false) && ('\n' + indent) || '') + info.after));
        }
        if (!info.reduce) {
            frag.push(node.makeCode("\n" + node.tab + "}"));
        }
        if (node.elseBody && (info.reduce === false || info.body === false)) {
            if (!info.reduce) {
                frag.push(node.makeCode(' else '));
            }
            if (node.isChain) {
                frag = frag.concat(node.elseBody.unwrap().compileToFragments(bodyOpt));
            } else {
                frag = frag.concat(node.elseBody.compileToFragments(bodyOpt));
            }
        }
        return frag;
    };

    metaLog = function(opts) {
        var ref;
        return (ref = opts.metalog) != null ? ref : 'console.log';
    };

    logSource = function(arg1) {
        var args, before, blue, blueBright, bold, close, colorette, dim, ext, gray, node, opts, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, source, whiteBright, yellow, yellowBright;
        opts = (ref = arg1.opts) != null ? ref : null, args = (ref1 = arg1.args) != null ? ref1 : null, node = (ref2 = arg1.node) != null ? ref2 : null, close = (ref3 = arg1.close) != null ? ref3 : null;
        colorette = require('colorette');
        ref4 = colorette.createColors({
            useColor: opts.feature.color
        }), yellow = ref4.yellow, blue = ref4.blue, yellowBright = ref4.yellowBright, blueBright = ref4.blueBright, whiteBright = ref4.whiteBright, dim = ref4.dim, bold = ref4.bold, gray = ref4.gray;
        source = (ref5 = (ref6 = opts.source) != null ? ref6 : opts.filename) != null ? ref5 : '';
        ext = '';
        if (source) {
            ref7 = path.basename(source).split('.'), source = ref7[0], ext = 2 <= ref7.length ? slice.call(ref7, 1) : [];
            source = yellow([yellowBright(source), dim(ext.join`.`)].join(dim('.')));
        }
        before = (metaLog(opts)) + "('" + source + (dim(blue(':'))) + (blueBright("" + (node.condition.locationData.first_line + 1))) + "'";
        if (args[0]) {
            before += ", '" + (bold(whiteBright(args[0]))) + "'";
        }
        if (close) {
            before += ');\n';
        } else {
            before += ", ";
        }
        return before;
    };

    injectMeta = function(options) {
        var defaultMeta, extend, meta, ref;
        if (options != null) {
            options;
        } else {
            options = {};
        }
        extend = helpers.extend;
        defaultMeta = {};
        META.map(function(m) {
            defaultMeta[m.key] = m.meta;
            m.meta.key = m.key;
            return m.meta.info = m.info;
        });
        meta = extend(defaultMeta, (ref = options.meta) != null ? ref : {});
        options = extend({
            meta: meta
        }, options);
        return options;
    };

    logMetas = function() {
        console.log((gray('Metas:')) + "\n\n" + (META.map(function(f) {
            var ref;
            return "    " + (helpers.pad(f.key)) + (gray((ref = f.desc) != null ? ref : f.key + " ..."));
        }).join('\n')));
        return console.log("    ▸if                     " + (gray('▸if cond ... [[▸elif cond ...] ▸else ...]')) + "\n");
    };

    module.exports = {
        META: META,
        injectMeta: injectMeta,
        logMetas: logMetas,
        compileMetaIf: compileMetaIf
    };

}).call(this);
