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
                                nodeInfos[nodeIndex].side = 'left';
                                nodeInfos[nodeIndex].vecOp = 'plus';
                                nodeInfos[nodeIndex].type = 'vec';
                            } else if (secondIsVec) {
                                nodeInfos[nodeIndex].side = 'right';
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
                                nodeInfos[nodeIndex].side = 'left';
                                nodeInfos[nodeIndex].vecOp = 'minus';
                                return nodeInfos[nodeIndex].type = 'vec';
                            } else if (secondIsVec) {
                                nodeInfos[nodeIndex].side = 'right';
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
                        if (info.value && !info.type) {
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
                                info.type = type;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YS5qcyIsInNvdXJjZVJvb3QiOiIuLi9jb2ZmZWUiLCJzb3VyY2VzIjpbIm1ldGEuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGlGQUFBO0lBQUE7OztBQVFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7QUFFUCxPQUFBLEdBQVUsT0FBQSxDQUFRLFdBQVI7O0FBQ1YsT0FBTyxDQUFDLE1BQVIsQ0FBQTs7QUFFQSxJQUFBLEdBQU87SUFRSDtRQUFBLEdBQUEsRUFBTSxNQUFOO1FBQ0EsSUFBQSxFQUFNLGNBRE47UUFFQSxJQUFBLEVBQU0sU0FBQyxJQUFEO0FBRUYsZ0JBQUE7WUFGRyx5Q0FBRyxNQUFHLDJDQUFHLE1BQUcsMkNBQUc7WUFFbEIsTUFBQSxHQUFZLHNEQUFILEdBQXNCLElBQUssQ0FBQSxDQUFBLENBQTNCLEdBQW1DO2dCQUFBLEtBQUEsRUFBTSxPQUFOO2dCQUFjLEdBQUEsRUFBSSxLQUFsQjtnQkFBd0IsSUFBQSxFQUFLLE1BQTdCO2dCQUFvQyxLQUFBLEVBQU0sT0FBMUM7O1lBRTVDLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUjtZQUNOLGFBQUYsRUFBTSxtQkFBTixFQUFhLG1CQUFiLEVBQW9CLG1DQUFwQixFQUFtQztZQUVuQyxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7WUFDUCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7WUFHUCxXQUFBLEdBQWMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBcEIsQ0FBd0IsU0FBQyxHQUFEO3VCQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFBbEIsQ0FBeEI7WUFBK0MsT0FBQSxDQUU3RCxHQUY2RCxDQUV6RCxXQUZ5RDtZQUU5QyxPQUFBLENBRWYsR0FGZSxDQUVYLDRCQUZXLEVBRWtCLElBQUksQ0FBQyxJQUFJLENBQUMsV0FGNUI7QUFJZjtBQUFBLGlCQUFBLHNDQUFBOztnQkFFSSxTQUFBLEdBQVk7Z0JBQ1osU0FBQSxH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MEUsQ0FBQyxJQUEzRSxDQUFnRixJQUFoRixDQUFGLENBQTNCO1dBQXFILE9BQUEsQ0FDcEgsR0FEb0gsQ0FDaEgsOEJBQUEsR0FBOEIsQ0FBQyxJQUFBLENBQUssMkNBQUwsQ0FBRCxDQUE5QixHQUFnRixJQURnQztBQUY3Rzs7QUFLWCxNQUFNLENBQUMsT0FBUCxHQUFpQjtJQUFFLE1BQUEsSUFBRjtJQUFRLFlBQUEsVUFBUjtJQUFvQixVQUFBLFFBQXBCO0lBQThCLGVBQUEsYUFBOUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwICAgICAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICBcbjAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICBcbjAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICBcbjAwMCAwIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICBcbjAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICBcbiMjI1xuXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcblxuaGVscGVycyA9IHJlcXVpcmUgJy4vaGVscGVycydcbmhlbHBlcnMuY29sb3JzKClcblxuTUVUQSA9IFtcblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgIDAwMCAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgICAgIDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgIFxuICAgIGtleTogICfilrh2ZWMnXG4gICAgZGVzYzogJ+KWuHZlYyhhLCAuLi4pJ1xuICAgIG1ldGE6IChhcmdzOixub2RlOixvcHRzOikgLT5cbiAgICAgICAgXG4gICAgICAgIGNvbmZpZyA9IGlmIGFyZ3NbMF0/LmRvdD8gdGhlbiBhcmdzWzBdIGVsc2UgdGltZXM6J3RpbWVzJyBkb3Q6J2RvdCcgcGx1czoncGx1cycgbWludXM6J21pbnVzJ1xuXG4gICAgICAgIG5vZGVzID0gcmVxdWlyZSAnLi9ub2RlcydcbiAgICAgICAgeyBPcCwgVmFsdWUsIEJsb2NrLCBOdW1iZXJMaXRlcmFsLCBJZGVudGlmaWVyTGl0ZXJhbCB9ID0gbm9kZXNcbiAgICAgICAgXG4gICAgICAgIG5vb24gPSByZXF1aXJlICdub29uJ1xuICAgICAgICBrc3RyID0gcmVxdWlyZSAna3N0cidcbiAgICAgICAgIyBsb2cgJ+KWuHZlYyBub2RlJyBub2RlLCBub29uLnN0cmluZ2lmeSBub2RlXG4gICAgICAgIFxuICAgICAgICBpZGVudGlmaWVycyA9IG5vZGUuY29uZGl0aW9uLmFyZ3MubWFwIChhcmcpIC0+IGFyZy5iYXNlLnZhbHVlXG5cbiAgICAgICAgbG9nIGlkZW50aWZpZXJzXG4gICAgICAgIFxuICAgICAgICBsb2cgJ+KWuHZlYyBub2RlLmJvZHkuZXhwcmVzc2lvbnMnIG5vZGUuYm9keS5leHByZXNzaW9ucyAjLCBub29uLnN0cmluZ2lmeSBleHBzXG4gICAgICAgIFxuICAgICAgICBmb3IgZXhwIGluIG5vZGUuYm9keS5leHByZXNzaW9uc1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBub2RlSW5mb3MgPSBbXVxuICAgICAgICAgICAgbm9kZUluZGV4ID0gLTFcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcHJlUGFyc2UgPSAobm9kZSkgLT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBub2RlIGluc3RhbmNlb2YgT3BcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICMgbG9nICfilrh2ZWMgY2hpbGQnIG5vZGVcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBmaXJzdElzVmFsdWUgID0gbm9kZS5maXJzdCAgaW5zdGFuY2VvZiBWYWx1ZSBcbiAgICAgICAgICAgICAgICAgICAgc2Vjb25kSXNWYWx1ZSA9IG5vZGUuc2Vjb25kIGluc3RhbmNlb2YgVmFsdWUgXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBmaXJzdElzVmVjICA9IGZpcnN0SXNWYWx1ZSBhbmQgbm9kZS5maXJzdC5iYXNlLnZhbHVlICBpbiBpZGVudGlmaWVyc1xuICAgICAgICAgICAgICAgICAgICBzZWNvbmRJc1ZlYyA9IHNlY29uZElzVmFsdWUgYW5kIG5vZGUuc2Vjb25kLmJhc2UudmFsdWUgaW4gaWRlbnRpZmllcnNcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vZGUub3BlcmF0b3IgPT0gJyonXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3NbKytub2RlSW5kZXhdID0ge25vZGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBmaXJzdElzVmVjIGFuZCBzZWNvbmRJc1ZlY1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIGxvZyAn4pa4dmVjIGRvdCcgbm9kZS5maXJzdC5iYXNlLnZhbHVlLCBub2RlLnNlY29uZC5iYXNlLnZhbHVlIFxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS52ZWNPcCA9ICdkb3QnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgID0gJ251bSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGZpcnN0SXNWZWNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBsb2cgJ+KWuHZlYyB0aW1lcycgbm9kZS5maXJzdC5iYXNlLnZhbHVlXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnNpZGUgID0gJ2xlZnQnXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIHNlY29uZElzVmFsdWUgYW5kIG5vZGUuc2Vjb25kLmJhc2UgaW5zdGFuY2VvZiBOdW1iZXJMaXRlcmFsIG9yIG5vZGUuc2Vjb25kLmJhc2UgaW5zdGFuY2VvZiBJZGVudGlmaWVyTGl0ZXJhbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAndGltZXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICA9ICd2ZWMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnZlY09wID0gJ3RpbWVzT3JEb3QnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgID0gJz8/PydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIHNlY29uZElzVmVjXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgbG9nICfilrh2ZWMgbHRpbWVzJyBub2RlLnNlY29uZC5iYXNlLnZhbHVlXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnNpZGUgID0gJ3JpZ2h0J1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBmaXJzdElzVmFsdWUgYW5kIG5vZGUuZmlyc3QuYmFzZSBpbnN0YW5jZW9mIE51bWJlckxpdGVyYWwgb3Igbm9kZS5maXJzdC5iYXNlIGluc3RhbmNlb2YgSWRlbnRpZmllckxpdGVyYWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnZlY09wID0gJ3RpbWVzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udHlwZSAgPSAndmVjJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS52ZWNPcCA9ICd0aW1lc09yRG90J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICA9ICc/Pz8nXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLm9wZXJhdG9yICA9ICcqJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgbm9kZS5vcGVyYXRvciA9PSAnKydcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zWysrbm9kZUluZGV4XSA9IHtub2RlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgZmlyc3RJc1ZlYyBhbmQgc2Vjb25kSXNWZWNcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBsb2cgJ+KWuHZlYyBwbHVzJyBub2RlLmZpcnN0LmJhc2UudmFsdWUsIG5vZGUuc2Vjb25kLmJhc2UudmFsdWUgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS52ZWNPcCA9ICdwbHVzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICA9ICd2ZWMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBmaXJzdElzVmVjXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnNpZGUgID0gJ2xlZnQnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnZlY09wID0gJ3BsdXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgID0gJ3ZlYydcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgc2Vjb25kSXNWZWNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0uc2lkZSAgPSAncmlnaHQnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnZlY09wID0gJ3BsdXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgID0gJ3ZlYydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLm9wZXJhdG9yICA9ICcrJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgbm9kZUluZm9zW25vZGVJbmRleF0udHlwZSAgICAgID0gJz8/PydcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgbm9kZS5vcGVyYXRvciA9PSAnLSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3NbKytub2RlSW5kZXhdID0ge25vZGV9XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGZpcnN0SXNWZWMgYW5kIHNlY29uZElzVmVjXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgbG9nICfilrh2ZWMgbWludXMnIG5vZGUuZmlyc3QuYmFzZS52YWx1ZSwgbm9kZS5zZWNvbmQuYmFzZS52YWx1ZSBcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAnbWludXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgID0gJ3ZlYydcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgZmlyc3RJc1ZlY1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS5zaWRlICA9ICdsZWZ0J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS52ZWNPcCA9ICdtaW51cydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udHlwZSAgPSAndmVjJ1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBzZWNvbmRJc1ZlY1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS5zaWRlICA9ICdyaWdodCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAnbWludXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgID0gJ3ZlYydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLm9wZXJhdG9yICA9ICctJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgbm9kZUluZm9zW25vZGVJbmRleF0udHlwZSAgICAgID0gJz8/PydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vZGUuY29uc3RydWN0b3IubmFtZSA9PSAnVmFsdWUnXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3NbKytub2RlSW5kZXhdID0ge25vZGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAjIGxvZyBub2RlXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBub3Qgbm9kZS5iYXNlLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0uYm9keSA9IG5vZGUuYmFzZS5ib2R5Py5leHByZXNzaW9ucz9bMF0/LmNvbnN0cnVjdG9yLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmFsdWUgPSBub2RlLmJhc2UudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIG5vZGUuYmFzZS52YWx1ZSBpbiBpZGVudGlmaWVyc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgPSAndmVjJ1xuICAgICAgICAgICAgICAgICAgICAgICAgIyBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlID0gJz8/PydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgIyBsb2cgJ25vZGU/JyBub2RlLmNvbnN0cnVjdG9yLm5hbWVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcHJlUGFyc2UgZXhwXG4gICAgICAgICAgICBleHAudHJhdmVyc2VDaGlsZHJlbiB0cnVlLCBwcmVQYXJzZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBub2RlQXJyYXkgPSBub2RlSW5mb3MubWFwIChpKSAtPiBuID0gaS5ub2RlOyBkZWxldGUgaS5ub2RlOyBuXG4gICAgXG4gICAgICAgICAgICAjIGxvZyBub29uLnN0cmluZ2lmeSBub2RlSW5mb3NcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIGluZGV4IGluIG5vZGVJbmZvcy5sZW5ndGgtMS4uMFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGluZm8gPSBub2RlSW5mb3NbaW5kZXhdXG4gICAgICAgICAgICAgICAgbmQgICA9IG5vZGVBcnJheVtpbmRleF1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBpbmZvLnZlY09wXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBvdGhlck5vZGUgPSBpZiBpbmZvLnNpZGUgPT0gJ2xlZnQnIHRoZW4gbmQuc2Vjb25kIGVsc2UgbmQuZmlyc3RcbiAgICAgICAgICAgICAgICAgICAgdmVjTm9kZSAgID0gaWYgaW5mby5zaWRlID09ICdsZWZ0JyB0aGVuIG5kLmZpcnN0IGVsc2UgbmQuc2Vjb25kXG4gICAgICAgICAgICAgICAgICAgIG90aGVySW5kZXggPSBub2RlQXJyYXkuaW5kZXhPZiBvdGhlck5vZGVcbiAgICAgICAgICAgICAgICAgICAgdmVjSW5kZXggICA9IG5vZGVBcnJheS5pbmRleE9mIHZlY05vZGVcbiAgICAgICAgICAgICAgICAgICAgb3RoZXJJbmZvICA9IG5vZGVJbmZvc1tvdGhlckluZGV4XVxuICAgICAgICAgICAgICAgICAgICB2ZWNJbmZvICAgID0gbm9kZUluZm9zW3ZlY0luZGV4XVxuICAgICAgICAgICAgICAgICAgICBpZiBpbmZvLnZlY09wID09ICd0aW1lc09yRG90J1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgb3RoZXJJbmZvLnR5cGUgPT0gJ251bSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnZlY09wID0gJ3RpbWVzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udHlwZSAgPSAndmVjJyBcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgb3RoZXJJbmZvLnR5cGUgPT0gJ3ZlYydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnZlY09wID0gJ2RvdCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnR5cGUgID0gJ251bScgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGxvZyBrc3RyLmxwYWQoaW5kZXgsIDMpLCBpbmZvLnR5cGUsIFwiI3t2ZWNOb2RlLmJhc2UudmFsdWV9LiN7aW5mby52ZWNPcH0oI3tvdGhlckluZGV4fSlcIlxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBlbHNlIGlmIGluZm8ub3BlcmF0b3JcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGZpcnN0SW5kZXggID0gbm9kZUFycmF5LmluZGV4T2YgbmQuZmlyc3RcbiAgICAgICAgICAgICAgICAgICAgc2Vjb25kSW5kZXggPSBub2RlQXJyYXkuaW5kZXhPZiBuZC5zZWNvbmRcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGZpcnN0VHlwZSAgPSBmaXJzdEluZGV4ICA8IDAgYW5kICdudW0nIG9yIG5vZGVJbmZvc1tmaXJzdEluZGV4XS50eXBlXG4gICAgICAgICAgICAgICAgICAgIHNlY29uZFR5cGUgPSBzZWNvbmRJbmRleCA8IDAgYW5kICdudW0nIG9yIG5vZGVJbmZvc1tzZWNvbmRJbmRleF0udHlwZVxuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiBmaXJzdFR5cGUgPT0gJ3ZlYycgPT0gc2Vjb25kVHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby52ZWNPcCA9ICdkb3QnXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnR5cGUgPSAnbnVtJ1xuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGZpcnN0VHlwZSA9PSAndmVjJyBhbmQgc2Vjb25kVHlwZSA9PSAnbnVtJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby52ZWNPcCA9ICd0aW1lcydcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udHlwZSA9ICd2ZWMnXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnNpZGUgPSAnbGVmdCdcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBmaXJzdFR5cGUgPT0gJ251bScgYW5kIHNlY29uZFR5cGUgPT0gJ3ZlYydcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udmVjT3AgPSAndGltZXMnXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnR5cGUgPSAndmVjJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5zaWRlID0gJ3JpZ2h0J1xuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGZpcnN0VHlwZSA9PSAnbnVtJyA9PSBzZWNvbmRUeXBlXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnR5cGUgPSAnbnVtJ1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgaW5mby52ZWNPcFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgaW5mby5zaWRlICE9ICdyaWdodCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2cga3N0ci5scGFkKGluZGV4LCAzKSwgaW5mby50eXBlLCBmaXJzdEluZGV4LCBpbmZvLnZlY09wLCBzZWNvbmRJbmRleCAjLCBpbmZvXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZyBrc3RyLmxwYWQoaW5kZXgsIDMpLCBpbmZvLnR5cGUsIHNlY29uZEluZGV4LCBpbmZvLnZlY09wLCBmaXJzdEluZGV4ICMsIGluZm9cbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgbG9nIGtzdHIubHBhZChpbmRleCwgMyksIGluZm8udHlwZSwgZmlyc3RJbmRleCwgaW5mby5vcGVyYXRvciwgc2Vjb25kSW5kZXggIywgaW5mb1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAjIGlmIGluZm8udmFsdWUgYW5kIChub3QgaW5mby50eXBlIG9yIGluZm8udHlwZSA9PSAnPz8/JylcbiAgICAgICAgICAgICAgICAgICAgaWYgaW5mby52YWx1ZSBhbmQgbm90IGluZm8udHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBuZC5iYXNlIGluc3RhbmNlb2YgSWRlbnRpZmllckxpdGVyYWwgdGhlbiBpbmZvLnR5cGUgPSAnbnVtJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbmQuYmFzZSBpbnN0YW5jZW9mIE51bWJlckxpdGVyYWwgICAgIHRoZW4gaW5mby50eXBlID0gJ251bSdcbiAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiBpbmZvLnR5cGUgaW4gWydudW0nICd2ZWMnXVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2cga3N0ci5scGFkKGluZGV4LCAzKSwgaW5mby50eXBlLCBuZC5iYXNlLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBpbmZvLmJvZHkgPT0gJ09wJ1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBib2R5SW5kZXggPSBub2RlQXJyYXkuaW5kZXhPZiBuZC5iYXNlPy5ib2R5Py5leHByZXNzaW9uc1swXVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiB0eXBlID0gbm9kZUluZm9zW2JvZHlJbmRleF0/LnR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIGlmIHR5cGUgIT0gJz8/PydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnR5cGUgPSB0eXBlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZyBrc3RyLmxwYWQoaW5kZXgsIDMpLCBpbmZvLnR5cGUsIGJvZHlJbmRleFxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZyBrc3RyLmxwYWQoaW5kZXgsIDMpLCBpbmZvLnR5cGUsIGluZm8jLCBuZFxuICAgIFxuICAgICAgICAgICAgIyBsb2cgbm9vbi5zdHJpbmdpZnkgbm9kZUluZm9zXG4gICAgICAgICAgICAjIGxvZyBub29uLnN0cmluZ2lmeSBub2RlQXJyYXlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmVzb2x2ZSA9IChub2RlSW5kZXgpIC0+XG4gICAgXG4gICAgICAgICAgICAgICAgaW5mbyA9IG5vZGVJbmZvc1tub2RlSW5kZXhdXG4gICAgICAgICAgICAgICAgbmQgPSBub2RlQXJyYXlbbm9kZUluZGV4XVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICMgbG9nIG5vZGVJbmRleCwgaW5mbyMsIG5kXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgaW5mby52ZWNPcFxuICAgICAgICAgICAgICAgICAgICB2biA9IGlmIGluZm8uc2lkZSA9PSAncmlnaHQnIHRoZW4gbmQuc2Vjb25kIGVsc2UgbmQuZmlyc3RcbiAgICAgICAgICAgICAgICAgICAgcG4gPSBpZiBpbmZvLnNpZGUgPT0gJ3JpZ2h0JyB0aGVuIG5kLmZpcnN0IGVsc2UgbmQuc2Vjb25kXG4gICAgICAgICAgICAgICAgICAgIG9pID0gbm9kZUFycmF5LmluZGV4T2YgcG5cbiAgICAgICAgICAgICAgICAgICAgb3AgPSBpbmZvLnZlY09wXG4gICAgICAgICAgICAgICAgICAgIFwiI3t2bi5iYXNlPy52YWx1ZSA/IHJlc29sdmUgbm9kZUFycmF5LmluZGV4T2Ygdm59LiN7b3B9KCN7cmVzb2x2ZSBvaX0pXCJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIGluZm8ub3BlcmF0b3JcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RJbmRleCAgPSBub2RlQXJyYXkuaW5kZXhPZiBuZC5maXJzdFxuICAgICAgICAgICAgICAgICAgICBzZWNvbmRJbmRleCA9IG5vZGVBcnJheS5pbmRleE9mIG5kLnNlY29uZFxuICAgICAgICAgICAgICAgICAgICBvcCA9IGluZm8ub3BlcmF0b3JcbiAgICAgICAgICAgICAgICAgICAgXCIje3Jlc29sdmUgZmlyc3RJbmRleH0gI3tvcH0gI3tyZXNvbHZlIHNlY29uZEluZGV4fVwiXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBuZD8uYmFzZT8udmFsdWUgPyByZXNvbHZlIG5vZGVBcnJheS5pbmRleE9mIG5kLmJhc2UuYm9keS5leHByZXNzaW9uc1swXVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgbG9nIHJlc29sdmUgMFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAjIGZyYWcgPSBib2R5LmNvbXBpbGVUb0ZyYWdtZW50cyBvcHRzXG4gICAgICAgICMgY29uc29sZS5sb2cgJ+KWuHZlYyBmcmFnJyBmcmFnXG4gICAgICAgIGRlZGVudDogdHJ1ZVxuICAgICAgICByZWR1Y2U6IHRydWVcbiAgICAgICAgYm9keTogICB0cnVlXG4gICAgICAgIGJsb2NrOiAgdHJ1ZVxuLCAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAwMCAgICAwMDAwMDAwICBcblxuICAgIGRvYzog4pa4ZG9jICfilrhkb2MnXG4gICAgICAgIFxuICAgICAgICBUaGlzIGlzIGEgc2xpZ2h0bHkgc3BlY2lhbCBtYWNybywgYmVjYXVzZSBpdCdzIGZpcnN0IHBhc3MgaXMgaGFyZGNvZGVkIGluIHRoZSB0b2tlbml6ZXIuXG4gICAgICAgIFRoZSBib2R5IG9mIHRoZSBtYWNybyBpcyB3cmFwcGVkIGluIGEgc2tpbm55IHRyaXBsZSBzdHJpbmcgYmVmb3JlIGZ1cnRoZXIgdG9rZW5pemF0aW9uLlxuICAgICAgICBJdCBjYW4gY29udGFpbiBhbnl0aGluZyBleGNlcHQgXFwnXFwnXFwnLlxuICAgICAgICBcbiAgICAgICAgSW4gbm9ybWFsIG9wZXJhdGlvbiwgaXQgaXMgcmVkdWNlZCB0byB0aGUgZW1wdHkgc3RyaW5nLiBcbiAgICAgICAgQnV0IGlmICoqa29mZmVlKiogaXMgY2FsbGVkIHdpdGggdGhlIGAtLWRvY2AgYXJndW1lbnQsIGxvZ3Mgd2lsbCBiZSBpbnNlcnRlZCBpbnN0ZWFkLlxuICAgICAgICBcbiAgICAgICAgYGBgY29mZmVlc2NyaXB0XG4gICAgICAgIOKWuGRvYyAndGl0bGUnXG4gICAgICAgICAgICBteSBkb2N1bWVudGF0aW9uIC4uLlxuICAgICAgICBsb2cgJ3NvbWUgY29kZSdcbiAgICAgICAg4pa4ZG9jXG4gICAgICAgICAgICB3ZSBhcmUgZG9uZS5cbiAgICAgICAgYGBgXG4gICAgICAgIFxuICAgICAgICBga29mZmVlIC0tZG9jIGZpbGVgIHdpbGwgb3V0cHV0XG4gICAgICAgIFxuICAgICAgICBgYGBtYXJrZG93blxuICAgICAgICAjIyB0aXRsZVxuICAgICAgICBteSBkb2N1bWVudGF0aW9uIC4uLlxuICAgICAgICBzb21lIGNvZGVcbiAgICAgICAgd2UgYXJlIGRvbmUuXG4gICAgICAgIGBgYFxuICAgICAgICBcbiAgICAgICAgYnV0IGBrb2ZmZWUgZmlsZWAgd2lsbCBvbmx5IHByaW50IGBzb21lIGNvZGVgXG4gICAgICAgIFxuICAgIGtleTogICfilrhkb2MnXG4gICAgZGVzYzogJ+KWuGRvYyBbaGVhZGVyXSAuLi4nXG4gICAgbWV0YTogKGFyZ3M6LG5vZGU6LG9wdHM6KSAtPlxuICAgICAgICBoZWFkZXIgPSBhcmdzWzBdIGFuZCBcIicjIyAje2FyZ3NbMF19XFxcXG4nK1wiIG9yIFwiJycrXCJcbiAgICAgICAgYmVmb3JlOiBvcHRzLmRvYyBhbmQgXCIje21ldGFMb2cob3B0cyl9KCN7aGVhZGVyfVwiXG4gICAgICAgIGFmdGVyOiAgXCIpXCJcbiAgICAgICAgc2tpcDogICBub3Qgb3B0cy5kb2MgYW5kIHdpdGg6XCInJ1wiXG4gICAgICAgIHJlZHVjZTogdHJ1ZVxuICAgICAgICBib2R5OiAgIHRydWVcbiAgICAgICAgYmxvY2s6ICBmYWxzZVxuLCAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBrZXk6ICAn4pa4cHJvZmlsZScgICBcbiAgICBkZXNjOiAn4pa4cHJvZmlsZSBbaWRdIC4uLidcbiAgICBtZXRhOiAoYXJnczosbm9kZTosb3B0czopIC0+IFxuICAgICAgICBcbiAgICAgICAgaWQgPSBcIiN7bm9kZS5jb25kaXRpb24ubG9jYXRpb25EYXRhLmZpcnN0X2xpbmUrMX1fI3tub2RlLmNvbmRpdGlvbi5sb2NhdGlvbkRhdGEuZmlyc3RfY29sdW1ufVwiXG4gICAgICAgIG5hbWUgPSBhcmdzWzBdID8gaWRcbiAgICAgICAgY29kZTogICBcImtvZmZlZV8je2lkfSA9IHByb2Nlc3MuaHJ0aW1lLmJpZ2ludCgpXCJcbiAgICAgICAgYWZ0ZXI6ICBcIiN7bWV0YUxvZyhvcHRzKX0oJyN7bmFtZX0nLCAoZnVuY3Rpb24oYil7IGxldCBmPTEwMDBuOyBmb3IgKGxldCB1IG9mIFsnbnMnLCfOvHMnLCdtcycsJ3MnXSkgeyBpZiAodT09J3MnIHx8IGI8ZikgeyByZXR1cm4gJycrKDEwMDBuKmIvZikrJyAnK3U7IH0gZio9MTAwMG47IH19KShwcm9jZXNzLmhydGltZS5iaWdpbnQoKS1rb2ZmZWVfI3tpZH0pKTtcIlxuICAgICAgICByZWR1Y2U6IGZhbHNlXG4gICAgICAgIGJvZHk6ICAgdHJ1ZVxuLFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAgICAwICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBrZXk6ICAn4pa4YXZlcmFnZScgICBcbiAgICBkZXNjOiAn4pa4YXZlcmFnZSBudW0gLi4uJ1xuICAgIG1ldGE6IChhcmdzOixub2RlOixvcHRzOikgLT4gXG4gICAgICAgIFxuICAgICAgICBpZCAgPSBcIiN7bm9kZS5jb25kaXRpb24ubG9jYXRpb25EYXRhLmZpcnN0X2xpbmUrMX1fI3tub2RlLmNvbmRpdGlvbi5sb2NhdGlvbkRhdGEuZmlyc3RfY29sdW1ufVwiXG4gICAgICAgIG51bSA9IGFyZ3NbMF0gPyAxMDBcbiAgICAgICAgYmVmb3JlOiAgXCJcIlwiXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGtvZmZlZV8je2lkfSA9IDBuO1xuICAgICAgICAgICAgZm9yKGkgPSAwOyBpIDwgI3tudW19OyBpKyspIFxuICAgICAgICAgICAgeyBcbiAgICAgICAgICAgICAgICBrb2ZmZWVfI3tpZH1fc3RhcnQgPSBwcm9jZXNzLmhydGltZS5iaWdpbnQoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgIGFmdGVyOiBcIlwiXCJcbiAgICAgICAgICAgIGtvZmZlZV8je2lkfSArPSBwcm9jZXNzLmhydGltZS5iaWdpbnQoKSAtIGtvZmZlZV8je2lkfV9zdGFydDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBrb2ZmZWVfI3tpZH0gLz0gI3tudW19bjtcbiAgICAgICAgICAgICN7bWV0YUxvZyhvcHRzKX0oJyN7aWR9JywgKGZ1bmN0aW9uKGIpeyBsZXQgZj0xMDAwbjsgZm9yIChsZXQgdSBvZiBbJ25zJywnzrxzJywnbXMnLCdzJ10pIHsgaWYgKHU9PSdzJyB8fCBiPGYpIHsgcmV0dXJuICcnKygxMDAwbipiL2YpKycgJyt1OyB9IGYqPTEwMDBuOyB9fSkoa29mZmVlXyN7aWR9KSk7IFxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgIHJlZHVjZTogdHJ1ZVxuICAgICAgICBib2R5OiAgIHRydWVcbixcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAgMDAwICAgICBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAga2V5OiAgJ+KWuHN0YXJ0JyAgIFxuICAgIGRlc2M6ICfilrhzdGFydCBpZCAuLi4nXG4gICAgaW5mbzpcbiAgICAgICAgdGhlbjogdHJ1ZVxuICAgICAgICBhcmdzOiAxXG4gICAgbWV0YTogKGFyZ3M6KSAtPiBcbiAgICAgICAgaWQgPSBhcmdzWzBdID8gJ3N0YXJ0X2VuZCdcbiAgICAgICAgYmVmb3JlOiBcImtvZmZlZV8je2lkfSA9IHByb2Nlc3MuaHJ0aW1lLmJpZ2ludCgpXCJcbiAgICAgICAgcmVkdWNlOiB0cnVlXG4gICAgICAgIGJvZHk6ICAgZmFsc2VcbixcbiAgICBrZXk6ICAn4pa4ZW5kJyAgICAgXG4gICAgZGVzYzogJ+KWuGVuZCBpZCAuLi4nXG4gICAgaW5mbzpcbiAgICAgICAgdGhlbjogdHJ1ZVxuICAgICAgICBhcmdzOiAxXG4gICAgbWV0YTogKGFyZ3M6LG9wdHM6KSAtPiBcbiAgICAgICAgaWQgPSBhcmdzWzBdID8gJ3N0YXJ0X2VuZCdcbiAgICAgICAgYmVmb3JlOiBcIiN7bWV0YUxvZyhvcHRzKX0oJyN7aWR9JywgKGZ1bmN0aW9uKGIpeyBsZXQgZj0xMDAwbjsgZm9yIChsZXQgdSBvZiBbJ25zJywnzrxzJywnbXMnLCdzJ10pIHsgaWYgKHU9PSdzJyB8fCBiPGYpIHsgcmV0dXJuICcnKygxMDAwbipiL2YpKycgJyt1OyB9IGYqPTEwMDBuOyB9fSkocHJvY2Vzcy5ocnRpbWUuYmlnaW50KCkta29mZmVlXyN7aWR9KSk7XCJcbiAgICAgICAgcmVkdWNlOiB0cnVlXG4gICAgICAgIGJvZHk6ICAgZmFsc2VcbiwgICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBrZXk6ICAn4pa4ZGJnJyAgICBcbiAgICBkZXNjOiAn4pa4ZGJnIFttc2ddIC4uLidcbiAgICBpbmZvOlxuICAgICAgICB0aGVuOiB0cnVlICMgc2hvdWxkIG5vdCBiZSB1c2VkIHdpdGggYSBibG9ja1xuICAgICAgICBhcmdzOiAxXG4gICAgbWV0YTogKG9wdHM6LGFyZ3M6LG5vZGU6KSAtPlxuICAgICAgICBiZWZvcmU6IGxvZ1NvdXJjZSB7b3B0cywgYXJncywgbm9kZX1cbiAgICAgICAgYWZ0ZXI6ICAnKSdcbiAgICAgICAgcmVkdWNlOiB0cnVlXG4gICAgICAgIGJvZHk6ICAgdHJ1ZVxuICAgICAgICBibG9jazogIGZhbHNlXG4sICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAga2V5OiAgJ+KWuGFzc2VydCcgICAgXG4gICAgZGVzYzogJ+KWuGFzc2VydCBbbXNnXSAuLi4nXG4gICAgbWV0YTogKG9wdHM6LGFyZ3M6LG5vZGU6KSAtPlxuICAgICAgICBcbiAgICAgICAgbm9kZXMgPSByZXF1aXJlICcuL25vZGVzJ1xuICAgICAgICB7IEJsb2NrLCBleHRlbmQgfSA9IG5vZGVzXG4gICAgICAgIGlmIG5vZGUuYm9keSBpbnN0YW5jZW9mIEJsb2NrXG4gICAgICAgICAgICBib2R5ID0gbm9kZS5ib2R5LmV4cHJlc3Npb25zWzBdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGJvZHkgPSBub2RlLmJvZHlcbiAgICAgICAgICAgIFxuICAgICAgICBmcmFnID0gYm9keS5jb21waWxlVG9GcmFnbWVudHMgb3B0c1xuICAgICAgICB0ZXh0ID0gbm9kZS5mcmFnbWVudHNUb1RleHQgZnJhZ1xuICAgICAgICBhcmdzID0gWydhc3NlcnRpb24gZmFpbHVyZSEnXSBpZiBub3QgYXJncy5sZW5ndGhcbiAgICAgICAgYmVmb3JlOiBsb2dTb3VyY2Uge29wdHMsIGFyZ3MsIG5vZGUsIGNsb3NlOnRydWV9XG4gICAgICAgIGFmdGVyOiAgJ3Byb2Nlc3MuZXhpdCg2NjYpOydcbiAgICAgICAgdGhlbjogICB0cnVlICMgc2hvdWxkIG5vdCBiZSB1c2VkIHdpdGggYSBibG9ja1xuICAgICAgICBldmFsOiAgIGZhbHNlXG4gICAgICAgIHJlZHVjZTogZmFsc2VcbiAgICAgICAgY29kZTogICBcIiEoI3t0ZXh0fSlcIlxuLCAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgICAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgXG4gICAga2V5OiAgJ+KWuHRlc3QnXG4gICAgZGVzYzogJ+KWuHRlc3QgW2lkXSAuLi4nXG4gICAgbWV0YTogKG9wdHM6LGFyZ3M6LG5vZGU6KSAtPlxuICAgICAgICBiZWZvcmUgID0gbG9nU291cmNlIHtvcHRzLCBhcmdzLCBub2RlLCBjbG9zZTp0cnVlfVxuICAgICAgICBiZWZvcmUgKz0gJ1xcbiAgICB0cnkge1xcbidcbiAgICAgICAgZGVkZW50OiB0cnVlXG4gICAgICAgIGJlZm9yZTogb3B0cy50ZXN0IGFuZCBiZWZvcmVcbiAgICAgICAgYWZ0ZXI6ICBvcHRzLnRlc3QgYW5kIFwifSBjYXRjaChlcnIpIHsgI3ttZXRhTG9nKG9wdHMpfShlcnIubWVzc2FnZSk7IH1cXG5cIlxuICAgICAgICBza2lwOiAgIG5vdCBvcHRzLnRlc3RcbiAgICAgICAgcmVkdWNlOiB0cnVlXG4gICAgICAgIGJvZHk6ICAgdHJ1ZVxuLCAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBrZXk6ICfilrhyYW5kJyAgICBcbiAgICBtZXRhOiAoYXJnczopIC0+IFxuICAgICAgICBjb2RlOiAgIFwiTWF0aC5yYW5kb20oKSA8ICN7YXJncz9bMF0gPyAwLjV9XCIgXG4gICAgICAgIHJlZHVjZTogZmFsc2UgXG4gICAgICAgIGJvZHk6ICAgdHJ1ZSAgIFxuICAgIFxuICAgICMga2V5OiAndG9rZW4nICdwYXJzZScgJ2NvZGUnXG5dXG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG5cblRBQiA9ICcgICAgJ1xuXG5jb21waWxlTWV0YUlmID0gKG5vZGU6LG9wdHM6KSAtPlxuXG4gICAgbm9kZXMgPSByZXF1aXJlICcuL25vZGVzJ1xuICAgIFxuICAgIHsgQmxvY2ssIEFzc2lnbiwgVmFsdWUsIExpdGVyYWwgfSA9IG5vZGVzXG4gICAgeyBleHRlbmQsIG1lcmdlIH0gPSBoZWxwZXJzXG4gICAgICAgIFxuICAgIGluZm8gPSByZWR1Y2U6dHJ1ZSwgZXZhbDp0cnVlXG4gICAgXG4gICAgaWYgbm9kZS5jb25kaXRpb24uYmFzZT8udmFsdWU/LnN0YXJ0c1dpdGggJ+KWuCdcbiAgICAgICAgXG4gICAgICAgIG1ldGFLZXkgPSBub2RlLmNvbmRpdGlvbi5iYXNlLnZhbHVlXG4gICAgICAgIGlmIHR5cGVvZiBvcHRzLm1ldGFbbWV0YUtleV0gPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgaW5mbyA9IG9wdHMubWV0YVttZXRhS2V5XSB7b3B0cywgbm9kZSwgYXJnczpbXX1cbiAgICAgICAgICAgIFxuICAgIGlmIG5vZGUuY29uZGl0aW9uLnZhcmlhYmxlPy5iYXNlPy52YWx1ZT8uc3RhcnRzV2l0aCAn4pa4J1xuICAgICAgICBcbiAgICAgICAgbWV0YUtleSA9IG5vZGUuY29uZGl0aW9uLnZhcmlhYmxlLmJhc2UudmFsdWVcbiAgICAgICAgaWYgdHlwZW9mIG9wdHMubWV0YVttZXRhS2V5XSA9PSAnZnVuY3Rpb24nXG4gICAgICAgICAgICBhcmdzID0gbm9kZS5jb25kaXRpb24uYXJncy5tYXAgKGEpIC0+IFxuICAgICAgICAgICAgICAgIGEuYmFzZT8udmFsdWVcbiAgICAgICAgICAgIGFyZ3MgPSBhcmdzLm1hcCAoYSkgLT4gaWYgYVswXSBpbiBbJ1wiJywgXCInXCJdIHRoZW4gYVsxLi4tMl0gZWxzZSBhXG4gICAgICAgICAgICBpbmZvID0gb3B0cy5tZXRhW21ldGFLZXldIHtvcHRzLCBub2RlLCBhcmdzfVxuICAgICAgICBcbiAgICBpZiBpbmZvLnNraXAgXG4gICAgICAgIGlmIGluZm8uc2tpcC53aXRoP1xuICAgICAgICAgICAgcmV0dXJuIG5vZGUubWFrZUNvZGUgaW5mby5za2lwLndpdGhcbiAgICAgICAgcmV0dXJuIFtdXG4gICAgXG4gICAgaWYgaW5mby5ldmFsXG4gICAgICAgIFxuICAgICAgICBjb25kID0gaW5mby5jb2RlID8gbm9kZS5mcmFnbWVudHNUb1RleHQgbm9kZS5jb25kaXRpb24uY29tcGlsZVRvRnJhZ21lbnRzIG9wdHMsIDIgI0xFVkVMX1BBUkVOXG4gICAgICAgIHRyeVxuICAgICAgICAgICAgb3MgPSByZXF1aXJlICdvcydcbiAgICAgICAgICAgIGZzID0gcmVxdWlyZSAnZnMnXG4gICAgICAgICAgICBpbmZvLmJvZHkgPSEhIGV2YWwgY29uZFxuICAgICAgICAgICAgaWYgaW5mby5ldmFsIGFuZCBpbmZvLnJlZHVjZSBhbmQgbm90IGluZm8uYm9keSBhbmQgbm90IG5vZGUuZWxzZUJvZHlcbiAgICAgICAgICAgICAgICByZXR1cm4gW11cbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICBlcnJvciBlcnJcbiAgICAgICAgXG4gICAgZnJhZyA9IFtdXG4gICAgXG4gICAgaWYgaW5mby5yZWR1Y2UgPT0gZmFsc2VcbiAgICAgICAgZnJhZyA9IGZyYWcuY29uY2F0IG5vZGUubWFrZUNvZGUoXCJpZiAoXCIpLCBub2RlLm1ha2VDb2RlKGluZm8uY29kZSksIG5vZGUubWFrZUNvZGUoXCIpIHtcXG5cIilcbiAgICAgICAgXG4gICAgICAgIGluZGVudCA9IG9wdHMuaW5kZW50ICsgVEFCXG4gICAgICAgIGJvZHlPcHQgPSBtZXJnZSBvcHRzLCB7aW5kZW50fVxuICAgIGVsc2VcbiAgICAgICAgaW5kZW50ID0gb3B0cy5pbmRlbnRcbiAgICAgICAgYm9keU9wdCA9IG9wdHNcblxuICAgIGlmIGluZm8uYmVmb3JlXG4gICAgICAgIGZyYWcucHVzaCBub2RlLm1ha2VDb2RlIChpbmZvLmJsb2NrIT1mYWxzZSBhbmQgaW5mby5kZWRlbnQhPXRydWUgYW5kIGluZGVudCBvciAnJykgKyBpbmZvLmJlZm9yZVxuICAgICAgICBcbiAgICBpZiBpbmZvLmJvZHlcbiAgICAgICAgaWYgaW5mby5ibG9jayAhPSBmYWxzZVxuICAgICAgICAgICAgYm9keSA9IG5vZGUuZW5zdXJlQmxvY2sgbm9kZS5ib2R5XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIG5vZGUuYm9keSBpbnN0YW5jZW9mIEJsb2NrXG4gICAgICAgICAgICAgICAgYm9keSA9IG5vZGUuYm9keS5leHByZXNzaW9uc1swXVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGJvZHkgPSBub2RlLmJvZHlcbiAgICAgICAgaWYgYm9keVxuICAgICAgICAgICAgZnJhZyA9IGZyYWcuY29uY2F0IGJvZHkuY29tcGlsZVRvRnJhZ21lbnRzIGJvZHlPcHRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZnJhZy5wdXNoIG5vZGUubWFrZUNvZGUgXCInJ1wiICMgaWYgaW5mby5ibG9jayA9PSBmYWxzZSA/P1xuICAgICAgICBcbiAgICBpZiBpbmZvLmFmdGVyXG4gICAgICAgIGZyYWcucHVzaCBub2RlLm1ha2VDb2RlICgoaW5mby5ibG9jayAhPSBmYWxzZSkgYW5kICgnXFxuJyArIGluZGVudCkgb3IgJycpICsgaW5mby5hZnRlclxuXG4gICAgaWYgbm90IGluZm8ucmVkdWNlXG4gICAgICAgIGZyYWcucHVzaCBub2RlLm1ha2VDb2RlKFwiXFxuI3tub2RlLnRhYn19XCIpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgIGlmIG5vZGUuZWxzZUJvZHkgYW5kIChpbmZvLnJlZHVjZSA9PSBmYWxzZSBvciBpbmZvLmJvZHkgPT0gZmFsc2UpXG4gICAgICAgIGZyYWcucHVzaCBub2RlLm1ha2VDb2RlICcgZWxzZSAnIGlmIG5vdCBpbmZvLnJlZHVjZVxuICAgICAgICBpZiBub2RlLmlzQ2hhaW5cbiAgICAgICAgICAgIGZyYWcgPSBmcmFnLmNvbmNhdCBub2RlLmVsc2VCb2R5LnVud3JhcCgpLmNvbXBpbGVUb0ZyYWdtZW50cyBib2R5T3B0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGZyYWcgPSBmcmFnLmNvbmNhdCBub2RlLmVsc2VCb2R5LmNvbXBpbGVUb0ZyYWdtZW50cyBib2R5T3B0XG4gICAgICAgIFxuICAgIHJldHVybiBmcmFnXG4gICAgXG4jIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgICAwMDAwMDAwICAgXG4jIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuXG5tZXRhTG9nID0gKG9wdHMpIC0+IG9wdHMubWV0YWxvZyA/ICdjb25zb2xlLmxvZydcblxubG9nU291cmNlID0gKG9wdHM6LGFyZ3M6LG5vZGU6LGNsb3NlOikgLT5cbiAgICBcbiAgICBjb2xvcmV0dGUgPSByZXF1aXJlICdjb2xvcmV0dGUnXG4gICAgeyB5ZWxsb3csIGJsdWUsIHllbGxvd0JyaWdodCwgYmx1ZUJyaWdodCwgd2hpdGVCcmlnaHQsIGRpbSwgYm9sZCwgZ3JheSB9ID0gY29sb3JldHRlLmNyZWF0ZUNvbG9ycyB1c2VDb2xvcjogb3B0cy5mZWF0dXJlLmNvbG9yXG4gICAgXG4gICAgc291cmNlID0gb3B0cy5zb3VyY2UgPyBvcHRzLmZpbGVuYW1lID8gJydcbiAgICBleHQgPSAnJ1xuICAgIGlmIHNvdXJjZVxuICAgICAgICBbc291cmNlLCBleHQuLi5dID0gcGF0aC5iYXNlbmFtZShzb3VyY2UpLnNwbGl0ICcuJ1xuICAgICAgICBzb3VyY2UgID0geWVsbG93IFt5ZWxsb3dCcmlnaHQoc291cmNlKSwgZGltIGV4dC5qb2luJy4nXS5qb2luIGRpbSAnLidcbiAgICBiZWZvcmUgID0gXCIje21ldGFMb2cob3B0cyl9KCcje3NvdXJjZX0je2RpbSBibHVlICc6J30je2JsdWVCcmlnaHQgXCIje25vZGUuY29uZGl0aW9uLmxvY2F0aW9uRGF0YS5maXJzdF9saW5lKzF9XCJ9J1wiXG4gICAgYmVmb3JlICs9IFwiLCAnI3tib2xkIHdoaXRlQnJpZ2h0IGFyZ3NbMF19J1wiIGlmIGFyZ3NbMF0gXG4gICAgaWYgKGNsb3NlKVxuICAgICAgICBiZWZvcmUgKz0gJyk7XFxuJ1xuICAgIGVsc2VcbiAgICAgICAgYmVmb3JlICs9IFwiLCBcIlxuXG4gICAgYmVmb3JlXG4gICAgICAgIFxuIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4jIDAwMCAgMDAwMCAgMDAwICAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiMgMDAwICAwMDAgMCAwMDAgICAgICAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4jIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICBcblxuaW5qZWN0TWV0YSA9IChvcHRpb25zKSAtPiAjIG1ha2Ugc3VyZSB0aGF0IG9wdGlvbnMgaGFzIGEgbWV0YSBzZXRcbiAgICBcbiAgICBvcHRpb25zID89IHt9XG4gICAgXG4gICAgeyBleHRlbmQgfSA9IGhlbHBlcnNcbiAgICBcbiAgICBkZWZhdWx0TWV0YSA9IHt9XG4gICAgTUVUQS5tYXAgKG0pIC0+IGRlZmF1bHRNZXRhW20ua2V5XSA9IG0ubWV0YTsgbS5tZXRhLmtleSA9IG0ua2V5OyBtLm1ldGEuaW5mbyA9IG0uaW5mb1xuICAgIFxuICAgIG1ldGEgICAgPSBleHRlbmQgZGVmYXVsdE1ldGEsIG9wdGlvbnMubWV0YSA/IHt9XG4gICAgb3B0aW9ucyA9IGV4dGVuZCB7IG1ldGE6IG1ldGEgfSwgb3B0aW9uc1xuICAgIG9wdGlvbnNcblxubG9nTWV0YXMgPSAtPlxuICAgIFxuICAgIGxvZyBcIiN7Z3JheSAnTWV0YXM6J31cXG5cXG4jeyBNRVRBLm1hcCgoZikgLT4gXCIgICAgI3toZWxwZXJzLnBhZCBmLmtleX0je2dyYXkgZi5kZXNjID8gXCIje2Yua2V5fSAuLi5cIn1cIikuam9pbignXFxuJykgfVwiXG4gICAgbG9nIFwiICAgIOKWuGlmICAgICAgICAgICAgICAgICAgICAgI3tncmF5ICfilrhpZiBjb25kIC4uLiBbW+KWuGVsaWYgY29uZCAuLi5dIOKWuGVsc2UgLi4uXSd9XFxuXCJcbiAgICBcbm1vZHVsZS5leHBvcnRzID0geyBNRVRBLCBpbmplY3RNZXRhLCBsb2dNZXRhcywgY29tcGlsZU1ldGFJZiB9XG4iXX0=
//# sourceURL=../coffee/meta.coffee