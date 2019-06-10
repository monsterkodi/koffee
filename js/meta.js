// koffee 1.0.0

/*
00     00  00000000  000000000   0000000   
000   000  000          000     000   000  
000000000  0000000      000     000000000  
000 0 000  000          000     000   000  
000   000  00000000     000     000   000
 */

(function() {
    var META, TAB, compileMetaIf, helpers, injectMeta, logMetas, logSource, metaLog, path,
        slice = [].slice;

    path = require('path');

    helpers = require('./helpers');

    helpers.colors();

    META = [
        {
            doc: '',
            key: '▸doc',
            desc: '▸doc [header] ...',
            meta: function(arg) {
                var args, header, node, opts, ref, ref1, ref2;
                args = (ref = arg.args) != null ? ref : null, node = (ref1 = arg.node) != null ? ref1 : null, opts = (ref2 = arg.opts) != null ? ref2 : null;
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
            meta: function(arg) {
                var args, id, name, node, opts, ref, ref1, ref2, ref3;
                args = (ref = arg.args) != null ? ref : null, node = (ref1 = arg.node) != null ? ref1 : null, opts = (ref2 = arg.opts) != null ? ref2 : null;
                id = (node.condition.locationData.first_line + 1) + "_" + node.condition.locationData.first_column;
                name = (ref3 = args[0]) != null ? ref3 : id;
                return {
                    code: "koffee_" + id + " = process.hrtime.bigint()",
                    after: (metaLog(opts)) + "('" + name + "', (function(b){ let f=1000n; for (let u of ['ns','μs','ms','s']) { if (u=='s' || b<f) { return ''+(1000n*b/f)+u; } f*=1000n; }})(process.hrtime.bigint()-koffee_" + id + "));",
                    reduce: false,
                    body: true
                };
            }
        }, {
            key: '▸average',
            desc: '▸average num ...',
            meta: function(arg) {
                var args, id, node, num, opts, ref, ref1, ref2, ref3;
                args = (ref = arg.args) != null ? ref : null, node = (ref1 = arg.node) != null ? ref1 : null, opts = (ref2 = arg.opts) != null ? ref2 : null;
                id = (node.condition.locationData.first_line + 1) + "_" + node.condition.locationData.first_column;
                num = (ref3 = args[0]) != null ? ref3 : 100;
                return {
                    before: "\nkoffee_" + id + " = 0n;\nfor(i = 0; i < " + num + "; i++) \n{ \n    koffee_" + id + "_start = process.hrtime.bigint();\n",
                    after: "koffee_" + id + " += process.hrtime.bigint() - koffee_" + id + "_start;\n};\nkoffee_" + id + " /= " + num + "n;\n" + (metaLog(opts)) + "('" + id + "', (function(b){ let f=1000n; for (let u of ['ns','μs','ms','s']) { if (u=='s' || b<f) { return ''+(1000n*b/f)+u; } f*=1000n; }})(koffee_" + id + ")); ",
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
            meta: function(arg) {
                var args, id, ref, ref1;
                args = (ref = arg.args) != null ? ref : null;
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
            meta: function(arg) {
                var args, id, opts, ref, ref1, ref2;
                args = (ref = arg.args) != null ? ref : null, opts = (ref1 = arg.opts) != null ? ref1 : null;
                id = (ref2 = args[0]) != null ? ref2 : 'start_end';
                return {
                    before: (metaLog(opts)) + "('" + id + "', (function(b){ let f=1000n; for (let u of ['ns','μs','ms','s']) { if (u=='s' || b<f) { return ''+(1000n*b/f)+u; } f*=1000n; }})(process.hrtime.bigint()-koffee_" + id + "));",
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
            meta: function(arg) {
                var args, node, opts, ref, ref1, ref2;
                opts = (ref = arg.opts) != null ? ref : null, args = (ref1 = arg.args) != null ? ref1 : null, node = (ref2 = arg.node) != null ? ref2 : null;
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
            meta: function(arg) {
                var Block, args, body, frag, node, opts, ref, ref1, ref2, text;
                opts = (ref = arg.opts) != null ? ref : null, args = (ref1 = arg.args) != null ? ref1 : null, node = (ref2 = arg.node) != null ? ref2 : null;
                Block = require('./nodes').Block;
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
            meta: function(arg) {
                var args, before, node, opts, ref, ref1, ref2;
                opts = (ref = arg.opts) != null ? ref : null, args = (ref1 = arg.args) != null ? ref1 : null, node = (ref2 = arg.node) != null ? ref2 : null;
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
            meta: function(arg) {
                var args, ref, ref1;
                args = (ref = arg.args) != null ? ref : null;
                return {
                    code: "Math.random() < " + ((ref1 = args != null ? args[0] : void 0) != null ? ref1 : 0.5),
                    reduce: false,
                    body: true
                };
            }
        }
    ];

    TAB = '    ';

    compileMetaIf = function(arg) {
        var Assign, Block, Literal, Value, args, body, bodyOpt, cond, err, frag, fs, indent, info, merge, metaKey, node, opts, os, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8;
        node = (ref = arg.node) != null ? ref : null, opts = (ref1 = arg.opts) != null ? ref1 : null;
        ref2 = require('./nodes'), Block = ref2.Block, Assign = ref2.Assign, Value = ref2.Value, Literal = ref2.Literal;
        merge = require('./helpers').merge;
        info = {
            reduce: true,
            "eval": true
        };
        if ((ref3 = node.condition.base) != null ? (ref4 = ref3.value) != null ? ref4.startsWith('▸') : void 0 : void 0) {
            metaKey = node.condition.base.value;
            if (typeof opts.meta[metaKey] === 'function') {
                info = opts.meta[metaKey]({
                    opts: opts,
                    node: node,
                    args: []
                });
            }
        }
        if ((ref5 = node.condition.variable) != null ? (ref6 = ref5.base) != null ? (ref7 = ref6.value) != null ? ref7.startsWith('▸') : void 0 : void 0 : void 0) {
            metaKey = node.condition.variable.base.value;
            if (typeof opts.meta[metaKey] === 'function') {
                args = node.condition.args.map(function(a) {
                    var ref8;
                    return (ref8 = a.base) != null ? ref8.value : void 0;
                });
                args = args.map(function(a) {
                    var ref8;
                    if ((ref8 = a[0]) === '"' || ref8 === "'") {
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
            cond = (ref8 = info.code) != null ? ref8 : node.fragmentsToText(node.condition.compileToFragments(opts, 2));
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

    logSource = function(arg) {
        var args, before, close, ext, node, opts, ref, ref1, ref2, ref3, ref4, ref5, ref6, source;
        opts = (ref = arg.opts) != null ? ref : null, args = (ref1 = arg.args) != null ? ref1 : null, node = (ref2 = arg.node) != null ? ref2 : null, close = (ref3 = arg.close) != null ? ref3 : null;
        colorette.options.enabled = opts.feature.color;
        source = (ref4 = (ref5 = opts.source) != null ? ref5 : opts.filename) != null ? ref4 : '';
        ext = '';
        if (source) {
            ref6 = path.basename(source).split('.'), source = ref6[0], ext = 2 <= ref6.length ? slice.call(ref6, 1) : [];
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
        colorette.options.enabled = true;
        return before;
    };

    injectMeta = function(options) {
        var defaultMeta, extend, meta, ref;
        if (options != null) {
            options;
        } else {
            options = {};
        }
        extend = require('./helpers').extend;
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
