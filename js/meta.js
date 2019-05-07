// generated by koffee 0.19.0

/*
00     00  00000000  000000000   0000000   
000   000  000          000     000   000  
000000000  0000000      000     000000000  
000 0 000  000          000     000   000  
000   000  00000000     000     000   000
 */

(function() {
    var META, injectMeta, logMetas;

    META = [
        {
            key: 'profile',
            desc: '@profile [id] ...',
            info: {
                args: 1
            },
            meta: function(arg) {
                var args, id, name, node, ref, ref1, ref2;
                args = (ref = arg.args) != null ? ref : null, node = (ref1 = arg.node) != null ? ref1 : null;
                id = (node.condition.locationData.first_line + 1) + "_" + node.condition.locationData.first_column;
                name = (ref2 = args[0]) != null ? ref2 : id;
                return {
                    after: "console.log('" + name + "', require('pretty-time')(process.hrtime(koffee_" + id + ")));",
                    code: "koffee_" + id + " = process.hrtime()",
                    reduce: false
                };
            }
        }, {
            key: 'start',
            desc: '@start id ...',
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
            key: 'end',
            desc: '@end id ...',
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
            key: 'rand',
            meta: function(arg) {
                var args, ref, ref1;
                args = (ref = arg.args) != null ? ref : null;
                return {
                    code: "Math.random() < " + ((ref1 = args != null ? args[0] : void 0) != null ? ref1 : 0.5),
                    reduce: false
                };
            }
        }
    ];

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
        var gray, pad;
        pad = require('./helpers').pad;
        gray = require('colorette').gray;
        console.log((gray('Metas:')) + "\n\n" + (META.map(function(f) {
            var ref;
            return "    " + (pad(f.key)) + (gray((ref = f.desc) != null ? ref : "@" + f.key + " ..."));
        }).join('\n')));
        return console.log("    if else                 " + (gray('@if cond ... [[@elif cond ...] @else ...]')) + "\n");
    };

    module.exports = {
        META: META,
        injectMeta: injectMeta,
        logMetas: logMetas
    };

}).call(this);
