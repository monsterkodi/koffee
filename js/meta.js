// koffee 0.29.0

/*
00     00  00000000  000000000   0000000   
000   000  000          000     000   000  
000000000  0000000      000     000000000  
000 0 000  000          000     000   000  
000   000  00000000     000     000   000
 */

(function() {
    var META, TAB, blue, blueBright, bold, compileMetaIf, dim, gray, green, injectMeta, logMetas, logSource, options, path, red, ref, white, whiteBright, yellow, yellowBright,
        slice = [].slice;

    path = require('path');

    ref = require('colorette'), red = ref.red, green = ref.green, blue = ref.blue, blueBright = ref.blueBright, yellow = ref.yellow, yellowBright = ref.yellowBright, white = ref.white, whiteBright = ref.whiteBright, gray = ref.gray, bold = ref.bold, dim = ref.dim, options = ref.options;

    META = [
        {
            key: '▸profile',
            desc: '▸profile [id] ...',
            meta: function(arg) {
                var args, id, name, node, ref1, ref2, ref3;
                args = (ref1 = arg.args) != null ? ref1 : null, node = (ref2 = arg.node) != null ? ref2 : null;
                id = (node.condition.locationData.first_line + 1) + "_" + node.condition.locationData.first_column;
                name = (ref3 = args[0]) != null ? ref3 : id;
                return {
                    after: "console.log('" + name + "', require('pretty-time')(process.hrtime(koffee_" + id + ")));",
                    code: "koffee_" + id + " = process.hrtime()",
                    reduce: false,
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
                var args, id, ref1, ref2;
                args = (ref1 = arg.args) != null ? ref1 : null;
                id = (ref2 = args[0]) != null ? ref2 : 'start_end';
                return {
                    before: "koffee_" + id + " = process.hrtime()",
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
                var args, id, ref1, ref2;
                args = (ref1 = arg.args) != null ? ref1 : null;
                id = (ref2 = args[0]) != null ? ref2 : 'start_end';
                return {
                    before: "console.log('" + id + "', require('pretty-time')(process.hrtime(koffee_" + id + ")))",
                    reduce: true,
                    body: false
                };
            }
        }, {
            key: '▸dbg',
            desc: '▸dbg msg ...',
            info: {
                then: true,
                args: 1
            },
            meta: function(arg) {
                var args, node, opts, ref1, ref2, ref3;
                opts = (ref1 = arg.opts) != null ? ref1 : null, args = (ref2 = arg.args) != null ? ref2 : null, node = (ref3 = arg.node) != null ? ref3 : null;
                return {
                    code: "true",
                    "eval": true,
                    before: logSource({
                        opts: opts,
                        args: args,
                        node: node
                    }),
                    after: ")",
                    reduce: true,
                    block: false
                };
            }
        }, {
            key: '▸assert',
            desc: '▸assert msg ...',
            meta: function(arg) {
                var args, body, code, frag, node, opts, ref1, ref2, ref3, text;
                opts = (ref1 = arg.opts) != null ? ref1 : null, args = (ref2 = arg.args) != null ? ref2 : null, node = (ref3 = arg.node) != null ? ref3 : null;
                if (node.body instanceof Block) {
                    body = node.body.expressions[0];
                } else {
                    body = node.body;
                }
                frag = body.compileToFragments(opts);
                text = node.fragmentsToText(frag);
                code = "not (" + text + ")";
                return {
                    before: logSource({
                        opts: opts,
                        args: args,
                        node: node
                    }),
                    "eval": true,
                    after: ")",
                    reduce: true,
                    block: false,
                    code: condition
                };
            }
        }, {
            key: '▸test',
            desc: '▸test id ...',
            meta: function(arg) {
                var args, node, opts, ref1, ref2, ref3;
                opts = (ref1 = arg.opts) != null ? ref1 : null, args = (ref2 = arg.args) != null ? ref2 : null, node = (ref3 = arg.node) != null ? ref3 : null;
                return {
                    before: opts.test && logSource({
                        opts: opts,
                        args: args,
                        node: node,
                        close: true
                    }),
                    skip: !opts.test,
                    reduce: true,
                    body: true
                };
            }
        }, {
            key: '▸rand',
            meta: function(arg) {
                var args, ref1, ref2;
                args = (ref1 = arg.args) != null ? ref1 : null;
                return {
                    code: "Math.random() < " + ((ref2 = args != null ? args[0] : void 0) != null ? ref2 : 0.5),
                    reduce: false,
                    body: true
                };
            }
        }
    ];

    TAB = '    ';

    compileMetaIf = function(arg) {
        var Assign, Block, Literal, Value, args, body, bodyOpt, cond, err, frag, fs, indent, info, merge, metaKey, node, opts, os, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9;
        node = (ref1 = arg.node) != null ? ref1 : null, opts = (ref2 = arg.opts) != null ? ref2 : null;
        ref3 = require('./nodes'), Block = ref3.Block, Assign = ref3.Assign, Value = ref3.Value, Literal = ref3.Literal;
        merge = require('./helpers').merge;
        info = {
            reduce: true,
            "eval": true
        };
        if ((ref4 = node.condition.base) != null ? (ref5 = ref4.value) != null ? ref5.startsWith('▸') : void 0 : void 0) {
            metaKey = node.condition.base.value;
            if (typeof opts.meta[metaKey] === 'function') {
                info = opts.meta[metaKey]({
                    opts: opts,
                    node: node,
                    args: []
                });
            }
        }
        if ((ref6 = node.condition.variable) != null ? (ref7 = ref6.base) != null ? (ref8 = ref7.value) != null ? ref8.startsWith('▸') : void 0 : void 0 : void 0) {
            metaKey = node.condition.variable.base.value;
            if (typeof opts.meta[metaKey] === 'function') {
                args = node.condition.args.map(function(a) {
                    var ref9;
                    return (ref9 = a.base) != null ? ref9.value : void 0;
                });
                args = args.map(function(a) {
                    var ref9;
                    if ((ref9 = a[0]) === '"' || ref9 === "'") {
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
            return [];
        }
        if (info["eval"]) {
            cond = (ref9 = info.code) != null ? ref9 : node.fragmentsToText(node.condition.compileToFragments(opts, 2));
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
            frag.push(node.makeCode((info.block !== false && indent || '') + info.before));
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

    logSource = function(arg) {
        var args, before, close, ext, node, opts, ref1, ref2, ref3, ref4, ref5, ref6, ref7, source;
        opts = (ref1 = arg.opts) != null ? ref1 : null, args = (ref2 = arg.args) != null ? ref2 : null, node = (ref3 = arg.node) != null ? ref3 : null, close = (ref4 = arg.close) != null ? ref4 : null;
        options.enabled = opts.feature.color;
        source = (ref5 = (ref6 = opts.source) != null ? ref6 : opts.filename) != null ? ref5 : '';
        ext = '';
        if (source) {
            ref7 = path.basename(source).split('.'), source = ref7[0], ext = 2 <= ref7.length ? slice.call(ref7, 1) : [];
            source = yellow([yellowBright(source), dim(ext.join`.`)].join(dim('.')));
        }
        before = "console.log('" + source + (dim(blue(':'))) + (blueBright("" + (node.condition.locationData.first_line + 1))) + "'";
        if (args[0]) {
            before += ", '" + (bold(whiteBright(args[0]))) + "'";
        }
        if (close) {
            before += ');';
        } else {
            before += ", ";
        }
        options.enabled = true;
        return before;
    };

    injectMeta = function(options) {
        var defaultMeta, extend, meta, ref1;
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
        meta = extend(defaultMeta, (ref1 = options.meta) != null ? ref1 : {});
        options = extend({
            meta: meta
        }, options);
        return options;
    };

    logMetas = function() {
        var pad;
        pad = require('./helpers').pad;
        gray = require('colorette').gray;
        console.log((gray('Metas:')) + "\n\n" + (META.map(function(f) {
            var ref1;
            return "    " + (pad(f.key)) + (gray((ref1 = f.desc) != null ? ref1 : f.key + " ..."));
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
