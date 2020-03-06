// koffee 1.12.0

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
                after: (metaLog(opts)) + "('" + name + "', (function(b){ let f=1000n; for (let u of ['ns','μs','ms','s']) { if (u=='s' || b<f) { return ''+(1000n*b/f)+' '+u; } f*=1000n; }})(process.hrtime.bigint()-koffee_" + id + "));",
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
            var Block, args, body, extend, frag, node, opts, ref, ref1, ref2, ref3, text;
            opts = (ref = arg.opts) != null ? ref : null, args = (ref1 = arg.args) != null ? ref1 : null, node = (ref2 = arg.node) != null ? ref2 : null;
            ref3 = require('./nodes'), Block = ref3.Block, extend = ref3.extend;
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
    var Assign, Block, Literal, Value, args, body, bodyOpt, cond, err, extend, frag, fs, indent, info, merge, metaKey, node, opts, os, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9;
    node = (ref = arg.node) != null ? ref : null, opts = (ref1 = arg.opts) != null ? ref1 : null;
    ref2 = require('./nodes'), Block = ref2.Block, Assign = ref2.Assign, Value = ref2.Value, Literal = ref2.Literal;
    ref3 = require('./helpers'), extend = ref3.extend, merge = ref3.merge;
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
        if (info.skip["with"] != null) {
            return node.makeCode(info.skip["with"]);
        }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YS5qcyIsInNvdXJjZVJvb3QiOiIuLi9jb2ZmZWUiLCJzb3VyY2VzIjpbIm1ldGEuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGlGQUFBO0lBQUE7O0FBUUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztBQUVQLE9BQUEsR0FBVSxPQUFBLENBQVEsV0FBUjs7QUFDVixPQUFPLENBQUMsTUFBUixDQUFBOztBQUVBLElBQUEsR0FBTztJQVFIO1FBQUEsR0FBQSxFQUFHLEVBQUg7UUErQkEsR0FBQSxFQUFNLE1BL0JOO1FBZ0NBLElBQUEsRUFBTSxtQkFoQ047UUFpQ0EsSUFBQSxFQUFNLFNBQUMsR0FBRDtBQUNGLGdCQUFBO1lBREcsd0NBQUcsTUFBRywwQ0FBRyxNQUFHLDBDQUFHO1lBQ2xCLE1BQUEsR0FBUyxJQUFLLENBQUEsQ0FBQSxDQUFMLElBQVksQ0FBQSxNQUFBLEdBQU8sSUFBSyxDQUFBLENBQUEsQ0FBWixHQUFlLE9BQWYsQ0FBWixJQUFxQzttQkFDOUM7Z0JBQUEsTUFBQSxFQUFRLElBQUksQ0FBQyxHQUFMLElBQWEsQ0FBRSxDQUFDLE9BQUEsQ0FBUSxJQUFSLENBQUQsQ0FBQSxHQUFlLEdBQWYsR0FBa0IsTUFBcEIsQ0FBckI7Z0JBQ0EsS0FBQSxFQUFRLEdBRFI7Z0JBRUEsSUFBQSxFQUFRLENBQUksSUFBSSxDQUFDLEdBQVQsSUFBaUI7b0JBQUEsQ0FBQSxJQUFBLENBQUEsRUFBSyxJQUFMO2lCQUZ6QjtnQkFHQSxNQUFBLEVBQVEsSUFIUjtnQkFJQSxJQUFBLEVBQVEsSUFKUjtnQkFLQSxLQUFBLEVBQVEsS0FMUjs7UUFGRSxDQWpDTjtLQVJHLEVBd0RIO1FBQUEsR0FBQSxFQUFNLFVBQU47UUFDQSxJQUFBLEVBQU0sbUJBRE47UUFFQSxJQUFBLEVBQU0sU0FBQyxHQUFEO0FBRUYsZ0JBQUE7WUFGRyx3Q0FBRyxNQUFHLDBDQUFHLE1BQUcsMENBQUc7WUFFbEIsRUFBQSxHQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsVUFBNUIsR0FBdUMsQ0FBeEMsQ0FBQSxHQUEwQyxHQUExQyxHQUE2QyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQztZQUNoRixJQUFBLHFDQUFpQjttQkFDakI7Z0JBQUEsSUFBQSxFQUFRLFNBQUEsR0FBVSxFQUFWLEdBQWEsNEJBQXJCO2dCQUNBLEtBQUEsRUFBVSxDQUFDLE9BQUEsQ0FBUSxJQUFSLENBQUQsQ0FBQSxHQUFlLElBQWYsR0FBbUIsSUFBbkIsR0FBd0IsdUtBQXhCLEdBQStMLEVBQS9MLEdBQWtNLEtBRDVNO2dCQUVBLE1BQUEsRUFBUSxLQUZSO2dCQUdBLElBQUEsRUFBUSxJQUhSOztRQUpFLENBRk47S0F4REcsRUF5RUg7UUFBQSxHQUFBLEVBQU0sVUFBTjtRQUNBLElBQUEsRUFBTSxrQkFETjtRQUVBLElBQUEsRUFBTSxTQUFDLEdBQUQ7QUFFRixnQkFBQTtZQUZHLHdDQUFHLE1BQUcsMENBQUcsTUFBRywwQ0FBRztZQUVsQixFQUFBLEdBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxVQUE1QixHQUF1QyxDQUF4QyxDQUFBLEdBQTBDLEdBQTFDLEdBQTZDLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDO1lBQ2pGLEdBQUEscUNBQWdCO21CQUNoQjtnQkFBQSxNQUFBLEVBQVMsV0FBQSxHQUVJLEVBRkosR0FFTyx5QkFGUCxHQUdZLEdBSFosR0FHZ0IsMEJBSGhCLEdBS1EsRUFMUixHQUtXLHFDQUxwQjtnQkFRQSxLQUFBLEVBQU8sU0FBQSxHQUNNLEVBRE4sR0FDUyx1Q0FEVCxHQUNnRCxFQURoRCxHQUNtRCxzQkFEbkQsR0FHTSxFQUhOLEdBR1MsTUFIVCxHQUdlLEdBSGYsR0FHbUIsTUFIbkIsR0FJRixDQUFDLE9BQUEsQ0FBUSxJQUFSLENBQUQsQ0FKRSxHQUlhLElBSmIsR0FJaUIsRUFKakIsR0FJb0IsK0lBSnBCLEdBSW1LLEVBSm5LLEdBSXNLLE1BWjdLO2dCQWNBLE1BQUEsRUFBUSxJQWRSO2dCQWVBLElBQUEsRUFBUSxJQWZSOztRQUpFLENBRk47S0F6RUcsRUFzR0g7UUFBQSxHQUFBLEVBQU0sUUFBTjtRQUNBLElBQUEsRUFBTSxlQUROO1FBRUEsSUFBQSxFQUNJO1lBQUEsSUFBQSxFQUFNLElBQU47WUFDQSxJQUFBLEVBQU0sQ0FETjtTQUhKO1FBS0EsSUFBQSxFQUFNLFNBQUMsR0FBRDtBQUNGLGdCQUFBO1lBREcsd0NBQUc7WUFDTixFQUFBLHFDQUFlO21CQUNmO2dCQUFBLE1BQUEsRUFBUSxTQUFBLEdBQVUsRUFBVixHQUFhLDRCQUFyQjtnQkFDQSxNQUFBLEVBQVEsSUFEUjtnQkFFQSxJQUFBLEVBQVEsS0FGUjs7UUFGRSxDQUxOO0tBdEdHLEVBaUhIO1FBQUEsR0FBQSxFQUFNLE1BQU47UUFDQSxJQUFBLEVBQU0sYUFETjtRQUVBLElBQUEsRUFDSTtZQUFBLElBQUEsRUFBTSxJQUFOO1lBQ0EsSUFBQSxFQUFNLENBRE47U0FISjtRQUtBLElBQUEsRUFBTSxTQUFDLEdBQUQ7QUFDRixnQkFBQTtZQURHLHdDQUFHLE1BQUcsMENBQUc7WUFDWixFQUFBLHFDQUFlO21CQUNmO2dCQUFBLE1BQUEsRUFBVSxDQUFDLE9BQUEsQ0FBUSxJQUFSLENBQUQsQ0FBQSxHQUFlLElBQWYsR0FBbUIsRUFBbkIsR0FBc0IsdUtBQXRCLEdBQTZMLEVBQTdMLEdBQWdNLEtBQTFNO2dCQUNBLE1BQUEsRUFBUSxJQURSO2dCQUVBLElBQUEsRUFBUSxLQUZSOztRQUZFLENBTE47S0FqSEcsRUFrSUg7UUFBQSxHQUFBLEVBQU0sTUFBTjtRQUNBLElBQUEsRUFBTSxnQkFETjtRQUVBLElBQUEsRUFDSTtZQUFBLElBQUEsRUFBTSxJQUFOO1lBQ0EsSUFBQSxFQUFNLENBRE47U0FISjtRQUtBLElBQUEsRUFBTSxTQUFDLEdBQUQ7QUFDRixnQkFBQTtZQURHLHdDQUFHLE1BQUcsMENBQUcsTUFBRywwQ0FBRzttQkFDbEI7Z0JBQUEsTUFBQSxFQUFRLFNBQUEsQ0FBVTtvQkFBQyxNQUFBLElBQUQ7b0JBQU8sTUFBQSxJQUFQO29CQUFhLE1BQUEsSUFBYjtpQkFBVixDQUFSO2dCQUNBLEtBQUEsRUFBUSxHQURSO2dCQUVBLE1BQUEsRUFBUSxJQUZSO2dCQUdBLElBQUEsRUFBUSxJQUhSO2dCQUlBLEtBQUEsRUFBUSxLQUpSOztRQURFLENBTE47S0FsSUcsRUFvSkg7UUFBQSxHQUFBLEVBQU0sU0FBTjtRQUNBLElBQUEsRUFBTSxtQkFETjtRQUVBLElBQUEsRUFBTSxTQUFDLEdBQUQ7QUFFRixnQkFBQTtZQUZHLHdDQUFHLE1BQUcsMENBQUcsTUFBRywwQ0FBRztZQUVsQixPQUFvQixPQUFBLENBQVEsU0FBUixDQUFwQixFQUFFLGtCQUFGLEVBQVM7WUFDVCxJQUFHLElBQUksQ0FBQyxJQUFMLFlBQXFCLEtBQXhCO2dCQUNJLElBQUEsR0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVksQ0FBQSxDQUFBLEVBRGpDO2FBQUEsTUFBQTtnQkFHSSxJQUFBLEdBQU8sSUFBSSxDQUFDLEtBSGhCOztZQUtBLElBQUEsR0FBTyxJQUFJLENBQUMsa0JBQUwsQ0FBd0IsSUFBeEI7WUFDUCxJQUFBLEdBQU8sSUFBSSxDQUFDLGVBQUwsQ0FBcUIsSUFBckI7WUFDUCxJQUFpQyxDQUFJLElBQUksQ0FBQyxNQUExQztnQkFBQSxJQUFBLEdBQU8sQ0FBQyxvQkFBRCxFQUFQOzttQkFDQTtnQkFBQSxNQUFBLEVBQVEsU0FBQSxDQUFVO29CQUFDLE1BQUEsSUFBRDtvQkFBTyxNQUFBLElBQVA7b0JBQWEsTUFBQSxJQUFiO29CQUFtQixLQUFBLEVBQU0sSUFBekI7aUJBQVYsQ0FBUjtnQkFDQSxLQUFBLEVBQVEsb0JBRFI7Z0JBRUEsSUFBQSxFQUFRLElBRlI7Z0JBR0EsQ0FBQSxJQUFBLENBQUEsRUFBUSxLQUhSO2dCQUlBLE1BQUEsRUFBUSxLQUpSO2dCQUtBLElBQUEsRUFBUSxJQUFBLEdBQUssSUFBTCxHQUFVLEdBTGxCOztRQVhFLENBRk47S0FwSkcsRUE4S0g7UUFBQSxHQUFBLEVBQU0sT0FBTjtRQUNBLElBQUEsRUFBTSxnQkFETjtRQUVBLElBQUEsRUFBTSxTQUFDLEdBQUQ7QUFDRixnQkFBQTtZQURHLHdDQUFHLE1BQUcsMENBQUcsTUFBRywwQ0FBRztZQUNsQixNQUFBLEdBQVUsU0FBQSxDQUFVO2dCQUFDLE1BQUEsSUFBRDtnQkFBTyxNQUFBLElBQVA7Z0JBQWEsTUFBQSxJQUFiO2dCQUFtQixLQUFBLEVBQU0sSUFBekI7YUFBVjtZQUNWLE1BQUEsSUFBVTttQkFDVjtnQkFBQSxNQUFBLEVBQVEsSUFBUjtnQkFDQSxNQUFBLEVBQVEsSUFBSSxDQUFDLElBQUwsSUFBYyxNQUR0QjtnQkFFQSxLQUFBLEVBQVEsSUFBSSxDQUFDLElBQUwsSUFBYyxDQUFBLGlCQUFBLEdBQWlCLENBQUMsT0FBQSxDQUFRLElBQVIsQ0FBRCxDQUFqQixHQUFnQyxvQkFBaEMsQ0FGdEI7Z0JBR0EsSUFBQSxFQUFRLENBQUksSUFBSSxDQUFDLElBSGpCO2dCQUlBLE1BQUEsRUFBUSxJQUpSO2dCQUtBLElBQUEsRUFBUSxJQUxSOztRQUhFLENBRk47S0E5S0csRUFnTUg7UUFBQSxHQUFBLEVBQUssT0FBTDtRQUNBLElBQUEsRUFBTSxTQUFDLEdBQUQ7QUFDRixnQkFBQTtZQURHLHdDQUFHO21CQUNOO2dCQUFBLElBQUEsRUFBUSxrQkFBQSxHQUFrQiwyREFBWSxHQUFaLENBQTFCO2dCQUNBLE1BQUEsRUFBUSxLQURSO2dCQUVBLElBQUEsRUFBUSxJQUZSOztRQURFLENBRE47S0FoTUc7OztBQStNUCxHQUFBLEdBQU07O0FBRU4sYUFBQSxHQUFnQixTQUFDLEdBQUQ7QUFFWixRQUFBO0lBRmEsd0NBQUcsTUFBRywwQ0FBRztJQUV0QixPQUFvQyxPQUFBLENBQVEsU0FBUixDQUFwQyxFQUFFLGtCQUFGLEVBQVMsb0JBQVQsRUFBaUIsa0JBQWpCLEVBQXdCO0lBQ3hCLE9BQW9CLE9BQUEsQ0FBUSxXQUFSLENBQXBCLEVBQUUsb0JBQUYsRUFBVTtJQUVWLElBQUEsR0FBTztRQUFBLE1BQUEsRUFBTyxJQUFQO1FBQWEsQ0FBQSxJQUFBLENBQUEsRUFBSyxJQUFsQjs7SUFFUCw2RUFBNkIsQ0FBRSxVQUE1QixDQUF1QyxHQUF2QyxtQkFBSDtRQUVJLE9BQUEsR0FBVSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztRQUM5QixJQUFHLE9BQU8sSUFBSSxDQUFDLElBQUssQ0FBQSxPQUFBLENBQWpCLEtBQTZCLFVBQWhDO1lBQ0ksSUFBQSxHQUFPLElBQUksQ0FBQyxJQUFLLENBQUEsT0FBQSxDQUFWLENBQW1CO2dCQUFDLE1BQUEsSUFBRDtnQkFBTyxNQUFBLElBQVA7Z0JBQWEsSUFBQSxFQUFLLEVBQWxCO2FBQW5CLEVBRFg7U0FISjs7SUFNQSw4R0FBdUMsQ0FBRSxVQUF0QyxDQUFpRCxHQUFqRCw0QkFBSDtRQUVJLE9BQUEsR0FBVSxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7UUFDdkMsSUFBRyxPQUFPLElBQUksQ0FBQyxJQUFLLENBQUEsT0FBQSxDQUFqQixLQUE2QixVQUFoQztZQUNJLElBQUEsR0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFwQixDQUF3QixTQUFDLENBQUQ7QUFDM0Isb0JBQUE7cURBQU0sQ0FBRTtZQURtQixDQUF4QjtZQUVQLElBQUEsR0FBTyxJQUFJLENBQUMsR0FBTCxDQUFTLFNBQUMsQ0FBRDtBQUFPLG9CQUFBO2dCQUFBLFlBQUcsQ0FBRSxDQUFBLENBQUEsRUFBRixLQUFTLEdBQVQsSUFBQSxJQUFBLEtBQWMsR0FBakI7MkJBQTJCLENBQUUsY0FBN0I7aUJBQUEsTUFBQTsyQkFBeUMsRUFBekM7O1lBQVAsQ0FBVDtZQUNQLElBQUEsR0FBTyxJQUFJLENBQUMsSUFBSyxDQUFBLE9BQUEsQ0FBVixDQUFtQjtnQkFBQyxNQUFBLElBQUQ7Z0JBQU8sTUFBQSxJQUFQO2dCQUFhLE1BQUEsSUFBYjthQUFuQixFQUpYO1NBSEo7O0lBU0EsSUFBRyxJQUFJLENBQUMsSUFBUjtRQUNJLElBQUcseUJBQUg7QUFDSSxtQkFBTyxJQUFJLENBQUMsUUFBTCxDQUFjLElBQUksQ0FBQyxJQUFJLEVBQUMsSUFBRCxFQUF2QixFQURYOztBQUVBLGVBQU8sR0FIWDs7SUFLQSxJQUFHLElBQUksRUFBQyxJQUFELEVBQVA7UUFFSSxJQUFBLHVDQUFtQixJQUFJLENBQUMsZUFBTCxDQUFxQixJQUFJLENBQUMsU0FBUyxDQUFDLGtCQUFmLENBQWtDLElBQWxDLEVBQXdDLENBQXhDLENBQXJCO0FBQ25CO1lBQ0ksRUFBQSxHQUFLLE9BQUEsQ0FBUSxJQUFSO1lBQ0wsRUFBQSxHQUFLLE9BQUEsQ0FBUSxJQUFSO1lBQ0wsSUFBSSxDQUFDLElBQUwsR0FBVyxDQUFDLENBQUUsSUFBQSxDQUFLLElBQUw7WUFDZCxJQUFHLElBQUksRUFBQyxJQUFELEVBQUosSUFBYyxJQUFJLENBQUMsTUFBbkIsSUFBOEIsQ0FBSSxJQUFJLENBQUMsSUFBdkMsSUFBZ0QsQ0FBSSxJQUFJLENBQUMsUUFBNUQ7QUFDSSx1QkFBTyxHQURYO2FBSko7U0FBQSxhQUFBO1lBTU07WUFDSCxPQUFBLENBQUMsS0FBRCxDQUFPLEdBQVAsRUFQSDtTQUhKOztJQVlBLElBQUEsR0FBTztJQUVQLElBQUcsSUFBSSxDQUFDLE1BQUwsS0FBZSxLQUFsQjtRQUNJLElBQUEsR0FBTyxJQUFJLENBQUMsTUFBTCxDQUFZLElBQUksQ0FBQyxRQUFMLENBQWMsTUFBZCxDQUFaLEVBQW1DLElBQUksQ0FBQyxRQUFMLENBQWMsSUFBSSxDQUFDLElBQW5CLENBQW5DLEVBQTZELElBQUksQ0FBQyxRQUFMLENBQWMsT0FBZCxDQUE3RDtRQUVQLE1BQUEsR0FBUyxJQUFJLENBQUMsTUFBTCxHQUFjO1FBQ3ZCLE9BQUEsR0FBVSxLQUFBLENBQU0sSUFBTixFQUFZO1lBQUMsUUFBQSxNQUFEO1NBQVosRUFKZDtLQUFBLE1BQUE7UUFNSSxNQUFBLEdBQVMsSUFBSSxDQUFDO1FBQ2QsT0FBQSxHQUFVLEtBUGQ7O0lBU0EsSUFBRyxJQUFJLENBQUMsTUFBUjtRQUNJLElBQUksQ0FBQyxJQUFMLENBQVUsSUFBSSxDQUFDLFFBQUwsQ0FBYyxDQUFDLElBQUksQ0FBQyxLQUFMLEtBQVksS0FBWixJQUFzQixJQUFJLENBQUMsTUFBTCxLQUFhLElBQW5DLElBQTRDLE1BQTVDLElBQXNELEVBQXZELENBQUEsR0FBNkQsSUFBSSxDQUFDLE1BQWhGLENBQVYsRUFESjs7SUFHQSxJQUFHLElBQUksQ0FBQyxJQUFSO1FBQ0ksSUFBRyxJQUFJLENBQUMsS0FBTCxLQUFjLEtBQWpCO1lBQ0ksSUFBQSxHQUFPLElBQUksQ0FBQyxXQUFMLENBQWlCLElBQUksQ0FBQyxJQUF0QixFQURYO1NBQUEsTUFBQTtZQUdJLElBQUcsSUFBSSxDQUFDLElBQUwsWUFBcUIsS0FBeEI7Z0JBQ0ksSUFBQSxHQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBWSxDQUFBLENBQUEsRUFEakM7YUFBQSxNQUFBO2dCQUdJLElBQUEsR0FBTyxJQUFJLENBQUMsS0FIaEI7YUFISjs7UUFPQSxJQUFHLElBQUg7WUFDSSxJQUFBLEdBQU8sSUFBSSxDQUFDLE1BQUwsQ0FBWSxJQUFJLENBQUMsa0JBQUwsQ0FBd0IsT0FBeEIsQ0FBWixFQURYO1NBQUEsTUFBQTtZQUdJLElBQUksQ0FBQyxJQUFMLENBQVUsSUFBSSxDQUFDLFFBQUwsQ0FBYyxJQUFkLENBQVYsRUFISjtTQVJKOztJQWFBLElBQUcsSUFBSSxDQUFDLEtBQVI7UUFDSSxJQUFJLENBQUMsSUFBTCxDQUFVLElBQUksQ0FBQyxRQUFMLENBQWMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFMLEtBQWMsS0FBZixDQUFBLElBQTBCLENBQUMsSUFBQSxHQUFPLE1BQVIsQ0FBMUIsSUFBNkMsRUFBOUMsQ0FBQSxHQUFvRCxJQUFJLENBQUMsS0FBdkUsQ0FBVixFQURKOztJQUdBLElBQUcsQ0FBSSxJQUFJLENBQUMsTUFBWjtRQUNJLElBQUksQ0FBQyxJQUFMLENBQVUsSUFBSSxDQUFDLFFBQUwsQ0FBYyxJQUFBLEdBQUssSUFBSSxDQUFDLEdBQVYsR0FBYyxHQUE1QixDQUFWLEVBREo7O0lBR0EsSUFBRyxJQUFJLENBQUMsUUFBTCxJQUFrQixDQUFDLElBQUksQ0FBQyxNQUFMLEtBQWUsS0FBZixJQUF3QixJQUFJLENBQUMsSUFBTCxLQUFhLEtBQXRDLENBQXJCO1FBQ0ksSUFBb0MsQ0FBSSxJQUFJLENBQUMsTUFBN0M7WUFBQSxJQUFJLENBQUMsSUFBTCxDQUFVLElBQUksQ0FBQyxRQUFMLENBQWMsUUFBZCxDQUFWLEVBQUE7O1FBQ0EsSUFBRyxJQUFJLENBQUMsT0FBUjtZQUNJLElBQUEsR0FBTyxJQUFJLENBQUMsTUFBTCxDQUFZLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBZCxDQUFBLENBQXNCLENBQUMsa0JBQXZCLENBQTBDLE9BQTFDLENBQVosRUFEWDtTQUFBLE1BQUE7WUFHSSxJQUFBLEdBQU8sSUFBSSxDQUFDLE1BQUwsQ0FBWSxJQUFJLENBQUMsUUFBUSxDQUFDLGtCQUFkLENBQWlDLE9BQWpDLENBQVosRUFIWDtTQUZKOztBQU9BLFdBQU87QUEvRUs7O0FBdUZoQixPQUFBLEdBQVUsU0FBQyxJQUFEO0FBQVUsUUFBQTtnREFBZTtBQUF6Qjs7QUFFVixTQUFBLEdBQVksU0FBQyxHQUFEO0FBRVIsUUFBQTtJQUZTLHdDQUFHLE1BQUcsMENBQUcsTUFBRywwQ0FBRyxNQUFHLDRDQUFJO0lBRS9CLFNBQVMsQ0FBQyxPQUFPLENBQUMsT0FBbEIsR0FBNEIsSUFBSSxDQUFDLE9BQU8sQ0FBQztJQUN6QyxNQUFBLGlGQUF1QztJQUN2QyxHQUFBLEdBQU07SUFDTixJQUFHLE1BQUg7UUFDSSxPQUFtQixJQUFJLENBQUMsUUFBTCxDQUFjLE1BQWQsQ0FBcUIsQ0FBQyxLQUF0QixDQUE0QixHQUE1QixDQUFuQixFQUFDLGdCQUFELEVBQVM7UUFDVCxNQUFBLEdBQVUsTUFBQSxDQUFPLENBQUMsWUFBQSxDQUFhLE1BQWIsQ0FBRCxFQUF1QixHQUFBLENBQUksR0FBRyxDQUFDLElBQUosQ0FBQSxDQUFBLENBQUosQ0FBdkIsQ0FBdUMsQ0FBQyxJQUF4QyxDQUE2QyxHQUFBLENBQUksR0FBSixDQUE3QyxDQUFQLEVBRmQ7O0lBR0EsTUFBQSxHQUFZLENBQUMsT0FBQSxDQUFRLElBQVIsQ0FBRCxDQUFBLEdBQWUsSUFBZixHQUFtQixNQUFuQixHQUEyQixDQUFDLEdBQUEsQ0FBSSxJQUFBLENBQUssR0FBTCxDQUFKLENBQUQsQ0FBM0IsR0FBMEMsQ0FBQyxVQUFBLENBQVcsRUFBQSxHQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsVUFBNUIsR0FBdUMsQ0FBeEMsQ0FBYixDQUFELENBQTFDLEdBQW9HO0lBQ2hILElBQStDLElBQUssQ0FBQSxDQUFBLENBQXBEO1FBQUEsTUFBQSxJQUFVLEtBQUEsR0FBSyxDQUFDLElBQUEsQ0FBSyxXQUFBLENBQVksSUFBSyxDQUFBLENBQUEsQ0FBakIsQ0FBTCxDQUFELENBQUwsR0FBK0IsSUFBekM7O0lBQ0EsSUFBSSxLQUFKO1FBQ0ksTUFBQSxJQUFVLE9BRGQ7S0FBQSxNQUFBO1FBR0ksTUFBQSxJQUFVLEtBSGQ7O0lBSUEsU0FBUyxDQUFDLE9BQU8sQ0FBQyxPQUFsQixHQUE0QjtXQUM1QjtBQWZROztBQXVCWixVQUFBLEdBQWEsU0FBQyxPQUFEO0FBRVQsUUFBQTs7UUFBQTs7UUFBQSxVQUFXOztJQUVULFNBQVcsT0FBQSxDQUFRLFdBQVI7SUFFYixXQUFBLEdBQWM7SUFDZCxJQUFJLENBQUMsR0FBTCxDQUFTLFNBQUMsQ0FBRDtRQUFPLFdBQVksQ0FBQSxDQUFDLENBQUMsR0FBRixDQUFaLEdBQXFCLENBQUMsQ0FBQztRQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBUCxHQUFhLENBQUMsQ0FBQztlQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBUCxHQUFjLENBQUMsQ0FBQztJQUF4RSxDQUFUO0lBRUEsSUFBQSxHQUFVLE1BQUEsQ0FBTyxXQUFQLHVDQUFtQyxFQUFuQztJQUNWLE9BQUEsR0FBVSxNQUFBLENBQU87UUFBRSxJQUFBLEVBQU0sSUFBUjtLQUFQLEVBQXVCLE9BQXZCO1dBQ1Y7QUFYUzs7QUFhYixRQUFBLEdBQVcsU0FBQTtJQUVSLE9BQUEsQ0FBQyxHQUFELENBQU8sQ0FBQyxJQUFBLENBQUssUUFBTCxDQUFELENBQUEsR0FBZSxNQUFmLEdBQW9CLENBQUUsSUFBSSxDQUFDLEdBQUwsQ0FBUyxTQUFDLENBQUQ7QUFBTyxZQUFBO2VBQUEsTUFBQSxHQUFNLENBQUMsT0FBTyxDQUFDLEdBQVIsQ0FBWSxDQUFDLENBQUMsR0FBZCxDQUFELENBQU4sR0FBMEIsQ0FBQyxJQUFBLGdDQUFpQixDQUFDLENBQUMsR0FBSCxHQUFPLE1BQXZCLENBQUQ7SUFBakMsQ0FBVCxDQUEwRSxDQUFDLElBQTNFLENBQWdGLElBQWhGLENBQUYsQ0FBM0I7V0FBcUgsT0FBQSxDQUNwSCxHQURvSCxDQUNoSCw4QkFBQSxHQUE4QixDQUFDLElBQUEsQ0FBSywyQ0FBTCxDQUFELENBQTlCLEdBQWdGLElBRGdDO0FBRjdHOztBQUtYLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0lBQUUsTUFBQSxJQUFGO0lBQVEsWUFBQSxVQUFSO0lBQW9CLFVBQUEsUUFBcEI7SUFBOEIsZUFBQSxhQUE5QiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIFxuMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIFxuMDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIFxuMDAwIDAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIFxuMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIFxuIyMjXG5cbnBhdGggPSByZXF1aXJlICdwYXRoJ1xuXG5oZWxwZXJzID0gcmVxdWlyZSAnLi9oZWxwZXJzJ1xuaGVscGVycy5jb2xvcnMoKVxuXG5NRVRBID0gW1xuICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIFxuXG4gICAgZG9jOiDilrhkb2MgJ+KWuGRvYydcbiAgICAgICAgXG4gICAgICAgIFRoaXMgaXMgYSBzbGlnaHRseSBzcGVjaWFsIG1hY3JvLCBiZWNhdXNlIGl0J3MgZmlyc3QgcGFzcyBpcyBoYXJkY29kZWQgaW4gdGhlIHRva2VuaXplci5cbiAgICAgICAgVGhlIGJvZHkgb2YgdGhlIG1hY3JvIGlzIHdyYXBwZWQgaW4gYSBza2lubnkgdHJpcGxlIHN0cmluZyBiZWZvcmUgZnVydGhlciB0b2tlbml6YXRpb24uXG4gICAgICAgIEl0IGNhbiBjb250YWluIGFueXRoaW5nIGV4Y2VwdCBcXCdcXCdcXCcuXG4gICAgICAgIFxuICAgICAgICBJbiBub3JtYWwgb3BlcmF0aW9uLCBpdCBpcyByZWR1Y2VkIHRvIHRoZSBlbXB0eSBzdHJpbmcuIFxuICAgICAgICBCdXQgaWYgKiprb2ZmZWUqKiBpcyBjYWxsZWQgd2l0aCB0aGUgYC0tZG9jYCBhcmd1bWVudCwgbG9ncyB3aWxsIGJlIGluc2VydGVkIGluc3RlYWQuXG4gICAgICAgIFxuICAgICAgICBgYGBjb2ZmZWVzY3JpcHRcbiAgICAgICAg4pa4ZG9jICd0aXRsZSdcbiAgICAgICAgICAgIG15IGRvY3VtZW50YXRpb24gLi4uXG4gICAgICAgIGxvZyAnc29tZSBjb2RlJ1xuICAgICAgICDilrhkb2NcbiAgICAgICAgICAgIHdlIGFyZSBkb25lLlxuICAgICAgICBgYGBcbiAgICAgICAgXG4gICAgICAgIGBrb2ZmZWUgLS1kb2MgZmlsZWAgd2lsbCBvdXRwdXRcbiAgICAgICAgXG4gICAgICAgIGBgYG1hcmtkb3duXG4gICAgICAgICMjIHRpdGxlXG4gICAgICAgIG15IGRvY3VtZW50YXRpb24gLi4uXG4gICAgICAgIHNvbWUgY29kZVxuICAgICAgICB3ZSBhcmUgZG9uZS5cbiAgICAgICAgYGBgXG4gICAgICAgIFxuICAgICAgICBidXQgYGtvZmZlZSBmaWxlYCB3aWxsIG9ubHkgcHJpbnQgYHNvbWUgY29kZWBcbiAgICAgICAgXG4gICAga2V5OiAgJ+KWuGRvYydcbiAgICBkZXNjOiAn4pa4ZG9jIFtoZWFkZXJdIC4uLidcbiAgICBtZXRhOiAoYXJnczosbm9kZTosb3B0czopIC0+XG4gICAgICAgIGhlYWRlciA9IGFyZ3NbMF0gYW5kIFwiJyMjICN7YXJnc1swXX1cXFxcbicrXCIgb3IgXCInJytcIlxuICAgICAgICBiZWZvcmU6IG9wdHMuZG9jIGFuZCBcIiN7bWV0YUxvZyhvcHRzKX0oI3toZWFkZXJ9XCJcbiAgICAgICAgYWZ0ZXI6ICBcIilcIlxuICAgICAgICBza2lwOiAgIG5vdCBvcHRzLmRvYyBhbmQgd2l0aDpcIicnXCJcbiAgICAgICAgcmVkdWNlOiB0cnVlXG4gICAgICAgIGJvZHk6ICAgdHJ1ZVxuICAgICAgICBibG9jazogIGZhbHNlXG4sICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGtleTogICfilrhwcm9maWxlJyAgIFxuICAgIGRlc2M6ICfilrhwcm9maWxlIFtpZF0gLi4uJ1xuICAgIG1ldGE6IChhcmdzOixub2RlOixvcHRzOikgLT4gXG4gICAgICAgIFxuICAgICAgICBpZCA9IFwiI3tub2RlLmNvbmRpdGlvbi5sb2NhdGlvbkRhdGEuZmlyc3RfbGluZSsxfV8je25vZGUuY29uZGl0aW9uLmxvY2F0aW9uRGF0YS5maXJzdF9jb2x1bW59XCJcbiAgICAgICAgbmFtZSA9IGFyZ3NbMF0gPyBpZFxuICAgICAgICBjb2RlOiAgIFwia29mZmVlXyN7aWR9ID0gcHJvY2Vzcy5ocnRpbWUuYmlnaW50KClcIlxuICAgICAgICBhZnRlcjogIFwiI3ttZXRhTG9nKG9wdHMpfSgnI3tuYW1lfScsIChmdW5jdGlvbihiKXsgbGV0IGY9MTAwMG47IGZvciAobGV0IHUgb2YgWyducycsJ868cycsJ21zJywncyddKSB7IGlmICh1PT0ncycgfHwgYjxmKSB7IHJldHVybiAnJysoMTAwMG4qYi9mKSsnICcrdTsgfSBmKj0xMDAwbjsgfX0pKHByb2Nlc3MuaHJ0aW1lLmJpZ2ludCgpLWtvZmZlZV8je2lkfSkpO1wiXG4gICAgICAgIHJlZHVjZTogZmFsc2VcbiAgICAgICAgYm9keTogICB0cnVlXG4sXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGtleTogICfilrhhdmVyYWdlJyAgIFxuICAgIGRlc2M6ICfilrhhdmVyYWdlIG51bSAuLi4nXG4gICAgbWV0YTogKGFyZ3M6LG5vZGU6LG9wdHM6KSAtPiBcbiAgICAgICAgXG4gICAgICAgIGlkICA9IFwiI3tub2RlLmNvbmRpdGlvbi5sb2NhdGlvbkRhdGEuZmlyc3RfbGluZSsxfV8je25vZGUuY29uZGl0aW9uLmxvY2F0aW9uRGF0YS5maXJzdF9jb2x1bW59XCJcbiAgICAgICAgbnVtID0gYXJnc1swXSA/IDEwMFxuICAgICAgICBiZWZvcmU6ICBcIlwiXCJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAga29mZmVlXyN7aWR9ID0gMG47XG4gICAgICAgICAgICBmb3IoaSA9IDA7IGkgPCAje251bX07IGkrKykgXG4gICAgICAgICAgICB7IFxuICAgICAgICAgICAgICAgIGtvZmZlZV8je2lkfV9zdGFydCA9IHByb2Nlc3MuaHJ0aW1lLmJpZ2ludCgpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgYWZ0ZXI6IFwiXCJcIlxuICAgICAgICAgICAga29mZmVlXyN7aWR9ICs9IHByb2Nlc3MuaHJ0aW1lLmJpZ2ludCgpIC0ga29mZmVlXyN7aWR9X3N0YXJ0O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGtvZmZlZV8je2lkfSAvPSAje251bX1uO1xuICAgICAgICAgICAgI3ttZXRhTG9nKG9wdHMpfSgnI3tpZH0nLCAoZnVuY3Rpb24oYil7IGxldCBmPTEwMDBuOyBmb3IgKGxldCB1IG9mIFsnbnMnLCfOvHMnLCdtcycsJ3MnXSkgeyBpZiAodT09J3MnIHx8IGI8ZikgeyByZXR1cm4gJycrKDEwMDBuKmIvZikrJyAnK3U7IH0gZio9MTAwMG47IH19KShrb2ZmZWVfI3tpZH0pKTsgXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgcmVkdWNlOiB0cnVlXG4gICAgICAgIGJvZHk6ICAgdHJ1ZVxuLFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBrZXk6ICAn4pa4c3RhcnQnICAgXG4gICAgZGVzYzogJ+KWuHN0YXJ0IGlkIC4uLidcbiAgICBpbmZvOlxuICAgICAgICB0aGVuOiB0cnVlXG4gICAgICAgIGFyZ3M6IDFcbiAgICBtZXRhOiAoYXJnczopIC0+IFxuICAgICAgICBpZCA9IGFyZ3NbMF0gPyAnc3RhcnRfZW5kJ1xuICAgICAgICBiZWZvcmU6IFwia29mZmVlXyN7aWR9ID0gcHJvY2Vzcy5ocnRpbWUuYmlnaW50KClcIlxuICAgICAgICByZWR1Y2U6IHRydWVcbiAgICAgICAgYm9keTogICBmYWxzZVxuLFxuICAgIGtleTogICfilrhlbmQnICAgICBcbiAgICBkZXNjOiAn4pa4ZW5kIGlkIC4uLidcbiAgICBpbmZvOlxuICAgICAgICB0aGVuOiB0cnVlXG4gICAgICAgIGFyZ3M6IDFcbiAgICBtZXRhOiAoYXJnczosb3B0czopIC0+IFxuICAgICAgICBpZCA9IGFyZ3NbMF0gPyAnc3RhcnRfZW5kJ1xuICAgICAgICBiZWZvcmU6IFwiI3ttZXRhTG9nKG9wdHMpfSgnI3tpZH0nLCAoZnVuY3Rpb24oYil7IGxldCBmPTEwMDBuOyBmb3IgKGxldCB1IG9mIFsnbnMnLCfOvHMnLCdtcycsJ3MnXSkgeyBpZiAodT09J3MnIHx8IGI8ZikgeyByZXR1cm4gJycrKDEwMDBuKmIvZikrJyAnK3U7IH0gZio9MTAwMG47IH19KShwcm9jZXNzLmhydGltZS5iaWdpbnQoKS1rb2ZmZWVfI3tpZH0pKTtcIlxuICAgICAgICByZWR1Y2U6IHRydWVcbiAgICAgICAgYm9keTogICBmYWxzZVxuLCAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGtleTogICfilrhkYmcnICAgIFxuICAgIGRlc2M6ICfilrhkYmcgW21zZ10gLi4uJ1xuICAgIGluZm86XG4gICAgICAgIHRoZW46IHRydWUgIyBzaG91bGQgbm90IGJlIHVzZWQgd2l0aCBhIGJsb2NrXG4gICAgICAgIGFyZ3M6IDFcbiAgICBtZXRhOiAob3B0czosYXJnczosbm9kZTopIC0+XG4gICAgICAgIGJlZm9yZTogbG9nU291cmNlIHtvcHRzLCBhcmdzLCBub2RlfVxuICAgICAgICBhZnRlcjogICcpJ1xuICAgICAgICByZWR1Y2U6IHRydWVcbiAgICAgICAgYm9keTogICB0cnVlXG4gICAgICAgIGJsb2NrOiAgZmFsc2VcbiwgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBrZXk6ICAn4pa4YXNzZXJ0JyAgICBcbiAgICBkZXNjOiAn4pa4YXNzZXJ0IFttc2ddIC4uLidcbiAgICBtZXRhOiAob3B0czosYXJnczosbm9kZTopIC0+XG4gICAgICAgIFxuICAgICAgICB7IEJsb2NrLCBleHRlbmQgfSA9IHJlcXVpcmUgJy4vbm9kZXMnXG4gICAgICAgIGlmIG5vZGUuYm9keSBpbnN0YW5jZW9mIEJsb2NrXG4gICAgICAgICAgICBib2R5ID0gbm9kZS5ib2R5LmV4cHJlc3Npb25zWzBdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGJvZHkgPSBub2RlLmJvZHlcbiAgICAgICAgICAgIFxuICAgICAgICBmcmFnID0gYm9keS5jb21waWxlVG9GcmFnbWVudHMgb3B0c1xuICAgICAgICB0ZXh0ID0gbm9kZS5mcmFnbWVudHNUb1RleHQgZnJhZ1xuICAgICAgICBhcmdzID0gWydhc3NlcnRpb24gZmFpbHVyZSEnXSBpZiBub3QgYXJncy5sZW5ndGhcbiAgICAgICAgYmVmb3JlOiBsb2dTb3VyY2Uge29wdHMsIGFyZ3MsIG5vZGUsIGNsb3NlOnRydWV9XG4gICAgICAgIGFmdGVyOiAgJ3Byb2Nlc3MuZXhpdCg2NjYpOydcbiAgICAgICAgdGhlbjogICB0cnVlICMgc2hvdWxkIG5vdCBiZSB1c2VkIHdpdGggYSBibG9ja1xuICAgICAgICBldmFsOiAgIGZhbHNlXG4gICAgICAgIHJlZHVjZTogZmFsc2VcbiAgICAgICAgY29kZTogICBcIiEoI3t0ZXh0fSlcIlxuLCAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgICAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgXG4gICAga2V5OiAgJ+KWuHRlc3QnXG4gICAgZGVzYzogJ+KWuHRlc3QgW2lkXSAuLi4nXG4gICAgbWV0YTogKG9wdHM6LGFyZ3M6LG5vZGU6KSAtPlxuICAgICAgICBiZWZvcmUgID0gbG9nU291cmNlIHtvcHRzLCBhcmdzLCBub2RlLCBjbG9zZTp0cnVlfVxuICAgICAgICBiZWZvcmUgKz0gJ1xcbiAgICB0cnkge1xcbidcbiAgICAgICAgZGVkZW50OiB0cnVlXG4gICAgICAgIGJlZm9yZTogb3B0cy50ZXN0IGFuZCBiZWZvcmVcbiAgICAgICAgYWZ0ZXI6ICBvcHRzLnRlc3QgYW5kIFwifSBjYXRjaChlcnIpIHsgI3ttZXRhTG9nKG9wdHMpfShlcnIubWVzc2FnZSk7IH1cXG5cIlxuICAgICAgICBza2lwOiAgIG5vdCBvcHRzLnRlc3RcbiAgICAgICAgcmVkdWNlOiB0cnVlXG4gICAgICAgIGJvZHk6ICAgdHJ1ZVxuLCAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBrZXk6ICfilrhyYW5kJyAgICBcbiAgICBtZXRhOiAoYXJnczopIC0+IFxuICAgICAgICBjb2RlOiAgIFwiTWF0aC5yYW5kb20oKSA8ICN7YXJncz9bMF0gPyAwLjV9XCIgXG4gICAgICAgIHJlZHVjZTogZmFsc2UgXG4gICAgICAgIGJvZHk6ICAgdHJ1ZSAgIFxuICAgIFxuICAgICMga2V5OiAndG9rZW4nICdwYXJzZScgJ2NvZGUnXG5dXG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG5cblRBQiA9ICcgICAgJ1xuXG5jb21waWxlTWV0YUlmID0gKG5vZGU6LG9wdHM6KSAtPlxuXG4gICAgeyBCbG9jaywgQXNzaWduLCBWYWx1ZSwgTGl0ZXJhbCB9ID0gcmVxdWlyZSAnLi9ub2RlcydcbiAgICB7IGV4dGVuZCwgbWVyZ2UgfSA9IHJlcXVpcmUgJy4vaGVscGVycydcbiAgICAgICAgXG4gICAgaW5mbyA9IHJlZHVjZTp0cnVlLCBldmFsOnRydWVcbiAgICBcbiAgICBpZiBub2RlLmNvbmRpdGlvbi5iYXNlPy52YWx1ZT8uc3RhcnRzV2l0aCAn4pa4J1xuICAgICAgICBcbiAgICAgICAgbWV0YUtleSA9IG5vZGUuY29uZGl0aW9uLmJhc2UudmFsdWVcbiAgICAgICAgaWYgdHlwZW9mIG9wdHMubWV0YVttZXRhS2V5XSA9PSAnZnVuY3Rpb24nXG4gICAgICAgICAgICBpbmZvID0gb3B0cy5tZXRhW21ldGFLZXldIHtvcHRzLCBub2RlLCBhcmdzOltdfVxuICAgICAgICAgICAgXG4gICAgaWYgbm9kZS5jb25kaXRpb24udmFyaWFibGU/LmJhc2U/LnZhbHVlPy5zdGFydHNXaXRoICfilrgnXG4gICAgICAgIFxuICAgICAgICBtZXRhS2V5ID0gbm9kZS5jb25kaXRpb24udmFyaWFibGUuYmFzZS52YWx1ZVxuICAgICAgICBpZiB0eXBlb2Ygb3B0cy5tZXRhW21ldGFLZXldID09ICdmdW5jdGlvbidcbiAgICAgICAgICAgIGFyZ3MgPSBub2RlLmNvbmRpdGlvbi5hcmdzLm1hcCAoYSkgLT4gXG4gICAgICAgICAgICAgICAgYS5iYXNlPy52YWx1ZVxuICAgICAgICAgICAgYXJncyA9IGFyZ3MubWFwIChhKSAtPiBpZiBhWzBdIGluIFsnXCInLCBcIidcIl0gdGhlbiBhWzEuLi0yXSBlbHNlIGFcbiAgICAgICAgICAgIGluZm8gPSBvcHRzLm1ldGFbbWV0YUtleV0ge29wdHMsIG5vZGUsIGFyZ3N9XG4gICAgICAgIFxuICAgIGlmIGluZm8uc2tpcCBcbiAgICAgICAgaWYgaW5mby5za2lwLndpdGg/XG4gICAgICAgICAgICByZXR1cm4gbm9kZS5tYWtlQ29kZSBpbmZvLnNraXAud2l0aFxuICAgICAgICByZXR1cm4gW11cbiAgICBcbiAgICBpZiBpbmZvLmV2YWxcbiAgICAgICAgXG4gICAgICAgIGNvbmQgPSBpbmZvLmNvZGUgPyBub2RlLmZyYWdtZW50c1RvVGV4dCBub2RlLmNvbmRpdGlvbi5jb21waWxlVG9GcmFnbWVudHMgb3B0cywgMiAjTEVWRUxfUEFSRU5cbiAgICAgICAgdHJ5XG4gICAgICAgICAgICBvcyA9IHJlcXVpcmUgJ29zJ1xuICAgICAgICAgICAgZnMgPSByZXF1aXJlICdmcydcbiAgICAgICAgICAgIGluZm8uYm9keSA9ISEgZXZhbCBjb25kXG4gICAgICAgICAgICBpZiBpbmZvLmV2YWwgYW5kIGluZm8ucmVkdWNlIGFuZCBub3QgaW5mby5ib2R5IGFuZCBub3Qgbm9kZS5lbHNlQm9keVxuICAgICAgICAgICAgICAgIHJldHVybiBbXVxuICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgIGVycm9yIGVyclxuICAgICAgICBcbiAgICBmcmFnID0gW11cbiAgICBcbiAgICBpZiBpbmZvLnJlZHVjZSA9PSBmYWxzZVxuICAgICAgICBmcmFnID0gZnJhZy5jb25jYXQgbm9kZS5tYWtlQ29kZShcImlmIChcIiksIG5vZGUubWFrZUNvZGUoaW5mby5jb2RlKSwgbm9kZS5tYWtlQ29kZShcIikge1xcblwiKVxuICAgICAgICBcbiAgICAgICAgaW5kZW50ID0gb3B0cy5pbmRlbnQgKyBUQUJcbiAgICAgICAgYm9keU9wdCA9IG1lcmdlIG9wdHMsIHtpbmRlbnR9XG4gICAgZWxzZVxuICAgICAgICBpbmRlbnQgPSBvcHRzLmluZGVudFxuICAgICAgICBib2R5T3B0ID0gb3B0c1xuXG4gICAgaWYgaW5mby5iZWZvcmVcbiAgICAgICAgZnJhZy5wdXNoIG5vZGUubWFrZUNvZGUgKGluZm8uYmxvY2shPWZhbHNlIGFuZCBpbmZvLmRlZGVudCE9dHJ1ZSBhbmQgaW5kZW50IG9yICcnKSArIGluZm8uYmVmb3JlXG4gICAgICAgIFxuICAgIGlmIGluZm8uYm9keVxuICAgICAgICBpZiBpbmZvLmJsb2NrICE9IGZhbHNlXG4gICAgICAgICAgICBib2R5ID0gbm9kZS5lbnN1cmVCbG9jayBub2RlLmJvZHlcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgbm9kZS5ib2R5IGluc3RhbmNlb2YgQmxvY2tcbiAgICAgICAgICAgICAgICBib2R5ID0gbm9kZS5ib2R5LmV4cHJlc3Npb25zWzBdXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgYm9keSA9IG5vZGUuYm9keVxuICAgICAgICBpZiBib2R5XG4gICAgICAgICAgICBmcmFnID0gZnJhZy5jb25jYXQgYm9keS5jb21waWxlVG9GcmFnbWVudHMgYm9keU9wdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBmcmFnLnB1c2ggbm9kZS5tYWtlQ29kZSBcIicnXCIgIyBpZiBpbmZvLmJsb2NrID09IGZhbHNlID8/P1xuICAgICAgICBcbiAgICBpZiBpbmZvLmFmdGVyXG4gICAgICAgIGZyYWcucHVzaCBub2RlLm1ha2VDb2RlICgoaW5mby5ibG9jayAhPSBmYWxzZSkgYW5kICgnXFxuJyArIGluZGVudCkgb3IgJycpICsgaW5mby5hZnRlclxuXG4gICAgaWYgbm90IGluZm8ucmVkdWNlXG4gICAgICAgIGZyYWcucHVzaCBub2RlLm1ha2VDb2RlKFwiXFxuI3tub2RlLnRhYn19XCIpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgIGlmIG5vZGUuZWxzZUJvZHkgYW5kIChpbmZvLnJlZHVjZSA9PSBmYWxzZSBvciBpbmZvLmJvZHkgPT0gZmFsc2UpXG4gICAgICAgIGZyYWcucHVzaCBub2RlLm1ha2VDb2RlICcgZWxzZSAnIGlmIG5vdCBpbmZvLnJlZHVjZVxuICAgICAgICBpZiBub2RlLmlzQ2hhaW5cbiAgICAgICAgICAgIGZyYWcgPSBmcmFnLmNvbmNhdCBub2RlLmVsc2VCb2R5LnVud3JhcCgpLmNvbXBpbGVUb0ZyYWdtZW50cyBib2R5T3B0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGZyYWcgPSBmcmFnLmNvbmNhdCBub2RlLmVsc2VCb2R5LmNvbXBpbGVUb0ZyYWdtZW50cyBib2R5T3B0XG4gICAgICAgIFxuICAgIHJldHVybiBmcmFnXG4gICAgXG4jIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgICAwMDAwMDAwICAgXG4jIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuXG5tZXRhTG9nID0gKG9wdHMpIC0+IG9wdHMubWV0YWxvZyA/ICdjb25zb2xlLmxvZydcblxubG9nU291cmNlID0gKG9wdHM6LGFyZ3M6LG5vZGU6LGNsb3NlOikgLT5cbiAgICBcbiAgICBjb2xvcmV0dGUub3B0aW9ucy5lbmFibGVkID0gb3B0cy5mZWF0dXJlLmNvbG9yXG4gICAgc291cmNlID0gb3B0cy5zb3VyY2UgPyBvcHRzLmZpbGVuYW1lID8gJydcbiAgICBleHQgPSAnJ1xuICAgIGlmIHNvdXJjZVxuICAgICAgICBbc291cmNlLCBleHQuLi5dID0gcGF0aC5iYXNlbmFtZShzb3VyY2UpLnNwbGl0ICcuJ1xuICAgICAgICBzb3VyY2UgID0geWVsbG93IFt5ZWxsb3dCcmlnaHQoc291cmNlKSwgZGltIGV4dC5qb2luJy4nXS5qb2luIGRpbSAnLidcbiAgICBiZWZvcmUgID0gXCIje21ldGFMb2cob3B0cyl9KCcje3NvdXJjZX0je2RpbSBibHVlICc6J30je2JsdWVCcmlnaHQgXCIje25vZGUuY29uZGl0aW9uLmxvY2F0aW9uRGF0YS5maXJzdF9saW5lKzF9XCJ9J1wiXG4gICAgYmVmb3JlICs9IFwiLCAnI3tib2xkIHdoaXRlQnJpZ2h0IGFyZ3NbMF19J1wiIGlmIGFyZ3NbMF0gXG4gICAgaWYgKGNsb3NlKVxuICAgICAgICBiZWZvcmUgKz0gJyk7XFxuJ1xuICAgIGVsc2VcbiAgICAgICAgYmVmb3JlICs9IFwiLCBcIlxuICAgIGNvbG9yZXR0ZS5vcHRpb25zLmVuYWJsZWQgPSB0cnVlXG4gICAgYmVmb3JlXG4gICAgICAgIFxuIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4jIDAwMCAgMDAwMCAgMDAwICAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiMgMDAwICAwMDAgMCAwMDAgICAgICAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4jIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICBcblxuaW5qZWN0TWV0YSA9IChvcHRpb25zKSAtPiAjIG1ha2Ugc3VyZSB0aGF0IG9wdGlvbnMgaGFzIGEgbWV0YSBzZXRcbiAgICBcbiAgICBvcHRpb25zID89IHt9XG4gICAgXG4gICAgeyBleHRlbmQgfSA9IHJlcXVpcmUgJy4vaGVscGVycydcbiAgICBcbiAgICBkZWZhdWx0TWV0YSA9IHt9XG4gICAgTUVUQS5tYXAgKG0pIC0+IGRlZmF1bHRNZXRhW20ua2V5XSA9IG0ubWV0YTsgbS5tZXRhLmtleSA9IG0ua2V5OyBtLm1ldGEuaW5mbyA9IG0uaW5mb1xuICAgIFxuICAgIG1ldGEgICAgPSBleHRlbmQgZGVmYXVsdE1ldGEsIG9wdGlvbnMubWV0YSA/IHt9XG4gICAgb3B0aW9ucyA9IGV4dGVuZCB7IG1ldGE6IG1ldGEgfSwgb3B0aW9uc1xuICAgIG9wdGlvbnNcblxubG9nTWV0YXMgPSAtPlxuICAgIFxuICAgIGxvZyBcIiN7Z3JheSAnTWV0YXM6J31cXG5cXG4jeyBNRVRBLm1hcCgoZikgLT4gXCIgICAgI3toZWxwZXJzLnBhZCBmLmtleX0je2dyYXkgZi5kZXNjID8gXCIje2Yua2V5fSAuLi5cIn1cIikuam9pbignXFxuJykgfVwiXG4gICAgbG9nIFwiICAgIOKWuGlmICAgICAgICAgICAgICAgICAgICAgI3tncmF5ICfilrhpZiBjb25kIC4uLiBbW+KWuGVsaWYgY29uZCAuLi5dIOKWuGVsc2UgLi4uXSd9XFxuXCJcbiAgICBcbm1vZHVsZS5leHBvcnRzID0geyBNRVRBLCBpbmplY3RNZXRhLCBsb2dNZXRhcywgY29tcGlsZU1ldGFJZiB9XG4iXX0=
//# sourceURL=../coffee/meta.coffee