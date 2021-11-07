// koffee 1.16.0

/*
000   000   0000000   0000000    00000000   0000000  
0000  000  000   000  000   000  000       000       
000 0 000  000   000  000   000  0000000   0000000   
000  0000  000   000  000   000  000            000  
000   000   0000000   0000000    00000000  0000000
 */
var Access, Arr, Assign, Base, Block, BooleanLiteral, Call, Class, Code, CodeFragment, Comment, Existence, Expansion, ExportAllDeclaration, ExportDeclaration, ExportDefaultDeclaration, ExportNamedDeclaration, ExportSpecifier, ExportSpecifierList, Extends, For, IdentifierLiteral, If, ImportClause, ImportDeclaration, ImportDefaultSpecifier, ImportNamespaceSpecifier, ImportSpecifier, ImportSpecifierList, In, Index, InfinityLiteral, JS_FORBIDDEN, LEVEL_ACCESS, LEVEL_COND, LEVEL_LIST, LEVEL_OP, LEVEL_PAREN, LEVEL_TOP, Literal, MetaIf, ModuleDeclaration, ModuleSpecifier, ModuleSpecifierList, NEGATE, NO, NaNLiteral, NullLiteral, NumberLiteral, Obj, Op, Param, Parens, PassthroughLiteral, PropertyName, Range, RegexLiteral, RegexWithInterpolations, Return, SIMPLENUM, Scope, Slice, Splat, StatementLiteral, StringLiteral, StringWithInterpolations, SuperCall, Switch, TAB, THIS, TaggedTemplateCall, ThisLiteral, Throw, Try, UTILITIES, UndefinedLiteral, Value, While, YES, YieldReturn, addLocationDataFn, compact, compileMetaIf, del, ends, extend, flatten, hasFeature, injectFeature, injectMeta, isComplexOrAssignable, isLiteralArguments, isLiteralThis, isUnassignable, locationDataToString, merge, multident, ref1, ref2, ref3, some, starts, stringify, throwSyntaxError, unfoldSoak, utility,
    extend1 = function(child, parent) { for (var key in parent) { if (hasProp(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = Object.hasOwn,
    indexOf = [].indexOf,
    slice = [].slice;

Error.stackTraceLimit = 2e308;

Scope = require('./scope');

ref1 = require('./lexer'), isUnassignable = ref1.isUnassignable, JS_FORBIDDEN = ref1.JS_FORBIDDEN;

injectMeta = require('./meta').injectMeta;

ref2 = require('./features'), injectFeature = ref2.injectFeature, hasFeature = ref2.hasFeature;

ref3 = require('./helpers'), compact = ref3.compact, flatten = ref3.flatten, extend = ref3.extend, merge = ref3.merge, del = ref3.del, starts = ref3.starts, ends = ref3.ends, some = ref3.some, addLocationDataFn = ref3.addLocationDataFn, locationDataToString = ref3.locationDataToString, throwSyntaxError = ref3.throwSyntaxError, stringify = ref3.stringify;

compileMetaIf = require('./meta').compileMetaIf;

exports.extend = extend;

exports.addLocationDataFn = addLocationDataFn;

YES = function() {
    return true;
};

NO = function() {
    return false;
};

THIS = function() {
    return this;
};

NEGATE = function() {
    this.negated = !this.negated;
    return this;
};

exports.CodeFragment = CodeFragment = (function() {
    function CodeFragment(parent, code) {
        var ref4;
        this.code = "" + code;
        this.locationData = parent != null ? parent.locationData : void 0;
        this.type = (parent != null ? (ref4 = parent.constructor) != null ? ref4.name : void 0 : void 0) || 'unknown';
    }

    CodeFragment.prototype.toString = function() {
        return "" + this.code + (this.locationData ? ": " + locationDataToString(this.locationData) : '');
    };

    return CodeFragment;

})();

exports.Base = Base = (function() {
    function Base() {}

    Base.prototype.fragmentsToText = function(fragments) {
        var fragment;
        return ((function() {
            var j, len1, results;
            results = [];
            for (j = 0, len1 = fragments.length; j < len1; j++) {
                fragment = fragments[j];
                results.push(fragment.code);
            }
            return results;
        })()).join('');
    };

    Base.prototype.compile = function(o, lvl) {
        return this.fragmentsToText(this.compileToFragments(o, lvl));
    };

    Base.prototype.compileToFragments = function(o, lvl) {
        var node;
        o = injectFeature(o);
        o = injectMeta(o);
        if (lvl) {
            o.level = lvl;
        }
        node = this.unfoldSoak(o) || this;
        node.tab = o.indent;
        if (o.level === LEVEL_TOP || !node.isStatement(o)) {
            return node.compileNode(o);
        } else {
            return node.compileClosure(o);
        }
    };

    Base.prototype.compileClosure = function(o) {
        var args, argumentsNode, func, jumpNode, meth, parts, ref4;
        if (jumpNode = this.jumps()) {
            jumpNode.error('cannot use a pure statement in an expression');
        }
        o.sharedScope = true;
        func = new Code([], Block.wrap([this]));
        args = [];
        if ((argumentsNode = this.contains(isLiteralArguments)) || this.contains(isLiteralThis)) {
            args = [new ThisLiteral];
            if (argumentsNode) {
                meth = 'apply';
                args.push(new IdentifierLiteral('arguments'));
            } else {
                meth = 'call';
            }
            func = new Value(func, [new Access(new PropertyName(meth))]);
        }
        parts = (new Call(func, args)).compileNode(o);
        if (func.isGenerator || ((ref4 = func.base) != null ? ref4.isGenerator : void 0)) {
            parts.unshift(this.makeCode("(yield* "));
            parts.push(this.makeCode(")"));
        }
        return parts;
    };

    Base.prototype.cache = function(o, level, isComplex) {
        var complex, ref, sub;
        complex = isComplex != null ? isComplex(this) : this.isComplex();
        if (complex) {
            ref = new IdentifierLiteral(o.scope.freeVariable('ref'));
            sub = new Assign(ref, this);
            if (level) {
                return [sub.compileToFragments(o, level), [this.makeCode(ref.value)]];
            } else {
                return [sub, ref];
            }
        } else {
            ref = level ? this.compileToFragments(o, level) : this;
            return [ref, ref];
        }
    };

    Base.prototype.cacheToCodeFragments = function(cacheValues) {
        return [this.fragmentsToText(cacheValues[0]), this.fragmentsToText(cacheValues[1])];
    };

    Base.prototype.makeReturn = function(res) {
        var me;
        me = this.unwrapAll();
        if (res) {
            return new Call(new Literal(res + ".push"), [me]);
        } else {
            return new Return(me);
        }
    };

    Base.prototype.contains = function(pred) {
        var node;
        node = void 0;
        this.traverseChildren(false, function(n) {
            if (pred(n)) {
                node = n;
                return false;
            }
        });
        return node;
    };

    Base.prototype.lastNonComment = function(list) {
        var i;
        i = list.length;
        while (i--) {
            if (!(list[i] instanceof Comment)) {
                return list[i];
            }
        }
        return null;
    };

    Base.prototype.toString = function(idt, name) {
        var tree;
        if (idt == null) {
            idt = '';
        }
        if (name == null) {
            name = this.constructor.name;
        }
        tree = '\n' + idt + name;
        if (this.soak) {
            tree += '?';
        }
        this.eachChild(function(node) {
            return tree += node.toString(idt + TAB);
        });
        return tree;
    };

    Base.prototype.eachChild = function(func) {
        var attr, child, j, k, len1, len2, ref4, ref5;
        if (!this.children) {
            return this;
        }
        ref4 = this.children;
        for (j = 0, len1 = ref4.length; j < len1; j++) {
            attr = ref4[j];
            if (this[attr]) {
                ref5 = flatten([this[attr]]);
                for (k = 0, len2 = ref5.length; k < len2; k++) {
                    child = ref5[k];
                    if (child) {
                        if (func(child) === false) {
                            return this;
                        }
                    }
                }
            }
        }
        return this;
    };

    Base.prototype.traverseChildren = function(crossScope, func) {
        return this.eachChild(function(child) {
            var recur;
            recur = func(child);
            if (recur !== false) {
                return child.traverseChildren(crossScope, func);
            }
        });
    };

    Base.prototype.invert = function() {
        return new Op('!', this);
    };

    Base.prototype.unwrapAll = function() {
        var node;
        node = this;
        while (node !== (node = node.unwrap())) {
            continue;
        }
        return node;
    };

    Base.prototype.children = [];

    Base.prototype.isStatement = NO;

    Base.prototype.jumps = NO;

    Base.prototype.isComplex = YES;

    Base.prototype.isChainable = NO;

    Base.prototype.isAssignable = NO;

    Base.prototype.isNumber = NO;

    Base.prototype.unwrap = THIS;

    Base.prototype.unfoldSoak = NO;

    Base.prototype.assigns = NO;

    Base.prototype.updateLocationDataIfMissing = function(locationData) {
        if (this.locationData) {
            return this;
        }
        this.locationData = locationData;
        return this.eachChild(function(child) {
            return child.updateLocationDataIfMissing(locationData);
        });
    };

    Base.prototype.error = function(message) {
        return throwSyntaxError({
            module: "nodes." + this.constructor.name,
            message: message,
            location: this.locationData
        });
    };

    Base.prototype.makeCode = function(code) {
        return new CodeFragment(this, code);
    };

    Base.prototype.wrapInBraces = function(fragments) {
        return [].concat(this.makeCode('('), fragments, this.makeCode(')'));
    };

    Base.prototype.joinFragmentArrays = function(fragmentsList, joinStr) {
        var answer, fragments, i, j, len1;
        answer = [];
        for (i = j = 0, len1 = fragmentsList.length; j < len1; i = ++j) {
            fragments = fragmentsList[i];
            if (i) {
                answer.push(this.makeCode(joinStr));
            }
            answer = answer.concat(fragments);
        }
        return answer;
    };

    return Base;

})();

exports.Block = Block = (function(superClass1) {
    extend1(Block, superClass1);

    function Block(nodes) {
        this.expressions = compact(flatten(nodes || []));
    }

    Block.prototype.children = ['expressions'];

    Block.prototype.push = function(node) {
        this.expressions.push(node);
        return this;
    };

    Block.prototype.pop = function() {
        return this.expressions.pop();
    };

    Block.prototype.unshift = function(node) {
        this.expressions.unshift(node);
        return this;
    };

    Block.prototype.unwrap = function() {
        if (this.expressions.length === 1) {
            return this.expressions[0];
        } else {
            return this;
        }
    };

    Block.prototype.isEmpty = function() {
        return !this.expressions.length;
    };

    Block.prototype.isStatement = function(o) {
        var exp, j, len1, ref4;
        ref4 = this.expressions;
        for (j = 0, len1 = ref4.length; j < len1; j++) {
            exp = ref4[j];
            if (exp.isStatement(o)) {
                return true;
            }
        }
        return false;
    };

    Block.prototype.jumps = function(o) {
        var exp, j, jumpNode, len1, ref4;
        ref4 = this.expressions;
        for (j = 0, len1 = ref4.length; j < len1; j++) {
            exp = ref4[j];
            if (jumpNode = exp.jumps(o)) {
                return jumpNode;
            }
        }
    };

    Block.prototype.makeReturn = function(res) {
        var expr, len;
        len = this.expressions.length;
        while (len--) {
            expr = this.expressions[len];
            if (!(expr instanceof Comment)) {
                this.expressions[len] = expr.makeReturn(res);
                if (expr instanceof Return && !expr.expression) {
                    this.expressions.splice(len, 1);
                }
                break;
            }
        }
        return this;
    };

    Block.prototype.compileToFragments = function(o, level) {
        if (o == null) {
            o = {};
        }
        if (o.scope) {
            return Block.__super__.compileToFragments.call(this, o, level);
        } else {
            return this.compileRoot(o);
        }
    };

    Block.prototype.compileNode = function(o) {
        var answer, compiledNodes, fragments, index, j, len1, node, ref4, top;
        this.tab = o.indent;
        top = o.level === LEVEL_TOP;
        compiledNodes = [];
        ref4 = this.expressions;
        for (index = j = 0, len1 = ref4.length; j < len1; index = ++j) {
            node = ref4[index];
            node = node.unwrapAll();
            node = node.unfoldSoak(o) || node;
            if (node instanceof Block) {
                compiledNodes.push(node.compileNode(o));
            } else if (top) {
                node.front = true;
                fragments = node.compileToFragments(o);
                if (!node.isStatement(o) && (fragments.unshift != null)) {
                    if (!((fragments != null ? fragments.unshift : void 0) != null)) {
                        klog('[33m[93mnodes[33m[2m.[22m[2mcoffee[22m[39m[2m[34m:[39m[22m[94m338[39m', '[1m[97mno unshift?[39m[22m');

                        process.exit(666);
                    };
                    fragments.unshift(this.makeCode("" + this.tab));
                    fragments.push(this.makeCode(";"));
                }
                compiledNodes.push(fragments);
            } else {
                compiledNodes.push(node.compileToFragments(o, LEVEL_LIST));
            }
        }
        if (top) {
            if (this.spaced) {
                return [].concat(this.joinFragmentArrays(compiledNodes, '\n\n'), this.makeCode("\n"));
            } else {
                return this.joinFragmentArrays(compiledNodes, '\n');
            }
        }
        if (compiledNodes.length) {
            answer = this.joinFragmentArrays(compiledNodes, ', ');
        } else {
            answer = [this.makeCode("void 0")];
        }
        if (compiledNodes.length > 1 && o.level >= LEVEL_LIST) {
            return this.wrapInBraces(answer);
        } else {
            return answer;
        }
    };

    Block.prototype.compileRoot = function(o) {
        var exp, fragments, i, j, len1, name, prelude, preludeExps, ref4, ref5, rest;
        o.indent = o.bare ? '' : TAB;
        o.level = LEVEL_TOP;
        this.spaced = true;
        o.scope = new Scope(null, this, null, (ref4 = o.referencedVars) != null ? ref4 : []);
        ref5 = o.locals || [];
        for (j = 0, len1 = ref5.length; j < len1; j++) {
            name = ref5[j];
            o.scope.parameter(name);
        }
        prelude = [];
        if (!o.bare) {
            preludeExps = (function() {
                var k, len2, ref6, results;
                ref6 = this.expressions;
                results = [];
                for (i = k = 0, len2 = ref6.length; k < len2; i = ++k) {
                    exp = ref6[i];
                    if (!(exp.unwrap() instanceof Comment)) {
                        break;
                    }
                    results.push(exp);
                }
                return results;
            }).call(this);
            rest = this.expressions.slice(preludeExps.length);
            this.expressions = preludeExps;
            if (preludeExps.length) {
                prelude = this.compileNode(merge(o, {
                    indent: ''
                }));
                prelude.push(this.makeCode("\n"));
            }
            this.expressions = rest;
        }
        fragments = this.compileWithDeclarations(o);
        if (o.bare) {
            return fragments;
        }
        return [].concat(prelude, this.makeCode("(function() {\n"), fragments, this.makeCode("\n}).call(this);\n"));
    };

    Block.prototype.compileWithDeclarations = function(o) {
        var assigns, declars, exp, fragments, i, j, len1, post, ref4, ref5, ref6, rest, scope, spaced;
        fragments = [];
        post = [];
        ref4 = this.expressions;
        for (i = j = 0, len1 = ref4.length; j < len1; i = ++j) {
            exp = ref4[i];
            exp = exp.unwrap();
            if (!(exp instanceof Comment || exp instanceof Literal)) {
                break;
            }
        }
        o = merge(o, {
            level: LEVEL_TOP
        });
        if (i) {
            rest = this.expressions.splice(i, 9e9);
            ref5 = [this.spaced, false], spaced = ref5[0], this.spaced = ref5[1];
            ref6 = [this.compileNode(o), spaced], fragments = ref6[0], this.spaced = ref6[1];
            this.expressions = rest;
        }
        post = this.compileNode(o);
        scope = o.scope;
        if (scope.expressions === this) {
            declars = o.scope.hasDeclarations();
            assigns = scope.hasAssignments;
            if (declars || assigns) {
                if (i) {
                    fragments.push(this.makeCode('\n'));
                }
                fragments.push(this.makeCode(this.tab + "var "));
                if (declars) {
                    fragments.push(this.makeCode(scope.declaredVariables().join(', ')));
                }
                if (assigns) {
                    if (declars) {
                        fragments.push(this.makeCode(",\n" + (this.tab + TAB)));
                    }
                    fragments.push(this.makeCode(scope.assignedVariables().join(",\n" + (this.tab + TAB))));
                }
                fragments.push(this.makeCode(";\n" + (this.spaced ? '\n' : '')));
            } else if (fragments.length && post.length) {
                fragments.push(this.makeCode("\n"));
            }
        }
        return fragments.concat(post);
    };

    Block.wrap = function(nodes) {
        if (nodes.length === 1 && nodes[0] instanceof Block) {
            return nodes[0];
        }
        return new Block(nodes);
    };

    return Block;

})(Base);

exports.Literal = Literal = (function(superClass1) {
    extend1(Literal, superClass1);

    function Literal(value1) {
        this.value = value1;
    }

    Literal.prototype.isComplex = NO;

    Literal.prototype.assigns = function(name) {
        return name === this.value;
    };

    Literal.prototype.compileNode = function(o) {
        return [this.makeCode(this.value)];
    };

    Literal.prototype.toString = function() {
        return " " + (this.isStatement() ? Literal.__super__.toString.apply(this, arguments) : this.constructor.name) + ": " + this.value;
    };

    return Literal;

})(Base);

exports.NumberLiteral = NumberLiteral = (function(superClass1) {
    extend1(NumberLiteral, superClass1);

    function NumberLiteral() {
        return NumberLiteral.__super__.constructor.apply(this, arguments);
    }

    return NumberLiteral;

})(Literal);

exports.InfinityLiteral = InfinityLiteral = (function(superClass1) {
    extend1(InfinityLiteral, superClass1);

    function InfinityLiteral() {
        return InfinityLiteral.__super__.constructor.apply(this, arguments);
    }

    InfinityLiteral.prototype.compileNode = function() {
        return [this.makeCode('2e308')];
    };

    return InfinityLiteral;

})(NumberLiteral);

exports.NaNLiteral = NaNLiteral = (function(superClass1) {
    extend1(NaNLiteral, superClass1);

    function NaNLiteral() {
        NaNLiteral.__super__.constructor.call(this, 'NaN');
    }

    NaNLiteral.prototype.compileNode = function(o) {
        var code;
        code = [this.makeCode('0/0')];
        if (o.level >= LEVEL_OP) {
            return this.wrapInBraces(code);
        } else {
            return code;
        }
    };

    return NaNLiteral;

})(NumberLiteral);

exports.StringLiteral = StringLiteral = (function(superClass1) {
    extend1(StringLiteral, superClass1);

    function StringLiteral() {
        return StringLiteral.__super__.constructor.apply(this, arguments);
    }

    return StringLiteral;

})(Literal);

exports.RegexLiteral = RegexLiteral = (function(superClass1) {
    extend1(RegexLiteral, superClass1);

    function RegexLiteral() {
        return RegexLiteral.__super__.constructor.apply(this, arguments);
    }

    return RegexLiteral;

})(Literal);

exports.PassthroughLiteral = PassthroughLiteral = (function(superClass1) {
    extend1(PassthroughLiteral, superClass1);

    function PassthroughLiteral() {
        return PassthroughLiteral.__super__.constructor.apply(this, arguments);
    }

    return PassthroughLiteral;

})(Literal);

exports.IdentifierLiteral = IdentifierLiteral = (function(superClass1) {
    extend1(IdentifierLiteral, superClass1);

    function IdentifierLiteral() {
        return IdentifierLiteral.__super__.constructor.apply(this, arguments);
    }

    IdentifierLiteral.prototype.isAssignable = YES;

    return IdentifierLiteral;

})(Literal);

exports.PropertyName = PropertyName = (function(superClass1) {
    extend1(PropertyName, superClass1);

    function PropertyName() {
        return PropertyName.__super__.constructor.apply(this, arguments);
    }

    PropertyName.prototype.isAssignable = YES;

    return PropertyName;

})(Literal);

exports.StatementLiteral = StatementLiteral = (function(superClass1) {
    extend1(StatementLiteral, superClass1);

    function StatementLiteral() {
        return StatementLiteral.__super__.constructor.apply(this, arguments);
    }

    StatementLiteral.prototype.isStatement = YES;

    StatementLiteral.prototype.makeReturn = THIS;

    StatementLiteral.prototype.jumps = function(o) {
        if (this.value === 'break' && !((o != null ? o.loop : void 0) || (o != null ? o.block : void 0))) {
            return this;
        }
        if (this.value === 'continue' && !(o != null ? o.loop : void 0)) {
            return this;
        }
    };

    StatementLiteral.prototype.compileNode = function(o) {
        return [this.makeCode("" + this.tab + this.value + ";")];
    };

    return StatementLiteral;

})(Literal);

exports.ThisLiteral = ThisLiteral = (function(superClass1) {
    extend1(ThisLiteral, superClass1);

    function ThisLiteral() {
        ThisLiteral.__super__.constructor.call(this, 'this');
    }

    ThisLiteral.prototype.compileNode = function(o) {
        var code, ref4;
        code = ((ref4 = o.scope.method) != null ? ref4.bound : void 0) ? o.scope.method.context : this.value;
        return [this.makeCode(code)];
    };

    return ThisLiteral;

})(Literal);

exports.UndefinedLiteral = UndefinedLiteral = (function(superClass1) {
    extend1(UndefinedLiteral, superClass1);

    function UndefinedLiteral() {
        UndefinedLiteral.__super__.constructor.call(this, 'undefined');
    }

    UndefinedLiteral.prototype.compileNode = function(o) {
        return [this.makeCode(o.level >= LEVEL_ACCESS ? '(void 0)' : 'void 0')];
    };

    return UndefinedLiteral;

})(Literal);

exports.NullLiteral = NullLiteral = (function(superClass1) {
    extend1(NullLiteral, superClass1);

    function NullLiteral() {
        NullLiteral.__super__.constructor.call(this, 'null');
    }

    return NullLiteral;

})(Literal);

exports.BooleanLiteral = BooleanLiteral = (function(superClass1) {
    extend1(BooleanLiteral, superClass1);

    function BooleanLiteral() {
        return BooleanLiteral.__super__.constructor.apply(this, arguments);
    }

    return BooleanLiteral;

})(Literal);

exports.Return = Return = (function(superClass1) {
    extend1(Return, superClass1);

    function Return(expression) {
        this.expression = expression;
    }

    Return.prototype.children = ['expression'];

    Return.prototype.isStatement = YES;

    Return.prototype.makeReturn = THIS;

    Return.prototype.jumps = THIS;

    Return.prototype.compileToFragments = function(o, level) {
        var expr, ref4;
        expr = (ref4 = this.expression) != null ? ref4.makeReturn() : void 0;
        if (expr && !(expr instanceof Return)) {
            return expr.compileToFragments(o, level);
        } else {
            return Return.__super__.compileToFragments.call(this, o, level);
        }
    };

    Return.prototype.compileNode = function(o) {
        var answer;
        answer = [];
        answer.push(this.makeCode(this.tab + ("return" + (this.expression ? " " : ""))));
        if (this.expression) {
            answer = answer.concat(this.expression.compileToFragments(o, LEVEL_PAREN));
        }
        answer.push(this.makeCode(";"));
        return answer;
    };

    return Return;

})(Base);

exports.YieldReturn = YieldReturn = (function(superClass1) {
    extend1(YieldReturn, superClass1);

    function YieldReturn() {
        return YieldReturn.__super__.constructor.apply(this, arguments);
    }

    YieldReturn.prototype.compileNode = function(o) {
        if (o.scope.parent == null) {
            this.error('yield can only occur inside functions');
        }
        return YieldReturn.__super__.compileNode.apply(this, arguments);
    };

    return YieldReturn;

})(Return);

exports.Value = Value = (function(superClass1) {
    extend1(Value, superClass1);

    function Value(base, props, tag) {
        if (!props && base instanceof Value) {
            return base;
        }
        this.base = base;
        this.properties = props || [];
        if (tag) {
            this[tag] = true;
        }
        return this;
    }

    Value.prototype.children = ['base', 'properties'];

    Value.prototype.add = function(props) {
        this.properties = this.properties.concat(props);
        return this;
    };

    Value.prototype.hasProperties = function() {
        return !!this.properties.length;
    };

    Value.prototype.bareLiteral = function(type) {
        return !this.properties.length && this.base instanceof type;
    };

    Value.prototype.isArray = function() {
        return this.bareLiteral(Arr);
    };

    Value.prototype.isRange = function() {
        return this.bareLiteral(Range);
    };

    Value.prototype.isComplex = function() {
        return this.hasProperties() || this.base.isComplex();
    };

    Value.prototype.isAssignable = function() {
        return this.hasProperties() || this.base.isAssignable();
    };

    Value.prototype.isNumber = function() {
        return this.bareLiteral(NumberLiteral);
    };

    Value.prototype.isString = function() {
        return this.bareLiteral(StringLiteral);
    };

    Value.prototype.isRegex = function() {
        return this.bareLiteral(RegexLiteral);
    };

    Value.prototype.isUndefined = function() {
        return this.bareLiteral(UndefinedLiteral);
    };

    Value.prototype.isNull = function() {
        return this.bareLiteral(NullLiteral);
    };

    Value.prototype.isBoolean = function() {
        return this.bareLiteral(BooleanLiteral);
    };

    Value.prototype.isAtomic = function() {
        var j, len1, node, ref4;
        ref4 = this.properties.concat(this.base);
        for (j = 0, len1 = ref4.length; j < len1; j++) {
            node = ref4[j];
            if (node.soak || node instanceof Call) {
                return false;
            }
        }
        return true;
    };

    Value.prototype.isNotCallable = function() {
        return this.isNumber() || this.isString() || this.isRegex() || this.isArray() || this.isRange() || this.isSplice() || this.isObject() || this.isUndefined() || this.isNull() || this.isBoolean();
    };

    Value.prototype.isStatement = function(o) {
        return !this.properties.length && this.base.isStatement(o);
    };

    Value.prototype.assigns = function(name) {
        return !this.properties.length && this.base.assigns(name);
    };

    Value.prototype.jumps = function(o) {
        return !this.properties.length && this.base.jumps(o);
    };

    Value.prototype.isObject = function(onlyGenerated) {
        if (this.properties.length) {
            return false;
        }
        return (this.base instanceof Obj) && (!onlyGenerated || this.base.generated);
    };

    Value.prototype.isSplice = function() {
        var lastProp, ref4;
        ref4 = this.properties, lastProp = ref4[ref4.length - 1];
        return lastProp instanceof Slice;
    };

    Value.prototype.looksStatic = function(className) {
        var ref4;
        return this.base.value === className && this.properties.length === 1 && ((ref4 = this.properties[0].name) != null ? ref4.value : void 0) !== 'prototype';
    };

    Value.prototype.unwrap = function() {
        if (this.properties.length) {
            return this;
        } else {
            return this.base;
        }
    };

    Value.prototype.cacheReference = function(o) {
        var base, bref, name, nref, ref4;
        ref4 = this.properties, name = ref4[ref4.length - 1];
        if (this.properties.length < 2 && !this.base.isComplex() && !(name != null ? name.isComplex() : void 0)) {
            return [this, this];
        }
        base = new Value(this.base, this.properties.slice(0, -1));
        if (base.isComplex()) {
            bref = new IdentifierLiteral(o.scope.freeVariable('base'));
            base = new Value(new Parens(new Assign(bref, base)));
        }
        if (!name) {
            return [base, bref];
        }
        if (name.isComplex()) {
            nref = new IdentifierLiteral(o.scope.freeVariable('name'));
            name = new Index(new Assign(nref, name.index));
            nref = new Index(nref);
        }
        return [base.add(name), new Value(bref || base.base, [nref || name])];
    };

    Value.prototype.compileNode = function(o) {
        var fragments, j, len1, prop, props;
        this.base.front = this.front;
        props = this.properties;
        fragments = this.base.compileToFragments(o, (props.length ? LEVEL_ACCESS : null));
        if (props.length && SIMPLENUM.test(this.fragmentsToText(fragments))) {
            fragments.push(this.makeCode('.'));
        }
        for (j = 0, len1 = props.length; j < len1; j++) {
            prop = props[j];
            fragments.push.apply(fragments, prop.compileToFragments(o));
        }
        return fragments;
    };

    Value.prototype.unfoldSoak = function(o) {
        return this.unfoldedSoak != null ? this.unfoldedSoak : this.unfoldedSoak = (function(_this) {
            return function() {
                var fst, i, ifn, j, len1, prop, ref, ref4, ref5, snd;
                if (ifn = _this.base.unfoldSoak(o)) {
                    (ref4 = ifn.body.properties).push.apply(ref4, _this.properties);
                    return ifn;
                }
                ref5 = _this.properties;
                for (i = j = 0, len1 = ref5.length; j < len1; i = ++j) {
                    prop = ref5[i];
                    if (!prop.soak) {
                        continue;
                    }
                    prop.soak = false;
                    fst = new Value(_this.base, _this.properties.slice(0, i));
                    snd = new Value(_this.base, _this.properties.slice(i));
                    if (fst.isComplex()) {
                        ref = new IdentifierLiteral(o.scope.freeVariable('ref'));
                        fst = new Parens(new Assign(ref, fst));
                        snd.base = ref;
                    }
                    return new If(new Existence(fst), snd, {
                        soak: true
                    });
                }
                return false;
            };
        })(this)();
    };

    return Value;

})(Base);

exports.Comment = Comment = (function(superClass1) {
    extend1(Comment, superClass1);

    function Comment(comment1) {
        this.comment = comment1;
    }

    Comment.prototype.isStatement = YES;

    Comment.prototype.makeReturn = THIS;

    Comment.prototype.compileNode = function(o, level) {
        var code, comment;
        comment = this.comment.replace(/^(\s*)#(?=\s)/gm, "$1 *");
        code = "/*" + (multident(comment, this.tab)) + (indexOf.call(comment, '\n') >= 0 ? "\n" + this.tab : '') + " */";
        if ((level || o.level) === LEVEL_TOP) {
            code = o.indent + code;
        }
        return [this.makeCode("\n"), this.makeCode(code)];
    };

    return Comment;

})(Base);

exports.Call = Call = (function(superClass1) {
    extend1(Call, superClass1);

    function Call(variable1, args1, soak1) {
        this.variable = variable1;
        this.args = args1 != null ? args1 : [];
        this.soak = soak1;
        this.isNew = false;
        if (this.variable instanceof Value && this.variable.isNotCallable()) {
            this.variable.error("literal is not a function");
        }
    }

    Call.prototype.children = ['variable', 'args'];

    Call.prototype.updateLocationDataIfMissing = function(locationData) {
        var base, ref4;
        if (this.locationData && this.needsUpdatedStartLocation) {
            this.locationData.first_line = locationData.first_line;
            this.locationData.first_column = locationData.first_column;
            base = ((ref4 = this.variable) != null ? ref4.base : void 0) || this.variable;
            if (base.needsUpdatedStartLocation) {
                this.variable.locationData.first_line = locationData.first_line;
                this.variable.locationData.first_column = locationData.first_column;
                base.updateLocationDataIfMissing(locationData);
            }
            delete this.needsUpdatedStartLocation;
        }
        return Call.__super__.updateLocationDataIfMissing.apply(this, arguments);
    };

    Call.prototype.newInstance = function() {
        var base, ref4;
        base = ((ref4 = this.variable) != null ? ref4.base : void 0) || this.variable;
        if (base instanceof Call && !base.isNew) {
            base.newInstance();
        } else {
            this.isNew = true;
        }
        this.needsUpdatedStartLocation = true;
        return this;
    };

    Call.prototype.unfoldSoak = function(o) {
        var call, ifn, j, left, len1, list, ref4, ref5, rite;
        if (this.soak) {
            if (this instanceof SuperCall) {
                left = new Literal(this.superReference(o));
                rite = new Value(left);
            } else {
                if (ifn = unfoldSoak(o, this, 'variable')) {
                    return ifn;
                }
                ref4 = new Value(this.variable).cacheReference(o), left = ref4[0], rite = ref4[1];
            }
            rite = new Call(rite, this.args);
            rite.isNew = this.isNew;
            left = new Literal("typeof " + (left.compile(o)) + " === \"function\"");
            return new If(left, new Value(rite), {
                soak: true
            });
        }
        call = this;
        list = [];
        while (true) {
            if (call.variable instanceof Call) {
                list.push(call);
                call = call.variable;
                continue;
            }
            if (!(call.variable instanceof Value)) {
                break;
            }
            list.push(call);
            if (!((call = call.variable.base) instanceof Call)) {
                break;
            }
        }
        ref5 = list.reverse();
        for (j = 0, len1 = ref5.length; j < len1; j++) {
            call = ref5[j];
            if (ifn) {
                if (call.variable instanceof Call) {
                    call.variable = ifn;
                } else {
                    call.variable.base = ifn;
                }
            }
            ifn = unfoldSoak(o, call, 'variable');
        }
        return ifn;
    };

    Call.prototype.compileNode = function(o) {
        var arg, argIndex, compiledArgs, compiledArray, fragments, j, len1, preface, ref4, ref5;
        if ((ref4 = this.variable) != null) {
            ref4.front = this.front;
        }
        compiledArray = Splat.compileSplattedArray(o, this.args, true);
        if (compiledArray.length) {
            return this.compileSplat(o, compiledArray);
        }
        compiledArgs = [];
        ref5 = this.args;
        for (argIndex = j = 0, len1 = ref5.length; j < len1; argIndex = ++j) {
            arg = ref5[argIndex];
            if (argIndex) {
                compiledArgs.push(this.makeCode(", "));
            }
            compiledArgs.push.apply(compiledArgs, arg.compileToFragments(o, LEVEL_LIST));
        }
        fragments = [];
        if (this instanceof SuperCall) {
            preface = this.superReference(o) + (".call(" + (this.superThis(o)));
            if (compiledArgs.length) {
                preface += ", ";
            }
            fragments.push(this.makeCode(preface));
        } else {
            if (this.isNew) {
                fragments.push(this.makeCode('new '));
            }
            fragments.push.apply(fragments, this.variable.compileToFragments(o, LEVEL_ACCESS));
            fragments.push(this.makeCode("("));
        }
        fragments.push.apply(fragments, compiledArgs);
        fragments.push(this.makeCode(")"));
        return fragments;
    };

    Call.prototype.compileSplat = function(o, splatArgs) {
        var answer, base, fun, idt, name, ref;
        if (this instanceof SuperCall) {
            return [].concat(this.makeCode((this.superReference(o)) + ".apply(" + (this.superThis(o)) + ", "), splatArgs, this.makeCode(")"));
        }
        if (this.isNew) {
            idt = this.tab + TAB;
            return [].concat(this.makeCode("(function(func, args, ctor) {\n" + idt + "ctor.prototype = func.prototype;\n" + idt + "var child = new ctor, result = func.apply(child, args);\n" + idt + "return Object(result) === result ? result : child;\n" + this.tab + "})("), this.variable.compileToFragments(o, LEVEL_LIST), this.makeCode(", "), splatArgs, this.makeCode(", function(){})"));
        }
        answer = [];
        base = new Value(this.variable);
        if ((name = base.properties.pop()) && base.isComplex()) {
            ref = o.scope.freeVariable('ref');
            answer = answer.concat(this.makeCode("(" + ref + " = "), base.compileToFragments(o, LEVEL_LIST), this.makeCode(")"), name.compileToFragments(o));
        } else {
            fun = base.compileToFragments(o, LEVEL_ACCESS);
            if (SIMPLENUM.test(this.fragmentsToText(fun))) {
                fun = this.wrapInBraces(fun);
            }
            if (name) {
                ref = this.fragmentsToText(fun);
                fun.push.apply(fun, name.compileToFragments(o));
            } else {
                ref = 'null';
            }
            answer = answer.concat(fun);
        }
        return answer = answer.concat(this.makeCode(".apply(" + ref + ", "), splatArgs, this.makeCode(")"));
    };

    return Call;

})(Base);

exports.SuperCall = SuperCall = (function(superClass1) {
    extend1(SuperCall, superClass1);

    function SuperCall(args) {
        SuperCall.__super__.constructor.call(this, null, args != null ? args : [new Splat(new IdentifierLiteral('arguments'))]);
        this.isBare = args != null;
    }

    SuperCall.prototype.superReference = function(o) {
        var accesses, base, bref, klass, method, name, nref, variable;
        method = o.scope.namedMethod();
        if (method != null ? method.klass : void 0) {
            klass = method.klass, name = method.name, variable = method.variable;
            if (klass.isComplex()) {
                bref = new IdentifierLiteral(o.scope.parent.freeVariable('base'));
                base = new Value(new Parens(new Assign(bref, klass)));
                variable.base = base;
                variable.properties.splice(0, klass.properties.length);
            }
            if (name.isComplex() || (name instanceof Index && name.index.isAssignable())) {
                nref = new IdentifierLiteral(o.scope.parent.freeVariable('name'));
                name = new Index(new Assign(nref, name.index));
                variable.properties.pop();
                variable.properties.push(name);
            }
            accesses = [new Access(new PropertyName('__super__'))];
            if (method["static"]) {
                accesses.push(new Access(new PropertyName('constructor')));
            }
            accesses.push(nref != null ? new Index(nref) : name);
            return (new Value(bref != null ? bref : klass, accesses)).compile(o);
        } else if (method != null ? method.ctor : void 0) {
            return method.name + ".__super__.constructor";
        } else {
            return this.error('cannot call super outside of an instance method. ' + method);
        }
    };

    SuperCall.prototype.superThis = function(o) {
        var method;
        method = o.scope.method;
        return (method && !method.klass && method.context) || "this";
    };

    SuperCall.prototype.compileSplat = function(o, splatArgs) {
        if (splatArgs.length === 1 && splatArgs[0].code === 'arguments' && (this.configParameter != null) && hasFeature(o, 'config_parameters')) {
            return [].concat(this.makeCode("" + (this.configParameterCodeBeforeSuper()) + (this.superReference(o)) + ".apply(" + (this.superThis(o)) + ", "), splatArgs, this.makeCode(")"));
        }
        return SuperCall.__super__.compileSplat.apply(this, arguments);
    };

    SuperCall.prototype.configParameterCodeBeforeSuper = function() {
        var a, param;
        if (!(param = this.configParameter)) {
            return '';
        }
        a = param.objects.map(function(obj) {
            var n, ref4, ref5, t;
            n = obj.variable.base.value;
            if (n === 'this') {
                n = (ref4 = obj.variable.properties) != null ? ref4[0].name.value : void 0;
                return n + ":this." + n;
            } else {
                t = ((ref5 = obj.value.variable) != null ? ref5["this"] : void 0) && 'this.' || '';
                return n + ":" + (t + n);
            }
        });
        return "arguments[0] = _.defaults({" + (a.join(',')) + "}, arguments[0]); ";
    };

    return SuperCall;

})(Call);

exports.RegexWithInterpolations = RegexWithInterpolations = (function(superClass1) {
    extend1(RegexWithInterpolations, superClass1);

    function RegexWithInterpolations(args) {
        if (args == null) {
            args = [];
        }
        RegexWithInterpolations.__super__.constructor.call(this, new Value(new IdentifierLiteral('RegExp')), args, false);
    }

    return RegexWithInterpolations;

})(Call);

exports.TaggedTemplateCall = TaggedTemplateCall = (function(superClass1) {
    extend1(TaggedTemplateCall, superClass1);

    function TaggedTemplateCall(variable, arg, soak) {
        if (arg instanceof StringLiteral) {
            arg = new StringWithInterpolations(Block.wrap([new Value(arg)]));
        }
        TaggedTemplateCall.__super__.constructor.call(this, variable, [arg], soak);
    }

    TaggedTemplateCall.prototype.compileNode = function(o) {
        o.inTaggedTemplateCall = true;
        return this.variable.compileToFragments(o, LEVEL_ACCESS).concat(this.args[0].compileToFragments(o, LEVEL_LIST));
    };

    return TaggedTemplateCall;

})(Call);

exports.Extends = Extends = (function(superClass1) {
    extend1(Extends, superClass1);

    function Extends(child1, parent1) {
        this.child = child1;
        this.parent = parent1;
    }

    Extends.prototype.children = ['child', 'parent'];

    Extends.prototype.compileToFragments = function(o) {
        return new Call(new Value(new Literal(utility('extend', o))), [this.child, this.parent]).compileToFragments(o);
    };

    return Extends;

})(Base);

exports.Access = Access = (function(superClass1) {
    extend1(Access, superClass1);

    function Access(name1, tag) {
        this.name = name1;
        this.soak = tag === 'soak';
    }

    Access.prototype.children = ['name'];

    Access.prototype.compileToFragments = function(o) {
        var name, node, ref4;
        name = this.name.compileToFragments(o);
        node = this.name.unwrap();
        if (node instanceof PropertyName) {
            if (ref4 = node.value, indexOf.call(JS_FORBIDDEN, ref4) >= 0) {
                return [this.makeCode('["')].concat(slice.call(name), [this.makeCode('"]')]);
            } else {
                return [this.makeCode('.')].concat(slice.call(name));
            }
        } else {
            return [this.makeCode('[')].concat(slice.call(name), [this.makeCode(']')]);
        }
    };

    Access.prototype.isComplex = NO;

    return Access;

})(Base);

exports.Index = Index = (function(superClass1) {
    extend1(Index, superClass1);

    function Index(index1) {
        this.index = index1;
    }

    Index.prototype.children = ['index'];

    Index.prototype.compileToFragments = function(o) {
        return [].concat(this.makeCode("["), this.index.compileToFragments(o, LEVEL_PAREN), this.makeCode("]"));
    };

    Index.prototype.isComplex = function() {
        return this.index.isComplex();
    };

    return Index;

})(Base);

exports.Range = Range = (function(superClass1) {
    extend1(Range, superClass1);

    Range.prototype.children = ['from', 'to'];

    function Range(from1, to1, tag) {
        this.from = from1;
        this.to = to1;
        this.exclusive = tag === 'exclusive';
        this.equals = this.exclusive ? '' : '=';
    }

    Range.prototype.compileVariables = function(o) {
        var isComplex, ref4, ref5, ref6, step;
        o = merge(o, {
            top: true
        });
        isComplex = del(o, 'isComplex');
        ref4 = this.cacheToCodeFragments(this.from.cache(o, LEVEL_LIST, isComplex)), this.fromC = ref4[0], this.fromVar = ref4[1];
        ref5 = this.cacheToCodeFragments(this.to.cache(o, LEVEL_LIST, isComplex)), this.toC = ref5[0], this.toVar = ref5[1];
        if (step = del(o, 'step')) {
            ref6 = this.cacheToCodeFragments(step.cache(o, LEVEL_LIST, isComplex)), this.step = ref6[0], this.stepVar = ref6[1];
        }
        this.fromNum = this.from.isNumber() ? Number(this.fromVar) : null;
        this.toNum = this.to.isNumber() ? Number(this.toVar) : null;
        return this.stepNum = (step != null ? step.isNumber() : void 0) ? Number(this.stepVar) : null;
    };

    Range.prototype.compileNode = function(o) {
        var cond, condPart, from, gt, idx, idxName, known, lt, namedIndex, ref4, ref5, stepPart, to, varPart;
        if (!this.fromVar) {
            this.compileVariables(o);
        }
        if (!o.index) {
            return this.compileArray(o);
        }
        known = (this.fromNum != null) && (this.toNum != null);
        idx = del(o, 'index');
        idxName = del(o, 'name');
        namedIndex = idxName && idxName !== idx;
        varPart = idx + " = " + this.fromC;
        if (this.toC !== this.toVar) {
            varPart += ", " + this.toC;
        }
        if (this.step !== this.stepVar) {
            varPart += ", " + this.step;
        }
        ref4 = [idx + " <" + this.equals, idx + " >" + this.equals], lt = ref4[0], gt = ref4[1];
        condPart = this.stepNum != null ? this.stepNum > 0 ? lt + " " + this.toVar : gt + " " + this.toVar : known ? ((ref5 = [this.fromNum, this.toNum], from = ref5[0], to = ref5[1], ref5), from <= to ? lt + " " + to : gt + " " + to) : (cond = this.stepVar ? this.stepVar + " > 0" : this.fromVar + " <= " + this.toVar, cond + " ? " + lt + " " + this.toVar + " : " + gt + " " + this.toVar);
        stepPart = this.stepVar ? idx + " += " + this.stepVar : known ? namedIndex ? from <= to ? "++" + idx : "--" + idx : from <= to ? idx + "++" : idx + "--" : namedIndex ? cond + " ? ++" + idx + " : --" + idx : cond + " ? " + idx + "++ : " + idx + "--";
        if (namedIndex) {
            varPart = idxName + " = " + varPart;
        }
        if (namedIndex) {
            stepPart = idxName + " = " + stepPart;
        }
        return [this.makeCode(varPart + "; " + condPart + "; " + stepPart)];
    };

    Range.prototype.compileArray = function(o) {
        var args, body, cond, hasArgs, i, idt, j, known, post, pre, range, ref4, ref5, result, results, vars;
        known = (this.fromNum != null) && (this.toNum != null);
        if (known && Math.abs(this.fromNum - this.toNum) <= 20) {
            range = (function() {
                results = [];
                for (var j = ref4 = this.fromNum, ref5 = this.toNum; ref4 <= ref5 ? j <= ref5 : j >= ref5; ref4 <= ref5 ? j++ : j--){ results.push(j); }
                return results;
            }).apply(this);
            if (this.exclusive) {
                range.pop();
            }
            return [this.makeCode("[" + (range.join(', ')) + "]")];
        }
        idt = this.tab + TAB;
        i = o.scope.freeVariable('i', {
            single: true
        });
        result = o.scope.freeVariable('results');
        pre = "\n" + idt + result + " = [];";
        if (known) {
            o.index = i;
            body = this.fragmentsToText(this.compileNode(o));
        } else {
            vars = (i + " = " + this.fromC) + (this.toC !== this.toVar ? ", " + this.toC : '');
            cond = this.fromVar + " <= " + this.toVar;
            body = "var " + vars + "; " + cond + " ? " + i + " <" + this.equals + " " + this.toVar + " : " + i + " >" + this.equals + " " + this.toVar + "; " + cond + " ? " + i + "++ : " + i + "--";
        }
        post = "{ " + result + ".push(" + i + "); }\n" + idt + "return " + result + ";\n" + o.indent;
        hasArgs = function(node) {
            return node != null ? node.contains(isLiteralArguments) : void 0;
        };
        if (hasArgs(this.from) || hasArgs(this.to)) {
            args = ', arguments';
        }
        return [this.makeCode("(function() {" + pre + "\n" + idt + "for (" + body + ")" + post + "}).apply(this" + (args != null ? args : '') + ")")];
    };

    return Range;

})(Base);

exports.Slice = Slice = (function(superClass1) {
    extend1(Slice, superClass1);

    Slice.prototype.children = ['range'];

    function Slice(range1) {
        this.range = range1;
        Slice.__super__.constructor.call(this);
    }

    Slice.prototype.compileNode = function(o) {
        var compiled, compiledText, from, fromCompiled, ref4, to, toStr;
        ref4 = this.range, to = ref4.to, from = ref4.from;
        fromCompiled = from && from.compileToFragments(o, LEVEL_PAREN) || [this.makeCode('0')];
        if (to) {
            compiled = to.compileToFragments(o, LEVEL_PAREN);
            compiledText = this.fragmentsToText(compiled);
            if (!(!this.range.exclusive && +compiledText === -1)) {
                toStr = ', ' + (this.range.exclusive ? compiledText : to.isNumber() ? "" + (+compiledText + 1) : (compiled = to.compileToFragments(o, LEVEL_ACCESS), "+" + (this.fragmentsToText(compiled)) + " + 1 || 9e9"));
            }
        }
        return [this.makeCode(".slice(" + (this.fragmentsToText(fromCompiled)) + (toStr || '') + ")")];
    };

    return Slice;

})(Base);

exports.Obj = Obj = (function(superClass1) {
    extend1(Obj, superClass1);

    function Obj(props, generated) {
        this.generated = generated != null ? generated : false;
        this.objects = this.properties = props || [];
    }

    Obj.prototype.children = ['properties'];

    Obj.prototype.compileNode = function(o) {
        var answer, dynamicIndex, hasDynamic, i, idt, indent, j, join, k, key, l, lastNoncom, len1, len2, len3, node, oref, prop, props, ref4, value;
        props = this.properties;
        if (this.generated) {
            for (j = 0, len1 = props.length; j < len1; j++) {
                node = props[j];
                if (node instanceof Value) {
                    node.error('cannot have an implicit value in an implicit object');
                }
            }
        }
        for (dynamicIndex = k = 0, len2 = props.length; k < len2; dynamicIndex = ++k) {
            prop = props[dynamicIndex];
            if ((prop.variable || prop).base instanceof Parens) {
                break;
            }
        }
        hasDynamic = dynamicIndex < props.length;
        idt = o.indent += TAB;
        lastNoncom = this.lastNonComment(this.properties);
        answer = [];
        if (hasDynamic) {
            oref = o.scope.freeVariable('obj');
            answer.push(this.makeCode("(\n" + idt + oref + " = "));
        }
        answer.push(this.makeCode("{" + (props.length === 0 || dynamicIndex === 0 ? '}' : '\n')));
        for (i = l = 0, len3 = props.length; l < len3; i = ++l) {
            prop = props[i];
            if (i === dynamicIndex) {
                if (i !== 0) {
                    answer.push(this.makeCode("\n" + idt + "}"));
                }
                answer.push(this.makeCode(',\n'));
            }
            join = i === props.length - 1 || i === dynamicIndex - 1 ? '' : prop === lastNoncom || prop instanceof Comment ? '\n' : ',\n';
            indent = prop instanceof Comment ? '' : idt;
            if (hasDynamic && i < dynamicIndex) {
                indent += TAB;
            }
            if (prop instanceof Assign) {
                if (prop.context !== 'object') {
                    prop.operatorToken.error("unexpected " + prop.operatorToken.value);
                }
                if (prop.variable instanceof Value && prop.variable.hasProperties()) {
                    prop.variable.error('invalid object key');
                }
            }
            if (prop instanceof Value && prop["this"]) {
                prop = new Assign(prop.properties[0].name, prop, 'object');
            }
            if (!(prop instanceof Comment)) {
                if (i < dynamicIndex) {
                    if (!(prop instanceof Assign)) {
                        prop = new Assign(prop, prop, 'object');
                    }
                } else {
                    if (prop instanceof Assign) {
                        key = prop.variable;
                        value = prop.value;
                    } else {
                        ref4 = prop.base.cache(o), key = ref4[0], value = ref4[1];
                        if (key instanceof IdentifierLiteral) {
                            key = new PropertyName(key.value);
                        }
                    }
                    prop = new Assign(new Value(new IdentifierLiteral(oref), [new Access(key)]), value);
                }
            }
            if (indent) {
                answer.push(this.makeCode(indent));
            }
            answer.push.apply(answer, prop.compileToFragments(o, LEVEL_TOP));
            if (join) {
                answer.push(this.makeCode(join));
            }
        }
        if (hasDynamic) {
            answer.push(this.makeCode(",\n" + idt + oref + "\n" + this.tab + ")"));
        } else {
            if (props.length !== 0) {
                answer.push(this.makeCode("\n" + this.tab + "}"));
            }
        }
        if (this.front && !hasDynamic) {
            return this.wrapInBraces(answer);
        } else {
            return answer;
        }
    };

    Obj.prototype.assigns = function(name) {
        var j, len1, prop, ref4;
        ref4 = this.properties;
        for (j = 0, len1 = ref4.length; j < len1; j++) {
            prop = ref4[j];
            if (prop.assigns(name)) {
                return true;
            }
        }
        return false;
    };

    return Obj;

})(Base);

exports.Arr = Arr = (function(superClass1) {
    extend1(Arr, superClass1);

    function Arr(objs) {
        this.objects = objs || [];
    }

    Arr.prototype.children = ['objects'];

    Arr.prototype.compileNode = function(o) {
        var answer, compiledObjs, fragments, index, j, len1, obj;
        if (!this.objects.length) {
            return [this.makeCode('[]')];
        }
        o.indent += TAB;
        answer = Splat.compileSplattedArray(o, this.objects);
        if (answer.length) {
            return answer;
        }
        answer = [];
        compiledObjs = (function() {
            var j, len1, ref4, results;
            ref4 = this.objects;
            results = [];
            for (j = 0, len1 = ref4.length; j < len1; j++) {
                obj = ref4[j];
                results.push(obj.compileToFragments(o, LEVEL_LIST));
            }
            return results;
        }).call(this);
        for (index = j = 0, len1 = compiledObjs.length; j < len1; index = ++j) {
            fragments = compiledObjs[index];
            if (index) {
                answer.push(this.makeCode(", "));
            }
            answer.push.apply(answer, fragments);
        }
        if (this.fragmentsToText(answer).indexOf('\n') >= 0) {
            answer.unshift(this.makeCode("[\n" + o.indent));
            answer.push(this.makeCode("\n" + this.tab + "]"));
        } else {
            answer.unshift(this.makeCode("["));
            answer.push(this.makeCode("]"));
        }
        return answer;
    };

    Arr.prototype.assigns = function(name) {
        var j, len1, obj, ref4;
        ref4 = this.objects;
        for (j = 0, len1 = ref4.length; j < len1; j++) {
            obj = ref4[j];
            if (obj.assigns(name)) {
                return true;
            }
        }
        return false;
    };

    return Arr;

})(Base);

exports.Class = Class = (function(superClass1) {
    extend1(Class, superClass1);

    function Class(variable1, parent1, body1) {
        this.variable = variable1;
        this.parent = parent1;
        this.body = body1 != null ? body1 : new Block;
        this.boundFuncs = [];
        this.body.classBody = true;
    }

    Class.prototype.children = ['variable', 'parent', 'body'];

    Class.prototype.defaultClassVariableName = '_Class';

    Class.prototype.determineName = function() {
        var message, name, node, ref4, tail;
        if (!this.variable) {
            return this.defaultClassVariableName;
        }
        ref4 = this.variable.properties, tail = ref4[ref4.length - 1];
        node = tail ? tail instanceof Access && tail.name : this.variable.base;
        if (!(node instanceof IdentifierLiteral || node instanceof PropertyName)) {
            return this.defaultClassVariableName;
        }
        name = node.value;
        if (!tail) {
            message = isUnassignable(name);
            if (message) {
                this.variable.error(message);
            }
        }
        if (indexOf.call(JS_FORBIDDEN, name) >= 0) {
            return "_" + name;
        } else {
            return name;
        }
    };

    Class.prototype.setContext = function(name) {
        return this.body.traverseChildren(false, function(node) {
            if (node.classBody) {
                return false;
            }
            if (node instanceof ThisLiteral) {
                return node.value = name;
            } else if (node instanceof Code) {
                if (node.bound) {
                    return node.context = name;
                }
            }
        });
    };

    Class.prototype.addBoundFunctions = function(o) {
        var bvar, j, len1, lhs, ref4;
        ref4 = this.boundFuncs;
        for (j = 0, len1 = ref4.length; j < len1; j++) {
            bvar = ref4[j];
            lhs = (new Value(new ThisLiteral, [new Access(bvar)])).compile(o);
            this.ctor.body.unshift(new Literal(lhs + " = " + (utility('bind', o)) + "(" + lhs + ", this)"));
        }
    };

    Class.prototype.addProperties = function(node, name, o) {
        var acc, assign, base, exprs, func, props;
        props = node.base.properties.slice(0);
        exprs = (function() {
            var results;
            results = [];
            while (assign = props.shift()) {
                if (assign instanceof Assign) {
                    base = assign.variable.base;
                    delete assign.context;
                    func = assign.value;
                    if (base.value === 'constructor') {
                        if (this.ctor) {
                            assign.error('cannot define more than one constructor in a class');
                        }
                        if (func.bound) {
                            assign.error('cannot define a constructor as a bound function');
                        }
                        if (func instanceof Code) {
                            assign = this.ctor = func;
                        } else {
                            this.externalCtor = o.classScope.freeVariable('ctor');
                            assign = new Assign(new IdentifierLiteral(this.externalCtor), func);
                        }
                    } else {
                        if (assign.variable["this"]) {
                            func["static"] = true;
                        } else {
                            acc = base.isComplex() ? new Index(base) : new Access(base);
                            assign.variable = new Value(new IdentifierLiteral(name), [new Access(new PropertyName('prototype')), acc]);
                            if (func instanceof Code && func.bound) {
                                this.boundFuncs.push(base);
                                func.bound = false;
                            }
                        }
                    }
                }
                results.push(assign);
            }
            return results;
        }).call(this);
        return compact(exprs);
    };

    Class.prototype.walkBody = function(name, o) {
        return this.traverseChildren(false, (function(_this) {
            return function(child) {
                var cont, exps, i, j, len1, node, ref4;
                cont = true;
                if (child instanceof Class) {
                    return false;
                }
                if (child instanceof Block) {
                    ref4 = exps = child.expressions;
                    for (i = j = 0, len1 = ref4.length; j < len1; i = ++j) {
                        node = ref4[i];
                        if (node instanceof Assign && node.variable.looksStatic(name)) {
                            node.value["static"] = true;
                        } else if (node instanceof Value && node.isObject(true)) {
                            cont = false;
                            exps[i] = _this.addProperties(node, name, o);
                        }
                    }
                    child.expressions = exps = flatten(exps);
                    if (child.classBody && hasFeature(o, 'config_parameters')) {
                        _this.prepareSuperCallForConfigParams(name, o, child);
                    }
                }
                return cont && !(child instanceof Class);
            };
        })(this));
    };

    Class.prototype.prepareSuperCallForConfigParams = function(name, o, classBody) {
        var bodyExpr, expr, j, k, len1, len2, param0, ref4, ref5, ref6;
        ref4 = classBody.expressions;
        for (j = 0, len1 = ref4.length; j < len1; j++) {
            expr = ref4[j];
            if (expr instanceof Code) {
                if (!((ref5 = expr.params[0]) != null ? ref5.name : void 0)) {
                    continue;
                }
                param0 = expr.params[0].name;
                if (!param0.generated) {
                    return;
                }
                if (!param0 instanceof Obj) {
                    return console.log('CONSTRUCTOR PARAM0 NOT AN OBJ?');
                }
                if (!expr.body instanceof Block) {
                    return console.log('CONSTRUCTOR BODY NOT AN BLOCK?');
                }
                ref6 = expr.body.expressions;
                for (k = 0, len2 = ref6.length; k < len2; k++) {
                    bodyExpr = ref6[k];
                    if (bodyExpr instanceof SuperCall) {
                        bodyExpr.configParameter = param0;
                    }
                }
            }
        }
    };

    Class.prototype.hoistDirectivePrologue = function() {
        var expressions, index, node;
        index = 0;
        expressions = this.body.expressions;
        while ((node = expressions[index]) && node instanceof Comment || node instanceof Value && node.isString()) {
            ++index;
        }
        return this.directives = expressions.splice(0, index);
    };

    Class.prototype.ensureConstructor = function(name) {
        if (!this.ctor) {
            this.ctor = new Code;
            if (this.externalCtor) {
                this.ctor.body.push(new Literal(this.externalCtor + ".apply(this, arguments)"));
            } else if (this.parent) {
                this.ctor.body.push(new Literal(name + ".__super__.constructor.apply(this, arguments)"));
            }
            this.ctor.body.makeReturn();
            this.body.expressions.unshift(this.ctor);
        }
        this.ctor.ctor = this.ctor.name = name;
        this.ctor.klass = null;
        return this.ctor.noReturn = true;
    };

    Class.prototype.compileNode = function(o) {
        var args, argumentsNode, func, jumpNode, klass, lname, name, ref4, superClass;
        if (jumpNode = this.body.jumps()) {
            jumpNode.error('Class bodies cannot contain pure statements');
        }
        if (argumentsNode = this.body.contains(isLiteralArguments)) {
            argumentsNode.error("Class bodies shouldn't reference arguments");
        }
        name = this.determineName();
        lname = new IdentifierLiteral(name);
        func = new Code([], Block.wrap([this.body]));
        args = [];
        o.classScope = func.makeScope(o.scope);
        this.hoistDirectivePrologue();
        this.setContext(name);
        this.walkBody(name, o);
        this.ensureConstructor(name);
        this.addBoundFunctions(o);
        this.body.spaced = true;
        this.body.expressions.push(lname);
        if (this.parent) {
            superClass = new IdentifierLiteral(o.classScope.freeVariable('superClass', {
                reserve: false
            }));
            this.body.expressions.unshift(new Extends(lname, superClass));
            func.params.push(new Param(superClass));
            args.push(this.parent);
        }
        (ref4 = this.body.expressions).unshift.apply(ref4, this.directives);
        klass = new Parens(new Call(func, args));
        if (this.variable) {
            klass = new Assign(this.variable, klass, null, {
                moduleDeclaration: this.moduleDeclaration
            });
        }
        return klass.compileToFragments(o);
    };

    return Class;

})(Base);

exports.ModuleDeclaration = ModuleDeclaration = (function(superClass1) {
    extend1(ModuleDeclaration, superClass1);

    function ModuleDeclaration(clause, source1) {
        this.clause = clause;
        this.source = source1;
        this.checkSource();
    }

    ModuleDeclaration.prototype.children = ['clause', 'source'];

    ModuleDeclaration.prototype.isStatement = YES;

    ModuleDeclaration.prototype.jumps = THIS;

    ModuleDeclaration.prototype.makeReturn = THIS;

    ModuleDeclaration.prototype.checkSource = function() {
        if ((this.source != null) && this.source instanceof StringWithInterpolations) {
            return this.source.error('the name of the module to be imported from must be an uninterpolated string');
        }
    };

    ModuleDeclaration.prototype.checkScope = function(o, moduleDeclarationType) {
        if (o.indent.length !== 0) {
            return this.error(moduleDeclarationType + " statements must be at top-level scope");
        }
    };

    return ModuleDeclaration;

})(Base);

exports.ImportDeclaration = ImportDeclaration = (function(superClass1) {
    extend1(ImportDeclaration, superClass1);

    function ImportDeclaration() {
        return ImportDeclaration.__super__.constructor.apply(this, arguments);
    }

    ImportDeclaration.prototype.compileNode = function(o) {
        var code, ref4;
        this.checkScope(o, 'import');
        o.importedSymbols = [];
        code = [];
        code.push(this.makeCode(this.tab + "import "));
        if (this.clause != null) {
            code.push.apply(code, this.clause.compileNode(o));
        }
        if (((ref4 = this.source) != null ? ref4.value : void 0) != null) {
            if (this.clause !== null) {
                code.push(this.makeCode(' from '));
            }
            code.push(this.makeCode(this.source.value));
        }
        code.push(this.makeCode(';'));
        return code;
    };

    return ImportDeclaration;

})(ModuleDeclaration);

exports.ImportClause = ImportClause = (function(superClass1) {
    extend1(ImportClause, superClass1);

    function ImportClause(defaultBinding, namedImports) {
        this.defaultBinding = defaultBinding;
        this.namedImports = namedImports;
    }

    ImportClause.prototype.children = ['defaultBinding', 'namedImports'];

    ImportClause.prototype.compileNode = function(o) {
        var code;
        code = [];
        if (this.defaultBinding != null) {
            code.push.apply(code, this.defaultBinding.compileNode(o));
            if (this.namedImports != null) {
                code.push(this.makeCode(', '));
            }
        }
        if (this.namedImports != null) {
            code.push.apply(code, this.namedImports.compileNode(o));
        }
        return code;
    };

    return ImportClause;

})(Base);

exports.ExportDeclaration = ExportDeclaration = (function(superClass1) {
    extend1(ExportDeclaration, superClass1);

    function ExportDeclaration() {
        return ExportDeclaration.__super__.constructor.apply(this, arguments);
    }

    ExportDeclaration.prototype.compileNode = function(o) {
        var code, ref4;
        this.checkScope(o, 'export');
        code = [];
        code.push(this.makeCode(this.tab + "export "));
        if (this instanceof ExportDefaultDeclaration) {
            code.push(this.makeCode('default '));
        }
        if (!(this instanceof ExportDefaultDeclaration) && (this.clause instanceof Assign || this.clause instanceof Class)) {
            if (this.clause instanceof Class && !this.clause.variable) {
                this.clause.error('anonymous classes cannot be exported');
            }
            code.push(this.makeCode('var '));
            this.clause.moduleDeclaration = 'export';
        }
        if ((this.clause.body != null) && this.clause.body instanceof Block) {
            code = code.concat(this.clause.compileToFragments(o, LEVEL_TOP));
        } else {
            code = code.concat(this.clause.compileNode(o));
        }
        if (((ref4 = this.source) != null ? ref4.value : void 0) != null) {
            code.push(this.makeCode(" from " + this.source.value));
        }
        code.push(this.makeCode(';'));
        return code;
    };

    return ExportDeclaration;

})(ModuleDeclaration);

exports.ExportNamedDeclaration = ExportNamedDeclaration = (function(superClass1) {
    extend1(ExportNamedDeclaration, superClass1);

    function ExportNamedDeclaration() {
        return ExportNamedDeclaration.__super__.constructor.apply(this, arguments);
    }

    return ExportNamedDeclaration;

})(ExportDeclaration);

exports.ExportDefaultDeclaration = ExportDefaultDeclaration = (function(superClass1) {
    extend1(ExportDefaultDeclaration, superClass1);

    function ExportDefaultDeclaration() {
        return ExportDefaultDeclaration.__super__.constructor.apply(this, arguments);
    }

    return ExportDefaultDeclaration;

})(ExportDeclaration);

exports.ExportAllDeclaration = ExportAllDeclaration = (function(superClass1) {
    extend1(ExportAllDeclaration, superClass1);

    function ExportAllDeclaration() {
        return ExportAllDeclaration.__super__.constructor.apply(this, arguments);
    }

    return ExportAllDeclaration;

})(ExportDeclaration);

exports.ModuleSpecifierList = ModuleSpecifierList = (function(superClass1) {
    extend1(ModuleSpecifierList, superClass1);

    function ModuleSpecifierList(specifiers) {
        this.specifiers = specifiers;
    }

    ModuleSpecifierList.prototype.children = ['specifiers'];

    ModuleSpecifierList.prototype.compileNode = function(o) {
        var code, compiledList, fragments, index, j, len1, specifier;
        code = [];
        o.indent += TAB;
        compiledList = (function() {
            var j, len1, ref4, results;
            ref4 = this.specifiers;
            results = [];
            for (j = 0, len1 = ref4.length; j < len1; j++) {
                specifier = ref4[j];
                results.push(specifier.compileToFragments(o, LEVEL_LIST));
            }
            return results;
        }).call(this);
        if (this.specifiers.length !== 0) {
            code.push(this.makeCode("{\n" + o.indent));
            for (index = j = 0, len1 = compiledList.length; j < len1; index = ++j) {
                fragments = compiledList[index];
                if (index) {
                    code.push(this.makeCode(",\n" + o.indent));
                }
                code.push.apply(code, fragments);
            }
            code.push(this.makeCode("\n}"));
        } else {
            code.push(this.makeCode('{}'));
        }
        return code;
    };

    return ModuleSpecifierList;

})(Base);

exports.ImportSpecifierList = ImportSpecifierList = (function(superClass1) {
    extend1(ImportSpecifierList, superClass1);

    function ImportSpecifierList() {
        return ImportSpecifierList.__super__.constructor.apply(this, arguments);
    }

    return ImportSpecifierList;

})(ModuleSpecifierList);

exports.ExportSpecifierList = ExportSpecifierList = (function(superClass1) {
    extend1(ExportSpecifierList, superClass1);

    function ExportSpecifierList() {
        return ExportSpecifierList.__super__.constructor.apply(this, arguments);
    }

    return ExportSpecifierList;

})(ModuleSpecifierList);

exports.ModuleSpecifier = ModuleSpecifier = (function(superClass1) {
    extend1(ModuleSpecifier, superClass1);

    function ModuleSpecifier(original, alias, moduleDeclarationType1) {
        this.original = original;
        this.alias = alias;
        this.moduleDeclarationType = moduleDeclarationType1;
        this.identifier = this.alias != null ? this.alias.value : this.original.value;
    }

    ModuleSpecifier.prototype.children = ['original', 'alias'];

    ModuleSpecifier.prototype.compileNode = function(o) {
        var code;
        o.scope.find(this.identifier, this.moduleDeclarationType);
        code = [];
        code.push(this.makeCode(this.original.value));
        if (this.alias != null) {
            code.push(this.makeCode(" as " + this.alias.value));
        }
        return code;
    };

    return ModuleSpecifier;

})(Base);

exports.ImportSpecifier = ImportSpecifier = (function(superClass1) {
    extend1(ImportSpecifier, superClass1);

    function ImportSpecifier(imported, local) {
        ImportSpecifier.__super__.constructor.call(this, imported, local, 'import');
    }

    ImportSpecifier.prototype.compileNode = function(o) {
        var ref4;
        if ((ref4 = this.identifier, indexOf.call(o.importedSymbols, ref4) >= 0) || o.scope.check(this.identifier)) {
            this.error("'" + this.identifier + "' has already been declared");
        } else {
            o.importedSymbols.push(this.identifier);
        }
        return ImportSpecifier.__super__.compileNode.call(this, o);
    };

    return ImportSpecifier;

})(ModuleSpecifier);

exports.ImportDefaultSpecifier = ImportDefaultSpecifier = (function(superClass1) {
    extend1(ImportDefaultSpecifier, superClass1);

    function ImportDefaultSpecifier() {
        return ImportDefaultSpecifier.__super__.constructor.apply(this, arguments);
    }

    return ImportDefaultSpecifier;

})(ImportSpecifier);

exports.ImportNamespaceSpecifier = ImportNamespaceSpecifier = (function(superClass1) {
    extend1(ImportNamespaceSpecifier, superClass1);

    function ImportNamespaceSpecifier() {
        return ImportNamespaceSpecifier.__super__.constructor.apply(this, arguments);
    }

    return ImportNamespaceSpecifier;

})(ImportSpecifier);

exports.ExportSpecifier = ExportSpecifier = (function(superClass1) {
    extend1(ExportSpecifier, superClass1);

    function ExportSpecifier(local, exported) {
        ExportSpecifier.__super__.constructor.call(this, local, exported, 'export');
    }

    return ExportSpecifier;

})(ModuleSpecifier);

exports.Assign = Assign = (function(superClass1) {
    extend1(Assign, superClass1);

    function Assign(variable1, value1, context, options) {
        this.variable = variable1;
        this.value = value1;
        this.context = context;
        if (options == null) {
            options = {};
        }
        this.param = options.param, this.subpattern = options.subpattern, this.operatorToken = options.operatorToken, this.moduleDeclaration = options.moduleDeclaration;
    }

    Assign.prototype.children = ['variable', 'value'];

    Assign.prototype.isStatement = function(o) {
        return (o != null ? o.level : void 0) === LEVEL_TOP && (this.context != null) && (this.moduleDeclaration || indexOf.call(this.context, "?") >= 0);
    };

    Assign.prototype.checkAssignability = function(o, varBase) {
        if (Object.hasOwn(o.scope.positions, varBase.value) && o.scope.variables[o.scope.positions[varBase.value]].type === 'import') {
            return varBase.error("'" + varBase.value + "' is read-only");
        }
    };

    Assign.prototype.assigns = function(name) {
        return this[this.context === 'object' ? 'value' : 'variable'].assigns(name);
    };

    Assign.prototype.unfoldSoak = function(o) {
        return unfoldSoak(o, this, 'variable');
    };

    Assign.prototype.compileNode = function(o) {
        var answer, compiledName, isValue, j, name, properties, prototype, ref4, ref5, ref6, ref7, ref8, ref9, val, varBase;
        if (isValue = this.variable instanceof Value) {
            if (this.variable.isArray() || this.variable.isObject()) {
                return this.compilePatternMatch(o);
            }
            if (this.variable.isSplice()) {
                return this.compileSplice(o);
            }
            if ((ref4 = this.context) === '||=' || ref4 === '&&=' || ref4 === '?=') {
                return this.compileConditional(o);
            }
            if ((ref5 = this.context) === '**=' || ref5 === '//=' || ref5 === '%%=') {
                return this.compileSpecialMath(o);
            }
        }
        if (this.value instanceof Code) {
            if (this.value["static"]) {
                this.value.klass = this.variable.base;
                this.value.name = this.variable.properties[0];
                this.value.variable = this.variable;
            } else if (((ref6 = this.variable.properties) != null ? ref6.length : void 0) >= 2) {
                ref7 = this.variable.properties, properties = 3 <= ref7.length ? slice.call(ref7, 0, j = ref7.length - 2) : (j = 0, []), prototype = ref7[j++], name = ref7[j++];
                if (((ref8 = prototype.name) != null ? ref8.value : void 0) === 'prototype') {
                    this.value.klass = new Value(this.variable.base, properties);
                    this.value.name = name;
                    this.value.variable = this.variable;
                }
            }
        }
        if (!this.context) {
            varBase = this.variable.unwrapAll();
            if (!varBase.isAssignable()) {
                this.variable.error("'" + (this.variable.compile(o)) + "' can't be assigned");
            }
            if (!(typeof varBase.hasProperties === "function" ? varBase.hasProperties() : void 0)) {
                if (this.moduleDeclaration) {
                    this.checkAssignability(o, varBase);
                    o.scope.add(varBase.value, this.moduleDeclaration);
                } else if (this.param) {
                    o.scope.add(varBase.value, 'var');
                } else {
                    this.checkAssignability(o, varBase);
                    o.scope.find(varBase.value);
                }
            }
        }
        val = this.value.compileToFragments(o, LEVEL_LIST);
        if (isValue && this.variable.base instanceof Obj) {
            this.variable.front = true;
        }
        compiledName = this.variable.compileToFragments(o, LEVEL_LIST);
        if (this.context === 'object') {
            if (ref9 = this.fragmentsToText(compiledName), indexOf.call(JS_FORBIDDEN, ref9) >= 0) {
                compiledName.unshift(this.makeCode('"'));
                compiledName.push(this.makeCode('"'));
            }
            return compiledName.concat(this.makeCode(": "), val);
        }
        answer = compiledName.concat(this.makeCode(" " + (this.context || '=') + " "), val);
        if (o.level <= LEVEL_LIST) {
            return answer;
        } else {
            return this.wrapInBraces(answer);
        }
    };

    Assign.prototype.compilePatternMatch = function(o) {
        var acc, assigns, code, defaultValue, expandedIdx, fragments, i, idx, isObject, ivar, j, len1, message, name, obj, objects, olen, ref, ref4, ref5, ref6, ref7, rest, top, val, value, vvar, vvarText;
        top = o.level === LEVEL_TOP;
        value = this.value;
        objects = this.variable.base.objects;
        if (!(olen = objects.length)) {
            code = value.compileToFragments(o);
            if (o.level >= LEVEL_OP) {
                return this.wrapInBraces(code);
            } else {
                return code;
            }
        }
        obj = objects[0];
        if (olen === 1 && obj instanceof Expansion) {
            obj.error('Destructuring assignment has no target');
        }
        isObject = this.variable.isObject();
        if (top && olen === 1 && !(obj instanceof Splat)) {
            defaultValue = null;
            if (obj instanceof Assign && obj.context === 'object') {
                ref4 = obj, (ref5 = ref4.variable, idx = ref5.base), obj = ref4.value;
                if (obj instanceof Assign) {
                    defaultValue = obj.value;
                    obj = obj.variable;
                }
            } else {
                if (obj instanceof Assign) {
                    defaultValue = obj.value;
                    obj = obj.variable;
                }
                idx = isObject ? obj["this"] ? obj.properties[0].name : new PropertyName(obj.unwrap().value) : new NumberLiteral(0);
            }
            acc = idx.unwrap() instanceof PropertyName;
            value = new Value(value);
            value.properties.push(new (acc ? Access : Index)(idx));
            message = isUnassignable(obj.unwrap().value);
            if (message) {
                obj.error(message);
            }
            if (defaultValue) {
                value = new Op('?', value, defaultValue);
            }
            return new Assign(obj, value, null, {
                param: this.param
            }).compileToFragments(o, LEVEL_TOP);
        }
        vvar = value.compileToFragments(o, LEVEL_LIST);
        vvarText = this.fragmentsToText(vvar);
        assigns = [];
        expandedIdx = false;
        if (!(value.unwrap() instanceof IdentifierLiteral) || this.variable.assigns(vvarText)) {
            assigns.push([this.makeCode((ref = o.scope.freeVariable('ref')) + " = ")].concat(slice.call(vvar)));
            vvar = [this.makeCode(ref)];
            vvarText = ref;
        }
        for (i = j = 0, len1 = objects.length; j < len1; i = ++j) {
            obj = objects[i];
            idx = i;
            if (!expandedIdx && obj instanceof Splat) {
                name = obj.name.unwrap().value;
                obj = obj.unwrap();
                val = olen + " <= " + vvarText + ".length ? " + (utility('slice', o)) + ".call(" + vvarText + ", " + i;
                if (rest = olen - i - 1) {
                    ivar = o.scope.freeVariable('i', {
                        single: true
                    });
                    val += ", " + ivar + " = " + vvarText + ".length - " + rest + ") : (" + ivar + " = " + i + ", [])";
                } else {
                    val += ") : []";
                }
                val = new Literal(val);
                expandedIdx = ivar + "++";
            } else if (!expandedIdx && obj instanceof Expansion) {
                if (rest = olen - i - 1) {
                    if (rest === 1) {
                        expandedIdx = vvarText + ".length - 1";
                    } else {
                        ivar = o.scope.freeVariable('i', {
                            single: true
                        });
                        val = new Literal(ivar + " = " + vvarText + ".length - " + rest);
                        expandedIdx = ivar + "++";
                        assigns.push(val.compileToFragments(o, LEVEL_LIST));
                    }
                }
                continue;
            } else {
                if (obj instanceof Splat || obj instanceof Expansion) {
                    obj.error("multiple splats/expansions are disallowed in an assignment");
                }
                defaultValue = null;
                if (obj instanceof Assign && obj.context === 'object') {
                    ref6 = obj, (ref7 = ref6.variable, idx = ref7.base), obj = ref6.value;
                    if (obj instanceof Assign) {
                        defaultValue = obj.value;
                        obj = obj.variable;
                    }
                } else {
                    if (obj instanceof Assign) {
                        defaultValue = obj.value;
                        obj = obj.variable;
                    }
                    idx = isObject ? obj["this"] ? obj.properties[0].name : new PropertyName(obj.unwrap().value) : new Literal(expandedIdx || idx);
                }
                name = obj.unwrap().value;
                acc = idx.unwrap() instanceof PropertyName;
                val = new Value(new Literal(vvarText), [new (acc ? Access : Index)(idx)]);
                if (defaultValue) {
                    val = new Op('?', val, defaultValue);
                }
            }
            if (name != null) {
                message = isUnassignable(name);
                if (message) {
                    obj.error(message);
                }
            }
            assigns.push(new Assign(obj, val, null, {
                param: this.param,
                subpattern: true
            }).compileToFragments(o, LEVEL_LIST));
        }
        if (!(top || this.subpattern)) {
            assigns.push(vvar);
        }
        fragments = this.joinFragmentArrays(assigns, ', ');
        if (o.level < LEVEL_LIST) {
            return fragments;
        } else {
            return this.wrapInBraces(fragments);
        }
    };

    Assign.prototype.compileConditional = function(o) {
        var fragments, left, ref4, right;
        ref4 = this.variable.cacheReference(o), left = ref4[0], right = ref4[1];
        if (!left.properties.length && left.base instanceof Literal && !(left.base instanceof ThisLiteral) && !o.scope.check(left.base.value)) {
            this.variable.error("the variable \"" + left.base.value + "\" can't be assigned with " + this.context + " because it has not been declared before");
        }
        if (indexOf.call(this.context, "?") >= 0) {
            o.isExistentialEquals = true;
            return new If(new Existence(left), right, {
                type: 'if'
            }).addElse(new Assign(right, this.value, '=')).compileToFragments(o);
        } else {
            fragments = new Op(this.context.slice(0, -1), left, new Assign(right, this.value, '=')).compileToFragments(o);
            if (o.level <= LEVEL_LIST) {
                return fragments;
            } else {
                return this.wrapInBraces(fragments);
            }
        }
    };

    Assign.prototype.compileSpecialMath = function(o) {
        var left, ref4, right;
        ref4 = this.variable.cacheReference(o), left = ref4[0], right = ref4[1];
        return new Assign(left, new Op(this.context.slice(0, -1), right, this.value)).compileToFragments(o);
    };

    Assign.prototype.compileSplice = function(o) {
        var answer, exclusive, from, fromDecl, fromRef, name, ref4, ref5, ref6, to, valDef, valRef;
        ref4 = this.variable.properties.pop().range, from = ref4.from, to = ref4.to, exclusive = ref4.exclusive;
        name = this.variable.compile(o);
        if (from) {
            ref5 = this.cacheToCodeFragments(from.cache(o, LEVEL_OP)), fromDecl = ref5[0], fromRef = ref5[1];
        } else {
            fromDecl = fromRef = '0';
        }
        if (to) {
            if ((from != null ? from.isNumber() : void 0) && to.isNumber()) {
                to = to.compile(o) - fromRef;
                if (!exclusive) {
                    to += 1;
                }
            } else {
                to = to.compile(o, LEVEL_ACCESS) + ' - ' + fromRef;
                if (!exclusive) {
                    to += ' + 1';
                }
            }
        } else {
            to = "9e9";
        }
        ref6 = this.value.cache(o, LEVEL_LIST), valDef = ref6[0], valRef = ref6[1];
        answer = [].concat(this.makeCode("[].splice.apply(" + name + ", [" + fromDecl + ", " + to + "].concat("), valDef, this.makeCode(")), "), valRef);
        if (o.level > LEVEL_TOP) {
            return this.wrapInBraces(answer);
        } else {
            return answer;
        }
    };

    return Assign;

})(Base);

exports.Code = Code = (function(superClass1) {
    extend1(Code, superClass1);

    function Code(params, body, tag) {
        this.params = params || [];
        this.body = body || new Block;
        this.bound = tag === 'boundfunc';
        this.isGenerator = !!this.body.contains(function(node) {
            return (node instanceof Op && node.isYield()) || node instanceof YieldReturn;
        });
    }

    Code.prototype.children = ['params', 'body'];

    Code.prototype.isStatement = function() {
        return !!this.ctor;
    };

    Code.prototype.jumps = NO;

    Code.prototype.makeScope = function(parentScope) {
        return new Scope(parentScope, this.body, this);
    };

    Code.prototype.compileNode = function(o) {
        var answer, boundfunc, code, exprs, i, j, k, l, len1, len2, len3, len4, len5, len6, lit, m, p, param, params, q, r, ref, ref4, ref5, ref6, ref7, ref8, ref9, splats, uniqs, val, wasEmpty, wrapper;
        if (this.bound && ((ref4 = o.scope.method) != null ? ref4.bound : void 0)) {
            this.context = o.scope.method.context;
        }
        if (this.bound && !this.context) {
            this.context = '_this';
            wrapper = new Code([new Param(new IdentifierLiteral(this.context))], new Block([this]));
            boundfunc = new Call(wrapper, [new ThisLiteral]);
            boundfunc.updateLocationDataIfMissing(this.locationData);
            return boundfunc.compileNode(o);
        }
        o.scope = del(o, 'classScope') || this.makeScope(o.scope);
        o.scope.shared = del(o, 'sharedScope');
        o.indent += TAB;
        delete o.bare;
        delete o.isExistentialEquals;
        params = [];
        exprs = [];
        ref5 = this.params;
        for (j = 0, len1 = ref5.length; j < len1; j++) {
            param = ref5[j];
            if (!(param instanceof Expansion)) {
                o.scope.parameter(param.asReference(o));
            }
        }
        ref6 = this.params;
        for (k = 0, len2 = ref6.length; k < len2; k++) {
            param = ref6[k];
            if (!(param.splat || param instanceof Expansion)) {
                continue;
            }
            ref7 = this.params;
            for (l = 0, len3 = ref7.length; l < len3; l++) {
                p = ref7[l];
                if (!(p instanceof Expansion) && p.name.value) {
                    o.scope.add(p.name.value, 'var', true);
                }
            }
            splats = new Assign(new Value(new Arr((function() {
                var len4, m, ref8, results;
                ref8 = this.params;
                results = [];
                for (m = 0, len4 = ref8.length; m < len4; m++) {
                    p = ref8[m];
                    results.push(p.asReference(o));
                }
                return results;
            }).call(this))), new Value(new IdentifierLiteral('arguments')));
            break;
        }
        ref8 = this.params;
        for (m = 0, len4 = ref8.length; m < len4; m++) {
            param = ref8[m];
            if (param.isComplex()) {
                val = ref = param.asReference(o);
                if (param.value) {
                    val = new Op('?', ref, param.value);
                }
                exprs.push(new Assign(new Value(param.name), val, '=', {
                    param: true
                }));
            } else {
                ref = param;
                if (param.value) {
                    lit = new Literal(ref.name.value + ' == null');
                    val = new Assign(new Value(param.name), param.value, '=');
                    exprs.push(new If(lit, val));
                }
            }
            if (!splats) {
                params.push(ref);
            }
        }
        wasEmpty = this.body.isEmpty();
        if (splats) {
            exprs.unshift(splats);
        }
        if (exprs.length) {
            (ref9 = this.body.expressions).unshift.apply(ref9, exprs);
        }
        for (i = q = 0, len5 = params.length; q < len5; i = ++q) {
            p = params[i];
            params[i] = p.compileToFragments(o);
            o.scope.parameter(this.fragmentsToText(params[i]));
        }
        uniqs = [];
        this.eachParamName(function(name, node) {
            if (indexOf.call(uniqs, name) >= 0) {
                node.error("multiple parameters named " + name);
            }
            return uniqs.push(name);
        });
        if (!(wasEmpty || this.noReturn)) {
            this.body.makeReturn();
        }
        code = 'function';
        if (this.isGenerator) {
            code += '*';
        }
        if (this.ctor) {
            code += ' ' + this.name;
        }
        code += '(';
        answer = [this.makeCode(code)];
        for (i = r = 0, len6 = params.length; r < len6; i = ++r) {
            p = params[i];
            if (i) {
                answer.push(this.makeCode(", "));
            }
            answer.push.apply(answer, p);
        }
        answer.push(this.makeCode(') {'));
        if (!this.body.isEmpty()) {
            answer = answer.concat(this.makeCode("\n"), this.body.compileWithDeclarations(o), this.makeCode("\n" + this.tab));
        }
        answer.push(this.makeCode('}'));
        if (this.ctor) {
            return [this.makeCode(this.tab)].concat(slice.call(answer));
        }
        if (this.front || (o.level >= LEVEL_ACCESS)) {
            return this.wrapInBraces(answer);
        } else {
            return answer;
        }
    };

    Code.prototype.eachParamName = function(iterator) {
        var j, len1, param, ref4, results;
        ref4 = this.params;
        results = [];
        for (j = 0, len1 = ref4.length; j < len1; j++) {
            param = ref4[j];
            results.push(param.eachName(iterator));
        }
        return results;
    };

    Code.prototype.traverseChildren = function(crossScope, func) {
        if (crossScope) {
            return Code.__super__.traverseChildren.call(this, crossScope, func);
        }
    };

    return Code;

})(Base);

exports.Param = Param = (function(superClass1) {
    extend1(Param, superClass1);

    function Param(name1, value1, splat) {
        var message;
        this.name = name1;
        this.value = value1;
        this.splat = splat;
        message = isUnassignable(this.name.unwrapAll().value);
        if (message) {
            this.name.error(message);
        }
    }

    Param.prototype.children = ['name', 'value'];

    Param.prototype.compileToFragments = function(o) {
        return this.name.compileToFragments(o, LEVEL_LIST);
    };

    Param.prototype.asReference = function(o) {
        var name, node;
        if (this.reference) {
            return this.reference;
        }
        node = this.name;
        if (node["this"]) {
            name = node.properties[0].name.value;
            if (indexOf.call(JS_FORBIDDEN, name) >= 0) {
                name = "_" + name;
            }
            node = new IdentifierLiteral(o.scope.freeVariable(name));
        } else if (node.isComplex()) {
            node = new IdentifierLiteral(o.scope.freeVariable('arg'));
        }
        node = new Value(node);
        if (this.splat) {
            node = new Splat(node);
        }
        node.updateLocationDataIfMissing(this.locationData);
        return this.reference = node;
    };

    Param.prototype.isComplex = function() {
        return this.name.isComplex();
    };

    Param.prototype.eachName = function(iterator, name) {
        var atParam, j, len1, node, obj, ref4, ref5;
        if (name == null) {
            name = this.name;
        }
        atParam = function(obj) {
            return iterator("@" + obj.properties[0].name.value, obj);
        };
        if (name instanceof IdentifierLiteral) {
            if (name instanceof NullLiteral) {
                return;
            }
            return iterator(name.value, name);
        }
        if (name instanceof Value) {
            return atParam(name);
        }
        ref5 = (ref4 = name.objects) != null ? ref4 : [];
        for (j = 0, len1 = ref5.length; j < len1; j++) {
            obj = ref5[j];
            if (obj instanceof Assign && (obj.context == null)) {
                obj = obj.variable;
            }
            if (obj instanceof Assign) {
                if (obj.value instanceof Assign) {
                    obj = obj.value;
                }
                this.eachName(iterator, obj.value.unwrap());
            } else if (obj instanceof Splat) {
                node = obj.name.unwrap();
                iterator(node.value, node);
            } else if (obj instanceof Value) {
                if (obj.isArray() || obj.isObject()) {
                    this.eachName(iterator, obj.base);
                } else if (obj["this"]) {
                    atParam(obj);
                } else {
                    iterator(obj.base.value, obj.base);
                }
            } else if (!(obj instanceof Expansion)) {
                obj.error("illegal parameter " + (obj.compile()));
            }
        }
    };

    return Param;

})(Base);

exports.Splat = Splat = (function(superClass1) {
    extend1(Splat, superClass1);

    Splat.prototype.children = ['name'];

    Splat.prototype.isAssignable = YES;

    function Splat(name) {
        this.name = name.compile ? name : new Literal(name);
    }

    Splat.prototype.assigns = function(name) {
        return this.name.assigns(name);
    };

    Splat.prototype.compileNode = function(o) {
        return this.name.compileToFragments(o);
    };

    Splat.prototype.unwrap = function() {
        return this.name;
    };

    Splat.compileSplattedArray = function(o, list, apply) {
        var args, base, compiledNode, concatPart, fragments, i, index, j, last, len1, node;
        index = -1;
        while ((node = list[++index]) && !(node instanceof Splat)) {
            continue;
        }
        if (index >= list.length) {
            return [];
        }
        if (list.length === 1) {
            node = list[0];
            fragments = node.compileToFragments(o, LEVEL_LIST);
            if (apply) {
                return fragments;
            }
            return [].concat(node.makeCode((utility('slice', o)) + ".call("), fragments, node.makeCode(")"));
        }
        args = list.slice(index);
        for (i = j = 0, len1 = args.length; j < len1; i = ++j) {
            node = args[i];
            compiledNode = node.compileToFragments(o, LEVEL_LIST);
            args[i] = node instanceof Splat ? [].concat(node.makeCode((utility('slice', o)) + ".call("), compiledNode, node.makeCode(")")) : [].concat(node.makeCode("["), compiledNode, node.makeCode("]"));
        }
        if (index === 0) {
            node = list[0];
            concatPart = node.joinFragmentArrays(args.slice(1), ', ');
            return args[0].concat(node.makeCode(".concat("), concatPart, node.makeCode(")"));
        }
        base = (function() {
            var k, len2, ref4, results;
            ref4 = list.slice(0, index);
            results = [];
            for (k = 0, len2 = ref4.length; k < len2; k++) {
                node = ref4[k];
                results.push(node.compileToFragments(o, LEVEL_LIST));
            }
            return results;
        })();
        base = list[0].joinFragmentArrays(base, ', ');
        concatPart = list[index].joinFragmentArrays(args, ', ');
        last = list[list.length - 1];
        return [].concat(list[0].makeCode("["), base, list[index].makeCode("].concat("), concatPart, last.makeCode(")"));
    };

    return Splat;

})(Base);

exports.Expansion = Expansion = (function(superClass1) {
    extend1(Expansion, superClass1);

    function Expansion() {
        return Expansion.__super__.constructor.apply(this, arguments);
    }

    Expansion.prototype.isComplex = NO;

    Expansion.prototype.compileNode = function(o) {
        return this.error('Expansion must be used inside a destructuring assignment or parameter list');
    };

    Expansion.prototype.asReference = function(o) {
        return this;
    };

    Expansion.prototype.eachName = function(iterator) {};

    return Expansion;

})(Base);

exports.While = While = (function(superClass1) {
    extend1(While, superClass1);

    function While(condition, options) {
        this.condition = (options != null ? options.invert : void 0) ? condition.invert() : condition;
        this.guard = options != null ? options.guard : void 0;
    }

    While.prototype.children = ['condition', 'guard', 'body'];

    While.prototype.isStatement = YES;

    While.prototype.makeReturn = function(res) {
        if (res) {
            return While.__super__.makeReturn.apply(this, arguments);
        } else {
            this.returns = !this.jumps({
                loop: true
            });
            return this;
        }
    };

    While.prototype.addBody = function(body1) {
        this.body = body1;
        return this;
    };

    While.prototype.jumps = function() {
        var expressions, j, jumpNode, len1, node;
        expressions = this.body.expressions;
        if (!expressions.length) {
            return false;
        }
        for (j = 0, len1 = expressions.length; j < len1; j++) {
            node = expressions[j];
            if (jumpNode = node.jumps({
                loop: true
            })) {
                return jumpNode;
            }
        }
        return false;
    };

    While.prototype.compileNode = function(o) {
        var answer, body, rvar, set;
        o.indent += TAB;
        set = '';
        body = this.body;
        if (body.isEmpty()) {
            body = this.makeCode('');
        } else {
            if (this.returns) {
                body.makeReturn(rvar = o.scope.freeVariable('results'));
                set = "" + this.tab + rvar + " = [];\n";
            }
            if (this.guard) {
                if (body.expressions.length > 1) {
                    body.expressions.unshift(new If((new Parens(this.guard)).invert(), new StatementLiteral("continue")));
                } else {
                    if (this.guard) {
                        body = Block.wrap([new If(this.guard, body)]);
                    }
                }
            }
            body = [].concat(this.makeCode("\n"), body.compileToFragments(o, LEVEL_TOP), this.makeCode("\n" + this.tab));
        }
        answer = [].concat(this.makeCode(set + this.tab + "while ("), this.condition.compileToFragments(o, LEVEL_PAREN), this.makeCode(") {"), body, this.makeCode("}"));
        if (this.returns) {
            answer.push(this.makeCode("\n" + this.tab + "return " + rvar + ";"));
        }
        return answer;
    };

    return While;

})(Base);

exports.Op = Op = (function(superClass1) {
    var CONVERSIONS, INVERSIONS;

    extend1(Op, superClass1);

    function Op(op, first, second, flip) {
        if (op === 'in') {
            return new In(first, second);
        }
        if (op === 'do') {
            return this.generateDo(first);
        }
        if (op === 'new') {
            if (first instanceof Call && !first["do"] && !first.isNew) {
                return first.newInstance();
            }
            if (first instanceof Code && first.bound || first["do"]) {
                first = new Parens(first);
            }
        }
        this.operator = CONVERSIONS[op] || op;
        this.first = first;
        this.second = second;
        this.flip = !!flip;
        return this;
    }

    CONVERSIONS = {
        '==': '===',
        '!=': '!==',
        'of': 'in',
        'yieldfrom': 'yield*'
    };

    INVERSIONS = {
        '!==': '===',
        '===': '!=='
    };

    Op.prototype.children = ['first', 'second'];

    Op.prototype.isNumber = function() {
        var ref4;
        return this.isUnary() && ((ref4 = this.operator) === '+' || ref4 === '-') && this.first instanceof Value && this.first.isNumber();
    };

    Op.prototype.isYield = function() {
        var ref4;
        return (ref4 = this.operator) === 'yield' || ref4 === 'yield*';
    };

    Op.prototype.isUnary = function() {
        return !this.second;
    };

    Op.prototype.isComplex = function() {
        return !this.isNumber();
    };

    Op.prototype.isChainable = function() {
        var ref4;
        return (ref4 = this.operator) === '<' || ref4 === '>' || ref4 === '>=' || ref4 === '<=' || ref4 === '===' || ref4 === '!==';
    };

    Op.prototype.invert = function() {
        var allInvertable, curr, fst, op, ref4;
        if (this.isChainable() && this.first.isChainable()) {
            allInvertable = true;
            curr = this;
            while (curr && curr.operator) {
                allInvertable && (allInvertable = curr.operator in INVERSIONS);
                curr = curr.first;
            }
            if (!allInvertable) {
                return new Parens(this).invert();
            }
            curr = this;
            while (curr && curr.operator) {
                curr.invert = !curr.invert;
                curr.operator = INVERSIONS[curr.operator];
                curr = curr.first;
            }
            return this;
        } else if (op = INVERSIONS[this.operator]) {
            this.operator = op;
            if (this.first.unwrap() instanceof Op) {
                this.first.invert();
            }
            return this;
        } else if (this.second) {
            return new Parens(this).invert();
        } else if (this.operator === '!' && (fst = this.first.unwrap()) instanceof Op && ((ref4 = fst.operator) === '!' || ref4 === 'in' || ref4 === 'instanceof')) {
            return fst;
        } else {
            return new Op('!', this);
        }
    };

    Op.prototype.unfoldSoak = function(o) {
        var ref4;
        return ((ref4 = this.operator) === '++' || ref4 === '--' || ref4 === 'delete') && unfoldSoak(o, this, 'first');
    };

    Op.prototype.generateDo = function(exp) {
        var call, func, j, len1, param, passedParams, ref, ref4;
        passedParams = [];
        func = exp instanceof Assign && (ref = exp.value.unwrap()) instanceof Code ? ref : exp;
        ref4 = func.params || [];
        for (j = 0, len1 = ref4.length; j < len1; j++) {
            param = ref4[j];
            if (param.value) {
                passedParams.push(param.value);
                delete param.value;
            } else {
                passedParams.push(param);
            }
        }
        call = new Call(exp, passedParams);
        call["do"] = true;
        return call;
    };

    Op.prototype.compileNode = function(o) {
        var answer, isChain, lhs, message, ref4, rhs;
        isChain = this.isChainable() && this.first.isChainable();
        if (!isChain) {
            this.first.front = this.front;
        }
        if (this.operator === 'delete' && o.scope.check(this.first.unwrapAll().value)) {
            this.error('delete operand may not be argument or var');
        }
        if ((ref4 = this.operator) === '--' || ref4 === '++') {
            message = isUnassignable(this.first.unwrapAll().value);
            if (message) {
                this.first.error(message);
            }
        }
        if (this.isYield()) {
            return this.compileYield(o);
        }
        if (this.isUnary()) {
            return this.compileUnary(o);
        }
        if (isChain) {
            return this.compileChain(o);
        }
        switch (this.operator) {
            case '?':
                return this.compileExistence(o);
            case '**':
                return this.compilePower(o);
            case '//':
                return this.compileFloorDivision(o);
            case '%%':
                return this.compileModulo(o);
            default:
                lhs = this.first.compileToFragments(o, LEVEL_OP);
                rhs = this.second.compileToFragments(o, LEVEL_OP);
                answer = [].concat(lhs, this.makeCode(" " + this.operator + " "), rhs);
                if (o.level <= LEVEL_OP) {
                    return answer;
                } else {
                    return this.wrapInBraces(answer);
                }
        }
    };

    Op.prototype.compileChain = function(o) {
        var fragments, fst, ref4, shared;
        ref4 = this.first.second.cache(o), this.first.second = ref4[0], shared = ref4[1];
        fst = this.first.compileToFragments(o, LEVEL_OP);
        fragments = fst.concat(this.makeCode(" " + (this.invert ? '&&' : '||') + " "), shared.compileToFragments(o), this.makeCode(" " + this.operator + " "), this.second.compileToFragments(o, LEVEL_OP));
        return this.wrapInBraces(fragments);
    };

    Op.prototype.compileExistence = function(o) {
        var fst, ref;
        if (this.first.isComplex()) {
            ref = new IdentifierLiteral(o.scope.freeVariable('ref'));
            fst = new Parens(new Assign(ref, this.first));
        } else {
            fst = this.first;
            ref = fst;
        }
        return new If(new Existence(fst), ref, {
            type: 'if'
        }).addElse(this.second).compileToFragments(o);
    };

    Op.prototype.compileUnary = function(o) {
        var op, parts, plusMinus;
        parts = [];
        op = this.operator;
        parts.push([this.makeCode(op)]);
        if (op === '!' && this.first instanceof Existence) {
            this.first.negated = !this.first.negated;
            return this.first.compileToFragments(o);
        }
        if (o.level >= LEVEL_ACCESS) {
            return (new Parens(this)).compileToFragments(o);
        }
        plusMinus = op === '+' || op === '-';
        if ((op === 'new' || op === 'typeof' || op === 'delete') || plusMinus && this.first instanceof Op && this.first.operator === op) {
            parts.push([this.makeCode(' ')]);
        }
        if ((plusMinus && this.first instanceof Op) || (op === 'new' && this.first.isStatement(o))) {
            this.first = new Parens(this.first);
        }
        parts.push(this.first.compileToFragments(o, LEVEL_OP));
        if (this.flip) {
            parts.reverse();
        }
        return this.joinFragmentArrays(parts, '');
    };

    Op.prototype.compileYield = function(o) {
        var op, parts, ref4;
        parts = [];
        op = this.operator;
        if (o.scope.parent == null) {
            this.error('yield can only occur inside functions');
        }
        if (indexOf.call(Object.keys(this.first), 'expression') >= 0 && !(this.first instanceof Throw)) {
            if (this.first.expression != null) {
                parts.push(this.first.expression.compileToFragments(o, LEVEL_OP));
            }
        } else {
            if (o.level >= LEVEL_PAREN) {
                parts.push([this.makeCode("(")]);
            }
            parts.push([this.makeCode(op)]);
            if (((ref4 = this.first.base) != null ? ref4.value : void 0) !== '') {
                parts.push([this.makeCode(" ")]);
            }
            parts.push(this.first.compileToFragments(o, LEVEL_OP));
            if (o.level >= LEVEL_PAREN) {
                parts.push([this.makeCode(")")]);
            }
        }
        return this.joinFragmentArrays(parts, '');
    };

    Op.prototype.compilePower = function(o) {
        var pow;
        pow = new Value(new IdentifierLiteral('Math'), [new Access(new PropertyName('pow'))]);
        return new Call(pow, [this.first, this.second]).compileToFragments(o);
    };

    Op.prototype.compileFloorDivision = function(o) {
        var div, floor, second;
        floor = new Value(new IdentifierLiteral('Math'), [new Access(new PropertyName('floor'))]);
        second = this.second.isComplex() ? new Parens(this.second) : this.second;
        div = new Op('/', this.first, second);
        return new Call(floor, [div]).compileToFragments(o);
    };

    Op.prototype.compileModulo = function(o) {
        var mod;
        mod = new Value(new Literal(utility('modulo', o)));
        return new Call(mod, [this.first, this.second]).compileToFragments(o);
    };

    Op.prototype.toString = function(idt) {
        return Op.__super__.toString.call(this, idt, this.constructor.name + ' ' + this.operator);
    };

    return Op;

})(Base);

exports.In = In = (function(superClass1) {
    extend1(In, superClass1);

    function In(object, array) {
        this.object = object;
        this.array = array;
    }

    In.prototype.children = ['object', 'array'];

    In.prototype.invert = NEGATE;

    In.prototype.compileNode = function(o) {
        var hasSplat, j, len1, obj, ref4;
        if (this.array instanceof Value && this.array.isArray() && this.array.base.objects.length) {
            ref4 = this.array.base.objects;
            for (j = 0, len1 = ref4.length; j < len1; j++) {
                obj = ref4[j];
                if (!(obj instanceof Splat)) {
                    continue;
                }
                hasSplat = true;
                break;
            }
            if (!hasSplat) {
                return this.compileOrTest(o);
            }
        }
        return this.compileLoopTest(o);
    };

    In.prototype.compileOrTest = function(o) {
        var cmp, cnj, i, item, j, len1, ref, ref4, ref5, ref6, sub, tests;
        ref4 = this.object.cache(o, LEVEL_OP), sub = ref4[0], ref = ref4[1];
        ref5 = this.negated ? [' !== ', ' && '] : [' === ', ' || '], cmp = ref5[0], cnj = ref5[1];
        tests = [];
        ref6 = this.array.base.objects;
        for (i = j = 0, len1 = ref6.length; j < len1; i = ++j) {
            item = ref6[i];
            if (i) {
                tests.push(this.makeCode(cnj));
            }
            tests = tests.concat((i ? ref : sub), this.makeCode(cmp), item.compileToFragments(o, LEVEL_ACCESS));
        }
        if (o.level < LEVEL_OP) {
            return tests;
        } else {
            return this.wrapInBraces(tests);
        }
    };

    In.prototype.compileLoopTest = function(o) {
        var fragments, ref, ref4, sub;
        ref4 = this.object.cache(o, LEVEL_LIST), sub = ref4[0], ref = ref4[1];
        fragments = [].concat(this.makeCode(utility('indexOf', o) + ".call("), this.array.compileToFragments(o, LEVEL_LIST), this.makeCode(", "), ref, this.makeCode(") " + (this.negated ? '< 0' : '>= 0')));
        if (this.fragmentsToText(sub) === this.fragmentsToText(ref)) {
            return fragments;
        }
        fragments = sub.concat(this.makeCode(', '), fragments);
        if (o.level < LEVEL_LIST) {
            return fragments;
        } else {
            return this.wrapInBraces(fragments);
        }
    };

    In.prototype.toString = function(idt) {
        return In.__super__.toString.call(this, idt, this.constructor.name + (this.negated ? '!' : ''));
    };

    return In;

})(Base);

exports.Try = Try = (function(superClass1) {
    extend1(Try, superClass1);

    function Try(attempt, errorVariable, recovery, ensure) {
        this.attempt = attempt;
        this.errorVariable = errorVariable;
        this.recovery = recovery;
        this.ensure = ensure;
    }

    Try.prototype.children = ['attempt', 'recovery', 'ensure'];

    Try.prototype.isStatement = YES;

    Try.prototype.jumps = function(o) {
        var ref4;
        return this.attempt.jumps(o) || ((ref4 = this.recovery) != null ? ref4.jumps(o) : void 0);
    };

    Try.prototype.makeReturn = function(res) {
        if (this.attempt) {
            this.attempt = this.attempt.makeReturn(res);
        }
        if (this.recovery) {
            this.recovery = this.recovery.makeReturn(res);
        }
        return this;
    };

    Try.prototype.compileNode = function(o) {
        var catchPart, ensurePart, generatedErrorVariableName, message, placeholder, tryPart;
        o.indent += TAB;
        tryPart = this.attempt.compileToFragments(o, LEVEL_TOP);
        catchPart = this.recovery ? (generatedErrorVariableName = o.scope.freeVariable('error', {
            reserve: false
        }), placeholder = new IdentifierLiteral(generatedErrorVariableName), this.errorVariable ? (message = isUnassignable(this.errorVariable.unwrapAll().value), message ? this.errorVariable.error(message) : void 0, this.recovery.unshift(new Assign(this.errorVariable, placeholder))) : void 0, [].concat(this.makeCode(" catch ("), placeholder.compileToFragments(o), this.makeCode(") {\n"), this.recovery.compileToFragments(o, LEVEL_TOP), this.makeCode("\n" + this.tab + "}"))) : !(this.ensure || this.recovery) ? (generatedErrorVariableName = o.scope.freeVariable('error', {
            reserve: false
        }), [this.makeCode(" catch (" + generatedErrorVariableName + ") {}")]) : [];
        ensurePart = this.ensure ? [].concat(this.makeCode(" finally {\n"), this.ensure.compileToFragments(o, LEVEL_TOP), this.makeCode("\n" + this.tab + "}")) : [];
        return [].concat(this.makeCode(this.tab + "try {\n"), tryPart, this.makeCode("\n" + this.tab + "}"), catchPart, ensurePart);
    };

    return Try;

})(Base);

exports.Throw = Throw = (function(superClass1) {
    extend1(Throw, superClass1);

    function Throw(expression) {
        this.expression = expression;
    }

    Throw.prototype.children = ['expression'];

    Throw.prototype.isStatement = YES;

    Throw.prototype.jumps = NO;

    Throw.prototype.makeReturn = THIS;

    Throw.prototype.compileNode = function(o) {
        return [].concat(this.makeCode(this.tab + "throw "), this.expression.compileToFragments(o), this.makeCode(";"));
    };

    return Throw;

})(Base);

exports.Existence = Existence = (function(superClass1) {
    extend1(Existence, superClass1);

    function Existence(expression) {
        this.expression = expression;
    }

    Existence.prototype.children = ['expression'];

    Existence.prototype.invert = NEGATE;

    Existence.prototype.compileNode = function(o) {
        var cmp, cnj, code, ref4;
        this.expression.front = this.front;
        code = this.expression.compile(o, LEVEL_OP);
        if (this.expression.unwrap() instanceof IdentifierLiteral && !o.scope.check(code)) {
            ref4 = this.negated ? ['===', '||'] : ['!==', '&&'], cmp = ref4[0], cnj = ref4[1];
            code = "typeof " + code + " " + cmp + " \"undefined\" " + cnj + " " + code + " " + cmp + " null";
        } else {
            code = code + " " + (this.negated ? '==' : '!=') + " null";
        }
        return [this.makeCode(o.level <= LEVEL_COND ? code : "(" + code + ")")];
    };

    return Existence;

})(Base);

exports.Parens = Parens = (function(superClass1) {
    extend1(Parens, superClass1);

    function Parens(body1) {
        this.body = body1;
    }

    Parens.prototype.children = ['body'];

    Parens.prototype.unwrap = function() {
        return this.body;
    };

    Parens.prototype.isComplex = function() {
        return this.body.isComplex();
    };

    Parens.prototype.compileNode = function(o) {
        var bare, expr, fragments;
        expr = this.body.unwrap();
        if (expr instanceof Value && expr.isAtomic()) {
            expr.front = this.front;
            return expr.compileToFragments(o);
        }
        fragments = expr.compileToFragments(o, LEVEL_PAREN);
        bare = o.level < LEVEL_OP && (expr instanceof Op || expr instanceof Call || (expr instanceof For && expr.returns)) && (o.level < LEVEL_COND || fragments.length <= 3);
        if (bare) {
            return fragments;
        } else {
            return this.wrapInBraces(fragments);
        }
    };

    return Parens;

})(Base);

exports.StringWithInterpolations = StringWithInterpolations = (function(superClass1) {
    extend1(StringWithInterpolations, superClass1);

    function StringWithInterpolations() {
        return StringWithInterpolations.__super__.constructor.apply(this, arguments);
    }

    StringWithInterpolations.prototype.compileNode = function(o) {
        var element, elements, expr, fragments, j, len1, value;
        if (!o.inTaggedTemplateCall) {
            return StringWithInterpolations.__super__.compileNode.apply(this, arguments);
        }
        expr = this.body.unwrap();
        elements = [];
        expr.traverseChildren(false, function(node) {
            if (node instanceof StringLiteral) {
                elements.push(node);
                return true;
            } else if (node instanceof Parens) {
                elements.push(node);
                return false;
            }
            return true;
        });
        fragments = [];
        fragments.push(this.makeCode('`'));
        for (j = 0, len1 = elements.length; j < len1; j++) {
            element = elements[j];
            if (element instanceof StringLiteral) {
                value = element.value.slice(1, -1);
                value = value.replace(/(\\*)(`|\$\{)/g, function(match, backslashes, toBeEscaped) {
                    if (backslashes.length % 2 === 0) {
                        return backslashes + "\\" + toBeEscaped;
                    } else {
                        return match;
                    }
                });
                fragments.push(this.makeCode(value));
            } else {
                fragments.push(this.makeCode('${'));
                fragments.push.apply(fragments, element.compileToFragments(o, LEVEL_PAREN));
                fragments.push(this.makeCode('}'));
            }
        }
        fragments.push(this.makeCode('`'));
        return fragments;
    };

    return StringWithInterpolations;

})(Parens);

exports.For = For = (function(superClass1) {
    extend1(For, superClass1);

    function For(body, source) {
        var ref4;
        this.source = source.source, this.guard = source.guard, this.step = source.step, this.name = source.name, this.index = source.index;
        this.body = Block.wrap([body]);
        this.own = !!source.own;
        this.object = !!source.object;
        this.from = !!source.from;
        if (this.from && this.index) {
            this.index.error('cannot use index with for-from');
        }
        if (this.own && !this.object) {
            source.ownTag.error("cannot use own with for-" + (this.from ? 'from' : 'in'));
        }
        if (this.object) {
            ref4 = [this.index, this.name], this.name = ref4[0], this.index = ref4[1];
        }
        if (this.index instanceof Value && !this.index.isAssignable()) {
            this.index.error('index cannot be a pattern matching expression');
        }
        this.range = this.source instanceof Value && this.source.base instanceof Range && !this.source.properties.length && !this.from;
        this.pattern = this.name instanceof Value;
        if (this.range && this.index) {
            this.index.error('indexes do not apply to range loops');
        }
        if (this.range && this.pattern) {
            this.name.error('cannot pattern match over range loops');
        }
        this.returns = false;
    }

    For.prototype.children = ['body', 'source', 'guard', 'step'];

    For.prototype.compileNode = function(o) {
        var body, bodyFragments, compare, compareDown, declare, declareDown, defPart, defPartFragments, down, forPartFragments, guardPart, idt1, increment, index, ivar, kvar, kvarAssign, last, lvar, name, namePart, ref, ref4, ref5, resultPart, returnResult, rvar, scope, source, step, stepNum, stepVar, svar, varPart;
        body = Block.wrap([this.body]);
        ref4 = body.expressions, last = ref4[ref4.length - 1];
        if ((last != null ? last.jumps() : void 0) instanceof Return) {
            this.returns = false;
        }
        source = this.range ? this.source.base : this.source;
        scope = o.scope;
        if (!this.pattern) {
            name = this.name && (this.name.compile(o, LEVEL_LIST));
        }
        index = this.index && (this.index.compile(o, LEVEL_LIST));
        if (name && !this.pattern) {
            scope.find(name);
        }
        if (index && !(this.index instanceof Value)) {
            scope.find(index);
        }
        if (this.returns) {
            rvar = scope.freeVariable('results');
        }
        if (this.from) {
            if (this.pattern) {
                ivar = scope.freeVariable('x', {
                    single: true
                });
            }
        } else {
            ivar = (this.object && index) || scope.freeVariable('i', {
                single: true
            });
        }
        kvar = ((this.range || this.from) && name) || index || ivar;
        kvarAssign = kvar !== ivar ? kvar + " = " : "";
        if (this.step && !this.range) {
            ref5 = this.cacheToCodeFragments(this.step.cache(o, LEVEL_LIST, isComplexOrAssignable)), step = ref5[0], stepVar = ref5[1];
            if (this.step.isNumber()) {
                stepNum = Number(stepVar);
            }
        }
        if (this.pattern) {
            name = ivar;
        }
        varPart = '';
        guardPart = '';
        defPart = '';
        idt1 = this.tab + TAB;
        if (this.range) {
            forPartFragments = source.compileToFragments(merge(o, {
                index: ivar,
                name: name,
                step: this.step,
                isComplex: isComplexOrAssignable
            }));
        } else {
            svar = this.source.compile(o, LEVEL_LIST);
            if ((name || this.own) && !(this.source.unwrap() instanceof IdentifierLiteral)) {
                defPart += "" + this.tab + (ref = scope.freeVariable('ref')) + " = " + svar + ";\n";
                svar = ref;
            }
            if (name && !this.pattern && !this.from) {
                namePart = name + " = " + svar + "[" + kvar + "]";
            }
            if (!this.object && !this.from) {
                if (step !== stepVar) {
                    defPart += "" + this.tab + step + ";\n";
                }
                down = stepNum < 0;
                if (!(this.step && (stepNum != null) && down)) {
                    lvar = scope.freeVariable('len');
                }
                declare = "" + kvarAssign + ivar + " = 0, " + lvar + " = " + svar + ".length";
                declareDown = "" + kvarAssign + ivar + " = " + svar + ".length - 1";
                compare = ivar + " < " + lvar;
                compareDown = ivar + " >= 0";
                if (this.step) {
                    if (stepNum != null) {
                        if (down) {
                            compare = compareDown;
                            declare = declareDown;
                        }
                    } else {
                        compare = stepVar + " > 0 ? " + compare + " : " + compareDown;
                        declare = "(" + stepVar + " > 0 ? (" + declare + ") : " + declareDown + ")";
                    }
                    increment = ivar + " += " + stepVar;
                } else {
                    increment = "" + (kvar !== ivar ? "++" + ivar : ivar + "++");
                }
                forPartFragments = [this.makeCode(declare + "; " + compare + "; " + kvarAssign + increment)];
            }
        }
        if (this.returns) {
            resultPart = "" + this.tab + rvar + " = [];\n";
            returnResult = "\n" + this.tab + "return " + rvar + ";";
            body.makeReturn(rvar);
        }
        if (this.guard) {
            if (body.expressions.length > 1) {
                body.expressions.unshift(new If((new Parens(this.guard)).invert(), new StatementLiteral("continue")));
            } else {
                if (this.guard) {
                    body = Block.wrap([new If(this.guard, body)]);
                }
            }
        }
        if (this.pattern) {
            body.expressions.unshift(new Assign(this.name, this.from ? new IdentifierLiteral(kvar) : new Literal(svar + "[" + kvar + "]")));
        }
        defPartFragments = [].concat(this.makeCode(defPart), this.pluckDirectCall(o, body));
        if (namePart) {
            varPart = "\n" + idt1 + namePart + ";";
        }
        if (this.object) {
            forPartFragments = [this.makeCode(kvar + " in " + svar)];
            if (this.own) {
                guardPart = "\n" + idt1 + "if (!" + (utility('hasProp', o)) + "(" + svar + ", " + kvar + ")) continue;";
            }
        } else if (this.from) {
            forPartFragments = [this.makeCode(kvar + " of " + svar)];
        }
        bodyFragments = body.compileToFragments(merge(o, {
            indent: idt1
        }), LEVEL_TOP);
        if (bodyFragments && bodyFragments.length > 0) {
            bodyFragments = [].concat(this.makeCode("\n"), bodyFragments, this.makeCode("\n"));
        }
        return [].concat(defPartFragments, this.makeCode("" + (resultPart || '') + this.tab + "for ("), forPartFragments, this.makeCode(") {" + guardPart + varPart), bodyFragments, this.makeCode(this.tab + "}" + (returnResult || '')));
    };

    For.prototype.pluckDirectCall = function(o, body) {
        var base, defs, expr, fn, idx, j, len1, ref, ref10, ref4, ref5, ref6, ref7, ref8, ref9, val;
        defs = [];
        ref4 = body.expressions;
        for (idx = j = 0, len1 = ref4.length; j < len1; idx = ++j) {
            expr = ref4[idx];
            expr = expr.unwrapAll();
            if (!(expr instanceof Call)) {
                continue;
            }
            val = (ref5 = expr.variable) != null ? ref5.unwrapAll() : void 0;
            if (!((val instanceof Code) || (val instanceof Value && ((ref6 = val.base) != null ? ref6.unwrapAll() : void 0) instanceof Code && val.properties.length === 1 && ((ref7 = (ref8 = val.properties[0].name) != null ? ref8.value : void 0) === 'call' || ref7 === 'apply')))) {
                continue;
            }
            fn = ((ref9 = val.base) != null ? ref9.unwrapAll() : void 0) || val;
            ref = new IdentifierLiteral(o.scope.freeVariable('fn'));
            base = new Value(ref);
            if (val.base) {
                ref10 = [base, val], val.base = ref10[0], base = ref10[1];
            }
            body.expressions[idx] = new Call(base, expr.args);
            defs = defs.concat(this.makeCode(this.tab), new Assign(ref, fn).compileToFragments(o, LEVEL_TOP), this.makeCode(';\n'));
        }
        return defs;
    };

    return For;

})(While);

exports.Switch = Switch = (function(superClass1) {
    extend1(Switch, superClass1);

    function Switch(subject, cases, otherwise) {
        this.subject = subject;
        this.cases = cases;
        this.otherwise = otherwise;
    }

    Switch.prototype.children = ['subject', 'cases', 'otherwise'];

    Switch.prototype.isStatement = YES;

    Switch.prototype.jumps = function(o) {
        var block, conds, j, jumpNode, len1, ref4, ref5, ref6;
        if (o == null) {
            o = {
                block: true
            };
        }
        ref4 = this.cases;
        for (j = 0, len1 = ref4.length; j < len1; j++) {
            ref5 = ref4[j], conds = ref5[0], block = ref5[1];
            if (jumpNode = block.jumps(o)) {
                return jumpNode;
            }
        }
        return (ref6 = this.otherwise) != null ? ref6.jumps(o) : void 0;
    };

    Switch.prototype.makeReturn = function(res) {
        var j, len1, pair, ref4, ref5;
        ref4 = this.cases;
        for (j = 0, len1 = ref4.length; j < len1; j++) {
            pair = ref4[j];
            pair[1].makeReturn(res);
        }
        if (res) {
            this.otherwise || (this.otherwise = new Block([new Literal('void 0')]));
        }
        if ((ref5 = this.otherwise) != null) {
            ref5.makeReturn(res);
        }
        return this;
    };

    Switch.prototype.compileNode = function(o) {
        var block, body, cond, conditions, expr, fragments, i, idt1, idt2, j, k, len1, len2, ref4, ref5, ref6;
        idt1 = o.indent + TAB;
        idt2 = o.indent = idt1 + TAB;
        fragments = [].concat(this.makeCode(this.tab + "switch ("), (this.subject ? this.subject.compileToFragments(o, LEVEL_PAREN) : this.makeCode("false")), this.makeCode(") {\n"));
        ref4 = this.cases;
        for (i = j = 0, len1 = ref4.length; j < len1; i = ++j) {
            ref5 = ref4[i], conditions = ref5[0], block = ref5[1];
            ref6 = flatten([conditions]);
            for (k = 0, len2 = ref6.length; k < len2; k++) {
                cond = ref6[k];
                if (!this.subject) {
                    cond = cond.invert();
                }
                fragments = fragments.concat(this.makeCode(idt1 + "case "), cond.compileToFragments(o, LEVEL_PAREN), this.makeCode(":\n"));
            }
            if ((body = block.compileToFragments(o, LEVEL_TOP)).length > 0) {
                fragments = fragments.concat(body, this.makeCode('\n'));
            }
            if (i === this.cases.length - 1 && !this.otherwise) {
                break;
            }
            expr = this.lastNonComment(block.expressions);
            if (expr instanceof Return || (expr instanceof Literal && expr.jumps() && expr.value !== 'debugger')) {
                continue;
            }
            fragments.push(cond.makeCode(idt2 + 'break;\n'));
        }
        if (this.otherwise && this.otherwise.expressions.length) {
            fragments.push.apply(fragments, [this.makeCode(idt1 + "default:\n")].concat(slice.call(this.otherwise.compileToFragments(o, LEVEL_TOP)), [this.makeCode("\n")]));
        }
        fragments.push(this.makeCode(this.tab + '}'));
        return fragments;
    };

    return Switch;

})(Base);

exports.If = If = (function(superClass1) {
    extend1(If, superClass1);

    function If(condition, body1, options) {
        this.body = body1;
        if (options == null) {
            options = {};
        }
        this.condition = options.type === 'unless' ? condition.invert() : condition;
        this.elseBody = null;
        this.isChain = false;
        this.soak = options.soak;
    }

    If.prototype.children = ['condition', 'body', 'elseBody'];

    If.prototype.bodyNode = function() {
        var ref4;
        return (ref4 = this.body) != null ? ref4.unwrap() : void 0;
    };

    If.prototype.elseBodyNode = function() {
        var ref4;
        return (ref4 = this.elseBody) != null ? ref4.unwrap() : void 0;
    };

    If.prototype.addElse = function(elseBody) {
        if (this.isChain) {
            this.elseBodyNode().addElse(elseBody);
        } else {
            this.isChain = elseBody instanceof If;
            this.elseBody = this.ensureBlock(elseBody);
            this.elseBody.updateLocationDataIfMissing(elseBody.locationData);
        }
        return this;
    };

    If.prototype.isStatement = function(o) {
        var ref4;
        return (o != null ? o.level : void 0) === LEVEL_TOP || this.bodyNode().isStatement(o) || ((ref4 = this.elseBodyNode()) != null ? ref4.isStatement(o) : void 0);
    };

    If.prototype.jumps = function(o) {
        var ref4;
        return this.body.jumps(o) || ((ref4 = this.elseBody) != null ? ref4.jumps(o) : void 0);
    };

    If.prototype.compileNode = function(o) {
        if (this.isStatement(o)) {
            return this.compileStatement(o);
        } else {
            return this.compileExpression(o);
        }
    };

    If.prototype.makeReturn = function(res) {
        if (res) {
            this.elseBody || (this.elseBody = new Block([new Literal('void 0')]));
        }
        this.body && (this.body = new Block([this.body.makeReturn(res)]));
        this.elseBody && (this.elseBody = new Block([this.elseBody.makeReturn(res)]));
        return this;
    };

    If.prototype.ensureBlock = function(node) {
        if (node instanceof Block) {
            return node;
        } else {
            return new Block([node]);
        }
    };

    If.prototype.compileStatement = function(o) {
        var answer, body, child, cond, ifPart, indent;
        child = del(o, 'chainChild');
        indent = o.indent + TAB;
        cond = this.condition.compileToFragments(o, LEVEL_PAREN);
        body = this.ensureBlock(this.body).compileToFragments(merge(o, {
            indent: indent
        }));
        ifPart = [].concat(this.makeCode("if ("), cond, this.makeCode(") {\n"), body, this.makeCode("\n" + this.tab + "}"));
        if (!child) {
            ifPart.unshift(this.makeCode(this.tab));
        }
        if (!this.elseBody) {
            return ifPart;
        }
        answer = ifPart.concat(this.makeCode(' else '));
        if (this.isChain) {
            o.chainChild = true;
            answer = answer.concat(this.elseBody.unwrap().compileToFragments(o, LEVEL_TOP));
        } else {
            answer = answer.concat(this.makeCode("{\n"), this.elseBody.compileToFragments(merge(o, {
                indent: indent
            }), LEVEL_TOP), this.makeCode("\n" + this.tab + "}"));
        }
        return answer;
    };

    If.prototype.compileExpression = function(o) {
        var alt, body, cond, fragments;
        cond = this.condition.compileToFragments(o, LEVEL_COND);
        body = this.bodyNode().compileToFragments(o, LEVEL_LIST);
        alt = this.elseBodyNode() ? this.elseBodyNode().compileToFragments(o, LEVEL_LIST) : [this.makeCode('void 0')];
        fragments = cond.concat(this.makeCode(" ? "), body, this.makeCode(" : "), alt);
        if (o.level >= LEVEL_COND) {
            return this.wrapInBraces(fragments);
        } else {
            return fragments;
        }
    };

    If.prototype.unfoldSoak = function() {
        return this.soak && this;
    };

    return If;

})(Base);

exports.MetaIf = MetaIf = (function(superClass1) {
    extend1(MetaIf, superClass1);

    function MetaIf(condition1, body1, options) {
        this.condition = condition1;
        this.body = body1;
        if (options == null) {
            options = {};
        }
        this.elseBody = null;
        this.isChain = false;
        this.soak = options.soak;
    }

    MetaIf.prototype.children = ['condition', 'body', 'elseBody'];

    MetaIf.prototype.addElse = function(elseBody) {
        var ref4;
        if (this.isChain) {
            if ((ref4 = this.elseBody) != null) {
                ref4.unwrap().addElse(elseBody);
            }
        } else {
            this.isChain = elseBody instanceof MetaIf;
            this.elseBody = this.ensureBlock(elseBody);
            this.elseBody.updateLocationDataIfMissing(elseBody.locationData);
        }
        return this;
    };

    MetaIf.prototype.makeReturn = function(res) {
        if (res) {
            this.elseBody || (this.elseBody = new Block([new Literal('void 0')]));
        }
        this.elseBody && (this.elseBody = new Block([this.elseBody.makeReturn(res)]));
        return this;
    };

    MetaIf.prototype.compileNode = function(o) {
        return compileMetaIf({
            node: this,
            opts: o
        });
    };

    MetaIf.prototype.ensureBlock = function(node) {
        if (node instanceof Block) {
            return node;
        } else {
            return new Block([node]);
        }
    };

    MetaIf.prototype.unfoldSoak = function() {
        return this.soak && this;
    };

    MetaIf.prototype.jumps = function(o) {
        var ref4;
        return this.body.jumps(o) || ((ref4 = this.elseBody) != null ? ref4.jumps(o) : void 0);
    };

    return MetaIf;

})(Base);

UTILITIES = {
    extend: function(o) {
        return "function(child, parent) { for (var key in parent) { if (" + (utility('hasProp', o)) + "(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; }";
    },
    bind: function() {
        return 'function(fn, me){ return function(){ return fn.apply(me, arguments); }; }';
    },
    indexOf: function() {
        return "[].indexOf";
    },
    modulo: function() {
        return "function(a, b) { return (+a % (b = +b) + b) % b; }";
    },
    hasProp: function() {
        return 'Object.hasOwn';
    },
    slice: function() {
        return '[].slice';
    }
};

LEVEL_TOP = 1;

LEVEL_PAREN = 2;

LEVEL_LIST = 3;

LEVEL_COND = 4;

LEVEL_OP = 5;

LEVEL_ACCESS = 6;

TAB = '    ';

SIMPLENUM = /^[+-]?\d+$/;

utility = function(name, o) {
    var ref, root;
    root = o.scope.root;
    if (name in root.utilities) {
        return root.utilities[name];
    } else {
        ref = root.freeVariable(name);
        root.assign(ref, UTILITIES[name](o));
        return root.utilities[name] = ref;
    }
};

multident = function(code, tab) {
    code = code.replace(/\n/g, '$&' + tab);
    return code.replace(/\s+$/, '');
};

isLiteralArguments = function(node) {
    return node instanceof IdentifierLiteral && node.value === 'arguments';
};

isLiteralThis = function(node) {
    return node instanceof ThisLiteral || (node instanceof Code && node.bound) || node instanceof SuperCall;
};

isComplexOrAssignable = function(node) {
    return node.isComplex() || (typeof node.isAssignable === "function" ? node.isAssignable() : void 0);
};

unfoldSoak = function(o, parent, name) {
    var ifn;
    if (!(ifn = parent[name].unfoldSoak(o))) {
        return;
    }
    parent[name] = ifn.body;
    ifn.body = new Value(parent);
    return ifn;
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZXMuanMiLCJzb3VyY2VSb290IjoiLi4vY29mZmVlIiwic291cmNlcyI6WyJub2Rlcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsb3dDQUFBO0lBQUE7Ozs7O0FBYUEsS0FBSyxDQUFDLGVBQU4sR0FBd0I7O0FBRXhCLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUjs7QUFDUixPQUFtQyxPQUFBLENBQVEsU0FBUixDQUFuQyxFQUFFLG9DQUFGLEVBQWtCOztBQUVoQixhQUFlLE9BQUEsQ0FBUSxRQUFSOztBQUNqQixPQUFnQyxPQUFBLENBQVEsWUFBUixDQUFoQyxFQUFFLGtDQUFGLEVBQWlCOztBQUNqQixPQUMyRSxPQUFBLENBQVEsV0FBUixDQUQzRSxFQUFFLHNCQUFGLEVBQVcsc0JBQVgsRUFBb0Isb0JBQXBCLEVBQTRCLGtCQUE1QixFQUFtQyxjQUFuQyxFQUF3QyxvQkFBeEMsRUFBZ0QsZ0JBQWhELEVBQXNELGdCQUF0RCxFQUNFLDBDQURGLEVBQ3FCLGdEQURyQixFQUMyQyx3Q0FEM0MsRUFDNkQ7O0FBRTNELGdCQUFrQixPQUFBLENBQVEsUUFBUjs7QUFFcEIsT0FBTyxDQUFDLE1BQVIsR0FBaUI7O0FBQ2pCLE9BQU8sQ0FBQyxpQkFBUixHQUE0Qjs7QUFFNUIsR0FBQSxHQUFVLFNBQUE7V0FBRztBQUFIOztBQUNWLEVBQUEsR0FBVSxTQUFBO1dBQUc7QUFBSDs7QUFDVixJQUFBLEdBQVUsU0FBQTtXQUFHO0FBQUg7O0FBQ1YsTUFBQSxHQUFVLFNBQUE7SUFBRyxJQUFDLENBQUEsT0FBRCxHQUFXLENBQUksSUFBQyxDQUFBO1dBQVM7QUFBNUI7O0FBYVYsT0FBTyxDQUFDLFlBQVIsR0FBNkI7SUFFdEIsc0JBQUMsTUFBRCxFQUFTLElBQVQ7QUFFQyxZQUFBO1FBQUEsSUFBQyxDQUFBLElBQUQsR0FBUSxFQUFBLEdBQUc7UUFDWCxJQUFDLENBQUEsWUFBRCxvQkFBZ0IsTUFBTSxDQUFFO1FBQ3hC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QUFDLFNBQUwsQ0FBQSxDQUFBLCtDQUFvQixJQUFJLENBQUM7QUFBbkM7O0FBSXhCLFVBQUEsR0FBYSxTQUFDLENBQUQsRUFBSSxNQUFKLEVBQVksSUFBWjtBQUNULFFBQUE7SUFBQSxJQUFBLENBQWMsQ0FBQSxHQUFBLEdBQU0sTUFBTyxDQUFBLElBQUEsQ0FBSyxDQUFDLFVBQWIsQ0FBd0IsQ0FBeEIsQ0FBTixDQUFkO0FBQUEsZUFBQTs7SUFDQSxNQUFPLENBQUEsSUFBQSxDQUFQLEdBQWUsR0FBRyxDQUFDO0lBQ25CLEdBQUcsQ0FBQyxJQUFKLEdBQVcsSUFBSSxLQUFKLENBQVUsTUFBVjtXQUNYO0FBSlMiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4wMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbjAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgXG4wMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuIyMjXG5cbiMgQ29udGFpbnMgYWxsIG9mIHRoZSBub2RlIGNsYXNzZXMgZm9yIHRoZSBzeW50YXggdHJlZS4gXG4jIE1vc3Qgbm9kZXMgYXJlIGNyZWF0ZWQgYXMgdGhlIHJlc3VsdCBvZiBhY3Rpb25zIGluIHRoZSBncmFtbWFyLFxuIyBidXQgc29tZSBhcmUgY3JlYXRlZCBieSBvdGhlciBub2RlcyBhcyBhIG1ldGhvZCBvZiBjb2RlIGdlbmVyYXRpb24uIFxuIyBUbyBjb252ZXJ0IHRoZSBzeW50YXggdHJlZSBpbnRvIGEgc3RyaW5nIG9mIEphdmFTY3JpcHQgY29kZSwgY2FsbCBgY29tcGlsZSgpYCBvbiB0aGUgcm9vdC5cblxuRXJyb3Iuc3RhY2tUcmFjZUxpbWl0ID0gSW5maW5pdHlcblxuU2NvcGUgPSByZXF1aXJlICcuL3Njb3BlJ1xueyBpc1VuYXNzaWduYWJsZSwgSlNfRk9SQklEREVOIH0gPSByZXF1aXJlICcuL2xleGVyJ1xuXG57IGluamVjdE1ldGEgfSA9IHJlcXVpcmUgJy4vbWV0YSdcbnsgaW5qZWN0RmVhdHVyZSwgaGFzRmVhdHVyZSB9ID0gcmVxdWlyZSAnLi9mZWF0dXJlcydcbnsgY29tcGFjdCwgZmxhdHRlbiwgZXh0ZW5kLCBtZXJnZSwgZGVsLCBzdGFydHMsIGVuZHMsIHNvbWUsXG4gIGFkZExvY2F0aW9uRGF0YUZuLCBsb2NhdGlvbkRhdGFUb1N0cmluZywgdGhyb3dTeW50YXhFcnJvciwgc3RyaW5naWZ5IH0gPSByZXF1aXJlICcuL2hlbHBlcnMnXG5cbnsgY29tcGlsZU1ldGFJZiB9ID0gcmVxdWlyZSAnLi9tZXRhJ1xuICBcbmV4cG9ydHMuZXh0ZW5kID0gZXh0ZW5kXG5leHBvcnRzLmFkZExvY2F0aW9uRGF0YUZuID0gYWRkTG9jYXRpb25EYXRhRm5cblxuWUVTICAgICA9IC0+IHllc1xuTk8gICAgICA9IC0+IG5vXG5USElTICAgID0gLT4gdGhpc1xuTkVHQVRFICA9IC0+IEBuZWdhdGVkID0gbm90IEBuZWdhdGVkOyB0aGlzXG5cbiMgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICBcbiMgMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcblxuIyBUaGUgdmFyaW91cyBub2RlcyBkZWZpbmVkIGJlbG93IGFsbCBjb21waWxlIHRvIGEgY29sbGVjdGlvbiBvZiBDb2RlRnJhZ21lbnQgb2JqZWN0cy5cbiMgQSBDb2RlRnJhZ21lbnRzIGlzIGEgYmxvY2sgb2YgZ2VuZXJhdGVkIGNvZGUsIGFuZCB0aGUgbG9jYXRpb24gaW4gdGhlIHNvdXJjZSBmaWxlIHdoZXJlIHRoZSBjb2RlXG4jIGNhbWUgZnJvbS4gQ29kZUZyYWdtZW50cyBjYW4gYmUgYXNzZW1ibGVkIHRvZ2V0aGVyIGludG8gd29ya2luZyBjb2RlIGp1c3QgYnkgY2F0dGluZyB0b2dldGhlclxuIyBhbGwgdGhlIENvZGVGcmFnbWVudHMnIGBjb2RlYCBzbmlwcGV0cywgaW4gb3JkZXIuXG5cbmV4cG9ydHMuQ29kZUZyYWdtZW50ID0gY2xhc3MgQ29kZUZyYWdtZW50XG4gICAgXG4gICAgQDogKHBhcmVudCwgY29kZSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBjb2RlID0gXCIje2NvZGV9XCJcbiAgICAgICAgQGxvY2F0aW9uRGF0YSA9IHBhcmVudD8ubG9jYXRpb25EYXRhXG4gICAgICAgIEB0eXBlID0gcGFyZW50Py5jb25zdHJ1Y3Rvcj8ubmFtZSBvciAndW5rbm93bidcblxuICAgIHRvU3RyaW5nOiAtPlxuICAgICAgICBcbiAgICAgICAgXCIje0Bjb2RlfSN7aWYgQGxvY2F0aW9uRGF0YSB0aGVuIFwiOiBcIiArIGxvY2F0aW9uRGF0YVRvU3RyaW5nKEBsb2NhdGlvbkRhdGEpIGVsc2UgJyd9XCJcblxuIyAwMDAwMDAwICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICBcbiMgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG5cbiMgVGhlICoqQmFzZSoqIGlzIHRoZSBhYnN0cmFjdCBiYXNlIGNsYXNzIGZvciBhbGwgbm9kZXMgaW4gdGhlIHN5bnRheCB0cmVlLlxuIyBFYWNoIHN1YmNsYXNzIGltcGxlbWVudHMgdGhlIGBjb21waWxlTm9kZWAgbWV0aG9kLCB3aGljaCBwZXJmb3JtcyB0aGVcbiMgY29kZSBnZW5lcmF0aW9uIGZvciB0aGF0IG5vZGUuIFRvIGNvbXBpbGUgYSBub2RlIHRvIEphdmFTY3JpcHQsXG4jIGNhbGwgYGNvbXBpbGVgIG9uIGl0LCB3aGljaCB3cmFwcyBgY29tcGlsZU5vZGVgIGluIHNvbWUgZ2VuZXJpYyBleHRyYSBzbWFydHMsXG4jIHRvIGtub3cgd2hlbiB0aGUgZ2VuZXJhdGVkIGNvZGUgbmVlZHMgdG8gYmUgd3JhcHBlZCB1cCBpbiBhIGNsb3N1cmUuXG4jIEFuIG9wdGlvbnMgaGFzaCBpcyBwYXNzZWQgYW5kIGNsb25lZCB0aHJvdWdob3V0LCBjb250YWluaW5nIGluZm9ybWF0aW9uIGFib3V0XG4jIHRoZSBlbnZpcm9ubWVudCBmcm9tIGhpZ2hlciBpbiB0aGUgdHJlZSAoc3VjaCBhcyBpZiBhIHJldHVybmVkIHZhbHVlIGlzXG4jIGJlaW5nIHJlcXVlc3RlZCBieSB0aGUgc3Vycm91bmRpbmcgZnVuY3Rpb24pLCBpbmZvcm1hdGlvbiBhYm91dCB0aGUgY3VycmVudFxuIyBzY29wZSwgYW5kIGluZGVudGF0aW9uIGxldmVsLlxuXG5leHBvcnRzLkJhc2UgPSBjbGFzcyBCYXNlXG5cbiAgICBmcmFnbWVudHNUb1RleHQ6IChmcmFnbWVudHMpIC0+ICMgQ29udmVydCBhbiBhcnJheSBvZiBDb2RlRnJhZ21lbnRzIGludG8gYSBzdHJpbmcuXG4gICAgXG4gICAgICAgIChmcmFnbWVudC5jb2RlIGZvciBmcmFnbWVudCBpbiBmcmFnbWVudHMpLmpvaW4oJycpXG4gICAgXG4gICAgY29tcGlsZTogKG8sIGx2bCkgLT4gQGZyYWdtZW50c1RvVGV4dCBAY29tcGlsZVRvRnJhZ21lbnRzIG8sIGx2bFxuXG4gICAgIyBDb21tb24gbG9naWMgZm9yIGRldGVybWluaW5nIHdoZXRoZXIgdG8gd3JhcCB0aGlzIG5vZGUgaW4gYSBjbG9zdXJlIGJlZm9yZSBjb21waWxpbmcgaXQsIG9yIHRvIGNvbXBpbGUgZGlyZWN0bHkuIFxuICAgICMgV2UgbmVlZCB0byB3cmFwIGlmIHRoaXMgbm9kZSBpcyBhIHN0YXRlbWVudCwgYW5kIGl0J3Mgbm90IGEgcHVyZVN0YXRlbWVudCwgYW5kIHdlJ3JlIG5vdCBhdCB0aGUgdG9wIGxldmVsIG9mIGEgYmxvY2sgKHdoaWNoIHdvdWxkIGJlIHVubmVjZXNzYXJ5KSwgXG4gICAgIyBhbmQgd2UgaGF2ZW4ndCBhbHJlYWR5IGJlZW4gYXNrZWQgdG8gcmV0dXJuIHRoZSByZXN1bHQgKGJlY2F1c2Ugc3RhdGVtZW50cyBrbm93IGhvdyB0byByZXR1cm4gcmVzdWx0cykuXG4gICAgXG4gICAgY29tcGlsZVRvRnJhZ21lbnRzOiAobywgbHZsKSAtPlxuICAgICAgICBcbiAgICAgICAgbyA9IGluamVjdEZlYXR1cmUgb1xuICAgICAgICBvID0gaW5qZWN0TWV0YSAgICBvXG5cbiAgICAgICAgby5sZXZlbCAgPSBsdmwgaWYgbHZsXG4gICAgICAgIG5vZGUgICAgID0gQHVuZm9sZFNvYWsobykgb3IgdGhpc1xuICAgICAgICBub2RlLnRhYiA9IG8uaW5kZW50XG4gICAgICAgIGlmIG8ubGV2ZWwgaXMgTEVWRUxfVE9QIG9yIG5vdCBub2RlLmlzU3RhdGVtZW50KG8pXG4gICAgICAgICAgICBub2RlLmNvbXBpbGVOb2RlIG9cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbm9kZS5jb21waWxlQ2xvc3VyZSBvXG5cbiAgICAjIFN0YXRlbWVudHMgY29udmVydGVkIGludG8gZXhwcmVzc2lvbnMgdmlhIGNsb3N1cmUtd3JhcHBpbmcgc2hhcmUgYSBzY29wZVxuICAgICMgb2JqZWN0IHdpdGggdGhlaXIgcGFyZW50IGNsb3N1cmUsIHRvIHByZXNlcnZlIHRoZSBleHBlY3RlZCBsZXhpY2FsIHNjb3BlLlxuICAgIFxuICAgIGNvbXBpbGVDbG9zdXJlOiAobykgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIGp1bXBOb2RlID0gQGp1bXBzKClcbiAgICAgICAgICAgIGp1bXBOb2RlLmVycm9yICdjYW5ub3QgdXNlIGEgcHVyZSBzdGF0ZW1lbnQgaW4gYW4gZXhwcmVzc2lvbidcbiAgICAgICAgby5zaGFyZWRTY29wZSA9IHllc1xuICAgICAgICBmdW5jID0gbmV3IENvZGUgW10sIEJsb2NrLndyYXAgW3RoaXNdXG4gICAgICAgIGFyZ3MgPSBbXVxuICAgICAgICBpZiAoYXJndW1lbnRzTm9kZSA9IEBjb250YWlucyBpc0xpdGVyYWxBcmd1bWVudHMpIG9yIEBjb250YWlucyBpc0xpdGVyYWxUaGlzXG4gICAgICAgICAgICBhcmdzID0gW25ldyBUaGlzTGl0ZXJhbF1cbiAgICAgICAgICAgIGlmIGFyZ3VtZW50c05vZGVcbiAgICAgICAgICAgICAgICBtZXRoID0gJ2FwcGx5J1xuICAgICAgICAgICAgICAgIGFyZ3MucHVzaCBuZXcgSWRlbnRpZmllckxpdGVyYWwgJ2FyZ3VtZW50cydcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBtZXRoID0gJ2NhbGwnXG4gICAgICAgICAgICBmdW5jID0gbmV3IFZhbHVlIGZ1bmMsIFtuZXcgQWNjZXNzIG5ldyBQcm9wZXJ0eU5hbWUgbWV0aF1cbiAgICAgICAgcGFydHMgPSAobmV3IENhbGwgZnVuYywgYXJncykuY29tcGlsZU5vZGUgb1xuICAgICAgICBpZiBmdW5jLmlzR2VuZXJhdG9yIG9yIGZ1bmMuYmFzZT8uaXNHZW5lcmF0b3JcbiAgICAgICAgICAgIHBhcnRzLnVuc2hpZnQgQG1ha2VDb2RlIFwiKHlpZWxkKiBcIlxuICAgICAgICAgICAgcGFydHMucHVzaCAgICBAbWFrZUNvZGUgXCIpXCJcbiAgICAgICAgcGFydHNcblxuICAgICMgSWYgdGhlIGNvZGUgZ2VuZXJhdGlvbiB3aXNoZXMgdG8gdXNlIHRoZSByZXN1bHQgb2YgYSBjb21wbGV4IGV4cHJlc3Npb25cbiAgICAjIGluIG11bHRpcGxlIHBsYWNlcywgZW5zdXJlIHRoYXQgdGhlIGV4cHJlc3Npb24gaXMgb25seSBldmVyIGV2YWx1YXRlZCBvbmNlLFxuICAgICMgYnkgYXNzaWduaW5nIGl0IHRvIGEgdGVtcG9yYXJ5IHZhcmlhYmxlLiBQYXNzIGEgbGV2ZWwgdG8gcHJlY29tcGlsZS5cbiAgICAjXG4gICAgIyBJZiBgbGV2ZWxgIGlzIHBhc3NlZCwgdGhlbiByZXR1cm5zIGBbdmFsLCByZWZdYCwgd2hlcmUgYHZhbGAgaXMgdGhlIGNvbXBpbGVkIHZhbHVlLCBhbmQgYHJlZmBcbiAgICAjIGlzIHRoZSBjb21waWxlZCByZWZlcmVuY2UuIElmIGBsZXZlbGAgaXMgbm90IHBhc3NlZCwgdGhpcyByZXR1cm5zIGBbdmFsLCByZWZdYCB3aGVyZVxuICAgICMgdGhlIHR3byB2YWx1ZXMgYXJlIHJhdyBub2RlcyB3aGljaCBoYXZlIG5vdCBiZWVuIGNvbXBpbGVkLlxuICAgIFxuICAgIGNhY2hlOiAobywgbGV2ZWwsIGlzQ29tcGxleCkgLT5cbiAgICAgICAgXG4gICAgICAgIGNvbXBsZXggPSBpZiBpc0NvbXBsZXg/IHRoZW4gaXNDb21wbGV4IHRoaXMgZWxzZSBAaXNDb21wbGV4KClcbiAgICAgICAgaWYgY29tcGxleFxuICAgICAgICAgICAgcmVmID0gbmV3IElkZW50aWZpZXJMaXRlcmFsIG8uc2NvcGUuZnJlZVZhcmlhYmxlICdyZWYnXG4gICAgICAgICAgICBzdWIgPSBuZXcgQXNzaWduIHJlZiwgdGhpc1xuICAgICAgICAgICAgaWYgbGV2ZWwgdGhlbiBbc3ViLmNvbXBpbGVUb0ZyYWdtZW50cyhvLCBsZXZlbCksIFtAbWFrZUNvZGUocmVmLnZhbHVlKV1dIGVsc2UgW3N1YiwgcmVmXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZWYgPSBpZiBsZXZlbCB0aGVuIEBjb21waWxlVG9GcmFnbWVudHMgbywgbGV2ZWwgZWxzZSB0aGlzXG4gICAgICAgICAgICBbcmVmLCByZWZdXG5cbiAgICBjYWNoZVRvQ29kZUZyYWdtZW50czogKGNhY2hlVmFsdWVzKSAtPlxuICAgICAgICBcbiAgICAgICAgW0BmcmFnbWVudHNUb1RleHQoY2FjaGVWYWx1ZXNbMF0pLCBAZnJhZ21lbnRzVG9UZXh0KGNhY2hlVmFsdWVzWzFdKV1cblxuICAgICMgQ29uc3RydWN0IGEgbm9kZSB0aGF0IHJldHVybnMgdGhlIGN1cnJlbnQgbm9kZSdzIHJlc3VsdC5cbiAgICAjIFRoaXMgaXMgb3ZlcnJpZGRlbiBmb3Igc21hcnRlciBiZWhhdmlvciBmb3IgbWFueSBzdGF0ZW1lbnQgbm9kZXMgKGUuZy4gSWYsIEZvcikuLi5cbiAgICBcbiAgICBtYWtlUmV0dXJuOiAocmVzKSAtPlxuICAgICAgICBtZSA9IEB1bndyYXBBbGwoKVxuICAgICAgICBpZiByZXNcbiAgICAgICAgICAgIG5ldyBDYWxsIG5ldyBMaXRlcmFsKFwiI3tyZXN9LnB1c2hcIiksIFttZV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbmV3IFJldHVybiBtZVxuXG4gICAgIyBEb2VzIHRoaXMgbm9kZSwgb3IgYW55IG9mIGl0cyBjaGlsZHJlbiwgY29udGFpbiBhIG5vZGUgb2YgYSBjZXJ0YWluIGtpbmQ/XG4gICAgIyBSZWN1cnNpdmVseSB0cmF2ZXJzZXMgZG93biB0aGUgKmNoaWxkcmVuKiBub2RlcyBhbmQgcmV0dXJucyB0aGUgZmlyc3Qgb25lXG4gICAgIyB0aGF0IHZlcmlmaWVzIGBwcmVkYC4gT3RoZXJ3aXNlIHJldHVybiB1bmRlZmluZWQuIGBjb250YWluc2AgZG9lcyBub3QgY3Jvc3NcbiAgICAjIHNjb3BlIGJvdW5kYXJpZXMuXG4gICAgXG4gICAgY29udGFpbnM6IChwcmVkKSAtPlxuICAgICAgICBub2RlID0gdW5kZWZpbmVkXG4gICAgICAgIEB0cmF2ZXJzZUNoaWxkcmVuIG5vLCAobikgLT5cbiAgICAgICAgICAgIGlmIHByZWQgblxuICAgICAgICAgICAgICAgIG5vZGUgPSBuXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vXG4gICAgICAgIG5vZGVcblxuICAgIGxhc3ROb25Db21tZW50OiAobGlzdCkgLT4gIyBQdWxsIG91dCB0aGUgbGFzdCBub24tY29tbWVudCBub2RlIG9mIGEgbm9kZSBsaXN0LlxuICAgICAgICBpID0gbGlzdC5sZW5ndGhcbiAgICAgICAgcmV0dXJuIGxpc3RbaV0gd2hpbGUgaS0tIHdoZW4gbGlzdFtpXSBub3QgaW5zdGFuY2VvZiBDb21tZW50XG4gICAgICAgIG51bGxcblxuICAgICMgYHRvU3RyaW5nYCByZXByZXNlbnRhdGlvbiBvZiB0aGUgbm9kZSwgZm9yIGluc3BlY3RpbmcgdGhlIHBhcnNlIHRyZWUuXG4gICAgIyBUaGlzIGlzIHdoYXQgYGNvZmZlZSAtLW5vZGVzYCBwcmludHMgb3V0LlxuICAgIFxuICAgIHRvU3RyaW5nOiAoaWR0ID0gJycsIG5hbWUgPSBAY29uc3RydWN0b3IubmFtZSkgLT5cbiAgICAgICAgdHJlZSA9ICdcXG4nICsgaWR0ICsgbmFtZVxuICAgICAgICB0cmVlICs9ICc/JyBpZiBAc29ha1xuICAgICAgICBAZWFjaENoaWxkIChub2RlKSAtPiB0cmVlICs9IG5vZGUudG9TdHJpbmcgaWR0ICsgVEFCXG4gICAgICAgIHRyZWVcblxuICAgICMgUGFzc2VzIGVhY2ggY2hpbGQgdG8gYSBmdW5jdGlvbiwgYnJlYWtpbmcgd2hlbiB0aGUgZnVuY3Rpb24gcmV0dXJucyBgZmFsc2VgLlxuICAgIFxuICAgIGVhY2hDaGlsZDogKGZ1bmMpIC0+XG4gICAgICAgIHJldHVybiB0aGlzIHVubGVzcyBAY2hpbGRyZW5cbiAgICAgICAgZm9yIGF0dHIgaW4gQGNoaWxkcmVuIHdoZW4gQFthdHRyXVxuICAgICAgICAgICAgZm9yIGNoaWxkIGluIGZsYXR0ZW4gW0BbYXR0cl1dXG4gICAgICAgICAgICAgICAgaWYgY2hpbGRcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMgaWYgZnVuYyhjaGlsZCkgaXMgZmFsc2VcbiAgICAgICAgdGhpc1xuXG4gICAgdHJhdmVyc2VDaGlsZHJlbjogKGNyb3NzU2NvcGUsIGZ1bmMpIC0+XG4gICAgICAgIFxuICAgICAgICBAZWFjaENoaWxkIChjaGlsZCkgLT5cbiAgICAgICAgICAgIHJlY3VyID0gZnVuYyhjaGlsZClcbiAgICAgICAgICAgIGNoaWxkLnRyYXZlcnNlQ2hpbGRyZW4oY3Jvc3NTY29wZSwgZnVuYykgdW5sZXNzIHJlY3VyIGlzIG5vXG5cbiAgICBpbnZlcnQ6IC0+XG4gICAgICAgIG5ldyBPcCAnIScsIHRoaXNcblxuICAgIHVud3JhcEFsbDogLT5cbiAgICAgICAgbm9kZSA9IHRoaXNcbiAgICAgICAgY29udGludWUgdW50aWwgbm9kZSBpcyBub2RlID0gbm9kZS51bndyYXAoKVxuICAgICAgICBub2RlXG5cbiAgICAjIERlZmF1bHQgaW1wbGVtZW50YXRpb25zIG9mIHRoZSBjb21tb24gbm9kZSBwcm9wZXJ0aWVzIGFuZCBtZXRob2RzLiBOb2Rlc1xuICAgICMgd2lsbCBvdmVycmlkZSB0aGVzZSB3aXRoIGN1c3RvbSBsb2dpYywgaWYgbmVlZGVkLlxuICAgIFxuICAgIGNoaWxkcmVuOiAgICAgW11cbiAgICBpc1N0YXRlbWVudDogIE5PXG4gICAganVtcHM6ICAgICAgICBOT1xuICAgIGlzQ29tcGxleDogICAgWUVTXG4gICAgaXNDaGFpbmFibGU6ICBOT1xuICAgIGlzQXNzaWduYWJsZTogTk9cbiAgICBpc051bWJlcjogICAgIE5PXG4gICAgdW53cmFwOiAgICAgICBUSElTXG4gICAgdW5mb2xkU29hazogICBOT1xuXG4gICAgYXNzaWduczogICAgICBOTyAjIElzIHRoaXMgbm9kZSB1c2VkIHRvIGFzc2lnbiBhIGNlcnRhaW4gdmFyaWFibGU/XG5cbiAgICAjIEZvciB0aGlzIG5vZGUgYW5kIGFsbCBkZXNjZW5kZW50cywgc2V0IHRoZSBsb2NhdGlvbiBkYXRhIHRvIGBsb2NhdGlvbkRhdGFgXG4gICAgIyBpZiB0aGUgbG9jYXRpb24gZGF0YSBpcyBub3QgYWxyZWFkeSBzZXQuXG4gICAgXG4gICAgdXBkYXRlTG9jYXRpb25EYXRhSWZNaXNzaW5nOiAobG9jYXRpb25EYXRhKSAtPlxuICAgICAgICByZXR1cm4gdGhpcyBpZiBAbG9jYXRpb25EYXRhXG4gICAgICAgIEBsb2NhdGlvbkRhdGEgPSBsb2NhdGlvbkRhdGFcblxuICAgICAgICBAZWFjaENoaWxkIChjaGlsZCkgLT5cbiAgICAgICAgICAgIGNoaWxkLnVwZGF0ZUxvY2F0aW9uRGF0YUlmTWlzc2luZyBsb2NhdGlvbkRhdGFcblxuICAgIGVycm9yOiAobWVzc2FnZSkgLT4gIyBUaHJvdyBhIFN5bnRheEVycm9yIGFzc29jaWF0ZWQgd2l0aCB0aGlzIG5vZGUncyBsb2NhdGlvbi5cbiAgICAgICAgXG4gICAgICAgIHRocm93U3ludGF4RXJyb3IgbW9kdWxlOlwibm9kZXMuI3tAY29uc3RydWN0b3IubmFtZX1cIiwgbWVzc2FnZTptZXNzYWdlLCBsb2NhdGlvbjpAbG9jYXRpb25EYXRhXG5cbiAgICBtYWtlQ29kZTogKGNvZGUpIC0+XG4gICAgICAgIG5ldyBDb2RlRnJhZ21lbnQgdGhpcywgY29kZVxuXG4gICAgd3JhcEluQnJhY2VzOiAoZnJhZ21lbnRzKSAtPlxuICAgICAgICBbXS5jb25jYXQgQG1ha2VDb2RlKCcoJyksIGZyYWdtZW50cywgQG1ha2VDb2RlKCcpJylcblxuICAgICMgYGZyYWdtZW50c0xpc3RgIGlzIGFuIGFycmF5IG9mIGFycmF5cyBvZiBmcmFnbWVudHMuIEVhY2ggYXJyYXkgaW4gZnJhZ21lbnRzTGlzdCB3aWxsIGJlXG4gICAgIyBjb25jYXRvbmF0ZWQgdG9nZXRoZXIsIHdpdGggYGpvaW5TdHJgIGFkZGVkIGluIGJldHdlZW4gZWFjaCwgdG8gcHJvZHVjZSBhIGZpbmFsIGZsYXQgYXJyYXlcbiAgICAjIG9mIGZyYWdtZW50cy5cbiAgICBcbiAgICBqb2luRnJhZ21lbnRBcnJheXM6IChmcmFnbWVudHNMaXN0LCBqb2luU3RyKSAtPlxuICAgICAgICBhbnN3ZXIgPSBbXVxuICAgICAgICBmb3IgZnJhZ21lbnRzLGkgaW4gZnJhZ21lbnRzTGlzdFxuICAgICAgICAgICAgaWYgaSB0aGVuIGFuc3dlci5wdXNoIEBtYWtlQ29kZSBqb2luU3RyXG4gICAgICAgICAgICBhbnN3ZXIgPSBhbnN3ZXIuY29uY2F0IGZyYWdtZW50c1xuICAgICAgICBhbnN3ZXJcblxuIyAwMDAwMDAwICAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICBcbiMgMDAwMDAwMCAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgXG4jIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICBcblxuIyBUaGUgYmxvY2sgaXMgdGhlIGxpc3Qgb2YgZXhwcmVzc2lvbnMgdGhhdCBmb3JtcyB0aGUgYm9keSBvZiBhbiBpbmRlbnRlZCBibG9jayBvZiBjb2RlIFxuIyAtLSB0aGUgaW1wbGVtZW50YXRpb24gb2YgYSBmdW5jdGlvbiwgYSBjbGF1c2UgaW4gYW4gYGlmYCwgYHN3aXRjaGAsIG9yIGB0cnlgLCBhbmQgc28gb24uLi5cblxuZXhwb3J0cy5CbG9jayA9IGNsYXNzIEJsb2NrIGV4dGVuZHMgQmFzZVxuICAgIFxuICAgIEA6IChub2RlcykgLT4gQGV4cHJlc3Npb25zID0gY29tcGFjdCBmbGF0dGVuIG5vZGVzIG9yIFtdXG5cbiAgICBjaGlsZHJlbjogWydleHByZXNzaW9ucyddXG5cbiAgICBwdXNoOiAobm9kZSkgLT4gIyBUYWNrIGFuIGV4cHJlc3Npb24gb24gdG8gdGhlIGVuZCBvZiB0aGlzIGV4cHJlc3Npb24gbGlzdC5cbiAgICAgICAgXG4gICAgICAgIEBleHByZXNzaW9ucy5wdXNoIG5vZGVcbiAgICAgICAgdGhpc1xuXG4gICAgcG9wOiAtPiAjIFJlbW92ZSBhbmQgcmV0dXJuIHRoZSBsYXN0IGV4cHJlc3Npb24gb2YgdGhpcyBleHByZXNzaW9uIGxpc3QuXG4gICAgICAgIFxuICAgICAgICBAZXhwcmVzc2lvbnMucG9wKClcblxuICAgIHVuc2hpZnQ6IChub2RlKSAtPiAjIEFkZCBhbiBleHByZXNzaW9uIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhpcyBleHByZXNzaW9uIGxpc3QuXG4gICAgICAgIFxuICAgICAgICBAZXhwcmVzc2lvbnMudW5zaGlmdCBub2RlXG4gICAgICAgIHRoaXNcblxuICAgICMgSWYgdGhpcyBCbG9jayBjb25zaXN0cyBvZiBqdXN0IGEgc2luZ2xlIG5vZGUsIHVud3JhcCBpdCBieSBwdWxsaW5nIGl0IGJhY2sgb3V0LlxuICAgIFxuICAgIHVud3JhcDogLT5cbiAgICAgICAgaWYgQGV4cHJlc3Npb25zLmxlbmd0aCBpcyAxIHRoZW4gQGV4cHJlc3Npb25zWzBdIGVsc2UgdGhpc1xuXG4gICAgaXNFbXB0eTogLT4gIyBJcyB0aGlzIGFuIGVtcHR5IGJsb2NrIG9mIGNvZGU/XG4gICAgICAgIG5vdCBAZXhwcmVzc2lvbnMubGVuZ3RoXG5cbiAgICBpc1N0YXRlbWVudDogKG8pIC0+XG4gICAgICAgIGZvciBleHAgaW4gQGV4cHJlc3Npb25zIHdoZW4gZXhwLmlzU3RhdGVtZW50IG9cbiAgICAgICAgICAgIHJldHVybiB5ZXNcbiAgICAgICAgbm9cblxuICAgIGp1bXBzOiAobykgLT5cbiAgICAgICAgZm9yIGV4cCBpbiBAZXhwcmVzc2lvbnNcbiAgICAgICAgICAgIHJldHVybiBqdW1wTm9kZSBpZiBqdW1wTm9kZSA9IGV4cC5qdW1wcyBvXG5cbiAgICAjIEEgQmxvY2sgbm9kZSBkb2VzIG5vdCByZXR1cm4gaXRzIGVudGlyZSBib2R5LCByYXRoZXIgaXQgZW5zdXJlcyB0aGF0IHRoZSBmaW5hbCBleHByZXNzaW9uIGlzIHJldHVybmVkLlxuICAgIFxuICAgIG1ha2VSZXR1cm46IChyZXMpIC0+XG4gICAgICAgIFxuICAgICAgICBsZW4gPSBAZXhwcmVzc2lvbnMubGVuZ3RoXG4gICAgICAgIHdoaWxlIGxlbi0tXG4gICAgICAgICAgICBleHByID0gQGV4cHJlc3Npb25zW2xlbl1cbiAgICAgICAgICAgIGlmIGV4cHIgbm90IGluc3RhbmNlb2YgQ29tbWVudFxuICAgICAgICAgICAgICAgIEBleHByZXNzaW9uc1tsZW5dID0gZXhwci5tYWtlUmV0dXJuIHJlc1xuICAgICAgICAgICAgICAgIEBleHByZXNzaW9ucy5zcGxpY2UobGVuLCAxKSBpZiBleHByIGluc3RhbmNlb2YgUmV0dXJuIGFuZCBub3QgZXhwci5leHByZXNzaW9uXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgdGhpc1xuXG4gICAgIyBBIEJsb2NrIGlzIHRoZSBvbmx5IG5vZGUgdGhhdCBjYW4gc2VydmUgYXMgdGhlIHJvb3QuXG4gICAgXG4gICAgY29tcGlsZVRvRnJhZ21lbnRzOiAobyA9IHt9LCBsZXZlbCkgLT5cbiAgICAgICAgaWYgby5zY29wZSB0aGVuIHN1cGVyIG8sIGxldmVsIGVsc2UgQGNvbXBpbGVSb290IG9cblxuICAgICMgQ29tcGlsZSBhbGwgZXhwcmVzc2lvbnMgd2l0aGluIHRoZSBCbG9jayBib2R5LiBcbiAgICAjIElmIHdlIG5lZWQgdG8gcmV0dXJuIHRoZSByZXN1bHQsIGFuZCBpdCdzIGFuIGV4cHJlc3Npb24sIHNpbXBseSByZXR1cm4gaXQuIFxuICAgICMgSWYgaXQncyBhIHN0YXRlbWVudCwgYXNrIHRoZSBzdGF0ZW1lbnQgdG8gZG8gc28uXG4gICAgXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBcbiAgICAgICAgQHRhYiA9IG8uaW5kZW50XG4gICAgICAgIHRvcCAgPSBvLmxldmVsIGlzIExFVkVMX1RPUFxuICAgICAgICBjb21waWxlZE5vZGVzID0gW11cblxuICAgICAgICBmb3Igbm9kZSwgaW5kZXggaW4gQGV4cHJlc3Npb25zXG5cbiAgICAgICAgICAgIG5vZGUgPSBub2RlLnVud3JhcEFsbCgpXG4gICAgICAgICAgICBub2RlID0gKG5vZGUudW5mb2xkU29hayhvKSBvciBub2RlKVxuICAgICAgICAgICAgaWYgbm9kZSBpbnN0YW5jZW9mIEJsb2NrXG4gICAgICAgICAgICAgICAgIyBUaGlzIGlzIGEgbmVzdGVkIGJsb2NrLiBXZSBkb24ndCBkbyBhbnl0aGluZyBzcGVjaWFsIGhlcmUgbGlrZSBlbmNsb3NlIGl0IGluIGEgbmV3IHNjb3BlLlxuICAgICAgICAgICAgICAgICMgV2UganVzdCBjb21waWxlIHRoZSBzdGF0ZW1lbnRzIGluIHRoaXMgYmxvY2sgYWxvbmcgd2l0aCBvdXIgb3duXG4gICAgICAgICAgICAgICAgY29tcGlsZWROb2Rlcy5wdXNoIG5vZGUuY29tcGlsZU5vZGUgb1xuICAgICAgICAgICAgZWxzZSBpZiB0b3BcbiAgICAgICAgICAgICAgICBub2RlLmZyb250ID0gdHJ1ZVxuICAgICAgICAgICAgICAgIGZyYWdtZW50cyA9IG5vZGUuY29tcGlsZVRvRnJhZ21lbnRzIG9cbiAgICAgICAgICAgICAgICBpZiBub3Qgbm9kZS5pc1N0YXRlbWVudChvKSBhbmQgZnJhZ21lbnRzLnVuc2hpZnQ/XG4gICAgICAgICAgICAgICAgICAgIOKWuGFzc2VydCAnbm8gdW5zaGlmdD8nIGZyYWdtZW50cz8udW5zaGlmdD9cbiAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnRzLnVuc2hpZnQgQG1ha2VDb2RlIFwiI3tAdGFifVwiXG4gICAgICAgICAgICAgICAgICAgIGZyYWdtZW50cy5wdXNoIEBtYWtlQ29kZSBcIjtcIlxuICAgICAgICAgICAgICAgIGNvbXBpbGVkTm9kZXMucHVzaCBmcmFnbWVudHNcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBjb21waWxlZE5vZGVzLnB1c2ggbm9kZS5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfTElTVFxuICAgICAgICBpZiB0b3BcbiAgICAgICAgICAgIGlmIEBzcGFjZWRcbiAgICAgICAgICAgICAgICByZXR1cm4gW10uY29uY2F0IEBqb2luRnJhZ21lbnRBcnJheXMoY29tcGlsZWROb2RlcywgJ1xcblxcbicpLCBAbWFrZUNvZGUoXCJcXG5cIilcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gQGpvaW5GcmFnbWVudEFycmF5cyhjb21waWxlZE5vZGVzLCAnXFxuJylcbiAgICAgICAgaWYgY29tcGlsZWROb2Rlcy5sZW5ndGhcbiAgICAgICAgICAgIGFuc3dlciA9IEBqb2luRnJhZ21lbnRBcnJheXMoY29tcGlsZWROb2RlcywgJywgJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgYW5zd2VyID0gW0BtYWtlQ29kZSBcInZvaWQgMFwiXVxuICAgICAgICBpZiBjb21waWxlZE5vZGVzLmxlbmd0aCA+IDEgYW5kIG8ubGV2ZWwgPj0gTEVWRUxfTElTVCB0aGVuIEB3cmFwSW5CcmFjZXMgYW5zd2VyIGVsc2UgYW5zd2VyXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgIyBJZiB3ZSBoYXBwZW4gdG8gYmUgdGhlIHRvcC1sZXZlbCBCbG9jaywgd3JhcCBldmVyeXRoaW5nIGluIGEgc2FmZXR5IGNsb3N1cmUsIHVubGVzcyByZXF1ZXN0ZWQgbm90IHRvLlxuICAgICMgSXQgd291bGQgYmUgYmV0dGVyIG5vdCB0byBnZW5lcmF0ZSB0aGVtIGluIHRoZSBmaXJzdCBwbGFjZSwgYnV0IGZvciBub3csIGNsZWFuIHVwIG9idmlvdXMgZG91YmxlLXBhcmVudGhlc2VzLlxuICAgIFxuICAgIGNvbXBpbGVSb290OiAobykgLT5cbiAgICAgICAgXG4gICAgICAgICMgbzIgPSBPYmplY3QuYXNzaWduIHt9LCBvXG4gICAgICAgICMgZGVsZXRlIG8yLnJlZmVyZW5jZWRWYXJzIFxuICAgICAgICAjIGxvZyAnQmxvY2suY29tcGlsZVJvb3QnLCBvMlxuICAgICAgICBcbiAgICAgICAgby5pbmRlbnQgPSBpZiBvLmJhcmUgdGhlbiAnJyBlbHNlIFRBQlxuICAgICAgICBvLmxldmVsICA9IExFVkVMX1RPUFxuICAgICAgICBAc3BhY2VkICA9IHllc1xuICAgICAgICBvLnNjb3BlICA9IG5ldyBTY29wZSBudWxsLCB0aGlzLCBudWxsLCBvLnJlZmVyZW5jZWRWYXJzID8gW11cbiAgICAgICAgXG4gICAgICAgICMgTWFyayBnaXZlbiBsb2NhbCB2YXJpYWJsZXMgaW4gdGhlIHJvb3Qgc2NvcGUgYXMgcGFyYW1ldGVycyBzbyB0aGV5IGRvbid0IGVuZCB1cCBiZWluZyBkZWNsYXJlZCBvbiB0aGlzIGJsb2NrLlxuICAgICAgICBcbiAgICAgICAgby5zY29wZS5wYXJhbWV0ZXIgbmFtZSBmb3IgbmFtZSBpbiBvLmxvY2FscyBvciBbXVxuICAgICAgICBwcmVsdWRlID0gW11cbiAgICAgICAgaWYgbm90IG8uYmFyZVxuICAgICAgICAgICAgcHJlbHVkZUV4cHMgPSBmb3IgZXhwLCBpIGluIEBleHByZXNzaW9uc1xuICAgICAgICAgICAgICAgIGJyZWFrIHVubGVzcyBleHAudW53cmFwKCkgaW5zdGFuY2VvZiBDb21tZW50XG4gICAgICAgICAgICAgICAgZXhwXG4gICAgICAgICAgICByZXN0ID0gQGV4cHJlc3Npb25zW3ByZWx1ZGVFeHBzLmxlbmd0aC4uLl1cbiAgICAgICAgICAgIEBleHByZXNzaW9ucyA9IHByZWx1ZGVFeHBzXG4gICAgICAgICAgICBpZiBwcmVsdWRlRXhwcy5sZW5ndGhcbiAgICAgICAgICAgICAgICBwcmVsdWRlID0gQGNvbXBpbGVOb2RlIG1lcmdlKG8sIGluZGVudDogJycpXG4gICAgICAgICAgICAgICAgcHJlbHVkZS5wdXNoIEBtYWtlQ29kZSBcIlxcblwiXG4gICAgICAgICAgICBAZXhwcmVzc2lvbnMgPSByZXN0XG4gICAgICAgIGZyYWdtZW50cyA9IEBjb21waWxlV2l0aERlY2xhcmF0aW9ucyBvXG4gICAgICAgIHJldHVybiBmcmFnbWVudHMgaWYgby5iYXJlXG4gICAgICAgIFtdLmNvbmNhdCBwcmVsdWRlLCBAbWFrZUNvZGUoXCIoZnVuY3Rpb24oKSB7XFxuXCIpLCBmcmFnbWVudHMsIEBtYWtlQ29kZShcIlxcbn0pLmNhbGwodGhpcyk7XFxuXCIpXG5cbiAgICAjIENvbXBpbGUgdGhlIGV4cHJlc3Npb25zIGJvZHkgZm9yIHRoZSBjb250ZW50cyBvZiBhIGZ1bmN0aW9uLCB3aXRoIGRlY2xhcmF0aW9ucyBvZiBhbGwgaW5uZXIgdmFyaWFibGVzIHB1c2hlZCB1cCB0byB0aGUgdG9wLlxuICAgIFxuICAgIGNvbXBpbGVXaXRoRGVjbGFyYXRpb25zOiAobykgLT5cbiAgICAgICAgXG4gICAgICAgIGZyYWdtZW50cyA9IFtdXG4gICAgICAgIHBvc3QgPSBbXVxuICAgICAgICBmb3IgZXhwLCBpIGluIEBleHByZXNzaW9uc1xuICAgICAgICAgICAgZXhwID0gZXhwLnVud3JhcCgpXG4gICAgICAgICAgICBicmVhayB1bmxlc3MgZXhwIGluc3RhbmNlb2YgQ29tbWVudCBvciBleHAgaW5zdGFuY2VvZiBMaXRlcmFsXG4gICAgICAgIG8gPSBtZXJnZShvLCBsZXZlbDogTEVWRUxfVE9QKVxuICAgICAgICBpZiBpXG4gICAgICAgICAgICByZXN0ID0gQGV4cHJlc3Npb25zLnNwbGljZSBpLCA5ZTlcbiAgICAgICAgICAgIFtzcGFjZWQsICAgICAgICBAc3BhY2VkXSA9IFtAc3BhY2VkLCBub11cbiAgICAgICAgICAgIFtmcmFnbWVudHMsIEBzcGFjZWRdID0gW0Bjb21waWxlTm9kZShvKSwgc3BhY2VkXVxuICAgICAgICAgICAgQGV4cHJlc3Npb25zID0gcmVzdFxuICAgICAgICBwb3N0ID0gQGNvbXBpbGVOb2RlIG9cbiAgICAgICAge3Njb3BlfSA9IG9cbiAgICAgICAgaWYgc2NvcGUuZXhwcmVzc2lvbnMgaXMgdGhpc1xuICAgICAgICAgICAgZGVjbGFycyA9IG8uc2NvcGUuaGFzRGVjbGFyYXRpb25zKClcbiAgICAgICAgICAgIGFzc2lnbnMgPSBzY29wZS5oYXNBc3NpZ25tZW50c1xuICAgICAgICAgICAgaWYgZGVjbGFycyBvciBhc3NpZ25zXG4gICAgICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlICdcXG4nIGlmIGlcbiAgICAgICAgICAgICAgICBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUgXCIje0B0YWJ9dmFyIFwiXG4gICAgICAgICAgICAgICAgaWYgZGVjbGFyc1xuICAgICAgICAgICAgICAgICAgICBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUgc2NvcGUuZGVjbGFyZWRWYXJpYWJsZXMoKS5qb2luKCcsICcpXG4gICAgICAgICAgICAgICAgaWYgYXNzaWduc1xuICAgICAgICAgICAgICAgICAgICBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUgXCIsXFxuI3tAdGFiICsgVEFCfVwiIGlmIGRlY2xhcnNcbiAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlIHNjb3BlLmFzc2lnbmVkVmFyaWFibGVzKCkuam9pbihcIixcXG4je0B0YWIgKyBUQUJ9XCIpXG4gICAgICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlIFwiO1xcbiN7aWYgQHNwYWNlZCB0aGVuICdcXG4nIGVsc2UgJyd9XCJcbiAgICAgICAgICAgIGVsc2UgaWYgZnJhZ21lbnRzLmxlbmd0aCBhbmQgcG9zdC5sZW5ndGhcbiAgICAgICAgICAgICAgICBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUgXCJcXG5cIlxuICAgICAgICBmcmFnbWVudHMuY29uY2F0IHBvc3RcblxuICAgICMgV3JhcCB1cCB0aGUgZ2l2ZW4gbm9kZXMgYXMgYSAqKkJsb2NrKiosIHVubGVzcyBpdCBhbHJlYWR5IGhhcHBlbnMgdG8gYmUgb25lLlxuICAgIFxuICAgIEB3cmFwOiAobm9kZXMpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gbm9kZXNbMF0gaWYgbm9kZXMubGVuZ3RoIGlzIDEgYW5kIG5vZGVzWzBdIGluc3RhbmNlb2YgQmxvY2tcbiAgICAgICAgbmV3IEJsb2NrIG5vZGVzXG5cbiMgMDAwICAgICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgXG4jIDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIFxuIyAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgICAgICBcbiMgMDAwICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgXG4jIDAwMDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgIFxuXG4jIGBMaXRlcmFsYCBpcyBhIGJhc2UgY2xhc3MgZm9yIHN0YXRpYyB2YWx1ZXMgdGhhdCBjYW4gYmUgcGFzc2VkIHRocm91Z2ggZGlyZWN0bHkgaW50byBKYXZhU2NyaXB0IHdpdGhvdXQgdHJhbnNsYXRpb24sIFxuIyBzdWNoIGFzOiBzdHJpbmdzLCBudW1iZXJzLCBgdHJ1ZWAsIGBmYWxzZWAsIGBudWxsYC4uLlxuXG5leHBvcnRzLkxpdGVyYWwgPSBjbGFzcyBMaXRlcmFsIGV4dGVuZHMgQmFzZVxuICAgIFxuICAgIEA6IChAdmFsdWUpIC0+XG5cbiAgICBpc0NvbXBsZXg6IE5PXG5cbiAgICBhc3NpZ25zOiAobmFtZSkgLT5cbiAgICAgICAgbmFtZSBpcyBAdmFsdWVcblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgW0BtYWtlQ29kZSBAdmFsdWVdXG5cbiAgICB0b1N0cmluZzogLT5cbiAgICAgICAgXCIgI3tpZiBAaXNTdGF0ZW1lbnQoKSB0aGVuIHN1cGVyIGVsc2UgQGNvbnN0cnVjdG9yLm5hbWV9OiAje0B2YWx1ZX1cIlxuXG5leHBvcnRzLk51bWJlckxpdGVyYWwgPSBjbGFzcyBOdW1iZXJMaXRlcmFsIGV4dGVuZHMgTGl0ZXJhbFxuXG5leHBvcnRzLkluZmluaXR5TGl0ZXJhbCA9IGNsYXNzIEluZmluaXR5TGl0ZXJhbCBleHRlbmRzIE51bWJlckxpdGVyYWxcbiAgICBjb21waWxlTm9kZTogLT5cbiAgICAgICAgW0BtYWtlQ29kZSAnMmUzMDgnXVxuXG5leHBvcnRzLk5hTkxpdGVyYWwgPSBjbGFzcyBOYU5MaXRlcmFsIGV4dGVuZHMgTnVtYmVyTGl0ZXJhbFxuICAgIEA6IC0+XG4gICAgICAgIHN1cGVyICdOYU4nXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIGNvZGUgPSBbQG1ha2VDb2RlICcwLzAnXVxuICAgICAgICBpZiBvLmxldmVsID49IExFVkVMX09QIHRoZW4gQHdyYXBJbkJyYWNlcyBjb2RlIGVsc2UgY29kZVxuXG5leHBvcnRzLlN0cmluZ0xpdGVyYWwgPSBjbGFzcyBTdHJpbmdMaXRlcmFsIGV4dGVuZHMgTGl0ZXJhbFxuXG5leHBvcnRzLlJlZ2V4TGl0ZXJhbCA9IGNsYXNzIFJlZ2V4TGl0ZXJhbCBleHRlbmRzIExpdGVyYWxcblxuZXhwb3J0cy5QYXNzdGhyb3VnaExpdGVyYWwgPSBjbGFzcyBQYXNzdGhyb3VnaExpdGVyYWwgZXh0ZW5kcyBMaXRlcmFsXG5cbmV4cG9ydHMuSWRlbnRpZmllckxpdGVyYWwgPSBjbGFzcyBJZGVudGlmaWVyTGl0ZXJhbCBleHRlbmRzIExpdGVyYWxcbiAgICBpc0Fzc2lnbmFibGU6IFlFU1xuXG5leHBvcnRzLlByb3BlcnR5TmFtZSA9IGNsYXNzIFByb3BlcnR5TmFtZSBleHRlbmRzIExpdGVyYWxcbiAgICBpc0Fzc2lnbmFibGU6IFlFU1xuXG5leHBvcnRzLlN0YXRlbWVudExpdGVyYWwgPSBjbGFzcyBTdGF0ZW1lbnRMaXRlcmFsIGV4dGVuZHMgTGl0ZXJhbFxuICAgIGlzU3RhdGVtZW50OiBZRVNcblxuICAgIG1ha2VSZXR1cm46IFRISVNcblxuICAgIGp1bXBzOiAobykgLT5cbiAgICAgICAgcmV0dXJuIHRoaXMgaWYgQHZhbHVlIGlzICdicmVhaycgYW5kIG5vdCAobz8ubG9vcCBvciBvPy5ibG9jaylcbiAgICAgICAgcmV0dXJuIHRoaXMgaWYgQHZhbHVlIGlzICdjb250aW51ZScgYW5kIG5vdCBvPy5sb29wXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIFtAbWFrZUNvZGUgXCIje0B0YWJ9I3tAdmFsdWV9O1wiXVxuXG5leHBvcnRzLlRoaXNMaXRlcmFsID0gY2xhc3MgVGhpc0xpdGVyYWwgZXh0ZW5kcyBMaXRlcmFsXG4gICAgQDogLT5cbiAgICAgICAgc3VwZXIgJ3RoaXMnXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIGNvZGUgPSBpZiBvLnNjb3BlLm1ldGhvZD8uYm91bmQgdGhlbiBvLnNjb3BlLm1ldGhvZC5jb250ZXh0IGVsc2UgQHZhbHVlXG4gICAgICAgIFtAbWFrZUNvZGUgY29kZV1cblxuZXhwb3J0cy5VbmRlZmluZWRMaXRlcmFsID0gY2xhc3MgVW5kZWZpbmVkTGl0ZXJhbCBleHRlbmRzIExpdGVyYWxcbiAgICBAOiAtPlxuICAgICAgICBzdXBlciAndW5kZWZpbmVkJ1xuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBbQG1ha2VDb2RlIGlmIG8ubGV2ZWwgPj0gTEVWRUxfQUNDRVNTIHRoZW4gJyh2b2lkIDApJyBlbHNlICd2b2lkIDAnXVxuXG5leHBvcnRzLk51bGxMaXRlcmFsID0gY2xhc3MgTnVsbExpdGVyYWwgZXh0ZW5kcyBMaXRlcmFsXG4gICAgQDogLT5cbiAgICAgICAgc3VwZXIgJ251bGwnXG5cbmV4cG9ydHMuQm9vbGVhbkxpdGVyYWwgPSBjbGFzcyBCb29sZWFuTGl0ZXJhbCBleHRlbmRzIExpdGVyYWxcblxuIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgMCAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuXG4jIEEgYHJldHVybmAgaXMgYSAqcHVyZVN0YXRlbWVudCogLS0gd3JhcHBpbmcgaXQgaW4gYSBjbG9zdXJlIHdvdWxkbid0IG1ha2Ugc2Vuc2UuXG5cbmV4cG9ydHMuUmV0dXJuID0gY2xhc3MgUmV0dXJuIGV4dGVuZHMgQmFzZVxuICAgIEA6IChAZXhwcmVzc2lvbikgLT5cblxuICAgIGNoaWxkcmVuOiBbJ2V4cHJlc3Npb24nXVxuXG4gICAgaXNTdGF0ZW1lbnQ6IFlFU1xuICAgIG1ha2VSZXR1cm46ICBUSElTXG4gICAganVtcHM6ICAgICAgIFRISVNcblxuICAgIGNvbXBpbGVUb0ZyYWdtZW50czogKG8sIGxldmVsKSAtPlxuICAgICAgICBleHByID0gQGV4cHJlc3Npb24/Lm1ha2VSZXR1cm4oKVxuICAgICAgICBpZiBleHByIGFuZCBleHByIG5vdCBpbnN0YW5jZW9mIFJldHVybiB0aGVuIGV4cHIuY29tcGlsZVRvRnJhZ21lbnRzIG8sIGxldmVsIGVsc2Ugc3VwZXIgbywgbGV2ZWxcblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgYW5zd2VyID0gW11cbiAgICAgICAgIyBUT0RPOiBJZiB3ZSBjYWxsIGV4cHJlc3Npb24uY29tcGlsZSgpIGhlcmUgdHdpY2UsIHdlJ2xsIHNvbWV0aW1lcyBnZXQgYmFjayBkaWZmZXJlbnQgcmVzdWx0cyFcbiAgICAgICAgYW5zd2VyLnB1c2ggQG1ha2VDb2RlIEB0YWIgKyBcInJldHVybiN7aWYgQGV4cHJlc3Npb24gdGhlbiBcIiBcIiBlbHNlIFwiXCJ9XCJcbiAgICAgICAgaWYgQGV4cHJlc3Npb25cbiAgICAgICAgICAgIGFuc3dlciA9IGFuc3dlci5jb25jYXQgQGV4cHJlc3Npb24uY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX1BBUkVOXG4gICAgICAgIGFuc3dlci5wdXNoIEBtYWtlQ29kZSBcIjtcIlxuICAgICAgICByZXR1cm4gYW5zd2VyXG5cbiMgYHlpZWxkIHJldHVybmAgd29ya3MgZXhhY3RseSBsaWtlIGByZXR1cm5gLCBleGNlcHQgdGhhdCBpdCB0dXJucyB0aGUgZnVuY3Rpb24gaW50byBhIGdlbmVyYXRvci5cblxuZXhwb3J0cy5ZaWVsZFJldHVybiA9IGNsYXNzIFlpZWxkUmV0dXJuIGV4dGVuZHMgUmV0dXJuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICB1bmxlc3Mgby5zY29wZS5wYXJlbnQ/XG4gICAgICAgICAgICBAZXJyb3IgJ3lpZWxkIGNhbiBvbmx5IG9jY3VyIGluc2lkZSBmdW5jdGlvbnMnXG4gICAgICAgIHN1cGVyXG5cbiMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4jICAwMDAgMDAwICAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuIyAgICAgMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG5cbiMgQSB2YWx1ZSwgdmFyaWFibGUgb3IgbGl0ZXJhbCBvciBwYXJlbnRoZXNpemVkLCBpbmRleGVkIG9yIGRvdHRlZCBpbnRvLCBvciB2YW5pbGxhLlxuXG5leHBvcnRzLlZhbHVlID0gY2xhc3MgVmFsdWUgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgQDogKGJhc2UsIHByb3BzLCB0YWcpIC0+XG4gICAgICAgIHJldHVybiBiYXNlIGlmIG5vdCBwcm9wcyBhbmQgYmFzZSBpbnN0YW5jZW9mIFZhbHVlXG4gICAgICAgIEBiYXNlICAgICAgID0gYmFzZVxuICAgICAgICBAcHJvcGVydGllcyA9IHByb3BzIG9yIFtdXG4gICAgICAgIEBbdGFnXSAgICAgID0gdHJ1ZSBpZiB0YWdcbiAgICAgICAgcmV0dXJuIHRoaXNcblxuICAgIGNoaWxkcmVuOiBbJ2Jhc2UnLCAncHJvcGVydGllcyddXG5cbiAgICAjIEFkZCBhIHByb3BlcnR5IChvciAqcHJvcGVydGllcyogKSBgQWNjZXNzYCB0byB0aGUgbGlzdC5cbiAgICBhZGQ6IChwcm9wcykgLT5cbiAgICAgICAgQHByb3BlcnRpZXMgPSBAcHJvcGVydGllcy5jb25jYXQgcHJvcHNcbiAgICAgICAgdGhpc1xuXG4gICAgaGFzUHJvcGVydGllczogLT5cbiAgICAgICAgISFAcHJvcGVydGllcy5sZW5ndGhcblxuICAgIGJhcmVMaXRlcmFsOiAodHlwZSkgLT5cbiAgICAgICAgbm90IEBwcm9wZXJ0aWVzLmxlbmd0aCBhbmQgQGJhc2UgaW5zdGFuY2VvZiB0eXBlXG5cbiAgICAjIFNvbWUgYm9vbGVhbiBjaGVja3MgZm9yIHRoZSBiZW5lZml0IG9mIG90aGVyIG5vZGVzLlxuICAgIGlzQXJyYXk6ICAgICAgLT4gQGJhcmVMaXRlcmFsKEFycilcbiAgICBpc1JhbmdlOiAgICAgIC0+IEBiYXJlTGl0ZXJhbChSYW5nZSlcbiAgICBpc0NvbXBsZXg6ICAgIC0+IEBoYXNQcm9wZXJ0aWVzKCkgb3IgQGJhc2UuaXNDb21wbGV4KClcbiAgICBpc0Fzc2lnbmFibGU6IC0+IEBoYXNQcm9wZXJ0aWVzKCkgb3IgQGJhc2UuaXNBc3NpZ25hYmxlKClcbiAgICBpc051bWJlcjogICAgIC0+IEBiYXJlTGl0ZXJhbChOdW1iZXJMaXRlcmFsKVxuICAgIGlzU3RyaW5nOiAgICAgLT4gQGJhcmVMaXRlcmFsKFN0cmluZ0xpdGVyYWwpXG4gICAgaXNSZWdleDogICAgICAtPiBAYmFyZUxpdGVyYWwoUmVnZXhMaXRlcmFsKVxuICAgIGlzVW5kZWZpbmVkOiAgLT4gQGJhcmVMaXRlcmFsKFVuZGVmaW5lZExpdGVyYWwpXG4gICAgaXNOdWxsOiAgICAgICAtPiBAYmFyZUxpdGVyYWwoTnVsbExpdGVyYWwpXG4gICAgaXNCb29sZWFuOiAgICAtPiBAYmFyZUxpdGVyYWwoQm9vbGVhbkxpdGVyYWwpXG4gICAgaXNBdG9taWM6ICAgICAtPlxuICAgICAgICBmb3Igbm9kZSBpbiBAcHJvcGVydGllcy5jb25jYXQgQGJhc2VcbiAgICAgICAgICAgIHJldHVybiBubyBpZiBub2RlLnNvYWsgb3Igbm9kZSBpbnN0YW5jZW9mIENhbGxcbiAgICAgICAgeWVzXG5cbiAgICBpc05vdENhbGxhYmxlOiAtPiBAaXNOdW1iZXIoKSBvciBAaXNTdHJpbmcoKSBvciBAaXNSZWdleCgpIG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQGlzQXJyYXkoKSBvciBAaXNSYW5nZSgpIG9yIEBpc1NwbGljZSgpIG9yIEBpc09iamVjdCgpIG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQGlzVW5kZWZpbmVkKCkgb3IgQGlzTnVsbCgpIG9yIEBpc0Jvb2xlYW4oKVxuXG4gICAgaXNTdGF0ZW1lbnQ6IChvKSAgICAtPiBub3QgQHByb3BlcnRpZXMubGVuZ3RoIGFuZCBAYmFzZS5pc1N0YXRlbWVudCBvXG4gICAgYXNzaWduczogICAgIChuYW1lKSAtPiBub3QgQHByb3BlcnRpZXMubGVuZ3RoIGFuZCBAYmFzZS5hc3NpZ25zIG5hbWVcbiAgICBqdW1wczogICAgICAgKG8pICAgIC0+IG5vdCBAcHJvcGVydGllcy5sZW5ndGggYW5kIEBiYXNlLmp1bXBzIG9cblxuICAgIGlzT2JqZWN0OiAob25seUdlbmVyYXRlZCkgLT5cbiAgICAgICAgcmV0dXJuIG5vIGlmIEBwcm9wZXJ0aWVzLmxlbmd0aFxuICAgICAgICAoQGJhc2UgaW5zdGFuY2VvZiBPYmopIGFuZCAobm90IG9ubHlHZW5lcmF0ZWQgb3IgQGJhc2UuZ2VuZXJhdGVkKVxuXG4gICAgaXNTcGxpY2U6IC0+XG4gICAgICAgIFsuLi4sIGxhc3RQcm9wXSA9IEBwcm9wZXJ0aWVzXG4gICAgICAgIGxhc3RQcm9wIGluc3RhbmNlb2YgU2xpY2VcblxuICAgIGxvb2tzU3RhdGljOiAoY2xhc3NOYW1lKSAtPlxuICAgICAgICBAYmFzZS52YWx1ZSBpcyBjbGFzc05hbWUgYW5kIEBwcm9wZXJ0aWVzLmxlbmd0aCBpcyAxIGFuZFxuICAgICAgICAgICAgQHByb3BlcnRpZXNbMF0ubmFtZT8udmFsdWUgIT0gJ3Byb3RvdHlwZSdcblxuICAgICMgVGhlIHZhbHVlIGNhbiBiZSB1bndyYXBwZWQgYXMgaXRzIGlubmVyIG5vZGUsIGlmIHRoZXJlIGFyZSBubyBhdHRhY2hlZCBwcm9wZXJ0aWVzLlxuICAgIHVud3JhcDogLT5cbiAgICAgICAgaWYgQHByb3BlcnRpZXMubGVuZ3RoIHRoZW4gdGhpcyBlbHNlIEBiYXNlXG5cbiAgICAjIEEgcmVmZXJlbmNlIGhhcyBiYXNlIHBhcnQgKGB0aGlzYCB2YWx1ZSkgYW5kIG5hbWUgcGFydC5cbiAgICAjIFdlIGNhY2hlIHRoZW0gc2VwYXJhdGVseSBmb3IgY29tcGlsaW5nIGNvbXBsZXggZXhwcmVzc2lvbnMuXG4gICAgIyBgYSgpW2IoKV0gPz0gY2AgLT4gYChfYmFzZSA9IGEoKSlbX25hbWUgPSBiKCldID8gX2Jhc2VbX25hbWVdID0gY2BcbiAgICBcbiAgICBjYWNoZVJlZmVyZW5jZTogKG8pIC0+XG4gICAgICAgIFxuICAgICAgICBbLi4uLCBuYW1lXSA9IEBwcm9wZXJ0aWVzXG4gICAgICAgIGlmIEBwcm9wZXJ0aWVzLmxlbmd0aCA8IDIgYW5kIG5vdCBAYmFzZS5pc0NvbXBsZXgoKSBhbmQgbm90IG5hbWU/LmlzQ29tcGxleCgpXG4gICAgICAgICAgICByZXR1cm4gW3RoaXMsIHRoaXNdICAjIGBhYCBgYS5iYFxuICAgICAgICBiYXNlID0gbmV3IFZhbHVlIEBiYXNlLCBAcHJvcGVydGllc1suLi4tMV1cbiAgICAgICAgaWYgYmFzZS5pc0NvbXBsZXgoKSAgIyBgYSgpLmJgXG4gICAgICAgICAgICBicmVmID0gbmV3IElkZW50aWZpZXJMaXRlcmFsIG8uc2NvcGUuZnJlZVZhcmlhYmxlICdiYXNlJ1xuICAgICAgICAgICAgYmFzZSA9IG5ldyBWYWx1ZSBuZXcgUGFyZW5zIG5ldyBBc3NpZ24gYnJlZiwgYmFzZVxuICAgICAgICByZXR1cm4gW2Jhc2UsIGJyZWZdIHVubGVzcyBuYW1lICAjIGBhKClgXG4gICAgICAgIGlmIG5hbWUuaXNDb21wbGV4KCkgICMgYGFbYigpXWBcbiAgICAgICAgICAgIG5yZWYgPSBuZXcgSWRlbnRpZmllckxpdGVyYWwgby5zY29wZS5mcmVlVmFyaWFibGUgJ25hbWUnXG4gICAgICAgICAgICBuYW1lID0gbmV3IEluZGV4IG5ldyBBc3NpZ24gbnJlZiwgbmFtZS5pbmRleFxuICAgICAgICAgICAgbnJlZiA9IG5ldyBJbmRleCBucmVmXG4gICAgICAgIFtiYXNlLmFkZChuYW1lKSwgbmV3IFZhbHVlKGJyZWYgb3IgYmFzZS5iYXNlLCBbbnJlZiBvciBuYW1lXSldXG5cbiAgICAjIFdlIGNvbXBpbGUgYSB2YWx1ZSB0byBKYXZhU2NyaXB0IGJ5IGNvbXBpbGluZyBhbmQgam9pbmluZyBlYWNoIHByb3BlcnR5LlxuICAgICMgVGhpbmdzIGdldCBtdWNoIG1vcmUgaW50ZXJlc3RpbmcgaWYgdGhlIGNoYWluIG9mIHByb3BlcnRpZXMgaGFzICpzb2FrKlxuICAgICMgb3BlcmF0b3JzIGA/LmAgaW50ZXJzcGVyc2VkLiBUaGVuIHdlIGhhdmUgdG8gdGFrZSBjYXJlIG5vdCB0byBhY2NpZGVudGFsbHlcbiAgICAjIGV2YWx1YXRlIGFueXRoaW5nIHR3aWNlIHdoZW4gYnVpbGRpbmcgdGhlIHNvYWsgY2hhaW4uXG4gICAgXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBcbiAgICAgICAgQGJhc2UuZnJvbnQgPSBAZnJvbnRcbiAgICAgICAgcHJvcHMgPSBAcHJvcGVydGllc1xuICAgICAgICBmcmFnbWVudHMgPSBAYmFzZS5jb21waWxlVG9GcmFnbWVudHMgbywgKGlmIHByb3BzLmxlbmd0aCB0aGVuIExFVkVMX0FDQ0VTUyBlbHNlIG51bGwpXG4gICAgICAgIGlmIHByb3BzLmxlbmd0aCBhbmQgU0lNUExFTlVNLnRlc3QgQGZyYWdtZW50c1RvVGV4dCBmcmFnbWVudHNcbiAgICAgICAgICAgIGZyYWdtZW50cy5wdXNoIEBtYWtlQ29kZSAnLidcbiAgICAgICAgZm9yIHByb3AgaW4gcHJvcHNcbiAgICAgICAgICAgIGZyYWdtZW50cy5wdXNoIChwcm9wLmNvbXBpbGVUb0ZyYWdtZW50cyBvKS4uLlxuICAgICAgICBmcmFnbWVudHNcblxuICAgICMgVW5mb2xkIGEgc29hayBpbnRvIGFuIGBJZmA6IGBhPy5iYCAtPiBgYS5iIGlmIGE/YFxuICAgIFxuICAgIHVuZm9sZFNvYWs6IChvKSAtPlxuICAgICAgICBcbiAgICAgICAgQHVuZm9sZGVkU29hayA/PSBkbyA9PlxuICAgICAgICAgICAgaWYgaWZuID0gQGJhc2UudW5mb2xkU29hayBvXG4gICAgICAgICAgICAgICAgaWZuLmJvZHkucHJvcGVydGllcy5wdXNoIEBwcm9wZXJ0aWVzLi4uXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlmblxuICAgICAgICAgICAgZm9yIHByb3AsIGkgaW4gQHByb3BlcnRpZXMgd2hlbiBwcm9wLnNvYWtcbiAgICAgICAgICAgICAgICBwcm9wLnNvYWsgPSBvZmZcbiAgICAgICAgICAgICAgICBmc3QgPSBuZXcgVmFsdWUgQGJhc2UsIEBwcm9wZXJ0aWVzWy4uLmldXG4gICAgICAgICAgICAgICAgc25kID0gbmV3IFZhbHVlIEBiYXNlLCBAcHJvcGVydGllc1tpLi5dXG4gICAgICAgICAgICAgICAgaWYgZnN0LmlzQ29tcGxleCgpXG4gICAgICAgICAgICAgICAgICAgIHJlZiA9IG5ldyBJZGVudGlmaWVyTGl0ZXJhbCBvLnNjb3BlLmZyZWVWYXJpYWJsZSAncmVmJ1xuICAgICAgICAgICAgICAgICAgICBmc3QgPSBuZXcgUGFyZW5zIG5ldyBBc3NpZ24gcmVmLCBmc3RcbiAgICAgICAgICAgICAgICAgICAgc25kLmJhc2UgPSByZWZcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IElmIG5ldyBFeGlzdGVuY2UoZnN0KSwgc25kLCBzb2FrOiBvblxuICAgICAgICAgICAgbm9cblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAgICAwMDAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG5cbmV4cG9ydHMuQ29tbWVudCA9IGNsYXNzIENvbW1lbnQgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgQDogKEBjb21tZW50KSAtPlxuXG4gICAgaXNTdGF0ZW1lbnQ6IFlFU1xuICAgIG1ha2VSZXR1cm46ICBUSElTXG5cbiAgICBjb21waWxlTm9kZTogKG8sIGxldmVsKSAtPlxuICAgICAgICBcbiAgICAgICAgY29tbWVudCA9IEBjb21tZW50LnJlcGxhY2UgL14oXFxzKikjKD89XFxzKS9nbSwgXCIkMSAqXCJcbiAgICAgICAgY29kZSA9IFwiLyoje211bHRpZGVudCBjb21tZW50LCBAdGFifSN7aWYgJ1xcbicgaW4gY29tbWVudCB0aGVuIFwiXFxuI3tAdGFifVwiIGVsc2UgJyd9ICovXCJcbiAgICAgICAgY29kZSA9IG8uaW5kZW50ICsgY29kZSBpZiAobGV2ZWwgb3Igby5sZXZlbCkgaXMgTEVWRUxfVE9QXG4gICAgICAgIFtAbWFrZUNvZGUoXCJcXG5cIiksIEBtYWtlQ29kZShjb2RlKV1cblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgXG4jIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICBcbiMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMCAgXG5cbiMgTm9kZSBmb3IgYSBmdW5jdGlvbiBpbnZvY2F0aW9uLlxuICAgIFxuZXhwb3J0cy5DYWxsID0gY2xhc3MgQ2FsbCBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBAOiAoQHZhcmlhYmxlLCBAYXJncyA9IFtdLCBAc29haykgLT5cbiAgICAgICAgXG4gICAgICAgIEBpc05ldyA9IGZhbHNlXG4gICAgICAgIGlmIEB2YXJpYWJsZSBpbnN0YW5jZW9mIFZhbHVlIGFuZCBAdmFyaWFibGUuaXNOb3RDYWxsYWJsZSgpXG4gICAgICAgICAgICAjIGxvZyBAdmFyaWFibGVcbiAgICAgICAgICAgIEB2YXJpYWJsZS5lcnJvciBcImxpdGVyYWwgaXMgbm90IGEgZnVuY3Rpb25cIlxuXG4gICAgY2hpbGRyZW46IFsndmFyaWFibGUnLCAnYXJncyddXG5cbiAgICAjIFdoZW4gc2V0dGluZyB0aGUgbG9jYXRpb24sIHdlIHNvbWV0aW1lcyBuZWVkIHRvIHVwZGF0ZSB0aGUgc3RhcnQgbG9jYXRpb24gdG9cbiAgICAjIGFjY291bnQgZm9yIGEgbmV3bHktZGlzY292ZXJlZCBgbmV3YCBvcGVyYXRvciB0byB0aGUgbGVmdCBvZiB1cy4gVGhpc1xuICAgICMgZXhwYW5kcyB0aGUgcmFuZ2Ugb24gdGhlIGxlZnQsIGJ1dCBub3QgdGhlIHJpZ2h0LlxuICAgIFxuICAgIHVwZGF0ZUxvY2F0aW9uRGF0YUlmTWlzc2luZzogKGxvY2F0aW9uRGF0YSkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBsb2NhdGlvbkRhdGEgYW5kIEBuZWVkc1VwZGF0ZWRTdGFydExvY2F0aW9uXG4gICAgICAgICAgICBAbG9jYXRpb25EYXRhLmZpcnN0X2xpbmUgPSBsb2NhdGlvbkRhdGEuZmlyc3RfbGluZVxuICAgICAgICAgICAgQGxvY2F0aW9uRGF0YS5maXJzdF9jb2x1bW4gPSBsb2NhdGlvbkRhdGEuZmlyc3RfY29sdW1uXG4gICAgICAgICAgICBiYXNlID0gQHZhcmlhYmxlPy5iYXNlIG9yIEB2YXJpYWJsZVxuICAgICAgICAgICAgaWYgYmFzZS5uZWVkc1VwZGF0ZWRTdGFydExvY2F0aW9uXG4gICAgICAgICAgICAgICAgQHZhcmlhYmxlLmxvY2F0aW9uRGF0YS5maXJzdF9saW5lID0gbG9jYXRpb25EYXRhLmZpcnN0X2xpbmVcbiAgICAgICAgICAgICAgICBAdmFyaWFibGUubG9jYXRpb25EYXRhLmZpcnN0X2NvbHVtbiA9IGxvY2F0aW9uRGF0YS5maXJzdF9jb2x1bW5cbiAgICAgICAgICAgICAgICBiYXNlLnVwZGF0ZUxvY2F0aW9uRGF0YUlmTWlzc2luZyBsb2NhdGlvbkRhdGFcbiAgICAgICAgICAgIGRlbGV0ZSBAbmVlZHNVcGRhdGVkU3RhcnRMb2NhdGlvblxuICAgICAgICBzdXBlclxuXG4gICAgIyBUYWcgdGhpcyBpbnZvY2F0aW9uIGFzIGNyZWF0aW5nIGEgbmV3IGluc3RhbmNlLlxuICAgIG5ld0luc3RhbmNlOiAtPlxuICAgICAgICBiYXNlID0gQHZhcmlhYmxlPy5iYXNlIG9yIEB2YXJpYWJsZVxuICAgICAgICBpZiBiYXNlIGluc3RhbmNlb2YgQ2FsbCBhbmQgbm90IGJhc2UuaXNOZXdcbiAgICAgICAgICAgIGJhc2UubmV3SW5zdGFuY2UoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAaXNOZXcgPSB0cnVlXG4gICAgICAgIEBuZWVkc1VwZGF0ZWRTdGFydExvY2F0aW9uID0gdHJ1ZVxuICAgICAgICB0aGlzXG5cbiAgICAjIFNvYWtlZCBjaGFpbmVkIGludm9jYXRpb25zIHVuZm9sZCBpbnRvIGlmL2Vsc2UgdGVybmFyeSBzdHJ1Y3R1cmVzLlxuICAgIHVuZm9sZFNvYWs6IChvKSAtPlxuICAgICAgICBpZiBAc29ha1xuICAgICAgICAgICAgaWYgdGhpcyBpbnN0YW5jZW9mIFN1cGVyQ2FsbFxuICAgICAgICAgICAgICAgIGxlZnQgPSBuZXcgTGl0ZXJhbCBAc3VwZXJSZWZlcmVuY2Ugb1xuICAgICAgICAgICAgICAgIHJpdGUgPSBuZXcgVmFsdWUgbGVmdFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBpZm4gaWYgaWZuID0gdW5mb2xkU29hayBvLCB0aGlzLCAndmFyaWFibGUnXG4gICAgICAgICAgICAgICAgW2xlZnQsIHJpdGVdID0gbmV3IFZhbHVlKEB2YXJpYWJsZSkuY2FjaGVSZWZlcmVuY2Ugb1xuICAgICAgICAgICAgcml0ZSA9IG5ldyBDYWxsIHJpdGUsIEBhcmdzXG4gICAgICAgICAgICByaXRlLmlzTmV3ID0gQGlzTmV3XG4gICAgICAgICAgICBsZWZ0ID0gbmV3IExpdGVyYWwgXCJ0eXBlb2YgI3sgbGVmdC5jb21waWxlIG8gfSA9PT0gXFxcImZ1bmN0aW9uXFxcIlwiXG4gICAgICAgICAgICByZXR1cm4gbmV3IElmIGxlZnQsIG5ldyBWYWx1ZShyaXRlKSwgc29hazogeWVzXG4gICAgICAgIGNhbGwgPSB0aGlzXG4gICAgICAgIGxpc3QgPSBbXVxuICAgICAgICBsb29wXG4gICAgICAgICAgICBpZiBjYWxsLnZhcmlhYmxlIGluc3RhbmNlb2YgQ2FsbFxuICAgICAgICAgICAgICAgIGxpc3QucHVzaCBjYWxsXG4gICAgICAgICAgICAgICAgY2FsbCA9IGNhbGwudmFyaWFibGVcbiAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgYnJlYWsgdW5sZXNzIGNhbGwudmFyaWFibGUgaW5zdGFuY2VvZiBWYWx1ZVxuICAgICAgICAgICAgbGlzdC5wdXNoIGNhbGxcbiAgICAgICAgICAgIGJyZWFrIHVubGVzcyAoY2FsbCA9IGNhbGwudmFyaWFibGUuYmFzZSkgaW5zdGFuY2VvZiBDYWxsXG4gICAgICAgIGZvciBjYWxsIGluIGxpc3QucmV2ZXJzZSgpXG4gICAgICAgICAgICBpZiBpZm5cbiAgICAgICAgICAgICAgICBpZiBjYWxsLnZhcmlhYmxlIGluc3RhbmNlb2YgQ2FsbFxuICAgICAgICAgICAgICAgICAgICBjYWxsLnZhcmlhYmxlID0gaWZuXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBjYWxsLnZhcmlhYmxlLmJhc2UgPSBpZm5cbiAgICAgICAgICAgIGlmbiA9IHVuZm9sZFNvYWsgbywgY2FsbCwgJ3ZhcmlhYmxlJ1xuICAgICAgICBpZm5cblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT4gIyBDb21waWxlIGEgdmFuaWxsYSBmdW5jdGlvbiBjYWxsLlxuICAgICAgICBcbiAgICAgICAgQHZhcmlhYmxlPy5mcm9udCA9IEBmcm9udFxuICAgICAgICBjb21waWxlZEFycmF5ID0gU3BsYXQuY29tcGlsZVNwbGF0dGVkQXJyYXkgbywgQGFyZ3MsIHRydWVcbiAgICAgICAgaWYgY29tcGlsZWRBcnJheS5sZW5ndGhcbiAgICAgICAgICAgIHJldHVybiBAY29tcGlsZVNwbGF0IG8sIGNvbXBpbGVkQXJyYXlcbiAgICAgICAgY29tcGlsZWRBcmdzID0gW11cbiAgICAgICAgZm9yIGFyZywgYXJnSW5kZXggaW4gQGFyZ3NcbiAgICAgICAgICAgIGlmIGFyZ0luZGV4IHRoZW4gY29tcGlsZWRBcmdzLnB1c2ggQG1ha2VDb2RlIFwiLCBcIlxuICAgICAgICAgICAgY29tcGlsZWRBcmdzLnB1c2ggKGFyZy5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfTElTVCkuLi5cblxuICAgICAgICBmcmFnbWVudHMgPSBbXVxuICAgICAgICBpZiB0aGlzIGluc3RhbmNlb2YgU3VwZXJDYWxsXG4gICAgICAgICAgICBwcmVmYWNlID0gQHN1cGVyUmVmZXJlbmNlKG8pICsgXCIuY2FsbCgje0BzdXBlclRoaXMobyl9XCJcbiAgICAgICAgICAgIGlmIGNvbXBpbGVkQXJncy5sZW5ndGggdGhlbiBwcmVmYWNlICs9IFwiLCBcIlxuICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlIHByZWZhY2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgQGlzTmV3IHRoZW4gZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlICduZXcgJ1xuICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2ggQHZhcmlhYmxlLmNvbXBpbGVUb0ZyYWdtZW50cyhvLCBMRVZFTF9BQ0NFU1MpLi4uXG4gICAgICAgICAgICBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUgXCIoXCJcbiAgICAgICAgZnJhZ21lbnRzLnB1c2ggY29tcGlsZWRBcmdzLi4uXG4gICAgICAgIGZyYWdtZW50cy5wdXNoIEBtYWtlQ29kZSBcIilcIlxuICAgICAgICBmcmFnbWVudHNcblxuICAgICMgSWYgeW91IGNhbGwgYSBmdW5jdGlvbiB3aXRoIGEgc3BsYXQsIGl0J3MgY29udmVydGVkIGludG8gYSBKYXZhU2NyaXB0XG4gICAgIyBgLmFwcGx5KClgIGNhbGwgdG8gYWxsb3cgYW4gYXJyYXkgb2YgYXJndW1lbnRzIHRvIGJlIHBhc3NlZC5cbiAgICAjIElmIGl0J3MgYSBjb25zdHJ1Y3RvciwgdGhlbiB0aGluZ3MgZ2V0IHJlYWwgdHJpY2t5LiBXZSBoYXZlIHRvIGluamVjdCBhblxuICAgICMgaW5uZXIgY29uc3RydWN0b3IgaW4gb3JkZXIgdG8gYmUgYWJsZSB0byBwYXNzIHRoZSB2YXJhcmdzLlxuICAgICNcbiAgICAjIHNwbGF0QXJncyBpcyBhbiBhcnJheSBvZiBDb2RlRnJhZ21lbnRzIHRvIHB1dCBpbnRvIHRoZSAnYXBwbHknLlxuICAgIFxuICAgIGNvbXBpbGVTcGxhdDogKG8sIHNwbGF0QXJncykgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIHRoaXMgaW5zdGFuY2VvZiBTdXBlckNhbGxcbiAgICAgICAgICAgIHJldHVybiBbXS5jb25jYXQgQG1ha2VDb2RlKFwiI3sgQHN1cGVyUmVmZXJlbmNlIG8gfS5hcHBseSgje0BzdXBlclRoaXMobyl9LCBcIiksXG4gICAgICAgICAgICAgICAgc3BsYXRBcmdzLCBAbWFrZUNvZGUoXCIpXCIpXG5cbiAgICAgICAgaWYgQGlzTmV3XG4gICAgICAgICAgICBpZHQgPSBAdGFiICsgVEFCXG4gICAgICAgICAgICByZXR1cm4gW10uY29uY2F0IEBtYWtlQ29kZShcIlwiXCJcbiAgICAgICAgICAgICAgICAoZnVuY3Rpb24oZnVuYywgYXJncywgY3Rvcikge1xuICAgICAgICAgICAgICAgICN7aWR0fWN0b3IucHJvdG90eXBlID0gZnVuYy5wcm90b3R5cGU7XG4gICAgICAgICAgICAgICAgI3tpZHR9dmFyIGNoaWxkID0gbmV3IGN0b3IsIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY2hpbGQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgICN7aWR0fXJldHVybiBPYmplY3QocmVzdWx0KSA9PT0gcmVzdWx0ID8gcmVzdWx0IDogY2hpbGQ7XG4gICAgICAgICAgICAgICAgI3tAdGFifX0pKFwiXCJcIiksXG4gICAgICAgICAgICAgICAgKEB2YXJpYWJsZS5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfTElTVCksXG4gICAgICAgICAgICAgICAgQG1ha2VDb2RlKFwiLCBcIiksIHNwbGF0QXJncywgQG1ha2VDb2RlKFwiLCBmdW5jdGlvbigpe30pXCIpXG5cbiAgICAgICAgYW5zd2VyID0gW11cbiAgICAgICAgYmFzZSA9IG5ldyBWYWx1ZSBAdmFyaWFibGVcbiAgICAgICAgaWYgKG5hbWUgPSBiYXNlLnByb3BlcnRpZXMucG9wKCkpIGFuZCBiYXNlLmlzQ29tcGxleCgpXG4gICAgICAgICAgICByZWYgPSBvLnNjb3BlLmZyZWVWYXJpYWJsZSAncmVmJ1xuICAgICAgICAgICAgYW5zd2VyID0gYW5zd2VyLmNvbmNhdCBAbWFrZUNvZGUoXCIoI3tyZWZ9ID0gXCIpLFxuICAgICAgICAgICAgICAgIChiYXNlLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9MSVNUKSxcbiAgICAgICAgICAgICAgICBAbWFrZUNvZGUoXCIpXCIpLFxuICAgICAgICAgICAgICAgIG5hbWUuY29tcGlsZVRvRnJhZ21lbnRzKG8pXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGZ1biA9IGJhc2UuY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX0FDQ0VTU1xuICAgICAgICAgICAgZnVuID0gQHdyYXBJbkJyYWNlcyBmdW4gaWYgU0lNUExFTlVNLnRlc3QgQGZyYWdtZW50c1RvVGV4dCBmdW5cbiAgICAgICAgICAgIGlmIG5hbWVcbiAgICAgICAgICAgICAgICByZWYgPSBAZnJhZ21lbnRzVG9UZXh0IGZ1blxuICAgICAgICAgICAgICAgIGZ1bi5wdXNoIChuYW1lLmNvbXBpbGVUb0ZyYWdtZW50cyBvKS4uLlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJlZiA9ICdudWxsJ1xuICAgICAgICAgICAgYW5zd2VyID0gYW5zd2VyLmNvbmNhdCBmdW5cbiAgICAgICAgYW5zd2VyID0gYW5zd2VyLmNvbmNhdCBAbWFrZUNvZGUoXCIuYXBwbHkoI3tyZWZ9LCBcIiksIHNwbGF0QXJncywgQG1ha2VDb2RlKFwiKVwiKVxuXG4jICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4jICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG5cbiMgVGFrZXMgY2FyZSBvZiBjb252ZXJ0aW5nIGBzdXBlcigpYCBjYWxscyBpbnRvIGNhbGxzIGFnYWluc3QgdGhlIHByb3RvdHlwZSdzIGZ1bmN0aW9uIG9mIHRoZSBzYW1lIG5hbWUuXG5cbmV4cG9ydHMuU3VwZXJDYWxsID0gY2xhc3MgU3VwZXJDYWxsIGV4dGVuZHMgQ2FsbFxuICAgIFxuICAgIEA6IChhcmdzKSAtPlxuICAgICAgICBzdXBlciBudWxsLCBhcmdzID8gW25ldyBTcGxhdCBuZXcgSWRlbnRpZmllckxpdGVyYWwgJ2FyZ3VtZW50cyddXG4gICAgICAgICMgQWxsb3cgdG8gcmVjb2duaXplIGEgYmFyZSBgc3VwZXJgIGNhbGwgd2l0aG91dCBwYXJlbnRoZXNlcyBhbmQgYXJndW1lbnRzLlxuICAgICAgICBAaXNCYXJlID0gYXJncz9cblxuICAgICMgR3JhYiB0aGUgcmVmZXJlbmNlIHRvIHRoZSBzdXBlcmNsYXNzJ3MgaW1wbGVtZW50YXRpb24gb2YgdGhlIGN1cnJlbnQgbWV0aG9kLlxuICAgIFxuICAgIHN1cGVyUmVmZXJlbmNlOiAobykgLT5cbiAgICAgICAgXG4gICAgICAgIG1ldGhvZCA9IG8uc2NvcGUubmFtZWRNZXRob2QoKVxuICAgICAgICBpZiBtZXRob2Q/LmtsYXNzXG4gICAgICAgICAgICB7a2xhc3MsIG5hbWUsIHZhcmlhYmxlfSA9IG1ldGhvZFxuICAgICAgICAgICAgaWYga2xhc3MuaXNDb21wbGV4KClcbiAgICAgICAgICAgICAgICBicmVmID0gbmV3IElkZW50aWZpZXJMaXRlcmFsIG8uc2NvcGUucGFyZW50LmZyZWVWYXJpYWJsZSAnYmFzZSdcbiAgICAgICAgICAgICAgICBiYXNlID0gbmV3IFZhbHVlIG5ldyBQYXJlbnMgbmV3IEFzc2lnbiBicmVmLCBrbGFzc1xuICAgICAgICAgICAgICAgIHZhcmlhYmxlLmJhc2UgPSBiYXNlXG4gICAgICAgICAgICAgICAgdmFyaWFibGUucHJvcGVydGllcy5zcGxpY2UgMCwga2xhc3MucHJvcGVydGllcy5sZW5ndGhcbiAgICAgICAgICAgIGlmIG5hbWUuaXNDb21wbGV4KCkgb3IgKG5hbWUgaW5zdGFuY2VvZiBJbmRleCBhbmQgbmFtZS5pbmRleC5pc0Fzc2lnbmFibGUoKSlcbiAgICAgICAgICAgICAgICBucmVmID0gbmV3IElkZW50aWZpZXJMaXRlcmFsIG8uc2NvcGUucGFyZW50LmZyZWVWYXJpYWJsZSAnbmFtZSdcbiAgICAgICAgICAgICAgICBuYW1lID0gbmV3IEluZGV4IG5ldyBBc3NpZ24gbnJlZiwgbmFtZS5pbmRleFxuICAgICAgICAgICAgICAgIHZhcmlhYmxlLnByb3BlcnRpZXMucG9wKClcbiAgICAgICAgICAgICAgICB2YXJpYWJsZS5wcm9wZXJ0aWVzLnB1c2ggbmFtZVxuICAgICAgICAgICAgYWNjZXNzZXMgPSBbbmV3IEFjY2VzcyBuZXcgUHJvcGVydHlOYW1lICdfX3N1cGVyX18nXVxuICAgICAgICAgICAgYWNjZXNzZXMucHVzaCBuZXcgQWNjZXNzIG5ldyBQcm9wZXJ0eU5hbWUgJ2NvbnN0cnVjdG9yJyBpZiBtZXRob2Quc3RhdGljXG4gICAgICAgICAgICBhY2Nlc3Nlcy5wdXNoIGlmIG5yZWY/IHRoZW4gbmV3IEluZGV4IG5yZWYgZWxzZSBuYW1lXG4gICAgICAgICAgICAobmV3IFZhbHVlIGJyZWYgPyBrbGFzcywgYWNjZXNzZXMpLmNvbXBpbGUgb1xuICAgICAgICBlbHNlIGlmIG1ldGhvZD8uY3RvclxuICAgICAgICAgICAgIyBsb2cgXCJTdXBlckNhbGwuc3VwZXJSZWZlcmVuY2UgI3ttZXRob2QubmFtZX0gZGFkdW1tIVwiXG4gICAgICAgICAgICBcIiN7bWV0aG9kLm5hbWV9Ll9fc3VwZXJfXy5jb25zdHJ1Y3RvclwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBlcnJvciAnY2Fubm90IGNhbGwgc3VwZXIgb3V0c2lkZSBvZiBhbiBpbnN0YW5jZSBtZXRob2QuICcgKyBtZXRob2RcblxuICAgICMgVGhlIGFwcHJvcHJpYXRlIGB0aGlzYCB2YWx1ZSBmb3IgYSBgc3VwZXJgIGNhbGwuXG4gICAgICAgIFxuICAgIHN1cGVyVGhpczogKG8pIC0+XG4gICAgICAgIG1ldGhvZCA9IG8uc2NvcGUubWV0aG9kXG4gICAgICAgIChtZXRob2QgYW5kIG5vdCBtZXRob2Qua2xhc3MgYW5kIG1ldGhvZC5jb250ZXh0KSBvciBcInRoaXNcIlxuXG4gICAgY29tcGlsZVNwbGF0OiAobywgc3BsYXRBcmdzKSAtPlxuICAgICAgICAjIGxvZyAnY29tcGlsZVNwbGF0Jywgby5mZWF0dXJlXG4gICAgICAgIGlmIHNwbGF0QXJncy5sZW5ndGggPT0gMSBhbmQgc3BsYXRBcmdzWzBdLmNvZGUgPT0gJ2FyZ3VtZW50cycgYW5kIEBjb25maWdQYXJhbWV0ZXI/IGFuZCBoYXNGZWF0dXJlIG8sICdjb25maWdfcGFyYW1ldGVycydcbiAgICAgICAgICAgICMgVE9ETzogc2hvdWxkbid0IGFsbCByZWZlcmVuY2VzIHRvIGFyZ3VtZW50cyBiZSBjb252ZXJ0ZWQ/XG4gICAgICAgICAgICByZXR1cm4gW10uY29uY2F0IEBtYWtlQ29kZShcIiN7QGNvbmZpZ1BhcmFtZXRlckNvZGVCZWZvcmVTdXBlcigpfSN7IEBzdXBlclJlZmVyZW5jZSBvIH0uYXBwbHkoI3tAc3VwZXJUaGlzKG8pfSwgXCIpLCBzcGxhdEFyZ3MsIEBtYWtlQ29kZShcIilcIilcbiAgICAgICAgIFxuICAgICAgICBzdXBlclxuICAgICAgICBcbiAgICBjb25maWdQYXJhbWV0ZXJDb2RlQmVmb3JlU3VwZXI6IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gJycgaWYgbm90IHBhcmFtID0gQGNvbmZpZ1BhcmFtZXRlclxuXG4gICAgICAgIGEgPSBwYXJhbS5vYmplY3RzLm1hcCAob2JqKSAtPiBcbiAgICAgICAgICAgIG4gPSBvYmoudmFyaWFibGUuYmFzZS52YWx1ZVxuICAgICAgICAgICAgaWYgbiA9PSAndGhpcydcbiAgICAgICAgICAgICAgICBuID0gb2JqLnZhcmlhYmxlLnByb3BlcnRpZXM/WzBdLm5hbWUudmFsdWVcbiAgICAgICAgICAgICAgICBcIiN7bn06dGhpcy4je259XCJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB0ID0gb2JqLnZhbHVlLnZhcmlhYmxlPy50aGlzIGFuZCAndGhpcy4nIG9yICcnXG4gICAgICAgICAgICAgICAgXCIje259OiN7dCtufVwiXG4gICAgICAgICAgICBcbiAgICAgICAgXCJhcmd1bWVudHNbMF0gPSBfLmRlZmF1bHRzKHsje2Euam9pbiAnLCd9fSwgYXJndW1lbnRzWzBdKTsgXCJcblxuIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgIDAwMDAgIDAwMDAwMDAgICAgIDAwMDAwICAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuXG4jIFJlZ2V4ZXMgd2l0aCBpbnRlcnBvbGF0aW9ucyBhcmUgaW4gZmFjdCBqdXN0IGEgdmFyaWF0aW9uIG9mIGEgYENhbGxgIChhXG4jIGBSZWdFeHAoKWAgY2FsbCB0byBiZSBwcmVjaXNlKSB3aXRoIGEgYFN0cmluZ1dpdGhJbnRlcnBvbGF0aW9uc2AgaW5zaWRlLlxuXG5leHBvcnRzLlJlZ2V4V2l0aEludGVycG9sYXRpb25zID0gY2xhc3MgUmVnZXhXaXRoSW50ZXJwb2xhdGlvbnMgZXh0ZW5kcyBDYWxsXG4gICAgXG4gICAgQDogKGFyZ3MgPSBbXSkgLT5cbiAgICAgICAgc3VwZXIgKG5ldyBWYWx1ZSBuZXcgSWRlbnRpZmllckxpdGVyYWwgJ1JlZ0V4cCcpLCBhcmdzLCBmYWxzZVxuXG4jIFRhZ2dlZFRlbXBsYXRlQ2FsbFxuXG5leHBvcnRzLlRhZ2dlZFRlbXBsYXRlQ2FsbCA9IGNsYXNzIFRhZ2dlZFRlbXBsYXRlQ2FsbCBleHRlbmRzIENhbGxcbiAgICBcbiAgICBAOiAodmFyaWFibGUsIGFyZywgc29haykgLT5cbiAgICAgICAgYXJnID0gbmV3IFN0cmluZ1dpdGhJbnRlcnBvbGF0aW9ucyBCbG9jay53cmFwKFsgbmV3IFZhbHVlIGFyZyBdKSBpZiBhcmcgaW5zdGFuY2VvZiBTdHJpbmdMaXRlcmFsXG4gICAgICAgIHN1cGVyIHZhcmlhYmxlLCBbIGFyZyBdLCBzb2FrXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgICMgVGVsbCBgU3RyaW5nV2l0aEludGVycG9sYXRpb25zYCB3aGV0aGVyIHRvIGNvbXBpbGUgYXMgRVMyMDE1IG9yIG5vdDsgd2lsbCBiZSByZW1vdmVkIGluIEtvZmZlZSAyLlxuICAgICAgICBvLmluVGFnZ2VkVGVtcGxhdGVDYWxsID0geWVzXG4gICAgICAgIEB2YXJpYWJsZS5jb21waWxlVG9GcmFnbWVudHMobywgTEVWRUxfQUNDRVNTKS5jb25jYXQgQGFyZ3NbMF0uY29tcGlsZVRvRnJhZ21lbnRzKG8sIExFVkVMX0xJU1QpXG5cbiMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICBcbiMgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiMgMDAwMDAwMCAgICAgMDAwMDAgICAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDAgICAgICAgMDAwICBcbiMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICBcblxuIyBOb2RlIHRvIGV4dGVuZCBhbiBvYmplY3QncyBwcm90b3R5cGUgd2l0aCBhbiBhbmNlc3RvciBvYmplY3QuXG4jIEFmdGVyIGBnb29nLmluaGVyaXRzYCBmcm9tIHRoZVxuIyBbQ2xvc3VyZSBMaWJyYXJ5XShodHRwczovL2dpdGh1Yi5jb20vZ29vZ2xlL2Nsb3N1cmUtbGlicmFyeS9ibG9iL21hc3Rlci9jbG9zdXJlL2dvb2cvYmFzZS5qcykuXG5cbmV4cG9ydHMuRXh0ZW5kcyA9IGNsYXNzIEV4dGVuZHMgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgQDogKEBjaGlsZCwgQHBhcmVudCkgLT5cblxuICAgIGNoaWxkcmVuOiBbJ2NoaWxkJywgJ3BhcmVudCddXG5cbiAgICAjIEhvb2tzIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIncyBwcm90b3R5cGUgY2hhaW4uXG4gICAgY29tcGlsZVRvRnJhZ21lbnRzOiAobykgLT5cbiAgICAgICAgbmV3IENhbGwobmV3IFZhbHVlKG5ldyBMaXRlcmFsIHV0aWxpdHkgJ2V4dGVuZCcsIG8pLCBbQGNoaWxkLCBAcGFyZW50XSkuY29tcGlsZVRvRnJhZ21lbnRzIG9cblxuIyAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgICAgMDAwICAgICAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcblxuIyBBIGAuYCBhY2Nlc3MgaW50byBhIHByb3BlcnR5IG9mIGEgdmFsdWUsIG9yIHRoZSBgOjpgIHNob3J0aGFuZCBmb3JcbiMgYW4gYWNjZXNzIGludG8gdGhlIG9iamVjdCdzIHByb3RvdHlwZS5cblxuZXhwb3J0cy5BY2Nlc3MgPSBjbGFzcyBBY2Nlc3MgZXh0ZW5kcyBCYXNlXG4gICAgQDogKEBuYW1lLCB0YWcpIC0+XG4gICAgICAgIEBzb2FrID0gdGFnIGlzICdzb2FrJ1xuXG4gICAgY2hpbGRyZW46IFsnbmFtZSddXG5cbiAgICBjb21waWxlVG9GcmFnbWVudHM6IChvKSAtPlxuICAgICAgICBuYW1lID0gQG5hbWUuY29tcGlsZVRvRnJhZ21lbnRzIG9cbiAgICAgICAgbm9kZSA9IEBuYW1lLnVud3JhcCgpXG4gICAgICAgIGlmIG5vZGUgaW5zdGFuY2VvZiBQcm9wZXJ0eU5hbWVcbiAgICAgICAgICAgIGlmIG5vZGUudmFsdWUgaW4gSlNfRk9SQklEREVOXG4gICAgICAgICAgICAgICAgW0BtYWtlQ29kZSgnW1wiJyksIG5hbWUuLi4sIEBtYWtlQ29kZSgnXCJdJyldXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgW0BtYWtlQ29kZSgnLicpLCBuYW1lLi4uXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBbQG1ha2VDb2RlKCdbJyksIG5hbWUuLi4sIEBtYWtlQ29kZSgnXScpXVxuXG4gICAgaXNDb21wbGV4OiBOT1xuXG4jIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICBcbiMgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAgICAgXG4jIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcblxuIyBBIGBbIC4uLiBdYCBpbmRleGVkIGFjY2VzcyBpbnRvIGFuIGFycmF5IG9yIG9iamVjdC5cblxuZXhwb3J0cy5JbmRleCA9IGNsYXNzIEluZGV4IGV4dGVuZHMgQmFzZVxuICAgIEA6IChAaW5kZXgpIC0+XG5cbiAgICBjaGlsZHJlbjogWydpbmRleCddXG5cbiAgICBjb21waWxlVG9GcmFnbWVudHM6IChvKSAtPlxuICAgICAgICBbXS5jb25jYXQgQG1ha2VDb2RlKFwiW1wiKSwgQGluZGV4LmNvbXBpbGVUb0ZyYWdtZW50cyhvLCBMRVZFTF9QQVJFTiksIEBtYWtlQ29kZShcIl1cIilcblxuICAgIGlzQ29tcGxleDogLT5cbiAgICAgICAgQGluZGV4LmlzQ29tcGxleCgpXG5cbiMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIFxuIyAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuXG4jIFJhbmdlcyBjYW4gYmUgdXNlZCB0byBleHRyYWN0IHBvcnRpb25zIChzbGljZXMpIG9mIGFycmF5cyxcbiMgdG8gc3BlY2lmeSBhIHJhbmdlIGZvciBjb21wcmVoZW5zaW9ucywgb3IgYXMgYSB2YWx1ZSwgdG8gYmUgZXhwYW5kZWQgaW50byB0aGVcbiMgY29ycmVzcG9uZGluZyBhcnJheSBvZiBpbnRlZ2VycyBhdCBydW50aW1lLlxuXG5leHBvcnRzLlJhbmdlID0gY2xhc3MgUmFuZ2UgZXh0ZW5kcyBCYXNlXG5cbiAgICBjaGlsZHJlbjogWydmcm9tJywgJ3RvJ11cblxuICAgIEA6IChAZnJvbSwgQHRvLCB0YWcpIC0+XG4gICAgICAgIEBleGNsdXNpdmUgPSB0YWcgaXMgJ2V4Y2x1c2l2ZSdcbiAgICAgICAgQGVxdWFscyA9IGlmIEBleGNsdXNpdmUgdGhlbiAnJyBlbHNlICc9J1xuXG4gICAgIyBDb21waWxlcyB0aGUgcmFuZ2UncyBzb3VyY2UgdmFyaWFibGVzIC0tIHdoZXJlIGl0IHN0YXJ0cyBhbmQgd2hlcmUgaXQgZW5kcy5cbiAgICAjIEJ1dCBvbmx5IGlmIHRoZXkgbmVlZCB0byBiZSBjYWNoZWQgdG8gYXZvaWQgZG91YmxlIGV2YWx1YXRpb24uXG4gICAgXG4gICAgY29tcGlsZVZhcmlhYmxlczogKG8pIC0+XG4gICAgICAgIG8gPSBtZXJnZSBvLCB0b3A6IHRydWVcbiAgICAgICAgaXNDb21wbGV4ID0gZGVsIG8sICdpc0NvbXBsZXgnXG4gICAgICAgIFtAZnJvbUMsIEBmcm9tVmFyXSA9IEBjYWNoZVRvQ29kZUZyYWdtZW50cyBAZnJvbS5jYWNoZSBvLCBMRVZFTF9MSVNULCBpc0NvbXBsZXhcbiAgICAgICAgW0B0b0MsIEB0b1Zhcl0gICAgID0gQGNhY2hlVG9Db2RlRnJhZ21lbnRzIEB0by5jYWNoZSBvLCBMRVZFTF9MSVNULCBpc0NvbXBsZXhcbiAgICAgICAgW0BzdGVwLCBAc3RlcFZhcl0gID0gQGNhY2hlVG9Db2RlRnJhZ21lbnRzIHN0ZXAuY2FjaGUgbywgTEVWRUxfTElTVCwgaXNDb21wbGV4IGlmIHN0ZXAgPSBkZWwgbywgJ3N0ZXAnXG4gICAgICAgIEBmcm9tTnVtID0gaWYgQGZyb20uaXNOdW1iZXIoKSB0aGVuIE51bWJlciBAZnJvbVZhciBlbHNlIG51bGxcbiAgICAgICAgQHRvTnVtICAgPSBpZiBAdG8uaXNOdW1iZXIoKSAgIHRoZW4gTnVtYmVyIEB0b1ZhciAgIGVsc2UgbnVsbFxuICAgICAgICBAc3RlcE51bSA9IGlmIHN0ZXA/LmlzTnVtYmVyKCkgdGhlbiBOdW1iZXIgQHN0ZXBWYXIgZWxzZSBudWxsXG5cbiAgICAjIFdoZW4gY29tcGlsZWQgbm9ybWFsbHksIHRoZSByYW5nZSByZXR1cm5zIHRoZSBjb250ZW50cyBvZiB0aGUgKmZvciBsb29wKlxuICAgICMgbmVlZGVkIHRvIGl0ZXJhdGUgb3ZlciB0aGUgdmFsdWVzIGluIHRoZSByYW5nZS4gVXNlZCBieSBjb21wcmVoZW5zaW9ucy5cbiAgICBcbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIEBjb21waWxlVmFyaWFibGVzIG8gdW5sZXNzIEBmcm9tVmFyXG4gICAgICAgIHJldHVybiBAY29tcGlsZUFycmF5KG8pIHVubGVzcyBvLmluZGV4XG5cbiAgICAgICAgIyBTZXQgdXAgZW5kcG9pbnRzLlxuICAgICAgICBrbm93biAgICA9IEBmcm9tTnVtPyBhbmQgQHRvTnVtP1xuICAgICAgICBpZHggICAgICA9IGRlbCBvLCAnaW5kZXgnXG4gICAgICAgIGlkeE5hbWUgID0gZGVsIG8sICduYW1lJ1xuICAgICAgICBuYW1lZEluZGV4ID0gaWR4TmFtZSBhbmQgaWR4TmFtZSAhPSBpZHhcbiAgICAgICAgdmFyUGFydCAgPSBcIiN7aWR4fSA9ICN7QGZyb21DfVwiXG4gICAgICAgIHZhclBhcnQgKz0gXCIsICN7QHRvQ31cIiBpZiBAdG9DICE9IEB0b1ZhclxuICAgICAgICB2YXJQYXJ0ICs9IFwiLCAje0BzdGVwfVwiIGlmIEBzdGVwICE9IEBzdGVwVmFyXG4gICAgICAgIFtsdCwgZ3RdID0gW1wiI3tpZHh9IDwje0BlcXVhbHN9XCIsIFwiI3tpZHh9ID4je0BlcXVhbHN9XCJdXG5cbiAgICAgICAgIyBHZW5lcmF0ZSB0aGUgY29uZGl0aW9uLlxuICAgICAgICBjb25kUGFydCA9IGlmIEBzdGVwTnVtP1xuICAgICAgICAgICAgaWYgQHN0ZXBOdW0gPiAwIHRoZW4gXCIje2x0fSAje0B0b1Zhcn1cIiBlbHNlIFwiI3tndH0gI3tAdG9WYXJ9XCJcbiAgICAgICAgZWxzZSBpZiBrbm93blxuICAgICAgICAgICAgW2Zyb20sIHRvXSA9IFtAZnJvbU51bSwgQHRvTnVtXVxuICAgICAgICAgICAgaWYgZnJvbSA8PSB0byB0aGVuIFwiI3tsdH0gI3t0b31cIiBlbHNlIFwiI3tndH0gI3t0b31cIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBjb25kID0gaWYgQHN0ZXBWYXIgdGhlbiBcIiN7QHN0ZXBWYXJ9ID4gMFwiIGVsc2UgXCIje0Bmcm9tVmFyfSA8PSAje0B0b1Zhcn1cIlxuICAgICAgICAgICAgXCIje2NvbmR9ID8gI3tsdH0gI3tAdG9WYXJ9IDogI3tndH0gI3tAdG9WYXJ9XCJcblxuICAgICAgICAjIEdlbmVyYXRlIHRoZSBzdGVwLlxuICAgICAgICBzdGVwUGFydCA9IGlmIEBzdGVwVmFyXG4gICAgICAgICAgICBcIiN7aWR4fSArPSAje0BzdGVwVmFyfVwiXG4gICAgICAgIGVsc2UgaWYga25vd25cbiAgICAgICAgICAgIGlmIG5hbWVkSW5kZXhcbiAgICAgICAgICAgICAgICBpZiBmcm9tIDw9IHRvIHRoZW4gXCIrKyN7aWR4fVwiIGVsc2UgXCItLSN7aWR4fVwiXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaWYgZnJvbSA8PSB0byB0aGVuIFwiI3tpZHh9KytcIiBlbHNlIFwiI3tpZHh9LS1cIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBuYW1lZEluZGV4XG4gICAgICAgICAgICAgICAgXCIje2NvbmR9ID8gKysje2lkeH0gOiAtLSN7aWR4fVwiXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgXCIje2NvbmR9ID8gI3tpZHh9KysgOiAje2lkeH0tLVwiXG5cbiAgICAgICAgdmFyUGFydCAgPSBcIiN7aWR4TmFtZX0gPSAje3ZhclBhcnR9XCIgaWYgbmFtZWRJbmRleFxuICAgICAgICBzdGVwUGFydCA9IFwiI3tpZHhOYW1lfSA9ICN7c3RlcFBhcnR9XCIgaWYgbmFtZWRJbmRleFxuXG4gICAgICAgICMgVGhlIGZpbmFsIGxvb3AgYm9keS5cbiAgICAgICAgW0BtYWtlQ29kZSBcIiN7dmFyUGFydH07ICN7Y29uZFBhcnR9OyAje3N0ZXBQYXJ0fVwiXVxuXG5cbiAgICAjIFdoZW4gdXNlZCBhcyBhIHZhbHVlLCBleHBhbmQgdGhlIHJhbmdlIGludG8gdGhlIGVxdWl2YWxlbnQgYXJyYXkuXG4gICAgY29tcGlsZUFycmF5OiAobykgLT5cbiAgICAgICAga25vd24gPSBAZnJvbU51bT8gYW5kIEB0b051bT9cbiAgICAgICAgaWYga25vd24gYW5kIE1hdGguYWJzKEBmcm9tTnVtIC0gQHRvTnVtKSA8PSAyMFxuICAgICAgICAgICAgcmFuZ2UgPSBbQGZyb21OdW0uLkB0b051bV1cbiAgICAgICAgICAgIHJhbmdlLnBvcCgpIGlmIEBleGNsdXNpdmVcbiAgICAgICAgICAgIHJldHVybiBbQG1ha2VDb2RlIFwiWyN7IHJhbmdlLmpvaW4oJywgJykgfV1cIl1cbiAgICAgICAgaWR0ICAgID0gQHRhYiArIFRBQlxuICAgICAgICBpICAgICAgPSBvLnNjb3BlLmZyZWVWYXJpYWJsZSAnaScsIHNpbmdsZTogdHJ1ZVxuICAgICAgICByZXN1bHQgPSBvLnNjb3BlLmZyZWVWYXJpYWJsZSAncmVzdWx0cydcbiAgICAgICAgcHJlICAgID0gXCJcXG4je2lkdH0je3Jlc3VsdH0gPSBbXTtcIlxuICAgICAgICBpZiBrbm93blxuICAgICAgICAgICAgby5pbmRleCA9IGlcbiAgICAgICAgICAgIGJvZHkgPSBAZnJhZ21lbnRzVG9UZXh0IEBjb21waWxlTm9kZSBvXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHZhcnMgPSBcIiN7aX0gPSAje0Bmcm9tQ31cIiArIGlmIEB0b0MgIT0gQHRvVmFyIHRoZW4gXCIsICN7QHRvQ31cIiBlbHNlICcnXG4gICAgICAgICAgICBjb25kID0gXCIje0Bmcm9tVmFyfSA8PSAje0B0b1Zhcn1cIlxuICAgICAgICAgICAgYm9keSA9IFwidmFyICN7dmFyc307ICN7Y29uZH0gPyAje2l9IDwje0BlcXVhbHN9ICN7QHRvVmFyfSA6ICN7aX0gPiN7QGVxdWFsc30gI3tAdG9WYXJ9OyAje2NvbmR9ID8gI3tpfSsrIDogI3tpfS0tXCJcbiAgICAgICAgcG9zdCAgICAgPSBcInsgI3tyZXN1bHR9LnB1c2goI3tpfSk7IH1cXG4je2lkdH1yZXR1cm4gI3tyZXN1bHR9O1xcbiN7by5pbmRlbnR9XCJcbiAgICAgICAgaGFzQXJncyA9IChub2RlKSAtPiBub2RlPy5jb250YWlucyBpc0xpdGVyYWxBcmd1bWVudHNcbiAgICAgICAgYXJncyAgICA9ICcsIGFyZ3VtZW50cycgaWYgaGFzQXJncyhAZnJvbSkgb3IgaGFzQXJncyhAdG8pXG4gICAgICAgIFtAbWFrZUNvZGUgXCIoZnVuY3Rpb24oKSB7I3twcmV9XFxuI3tpZHR9Zm9yICgje2JvZHl9KSN7cG9zdH19KS5hcHBseSh0aGlzI3thcmdzID8gJyd9KVwiXVxuXG4jICAwMDAwMDAwICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgXG4jICAgICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG5cbiMgQW4gYXJyYXkgc2xpY2UgbGl0ZXJhbC4gVW5saWtlIEphdmFTY3JpcHQncyBgQXJyYXkjc2xpY2VgLCB0aGUgc2Vjb25kIHBhcmFtZXRlclxuIyBzcGVjaWZpZXMgdGhlIGluZGV4IG9mIHRoZSBlbmQgb2YgdGhlIHNsaWNlLCBqdXN0IGFzIHRoZSBmaXJzdCBwYXJhbWV0ZXJcbiMgaXMgdGhlIGluZGV4IG9mIHRoZSBiZWdpbm5pbmcuXG5cbmV4cG9ydHMuU2xpY2UgPSBjbGFzcyBTbGljZSBleHRlbmRzIEJhc2VcblxuICAgIGNoaWxkcmVuOiBbJ3JhbmdlJ11cblxuICAgIEA6IChAcmFuZ2UpIC0+IHN1cGVyKClcblxuICAgICMgV2UgaGF2ZSB0byBiZSBjYXJlZnVsIHdoZW4gdHJ5aW5nIHRvIHNsaWNlIHRocm91Z2ggdGhlIGVuZCBvZiB0aGUgYXJyYXksXG4gICAgIyBgOWU5YCBpcyB1c2VkIGJlY2F1c2Ugbm90IGFsbCBpbXBsZW1lbnRhdGlvbnMgcmVzcGVjdCBgdW5kZWZpbmVkYCBvciBgMS8wYC5cbiAgICAjIGA5ZTlgIHNob3VsZCBiZSBzYWZlIGJlY2F1c2UgYDllOWAgPiBgMioqMzJgLCB0aGUgbWF4IGFycmF5IGxlbmd0aC5cbiAgICBcbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIFxuICAgICAgICB7dG8sIGZyb219ID0gQHJhbmdlXG4gICAgICAgIGZyb21Db21waWxlZCA9IGZyb20gYW5kIGZyb20uY29tcGlsZVRvRnJhZ21lbnRzKG8sIExFVkVMX1BBUkVOKSBvciBbQG1ha2VDb2RlICcwJ11cbiAgICAgICAgIyBUT0RPOiBqd2FsdG9uIC0gbW92ZSB0aGlzIGludG8gdGhlICdpZic/XG4gICAgICAgIGlmIHRvXG4gICAgICAgICAgICBjb21waWxlZCAgICAgICAgID0gdG8uY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX1BBUkVOXG4gICAgICAgICAgICBjb21waWxlZFRleHQgPSBAZnJhZ21lbnRzVG9UZXh0IGNvbXBpbGVkXG4gICAgICAgICAgICBpZiBub3QgKG5vdCBAcmFuZ2UuZXhjbHVzaXZlIGFuZCArY29tcGlsZWRUZXh0IGlzIC0xKVxuICAgICAgICAgICAgICAgIHRvU3RyID0gJywgJyArIGlmIEByYW5nZS5leGNsdXNpdmVcbiAgICAgICAgICAgICAgICAgICAgY29tcGlsZWRUZXh0XG4gICAgICAgICAgICAgICAgZWxzZSBpZiB0by5pc051bWJlcigpXG4gICAgICAgICAgICAgICAgICAgIFwiI3srY29tcGlsZWRUZXh0ICsgMX1cIlxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgY29tcGlsZWQgPSB0by5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfQUNDRVNTXG4gICAgICAgICAgICAgICAgICAgIFwiKyN7QGZyYWdtZW50c1RvVGV4dCBjb21waWxlZH0gKyAxIHx8IDllOVwiXG4gICAgICAgIFtAbWFrZUNvZGUgXCIuc2xpY2UoI3sgQGZyYWdtZW50c1RvVGV4dCBmcm9tQ29tcGlsZWQgfSN7IHRvU3RyIG9yICcnIH0pXCJdXG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgICAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4jIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgICAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgXG5cbmV4cG9ydHMuT2JqID0gY2xhc3MgT2JqIGV4dGVuZHMgQmFzZVxuICAgIFxuICAgIEA6IChwcm9wcywgQGdlbmVyYXRlZCA9IGZhbHNlKSAtPlxuICAgICAgICBAb2JqZWN0cyA9IEBwcm9wZXJ0aWVzID0gcHJvcHMgb3IgW11cblxuICAgIGNoaWxkcmVuOiBbJ3Byb3BlcnRpZXMnXVxuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBwcm9wcyA9IEBwcm9wZXJ0aWVzXG4gICAgICAgIGlmIEBnZW5lcmF0ZWRcbiAgICAgICAgICAgIGZvciBub2RlIGluIHByb3BzIHdoZW4gbm9kZSBpbnN0YW5jZW9mIFZhbHVlXG4gICAgICAgICAgICAgICAgbm9kZS5lcnJvciAnY2Fubm90IGhhdmUgYW4gaW1wbGljaXQgdmFsdWUgaW4gYW4gaW1wbGljaXQgb2JqZWN0J1xuICAgICAgICBicmVhayBmb3IgcHJvcCwgZHluYW1pY0luZGV4IGluIHByb3BzIHdoZW4gKHByb3AudmFyaWFibGUgb3IgcHJvcCkuYmFzZSBpbnN0YW5jZW9mIFBhcmVuc1xuICAgICAgICBoYXNEeW5hbWljICA9IGR5bmFtaWNJbmRleCA8IHByb3BzLmxlbmd0aFxuICAgICAgICBpZHQgICAgICAgICA9IG8uaW5kZW50ICs9IFRBQlxuICAgICAgICBsYXN0Tm9uY29tICA9IEBsYXN0Tm9uQ29tbWVudCBAcHJvcGVydGllc1xuICAgICAgICBhbnN3ZXIgPSBbXVxuICAgICAgICBpZiBoYXNEeW5hbWljXG4gICAgICAgICAgICBvcmVmID0gby5zY29wZS5mcmVlVmFyaWFibGUgJ29iaidcbiAgICAgICAgICAgIGFuc3dlci5wdXNoIEBtYWtlQ29kZSBcIihcXG4je2lkdH0je29yZWZ9ID0gXCJcbiAgICAgICAgYW5zd2VyLnB1c2ggQG1ha2VDb2RlIFwieyN7aWYgcHJvcHMubGVuZ3RoIGlzIDAgb3IgZHluYW1pY0luZGV4IGlzIDAgdGhlbiAnfScgZWxzZSAnXFxuJ31cIlxuICAgICAgICBmb3IgcHJvcCwgaSBpbiBwcm9wc1xuICAgICAgICAgICAgaWYgaSBpcyBkeW5hbWljSW5kZXhcbiAgICAgICAgICAgICAgICBhbnN3ZXIucHVzaCBAbWFrZUNvZGUgXCJcXG4je2lkdH19XCIgdW5sZXNzIGkgaXMgMFxuICAgICAgICAgICAgICAgIGFuc3dlci5wdXNoIEBtYWtlQ29kZSAnLFxcbidcbiAgICAgICAgICAgIGpvaW4gPSBpZiBpIGlzIHByb3BzLmxlbmd0aCAtIDEgb3IgaSBpcyBkeW5hbWljSW5kZXggLSAxXG4gICAgICAgICAgICAgICAgJydcbiAgICAgICAgICAgIGVsc2UgaWYgcHJvcCBpcyBsYXN0Tm9uY29tIG9yIHByb3AgaW5zdGFuY2VvZiBDb21tZW50XG4gICAgICAgICAgICAgICAgJ1xcbidcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAnLFxcbidcbiAgICAgICAgICAgIGluZGVudCA9IGlmIHByb3AgaW5zdGFuY2VvZiBDb21tZW50IHRoZW4gJycgZWxzZSBpZHRcbiAgICAgICAgICAgIGluZGVudCArPSBUQUIgaWYgaGFzRHluYW1pYyBhbmQgaSA8IGR5bmFtaWNJbmRleFxuICAgICAgICAgICAgaWYgcHJvcCBpbnN0YW5jZW9mIEFzc2lnblxuICAgICAgICAgICAgICAgIGlmIHByb3AuY29udGV4dCAhPSAnb2JqZWN0J1xuICAgICAgICAgICAgICAgICAgICBwcm9wLm9wZXJhdG9yVG9rZW4uZXJyb3IgXCJ1bmV4cGVjdGVkICN7cHJvcC5vcGVyYXRvclRva2VuLnZhbHVlfVwiXG4gICAgICAgICAgICAgICAgaWYgcHJvcC52YXJpYWJsZSBpbnN0YW5jZW9mIFZhbHVlIGFuZCBwcm9wLnZhcmlhYmxlLmhhc1Byb3BlcnRpZXMoKVxuICAgICAgICAgICAgICAgICAgICBwcm9wLnZhcmlhYmxlLmVycm9yICdpbnZhbGlkIG9iamVjdCBrZXknXG4gICAgICAgICAgICBpZiBwcm9wIGluc3RhbmNlb2YgVmFsdWUgYW5kIHByb3AudGhpc1xuICAgICAgICAgICAgICAgIHByb3AgPSBuZXcgQXNzaWduIHByb3AucHJvcGVydGllc1swXS5uYW1lLCBwcm9wLCAnb2JqZWN0J1xuICAgICAgICAgICAgaWYgcHJvcCBub3QgaW5zdGFuY2VvZiBDb21tZW50XG4gICAgICAgICAgICAgICAgaWYgaSA8IGR5bmFtaWNJbmRleFxuICAgICAgICAgICAgICAgICAgICBpZiBwcm9wIG5vdCBpbnN0YW5jZW9mIEFzc2lnblxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcCA9IG5ldyBBc3NpZ24gcHJvcCwgcHJvcCwgJ29iamVjdCdcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGlmIHByb3AgaW5zdGFuY2VvZiBBc3NpZ25cbiAgICAgICAgICAgICAgICAgICAgICAgIGtleSA9IHByb3AudmFyaWFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gcHJvcC52YWx1ZVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBba2V5LCB2YWx1ZV0gPSBwcm9wLmJhc2UuY2FjaGUgb1xuICAgICAgICAgICAgICAgICAgICAgICAga2V5ID0gbmV3IFByb3BlcnR5TmFtZSBrZXkudmFsdWUgaWYga2V5IGluc3RhbmNlb2YgSWRlbnRpZmllckxpdGVyYWxcbiAgICAgICAgICAgICAgICAgICAgcHJvcCA9IG5ldyBBc3NpZ24gKG5ldyBWYWx1ZSAobmV3IElkZW50aWZpZXJMaXRlcmFsIG9yZWYpLCBbbmV3IEFjY2VzcyBrZXldKSwgdmFsdWVcbiAgICAgICAgICAgIGlmIGluZGVudCB0aGVuIGFuc3dlci5wdXNoIEBtYWtlQ29kZSBpbmRlbnRcbiAgICAgICAgICAgIGFuc3dlci5wdXNoIHByb3AuY29tcGlsZVRvRnJhZ21lbnRzKG8sIExFVkVMX1RPUCkuLi5cbiAgICAgICAgICAgIGlmIGpvaW4gdGhlbiBhbnN3ZXIucHVzaCBAbWFrZUNvZGUgam9pblxuICAgICAgICBpZiBoYXNEeW5hbWljXG4gICAgICAgICAgICBhbnN3ZXIucHVzaCBAbWFrZUNvZGUgXCIsXFxuI3tpZHR9I3tvcmVmfVxcbiN7QHRhYn0pXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgYW5zd2VyLnB1c2ggQG1ha2VDb2RlIFwiXFxuI3tAdGFifX1cIiB1bmxlc3MgcHJvcHMubGVuZ3RoIGlzIDBcbiAgICAgICAgaWYgQGZyb250IGFuZCBub3QgaGFzRHluYW1pYyB0aGVuIEB3cmFwSW5CcmFjZXMgYW5zd2VyIGVsc2UgYW5zd2VyXG5cbiAgICBhc3NpZ25zOiAobmFtZSkgLT5cbiAgICAgICAgZm9yIHByb3AgaW4gQHByb3BlcnRpZXMgd2hlbiBwcm9wLmFzc2lnbnMgbmFtZSB0aGVuIHJldHVybiB5ZXNcbiAgICAgICAgbm9cblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICBcbiMgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAgIDAwMDAwICAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcblxuZXhwb3J0cy5BcnIgPSBjbGFzcyBBcnIgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgQDogKG9ianMpIC0+XG4gICAgICAgIEBvYmplY3RzID0gb2JqcyBvciBbXVxuXG4gICAgY2hpbGRyZW46IFsnb2JqZWN0cyddXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIHJldHVybiBbQG1ha2VDb2RlICdbXSddIHVubGVzcyBAb2JqZWN0cy5sZW5ndGhcbiAgICAgICAgby5pbmRlbnQgKz0gVEFCXG4gICAgICAgIGFuc3dlciA9IFNwbGF0LmNvbXBpbGVTcGxhdHRlZEFycmF5IG8sIEBvYmplY3RzXG4gICAgICAgIHJldHVybiBhbnN3ZXIgaWYgYW5zd2VyLmxlbmd0aFxuXG4gICAgICAgIGFuc3dlciA9IFtdXG4gICAgICAgIGNvbXBpbGVkT2JqcyA9IChvYmouY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX0xJU1QgZm9yIG9iaiBpbiBAb2JqZWN0cylcbiAgICAgICAgZm9yIGZyYWdtZW50cywgaW5kZXggaW4gY29tcGlsZWRPYmpzXG4gICAgICAgICAgICBpZiBpbmRleFxuICAgICAgICAgICAgICAgIGFuc3dlci5wdXNoIEBtYWtlQ29kZSBcIiwgXCJcbiAgICAgICAgICAgIGFuc3dlci5wdXNoIGZyYWdtZW50cy4uLlxuICAgICAgICBpZiBAZnJhZ21lbnRzVG9UZXh0KGFuc3dlcikuaW5kZXhPZignXFxuJykgPj0gMFxuICAgICAgICAgICAgYW5zd2VyLnVuc2hpZnQgQG1ha2VDb2RlIFwiW1xcbiN7by5pbmRlbnR9XCJcbiAgICAgICAgICAgIGFuc3dlci5wdXNoIEBtYWtlQ29kZSBcIlxcbiN7QHRhYn1dXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgYW5zd2VyLnVuc2hpZnQgQG1ha2VDb2RlIFwiW1wiXG4gICAgICAgICAgICBhbnN3ZXIucHVzaCBAbWFrZUNvZGUgXCJdXCJcbiAgICAgICAgYW5zd2VyXG5cbiAgICBhc3NpZ25zOiAobmFtZSkgLT5cbiAgICAgICAgZm9yIG9iaiBpbiBAb2JqZWN0cyB3aGVuIG9iai5hc3NpZ25zIG5hbWUgdGhlbiByZXR1cm4geWVzXG4gICAgICAgIG5vXG5cbiMgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICBcbiMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcblxuIyBUaGUgY2xhc3MgZGVmaW5pdGlvbi4gSW5pdGlhbGl6ZSBhIENsYXNzIHdpdGggaXRzIG5hbWUsIGFuIG9wdGlvbmFsIHN1cGVyY2xhc3MsIGFuZCBhIGxpc3Qgb2YgcHJvdG90eXBlIHByb3BlcnR5IGFzc2lnbm1lbnRzLlxuXG5leHBvcnRzLkNsYXNzID0gY2xhc3MgQ2xhc3MgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgQDogKEB2YXJpYWJsZSwgQHBhcmVudCwgQGJvZHkgPSBuZXcgQmxvY2spIC0+XG4gICAgICAgIEBib3VuZEZ1bmNzID0gW11cbiAgICAgICAgQGJvZHkuY2xhc3NCb2R5ID0geWVzXG5cbiAgICBjaGlsZHJlbjogWyd2YXJpYWJsZScsICdwYXJlbnQnLCAnYm9keSddXG5cbiAgICBkZWZhdWx0Q2xhc3NWYXJpYWJsZU5hbWU6ICdfQ2xhc3MnXG5cbiAgICAjIEZpZ3VyZSBvdXQgdGhlIGFwcHJvcHJpYXRlIG5hbWUgZm9yIHRoZSBjb25zdHJ1Y3RvciBmdW5jdGlvbiBvZiB0aGlzIGNsYXNzLlxuICAgICAgICBcbiAgICBkZXRlcm1pbmVOYW1lOiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIEBkZWZhdWx0Q2xhc3NWYXJpYWJsZU5hbWUgdW5sZXNzIEB2YXJpYWJsZVxuICAgICAgICBbLi4uLCB0YWlsXSA9IEB2YXJpYWJsZS5wcm9wZXJ0aWVzXG4gICAgICAgIG5vZGUgPSBpZiB0YWlsXG4gICAgICAgICAgICB0YWlsIGluc3RhbmNlb2YgQWNjZXNzIGFuZCB0YWlsLm5hbWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHZhcmlhYmxlLmJhc2VcbiAgICAgICAgdW5sZXNzIG5vZGUgaW5zdGFuY2VvZiBJZGVudGlmaWVyTGl0ZXJhbCBvciBub2RlIGluc3RhbmNlb2YgUHJvcGVydHlOYW1lXG4gICAgICAgICAgICByZXR1cm4gQGRlZmF1bHRDbGFzc1ZhcmlhYmxlTmFtZVxuICAgICAgICBuYW1lID0gbm9kZS52YWx1ZVxuICAgICAgICB1bmxlc3MgdGFpbFxuICAgICAgICAgICAgbWVzc2FnZSA9IGlzVW5hc3NpZ25hYmxlIG5hbWVcbiAgICAgICAgICAgIEB2YXJpYWJsZS5lcnJvciBtZXNzYWdlIGlmIG1lc3NhZ2VcbiAgICAgICAgaWYgbmFtZSBpbiBKU19GT1JCSURERU4gdGhlbiBcIl8je25hbWV9XCIgZWxzZSBuYW1lXG5cbiAgICAjIEZvciBhbGwgYHRoaXNgLXJlZmVyZW5jZXMgYW5kIGJvdW5kIGZ1bmN0aW9ucyBpbiB0aGUgY2xhc3MgZGVmaW5pdGlvbiwgYHRoaXNgIGlzIHRoZSBDbGFzcyBiZWluZyBjb25zdHJ1Y3RlZC5cbiAgICAgICAgXG4gICAgc2V0Q29udGV4dDogKG5hbWUpIC0+XG4gICAgICAgIFxuICAgICAgICBAYm9keS50cmF2ZXJzZUNoaWxkcmVuIGZhbHNlLCAobm9kZSkgLT5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZSBpZiBub2RlLmNsYXNzQm9keVxuICAgICAgICAgICAgaWYgbm9kZSBpbnN0YW5jZW9mIFRoaXNMaXRlcmFsXG4gICAgICAgICAgICAgICAgbm9kZS52YWx1ZSAgICAgID0gbmFtZVxuICAgICAgICAgICAgZWxzZSBpZiBub2RlIGluc3RhbmNlb2YgQ29kZVxuICAgICAgICAgICAgICAgIG5vZGUuY29udGV4dCAgICA9IG5hbWUgaWYgbm9kZS5ib3VuZFxuXG4gICAgIyBFbnN1cmUgdGhhdCBhbGwgZnVuY3Rpb25zIGJvdW5kIHRvIHRoZSBpbnN0YW5jZSBhcmUgcHJveGllZCBpbiB0aGUgY29uc3RydWN0b3IuXG4gICAgXG4gICAgYWRkQm91bmRGdW5jdGlvbnM6IChvKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGJ2YXIgaW4gQGJvdW5kRnVuY3NcbiAgICAgICAgICAgIGxocyA9IChuZXcgVmFsdWUgKG5ldyBUaGlzTGl0ZXJhbCksIFtuZXcgQWNjZXNzIGJ2YXJdKS5jb21waWxlIG9cbiAgICAgICAgICAgIEBjdG9yLmJvZHkudW5zaGlmdCBuZXcgTGl0ZXJhbCBcIiN7bGhzfSA9ICN7dXRpbGl0eSAnYmluZCcsIG99KCN7bGhzfSwgdGhpcylcIlxuICAgICAgICByZXR1cm5cblxuICAgICMgTWVyZ2UgdGhlIHByb3BlcnRpZXMgZnJvbSBhIHRvcC1sZXZlbCBvYmplY3QgYXMgcHJvdG90eXBhbCBwcm9wZXJ0aWVzIG9uIHRoZSBjbGFzcy5cbiAgICBcbiAgICBhZGRQcm9wZXJ0aWVzOiAobm9kZSwgbmFtZSwgbykgLT5cbiAgICAgICAgXG4gICAgICAgIHByb3BzID0gbm9kZS5iYXNlLnByb3BlcnRpZXNbLi5dXG4gICAgICAgIGV4cHJzID0gd2hpbGUgYXNzaWduID0gcHJvcHMuc2hpZnQoKVxuICAgICAgICAgICAgaWYgYXNzaWduIGluc3RhbmNlb2YgQXNzaWduXG4gICAgICAgICAgICAgICAgYmFzZSA9IGFzc2lnbi52YXJpYWJsZS5iYXNlXG4gICAgICAgICAgICAgICAgZGVsZXRlIGFzc2lnbi5jb250ZXh0XG4gICAgICAgICAgICAgICAgZnVuYyA9IGFzc2lnbi52YWx1ZVxuICAgICAgICAgICAgICAgIGlmIGJhc2UudmFsdWUgaXMgJ2NvbnN0cnVjdG9yJ1xuICAgICAgICAgICAgICAgICAgICBpZiBAY3RvclxuICAgICAgICAgICAgICAgICAgICAgICAgYXNzaWduLmVycm9yICdjYW5ub3QgZGVmaW5lIG1vcmUgdGhhbiBvbmUgY29uc3RydWN0b3IgaW4gYSBjbGFzcydcbiAgICAgICAgICAgICAgICAgICAgaWYgZnVuYy5ib3VuZFxuICAgICAgICAgICAgICAgICAgICAgICAgYXNzaWduLmVycm9yICdjYW5ub3QgZGVmaW5lIGEgY29uc3RydWN0b3IgYXMgYSBib3VuZCBmdW5jdGlvbidcbiAgICAgICAgICAgICAgICAgICAgaWYgZnVuYyBpbnN0YW5jZW9mIENvZGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2lnbiA9IEBjdG9yID0gZnVuY1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAZXh0ZXJuYWxDdG9yID0gby5jbGFzc1Njb3BlLmZyZWVWYXJpYWJsZSAnY3RvcidcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2lnbiA9IG5ldyBBc3NpZ24gbmV3IElkZW50aWZpZXJMaXRlcmFsKEBleHRlcm5hbEN0b3IpLCBmdW5jXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBpZiBhc3NpZ24udmFyaWFibGUudGhpc1xuICAgICAgICAgICAgICAgICAgICAgICAgZnVuYy5zdGF0aWMgPSB5ZXNcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgYWNjID0gaWYgYmFzZS5pc0NvbXBsZXgoKSB0aGVuIG5ldyBJbmRleCBiYXNlIGVsc2UgbmV3IEFjY2VzcyBiYXNlXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NpZ24udmFyaWFibGUgPSBuZXcgVmFsdWUobmV3IElkZW50aWZpZXJMaXRlcmFsKG5hbWUpLCBbKG5ldyBBY2Nlc3MgbmV3IFByb3BlcnR5TmFtZSAncHJvdG90eXBlJyksIGFjY10pXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBmdW5jIGluc3RhbmNlb2YgQ29kZSBhbmQgZnVuYy5ib3VuZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBib3VuZEZ1bmNzLnB1c2ggYmFzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmMuYm91bmQgPSBub1xuICAgICAgICAgICAgYXNzaWduXG5cbiAgICAgICAgY29tcGFjdCBleHByc1xuXG4gICAgIyBXYWxrIHRoZSBib2R5IG9mIHRoZSBjbGFzcywgbG9va2luZyBmb3IgcHJvdG90eXBlIHByb3BlcnRpZXMgdG8gYmUgY29udmVydGVkIGFuZCB0YWdnaW5nIHN0YXRpYyBhc3NpZ25tZW50cy5cbiAgICAgICAgXG4gICAgd2Fsa0JvZHk6IChuYW1lLCBvKSAtPlxuICAgICAgICAjbG9nICd3YWxrQm9keScsIG8uZmVhdHVyZVxuICAgICAgICBAdHJhdmVyc2VDaGlsZHJlbiBmYWxzZSwgKGNoaWxkKSA9PlxuICAgICAgICAgICAgY29udCA9IHRydWVcbiAgICAgICAgICAgIHJldHVybiBmYWxzZSBpZiBjaGlsZCBpbnN0YW5jZW9mIENsYXNzXG4gICAgICAgICAgICBpZiBjaGlsZCBpbnN0YW5jZW9mIEJsb2NrXG4gICAgICAgICAgICAgICAgZm9yIG5vZGUsIGkgaW4gZXhwcyA9IGNoaWxkLmV4cHJlc3Npb25zXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vZGUgaW5zdGFuY2VvZiBBc3NpZ24gYW5kIG5vZGUudmFyaWFibGUubG9va3NTdGF0aWMgbmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS52YWx1ZS5zdGF0aWMgPSB5ZXNcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBub2RlIGluc3RhbmNlb2YgVmFsdWUgYW5kIG5vZGUuaXNPYmplY3QodHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnQgPSBmYWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgZXhwc1tpXSA9IEBhZGRQcm9wZXJ0aWVzIG5vZGUsIG5hbWUsIG9cbiAgICAgICAgICAgICAgICBjaGlsZC5leHByZXNzaW9ucyA9IGV4cHMgPSBmbGF0dGVuIGV4cHNcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBjaGlsZC5jbGFzc0JvZHkgYW5kIGhhc0ZlYXR1cmUgbywgJ2NvbmZpZ19wYXJhbWV0ZXJzJ1xuICAgICAgICAgICAgICAgICAgICBAcHJlcGFyZVN1cGVyQ2FsbEZvckNvbmZpZ1BhcmFtcyBuYW1lLCBvLCBjaGlsZFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgY29udCBhbmQgY2hpbGQgbm90IGluc3RhbmNlb2YgQ2xhc3NcblxuICAgIHByZXBhcmVTdXBlckNhbGxGb3JDb25maWdQYXJhbXM6IChuYW1lLCBvLCBjbGFzc0JvZHkpIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgZXhwciBpbiBjbGFzc0JvZHkuZXhwcmVzc2lvbnNcbiAgICAgICAgICAgIGlmIGV4cHIgaW5zdGFuY2VvZiBDb2RlXG4gICAgICAgICAgICAgICAgY29udGludWUgaWYgbm90IGV4cHIucGFyYW1zWzBdPy5uYW1lXG4gICAgICAgICAgICAgICAgcGFyYW0wID0gZXhwci5wYXJhbXNbMF0ubmFtZVxuICAgICAgICAgICAgICAgIGlmIG5vdCBwYXJhbTAuZ2VuZXJhdGVkIHRoZW4gcmV0dXJuICMgdGhpcyBlbnN1cmUgdGhhdCB0aGlzIGZlYXR1cmUgaXMgb25seSBhY3RpdmUgd2hlbiB1c2luZyB0aGUgc2hvcnRjdXRcbiAgICAgICAgICAgICAgICBpZiBub3QgcGFyYW0wIGluc3RhbmNlb2YgT2JqIHRoZW4gcmV0dXJuIGxvZyAnQ09OU1RSVUNUT1IgUEFSQU0wIE5PVCBBTiBPQko/J1xuICAgICAgICAgICAgICAgIGlmIG5vdCBleHByLmJvZHkgaW5zdGFuY2VvZiBCbG9jayB0aGVuIHJldHVybiBsb2cgJ0NPTlNUUlVDVE9SIEJPRFkgTk9UIEFOIEJMT0NLPydcbiAgICAgICAgICAgICAgICBmb3IgYm9keUV4cHIgaW4gZXhwci5ib2R5LmV4cHJlc3Npb25zXG4gICAgICAgICAgICAgICAgICAgIGlmIGJvZHlFeHByIGluc3RhbmNlb2YgU3VwZXJDYWxsXG4gICAgICAgICAgICAgICAgICAgICAgICBib2R5RXhwci5jb25maWdQYXJhbWV0ZXIgPSBwYXJhbTBcbiAgICAgICAgICAgIFxuICAgICMgYHVzZSBzdHJpY3RgIChhbmQgb3RoZXIgZGlyZWN0aXZlcykgbXVzdCBiZSB0aGUgZmlyc3QgZXhwcmVzc2lvbiBzdGF0ZW1lbnQocylcbiAgICAjIG9mIGEgZnVuY3Rpb24gYm9keS4gVGhpcyBtZXRob2QgZW5zdXJlcyB0aGUgcHJvbG9ndWUgaXMgY29ycmVjdGx5IHBvc2l0aW9uZWRcbiAgICAjIGFib3ZlIHRoZSBgY29uc3RydWN0b3JgLlxuICAgIFxuICAgIGhvaXN0RGlyZWN0aXZlUHJvbG9ndWU6IC0+XG4gICAgICAgIFxuICAgICAgICBpbmRleCA9IDBcbiAgICAgICAge2V4cHJlc3Npb25zfSA9IEBib2R5XG4gICAgICAgICsraW5kZXggd2hpbGUgKG5vZGUgPSBleHByZXNzaW9uc1tpbmRleF0pIGFuZCBub2RlIGluc3RhbmNlb2YgQ29tbWVudCBvclxuICAgICAgICAgICAgbm9kZSBpbnN0YW5jZW9mIFZhbHVlIGFuZCBub2RlLmlzU3RyaW5nKClcbiAgICAgICAgQGRpcmVjdGl2ZXMgPSBleHByZXNzaW9ucy5zcGxpY2UgMCwgaW5kZXhcblxuICAgICMgTWFrZSBzdXJlIHRoYXQgYSBjb25zdHJ1Y3RvciBpcyBkZWZpbmVkIGZvciB0aGUgY2xhc3MsIGFuZCBwcm9wZXJseSBjb25maWd1cmVkLlxuICAgICAgICBcbiAgICBlbnN1cmVDb25zdHJ1Y3RvcjogKG5hbWUpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgQGN0b3JcbiAgICAgICAgICAgIEBjdG9yID0gbmV3IENvZGVcbiAgICAgICAgICAgIGlmIEBleHRlcm5hbEN0b3JcbiAgICAgICAgICAgICAgICBAY3Rvci5ib2R5LnB1c2ggbmV3IExpdGVyYWwgXCIje0BleHRlcm5hbEN0b3J9LmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcIlxuICAgICAgICAgICAgZWxzZSBpZiBAcGFyZW50XG4gICAgICAgICAgICAgICAgQGN0b3IuYm9keS5wdXNoIG5ldyBMaXRlcmFsIFwiI3tuYW1lfS5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKVwiXG4gICAgICAgICAgICBAY3Rvci5ib2R5Lm1ha2VSZXR1cm4oKVxuICAgICAgICAgICAgQGJvZHkuZXhwcmVzc2lvbnMudW5zaGlmdCBAY3RvclxuICAgICAgICBAY3Rvci5jdG9yID0gQGN0b3IubmFtZSA9IG5hbWVcbiAgICAgICAgQGN0b3Iua2xhc3MgPSBudWxsXG4gICAgICAgIEBjdG9yLm5vUmV0dXJuID0geWVzXG5cbiAgICAjIEluc3RlYWQgb2YgZ2VuZXJhdGluZyB0aGUgSmF2YVNjcmlwdCBzdHJpbmcgZGlyZWN0bHksIHdlIGJ1aWxkIHVwIHRoZVxuICAgICMgZXF1aXZhbGVudCBzeW50YXggdHJlZSBhbmQgY29tcGlsZSB0aGF0LCBpbiBwaWVjZXMuIFlvdSBjYW4gc2VlIHRoZVxuICAgICMgY29uc3RydWN0b3IsIHByb3BlcnR5IGFzc2lnbm1lbnRzLCBhbmQgaW5oZXJpdGFuY2UgZ2V0dGluZyBidWlsdCBvdXQgYmVsb3cuXG4gICAgXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYganVtcE5vZGUgPSBAYm9keS5qdW1wcygpXG4gICAgICAgICAgICBqdW1wTm9kZS5lcnJvciAnQ2xhc3MgYm9kaWVzIGNhbm5vdCBjb250YWluIHB1cmUgc3RhdGVtZW50cydcbiAgICAgICAgaWYgYXJndW1lbnRzTm9kZSA9IEBib2R5LmNvbnRhaW5zIGlzTGl0ZXJhbEFyZ3VtZW50c1xuICAgICAgICAgICAgYXJndW1lbnRzTm9kZS5lcnJvciBcIkNsYXNzIGJvZGllcyBzaG91bGRuJ3QgcmVmZXJlbmNlIGFyZ3VtZW50c1wiXG5cbiAgICAgICAgbmFtZSAgPSBAZGV0ZXJtaW5lTmFtZSgpXG4gICAgICAgIGxuYW1lID0gbmV3IElkZW50aWZpZXJMaXRlcmFsIG5hbWVcbiAgICAgICAgZnVuYyAgPSBuZXcgQ29kZSBbXSwgQmxvY2sud3JhcCBbQGJvZHldXG4gICAgICAgIGFyZ3MgID0gW11cbiAgICAgICAgby5jbGFzc1Njb3BlID0gZnVuYy5tYWtlU2NvcGUgby5zY29wZVxuXG4gICAgICAgIEBob2lzdERpcmVjdGl2ZVByb2xvZ3VlKClcbiAgICAgICAgQHNldENvbnRleHQgbmFtZVxuICAgICAgICBAd2Fsa0JvZHkgbmFtZSwgb1xuICAgICAgICBAZW5zdXJlQ29uc3RydWN0b3IgbmFtZVxuICAgICAgICBAYWRkQm91bmRGdW5jdGlvbnMgb1xuICAgICAgICBAYm9keS5zcGFjZWQgPSB5ZXNcbiAgICAgICAgQGJvZHkuZXhwcmVzc2lvbnMucHVzaCBsbmFtZVxuXG4gICAgICAgIGlmIEBwYXJlbnRcbiAgICAgICAgICAgIHN1cGVyQ2xhc3MgPSBuZXcgSWRlbnRpZmllckxpdGVyYWwgby5jbGFzc1Njb3BlLmZyZWVWYXJpYWJsZSAnc3VwZXJDbGFzcycsIHJlc2VydmU6IG5vXG4gICAgICAgICAgICBAYm9keS5leHByZXNzaW9ucy51bnNoaWZ0IG5ldyBFeHRlbmRzIGxuYW1lLCBzdXBlckNsYXNzXG4gICAgICAgICAgICBmdW5jLnBhcmFtcy5wdXNoIG5ldyBQYXJhbSBzdXBlckNsYXNzXG4gICAgICAgICAgICBhcmdzLnB1c2ggQHBhcmVudFxuXG4gICAgICAgIEBib2R5LmV4cHJlc3Npb25zLnVuc2hpZnQgQGRpcmVjdGl2ZXMuLi5cblxuICAgICAgICBrbGFzcyA9IG5ldyBQYXJlbnMgbmV3IENhbGwgZnVuYywgYXJnc1xuICAgICAgICBrbGFzcyA9IG5ldyBBc3NpZ24gQHZhcmlhYmxlLCBrbGFzcywgbnVsbCwgeyBAbW9kdWxlRGVjbGFyYXRpb24gfSBpZiBAdmFyaWFibGVcbiAgICAgICAga2xhc3MuY29tcGlsZVRvRnJhZ21lbnRzIG9cblxuIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIFxuIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG5cbmV4cG9ydHMuTW9kdWxlRGVjbGFyYXRpb24gPSBjbGFzcyBNb2R1bGVEZWNsYXJhdGlvbiBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBAOiAoQGNsYXVzZSwgQHNvdXJjZSkgLT5cbiAgICAgICAgQGNoZWNrU291cmNlKClcblxuICAgIGNoaWxkcmVuOiBbJ2NsYXVzZScsICdzb3VyY2UnXVxuXG4gICAgaXNTdGF0ZW1lbnQ6IFlFU1xuICAgIGp1bXBzOiAgICAgICBUSElTXG4gICAgbWFrZVJldHVybjogIFRISVNcblxuICAgIGNoZWNrU291cmNlOiAtPlxuICAgICAgICBpZiBAc291cmNlPyBhbmQgQHNvdXJjZSBpbnN0YW5jZW9mIFN0cmluZ1dpdGhJbnRlcnBvbGF0aW9uc1xuICAgICAgICAgICAgQHNvdXJjZS5lcnJvciAndGhlIG5hbWUgb2YgdGhlIG1vZHVsZSB0byBiZSBpbXBvcnRlZCBmcm9tIG11c3QgYmUgYW4gdW5pbnRlcnBvbGF0ZWQgc3RyaW5nJ1xuXG4gICAgY2hlY2tTY29wZTogKG8sIG1vZHVsZURlY2xhcmF0aW9uVHlwZSkgLT5cbiAgICAgICAgaWYgby5pbmRlbnQubGVuZ3RoICE9IDBcbiAgICAgICAgICAgIEBlcnJvciBcIiN7bW9kdWxlRGVjbGFyYXRpb25UeXBlfSBzdGF0ZW1lbnRzIG11c3QgYmUgYXQgdG9wLWxldmVsIHNjb3BlXCJcblxuIyAwMDAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4jIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiMgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG5cbmV4cG9ydHMuSW1wb3J0RGVjbGFyYXRpb24gPSBjbGFzcyBJbXBvcnREZWNsYXJhdGlvbiBleHRlbmRzIE1vZHVsZURlY2xhcmF0aW9uXG4gICAgXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBAY2hlY2tTY29wZSBvLCAnaW1wb3J0J1xuICAgICAgICBvLmltcG9ydGVkU3ltYm9scyA9IFtdXG5cbiAgICAgICAgY29kZSA9IFtdXG4gICAgICAgIGNvZGUucHVzaCBAbWFrZUNvZGUgXCIje0B0YWJ9aW1wb3J0IFwiXG4gICAgICAgIGNvZGUucHVzaCBAY2xhdXNlLmNvbXBpbGVOb2RlKG8pLi4uIGlmIEBjbGF1c2U/XG5cbiAgICAgICAgaWYgQHNvdXJjZT8udmFsdWU/XG4gICAgICAgICAgICBjb2RlLnB1c2ggQG1ha2VDb2RlICcgZnJvbSAnIHVubGVzcyBAY2xhdXNlIGlzIG51bGxcbiAgICAgICAgICAgIGNvZGUucHVzaCBAbWFrZUNvZGUgQHNvdXJjZS52YWx1ZVxuXG4gICAgICAgIGNvZGUucHVzaCBAbWFrZUNvZGUgJzsnXG4gICAgICAgIGNvZGVcblxuZXhwb3J0cy5JbXBvcnRDbGF1c2UgPSBjbGFzcyBJbXBvcnRDbGF1c2UgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgQDogKEBkZWZhdWx0QmluZGluZywgQG5hbWVkSW1wb3J0cykgLT5cblxuICAgIGNoaWxkcmVuOiBbJ2RlZmF1bHRCaW5kaW5nJywgJ25hbWVkSW1wb3J0cyddXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIGNvZGUgPSBbXVxuXG4gICAgICAgIGlmIEBkZWZhdWx0QmluZGluZz9cbiAgICAgICAgICAgIGNvZGUucHVzaCBAZGVmYXVsdEJpbmRpbmcuY29tcGlsZU5vZGUobykuLi5cbiAgICAgICAgICAgIGNvZGUucHVzaCBAbWFrZUNvZGUgJywgJyBpZiBAbmFtZWRJbXBvcnRzP1xuXG4gICAgICAgIGlmIEBuYW1lZEltcG9ydHM/XG4gICAgICAgICAgICBjb2RlLnB1c2ggQG5hbWVkSW1wb3J0cy5jb21waWxlTm9kZShvKS4uLlxuXG4gICAgICAgIGNvZGVcblxuIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuXG5leHBvcnRzLkV4cG9ydERlY2xhcmF0aW9uID0gY2xhc3MgRXhwb3J0RGVjbGFyYXRpb24gZXh0ZW5kcyBNb2R1bGVEZWNsYXJhdGlvblxuICAgIFxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgQGNoZWNrU2NvcGUgbywgJ2V4cG9ydCdcblxuICAgICAgICBjb2RlID0gW11cbiAgICAgICAgY29kZS5wdXNoIEBtYWtlQ29kZSBcIiN7QHRhYn1leHBvcnQgXCJcbiAgICAgICAgY29kZS5wdXNoIEBtYWtlQ29kZSAnZGVmYXVsdCAnIGlmIEAgaW5zdGFuY2VvZiBFeHBvcnREZWZhdWx0RGVjbGFyYXRpb25cblxuICAgICAgICBpZiBAIG5vdCBpbnN0YW5jZW9mIEV4cG9ydERlZmF1bHREZWNsYXJhdGlvbiBhbmRcbiAgICAgICAgICAgICAoQGNsYXVzZSBpbnN0YW5jZW9mIEFzc2lnbiBvciBAY2xhdXNlIGluc3RhbmNlb2YgQ2xhc3MpXG4gICAgICAgICAgICAjIFByZXZlbnQgZXhwb3J0aW5nIGFuIGFub255bW91cyBjbGFzczsgYWxsIGV4cG9ydGVkIG1lbWJlcnMgbXVzdCBiZSBuYW1lZFxuICAgICAgICAgICAgaWYgQGNsYXVzZSBpbnN0YW5jZW9mIENsYXNzIGFuZCBub3QgQGNsYXVzZS52YXJpYWJsZVxuICAgICAgICAgICAgICAgIEBjbGF1c2UuZXJyb3IgJ2Fub255bW91cyBjbGFzc2VzIGNhbm5vdCBiZSBleHBvcnRlZCdcblxuICAgICAgICAgICAgIyBXaGVuIHRoZSBFUzIwMTUgYGNsYXNzYCBrZXl3b3JkIGlzIHN1cHBvcnRlZCwgZG9u4oCZdCBhZGQgYSBgdmFyYCBoZXJlXG4gICAgICAgICAgICBjb2RlLnB1c2ggQG1ha2VDb2RlICd2YXIgJ1xuICAgICAgICAgICAgQGNsYXVzZS5tb2R1bGVEZWNsYXJhdGlvbiA9ICdleHBvcnQnXG5cbiAgICAgICAgaWYgQGNsYXVzZS5ib2R5PyBhbmQgQGNsYXVzZS5ib2R5IGluc3RhbmNlb2YgQmxvY2tcbiAgICAgICAgICAgIGNvZGUgPSBjb2RlLmNvbmNhdCBAY2xhdXNlLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9UT1BcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgY29kZSA9IGNvZGUuY29uY2F0IEBjbGF1c2UuY29tcGlsZU5vZGUgb1xuXG4gICAgICAgIGNvZGUucHVzaCBAbWFrZUNvZGUgXCIgZnJvbSAje0Bzb3VyY2UudmFsdWV9XCIgaWYgQHNvdXJjZT8udmFsdWU/XG4gICAgICAgIGNvZGUucHVzaCBAbWFrZUNvZGUgJzsnXG4gICAgICAgIGNvZGVcblxuZXhwb3J0cy5FeHBvcnROYW1lZERlY2xhcmF0aW9uID0gY2xhc3MgRXhwb3J0TmFtZWREZWNsYXJhdGlvbiBleHRlbmRzIEV4cG9ydERlY2xhcmF0aW9uXG5cbmV4cG9ydHMuRXhwb3J0RGVmYXVsdERlY2xhcmF0aW9uID0gY2xhc3MgRXhwb3J0RGVmYXVsdERlY2xhcmF0aW9uIGV4dGVuZHMgRXhwb3J0RGVjbGFyYXRpb25cblxuZXhwb3J0cy5FeHBvcnRBbGxEZWNsYXJhdGlvbiA9IGNsYXNzIEV4cG9ydEFsbERlY2xhcmF0aW9uIGV4dGVuZHMgRXhwb3J0RGVjbGFyYXRpb25cblxuZXhwb3J0cy5Nb2R1bGVTcGVjaWZpZXJMaXN0ID0gY2xhc3MgTW9kdWxlU3BlY2lmaWVyTGlzdCBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBAOiAoQHNwZWNpZmllcnMpIC0+XG5cbiAgICBjaGlsZHJlbjogWydzcGVjaWZpZXJzJ11cblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgY29kZSA9IFtdXG4gICAgICAgIG8uaW5kZW50ICs9IFRBQlxuICAgICAgICBjb21waWxlZExpc3QgPSAoc3BlY2lmaWVyLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9MSVNUIGZvciBzcGVjaWZpZXIgaW4gQHNwZWNpZmllcnMpXG5cbiAgICAgICAgaWYgQHNwZWNpZmllcnMubGVuZ3RoICE9IDBcbiAgICAgICAgICAgIGNvZGUucHVzaCBAbWFrZUNvZGUgXCJ7XFxuI3tvLmluZGVudH1cIlxuICAgICAgICAgICAgZm9yIGZyYWdtZW50cywgaW5kZXggaW4gY29tcGlsZWRMaXN0XG4gICAgICAgICAgICAgICAgY29kZS5wdXNoIEBtYWtlQ29kZShcIixcXG4je28uaW5kZW50fVwiKSBpZiBpbmRleFxuICAgICAgICAgICAgICAgIGNvZGUucHVzaCBmcmFnbWVudHMuLi5cbiAgICAgICAgICAgIGNvZGUucHVzaCBAbWFrZUNvZGUgXCJcXG59XCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgY29kZS5wdXNoIEBtYWtlQ29kZSAne30nXG4gICAgICAgIGNvZGVcblxuZXhwb3J0cy5JbXBvcnRTcGVjaWZpZXJMaXN0ID0gY2xhc3MgSW1wb3J0U3BlY2lmaWVyTGlzdCBleHRlbmRzIE1vZHVsZVNwZWNpZmllckxpc3RcblxuZXhwb3J0cy5FeHBvcnRTcGVjaWZpZXJMaXN0ID0gY2xhc3MgRXhwb3J0U3BlY2lmaWVyTGlzdCBleHRlbmRzIE1vZHVsZVNwZWNpZmllckxpc3RcblxuZXhwb3J0cy5Nb2R1bGVTcGVjaWZpZXIgPSBjbGFzcyBNb2R1bGVTcGVjaWZpZXIgZXh0ZW5kcyBCYXNlXG4gICAgQDogKEBvcmlnaW5hbCwgQGFsaWFzLCBAbW9kdWxlRGVjbGFyYXRpb25UeXBlKSAtPlxuICAgICAgICAjIFRoZSBuYW1lIG9mIHRoZSB2YXJpYWJsZSBlbnRlcmluZyB0aGUgbG9jYWwgc2NvcGVcbiAgICAgICAgQGlkZW50aWZpZXIgPSBpZiBAYWxpYXM/IHRoZW4gQGFsaWFzLnZhbHVlIGVsc2UgQG9yaWdpbmFsLnZhbHVlXG5cbiAgICBjaGlsZHJlbjogWydvcmlnaW5hbCcsICdhbGlhcyddXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIG8uc2NvcGUuZmluZCBAaWRlbnRpZmllciwgQG1vZHVsZURlY2xhcmF0aW9uVHlwZVxuICAgICAgICBjb2RlID0gW11cbiAgICAgICAgY29kZS5wdXNoIEBtYWtlQ29kZSBAb3JpZ2luYWwudmFsdWVcbiAgICAgICAgY29kZS5wdXNoIEBtYWtlQ29kZSBcIiBhcyAje0BhbGlhcy52YWx1ZX1cIiBpZiBAYWxpYXM/XG4gICAgICAgIGNvZGVcblxuZXhwb3J0cy5JbXBvcnRTcGVjaWZpZXIgPSBjbGFzcyBJbXBvcnRTcGVjaWZpZXIgZXh0ZW5kcyBNb2R1bGVTcGVjaWZpZXJcbiAgICBAOiAoaW1wb3J0ZWQsIGxvY2FsKSAtPlxuICAgICAgICBzdXBlciBpbXBvcnRlZCwgbG9jYWwsICdpbXBvcnQnXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgICMgUGVyIHRoZSBzcGVjLCBzeW1ib2xzIGNhbuKAmXQgYmUgaW1wb3J0ZWQgbXVsdGlwbGUgdGltZXNcbiAgICAgICAgIyAoZS5nLiBgaW1wb3J0IHsgZm9vLCBmb28gfSBmcm9tICdsaWInYCBpcyBpbnZhbGlkKVxuICAgICAgICBpZiBAaWRlbnRpZmllciBpbiBvLmltcG9ydGVkU3ltYm9scyBvciBvLnNjb3BlLmNoZWNrKEBpZGVudGlmaWVyKVxuICAgICAgICAgICAgQGVycm9yIFwiJyN7QGlkZW50aWZpZXJ9JyBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgby5pbXBvcnRlZFN5bWJvbHMucHVzaCBAaWRlbnRpZmllclxuICAgICAgICBzdXBlciBvXG5cbmV4cG9ydHMuSW1wb3J0RGVmYXVsdFNwZWNpZmllciA9IGNsYXNzIEltcG9ydERlZmF1bHRTcGVjaWZpZXIgZXh0ZW5kcyBJbXBvcnRTcGVjaWZpZXJcblxuZXhwb3J0cy5JbXBvcnROYW1lc3BhY2VTcGVjaWZpZXIgPSBjbGFzcyBJbXBvcnROYW1lc3BhY2VTcGVjaWZpZXIgZXh0ZW5kcyBJbXBvcnRTcGVjaWZpZXJcblxuZXhwb3J0cy5FeHBvcnRTcGVjaWZpZXIgPSBjbGFzcyBFeHBvcnRTcGVjaWZpZXIgZXh0ZW5kcyBNb2R1bGVTcGVjaWZpZXJcbiAgICBAOiAobG9jYWwsIGV4cG9ydGVkKSAtPlxuICAgICAgICBzdXBlciBsb2NhbCwgZXhwb3J0ZWQsICdleHBvcnQnXG5cbiMgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgIDAwMDAgIDAwMCAgXG4jIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwIDAgMDAwICBcbiMgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG5cbiMgVGhlICoqQXNzaWduKiogaXMgdXNlZCB0byBhc3NpZ24gYSBsb2NhbCB2YXJpYWJsZSB0byB2YWx1ZSwgb3IgdG8gc2V0IHRoZVxuIyBwcm9wZXJ0eSBvZiBhbiBvYmplY3QgLS0gaW5jbHVkaW5nIHdpdGhpbiBvYmplY3QgbGl0ZXJhbHMuXG5cbmV4cG9ydHMuQXNzaWduID0gY2xhc3MgQXNzaWduIGV4dGVuZHMgQmFzZVxuICAgIFxuICAgIEA6IChAdmFyaWFibGUsIEB2YWx1ZSwgQGNvbnRleHQsIG9wdGlvbnMgPSB7fSkgLT5cbiAgICAgICAge0BwYXJhbSwgQHN1YnBhdHRlcm4sIEBvcGVyYXRvclRva2VuLCBAbW9kdWxlRGVjbGFyYXRpb259ID0gb3B0aW9uc1xuXG4gICAgY2hpbGRyZW46IFsndmFyaWFibGUnLCAndmFsdWUnXVxuXG4gICAgaXNTdGF0ZW1lbnQ6IChvKSAtPlxuICAgICAgICBvPy5sZXZlbCBpcyBMRVZFTF9UT1AgYW5kIEBjb250ZXh0PyBhbmQgKEBtb2R1bGVEZWNsYXJhdGlvbiBvciBcIj9cIiBpbiBAY29udGV4dClcblxuICAgIGNoZWNrQXNzaWduYWJpbGl0eTogKG8sIHZhckJhc2UpIC0+XG4gICAgICAgIGlmIE9iamVjdC5oYXNPd24oby5zY29wZS5wb3NpdGlvbnMsIHZhckJhc2UudmFsdWUpIGFuZCBvLnNjb3BlLnZhcmlhYmxlc1tvLnNjb3BlLnBvc2l0aW9uc1t2YXJCYXNlLnZhbHVlXV0udHlwZSA9PSAnaW1wb3J0J1xuICAgICAgICAgICAgdmFyQmFzZS5lcnJvciBcIicje3ZhckJhc2UudmFsdWV9JyBpcyByZWFkLW9ubHlcIlxuXG4gICAgYXNzaWduczogKG5hbWUpIC0+XG4gICAgICAgIEBbaWYgQGNvbnRleHQgaXMgJ29iamVjdCcgdGhlbiAndmFsdWUnIGVsc2UgJ3ZhcmlhYmxlJ10uYXNzaWducyBuYW1lXG5cbiAgICB1bmZvbGRTb2FrOiAobykgLT5cbiAgICAgICAgdW5mb2xkU29hayBvLCB0aGlzLCAndmFyaWFibGUnXG5cbiAgICAjIENvbXBpbGUgYW4gYXNzaWdubWVudCwgZGVsZWdhdGluZyB0byBgY29tcGlsZVBhdHRlcm5NYXRjaGAgb3JcbiAgICAjIGBjb21waWxlU3BsaWNlYCBpZiBhcHByb3ByaWF0ZS4gS2VlcCB0cmFjayBvZiB0aGUgbmFtZSBvZiB0aGUgYmFzZSBvYmplY3RcbiAgICAjIHdlJ3ZlIGJlZW4gYXNzaWduZWQgdG8sIGZvciBjb3JyZWN0IGludGVybmFsIHJlZmVyZW5jZXMuIElmIHRoZSB2YXJpYWJsZVxuICAgICMgaGFzIG5vdCBiZWVuIHNlZW4geWV0IHdpdGhpbiB0aGUgY3VycmVudCBzY29wZSwgZGVjbGFyZSBpdC5cbiAgICBcbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBpc1ZhbHVlID0gQHZhcmlhYmxlIGluc3RhbmNlb2YgVmFsdWVcbiAgICAgICAgICAgIHJldHVybiBAY29tcGlsZVBhdHRlcm5NYXRjaCBvIGlmIEB2YXJpYWJsZS5pc0FycmF5KCkgb3IgQHZhcmlhYmxlLmlzT2JqZWN0KClcbiAgICAgICAgICAgIHJldHVybiBAY29tcGlsZVNwbGljZSAgICAgICBvIGlmIEB2YXJpYWJsZS5pc1NwbGljZSgpXG4gICAgICAgICAgICByZXR1cm4gQGNvbXBpbGVDb25kaXRpb25hbCAgbyBpZiBAY29udGV4dCBpbiBbJ3x8PScsICcmJj0nLCAnPz0nXVxuICAgICAgICAgICAgcmV0dXJuIEBjb21waWxlU3BlY2lhbE1hdGggIG8gaWYgQGNvbnRleHQgaW4gWycqKj0nLCAnLy89JywgJyUlPSddXG4gICAgICAgIGlmIEB2YWx1ZSBpbnN0YW5jZW9mIENvZGVcbiAgICAgICAgICAgIGlmIEB2YWx1ZS5zdGF0aWNcbiAgICAgICAgICAgICAgICBAdmFsdWUua2xhc3MgPSBAdmFyaWFibGUuYmFzZVxuICAgICAgICAgICAgICAgIEB2YWx1ZS5uYW1lICA9IEB2YXJpYWJsZS5wcm9wZXJ0aWVzWzBdXG4gICAgICAgICAgICAgICAgQHZhbHVlLnZhcmlhYmxlID0gQHZhcmlhYmxlXG4gICAgICAgICAgICBlbHNlIGlmIEB2YXJpYWJsZS5wcm9wZXJ0aWVzPy5sZW5ndGggPj0gMlxuICAgICAgICAgICAgICAgIFtwcm9wZXJ0aWVzLi4uLCBwcm90b3R5cGUsIG5hbWVdID0gQHZhcmlhYmxlLnByb3BlcnRpZXNcbiAgICAgICAgICAgICAgICBpZiBwcm90b3R5cGUubmFtZT8udmFsdWUgaXMgJ3Byb3RvdHlwZSdcbiAgICAgICAgICAgICAgICAgICAgQHZhbHVlLmtsYXNzID0gbmV3IFZhbHVlIEB2YXJpYWJsZS5iYXNlLCBwcm9wZXJ0aWVzXG4gICAgICAgICAgICAgICAgICAgIEB2YWx1ZS5uYW1lICA9IG5hbWVcbiAgICAgICAgICAgICAgICAgICAgQHZhbHVlLnZhcmlhYmxlID0gQHZhcmlhYmxlXG4gICAgICAgIHVubGVzcyBAY29udGV4dFxuICAgICAgICAgICAgdmFyQmFzZSA9IEB2YXJpYWJsZS51bndyYXBBbGwoKVxuICAgICAgICAgICAgdW5sZXNzIHZhckJhc2UuaXNBc3NpZ25hYmxlKClcbiAgICAgICAgICAgICAgICBAdmFyaWFibGUuZXJyb3IgXCInI3tAdmFyaWFibGUuY29tcGlsZSBvfScgY2FuJ3QgYmUgYXNzaWduZWRcIlxuICAgICAgICAgICAgdW5sZXNzIHZhckJhc2UuaGFzUHJvcGVydGllcz8oKVxuICAgICAgICAgICAgICAgICMgYG1vZHVsZURlY2xhcmF0aW9uYCBjYW4gYmUgYCdpbXBvcnQnYCBvciBgJ2V4cG9ydCdgXG4gICAgICAgICAgICAgICAgaWYgQG1vZHVsZURlY2xhcmF0aW9uXG4gICAgICAgICAgICAgICAgICAgIEBjaGVja0Fzc2lnbmFiaWxpdHkgbywgdmFyQmFzZVxuICAgICAgICAgICAgICAgICAgICBvLnNjb3BlLmFkZCB2YXJCYXNlLnZhbHVlLCBAbW9kdWxlRGVjbGFyYXRpb25cbiAgICAgICAgICAgICAgICBlbHNlIGlmIEBwYXJhbVxuICAgICAgICAgICAgICAgICAgICBvLnNjb3BlLmFkZCB2YXJCYXNlLnZhbHVlLCAndmFyJ1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQGNoZWNrQXNzaWduYWJpbGl0eSBvLCB2YXJCYXNlXG4gICAgICAgICAgICAgICAgICAgIG8uc2NvcGUuZmluZCB2YXJCYXNlLnZhbHVlXG5cbiAgICAgICAgdmFsID0gQHZhbHVlLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9MSVNUXG4gICAgICAgIEB2YXJpYWJsZS5mcm9udCA9IHRydWUgaWYgaXNWYWx1ZSBhbmQgQHZhcmlhYmxlLmJhc2UgaW5zdGFuY2VvZiBPYmpcbiAgICAgICAgY29tcGlsZWROYW1lID0gQHZhcmlhYmxlLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9MSVNUXG5cbiAgICAgICAgaWYgQGNvbnRleHQgaXMgJ29iamVjdCdcbiAgICAgICAgICAgIGlmIEBmcmFnbWVudHNUb1RleHQoY29tcGlsZWROYW1lKSBpbiBKU19GT1JCSURERU5cbiAgICAgICAgICAgICAgICBjb21waWxlZE5hbWUudW5zaGlmdCBAbWFrZUNvZGUgJ1wiJ1xuICAgICAgICAgICAgICAgIGNvbXBpbGVkTmFtZS5wdXNoIEBtYWtlQ29kZSAnXCInXG4gICAgICAgICAgICByZXR1cm4gY29tcGlsZWROYW1lLmNvbmNhdCBAbWFrZUNvZGUoXCI6IFwiKSwgdmFsXG5cbiAgICAgICAgYW5zd2VyID0gY29tcGlsZWROYW1lLmNvbmNhdCBAbWFrZUNvZGUoXCIgI3sgQGNvbnRleHQgb3IgJz0nIH0gXCIpLCB2YWxcbiAgICAgICAgaWYgby5sZXZlbCA8PSBMRVZFTF9MSVNUIHRoZW4gYW5zd2VyIGVsc2UgQHdyYXBJbkJyYWNlcyBhbnN3ZXJcblxuICAgICMgQnJpZWYgaW1wbGVtZW50YXRpb24gb2YgcmVjdXJzaXZlIHBhdHRlcm4gbWF0Y2hpbmcsIHdoZW4gYXNzaWduaW5nIGFycmF5IG9yXG4gICAgIyBvYmplY3QgbGl0ZXJhbHMgdG8gYSB2YWx1ZS4gUGVla3MgYXQgdGhlaXIgcHJvcGVydGllcyB0byBhc3NpZ24gaW5uZXIgbmFtZXMuXG4gICAgXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgY29tcGlsZVBhdHRlcm5NYXRjaDogKG8pIC0+XG4gICAgICAgIFxuICAgICAgICB0b3AgICAgICAgPSBvLmxldmVsIGlzIExFVkVMX1RPUFxuICAgICAgICB7dmFsdWV9ICAgPSB0aGlzXG4gICAgICAgIHtvYmplY3RzfSA9IEB2YXJpYWJsZS5iYXNlXG4gICAgICAgIFxuICAgICAgICB1bmxlc3Mgb2xlbiA9IG9iamVjdHMubGVuZ3RoXG4gICAgICAgICAgICBjb2RlID0gdmFsdWUuY29tcGlsZVRvRnJhZ21lbnRzIG9cbiAgICAgICAgICAgIHJldHVybiBpZiBvLmxldmVsID49IExFVkVMX09QIHRoZW4gQHdyYXBJbkJyYWNlcyBjb2RlIGVsc2UgY29kZVxuICAgICAgICAgICAgXG4gICAgICAgIFtvYmpdID0gb2JqZWN0c1xuICAgICAgICBcbiAgICAgICAgaWYgb2xlbiBpcyAxIGFuZCBvYmogaW5zdGFuY2VvZiBFeHBhbnNpb25cbiAgICAgICAgICAgIG9iai5lcnJvciAnRGVzdHJ1Y3R1cmluZyBhc3NpZ25tZW50IGhhcyBubyB0YXJnZXQnXG4gICAgICAgICAgICBcbiAgICAgICAgaXNPYmplY3QgPSBAdmFyaWFibGUuaXNPYmplY3QoKVxuICAgICAgICBcbiAgICAgICAgaWYgdG9wIGFuZCBvbGVuIGlzIDEgYW5kIG9iaiBub3QgaW5zdGFuY2VvZiBTcGxhdFxuICAgICAgICAgICAgIyBQaWNrIHRoZSBwcm9wZXJ0eSBzdHJhaWdodCBvZmYgdGhlIHZhbHVlIHdoZW4gdGhlcmXigJlzIGp1c3Qgb25lIHRvIHBpY2tcbiAgICAgICAgICAgICMgKG5vIG5lZWQgdG8gY2FjaGUgdGhlIHZhbHVlIGludG8gYSB2YXJpYWJsZSkuXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWUgPSBudWxsXG4gICAgICAgICAgICBpZiBvYmogaW5zdGFuY2VvZiBBc3NpZ24gYW5kIG9iai5jb250ZXh0IGlzICdvYmplY3QnXG4gICAgICAgICAgICAgICAgIyBBIHJlZ3VsYXIgb2JqZWN0IHBhdHRlcm4tbWF0Y2guXG4gICAgICAgICAgICAgICAge3ZhcmlhYmxlOiB7YmFzZTogaWR4fSwgdmFsdWU6IG9ian0gPSBvYmpcbiAgICAgICAgICAgICAgICBpZiBvYmogaW5zdGFuY2VvZiBBc3NpZ25cbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlID0gb2JqLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgIG9iaiA9IG9iai52YXJpYWJsZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGlmIG9iaiBpbnN0YW5jZW9mIEFzc2lnblxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0VmFsdWUgPSBvYmoudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgb2JqID0gb2JqLnZhcmlhYmxlXG4gICAgICAgICAgICAgICAgaWR4ID0gaWYgaXNPYmplY3QgIyBBIHNob3J0aGFuZCBge2EsIGIsIEBjfSA9IHZhbGAgcGF0dGVybi1tYXRjaC5cbiAgICAgICAgICAgICAgICAgICAgaWYgb2JqLnRoaXNcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iai5wcm9wZXJ0aWVzWzBdLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IFByb3BlcnR5TmFtZSBvYmoudW53cmFwKCkudmFsdWVcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICMgQSByZWd1bGFyIGFycmF5IHBhdHRlcm4tbWF0Y2guXG4gICAgICAgICAgICAgICAgICAgIG5ldyBOdW1iZXJMaXRlcmFsIDBcbiAgICAgICAgICAgIGFjYyA9IGlkeC51bndyYXAoKSBpbnN0YW5jZW9mIFByb3BlcnR5TmFtZVxuICAgICAgICAgICAgdmFsdWUgPSBuZXcgVmFsdWUgdmFsdWVcbiAgICAgICAgICAgIHZhbHVlLnByb3BlcnRpZXMucHVzaCBuZXcgKGlmIGFjYyB0aGVuIEFjY2VzcyBlbHNlIEluZGV4KSBpZHhcbiAgICAgICAgICAgIG1lc3NhZ2UgPSBpc1VuYXNzaWduYWJsZSBvYmoudW53cmFwKCkudmFsdWVcbiAgICAgICAgICAgIG9iai5lcnJvciBtZXNzYWdlIGlmIG1lc3NhZ2VcbiAgICAgICAgICAgIHZhbHVlID0gbmV3IE9wICc/JywgdmFsdWUsIGRlZmF1bHRWYWx1ZSBpZiBkZWZhdWx0VmFsdWVcbiAgICAgICAgICAgIHJldHVybiBuZXcgQXNzaWduKG9iaiwgdmFsdWUsIG51bGwsIHBhcmFtOiBAcGFyYW0pLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9UT1BcbiAgICAgICAgICAgIFxuICAgICAgICB2dmFyICAgICA9IHZhbHVlLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9MSVNUXG4gICAgICAgIHZ2YXJUZXh0ID0gQGZyYWdtZW50c1RvVGV4dCB2dmFyXG4gICAgICAgIGFzc2lnbnMgID0gW11cbiAgICAgICAgZXhwYW5kZWRJZHggPSBmYWxzZVxuICAgICAgICAjIE1ha2UgdnZhciBpbnRvIGEgc2ltcGxlIHZhcmlhYmxlIGlmIGl0IGlzbid0IGFscmVhZHkuXG4gICAgICAgIGlmIHZhbHVlLnVud3JhcCgpIG5vdCBpbnN0YW5jZW9mIElkZW50aWZpZXJMaXRlcmFsIG9yIEB2YXJpYWJsZS5hc3NpZ25zKHZ2YXJUZXh0KVxuICAgICAgICAgICAgYXNzaWducy5wdXNoIFtAbWFrZUNvZGUoXCIjeyByZWYgPSBvLnNjb3BlLmZyZWVWYXJpYWJsZSAncmVmJyB9ID0gXCIpLCB2dmFyLi4uXVxuICAgICAgICAgICAgdnZhciA9IFtAbWFrZUNvZGUgcmVmXVxuICAgICAgICAgICAgdnZhclRleHQgPSByZWZcbiAgICAgICAgICAgIFxuICAgICAgICBmb3Igb2JqLCBpIGluIG9iamVjdHNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWR4ID0gaVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBub3QgZXhwYW5kZWRJZHggYW5kIG9iaiBpbnN0YW5jZW9mIFNwbGF0XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgbmFtZSA9IG9iai5uYW1lLnVud3JhcCgpLnZhbHVlXG4gICAgICAgICAgICAgICAgb2JqID0gb2JqLnVud3JhcCgpXG4gICAgICAgICAgICAgICAgdmFsID0gXCIje29sZW59IDw9ICN7dnZhclRleHR9Lmxlbmd0aCA/ICN7IHV0aWxpdHkgJ3NsaWNlJywgbyB9LmNhbGwoI3t2dmFyVGV4dH0sICN7aX1cIlxuICAgICAgICAgICAgICAgIGlmIHJlc3QgPSBvbGVuIC0gaSAtIDFcbiAgICAgICAgICAgICAgICAgICAgaXZhciA9IG8uc2NvcGUuZnJlZVZhcmlhYmxlICdpJywgc2luZ2xlOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIHZhbCArPSBcIiwgI3tpdmFyfSA9ICN7dnZhclRleHR9Lmxlbmd0aCAtICN7cmVzdH0pIDogKCN7aXZhcn0gPSAje2l9LCBbXSlcIlxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgdmFsICs9IFwiKSA6IFtdXCJcbiAgICAgICAgICAgICAgICB2YWwgICAgID0gbmV3IExpdGVyYWwgdmFsXG4gICAgICAgICAgICAgICAgZXhwYW5kZWRJZHggPSBcIiN7aXZhcn0rK1wiXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBlbHNlIGlmIG5vdCBleHBhbmRlZElkeCBhbmQgb2JqIGluc3RhbmNlb2YgRXhwYW5zaW9uXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgcmVzdCA9IG9sZW4gLSBpIC0gMVxuICAgICAgICAgICAgICAgICAgICBpZiByZXN0IGlzIDFcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4cGFuZGVkSWR4ID0gXCIje3Z2YXJUZXh0fS5sZW5ndGggLSAxXCJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgaXZhciA9IG8uc2NvcGUuZnJlZVZhcmlhYmxlICdpJywgc2luZ2xlOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWwgPSBuZXcgTGl0ZXJhbCBcIiN7aXZhcn0gPSAje3Z2YXJUZXh0fS5sZW5ndGggLSAje3Jlc3R9XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4cGFuZGVkSWR4ID0gXCIje2l2YXJ9KytcIlxuICAgICAgICAgICAgICAgICAgICAgICAgYXNzaWducy5wdXNoIHZhbC5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfTElTVFxuICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaWYgb2JqIGluc3RhbmNlb2YgU3BsYXQgb3Igb2JqIGluc3RhbmNlb2YgRXhwYW5zaW9uXG4gICAgICAgICAgICAgICAgICAgIG9iai5lcnJvciBcIm11bHRpcGxlIHNwbGF0cy9leHBhbnNpb25zIGFyZSBkaXNhbGxvd2VkIGluIGFuIGFzc2lnbm1lbnRcIlxuICAgICAgICAgICAgICAgIGRlZmF1bHRWYWx1ZSA9IG51bGxcbiAgICAgICAgICAgICAgICBpZiBvYmogaW5zdGFuY2VvZiBBc3NpZ24gYW5kIG9iai5jb250ZXh0IGlzICdvYmplY3QnICMgQSByZWd1bGFyIG9iamVjdCBwYXR0ZXJuLW1hdGNoLlxuICAgICAgICAgICAgICAgICAgICB7dmFyaWFibGU6IHtiYXNlOiBpZHh9LCB2YWx1ZTogb2JqfSA9IG9ialxuICAgICAgICAgICAgICAgICAgICBpZiBvYmogaW5zdGFuY2VvZiBBc3NpZ25cbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRWYWx1ZSA9IG9iai52YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqID0gb2JqLnZhcmlhYmxlXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBpZiBvYmogaW5zdGFuY2VvZiBBc3NpZ25cbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRWYWx1ZSA9IG9iai52YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqID0gb2JqLnZhcmlhYmxlXG4gICAgICAgICAgICAgICAgICAgIGlkeCA9IGlmIGlzT2JqZWN0ICMgQSBzaG9ydGhhbmQgYHthLCBiLCBAY30gPSB2YWxgIHBhdHRlcm4tbWF0Y2guXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBvYmoudGhpcyBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmoucHJvcGVydGllc1swXS5uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IFByb3BlcnR5TmFtZSBvYmoudW53cmFwKCkudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgZWxzZSAjIEEgcmVndWxhciBhcnJheSBwYXR0ZXJuLW1hdGNoLlxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IExpdGVyYWwgZXhwYW5kZWRJZHggb3IgaWR4XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBuYW1lID0gb2JqLnVud3JhcCgpLnZhbHVlXG4gICAgICAgICAgICAgICAgYWNjID0gaWR4LnVud3JhcCgpIGluc3RhbmNlb2YgUHJvcGVydHlOYW1lXG4gICAgICAgICAgICAgICAgdmFsID0gbmV3IFZhbHVlIG5ldyBMaXRlcmFsKHZ2YXJUZXh0KSwgW25ldyAoaWYgYWNjIHRoZW4gQWNjZXNzIGVsc2UgSW5kZXgpIGlkeF1cbiAgICAgICAgICAgICAgICB2YWwgPSBuZXcgT3AgJz8nLCB2YWwsIGRlZmF1bHRWYWx1ZSBpZiBkZWZhdWx0VmFsdWVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIG5hbWU/XG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IGlzVW5hc3NpZ25hYmxlIG5hbWVcbiAgICAgICAgICAgICAgICBvYmouZXJyb3IgbWVzc2FnZSBpZiBtZXNzYWdlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGFzc2lnbnMucHVzaCBuZXcgQXNzaWduKG9iaiwgdmFsLCBudWxsLCBwYXJhbTogQHBhcmFtLCBzdWJwYXR0ZXJuOiB5ZXMpLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9MSVNUXG4gICAgICAgICAgICBcbiAgICAgICAgYXNzaWducy5wdXNoIHZ2YXIgdW5sZXNzIHRvcCBvciBAc3VicGF0dGVyblxuICAgICAgICBmcmFnbWVudHMgPSBAam9pbkZyYWdtZW50QXJyYXlzIGFzc2lnbnMsICcsICdcbiAgICAgICAgaWYgby5sZXZlbCA8IExFVkVMX0xJU1QgdGhlbiBmcmFnbWVudHMgZWxzZSBAd3JhcEluQnJhY2VzIGZyYWdtZW50c1xuXG4gICAgIyBXaGVuIGNvbXBpbGluZyBhIGNvbmRpdGlvbmFsIGFzc2lnbm1lbnQsIHRha2UgY2FyZSB0byBlbnN1cmUgdGhhdCB0aGVcbiAgICAjIG9wZXJhbmRzIGFyZSBvbmx5IGV2YWx1YXRlZCBvbmNlLCBldmVuIHRob3VnaCB3ZSBoYXZlIHRvIHJlZmVyZW5jZSB0aGVtIG1vcmUgdGhhbiBvbmNlLlxuICAgIFxuICAgIGNvbXBpbGVDb25kaXRpb25hbDogKG8pIC0+XG4gICAgICAgIFxuICAgICAgICBbbGVmdCwgcmlnaHRdID0gQHZhcmlhYmxlLmNhY2hlUmVmZXJlbmNlIG9cbiAgICAgICAgIyBEaXNhbGxvdyBjb25kaXRpb25hbCBhc3NpZ25tZW50IG9mIHVuZGVmaW5lZCB2YXJpYWJsZXMuXG4gICAgICAgIGlmIG5vdCBsZWZ0LnByb3BlcnRpZXMubGVuZ3RoIGFuZCBsZWZ0LmJhc2UgaW5zdGFuY2VvZiBMaXRlcmFsIGFuZFxuICAgICAgICAgICAgICAgICAgICAgbGVmdC5iYXNlIG5vdCBpbnN0YW5jZW9mIFRoaXNMaXRlcmFsIGFuZCBub3Qgby5zY29wZS5jaGVjayBsZWZ0LmJhc2UudmFsdWVcbiAgICAgICAgICAgIEB2YXJpYWJsZS5lcnJvciBcInRoZSB2YXJpYWJsZSBcXFwiI3tsZWZ0LmJhc2UudmFsdWV9XFxcIiBjYW4ndCBiZSBhc3NpZ25lZCB3aXRoICN7QGNvbnRleHR9IGJlY2F1c2UgaXQgaGFzIG5vdCBiZWVuIGRlY2xhcmVkIGJlZm9yZVwiXG4gICAgICAgIGlmIFwiP1wiIGluIEBjb250ZXh0XG4gICAgICAgICAgICBvLmlzRXhpc3RlbnRpYWxFcXVhbHMgPSB0cnVlXG4gICAgICAgICAgICBuZXcgSWYobmV3IEV4aXN0ZW5jZShsZWZ0KSwgcmlnaHQsIHR5cGU6ICdpZicpLmFkZEVsc2UobmV3IEFzc2lnbihyaWdodCwgQHZhbHVlLCAnPScpKS5jb21waWxlVG9GcmFnbWVudHMgb1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBmcmFnbWVudHMgPSBuZXcgT3AoQGNvbnRleHRbLi4uLTFdLCBsZWZ0LCBuZXcgQXNzaWduKHJpZ2h0LCBAdmFsdWUsICc9JykpLmNvbXBpbGVUb0ZyYWdtZW50cyBvXG4gICAgICAgICAgICBpZiBvLmxldmVsIDw9IExFVkVMX0xJU1QgdGhlbiBmcmFnbWVudHMgZWxzZSBAd3JhcEluQnJhY2VzIGZyYWdtZW50c1xuXG4gICAgIyBDb252ZXJ0IHNwZWNpYWwgbWF0aCBhc3NpZ25tZW50IG9wZXJhdG9ycyBsaWtlIGBhICoqPSBiYCB0byB0aGUgZXF1aXZhbGVudFxuICAgICMgZXh0ZW5kZWQgZm9ybSBgYSA9IGEgKiogYmAgYW5kIHRoZW4gY29tcGlsZXMgdGhhdC5cbiAgICBcbiAgICBjb21waWxlU3BlY2lhbE1hdGg6IChvKSAtPlxuICAgICAgICBcbiAgICAgICAgW2xlZnQsIHJpZ2h0XSA9IEB2YXJpYWJsZS5jYWNoZVJlZmVyZW5jZSBvXG4gICAgICAgIG5ldyBBc3NpZ24obGVmdCwgbmV3IE9wKEBjb250ZXh0Wy4uLi0xXSwgcmlnaHQsIEB2YWx1ZSkpLmNvbXBpbGVUb0ZyYWdtZW50cyBvXG5cbiAgICAjIENvbXBpbGUgdGhlIGFzc2lnbm1lbnQgZnJvbSBhbiBhcnJheSBzcGxpY2UgbGl0ZXJhbCwgdXNpbmcgSmF2YVNjcmlwdCdzIGBBcnJheSNzcGxpY2VgIG1ldGhvZC5cbiAgICBcbiAgICBjb21waWxlU3BsaWNlOiAobykgLT5cbiAgICAgICAgXG4gICAgICAgIHtyYW5nZToge2Zyb20sIHRvLCBleGNsdXNpdmV9fSA9IEB2YXJpYWJsZS5wcm9wZXJ0aWVzLnBvcCgpXG4gICAgICAgIG5hbWUgPSBAdmFyaWFibGUuY29tcGlsZSBvXG4gICAgICAgIGlmIGZyb21cbiAgICAgICAgICAgIFtmcm9tRGVjbCwgZnJvbVJlZl0gPSBAY2FjaGVUb0NvZGVGcmFnbWVudHMgZnJvbS5jYWNoZSBvLCBMRVZFTF9PUFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBmcm9tRGVjbCA9IGZyb21SZWYgPSAnMCdcbiAgICAgICAgaWYgdG9cbiAgICAgICAgICAgIGlmIGZyb20/LmlzTnVtYmVyKCkgYW5kIHRvLmlzTnVtYmVyKClcbiAgICAgICAgICAgICAgICB0byA9IHRvLmNvbXBpbGUobykgLSBmcm9tUmVmXG4gICAgICAgICAgICAgICAgdG8gKz0gMSB1bmxlc3MgZXhjbHVzaXZlXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdG8gPSB0by5jb21waWxlKG8sIExFVkVMX0FDQ0VTUykgKyAnIC0gJyArIGZyb21SZWZcbiAgICAgICAgICAgICAgICB0byArPSAnICsgMScgdW5sZXNzIGV4Y2x1c2l2ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0byA9IFwiOWU5XCJcbiAgICAgICAgW3ZhbERlZiwgdmFsUmVmXSA9IEB2YWx1ZS5jYWNoZSBvLCBMRVZFTF9MSVNUXG4gICAgICAgIGFuc3dlciA9IFtdLmNvbmNhdCBAbWFrZUNvZGUoXCJbXS5zcGxpY2UuYXBwbHkoI3tuYW1lfSwgWyN7ZnJvbURlY2x9LCAje3RvfV0uY29uY2F0KFwiKSwgdmFsRGVmLCBAbWFrZUNvZGUoXCIpKSwgXCIpLCB2YWxSZWZcbiAgICAgICAgaWYgby5sZXZlbCA+IExFVkVMX1RPUCB0aGVuIEB3cmFwSW5CcmFjZXMgYW5zd2VyIGVsc2UgYW5zd2VyXG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIFxuXG4jIEEgZnVuY3Rpb24gZGVmaW5pdGlvbi4gVGhpcyBpcyB0aGUgb25seSBub2RlIHRoYXQgY3JlYXRlcyBhIG5ldyBTY29wZS5cbiMgV2hlbiBmb3IgdGhlIHB1cnBvc2VzIG9mIHdhbGtpbmcgdGhlIGNvbnRlbnRzIG9mIGEgZnVuY3Rpb24gYm9keSwgdGhlIENvZGUgaGFzIG5vICpjaGlsZHJlbiogLS0gdGhleSdyZSB3aXRoaW4gdGhlIGlubmVyIHNjb3BlLlxuXG5leHBvcnRzLkNvZGUgPSBjbGFzcyBDb2RlIGV4dGVuZHMgQmFzZVxuICAgIFxuICAgIEA6IChwYXJhbXMsIGJvZHksIHRhZykgLT5cbiAgICAgICAgQHBhcmFtcyA9IHBhcmFtcyBvciBbXVxuICAgICAgICBAYm9keSAgID0gYm9keSBvciBuZXcgQmxvY2tcbiAgICAgICAgQGJvdW5kICA9IHRhZyBpcyAnYm91bmRmdW5jJ1xuICAgICAgICBAaXNHZW5lcmF0b3IgPSAhIUBib2R5LmNvbnRhaW5zIChub2RlKSAtPlxuICAgICAgICAgICAgKG5vZGUgaW5zdGFuY2VvZiBPcCBhbmQgbm9kZS5pc1lpZWxkKCkpIG9yIG5vZGUgaW5zdGFuY2VvZiBZaWVsZFJldHVyblxuXG4gICAgY2hpbGRyZW46IFsncGFyYW1zJywgJ2JvZHknXVxuXG4gICAgaXNTdGF0ZW1lbnQ6IC0+ICEhQGN0b3JcblxuICAgIGp1bXBzOiBOT1xuXG4gICAgbWFrZVNjb3BlOiAocGFyZW50U2NvcGUpIC0+IG5ldyBTY29wZSBwYXJlbnRTY29wZSwgQGJvZHksIHRoaXNcblxuICAgICMgQ29tcGlsYXRpb24gY3JlYXRlcyBhIG5ldyBzY29wZSB1bmxlc3MgZXhwbGljaXRseSBhc2tlZCB0byBzaGFyZSB3aXRoIHRoZSBvdXRlciBzY29wZS4gXG4gICAgIyBIYW5kbGVzIHNwbGF0IHBhcmFtZXRlcnMgaW4gdGhlIHBhcmFtZXRlciBsaXN0IGJ5IHBlZWtpbmcgYXQgdGhlIEphdmFTY3JpcHQgYGFyZ3VtZW50c2Agb2JqZWN0LiBcbiAgICAjIElmIHRoZSBmdW5jdGlvbiBpcyBib3VuZCB3aXRoIHRoZSBgPT5gIGFycm93LCBnZW5lcmF0ZXMgYSB3cmFwcGVyIHRoYXQgc2F2ZXMgdGhlIGN1cnJlbnQgdmFsdWUgb2YgYHRoaXNgIHRocm91Z2ggYSBjbG9zdXJlLlxuICAgIFxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cblxuICAgICAgICBpZiBAYm91bmQgYW5kIG8uc2NvcGUubWV0aG9kPy5ib3VuZFxuICAgICAgICAgICAgQGNvbnRleHQgPSBvLnNjb3BlLm1ldGhvZC5jb250ZXh0XG5cbiAgICAgICAgaWYgQGJvdW5kIGFuZCBub3QgQGNvbnRleHQgIyBIYW5kbGUgYm91bmQgZnVuY3Rpb25zIGVhcmx5LlxuICAgICAgICAgICAgQGNvbnRleHQgPSAnX3RoaXMnXG4gICAgICAgICAgICB3cmFwcGVyID0gbmV3IENvZGUgW25ldyBQYXJhbSBuZXcgSWRlbnRpZmllckxpdGVyYWwgQGNvbnRleHRdLCBuZXcgQmxvY2sgW3RoaXNdXG4gICAgICAgICAgICBib3VuZGZ1bmMgPSBuZXcgQ2FsbCh3cmFwcGVyLCBbbmV3IFRoaXNMaXRlcmFsXSlcbiAgICAgICAgICAgIGJvdW5kZnVuYy51cGRhdGVMb2NhdGlvbkRhdGFJZk1pc3NpbmcgQGxvY2F0aW9uRGF0YVxuICAgICAgICAgICAgcmV0dXJuIGJvdW5kZnVuYy5jb21waWxlTm9kZShvKVxuXG4gICAgICAgIG8uc2NvcGUgICAgICAgICA9IGRlbChvLCAnY2xhc3NTY29wZScpIG9yIEBtYWtlU2NvcGUgby5zY29wZVxuICAgICAgICBvLnNjb3BlLnNoYXJlZCAgPSBkZWwobywgJ3NoYXJlZFNjb3BlJylcbiAgICAgICAgby5pbmRlbnQgICAgICAgKz0gVEFCXG4gICAgICAgIGRlbGV0ZSBvLmJhcmVcbiAgICAgICAgZGVsZXRlIG8uaXNFeGlzdGVudGlhbEVxdWFsc1xuICAgICAgICBwYXJhbXMgPSBbXVxuICAgICAgICBleHBycyAgPSBbXVxuICAgICAgICBmb3IgcGFyYW0gaW4gQHBhcmFtcyB3aGVuIHBhcmFtIG5vdCBpbnN0YW5jZW9mIEV4cGFuc2lvblxuICAgICAgICAgICAgby5zY29wZS5wYXJhbWV0ZXIgcGFyYW0uYXNSZWZlcmVuY2Ugb1xuICAgICAgICBmb3IgcGFyYW0gaW4gQHBhcmFtcyB3aGVuIHBhcmFtLnNwbGF0IG9yIHBhcmFtIGluc3RhbmNlb2YgRXhwYW5zaW9uXG4gICAgICAgICAgICBmb3IgcCBpbiBAcGFyYW1zIHdoZW4gcCBub3QgaW5zdGFuY2VvZiBFeHBhbnNpb24gYW5kIHAubmFtZS52YWx1ZVxuICAgICAgICAgICAgICAgIG8uc2NvcGUuYWRkIHAubmFtZS52YWx1ZSwgJ3ZhcicsIHllc1xuICAgICAgICAgICAgc3BsYXRzID0gbmV3IEFzc2lnbiBuZXcgVmFsdWUobmV3IEFycihwLmFzUmVmZXJlbmNlIG8gZm9yIHAgaW4gQHBhcmFtcykpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBWYWx1ZSBuZXcgSWRlbnRpZmllckxpdGVyYWwgJ2FyZ3VtZW50cydcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIGZvciBwYXJhbSBpbiBAcGFyYW1zXG4gICAgICAgICAgICBpZiBwYXJhbS5pc0NvbXBsZXgoKVxuICAgICAgICAgICAgICAgIHZhbCA9IHJlZiA9IHBhcmFtLmFzUmVmZXJlbmNlIG9cbiAgICAgICAgICAgICAgICB2YWwgPSBuZXcgT3AgJz8nLCByZWYsIHBhcmFtLnZhbHVlIGlmIHBhcmFtLnZhbHVlXG4gICAgICAgICAgICAgICAgZXhwcnMucHVzaCBuZXcgQXNzaWduIG5ldyBWYWx1ZShwYXJhbS5uYW1lKSwgdmFsLCAnPScsIHBhcmFtOiB5ZXNcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZWYgPSBwYXJhbVxuICAgICAgICAgICAgICAgIGlmIHBhcmFtLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgIGxpdCA9IG5ldyBMaXRlcmFsIHJlZi5uYW1lLnZhbHVlICsgJyA9PSBudWxsJ1xuICAgICAgICAgICAgICAgICAgICB2YWwgPSBuZXcgQXNzaWduIG5ldyBWYWx1ZShwYXJhbS5uYW1lKSwgcGFyYW0udmFsdWUsICc9J1xuICAgICAgICAgICAgICAgICAgICBleHBycy5wdXNoIG5ldyBJZiBsaXQsIHZhbFxuICAgICAgICAgICAgcGFyYW1zLnB1c2ggcmVmIHVubGVzcyBzcGxhdHNcbiAgICAgICAgd2FzRW1wdHkgPSBAYm9keS5pc0VtcHR5KClcbiAgICAgICAgZXhwcnMudW5zaGlmdCBzcGxhdHMgaWYgc3BsYXRzXG4gICAgICAgIEBib2R5LmV4cHJlc3Npb25zLnVuc2hpZnQgZXhwcnMuLi4gaWYgZXhwcnMubGVuZ3RoXG4gICAgICAgIGZvciBwLCBpIGluIHBhcmFtc1xuICAgICAgICAgICAgcGFyYW1zW2ldID0gcC5jb21waWxlVG9GcmFnbWVudHMgb1xuICAgICAgICAgICAgby5zY29wZS5wYXJhbWV0ZXIgQGZyYWdtZW50c1RvVGV4dCBwYXJhbXNbaV1cbiAgICAgICAgdW5pcXMgPSBbXVxuICAgICAgICBcbiAgICAgICAgQGVhY2hQYXJhbU5hbWUgKG5hbWUsIG5vZGUpIC0+XG4gICAgICAgICAgICBub2RlLmVycm9yIFwibXVsdGlwbGUgcGFyYW1ldGVycyBuYW1lZCAje25hbWV9XCIgaWYgbmFtZSBpbiB1bmlxc1xuICAgICAgICAgICAgdW5pcXMucHVzaCBuYW1lXG4gICAgICAgIFxuICAgICAgICBAYm9keS5tYWtlUmV0dXJuKCkgdW5sZXNzIHdhc0VtcHR5IG9yIEBub1JldHVyblxuICAgICAgICBjb2RlID0gJ2Z1bmN0aW9uJ1xuICAgICAgICBjb2RlICs9ICcqJyBpZiBAaXNHZW5lcmF0b3JcbiAgICAgICAgY29kZSArPSAnICcgKyBAbmFtZSBpZiBAY3RvclxuICAgICAgICBjb2RlICs9ICcoJ1xuICAgICAgICBcbiAgICAgICAgYW5zd2VyID0gW0BtYWtlQ29kZShjb2RlKV1cbiAgICAgICAgXG4gICAgICAgIGZvciBwLCBpIGluIHBhcmFtc1xuICAgICAgICAgICAgaWYgaSB0aGVuIGFuc3dlci5wdXNoIEBtYWtlQ29kZSBcIiwgXCJcbiAgICAgICAgICAgIGFuc3dlci5wdXNoIHAuLi5cbiAgICAgICAgYW5zd2VyLnB1c2ggQG1ha2VDb2RlICcpIHsnXG4gICAgICAgIGFuc3dlciA9IGFuc3dlci5jb25jYXQoQG1ha2VDb2RlKFwiXFxuXCIpLCBAYm9keS5jb21waWxlV2l0aERlY2xhcmF0aW9ucyhvKSwgQG1ha2VDb2RlKFwiXFxuI3tAdGFifVwiKSkgdW5sZXNzIEBib2R5LmlzRW1wdHkoKVxuICAgICAgICBhbnN3ZXIucHVzaCBAbWFrZUNvZGUgJ30nXG5cbiAgICAgICAgcmV0dXJuIFtAbWFrZUNvZGUoQHRhYiksIGFuc3dlci4uLl0gaWYgQGN0b3JcbiAgICAgICAgaWYgQGZyb250IG9yIChvLmxldmVsID49IExFVkVMX0FDQ0VTUykgdGhlbiBAd3JhcEluQnJhY2VzIGFuc3dlciBlbHNlIGFuc3dlclxuXG4gICAgZWFjaFBhcmFtTmFtZTogKGl0ZXJhdG9yKSAtPlxuICAgICAgICBwYXJhbS5lYWNoTmFtZSBpdGVyYXRvciBmb3IgcGFyYW0gaW4gQHBhcmFtc1xuXG4gICAgIyBTaG9ydC1jaXJjdWl0IGB0cmF2ZXJzZUNoaWxkcmVuYCBtZXRob2QgdG8gcHJldmVudCBpdCBmcm9tIGNyb3NzaW5nIHNjb3BlIGJvdW5kYXJpZXMgdW5sZXNzIGBjcm9zc1Njb3BlYCBpcyBgdHJ1ZWAuXG4gICAgXG4gICAgdHJhdmVyc2VDaGlsZHJlbjogKGNyb3NzU2NvcGUsIGZ1bmMpIC0+XG4gICAgICAgIFxuICAgICAgICBzdXBlcihjcm9zc1Njb3BlLCBmdW5jKSBpZiBjcm9zc1Njb3BlXG5cbiMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMCAgICAgMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICBcbiMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG5cbiMgQSBwYXJhbWV0ZXIgaW4gYSBmdW5jdGlvbiBkZWZpbml0aW9uLiBCZXlvbmQgYSB0eXBpY2FsIEphdmFTY3JpcHQgcGFyYW1ldGVyLFxuIyB0aGVzZSBwYXJhbWV0ZXJzIGNhbiBhbHNvIGF0dGFjaCB0aGVtc2VsdmVzIHRvIHRoZSBjb250ZXh0IG9mIHRoZSBmdW5jdGlvbixcbiMgYXMgd2VsbCBhcyBiZSBhIHNwbGF0LCBnYXRoZXJpbmcgdXAgYSBncm91cCBvZiBwYXJhbWV0ZXJzIGludG8gYW4gYXJyYXkuXG5cbmV4cG9ydHMuUGFyYW0gPSBjbGFzcyBQYXJhbSBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBAOiAoQG5hbWUsIEB2YWx1ZSwgQHNwbGF0KSAtPlxuICAgICAgICBtZXNzYWdlID0gaXNVbmFzc2lnbmFibGUgQG5hbWUudW53cmFwQWxsKCkudmFsdWVcbiAgICAgICAgQG5hbWUuZXJyb3IgbWVzc2FnZSBpZiBtZXNzYWdlXG4gICAgICAgICMgdGhlIGZvbGxvd2luZyBlcnJvciBkb2Vucyd0IHRocm93IGFueW1vcmUgaW4ga29mZmVlIChjb25maWcgcGFyYW1ldGVycylcbiAgICAgICAgIyBpZiBAbmFtZSBpbnN0YW5jZW9mIE9iaiBhbmQgQG5hbWUuZ2VuZXJhdGVkXG4gICAgICAgICAgICAjIHRva2VuID0gQG5hbWUub2JqZWN0c1swXS5vcGVyYXRvclRva2VuXG4gICAgICAgICAgICAjIHRva2VuLmVycm9yIFwidW5leHBlY3RlZCAje3Rva2VuLnZhbHVlfVwiXG5cbiAgICBjaGlsZHJlbjogWyduYW1lJywgJ3ZhbHVlJ11cblxuICAgIGNvbXBpbGVUb0ZyYWdtZW50czogKG8pIC0+XG4gICAgICAgIFxuICAgICAgICBAbmFtZS5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfTElTVFxuXG4gICAgYXNSZWZlcmVuY2U6IChvKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIEByZWZlcmVuY2UgaWYgQHJlZmVyZW5jZVxuICAgICAgICBub2RlID0gQG5hbWVcbiAgICAgICAgaWYgbm9kZS50aGlzXG4gICAgICAgICAgICBuYW1lID0gbm9kZS5wcm9wZXJ0aWVzWzBdLm5hbWUudmFsdWVcbiAgICAgICAgICAgIG5hbWUgPSBcIl8je25hbWV9XCIgaWYgbmFtZSBpbiBKU19GT1JCSURERU5cbiAgICAgICAgICAgIG5vZGUgPSBuZXcgSWRlbnRpZmllckxpdGVyYWwgby5zY29wZS5mcmVlVmFyaWFibGUgbmFtZVxuICAgICAgICBlbHNlIGlmIG5vZGUuaXNDb21wbGV4KClcbiAgICAgICAgICAgIG5vZGUgPSBuZXcgSWRlbnRpZmllckxpdGVyYWwgby5zY29wZS5mcmVlVmFyaWFibGUgJ2FyZydcbiAgICAgICAgbm9kZSA9IG5ldyBWYWx1ZSBub2RlXG4gICAgICAgIG5vZGUgPSBuZXcgU3BsYXQgbm9kZSBpZiBAc3BsYXRcbiAgICAgICAgbm9kZS51cGRhdGVMb2NhdGlvbkRhdGFJZk1pc3NpbmcgQGxvY2F0aW9uRGF0YVxuICAgICAgICBAcmVmZXJlbmNlID0gbm9kZVxuXG4gICAgaXNDb21wbGV4OiAtPlxuICAgICAgICBcbiAgICAgICAgQG5hbWUuaXNDb21wbGV4KClcblxuICAgICMgSXRlcmF0ZXMgdGhlIG5hbWUgb3IgbmFtZXMgb2YgYSBgUGFyYW1gLlxuICAgICMgSW4gYSBzZW5zZSwgYSBkZXN0cnVjdHVyZWQgcGFyYW1ldGVyIHJlcHJlc2VudHMgbXVsdGlwbGUgSlMgcGFyYW1ldGVycy4gVGhpc1xuICAgICMgbWV0aG9kIGFsbG93cyB0byBpdGVyYXRlIHRoZW0gYWxsLlxuICAgICMgVGhlIGBpdGVyYXRvcmAgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgYXMgYGl0ZXJhdG9yKG5hbWUsIG5vZGUpYCB3aGVyZVxuICAgICMgYG5hbWVgIGlzIHRoZSBuYW1lIG9mIHRoZSBwYXJhbWV0ZXIgYW5kIGBub2RlYCBpcyB0aGUgQVNUIG5vZGUgY29ycmVzcG9uZGluZyB0byB0aGF0IG5hbWUuXG4gICAgXG4gICAgZWFjaE5hbWU6IChpdGVyYXRvciwgbmFtZSA9IEBuYW1lKS0+XG4gICAgICAgIFxuICAgICAgICBhdFBhcmFtID0gKG9iaikgLT4gXG4gICAgICAgICAgICBpdGVyYXRvciBcIkAje29iai5wcm9wZXJ0aWVzWzBdLm5hbWUudmFsdWV9XCIsIG9ialxuICAgICAgICBcbiAgICAgICAgaWYgbmFtZSBpbnN0YW5jZW9mIElkZW50aWZpZXJMaXRlcmFsXG4gICAgICAgICAgICByZXR1cm4gaWYgbmFtZSBpbnN0YW5jZW9mIE51bGxMaXRlcmFsXG4gICAgICAgICAgICByZXR1cm4gaXRlcmF0b3IgbmFtZS52YWx1ZSwgbmFtZSAjIHNpbXBsZSBsaXRlcmFscyBgZm9vYCwgYF9gLCBldGMuXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gYXRQYXJhbSBuYW1lIGlmIG5hbWUgaW5zdGFuY2VvZiBWYWx1ZSAjIGF0LXBhcmFtcyBgQGZvb2BcbiAgICAgICAgXG4gICAgICAgIGZvciBvYmogaW4gbmFtZS5vYmplY3RzID8gW11cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgb2JqIGluc3RhbmNlb2YgQXNzaWduIGFuZCBub3Qgb2JqLmNvbnRleHQ/ICMgZGVzdHJ1Y3R1cmVkIHBhcmFtZXRlciB3aXRoIGRlZmF1bHQgdmFsdWVcbiAgICAgICAgICAgICAgICBvYmogPSBvYmoudmFyaWFibGVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgb2JqIGluc3RhbmNlb2YgQXNzaWduICMgYXNzaWdubWVudHMgd2l0aGluIGRlc3RydWN0dXJlZCBwYXJhbWV0ZXJzIGB7Zm9vOmJhcn1gXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgb2JqLnZhbHVlIGluc3RhbmNlb2YgQXNzaWduICMgLi4uIHBvc3NpYmx5IHdpdGggYSBkZWZhdWx0IHZhbHVlXG4gICAgICAgICAgICAgICAgICAgIG9iaiA9IG9iai52YWx1ZVxuICAgICAgICAgICAgICAgIEBlYWNoTmFtZSBpdGVyYXRvciwgb2JqLnZhbHVlLnVud3JhcCgpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGVsc2UgaWYgb2JqIGluc3RhbmNlb2YgU3BsYXQgIyBzcGxhdHMgd2l0aGluIGRlc3RydWN0dXJlZCBwYXJhbWV0ZXJzIGBbeHMuLi5dYFxuICAgICAgICAgICAgICAgIG5vZGUgPSBvYmoubmFtZS51bndyYXAoKVxuICAgICAgICAgICAgICAgIGl0ZXJhdG9yIG5vZGUudmFsdWUsIG5vZGVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGVsc2UgaWYgb2JqIGluc3RhbmNlb2YgVmFsdWVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBvYmouaXNBcnJheSgpIG9yIG9iai5pc09iamVjdCgpICMgZGVzdHJ1Y3R1cmVkIHBhcmFtZXRlcnMgd2l0aGluIGRlc3RydWN0dXJlZCBwYXJhbWV0ZXJzIGBbe2F9XWBcbiAgICAgICAgICAgICAgICAgICAgQGVhY2hOYW1lIGl0ZXJhdG9yLCBvYmouYmFzZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgb2JqLnRoaXMgIyBhdC1wYXJhbXMgd2l0aGluIGRlc3RydWN0dXJlZCBwYXJhbWV0ZXJzIGB7QGZvb31gXG4gICAgICAgICAgICAgICAgICAgIGF0UGFyYW0gb2JqXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBpdGVyYXRvciBvYmouYmFzZS52YWx1ZSwgb2JqLmJhc2UgIyBzaW1wbGUgZGVzdHJ1Y3R1cmVkIHBhcmFtZXRlcnMge2Zvb31cbiAgICAgICAgICAgIGVsc2UgaWYgb2JqIG5vdCBpbnN0YW5jZW9mIEV4cGFuc2lvblxuICAgICAgICAgICAgICAgIG9iai5lcnJvciBcImlsbGVnYWwgcGFyYW1ldGVyICN7b2JqLmNvbXBpbGUoKX1cIlxuICAgICAgICAgICAgICAgIFxuICAgICAgICByZXR1cm5cblxuIyAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiMgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAwICAgICAwMDAgICAgIFxuIyAgICAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4jIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcblxuIyBBIHNwbGF0LCBlaXRoZXIgYXMgYSBwYXJhbWV0ZXIgdG8gYSBmdW5jdGlvbiwgYW4gYXJndW1lbnQgdG8gYSBjYWxsLCBvciBhcyBwYXJ0IG9mIGEgZGVzdHJ1Y3R1cmluZyBhc3NpZ25tZW50LlxuXG5leHBvcnRzLlNwbGF0ID0gY2xhc3MgU3BsYXQgZXh0ZW5kcyBCYXNlXG5cbiAgICBjaGlsZHJlbjogWyduYW1lJ11cblxuICAgIGlzQXNzaWduYWJsZTogWUVTXG5cbiAgICBAOiAobmFtZSkgLT5cbiAgICAgICAgQG5hbWUgPSBpZiBuYW1lLmNvbXBpbGUgdGhlbiBuYW1lIGVsc2UgbmV3IExpdGVyYWwgbmFtZVxuXG4gICAgYXNzaWduczogKG5hbWUpIC0+XG4gICAgICAgIEBuYW1lLmFzc2lnbnMgbmFtZVxuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBAbmFtZS5jb21waWxlVG9GcmFnbWVudHMgb1xuXG4gICAgdW53cmFwOiAtPiBAbmFtZVxuXG4gICAgIyBVdGlsaXR5IGZ1bmN0aW9uIHRoYXQgY29udmVydHMgYW4gYXJiaXRyYXJ5IG51bWJlciBvZiBlbGVtZW50cywgbWl4ZWQgd2l0aCBzcGxhdHMsIHRvIGEgcHJvcGVyIGFycmF5LlxuICAgIFxuICAgIEBjb21waWxlU3BsYXR0ZWRBcnJheTogKG8sIGxpc3QsIGFwcGx5KSAtPlxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSAtMVxuICAgICAgICBjb250aW51ZSB3aGlsZSAobm9kZSA9IGxpc3RbKytpbmRleF0pIGFuZCBub2RlIG5vdCBpbnN0YW5jZW9mIFNwbGF0XG4gICAgICAgIHJldHVybiBbXSBpZiBpbmRleCA+PSBsaXN0Lmxlbmd0aFxuICAgICAgICBpZiBsaXN0Lmxlbmd0aCBpcyAxXG4gICAgICAgICAgICBub2RlID0gbGlzdFswXVxuICAgICAgICAgICAgZnJhZ21lbnRzID0gbm9kZS5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfTElTVFxuICAgICAgICAgICAgcmV0dXJuIGZyYWdtZW50cyBpZiBhcHBseVxuICAgICAgICAgICAgcmV0dXJuIFtdLmNvbmNhdCBub2RlLm1ha2VDb2RlKFwiI3sgdXRpbGl0eSAnc2xpY2UnLCBvIH0uY2FsbChcIiksIGZyYWdtZW50cywgbm9kZS5tYWtlQ29kZShcIilcIilcbiAgICAgICAgYXJncyA9IGxpc3RbaW5kZXguLl1cbiAgICAgICAgZm9yIG5vZGUsIGkgaW4gYXJnc1xuICAgICAgICAgICAgY29tcGlsZWROb2RlID0gbm9kZS5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfTElTVFxuICAgICAgICAgICAgYXJnc1tpXSA9IGlmIG5vZGUgaW5zdGFuY2VvZiBTcGxhdFxuICAgICAgICAgICAgdGhlbiBbXS5jb25jYXQgbm9kZS5tYWtlQ29kZShcIiN7IHV0aWxpdHkgJ3NsaWNlJywgbyB9LmNhbGwoXCIpLCBjb21waWxlZE5vZGUsIG5vZGUubWFrZUNvZGUoXCIpXCIpXG4gICAgICAgICAgICBlbHNlIFtdLmNvbmNhdCBub2RlLm1ha2VDb2RlKFwiW1wiKSwgY29tcGlsZWROb2RlLCBub2RlLm1ha2VDb2RlKFwiXVwiKVxuICAgICAgICBpZiBpbmRleCBpcyAwXG4gICAgICAgICAgICBub2RlID0gbGlzdFswXVxuICAgICAgICAgICAgY29uY2F0UGFydCA9IChub2RlLmpvaW5GcmFnbWVudEFycmF5cyBhcmdzWzEuLl0sICcsICcpXG4gICAgICAgICAgICByZXR1cm4gYXJnc1swXS5jb25jYXQgbm9kZS5tYWtlQ29kZShcIi5jb25jYXQoXCIpLCBjb25jYXRQYXJ0LCBub2RlLm1ha2VDb2RlKFwiKVwiKVxuICAgICAgICBiYXNlID0gKG5vZGUuY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX0xJU1QgZm9yIG5vZGUgaW4gbGlzdFsuLi5pbmRleF0pXG4gICAgICAgIGJhc2UgPSBsaXN0WzBdLmpvaW5GcmFnbWVudEFycmF5cyBiYXNlLCAnLCAnXG4gICAgICAgIGNvbmNhdFBhcnQgPSBsaXN0W2luZGV4XS5qb2luRnJhZ21lbnRBcnJheXMgYXJncywgJywgJ1xuICAgICAgICBbLi4uLCBsYXN0XSA9IGxpc3RcbiAgICAgICAgW10uY29uY2F0IGxpc3RbMF0ubWFrZUNvZGUoXCJbXCIpLCBiYXNlLCBsaXN0W2luZGV4XS5tYWtlQ29kZShcIl0uY29uY2F0KFwiKSwgY29uY2F0UGFydCwgbGFzdC5tYWtlQ29kZShcIilcIilcblxuIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiMgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4jIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcblxuIyBVc2VkIHRvIHNraXAgdmFsdWVzIGluc2lkZSBhbiBhcnJheSBkZXN0cnVjdHVyaW5nIChwYXR0ZXJuIG1hdGNoaW5nKSBvciBwYXJhbWV0ZXIgbGlzdC5cblxuZXhwb3J0cy5FeHBhbnNpb24gPSBjbGFzcyBFeHBhbnNpb24gZXh0ZW5kcyBCYXNlXG5cbiAgICBpc0NvbXBsZXg6IE5PXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIEBlcnJvciAnRXhwYW5zaW9uIG11c3QgYmUgdXNlZCBpbnNpZGUgYSBkZXN0cnVjdHVyaW5nIGFzc2lnbm1lbnQgb3IgcGFyYW1ldGVyIGxpc3QnXG5cbiAgICBhc1JlZmVyZW5jZTogKG8pIC0+XG4gICAgICAgIHRoaXNcblxuICAgIGVhY2hOYW1lOiAoaXRlcmF0b3IpIC0+XG5cbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIFxuIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAwMCAgICAgMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG5cbiMgQSB3aGlsZSBsb29wLCB0aGUgb25seSBzb3J0IG9mIGxvdy1sZXZlbCBsb29wIGV4cG9zZWQgYnkgS29mZmVlLiBGcm9tXG4jIGl0LCBhbGwgb3RoZXIgbG9vcHMgY2FuIGJlIG1hbnVmYWN0dXJlZC4gVXNlZnVsIGluIGNhc2VzIHdoZXJlIHlvdSBuZWVkIG1vcmVcbiMgZmxleGliaWxpdHkgb3IgbW9yZSBzcGVlZCB0aGFuIGEgY29tcHJlaGVuc2lvbiBjYW4gcHJvdmlkZS5cblxuZXhwb3J0cy5XaGlsZSA9IGNsYXNzIFdoaWxlIGV4dGVuZHMgQmFzZVxuICAgIFxuICAgIEA6IChjb25kaXRpb24sIG9wdGlvbnMpIC0+XG4gICAgICAgIEBjb25kaXRpb24gPSBpZiBvcHRpb25zPy5pbnZlcnQgdGhlbiBjb25kaXRpb24uaW52ZXJ0KCkgZWxzZSBjb25kaXRpb25cbiAgICAgICAgQGd1YXJkICAgICAgID0gb3B0aW9ucz8uZ3VhcmRcblxuICAgIGNoaWxkcmVuOiBbJ2NvbmRpdGlvbicsICdndWFyZCcsICdib2R5J11cblxuICAgIGlzU3RhdGVtZW50OiBZRVNcblxuICAgIG1ha2VSZXR1cm46IChyZXMpIC0+XG4gICAgICAgIGlmIHJlc1xuICAgICAgICAgICAgc3VwZXJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHJldHVybnMgPSBub3QgQGp1bXBzIGxvb3A6IHllc1xuICAgICAgICAgICAgdGhpc1xuXG4gICAgYWRkQm9keTogKEBib2R5KSAtPlxuICAgICAgICB0aGlzXG5cbiAgICBqdW1wczogLT5cbiAgICAgICAge2V4cHJlc3Npb25zfSA9IEBib2R5XG4gICAgICAgIHJldHVybiBubyB1bmxlc3MgZXhwcmVzc2lvbnMubGVuZ3RoXG4gICAgICAgIGZvciBub2RlIGluIGV4cHJlc3Npb25zXG4gICAgICAgICAgICByZXR1cm4ganVtcE5vZGUgaWYganVtcE5vZGUgPSBub2RlLmp1bXBzIGxvb3A6IHllc1xuICAgICAgICBub1xuXG4gICAgIyBUaGUgbWFpbiBkaWZmZXJlbmNlIGZyb20gYSBKYXZhU2NyaXB0ICp3aGlsZSogaXMgdGhhdCB0aGUgS29mZmVlXG4gICAgIyAqd2hpbGUqIGNhbiBiZSB1c2VkIGFzIGEgcGFydCBvZiBhIGxhcmdlciBleHByZXNzaW9uIC0tIHdoaWxlIGxvb3BzIG1heVxuICAgICMgcmV0dXJuIGFuIGFycmF5IGNvbnRhaW5pbmcgdGhlIGNvbXB1dGVkIHJlc3VsdCBvZiBlYWNoIGl0ZXJhdGlvbi5cbiAgICBcbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIG8uaW5kZW50ICs9IFRBQlxuICAgICAgICBzZXQgICAgICAgICAgPSAnJ1xuICAgICAgICB7Ym9keX0gICA9IHRoaXNcbiAgICAgICAgaWYgYm9keS5pc0VtcHR5KClcbiAgICAgICAgICAgIGJvZHkgPSBAbWFrZUNvZGUgJydcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgQHJldHVybnNcbiAgICAgICAgICAgICAgICBib2R5Lm1ha2VSZXR1cm4gcnZhciA9IG8uc2NvcGUuZnJlZVZhcmlhYmxlICdyZXN1bHRzJ1xuICAgICAgICAgICAgICAgIHNldCAgPSBcIiN7QHRhYn0je3J2YXJ9ID0gW107XFxuXCJcbiAgICAgICAgICAgIGlmIEBndWFyZFxuICAgICAgICAgICAgICAgIGlmIGJvZHkuZXhwcmVzc2lvbnMubGVuZ3RoID4gMVxuICAgICAgICAgICAgICAgICAgICBib2R5LmV4cHJlc3Npb25zLnVuc2hpZnQgbmV3IElmIChuZXcgUGFyZW5zIEBndWFyZCkuaW52ZXJ0KCksIG5ldyBTdGF0ZW1lbnRMaXRlcmFsIFwiY29udGludWVcIlxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYm9keSA9IEJsb2NrLndyYXAgW25ldyBJZiBAZ3VhcmQsIGJvZHldIGlmIEBndWFyZFxuICAgICAgICAgICAgYm9keSA9IFtdLmNvbmNhdCBAbWFrZUNvZGUoXCJcXG5cIiksIChib2R5LmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9UT1ApLCBAbWFrZUNvZGUoXCJcXG4je0B0YWJ9XCIpXG4gICAgICAgIGFuc3dlciA9IFtdLmNvbmNhdCBAbWFrZUNvZGUoc2V0ICsgQHRhYiArIFwid2hpbGUgKFwiKSwgQGNvbmRpdGlvbi5jb21waWxlVG9GcmFnbWVudHMobywgTEVWRUxfUEFSRU4pLFxuICAgICAgICAgICAgQG1ha2VDb2RlKFwiKSB7XCIpLCBib2R5LCBAbWFrZUNvZGUoXCJ9XCIpXG4gICAgICAgIGlmIEByZXR1cm5zXG4gICAgICAgICAgICBhbnN3ZXIucHVzaCBAbWFrZUNvZGUgXCJcXG4je0B0YWJ9cmV0dXJuICN7cnZhcn07XCJcbiAgICAgICAgYW5zd2VyXG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgIFxuIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgXG5cbiMgU2ltcGxlIEFyaXRobWV0aWMgYW5kIGxvZ2ljYWwgb3BlcmF0aW9ucy4gUGVyZm9ybXMgc29tZSBjb252ZXJzaW9uIGZyb20gaW50byB0aGVpciBKYXZhU2NyaXB0IGVxdWl2YWxlbnRzLlxuXG5leHBvcnRzLk9wID0gY2xhc3MgT3AgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgQDogKG9wLCBmaXJzdCwgc2Vjb25kLCBmbGlwICkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBuZXcgSW4gZmlyc3QsIHNlY29uZCBpZiBvcCBpcyAnaW4nXG4gICAgICAgIFxuICAgICAgICBpZiBvcCBpcyAnZG8nXG4gICAgICAgICAgICByZXR1cm4gQGdlbmVyYXRlRG8gZmlyc3RcbiAgICAgICAgaWYgb3AgaXMgJ25ldydcbiAgICAgICAgICAgIHJldHVybiBmaXJzdC5uZXdJbnN0YW5jZSgpIGlmIGZpcnN0IGluc3RhbmNlb2YgQ2FsbCBhbmQgbm90IGZpcnN0LmRvIGFuZCBub3QgZmlyc3QuaXNOZXdcbiAgICAgICAgICAgIGZpcnN0ID0gbmV3IFBhcmVucyBmaXJzdCAgICAgaWYgZmlyc3QgaW5zdGFuY2VvZiBDb2RlIGFuZCBmaXJzdC5ib3VuZCBvciBmaXJzdC5kb1xuICAgICAgICAgICAgXG4gICAgICAgIEBvcGVyYXRvciA9IENPTlZFUlNJT05TW29wXSBvciBvcFxuICAgICAgICBAZmlyc3QgICAgPSBmaXJzdFxuICAgICAgICBAc2Vjb25kICAgPSBzZWNvbmRcbiAgICAgICAgQGZsaXAgICAgID0gISFmbGlwXG4gICAgICAgIHJldHVybiB0aGlzXG5cbiAgICBDT05WRVJTSU9OUyA9ICMgVGhlIG1hcCBvZiBjb252ZXJzaW9ucyB0byBKYXZhU2NyaXB0IHN5bWJvbHMuXG4gICAgICAgICc9PSc6ICAgICAgICAnPT09J1xuICAgICAgICAnIT0nOiAgICAgICAgJyE9PSdcbiAgICAgICAgJ29mJzogICAgICAgICdpbidcbiAgICAgICAgJ3lpZWxkZnJvbSc6ICd5aWVsZConXG5cbiAgICBJTlZFUlNJT05TID0gIyBUaGUgbWFwIG9mIGludmVydGlibGUgb3BlcmF0b3JzLlxuICAgICAgICAnIT09JzogJz09PSdcbiAgICAgICAgJz09PSc6ICchPT0nXG5cbiAgICBjaGlsZHJlbjogWydmaXJzdCcsICdzZWNvbmQnXVxuXG4gICAgaXNOdW1iZXI6IC0+XG4gICAgICAgIEBpc1VuYXJ5KCkgYW5kIEBvcGVyYXRvciBpbiBbJysnLCAnLSddIGFuZFxuICAgICAgICAgICAgQGZpcnN0IGluc3RhbmNlb2YgVmFsdWUgYW5kIEBmaXJzdC5pc051bWJlcigpXG5cbiAgICBpc1lpZWxkOiAtPlxuICAgICAgICBAb3BlcmF0b3IgaW4gWyd5aWVsZCcsICd5aWVsZConXVxuXG4gICAgaXNVbmFyeTogLT5cbiAgICAgICAgbm90IEBzZWNvbmRcblxuICAgIGlzQ29tcGxleDogLT5cbiAgICAgICAgbm90IEBpc051bWJlcigpXG5cbiAgICAjIEFtIEkgY2FwYWJsZSBvZiBbUHl0aG9uLXN0eWxlIGNvbXBhcmlzb24gY2hhaW5pbmddKGh0dHBzOi8vZG9jcy5weXRob24ub3JnLzMvcmVmZXJlbmNlL2V4cHJlc3Npb25zLmh0bWwjbm90LWluKT9cbiAgICBcbiAgICBpc0NoYWluYWJsZTogLT5cbiAgICAgICAgQG9wZXJhdG9yIGluIFsnPCcsICc+JywgJz49JywgJzw9JywgJz09PScsICchPT0nXVxuXG4gICAgaW52ZXJ0OiAtPlxuICAgICAgICBpZiBAaXNDaGFpbmFibGUoKSBhbmQgQGZpcnN0LmlzQ2hhaW5hYmxlKClcbiAgICAgICAgICAgIGFsbEludmVydGFibGUgPSB5ZXNcbiAgICAgICAgICAgIGN1cnIgPSB0aGlzXG4gICAgICAgICAgICB3aGlsZSBjdXJyIGFuZCBjdXJyLm9wZXJhdG9yXG4gICAgICAgICAgICAgICAgYWxsSW52ZXJ0YWJsZSBhbmQ9IChjdXJyLm9wZXJhdG9yIG9mIElOVkVSU0lPTlMpXG4gICAgICAgICAgICAgICAgY3VyciA9IGN1cnIuZmlyc3RcbiAgICAgICAgICAgIHJldHVybiBuZXcgUGFyZW5zKHRoaXMpLmludmVydCgpIHVubGVzcyBhbGxJbnZlcnRhYmxlXG4gICAgICAgICAgICBjdXJyID0gdGhpc1xuICAgICAgICAgICAgd2hpbGUgY3VyciBhbmQgY3Vyci5vcGVyYXRvclxuICAgICAgICAgICAgICAgIGN1cnIuaW52ZXJ0ID0gIWN1cnIuaW52ZXJ0XG4gICAgICAgICAgICAgICAgY3Vyci5vcGVyYXRvciA9IElOVkVSU0lPTlNbY3Vyci5vcGVyYXRvcl1cbiAgICAgICAgICAgICAgICBjdXJyID0gY3Vyci5maXJzdFxuICAgICAgICAgICAgdGhpc1xuICAgICAgICBlbHNlIGlmIG9wID0gSU5WRVJTSU9OU1tAb3BlcmF0b3JdXG4gICAgICAgICAgICBAb3BlcmF0b3IgPSBvcFxuICAgICAgICAgICAgaWYgQGZpcnN0LnVud3JhcCgpIGluc3RhbmNlb2YgT3BcbiAgICAgICAgICAgICAgICBAZmlyc3QuaW52ZXJ0KClcbiAgICAgICAgICAgIHRoaXNcbiAgICAgICAgZWxzZSBpZiBAc2Vjb25kXG4gICAgICAgICAgICBuZXcgUGFyZW5zKHRoaXMpLmludmVydCgpXG4gICAgICAgIGVsc2UgaWYgQG9wZXJhdG9yIGlzICchJyBhbmQgKGZzdCA9IEBmaXJzdC51bndyYXAoKSkgaW5zdGFuY2VvZiBPcCBhbmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnN0Lm9wZXJhdG9yIGluIFsnIScsICdpbicsICdpbnN0YW5jZW9mJ11cbiAgICAgICAgICAgIGZzdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBuZXcgT3AgJyEnLCB0aGlzXG5cbiAgICB1bmZvbGRTb2FrOiAobykgLT5cbiAgICAgICAgQG9wZXJhdG9yIGluIFsnKysnLCAnLS0nLCAnZGVsZXRlJ10gYW5kIHVuZm9sZFNvYWsgbywgdGhpcywgJ2ZpcnN0J1xuXG4gICAgZ2VuZXJhdGVEbzogKGV4cCkgLT5cbiAgICAgICAgcGFzc2VkUGFyYW1zID0gW11cbiAgICAgICAgZnVuYyA9IGlmIGV4cCBpbnN0YW5jZW9mIEFzc2lnbiBhbmQgKHJlZiA9IGV4cC52YWx1ZS51bndyYXAoKSkgaW5zdGFuY2VvZiBDb2RlXG4gICAgICAgICAgICByZWZcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZXhwXG4gICAgICAgIGZvciBwYXJhbSBpbiBmdW5jLnBhcmFtcyBvciBbXVxuICAgICAgICAgICAgaWYgcGFyYW0udmFsdWVcbiAgICAgICAgICAgICAgICBwYXNzZWRQYXJhbXMucHVzaCBwYXJhbS52YWx1ZVxuICAgICAgICAgICAgICAgIGRlbGV0ZSBwYXJhbS52YWx1ZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHBhc3NlZFBhcmFtcy5wdXNoIHBhcmFtXG4gICAgICAgIGNhbGwgPSBuZXcgQ2FsbCBleHAsIHBhc3NlZFBhcmFtc1xuICAgICAgICBjYWxsLmRvID0geWVzXG4gICAgICAgIGNhbGxcblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgaXNDaGFpbiA9IEBpc0NoYWluYWJsZSgpIGFuZCBAZmlyc3QuaXNDaGFpbmFibGUoKVxuICAgICAgICAjIEluIGNoYWlucywgdGhlcmUncyBubyBuZWVkIHRvIHdyYXAgYmFyZSBvYmogbGl0ZXJhbHMgaW4gcGFyZW5zLFxuICAgICAgICAjIGFzIHRoZSBjaGFpbmVkIGV4cHJlc3Npb24gaXMgd3JhcHBlZC5cbiAgICAgICAgQGZpcnN0LmZyb250ID0gQGZyb250IHVubGVzcyBpc0NoYWluXG4gICAgICAgIGlmIEBvcGVyYXRvciBpcyAnZGVsZXRlJyBhbmQgby5zY29wZS5jaGVjayhAZmlyc3QudW53cmFwQWxsKCkudmFsdWUpXG4gICAgICAgICAgICBAZXJyb3IgJ2RlbGV0ZSBvcGVyYW5kIG1heSBub3QgYmUgYXJndW1lbnQgb3IgdmFyJ1xuICAgICAgICBpZiBAb3BlcmF0b3IgaW4gWyctLScsICcrKyddXG4gICAgICAgICAgICBtZXNzYWdlID0gaXNVbmFzc2lnbmFibGUgQGZpcnN0LnVud3JhcEFsbCgpLnZhbHVlXG4gICAgICAgICAgICBAZmlyc3QuZXJyb3IgbWVzc2FnZSBpZiBtZXNzYWdlXG4gICAgICAgIHJldHVybiBAY29tcGlsZVlpZWxkIG8gaWYgQGlzWWllbGQoKVxuICAgICAgICByZXR1cm4gQGNvbXBpbGVVbmFyeSBvIGlmIEBpc1VuYXJ5KClcbiAgICAgICAgcmV0dXJuIEBjb21waWxlQ2hhaW4gbyBpZiBpc0NoYWluXG4gICAgICAgIHN3aXRjaCBAb3BlcmF0b3JcbiAgICAgICAgICAgIHdoZW4gJz8nICAgIHRoZW4gQGNvbXBpbGVFeGlzdGVuY2Ugb1xuICAgICAgICAgICAgd2hlbiAnKionIHRoZW4gQGNvbXBpbGVQb3dlciBvXG4gICAgICAgICAgICB3aGVuICcvLycgdGhlbiBAY29tcGlsZUZsb29yRGl2aXNpb24gb1xuICAgICAgICAgICAgd2hlbiAnJSUnIHRoZW4gQGNvbXBpbGVNb2R1bG8gb1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGxocyA9IEBmaXJzdC5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfT1BcbiAgICAgICAgICAgICAgICByaHMgPSBAc2Vjb25kLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9PUFxuICAgICAgICAgICAgICAgIGFuc3dlciA9IFtdLmNvbmNhdCBsaHMsIEBtYWtlQ29kZShcIiAje0BvcGVyYXRvcn0gXCIpLCByaHNcbiAgICAgICAgICAgICAgICBpZiBvLmxldmVsIDw9IExFVkVMX09QIHRoZW4gYW5zd2VyIGVsc2UgQHdyYXBJbkJyYWNlcyBhbnN3ZXJcblxuICAgICMgTWltaWMgUHl0aG9uJ3MgY2hhaW5lZCBjb21wYXJpc29ucyB3aGVuIG11bHRpcGxlIGNvbXBhcmlzb24gb3BlcmF0b3JzIGFyZVxuICAgICMgdXNlZCBzZXF1ZW50aWFsbHkuIEZvciBleGFtcGxlOlxuICAgICNcbiAgICAjICAgICAgICAgICBiaW4va29mZmVlIC1lICdjb25zb2xlLmxvZyA1MCA8IDY1ID4gMTAnXG4gICAgIyAgICAgICAgICAgdHJ1ZVxuICAgIFxuICAgIGNvbXBpbGVDaGFpbjogKG8pIC0+XG4gICAgICAgIFtAZmlyc3Quc2Vjb25kLCBzaGFyZWRdID0gQGZpcnN0LnNlY29uZC5jYWNoZSBvXG4gICAgICAgIGZzdCA9IEBmaXJzdC5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfT1BcbiAgICAgICAgZnJhZ21lbnRzID0gZnN0LmNvbmNhdCBAbWFrZUNvZGUoXCIgI3tpZiBAaW52ZXJ0IHRoZW4gJyYmJyBlbHNlICd8fCd9IFwiKSxcbiAgICAgICAgICAgIChzaGFyZWQuY29tcGlsZVRvRnJhZ21lbnRzIG8pLCBAbWFrZUNvZGUoXCIgI3tAb3BlcmF0b3J9IFwiKSwgKEBzZWNvbmQuY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX09QKVxuICAgICAgICBAd3JhcEluQnJhY2VzIGZyYWdtZW50c1xuXG4gICAgIyBLZWVwIHJlZmVyZW5jZSB0byB0aGUgbGVmdCBleHByZXNzaW9uLCB1bmxlc3MgdGhpcyBhbiBleGlzdGVudGlhbCBhc3NpZ25tZW50XG4gICAgY29tcGlsZUV4aXN0ZW5jZTogKG8pIC0+XG4gICAgICAgIGlmIEBmaXJzdC5pc0NvbXBsZXgoKVxuICAgICAgICAgICAgcmVmID0gbmV3IElkZW50aWZpZXJMaXRlcmFsIG8uc2NvcGUuZnJlZVZhcmlhYmxlICdyZWYnXG4gICAgICAgICAgICBmc3QgPSBuZXcgUGFyZW5zIG5ldyBBc3NpZ24gcmVmLCBAZmlyc3RcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZnN0ID0gQGZpcnN0XG4gICAgICAgICAgICByZWYgPSBmc3RcbiAgICAgICAgbmV3IElmKG5ldyBFeGlzdGVuY2UoZnN0KSwgcmVmLCB0eXBlOiAnaWYnKS5hZGRFbHNlKEBzZWNvbmQpLmNvbXBpbGVUb0ZyYWdtZW50cyBvXG5cbiAgICAjIENvbXBpbGUgYSB1bmFyeSAqKk9wKiouXG4gICAgY29tcGlsZVVuYXJ5OiAobykgLT5cbiAgICAgICAgcGFydHMgPSBbXVxuICAgICAgICBvcCA9IEBvcGVyYXRvclxuICAgICAgICBwYXJ0cy5wdXNoIFtAbWFrZUNvZGUgb3BdXG4gICAgICAgIGlmIG9wIGlzICchJyBhbmQgQGZpcnN0IGluc3RhbmNlb2YgRXhpc3RlbmNlXG4gICAgICAgICAgICBAZmlyc3QubmVnYXRlZCA9IG5vdCBAZmlyc3QubmVnYXRlZFxuICAgICAgICAgICAgcmV0dXJuIEBmaXJzdC5jb21waWxlVG9GcmFnbWVudHMgb1xuICAgICAgICBpZiBvLmxldmVsID49IExFVkVMX0FDQ0VTU1xuICAgICAgICAgICAgcmV0dXJuIChuZXcgUGFyZW5zIHRoaXMpLmNvbXBpbGVUb0ZyYWdtZW50cyBvXG4gICAgICAgIHBsdXNNaW51cyA9IG9wIGluIFsnKycsICctJ11cbiAgICAgICAgcGFydHMucHVzaCBbQG1ha2VDb2RlKCcgJyldIGlmIG9wIGluIFsnbmV3JywgJ3R5cGVvZicsICdkZWxldGUnXSBvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbHVzTWludXMgYW5kIEBmaXJzdCBpbnN0YW5jZW9mIE9wIGFuZCBAZmlyc3Qub3BlcmF0b3IgaXMgb3BcbiAgICAgICAgaWYgKHBsdXNNaW51cyBhbmQgQGZpcnN0IGluc3RhbmNlb2YgT3ApIG9yIChvcCBpcyAnbmV3JyBhbmQgQGZpcnN0LmlzU3RhdGVtZW50IG8pXG4gICAgICAgICAgICBAZmlyc3QgPSBuZXcgUGFyZW5zIEBmaXJzdFxuICAgICAgICBwYXJ0cy5wdXNoIEBmaXJzdC5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfT1BcbiAgICAgICAgcGFydHMucmV2ZXJzZSgpIGlmIEBmbGlwXG4gICAgICAgIEBqb2luRnJhZ21lbnRBcnJheXMgcGFydHMsICcnXG5cbiAgICBjb21waWxlWWllbGQ6IChvKSAtPlxuICAgICAgICBwYXJ0cyA9IFtdXG4gICAgICAgIG9wID0gQG9wZXJhdG9yXG4gICAgICAgIHVubGVzcyBvLnNjb3BlLnBhcmVudD9cbiAgICAgICAgICAgIEBlcnJvciAneWllbGQgY2FuIG9ubHkgb2NjdXIgaW5zaWRlIGZ1bmN0aW9ucydcbiAgICAgICAgaWYgJ2V4cHJlc3Npb24nIGluIE9iamVjdC5rZXlzKEBmaXJzdCkgYW5kIG5vdCAoQGZpcnN0IGluc3RhbmNlb2YgVGhyb3cpXG4gICAgICAgICAgICBwYXJ0cy5wdXNoIEBmaXJzdC5leHByZXNzaW9uLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9PUCBpZiBAZmlyc3QuZXhwcmVzc2lvbj9cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcGFydHMucHVzaCBbQG1ha2VDb2RlIFwiKFwiXSBpZiBvLmxldmVsID49IExFVkVMX1BBUkVOXG4gICAgICAgICAgICBwYXJ0cy5wdXNoIFtAbWFrZUNvZGUgb3BdXG4gICAgICAgICAgICBwYXJ0cy5wdXNoIFtAbWFrZUNvZGUgXCIgXCJdIGlmIEBmaXJzdC5iYXNlPy52YWx1ZSAhPSAnJ1xuICAgICAgICAgICAgcGFydHMucHVzaCBAZmlyc3QuY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX09QXG4gICAgICAgICAgICBwYXJ0cy5wdXNoIFtAbWFrZUNvZGUgXCIpXCJdIGlmIG8ubGV2ZWwgPj0gTEVWRUxfUEFSRU5cbiAgICAgICAgQGpvaW5GcmFnbWVudEFycmF5cyBwYXJ0cywgJydcblxuICAgIGNvbXBpbGVQb3dlcjogKG8pIC0+XG4gICAgICAgICMgTWFrZSBhIE1hdGgucG93IGNhbGxcbiAgICAgICAgcG93ID0gbmV3IFZhbHVlIG5ldyBJZGVudGlmaWVyTGl0ZXJhbCgnTWF0aCcpLCBbbmV3IEFjY2VzcyBuZXcgUHJvcGVydHlOYW1lICdwb3cnXVxuICAgICAgICBuZXcgQ2FsbChwb3csIFtAZmlyc3QsIEBzZWNvbmRdKS5jb21waWxlVG9GcmFnbWVudHMgb1xuXG4gICAgY29tcGlsZUZsb29yRGl2aXNpb246IChvKSAtPlxuICAgICAgICBmbG9vciA9IG5ldyBWYWx1ZSBuZXcgSWRlbnRpZmllckxpdGVyYWwoJ01hdGgnKSwgW25ldyBBY2Nlc3MgbmV3IFByb3BlcnR5TmFtZSAnZmxvb3InXVxuICAgICAgICBzZWNvbmQgPSBpZiBAc2Vjb25kLmlzQ29tcGxleCgpIHRoZW4gbmV3IFBhcmVucyBAc2Vjb25kIGVsc2UgQHNlY29uZFxuICAgICAgICBkaXYgPSBuZXcgT3AgJy8nLCBAZmlyc3QsIHNlY29uZFxuICAgICAgICBuZXcgQ2FsbChmbG9vciwgW2Rpdl0pLmNvbXBpbGVUb0ZyYWdtZW50cyBvXG5cbiAgICBjb21waWxlTW9kdWxvOiAobykgLT5cbiAgICAgICAgbW9kID0gbmV3IFZhbHVlIG5ldyBMaXRlcmFsIHV0aWxpdHkgJ21vZHVsbycsIG9cbiAgICAgICAgbmV3IENhbGwobW9kLCBbQGZpcnN0LCBAc2Vjb25kXSkuY29tcGlsZVRvRnJhZ21lbnRzIG9cblxuICAgIHRvU3RyaW5nOiAoaWR0KSAtPlxuICAgICAgICBzdXBlciBpZHQsIEBjb25zdHJ1Y3Rvci5uYW1lICsgJyAnICsgQG9wZXJhdG9yXG5cbiMgMDAwICAwMDAgICAwMDAgIFxuIyAwMDAgIDAwMDAgIDAwMCAgXG4jIDAwMCAgMDAwIDAgMDAwICBcbiMgMDAwICAwMDAgIDAwMDAgIFxuIyAwMDAgIDAwMCAgIDAwMCAgXG5cbmV4cG9ydHMuSW4gPSBjbGFzcyBJbiBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBAOiAoQG9iamVjdCwgQGFycmF5KSAtPlxuXG4gICAgY2hpbGRyZW46IFsnb2JqZWN0JywgJ2FycmF5J11cblxuICAgIGludmVydDogTkVHQVRFXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIGlmIEBhcnJheSBpbnN0YW5jZW9mIFZhbHVlIGFuZCBAYXJyYXkuaXNBcnJheSgpIGFuZCBAYXJyYXkuYmFzZS5vYmplY3RzLmxlbmd0aFxuICAgICAgICAgICAgZm9yIG9iaiBpbiBAYXJyYXkuYmFzZS5vYmplY3RzIHdoZW4gb2JqIGluc3RhbmNlb2YgU3BsYXRcbiAgICAgICAgICAgICAgICBoYXNTcGxhdCA9IHllc1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAjIGBjb21waWxlT3JUZXN0YCBvbmx5IGlmIHdlIGhhdmUgYW4gYXJyYXkgbGl0ZXJhbCB3aXRoIG5vIHNwbGF0c1xuICAgICAgICAgICAgcmV0dXJuIEBjb21waWxlT3JUZXN0IG8gdW5sZXNzIGhhc1NwbGF0XG4gICAgICAgIEBjb21waWxlTG9vcFRlc3Qgb1xuXG4gICAgY29tcGlsZU9yVGVzdDogKG8pIC0+XG4gICAgICAgIFtzdWIsIHJlZl0gPSBAb2JqZWN0LmNhY2hlIG8sIExFVkVMX09QXG4gICAgICAgIFtjbXAsIGNual0gPSBpZiBAbmVnYXRlZCB0aGVuIFsnICE9PSAnLCAnICYmICddIGVsc2UgWycgPT09ICcsICcgfHwgJ11cbiAgICAgICAgdGVzdHMgPSBbXVxuICAgICAgICBmb3IgaXRlbSwgaSBpbiBAYXJyYXkuYmFzZS5vYmplY3RzXG4gICAgICAgICAgICBpZiBpIHRoZW4gdGVzdHMucHVzaCBAbWFrZUNvZGUgY25qXG4gICAgICAgICAgICB0ZXN0cyA9IHRlc3RzLmNvbmNhdCAoaWYgaSB0aGVuIHJlZiBlbHNlIHN1YiksIEBtYWtlQ29kZShjbXApLCBpdGVtLmNvbXBpbGVUb0ZyYWdtZW50cyhvLCBMRVZFTF9BQ0NFU1MpXG4gICAgICAgIGlmIG8ubGV2ZWwgPCBMRVZFTF9PUCB0aGVuIHRlc3RzIGVsc2UgQHdyYXBJbkJyYWNlcyB0ZXN0c1xuXG4gICAgY29tcGlsZUxvb3BUZXN0OiAobykgLT5cbiAgICAgICAgW3N1YiwgcmVmXSA9IEBvYmplY3QuY2FjaGUgbywgTEVWRUxfTElTVFxuICAgICAgICBmcmFnbWVudHMgPSBbXS5jb25jYXQgQG1ha2VDb2RlKHV0aWxpdHkoJ2luZGV4T2YnLCBvKSArIFwiLmNhbGwoXCIpLCBAYXJyYXkuY29tcGlsZVRvRnJhZ21lbnRzKG8sIExFVkVMX0xJU1QpLFxuICAgICAgICAgICAgQG1ha2VDb2RlKFwiLCBcIiksIHJlZiwgQG1ha2VDb2RlKFwiKSBcIiArIGlmIEBuZWdhdGVkIHRoZW4gJzwgMCcgZWxzZSAnPj0gMCcpXG4gICAgICAgIHJldHVybiBmcmFnbWVudHMgaWYgQGZyYWdtZW50c1RvVGV4dChzdWIpIGlzIEBmcmFnbWVudHNUb1RleHQocmVmKVxuICAgICAgICBmcmFnbWVudHMgPSBzdWIuY29uY2F0IEBtYWtlQ29kZSgnLCAnKSwgZnJhZ21lbnRzXG4gICAgICAgIGlmIG8ubGV2ZWwgPCBMRVZFTF9MSVNUIHRoZW4gZnJhZ21lbnRzIGVsc2UgQHdyYXBJbkJyYWNlcyBmcmFnbWVudHNcblxuICAgIHRvU3RyaW5nOiAoaWR0KSAtPlxuICAgICAgICBzdXBlciBpZHQsIEBjb25zdHJ1Y3Rvci5uYW1lICsgaWYgQG5lZ2F0ZWQgdGhlbiAnIScgZWxzZSAnJ1xuXG4jIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICBcbiMgICAgMDAwICAgICAwMDAwMDAwICAgICAgMDAwMDAgICAgXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcblxuIyBBIGNsYXNzaWMgKnRyeS9jYXRjaC9maW5hbGx5KiBibG9jay5cblxuZXhwb3J0cy5UcnkgPSBjbGFzcyBUcnkgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgQDogKEBhdHRlbXB0LCBAZXJyb3JWYXJpYWJsZSwgQHJlY292ZXJ5LCBAZW5zdXJlKSAtPlxuXG4gICAgY2hpbGRyZW46IFsnYXR0ZW1wdCcsICdyZWNvdmVyeScsICdlbnN1cmUnXVxuXG4gICAgaXNTdGF0ZW1lbnQ6IFlFU1xuXG4gICAganVtcHM6IChvKSAtPiBAYXR0ZW1wdC5qdW1wcyhvKSBvciBAcmVjb3Zlcnk/Lmp1bXBzKG8pXG5cbiAgICBtYWtlUmV0dXJuOiAocmVzKSAtPlxuICAgICAgICBAYXR0ZW1wdCAgPSBAYXR0ZW1wdCAubWFrZVJldHVybiByZXMgaWYgQGF0dGVtcHRcbiAgICAgICAgQHJlY292ZXJ5ID0gQHJlY292ZXJ5Lm1ha2VSZXR1cm4gcmVzIGlmIEByZWNvdmVyeVxuICAgICAgICB0aGlzXG5cbiAgICAjIENvbXBpbGF0aW9uIGlzIG1vcmUgb3IgbGVzcyBhcyB5b3Ugd291bGQgZXhwZWN0IC0tIHRoZSAqZmluYWxseSogY2xhdXNlXG4gICAgIyBpcyBvcHRpb25hbCwgdGhlICpjYXRjaCogaXMgbm90LlxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgby5pbmRlbnQgKz0gVEFCXG4gICAgICAgIHRyeVBhcnQgICA9IEBhdHRlbXB0LmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9UT1BcblxuICAgICAgICBjYXRjaFBhcnQgPSBpZiBAcmVjb3ZlcnlcbiAgICAgICAgICAgIGdlbmVyYXRlZEVycm9yVmFyaWFibGVOYW1lID0gby5zY29wZS5mcmVlVmFyaWFibGUgJ2Vycm9yJywgcmVzZXJ2ZTogbm9cbiAgICAgICAgICAgIHBsYWNlaG9sZGVyID0gbmV3IElkZW50aWZpZXJMaXRlcmFsIGdlbmVyYXRlZEVycm9yVmFyaWFibGVOYW1lXG4gICAgICAgICAgICBpZiBAZXJyb3JWYXJpYWJsZVxuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBpc1VuYXNzaWduYWJsZSBAZXJyb3JWYXJpYWJsZS51bndyYXBBbGwoKS52YWx1ZVxuICAgICAgICAgICAgICAgIEBlcnJvclZhcmlhYmxlLmVycm9yIG1lc3NhZ2UgaWYgbWVzc2FnZVxuICAgICAgICAgICAgICAgIEByZWNvdmVyeS51bnNoaWZ0IG5ldyBBc3NpZ24gQGVycm9yVmFyaWFibGUsIHBsYWNlaG9sZGVyXG4gICAgICAgICAgICBbXS5jb25jYXQgQG1ha2VDb2RlKFwiIGNhdGNoIChcIiksIHBsYWNlaG9sZGVyLmNvbXBpbGVUb0ZyYWdtZW50cyhvKSwgQG1ha2VDb2RlKFwiKSB7XFxuXCIpLFxuICAgICAgICAgICAgICAgIEByZWNvdmVyeS5jb21waWxlVG9GcmFnbWVudHMobywgTEVWRUxfVE9QKSwgQG1ha2VDb2RlKFwiXFxuI3tAdGFifX1cIilcbiAgICAgICAgZWxzZSB1bmxlc3MgQGVuc3VyZSBvciBAcmVjb3ZlcnlcbiAgICAgICAgICAgIGdlbmVyYXRlZEVycm9yVmFyaWFibGVOYW1lID0gby5zY29wZS5mcmVlVmFyaWFibGUgJ2Vycm9yJywgcmVzZXJ2ZTogbm9cbiAgICAgICAgICAgIFtAbWFrZUNvZGUoXCIgY2F0Y2ggKCN7Z2VuZXJhdGVkRXJyb3JWYXJpYWJsZU5hbWV9KSB7fVwiKV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgW11cblxuICAgICAgICBlbnN1cmVQYXJ0ID0gaWYgQGVuc3VyZSB0aGVuIChbXS5jb25jYXQgQG1ha2VDb2RlKFwiIGZpbmFsbHkge1xcblwiKSwgQGVuc3VyZS5jb21waWxlVG9GcmFnbWVudHMobywgTEVWRUxfVE9QKSxcbiAgICAgICAgICAgIEBtYWtlQ29kZShcIlxcbiN7QHRhYn19XCIpKSBlbHNlIFtdXG5cbiAgICAgICAgW10uY29uY2F0IEBtYWtlQ29kZShcIiN7QHRhYn10cnkge1xcblwiKSxcbiAgICAgICAgICAgIHRyeVBhcnQsXG4gICAgICAgICAgICBAbWFrZUNvZGUoXCJcXG4je0B0YWJ9fVwiKSwgY2F0Y2hQYXJ0LCBlbnN1cmVQYXJ0XG5cbiMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4jICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgXG5cbiMgU2ltcGxlIG5vZGUgdG8gdGhyb3cgYW4gZXhjZXB0aW9uLlxuXG5leHBvcnRzLlRocm93ID0gY2xhc3MgVGhyb3cgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgQDogKEBleHByZXNzaW9uKSAtPlxuXG4gICAgY2hpbGRyZW46IFsnZXhwcmVzc2lvbiddXG5cbiAgICBpc1N0YXRlbWVudDogWUVTXG4gICAganVtcHM6ICAgICAgIE5PXG5cbiAgICAjIEEgKipUaHJvdyoqIGlzIGFscmVhZHkgYSByZXR1cm4sIG9mIHNvcnRzLi4uXG4gICAgbWFrZVJldHVybjogVEhJU1xuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBbXS5jb25jYXQgQG1ha2VDb2RlKEB0YWIgKyBcInRocm93IFwiKSwgQGV4cHJlc3Npb24uY29tcGlsZVRvRnJhZ21lbnRzKG8pLCBAbWFrZUNvZGUoXCI7XCIpXG5cbiMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG5cbiMgQ2hlY2tzIGEgdmFyaWFibGUgZm9yIGV4aXN0ZW5jZSAtLSBub3QgKm51bGwqIGFuZCBub3QgKnVuZGVmaW5lZCouIFRoaXMgaXNcbiMgc2ltaWxhciB0byBgLm5pbD9gIGluIFJ1YnksIGFuZCBhdm9pZHMgaGF2aW5nIHRvIGNvbnN1bHQgYSBKYXZhU2NyaXB0IHRydXRoXG4jIHRhYmxlLlxuXG5leHBvcnRzLkV4aXN0ZW5jZSA9IGNsYXNzIEV4aXN0ZW5jZSBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBAOiAoQGV4cHJlc3Npb24pIC0+XG5cbiAgICBjaGlsZHJlbjogWydleHByZXNzaW9uJ11cblxuICAgIGludmVydDogTkVHQVRFXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIEBleHByZXNzaW9uLmZyb250ID0gQGZyb250XG4gICAgICAgIGNvZGUgPSBAZXhwcmVzc2lvbi5jb21waWxlIG8sIExFVkVMX09QXG4gICAgICAgIGlmIEBleHByZXNzaW9uLnVud3JhcCgpIGluc3RhbmNlb2YgSWRlbnRpZmllckxpdGVyYWwgYW5kIG5vdCBvLnNjb3BlLmNoZWNrIGNvZGVcbiAgICAgICAgICAgIFtjbXAsIGNual0gPSBpZiBAbmVnYXRlZCB0aGVuIFsnPT09JywgJ3x8J10gZWxzZSBbJyE9PScsICcmJiddXG4gICAgICAgICAgICBjb2RlID0gXCJ0eXBlb2YgI3tjb2RlfSAje2NtcH0gXFxcInVuZGVmaW5lZFxcXCIgI3tjbmp9ICN7Y29kZX0gI3tjbXB9IG51bGxcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICAjIGRvIG5vdCB1c2Ugc3RyaWN0IGVxdWFsaXR5IGhlcmU7IGl0IHdpbGwgYnJlYWsgZXhpc3RpbmcgY29kZVxuICAgICAgICAgICAgY29kZSA9IFwiI3tjb2RlfSAje2lmIEBuZWdhdGVkIHRoZW4gJz09JyBlbHNlICchPSd9IG51bGxcIlxuICAgICAgICBbQG1ha2VDb2RlKGlmIG8ubGV2ZWwgPD0gTEVWRUxfQ09ORCB0aGVuIGNvZGUgZWxzZSBcIigje2NvZGV9KVwiKV1cblxuIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgICAgICBcbiMgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAgICAgIDAwMCAgXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcblxuIyBBbiBleHRyYSBzZXQgb2YgcGFyZW50aGVzZXMsIHNwZWNpZmllZCBleHBsaWNpdGx5IGluIHRoZSBzb3VyY2UuIEF0IG9uZSB0aW1lXG4jIHdlIHRyaWVkIHRvIGNsZWFuIHVwIHRoZSByZXN1bHRzIGJ5IGRldGVjdGluZyBhbmQgcmVtb3ZpbmcgcmVkdW5kYW50XG4jIHBhcmVudGhlc2VzLCBidXQgbm8gbG9uZ2VyIC0tIHlvdSBjYW4gcHV0IGluIGFzIG1hbnkgYXMgeW91IHBsZWFzZS5cbiNcbiMgUGFyZW50aGVzZXMgYXJlIGEgZ29vZCB3YXkgdG8gZm9yY2UgYW55IHN0YXRlbWVudCB0byBiZWNvbWUgYW4gZXhwcmVzc2lvbi5cblxuZXhwb3J0cy5QYXJlbnMgPSBjbGFzcyBQYXJlbnMgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgQDogKEBib2R5KSAtPlxuXG4gICAgY2hpbGRyZW46IFsnYm9keSddXG5cbiAgICB1bndyYXA6ICAgIC0+IEBib2R5XG4gICAgaXNDb21wbGV4OiAtPiBAYm9keS5pc0NvbXBsZXgoKVxuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBleHByID0gQGJvZHkudW53cmFwKClcbiAgICAgICAgaWYgZXhwciBpbnN0YW5jZW9mIFZhbHVlIGFuZCBleHByLmlzQXRvbWljKClcbiAgICAgICAgICAgIGV4cHIuZnJvbnQgPSBAZnJvbnRcbiAgICAgICAgICAgIHJldHVybiBleHByLmNvbXBpbGVUb0ZyYWdtZW50cyBvXG4gICAgICAgIGZyYWdtZW50cyA9IGV4cHIuY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX1BBUkVOXG4gICAgICAgIGJhcmUgPSBvLmxldmVsIDwgTEVWRUxfT1AgYW5kIChleHByIGluc3RhbmNlb2YgT3Agb3IgZXhwciBpbnN0YW5jZW9mIENhbGwgb3JcbiAgICAgICAgICAgIChleHByIGluc3RhbmNlb2YgRm9yIGFuZCBleHByLnJldHVybnMpKSBhbmQgKG8ubGV2ZWwgPCBMRVZFTF9DT05EIG9yXG4gICAgICAgICAgICAgICAgZnJhZ21lbnRzLmxlbmd0aCA8PSAzKVxuICAgICAgICBpZiBiYXJlIHRoZW4gZnJhZ21lbnRzIGVsc2UgQHdyYXBJbkJyYWNlcyBmcmFnbWVudHNcblxuIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiMgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4jIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIFxuIyAwMDAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICBcbiMgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgXG5cbiMgU3RyaW5ncyB3aXRoIGludGVycG9sYXRpb25zIGFyZSBpbiBmYWN0IGp1c3QgYSB2YXJpYXRpb24gb2YgYFBhcmVuc2Agd2l0aCBzdHJpbmcgY29uY2F0ZW5hdGlvbiBpbnNpZGUuXG5cbmV4cG9ydHMuU3RyaW5nV2l0aEludGVycG9sYXRpb25zID0gY2xhc3MgU3RyaW5nV2l0aEludGVycG9sYXRpb25zIGV4dGVuZHMgUGFyZW5zXG4gICAgXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBcbiAgICAgICAgIyBUaGlzIG1ldGhvZCBwcm9kdWNlcyBhbiBpbnRlcnBvbGF0ZWQgc3RyaW5nIHVzaW5nIHRoZSBuZXcgRVMyMDE1IHN5bnRheCxcbiAgICAgICAgIyB3aGljaCBpcyBvcHQtaW4gYnkgdXNpbmcgdGFnZ2VkIHRlbXBsYXRlIGxpdGVyYWxzLiBcbiAgICAgICAgIyBJZiB0aGlzIFN0cmluZ1dpdGhJbnRlcnBvbGF0aW9ucyBpc27igJl0IGluc2lkZSBhIHRhZ2dlZCB0ZW1wbGF0ZSBsaXRlcmFsLCBmYWxsIGJhY2sgdG8gdGhlIEtvZmZlZSAxLnggb3V0cHV0LlxuICAgICAgICBcbiAgICAgICAgdW5sZXNzIG8uaW5UYWdnZWRUZW1wbGF0ZUNhbGxcbiAgICAgICAgICAgIHJldHVybiBzdXBlclxuXG4gICAgICAgIGV4cHIgPSBAYm9keS51bndyYXAoKSAjIEFzc3VtcHRpb246IGV4cHIgaXMgVmFsdWU+U3RyaW5nTGl0ZXJhbCBvciBPcFxuXG4gICAgICAgIGVsZW1lbnRzID0gW11cbiAgICAgICAgZXhwci50cmF2ZXJzZUNoaWxkcmVuIG5vLCAobm9kZSkgLT5cbiAgICAgICAgICAgIGlmIG5vZGUgaW5zdGFuY2VvZiBTdHJpbmdMaXRlcmFsXG4gICAgICAgICAgICAgICAgZWxlbWVudHMucHVzaCBub2RlXG4gICAgICAgICAgICAgICAgcmV0dXJuIHllc1xuICAgICAgICAgICAgZWxzZSBpZiBub2RlIGluc3RhbmNlb2YgUGFyZW5zXG4gICAgICAgICAgICAgICAgZWxlbWVudHMucHVzaCBub2RlXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vXG4gICAgICAgICAgICByZXR1cm4geWVzXG5cbiAgICAgICAgZnJhZ21lbnRzID0gW11cbiAgICAgICAgZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlICdgJ1xuICAgICAgICBmb3IgZWxlbWVudCBpbiBlbGVtZW50c1xuICAgICAgICAgICAgaWYgZWxlbWVudCBpbnN0YW5jZW9mIFN0cmluZ0xpdGVyYWxcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGVsZW1lbnQudmFsdWVbMS4uLi0xXVxuICAgICAgICAgICAgICAgICMgQmFja3RpY2tzIGFuZCBgJHtgIGluc2lkZSB0ZW1wbGF0ZSBsaXRlcmFscyBtdXN0IGJlIGVzY2FwZWQuXG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlIC8oXFxcXCopKGB8XFwkXFx7KS9nLCAobWF0Y2gsIGJhY2tzbGFzaGVzLCB0b0JlRXNjYXBlZCkgLT5cbiAgICAgICAgICAgICAgICAgICAgaWYgYmFja3NsYXNoZXMubGVuZ3RoICUgMiBpcyAwXG4gICAgICAgICAgICAgICAgICAgICAgICBcIiN7YmFja3NsYXNoZXN9XFxcXCN7dG9CZUVzY2FwZWR9XCJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hcbiAgICAgICAgICAgICAgICBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUgdmFsdWVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUgJyR7J1xuICAgICAgICAgICAgICAgIGZyYWdtZW50cy5wdXNoIGVsZW1lbnQuY29tcGlsZVRvRnJhZ21lbnRzKG8sIExFVkVMX1BBUkVOKS4uLlxuICAgICAgICAgICAgICAgIGZyYWdtZW50cy5wdXNoIEBtYWtlQ29kZSAnfSdcbiAgICAgICAgZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlICdgJ1xuXG4gICAgICAgIGZyYWdtZW50c1xuXG4jIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG5cbiMgUmVwbGFjZW1lbnQgZm9yIHRoZSAqZm9yKiBsb29wIGlzIG91ciBhcnJheSBhbmQgb2JqZWN0XG4jIGNvbXByZWhlbnNpb25zLCB0aGF0IGNvbXBpbGUgaW50byAqZm9yKiBsb29wcyBoZXJlLiBUaGV5IGFsc28gYWN0IGFzIGFuXG4jIGV4cHJlc3Npb24sIGFibGUgdG8gcmV0dXJuIHRoZSByZXN1bHQgb2YgZWFjaCBmaWx0ZXJlZCBpdGVyYXRpb24uXG4jXG4jIFVubGlrZSBQeXRob24gYXJyYXkgY29tcHJlaGVuc2lvbnMsIHRoZXkgY2FuIGJlIG11bHRpLWxpbmUsIGFuZCB5b3UgY2FuIHBhc3NcbiMgdGhlIGN1cnJlbnQgaW5kZXggb2YgdGhlIGxvb3AgYXMgYSBzZWNvbmQgcGFyYW1ldGVyLiBVbmxpa2UgUnVieSBibG9ja3MsXG4jIHlvdSBjYW4gbWFwIGFuZCBmaWx0ZXIgaW4gYSBzaW5nbGUgcGFzcy5cblxuZXhwb3J0cy5Gb3IgPSBjbGFzcyBGb3IgZXh0ZW5kcyBXaGlsZVxuICAgIEA6IChib2R5LCBzb3VyY2UpIC0+XG4gICAgICAgIHtAc291cmNlLCBAZ3VhcmQsIEBzdGVwLCBAbmFtZSwgQGluZGV4fSA9IHNvdXJjZVxuICAgICAgICBAYm9keSAgID0gQmxvY2sud3JhcCBbYm9keV1cbiAgICAgICAgQG93biAgICA9ICEhc291cmNlLm93blxuICAgICAgICBAb2JqZWN0ID0gISFzb3VyY2Uub2JqZWN0XG4gICAgICAgIEBmcm9tICAgPSAhIXNvdXJjZS5mcm9tXG4gICAgICAgIEBpbmRleC5lcnJvciAnY2Fubm90IHVzZSBpbmRleCB3aXRoIGZvci1mcm9tJyBpZiBAZnJvbSBhbmQgQGluZGV4XG4gICAgICAgIHNvdXJjZS5vd25UYWcuZXJyb3IgXCJjYW5ub3QgdXNlIG93biB3aXRoIGZvci0je2lmIEBmcm9tIHRoZW4gJ2Zyb20nIGVsc2UgJ2luJ31cIiBpZiBAb3duIGFuZCBub3QgQG9iamVjdFxuICAgICAgICBbQG5hbWUsIEBpbmRleF0gPSBbQGluZGV4LCBAbmFtZV0gaWYgQG9iamVjdFxuICAgICAgICBAaW5kZXguZXJyb3IgJ2luZGV4IGNhbm5vdCBiZSBhIHBhdHRlcm4gbWF0Y2hpbmcgZXhwcmVzc2lvbicgaWYgQGluZGV4IGluc3RhbmNlb2YgVmFsdWUgYW5kIG5vdCBAaW5kZXguaXNBc3NpZ25hYmxlKClcbiAgICAgICAgQHJhbmdlICAgPSBAc291cmNlIGluc3RhbmNlb2YgVmFsdWUgYW5kIEBzb3VyY2UuYmFzZSBpbnN0YW5jZW9mIFJhbmdlIGFuZCBub3QgQHNvdXJjZS5wcm9wZXJ0aWVzLmxlbmd0aCBhbmQgbm90IEBmcm9tXG4gICAgICAgIEBwYXR0ZXJuID0gQG5hbWUgaW5zdGFuY2VvZiBWYWx1ZVxuICAgICAgICBAaW5kZXguZXJyb3IgJ2luZGV4ZXMgZG8gbm90IGFwcGx5IHRvIHJhbmdlIGxvb3BzJyBpZiBAcmFuZ2UgYW5kIEBpbmRleFxuICAgICAgICBAbmFtZS5lcnJvciAnY2Fubm90IHBhdHRlcm4gbWF0Y2ggb3ZlciByYW5nZSBsb29wcycgaWYgQHJhbmdlIGFuZCBAcGF0dGVyblxuICAgICAgICBAcmV0dXJucyA9IGZhbHNlXG5cbiAgICBjaGlsZHJlbjogWydib2R5JywgJ3NvdXJjZScsICdndWFyZCcsICdzdGVwJ11cblxuICAgICMgV2VsY29tZSB0byB0aGUgaGFpcmllc3QgbWV0aG9kIGluIGFsbCBvZiBLb2ZmZWUuIEhhbmRsZXMgdGhlIGlubmVyXG4gICAgIyBsb29wLCBmaWx0ZXJpbmcsIHN0ZXBwaW5nLCBhbmQgcmVzdWx0IHNhdmluZyBmb3IgYXJyYXksIG9iamVjdCwgYW5kIHJhbmdlXG4gICAgIyBjb21wcmVoZW5zaW9ucy4gU29tZSBvZiB0aGUgZ2VuZXJhdGVkIGNvZGUgY2FuIGJlIHNoYXJlZCBpbiBjb21tb24sIGFuZFxuICAgICMgc29tZSBjYW5ub3QuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBib2R5ICAgICAgICA9IEJsb2NrLndyYXAgW0Bib2R5XVxuICAgICAgICBbLi4uLCBsYXN0XSA9IGJvZHkuZXhwcmVzc2lvbnNcbiAgICAgICAgQHJldHVybnMgICAgPSBubyBpZiBsYXN0Py5qdW1wcygpIGluc3RhbmNlb2YgUmV0dXJuXG4gICAgICAgIHNvdXJjZSAgICAgID0gaWYgQHJhbmdlIHRoZW4gQHNvdXJjZS5iYXNlIGVsc2UgQHNvdXJjZVxuICAgICAgICBzY29wZSAgICAgICA9IG8uc2NvcGVcbiAgICAgICAgbmFtZSAgICAgICAgPSBAbmFtZSAgYW5kIChAbmFtZS5jb21waWxlIG8sIExFVkVMX0xJU1QpIGlmIG5vdCBAcGF0dGVyblxuICAgICAgICBpbmRleCAgICAgICA9IEBpbmRleCBhbmQgKEBpbmRleC5jb21waWxlIG8sIExFVkVMX0xJU1QpXG4gICAgICAgIHNjb3BlLmZpbmQobmFtZSkgIGlmIG5hbWUgYW5kIG5vdCBAcGF0dGVyblxuICAgICAgICBzY29wZS5maW5kKGluZGV4KSBpZiBpbmRleCBhbmQgQGluZGV4IG5vdCBpbnN0YW5jZW9mIFZhbHVlXG4gICAgICAgIHJ2YXIgPSBzY29wZS5mcmVlVmFyaWFibGUgJ3Jlc3VsdHMnIGlmIEByZXR1cm5zXG4gICAgICAgIGlmIEBmcm9tXG4gICAgICAgICAgICBpdmFyID0gc2NvcGUuZnJlZVZhcmlhYmxlICd4Jywgc2luZ2xlOiB0cnVlIGlmIEBwYXR0ZXJuXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGl2YXIgPSAoQG9iamVjdCBhbmQgaW5kZXgpIG9yIHNjb3BlLmZyZWVWYXJpYWJsZSAnaScsIHNpbmdsZTogdHJ1ZVxuICAgICAgICBrdmFyID0gKChAcmFuZ2Ugb3IgQGZyb20pIGFuZCBuYW1lKSBvciBpbmRleCBvciBpdmFyXG4gICAgICAgIGt2YXJBc3NpZ24gID0gaWYga3ZhciAhPSBpdmFyIHRoZW4gXCIje2t2YXJ9ID0gXCIgZWxzZSBcIlwiXG4gICAgICAgIGlmIEBzdGVwIGFuZCBub3QgQHJhbmdlXG4gICAgICAgICAgICBbc3RlcCwgc3RlcFZhcl0gPSBAY2FjaGVUb0NvZGVGcmFnbWVudHMgQHN0ZXAuY2FjaGUgbywgTEVWRUxfTElTVCwgaXNDb21wbGV4T3JBc3NpZ25hYmxlXG4gICAgICAgICAgICBzdGVwTnVtID0gTnVtYmVyIHN0ZXBWYXIgaWYgQHN0ZXAuaXNOdW1iZXIoKVxuICAgICAgICBuYW1lICAgICAgPSBpdmFyIGlmIEBwYXR0ZXJuXG4gICAgICAgIHZhclBhcnQgICA9ICcnXG4gICAgICAgIGd1YXJkUGFydCA9ICcnXG4gICAgICAgIGRlZlBhcnQgICA9ICcnXG4gICAgICAgIGlkdDEgICAgICA9IEB0YWIgKyBUQUJcbiAgICAgICAgaWYgQHJhbmdlXG4gICAgICAgICAgICBmb3JQYXJ0RnJhZ21lbnRzID0gc291cmNlLmNvbXBpbGVUb0ZyYWdtZW50cyBtZXJnZSBvLFxuICAgICAgICAgICAgICAgIHtpbmRleDogaXZhciwgbmFtZSwgQHN0ZXAsIGlzQ29tcGxleDogaXNDb21wbGV4T3JBc3NpZ25hYmxlfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzdmFyID0gQHNvdXJjZS5jb21waWxlIG8sIExFVkVMX0xJU1RcbiAgICAgICAgICAgIGlmIChuYW1lIG9yIEBvd24pIGFuZCBAc291cmNlLnVud3JhcCgpIG5vdCBpbnN0YW5jZW9mIElkZW50aWZpZXJMaXRlcmFsXG4gICAgICAgICAgICAgICAgZGVmUGFydCArPSBcIiN7QHRhYn0je3JlZiA9IHNjb3BlLmZyZWVWYXJpYWJsZSAncmVmJ30gPSAje3N2YXJ9O1xcblwiXG4gICAgICAgICAgICAgICAgc3ZhciA9IHJlZlxuICAgICAgICAgICAgaWYgbmFtZSBhbmQgbm90IEBwYXR0ZXJuIGFuZCBub3QgQGZyb21cbiAgICAgICAgICAgICAgICBuYW1lUGFydCA9IFwiI3tuYW1lfSA9ICN7c3Zhcn1bI3trdmFyfV1cIlxuICAgICAgICAgICAgaWYgbm90IEBvYmplY3QgYW5kIG5vdCBAZnJvbVxuICAgICAgICAgICAgICAgIGRlZlBhcnQgKz0gXCIje0B0YWJ9I3tzdGVwfTtcXG5cIiBpZiBzdGVwICE9IHN0ZXBWYXJcbiAgICAgICAgICAgICAgICBkb3duID0gc3RlcE51bSA8IDBcbiAgICAgICAgICAgICAgICBsdmFyID0gc2NvcGUuZnJlZVZhcmlhYmxlICdsZW4nIHVubGVzcyBAc3RlcCBhbmQgc3RlcE51bT8gYW5kIGRvd25cbiAgICAgICAgICAgICAgICBkZWNsYXJlID0gXCIje2t2YXJBc3NpZ259I3tpdmFyfSA9IDAsICN7bHZhcn0gPSAje3N2YXJ9Lmxlbmd0aFwiXG4gICAgICAgICAgICAgICAgZGVjbGFyZURvd24gPSBcIiN7a3ZhckFzc2lnbn0je2l2YXJ9ID0gI3tzdmFyfS5sZW5ndGggLSAxXCJcbiAgICAgICAgICAgICAgICBjb21wYXJlID0gXCIje2l2YXJ9IDwgI3tsdmFyfVwiXG4gICAgICAgICAgICAgICAgY29tcGFyZURvd24gPSBcIiN7aXZhcn0gPj0gMFwiXG4gICAgICAgICAgICAgICAgaWYgQHN0ZXBcbiAgICAgICAgICAgICAgICAgICAgaWYgc3RlcE51bT9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGRvd25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wYXJlID0gY29tcGFyZURvd25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWNsYXJlID0gZGVjbGFyZURvd25cbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcGFyZSA9IFwiI3tzdGVwVmFyfSA+IDAgPyAje2NvbXBhcmV9IDogI3tjb21wYXJlRG93bn1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgZGVjbGFyZSA9IFwiKCN7c3RlcFZhcn0gPiAwID8gKCN7ZGVjbGFyZX0pIDogI3tkZWNsYXJlRG93bn0pXCJcbiAgICAgICAgICAgICAgICAgICAgaW5jcmVtZW50ID0gXCIje2l2YXJ9ICs9ICN7c3RlcFZhcn1cIlxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgaW5jcmVtZW50ID0gXCIje2lmIGt2YXIgIT0gaXZhciB0aGVuIFwiKysje2l2YXJ9XCIgZWxzZSBcIiN7aXZhcn0rK1wifVwiXG4gICAgICAgICAgICAgICAgZm9yUGFydEZyYWdtZW50cyA9IFtAbWFrZUNvZGUoXCIje2RlY2xhcmV9OyAje2NvbXBhcmV9OyAje2t2YXJBc3NpZ259I3tpbmNyZW1lbnR9XCIpXVxuICAgICAgICBpZiBAcmV0dXJuc1xuICAgICAgICAgICAgcmVzdWx0UGFydCAgID0gXCIje0B0YWJ9I3tydmFyfSA9IFtdO1xcblwiXG4gICAgICAgICAgICByZXR1cm5SZXN1bHQgPSBcIlxcbiN7QHRhYn1yZXR1cm4gI3tydmFyfTtcIlxuICAgICAgICAgICAgYm9keS5tYWtlUmV0dXJuIHJ2YXJcbiAgICAgICAgaWYgQGd1YXJkXG4gICAgICAgICAgICBpZiBib2R5LmV4cHJlc3Npb25zLmxlbmd0aCA+IDFcbiAgICAgICAgICAgICAgICBib2R5LmV4cHJlc3Npb25zLnVuc2hpZnQgbmV3IElmIChuZXcgUGFyZW5zIEBndWFyZCkuaW52ZXJ0KCksIG5ldyBTdGF0ZW1lbnRMaXRlcmFsIFwiY29udGludWVcIlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGJvZHkgPSBCbG9jay53cmFwIFtuZXcgSWYgQGd1YXJkLCBib2R5XSBpZiBAZ3VhcmRcbiAgICAgICAgaWYgQHBhdHRlcm5cbiAgICAgICAgICAgIGJvZHkuZXhwcmVzc2lvbnMudW5zaGlmdCBuZXcgQXNzaWduIEBuYW1lLCBpZiBAZnJvbSB0aGVuIG5ldyBJZGVudGlmaWVyTGl0ZXJhbCBrdmFyIGVsc2UgbmV3IExpdGVyYWwgXCIje3N2YXJ9WyN7a3Zhcn1dXCJcbiAgICAgICAgZGVmUGFydEZyYWdtZW50cyA9IFtdLmNvbmNhdCBAbWFrZUNvZGUoZGVmUGFydCksIEBwbHVja0RpcmVjdENhbGwobywgYm9keSlcbiAgICAgICAgdmFyUGFydCA9IFwiXFxuI3tpZHQxfSN7bmFtZVBhcnR9O1wiIGlmIG5hbWVQYXJ0XG4gICAgICAgIGlmIEBvYmplY3RcbiAgICAgICAgICAgIGZvclBhcnRGcmFnbWVudHMgPSBbQG1ha2VDb2RlKFwiI3trdmFyfSBpbiAje3N2YXJ9XCIpXVxuICAgICAgICAgICAgZ3VhcmRQYXJ0ID0gXCJcXG4je2lkdDF9aWYgKCEje3V0aWxpdHkgJ2hhc1Byb3AnLCBvfSgje3N2YXJ9LCAje2t2YXJ9KSkgY29udGludWU7XCIgaWYgQG93blxuICAgICAgICBlbHNlIGlmIEBmcm9tXG4gICAgICAgICAgICBmb3JQYXJ0RnJhZ21lbnRzID0gW0BtYWtlQ29kZShcIiN7a3Zhcn0gb2YgI3tzdmFyfVwiKV1cbiAgICAgICAgYm9keUZyYWdtZW50cyA9IGJvZHkuY29tcGlsZVRvRnJhZ21lbnRzIG1lcmdlKG8sIGluZGVudDogaWR0MSksIExFVkVMX1RPUFxuICAgICAgICBpZiBib2R5RnJhZ21lbnRzIGFuZCBib2R5RnJhZ21lbnRzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIGJvZHlGcmFnbWVudHMgPSBbXS5jb25jYXQgQG1ha2VDb2RlKFwiXFxuXCIpLCBib2R5RnJhZ21lbnRzLCBAbWFrZUNvZGUoXCJcXG5cIilcbiAgICAgICAgW10uY29uY2F0IGRlZlBhcnRGcmFnbWVudHMsIEBtYWtlQ29kZShcIiN7cmVzdWx0UGFydCBvciAnJ30je0B0YWJ9Zm9yIChcIiksXG4gICAgICAgICAgICBmb3JQYXJ0RnJhZ21lbnRzLCBAbWFrZUNvZGUoXCIpIHsje2d1YXJkUGFydH0je3ZhclBhcnR9XCIpLCBib2R5RnJhZ21lbnRzLFxuICAgICAgICAgICAgQG1ha2VDb2RlKFwiI3tAdGFifX0je3JldHVyblJlc3VsdCBvciAnJ31cIilcblxuICAgIHBsdWNrRGlyZWN0Q2FsbDogKG8sIGJvZHkpIC0+XG4gICAgICAgIGRlZnMgPSBbXVxuICAgICAgICBmb3IgZXhwciwgaWR4IGluIGJvZHkuZXhwcmVzc2lvbnNcbiAgICAgICAgICAgIGV4cHIgPSBleHByLnVud3JhcEFsbCgpXG4gICAgICAgICAgICBjb250aW51ZSB1bmxlc3MgZXhwciBpbnN0YW5jZW9mIENhbGxcbiAgICAgICAgICAgIHZhbCA9IGV4cHIudmFyaWFibGU/LnVud3JhcEFsbCgpXG4gICAgICAgICAgICBjb250aW51ZSB1bmxlc3MgKHZhbCBpbnN0YW5jZW9mIENvZGUpIG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh2YWwgaW5zdGFuY2VvZiBWYWx1ZSBhbmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsLmJhc2U/LnVud3JhcEFsbCgpIGluc3RhbmNlb2YgQ29kZSBhbmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsLnByb3BlcnRpZXMubGVuZ3RoIGlzIDEgYW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbC5wcm9wZXJ0aWVzWzBdLm5hbWU/LnZhbHVlIGluIFsnY2FsbCcsICdhcHBseSddKVxuICAgICAgICAgICAgZm4gICAgICA9IHZhbC5iYXNlPy51bndyYXBBbGwoKSBvciB2YWxcbiAgICAgICAgICAgIHJlZiAgICAgPSBuZXcgSWRlbnRpZmllckxpdGVyYWwgby5zY29wZS5mcmVlVmFyaWFibGUgJ2ZuJ1xuICAgICAgICAgICAgYmFzZSAgICA9IG5ldyBWYWx1ZSByZWZcbiAgICAgICAgICAgIGlmIHZhbC5iYXNlXG4gICAgICAgICAgICAgICAgW3ZhbC5iYXNlLCBiYXNlXSA9IFtiYXNlLCB2YWxdXG4gICAgICAgICAgICBib2R5LmV4cHJlc3Npb25zW2lkeF0gPSBuZXcgQ2FsbCBiYXNlLCBleHByLmFyZ3NcbiAgICAgICAgICAgIGRlZnMgPSBkZWZzLmNvbmNhdCBAbWFrZUNvZGUoQHRhYiksIChuZXcgQXNzaWduKHJlZiwgZm4pLmNvbXBpbGVUb0ZyYWdtZW50cyhvLCBMRVZFTF9UT1ApKSwgQG1ha2VDb2RlKCc7XFxuJylcbiAgICAgICAgZGVmc1xuXG4jICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbiMgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgXG4jICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuXG4jIEEgSmF2YVNjcmlwdCAqc3dpdGNoKiBzdGF0ZW1lbnQuIENvbnZlcnRzIGludG8gYSByZXR1cm5hYmxlIGV4cHJlc3Npb24gb24tZGVtYW5kLlxuXG5leHBvcnRzLlN3aXRjaCA9IGNsYXNzIFN3aXRjaCBleHRlbmRzIEJhc2VcbiAgICBAOiAoQHN1YmplY3QsIEBjYXNlcywgQG90aGVyd2lzZSkgLT5cblxuICAgIGNoaWxkcmVuOiBbJ3N1YmplY3QnLCAnY2FzZXMnLCAnb3RoZXJ3aXNlJ11cblxuICAgIGlzU3RhdGVtZW50OiBZRVNcblxuICAgIGp1bXBzOiAobyA9IHtibG9jazogeWVzfSkgLT5cbiAgICAgICAgZm9yIFtjb25kcywgYmxvY2tdIGluIEBjYXNlc1xuICAgICAgICAgICAgcmV0dXJuIGp1bXBOb2RlIGlmIGp1bXBOb2RlID0gYmxvY2suanVtcHMgb1xuICAgICAgICBAb3RoZXJ3aXNlPy5qdW1wcyBvXG5cbiAgICBtYWtlUmV0dXJuOiAocmVzKSAtPlxuICAgICAgICBwYWlyWzFdLm1ha2VSZXR1cm4gcmVzIGZvciBwYWlyIGluIEBjYXNlc1xuICAgICAgICBAb3RoZXJ3aXNlIG9yPSBuZXcgQmxvY2sgW25ldyBMaXRlcmFsICd2b2lkIDAnXSBpZiByZXNcbiAgICAgICAgQG90aGVyd2lzZT8ubWFrZVJldHVybiByZXNcbiAgICAgICAgdGhpc1xuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBpZHQxID0gby5pbmRlbnQgKyBUQUJcbiAgICAgICAgaWR0MiA9IG8uaW5kZW50ID0gaWR0MSArIFRBQlxuICAgICAgICBmcmFnbWVudHMgPSBbXS5jb25jYXQgQG1ha2VDb2RlKEB0YWIgKyBcInN3aXRjaCAoXCIpLFxuICAgICAgICAgICAgKGlmIEBzdWJqZWN0IHRoZW4gQHN1YmplY3QuY29tcGlsZVRvRnJhZ21lbnRzKG8sIExFVkVMX1BBUkVOKSBlbHNlIEBtYWtlQ29kZSBcImZhbHNlXCIpLFxuICAgICAgICAgICAgQG1ha2VDb2RlKFwiKSB7XFxuXCIpXG4gICAgICAgIGZvciBbY29uZGl0aW9ucywgYmxvY2tdLCBpIGluIEBjYXNlc1xuICAgICAgICAgICAgZm9yIGNvbmQgaW4gZmxhdHRlbiBbY29uZGl0aW9uc11cbiAgICAgICAgICAgICAgICBjb25kICAgID0gY29uZC5pbnZlcnQoKSB1bmxlc3MgQHN1YmplY3RcbiAgICAgICAgICAgICAgICBmcmFnbWVudHMgPSBmcmFnbWVudHMuY29uY2F0IEBtYWtlQ29kZShpZHQxICsgXCJjYXNlIFwiKSwgY29uZC5jb21waWxlVG9GcmFnbWVudHMobywgTEVWRUxfUEFSRU4pLCBAbWFrZUNvZGUoXCI6XFxuXCIpXG4gICAgICAgICAgICBmcmFnbWVudHMgPSBmcmFnbWVudHMuY29uY2F0IGJvZHksIEBtYWtlQ29kZSgnXFxuJykgaWYgKGJvZHkgPSBibG9jay5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfVE9QKS5sZW5ndGggPiAwXG4gICAgICAgICAgICBicmVhayBpZiBpIGlzIEBjYXNlcy5sZW5ndGggLSAxIGFuZCBub3QgQG90aGVyd2lzZVxuICAgICAgICAgICAgZXhwciA9IEBsYXN0Tm9uQ29tbWVudCBibG9jay5leHByZXNzaW9uc1xuICAgICAgICAgICAgY29udGludWUgaWYgZXhwciBpbnN0YW5jZW9mIFJldHVybiBvciAoZXhwciBpbnN0YW5jZW9mIExpdGVyYWwgYW5kIGV4cHIuanVtcHMoKSBhbmQgZXhwci52YWx1ZSAhPSAnZGVidWdnZXInKVxuICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2ggY29uZC5tYWtlQ29kZShpZHQyICsgJ2JyZWFrO1xcbicpXG4gICAgICAgIGlmIEBvdGhlcndpc2UgYW5kIEBvdGhlcndpc2UuZXhwcmVzc2lvbnMubGVuZ3RoXG4gICAgICAgICAgICBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUoaWR0MSArIFwiZGVmYXVsdDpcXG5cIiksIChAb3RoZXJ3aXNlLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9UT1ApLi4uLCBAbWFrZUNvZGUoXCJcXG5cIilcbiAgICAgICAgZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlIEB0YWIgKyAnfSdcbiAgICAgICAgZnJhZ21lbnRzXG5cbiMgMDAwICAwMDAwMDAwMCAgXG4jIDAwMCAgMDAwICAgICAgIFxuIyAwMDAgIDAwMDAwMCAgICBcbiMgMDAwICAwMDAgICAgICAgXG4jIDAwMCAgMDAwICAgICAgIFxuXG4jIElmL2Vsc2Ugc3RhdGVtZW50cy4gQWN0cyBhcyBhbiBleHByZXNzaW9uIGJ5IHB1c2hpbmcgZG93biByZXF1ZXN0ZWQgcmV0dXJucyB0byB0aGUgbGFzdCBsaW5lIG9mIGVhY2ggY2xhdXNlLlxuI1xuIyBTaW5nbGUtZXhwcmVzc2lvbiAqKklmcyoqIGFyZSBjb21waWxlZCBpbnRvIGNvbmRpdGlvbmFsIG9wZXJhdG9ycyBpZiBwb3NzaWJsZSxcbiMgYmVjYXVzZSB0ZXJuYXJpZXMgYXJlIGFscmVhZHkgcHJvcGVyIGV4cHJlc3Npb25zLCBhbmQgZG9uJ3QgbmVlZCBjb252ZXJzaW9uLlxuXG5leHBvcnRzLklmID0gY2xhc3MgSWYgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgQDogKGNvbmRpdGlvbiwgQGJvZHksIG9wdGlvbnMgPSB7fSkgLT5cbiAgICAgICAgQGNvbmRpdGlvbiA9IGlmIG9wdGlvbnMudHlwZSBpcyAndW5sZXNzJyB0aGVuIGNvbmRpdGlvbi5pbnZlcnQoKSBlbHNlIGNvbmRpdGlvblxuICAgICAgICBAZWxzZUJvZHkgID0gbnVsbFxuICAgICAgICBAaXNDaGFpbiAgID0gZmFsc2VcbiAgICAgICAge0Bzb2FrfSAgICA9IG9wdGlvbnNcblxuICAgIGNoaWxkcmVuOiBbJ2NvbmRpdGlvbicsICdib2R5JywgJ2Vsc2VCb2R5J11cblxuICAgIGJvZHlOb2RlOiAgICAgLT4gQGJvZHk/LnVud3JhcCgpXG4gICAgZWxzZUJvZHlOb2RlOiAtPiBAZWxzZUJvZHk/LnVud3JhcCgpXG5cbiAgICAjIFJld3JpdGUgYSBjaGFpbiBvZiAqKklmcyoqIHRvIGFkZCBhIGRlZmF1bHQgY2FzZSBhcyB0aGUgZmluYWwgKmVsc2UqLlxuICAgIFxuICAgIGFkZEVsc2U6IChlbHNlQm9keSkgLT5cbiAgICAgICAgaWYgQGlzQ2hhaW5cbiAgICAgICAgICAgIEBlbHNlQm9keU5vZGUoKS5hZGRFbHNlIGVsc2VCb2R5XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBpc0NoYWluICA9IGVsc2VCb2R5IGluc3RhbmNlb2YgSWZcbiAgICAgICAgICAgIEBlbHNlQm9keSA9IEBlbnN1cmVCbG9jayBlbHNlQm9keVxuICAgICAgICAgICAgQGVsc2VCb2R5LnVwZGF0ZUxvY2F0aW9uRGF0YUlmTWlzc2luZyBlbHNlQm9keS5sb2NhdGlvbkRhdGFcbiAgICAgICAgdGhpc1xuXG4gICAgIyBUaGUgKipJZioqIG9ubHkgY29tcGlsZXMgaW50byBhIHN0YXRlbWVudCBpZiBlaXRoZXIgb2YgaXRzIGJvZGllcyBuZWVkc1xuICAgICMgdG8gYmUgYSBzdGF0ZW1lbnQuIE90aGVyd2lzZSBhIGNvbmRpdGlvbmFsIG9wZXJhdG9yIGlzIHNhZmUuXG4gICAgXG4gICAgaXNTdGF0ZW1lbnQ6IChvKSAtPlxuICAgICAgICBvPy5sZXZlbCBpcyBMRVZFTF9UT1Agb3JcbiAgICAgICAgICAgIEBib2R5Tm9kZSgpLmlzU3RhdGVtZW50KG8pIG9yIEBlbHNlQm9keU5vZGUoKT8uaXNTdGF0ZW1lbnQobylcblxuICAgIGp1bXBzOiAobykgLT4gQGJvZHkuanVtcHMobykgb3IgQGVsc2VCb2R5Py5qdW1wcyhvKVxuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBpZiBAaXNTdGF0ZW1lbnQgbyB0aGVuIEBjb21waWxlU3RhdGVtZW50IG8gZWxzZSBAY29tcGlsZUV4cHJlc3Npb24gb1xuXG4gICAgbWFrZVJldHVybjogKHJlcykgLT5cbiAgICAgICAgQGVsc2VCb2R5ICBvcj0gbmV3IEJsb2NrIFtuZXcgTGl0ZXJhbCAndm9pZCAwJ10gaWYgcmVzXG4gICAgICAgIEBib2R5ICAgICBhbmQ9IG5ldyBCbG9jayBbQGJvZHkubWFrZVJldHVybiByZXNdXG4gICAgICAgIEBlbHNlQm9keSBhbmQ9IG5ldyBCbG9jayBbQGVsc2VCb2R5Lm1ha2VSZXR1cm4gcmVzXVxuICAgICAgICB0aGlzXG5cbiAgICBlbnN1cmVCbG9jazogKG5vZGUpIC0+XG4gICAgICAgIGlmIG5vZGUgaW5zdGFuY2VvZiBCbG9jayB0aGVuIG5vZGUgZWxzZSBuZXcgQmxvY2sgW25vZGVdXG5cbiAgICAjIENvbXBpbGUgdGhlIGBJZmAgYXMgYSByZWd1bGFyICppZi1lbHNlKiBzdGF0ZW1lbnQuIEZsYXR0ZW5lZCBjaGFpbnMgZm9yY2UgaW5uZXIgKmVsc2UqIGJvZGllcyBpbnRvIHN0YXRlbWVudCBmb3JtLlxuICAgIGNvbXBpbGVTdGF0ZW1lbnQ6IChvKSAtPlxuICAgICAgICBjaGlsZCA9IGRlbCBvLCAnY2hhaW5DaGlsZCdcbiAgICAgICAgXG4gICAgICAgICMgY29tbWVudGluZyB0aGlzIG91dCBkb2Vzbid0IGJyZWFrIGFueSB0ZXN0czogd2hhdCB3YXMgdGhpcyBzdXBwb3NlZCB0byBhY2hpZXZlPyAuLi5cbiAgICAgICAgIyBleGVxICA9IGRlbCBvLCAnaXNFeGlzdGVudGlhbEVxdWFscydcbiAgICAgICAgIyBpZiBleGVxXG4gICAgICAgICMgICAgIHJldHVybiBuZXcgSWYoQGNvbmRpdGlvbi5pbnZlcnQoKSwgQGVsc2VCb2R5Tm9kZSgpLCB0eXBlOiAnaWYnKS5jb21waWxlVG9GcmFnbWVudHMgb1xuXG4gICAgICAgIGluZGVudCA9IG8uaW5kZW50ICsgVEFCXG4gICAgICAgIGNvbmQgICA9IEBjb25kaXRpb24uY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX1BBUkVOXG4gICAgICAgIGJvZHkgICA9IEBlbnN1cmVCbG9jayhAYm9keSkuY29tcGlsZVRvRnJhZ21lbnRzIG1lcmdlIG8sIHtpbmRlbnR9XG4gICAgICAgIGlmUGFydCA9IFtdLmNvbmNhdCBAbWFrZUNvZGUoXCJpZiAoXCIpLCBjb25kLCBAbWFrZUNvZGUoXCIpIHtcXG5cIiksIGJvZHksIEBtYWtlQ29kZShcIlxcbiN7QHRhYn19XCIpXG4gICAgICAgIGlmUGFydC51bnNoaWZ0IEBtYWtlQ29kZSBAdGFiIHVubGVzcyBjaGlsZFxuICAgICAgICByZXR1cm4gaWZQYXJ0IHVubGVzcyBAZWxzZUJvZHlcbiAgICAgICAgYW5zd2VyID0gaWZQYXJ0LmNvbmNhdCBAbWFrZUNvZGUoJyBlbHNlICcpXG4gICAgICAgIGlmIEBpc0NoYWluXG4gICAgICAgICAgICBvLmNoYWluQ2hpbGQgPSB5ZXNcbiAgICAgICAgICAgIGFuc3dlciA9IGFuc3dlci5jb25jYXQgQGVsc2VCb2R5LnVud3JhcCgpLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9UT1BcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgYW5zd2VyID0gYW5zd2VyLmNvbmNhdCBAbWFrZUNvZGUoXCJ7XFxuXCIpLCBAZWxzZUJvZHkuY29tcGlsZVRvRnJhZ21lbnRzKG1lcmdlKG8sIHtpbmRlbnR9KSwgTEVWRUxfVE9QKSwgQG1ha2VDb2RlKFwiXFxuI3tAdGFifX1cIilcbiAgICAgICAgYW5zd2VyXG5cbiAgICAjIENvbXBpbGUgdGhlIGBJZmAgYXMgYSBjb25kaXRpb25hbCBvcGVyYXRvci5cbiAgICBjb21waWxlRXhwcmVzc2lvbjogKG8pIC0+XG4gICAgICAgIGNvbmQgPSBAY29uZGl0aW9uLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9DT05EXG4gICAgICAgIGJvZHkgPSBAYm9keU5vZGUoKS5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfTElTVFxuICAgICAgICBhbHQgID0gaWYgQGVsc2VCb2R5Tm9kZSgpIHRoZW4gQGVsc2VCb2R5Tm9kZSgpLmNvbXBpbGVUb0ZyYWdtZW50cyhvLCBMRVZFTF9MSVNUKSBlbHNlIFtAbWFrZUNvZGUoJ3ZvaWQgMCcpXVxuICAgICAgICBmcmFnbWVudHMgPSBjb25kLmNvbmNhdCBAbWFrZUNvZGUoXCIgPyBcIiksIGJvZHksIEBtYWtlQ29kZShcIiA6IFwiKSwgYWx0XG4gICAgICAgIGlmIG8ubGV2ZWwgPj0gTEVWRUxfQ09ORCB0aGVuIEB3cmFwSW5CcmFjZXMgZnJhZ21lbnRzIGVsc2UgZnJhZ21lbnRzXG5cbiAgICB1bmZvbGRTb2FrOiAtPlxuICAgICAgICBAc29hayBhbmQgdGhpc1xuXG4jIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIFxuIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgXG4jIDAwMCAwIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIFxuXG5leHBvcnRzLk1ldGFJZiA9IGNsYXNzIE1ldGFJZiBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBAOiAoQGNvbmRpdGlvbiwgQGJvZHksIG9wdGlvbnMgPSB7fSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBlbHNlQm9keSA9IG51bGxcbiAgICAgICAgQGlzQ2hhaW4gID0gZmFsc2VcbiAgICAgICAgeyBAc29hayB9ID0gb3B0aW9uc1xuXG4gICAgY2hpbGRyZW46IFsnY29uZGl0aW9uJywgJ2JvZHknLCAnZWxzZUJvZHknXVxuXG4gICAgIyBSZXdyaXRlIGEgY2hhaW4gb2YgSWZzIHRvIGFkZCBhIGRlZmF1bHQgY2FzZSBhcyB0aGUgZmluYWwgZWxzZS5cbiAgICBcbiAgICBhZGRFbHNlOiAoZWxzZUJvZHkpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAaXNDaGFpblxuICAgICAgICAgICAgQGVsc2VCb2R5Py51bndyYXAoKS5hZGRFbHNlIGVsc2VCb2R5XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBpc0NoYWluICA9IGVsc2VCb2R5IGluc3RhbmNlb2YgTWV0YUlmXG4gICAgICAgICAgICBAZWxzZUJvZHkgPSBAZW5zdXJlQmxvY2sgZWxzZUJvZHlcbiAgICAgICAgICAgIEBlbHNlQm9keS51cGRhdGVMb2NhdGlvbkRhdGFJZk1pc3NpbmcgZWxzZUJvZHkubG9jYXRpb25EYXRhXG4gICAgICAgIHRoaXNcblxuICAgIG1ha2VSZXR1cm46IChyZXMpIC0+XG4gICAgICAgIFxuICAgICAgICBAZWxzZUJvZHkgIG9yPSBuZXcgQmxvY2sgW25ldyBMaXRlcmFsICd2b2lkIDAnXSBpZiByZXNcbiAgICAgICAgIyBAYm9keSAgICAgYW5kPSBuZXcgQmxvY2sgW0Bib2R5Lm1ha2VSZXR1cm4gcmVzXVxuICAgICAgICBAZWxzZUJvZHkgYW5kPSBuZXcgQmxvY2sgW0BlbHNlQm9keS5tYWtlUmV0dXJuIHJlc11cbiAgICAgICAgdGhpc1xuICAgIFxuICAgICMgVGhlIElmIG9ubHkgY29tcGlsZXMgaW50byBhIHN0YXRlbWVudCBpZiBlaXRoZXIgb2YgaXRzIGJvZGllcyBuZWVkc1xuICAgICMgdG8gYmUgYSBzdGF0ZW1lbnQuIE90aGVyd2lzZSBhIGNvbmRpdGlvbmFsIG9wZXJhdG9yIGlzIHNhZmUuXG4gICAgXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICAgICAgICBcbiAgICAgICAgIyBsb2cgJ01ldGFJZiBjb21waWxlU3RhdGVtZW50IEBjb25kaXRpb25cXG4nLCBzdHJpbmdpZnkgQGNvbmRpdGlvblxuICAgICAgICBcbiAgICAgICAgY29tcGlsZU1ldGFJZiBub2RlOkAsIG9wdHM6b1xuICAgICAgICBcbiAgICBlbnN1cmVCbG9jazogKG5vZGUpIC0+IGlmIG5vZGUgaW5zdGFuY2VvZiBCbG9jayB0aGVuIG5vZGUgZWxzZSBuZXcgQmxvY2sgW25vZGVdXG4gICAgdW5mb2xkU29hazogLT4gQHNvYWsgYW5kIHRoaXNcbiAgICBqdW1wczogKG8pIC0+IEBib2R5Lmp1bXBzKG8pIG9yIEBlbHNlQm9keT8uanVtcHMobylcbiAgICAgICAgXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgIFxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcblxuVVRJTElUSUVTID1cblxuICAgICMgQ29ycmVjdGx5IHNldCB1cCBhIHByb3RvdHlwZSBjaGFpbiBmb3IgaW5oZXJpdGFuY2UsIGluY2x1ZGluZyBhIHJlZmVyZW5jZVxuICAgICMgdG8gdGhlIHN1cGVyY2xhc3MgZm9yIGBzdXBlcigpYCBjYWxscywgYW5kIGNvcGllcyBvZiBhbnkgc3RhdGljIHByb3BlcnRpZXMuXG4gICAgICAgIFxuICAgIGV4dGVuZDogKG8pIC0+IFwiXG4gICAgICAgIGZ1bmN0aW9uKGNoaWxkLCBwYXJlbnQpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoI3t1dGlsaXR5ICdoYXNQcm9wJywgb30ocGFyZW50LCBrZXkpKSBjaGlsZFtrZXldID0gcGFyZW50W2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmdW5jdGlvbiBjdG9yKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN0b3IucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTtcbiAgICAgICAgICAgIGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7XG4gICAgICAgICAgICBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlO1xuICAgICAgICAgICAgcmV0dXJuIGNoaWxkO1xuICAgICAgICB9XG4gICAgXCJcblxuICAgICMgQ3JlYXRlIGEgZnVuY3Rpb24gYm91bmQgdG8gdGhlIGN1cnJlbnQgdmFsdWUgb2YgXCJ0aGlzXCIuXG4gICAgYmluZDogLT4gJ1xuICAgICAgICBmdW5jdGlvbihmbiwgbWUpe1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KG1lLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICdcblxuICAgICMgRGlzY292ZXIgaWYgYW4gaXRlbSBpcyBpbiBhbiBhcnJheS5cbiAgICBpbmRleE9mOiAtPiBcIltdLmluZGV4T2ZcIlxuICAgICMgaW5kZXhPZjogLT4gXCJcbiAgICAgICAgIyBbXS5pbmRleE9mIHx8IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgICMgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgICMgaWYgKGkgaW4gdGhpcyAmJiB0aGlzW2ldID09PSBpdGVtKSByZXR1cm4gaTtcbiAgICAgICAgICAgICMgfVxuICAgICAgICAgICAgIyByZXR1cm4gLTE7XG4gICAgICAgICMgfVxuICAgICMgXCJcblxuICAgIG1vZHVsbzogLT4gXCJcIlwiXG4gICAgICAgIGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuICgrYSAlIChiID0gK2IpICsgYikgJSBiOyB9XG4gICAgXCJcIlwiXG5cbiAgICAjIFNob3J0Y3V0cyB0byBzcGVlZCB1cCB0aGUgbG9va3VwIHRpbWUgZm9yIG5hdGl2ZSBmdW5jdGlvbnMuXG4gICAgaGFzUHJvcDogLT4gJ09iamVjdC5oYXNPd24nXG4gICAgc2xpY2U6IC0+ICdbXS5zbGljZScgIyBlLmcuIFtbYV0uLi5dXG5cbiMgTGV2ZWxzIGluZGljYXRlIGEgbm9kZSdzIHBvc2l0aW9uIGluIHRoZSBBU1QuIFVzZWZ1bCBmb3Iga25vd2luZyBpZlxuIyBwYXJlbnMgYXJlIG5lY2Vzc2FyeSBvciBzdXBlcmZsdW91cy5cbkxFVkVMX1RPUCAgICA9IDEgICAgIyAuLi47XG5MRVZFTF9QQVJFTiAgPSAyICAgICMgKC4uLilcbkxFVkVMX0xJU1QgICA9IDMgICAgIyBbLi4uXVxuTEVWRUxfQ09ORCAgID0gNCAgICAjIC4uLiA/IHggOiB5XG5MRVZFTF9PUCAgICAgPSA1ICAgICMgIS4uLlxuTEVWRUxfQUNDRVNTID0gNiAgICAjIC4uLlswXVxuXG5UQUIgPSAnICAgICcgIyBUYWJzIGFyZSA0IHNwYWNlcyBmb3IgcHJldHR5IHByaW50aW5nLlxuXG5TSU1QTEVOVU0gPSAvXlsrLV0/XFxkKyQvXG5cbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcblxuIyBIZWxwZXIgZm9yIGVuc3VyaW5nIHRoYXQgdXRpbGl0eSBmdW5jdGlvbnMgYXJlIGFzc2lnbmVkIGF0IHRoZSB0b3AgbGV2ZWwuXG4gICAgXG51dGlsaXR5ID0gKG5hbWUsIG8pIC0+XG4gICAge3Jvb3R9ID0gby5zY29wZVxuICAgIGlmIG5hbWUgb2Ygcm9vdC51dGlsaXRpZXNcbiAgICAgICAgcm9vdC51dGlsaXRpZXNbbmFtZV1cbiAgICBlbHNlXG4gICAgICAgIHJlZiA9IHJvb3QuZnJlZVZhcmlhYmxlIG5hbWVcbiAgICAgICAgcm9vdC5hc3NpZ24gcmVmLCBVVElMSVRJRVNbbmFtZV0gbyAjIDwtIGFkZHMgdXRpbGl0eSB0byB0b3AgbGV2ZWwgc2NvcGVcbiAgICAgICAgcm9vdC51dGlsaXRpZXNbbmFtZV0gPSByZWZcblxubXVsdGlkZW50ID0gKGNvZGUsIHRhYikgLT5cbiAgICBjb2RlID0gY29kZS5yZXBsYWNlIC9cXG4vZywgJyQmJyArIHRhYlxuICAgIGNvZGUucmVwbGFjZSAvXFxzKyQvLCAnJ1xuXG5pc0xpdGVyYWxBcmd1bWVudHMgPSAobm9kZSkgLT5cbiAgICBub2RlIGluc3RhbmNlb2YgSWRlbnRpZmllckxpdGVyYWwgYW5kIG5vZGUudmFsdWUgaXMgJ2FyZ3VtZW50cydcblxuaXNMaXRlcmFsVGhpcyA9IChub2RlKSAtPlxuICAgIG5vZGUgaW5zdGFuY2VvZiBUaGlzTGl0ZXJhbCBvclxuICAgICAgICAobm9kZSBpbnN0YW5jZW9mIENvZGUgYW5kIG5vZGUuYm91bmQpIG9yXG4gICAgICAgIG5vZGUgaW5zdGFuY2VvZiBTdXBlckNhbGxcblxuaXNDb21wbGV4T3JBc3NpZ25hYmxlID0gKG5vZGUpIC0+IG5vZGUuaXNDb21wbGV4KCkgb3Igbm9kZS5pc0Fzc2lnbmFibGU/KClcblxuIyBVbmZvbGQgYSBub2RlJ3MgY2hpbGQgaWYgc29haywgdGhlbiB0dWNrIHRoZSBub2RlIHVuZGVyIGNyZWF0ZWQgYElmYFxuXG51bmZvbGRTb2FrID0gKG8sIHBhcmVudCwgbmFtZSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIGlmbiA9IHBhcmVudFtuYW1lXS51bmZvbGRTb2FrIG9cbiAgICBwYXJlbnRbbmFtZV0gPSBpZm4uYm9keVxuICAgIGlmbi5ib2R5ID0gbmV3IFZhbHVlIHBhcmVudFxuICAgIGlmblxuIl19
//# sourceURL=../coffee/nodes.coffee