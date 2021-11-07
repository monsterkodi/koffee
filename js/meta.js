// koffee 1.16.0

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
            var Access, Block, Call, IdentifierLiteral, NumberLiteral, Op, PropertyName, Value, args, bodyIndex, cn, config, convert, exp, firstIndex, firstType, identifiers, index, info, j, k, kstr, l, len, len1, len2, nd, node, nodeArray, nodeIndex, nodeInfos, nodes, noon, o, opts, otherIndex, otherInfo, otherNode, preParse, ref, ref1, ref10, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, resolve, results, secondIndex, secondType, type, vecIndex, vecInfo, vecNode;
            args = (ref = arg1.args) != null ? ref : null, node = (ref1 = arg1.node) != null ? ref1 : null, opts = (ref2 = arg1.opts) != null ? ref2 : null;
            config = ((ref3 = args[0]) != null ? ref3.dot : void 0) != null ? args[0] : {
                times: 'times',
                dot: 'dot',
                plus: 'plus',
                minus: 'minus'
            };
            nodes = require('./nodes');
            Op = nodes.Op, Value = nodes.Value, Call = nodes.Call, Access = nodes.Access, Block = nodes.Block, NumberLiteral = nodes.NumberLiteral, IdentifierLiteral = nodes.IdentifierLiteral, PropertyName = nodes.PropertyName;
            noon = require('noon');
            kstr = require('kstr');
            identifiers = node.condition.args.map(function(arg) {
                return arg.base.value;
            });
            ref4 = node.body.expressions;
            for (j = 0, len = ref4.length; j < len; j++) {
                exp = ref4[j];
                nodeInfos = [];
                nodeIndex = -1;
                preParse = function(node) {
                    var firstIsValue, firstIsVec, ref10, ref5, ref6, ref7, ref8, ref9, secondIsValue, secondIsVec;
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
                    } else {
                        if (node.constructor.name === 'Value') {
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
                        }
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
                            }
                            if (nd.base instanceof NumberLiteral) {
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
                resolve = function(nodeIndex) {
                    var i1, i2, oi, op, pn, ref11, ref12, ref13, ref14, vn;
                    info = nodeInfos[nodeIndex];
                    nd = nodeArray[nodeIndex];
                    if (!info) {

                    } else if (info.vecOp) {
                        vn = info.side === 'right' ? nd.second : nd.first;
                        pn = info.side === 'right' ? nd.first : nd.second;
                        oi = nodeArray.indexOf(pn);
                        op = info.vecOp;
                        return ((ref11 = (ref12 = vn.base) != null ? ref12.value : void 0) != null ? ref11 : resolve(nodeArray.indexOf(vn))) + "." + op + "(" + (resolve(oi)) + ")";
                    } else if (info.operator) {
                        i1 = nodeArray.indexOf(nd.first);
                        i2 = nodeArray.indexOf(nd.second);
                        op = info.operator;
                        return (resolve(i1)) + " " + op + " " + (resolve(i2));
                    } else {
                        return (ref13 = nd != null ? (ref14 = nd.base) != null ? ref14.value : void 0 : void 0) != null ? ref13 : resolve(nodeArray.indexOf(nd.base.body.expressions[0]));
                    }
                };
                console.log(resolve(0));
                console.log(nodeInfos);
                convert = function(nd) {
                    var al, nn, oi, op, pn, ref11, vn;
                    index = nodeArray.indexOf(nd);
                    info = nodeInfos[index];
                    console.log(index, info);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YS5qcyIsInNvdXJjZVJvb3QiOiIuLi9jb2ZmZWUiLCJzb3VyY2VzIjpbIm1ldGEuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGlGQUFBO0lBQUE7OztBQVFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7QUFFUCxPQUFBLEdBQVUsT0FBQSxDQUFRLFdBQVI7O0FBQ1YsT0FBTyxDQUFDLE1BQVIsQ0FBQTs7QUFFQSxJQUFBLEdBQU87SUFRSDtRQUFBLEdBQUEsRUFBTSxNQUFOO1FBQ0EsSUFBQSxFQUFNLGNBRE47UUFFQSxJQUFBLEVBQU0sU0FBQyxJQUFEO0FBRUYsZ0JBQUE7WUFGRyx5Q0FBRyxNQUFHLDJDQUFHLE1BQUcsMkNBQUc7WUFFbEIsTUFBQSxHQUFZLHNEQUFILEdBQXNCLElBQUssQ0FBQSxDQUFBLENBQTNCLEdBQW1DO2dCQUFBLEtBQUEsRUFBTSxPQUFOO2dCQUFjLEdBQUEsRUFBSSxLQUFsQjtnQkFBd0IsSUFBQSxFQUFLLE1BQTdCO2dCQUFvQyxLQUFBLEVBQU0sT0FBMUM7O1lBRTVDLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUjtZQUNKLGFBQUosRUFBUSxtQkFBUixFQUFlLGlCQUFmLEVBQXFCLHFCQUFyQixFQUE2QixtQkFBN0IsRUFDSSxtQ0FESixFQUNtQiwyQ0FEbkIsRUFFSTtZQUVKLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjtZQUNQLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjtZQUdQLFdBQUEsR0FBYyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFwQixDQUF3QixTQUFDLEdBQUQ7dUJBQVMsR0FBRyxDQUFDLElBQUksQ0FBQztZQUFsQixDQUF4QjtBQU1kO0FBQUEsaUJBQUEsc0NBQUE7O2dCQUVJLFNBQUEsR0FBWTtnQkFDWixTQUFBLEdBQVksQ0FBQztnQkFFYixRQUFBLEdBQVcsU0FBQyxJQUFEO0FBRVAsd0JBQUE7b0JBQUEsSUFBRyxJQUFBLFlB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QUEsR0FBVyxTQUFBO0lBRVIsT0FBQSxDQUFDLEdBQUQsQ0FBTyxDQUFDLElBQUEsQ0FBSyxRQUFMLENBQUQsQ0FBQSxHQUFlLE1BQWYsR0FBb0IsQ0FBRSxJQUFJLENBQUMsR0FBTCxDQUFTLFNBQUMsQ0FBRDtBQUFPLFlBQUE7ZUFBQSxNQUFBLEdBQU0sQ0FBQyxPQUFPLENBQUMsR0FBUixDQUFZLENBQUMsQ0FBQyxHQUFkLENBQUQsQ0FBTixHQUEwQixDQUFDLElBQUEsZ0NBQWlCLENBQUMsQ0FBQyxHQUFILEdBQU8sTUFBdkIsQ0FBRDtJQUFqQyxDQUFULENBQTBFLENBQUMsSUFBM0UsQ0FBZ0YsSUFBaEYsQ0FBRixDQUEzQjtXQUFxSCxPQUFBLENBQ3BILEdBRG9ILENBQ2hILDhCQUFBLEdBQThCLENBQUMsSUFBQSxDQUFLLDJDQUFMLENBQUQsQ0FBOUIsR0FBZ0YsSUFEZ0M7QUFGN0c7O0FBS1gsTUFBTSxDQUFDLE9BQVAsR0FBaUI7SUFBRSxNQUFBLElBQUY7SUFBUSxZQUFBLFVBQVI7SUFBb0IsVUFBQSxRQUFwQjtJQUE4QixlQUFBLGFBQTlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMCAgICAgMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgXG4wMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgXG4wMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgXG4wMDAgMCAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgXG4wMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgXG4jIyNcblxucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5cbmhlbHBlcnMgPSByZXF1aXJlICcuL2hlbHBlcnMnXG5oZWxwZXJzLmNvbG9ycygpXG5cbk1FVEEgPSBbXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjICAwMDAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjICAgICAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICBcbiAgICBrZXk6ICAn4pa4dmVjJ1xuICAgIGRlc2M6ICfilrh2ZWMoYSwgLi4uKSdcbiAgICBtZXRhOiAoYXJnczosbm9kZTosb3B0czopIC0+XG4gICAgICAgIFxuICAgICAgICBjb25maWcgPSBpZiBhcmdzWzBdPy5kb3Q/IHRoZW4gYXJnc1swXSBlbHNlIHRpbWVzOid0aW1lcycgZG90Oidkb3QnIHBsdXM6J3BsdXMnIG1pbnVzOidtaW51cydcblxuICAgICAgICBub2RlcyA9IHJlcXVpcmUgJy4vbm9kZXMnXG4gICAgICAgIHsgICBPcCwgVmFsdWUsIENhbGwsIEFjY2VzcywgQmxvY2ssIFxuICAgICAgICAgICAgTnVtYmVyTGl0ZXJhbCwgSWRlbnRpZmllckxpdGVyYWwsIFxuICAgICAgICAgICAgUHJvcGVydHlOYW1lIH0gPSBub2Rlc1xuICAgICAgICBcbiAgICAgICAgbm9vbiA9IHJlcXVpcmUgJ25vb24nXG4gICAgICAgIGtzdHIgPSByZXF1aXJlICdrc3RyJ1xuICAgICAgICAjIGxvZyAn4pa4dmVjIG5vZGUnIG5vZGUsIG5vb24uc3RyaW5naWZ5IG5vZGVcbiAgICAgICAgXG4gICAgICAgIGlkZW50aWZpZXJzID0gbm9kZS5jb25kaXRpb24uYXJncy5tYXAgKGFyZykgLT4gYXJnLmJhc2UudmFsdWVcblxuICAgICAgICAjIGxvZyBpZGVudGlmaWVyc1xuICAgICAgICBcbiAgICAgICAgIyBsb2cgJ+KWuHZlYyBub2RlLmJvZHkuZXhwcmVzc2lvbnMnIG5vZGUuYm9keS5leHByZXNzaW9ucyAjLCBub29uLnN0cmluZ2lmeSBleHBzXG4gICAgICAgIFxuICAgICAgICBmb3IgZXhwIGluIG5vZGUuYm9keS5leHByZXNzaW9uc1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBub2RlSW5mb3MgPSBbXVxuICAgICAgICAgICAgbm9kZUluZGV4ID0gLTFcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcHJlUGFyc2UgPSAobm9kZSkgLT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBub2RlIGluc3RhbmNlb2YgT3BcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICMgbG9nICfilrh2ZWMgY2hpbGQnIG5vZGVcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBmaXJzdElzVmFsdWUgID0gbm9kZS5maXJzdCAgaW5zdGFuY2VvZiBWYWx1ZSBcbiAgICAgICAgICAgICAgICAgICAgc2Vjb25kSXNWYWx1ZSA9IG5vZGUuc2Vjb25kIGluc3RhbmNlb2YgVmFsdWUgXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBmaXJzdElzVmVjICA9IGZpcnN0SXNWYWx1ZSBhbmQgbm9kZS5maXJzdC5iYXNlLnZhbHVlICBpbiBpZGVudGlmaWVyc1xuICAgICAgICAgICAgICAgICAgICBzZWNvbmRJc1ZlYyA9IHNlY29uZElzVmFsdWUgYW5kIG5vZGUuc2Vjb25kLmJhc2UudmFsdWUgaW4gaWRlbnRpZmllcnNcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vZGUub3BlcmF0b3IgPT0gJyonXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3NbKytub2RlSW5kZXhdID0ge25vZGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBmaXJzdElzVmVjIGFuZCBzZWNvbmRJc1ZlY1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIGxvZyAn4pa4dmVjIGRvdCcgbm9kZS5maXJzdC5iYXNlLnZhbHVlLCBub2RlLnNlY29uZC5iYXNlLnZhbHVlIFxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS52ZWNPcCA9ICdkb3QnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgID0gJ251bSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGZpcnN0SXNWZWNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBsb2cgJ+KWuHZlYyB0aW1lcycgbm9kZS5maXJzdC5iYXNlLnZhbHVlXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnNpZGUgID0gJ2xlZnQnXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIHNlY29uZElzVmFsdWUgYW5kIG5vZGUuc2Vjb25kLmJhc2UgaW5zdGFuY2VvZiBOdW1iZXJMaXRlcmFsIG9yIG5vZGUuc2Vjb25kLmJhc2UgaW5zdGFuY2VvZiBJZGVudGlmaWVyTGl0ZXJhbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAndGltZXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICA9ICd2ZWMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnZlY09wID0gJ3RpbWVzT3JEb3QnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgID0gJz8/PydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIHNlY29uZElzVmVjXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgbG9nICfilrh2ZWMgbHRpbWVzJyBub2RlLnNlY29uZC5iYXNlLnZhbHVlXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnNpZGUgID0gJ3JpZ2h0J1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBmaXJzdElzVmFsdWUgYW5kIG5vZGUuZmlyc3QuYmFzZSBpbnN0YW5jZW9mIE51bWJlckxpdGVyYWwgb3Igbm9kZS5maXJzdC5iYXNlIGluc3RhbmNlb2YgSWRlbnRpZmllckxpdGVyYWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnZlY09wID0gJ3RpbWVzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udHlwZSAgPSAndmVjJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS52ZWNPcCA9ICd0aW1lc09yRG90J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICA9ICc/Pz8nXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLm9wZXJhdG9yICA9ICcqJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgbm9kZS5vcGVyYXRvciA9PSAnKydcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zWysrbm9kZUluZGV4XSA9IHtub2RlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgZmlyc3RJc1ZlYyBhbmQgc2Vjb25kSXNWZWNcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBsb2cgJ+KWuHZlYyBwbHVzJyBub2RlLmZpcnN0LmJhc2UudmFsdWUsIG5vZGUuc2Vjb25kLmJhc2UudmFsdWUgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS52ZWNPcCA9ICdwbHVzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICA9ICd2ZWMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBmaXJzdElzVmVjXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnZlY09wID0gJ3BsdXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgID0gJ3ZlYydcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgc2Vjb25kSXNWZWNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAncGx1cydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udHlwZSAgPSAndmVjJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0ub3BlcmF0b3IgID0gJysnXG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vZGUub3BlcmF0b3IgPT0gJy0nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zWysrbm9kZUluZGV4XSA9IHtub2RlfVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBmaXJzdElzVmVjIGFuZCBzZWNvbmRJc1ZlY1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIGxvZyAn4pa4dmVjIG1pbnVzJyBub2RlLmZpcnN0LmJhc2UudmFsdWUsIG5vZGUuc2Vjb25kLmJhc2UudmFsdWUgXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnZlY09wID0gJ21pbnVzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICA9ICd2ZWMnXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGZpcnN0SXNWZWNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAnbWludXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgID0gJ3ZlYydcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgc2Vjb25kSXNWZWNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAnbWludXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgID0gJ3ZlYydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLm9wZXJhdG9yICA9ICctJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgaWYgbm9kZS5jb25zdHJ1Y3Rvci5uYW1lID09ICdWYWx1ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1srK25vZGVJbmRleF0gPSB7bm9kZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICMgbG9nIG5vZGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIG5vdCBub2RlLmJhc2UudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS5ib2R5ID0gbm9kZS5iYXNlLmJvZHk/LmV4cHJlc3Npb25zP1swXT8uY29uc3RydWN0b3IubmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS52YWx1ZSA9IG5vZGUuYmFzZS52YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbm9kZS5iYXNlLnZhbHVlIGluIGlkZW50aWZpZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udHlwZSA9ICd2ZWMnXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHByZVBhcnNlIGV4cFxuICAgICAgICAgICAgZXhwLnRyYXZlcnNlQ2hpbGRyZW4gdHJ1ZSwgcHJlUGFyc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgbm9kZUFycmF5ID0gbm9kZUluZm9zLm1hcCAoaSkgLT4gbiA9IGkubm9kZTsgZGVsZXRlIGkubm9kZTsgblxuICAgIFxuICAgICAgICAgICAgIyBsb2cgbm9vbi5zdHJpbmdpZnkgbm9kZUluZm9zXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBpbmRleCBpbiBub2RlSW5mb3MubGVuZ3RoLTEuLjBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpbmZvID0gbm9kZUluZm9zW2luZGV4XVxuICAgICAgICAgICAgICAgIG5kICAgPSBub2RlQXJyYXlbaW5kZXhdXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgaW5mby52ZWNPcFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgb3RoZXJOb2RlID0gaWYgaW5mby5zaWRlID09ICdsZWZ0JyB0aGVuIG5kLnNlY29uZCBlbHNlIG5kLmZpcnN0XG4gICAgICAgICAgICAgICAgICAgIHZlY05vZGUgICA9IGlmIGluZm8uc2lkZSA9PSAnbGVmdCcgdGhlbiBuZC5maXJzdCBlbHNlIG5kLnNlY29uZFxuICAgICAgICAgICAgICAgICAgICBvdGhlckluZGV4ID0gbm9kZUFycmF5LmluZGV4T2Ygb3RoZXJOb2RlXG4gICAgICAgICAgICAgICAgICAgIHZlY0luZGV4ICAgPSBub2RlQXJyYXkuaW5kZXhPZiB2ZWNOb2RlXG4gICAgICAgICAgICAgICAgICAgIG90aGVySW5mbyAgPSBub2RlSW5mb3Nbb3RoZXJJbmRleF1cbiAgICAgICAgICAgICAgICAgICAgdmVjSW5mbyAgICA9IG5vZGVJbmZvc1t2ZWNJbmRleF1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIGluZm8udmVjT3AgPT0gJ3RpbWVzT3JEb3QnXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbm90IG90aGVySW5mb1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udmVjT3AgPSAndGltZXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mby50eXBlICA9ICd2ZWMnIFxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIG90aGVySW5mby50eXBlID09ICdudW0nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mby52ZWNPcCA9ICd0aW1lcydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnR5cGUgID0gJ3ZlYycgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIG90aGVySW5mby50eXBlID09ICd2ZWMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mby52ZWNPcCA9ICdkb3QnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mby50eXBlICA9ICdudW0nIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAjIGxvZyBrc3RyLmxwYWQoaW5kZXgsIDMpLCBpbmZvLnR5cGUsIFwiI3t2ZWNOb2RlLmJhc2UudmFsdWV9LiN7aW5mby52ZWNPcH0oI3tvdGhlckluZGV4fSlcIlxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBlbHNlIGlmIGluZm8ub3BlcmF0b3JcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGZpcnN0SW5kZXggID0gbm9kZUFycmF5LmluZGV4T2YgbmQuZmlyc3RcbiAgICAgICAgICAgICAgICAgICAgc2Vjb25kSW5kZXggPSBub2RlQXJyYXkuaW5kZXhPZiBuZC5zZWNvbmRcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGZpcnN0VHlwZSAgPSBmaXJzdEluZGV4ICA8IDAgYW5kICdudW0nIG9yIG5vZGVJbmZvc1tmaXJzdEluZGV4XS50eXBlXG4gICAgICAgICAgICAgICAgICAgIHNlY29uZFR5cGUgPSBzZWNvbmRJbmRleCA8IDAgYW5kICdudW0nIG9yIG5vZGVJbmZvc1tzZWNvbmRJbmRleF0udHlwZVxuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiBmaXJzdFR5cGUgPT0gJ3ZlYycgPT0gc2Vjb25kVHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBpbmZvLm9wZXJhdG9yID09ICcqJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udmVjT3AgPSAnZG90J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udHlwZSA9ICdudW0nXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGluZm8ub3BlcmF0b3IgPT0gJy0nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mby52ZWNPcCA9ICdtaW51cydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnR5cGUgPSAndmVjJyAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgaW5mby5vcGVyYXRvciA9PSAnKydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnZlY09wID0gJ3BsdXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mby50eXBlID0gJ3ZlYydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBmaXJzdFR5cGUgPT0gJ3ZlYycgYW5kIHNlY29uZFR5cGUgPT0gJ251bSdcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udmVjT3AgPSAndGltZXMnXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnR5cGUgPSAndmVjJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5zaWRlID0gJ2xlZnQnXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgZmlyc3RUeXBlID09ICdudW0nIGFuZCBzZWNvbmRUeXBlID09ICd2ZWMnXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnZlY09wID0gJ3RpbWVzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby50eXBlID0gJ3ZlYydcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8uc2lkZSA9ICdyaWdodCdcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBmaXJzdFR5cGUgPT0gJ251bScgPT0gc2Vjb25kVHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby50eXBlID0gJ251bSdcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICMgaWYgaW5mby52ZWNPcFxuICAgICAgICAgICAgICAgICAgICAgICAgIyBpZiBpbmZvLnNpZGUgIT0gJ3JpZ2h0J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgbG9nIGtzdHIubHBhZChpbmRleCwgMyksIGluZm8udHlwZSwgZmlyc3RJbmRleCwgaW5mby52ZWNPcCwgc2Vjb25kSW5kZXggIywgaW5mb1xuICAgICAgICAgICAgICAgICAgICAgICAgIyBlbHNlIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgbG9nIGtzdHIubHBhZChpbmRleCwgMyksIGluZm8udHlwZSwgc2Vjb25kSW5kZXgsIGluZm8udmVjT3AsIGZpcnN0SW5kZXggIywgaW5mb1xuICAgICAgICAgICAgICAgICAgICAjIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICMgbG9nIGtzdHIubHBhZChpbmRleCwgMyksIGluZm8udHlwZSwgZmlyc3RJbmRleCwgaW5mby5vcGVyYXRvciwgc2Vjb25kSW5kZXggIywgaW5mb1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiBpbmZvLnZhbHVlIGFuZCBub3QgaW5mby50eXBlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIG5kLmJhc2UgaW5zdGFuY2VvZiBJZGVudGlmaWVyTGl0ZXJhbCB0aGVuIGluZm8udHlwZSA9ICdudW0nXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBuZC5iYXNlIGluc3RhbmNlb2YgTnVtYmVyTGl0ZXJhbCAgICAgdGhlbiBpbmZvLnR5cGUgPSAnbnVtJ1xuICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIGluZm8udHlwZSBpbiBbJ251bScgJ3ZlYyddXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAjIGxvZyBrc3RyLmxwYWQoaW5kZXgsIDMpLCBpbmZvLnR5cGUsIG5kLmJhc2UudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGluZm8uYm9keSA9PSAnT3AnXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvZHlJbmRleCA9IG5vZGVBcnJheS5pbmRleE9mIG5kLmJhc2U/LmJvZHk/LmV4cHJlc3Npb25zWzBdXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHR5cGUgPSBub2RlSW5mb3NbYm9keUluZGV4XT8udHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udHlwZSA9IHR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgIyBsb2cga3N0ci5scGFkKGluZGV4LCAzKSwgaW5mby50eXBlLCBib2R5SW5kZXhcbiAgICAgICAgICAgICAgICAgICAgIyBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAjIGxvZyBrc3RyLmxwYWQoaW5kZXgsIDMpLCBpbmZvLnR5cGUsIGluZm8jLCBuZFxuICAgIFxuICAgICAgICAgICAgIyBsb2cgbm9vbi5zdHJpbmdpZnkgbm9kZUluZm9zXG4gICAgICAgICAgICAjIGxvZyBub29uLnN0cmluZ2lmeSBub2RlQXJyYXlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmVzb2x2ZSA9IChub2RlSW5kZXgpIC0+XG4gICAgXG4gICAgICAgICAgICAgICAgaW5mbyA9IG5vZGVJbmZvc1tub2RlSW5kZXhdXG4gICAgICAgICAgICAgICAgbmQgPSBub2RlQXJyYXlbbm9kZUluZGV4XVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICMgbG9nIG5vZGVJbmRleCwgaW5mbyMsIG5kXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgbm90IGluZm9cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBpbmZvLnZlY09wXG4gICAgICAgICAgICAgICAgICAgIHZuID0gaWYgaW5mby5zaWRlID09ICdyaWdodCcgdGhlbiBuZC5zZWNvbmQgZWxzZSBuZC5maXJzdFxuICAgICAgICAgICAgICAgICAgICBwbiA9IGlmIGluZm8uc2lkZSA9PSAncmlnaHQnIHRoZW4gbmQuZmlyc3QgZWxzZSBuZC5zZWNvbmRcbiAgICAgICAgICAgICAgICAgICAgb2kgPSBub2RlQXJyYXkuaW5kZXhPZiBwblxuICAgICAgICAgICAgICAgICAgICBvcCA9IGluZm8udmVjT3BcbiAgICAgICAgICAgICAgICAgICAgXCIje3ZuLmJhc2U/LnZhbHVlID8gcmVzb2x2ZSBub2RlQXJyYXkuaW5kZXhPZiB2bn0uI3tvcH0oI3tyZXNvbHZlIG9pfSlcIlxuICAgICAgICAgICAgICAgIGVsc2UgaWYgaW5mby5vcGVyYXRvclxuICAgICAgICAgICAgICAgICAgICBpMSA9IG5vZGVBcnJheS5pbmRleE9mIG5kLmZpcnN0XG4gICAgICAgICAgICAgICAgICAgIGkyID0gbm9kZUFycmF5LmluZGV4T2YgbmQuc2Vjb25kXG4gICAgICAgICAgICAgICAgICAgIG9wID0gaW5mby5vcGVyYXRvclxuICAgICAgICAgICAgICAgICAgICBcIiN7cmVzb2x2ZSBpMX0gI3tvcH0gI3tyZXNvbHZlIGkyfVwiXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBuZD8uYmFzZT8udmFsdWUgPyByZXNvbHZlIG5vZGVBcnJheS5pbmRleE9mIG5kLmJhc2UuYm9keS5leHByZXNzaW9uc1swXVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgbG9nIHJlc29sdmUgMFxuICAgICAgICAgICAgbG9nIG5vZGVJbmZvc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgY29udmVydCA9IChuZCkgLT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpbmRleCA9IG5vZGVBcnJheS5pbmRleE9mIG5kXG4gICAgICAgICAgICAgICAgaW5mbyA9IG5vZGVJbmZvc1tpbmRleF1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBsb2cgaW5kZXgsIGluZm9cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBpbmZvPy52ZWNPcFxuICAgICAgICAgICAgICAgICAgICB2biA9IGlmIGluZm8uc2lkZSA9PSAncmlnaHQnIHRoZW4gbmQuc2Vjb25kIGVsc2UgbmQuZmlyc3RcbiAgICAgICAgICAgICAgICAgICAgcG4gPSBpZiBpbmZvLnNpZGUgPT0gJ3JpZ2h0JyB0aGVuIG5kLmZpcnN0IGVsc2UgbmQuc2Vjb25kXG4gICAgICAgICAgICAgICAgICAgIG9pID0gbm9kZUFycmF5LmluZGV4T2YgcG5cbiAgICAgICAgICAgICAgICAgICAgb3AgPSBpbmZvLnZlY09wXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vdCB2bi5iYXNlPy52YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgdm4gPSBjb252ZXJ0IHZuXG4gICAgICAgICAgICAgICAgICAgIGFsID0gW2NvbnZlcnQgcG5dXG4gICAgICAgICAgICAgICAgICAgIG5uID0gbmV3IENhbGwgKG5ldyBWYWx1ZSB2biwgW25ldyBBY2Nlc3MgbmV3IFByb3BlcnR5TmFtZSBvcF0pLCBhbFxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgbmRcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAjIGNvbnZlcnRDaGlsZHJlbiA9IChuZCkgLT5cbiMgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICMgbmkgPSBub2RlQXJyYXkuaW5kZXhPZiBuZFxuICAgICAgICAgICAgICAgICMgbG9nIG5pLCBuZC5jaGlsZHJlblxuICAgICAgICAgICAgICAgICMgaWYgJ2ZpcnN0JyBpbiBuZC5jaGlsZHJlbiBhbmQgJ3NlY29uZCcgaW4gbmQuY2hpbGRyZW5cbiAgICAgICAgICAgICAgICAgICAgIyBsb2cgJzFzdCcgbm9kZUFycmF5LmluZGV4T2YgbmQuZmlyc3RcbiAgICAgICAgICAgICAgICAgICAgIyBsb2cgJzJuZCcgbm9kZUFycmF5LmluZGV4T2YgbmQuc2Vjb25kXG4gICAgICAgICAgICAgICAgICAgICMgbmQuZmlyc3QgPSBjb252ZXJ0IG5kLmZpcnN0XG4gICAgICAgICAgICAgICAgICAgICMgbmQuc2Vjb25kID0gY29udmVydCBuZC5zZWNvbmRcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgIyBub2RlLnRyYXZlcnNlQ2hpbGRyZW4gdHJ1ZSwgY29udmVydENoaWxkcmVuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAjIG5vZGUuYm9keS5leHByZXNzaW9uc1tub2RlLmJvZHkuZXhwcmVzc2lvbnMuaW5kZXhPZiBleHBdID0gbm9kZUFycmF5WzBdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBpbmZvLGluZGV4IGluIG5vZGVJbmZvc1xuICAgICAgICAgICAgICAgIGlmIGluZm8udmVjT3BcbiAgICAgICAgICAgICAgICAgICAgbmQgPSBub2RlQXJyYXlbaW5kZXhdXG4gICAgICAgICAgICAgICAgICAgIGNuID0gY29udmVydCBuZFxuICAgICAgICAgICAgICAgICAgICBub2RlLnRyYXZlcnNlQ2hpbGRyZW4gdHJ1ZSwgKHRuKSAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgdG4uZmlyc3QgPT0gbmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0bi5maXJzdCA9IGNuXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIHRuLnNlY29uZCA9PSBuZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRuLnNlY29uZCA9IGNuXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIHRuLmV4cHJlc3Npb25zPyBhbmQgbmQgaW4gdG4uZXhwcmVzc2lvbnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0bi5leHByZXNzaW9uc1t0bi5leHByZXNzaW9ucy5pbmRleE9mIG5kXSA9IGNuXG4gICAgICAgICAgICBcbiAgICAgICAgIyBmcmFnID0gbm9kZS5ib2R5LmNvbXBpbGVUb0ZyYWdtZW50cyBvcHRzXG4gICAgICAgICMgbG9nICfilrh2ZWMgZnJhZycgZnJhZ1xuICAgICAgICAjIHRleHQgPSBub2RlLmZyYWdtZW50c1RvVGV4dCBmcmFnXG4gICAgICAgICMgbG9nICfilrh2ZWMnIHRleHRcbiAgICAgICAgXG4gICAgICAgIGRlZGVudDogdHJ1ZVxuICAgICAgICByZWR1Y2U6IHRydWVcbiAgICAgICAgYm9keTogICB0cnVlXG4gICAgICAgIGJsb2NrOiAgdHJ1ZVxuLCAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAwMCAgICAwMDAwMDAwICBcblxuICAgIGRvYzog4pa4ZG9jICfilrhkb2MnXG4gICAgICAgIFxuICAgICAgICBUaGlzIGlzIGEgc2xpZ2h0bHkgc3BlY2lhbCBtYWNybywgYmVjYXVzZSBpdCdzIGZpcnN0IHBhc3MgaXMgaGFyZGNvZGVkIGluIHRoZSB0b2tlbml6ZXIuXG4gICAgICAgIFRoZSBib2R5IG9mIHRoZSBtYWNybyBpcyB3cmFwcGVkIGluIGEgc2tpbm55IHRyaXBsZSBzdHJpbmcgYmVmb3JlIGZ1cnRoZXIgdG9rZW5pemF0aW9uLlxuICAgICAgICBJdCBjYW4gY29udGFpbiBhbnl0aGluZyBleGNlcHQgXFwnXFwnXFwnLlxuICAgICAgICBcbiAgICAgICAgSW4gbm9ybWFsIG9wZXJhdGlvbiwgaXQgaXMgcmVkdWNlZCB0byB0aGUgZW1wdHkgc3RyaW5nLiBcbiAgICAgICAgQnV0IGlmICoqa29mZmVlKiogaXMgY2FsbGVkIHdpdGggdGhlIGAtLWRvY2AgYXJndW1lbnQsIGxvZ3Mgd2lsbCBiZSBpbnNlcnRlZCBpbnN0ZWFkLlxuICAgICAgICBcbiAgICAgICAgYGBgY29mZmVlc2NyaXB0XG4gICAgICAgIOKWuGRvYyAndGl0bGUnXG4gICAgICAgICAgICBteSBkb2N1bWVudGF0aW9uIC4uLlxuICAgICAgICBsb2cgJ3NvbWUgY29kZSdcbiAgICAgICAg4pa4ZG9jXG4gICAgICAgICAgICB3ZSBhcmUgZG9uZS5cbiAgICAgICAgYGBgXG4gICAgICAgIFxuICAgICAgICBga29mZmVlIC0tZG9jIGZpbGVgIHdpbGwgb3V0cHV0XG4gICAgICAgIFxuICAgICAgICBgYGBtYXJrZG93blxuICAgICAgICAjIyB0aXRsZVxuICAgICAgICBteSBkb2N1bWVudGF0aW9uIC4uLlxuICAgICAgICBzb21lIGNvZGVcbiAgICAgICAgd2UgYXJlIGRvbmUuXG4gICAgICAgIGBgYFxuICAgICAgICBcbiAgICAgICAgYnV0IGBrb2ZmZWUgZmlsZWAgd2lsbCBvbmx5IHByaW50IGBzb21lIGNvZGVgXG4gICAgICAgIFxuICAgIGtleTogICfilrhkb2MnXG4gICAgZGVzYzogJ+KWuGRvYyBbaGVhZGVyXSAuLi4nXG4gICAgbWV0YTogKGFyZ3M6LG5vZGU6LG9wdHM6KSAtPlxuICAgICAgICBoZWFkZXIgPSBhcmdzWzBdIGFuZCBcIicjIyAje2FyZ3NbMF19XFxcXG4nK1wiIG9yIFwiJycrXCJcbiAgICAgICAgYmVmb3JlOiBvcHRzLmRvYyBhbmQgXCIje21ldGFMb2cob3B0cyl9KCN7aGVhZGVyfVwiXG4gICAgICAgIGFmdGVyOiAgXCIpXCJcbiAgICAgICAgc2tpcDogICBub3Qgb3B0cy5kb2MgYW5kIHdpdGg6XCInJ1wiXG4gICAgICAgIHJlZHVjZTogdHJ1ZVxuICAgICAgICBib2R5OiAgIHRydWVcbiAgICAgICAgYmxvY2s6ICBmYWxzZVxuLCAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBrZXk6ICAn4pa4cHJvZmlsZScgICBcbiAgICBkZXNjOiAn4pa4cHJvZmlsZSBbaWRdIC4uLidcbiAgICBtZXRhOiAoYXJnczosbm9kZTosb3B0czopIC0+IFxuICAgICAgICBcbiAgICAgICAgaWQgPSBcIiN7bm9kZS5jb25kaXRpb24ubG9jYXRpb25EYXRhLmZpcnN0X2xpbmUrMX1fI3tub2RlLmNvbmRpdGlvbi5sb2NhdGlvbkRhdGEuZmlyc3RfY29sdW1ufVwiXG4gICAgICAgIG5hbWUgPSBhcmdzWzBdID8gaWRcbiAgICAgICAgY29kZTogICBcImtvZmZlZV8je2lkfSA9IHByb2Nlc3MuaHJ0aW1lLmJpZ2ludCgpXCJcbiAgICAgICAgYWZ0ZXI6ICBcIiN7bWV0YUxvZyhvcHRzKX0oJyN7bmFtZX0nLCAoZnVuY3Rpb24oYil7IGxldCBmPTEwMDBuOyBmb3IgKGxldCB1IG9mIFsnbnMnLCfOvHMnLCdtcycsJ3MnXSkgeyBpZiAodT09J3MnIHx8IGI8ZikgeyByZXR1cm4gJycrKDEwMDBuKmIvZikrJyAnK3U7IH0gZio9MTAwMG47IH19KShwcm9jZXNzLmhydGltZS5iaWdpbnQoKS1rb2ZmZWVfI3tpZH0pKTtcIlxuICAgICAgICByZWR1Y2U6IGZhbHNlXG4gICAgICAgIGJvZHk6ICAgdHJ1ZVxuLFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAgICAwICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBrZXk6ICAn4pa4YXZlcmFnZScgICBcbiAgICBkZXNjOiAn4pa4YXZlcmFnZSBudW0gLi4uJ1xuICAgIG1ldGE6IChhcmdzOixub2RlOixvcHRzOikgLT4gXG4gICAgICAgIFxuICAgICAgICBpZCAgPSBcIiN7bm9kZS5jb25kaXRpb24ubG9jYXRpb25EYXRhLmZpcnN0X2xpbmUrMX1fI3tub2RlLmNvbmRpdGlvbi5sb2NhdGlvbkRhdGEuZmlyc3RfY29sdW1ufVwiXG4gICAgICAgIG51bSA9IGFyZ3NbMF0gPyAxMDBcbiAgICAgICAgYmVmb3JlOiAgXCJcIlwiXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGtvZmZlZV8je2lkfSA9IDBuO1xuICAgICAgICAgICAgZm9yKGkgPSAwOyBpIDwgI3tudW19OyBpKyspIFxuICAgICAgICAgICAgeyBcbiAgICAgICAgICAgICAgICBrb2ZmZWVfI3tpZH1fc3RhcnQgPSBwcm9jZXNzLmhydGltZS5iaWdpbnQoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgIGFmdGVyOiBcIlwiXCJcbiAgICAgICAgICAgIGtvZmZlZV8je2lkfSArPSBwcm9jZXNzLmhydGltZS5iaWdpbnQoKSAtIGtvZmZlZV8je2lkfV9zdGFydDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBrb2ZmZWVfI3tpZH0gLz0gI3tudW19bjtcbiAgICAgICAgICAgICN7bWV0YUxvZyhvcHRzKX0oJyN7aWR9JywgKGZ1bmN0aW9uKGIpeyBsZXQgZj0xMDAwbjsgZm9yIChsZXQgdSBvZiBbJ25zJywnzrxzJywnbXMnLCdzJ10pIHsgaWYgKHU9PSdzJyB8fCBiPGYpIHsgcmV0dXJuICcnKygxMDAwbipiL2YpKycgJyt1OyB9IGYqPTEwMDBuOyB9fSkoa29mZmVlXyN7aWR9KSk7IFxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgIHJlZHVjZTogdHJ1ZVxuICAgICAgICBib2R5OiAgIHRydWVcbixcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAgMDAwICAgICBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAga2V5OiAgJ+KWuHN0YXJ0JyAgIFxuICAgIGRlc2M6ICfilrhzdGFydCBpZCAuLi4nXG4gICAgaW5mbzpcbiAgICAgICAgdGhlbjogdHJ1ZVxuICAgICAgICBhcmdzOiAxXG4gICAgbWV0YTogKGFyZ3M6KSAtPiBcbiAgICAgICAgaWQgPSBhcmdzWzBdID8gJ3N0YXJ0X2VuZCdcbiAgICAgICAgYmVmb3JlOiBcImtvZmZlZV8je2lkfSA9IHByb2Nlc3MuaHJ0aW1lLmJpZ2ludCgpXCJcbiAgICAgICAgcmVkdWNlOiB0cnVlXG4gICAgICAgIGJvZHk6ICAgZmFsc2VcbixcbiAgICBrZXk6ICAn4pa4ZW5kJyAgICAgXG4gICAgZGVzYzogJ+KWuGVuZCBpZCAuLi4nXG4gICAgaW5mbzpcbiAgICAgICAgdGhlbjogdHJ1ZVxuICAgICAgICBhcmdzOiAxXG4gICAgbWV0YTogKGFyZ3M6LG9wdHM6KSAtPiBcbiAgICAgICAgaWQgPSBhcmdzWzBdID8gJ3N0YXJ0X2VuZCdcbiAgICAgICAgYmVmb3JlOiBcIiN7bWV0YUxvZyhvcHRzKX0oJyN7aWR9JywgKGZ1bmN0aW9uKGIpeyBsZXQgZj0xMDAwbjsgZm9yIChsZXQgdSBvZiBbJ25zJywnzrxzJywnbXMnLCdzJ10pIHsgaWYgKHU9PSdzJyB8fCBiPGYpIHsgcmV0dXJuICcnKygxMDAwbipiL2YpKycgJyt1OyB9IGYqPTEwMDBuOyB9fSkocHJvY2Vzcy5ocnRpbWUuYmlnaW50KCkta29mZmVlXyN7aWR9KSk7XCJcbiAgICAgICAgcmVkdWNlOiB0cnVlXG4gICAgICAgIGJvZHk6ICAgZmFsc2VcbiwgICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBrZXk6ICAn4pa4ZGJnJyAgICBcbiAgICBkZXNjOiAn4pa4ZGJnIFttc2ddIC4uLidcbiAgICBpbmZvOlxuICAgICAgICB0aGVuOiB0cnVlICMgc2hvdWxkIG5vdCBiZSB1c2VkIHdpdGggYSBibG9ja1xuICAgICAgICBhcmdzOiAxXG4gICAgbWV0YTogKG9wdHM6LGFyZ3M6LG5vZGU6KSAtPlxuICAgICAgICBiZWZvcmU6IGxvZ1NvdXJjZSB7b3B0cywgYXJncywgbm9kZX1cbiAgICAgICAgYWZ0ZXI6ICAnKSdcbiAgICAgICAgcmVkdWNlOiB0cnVlXG4gICAgICAgIGJvZHk6ICAgdHJ1ZVxuICAgICAgICBibG9jazogIGZhbHNlXG4sICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAga2V5OiAgJ+KWuGFzc2VydCcgICAgXG4gICAgZGVzYzogJ+KWuGFzc2VydCBbbXNnXSAuLi4nXG4gICAgbWV0YTogKG9wdHM6LGFyZ3M6LG5vZGU6KSAtPlxuICAgICAgICBcbiAgICAgICAgbm9kZXMgPSByZXF1aXJlICcuL25vZGVzJ1xuICAgICAgICB7IEJsb2NrLCBleHRlbmQgfSA9IG5vZGVzXG4gICAgICAgIGlmIG5vZGUuYm9keSBpbnN0YW5jZW9mIEJsb2NrXG4gICAgICAgICAgICBib2R5ID0gbm9kZS5ib2R5LmV4cHJlc3Npb25zWzBdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGJvZHkgPSBub2RlLmJvZHlcbiAgICAgICAgICAgIFxuICAgICAgICBmcmFnID0gYm9keS5jb21waWxlVG9GcmFnbWVudHMgb3B0c1xuICAgICAgICB0ZXh0ID0gbm9kZS5mcmFnbWVudHNUb1RleHQgZnJhZ1xuICAgICAgICBhcmdzID0gWydhc3NlcnRpb24gZmFpbHVyZSEnXSBpZiBub3QgYXJncy5sZW5ndGhcbiAgICAgICAgYmVmb3JlOiBsb2dTb3VyY2Uge29wdHMsIGFyZ3MsIG5vZGUsIGNsb3NlOnRydWV9XG4gICAgICAgIGFmdGVyOiAgJ3Byb2Nlc3MuZXhpdCg2NjYpOydcbiAgICAgICAgdGhlbjogICB0cnVlICMgc2hvdWxkIG5vdCBiZSB1c2VkIHdpdGggYSBibG9ja1xuICAgICAgICBldmFsOiAgIGZhbHNlXG4gICAgICAgIHJlZHVjZTogZmFsc2VcbiAgICAgICAgY29kZTogICBcIiEoI3t0ZXh0fSlcIlxuLCAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgICAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgXG4gICAga2V5OiAgJ+KWuHRlc3QnXG4gICAgZGVzYzogJ+KWuHRlc3QgW2lkXSAuLi4nXG4gICAgbWV0YTogKG9wdHM6LGFyZ3M6LG5vZGU6KSAtPlxuICAgICAgICBiZWZvcmUgID0gbG9nU291cmNlIHtvcHRzLCBhcmdzLCBub2RlLCBjbG9zZTp0cnVlfVxuICAgICAgICBiZWZvcmUgKz0gJ1xcbiAgICB0cnkge1xcbidcbiAgICAgICAgZGVkZW50OiB0cnVlXG4gICAgICAgIGJlZm9yZTogb3B0cy50ZXN0IGFuZCBiZWZvcmVcbiAgICAgICAgYWZ0ZXI6ICBvcHRzLnRlc3QgYW5kIFwifSBjYXRjaChlcnIpIHsgI3ttZXRhTG9nKG9wdHMpfShlcnIubWVzc2FnZSk7IH1cXG5cIlxuICAgICAgICBza2lwOiAgIG5vdCBvcHRzLnRlc3RcbiAgICAgICAgcmVkdWNlOiB0cnVlXG4gICAgICAgIGJvZHk6ICAgdHJ1ZVxuLCAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBrZXk6ICfilrhyYW5kJyAgICBcbiAgICBtZXRhOiAoYXJnczopIC0+IFxuICAgICAgICBjb2RlOiAgIFwiTWF0aC5yYW5kb20oKSA8ICN7YXJncz9bMF0gPyAwLjV9XCIgXG4gICAgICAgIHJlZHVjZTogZmFsc2UgXG4gICAgICAgIGJvZHk6ICAgdHJ1ZSAgIFxuICAgIFxuICAgICMga2V5OiAndG9rZW4nICdwYXJzZScgJ2NvZGUnXG5dXG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG5cblRBQiA9ICcgICAgJ1xuXG5jb21waWxlTWV0YUlmID0gKG5vZGU6LG9wdHM6KSAtPlxuXG4gICAgbm9kZXMgPSByZXF1aXJlICcuL25vZGVzJ1xuICAgIFxuICAgIHsgQmxvY2ssIEFzc2lnbiwgVmFsdWUsIExpdGVyYWwgfSA9IG5vZGVzXG4gICAgeyBleHRlbmQsIG1lcmdlIH0gPSBoZWxwZXJzXG4gICAgICAgIFxuICAgIGluZm8gPSByZWR1Y2U6dHJ1ZSwgZXZhbDp0cnVlXG4gICAgXG4gICAgaWYgbm9kZS5jb25kaXRpb24uYmFzZT8udmFsdWU/LnN0YXJ0c1dpdGggJ+KWuCdcbiAgICAgICAgXG4gICAgICAgIG1ldGFLZXkgPSBub2RlLmNvbmRpdGlvbi5iYXNlLnZhbHVlXG4gICAgICAgIGlmIHR5cGVvZiBvcHRzLm1ldGFbbWV0YUtleV0gPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgaW5mbyA9IG9wdHMubWV0YVttZXRhS2V5XSB7b3B0cywgbm9kZSwgYXJnczpbXX1cbiAgICAgICAgICAgIFxuICAgIGlmIG5vZGUuY29uZGl0aW9uLnZhcmlhYmxlPy5iYXNlPy52YWx1ZT8uc3RhcnRzV2l0aCAn4pa4J1xuICAgICAgICBcbiAgICAgICAgbWV0YUtleSA9IG5vZGUuY29uZGl0aW9uLnZhcmlhYmxlLmJhc2UudmFsdWVcbiAgICAgICAgaWYgdHlwZW9mIG9wdHMubWV0YVttZXRhS2V5XSA9PSAnZnVuY3Rpb24nXG4gICAgICAgICAgICBhcmdzID0gbm9kZS5jb25kaXRpb24uYXJncy5tYXAgKGEpIC0+IFxuICAgICAgICAgICAgICAgIGEuYmFzZT8udmFsdWVcbiAgICAgICAgICAgIGFyZ3MgPSBhcmdzLm1hcCAoYSkgLT4gaWYgYVswXSBpbiBbJ1wiJywgXCInXCJdIHRoZW4gYVsxLi4tMl0gZWxzZSBhXG4gICAgICAgICAgICBpbmZvID0gb3B0cy5tZXRhW21ldGFLZXldIHtvcHRzLCBub2RlLCBhcmdzfVxuICAgICAgICBcbiAgICBpZiBpbmZvLnNraXAgXG4gICAgICAgIGlmIGluZm8uc2tpcC53aXRoP1xuICAgICAgICAgICAgcmV0dXJuIG5vZGUubWFrZUNvZGUgaW5mby5za2lwLndpdGhcbiAgICAgICAgcmV0dXJuIFtdXG4gICAgXG4gICAgaWYgaW5mby5ldmFsXG4gICAgICAgIFxuICAgICAgICBjb25kID0gaW5mby5jb2RlID8gbm9kZS5mcmFnbWVudHNUb1RleHQgbm9kZS5jb25kaXRpb24uY29tcGlsZVRvRnJhZ21lbnRzIG9wdHMsIDIgI0xFVkVMX1BBUkVOXG4gICAgICAgIHRyeVxuICAgICAgICAgICAgb3MgPSByZXF1aXJlICdvcydcbiAgICAgICAgICAgIGZzID0gcmVxdWlyZSAnZnMnXG4gICAgICAgICAgICBpbmZvLmJvZHkgPSEhIGV2YWwgY29uZFxuICAgICAgICAgICAgaWYgaW5mby5ldmFsIGFuZCBpbmZvLnJlZHVjZSBhbmQgbm90IGluZm8uYm9keSBhbmQgbm90IG5vZGUuZWxzZUJvZHlcbiAgICAgICAgICAgICAgICByZXR1cm4gW11cbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICBlcnJvciBlcnJcbiAgICAgICAgXG4gICAgZnJhZyA9IFtdXG4gICAgXG4gICAgaWYgaW5mby5yZWR1Y2UgPT0gZmFsc2VcbiAgICAgICAgZnJhZyA9IGZyYWcuY29uY2F0IG5vZGUubWFrZUNvZGUoXCJpZiAoXCIpLCBub2RlLm1ha2VDb2RlKGluZm8uY29kZSksIG5vZGUubWFrZUNvZGUoXCIpIHtcXG5cIilcbiAgICAgICAgXG4gICAgICAgIGluZGVudCA9IG9wdHMuaW5kZW50ICsgVEFCXG4gICAgICAgIGJvZHlPcHQgPSBtZXJnZSBvcHRzLCB7aW5kZW50fVxuICAgIGVsc2VcbiAgICAgICAgaW5kZW50ID0gb3B0cy5pbmRlbnRcbiAgICAgICAgYm9keU9wdCA9IG9wdHNcblxuICAgIGlmIGluZm8uYmVmb3JlXG4gICAgICAgIGZyYWcucHVzaCBub2RlLm1ha2VDb2RlIChpbmZvLmJsb2NrIT1mYWxzZSBhbmQgaW5mby5kZWRlbnQhPXRydWUgYW5kIGluZGVudCBvciAnJykgKyBpbmZvLmJlZm9yZVxuICAgICAgICBcbiAgICBpZiBpbmZvLmJvZHlcbiAgICAgICAgaWYgaW5mby5ibG9jayAhPSBmYWxzZVxuICAgICAgICAgICAgYm9keSA9IG5vZGUuZW5zdXJlQmxvY2sgbm9kZS5ib2R5XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIG5vZGUuYm9keSBpbnN0YW5jZW9mIEJsb2NrXG4gICAgICAgICAgICAgICAgYm9keSA9IG5vZGUuYm9keS5leHByZXNzaW9uc1swXVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGJvZHkgPSBub2RlLmJvZHlcbiAgICAgICAgaWYgYm9keVxuICAgICAgICAgICAgZnJhZyA9IGZyYWcuY29uY2F0IGJvZHkuY29tcGlsZVRvRnJhZ21lbnRzIGJvZHlPcHRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZnJhZy5wdXNoIG5vZGUubWFrZUNvZGUgXCInJ1wiICMgaWYgaW5mby5ibG9jayA9PSBmYWxzZSA/P1xuICAgICAgICBcbiAgICBpZiBpbmZvLmFmdGVyXG4gICAgICAgIGZyYWcucHVzaCBub2RlLm1ha2VDb2RlICgoaW5mby5ibG9jayAhPSBmYWxzZSkgYW5kICgnXFxuJyArIGluZGVudCkgb3IgJycpICsgaW5mby5hZnRlclxuXG4gICAgaWYgbm90IGluZm8ucmVkdWNlXG4gICAgICAgIGZyYWcucHVzaCBub2RlLm1ha2VDb2RlKFwiXFxuI3tub2RlLnRhYn19XCIpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgIGlmIG5vZGUuZWxzZUJvZHkgYW5kIChpbmZvLnJlZHVjZSA9PSBmYWxzZSBvciBpbmZvLmJvZHkgPT0gZmFsc2UpXG4gICAgICAgIGZyYWcucHVzaCBub2RlLm1ha2VDb2RlICcgZWxzZSAnIGlmIG5vdCBpbmZvLnJlZHVjZVxuICAgICAgICBpZiBub2RlLmlzQ2hhaW5cbiAgICAgICAgICAgIGZyYWcgPSBmcmFnLmNvbmNhdCBub2RlLmVsc2VCb2R5LnVud3JhcCgpLmNvbXBpbGVUb0ZyYWdtZW50cyBib2R5T3B0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGZyYWcgPSBmcmFnLmNvbmNhdCBub2RlLmVsc2VCb2R5LmNvbXBpbGVUb0ZyYWdtZW50cyBib2R5T3B0XG4gICAgICAgIFxuICAgIHJldHVybiBmcmFnXG4gICAgXG4jIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgICAwMDAwMDAwICAgXG4jIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuXG5tZXRhTG9nID0gKG9wdHMpIC0+IG9wdHMubWV0YWxvZyA/ICdjb25zb2xlLmxvZydcblxubG9nU291cmNlID0gKG9wdHM6LGFyZ3M6LG5vZGU6LGNsb3NlOikgLT5cbiAgICBcbiAgICBjb2xvcmV0dGUgPSByZXF1aXJlICdjb2xvcmV0dGUnXG4gICAgeyB5ZWxsb3csIGJsdWUsIHllbGxvd0JyaWdodCwgYmx1ZUJyaWdodCwgd2hpdGVCcmlnaHQsIGRpbSwgYm9sZCwgZ3JheSB9ID0gY29sb3JldHRlLmNyZWF0ZUNvbG9ycyB1c2VDb2xvcjogb3B0cy5mZWF0dXJlLmNvbG9yXG4gICAgXG4gICAgc291cmNlID0gb3B0cy5zb3VyY2UgPyBvcHRzLmZpbGVuYW1lID8gJydcbiAgICBleHQgPSAnJ1xuICAgIGlmIHNvdXJjZVxuICAgICAgICBbc291cmNlLCBleHQuLi5dID0gcGF0aC5iYXNlbmFtZShzb3VyY2UpLnNwbGl0ICcuJ1xuICAgICAgICBzb3VyY2UgID0geWVsbG93IFt5ZWxsb3dCcmlnaHQoc291cmNlKSwgZGltIGV4dC5qb2luJy4nXS5qb2luIGRpbSAnLidcbiAgICBiZWZvcmUgID0gXCIje21ldGFMb2cob3B0cyl9KCcje3NvdXJjZX0je2RpbSBibHVlICc6J30je2JsdWVCcmlnaHQgXCIje25vZGUuY29uZGl0aW9uLmxvY2F0aW9uRGF0YS5maXJzdF9saW5lKzF9XCJ9J1wiXG4gICAgYmVmb3JlICs9IFwiLCAnI3tib2xkIHdoaXRlQnJpZ2h0IGFyZ3NbMF19J1wiIGlmIGFyZ3NbMF0gXG4gICAgaWYgKGNsb3NlKVxuICAgICAgICBiZWZvcmUgKz0gJyk7XFxuJ1xuICAgIGVsc2VcbiAgICAgICAgYmVmb3JlICs9IFwiLCBcIlxuXG4gICAgYmVmb3JlXG4gICAgICAgIFxuIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4jIDAwMCAgMDAwMCAgMDAwICAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiMgMDAwICAwMDAgMCAwMDAgICAgICAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4jIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICBcblxuaW5qZWN0TWV0YSA9IChvcHRpb25zKSAtPiAjIG1ha2Ugc3VyZSB0aGF0IG9wdGlvbnMgaGFzIGEgbWV0YSBzZXRcbiAgICBcbiAgICBvcHRpb25zID89IHt9XG4gICAgXG4gICAgeyBleHRlbmQgfSA9IGhlbHBlcnNcbiAgICBcbiAgICBkZWZhdWx0TWV0YSA9IHt9XG4gICAgTUVUQS5tYXAgKG0pIC0+IGRlZmF1bHRNZXRhW20ua2V5XSA9IG0ubWV0YTsgbS5tZXRhLmtleSA9IG0ua2V5OyBtLm1ldGEuaW5mbyA9IG0uaW5mb1xuICAgIFxuICAgIG1ldGEgICAgPSBleHRlbmQgZGVmYXVsdE1ldGEsIG9wdGlvbnMubWV0YSA/IHt9XG4gICAgb3B0aW9ucyA9IGV4dGVuZCB7IG1ldGE6IG1ldGEgfSwgb3B0aW9uc1xuICAgIG9wdGlvbnNcblxubG9nTWV0YXMgPSAtPlxuICAgIFxuICAgIGxvZyBcIiN7Z3JheSAnTWV0YXM6J31cXG5cXG4jeyBNRVRBLm1hcCgoZikgLT4gXCIgICAgI3toZWxwZXJzLnBhZCBmLmtleX0je2dyYXkgZi5kZXNjID8gXCIje2Yua2V5fSAuLi5cIn1cIikuam9pbignXFxuJykgfVwiXG4gICAgbG9nIFwiICAgIOKWuGlmICAgICAgICAgICAgICAgICAgICAgI3tncmF5ICfilrhpZiBjb25kIC4uLiBbW+KWuGVsaWYgY29uZCAuLi5dIOKWuGVsc2UgLi4uXSd9XFxuXCJcbiAgICBcbm1vZHVsZS5leHBvcnRzID0geyBNRVRBLCBpbmplY3RNZXRhLCBsb2dNZXRhcywgY29tcGlsZU1ldGFJZiB9XG4iXX0=
//# sourceURL=../coffee/meta.coffee