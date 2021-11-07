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
            var Block, IdentifierLiteral, NumberLiteral, Op, Value, args, body, bodyIndex, config, firstIndex, firstType, identifiers, index, info, j, k, kstr, len, nd, node, nodeArray, nodeIndex, nodeInfos, nodes, noon, opts, otherIndex, otherInfo, otherNode, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, results, secondIndex, secondType, type, vecIndex, vecInfo, vecNode;
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
            body = node.body;
            nodeInfos = [];
            nodeIndex = -1;
            node.body.traverseChildren(true, function(node) {
                var firstIsValue, firstIsVec, ref4, ref5, ref6, ref7, ref8, ref9, secondIsValue, secondIsVec;
                if (node instanceof Op) {
                    firstIsValue = node.first instanceof Value;
                    secondIsValue = node.second instanceof Value;
                    firstIsVec = firstIsValue && (ref4 = node.first.base.value, indexOf.call(identifiers, ref4) >= 0);
                    secondIsVec = secondIsValue && (ref5 = node.second.base.value, indexOf.call(identifiers, ref5) >= 0);
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
                            nodeInfos[nodeIndex].body = (ref6 = node.base.body) != null ? (ref7 = ref6.expressions) != null ? (ref8 = ref7[0]) != null ? ref8.constructor.name : void 0 : void 0 : void 0;
                        } else {
                            nodeInfos[nodeIndex].value = node.base.value;
                        }
                        if (ref9 = node.base.value, indexOf.call(identifiers, ref9) >= 0) {
                            return nodeInfos[nodeIndex].type = 'vec';
                        } else {
                            return nodeInfos[nodeIndex].type = '???';
                        }
                    }
                }
            });
            nodeArray = nodeInfos.map(function(i) {
                var n;
                n = i.node;
                delete i.node;
                return n;
            });
            ref5 = (function() {
                results = [];
                for (var k = ref4 = nodeInfos.length - 1; ref4 <= 0 ? k <= 0 : k >= 0; ref4 <= 0 ? k++ : k--){ results.push(k); }
                return results;
            }).apply(this);
            for (j = 0, len = ref5.length; j < len; j++) {
                index = ref5[j];
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
                    if (firstType === 'vec' && secondType === 'vec') {
                        info.vecOp = 'dot';
                        info.type = 'num';
                    } else if (firstType === 'vec' && secondType === 'num') {
                        info.vecOp = 'times';
                        info.type = 'vec';
                    } else if (firstType === 'num' && secondType === 'vec') {
                        info.vecOp = 'times';
                        info.type = 'vec';
                    }
                    console.log(kstr.lpad(index, 3), info.type, firstIndex, info.operator, secondIndex);
                } else {
                    if (info.value && (!info.type || info.type === '???')) {
                        if (nd.base instanceof IdentifierLiteral) {
                            info.type = 'num';
                        }
                        if (nd.base instanceof NumberLiteral) {
                            info.type = 'num';
                        }
                    }
                    if ((ref6 = info.type) === 'num' || ref6 === 'vec') {
                        console.log(kstr.lpad(index, 3), info.type, nd.base.value);
                    } else if (info.body === 'Op') {
                        bodyIndex = nodeArray.indexOf((ref7 = nd.base) != null ? (ref8 = ref7.body) != null ? ref8.expressions[0] : void 0 : void 0);
                        if (type = (ref9 = nodeInfos[bodyIndex]) != null ? ref9.type : void 0) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YS5qcyIsInNvdXJjZVJvb3QiOiIuLi9jb2ZmZWUiLCJzb3VyY2VzIjpbIm1ldGEuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGlGQUFBO0lBQUE7OztBQVFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7QUFFUCxPQUFBLEdBQVUsT0FBQSxDQUFRLFdBQVI7O0FBQ1YsT0FBTyxDQUFDLE1BQVIsQ0FBQTs7QUFFQSxJQUFBLEdBQU87SUFRSDtRQUFBLEdBQUEsRUFBTSxNQUFOO1FBQ0EsSUFBQSxFQUFNLGNBRE47UUFFQSxJQUFBLEVBQU0sU0FBQyxJQUFEO0FBRUYsZ0JBQUE7WUFGRyx5Q0FBRyxNQUFHLDJDQUFHLE1BQUcsMkNBQUc7WUFFbEIsTUFBQSxHQUFZLHNEQUFILEdBQXNCLElBQUssQ0FBQSxDQUFBLENBQTNCLEdBQW1DO2dCQUFBLEtBQUEsRUFBTSxPQUFOO2dCQUFjLEdBQUEsRUFBSSxLQUFsQjtnQkFBd0IsSUFBQSxFQUFLLE1BQTdCO2dCQUFvQyxLQUFBLEVBQU0sT0FBMUM7O1lBRTVDLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUjtZQUNOLGFBQUYsRUFBTSxtQkFBTixFQUFhLG1CQUFiLEVBQW9CLG1DQUFwQixFQUFtQztZQUVuQyxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7WUFDUCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7WUFHUCxXQUFBLEdBQWMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBcEIsQ0FBd0IsU0FBQyxHQUFEO3VCQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFBbEIsQ0FBeEI7WUFBK0MsT0FBQSxDQUU3RCxHQUY2RCxDQUV6RCxXQUZ5RDtZQUk3RCxJQUFBLEdBQU8sSUFBSSxDQUFDO1lBS1osU0FBQSxHQUFZO1lBQ1osU0FBQSxHQUFZLENBQUM7WUFFYixJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFWLENBQTJCLElBQTNCLEVBQWlDLFNBQUMs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QUFZLENBQUEsQ0FBQyxDQUFDLEdBQUYsQ0FBWixHQUFxQixDQUFDLENBQUM7UUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQVAsR0FBYSxDQUFDLENBQUM7ZUFBSyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQVAsR0FBYyxDQUFDLENBQUM7SUFBeEUsQ0FBVDtJQUVBLElBQUEsR0FBVSxNQUFBLENBQU8sV0FBUCx1Q0FBbUMsRUFBbkM7SUFDVixPQUFBLEdBQVUsTUFBQSxDQUFPO1FBQUUsSUFBQSxFQUFNLElBQVI7S0FBUCxFQUF1QixPQUF2QjtXQUNWO0FBWFM7O0FBYWIsUUFBQSxHQUFXLFNBQUE7SUFFUixPQUFBLENBQUMsR0FBRCxDQUFPLENBQUMsSUFBQSxDQUFLLFFBQUwsQ0FBRCxDQUFBLEdBQWUsTUFBZixHQUFvQixDQUFFLElBQUksQ0FBQyxHQUFMLENBQVMsU0FBQyxDQUFEO0FBQU8sWUFBQTtlQUFBLE1BQUEsR0FBTSxDQUFDLE9BQU8sQ0FBQyxHQUFSLENBQVksQ0FBQyxDQUFDLEdBQWQsQ0FBRCxDQUFOLEdBQTBCLENBQUMsSUFBQSxnQ0FBaUIsQ0FBQyxDQUFDLEdBQUgsR0FBTyxNQUF2QixDQUFEO0lBQWpDLENBQVQsQ0FBMEUsQ0FBQyxJQUEzRSxDQUFnRixJQUFoRixDQUFGLENBQTNCO1dBQXFILE9BQUEsQ0FDcEgsR0FEb0gsQ0FDaEgsOEJBQUEsR0FBOEIsQ0FBQyxJQUFBLENBQUssMkNBQUwsQ0FBRCxDQUE5QixHQUFnRixJQURnQztBQUY3Rzs7QUFLWCxNQUFNLENBQUMsT0FBUCxHQUFpQjtJQUFFLE1BQUEsSUFBRjtJQUFRLFlBQUEsVUFBUjtJQUFvQixVQUFBLFFBQXBCO0lBQThCLGVBQUEsYUFBOUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwICAgICAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICBcbjAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICBcbjAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICBcbjAwMCAwIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICBcbjAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICBcbiMjI1xuXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcblxuaGVscGVycyA9IHJlcXVpcmUgJy4vaGVscGVycydcbmhlbHBlcnMuY29sb3JzKClcblxuTUVUQSA9IFtcblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgIDAwMCAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgICAgIDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgIFxuICAgIGtleTogICfilrh2ZWMnXG4gICAgZGVzYzogJ+KWuHZlYyhhLCAuLi4pJ1xuICAgIG1ldGE6IChhcmdzOixub2RlOixvcHRzOikgLT5cbiAgICAgICAgXG4gICAgICAgIGNvbmZpZyA9IGlmIGFyZ3NbMF0/LmRvdD8gdGhlbiBhcmdzWzBdIGVsc2UgdGltZXM6J3RpbWVzJyBkb3Q6J2RvdCcgcGx1czoncGx1cycgbWludXM6J21pbnVzJ1xuXG4gICAgICAgIG5vZGVzID0gcmVxdWlyZSAnLi9ub2RlcydcbiAgICAgICAgeyBPcCwgVmFsdWUsIEJsb2NrLCBOdW1iZXJMaXRlcmFsLCBJZGVudGlmaWVyTGl0ZXJhbCB9ID0gbm9kZXNcbiAgICAgICAgXG4gICAgICAgIG5vb24gPSByZXF1aXJlICdub29uJ1xuICAgICAgICBrc3RyID0gcmVxdWlyZSAna3N0cidcbiAgICAgICAgIyBsb2cgJ+KWuHZlYyBub2RlJyBub2RlLCBub29uLnN0cmluZ2lmeSBub2RlXG4gICAgICAgIFxuICAgICAgICBpZGVudGlmaWVycyA9IG5vZGUuY29uZGl0aW9uLmFyZ3MubWFwIChhcmcpIC0+IGFyZy5iYXNlLnZhbHVlXG5cbiAgICAgICAgbG9nIGlkZW50aWZpZXJzXG4gICAgICAgIFxuICAgICAgICBib2R5ID0gbm9kZS5ib2R5XG4gICAgICAgIFxuICAgICAgICAjIGV4cHMgPSBub2RlLmJvZHkuZXhwcmVzc2lvbnNcbiAgICAgICAgIyBsb2cgJ+KWuHZlYyBub2RlLmJvZHkuZXhwcmVzc2lvbnMnIGV4cHMgIywgbm9vbi5zdHJpbmdpZnkgZXhwc1xuICAgICAgICBcbiAgICAgICAgbm9kZUluZm9zID0gW11cbiAgICAgICAgbm9kZUluZGV4ID0gLTFcbiAgICAgICAgXG4gICAgICAgIG5vZGUuYm9keS50cmF2ZXJzZUNoaWxkcmVuIHRydWUsIChub2RlKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBub2RlIGluc3RhbmNlb2YgT3BcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAjIGxvZyAn4pa4dmVjIGNoaWxkJyBub2RlXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGZpcnN0SXNWYWx1ZSAgPSBub2RlLmZpcnN0ICBpbnN0YW5jZW9mIFZhbHVlIFxuICAgICAgICAgICAgICAgIHNlY29uZElzVmFsdWUgPSBub2RlLnNlY29uZCBpbnN0YW5jZW9mIFZhbHVlIFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGZpcnN0SXNWZWMgID0gZmlyc3RJc1ZhbHVlIGFuZCBub2RlLmZpcnN0LmJhc2UudmFsdWUgIGluIGlkZW50aWZpZXJzXG4gICAgICAgICAgICAgICAgc2Vjb25kSXNWZWMgPSBzZWNvbmRJc1ZhbHVlIGFuZCBub2RlLnNlY29uZC5iYXNlLnZhbHVlIGluIGlkZW50aWZpZXJzXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgbm9kZS5vcGVyYXRvciA9PSAnKidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3NbKytub2RlSW5kZXhdID0ge25vZGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgZmlyc3RJc1ZlYyBhbmQgc2Vjb25kSXNWZWNcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgbG9nICfilrh2ZWMgZG90JyBub2RlLmZpcnN0LmJhc2UudmFsdWUsIG5vZGUuc2Vjb25kLmJhc2UudmFsdWUgXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS52ZWNPcCA9ICdkb3QnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udHlwZSAgPSAnbnVtJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGZpcnN0SXNWZWNcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgbG9nICfilrh2ZWMgdGltZXMnIG5vZGUuZmlyc3QuYmFzZS52YWx1ZVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0uc2lkZSAgPSAnbGVmdCdcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIHNlY29uZElzVmFsdWUgYW5kIG5vZGUuc2Vjb25kLmJhc2UgaW5zdGFuY2VvZiBOdW1iZXJMaXRlcmFsIG9yIG5vZGUuc2Vjb25kLmJhc2UgaW5zdGFuY2VvZiBJZGVudGlmaWVyTGl0ZXJhbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS52ZWNPcCA9ICd0aW1lcydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udHlwZSAgPSAndmVjJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAndGltZXNPckRvdCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udHlwZSAgPSAnPz8/J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIHNlY29uZElzVmVjXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIGxvZyAn4pa4dmVjIGx0aW1lcycgbm9kZS5zZWNvbmQuYmFzZS52YWx1ZVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0uc2lkZSAgPSAncmlnaHQnXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBmaXJzdElzVmFsdWUgYW5kIG5vZGUuZmlyc3QuYmFzZSBpbnN0YW5jZW9mIE51bWJlckxpdGVyYWwgb3Igbm9kZS5maXJzdC5iYXNlIGluc3RhbmNlb2YgSWRlbnRpZmllckxpdGVyYWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAndGltZXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgID0gJ3ZlYydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnZlY09wID0gJ3RpbWVzT3JEb3QnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgID0gJz8/PydcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLm9wZXJhdG9yICA9ICcqJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIG5vZGUub3BlcmF0b3IgPT0gJysnXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3NbKytub2RlSW5kZXhdID0ge25vZGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgZmlyc3RJc1ZlYyBhbmQgc2Vjb25kSXNWZWNcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgbG9nICfilrh2ZWMgcGx1cycgbm9kZS5maXJzdC5iYXNlLnZhbHVlLCBub2RlLnNlY29uZC5iYXNlLnZhbHVlIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnZlY09wID0gJ3BsdXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udHlwZSAgPSAndmVjJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGZpcnN0SXNWZWNcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnNpZGUgID0gJ2xlZnQnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAncGx1cydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICA9ICd2ZWMnXG5cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBzZWNvbmRJc1ZlY1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0uc2lkZSAgPSAncmlnaHQnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAncGx1cydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICA9ICd2ZWMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS5vcGVyYXRvciAgPSAnKydcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgICAgICA9ICc/Pz8nXG5cbiAgICAgICAgICAgICAgICBpZiBub2RlLm9wZXJhdG9yID09ICctJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3NbKytub2RlSW5kZXhdID0ge25vZGV9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiBmaXJzdElzVmVjIGFuZCBzZWNvbmRJc1ZlY1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBsb2cgJ+KWuHZlYyBtaW51cycgbm9kZS5maXJzdC5iYXNlLnZhbHVlLCBub2RlLnNlY29uZC5iYXNlLnZhbHVlIFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAnbWludXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udHlwZSAgPSAndmVjJ1xuXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgZmlyc3RJc1ZlY1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0uc2lkZSAgPSAnbGVmdCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS52ZWNPcCA9ICdtaW51cydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICA9ICd2ZWMnXG5cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBzZWNvbmRJc1ZlY1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0uc2lkZSAgPSAncmlnaHQnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udmVjT3AgPSAnbWludXMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udHlwZSAgPSAndmVjJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0ub3BlcmF0b3IgID0gJy0nXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS50eXBlICAgICAgPSAnPz8/J1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaWYgbm9kZS5jb25zdHJ1Y3Rvci5uYW1lID09ICdWYWx1ZSdcbiAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zWysrbm9kZUluZGV4XSA9IHtub2RlfVxuICAgICAgICAgICAgICAgICAgICAjIGxvZyBub2RlXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vdCBub2RlLmJhc2UudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLmJvZHkgPSBub2RlLmJhc2UuYm9keT8uZXhwcmVzc2lvbnM/WzBdPy5jb25zdHJ1Y3Rvci5uYW1lXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mb3Nbbm9kZUluZGV4XS52YWx1ZSA9IG5vZGUuYmFzZS52YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vZGUuYmFzZS52YWx1ZSBpbiBpZGVudGlmaWVyc1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm9zW25vZGVJbmRleF0udHlwZSA9ICd2ZWMnXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvc1tub2RlSW5kZXhdLnR5cGUgPSAnPz8/J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgIyBsb2cgJ25vZGU/JyBub2RlLmNvbnN0cnVjdG9yLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBub2RlQXJyYXkgPSBub2RlSW5mb3MubWFwIChpKSAtPiBuID0gaS5ub2RlOyBkZWxldGUgaS5ub2RlOyBuXG5cbiAgICAgICAgIyBsb2cgbm9vbi5zdHJpbmdpZnkgbm9kZUluZm9zXG4gICAgICAgIFxuICAgICAgICBmb3IgaW5kZXggaW4gbm9kZUluZm9zLmxlbmd0aC0xLi4wXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGluZm8gPSBub2RlSW5mb3NbaW5kZXhdXG4gICAgICAgICAgICBuZCAgID0gbm9kZUFycmF5W2luZGV4XVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBpbmZvLnZlY09wXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgb3RoZXJOb2RlID0gaWYgaW5mby5zaWRlID09ICdsZWZ0JyB0aGVuIG5kLnNlY29uZCBlbHNlIG5kLmZpcnN0XG4gICAgICAgICAgICAgICAgdmVjTm9kZSAgID0gaWYgaW5mby5zaWRlID09ICdsZWZ0JyB0aGVuIG5kLmZpcnN0IGVsc2UgbmQuc2Vjb25kXG4gICAgICAgICAgICAgICAgb3RoZXJJbmRleCA9IG5vZGVBcnJheS5pbmRleE9mIG90aGVyTm9kZVxuICAgICAgICAgICAgICAgIHZlY0luZGV4ICAgPSBub2RlQXJyYXkuaW5kZXhPZiB2ZWNOb2RlXG4gICAgICAgICAgICAgICAgb3RoZXJJbmZvICA9IG5vZGVJbmZvc1tvdGhlckluZGV4XVxuICAgICAgICAgICAgICAgIHZlY0luZm8gICAgPSBub2RlSW5mb3NbdmVjSW5kZXhdXG4gICAgICAgICAgICAgICAgaWYgaW5mby52ZWNPcCA9PSAndGltZXNPckRvdCdcblxuICAgICAgICAgICAgICAgICAgICBpZiBvdGhlckluZm8udHlwZSA9PSAnbnVtJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby52ZWNPcCA9ICd0aW1lcydcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udHlwZSAgPSAndmVjJyBcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBvdGhlckluZm8udHlwZSA9PSAndmVjJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby52ZWNPcCA9ICdkb3QnXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnR5cGUgID0gJ251bScgXG4gICAgICAgICAgICAgICAgbG9nIGtzdHIubHBhZChpbmRleCwgMyksIGluZm8udHlwZSwgXCIje3ZlY05vZGUuYmFzZS52YWx1ZX0uI3tpbmZvLnZlY09wfSgje290aGVySW5kZXh9KVwiXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBlbHNlIGlmIGluZm8ub3BlcmF0b3JcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmaXJzdEluZGV4ICA9IG5vZGVBcnJheS5pbmRleE9mIG5kLmZpcnN0XG4gICAgICAgICAgICAgICAgc2Vjb25kSW5kZXggPSBub2RlQXJyYXkuaW5kZXhPZiBuZC5zZWNvbmRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmaXJzdFR5cGUgID0gZmlyc3RJbmRleCAgPCAwIGFuZCAnbnVtJyBvciBub2RlSW5mb3NbZmlyc3RJbmRleF0udHlwZVxuICAgICAgICAgICAgICAgIHNlY29uZFR5cGUgPSBzZWNvbmRJbmRleCA8IDAgYW5kICdudW0nIG9yIG5vZGVJbmZvc1tzZWNvbmRJbmRleF0udHlwZVxuXG4gICAgICAgICAgICAgICAgaWYgZmlyc3RUeXBlID09ICd2ZWMnIGFuZCBzZWNvbmRUeXBlID09ICd2ZWMnXG4gICAgICAgICAgICAgICAgICAgIGluZm8udmVjT3AgPSAnZG90J1xuICAgICAgICAgICAgICAgICAgICBpbmZvLnR5cGUgPSAnbnVtJ1xuICAgICAgICAgICAgICAgIGVsc2UgaWYgZmlyc3RUeXBlID09ICd2ZWMnIGFuZCBzZWNvbmRUeXBlID09ICdudW0nXG4gICAgICAgICAgICAgICAgICAgIGluZm8udmVjT3AgPSAndGltZXMnXG4gICAgICAgICAgICAgICAgICAgIGluZm8udHlwZSA9ICd2ZWMnXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBmaXJzdFR5cGUgPT0gJ251bScgYW5kIHNlY29uZFR5cGUgPT0gJ3ZlYydcbiAgICAgICAgICAgICAgICAgICAgaW5mby52ZWNPcCA9ICd0aW1lcydcbiAgICAgICAgICAgICAgICAgICAgaW5mby50eXBlID0gJ3ZlYydcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBsb2cga3N0ci5scGFkKGluZGV4LCAzKSwgaW5mby50eXBlLCBmaXJzdEluZGV4LCBpbmZvLm9wZXJhdG9yLCBzZWNvbmRJbmRleCAjLCBpbmZvXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgaW5mby52YWx1ZSBhbmQgKG5vdCBpbmZvLnR5cGUgb3IgaW5mby50eXBlID09ICc/Pz8nKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgbmQuYmFzZSBpbnN0YW5jZW9mIElkZW50aWZpZXJMaXRlcmFsIHRoZW4gaW5mby50eXBlID0gJ251bSdcbiAgICAgICAgICAgICAgICAgICAgaWYgbmQuYmFzZSBpbnN0YW5jZW9mIE51bWJlckxpdGVyYWwgICAgIHRoZW4gaW5mby50eXBlID0gJ251bSdcbiAgXG4gICAgICAgICAgICAgICAgaWYgaW5mby50eXBlIGluIFsnbnVtJyAndmVjJ11cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGxvZyBrc3RyLmxwYWQoaW5kZXgsIDMpLCBpbmZvLnR5cGUsIG5kLmJhc2UudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBpbmZvLmJvZHkgPT0gJ09wJ1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgYm9keUluZGV4ID0gbm9kZUFycmF5LmluZGV4T2YgbmQuYmFzZT8uYm9keT8uZXhwcmVzc2lvbnNbMF1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIHR5cGUgPSBub2RlSW5mb3NbYm9keUluZGV4XT8udHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgdHlwZSAhPSAnPz8/J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8udHlwZSA9IHR5cGVcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGxvZyBrc3RyLmxwYWQoaW5kZXgsIDMpLCBpbmZvLnR5cGUsIGJvZHlJbmRleFxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGxvZyBrc3RyLmxwYWQoaW5kZXgsIDMpLCBpbmZvLnR5cGUsIGluZm8jLCBuZFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgIyBmcmFnID0gYm9keS5jb21waWxlVG9GcmFnbWVudHMgb3B0c1xuICAgICAgICAjIGNvbnNvbGUubG9nICfilrh2ZWMgZnJhZycgZnJhZ1xuICAgICAgICBkZWRlbnQ6IHRydWVcbiAgICAgICAgcmVkdWNlOiB0cnVlXG4gICAgICAgIGJvZHk6ICAgdHJ1ZVxuICAgICAgICBibG9jazogIHRydWVcbiwgICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAwMCAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgXG5cbiAgICBkb2M6IOKWuGRvYyAn4pa4ZG9jJ1xuICAgICAgICBcbiAgICAgICAgVGhpcyBpcyBhIHNsaWdodGx5IHNwZWNpYWwgbWFjcm8sIGJlY2F1c2UgaXQncyBmaXJzdCBwYXNzIGlzIGhhcmRjb2RlZCBpbiB0aGUgdG9rZW5pemVyLlxuICAgICAgICBUaGUgYm9keSBvZiB0aGUgbWFjcm8gaXMgd3JhcHBlZCBpbiBhIHNraW5ueSB0cmlwbGUgc3RyaW5nIGJlZm9yZSBmdXJ0aGVyIHRva2VuaXphdGlvbi5cbiAgICAgICAgSXQgY2FuIGNvbnRhaW4gYW55dGhpbmcgZXhjZXB0IFxcJ1xcJ1xcJy5cbiAgICAgICAgXG4gICAgICAgIEluIG5vcm1hbCBvcGVyYXRpb24sIGl0IGlzIHJlZHVjZWQgdG8gdGhlIGVtcHR5IHN0cmluZy4gXG4gICAgICAgIEJ1dCBpZiAqKmtvZmZlZSoqIGlzIGNhbGxlZCB3aXRoIHRoZSBgLS1kb2NgIGFyZ3VtZW50LCBsb2dzIHdpbGwgYmUgaW5zZXJ0ZWQgaW5zdGVhZC5cbiAgICAgICAgXG4gICAgICAgIGBgYGNvZmZlZXNjcmlwdFxuICAgICAgICDilrhkb2MgJ3RpdGxlJ1xuICAgICAgICAgICAgbXkgZG9jdW1lbnRhdGlvbiAuLi5cbiAgICAgICAgbG9nICdzb21lIGNvZGUnXG4gICAgICAgIOKWuGRvY1xuICAgICAgICAgICAgd2UgYXJlIGRvbmUuXG4gICAgICAgIGBgYFxuICAgICAgICBcbiAgICAgICAgYGtvZmZlZSAtLWRvYyBmaWxlYCB3aWxsIG91dHB1dFxuICAgICAgICBcbiAgICAgICAgYGBgbWFya2Rvd25cbiAgICAgICAgIyMgdGl0bGVcbiAgICAgICAgbXkgZG9jdW1lbnRhdGlvbiAuLi5cbiAgICAgICAgc29tZSBjb2RlXG4gICAgICAgIHdlIGFyZSBkb25lLlxuICAgICAgICBgYGBcbiAgICAgICAgXG4gICAgICAgIGJ1dCBga29mZmVlIGZpbGVgIHdpbGwgb25seSBwcmludCBgc29tZSBjb2RlYFxuICAgICAgICBcbiAgICBrZXk6ICAn4pa4ZG9jJ1xuICAgIGRlc2M6ICfilrhkb2MgW2hlYWRlcl0gLi4uJ1xuICAgIG1ldGE6IChhcmdzOixub2RlOixvcHRzOikgLT5cbiAgICAgICAgaGVhZGVyID0gYXJnc1swXSBhbmQgXCInIyMgI3thcmdzWzBdfVxcXFxuJytcIiBvciBcIicnK1wiXG4gICAgICAgIGJlZm9yZTogb3B0cy5kb2MgYW5kIFwiI3ttZXRhTG9nKG9wdHMpfSgje2hlYWRlcn1cIlxuICAgICAgICBhZnRlcjogIFwiKVwiXG4gICAgICAgIHNraXA6ICAgbm90IG9wdHMuZG9jIGFuZCB3aXRoOlwiJydcIlxuICAgICAgICByZWR1Y2U6IHRydWVcbiAgICAgICAgYm9keTogICB0cnVlXG4gICAgICAgIGJsb2NrOiAgZmFsc2VcbiwgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgXG4gICAga2V5OiAgJ+KWuHByb2ZpbGUnICAgXG4gICAgZGVzYzogJ+KWuHByb2ZpbGUgW2lkXSAuLi4nXG4gICAgbWV0YTogKGFyZ3M6LG5vZGU6LG9wdHM6KSAtPiBcbiAgICAgICAgXG4gICAgICAgIGlkID0gXCIje25vZGUuY29uZGl0aW9uLmxvY2F0aW9uRGF0YS5maXJzdF9saW5lKzF9XyN7bm9kZS5jb25kaXRpb24ubG9jYXRpb25EYXRhLmZpcnN0X2NvbHVtbn1cIlxuICAgICAgICBuYW1lID0gYXJnc1swXSA/IGlkXG4gICAgICAgIGNvZGU6ICAgXCJrb2ZmZWVfI3tpZH0gPSBwcm9jZXNzLmhydGltZS5iaWdpbnQoKVwiXG4gICAgICAgIGFmdGVyOiAgXCIje21ldGFMb2cob3B0cyl9KCcje25hbWV9JywgKGZ1bmN0aW9uKGIpeyBsZXQgZj0xMDAwbjsgZm9yIChsZXQgdSBvZiBbJ25zJywnzrxzJywnbXMnLCdzJ10pIHsgaWYgKHU9PSdzJyB8fCBiPGYpIHsgcmV0dXJuICcnKygxMDAwbipiL2YpKycgJyt1OyB9IGYqPTEwMDBuOyB9fSkocHJvY2Vzcy5ocnRpbWUuYmlnaW50KCkta29mZmVlXyN7aWR9KSk7XCJcbiAgICAgICAgcmVkdWNlOiBmYWxzZVxuICAgICAgICBib2R5OiAgIHRydWVcbixcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAga2V5OiAgJ+KWuGF2ZXJhZ2UnICAgXG4gICAgZGVzYzogJ+KWuGF2ZXJhZ2UgbnVtIC4uLidcbiAgICBtZXRhOiAoYXJnczosbm9kZTosb3B0czopIC0+IFxuICAgICAgICBcbiAgICAgICAgaWQgID0gXCIje25vZGUuY29uZGl0aW9uLmxvY2F0aW9uRGF0YS5maXJzdF9saW5lKzF9XyN7bm9kZS5jb25kaXRpb24ubG9jYXRpb25EYXRhLmZpcnN0X2NvbHVtbn1cIlxuICAgICAgICBudW0gPSBhcmdzWzBdID8gMTAwXG4gICAgICAgIGJlZm9yZTogIFwiXCJcIlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBrb2ZmZWVfI3tpZH0gPSAwbjtcbiAgICAgICAgICAgIGZvcihpID0gMDsgaSA8ICN7bnVtfTsgaSsrKSBcbiAgICAgICAgICAgIHsgXG4gICAgICAgICAgICAgICAga29mZmVlXyN7aWR9X3N0YXJ0ID0gcHJvY2Vzcy5ocnRpbWUuYmlnaW50KCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICBhZnRlcjogXCJcIlwiXG4gICAgICAgICAgICBrb2ZmZWVfI3tpZH0gKz0gcHJvY2Vzcy5ocnRpbWUuYmlnaW50KCkgLSBrb2ZmZWVfI3tpZH1fc3RhcnQ7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAga29mZmVlXyN7aWR9IC89ICN7bnVtfW47XG4gICAgICAgICAgICAje21ldGFMb2cob3B0cyl9KCcje2lkfScsIChmdW5jdGlvbihiKXsgbGV0IGY9MTAwMG47IGZvciAobGV0IHUgb2YgWyducycsJ868cycsJ21zJywncyddKSB7IGlmICh1PT0ncycgfHwgYjxmKSB7IHJldHVybiAnJysoMTAwMG4qYi9mKSsnICcrdTsgfSBmKj0xMDAwbjsgfX0pKGtvZmZlZV8je2lkfSkpOyBcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICByZWR1Y2U6IHRydWVcbiAgICAgICAgYm9keTogICB0cnVlXG4sXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIGtleTogICfilrhzdGFydCcgICBcbiAgICBkZXNjOiAn4pa4c3RhcnQgaWQgLi4uJ1xuICAgIGluZm86XG4gICAgICAgIHRoZW46IHRydWVcbiAgICAgICAgYXJnczogMVxuICAgIG1ldGE6IChhcmdzOikgLT4gXG4gICAgICAgIGlkID0gYXJnc1swXSA/ICdzdGFydF9lbmQnXG4gICAgICAgIGJlZm9yZTogXCJrb2ZmZWVfI3tpZH0gPSBwcm9jZXNzLmhydGltZS5iaWdpbnQoKVwiXG4gICAgICAgIHJlZHVjZTogdHJ1ZVxuICAgICAgICBib2R5OiAgIGZhbHNlXG4sXG4gICAga2V5OiAgJ+KWuGVuZCcgICAgIFxuICAgIGRlc2M6ICfilrhlbmQgaWQgLi4uJ1xuICAgIGluZm86XG4gICAgICAgIHRoZW46IHRydWVcbiAgICAgICAgYXJnczogMVxuICAgIG1ldGE6IChhcmdzOixvcHRzOikgLT4gXG4gICAgICAgIGlkID0gYXJnc1swXSA/ICdzdGFydF9lbmQnXG4gICAgICAgIGJlZm9yZTogXCIje21ldGFMb2cob3B0cyl9KCcje2lkfScsIChmdW5jdGlvbihiKXsgbGV0IGY9MTAwMG47IGZvciAobGV0IHUgb2YgWyducycsJ868cycsJ21zJywncyddKSB7IGlmICh1PT0ncycgfHwgYjxmKSB7IHJldHVybiAnJysoMTAwMG4qYi9mKSsnICcrdTsgfSBmKj0xMDAwbjsgfX0pKHByb2Nlc3MuaHJ0aW1lLmJpZ2ludCgpLWtvZmZlZV8je2lkfSkpO1wiXG4gICAgICAgIHJlZHVjZTogdHJ1ZVxuICAgICAgICBib2R5OiAgIGZhbHNlXG4sICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgXG4gICAgXG4gICAga2V5OiAgJ+KWuGRiZycgICAgXG4gICAgZGVzYzogJ+KWuGRiZyBbbXNnXSAuLi4nXG4gICAgaW5mbzpcbiAgICAgICAgdGhlbjogdHJ1ZSAjIHNob3VsZCBub3QgYmUgdXNlZCB3aXRoIGEgYmxvY2tcbiAgICAgICAgYXJnczogMVxuICAgIG1ldGE6IChvcHRzOixhcmdzOixub2RlOikgLT5cbiAgICAgICAgYmVmb3JlOiBsb2dTb3VyY2Uge29wdHMsIGFyZ3MsIG5vZGV9XG4gICAgICAgIGFmdGVyOiAgJyknXG4gICAgICAgIHJlZHVjZTogdHJ1ZVxuICAgICAgICBib2R5OiAgIHRydWVcbiAgICAgICAgYmxvY2s6ICBmYWxzZVxuLCAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIGtleTogICfilrhhc3NlcnQnICAgIFxuICAgIGRlc2M6ICfilrhhc3NlcnQgW21zZ10gLi4uJ1xuICAgIG1ldGE6IChvcHRzOixhcmdzOixub2RlOikgLT5cbiAgICAgICAgXG4gICAgICAgIG5vZGVzID0gcmVxdWlyZSAnLi9ub2RlcydcbiAgICAgICAgeyBCbG9jaywgZXh0ZW5kIH0gPSBub2Rlc1xuICAgICAgICBpZiBub2RlLmJvZHkgaW5zdGFuY2VvZiBCbG9ja1xuICAgICAgICAgICAgYm9keSA9IG5vZGUuYm9keS5leHByZXNzaW9uc1swXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBib2R5ID0gbm9kZS5ib2R5XG4gICAgICAgICAgICBcbiAgICAgICAgZnJhZyA9IGJvZHkuY29tcGlsZVRvRnJhZ21lbnRzIG9wdHNcbiAgICAgICAgdGV4dCA9IG5vZGUuZnJhZ21lbnRzVG9UZXh0IGZyYWdcbiAgICAgICAgYXJncyA9IFsnYXNzZXJ0aW9uIGZhaWx1cmUhJ10gaWYgbm90IGFyZ3MubGVuZ3RoXG4gICAgICAgIGJlZm9yZTogbG9nU291cmNlIHtvcHRzLCBhcmdzLCBub2RlLCBjbG9zZTp0cnVlfVxuICAgICAgICBhZnRlcjogICdwcm9jZXNzLmV4aXQoNjY2KTsnXG4gICAgICAgIHRoZW46ICAgdHJ1ZSAjIHNob3VsZCBub3QgYmUgdXNlZCB3aXRoIGEgYmxvY2tcbiAgICAgICAgZXZhbDogICBmYWxzZVxuICAgICAgICByZWR1Y2U6IGZhbHNlXG4gICAgICAgIGNvZGU6ICAgXCIhKCN7dGV4dH0pXCJcbiwgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgIFxuICAgIGtleTogICfilrh0ZXN0J1xuICAgIGRlc2M6ICfilrh0ZXN0IFtpZF0gLi4uJ1xuICAgIG1ldGE6IChvcHRzOixhcmdzOixub2RlOikgLT5cbiAgICAgICAgYmVmb3JlICA9IGxvZ1NvdXJjZSB7b3B0cywgYXJncywgbm9kZSwgY2xvc2U6dHJ1ZX1cbiAgICAgICAgYmVmb3JlICs9ICdcXG4gICAgdHJ5IHtcXG4nXG4gICAgICAgIGRlZGVudDogdHJ1ZVxuICAgICAgICBiZWZvcmU6IG9wdHMudGVzdCBhbmQgYmVmb3JlXG4gICAgICAgIGFmdGVyOiAgb3B0cy50ZXN0IGFuZCBcIn0gY2F0Y2goZXJyKSB7ICN7bWV0YUxvZyhvcHRzKX0oZXJyLm1lc3NhZ2UpOyB9XFxuXCJcbiAgICAgICAgc2tpcDogICBub3Qgb3B0cy50ZXN0XG4gICAgICAgIHJlZHVjZTogdHJ1ZVxuICAgICAgICBib2R5OiAgIHRydWVcbiwgICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAga2V5OiAn4pa4cmFuZCcgICAgXG4gICAgbWV0YTogKGFyZ3M6KSAtPiBcbiAgICAgICAgY29kZTogICBcIk1hdGgucmFuZG9tKCkgPCAje2FyZ3M/WzBdID8gMC41fVwiIFxuICAgICAgICByZWR1Y2U6IGZhbHNlIFxuICAgICAgICBib2R5OiAgIHRydWUgICBcbiAgICBcbiAgICAjIGtleTogJ3Rva2VuJyAncGFyc2UnICdjb2RlJ1xuXVxuXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuXG5UQUIgPSAnICAgICdcblxuY29tcGlsZU1ldGFJZiA9IChub2RlOixvcHRzOikgLT5cblxuICAgIG5vZGVzID0gcmVxdWlyZSAnLi9ub2RlcydcbiAgICBcbiAgICB7IEJsb2NrLCBBc3NpZ24sIFZhbHVlLCBMaXRlcmFsIH0gPSBub2Rlc1xuICAgIHsgZXh0ZW5kLCBtZXJnZSB9ID0gaGVscGVyc1xuICAgICAgICBcbiAgICBpbmZvID0gcmVkdWNlOnRydWUsIGV2YWw6dHJ1ZVxuICAgIFxuICAgIGlmIG5vZGUuY29uZGl0aW9uLmJhc2U/LnZhbHVlPy5zdGFydHNXaXRoICfilrgnXG4gICAgICAgIFxuICAgICAgICBtZXRhS2V5ID0gbm9kZS5jb25kaXRpb24uYmFzZS52YWx1ZVxuICAgICAgICBpZiB0eXBlb2Ygb3B0cy5tZXRhW21ldGFLZXldID09ICdmdW5jdGlvbidcbiAgICAgICAgICAgIGluZm8gPSBvcHRzLm1ldGFbbWV0YUtleV0ge29wdHMsIG5vZGUsIGFyZ3M6W119XG4gICAgICAgICAgICBcbiAgICBpZiBub2RlLmNvbmRpdGlvbi52YXJpYWJsZT8uYmFzZT8udmFsdWU/LnN0YXJ0c1dpdGggJ+KWuCdcbiAgICAgICAgXG4gICAgICAgIG1ldGFLZXkgPSBub2RlLmNvbmRpdGlvbi52YXJpYWJsZS5iYXNlLnZhbHVlXG4gICAgICAgIGlmIHR5cGVvZiBvcHRzLm1ldGFbbWV0YUtleV0gPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgYXJncyA9IG5vZGUuY29uZGl0aW9uLmFyZ3MubWFwIChhKSAtPiBcbiAgICAgICAgICAgICAgICBhLmJhc2U/LnZhbHVlXG4gICAgICAgICAgICBhcmdzID0gYXJncy5tYXAgKGEpIC0+IGlmIGFbMF0gaW4gWydcIicsIFwiJ1wiXSB0aGVuIGFbMS4uLTJdIGVsc2UgYVxuICAgICAgICAgICAgaW5mbyA9IG9wdHMubWV0YVttZXRhS2V5XSB7b3B0cywgbm9kZSwgYXJnc31cbiAgICAgICAgXG4gICAgaWYgaW5mby5za2lwIFxuICAgICAgICBpZiBpbmZvLnNraXAud2l0aD9cbiAgICAgICAgICAgIHJldHVybiBub2RlLm1ha2VDb2RlIGluZm8uc2tpcC53aXRoXG4gICAgICAgIHJldHVybiBbXVxuICAgIFxuICAgIGlmIGluZm8uZXZhbFxuICAgICAgICBcbiAgICAgICAgY29uZCA9IGluZm8uY29kZSA/IG5vZGUuZnJhZ21lbnRzVG9UZXh0IG5vZGUuY29uZGl0aW9uLmNvbXBpbGVUb0ZyYWdtZW50cyBvcHRzLCAyICNMRVZFTF9QQVJFTlxuICAgICAgICB0cnlcbiAgICAgICAgICAgIG9zID0gcmVxdWlyZSAnb3MnXG4gICAgICAgICAgICBmcyA9IHJlcXVpcmUgJ2ZzJ1xuICAgICAgICAgICAgaW5mby5ib2R5ID0hISBldmFsIGNvbmRcbiAgICAgICAgICAgIGlmIGluZm8uZXZhbCBhbmQgaW5mby5yZWR1Y2UgYW5kIG5vdCBpbmZvLmJvZHkgYW5kIG5vdCBub2RlLmVsc2VCb2R5XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdXG4gICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgZXJyb3IgZXJyXG4gICAgICAgIFxuICAgIGZyYWcgPSBbXVxuICAgIFxuICAgIGlmIGluZm8ucmVkdWNlID09IGZhbHNlXG4gICAgICAgIGZyYWcgPSBmcmFnLmNvbmNhdCBub2RlLm1ha2VDb2RlKFwiaWYgKFwiKSwgbm9kZS5tYWtlQ29kZShpbmZvLmNvZGUpLCBub2RlLm1ha2VDb2RlKFwiKSB7XFxuXCIpXG4gICAgICAgIFxuICAgICAgICBpbmRlbnQgPSBvcHRzLmluZGVudCArIFRBQlxuICAgICAgICBib2R5T3B0ID0gbWVyZ2Ugb3B0cywge2luZGVudH1cbiAgICBlbHNlXG4gICAgICAgIGluZGVudCA9IG9wdHMuaW5kZW50XG4gICAgICAgIGJvZHlPcHQgPSBvcHRzXG5cbiAgICBpZiBpbmZvLmJlZm9yZVxuICAgICAgICBmcmFnLnB1c2ggbm9kZS5tYWtlQ29kZSAoaW5mby5ibG9jayE9ZmFsc2UgYW5kIGluZm8uZGVkZW50IT10cnVlIGFuZCBpbmRlbnQgb3IgJycpICsgaW5mby5iZWZvcmVcbiAgICAgICAgXG4gICAgaWYgaW5mby5ib2R5XG4gICAgICAgIGlmIGluZm8uYmxvY2sgIT0gZmFsc2VcbiAgICAgICAgICAgIGJvZHkgPSBub2RlLmVuc3VyZUJsb2NrIG5vZGUuYm9keVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBub2RlLmJvZHkgaW5zdGFuY2VvZiBCbG9ja1xuICAgICAgICAgICAgICAgIGJvZHkgPSBub2RlLmJvZHkuZXhwcmVzc2lvbnNbMF1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBib2R5ID0gbm9kZS5ib2R5XG4gICAgICAgIGlmIGJvZHlcbiAgICAgICAgICAgIGZyYWcgPSBmcmFnLmNvbmNhdCBib2R5LmNvbXBpbGVUb0ZyYWdtZW50cyBib2R5T3B0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGZyYWcucHVzaCBub2RlLm1ha2VDb2RlIFwiJydcIiAjIGlmIGluZm8uYmxvY2sgPT0gZmFsc2UgPz8/XG4gICAgICAgIFxuICAgIGlmIGluZm8uYWZ0ZXJcbiAgICAgICAgZnJhZy5wdXNoIG5vZGUubWFrZUNvZGUgKChpbmZvLmJsb2NrICE9IGZhbHNlKSBhbmQgKCdcXG4nICsgaW5kZW50KSBvciAnJykgKyBpbmZvLmFmdGVyXG5cbiAgICBpZiBub3QgaW5mby5yZWR1Y2VcbiAgICAgICAgZnJhZy5wdXNoIG5vZGUubWFrZUNvZGUoXCJcXG4je25vZGUudGFifX1cIilcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgaWYgbm9kZS5lbHNlQm9keSBhbmQgKGluZm8ucmVkdWNlID09IGZhbHNlIG9yIGluZm8uYm9keSA9PSBmYWxzZSlcbiAgICAgICAgZnJhZy5wdXNoIG5vZGUubWFrZUNvZGUgJyBlbHNlICcgaWYgbm90IGluZm8ucmVkdWNlXG4gICAgICAgIGlmIG5vZGUuaXNDaGFpblxuICAgICAgICAgICAgZnJhZyA9IGZyYWcuY29uY2F0IG5vZGUuZWxzZUJvZHkudW53cmFwKCkuY29tcGlsZVRvRnJhZ21lbnRzIGJvZHlPcHRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZnJhZyA9IGZyYWcuY29uY2F0IG5vZGUuZWxzZUJvZHkuY29tcGlsZVRvRnJhZ21lbnRzIGJvZHlPcHRcbiAgICAgICAgXG4gICAgcmV0dXJuIGZyYWdcbiAgICBcbiMgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4jIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuIyAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG5cbm1ldGFMb2cgPSAob3B0cykgLT4gb3B0cy5tZXRhbG9nID8gJ2NvbnNvbGUubG9nJ1xuXG5sb2dTb3VyY2UgPSAob3B0czosYXJnczosbm9kZTosY2xvc2U6KSAtPlxuICAgIFxuICAgIGNvbG9yZXR0ZSA9IHJlcXVpcmUgJ2NvbG9yZXR0ZSdcbiAgICB7IHllbGxvdywgYmx1ZSwgeWVsbG93QnJpZ2h0LCBibHVlQnJpZ2h0LCB3aGl0ZUJyaWdodCwgZGltLCBib2xkLCBncmF5IH0gPSBjb2xvcmV0dGUuY3JlYXRlQ29sb3JzIHVzZUNvbG9yOiBvcHRzLmZlYXR1cmUuY29sb3JcbiAgICBcbiAgICBzb3VyY2UgPSBvcHRzLnNvdXJjZSA/IG9wdHMuZmlsZW5hbWUgPyAnJ1xuICAgIGV4dCA9ICcnXG4gICAgaWYgc291cmNlXG4gICAgICAgIFtzb3VyY2UsIGV4dC4uLl0gPSBwYXRoLmJhc2VuYW1lKHNvdXJjZSkuc3BsaXQgJy4nXG4gICAgICAgIHNvdXJjZSAgPSB5ZWxsb3cgW3llbGxvd0JyaWdodChzb3VyY2UpLCBkaW0gZXh0LmpvaW4nLiddLmpvaW4gZGltICcuJ1xuICAgIGJlZm9yZSAgPSBcIiN7bWV0YUxvZyhvcHRzKX0oJyN7c291cmNlfSN7ZGltIGJsdWUgJzonfSN7Ymx1ZUJyaWdodCBcIiN7bm9kZS5jb25kaXRpb24ubG9jYXRpb25EYXRhLmZpcnN0X2xpbmUrMX1cIn0nXCJcbiAgICBiZWZvcmUgKz0gXCIsICcje2JvbGQgd2hpdGVCcmlnaHQgYXJnc1swXX0nXCIgaWYgYXJnc1swXSBcbiAgICBpZiAoY2xvc2UpXG4gICAgICAgIGJlZm9yZSArPSAnKTtcXG4nXG4gICAgZWxzZVxuICAgICAgICBiZWZvcmUgKz0gXCIsIFwiXG5cbiAgICBiZWZvcmVcbiAgICAgICAgXG4jIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICBcbiMgMDAwICAwMDAwICAwMDAgICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuIyAwMDAgIDAwMCAwIDAwMCAgICAgICAgMDAwICAwMDAwMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4jIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiMgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIFxuXG5pbmplY3RNZXRhID0gKG9wdGlvbnMpIC0+ICMgbWFrZSBzdXJlIHRoYXQgb3B0aW9ucyBoYXMgYSBtZXRhIHNldFxuICAgIFxuICAgIG9wdGlvbnMgPz0ge31cbiAgICBcbiAgICB7IGV4dGVuZCB9ID0gaGVscGVyc1xuICAgIFxuICAgIGRlZmF1bHRNZXRhID0ge31cbiAgICBNRVRBLm1hcCAobSkgLT4gZGVmYXVsdE1ldGFbbS5rZXldID0gbS5tZXRhOyBtLm1ldGEua2V5ID0gbS5rZXk7IG0ubWV0YS5pbmZvID0gbS5pbmZvXG4gICAgXG4gICAgbWV0YSAgICA9IGV4dGVuZCBkZWZhdWx0TWV0YSwgb3B0aW9ucy5tZXRhID8ge31cbiAgICBvcHRpb25zID0gZXh0ZW5kIHsgbWV0YTogbWV0YSB9LCBvcHRpb25zXG4gICAgb3B0aW9uc1xuXG5sb2dNZXRhcyA9IC0+XG4gICAgXG4gICAgbG9nIFwiI3tncmF5ICdNZXRhczonfVxcblxcbiN7IE1FVEEubWFwKChmKSAtPiBcIiAgICAje2hlbHBlcnMucGFkIGYua2V5fSN7Z3JheSBmLmRlc2MgPyBcIiN7Zi5rZXl9IC4uLlwifVwiKS5qb2luKCdcXG4nKSB9XCJcbiAgICBsb2cgXCIgICAg4pa4aWYgICAgICAgICAgICAgICAgICAgICAje2dyYXkgJ+KWuGlmIGNvbmQgLi4uIFtb4pa4ZWxpZiBjb25kIC4uLl0g4pa4ZWxzZSAuLi5dJ31cXG5cIlxuICAgIFxubW9kdWxlLmV4cG9ydHMgPSB7IE1FVEEsIGluamVjdE1ldGEsIGxvZ01ldGFzLCBjb21waWxlTWV0YUlmIH1cbiJdfQ==
//# sourceURL=../coffee/meta.coffee