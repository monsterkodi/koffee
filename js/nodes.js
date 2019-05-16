// koffee 0.42.0

/*
000   000   0000000   0000000    00000000   0000000  
0000  000  000   000  000   000  000       000       
000 0 000  000   000  000   000  0000000   0000000   
000  0000  000   000  000   000  000            000  
000   000   0000000   0000000    00000000  0000000
 */
var Access, Arr, Assign, Base, Block, BooleanLiteral, Call, Class, Code, CodeFragment, Comment, Existence, Expansion, ExportAllDeclaration, ExportDeclaration, ExportDefaultDeclaration, ExportNamedDeclaration, ExportSpecifier, ExportSpecifierList, Extends, For, IdentifierLiteral, If, ImportClause, ImportDeclaration, ImportDefaultSpecifier, ImportNamespaceSpecifier, ImportSpecifier, ImportSpecifierList, In, Index, InfinityLiteral, JS_FORBIDDEN, LEVEL_ACCESS, LEVEL_COND, LEVEL_LIST, LEVEL_OP, LEVEL_PAREN, LEVEL_TOP, Literal, MetaIf, ModuleDeclaration, ModuleSpecifier, ModuleSpecifierList, NEGATE, NO, NaNLiteral, NullLiteral, NumberLiteral, Obj, Op, Param, Parens, PassthroughLiteral, PropertyName, Range, RegexLiteral, RegexWithInterpolations, Return, SIMPLENUM, Scope, Slice, Splat, StatementLiteral, StringLiteral, StringWithInterpolations, SuperCall, Switch, TAB, THIS, TaggedTemplateCall, ThisLiteral, Throw, Try, UTILITIES, UndefinedLiteral, Value, While, YES, YieldReturn, addLocationDataFn, compact, compileMetaIf, del, ends, extend, flatten, hasFeature, injectFeature, injectMeta, isComplexOrAssignable, isLiteralArguments, isLiteralThis, isUnassignable, locationDataToString, merge, multident, ref1, ref2, ref3, some, starts, stringify, throwSyntaxError, unfoldSoak, utility,
    extend1 = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
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
                    if (func(child) === false) {
                        return this;
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
                        console.log('[33m[93mnodes[33m[2m.[22m[2mcoffee[22m[39m[2m[34m:[39m[22m[94m337[39m', '[1m[97mno unshift?[39m[22m');

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
        if (Object.prototype.hasOwnProperty.call(o.scope.positions, varBase.value) && o.scope.variables[o.scope.positions[varBase.value]].type === 'import') {
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
                guardPart = "\n" + idt1 + "if (!" + (utility('hasProp', o)) + ".call(" + svar + ", " + kvar + ")) continue;";
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
        return "function(child, parent) { for (var key in parent) { if (" + (utility('hasProp', o)) + ".call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; }";
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
        return '{}.hasOwnProperty';
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZXMuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLG93Q0FBQTtJQUFBOzs7OztBQWFBLEtBQUssQ0FBQyxlQUFOLEdBQXdCOztBQUV4QixLQUFBLEdBQVEsT0FBQSxDQUFRLFNBQVI7O0FBQ1IsT0FBbUMsT0FBQSxDQUFRLFNBQVIsQ0FBbkMsRUFBRSxvQ0FBRixFQUFrQjs7QUFFaEIsYUFBZSxPQUFBLENBQVEsUUFBUjs7QUFDakIsT0FBZ0MsT0FBQSxDQUFRLFlBQVIsQ0FBaEMsRUFBRSxrQ0FBRixFQUFpQjs7QUFDakIsT0FDMkUsT0FBQSxDQUFRLFdBQVIsQ0FEM0UsRUFBRSxzQkFBRixFQUFXLHNCQUFYLEVBQW9CLG9CQUFwQixFQUE0QixrQkFBNUIsRUFBbUMsY0FBbkMsRUFBd0Msb0JBQXhDLEVBQWdELGdCQUFoRCxFQUFzRCxnQkFBdEQsRUFDRSwwQ0FERixFQUNxQixnREFEckIsRUFDMkMsd0NBRDNDLEVBQzZEOztBQUUzRCxnQkFBa0IsT0FBQSxDQUFRLFFBQVI7O0FBRXBCLE9BQU8sQ0FBQyxNQUFSLEdBQWlCOztBQUNqQixPQUFPLENBQUMsaUJBQVIsR0FBNEI7O0FBRTVCLEdBQUEsR0FBVSxTQUFBO1dBQUc7QUFBSDs7QUFDVixFQUFBLEdBQVUsU0FBQTtXQUFHO0FBQUg7O0FBQ1YsSUFBQSxHQUFVLFNBQUE7V0FBRztBQUFIOztBQUNWLE1BQUEsR0FBVSxTQUFBO0lBQUcsSUFBQyxDQUFBLE9BQUQsR0FBVyxDQUFJLElBQUMsQ0FBQTtXQUFTO0FBQTVCOztBQWFWLE9BQU8sQ0FBQyxZQUFSLEdBQTZCO0lBRXRCLHNCQUFDLE1BQUQsRUFBUyxJQUFUO0FBRUMsWUFBQTtRQUFBLElBQUMsQ0FBQSxJQUFELEdBQVEsRUFBQSxHQUFHO1FBQ1gsSUFBQyxDQUFBLFlBQUQsb0JBQWdCLE1BQU0sQ0FBRTtRQUN4QixJQUFDLENBQUEsSUFBRCwrREFB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QUksQ0FBQztBQUFuQzs7QUFJeEIsVUFBQSxHQUFhLFNBQUMsQ0FBRCxFQUFJLE1BQUosRUFBWSxJQUFaO0FBQ1QsUUFBQTtJQUFBLElBQUEsQ0FBYyxDQUFBLEdBQUEsR0FBTSxNQUFPLENBQUEsSUFBQSxDQUFLLENBQUMsVUFBYixDQUF3QixDQUF4QixDQUFOLENBQWQ7QUFBQSxlQUFBOztJQUNBLE1BQU8sQ0FBQSxJQUFBLENBQVAsR0FBZSxHQUFHLENBQUM7SUFDbkIsR0FBRyxDQUFDLElBQUosR0FBVyxJQUFJLEtBQUosQ0FBVSxNQUFWO1dBQ1g7QUFKUyIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAgICAwMDAwMDAwICBcbjAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4wMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbjAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwICAgXG4jIyNcblxuIyBDb250YWlucyBhbGwgb2YgdGhlIG5vZGUgY2xhc3NlcyBmb3IgdGhlIHN5bnRheCB0cmVlLiBcbiMgTW9zdCBub2RlcyBhcmUgY3JlYXRlZCBhcyB0aGUgcmVzdWx0IG9mIGFjdGlvbnMgaW4gdGhlIGdyYW1tYXIsXG4jIGJ1dCBzb21lIGFyZSBjcmVhdGVkIGJ5IG90aGVyIG5vZGVzIGFzIGEgbWV0aG9kIG9mIGNvZGUgZ2VuZXJhdGlvbi4gXG4jIFRvIGNvbnZlcnQgdGhlIHN5bnRheCB0cmVlIGludG8gYSBzdHJpbmcgb2YgSmF2YVNjcmlwdCBjb2RlLCBjYWxsIGBjb21waWxlKClgIG9uIHRoZSByb290LlxuXG5FcnJvci5zdGFja1RyYWNlTGltaXQgPSBJbmZpbml0eVxuXG5TY29wZSA9IHJlcXVpcmUgJy4vc2NvcGUnXG57IGlzVW5hc3NpZ25hYmxlLCBKU19GT1JCSURERU4gfSA9IHJlcXVpcmUgJy4vbGV4ZXInXG5cbnsgaW5qZWN0TWV0YSB9ID0gcmVxdWlyZSAnLi9tZXRhJ1xueyBpbmplY3RGZWF0dXJlLCBoYXNGZWF0dXJlIH0gPSByZXF1aXJlICcuL2ZlYXR1cmVzJ1xueyBjb21wYWN0LCBmbGF0dGVuLCBleHRlbmQsIG1lcmdlLCBkZWwsIHN0YXJ0cywgZW5kcywgc29tZSxcbiAgYWRkTG9jYXRpb25EYXRhRm4sIGxvY2F0aW9uRGF0YVRvU3RyaW5nLCB0aHJvd1N5bnRheEVycm9yLCBzdHJpbmdpZnkgfSA9IHJlcXVpcmUgJy4vaGVscGVycydcblxueyBjb21waWxlTWV0YUlmIH0gPSByZXF1aXJlICcuL21ldGEnXG4gIFxuZXhwb3J0cy5leHRlbmQgPSBleHRlbmRcbmV4cG9ydHMuYWRkTG9jYXRpb25EYXRhRm4gPSBhZGRMb2NhdGlvbkRhdGFGblxuXG5ZRVMgICAgID0gLT4geWVzXG5OTyAgICAgID0gLT4gbm9cblRISVMgICAgPSAtPiB0aGlzXG5ORUdBVEUgID0gLT4gQG5lZ2F0ZWQgPSBub3QgQG5lZ2F0ZWQ7IHRoaXNcblxuIyAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAgICAwMDAgICAgIFxuIyAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAgICAwMDAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAgICAwMDAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuXG4jIFRoZSB2YXJpb3VzIG5vZGVzIGRlZmluZWQgYmVsb3cgYWxsIGNvbXBpbGUgdG8gYSBjb2xsZWN0aW9uIG9mIENvZGVGcmFnbWVudCBvYmplY3RzLlxuIyBBIENvZGVGcmFnbWVudHMgaXMgYSBibG9jayBvZiBnZW5lcmF0ZWQgY29kZSwgYW5kIHRoZSBsb2NhdGlvbiBpbiB0aGUgc291cmNlIGZpbGUgd2hlcmUgdGhlIGNvZGVcbiMgY2FtZSBmcm9tLiBDb2RlRnJhZ21lbnRzIGNhbiBiZSBhc3NlbWJsZWQgdG9nZXRoZXIgaW50byB3b3JraW5nIGNvZGUganVzdCBieSBjYXR0aW5nIHRvZ2V0aGVyXG4jIGFsbCB0aGUgQ29kZUZyYWdtZW50cycgYGNvZGVgIHNuaXBwZXRzLCBpbiBvcmRlci5cblxuZXhwb3J0cy5Db2RlRnJhZ21lbnQgPSBjbGFzcyBDb2RlRnJhZ21lbnRcbiAgICBcbiAgICBAOiAocGFyZW50LCBjb2RlKSAtPlxuICAgICAgICBcbiAgICAgICAgQGNvZGUgPSBcIiN7Y29kZX1cIlxuICAgICAgICBAbG9jYXRpb25EYXRhID0gcGFyZW50Py5sb2NhdGlvbkRhdGFcbiAgICAgICAgQHR5cGUgPSBwYXJlbnQ/LmNvbnN0cnVjdG9yPy5uYW1lIG9yICd1bmtub3duJ1xuXG4gICAgdG9TdHJpbmc6IC0+XG4gICAgICAgIFxuICAgICAgICBcIiN7QGNvZGV9I3tpZiBAbG9jYXRpb25EYXRhIHRoZW4gXCI6IFwiICsgbG9jYXRpb25EYXRhVG9TdHJpbmcoQGxvY2F0aW9uRGF0YSkgZWxzZSAnJ31cIlxuXG4jIDAwMDAwMDAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIFxuIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICBcblxuIyBUaGUgKipCYXNlKiogaXMgdGhlIGFic3RyYWN0IGJhc2UgY2xhc3MgZm9yIGFsbCBub2RlcyBpbiB0aGUgc3ludGF4IHRyZWUuXG4jIEVhY2ggc3ViY2xhc3MgaW1wbGVtZW50cyB0aGUgYGNvbXBpbGVOb2RlYCBtZXRob2QsIHdoaWNoIHBlcmZvcm1zIHRoZVxuIyBjb2RlIGdlbmVyYXRpb24gZm9yIHRoYXQgbm9kZS4gVG8gY29tcGlsZSBhIG5vZGUgdG8gSmF2YVNjcmlwdCxcbiMgY2FsbCBgY29tcGlsZWAgb24gaXQsIHdoaWNoIHdyYXBzIGBjb21waWxlTm9kZWAgaW4gc29tZSBnZW5lcmljIGV4dHJhIHNtYXJ0cyxcbiMgdG8ga25vdyB3aGVuIHRoZSBnZW5lcmF0ZWQgY29kZSBuZWVkcyB0byBiZSB3cmFwcGVkIHVwIGluIGEgY2xvc3VyZS5cbiMgQW4gb3B0aW9ucyBoYXNoIGlzIHBhc3NlZCBhbmQgY2xvbmVkIHRocm91Z2hvdXQsIGNvbnRhaW5pbmcgaW5mb3JtYXRpb24gYWJvdXRcbiMgdGhlIGVudmlyb25tZW50IGZyb20gaGlnaGVyIGluIHRoZSB0cmVlIChzdWNoIGFzIGlmIGEgcmV0dXJuZWQgdmFsdWUgaXNcbiMgYmVpbmcgcmVxdWVzdGVkIGJ5IHRoZSBzdXJyb3VuZGluZyBmdW5jdGlvbiksIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50XG4jIHNjb3BlLCBhbmQgaW5kZW50YXRpb24gbGV2ZWwuXG5cbmV4cG9ydHMuQmFzZSA9IGNsYXNzIEJhc2VcblxuICAgIGZyYWdtZW50c1RvVGV4dDogKGZyYWdtZW50cykgLT4gIyBDb252ZXJ0IGFuIGFycmF5IG9mIENvZGVGcmFnbWVudHMgaW50byBhIHN0cmluZy5cbiAgICBcbiAgICAgICAgKGZyYWdtZW50LmNvZGUgZm9yIGZyYWdtZW50IGluIGZyYWdtZW50cykuam9pbignJylcbiAgICBcbiAgICBjb21waWxlOiAobywgbHZsKSAtPiBAZnJhZ21lbnRzVG9UZXh0IEBjb21waWxlVG9GcmFnbWVudHMgbywgbHZsXG5cbiAgICAjIENvbW1vbiBsb2dpYyBmb3IgZGV0ZXJtaW5pbmcgd2hldGhlciB0byB3cmFwIHRoaXMgbm9kZSBpbiBhIGNsb3N1cmUgYmVmb3JlIGNvbXBpbGluZyBpdCwgb3IgdG8gY29tcGlsZSBkaXJlY3RseS4gXG4gICAgIyBXZSBuZWVkIHRvIHdyYXAgaWYgdGhpcyBub2RlIGlzIGEgc3RhdGVtZW50LCBhbmQgaXQncyBub3QgYSBwdXJlU3RhdGVtZW50LCBhbmQgd2UncmUgbm90IGF0IHRoZSB0b3AgbGV2ZWwgb2YgYSBibG9jayAod2hpY2ggd291bGQgYmUgdW5uZWNlc3NhcnkpLCBcbiAgICAjIGFuZCB3ZSBoYXZlbid0IGFscmVhZHkgYmVlbiBhc2tlZCB0byByZXR1cm4gdGhlIHJlc3VsdCAoYmVjYXVzZSBzdGF0ZW1lbnRzIGtub3cgaG93IHRvIHJldHVybiByZXN1bHRzKS5cbiAgICBcbiAgICBjb21waWxlVG9GcmFnbWVudHM6IChvLCBsdmwpIC0+XG4gICAgICAgIFxuICAgICAgICBvID0gaW5qZWN0RmVhdHVyZSBvXG4gICAgICAgIG8gPSBpbmplY3RNZXRhICAgIG9cblxuICAgICAgICBvLmxldmVsICA9IGx2bCBpZiBsdmxcbiAgICAgICAgbm9kZSAgICAgPSBAdW5mb2xkU29hayhvKSBvciB0aGlzXG4gICAgICAgIG5vZGUudGFiID0gby5pbmRlbnRcbiAgICAgICAgaWYgby5sZXZlbCBpcyBMRVZFTF9UT1Agb3Igbm90IG5vZGUuaXNTdGF0ZW1lbnQobylcbiAgICAgICAgICAgIG5vZGUuY29tcGlsZU5vZGUgb1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBub2RlLmNvbXBpbGVDbG9zdXJlIG9cblxuICAgICMgU3RhdGVtZW50cyBjb252ZXJ0ZWQgaW50byBleHByZXNzaW9ucyB2aWEgY2xvc3VyZS13cmFwcGluZyBzaGFyZSBhIHNjb3BlXG4gICAgIyBvYmplY3Qgd2l0aCB0aGVpciBwYXJlbnQgY2xvc3VyZSwgdG8gcHJlc2VydmUgdGhlIGV4cGVjdGVkIGxleGljYWwgc2NvcGUuXG4gICAgXG4gICAgY29tcGlsZUNsb3N1cmU6IChvKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYganVtcE5vZGUgPSBAanVtcHMoKVxuICAgICAgICAgICAganVtcE5vZGUuZXJyb3IgJ2Nhbm5vdCB1c2UgYSBwdXJlIHN0YXRlbWVudCBpbiBhbiBleHByZXNzaW9uJ1xuICAgICAgICBvLnNoYXJlZFNjb3BlID0geWVzXG4gICAgICAgIGZ1bmMgPSBuZXcgQ29kZSBbXSwgQmxvY2sud3JhcCBbdGhpc11cbiAgICAgICAgYXJncyA9IFtdXG4gICAgICAgIGlmIChhcmd1bWVudHNOb2RlID0gQGNvbnRhaW5zIGlzTGl0ZXJhbEFyZ3VtZW50cykgb3IgQGNvbnRhaW5zIGlzTGl0ZXJhbFRoaXNcbiAgICAgICAgICAgIGFyZ3MgPSBbbmV3IFRoaXNMaXRlcmFsXVxuICAgICAgICAgICAgaWYgYXJndW1lbnRzTm9kZVxuICAgICAgICAgICAgICAgIG1ldGggPSAnYXBwbHknXG4gICAgICAgICAgICAgICAgYXJncy5wdXNoIG5ldyBJZGVudGlmaWVyTGl0ZXJhbCAnYXJndW1lbnRzJ1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIG1ldGggPSAnY2FsbCdcbiAgICAgICAgICAgIGZ1bmMgPSBuZXcgVmFsdWUgZnVuYywgW25ldyBBY2Nlc3MgbmV3IFByb3BlcnR5TmFtZSBtZXRoXVxuICAgICAgICBwYXJ0cyA9IChuZXcgQ2FsbCBmdW5jLCBhcmdzKS5jb21waWxlTm9kZSBvXG4gICAgICAgIGlmIGZ1bmMuaXNHZW5lcmF0b3Igb3IgZnVuYy5iYXNlPy5pc0dlbmVyYXRvclxuICAgICAgICAgICAgcGFydHMudW5zaGlmdCBAbWFrZUNvZGUgXCIoeWllbGQqIFwiXG4gICAgICAgICAgICBwYXJ0cy5wdXNoICAgIEBtYWtlQ29kZSBcIilcIlxuICAgICAgICBwYXJ0c1xuXG4gICAgIyBJZiB0aGUgY29kZSBnZW5lcmF0aW9uIHdpc2hlcyB0byB1c2UgdGhlIHJlc3VsdCBvZiBhIGNvbXBsZXggZXhwcmVzc2lvblxuICAgICMgaW4gbXVsdGlwbGUgcGxhY2VzLCBlbnN1cmUgdGhhdCB0aGUgZXhwcmVzc2lvbiBpcyBvbmx5IGV2ZXIgZXZhbHVhdGVkIG9uY2UsXG4gICAgIyBieSBhc3NpZ25pbmcgaXQgdG8gYSB0ZW1wb3JhcnkgdmFyaWFibGUuIFBhc3MgYSBsZXZlbCB0byBwcmVjb21waWxlLlxuICAgICNcbiAgICAjIElmIGBsZXZlbGAgaXMgcGFzc2VkLCB0aGVuIHJldHVybnMgYFt2YWwsIHJlZl1gLCB3aGVyZSBgdmFsYCBpcyB0aGUgY29tcGlsZWQgdmFsdWUsIGFuZCBgcmVmYFxuICAgICMgaXMgdGhlIGNvbXBpbGVkIHJlZmVyZW5jZS4gSWYgYGxldmVsYCBpcyBub3QgcGFzc2VkLCB0aGlzIHJldHVybnMgYFt2YWwsIHJlZl1gIHdoZXJlXG4gICAgIyB0aGUgdHdvIHZhbHVlcyBhcmUgcmF3IG5vZGVzIHdoaWNoIGhhdmUgbm90IGJlZW4gY29tcGlsZWQuXG4gICAgXG4gICAgY2FjaGU6IChvLCBsZXZlbCwgaXNDb21wbGV4KSAtPlxuICAgICAgICBcbiAgICAgICAgY29tcGxleCA9IGlmIGlzQ29tcGxleD8gdGhlbiBpc0NvbXBsZXggdGhpcyBlbHNlIEBpc0NvbXBsZXgoKVxuICAgICAgICBpZiBjb21wbGV4XG4gICAgICAgICAgICByZWYgPSBuZXcgSWRlbnRpZmllckxpdGVyYWwgby5zY29wZS5mcmVlVmFyaWFibGUgJ3JlZidcbiAgICAgICAgICAgIHN1YiA9IG5ldyBBc3NpZ24gcmVmLCB0aGlzXG4gICAgICAgICAgICBpZiBsZXZlbCB0aGVuIFtzdWIuY29tcGlsZVRvRnJhZ21lbnRzKG8sIGxldmVsKSwgW0BtYWtlQ29kZShyZWYudmFsdWUpXV0gZWxzZSBbc3ViLCByZWZdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJlZiA9IGlmIGxldmVsIHRoZW4gQGNvbXBpbGVUb0ZyYWdtZW50cyBvLCBsZXZlbCBlbHNlIHRoaXNcbiAgICAgICAgICAgIFtyZWYsIHJlZl1cblxuICAgIGNhY2hlVG9Db2RlRnJhZ21lbnRzOiAoY2FjaGVWYWx1ZXMpIC0+XG4gICAgICAgIFxuICAgICAgICBbQGZyYWdtZW50c1RvVGV4dChjYWNoZVZhbHVlc1swXSksIEBmcmFnbWVudHNUb1RleHQoY2FjaGVWYWx1ZXNbMV0pXVxuXG4gICAgIyBDb25zdHJ1Y3QgYSBub2RlIHRoYXQgcmV0dXJucyB0aGUgY3VycmVudCBub2RlJ3MgcmVzdWx0LlxuICAgICMgVGhpcyBpcyBvdmVycmlkZGVuIGZvciBzbWFydGVyIGJlaGF2aW9yIGZvciBtYW55IHN0YXRlbWVudCBub2RlcyAoZS5nLiBJZiwgRm9yKS4uLlxuICAgIFxuICAgIG1ha2VSZXR1cm46IChyZXMpIC0+XG4gICAgICAgIG1lID0gQHVud3JhcEFsbCgpXG4gICAgICAgIGlmIHJlc1xuICAgICAgICAgICAgbmV3IENhbGwgbmV3IExpdGVyYWwoXCIje3Jlc30ucHVzaFwiKSwgW21lXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBuZXcgUmV0dXJuIG1lXG5cbiAgICAjIERvZXMgdGhpcyBub2RlLCBvciBhbnkgb2YgaXRzIGNoaWxkcmVuLCBjb250YWluIGEgbm9kZSBvZiBhIGNlcnRhaW4ga2luZD9cbiAgICAjIFJlY3Vyc2l2ZWx5IHRyYXZlcnNlcyBkb3duIHRoZSAqY2hpbGRyZW4qIG5vZGVzIGFuZCByZXR1cm5zIHRoZSBmaXJzdCBvbmVcbiAgICAjIHRoYXQgdmVyaWZpZXMgYHByZWRgLiBPdGhlcndpc2UgcmV0dXJuIHVuZGVmaW5lZC4gYGNvbnRhaW5zYCBkb2VzIG5vdCBjcm9zc1xuICAgICMgc2NvcGUgYm91bmRhcmllcy5cbiAgICBcbiAgICBjb250YWluczogKHByZWQpIC0+XG4gICAgICAgIG5vZGUgPSB1bmRlZmluZWRcbiAgICAgICAgQHRyYXZlcnNlQ2hpbGRyZW4gbm8sIChuKSAtPlxuICAgICAgICAgICAgaWYgcHJlZCBuXG4gICAgICAgICAgICAgICAgbm9kZSA9IG5cbiAgICAgICAgICAgICAgICByZXR1cm4gbm9cbiAgICAgICAgbm9kZVxuXG4gICAgbGFzdE5vbkNvbW1lbnQ6IChsaXN0KSAtPiAjIFB1bGwgb3V0IHRoZSBsYXN0IG5vbi1jb21tZW50IG5vZGUgb2YgYSBub2RlIGxpc3QuXG4gICAgICAgIGkgPSBsaXN0Lmxlbmd0aFxuICAgICAgICByZXR1cm4gbGlzdFtpXSB3aGlsZSBpLS0gd2hlbiBsaXN0W2ldIG5vdCBpbnN0YW5jZW9mIENvbW1lbnRcbiAgICAgICAgbnVsbFxuXG4gICAgIyBgdG9TdHJpbmdgIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBub2RlLCBmb3IgaW5zcGVjdGluZyB0aGUgcGFyc2UgdHJlZS5cbiAgICAjIFRoaXMgaXMgd2hhdCBgY29mZmVlIC0tbm9kZXNgIHByaW50cyBvdXQuXG4gICAgXG4gICAgdG9TdHJpbmc6IChpZHQgPSAnJywgbmFtZSA9IEBjb25zdHJ1Y3Rvci5uYW1lKSAtPlxuICAgICAgICB0cmVlID0gJ1xcbicgKyBpZHQgKyBuYW1lXG4gICAgICAgIHRyZWUgKz0gJz8nIGlmIEBzb2FrXG4gICAgICAgIEBlYWNoQ2hpbGQgKG5vZGUpIC0+IHRyZWUgKz0gbm9kZS50b1N0cmluZyBpZHQgKyBUQUJcbiAgICAgICAgdHJlZVxuXG4gICAgIyBQYXNzZXMgZWFjaCBjaGlsZCB0byBhIGZ1bmN0aW9uLCBicmVha2luZyB3aGVuIHRoZSBmdW5jdGlvbiByZXR1cm5zIGBmYWxzZWAuXG4gICAgXG4gICAgZWFjaENoaWxkOiAoZnVuYykgLT5cbiAgICAgICAgcmV0dXJuIHRoaXMgdW5sZXNzIEBjaGlsZHJlblxuICAgICAgICBmb3IgYXR0ciBpbiBAY2hpbGRyZW4gd2hlbiBAW2F0dHJdXG4gICAgICAgICAgICBmb3IgY2hpbGQgaW4gZmxhdHRlbiBbQFthdHRyXV1cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcyBpZiBmdW5jKGNoaWxkKSBpcyBmYWxzZVxuICAgICAgICB0aGlzXG5cbiAgICB0cmF2ZXJzZUNoaWxkcmVuOiAoY3Jvc3NTY29wZSwgZnVuYykgLT5cbiAgICAgICAgXG4gICAgICAgIEBlYWNoQ2hpbGQgKGNoaWxkKSAtPlxuICAgICAgICAgICAgcmVjdXIgPSBmdW5jKGNoaWxkKVxuICAgICAgICAgICAgY2hpbGQudHJhdmVyc2VDaGlsZHJlbihjcm9zc1Njb3BlLCBmdW5jKSB1bmxlc3MgcmVjdXIgaXMgbm9cblxuICAgIGludmVydDogLT5cbiAgICAgICAgbmV3IE9wICchJywgdGhpc1xuXG4gICAgdW53cmFwQWxsOiAtPlxuICAgICAgICBub2RlID0gdGhpc1xuICAgICAgICBjb250aW51ZSB1bnRpbCBub2RlIGlzIG5vZGUgPSBub2RlLnVud3JhcCgpXG4gICAgICAgIG5vZGVcblxuICAgICMgRGVmYXVsdCBpbXBsZW1lbnRhdGlvbnMgb2YgdGhlIGNvbW1vbiBub2RlIHByb3BlcnRpZXMgYW5kIG1ldGhvZHMuIE5vZGVzXG4gICAgIyB3aWxsIG92ZXJyaWRlIHRoZXNlIHdpdGggY3VzdG9tIGxvZ2ljLCBpZiBuZWVkZWQuXG4gICAgXG4gICAgY2hpbGRyZW46ICAgICBbXVxuICAgIGlzU3RhdGVtZW50OiAgTk9cbiAgICBqdW1wczogICAgICAgIE5PXG4gICAgaXNDb21wbGV4OiAgICBZRVNcbiAgICBpc0NoYWluYWJsZTogIE5PXG4gICAgaXNBc3NpZ25hYmxlOiBOT1xuICAgIGlzTnVtYmVyOiAgICAgTk9cbiAgICB1bndyYXA6ICAgICAgIFRISVNcbiAgICB1bmZvbGRTb2FrOiAgIE5PXG5cbiAgICBhc3NpZ25zOiAgICAgIE5PICMgSXMgdGhpcyBub2RlIHVzZWQgdG8gYXNzaWduIGEgY2VydGFpbiB2YXJpYWJsZT9cblxuICAgICMgRm9yIHRoaXMgbm9kZSBhbmQgYWxsIGRlc2NlbmRlbnRzLCBzZXQgdGhlIGxvY2F0aW9uIGRhdGEgdG8gYGxvY2F0aW9uRGF0YWBcbiAgICAjIGlmIHRoZSBsb2NhdGlvbiBkYXRhIGlzIG5vdCBhbHJlYWR5IHNldC5cbiAgICBcbiAgICB1cGRhdGVMb2NhdGlvbkRhdGFJZk1pc3Npbmc6IChsb2NhdGlvbkRhdGEpIC0+XG4gICAgICAgIHJldHVybiB0aGlzIGlmIEBsb2NhdGlvbkRhdGFcbiAgICAgICAgQGxvY2F0aW9uRGF0YSA9IGxvY2F0aW9uRGF0YVxuXG4gICAgICAgIEBlYWNoQ2hpbGQgKGNoaWxkKSAtPlxuICAgICAgICAgICAgY2hpbGQudXBkYXRlTG9jYXRpb25EYXRhSWZNaXNzaW5nIGxvY2F0aW9uRGF0YVxuXG4gICAgZXJyb3I6IChtZXNzYWdlKSAtPiAjIFRocm93IGEgU3ludGF4RXJyb3IgYXNzb2NpYXRlZCB3aXRoIHRoaXMgbm9kZSdzIGxvY2F0aW9uLlxuICAgICAgICBcbiAgICAgICAgdGhyb3dTeW50YXhFcnJvciBtb2R1bGU6XCJub2Rlcy4je0Bjb25zdHJ1Y3Rvci5uYW1lfVwiLCBtZXNzYWdlOm1lc3NhZ2UsIGxvY2F0aW9uOkBsb2NhdGlvbkRhdGFcblxuICAgIG1ha2VDb2RlOiAoY29kZSkgLT5cbiAgICAgICAgbmV3IENvZGVGcmFnbWVudCB0aGlzLCBjb2RlXG5cbiAgICB3cmFwSW5CcmFjZXM6IChmcmFnbWVudHMpIC0+XG4gICAgICAgIFtdLmNvbmNhdCBAbWFrZUNvZGUoJygnKSwgZnJhZ21lbnRzLCBAbWFrZUNvZGUoJyknKVxuXG4gICAgIyBgZnJhZ21lbnRzTGlzdGAgaXMgYW4gYXJyYXkgb2YgYXJyYXlzIG9mIGZyYWdtZW50cy4gRWFjaCBhcnJheSBpbiBmcmFnbWVudHNMaXN0IHdpbGwgYmVcbiAgICAjIGNvbmNhdG9uYXRlZCB0b2dldGhlciwgd2l0aCBgam9pblN0cmAgYWRkZWQgaW4gYmV0d2VlbiBlYWNoLCB0byBwcm9kdWNlIGEgZmluYWwgZmxhdCBhcnJheVxuICAgICMgb2YgZnJhZ21lbnRzLlxuICAgIFxuICAgIGpvaW5GcmFnbWVudEFycmF5czogKGZyYWdtZW50c0xpc3QsIGpvaW5TdHIpIC0+XG4gICAgICAgIGFuc3dlciA9IFtdXG4gICAgICAgIGZvciBmcmFnbWVudHMsaSBpbiBmcmFnbWVudHNMaXN0XG4gICAgICAgICAgICBpZiBpIHRoZW4gYW5zd2VyLnB1c2ggQG1ha2VDb2RlIGpvaW5TdHJcbiAgICAgICAgICAgIGFuc3dlciA9IGFuc3dlci5jb25jYXQgZnJhZ21lbnRzXG4gICAgICAgIGFuc3dlclxuXG4jIDAwMDAwMDAgICAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgIFxuIyAwMDAwMDAwICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICBcbiMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuXG4jIFRoZSBibG9jayBpcyB0aGUgbGlzdCBvZiBleHByZXNzaW9ucyB0aGF0IGZvcm1zIHRoZSBib2R5IG9mIGFuIGluZGVudGVkIGJsb2NrIG9mIGNvZGUgXG4jIC0tIHRoZSBpbXBsZW1lbnRhdGlvbiBvZiBhIGZ1bmN0aW9uLCBhIGNsYXVzZSBpbiBhbiBgaWZgLCBgc3dpdGNoYCwgb3IgYHRyeWAsIGFuZCBzbyBvbi4uLlxuXG5leHBvcnRzLkJsb2NrID0gY2xhc3MgQmxvY2sgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgQDogKG5vZGVzKSAtPiBAZXhwcmVzc2lvbnMgPSBjb21wYWN0IGZsYXR0ZW4gbm9kZXMgb3IgW11cblxuICAgIGNoaWxkcmVuOiBbJ2V4cHJlc3Npb25zJ11cblxuICAgIHB1c2g6IChub2RlKSAtPiAjIFRhY2sgYW4gZXhwcmVzc2lvbiBvbiB0byB0aGUgZW5kIG9mIHRoaXMgZXhwcmVzc2lvbiBsaXN0LlxuICAgICAgICBcbiAgICAgICAgQGV4cHJlc3Npb25zLnB1c2ggbm9kZVxuICAgICAgICB0aGlzXG5cbiAgICBwb3A6IC0+ICMgUmVtb3ZlIGFuZCByZXR1cm4gdGhlIGxhc3QgZXhwcmVzc2lvbiBvZiB0aGlzIGV4cHJlc3Npb24gbGlzdC5cbiAgICAgICAgXG4gICAgICAgIEBleHByZXNzaW9ucy5wb3AoKVxuXG4gICAgdW5zaGlmdDogKG5vZGUpIC0+ICMgQWRkIGFuIGV4cHJlc3Npb24gYXQgdGhlIGJlZ2lubmluZyBvZiB0aGlzIGV4cHJlc3Npb24gbGlzdC5cbiAgICAgICAgXG4gICAgICAgIEBleHByZXNzaW9ucy51bnNoaWZ0IG5vZGVcbiAgICAgICAgdGhpc1xuXG4gICAgIyBJZiB0aGlzIEJsb2NrIGNvbnNpc3RzIG9mIGp1c3QgYSBzaW5nbGUgbm9kZSwgdW53cmFwIGl0IGJ5IHB1bGxpbmcgaXQgYmFjayBvdXQuXG4gICAgXG4gICAgdW53cmFwOiAtPlxuICAgICAgICBpZiBAZXhwcmVzc2lvbnMubGVuZ3RoIGlzIDEgdGhlbiBAZXhwcmVzc2lvbnNbMF0gZWxzZSB0aGlzXG5cbiAgICBpc0VtcHR5OiAtPiAjIElzIHRoaXMgYW4gZW1wdHkgYmxvY2sgb2YgY29kZT9cbiAgICAgICAgbm90IEBleHByZXNzaW9ucy5sZW5ndGhcblxuICAgIGlzU3RhdGVtZW50OiAobykgLT5cbiAgICAgICAgZm9yIGV4cCBpbiBAZXhwcmVzc2lvbnMgd2hlbiBleHAuaXNTdGF0ZW1lbnQgb1xuICAgICAgICAgICAgcmV0dXJuIHllc1xuICAgICAgICBub1xuXG4gICAganVtcHM6IChvKSAtPlxuICAgICAgICBmb3IgZXhwIGluIEBleHByZXNzaW9uc1xuICAgICAgICAgICAgcmV0dXJuIGp1bXBOb2RlIGlmIGp1bXBOb2RlID0gZXhwLmp1bXBzIG9cblxuICAgICMgQSBCbG9jayBub2RlIGRvZXMgbm90IHJldHVybiBpdHMgZW50aXJlIGJvZHksIHJhdGhlciBpdCBlbnN1cmVzIHRoYXQgdGhlIGZpbmFsIGV4cHJlc3Npb24gaXMgcmV0dXJuZWQuXG4gICAgXG4gICAgbWFrZVJldHVybjogKHJlcykgLT5cbiAgICAgICAgXG4gICAgICAgIGxlbiA9IEBleHByZXNzaW9ucy5sZW5ndGhcbiAgICAgICAgd2hpbGUgbGVuLS1cbiAgICAgICAgICAgIGV4cHIgPSBAZXhwcmVzc2lvbnNbbGVuXVxuICAgICAgICAgICAgaWYgZXhwciBub3QgaW5zdGFuY2VvZiBDb21tZW50XG4gICAgICAgICAgICAgICAgQGV4cHJlc3Npb25zW2xlbl0gPSBleHByLm1ha2VSZXR1cm4gcmVzXG4gICAgICAgICAgICAgICAgQGV4cHJlc3Npb25zLnNwbGljZShsZW4sIDEpIGlmIGV4cHIgaW5zdGFuY2VvZiBSZXR1cm4gYW5kIG5vdCBleHByLmV4cHJlc3Npb25cbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICB0aGlzXG5cbiAgICAjIEEgQmxvY2sgaXMgdGhlIG9ubHkgbm9kZSB0aGF0IGNhbiBzZXJ2ZSBhcyB0aGUgcm9vdC5cbiAgICBcbiAgICBjb21waWxlVG9GcmFnbWVudHM6IChvID0ge30sIGxldmVsKSAtPlxuICAgICAgICBpZiBvLnNjb3BlIHRoZW4gc3VwZXIgbywgbGV2ZWwgZWxzZSBAY29tcGlsZVJvb3Qgb1xuXG4gICAgIyBDb21waWxlIGFsbCBleHByZXNzaW9ucyB3aXRoaW4gdGhlIEJsb2NrIGJvZHkuIFxuICAgICMgSWYgd2UgbmVlZCB0byByZXR1cm4gdGhlIHJlc3VsdCwgYW5kIGl0J3MgYW4gZXhwcmVzc2lvbiwgc2ltcGx5IHJldHVybiBpdC4gXG4gICAgIyBJZiBpdCdzIGEgc3RhdGVtZW50LCBhc2sgdGhlIHN0YXRlbWVudCB0byBkbyBzby5cbiAgICBcbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIFxuICAgICAgICBAdGFiID0gby5pbmRlbnRcbiAgICAgICAgdG9wICA9IG8ubGV2ZWwgaXMgTEVWRUxfVE9QXG4gICAgICAgIGNvbXBpbGVkTm9kZXMgPSBbXVxuXG4gICAgICAgIGZvciBub2RlLCBpbmRleCBpbiBAZXhwcmVzc2lvbnNcblxuICAgICAgICAgICAgbm9kZSA9IG5vZGUudW53cmFwQWxsKClcbiAgICAgICAgICAgIG5vZGUgPSAobm9kZS51bmZvbGRTb2FrKG8pIG9yIG5vZGUpXG4gICAgICAgICAgICBpZiBub2RlIGluc3RhbmNlb2YgQmxvY2tcbiAgICAgICAgICAgICAgICAjIFRoaXMgaXMgYSBuZXN0ZWQgYmxvY2suIFdlIGRvbid0IGRvIGFueXRoaW5nIHNwZWNpYWwgaGVyZSBsaWtlIGVuY2xvc2UgaXQgaW4gYSBuZXcgc2NvcGUuXG4gICAgICAgICAgICAgICAgIyBXZSBqdXN0IGNvbXBpbGUgdGhlIHN0YXRlbWVudHMgaW4gdGhpcyBibG9jayBhbG9uZyB3aXRoIG91ciBvd25cbiAgICAgICAgICAgICAgICBjb21waWxlZE5vZGVzLnB1c2ggbm9kZS5jb21waWxlTm9kZSBvXG4gICAgICAgICAgICBlbHNlIGlmIHRvcFxuICAgICAgICAgICAgICAgIG5vZGUuZnJvbnQgPSB0cnVlXG4gICAgICAgICAgICAgICAgZnJhZ21lbnRzID0gbm9kZS5jb21waWxlVG9GcmFnbWVudHMgb1xuICAgICAgICAgICAgICAgIGlmIG5vdCBub2RlLmlzU3RhdGVtZW50KG8pIGFuZCBmcmFnbWVudHMudW5zaGlmdD9cbiAgICAgICAgICAgICAgICAgICAg4pa4YXNzZXJ0ICdubyB1bnNoaWZ0PycgZnJhZ21lbnRzPy51bnNoaWZ0P1xuICAgICAgICAgICAgICAgICAgICBmcmFnbWVudHMudW5zaGlmdCBAbWFrZUNvZGUgXCIje0B0YWJ9XCJcbiAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlIFwiO1wiXG4gICAgICAgICAgICAgICAgY29tcGlsZWROb2Rlcy5wdXNoIGZyYWdtZW50c1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGNvbXBpbGVkTm9kZXMucHVzaCBub2RlLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9MSVNUXG4gICAgICAgIGlmIHRvcFxuICAgICAgICAgICAgaWYgQHNwYWNlZFxuICAgICAgICAgICAgICAgIHJldHVybiBbXS5jb25jYXQgQGpvaW5GcmFnbWVudEFycmF5cyhjb21waWxlZE5vZGVzLCAnXFxuXFxuJyksIEBtYWtlQ29kZShcIlxcblwiKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBAam9pbkZyYWdtZW50QXJyYXlzKGNvbXBpbGVkTm9kZXMsICdcXG4nKVxuICAgICAgICBpZiBjb21waWxlZE5vZGVzLmxlbmd0aFxuICAgICAgICAgICAgYW5zd2VyID0gQGpvaW5GcmFnbWVudEFycmF5cyhjb21waWxlZE5vZGVzLCAnLCAnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBhbnN3ZXIgPSBbQG1ha2VDb2RlIFwidm9pZCAwXCJdXG4gICAgICAgIGlmIGNvbXBpbGVkTm9kZXMubGVuZ3RoID4gMSBhbmQgby5sZXZlbCA+PSBMRVZFTF9MSVNUIHRoZW4gQHdyYXBJbkJyYWNlcyBhbnN3ZXIgZWxzZSBhbnN3ZXJcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICBcbiAgICAjIElmIHdlIGhhcHBlbiB0byBiZSB0aGUgdG9wLWxldmVsIEJsb2NrLCB3cmFwIGV2ZXJ5dGhpbmcgaW4gYSBzYWZldHkgY2xvc3VyZSwgdW5sZXNzIHJlcXVlc3RlZCBub3QgdG8uXG4gICAgIyBJdCB3b3VsZCBiZSBiZXR0ZXIgbm90IHRvIGdlbmVyYXRlIHRoZW0gaW4gdGhlIGZpcnN0IHBsYWNlLCBidXQgZm9yIG5vdywgY2xlYW4gdXAgb2J2aW91cyBkb3VibGUtcGFyZW50aGVzZXMuXG4gICAgXG4gICAgY29tcGlsZVJvb3Q6IChvKSAtPlxuICAgICAgICBcbiAgICAgICAgIyBvMiA9IE9iamVjdC5hc3NpZ24ge30sIG9cbiAgICAgICAgIyBkZWxldGUgbzIucmVmZXJlbmNlZFZhcnMgXG4gICAgICAgICMgbG9nICdCbG9jay5jb21waWxlUm9vdCcsIG8yXG4gICAgICAgIFxuICAgICAgICBvLmluZGVudCA9IGlmIG8uYmFyZSB0aGVuICcnIGVsc2UgVEFCXG4gICAgICAgIG8ubGV2ZWwgID0gTEVWRUxfVE9QXG4gICAgICAgIEBzcGFjZWQgID0geWVzXG4gICAgICAgIG8uc2NvcGUgID0gbmV3IFNjb3BlIG51bGwsIHRoaXMsIG51bGwsIG8ucmVmZXJlbmNlZFZhcnMgPyBbXVxuICAgICAgICBcbiAgICAgICAgIyBNYXJrIGdpdmVuIGxvY2FsIHZhcmlhYmxlcyBpbiB0aGUgcm9vdCBzY29wZSBhcyBwYXJhbWV0ZXJzIHNvIHRoZXkgZG9uJ3QgZW5kIHVwIGJlaW5nIGRlY2xhcmVkIG9uIHRoaXMgYmxvY2suXG4gICAgICAgIFxuICAgICAgICBvLnNjb3BlLnBhcmFtZXRlciBuYW1lIGZvciBuYW1lIGluIG8ubG9jYWxzIG9yIFtdXG4gICAgICAgIHByZWx1ZGUgPSBbXVxuICAgICAgICBpZiBub3Qgby5iYXJlXG4gICAgICAgICAgICBwcmVsdWRlRXhwcyA9IGZvciBleHAsIGkgaW4gQGV4cHJlc3Npb25zXG4gICAgICAgICAgICAgICAgYnJlYWsgdW5sZXNzIGV4cC51bndyYXAoKSBpbnN0YW5jZW9mIENvbW1lbnRcbiAgICAgICAgICAgICAgICBleHBcbiAgICAgICAgICAgIHJlc3QgPSBAZXhwcmVzc2lvbnNbcHJlbHVkZUV4cHMubGVuZ3RoLi4uXVxuICAgICAgICAgICAgQGV4cHJlc3Npb25zID0gcHJlbHVkZUV4cHNcbiAgICAgICAgICAgIGlmIHByZWx1ZGVFeHBzLmxlbmd0aFxuICAgICAgICAgICAgICAgIHByZWx1ZGUgPSBAY29tcGlsZU5vZGUgbWVyZ2UobywgaW5kZW50OiAnJylcbiAgICAgICAgICAgICAgICBwcmVsdWRlLnB1c2ggQG1ha2VDb2RlIFwiXFxuXCJcbiAgICAgICAgICAgIEBleHByZXNzaW9ucyA9IHJlc3RcbiAgICAgICAgZnJhZ21lbnRzID0gQGNvbXBpbGVXaXRoRGVjbGFyYXRpb25zIG9cbiAgICAgICAgcmV0dXJuIGZyYWdtZW50cyBpZiBvLmJhcmVcbiAgICAgICAgW10uY29uY2F0IHByZWx1ZGUsIEBtYWtlQ29kZShcIihmdW5jdGlvbigpIHtcXG5cIiksIGZyYWdtZW50cywgQG1ha2VDb2RlKFwiXFxufSkuY2FsbCh0aGlzKTtcXG5cIilcblxuICAgICMgQ29tcGlsZSB0aGUgZXhwcmVzc2lvbnMgYm9keSBmb3IgdGhlIGNvbnRlbnRzIG9mIGEgZnVuY3Rpb24sIHdpdGggZGVjbGFyYXRpb25zIG9mIGFsbCBpbm5lciB2YXJpYWJsZXMgcHVzaGVkIHVwIHRvIHRoZSB0b3AuXG4gICAgXG4gICAgY29tcGlsZVdpdGhEZWNsYXJhdGlvbnM6IChvKSAtPlxuICAgICAgICBcbiAgICAgICAgZnJhZ21lbnRzID0gW11cbiAgICAgICAgcG9zdCA9IFtdXG4gICAgICAgIGZvciBleHAsIGkgaW4gQGV4cHJlc3Npb25zXG4gICAgICAgICAgICBleHAgPSBleHAudW53cmFwKClcbiAgICAgICAgICAgIGJyZWFrIHVubGVzcyBleHAgaW5zdGFuY2VvZiBDb21tZW50IG9yIGV4cCBpbnN0YW5jZW9mIExpdGVyYWxcbiAgICAgICAgbyA9IG1lcmdlKG8sIGxldmVsOiBMRVZFTF9UT1ApXG4gICAgICAgIGlmIGlcbiAgICAgICAgICAgIHJlc3QgPSBAZXhwcmVzc2lvbnMuc3BsaWNlIGksIDllOVxuICAgICAgICAgICAgW3NwYWNlZCwgICAgICAgIEBzcGFjZWRdID0gW0BzcGFjZWQsIG5vXVxuICAgICAgICAgICAgW2ZyYWdtZW50cywgQHNwYWNlZF0gPSBbQGNvbXBpbGVOb2RlKG8pLCBzcGFjZWRdXG4gICAgICAgICAgICBAZXhwcmVzc2lvbnMgPSByZXN0XG4gICAgICAgIHBvc3QgPSBAY29tcGlsZU5vZGUgb1xuICAgICAgICB7c2NvcGV9ID0gb1xuICAgICAgICBpZiBzY29wZS5leHByZXNzaW9ucyBpcyB0aGlzXG4gICAgICAgICAgICBkZWNsYXJzID0gby5zY29wZS5oYXNEZWNsYXJhdGlvbnMoKVxuICAgICAgICAgICAgYXNzaWducyA9IHNjb3BlLmhhc0Fzc2lnbm1lbnRzXG4gICAgICAgICAgICBpZiBkZWNsYXJzIG9yIGFzc2lnbnNcbiAgICAgICAgICAgICAgICBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUgJ1xcbicgaWYgaVxuICAgICAgICAgICAgICAgIGZyYWdtZW50cy5wdXNoIEBtYWtlQ29kZSBcIiN7QHRhYn12YXIgXCJcbiAgICAgICAgICAgICAgICBpZiBkZWNsYXJzXG4gICAgICAgICAgICAgICAgICAgIGZyYWdtZW50cy5wdXNoIEBtYWtlQ29kZSBzY29wZS5kZWNsYXJlZFZhcmlhYmxlcygpLmpvaW4oJywgJylcbiAgICAgICAgICAgICAgICBpZiBhc3NpZ25zXG4gICAgICAgICAgICAgICAgICAgIGZyYWdtZW50cy5wdXNoIEBtYWtlQ29kZSBcIixcXG4je0B0YWIgKyBUQUJ9XCIgaWYgZGVjbGFyc1xuICAgICAgICAgICAgICAgICAgICBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUgc2NvcGUuYXNzaWduZWRWYXJpYWJsZXMoKS5qb2luKFwiLFxcbiN7QHRhYiArIFRBQn1cIilcbiAgICAgICAgICAgICAgICBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUgXCI7XFxuI3tpZiBAc3BhY2VkIHRoZW4gJ1xcbicgZWxzZSAnJ31cIlxuICAgICAgICAgICAgZWxzZSBpZiBmcmFnbWVudHMubGVuZ3RoIGFuZCBwb3N0Lmxlbmd0aFxuICAgICAgICAgICAgICAgIGZyYWdtZW50cy5wdXNoIEBtYWtlQ29kZSBcIlxcblwiXG4gICAgICAgIGZyYWdtZW50cy5jb25jYXQgcG9zdFxuXG4gICAgIyBXcmFwIHVwIHRoZSBnaXZlbiBub2RlcyBhcyBhICoqQmxvY2sqKiwgdW5sZXNzIGl0IGFscmVhZHkgaGFwcGVucyB0byBiZSBvbmUuXG4gICAgXG4gICAgQHdyYXA6IChub2RlcykgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBub2Rlc1swXSBpZiBub2Rlcy5sZW5ndGggaXMgMSBhbmQgbm9kZXNbMF0gaW5zdGFuY2VvZiBCbG9ja1xuICAgICAgICBuZXcgQmxvY2sgbm9kZXNcblxuIyAwMDAgICAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICBcbiMgMDAwICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgXG4jIDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgICAgIFxuIyAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICBcbiMgMDAwMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgXG5cbiMgYExpdGVyYWxgIGlzIGEgYmFzZSBjbGFzcyBmb3Igc3RhdGljIHZhbHVlcyB0aGF0IGNhbiBiZSBwYXNzZWQgdGhyb3VnaCBkaXJlY3RseSBpbnRvIEphdmFTY3JpcHQgd2l0aG91dCB0cmFuc2xhdGlvbiwgXG4jIHN1Y2ggYXM6IHN0cmluZ3MsIG51bWJlcnMsIGB0cnVlYCwgYGZhbHNlYCwgYG51bGxgLi4uXG5cbmV4cG9ydHMuTGl0ZXJhbCA9IGNsYXNzIExpdGVyYWwgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgQDogKEB2YWx1ZSkgLT5cblxuICAgIGlzQ29tcGxleDogTk9cblxuICAgIGFzc2lnbnM6IChuYW1lKSAtPlxuICAgICAgICBuYW1lIGlzIEB2YWx1ZVxuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBbQG1ha2VDb2RlIEB2YWx1ZV1cblxuICAgIHRvU3RyaW5nOiAtPlxuICAgICAgICBcIiAje2lmIEBpc1N0YXRlbWVudCgpIHRoZW4gc3VwZXIgZWxzZSBAY29uc3RydWN0b3IubmFtZX06ICN7QHZhbHVlfVwiXG5cbmV4cG9ydHMuTnVtYmVyTGl0ZXJhbCA9IGNsYXNzIE51bWJlckxpdGVyYWwgZXh0ZW5kcyBMaXRlcmFsXG5cbmV4cG9ydHMuSW5maW5pdHlMaXRlcmFsID0gY2xhc3MgSW5maW5pdHlMaXRlcmFsIGV4dGVuZHMgTnVtYmVyTGl0ZXJhbFxuICAgIGNvbXBpbGVOb2RlOiAtPlxuICAgICAgICBbQG1ha2VDb2RlICcyZTMwOCddXG5cbmV4cG9ydHMuTmFOTGl0ZXJhbCA9IGNsYXNzIE5hTkxpdGVyYWwgZXh0ZW5kcyBOdW1iZXJMaXRlcmFsXG4gICAgQDogLT5cbiAgICAgICAgc3VwZXIgJ05hTidcblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgY29kZSA9IFtAbWFrZUNvZGUgJzAvMCddXG4gICAgICAgIGlmIG8ubGV2ZWwgPj0gTEVWRUxfT1AgdGhlbiBAd3JhcEluQnJhY2VzIGNvZGUgZWxzZSBjb2RlXG5cbmV4cG9ydHMuU3RyaW5nTGl0ZXJhbCA9IGNsYXNzIFN0cmluZ0xpdGVyYWwgZXh0ZW5kcyBMaXRlcmFsXG5cbmV4cG9ydHMuUmVnZXhMaXRlcmFsID0gY2xhc3MgUmVnZXhMaXRlcmFsIGV4dGVuZHMgTGl0ZXJhbFxuXG5leHBvcnRzLlBhc3N0aHJvdWdoTGl0ZXJhbCA9IGNsYXNzIFBhc3N0aHJvdWdoTGl0ZXJhbCBleHRlbmRzIExpdGVyYWxcblxuZXhwb3J0cy5JZGVudGlmaWVyTGl0ZXJhbCA9IGNsYXNzIElkZW50aWZpZXJMaXRlcmFsIGV4dGVuZHMgTGl0ZXJhbFxuICAgIGlzQXNzaWduYWJsZTogWUVTXG5cbmV4cG9ydHMuUHJvcGVydHlOYW1lID0gY2xhc3MgUHJvcGVydHlOYW1lIGV4dGVuZHMgTGl0ZXJhbFxuICAgIGlzQXNzaWduYWJsZTogWUVTXG5cbmV4cG9ydHMuU3RhdGVtZW50TGl0ZXJhbCA9IGNsYXNzIFN0YXRlbWVudExpdGVyYWwgZXh0ZW5kcyBMaXRlcmFsXG4gICAgaXNTdGF0ZW1lbnQ6IFlFU1xuXG4gICAgbWFrZVJldHVybjogVEhJU1xuXG4gICAganVtcHM6IChvKSAtPlxuICAgICAgICByZXR1cm4gdGhpcyBpZiBAdmFsdWUgaXMgJ2JyZWFrJyBhbmQgbm90IChvPy5sb29wIG9yIG8/LmJsb2NrKVxuICAgICAgICByZXR1cm4gdGhpcyBpZiBAdmFsdWUgaXMgJ2NvbnRpbnVlJyBhbmQgbm90IG8/Lmxvb3BcblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgW0BtYWtlQ29kZSBcIiN7QHRhYn0je0B2YWx1ZX07XCJdXG5cbmV4cG9ydHMuVGhpc0xpdGVyYWwgPSBjbGFzcyBUaGlzTGl0ZXJhbCBleHRlbmRzIExpdGVyYWxcbiAgICBAOiAtPlxuICAgICAgICBzdXBlciAndGhpcydcblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgY29kZSA9IGlmIG8uc2NvcGUubWV0aG9kPy5ib3VuZCB0aGVuIG8uc2NvcGUubWV0aG9kLmNvbnRleHQgZWxzZSBAdmFsdWVcbiAgICAgICAgW0BtYWtlQ29kZSBjb2RlXVxuXG5leHBvcnRzLlVuZGVmaW5lZExpdGVyYWwgPSBjbGFzcyBVbmRlZmluZWRMaXRlcmFsIGV4dGVuZHMgTGl0ZXJhbFxuICAgIEA6IC0+XG4gICAgICAgIHN1cGVyICd1bmRlZmluZWQnXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIFtAbWFrZUNvZGUgaWYgby5sZXZlbCA+PSBMRVZFTF9BQ0NFU1MgdGhlbiAnKHZvaWQgMCknIGVsc2UgJ3ZvaWQgMCddXG5cbmV4cG9ydHMuTnVsbExpdGVyYWwgPSBjbGFzcyBOdWxsTGl0ZXJhbCBleHRlbmRzIExpdGVyYWxcbiAgICBAOiAtPlxuICAgICAgICBzdXBlciAnbnVsbCdcblxuZXhwb3J0cy5Cb29sZWFuTGl0ZXJhbCA9IGNsYXNzIEJvb2xlYW5MaXRlcmFsIGV4dGVuZHMgTGl0ZXJhbFxuXG4jIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4jIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAwIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG5cbiMgQSBgcmV0dXJuYCBpcyBhICpwdXJlU3RhdGVtZW50KiAtLSB3cmFwcGluZyBpdCBpbiBhIGNsb3N1cmUgd291bGRuJ3QgbWFrZSBzZW5zZS5cblxuZXhwb3J0cy5SZXR1cm4gPSBjbGFzcyBSZXR1cm4gZXh0ZW5kcyBCYXNlXG4gICAgQDogKEBleHByZXNzaW9uKSAtPlxuXG4gICAgY2hpbGRyZW46IFsnZXhwcmVzc2lvbiddXG5cbiAgICBpc1N0YXRlbWVudDogWUVTXG4gICAgbWFrZVJldHVybjogIFRISVNcbiAgICBqdW1wczogICAgICAgVEhJU1xuXG4gICAgY29tcGlsZVRvRnJhZ21lbnRzOiAobywgbGV2ZWwpIC0+XG4gICAgICAgIGV4cHIgPSBAZXhwcmVzc2lvbj8ubWFrZVJldHVybigpXG4gICAgICAgIGlmIGV4cHIgYW5kIGV4cHIgbm90IGluc3RhbmNlb2YgUmV0dXJuIHRoZW4gZXhwci5jb21waWxlVG9GcmFnbWVudHMgbywgbGV2ZWwgZWxzZSBzdXBlciBvLCBsZXZlbFxuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBhbnN3ZXIgPSBbXVxuICAgICAgICAjIFRPRE86IElmIHdlIGNhbGwgZXhwcmVzc2lvbi5jb21waWxlKCkgaGVyZSB0d2ljZSwgd2UnbGwgc29tZXRpbWVzIGdldCBiYWNrIGRpZmZlcmVudCByZXN1bHRzIVxuICAgICAgICBhbnN3ZXIucHVzaCBAbWFrZUNvZGUgQHRhYiArIFwicmV0dXJuI3tpZiBAZXhwcmVzc2lvbiB0aGVuIFwiIFwiIGVsc2UgXCJcIn1cIlxuICAgICAgICBpZiBAZXhwcmVzc2lvblxuICAgICAgICAgICAgYW5zd2VyID0gYW5zd2VyLmNvbmNhdCBAZXhwcmVzc2lvbi5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfUEFSRU5cbiAgICAgICAgYW5zd2VyLnB1c2ggQG1ha2VDb2RlIFwiO1wiXG4gICAgICAgIHJldHVybiBhbnN3ZXJcblxuIyBgeWllbGQgcmV0dXJuYCB3b3JrcyBleGFjdGx5IGxpa2UgYHJldHVybmAsIGV4Y2VwdCB0aGF0IGl0IHR1cm5zIHRoZSBmdW5jdGlvbiBpbnRvIGEgZ2VuZXJhdG9yLlxuXG5leHBvcnRzLllpZWxkUmV0dXJuID0gY2xhc3MgWWllbGRSZXR1cm4gZXh0ZW5kcyBSZXR1cm5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIHVubGVzcyBvLnNjb3BlLnBhcmVudD9cbiAgICAgICAgICAgIEBlcnJvciAneWllbGQgY2FuIG9ubHkgb2NjdXIgaW5zaWRlIGZ1bmN0aW9ucydcbiAgICAgICAgc3VwZXJcblxuIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiMgIDAwMCAwMDAgICAwMDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4jICAgICAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcblxuIyBBIHZhbHVlLCB2YXJpYWJsZSBvciBsaXRlcmFsIG9yIHBhcmVudGhlc2l6ZWQsIGluZGV4ZWQgb3IgZG90dGVkIGludG8sIG9yIHZhbmlsbGEuXG5cbmV4cG9ydHMuVmFsdWUgPSBjbGFzcyBWYWx1ZSBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBAOiAoYmFzZSwgcHJvcHMsIHRhZykgLT5cbiAgICAgICAgcmV0dXJuIGJhc2UgaWYgbm90IHByb3BzIGFuZCBiYXNlIGluc3RhbmNlb2YgVmFsdWVcbiAgICAgICAgQGJhc2UgICAgICAgPSBiYXNlXG4gICAgICAgIEBwcm9wZXJ0aWVzID0gcHJvcHMgb3IgW11cbiAgICAgICAgQFt0YWddICAgICAgPSB0cnVlIGlmIHRhZ1xuICAgICAgICByZXR1cm4gdGhpc1xuXG4gICAgY2hpbGRyZW46IFsnYmFzZScsICdwcm9wZXJ0aWVzJ11cblxuICAgICMgQWRkIGEgcHJvcGVydHkgKG9yICpwcm9wZXJ0aWVzKiApIGBBY2Nlc3NgIHRvIHRoZSBsaXN0LlxuICAgIGFkZDogKHByb3BzKSAtPlxuICAgICAgICBAcHJvcGVydGllcyA9IEBwcm9wZXJ0aWVzLmNvbmNhdCBwcm9wc1xuICAgICAgICB0aGlzXG5cbiAgICBoYXNQcm9wZXJ0aWVzOiAtPlxuICAgICAgICAhIUBwcm9wZXJ0aWVzLmxlbmd0aFxuXG4gICAgYmFyZUxpdGVyYWw6ICh0eXBlKSAtPlxuICAgICAgICBub3QgQHByb3BlcnRpZXMubGVuZ3RoIGFuZCBAYmFzZSBpbnN0YW5jZW9mIHR5cGVcblxuICAgICMgU29tZSBib29sZWFuIGNoZWNrcyBmb3IgdGhlIGJlbmVmaXQgb2Ygb3RoZXIgbm9kZXMuXG4gICAgaXNBcnJheTogICAgICAtPiBAYmFyZUxpdGVyYWwoQXJyKVxuICAgIGlzUmFuZ2U6ICAgICAgLT4gQGJhcmVMaXRlcmFsKFJhbmdlKVxuICAgIGlzQ29tcGxleDogICAgLT4gQGhhc1Byb3BlcnRpZXMoKSBvciBAYmFzZS5pc0NvbXBsZXgoKVxuICAgIGlzQXNzaWduYWJsZTogLT4gQGhhc1Byb3BlcnRpZXMoKSBvciBAYmFzZS5pc0Fzc2lnbmFibGUoKVxuICAgIGlzTnVtYmVyOiAgICAgLT4gQGJhcmVMaXRlcmFsKE51bWJlckxpdGVyYWwpXG4gICAgaXNTdHJpbmc6ICAgICAtPiBAYmFyZUxpdGVyYWwoU3RyaW5nTGl0ZXJhbClcbiAgICBpc1JlZ2V4OiAgICAgIC0+IEBiYXJlTGl0ZXJhbChSZWdleExpdGVyYWwpXG4gICAgaXNVbmRlZmluZWQ6ICAtPiBAYmFyZUxpdGVyYWwoVW5kZWZpbmVkTGl0ZXJhbClcbiAgICBpc051bGw6ICAgICAgIC0+IEBiYXJlTGl0ZXJhbChOdWxsTGl0ZXJhbClcbiAgICBpc0Jvb2xlYW46ICAgIC0+IEBiYXJlTGl0ZXJhbChCb29sZWFuTGl0ZXJhbClcbiAgICBpc0F0b21pYzogICAgIC0+XG4gICAgICAgIGZvciBub2RlIGluIEBwcm9wZXJ0aWVzLmNvbmNhdCBAYmFzZVxuICAgICAgICAgICAgcmV0dXJuIG5vIGlmIG5vZGUuc29hayBvciBub2RlIGluc3RhbmNlb2YgQ2FsbFxuICAgICAgICB5ZXNcblxuICAgIGlzTm90Q2FsbGFibGU6IC0+IEBpc051bWJlcigpIG9yIEBpc1N0cmluZygpIG9yIEBpc1JlZ2V4KCkgb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAaXNBcnJheSgpIG9yIEBpc1JhbmdlKCkgb3IgQGlzU3BsaWNlKCkgb3IgQGlzT2JqZWN0KCkgb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAaXNVbmRlZmluZWQoKSBvciBAaXNOdWxsKCkgb3IgQGlzQm9vbGVhbigpXG5cbiAgICBpc1N0YXRlbWVudDogKG8pICAgIC0+IG5vdCBAcHJvcGVydGllcy5sZW5ndGggYW5kIEBiYXNlLmlzU3RhdGVtZW50IG9cbiAgICBhc3NpZ25zOiAgICAgKG5hbWUpIC0+IG5vdCBAcHJvcGVydGllcy5sZW5ndGggYW5kIEBiYXNlLmFzc2lnbnMgbmFtZVxuICAgIGp1bXBzOiAgICAgICAobykgICAgLT4gbm90IEBwcm9wZXJ0aWVzLmxlbmd0aCBhbmQgQGJhc2UuanVtcHMgb1xuXG4gICAgaXNPYmplY3Q6IChvbmx5R2VuZXJhdGVkKSAtPlxuICAgICAgICByZXR1cm4gbm8gaWYgQHByb3BlcnRpZXMubGVuZ3RoXG4gICAgICAgIChAYmFzZSBpbnN0YW5jZW9mIE9iaikgYW5kIChub3Qgb25seUdlbmVyYXRlZCBvciBAYmFzZS5nZW5lcmF0ZWQpXG5cbiAgICBpc1NwbGljZTogLT5cbiAgICAgICAgWy4uLiwgbGFzdFByb3BdID0gQHByb3BlcnRpZXNcbiAgICAgICAgbGFzdFByb3AgaW5zdGFuY2VvZiBTbGljZVxuXG4gICAgbG9va3NTdGF0aWM6IChjbGFzc05hbWUpIC0+XG4gICAgICAgIEBiYXNlLnZhbHVlIGlzIGNsYXNzTmFtZSBhbmQgQHByb3BlcnRpZXMubGVuZ3RoIGlzIDEgYW5kXG4gICAgICAgICAgICBAcHJvcGVydGllc1swXS5uYW1lPy52YWx1ZSAhPSAncHJvdG90eXBlJ1xuXG4gICAgIyBUaGUgdmFsdWUgY2FuIGJlIHVud3JhcHBlZCBhcyBpdHMgaW5uZXIgbm9kZSwgaWYgdGhlcmUgYXJlIG5vIGF0dGFjaGVkIHByb3BlcnRpZXMuXG4gICAgdW53cmFwOiAtPlxuICAgICAgICBpZiBAcHJvcGVydGllcy5sZW5ndGggdGhlbiB0aGlzIGVsc2UgQGJhc2VcblxuICAgICMgQSByZWZlcmVuY2UgaGFzIGJhc2UgcGFydCAoYHRoaXNgIHZhbHVlKSBhbmQgbmFtZSBwYXJ0LlxuICAgICMgV2UgY2FjaGUgdGhlbSBzZXBhcmF0ZWx5IGZvciBjb21waWxpbmcgY29tcGxleCBleHByZXNzaW9ucy5cbiAgICAjIGBhKClbYigpXSA/PSBjYCAtPiBgKF9iYXNlID0gYSgpKVtfbmFtZSA9IGIoKV0gPyBfYmFzZVtfbmFtZV0gPSBjYFxuICAgIFxuICAgIGNhY2hlUmVmZXJlbmNlOiAobykgLT5cbiAgICAgICAgXG4gICAgICAgIFsuLi4sIG5hbWVdID0gQHByb3BlcnRpZXNcbiAgICAgICAgaWYgQHByb3BlcnRpZXMubGVuZ3RoIDwgMiBhbmQgbm90IEBiYXNlLmlzQ29tcGxleCgpIGFuZCBub3QgbmFtZT8uaXNDb21wbGV4KClcbiAgICAgICAgICAgIHJldHVybiBbdGhpcywgdGhpc10gICMgYGFgIGBhLmJgXG4gICAgICAgIGJhc2UgPSBuZXcgVmFsdWUgQGJhc2UsIEBwcm9wZXJ0aWVzWy4uLi0xXVxuICAgICAgICBpZiBiYXNlLmlzQ29tcGxleCgpICAjIGBhKCkuYmBcbiAgICAgICAgICAgIGJyZWYgPSBuZXcgSWRlbnRpZmllckxpdGVyYWwgby5zY29wZS5mcmVlVmFyaWFibGUgJ2Jhc2UnXG4gICAgICAgICAgICBiYXNlID0gbmV3IFZhbHVlIG5ldyBQYXJlbnMgbmV3IEFzc2lnbiBicmVmLCBiYXNlXG4gICAgICAgIHJldHVybiBbYmFzZSwgYnJlZl0gdW5sZXNzIG5hbWUgICMgYGEoKWBcbiAgICAgICAgaWYgbmFtZS5pc0NvbXBsZXgoKSAgIyBgYVtiKCldYFxuICAgICAgICAgICAgbnJlZiA9IG5ldyBJZGVudGlmaWVyTGl0ZXJhbCBvLnNjb3BlLmZyZWVWYXJpYWJsZSAnbmFtZSdcbiAgICAgICAgICAgIG5hbWUgPSBuZXcgSW5kZXggbmV3IEFzc2lnbiBucmVmLCBuYW1lLmluZGV4XG4gICAgICAgICAgICBucmVmID0gbmV3IEluZGV4IG5yZWZcbiAgICAgICAgW2Jhc2UuYWRkKG5hbWUpLCBuZXcgVmFsdWUoYnJlZiBvciBiYXNlLmJhc2UsIFtucmVmIG9yIG5hbWVdKV1cblxuICAgICMgV2UgY29tcGlsZSBhIHZhbHVlIHRvIEphdmFTY3JpcHQgYnkgY29tcGlsaW5nIGFuZCBqb2luaW5nIGVhY2ggcHJvcGVydHkuXG4gICAgIyBUaGluZ3MgZ2V0IG11Y2ggbW9yZSBpbnRlcmVzdGluZyBpZiB0aGUgY2hhaW4gb2YgcHJvcGVydGllcyBoYXMgKnNvYWsqXG4gICAgIyBvcGVyYXRvcnMgYD8uYCBpbnRlcnNwZXJzZWQuIFRoZW4gd2UgaGF2ZSB0byB0YWtlIGNhcmUgbm90IHRvIGFjY2lkZW50YWxseVxuICAgICMgZXZhbHVhdGUgYW55dGhpbmcgdHdpY2Ugd2hlbiBidWlsZGluZyB0aGUgc29hayBjaGFpbi5cbiAgICBcbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIFxuICAgICAgICBAYmFzZS5mcm9udCA9IEBmcm9udFxuICAgICAgICBwcm9wcyA9IEBwcm9wZXJ0aWVzXG4gICAgICAgIGZyYWdtZW50cyA9IEBiYXNlLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCAoaWYgcHJvcHMubGVuZ3RoIHRoZW4gTEVWRUxfQUNDRVNTIGVsc2UgbnVsbClcbiAgICAgICAgaWYgcHJvcHMubGVuZ3RoIGFuZCBTSU1QTEVOVU0udGVzdCBAZnJhZ21lbnRzVG9UZXh0IGZyYWdtZW50c1xuICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlICcuJ1xuICAgICAgICBmb3IgcHJvcCBpbiBwcm9wc1xuICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2ggKHByb3AuY29tcGlsZVRvRnJhZ21lbnRzIG8pLi4uXG4gICAgICAgIGZyYWdtZW50c1xuXG4gICAgIyBVbmZvbGQgYSBzb2FrIGludG8gYW4gYElmYDogYGE/LmJgIC0+IGBhLmIgaWYgYT9gXG4gICAgXG4gICAgdW5mb2xkU29hazogKG8pIC0+XG4gICAgICAgIFxuICAgICAgICBAdW5mb2xkZWRTb2FrID89IGRvID0+XG4gICAgICAgICAgICBpZiBpZm4gPSBAYmFzZS51bmZvbGRTb2FrIG9cbiAgICAgICAgICAgICAgICBpZm4uYm9keS5wcm9wZXJ0aWVzLnB1c2ggQHByb3BlcnRpZXMuLi5cbiAgICAgICAgICAgICAgICByZXR1cm4gaWZuXG4gICAgICAgICAgICBmb3IgcHJvcCwgaSBpbiBAcHJvcGVydGllcyB3aGVuIHByb3Auc29ha1xuICAgICAgICAgICAgICAgIHByb3Auc29hayA9IG9mZlxuICAgICAgICAgICAgICAgIGZzdCA9IG5ldyBWYWx1ZSBAYmFzZSwgQHByb3BlcnRpZXNbLi4uaV1cbiAgICAgICAgICAgICAgICBzbmQgPSBuZXcgVmFsdWUgQGJhc2UsIEBwcm9wZXJ0aWVzW2kuLl1cbiAgICAgICAgICAgICAgICBpZiBmc3QuaXNDb21wbGV4KClcbiAgICAgICAgICAgICAgICAgICAgcmVmID0gbmV3IElkZW50aWZpZXJMaXRlcmFsIG8uc2NvcGUuZnJlZVZhcmlhYmxlICdyZWYnXG4gICAgICAgICAgICAgICAgICAgIGZzdCA9IG5ldyBQYXJlbnMgbmV3IEFzc2lnbiByZWYsIGZzdFxuICAgICAgICAgICAgICAgICAgICBzbmQuYmFzZSA9IHJlZlxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgSWYgbmV3IEV4aXN0ZW5jZShmc3QpLCBzbmQsIHNvYWs6IG9uXG4gICAgICAgICAgICBub1xuXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgICAgIDAwMCAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAgICAwMDAgICAgIFxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcblxuZXhwb3J0cy5Db21tZW50ID0gY2xhc3MgQ29tbWVudCBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBAOiAoQGNvbW1lbnQpIC0+XG5cbiAgICBpc1N0YXRlbWVudDogWUVTXG4gICAgbWFrZVJldHVybjogIFRISVNcblxuICAgIGNvbXBpbGVOb2RlOiAobywgbGV2ZWwpIC0+XG4gICAgICAgIFxuICAgICAgICBjb21tZW50ID0gQGNvbW1lbnQucmVwbGFjZSAvXihcXHMqKSMoPz1cXHMpL2dtLCBcIiQxICpcIlxuICAgICAgICBjb2RlID0gXCIvKiN7bXVsdGlkZW50IGNvbW1lbnQsIEB0YWJ9I3tpZiAnXFxuJyBpbiBjb21tZW50IHRoZW4gXCJcXG4je0B0YWJ9XCIgZWxzZSAnJ30gKi9cIlxuICAgICAgICBjb2RlID0gby5pbmRlbnQgKyBjb2RlIGlmIChsZXZlbCBvciBvLmxldmVsKSBpcyBMRVZFTF9UT1BcbiAgICAgICAgW0BtYWtlQ29kZShcIlxcblwiKSwgQG1ha2VDb2RlKGNvZGUpXVxuXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICBcbiMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwICAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgIFxuIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAwMDAwMDAwICBcblxuIyBOb2RlIGZvciBhIGZ1bmN0aW9uIGludm9jYXRpb24uXG4gICAgXG5leHBvcnRzLkNhbGwgPSBjbGFzcyBDYWxsIGV4dGVuZHMgQmFzZVxuICAgIFxuICAgIEA6IChAdmFyaWFibGUsIEBhcmdzID0gW10sIEBzb2FrKSAtPlxuICAgICAgICBcbiAgICAgICAgQGlzTmV3ID0gZmFsc2VcbiAgICAgICAgaWYgQHZhcmlhYmxlIGluc3RhbmNlb2YgVmFsdWUgYW5kIEB2YXJpYWJsZS5pc05vdENhbGxhYmxlKClcbiAgICAgICAgICAgICMgbG9nIEB2YXJpYWJsZVxuICAgICAgICAgICAgQHZhcmlhYmxlLmVycm9yIFwibGl0ZXJhbCBpcyBub3QgYSBmdW5jdGlvblwiXG5cbiAgICBjaGlsZHJlbjogWyd2YXJpYWJsZScsICdhcmdzJ11cblxuICAgICMgV2hlbiBzZXR0aW5nIHRoZSBsb2NhdGlvbiwgd2Ugc29tZXRpbWVzIG5lZWQgdG8gdXBkYXRlIHRoZSBzdGFydCBsb2NhdGlvbiB0b1xuICAgICMgYWNjb3VudCBmb3IgYSBuZXdseS1kaXNjb3ZlcmVkIGBuZXdgIG9wZXJhdG9yIHRvIHRoZSBsZWZ0IG9mIHVzLiBUaGlzXG4gICAgIyBleHBhbmRzIHRoZSByYW5nZSBvbiB0aGUgbGVmdCwgYnV0IG5vdCB0aGUgcmlnaHQuXG4gICAgXG4gICAgdXBkYXRlTG9jYXRpb25EYXRhSWZNaXNzaW5nOiAobG9jYXRpb25EYXRhKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQGxvY2F0aW9uRGF0YSBhbmQgQG5lZWRzVXBkYXRlZFN0YXJ0TG9jYXRpb25cbiAgICAgICAgICAgIEBsb2NhdGlvbkRhdGEuZmlyc3RfbGluZSA9IGxvY2F0aW9uRGF0YS5maXJzdF9saW5lXG4gICAgICAgICAgICBAbG9jYXRpb25EYXRhLmZpcnN0X2NvbHVtbiA9IGxvY2F0aW9uRGF0YS5maXJzdF9jb2x1bW5cbiAgICAgICAgICAgIGJhc2UgPSBAdmFyaWFibGU/LmJhc2Ugb3IgQHZhcmlhYmxlXG4gICAgICAgICAgICBpZiBiYXNlLm5lZWRzVXBkYXRlZFN0YXJ0TG9jYXRpb25cbiAgICAgICAgICAgICAgICBAdmFyaWFibGUubG9jYXRpb25EYXRhLmZpcnN0X2xpbmUgPSBsb2NhdGlvbkRhdGEuZmlyc3RfbGluZVxuICAgICAgICAgICAgICAgIEB2YXJpYWJsZS5sb2NhdGlvbkRhdGEuZmlyc3RfY29sdW1uID0gbG9jYXRpb25EYXRhLmZpcnN0X2NvbHVtblxuICAgICAgICAgICAgICAgIGJhc2UudXBkYXRlTG9jYXRpb25EYXRhSWZNaXNzaW5nIGxvY2F0aW9uRGF0YVxuICAgICAgICAgICAgZGVsZXRlIEBuZWVkc1VwZGF0ZWRTdGFydExvY2F0aW9uXG4gICAgICAgIHN1cGVyXG5cbiAgICAjIFRhZyB0aGlzIGludm9jYXRpb24gYXMgY3JlYXRpbmcgYSBuZXcgaW5zdGFuY2UuXG4gICAgbmV3SW5zdGFuY2U6IC0+XG4gICAgICAgIGJhc2UgPSBAdmFyaWFibGU/LmJhc2Ugb3IgQHZhcmlhYmxlXG4gICAgICAgIGlmIGJhc2UgaW5zdGFuY2VvZiBDYWxsIGFuZCBub3QgYmFzZS5pc05ld1xuICAgICAgICAgICAgYmFzZS5uZXdJbnN0YW5jZSgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBpc05ldyA9IHRydWVcbiAgICAgICAgQG5lZWRzVXBkYXRlZFN0YXJ0TG9jYXRpb24gPSB0cnVlXG4gICAgICAgIHRoaXNcblxuICAgICMgU29ha2VkIGNoYWluZWQgaW52b2NhdGlvbnMgdW5mb2xkIGludG8gaWYvZWxzZSB0ZXJuYXJ5IHN0cnVjdHVyZXMuXG4gICAgdW5mb2xkU29hazogKG8pIC0+XG4gICAgICAgIGlmIEBzb2FrXG4gICAgICAgICAgICBpZiB0aGlzIGluc3RhbmNlb2YgU3VwZXJDYWxsXG4gICAgICAgICAgICAgICAgbGVmdCA9IG5ldyBMaXRlcmFsIEBzdXBlclJlZmVyZW5jZSBvXG4gICAgICAgICAgICAgICAgcml0ZSA9IG5ldyBWYWx1ZSBsZWZ0XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlmbiBpZiBpZm4gPSB1bmZvbGRTb2FrIG8sIHRoaXMsICd2YXJpYWJsZSdcbiAgICAgICAgICAgICAgICBbbGVmdCwgcml0ZV0gPSBuZXcgVmFsdWUoQHZhcmlhYmxlKS5jYWNoZVJlZmVyZW5jZSBvXG4gICAgICAgICAgICByaXRlID0gbmV3IENhbGwgcml0ZSwgQGFyZ3NcbiAgICAgICAgICAgIHJpdGUuaXNOZXcgPSBAaXNOZXdcbiAgICAgICAgICAgIGxlZnQgPSBuZXcgTGl0ZXJhbCBcInR5cGVvZiAjeyBsZWZ0LmNvbXBpbGUgbyB9ID09PSBcXFwiZnVuY3Rpb25cXFwiXCJcbiAgICAgICAgICAgIHJldHVybiBuZXcgSWYgbGVmdCwgbmV3IFZhbHVlKHJpdGUpLCBzb2FrOiB5ZXNcbiAgICAgICAgY2FsbCA9IHRoaXNcbiAgICAgICAgbGlzdCA9IFtdXG4gICAgICAgIGxvb3BcbiAgICAgICAgICAgIGlmIGNhbGwudmFyaWFibGUgaW5zdGFuY2VvZiBDYWxsXG4gICAgICAgICAgICAgICAgbGlzdC5wdXNoIGNhbGxcbiAgICAgICAgICAgICAgICBjYWxsID0gY2FsbC52YXJpYWJsZVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICBicmVhayB1bmxlc3MgY2FsbC52YXJpYWJsZSBpbnN0YW5jZW9mIFZhbHVlXG4gICAgICAgICAgICBsaXN0LnB1c2ggY2FsbFxuICAgICAgICAgICAgYnJlYWsgdW5sZXNzIChjYWxsID0gY2FsbC52YXJpYWJsZS5iYXNlKSBpbnN0YW5jZW9mIENhbGxcbiAgICAgICAgZm9yIGNhbGwgaW4gbGlzdC5yZXZlcnNlKClcbiAgICAgICAgICAgIGlmIGlmblxuICAgICAgICAgICAgICAgIGlmIGNhbGwudmFyaWFibGUgaW5zdGFuY2VvZiBDYWxsXG4gICAgICAgICAgICAgICAgICAgIGNhbGwudmFyaWFibGUgPSBpZm5cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGNhbGwudmFyaWFibGUuYmFzZSA9IGlmblxuICAgICAgICAgICAgaWZuID0gdW5mb2xkU29hayBvLCBjYWxsLCAndmFyaWFibGUnXG4gICAgICAgIGlmblxuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPiAjIENvbXBpbGUgYSB2YW5pbGxhIGZ1bmN0aW9uIGNhbGwuXG4gICAgICAgIFxuICAgICAgICBAdmFyaWFibGU/LmZyb250ID0gQGZyb250XG4gICAgICAgIGNvbXBpbGVkQXJyYXkgPSBTcGxhdC5jb21waWxlU3BsYXR0ZWRBcnJheSBvLCBAYXJncywgdHJ1ZVxuICAgICAgICBpZiBjb21waWxlZEFycmF5Lmxlbmd0aFxuICAgICAgICAgICAgcmV0dXJuIEBjb21waWxlU3BsYXQgbywgY29tcGlsZWRBcnJheVxuICAgICAgICBjb21waWxlZEFyZ3MgPSBbXVxuICAgICAgICBmb3IgYXJnLCBhcmdJbmRleCBpbiBAYXJnc1xuICAgICAgICAgICAgaWYgYXJnSW5kZXggdGhlbiBjb21waWxlZEFyZ3MucHVzaCBAbWFrZUNvZGUgXCIsIFwiXG4gICAgICAgICAgICBjb21waWxlZEFyZ3MucHVzaCAoYXJnLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9MSVNUKS4uLlxuXG4gICAgICAgIGZyYWdtZW50cyA9IFtdXG4gICAgICAgIGlmIHRoaXMgaW5zdGFuY2VvZiBTdXBlckNhbGxcbiAgICAgICAgICAgIHByZWZhY2UgPSBAc3VwZXJSZWZlcmVuY2UobykgKyBcIi5jYWxsKCN7QHN1cGVyVGhpcyhvKX1cIlxuICAgICAgICAgICAgaWYgY29tcGlsZWRBcmdzLmxlbmd0aCB0aGVuIHByZWZhY2UgKz0gXCIsIFwiXG4gICAgICAgICAgICBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUgcHJlZmFjZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBAaXNOZXcgdGhlbiBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUgJ25ldyAnXG4gICAgICAgICAgICBmcmFnbWVudHMucHVzaCBAdmFyaWFibGUuY29tcGlsZVRvRnJhZ21lbnRzKG8sIExFVkVMX0FDQ0VTUykuLi5cbiAgICAgICAgICAgIGZyYWdtZW50cy5wdXNoIEBtYWtlQ29kZSBcIihcIlxuICAgICAgICBmcmFnbWVudHMucHVzaCBjb21waWxlZEFyZ3MuLi5cbiAgICAgICAgZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlIFwiKVwiXG4gICAgICAgIGZyYWdtZW50c1xuXG4gICAgIyBJZiB5b3UgY2FsbCBhIGZ1bmN0aW9uIHdpdGggYSBzcGxhdCwgaXQncyBjb252ZXJ0ZWQgaW50byBhIEphdmFTY3JpcHRcbiAgICAjIGAuYXBwbHkoKWAgY2FsbCB0byBhbGxvdyBhbiBhcnJheSBvZiBhcmd1bWVudHMgdG8gYmUgcGFzc2VkLlxuICAgICMgSWYgaXQncyBhIGNvbnN0cnVjdG9yLCB0aGVuIHRoaW5ncyBnZXQgcmVhbCB0cmlja3kuIFdlIGhhdmUgdG8gaW5qZWN0IGFuXG4gICAgIyBpbm5lciBjb25zdHJ1Y3RvciBpbiBvcmRlciB0byBiZSBhYmxlIHRvIHBhc3MgdGhlIHZhcmFyZ3MuXG4gICAgI1xuICAgICMgc3BsYXRBcmdzIGlzIGFuIGFycmF5IG9mIENvZGVGcmFnbWVudHMgdG8gcHV0IGludG8gdGhlICdhcHBseScuXG4gICAgXG4gICAgY29tcGlsZVNwbGF0OiAobywgc3BsYXRBcmdzKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgdGhpcyBpbnN0YW5jZW9mIFN1cGVyQ2FsbFxuICAgICAgICAgICAgcmV0dXJuIFtdLmNvbmNhdCBAbWFrZUNvZGUoXCIjeyBAc3VwZXJSZWZlcmVuY2UgbyB9LmFwcGx5KCN7QHN1cGVyVGhpcyhvKX0sIFwiKSxcbiAgICAgICAgICAgICAgICBzcGxhdEFyZ3MsIEBtYWtlQ29kZShcIilcIilcblxuICAgICAgICBpZiBAaXNOZXdcbiAgICAgICAgICAgIGlkdCA9IEB0YWIgKyBUQUJcbiAgICAgICAgICAgIHJldHVybiBbXS5jb25jYXQgQG1ha2VDb2RlKFwiXCJcIlxuICAgICAgICAgICAgICAgIChmdW5jdGlvbihmdW5jLCBhcmdzLCBjdG9yKSB7XG4gICAgICAgICAgICAgICAgI3tpZHR9Y3Rvci5wcm90b3R5cGUgPSBmdW5jLnByb3RvdHlwZTtcbiAgICAgICAgICAgICAgICAje2lkdH12YXIgY2hpbGQgPSBuZXcgY3RvciwgcmVzdWx0ID0gZnVuYy5hcHBseShjaGlsZCwgYXJncyk7XG4gICAgICAgICAgICAgICAgI3tpZHR9cmV0dXJuIE9iamVjdChyZXN1bHQpID09PSByZXN1bHQgPyByZXN1bHQgOiBjaGlsZDtcbiAgICAgICAgICAgICAgICAje0B0YWJ9fSkoXCJcIlwiKSxcbiAgICAgICAgICAgICAgICAoQHZhcmlhYmxlLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9MSVNUKSxcbiAgICAgICAgICAgICAgICBAbWFrZUNvZGUoXCIsIFwiKSwgc3BsYXRBcmdzLCBAbWFrZUNvZGUoXCIsIGZ1bmN0aW9uKCl7fSlcIilcblxuICAgICAgICBhbnN3ZXIgPSBbXVxuICAgICAgICBiYXNlID0gbmV3IFZhbHVlIEB2YXJpYWJsZVxuICAgICAgICBpZiAobmFtZSA9IGJhc2UucHJvcGVydGllcy5wb3AoKSkgYW5kIGJhc2UuaXNDb21wbGV4KClcbiAgICAgICAgICAgIHJlZiA9IG8uc2NvcGUuZnJlZVZhcmlhYmxlICdyZWYnXG4gICAgICAgICAgICBhbnN3ZXIgPSBhbnN3ZXIuY29uY2F0IEBtYWtlQ29kZShcIigje3JlZn0gPSBcIiksXG4gICAgICAgICAgICAgICAgKGJhc2UuY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX0xJU1QpLFxuICAgICAgICAgICAgICAgIEBtYWtlQ29kZShcIilcIiksXG4gICAgICAgICAgICAgICAgbmFtZS5jb21waWxlVG9GcmFnbWVudHMobylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZnVuID0gYmFzZS5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfQUNDRVNTXG4gICAgICAgICAgICBmdW4gPSBAd3JhcEluQnJhY2VzIGZ1biBpZiBTSU1QTEVOVU0udGVzdCBAZnJhZ21lbnRzVG9UZXh0IGZ1blxuICAgICAgICAgICAgaWYgbmFtZVxuICAgICAgICAgICAgICAgIHJlZiA9IEBmcmFnbWVudHNUb1RleHQgZnVuXG4gICAgICAgICAgICAgICAgZnVuLnB1c2ggKG5hbWUuY29tcGlsZVRvRnJhZ21lbnRzIG8pLi4uXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmVmID0gJ251bGwnXG4gICAgICAgICAgICBhbnN3ZXIgPSBhbnN3ZXIuY29uY2F0IGZ1blxuICAgICAgICBhbnN3ZXIgPSBhbnN3ZXIuY29uY2F0IEBtYWtlQ29kZShcIi5hcHBseSgje3JlZn0sIFwiKSwgc3BsYXRBcmdzLCBAbWFrZUNvZGUoXCIpXCIpXG5cbiMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcblxuIyBUYWtlcyBjYXJlIG9mIGNvbnZlcnRpbmcgYHN1cGVyKClgIGNhbGxzIGludG8gY2FsbHMgYWdhaW5zdCB0aGUgcHJvdG90eXBlJ3MgZnVuY3Rpb24gb2YgdGhlIHNhbWUgbmFtZS5cblxuZXhwb3J0cy5TdXBlckNhbGwgPSBjbGFzcyBTdXBlckNhbGwgZXh0ZW5kcyBDYWxsXG4gICAgXG4gICAgQDogKGFyZ3MpIC0+XG4gICAgICAgIHN1cGVyIG51bGwsIGFyZ3MgPyBbbmV3IFNwbGF0IG5ldyBJZGVudGlmaWVyTGl0ZXJhbCAnYXJndW1lbnRzJ11cbiAgICAgICAgIyBBbGxvdyB0byByZWNvZ25pemUgYSBiYXJlIGBzdXBlcmAgY2FsbCB3aXRob3V0IHBhcmVudGhlc2VzIGFuZCBhcmd1bWVudHMuXG4gICAgICAgIEBpc0JhcmUgPSBhcmdzP1xuXG4gICAgIyBHcmFiIHRoZSByZWZlcmVuY2UgdG8gdGhlIHN1cGVyY2xhc3MncyBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgY3VycmVudCBtZXRob2QuXG4gICAgXG4gICAgc3VwZXJSZWZlcmVuY2U6IChvKSAtPlxuICAgICAgICBcbiAgICAgICAgbWV0aG9kID0gby5zY29wZS5uYW1lZE1ldGhvZCgpXG4gICAgICAgIGlmIG1ldGhvZD8ua2xhc3NcbiAgICAgICAgICAgIHtrbGFzcywgbmFtZSwgdmFyaWFibGV9ID0gbWV0aG9kXG4gICAgICAgICAgICBpZiBrbGFzcy5pc0NvbXBsZXgoKVxuICAgICAgICAgICAgICAgIGJyZWYgPSBuZXcgSWRlbnRpZmllckxpdGVyYWwgby5zY29wZS5wYXJlbnQuZnJlZVZhcmlhYmxlICdiYXNlJ1xuICAgICAgICAgICAgICAgIGJhc2UgPSBuZXcgVmFsdWUgbmV3IFBhcmVucyBuZXcgQXNzaWduIGJyZWYsIGtsYXNzXG4gICAgICAgICAgICAgICAgdmFyaWFibGUuYmFzZSA9IGJhc2VcbiAgICAgICAgICAgICAgICB2YXJpYWJsZS5wcm9wZXJ0aWVzLnNwbGljZSAwLCBrbGFzcy5wcm9wZXJ0aWVzLmxlbmd0aFxuICAgICAgICAgICAgaWYgbmFtZS5pc0NvbXBsZXgoKSBvciAobmFtZSBpbnN0YW5jZW9mIEluZGV4IGFuZCBuYW1lLmluZGV4LmlzQXNzaWduYWJsZSgpKVxuICAgICAgICAgICAgICAgIG5yZWYgPSBuZXcgSWRlbnRpZmllckxpdGVyYWwgby5zY29wZS5wYXJlbnQuZnJlZVZhcmlhYmxlICduYW1lJ1xuICAgICAgICAgICAgICAgIG5hbWUgPSBuZXcgSW5kZXggbmV3IEFzc2lnbiBucmVmLCBuYW1lLmluZGV4XG4gICAgICAgICAgICAgICAgdmFyaWFibGUucHJvcGVydGllcy5wb3AoKVxuICAgICAgICAgICAgICAgIHZhcmlhYmxlLnByb3BlcnRpZXMucHVzaCBuYW1lXG4gICAgICAgICAgICBhY2Nlc3NlcyA9IFtuZXcgQWNjZXNzIG5ldyBQcm9wZXJ0eU5hbWUgJ19fc3VwZXJfXyddXG4gICAgICAgICAgICBhY2Nlc3Nlcy5wdXNoIG5ldyBBY2Nlc3MgbmV3IFByb3BlcnR5TmFtZSAnY29uc3RydWN0b3InIGlmIG1ldGhvZC5zdGF0aWNcbiAgICAgICAgICAgIGFjY2Vzc2VzLnB1c2ggaWYgbnJlZj8gdGhlbiBuZXcgSW5kZXggbnJlZiBlbHNlIG5hbWVcbiAgICAgICAgICAgIChuZXcgVmFsdWUgYnJlZiA/IGtsYXNzLCBhY2Nlc3NlcykuY29tcGlsZSBvXG4gICAgICAgIGVsc2UgaWYgbWV0aG9kPy5jdG9yXG4gICAgICAgICAgICAjIGxvZyBcIlN1cGVyQ2FsbC5zdXBlclJlZmVyZW5jZSAje21ldGhvZC5uYW1lfSBkYWR1bW0hXCJcbiAgICAgICAgICAgIFwiI3ttZXRob2QubmFtZX0uX19zdXBlcl9fLmNvbnN0cnVjdG9yXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGVycm9yICdjYW5ub3QgY2FsbCBzdXBlciBvdXRzaWRlIG9mIGFuIGluc3RhbmNlIG1ldGhvZC4gJyArIG1ldGhvZFxuXG4gICAgIyBUaGUgYXBwcm9wcmlhdGUgYHRoaXNgIHZhbHVlIGZvciBhIGBzdXBlcmAgY2FsbC5cbiAgICAgICAgXG4gICAgc3VwZXJUaGlzOiAobykgLT5cbiAgICAgICAgbWV0aG9kID0gby5zY29wZS5tZXRob2RcbiAgICAgICAgKG1ldGhvZCBhbmQgbm90IG1ldGhvZC5rbGFzcyBhbmQgbWV0aG9kLmNvbnRleHQpIG9yIFwidGhpc1wiXG5cbiAgICBjb21waWxlU3BsYXQ6IChvLCBzcGxhdEFyZ3MpIC0+XG4gICAgICAgICMgbG9nICdjb21waWxlU3BsYXQnLCBvLmZlYXR1cmVcbiAgICAgICAgaWYgc3BsYXRBcmdzLmxlbmd0aCA9PSAxIGFuZCBzcGxhdEFyZ3NbMF0uY29kZSA9PSAnYXJndW1lbnRzJyBhbmQgQGNvbmZpZ1BhcmFtZXRlcj8gYW5kIGhhc0ZlYXR1cmUgbywgJ2NvbmZpZ19wYXJhbWV0ZXJzJ1xuICAgICAgICAgICAgIyBUT0RPOiBzaG91bGRuJ3QgYWxsIHJlZmVyZW5jZXMgdG8gYXJndW1lbnRzIGJlIGNvbnZlcnRlZD9cbiAgICAgICAgICAgIHJldHVybiBbXS5jb25jYXQgQG1ha2VDb2RlKFwiI3tAY29uZmlnUGFyYW1ldGVyQ29kZUJlZm9yZVN1cGVyKCl9I3sgQHN1cGVyUmVmZXJlbmNlIG8gfS5hcHBseSgje0BzdXBlclRoaXMobyl9LCBcIiksIHNwbGF0QXJncywgQG1ha2VDb2RlKFwiKVwiKVxuICAgICAgICAgXG4gICAgICAgIHN1cGVyXG4gICAgICAgIFxuICAgIGNvbmZpZ1BhcmFtZXRlckNvZGVCZWZvcmVTdXBlcjogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiAnJyBpZiBub3QgcGFyYW0gPSBAY29uZmlnUGFyYW1ldGVyXG5cbiAgICAgICAgYSA9IHBhcmFtLm9iamVjdHMubWFwIChvYmopIC0+IFxuICAgICAgICAgICAgbiA9IG9iai52YXJpYWJsZS5iYXNlLnZhbHVlXG4gICAgICAgICAgICBpZiBuID09ICd0aGlzJ1xuICAgICAgICAgICAgICAgIG4gPSBvYmoudmFyaWFibGUucHJvcGVydGllcz9bMF0ubmFtZS52YWx1ZVxuICAgICAgICAgICAgICAgIFwiI3tufTp0aGlzLiN7bn1cIlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHQgPSBvYmoudmFsdWUudmFyaWFibGU/LnRoaXMgYW5kICd0aGlzLicgb3IgJydcbiAgICAgICAgICAgICAgICBcIiN7bn06I3t0K259XCJcbiAgICAgICAgICAgIFxuICAgICAgICBcImFyZ3VtZW50c1swXSA9IF8uZGVmYXVsdHMoeyN7YS5qb2luICcsJ319LCBhcmd1bWVudHNbMF0pOyBcIlxuXG4jIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAgMDAwICAgXG4jIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgICAgMDAwMDAgICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgMDAwICAgXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG5cbiMgUmVnZXhlcyB3aXRoIGludGVycG9sYXRpb25zIGFyZSBpbiBmYWN0IGp1c3QgYSB2YXJpYXRpb24gb2YgYSBgQ2FsbGAgKGFcbiMgYFJlZ0V4cCgpYCBjYWxsIHRvIGJlIHByZWNpc2UpIHdpdGggYSBgU3RyaW5nV2l0aEludGVycG9sYXRpb25zYCBpbnNpZGUuXG5cbmV4cG9ydHMuUmVnZXhXaXRoSW50ZXJwb2xhdGlvbnMgPSBjbGFzcyBSZWdleFdpdGhJbnRlcnBvbGF0aW9ucyBleHRlbmRzIENhbGxcbiAgICBcbiAgICBAOiAoYXJncyA9IFtdKSAtPlxuICAgICAgICBzdXBlciAobmV3IFZhbHVlIG5ldyBJZGVudGlmaWVyTGl0ZXJhbCAnUmVnRXhwJyksIGFyZ3MsIGZhbHNlXG5cbiMgVGFnZ2VkVGVtcGxhdGVDYWxsXG5cbmV4cG9ydHMuVGFnZ2VkVGVtcGxhdGVDYWxsID0gY2xhc3MgVGFnZ2VkVGVtcGxhdGVDYWxsIGV4dGVuZHMgQ2FsbFxuICAgIFxuICAgIEA6ICh2YXJpYWJsZSwgYXJnLCBzb2FrKSAtPlxuICAgICAgICBhcmcgPSBuZXcgU3RyaW5nV2l0aEludGVycG9sYXRpb25zIEJsb2NrLndyYXAoWyBuZXcgVmFsdWUgYXJnIF0pIGlmIGFyZyBpbnN0YW5jZW9mIFN0cmluZ0xpdGVyYWxcbiAgICAgICAgc3VwZXIgdmFyaWFibGUsIFsgYXJnIF0sIHNvYWtcblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgIyBUZWxsIGBTdHJpbmdXaXRoSW50ZXJwb2xhdGlvbnNgIHdoZXRoZXIgdG8gY29tcGlsZSBhcyBFUzIwMTUgb3Igbm90OyB3aWxsIGJlIHJlbW92ZWQgaW4gS29mZmVlIDIuXG4gICAgICAgIG8uaW5UYWdnZWRUZW1wbGF0ZUNhbGwgPSB5ZXNcbiAgICAgICAgQHZhcmlhYmxlLmNvbXBpbGVUb0ZyYWdtZW50cyhvLCBMRVZFTF9BQ0NFU1MpLmNvbmNhdCBAYXJnc1swXS5jb21waWxlVG9GcmFnbWVudHMobywgTEVWRUxfTElTVClcblxuIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgIFxuIyAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuIyAwMDAwMDAwICAgICAwMDAwMCAgICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuIyAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIFxuXG4jIE5vZGUgdG8gZXh0ZW5kIGFuIG9iamVjdCdzIHByb3RvdHlwZSB3aXRoIGFuIGFuY2VzdG9yIG9iamVjdC5cbiMgQWZ0ZXIgYGdvb2cuaW5oZXJpdHNgIGZyb20gdGhlXG4jIFtDbG9zdXJlIExpYnJhcnldKGh0dHBzOi8vZ2l0aHViLmNvbS9nb29nbGUvY2xvc3VyZS1saWJyYXJ5L2Jsb2IvbWFzdGVyL2Nsb3N1cmUvZ29vZy9iYXNlLmpzKS5cblxuZXhwb3J0cy5FeHRlbmRzID0gY2xhc3MgRXh0ZW5kcyBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBAOiAoQGNoaWxkLCBAcGFyZW50KSAtPlxuXG4gICAgY2hpbGRyZW46IFsnY2hpbGQnLCAncGFyZW50J11cblxuICAgICMgSG9va3Mgb25lIGNvbnN0cnVjdG9yIGludG8gYW5vdGhlcidzIHByb3RvdHlwZSBjaGFpbi5cbiAgICBjb21waWxlVG9GcmFnbWVudHM6IChvKSAtPlxuICAgICAgICBuZXcgQ2FsbChuZXcgVmFsdWUobmV3IExpdGVyYWwgdXRpbGl0eSAnZXh0ZW5kJywgbyksIFtAY2hpbGQsIEBwYXJlbnRdKS5jb21waWxlVG9GcmFnbWVudHMgb1xuXG4jICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIFxuIyAwMDAwMDAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgICAwMDAgICAgICAgMDAwICBcbiMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuXG4jIEEgYC5gIGFjY2VzcyBpbnRvIGEgcHJvcGVydHkgb2YgYSB2YWx1ZSwgb3IgdGhlIGA6OmAgc2hvcnRoYW5kIGZvclxuIyBhbiBhY2Nlc3MgaW50byB0aGUgb2JqZWN0J3MgcHJvdG90eXBlLlxuXG5leHBvcnRzLkFjY2VzcyA9IGNsYXNzIEFjY2VzcyBleHRlbmRzIEJhc2VcbiAgICBAOiAoQG5hbWUsIHRhZykgLT5cbiAgICAgICAgQHNvYWsgPSB0YWcgaXMgJ3NvYWsnXG5cbiAgICBjaGlsZHJlbjogWyduYW1lJ11cblxuICAgIGNvbXBpbGVUb0ZyYWdtZW50czogKG8pIC0+XG4gICAgICAgIG5hbWUgPSBAbmFtZS5jb21waWxlVG9GcmFnbWVudHMgb1xuICAgICAgICBub2RlID0gQG5hbWUudW53cmFwKClcbiAgICAgICAgaWYgbm9kZSBpbnN0YW5jZW9mIFByb3BlcnR5TmFtZVxuICAgICAgICAgICAgaWYgbm9kZS52YWx1ZSBpbiBKU19GT1JCSURERU5cbiAgICAgICAgICAgICAgICBbQG1ha2VDb2RlKCdbXCInKSwgbmFtZS4uLiwgQG1ha2VDb2RlKCdcIl0nKV1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBbQG1ha2VDb2RlKCcuJyksIG5hbWUuLi5dXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIFtAbWFrZUNvZGUoJ1snKSwgbmFtZS4uLiwgQG1ha2VDb2RlKCddJyldXG5cbiAgICBpc0NvbXBsZXg6IE5PXG5cbiMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMCAgICBcbiMgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgMDAwICAgXG4jIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuXG4jIEEgYFsgLi4uIF1gIGluZGV4ZWQgYWNjZXNzIGludG8gYW4gYXJyYXkgb3Igb2JqZWN0LlxuXG5leHBvcnRzLkluZGV4ID0gY2xhc3MgSW5kZXggZXh0ZW5kcyBCYXNlXG4gICAgQDogKEBpbmRleCkgLT5cblxuICAgIGNoaWxkcmVuOiBbJ2luZGV4J11cblxuICAgIGNvbXBpbGVUb0ZyYWdtZW50czogKG8pIC0+XG4gICAgICAgIFtdLmNvbmNhdCBAbWFrZUNvZGUoXCJbXCIpLCBAaW5kZXguY29tcGlsZVRvRnJhZ21lbnRzKG8sIExFVkVMX1BBUkVOKSwgQG1ha2VDb2RlKFwiXVwiKVxuXG4gICAgaXNDb21wbGV4OiAtPlxuICAgICAgICBAaW5kZXguaXNDb21wbGV4KClcblxuIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG5cbiMgUmFuZ2VzIGNhbiBiZSB1c2VkIHRvIGV4dHJhY3QgcG9ydGlvbnMgKHNsaWNlcykgb2YgYXJyYXlzLFxuIyB0byBzcGVjaWZ5IGEgcmFuZ2UgZm9yIGNvbXByZWhlbnNpb25zLCBvciBhcyBhIHZhbHVlLCB0byBiZSBleHBhbmRlZCBpbnRvIHRoZVxuIyBjb3JyZXNwb25kaW5nIGFycmF5IG9mIGludGVnZXJzIGF0IHJ1bnRpbWUuXG5cbmV4cG9ydHMuUmFuZ2UgPSBjbGFzcyBSYW5nZSBleHRlbmRzIEJhc2VcblxuICAgIGNoaWxkcmVuOiBbJ2Zyb20nLCAndG8nXVxuXG4gICAgQDogKEBmcm9tLCBAdG8sIHRhZykgLT5cbiAgICAgICAgQGV4Y2x1c2l2ZSA9IHRhZyBpcyAnZXhjbHVzaXZlJ1xuICAgICAgICBAZXF1YWxzID0gaWYgQGV4Y2x1c2l2ZSB0aGVuICcnIGVsc2UgJz0nXG5cbiAgICAjIENvbXBpbGVzIHRoZSByYW5nZSdzIHNvdXJjZSB2YXJpYWJsZXMgLS0gd2hlcmUgaXQgc3RhcnRzIGFuZCB3aGVyZSBpdCBlbmRzLlxuICAgICMgQnV0IG9ubHkgaWYgdGhleSBuZWVkIHRvIGJlIGNhY2hlZCB0byBhdm9pZCBkb3VibGUgZXZhbHVhdGlvbi5cbiAgICBcbiAgICBjb21waWxlVmFyaWFibGVzOiAobykgLT5cbiAgICAgICAgbyA9IG1lcmdlIG8sIHRvcDogdHJ1ZVxuICAgICAgICBpc0NvbXBsZXggPSBkZWwgbywgJ2lzQ29tcGxleCdcbiAgICAgICAgW0Bmcm9tQywgQGZyb21WYXJdID0gQGNhY2hlVG9Db2RlRnJhZ21lbnRzIEBmcm9tLmNhY2hlIG8sIExFVkVMX0xJU1QsIGlzQ29tcGxleFxuICAgICAgICBbQHRvQywgQHRvVmFyXSAgICAgPSBAY2FjaGVUb0NvZGVGcmFnbWVudHMgQHRvLmNhY2hlIG8sIExFVkVMX0xJU1QsIGlzQ29tcGxleFxuICAgICAgICBbQHN0ZXAsIEBzdGVwVmFyXSAgPSBAY2FjaGVUb0NvZGVGcmFnbWVudHMgc3RlcC5jYWNoZSBvLCBMRVZFTF9MSVNULCBpc0NvbXBsZXggaWYgc3RlcCA9IGRlbCBvLCAnc3RlcCdcbiAgICAgICAgQGZyb21OdW0gPSBpZiBAZnJvbS5pc051bWJlcigpIHRoZW4gTnVtYmVyIEBmcm9tVmFyIGVsc2UgbnVsbFxuICAgICAgICBAdG9OdW0gICA9IGlmIEB0by5pc051bWJlcigpICAgdGhlbiBOdW1iZXIgQHRvVmFyICAgZWxzZSBudWxsXG4gICAgICAgIEBzdGVwTnVtID0gaWYgc3RlcD8uaXNOdW1iZXIoKSB0aGVuIE51bWJlciBAc3RlcFZhciBlbHNlIG51bGxcblxuICAgICMgV2hlbiBjb21waWxlZCBub3JtYWxseSwgdGhlIHJhbmdlIHJldHVybnMgdGhlIGNvbnRlbnRzIG9mIHRoZSAqZm9yIGxvb3AqXG4gICAgIyBuZWVkZWQgdG8gaXRlcmF0ZSBvdmVyIHRoZSB2YWx1ZXMgaW4gdGhlIHJhbmdlLiBVc2VkIGJ5IGNvbXByZWhlbnNpb25zLlxuICAgIFxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgQGNvbXBpbGVWYXJpYWJsZXMgbyB1bmxlc3MgQGZyb21WYXJcbiAgICAgICAgcmV0dXJuIEBjb21waWxlQXJyYXkobykgdW5sZXNzIG8uaW5kZXhcblxuICAgICAgICAjIFNldCB1cCBlbmRwb2ludHMuXG4gICAgICAgIGtub3duICAgID0gQGZyb21OdW0/IGFuZCBAdG9OdW0/XG4gICAgICAgIGlkeCAgICAgID0gZGVsIG8sICdpbmRleCdcbiAgICAgICAgaWR4TmFtZSAgPSBkZWwgbywgJ25hbWUnXG4gICAgICAgIG5hbWVkSW5kZXggPSBpZHhOYW1lIGFuZCBpZHhOYW1lICE9IGlkeFxuICAgICAgICB2YXJQYXJ0ICA9IFwiI3tpZHh9ID0gI3tAZnJvbUN9XCJcbiAgICAgICAgdmFyUGFydCArPSBcIiwgI3tAdG9DfVwiIGlmIEB0b0MgIT0gQHRvVmFyXG4gICAgICAgIHZhclBhcnQgKz0gXCIsICN7QHN0ZXB9XCIgaWYgQHN0ZXAgIT0gQHN0ZXBWYXJcbiAgICAgICAgW2x0LCBndF0gPSBbXCIje2lkeH0gPCN7QGVxdWFsc31cIiwgXCIje2lkeH0gPiN7QGVxdWFsc31cIl1cblxuICAgICAgICAjIEdlbmVyYXRlIHRoZSBjb25kaXRpb24uXG4gICAgICAgIGNvbmRQYXJ0ID0gaWYgQHN0ZXBOdW0/XG4gICAgICAgICAgICBpZiBAc3RlcE51bSA+IDAgdGhlbiBcIiN7bHR9ICN7QHRvVmFyfVwiIGVsc2UgXCIje2d0fSAje0B0b1Zhcn1cIlxuICAgICAgICBlbHNlIGlmIGtub3duXG4gICAgICAgICAgICBbZnJvbSwgdG9dID0gW0Bmcm9tTnVtLCBAdG9OdW1dXG4gICAgICAgICAgICBpZiBmcm9tIDw9IHRvIHRoZW4gXCIje2x0fSAje3RvfVwiIGVsc2UgXCIje2d0fSAje3RvfVwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGNvbmQgPSBpZiBAc3RlcFZhciB0aGVuIFwiI3tAc3RlcFZhcn0gPiAwXCIgZWxzZSBcIiN7QGZyb21WYXJ9IDw9ICN7QHRvVmFyfVwiXG4gICAgICAgICAgICBcIiN7Y29uZH0gPyAje2x0fSAje0B0b1Zhcn0gOiAje2d0fSAje0B0b1Zhcn1cIlxuXG4gICAgICAgICMgR2VuZXJhdGUgdGhlIHN0ZXAuXG4gICAgICAgIHN0ZXBQYXJ0ID0gaWYgQHN0ZXBWYXJcbiAgICAgICAgICAgIFwiI3tpZHh9ICs9ICN7QHN0ZXBWYXJ9XCJcbiAgICAgICAgZWxzZSBpZiBrbm93blxuICAgICAgICAgICAgaWYgbmFtZWRJbmRleFxuICAgICAgICAgICAgICAgIGlmIGZyb20gPD0gdG8gdGhlbiBcIisrI3tpZHh9XCIgZWxzZSBcIi0tI3tpZHh9XCJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpZiBmcm9tIDw9IHRvIHRoZW4gXCIje2lkeH0rK1wiIGVsc2UgXCIje2lkeH0tLVwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIG5hbWVkSW5kZXhcbiAgICAgICAgICAgICAgICBcIiN7Y29uZH0gPyArKyN7aWR4fSA6IC0tI3tpZHh9XCJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBcIiN7Y29uZH0gPyAje2lkeH0rKyA6ICN7aWR4fS0tXCJcblxuICAgICAgICB2YXJQYXJ0ICA9IFwiI3tpZHhOYW1lfSA9ICN7dmFyUGFydH1cIiBpZiBuYW1lZEluZGV4XG4gICAgICAgIHN0ZXBQYXJ0ID0gXCIje2lkeE5hbWV9ID0gI3tzdGVwUGFydH1cIiBpZiBuYW1lZEluZGV4XG5cbiAgICAgICAgIyBUaGUgZmluYWwgbG9vcCBib2R5LlxuICAgICAgICBbQG1ha2VDb2RlIFwiI3t2YXJQYXJ0fTsgI3tjb25kUGFydH07ICN7c3RlcFBhcnR9XCJdXG5cblxuICAgICMgV2hlbiB1c2VkIGFzIGEgdmFsdWUsIGV4cGFuZCB0aGUgcmFuZ2UgaW50byB0aGUgZXF1aXZhbGVudCBhcnJheS5cbiAgICBjb21waWxlQXJyYXk6IChvKSAtPlxuICAgICAgICBrbm93biA9IEBmcm9tTnVtPyBhbmQgQHRvTnVtP1xuICAgICAgICBpZiBrbm93biBhbmQgTWF0aC5hYnMoQGZyb21OdW0gLSBAdG9OdW0pIDw9IDIwXG4gICAgICAgICAgICByYW5nZSA9IFtAZnJvbU51bS4uQHRvTnVtXVxuICAgICAgICAgICAgcmFuZ2UucG9wKCkgaWYgQGV4Y2x1c2l2ZVxuICAgICAgICAgICAgcmV0dXJuIFtAbWFrZUNvZGUgXCJbI3sgcmFuZ2Uuam9pbignLCAnKSB9XVwiXVxuICAgICAgICBpZHQgICAgPSBAdGFiICsgVEFCXG4gICAgICAgIGkgICAgICA9IG8uc2NvcGUuZnJlZVZhcmlhYmxlICdpJywgc2luZ2xlOiB0cnVlXG4gICAgICAgIHJlc3VsdCA9IG8uc2NvcGUuZnJlZVZhcmlhYmxlICdyZXN1bHRzJ1xuICAgICAgICBwcmUgICAgPSBcIlxcbiN7aWR0fSN7cmVzdWx0fSA9IFtdO1wiXG4gICAgICAgIGlmIGtub3duXG4gICAgICAgICAgICBvLmluZGV4ID0gaVxuICAgICAgICAgICAgYm9keSA9IEBmcmFnbWVudHNUb1RleHQgQGNvbXBpbGVOb2RlIG9cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdmFycyA9IFwiI3tpfSA9ICN7QGZyb21DfVwiICsgaWYgQHRvQyAhPSBAdG9WYXIgdGhlbiBcIiwgI3tAdG9DfVwiIGVsc2UgJydcbiAgICAgICAgICAgIGNvbmQgPSBcIiN7QGZyb21WYXJ9IDw9ICN7QHRvVmFyfVwiXG4gICAgICAgICAgICBib2R5ID0gXCJ2YXIgI3t2YXJzfTsgI3tjb25kfSA/ICN7aX0gPCN7QGVxdWFsc30gI3tAdG9WYXJ9IDogI3tpfSA+I3tAZXF1YWxzfSAje0B0b1Zhcn07ICN7Y29uZH0gPyAje2l9KysgOiAje2l9LS1cIlxuICAgICAgICBwb3N0ICAgICA9IFwieyAje3Jlc3VsdH0ucHVzaCgje2l9KTsgfVxcbiN7aWR0fXJldHVybiAje3Jlc3VsdH07XFxuI3tvLmluZGVudH1cIlxuICAgICAgICBoYXNBcmdzID0gKG5vZGUpIC0+IG5vZGU/LmNvbnRhaW5zIGlzTGl0ZXJhbEFyZ3VtZW50c1xuICAgICAgICBhcmdzICAgID0gJywgYXJndW1lbnRzJyBpZiBoYXNBcmdzKEBmcm9tKSBvciBoYXNBcmdzKEB0bylcbiAgICAgICAgW0BtYWtlQ29kZSBcIihmdW5jdGlvbigpIHsje3ByZX1cXG4je2lkdH1mb3IgKCN7Ym9keX0pI3twb3N0fX0pLmFwcGx5KHRoaXMje2FyZ3MgPyAnJ30pXCJdXG5cbiMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICBcbiMgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcblxuIyBBbiBhcnJheSBzbGljZSBsaXRlcmFsLiBVbmxpa2UgSmF2YVNjcmlwdCdzIGBBcnJheSNzbGljZWAsIHRoZSBzZWNvbmQgcGFyYW1ldGVyXG4jIHNwZWNpZmllcyB0aGUgaW5kZXggb2YgdGhlIGVuZCBvZiB0aGUgc2xpY2UsIGp1c3QgYXMgdGhlIGZpcnN0IHBhcmFtZXRlclxuIyBpcyB0aGUgaW5kZXggb2YgdGhlIGJlZ2lubmluZy5cblxuZXhwb3J0cy5TbGljZSA9IGNsYXNzIFNsaWNlIGV4dGVuZHMgQmFzZVxuXG4gICAgY2hpbGRyZW46IFsncmFuZ2UnXVxuXG4gICAgQDogKEByYW5nZSkgLT4gc3VwZXIoKVxuXG4gICAgIyBXZSBoYXZlIHRvIGJlIGNhcmVmdWwgd2hlbiB0cnlpbmcgdG8gc2xpY2UgdGhyb3VnaCB0aGUgZW5kIG9mIHRoZSBhcnJheSxcbiAgICAjIGA5ZTlgIGlzIHVzZWQgYmVjYXVzZSBub3QgYWxsIGltcGxlbWVudGF0aW9ucyByZXNwZWN0IGB1bmRlZmluZWRgIG9yIGAxLzBgLlxuICAgICMgYDllOWAgc2hvdWxkIGJlIHNhZmUgYmVjYXVzZSBgOWU5YCA+IGAyKiozMmAsIHRoZSBtYXggYXJyYXkgbGVuZ3RoLlxuICAgIFxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgXG4gICAgICAgIHt0bywgZnJvbX0gPSBAcmFuZ2VcbiAgICAgICAgZnJvbUNvbXBpbGVkID0gZnJvbSBhbmQgZnJvbS5jb21waWxlVG9GcmFnbWVudHMobywgTEVWRUxfUEFSRU4pIG9yIFtAbWFrZUNvZGUgJzAnXVxuICAgICAgICAjIFRPRE86IGp3YWx0b24gLSBtb3ZlIHRoaXMgaW50byB0aGUgJ2lmJz9cbiAgICAgICAgaWYgdG9cbiAgICAgICAgICAgIGNvbXBpbGVkICAgICAgICAgPSB0by5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfUEFSRU5cbiAgICAgICAgICAgIGNvbXBpbGVkVGV4dCA9IEBmcmFnbWVudHNUb1RleHQgY29tcGlsZWRcbiAgICAgICAgICAgIGlmIG5vdCAobm90IEByYW5nZS5leGNsdXNpdmUgYW5kICtjb21waWxlZFRleHQgaXMgLTEpXG4gICAgICAgICAgICAgICAgdG9TdHIgPSAnLCAnICsgaWYgQHJhbmdlLmV4Y2x1c2l2ZVxuICAgICAgICAgICAgICAgICAgICBjb21waWxlZFRleHRcbiAgICAgICAgICAgICAgICBlbHNlIGlmIHRvLmlzTnVtYmVyKClcbiAgICAgICAgICAgICAgICAgICAgXCIjeytjb21waWxlZFRleHQgKyAxfVwiXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBjb21waWxlZCA9IHRvLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9BQ0NFU1NcbiAgICAgICAgICAgICAgICAgICAgXCIrI3tAZnJhZ21lbnRzVG9UZXh0IGNvbXBpbGVkfSArIDEgfHwgOWU5XCJcbiAgICAgICAgW0BtYWtlQ29kZSBcIi5zbGljZSgjeyBAZnJhZ21lbnRzVG9UZXh0IGZyb21Db21waWxlZCB9I3sgdG9TdHIgb3IgJycgfSlcIl1cblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiMgMDAwICAgMDAwICAwMDAwMDAwICAgICAgICAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICBcblxuZXhwb3J0cy5PYmogPSBjbGFzcyBPYmogZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgQDogKHByb3BzLCBAZ2VuZXJhdGVkID0gZmFsc2UpIC0+XG4gICAgICAgIEBvYmplY3RzID0gQHByb3BlcnRpZXMgPSBwcm9wcyBvciBbXVxuXG4gICAgY2hpbGRyZW46IFsncHJvcGVydGllcyddXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIHByb3BzID0gQHByb3BlcnRpZXNcbiAgICAgICAgaWYgQGdlbmVyYXRlZFxuICAgICAgICAgICAgZm9yIG5vZGUgaW4gcHJvcHMgd2hlbiBub2RlIGluc3RhbmNlb2YgVmFsdWVcbiAgICAgICAgICAgICAgICBub2RlLmVycm9yICdjYW5ub3QgaGF2ZSBhbiBpbXBsaWNpdCB2YWx1ZSBpbiBhbiBpbXBsaWNpdCBvYmplY3QnXG4gICAgICAgIGJyZWFrIGZvciBwcm9wLCBkeW5hbWljSW5kZXggaW4gcHJvcHMgd2hlbiAocHJvcC52YXJpYWJsZSBvciBwcm9wKS5iYXNlIGluc3RhbmNlb2YgUGFyZW5zXG4gICAgICAgIGhhc0R5bmFtaWMgID0gZHluYW1pY0luZGV4IDwgcHJvcHMubGVuZ3RoXG4gICAgICAgIGlkdCAgICAgICAgID0gby5pbmRlbnQgKz0gVEFCXG4gICAgICAgIGxhc3ROb25jb20gID0gQGxhc3ROb25Db21tZW50IEBwcm9wZXJ0aWVzXG4gICAgICAgIGFuc3dlciA9IFtdXG4gICAgICAgIGlmIGhhc0R5bmFtaWNcbiAgICAgICAgICAgIG9yZWYgPSBvLnNjb3BlLmZyZWVWYXJpYWJsZSAnb2JqJ1xuICAgICAgICAgICAgYW5zd2VyLnB1c2ggQG1ha2VDb2RlIFwiKFxcbiN7aWR0fSN7b3JlZn0gPSBcIlxuICAgICAgICBhbnN3ZXIucHVzaCBAbWFrZUNvZGUgXCJ7I3tpZiBwcm9wcy5sZW5ndGggaXMgMCBvciBkeW5hbWljSW5kZXggaXMgMCB0aGVuICd9JyBlbHNlICdcXG4nfVwiXG4gICAgICAgIGZvciBwcm9wLCBpIGluIHByb3BzXG4gICAgICAgICAgICBpZiBpIGlzIGR5bmFtaWNJbmRleFxuICAgICAgICAgICAgICAgIGFuc3dlci5wdXNoIEBtYWtlQ29kZSBcIlxcbiN7aWR0fX1cIiB1bmxlc3MgaSBpcyAwXG4gICAgICAgICAgICAgICAgYW5zd2VyLnB1c2ggQG1ha2VDb2RlICcsXFxuJ1xuICAgICAgICAgICAgam9pbiA9IGlmIGkgaXMgcHJvcHMubGVuZ3RoIC0gMSBvciBpIGlzIGR5bmFtaWNJbmRleCAtIDFcbiAgICAgICAgICAgICAgICAnJ1xuICAgICAgICAgICAgZWxzZSBpZiBwcm9wIGlzIGxhc3ROb25jb20gb3IgcHJvcCBpbnN0YW5jZW9mIENvbW1lbnRcbiAgICAgICAgICAgICAgICAnXFxuJ1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICcsXFxuJ1xuICAgICAgICAgICAgaW5kZW50ID0gaWYgcHJvcCBpbnN0YW5jZW9mIENvbW1lbnQgdGhlbiAnJyBlbHNlIGlkdFxuICAgICAgICAgICAgaW5kZW50ICs9IFRBQiBpZiBoYXNEeW5hbWljIGFuZCBpIDwgZHluYW1pY0luZGV4XG4gICAgICAgICAgICBpZiBwcm9wIGluc3RhbmNlb2YgQXNzaWduXG4gICAgICAgICAgICAgICAgaWYgcHJvcC5jb250ZXh0ICE9ICdvYmplY3QnXG4gICAgICAgICAgICAgICAgICAgIHByb3Aub3BlcmF0b3JUb2tlbi5lcnJvciBcInVuZXhwZWN0ZWQgI3twcm9wLm9wZXJhdG9yVG9rZW4udmFsdWV9XCJcbiAgICAgICAgICAgICAgICBpZiBwcm9wLnZhcmlhYmxlIGluc3RhbmNlb2YgVmFsdWUgYW5kIHByb3AudmFyaWFibGUuaGFzUHJvcGVydGllcygpXG4gICAgICAgICAgICAgICAgICAgIHByb3AudmFyaWFibGUuZXJyb3IgJ2ludmFsaWQgb2JqZWN0IGtleSdcbiAgICAgICAgICAgIGlmIHByb3AgaW5zdGFuY2VvZiBWYWx1ZSBhbmQgcHJvcC50aGlzXG4gICAgICAgICAgICAgICAgcHJvcCA9IG5ldyBBc3NpZ24gcHJvcC5wcm9wZXJ0aWVzWzBdLm5hbWUsIHByb3AsICdvYmplY3QnXG4gICAgICAgICAgICBpZiBwcm9wIG5vdCBpbnN0YW5jZW9mIENvbW1lbnRcbiAgICAgICAgICAgICAgICBpZiBpIDwgZHluYW1pY0luZGV4XG4gICAgICAgICAgICAgICAgICAgIGlmIHByb3Agbm90IGluc3RhbmNlb2YgQXNzaWduXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wID0gbmV3IEFzc2lnbiBwcm9wLCBwcm9wLCAnb2JqZWN0J1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgaWYgcHJvcCBpbnN0YW5jZW9mIEFzc2lnblxuICAgICAgICAgICAgICAgICAgICAgICAga2V5ID0gcHJvcC52YXJpYWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBwcm9wLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIFtrZXksIHZhbHVlXSA9IHByb3AuYmFzZS5jYWNoZSBvXG4gICAgICAgICAgICAgICAgICAgICAgICBrZXkgPSBuZXcgUHJvcGVydHlOYW1lIGtleS52YWx1ZSBpZiBrZXkgaW5zdGFuY2VvZiBJZGVudGlmaWVyTGl0ZXJhbFxuICAgICAgICAgICAgICAgICAgICBwcm9wID0gbmV3IEFzc2lnbiAobmV3IFZhbHVlIChuZXcgSWRlbnRpZmllckxpdGVyYWwgb3JlZiksIFtuZXcgQWNjZXNzIGtleV0pLCB2YWx1ZVxuICAgICAgICAgICAgaWYgaW5kZW50IHRoZW4gYW5zd2VyLnB1c2ggQG1ha2VDb2RlIGluZGVudFxuICAgICAgICAgICAgYW5zd2VyLnB1c2ggcHJvcC5jb21waWxlVG9GcmFnbWVudHMobywgTEVWRUxfVE9QKS4uLlxuICAgICAgICAgICAgaWYgam9pbiB0aGVuIGFuc3dlci5wdXNoIEBtYWtlQ29kZSBqb2luXG4gICAgICAgIGlmIGhhc0R5bmFtaWNcbiAgICAgICAgICAgIGFuc3dlci5wdXNoIEBtYWtlQ29kZSBcIixcXG4je2lkdH0je29yZWZ9XFxuI3tAdGFifSlcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBhbnN3ZXIucHVzaCBAbWFrZUNvZGUgXCJcXG4je0B0YWJ9fVwiIHVubGVzcyBwcm9wcy5sZW5ndGggaXMgMFxuICAgICAgICBpZiBAZnJvbnQgYW5kIG5vdCBoYXNEeW5hbWljIHRoZW4gQHdyYXBJbkJyYWNlcyBhbnN3ZXIgZWxzZSBhbnN3ZXJcblxuICAgIGFzc2lnbnM6IChuYW1lKSAtPlxuICAgICAgICBmb3IgcHJvcCBpbiBAcHJvcGVydGllcyB3aGVuIHByb3AuYXNzaWducyBuYW1lIHRoZW4gcmV0dXJuIHllc1xuICAgICAgICBub1xuXG4jICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwIDAwMCAgIFxuIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgICAgMDAwMDAgICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuXG5leHBvcnRzLkFyciA9IGNsYXNzIEFyciBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBAOiAob2JqcykgLT5cbiAgICAgICAgQG9iamVjdHMgPSBvYmpzIG9yIFtdXG5cbiAgICBjaGlsZHJlbjogWydvYmplY3RzJ11cblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgcmV0dXJuIFtAbWFrZUNvZGUgJ1tdJ10gdW5sZXNzIEBvYmplY3RzLmxlbmd0aFxuICAgICAgICBvLmluZGVudCArPSBUQUJcbiAgICAgICAgYW5zd2VyID0gU3BsYXQuY29tcGlsZVNwbGF0dGVkQXJyYXkgbywgQG9iamVjdHNcbiAgICAgICAgcmV0dXJuIGFuc3dlciBpZiBhbnN3ZXIubGVuZ3RoXG5cbiAgICAgICAgYW5zd2VyID0gW11cbiAgICAgICAgY29tcGlsZWRPYmpzID0gKG9iai5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfTElTVCBmb3Igb2JqIGluIEBvYmplY3RzKVxuICAgICAgICBmb3IgZnJhZ21lbnRzLCBpbmRleCBpbiBjb21waWxlZE9ianNcbiAgICAgICAgICAgIGlmIGluZGV4XG4gICAgICAgICAgICAgICAgYW5zd2VyLnB1c2ggQG1ha2VDb2RlIFwiLCBcIlxuICAgICAgICAgICAgYW5zd2VyLnB1c2ggZnJhZ21lbnRzLi4uXG4gICAgICAgIGlmIEBmcmFnbWVudHNUb1RleHQoYW5zd2VyKS5pbmRleE9mKCdcXG4nKSA+PSAwXG4gICAgICAgICAgICBhbnN3ZXIudW5zaGlmdCBAbWFrZUNvZGUgXCJbXFxuI3tvLmluZGVudH1cIlxuICAgICAgICAgICAgYW5zd2VyLnB1c2ggQG1ha2VDb2RlIFwiXFxuI3tAdGFifV1cIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBhbnN3ZXIudW5zaGlmdCBAbWFrZUNvZGUgXCJbXCJcbiAgICAgICAgICAgIGFuc3dlci5wdXNoIEBtYWtlQ29kZSBcIl1cIlxuICAgICAgICBhbnN3ZXJcblxuICAgIGFzc2lnbnM6IChuYW1lKSAtPlxuICAgICAgICBmb3Igb2JqIGluIEBvYmplY3RzIHdoZW4gb2JqLmFzc2lnbnMgbmFtZSB0aGVuIHJldHVybiB5ZXNcbiAgICAgICAgbm9cblxuIyAgMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgIFxuIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuXG4jIFRoZSBjbGFzcyBkZWZpbml0aW9uLiBJbml0aWFsaXplIGEgQ2xhc3Mgd2l0aCBpdHMgbmFtZSwgYW4gb3B0aW9uYWwgc3VwZXJjbGFzcywgYW5kIGEgbGlzdCBvZiBwcm90b3R5cGUgcHJvcGVydHkgYXNzaWdubWVudHMuXG5cbmV4cG9ydHMuQ2xhc3MgPSBjbGFzcyBDbGFzcyBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBAOiAoQHZhcmlhYmxlLCBAcGFyZW50LCBAYm9keSA9IG5ldyBCbG9jaykgLT5cbiAgICAgICAgQGJvdW5kRnVuY3MgPSBbXVxuICAgICAgICBAYm9keS5jbGFzc0JvZHkgPSB5ZXNcblxuICAgIGNoaWxkcmVuOiBbJ3ZhcmlhYmxlJywgJ3BhcmVudCcsICdib2R5J11cblxuICAgIGRlZmF1bHRDbGFzc1ZhcmlhYmxlTmFtZTogJ19DbGFzcydcblxuICAgICMgRmlndXJlIG91dCB0aGUgYXBwcm9wcmlhdGUgbmFtZSBmb3IgdGhlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIG9mIHRoaXMgY2xhc3MuXG4gICAgICAgIFxuICAgIGRldGVybWluZU5hbWU6IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gQGRlZmF1bHRDbGFzc1ZhcmlhYmxlTmFtZSB1bmxlc3MgQHZhcmlhYmxlXG4gICAgICAgIFsuLi4sIHRhaWxdID0gQHZhcmlhYmxlLnByb3BlcnRpZXNcbiAgICAgICAgbm9kZSA9IGlmIHRhaWxcbiAgICAgICAgICAgIHRhaWwgaW5zdGFuY2VvZiBBY2Nlc3MgYW5kIHRhaWwubmFtZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdmFyaWFibGUuYmFzZVxuICAgICAgICB1bmxlc3Mgbm9kZSBpbnN0YW5jZW9mIElkZW50aWZpZXJMaXRlcmFsIG9yIG5vZGUgaW5zdGFuY2VvZiBQcm9wZXJ0eU5hbWVcbiAgICAgICAgICAgIHJldHVybiBAZGVmYXVsdENsYXNzVmFyaWFibGVOYW1lXG4gICAgICAgIG5hbWUgPSBub2RlLnZhbHVlXG4gICAgICAgIHVubGVzcyB0YWlsXG4gICAgICAgICAgICBtZXNzYWdlID0gaXNVbmFzc2lnbmFibGUgbmFtZVxuICAgICAgICAgICAgQHZhcmlhYmxlLmVycm9yIG1lc3NhZ2UgaWYgbWVzc2FnZVxuICAgICAgICBpZiBuYW1lIGluIEpTX0ZPUkJJRERFTiB0aGVuIFwiXyN7bmFtZX1cIiBlbHNlIG5hbWVcblxuICAgICMgRm9yIGFsbCBgdGhpc2AtcmVmZXJlbmNlcyBhbmQgYm91bmQgZnVuY3Rpb25zIGluIHRoZSBjbGFzcyBkZWZpbml0aW9uLCBgdGhpc2AgaXMgdGhlIENsYXNzIGJlaW5nIGNvbnN0cnVjdGVkLlxuICAgICAgICBcbiAgICBzZXRDb250ZXh0OiAobmFtZSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBib2R5LnRyYXZlcnNlQ2hpbGRyZW4gZmFsc2UsIChub2RlKSAtPlxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlIGlmIG5vZGUuY2xhc3NCb2R5XG4gICAgICAgICAgICBpZiBub2RlIGluc3RhbmNlb2YgVGhpc0xpdGVyYWxcbiAgICAgICAgICAgICAgICBub2RlLnZhbHVlICAgICAgPSBuYW1lXG4gICAgICAgICAgICBlbHNlIGlmIG5vZGUgaW5zdGFuY2VvZiBDb2RlXG4gICAgICAgICAgICAgICAgbm9kZS5jb250ZXh0ICAgID0gbmFtZSBpZiBub2RlLmJvdW5kXG5cbiAgICAjIEVuc3VyZSB0aGF0IGFsbCBmdW5jdGlvbnMgYm91bmQgdG8gdGhlIGluc3RhbmNlIGFyZSBwcm94aWVkIGluIHRoZSBjb25zdHJ1Y3Rvci5cbiAgICBcbiAgICBhZGRCb3VuZEZ1bmN0aW9uczogKG8pIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgYnZhciBpbiBAYm91bmRGdW5jc1xuICAgICAgICAgICAgbGhzID0gKG5ldyBWYWx1ZSAobmV3IFRoaXNMaXRlcmFsKSwgW25ldyBBY2Nlc3MgYnZhcl0pLmNvbXBpbGUgb1xuICAgICAgICAgICAgQGN0b3IuYm9keS51bnNoaWZ0IG5ldyBMaXRlcmFsIFwiI3tsaHN9ID0gI3t1dGlsaXR5ICdiaW5kJywgb30oI3tsaHN9LCB0aGlzKVwiXG4gICAgICAgIHJldHVyblxuXG4gICAgIyBNZXJnZSB0aGUgcHJvcGVydGllcyBmcm9tIGEgdG9wLWxldmVsIG9iamVjdCBhcyBwcm90b3R5cGFsIHByb3BlcnRpZXMgb24gdGhlIGNsYXNzLlxuICAgIFxuICAgIGFkZFByb3BlcnRpZXM6IChub2RlLCBuYW1lLCBvKSAtPlxuICAgICAgICBcbiAgICAgICAgcHJvcHMgPSBub2RlLmJhc2UucHJvcGVydGllc1suLl1cbiAgICAgICAgZXhwcnMgPSB3aGlsZSBhc3NpZ24gPSBwcm9wcy5zaGlmdCgpXG4gICAgICAgICAgICBpZiBhc3NpZ24gaW5zdGFuY2VvZiBBc3NpZ25cbiAgICAgICAgICAgICAgICBiYXNlID0gYXNzaWduLnZhcmlhYmxlLmJhc2VcbiAgICAgICAgICAgICAgICBkZWxldGUgYXNzaWduLmNvbnRleHRcbiAgICAgICAgICAgICAgICBmdW5jID0gYXNzaWduLnZhbHVlXG4gICAgICAgICAgICAgICAgaWYgYmFzZS52YWx1ZSBpcyAnY29uc3RydWN0b3InXG4gICAgICAgICAgICAgICAgICAgIGlmIEBjdG9yXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NpZ24uZXJyb3IgJ2Nhbm5vdCBkZWZpbmUgbW9yZSB0aGFuIG9uZSBjb25zdHJ1Y3RvciBpbiBhIGNsYXNzJ1xuICAgICAgICAgICAgICAgICAgICBpZiBmdW5jLmJvdW5kXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NpZ24uZXJyb3IgJ2Nhbm5vdCBkZWZpbmUgYSBjb25zdHJ1Y3RvciBhcyBhIGJvdW5kIGZ1bmN0aW9uJ1xuICAgICAgICAgICAgICAgICAgICBpZiBmdW5jIGluc3RhbmNlb2YgQ29kZVxuICAgICAgICAgICAgICAgICAgICAgICAgYXNzaWduID0gQGN0b3IgPSBmdW5jXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEBleHRlcm5hbEN0b3IgPSBvLmNsYXNzU2NvcGUuZnJlZVZhcmlhYmxlICdjdG9yJ1xuICAgICAgICAgICAgICAgICAgICAgICAgYXNzaWduID0gbmV3IEFzc2lnbiBuZXcgSWRlbnRpZmllckxpdGVyYWwoQGV4dGVybmFsQ3RvciksIGZ1bmNcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGlmIGFzc2lnbi52YXJpYWJsZS50aGlzXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jLnN0YXRpYyA9IHllc1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBhY2MgPSBpZiBiYXNlLmlzQ29tcGxleCgpIHRoZW4gbmV3IEluZGV4IGJhc2UgZWxzZSBuZXcgQWNjZXNzIGJhc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2lnbi52YXJpYWJsZSA9IG5ldyBWYWx1ZShuZXcgSWRlbnRpZmllckxpdGVyYWwobmFtZSksIFsobmV3IEFjY2VzcyBuZXcgUHJvcGVydHlOYW1lICdwcm90b3R5cGUnKSwgYWNjXSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGZ1bmMgaW5zdGFuY2VvZiBDb2RlIGFuZCBmdW5jLmJvdW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGJvdW5kRnVuY3MucHVzaCBiYXNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuYy5ib3VuZCA9IG5vXG4gICAgICAgICAgICBhc3NpZ25cblxuICAgICAgICBjb21wYWN0IGV4cHJzXG5cbiAgICAjIFdhbGsgdGhlIGJvZHkgb2YgdGhlIGNsYXNzLCBsb29raW5nIGZvciBwcm90b3R5cGUgcHJvcGVydGllcyB0byBiZSBjb252ZXJ0ZWQgYW5kIHRhZ2dpbmcgc3RhdGljIGFzc2lnbm1lbnRzLlxuICAgICAgICBcbiAgICB3YWxrQm9keTogKG5hbWUsIG8pIC0+XG4gICAgICAgICNsb2cgJ3dhbGtCb2R5Jywgby5mZWF0dXJlXG4gICAgICAgIEB0cmF2ZXJzZUNoaWxkcmVuIGZhbHNlLCAoY2hpbGQpID0+XG4gICAgICAgICAgICBjb250ID0gdHJ1ZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlIGlmIGNoaWxkIGluc3RhbmNlb2YgQ2xhc3NcbiAgICAgICAgICAgIGlmIGNoaWxkIGluc3RhbmNlb2YgQmxvY2tcbiAgICAgICAgICAgICAgICBmb3Igbm9kZSwgaSBpbiBleHBzID0gY2hpbGQuZXhwcmVzc2lvbnNcbiAgICAgICAgICAgICAgICAgICAgaWYgbm9kZSBpbnN0YW5jZW9mIEFzc2lnbiBhbmQgbm9kZS52YXJpYWJsZS5sb29rc1N0YXRpYyBuYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLnZhbHVlLnN0YXRpYyA9IHllc1xuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIG5vZGUgaW5zdGFuY2VvZiBWYWx1ZSBhbmQgbm9kZS5pc09iamVjdCh0cnVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgY29udCA9IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBleHBzW2ldID0gQGFkZFByb3BlcnRpZXMgbm9kZSwgbmFtZSwgb1xuICAgICAgICAgICAgICAgIGNoaWxkLmV4cHJlc3Npb25zID0gZXhwcyA9IGZsYXR0ZW4gZXhwc1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIGNoaWxkLmNsYXNzQm9keSBhbmQgaGFzRmVhdHVyZSBvLCAnY29uZmlnX3BhcmFtZXRlcnMnXG4gICAgICAgICAgICAgICAgICAgIEBwcmVwYXJlU3VwZXJDYWxsRm9yQ29uZmlnUGFyYW1zIG5hbWUsIG8sIGNoaWxkXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBjb250IGFuZCBjaGlsZCBub3QgaW5zdGFuY2VvZiBDbGFzc1xuXG4gICAgcHJlcGFyZVN1cGVyQ2FsbEZvckNvbmZpZ1BhcmFtczogKG5hbWUsIG8sIGNsYXNzQm9keSkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBleHByIGluIGNsYXNzQm9keS5leHByZXNzaW9uc1xuICAgICAgICAgICAgaWYgZXhwciBpbnN0YW5jZW9mIENvZGVcbiAgICAgICAgICAgICAgICBjb250aW51ZSBpZiBub3QgZXhwci5wYXJhbXNbMF0/Lm5hbWVcbiAgICAgICAgICAgICAgICBwYXJhbTAgPSBleHByLnBhcmFtc1swXS5uYW1lXG4gICAgICAgICAgICAgICAgaWYgbm90IHBhcmFtMC5nZW5lcmF0ZWQgdGhlbiByZXR1cm4gIyB0aGlzIGVuc3VyZSB0aGF0IHRoaXMgZmVhdHVyZSBpcyBvbmx5IGFjdGl2ZSB3aGVuIHVzaW5nIHRoZSBzaG9ydGN1dFxuICAgICAgICAgICAgICAgIGlmIG5vdCBwYXJhbTAgaW5zdGFuY2VvZiBPYmogdGhlbiByZXR1cm4gbG9nICdDT05TVFJVQ1RPUiBQQVJBTTAgTk9UIEFOIE9CSj8nXG4gICAgICAgICAgICAgICAgaWYgbm90IGV4cHIuYm9keSBpbnN0YW5jZW9mIEJsb2NrIHRoZW4gcmV0dXJuIGxvZyAnQ09OU1RSVUNUT1IgQk9EWSBOT1QgQU4gQkxPQ0s/J1xuICAgICAgICAgICAgICAgIGZvciBib2R5RXhwciBpbiBleHByLmJvZHkuZXhwcmVzc2lvbnNcbiAgICAgICAgICAgICAgICAgICAgaWYgYm9keUV4cHIgaW5zdGFuY2VvZiBTdXBlckNhbGxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvZHlFeHByLmNvbmZpZ1BhcmFtZXRlciA9IHBhcmFtMFxuICAgICAgICAgICAgXG4gICAgIyBgdXNlIHN0cmljdGAgKGFuZCBvdGhlciBkaXJlY3RpdmVzKSBtdXN0IGJlIHRoZSBmaXJzdCBleHByZXNzaW9uIHN0YXRlbWVudChzKVxuICAgICMgb2YgYSBmdW5jdGlvbiBib2R5LiBUaGlzIG1ldGhvZCBlbnN1cmVzIHRoZSBwcm9sb2d1ZSBpcyBjb3JyZWN0bHkgcG9zaXRpb25lZFxuICAgICMgYWJvdmUgdGhlIGBjb25zdHJ1Y3RvcmAuXG4gICAgXG4gICAgaG9pc3REaXJlY3RpdmVQcm9sb2d1ZTogLT5cbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gMFxuICAgICAgICB7ZXhwcmVzc2lvbnN9ID0gQGJvZHlcbiAgICAgICAgKytpbmRleCB3aGlsZSAobm9kZSA9IGV4cHJlc3Npb25zW2luZGV4XSkgYW5kIG5vZGUgaW5zdGFuY2VvZiBDb21tZW50IG9yXG4gICAgICAgICAgICBub2RlIGluc3RhbmNlb2YgVmFsdWUgYW5kIG5vZGUuaXNTdHJpbmcoKVxuICAgICAgICBAZGlyZWN0aXZlcyA9IGV4cHJlc3Npb25zLnNwbGljZSAwLCBpbmRleFxuXG4gICAgIyBNYWtlIHN1cmUgdGhhdCBhIGNvbnN0cnVjdG9yIGlzIGRlZmluZWQgZm9yIHRoZSBjbGFzcywgYW5kIHByb3Blcmx5IGNvbmZpZ3VyZWQuXG4gICAgICAgIFxuICAgIGVuc3VyZUNvbnN0cnVjdG9yOiAobmFtZSkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBAY3RvclxuICAgICAgICAgICAgQGN0b3IgPSBuZXcgQ29kZVxuICAgICAgICAgICAgaWYgQGV4dGVybmFsQ3RvclxuICAgICAgICAgICAgICAgIEBjdG9yLmJvZHkucHVzaCBuZXcgTGl0ZXJhbCBcIiN7QGV4dGVybmFsQ3Rvcn0uYXBwbHkodGhpcywgYXJndW1lbnRzKVwiXG4gICAgICAgICAgICBlbHNlIGlmIEBwYXJlbnRcbiAgICAgICAgICAgICAgICBAY3Rvci5ib2R5LnB1c2ggbmV3IExpdGVyYWwgXCIje25hbWV9Ll9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpXCJcbiAgICAgICAgICAgIEBjdG9yLmJvZHkubWFrZVJldHVybigpXG4gICAgICAgICAgICBAYm9keS5leHByZXNzaW9ucy51bnNoaWZ0IEBjdG9yXG4gICAgICAgIEBjdG9yLmN0b3IgPSBAY3Rvci5uYW1lID0gbmFtZVxuICAgICAgICBAY3Rvci5rbGFzcyA9IG51bGxcbiAgICAgICAgQGN0b3Iubm9SZXR1cm4gPSB5ZXNcblxuICAgICMgSW5zdGVhZCBvZiBnZW5lcmF0aW5nIHRoZSBKYXZhU2NyaXB0IHN0cmluZyBkaXJlY3RseSwgd2UgYnVpbGQgdXAgdGhlXG4gICAgIyBlcXVpdmFsZW50IHN5bnRheCB0cmVlIGFuZCBjb21waWxlIHRoYXQsIGluIHBpZWNlcy4gWW91IGNhbiBzZWUgdGhlXG4gICAgIyBjb25zdHJ1Y3RvciwgcHJvcGVydHkgYXNzaWdubWVudHMsIGFuZCBpbmhlcml0YW5jZSBnZXR0aW5nIGJ1aWx0IG91dCBiZWxvdy5cbiAgICBcbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBqdW1wTm9kZSA9IEBib2R5Lmp1bXBzKClcbiAgICAgICAgICAgIGp1bXBOb2RlLmVycm9yICdDbGFzcyBib2RpZXMgY2Fubm90IGNvbnRhaW4gcHVyZSBzdGF0ZW1lbnRzJ1xuICAgICAgICBpZiBhcmd1bWVudHNOb2RlID0gQGJvZHkuY29udGFpbnMgaXNMaXRlcmFsQXJndW1lbnRzXG4gICAgICAgICAgICBhcmd1bWVudHNOb2RlLmVycm9yIFwiQ2xhc3MgYm9kaWVzIHNob3VsZG4ndCByZWZlcmVuY2UgYXJndW1lbnRzXCJcblxuICAgICAgICBuYW1lICA9IEBkZXRlcm1pbmVOYW1lKClcbiAgICAgICAgbG5hbWUgPSBuZXcgSWRlbnRpZmllckxpdGVyYWwgbmFtZVxuICAgICAgICBmdW5jICA9IG5ldyBDb2RlIFtdLCBCbG9jay53cmFwIFtAYm9keV1cbiAgICAgICAgYXJncyAgPSBbXVxuICAgICAgICBvLmNsYXNzU2NvcGUgPSBmdW5jLm1ha2VTY29wZSBvLnNjb3BlXG5cbiAgICAgICAgQGhvaXN0RGlyZWN0aXZlUHJvbG9ndWUoKVxuICAgICAgICBAc2V0Q29udGV4dCBuYW1lXG4gICAgICAgIEB3YWxrQm9keSBuYW1lLCBvXG4gICAgICAgIEBlbnN1cmVDb25zdHJ1Y3RvciBuYW1lXG4gICAgICAgIEBhZGRCb3VuZEZ1bmN0aW9ucyBvXG4gICAgICAgIEBib2R5LnNwYWNlZCA9IHllc1xuICAgICAgICBAYm9keS5leHByZXNzaW9ucy5wdXNoIGxuYW1lXG5cbiAgICAgICAgaWYgQHBhcmVudFxuICAgICAgICAgICAgc3VwZXJDbGFzcyA9IG5ldyBJZGVudGlmaWVyTGl0ZXJhbCBvLmNsYXNzU2NvcGUuZnJlZVZhcmlhYmxlICdzdXBlckNsYXNzJywgcmVzZXJ2ZTogbm9cbiAgICAgICAgICAgIEBib2R5LmV4cHJlc3Npb25zLnVuc2hpZnQgbmV3IEV4dGVuZHMgbG5hbWUsIHN1cGVyQ2xhc3NcbiAgICAgICAgICAgIGZ1bmMucGFyYW1zLnB1c2ggbmV3IFBhcmFtIHN1cGVyQ2xhc3NcbiAgICAgICAgICAgIGFyZ3MucHVzaCBAcGFyZW50XG5cbiAgICAgICAgQGJvZHkuZXhwcmVzc2lvbnMudW5zaGlmdCBAZGlyZWN0aXZlcy4uLlxuXG4gICAgICAgIGtsYXNzID0gbmV3IFBhcmVucyBuZXcgQ2FsbCBmdW5jLCBhcmdzXG4gICAgICAgIGtsYXNzID0gbmV3IEFzc2lnbiBAdmFyaWFibGUsIGtsYXNzLCBudWxsLCB7IEBtb2R1bGVEZWNsYXJhdGlvbiB9IGlmIEB2YXJpYWJsZVxuICAgICAgICBrbGFzcy5jb21waWxlVG9GcmFnbWVudHMgb1xuXG4jIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4jIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcblxuZXhwb3J0cy5Nb2R1bGVEZWNsYXJhdGlvbiA9IGNsYXNzIE1vZHVsZURlY2xhcmF0aW9uIGV4dGVuZHMgQmFzZVxuICAgIFxuICAgIEA6IChAY2xhdXNlLCBAc291cmNlKSAtPlxuICAgICAgICBAY2hlY2tTb3VyY2UoKVxuXG4gICAgY2hpbGRyZW46IFsnY2xhdXNlJywgJ3NvdXJjZSddXG5cbiAgICBpc1N0YXRlbWVudDogWUVTXG4gICAganVtcHM6ICAgICAgIFRISVNcbiAgICBtYWtlUmV0dXJuOiAgVEhJU1xuXG4gICAgY2hlY2tTb3VyY2U6IC0+XG4gICAgICAgIGlmIEBzb3VyY2U/IGFuZCBAc291cmNlIGluc3RhbmNlb2YgU3RyaW5nV2l0aEludGVycG9sYXRpb25zXG4gICAgICAgICAgICBAc291cmNlLmVycm9yICd0aGUgbmFtZSBvZiB0aGUgbW9kdWxlIHRvIGJlIGltcG9ydGVkIGZyb20gbXVzdCBiZSBhbiB1bmludGVycG9sYXRlZCBzdHJpbmcnXG5cbiAgICBjaGVja1Njb3BlOiAobywgbW9kdWxlRGVjbGFyYXRpb25UeXBlKSAtPlxuICAgICAgICBpZiBvLmluZGVudC5sZW5ndGggIT0gMFxuICAgICAgICAgICAgQGVycm9yIFwiI3ttb2R1bGVEZWNsYXJhdGlvblR5cGV9IHN0YXRlbWVudHMgbXVzdCBiZSBhdCB0b3AtbGV2ZWwgc2NvcGVcIlxuXG4jIDAwMCAgMDAgICAgIDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiMgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgIDAwMCAgICAgXG4jIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcblxuZXhwb3J0cy5JbXBvcnREZWNsYXJhdGlvbiA9IGNsYXNzIEltcG9ydERlY2xhcmF0aW9uIGV4dGVuZHMgTW9kdWxlRGVjbGFyYXRpb25cbiAgICBcbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIEBjaGVja1Njb3BlIG8sICdpbXBvcnQnXG4gICAgICAgIG8uaW1wb3J0ZWRTeW1ib2xzID0gW11cblxuICAgICAgICBjb2RlID0gW11cbiAgICAgICAgY29kZS5wdXNoIEBtYWtlQ29kZSBcIiN7QHRhYn1pbXBvcnQgXCJcbiAgICAgICAgY29kZS5wdXNoIEBjbGF1c2UuY29tcGlsZU5vZGUobykuLi4gaWYgQGNsYXVzZT9cblxuICAgICAgICBpZiBAc291cmNlPy52YWx1ZT9cbiAgICAgICAgICAgIGNvZGUucHVzaCBAbWFrZUNvZGUgJyBmcm9tICcgdW5sZXNzIEBjbGF1c2UgaXMgbnVsbFxuICAgICAgICAgICAgY29kZS5wdXNoIEBtYWtlQ29kZSBAc291cmNlLnZhbHVlXG5cbiAgICAgICAgY29kZS5wdXNoIEBtYWtlQ29kZSAnOydcbiAgICAgICAgY29kZVxuXG5leHBvcnRzLkltcG9ydENsYXVzZSA9IGNsYXNzIEltcG9ydENsYXVzZSBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBAOiAoQGRlZmF1bHRCaW5kaW5nLCBAbmFtZWRJbXBvcnRzKSAtPlxuXG4gICAgY2hpbGRyZW46IFsnZGVmYXVsdEJpbmRpbmcnLCAnbmFtZWRJbXBvcnRzJ11cblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgY29kZSA9IFtdXG5cbiAgICAgICAgaWYgQGRlZmF1bHRCaW5kaW5nP1xuICAgICAgICAgICAgY29kZS5wdXNoIEBkZWZhdWx0QmluZGluZy5jb21waWxlTm9kZShvKS4uLlxuICAgICAgICAgICAgY29kZS5wdXNoIEBtYWtlQ29kZSAnLCAnIGlmIEBuYW1lZEltcG9ydHM/XG5cbiAgICAgICAgaWYgQG5hbWVkSW1wb3J0cz9cbiAgICAgICAgICAgIGNvZGUucHVzaCBAbmFtZWRJbXBvcnRzLmNvbXBpbGVOb2RlKG8pLi4uXG5cbiAgICAgICAgY29kZVxuXG4jIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4jIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4jIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgIDAwMCAgICAgXG4jIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4jIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG5cbmV4cG9ydHMuRXhwb3J0RGVjbGFyYXRpb24gPSBjbGFzcyBFeHBvcnREZWNsYXJhdGlvbiBleHRlbmRzIE1vZHVsZURlY2xhcmF0aW9uXG4gICAgXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBAY2hlY2tTY29wZSBvLCAnZXhwb3J0J1xuXG4gICAgICAgIGNvZGUgPSBbXVxuICAgICAgICBjb2RlLnB1c2ggQG1ha2VDb2RlIFwiI3tAdGFifWV4cG9ydCBcIlxuICAgICAgICBjb2RlLnB1c2ggQG1ha2VDb2RlICdkZWZhdWx0ICcgaWYgQCBpbnN0YW5jZW9mIEV4cG9ydERlZmF1bHREZWNsYXJhdGlvblxuXG4gICAgICAgIGlmIEAgbm90IGluc3RhbmNlb2YgRXhwb3J0RGVmYXVsdERlY2xhcmF0aW9uIGFuZFxuICAgICAgICAgICAgIChAY2xhdXNlIGluc3RhbmNlb2YgQXNzaWduIG9yIEBjbGF1c2UgaW5zdGFuY2VvZiBDbGFzcylcbiAgICAgICAgICAgICMgUHJldmVudCBleHBvcnRpbmcgYW4gYW5vbnltb3VzIGNsYXNzOyBhbGwgZXhwb3J0ZWQgbWVtYmVycyBtdXN0IGJlIG5hbWVkXG4gICAgICAgICAgICBpZiBAY2xhdXNlIGluc3RhbmNlb2YgQ2xhc3MgYW5kIG5vdCBAY2xhdXNlLnZhcmlhYmxlXG4gICAgICAgICAgICAgICAgQGNsYXVzZS5lcnJvciAnYW5vbnltb3VzIGNsYXNzZXMgY2Fubm90IGJlIGV4cG9ydGVkJ1xuXG4gICAgICAgICAgICAjIFdoZW4gdGhlIEVTMjAxNSBgY2xhc3NgIGtleXdvcmQgaXMgc3VwcG9ydGVkLCBkb27igJl0IGFkZCBhIGB2YXJgIGhlcmVcbiAgICAgICAgICAgIGNvZGUucHVzaCBAbWFrZUNvZGUgJ3ZhciAnXG4gICAgICAgICAgICBAY2xhdXNlLm1vZHVsZURlY2xhcmF0aW9uID0gJ2V4cG9ydCdcblxuICAgICAgICBpZiBAY2xhdXNlLmJvZHk/IGFuZCBAY2xhdXNlLmJvZHkgaW5zdGFuY2VvZiBCbG9ja1xuICAgICAgICAgICAgY29kZSA9IGNvZGUuY29uY2F0IEBjbGF1c2UuY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX1RPUFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBjb2RlID0gY29kZS5jb25jYXQgQGNsYXVzZS5jb21waWxlTm9kZSBvXG5cbiAgICAgICAgY29kZS5wdXNoIEBtYWtlQ29kZSBcIiBmcm9tICN7QHNvdXJjZS52YWx1ZX1cIiBpZiBAc291cmNlPy52YWx1ZT9cbiAgICAgICAgY29kZS5wdXNoIEBtYWtlQ29kZSAnOydcbiAgICAgICAgY29kZVxuXG5leHBvcnRzLkV4cG9ydE5hbWVkRGVjbGFyYXRpb24gPSBjbGFzcyBFeHBvcnROYW1lZERlY2xhcmF0aW9uIGV4dGVuZHMgRXhwb3J0RGVjbGFyYXRpb25cblxuZXhwb3J0cy5FeHBvcnREZWZhdWx0RGVjbGFyYXRpb24gPSBjbGFzcyBFeHBvcnREZWZhdWx0RGVjbGFyYXRpb24gZXh0ZW5kcyBFeHBvcnREZWNsYXJhdGlvblxuXG5leHBvcnRzLkV4cG9ydEFsbERlY2xhcmF0aW9uID0gY2xhc3MgRXhwb3J0QWxsRGVjbGFyYXRpb24gZXh0ZW5kcyBFeHBvcnREZWNsYXJhdGlvblxuXG5leHBvcnRzLk1vZHVsZVNwZWNpZmllckxpc3QgPSBjbGFzcyBNb2R1bGVTcGVjaWZpZXJMaXN0IGV4dGVuZHMgQmFzZVxuICAgIFxuICAgIEA6IChAc3BlY2lmaWVycykgLT5cblxuICAgIGNoaWxkcmVuOiBbJ3NwZWNpZmllcnMnXVxuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBjb2RlID0gW11cbiAgICAgICAgby5pbmRlbnQgKz0gVEFCXG4gICAgICAgIGNvbXBpbGVkTGlzdCA9IChzcGVjaWZpZXIuY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX0xJU1QgZm9yIHNwZWNpZmllciBpbiBAc3BlY2lmaWVycylcblxuICAgICAgICBpZiBAc3BlY2lmaWVycy5sZW5ndGggIT0gMFxuICAgICAgICAgICAgY29kZS5wdXNoIEBtYWtlQ29kZSBcIntcXG4je28uaW5kZW50fVwiXG4gICAgICAgICAgICBmb3IgZnJhZ21lbnRzLCBpbmRleCBpbiBjb21waWxlZExpc3RcbiAgICAgICAgICAgICAgICBjb2RlLnB1c2ggQG1ha2VDb2RlKFwiLFxcbiN7by5pbmRlbnR9XCIpIGlmIGluZGV4XG4gICAgICAgICAgICAgICAgY29kZS5wdXNoIGZyYWdtZW50cy4uLlxuICAgICAgICAgICAgY29kZS5wdXNoIEBtYWtlQ29kZSBcIlxcbn1cIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBjb2RlLnB1c2ggQG1ha2VDb2RlICd7fSdcbiAgICAgICAgY29kZVxuXG5leHBvcnRzLkltcG9ydFNwZWNpZmllckxpc3QgPSBjbGFzcyBJbXBvcnRTcGVjaWZpZXJMaXN0IGV4dGVuZHMgTW9kdWxlU3BlY2lmaWVyTGlzdFxuXG5leHBvcnRzLkV4cG9ydFNwZWNpZmllckxpc3QgPSBjbGFzcyBFeHBvcnRTcGVjaWZpZXJMaXN0IGV4dGVuZHMgTW9kdWxlU3BlY2lmaWVyTGlzdFxuXG5leHBvcnRzLk1vZHVsZVNwZWNpZmllciA9IGNsYXNzIE1vZHVsZVNwZWNpZmllciBleHRlbmRzIEJhc2VcbiAgICBAOiAoQG9yaWdpbmFsLCBAYWxpYXMsIEBtb2R1bGVEZWNsYXJhdGlvblR5cGUpIC0+XG4gICAgICAgICMgVGhlIG5hbWUgb2YgdGhlIHZhcmlhYmxlIGVudGVyaW5nIHRoZSBsb2NhbCBzY29wZVxuICAgICAgICBAaWRlbnRpZmllciA9IGlmIEBhbGlhcz8gdGhlbiBAYWxpYXMudmFsdWUgZWxzZSBAb3JpZ2luYWwudmFsdWVcblxuICAgIGNoaWxkcmVuOiBbJ29yaWdpbmFsJywgJ2FsaWFzJ11cblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgby5zY29wZS5maW5kIEBpZGVudGlmaWVyLCBAbW9kdWxlRGVjbGFyYXRpb25UeXBlXG4gICAgICAgIGNvZGUgPSBbXVxuICAgICAgICBjb2RlLnB1c2ggQG1ha2VDb2RlIEBvcmlnaW5hbC52YWx1ZVxuICAgICAgICBjb2RlLnB1c2ggQG1ha2VDb2RlIFwiIGFzICN7QGFsaWFzLnZhbHVlfVwiIGlmIEBhbGlhcz9cbiAgICAgICAgY29kZVxuXG5leHBvcnRzLkltcG9ydFNwZWNpZmllciA9IGNsYXNzIEltcG9ydFNwZWNpZmllciBleHRlbmRzIE1vZHVsZVNwZWNpZmllclxuICAgIEA6IChpbXBvcnRlZCwgbG9jYWwpIC0+XG4gICAgICAgIHN1cGVyIGltcG9ydGVkLCBsb2NhbCwgJ2ltcG9ydCdcblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgIyBQZXIgdGhlIHNwZWMsIHN5bWJvbHMgY2Fu4oCZdCBiZSBpbXBvcnRlZCBtdWx0aXBsZSB0aW1lc1xuICAgICAgICAjIChlLmcuIGBpbXBvcnQgeyBmb28sIGZvbyB9IGZyb20gJ2xpYidgIGlzIGludmFsaWQpXG4gICAgICAgIGlmIEBpZGVudGlmaWVyIGluIG8uaW1wb3J0ZWRTeW1ib2xzIG9yIG8uc2NvcGUuY2hlY2soQGlkZW50aWZpZXIpXG4gICAgICAgICAgICBAZXJyb3IgXCInI3tAaWRlbnRpZmllcn0nIGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBvLmltcG9ydGVkU3ltYm9scy5wdXNoIEBpZGVudGlmaWVyXG4gICAgICAgIHN1cGVyIG9cblxuZXhwb3J0cy5JbXBvcnREZWZhdWx0U3BlY2lmaWVyID0gY2xhc3MgSW1wb3J0RGVmYXVsdFNwZWNpZmllciBleHRlbmRzIEltcG9ydFNwZWNpZmllclxuXG5leHBvcnRzLkltcG9ydE5hbWVzcGFjZVNwZWNpZmllciA9IGNsYXNzIEltcG9ydE5hbWVzcGFjZVNwZWNpZmllciBleHRlbmRzIEltcG9ydFNwZWNpZmllclxuXG5leHBvcnRzLkV4cG9ydFNwZWNpZmllciA9IGNsYXNzIEV4cG9ydFNwZWNpZmllciBleHRlbmRzIE1vZHVsZVNwZWNpZmllclxuICAgIEA6IChsb2NhbCwgZXhwb3J0ZWQpIC0+XG4gICAgICAgIHN1cGVyIGxvY2FsLCBleHBvcnRlZCwgJ2V4cG9ydCdcblxuIyAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAgMDAwMCAgMDAwICBcbiMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgMCAwMDAgIFxuIyAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcblxuIyBUaGUgKipBc3NpZ24qKiBpcyB1c2VkIHRvIGFzc2lnbiBhIGxvY2FsIHZhcmlhYmxlIHRvIHZhbHVlLCBvciB0byBzZXQgdGhlXG4jIHByb3BlcnR5IG9mIGFuIG9iamVjdCAtLSBpbmNsdWRpbmcgd2l0aGluIG9iamVjdCBsaXRlcmFscy5cblxuZXhwb3J0cy5Bc3NpZ24gPSBjbGFzcyBBc3NpZ24gZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgQDogKEB2YXJpYWJsZSwgQHZhbHVlLCBAY29udGV4dCwgb3B0aW9ucyA9IHt9KSAtPlxuICAgICAgICB7QHBhcmFtLCBAc3VicGF0dGVybiwgQG9wZXJhdG9yVG9rZW4sIEBtb2R1bGVEZWNsYXJhdGlvbn0gPSBvcHRpb25zXG5cbiAgICBjaGlsZHJlbjogWyd2YXJpYWJsZScsICd2YWx1ZSddXG5cbiAgICBpc1N0YXRlbWVudDogKG8pIC0+XG4gICAgICAgIG8/LmxldmVsIGlzIExFVkVMX1RPUCBhbmQgQGNvbnRleHQ/IGFuZCAoQG1vZHVsZURlY2xhcmF0aW9uIG9yIFwiP1wiIGluIEBjb250ZXh0KVxuXG4gICAgY2hlY2tBc3NpZ25hYmlsaXR5OiAobywgdmFyQmFzZSkgLT5cbiAgICAgICAgaWYgT2JqZWN0OjpoYXNPd25Qcm9wZXJ0eS5jYWxsKG8uc2NvcGUucG9zaXRpb25zLCB2YXJCYXNlLnZhbHVlKSBhbmRcbiAgICAgICAgICAgICBvLnNjb3BlLnZhcmlhYmxlc1tvLnNjb3BlLnBvc2l0aW9uc1t2YXJCYXNlLnZhbHVlXV0udHlwZSBpcyAnaW1wb3J0J1xuICAgICAgICAgICAgdmFyQmFzZS5lcnJvciBcIicje3ZhckJhc2UudmFsdWV9JyBpcyByZWFkLW9ubHlcIlxuXG4gICAgYXNzaWduczogKG5hbWUpIC0+XG4gICAgICAgIEBbaWYgQGNvbnRleHQgaXMgJ29iamVjdCcgdGhlbiAndmFsdWUnIGVsc2UgJ3ZhcmlhYmxlJ10uYXNzaWducyBuYW1lXG5cbiAgICB1bmZvbGRTb2FrOiAobykgLT5cbiAgICAgICAgdW5mb2xkU29hayBvLCB0aGlzLCAndmFyaWFibGUnXG5cbiAgICAjIENvbXBpbGUgYW4gYXNzaWdubWVudCwgZGVsZWdhdGluZyB0byBgY29tcGlsZVBhdHRlcm5NYXRjaGAgb3JcbiAgICAjIGBjb21waWxlU3BsaWNlYCBpZiBhcHByb3ByaWF0ZS4gS2VlcCB0cmFjayBvZiB0aGUgbmFtZSBvZiB0aGUgYmFzZSBvYmplY3RcbiAgICAjIHdlJ3ZlIGJlZW4gYXNzaWduZWQgdG8sIGZvciBjb3JyZWN0IGludGVybmFsIHJlZmVyZW5jZXMuIElmIHRoZSB2YXJpYWJsZVxuICAgICMgaGFzIG5vdCBiZWVuIHNlZW4geWV0IHdpdGhpbiB0aGUgY3VycmVudCBzY29wZSwgZGVjbGFyZSBpdC5cbiAgICBcbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBpc1ZhbHVlID0gQHZhcmlhYmxlIGluc3RhbmNlb2YgVmFsdWVcbiAgICAgICAgICAgIHJldHVybiBAY29tcGlsZVBhdHRlcm5NYXRjaCBvIGlmIEB2YXJpYWJsZS5pc0FycmF5KCkgb3IgQHZhcmlhYmxlLmlzT2JqZWN0KClcbiAgICAgICAgICAgIHJldHVybiBAY29tcGlsZVNwbGljZSAgICAgICBvIGlmIEB2YXJpYWJsZS5pc1NwbGljZSgpXG4gICAgICAgICAgICByZXR1cm4gQGNvbXBpbGVDb25kaXRpb25hbCAgbyBpZiBAY29udGV4dCBpbiBbJ3x8PScsICcmJj0nLCAnPz0nXVxuICAgICAgICAgICAgcmV0dXJuIEBjb21waWxlU3BlY2lhbE1hdGggIG8gaWYgQGNvbnRleHQgaW4gWycqKj0nLCAnLy89JywgJyUlPSddXG4gICAgICAgIGlmIEB2YWx1ZSBpbnN0YW5jZW9mIENvZGVcbiAgICAgICAgICAgIGlmIEB2YWx1ZS5zdGF0aWNcbiAgICAgICAgICAgICAgICBAdmFsdWUua2xhc3MgPSBAdmFyaWFibGUuYmFzZVxuICAgICAgICAgICAgICAgIEB2YWx1ZS5uYW1lICA9IEB2YXJpYWJsZS5wcm9wZXJ0aWVzWzBdXG4gICAgICAgICAgICAgICAgQHZhbHVlLnZhcmlhYmxlID0gQHZhcmlhYmxlXG4gICAgICAgICAgICBlbHNlIGlmIEB2YXJpYWJsZS5wcm9wZXJ0aWVzPy5sZW5ndGggPj0gMlxuICAgICAgICAgICAgICAgIFtwcm9wZXJ0aWVzLi4uLCBwcm90b3R5cGUsIG5hbWVdID0gQHZhcmlhYmxlLnByb3BlcnRpZXNcbiAgICAgICAgICAgICAgICBpZiBwcm90b3R5cGUubmFtZT8udmFsdWUgaXMgJ3Byb3RvdHlwZSdcbiAgICAgICAgICAgICAgICAgICAgQHZhbHVlLmtsYXNzID0gbmV3IFZhbHVlIEB2YXJpYWJsZS5iYXNlLCBwcm9wZXJ0aWVzXG4gICAgICAgICAgICAgICAgICAgIEB2YWx1ZS5uYW1lICA9IG5hbWVcbiAgICAgICAgICAgICAgICAgICAgQHZhbHVlLnZhcmlhYmxlID0gQHZhcmlhYmxlXG4gICAgICAgIHVubGVzcyBAY29udGV4dFxuICAgICAgICAgICAgdmFyQmFzZSA9IEB2YXJpYWJsZS51bndyYXBBbGwoKVxuICAgICAgICAgICAgdW5sZXNzIHZhckJhc2UuaXNBc3NpZ25hYmxlKClcbiAgICAgICAgICAgICAgICBAdmFyaWFibGUuZXJyb3IgXCInI3tAdmFyaWFibGUuY29tcGlsZSBvfScgY2FuJ3QgYmUgYXNzaWduZWRcIlxuICAgICAgICAgICAgdW5sZXNzIHZhckJhc2UuaGFzUHJvcGVydGllcz8oKVxuICAgICAgICAgICAgICAgICMgYG1vZHVsZURlY2xhcmF0aW9uYCBjYW4gYmUgYCdpbXBvcnQnYCBvciBgJ2V4cG9ydCdgXG4gICAgICAgICAgICAgICAgaWYgQG1vZHVsZURlY2xhcmF0aW9uXG4gICAgICAgICAgICAgICAgICAgIEBjaGVja0Fzc2lnbmFiaWxpdHkgbywgdmFyQmFzZVxuICAgICAgICAgICAgICAgICAgICBvLnNjb3BlLmFkZCB2YXJCYXNlLnZhbHVlLCBAbW9kdWxlRGVjbGFyYXRpb25cbiAgICAgICAgICAgICAgICBlbHNlIGlmIEBwYXJhbVxuICAgICAgICAgICAgICAgICAgICBvLnNjb3BlLmFkZCB2YXJCYXNlLnZhbHVlLCAndmFyJ1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQGNoZWNrQXNzaWduYWJpbGl0eSBvLCB2YXJCYXNlXG4gICAgICAgICAgICAgICAgICAgIG8uc2NvcGUuZmluZCB2YXJCYXNlLnZhbHVlXG5cbiAgICAgICAgdmFsID0gQHZhbHVlLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9MSVNUXG4gICAgICAgIEB2YXJpYWJsZS5mcm9udCA9IHRydWUgaWYgaXNWYWx1ZSBhbmQgQHZhcmlhYmxlLmJhc2UgaW5zdGFuY2VvZiBPYmpcbiAgICAgICAgY29tcGlsZWROYW1lID0gQHZhcmlhYmxlLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9MSVNUXG5cbiAgICAgICAgaWYgQGNvbnRleHQgaXMgJ29iamVjdCdcbiAgICAgICAgICAgIGlmIEBmcmFnbWVudHNUb1RleHQoY29tcGlsZWROYW1lKSBpbiBKU19GT1JCSURERU5cbiAgICAgICAgICAgICAgICBjb21waWxlZE5hbWUudW5zaGlmdCBAbWFrZUNvZGUgJ1wiJ1xuICAgICAgICAgICAgICAgIGNvbXBpbGVkTmFtZS5wdXNoIEBtYWtlQ29kZSAnXCInXG4gICAgICAgICAgICByZXR1cm4gY29tcGlsZWROYW1lLmNvbmNhdCBAbWFrZUNvZGUoXCI6IFwiKSwgdmFsXG5cbiAgICAgICAgYW5zd2VyID0gY29tcGlsZWROYW1lLmNvbmNhdCBAbWFrZUNvZGUoXCIgI3sgQGNvbnRleHQgb3IgJz0nIH0gXCIpLCB2YWxcbiAgICAgICAgaWYgby5sZXZlbCA8PSBMRVZFTF9MSVNUIHRoZW4gYW5zd2VyIGVsc2UgQHdyYXBJbkJyYWNlcyBhbnN3ZXJcblxuICAgICMgQnJpZWYgaW1wbGVtZW50YXRpb24gb2YgcmVjdXJzaXZlIHBhdHRlcm4gbWF0Y2hpbmcsIHdoZW4gYXNzaWduaW5nIGFycmF5IG9yXG4gICAgIyBvYmplY3QgbGl0ZXJhbHMgdG8gYSB2YWx1ZS4gUGVla3MgYXQgdGhlaXIgcHJvcGVydGllcyB0byBhc3NpZ24gaW5uZXIgbmFtZXMuXG4gICAgXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgY29tcGlsZVBhdHRlcm5NYXRjaDogKG8pIC0+XG4gICAgICAgIFxuICAgICAgICB0b3AgICAgICAgPSBvLmxldmVsIGlzIExFVkVMX1RPUFxuICAgICAgICB7dmFsdWV9ICAgPSB0aGlzXG4gICAgICAgIHtvYmplY3RzfSA9IEB2YXJpYWJsZS5iYXNlXG4gICAgICAgIFxuICAgICAgICB1bmxlc3Mgb2xlbiA9IG9iamVjdHMubGVuZ3RoXG4gICAgICAgICAgICBjb2RlID0gdmFsdWUuY29tcGlsZVRvRnJhZ21lbnRzIG9cbiAgICAgICAgICAgIHJldHVybiBpZiBvLmxldmVsID49IExFVkVMX09QIHRoZW4gQHdyYXBJbkJyYWNlcyBjb2RlIGVsc2UgY29kZVxuICAgICAgICAgICAgXG4gICAgICAgIFtvYmpdID0gb2JqZWN0c1xuICAgICAgICBcbiAgICAgICAgaWYgb2xlbiBpcyAxIGFuZCBvYmogaW5zdGFuY2VvZiBFeHBhbnNpb25cbiAgICAgICAgICAgIG9iai5lcnJvciAnRGVzdHJ1Y3R1cmluZyBhc3NpZ25tZW50IGhhcyBubyB0YXJnZXQnXG4gICAgICAgICAgICBcbiAgICAgICAgaXNPYmplY3QgPSBAdmFyaWFibGUuaXNPYmplY3QoKVxuICAgICAgICBcbiAgICAgICAgaWYgdG9wIGFuZCBvbGVuIGlzIDEgYW5kIG9iaiBub3QgaW5zdGFuY2VvZiBTcGxhdFxuICAgICAgICAgICAgIyBQaWNrIHRoZSBwcm9wZXJ0eSBzdHJhaWdodCBvZmYgdGhlIHZhbHVlIHdoZW4gdGhlcmXigJlzIGp1c3Qgb25lIHRvIHBpY2tcbiAgICAgICAgICAgICMgKG5vIG5lZWQgdG8gY2FjaGUgdGhlIHZhbHVlIGludG8gYSB2YXJpYWJsZSkuXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWUgPSBudWxsXG4gICAgICAgICAgICBpZiBvYmogaW5zdGFuY2VvZiBBc3NpZ24gYW5kIG9iai5jb250ZXh0IGlzICdvYmplY3QnXG4gICAgICAgICAgICAgICAgIyBBIHJlZ3VsYXIgb2JqZWN0IHBhdHRlcm4tbWF0Y2guXG4gICAgICAgICAgICAgICAge3ZhcmlhYmxlOiB7YmFzZTogaWR4fSwgdmFsdWU6IG9ian0gPSBvYmpcbiAgICAgICAgICAgICAgICBpZiBvYmogaW5zdGFuY2VvZiBBc3NpZ25cbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlID0gb2JqLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgIG9iaiA9IG9iai52YXJpYWJsZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGlmIG9iaiBpbnN0YW5jZW9mIEFzc2lnblxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0VmFsdWUgPSBvYmoudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgb2JqID0gb2JqLnZhcmlhYmxlXG4gICAgICAgICAgICAgICAgaWR4ID0gaWYgaXNPYmplY3QgIyBBIHNob3J0aGFuZCBge2EsIGIsIEBjfSA9IHZhbGAgcGF0dGVybi1tYXRjaC5cbiAgICAgICAgICAgICAgICAgICAgaWYgb2JqLnRoaXNcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iai5wcm9wZXJ0aWVzWzBdLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IFByb3BlcnR5TmFtZSBvYmoudW53cmFwKCkudmFsdWVcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICMgQSByZWd1bGFyIGFycmF5IHBhdHRlcm4tbWF0Y2guXG4gICAgICAgICAgICAgICAgICAgIG5ldyBOdW1iZXJMaXRlcmFsIDBcbiAgICAgICAgICAgIGFjYyA9IGlkeC51bndyYXAoKSBpbnN0YW5jZW9mIFByb3BlcnR5TmFtZVxuICAgICAgICAgICAgdmFsdWUgPSBuZXcgVmFsdWUgdmFsdWVcbiAgICAgICAgICAgIHZhbHVlLnByb3BlcnRpZXMucHVzaCBuZXcgKGlmIGFjYyB0aGVuIEFjY2VzcyBlbHNlIEluZGV4KSBpZHhcbiAgICAgICAgICAgIG1lc3NhZ2UgPSBpc1VuYXNzaWduYWJsZSBvYmoudW53cmFwKCkudmFsdWVcbiAgICAgICAgICAgIG9iai5lcnJvciBtZXNzYWdlIGlmIG1lc3NhZ2VcbiAgICAgICAgICAgIHZhbHVlID0gbmV3IE9wICc/JywgdmFsdWUsIGRlZmF1bHRWYWx1ZSBpZiBkZWZhdWx0VmFsdWVcbiAgICAgICAgICAgIHJldHVybiBuZXcgQXNzaWduKG9iaiwgdmFsdWUsIG51bGwsIHBhcmFtOiBAcGFyYW0pLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9UT1BcbiAgICAgICAgICAgIFxuICAgICAgICB2dmFyICAgICA9IHZhbHVlLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9MSVNUXG4gICAgICAgIHZ2YXJUZXh0ID0gQGZyYWdtZW50c1RvVGV4dCB2dmFyXG4gICAgICAgIGFzc2lnbnMgID0gW11cbiAgICAgICAgZXhwYW5kZWRJZHggPSBmYWxzZVxuICAgICAgICAjIE1ha2UgdnZhciBpbnRvIGEgc2ltcGxlIHZhcmlhYmxlIGlmIGl0IGlzbid0IGFscmVhZHkuXG4gICAgICAgIGlmIHZhbHVlLnVud3JhcCgpIG5vdCBpbnN0YW5jZW9mIElkZW50aWZpZXJMaXRlcmFsIG9yIEB2YXJpYWJsZS5hc3NpZ25zKHZ2YXJUZXh0KVxuICAgICAgICAgICAgYXNzaWducy5wdXNoIFtAbWFrZUNvZGUoXCIjeyByZWYgPSBvLnNjb3BlLmZyZWVWYXJpYWJsZSAncmVmJyB9ID0gXCIpLCB2dmFyLi4uXVxuICAgICAgICAgICAgdnZhciA9IFtAbWFrZUNvZGUgcmVmXVxuICAgICAgICAgICAgdnZhclRleHQgPSByZWZcbiAgICAgICAgICAgIFxuICAgICAgICBmb3Igb2JqLCBpIGluIG9iamVjdHNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWR4ID0gaVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBub3QgZXhwYW5kZWRJZHggYW5kIG9iaiBpbnN0YW5jZW9mIFNwbGF0XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgbmFtZSA9IG9iai5uYW1lLnVud3JhcCgpLnZhbHVlXG4gICAgICAgICAgICAgICAgb2JqID0gb2JqLnVud3JhcCgpXG4gICAgICAgICAgICAgICAgdmFsID0gXCIje29sZW59IDw9ICN7dnZhclRleHR9Lmxlbmd0aCA/ICN7IHV0aWxpdHkgJ3NsaWNlJywgbyB9LmNhbGwoI3t2dmFyVGV4dH0sICN7aX1cIlxuICAgICAgICAgICAgICAgIGlmIHJlc3QgPSBvbGVuIC0gaSAtIDFcbiAgICAgICAgICAgICAgICAgICAgaXZhciA9IG8uc2NvcGUuZnJlZVZhcmlhYmxlICdpJywgc2luZ2xlOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIHZhbCArPSBcIiwgI3tpdmFyfSA9ICN7dnZhclRleHR9Lmxlbmd0aCAtICN7cmVzdH0pIDogKCN7aXZhcn0gPSAje2l9LCBbXSlcIlxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgdmFsICs9IFwiKSA6IFtdXCJcbiAgICAgICAgICAgICAgICB2YWwgICAgID0gbmV3IExpdGVyYWwgdmFsXG4gICAgICAgICAgICAgICAgZXhwYW5kZWRJZHggPSBcIiN7aXZhcn0rK1wiXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBlbHNlIGlmIG5vdCBleHBhbmRlZElkeCBhbmQgb2JqIGluc3RhbmNlb2YgRXhwYW5zaW9uXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgcmVzdCA9IG9sZW4gLSBpIC0gMVxuICAgICAgICAgICAgICAgICAgICBpZiByZXN0IGlzIDFcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4cGFuZGVkSWR4ID0gXCIje3Z2YXJUZXh0fS5sZW5ndGggLSAxXCJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgaXZhciA9IG8uc2NvcGUuZnJlZVZhcmlhYmxlICdpJywgc2luZ2xlOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWwgPSBuZXcgTGl0ZXJhbCBcIiN7aXZhcn0gPSAje3Z2YXJUZXh0fS5sZW5ndGggLSAje3Jlc3R9XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4cGFuZGVkSWR4ID0gXCIje2l2YXJ9KytcIlxuICAgICAgICAgICAgICAgICAgICAgICAgYXNzaWducy5wdXNoIHZhbC5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfTElTVFxuICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaWYgb2JqIGluc3RhbmNlb2YgU3BsYXQgb3Igb2JqIGluc3RhbmNlb2YgRXhwYW5zaW9uXG4gICAgICAgICAgICAgICAgICAgIG9iai5lcnJvciBcIm11bHRpcGxlIHNwbGF0cy9leHBhbnNpb25zIGFyZSBkaXNhbGxvd2VkIGluIGFuIGFzc2lnbm1lbnRcIlxuICAgICAgICAgICAgICAgIGRlZmF1bHRWYWx1ZSA9IG51bGxcbiAgICAgICAgICAgICAgICBpZiBvYmogaW5zdGFuY2VvZiBBc3NpZ24gYW5kIG9iai5jb250ZXh0IGlzICdvYmplY3QnICMgQSByZWd1bGFyIG9iamVjdCBwYXR0ZXJuLW1hdGNoLlxuICAgICAgICAgICAgICAgICAgICB7dmFyaWFibGU6IHtiYXNlOiBpZHh9LCB2YWx1ZTogb2JqfSA9IG9ialxuICAgICAgICAgICAgICAgICAgICBpZiBvYmogaW5zdGFuY2VvZiBBc3NpZ25cbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRWYWx1ZSA9IG9iai52YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqID0gb2JqLnZhcmlhYmxlXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBpZiBvYmogaW5zdGFuY2VvZiBBc3NpZ25cbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRWYWx1ZSA9IG9iai52YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqID0gb2JqLnZhcmlhYmxlXG4gICAgICAgICAgICAgICAgICAgIGlkeCA9IGlmIGlzT2JqZWN0ICMgQSBzaG9ydGhhbmQgYHthLCBiLCBAY30gPSB2YWxgIHBhdHRlcm4tbWF0Y2guXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBvYmoudGhpcyBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmoucHJvcGVydGllc1swXS5uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IFByb3BlcnR5TmFtZSBvYmoudW53cmFwKCkudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgZWxzZSAjIEEgcmVndWxhciBhcnJheSBwYXR0ZXJuLW1hdGNoLlxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IExpdGVyYWwgZXhwYW5kZWRJZHggb3IgaWR4XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBuYW1lID0gb2JqLnVud3JhcCgpLnZhbHVlXG4gICAgICAgICAgICAgICAgYWNjID0gaWR4LnVud3JhcCgpIGluc3RhbmNlb2YgUHJvcGVydHlOYW1lXG4gICAgICAgICAgICAgICAgdmFsID0gbmV3IFZhbHVlIG5ldyBMaXRlcmFsKHZ2YXJUZXh0KSwgW25ldyAoaWYgYWNjIHRoZW4gQWNjZXNzIGVsc2UgSW5kZXgpIGlkeF1cbiAgICAgICAgICAgICAgICB2YWwgPSBuZXcgT3AgJz8nLCB2YWwsIGRlZmF1bHRWYWx1ZSBpZiBkZWZhdWx0VmFsdWVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIG5hbWU/XG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IGlzVW5hc3NpZ25hYmxlIG5hbWVcbiAgICAgICAgICAgICAgICBvYmouZXJyb3IgbWVzc2FnZSBpZiBtZXNzYWdlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGFzc2lnbnMucHVzaCBuZXcgQXNzaWduKG9iaiwgdmFsLCBudWxsLCBwYXJhbTogQHBhcmFtLCBzdWJwYXR0ZXJuOiB5ZXMpLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9MSVNUXG4gICAgICAgICAgICBcbiAgICAgICAgYXNzaWducy5wdXNoIHZ2YXIgdW5sZXNzIHRvcCBvciBAc3VicGF0dGVyblxuICAgICAgICBmcmFnbWVudHMgPSBAam9pbkZyYWdtZW50QXJyYXlzIGFzc2lnbnMsICcsICdcbiAgICAgICAgaWYgby5sZXZlbCA8IExFVkVMX0xJU1QgdGhlbiBmcmFnbWVudHMgZWxzZSBAd3JhcEluQnJhY2VzIGZyYWdtZW50c1xuXG4gICAgIyBXaGVuIGNvbXBpbGluZyBhIGNvbmRpdGlvbmFsIGFzc2lnbm1lbnQsIHRha2UgY2FyZSB0byBlbnN1cmUgdGhhdCB0aGVcbiAgICAjIG9wZXJhbmRzIGFyZSBvbmx5IGV2YWx1YXRlZCBvbmNlLCBldmVuIHRob3VnaCB3ZSBoYXZlIHRvIHJlZmVyZW5jZSB0aGVtIG1vcmUgdGhhbiBvbmNlLlxuICAgIFxuICAgIGNvbXBpbGVDb25kaXRpb25hbDogKG8pIC0+XG4gICAgICAgIFxuICAgICAgICBbbGVmdCwgcmlnaHRdID0gQHZhcmlhYmxlLmNhY2hlUmVmZXJlbmNlIG9cbiAgICAgICAgIyBEaXNhbGxvdyBjb25kaXRpb25hbCBhc3NpZ25tZW50IG9mIHVuZGVmaW5lZCB2YXJpYWJsZXMuXG4gICAgICAgIGlmIG5vdCBsZWZ0LnByb3BlcnRpZXMubGVuZ3RoIGFuZCBsZWZ0LmJhc2UgaW5zdGFuY2VvZiBMaXRlcmFsIGFuZFxuICAgICAgICAgICAgICAgICAgICAgbGVmdC5iYXNlIG5vdCBpbnN0YW5jZW9mIFRoaXNMaXRlcmFsIGFuZCBub3Qgby5zY29wZS5jaGVjayBsZWZ0LmJhc2UudmFsdWVcbiAgICAgICAgICAgIEB2YXJpYWJsZS5lcnJvciBcInRoZSB2YXJpYWJsZSBcXFwiI3tsZWZ0LmJhc2UudmFsdWV9XFxcIiBjYW4ndCBiZSBhc3NpZ25lZCB3aXRoICN7QGNvbnRleHR9IGJlY2F1c2UgaXQgaGFzIG5vdCBiZWVuIGRlY2xhcmVkIGJlZm9yZVwiXG4gICAgICAgIGlmIFwiP1wiIGluIEBjb250ZXh0XG4gICAgICAgICAgICBvLmlzRXhpc3RlbnRpYWxFcXVhbHMgPSB0cnVlXG4gICAgICAgICAgICBuZXcgSWYobmV3IEV4aXN0ZW5jZShsZWZ0KSwgcmlnaHQsIHR5cGU6ICdpZicpLmFkZEVsc2UobmV3IEFzc2lnbihyaWdodCwgQHZhbHVlLCAnPScpKS5jb21waWxlVG9GcmFnbWVudHMgb1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBmcmFnbWVudHMgPSBuZXcgT3AoQGNvbnRleHRbLi4uLTFdLCBsZWZ0LCBuZXcgQXNzaWduKHJpZ2h0LCBAdmFsdWUsICc9JykpLmNvbXBpbGVUb0ZyYWdtZW50cyBvXG4gICAgICAgICAgICBpZiBvLmxldmVsIDw9IExFVkVMX0xJU1QgdGhlbiBmcmFnbWVudHMgZWxzZSBAd3JhcEluQnJhY2VzIGZyYWdtZW50c1xuXG4gICAgIyBDb252ZXJ0IHNwZWNpYWwgbWF0aCBhc3NpZ25tZW50IG9wZXJhdG9ycyBsaWtlIGBhICoqPSBiYCB0byB0aGUgZXF1aXZhbGVudFxuICAgICMgZXh0ZW5kZWQgZm9ybSBgYSA9IGEgKiogYmAgYW5kIHRoZW4gY29tcGlsZXMgdGhhdC5cbiAgICBcbiAgICBjb21waWxlU3BlY2lhbE1hdGg6IChvKSAtPlxuICAgICAgICBcbiAgICAgICAgW2xlZnQsIHJpZ2h0XSA9IEB2YXJpYWJsZS5jYWNoZVJlZmVyZW5jZSBvXG4gICAgICAgIG5ldyBBc3NpZ24obGVmdCwgbmV3IE9wKEBjb250ZXh0Wy4uLi0xXSwgcmlnaHQsIEB2YWx1ZSkpLmNvbXBpbGVUb0ZyYWdtZW50cyBvXG5cbiAgICAjIENvbXBpbGUgdGhlIGFzc2lnbm1lbnQgZnJvbSBhbiBhcnJheSBzcGxpY2UgbGl0ZXJhbCwgdXNpbmcgSmF2YVNjcmlwdCdzIGBBcnJheSNzcGxpY2VgIG1ldGhvZC5cbiAgICBcbiAgICBjb21waWxlU3BsaWNlOiAobykgLT5cbiAgICAgICAgXG4gICAgICAgIHtyYW5nZToge2Zyb20sIHRvLCBleGNsdXNpdmV9fSA9IEB2YXJpYWJsZS5wcm9wZXJ0aWVzLnBvcCgpXG4gICAgICAgIG5hbWUgPSBAdmFyaWFibGUuY29tcGlsZSBvXG4gICAgICAgIGlmIGZyb21cbiAgICAgICAgICAgIFtmcm9tRGVjbCwgZnJvbVJlZl0gPSBAY2FjaGVUb0NvZGVGcmFnbWVudHMgZnJvbS5jYWNoZSBvLCBMRVZFTF9PUFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBmcm9tRGVjbCA9IGZyb21SZWYgPSAnMCdcbiAgICAgICAgaWYgdG9cbiAgICAgICAgICAgIGlmIGZyb20/LmlzTnVtYmVyKCkgYW5kIHRvLmlzTnVtYmVyKClcbiAgICAgICAgICAgICAgICB0byA9IHRvLmNvbXBpbGUobykgLSBmcm9tUmVmXG4gICAgICAgICAgICAgICAgdG8gKz0gMSB1bmxlc3MgZXhjbHVzaXZlXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdG8gPSB0by5jb21waWxlKG8sIExFVkVMX0FDQ0VTUykgKyAnIC0gJyArIGZyb21SZWZcbiAgICAgICAgICAgICAgICB0byArPSAnICsgMScgdW5sZXNzIGV4Y2x1c2l2ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0byA9IFwiOWU5XCJcbiAgICAgICAgW3ZhbERlZiwgdmFsUmVmXSA9IEB2YWx1ZS5jYWNoZSBvLCBMRVZFTF9MSVNUXG4gICAgICAgIGFuc3dlciA9IFtdLmNvbmNhdCBAbWFrZUNvZGUoXCJbXS5zcGxpY2UuYXBwbHkoI3tuYW1lfSwgWyN7ZnJvbURlY2x9LCAje3RvfV0uY29uY2F0KFwiKSwgdmFsRGVmLCBAbWFrZUNvZGUoXCIpKSwgXCIpLCB2YWxSZWZcbiAgICAgICAgaWYgby5sZXZlbCA+IExFVkVMX1RPUCB0aGVuIEB3cmFwSW5CcmFjZXMgYW5zd2VyIGVsc2UgYW5zd2VyXG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIFxuXG4jIEEgZnVuY3Rpb24gZGVmaW5pdGlvbi4gVGhpcyBpcyB0aGUgb25seSBub2RlIHRoYXQgY3JlYXRlcyBhIG5ldyBTY29wZS5cbiMgV2hlbiBmb3IgdGhlIHB1cnBvc2VzIG9mIHdhbGtpbmcgdGhlIGNvbnRlbnRzIG9mIGEgZnVuY3Rpb24gYm9keSwgdGhlIENvZGUgaGFzIG5vICpjaGlsZHJlbiogLS0gdGhleSdyZSB3aXRoaW4gdGhlIGlubmVyIHNjb3BlLlxuXG5leHBvcnRzLkNvZGUgPSBjbGFzcyBDb2RlIGV4dGVuZHMgQmFzZVxuICAgIFxuICAgIEA6IChwYXJhbXMsIGJvZHksIHRhZykgLT5cbiAgICAgICAgQHBhcmFtcyA9IHBhcmFtcyBvciBbXVxuICAgICAgICBAYm9keSAgID0gYm9keSBvciBuZXcgQmxvY2tcbiAgICAgICAgQGJvdW5kICA9IHRhZyBpcyAnYm91bmRmdW5jJ1xuICAgICAgICBAaXNHZW5lcmF0b3IgPSAhIUBib2R5LmNvbnRhaW5zIChub2RlKSAtPlxuICAgICAgICAgICAgKG5vZGUgaW5zdGFuY2VvZiBPcCBhbmQgbm9kZS5pc1lpZWxkKCkpIG9yIG5vZGUgaW5zdGFuY2VvZiBZaWVsZFJldHVyblxuXG4gICAgY2hpbGRyZW46IFsncGFyYW1zJywgJ2JvZHknXVxuXG4gICAgaXNTdGF0ZW1lbnQ6IC0+ICEhQGN0b3JcblxuICAgIGp1bXBzOiBOT1xuXG4gICAgbWFrZVNjb3BlOiAocGFyZW50U2NvcGUpIC0+IG5ldyBTY29wZSBwYXJlbnRTY29wZSwgQGJvZHksIHRoaXNcblxuICAgICMgQ29tcGlsYXRpb24gY3JlYXRlcyBhIG5ldyBzY29wZSB1bmxlc3MgZXhwbGljaXRseSBhc2tlZCB0byBzaGFyZSB3aXRoIHRoZSBvdXRlciBzY29wZS4gXG4gICAgIyBIYW5kbGVzIHNwbGF0IHBhcmFtZXRlcnMgaW4gdGhlIHBhcmFtZXRlciBsaXN0IGJ5IHBlZWtpbmcgYXQgdGhlIEphdmFTY3JpcHQgYGFyZ3VtZW50c2Agb2JqZWN0LiBcbiAgICAjIElmIHRoZSBmdW5jdGlvbiBpcyBib3VuZCB3aXRoIHRoZSBgPT5gIGFycm93LCBnZW5lcmF0ZXMgYSB3cmFwcGVyIHRoYXQgc2F2ZXMgdGhlIGN1cnJlbnQgdmFsdWUgb2YgYHRoaXNgIHRocm91Z2ggYSBjbG9zdXJlLlxuICAgIFxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cblxuICAgICAgICBpZiBAYm91bmQgYW5kIG8uc2NvcGUubWV0aG9kPy5ib3VuZFxuICAgICAgICAgICAgQGNvbnRleHQgPSBvLnNjb3BlLm1ldGhvZC5jb250ZXh0XG5cbiAgICAgICAgaWYgQGJvdW5kIGFuZCBub3QgQGNvbnRleHQgIyBIYW5kbGUgYm91bmQgZnVuY3Rpb25zIGVhcmx5LlxuICAgICAgICAgICAgQGNvbnRleHQgPSAnX3RoaXMnXG4gICAgICAgICAgICB3cmFwcGVyID0gbmV3IENvZGUgW25ldyBQYXJhbSBuZXcgSWRlbnRpZmllckxpdGVyYWwgQGNvbnRleHRdLCBuZXcgQmxvY2sgW3RoaXNdXG4gICAgICAgICAgICBib3VuZGZ1bmMgPSBuZXcgQ2FsbCh3cmFwcGVyLCBbbmV3IFRoaXNMaXRlcmFsXSlcbiAgICAgICAgICAgIGJvdW5kZnVuYy51cGRhdGVMb2NhdGlvbkRhdGFJZk1pc3NpbmcgQGxvY2F0aW9uRGF0YVxuICAgICAgICAgICAgcmV0dXJuIGJvdW5kZnVuYy5jb21waWxlTm9kZShvKVxuXG4gICAgICAgIG8uc2NvcGUgICAgICAgICA9IGRlbChvLCAnY2xhc3NTY29wZScpIG9yIEBtYWtlU2NvcGUgby5zY29wZVxuICAgICAgICBvLnNjb3BlLnNoYXJlZCAgPSBkZWwobywgJ3NoYXJlZFNjb3BlJylcbiAgICAgICAgby5pbmRlbnQgICAgICAgKz0gVEFCXG4gICAgICAgIGRlbGV0ZSBvLmJhcmVcbiAgICAgICAgZGVsZXRlIG8uaXNFeGlzdGVudGlhbEVxdWFsc1xuICAgICAgICBwYXJhbXMgPSBbXVxuICAgICAgICBleHBycyAgPSBbXVxuICAgICAgICBmb3IgcGFyYW0gaW4gQHBhcmFtcyB3aGVuIHBhcmFtIG5vdCBpbnN0YW5jZW9mIEV4cGFuc2lvblxuICAgICAgICAgICAgby5zY29wZS5wYXJhbWV0ZXIgcGFyYW0uYXNSZWZlcmVuY2Ugb1xuICAgICAgICBmb3IgcGFyYW0gaW4gQHBhcmFtcyB3aGVuIHBhcmFtLnNwbGF0IG9yIHBhcmFtIGluc3RhbmNlb2YgRXhwYW5zaW9uXG4gICAgICAgICAgICBmb3IgcCBpbiBAcGFyYW1zIHdoZW4gcCBub3QgaW5zdGFuY2VvZiBFeHBhbnNpb24gYW5kIHAubmFtZS52YWx1ZVxuICAgICAgICAgICAgICAgIG8uc2NvcGUuYWRkIHAubmFtZS52YWx1ZSwgJ3ZhcicsIHllc1xuICAgICAgICAgICAgc3BsYXRzID0gbmV3IEFzc2lnbiBuZXcgVmFsdWUobmV3IEFycihwLmFzUmVmZXJlbmNlIG8gZm9yIHAgaW4gQHBhcmFtcykpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBWYWx1ZSBuZXcgSWRlbnRpZmllckxpdGVyYWwgJ2FyZ3VtZW50cydcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIGZvciBwYXJhbSBpbiBAcGFyYW1zXG4gICAgICAgICAgICBpZiBwYXJhbS5pc0NvbXBsZXgoKVxuICAgICAgICAgICAgICAgIHZhbCA9IHJlZiA9IHBhcmFtLmFzUmVmZXJlbmNlIG9cbiAgICAgICAgICAgICAgICB2YWwgPSBuZXcgT3AgJz8nLCByZWYsIHBhcmFtLnZhbHVlIGlmIHBhcmFtLnZhbHVlXG4gICAgICAgICAgICAgICAgZXhwcnMucHVzaCBuZXcgQXNzaWduIG5ldyBWYWx1ZShwYXJhbS5uYW1lKSwgdmFsLCAnPScsIHBhcmFtOiB5ZXNcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZWYgPSBwYXJhbVxuICAgICAgICAgICAgICAgIGlmIHBhcmFtLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgIGxpdCA9IG5ldyBMaXRlcmFsIHJlZi5uYW1lLnZhbHVlICsgJyA9PSBudWxsJ1xuICAgICAgICAgICAgICAgICAgICB2YWwgPSBuZXcgQXNzaWduIG5ldyBWYWx1ZShwYXJhbS5uYW1lKSwgcGFyYW0udmFsdWUsICc9J1xuICAgICAgICAgICAgICAgICAgICBleHBycy5wdXNoIG5ldyBJZiBsaXQsIHZhbFxuICAgICAgICAgICAgcGFyYW1zLnB1c2ggcmVmIHVubGVzcyBzcGxhdHNcbiAgICAgICAgd2FzRW1wdHkgPSBAYm9keS5pc0VtcHR5KClcbiAgICAgICAgZXhwcnMudW5zaGlmdCBzcGxhdHMgaWYgc3BsYXRzXG4gICAgICAgIEBib2R5LmV4cHJlc3Npb25zLnVuc2hpZnQgZXhwcnMuLi4gaWYgZXhwcnMubGVuZ3RoXG4gICAgICAgIGZvciBwLCBpIGluIHBhcmFtc1xuICAgICAgICAgICAgcGFyYW1zW2ldID0gcC5jb21waWxlVG9GcmFnbWVudHMgb1xuICAgICAgICAgICAgby5zY29wZS5wYXJhbWV0ZXIgQGZyYWdtZW50c1RvVGV4dCBwYXJhbXNbaV1cbiAgICAgICAgdW5pcXMgPSBbXVxuICAgICAgICBcbiAgICAgICAgQGVhY2hQYXJhbU5hbWUgKG5hbWUsIG5vZGUpIC0+XG4gICAgICAgICAgICBub2RlLmVycm9yIFwibXVsdGlwbGUgcGFyYW1ldGVycyBuYW1lZCAje25hbWV9XCIgaWYgbmFtZSBpbiB1bmlxc1xuICAgICAgICAgICAgdW5pcXMucHVzaCBuYW1lXG4gICAgICAgIFxuICAgICAgICBAYm9keS5tYWtlUmV0dXJuKCkgdW5sZXNzIHdhc0VtcHR5IG9yIEBub1JldHVyblxuICAgICAgICBjb2RlID0gJ2Z1bmN0aW9uJ1xuICAgICAgICBjb2RlICs9ICcqJyBpZiBAaXNHZW5lcmF0b3JcbiAgICAgICAgY29kZSArPSAnICcgKyBAbmFtZSBpZiBAY3RvclxuICAgICAgICBjb2RlICs9ICcoJ1xuICAgICAgICBcbiAgICAgICAgYW5zd2VyID0gW0BtYWtlQ29kZShjb2RlKV1cbiAgICAgICAgXG4gICAgICAgIGZvciBwLCBpIGluIHBhcmFtc1xuICAgICAgICAgICAgaWYgaSB0aGVuIGFuc3dlci5wdXNoIEBtYWtlQ29kZSBcIiwgXCJcbiAgICAgICAgICAgIGFuc3dlci5wdXNoIHAuLi5cbiAgICAgICAgYW5zd2VyLnB1c2ggQG1ha2VDb2RlICcpIHsnXG4gICAgICAgIGFuc3dlciA9IGFuc3dlci5jb25jYXQoQG1ha2VDb2RlKFwiXFxuXCIpLCBAYm9keS5jb21waWxlV2l0aERlY2xhcmF0aW9ucyhvKSwgQG1ha2VDb2RlKFwiXFxuI3tAdGFifVwiKSkgdW5sZXNzIEBib2R5LmlzRW1wdHkoKVxuICAgICAgICBhbnN3ZXIucHVzaCBAbWFrZUNvZGUgJ30nXG5cbiAgICAgICAgcmV0dXJuIFtAbWFrZUNvZGUoQHRhYiksIGFuc3dlci4uLl0gaWYgQGN0b3JcbiAgICAgICAgaWYgQGZyb250IG9yIChvLmxldmVsID49IExFVkVMX0FDQ0VTUykgdGhlbiBAd3JhcEluQnJhY2VzIGFuc3dlciBlbHNlIGFuc3dlclxuXG4gICAgZWFjaFBhcmFtTmFtZTogKGl0ZXJhdG9yKSAtPlxuICAgICAgICBwYXJhbS5lYWNoTmFtZSBpdGVyYXRvciBmb3IgcGFyYW0gaW4gQHBhcmFtc1xuXG4gICAgIyBTaG9ydC1jaXJjdWl0IGB0cmF2ZXJzZUNoaWxkcmVuYCBtZXRob2QgdG8gcHJldmVudCBpdCBmcm9tIGNyb3NzaW5nIHNjb3BlIGJvdW5kYXJpZXMgdW5sZXNzIGBjcm9zc1Njb3BlYCBpcyBgdHJ1ZWAuXG4gICAgXG4gICAgdHJhdmVyc2VDaGlsZHJlbjogKGNyb3NzU2NvcGUsIGZ1bmMpIC0+XG4gICAgICAgIFxuICAgICAgICBzdXBlcihjcm9zc1Njb3BlLCBmdW5jKSBpZiBjcm9zc1Njb3BlXG5cbiMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMCAgICAgMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICBcbiMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG5cbiMgQSBwYXJhbWV0ZXIgaW4gYSBmdW5jdGlvbiBkZWZpbml0aW9uLiBCZXlvbmQgYSB0eXBpY2FsIEphdmFTY3JpcHQgcGFyYW1ldGVyLFxuIyB0aGVzZSBwYXJhbWV0ZXJzIGNhbiBhbHNvIGF0dGFjaCB0aGVtc2VsdmVzIHRvIHRoZSBjb250ZXh0IG9mIHRoZSBmdW5jdGlvbixcbiMgYXMgd2VsbCBhcyBiZSBhIHNwbGF0LCBnYXRoZXJpbmcgdXAgYSBncm91cCBvZiBwYXJhbWV0ZXJzIGludG8gYW4gYXJyYXkuXG5cbmV4cG9ydHMuUGFyYW0gPSBjbGFzcyBQYXJhbSBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBAOiAoQG5hbWUsIEB2YWx1ZSwgQHNwbGF0KSAtPlxuICAgICAgICBtZXNzYWdlID0gaXNVbmFzc2lnbmFibGUgQG5hbWUudW53cmFwQWxsKCkudmFsdWVcbiAgICAgICAgQG5hbWUuZXJyb3IgbWVzc2FnZSBpZiBtZXNzYWdlXG4gICAgICAgICMgdGhlIGZvbGxvd2luZyBlcnJvciBkb2Vucyd0IHRocm93IGFueW1vcmUgaW4ga29mZmVlIChjb25maWcgcGFyYW1ldGVycylcbiAgICAgICAgIyBpZiBAbmFtZSBpbnN0YW5jZW9mIE9iaiBhbmQgQG5hbWUuZ2VuZXJhdGVkXG4gICAgICAgICAgICAjIHRva2VuID0gQG5hbWUub2JqZWN0c1swXS5vcGVyYXRvclRva2VuXG4gICAgICAgICAgICAjIHRva2VuLmVycm9yIFwidW5leHBlY3RlZCAje3Rva2VuLnZhbHVlfVwiXG5cbiAgICBjaGlsZHJlbjogWyduYW1lJywgJ3ZhbHVlJ11cblxuICAgIGNvbXBpbGVUb0ZyYWdtZW50czogKG8pIC0+XG4gICAgICAgIFxuICAgICAgICBAbmFtZS5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfTElTVFxuXG4gICAgYXNSZWZlcmVuY2U6IChvKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIEByZWZlcmVuY2UgaWYgQHJlZmVyZW5jZVxuICAgICAgICBub2RlID0gQG5hbWVcbiAgICAgICAgaWYgbm9kZS50aGlzXG4gICAgICAgICAgICBuYW1lID0gbm9kZS5wcm9wZXJ0aWVzWzBdLm5hbWUudmFsdWVcbiAgICAgICAgICAgIG5hbWUgPSBcIl8je25hbWV9XCIgaWYgbmFtZSBpbiBKU19GT1JCSURERU5cbiAgICAgICAgICAgIG5vZGUgPSBuZXcgSWRlbnRpZmllckxpdGVyYWwgby5zY29wZS5mcmVlVmFyaWFibGUgbmFtZVxuICAgICAgICBlbHNlIGlmIG5vZGUuaXNDb21wbGV4KClcbiAgICAgICAgICAgIG5vZGUgPSBuZXcgSWRlbnRpZmllckxpdGVyYWwgby5zY29wZS5mcmVlVmFyaWFibGUgJ2FyZydcbiAgICAgICAgbm9kZSA9IG5ldyBWYWx1ZSBub2RlXG4gICAgICAgIG5vZGUgPSBuZXcgU3BsYXQgbm9kZSBpZiBAc3BsYXRcbiAgICAgICAgbm9kZS51cGRhdGVMb2NhdGlvbkRhdGFJZk1pc3NpbmcgQGxvY2F0aW9uRGF0YVxuICAgICAgICBAcmVmZXJlbmNlID0gbm9kZVxuXG4gICAgaXNDb21wbGV4OiAtPlxuICAgICAgICBcbiAgICAgICAgQG5hbWUuaXNDb21wbGV4KClcblxuICAgICMgSXRlcmF0ZXMgdGhlIG5hbWUgb3IgbmFtZXMgb2YgYSBgUGFyYW1gLlxuICAgICMgSW4gYSBzZW5zZSwgYSBkZXN0cnVjdHVyZWQgcGFyYW1ldGVyIHJlcHJlc2VudHMgbXVsdGlwbGUgSlMgcGFyYW1ldGVycy4gVGhpc1xuICAgICMgbWV0aG9kIGFsbG93cyB0byBpdGVyYXRlIHRoZW0gYWxsLlxuICAgICMgVGhlIGBpdGVyYXRvcmAgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgYXMgYGl0ZXJhdG9yKG5hbWUsIG5vZGUpYCB3aGVyZVxuICAgICMgYG5hbWVgIGlzIHRoZSBuYW1lIG9mIHRoZSBwYXJhbWV0ZXIgYW5kIGBub2RlYCBpcyB0aGUgQVNUIG5vZGUgY29ycmVzcG9uZGluZyB0byB0aGF0IG5hbWUuXG4gICAgXG4gICAgZWFjaE5hbWU6IChpdGVyYXRvciwgbmFtZSA9IEBuYW1lKS0+XG4gICAgICAgIFxuICAgICAgICBhdFBhcmFtID0gKG9iaikgLT4gXG4gICAgICAgICAgICBpdGVyYXRvciBcIkAje29iai5wcm9wZXJ0aWVzWzBdLm5hbWUudmFsdWV9XCIsIG9ialxuICAgICAgICBcbiAgICAgICAgaWYgbmFtZSBpbnN0YW5jZW9mIElkZW50aWZpZXJMaXRlcmFsXG4gICAgICAgICAgICByZXR1cm4gaWYgbmFtZSBpbnN0YW5jZW9mIE51bGxMaXRlcmFsXG4gICAgICAgICAgICByZXR1cm4gaXRlcmF0b3IgbmFtZS52YWx1ZSwgbmFtZSAjIHNpbXBsZSBsaXRlcmFscyBgZm9vYCwgYF9gLCBldGMuXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gYXRQYXJhbSBuYW1lIGlmIG5hbWUgaW5zdGFuY2VvZiBWYWx1ZSAjIGF0LXBhcmFtcyBgQGZvb2BcbiAgICAgICAgXG4gICAgICAgIGZvciBvYmogaW4gbmFtZS5vYmplY3RzID8gW11cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgb2JqIGluc3RhbmNlb2YgQXNzaWduIGFuZCBub3Qgb2JqLmNvbnRleHQ/ICMgZGVzdHJ1Y3R1cmVkIHBhcmFtZXRlciB3aXRoIGRlZmF1bHQgdmFsdWVcbiAgICAgICAgICAgICAgICBvYmogPSBvYmoudmFyaWFibGVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgb2JqIGluc3RhbmNlb2YgQXNzaWduICMgYXNzaWdubWVudHMgd2l0aGluIGRlc3RydWN0dXJlZCBwYXJhbWV0ZXJzIGB7Zm9vOmJhcn1gXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgb2JqLnZhbHVlIGluc3RhbmNlb2YgQXNzaWduICMgLi4uIHBvc3NpYmx5IHdpdGggYSBkZWZhdWx0IHZhbHVlXG4gICAgICAgICAgICAgICAgICAgIG9iaiA9IG9iai52YWx1ZVxuICAgICAgICAgICAgICAgIEBlYWNoTmFtZSBpdGVyYXRvciwgb2JqLnZhbHVlLnVud3JhcCgpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGVsc2UgaWYgb2JqIGluc3RhbmNlb2YgU3BsYXQgIyBzcGxhdHMgd2l0aGluIGRlc3RydWN0dXJlZCBwYXJhbWV0ZXJzIGBbeHMuLi5dYFxuICAgICAgICAgICAgICAgIG5vZGUgPSBvYmoubmFtZS51bndyYXAoKVxuICAgICAgICAgICAgICAgIGl0ZXJhdG9yIG5vZGUudmFsdWUsIG5vZGVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGVsc2UgaWYgb2JqIGluc3RhbmNlb2YgVmFsdWVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBvYmouaXNBcnJheSgpIG9yIG9iai5pc09iamVjdCgpICMgZGVzdHJ1Y3R1cmVkIHBhcmFtZXRlcnMgd2l0aGluIGRlc3RydWN0dXJlZCBwYXJhbWV0ZXJzIGBbe2F9XWBcbiAgICAgICAgICAgICAgICAgICAgQGVhY2hOYW1lIGl0ZXJhdG9yLCBvYmouYmFzZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgb2JqLnRoaXMgIyBhdC1wYXJhbXMgd2l0aGluIGRlc3RydWN0dXJlZCBwYXJhbWV0ZXJzIGB7QGZvb31gXG4gICAgICAgICAgICAgICAgICAgIGF0UGFyYW0gb2JqXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBpdGVyYXRvciBvYmouYmFzZS52YWx1ZSwgb2JqLmJhc2UgIyBzaW1wbGUgZGVzdHJ1Y3R1cmVkIHBhcmFtZXRlcnMge2Zvb31cbiAgICAgICAgICAgIGVsc2UgaWYgb2JqIG5vdCBpbnN0YW5jZW9mIEV4cGFuc2lvblxuICAgICAgICAgICAgICAgIG9iai5lcnJvciBcImlsbGVnYWwgcGFyYW1ldGVyICN7b2JqLmNvbXBpbGUoKX1cIlxuICAgICAgICAgICAgICAgIFxuICAgICAgICByZXR1cm5cblxuIyAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiMgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAwICAgICAwMDAgICAgIFxuIyAgICAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4jIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcblxuIyBBIHNwbGF0LCBlaXRoZXIgYXMgYSBwYXJhbWV0ZXIgdG8gYSBmdW5jdGlvbiwgYW4gYXJndW1lbnQgdG8gYSBjYWxsLCBvciBhcyBwYXJ0IG9mIGEgZGVzdHJ1Y3R1cmluZyBhc3NpZ25tZW50LlxuXG5leHBvcnRzLlNwbGF0ID0gY2xhc3MgU3BsYXQgZXh0ZW5kcyBCYXNlXG5cbiAgICBjaGlsZHJlbjogWyduYW1lJ11cblxuICAgIGlzQXNzaWduYWJsZTogWUVTXG5cbiAgICBAOiAobmFtZSkgLT5cbiAgICAgICAgQG5hbWUgPSBpZiBuYW1lLmNvbXBpbGUgdGhlbiBuYW1lIGVsc2UgbmV3IExpdGVyYWwgbmFtZVxuXG4gICAgYXNzaWduczogKG5hbWUpIC0+XG4gICAgICAgIEBuYW1lLmFzc2lnbnMgbmFtZVxuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBAbmFtZS5jb21waWxlVG9GcmFnbWVudHMgb1xuXG4gICAgdW53cmFwOiAtPiBAbmFtZVxuXG4gICAgIyBVdGlsaXR5IGZ1bmN0aW9uIHRoYXQgY29udmVydHMgYW4gYXJiaXRyYXJ5IG51bWJlciBvZiBlbGVtZW50cywgbWl4ZWQgd2l0aCBzcGxhdHMsIHRvIGEgcHJvcGVyIGFycmF5LlxuICAgIFxuICAgIEBjb21waWxlU3BsYXR0ZWRBcnJheTogKG8sIGxpc3QsIGFwcGx5KSAtPlxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSAtMVxuICAgICAgICBjb250aW51ZSB3aGlsZSAobm9kZSA9IGxpc3RbKytpbmRleF0pIGFuZCBub2RlIG5vdCBpbnN0YW5jZW9mIFNwbGF0XG4gICAgICAgIHJldHVybiBbXSBpZiBpbmRleCA+PSBsaXN0Lmxlbmd0aFxuICAgICAgICBpZiBsaXN0Lmxlbmd0aCBpcyAxXG4gICAgICAgICAgICBub2RlID0gbGlzdFswXVxuICAgICAgICAgICAgZnJhZ21lbnRzID0gbm9kZS5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfTElTVFxuICAgICAgICAgICAgcmV0dXJuIGZyYWdtZW50cyBpZiBhcHBseVxuICAgICAgICAgICAgcmV0dXJuIFtdLmNvbmNhdCBub2RlLm1ha2VDb2RlKFwiI3sgdXRpbGl0eSAnc2xpY2UnLCBvIH0uY2FsbChcIiksIGZyYWdtZW50cywgbm9kZS5tYWtlQ29kZShcIilcIilcbiAgICAgICAgYXJncyA9IGxpc3RbaW5kZXguLl1cbiAgICAgICAgZm9yIG5vZGUsIGkgaW4gYXJnc1xuICAgICAgICAgICAgY29tcGlsZWROb2RlID0gbm9kZS5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfTElTVFxuICAgICAgICAgICAgYXJnc1tpXSA9IGlmIG5vZGUgaW5zdGFuY2VvZiBTcGxhdFxuICAgICAgICAgICAgdGhlbiBbXS5jb25jYXQgbm9kZS5tYWtlQ29kZShcIiN7IHV0aWxpdHkgJ3NsaWNlJywgbyB9LmNhbGwoXCIpLCBjb21waWxlZE5vZGUsIG5vZGUubWFrZUNvZGUoXCIpXCIpXG4gICAgICAgICAgICBlbHNlIFtdLmNvbmNhdCBub2RlLm1ha2VDb2RlKFwiW1wiKSwgY29tcGlsZWROb2RlLCBub2RlLm1ha2VDb2RlKFwiXVwiKVxuICAgICAgICBpZiBpbmRleCBpcyAwXG4gICAgICAgICAgICBub2RlID0gbGlzdFswXVxuICAgICAgICAgICAgY29uY2F0UGFydCA9IChub2RlLmpvaW5GcmFnbWVudEFycmF5cyBhcmdzWzEuLl0sICcsICcpXG4gICAgICAgICAgICByZXR1cm4gYXJnc1swXS5jb25jYXQgbm9kZS5tYWtlQ29kZShcIi5jb25jYXQoXCIpLCBjb25jYXRQYXJ0LCBub2RlLm1ha2VDb2RlKFwiKVwiKVxuICAgICAgICBiYXNlID0gKG5vZGUuY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX0xJU1QgZm9yIG5vZGUgaW4gbGlzdFsuLi5pbmRleF0pXG4gICAgICAgIGJhc2UgPSBsaXN0WzBdLmpvaW5GcmFnbWVudEFycmF5cyBiYXNlLCAnLCAnXG4gICAgICAgIGNvbmNhdFBhcnQgPSBsaXN0W2luZGV4XS5qb2luRnJhZ21lbnRBcnJheXMgYXJncywgJywgJ1xuICAgICAgICBbLi4uLCBsYXN0XSA9IGxpc3RcbiAgICAgICAgW10uY29uY2F0IGxpc3RbMF0ubWFrZUNvZGUoXCJbXCIpLCBiYXNlLCBsaXN0W2luZGV4XS5tYWtlQ29kZShcIl0uY29uY2F0KFwiKSwgY29uY2F0UGFydCwgbGFzdC5tYWtlQ29kZShcIilcIilcblxuIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiMgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4jIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcblxuIyBVc2VkIHRvIHNraXAgdmFsdWVzIGluc2lkZSBhbiBhcnJheSBkZXN0cnVjdHVyaW5nIChwYXR0ZXJuIG1hdGNoaW5nKSBvciBwYXJhbWV0ZXIgbGlzdC5cblxuZXhwb3J0cy5FeHBhbnNpb24gPSBjbGFzcyBFeHBhbnNpb24gZXh0ZW5kcyBCYXNlXG5cbiAgICBpc0NvbXBsZXg6IE5PXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIEBlcnJvciAnRXhwYW5zaW9uIG11c3QgYmUgdXNlZCBpbnNpZGUgYSBkZXN0cnVjdHVyaW5nIGFzc2lnbm1lbnQgb3IgcGFyYW1ldGVyIGxpc3QnXG5cbiAgICBhc1JlZmVyZW5jZTogKG8pIC0+XG4gICAgICAgIHRoaXNcblxuICAgIGVhY2hOYW1lOiAoaXRlcmF0b3IpIC0+XG5cbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIFxuIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAwMCAgICAgMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG5cbiMgQSB3aGlsZSBsb29wLCB0aGUgb25seSBzb3J0IG9mIGxvdy1sZXZlbCBsb29wIGV4cG9zZWQgYnkgS29mZmVlLiBGcm9tXG4jIGl0LCBhbGwgb3RoZXIgbG9vcHMgY2FuIGJlIG1hbnVmYWN0dXJlZC4gVXNlZnVsIGluIGNhc2VzIHdoZXJlIHlvdSBuZWVkIG1vcmVcbiMgZmxleGliaWxpdHkgb3IgbW9yZSBzcGVlZCB0aGFuIGEgY29tcHJlaGVuc2lvbiBjYW4gcHJvdmlkZS5cblxuZXhwb3J0cy5XaGlsZSA9IGNsYXNzIFdoaWxlIGV4dGVuZHMgQmFzZVxuICAgIFxuICAgIEA6IChjb25kaXRpb24sIG9wdGlvbnMpIC0+XG4gICAgICAgIEBjb25kaXRpb24gPSBpZiBvcHRpb25zPy5pbnZlcnQgdGhlbiBjb25kaXRpb24uaW52ZXJ0KCkgZWxzZSBjb25kaXRpb25cbiAgICAgICAgQGd1YXJkICAgICAgID0gb3B0aW9ucz8uZ3VhcmRcblxuICAgIGNoaWxkcmVuOiBbJ2NvbmRpdGlvbicsICdndWFyZCcsICdib2R5J11cblxuICAgIGlzU3RhdGVtZW50OiBZRVNcblxuICAgIG1ha2VSZXR1cm46IChyZXMpIC0+XG4gICAgICAgIGlmIHJlc1xuICAgICAgICAgICAgc3VwZXJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHJldHVybnMgPSBub3QgQGp1bXBzIGxvb3A6IHllc1xuICAgICAgICAgICAgdGhpc1xuXG4gICAgYWRkQm9keTogKEBib2R5KSAtPlxuICAgICAgICB0aGlzXG5cbiAgICBqdW1wczogLT5cbiAgICAgICAge2V4cHJlc3Npb25zfSA9IEBib2R5XG4gICAgICAgIHJldHVybiBubyB1bmxlc3MgZXhwcmVzc2lvbnMubGVuZ3RoXG4gICAgICAgIGZvciBub2RlIGluIGV4cHJlc3Npb25zXG4gICAgICAgICAgICByZXR1cm4ganVtcE5vZGUgaWYganVtcE5vZGUgPSBub2RlLmp1bXBzIGxvb3A6IHllc1xuICAgICAgICBub1xuXG4gICAgIyBUaGUgbWFpbiBkaWZmZXJlbmNlIGZyb20gYSBKYXZhU2NyaXB0ICp3aGlsZSogaXMgdGhhdCB0aGUgS29mZmVlXG4gICAgIyAqd2hpbGUqIGNhbiBiZSB1c2VkIGFzIGEgcGFydCBvZiBhIGxhcmdlciBleHByZXNzaW9uIC0tIHdoaWxlIGxvb3BzIG1heVxuICAgICMgcmV0dXJuIGFuIGFycmF5IGNvbnRhaW5pbmcgdGhlIGNvbXB1dGVkIHJlc3VsdCBvZiBlYWNoIGl0ZXJhdGlvbi5cbiAgICBcbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIG8uaW5kZW50ICs9IFRBQlxuICAgICAgICBzZXQgICAgICAgICAgPSAnJ1xuICAgICAgICB7Ym9keX0gICA9IHRoaXNcbiAgICAgICAgaWYgYm9keS5pc0VtcHR5KClcbiAgICAgICAgICAgIGJvZHkgPSBAbWFrZUNvZGUgJydcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgQHJldHVybnNcbiAgICAgICAgICAgICAgICBib2R5Lm1ha2VSZXR1cm4gcnZhciA9IG8uc2NvcGUuZnJlZVZhcmlhYmxlICdyZXN1bHRzJ1xuICAgICAgICAgICAgICAgIHNldCAgPSBcIiN7QHRhYn0je3J2YXJ9ID0gW107XFxuXCJcbiAgICAgICAgICAgIGlmIEBndWFyZFxuICAgICAgICAgICAgICAgIGlmIGJvZHkuZXhwcmVzc2lvbnMubGVuZ3RoID4gMVxuICAgICAgICAgICAgICAgICAgICBib2R5LmV4cHJlc3Npb25zLnVuc2hpZnQgbmV3IElmIChuZXcgUGFyZW5zIEBndWFyZCkuaW52ZXJ0KCksIG5ldyBTdGF0ZW1lbnRMaXRlcmFsIFwiY29udGludWVcIlxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYm9keSA9IEJsb2NrLndyYXAgW25ldyBJZiBAZ3VhcmQsIGJvZHldIGlmIEBndWFyZFxuICAgICAgICAgICAgYm9keSA9IFtdLmNvbmNhdCBAbWFrZUNvZGUoXCJcXG5cIiksIChib2R5LmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9UT1ApLCBAbWFrZUNvZGUoXCJcXG4je0B0YWJ9XCIpXG4gICAgICAgIGFuc3dlciA9IFtdLmNvbmNhdCBAbWFrZUNvZGUoc2V0ICsgQHRhYiArIFwid2hpbGUgKFwiKSwgQGNvbmRpdGlvbi5jb21waWxlVG9GcmFnbWVudHMobywgTEVWRUxfUEFSRU4pLFxuICAgICAgICAgICAgQG1ha2VDb2RlKFwiKSB7XCIpLCBib2R5LCBAbWFrZUNvZGUoXCJ9XCIpXG4gICAgICAgIGlmIEByZXR1cm5zXG4gICAgICAgICAgICBhbnN3ZXIucHVzaCBAbWFrZUNvZGUgXCJcXG4je0B0YWJ9cmV0dXJuICN7cnZhcn07XCJcbiAgICAgICAgYW5zd2VyXG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgIFxuIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgXG5cbiMgU2ltcGxlIEFyaXRobWV0aWMgYW5kIGxvZ2ljYWwgb3BlcmF0aW9ucy4gUGVyZm9ybXMgc29tZSBjb252ZXJzaW9uIGZyb20gaW50byB0aGVpciBKYXZhU2NyaXB0IGVxdWl2YWxlbnRzLlxuXG5leHBvcnRzLk9wID0gY2xhc3MgT3AgZXh0ZW5kcyBCYXNlXG4gICAgQDogKG9wLCBmaXJzdCwgc2Vjb25kLCBmbGlwICkgLT5cbiAgICAgICAgcmV0dXJuIG5ldyBJbiBmaXJzdCwgc2Vjb25kIGlmIG9wIGlzICdpbidcbiAgICAgICAgaWYgb3AgaXMgJ2RvJ1xuICAgICAgICAgICAgcmV0dXJuIEBnZW5lcmF0ZURvIGZpcnN0XG4gICAgICAgIGlmIG9wIGlzICduZXcnXG4gICAgICAgICAgICByZXR1cm4gZmlyc3QubmV3SW5zdGFuY2UoKSBpZiBmaXJzdCBpbnN0YW5jZW9mIENhbGwgYW5kIG5vdCBmaXJzdC5kbyBhbmQgbm90IGZpcnN0LmlzTmV3XG4gICAgICAgICAgICBmaXJzdCA9IG5ldyBQYXJlbnMgZmlyc3QgICAgIGlmIGZpcnN0IGluc3RhbmNlb2YgQ29kZSBhbmQgZmlyc3QuYm91bmQgb3IgZmlyc3QuZG9cbiAgICAgICAgQG9wZXJhdG9yID0gQ09OVkVSU0lPTlNbb3BdIG9yIG9wXG4gICAgICAgIEBmaXJzdCAgICA9IGZpcnN0XG4gICAgICAgIEBzZWNvbmQgICA9IHNlY29uZFxuICAgICAgICBAZmxpcCAgICAgPSAhIWZsaXBcbiAgICAgICAgcmV0dXJuIHRoaXNcblxuICAgIENPTlZFUlNJT05TID0gIyBUaGUgbWFwIG9mIGNvbnZlcnNpb25zIHRvIEphdmFTY3JpcHQgc3ltYm9scy5cbiAgICAgICAgJz09JzogICAgICAgICc9PT0nXG4gICAgICAgICchPSc6ICAgICAgICAnIT09J1xuICAgICAgICAnb2YnOiAgICAgICAgJ2luJ1xuICAgICAgICAneWllbGRmcm9tJzogJ3lpZWxkKidcblxuICAgIElOVkVSU0lPTlMgPSAjIFRoZSBtYXAgb2YgaW52ZXJ0aWJsZSBvcGVyYXRvcnMuXG4gICAgICAgICchPT0nOiAnPT09J1xuICAgICAgICAnPT09JzogJyE9PSdcblxuICAgIGNoaWxkcmVuOiBbJ2ZpcnN0JywgJ3NlY29uZCddXG5cbiAgICBpc051bWJlcjogLT5cbiAgICAgICAgQGlzVW5hcnkoKSBhbmQgQG9wZXJhdG9yIGluIFsnKycsICctJ10gYW5kXG4gICAgICAgICAgICBAZmlyc3QgaW5zdGFuY2VvZiBWYWx1ZSBhbmQgQGZpcnN0LmlzTnVtYmVyKClcblxuICAgIGlzWWllbGQ6IC0+XG4gICAgICAgIEBvcGVyYXRvciBpbiBbJ3lpZWxkJywgJ3lpZWxkKiddXG5cbiAgICBpc1VuYXJ5OiAtPlxuICAgICAgICBub3QgQHNlY29uZFxuXG4gICAgaXNDb21wbGV4OiAtPlxuICAgICAgICBub3QgQGlzTnVtYmVyKClcblxuICAgICMgQW0gSSBjYXBhYmxlIG9mIFtQeXRob24tc3R5bGUgY29tcGFyaXNvbiBjaGFpbmluZ10oaHR0cHM6Ly9kb2NzLnB5dGhvbi5vcmcvMy9yZWZlcmVuY2UvZXhwcmVzc2lvbnMuaHRtbCNub3QtaW4pP1xuICAgIFxuICAgIGlzQ2hhaW5hYmxlOiAtPlxuICAgICAgICBAb3BlcmF0b3IgaW4gWyc8JywgJz4nLCAnPj0nLCAnPD0nLCAnPT09JywgJyE9PSddXG5cbiAgICBpbnZlcnQ6IC0+XG4gICAgICAgIGlmIEBpc0NoYWluYWJsZSgpIGFuZCBAZmlyc3QuaXNDaGFpbmFibGUoKVxuICAgICAgICAgICAgYWxsSW52ZXJ0YWJsZSA9IHllc1xuICAgICAgICAgICAgY3VyciA9IHRoaXNcbiAgICAgICAgICAgIHdoaWxlIGN1cnIgYW5kIGN1cnIub3BlcmF0b3JcbiAgICAgICAgICAgICAgICBhbGxJbnZlcnRhYmxlIGFuZD0gKGN1cnIub3BlcmF0b3Igb2YgSU5WRVJTSU9OUylcbiAgICAgICAgICAgICAgICBjdXJyID0gY3Vyci5maXJzdFxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQYXJlbnModGhpcykuaW52ZXJ0KCkgdW5sZXNzIGFsbEludmVydGFibGVcbiAgICAgICAgICAgIGN1cnIgPSB0aGlzXG4gICAgICAgICAgICB3aGlsZSBjdXJyIGFuZCBjdXJyLm9wZXJhdG9yXG4gICAgICAgICAgICAgICAgY3Vyci5pbnZlcnQgPSAhY3Vyci5pbnZlcnRcbiAgICAgICAgICAgICAgICBjdXJyLm9wZXJhdG9yID0gSU5WRVJTSU9OU1tjdXJyLm9wZXJhdG9yXVxuICAgICAgICAgICAgICAgIGN1cnIgPSBjdXJyLmZpcnN0XG4gICAgICAgICAgICB0aGlzXG4gICAgICAgIGVsc2UgaWYgb3AgPSBJTlZFUlNJT05TW0BvcGVyYXRvcl1cbiAgICAgICAgICAgIEBvcGVyYXRvciA9IG9wXG4gICAgICAgICAgICBpZiBAZmlyc3QudW53cmFwKCkgaW5zdGFuY2VvZiBPcFxuICAgICAgICAgICAgICAgIEBmaXJzdC5pbnZlcnQoKVxuICAgICAgICAgICAgdGhpc1xuICAgICAgICBlbHNlIGlmIEBzZWNvbmRcbiAgICAgICAgICAgIG5ldyBQYXJlbnModGhpcykuaW52ZXJ0KClcbiAgICAgICAgZWxzZSBpZiBAb3BlcmF0b3IgaXMgJyEnIGFuZCAoZnN0ID0gQGZpcnN0LnVud3JhcCgpKSBpbnN0YW5jZW9mIE9wIGFuZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmc3Qub3BlcmF0b3IgaW4gWychJywgJ2luJywgJ2luc3RhbmNlb2YnXVxuICAgICAgICAgICAgZnN0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIG5ldyBPcCAnIScsIHRoaXNcblxuICAgIHVuZm9sZFNvYWs6IChvKSAtPlxuICAgICAgICBAb3BlcmF0b3IgaW4gWycrKycsICctLScsICdkZWxldGUnXSBhbmQgdW5mb2xkU29hayBvLCB0aGlzLCAnZmlyc3QnXG5cbiAgICBnZW5lcmF0ZURvOiAoZXhwKSAtPlxuICAgICAgICBwYXNzZWRQYXJhbXMgPSBbXVxuICAgICAgICBmdW5jID0gaWYgZXhwIGluc3RhbmNlb2YgQXNzaWduIGFuZCAocmVmID0gZXhwLnZhbHVlLnVud3JhcCgpKSBpbnN0YW5jZW9mIENvZGVcbiAgICAgICAgICAgIHJlZlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBleHBcbiAgICAgICAgZm9yIHBhcmFtIGluIGZ1bmMucGFyYW1zIG9yIFtdXG4gICAgICAgICAgICBpZiBwYXJhbS52YWx1ZVxuICAgICAgICAgICAgICAgIHBhc3NlZFBhcmFtcy5wdXNoIHBhcmFtLnZhbHVlXG4gICAgICAgICAgICAgICAgZGVsZXRlIHBhcmFtLnZhbHVlXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcGFzc2VkUGFyYW1zLnB1c2ggcGFyYW1cbiAgICAgICAgY2FsbCA9IG5ldyBDYWxsIGV4cCwgcGFzc2VkUGFyYW1zXG4gICAgICAgIGNhbGwuZG8gPSB5ZXNcbiAgICAgICAgY2FsbFxuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBpc0NoYWluID0gQGlzQ2hhaW5hYmxlKCkgYW5kIEBmaXJzdC5pc0NoYWluYWJsZSgpXG4gICAgICAgICMgSW4gY2hhaW5zLCB0aGVyZSdzIG5vIG5lZWQgdG8gd3JhcCBiYXJlIG9iaiBsaXRlcmFscyBpbiBwYXJlbnMsXG4gICAgICAgICMgYXMgdGhlIGNoYWluZWQgZXhwcmVzc2lvbiBpcyB3cmFwcGVkLlxuICAgICAgICBAZmlyc3QuZnJvbnQgPSBAZnJvbnQgdW5sZXNzIGlzQ2hhaW5cbiAgICAgICAgaWYgQG9wZXJhdG9yIGlzICdkZWxldGUnIGFuZCBvLnNjb3BlLmNoZWNrKEBmaXJzdC51bndyYXBBbGwoKS52YWx1ZSlcbiAgICAgICAgICAgIEBlcnJvciAnZGVsZXRlIG9wZXJhbmQgbWF5IG5vdCBiZSBhcmd1bWVudCBvciB2YXInXG4gICAgICAgIGlmIEBvcGVyYXRvciBpbiBbJy0tJywgJysrJ11cbiAgICAgICAgICAgIG1lc3NhZ2UgPSBpc1VuYXNzaWduYWJsZSBAZmlyc3QudW53cmFwQWxsKCkudmFsdWVcbiAgICAgICAgICAgIEBmaXJzdC5lcnJvciBtZXNzYWdlIGlmIG1lc3NhZ2VcbiAgICAgICAgcmV0dXJuIEBjb21waWxlWWllbGQgbyBpZiBAaXNZaWVsZCgpXG4gICAgICAgIHJldHVybiBAY29tcGlsZVVuYXJ5IG8gaWYgQGlzVW5hcnkoKVxuICAgICAgICByZXR1cm4gQGNvbXBpbGVDaGFpbiBvIGlmIGlzQ2hhaW5cbiAgICAgICAgc3dpdGNoIEBvcGVyYXRvclxuICAgICAgICAgICAgd2hlbiAnPycgICAgdGhlbiBAY29tcGlsZUV4aXN0ZW5jZSBvXG4gICAgICAgICAgICB3aGVuICcqKicgdGhlbiBAY29tcGlsZVBvd2VyIG9cbiAgICAgICAgICAgIHdoZW4gJy8vJyB0aGVuIEBjb21waWxlRmxvb3JEaXZpc2lvbiBvXG4gICAgICAgICAgICB3aGVuICclJScgdGhlbiBAY29tcGlsZU1vZHVsbyBvXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgbGhzID0gQGZpcnN0LmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9PUFxuICAgICAgICAgICAgICAgIHJocyA9IEBzZWNvbmQuY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX09QXG4gICAgICAgICAgICAgICAgYW5zd2VyID0gW10uY29uY2F0IGxocywgQG1ha2VDb2RlKFwiICN7QG9wZXJhdG9yfSBcIiksIHJoc1xuICAgICAgICAgICAgICAgIGlmIG8ubGV2ZWwgPD0gTEVWRUxfT1AgdGhlbiBhbnN3ZXIgZWxzZSBAd3JhcEluQnJhY2VzIGFuc3dlclxuXG4gICAgIyBNaW1pYyBQeXRob24ncyBjaGFpbmVkIGNvbXBhcmlzb25zIHdoZW4gbXVsdGlwbGUgY29tcGFyaXNvbiBvcGVyYXRvcnMgYXJlXG4gICAgIyB1c2VkIHNlcXVlbnRpYWxseS4gRm9yIGV4YW1wbGU6XG4gICAgI1xuICAgICMgICAgICAgICAgIGJpbi9rb2ZmZWUgLWUgJ2NvbnNvbGUubG9nIDUwIDwgNjUgPiAxMCdcbiAgICAjICAgICAgICAgICB0cnVlXG4gICAgXG4gICAgY29tcGlsZUNoYWluOiAobykgLT5cbiAgICAgICAgW0BmaXJzdC5zZWNvbmQsIHNoYXJlZF0gPSBAZmlyc3Quc2Vjb25kLmNhY2hlIG9cbiAgICAgICAgZnN0ID0gQGZpcnN0LmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9PUFxuICAgICAgICBmcmFnbWVudHMgPSBmc3QuY29uY2F0IEBtYWtlQ29kZShcIiAje2lmIEBpbnZlcnQgdGhlbiAnJiYnIGVsc2UgJ3x8J30gXCIpLFxuICAgICAgICAgICAgKHNoYXJlZC5jb21waWxlVG9GcmFnbWVudHMgbyksIEBtYWtlQ29kZShcIiAje0BvcGVyYXRvcn0gXCIpLCAoQHNlY29uZC5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfT1ApXG4gICAgICAgIEB3cmFwSW5CcmFjZXMgZnJhZ21lbnRzXG5cbiAgICAjIEtlZXAgcmVmZXJlbmNlIHRvIHRoZSBsZWZ0IGV4cHJlc3Npb24sIHVubGVzcyB0aGlzIGFuIGV4aXN0ZW50aWFsIGFzc2lnbm1lbnRcbiAgICBjb21waWxlRXhpc3RlbmNlOiAobykgLT5cbiAgICAgICAgaWYgQGZpcnN0LmlzQ29tcGxleCgpXG4gICAgICAgICAgICByZWYgPSBuZXcgSWRlbnRpZmllckxpdGVyYWwgby5zY29wZS5mcmVlVmFyaWFibGUgJ3JlZidcbiAgICAgICAgICAgIGZzdCA9IG5ldyBQYXJlbnMgbmV3IEFzc2lnbiByZWYsIEBmaXJzdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBmc3QgPSBAZmlyc3RcbiAgICAgICAgICAgIHJlZiA9IGZzdFxuICAgICAgICBuZXcgSWYobmV3IEV4aXN0ZW5jZShmc3QpLCByZWYsIHR5cGU6ICdpZicpLmFkZEVsc2UoQHNlY29uZCkuY29tcGlsZVRvRnJhZ21lbnRzIG9cblxuICAgICMgQ29tcGlsZSBhIHVuYXJ5ICoqT3AqKi5cbiAgICBjb21waWxlVW5hcnk6IChvKSAtPlxuICAgICAgICBwYXJ0cyA9IFtdXG4gICAgICAgIG9wID0gQG9wZXJhdG9yXG4gICAgICAgIHBhcnRzLnB1c2ggW0BtYWtlQ29kZSBvcF1cbiAgICAgICAgaWYgb3AgaXMgJyEnIGFuZCBAZmlyc3QgaW5zdGFuY2VvZiBFeGlzdGVuY2VcbiAgICAgICAgICAgIEBmaXJzdC5uZWdhdGVkID0gbm90IEBmaXJzdC5uZWdhdGVkXG4gICAgICAgICAgICByZXR1cm4gQGZpcnN0LmNvbXBpbGVUb0ZyYWdtZW50cyBvXG4gICAgICAgIGlmIG8ubGV2ZWwgPj0gTEVWRUxfQUNDRVNTXG4gICAgICAgICAgICByZXR1cm4gKG5ldyBQYXJlbnMgdGhpcykuY29tcGlsZVRvRnJhZ21lbnRzIG9cbiAgICAgICAgcGx1c01pbnVzID0gb3AgaW4gWycrJywgJy0nXVxuICAgICAgICBwYXJ0cy5wdXNoIFtAbWFrZUNvZGUoJyAnKV0gaWYgb3AgaW4gWyduZXcnLCAndHlwZW9mJywgJ2RlbGV0ZSddIG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsdXNNaW51cyBhbmQgQGZpcnN0IGluc3RhbmNlb2YgT3AgYW5kIEBmaXJzdC5vcGVyYXRvciBpcyBvcFxuICAgICAgICBpZiAocGx1c01pbnVzIGFuZCBAZmlyc3QgaW5zdGFuY2VvZiBPcCkgb3IgKG9wIGlzICduZXcnIGFuZCBAZmlyc3QuaXNTdGF0ZW1lbnQgbylcbiAgICAgICAgICAgIEBmaXJzdCA9IG5ldyBQYXJlbnMgQGZpcnN0XG4gICAgICAgIHBhcnRzLnB1c2ggQGZpcnN0LmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9PUFxuICAgICAgICBwYXJ0cy5yZXZlcnNlKCkgaWYgQGZsaXBcbiAgICAgICAgQGpvaW5GcmFnbWVudEFycmF5cyBwYXJ0cywgJydcblxuICAgIGNvbXBpbGVZaWVsZDogKG8pIC0+XG4gICAgICAgIHBhcnRzID0gW11cbiAgICAgICAgb3AgPSBAb3BlcmF0b3JcbiAgICAgICAgdW5sZXNzIG8uc2NvcGUucGFyZW50P1xuICAgICAgICAgICAgQGVycm9yICd5aWVsZCBjYW4gb25seSBvY2N1ciBpbnNpZGUgZnVuY3Rpb25zJ1xuICAgICAgICBpZiAnZXhwcmVzc2lvbicgaW4gT2JqZWN0LmtleXMoQGZpcnN0KSBhbmQgbm90IChAZmlyc3QgaW5zdGFuY2VvZiBUaHJvdylcbiAgICAgICAgICAgIHBhcnRzLnB1c2ggQGZpcnN0LmV4cHJlc3Npb24uY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX09QIGlmIEBmaXJzdC5leHByZXNzaW9uP1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwYXJ0cy5wdXNoIFtAbWFrZUNvZGUgXCIoXCJdIGlmIG8ubGV2ZWwgPj0gTEVWRUxfUEFSRU5cbiAgICAgICAgICAgIHBhcnRzLnB1c2ggW0BtYWtlQ29kZSBvcF1cbiAgICAgICAgICAgIHBhcnRzLnB1c2ggW0BtYWtlQ29kZSBcIiBcIl0gaWYgQGZpcnN0LmJhc2U/LnZhbHVlICE9ICcnXG4gICAgICAgICAgICBwYXJ0cy5wdXNoIEBmaXJzdC5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfT1BcbiAgICAgICAgICAgIHBhcnRzLnB1c2ggW0BtYWtlQ29kZSBcIilcIl0gaWYgby5sZXZlbCA+PSBMRVZFTF9QQVJFTlxuICAgICAgICBAam9pbkZyYWdtZW50QXJyYXlzIHBhcnRzLCAnJ1xuXG4gICAgY29tcGlsZVBvd2VyOiAobykgLT5cbiAgICAgICAgIyBNYWtlIGEgTWF0aC5wb3cgY2FsbFxuICAgICAgICBwb3cgPSBuZXcgVmFsdWUgbmV3IElkZW50aWZpZXJMaXRlcmFsKCdNYXRoJyksIFtuZXcgQWNjZXNzIG5ldyBQcm9wZXJ0eU5hbWUgJ3BvdyddXG4gICAgICAgIG5ldyBDYWxsKHBvdywgW0BmaXJzdCwgQHNlY29uZF0pLmNvbXBpbGVUb0ZyYWdtZW50cyBvXG5cbiAgICBjb21waWxlRmxvb3JEaXZpc2lvbjogKG8pIC0+XG4gICAgICAgIGZsb29yID0gbmV3IFZhbHVlIG5ldyBJZGVudGlmaWVyTGl0ZXJhbCgnTWF0aCcpLCBbbmV3IEFjY2VzcyBuZXcgUHJvcGVydHlOYW1lICdmbG9vciddXG4gICAgICAgIHNlY29uZCA9IGlmIEBzZWNvbmQuaXNDb21wbGV4KCkgdGhlbiBuZXcgUGFyZW5zIEBzZWNvbmQgZWxzZSBAc2Vjb25kXG4gICAgICAgIGRpdiA9IG5ldyBPcCAnLycsIEBmaXJzdCwgc2Vjb25kXG4gICAgICAgIG5ldyBDYWxsKGZsb29yLCBbZGl2XSkuY29tcGlsZVRvRnJhZ21lbnRzIG9cblxuICAgIGNvbXBpbGVNb2R1bG86IChvKSAtPlxuICAgICAgICBtb2QgPSBuZXcgVmFsdWUgbmV3IExpdGVyYWwgdXRpbGl0eSAnbW9kdWxvJywgb1xuICAgICAgICBuZXcgQ2FsbChtb2QsIFtAZmlyc3QsIEBzZWNvbmRdKS5jb21waWxlVG9GcmFnbWVudHMgb1xuXG4gICAgdG9TdHJpbmc6IChpZHQpIC0+XG4gICAgICAgIHN1cGVyIGlkdCwgQGNvbnN0cnVjdG9yLm5hbWUgKyAnICcgKyBAb3BlcmF0b3JcblxuIyAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgMDAwMCAgMDAwICBcbiMgMDAwICAwMDAgMCAwMDAgIFxuIyAwMDAgIDAwMCAgMDAwMCAgXG4jIDAwMCAgMDAwICAgMDAwICBcblxuZXhwb3J0cy5JbiA9IGNsYXNzIEluIGV4dGVuZHMgQmFzZVxuICAgIFxuICAgIEA6IChAb2JqZWN0LCBAYXJyYXkpIC0+XG5cbiAgICBjaGlsZHJlbjogWydvYmplY3QnLCAnYXJyYXknXVxuXG4gICAgaW52ZXJ0OiBORUdBVEVcblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgaWYgQGFycmF5IGluc3RhbmNlb2YgVmFsdWUgYW5kIEBhcnJheS5pc0FycmF5KCkgYW5kIEBhcnJheS5iYXNlLm9iamVjdHMubGVuZ3RoXG4gICAgICAgICAgICBmb3Igb2JqIGluIEBhcnJheS5iYXNlLm9iamVjdHMgd2hlbiBvYmogaW5zdGFuY2VvZiBTcGxhdFxuICAgICAgICAgICAgICAgIGhhc1NwbGF0ID0geWVzXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICMgYGNvbXBpbGVPclRlc3RgIG9ubHkgaWYgd2UgaGF2ZSBhbiBhcnJheSBsaXRlcmFsIHdpdGggbm8gc3BsYXRzXG4gICAgICAgICAgICByZXR1cm4gQGNvbXBpbGVPclRlc3QgbyB1bmxlc3MgaGFzU3BsYXRcbiAgICAgICAgQGNvbXBpbGVMb29wVGVzdCBvXG5cbiAgICBjb21waWxlT3JUZXN0OiAobykgLT5cbiAgICAgICAgW3N1YiwgcmVmXSA9IEBvYmplY3QuY2FjaGUgbywgTEVWRUxfT1BcbiAgICAgICAgW2NtcCwgY25qXSA9IGlmIEBuZWdhdGVkIHRoZW4gWycgIT09ICcsICcgJiYgJ10gZWxzZSBbJyA9PT0gJywgJyB8fCAnXVxuICAgICAgICB0ZXN0cyA9IFtdXG4gICAgICAgIGZvciBpdGVtLCBpIGluIEBhcnJheS5iYXNlLm9iamVjdHNcbiAgICAgICAgICAgIGlmIGkgdGhlbiB0ZXN0cy5wdXNoIEBtYWtlQ29kZSBjbmpcbiAgICAgICAgICAgIHRlc3RzID0gdGVzdHMuY29uY2F0IChpZiBpIHRoZW4gcmVmIGVsc2Ugc3ViKSwgQG1ha2VDb2RlKGNtcCksIGl0ZW0uY29tcGlsZVRvRnJhZ21lbnRzKG8sIExFVkVMX0FDQ0VTUylcbiAgICAgICAgaWYgby5sZXZlbCA8IExFVkVMX09QIHRoZW4gdGVzdHMgZWxzZSBAd3JhcEluQnJhY2VzIHRlc3RzXG5cbiAgICBjb21waWxlTG9vcFRlc3Q6IChvKSAtPlxuICAgICAgICBbc3ViLCByZWZdID0gQG9iamVjdC5jYWNoZSBvLCBMRVZFTF9MSVNUXG4gICAgICAgIGZyYWdtZW50cyA9IFtdLmNvbmNhdCBAbWFrZUNvZGUodXRpbGl0eSgnaW5kZXhPZicsIG8pICsgXCIuY2FsbChcIiksIEBhcnJheS5jb21waWxlVG9GcmFnbWVudHMobywgTEVWRUxfTElTVCksXG4gICAgICAgICAgICBAbWFrZUNvZGUoXCIsIFwiKSwgcmVmLCBAbWFrZUNvZGUoXCIpIFwiICsgaWYgQG5lZ2F0ZWQgdGhlbiAnPCAwJyBlbHNlICc+PSAwJylcbiAgICAgICAgcmV0dXJuIGZyYWdtZW50cyBpZiBAZnJhZ21lbnRzVG9UZXh0KHN1YikgaXMgQGZyYWdtZW50c1RvVGV4dChyZWYpXG4gICAgICAgIGZyYWdtZW50cyA9IHN1Yi5jb25jYXQgQG1ha2VDb2RlKCcsICcpLCBmcmFnbWVudHNcbiAgICAgICAgaWYgby5sZXZlbCA8IExFVkVMX0xJU1QgdGhlbiBmcmFnbWVudHMgZWxzZSBAd3JhcEluQnJhY2VzIGZyYWdtZW50c1xuXG4gICAgdG9TdHJpbmc6IChpZHQpIC0+XG4gICAgICAgIHN1cGVyIGlkdCwgQGNvbnN0cnVjdG9yLm5hbWUgKyBpZiBAbmVnYXRlZCB0aGVuICchJyBlbHNlICcnXG5cbiMgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAgMDAwIDAwMCAgIFxuIyAgICAwMDAgICAgIDAwMDAwMDAgICAgICAwMDAwMCAgICBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuXG4jIEEgY2xhc3NpYyAqdHJ5L2NhdGNoL2ZpbmFsbHkqIGJsb2NrLlxuXG5leHBvcnRzLlRyeSA9IGNsYXNzIFRyeSBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBAOiAoQGF0dGVtcHQsIEBlcnJvclZhcmlhYmxlLCBAcmVjb3ZlcnksIEBlbnN1cmUpIC0+XG5cbiAgICBjaGlsZHJlbjogWydhdHRlbXB0JywgJ3JlY292ZXJ5JywgJ2Vuc3VyZSddXG5cbiAgICBpc1N0YXRlbWVudDogWUVTXG5cbiAgICBqdW1wczogKG8pIC0+IEBhdHRlbXB0Lmp1bXBzKG8pIG9yIEByZWNvdmVyeT8uanVtcHMobylcblxuICAgIG1ha2VSZXR1cm46IChyZXMpIC0+XG4gICAgICAgIEBhdHRlbXB0ICA9IEBhdHRlbXB0IC5tYWtlUmV0dXJuIHJlcyBpZiBAYXR0ZW1wdFxuICAgICAgICBAcmVjb3ZlcnkgPSBAcmVjb3ZlcnkubWFrZVJldHVybiByZXMgaWYgQHJlY292ZXJ5XG4gICAgICAgIHRoaXNcblxuICAgICMgQ29tcGlsYXRpb24gaXMgbW9yZSBvciBsZXNzIGFzIHlvdSB3b3VsZCBleHBlY3QgLS0gdGhlICpmaW5hbGx5KiBjbGF1c2VcbiAgICAjIGlzIG9wdGlvbmFsLCB0aGUgKmNhdGNoKiBpcyBub3QuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBvLmluZGVudCArPSBUQUJcbiAgICAgICAgdHJ5UGFydCAgID0gQGF0dGVtcHQuY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX1RPUFxuXG4gICAgICAgIGNhdGNoUGFydCA9IGlmIEByZWNvdmVyeVxuICAgICAgICAgICAgZ2VuZXJhdGVkRXJyb3JWYXJpYWJsZU5hbWUgPSBvLnNjb3BlLmZyZWVWYXJpYWJsZSAnZXJyb3InLCByZXNlcnZlOiBub1xuICAgICAgICAgICAgcGxhY2Vob2xkZXIgPSBuZXcgSWRlbnRpZmllckxpdGVyYWwgZ2VuZXJhdGVkRXJyb3JWYXJpYWJsZU5hbWVcbiAgICAgICAgICAgIGlmIEBlcnJvclZhcmlhYmxlXG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IGlzVW5hc3NpZ25hYmxlIEBlcnJvclZhcmlhYmxlLnVud3JhcEFsbCgpLnZhbHVlXG4gICAgICAgICAgICAgICAgQGVycm9yVmFyaWFibGUuZXJyb3IgbWVzc2FnZSBpZiBtZXNzYWdlXG4gICAgICAgICAgICAgICAgQHJlY292ZXJ5LnVuc2hpZnQgbmV3IEFzc2lnbiBAZXJyb3JWYXJpYWJsZSwgcGxhY2Vob2xkZXJcbiAgICAgICAgICAgIFtdLmNvbmNhdCBAbWFrZUNvZGUoXCIgY2F0Y2ggKFwiKSwgcGxhY2Vob2xkZXIuY29tcGlsZVRvRnJhZ21lbnRzKG8pLCBAbWFrZUNvZGUoXCIpIHtcXG5cIiksXG4gICAgICAgICAgICAgICAgQHJlY292ZXJ5LmNvbXBpbGVUb0ZyYWdtZW50cyhvLCBMRVZFTF9UT1ApLCBAbWFrZUNvZGUoXCJcXG4je0B0YWJ9fVwiKVxuICAgICAgICBlbHNlIHVubGVzcyBAZW5zdXJlIG9yIEByZWNvdmVyeVxuICAgICAgICAgICAgZ2VuZXJhdGVkRXJyb3JWYXJpYWJsZU5hbWUgPSBvLnNjb3BlLmZyZWVWYXJpYWJsZSAnZXJyb3InLCByZXNlcnZlOiBub1xuICAgICAgICAgICAgW0BtYWtlQ29kZShcIiBjYXRjaCAoI3tnZW5lcmF0ZWRFcnJvclZhcmlhYmxlTmFtZX0pIHt9XCIpXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBbXVxuXG4gICAgICAgIGVuc3VyZVBhcnQgPSBpZiBAZW5zdXJlIHRoZW4gKFtdLmNvbmNhdCBAbWFrZUNvZGUoXCIgZmluYWxseSB7XFxuXCIpLCBAZW5zdXJlLmNvbXBpbGVUb0ZyYWdtZW50cyhvLCBMRVZFTF9UT1ApLFxuICAgICAgICAgICAgQG1ha2VDb2RlKFwiXFxuI3tAdGFifX1cIikpIGVsc2UgW11cblxuICAgICAgICBbXS5jb25jYXQgQG1ha2VDb2RlKFwiI3tAdGFifXRyeSB7XFxuXCIpLFxuICAgICAgICAgICAgdHJ5UGFydCxcbiAgICAgICAgICAgIEBtYWtlQ29kZShcIlxcbiN7QHRhYn19XCIpLCBjYXRjaFBhcnQsIGVuc3VyZVBhcnRcblxuIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiMgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICBcblxuIyBTaW1wbGUgbm9kZSB0byB0aHJvdyBhbiBleGNlcHRpb24uXG5cbmV4cG9ydHMuVGhyb3cgPSBjbGFzcyBUaHJvdyBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBAOiAoQGV4cHJlc3Npb24pIC0+XG5cbiAgICBjaGlsZHJlbjogWydleHByZXNzaW9uJ11cblxuICAgIGlzU3RhdGVtZW50OiBZRVNcbiAgICBqdW1wczogICAgICAgTk9cblxuICAgICMgQSAqKlRocm93KiogaXMgYWxyZWFkeSBhIHJldHVybiwgb2Ygc29ydHMuLi5cbiAgICBtYWtlUmV0dXJuOiBUSElTXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIFtdLmNvbmNhdCBAbWFrZUNvZGUoQHRhYiArIFwidGhyb3cgXCIpLCBAZXhwcmVzc2lvbi5jb21waWxlVG9GcmFnbWVudHMobyksIEBtYWtlQ29kZShcIjtcIilcblxuIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4jIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcblxuIyBDaGVja3MgYSB2YXJpYWJsZSBmb3IgZXhpc3RlbmNlIC0tIG5vdCAqbnVsbCogYW5kIG5vdCAqdW5kZWZpbmVkKi4gVGhpcyBpc1xuIyBzaW1pbGFyIHRvIGAubmlsP2AgaW4gUnVieSwgYW5kIGF2b2lkcyBoYXZpbmcgdG8gY29uc3VsdCBhIEphdmFTY3JpcHQgdHJ1dGhcbiMgdGFibGUuXG5cbmV4cG9ydHMuRXhpc3RlbmNlID0gY2xhc3MgRXhpc3RlbmNlIGV4dGVuZHMgQmFzZVxuICAgIFxuICAgIEA6IChAZXhwcmVzc2lvbikgLT5cblxuICAgIGNoaWxkcmVuOiBbJ2V4cHJlc3Npb24nXVxuXG4gICAgaW52ZXJ0OiBORUdBVEVcblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgQGV4cHJlc3Npb24uZnJvbnQgPSBAZnJvbnRcbiAgICAgICAgY29kZSA9IEBleHByZXNzaW9uLmNvbXBpbGUgbywgTEVWRUxfT1BcbiAgICAgICAgaWYgQGV4cHJlc3Npb24udW53cmFwKCkgaW5zdGFuY2VvZiBJZGVudGlmaWVyTGl0ZXJhbCBhbmQgbm90IG8uc2NvcGUuY2hlY2sgY29kZVxuICAgICAgICAgICAgW2NtcCwgY25qXSA9IGlmIEBuZWdhdGVkIHRoZW4gWyc9PT0nLCAnfHwnXSBlbHNlIFsnIT09JywgJyYmJ11cbiAgICAgICAgICAgIGNvZGUgPSBcInR5cGVvZiAje2NvZGV9ICN7Y21wfSBcXFwidW5kZWZpbmVkXFxcIiAje2Nuan0gI3tjb2RlfSAje2NtcH0gbnVsbFwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgICMgZG8gbm90IHVzZSBzdHJpY3QgZXF1YWxpdHkgaGVyZTsgaXQgd2lsbCBicmVhayBleGlzdGluZyBjb2RlXG4gICAgICAgICAgICBjb2RlID0gXCIje2NvZGV9ICN7aWYgQG5lZ2F0ZWQgdGhlbiAnPT0nIGVsc2UgJyE9J30gbnVsbFwiXG4gICAgICAgIFtAbWFrZUNvZGUoaWYgby5sZXZlbCA8PSBMRVZFTF9DT05EIHRoZW4gY29kZSBlbHNlIFwiKCN7Y29kZX0pXCIpXVxuXG4jIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgICAgIFxuIyAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAwMDAwICAgXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgICAgMDAwICBcbiMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuXG4jIEFuIGV4dHJhIHNldCBvZiBwYXJlbnRoZXNlcywgc3BlY2lmaWVkIGV4cGxpY2l0bHkgaW4gdGhlIHNvdXJjZS4gQXQgb25lIHRpbWVcbiMgd2UgdHJpZWQgdG8gY2xlYW4gdXAgdGhlIHJlc3VsdHMgYnkgZGV0ZWN0aW5nIGFuZCByZW1vdmluZyByZWR1bmRhbnRcbiMgcGFyZW50aGVzZXMsIGJ1dCBubyBsb25nZXIgLS0geW91IGNhbiBwdXQgaW4gYXMgbWFueSBhcyB5b3UgcGxlYXNlLlxuI1xuIyBQYXJlbnRoZXNlcyBhcmUgYSBnb29kIHdheSB0byBmb3JjZSBhbnkgc3RhdGVtZW50IHRvIGJlY29tZSBhbiBleHByZXNzaW9uLlxuXG5leHBvcnRzLlBhcmVucyA9IGNsYXNzIFBhcmVucyBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBAOiAoQGJvZHkpIC0+XG5cbiAgICBjaGlsZHJlbjogWydib2R5J11cblxuICAgIHVud3JhcDogICAgLT4gQGJvZHlcbiAgICBpc0NvbXBsZXg6IC0+IEBib2R5LmlzQ29tcGxleCgpXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIGV4cHIgPSBAYm9keS51bndyYXAoKVxuICAgICAgICBpZiBleHByIGluc3RhbmNlb2YgVmFsdWUgYW5kIGV4cHIuaXNBdG9taWMoKVxuICAgICAgICAgICAgZXhwci5mcm9udCA9IEBmcm9udFxuICAgICAgICAgICAgcmV0dXJuIGV4cHIuY29tcGlsZVRvRnJhZ21lbnRzIG9cbiAgICAgICAgZnJhZ21lbnRzID0gZXhwci5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfUEFSRU5cbiAgICAgICAgYmFyZSA9IG8ubGV2ZWwgPCBMRVZFTF9PUCBhbmQgKGV4cHIgaW5zdGFuY2VvZiBPcCBvciBleHByIGluc3RhbmNlb2YgQ2FsbCBvclxuICAgICAgICAgICAgKGV4cHIgaW5zdGFuY2VvZiBGb3IgYW5kIGV4cHIucmV0dXJucykpIGFuZCAoby5sZXZlbCA8IExFVkVMX0NPTkQgb3JcbiAgICAgICAgICAgICAgICBmcmFnbWVudHMubGVuZ3RoIDw9IDMpXG4gICAgICAgIGlmIGJhcmUgdGhlbiBmcmFnbWVudHMgZWxzZSBAd3JhcEluQnJhY2VzIGZyYWdtZW50c1xuXG4jIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuIyAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICBcbiMgMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgXG4jIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgIFxuIyAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcblxuIyBTdHJpbmdzIHdpdGggaW50ZXJwb2xhdGlvbnMgYXJlIGluIGZhY3QganVzdCBhIHZhcmlhdGlvbiBvZiBgUGFyZW5zYCB3aXRoIHN0cmluZyBjb25jYXRlbmF0aW9uIGluc2lkZS5cblxuZXhwb3J0cy5TdHJpbmdXaXRoSW50ZXJwb2xhdGlvbnMgPSBjbGFzcyBTdHJpbmdXaXRoSW50ZXJwb2xhdGlvbnMgZXh0ZW5kcyBQYXJlbnNcbiAgICBcbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIFxuICAgICAgICAjIFRoaXMgbWV0aG9kIHByb2R1Y2VzIGFuIGludGVycG9sYXRlZCBzdHJpbmcgdXNpbmcgdGhlIG5ldyBFUzIwMTUgc3ludGF4LFxuICAgICAgICAjIHdoaWNoIGlzIG9wdC1pbiBieSB1c2luZyB0YWdnZWQgdGVtcGxhdGUgbGl0ZXJhbHMuIFxuICAgICAgICAjIElmIHRoaXMgU3RyaW5nV2l0aEludGVycG9sYXRpb25zIGlzbuKAmXQgaW5zaWRlIGEgdGFnZ2VkIHRlbXBsYXRlIGxpdGVyYWwsIGZhbGwgYmFjayB0byB0aGUgS29mZmVlIDEueCBvdXRwdXQuXG4gICAgICAgIFxuICAgICAgICB1bmxlc3Mgby5pblRhZ2dlZFRlbXBsYXRlQ2FsbFxuICAgICAgICAgICAgcmV0dXJuIHN1cGVyXG5cbiAgICAgICAgZXhwciA9IEBib2R5LnVud3JhcCgpICMgQXNzdW1wdGlvbjogZXhwciBpcyBWYWx1ZT5TdHJpbmdMaXRlcmFsIG9yIE9wXG5cbiAgICAgICAgZWxlbWVudHMgPSBbXVxuICAgICAgICBleHByLnRyYXZlcnNlQ2hpbGRyZW4gbm8sIChub2RlKSAtPlxuICAgICAgICAgICAgaWYgbm9kZSBpbnN0YW5jZW9mIFN0cmluZ0xpdGVyYWxcbiAgICAgICAgICAgICAgICBlbGVtZW50cy5wdXNoIG5vZGVcbiAgICAgICAgICAgICAgICByZXR1cm4geWVzXG4gICAgICAgICAgICBlbHNlIGlmIG5vZGUgaW5zdGFuY2VvZiBQYXJlbnNcbiAgICAgICAgICAgICAgICBlbGVtZW50cy5wdXNoIG5vZGVcbiAgICAgICAgICAgICAgICByZXR1cm4gbm9cbiAgICAgICAgICAgIHJldHVybiB5ZXNcblxuICAgICAgICBmcmFnbWVudHMgPSBbXVxuICAgICAgICBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUgJ2AnXG4gICAgICAgIGZvciBlbGVtZW50IGluIGVsZW1lbnRzXG4gICAgICAgICAgICBpZiBlbGVtZW50IGluc3RhbmNlb2YgU3RyaW5nTGl0ZXJhbFxuICAgICAgICAgICAgICAgIHZhbHVlID0gZWxlbWVudC52YWx1ZVsxLi4uLTFdXG4gICAgICAgICAgICAgICAgIyBCYWNrdGlja3MgYW5kIGAke2AgaW5zaWRlIHRlbXBsYXRlIGxpdGVyYWxzIG11c3QgYmUgZXNjYXBlZC5cbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UgLyhcXFxcKikoYHxcXCRcXHspL2csIChtYXRjaCwgYmFja3NsYXNoZXMsIHRvQmVFc2NhcGVkKSAtPlxuICAgICAgICAgICAgICAgICAgICBpZiBiYWNrc2xhc2hlcy5sZW5ndGggJSAyIGlzIDBcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiI3tiYWNrc2xhc2hlc31cXFxcI3t0b0JlRXNjYXBlZH1cIlxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaFxuICAgICAgICAgICAgICAgIGZyYWdtZW50cy5wdXNoIEBtYWtlQ29kZSB2YWx1ZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGZyYWdtZW50cy5wdXNoIEBtYWtlQ29kZSAnJHsnXG4gICAgICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2ggZWxlbWVudC5jb21waWxlVG9GcmFnbWVudHMobywgTEVWRUxfUEFSRU4pLi4uXG4gICAgICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlICd9J1xuICAgICAgICBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUgJ2AnXG5cbiAgICAgICAgZnJhZ21lbnRzXG5cbiMgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiMgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcblxuIyBSZXBsYWNlbWVudCBmb3IgdGhlICpmb3IqIGxvb3AgaXMgb3VyIGFycmF5IGFuZCBvYmplY3RcbiMgY29tcHJlaGVuc2lvbnMsIHRoYXQgY29tcGlsZSBpbnRvICpmb3IqIGxvb3BzIGhlcmUuIFRoZXkgYWxzbyBhY3QgYXMgYW5cbiMgZXhwcmVzc2lvbiwgYWJsZSB0byByZXR1cm4gdGhlIHJlc3VsdCBvZiBlYWNoIGZpbHRlcmVkIGl0ZXJhdGlvbi5cbiNcbiMgVW5saWtlIFB5dGhvbiBhcnJheSBjb21wcmVoZW5zaW9ucywgdGhleSBjYW4gYmUgbXVsdGktbGluZSwgYW5kIHlvdSBjYW4gcGFzc1xuIyB0aGUgY3VycmVudCBpbmRleCBvZiB0aGUgbG9vcCBhcyBhIHNlY29uZCBwYXJhbWV0ZXIuIFVubGlrZSBSdWJ5IGJsb2NrcyxcbiMgeW91IGNhbiBtYXAgYW5kIGZpbHRlciBpbiBhIHNpbmdsZSBwYXNzLlxuXG5leHBvcnRzLkZvciA9IGNsYXNzIEZvciBleHRlbmRzIFdoaWxlXG4gICAgQDogKGJvZHksIHNvdXJjZSkgLT5cbiAgICAgICAge0Bzb3VyY2UsIEBndWFyZCwgQHN0ZXAsIEBuYW1lLCBAaW5kZXh9ID0gc291cmNlXG4gICAgICAgIEBib2R5ICAgPSBCbG9jay53cmFwIFtib2R5XVxuICAgICAgICBAb3duICAgID0gISFzb3VyY2Uub3duXG4gICAgICAgIEBvYmplY3QgPSAhIXNvdXJjZS5vYmplY3RcbiAgICAgICAgQGZyb20gICA9ICEhc291cmNlLmZyb21cbiAgICAgICAgQGluZGV4LmVycm9yICdjYW5ub3QgdXNlIGluZGV4IHdpdGggZm9yLWZyb20nIGlmIEBmcm9tIGFuZCBAaW5kZXhcbiAgICAgICAgc291cmNlLm93blRhZy5lcnJvciBcImNhbm5vdCB1c2Ugb3duIHdpdGggZm9yLSN7aWYgQGZyb20gdGhlbiAnZnJvbScgZWxzZSAnaW4nfVwiIGlmIEBvd24gYW5kIG5vdCBAb2JqZWN0XG4gICAgICAgIFtAbmFtZSwgQGluZGV4XSA9IFtAaW5kZXgsIEBuYW1lXSBpZiBAb2JqZWN0XG4gICAgICAgIEBpbmRleC5lcnJvciAnaW5kZXggY2Fubm90IGJlIGEgcGF0dGVybiBtYXRjaGluZyBleHByZXNzaW9uJyBpZiBAaW5kZXggaW5zdGFuY2VvZiBWYWx1ZSBhbmQgbm90IEBpbmRleC5pc0Fzc2lnbmFibGUoKVxuICAgICAgICBAcmFuZ2UgICA9IEBzb3VyY2UgaW5zdGFuY2VvZiBWYWx1ZSBhbmQgQHNvdXJjZS5iYXNlIGluc3RhbmNlb2YgUmFuZ2UgYW5kIG5vdCBAc291cmNlLnByb3BlcnRpZXMubGVuZ3RoIGFuZCBub3QgQGZyb21cbiAgICAgICAgQHBhdHRlcm4gPSBAbmFtZSBpbnN0YW5jZW9mIFZhbHVlXG4gICAgICAgIEBpbmRleC5lcnJvciAnaW5kZXhlcyBkbyBub3QgYXBwbHkgdG8gcmFuZ2UgbG9vcHMnIGlmIEByYW5nZSBhbmQgQGluZGV4XG4gICAgICAgIEBuYW1lLmVycm9yICdjYW5ub3QgcGF0dGVybiBtYXRjaCBvdmVyIHJhbmdlIGxvb3BzJyBpZiBAcmFuZ2UgYW5kIEBwYXR0ZXJuXG4gICAgICAgIEByZXR1cm5zID0gZmFsc2VcblxuICAgIGNoaWxkcmVuOiBbJ2JvZHknLCAnc291cmNlJywgJ2d1YXJkJywgJ3N0ZXAnXVxuXG4gICAgIyBXZWxjb21lIHRvIHRoZSBoYWlyaWVzdCBtZXRob2QgaW4gYWxsIG9mIEtvZmZlZS4gSGFuZGxlcyB0aGUgaW5uZXJcbiAgICAjIGxvb3AsIGZpbHRlcmluZywgc3RlcHBpbmcsIGFuZCByZXN1bHQgc2F2aW5nIGZvciBhcnJheSwgb2JqZWN0LCBhbmQgcmFuZ2VcbiAgICAjIGNvbXByZWhlbnNpb25zLiBTb21lIG9mIHRoZSBnZW5lcmF0ZWQgY29kZSBjYW4gYmUgc2hhcmVkIGluIGNvbW1vbiwgYW5kXG4gICAgIyBzb21lIGNhbm5vdC5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIGJvZHkgICAgICAgID0gQmxvY2sud3JhcCBbQGJvZHldXG4gICAgICAgIFsuLi4sIGxhc3RdID0gYm9keS5leHByZXNzaW9uc1xuICAgICAgICBAcmV0dXJucyAgICA9IG5vIGlmIGxhc3Q/Lmp1bXBzKCkgaW5zdGFuY2VvZiBSZXR1cm5cbiAgICAgICAgc291cmNlICAgICAgPSBpZiBAcmFuZ2UgdGhlbiBAc291cmNlLmJhc2UgZWxzZSBAc291cmNlXG4gICAgICAgIHNjb3BlICAgICAgID0gby5zY29wZVxuICAgICAgICBuYW1lICAgICAgICA9IEBuYW1lICBhbmQgKEBuYW1lLmNvbXBpbGUgbywgTEVWRUxfTElTVCkgaWYgbm90IEBwYXR0ZXJuXG4gICAgICAgIGluZGV4ICAgICAgID0gQGluZGV4IGFuZCAoQGluZGV4LmNvbXBpbGUgbywgTEVWRUxfTElTVClcbiAgICAgICAgc2NvcGUuZmluZChuYW1lKSAgaWYgbmFtZSBhbmQgbm90IEBwYXR0ZXJuXG4gICAgICAgIHNjb3BlLmZpbmQoaW5kZXgpIGlmIGluZGV4IGFuZCBAaW5kZXggbm90IGluc3RhbmNlb2YgVmFsdWVcbiAgICAgICAgcnZhciA9IHNjb3BlLmZyZWVWYXJpYWJsZSAncmVzdWx0cycgaWYgQHJldHVybnNcbiAgICAgICAgaWYgQGZyb21cbiAgICAgICAgICAgIGl2YXIgPSBzY29wZS5mcmVlVmFyaWFibGUgJ3gnLCBzaW5nbGU6IHRydWUgaWYgQHBhdHRlcm5cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaXZhciA9IChAb2JqZWN0IGFuZCBpbmRleCkgb3Igc2NvcGUuZnJlZVZhcmlhYmxlICdpJywgc2luZ2xlOiB0cnVlXG4gICAgICAgIGt2YXIgPSAoKEByYW5nZSBvciBAZnJvbSkgYW5kIG5hbWUpIG9yIGluZGV4IG9yIGl2YXJcbiAgICAgICAga3ZhckFzc2lnbiAgPSBpZiBrdmFyICE9IGl2YXIgdGhlbiBcIiN7a3Zhcn0gPSBcIiBlbHNlIFwiXCJcbiAgICAgICAgaWYgQHN0ZXAgYW5kIG5vdCBAcmFuZ2VcbiAgICAgICAgICAgIFtzdGVwLCBzdGVwVmFyXSA9IEBjYWNoZVRvQ29kZUZyYWdtZW50cyBAc3RlcC5jYWNoZSBvLCBMRVZFTF9MSVNULCBpc0NvbXBsZXhPckFzc2lnbmFibGVcbiAgICAgICAgICAgIHN0ZXBOdW0gPSBOdW1iZXIgc3RlcFZhciBpZiBAc3RlcC5pc051bWJlcigpXG4gICAgICAgIG5hbWUgICAgICA9IGl2YXIgaWYgQHBhdHRlcm5cbiAgICAgICAgdmFyUGFydCAgID0gJydcbiAgICAgICAgZ3VhcmRQYXJ0ID0gJydcbiAgICAgICAgZGVmUGFydCAgID0gJydcbiAgICAgICAgaWR0MSAgICAgID0gQHRhYiArIFRBQlxuICAgICAgICBpZiBAcmFuZ2VcbiAgICAgICAgICAgIGZvclBhcnRGcmFnbWVudHMgPSBzb3VyY2UuY29tcGlsZVRvRnJhZ21lbnRzIG1lcmdlIG8sXG4gICAgICAgICAgICAgICAge2luZGV4OiBpdmFyLCBuYW1lLCBAc3RlcCwgaXNDb21wbGV4OiBpc0NvbXBsZXhPckFzc2lnbmFibGV9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHN2YXIgPSBAc291cmNlLmNvbXBpbGUgbywgTEVWRUxfTElTVFxuICAgICAgICAgICAgaWYgKG5hbWUgb3IgQG93bikgYW5kIEBzb3VyY2UudW53cmFwKCkgbm90IGluc3RhbmNlb2YgSWRlbnRpZmllckxpdGVyYWxcbiAgICAgICAgICAgICAgICBkZWZQYXJ0ICs9IFwiI3tAdGFifSN7cmVmID0gc2NvcGUuZnJlZVZhcmlhYmxlICdyZWYnfSA9ICN7c3Zhcn07XFxuXCJcbiAgICAgICAgICAgICAgICBzdmFyID0gcmVmXG4gICAgICAgICAgICBpZiBuYW1lIGFuZCBub3QgQHBhdHRlcm4gYW5kIG5vdCBAZnJvbVxuICAgICAgICAgICAgICAgIG5hbWVQYXJ0ID0gXCIje25hbWV9ID0gI3tzdmFyfVsje2t2YXJ9XVwiXG4gICAgICAgICAgICBpZiBub3QgQG9iamVjdCBhbmQgbm90IEBmcm9tXG4gICAgICAgICAgICAgICAgZGVmUGFydCArPSBcIiN7QHRhYn0je3N0ZXB9O1xcblwiIGlmIHN0ZXAgIT0gc3RlcFZhclxuICAgICAgICAgICAgICAgIGRvd24gPSBzdGVwTnVtIDwgMFxuICAgICAgICAgICAgICAgIGx2YXIgPSBzY29wZS5mcmVlVmFyaWFibGUgJ2xlbicgdW5sZXNzIEBzdGVwIGFuZCBzdGVwTnVtPyBhbmQgZG93blxuICAgICAgICAgICAgICAgIGRlY2xhcmUgPSBcIiN7a3ZhckFzc2lnbn0je2l2YXJ9ID0gMCwgI3tsdmFyfSA9ICN7c3Zhcn0ubGVuZ3RoXCJcbiAgICAgICAgICAgICAgICBkZWNsYXJlRG93biA9IFwiI3trdmFyQXNzaWdufSN7aXZhcn0gPSAje3N2YXJ9Lmxlbmd0aCAtIDFcIlxuICAgICAgICAgICAgICAgIGNvbXBhcmUgPSBcIiN7aXZhcn0gPCAje2x2YXJ9XCJcbiAgICAgICAgICAgICAgICBjb21wYXJlRG93biA9IFwiI3tpdmFyfSA+PSAwXCJcbiAgICAgICAgICAgICAgICBpZiBAc3RlcFxuICAgICAgICAgICAgICAgICAgICBpZiBzdGVwTnVtP1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgZG93blxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBhcmUgPSBjb21wYXJlRG93blxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlY2xhcmUgPSBkZWNsYXJlRG93blxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wYXJlID0gXCIje3N0ZXBWYXJ9ID4gMCA/ICN7Y29tcGFyZX0gOiAje2NvbXBhcmVEb3dufVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWNsYXJlID0gXCIoI3tzdGVwVmFyfSA+IDAgPyAoI3tkZWNsYXJlfSkgOiAje2RlY2xhcmVEb3dufSlcIlxuICAgICAgICAgICAgICAgICAgICBpbmNyZW1lbnQgPSBcIiN7aXZhcn0gKz0gI3tzdGVwVmFyfVwiXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBpbmNyZW1lbnQgPSBcIiN7aWYga3ZhciAhPSBpdmFyIHRoZW4gXCIrKyN7aXZhcn1cIiBlbHNlIFwiI3tpdmFyfSsrXCJ9XCJcbiAgICAgICAgICAgICAgICBmb3JQYXJ0RnJhZ21lbnRzID0gW0BtYWtlQ29kZShcIiN7ZGVjbGFyZX07ICN7Y29tcGFyZX07ICN7a3ZhckFzc2lnbn0je2luY3JlbWVudH1cIildXG4gICAgICAgIGlmIEByZXR1cm5zXG4gICAgICAgICAgICByZXN1bHRQYXJ0ICAgPSBcIiN7QHRhYn0je3J2YXJ9ID0gW107XFxuXCJcbiAgICAgICAgICAgIHJldHVyblJlc3VsdCA9IFwiXFxuI3tAdGFifXJldHVybiAje3J2YXJ9O1wiXG4gICAgICAgICAgICBib2R5Lm1ha2VSZXR1cm4gcnZhclxuICAgICAgICBpZiBAZ3VhcmRcbiAgICAgICAgICAgIGlmIGJvZHkuZXhwcmVzc2lvbnMubGVuZ3RoID4gMVxuICAgICAgICAgICAgICAgIGJvZHkuZXhwcmVzc2lvbnMudW5zaGlmdCBuZXcgSWYgKG5ldyBQYXJlbnMgQGd1YXJkKS5pbnZlcnQoKSwgbmV3IFN0YXRlbWVudExpdGVyYWwgXCJjb250aW51ZVwiXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgYm9keSA9IEJsb2NrLndyYXAgW25ldyBJZiBAZ3VhcmQsIGJvZHldIGlmIEBndWFyZFxuICAgICAgICBpZiBAcGF0dGVyblxuICAgICAgICAgICAgYm9keS5leHByZXNzaW9ucy51bnNoaWZ0IG5ldyBBc3NpZ24gQG5hbWUsIGlmIEBmcm9tIHRoZW4gbmV3IElkZW50aWZpZXJMaXRlcmFsIGt2YXIgZWxzZSBuZXcgTGl0ZXJhbCBcIiN7c3Zhcn1bI3trdmFyfV1cIlxuICAgICAgICBkZWZQYXJ0RnJhZ21lbnRzID0gW10uY29uY2F0IEBtYWtlQ29kZShkZWZQYXJ0KSwgQHBsdWNrRGlyZWN0Q2FsbChvLCBib2R5KVxuICAgICAgICB2YXJQYXJ0ID0gXCJcXG4je2lkdDF9I3tuYW1lUGFydH07XCIgaWYgbmFtZVBhcnRcbiAgICAgICAgaWYgQG9iamVjdFxuICAgICAgICAgICAgZm9yUGFydEZyYWdtZW50cyA9IFtAbWFrZUNvZGUoXCIje2t2YXJ9IGluICN7c3Zhcn1cIildXG4gICAgICAgICAgICBndWFyZFBhcnQgPSBcIlxcbiN7aWR0MX1pZiAoISN7dXRpbGl0eSAnaGFzUHJvcCcsIG99LmNhbGwoI3tzdmFyfSwgI3trdmFyfSkpIGNvbnRpbnVlO1wiIGlmIEBvd25cbiAgICAgICAgZWxzZSBpZiBAZnJvbVxuICAgICAgICAgICAgZm9yUGFydEZyYWdtZW50cyA9IFtAbWFrZUNvZGUoXCIje2t2YXJ9IG9mICN7c3Zhcn1cIildXG4gICAgICAgIGJvZHlGcmFnbWVudHMgPSBib2R5LmNvbXBpbGVUb0ZyYWdtZW50cyBtZXJnZShvLCBpbmRlbnQ6IGlkdDEpLCBMRVZFTF9UT1BcbiAgICAgICAgaWYgYm9keUZyYWdtZW50cyBhbmQgYm9keUZyYWdtZW50cy5sZW5ndGggPiAwXG4gICAgICAgICAgICBib2R5RnJhZ21lbnRzID0gW10uY29uY2F0IEBtYWtlQ29kZShcIlxcblwiKSwgYm9keUZyYWdtZW50cywgQG1ha2VDb2RlKFwiXFxuXCIpXG4gICAgICAgIFtdLmNvbmNhdCBkZWZQYXJ0RnJhZ21lbnRzLCBAbWFrZUNvZGUoXCIje3Jlc3VsdFBhcnQgb3IgJyd9I3tAdGFifWZvciAoXCIpLFxuICAgICAgICAgICAgZm9yUGFydEZyYWdtZW50cywgQG1ha2VDb2RlKFwiKSB7I3tndWFyZFBhcnR9I3t2YXJQYXJ0fVwiKSwgYm9keUZyYWdtZW50cyxcbiAgICAgICAgICAgIEBtYWtlQ29kZShcIiN7QHRhYn19I3tyZXR1cm5SZXN1bHQgb3IgJyd9XCIpXG5cbiAgICBwbHVja0RpcmVjdENhbGw6IChvLCBib2R5KSAtPlxuICAgICAgICBkZWZzID0gW11cbiAgICAgICAgZm9yIGV4cHIsIGlkeCBpbiBib2R5LmV4cHJlc3Npb25zXG4gICAgICAgICAgICBleHByID0gZXhwci51bndyYXBBbGwoKVxuICAgICAgICAgICAgY29udGludWUgdW5sZXNzIGV4cHIgaW5zdGFuY2VvZiBDYWxsXG4gICAgICAgICAgICB2YWwgPSBleHByLnZhcmlhYmxlPy51bndyYXBBbGwoKVxuICAgICAgICAgICAgY29udGludWUgdW5sZXNzICh2YWwgaW5zdGFuY2VvZiBDb2RlKSBvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAodmFsIGluc3RhbmNlb2YgVmFsdWUgYW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbC5iYXNlPy51bndyYXBBbGwoKSBpbnN0YW5jZW9mIENvZGUgYW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbC5wcm9wZXJ0aWVzLmxlbmd0aCBpcyAxIGFuZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWwucHJvcGVydGllc1swXS5uYW1lPy52YWx1ZSBpbiBbJ2NhbGwnLCAnYXBwbHknXSlcbiAgICAgICAgICAgIGZuICAgICAgPSB2YWwuYmFzZT8udW53cmFwQWxsKCkgb3IgdmFsXG4gICAgICAgICAgICByZWYgICAgID0gbmV3IElkZW50aWZpZXJMaXRlcmFsIG8uc2NvcGUuZnJlZVZhcmlhYmxlICdmbidcbiAgICAgICAgICAgIGJhc2UgICAgPSBuZXcgVmFsdWUgcmVmXG4gICAgICAgICAgICBpZiB2YWwuYmFzZVxuICAgICAgICAgICAgICAgIFt2YWwuYmFzZSwgYmFzZV0gPSBbYmFzZSwgdmFsXVxuICAgICAgICAgICAgYm9keS5leHByZXNzaW9uc1tpZHhdID0gbmV3IENhbGwgYmFzZSwgZXhwci5hcmdzXG4gICAgICAgICAgICBkZWZzID0gZGVmcy5jb25jYXQgQG1ha2VDb2RlKEB0YWIpLCAobmV3IEFzc2lnbihyZWYsIGZuKS5jb21waWxlVG9GcmFnbWVudHMobywgTEVWRUxfVE9QKSksIEBtYWtlQ29kZSgnO1xcbicpXG4gICAgICAgIGRlZnNcblxuIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAwMDAwMDAgIFxuIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICBcblxuIyBBIEphdmFTY3JpcHQgKnN3aXRjaCogc3RhdGVtZW50LiBDb252ZXJ0cyBpbnRvIGEgcmV0dXJuYWJsZSBleHByZXNzaW9uIG9uLWRlbWFuZC5cblxuZXhwb3J0cy5Td2l0Y2ggPSBjbGFzcyBTd2l0Y2ggZXh0ZW5kcyBCYXNlXG4gICAgQDogKEBzdWJqZWN0LCBAY2FzZXMsIEBvdGhlcndpc2UpIC0+XG5cbiAgICBjaGlsZHJlbjogWydzdWJqZWN0JywgJ2Nhc2VzJywgJ290aGVyd2lzZSddXG5cbiAgICBpc1N0YXRlbWVudDogWUVTXG5cbiAgICBqdW1wczogKG8gPSB7YmxvY2s6IHllc30pIC0+XG4gICAgICAgIGZvciBbY29uZHMsIGJsb2NrXSBpbiBAY2FzZXNcbiAgICAgICAgICAgIHJldHVybiBqdW1wTm9kZSBpZiBqdW1wTm9kZSA9IGJsb2NrLmp1bXBzIG9cbiAgICAgICAgQG90aGVyd2lzZT8uanVtcHMgb1xuXG4gICAgbWFrZVJldHVybjogKHJlcykgLT5cbiAgICAgICAgcGFpclsxXS5tYWtlUmV0dXJuIHJlcyBmb3IgcGFpciBpbiBAY2FzZXNcbiAgICAgICAgQG90aGVyd2lzZSBvcj0gbmV3IEJsb2NrIFtuZXcgTGl0ZXJhbCAndm9pZCAwJ10gaWYgcmVzXG4gICAgICAgIEBvdGhlcndpc2U/Lm1ha2VSZXR1cm4gcmVzXG4gICAgICAgIHRoaXNcblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgaWR0MSA9IG8uaW5kZW50ICsgVEFCXG4gICAgICAgIGlkdDIgPSBvLmluZGVudCA9IGlkdDEgKyBUQUJcbiAgICAgICAgZnJhZ21lbnRzID0gW10uY29uY2F0IEBtYWtlQ29kZShAdGFiICsgXCJzd2l0Y2ggKFwiKSxcbiAgICAgICAgICAgIChpZiBAc3ViamVjdCB0aGVuIEBzdWJqZWN0LmNvbXBpbGVUb0ZyYWdtZW50cyhvLCBMRVZFTF9QQVJFTikgZWxzZSBAbWFrZUNvZGUgXCJmYWxzZVwiKSxcbiAgICAgICAgICAgIEBtYWtlQ29kZShcIikge1xcblwiKVxuICAgICAgICBmb3IgW2NvbmRpdGlvbnMsIGJsb2NrXSwgaSBpbiBAY2FzZXNcbiAgICAgICAgICAgIGZvciBjb25kIGluIGZsYXR0ZW4gW2NvbmRpdGlvbnNdXG4gICAgICAgICAgICAgICAgY29uZCAgICA9IGNvbmQuaW52ZXJ0KCkgdW5sZXNzIEBzdWJqZWN0XG4gICAgICAgICAgICAgICAgZnJhZ21lbnRzID0gZnJhZ21lbnRzLmNvbmNhdCBAbWFrZUNvZGUoaWR0MSArIFwiY2FzZSBcIiksIGNvbmQuY29tcGlsZVRvRnJhZ21lbnRzKG8sIExFVkVMX1BBUkVOKSwgQG1ha2VDb2RlKFwiOlxcblwiKVxuICAgICAgICAgICAgZnJhZ21lbnRzID0gZnJhZ21lbnRzLmNvbmNhdCBib2R5LCBAbWFrZUNvZGUoJ1xcbicpIGlmIChib2R5ID0gYmxvY2suY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX1RPUCkubGVuZ3RoID4gMFxuICAgICAgICAgICAgYnJlYWsgaWYgaSBpcyBAY2FzZXMubGVuZ3RoIC0gMSBhbmQgbm90IEBvdGhlcndpc2VcbiAgICAgICAgICAgIGV4cHIgPSBAbGFzdE5vbkNvbW1lbnQgYmxvY2suZXhwcmVzc2lvbnNcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIGV4cHIgaW5zdGFuY2VvZiBSZXR1cm4gb3IgKGV4cHIgaW5zdGFuY2VvZiBMaXRlcmFsIGFuZCBleHByLmp1bXBzKCkgYW5kIGV4cHIudmFsdWUgIT0gJ2RlYnVnZ2VyJylcbiAgICAgICAgICAgIGZyYWdtZW50cy5wdXNoIGNvbmQubWFrZUNvZGUoaWR0MiArICdicmVhaztcXG4nKVxuICAgICAgICBpZiBAb3RoZXJ3aXNlIGFuZCBAb3RoZXJ3aXNlLmV4cHJlc3Npb25zLmxlbmd0aFxuICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlKGlkdDEgKyBcImRlZmF1bHQ6XFxuXCIpLCAoQG90aGVyd2lzZS5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfVE9QKS4uLiwgQG1ha2VDb2RlKFwiXFxuXCIpXG4gICAgICAgIGZyYWdtZW50cy5wdXNoIEBtYWtlQ29kZSBAdGFiICsgJ30nXG4gICAgICAgIGZyYWdtZW50c1xuXG4jIDAwMCAgMDAwMDAwMDAgIFxuIyAwMDAgIDAwMCAgICAgICBcbiMgMDAwICAwMDAwMDAgICAgXG4jIDAwMCAgMDAwICAgICAgIFxuIyAwMDAgIDAwMCAgICAgICBcblxuIyBJZi9lbHNlIHN0YXRlbWVudHMuIEFjdHMgYXMgYW4gZXhwcmVzc2lvbiBieSBwdXNoaW5nIGRvd24gcmVxdWVzdGVkIHJldHVybnMgdG8gdGhlIGxhc3QgbGluZSBvZiBlYWNoIGNsYXVzZS5cbiNcbiMgU2luZ2xlLWV4cHJlc3Npb24gKipJZnMqKiBhcmUgY29tcGlsZWQgaW50byBjb25kaXRpb25hbCBvcGVyYXRvcnMgaWYgcG9zc2libGUsXG4jIGJlY2F1c2UgdGVybmFyaWVzIGFyZSBhbHJlYWR5IHByb3BlciBleHByZXNzaW9ucywgYW5kIGRvbid0IG5lZWQgY29udmVyc2lvbi5cblxuZXhwb3J0cy5JZiA9IGNsYXNzIElmIGV4dGVuZHMgQmFzZVxuICAgIFxuICAgIEA6IChjb25kaXRpb24sIEBib2R5LCBvcHRpb25zID0ge30pIC0+XG4gICAgICAgIEBjb25kaXRpb24gPSBpZiBvcHRpb25zLnR5cGUgaXMgJ3VubGVzcycgdGhlbiBjb25kaXRpb24uaW52ZXJ0KCkgZWxzZSBjb25kaXRpb25cbiAgICAgICAgQGVsc2VCb2R5ICA9IG51bGxcbiAgICAgICAgQGlzQ2hhaW4gICA9IGZhbHNlXG4gICAgICAgIHtAc29ha30gICAgPSBvcHRpb25zXG5cbiAgICBjaGlsZHJlbjogWydjb25kaXRpb24nLCAnYm9keScsICdlbHNlQm9keSddXG5cbiAgICBib2R5Tm9kZTogICAgIC0+IEBib2R5Py51bndyYXAoKVxuICAgIGVsc2VCb2R5Tm9kZTogLT4gQGVsc2VCb2R5Py51bndyYXAoKVxuXG4gICAgIyBSZXdyaXRlIGEgY2hhaW4gb2YgKipJZnMqKiB0byBhZGQgYSBkZWZhdWx0IGNhc2UgYXMgdGhlIGZpbmFsICplbHNlKi5cbiAgICBcbiAgICBhZGRFbHNlOiAoZWxzZUJvZHkpIC0+XG4gICAgICAgIGlmIEBpc0NoYWluXG4gICAgICAgICAgICBAZWxzZUJvZHlOb2RlKCkuYWRkRWxzZSBlbHNlQm9keVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAaXNDaGFpbiAgPSBlbHNlQm9keSBpbnN0YW5jZW9mIElmXG4gICAgICAgICAgICBAZWxzZUJvZHkgPSBAZW5zdXJlQmxvY2sgZWxzZUJvZHlcbiAgICAgICAgICAgIEBlbHNlQm9keS51cGRhdGVMb2NhdGlvbkRhdGFJZk1pc3NpbmcgZWxzZUJvZHkubG9jYXRpb25EYXRhXG4gICAgICAgIHRoaXNcblxuICAgICMgVGhlICoqSWYqKiBvbmx5IGNvbXBpbGVzIGludG8gYSBzdGF0ZW1lbnQgaWYgZWl0aGVyIG9mIGl0cyBib2RpZXMgbmVlZHNcbiAgICAjIHRvIGJlIGEgc3RhdGVtZW50LiBPdGhlcndpc2UgYSBjb25kaXRpb25hbCBvcGVyYXRvciBpcyBzYWZlLlxuICAgIFxuICAgIGlzU3RhdGVtZW50OiAobykgLT5cbiAgICAgICAgbz8ubGV2ZWwgaXMgTEVWRUxfVE9QIG9yXG4gICAgICAgICAgICBAYm9keU5vZGUoKS5pc1N0YXRlbWVudChvKSBvciBAZWxzZUJvZHlOb2RlKCk/LmlzU3RhdGVtZW50KG8pXG5cbiAgICBqdW1wczogKG8pIC0+IEBib2R5Lmp1bXBzKG8pIG9yIEBlbHNlQm9keT8uanVtcHMobylcblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgaWYgQGlzU3RhdGVtZW50IG8gdGhlbiBAY29tcGlsZVN0YXRlbWVudCBvIGVsc2UgQGNvbXBpbGVFeHByZXNzaW9uIG9cblxuICAgIG1ha2VSZXR1cm46IChyZXMpIC0+XG4gICAgICAgIEBlbHNlQm9keSAgb3I9IG5ldyBCbG9jayBbbmV3IExpdGVyYWwgJ3ZvaWQgMCddIGlmIHJlc1xuICAgICAgICBAYm9keSAgICAgYW5kPSBuZXcgQmxvY2sgW0Bib2R5Lm1ha2VSZXR1cm4gcmVzXVxuICAgICAgICBAZWxzZUJvZHkgYW5kPSBuZXcgQmxvY2sgW0BlbHNlQm9keS5tYWtlUmV0dXJuIHJlc11cbiAgICAgICAgdGhpc1xuXG4gICAgZW5zdXJlQmxvY2s6IChub2RlKSAtPlxuICAgICAgICBpZiBub2RlIGluc3RhbmNlb2YgQmxvY2sgdGhlbiBub2RlIGVsc2UgbmV3IEJsb2NrIFtub2RlXVxuXG4gICAgIyBDb21waWxlIHRoZSBgSWZgIGFzIGEgcmVndWxhciAqaWYtZWxzZSogc3RhdGVtZW50LiBGbGF0dGVuZWQgY2hhaW5zIGZvcmNlIGlubmVyICplbHNlKiBib2RpZXMgaW50byBzdGF0ZW1lbnQgZm9ybS5cbiAgICBjb21waWxlU3RhdGVtZW50OiAobykgLT5cbiAgICAgICAgY2hpbGQgPSBkZWwgbywgJ2NoYWluQ2hpbGQnXG4gICAgICAgIFxuICAgICAgICAjIGNvbW1lbnRpbmcgdGhpcyBvdXQgZG9lc24ndCBicmVhayBhbnkgdGVzdHM6IHdoYXQgd2FzIHRoaXMgc3VwcG9zZWQgdG8gYWNoaWV2ZT8gLi4uXG4gICAgICAgICMgZXhlcSAgPSBkZWwgbywgJ2lzRXhpc3RlbnRpYWxFcXVhbHMnXG4gICAgICAgICMgaWYgZXhlcVxuICAgICAgICAjICAgICByZXR1cm4gbmV3IElmKEBjb25kaXRpb24uaW52ZXJ0KCksIEBlbHNlQm9keU5vZGUoKSwgdHlwZTogJ2lmJykuY29tcGlsZVRvRnJhZ21lbnRzIG9cblxuICAgICAgICBpbmRlbnQgPSBvLmluZGVudCArIFRBQlxuICAgICAgICBjb25kICAgPSBAY29uZGl0aW9uLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9QQVJFTlxuICAgICAgICBib2R5ICAgPSBAZW5zdXJlQmxvY2soQGJvZHkpLmNvbXBpbGVUb0ZyYWdtZW50cyBtZXJnZSBvLCB7aW5kZW50fVxuICAgICAgICBpZlBhcnQgPSBbXS5jb25jYXQgQG1ha2VDb2RlKFwiaWYgKFwiKSwgY29uZCwgQG1ha2VDb2RlKFwiKSB7XFxuXCIpLCBib2R5LCBAbWFrZUNvZGUoXCJcXG4je0B0YWJ9fVwiKVxuICAgICAgICBpZlBhcnQudW5zaGlmdCBAbWFrZUNvZGUgQHRhYiB1bmxlc3MgY2hpbGRcbiAgICAgICAgcmV0dXJuIGlmUGFydCB1bmxlc3MgQGVsc2VCb2R5XG4gICAgICAgIGFuc3dlciA9IGlmUGFydC5jb25jYXQgQG1ha2VDb2RlKCcgZWxzZSAnKVxuICAgICAgICBpZiBAaXNDaGFpblxuICAgICAgICAgICAgby5jaGFpbkNoaWxkID0geWVzXG4gICAgICAgICAgICBhbnN3ZXIgPSBhbnN3ZXIuY29uY2F0IEBlbHNlQm9keS51bndyYXAoKS5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfVE9QXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGFuc3dlciA9IGFuc3dlci5jb25jYXQgQG1ha2VDb2RlKFwie1xcblwiKSwgQGVsc2VCb2R5LmNvbXBpbGVUb0ZyYWdtZW50cyhtZXJnZShvLCB7aW5kZW50fSksIExFVkVMX1RPUCksIEBtYWtlQ29kZShcIlxcbiN7QHRhYn19XCIpXG4gICAgICAgIGFuc3dlclxuXG4gICAgIyBDb21waWxlIHRoZSBgSWZgIGFzIGEgY29uZGl0aW9uYWwgb3BlcmF0b3IuXG4gICAgY29tcGlsZUV4cHJlc3Npb246IChvKSAtPlxuICAgICAgICBjb25kID0gQGNvbmRpdGlvbi5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfQ09ORFxuICAgICAgICBib2R5ID0gQGJvZHlOb2RlKCkuY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX0xJU1RcbiAgICAgICAgYWx0ICA9IGlmIEBlbHNlQm9keU5vZGUoKSB0aGVuIEBlbHNlQm9keU5vZGUoKS5jb21waWxlVG9GcmFnbWVudHMobywgTEVWRUxfTElTVCkgZWxzZSBbQG1ha2VDb2RlKCd2b2lkIDAnKV1cbiAgICAgICAgZnJhZ21lbnRzID0gY29uZC5jb25jYXQgQG1ha2VDb2RlKFwiID8gXCIpLCBib2R5LCBAbWFrZUNvZGUoXCIgOiBcIiksIGFsdFxuICAgICAgICBpZiBvLmxldmVsID49IExFVkVMX0NPTkQgdGhlbiBAd3JhcEluQnJhY2VzIGZyYWdtZW50cyBlbHNlIGZyYWdtZW50c1xuXG4gICAgdW5mb2xkU29hazogLT5cbiAgICAgICAgQHNvYWsgYW5kIHRoaXNcblxuIyAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICBcbiMgMDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIFxuIyAwMDAgMCAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICBcblxuZXhwb3J0cy5NZXRhSWYgPSBjbGFzcyBNZXRhSWYgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgQDogKEBjb25kaXRpb24sIEBib2R5LCBvcHRpb25zID0ge30pIC0+XG4gICAgICAgIFxuICAgICAgICBAZWxzZUJvZHkgPSBudWxsXG4gICAgICAgIEBpc0NoYWluICA9IGZhbHNlXG4gICAgICAgIHsgQHNvYWsgfSA9IG9wdGlvbnNcblxuICAgIGNoaWxkcmVuOiBbJ2NvbmRpdGlvbicsICdib2R5JywgJ2Vsc2VCb2R5J11cblxuICAgICMgUmV3cml0ZSBhIGNoYWluIG9mIElmcyB0byBhZGQgYSBkZWZhdWx0IGNhc2UgYXMgdGhlIGZpbmFsIGVsc2UuXG4gICAgXG4gICAgYWRkRWxzZTogKGVsc2VCb2R5KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQGlzQ2hhaW5cbiAgICAgICAgICAgIEBlbHNlQm9keT8udW53cmFwKCkuYWRkRWxzZSBlbHNlQm9keVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAaXNDaGFpbiAgPSBlbHNlQm9keSBpbnN0YW5jZW9mIE1ldGFJZlxuICAgICAgICAgICAgQGVsc2VCb2R5ID0gQGVuc3VyZUJsb2NrIGVsc2VCb2R5XG4gICAgICAgICAgICBAZWxzZUJvZHkudXBkYXRlTG9jYXRpb25EYXRhSWZNaXNzaW5nIGVsc2VCb2R5LmxvY2F0aW9uRGF0YVxuICAgICAgICB0aGlzXG5cbiAgICBtYWtlUmV0dXJuOiAocmVzKSAtPlxuICAgICAgICBcbiAgICAgICAgQGVsc2VCb2R5ICBvcj0gbmV3IEJsb2NrIFtuZXcgTGl0ZXJhbCAndm9pZCAwJ10gaWYgcmVzXG4gICAgICAgICMgQGJvZHkgICAgIGFuZD0gbmV3IEJsb2NrIFtAYm9keS5tYWtlUmV0dXJuIHJlc11cbiAgICAgICAgQGVsc2VCb2R5IGFuZD0gbmV3IEJsb2NrIFtAZWxzZUJvZHkubWFrZVJldHVybiByZXNdXG4gICAgICAgIHRoaXNcbiAgICBcbiAgICAjIFRoZSBJZiBvbmx5IGNvbXBpbGVzIGludG8gYSBzdGF0ZW1lbnQgaWYgZWl0aGVyIG9mIGl0cyBib2RpZXMgbmVlZHNcbiAgICAjIHRvIGJlIGEgc3RhdGVtZW50LiBPdGhlcndpc2UgYSBjb25kaXRpb25hbCBvcGVyYXRvciBpcyBzYWZlLlxuICAgIFxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgICAgICAgXG4gICAgICAgICMgbG9nICdNZXRhSWYgY29tcGlsZVN0YXRlbWVudCBAY29uZGl0aW9uXFxuJywgc3RyaW5naWZ5IEBjb25kaXRpb25cbiAgICAgICAgXG4gICAgICAgIGNvbXBpbGVNZXRhSWYgbm9kZTpALCBvcHRzOm9cbiAgICAgICAgXG4gICAgZW5zdXJlQmxvY2s6IChub2RlKSAtPiBpZiBub2RlIGluc3RhbmNlb2YgQmxvY2sgdGhlbiBub2RlIGVsc2UgbmV3IEJsb2NrIFtub2RlXVxuICAgIHVuZm9sZFNvYWs6IC0+IEBzb2FrIGFuZCB0aGlzXG4gICAganVtcHM6IChvKSAtPiBAYm9keS5qdW1wcyhvKSBvciBAZWxzZUJvZHk/Lmp1bXBzKG8pXG4gICAgICAgIFxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgICAgICAgMDAwICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG5cblVUSUxJVElFUyA9XG5cbiAgICAjIENvcnJlY3RseSBzZXQgdXAgYSBwcm90b3R5cGUgY2hhaW4gZm9yIGluaGVyaXRhbmNlLCBpbmNsdWRpbmcgYSByZWZlcmVuY2VcbiAgICAjIHRvIHRoZSBzdXBlcmNsYXNzIGZvciBgc3VwZXIoKWAgY2FsbHMsIGFuZCBjb3BpZXMgb2YgYW55IHN0YXRpYyBwcm9wZXJ0aWVzLlxuICAgICAgICBcbiAgICBleHRlbmQ6IChvKSAtPiBcIlxuICAgICAgICBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gcGFyZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKCN7dXRpbGl0eSAnaGFzUHJvcCcsIG99LmNhbGwocGFyZW50LCBrZXkpKSBjaGlsZFtrZXldID0gcGFyZW50W2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmdW5jdGlvbiBjdG9yKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN0b3IucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTtcbiAgICAgICAgICAgIGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7XG4gICAgICAgICAgICBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlO1xuICAgICAgICAgICAgcmV0dXJuIGNoaWxkO1xuICAgICAgICB9XG4gICAgXCJcblxuICAgICMgQ3JlYXRlIGEgZnVuY3Rpb24gYm91bmQgdG8gdGhlIGN1cnJlbnQgdmFsdWUgb2YgXCJ0aGlzXCIuXG4gICAgYmluZDogLT4gJ1xuICAgICAgICBmdW5jdGlvbihmbiwgbWUpe1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KG1lLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICdcblxuICAgICMgRGlzY292ZXIgaWYgYW4gaXRlbSBpcyBpbiBhbiBhcnJheS5cbiAgICBpbmRleE9mOiAtPiBcIltdLmluZGV4T2ZcIlxuICAgICMgaW5kZXhPZjogLT4gXCJcbiAgICAgICAgIyBbXS5pbmRleE9mIHx8IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgICMgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgICMgaWYgKGkgaW4gdGhpcyAmJiB0aGlzW2ldID09PSBpdGVtKSByZXR1cm4gaTtcbiAgICAgICAgICAgICMgfVxuICAgICAgICAgICAgIyByZXR1cm4gLTE7XG4gICAgICAgICMgfVxuICAgICMgXCJcblxuICAgIG1vZHVsbzogLT4gXCJcIlwiXG4gICAgICAgIGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuICgrYSAlIChiID0gK2IpICsgYikgJSBiOyB9XG4gICAgXCJcIlwiXG5cbiAgICAjIFNob3J0Y3V0cyB0byBzcGVlZCB1cCB0aGUgbG9va3VwIHRpbWUgZm9yIG5hdGl2ZSBmdW5jdGlvbnMuXG4gICAgaGFzUHJvcDogLT4gJ3t9Lmhhc093blByb3BlcnR5J1xuICAgIHNsaWNlOiAtPiAnW10uc2xpY2UnICMgZS5nLiBbW2FdLi4uXVxuXG4jIExldmVscyBpbmRpY2F0ZSBhIG5vZGUncyBwb3NpdGlvbiBpbiB0aGUgQVNULiBVc2VmdWwgZm9yIGtub3dpbmcgaWZcbiMgcGFyZW5zIGFyZSBuZWNlc3Nhcnkgb3Igc3VwZXJmbHVvdXMuXG5MRVZFTF9UT1AgICAgPSAxICAgICMgLi4uO1xuTEVWRUxfUEFSRU4gID0gMiAgICAjICguLi4pXG5MRVZFTF9MSVNUICAgPSAzICAgICMgWy4uLl1cbkxFVkVMX0NPTkQgICA9IDQgICAgIyAuLi4gPyB4IDogeVxuTEVWRUxfT1AgICAgID0gNSAgICAjICEuLi5cbkxFVkVMX0FDQ0VTUyA9IDYgICAgIyAuLi5bMF1cblxuVEFCID0gJyAgICAnICMgVGFicyBhcmUgNCBzcGFjZXMgZm9yIHByZXR0eSBwcmludGluZy5cblxuU0lNUExFTlVNID0gL15bKy1dP1xcZCskL1xuXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG5cbiMgSGVscGVyIGZvciBlbnN1cmluZyB0aGF0IHV0aWxpdHkgZnVuY3Rpb25zIGFyZSBhc3NpZ25lZCBhdCB0aGUgdG9wIGxldmVsLlxuICAgIFxudXRpbGl0eSA9IChuYW1lLCBvKSAtPlxuICAgIHtyb290fSA9IG8uc2NvcGVcbiAgICBpZiBuYW1lIG9mIHJvb3QudXRpbGl0aWVzXG4gICAgICAgIHJvb3QudXRpbGl0aWVzW25hbWVdXG4gICAgZWxzZVxuICAgICAgICByZWYgPSByb290LmZyZWVWYXJpYWJsZSBuYW1lXG4gICAgICAgIHJvb3QuYXNzaWduIHJlZiwgVVRJTElUSUVTW25hbWVdIG8gIyA8LSBhZGRzIHV0aWxpdHkgdG8gdG9wIGxldmVsIHNjb3BlXG4gICAgICAgIHJvb3QudXRpbGl0aWVzW25hbWVdID0gcmVmXG5cbm11bHRpZGVudCA9IChjb2RlLCB0YWIpIC0+XG4gICAgY29kZSA9IGNvZGUucmVwbGFjZSAvXFxuL2csICckJicgKyB0YWJcbiAgICBjb2RlLnJlcGxhY2UgL1xccyskLywgJydcblxuaXNMaXRlcmFsQXJndW1lbnRzID0gKG5vZGUpIC0+XG4gICAgbm9kZSBpbnN0YW5jZW9mIElkZW50aWZpZXJMaXRlcmFsIGFuZCBub2RlLnZhbHVlIGlzICdhcmd1bWVudHMnXG5cbmlzTGl0ZXJhbFRoaXMgPSAobm9kZSkgLT5cbiAgICBub2RlIGluc3RhbmNlb2YgVGhpc0xpdGVyYWwgb3JcbiAgICAgICAgKG5vZGUgaW5zdGFuY2VvZiBDb2RlIGFuZCBub2RlLmJvdW5kKSBvclxuICAgICAgICBub2RlIGluc3RhbmNlb2YgU3VwZXJDYWxsXG5cbmlzQ29tcGxleE9yQXNzaWduYWJsZSA9IChub2RlKSAtPiBub2RlLmlzQ29tcGxleCgpIG9yIG5vZGUuaXNBc3NpZ25hYmxlPygpXG5cbiMgVW5mb2xkIGEgbm9kZSdzIGNoaWxkIGlmIHNvYWssIHRoZW4gdHVjayB0aGUgbm9kZSB1bmRlciBjcmVhdGVkIGBJZmBcblxudW5mb2xkU29hayA9IChvLCBwYXJlbnQsIG5hbWUpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBpZm4gPSBwYXJlbnRbbmFtZV0udW5mb2xkU29hayBvXG4gICAgcGFyZW50W25hbWVdID0gaWZuLmJvZHlcbiAgICBpZm4uYm9keSA9IG5ldyBWYWx1ZSBwYXJlbnRcbiAgICBpZm4iXX0=
//# sourceURL=../coffee/nodes.coffee