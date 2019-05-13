// koffee 0.30.0

/*
00     00  00000000  000000000   0000000   
000   000  000          000     000   000  
000000000  0000000      000     000000000  
000 0 000  000          000     000   000  
000   000  00000000     000     000   000
 */
var META, TAB, compileMetaIf, helpers, injectMeta, logMetas, logSource, path,
    slice = [].slice;

path = require('path');

helpers = require('./helpers');

helpers.colors();

META = [
    {
        key: '▸doc',
        desc: '▸doc [header] ...',
        meta: function(arg) {
            var args, header, node, opts, ref, ref1, ref2;
            args = (ref = arg.args) != null ? ref : null, node = (ref1 = arg.node) != null ? ref1 : null, opts = (ref2 = arg.opts) != null ? ref2 : null;
            header = args[0] && ("'## " + args[0] + "\\n'+") || "''+";
            return {
                before: opts.doc && ("console.log(" + header),
                after: ");",
                skip: !opts.doc,
                reduce: true,
                body: true,
                block: false
            };
        }
    }, {
        key: '▸profile',
        desc: '▸profile [id] ...',
        meta: function(arg) {
            var args, id, name, node, ref, ref1, ref2;
            args = (ref = arg.args) != null ? ref : null, node = (ref1 = arg.node) != null ? ref1 : null;
            id = (node.condition.locationData.first_line + 1) + "_" + node.condition.locationData.first_column;
            name = (ref2 = args[0]) != null ? ref2 : id;
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
            var args, id, ref, ref1;
            args = (ref = arg.args) != null ? ref : null;
            id = (ref1 = args[0]) != null ? ref1 : 'start_end';
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
            var args, id, ref, ref1;
            args = (ref = arg.args) != null ? ref : null;
            id = (ref1 = args[0]) != null ? ref1 : 'start_end';
            return {
                before: "console.log('" + id + "', require('pretty-time')(process.hrtime(koffee_" + id + ")))",
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
        desc: '▸assert [msg] ...',
        meta: function(arg) {
            var Block, args, body, code, frag, node, opts, ref, ref1, ref2, text;
            opts = (ref = arg.opts) != null ? ref : null, args = (ref1 = arg.args) != null ? ref1 : null, node = (ref2 = arg.node) != null ? ref2 : null;
            Block = require('./nodes').Block;
            if (node.body instanceof Block) {
                body = node.body.expressions[0];
            } else {
                body = node.body;
            }
            frag = body.compileToFragments(opts);
            text = node.fragmentsToText(frag);
            code = "!(" + text + ")";
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
                then: true,
                "eval": false,
                reduce: false,
                code: code
            };
        }
    }, {
        key: '▸test',
        desc: '▸test [id] ...',
        meta: function(arg) {
            var args, node, opts, ref, ref1, ref2;
            opts = (ref = arg.opts) != null ? ref : null, args = (ref1 = arg.args) != null ? ref1 : null, node = (ref2 = arg.node) != null ? ref2 : null;
            return {
                dedent: true,
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
    before = "console.log('" + source + (dim(blue(':'))) + (blueBright("" + (node.condition.locationData.first_line + 1))) + "'";
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsd0VBQUE7SUFBQTs7QUFRQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0FBRVAsT0FBQSxHQUFVLE9BQUEsQ0FBUSxXQUFSOztBQUNWLE9BQU8sQ0FBQyxNQUFSLENBQUE7O0FBRUEsSUFBQSxHQUFPO0lBUUg7UUFBQSxHQUFBLEVBQU0sTUFBTjtRQUNBLElBQUEsRUFBTSxtQkFETjtRQUVBLElBQUEsRUFBTSxTQUFDLEdBQUQ7QUFDRixnQkFBQTtZQURHLHdDQUFHLE1BQUcsMENBQUcsTUFBRywwQ0FBRztZQUNsQixNQUFBLEdBQVMsSUFBSyxDQUFBLENBQUEsQ0FBTCxJQUFZLENBQUEsTUFBQSxHQUFPLElBQUssQ0FBQSxDQUFBLENBQVosR0FBZSxPQUFmLENBQVosSUFBcUM7bUJBQzlDO2dCQUFBLE1BQUEsRUFBUSxJQUFJLENBQUMsR0FBTCxJQUFhLENBQUEsY0FBQSxHQUFlLE1BQWYsQ0FBckI7Z0JBQ0EsS0FBQSxFQUFRLElBRFI7Z0JBRUEsSUFBQSxFQUFRLENBQUksSUFBSSxDQUFDLEdBRmpCO2dCQUdBLE1BQUEsRUFBUSxJQUhSO2dCQUlBLElBQUEsRUFBUSxJQUpSO2dCQUtBLEtBQUEsRUFBUSxLQUxSOztRQUZFLENBRk47S0FSRyxFQXlCSDtRQUFBLEdBQUEsRUFBTSxVQUFOO1FBQ0EsSUFBQSxFQUFNLG1CQUROO1FBRUEsSUFBQSxFQUFNLFNBQUMsR0FBRDtBQUVGLGdCQUFBO1lBRkcsd0NBQUcsTUFBRywwQ0FBRztZQUVaLEVBQUEsR0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLFVBQTVCLEdBQXVDLENBQXhDLENBQUEsR0FBMEMsR0FBMUMsR0FBNkMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUM7WUFDaEYsSUFBQSxxQ0FBaUI7bUJBQ2pCO2dCQUFBLEtB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QyxJQUFBLGdDQUFpQixDQUFDLENBQUMsR0FBSCxHQUFPLE1BQXZCLENBQUQ7SUFBakMsQ0FBVCxDQUEwRSxDQUFDLElBQTNFLENBQWdGLElBQWhGLENBQUYsQ0FBM0I7V0FBcUgsT0FBQSxDQUNwSCxHQURvSCxDQUNoSCw4QkFBQSxHQUE4QixDQUFDLElBQUEsQ0FBSywyQ0FBTCxDQUFELENBQTlCLEdBQWdGLElBRGdDO0FBRjdHOztBQUtYLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0lBQUUsTUFBQSxJQUFGO0lBQVEsWUFBQSxVQUFSO0lBQW9CLFVBQUEsUUFBcEI7SUFBOEIsZUFBQSxhQUE5QiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIFxuMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIFxuMDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIFxuMDAwIDAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIFxuMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIFxuIyMjXG5cbnBhdGggPSByZXF1aXJlICdwYXRoJ1xuXG5oZWxwZXJzID0gcmVxdWlyZSAnLi9oZWxwZXJzJ1xuaGVscGVycy5jb2xvcnMoKVxuXG5NRVRBID0gW1xuXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAwMCAgICAwMDAwMDAwICBcbiAgICBcbiAgICBrZXk6ICAn4pa4ZG9jJ1xuICAgIGRlc2M6ICfilrhkb2MgW2hlYWRlcl0gLi4uJ1xuICAgIG1ldGE6IChhcmdzOixub2RlOixvcHRzOikgLT5cbiAgICAgICAgaGVhZGVyID0gYXJnc1swXSBhbmQgXCInIyMgI3thcmdzWzBdfVxcXFxuJytcIiBvciBcIicnK1wiXG4gICAgICAgIGJlZm9yZTogb3B0cy5kb2MgYW5kIFwiY29uc29sZS5sb2coI3toZWFkZXJ9XCJcbiAgICAgICAgYWZ0ZXI6ICBcIik7XCJcbiAgICAgICAgc2tpcDogICBub3Qgb3B0cy5kb2NcbiAgICAgICAgcmVkdWNlOiB0cnVlXG4gICAgICAgIGJvZHk6ICAgdHJ1ZVxuICAgICAgICBibG9jazogIGZhbHNlXG4sICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGtleTogICfilrhwcm9maWxlJyAgIFxuICAgIGRlc2M6ICfilrhwcm9maWxlIFtpZF0gLi4uJ1xuICAgIG1ldGE6IChhcmdzOixub2RlOikgLT4gXG4gICAgICAgIFxuICAgICAgICBpZCA9IFwiI3tub2RlLmNvbmRpdGlvbi5sb2NhdGlvbkRhdGEuZmlyc3RfbGluZSsxfV8je25vZGUuY29uZGl0aW9uLmxvY2F0aW9uRGF0YS5maXJzdF9jb2x1bW59XCJcbiAgICAgICAgbmFtZSA9IGFyZ3NbMF0gPyBpZFxuICAgICAgICBhZnRlcjogIFwiY29uc29sZS5sb2coJyN7bmFtZX0nLCByZXF1aXJlKCdwcmV0dHktdGltZScpKHByb2Nlc3MuaHJ0aW1lKGtvZmZlZV8je2lkfSkpKTtcIlxuICAgICAgICBjb2RlOiAgIFwia29mZmVlXyN7aWR9ID0gcHJvY2Vzcy5ocnRpbWUoKVwiXG4gICAgICAgIHJlZHVjZTogZmFsc2VcbiAgICAgICAgYm9keTogICB0cnVlXG4sXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIGtleTogICfilrhzdGFydCcgICBcbiAgICBkZXNjOiAn4pa4c3RhcnQgaWQgLi4uJ1xuICAgIGluZm86XG4gICAgICAgIHRoZW46IHRydWVcbiAgICAgICAgYXJnczogMVxuICAgIG1ldGE6IChhcmdzOikgLT4gXG4gICAgICAgIGlkID0gYXJnc1swXSA/ICdzdGFydF9lbmQnXG4gICAgICAgIGJlZm9yZTogXCJrb2ZmZWVfI3tpZH0gPSBwcm9jZXNzLmhydGltZSgpXCJcbiAgICAgICAgcmVkdWNlOiB0cnVlXG4gICAgICAgIGJvZHk6ICAgZmFsc2VcbixcbiAgICBrZXk6ICAn4pa4ZW5kJyAgICAgXG4gICAgZGVzYzogJ+KWuGVuZCBpZCAuLi4nXG4gICAgaW5mbzpcbiAgICAgICAgdGhlbjogdHJ1ZVxuICAgICAgICBhcmdzOiAxXG4gICAgbWV0YTogKGFyZ3M6KSAtPiBcbiAgICAgICAgaWQgPSBhcmdzWzBdID8gJ3N0YXJ0X2VuZCdcbiAgICAgICAgYmVmb3JlOiBcImNvbnNvbGUubG9nKCcje2lkfScsIHJlcXVpcmUoJ3ByZXR0eS10aW1lJykocHJvY2Vzcy5ocnRpbWUoa29mZmVlXyN7aWR9KSkpXCJcbiAgICAgICAgcmVkdWNlOiB0cnVlXG4gICAgICAgIGJvZHk6ICAgZmFsc2VcbiwgICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBrZXk6ICAn4pa4ZGJnJyAgICBcbiAgICBkZXNjOiAn4pa4ZGJnIFttc2ddIC4uLidcbiAgICBpbmZvOlxuICAgICAgICB0aGVuOiB0cnVlICMgc2hvdWxkIG5vdCBiZSB1c2VkIHdpdGggYSBibG9ja1xuICAgICAgICBhcmdzOiAxXG4gICAgbWV0YTogKG9wdHM6LGFyZ3M6LG5vZGU6KSAtPlxuICAgICAgICBjb2RlOiAgIFwidHJ1ZVwiXG4gICAgICAgIGV2YWw6ICAgdHJ1ZVxuICAgICAgICBiZWZvcmU6IGxvZ1NvdXJjZSBvcHRzOm9wdHMsIGFyZ3M6YXJncywgbm9kZTpub2RlXG4gICAgICAgIGFmdGVyOiAgXCIpXCJcbiAgICAgICAgcmVkdWNlOiB0cnVlXG4gICAgICAgIGJsb2NrOiAgZmFsc2VcbiwgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBrZXk6ICAn4pa4YXNzZXJ0JyAgICBcbiAgICBkZXNjOiAn4pa4YXNzZXJ0IFttc2ddIC4uLidcbiAgICBtZXRhOiAob3B0czosYXJnczosbm9kZTopIC0+XG4gICAgICAgIFxuICAgICAgICB7IEJsb2NrIH0gPSByZXF1aXJlICcuL25vZGVzJyBcbiAgICAgICAgaWYgbm9kZS5ib2R5IGluc3RhbmNlb2YgQmxvY2tcbiAgICAgICAgICAgIGJvZHkgPSBub2RlLmJvZHkuZXhwcmVzc2lvbnNbMF1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgYm9keSA9IG5vZGUuYm9keVxuICAgICAgICAgICAgXG4gICAgICAgIGZyYWcgPSBib2R5LmNvbXBpbGVUb0ZyYWdtZW50cyBvcHRzXG4gICAgICAgIHRleHQgPSBub2RlLmZyYWdtZW50c1RvVGV4dCBmcmFnXG4gICAgICAgIGNvZGUgPSBcIiEoI3t0ZXh0fSlcIlxuICAgICAgICBhcmdzID0gWydhc3NlcnRpb24gZmFpbHVyZSEnXSBpZiBub3QgYXJncy5sZW5ndGhcbiAgICAgICAgYmVmb3JlOiBsb2dTb3VyY2Ugb3B0czpvcHRzLCBhcmdzOmFyZ3MsIG5vZGU6bm9kZSwgY2xvc2U6dHJ1ZVxuICAgICAgICB0aGVuOiAgIHRydWUgIyBzaG91bGQgbm90IGJlIHVzZWQgd2l0aCBhIGJsb2NrXG4gICAgICAgIGV2YWw6ICAgZmFsc2VcbiAgICAgICAgcmVkdWNlOiBmYWxzZVxuICAgICAgICAjIGJsb2NrOiAgZmFsc2VcbiAgICAgICAgY29kZTogICBjb2RlICAgICAgICAgICAgXG4sICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAgICAgICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICBcbiAgICBrZXk6ICAn4pa4dGVzdCdcbiAgICBkZXNjOiAn4pa4dGVzdCBbaWRdIC4uLidcbiAgICBtZXRhOiAob3B0czosYXJnczosbm9kZTopIC0+XG4gICAgICAgIGRlZGVudDogdHJ1ZVxuICAgICAgICBiZWZvcmU6IG9wdHMudGVzdCBhbmQgbG9nU291cmNlIG9wdHM6b3B0cywgYXJnczphcmdzLCBub2RlOm5vZGUsIGNsb3NlOnRydWVcbiAgICAgICAgc2tpcDogICBub3Qgb3B0cy50ZXN0XG4gICAgICAgIHJlZHVjZTogdHJ1ZVxuICAgICAgICBib2R5OiAgIHRydWVcbiwgICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAga2V5OiAn4pa4cmFuZCcgICAgXG4gICAgbWV0YTogKGFyZ3M6KSAtPiBcbiAgICAgICAgY29kZTogICBcIk1hdGgucmFuZG9tKCkgPCAje2FyZ3M/WzBdID8gMC41fVwiIFxuICAgICAgICByZWR1Y2U6IGZhbHNlIFxuICAgICAgICBib2R5OiAgIHRydWUgICBcbiAgICBcbiAgICAjIGtleTogJ3Rva2VuJyAncGFyc2UnICdjb2RlJ1xuXVxuXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuXG5UQUIgPSAnICAgICdcblxuY29tcGlsZU1ldGFJZiA9IChub2RlOixvcHRzOikgLT5cblxuICAgIHsgQmxvY2ssIEFzc2lnbiwgVmFsdWUsIExpdGVyYWwgfSA9IHJlcXVpcmUgJy4vbm9kZXMnXG4gICAgeyBtZXJnZSB9ID0gcmVxdWlyZSAnLi9oZWxwZXJzJ1xuICAgICAgICBcbiAgICBpbmZvID0gcmVkdWNlOnRydWUsIGV2YWw6dHJ1ZVxuICAgIFxuICAgIGlmIG5vZGUuY29uZGl0aW9uLmJhc2U/LnZhbHVlPy5zdGFydHNXaXRoICfilrgnXG4gICAgICAgIFxuICAgICAgICBtZXRhS2V5ID0gbm9kZS5jb25kaXRpb24uYmFzZS52YWx1ZVxuICAgICAgICBpZiB0eXBlb2Ygb3B0cy5tZXRhW21ldGFLZXldID09ICdmdW5jdGlvbidcbiAgICAgICAgICAgIGluZm8gPSBvcHRzLm1ldGFbbWV0YUtleV0gb3B0czpvcHRzLCBub2RlOm5vZGUsIGFyZ3M6W11cbiAgICAgICAgICAgIFxuICAgIGlmIG5vZGUuY29uZGl0aW9uLnZhcmlhYmxlPy5iYXNlPy52YWx1ZT8uc3RhcnRzV2l0aCAn4pa4J1xuICAgICAgICBcbiAgICAgICAgbWV0YUtleSA9IG5vZGUuY29uZGl0aW9uLnZhcmlhYmxlLmJhc2UudmFsdWVcbiAgICAgICAgaWYgdHlwZW9mIG9wdHMubWV0YVttZXRhS2V5XSA9PSAnZnVuY3Rpb24nXG4gICAgICAgICAgICBhcmdzID0gbm9kZS5jb25kaXRpb24uYXJncy5tYXAgKGEpIC0+IFxuICAgICAgICAgICAgICAgIGEuYmFzZT8udmFsdWVcbiAgICAgICAgICAgIGFyZ3MgPSBhcmdzLm1hcCAoYSkgLT4gaWYgYVswXSBpbiBbJ1wiJywgXCInXCJdIHRoZW4gYVsxLi4tMl0gZWxzZSBhXG4gICAgICAgICAgICBpbmZvID0gb3B0cy5tZXRhW21ldGFLZXldIG9wdHM6b3B0cywgbm9kZTpub2RlLCBhcmdzOmFyZ3NcbiAgICAgICAgXG4gICAgaWYgaW5mby5za2lwIHRoZW4gcmV0dXJuIFtdXG4gICAgXG4gICAgaWYgaW5mby5ldmFsXG4gICAgICAgIFxuICAgICAgICBjb25kID0gaW5mby5jb2RlID8gbm9kZS5mcmFnbWVudHNUb1RleHQgbm9kZS5jb25kaXRpb24uY29tcGlsZVRvRnJhZ21lbnRzIG9wdHMsIDIgI0xFVkVMX1BBUkVOXG4gICAgICAgIHRyeVxuICAgICAgICAgICAgb3MgPSByZXF1aXJlICdvcydcbiAgICAgICAgICAgIGZzID0gcmVxdWlyZSAnZnMnXG4gICAgICAgICAgICBpbmZvLmJvZHkgPSEhIGV2YWwgY29uZFxuICAgICAgICAgICAgaWYgaW5mby5ldmFsIGFuZCBpbmZvLnJlZHVjZSBhbmQgbm90IGluZm8uYm9keSBhbmQgbm90IG5vZGUuZWxzZUJvZHlcbiAgICAgICAgICAgICAgICByZXR1cm4gW11cbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICBlcnJvciBlcnJcbiAgICAgICAgXG4gICAgZnJhZyA9IFtdXG4gICAgXG4gICAgaWYgaW5mby5yZWR1Y2UgPT0gZmFsc2VcbiAgICAgICAgZnJhZyA9IGZyYWcuY29uY2F0IG5vZGUubWFrZUNvZGUoXCJpZiAoXCIpLCBub2RlLm1ha2VDb2RlKGluZm8uY29kZSksIG5vZGUubWFrZUNvZGUoXCIpIHtcXG5cIilcbiAgICAgICAgXG4gICAgICAgIGluZGVudCA9IG9wdHMuaW5kZW50ICsgVEFCXG4gICAgICAgIGJvZHlPcHQgPSBtZXJnZSBvcHRzLCB7aW5kZW50fVxuICAgIGVsc2VcbiAgICAgICAgaW5kZW50ID0gb3B0cy5pbmRlbnRcbiAgICAgICAgYm9keU9wdCA9IG9wdHNcblxuICAgIGlmIGluZm8uYmVmb3JlXG4gICAgICAgIGZyYWcucHVzaCBub2RlLm1ha2VDb2RlIChpbmZvLmJsb2NrIT1mYWxzZSBhbmQgaW5mby5kZWRlbnQhPXRydWUgYW5kIGluZGVudCBvciAnJykgKyBpbmZvLmJlZm9yZVxuICAgICAgICBcbiAgICBpZiBpbmZvLmJvZHlcbiAgICAgICAgaWYgaW5mby5ibG9jayAhPSBmYWxzZVxuICAgICAgICAgICAgYm9keSA9IG5vZGUuZW5zdXJlQmxvY2sgbm9kZS5ib2R5XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIG5vZGUuYm9keSBpbnN0YW5jZW9mIEJsb2NrXG4gICAgICAgICAgICAgICAgYm9keSA9IG5vZGUuYm9keS5leHByZXNzaW9uc1swXVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGJvZHkgPSBub2RlLmJvZHlcbiAgICAgICAgaWYgYm9keVxuICAgICAgICAgICAgZnJhZyA9IGZyYWcuY29uY2F0IGJvZHkuY29tcGlsZVRvRnJhZ21lbnRzIGJvZHlPcHRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZnJhZy5wdXNoIG5vZGUubWFrZUNvZGUgXCInJ1wiICMgaWYgaW5mby5ibG9jayA9PSBmYWxzZSA/Pz9cbiAgICAgICAgXG4gICAgaWYgaW5mby5hZnRlclxuICAgICAgICBmcmFnLnB1c2ggbm9kZS5tYWtlQ29kZSAoKGluZm8uYmxvY2sgIT0gZmFsc2UpIGFuZCAoJ1xcbicgKyBpbmRlbnQpIG9yICcnKSArIGluZm8uYWZ0ZXJcblxuICAgIGlmIG5vdCBpbmZvLnJlZHVjZVxuICAgICAgICBmcmFnLnB1c2ggbm9kZS5tYWtlQ29kZShcIlxcbiN7bm9kZS50YWJ9fVwiKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICBpZiBub2RlLmVsc2VCb2R5IGFuZCAoaW5mby5yZWR1Y2UgPT0gZmFsc2Ugb3IgaW5mby5ib2R5ID09IGZhbHNlKVxuICAgICAgICBmcmFnLnB1c2ggbm9kZS5tYWtlQ29kZSAnIGVsc2UgJyBpZiBub3QgaW5mby5yZWR1Y2VcbiAgICAgICAgaWYgbm9kZS5pc0NoYWluXG4gICAgICAgICAgICBmcmFnID0gZnJhZy5jb25jYXQgbm9kZS5lbHNlQm9keS51bndyYXAoKS5jb21waWxlVG9GcmFnbWVudHMgYm9keU9wdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBmcmFnID0gZnJhZy5jb25jYXQgbm9kZS5lbHNlQm9keS5jb21waWxlVG9GcmFnbWVudHMgYm9keU9wdFxuICAgICAgICBcbiAgICByZXR1cm4gZnJhZ1xuICAgIFxuIyAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4jIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgICAgMDAwMDAwMCAgIFxuIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcblxubG9nU291cmNlID0gKG9wdHM6LGFyZ3M6LG5vZGU6LGNsb3NlOikgLT5cbiAgICBcbiAgICBjb2xvcmV0dGUub3B0aW9ucy5lbmFibGVkID0gb3B0cy5mZWF0dXJlLmNvbG9yXG4gICAgc291cmNlID0gb3B0cy5zb3VyY2UgPyBvcHRzLmZpbGVuYW1lID8gJydcbiAgICBleHQgPSAnJ1xuICAgIGlmIHNvdXJjZVxuICAgICAgICBbc291cmNlLCBleHQuLi5dID0gcGF0aC5iYXNlbmFtZShzb3VyY2UpLnNwbGl0ICcuJ1xuICAgICAgICBzb3VyY2UgID0geWVsbG93IFt5ZWxsb3dCcmlnaHQoc291cmNlKSwgZGltIGV4dC5qb2luJy4nXS5qb2luIGRpbSAnLidcbiAgICBiZWZvcmUgID0gXCJjb25zb2xlLmxvZygnI3tzb3VyY2V9I3tkaW0gYmx1ZSAnOid9I3tibHVlQnJpZ2h0IFwiI3tub2RlLmNvbmRpdGlvbi5sb2NhdGlvbkRhdGEuZmlyc3RfbGluZSsxfVwifSdcIlxuICAgIGJlZm9yZSArPSBcIiwgJyN7Ym9sZCB3aGl0ZUJyaWdodCBhcmdzWzBdfSdcIiBpZiBhcmdzWzBdIFxuICAgIGlmIChjbG9zZSlcbiAgICAgICAgYmVmb3JlICs9ICcpO1xcbidcbiAgICBlbHNlXG4gICAgICAgIGJlZm9yZSArPSBcIiwgXCJcbiAgICBjb2xvcmV0dGUub3B0aW9ucy5lbmFibGVkID0gdHJ1ZVxuICAgIGJlZm9yZVxuICAgICAgICBcbiMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIFxuIyAwMDAgIDAwMDAgIDAwMCAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4jIDAwMCAgMDAwIDAgMDAwICAgICAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiMgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuIyAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgXG5cbmluamVjdE1ldGEgPSAob3B0aW9ucykgLT4gIyBtYWtlIHN1cmUgdGhhdCBvcHRpb25zIGhhcyBhIG1ldGEgc2V0XG4gICAgXG4gICAgb3B0aW9ucyA/PSB7fVxuICAgIFxuICAgIHsgZXh0ZW5kIH0gPSByZXF1aXJlICcuL2hlbHBlcnMnXG4gICAgXG4gICAgZGVmYXVsdE1ldGEgPSB7fVxuICAgIE1FVEEubWFwIChtKSAtPiBkZWZhdWx0TWV0YVttLmtleV0gPSBtLm1ldGE7IG0ubWV0YS5rZXkgPSBtLmtleTsgbS5tZXRhLmluZm8gPSBtLmluZm9cbiAgICBcbiAgICBtZXRhICAgID0gZXh0ZW5kIGRlZmF1bHRNZXRhLCBvcHRpb25zLm1ldGEgPyB7fVxuICAgIG9wdGlvbnMgPSBleHRlbmQgeyBtZXRhOiBtZXRhIH0sIG9wdGlvbnNcbiAgICBvcHRpb25zXG5cbmxvZ01ldGFzID0gLT5cbiAgICBcbiAgICBsb2cgXCIje2dyYXkgJ01ldGFzOid9XFxuXFxuI3sgTUVUQS5tYXAoKGYpIC0+IFwiICAgICN7aGVscGVycy5wYWQgZi5rZXl9I3tncmF5IGYuZGVzYyA/IFwiI3tmLmtleX0gLi4uXCJ9XCIpLmpvaW4oJ1xcbicpIH1cIlxuICAgIGxvZyBcIiAgICDilrhpZiAgICAgICAgICAgICAgICAgICAgICN7Z3JheSAn4pa4aWYgY29uZCAuLi4gW1vilrhlbGlmIGNvbmQgLi4uXSDilrhlbHNlIC4uLl0nfVxcblwiXG4gICAgXG5tb2R1bGUuZXhwb3J0cyA9IHsgTUVUQSwgaW5qZWN0TWV0YSwgbG9nTWV0YXMsIGNvbXBpbGVNZXRhSWYgfVxuIl19
//# sourceURL=../coffee/meta.coffee