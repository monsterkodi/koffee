// koffee 1.18.0

/*
00     00  00000000  000000000   0000000   
000   000  000          000     000   000  
000000000  0000000      000     000000000  
000 0 000  000          000     000   000  
000   000  00000000     000     000   000
 */
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
                        if (node.operator === '/') {
                            nodeInfos[++nodeIndex] = {
                                node: node
                            };
                            if (firstIsVec) {
                                nodeInfos[nodeIndex].side = 'left';
                                nodeInfos[nodeIndex].vecOp = 'times/';
                                nodeInfos[nodeIndex].type = 'vec';
                            } else {
                                nodeInfos[nodeIndex].operator = '/';
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
                            info.vecOp = info.operator === '/' ? 'times/' : 'times';
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
                        if (op === 'times/') {
                            al = [new Op('/', new Value(new NumberLiteral(1)), al[0])];
                            op = 'times';
                        }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YS5qcyIsInNvdXJjZVJvb3QiOiIuLi9jb2ZmZWUiLCJzb3VyY2VzIjpbIm1ldGEuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGlGQUFBO0lBQUE7OztBQVFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7QUFFUCxPQUFBLEdBQVUsT0FBQSxDQUFRLFdBQVI7O0FBQ1YsT0FBTyxDQUFDLE1BQVIsQ0FBQTs7QUFFQSxJQUFBLEdBQU87SUFRSDtRQUFBLEdBQUEsRUFBTSxNQUFOO1FBQ0EsSUFBQSxFQUFNLGNBRE47UUFFQSxJQUFBLEVBQU0sU0FBQyxJQUFEO0FBRUYsZ0JBQUE7WUFGRyx5Q0FBRyxNQUFHLDJDQUFHLE1BQUcsMkNBQUc7WUFFbEIsTUFBQSxHQUFZLHNEQUFILEdBQXNCLElBQUssQ0FBQSxDQUFBLENBQTNCLEdBQW1DO2dCQUFBLEtBQUEsRUFBTSxPQUFOO2dCQUFjLEdBQUEsRUFBSSxLQUFsQjtnQkFBd0IsSUFBQSxFQUFLLE1BQTdCO2dCQUFvQyxLQUFBLEVBQU0sT0FBMUM7O1lBRTVDLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUjtZQUNKLGFBQUosRUFBUSxtQkFBUixFQUFlLGlCQUFmLEVBQXFCLHFCQUFyQixFQUE2QixtQkFBN0IsRUFDSSxtQ0FESixFQUNtQiwyQ0FEbkIsRUFFSTtZQUVKLFdBQUEsR0FBYyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFwQixDQUF3QixTQUFDLEdBQUQ7dUJBQVMsR0FBRyxDQUFDLElBQUksQ0FBQztZQUFsQixDQUF4QjtBQUVkO0FBQUEsaUJBQUEsc0NBQUE7O2dCQUVJLFNBQUEsR0FBWTtnQkFDWixTQUFBLEdBQVksQ0FBQztnQkFFYixRQUFBLEdBQVcsU0FBQyxJQUFEO0FBRVAsd0JBQUE7b0JBQUEsSUFBRyxJQUFBLFlBQWdCLEVBQW5CO3dCQUlJLFlBQUEsR0FBZ0IsSUFBSSxDQUFDLEtBQUwsWUFBdUI7d0JBQ3ZDLGFBQUEs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QyxDQUFDLElBQUksQ0FBQyxJQUFQLEdBQWMsQ0FBQyxDQUFDO0lBQXhFLENBQVQ7SUFFQSxJQUFBLEdBQVUsTUFBQSxDQUFPLFdBQVAsdUNBQW1DLEVBQW5DO0lBQ1YsT0FBQSxHQUFVLE1BQUEsQ0FBTztRQUFFLElBQUEsRUFBTSxJQUFSO0tBQVAsRUFBdUIsT0FBdkI7V0FDVjtBQVhTOztBQWFiLFFBQUEsR0FBVyxTQUFBO0lBRVIsT0FBQSxDQUFDLEdBQUQsQ0FBTyxDQUFDLElBQUEsQ0FBSyxRQUFMLENBQUQsQ0FBQSxHQUFlLE1BQWYsR0FBb0IsQ0FBRSxJQUFJLENBQUMsR0FBTCxDQUFTLFNBQUMsQ0FBRDtBQUFPLFlBQUE7ZUFBQSxNQUFBLEdBQU0sQ0FBQyxPQUFPLENBQUMsR0FBUixDQUFZLENBQUMsQ0FBQyxHQUFkLENBQUQsQ0FBTixHQUEwQixDQUFDLElBQUEsZ0NBQWlCLENBQUMsQ0FBQyxHQUFILEdBQU8sTUFBdkIsQ0FBRDtJQUFqQyxDQUFULENBQTBFLENBQUMsSUFBM0UsQ0FBZ0YsSUFBaEYsQ0FBRixDQUEzQjtXQUFxSCxPQUFBLENBQ3BILEdBRG9ILENBQ2hILDhCQUFBLEdBQThCLENBQUMsSUFBQSxDQUFLLDJDQUFMLENBQUQsQ0FBOUIsR0FBZ0YsSUFEZ0M7QUFGN0c7O0FBS1gsTUFBTSxDQUFDLE9BQVAsR0FBaUI7SUFBRSxNQUFBLElBQUY7SUFBUSxZQUFBLFVBQVI7SUFBb0IsVUFBQSxRQUFwQjtJQUE4QixlQUFBLGFBQTlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMCAgICAgMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgXG4wMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgXG4wMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgXG4wMDAgMCAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgXG4wMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgXG4jIyNcblxucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5cbmhlbHBlcnMgPSByZXF1aXJlICcuL2hlbHBlcnMnXG5oZWxwZXJzLmNvbG9ycygpXG5cbk1FVEEgPSBbXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjICAwMDAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjICAgICAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICBcbiAgICBrZXk6ICAn4pa4dmVjJ1xuICAgIGRlc2M6ICfilrh2ZWMoYSwgLi4uKSdcbiAgICBtZXRhOiAoYXJnczosbm9kZTosb3B0czopIC0+XG4gICAgICAgIFxuICAgICAgICBjb25maWcgPSBpZiBhcmdzWzBdPy5kb3Q/IHRoZW4gYXJnc1swXSBlbHNlIHRpbWVzOid0aW1lcycgZG90Oidkb3QnIHBsdXM6J3BsdXMnIG1pbnVzOidtaW51cydcblxuICAgICAgICBub2RlcyA9IHJlcXVpcmUgJy4vbm9kZXMnXG4gICAgICAgIHsgICBPcCwgVmFsdWUsIENhbGwsIEFjY2VzcywgQmxvY2ssIFxuICAgICAgICAgICAgTnVtYmVyTGl0ZXJhbCwgSWRlbnRpZmllckxpdGVyYWwsIFxuICAgICAgICAgICAgUHJvcGVydHlOYW1lIH0gPSBub2Rlc1xuICAgICAgICBcbiAgICAgICAgaWRlbnRpZmllcnMgPSBub2RlLmNvbmRpdGlvbi5hcmdzLm1hcCAoYXJnKSAtPiBhcmcuYmFzZS52YWx1ZVxuICAgICAgICBcbiAgICAgICAgZm9yIGV4cCBpbiBub2RlLmJvZHkuZXhwcmVzc2lvbnNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbm9kZUluZm9zID0gW11cbiAgICAgICAgICAgIG5vZGVJbmRleCA9IC0xXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHByZVBhcnNlID0gKG5vZGUpIC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgbm9kZSBpbnN0YW5jZW9mIE9wXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAjIGxvZyAn4pa4dmVjIGNoaWxkJyBub2RlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RJc1ZhbHVlICA9IG5vZGUuZmlyc3QgIGluc3RhbmNlb2YgVmFsdWUgXG4gICAgICAgICAgICAgICAgICAgIHNlY29uZElzVmFsdWUgPSBub2RlLnNlY29uZCBpbnN0YW5jZW9mIFZhbHVlIFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RJc1ZlYyAgPSBmaXJzdElzVmFsdWUgYW5kIG5vZGUuZmlyc3QuYmFzZS52YWx1ZSAgaW4gaWRlbnRpZmllcnNcbiAgICAgICAgICAgICAgICAgICAgc2Vjb25kSXNWZWMgPSBzZWNvbmRJc1ZhbHVlIGFuZCBub2RlLnNlY29uZC5iYXNlLnZhbHVlIGluIGlkZW50aWZpZXJzXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiBub2RlLm9wZXJhdG9yID09ICcqJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zWysrbm9kZUluZGV4XSA9IHtub2RlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgZmlyc3RJc1ZlYyBhbmQgc2Vjb25kSXNWZWNcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAnZG90J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICA9ICdudW0nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBmaXJzdElzVmVjXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnNpZGUgID0gJ2xlZnQnXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIHNlY29uZElzVmFsdWUgYW5kIG5vZGUuc2Vjb25kLmJhc2UgaW5zdGFuY2VvZiBOdW1iZXJMaXRlcmFsIG9yIG5vZGUuc2Vjb25kLmJhc2UgaW5zdGFuY2VvZiBJZGVudGlmaWVyTGl0ZXJhbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAndGltZXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICA9ICd2ZWMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnZlY09wID0gJ3RpbWVzT3JEb3QnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBzZWNvbmRJc1ZlY1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS5zaWRlICA9ICdyaWdodCdcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgZmlyc3RJc1ZhbHVlIGFuZCBub2RlLmZpcnN0LmJhc2UgaW5zdGFuY2VvZiBOdW1iZXJMaXRlcmFsIG9yIG5vZGUuZmlyc3QuYmFzZSBpbnN0YW5jZW9mIElkZW50aWZpZXJMaXRlcmFsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS52ZWNPcCA9ICd0aW1lcydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgID0gJ3ZlYydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAndGltZXNPckRvdCdcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0ub3BlcmF0b3IgID0gJyonXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgbm9kZS5vcGVyYXRvciA9PSAnLydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1srK25vZGVJbmRleF0gPSB7bm9kZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGZpcnN0SXNWZWNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS5zaWRlID0gJ2xlZnQnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAndGltZXMvJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgID0gJ3ZlYydcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0ub3BlcmF0b3IgID0gJy8nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vZGUub3BlcmF0b3IgPT0gJysnXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1srK25vZGVJbmRleF0gPSB7bm9kZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGZpcnN0SXNWZWMgYW5kIHNlY29uZElzVmVjXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnZlY09wID0gJ3BsdXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgID0gJ3ZlYydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGZpcnN0SXNWZWNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAncGx1cydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udHlwZSAgPSAndmVjJ1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBzZWNvbmRJc1ZlY1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS52ZWNPcCA9ICdwbHVzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICA9ICd2ZWMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS5vcGVyYXRvciAgPSAnKydcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgbm9kZS5vcGVyYXRvciA9PSAnLSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3NbKytub2RlSW5kZXhdID0ge25vZGV9XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGZpcnN0SXNWZWMgYW5kIHNlY29uZElzVmVjXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnZlY09wID0gJ21pbnVzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICA9ICd2ZWMnXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGZpcnN0SXNWZWNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAnbWludXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgID0gJ3ZlYydcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgc2Vjb25kSXNWZWNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAnbWludXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgID0gJ3ZlYydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLm9wZXJhdG9yICA9ICctJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgbm9kZS5jb25zdHJ1Y3Rvci5uYW1lID09ICdWYWx1ZSdcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1srK25vZGVJbmRleF0gPSB7bm9kZX1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vdCBub2RlLmJhc2UudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLmJvZHkgPSBub2RlLmJhc2UuYm9keT8uZXhwcmVzc2lvbnM/WzBdPy5jb25zdHJ1Y3Rvci5uYW1lXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS52YWx1ZSA9IG5vZGUuYmFzZS52YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vZGUuYmFzZS52YWx1ZSBpbiBpZGVudGlmaWVyc1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udHlwZSA9ICd2ZWMnXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBlbHNlIGlmIG5vZGUuY29uc3RydWN0b3IubmFtZSA9PSAnQ2FsbCdcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1srK25vZGVJbmRleF0gPSB7bm9kZX1cbiAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0uY2FsbCA9IG5vZGUudmFyaWFibGU/LmJhc2U/LnZhbHVlID8gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlID0gJ251bSdcblxuICAgICAgICAgICAgICAgIGVsc2UgaWYgbm9kZS5jb25zdHJ1Y3Rvci5uYW1lID09ICdBc3NpZ24nXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3NbKytub2RlSW5kZXhdID0ge25vZGV9XG4gICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLmNhbGwgPSBcIiN7bm9kZS52YXJpYWJsZT8uYmFzZT8udmFsdWUgPyAnPyd9PVwiXG4gICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgPSAnbnVtJ1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHByZVBhcnNlIGV4cFxuICAgICAgICAgICAgZXhwLnRyYXZlcnNlQ2hpbGRyZW4gdHJ1ZSwgcHJlUGFyc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgbm9kZUFycmF5ID0gbm9kZUluZm9zLm1hcCAoaSkgLT4gbiA9IGkubm9kZTsgZGVsZXRlIGkubm9kZTsgblxuICAgIFxuICAgICAgICAgICAgZm9yIGluZGV4IGluIG5vZGVJbmZvcy5sZW5ndGgtMS4uMFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGluZm8gPSBub2RlSW5mb3NbaW5kZXhdXG4gICAgICAgICAgICAgICAgbmQgICA9IG5vZGVBcnJheVtpbmRleF1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBpbmZvLnZlY09wXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBvdGhlck5vZGUgPSBpZiBpbmZvLnNpZGUgPT0gJ2xlZnQnIHRoZW4gbmQuc2Vjb25kIGVsc2UgbmQuZmlyc3RcbiAgICAgICAgICAgICAgICAgICAgdmVjTm9kZSAgID0gaWYgaW5mby5zaWRlID09ICdsZWZ0JyB0aGVuIG5kLmZpcnN0IGVsc2UgbmQuc2Vjb25kXG4gICAgICAgICAgICAgICAgICAgIG90aGVySW5kZXggPSBub2RlQXJyYXkuaW5kZXhPZiBvdGhlck5vZGVcbiAgICAgICAgICAgICAgICAgICAgdmVjSW5kZXggICA9IG5vZGVBcnJheS5pbmRleE9mIHZlY05vZGVcbiAgICAgICAgICAgICAgICAgICAgb3RoZXJJbmZvICA9IG5vZGVJbmZvc1tvdGhlckluZGV4XVxuICAgICAgICAgICAgICAgICAgICB2ZWNJbmZvICAgID0gbm9kZUluZm9zW3ZlY0luZGV4XVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgaW5mby52ZWNPcCA9PSAndGltZXNPckRvdCdcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBub3Qgb3RoZXJJbmZvXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mby52ZWNPcCA9ICd0aW1lcydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnR5cGUgID0gJ3ZlYycgXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgb3RoZXJJbmZvLnR5cGUgPT0gJ251bSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnZlY09wID0gJ3RpbWVzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udHlwZSAgPSAndmVjJyBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgb3RoZXJJbmZvLnR5cGUgPT0gJ3ZlYydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnZlY09wID0gJ2RvdCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnR5cGUgID0gJ251bScgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBpbmZvLm9wZXJhdG9yXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBmaXJzdEluZGV4ICA9IG5vZGVBcnJheS5pbmRleE9mIG5kLmZpcnN0XG4gICAgICAgICAgICAgICAgICAgIHNlY29uZEluZGV4ID0gbm9kZUFycmF5LmluZGV4T2YgbmQuc2Vjb25kXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBmaXJzdFR5cGUgID0gZmlyc3RJbmRleCAgPCAwIGFuZCAnbnVtJyBvciBub2RlSW5mb3NbZmlyc3RJbmRleF0udHlwZVxuICAgICAgICAgICAgICAgICAgICBzZWNvbmRUeXBlID0gc2Vjb25kSW5kZXggPCAwIGFuZCAnbnVtJyBvciBub2RlSW5mb3Nbc2Vjb25kSW5kZXhdLnR5cGVcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgZmlyc3RUeXBlID09ICd2ZWMnID09IHNlY29uZFR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgaW5mby5vcGVyYXRvciA9PSAnKidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnZlY09wID0gJ2RvdCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnR5cGUgPSAnbnVtJ1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBpbmZvLm9wZXJhdG9yID09ICctJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udmVjT3AgPSAnbWludXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mby50eXBlID0gJ3ZlYycgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGluZm8ub3BlcmF0b3IgPT0gJysnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mby52ZWNPcCA9ICdwbHVzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udHlwZSA9ICd2ZWMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgZmlyc3RUeXBlID09ICd2ZWMnIGFuZCBzZWNvbmRUeXBlID09ICdudW0nXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnZlY09wID0gaWYgaW5mby5vcGVyYXRvciA9PSAnLycgdGhlbiAndGltZXMvJyBlbHNlICd0aW1lcydcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udHlwZSA9ICd2ZWMnXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnNpZGUgPSAnbGVmdCdcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBmaXJzdFR5cGUgPT0gJ251bScgYW5kIHNlY29uZFR5cGUgPT0gJ3ZlYydcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udmVjT3AgPSAndGltZXMnXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnR5cGUgPSAndmVjJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5zaWRlID0gJ3JpZ2h0J1xuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGZpcnN0VHlwZSA9PSAnbnVtJyA9PSBzZWNvbmRUeXBlXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnR5cGUgPSAnbnVtJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGVsc2UgXG4gICAgICAgICAgICAgICAgICAgIGlmIGluZm8udmFsdWUgYW5kIG5vdCBpbmZvLnR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgICAgICBuZC5iYXNlIGluc3RhbmNlb2YgSWRlbnRpZmllckxpdGVyYWwgdGhlbiBpbmZvLnR5cGUgPSAnbnVtJ1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBuZC5iYXNlIGluc3RhbmNlb2YgTnVtYmVyTGl0ZXJhbCAgICAgdGhlbiBpbmZvLnR5cGUgPSAnbnVtJ1xuICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIGluZm8udHlwZSBpbiBbJ251bScgJ3ZlYyddXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBpbmZvLmJvZHkgPT0gJ09wJ1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBib2R5SW5kZXggPSBub2RlQXJyYXkuaW5kZXhPZiBuZC5iYXNlPy5ib2R5Py5leHByZXNzaW9uc1swXVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiB0eXBlID0gbm9kZUluZm9zW2JvZHlJbmRleF0/LnR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnR5cGUgPSB0eXBlXG5cbiAgICAgICAgICAgIGNvbnZlcnQgPSAobmQpIC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaW5kZXggPSBub2RlQXJyYXkuaW5kZXhPZiBuZFxuICAgICAgICAgICAgICAgIGluZm8gPSBub2RlSW5mb3NbaW5kZXhdXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgaW5mbz8udmVjT3BcbiAgICAgICAgICAgICAgICAgICAgdm4gPSBpZiBpbmZvLnNpZGUgPT0gJ3JpZ2h0JyB0aGVuIG5kLnNlY29uZCBlbHNlIG5kLmZpcnN0XG4gICAgICAgICAgICAgICAgICAgIHBuID0gaWYgaW5mby5zaWRlID09ICdyaWdodCcgdGhlbiBuZC5maXJzdCBlbHNlIG5kLnNlY29uZFxuICAgICAgICAgICAgICAgICAgICBvaSA9IG5vZGVBcnJheS5pbmRleE9mIHBuXG4gICAgICAgICAgICAgICAgICAgIG9wID0gaW5mby52ZWNPcFxuICAgICAgICAgICAgICAgICAgICBpZiBub3Qgdm4uYmFzZT8udmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgIHZuID0gY29udmVydCB2blxuICAgICAgICAgICAgICAgICAgICBhbCA9IFtjb252ZXJ0IHBuXVxuICAgICAgICAgICAgICAgICAgICBpZiBvcCA9PSAndGltZXMvJ1xuICAgICAgICAgICAgICAgICAgICAgICAgYWwgPSBbbmV3IE9wICcvJyAobmV3IFZhbHVlIG5ldyBOdW1iZXJMaXRlcmFsIDEpLCBhbFswXV1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9wID0gJ3RpbWVzJ1xuICAgICAgICAgICAgICAgICAgICBubiA9IG5ldyBDYWxsIChuZXcgVmFsdWUgdm4sIFtuZXcgQWNjZXNzIG5ldyBQcm9wZXJ0eU5hbWUgb3BdKSwgYWxcbiAgICAgICAgICAgICAgICBlbHNlIGlmIGluZm8/LmNhbGxcbiAgICAgICAgICAgICAgICAgICAgaWYgbmQuYXJncz8ubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICBuZC5hcmdzID0gbmQuYXJncy5tYXAgKG5kYSkgLT4gY29udmVydCBuZGFcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBuZC52YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgbmQudmFsdWUgPSBjb252ZXJ0IG5kLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgIG5kXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBuZFxuICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBpbmZvLGluZGV4IGluIG5vZGVJbmZvc1xuICAgICAgICAgICAgICAgIGlmIGluZm8udmVjT3BcbiAgICAgICAgICAgICAgICAgICAgbmQgPSBub2RlQXJyYXlbaW5kZXhdXG4gICAgICAgICAgICAgICAgICAgIGNuID0gY29udmVydCBuZFxuICAgICAgICAgICAgICAgICAgICBub2RlLnRyYXZlcnNlQ2hpbGRyZW4gdHJ1ZSwgKHRuKSAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgdG4uZmlyc3QgPT0gbmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0bi5maXJzdCA9IGNuXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIHRuLnNlY29uZCA9PSBuZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRuLnNlY29uZCA9IGNuXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIHRuLmV4cHJlc3Npb25zPyBhbmQgbmQgaW4gdG4uZXhwcmVzc2lvbnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0bi5leHByZXNzaW9uc1t0bi5leHByZXNzaW9ucy5pbmRleE9mIG5kXSA9IGNuXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBpbmZvLmNhbGxcbiAgICAgICAgICAgICAgICAgICAgY29udmVydCBub2RlQXJyYXlbaW5kZXhdXG4gICAgICAgICAgICBcbiAgICAgICAgZGVkZW50OiB0cnVlXG4gICAgICAgIHJlZHVjZTogdHJ1ZVxuICAgICAgICBib2R5OiAgIHRydWVcbiAgICAgICAgYmxvY2s6ICB0cnVlXG4sICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIFxuXG4gICAgZG9jOiDilrhkb2MgJ+KWuGRvYydcbiAgICAgICAgXG4gICAgICAgIFRoaXMgaXMgYSBzbGlnaHRseSBzcGVjaWFsIG1hY3JvLCBiZWNhdXNlIGl0J3MgZmlyc3QgcGFzcyBpcyBoYXJkY29kZWQgaW4gdGhlIHRva2VuaXplci5cbiAgICAgICAgVGhlIGJvZHkgb2YgdGhlIG1hY3JvIGlzIHdyYXBwZWQgaW4gYSBza2lubnkgdHJpcGxlIHN0cmluZyBiZWZvcmUgZnVydGhlciB0b2tlbml6YXRpb24uXG4gICAgICAgIEl0IGNhbiBjb250YWluIGFueXRoaW5nIGV4Y2VwdCBcXCdcXCdcXCcuXG4gICAgICAgIFxuICAgICAgICBJbiBub3JtYWwgb3BlcmF0aW9uLCBpdCBpcyByZWR1Y2VkIHRvIHRoZSBlbXB0eSBzdHJpbmcuIFxuICAgICAgICBCdXQgaWYgKiprb2ZmZWUqKiBpcyBjYWxsZWQgd2l0aCB0aGUgYC0tZG9jYCBhcmd1bWVudCwgbG9ncyB3aWxsIGJlIGluc2VydGVkIGluc3RlYWQuXG4gICAgICAgIFxuICAgICAgICBgYGBjb2ZmZWVzY3JpcHRcbiAgICAgICAg4pa4ZG9jICd0aXRsZSdcbiAgICAgICAgICAgIG15IGRvY3VtZW50YXRpb24gLi4uXG4gICAgICAgIGxvZyAnc29tZSBjb2RlJ1xuICAgICAgICDilrhkb2NcbiAgICAgICAgICAgIHdlIGFyZSBkb25lLlxuICAgICAgICBgYGBcbiAgICAgICAgXG4gICAgICAgIGBrb2ZmZWUgLS1kb2MgZmlsZWAgd2lsbCBvdXRwdXRcbiAgICAgICAgXG4gICAgICAgIGBgYG1hcmtkb3duXG4gICAgICAgICMjIHRpdGxlXG4gICAgICAgIG15IGRvY3VtZW50YXRpb24gLi4uXG4gICAgICAgIHNvbWUgY29kZVxuICAgICAgICB3ZSBhcmUgZG9uZS5cbiAgICAgICAgYGBgXG4gICAgICAgIFxuICAgICAgICBidXQgYGtvZmZlZSBmaWxlYCB3aWxsIG9ubHkgcHJpbnQgYHNvbWUgY29kZWBcbiAgICAgICAgXG4gICAga2V5OiAgJ+KWuGRvYydcbiAgICBkZXNjOiAn4pa4ZG9jIFtoZWFkZXJdIC4uLidcbiAgICBtZXRhOiAoYXJnczosbm9kZTosb3B0czopIC0+XG4gICAgICAgIGhlYWRlciA9IGFyZ3NbMF0gYW5kIFwiJyMjICN7YXJnc1swXX1cXFxcbicrXCIgb3IgXCInJytcIlxuICAgICAgICBiZWZvcmU6IG9wdHMuZG9jIGFuZCBcIiN7bWV0YUxvZyhvcHRzKX0oI3toZWFkZXJ9XCJcbiAgICAgICAgYWZ0ZXI6ICBcIilcIlxuICAgICAgICBza2lwOiAgIG5vdCBvcHRzLmRvYyBhbmQgd2l0aDpcIicnXCJcbiAgICAgICAgcmVkdWNlOiB0cnVlXG4gICAgICAgIGJvZHk6ICAgdHJ1ZVxuICAgICAgICBibG9jazogIGZhbHNlXG4sICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGtleTogICfilrhwcm9maWxlJyAgIFxuICAgIGRlc2M6ICfilrhwcm9maWxlIFtpZF0gLi4uJ1xuICAgIG1ldGE6IChhcmdzOixub2RlOixvcHRzOikgLT4gXG4gICAgICAgIFxuICAgICAgICBpZCA9IFwiI3tub2RlLmNvbmRpdGlvbi5sb2NhdGlvbkRhdGEuZmlyc3RfbGluZSsxfV8je25vZGUuY29uZGl0aW9uLmxvY2F0aW9uRGF0YS5maXJzdF9jb2x1bW59XCJcbiAgICAgICAgbmFtZSA9IGFyZ3NbMF0gPyBpZFxuICAgICAgICBjb2RlOiAgIFwia29mZmVlXyN7aWR9ID0gcHJvY2Vzcy5ocnRpbWUuYmlnaW50KClcIlxuICAgICAgICBhZnRlcjogIFwiI3ttZXRhTG9nKG9wdHMpfSgnI3tuYW1lfScsIChmdW5jdGlvbihiKXsgbGV0IGY9MTAwMG47IGZvciAobGV0IHUgb2YgWyducycsJ868cycsJ21zJywncyddKSB7IGlmICh1PT0ncycgfHwgYjxmKSB7IHJldHVybiAnJysoMTAwMG4qYi9mKSsnICcrdTsgfSBmKj0xMDAwbjsgfX0pKHByb2Nlc3MuaHJ0aW1lLmJpZ2ludCgpLWtvZmZlZV8je2lkfSkpO1wiXG4gICAgICAgIHJlZHVjZTogZmFsc2VcbiAgICAgICAgYm9keTogICB0cnVlXG4sXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGtleTogICfilrhhdmVyYWdlJyAgIFxuICAgIGRlc2M6ICfilrhhdmVyYWdlIG51bSAuLi4nXG4gICAgbWV0YTogKGFyZ3M6LG5vZGU6LG9wdHM6KSAtPiBcbiAgICAgICAgXG4gICAgICAgIGlkICA9IFwiI3tub2RlLmNvbmRpdGlvbi5sb2NhdGlvbkRhdGEuZmlyc3RfbGluZSsxfV8je25vZGUuY29uZGl0aW9uLmxvY2F0aW9uRGF0YS5maXJzdF9jb2x1bW59XCJcbiAgICAgICAgbnVtID0gYXJnc1swXSA/IDEwMFxuICAgICAgICBiZWZvcmU6ICBcIlwiXCJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAga29mZmVlXyN7aWR9ID0gMG47XG4gICAgICAgICAgICBmb3IoaSA9IDA7IGkgPCAje251bX07IGkrKykgXG4gICAgICAgICAgICB7IFxuICAgICAgICAgICAgICAgIGtvZmZlZV8je2lkfV9zdGFydCA9IHByb2Nlc3MuaHJ0aW1lLmJpZ2ludCgpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgYWZ0ZXI6IFwiXCJcIlxuICAgICAgICAgICAga29mZmVlXyN7aWR9ICs9IHByb2Nlc3MuaHJ0aW1lLmJpZ2ludCgpIC0ga29mZmVlXyN7aWR9X3N0YXJ0O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGtvZmZlZV8je2lkfSAvPSAje251bX1uO1xuICAgICAgICAgICAgI3ttZXRhTG9nKG9wdHMpfSgnI3tpZH0nLCAoZnVuY3Rpb24oYil7IGxldCBmPTEwMDBuOyBmb3IgKGxldCB1IG9mIFsnbnMnLCfOvHMnLCdtcycsJ3MnXSkgeyBpZiAodT09J3MnIHx8IGI8ZikgeyByZXR1cm4gJycrKDEwMDBuKmIvZikrJyAnK3U7IH0gZio9MTAwMG47IH19KShrb2ZmZWVfI3tpZH0pKTsgXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgcmVkdWNlOiB0cnVlXG4gICAgICAgIGJvZHk6ICAgdHJ1ZVxuLFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBrZXk6ICAn4pa4c3RhcnQnICAgXG4gICAgZGVzYzogJ+KWuHN0YXJ0IGlkIC4uLidcbiAgICBpbmZvOlxuICAgICAgICB0aGVuOiB0cnVlXG4gICAgICAgIGFyZ3M6IDFcbiAgICBtZXRhOiAoYXJnczopIC0+IFxuICAgICAgICBpZCA9IGFyZ3NbMF0gPyAnc3RhcnRfZW5kJ1xuICAgICAgICBiZWZvcmU6IFwia29mZmVlXyN7aWR9ID0gcHJvY2Vzcy5ocnRpbWUuYmlnaW50KClcIlxuICAgICAgICByZWR1Y2U6IHRydWVcbiAgICAgICAgYm9keTogICBmYWxzZVxuLFxuICAgIGtleTogICfilrhlbmQnICAgICBcbiAgICBkZXNjOiAn4pa4ZW5kIGlkIC4uLidcbiAgICBpbmZvOlxuICAgICAgICB0aGVuOiB0cnVlXG4gICAgICAgIGFyZ3M6IDFcbiAgICBtZXRhOiAoYXJnczosb3B0czopIC0+IFxuICAgICAgICBpZCA9IGFyZ3NbMF0gPyAnc3RhcnRfZW5kJ1xuICAgICAgICBiZWZvcmU6IFwiI3ttZXRhTG9nKG9wdHMpfSgnI3tpZH0nLCAoZnVuY3Rpb24oYil7IGxldCBmPTEwMDBuOyBmb3IgKGxldCB1IG9mIFsnbnMnLCfOvHMnLCdtcycsJ3MnXSkgeyBpZiAodT09J3MnIHx8IGI8ZikgeyByZXR1cm4gJycrKDEwMDBuKmIvZikrJyAnK3U7IH0gZio9MTAwMG47IH19KShwcm9jZXNzLmhydGltZS5iaWdpbnQoKS1rb2ZmZWVfI3tpZH0pKTtcIlxuICAgICAgICByZWR1Y2U6IHRydWVcbiAgICAgICAgYm9keTogICBmYWxzZVxuLCAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGtleTogICfilrhkYmcnICAgIFxuICAgIGRlc2M6ICfilrhkYmcgW21zZ10gLi4uJ1xuICAgIGluZm86XG4gICAgICAgIHRoZW46IHRydWUgIyBzaG91bGQgbm90IGJlIHVzZWQgd2l0aCBhIGJsb2NrXG4gICAgICAgIGFyZ3M6IDFcbiAgICBtZXRhOiAob3B0czosYXJnczosbm9kZTopIC0+XG4gICAgICAgIGJlZm9yZTogbG9nU291cmNlIHtvcHRzLCBhcmdzLCBub2RlfVxuICAgICAgICBhZnRlcjogICcpJ1xuICAgICAgICByZWR1Y2U6IHRydWVcbiAgICAgICAgYm9keTogICB0cnVlXG4gICAgICAgIGJsb2NrOiAgZmFsc2VcbiwgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBrZXk6ICAn4pa4YXNzZXJ0JyAgICBcbiAgICBkZXNjOiAn4pa4YXNzZXJ0IFttc2ddIC4uLidcbiAgICBtZXRhOiAob3B0czosYXJnczosbm9kZTopIC0+XG4gICAgICAgIFxuICAgICAgICBub2RlcyA9IHJlcXVpcmUgJy4vbm9kZXMnXG4gICAgICAgIHsgQmxvY2ssIGV4dGVuZCB9ID0gbm9kZXNcbiAgICAgICAgaWYgbm9kZS5ib2R5IGluc3RhbmNlb2YgQmxvY2tcbiAgICAgICAgICAgIGJvZHkgPSBub2RlLmJvZHkuZXhwcmVzc2lvbnNbMF1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgYm9keSA9IG5vZGUuYm9keVxuICAgICAgICAgICAgXG4gICAgICAgIGZyYWcgPSBib2R5LmNvbXBpbGVUb0ZyYWdtZW50cyBvcHRzXG4gICAgICAgIHRleHQgPSBub2RlLmZyYWdtZW50c1RvVGV4dCBmcmFnXG4gICAgICAgIGFyZ3MgPSBbJ2Fzc2VydGlvbiBmYWlsdXJlISddIGlmIG5vdCBhcmdzLmxlbmd0aFxuICAgICAgICBiZWZvcmU6IGxvZ1NvdXJjZSB7b3B0cywgYXJncywgbm9kZSwgY2xvc2U6dHJ1ZX1cbiAgICAgICAgYWZ0ZXI6ICAncHJvY2Vzcy5leGl0KDY2Nik7J1xuICAgICAgICB0aGVuOiAgIHRydWUgIyBzaG91bGQgbm90IGJlIHVzZWQgd2l0aCBhIGJsb2NrXG4gICAgICAgIGV2YWw6ICAgZmFsc2VcbiAgICAgICAgcmVkdWNlOiBmYWxzZVxuICAgICAgICBjb2RlOiAgIFwiISgje3RleHR9KVwiXG4sICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAgICAgICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICBcbiAgICBrZXk6ICAn4pa4dGVzdCdcbiAgICBkZXNjOiAn4pa4dGVzdCBbaWRdIC4uLidcbiAgICBtZXRhOiAob3B0czosYXJnczosbm9kZTopIC0+XG4gICAgICAgIGJlZm9yZSAgPSBsb2dTb3VyY2Uge29wdHMsIGFyZ3MsIG5vZGUsIGNsb3NlOnRydWV9XG4gICAgICAgIGJlZm9yZSArPSAnXFxuICAgIHRyeSB7XFxuJ1xuICAgICAgICBkZWRlbnQ6IHRydWVcbiAgICAgICAgYmVmb3JlOiBvcHRzLnRlc3QgYW5kIGJlZm9yZVxuICAgICAgICBhZnRlcjogIG9wdHMudGVzdCBhbmQgXCJ9IGNhdGNoKGVycikgeyAje21ldGFMb2cob3B0cyl9KGVyci5tZXNzYWdlKTsgfVxcblwiXG4gICAgICAgIHNraXA6ICAgbm90IG9wdHMudGVzdFxuICAgICAgICByZWR1Y2U6IHRydWVcbiAgICAgICAgYm9keTogICB0cnVlXG4sICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgIFxuICAgIGtleTogJ+KWuHJhbmQnICAgIFxuICAgIG1ldGE6IChhcmdzOikgLT4gXG4gICAgICAgIGNvZGU6ICAgXCJNYXRoLnJhbmRvbSgpIDwgI3thcmdzP1swXSA/IDAuNX1cIiBcbiAgICAgICAgcmVkdWNlOiBmYWxzZSBcbiAgICAgICAgYm9keTogICB0cnVlICAgXG4gICAgXG4gICAgIyBrZXk6ICd0b2tlbicgJ3BhcnNlJyAnY29kZSdcbl1cblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcblxuVEFCID0gJyAgICAnXG5cbmNvbXBpbGVNZXRhSWYgPSAobm9kZTosb3B0czopIC0+XG5cbiAgICBub2RlcyA9IHJlcXVpcmUgJy4vbm9kZXMnXG4gICAgXG4gICAgeyBCbG9jaywgQXNzaWduLCBWYWx1ZSwgTGl0ZXJhbCB9ID0gbm9kZXNcbiAgICB7IGV4dGVuZCwgbWVyZ2UgfSA9IGhlbHBlcnNcbiAgICAgICAgXG4gICAgaW5mbyA9IHJlZHVjZTp0cnVlLCBldmFsOnRydWVcbiAgICBcbiAgICBpZiBub2RlLmNvbmRpdGlvbi5iYXNlPy52YWx1ZT8uc3RhcnRzV2l0aCAn4pa4J1xuICAgICAgICBcbiAgICAgICAgbWV0YUtleSA9IG5vZGUuY29uZGl0aW9uLmJhc2UudmFsdWVcbiAgICAgICAgaWYgdHlwZW9mIG9wdHMubWV0YVttZXRhS2V5XSA9PSAnZnVuY3Rpb24nXG4gICAgICAgICAgICBpbmZvID0gb3B0cy5tZXRhW21ldGFLZXldIHtvcHRzLCBub2RlLCBhcmdzOltdfVxuICAgICAgICAgICAgXG4gICAgaWYgbm9kZS5jb25kaXRpb24udmFyaWFibGU/LmJhc2U/LnZhbHVlPy5zdGFydHNXaXRoICfilrgnXG4gICAgICAgIFxuICAgICAgICBtZXRhS2V5ID0gbm9kZS5jb25kaXRpb24udmFyaWFibGUuYmFzZS52YWx1ZVxuICAgICAgICBpZiB0eXBlb2Ygb3B0cy5tZXRhW21ldGFLZXldID09ICdmdW5jdGlvbidcbiAgICAgICAgICAgIGFyZ3MgPSBub2RlLmNvbmRpdGlvbi5hcmdzLm1hcCAoYSkgLT4gXG4gICAgICAgICAgICAgICAgYS5iYXNlPy52YWx1ZVxuICAgICAgICAgICAgYXJncyA9IGFyZ3MubWFwIChhKSAtPiBpZiBhWzBdIGluIFsnXCInLCBcIidcIl0gdGhlbiBhWzEuLi0yXSBlbHNlIGFcbiAgICAgICAgICAgIGluZm8gPSBvcHRzLm1ldGFbbWV0YUtleV0ge29wdHMsIG5vZGUsIGFyZ3N9XG4gICAgICAgIFxuICAgIGlmIGluZm8uc2tpcCBcbiAgICAgICAgaWYgaW5mby5za2lwLndpdGg/XG4gICAgICAgICAgICByZXR1cm4gbm9kZS5tYWtlQ29kZSBpbmZvLnNraXAud2l0aFxuICAgICAgICByZXR1cm4gW11cbiAgICBcbiAgICBpZiBpbmZvLmV2YWxcbiAgICAgICAgXG4gICAgICAgIGNvbmQgPSBpbmZvLmNvZGUgPyBub2RlLmZyYWdtZW50c1RvVGV4dCBub2RlLmNvbmRpdGlvbi5jb21waWxlVG9GcmFnbWVudHMgb3B0cywgMiAjTEVWRUxfUEFSRU5cbiAgICAgICAgdHJ5XG4gICAgICAgICAgICBvcyA9IHJlcXVpcmUgJ29zJ1xuICAgICAgICAgICAgZnMgPSByZXF1aXJlICdmcydcbiAgICAgICAgICAgIGluZm8uYm9keSA9ISEgZXZhbCBjb25kXG4gICAgICAgICAgICBpZiBpbmZvLmV2YWwgYW5kIGluZm8ucmVkdWNlIGFuZCBub3QgaW5mby5ib2R5IGFuZCBub3Qgbm9kZS5lbHNlQm9keVxuICAgICAgICAgICAgICAgIHJldHVybiBbXVxuICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgIGVycm9yIGVyclxuICAgICAgICBcbiAgICBmcmFnID0gW11cbiAgICBcbiAgICBpZiBpbmZvLnJlZHVjZSA9PSBmYWxzZVxuICAgICAgICBmcmFnID0gZnJhZy5jb25jYXQgbm9kZS5tYWtlQ29kZShcImlmIChcIiksIG5vZGUubWFrZUNvZGUoaW5mby5jb2RlKSwgbm9kZS5tYWtlQ29kZShcIikge1xcblwiKVxuICAgICAgICBcbiAgICAgICAgaW5kZW50ID0gb3B0cy5pbmRlbnQgKyBUQUJcbiAgICAgICAgYm9keU9wdCA9IG1lcmdlIG9wdHMsIHtpbmRlbnR9XG4gICAgZWxzZVxuICAgICAgICBpbmRlbnQgPSBvcHRzLmluZGVudFxuICAgICAgICBib2R5T3B0ID0gb3B0c1xuXG4gICAgaWYgaW5mby5iZWZvcmVcbiAgICAgICAgZnJhZy5wdXNoIG5vZGUubWFrZUNvZGUgKGluZm8uYmxvY2shPWZhbHNlIGFuZCBpbmZvLmRlZGVudCE9dHJ1ZSBhbmQgaW5kZW50IG9yICcnKSArIGluZm8uYmVmb3JlXG4gICAgICAgIFxuICAgIGlmIGluZm8uYm9keVxuICAgICAgICBpZiBpbmZvLmJsb2NrICE9IGZhbHNlXG4gICAgICAgICAgICBib2R5ID0gbm9kZS5lbnN1cmVCbG9jayBub2RlLmJvZHlcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgbm9kZS5ib2R5IGluc3RhbmNlb2YgQmxvY2tcbiAgICAgICAgICAgICAgICBib2R5ID0gbm9kZS5ib2R5LmV4cHJlc3Npb25zWzBdXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgYm9keSA9IG5vZGUuYm9keVxuICAgICAgICBpZiBib2R5XG4gICAgICAgICAgICBmcmFnID0gZnJhZy5jb25jYXQgYm9keS5jb21waWxlVG9GcmFnbWVudHMgYm9keU9wdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBmcmFnLnB1c2ggbm9kZS5tYWtlQ29kZSBcIicnXCIgIyBpZiBpbmZvLmJsb2NrID09IGZhbHNlID8/XG4gICAgICAgIFxuICAgIGlmIGluZm8uYWZ0ZXJcbiAgICAgICAgZnJhZy5wdXNoIG5vZGUubWFrZUNvZGUgKChpbmZvLmJsb2NrICE9IGZhbHNlKSBhbmQgKCdcXG4nICsgaW5kZW50KSBvciAnJykgKyBpbmZvLmFmdGVyXG5cbiAgICBpZiBub3QgaW5mby5yZWR1Y2VcbiAgICAgICAgZnJhZy5wdXNoIG5vZGUubWFrZUNvZGUoXCJcXG4je25vZGUudGFifX1cIilcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgaWYgbm9kZS5lbHNlQm9keSBhbmQgKGluZm8ucmVkdWNlID09IGZhbHNlIG9yIGluZm8uYm9keSA9PSBmYWxzZSlcbiAgICAgICAgZnJhZy5wdXNoIG5vZGUubWFrZUNvZGUgJyBlbHNlICcgaWYgbm90IGluZm8ucmVkdWNlXG4gICAgICAgIGlmIG5vZGUuaXNDaGFpblxuICAgICAgICAgICAgZnJhZyA9IGZyYWcuY29uY2F0IG5vZGUuZWxzZUJvZHkudW53cmFwKCkuY29tcGlsZVRvRnJhZ21lbnRzIGJvZHlPcHRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZnJhZyA9IGZyYWcuY29uY2F0IG5vZGUuZWxzZUJvZHkuY29tcGlsZVRvRnJhZ21lbnRzIGJvZHlPcHRcbiAgICAgICAgXG4gICAgcmV0dXJuIGZyYWdcbiAgICBcbiMgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4jIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuIyAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG5cbm1ldGFMb2cgPSAob3B0cykgLT4gb3B0cy5tZXRhbG9nID8gJ2NvbnNvbGUubG9nJ1xuXG5sb2dTb3VyY2UgPSAob3B0czosYXJnczosbm9kZTosY2xvc2U6KSAtPlxuICAgIFxuICAgIGNvbG9yZXR0ZSA9IHJlcXVpcmUgJ2NvbG9yZXR0ZSdcbiAgICB7IHllbGxvdywgYmx1ZSwgeWVsbG93QnJpZ2h0LCBibHVlQnJpZ2h0LCB3aGl0ZUJyaWdodCwgZGltLCBib2xkLCBncmF5IH0gPSBjb2xvcmV0dGUuY3JlYXRlQ29sb3JzIHVzZUNvbG9yOiBvcHRzLmZlYXR1cmUuY29sb3JcbiAgICBcbiAgICBzb3VyY2UgPSBvcHRzLnNvdXJjZSA/IG9wdHMuZmlsZW5hbWUgPyAnJ1xuICAgIGV4dCA9ICcnXG4gICAgaWYgc291cmNlXG4gICAgICAgIFtzb3VyY2UsIGV4dC4uLl0gPSBwYXRoLmJhc2VuYW1lKHNvdXJjZSkuc3BsaXQgJy4nXG4gICAgICAgIHNvdXJjZSAgPSB5ZWxsb3cgW3llbGxvd0JyaWdodChzb3VyY2UpLCBkaW0gZXh0LmpvaW4nLiddLmpvaW4gZGltICcuJ1xuICAgIGJlZm9yZSAgPSBcIiN7bWV0YUxvZyhvcHRzKX0oJyN7c291cmNlfSN7ZGltIGJsdWUgJzonfSN7Ymx1ZUJyaWdodCBcIiN7bm9kZS5jb25kaXRpb24ubG9jYXRpb25EYXRhLmZpcnN0X2xpbmUrMX1cIn0nXCJcbiAgICBiZWZvcmUgKz0gXCIsICcje2JvbGQgd2hpdGVCcmlnaHQgYXJnc1swXX0nXCIgaWYgYXJnc1swXSBcbiAgICBpZiAoY2xvc2UpXG4gICAgICAgIGJlZm9yZSArPSAnKTtcXG4nXG4gICAgZWxzZVxuICAgICAgICBiZWZvcmUgKz0gXCIsIFwiXG5cbiAgICBiZWZvcmVcbiAgICAgICAgXG4jIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICBcbiMgMDAwICAwMDAwICAwMDAgICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuIyAwMDAgIDAwMCAwIDAwMCAgICAgICAgMDAwICAwMDAwMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4jIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiMgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIFxuXG5pbmplY3RNZXRhID0gKG9wdGlvbnMpIC0+ICMgbWFrZSBzdXJlIHRoYXQgb3B0aW9ucyBoYXMgYSBtZXRhIHNldFxuICAgIFxuICAgIG9wdGlvbnMgPz0ge31cbiAgICBcbiAgICB7IGV4dGVuZCB9ID0gaGVscGVyc1xuICAgIFxuICAgIGRlZmF1bHRNZXRhID0ge31cbiAgICBNRVRBLm1hcCAobSkgLT4gZGVmYXVsdE1ldGFbbS5rZXldID0gbS5tZXRhOyBtLm1ldGEua2V5ID0gbS5rZXk7IG0ubWV0YS5pbmZvID0gbS5pbmZvXG4gICAgXG4gICAgbWV0YSAgICA9IGV4dGVuZCBkZWZhdWx0TWV0YSwgb3B0aW9ucy5tZXRhID8ge31cbiAgICBvcHRpb25zID0gZXh0ZW5kIHsgbWV0YTogbWV0YSB9LCBvcHRpb25zXG4gICAgb3B0aW9uc1xuXG5sb2dNZXRhcyA9IC0+XG4gICAgXG4gICAgbG9nIFwiI3tncmF5ICdNZXRhczonfVxcblxcbiN7IE1FVEEubWFwKChmKSAtPiBcIiAgICAje2hlbHBlcnMucGFkIGYua2V5fSN7Z3JheSBmLmRlc2MgPyBcIiN7Zi5rZXl9IC4uLlwifVwiKS5qb2luKCdcXG4nKSB9XCJcbiAgICBsb2cgXCIgICAg4pa4aWYgICAgICAgICAgICAgICAgICAgICAje2dyYXkgJ+KWuGlmIGNvbmQgLi4uIFtb4pa4ZWxpZiBjb25kIC4uLl0g4pa4ZWxzZSAuLi5dJ31cXG5cIlxuICAgIFxubW9kdWxlLmV4cG9ydHMgPSB7IE1FVEEsIGluamVjdE1ldGEsIGxvZ01ldGFzLCBjb21waWxlTWV0YUlmIH1cbiJdfQ==
//# sourceURL=../coffee/meta.coffee