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
                            if (otherInfo.type === 'num') {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YS5qcyIsInNvdXJjZVJvb3QiOiIuLi9jb2ZmZWUiLCJzb3VyY2VzIjpbIm1ldGEuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGlGQUFBO0lBQUE7OztBQVFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7QUFFUCxPQUFBLEdBQVUsT0FBQSxDQUFRLFdBQVI7O0FBQ1YsT0FBTyxDQUFDLE1BQVIsQ0FBQTs7QUFFQSxJQUFBLEdBQU87SUFRSDtRQUFBLEdBQUEsRUFBTSxNQUFOO1FBQ0EsSUFBQSxFQUFNLGNBRE47UUFFQSxJQUFBLEVBQU0sU0FBQyxJQUFEO0FBRUYsZ0JBQUE7WUFGRyx5Q0FBRyxNQUFHLDJDQUFHLE1BQUcsMkNBQUc7WUFFbEIsTUFBQSxHQUFZLHNEQUFILEdBQXNCLElBQUssQ0FBQSxDQUFBLENBQTNCLEdBQW1DO2dCQUFBLEtBQUEsRUFBTSxPQUFOO2dCQUFjLEdBQUEsRUFBSSxLQUFsQjtnQkFBd0IsSUFBQSxFQUFLLE1BQTdCO2dCQUFvQyxLQUFBLEVBQU0sT0FBMUM7O1lBRTVDLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUjtZQUNOLGFBQUYsRUFBTSxtQkFBTixFQUFhLG1CQUFiLEVBQW9CLG1DQUFwQixFQUFtQztZQUVuQyxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7WUFDUCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7WUFHUCxXQUFBLEdBQWMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBcEIsQ0FBd0IsU0FBQyxHQUFEO3VCQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFBbEIsQ0FBeEI7QUFNZDtBQUFBLGlCQUFBLHNDQUFBOztnQkFFSSxTQUFBLEdBQVk7Z0JBQ1osU0FBQSxHQUFZLENBQUM7Z0JBRWIsUUFBQSxHQUFXLFNBQUMsSUFBRDtBQUVQLHdCQUFBO29CQUFBLElBQUcsSUFBQSxZQUFnQixFQUFuQjt3QkFJSSxZQUFBLEdBQWdCLElBQUksQ0FBQyxLQUFMLFlBQXVCO3dCQUN2QyxhQUFBLEdBQWdCLElBQUksQ0FBQyxNQUFMLFlBQXVCO3dCQUV2QyxVQUFBLEdBQWMsWUFBQSxJQUFpQixRQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQWhCLEVBQUEsYUFBMEIsV0FBMUIsRUFBQSxJQUFBLE1BQUE7d0JBQy9CLFdBQUEsR0FBYyxhQUFBLElBQWtCLFFBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBakIsRUFBQSxhQUEwQixXQUExQixFQUFBLElBQUEsTUFBQTt3QkFFaEMsSUFBRyxJQUFJLENBQUMsUUFBTCxLQUFpQixHQUFwQjs0QkFFSSxTQUFVLENBQUEsRUFBRSxTQUFGLENBQVYsR0FBeUI7Z0NBQUMsTUFBQSxJQUFEOzs0QkFFekIsSUFBRyxVQUFBLElBQWUsV0FBbEI7Z0NBSVEsU0FBVSxDQUFBLFNBQUEsQ0FBVSxDQUFDLEtBQXJCLEdBQTZCO2dDQUM3QixTQUFVLENBQUEsU0FBQSxDQUFVLENBQUMsSUFBckIsR0FBNkIsTUFMckM7NkJBQUEsTUFPSyxJQUFHLFVBQUg7Z0NBSUcsU0FBVSxDQUFBLFNBQUEsQ0FBVSxDQUFDLElBQXJCLEdBQTZCO2dDQUU3QixJQUFHLGFBQUEsSUFBa0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFaLFlBQTRCLGFBQTlDLElBQStELElBQUksQ0FBQyxNQUFNLENBQUMsSUFBWixZQUE0QixpQkFBOUY7b0NBQ0ksU0FBVSxDQUFBLFNBQUEsQ0FBVSxDQUFDLEtBQXJCLEdBQTZCO29DQUM3QixTQUFVLENBQUEsU0FBQSxDQUFVLENBQUMsSUFBckIsR0FBNkIsTUFGakM7aUNBQUEsTUFBQTtvQ0FJSSxTQUFVLENBQUEsU0FBQSxDQUFVLENBQUMsS0FBckIsR0FBNkIsYUFKakM7aUNBTkg7NkJBQUEsTUFhQSxJQUFHLFdBQUg7Z0NBSUcsU0FBVSxDQUFBLFNBQUEsQ0FBVSxDQUFDLElBQXJCLEdBQTZCO2dDQUU3QixJQUFHLFlBQUEsSUFBaUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFYLFlBQTJCLGFBQTVDLElBQTZELElBQUksQ0FBQyxLQUFLLENBQUMsSUFBWCxZQUEyQixpQkFBM0Y7b0NBQ0ksU0FBVSxDQUFBLFNBQUEsQ0FBVSxDQUFDLEtBQXJCLEdBQTZCO29DQUM3QixTQUFVLENBQUEsU0FBQSxDQUFVLENBQUMsSUFBckIsR0FBNkIsTUFGakM7aUNBQUEsTUFBQTtvQ0FJSSxTQUFVLENBQUEsU0FBQSxDQUFVLENBQUMsS0FBckIsR0FBNkIsYUFKakM7aUNBTkg7NkJBQUEsTUFBQTtnQ0FhRCxTQUFVLENBQUEsU0FBQSxDQUFVLENBQUMsUUFBckIsR0FBaUMsSUFiaEM7NkJBeEJUOzt3QkF1Q0EsSUFBRyxJQUFJLENBQUMsUUFBTCxLQUFpQixHQUFwQjs0QkFFSSxTQUFVLENBQUEsRUFBRSxTQUFGLENBQVYsR0FBeUI7Z0NBQUMsTUFBQSxJQUFEOzs0QkFFekIsSUFBRyxVQUFBLElBQWUsV0FBbEI7Z0NBSVEsU0FBVSxDQUFBLFNBQUEsQ0FBVSxDQUFDLEtBQXJCLEdBQTZCO2dDQUM3QixTQUFVLENBQUEsU0FBQSxDQUFVLENBQUMsSUFBckIsR0FBNkIsTUFMckM7NkJBQUEsTUFPSyxJQUFHLFVBQUg7Z0NBR0csU0FBVSxDQUFBLFNBQUEsQ0FBVSxDQUFDLEtBQXJCLEdBQTZCO2dDQUM3QixTQUFVLENBQUEsU0FBQSxDQUFVLENBQUMsSUFBckIsR0FBNkIsTUFKaEM7NkJBQUEsTUFNQSxJQUFHLFdBQUg7Z0NBR0csU0FBVSxDQUFBLFNBQUEsQ0FBVSxDQUFDLEtBQXJCLEdBQTZCO2dDQUM3QixTQUFVLENBQUEsU0FBQSxDQUFVLENBQUMsSUFBckIsR0FBNkIsTUFKaEM7NkJBQUEsTUFBQTtnQ0FPRCxTQUFVLENBQUEsU0FBQSxDQUFVLENBQUMsUUFBckIsR0FBaUMsSUFQaEM7NkJBakJUOzt3QkEyQkEsSUFBRyxJQUFJLENBQUMsUUFBTCxLQUFpQixHQUFwQjs0QkFFSSxTQUFVLENBQUEsRUFBRSxTQUFGLENBQVYsR0FBeUI7Z0NBQUMsTUFBQSxJQUFEOzs0QkFFekIsSUFBRyxVQUFBLElBQWUsV0FBbEI7Z0NBSVEsU0FBVSxDQUFBLFNBQUEsQ0FBVSxDQUFDLEtBQXJCLEdBQTZCO3VDQUM3QixTQUFVLENBQUEsU0FBQSxDQUFVLENBQUMsSUFBckIsR0FBNkIsTUFMckM7NkJBQUEsTUFPSyxJQUFHLFVBQUg7Z0NBR0csU0FBVSxDQUFBLFNBQUEsQ0FBVSxDQUFDLEtBQXJCLEdBQTZCO3VDQUM3QixTQUFVLENBQUEsU0FBQSxDQUFVLENBQUMsSUFBckIsR0FBNkIsTUFKaEM7NkJBQUEsTUFNQSxJQUFHLFdBQUg7Z0NBR0csU0FBVSxDQUFBLFNBQUEsQ0FBVSxDQUFDLEtBQXJCLEdBQTZCO3VDQUM3QixTQUFVLENBQUEsU0FBQSxDQUFVLENBQUMsSUFBckIsR0FBNkIsTUFKaEM7NkJBQUEsTUFBQTt1Q0FPRCxTQUFVLENBQUEsU0FBQSxDQUFVLENBQUMsUUFBckIsR0FBaUMsSUFQaEM7NkJBakJUO3lCQTVFSjtxQkFBQSxNQUFBO3dCQXdHSSxJQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBakIsS0FBeUIsT0FBNUI7NEJBQ0ksU0FBVSxDQUFBLEVBQUUsU0FBRixDQUFWLEdBQXlCO2dDQUFDLE1BQUEsSUFBRDs7NEJBRXpCLElBQUcsQ0FBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQWpCO2dDQUNJLFNBQVUsQ0FBQSxTQUFBLENBQVUsQ0FBQyxJQUFyQix3R0FBMkQsQ0FBRSxXQUFXLENBQUMsZ0NBRDdFOzZCQUFBLE1BQUE7Z0NBR0ksU0FBVSxDQUFBLFNBQUEsQ0FBVSxDQUFDLEtBQXJCLEdBQTZCLElBQUksQ0FBQyxJQUFJLENBQUMsTUFIM0M7OzRCQUtBLFlBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFWLEVBQUEsYUFBbUIsV0FBbkIsRUFBQSxLQUFBLE1BQUg7dUNBQ0ksU0FBVSxDQUFBLFNBQUEsQ0FBVSxDQUFDLElBQXJCLEdBQTRCLE1BRGhDOzZCQVJKO3lCQXhHSjs7Z0JBRk87Z0JBeUhYLFFBQUEsQ0FBUyxHQUFUO2dCQUNBLEdBQUcsQ0FBQyxnQkFBSixDQUFxQixJQUFyQixFQUEyQixRQUEzQjtnQkFFQSxTQUFBLEdBQVksU0FBUyxDQUFDLEdBQVYsQ0FBYyxTQUFDLENBQUQ7QUFBTyx3QkFBQTtvQkFBQSxDQUFBLEdBQUksQ0FBQyxDQUFDO29CQUFNLE9BQU8sQ0FBQyxDQUFDOzJCQUFNO2dCQUFsQyxDQUFkO0FBSVo7Ozs7O0FBQUEscUJBQUEsd0NBQUE7O29CQUVJLElBQUEsR0FBTyxTQUFVLENBQUEsS0FBQTtvQkFDakIsRUFBQSxHQUFPLFNBQVUsQ0FBQSxLQUFBO29CQUVqQixJQUFHLElBQUksQ0FBQyxLQUFSO3dCQUVJLFNBQUEsR0FBZSxJQUFJLENBQUMsSUFBTCxLQUFhLE1BQWhCLEdBQTRCLEVBQUUsQ0FBQyxNQUEvQixHQUEyQyxFQUFFLENBQUM7d0JBQzFELE9BQUEsR0FBZSxJQUFJLENBQUMsSUFBTCxLQUFhLE1BQWhCLEdBQTRCLEVBQUUsQ0FBQyxLQUEvQixHQUEwQyxFQUFFLENBQUM7d0JBQ3pELFVBQUEsR0FBYSxTQUFTLENBQUMsT0FBVixDQUFrQixTQUFsQjt3QkFDYixRQUFBLEdBQWEsU0FBUyxDQUFDLE9BQVYsQ0FBa0IsT0FBbEI7d0JBQ2IsU0FBQSxHQUFhLFNBQVUsQ0FBQSxVQUFBO3dCQUN2QixPQUFBLEdBQWEsU0FBVSxDQUFBLFFBQUE7d0JBQ3ZCLElBQUcsSUFBSSxDQUFDLEtBQUwsS0FBYyxZQUFqQjs0QkFDSSxJQUFHLFNBQVMsQ0FBQyxJQUFWLEtBQWtCLEtBQXJCO2dDQUNJLElBQUksQ0FBQyxLQUFMLEdBQWE7Z0NBQ2IsSUFBSSxDQUFDLElBQUwsR0FBYSxNQUZqQjs2QkFBQSxNQUdLLElBQUcsU0FBUyxDQUFDLElBQVYsS0FBa0IsS0FBckI7Z0NBQ0QsSUFBSSxDQUFDLEtBQUwsR0FBYTtnQ0FDYixJQUFJLENBQUMsSUFBTCxHQUFhLE1BRlo7NkJBSlQ7eUJBUko7cUJBQUEsTUFrQkssSUFBRyxJQUFJLENBQUMsUUFBUjt3QkFFRCxVQUFBLEdBQWMsU0FBUyxDQUFDLE9BQVYsQ0FBa0IsRUFBRSxDQUFDLEtBQXJCO3dCQUNkLFdBQUEsR0FBYyxTQUFTLENBQUMsT0FBVixDQUFrQixFQUFFLENBQUMsTUFBckI7d0JBRWQsU0FBQSxHQUFhLFVBQUEsR0FBYyxDQUFkLElBQW9CLEtBQXBCLElBQTZCLFNBQVUsQ0FBQSxVQUFBLENBQVcsQ0FBQzt3QkFDaEUsVUFBQSxHQUFhLFdBQUEsR0FBYyxDQUFkLElBQW9CLEtBQXBCLElBQTZCLFNBQVUsQ0FBQSxXQUFBLENBQVksQ0FBQzt3QkFFakUsSUFBRyxDQUFBLFNBQUEsS0FBYSxLQUFiLElBQWEsS0FBYixLQUFzQixVQUF0QixDQUFIOzRCQUNJLElBQUksQ0FBQyxLQUFMLEdBQWE7NEJBQ2IsSUFBSSxDQUFDLElBQUwsR0FBWSxNQUZoQjt5QkFBQSxNQUdLLElBQUcsU0FBQSxLQUFhLEtBQWIsSUFBdUIsVUFBQSxLQUFjLEtBQXhDOzRCQUNELElBQUksQ0FBQyxLQUFMLEdBQWE7NEJBQ2IsSUFBSSxDQUFDLElBQUwsR0FBWTs0QkFDWixJQUFJLENBQUMsSUFBTCxHQUFZLE9BSFg7eUJBQUEsTUFJQSxJQUFHLFNBQUEsS0FBYSxLQUFiLElBQXVCLFVBQUEsS0FBYyxLQUF4Qzs0QkFDRCxJQUFJLENBQUMsS0FBTCxHQUFhOzRCQUNiLElBQUksQ0FBQyxJQUFMLEdBQVk7NEJBQ1osSUFBSSxDQUFDLElBQUwsR0FBWSxRQUhYO3lCQUFBLE1BSUEsSUFBRyxDQUFBLFNBQUEsS0FBYSxLQUFiLElBQWEsS0FBYixLQUFzQixVQUF0QixDQUFIOzRCQUNELElBQUksQ0FBQyxJQUFMLEdBQVksTUFEWDt5QkFuQko7cUJBQUEsTUFBQTt3QkFpQ0QsSUFBRyxJQUFJLENBQUMsS0FBTCxJQUFlLENBQUksSUFBSSxDQUFDLElBQTNCOzRCQUVJLElBQUcsRUFBRSxDQUFDLElBQUgsWUFBbUIsaUJBQXRCO2dDQUE2QyxJQUFJLENBQUMsSUFBTCxHQUFZLE1BQXpEOzs0QkFDQSxJQUFHLEVBQUUsQ0FBQyxJQUFILFlBQW1CLGFBQXRCO2dDQUE2QyxJQUFJLENBQUMsSUFBTCxHQUFZLE1BQXpEOzZCQUhKOzt3QkFLQSxZQUFHLElBQUksQ0FBQyxLQUFMLEtBQWMsS0FBZCxJQUFBLElBQUEsS0FBb0IsS0FBdkI7NEJBQ0ksS0FESjt5QkFBQSxNQUlLLElBQUcsSUFBSSxDQUFDLElBQUwsS0FBYSxJQUFoQjs0QkFFRCxTQUFBLEdBQVksU0FBUyxDQUFDLE9BQVYsNkRBQStCLENBQUUsV0FBWSxDQUFBLENBQUEsbUJBQTdDOzRCQUVaLElBQUcsSUFBQSxpREFBMkIsQ0FBRSxhQUFoQztnQ0FFSSxJQUFJLENBQUMsSUFBTCxHQUFZLEtBRmhCOzZCQUpDO3lCQTFDSjs7QUF2QlQ7Z0JBaUZBLE9BQUEsR0FBVSxTQUFDLFNBQUQ7QUFFTix3QkFBQTtvQkFBQSxJQUFBLEdBQU8sU0FBVSxDQUFBLFNBQUE7b0JBQ2pCLEVBQUEsR0FBSyxTQUFVLENBQUEsU0FBQTtvQkFJZixJQUFHLElBQUksQ0FBQyxLQUFSO3dCQUNJLEVBQUEsR0FBUSxJQUFJLENBQUMsSUFBTCxLQUFhLE9BQWhCLEdBQTZCLEVBQUUsQ0FBQyxNQUFoQyxHQUE0QyxFQUFFLENBQUM7d0JBQ3BELEVBQUEsR0FBUSxJQUFJLENBQUMsSUFBTCxLQUFhLE9BQWhCLEdBQTZCLEVBQUUsQ0FBQyxLQUFoQyxHQUEyQyxFQUFFLENBQUM7d0JBQ25ELEVBQUEsR0FBSyxTQUFTLENBQUMsT0FBVixDQUFrQixFQUFsQjt3QkFDTCxFQUFBLEdBQUssSUFBSSxDQUFDOytCQUNSLDhFQUFrQixPQUFBLENBQVEsU0FBUyxDQUFDLE9BQVYsQ0FBa0IsRUFBbEIsQ0FBUixDQUFsQixDQUFBLEdBQStDLEdBQS9DLEdBQWtELEVBQWxELEdBQXFELEdBQXJELEdBQXVELENBQUMsT0FBQSxDQUFRLEVBQVIsQ0FBRCxDQUF2RCxHQUFtRSxJQUx6RTtxQkFBQSxNQU1LLElBQUcsSUFBSSxDQUFDLFFBQVI7d0JBQ0QsVUFBQSxHQUFjLFNBQVMsQ0FBQyxPQUFWLENBQWtCLEVBQUUsQ0FBQyxLQUFyQjt3QkFDZCxXQUFBLEdBQWMsU0FBUyxDQUFDLE9BQVYsQ0FBa0IsRUFBRSxDQUFDLE1BQXJCO3dCQUNkLEVBQUEsR0FBSyxJQUFJLENBQUM7K0JBQ1IsQ0FBQyxPQUFBLENBQVEsVUFBUixDQUFELENBQUEsR0FBb0IsR0FBcEIsR0FBdUIsRUFBdkIsR0FBMEIsR0FBMUIsR0FBNEIsQ0FBQyxPQUFBLENBQVEsV0FBUixDQUFELEVBSjdCO3FCQUFBLE1BQUE7a0lBTWlCLE9BQUEsQ0FBUSxTQUFTLENBQUMsT0FBVixDQUFrQixFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFZLENBQUEsQ0FBQSxDQUEzQyxDQUFSLEVBTmpCOztnQkFiQztnQkFxQlYsT0FBQSxDQUFBLEdBQUEsQ0FBSSxPQUFBLENBQVEsQ0FBUixDQUFKO0FBM09KO21CQStPQTtnQkFBQSxNQUFBLEVBQVEsSUFBUjtnQkFDQSxNQUFBLEVBQVEsSUFEUjtnQkFFQSxJQUFBLEVBQVEsSUFGUjtnQkFHQSxLQUFBLEVBQVEsSUFIUjs7UUFoUUUsQ0FGTjtLQVJHLEVBcVJIO1FBQUEsR0FBQSxFQUFHLEVBQUg7UUErQkEsR0FBQSxFQUFNLE1BL0JOO1FBZ0NBLElBQUEsRUFBTSxtQkFoQ047UUFpQ0EsSUFBQSxFQUFNLFNBQUMsSUFBRDtBQUNGLGdCQUFBO1lBREcseUNBQUcsTUFBRywyQ0FBRyxNQUFHLDJDQUFHO1lBQ2xCLE1BQUEsR0FBUyxJQUFLLENBQUEsQ0FBQSxDQUFMLElBQVksQ0FBQSxNQUFBLEdBQU8sSUFBSyxDQUFBLENBQUEsQ0FBWixHQUFlLE9BQWYsQ0FBWixJQUFxQzttQkFDOUM7Z0JBQUEsTUFBQSxFQUFRLElBQUksQ0FBQyxHQUFMLElBQWEsQ0FBRSxDQUFDLE9BQUEsQ0FBUSxJQUFSLENBQUQsQ0FBQSxHQUFlLEdBQWYsR0FBa0IsTUFBcEIsQ0FBckI7Z0JBQ0EsS0FBQSxFQUFRLEdBRFI7Z0JBRUEsSUFBQSxFQUFRLENBQUksSUFBSSxDQUFDLEdBQVQsSUFBaUI7b0JBQUEsQ0FBQSxJQUFBLENBQUEsRUFBSyxJQUFMO2lCQUZ6QjtnQkFHQSxNQUFBLEVBQVEsSUFIUjtnQkFJQSxJQUFBLEVBQVEsSUFKUjtnQkFLQSxLQUFBLEVBQVEsS0FMUjs7UUFGRSxDQWpDTjtLQXJSRyxFQXFVSDtRQUFBLEdBQUEsRUFBTSxVQUFOO1FBQ0EsSUFBQSxFQUFNLG1CQUROO1FBRUEsSUFBQSxFQUFNLFNBQUMsSUFBRDtBQUVGLGdCQUFBO1lBRkcseUNBQUcsTUFBRywyQ0FBRyxNQUFHLDJDQUFHO1lBRWxCLEVBQUEsR0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLFVBQTVCLEdBQXVDLENBQXhDLENBQUEsR0FBMEMsR0FBMUMsR0FBNkMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUM7WUFDaEYsSUFBQSxxQ0FBaUI7bUJBQ2pCO2dCQUFBLElBQUEsRUFBUSxTQUFBLEdBQVUsRUFBVixHQUFhLDRCQUFyQjtnQkFDQSxLQUFBLEVBQVUsQ0FBQyxPQUFBLENBQVEsSUFBUixDQUFELENBQUEsR0FBZSxJQUFmLEdBQW1CLElBQW5CLEdBQXdCLHVLQUF4QixHQUErTCxFQUEvTCxHQUFrTSxLQUQ1TTtnQkFFQSxNQUFBLEVBQVEsS0FGUjtnQkFHQSxJQUFBLEVBQVEsSUFIUjs7UUFKRSxDQUZOO0tBclVHLEVBc1ZIO1FBQUEsR0FBQSxFQUFNLFVBQU47UUFDQSxJQUFBLEVBQU0sa0JBRE47UUFFQSxJQUFBLEVBQU0sU0FBQyxJQUFEO0FBRUYsZ0JBQUE7WUFGRyx5Q0FBRyxNQUFHLDJDQUFHLE1BQUcsMkNBQUc7WUFFbEIsRUFBQSxHQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsVUFBNUIsR0FBdUMsQ0FBeEMsQ0FBQSxHQUEwQyxHQUExQyxHQUE2QyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQztZQUNqRixHQUFBLHFDQUFnQjttQkFDaEI7Z0JBQUEsTUFBQSxFQUFTLFdBQUEsR0FFSSxFQUZKLEdBRU8seUJBRlAsR0FHWSxHQUhaLEdBR2dCLDBCQUhoQixHQUtRLEVBTFIsR0FLVyxxQ0FMcEI7Z0JBUUEsS0FBQSxFQUFPLFNBQUEsR0FDTSxFQUROLEdBQ1MsdUNBRFQsR0FDZ0QsRUFEaEQsR0FDbUQsc0JBRG5ELEdBR00sRUFITixHQUdTLE1BSFQsR0FHZSxHQUhmLEdBR21CLE1BSG5CLEdBSUYsQ0FBQyxPQUFBLENBQVEsSUFBUixDQUFELENBSkUsR0FJYSxJQUpiLEdBSWlCLEVBSmpCLEdBSW9CLCtJQUpwQixHQUltSyxFQUpuSyxHQUlzSyxNQVo3SztnQkFjQSxNQUFBLEVBQVEsSUFkUjtnQkFlQSxJQUFBLEVBQVEsSUFmUjs7UUFKRSxDQUZOO0tBdFZHLEVBbVhIO1FBQUEsR0FBQSxFQUFNLFFBQU47UUFDQSxJQUFBLEVBQU0sZUFETjtRQUVBLElBQUEsRUFDSTtZQUFBLElBQUEsRUFBTSxJQUFOO1lBQ0EsSUFBQSxFQUFNLENBRE47U0FISjtRQUtBLElBQUEsRUFBTSxTQUFDLElBQUQ7QUFDRixnQkFBQTtZQURHLHlDQUFHO1lBQ04sRUFBQSxxQ0FBZTttQkFDZjtnQkFBQSxNQUFBLEVBQVEsU0FBQSxHQUFVLEVBQVYsR0FBYSw0QkFBckI7Z0JBQ0EsTUFBQSxFQUFRLElBRFI7Z0JBRUEsSUFBQSxFQUFRLEtBRlI7O1FBRkUsQ0FMTjtLQW5YRyxFQThYSDtRQUFBLEdBQUEsRUFBTSxNQUFOO1FBQ0EsSUFBQSxFQUFNLGFBRE47UUFFQSxJQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQU0sSUFBTjtZQUNBLElBQUEsRUFBTSxDQUROO1NBSEo7UUFLQSxJQUFBLEVBQU0sU0FBQyxJQUFEO0FBQ0YsZ0JBQUE7WUFERyx5Q0FBRyxNQUFHLDJDQUFHO1lBQ1osRUFBQSxxQ0FBZTttQkFDZjtnQkFBQSxNQUFBLEVBQVUsQ0FBQyxPQUFBLENBQVEsSUFBUixDQUFELENBQUEsR0FBZSxJQUFmLEdBQW1CLEVBQW5CLEdBQXNCLHVLQUF0QixHQUE2TCxFQUE3TCxHQUFnTSxLQUExTTtnQkFDQSxNQUFBLEVBQVEsSUFEUjtnQkFFQSxJQUFBLEVBQVEsS0FGUjs7UUFGRSxDQUxOO0tBOVhHLEVBK1lIO1FBQUEsR0FBQSxFQUFNLE1BQU47UUFDQSxJQUFBLEVBQU0sZ0JBRE47UUFFQSxJQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQU0sSUFBTjtZQUNBLElBQUEsRUFBTSxDQUROO1NBSEo7UUFLQSxJQUFBLEVBQU0sU0FBQyxJQUFEO0FBQ0YsZ0JBQUE7WUFERyx5Q0FBRyxNQUFHLDJDQUFHLE1BQUcsMkNBQUc7bUJBQ2xCO2dCQUFBLE1BQUEsRUFBUSxTQUFBLENBQVU7b0JBQUMsTUFBQSxJQUFEO29CQUFPLE1BQUEsSUFBUDtvQkFBYSxNQUFBLElBQWI7aUJBQVYsQ0FBUjtnQkFDQSxLQUFBLEVBQVEsR0FEUjtnQkFFQSxNQUFBLEVBQVEsSUFGUjtnQkFHQSxJQUFBLEVBQVEsSUFIUjtnQkFJQSxLQUFBLEVBQVEsS0FKUjs7UUFERSxDQUxOO0tBL1lHLEVBaWFIO1FBQUEsR0FBQSxFQUFNLFNBQU47UUFDQSxJQUFBLEVBQU0sbUJBRE47UUFFQSxJQUFBLEVBQU0sU0FBQyxJQUFEO0FBRUYsZ0JBQUE7WUFGRyx5Q0FBRyxNQUFHLDJDQUFHLE1BQUcsMkNBQUc7WUFFbEIsS0FBQSxHQUFRLE9BQUEsQ0FBUSxTQUFSO1lBQ04sbUJBQUYsRUFBUztZQUNULElBQUcsSUFBSSxDQUFDLElBQUwsWUFBcUIsS0FBeEI7Z0JBQ0ksSUFBQSxHQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBWSxDQUFBLENBQUEsRUFEakM7YUFBQSxNQUFBO2dCQUdJLElBQUEsR0FBTyxJQUFJLENBQUMsS0FIaEI7O1lBS0EsSUFBQSxHQUFPLElBQUksQ0FBQyxrQkFBTCxDQUF3QixJQUF4QjtZQUNQLElBQUEsR0FBTyxJQUFJLENBQUMsZUFBTCxDQUFxQixJQUFyQjtZQUNQLElBQWlDLENBQUksSUFBSSxDQUFDLE1BQTFDO2dCQUFBLElBQUEsR0FBTyxDQUFDLG9CQUFELEVBQVA7O21CQUNBO2dCQUFBLE1BQUEsRUFBUSxTQUFBLENBQVU7b0JBQUMsTUFBQSxJQUFEO29CQUFPLE1BQUEsSUFBUDtvQkFBYSxNQUFBLElBQWI7b0JBQW1CLEtBQUEsRUFBTSxJQUF6QjtpQkFBVixDQUFSO2dCQUNBLEtBQUEsRUFBUSxvQkFEUjtnQkFFQSxJQUFBLEVBQVEsSUFGUjtnQkFHQSxDQUFBLElBQUEsQ0FBQSxFQUFRLEtBSFI7Z0JBSUEsTUFBQSxFQUFRLEtBSlI7Z0JBS0EsSUFBQSxFQUFRLElBQUEsR0FBSyxJQUFMLEdBQVUsR0FMbEI7O1FBWkUsQ0FGTjtLQWphRyxFQTRiSDtRQUFBLEdBQUEsRUFBTSxPQUFOO1FBQ0EsSUFBQSxFQUFNLGdCQUROO1FBRUEsSUFBQSxFQUFNLFNBQUMsSUFBRDtBQUNGLGdCQUFBO1lBREcseUNBQUcsTUFBRywyQ0FBRyxNQUFHLDJDQUFHO1lBQ2xCLE1BQUEsR0FBVSxTQUFBLENBQVU7Z0JBQUMsTUFBQSxJQUFEO2dCQUFPLE1BQUEsSUFBUDtnQkFBYSxNQUFBLElBQWI7Z0JBQW1CLEtBQUEsRUFBTSxJQUF6QjthQUFWO1lBQ1YsTUFBQSxJQUFVO21CQUNWO2dCQUFBLE1BQUEsRUFBUSxJQUFSO2dCQUNBLE1BQUEsRUFBUSxJQUFJLENBQUMsSUFBTCxJQUFjLE1BRHRCO2dCQUVBLEtBQUEsRUFBUSxJQUFJLENBQUMsSUFBTCxJQUFjLENBQUEsaUJBQUEsR0FBaUIsQ0FBQyxPQUFBLENBQVEsSUFBUixDQUFELENBQWpCLEdBQWdDLG9CQUFoQyxDQUZ0QjtnQkFHQSxJQUFBLEVBQVEsQ0FBSSxJQUFJLENBQUMsSUFIakI7Z0JBSUEsTUFBQSxFQUFRLElBSlI7Z0JBS0EsSUFBQSxFQUFRLElBTFI7O1FBSEUsQ0FGTjtLQTViRyxFQThjSDtRQUFBLEdBQUEsRUFBSyxPQUFMO1FBQ0EsSUFBQSxFQUFNLFNBQUMsSUFBRDtBQUNGLGdCQUFBO1lBREcseUNBQUc7bUJBQ047Z0JBQUEsSUFBQSxFQUFRLGtCQUFBLEdBQWtCLDJEQUFZLEdBQVosQ0FBMUI7Z0JBQ0EsTUFBQSxFQUFRLEtBRFI7Z0JBRUEsSUFBQSxFQUFRLElBRlI7O1FBREUsQ0FETjtLQTljRzs7O0FBNmRQLEdBQUEsR0FBTTs7QUFFTixhQUFBLEdBQWdCLFNBQUMsSUFBRDtBQUVaLFFBQUE7SUFGYSx5Q0FBRyxNQUFHLDJDQUFHO0lBRXRCLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUjtJQUVOLG1CQUFGLEVBQVMscUJBQVQsRUFBaUIsbUJBQWpCLEVBQXdCO0lBQ3RCLHVCQUFGLEVBQVU7SUFFVixJQUFBLEdBQU87UUFBQSxNQUFBLEVBQU8sSUFBUDtRQUFhLENBQUEsSUFBQSxDQUFBLEVBQUssSUFBbEI7O0lBRVAsNkVBQTZCLENBQUUsVUFBNUIsQ0FBdUMsR0FBdkMsbUJBQUg7UUFFSSxPQUFBLEdBQVUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7UUFDOUIsSUFBRyxPQUFPLElBQUksQ0FBQyxJQUFLLENBQUEsT0FBQSxDQUFqQixLQUE2QixVQUFoQztZQUNJLElBQUEsR0FBTyxJQUFJLENBQUMsSUFBSyxDQUFBLE9BQUEsQ0FBVixDQUFtQjtnQkFBQyxNQUFBLElBQUQ7Z0JBQU8sTUFBQSxJQUFQO2dCQUFhLElBQUEsRUFBSyxFQUFsQjthQUFuQixFQURYO1NBSEo7O0lBTUEsOEdBQXVDLENBQUUsVUFBdEMsQ0FBaUQsR0FBakQsNEJBQUg7UUFFSSxPQUFBLEdBQVUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO1FBQ3ZDLElBQUcsT0FBTyxJQUFJLENBQUMsSUFBSyxDQUFBLE9BQUEsQ0FBakIsS0FBNkIsVUFBaEM7WUFDSSxJQUFBLEdBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBcEIsQ0FBd0IsU0FBQyxDQUFEO0FBQzNCLG9CQUFBO3FEQUFNLENBQUU7WUFEbUIsQ0FBeEI7WUFFUCxJQUFBLEdBQU8sSUFBSSxDQUFDLEdBQUwsQ0FBUyxTQUFDLENBQUQ7QUFBTyxvQkFBQTtnQkFBQSxZQUFHLENBQUUsQ0FBQSxDQUFBLEVBQUYsS0FBUyxHQUFULElBQUEsSUFBQSxLQUFjLEdBQWpCOzJCQUEyQixDQUFFLGNBQTdCO2lCQUFBLE1BQUE7MkJBQXlDLEVBQXpDOztZQUFQLENBQVQ7WUFDUCxJQUFBLEdBQU8sSUFBSSxDQUFDLElBQUssQ0FBQSxPQUFBLENBQVYsQ0FBbUI7Z0JBQUMsTUFBQSxJQUFEO2dCQUFPLE1BQUEsSUFBUDtnQkFBYSxNQUFBLElBQWI7YUFBbkIsRUFKWDtTQUhKOztJQVNBLElBQUcsSUFBSSxDQUFDLElBQVI7UUFDSSxJQUFHLHlCQUFIO0FBQ0ksbUJBQU8sSUFBSSxDQUFDLFFBQUwsQ0FBYyxJQUFJLENBQUMsSUFBSSxFQUFDLElBQUQsRUFBdkIsRUFEWDs7QUFFQSxlQUFPLEdBSFg7O0lBS0EsSUFBRyxJQUFJLEVBQUMsSUFBRCxFQUFQO1FBRUksSUFBQSx1Q0FBbUIsSUFBSSxDQUFDLGVBQUwsQ0FBcUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxrQkFBZixDQUFrQyxJQUFsQyxFQUF3QyxDQUF4QyxDQUFyQjtBQUNuQjtZQUNJLEVBQUEsR0FBSyxPQUFBLENBQVEsSUFBUjtZQUNMLEVBQUEsR0FBSyxPQUFBLENBQVEsSUFBUjtZQUNMLElBQUksQ0FBQyxJQUFMLEdBQVcsQ0FBQyxDQUFFLElBQUEsQ0FBSyxJQUFMO1lBQ2QsSUFBRyxJQUFJLEVBQUMsSUFBRCxFQUFKLElBQWMsSUFBSSxDQUFDLE1BQW5CLElBQThCLENBQUksSUFBSSxDQUFDLElBQXZDLElBQWdELENBQUksSUFBSSxDQUFDLFFBQTVEO0FBQ0ksdUJBQU8sR0FEWDthQUpKO1NBQUEsYUFBQTtZQU1NO1lBQ0gsT0FBQSxDQUFDLEtBQUQsQ0FBTyxHQUFQLEVBUEg7U0FISjs7SUFZQSxJQUFBLEdBQU87SUFFUCxJQUFHLElBQUksQ0FBQyxNQUFMLEtBQWUsS0FBbEI7UUFDSSxJQUFBLEdBQU8sSUFBSSxDQUFDLE1BQUwsQ0FBWSxJQUFJLENBQUMsUUFBTCxDQUFjLE1BQWQsQ0FBWixFQUFtQyxJQUFJLENBQUMsUUFBTCxDQUFjLElBQUksQ0FBQyxJQUFuQixDQUFuQyxFQUE2RCxJQUFJLENBQUMsUUFBTCxDQUFjLE9BQWQsQ0FBN0Q7UUFFUCxNQUFBLEdBQVMsSUFBSSxDQUFDLE1BQUwsR0FBYztRQUN2QixPQUFBLEdBQVUsS0FBQSxDQUFNLElBQU4sRUFBWTtZQUFDLFFBQUEsTUFBRDtTQUFaLEVBSmQ7S0FBQSxNQUFBO1FBTUksTUFBQSxHQUFTLElBQUksQ0FBQztRQUNkLE9BQUEsR0FBVSxLQVBkOztJQVNBLElBQUcsSUFBSSxDQUFDLE1BQVI7UUFDSSxJQUFJLENBQUMsSUFBTCxDQUFVLElBQUksQ0FBQyxRQUFMLENBQWMsQ0FBQyxJQUFJLENBQUMsS0FBTCxLQUFZLEtBQVosSUFBc0IsSUFBSSxDQUFDLE1BQUwsS0FBYSxJQUFuQyxJQUE0QyxNQUE1QyxJQUFzRCxFQUF2RCxDQUFBLEdBQTZELElBQUksQ0FBQyxNQUFoRixDQUFWLEVBREo7O0lBR0EsSUFBRyxJQUFJLENBQUMsSUFBUjtRQUNJLElBQUcsSUFBSSxDQUFDLEtBQUwsS0FBYyxLQUFqQjtZQUNJLElBQUEsR0FBTyxJQUFJLENBQUMsV0FBTCxDQUFpQixJQUFJLENBQUMsSUFBdEIsRUFEWDtTQUFBLE1BQUE7WUFHSSxJQUFHLElBQUksQ0FBQyxJQUFMLFlBQXFCLEtBQXhCO2dCQUNJLElBQUEsR0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVksQ0FBQSxDQUFBLEVBRGpDO2FBQUEsTUFBQTtnQkFHSSxJQUFBLEdBQU8sSUFBSSxDQUFDLEtBSGhCO2FBSEo7O1FBT0EsSUFBRyxJQUFIO1lBQ0ksSUFBQSxHQUFPLElBQUksQ0FBQyxNQUFMLENBQVksSUFBSSxDQUFDLGtCQUFMLENBQXdCLE9BQXhCLENBQVosRUFEWDtTQUFBLE1BQUE7WUFHSSxJQUFJLENBQUMsSUFBTCxDQUFVLElBQUksQ0FBQyxRQUFMLENBQWMsSUFBZCxDQUFWLEVBSEo7U0FSSjs7SUFhQSxJQUFHLElBQUksQ0FBQyxLQUFSO1FBQ0ksSUFBSSxDQUFDLElBQUwsQ0FBVSxJQUFJLENBQUMsUUFBTCxDQUFjLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBTCxLQUFjLEtBQWYsQ0FBQSxJQUEwQixDQUFDLElBQUEsR0FBTyxNQUFSLENBQTFCLElBQTZDLEVBQTlDLENBQUEsR0FBb0QsSUFBSSxDQUFDLEtBQXZFLENBQVYsRUFESjs7SUFHQSxJQUFHLENBQUksSUFBSSxDQUFDLE1BQVo7UUFDSSxJQUFJLENBQUMsSUFBTCxDQUFVLElBQUksQ0FBQyxRQUFMLENBQWMsSUFBQSxHQUFLLElBQUksQ0FBQyxHQUFWLEdBQWMsR0FBNUIsQ0FBVixFQURKOztJQUdBLElBQUcsSUFBSSxDQUFDLFFBQUwsSUFBa0IsQ0FBQyxJQUFJLENBQUMsTUFBTCxLQUFlLEtBQWYsSUFBd0IsSUFBSSxDQUFDLElBQUwsS0FBYSxLQUF0QyxDQUFyQjtRQUNJLElBQW9DLENBQUksSUFBSSxDQUFDLE1BQTdDO1lBQUEsSUFBSSxDQUFDLElBQUwsQ0FBVSxJQUFJLENBQUMsUUFBTCxDQUFjLFFBQWQsQ0FBVixFQUFBOztRQUNBLElBQUcsSUFBSSxDQUFDLE9BQVI7WUFDSSxJQUFBLEdBQU8sSUFBSSxDQUFDLE1BQUwsQ0FBWSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQWQsQ0FBQSxDQUFzQixDQUFDLGtCQUF2QixDQUEwQyxPQUExQyxDQUFaLEVBRFg7U0FBQSxNQUFBO1lBR0ksSUFBQSxHQUFPLElBQUksQ0FBQyxNQUFMLENBQVksSUFBSSxDQUFDLFFBQVEsQ0FBQyxrQkFBZCxDQUFpQyxPQUFqQyxDQUFaLEVBSFg7U0FGSjs7QUFPQSxXQUFPO0FBakZLOztBQXlGaEIsT0FBQSxHQUFVLFNBQUMsSUFBRDtBQUFVLFFBQUE7Z0RBQWU7QUFBekI7O0FBRVYsU0FBQSxHQUFZLFNBQUMsSUFBRDtBQUVSLFFBQUE7SUFGUyx5Q0FBRyxNQUFHLDJDQUFHLE1BQUcsMkNBQUcsTUFBRyw2Q0FBSTtJQUUvQixTQUFBLEdBQVksT0FBQSxDQUFRLFdBQVI7SUFDWixPQUEyRSxTQUFTLENBQUMsWUFBVixDQUF1QjtRQUFBLFFBQUEsRUFBVSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQXZCO0tBQXZCLENBQTNFLEVBQUUsb0JBQUYsRUFBVSxnQkFBVixFQUFnQixnQ0FBaEIsRUFBOEIsNEJBQTlCLEVBQTBDLDhCQUExQyxFQUF1RCxjQUF2RCxFQUE0RCxnQkFBNUQsRUFBa0U7SUFFbEUsTUFBQSxpRkFBdUM7SUFDdkMsR0FBQSxHQUFNO0lBQ04sSUFBRyxNQUFIO1FBQ0ksT0FBbUIsSUFBSSxDQUFDLFFBQUwsQ0FBYyxNQUFkLENBQXFCLENBQUMsS0FBdEIsQ0FBNEIsR0FBNUIsQ0FBbkIsRUFBQyxnQkFBRCxFQUFTO1FBQ1QsTUFBQSxHQUFVLE1BQUEsQ0FBTyxDQUFDLFlBQUEsQ0FBYSxNQUFiLENBQUQsRUFBdUIsR0FBQSxDQUFJLEdBQUcsQ0FBQyxJQUFKLENBQUEsQ0FBQSxDQUFKLENBQXZCLENBQXVDLENBQUMsSUFBeEMsQ0FBNkMsR0FBQSxDQUFJLEdBQUosQ0FBN0MsQ0FBUCxFQUZkOztJQUdBLE1BQUEsR0FBWSxDQUFDLE9BQUEsQ0FBUSxJQUFSLENBQUQsQ0FBQSxHQUFlLElBQWYsR0FBbUIsTUFBbkIsR0FBMkIsQ0FBQyxHQUFBLENBQUksSUFBQSxDQUFLLEdBQUwsQ0FBSixDQUFELENBQTNCLEdBQTBDLENBQUMsVUFBQSxDQUFXLEVBQUEsR0FBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLFVBQTVCLEdBQXVDLENBQXhDLENBQWIsQ0FBRCxDQUExQyxHQUFvRztJQUNoSCxJQUErQyxJQUFLLENBQUEsQ0FBQSxDQUFwRDtRQUFBLE1BQUEsSUFBVSxLQUFBLEdBQUssQ0FBQyxJQUFBLENBQUssV0FBQSxDQUFZLElBQUssQ0FBQSxDQUFBLENBQWpCLENBQUwsQ0FBRCxDQUFMLEdBQStCLElBQXpDOztJQUNBLElBQUksS0FBSjtRQUNJLE1BQUEsSUFBVSxPQURkO0tBQUEsTUFBQTtRQUdJLE1BQUEsSUFBVSxLQUhkOztXQUtBO0FBakJROztBQXlCWixVQUFBLEdBQWEsU0FBQyxPQUFEO0FBRVQsUUFBQTs7UUFBQTs7UUFBQSxVQUFXOztJQUVULFNBQVc7SUFFYixXQUFBLEdBQWM7SUFDZCxJQUFJLENBQUMsR0FBTCxDQUFTLFNBQUMsQ0FBRDtRQUFPLFdBQVksQ0FBQSxDQUFDLENBQUMsR0FBRixDQUFaLEdBQXFCLENBQUMsQ0FBQztRQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBUCxHQUFhLENBQUMsQ0FBQztlQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBUCxHQUFjLENBQUMsQ0FBQztJQUF4RSxDQUFUO0lBRUEsSUFBQSxHQUFVLE1BQUEsQ0FBTyxXQUFQLHVDQUFtQyxFQUFuQztJQUNWLE9BQUEsR0FBVSxNQUFBLENBQU87UUFBRSxJQUFBLEVBQU0sSUFBUjtLQUFQLEVBQXVCLE9BQXZCO1dBQ1Y7QUFYUzs7QUFhYixRQUFBLEdBQVcsU0FBQTtJQUVSLE9BQUEsQ0FBQyxHQUFELENBQU8sQ0FBQyxJQUFBLENBQUssUUFBTCxDQUFELENBQUEsR0FBZSxNQUFmLEdBQW9CLENBQUUsSUFBSSxDQUFDLEdBQUwsQ0FBUyxTQUFDLENBQUQ7QUFBTyxZQUFBO2VBQUEsTUFBQSxHQUFNLENBQUMsT0FBTyxDQUFDLEdBQVIsQ0FBWSxDQUFDLENBQUMsR0FBZCxDQUFELENBQU4sR0FBMEIsQ0FBQyxJQUFBLGdDQUFpQixDQUFDLENBQUMsR0FBSCxHQUFPLE1BQXZCLENBQUQ7SUFBakMsQ0FBVCxDQUEwRSxDQUFDLElBQTNFLENBQWdGLElBQWhGLENBQUYsQ0FBM0I7V0FBcUgsT0FBQSxDQUNwSCxHQURvSCxDQUNoSCw4QkFBQSxHQUE4QixDQUFDLElBQUEsQ0FBSywyQ0FBTCxDQUFELENBQTlCLEdBQWdGLElBRGdDO0FBRjdHOztBQUtYLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0lBQUUsTUFBQSxJQUFGO0lBQVEsWUFBQSxVQUFSO0lBQW9CLFVBQUEsUUFBcEI7SUFBOEIsZUFBQSxhQUE5QiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIFxuMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIFxuMDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIFxuMDAwIDAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIFxuMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIFxuIyMjXG5cbnBhdGggPSByZXF1aXJlICdwYXRoJ1xuXG5oZWxwZXJzID0gcmVxdWlyZSAnLi9oZWxwZXJzJ1xuaGVscGVycy5jb2xvcnMoKVxuXG5NRVRBID0gW1xuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAgMDAwIDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAgICAgMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgXG4gICAga2V5OiAgJ+KWuHZlYydcbiAgICBkZXNjOiAn4pa4dmVjKGEsIC4uLiknXG4gICAgbWV0YTogKGFyZ3M6LG5vZGU6LG9wdHM6KSAtPlxuICAgICAgICBcbiAgICAgICAgY29uZmlnID0gaWYgYXJnc1swXT8uZG90PyB0aGVuIGFyZ3NbMF0gZWxzZSB0aW1lczondGltZXMnIGRvdDonZG90JyBwbHVzOidwbHVzJyBtaW51czonbWludXMnXG5cbiAgICAgICAgbm9kZXMgPSByZXF1aXJlICcuL25vZGVzJ1xuICAgICAgICB7IE9wLCBWYWx1ZSwgQmxvY2ssIE51bWJlckxpdGVyYWwsIElkZW50aWZpZXJMaXRlcmFsIH0gPSBub2Rlc1xuICAgICAgICBcbiAgICAgICAgbm9vbiA9IHJlcXVpcmUgJ25vb24nXG4gICAgICAgIGtzdHIgPSByZXF1aXJlICdrc3RyJ1xuICAgICAgICAjIGxvZyAn4pa4dmVjIG5vZGUnIG5vZGUsIG5vb24uc3RyaW5naWZ5IG5vZGVcbiAgICAgICAgXG4gICAgICAgIGlkZW50aWZpZXJzID0gbm9kZS5jb25kaXRpb24uYXJncy5tYXAgKGFyZykgLT4gYXJnLmJhc2UudmFsdWVcblxuICAgICAgICAjIGxvZyBpZGVudGlmaWVyc1xuICAgICAgICBcbiAgICAgICAgIyBsb2cgJ+KWuHZlYyBub2RlLmJvZHkuZXhwcmVzc2lvbnMnIG5vZGUuYm9keS5leHByZXNzaW9ucyAjLCBub29uLnN0cmluZ2lmeSBleHBzXG4gICAgICAgIFxuICAgICAgICBmb3IgZXhwIGluIG5vZGUuYm9keS5leHByZXNzaW9uc1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBub2RlSW5mb3MgPSBbXVxuICAgICAgICAgICAgbm9kZUluZGV4ID0gLTFcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcHJlUGFyc2UgPSAobm9kZSkgLT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBub2RlIGluc3RhbmNlb2YgT3BcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICMgbG9nICfilrh2ZWMgY2hpbGQnIG5vZGVcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBmaXJzdElzVmFsdWUgID0gbm9kZS5maXJzdCAgaW5zdGFuY2VvZiBWYWx1ZSBcbiAgICAgICAgICAgICAgICAgICAgc2Vjb25kSXNWYWx1ZSA9IG5vZGUuc2Vjb25kIGluc3RhbmNlb2YgVmFsdWUgXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBmaXJzdElzVmVjICA9IGZpcnN0SXNWYWx1ZSBhbmQgbm9kZS5maXJzdC5iYXNlLnZhbHVlICBpbiBpZGVudGlmaWVyc1xuICAgICAgICAgICAgICAgICAgICBzZWNvbmRJc1ZlYyA9IHNlY29uZElzVmFsdWUgYW5kIG5vZGUuc2Vjb25kLmJhc2UudmFsdWUgaW4gaWRlbnRpZmllcnNcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vZGUub3BlcmF0b3IgPT0gJyonXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3NbKytub2RlSW5kZXhdID0ge25vZGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBmaXJzdElzVmVjIGFuZCBzZWNvbmRJc1ZlY1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIGxvZyAn4pa4dmVjIGRvdCcgbm9kZS5maXJzdC5iYXNlLnZhbHVlLCBub2RlLnNlY29uZC5iYXNlLnZhbHVlIFxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS52ZWNPcCA9ICdkb3QnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgID0gJ251bSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGZpcnN0SXNWZWNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBsb2cgJ+KWuHZlYyB0aW1lcycgbm9kZS5maXJzdC5iYXNlLnZhbHVlXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnNpZGUgID0gJ2xlZnQnXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIHNlY29uZElzVmFsdWUgYW5kIG5vZGUuc2Vjb25kLmJhc2UgaW5zdGFuY2VvZiBOdW1iZXJMaXRlcmFsIG9yIG5vZGUuc2Vjb25kLmJhc2UgaW5zdGFuY2VvZiBJZGVudGlmaWVyTGl0ZXJhbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAndGltZXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICA9ICd2ZWMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnZlY09wID0gJ3RpbWVzT3JEb3QnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgID0gJz8/PydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIHNlY29uZElzVmVjXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgbG9nICfilrh2ZWMgbHRpbWVzJyBub2RlLnNlY29uZC5iYXNlLnZhbHVlXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnNpZGUgID0gJ3JpZ2h0J1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBmaXJzdElzVmFsdWUgYW5kIG5vZGUuZmlyc3QuYmFzZSBpbnN0YW5jZW9mIE51bWJlckxpdGVyYWwgb3Igbm9kZS5maXJzdC5iYXNlIGluc3RhbmNlb2YgSWRlbnRpZmllckxpdGVyYWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnZlY09wID0gJ3RpbWVzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udHlwZSAgPSAndmVjJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS52ZWNPcCA9ICd0aW1lc09yRG90J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICA9ICc/Pz8nXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLm9wZXJhdG9yICA9ICcqJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgbm9kZS5vcGVyYXRvciA9PSAnKydcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zWysrbm9kZUluZGV4XSA9IHtub2RlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgZmlyc3RJc1ZlYyBhbmQgc2Vjb25kSXNWZWNcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBsb2cgJ+KWuHZlYyBwbHVzJyBub2RlLmZpcnN0LmJhc2UudmFsdWUsIG5vZGUuc2Vjb25kLmJhc2UudmFsdWUgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS52ZWNPcCA9ICdwbHVzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICA9ICd2ZWMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBmaXJzdElzVmVjXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgbm9kZUluZm9zW25vZGVJbmRleF0uc2lkZSAgPSAnbGVmdCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAncGx1cydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udHlwZSAgPSAndmVjJ1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBzZWNvbmRJc1ZlY1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIG5vZGVJbmZvc1tub2RlSW5kZXhdLnNpZGUgID0gJ3JpZ2h0J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS52ZWNPcCA9ICdwbHVzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICA9ICd2ZWMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS5vcGVyYXRvciAgPSAnKydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgICAgICA9ICc/Pz8nXG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vZGUub3BlcmF0b3IgPT0gJy0nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zWysrbm9kZUluZGV4XSA9IHtub2RlfVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBmaXJzdElzVmVjIGFuZCBzZWNvbmRJc1ZlY1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIGxvZyAn4pa4dmVjIG1pbnVzJyBub2RlLmZpcnN0LmJhc2UudmFsdWUsIG5vZGUuc2Vjb25kLmJhc2UudmFsdWUgXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnZlY09wID0gJ21pbnVzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICA9ICd2ZWMnXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGZpcnN0SXNWZWNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBub2RlSW5mb3Nbbm9kZUluZGV4XS5zaWRlICA9ICdsZWZ0J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS52ZWNPcCA9ICdtaW51cydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udHlwZSAgPSAndmVjJ1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBzZWNvbmRJc1ZlY1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIG5vZGVJbmZvc1tub2RlSW5kZXhdLnNpZGUgID0gJ3JpZ2h0J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS52ZWNPcCA9ICdtaW51cydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udHlwZSAgPSAndmVjJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0ub3BlcmF0b3IgID0gJy0nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICAgICAgPSAnPz8/J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgaWYgbm9kZS5jb25zdHJ1Y3Rvci5uYW1lID09ICdWYWx1ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1srK25vZGVJbmRleF0gPSB7bm9kZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICMgbG9nIG5vZGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIG5vdCBub2RlLmJhc2UudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS5ib2R5ID0gbm9kZS5iYXNlLmJvZHk/LmV4cHJlc3Npb25zP1swXT8uY29uc3RydWN0b3IubmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS52YWx1ZSA9IG5vZGUuYmFzZS52YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbm9kZS5iYXNlLnZhbHVlIGluIGlkZW50aWZpZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udHlwZSA9ICd2ZWMnXG4gICAgICAgICAgICAgICAgICAgICAgICAjIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgPSAnPz8/J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAjIGxvZyAnbm9kZT8nIG5vZGUuY29uc3RydWN0b3IubmFtZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBwcmVQYXJzZSBleHBcbiAgICAgICAgICAgIGV4cC50cmF2ZXJzZUNoaWxkcmVuIHRydWUsIHByZVBhcnNlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIG5vZGVBcnJheSA9IG5vZGVJbmZvcy5tYXAgKGkpIC0+IG4gPSBpLm5vZGU7IGRlbGV0ZSBpLm5vZGU7IG5cbiAgICBcbiAgICAgICAgICAgICMgbG9nIG5vb24uc3RyaW5naWZ5IG5vZGVJbmZvc1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgaW5kZXggaW4gbm9kZUluZm9zLmxlbmd0aC0xLi4wXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaW5mbyA9IG5vZGVJbmZvc1tpbmRleF1cbiAgICAgICAgICAgICAgICBuZCAgID0gbm9kZUFycmF5W2luZGV4XVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIGluZm8udmVjT3BcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIG90aGVyTm9kZSA9IGlmIGluZm8uc2lkZSA9PSAnbGVmdCcgdGhlbiBuZC5zZWNvbmQgZWxzZSBuZC5maXJzdFxuICAgICAgICAgICAgICAgICAgICB2ZWNOb2RlICAgPSBpZiBpbmZvLnNpZGUgPT0gJ2xlZnQnIHRoZW4gbmQuZmlyc3QgZWxzZSBuZC5zZWNvbmRcbiAgICAgICAgICAgICAgICAgICAgb3RoZXJJbmRleCA9IG5vZGVBcnJheS5pbmRleE9mIG90aGVyTm9kZVxuICAgICAgICAgICAgICAgICAgICB2ZWNJbmRleCAgID0gbm9kZUFycmF5LmluZGV4T2YgdmVjTm9kZVxuICAgICAgICAgICAgICAgICAgICBvdGhlckluZm8gID0gbm9kZUluZm9zW290aGVySW5kZXhdXG4gICAgICAgICAgICAgICAgICAgIHZlY0luZm8gICAgPSBub2RlSW5mb3NbdmVjSW5kZXhdXG4gICAgICAgICAgICAgICAgICAgIGlmIGluZm8udmVjT3AgPT0gJ3RpbWVzT3JEb3QnXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBvdGhlckluZm8udHlwZSA9PSAnbnVtJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udmVjT3AgPSAndGltZXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mby50eXBlICA9ICd2ZWMnIFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBvdGhlckluZm8udHlwZSA9PSAndmVjJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udmVjT3AgPSAnZG90J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udHlwZSAgPSAnbnVtJyBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgIyBsb2cga3N0ci5scGFkKGluZGV4LCAzKSwgaW5mby50eXBlLCBcIiN7dmVjTm9kZS5iYXNlLnZhbHVlfS4je2luZm8udmVjT3B9KCN7b3RoZXJJbmRleH0pXCJcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBpbmZvLm9wZXJhdG9yXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBmaXJzdEluZGV4ICA9IG5vZGVBcnJheS5pbmRleE9mIG5kLmZpcnN0XG4gICAgICAgICAgICAgICAgICAgIHNlY29uZEluZGV4ID0gbm9kZUFycmF5LmluZGV4T2YgbmQuc2Vjb25kXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBmaXJzdFR5cGUgID0gZmlyc3RJbmRleCAgPCAwIGFuZCAnbnVtJyBvciBub2RlSW5mb3NbZmlyc3RJbmRleF0udHlwZVxuICAgICAgICAgICAgICAgICAgICBzZWNvbmRUeXBlID0gc2Vjb25kSW5kZXggPCAwIGFuZCAnbnVtJyBvciBub2RlSW5mb3Nbc2Vjb25kSW5kZXhdLnR5cGVcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgZmlyc3RUeXBlID09ICd2ZWMnID09IHNlY29uZFR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udmVjT3AgPSAnZG90J1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby50eXBlID0gJ251bSdcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBmaXJzdFR5cGUgPT0gJ3ZlYycgYW5kIHNlY29uZFR5cGUgPT0gJ251bSdcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udmVjT3AgPSAndGltZXMnXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnR5cGUgPSAndmVjJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5zaWRlID0gJ2xlZnQnXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgZmlyc3RUeXBlID09ICdudW0nIGFuZCBzZWNvbmRUeXBlID09ICd2ZWMnXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnZlY09wID0gJ3RpbWVzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby50eXBlID0gJ3ZlYydcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8uc2lkZSA9ICdyaWdodCdcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBmaXJzdFR5cGUgPT0gJ251bScgPT0gc2Vjb25kVHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby50eXBlID0gJ251bSdcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICMgaWYgaW5mby52ZWNPcFxuICAgICAgICAgICAgICAgICAgICAgICAgIyBpZiBpbmZvLnNpZGUgIT0gJ3JpZ2h0J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgbG9nIGtzdHIubHBhZChpbmRleCwgMyksIGluZm8udHlwZSwgZmlyc3RJbmRleCwgaW5mby52ZWNPcCwgc2Vjb25kSW5kZXggIywgaW5mb1xuICAgICAgICAgICAgICAgICAgICAgICAgIyBlbHNlIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgbG9nIGtzdHIubHBhZChpbmRleCwgMyksIGluZm8udHlwZSwgc2Vjb25kSW5kZXgsIGluZm8udmVjT3AsIGZpcnN0SW5kZXggIywgaW5mb1xuICAgICAgICAgICAgICAgICAgICAjIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICMgbG9nIGtzdHIubHBhZChpbmRleCwgMyksIGluZm8udHlwZSwgZmlyc3RJbmRleCwgaW5mby5vcGVyYXRvciwgc2Vjb25kSW5kZXggIywgaW5mb1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAjIGlmIGluZm8udmFsdWUgYW5kIChub3QgaW5mby50eXBlIG9yIGluZm8udHlwZSA9PSAnPz8/JylcbiAgICAgICAgICAgICAgICAgICAgaWYgaW5mby52YWx1ZSBhbmQgbm90IGluZm8udHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBuZC5iYXNlIGluc3RhbmNlb2YgSWRlbnRpZmllckxpdGVyYWwgdGhlbiBpbmZvLnR5cGUgPSAnbnVtJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbmQuYmFzZSBpbnN0YW5jZW9mIE51bWJlckxpdGVyYWwgICAgIHRoZW4gaW5mby50eXBlID0gJ251bSdcbiAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiBpbmZvLnR5cGUgaW4gWydudW0nICd2ZWMnXVxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgIyBsb2cga3N0ci5scGFkKGluZGV4LCAzKSwgaW5mby50eXBlLCBuZC5iYXNlLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBpbmZvLmJvZHkgPT0gJ09wJ1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBib2R5SW5kZXggPSBub2RlQXJyYXkuaW5kZXhPZiBuZC5iYXNlPy5ib2R5Py5leHByZXNzaW9uc1swXVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiB0eXBlID0gbm9kZUluZm9zW2JvZHlJbmRleF0/LnR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIGlmIHR5cGUgIT0gJz8/PydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnR5cGUgPSB0eXBlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICMgbG9nIGtzdHIubHBhZChpbmRleCwgMyksIGluZm8udHlwZSwgYm9keUluZGV4XG4gICAgICAgICAgICAgICAgICAgICMgZWxzZVxuIyAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICMgbG9nIGtzdHIubHBhZChpbmRleCwgMyksIGluZm8udHlwZSwgaW5mbyMsIG5kXG4gICAgXG4gICAgICAgICAgICAjIGxvZyBub29uLnN0cmluZ2lmeSBub2RlSW5mb3NcbiAgICAgICAgICAgICMgbG9nIG5vb24uc3RyaW5naWZ5IG5vZGVBcnJheVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXNvbHZlID0gKG5vZGVJbmRleCkgLT5cbiAgICBcbiAgICAgICAgICAgICAgICBpbmZvID0gbm9kZUluZm9zW25vZGVJbmRleF1cbiAgICAgICAgICAgICAgICBuZCA9IG5vZGVBcnJheVtub2RlSW5kZXhdXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgIyBsb2cgbm9kZUluZGV4LCBpbmZvIywgbmRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBpbmZvLnZlY09wXG4gICAgICAgICAgICAgICAgICAgIHZuID0gaWYgaW5mby5zaWRlID09ICdyaWdodCcgdGhlbiBuZC5zZWNvbmQgZWxzZSBuZC5maXJzdFxuICAgICAgICAgICAgICAgICAgICBwbiA9IGlmIGluZm8uc2lkZSA9PSAncmlnaHQnIHRoZW4gbmQuZmlyc3QgZWxzZSBuZC5zZWNvbmRcbiAgICAgICAgICAgICAgICAgICAgb2kgPSBub2RlQXJyYXkuaW5kZXhPZiBwblxuICAgICAgICAgICAgICAgICAgICBvcCA9IGluZm8udmVjT3BcbiAgICAgICAgICAgICAgICAgICAgXCIje3ZuLmJhc2U/LnZhbHVlID8gcmVzb2x2ZSBub2RlQXJyYXkuaW5kZXhPZiB2bn0uI3tvcH0oI3tyZXNvbHZlIG9pfSlcIlxuICAgICAgICAgICAgICAgIGVsc2UgaWYgaW5mby5vcGVyYXRvclxuICAgICAgICAgICAgICAgICAgICBmaXJzdEluZGV4ICA9IG5vZGVBcnJheS5pbmRleE9mIG5kLmZpcnN0XG4gICAgICAgICAgICAgICAgICAgIHNlY29uZEluZGV4ID0gbm9kZUFycmF5LmluZGV4T2YgbmQuc2Vjb25kXG4gICAgICAgICAgICAgICAgICAgIG9wID0gaW5mby5vcGVyYXRvclxuICAgICAgICAgICAgICAgICAgICBcIiN7cmVzb2x2ZSBmaXJzdEluZGV4fSAje29wfSAje3Jlc29sdmUgc2Vjb25kSW5kZXh9XCJcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIG5kPy5iYXNlPy52YWx1ZSA/IHJlc29sdmUgbm9kZUFycmF5LmluZGV4T2YgbmQuYmFzZS5ib2R5LmV4cHJlc3Npb25zWzBdXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBsb2cgcmVzb2x2ZSAwXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICMgZnJhZyA9IGJvZHkuY29tcGlsZVRvRnJhZ21lbnRzIG9wdHNcbiAgICAgICAgIyBjb25zb2xlLmxvZyAn4pa4dmVjIGZyYWcnIGZyYWdcbiAgICAgICAgZGVkZW50OiB0cnVlXG4gICAgICAgIHJlZHVjZTogdHJ1ZVxuICAgICAgICBib2R5OiAgIHRydWVcbiAgICAgICAgYmxvY2s6ICB0cnVlXG4sICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIFxuXG4gICAgZG9jOiDilrhkb2MgJ+KWuGRvYydcbiAgICAgICAgXG4gICAgICAgIFRoaXMgaXMgYSBzbGlnaHRseSBzcGVjaWFsIG1hY3JvLCBiZWNhdXNlIGl0J3MgZmlyc3QgcGFzcyBpcyBoYXJkY29kZWQgaW4gdGhlIHRva2VuaXplci5cbiAgICAgICAgVGhlIGJvZHkgb2YgdGhlIG1hY3JvIGlzIHdyYXBwZWQgaW4gYSBza2lubnkgdHJpcGxlIHN0cmluZyBiZWZvcmUgZnVydGhlciB0b2tlbml6YXRpb24uXG4gICAgICAgIEl0IGNhbiBjb250YWluIGFueXRoaW5nIGV4Y2VwdCBcXCdcXCdcXCcuXG4gICAgICAgIFxuICAgICAgICBJbiBub3JtYWwgb3BlcmF0aW9uLCBpdCBpcyByZWR1Y2VkIHRvIHRoZSBlbXB0eSBzdHJpbmcuIFxuICAgICAgICBCdXQgaWYgKiprb2ZmZWUqKiBpcyBjYWxsZWQgd2l0aCB0aGUgYC0tZG9jYCBhcmd1bWVudCwgbG9ncyB3aWxsIGJlIGluc2VydGVkIGluc3RlYWQuXG4gICAgICAgIFxuICAgICAgICBgYGBjb2ZmZWVzY3JpcHRcbiAgICAgICAg4pa4ZG9jICd0aXRsZSdcbiAgICAgICAgICAgIG15IGRvY3VtZW50YXRpb24gLi4uXG4gICAgICAgIGxvZyAnc29tZSBjb2RlJ1xuICAgICAgICDilrhkb2NcbiAgICAgICAgICAgIHdlIGFyZSBkb25lLlxuICAgICAgICBgYGBcbiAgICAgICAgXG4gICAgICAgIGBrb2ZmZWUgLS1kb2MgZmlsZWAgd2lsbCBvdXRwdXRcbiAgICAgICAgXG4gICAgICAgIGBgYG1hcmtkb3duXG4gICAgICAgICMjIHRpdGxlXG4gICAgICAgIG15IGRvY3VtZW50YXRpb24gLi4uXG4gICAgICAgIHNvbWUgY29kZVxuICAgICAgICB3ZSBhcmUgZG9uZS5cbiAgICAgICAgYGBgXG4gICAgICAgIFxuICAgICAgICBidXQgYGtvZmZlZSBmaWxlYCB3aWxsIG9ubHkgcHJpbnQgYHNvbWUgY29kZWBcbiAgICAgICAgXG4gICAga2V5OiAgJ+KWuGRvYydcbiAgICBkZXNjOiAn4pa4ZG9jIFtoZWFkZXJdIC4uLidcbiAgICBtZXRhOiAoYXJnczosbm9kZTosb3B0czopIC0+XG4gICAgICAgIGhlYWRlciA9IGFyZ3NbMF0gYW5kIFwiJyMjICN7YXJnc1swXX1cXFxcbicrXCIgb3IgXCInJytcIlxuICAgICAgICBiZWZvcmU6IG9wdHMuZG9jIGFuZCBcIiN7bWV0YUxvZyhvcHRzKX0oI3toZWFkZXJ9XCJcbiAgICAgICAgYWZ0ZXI6ICBcIilcIlxuICAgICAgICBza2lwOiAgIG5vdCBvcHRzLmRvYyBhbmQgd2l0aDpcIicnXCJcbiAgICAgICAgcmVkdWNlOiB0cnVlXG4gICAgICAgIGJvZHk6ICAgdHJ1ZVxuICAgICAgICBibG9jazogIGZhbHNlXG4sICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGtleTogICfilrhwcm9maWxlJyAgIFxuICAgIGRlc2M6ICfilrhwcm9maWxlIFtpZF0gLi4uJ1xuICAgIG1ldGE6IChhcmdzOixub2RlOixvcHRzOikgLT4gXG4gICAgICAgIFxuICAgICAgICBpZCA9IFwiI3tub2RlLmNvbmRpdGlvbi5sb2NhdGlvbkRhdGEuZmlyc3RfbGluZSsxfV8je25vZGUuY29uZGl0aW9uLmxvY2F0aW9uRGF0YS5maXJzdF9jb2x1bW59XCJcbiAgICAgICAgbmFtZSA9IGFyZ3NbMF0gPyBpZFxuICAgICAgICBjb2RlOiAgIFwia29mZmVlXyN7aWR9ID0gcHJvY2Vzcy5ocnRpbWUuYmlnaW50KClcIlxuICAgICAgICBhZnRlcjogIFwiI3ttZXRhTG9nKG9wdHMpfSgnI3tuYW1lfScsIChmdW5jdGlvbihiKXsgbGV0IGY9MTAwMG47IGZvciAobGV0IHUgb2YgWyducycsJ868cycsJ21zJywncyddKSB7IGlmICh1PT0ncycgfHwgYjxmKSB7IHJldHVybiAnJysoMTAwMG4qYi9mKSsnICcrdTsgfSBmKj0xMDAwbjsgfX0pKHByb2Nlc3MuaHJ0aW1lLmJpZ2ludCgpLWtvZmZlZV8je2lkfSkpO1wiXG4gICAgICAgIHJlZHVjZTogZmFsc2VcbiAgICAgICAgYm9keTogICB0cnVlXG4sXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGtleTogICfilrhhdmVyYWdlJyAgIFxuICAgIGRlc2M6ICfilrhhdmVyYWdlIG51bSAuLi4nXG4gICAgbWV0YTogKGFyZ3M6LG5vZGU6LG9wdHM6KSAtPiBcbiAgICAgICAgXG4gICAgICAgIGlkICA9IFwiI3tub2RlLmNvbmRpdGlvbi5sb2NhdGlvbkRhdGEuZmlyc3RfbGluZSsxfV8je25vZGUuY29uZGl0aW9uLmxvY2F0aW9uRGF0YS5maXJzdF9jb2x1bW59XCJcbiAgICAgICAgbnVtID0gYXJnc1swXSA/IDEwMFxuICAgICAgICBiZWZvcmU6ICBcIlwiXCJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAga29mZmVlXyN7aWR9ID0gMG47XG4gICAgICAgICAgICBmb3IoaSA9IDA7IGkgPCAje251bX07IGkrKykgXG4gICAgICAgICAgICB7IFxuICAgICAgICAgICAgICAgIGtvZmZlZV8je2lkfV9zdGFydCA9IHByb2Nlc3MuaHJ0aW1lLmJpZ2ludCgpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgYWZ0ZXI6IFwiXCJcIlxuICAgICAgICAgICAga29mZmVlXyN7aWR9ICs9IHByb2Nlc3MuaHJ0aW1lLmJpZ2ludCgpIC0ga29mZmVlXyN7aWR9X3N0YXJ0O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGtvZmZlZV8je2lkfSAvPSAje251bX1uO1xuICAgICAgICAgICAgI3ttZXRhTG9nKG9wdHMpfSgnI3tpZH0nLCAoZnVuY3Rpb24oYil7IGxldCBmPTEwMDBuOyBmb3IgKGxldCB1IG9mIFsnbnMnLCfOvHMnLCdtcycsJ3MnXSkgeyBpZiAodT09J3MnIHx8IGI8ZikgeyByZXR1cm4gJycrKDEwMDBuKmIvZikrJyAnK3U7IH0gZio9MTAwMG47IH19KShrb2ZmZWVfI3tpZH0pKTsgXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgcmVkdWNlOiB0cnVlXG4gICAgICAgIGJvZHk6ICAgdHJ1ZVxuLFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBrZXk6ICAn4pa4c3RhcnQnICAgXG4gICAgZGVzYzogJ+KWuHN0YXJ0IGlkIC4uLidcbiAgICBpbmZvOlxuICAgICAgICB0aGVuOiB0cnVlXG4gICAgICAgIGFyZ3M6IDFcbiAgICBtZXRhOiAoYXJnczopIC0+IFxuICAgICAgICBpZCA9IGFyZ3NbMF0gPyAnc3RhcnRfZW5kJ1xuICAgICAgICBiZWZvcmU6IFwia29mZmVlXyN7aWR9ID0gcHJvY2Vzcy5ocnRpbWUuYmlnaW50KClcIlxuICAgICAgICByZWR1Y2U6IHRydWVcbiAgICAgICAgYm9keTogICBmYWxzZVxuLFxuICAgIGtleTogICfilrhlbmQnICAgICBcbiAgICBkZXNjOiAn4pa4ZW5kIGlkIC4uLidcbiAgICBpbmZvOlxuICAgICAgICB0aGVuOiB0cnVlXG4gICAgICAgIGFyZ3M6IDFcbiAgICBtZXRhOiAoYXJnczosb3B0czopIC0+IFxuICAgICAgICBpZCA9IGFyZ3NbMF0gPyAnc3RhcnRfZW5kJ1xuICAgICAgICBiZWZvcmU6IFwiI3ttZXRhTG9nKG9wdHMpfSgnI3tpZH0nLCAoZnVuY3Rpb24oYil7IGxldCBmPTEwMDBuOyBmb3IgKGxldCB1IG9mIFsnbnMnLCfOvHMnLCdtcycsJ3MnXSkgeyBpZiAodT09J3MnIHx8IGI8ZikgeyByZXR1cm4gJycrKDEwMDBuKmIvZikrJyAnK3U7IH0gZio9MTAwMG47IH19KShwcm9jZXNzLmhydGltZS5iaWdpbnQoKS1rb2ZmZWVfI3tpZH0pKTtcIlxuICAgICAgICByZWR1Y2U6IHRydWVcbiAgICAgICAgYm9keTogICBmYWxzZVxuLCAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGtleTogICfilrhkYmcnICAgIFxuICAgIGRlc2M6ICfilrhkYmcgW21zZ10gLi4uJ1xuICAgIGluZm86XG4gICAgICAgIHRoZW46IHRydWUgIyBzaG91bGQgbm90IGJlIHVzZWQgd2l0aCBhIGJsb2NrXG4gICAgICAgIGFyZ3M6IDFcbiAgICBtZXRhOiAob3B0czosYXJnczosbm9kZTopIC0+XG4gICAgICAgIGJlZm9yZTogbG9nU291cmNlIHtvcHRzLCBhcmdzLCBub2RlfVxuICAgICAgICBhZnRlcjogICcpJ1xuICAgICAgICByZWR1Y2U6IHRydWVcbiAgICAgICAgYm9keTogICB0cnVlXG4gICAgICAgIGJsb2NrOiAgZmFsc2VcbiwgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBrZXk6ICAn4pa4YXNzZXJ0JyAgICBcbiAgICBkZXNjOiAn4pa4YXNzZXJ0IFttc2ddIC4uLidcbiAgICBtZXRhOiAob3B0czosYXJnczosbm9kZTopIC0+XG4gICAgICAgIFxuICAgICAgICBub2RlcyA9IHJlcXVpcmUgJy4vbm9kZXMnXG4gICAgICAgIHsgQmxvY2ssIGV4dGVuZCB9ID0gbm9kZXNcbiAgICAgICAgaWYgbm9kZS5ib2R5IGluc3RhbmNlb2YgQmxvY2tcbiAgICAgICAgICAgIGJvZHkgPSBub2RlLmJvZHkuZXhwcmVzc2lvbnNbMF1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgYm9keSA9IG5vZGUuYm9keVxuICAgICAgICAgICAgXG4gICAgICAgIGZyYWcgPSBib2R5LmNvbXBpbGVUb0ZyYWdtZW50cyBvcHRzXG4gICAgICAgIHRleHQgPSBub2RlLmZyYWdtZW50c1RvVGV4dCBmcmFnXG4gICAgICAgIGFyZ3MgPSBbJ2Fzc2VydGlvbiBmYWlsdXJlISddIGlmIG5vdCBhcmdzLmxlbmd0aFxuICAgICAgICBiZWZvcmU6IGxvZ1NvdXJjZSB7b3B0cywgYXJncywgbm9kZSwgY2xvc2U6dHJ1ZX1cbiAgICAgICAgYWZ0ZXI6ICAncHJvY2Vzcy5leGl0KDY2Nik7J1xuICAgICAgICB0aGVuOiAgIHRydWUgIyBzaG91bGQgbm90IGJlIHVzZWQgd2l0aCBhIGJsb2NrXG4gICAgICAgIGV2YWw6ICAgZmFsc2VcbiAgICAgICAgcmVkdWNlOiBmYWxzZVxuICAgICAgICBjb2RlOiAgIFwiISgje3RleHR9KVwiXG4sICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAgICAgICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICBcbiAgICBrZXk6ICAn4pa4dGVzdCdcbiAgICBkZXNjOiAn4pa4dGVzdCBbaWRdIC4uLidcbiAgICBtZXRhOiAob3B0czosYXJnczosbm9kZTopIC0+XG4gICAgICAgIGJlZm9yZSAgPSBsb2dTb3VyY2Uge29wdHMsIGFyZ3MsIG5vZGUsIGNsb3NlOnRydWV9XG4gICAgICAgIGJlZm9yZSArPSAnXFxuICAgIHRyeSB7XFxuJ1xuICAgICAgICBkZWRlbnQ6IHRydWVcbiAgICAgICAgYmVmb3JlOiBvcHRzLnRlc3QgYW5kIGJlZm9yZVxuICAgICAgICBhZnRlcjogIG9wdHMudGVzdCBhbmQgXCJ9IGNhdGNoKGVycikgeyAje21ldGFMb2cob3B0cyl9KGVyci5tZXNzYWdlKTsgfVxcblwiXG4gICAgICAgIHNraXA6ICAgbm90IG9wdHMudGVzdFxuICAgICAgICByZWR1Y2U6IHRydWVcbiAgICAgICAgYm9keTogICB0cnVlXG4sICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgIFxuICAgIGtleTogJ+KWuHJhbmQnICAgIFxuICAgIG1ldGE6IChhcmdzOikgLT4gXG4gICAgICAgIGNvZGU6ICAgXCJNYXRoLnJhbmRvbSgpIDwgI3thcmdzP1swXSA/IDAuNX1cIiBcbiAgICAgICAgcmVkdWNlOiBmYWxzZSBcbiAgICAgICAgYm9keTogICB0cnVlICAgXG4gICAgXG4gICAgIyBrZXk6ICd0b2tlbicgJ3BhcnNlJyAnY29kZSdcbl1cblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcblxuVEFCID0gJyAgICAnXG5cbmNvbXBpbGVNZXRhSWYgPSAobm9kZTosb3B0czopIC0+XG5cbiAgICBub2RlcyA9IHJlcXVpcmUgJy4vbm9kZXMnXG4gICAgXG4gICAgeyBCbG9jaywgQXNzaWduLCBWYWx1ZSwgTGl0ZXJhbCB9ID0gbm9kZXNcbiAgICB7IGV4dGVuZCwgbWVyZ2UgfSA9IGhlbHBlcnNcbiAgICAgICAgXG4gICAgaW5mbyA9IHJlZHVjZTp0cnVlLCBldmFsOnRydWVcbiAgICBcbiAgICBpZiBub2RlLmNvbmRpdGlvbi5iYXNlPy52YWx1ZT8uc3RhcnRzV2l0aCAn4pa4J1xuICAgICAgICBcbiAgICAgICAgbWV0YUtleSA9IG5vZGUuY29uZGl0aW9uLmJhc2UudmFsdWVcbiAgICAgICAgaWYgdHlwZW9mIG9wdHMubWV0YVttZXRhS2V5XSA9PSAnZnVuY3Rpb24nXG4gICAgICAgICAgICBpbmZvID0gb3B0cy5tZXRhW21ldGFLZXldIHtvcHRzLCBub2RlLCBhcmdzOltdfVxuICAgICAgICAgICAgXG4gICAgaWYgbm9kZS5jb25kaXRpb24udmFyaWFibGU/LmJhc2U/LnZhbHVlPy5zdGFydHNXaXRoICfilrgnXG4gICAgICAgIFxuICAgICAgICBtZXRhS2V5ID0gbm9kZS5jb25kaXRpb24udmFyaWFibGUuYmFzZS52YWx1ZVxuICAgICAgICBpZiB0eXBlb2Ygb3B0cy5tZXRhW21ldGFLZXldID09ICdmdW5jdGlvbidcbiAgICAgICAgICAgIGFyZ3MgPSBub2RlLmNvbmRpdGlvbi5hcmdzLm1hcCAoYSkgLT4gXG4gICAgICAgICAgICAgICAgYS5iYXNlPy52YWx1ZVxuICAgICAgICAgICAgYXJncyA9IGFyZ3MubWFwIChhKSAtPiBpZiBhWzBdIGluIFsnXCInLCBcIidcIl0gdGhlbiBhWzEuLi0yXSBlbHNlIGFcbiAgICAgICAgICAgIGluZm8gPSBvcHRzLm1ldGFbbWV0YUtleV0ge29wdHMsIG5vZGUsIGFyZ3N9XG4gICAgICAgIFxuICAgIGlmIGluZm8uc2tpcCBcbiAgICAgICAgaWYgaW5mby5za2lwLndpdGg/XG4gICAgICAgICAgICByZXR1cm4gbm9kZS5tYWtlQ29kZSBpbmZvLnNraXAud2l0aFxuICAgICAgICByZXR1cm4gW11cbiAgICBcbiAgICBpZiBpbmZvLmV2YWxcbiAgICAgICAgXG4gICAgICAgIGNvbmQgPSBpbmZvLmNvZGUgPyBub2RlLmZyYWdtZW50c1RvVGV4dCBub2RlLmNvbmRpdGlvbi5jb21waWxlVG9GcmFnbWVudHMgb3B0cywgMiAjTEVWRUxfUEFSRU5cbiAgICAgICAgdHJ5XG4gICAgICAgICAgICBvcyA9IHJlcXVpcmUgJ29zJ1xuICAgICAgICAgICAgZnMgPSByZXF1aXJlICdmcydcbiAgICAgICAgICAgIGluZm8uYm9keSA9ISEgZXZhbCBjb25kXG4gICAgICAgICAgICBpZiBpbmZvLmV2YWwgYW5kIGluZm8ucmVkdWNlIGFuZCBub3QgaW5mby5ib2R5IGFuZCBub3Qgbm9kZS5lbHNlQm9keVxuICAgICAgICAgICAgICAgIHJldHVybiBbXVxuICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgIGVycm9yIGVyclxuICAgICAgICBcbiAgICBmcmFnID0gW11cbiAgICBcbiAgICBpZiBpbmZvLnJlZHVjZSA9PSBmYWxzZVxuICAgICAgICBmcmFnID0gZnJhZy5jb25jYXQgbm9kZS5tYWtlQ29kZShcImlmIChcIiksIG5vZGUubWFrZUNvZGUoaW5mby5jb2RlKSwgbm9kZS5tYWtlQ29kZShcIikge1xcblwiKVxuICAgICAgICBcbiAgICAgICAgaW5kZW50ID0gb3B0cy5pbmRlbnQgKyBUQUJcbiAgICAgICAgYm9keU9wdCA9IG1lcmdlIG9wdHMsIHtpbmRlbnR9XG4gICAgZWxzZVxuICAgICAgICBpbmRlbnQgPSBvcHRzLmluZGVudFxuICAgICAgICBib2R5T3B0ID0gb3B0c1xuXG4gICAgaWYgaW5mby5iZWZvcmVcbiAgICAgICAgZnJhZy5wdXNoIG5vZGUubWFrZUNvZGUgKGluZm8uYmxvY2shPWZhbHNlIGFuZCBpbmZvLmRlZGVudCE9dHJ1ZSBhbmQgaW5kZW50IG9yICcnKSArIGluZm8uYmVmb3JlXG4gICAgICAgIFxuICAgIGlmIGluZm8uYm9keVxuICAgICAgICBpZiBpbmZvLmJsb2NrICE9IGZhbHNlXG4gICAgICAgICAgICBib2R5ID0gbm9kZS5lbnN1cmVCbG9jayBub2RlLmJvZHlcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgbm9kZS5ib2R5IGluc3RhbmNlb2YgQmxvY2tcbiAgICAgICAgICAgICAgICBib2R5ID0gbm9kZS5ib2R5LmV4cHJlc3Npb25zWzBdXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgYm9keSA9IG5vZGUuYm9keVxuICAgICAgICBpZiBib2R5XG4gICAgICAgICAgICBmcmFnID0gZnJhZy5jb25jYXQgYm9keS5jb21waWxlVG9GcmFnbWVudHMgYm9keU9wdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBmcmFnLnB1c2ggbm9kZS5tYWtlQ29kZSBcIicnXCIgIyBpZiBpbmZvLmJsb2NrID09IGZhbHNlID8/XG4gICAgICAgIFxuICAgIGlmIGluZm8uYWZ0ZXJcbiAgICAgICAgZnJhZy5wdXNoIG5vZGUubWFrZUNvZGUgKChpbmZvLmJsb2NrICE9IGZhbHNlKSBhbmQgKCdcXG4nICsgaW5kZW50KSBvciAnJykgKyBpbmZvLmFmdGVyXG5cbiAgICBpZiBub3QgaW5mby5yZWR1Y2VcbiAgICAgICAgZnJhZy5wdXNoIG5vZGUubWFrZUNvZGUoXCJcXG4je25vZGUudGFifX1cIilcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgaWYgbm9kZS5lbHNlQm9keSBhbmQgKGluZm8ucmVkdWNlID09IGZhbHNlIG9yIGluZm8uYm9keSA9PSBmYWxzZSlcbiAgICAgICAgZnJhZy5wdXNoIG5vZGUubWFrZUNvZGUgJyBlbHNlICcgaWYgbm90IGluZm8ucmVkdWNlXG4gICAgICAgIGlmIG5vZGUuaXNDaGFpblxuICAgICAgICAgICAgZnJhZyA9IGZyYWcuY29uY2F0IG5vZGUuZWxzZUJvZHkudW53cmFwKCkuY29tcGlsZVRvRnJhZ21lbnRzIGJvZHlPcHRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZnJhZyA9IGZyYWcuY29uY2F0IG5vZGUuZWxzZUJvZHkuY29tcGlsZVRvRnJhZ21lbnRzIGJvZHlPcHRcbiAgICAgICAgXG4gICAgcmV0dXJuIGZyYWdcbiAgICBcbiMgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4jIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuIyAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG5cbm1ldGFMb2cgPSAob3B0cykgLT4gb3B0cy5tZXRhbG9nID8gJ2NvbnNvbGUubG9nJ1xuXG5sb2dTb3VyY2UgPSAob3B0czosYXJnczosbm9kZTosY2xvc2U6KSAtPlxuICAgIFxuICAgIGNvbG9yZXR0ZSA9IHJlcXVpcmUgJ2NvbG9yZXR0ZSdcbiAgICB7IHllbGxvdywgYmx1ZSwgeWVsbG93QnJpZ2h0LCBibHVlQnJpZ2h0LCB3aGl0ZUJyaWdodCwgZGltLCBib2xkLCBncmF5IH0gPSBjb2xvcmV0dGUuY3JlYXRlQ29sb3JzIHVzZUNvbG9yOiBvcHRzLmZlYXR1cmUuY29sb3JcbiAgICBcbiAgICBzb3VyY2UgPSBvcHRzLnNvdXJjZSA/IG9wdHMuZmlsZW5hbWUgPyAnJ1xuICAgIGV4dCA9ICcnXG4gICAgaWYgc291cmNlXG4gICAgICAgIFtzb3VyY2UsIGV4dC4uLl0gPSBwYXRoLmJhc2VuYW1lKHNvdXJjZSkuc3BsaXQgJy4nXG4gICAgICAgIHNvdXJjZSAgPSB5ZWxsb3cgW3llbGxvd0JyaWdodChzb3VyY2UpLCBkaW0gZXh0LmpvaW4nLiddLmpvaW4gZGltICcuJ1xuICAgIGJlZm9yZSAgPSBcIiN7bWV0YUxvZyhvcHRzKX0oJyN7c291cmNlfSN7ZGltIGJsdWUgJzonfSN7Ymx1ZUJyaWdodCBcIiN7bm9kZS5jb25kaXRpb24ubG9jYXRpb25EYXRhLmZpcnN0X2xpbmUrMX1cIn0nXCJcbiAgICBiZWZvcmUgKz0gXCIsICcje2JvbGQgd2hpdGVCcmlnaHQgYXJnc1swXX0nXCIgaWYgYXJnc1swXSBcbiAgICBpZiAoY2xvc2UpXG4gICAgICAgIGJlZm9yZSArPSAnKTtcXG4nXG4gICAgZWxzZVxuICAgICAgICBiZWZvcmUgKz0gXCIsIFwiXG5cbiAgICBiZWZvcmVcbiAgICAgICAgXG4jIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICBcbiMgMDAwICAwMDAwICAwMDAgICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuIyAwMDAgIDAwMCAwIDAwMCAgICAgICAgMDAwICAwMDAwMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4jIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiMgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIFxuXG5pbmplY3RNZXRhID0gKG9wdGlvbnMpIC0+ICMgbWFrZSBzdXJlIHRoYXQgb3B0aW9ucyBoYXMgYSBtZXRhIHNldFxuICAgIFxuICAgIG9wdGlvbnMgPz0ge31cbiAgICBcbiAgICB7IGV4dGVuZCB9ID0gaGVscGVyc1xuICAgIFxuICAgIGRlZmF1bHRNZXRhID0ge31cbiAgICBNRVRBLm1hcCAobSkgLT4gZGVmYXVsdE1ldGFbbS5rZXldID0gbS5tZXRhOyBtLm1ldGEua2V5ID0gbS5rZXk7IG0ubWV0YS5pbmZvID0gbS5pbmZvXG4gICAgXG4gICAgbWV0YSAgICA9IGV4dGVuZCBkZWZhdWx0TWV0YSwgb3B0aW9ucy5tZXRhID8ge31cbiAgICBvcHRpb25zID0gZXh0ZW5kIHsgbWV0YTogbWV0YSB9LCBvcHRpb25zXG4gICAgb3B0aW9uc1xuXG5sb2dNZXRhcyA9IC0+XG4gICAgXG4gICAgbG9nIFwiI3tncmF5ICdNZXRhczonfVxcblxcbiN7IE1FVEEubWFwKChmKSAtPiBcIiAgICAje2hlbHBlcnMucGFkIGYua2V5fSN7Z3JheSBmLmRlc2MgPyBcIiN7Zi5rZXl9IC4uLlwifVwiKS5qb2luKCdcXG4nKSB9XCJcbiAgICBsb2cgXCIgICAg4pa4aWYgICAgICAgICAgICAgICAgICAgICAje2dyYXkgJ+KWuGlmIGNvbmQgLi4uIFtb4pa4ZWxpZiBjb25kIC4uLl0g4pa4ZWxzZSAuLi5dJ31cXG5cIlxuICAgIFxubW9kdWxlLmV4cG9ydHMgPSB7IE1FVEEsIGluamVjdE1ldGEsIGxvZ01ldGFzLCBjb21waWxlTWV0YUlmIH1cbiJdfQ==
//# sourceURL=../coffee/meta.coffee