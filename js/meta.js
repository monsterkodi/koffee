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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YS5qcyIsInNvdXJjZVJvb3QiOiIuLi9jb2ZmZWUiLCJzb3VyY2VzIjpbIm1ldGEuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGlGQUFBO0lBQUE7OztBQVFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7QUFFUCxPQUFBLEdBQVUsT0FBQSxDQUFRLFdBQVI7O0FBQ1YsT0FBTyxDQUFDLE1BQVIsQ0FBQTs7QUFFQSxJQUFBLEdBQU87SUFRSDtRQUFBLEdBQUEsRUFBTSxNQUFOO1FBQ0EsSUFBQSxFQUFNLGNBRE47UUFFQSxJQUFBLEVBQU0sU0FBQyxJQUFEO0FBRUYsZ0JBQUE7WUFGRyx5Q0FBRyxNQUFHLDJDQUFHLE1BQUcsMkNBQUc7WUFFbEIsTUFBQSxHQUFZLHNEQUFILEdBQXNCLElBQUssQ0FBQSxDQUFBLENBQTNCLEdBQW1DO2dCQUFBLEtBQUEsRUFBTSxPQUFOO2dCQUFjLEdBQUEsRUFBSSxLQUFsQjtnQkFBd0IsSUFBQSxFQUFLLE1BQTdCO2dCQUFvQyxLQUFBLEVBQU0sT0FBMUM7O1lBRTVDLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUjtZQUNKLGFBQUosRUFBUSxtQkFBUixFQUFlLGlCQUFmLEVBQXFCLHFCQUFyQixFQUE2QixtQkFBN0IsRUFDSSxtQ0FESixFQUNtQiwyQ0FEbkIsRUFFSTtZQUVKLFdBQUEsR0FBYyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFwQixDQUF3QixTQUFDLEdBQUQ7dUJBQVMsR0FBRyxDQUFDLElBQUksQ0FBQztZQUFsQixDQUF4QjtBQUVkO0FBQUEsaUJBQUEsc0NBQUE7O2dCQUVJLFNBQUEsR0FBWTtnQkFDWixTQUFBLEdBQVksQ0FBQztnQkFFYixRQUFBLEdBQVcsU0FBQyxJQUFEO0FBRVAsd0JBQUE7b0JBQUEsSUFBRyxJQUFBLFlBQWdCLEVBQW5CO3dCQUlJLFlBQUEsR0FBZ0IsSUFBSSxDQUFDLEtBQUwsWUFBdUI7d0JBQ3ZDLGFBQUEsR0FBZ0IsSUFBSSxDQUFDLE1BQUwsWUFBdUI7d0JBRXZDLFVBQUEsR0FBYyxZQUFBLElBQWlCLFFBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBaEIsRUFBQSxhQUEwQixXQUExQixFQUFBLElBQUEsTUFBQTt3QkFDL0IsV0FBQSxHQUFjLGFBQUEsSUFBa0IsUUFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFqQixFQUFBLGFBQTBCLFdBQTFCLEVBQUEsSUFBQSxNQUFBO3dCQUVoQyxJQUFHLElBQUksQ0FBQyxRQUFMLEtBQWlCLEdBQXBCOzRCQUVJLFNBQVUsQ0FBQSxFQUFFLFNBQUYsQ0FBVixHQUF5QjtnQ0FBQyxNQUFBLElBQUQ7OzRCQUV6QixJQUFHLFVBQUEsSUFBZSxXQUFsQjtnQ0FFUSxTQUFVLENBQUEsU0FBQSxDQUFVLENBQUMsS0FBckIsR0FBNkI7Z0NBQzdCLFNBQVUsQ0FBQSxTQUFBLENBQVUsQ0FBQyxJQUFyQixHQUE2QixNQUhyQzs2QkFBQSxNQUtLLElBQUcsVUFBSDtnQ0FFRyxTQUFVLENBQUEsU0FBQSxDQUFVLENBQUMsSUFBckIsR0FBNkI7Z0NBRTdCLElBQUcsYUFBQSxJQUFrQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQVosWUFBNEIsYUFBOUMsSUFBK0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFaLFlBQTRCLGlCQUE5RjtvQ0FDSSxTQUFVLENBQUEsU0FBQSxDQUFVLENBQUMsS0FBckIsR0FBNkI7b0NBQzdCLFNBQVUsQ0FBQSxTQUFBLENBQVUsQ0FBQyxJQUFyQixHQUE2QixNQUZqQztpQ0FBQSxNQUFBO29DQUlJLFNBQVUsQ0FBQSxTQUFBLENBQVUsQ0FBQyxLQUFyQixHQUE2QixhQUpqQztpQ0FKSDs2QkFBQSxNQVVBLElBQUcsV0FBSDtnQ0FFRyxTQUFVLENBQUEsU0FBQSxDQUFVLENBQUMsSUFBckIsR0FBNkI7Z0NBRTdCLElBQUcsWUFBQSxJQUFpQixJQUFJLENBQUMsS0FBSyxDQUFDLElBQVgsWUFBMkIsYUFBNUMsSUFBNkQsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFYLFlBQTJCLGlCQUEzRjtvQ0FDSSxTQUFVLENBQUEsU0FBQSxDQUFVLENBQUMsS0FBckIsR0FBNkI7b0NBQzdCLFNBQVUsQ0FBQSxTQUFBLENBQVUsQ0FBQyxJQUFyQixHQUE2QixNQUZqQztpQ0FBQSxNQUFBO29DQUlJLFNBQVUsQ0FBQSxTQUFBLENBQVUsQ0FBQyxLQUFyQixHQUE2QixhQUpqQztpQ0FKSDs2QkFBQSxNQUFBO2dDQVVELFNBQVUsQ0FBQSxTQUFBLENBQVUsQ0FBQyxRQUFyQixHQUFpQyxJQVZoQzs2QkFuQlQ7O3dCQStCQSxJQUFHLElBQUksQ0FBQyxRQUFMLEtBQWlCLEdBQXBCOzRCQUVJLFNBQVUsQ0FBQSxFQUFFLFNBQUYsQ0FBVixHQUF5QjtnQ0FBQyxNQUFBLElBQUQ7OzRCQUN6QixJQUFHLFVBQUg7Z0NBQ0ksU0FBVSxDQUFBLFNBQUEsQ0FBVSxDQUFDLElBQXJCLEdBQTRCO2dDQUM1QixTQUFVLENBQUEsU0FBQSxDQUFVLENBQUMsS0FBckIsR0FBNkI7Z0NBQzdCLFNBQVUsQ0FBQSxTQUFBLENBQVUsQ0FBQyxJQUFyQixHQUE2QixNQUhqQzs2QkFBQSxNQUFBO2dDQUtJLFNBQVUsQ0FBQSxTQUFBLENBQVUsQ0FBQyxRQUFyQixHQUFnQyxJQUxwQzs2QkFISjs7d0JBVUEsSUFBRyxJQUFJLENBQUMsUUFBTCxLQUFpQixHQUFwQjs0QkFFSSxTQUFVLENBQUEsRUFBRSxTQUFGLENBQVYsR0FBeUI7Z0NBQUMsTUFBQSxJQUFEOzs0QkFFekIsSUFBRyxVQUFBLElBQWUsV0FBbEI7Z0NBQ1EsU0FBVSxDQUFBLFNBQUEsQ0FBVSxDQUFDLEtBQXJCLEdBQTZCO2dDQUM3QixTQUFVLENBQUEsU0FBQSxDQUFVLENBQUMsSUFBckIsR0FBNkIsTUFGckM7NkJBQUEsTUFHSyxJQUFHLFVBQUg7Z0NBQ0csU0FBVSxDQUFBLFNBQUEsQ0FBVSxDQUFDLEtBQXJCLEdBQTZCO2dDQUM3QixTQUFVLENBQUEsU0FBQSxDQUFVLENBQUMsSUFBckIsR0FBNkIsTUFGaEM7NkJBQUEsTUFHQSxJQUFHLFdBQUg7Z0NBQ0csU0FBVSxDQUFBLFNBQUEsQ0FBVSxDQUFDLEtBQXJCLEdBQTZCO2dDQUM3QixTQUFVLENBQUEsU0FBQSxDQUFVLENBQUMsSUFBckIsR0FBNkIsTUFGaEM7NkJBQUEsTUFBQTtnQ0FJRCxTQUFVLENBQUEsU0FBQSxDQUFVLENBQUMsUUFBckIsR0FBaUMsSUFKaEM7NkJBVlQ7O3dCQWdCQSxJQUFHLElBQUksQ0FBQyxRQUFMLEtBQWlCLEdBQXBCOzRCQUVJLFNBQVUsQ0FBQSxFQUFFLFNBQUYsQ0FBVixHQUF5QjtnQ0FBQyxNQUFBLElBQUQ7OzRCQUV6QixJQUFHLFVBQUEsSUFBZSxXQUFsQjtnQ0FDUSxTQUFVLENBQUEsU0FBQSxDQUFVLENBQUMsS0FBckIsR0FBNkI7dUNBQzdCLFNBQVUsQ0FBQSxTQUFBLENBQVUsQ0FBQyxJQUFyQixHQUE2QixNQUZyQzs2QkFBQSxNQUdLLElBQUcsVUFBSDtnQ0FDRyxTQUFVLENBQUEsU0FBQSxDQUFVLENBQUMsS0FBckIsR0FBNkI7dUNBQzdCLFNBQVUsQ0FBQSxTQUFBLENBQVUsQ0FBQyxJQUFyQixHQUE2QixNQUZoQzs2QkFBQSxNQUdBLElBQUcsV0FBSDtnQ0FDRyxTQUFVLENBQUEsU0FBQSxDQUFVLENBQUMsS0FBckIsR0FBNkI7dUNBQzdCLFNBQVUsQ0FBQSxTQUFBLENBQVUsQ0FBQyxJQUFyQixHQUE2QixNQUZoQzs2QkFBQSxNQUFBO3VDQUlELFNBQVUsQ0FBQSxTQUFBLENBQVUsQ0FBQyxRQUFyQixHQUFpQyxJQUpoQzs2QkFWVDt5QkFuRUo7cUJBQUEsTUFtRkssSUFBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQWpCLEtBQXlCLE9BQTVCO3dCQUVELFNBQVUsQ0FBQSxFQUFFLFNBQUYsQ0FBVixHQUF5Qjs0QkFBQyxNQUFBLElBQUQ7O3dCQUV6QixJQUFHLENBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFqQjs0QkFDSSxTQUFVLENBQUEsU0FBQSxDQUFVLENBQUMsSUFBckIsd0dBQTJELENBQUUsV0FBVyxDQUFDLGdDQUQ3RTt5QkFBQSxNQUFBOzRCQUdJLFNBQVUsQ0FBQSxTQUFBLENBQVUsQ0FBQyxLQUFyQixHQUE2QixJQUFJLENBQUMsSUFBSSxDQUFDLE1BSDNDOzt3QkFLQSxZQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBVixFQUFBLGFBQW1CLFdBQW5CLEVBQUEsS0FBQSxNQUFIO21DQUNJLFNBQVUsQ0FBQSxTQUFBLENBQVUsQ0FBQyxJQUFyQixHQUE0QixNQURoQzt5QkFUQztxQkFBQSxNQVlBLElBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFqQixLQUF5QixNQUE1Qjt3QkFFRCxTQUFVLENBQUEsRUFBRSxTQUFGLENBQVYsR0FBeUI7NEJBQUMsTUFBQSxJQUFEOzt3QkFDekIsU0FBVSxDQUFBLFNBQUEsQ0FBVSxDQUFDLElBQXJCLDhIQUF5RDsrQkFDekQsU0FBVSxDQUFBLFNBQUEsQ0FBVSxDQUFDLElBQXJCLEdBQTRCLE1BSjNCO3FCQUFBLE1BTUEsSUFBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQWpCLEtBQXlCLFFBQTVCO3dCQUVELFNBQVUsQ0FBQSxFQUFFLFNBQUYsQ0FBVixHQUF5Qjs0QkFBQyxNQUFBLElBQUQ7O3dCQUN6QixTQUFVLENBQUEsU0FBQSxDQUFVLENBQUMsSUFBckIsR0FBOEIsNEhBQThCLEdBQTlCLENBQUEsR0FBa0M7K0JBQ2hFLFNBQVUsQ0FBQSxTQUFBLENBQVUsQ0FBQyxJQUFyQixHQUE0QixNQUozQjs7Z0JBdkdFO2dCQTZHWCxRQUFBLENBQVMsR0FBVDtnQkFDQSxHQUFHLENBQUMsZ0JBQUosQ0FBcUIsSUFBckIsRUFBMkIsUUFBM0I7Z0JBRUEsU0FBQSxHQUFZLFNBQVMsQ0FBQyxHQUFWLENBQWMsU0FBQyxDQUFEO0FBQU8sd0JBQUE7b0JBQUEsQ0FBQSxHQUFJLENBQUMsQ0FBQztvQkFBTSxPQUFPLENBQUMsQ0FBQzsyQkFBTTtnQkFBbEMsQ0FBZDtBQUVaOzs7OztBQUFBLHFCQUFBLHdDQUFBOztvQkFFSSxJQUFBLEdBQU8sU0FBVSxDQUFBLEtBQUE7b0JBQ2pCLEVBQUEsR0FBTyxTQUFVLENBQUEsS0FBQTtvQkFFakIsSUFBRyxJQUFJLENBQUMsS0FBUjt3QkFFSSxTQUFBLEdBQWUsSUFBSSxDQUFDLElBQUwsS0FBYSxNQUFoQixHQUE0QixFQUFFLENBQUMsTUFBL0IsR0FBMkMsRUFBRSxDQUFDO3dCQUMxRCxPQUFBLEdBQWUsSUFBSSxDQUFDLElBQUwsS0FBYSxNQUFoQixHQUE0QixFQUFFLENBQUMsS0FBL0IsR0FBMEMsRUFBRSxDQUFDO3dCQUN6RCxVQUFBLEdBQWEsU0FBUyxDQUFDLE9BQVYsQ0FBa0IsU0FBbEI7d0JBQ2IsUUFBQSxHQUFhLFNBQVMsQ0FBQyxPQUFWLENBQWtCLE9BQWxCO3dCQUNiLFNBQUEsR0FBYSxTQUFVLENBQUEsVUFBQTt3QkFDdkIsT0FBQSxHQUFhLFNBQVUsQ0FBQSxRQUFBO3dCQUV2QixJQUFHLElBQUksQ0FBQyxLQUFMLEtBQWMsWUFBakI7NEJBRUksSUFBRyxDQUFJLFNBQVA7Z0NBQ0ksSUFBSSxDQUFDLEtBQUwsR0FBYTtnQ0FDYixJQUFJLENBQUMsSUFBTCxHQUFhLE1BRmpCOzZCQUFBLE1BSUssSUFBRyxTQUFTLENBQUMsSUFBVixLQUFrQixLQUFyQjtnQ0FDRCxJQUFJLENBQUMsS0FBTCxHQUFhO2dDQUNiLElBQUksQ0FBQyxJQUFMLEdBQWEsTUFGWjs2QkFBQSxNQUlBLElBQUcsU0FBUyxDQUFDLElBQVYsS0FBa0IsS0FBckI7Z0NBQ0QsSUFBSSxDQUFDLEtBQUwsR0FBYTtnQ0FDYixJQUFJLENBQUMsSUFBTCxHQUFhLE1BRlo7NkJBVlQ7eUJBVEo7cUJBQUEsTUF1QkssSUFBRyxJQUFJLENBQUMsUUFBUjt3QkFFRCxVQUFBLEdBQWMsU0FBUyxDQUFDLE9BQVYsQ0FBa0IsRUFBRSxDQUFDLEtBQXJCO3dCQUNkLFdBQUEsR0FBYyxTQUFTLENBQUMsT0FBVixDQUFrQixFQUFFLENBQUMsTUFBckI7d0JBRWQsU0FBQSxHQUFhLFVBQUEsR0FBYyxDQUFkLElBQW9CLEtBQXBCLElBQTZCLFNBQVUsQ0FBQSxVQUFBLENBQVcsQ0FBQzt3QkFDaEUsVUFBQSxHQUFhLFdBQUEsR0FBYyxDQUFkLElBQW9CLEtBQXBCLElBQTZCLFNBQVUsQ0FBQSxXQUFBLENBQVksQ0FBQzt3QkFFakUsSUFBRyxDQUFBLFNBQUEsS0FBYSxLQUFiLElBQWEsS0FBYixLQUFzQixVQUF0QixDQUFIOzRCQUVJLElBQUcsSUFBSSxDQUFDLFFBQUwsS0FBaUIsR0FBcEI7Z0NBQ0ksSUFBSSxDQUFDLEtBQUwsR0FBYTtnQ0FDYixJQUFJLENBQUMsSUFBTCxHQUFZLE1BRmhCOzZCQUFBLE1BR0ssSUFBRyxJQUFJLENBQUMsUUFBTCxLQUFpQixHQUFwQjtnQ0FDRCxJQUFJLENBQUMsS0FBTCxHQUFhO2dDQUNiLElBQUksQ0FBQyxJQUFMLEdBQVksTUFGWDs2QkFBQSxNQUdBLElBQUcsSUFBSSxDQUFDLFFBQUwsS0FBaUIsR0FBcEI7Z0NBQ0QsSUFBSSxDQUFDLEtBQUwsR0FBYTtnQ0FDYixJQUFJLENBQUMsSUFBTCxHQUFZLE1BRlg7NkJBUlQ7eUJBQUEsTUFZSyxJQUFHLFNBQUEsS0FBYSxLQUFiLElBQXVCLFVBQUEsS0FBYyxLQUF4Qzs0QkFDRCxJQUFJLENBQUMsS0FBTCxHQUFnQixJQUFJLENBQUMsUUFBTCxLQUFpQixHQUFwQixHQUE2QixRQUE3QixHQUEyQzs0QkFDeEQsSUFBSSxDQUFDLElBQUwsR0FBWTs0QkFDWixJQUFJLENBQUMsSUFBTCxHQUFZLE9BSFg7eUJBQUEsTUFJQSxJQUFHLFNBQUEsS0FBYSxLQUFiLElBQXVCLFVBQUEsS0FBYyxLQUF4Qzs0QkFDRCxJQUFJLENBQUMsS0FBTCxHQUFhOzRCQUNiLElBQUksQ0FBQyxJQUFMLEdBQVk7NEJBQ1osSUFBSSxDQUFDLElBQUwsR0FBWSxRQUhYO3lCQUFBLE1BSUEsSUFBRyxDQUFBLFNBQUEsS0FBYSxLQUFiLElBQWEsS0FBYixLQUFzQixVQUF0QixDQUFIOzRCQUNELElBQUksQ0FBQyxJQUFMLEdBQVksTUFEWDt5QkE1Qko7cUJBQUEsTUFBQTt3QkFnQ0QsSUFBRyxJQUFJLENBQUMsS0FBTCxJQUFlLENBQUksSUFBSSxDQUFDLElBQTNCOzRCQUVJLElBQVEsRUFBRSxDQUFDLElBQUgsWUFBbUIsaUJBQTNCO2dDQUFrRCxJQUFJLENBQUMsSUFBTCxHQUFZLE1BQTlEOzZCQUFBLE1BQ0ssSUFBRyxFQUFFLENBQUMsSUFBSCxZQUFtQixhQUF0QjtnQ0FBNkMsSUFBSSxDQUFDLElBQUwsR0FBWSxNQUF6RDs2QkFIVDs7d0JBS0EsWUFBRyxJQUFJLENBQUMsS0FBTCxLQUFjLEtBQWQsSUFBQSxJQUFBLEtBQW9CLEtBQXZCOzRCQUNJLEtBREo7eUJBQUEsTUFHSyxJQUFHLElBQUksQ0FBQyxJQUFMLEtBQWEsSUFBaEI7NEJBRUQsU0FBQSxHQUFZLFNBQVMsQ0FBQyxPQUFWLDZEQUErQixDQUFFLFdBQVksQ0FBQSxDQUFBLG1CQUE3Qzs0QkFFWixJQUFHLElBQUEsaURBQTJCLENBQUUsYUFBaEM7Z0NBQ0ksSUFBSSxDQUFDLElBQUwsR0FBWSxLQURoQjs2QkFKQzt5QkF4Q0o7O0FBNUJUO2dCQTJFQSxPQUFBLEdBQVUsU0FBQyxFQUFEO0FBRU4sd0JBQUE7b0JBQUEsS0FBQSxHQUFRLFNBQVMsQ0FBQyxPQUFWLENBQWtCLEVBQWxCO29CQUNSLElBQUEsR0FBTyxTQUFVLENBQUEsS0FBQTtvQkFFakIsbUJBQUcsSUFBSSxDQUFFLGNBQVQ7d0JBQ0ksRUFBQSxHQUFRLElBQUksQ0FBQyxJQUFMLEtBQWEsT0FBaEIsR0FBNkIsRUFBRSxDQUFDLE1BQWhDLEdBQTRDLEVBQUUsQ0FBQzt3QkFDcEQsRUFBQSxHQUFRLElBQUksQ0FBQyxJQUFMLEtBQWEsT0FBaEIsR0FBNkIsRUFBRSxDQUFDLEtBQWhDLEdBQTJDLEVBQUUsQ0FBQzt3QkFDbkQsRUFBQSxHQUFLLFNBQVMsQ0FBQyxPQUFWLENBQWtCLEVBQWxCO3dCQUNMLEVBQUEsR0FBSyxJQUFJLENBQUM7d0JBQ1YsSUFBRyxtQ0FBVyxDQUFFLGVBQWhCOzRCQUNJLEVBQUEsR0FBSyxPQUFBLENBQVEsRUFBUixFQURUOzt3QkFFQSxFQUFBLEdBQUssQ0FBQyxPQUFBLENBQVEsRUFBUixDQUFEO3dCQUNMLElBQUcsRUFBQSxLQUFNLFFBQVQ7NEJBQ0ksRUFBQSxHQUFLLENBQUMsSUFBSSxFQUFKLENBQU8sR0FBUCxFQUFZLElBQUksS0FBSixDQUFVLElBQUksYUFBSixDQUFrQixDQUFsQixDQUFWLENBQVosRUFBNEMsRUFBRyxDQUFBLENBQUEsQ0FBL0MsQ0FBRDs0QkFDTCxFQUFBLEdBQUssUUFGVDs7K0JBR0EsRUFBQSxHQUFLLElBQUksSUFBSixDQUFVLElBQUksS0FBSixDQUFVLEVBQVYsRUFBYyxDQUFDLElBQUksTUFBSixDQUFXLElBQUksWUFBSixDQUFpQixFQUFqQixDQUFYLENBQUQsQ0FBZCxDQUFWLEVBQTJELEVBQTNELEVBWFQ7cUJBQUEsTUFZSyxtQkFBRyxJQUFJLENBQUUsYUFBVDt3QkFDRCxxQ0FBVSxDQUFFLGVBQVo7NEJBQ0ksRUFBRSxDQUFDLElBQUgsR0FBVSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQVIsQ0FBWSxTQUFDLEdBQUQ7dUNBQVMsT0FBQSxDQUFRLEdBQVI7NEJBQVQsQ0FBWixFQURkO3lCQUFBLE1BRUssSUFBRyxFQUFFLENBQUMsS0FBTjs0QkFDRCxFQUFFLENBQUMsS0FBSCxHQUFXLE9BQUEsQ0FBUSxFQUFFLENBQUMsS0FBWCxFQURWOzsrQkFFTCxHQUxDO3FCQUFBLE1BQUE7K0JBT0QsR0FQQzs7Z0JBakJDO0FBMEJWLHFCQUFBLDZEQUFBOztvQkFDSSxJQUFHLElBQUksQ0FBQyxLQUFSO3dCQUNJLEVBQUEsR0FBSyxTQUFVLENBQUEsS0FBQTt3QkFDZixFQUFBLEdBQUssT0FBQSxDQUFRLEVBQVI7d0JBQ0wsSUFBSSxDQUFDLGdCQUFMLENBQXNCLElBQXRCLEVBQTRCLFNBQUMsRUFBRDs0QkFDeEIsSUFBRyxFQUFFLENBQUMsS0FBSCxLQUFZLEVBQWY7dUNBQ0ksRUFBRSxDQUFDLEtBQUgsR0FBVyxHQURmOzZCQUFBLE1BRUssSUFBRyxFQUFFLENBQUMsTUFBSCxLQUFhLEVBQWhCO3VDQUNELEVBQUUsQ0FBQyxNQUFILEdBQVksR0FEWDs2QkFBQSxNQUVBLElBQUcsd0JBQUEsSUFBb0IsYUFBTSxFQUFFLENBQUMsV0FBVCxFQUFBLEVBQUEsTUFBdkI7dUNBQ0QsRUFBRSxDQUFDLFdBQVksQ0FBQSxFQUFFLENBQUMsV0FBVyxDQUFDLE9BQWYsQ0FBdUIsRUFBdkIsQ0FBQSxDQUFmLEdBQTRDLEdBRDNDOzt3QkFMbUIsQ0FBNUIsRUFISjtxQkFBQSxNQVVLLElBQUcsSUFBSSxDQUFDLElBQVI7d0JBQ0QsT0FBQSxDQUFRLFNBQVUsQ0FBQSxLQUFBLENBQWxCLEVBREM7O0FBWFQ7QUE1Tko7bUJBME9BO2dCQUFBLE1BQUEsRUFBUSxJQUFSO2dCQUNBLE1BQUEsRUFBUSxJQURSO2dCQUVBLElBQUEsRUFBUSxJQUZSO2dCQUdBLEtBQUEsRUFBUSxJQUhSOztRQXJQRSxDQUZOO0tBUkcsRUEwUUg7UUFBQSxHQUFBLEVBQUcsRUFBSDtRQStCQSxHQUFBLEVBQU0sTUEvQk47UUFnQ0EsSUFBQSxFQUFNLG1CQWhDTjtRQWlDQSxJQUFBLEVBQU0sU0FBQyxJQUFEO0FBQ0YsZ0JBQUE7WUFERyx5Q0FBRyxNQUFHLDJDQUFHLE1BQUcsMkNBQUc7WUFDbEIsTUFBQSxHQUFTLElBQUssQ0FBQSxDQUFBLENBQUwsSUFBWSxDQUFBLE1BQUEsR0FBTyxJQUFLLENBQUEsQ0FBQSxDQUFaLEdBQWUsT0FBZixDQUFaLElBQXFDO21CQUM5QztnQkFBQSxNQUFBLEVBQVEsSUFBSSxDQUFDLEdBQUwsSUFBYSxDQUFFLENBQUMsT0FBQSxDQUFRLElBQVIsQ0FBRCxDQUFBLEdBQWUsR0FBZixHQUFrQixNQUFwQixDQUFyQjtnQkFDQSxLQUFBLEVBQVEsR0FEUjtnQkFFQSxJQUFBLEVBQVEsQ0FBSSxJQUFJLENBQUMsR0FBVCxJQUFpQjtvQkFBQSxDQUFBLElBQUEsQ0FBQSxFQUFLLElBQUw7aUJBRnpCO2dCQUdBLE1BQUEsRUFBUSxJQUhSO2dCQUlBLElBQUEsRUFBUSxJQUpSO2dCQUtBLEtBQUEsRUFBUSxLQUxSOztRQUZFLENBakNOO0tBMVFHLEVBMFRIO1FBQUEsR0FBQSxFQUFNLFVBQU47UUFDQSxJQUFBLEVBQU0sbUJBRE47UUFFQSxJQUFBLEVBQU0sU0FBQyxJQUFEO0FBRUYsZ0JBQUE7WUFGRyx5Q0FBRyxNQUFHLDJDQUFHLE1BQUcsMkNBQUc7WUFFbEIsRUFBQSxHQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsVUFBNUIsR0FBdUMsQ0FBeEMsQ0FBQSxHQUEwQyxHQUExQyxHQUE2QyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQztZQUNoRixJQUFBLHFDQUFpQjttQkFDakI7Z0JBQUEsSUFBQSxFQUFRLFNBQUEsR0FBVSxFQUFWLEdBQWEsNEJBQXJCO2dCQUNBLEtBQUEsRUFBVSxDQUFDLE9BQUEsQ0FBUSxJQUFSLENBQUQsQ0FBQSxHQUFlLElBQWYsR0FBbUIsSUFBbkIsR0FBd0IsdUtBQXhCLEdBQStMLEVBQS9MLEdBQWtNLEtBRDVNO2dCQUVBLE1BQUEsRUFBUSxLQUZSO2dCQUdBLElBQUEsRUFBUSxJQUhSOztRQUpFLENBRk47S0ExVEcsRUEyVUg7UUFBQSxHQUFBLEVBQU0sVUFBTjtRQUNBLElBQUEsRUFBTSxrQkFETjtRQUVBLElBQUEsRUFBTSxTQUFDLElBQUQ7QUFFRixnQkFBQTtZQUZHLHlDQUFHLE1BQUcsMkNBQUcsTUFBRywyQ0FBRztZQUVsQixFQUFBLEdBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxVQUE1QixHQUF1QyxDQUF4QyxDQUFBLEdBQTBDLEdBQTFDLEdBQTZDLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDO1lBQ2pGLEdBQUEscUNBQWdCO21CQUNoQjtnQkFBQSxNQUFBLEVBQVMsV0FBQSxHQUVJLEVBRkosR0FFTyx5QkFGUCxHQUdZLEdBSFosR0FHZ0IsMEJBSGhCLEdBS1EsRUFMUixHQUtXLHFDQUxwQjtnQkFRQSxLQUFBLEVBQU8sU0FBQSxHQUNNLEVBRE4sR0FDUyx1Q0FEVCxHQUNnRCxFQURoRCxHQUNtRCxzQkFEbkQsR0FHTSxFQUhOLEdBR1MsTUFIVCxHQUdlLEdBSGYsR0FHbUIsTUFIbkIsR0FJRixDQUFDLE9BQUEsQ0FBUSxJQUFSLENBQUQsQ0FKRSxHQUlhLElBSmIsR0FJaUIsRUFKakIsR0FJb0IsK0lBSnBCLEdBSW1LLEVBSm5LLEdBSXNLLE1BWjdLO2dCQWNBLE1BQUEsRUFBUSxJQWRSO2dCQWVBLElBQUEsRUFBUSxJQWZSOztRQUpFLENBRk47S0EzVUcsRUF3V0g7UUFBQSxHQUFBLEVBQU0sUUFBTjtRQUNBLElBQUEsRUFBTSxlQUROO1FBRUEsSUFBQSxFQUNJO1lBQUEsSUFBQSxFQUFNLElBQU47WUFDQSxJQUFBLEVBQU0sQ0FETjtTQUhKO1FBS0EsSUFBQSxFQUFNLFNBQUMsSUFBRDtBQUNGLGdCQUFBO1lBREcseUNBQUc7WUFDTixFQUFBLHFDQUFlO21CQUNmO2dCQUFBLE1BQUEsRUFBUSxTQUFBLEdBQVUsRUFBVixHQUFhLDRCQUFyQjtnQkFDQSxNQUFBLEVBQVEsSUFEUjtnQkFFQSxJQUFBLEVBQVEsS0FGUjs7UUFGRSxDQUxOO0tBeFdHLEVBbVhIO1FBQUEsR0FBQSxFQUFNLE1BQU47UUFDQSxJQUFBLEVBQU0sYUFETjtRQUVBLElBQUEsRUFDSTtZQUFBLElBQUEsRUFBTSxJQUFOO1lBQ0EsSUFBQSxFQUFNLENBRE47U0FISjtRQUtBLElBQUEsRUFBTSxTQUFDLElBQUQ7QUFDRixnQkFBQTtZQURHLHlDQUFHLE1BQUcsMkNBQUc7WUFDWixFQUFBLHFDQUFlO21CQUNmO2dCQUFBLE1BQUEsRUFBVSxDQUFDLE9BQUEsQ0FBUSxJQUFSLENBQUQsQ0FBQSxHQUFlLElBQWYsR0FBbUIsRUFBbkIsR0FBc0IsdUtBQXRCLEdBQTZMLEVBQTdMLEdBQWdNLEtBQTFNO2dCQUNBLE1BQUEsRUFBUSxJQURSO2dCQUVBLElBQUEsRUFBUSxLQUZSOztRQUZFLENBTE47S0FuWEcsRUFvWUg7UUFBQSxHQUFBLEVBQU0sTUFBTjtRQUNBLElBQUEsRUFBTSxnQkFETjtRQUVBLElBQUEsRUFDSTtZQUFBLElBQUEsRUFBTSxJQUFOO1lBQ0EsSUFBQSxFQUFNLENBRE47U0FISjtRQUtBLElBQUEsRUFBTSxTQUFDLElBQUQ7QUFDRixnQkFBQTtZQURHLHlDQUFHLE1BQUcsMkNBQUcsTUFBRywyQ0FBRzttQkFDbEI7Z0JBQUEsTUFBQSxFQUFRLFNBQUEsQ0FBVTtvQkFBQyxNQUFBLElBQUQ7b0JBQU8sTUFBQSxJQUFQO29CQUFhLE1BQUEsSUFBYjtpQkFBVixDQUFSO2dCQUNBLEtBQUEsRUFBUSxHQURSO2dCQUVBLE1BQUEsRUFBUSxJQUZSO2dCQUdBLElBQUEsRUFBUSxJQUhSO2dCQUlBLEtBQUEsRUFBUSxLQUpSOztRQURFLENBTE47S0FwWUcsRUFzWkg7UUFBQSxHQUFBLEVBQU0sU0FBTjtRQUNBLElBQUEsRUFBTSxtQkFETjtRQUVBLElBQUEsRUFBTSxTQUFDLElBQUQ7QUFFRixnQkFBQTtZQUZHLHlDQUFHLE1BQUcsMkNBQUcsTUFBRywyQ0FBRztZQUVsQixLQUFBLEdBQVEsT0FBQSxDQUFRLFNBQVI7WUFDTixtQkFBRixFQUFTO1lBQ1QsSUFBRyxJQUFJLENBQUMsSUFBTCxZQUFxQixLQUF4QjtnQkFDSSxJQUFBLEdBQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFZLENBQUEsQ0FBQSxFQURqQzthQUFBLE1BQUE7Z0JBR0ksSUFBQSxHQUFPLElBQUksQ0FBQyxLQUhoQjs7WUFLQSxJQUFBLEdBQU8sSUFBSSxDQUFDLGtCQUFMLENBQXdCLElBQXhCO1lBQ1AsSUFBQSxHQUFPLElBQUksQ0FBQyxlQUFMLENBQXFCLElBQXJCO1lBQ1AsSUFBaUMsQ0FBSSxJQUFJLENBQUMsTUFBMUM7Z0JBQUEsSUFBQSxHQUFPLENBQUMsb0JBQUQsRUFBUDs7bUJBQ0E7Z0JBQUEsTUFBQSxFQUFRLFNBQUEsQ0FBVTtvQkFBQyxNQUFBLElBQUQ7b0JBQU8sTUFBQSxJQUFQO29CQUFhLE1BQUEsSUFBYjtvQkFBbUIsS0FBQSxFQUFNLElBQXpCO2lCQUFWLENBQVI7Z0JBQ0EsS0FBQSxFQUFRLG9CQURSO2dCQUVBLElBQUEsRUFBUSxJQUZSO2dCQUdBLENBQUEsSUFBQSxDQUFBLEVBQVEsS0FIUjtnQkFJQSxNQUFBLEVBQVEsS0FKUjtnQkFLQSxJQUFBLEVBQVEsSUFBQSxHQUFLLElBQUwsR0FBVSxHQUxsQjs7UUFaRSxDQUZOO0tBdFpHLEVBaWJIO1FBQUEsR0FBQSxFQUFNLE9BQU47UUFDQSxJQUFBLEVBQU0sZ0JBRE47UUFFQSxJQUFBLEVBQU0sU0FBQyxJQUFEO0FBQ0YsZ0JBQUE7WUFERyx5Q0FBRyxNQUFHLDJDQUFHLE1BQUcsMkNBQUc7WUFDbEIsTUFBQSxHQUFVLFNBQUEsQ0FBVTtnQkFBQyxNQUFBLElBQUQ7Z0JBQU8sTUFBQSxJQUFQO2dCQUFhLE1BQUEsSUFBYjtnQkFBbUIsS0FBQSxFQUFNLElBQXpCO2FBQVY7WUFDVixNQUFBLElBQVU7bUJBQ1Y7Z0JBQUEsTUFBQSxFQUFRLElBQVI7Z0JBQ0EsTUFBQSxFQUFRLElBQUksQ0FBQyxJQUFMLElBQWMsTUFEdEI7Z0JBRUEsS0FBQSxFQUFRLElBQUksQ0FBQyxJQUFMLElBQWMsQ0FBQSxpQkFBQSxHQUFpQixDQUFDLE9BQUEsQ0FBUSxJQUFSLENBQUQsQ0FBakIsR0FBZ0Msb0JBQWhDLENBRnRCO2dCQUdBLElBQUEsRUFBUSxDQUFJLElBQUksQ0FBQyxJQUhqQjtnQkFJQSxNQUFBLEVBQVEsSUFKUjtnQkFLQSxJQUFBLEVBQVEsSUFMUjs7UUFIRSxDQUZOO0tBamJHLEVBbWNIO1FBQUEsR0FBQSxFQUFLLE9BQUw7UUFDQSxJQUFBLEVBQU0sU0FBQyxJQUFEO0FBQ0YsZ0JBQUE7WUFERyx5Q0FBRzttQkFDTjtnQkFBQSxJQUFBLEVBQVEsa0JBQUEsR0FBa0IsMkRBQVksR0FBWixDQUExQjtnQkFDQSxNQUFBLEVBQVEsS0FEUjtnQkFFQSxJQUFBLEVBQVEsSUFGUjs7UUFERSxDQUROO0tBbmNHOzs7QUFrZFAsR0FBQSxHQUFNOztBQUVOLGFBQUEsR0FBZ0IsU0FBQyxJQUFEO0FBRVosUUFBQTtJQUZhLHlDQUFHLE1BQUcsMkNBQUc7SUFFdEIsS0FBQSxHQUFRLE9BQUEsQ0FBUSxTQUFSO0lBRU4sbUJBQUYsRUFBUyxxQkFBVCxFQUFpQixtQkFBakIsRUFBd0I7SUFDdEIsdUJBQUYsRUFBVTtJQUVWLElBQUEsR0FBTztRQUFBLE1BQUEsRUFBTyxJQUFQO1FBQWEsQ0FBQSxJQUFBLENBQUEsRUFBSyxJQUFsQjs7SUFFUCw2RUFBNkIsQ0FBRSxVQUE1QixDQUF1QyxHQUF2QyxtQkFBSDtRQUVJLE9BQUEsR0FBVSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztRQUM5QixJQUFHLE9BQU8sSUFBSSxDQUFDLElBQUssQ0FBQSxPQUFBLENBQWpCLEtBQTZCLFVBQWhDO1lBQ0ksSUFBQSxHQUFPLElBQUksQ0FBQyxJQUFLLENBQUEsT0FBQSxDQUFWLENBQW1CO2dCQUFDLE1BQUEsSUFBRDtnQkFBTyxNQUFBLElBQVA7Z0JBQWEsSUFBQSxFQUFLLEVBQWxCO2FBQW5CLEVBRFg7U0FISjs7SUFNQSw4R0FBdUMsQ0FBRSxVQUF0QyxDQUFpRCxHQUFqRCw0QkFBSDtRQUVJLE9BQUEsR0FBVSxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7UUFDdkMsSUFBRyxPQUFPLElBQUksQ0FBQyxJQUFLLENBQUEsT0FBQSxDQUFqQixLQUE2QixVQUFoQztZQUNJLElBQUEsR0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFwQixDQUF3QixTQUFDLENBQUQ7QUFDM0Isb0JBQUE7cURBQU0sQ0FBRTtZQURtQixDQUF4QjtZQUVQLElBQUEsR0FBTyxJQUFJLENBQUMsR0FBTCxDQUFTLFNBQUMsQ0FBRDtBQUFPLG9CQUFBO2dCQUFBLFlBQUcsQ0FBRSxDQUFBLENBQUEsRUFBRixLQUFTLEdBQVQsSUFBQSxJQUFBLEtBQWMsR0FBakI7MkJBQTJCLENBQUUsY0FBN0I7aUJBQUEsTUFBQTsyQkFBeUMsRUFBekM7O1lBQVAsQ0FBVDtZQUNQLElBQUEsR0FBTyxJQUFJLENBQUMsSUFBSyxDQUFBLE9BQUEsQ0FBVixDQUFtQjtnQkFBQyxNQUFBLElBQUQ7Z0JBQU8sTUFBQSxJQUFQO2dCQUFhLE1BQUEsSUFBYjthQUFuQixFQUpYO1NBSEo7O0lBU0EsSUFBRyxJQUFJLENBQUMsSUFBUjtRQUNJLElBQUcseUJBQUg7QUFDSSxtQkFBTyxJQUFJLENBQUMsUUFBTCxDQUFjLElBQUksQ0FBQyxJQUFJLEVBQUMsSUFBRCxFQUF2QixFQURYOztBQUVBLGVBQU8sR0FIWDs7SUFLQSxJQUFHLElBQUksRUFBQyxJQUFELEVBQVA7UUFFSSxJQUFBLHVDQUFtQixJQUFJLENBQUMsZUFBTCxDQUFxQixJQUFJLENBQUMsU0FBUyxDQUFDLGtCQUFmLENBQWtDLElBQWxDLEVBQXdDLENBQXhDLENBQXJCO0FBQ25CO1lBQ0ksRUFBQSxHQUFLLE9BQUEsQ0FBUSxJQUFSO1lBQ0wsRUFBQSxHQUFLLE9BQUEsQ0FBUSxJQUFSO1lBQ0wsSUFBSSxDQUFDLElBQUwsR0FBVyxDQUFDLENBQUUsSUFBQSxDQUFLLElBQUw7WUFDZCxJQUFHLElBQUksRUFBQyxJQUFELEVBQUosSUFBYyxJQUFJLENBQUMsTUFBbkIsSUFBOEIsQ0FBSSxJQUFJLENBQUMsSUFBdkMsSUFBZ0QsQ0FBSSxJQUFJLENBQUMsUUFBNUQ7QUFDSSx1QkFBTyxHQURYO2FBSko7U0FBQSxhQUFBO1lBTU07WUFDSCxPQUFBLENBQUMsS0FBRCxDQUFPLEdBQVAsRUFQSDtTQUhKOztJQVlBLElBQUEsR0FBTztJQUVQLElBQUcsSUFBSSxDQUFDLE1BQUwsS0FBZSxLQUFsQjtRQUNJLElBQUEsR0FBTyxJQUFJLENBQUMsTUFBTCxDQUFZLElBQUksQ0FBQyxRQUFMLENBQWMsTUFBZCxDQUFaLEVBQW1DLElBQUksQ0FBQyxRQUFMLENBQWMsSUFBSSxDQUFDLElBQW5CLENBQW5DLEVBQTZELElBQUksQ0FBQyxRQUFMLENBQWMsT0FBZCxDQUE3RDtRQUVQLE1BQUEsR0FBUyxJQUFJLENBQUMsTUFBTCxHQUFjO1FBQ3ZCLE9BQUEsR0FBVSxLQUFBLENBQU0sSUFBTixFQUFZO1lBQUMsUUFBQSxNQUFEO1NBQVosRUFKZDtLQUFBLE1BQUE7UUFNSSxNQUFBLEdBQVMsSUFBSSxDQUFDO1FBQ2QsT0FBQSxHQUFVLEtBUGQ7O0lBU0EsSUFBRyxJQUFJLENBQUMsTUFBUjtRQUNJLElBQUksQ0FBQyxJQUFMLENBQVUsSUFBSSxDQUFDLFFBQUwsQ0FBYyxDQUFDLElBQUksQ0FBQyxLQUFMLEtBQVksS0FBWixJQUFzQixJQUFJLENBQUMsTUFBTCxLQUFhLElBQW5DLElBQTRDLE1BQTVDLElBQXNELEVBQXZELENBQUEsR0FBNkQsSUFBSSxDQUFDLE1BQWhGLENBQVYsRUFESjs7SUFHQSxJQUFHLElBQUksQ0FBQyxJQUFSO1FBQ0ksSUFBRyxJQUFJLENBQUMsS0FBTCxLQUFjLEtBQWpCO1lBQ0ksSUFBQSxHQUFPLElBQUksQ0FBQyxXQUFMLENBQWlCLElBQUksQ0FBQyxJQUF0QixFQURYO1NBQUEsTUFBQTtZQUdJLElBQUcsSUFBSSxDQUFDLElBQUwsWUFBcUIsS0FBeEI7Z0JBQ0ksSUFBQSxHQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBWSxDQUFBLENBQUEsRUFEakM7YUFBQSxNQUFBO2dCQUdJLElBQUEsR0FBTyxJQUFJLENBQUMsS0FIaEI7YUFISjs7UUFPQSxJQUFHLElBQUg7WUFDSSxJQUFBLEdBQU8sSUFBSSxDQUFDLE1BQUwsQ0FBWSxJQUFJLENBQUMsa0JBQUwsQ0FBd0IsT0FBeEIsQ0FBWixFQURYO1NBQUEsTUFBQTtZQUdJLElBQUksQ0FBQyxJQUFMLENBQVUsSUFBSSxDQUFDLFFBQUwsQ0FBYyxJQUFkLENBQVYsRUFISjtTQVJKOztJQWFBLElBQUcsSUFBSSxDQUFDLEtBQVI7UUFDSSxJQUFJLENBQUMsSUFBTCxDQUFVLElBQUksQ0FBQyxRQUFMLENBQWMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFMLEtBQWMsS0FBZixDQUFBLElBQTBCLENBQUMsSUFBQSxHQUFPLE1BQVIsQ0FBMUIsSUFBNkMsRUFBOUMsQ0FBQSxHQUFvRCxJQUFJLENBQUMsS0FBdkUsQ0FBVixFQURKOztJQUdBLElBQUcsQ0FBSSxJQUFJLENBQUMsTUFBWjtRQUNJLElBQUksQ0FBQyxJQUFMLENBQVUsSUFBSSxDQUFDLFFBQUwsQ0FBYyxJQUFBLEdBQUssSUFBSSxDQUFDLEdBQVYsR0FBYyxHQUE1QixDQUFWLEVBREo7O0lBR0EsSUFBRyxJQUFJLENBQUMsUUFBTCxJQUFrQixDQUFDLElBQUksQ0FBQyxNQUFMLEtBQWUsS0FBZixJQUF3QixJQUFJLENBQUMsSUFBTCxLQUFhLEtBQXRDLENBQXJCO1FBQ0ksSUFBb0MsQ0FBSSxJQUFJLENBQUMsTUFBN0M7WUFBQSxJQUFJLENBQUMsSUFBTCxDQUFVLElBQUksQ0FBQyxRQUFMLENBQWMsUUFBZCxDQUFWLEVBQUE7O1FBQ0EsSUFBRyxJQUFJLENBQUMsT0FBUjtZQUNJLElBQUEsR0FBTyxJQUFJLENBQUMsTUFBTCxDQUFZLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBZCxDQUFBLENBQXNCLENBQUMsa0JBQXZCLENBQTBDLE9BQTFDLENBQVosRUFEWDtTQUFBLE1BQUE7WUFHSSxJQUFBLEdBQU8sSUFBSSxDQUFDLE1BQUwsQ0FBWSxJQUFJLENBQUMsUUFBUSxDQUFDLGtCQUFkLENBQWlDLE9BQWpDLENBQVosRUFIWDtTQUZKOztBQU9BLFdBQU87QUFqRks7O0FBeUZoQixPQUFBLEdBQVUsU0FBQyxJQUFEO0FBQVUsUUFBQTtnREFBZTtBQUF6Qjs7QUFFVixTQUFBLEdBQVksU0FBQyxJQUFEO0FBRVIsUUFBQTtJQUZTLHlDQUFHLE1BQUcsMkNBQUcsTUFBRywyQ0FBRyxNQUFHLDZDQUFJO0lBRS9CLFNBQUEsR0FBWSxPQUFBLENBQVEsV0FBUjtJQUNaLE9BQTJFLFNBQVMsQ0FBQyxZQUFWLENBQXVCO1FBQUEsUUFBQSxFQUFVLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBdkI7S0FBdkIsQ0FBM0UsRUFBRSxvQkFBRixFQUFVLGdCQUFWLEVBQWdCLGdDQUFoQixFQUE4Qiw0QkFBOUIsRUFBMEMsOEJBQTFDLEVBQXVELGNBQXZELEVBQTRELGdCQUE1RCxFQUFrRTtJQUVsRSxNQUFBLGlGQUF1QztJQUN2QyxHQUFBLEdBQU07SUFDTixJQUFHLE1BQUg7UUFDSSxPQUFtQixJQUFJLENBQUMsUUFBTCxDQUFjLE1BQWQsQ0FBcUIsQ0FBQyxLQUF0QixDQUE0QixHQUE1QixDQUFuQixFQUFDLGdCQUFELEVBQVM7UUFDVCxNQUFBLEdBQVUsTUFBQSxDQUFPLENBQUMsWUFBQSxDQUFhLE1BQWIsQ0FBRCxFQUF1QixHQUFBLENBQUksR0FBRyxDQUFDLElBQUosQ0FBQSxDQUFBLENBQUosQ0FBdkIsQ0FBdUMsQ0FBQyxJQUF4QyxDQUE2QyxHQUFBLENBQUksR0FBSixDQUE3QyxDQUFQLEVBRmQ7O0lBR0EsTUFBQSxHQUFZLENBQUMsT0FBQSxDQUFRLElBQVIsQ0FBRCxDQUFBLEdBQWUsSUFBZixHQUFtQixNQUFuQixHQUEyQixDQUFDLEdBQUEsQ0FBSSxJQUFBLENBQUssR0FBTCxDQUFKLENBQUQsQ0FBM0IsR0FBMEMsQ0FBQyxVQUFBLENBQVcsRUFBQSxHQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsVUFBNUIsR0FBdUMsQ0FBeEMsQ0FBYixDQUFELENBQTFDLEdBQW9HO0lBQ2hILElBQStDLElBQUssQ0FBQSxDQUFBLENBQXBEO1FBQUEsTUFBQSxJQUFVLEtBQUEsR0FBSyxDQUFDLElBQUEsQ0FBSyxXQUFBLENBQVksSUFBSyxDQUFBLENBQUEsQ0FBakIsQ0FBTCxDQUFELENBQUwsR0FBK0IsSUFBekM7O0lBQ0EsSUFBSSxLQUFKO1FBQ0ksTUFBQSxJQUFVLE9BRGQ7S0FBQSxNQUFBO1FBR0ksTUFBQSxJQUFVLEtBSGQ7O1dBS0E7QUFqQlE7O0FBeUJaLFVBQUEsR0FBYSxTQUFDLE9BQUQ7QUFFVCxRQUFBOztRQUFBOztRQUFBLFVBQVc7O0lBRVQsU0FBVztJQUViLFdBQUEsR0FBYztJQUNkLElBQUksQ0FBQyxHQUFMLENBQVMsU0FBQyxDQUFEO1FBQU8sV0FBWSxDQUFBLENBQUMsQ0FBQyxHQUFGLENBQVosR0FBcUIsQ0FBQyxDQUFDO1FBQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFQLEdBQWEsQ0FBQyxDQUFDO2VBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFQLEdBQWMsQ0FBQyxDQUFDO0lBQXhFLENBQVQ7SUFFQSxJQUFBLEdBQVUsTUFBQSxDQUFPLFdBQVAsdUNBQW1DLEVBQW5DO0lBQ1YsT0FBQSxHQUFVLE1BQUEsQ0FBTztRQUFFLElBQUEsRUFBTSxJQUFSO0tBQVAsRUFBdUIsT0FBdkI7V0FDVjtBQVhTOztBQWFiLFFBQUEsR0FBVyxTQUFBO0lBRVIsT0FBQSxDQUFDLEdBQUQsQ0FBTyxDQUFDLElBQUEsQ0FBSyxRQUFMLENBQUQsQ0FBQSxHQUFlLE1BQWYsR0FBb0IsQ0FBRSxJQUFJLENBQUMsR0FBTCxDQUFTLFNBQUMsQ0FBRDtBQUFPLFlBQUE7ZUFBQSxNQUFBLEdBQU0sQ0FBQyxPQUFPLENBQUMsR0FBUixDQUFZLENBQUMsQ0FBQyxHQUFkLENBQUQsQ0FBTixHQUEwQixDQUFDLElBQUEsZ0NBQWlCLENBQUMsQ0FBQyxHQUFILEdBQU8sTUFBdkIsQ0FBRDtJQUFqQyxDQUFULENBQTBFLENBQUMsSUFBM0UsQ0FBZ0YsSUFBaEYsQ0FBRixDQUEzQjtXQUFxSCxPQUFBLENBQ3BILEdBRG9ILENBQ2hILDhCQUFBLEdBQThCLENBQUMsSUFBQSxDQUFLLDJDQUFMLENBQUQsQ0FBOUIsR0FBZ0YsSUFEZ0M7QUFGN0c7O0FBS1gsTUFBTSxDQUFDLE9BQVAsR0FBaUI7SUFBRSxNQUFBLElBQUY7SUFBUSxZQUFBLFVBQVI7SUFBb0IsVUFBQSxRQUFwQjtJQUE4QixlQUFBLGFBQTlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMCAgICAgMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgXG4wMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgXG4wMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgXG4wMDAgMCAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgXG4wMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgXG4jIyNcblxucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5cbmhlbHBlcnMgPSByZXF1aXJlICcuL2hlbHBlcnMnXG5oZWxwZXJzLmNvbG9ycygpXG5cbk1FVEEgPSBbXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjICAwMDAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjICAgICAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICBcbiAgICBrZXk6ICAn4pa4dmVjJ1xuICAgIGRlc2M6ICfilrh2ZWMoYSwgLi4uKSdcbiAgICBtZXRhOiAoYXJnczosbm9kZTosb3B0czopIC0+XG4gICAgICAgIFxuICAgICAgICBjb25maWcgPSBpZiBhcmdzWzBdPy5kb3Q/IHRoZW4gYXJnc1swXSBlbHNlIHRpbWVzOid0aW1lcycgZG90Oidkb3QnIHBsdXM6J3BsdXMnIG1pbnVzOidtaW51cydcblxuICAgICAgICBub2RlcyA9IHJlcXVpcmUgJy4vbm9kZXMnXG4gICAgICAgIHsgICBPcCwgVmFsdWUsIENhbGwsIEFjY2VzcywgQmxvY2ssIFxuICAgICAgICAgICAgTnVtYmVyTGl0ZXJhbCwgSWRlbnRpZmllckxpdGVyYWwsIFxuICAgICAgICAgICAgUHJvcGVydHlOYW1lIH0gPSBub2Rlc1xuICAgICAgICBcbiAgICAgICAgaWRlbnRpZmllcnMgPSBub2RlLmNvbmRpdGlvbi5hcmdzLm1hcCAoYXJnKSAtPiBhcmcuYmFzZS52YWx1ZVxuICAgICAgICBcbiAgICAgICAgZm9yIGV4cCBpbiBub2RlLmJvZHkuZXhwcmVzc2lvbnNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbm9kZUluZm9zID0gW11cbiAgICAgICAgICAgIG5vZGVJbmRleCA9IC0xXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHByZVBhcnNlID0gKG5vZGUpIC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgbm9kZSBpbnN0YW5jZW9mIE9wXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAjIGxvZyAn4pa4dmVjIGNoaWxkJyBub2RlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RJc1ZhbHVlICA9IG5vZGUuZmlyc3QgIGluc3RhbmNlb2YgVmFsdWUgXG4gICAgICAgICAgICAgICAgICAgIHNlY29uZElzVmFsdWUgPSBub2RlLnNlY29uZCBpbnN0YW5jZW9mIFZhbHVlIFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RJc1ZlYyAgPSBmaXJzdElzVmFsdWUgYW5kIG5vZGUuZmlyc3QuYmFzZS52YWx1ZSAgaW4gaWRlbnRpZmllcnNcbiAgICAgICAgICAgICAgICAgICAgc2Vjb25kSXNWZWMgPSBzZWNvbmRJc1ZhbHVlIGFuZCBub2RlLnNlY29uZC5iYXNlLnZhbHVlIGluIGlkZW50aWZpZXJzXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiBub2RlLm9wZXJhdG9yID09ICcqJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zWysrbm9kZUluZGV4XSA9IHtub2RlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgZmlyc3RJc1ZlYyBhbmQgc2Vjb25kSXNWZWNcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAnZG90J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICA9ICdudW0nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBmaXJzdElzVmVjXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnNpZGUgID0gJ2xlZnQnXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIHNlY29uZElzVmFsdWUgYW5kIG5vZGUuc2Vjb25kLmJhc2UgaW5zdGFuY2VvZiBOdW1iZXJMaXRlcmFsIG9yIG5vZGUuc2Vjb25kLmJhc2UgaW5zdGFuY2VvZiBJZGVudGlmaWVyTGl0ZXJhbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAndGltZXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICA9ICd2ZWMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnZlY09wID0gJ3RpbWVzT3JEb3QnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBzZWNvbmRJc1ZlY1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS5zaWRlICA9ICdyaWdodCdcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgZmlyc3RJc1ZhbHVlIGFuZCBub2RlLmZpcnN0LmJhc2UgaW5zdGFuY2VvZiBOdW1iZXJMaXRlcmFsIG9yIG5vZGUuZmlyc3QuYmFzZSBpbnN0YW5jZW9mIElkZW50aWZpZXJMaXRlcmFsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS52ZWNPcCA9ICd0aW1lcydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgID0gJ3ZlYydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAndGltZXNPckRvdCdcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0ub3BlcmF0b3IgID0gJyonXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgbm9kZS5vcGVyYXRvciA9PSAnLydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1srK25vZGVJbmRleF0gPSB7bm9kZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGZpcnN0SXNWZWNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS5zaWRlID0gJ2xlZnQnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAndGltZXMvJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgID0gJ3ZlYydcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0ub3BlcmF0b3IgPSAnLydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgbm9kZS5vcGVyYXRvciA9PSAnKydcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zWysrbm9kZUluZGV4XSA9IHtub2RlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgZmlyc3RJc1ZlYyBhbmQgc2Vjb25kSXNWZWNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAncGx1cydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udHlwZSAgPSAndmVjJ1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBmaXJzdElzVmVjXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnZlY09wID0gJ3BsdXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgID0gJ3ZlYydcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgc2Vjb25kSXNWZWNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAncGx1cydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udHlwZSAgPSAndmVjJ1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS5vcGVyYXRvciAgPSAnKydcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgbm9kZS5vcGVyYXRvciA9PSAnLSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3NbKytub2RlSW5kZXhdID0ge25vZGV9XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGZpcnN0SXNWZWMgYW5kIHNlY29uZElzVmVjXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnZlY09wID0gJ21pbnVzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICA9ICd2ZWMnXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGZpcnN0SXNWZWNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAnbWludXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgID0gJ3ZlYydcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgc2Vjb25kSXNWZWNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAnbWludXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgID0gJ3ZlYydcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0ub3BlcmF0b3IgID0gJy0nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBub2RlLmNvbnN0cnVjdG9yLm5hbWUgPT0gJ1ZhbHVlJ1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zWysrbm9kZUluZGV4XSA9IHtub2RlfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgbm90IG5vZGUuYmFzZS52YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0uYm9keSA9IG5vZGUuYmFzZS5ib2R5Py5leHByZXNzaW9ucz9bMF0/LmNvbnN0cnVjdG9yLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgZWxzZSAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnZhbHVlID0gbm9kZS5iYXNlLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgbm9kZS5iYXNlLnZhbHVlIGluIGlkZW50aWZpZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlID0gJ3ZlYydcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgbm9kZS5jb25zdHJ1Y3Rvci5uYW1lID09ICdDYWxsJ1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zWysrbm9kZUluZGV4XSA9IHtub2RlfVxuICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS5jYWxsID0gbm9kZS52YXJpYWJsZT8uYmFzZT8udmFsdWUgPyB0cnVlXG4gICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgPSAnbnVtJ1xuXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBub2RlLmNvbnN0cnVjdG9yLm5hbWUgPT0gJ0Fzc2lnbidcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1srK25vZGVJbmRleF0gPSB7bm9kZX1cbiAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0uY2FsbCA9IFwiI3tub2RlLnZhcmlhYmxlPy5iYXNlPy52YWx1ZSA/ICc/J309XCJcbiAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udHlwZSA9ICdudW0nXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgcHJlUGFyc2UgZXhwXG4gICAgICAgICAgICBleHAudHJhdmVyc2VDaGlsZHJlbiB0cnVlLCBwcmVQYXJzZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBub2RlQXJyYXkgPSBub2RlSW5mb3MubWFwIChpKSAtPiBuID0gaS5ub2RlOyBkZWxldGUgaS5ub2RlOyBuXG4gICAgXG4gICAgICAgICAgICBmb3IgaW5kZXggaW4gbm9kZUluZm9zLmxlbmd0aC0xLi4wXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaW5mbyA9IG5vZGVJbmZvc1tpbmRleF1cbiAgICAgICAgICAgICAgICBuZCAgID0gbm9kZUFycmF5W2luZGV4XVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIGluZm8udmVjT3BcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIG90aGVyTm9kZSA9IGlmIGluZm8uc2lkZSA9PSAnbGVmdCcgdGhlbiBuZC5zZWNvbmQgZWxzZSBuZC5maXJzdFxuICAgICAgICAgICAgICAgICAgICB2ZWNOb2RlICAgPSBpZiBpbmZvLnNpZGUgPT0gJ2xlZnQnIHRoZW4gbmQuZmlyc3QgZWxzZSBuZC5zZWNvbmRcbiAgICAgICAgICAgICAgICAgICAgb3RoZXJJbmRleCA9IG5vZGVBcnJheS5pbmRleE9mIG90aGVyTm9kZVxuICAgICAgICAgICAgICAgICAgICB2ZWNJbmRleCAgID0gbm9kZUFycmF5LmluZGV4T2YgdmVjTm9kZVxuICAgICAgICAgICAgICAgICAgICBvdGhlckluZm8gID0gbm9kZUluZm9zW290aGVySW5kZXhdXG4gICAgICAgICAgICAgICAgICAgIHZlY0luZm8gICAgPSBub2RlSW5mb3NbdmVjSW5kZXhdXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiBpbmZvLnZlY09wID09ICd0aW1lc09yRG90J1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIG5vdCBvdGhlckluZm9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnZlY09wID0gJ3RpbWVzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udHlwZSAgPSAndmVjJyBcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBvdGhlckluZm8udHlwZSA9PSAnbnVtJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udmVjT3AgPSAndGltZXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mby50eXBlICA9ICd2ZWMnIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBvdGhlckluZm8udHlwZSA9PSAndmVjJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udmVjT3AgPSAnZG90J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udHlwZSAgPSAnbnVtJyBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBlbHNlIGlmIGluZm8ub3BlcmF0b3JcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGZpcnN0SW5kZXggID0gbm9kZUFycmF5LmluZGV4T2YgbmQuZmlyc3RcbiAgICAgICAgICAgICAgICAgICAgc2Vjb25kSW5kZXggPSBub2RlQXJyYXkuaW5kZXhPZiBuZC5zZWNvbmRcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGZpcnN0VHlwZSAgPSBmaXJzdEluZGV4ICA8IDAgYW5kICdudW0nIG9yIG5vZGVJbmZvc1tmaXJzdEluZGV4XS50eXBlXG4gICAgICAgICAgICAgICAgICAgIHNlY29uZFR5cGUgPSBzZWNvbmRJbmRleCA8IDAgYW5kICdudW0nIG9yIG5vZGVJbmZvc1tzZWNvbmRJbmRleF0udHlwZVxuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiBmaXJzdFR5cGUgPT0gJ3ZlYycgPT0gc2Vjb25kVHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBpbmZvLm9wZXJhdG9yID09ICcqJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udmVjT3AgPSAnZG90J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udHlwZSA9ICdudW0nXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGluZm8ub3BlcmF0b3IgPT0gJy0nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mby52ZWNPcCA9ICdtaW51cydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnR5cGUgPSAndmVjJyAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgaW5mby5vcGVyYXRvciA9PSAnKydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnZlY09wID0gJ3BsdXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mby50eXBlID0gJ3ZlYydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBmaXJzdFR5cGUgPT0gJ3ZlYycgYW5kIHNlY29uZFR5cGUgPT0gJ251bSdcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udmVjT3AgPSBpZiBpbmZvLm9wZXJhdG9yID09ICcvJyB0aGVuICd0aW1lcy8nIGVsc2UgJ3RpbWVzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby50eXBlID0gJ3ZlYydcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8uc2lkZSA9ICdsZWZ0J1xuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGZpcnN0VHlwZSA9PSAnbnVtJyBhbmQgc2Vjb25kVHlwZSA9PSAndmVjJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby52ZWNPcCA9ICd0aW1lcydcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udHlwZSA9ICd2ZWMnXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnNpZGUgPSAncmlnaHQnXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgZmlyc3RUeXBlID09ICdudW0nID09IHNlY29uZFR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udHlwZSA9ICdudW0nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZWxzZSBcbiAgICAgICAgICAgICAgICAgICAgaWYgaW5mby52YWx1ZSBhbmQgbm90IGluZm8udHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAgICAgIG5kLmJhc2UgaW5zdGFuY2VvZiBJZGVudGlmaWVyTGl0ZXJhbCB0aGVuIGluZm8udHlwZSA9ICdudW0nXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIG5kLmJhc2UgaW5zdGFuY2VvZiBOdW1iZXJMaXRlcmFsICAgICB0aGVuIGluZm8udHlwZSA9ICdudW0nXG4gICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgaW5mby50eXBlIGluIFsnbnVtJyAndmVjJ11cbiAgICAgICAgICAgICAgICAgICAgICAgIHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGluZm8uYm9keSA9PSAnT3AnXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvZHlJbmRleCA9IG5vZGVBcnJheS5pbmRleE9mIG5kLmJhc2U/LmJvZHk/LmV4cHJlc3Npb25zWzBdXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHR5cGUgPSBub2RlSW5mb3NbYm9keUluZGV4XT8udHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udHlwZSA9IHR5cGVcblxuICAgICAgICAgICAgY29udmVydCA9IChuZCkgLT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpbmRleCA9IG5vZGVBcnJheS5pbmRleE9mIG5kXG4gICAgICAgICAgICAgICAgaW5mbyA9IG5vZGVJbmZvc1tpbmRleF1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBpbmZvPy52ZWNPcFxuICAgICAgICAgICAgICAgICAgICB2biA9IGlmIGluZm8uc2lkZSA9PSAncmlnaHQnIHRoZW4gbmQuc2Vjb25kIGVsc2UgbmQuZmlyc3RcbiAgICAgICAgICAgICAgICAgICAgcG4gPSBpZiBpbmZvLnNpZGUgPT0gJ3JpZ2h0JyB0aGVuIG5kLmZpcnN0IGVsc2UgbmQuc2Vjb25kXG4gICAgICAgICAgICAgICAgICAgIG9pID0gbm9kZUFycmF5LmluZGV4T2YgcG5cbiAgICAgICAgICAgICAgICAgICAgb3AgPSBpbmZvLnZlY09wXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vdCB2bi5iYXNlPy52YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgdm4gPSBjb252ZXJ0IHZuXG4gICAgICAgICAgICAgICAgICAgIGFsID0gW2NvbnZlcnQgcG5dXG4gICAgICAgICAgICAgICAgICAgIGlmIG9wID09ICd0aW1lcy8nXG4gICAgICAgICAgICAgICAgICAgICAgICBhbCA9IFtuZXcgT3AgJy8nIChuZXcgVmFsdWUgbmV3IE51bWJlckxpdGVyYWwgMSksIGFsWzBdXVxuICAgICAgICAgICAgICAgICAgICAgICAgb3AgPSAndGltZXMnXG4gICAgICAgICAgICAgICAgICAgIG5uID0gbmV3IENhbGwgKG5ldyBWYWx1ZSB2biwgW25ldyBBY2Nlc3MgbmV3IFByb3BlcnR5TmFtZSBvcF0pLCBhbFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgaW5mbz8uY2FsbFxuICAgICAgICAgICAgICAgICAgICBpZiBuZC5hcmdzPy5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgIG5kLmFyZ3MgPSBuZC5hcmdzLm1hcCAobmRhKSAtPiBjb252ZXJ0IG5kYVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIG5kLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICBuZC52YWx1ZSA9IGNvbnZlcnQgbmQudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgbmRcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIG5kXG4gICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIGluZm8saW5kZXggaW4gbm9kZUluZm9zXG4gICAgICAgICAgICAgICAgaWYgaW5mby52ZWNPcFxuICAgICAgICAgICAgICAgICAgICBuZCA9IG5vZGVBcnJheVtpbmRleF1cbiAgICAgICAgICAgICAgICAgICAgY24gPSBjb252ZXJ0IG5kXG4gICAgICAgICAgICAgICAgICAgIG5vZGUudHJhdmVyc2VDaGlsZHJlbiB0cnVlLCAodG4pIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiB0bi5maXJzdCA9PSBuZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRuLmZpcnN0ID0gY25cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgdG4uc2Vjb25kID09IG5kXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG4uc2Vjb25kID0gY25cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgdG4uZXhwcmVzc2lvbnM/IGFuZCBuZCBpbiB0bi5leHByZXNzaW9uc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRuLmV4cHJlc3Npb25zW3RuLmV4cHJlc3Npb25zLmluZGV4T2YgbmRdID0gY25cbiAgICAgICAgICAgICAgICBlbHNlIGlmIGluZm8uY2FsbFxuICAgICAgICAgICAgICAgICAgICBjb252ZXJ0IG5vZGVBcnJheVtpbmRleF1cbiAgICAgICAgICAgIFxuICAgICAgICBkZWRlbnQ6IHRydWVcbiAgICAgICAgcmVkdWNlOiB0cnVlXG4gICAgICAgIGJvZHk6ICAgdHJ1ZVxuICAgICAgICBibG9jazogIHRydWVcbiwgICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAwMCAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgXG5cbiAgICBkb2M6IOKWuGRvYyAn4pa4ZG9jJ1xuICAgICAgICBcbiAgICAgICAgVGhpcyBpcyBhIHNsaWdodGx5IHNwZWNpYWwgbWFjcm8sIGJlY2F1c2UgaXQncyBmaXJzdCBwYXNzIGlzIGhhcmRjb2RlZCBpbiB0aGUgdG9rZW5pemVyLlxuICAgICAgICBUaGUgYm9keSBvZiB0aGUgbWFjcm8gaXMgd3JhcHBlZCBpbiBhIHNraW5ueSB0cmlwbGUgc3RyaW5nIGJlZm9yZSBmdXJ0aGVyIHRva2VuaXphdGlvbi5cbiAgICAgICAgSXQgY2FuIGNvbnRhaW4gYW55dGhpbmcgZXhjZXB0IFxcJ1xcJ1xcJy5cbiAgICAgICAgXG4gICAgICAgIEluIG5vcm1hbCBvcGVyYXRpb24sIGl0IGlzIHJlZHVjZWQgdG8gdGhlIGVtcHR5IHN0cmluZy4gXG4gICAgICAgIEJ1dCBpZiAqKmtvZmZlZSoqIGlzIGNhbGxlZCB3aXRoIHRoZSBgLS1kb2NgIGFyZ3VtZW50LCBsb2dzIHdpbGwgYmUgaW5zZXJ0ZWQgaW5zdGVhZC5cbiAgICAgICAgXG4gICAgICAgIGBgYGNvZmZlZXNjcmlwdFxuICAgICAgICDilrhkb2MgJ3RpdGxlJ1xuICAgICAgICAgICAgbXkgZG9jdW1lbnRhdGlvbiAuLi5cbiAgICAgICAgbG9nICdzb21lIGNvZGUnXG4gICAgICAgIOKWuGRvY1xuICAgICAgICAgICAgd2UgYXJlIGRvbmUuXG4gICAgICAgIGBgYFxuICAgICAgICBcbiAgICAgICAgYGtvZmZlZSAtLWRvYyBmaWxlYCB3aWxsIG91dHB1dFxuICAgICAgICBcbiAgICAgICAgYGBgbWFya2Rvd25cbiAgICAgICAgIyMgdGl0bGVcbiAgICAgICAgbXkgZG9jdW1lbnRhdGlvbiAuLi5cbiAgICAgICAgc29tZSBjb2RlXG4gICAgICAgIHdlIGFyZSBkb25lLlxuICAgICAgICBgYGBcbiAgICAgICAgXG4gICAgICAgIGJ1dCBga29mZmVlIGZpbGVgIHdpbGwgb25seSBwcmludCBgc29tZSBjb2RlYFxuICAgICAgICBcbiAgICBrZXk6ICAn4pa4ZG9jJ1xuICAgIGRlc2M6ICfilrhkb2MgW2hlYWRlcl0gLi4uJ1xuICAgIG1ldGE6IChhcmdzOixub2RlOixvcHRzOikgLT5cbiAgICAgICAgaGVhZGVyID0gYXJnc1swXSBhbmQgXCInIyMgI3thcmdzWzBdfVxcXFxuJytcIiBvciBcIicnK1wiXG4gICAgICAgIGJlZm9yZTogb3B0cy5kb2MgYW5kIFwiI3ttZXRhTG9nKG9wdHMpfSgje2hlYWRlcn1cIlxuICAgICAgICBhZnRlcjogIFwiKVwiXG4gICAgICAgIHNraXA6ICAgbm90IG9wdHMuZG9jIGFuZCB3aXRoOlwiJydcIlxuICAgICAgICByZWR1Y2U6IHRydWVcbiAgICAgICAgYm9keTogICB0cnVlXG4gICAgICAgIGJsb2NrOiAgZmFsc2VcbiwgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgXG4gICAga2V5OiAgJ+KWuHByb2ZpbGUnICAgXG4gICAgZGVzYzogJ+KWuHByb2ZpbGUgW2lkXSAuLi4nXG4gICAgbWV0YTogKGFyZ3M6LG5vZGU6LG9wdHM6KSAtPiBcbiAgICAgICAgXG4gICAgICAgIGlkID0gXCIje25vZGUuY29uZGl0aW9uLmxvY2F0aW9uRGF0YS5maXJzdF9saW5lKzF9XyN7bm9kZS5jb25kaXRpb24ubG9jYXRpb25EYXRhLmZpcnN0X2NvbHVtbn1cIlxuICAgICAgICBuYW1lID0gYXJnc1swXSA/IGlkXG4gICAgICAgIGNvZGU6ICAgXCJrb2ZmZWVfI3tpZH0gPSBwcm9jZXNzLmhydGltZS5iaWdpbnQoKVwiXG4gICAgICAgIGFmdGVyOiAgXCIje21ldGFMb2cob3B0cyl9KCcje25hbWV9JywgKGZ1bmN0aW9uKGIpeyBsZXQgZj0xMDAwbjsgZm9yIChsZXQgdSBvZiBbJ25zJywnzrxzJywnbXMnLCdzJ10pIHsgaWYgKHU9PSdzJyB8fCBiPGYpIHsgcmV0dXJuICcnKygxMDAwbipiL2YpKycgJyt1OyB9IGYqPTEwMDBuOyB9fSkocHJvY2Vzcy5ocnRpbWUuYmlnaW50KCkta29mZmVlXyN7aWR9KSk7XCJcbiAgICAgICAgcmVkdWNlOiBmYWxzZVxuICAgICAgICBib2R5OiAgIHRydWVcbixcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAga2V5OiAgJ+KWuGF2ZXJhZ2UnICAgXG4gICAgZGVzYzogJ+KWuGF2ZXJhZ2UgbnVtIC4uLidcbiAgICBtZXRhOiAoYXJnczosbm9kZTosb3B0czopIC0+IFxuICAgICAgICBcbiAgICAgICAgaWQgID0gXCIje25vZGUuY29uZGl0aW9uLmxvY2F0aW9uRGF0YS5maXJzdF9saW5lKzF9XyN7bm9kZS5jb25kaXRpb24ubG9jYXRpb25EYXRhLmZpcnN0X2NvbHVtbn1cIlxuICAgICAgICBudW0gPSBhcmdzWzBdID8gMTAwXG4gICAgICAgIGJlZm9yZTogIFwiXCJcIlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBrb2ZmZWVfI3tpZH0gPSAwbjtcbiAgICAgICAgICAgIGZvcihpID0gMDsgaSA8ICN7bnVtfTsgaSsrKSBcbiAgICAgICAgICAgIHsgXG4gICAgICAgICAgICAgICAga29mZmVlXyN7aWR9X3N0YXJ0ID0gcHJvY2Vzcy5ocnRpbWUuYmlnaW50KCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICBhZnRlcjogXCJcIlwiXG4gICAgICAgICAgICBrb2ZmZWVfI3tpZH0gKz0gcHJvY2Vzcy5ocnRpbWUuYmlnaW50KCkgLSBrb2ZmZWVfI3tpZH1fc3RhcnQ7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAga29mZmVlXyN7aWR9IC89ICN7bnVtfW47XG4gICAgICAgICAgICAje21ldGFMb2cob3B0cyl9KCcje2lkfScsIChmdW5jdGlvbihiKXsgbGV0IGY9MTAwMG47IGZvciAobGV0IHUgb2YgWyducycsJ868cycsJ21zJywncyddKSB7IGlmICh1PT0ncycgfHwgYjxmKSB7IHJldHVybiAnJysoMTAwMG4qYi9mKSsnICcrdTsgfSBmKj0xMDAwbjsgfX0pKGtvZmZlZV8je2lkfSkpOyBcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICByZWR1Y2U6IHRydWVcbiAgICAgICAgYm9keTogICB0cnVlXG4sXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIGtleTogICfilrhzdGFydCcgICBcbiAgICBkZXNjOiAn4pa4c3RhcnQgaWQgLi4uJ1xuICAgIGluZm86XG4gICAgICAgIHRoZW46IHRydWVcbiAgICAgICAgYXJnczogMVxuICAgIG1ldGE6IChhcmdzOikgLT4gXG4gICAgICAgIGlkID0gYXJnc1swXSA/ICdzdGFydF9lbmQnXG4gICAgICAgIGJlZm9yZTogXCJrb2ZmZWVfI3tpZH0gPSBwcm9jZXNzLmhydGltZS5iaWdpbnQoKVwiXG4gICAgICAgIHJlZHVjZTogdHJ1ZVxuICAgICAgICBib2R5OiAgIGZhbHNlXG4sXG4gICAga2V5OiAgJ+KWuGVuZCcgICAgIFxuICAgIGRlc2M6ICfilrhlbmQgaWQgLi4uJ1xuICAgIGluZm86XG4gICAgICAgIHRoZW46IHRydWVcbiAgICAgICAgYXJnczogMVxuICAgIG1ldGE6IChhcmdzOixvcHRzOikgLT4gXG4gICAgICAgIGlkID0gYXJnc1swXSA/ICdzdGFydF9lbmQnXG4gICAgICAgIGJlZm9yZTogXCIje21ldGFMb2cob3B0cyl9KCcje2lkfScsIChmdW5jdGlvbihiKXsgbGV0IGY9MTAwMG47IGZvciAobGV0IHUgb2YgWyducycsJ868cycsJ21zJywncyddKSB7IGlmICh1PT0ncycgfHwgYjxmKSB7IHJldHVybiAnJysoMTAwMG4qYi9mKSsnICcrdTsgfSBmKj0xMDAwbjsgfX0pKHByb2Nlc3MuaHJ0aW1lLmJpZ2ludCgpLWtvZmZlZV8je2lkfSkpO1wiXG4gICAgICAgIHJlZHVjZTogdHJ1ZVxuICAgICAgICBib2R5OiAgIGZhbHNlXG4sICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgXG4gICAgXG4gICAga2V5OiAgJ+KWuGRiZycgICAgXG4gICAgZGVzYzogJ+KWuGRiZyBbbXNnXSAuLi4nXG4gICAgaW5mbzpcbiAgICAgICAgdGhlbjogdHJ1ZSAjIHNob3VsZCBub3QgYmUgdXNlZCB3aXRoIGEgYmxvY2tcbiAgICAgICAgYXJnczogMVxuICAgIG1ldGE6IChvcHRzOixhcmdzOixub2RlOikgLT5cbiAgICAgICAgYmVmb3JlOiBsb2dTb3VyY2Uge29wdHMsIGFyZ3MsIG5vZGV9XG4gICAgICAgIGFmdGVyOiAgJyknXG4gICAgICAgIHJlZHVjZTogdHJ1ZVxuICAgICAgICBib2R5OiAgIHRydWVcbiAgICAgICAgYmxvY2s6ICBmYWxzZVxuLCAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIGtleTogICfilrhhc3NlcnQnICAgIFxuICAgIGRlc2M6ICfilrhhc3NlcnQgW21zZ10gLi4uJ1xuICAgIG1ldGE6IChvcHRzOixhcmdzOixub2RlOikgLT5cbiAgICAgICAgXG4gICAgICAgIG5vZGVzID0gcmVxdWlyZSAnLi9ub2RlcydcbiAgICAgICAgeyBCbG9jaywgZXh0ZW5kIH0gPSBub2Rlc1xuICAgICAgICBpZiBub2RlLmJvZHkgaW5zdGFuY2VvZiBCbG9ja1xuICAgICAgICAgICAgYm9keSA9IG5vZGUuYm9keS5leHByZXNzaW9uc1swXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBib2R5ID0gbm9kZS5ib2R5XG4gICAgICAgICAgICBcbiAgICAgICAgZnJhZyA9IGJvZHkuY29tcGlsZVRvRnJhZ21lbnRzIG9wdHNcbiAgICAgICAgdGV4dCA9IG5vZGUuZnJhZ21lbnRzVG9UZXh0IGZyYWdcbiAgICAgICAgYXJncyA9IFsnYXNzZXJ0aW9uIGZhaWx1cmUhJ10gaWYgbm90IGFyZ3MubGVuZ3RoXG4gICAgICAgIGJlZm9yZTogbG9nU291cmNlIHtvcHRzLCBhcmdzLCBub2RlLCBjbG9zZTp0cnVlfVxuICAgICAgICBhZnRlcjogICdwcm9jZXNzLmV4aXQoNjY2KTsnXG4gICAgICAgIHRoZW46ICAgdHJ1ZSAjIHNob3VsZCBub3QgYmUgdXNlZCB3aXRoIGEgYmxvY2tcbiAgICAgICAgZXZhbDogICBmYWxzZVxuICAgICAgICByZWR1Y2U6IGZhbHNlXG4gICAgICAgIGNvZGU6ICAgXCIhKCN7dGV4dH0pXCJcbiwgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgIFxuICAgIGtleTogICfilrh0ZXN0J1xuICAgIGRlc2M6ICfilrh0ZXN0IFtpZF0gLi4uJ1xuICAgIG1ldGE6IChvcHRzOixhcmdzOixub2RlOikgLT5cbiAgICAgICAgYmVmb3JlICA9IGxvZ1NvdXJjZSB7b3B0cywgYXJncywgbm9kZSwgY2xvc2U6dHJ1ZX1cbiAgICAgICAgYmVmb3JlICs9ICdcXG4gICAgdHJ5IHtcXG4nXG4gICAgICAgIGRlZGVudDogdHJ1ZVxuICAgICAgICBiZWZvcmU6IG9wdHMudGVzdCBhbmQgYmVmb3JlXG4gICAgICAgIGFmdGVyOiAgb3B0cy50ZXN0IGFuZCBcIn0gY2F0Y2goZXJyKSB7ICN7bWV0YUxvZyhvcHRzKX0oZXJyLm1lc3NhZ2UpOyB9XFxuXCJcbiAgICAgICAgc2tpcDogICBub3Qgb3B0cy50ZXN0XG4gICAgICAgIHJlZHVjZTogdHJ1ZVxuICAgICAgICBib2R5OiAgIHRydWVcbiwgICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAga2V5OiAn4pa4cmFuZCcgICAgXG4gICAgbWV0YTogKGFyZ3M6KSAtPiBcbiAgICAgICAgY29kZTogICBcIk1hdGgucmFuZG9tKCkgPCAje2FyZ3M/WzBdID8gMC41fVwiIFxuICAgICAgICByZWR1Y2U6IGZhbHNlIFxuICAgICAgICBib2R5OiAgIHRydWUgICBcbiAgICBcbiAgICAjIGtleTogJ3Rva2VuJyAncGFyc2UnICdjb2RlJ1xuXVxuXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuXG5UQUIgPSAnICAgICdcblxuY29tcGlsZU1ldGFJZiA9IChub2RlOixvcHRzOikgLT5cblxuICAgIG5vZGVzID0gcmVxdWlyZSAnLi9ub2RlcydcbiAgICBcbiAgICB7IEJsb2NrLCBBc3NpZ24sIFZhbHVlLCBMaXRlcmFsIH0gPSBub2Rlc1xuICAgIHsgZXh0ZW5kLCBtZXJnZSB9ID0gaGVscGVyc1xuICAgICAgICBcbiAgICBpbmZvID0gcmVkdWNlOnRydWUsIGV2YWw6dHJ1ZVxuICAgIFxuICAgIGlmIG5vZGUuY29uZGl0aW9uLmJhc2U/LnZhbHVlPy5zdGFydHNXaXRoICfilrgnXG4gICAgICAgIFxuICAgICAgICBtZXRhS2V5ID0gbm9kZS5jb25kaXRpb24uYmFzZS52YWx1ZVxuICAgICAgICBpZiB0eXBlb2Ygb3B0cy5tZXRhW21ldGFLZXldID09ICdmdW5jdGlvbidcbiAgICAgICAgICAgIGluZm8gPSBvcHRzLm1ldGFbbWV0YUtleV0ge29wdHMsIG5vZGUsIGFyZ3M6W119XG4gICAgICAgICAgICBcbiAgICBpZiBub2RlLmNvbmRpdGlvbi52YXJpYWJsZT8uYmFzZT8udmFsdWU/LnN0YXJ0c1dpdGggJ+KWuCdcbiAgICAgICAgXG4gICAgICAgIG1ldGFLZXkgPSBub2RlLmNvbmRpdGlvbi52YXJpYWJsZS5iYXNlLnZhbHVlXG4gICAgICAgIGlmIHR5cGVvZiBvcHRzLm1ldGFbbWV0YUtleV0gPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgYXJncyA9IG5vZGUuY29uZGl0aW9uLmFyZ3MubWFwIChhKSAtPiBcbiAgICAgICAgICAgICAgICBhLmJhc2U/LnZhbHVlXG4gICAgICAgICAgICBhcmdzID0gYXJncy5tYXAgKGEpIC0+IGlmIGFbMF0gaW4gWydcIicsIFwiJ1wiXSB0aGVuIGFbMS4uLTJdIGVsc2UgYVxuICAgICAgICAgICAgaW5mbyA9IG9wdHMubWV0YVttZXRhS2V5XSB7b3B0cywgbm9kZSwgYXJnc31cbiAgICAgICAgXG4gICAgaWYgaW5mby5za2lwIFxuICAgICAgICBpZiBpbmZvLnNraXAud2l0aD9cbiAgICAgICAgICAgIHJldHVybiBub2RlLm1ha2VDb2RlIGluZm8uc2tpcC53aXRoXG4gICAgICAgIHJldHVybiBbXVxuICAgIFxuICAgIGlmIGluZm8uZXZhbFxuICAgICAgICBcbiAgICAgICAgY29uZCA9IGluZm8uY29kZSA/IG5vZGUuZnJhZ21lbnRzVG9UZXh0IG5vZGUuY29uZGl0aW9uLmNvbXBpbGVUb0ZyYWdtZW50cyBvcHRzLCAyICNMRVZFTF9QQVJFTlxuICAgICAgICB0cnlcbiAgICAgICAgICAgIG9zID0gcmVxdWlyZSAnb3MnXG4gICAgICAgICAgICBmcyA9IHJlcXVpcmUgJ2ZzJ1xuICAgICAgICAgICAgaW5mby5ib2R5ID0hISBldmFsIGNvbmRcbiAgICAgICAgICAgIGlmIGluZm8uZXZhbCBhbmQgaW5mby5yZWR1Y2UgYW5kIG5vdCBpbmZvLmJvZHkgYW5kIG5vdCBub2RlLmVsc2VCb2R5XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdXG4gICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgZXJyb3IgZXJyXG4gICAgICAgIFxuICAgIGZyYWcgPSBbXVxuICAgIFxuICAgIGlmIGluZm8ucmVkdWNlID09IGZhbHNlXG4gICAgICAgIGZyYWcgPSBmcmFnLmNvbmNhdCBub2RlLm1ha2VDb2RlKFwiaWYgKFwiKSwgbm9kZS5tYWtlQ29kZShpbmZvLmNvZGUpLCBub2RlLm1ha2VDb2RlKFwiKSB7XFxuXCIpXG4gICAgICAgIFxuICAgICAgICBpbmRlbnQgPSBvcHRzLmluZGVudCArIFRBQlxuICAgICAgICBib2R5T3B0ID0gbWVyZ2Ugb3B0cywge2luZGVudH1cbiAgICBlbHNlXG4gICAgICAgIGluZGVudCA9IG9wdHMuaW5kZW50XG4gICAgICAgIGJvZHlPcHQgPSBvcHRzXG5cbiAgICBpZiBpbmZvLmJlZm9yZVxuICAgICAgICBmcmFnLnB1c2ggbm9kZS5tYWtlQ29kZSAoaW5mby5ibG9jayE9ZmFsc2UgYW5kIGluZm8uZGVkZW50IT10cnVlIGFuZCBpbmRlbnQgb3IgJycpICsgaW5mby5iZWZvcmVcbiAgICAgICAgXG4gICAgaWYgaW5mby5ib2R5XG4gICAgICAgIGlmIGluZm8uYmxvY2sgIT0gZmFsc2VcbiAgICAgICAgICAgIGJvZHkgPSBub2RlLmVuc3VyZUJsb2NrIG5vZGUuYm9keVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBub2RlLmJvZHkgaW5zdGFuY2VvZiBCbG9ja1xuICAgICAgICAgICAgICAgIGJvZHkgPSBub2RlLmJvZHkuZXhwcmVzc2lvbnNbMF1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBib2R5ID0gbm9kZS5ib2R5XG4gICAgICAgIGlmIGJvZHlcbiAgICAgICAgICAgIGZyYWcgPSBmcmFnLmNvbmNhdCBib2R5LmNvbXBpbGVUb0ZyYWdtZW50cyBib2R5T3B0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGZyYWcucHVzaCBub2RlLm1ha2VDb2RlIFwiJydcIiAjIGlmIGluZm8uYmxvY2sgPT0gZmFsc2UgPz9cbiAgICAgICAgXG4gICAgaWYgaW5mby5hZnRlclxuICAgICAgICBmcmFnLnB1c2ggbm9kZS5tYWtlQ29kZSAoKGluZm8uYmxvY2sgIT0gZmFsc2UpIGFuZCAoJ1xcbicgKyBpbmRlbnQpIG9yICcnKSArIGluZm8uYWZ0ZXJcblxuICAgIGlmIG5vdCBpbmZvLnJlZHVjZVxuICAgICAgICBmcmFnLnB1c2ggbm9kZS5tYWtlQ29kZShcIlxcbiN7bm9kZS50YWJ9fVwiKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICBpZiBub2RlLmVsc2VCb2R5IGFuZCAoaW5mby5yZWR1Y2UgPT0gZmFsc2Ugb3IgaW5mby5ib2R5ID09IGZhbHNlKVxuICAgICAgICBmcmFnLnB1c2ggbm9kZS5tYWtlQ29kZSAnIGVsc2UgJyBpZiBub3QgaW5mby5yZWR1Y2VcbiAgICAgICAgaWYgbm9kZS5pc0NoYWluXG4gICAgICAgICAgICBmcmFnID0gZnJhZy5jb25jYXQgbm9kZS5lbHNlQm9keS51bndyYXAoKS5jb21waWxlVG9GcmFnbWVudHMgYm9keU9wdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBmcmFnID0gZnJhZy5jb25jYXQgbm9kZS5lbHNlQm9keS5jb21waWxlVG9GcmFnbWVudHMgYm9keU9wdFxuICAgICAgICBcbiAgICByZXR1cm4gZnJhZ1xuICAgIFxuIyAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4jIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgICAgMDAwMDAwMCAgIFxuIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcblxubWV0YUxvZyA9IChvcHRzKSAtPiBvcHRzLm1ldGFsb2cgPyAnY29uc29sZS5sb2cnXG5cbmxvZ1NvdXJjZSA9IChvcHRzOixhcmdzOixub2RlOixjbG9zZTopIC0+XG4gICAgXG4gICAgY29sb3JldHRlID0gcmVxdWlyZSAnY29sb3JldHRlJ1xuICAgIHsgeWVsbG93LCBibHVlLCB5ZWxsb3dCcmlnaHQsIGJsdWVCcmlnaHQsIHdoaXRlQnJpZ2h0LCBkaW0sIGJvbGQsIGdyYXkgfSA9IGNvbG9yZXR0ZS5jcmVhdGVDb2xvcnMgdXNlQ29sb3I6IG9wdHMuZmVhdHVyZS5jb2xvclxuICAgIFxuICAgIHNvdXJjZSA9IG9wdHMuc291cmNlID8gb3B0cy5maWxlbmFtZSA/ICcnXG4gICAgZXh0ID0gJydcbiAgICBpZiBzb3VyY2VcbiAgICAgICAgW3NvdXJjZSwgZXh0Li4uXSA9IHBhdGguYmFzZW5hbWUoc291cmNlKS5zcGxpdCAnLidcbiAgICAgICAgc291cmNlICA9IHllbGxvdyBbeWVsbG93QnJpZ2h0KHNvdXJjZSksIGRpbSBleHQuam9pbicuJ10uam9pbiBkaW0gJy4nXG4gICAgYmVmb3JlICA9IFwiI3ttZXRhTG9nKG9wdHMpfSgnI3tzb3VyY2V9I3tkaW0gYmx1ZSAnOid9I3tibHVlQnJpZ2h0IFwiI3tub2RlLmNvbmRpdGlvbi5sb2NhdGlvbkRhdGEuZmlyc3RfbGluZSsxfVwifSdcIlxuICAgIGJlZm9yZSArPSBcIiwgJyN7Ym9sZCB3aGl0ZUJyaWdodCBhcmdzWzBdfSdcIiBpZiBhcmdzWzBdIFxuICAgIGlmIChjbG9zZSlcbiAgICAgICAgYmVmb3JlICs9ICcpO1xcbidcbiAgICBlbHNlXG4gICAgICAgIGJlZm9yZSArPSBcIiwgXCJcblxuICAgIGJlZm9yZVxuICAgICAgICBcbiMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIFxuIyAwMDAgIDAwMDAgIDAwMCAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4jIDAwMCAgMDAwIDAgMDAwICAgICAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiMgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuIyAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgXG5cbmluamVjdE1ldGEgPSAob3B0aW9ucykgLT4gIyBtYWtlIHN1cmUgdGhhdCBvcHRpb25zIGhhcyBhIG1ldGEgc2V0XG4gICAgXG4gICAgb3B0aW9ucyA/PSB7fVxuICAgIFxuICAgIHsgZXh0ZW5kIH0gPSBoZWxwZXJzXG4gICAgXG4gICAgZGVmYXVsdE1ldGEgPSB7fVxuICAgIE1FVEEubWFwIChtKSAtPiBkZWZhdWx0TWV0YVttLmtleV0gPSBtLm1ldGE7IG0ubWV0YS5rZXkgPSBtLmtleTsgbS5tZXRhLmluZm8gPSBtLmluZm9cbiAgICBcbiAgICBtZXRhICAgID0gZXh0ZW5kIGRlZmF1bHRNZXRhLCBvcHRpb25zLm1ldGEgPyB7fVxuICAgIG9wdGlvbnMgPSBleHRlbmQgeyBtZXRhOiBtZXRhIH0sIG9wdGlvbnNcbiAgICBvcHRpb25zXG5cbmxvZ01ldGFzID0gLT5cbiAgICBcbiAgICBsb2cgXCIje2dyYXkgJ01ldGFzOid9XFxuXFxuI3sgTUVUQS5tYXAoKGYpIC0+IFwiICAgICN7aGVscGVycy5wYWQgZi5rZXl9I3tncmF5IGYuZGVzYyA/IFwiI3tmLmtleX0gLi4uXCJ9XCIpLmpvaW4oJ1xcbicpIH1cIlxuICAgIGxvZyBcIiAgICDilrhpZiAgICAgICAgICAgICAgICAgICAgICN7Z3JheSAn4pa4aWYgY29uZCAuLi4gW1vilrhlbGlmIGNvbmQgLi4uXSDilrhlbHNlIC4uLl0nfVxcblwiXG4gICAgXG5tb2R1bGUuZXhwb3J0cyA9IHsgTUVUQSwgaW5qZWN0TWV0YSwgbG9nTWV0YXMsIGNvbXBpbGVNZXRhSWYgfVxuIl19
//# sourceURL=../coffee/meta.coffee