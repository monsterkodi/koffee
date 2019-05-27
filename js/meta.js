// koffee 0.45.0

/*
00     00  00000000  000000000   0000000   
000   000  000          000     000   000  
000000000  0000000      000     000000000  
000 0 000  000          000     000   000  
000   000  00000000     000     000   000
 */
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
                after: (metaLog(opts)) + "('" + name + "', (function(b){ let f=1000n; for (let u of ['ns','μs','ms','s','m']) { if (u=='m' || b<f) { return ''+(1000n*b/f)+u; } f*=1000n; }})(process.hrtime.bigint()-koffee_" + id + "));",
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
                after: "koffee_" + id + " += process.hrtime.bigint() - koffee_" + id + "_start;\n};\nkoffee_" + id + " /= " + num + "n;\n" + (metaLog(opts)) + "('" + id + "', (function(b){ let f=1000n; for (let u of ['ns','μs','ms','s','m']) { if (u=='m' || b<f) { return ''+(1000n*b/f)+u; } f*=1000n; }})(koffee_" + id + ")); ",
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
                before: (metaLog(opts)) + "('" + id + "', (function(b){ let f=1000n; for (let u of ['ns','μs','ms','s','m']) { if (u=='m' || b<f) { return ''+(1000n*b/f)+u; } f*=1000n; }})(process.hrtime.bigint()-koffee_" + id + "));",
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsaUZBQUE7SUFBQTs7QUFRQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0FBRVAsT0FBQSxHQUFVLE9BQUEsQ0FBUSxXQUFSOztBQUNWLE9BQU8sQ0FBQyxNQUFSLENBQUE7O0FBRUEsSUFBQSxHQUFPO0lBUUg7UUFBQSxHQUFBLEVBQUcsRUFBSDtRQStCQSxHQUFBLEVBQU0sTUEvQk47UUFnQ0EsSUFBQSxFQUFNLG1CQWhDTjtRQWlDQSxJQUFBLEVBQU0sU0FBQyxHQUFEO0FBQ0YsZ0JBQUE7WUFERyx3Q0FBRyxNQUFHLDBDQUFHLE1BQUcsMENBQUc7WUFDbEIsTUFBQSxHQUFTLElBQUssQ0FBQSxDQUFBLENBQUwsSUFBWSxDQUFBLE1BQUEsR0FBTyxJQUFLLENBQUEsQ0FBQSxDQUFaLEdBQWUsT0FBZixDQUFaLElBQXFDO21CQUM5QztnQkFBQSxNQUFBLEVBQVEsSUFBSSxDQUFDLEdBQUwsSUFBYSxDQUFFLENBQUMsT0FBQSxDQUFRLElBQVIsQ0FBRCxDQUFBLEdBQWUsR0FBZixHQUFrQixNQUFwQixDQUFyQjtnQkFDQSxLQUFBLEVBQVEsR0FEUjtnQkFFQSxJQUFBLEVBQVEsQ0FBSSxJQUFJLENBQUMsR0FBVCxJQUFpQjtvQkFBQSxDQUFBLElBQUEsQ0FBQSxFQUFLLElBQUw7aUJBRnpCO2dCQUdBLE1BQUEsRUFBUSxJQUhSO2dCQUlBLElBQUEsRUFBUSxJQUpSO2dCQUtBLEtBQUEsRUFBUSxLQUxSOztRQUZFLENBakNOO0tBUkcsRUF3REg7UUFBQSxHQUFBLEVBQU0sVUFBTjtRQUNBLElBQUEsRUFBTSxtQkFETjtRQUVBLElBQUEsRUFBTSxTQUFDLEdBQUQ7QUFFRixnQkFBQTtZQUZHLHdDQUFHLE1BQUcsMENBQUcsTUFBRywwQ0FBRztZQUVsQixFQUFBLEdBQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxD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LENBQVMsU0FBQyxDQUFEO0FBQU8sWUFBQTtlQUFBLE1BQUEsR0FBTSxDQUFDLE9BQU8sQ0FBQyxHQUFSLENBQVksQ0FBQyxDQUFDLEdBQWQsQ0FBRCxDQUFOLEdBQTBCLENBQUMsSUFBQSxnQ0FBaUIsQ0FBQyxDQUFDLEdBQUgsR0FBTyxNQUF2QixDQUFEO0lBQWpDLENBQVQsQ0FBMEUsQ0FBQyxJQUEzRSxDQUFnRixJQUFoRixDQUFGLENBQTNCO1dBQXFILE9BQUEsQ0FDcEgsR0FEb0gsQ0FDaEgsOEJBQUEsR0FBOEIsQ0FBQyxJQUFBLENBQUssMkNBQUwsQ0FBRCxDQUE5QixHQUFnRixJQURnQztBQUY3Rzs7QUFLWCxNQUFNLENBQUMsT0FBUCxHQUFpQjtJQUFFLE1BQUEsSUFBRjtJQUFRLFlBQUEsVUFBUjtJQUFvQixVQUFBLFFBQXBCO0lBQThCLGVBQUEsYUFBOUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwICAgICAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICBcbjAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICBcbjAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICBcbjAwMCAwIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICBcbjAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICBcbiMjI1xuXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcblxuaGVscGVycyA9IHJlcXVpcmUgJy4vaGVscGVycydcbmhlbHBlcnMuY29sb3JzKClcblxuTUVUQSA9IFtcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAwMCAgICAwMDAwMDAwICBcblxuICAgIGRvYzog4pa4ZG9jICfilrhkb2MnXG4gICAgICAgIFxuICAgICAgICBUaGlzIGlzIGEgc2xpZ2h0bHkgc3BlY2lhbCBtYWNybywgYmVjYXVzZSBpdCdzIGZpcnN0IHBhc3MgaXMgaGFyZGNvZGVkIGluIHRoZSB0b2tlbml6ZXIuXG4gICAgICAgIFRoZSBib2R5IG9mIHRoZSBtYWNybyBpcyB3cmFwcGVkIGluIGEgc2tpbm55IHRyaXBsZSBzdHJpbmcgYmVmb3JlIGZ1cnRoZXIgdG9rZW5pemF0aW9uLlxuICAgICAgICBJdCBjYW4gY29udGFpbiBhbnl0aGluZyBleGNlcHQgXFwnXFwnXFwnLlxuICAgICAgICBcbiAgICAgICAgSW4gbm9ybWFsIG9wZXJhdGlvbiwgaXQgaXMgcmVkdWNlZCB0byB0aGUgZW1wdHkgc3RyaW5nLiBcbiAgICAgICAgQnV0IGlmICoqa29mZmVlKiogaXMgY2FsbGVkIHdpdGggdGhlIGAtLWRvY2AgYXJndW1lbnQsIGxvZ3Mgd2lsbCBiZSBpbnNlcnRlZCBpbnN0ZWFkLlxuICAgICAgICBcbiAgICAgICAgYGBgY29mZmVlc2NyaXB0XG4gICAgICAgIOKWuGRvYyAndGl0bGUnXG4gICAgICAgICAgICBteSBkb2N1bWVudGF0aW9uIC4uLlxuICAgICAgICBsb2cgJ3NvbWUgY29kZSdcbiAgICAgICAg4pa4ZG9jXG4gICAgICAgICAgICB3ZSBhcmUgZG9uZS5cbiAgICAgICAgYGBgXG4gICAgICAgIFxuICAgICAgICBga29mZmVlIC0tZG9jIGZpbGVgIHdpbGwgb3V0cHV0XG4gICAgICAgIFxuICAgICAgICBgYGBtYXJrZG93blxuICAgICAgICAjIyB0aXRsZVxuICAgICAgICBteSBkb2N1bWVudGF0aW9uIC4uLlxuICAgICAgICBzb21lIGNvZGVcbiAgICAgICAgd2UgYXJlIGRvbmUuXG4gICAgICAgIGBgYFxuICAgICAgICBcbiAgICAgICAgYnV0IGBrb2ZmZWUgZmlsZWAgd2lsbCBvbmx5IHByaW50IGBzb21lIGNvZGVgXG4gICAgICAgIFxuICAgIGtleTogICfilrhkb2MnXG4gICAgZGVzYzogJ+KWuGRvYyBbaGVhZGVyXSAuLi4nXG4gICAgbWV0YTogKGFyZ3M6LG5vZGU6LG9wdHM6KSAtPlxuICAgICAgICBoZWFkZXIgPSBhcmdzWzBdIGFuZCBcIicjIyAje2FyZ3NbMF19XFxcXG4nK1wiIG9yIFwiJycrXCJcbiAgICAgICAgYmVmb3JlOiBvcHRzLmRvYyBhbmQgXCIje21ldGFMb2cob3B0cyl9KCN7aGVhZGVyfVwiXG4gICAgICAgIGFmdGVyOiAgXCIpXCJcbiAgICAgICAgc2tpcDogICBub3Qgb3B0cy5kb2MgYW5kIHdpdGg6XCInJ1wiXG4gICAgICAgIHJlZHVjZTogdHJ1ZVxuICAgICAgICBib2R5OiAgIHRydWVcbiAgICAgICAgYmxvY2s6ICBmYWxzZVxuLCAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBrZXk6ICAn4pa4cHJvZmlsZScgICBcbiAgICBkZXNjOiAn4pa4cHJvZmlsZSBbaWRdIC4uLidcbiAgICBtZXRhOiAoYXJnczosbm9kZTosb3B0czopIC0+IFxuICAgICAgICBcbiAgICAgICAgaWQgPSBcIiN7bm9kZS5jb25kaXRpb24ubG9jYXRpb25EYXRhLmZpcnN0X2xpbmUrMX1fI3tub2RlLmNvbmRpdGlvbi5sb2NhdGlvbkRhdGEuZmlyc3RfY29sdW1ufVwiXG4gICAgICAgIG5hbWUgPSBhcmdzWzBdID8gaWRcbiAgICAgICAgY29kZTogICBcImtvZmZlZV8je2lkfSA9IHByb2Nlc3MuaHJ0aW1lLmJpZ2ludCgpXCJcbiAgICAgICAgYWZ0ZXI6ICBcIiN7bWV0YUxvZyhvcHRzKX0oJyN7bmFtZX0nLCAoZnVuY3Rpb24oYil7IGxldCBmPTEwMDBuOyBmb3IgKGxldCB1IG9mIFsnbnMnLCfOvHMnLCdtcycsJ3MnLCdtJ10pIHsgaWYgKHU9PSdtJyB8fCBiPGYpIHsgcmV0dXJuICcnKygxMDAwbipiL2YpK3U7IH0gZio9MTAwMG47IH19KShwcm9jZXNzLmhydGltZS5iaWdpbnQoKS1rb2ZmZWVfI3tpZH0pKTtcIlxuICAgICAgICByZWR1Y2U6IGZhbHNlXG4gICAgICAgIGJvZHk6ICAgdHJ1ZVxuLFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAgICAwICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBrZXk6ICAn4pa4YXZlcmFnZScgICBcbiAgICBkZXNjOiAn4pa4YXZlcmFnZSBudW0gLi4uJ1xuICAgIG1ldGE6IChhcmdzOixub2RlOixvcHRzOikgLT4gXG4gICAgICAgIFxuICAgICAgICBpZCAgPSBcIiN7bm9kZS5jb25kaXRpb24ubG9jYXRpb25EYXRhLmZpcnN0X2xpbmUrMX1fI3tub2RlLmNvbmRpdGlvbi5sb2NhdGlvbkRhdGEuZmlyc3RfY29sdW1ufVwiXG4gICAgICAgIG51bSA9IGFyZ3NbMF0gPyAxMDBcbiAgICAgICAgYmVmb3JlOiAgXCJcIlwiXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGtvZmZlZV8je2lkfSA9IDBuO1xuICAgICAgICAgICAgZm9yKGkgPSAwOyBpIDwgI3tudW19OyBpKyspIFxuICAgICAgICAgICAgeyBcbiAgICAgICAgICAgICAgICBrb2ZmZWVfI3tpZH1fc3RhcnQgPSBwcm9jZXNzLmhydGltZS5iaWdpbnQoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgIGFmdGVyOiBcIlwiXCJcbiAgICAgICAgICAgIGtvZmZlZV8je2lkfSArPSBwcm9jZXNzLmhydGltZS5iaWdpbnQoKSAtIGtvZmZlZV8je2lkfV9zdGFydDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBrb2ZmZWVfI3tpZH0gLz0gI3tudW19bjtcbiAgICAgICAgICAgICN7bWV0YUxvZyhvcHRzKX0oJyN7aWR9JywgKGZ1bmN0aW9uKGIpeyBsZXQgZj0xMDAwbjsgZm9yIChsZXQgdSBvZiBbJ25zJywnzrxzJywnbXMnLCdzJywnbSddKSB7IGlmICh1PT0nbScgfHwgYjxmKSB7IHJldHVybiAnJysoMTAwMG4qYi9mKSt1OyB9IGYqPTEwMDBuOyB9fSkoa29mZmVlXyN7aWR9KSk7IFxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgIHJlZHVjZTogdHJ1ZVxuICAgICAgICBib2R5OiAgIHRydWVcbixcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAgMDAwICAgICBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAga2V5OiAgJ+KWuHN0YXJ0JyAgIFxuICAgIGRlc2M6ICfilrhzdGFydCBpZCAuLi4nXG4gICAgaW5mbzpcbiAgICAgICAgdGhlbjogdHJ1ZVxuICAgICAgICBhcmdzOiAxXG4gICAgbWV0YTogKGFyZ3M6KSAtPiBcbiAgICAgICAgaWQgPSBhcmdzWzBdID8gJ3N0YXJ0X2VuZCdcbiAgICAgICAgYmVmb3JlOiBcImtvZmZlZV8je2lkfSA9IHByb2Nlc3MuaHJ0aW1lLmJpZ2ludCgpXCJcbiAgICAgICAgcmVkdWNlOiB0cnVlXG4gICAgICAgIGJvZHk6ICAgZmFsc2VcbixcbiAgICBrZXk6ICAn4pa4ZW5kJyAgICAgXG4gICAgZGVzYzogJ+KWuGVuZCBpZCAuLi4nXG4gICAgaW5mbzpcbiAgICAgICAgdGhlbjogdHJ1ZVxuICAgICAgICBhcmdzOiAxXG4gICAgbWV0YTogKGFyZ3M6LG9wdHM6KSAtPiBcbiAgICAgICAgaWQgPSBhcmdzWzBdID8gJ3N0YXJ0X2VuZCdcbiAgICAgICAgYmVmb3JlOiBcIiN7bWV0YUxvZyhvcHRzKX0oJyN7aWR9JywgKGZ1bmN0aW9uKGIpeyBsZXQgZj0xMDAwbjsgZm9yIChsZXQgdSBvZiBbJ25zJywnzrxzJywnbXMnLCdzJywnbSddKSB7IGlmICh1PT0nbScgfHwgYjxmKSB7IHJldHVybiAnJysoMTAwMG4qYi9mKSt1OyB9IGYqPTEwMDBuOyB9fSkocHJvY2Vzcy5ocnRpbWUuYmlnaW50KCkta29mZmVlXyN7aWR9KSk7XCJcbiAgICAgICAgcmVkdWNlOiB0cnVlXG4gICAgICAgIGJvZHk6ICAgZmFsc2VcbiwgICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBrZXk6ICAn4pa4ZGJnJyAgICBcbiAgICBkZXNjOiAn4pa4ZGJnIFttc2ddIC4uLidcbiAgICBpbmZvOlxuICAgICAgICB0aGVuOiB0cnVlICMgc2hvdWxkIG5vdCBiZSB1c2VkIHdpdGggYSBibG9ja1xuICAgICAgICBhcmdzOiAxXG4gICAgbWV0YTogKG9wdHM6LGFyZ3M6LG5vZGU6KSAtPlxuICAgICAgICBiZWZvcmU6IGxvZ1NvdXJjZSB7b3B0cywgYXJncywgbm9kZX1cbiAgICAgICAgYWZ0ZXI6ICAnKSdcbiAgICAgICAgcmVkdWNlOiB0cnVlXG4gICAgICAgIGJvZHk6ICAgdHJ1ZVxuICAgICAgICBibG9jazogIGZhbHNlXG4sICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAga2V5OiAgJ+KWuGFzc2VydCcgICAgXG4gICAgZGVzYzogJ+KWuGFzc2VydCBbbXNnXSAuLi4nXG4gICAgbWV0YTogKG9wdHM6LGFyZ3M6LG5vZGU6KSAtPlxuICAgICAgICBcbiAgICAgICAgeyBCbG9jayB9ID0gcmVxdWlyZSAnLi9ub2RlcycgXG4gICAgICAgIGlmIG5vZGUuYm9keSBpbnN0YW5jZW9mIEJsb2NrXG4gICAgICAgICAgICBib2R5ID0gbm9kZS5ib2R5LmV4cHJlc3Npb25zWzBdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGJvZHkgPSBub2RlLmJvZHlcbiAgICAgICAgICAgIFxuICAgICAgICBmcmFnID0gYm9keS5jb21waWxlVG9GcmFnbWVudHMgb3B0c1xuICAgICAgICB0ZXh0ID0gbm9kZS5mcmFnbWVudHNUb1RleHQgZnJhZ1xuICAgICAgICBhcmdzID0gWydhc3NlcnRpb24gZmFpbHVyZSEnXSBpZiBub3QgYXJncy5sZW5ndGhcbiAgICAgICAgYmVmb3JlOiBsb2dTb3VyY2Uge29wdHMsIGFyZ3MsIG5vZGUsIGNsb3NlOnRydWV9XG4gICAgICAgIGFmdGVyOiAgJ3Byb2Nlc3MuZXhpdCg2NjYpOydcbiAgICAgICAgdGhlbjogICB0cnVlICMgc2hvdWxkIG5vdCBiZSB1c2VkIHdpdGggYSBibG9ja1xuICAgICAgICBldmFsOiAgIGZhbHNlXG4gICAgICAgIHJlZHVjZTogZmFsc2VcbiAgICAgICAgY29kZTogICBcIiEoI3t0ZXh0fSlcIlxuLCAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgICAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgXG4gICAga2V5OiAgJ+KWuHRlc3QnXG4gICAgZGVzYzogJ+KWuHRlc3QgW2lkXSAuLi4nXG4gICAgbWV0YTogKG9wdHM6LGFyZ3M6LG5vZGU6KSAtPlxuICAgICAgICBiZWZvcmUgID0gbG9nU291cmNlIHtvcHRzLCBhcmdzLCBub2RlLCBjbG9zZTp0cnVlfVxuICAgICAgICBiZWZvcmUgKz0gJ1xcbiAgICB0cnkge1xcbidcbiAgICAgICAgZGVkZW50OiB0cnVlXG4gICAgICAgIGJlZm9yZTogb3B0cy50ZXN0IGFuZCBiZWZvcmVcbiAgICAgICAgYWZ0ZXI6ICBvcHRzLnRlc3QgYW5kIFwifSBjYXRjaChlcnIpIHsgI3ttZXRhTG9nKG9wdHMpfShlcnIubWVzc2FnZSk7IH1cXG5cIlxuICAgICAgICBza2lwOiAgIG5vdCBvcHRzLnRlc3RcbiAgICAgICAgcmVkdWNlOiB0cnVlXG4gICAgICAgIGJvZHk6ICAgdHJ1ZVxuLCAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBrZXk6ICfilrhyYW5kJyAgICBcbiAgICBtZXRhOiAoYXJnczopIC0+IFxuICAgICAgICBjb2RlOiAgIFwiTWF0aC5yYW5kb20oKSA8ICN7YXJncz9bMF0gPyAwLjV9XCIgXG4gICAgICAgIHJlZHVjZTogZmFsc2UgXG4gICAgICAgIGJvZHk6ICAgdHJ1ZSAgIFxuICAgIFxuICAgICMga2V5OiAndG9rZW4nICdwYXJzZScgJ2NvZGUnXG5dXG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG5cblRBQiA9ICcgICAgJ1xuXG5jb21waWxlTWV0YUlmID0gKG5vZGU6LG9wdHM6KSAtPlxuXG4gICAgeyBCbG9jaywgQXNzaWduLCBWYWx1ZSwgTGl0ZXJhbCB9ID0gcmVxdWlyZSAnLi9ub2RlcydcbiAgICB7IG1lcmdlIH0gPSByZXF1aXJlICcuL2hlbHBlcnMnXG4gICAgICAgIFxuICAgIGluZm8gPSByZWR1Y2U6dHJ1ZSwgZXZhbDp0cnVlXG4gICAgXG4gICAgaWYgbm9kZS5jb25kaXRpb24uYmFzZT8udmFsdWU/LnN0YXJ0c1dpdGggJ+KWuCdcbiAgICAgICAgXG4gICAgICAgIG1ldGFLZXkgPSBub2RlLmNvbmRpdGlvbi5iYXNlLnZhbHVlXG4gICAgICAgIGlmIHR5cGVvZiBvcHRzLm1ldGFbbWV0YUtleV0gPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgaW5mbyA9IG9wdHMubWV0YVttZXRhS2V5XSB7b3B0cywgbm9kZSwgYXJnczpbXX1cbiAgICAgICAgICAgIFxuICAgIGlmIG5vZGUuY29uZGl0aW9uLnZhcmlhYmxlPy5iYXNlPy52YWx1ZT8uc3RhcnRzV2l0aCAn4pa4J1xuICAgICAgICBcbiAgICAgICAgbWV0YUtleSA9IG5vZGUuY29uZGl0aW9uLnZhcmlhYmxlLmJhc2UudmFsdWVcbiAgICAgICAgaWYgdHlwZW9mIG9wdHMubWV0YVttZXRhS2V5XSA9PSAnZnVuY3Rpb24nXG4gICAgICAgICAgICBhcmdzID0gbm9kZS5jb25kaXRpb24uYXJncy5tYXAgKGEpIC0+IFxuICAgICAgICAgICAgICAgIGEuYmFzZT8udmFsdWVcbiAgICAgICAgICAgIGFyZ3MgPSBhcmdzLm1hcCAoYSkgLT4gaWYgYVswXSBpbiBbJ1wiJywgXCInXCJdIHRoZW4gYVsxLi4tMl0gZWxzZSBhXG4gICAgICAgICAgICBpbmZvID0gb3B0cy5tZXRhW21ldGFLZXldIHtvcHRzLCBub2RlLCBhcmdzfVxuICAgICAgICBcbiAgICBpZiBpbmZvLnNraXAgXG4gICAgICAgIGlmIGluZm8uc2tpcC53aXRoP1xuICAgICAgICAgICAgcmV0dXJuIG5vZGUubWFrZUNvZGUgaW5mby5za2lwLndpdGhcbiAgICAgICAgcmV0dXJuIFtdXG4gICAgXG4gICAgaWYgaW5mby5ldmFsXG4gICAgICAgIFxuICAgICAgICBjb25kID0gaW5mby5jb2RlID8gbm9kZS5mcmFnbWVudHNUb1RleHQgbm9kZS5jb25kaXRpb24uY29tcGlsZVRvRnJhZ21lbnRzIG9wdHMsIDIgI0xFVkVMX1BBUkVOXG4gICAgICAgIHRyeVxuICAgICAgICAgICAgb3MgPSByZXF1aXJlICdvcydcbiAgICAgICAgICAgIGZzID0gcmVxdWlyZSAnZnMnXG4gICAgICAgICAgICBpbmZvLmJvZHkgPSEhIGV2YWwgY29uZFxuICAgICAgICAgICAgaWYgaW5mby5ldmFsIGFuZCBpbmZvLnJlZHVjZSBhbmQgbm90IGluZm8uYm9keSBhbmQgbm90IG5vZGUuZWxzZUJvZHlcbiAgICAgICAgICAgICAgICByZXR1cm4gW11cbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICBlcnJvciBlcnJcbiAgICAgICAgXG4gICAgZnJhZyA9IFtdXG4gICAgXG4gICAgaWYgaW5mby5yZWR1Y2UgPT0gZmFsc2VcbiAgICAgICAgZnJhZyA9IGZyYWcuY29uY2F0IG5vZGUubWFrZUNvZGUoXCJpZiAoXCIpLCBub2RlLm1ha2VDb2RlKGluZm8uY29kZSksIG5vZGUubWFrZUNvZGUoXCIpIHtcXG5cIilcbiAgICAgICAgXG4gICAgICAgIGluZGVudCA9IG9wdHMuaW5kZW50ICsgVEFCXG4gICAgICAgIGJvZHlPcHQgPSBtZXJnZSBvcHRzLCB7aW5kZW50fVxuICAgIGVsc2VcbiAgICAgICAgaW5kZW50ID0gb3B0cy5pbmRlbnRcbiAgICAgICAgYm9keU9wdCA9IG9wdHNcblxuICAgIGlmIGluZm8uYmVmb3JlXG4gICAgICAgIGZyYWcucHVzaCBub2RlLm1ha2VDb2RlIChpbmZvLmJsb2NrIT1mYWxzZSBhbmQgaW5mby5kZWRlbnQhPXRydWUgYW5kIGluZGVudCBvciAnJykgKyBpbmZvLmJlZm9yZVxuICAgICAgICBcbiAgICBpZiBpbmZvLmJvZHlcbiAgICAgICAgaWYgaW5mby5ibG9jayAhPSBmYWxzZVxuICAgICAgICAgICAgYm9keSA9IG5vZGUuZW5zdXJlQmxvY2sgbm9kZS5ib2R5XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIG5vZGUuYm9keSBpbnN0YW5jZW9mIEJsb2NrXG4gICAgICAgICAgICAgICAgYm9keSA9IG5vZGUuYm9keS5leHByZXNzaW9uc1swXVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGJvZHkgPSBub2RlLmJvZHlcbiAgICAgICAgaWYgYm9keVxuICAgICAgICAgICAgZnJhZyA9IGZyYWcuY29uY2F0IGJvZHkuY29tcGlsZVRvRnJhZ21lbnRzIGJvZHlPcHRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZnJhZy5wdXNoIG5vZGUubWFrZUNvZGUgXCInJ1wiICMgaWYgaW5mby5ibG9jayA9PSBmYWxzZSA/Pz9cbiAgICAgICAgXG4gICAgaWYgaW5mby5hZnRlclxuICAgICAgICBmcmFnLnB1c2ggbm9kZS5tYWtlQ29kZSAoKGluZm8uYmxvY2sgIT0gZmFsc2UpIGFuZCAoJ1xcbicgKyBpbmRlbnQpIG9yICcnKSArIGluZm8uYWZ0ZXJcblxuICAgIGlmIG5vdCBpbmZvLnJlZHVjZVxuICAgICAgICBmcmFnLnB1c2ggbm9kZS5tYWtlQ29kZShcIlxcbiN7bm9kZS50YWJ9fVwiKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICBpZiBub2RlLmVsc2VCb2R5IGFuZCAoaW5mby5yZWR1Y2UgPT0gZmFsc2Ugb3IgaW5mby5ib2R5ID09IGZhbHNlKVxuICAgICAgICBmcmFnLnB1c2ggbm9kZS5tYWtlQ29kZSAnIGVsc2UgJyBpZiBub3QgaW5mby5yZWR1Y2VcbiAgICAgICAgaWYgbm9kZS5pc0NoYWluXG4gICAgICAgICAgICBmcmFnID0gZnJhZy5jb25jYXQgbm9kZS5lbHNlQm9keS51bndyYXAoKS5jb21waWxlVG9GcmFnbWVudHMgYm9keU9wdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBmcmFnID0gZnJhZy5jb25jYXQgbm9kZS5lbHNlQm9keS5jb21waWxlVG9GcmFnbWVudHMgYm9keU9wdFxuICAgICAgICBcbiAgICByZXR1cm4gZnJhZ1xuICAgIFxuIyAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4jIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgICAgMDAwMDAwMCAgIFxuIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcblxubWV0YUxvZyA9IChvcHRzKSAtPiBvcHRzLm1ldGFsb2cgPyAnY29uc29sZS5sb2cnXG5cbmxvZ1NvdXJjZSA9IChvcHRzOixhcmdzOixub2RlOixjbG9zZTopIC0+XG4gICAgXG4gICAgY29sb3JldHRlLm9wdGlvbnMuZW5hYmxlZCA9IG9wdHMuZmVhdHVyZS5jb2xvclxuICAgIHNvdXJjZSA9IG9wdHMuc291cmNlID8gb3B0cy5maWxlbmFtZSA/ICcnXG4gICAgZXh0ID0gJydcbiAgICBpZiBzb3VyY2VcbiAgICAgICAgW3NvdXJjZSwgZXh0Li4uXSA9IHBhdGguYmFzZW5hbWUoc291cmNlKS5zcGxpdCAnLidcbiAgICAgICAgc291cmNlICA9IHllbGxvdyBbeWVsbG93QnJpZ2h0KHNvdXJjZSksIGRpbSBleHQuam9pbicuJ10uam9pbiBkaW0gJy4nXG4gICAgYmVmb3JlICA9IFwiI3ttZXRhTG9nKG9wdHMpfSgnI3tzb3VyY2V9I3tkaW0gYmx1ZSAnOid9I3tibHVlQnJpZ2h0IFwiI3tub2RlLmNvbmRpdGlvbi5sb2NhdGlvbkRhdGEuZmlyc3RfbGluZSsxfVwifSdcIlxuICAgIGJlZm9yZSArPSBcIiwgJyN7Ym9sZCB3aGl0ZUJyaWdodCBhcmdzWzBdfSdcIiBpZiBhcmdzWzBdIFxuICAgIGlmIChjbG9zZSlcbiAgICAgICAgYmVmb3JlICs9ICcpO1xcbidcbiAgICBlbHNlXG4gICAgICAgIGJlZm9yZSArPSBcIiwgXCJcbiAgICBjb2xvcmV0dGUub3B0aW9ucy5lbmFibGVkID0gdHJ1ZVxuICAgIGJlZm9yZVxuICAgICAgICBcbiMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIFxuIyAwMDAgIDAwMDAgIDAwMCAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4jIDAwMCAgMDAwIDAgMDAwICAgICAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiMgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuIyAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgXG5cbmluamVjdE1ldGEgPSAob3B0aW9ucykgLT4gIyBtYWtlIHN1cmUgdGhhdCBvcHRpb25zIGhhcyBhIG1ldGEgc2V0XG4gICAgXG4gICAgb3B0aW9ucyA/PSB7fVxuICAgIFxuICAgIHsgZXh0ZW5kIH0gPSByZXF1aXJlICcuL2hlbHBlcnMnXG4gICAgXG4gICAgZGVmYXVsdE1ldGEgPSB7fVxuICAgIE1FVEEubWFwIChtKSAtPiBkZWZhdWx0TWV0YVttLmtleV0gPSBtLm1ldGE7IG0ubWV0YS5rZXkgPSBtLmtleTsgbS5tZXRhLmluZm8gPSBtLmluZm9cbiAgICBcbiAgICBtZXRhICAgID0gZXh0ZW5kIGRlZmF1bHRNZXRhLCBvcHRpb25zLm1ldGEgPyB7fVxuICAgIG9wdGlvbnMgPSBleHRlbmQgeyBtZXRhOiBtZXRhIH0sIG9wdGlvbnNcbiAgICBvcHRpb25zXG5cbmxvZ01ldGFzID0gLT5cbiAgICBcbiAgICBsb2cgXCIje2dyYXkgJ01ldGFzOid9XFxuXFxuI3sgTUVUQS5tYXAoKGYpIC0+IFwiICAgICN7aGVscGVycy5wYWQgZi5rZXl9I3tncmF5IGYuZGVzYyA/IFwiI3tmLmtleX0gLi4uXCJ9XCIpLmpvaW4oJ1xcbicpIH1cIlxuICAgIGxvZyBcIiAgICDilrhpZiAgICAgICAgICAgICAgICAgICAgICN7Z3JheSAn4pa4aWYgY29uZCAuLi4gW1vilrhlbGlmIGNvbmQgLi4uXSDilrhlbHNlIC4uLl0nfVxcblwiXG4gICAgXG5tb2R1bGUuZXhwb3J0cyA9IHsgTUVUQSwgaW5qZWN0TWV0YSwgbG9nTWV0YXMsIGNvbXBpbGVNZXRhSWYgfVxuIl19
//# sourceURL=../coffee/meta.coffee