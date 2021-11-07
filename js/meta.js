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
            var Block, IdentifierLiteral, NumberLiteral, Op, Value, args, bodyIndex, config, exp, firstIndex, firstType, identifiers, index, info, j, k, kstr, l, len, len1, nd, node, nodeArray, nodeIndex, nodeInfos, nodes, noon, opts, otherIndex, otherInfo, otherNode, preParse, ref, ref1, ref10, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, resolve, results, secondIndex, secondType, type, vecIndex, vecInfo, vecNode;
            args = (ref = arg1.args) != null ? ref : null, node = (ref1 = arg1.node) != null ? ref1 : null, opts = (ref2 = arg1.opts) != null ? ref2 : null;
            config = ((ref3 = args[0]) != null ? ref3.dot : void 0) != null ? args[0] : {
                times: 'times',
                dot: 'dot',
                plus: 'plus',
                minus: 'minus'
            };
            nodes = require('./nodes');
            Op = nodes.Op, Value = nodes.Value, Block = nodes.Block, NumberLiteral = nodes.NumberLiteral, IdentifierLiteral = nodes.IdentifierLiteral;
            noon = require('noon');
            kstr = require('kstr');
            identifiers = node.condition.args.map(function(arg) {
                return arg.base.value;
            });
            console.log(identifiers);
            console.log('▸vec node.body.expressions', node.body.expressions);
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
                                    nodeInfos[nodeIndex].type = '???';
                                }
                            } else if (secondIsVec) {
                                nodeInfos[nodeIndex].side = 'right';
                                if (firstIsValue && node.first.base instanceof NumberLiteral || node.first.base instanceof IdentifierLiteral) {
                                    nodeInfos[nodeIndex].vecOp = 'times';
                                    nodeInfos[nodeIndex].type = 'vec';
                                } else {
                                    nodeInfos[nodeIndex].vecOp = 'timesOrDot';
                                    nodeInfos[nodeIndex].type = '???';
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
                                nodeInfos[nodeIndex].side = 'left';
                                nodeInfos[nodeIndex].vecOp = 'plus';
                                nodeInfos[nodeIndex].type = 'vec';
                            } else if (secondIsVec) {
                                nodeInfos[nodeIndex].side = 'right';
                                nodeInfos[nodeIndex].vecOp = 'plus';
                                nodeInfos[nodeIndex].type = 'vec';
                            } else {
                                nodeInfos[nodeIndex].operator = '+';
                                nodeInfos[nodeIndex].type = '???';
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
                                nodeInfos[nodeIndex].side = 'left';
                                nodeInfos[nodeIndex].vecOp = 'minus';
                                return nodeInfos[nodeIndex].type = 'vec';
                            } else if (secondIsVec) {
                                nodeInfos[nodeIndex].side = 'right';
                                nodeInfos[nodeIndex].vecOp = 'minus';
                                return nodeInfos[nodeIndex].type = 'vec';
                            } else {
                                nodeInfos[nodeIndex].operator = '-';
                                return nodeInfos[nodeIndex].type = '???';
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
                            } else {
                                return nodeInfos[nodeIndex].type = '???';
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
                            if (otherInfo.type === 'num') {
                                info.vecOp = 'times';
                                info.type = 'vec';
                            } else if (otherInfo.type === 'vec') {
                                info.vecOp = 'dot';
                                info.type = 'num';
                            }
                        }
                        console.log(kstr.lpad(index, 3), info.type, vecNode.base.value + "." + info.vecOp + "(" + otherIndex + ")");
                    } else if (info.operator) {
                        firstIndex = nodeArray.indexOf(nd.first);
                        secondIndex = nodeArray.indexOf(nd.second);
                        firstType = firstIndex < 0 && 'num' || nodeInfos[firstIndex].type;
                        secondType = secondIndex < 0 && 'num' || nodeInfos[secondIndex].type;
                        if ((firstType === 'vec' && 'vec' === secondType)) {
                            info.vecOp = 'dot';
                            info.type = 'num';
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
                        if (info.vecOp) {
                            if (info.side !== 'right') {
                                console.log(kstr.lpad(index, 3), info.type, firstIndex, info.vecOp, secondIndex);
                            } else {
                                console.log(kstr.lpad(index, 3), info.type, secondIndex, info.vecOp, firstIndex);
                            }
                        } else {
                            console.log(kstr.lpad(index, 3), info.type, firstIndex, info.operator, secondIndex);
                        }
                    } else {
                        if (info.value && (!info.type || info.type === '???')) {
                            if (nd.base instanceof IdentifierLiteral) {
                                info.type = 'num';
                            }
                            if (nd.base instanceof NumberLiteral) {
                                info.type = 'num';
                            }
                        }
                        if ((ref7 = info.type) === 'num' || ref7 === 'vec') {
                            console.log(kstr.lpad(index, 3), info.type, nd.base.value);
                        } else if (info.body === 'Op') {
                            bodyIndex = nodeArray.indexOf((ref8 = nd.base) != null ? (ref9 = ref8.body) != null ? ref9.expressions[0] : void 0 : void 0);
                            if (type = (ref10 = nodeInfos[bodyIndex]) != null ? ref10.type : void 0) {
                                if (type !== '???') {
                                    info.type = type;
                                }
                            }
                            console.log(kstr.lpad(index, 3), info.type, bodyIndex);
                        } else {
                            console.log(kstr.lpad(index, 3), info.type, info);
                        }
                    }
                }
                resolve = function(nodeIndex) {
                    var oi, op, pn, ref11, ref12, ref13, ref14, vn;
                    info = nodeInfos[nodeIndex];
                    nd = nodeArray[nodeIndex];
                    if (info.vecOp) {
                        vn = info.side === 'right' ? nd.second : nd.first;
                        pn = info.side === 'right' ? nd.first : nd.second;
                        oi = nodeArray.indexOf(pn);
                        op = info.vecOp;
                        return ((ref11 = (ref12 = vn.base) != null ? ref12.value : void 0) != null ? ref11 : resolve(nodeArray.indexOf(vn))) + "." + op + "(" + (resolve(oi)) + ")";
                    } else if (info.operator) {
                        firstIndex = nodeArray.indexOf(nd.first);
                        secondIndex = nodeArray.indexOf(nd.second);
                        op = info.operator;
                        return (resolve(firstIndex)) + " " + op + " " + (resolve(secondIndex));
                    } else {
                        return (ref13 = nd != null ? (ref14 = nd.base) != null ? ref14.value : void 0 : void 0) != null ? ref13 : resolve(nodeArray.indexOf(nd.base.body.expressions[0]));
                    }
                };
                console.log(resolve(0));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YS5qcyIsInNvdXJjZVJvb3QiOiIuLi9jb2ZmZWUiLCJzb3VyY2VzIjpbIm1ldGEuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGlGQUFBO0lBQUE7OztBQVFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7QUFFUCxPQUFBLEdBQVUsT0FBQSxDQUFRLFdBQVI7O0FBQ1YsT0FBTyxDQUFDLE1BQVIsQ0FBQTs7QUFFQSxJQUFBLEdBQU87SUFRSDtRQUFBLEdBQUEsRUFBTSxNQUFOO1FBQ0EsSUFBQSxFQUFNLGNBRE47UUFFQSxJQUFBLEVBQU0sU0FBQyxJQUFEO0FBRUYsZ0JBQUE7WUFGRyx5Q0FBRyxNQUFHLDJDQUFHLE1BQUcsMkNBQUc7WUFFbEIsTUFBQSxHQUFZLHNEQUFILEdBQXNCLElBQUssQ0FBQSxDQUFBLENBQTNCLEdBQW1DO2dCQUFBLEtBQUEsRUFBTSxPQUFOO2dCQUFjLEdBQUEsRUFBSSxLQUFsQjtnQkFBd0IsSUFBQSxFQUFLLE1BQTdCO2dCQUFvQyxLQUFBLEVBQU0sT0FBMUM7O1lBRTVDLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUjtZQUNOLGFBQUYsRUFBTSxtQkFBTixFQUFhLG1CQUFiLEVBQW9CLG1DQUFwQixFQUFtQztZQUVuQyxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7WUFDUCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7WUFHUCxXQUFBLEdBQWMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBcEIsQ0FBd0IsU0FBQyxHQUFEO3VCQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFBbEIsQ0FBeEI7WUFBK0MsT0FBQSxDQUU3RCxHQUY2RCxDQUV6RCxXQUZ5RDtZQUU5QyxPQUFBLENBRWYsR0FGZSxDQUVYLDRCQUZXLEVBRWtCLElBQUksQ0FBQyxJQUFJLENBQUMsV0FGNUI7QUFJZjtBQUFBLGlCQUFBLHNDQUFBOztnQkFFSSxTQUFBLEdBQVk7Z0JBQ1osU0FBQSxH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QUEsRUFBTSxJQUFSO0tBQVAsRUFBdUIsT0FBdkI7V0FDVjtBQVhTOztBQWFiLFFBQUEsR0FBVyxTQUFBO0lBRVIsT0FBQSxDQUFDLEdBQUQsQ0FBTyxDQUFDLElBQUEsQ0FBSyxRQUFMLENBQUQsQ0FBQSxHQUFlLE1BQWYsR0FBb0IsQ0FBRSxJQUFJLENBQUMsR0FBTCxDQUFTLFNBQUMsQ0FBRDtBQUFPLFlBQUE7ZUFBQSxNQUFBLEdBQU0sQ0FBQyxPQUFPLENBQUMsR0FBUixDQUFZLENBQUMsQ0FBQyxHQUFkLENBQUQsQ0FBTixHQUEwQixDQUFDLElBQUEsZ0NBQWlCLENBQUMsQ0FBQyxHQUFILEdBQU8sTUFBdkIsQ0FBRDtJQUFqQyxDQUFULENBQTBFLENBQUMsSUFBM0UsQ0FBZ0YsSUFBaEYsQ0FBRixDQUEzQjtXQUFxSCxPQUFBLENBQ3BILEdBRG9ILENBQ2hILDhCQUFBLEdBQThCLENBQUMsSUFBQSxDQUFLLDJDQUFMLENBQUQsQ0FBOUIsR0FBZ0YsSUFEZ0M7QUFGN0c7O0FBS1gsTUFBTSxDQUFDLE9BQVAsR0FBaUI7SUFBRSxNQUFBLElBQUY7SUFBUSxZQUFBLFVBQVI7SUFBb0IsVUFBQSxRQUFwQjtJQUE4QixlQUFBLGFBQTlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMCAgICAgMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgXG4wMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgXG4wMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgXG4wMDAgMCAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgXG4wMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgXG4jIyNcblxucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5cbmhlbHBlcnMgPSByZXF1aXJlICcuL2hlbHBlcnMnXG5oZWxwZXJzLmNvbG9ycygpXG5cbk1FVEEgPSBbXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjICAwMDAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjICAgICAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICBcbiAgICBrZXk6ICAn4pa4dmVjJ1xuICAgIGRlc2M6ICfilrh2ZWMoYSwgLi4uKSdcbiAgICBtZXRhOiAoYXJnczosbm9kZTosb3B0czopIC0+XG4gICAgICAgIFxuICAgICAgICBjb25maWcgPSBpZiBhcmdzWzBdPy5kb3Q/IHRoZW4gYXJnc1swXSBlbHNlIHRpbWVzOid0aW1lcycgZG90Oidkb3QnIHBsdXM6J3BsdXMnIG1pbnVzOidtaW51cydcblxuICAgICAgICBub2RlcyA9IHJlcXVpcmUgJy4vbm9kZXMnXG4gICAgICAgIHsgT3AsIFZhbHVlLCBCbG9jaywgTnVtYmVyTGl0ZXJhbCwgSWRlbnRpZmllckxpdGVyYWwgfSA9IG5vZGVzXG4gICAgICAgIFxuICAgICAgICBub29uID0gcmVxdWlyZSAnbm9vbidcbiAgICAgICAga3N0ciA9IHJlcXVpcmUgJ2tzdHInXG4gICAgICAgICMgbG9nICfilrh2ZWMgbm9kZScgbm9kZSwgbm9vbi5zdHJpbmdpZnkgbm9kZVxuICAgICAgICBcbiAgICAgICAgaWRlbnRpZmllcnMgPSBub2RlLmNvbmRpdGlvbi5hcmdzLm1hcCAoYXJnKSAtPiBhcmcuYmFzZS52YWx1ZVxuXG4gICAgICAgIGxvZyBpZGVudGlmaWVyc1xuICAgICAgICBcbiAgICAgICAgbG9nICfilrh2ZWMgbm9kZS5ib2R5LmV4cHJlc3Npb25zJyBub2RlLmJvZHkuZXhwcmVzc2lvbnMgIywgbm9vbi5zdHJpbmdpZnkgZXhwc1xuICAgICAgICBcbiAgICAgICAgZm9yIGV4cCBpbiBub2RlLmJvZHkuZXhwcmVzc2lvbnNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbm9kZUluZm9zID0gW11cbiAgICAgICAgICAgIG5vZGVJbmRleCA9IC0xXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHByZVBhcnNlID0gKG5vZGUpIC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgbm9kZSBpbnN0YW5jZW9mIE9wXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAjIGxvZyAn4pa4dmVjIGNoaWxkJyBub2RlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RJc1ZhbHVlICA9IG5vZGUuZmlyc3QgIGluc3RhbmNlb2YgVmFsdWUgXG4gICAgICAgICAgICAgICAgICAgIHNlY29uZElzVmFsdWUgPSBub2RlLnNlY29uZCBpbnN0YW5jZW9mIFZhbHVlIFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RJc1ZlYyAgPSBmaXJzdElzVmFsdWUgYW5kIG5vZGUuZmlyc3QuYmFzZS52YWx1ZSAgaW4gaWRlbnRpZmllcnNcbiAgICAgICAgICAgICAgICAgICAgc2Vjb25kSXNWZWMgPSBzZWNvbmRJc1ZhbHVlIGFuZCBub2RlLnNlY29uZC5iYXNlLnZhbHVlIGluIGlkZW50aWZpZXJzXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiBub2RlLm9wZXJhdG9yID09ICcqJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zWysrbm9kZUluZGV4XSA9IHtub2RlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgZmlyc3RJc1ZlYyBhbmQgc2Vjb25kSXNWZWNcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBsb2cgJ+KWuHZlYyBkb3QnIG5vZGUuZmlyc3QuYmFzZS52YWx1ZSwgbm9kZS5zZWNvbmQuYmFzZS52YWx1ZSBcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAnZG90J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICA9ICdudW0nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBmaXJzdElzVmVjXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgbG9nICfilrh2ZWMgdGltZXMnIG5vZGUuZmlyc3QuYmFzZS52YWx1ZVxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS5zaWRlICA9ICdsZWZ0J1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBzZWNvbmRJc1ZhbHVlIGFuZCBub2RlLnNlY29uZC5iYXNlIGluc3RhbmNlb2YgTnVtYmVyTGl0ZXJhbCBvciBub2RlLnNlY29uZC5iYXNlIGluc3RhbmNlb2YgSWRlbnRpZmllckxpdGVyYWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnZlY09wID0gJ3RpbWVzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udHlwZSAgPSAndmVjJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS52ZWNPcCA9ICd0aW1lc09yRG90J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udHlwZSAgPSAnPz8/J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgc2Vjb25kSXNWZWNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBsb2cgJ+KWuHZlYyBsdGltZXMnIG5vZGUuc2Vjb25kLmJhc2UudmFsdWVcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0uc2lkZSAgPSAncmlnaHQnXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIGZpcnN0SXNWYWx1ZSBhbmQgbm9kZS5maXJzdC5iYXNlIGluc3RhbmNlb2YgTnVtYmVyTGl0ZXJhbCBvciBub2RlLmZpcnN0LmJhc2UgaW5zdGFuY2VvZiBJZGVudGlmaWVyTGl0ZXJhbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAndGltZXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICA9ICd2ZWMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnZlY09wID0gJ3RpbWVzT3JEb3QnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICA9ICc/Pz8nXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLm9wZXJhdG9yICA9ICcqJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgbm9kZS5vcGVyYXRvciA9PSAnKydcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zWysrbm9kZUluZGV4XSA9IHtub2RlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgZmlyc3RJc1ZlYyBhbmQgc2Vjb25kSXNWZWNcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBsb2cgJ+KWuHZlYyBwbHVzJyBub2RlLmZpcnN0LmJhc2UudmFsdWUsIG5vZGUuc2Vjb25kLmJhc2UudmFsdWUgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS52ZWNPcCA9ICdwbHVzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICA9ICd2ZWMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBmaXJzdElzVmVjXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnNpZGUgID0gJ2xlZnQnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnZlY09wID0gJ3BsdXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgID0gJ3ZlYydcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgc2Vjb25kSXNWZWNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0uc2lkZSAgPSAncmlnaHQnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnZlY09wID0gJ3BsdXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgID0gJ3ZlYydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLm9wZXJhdG9yICA9ICcrJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgICAgICA9ICc/Pz8nXG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vZGUub3BlcmF0b3IgPT0gJy0nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zWysrbm9kZUluZGV4XSA9IHtub2RlfVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBmaXJzdElzVmVjIGFuZCBzZWNvbmRJc1ZlY1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIGxvZyAn4pa4dmVjIG1pbnVzJyBub2RlLmZpcnN0LmJhc2UudmFsdWUsIG5vZGUuc2Vjb25kLmJhc2UudmFsdWUgXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnZlY09wID0gJ21pbnVzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICA9ICd2ZWMnXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGZpcnN0SXNWZWNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0uc2lkZSAgPSAnbGVmdCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAnbWludXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgID0gJ3ZlYydcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgc2Vjb25kSXNWZWNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0uc2lkZSAgPSAncmlnaHQnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnZlY09wID0gJ21pbnVzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICA9ICd2ZWMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS5vcGVyYXRvciAgPSAnLSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICAgICAgPSAnPz8/J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgaWYgbm9kZS5jb25zdHJ1Y3Rvci5uYW1lID09ICdWYWx1ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1srK25vZGVJbmRleF0gPSB7bm9kZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICMgbG9nIG5vZGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIG5vdCBub2RlLmJhc2UudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS5ib2R5ID0gbm9kZS5iYXNlLmJvZHk/LmV4cHJlc3Npb25zP1swXT8uY29uc3RydWN0b3IubmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS52YWx1ZSA9IG5vZGUuYmFzZS52YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbm9kZS5iYXNlLnZhbHVlIGluIGlkZW50aWZpZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udHlwZSA9ICd2ZWMnXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udHlwZSA9ICc/Pz8nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICMgbG9nICdub2RlPycgbm9kZS5jb25zdHJ1Y3Rvci5uYW1lXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHByZVBhcnNlIGV4cFxuICAgICAgICAgICAgZXhwLnRyYXZlcnNlQ2hpbGRyZW4gdHJ1ZSwgcHJlUGFyc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgbm9kZUFycmF5ID0gbm9kZUluZm9zLm1hcCAoaSkgLT4gbiA9IGkubm9kZTsgZGVsZXRlIGkubm9kZTsgblxuICAgIFxuICAgICAgICAgICAgIyBsb2cgbm9vbi5zdHJpbmdpZnkgbm9kZUluZm9zXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBpbmRleCBpbiBub2RlSW5mb3MubGVuZ3RoLTEuLjBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpbmZvID0gbm9kZUluZm9zW2luZGV4XVxuICAgICAgICAgICAgICAgIG5kICAgPSBub2RlQXJyYXlbaW5kZXhdXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgaW5mby52ZWNPcFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgb3RoZXJOb2RlID0gaWYgaW5mby5zaWRlID09ICdsZWZ0JyB0aGVuIG5kLnNlY29uZCBlbHNlIG5kLmZpcnN0XG4gICAgICAgICAgICAgICAgICAgIHZlY05vZGUgICA9IGlmIGluZm8uc2lkZSA9PSAnbGVmdCcgdGhlbiBuZC5maXJzdCBlbHNlIG5kLnNlY29uZFxuICAgICAgICAgICAgICAgICAgICBvdGhlckluZGV4ID0gbm9kZUFycmF5LmluZGV4T2Ygb3RoZXJOb2RlXG4gICAgICAgICAgICAgICAgICAgIHZlY0luZGV4ICAgPSBub2RlQXJyYXkuaW5kZXhPZiB2ZWNOb2RlXG4gICAgICAgICAgICAgICAgICAgIG90aGVySW5mbyAgPSBub2RlSW5mb3Nbb3RoZXJJbmRleF1cbiAgICAgICAgICAgICAgICAgICAgdmVjSW5mbyAgICA9IG5vZGVJbmZvc1t2ZWNJbmRleF1cbiAgICAgICAgICAgICAgICAgICAgaWYgaW5mby52ZWNPcCA9PSAndGltZXNPckRvdCdcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIG90aGVySW5mby50eXBlID09ICdudW0nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mby52ZWNPcCA9ICd0aW1lcydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnR5cGUgID0gJ3ZlYycgXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIG90aGVySW5mby50eXBlID09ICd2ZWMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mby52ZWNPcCA9ICdkb3QnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mby50eXBlICA9ICdudW0nIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBsb2cga3N0ci5scGFkKGluZGV4LCAzKSwgaW5mby50eXBlLCBcIiN7dmVjTm9kZS5iYXNlLnZhbHVlfS4je2luZm8udmVjT3B9KCN7b3RoZXJJbmRleH0pXCJcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBpbmZvLm9wZXJhdG9yXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBmaXJzdEluZGV4ICA9IG5vZGVBcnJheS5pbmRleE9mIG5kLmZpcnN0XG4gICAgICAgICAgICAgICAgICAgIHNlY29uZEluZGV4ID0gbm9kZUFycmF5LmluZGV4T2YgbmQuc2Vjb25kXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBmaXJzdFR5cGUgID0gZmlyc3RJbmRleCAgPCAwIGFuZCAnbnVtJyBvciBub2RlSW5mb3NbZmlyc3RJbmRleF0udHlwZVxuICAgICAgICAgICAgICAgICAgICBzZWNvbmRUeXBlID0gc2Vjb25kSW5kZXggPCAwIGFuZCAnbnVtJyBvciBub2RlSW5mb3Nbc2Vjb25kSW5kZXhdLnR5cGVcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgZmlyc3RUeXBlID09ICd2ZWMnID09IHNlY29uZFR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udmVjT3AgPSAnZG90J1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby50eXBlID0gJ251bSdcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBmaXJzdFR5cGUgPT0gJ3ZlYycgYW5kIHNlY29uZFR5cGUgPT0gJ251bSdcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udmVjT3AgPSAndGltZXMnXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnR5cGUgPSAndmVjJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5zaWRlID0gJ2xlZnQnXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgZmlyc3RUeXBlID09ICdudW0nIGFuZCBzZWNvbmRUeXBlID09ICd2ZWMnXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnZlY09wID0gJ3RpbWVzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby50eXBlID0gJ3ZlYydcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8uc2lkZSA9ICdyaWdodCdcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBmaXJzdFR5cGUgPT0gJ251bScgPT0gc2Vjb25kVHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby50eXBlID0gJ251bSdcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIGluZm8udmVjT3BcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGluZm8uc2lkZSAhPSAncmlnaHQnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nIGtzdHIubHBhZChpbmRleCwgMyksIGluZm8udHlwZSwgZmlyc3RJbmRleCwgaW5mby52ZWNPcCwgc2Vjb25kSW5kZXggIywgaW5mb1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2cga3N0ci5scGFkKGluZGV4LCAzKSwgaW5mby50eXBlLCBzZWNvbmRJbmRleCwgaW5mby52ZWNPcCwgZmlyc3RJbmRleCAjLCBpbmZvXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZyBrc3RyLmxwYWQoaW5kZXgsIDMpLCBpbmZvLnR5cGUsIGZpcnN0SW5kZXgsIGluZm8ub3BlcmF0b3IsIHNlY29uZEluZGV4ICMsIGluZm9cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZWxzZSBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgaW5mby52YWx1ZSBhbmQgKG5vdCBpbmZvLnR5cGUgb3IgaW5mby50eXBlID09ICc/Pz8nKVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBuZC5iYXNlIGluc3RhbmNlb2YgSWRlbnRpZmllckxpdGVyYWwgdGhlbiBpbmZvLnR5cGUgPSAnbnVtJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbmQuYmFzZSBpbnN0YW5jZW9mIE51bWJlckxpdGVyYWwgICAgIHRoZW4gaW5mby50eXBlID0gJ251bSdcbiAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiBpbmZvLnR5cGUgaW4gWydudW0nICd2ZWMnXVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2cga3N0ci5scGFkKGluZGV4LCAzKSwgaW5mby50eXBlLCBuZC5iYXNlLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBpbmZvLmJvZHkgPT0gJ09wJ1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBib2R5SW5kZXggPSBub2RlQXJyYXkuaW5kZXhPZiBuZC5iYXNlPy5ib2R5Py5leHByZXNzaW9uc1swXVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiB0eXBlID0gbm9kZUluZm9zW2JvZHlJbmRleF0/LnR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiB0eXBlICE9ICc/Pz8nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udHlwZSA9IHR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgbG9nIGtzdHIubHBhZChpbmRleCwgMyksIGluZm8udHlwZSwgYm9keUluZGV4XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgbG9nIGtzdHIubHBhZChpbmRleCwgMyksIGluZm8udHlwZSwgaW5mbyMsIG5kXG4gICAgXG4gICAgICAgICAgICAjIGxvZyBub29uLnN0cmluZ2lmeSBub2RlSW5mb3NcbiAgICAgICAgICAgICMgbG9nIG5vb24uc3RyaW5naWZ5IG5vZGVBcnJheVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXNvbHZlID0gKG5vZGVJbmRleCkgLT5cbiAgICBcbiAgICAgICAgICAgICAgICBpbmZvID0gbm9kZUluZm9zW25vZGVJbmRleF1cbiAgICAgICAgICAgICAgICBuZCA9IG5vZGVBcnJheVtub2RlSW5kZXhdXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgIyBsb2cgbm9kZUluZGV4LCBpbmZvIywgbmRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBpbmZvLnZlY09wXG4gICAgICAgICAgICAgICAgICAgIHZuID0gaWYgaW5mby5zaWRlID09ICdyaWdodCcgdGhlbiBuZC5zZWNvbmQgZWxzZSBuZC5maXJzdFxuICAgICAgICAgICAgICAgICAgICBwbiA9IGlmIGluZm8uc2lkZSA9PSAncmlnaHQnIHRoZW4gbmQuZmlyc3QgZWxzZSBuZC5zZWNvbmRcbiAgICAgICAgICAgICAgICAgICAgb2kgPSBub2RlQXJyYXkuaW5kZXhPZiBwblxuICAgICAgICAgICAgICAgICAgICBvcCA9IGluZm8udmVjT3BcbiAgICAgICAgICAgICAgICAgICAgXCIje3ZuLmJhc2U/LnZhbHVlID8gcmVzb2x2ZSBub2RlQXJyYXkuaW5kZXhPZiB2bn0uI3tvcH0oI3tyZXNvbHZlIG9pfSlcIlxuICAgICAgICAgICAgICAgIGVsc2UgaWYgaW5mby5vcGVyYXRvclxuICAgICAgICAgICAgICAgICAgICBmaXJzdEluZGV4ICA9IG5vZGVBcnJheS5pbmRleE9mIG5kLmZpcnN0XG4gICAgICAgICAgICAgICAgICAgIHNlY29uZEluZGV4ID0gbm9kZUFycmF5LmluZGV4T2YgbmQuc2Vjb25kXG4gICAgICAgICAgICAgICAgICAgIG9wID0gaW5mby5vcGVyYXRvclxuICAgICAgICAgICAgICAgICAgICBcIiN7cmVzb2x2ZSBmaXJzdEluZGV4fSAje29wfSAje3Jlc29sdmUgc2Vjb25kSW5kZXh9XCJcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIG5kPy5iYXNlPy52YWx1ZSA/IHJlc29sdmUgbm9kZUFycmF5LmluZGV4T2YgbmQuYmFzZS5ib2R5LmV4cHJlc3Npb25zWzBdXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBsb2cgcmVzb2x2ZSAwXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICMgZnJhZyA9IGJvZHkuY29tcGlsZVRvRnJhZ21lbnRzIG9wdHNcbiAgICAgICAgIyBjb25zb2xlLmxvZyAn4pa4dmVjIGZyYWcnIGZyYWdcbiAgICAgICAgZGVkZW50OiB0cnVlXG4gICAgICAgIHJlZHVjZTogdHJ1ZVxuICAgICAgICBib2R5OiAgIHRydWVcbiAgICAgICAgYmxvY2s6ICB0cnVlXG4sICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIFxuXG4gICAgZG9jOiDilrhkb2MgJ+KWuGRvYydcbiAgICAgICAgXG4gICAgICAgIFRoaXMgaXMgYSBzbGlnaHRseSBzcGVjaWFsIG1hY3JvLCBiZWNhdXNlIGl0J3MgZmlyc3QgcGFzcyBpcyBoYXJkY29kZWQgaW4gdGhlIHRva2VuaXplci5cbiAgICAgICAgVGhlIGJvZHkgb2YgdGhlIG1hY3JvIGlzIHdyYXBwZWQgaW4gYSBza2lubnkgdHJpcGxlIHN0cmluZyBiZWZvcmUgZnVydGhlciB0b2tlbml6YXRpb24uXG4gICAgICAgIEl0IGNhbiBjb250YWluIGFueXRoaW5nIGV4Y2VwdCBcXCdcXCdcXCcuXG4gICAgICAgIFxuICAgICAgICBJbiBub3JtYWwgb3BlcmF0aW9uLCBpdCBpcyByZWR1Y2VkIHRvIHRoZSBlbXB0eSBzdHJpbmcuIFxuICAgICAgICBCdXQgaWYgKiprb2ZmZWUqKiBpcyBjYWxsZWQgd2l0aCB0aGUgYC0tZG9jYCBhcmd1bWVudCwgbG9ncyB3aWxsIGJlIGluc2VydGVkIGluc3RlYWQuXG4gICAgICAgIFxuICAgICAgICBgYGBjb2ZmZWVzY3JpcHRcbiAgICAgICAg4pa4ZG9jICd0aXRsZSdcbiAgICAgICAgICAgIG15IGRvY3VtZW50YXRpb24gLi4uXG4gICAgICAgIGxvZyAnc29tZSBjb2RlJ1xuICAgICAgICDilrhkb2NcbiAgICAgICAgICAgIHdlIGFyZSBkb25lLlxuICAgICAgICBgYGBcbiAgICAgICAgXG4gICAgICAgIGBrb2ZmZWUgLS1kb2MgZmlsZWAgd2lsbCBvdXRwdXRcbiAgICAgICAgXG4gICAgICAgIGBgYG1hcmtkb3duXG4gICAgICAgICMjIHRpdGxlXG4gICAgICAgIG15IGRvY3VtZW50YXRpb24gLi4uXG4gICAgICAgIHNvbWUgY29kZVxuICAgICAgICB3ZSBhcmUgZG9uZS5cbiAgICAgICAgYGBgXG4gICAgICAgIFxuICAgICAgICBidXQgYGtvZmZlZSBmaWxlYCB3aWxsIG9ubHkgcHJpbnQgYHNvbWUgY29kZWBcbiAgICAgICAgXG4gICAga2V5OiAgJ+KWuGRvYydcbiAgICBkZXNjOiAn4pa4ZG9jIFtoZWFkZXJdIC4uLidcbiAgICBtZXRhOiAoYXJnczosbm9kZTosb3B0czopIC0+XG4gICAgICAgIGhlYWRlciA9IGFyZ3NbMF0gYW5kIFwiJyMjICN7YXJnc1swXX1cXFxcbicrXCIgb3IgXCInJytcIlxuICAgICAgICBiZWZvcmU6IG9wdHMuZG9jIGFuZCBcIiN7bWV0YUxvZyhvcHRzKX0oI3toZWFkZXJ9XCJcbiAgICAgICAgYWZ0ZXI6ICBcIilcIlxuICAgICAgICBza2lwOiAgIG5vdCBvcHRzLmRvYyBhbmQgd2l0aDpcIicnXCJcbiAgICAgICAgcmVkdWNlOiB0cnVlXG4gICAgICAgIGJvZHk6ICAgdHJ1ZVxuICAgICAgICBibG9jazogIGZhbHNlXG4sICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGtleTogICfilrhwcm9maWxlJyAgIFxuICAgIGRlc2M6ICfilrhwcm9maWxlIFtpZF0gLi4uJ1xuICAgIG1ldGE6IChhcmdzOixub2RlOixvcHRzOikgLT4gXG4gICAgICAgIFxuICAgICAgICBpZCA9IFwiI3tub2RlLmNvbmRpdGlvbi5sb2NhdGlvbkRhdGEuZmlyc3RfbGluZSsxfV8je25vZGUuY29uZGl0aW9uLmxvY2F0aW9uRGF0YS5maXJzdF9jb2x1bW59XCJcbiAgICAgICAgbmFtZSA9IGFyZ3NbMF0gPyBpZFxuICAgICAgICBjb2RlOiAgIFwia29mZmVlXyN7aWR9ID0gcHJvY2Vzcy5ocnRpbWUuYmlnaW50KClcIlxuICAgICAgICBhZnRlcjogIFwiI3ttZXRhTG9nKG9wdHMpfSgnI3tuYW1lfScsIChmdW5jdGlvbihiKXsgbGV0IGY9MTAwMG47IGZvciAobGV0IHUgb2YgWyducycsJ868cycsJ21zJywncyddKSB7IGlmICh1PT0ncycgfHwgYjxmKSB7IHJldHVybiAnJysoMTAwMG4qYi9mKSsnICcrdTsgfSBmKj0xMDAwbjsgfX0pKHByb2Nlc3MuaHJ0aW1lLmJpZ2ludCgpLWtvZmZlZV8je2lkfSkpO1wiXG4gICAgICAgIHJlZHVjZTogZmFsc2VcbiAgICAgICAgYm9keTogICB0cnVlXG4sXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGtleTogICfilrhhdmVyYWdlJyAgIFxuICAgIGRlc2M6ICfilrhhdmVyYWdlIG51bSAuLi4nXG4gICAgbWV0YTogKGFyZ3M6LG5vZGU6LG9wdHM6KSAtPiBcbiAgICAgICAgXG4gICAgICAgIGlkICA9IFwiI3tub2RlLmNvbmRpdGlvbi5sb2NhdGlvbkRhdGEuZmlyc3RfbGluZSsxfV8je25vZGUuY29uZGl0aW9uLmxvY2F0aW9uRGF0YS5maXJzdF9jb2x1bW59XCJcbiAgICAgICAgbnVtID0gYXJnc1swXSA/IDEwMFxuICAgICAgICBiZWZvcmU6ICBcIlwiXCJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAga29mZmVlXyN7aWR9ID0gMG47XG4gICAgICAgICAgICBmb3IoaSA9IDA7IGkgPCAje251bX07IGkrKykgXG4gICAgICAgICAgICB7IFxuICAgICAgICAgICAgICAgIGtvZmZlZV8je2lkfV9zdGFydCA9IHByb2Nlc3MuaHJ0aW1lLmJpZ2ludCgpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgYWZ0ZXI6IFwiXCJcIlxuICAgICAgICAgICAga29mZmVlXyN7aWR9ICs9IHByb2Nlc3MuaHJ0aW1lLmJpZ2ludCgpIC0ga29mZmVlXyN7aWR9X3N0YXJ0O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGtvZmZlZV8je2lkfSAvPSAje251bX1uO1xuICAgICAgICAgICAgI3ttZXRhTG9nKG9wdHMpfSgnI3tpZH0nLCAoZnVuY3Rpb24oYil7IGxldCBmPTEwMDBuOyBmb3IgKGxldCB1IG9mIFsnbnMnLCfOvHMnLCdtcycsJ3MnXSkgeyBpZiAodT09J3MnIHx8IGI8ZikgeyByZXR1cm4gJycrKDEwMDBuKmIvZikrJyAnK3U7IH0gZio9MTAwMG47IH19KShrb2ZmZWVfI3tpZH0pKTsgXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgcmVkdWNlOiB0cnVlXG4gICAgICAgIGJvZHk6ICAgdHJ1ZVxuLFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBrZXk6ICAn4pa4c3RhcnQnICAgXG4gICAgZGVzYzogJ+KWuHN0YXJ0IGlkIC4uLidcbiAgICBpbmZvOlxuICAgICAgICB0aGVuOiB0cnVlXG4gICAgICAgIGFyZ3M6IDFcbiAgICBtZXRhOiAoYXJnczopIC0+IFxuICAgICAgICBpZCA9IGFyZ3NbMF0gPyAnc3RhcnRfZW5kJ1xuICAgICAgICBiZWZvcmU6IFwia29mZmVlXyN7aWR9ID0gcHJvY2Vzcy5ocnRpbWUuYmlnaW50KClcIlxuICAgICAgICByZWR1Y2U6IHRydWVcbiAgICAgICAgYm9keTogICBmYWxzZVxuLFxuICAgIGtleTogICfilrhlbmQnICAgICBcbiAgICBkZXNjOiAn4pa4ZW5kIGlkIC4uLidcbiAgICBpbmZvOlxuICAgICAgICB0aGVuOiB0cnVlXG4gICAgICAgIGFyZ3M6IDFcbiAgICBtZXRhOiAoYXJnczosb3B0czopIC0+IFxuICAgICAgICBpZCA9IGFyZ3NbMF0gPyAnc3RhcnRfZW5kJ1xuICAgICAgICBiZWZvcmU6IFwiI3ttZXRhTG9nKG9wdHMpfSgnI3tpZH0nLCAoZnVuY3Rpb24oYil7IGxldCBmPTEwMDBuOyBmb3IgKGxldCB1IG9mIFsnbnMnLCfOvHMnLCdtcycsJ3MnXSkgeyBpZiAodT09J3MnIHx8IGI8ZikgeyByZXR1cm4gJycrKDEwMDBuKmIvZikrJyAnK3U7IH0gZio9MTAwMG47IH19KShwcm9jZXNzLmhydGltZS5iaWdpbnQoKS1rb2ZmZWVfI3tpZH0pKTtcIlxuICAgICAgICByZWR1Y2U6IHRydWVcbiAgICAgICAgYm9keTogICBmYWxzZVxuLCAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGtleTogICfilrhkYmcnICAgIFxuICAgIGRlc2M6ICfilrhkYmcgW21zZ10gLi4uJ1xuICAgIGluZm86XG4gICAgICAgIHRoZW46IHRydWUgIyBzaG91bGQgbm90IGJlIHVzZWQgd2l0aCBhIGJsb2NrXG4gICAgICAgIGFyZ3M6IDFcbiAgICBtZXRhOiAob3B0czosYXJnczosbm9kZTopIC0+XG4gICAgICAgIGJlZm9yZTogbG9nU291cmNlIHtvcHRzLCBhcmdzLCBub2RlfVxuICAgICAgICBhZnRlcjogICcpJ1xuICAgICAgICByZWR1Y2U6IHRydWVcbiAgICAgICAgYm9keTogICB0cnVlXG4gICAgICAgIGJsb2NrOiAgZmFsc2VcbiwgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBrZXk6ICAn4pa4YXNzZXJ0JyAgICBcbiAgICBkZXNjOiAn4pa4YXNzZXJ0IFttc2ddIC4uLidcbiAgICBtZXRhOiAob3B0czosYXJnczosbm9kZTopIC0+XG4gICAgICAgIFxuICAgICAgICBub2RlcyA9IHJlcXVpcmUgJy4vbm9kZXMnXG4gICAgICAgIHsgQmxvY2ssIGV4dGVuZCB9ID0gbm9kZXNcbiAgICAgICAgaWYgbm9kZS5ib2R5IGluc3RhbmNlb2YgQmxvY2tcbiAgICAgICAgICAgIGJvZHkgPSBub2RlLmJvZHkuZXhwcmVzc2lvbnNbMF1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgYm9keSA9IG5vZGUuYm9keVxuICAgICAgICAgICAgXG4gICAgICAgIGZyYWcgPSBib2R5LmNvbXBpbGVUb0ZyYWdtZW50cyBvcHRzXG4gICAgICAgIHRleHQgPSBub2RlLmZyYWdtZW50c1RvVGV4dCBmcmFnXG4gICAgICAgIGFyZ3MgPSBbJ2Fzc2VydGlvbiBmYWlsdXJlISddIGlmIG5vdCBhcmdzLmxlbmd0aFxuICAgICAgICBiZWZvcmU6IGxvZ1NvdXJjZSB7b3B0cywgYXJncywgbm9kZSwgY2xvc2U6dHJ1ZX1cbiAgICAgICAgYWZ0ZXI6ICAncHJvY2Vzcy5leGl0KDY2Nik7J1xuICAgICAgICB0aGVuOiAgIHRydWUgIyBzaG91bGQgbm90IGJlIHVzZWQgd2l0aCBhIGJsb2NrXG4gICAgICAgIGV2YWw6ICAgZmFsc2VcbiAgICAgICAgcmVkdWNlOiBmYWxzZVxuICAgICAgICBjb2RlOiAgIFwiISgje3RleHR9KVwiXG4sICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAgICAgICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICBcbiAgICBrZXk6ICAn4pa4dGVzdCdcbiAgICBkZXNjOiAn4pa4dGVzdCBbaWRdIC4uLidcbiAgICBtZXRhOiAob3B0czosYXJnczosbm9kZTopIC0+XG4gICAgICAgIGJlZm9yZSAgPSBsb2dTb3VyY2Uge29wdHMsIGFyZ3MsIG5vZGUsIGNsb3NlOnRydWV9XG4gICAgICAgIGJlZm9yZSArPSAnXFxuICAgIHRyeSB7XFxuJ1xuICAgICAgICBkZWRlbnQ6IHRydWVcbiAgICAgICAgYmVmb3JlOiBvcHRzLnRlc3QgYW5kIGJlZm9yZVxuICAgICAgICBhZnRlcjogIG9wdHMudGVzdCBhbmQgXCJ9IGNhdGNoKGVycikgeyAje21ldGFMb2cob3B0cyl9KGVyci5tZXNzYWdlKTsgfVxcblwiXG4gICAgICAgIHNraXA6ICAgbm90IG9wdHMudGVzdFxuICAgICAgICByZWR1Y2U6IHRydWVcbiAgICAgICAgYm9keTogICB0cnVlXG4sICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgIFxuICAgIGtleTogJ+KWuHJhbmQnICAgIFxuICAgIG1ldGE6IChhcmdzOikgLT4gXG4gICAgICAgIGNvZGU6ICAgXCJNYXRoLnJhbmRvbSgpIDwgI3thcmdzP1swXSA/IDAuNX1cIiBcbiAgICAgICAgcmVkdWNlOiBmYWxzZSBcbiAgICAgICAgYm9keTogICB0cnVlICAgXG4gICAgXG4gICAgIyBrZXk6ICd0b2tlbicgJ3BhcnNlJyAnY29kZSdcbl1cblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcblxuVEFCID0gJyAgICAnXG5cbmNvbXBpbGVNZXRhSWYgPSAobm9kZTosb3B0czopIC0+XG5cbiAgICBub2RlcyA9IHJlcXVpcmUgJy4vbm9kZXMnXG4gICAgXG4gICAgeyBCbG9jaywgQXNzaWduLCBWYWx1ZSwgTGl0ZXJhbCB9ID0gbm9kZXNcbiAgICB7IGV4dGVuZCwgbWVyZ2UgfSA9IGhlbHBlcnNcbiAgICAgICAgXG4gICAgaW5mbyA9IHJlZHVjZTp0cnVlLCBldmFsOnRydWVcbiAgICBcbiAgICBpZiBub2RlLmNvbmRpdGlvbi5iYXNlPy52YWx1ZT8uc3RhcnRzV2l0aCAn4pa4J1xuICAgICAgICBcbiAgICAgICAgbWV0YUtleSA9IG5vZGUuY29uZGl0aW9uLmJhc2UudmFsdWVcbiAgICAgICAgaWYgdHlwZW9mIG9wdHMubWV0YVttZXRhS2V5XSA9PSAnZnVuY3Rpb24nXG4gICAgICAgICAgICBpbmZvID0gb3B0cy5tZXRhW21ldGFLZXldIHtvcHRzLCBub2RlLCBhcmdzOltdfVxuICAgICAgICAgICAgXG4gICAgaWYgbm9kZS5jb25kaXRpb24udmFyaWFibGU/LmJhc2U/LnZhbHVlPy5zdGFydHNXaXRoICfilrgnXG4gICAgICAgIFxuICAgICAgICBtZXRhS2V5ID0gbm9kZS5jb25kaXRpb24udmFyaWFibGUuYmFzZS52YWx1ZVxuICAgICAgICBpZiB0eXBlb2Ygb3B0cy5tZXRhW21ldGFLZXldID09ICdmdW5jdGlvbidcbiAgICAgICAgICAgIGFyZ3MgPSBub2RlLmNvbmRpdGlvbi5hcmdzLm1hcCAoYSkgLT4gXG4gICAgICAgICAgICAgICAgYS5iYXNlPy52YWx1ZVxuICAgICAgICAgICAgYXJncyA9IGFyZ3MubWFwIChhKSAtPiBpZiBhWzBdIGluIFsnXCInLCBcIidcIl0gdGhlbiBhWzEuLi0yXSBlbHNlIGFcbiAgICAgICAgICAgIGluZm8gPSBvcHRzLm1ldGFbbWV0YUtleV0ge29wdHMsIG5vZGUsIGFyZ3N9XG4gICAgICAgIFxuICAgIGlmIGluZm8uc2tpcCBcbiAgICAgICAgaWYgaW5mby5za2lwLndpdGg/XG4gICAgICAgICAgICByZXR1cm4gbm9kZS5tYWtlQ29kZSBpbmZvLnNraXAud2l0aFxuICAgICAgICByZXR1cm4gW11cbiAgICBcbiAgICBpZiBpbmZvLmV2YWxcbiAgICAgICAgXG4gICAgICAgIGNvbmQgPSBpbmZvLmNvZGUgPyBub2RlLmZyYWdtZW50c1RvVGV4dCBub2RlLmNvbmRpdGlvbi5jb21waWxlVG9GcmFnbWVudHMgb3B0cywgMiAjTEVWRUxfUEFSRU5cbiAgICAgICAgdHJ5XG4gICAgICAgICAgICBvcyA9IHJlcXVpcmUgJ29zJ1xuICAgICAgICAgICAgZnMgPSByZXF1aXJlICdmcydcbiAgICAgICAgICAgIGluZm8uYm9keSA9ISEgZXZhbCBjb25kXG4gICAgICAgICAgICBpZiBpbmZvLmV2YWwgYW5kIGluZm8ucmVkdWNlIGFuZCBub3QgaW5mby5ib2R5IGFuZCBub3Qgbm9kZS5lbHNlQm9keVxuICAgICAgICAgICAgICAgIHJldHVybiBbXVxuICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgIGVycm9yIGVyclxuICAgICAgICBcbiAgICBmcmFnID0gW11cbiAgICBcbiAgICBpZiBpbmZvLnJlZHVjZSA9PSBmYWxzZVxuICAgICAgICBmcmFnID0gZnJhZy5jb25jYXQgbm9kZS5tYWtlQ29kZShcImlmIChcIiksIG5vZGUubWFrZUNvZGUoaW5mby5jb2RlKSwgbm9kZS5tYWtlQ29kZShcIikge1xcblwiKVxuICAgICAgICBcbiAgICAgICAgaW5kZW50ID0gb3B0cy5pbmRlbnQgKyBUQUJcbiAgICAgICAgYm9keU9wdCA9IG1lcmdlIG9wdHMsIHtpbmRlbnR9XG4gICAgZWxzZVxuICAgICAgICBpbmRlbnQgPSBvcHRzLmluZGVudFxuICAgICAgICBib2R5T3B0ID0gb3B0c1xuXG4gICAgaWYgaW5mby5iZWZvcmVcbiAgICAgICAgZnJhZy5wdXNoIG5vZGUubWFrZUNvZGUgKGluZm8uYmxvY2shPWZhbHNlIGFuZCBpbmZvLmRlZGVudCE9dHJ1ZSBhbmQgaW5kZW50IG9yICcnKSArIGluZm8uYmVmb3JlXG4gICAgICAgIFxuICAgIGlmIGluZm8uYm9keVxuICAgICAgICBpZiBpbmZvLmJsb2NrICE9IGZhbHNlXG4gICAgICAgICAgICBib2R5ID0gbm9kZS5lbnN1cmVCbG9jayBub2RlLmJvZHlcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgbm9kZS5ib2R5IGluc3RhbmNlb2YgQmxvY2tcbiAgICAgICAgICAgICAgICBib2R5ID0gbm9kZS5ib2R5LmV4cHJlc3Npb25zWzBdXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgYm9keSA9IG5vZGUuYm9keVxuICAgICAgICBpZiBib2R5XG4gICAgICAgICAgICBmcmFnID0gZnJhZy5jb25jYXQgYm9keS5jb21waWxlVG9GcmFnbWVudHMgYm9keU9wdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBmcmFnLnB1c2ggbm9kZS5tYWtlQ29kZSBcIicnXCIgIyBpZiBpbmZvLmJsb2NrID09IGZhbHNlID8/P1xuICAgICAgICBcbiAgICBpZiBpbmZvLmFmdGVyXG4gICAgICAgIGZyYWcucHVzaCBub2RlLm1ha2VDb2RlICgoaW5mby5ibG9jayAhPSBmYWxzZSkgYW5kICgnXFxuJyArIGluZGVudCkgb3IgJycpICsgaW5mby5hZnRlclxuXG4gICAgaWYgbm90IGluZm8ucmVkdWNlXG4gICAgICAgIGZyYWcucHVzaCBub2RlLm1ha2VDb2RlKFwiXFxuI3tub2RlLnRhYn19XCIpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgIGlmIG5vZGUuZWxzZUJvZHkgYW5kIChpbmZvLnJlZHVjZSA9PSBmYWxzZSBvciBpbmZvLmJvZHkgPT0gZmFsc2UpXG4gICAgICAgIGZyYWcucHVzaCBub2RlLm1ha2VDb2RlICcgZWxzZSAnIGlmIG5vdCBpbmZvLnJlZHVjZVxuICAgICAgICBpZiBub2RlLmlzQ2hhaW5cbiAgICAgICAgICAgIGZyYWcgPSBmcmFnLmNvbmNhdCBub2RlLmVsc2VCb2R5LnVud3JhcCgpLmNvbXBpbGVUb0ZyYWdtZW50cyBib2R5T3B0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGZyYWcgPSBmcmFnLmNvbmNhdCBub2RlLmVsc2VCb2R5LmNvbXBpbGVUb0ZyYWdtZW50cyBib2R5T3B0XG4gICAgICAgIFxuICAgIHJldHVybiBmcmFnXG4gICAgXG4jIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgICAwMDAwMDAwICAgXG4jIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuXG5tZXRhTG9nID0gKG9wdHMpIC0+IG9wdHMubWV0YWxvZyA/ICdjb25zb2xlLmxvZydcblxubG9nU291cmNlID0gKG9wdHM6LGFyZ3M6LG5vZGU6LGNsb3NlOikgLT5cbiAgICBcbiAgICBjb2xvcmV0dGUgPSByZXF1aXJlICdjb2xvcmV0dGUnXG4gICAgeyB5ZWxsb3csIGJsdWUsIHllbGxvd0JyaWdodCwgYmx1ZUJyaWdodCwgd2hpdGVCcmlnaHQsIGRpbSwgYm9sZCwgZ3JheSB9ID0gY29sb3JldHRlLmNyZWF0ZUNvbG9ycyB1c2VDb2xvcjogb3B0cy5mZWF0dXJlLmNvbG9yXG4gICAgXG4gICAgc291cmNlID0gb3B0cy5zb3VyY2UgPyBvcHRzLmZpbGVuYW1lID8gJydcbiAgICBleHQgPSAnJ1xuICAgIGlmIHNvdXJjZVxuICAgICAgICBbc291cmNlLCBleHQuLi5dID0gcGF0aC5iYXNlbmFtZShzb3VyY2UpLnNwbGl0ICcuJ1xuICAgICAgICBzb3VyY2UgID0geWVsbG93IFt5ZWxsb3dCcmlnaHQoc291cmNlKSwgZGltIGV4dC5qb2luJy4nXS5qb2luIGRpbSAnLidcbiAgICBiZWZvcmUgID0gXCIje21ldGFMb2cob3B0cyl9KCcje3NvdXJjZX0je2RpbSBibHVlICc6J30je2JsdWVCcmlnaHQgXCIje25vZGUuY29uZGl0aW9uLmxvY2F0aW9uRGF0YS5maXJzdF9saW5lKzF9XCJ9J1wiXG4gICAgYmVmb3JlICs9IFwiLCAnI3tib2xkIHdoaXRlQnJpZ2h0IGFyZ3NbMF19J1wiIGlmIGFyZ3NbMF0gXG4gICAgaWYgKGNsb3NlKVxuICAgICAgICBiZWZvcmUgKz0gJyk7XFxuJ1xuICAgIGVsc2VcbiAgICAgICAgYmVmb3JlICs9IFwiLCBcIlxuXG4gICAgYmVmb3JlXG4gICAgICAgIFxuIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4jIDAwMCAgMDAwMCAgMDAwICAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiMgMDAwICAwMDAgMCAwMDAgICAgICAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4jIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICBcblxuaW5qZWN0TWV0YSA9IChvcHRpb25zKSAtPiAjIG1ha2Ugc3VyZSB0aGF0IG9wdGlvbnMgaGFzIGEgbWV0YSBzZXRcbiAgICBcbiAgICBvcHRpb25zID89IHt9XG4gICAgXG4gICAgeyBleHRlbmQgfSA9IGhlbHBlcnNcbiAgICBcbiAgICBkZWZhdWx0TWV0YSA9IHt9XG4gICAgTUVUQS5tYXAgKG0pIC0+IGRlZmF1bHRNZXRhW20ua2V5XSA9IG0ubWV0YTsgbS5tZXRhLmtleSA9IG0ua2V5OyBtLm1ldGEuaW5mbyA9IG0uaW5mb1xuICAgIFxuICAgIG1ldGEgICAgPSBleHRlbmQgZGVmYXVsdE1ldGEsIG9wdGlvbnMubWV0YSA/IHt9XG4gICAgb3B0aW9ucyA9IGV4dGVuZCB7IG1ldGE6IG1ldGEgfSwgb3B0aW9uc1xuICAgIG9wdGlvbnNcblxubG9nTWV0YXMgPSAtPlxuICAgIFxuICAgIGxvZyBcIiN7Z3JheSAnTWV0YXM6J31cXG5cXG4jeyBNRVRBLm1hcCgoZikgLT4gXCIgICAgI3toZWxwZXJzLnBhZCBmLmtleX0je2dyYXkgZi5kZXNjID8gXCIje2Yua2V5fSAuLi5cIn1cIikuam9pbignXFxuJykgfVwiXG4gICAgbG9nIFwiICAgIOKWuGlmICAgICAgICAgICAgICAgICAgICAgI3tncmF5ICfilrhpZiBjb25kIC4uLiBbW+KWuGVsaWYgY29uZCAuLi5dIOKWuGVsc2UgLi4uXSd9XFxuXCJcbiAgICBcbm1vZHVsZS5leHBvcnRzID0geyBNRVRBLCBpbmplY3RNZXRhLCBsb2dNZXRhcywgY29tcGlsZU1ldGFJZiB9XG4iXX0=
//# sourceURL=../coffee/meta.coffee